"""La matriz de acceso — Fase 4, A1 (`docs/diseno/fase4-acceso.md` a, b, c; `docs/diseno/fase4-matriz-rutas.csv`; §5.164).

**Una sola función decide** (`celda`): qué le toca a un usuario frente a una acción, según su **rol**, su **relación** con el
expediente y si tiene una **ventana** de acceso vigente. Todas las dependencias de los routers y todos los alcances de las
listas preguntan acá; **ningún rol se compara fuera de este módulo**.

## El vocabulario es el del CSV

`MATRIZ` tiene una fila por **acción** (una clase de rutas que comparten regla; `ACCION_DE_RUTA`, en el test, ata cada fila
del CSV a una) y una columna por **sujeto**: `tratante` · `nt_sin_motivo` · `nt_con_motivo` · `coord_sin_motivo` ·
`coord_con_motivo` · `administrativo` · `direccion_nt`. Las celdas son literalmente las del CSV: `permitir`,
`permitir@<condición>`, `403:reason_required`, `403:forbidden`, `404`, y dos casos separados por `|` para los ateneos.

## Orden de los chequeos (sección b)

(1) token (401, `usuario_actual`) → (2) el **rol**: si la celda del rol es `403:forbidden` sea cual sea la relación, 403
**exista o no** el expediente → (3) existencia (404) → (4) relación y ventana (`403:reason_required`) → (5) escritura
permitida (`403:forbidden`) → (6) lo de siempre (422, 409…). Un 403 lleva sólo `code` y un mensaje fijo.

## Relación y ventana

- **tratante**(usuario, expediente) ⇔ el expediente tiene grupo y el usuario es su técnico 1 o 2 (F4-2), para `tecnico` y
  `coordinacion`; no mira el año del grupo ni `activo`. Se deriva en cada pedido, nunca se guarda.
- **Ventana vigente** ⇔ una fila de `acceso_hce` del usuario sobre ese expediente, de relación `no_tratante` o
  `supervision`, con `vence > now()` y la `token_version` del usuario (F4-9, F4-12). La de otro usuario o de otro
  expediente no cuenta; la de gestión o la copia a la familia no abren nada.

El servicio no importa FastAPI (regla de `app/services/__init__.py`).
"""
from sqlalchemy import exists, func, or_, select
from sqlalchemy.orm import Session

from app.core.constantes import (
    ACCESO_RELACIONES_VENTANA, ROL_ADMINISTRATIVO, ROL_COORDINACION, ROL_TECNICO, ROLES_ASIGNABLES,
)
from app.models.acceso import AccesoHce
from app.models.identidad import Grupo, HceDiurna, Profesional
from app.services.errores import ForbiddenAction, NotFound, ReasonRequired

# ── Sujetos y celdas ─────────────────────────────────────────────────────────
SUJETOS: tuple[str, ...] = (
    "tratante", "nt_sin_motivo", "nt_con_motivo", "coord_sin_motivo", "coord_con_motivo", "administrativo", "direccion_nt",
)
PERMITIR = "permitir"
MOTIVO = "403:reason_required"
PROHIBIDO = "403:forbidden"
NO_EXISTE = "404"

#: La relación de un usuario con un expediente (o con un grupo, en las fotos grupales).
TRATANTE = "tratante"
NO_TRATANTE = "no_tratante"

#: Los dos mensajes fijos del 403 `reason_required` (sección c): sin nombre ni N.º de HC.
MENSAJE_MOTIVO_TECNICO = "Este expediente no es de tus grupos: para abrirlo, registrá el motivo."
MENSAJE_MOTIVO_COORDINACION = "Para supervisar este expediente, registrá el motivo."
#: El mensaje fijo del 403 `forbidden` de la matriz (no dice nada del recurso: ni si existe).
MENSAJE_PROHIBIDO = "Tu rol no permite esta acción."


def _fila(*celdas: str) -> dict[str, str]:
    assert len(celdas) == len(SUJETOS)
    return dict(zip(SUJETOS, celdas))


def _igual(celda: str) -> dict[str, str]:
    return _fila(*(celda,) * len(SUJETOS))


_MIS = "permitir@mis_grupos"
_INST = "permitir@institucion"

