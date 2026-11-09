"""Ateneos clínicos, de grupo, institucionales y jornadas de capacitación — C6 (`handoff.md` §5.158).

Tablas: `ateneo` y `ateneo_acuerdo` (`app/models/ateneo.py`, M12.7; sus docstrings son la fuente de las reglas) y
`documento` con `ateneo_id` (§5.25). El archivo lo guarda `app/services/archivos.py` (dueño `ateneo`).

## Reglas que implementa

- **Visibilidad (§5.158 a).** Institucional, de grupo y jornada: de acceso general (§5.58, respuestas de IPPU del
  2026-10-05 A4): todo usuario los lee y los escribe. **Clínico** (`sensible`): el admin y los técnicos cuyo alcance
  incluye el expediente referido (Protocolo §6.1: equipo tratante + dirección). Los participantes **no** dan acceso
  todavía (`participantes` es prosa, `puntos-a-validar.md` §2.16 ítem 4). Un clínico fuera del alcance se comporta
  como inexistente: 404 con el mismo mensaje, ausente de las listas y de sus totales. Escribir = leer.
- **Correlativo (§5.158 b).** `anio_correlativo` = `fechas.hoy().year` al crear (año de **registración**, congelado);
  `numero` = `max(numero) + 1` de ese año bajo `pg_advisory_xact_lock(ATENEO_CANDADO_CORRELATIVO, año)`: sin
  secuencia (un rollback no deja huecos) y sin DELETE (no se reusa). Ninguno de los dos viene en un cuerpo; el
  número 1000 es 422, nunca un 500.
- **Forma por tipo (§5.158 c)**, sobre el estado **final** de cada POST y PATCH, como 422 por campo (nunca el
  `IntegrityError` del CHECK): `hce_referida_id` obligatorio si y sólo si `tipo = clinico`; `grupo_id` obligatorio
  en `grupo` y permitido sólo en `clinico` (contexto) y `grupo`; los campos de jornada sólo en `jornada`; los del
  desarrollo clínico nunca en `jornada`; una jornada con acuerdos → 422 (`acuerdos` en el POST, `tipo` en el PATCH
  que la vuelve jornada). Un `hce_referida_id` que el usuario no ve → el mismo 422 que uno que no existe. `fecha`
  fuera del año del grupo → **aviso**, nunca bloqueo (esquema §4).
- **Acuerdos (§5.158 d).** Viajan en el POST del ateneo (el registro nace completo, esquema §4 «las 4
  consecuencias de UI»); después, `POST /ateneos/{id}/acuerdos` y `PATCH …/{aid}`. Sin DELETE de acuerdos ni de
  ateneos (es un libro de actas).
- **Textos (§5.158 e).** `titulo` y `acuerdo` no en blanco (Unicode incluido); todo texto opcional `''`/blanco →
  NULL (`services/texto.py`); los largos son los del modelo (422 por campo, en el schema).
- **Auditoría (§5.158 f).** `MODULO_ATENEO`, `hce_id` NULL; una fila `carga` por POST (ateneo, acuerdo o documento)
  con `detalle` «Ateneo AT-2026-003…» (el código visible: ni el título, ni el contenido, ni el id interno); una fila
  `edicion` por campo que cambió en cada PATCH (acuerdos incluidos).
- **Indicador (§5.158 g).** Por `fecha` (§5.74): el total suma clínicos, de grupo e institucionales
  (`ATENEO_TIPOS_INDICADOR`); por grupo, los que tienen ese `grupo_id`, para los grupos de ese año. Cuenta **todos**
  los ateneos, los vea o no el usuario: es un agregado sin contenido.
- **Documentos (§5.158 h–i).** Las reglas de C5 (§5.155): ≤ 10 MB, tipo por el contenido (acá también PPTX), sin
  DELETE; la categoría es del mismo catálogo pero **no histórica** (las históricas son de registros del expediente).
"""
from __future__ import annotations

from collections.abc import Mapping
from datetime import date
from typing import Any, BinaryIO

from sqlalchemy import and_, func, or_, select, text
from sqlalchemy.orm import Session, aliased

