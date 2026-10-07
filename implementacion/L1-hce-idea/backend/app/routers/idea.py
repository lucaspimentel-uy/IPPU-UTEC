"""IDEA (HCE-LB) — M11.3-b.

Contrato de respuesta y de error: docstring de `app/routers/__init__.py`. Reglas: `app/services/idea.py`
(totales, banda, validaciones de firma, qué IDEA rige) y `app/services/firma.py` (firma = bloqueo, addendas).

Las lecturas y las ediciones por id van en `/idea/{idea_id}`; las que parten del expediente (alta,
lista, «cuál rige»), en `/hce/{hce_id}/idea`.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.models.identidad import Profesional
from app.routers.dependencias import hce_visible, idea_visible, sesion_lectura, sesion_transaccional, usuario_actual
from app.routers.hce import _ejemplo
from app.schemas.comunes import RespuestaError, Resultado
from app.schemas.idea import (
    EJEMPLO_DELTA_IDEA, EJEMPLO_IDEA, EJEMPLO_RESULTADO_IDEA, EJEMPLO_RESULTADO_IDEA_CON_RECOMENDACION,
    EJEMPLO_VIGENTE, AddendaCrear, IdeaActualizar, IdeaCrear, IdeaDelta, IdeaDetalle, IdeaVigente,
)
from app.services import fechas
from app.services import idea as servicio

router_hce = APIRouter(prefix="/hce/{hce_id}/idea", tags=["idea"], dependencies=[Depends(hce_visible)])
router = APIRouter(prefix="/idea", tags=["idea"], dependencies=[Depends(idea_visible)])
_USUARIO = Annotated[Profesional, Depends(usuario_actual)]

_ERROR_404_HCE = {404: {"model": RespuestaError, "description": "No existe el expediente."}}
_ERROR_404 = {404: {"model": RespuestaError, "description": "No existe el IDEA."}}
_ERROR_422 = {422: {"model": RespuestaError, "description": "Datos inválidos (detalle por campo, p. ej. `dim.D5.valor`)."}}
_ERROR_409_FIRMADO = {409: {
    "model": RespuestaError,
    "description": "El IDEA está firmado (`code: signed_module`): no se edita, se corrige por addenda.",
}}


@router_hce.post(
    "",
    status_code=201,
    response_model=Resultado[IdeaDetalle],
    summary="Alta del IDEA de un año",
    responses={
        **_ejemplo(201, EJEMPLO_RESULTADO_IDEA), **_ERROR_404_HCE, **_ERROR_422,
        409: {"model": RespuestaError, "description": "Ya existe un IDEA de ese año para el expediente."},
    },
)
def crear(hce_id: int, datos: IdeaCrear, db: Annotated[Session, Depends(sesion_transaccional)], usuario: _USUARIO):
    """Un IDEA por `(expediente, año)`. `anio` es obligatorio; `dim` puede venir parcial (las
    dimensiones se completan con PATCH). Calcula `total` y las 4 escalas.

    LB es el primer eslabón de la cadena, así que crear un IDEA **no produce avisos de secuencia**;
    el CI pendiente tampoco avisa (es sólo un estado visible, §5.94). Deja una fila `auditoria`
    `tipo='carga'`.
    """
    idea, avisos = servicio.crear_idea(db, hce_id, datos.model_dump(exclude_unset=True), usuario_id=usuario.id)
    return Resultado(data=IdeaDetalle.model_validate(servicio.vista(db, idea)), warnings=avisos)


@router_hce.get(
    "",
    response_model=list[IdeaDetalle],
    summary="IDEA del expediente, el de mayor año primero",
    responses={**_ejemplo(200, [EJEMPLO_IDEA]), **_ERROR_404_HCE},
)
def listar(hce_id: int, db: Annotated[Session, Depends(sesion_lectura)]):
    return [IdeaDetalle.model_validate(servicio.vista(db, i)) for i in servicio.listar_ideas(db, hce_id)]


@router_hce.get(
    "/vigente",
    response_model=IdeaVigente,
    summary="Qué IDEA rige en la HCE",
    responses={**_ejemplo(200, EJEMPLO_VIGENTE), **_ERROR_404_HCE},
)
def vigente(hce_id: int, db: Annotated[Session, Depends(sesion_lectura)]):
    """§5.97 — `vigente`: el IDEA **firmado de mayor `anio`**. `en_curso`: el **sin firmar del año
    en curso**, aparte; no desplaza al vigente. Cualquiera de los dos puede ser `null`. (Un documento
    o informe viejo muestra el IDEA de **su** año: `GET /hce/{id}/idea` y elegir por `anio`.)"""
    resultado = servicio.idea_vigente(db, hce_id)
    return IdeaVigente(**{
        clave: IdeaDetalle.model_validate(servicio.vista(db, i)) if i is not None else None
        for clave, i in resultado.items()
    })


@router_hce.get(
    "/delta",
    response_model=IdeaDelta,
    summary="Δ interanual del IDEA",
    responses={**_ejemplo(200, EJEMPLO_DELTA_IDEA), **_ERROR_404_HCE, **_ERROR_422},
)
def delta_interanual(
    hce_id: int,
    db: Annotated[Session, Depends(sesion_lectura)],
    anio: Annotated[int | None, Query(ge=2, le=32767, description="Año del IDEA actual; por omisión el año en curso.")] = None,
):
    """El IDEA **firmado** de `anio` menos el **firmado** de `anio − 1` (Δ sólo dentro del mismo
    instrumento, §5.36). Se calcula al leer; `delta` es `null` si falta alguno de los dos. En el
    IDEA menor es mejor: un Δ negativo es una mejora. **No** tiene interpretación ni alerta."""
    anio = anio if anio is not None else fechas.anio_actual()
    return IdeaDelta.model_validate(servicio.delta_interanual(db, hce_id, anio))


@router.get(
    "/{idea_id}",
    response_model=IdeaDetalle,
    summary="Un IDEA",
    responses={**_ejemplo(200, EJEMPLO_IDEA), **_ERROR_404},
)
def leer(idea_id: int, db: Annotated[Session, Depends(sesion_lectura)]):
    """Incluye `banda`, **derivada ahora** del catálogo `banda_idea`: mover un corte cambia la
    banda devuelta, también para un IDEA firmado (el `total` queda congelado; la banda no se guarda)."""
    return IdeaDetalle.model_validate(servicio.vista(db, servicio.obtener_idea(db, idea_id)))


@router.patch(
    "/{idea_id}",
    response_model=Resultado[IdeaDetalle],
    summary="Edición parcial de un IDEA sin firmar",
    responses={**_ejemplo(200, EJEMPLO_RESULTADO_IDEA), **_ERROR_404, **_ERROR_422, **_ERROR_409_FIRMADO},
)
def actualizar(idea_id: int, datos: IdeaActualizar, db: Annotated[Session, Depends(sesion_transaccional)], usuario: _USUARIO):
    """Sólo se tocan las claves presentes; de `dim`, sólo las dimensiones que vengan. **Recalcula**
    `total` y `esc_a`…`esc_d` (sin las dimensiones `NS` ni las vacías). Cada campo que cambia deja
    **una fila** de auditoría; de `dim`, una por dimensión (`campo='dim.D5'`); un PATCH idéntico no
    deja ninguna. **409** si el IDEA está firmado."""
    idea = servicio.actualizar_idea(db, idea_id, datos.model_dump(exclude_unset=True), usuario_id=usuario.id)
    return Resultado(data=IdeaDetalle.model_validate(servicio.vista(db, idea)))


@router.post(
    "/{idea_id}/firmar",
    response_model=Resultado[IdeaDetalle],
    summary="Firmar el IDEA (un solo acto, bloquea la edición)",
    responses={
        200: {"content": {"application/json": {"examples": {
            "sin_avisos": {"summary": "Firma en secuencia", "value": EJEMPLO_RESULTADO_IDEA},
            "recomendacion_no_cumplida": {
                "summary": "Firma con un recomendado del §4.3 sin cumplir",
                "description": (
                    "Menos de 5 sesiones previas o una síntesis muy por debajo de las ≈200 palabras sugeridas: "
                    "la firma se acepta y `warnings[]` lleva un `recomendacion_no_cumplida` por cada uno. "
                    "No bloquea, no pide constancia y no deja fila de auditoría (§5.117 a)."
                ),
                "value": EJEMPLO_RESULTADO_IDEA_CON_RECOMENDACION,
            },
        }}}},
        **_ERROR_404,
        422: {"model": RespuestaError, "description": (
            "No se puede firmar: detalle **por campo** de todo lo que falta — `dim.Dn` (falta o está en `NS`), "
            "`fecha_consenso`, `sintesis`, `objetivos`, `evaluador_t1_id` / `evaluador_t2_id` (falta, igual o inactivo)."
        )},
        409: {"model": RespuestaError, "description": "Ya está firmado (`code: signed_module`)."},
    },
)
def firmar(idea_id: int, db: Annotated[Session, Depends(sesion_transaccional)], usuario: _USUARIO):
    """**Un solo acto** (§5.98: un único puntaje de consenso, acordado en persona): firman los dos
    evaluadores ya cargados en el IDEA. Valida la integridad del Documento Técnico §4.3, recalcula y
    **congela** `total` y escalas, escribe `manual_version` y `firmas` (`{profesional_id, rol, fecha}`
    de los dos) y deja una fila `auditoria` `tipo='firma'` — todo en una transacción. Firmar dos veces
    es **409**. Los **recomendados** del §4.3 (≥ 5 sesiones previas, síntesis de ≈200 palabras) no
    bloquean: si no se cumplen, `warnings[]` lleva `recomendacion_no_cumplida` (§5.117 a).
    """
    idea, avisos = servicio.firmar_idea(db, idea_id, usuario_id=usuario.id)
    return Resultado(data=IdeaDetalle.model_validate(servicio.vista(db, idea)), warnings=avisos)


@router.post(
    "/{idea_id}/addendas",
    status_code=201,
    response_model=Resultado[IdeaDetalle],
    summary="Agregar una addenda a un IDEA firmado",
    responses={
        **_ejemplo(201, EJEMPLO_RESULTADO_IDEA), **_ERROR_404, **_ERROR_422,
        409: {"model": RespuestaError, "description": "El IDEA no está firmado: mientras no lo esté se edita directamente."},
    },
)
def agregar_addenda(
    idea_id: int, datos: AddendaCrear, db: Annotated[Session, Depends(sesion_transaccional)], usuario: _USUARIO,
):
    """Es la única forma de corregir un IDEA firmado (§4.1): agrega `{texto, profesional_id, fecha}` a
    `addendas` y deja una fila `auditoria` `tipo='addenda'`. No modifica ningún dato del IDEA."""
    idea = servicio.agregar_addenda(
        db, idea_id, texto=datos.texto, profesional_id=usuario.id, usuario_id=usuario.id,
    )
    return Resultado(data=IdeaDetalle.model_validate(servicio.vista(db, idea)))
