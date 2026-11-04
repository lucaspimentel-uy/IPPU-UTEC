"""HCE-INC · ficha de inclusión educativa y social y su bitácora de gestiones. C4.

`inclusion` es 0..1 por expediente (`id` propio + `UNIQUE(hce_id)`) con **estado vigente**, no anual
(`handoff.md` §5.51, §5.73; `puntos-a-validar.md` §1.15); `inclusion_bitacora` es 1:N y es la serie
temporal del módulo. `centro` es texto, nunca FK (§5.52). Las reglas de las tablas están en los
docstrings de `app/models/inclusion.py`.

## Reglas que fija este módulo (§5.154)

- **Ficha.** El GET da 404 mientras no exista (la pantalla lo muestra como «Sin registrar», no como un
  error, igual que SEV). El POST crea: **409** si ya existe (también en la carrera: `IntegrityError` →
  409) y **422 con `campo` null** si todos los campos vienen vacíos (como los vínculos de ORG, §5.144). El
  PATCH edita las claves presentes: `null` (o blanco) borra un campo opcional; **`estado` nunca es null**.
- **Estado.** Sólo los `asignable` de `estado_inclusion`: «Sin registrar» es la *ausencia* de registro y
  no se elige; uno que no existe tampoco (422 en `estado`). **`fecha_estado` la escribe el sistema**
  (`fechas.hoy()`) en cada cambio de estado —en el POST si viene `estado`, en el PATCH sólo si cambia de
  verdad— y nunca llega en el cuerpo (`extra="forbid"`). El semáforo de `estado_inclusion` **no sale**
  de la API: los 7 estados son un supuesto nuestro sin confirmar por IPPU (`preguntas-ippu.md` C3).
- **Bitácora: sólo crear y listar** (como los registros de ORG): es lo que pasó, no se edita ni se borra.
  Exige la ficha (404 que dice registrarla primero). `fecha`, `interlocutor`, `tema` y `contenido`
  obligatorios (los dos textos no en blanco, Unicode incluido); `rol`, `medio` y `acuerdos` opcionales;
  `rol`, `medio` y `tema` dentro de sus constantes. Autor = usuario del token. Sin regla de rango de fecha.
- **`sensible`** = `tema == INCLUSION_TEMA_SENSIBLE`, derivado al leer (nunca columna). Restringe
  **compartir**, no guardar, y hoy no tiene efecto (§5.39): acá sólo se informa.
- **Auditoría:** el alta de la ficha y cada gestión son una fila `carga` (el `detalle` no nombra el tema ni
  el contenido, ni el id interno, §5.152); cada PATCH, una fila `edicion` por campo que cambió de verdad
  —incluida `fecha_estado` cuando el sistema la reescribe—, ninguna si nada cambió.
- **Lista del área** (`GET /inclusion`): las fichas de los expedientes **activos** del alcance del
  usuario, con «última gestión» (`max(fecha)`) y cantidad de gestiones calculadas acá, en un número fijo
  de consultas. **No** hay contadores por estado ni alerta de 60 días: eso es el tablero del área, fuera
  del 26/11, y la fuente del umbral se contradice (§5.154 e).
"""
from collections.abc import Mapping
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.constantes import (
    INCLUSION_AT_ESTADOS, INCLUSION_MEDIOS, INCLUSION_ROLES, INCLUSION_TEMA_SENSIBLE, INCLUSION_TEMAS,
    INCLUSION_TIPOS_CENTRO, MODULO_HCE_INC,
)
from app.models.identidad import Grupo, HceDiurna, Persona, Profesional
from app.models.inclusion import EstadoInclusion, Inclusion, InclusionBitacora
from app.services import auth, fechas
from app.services.auditoria import registrar_cambios, registrar_carga
from app.services.errores import ConflictError, NotFound, ValidationFailed
from app.services.hce import obtener_hce
from app.services.texto import normalizar_opcionales, normalizar_texto

#: Los campos de la ficha que se escriben (todos texto). `fecha_estado` no está: la escribe el sistema.
CAMPOS_FICHA = (
    "centro", "tipo_centro", "grado", "modalidad", "dias_horas", "at", "at_nombre",
    "ref_nombre", "ref_rol", "ref_tel", "estado", "obs",
)
#: Dominios cerrados de la ficha y de la bitácora (las constantes de `core/constantes.py`).
_DOMINIOS_FICHA = {"tipo_centro": INCLUSION_TIPOS_CENTRO, "at": INCLUSION_AT_ESTADOS}
_DOMINIOS_BITACORA = {"rol": INCLUSION_ROLES, "medio": INCLUSION_MEDIOS, "tema": INCLUSION_TEMAS}
_TEXTOS_BITACORA = ("interlocutor", "rol", "medio", "tema", "contenido", "acuerdos")


