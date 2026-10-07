"""Persona + expediente (HCE-00) — alta, lectura, edición y búsqueda. M11.3-a.

HCE-00 **siempre es editable** (no se firma, `HceDiurna` docstring): no hay
estado de flujo ni 409 por firma acá. Lo que sí hay es rastro: cada campo que
cambia deja una fila en `auditoria` (`app/services/auditoria.py`).

Transacción: sólo `flush()`; el commit lo hace el router (`app/services/__init__.py`).

**Identidad (§5.109–§5.112).** `hc_historico` es el N.º de HC institucional: lo
asigna el servidor (`max + 1`, el primero 1001) bajo un lock de la transacción, o se
acepta uno explícito ≥ 1000 y libre. La CI se **guarda canónica** (sin puntos,
guiones ni espacios). Crear un expediente deja una fila `auditoria` `tipo='carga'`.
"""
import re
import unicodedata
from collections.abc import Mapping
from typing import Any

from sqlalchemy import String, false, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, contains_eager

from app.core.constantes import HC_HISTORICO_MAX, HC_HISTORICO_MIN, MODULO_HCE_00
from app.models.identidad import Grupo, HceDiurna, Persona
from app.services.auditoria import registrar_cambios, registrar_carga
from app.services.errores import ConflictError, NotFound, ValidationFailed
from app.services.fechas import anio_actual
from app.services.texto import normalizar_opcionales, normalizar_texto

# Qué campo pertenece a qué tabla. Es también la **lista blanca** de lo que
# HCE-00 deja escribir: cualquier otra clave que llegue se ignora (los metadatos
# de origen, `activo` y `fecha_baja` no se editan por acá).
PERSONA_OBLIGATORIOS = ("nombre", "apellido", "ci")
PERSONA_OPCIONALES = ("sexo", "localidad", "referente", "telefono")
PERSONA_CAMPOS = (*PERSONA_OBLIGATORIOS, "fecha_nac", *PERSONA_OPCIONALES)
HCE_TEXTOS = ("diagnostico", "cie11", "derivacion", "medicacion", "alerta")
HCE_CAMPOS = (*HCE_TEXTOS, "hc_historico", "grupo_id", "dx_fecha", "anamnesis")

# Nombres de los UNIQUE que fija la convención de `core/database.py`, y el campo con
# el que se informa cada violación.
_UQ_CI = "uq_persona_ci"
_UQ_HC = "uq_hce_diurna_hc_historico"
_CAMPO_DE_UNIQUE = {_UQ_CI: "persona.ci", _UQ_HC: "hc_historico"}

# Clave del lock de aplicación que serializa la numeración de HC (cualquier entero
# fijo sirve; es de la base, no de la tabla).
_LOCK_HC = 5_109_001


# ── Normalización de claves ──────────────────────────────────────────────────
def clave_ci(ci: str) -> str:
    """La CI canónica: sin puntos, guiones ni espacios, «5.789.123-4» → «57891234».

    **Es lo que se guarda** (§5.110): el formato es asunto del frontend. Con una sola
    forma almacenada, el `UNIQUE` de `persona.ci` atrapa los duplicados «escritos
    distinto» y la carrera entre dos altas simultáneas.
    """
    return re.sub(r"[.\s-]", "", ci)


# Acentos y eñe → letra base, **en Python y en SQL con la misma tabla**. Así
# «sofia» encuentra «Sofía» (como hace la demo, `ui-core.js: deburr`) sin la
# extensión `unaccent`, que sería la primera del repo. Se usa `translate` y no
# NFD + borrar marcas combinantes para que los dos lados coincidan carácter a
# carácter. Mayúsculas incluidas: `lower()` de Postgres depende del locale de la
# base y no se puede confiar en que pase «Á» → «á».
_CON_ACENTO = "ÁÉÍÓÚÜÑÀÈÌÒÙÂÊÎÔÛÃÕÇáéíóúüñàèìòùâêîôûãõç"
_SIN_ACENTO = "AEIOUUNAEIOUAEIOUAOCaeiouunaeiouaeiouaoc"
assert len(_CON_ACENTO) == len(_SIN_ACENTO)
_TABLA_PLANA = str.maketrans(_CON_ACENTO, _SIN_ACENTO)


def _plano(texto: str) -> str:
    return unicodedata.normalize("NFC", texto).translate(_TABLA_PLANA).lower()


def _plano_sql(columna):
    return func.lower(func.translate(columna, _CON_ACENTO, _SIN_ACENTO, type_=String), type_=String)