from app.core.constantes import (
    ATENEO_CANDADO_CORRELATIVO, ATENEO_DOCUMENTO_TIPOS, ATENEO_META_POR_GRUPO, ATENEO_META_TOTAL,
    ATENEO_TIPOS, ATENEO_TIPOS_INDICADOR, MODULO_ATENEO, ROL_TECNICO,
)
from app.models.ateneo import CAMPOS_DESARROLLO_CLINICO, CAMPOS_JORNADA, TIPO_SENSIBLE, Ateneo, AteneoAcuerdo
from app.models.identidad import Grupo, HceDiurna, Persona, Profesional
from app.models.transversales import Documento
from app.services import archivos, auth, fechas
from app.services import documentos as servicio_documentos
from app.services.auditoria import registrar_cambios, registrar_carga
from app.services.errores import NotFound, ValidationFailed
from app.services.texto import normalizar_texto

#: Los textos opcionales del ateneo (se guardan NULL si vienen vacíos o en blanco).
TEXTOS_OPCIONALES = ("participantes", "observaciones", *CAMPOS_DESARROLLO_CLINICO, *CAMPOS_JORNADA)
#: Lo que un POST o un PATCH del ateneo puede traer (los acuerdos van aparte).
CAMPOS = ("tipo", "fecha", "titulo", "hce_referida_id", "grupo_id", *TEXTOS_OPCIONALES)
CAMPOS_ACUERDO = ("acuerdo", "responsable_rol", "plazo")
NUMERO_MAXIMO = 999
#: `code` del aviso cuando la fecha cae en otro año que el del grupo (no bloquea).
AVISO_FECHA_Y_GRUPO = "fecha_y_anio_del_grupo"

_NO_EXISTE = "No existe el ateneo"
_NNA_NO_EXISTE = "No existe el expediente elegido."
_GRUPO_NO_EXISTE = "No existe el grupo elegido."


# ── Opciones ─────────────────────────────────────────────────────────────────
def opciones() -> dict[str, Any]:
    return {
        "tipos": [{"clave": k, "label": v} for k, v in ATENEO_TIPOS.items()],
        "tipo_sensible": TIPO_SENSIBLE,
        "campos_jornada": list(CAMPOS_JORNADA),
        "campos_desarrollo_clinico": list(CAMPOS_DESARROLLO_CLINICO),
        "metas": {"total": ATENEO_META_TOTAL, "por_grupo": ATENEO_META_POR_GRUPO},
        "tipos_indicador": list(ATENEO_TIPOS_INDICADOR),
    }


# ── Visibilidad ──────────────────────────────────────────────────────────────
def _hces_del_tecnico(usuario: Profesional):
    """Los `hce_diurna.id` que un técnico ve (su grupo actual lo tiene como técnico 1 o 2), como subconsulta."""
    return (
        select(HceDiurna.id).join(Grupo, Grupo.id == HceDiurna.grupo_id)
        .where(or_(Grupo.tecnico1_id == usuario.id, Grupo.tecnico2_id == usuario.id))
    )


def condicion_visible(usuario: Profesional):
    """`None` para el admin; si no, «no es clínico, o su expediente está en el alcance del técnico»."""
    if auth.es_admin(usuario):
        return None
    if usuario.rol != ROL_TECNICO:
        return Ateneo.tipo != TIPO_SENSIBLE
    return or_(Ateneo.tipo != TIPO_SENSIBLE, Ateneo.hce_referida_id.in_(_hces_del_tecnico(usuario)))


def puede_ver(db: Session, usuario: Profesional, ateneo: Ateneo) -> bool:
    if ateneo.tipo != TIPO_SENSIBLE:
        return True
    hce = db.get(HceDiurna, ateneo.hce_referida_id) if ateneo.hce_referida_id is not None else None
    return auth.es_admin(usuario) or (hce is not None and auth.puede_ver(usuario, hce))


