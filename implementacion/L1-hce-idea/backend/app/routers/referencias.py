"""Listas de referencia: `GET /grupos`, `GET /profesionales` — M11.3-a2; `PATCH /grupos/{id}` — M11.5-a.

GET plano, sin sobre (contrato de `app/routers/__init__.py`). La única escritura es la
**asignación de técnicos a un grupo**, sólo `admin` (`handoff.md` §5.120); crear, renombrar o
archivar grupos sigue fuera (§5.90).
"""
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.models.identidad import Profesional
from app.routers.dependencias import sesion_lectura, sesion_transaccional, usuario_actual
from app.routers.hce import _ejemplo
from app.schemas.comunes import RespuestaError, Resultado
from app.schemas.referencias import (
    EJEMPLO_GRUPOS, EJEMPLO_PROFESIONALES, EJEMPLO_RESULTADO_GRUPO, GrupoConTecnicos, GrupoDetalle,
    GrupoTecnicosActualizar, ProfesionalResumen,
)
from app.services import auth
from app.services import grupos as servicio_grupos
from app.services import referencias as servicio
from app.services.errores import ForbiddenAction

router_grupos = APIRouter(prefix="/grupos", tags=["referencias"])
router_profesionales = APIRouter(prefix="/profesionales", tags=["referencias"])

_ERROR_422 = {422: {"model": RespuestaError, "description": "Parámetro inválido."}}


@router_grupos.get(
    "", response_model=list[GrupoConTecnicos], summary="Grupos de un año",
    responses={**_ejemplo(200, EJEMPLO_GRUPOS), **_ERROR_422},
)
def listar_grupos(
    db: Annotated[Session, Depends(sesion_lectura)],
    anio: Annotated[int | None, Query(ge=1, le=32767, description="Año de los grupos; por omisión el año en curso.")] = None,
):
    """Los grupos del `anio` (por omisión el en curso), ordenados por nombre, cada uno con `tecnico1` y
    `tecnico2` (`{id, nombre, rol}`, `null` si el puesto está sin asignar; `rol` es el rol **en el grupo**).
    Lista vacía si no hay."""
    return [GrupoConTecnicos.model_validate(g) for g in servicio.listar_grupos(db, anio)]


@router_profesionales.get(
    "", response_model=list[ProfesionalResumen], summary="Profesionales",
    responses={**_ejemplo(200, EJEMPLO_PROFESIONALES), **_ERROR_422},
)
def listar_profesionales(
    db: Annotated[Session, Depends(sesion_lectura)],
    activo: Annotated[bool | None, Query(description="`true`: sólo activos · `false`: sólo inactivos · omitido: todos.")] = None,
):
    """Profesionales ordenados por nombre, con los campos mínimos para elegir uno. Lista vacía si no hay."""
    return [ProfesionalResumen.model_validate(p) for p in servicio.listar_profesionales(db, activo)]


def _solo_admin(usuario: Annotated[Profesional, Depends(usuario_actual)]) -> Profesional:
    """403 para un `tecnico`: asignar técnicos es una acción de dirección (§5.120). Se mira antes
    que el grupo, así un `tecnico` recibe 403 también por un grupo que no existe."""
    if not auth.es_admin(usuario):
        raise ForbiddenAction(
            "Sólo un admin asigna técnicos a un grupo", [(None, "Sólo un admin asigna técnicos a un grupo")],
        )
    return usuario


@router_grupos.patch(
    "/{grupo_id}", response_model=Resultado[GrupoDetalle], summary="Asignar técnicos a un grupo",
    responses={
        **_ejemplo(200, EJEMPLO_RESULTADO_GRUPO),
        403: {"model": RespuestaError, "description": "Sólo `admin`."},
        404: {"model": RespuestaError, "description": "No existe el grupo."},
        422: {"model": RespuestaError, "description": (
            "Profesional inexistente o inactivo, técnico 1 = técnico 2, o un campo que no es de técnicos."
        )},
    },
)
def asignar_tecnicos(
    grupo_id: int, datos: GrupoTecnicosActualizar,
    db: Annotated[Session, Depends(sesion_transaccional)],
    usuario: Annotated[Profesional, Depends(_solo_admin)],
):
    """**Sólo `admin`.** Semántica PATCH: se tocan sólo las claves que vienen; `null` desasigna.

    - **422** por campo si el profesional no existe o está inactivo, o si técnico 1 y técnico 2
      quedarían siendo la misma persona; también si viene un campo que no sea de técnicos
      (`nombre`, `anio`…: administrar grupos es otro sub-módulo, §5.90).
    - Una fila de `auditoria` (`edicion`, `hce_id` NULL, `modulo='GRUPO'`) **por campo que cambió**,
      con el técnico anterior legible (`"Nombre (id N)"`).
    - Desde la respuesta, el técnico asignado alcanza los expedientes del grupo (§5.101).
    """
    grupo = servicio_grupos.asignar_tecnicos(
        db, grupo_id, datos.model_dump(exclude_unset=True), usuario_id=usuario.id,
    )
    return Resultado(data=GrupoDetalle.model_validate(grupo))