#: La matriz. Las filas `hce.*`, `org.*`, `identificacion.*` y `accesos.abrir` son de las rutas **de un expediente**; las
#: demás, de las que no lo son (las tres columnas del técnico dicen lo mismo, como en el CSV).
MATRIZ: dict[str, dict[str, str]] = {
    # ── de un expediente ─────────────────────────────────────────────────────
    #: Lecturas clínicas y HCE-00 (`GET /hce/{id}`, flujo, CI, IDEA, PA/PB, IC, VF, SEV, INC, DOC, autorización de imagen).
    "hce.leer": _fila(PERMITIR, MOTIVO, PERMITIR, MOTIVO, PERMITIR, PROHIBIDO, PROHIBIDO),
    #: Escrituras clínicas, firmas, addendas, recibí y la subida de una foto (F4-4, F4-5: quien no trata no escribe).
    "hce.escribir": _fila(PERMITIR, PROHIBIDO, PROHIBIDO, PROHIBIDO, PROHIBIDO, PROHIBIDO, PROHIBIDO),
    #: El rastro de cambios (`GET /hce/{id}/auditoria`) y las fotos del expediente: fuera de la consulta del no tratante.
    "hce.reservado": _fila(PERMITIR, PROHIBIDO, PROHIBIDO, MOTIVO, PERMITIR, PROHIBIDO, PROHIBIDO),
    #: ORG: lo logístico y facturable; el personal administrativo lo lee y lo escribe (F4-6).
    "org.leer": _fila(PERMITIR, MOTIVO, PERMITIR, MOTIVO, PERMITIR, PERMITIR, PROHIBIDO),
    "org.escribir": _fila(PERMITIR, PROHIBIDO, PROHIBIDO, PROHIBIDO, PROHIBIDO, PERMITIR, PROHIBIDO),
    #: `GET|PATCH /hce/{id}/identificacion` (F4-5, F4-6): coordinación y administrativo, sin motivo. El no tratante la lee
    #: con su ventana (es un subconjunto de `GET /hce/{id}`) y no la escribe (§5.165).
    "identificacion.leer": _fila(PERMITIR, MOTIVO, PERMITIR, PERMITIR, PERMITIR, PERMITIR, PROHIBIDO),
    "identificacion.escribir": _fila(PERMITIR, PROHIBIDO, PROHIBIDO, PERMITIR, PERMITIR, PERMITIR, PROHIBIDO),
    #: `POST /hce/{id}/accesos` (F4-9): el no tratante y coordinación abren la ventana; el tratante, la copia a la familia.
    "accesos.abrir": _fila(PERMITIR, PERMITIR, PERMITIR, PERMITIR, PERMITIR, PROHIBIDO, PROHIBIDO),
    # ── sin expediente ───────────────────────────────────────────────────────
    "hce.alta": _fila(*("permitir@grupo_propio",) * 3, *("permitir@identificacion",) * 3, PROHIBIDO),
    "hce.buscar": _fila(*(_MIS,) * 3, *(_INST,) * 3, PROHIBIDO),
    #: `POST /hce/consulta` (F4-8): la coincidencia exacta de una C.I.
    "hce.consulta": _fila(*(PERMITIR,) * 6, PROHIBIDO),
    "inclusion.lista": _fila(*(_MIS,) * 3, _INST, _INST, PROHIBIDO, PROHIBIDO),
    "panel": _fila(*(_MIS,) * 3, _INST, _INST, PROHIBIDO, "permitir@agregado"),
    "ateneos.lista": _fila(*("permitir@alcance_ateneos",) * 3, _INST, _INST, PROHIBIDO, PROHIBIDO),
    "ateneos.alta": _fila(*("permitir@clinico_si_tratante",) * 3, PERMITIR, PERMITIR, PROHIBIDO, PROHIBIDO),
    "ateneos.indicador": _fila(*(PERMITIR,) * 5, PROHIBIDO, "permitir@agregado"),
    #: Un ateneo (`/ateneos/{id}…`): «tratante» es tratante del expediente referido; un no clínico, cualquier técnico.
    "ateneo.leer": _fila(PERMITIR, "permitir@no_clinico|404@clinico", PERMITIR, PERMITIR, PERMITIR, PROHIBIDO, PROHIBIDO),
    "ateneo.escribir": _fila(
        PERMITIR, "permitir@no_clinico|404@clinico", "permitir@no_clinico|403:forbidden@clinico", PERMITIR, PERMITIR,
        PROHIBIDO, PROHIBIDO,
    ),
    #: Fotos grupales (`/grupos/{id}/fotos…`): «tratante» = técnico de ese grupo; la ventana es por expediente, no por grupo.
    "grupo.fotos": _fila("permitir@tecnico_del_grupo", NO_EXISTE, NO_EXISTE, PERMITIR, PERMITIR, PROHIBIDO, PROHIBIDO),
    #: B6 (`mis_grupos`, `asignables`) recorta el contenido en A3; A1 decide el acceso por rol.
    "grupos.lista": _fila(*(_MIS,) * 3, PERMITIR, PERMITIR, PERMITIR, PROHIBIDO),
    "grupos.editar": _fila(PROHIBIDO, PROHIBIDO, PROHIBIDO, PERMITIR, PERMITIR, PROHIBIDO, PROHIBIDO),
    "profesionales.lista": _fila(*("permitir@asignables",) * 3, PERMITIR, PERMITIR, PROHIBIDO, PROHIBIDO),
    #: Auth, los seis catálogos de referencia (F4-19) y `GET /accesos/motivos`: todo usuario con sesión.
    "catalogo": _igual(PERMITIR),
}