def obtener(db: Session, usuario: Profesional, ateneo_id: int, *, para_escribir: bool = False) -> Ateneo:
    """El ateneo, o **404** si no existe o es un clínico fuera del alcance (el mismo mensaje)."""
    consulta = select(Ateneo).where(Ateneo.id == ateneo_id)
    if para_escribir:
        consulta = consulta.with_for_update()
    ateneo = db.scalar(consulta)
    if ateneo is None or not puede_ver(db, usuario, ateneo):
        raise NotFound(_NO_EXISTE)
    return ateneo


def exigir_visible(db: Session, usuario: Profesional, ateneo_id: int) -> None:
    """Para la dependencia de las rutas `/ateneos/{ateneo_id}/…`: lee sólo `tipo` y `hce_referida_id`."""
    fila = db.execute(select(Ateneo.tipo, Ateneo.hce_referida_id).where(Ateneo.id == ateneo_id)).first()
    if fila is None:
        raise NotFound(_NO_EXISTE)
    tipo, hce_id = fila
    if tipo == TIPO_SENSIBLE and not auth.es_admin(usuario):
        hce = db.get(HceDiurna, hce_id) if hce_id is not None else None
        if hce is None or not auth.puede_ver(usuario, hce):
            raise NotFound(_NO_EXISTE)


# ── Vistas ───────────────────────────────────────────────────────────────────
def _grupo(g: Grupo | None) -> dict | None:
    return {"id": g.id, "nombre": g.nombre, "anio": g.anio} if g is not None else None


def _nna(hce: HceDiurna | None, persona: Persona | None) -> dict | None:
    if hce is None or persona is None:
        return None
    return {"hce_id": hce.id, "hc_historico": hce.hc_historico, "nombre": persona.nombre, "apellido": persona.apellido}


def vista_acuerdo(a: AteneoAcuerdo) -> dict[str, Any]:
    return {"id": a.id, "acuerdo": a.acuerdo, "responsable_rol": a.responsable_rol, "plazo": a.plazo, "orden": a.orden}


def vista(db: Session, ateneo: Ateneo) -> dict[str, Any]:
    """El ateneo completo: todas sus columnas, los derivados (`codigo`, `sensible`), autor, grupo, NNA y acuerdos."""
    hce = db.get(HceDiurna, ateneo.hce_referida_id) if ateneo.hce_referida_id is not None else None
    grupo = db.get(Grupo, ateneo.grupo_id) if ateneo.grupo_id is not None else None
    autor = db.get(Profesional, ateneo.autor_id) if ateneo.autor_id is not None else None
    acuerdos = db.scalars(
        select(AteneoAcuerdo).where(AteneoAcuerdo.ateneo_id == ateneo.id).order_by(AteneoAcuerdo.orden, AteneoAcuerdo.id)
    )
    documentos = db.scalar(select(func.count()).select_from(Documento).where(Documento.ateneo_id == ateneo.id))
    return {
        "id": ateneo.id, "codigo": ateneo.codigo, "anio_correlativo": ateneo.anio_correlativo, "numero": ateneo.numero,
        "tipo": ateneo.tipo, "tipo_label": ATENEO_TIPOS.get(ateneo.tipo, ateneo.tipo), "sensible": ateneo.sensible,
        "fecha": ateneo.fecha, "titulo": ateneo.titulo,
        "hce_referida_id": ateneo.hce_referida_id, "grupo_id": ateneo.grupo_id,
        "nna": _nna(hce, hce.persona if hce is not None else None), "grupo": _grupo(grupo),
        "autor": {"id": autor.id, "nombre": autor.nombre} if autor is not None else None,
        **{c: getattr(ateneo, c) for c in TEXTOS_OPCIONALES},
        "acuerdos": [vista_acuerdo(a) for a in acuerdos],
        "documentos": documentos or 0,
    }


# ── Lista ────────────────────────────────────────────────────────────────────
def _rango_del_anio(anio: int):
    return and_(Ateneo.fecha >= date(anio, 1, 1), Ateneo.fecha <= date(anio, 12, 31))


