"""Estado de flujo y consentimiento (HCE-CI) — M11.3-b.

Contrato de respuesta y de error: docstring de `app/routers/__init__.py`. Reglas: `app/services/flujo.py`
y `app/services/consentimiento.py`.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.models.identidad import Profesional
from app.routers.dependencias import hce_visible, sesion_lectura, sesion_transaccional, usuario_actual
from app.routers.hce import _ejemplo
from app.schemas.comunes import RespuestaError, Resultado
from app.schemas.consentimiento import (
    EJEMPLO_CI, EJEMPLO_RESULTADO_CI, ConsentimientoActualizar, ConsentimientoCrear,
    ConsentimientoDetalle,
)
from app.schemas.flujo import EJEMPLO_FLUJO, FlujoDetalle
from app.services import consentimiento as servicio_ci
from app.services import flujo as servicio_flujo

router = APIRouter(prefix="/hce/{hce_id}", tags=["flujo"], dependencies=[Depends(hce_visible)])
_USUARIO = Annotated[Profesional, Depends(usuario_actual)]

_ERROR_404 = {404: {"model": RespuestaError, "description": "No existe el expediente."}}
_ERROR_404_CI = {404: {"model": RespuestaError, "description": "No existe el expediente o todavía no tiene CI registrado."}}
_ERROR_422 = {422: {"model": RespuestaError, "description": "Datos inválidos (detalle por campo)."}}


@router.get(
    "/flujo",
    response_model=FlujoDetalle,
    summary="Estado de flujo del expediente en un año",
    responses={**_ejemplo(200, EJEMPLO_FLUJO), **_ERROR_404, **_ERROR_422},
)
def flujo(
    hce_id: int,
    db: Annotated[Session, Depends(sesion_lectura)],
    anio: Annotated[int | None, Query(ge=1, le=32767, description="Año de la cadena; por omisión el año en curso.")] = None,
):
    """El **CI** (`pendiente` | `registrado`, una vez por HCE) y los cuatro eslabones del año
    —LB → PA → PB → IC— con su `estado` (`sin_iniciar` | `en_curso` | `firmado`) y, para cada uno,
    los `faltantes`: los eslabones anteriores sin firmar.

    **Todo es derivado** (no hay un estado guardado) y **nada de esto traba**: la secuencia sólo
    avisa y el CI pendiente es un estado visible, no un error (§5.94 · §5.95 · §5.96).
    """
    return FlujoDetalle.model_validate(servicio_flujo.flujo_del_anio(db, hce_id, anio))


@router.get(
    "/consentimiento",
    response_model=ConsentimientoDetalle,
    summary="Consentimiento informado (CI) del expediente",
    responses={**_ejemplo(200, EJEMPLO_CI), **_ERROR_404_CI},
)
def leer_consentimiento(hce_id: int, db: Annotated[Session, Depends(sesion_lectura)]):
    """**404** mientras el CI no esté registrado («CI pendiente»); no es un error del cliente sino el estado."""
    return ConsentimientoDetalle.model_validate(servicio_ci.obtener_consentimiento(db, hce_id))


@router.post(
    "/consentimiento",
    status_code=201,
    response_model=Resultado[ConsentimientoDetalle],
    summary="Registrar el consentimiento informado",
    responses={
        **_ejemplo(201, EJEMPLO_RESULTADO_CI), **_ERROR_404, **_ERROR_422,
        409: {"model": RespuestaError, "description": "El expediente ya tiene el CI registrado."},
    },
)
def registrar_consentimiento(
    hce_id: int, datos: ConsentimientoCrear, db: Annotated[Session, Depends(sesion_transaccional)], usuario: _USUARIO,
):
    """Una vez por expediente. **No traba nada**: registrarlo pasa el estado del CI de `pendiente`
    a `registrado` y nada más. `firmante` y `fecha` son obligatorios; `autorizaciones`, si viene,
    trae las tres. Deja una fila de `auditoria` `tipo='carga'`.
    """
    ci = servicio_ci.registrar_consentimiento(db, hce_id, datos.model_dump(exclude_unset=True), usuario_id=usuario.id)
    return Resultado(data=ConsentimientoDetalle.model_validate(ci))


@router.patch(
    "/consentimiento",
    response_model=Resultado[ConsentimientoDetalle],
    summary="Edición parcial del consentimiento",
    responses={**_ejemplo(200, EJEMPLO_RESULTADO_CI), **_ERROR_404_CI, **_ERROR_422},
)
def actualizar_consentimiento(
    hce_id: int, datos: ConsentimientoActualizar, db: Annotated[Session, Depends(sesion_transaccional)], usuario: _USUARIO,
):
    """Sólo se tocan las claves presentes. Cada campo que cambia deja **una fila** de auditoría
    (`campo`, valor anterior y nuevo); si nada cambió, ninguna."""
    ci = servicio_ci.actualizar_consentimiento(db, hce_id, datos.model_dump(exclude_unset=True), usuario_id=usuario.id)
    return Resultado(data=ConsentimientoDetalle.model_validate(ci))
