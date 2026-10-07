"""Protocolos A y B (HCE-PA / HCE-PB, Escala IPPU-TEA) — M11.3-c.

Contrato de respuesta y de error: docstring de `app/routers/__init__.py`. Reglas: `app/services/protocolo.py`
(totales, integridad para firmar, Δ y alerta), `app/services/delta.py` y `app/services/firma.py`.

Mismo trazado que el IDEA: lo que parte del expediente (alta, lista) en `/hce/{hce_id}/protocolo`; lo
que va por id, en `/protocolo/{protocolo_id}`.
"""
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.models.identidad import Profesional
from app.routers.dependencias import (
    hce_visible, protocolo_visible, sesion_lectura, sesion_transaccional, usuario_actual,
)
from app.routers.hce import _ejemplo
from app.schemas.comunes import RespuestaError, Resultado
from app.schemas.idea import AddendaCrear
from app.schemas.protocolo import (
    EJEMPLO_PROTOCOLO, EJEMPLO_RESULTADO_PA_FUERA_DE_SECUENCIA, EJEMPLO_RESULTADO_PB_CON_ALERTA,
    EJEMPLO_RESULTADO_PROTOCOLO, ProtocoloActualizar, ProtocoloCrear, ProtocoloDetalle,
)
from app.services import protocolo as servicio

router_hce = APIRouter(prefix="/hce/{hce_id}/protocolo", tags=["protocolo"], dependencies=[Depends(hce_visible)])
router = APIRouter(prefix="/protocolo", tags=["protocolo"], dependencies=[Depends(protocolo_visible)])
_USUARIO = Annotated[Profesional, Depends(usuario_actual)]

_ERROR_404_HCE = {404: {"model": RespuestaError, "description": "No existe el expediente."}}
_ERROR_404 = {404: {"model": RespuestaError, "description": "No existe el protocolo."}}
_ERROR_422 = {422: {"model": RespuestaError, "description": "Datos inválidos (detalle por campo, p. ej. `items.7.valor`, `ajustes`)."}}
_ERROR_409_FIRMADO = {409: {
    "model": RespuestaError,
    "description": "El protocolo está firmado (`code: signed_module`): no se edita, se corrige por addenda.",
}}
_EJEMPLO_SECUENCIA = {
    "summary": "Fuera de secuencia (PA sin LB firmado)",
    "description": (
        "La secuencia sólo avisa (§5.95): se acepta, `warnings[]` lleva `fuera_de_secuencia` con los eslabones "
        "que faltan y se escribe **una** fila `auditoria` `tipo='excepcion'`. Pasa al crear y al firmar."
    ),
    "value": EJEMPLO_RESULTADO_PA_FUERA_DE_SECUENCIA,
}


def _detalle(db: Session, protocolo) -> ProtocoloDetalle:
    return ProtocoloDetalle.model_validate(servicio.vista(db, protocolo))


@router_hce.post(
    "",
    status_code=201,
    response_model=Resultado[ProtocoloDetalle],
    summary="Alta de un Protocolo A o B",
    responses={
        201: {"content": {"application/json": {"examples": {
            "en_secuencia": {"summary": "En secuencia", "value": EJEMPLO_RESULTADO_PROTOCOLO},
            "fuera_de_secuencia": _EJEMPLO_SECUENCIA,
        }}}},
        **_ERROR_404_HCE, **_ERROR_422,
        409: {"model": RespuestaError, "description": "Ya existe un protocolo de ese tipo y año para el expediente."},
    },
)
def crear(hce_id: int, datos: ProtocoloCrear, db: Annotated[Session, Depends(sesion_transaccional)], usuario: _USUARIO):
    """Uno por `(expediente, tipo, año)`. `items` puede venir parcial. Calcula los totales (cada escala
    y el total **sólo completos**; mientras falte un ítem, `null`). `ajustes` sólo en el B.

    Crear un PA sin el LB del año firmado, o un PB sin el PA firmado, **se acepta** con
    `fuera_de_secuencia` y una fila `excepcion`. Deja una fila `auditoria` `tipo='carga'`.
    """
    protocolo, avisos = servicio.crear_protocolo(db, hce_id, datos.model_dump(exclude_unset=True), usuario_id=usuario.id)
    return Resultado(data=_detalle(db, protocolo), warnings=avisos)


@router_hce.get(
    "",
    response_model=list[ProtocoloDetalle],
    summary="Protocolos del expediente (mayor año primero; A antes que B)",
    responses={**_ejemplo(200, [EJEMPLO_PROTOCOLO]), **_ERROR_404_HCE},
)
def listar(hce_id: int, db: Annotated[Session, Depends(sesion_lectura)]):
    return [_detalle(db, p) for p in servicio.listar_protocolos(db, hce_id)]