# ── Opciones del formulario ──────────────────────────────────────────────────
def opciones(db: Session) -> dict[str, Any]:
    """Los 7 estados (en `orden`, con su descripción y si se pueden elegir) y los vocabularios de las
    constantes. **Sin `semaforo`**: el estado se muestra en tinta (§5.154 d)."""
    estados = db.scalars(select(EstadoInclusion).order_by(EstadoInclusion.orden, EstadoInclusion.nombre))
    return {
        "estados": [
            {"nombre": e.nombre, "descripcion": e.descripcion, "orden": e.orden, "asignable": e.asignable}
            for e in estados
        ],
        "tipos_centro": list(INCLUSION_TIPOS_CENTRO),
        "at_estados": list(INCLUSION_AT_ESTADOS),
        "temas": list(INCLUSION_TEMAS),
        "tema_sensible": INCLUSION_TEMA_SENSIBLE,
        "medios": list(INCLUSION_MEDIOS),
        "roles": list(INCLUSION_ROLES),
    }


# ── Ficha: lectura ───────────────────────────────────────────────────────────
def _ficha_de(db: Session, hce_id: int, *, para_escribir: bool = False) -> Inclusion | None:
    consulta = select(Inclusion).where(Inclusion.hce_id == hce_id)
    if para_escribir:
        consulta = consulta.with_for_update()
    return db.scalar(consulta)


def obtener_ficha(db: Session, hce_id: int, *, para_escribir: bool = False) -> Inclusion:
    """404 si no existe el expediente o si todavía no tiene ficha de inclusión."""
    obtener_hce(db, hce_id)
    ficha = _ficha_de(db, hce_id, para_escribir=para_escribir)
    if ficha is None:
        raise NotFound(f"El expediente {hce_id} no tiene ficha de inclusión registrada")
    return ficha


def vista(db: Session, ficha: Inclusion) -> dict[str, Any]:
    """La ficha con la descripción del estado resuelta **ahora** contra `estado_inclusion`."""
    estado = db.get(EstadoInclusion, ficha.estado)
    return {
        **{c: getattr(ficha, c) for c in CAMPOS_FICHA},
        "estado_descripcion": estado.descripcion if estado is not None else None,
        "fecha_estado": ficha.fecha_estado,
        "actualizado_en": ficha.actualizado_en,
    }


# ── Ficha: validación ────────────────────────────────────────────────────────
def _preparar_ficha(db: Session, datos: Mapping[str, Any], errores: list[tuple[str | None, str]]) -> dict[str, Any]:
    """Sólo los campos conocidos, con `''`/blanco → `None`. Dominios cerrados y `estado` asignable."""
    d = normalizar_opcionales({c: datos[c] for c in CAMPOS_FICHA if c in datos}, CAMPOS_FICHA)
    for campo, dominio in _DOMINIOS_FICHA.items():
        if d.get(campo) is not None and d[campo] not in dominio:
            errores.append((campo, f"Debe ser uno de: {', '.join(dominio)}"))
    if "estado" in d:
        if d["estado"] is None:
            errores.append(("estado", "Es obligatorio: elegí uno de los estados"))
        else:
            estado = db.get(EstadoInclusion, d["estado"])
            if estado is None:
                errores.append(("estado", "No es uno de los estados de inclusión"))
            elif not estado.asignable:
                errores.append(("estado", f"«{estado.nombre}» es la ausencia de registro: no se elige"))
    return d


def _detalle_conflicto(hce_id: int) -> ConflictError:
    return ConflictError(
        f"El expediente {hce_id} ya tiene la ficha de inclusión: se edita, no se vuelve a crear",
        [(None, "Ya existe la ficha de inclusión de este expediente")],
    )


