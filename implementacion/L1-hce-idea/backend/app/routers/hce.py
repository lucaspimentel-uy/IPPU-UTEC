"""Expediente (HCE-00) y persona — M11.3-a.

Contrato de respuesta y de error: docstring de `app/routers/__init__.py`.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.routers.dependencias import sesion_transaccional
from app.schemas.comunes import RespuestaError, Resultado
from app.schemas.hce import (
    EJEMPLO_RESULTADO_HCE, EJEMPLO_RESUMEN_HCE, HceActualizar, HceCrear, HceDetalle, HceResumen,
)
from app.services import hce as servicio

router = APIRouter(prefix="/hce", tags=["hce"])

_ERROR_404 = {404: {"model": RespuestaError, "description": "No existe el expediente."}}
_ERROR_422 = {422: {"model": RespuestaError, "description": "Datos inválidos (detalle por campo)."}}
_ERROR_409_CI = {409: {"model": RespuestaError, "description": "Ya existe una persona con esa cédula."}}


def _ejemplo(status: int, cuerpo) -> dict:
    return {status: {"content": {"application/json": {"example": cuerpo}}}}


@router.post(
    "",
    status_code=201,
    response_model=Resultado[HceDetalle],
    summary="Alta de persona + expediente",
    responses={**_ejemplo(201, EJEMPLO_RESULTADO_HCE), **_ERROR_422, **_ERROR_409_CI},
)
def crear(datos: HceCrear, db: Annotated[Session, Depends(sesion_transaccional)]):
    """Crea la persona y su expediente en **una sola transacción**.

    - **422** si falta un obligatorio, hay uno en blanco o el `grupo_id` no existe.
    - **409** si ya hay una persona con esa cédula (se compara sin puntos, guiones
      ni espacios).
    - Un texto opcional vacío o en blanco se guarda como `NULL`.
    - `hc_historico` es opcional y se guarda como llega (no hay regla de asignación
      documentada).
    """
    cuerpo = datos.model_dump()
    persona = cuerpo.pop("persona")
    expediente = servicio.crear_hce(db, persona=persona, hce=cuerpo)
    return Resultado(data=HceDetalle.model_validate(expediente))


@router.get(
    "",
    response_model=list[HceResumen],
    summary="Búsqueda de expedientes",
    responses={**_ejemplo(200, EJEMPLO_RESUMEN_HCE), **_ERROR_422},
)
def buscar(
    db: Annotated[Session, Depends(sesion_transaccional)],
    ci: Annotated[str | None, Query(description="Cédula: contiene, sin puntos ni guiones.")] = None,
    numero: Annotated[str | None, Query(description="N.º de expediente o N.º de historia anterior (igual).")] = None,
    grupo: Annotated[str | None, Query(description="Nombre del grupo (igual; sin mayúsculas ni acentos).")] = None,
    nombre: Annotated[str | None, Query(description="Nombre y/o apellido: contiene; sin mayúsculas ni acentos.")] = None,
):
    """Las **tres vías institucionales** —cédula, N.º de historia, grupo— más el
    nombre (Documento Técnico, línea 66). Los filtros se combinan con **Y**; sin
    filtros devuelve todos. Una lista vacía es un resultado válido, no un error.
    """
    return [
        HceResumen.model_validate(h)
        for h in servicio.buscar_hce(db, ci=ci, numero=numero, grupo=grupo, nombre=nombre)
    ]


@router.get(
    "/{hce_id}",
    response_model=HceDetalle,
    summary="Un expediente con su persona",
    responses={**_ejemplo(200, EJEMPLO_RESULTADO_HCE["data"]), **_ERROR_404},
)
def leer(hce_id: int, db: Annotated[Session, Depends(sesion_transaccional)]):
    return HceDetalle.model_validate(servicio.obtener_hce(db, hce_id))


@router.patch(
    "/{hce_id}",
    response_model=Resultado[HceDetalle],
    summary="Edición parcial de HCE-00",
    responses={**_ejemplo(200, EJEMPLO_RESULTADO_HCE), **_ERROR_404, **_ERROR_422, **_ERROR_409_CI},
)
def actualizar(hce_id: int, datos: HceActualizar, db: Annotated[Session, Depends(sesion_transaccional)]):
    """HCE-00 **siempre es editable** (sin firma). Sólo se tocan las claves que
    vienen en el cuerpo. Cada campo que realmente cambia deja **una fila** en
    `auditoria` (`campo`, valor anterior y nuevo); si nada cambió, no se escribe
    ninguna.
    """
    cuerpo = datos.model_dump(exclude_unset=True)
    persona = cuerpo.pop("persona", None)
    expediente = servicio.actualizar_hce_00(db, hce_id, persona=persona, hce=cuerpo)
    return Resultado(data=HceDetalle.model_validate(expediente))
