"""El acceso con motivo — Fase 4, A1 (`docs/diseno/fase4-acceso.md` c, d, e; §5.164, §5.165).

- `GET /accesos/motivos` — el catálogo de motivos, con quién puede usar cada uno (todo usuario con sesión, F4-19).
- `POST /hce/{hce_id}/accesos` — abre la ventana (o registra la copia a la familia). Reglas: `app/services/accesos.py`.

Los lectores del registro (`GET /hce/{id}/accesos`, `GET /accesos`) son de A2.
"""
from datetime import datetime
from typing import Annotated, Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app.core.constantes import MOTIVO_TEXTO_MAX
from app.models.identidad import Profesional
from app.routers.dependencias import acceso_hce, sesion_transaccional, usuario_actual
from app.schemas.comunes import Aviso, RespuestaError, Resultado
from app.services import accesos as servicio

router_motivos = APIRouter(prefix="/accesos", tags=["accesos"])
#: El rol y la existencia se miran antes que el cuerpo (el orden de la sección b), como en toda ruta de un expediente.
router_hce = APIRouter(prefix="/hce/{hce_id}/accesos", tags=["accesos"],
                       dependencies=[Depends(acceso_hce("accesos.abrir", "accesos.abrir"))])


class Motivo(BaseModel):
    codigo: str
    label: str
    quien: list[Literal["tratante", "no_tratante", "coordinacion"]] = Field(
        description="Qué relación lo puede usar: `no_tratante` (técnico de otro grupo), `coordinacion`, `tratante` (sólo la copia a la familia).",
    )
    texto_obligatorio: bool


class AccesoCrear(BaseModel):
    """`ci` sólo la manda el técnico **no tratante** (decisión (a), §5.165): la C.I. completa del NNA."""

    model_config = ConfigDict(json_schema_extra={"examples": [
        {"motivo_codigo": "interconsulta", "motivo_texto": "Interconsulta pedida por el equipo de Escolares", "ci": "5.789.123-4"},
        {"motivo_codigo": "supervision"},
        {"motivo_codigo": "copia_familia", "motivo_texto": "A la madre: el informe de cierre 2026"},
    ]})

    motivo_codigo: str | None = Field(None, max_length=30, description="Una de las claves de `GET /accesos/motivos`.")
    motivo_texto: str | None = Field(None, max_length=MOTIVO_TEXTO_MAX * 4, description=(
        f"Hasta {MOTIVO_TEXTO_MAX} caracteres; obligatorio en `copia_familia` y `otro`. «Escribí el motivo, no datos "
        "clínicos del NNA.»"
    ))
    ci: str | None = Field(None, max_length=40, description="La C.I. completa del NNA (sólo el técnico no tratante).")


class AccesoDetalle(BaseModel):
    id: int
    hce_id: int
    relacion: Literal["no_tratante", "supervision", "titular"]
    motivo_codigo: str
    motivo_label: str
    motivo_texto: str | None
    inicio: datetime
    vence: datetime = Field(description="Fin de la ventana; igual a `inicio` en la copia a la familia (no abre ninguna).")


@router_motivos.get("/motivos", response_model=list[Motivo], summary="Motivos de acceso a una HC")
def listar_motivos():
    """El catálogo corto del Protocolo §5–§8 (borrador del equipo, a validar con IPPU, D4). Lista fija, sin paginar."""
    return [Motivo(**m) for m in servicio.motivos()]


@router_hce.post(
    "", status_code=201, response_model=Resultado[AccesoDetalle], summary="Abrir el expediente con un motivo",
    responses={
        403: {"model": RespuestaError, "description": "Personal administrativo y dirección no técnica (exista o no el expediente)."},
        404: {"model": RespuestaError, "description": "No existe el expediente, o el técnico no tratante mandó una C.I. que no es la suya."},
        422: {"model": RespuestaError, "description": "Motivo fuera del catálogo o de otra relación, texto obligatorio que falta, más de 500 caracteres, o falta la C.I. (técnico no tratante)."},
    },
)
def abrir(hce_id: int, datos: AccesoCrear, db: Annotated[Session, Depends(sesion_transaccional)],
          usuario: Annotated[Profesional, Depends(usuario_actual)]):
    """Deja **una fila** del registro de accesos (quién, cuándo, a qué expediente y por qué: Protocolo §8). Para el
    técnico no tratante y coordinación abre una **ventana de 120 minutos**: durante ella el expediente responde como a
    quien lo puede leer (sin escribir; el no tratante, sin la auditoría ni las fotos). Pedir otro motivo abre otra. La
    copia a la familia la registra el tratante o coordinación, sin ventana. El técnico no tratante manda la **C.I.**
    completa del NNA: si no es la del expediente, 404."""
    fila, avisos = servicio.abrir(db, usuario, hce_id, datos.model_dump())
    return Resultado(data=AccesoDetalle.model_validate(servicio.vista(fila)), warnings=[Aviso(**a) for a in avisos])