# ── Lectura ──────────────────────────────────────────────────────────────────
def obtener_hce(db: Session, hce_id: int) -> HceDiurna:
    hce = db.get(HceDiurna, hce_id)
    if hce is None:
        raise NotFound(f"No existe el expediente {hce_id}")
    return hce


def buscar_hce(
    db: Session,
    *,
    ci: str | None = None,
    numero: str | None = None,
    grupo: str | None = None,
    anio: int | None = None,
    nombre: str | None = None,
) -> list[HceDiurna]:
    """Búsqueda de expedientes por las **tres vías institucionales** + nombre.

    Fuente: Documento Técnico (`docs/markdown/1_documento-tecnico-utec-lidia.md`
    línea 66) — «cédula de identidad, número de historia clínica o grupo de
    referencia (adicionalmente por nombre)»; igual en las Especificaciones del
    Prototipo v4 (línea 10). La demo las junta en un solo buscador
    (`demo/js/ui-core.js: coincideBusqueda`); acá van como filtros separados.

    - `ci`: **contiene**, ignorando puntos, guiones y espacios («5789» encuentra
      «5.789.123-4»).
    - `numero`: **igual** al N.º de historia clínica (`hc_historico`, §5.109).
      **Nunca** mira `hce_diurna.id`, que es interno. Algo que no es un entero que
      cabe en la columna no coincide con nada (lista vacía, no error).
    - `grupo`: **igual** al nombre del grupo, sin distinguir mayúsculas ni acentos,
      **en el año `anio`** (por omisión, el año en curso; §5.111). El grupo es
      `(nombre, anio)`: sin el año, «Escolares» traería a los de 2026 y a los de
      2027. `anio` **sólo califica a `grupo`**: sin `grupo` no filtra nada, para que
      buscar por CI no deje afuera a quien está en un grupo de otro año.
    - `nombre`: **contiene**, sobre «nombre apellido» o «apellido nombre», sin
      distinguir mayúsculas ni acentos.

    Varios filtros a la vez se combinan con **Y**. Un filtro vacío o en blanco se
    ignora (igual que `''` → `NULL` al guardar). Sin filtros devuelve todos.
    """
    ci, numero, grupo, nombre = (normalizar_texto(v) for v in (ci, numero, grupo, nombre))
    condiciones = []

    if ci is not None:
        clave = clave_ci(ci)
        if not clave:
            raise ValidationFailed([("ci", "Debe tener al menos un dígito o una letra")])
        condiciones.append(Persona.ci.contains(clave, autoescape=True))

    if numero is not None:
        numero = numero.strip()
        if numero.isascii() and numero.isdigit() and int(numero) <= HC_HISTORICO_MAX:
            condiciones.append(HceDiurna.hc_historico == int(numero))
        else:
            condiciones.append(false())

    if grupo is not None:
        condiciones.append(_plano_sql(Grupo.nombre) == _plano(grupo.strip()))
        condiciones.append(Grupo.anio == (anio if anio is not None else anio_actual()))

    if nombre is not None:
        q = _plano(" ".join(nombre.split()))
        condiciones.append(
            or_(
                _plano_sql(func.concat(Persona.nombre, " ", Persona.apellido, type_=String)).contains(q, autoescape=True),
                _plano_sql(func.concat(Persona.apellido, " ", Persona.nombre, type_=String)).contains(q, autoescape=True),
            )
        )

    consulta = (
        select(HceDiurna)
        .join(HceDiurna.persona)
        .outerjoin(HceDiurna.grupo)
        .options(contains_eager(HceDiurna.persona), contains_eager(HceDiurna.grupo))
        .where(*condiciones)
        .order_by(Persona.apellido, Persona.nombre, HceDiurna.id)
    )
    return list(db.scalars(consulta).all())


# ── Validación ───────────────────────────────────────────────────────────────
def _preparar_persona(datos: Mapping[str, Any], errores: list[tuple[str | None, str]], *, alta: bool) -> dict[str, Any]:
    """Deja sólo los campos de persona conocidos, normalizados, y junta los errores.

    En el alta los obligatorios tienen que estar; en la edición sólo se miran los
    que vinieron (la ausencia es «no tocar», pero `null`/en blanco es un intento
    de borrar un obligatorio y se rechaza).
    """
    d = normalizar_opcionales({c: datos[c] for c in PERSONA_CAMPOS if c in datos}, PERSONA_OPCIONALES)
    obligatorios = (*PERSONA_OBLIGATORIOS, "fecha_nac")
    for campo in obligatorios:
        if alta and campo not in d:
            errores.append((f"persona.{campo}", "Es obligatorio"))
        elif campo in d:
            valor = d[campo]
            if valor is None or (isinstance(valor, str) and not valor.strip()):
                errores.append((f"persona.{campo}", "No puede estar vacío"))
    if isinstance(d.get("ci"), str) and d["ci"].strip():
        d["ci"] = clave_ci(d["ci"])
        if not d["ci"]:
            errores.append(("persona.ci", "Debe tener al menos un dígito o una letra"))
    return d


