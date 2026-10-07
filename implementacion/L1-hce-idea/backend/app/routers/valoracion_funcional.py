"""HCE-VF · valoración funcional — M11.3-d1.

Contrato de respuesta y de error: docstring de `app/routers/__init__.py`. Reglas:
`app/services/valoracion_funcional.py` (categoría sólo desde `pct`, alerta de vigencia).
Una por expediente, así que va colgada de él: `/hce/{hce_id}/valoracion-funcional`.
"""
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.models.identidad import Profesional
from app.routers.dependencias import hce_visible, sesion_lectura, sesion_transaccional, usuario_actual
from app.routers.hce import _ejemplo
from app.schemas.comunes import RespuestaError, Resultado
from app.schemas.valoracion_funcional import EJEMPLO_RESULTADO_VF, EJEMPLO_VF, VfActualizar, VfCrear, VfDetalle
from app.services import valoracion_funcional as servicio

router = APIRouter(
    prefix="/hce/{hce_id}/valoracion-funcional", tags=["valoración funcional"], dependencies=[Depends(hce_visible)],
)
_USUARIO = Annotated[Profesional, Depends(usuario_actual)]
_ERROR_404 = {404: {"model": RespuestaError, "description": "No existe el expediente o todavía no tiene VF."}}
_ERROR_422 = {422: {"model": RespuestaError, "description": (
    "Datos inválidos (detalle por campo: `pct`, `vigencia`, `dominios.<dominio>`), o un campo que la VF no tiene "
    "—`categoria_id`, un puntaje— (la categoría la deriva el servidor sólo de `pct`)."
)}}


@router.post(
    "",
    status_code=201,
    response_model=Resultado[VfDetalle],
    summary="Registrar la valoración funcional",
    responses={
        **_ejemplo(201, EJEMPLO_RESULTADO_VF), **_ERROR_404, **_ERROR_422,
        409: {"model": RespuestaError, "description": "El expediente ya tiene VF: se edita con PATCH."},
    },
)
def crear(hce_id: int, datos: VfCrear, db: Annotated[Session, Depends(sesion_transaccional)], usuario: _USUARIO):
    """Una por expediente. La **categoría del baremo** se deriva de `pct` contra `baremo_categoria`
    (`pct` `null` → «No corresponde»). Deja una fila `auditoria` `tipo='carga'`."""
    vf = servicio.crear_vf(db, hce_id, datos.model_dump(exclude_unset=True), usuario_id=usuario.id)
    return Resultado(data=VfDetalle.model_validate(servicio.vista(vf)))


@router.get(
    "",
    response_model=VfDetalle,
    summary="La valoración funcional del expediente",
    responses={**_ejemplo(200, EJEMPLO_VF), **_ERROR_404},
)
def leer(hce_id: int, db: Annotated[Session, Depends(sesion_lectura)]):
    """`categoria` y `alerta_vigencia` se derivan **ahora**: mover un corte del baremo o que pase
    el tiempo cambia lo que se lee, sin escribir nada."""
    return VfDetalle.model_validate(servicio.vista(servicio.obtener_vf(db, hce_id)))


@router.patch(
    "",
    response_model=Resultado[VfDetalle],
    summary="Edición parcial de la valoración funcional",
    responses={**_ejemplo(200, EJEMPLO_RESULTADO_VF), **_ERROR_404, **_ERROR_422},
)
def actualizar(hce_id: int, datos: VfActualizar, db: Annotated[Session, Depends(sesion_transaccional)], usuario: _USUARIO):
    """La VF no se firma: siempre es editable. Sólo se tocan las claves presentes; si cambia `pct`, se
    re-deriva la categoría. Una fila de auditoría por campo que cambió (`dominios.<dominio>` por dominio,
    y `categoria_id` si el `pct` nuevo la mueve)."""
    vf = servicio.actualizar_vf(db, hce_id, datos.model_dump(exclude_unset=True), usuario_id=usuario.id)
    return Resultado(data=VfDetalle.model_validate(servicio.vista(vf)))