def listar(
    db: Session, *, usuario: Profesional, anio: int | None = None, tipo: str | None = None,
    grupo_id: int | None = None, hce_referida_id: int | None = None, q: str | None = None, limit: int, offset: int,
) -> tuple[list[dict[str, Any]], int]:
    """Los ateneos que el usuario ve, **la `fecha` más nueva primero** (después `id` descendente), con el total.
    Siempre las mismas consultas (el total y la página, con grupo, NNA y las dos cantidades en la misma)."""
    tipo = normalizar_texto(tipo)
    if tipo is not None and tipo not in ATENEO_TIPOS:
        raise ValidationFailed([("tipo", f"Debe ser uno de: {', '.join(ATENEO_TIPOS)}")])
    condiciones = []
    if (visible := condicion_visible(usuario)) is not None:
        condiciones.append(visible)
    if anio is not None:
        condiciones.append(_rango_del_anio(anio))
    if tipo is not None:
        condiciones.append(Ateneo.tipo == tipo)
    if grupo_id is not None:
        condiciones.append(Ateneo.grupo_id == grupo_id)
    if hce_referida_id is not None:
        condiciones.append(Ateneo.hce_referida_id == hce_referida_id)
    if (q := normalizar_texto(q)) is not None:
        q = q.strip()   # subcadena sin mayúsculas (`lower(x) LIKE lower(y)`), con `%` y `_` escapados (como la búsqueda de /hce)
        condiciones.append(or_(*(c.icontains(q, autoescape=True) for c in (Ateneo.titulo, Ateneo.situacion, Ateneo.contenidos))))
    total = db.scalar(select(func.count()).select_from(Ateneo).where(*condiciones))
    n_acuerdos = (
        select(func.count()).select_from(AteneoAcuerdo).where(AteneoAcuerdo.ateneo_id == Ateneo.id)
        .correlate(Ateneo).scalar_subquery()
    )
    n_documentos = (
        select(func.count()).select_from(Documento).where(Documento.ateneo_id == Ateneo.id)
        .correlate(Ateneo).scalar_subquery()
    )
    grupo = aliased(Grupo)
    filas = db.execute(
        select(Ateneo, grupo, HceDiurna, Persona, n_acuerdos.label("acuerdos"), n_documentos.label("documentos"))
        .outerjoin(grupo, grupo.id == Ateneo.grupo_id)
        .outerjoin(HceDiurna, HceDiurna.id == Ateneo.hce_referida_id)
        .outerjoin(Persona, Persona.id == HceDiurna.persona_id)
        .where(*condiciones)
        .order_by(Ateneo.fecha.desc(), Ateneo.id.desc())
        .limit(limit).offset(offset)
    ).all()
    return [
        {
            "id": a.id, "codigo": a.codigo, "tipo": a.tipo, "tipo_label": ATENEO_TIPOS.get(a.tipo, a.tipo),
            "fecha": a.fecha, "titulo": a.titulo, "sensible": a.sensible,
            "grupo": _grupo(g), "nna": _nna(h, p), "acuerdos": na or 0, "documentos": nd or 0,
        }
        for a, g, h, p, na, nd in filas
    ], total


# ── Indicador ────────────────────────────────────────────────────────────────
def indicador(db: Session, anio: int | None = None) -> dict[str, Any]:
    """8 al año y al menos 2 por grupo, **por `fecha`** (§5.74). Cuenta todos los ateneos (un agregado sin contenido).
    Dos consultas: el total y los grupos del año con su cantidad."""
    anio = anio if anio is not None else fechas.anio_actual()
    en_el_anio = _rango_del_anio(anio)
    total = db.scalar(
        select(func.count()).select_from(Ateneo).where(en_el_anio, Ateneo.tipo.in_(ATENEO_TIPOS_INDICADOR))
    )
    cantidad = (
        select(func.count()).select_from(Ateneo).where(Ateneo.grupo_id == Grupo.id, en_el_anio)
        .correlate(Grupo).scalar_subquery()
    )
    grupos = db.execute(
        select(Grupo.id, Grupo.nombre, Grupo.anio, cantidad.label("cantidad"))
        .where(Grupo.anio == anio).order_by(Grupo.nombre, Grupo.id)
    ).all()
    return {
        "anio": anio, "meta_total": ATENEO_META_TOTAL, "total": total or 0, "meta_por_grupo": ATENEO_META_POR_GRUPO,
        "tipos_contados": list(ATENEO_TIPOS_INDICADOR),
        "grupos": [{"id": i, "nombre": n, "anio": a, "cantidad": c or 0} for i, n, a, c in grupos],
    }


