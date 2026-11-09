"""Panel institucional — `GET /panel?anio=` (C7, §5.159).

Cualquier usuario con sesión (sin token, 401, como todo router protegido en `main.py`). El alcance lo da el rol: el
`admin` ve la institución, un `tecnico` sus grupos (`alcance` en la respuesta). Reglas: `app/services/panel.py`.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.models.identidad import Profesional
from app.routers.dependencias import permitido, sesion_lectura, usuario_actual
from app.routers.hce import _ejemplo
from app.schemas.comunes import RespuestaError
from app.schemas.panel import EJEMPLO_PANEL, Panel
from app.services import panel as servicio
from app.services.panel import ANIO_MAX, ANIO_MIN

router = APIRouter(prefix="/panel", tags=["panel"])


@router.get(
    "", response_model=Panel, summary="Panel institucional: agregados de la HCE",
    responses={**_ejemplo(200, EJEMPLO_PANEL), 422: {"model": RespuestaError, "description": "`anio` fuera de rango."},
               403: {"model": RespuestaError, "description": "Personal administrativo."}},
    dependencies=[Depends(permitido("panel"))],
)
def panel(
    db: Annotated[Session, Depends(sesion_lectura)],
    usuario: Annotated[Profesional, Depends(usuario_actual)],
    anio: Annotated[int | None, Query(ge=ANIO_MIN, le=ANIO_MAX, description="Año de la cadena; por omisión el año en curso.")] = None,
):
    """Agregados de los expedientes **activos** del alcance, calculados al leer (nada se guarda): cobertura de LB y
    ciclos completos de `anio`, la distribución por banda del IDEA **vigente**, las medias de PA, PB y Δ B − A por
    escala de la IPPU-TEA (el Δ sin interpretar), los NNA con alerta por escala y lo pendiente del flujo de `anio`.
    Cantidades, sin nombres. Un número fijo de consultas, sin importar cuántos expedientes haya."""
    return Panel(**servicio.calcular(db, usuario, anio))