# ── Ficha: escritura ─────────────────────────────────────────────────────────
def crear_ficha(db: Session, hce_id: int, datos: Mapping[str, Any], *, profesional_id: int) -> Inclusion:
    """Alta de la ficha (**una vez**). 404 si no existe el expediente · 422 si todo viene vacío o un campo
    es inválido · 409 si ya existe. Con `estado`, `fecha_estado` = hoy; sin él queda «Sin registrar»."""
    obtener_hce(db, hce_id)
    errores: list[tuple[str | None, str]] = []
    d = _preparar_ficha(db, datos, errores)
    if not errores and all(d.get(c) is None for c in CAMPOS_FICHA):
        errores.append((None, "Completá al menos un dato de la ficha: una ficha vacía no dice nada"))
    if errores:
        raise ValidationFailed(errores)
    if _ficha_de(db, hce_id) is not None:
        raise _detalle_conflicto(hce_id)
    ficha = Inclusion(hce_id=hce_id, **{c: v for c, v in d.items() if v is not None})
    if d.get("estado") is not None:
        ficha.fecha_estado = fechas.hoy()
    db.add(ficha)
    try:
        db.flush()
    except IntegrityError as exc:  # carrera: dos altas simultáneas del mismo expediente
        raise _detalle_conflicto(hce_id) from exc
    db.refresh(ficha)
    registrar_carga(
        db, modulo=MODULO_HCE_INC, hce_id=hce_id, usuario_id=profesional_id,
        detalle="Alta de la ficha de inclusión",
    )
    return ficha


def actualizar_ficha(db: Session, hce_id: int, datos: Mapping[str, Any], *, profesional_id: int) -> Inclusion:
    """Edición parcial: sólo las claves presentes (`null` borra; `estado` no). Si `estado` cambia de verdad,
    `fecha_estado` = hoy. Una fila `edicion` por campo que cambió, ninguna si nada cambió. 404 sin ficha."""
    ficha = obtener_ficha(db, hce_id, para_escribir=True)
    errores: list[tuple[str | None, str]] = []
    d = _preparar_ficha(db, datos, errores)
    if errores:
        raise ValidationFailed(errores)
    cambios = {c: v for c, v in d.items() if getattr(ficha, c) != v}
    if "estado" in cambios:
        cambios["fecha_estado"] = fechas.hoy()
    cambios = {c: v for c, v in cambios.items() if getattr(ficha, c) != v}
    if not cambios:
        return ficha
    antes = {c: getattr(ficha, c) for c in cambios}
    for campo, valor in cambios.items():
        setattr(ficha, campo, valor)
    db.flush()
    db.refresh(ficha)
    registrar_cambios(
        db, modulo=MODULO_HCE_INC, hce_id=hce_id, antes=antes, despues=cambios, usuario_id=profesional_id,
    )
    return ficha


# ── Bitácora ─────────────────────────────────────────────────────────────────
def vista_gestion(gestion: InclusionBitacora, autor: Profesional | None) -> dict[str, Any]:
    return {
        "id": gestion.id, "fecha": gestion.fecha, "interlocutor": gestion.interlocutor, "rol": gestion.rol,
        "medio": gestion.medio, "tema": gestion.tema, "sensible": gestion.tema == INCLUSION_TEMA_SENSIBLE,
        "contenido": gestion.contenido, "acuerdos": gestion.acuerdos,
        "autor": {"id": autor.id, "nombre": autor.nombre} if autor is not None else None,
        "registrado_en": gestion.registrado_en,
    }


def listar_bitacora(
    db: Session, hce_id: int, *, limit: int, offset: int,
) -> tuple[list[tuple[InclusionBitacora, Profesional | None]], int]:
    """Las gestiones del expediente, la más nueva primero (`fecha`, `id` descendentes), y el total.
    Sin ficha no hay gestiones: lista vacía con total 0 (no es un error)."""
    obtener_hce(db, hce_id)
    ficha = _ficha_de(db, hce_id)
    if ficha is None:
        return [], 0
    condicion = InclusionBitacora.inclusion_id == ficha.id
    total = db.scalar(select(func.count()).select_from(InclusionBitacora).where(condicion))
    filas = db.execute(
        select(InclusionBitacora, Profesional)
        .outerjoin(Profesional, Profesional.id == InclusionBitacora.autor_id)
        .where(condicion)
        .order_by(InclusionBitacora.fecha.desc(), InclusionBitacora.id.desc())
        .limit(limit).offset(offset)
    ).all()
    return [(g, p) for g, p in filas], total


