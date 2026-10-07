"""Listas de referencia de sólo lectura: `GET /grupos`, `GET /profesionales` — M11.3-a2.

GET plano, sin sobre (contrato de `app/routers/__init__.py`). Sin endpoints de
escritura: ver `app/services/referencias.py`.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.routers.dependencias import sesion_transaccional
from app.routers.hce import _ejemplo
from app.schemas.comunes import RespuestaError
from app.schemas.referencias import (
    EJEMPLO_GRUPOS, EJEMPLO_PROFESIONALES, GrupoResumen, ProfesionalResumen,
)
from app.services import referencias as servicio

router_grupos = APIRouter(prefix="/grupos", tags=["referencias"])
router_profesionales = APIRouter(prefix="/profesionales", tags=["referencias"])

_ERROR_422 = {422: {"model": RespuestaError, "description": "Parámetro inválido."}}


@router_grupos.get(
    "", response_model=list[GrupoResumen], summary="Grupos de un año",
    responses={**_ejemplo(200, EJEMPLO_GRUPOS), **_ERROR_422},
)
def listar_grupos(
    db: Annotated[Session, Depends(sesion_transaccional)],
    anio: Annotated[int | None, Query(ge=1, le=32767, description="Año de los grupos; por omisión el año en curso.")] = None,
):
    """Los grupos del `anio` (por omisión el en curso), ordenados por nombre. Lista vacía si no hay."""
    return [GrupoResumen.model_validate(g) for g in servicio.listar_grupos(db, anio)]


@router_profesionales.get(
    "", response_model=list[ProfesionalResumen], summary="Profesionales",
    responses={**_ejemplo(200, EJEMPLO_PROFESIONALES), **_ERROR_422},
)
def listar_profesionales(
    db: Annotated[Session, Depends(sesion_transaccional)],
    activo: Annotated[bool | None, Query(description="`true`: sólo activos · `false`: sólo inactivos · omitido: todos.")] = None,
):
    """Profesionales ordenados por nombre, con los campos mínimos para elegir uno. Lista vacía si no hay."""
    return [ProfesionalResumen.model_validate(p) for p in servicio.listar_profesionales(db, activo)]
