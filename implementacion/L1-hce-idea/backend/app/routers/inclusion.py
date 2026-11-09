"""HCE-INC · ficha de inclusión y bitácora de gestiones — C4.

Contrato de respuesta y de error: docstring de `app/routers/__init__.py`. Reglas: `app/services/inclusion.py`
(ficha 0..1 con estado vigente, `fecha_estado` del sistema, bitácora sólo de alta y lectura, autor = usuario
del token, `sensible` derivado). Lo del expediente cuelga de `/hce/{hce_id}/inclusion`; `GET /inclusion`
(la lista del área, con el alcance del usuario) y `GET /inclusion/opciones` (cualquier usuario autenticado)
van aparte. **Ninguna respuesta lleva `semaforo`** (§5.154 d).
"""
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.models.identidad import Profesional
from app.routers.dependencias import hce_visible, permitido, sesion_lectura, sesion_transaccional, usuario_actual
from app.routers.hce import CABECERA_TOTAL, _ejemplo
from app.schemas.comunes import RespuestaError, Resultado
from app.schemas.inclusion import (
    EJEMPLO_FICHA, EJEMPLO_GESTION, EJEMPLO_GESTIONES, EJEMPLO_LISTA, EJEMPLO_OPCIONES, EJEMPLO_RESULTADO_FICHA,
    FichaActualizar, FichaCrear, FichaDetalle, FichaFila, GestionCrear, GestionDetalle,
    OpcionesInclusion,
)
from app.services import inclusion as servicio
from app.services.hce import LIMITE_MAXIMO, LIMITE_POR_OMISION

router_hce = APIRouter(prefix="/hce/{hce_id}/inclusion", tags=["inclusion"], dependencies=[Depends(hce_visible)])
router = APIRouter(prefix="/inclusion", tags=["inclusion"])
_USUARIO = Annotated[Profesional, Depends(usuario_actual)]
_LIMIT = Annotated[int, Query(ge=1, le=LIMITE_MAXIMO, description="Filas por página (1–200).")]
_OFFSET = Annotated[int, Query(ge=0, le=2_147_483_647, description="Filas a saltear.")]

_ERROR_404 = {404: {"model": RespuestaError, "description": "No existe el expediente o está fuera del alcance del usuario."}}
_ERROR_404_FICHA = {404: {"model": RespuestaError, "description": (
    "No existe el expediente, está fuera del alcance del usuario, o todavía no tiene ficha de inclusión."
)}}
_ERROR_422 = {422: {"model": RespuestaError, "description": (
    "Datos inválidos (detalle por campo), «Sin registrar» o un estado que no existe en `estado`, o un campo que "
    "la ficha no recibe —`fecha_estado` (la escribe el servidor), `estado_descripcion`—."
)}}


def _total(descripcion: str) -> dict:
    return {"headers": {CABECERA_TOTAL: {"description": descripcion, "schema": {"type": "integer"}}}}


def _gestion(gestion, autor: Profesional | None) -> GestionDetalle:
    return GestionDetalle.model_validate(servicio.vista_gestion(gestion, autor))


# ── Opciones y lista del área ────────────────────────────────────────────────
@router.get(
    "/opciones", response_model=OpcionesInclusion, summary="Opciones de la ficha y de la bitácora",
    responses=_ejemplo(200, EJEMPLO_OPCIONES),
)
def opciones(db: Annotated[Session, Depends(sesion_lectura)]):
    """Los 7 estados de `estado_inclusion` en `orden` (nombre, descripción, si se puede elegir), los tipos de
    centro, los valores de AT y los temas, medios y roles de la bitácora. Lista fija de referencia, sin
    paginar. **Sin semáforo**: los 7 estados son un supuesto nuestro que IPPU no confirmó."""
    return OpcionesInclusion(**servicio.opciones(db))


@router.get(
    "", response_model=list[FichaFila], summary="Fichas de inclusión de los expedientes activos",
    responses={
        200: {"content": {"application/json": {"example": EJEMPLO_LISTA}},
              **_total("Total de fichas que cumplen el filtro (todas las páginas).")},
        422: {"model": RespuestaError, "description": "`estado` no es uno de los 7 estados."},
        403: {"model": RespuestaError, "description": "Personal administrativo y dirección no técnica."},
    },
    dependencies=[Depends(permitido("inclusion.lista"))],
)
def listar(
    response: Response,
    db: Annotated[Session, Depends(sesion_lectura)],
    usuario: _USUARIO,
    estado: Annotated[str | None, Query(description="Filtra por estado (uno de los 7 de `/inclusion/opciones`).")] = None,
    limit: _LIMIT = LIMITE_POR_OMISION,
    offset: _OFFSET = 0,
):
    """Las fichas de los expedientes **activos** que el usuario ve (el admin, todas; un técnico, las de sus
    grupos), por apellido y nombre. «Última gestión» y cantidad de gestiones las calcula el servidor. Sin
    contadores por estado ni alerta de días: eso es el tablero del área, fuera de esta versión. Total en
    **`X-Total-Count`**."""
    filas, total = servicio.listar_fichas(db, usuario=usuario, estado=estado, limit=limit, offset=offset)
    response.headers[CABECERA_TOTAL] = str(total)
    return [FichaFila.model_validate(f) for f in filas]