# ── Validación ───────────────────────────────────────────────────────────────
def _preparar(datos: Mapping[str, Any]) -> dict[str, Any]:
    """Sólo las claves conocidas presentes; los textos opcionales `''`/blanco → `None`; `titulo` en blanco → `None`."""
    d = {c: datos[c] for c in CAMPOS if c in datos}
    for campo in (*TEXTOS_OPCIONALES, "titulo", "tipo"):
        if campo in d and (d[campo] is None or isinstance(d[campo], str)):
            d[campo] = normalizar_texto(d[campo])
    return d


def _con_texto(valor: Any) -> bool:
    return isinstance(valor, str) and normalizar_texto(valor) is not None


def _validar_forma(
    db: Session, usuario: Profesional, final: Mapping[str, Any], presentes: set[str], errores: list,
) -> None:
    """Las reglas de §5.158 c sobre el estado **final**. `presentes`: lo que vino en el cuerpo (para no culpar a un campo
    que no se tocó cuando el problema lo creó otro)."""
    tipo = final.get("tipo")
    for obligatorio, mensaje in (("tipo", "Es obligatorio: elegí el tipo de registro."),
                                 ("fecha", "Es obligatoria: indicá cuándo fue."),
                                 ("titulo", "Es obligatorio: escribí el título o tema.")):
        if final.get(obligatorio) is None:
            errores.append((obligatorio, mensaje))
    if tipo is not None and tipo not in ATENEO_TIPOS:
        errores.append(("tipo", f"Debe ser uno de: {', '.join(ATENEO_TIPOS)}"))
        return
    if tipo is None:
        return
    clinico, jornada = tipo == "clinico", tipo == "jornada"
    hce_id, grupo_id = final.get("hce_referida_id"), final.get("grupo_id")
    if clinico and hce_id is None:
        errores.append(("hce_referida_id", "Es obligatorio en un ateneo clínico: elegí el NNA."))
    if not clinico and hce_id is not None:
        errores.append(("hce_referida_id", "Sólo un ateneo clínico se refiere a un NNA: quitá el NNA o cambiá el tipo."))
    if tipo == "grupo" and grupo_id is None:
        errores.append(("grupo_id", "Es obligatorio en un ateneo de grupo: elegí el grupo."))
    if tipo not in ("clinico", "grupo") and grupo_id is not None:
        errores.append(("grupo_id", "Sólo un ateneo clínico o de grupo lleva grupo: quitá el grupo o cambiá el tipo."))
    if not jornada:
        for campo in CAMPOS_JORNADA:
            if _con_texto(final.get(campo)):
                errores.append((campo, "Es un campo de la jornada de capacitación: no va en un ateneo."))
    else:
        for campo in CAMPOS_DESARROLLO_CLINICO:
            if _con_texto(final.get(campo)):
                errores.append((campo, "Es un campo del desarrollo clínico: no va en una jornada de capacitación."))
    # Las referencias: que existan (y el NNA, que el usuario lo vea). El mismo mensaje para ajeno e inexistente.
    if "hce_referida_id" in presentes and hce_id is not None:
        hce = db.get(HceDiurna, hce_id) if isinstance(hce_id, int) else None
        if hce is None or not auth.puede_ver(usuario, hce):
            errores.append(("hce_referida_id", _NNA_NO_EXISTE))
    if "grupo_id" in presentes and grupo_id is not None:
        if not isinstance(grupo_id, int) or db.get(Grupo, grupo_id) is None:
            errores.append(("grupo_id", _GRUPO_NO_EXISTE))


