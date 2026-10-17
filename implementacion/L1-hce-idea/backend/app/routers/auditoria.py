"""Rastro de cambios del expediente (HCE-LOG), sólo lectura — C1.

Contrato de respuesta y de error: docstring de `app/routers/__init__.py`. Reglas: `app/services/auditoria_lectura.py`.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.core.constantes import AUDITORIA_TIPOS_LEIBLES, MODULOS_HCE
from app.routers.dependencias import hce_visible, sesion_lectura
from app.routers.hce import CABECERA_TOTAL
from app.schemas.auditoria import EJEMPLO_AUDITORIA, AuditoriaFila, AutorAuditoria
from app.schemas.comunes import RespuestaError
from app.services import auditoria_lectura as servicio
from app.services.hce import LIMITE_MAXIMO, LIMITE_POR_OMISION

router = APIRouter(prefix="/hce/{hce_id}", tags=["auditoria"], dependencies=[Depends(hce_visible)])


@router.get(
    "/auditoria",
    response_model=list[AuditoriaFila],
    summary="Rastro de cambios del expediente (HCE-LOG)",
    responses={
        200: {
            "content": {"application/json": {"example": EJEMPLO_AUDITORIA}},
            "headers": {CABECERA_TOTAL: {
                "description": "Total de filas que cumplen los filtros (todas las páginas).",
                "schema": {"type": "integer"},
            }},
        },
        404: {"model": RespuestaError, "description": "No existe el expediente o está fuera del alcance del usuario."},
        422: {"model": RespuestaError, "description": "`modulo` o `tipo` fuera de los valores válidos (detalle por campo)."},
    },
)
def listar(
    hce_id: int,
    response: Response,
    db: Annotated[Session, Depends(sesion_lectura)],
    modulo: Annotated[str | None, Query(description=f"Módulo: {' · '.join(MODULOS_HCE)}.")] = None,
    tipo: Annotated[str | None, Query(description=f"Tipo: {' · '.join(AUDITORIA_TIPOS_LEIBLES)}.")] = None,
    limit: Annotated[int, Query(ge=1, le=LIMITE_MAXIMO, description="Filas por página (1–200).")] = LIMITE_POR_OMISION,
    offset: Annotated[int, Query(ge=0, le=2_147_483_647, description="Filas a saltear.")] = 0,
):
    """Las filas de `auditoria` del expediente, **la más nueva primero** (`ts` y `id` descendentes).
    Total en la cabecera **`X-Total-Count`**.

    **Registra cambios, no accesos:** leer no deja fila, y `acceso` no es un tipo válido (nada lo
    escribe; puntos-a-validar §2.17). Los eventos de grupo (`GRUPO`) no son de un expediente y no
    aparecen. Un `modulo` o `tipo` inválido es **422** por campo.
    """
    filas, total = servicio.listar_auditoria(db, hce_id, modulo=modulo, tipo=tipo, limit=limit, offset=offset)
    response.headers[CABECERA_TOTAL] = str(total)
    return [
        AuditoriaFila(
            id=a.id, ts=a.ts, usuario=AutorAuditoria.model_validate(p) if p else None, modulo=a.modulo,
            tipo=a.tipo, campo=a.campo, valor_ant=a.valor_ant, valor_nuevo=a.valor_nuevo, detalle=a.detalle,
        )
        for a, p in filas
    ]
