"""Persona + expediente (HCE-00) — alta, lectura, edición y búsqueda. M11.3-a.

HCE-00 **siempre es editable** (no se firma, `HceDiurna` docstring): no hay
estado de flujo ni 409 por firma acá. Lo que sí hay es rastro: cada campo que
cambia deja una fila en `auditoria` (`app/services/auditoria.py`).

Transacción: sólo `flush()`; el commit lo hace el router (`app/services/__init__.py`).
"""
import re
import unicodedata
from collections.abc import Mapping
from typing import Any

from sqlalchemy import String, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, contains_eager

from app.core.constantes import MODULO_HCE_00
from app.models.identidad import Grupo, HceDiurna, Persona
from app.services.auditoria import registrar_cambios
from app.services.errores import ConflictError, NotFound, ValidationFailed
from app.services.texto import normalizar_opcionales, normalizar_texto

# Qué campo pertenece a qué tabla. Es también la **lista blanca** de lo que
# HCE-00 deja escribir: cualquier otra clave que llegue se ignora (los metadatos
# de origen, `activo` y `fecha_baja` no se editan por acá).
PERSONA_OBLIGATORIOS = ("nombre", "apellido", "ci")
PERSONA_OPCIONALES = ("sexo", "localidad", "referente", "telefono")
PERSONA_CAMPOS = (*PERSONA_OBLIGATORIOS, "fecha_nac", *PERSONA_OPCIONALES)
HCE_TEXTOS = ("hc_historico", "diagnostico", "cie11", "derivacion", "medicacion", "alerta")
HCE_CAMPOS = (*HCE_TEXTOS, "grupo_id", "dx_fecha", "anamnesis")

# `uq_persona_ci`: nombre que fija la convención de `core/database.py`.
_UQ_CI = "uq_persona_ci"


# ── Normalización de claves ──────────────────────────────────────────────────
def clave_ci(ci: str) -> str:
    """La CI sin puntos, guiones ni espacios: «5.789.123-4» → «57891234».

    Se guarda **tal cual se escribió**; esto es sólo para **comparar**. Sin ella,
    «5.789.123-4» y «57891234» pasan el `UNIQUE` de la base como si fueran dos
    personas.
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


def _ci_plana_sql():
    """`persona.ci` sin puntos, guiones ni espacios (la comparación; no se guarda así)."""
    return func.regexp_replace(Persona.ci, "[.[:space:]-]", "", "g", type_=String)


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
    - `numero`: **igual** al N.º de expediente (`hce_diurna.id`) **o** al N.º de
      historia anterior (`hc_historico`).
    - `grupo`: **igual** al nombre del grupo, sin distinguir mayúsculas ni acentos
      (de cualquier año: el grupo es `(nombre, anio)`).
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
        condiciones.append(
            _ci_plana_sql().contains(clave, autoescape=True)
        )

    if numero is not None:
        numero = numero.strip()
        alternativas = [HceDiurna.hc_historico == numero]
        if numero.isascii() and numero.isdigit() and len(numero) <= 9:  # cabe en un int4
            alternativas.append(HceDiurna.id == int(numero))
        condiciones.append(or_(*alternativas))

    if grupo is not None:
        condiciones.append(_plano_sql(Grupo.nombre) == _plano(grupo.strip()))

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
    return d


def _preparar_hce(db: Session, datos: Mapping[str, Any], errores: list[tuple[str | None, str]]) -> dict[str, Any]:
    d = normalizar_opcionales({c: datos[c] for c in HCE_CAMPOS if c in datos}, HCE_TEXTOS)
    grupo_id = d.get("grupo_id")
    if grupo_id is not None and db.get(Grupo, grupo_id) is None:
        errores.append(("grupo_id", f"No existe el grupo {grupo_id}"))
    return d


def _persona_con_ci(db: Session, ci: str, *, excepto_id: int | None = None) -> Persona | None:
    consulta = select(Persona).where(_ci_plana_sql() == clave_ci(ci))
    if excepto_id is not None:
        consulta = consulta.where(Persona.id != excepto_id)
    return db.scalars(consulta).first()


def _exigir_ci_libre(db: Session, ci: str, *, excepto_id: int | None = None) -> None:
    if _persona_con_ci(db, ci, excepto_id=excepto_id) is not None:
        raise ConflictError(
            f"Ya existe una persona con la cédula {ci}",
            [("persona.ci", "Ya existe una persona con esa cédula")],
        )


def _flush_traduciendo_ci(db: Session) -> None:
    """`flush()` que convierte la violación de `uq_persona_ci` en un 409.

    La verificación previa (`_exigir_ci_libre`) cubre el caso normal; esto cubre la
    carrera: dos altas simultáneas con la misma CI pasan las dos la verificación y
    la segunda choca con el `UNIQUE` al escribir. Sin esta traducción, el cliente
    recibiría un 500 con el `IntegrityError` adentro.
    """
    try:
        db.flush()
    except IntegrityError as exc:
        diag = getattr(exc.orig, "diag", None)
        if getattr(diag, "constraint_name", None) == _UQ_CI:
            raise ConflictError(
                "Ya existe una persona con esa cédula",
                [("persona.ci", "Ya existe una persona con esa cédula")],
            ) from exc
        raise


# ── Escritura ────────────────────────────────────────────────────────────────
def crear_hce(
    db: Session,
    *,
    persona: Mapping[str, Any],
    hce: Mapping[str, Any],
) -> HceDiurna:
    """Alta de persona + expediente en la misma transacción.

    422 si falta o está en blanco un obligatorio o el `grupo_id` no existe; 409 si
    la CI ya existe. **No escribe `auditoria`**: ningún documento define el `tipo`
    de un evento de creación (el CHECK admite `carga`, pero no está documentado
    para esto) — punto abierto, ver el informe de M11.3-a.
    """
    errores: list[tuple[str | None, str]] = []
    p = _preparar_persona(persona, errores, alta=True)
    h = _preparar_hce(db, hce, errores)
    if errores:
        raise ValidationFailed(errores)
    _exigir_ci_libre(db, p["ci"])

    nueva = Persona(**p)
    expediente = HceDiurna(persona=nueva, **h)
    db.add(nueva)
    db.add(expediente)
    _flush_traduciendo_ci(db)
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
    cambios_h = _preparar_hce(db, hce or {}, errores)
    if errores:
        raise ValidationFailed(errores)
    if "ci" in cambios_p and clave_ci(cambios_p["ci"]) != clave_ci(quien.ci):
        _exigir_ci_libre(db, cambios_p["ci"], excepto_id=quien.id)

    antes_p = {c: getattr(quien, c) for c in cambios_p}
    antes_h = {c: getattr(expediente, c) for c in cambios_h}
    for campo, valor in cambios_p.items():
        setattr(quien, campo, valor)
    for campo, valor in cambios_h.items():
        setattr(expediente, campo, valor)
    _flush_traduciendo_ci(db)

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