def _avisos(db: Session, final: Mapping[str, Any]) -> list[dict[str, Any]]:
    """`fecha` en otro año que el del grupo: se avisa, no se bloquea (esquema §4: el ateneo de febrero que revisa el
    ciclo del grupo del año anterior es legítimo)."""
    grupo = db.get(Grupo, final["grupo_id"]) if final.get("grupo_id") is not None else None
    fecha = final.get("fecha")
    if grupo is None or fecha is None or fecha.year == grupo.anio:
        return []
    return [{
        "code": AVISO_FECHA_Y_GRUPO, "campo": "fecha",
        "mensaje": f"La fecha es de {fecha.year} y el grupo es {grupo.nombre} {grupo.anio}: se guarda igual (por ejemplo, un "
                   f"ateneo que revisa el ciclo de un año anterior).",
    }]


def _preparar_acuerdo(datos: Mapping[str, Any], prefijo: str, errores: list, *, alta: bool) -> dict[str, Any]:
    d = {c: datos[c] for c in CAMPOS_ACUERDO if c in datos}
    if "acuerdo" in d or alta:
        d["acuerdo"] = normalizar_texto(d.get("acuerdo"))
        if d["acuerdo"] is None:
            errores.append((f"{prefijo}acuerdo", "Es obligatorio: un acuerdo sin texto no es un acuerdo."))
    if "responsable_rol" in d:
        d["responsable_rol"] = normalizar_texto(d["responsable_rol"])
    return d


def _detalle(ateneo: Ateneo, sufijo: str = "") -> str:
    """El `detalle` de la auditoría: el código visible y, si hace falta, qué parte — nunca el título ni el contenido."""
    return f"Ateneo {ateneo.codigo}" + (f" · {sufijo}" if sufijo else "")


# ── Correlativo ──────────────────────────────────────────────────────────────
def _bloquear_correlativo(db: Session, anio: int) -> None:
    """Candado de **transacción** por año: dos altas del mismo año se esperan; se suelta en el COMMIT o el ROLLBACK."""
    db.execute(text("SELECT pg_advisory_xact_lock(:clave, :anio)"), {"clave": ATENEO_CANDADO_CORRELATIVO, "anio": anio})


def _siguiente_numero(db: Session, anio: int) -> int:
    ultimo = db.scalar(select(func.max(Ateneo.numero)).where(Ateneo.anio_correlativo == anio))
    return (ultimo or 0) + 1


# ── Alta y edición del ateneo ────────────────────────────────────────────────
def crear(db: Session, datos: Mapping[str, Any], *, usuario: Profesional) -> tuple[Ateneo, list[dict]]:
    """Alta **completa** en un POST: el ateneo y sus acuerdos. 422 por campo; el correlativo lo pone el servidor."""
    d = _preparar(datos)
    errores: list[tuple[str | None, str]] = []
    _validar_forma(db, usuario, d, set(d), errores)
    acuerdos = []
    for i, crudo in enumerate(datos.get("acuerdos") or []):
        acuerdos.append(_preparar_acuerdo(crudo, f"acuerdos.{i}.", errores, alta=True))
    if d.get("tipo") == "jornada" and acuerdos:
        errores.append(("acuerdos", "Una jornada de capacitación no lleva acuerdos: quitalos o cambiá el tipo."))
    if errores:
        raise ValidationFailed(errores)
    anio = fechas.hoy().year
    _bloquear_correlativo(db, anio)
    numero = _siguiente_numero(db, anio)
    if numero > NUMERO_MAXIMO:
        raise ValidationFailed([(None, f"Ya hay {NUMERO_MAXIMO} registros de {anio}: el correlativo de tres cifras no admite más.")])
    ateneo = Ateneo(anio_correlativo=anio, numero=numero, autor_id=usuario.id, **d)
    db.add(ateneo)
    db.flush()
    for orden, a in enumerate(acuerdos):
        db.add(AteneoAcuerdo(ateneo_id=ateneo.id, orden=orden, **a))
    db.flush()
    db.refresh(ateneo)
    registrar_carga(db, modulo=MODULO_ATENEO, hce_id=None, usuario_id=usuario.id, detalle=_detalle(ateneo))
    return ateneo, _avisos(db, d)


