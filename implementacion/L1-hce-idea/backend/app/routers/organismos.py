"""HCE-ORG · vínculos con INAU y BPS y sus registros — C3.

Contrato de respuesta y de error: docstring de `app/routers/__init__.py`. Reglas: `app/services/organismos.py`
(alerta AYEX calculada al leer, vínculo 0..1 sin vaciarse al crear, registros sólo de alta y lectura, autor =
usuario del token). Todo cuelga del expediente: `/hce/{hce_id}/organismos`. `GET /organismos/opciones` es de
sólo lectura y lo ve cualquier usuario autenticado.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response

from sqlalchemy.orm import Session

from app.core.constantes import ORGANISMOS
from app.models.identidad import Profesional
from app.routers.dependencias import hce_visible, sesion_lectura, sesion_transaccional, usuario_actual
from app.routers.hce import CABECERA_TOTAL, _ejemplo
from app.schemas.comunes import RespuestaError, Resultado
from app.schemas.organismos import (
    EJEMPLO_BPS, EJEMPLO_INAU, EJEMPLO_OPCIONES, EJEMPLO_ORGANISMOS, EJEMPLO_REGISTRO, EJEMPLO_REGISTROS,
    AutorRegistro, BpsActualizar, BpsCrear, BpsDetalle, InauActualizar, InauCrear, InauDetalle, OpcionesOrganismos,
    OrganismosDetalle, RegistroCrear, RegistroDetalle,
)
from app.services import organismos as servicio
from app.services.hce import LIMITE_MAXIMO, LIMITE_POR_OMISION

router_hce = APIRouter(prefix="/hce/{hce_id}/organismos", tags=["organismos"], dependencies=[Depends(hce_visible)])
router_opciones = APIRouter(prefix="/organismos", tags=["organismos"])
_USUARIO = Annotated[Profesional, Depends(usuario_actual)]

_ERROR_404 = {404: {"model": RespuestaError, "description": "No existe el expediente o está fuera del alcance del usuario."}}
_ERROR_404_VINCULO = {404: {"model": RespuestaError, "description": (
    "No existe el expediente, está fuera del alcance del usuario, o todavía no tiene ese vínculo registrado."
)}}
_ERROR_422 = {422: {"model": RespuestaError, "description": (
    "Datos inválidos (detalle por campo), o un campo que el vínculo no tiene —`alerta` (la calcula el servidor)—."
)}}
_ERROR_409 = {409: {"model": RespuestaError, "description": "El expediente ya tiene ese vínculo: se edita con PATCH."}}


def _registro(registro, autor: Profesional | None) -> RegistroDetalle:
    return RegistroDetalle(
        id=registro.id, organismo=registro.organismo, fecha=registro.fecha, detalle=registro.detalle,
        autor=AutorRegistro(id=autor.id, nombre=autor.nombre) if autor is not None else None,
    )


@router_opciones.get(
    "/opciones", response_model=OpcionesOrganismos, summary="Opciones del formulario de BPS",
    responses=_ejemplo(200, EJEMPLO_OPCIONES),
)
def opciones():
    """Prestaciones y estados que ofrece el formulario de BPS. Son **sugerencias**: la base guarda texto
    libre. Lista fija de referencia, sin paginar."""
    return OpcionesOrganismos(**servicio.opciones())


@router_hce.get(
    "", response_model=OrganismosDetalle, summary="Los vínculos del expediente con INAU y BPS",
    responses={**_ejemplo(200, EJEMPLO_ORGANISMOS), **_ERROR_404},
)
def leer(hce_id: int, db: Annotated[Session, Depends(sesion_lectura)]):
    """`inau` y `bps`, cada uno `null` mientras no se haya registrado (es un estado, no un error). El `bps`
    lleva la **alerta AYEX** calculada ahora: nunca se guarda."""
    return OrganismosDetalle.model_validate(servicio.leer(db, hce_id))


# ── INAU ─────────────────────────────────────────────────────────────────────
@router_hce.post(
    "/inau", status_code=201, response_model=Resultado[InauDetalle], summary="Registrar el vínculo con INAU",
    responses={**_ejemplo(201, EJEMPLO_INAU), **_ERROR_404, **_ERROR_422, **_ERROR_409},
)
def crear_inau(hce_id: int, datos: InauCrear, db: Annotated[Session, Depends(sesion_transaccional)], usuario: _USUARIO):
    """Uno por expediente. **422** si todos los campos vienen vacíos (un vínculo vacío no dice nada) y
    **409** la segunda vez. Deja una fila de `auditoria` `tipo='carga'`."""
    fila = servicio.crear_vinculo(db, "inau", hce_id, datos.model_dump(exclude_unset=True), profesional_id=usuario.id)
    return Resultado(data=InauDetalle.model_validate(servicio.vista_inau(fila)))


@router_hce.patch(
    "/inau", response_model=Resultado[InauDetalle], summary="Edición parcial del vínculo con INAU",
    responses={**_ejemplo(200, EJEMPLO_INAU), **_ERROR_404_VINCULO, **_ERROR_422},
)
def actualizar_inau(hce_id: int, datos: InauActualizar, db: Annotated[Session, Depends(sesion_transaccional)], usuario: _USUARIO):
    """Sólo se tocan las claves presentes; `null` borra el campo. Cada campo que cambia deja **una fila**
    de auditoría (`inau.<campo>`) con el valor anterior y el nuevo; si nada cambió, ninguna."""
    fila = servicio.actualizar_vinculo(db, "inau", hce_id, datos.model_dump(exclude_unset=True), profesional_id=usuario.id)
    return Resultado(data=InauDetalle.model_validate(servicio.vista_inau(fila)))


# ── BPS ──────────────────────────────────────────────────────────────────────
@router_hce.post(
    "/bps", status_code=201, response_model=Resultado[BpsDetalle], summary="Registrar el vínculo con BPS",
    responses={**_ejemplo(201, EJEMPLO_BPS), **_ERROR_404, **_ERROR_422, **_ERROR_409},
)
def crear_bps(hce_id: int, datos: BpsCrear, db: Annotated[Session, Depends(sesion_transaccional)], usuario: _USUARIO):
    """Uno por expediente. **422** si todos los campos vienen vacíos y **409** la segunda vez. La respuesta
    trae la `alerta` AYEX. Deja una fila de `auditoria` `tipo='carga'`."""
    fila = servicio.crear_vinculo(db, "bps", hce_id, datos.model_dump(exclude_unset=True), profesional_id=usuario.id)
    return Resultado(data=BpsDetalle.model_validate(servicio.vista_bps(fila)))


@router_hce.patch(
    "/bps", response_model=Resultado[BpsDetalle], summary="Edición parcial del vínculo con BPS",
    responses={**_ejemplo(200, EJEMPLO_BPS), **_ERROR_404_VINCULO, **_ERROR_422},
)
def actualizar_bps(hce_id: int, datos: BpsActualizar, db: Annotated[Session, Depends(sesion_transaccional)], usuario: _USUARIO):
    """Sólo se tocan las claves presentes; `null` borra el campo. Una fila de auditoría (`bps.<campo>`) por
    campo que cambió, ninguna si nada cambió. La `alerta` AYEX no deja fila: se calcula, no se guarda."""
    fila = servicio.actualizar_vinculo(db, "bps", hce_id, datos.model_dump(exclude_unset=True), profesional_id=usuario.id)
    return Resultado(data=BpsDetalle.model_validate(servicio.vista_bps(fila)))


# ── Registros ────────────────────────────────────────────────────────────────
@router_hce.get(
    "/registros", response_model=list[RegistroDetalle], summary="Envíos a INAU y gestiones ante BPS",
    responses={
        200: {
            "content": {"application/json": {"example": EJEMPLO_REGISTROS}},
            "headers": {CABECERA_TOTAL: {
                "description": "Total de registros que cumplen el filtro (todas las páginas).",
                "schema": {"type": "integer"},
            }},
        },
        **_ERROR_404,
        422: {"model": RespuestaError, "description": f"`organismo` fuera de: {' · '.join(ORGANISMOS)}."},
    },
)
def listar_registros(
    hce_id: int,
    response: Response,
    db: Annotated[Session, Depends(sesion_lectura)],
    organismo: Annotated[str | None, Query(description=f"Filtra por organismo: {' · '.join(ORGANISMOS)}.")] = None,
    limit: Annotated[int, Query(ge=1, le=LIMITE_MAXIMO, description="Filas por página (1–200).")] = LIMITE_POR_OMISION,
    offset: Annotated[int, Query(ge=0, le=2_147_483_647, description="Filas a saltear.")] = 0,
):
    """**El más nuevo primero** (`fecha` y `id` descendentes). Total en la cabecera **`X-Total-Count`**.
    Sólo se crean y se listan: un registro es una constancia, no se edita ni se borra."""
    filas, total = servicio.listar_registros(db, hce_id, organismo=organismo, limit=limit, offset=offset)
    response.headers[CABECERA_TOTAL] = str(total)
    return [_registro(r, autor) for r, autor in filas]


@router_hce.post(
    "/registros", status_code=201, response_model=Resultado[RegistroDetalle], summary="Registrar un envío o una gestión",
    responses={**_ejemplo(201, EJEMPLO_REGISTRO), **_ERROR_404, **_ERROR_422},
)
def crear_registro(hce_id: int, datos: RegistroCrear, db: Annotated[Session, Depends(sesion_transaccional)], usuario: _USUARIO):
    """`organismo`, `fecha` y `detalle` (no en blanco) son obligatorios. El autor es el usuario del token:
    `autor_id` en el cuerpo es 422. Deja una fila de `auditoria` `tipo='carga'`."""
    registro, autor = servicio.crear_registro(db, hce_id, datos.model_dump(exclude_unset=True), profesional_id=usuario.id)
    return Resultado(data=_registro(registro, autor))