@router.get(
    "/{protocolo_id}",
    response_model=ProtocoloDetalle,
    summary="Un protocolo",
    responses={**_ejemplo(200, EJEMPLO_PROTOCOLO), **_ERROR_404},
)
def leer(protocolo_id: int, db: Annotated[Session, Depends(sesion_lectura)]):
    """`interpretacion` y `alertas` se **derivan ahora** del catálogo `delta_interpretacion`: mover
    un tramo cambia la lectura, también de un B firmado (los `deltas` quedan congelados)."""
    return _detalle(db, servicio.obtener_protocolo(db, protocolo_id))


@router.patch(
    "/{protocolo_id}",
    response_model=Resultado[ProtocoloDetalle],
    summary="Edición parcial de un protocolo sin firmar",
    responses={**_ejemplo(200, EJEMPLO_RESULTADO_PROTOCOLO), **_ERROR_404, **_ERROR_422, **_ERROR_409_FIRMADO},
)
def actualizar(
    protocolo_id: int, datos: ProtocoloActualizar, db: Annotated[Session, Depends(sesion_transaccional)],
    usuario: _USUARIO,
):
    """Sólo se tocan las claves presentes; de `items`, sólo los ítems que vengan. **Recalcula** los
    totales. Cada campo que cambia deja una fila de auditoría; de `items`, una por ítem
    (`campo='items.7'`). **409** si está firmado."""
    protocolo = servicio.actualizar_protocolo(db, protocolo_id, datos.model_dump(exclude_unset=True), usuario_id=usuario.id)
    return Resultado(data=_detalle(db, protocolo))


@router.post(
    "/{protocolo_id}/firmar",
    response_model=Resultado[ProtocoloDetalle],
    summary="Firmar el protocolo (un solo acto, bloquea la edición; en el B calcula el Δ)",
    responses={
        200: {"content": {"application/json": {"examples": {
            "sin_avisos": {"summary": "PB en secuencia: Δ +19 (Martín)", "value": EJEMPLO_RESULTADO_PROTOCOLO},
            "fuera_de_secuencia": _EJEMPLO_SECUENCIA,
            "alerta": {
                "summary": "PB con alerta institucional",
                "description": (
                    "El Δ de una escala cae en un tramo `alerta=True` de `delta_interpretacion` (hoy, Δ ≤ −7): "
                    "`alertas` lo lista y se escribe **una** fila `auditoria` `tipo='alerta'`."
                ),
                "value": EJEMPLO_RESULTADO_PB_CON_ALERTA,
            },
        }}}},
        **_ERROR_404,
        422: {"model": RespuestaError, "description": (
            "No se puede firmar: detalle **por campo** — `items.N` (sin puntuar), `items.N.obs` (valor 1 o 5 sin "
            "fundamentación), `fecha`, `sint_tec1`, `sint_tec2`, `evaluador_t1_id` / `evaluador_t2_id`."
        )},
        409: {"model": RespuestaError, "description": "Ya está firmado (`code: signed_module`)."},
    },
)
def firmar(protocolo_id: int, db: Annotated[Session, Depends(sesion_transaccional)], usuario: _USUARIO):
    """**Un solo acto** (como el IDEA): firman los dos evaluadores cargados. Valida la integridad del
    Documento Técnico §4.3 (24 ítems, fecha, obs en los 1 y 5, síntesis de los dos técnicos),
    congela los totales y deja una fila `auditoria` `tipo='firma'`.

    **En el B**, si el A del mismo año está firmado, escribe `deltas` = B − A (total y escalas); si
    no, `deltas` queda `null` y `fuera_de_secuencia` lo explica. Si el Δ de alguna escala cae en un
    tramo con alerta del catálogo, la respuesta trae `alertas` y se escribe una fila `tipo='alerta'`.
    Todo en una transacción. Firmar dos veces es **409**.
    """
    protocolo, avisos = servicio.firmar_protocolo(db, protocolo_id, usuario_id=usuario.id)
    return Resultado(data=_detalle(db, protocolo), warnings=avisos)


@router.post(
    "/{protocolo_id}/addendas",
    status_code=201,
    response_model=Resultado[ProtocoloDetalle],
    summary="Agregar una addenda a un protocolo firmado",
    responses={
        **_ejemplo(201, EJEMPLO_RESULTADO_PROTOCOLO), **_ERROR_404, **_ERROR_422,
        409: {"model": RespuestaError, "description": "El protocolo no está firmado: mientras no lo esté se edita directamente."},
    },
)
def agregar_addenda(
    protocolo_id: int, datos: AddendaCrear, db: Annotated[Session, Depends(sesion_transaccional)], usuario: _USUARIO,
):
    """Única forma de corregir un protocolo firmado: agrega `{texto, profesional_id, fecha}` y deja
    una fila `auditoria` `tipo='addenda'`. No modifica ningún dato del protocolo."""
    protocolo = servicio.agregar_addenda(
        db, protocolo_id, texto=datos.texto, profesional_id=usuario.id, usuario_id=usuario.id,
    )
    return Resultado(data=_detalle(db, protocolo))