def _legible(db: Session, campo: str, valor: Any) -> Any:
    """Cómo se audita una referencia: el grupo por nombre y año; el NNA por su N.º de HC (nunca el id de la fila)."""
    if valor is None:
        return None
    if campo == "grupo_id":
        g = db.get(Grupo, valor)
        return f"{g.nombre} {g.anio}" if g else None
    if campo == "hce_referida_id":
        h = db.get(HceDiurna, valor)
        return f"N.º de HC {h.hc_historico}" if h and h.hc_historico is not None else "Expediente sin N.º de HC"
    return valor


def actualizar(db: Session, ateneo_id: int, datos: Mapping[str, Any], *, usuario: Profesional) -> tuple[Ateneo, list[dict]]:
    """PATCH de las claves presentes (`null` borra un opcional; `tipo`, `fecha` y `titulo` no). La forma se valida sobre
    el estado final; una jornada con acuerdos es 422 en `tipo`. Una fila `edicion` por campo que cambió."""
    ateneo = obtener(db, usuario, ateneo_id, para_escribir=True)
    d = _preparar(datos)
    final = {c: getattr(ateneo, c) for c in CAMPOS} | d
    errores: list[tuple[str | None, str]] = []
    _validar_forma(db, usuario, final, set(d), errores)
    if final.get("tipo") == "jornada" and ateneo.tipo != "jornada":
        hay = db.scalar(select(func.count()).select_from(AteneoAcuerdo).where(AteneoAcuerdo.ateneo_id == ateneo.id))
        if hay:
            errores.append(("tipo", "Este ateneo tiene acuerdos y una jornada de capacitación no los lleva: no se puede "
                                    "pasar a jornada."))
    if errores:
        raise ValidationFailed(errores)
    cambios = {c: v for c, v in d.items() if getattr(ateneo, c) != v}
    avisos = _avisos(db, final)
    if not cambios:
        return ateneo, avisos
    antes = {c: _legible(db, c, getattr(ateneo, c)) for c in cambios}
    despues = {c: _legible(db, c, v) for c, v in cambios.items()}
    for campo, valor in cambios.items():
        setattr(ateneo, campo, valor)
    db.flush()
    filas = registrar_cambios(db, modulo=MODULO_ATENEO, hce_id=None, antes=antes, despues=despues, usuario_id=usuario.id)
    for fila in filas:
        fila.detalle = _detalle(ateneo)
    db.flush()
    db.refresh(ateneo)
    return ateneo, avisos


# ── Acuerdos después del alta ────────────────────────────────────────────────
def crear_acuerdo(db: Session, ateneo_id: int, datos: Mapping[str, Any], *, usuario: Profesional) -> AteneoAcuerdo:
    """Un acuerdo más, al final (`orden` = el último + 1). 422 en una jornada. Una fila `carga`."""
    ateneo = obtener(db, usuario, ateneo_id, para_escribir=True)
    errores: list[tuple[str | None, str]] = []
    if ateneo.tipo == "jornada":
        errores.append((None, "Una jornada de capacitación no lleva acuerdos."))
    d = _preparar_acuerdo(datos, "", errores, alta=True)
    if errores:
        raise ValidationFailed(errores)
    ultimo = db.scalar(select(func.max(AteneoAcuerdo.orden)).where(AteneoAcuerdo.ateneo_id == ateneo.id))
    acuerdo = AteneoAcuerdo(ateneo_id=ateneo.id, orden=(ultimo + 1) if ultimo is not None else 0, **d)
    db.add(acuerdo)
    db.flush()
    db.refresh(acuerdo)
    registrar_carga(db, modulo=MODULO_ATENEO, hce_id=None, usuario_id=usuario.id, detalle=_detalle(ateneo, "acuerdo agregado"))
    return acuerdo