# ── Relación y ventana ───────────────────────────────────────────────────────
def es_tecnico_del_grupo(usuario: Profesional, grupo: Grupo | None) -> bool:
    return grupo is not None and usuario.id in (grupo.tecnico1_id, grupo.tecnico2_id)


def relacion(usuario: Profesional, hce: HceDiurna) -> str | None:
    """`tratante` · `no_tratante` para quien trata (técnico o coordinación); `None` para los demás roles (F4-2)."""
    if usuario.rol not in ROLES_ASIGNABLES:
        return None
    return TRATANTE if es_tecnico_del_grupo(usuario, hce.grupo) else NO_TRATANTE


def _ventana_vigente_sql(usuario: Profesional, hce_id):
    """La condición «hay una ventana vigente del usuario sobre `hce_id`» (un id o una columna correlacionada)."""
    return exists().where(
        AccesoHce.usuario_id == usuario.id,
        AccesoHce.hce_id == hce_id,
        AccesoHce.vence > func.now(),
        AccesoHce.relacion.in_(ACCESO_RELACIONES_VENTANA),
        AccesoHce.token_version == usuario.token_version,
    )


def ventana_vigente(db: Session, usuario: Profesional, hce_id: int) -> bool:
    return bool(db.scalar(select(_ventana_vigente_sql(usuario, hce_id))))


# ── La función ───────────────────────────────────────────────────────────────
def sujeto(usuario: Profesional, *, relacion_: str | None = None, ventana: bool = False) -> str:
    """La columna de la matriz que le toca al usuario. Sin expediente (`relacion_` None), el técnico cae en una de sus
    columnas y coordinación en la suya: en esas filas las tres del técnico (y las dos de coordinación) dicen lo mismo."""
    rol = usuario.rol
    if relacion_ == TRATANTE and rol in ROLES_ASIGNABLES:
        return "tratante"
    if rol == ROL_COORDINACION:
        return "coord_con_motivo" if ventana else "coord_sin_motivo"
    if rol == ROL_TECNICO:
        return "nt_con_motivo" if ventana else "nt_sin_motivo"
    if rol == ROL_ADMINISTRATIVO:
        return "administrativo"
    return "direccion_nt"  # `direccion_nt` (y, por las dudas, cualquier rol que el CHECK no conozca: el de menos alcance)


def celda(usuario: Profesional, accion: str, *, relacion_: str | None = None, ventana: bool = False) -> str:
    """**La** función de la matriz: la celda (texto del CSV) del usuario para `accion`."""
    return MATRIZ[accion][sujeto(usuario, relacion_=relacion_, ventana=ventana)]


def resolver(texto: str, *, clinico: bool = False) -> tuple[str, str | None]:
    """`(efecto, condición)` de una celda; en una celda con `|`, la alternativa que corresponde a `clinico`."""
    for alternativa in texto.split("|"):
        efecto, _, condicion = alternativa.partition("@")
        if condicion in ("clinico", "no_clinico"):
            if (condicion == "clinico") != clinico:
                continue
            condicion = ""
        return efecto, condicion or None
    raise ValueError(f"Celda sin alternativa para clinico={clinico}: {texto}")


def _rechazar(usuario: Profesional, efecto: str, no_existe: str) -> None:
    if efecto == MOTIVO:
        mensaje = MENSAJE_MOTIVO_COORDINACION if usuario.rol == ROL_COORDINACION else MENSAJE_MOTIVO_TECNICO
        raise ReasonRequired(mensaje, [(None, mensaje)])
    if efecto == PROHIBIDO:
        raise ForbiddenAction(MENSAJE_PROHIBIDO, [(None, MENSAJE_PROHIBIDO)])
    if efecto == NO_EXISTE:
        raise NotFound(no_existe)


