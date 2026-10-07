"""Informe de Cierre Anual (HCE-IC) — M11.3-c.

Contrato de respuesta y de error: docstring de `app/routers/__init__.py`. Reglas:
`app/services/informe_cierre.py` (integridad, firma con dos profesionales, recibí, documento).
"""
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.models.identidad import Profesional
from app.routers.dependencias import (
    hce_visible, informe_visible, sesion_lectura, sesion_transaccional, usuario_actual,
)
from app.routers.hce import _ejemplo
from app.schemas.comunes import RespuestaError, Resultado
from app.schemas.idea import AddendaCrear
from app.schemas.informe_cierre import (
    EJEMPLO_DOCUMENTO, EJEMPLO_IC, EJEMPLO_RESULTADO_IC, InformeActualizar, InformeCrear,
    InformeDetalle, InformeDocumento, InformeFirmar, RecibiCrear,
)
from app.services import informe_cierre as servicio

router_hce = APIRouter(prefix="/hce/{hce_id}/informe-cierre", tags=["informe de cierre"], dependencies=[Depends(hce_visible)])
router = APIRouter(prefix="/informe-cierre", tags=["informe de cierre"], dependencies=[Depends(informe_visible)])
_USUARIO = Annotated[Profesional, Depends(usuario_actual)]

_ERROR_404_HCE = {404: {"model": RespuestaError, "description": "No existe el expediente."}}
_ERROR_404 = {404: {"model": RespuestaError, "description": "No existe el informe de cierre."}}
_ERROR_422 = {422: {"model": RespuestaError, "description": "Datos inválidos (detalle por campo, p. ej. `sint_escala.esc_5`)."}}


def _detalle(informe) -> InformeDetalle:
    return InformeDetalle.model_validate(servicio.vista(informe))


@router_hce.post(
    "",
    status_code=201,
    response_model=Resultado[InformeDetalle],
    summary="Alta del informe de cierre de un año",
    responses={
        **_ejemplo(201, EJEMPLO_RESULTADO_IC), **_ERROR_404_HCE, **_ERROR_422,
        409: {"model": RespuestaError, "description": "Ya existe un informe de cierre de ese año para el expediente."},
    },
)
def crear(hce_id: int, datos: InformeCrear, db: Annotated[Session, Depends(sesion_transaccional)], usuario: _USUARIO):
    """Uno por `(expediente, año)`. Crear el IC sin LB, PA o PB del año firmados **se acepta** con
    `fuera_de_secuencia` y una fila `excepcion`. Deja una fila `auditoria` `tipo='carga'`."""
    informe, avisos = servicio.crear_informe(db, hce_id, datos.model_dump(exclude_unset=True), usuario_id=usuario.id)
    return Resultado(data=_detalle(informe), warnings=avisos)


@router_hce.get(
    "",
    response_model=list[InformeDetalle],
    summary="Informes de cierre del expediente, el de mayor año primero",
    responses={**_ejemplo(200, [EJEMPLO_IC]), **_ERROR_404_HCE},
)
def listar(hce_id: int, db: Annotated[Session, Depends(sesion_lectura)]):
    return [_detalle(i) for i in servicio.listar_informes(db, hce_id)]


@router.get(
    "/{informe_id}",
    response_model=InformeDetalle,
    summary="Un informe de cierre",
    responses={**_ejemplo(200, EJEMPLO_IC), **_ERROR_404},
)
def leer(informe_id: int, db: Annotated[Session, Depends(sesion_lectura)]):
    return _detalle(servicio.obtener_informe(db, informe_id))


@router.patch(
    "/{informe_id}",
    response_model=Resultado[InformeDetalle],
    summary="Edición parcial de un informe de cierre sin firmar",
    responses={
        **_ejemplo(200, EJEMPLO_RESULTADO_IC), **_ERROR_404, **_ERROR_422,
        409: {"model": RespuestaError, "description": "Está firmado (`code: signed_module`): se corrige por addenda."},
    },
)
def actualizar(
    informe_id: int, datos: InformeActualizar, db: Annotated[Session, Depends(sesion_transaccional)], usuario: _USUARIO,
):
    """Sólo se tocan las claves presentes; de `sint_escala`, sólo las escalas que vengan (una fila de
    auditoría `sint_escala.esc_N` por escala cambiada). El recibí **no** va por acá: `/recibi`."""
    informe = servicio.actualizar_informe(db, informe_id, datos.model_dump(exclude_unset=True), usuario_id=usuario.id)
    return Resultado(data=_detalle(informe))