def actualizar_acuerdo(
    db: Session, ateneo_id: int, acuerdo_id: int, datos: Mapping[str, Any], *, usuario: Profesional,
) -> AteneoAcuerdo:
    """PATCH de `acuerdo`, `responsable_rol` y `plazo` (sólo las claves presentes). 404 si el acuerdo es de otro ateneo."""
    ateneo = obtener(db, usuario, ateneo_id)
    acuerdo = db.scalar(
        select(AteneoAcuerdo).where(AteneoAcuerdo.id == acuerdo_id, AteneoAcuerdo.ateneo_id == ateneo.id).with_for_update()
    )
    if acuerdo is None:
        raise NotFound("No existe el acuerdo en este ateneo")
    errores: list[tuple[str | None, str]] = []
    d = _preparar_acuerdo(datos, "", errores, alta=False)
    if errores:
        raise ValidationFailed(errores)
    cambios = {c: v for c, v in d.items() if getattr(acuerdo, c) != v}
    if not cambios:
        return acuerdo
    antes = {c: getattr(acuerdo, c) for c in cambios}
    for campo, valor in cambios.items():
        setattr(acuerdo, campo, valor)
    db.flush()
    filas = registrar_cambios(db, modulo=MODULO_ATENEO, hce_id=None, antes=antes, despues=cambios, usuario_id=usuario.id)
    for fila in filas:
        fila.detalle = _detalle(ateneo, "acuerdo")
    db.flush()
    db.refresh(acuerdo)
    return acuerdo


# ── Documentos del ateneo (§5.158 h) ─────────────────────────────────────────
def listar_documentos(db: Session, usuario: Profesional, ateneo_id: int, *, limit: int, offset: int) -> tuple[list[Documento], int]:
    """Como los del expediente: la `fecha_carga` más nueva primero, después `id` descendente."""
    obtener(db, usuario, ateneo_id)
    condicion = Documento.ateneo_id == ateneo_id
    total = db.scalar(select(func.count()).select_from(Documento).where(condicion))
    filas = db.scalars(
        select(Documento).where(condicion)
        .order_by(Documento.fecha_carga.desc(), Documento.id.desc()).limit(limit).offset(offset)
    )
    return list(filas), total


def obtener_documento(db: Session, usuario: Profesional, ateneo_id: int, doc_id: int) -> Documento:
    """404 si no existe, si es de otro ateneo o de un expediente (el mismo mensaje)."""
    obtener(db, usuario, ateneo_id)
    doc = db.scalar(select(Documento).where(Documento.id == doc_id, Documento.ateneo_id == ateneo_id))
    if doc is None:
        raise NotFound("No existe el documento en este ateneo")
    return doc


def crear_documento(
    db: Session, usuario: Profesional, ateneo_id: int, *, archivo: BinaryIO, nombre_archivo: str | None,
    categoria_id: Any, nombre: str | None, fecha_original,
) -> tuple[Documento, list[dict[str, Any]]]:
    """Alta con archivo (las reglas de C5) → `(documento, avisos)`: 422 por campo, 413 sobre los 10 MB. La categoría no
    puede ser histórica. Del nombre se quitan los caracteres Cf y Cc, con su aviso (B11, §5.163 b)."""
    ateneo = obtener(db, usuario, ateneo_id)
    errores: list[tuple[str | None, str]] = []
    cat = servicio_documentos._categoria(db, categoria_id, errores)
    if cat is not None and cat.es_registro_historico:
        errores.append(("categoria_id", "Las categorías «Registro histórico» son de los registros del expediente: no van en un ateneo."))
    etiqueta, avisos = servicio_documentos._nombre_de_alta(nombre, nombre_archivo, errores)
    if errores:
        raise ValidationFailed(errores)
    guardado = archivos.guardar(db, archivo, dueno="ateneo", dueno_id=ateneo.id, permitidos=ATENEO_DOCUMENTO_TIPOS)
    doc = Documento(
        ateneo_id=ateneo.id, categoria_id=cat.id, nombre=etiqueta, fecha_original=fecha_original,
        fecha_carga=fechas.hoy(), es_registro_historico=False, archivo_ref=guardado.ref,
    )
    db.add(doc)
    db.flush()
    db.refresh(doc)
    registrar_carga(
        db, modulo=MODULO_ATENEO, hce_id=None, usuario_id=usuario.id,
        detalle=_detalle(ateneo, servicio_documentos._detalle(cat, doc.fecha_carga).replace("Documento", "documento", 1)),
    )
    return doc, avisos