def _prohibido_por_rol(usuario: Profesional, accion: str) -> bool:
    """El paso (2): la celda es `403:forbidden` para **toda** relación y ventana posibles del usuario."""
    return all(
        celda(usuario, accion, relacion_=r, ventana=v).startswith(PROHIBIDO)
        for r in (TRATANTE, NO_TRATANTE) for v in (False, True)
    )


def exigir_rol(usuario: Profesional, accion: str) -> str | None:
    """Para las rutas **sin** expediente: 403 si el rol no puede; si puede, la condición de su celda (`mis_grupos`…)."""
    efecto, condicion = resolver(celda(usuario, accion))
    _rechazar(usuario, efecto, "No existe")
    return condicion


def exigir_en_hce(
    db: Session, usuario: Profesional, accion: str, hce_id: int | None, *, no_existe: str = "No existe el expediente",
) -> HceDiurna:
    """Para las rutas **de un expediente**, en el orden de la sección b: el rol, la existencia, la relación y la ventana, y
    la escritura. Devuelve el expediente."""
    if _prohibido_por_rol(usuario, accion):
        _rechazar(usuario, PROHIBIDO, no_existe)
    hce = db.get(HceDiurna, hce_id) if hce_id is not None else None
    if hce is None:
        raise NotFound(no_existe)
    rel = relacion(usuario, hce)
    ventana = rel != TRATANTE and _necesita_ventana(usuario, accion, rel) and ventana_vigente(db, usuario, hce.id)
    efecto, _ = resolver(celda(usuario, accion, relacion_=rel, ventana=ventana))
    _rechazar(usuario, efecto, no_existe)
    return hce


def _necesita_ventana(usuario: Profesional, accion: str, rel: str | None) -> bool:
    """Consultar la ventana sólo cuando cambia la respuesta (evita una consulta en cada pedido del tratante o de un rol
    para el que la ventana no existe)."""
    return celda(usuario, accion, relacion_=rel, ventana=False) != celda(usuario, accion, relacion_=rel, ventana=True)


# ── Fotos grupales ───────────────────────────────────────────────────────────
def exigir_grupo(db: Session, usuario: Profesional, grupo_id: int) -> Grupo:
    """`/grupos/{id}/fotos…`: 403 por rol exista o no el grupo; 404 si no existe o si el técnico no es de ese grupo."""
    if _prohibido_por_rol(usuario, "grupo.fotos"):
        _rechazar(usuario, PROHIBIDO, "No existe el grupo")
    grupo = db.get(Grupo, grupo_id)
    if grupo is None:
        raise NotFound("No existe el grupo")
    rel = TRATANTE if es_tecnico_del_grupo(usuario, grupo) else NO_TRATANTE
    efecto, _ = resolver(celda(usuario, "grupo.fotos", relacion_=rel))
    _rechazar(usuario, efecto, "No existe el grupo")
    return grupo


# ── Ateneos ──────────────────────────────────────────────────────────────────
def exigir_ateneo(
    db: Session, usuario: Profesional, *, clinico: bool, hce_referida_id: int | None, escribir: bool,
) -> None:
    """Un ateneo que existe: para un clínico, la relación con el expediente referido (y la ventana) deciden (sección b)."""
    accion = "ateneo.escribir" if escribir else "ateneo.leer"
    rel, ventana = None, False
    if clinico:
        hce = db.get(HceDiurna, hce_referida_id) if hce_referida_id is not None else None
        if hce is not None:
            rel = relacion(usuario, hce)
            ventana = rel == NO_TRATANTE and ventana_vigente(db, usuario, hce.id)
    efecto, _ = resolver(celda(usuario, accion, relacion_=rel, ventana=ventana), clinico=clinico)
    _rechazar(usuario, efecto, "No existe el ateneo")


def ateneo_prohibido_por_rol(usuario: Profesional, escribir: bool) -> bool:
    accion = "ateneo.escribir" if escribir else "ateneo.leer"
    return all(
        resolver(celda(usuario, accion, relacion_=r, ventana=v), clinico=c)[0] == PROHIBIDO
        for r in (TRATANTE, NO_TRATANTE) for v in (False, True) for c in (False, True)
    )


def rechazar_por_rol(usuario: Profesional) -> None:
    _rechazar(usuario, PROHIBIDO, "")


