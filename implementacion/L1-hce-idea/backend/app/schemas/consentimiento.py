"""Schemas del consentimiento informado (HCE-CI) — M11.3-b. Reglas: `app/services/consentimiento.py`."""
from datetime import date
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.comunes import FechaOpcional

_AUTORIZACIONES = {"evaluacion": True, "registro": True, "comunicacion": False}
_CI_EJEMPLO = {
    "hce_id": 3, "firmante": "Marta R. (madre)", "fecha": "2026-03-02",
    "autorizaciones": _AUTORIZACIONES, "firmado": False, "firmas": [], "addendas": [],
}
EJEMPLO_RESULTADO_CI = {"data": _CI_EJEMPLO, "warnings": []}
EJEMPLO_CI = _CI_EJEMPLO


class ConsentimientoCrear(BaseModel):
    """Registro del CI. `firmante` y `fecha` son obligatorios; `autorizaciones` es opcional pero,
    si viene, trae **las tres** (`evaluacion`, `registro`, `comunicacion`) como verdadero/falso."""

    model_config = ConfigDict(json_schema_extra={"examples": [{
        "firmante": "Marta R. (madre)", "fecha": "2026-03-02", "autorizaciones": _AUTORIZACIONES,
    }]})

    firmante: str = Field(max_length=120, description="Referente familiar que firma.")
    fecha: date
    autorizaciones: dict[str, Any] | None = Field(
        None, description="`{evaluacion, registro, comunicacion}`, cada una `true`/`false`. Se reemplaza completo."
    )


class ConsentimientoActualizar(BaseModel):
    """Edición parcial: sólo las claves presentes. `firmante` y `fecha` no admiten `null`."""

    model_config = ConfigDict(json_schema_extra={"examples": [
        {"autorizaciones": {"evaluacion": True, "registro": True, "comunicacion": True}}
    ]})

    firmante: str | None = Field(None, max_length=120)
    fecha: FechaOpcional = None
    autorizaciones: dict[str, Any] | None = None


class ConsentimientoDetalle(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    hce_id: int
    firmante: str | None
    fecha: date | None
    autorizaciones: dict[str, Any] | None
    firmado: bool
    firmas: list[dict[str, Any]]
    addendas: list[dict[str, Any]]

    @field_validator("firmas", "addendas", mode="before")
    @classmethod
    def _null_es_lista_vacia(cls, valor):
        """La columna es `NULL` mientras no hay nada (§5.115 a); la API siempre devuelve una lista."""
        return [] if valor is None else valor

    @field_validator("firmado", mode="before")
    @classmethod
    def _null_es_falso(cls, valor):
        return bool(valor)