def _preparar_hce(
    db: Session, datos: Mapping[str, Any], errores: list[tuple[str | None, str]], *, alta: bool,
) -> dict[str, Any]:
    """`hc_historico`: en el alta, ausente o `None` significa «asignale uno»; en la
    edición, la ausencia es «no tocar» y `None` es un intento de **borrarlo**, que se
    rechaza (un expediente no deja de tener N.º de HC)."""
    d = normalizar_opcionales({c: datos[c] for c in HCE_CAMPOS if c in datos}, HCE_TEXTOS)
    grupo_id = d.get("grupo_id")
    if grupo_id is not None and db.get(Grupo, grupo_id) is None:
        errores.append(("grupo_id", f"No existe el grupo {grupo_id}"))
    if "hc_historico" in d:
        hc = d["hc_historico"]
        if hc is None:
            if alta:
                del d["hc_historico"]
            else:
                errores.append(("hc_historico", "No se puede borrar el N.º de historia clínica"))
        elif isinstance(hc, bool) or not isinstance(hc, int):
            errores.append(("hc_historico", "Debe ser un número entero"))
        elif not HC_HISTORICO_MIN <= hc <= HC_HISTORICO_MAX:
            errores.append((
                "hc_historico",
                f"Debe ser un número entero desde {HC_HISTORICO_MIN} hasta {HC_HISTORICO_MAX}",
            ))
    return d


# ── N.º de historia clínica ──────────────────────────────────────────────────
def _bloquear_numeracion(db: Session) -> None:
    """Toma el lock de la numeración **hasta el final de la transacción**.

    Sin él, dos altas simultáneas leen el mismo `max` y se asignan el mismo número
    (o una asigna el que la otra está por escribir a mano). Con él, la segunda
    espera a que la primera confirme y recién ahí lee el `max`. El `UNIQUE` sigue
    siendo la última defensa (se traduce a 409 en `_flush_traduciendo`). Es un lock
    de aplicación, no de tabla: no bloquea lecturas ni escrituras que no numeren.
    """
    db.execute(select(func.pg_advisory_xact_lock(_LOCK_HC)))


def _siguiente_hc(db: Session) -> int:
    """`max(hc_historico) + 1`, y 1001 si no hay ninguno. Llamar con el lock tomado."""
    maximo = db.scalar(select(func.max(HceDiurna.hc_historico)))
    siguiente = max(maximo or 0, HC_HISTORICO_MIN) + 1
    if siguiente > HC_HISTORICO_MAX:  # sólo alcanzable cargando a mano un número en el tope
        raise ConflictError(
            "No hay un N.º de historia clínica siguiente disponible",
            [("hc_historico", "La numeración llegó al máximo: indicá un N.º libre")],
        )
    return siguiente


def _exigir_hc_libre(db: Session, hc: int, *, excepto_id: int | None = None) -> None:
    consulta = select(HceDiurna.id).where(HceDiurna.hc_historico == hc)
    if excepto_id is not None:
        consulta = consulta.where(HceDiurna.id != excepto_id)
    if db.scalars(consulta).first() is not None:
        raise ConflictError(
            f"Ya existe un expediente con el N.º de historia clínica {hc}",
            [("hc_historico", "Ya existe un expediente con ese N.º de historia clínica")],
        )


def _persona_con_ci(db: Session, ci: str, *, excepto_id: int | None = None) -> Persona | None:
    consulta = select(Persona).where(Persona.ci == clave_ci(ci))
    if excepto_id is not None:
        consulta = consulta.where(Persona.id != excepto_id)
    return db.scalars(consulta).first()


def _exigir_ci_libre(db: Session, ci: str, *, excepto_id: int | None = None) -> None:
    if _persona_con_ci(db, ci, excepto_id=excepto_id) is not None:
        raise ConflictError(
            f"Ya existe una persona con la cédula {ci}",
            [("persona.ci", "Ya existe una persona con esa cédula")],
        )