# ── Ficha del expediente ─────────────────────────────────────────────────────
@router_hce.get(
    "", response_model=FichaDetalle, summary="La ficha de inclusión del expediente",
    responses={**_ejemplo(200, EJEMPLO_FICHA), **_ERROR_404_FICHA},
)
def leer(hce_id: int, db: Annotated[Session, Depends(sesion_lectura)]):
    """**404** mientras no esté registrada: es el estado «Sin registrar», no un error del cliente. La
    descripción del estado se resuelve al leer."""
    return FichaDetalle.model_validate(servicio.vista(db, servicio.obtener_ficha(db, hce_id)))


@router_hce.post(
    "", status_code=201, response_model=Resultado[FichaDetalle], summary="Registrar la ficha de inclusión",
    responses={
        **_ejemplo(201, EJEMPLO_RESULTADO_FICHA), **_ERROR_404, **_ERROR_422,
        409: {"model": RespuestaError, "description": "El expediente ya tiene ficha: se edita con PATCH."},
    },
)
def registrar(hce_id: int, datos: FichaCrear, db: Annotated[Session, Depends(sesion_transaccional)], usuario: _USUARIO):
    """Una por expediente. **422** con `campo` null si todo viene vacío, **409** la segunda vez. Con `estado`,
    el servidor fija `fecha_estado` = hoy. Deja una fila de `auditoria` `tipo='carga'`."""
    ficha = servicio.crear_ficha(db, hce_id, datos.model_dump(exclude_unset=True), profesional_id=usuario.id)
    return Resultado(data=FichaDetalle.model_validate(servicio.vista(db, ficha)))


@router_hce.patch(
    "", response_model=Resultado[FichaDetalle], summary="Edición parcial de la ficha de inclusión",
    responses={**_ejemplo(200, EJEMPLO_RESULTADO_FICHA), **_ERROR_404_FICHA, **_ERROR_422},
)
def actualizar(hce_id: int, datos: FichaActualizar, db: Annotated[Session, Depends(sesion_transaccional)], usuario: _USUARIO):
    """Sólo se tocan las claves presentes; `null` borra un campo, salvo `estado` (422). Si el estado cambia,
    `fecha_estado` = hoy. Cada campo que cambia deja **una fila** de auditoría con el valor anterior y el
    nuevo (también `fecha_estado`); si nada cambió, ninguna."""
    ficha = servicio.actualizar_ficha(db, hce_id, datos.model_dump(exclude_unset=True), profesional_id=usuario.id)
    return Resultado(data=FichaDetalle.model_validate(servicio.vista(db, ficha)))


# ── Bitácora ─────────────────────────────────────────────────────────────────
@router_hce.get(
    "/bitacora", response_model=list[GestionDetalle], summary="Gestiones del área de Inclusión",
    responses={
        200: {"content": {"application/json": {"example": EJEMPLO_GESTIONES}},
              **_total("Total de gestiones del expediente (todas las páginas).")},
        **_ERROR_404,
    },
)
def listar_bitacora(hce_id: int, response: Response, db: Annotated[Session, Depends(sesion_lectura)],
                    limit: _LIMIT = LIMITE_POR_OMISION, offset: _OFFSET = 0):
    """**La más nueva primero** (`fecha` e `id` descendentes); sin ficha, lista vacía con total 0. Total en
    **`X-Total-Count`**. Sólo se crean y se listan: una gestión es lo que pasó, no se edita ni se borra."""
    filas, total = servicio.listar_bitacora(db, hce_id, limit=limit, offset=offset)
    response.headers[CABECERA_TOTAL] = str(total)
    return [_gestion(g, autor) for g, autor in filas]


@router_hce.post(
    "/bitacora", status_code=201, response_model=Resultado[GestionDetalle], summary="Registrar una gestión",
    responses={
        **_ejemplo(201, EJEMPLO_GESTION), **_ERROR_422,
        404: {"model": RespuestaError, "description": (
            "No existe el expediente, está fuera del alcance, o no tiene ficha de inclusión (registrarla primero)."
        )},
    },
)
def crear_gestion(hce_id: int, datos: GestionCrear, db: Annotated[Session, Depends(sesion_transaccional)], usuario: _USUARIO):
    """`fecha`, `interlocutor`, `tema` y `contenido` obligatorios (los textos no en blanco). El autor es el
    usuario del token: `autor_id` en el cuerpo es 422. Deja una fila `carga` que no nombra el tema ni el
    contenido."""
    gestion, autor = servicio.crear_gestion(db, hce_id, datos.model_dump(exclude_unset=True), profesional_id=usuario.id)
    return Resultado(data=_gestion(gestion, autor))