def puede_referir(usuario: Profesional, hce: HceDiurna) -> bool:
    """Si el usuario puede poner este expediente en un ateneo clínico (`clinico_si_tratante`): el técnico, sólo de uno
    del que es tratante; coordinación, de cualquiera."""
    rel = relacion(usuario, hce)
    efecto, condicion = resolver(celda(usuario, "ateneos.alta", relacion_=rel))
    return efecto == PERMITIR and (condicion != "clinico_si_tratante" or rel == TRATANTE)


def condicion_ateneos_visibles(usuario: Profesional, columna_tipo, columna_hce, tipo_clinico: str):
    """El alcance de `GET /ateneos`: `None` (la institución) o «no clínico, o clínico de un expediente que puede leer»
    (del que es tratante o sobre el que tiene una ventana vigente)."""
    condicion = exigir_rol(usuario, "ateneos.lista")
    if condicion != "alcance_ateneos":
        return None
    de_sus_grupos = (
        select(HceDiurna.id).join(Grupo, Grupo.id == HceDiurna.grupo_id)
        .where(or_(Grupo.tecnico1_id == usuario.id, Grupo.tecnico2_id == usuario.id))
    )
    return or_(columna_tipo != tipo_clinico, columna_hce.in_(de_sus_grupos), _ventana_vigente_sql(usuario, columna_hce))


# ── Listas ───────────────────────────────────────────────────────────────────
def condicion_de_alcance(usuario: Profesional, accion: str):
    """Condición SQL (sobre el `JOIN` con `grupo`) del alcance de una lista: `None` = la institución. 403 si el rol no
    puede (`exigir_rol`)."""
    if exigir_rol(usuario, accion) == "mis_grupos":
        return or_(Grupo.tecnico1_id == usuario.id, Grupo.tecnico2_id == usuario.id)
    return None


def es_agregado(usuario: Profesional, accion: str) -> bool:
    """La celda del usuario es `permitir@agregado` (dirección no técnica: la institución con la supresión de F4-7)."""
    return exigir_rol(usuario, accion) == "agregado"


def ve_la_nomina(usuario: Profesional) -> bool:
    """Si el usuario ve la nómina institucional (`GET /hce` sin recorte): coordinación y administrativo. Decide el mensaje
    de B5 (F4-14): a quien la ve no hay nada que ocultarle."""
    return resolver(celda(usuario, "hce.buscar"))[1] == "institucion"


# ── Alta y grupo propio ──────────────────────────────────────────────────────
def solo_grupo_propio(usuario: Profesional) -> bool:
    """El alta (y mover un expediente de grupo) sólo en un grupo propio: la condición `grupo_propio` del técnico."""
    return resolver(celda(usuario, "hce.alta"))[1] == "grupo_propio"


def solo_identificacion(usuario: Profesional) -> bool:
    """El alta sólo con datos identificatorios y logísticos (`identificacion`): coordinación y administrativo (F4-5, F4-6)."""
    return resolver(celda(usuario, "hce.alta"))[1] == "identificacion"


def exigir_grupo_propio(db: Session, usuario: Profesional, grupo_id: int | None) -> None:
    """Un técnico sólo asigna un expediente a **uno de sus grupos** (al crearlo o al cambiarle el grupo): si no, el
    expediente saldría de su alcance en el mismo acto. 403 por campo — el grupo lo eligió él. Un `grupo_id` inexistente lo
    rechaza (422) el servicio de HCE."""
    if not solo_grupo_propio(usuario):
        return
    grupo = db.get(Grupo, grupo_id) if grupo_id is not None else None
    if grupo_id is not None and grupo is None:
        return
    if not es_tecnico_del_grupo(usuario, grupo):
        raise ForbiddenAction(
            "Un técnico sólo puede asignar el expediente a un grupo propio",
            [("grupo_id", "Tiene que ser un grupo en el que sos técnico/a")],
        )


def es_asignable(profesional: Profesional) -> bool:
    """Si el profesional puede ser técnico 1 o 2 de un grupo (F4-2): técnico o coordinación."""
    return profesional.rol in ROLES_ASIGNABLES


def es_tecnico(usuario: Profesional) -> bool:
    """El técnico (no coordinación) frente a un expediente del que no es tratante tiene que mandar la C.I. para abrir la
    ventana (decisión (a), §5.165)."""
    return usuario.rol == ROL_TECNICO


def es_coordinacion(usuario: Profesional) -> bool:
    return usuario.rol == ROL_COORDINACION