def _flush_traduciendo(db: Session) -> None:
    """`flush()` que convierte la violación de `uq_persona_ci` o de
    `uq_hce_diurna_hc_historico` en un 409.

    Las verificaciones previas (`_exigir_ci_libre`, `_exigir_hc_libre`) cubren el
    caso normal; esto cubre la carrera: dos altas simultáneas con la misma CI pasan
    las dos la verificación y la segunda choca con el `UNIQUE` al escribir (o una
    carga que no pasó por el servicio y tomó el número). Sin esta traducción, el
    cliente recibiría un 500 con el `IntegrityError` adentro.
    """
    try:
        db.flush()
    except IntegrityError as exc:
        diag = getattr(exc.orig, "diag", None)
        campo = _CAMPO_DE_UNIQUE.get(getattr(diag, "constraint_name", None))
        if campo is not None:
            mensaje = (
                "Ya existe una persona con esa cédula" if campo == "persona.ci"
                else "Ya existe un expediente con ese N.º de historia clínica"
            )
            raise ConflictError(mensaje, [(campo, mensaje)]) from exc
        raise


# ── Escritura ────────────────────────────────────────────────────────────────
def crear_hce(
    db: Session,
    *,
    persona: Mapping[str, Any],
    hce: Mapping[str, Any],
    usuario_id: int | None = None,
) -> HceDiurna:
    """Alta de persona + expediente en la misma transacción.

    - 422 si falta o está en blanco un obligatorio, el `grupo_id` no existe o el
      `hc_historico` explícito es < 1000.
    - 409 si la CI ya existe (en cualquier formato de escritura) o el
      `hc_historico` explícito ya lo tiene otro expediente.
    - Sin `hc_historico`, el servidor asigna `max + 1` (1001 el primero), bajo un
      lock que dura toda la transacción.
    - Escribe **una** fila `auditoria` `tipo='carga'` (§5.112).
    """
    errores: list[tuple[str | None, str]] = []
    p = _preparar_persona(persona, errores, alta=True)
    h = _preparar_hce(db, hce, errores, alta=True)
    if errores:
        raise ValidationFailed(errores)
    _exigir_ci_libre(db, p["ci"])

    _bloquear_numeracion(db)
    if "hc_historico" in h:
        _exigir_hc_libre(db, h["hc_historico"])
    else:
        h["hc_historico"] = _siguiente_hc(db)

    nueva = Persona(**p)
    expediente = HceDiurna(persona=nueva, **h)
    db.add(nueva)
    db.add(expediente)
    _flush_traduciendo(db)
    registrar_carga(
        db, modulo=MODULO_HCE_00, hce_id=expediente.id, usuario_id=usuario_id,
        detalle=f"Alta del expediente {expediente.id} (N.º de HC {expediente.hc_historico})",
    )
    db.refresh(expediente)
    return expediente


def actualizar_hce_00(
    db: Session,
    hce_id: int,
    *,
    persona: Mapping[str, Any] | None = None,
    hce: Mapping[str, Any] | None = None,
    usuario_id: int | None = None,
) -> HceDiurna:
    """Edición parcial de HCE-00: sólo las claves presentes. Audita campo por campo.

    Sin cambios reales (los valores son iguales a los guardados) no escribe
    ninguna fila de `auditoria` ni toca `actualizado_en`.
    """
    expediente = obtener_hce(db, hce_id)
    quien = expediente.persona

    errores: list[tuple[str | None, str]] = []
    cambios_p = _preparar_persona(persona or {}, errores, alta=False)
    cambios_h = _preparar_hce(db, hce or {}, errores, alta=False)
    if errores:
        raise ValidationFailed(errores)
    if "ci" in cambios_p and cambios_p["ci"] != quien.ci:
        _exigir_ci_libre(db, cambios_p["ci"], excepto_id=quien.id)
    if "hc_historico" in cambios_h and cambios_h["hc_historico"] != expediente.hc_historico:
        _bloquear_numeracion(db)
        _exigir_hc_libre(db, cambios_h["hc_historico"], excepto_id=expediente.id)

    antes_p = {c: getattr(quien, c) for c in cambios_p}
    antes_h = {c: getattr(expediente, c) for c in cambios_h}
    for campo, valor in cambios_p.items():
        setattr(quien, campo, valor)
    for campo, valor in cambios_h.items():
        setattr(expediente, campo, valor)
    _flush_traduciendo(db)

    filas = registrar_cambios(
        db, modulo=MODULO_HCE_00, hce_id=expediente.id,
        antes=antes_p, despues=cambios_p, usuario_id=usuario_id,
    ) + registrar_cambios(
        db, modulo=MODULO_HCE_00, hce_id=expediente.id,
        antes=antes_h, despues=cambios_h, usuario_id=usuario_id,
    )
    if filas:
        # Un cambio en la persona no emite UPDATE sobre `hce_diurna`, así que el
        # `onupdate` de la columna no se dispara: se marca a mano.
        expediente.actualizado_en = func.now()
        db.flush()
    db.refresh(expediente)
    return expediente