def crear_gestion(
    db: Session, hce_id: int, datos: Mapping[str, Any], *, profesional_id: int,
) -> tuple[InclusionBitacora, Profesional | None]:
    """Una gestión del área. Exige la ficha (404 si no hay). `fecha`, `interlocutor`, `tema` y `contenido`
    obligatorios; el autor es el usuario del token. Deja una fila `carga` sin el tema ni el contenido."""
    obtener_hce(db, hce_id)
    ficha = _ficha_de(db, hce_id)
    if ficha is None:
        raise NotFound(
            f"El expediente {hce_id} no tiene ficha de inclusión: registrá la ficha primero",
            [(None, "Este expediente no tiene ficha de inclusión: registrá la ficha antes de agregar gestiones")],
        )
    d = normalizar_opcionales({c: datos[c] for c in _TEXTOS_BITACORA if c in datos}, _TEXTOS_BITACORA)
    errores: list[tuple[str | None, str]] = []
    if datos.get("fecha") is None:
        errores.append(("fecha", "Es obligatoria"))
    for campo in ("interlocutor", "tema", "contenido"):
        if d.get(campo) is None:
            errores.append((campo, "Es obligatorio"))
    for campo, dominio in _DOMINIOS_BITACORA.items():
        if d.get(campo) is not None and d[campo] not in dominio:
            errores.append((campo, f"Debe ser uno de: {', '.join(dominio)}"))
    if errores:
        raise ValidationFailed(errores)
    gestion = InclusionBitacora(
        inclusion_id=ficha.id, fecha=datos["fecha"], autor_id=profesional_id,
        **{c: d.get(c) for c in _TEXTOS_BITACORA},
    )
    db.add(gestion)
    db.flush()
    db.refresh(gestion)
    registrar_carga(
        db, modulo=MODULO_HCE_INC, hce_id=hce_id, usuario_id=profesional_id,
        detalle="Gestión de inclusión registrada",
    )
    return gestion, db.get(Profesional, profesional_id)


# ── Lista del área ───────────────────────────────────────────────────────────
def listar_fichas(
    db: Session, *, usuario: Profesional, estado: str | None = None, limit: int, offset: int,
) -> tuple[list[dict[str, Any]], int]:
    """Las fichas de los expedientes **activos** del alcance del usuario (admin: todas; técnico: las de
    sus grupos), por apellido y nombre, con «última gestión» y cantidad de gestiones. Siempre las mismas
    consultas, sea una fila o doscientas. `estado` fuera de los 7 es 422."""
    estado = normalizar_texto(estado)
    if estado is not None and db.get(EstadoInclusion, estado) is None:
        raise ValidationFailed([("estado", "No es uno de los estados de inclusión")])
    gestiones = (
        select(
            InclusionBitacora.inclusion_id.label("inclusion_id"),
            func.max(InclusionBitacora.fecha).label("ultima"),
            func.count(InclusionBitacora.id).label("cantidad"),
        )
        .group_by(InclusionBitacora.inclusion_id)
        .subquery()
    )
    condiciones = [HceDiurna.activo.is_(True)]
    if estado is not None:
        condiciones.append(Inclusion.estado == estado)
    if (alcance := auth.condicion_de_alcance(usuario)) is not None:
        condiciones.append(alcance)
    base = (
        select(Inclusion, HceDiurna, Persona, Grupo, gestiones.c.ultima, gestiones.c.cantidad)
        .join(HceDiurna, HceDiurna.id == Inclusion.hce_id)
        .join(Persona, Persona.id == HceDiurna.persona_id)
        .outerjoin(Grupo, Grupo.id == HceDiurna.grupo_id)
        .outerjoin(gestiones, gestiones.c.inclusion_id == Inclusion.id)
        .where(*condiciones)
    )
    total = db.scalar(select(func.count()).select_from(base.subquery()))
    filas = db.execute(
        base.order_by(Persona.apellido, Persona.nombre, HceDiurna.id).limit(limit).offset(offset)
    ).all()
    return [
        {
            "hce_id": hce.id, "hc_historico": hce.hc_historico,
            "persona": {"nombre": persona.nombre, "apellido": persona.apellido, "fecha_nac": persona.fecha_nac},
            "grupo": {"id": grupo.id, "nombre": grupo.nombre, "anio": grupo.anio} if grupo is not None else None,
            "centro": ficha.centro, "grado": ficha.grado, "tipo_centro": ficha.tipo_centro, "at": ficha.at,
            "estado": ficha.estado, "fecha_estado": ficha.fecha_estado,
            "ultima_gestion": ultima, "gestiones": cantidad or 0,
        }
        for ficha, hce, persona, grupo, ultima, cantidad in filas
    ], total
