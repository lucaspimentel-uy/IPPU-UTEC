"""Schemas de HCE-VF (valoración funcional) — M11.3-d1. Reglas: `app/services/valoracion_funcional.py`.

**`extra="forbid"` en la entrada, a propósito** (salvaguarda §7.5): la categoría del baremo
la deriva el servidor sólo de `pct`. Un cuerpo que traiga `categoria_id`, `categoria` o
cualquier puntaje clínico se rechaza con 422 en vez de ignorarse en silencio.
"""
from datetime import date
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.comunes import FechaOpcional, VacioANone

PctOpcional = Annotated[Decimal | None, VacioANone, Field(ge=0, le=100, max_digits=5, decimal_places=2)]

_DESCRIPCION_PCT = (
    "Porcentaje de la valoración **oficial** (BUND), 0–100 con hasta 2 decimales. `null` = no "
    "corresponde (p. ej. menores de 2 años). **Es lo único** de lo que sale la categoría del baremo."
)
_DESCRIPCION_DOMINIOS = (
    "Nivel de apoyo por dominio CIF, `{dominio: nivel}`. Dominios: comunicacion · autocuidado · movilidad · "
    "aprendizaje · interacciones · comunidad. Niveles: Autónomo · Apoyo ocasional · Apoyo frecuente · "
    "Apoyo permanente. En un PATCH se fusiona dominio por dominio; `\"\"` o `null` borra ese nivel."
)
_VF_EJEMPLO = {
    "hce_id": 3, "estado": "Vigente", "fecha": "2025-11-10", "organismo": "MIDES", "pct": "58.00",
    "vigencia": "2027-11-10", "rnpcd": "Inscripto", "dominios": {"comunicacion": "Apoyo frecuente"},
    "capacidades": "Disfruta de la música…", "barreras": None, "apoyos": None, "obs": None,
    "sintesis_funcional": None,
    "categoria": {"id": 4, "categoria": "Severo", "rango": "50 % a 95 %",
                  "implicancia": "Requiere apoyos significativos y permanentes."},
    "categoria_etiqueta": "Severo", "alerta_vigencia": None,
}
EJEMPLO_VF = _VF_EJEMPLO
EJEMPLO_RESULTADO_VF = {"data": _VF_EJEMPLO, "warnings": []}


class _VfCampos(BaseModel):
    model_config = ConfigDict(extra="forbid")

    estado: str | None = Field(None, max_length=60, description="Estado del trámite oficial (texto).")
    fecha: FechaOpcional = Field(None, description="Fecha de la valoración oficial.")
    organismo: str | None = Field(None, max_length=120)
    pct: PctOpcional = Field(None, description=_DESCRIPCION_PCT)
    vigencia: FechaOpcional = Field(None, description="Vence/revisa la valoración; alerta a 90 y 30 días.")
    rnpcd: str | None = Field(None, max_length=60, description="Registro Nacional de Personas con Discapacidad.")
    dominios: dict[str, str | None] | None = Field(None, description=_DESCRIPCION_DOMINIOS)
    capacidades: str | None = None
    barreras: str | None = None
    apoyos: str | None = None
    obs: str | None = None
    sintesis_funcional: str | None = Field(None, description="Escrita por los técnicos (no se autogenera, §5.118).")


class VfCrear(_VfCampos):
    """Alta de la valoración funcional del expediente (una por expediente). Todo es opcional."""

    model_config = ConfigDict(extra="forbid", json_schema_extra={"examples": [{
        "estado": "Vigente", "fecha": "2025-11-10", "organismo": "MIDES", "pct": 58,
        "vigencia": "2027-11-10", "dominios": {"comunicacion": "Apoyo frecuente"},
    }]})


class VfActualizar(_VfCampos):
    """Edición parcial: sólo las claves presentes. `pct: null` deja la categoría en «No corresponde»."""

    model_config = ConfigDict(extra="forbid", json_schema_extra={"examples": [{"pct": 30, "vigencia": "2028-01-31"}]})


class CategoriaBaremo(BaseModel):
    id: int
    categoria: str
    rango: str
    implicancia: str


class AlertaVigencia(BaseModel):
    nivel: str = Field(description="`vencida` · `30_dias` · `90_dias`.")
    dias: int = Field(description="Días hasta `vigencia` (negativo si ya venció).")
    mensaje: str


class VfDetalle(BaseModel):
    hce_id: int
    estado: str | None
    fecha: date | None
    organismo: str | None
    pct: Decimal | None
    vigencia: date | None
    rnpcd: str | None
    dominios: dict[str, str]
    capacidades: str | None
    barreras: str | None
    apoyos: str | None
    obs: str | None
    sintesis_funcional: str | None
    categoria: CategoriaBaremo | None = Field(description="Derivada **sólo** de `pct` contra `baremo_categoria`.")
    categoria_etiqueta: str | None = Field(description="La categoría, o «No corresponde» si `pct` es `null`.")
    alerta_vigencia: AlertaVigencia | None = Field(description="Calculada al leer (90/30 días, o vencida); nunca guardada.")