@router.post(
    "/{informe_id}/firmar",
    response_model=Resultado[InformeDetalle],
    summary="Firmar el informe de cierre (dos profesionales, un solo acto)",
    responses={
        **_ejemplo(200, EJEMPLO_RESULTADO_IC), **_ERROR_404,
        422: {"model": RespuestaError, "description": (
            "No se puede firmar: `sint_escala.esc_N`, `val_tec1`, `val_tec2`, `recomendaciones`, `orientaciones`, "
            "`fecha` (Documento Técnico §4.3) o `firmantes` (no son dos, son iguales, no existen o no están activos)."
        )},
        409: {"model": RespuestaError, "description": "Ya está firmado (`code: signed_module`)."},
    },
)
def firmar(informe_id: int, datos: InformeFirmar, db: Annotated[Session, Depends(sesion_transaccional)], usuario: _USUARIO):
    """El IC no tiene evaluadores propios: el cuerpo trae los **dos** `profesional_id` que firman,
    distintos y activos (§5.117 b). LB, PA o PB sin firmar **no bloquean**: avisan con
    `fuera_de_secuencia` y dejan una fila `excepcion`. Deja una fila `auditoria` `tipo='firma'`."""
    informe, avisos = servicio.firmar_informe(db, informe_id, datos.firmantes, usuario_id=usuario.id)
    return Resultado(data=_detalle(informe), warnings=avisos)


@router.post(
    "/{informe_id}/addendas",
    status_code=201,
    response_model=Resultado[InformeDetalle],
    summary="Agregar una addenda a un informe de cierre firmado",
    responses={
        **_ejemplo(201, EJEMPLO_RESULTADO_IC), **_ERROR_404, **_ERROR_422,
        409: {"model": RespuestaError, "description": "No está firmado: mientras no lo esté se edita directamente."},
    },
)
def agregar_addenda(
    informe_id: int, datos: AddendaCrear, db: Annotated[Session, Depends(sesion_transaccional)], usuario: _USUARIO,
):
    informe = servicio.agregar_addenda(
        db, informe_id, texto=datos.texto, profesional_id=datos.profesional_id, usuario_id=usuario.id,
    )
    return Resultado(data=_detalle(informe))


@router.post(
    "/{informe_id}/recibi",
    status_code=201,
    response_model=Resultado[InformeDetalle],
    summary="Registrar el recibí de la familia",
    responses={
        **_ejemplo(201, EJEMPLO_RESULTADO_IC), **_ERROR_404,
        422: {"model": RespuestaError, "description": "Falta `firmante` o `fecha`."},
        409: {"model": RespuestaError, "description": "El informe no está firmado, o el recibí ya está registrado."},
    },
)
def registrar_recibi(
    informe_id: int, datos: RecibiCrear, db: Annotated[Session, Depends(sesion_transaccional)], usuario: _USUARIO,
):
    """`{firmante, fecha}` de la familia, **después** de la firma y **una sola vez** (§5.117 e). Registra
    la entrega: no edita el contenido firmado. Deja una fila `auditoria` `tipo='carga'`."""
    informe = servicio.registrar_recibi(db, informe_id, datos.model_dump(), usuario_id=usuario.id)
    return Resultado(data=_detalle(informe))


@router.get(
    "/{informe_id}/documento",
    response_model=InformeDocumento,
    summary="Datos del informe imprimible (sólo IC firmado)",
    responses={
        **_ejemplo(200, EJEMPLO_DOCUMENTO), **_ERROR_404,
        409: {"model": RespuestaError, "description": "El informe no está firmado: no hay informe (§5.3, informe único)."},
    },
)
def documento(informe_id: int, db: Annotated[Session, Depends(sesion_lectura)]):
    """Todo lo que el frontend necesita para imprimir el informe (§5.102: sin PDF en el servidor):
    cabecera del expediente (N.º de HC, nombre, grupo), el IDEA **del año del informe** (§5.97;
    con `firmado` explícito), PA/PB con totales, Δ, interpretación y alertas, y el contenido, las
    firmas (con nombre), las addendas y el recibí del IC."""
    return InformeDocumento.model_validate(servicio.documento(db, informe_id))
