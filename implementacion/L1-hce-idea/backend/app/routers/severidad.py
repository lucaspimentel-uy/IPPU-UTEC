"""HCE-SEV · severidad DSM-5-TR — C2.

Contrato de respuesta y de error: docstring de `app/routers/__init__.py`. Reglas:
`app/services/severidad.py` (entero o nada, autor = usuario del token, etiquetas resueltas al leer).
Una por expediente, así que va colgada de él: `/hce/{hce_id}/severidad`. El catálogo de los tres
grados, `GET /severidad-niveles`, es de sólo lectura y lo ve cualquier usuario autenticado.
"""
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.models.identidad import Profesional
from app.routers.dependencias import hce_visible, sesion_lectura, sesion_transaccional, usuario_actual
from app.routers.hce import _ejemplo
from app.schemas.comunes import RespuestaError, Resultado
from app.schemas.severidad import (
    EJEMPLO_NIVELES, EJEMPLO_RESULTADO_SEV, EJEMPLO_SEV, SeveridadActualizar, SeveridadCrear, SeveridadDetalle,
    SeveridadNivelDetalle,
)
from app.services import severidad as servicio

router_hce = APIRouter(prefix="/hce/{hce_id}/severidad", tags=["severidad"], dependencies=[Depends(hce_visible)])
router_niveles = APIRouter(prefix="/severidad-niveles", tags=["severidad"])
_USUARIO = Annotated[Profesional, Depends(usuario_actual)]

_ERROR_404 = {404: {"model": RespuestaError, "description": "No existe el expediente o todavía no tiene severidad registrada."}}
_ERROR_422 = {422: {"model": RespuestaError, "description": (
    "Datos inválidos (detalle por campo: `nivel_cs`, `nivel_crr`, `justificacion`, `fecha`), o un campo que el "
    "registro no tiene —`profesional_id` (el autor es el usuario del token), una etiqueta, un puntaje—."
)}}


@router_niveles.get(
    "", response_model=list[SeveridadNivelDetalle], summary="Los tres grados DSM-5-TR",
    responses=_ejemplo(200, EJEMPLO_NIVELES),
)
def listar_niveles(db: Annotated[Session, Depends(sesion_lectura)]):
    """Tabla de referencia del módulo: por grado (1–3), su etiqueta, el descriptor de cada dominio y
    los apoyos que **orienta** (no determina prestaciones ni elegibilidad)."""
    return [SeveridadNivelDetalle.model_validate(n) for n in servicio.listar_niveles(db)]


@router_hce.get(
    "", response_model=SeveridadDetalle, summary="La severidad DSM-5-TR del expediente",
    responses={**_ejemplo(200, EJEMPLO_SEV), **_ERROR_404},
)
def leer(hce_id: int, db: Annotated[Session, Depends(sesion_lectura)]):
    """**404** mientras no esté registrada: es un estado, no un error del cliente. Las etiquetas se
    resuelven al leer contra `severidad_nivel`."""
    return SeveridadDetalle.model_validate(servicio.vista(db, servicio.obtener_severidad(db, hce_id)))


@router_hce.post(
    "",
    status_code=201,
    response_model=Resultado[SeveridadDetalle],
    summary="Registrar la severidad DSM-5-TR",
    responses={
        **_ejemplo(201, EJEMPLO_RESULTADO_SEV), **_ERROR_404, **_ERROR_422,
        409: {"model": RespuestaError, "description": "El expediente ya tiene severidad: se edita con PATCH."},
    },
)
def registrar(hce_id: int, datos: SeveridadCrear, db: Annotated[Session, Depends(sesion_transaccional)], usuario: _USUARIO):
    """Una por expediente, **entera**: los dos dominios, la justificación y la fecha. El autor es el
    usuario del token. Deja una fila de `auditoria` `tipo='carga'`."""
    sev = servicio.registrar_severidad(db, hce_id, datos.model_dump(exclude_unset=True), profesional_id=usuario.id)
    return Resultado(data=SeveridadDetalle.model_validate(servicio.vista(db, sev)))


@router_hce.patch(
    "",
    response_model=Resultado[SeveridadDetalle],
    summary="Edición parcial de la severidad",
    responses={**_ejemplo(200, EJEMPLO_RESULTADO_SEV), **_ERROR_404, **_ERROR_422},
)
def actualizar(hce_id: int, datos: SeveridadActualizar, db: Annotated[Session, Depends(sesion_transaccional)], usuario: _USUARIO):
    """Sin firma: siempre editable. Sólo se tocan las claves presentes (`null` o blanco es 422). Si algo
    cambia, el autor pasa a ser quien edita, y cada campo que cambió deja **una fila** de auditoría con
    el valor anterior y el nuevo (también `profesional_id`); si nada cambió, ninguna."""
    sev = servicio.actualizar_severidad(db, hce_id, datos.model_dump(exclude_unset=True), profesional_id=usuario.id)
    return Resultado(data=SeveridadDetalle.model_validate(servicio.vista(db, sev)))
