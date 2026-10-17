"""Schemas de la lectura de HCE-LOG — C1. Reglas: `app/services/auditoria_lectura.py`."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AutorAuditoria(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    rol: str = Field(description="`admin` · `tecnico`.")


class AuditoriaFila(BaseModel):
    id: int
    ts: datetime = Field(description="Con zona horaria; la pantalla lo muestra en hora local.")
    usuario: AutorAuditoria | None = Field(description="`null` si la fila no tiene autor (scripts, tests de servicio).")
    modulo: str | None
    tipo: str = Field(description="`carga` · `edicion` · `firma` · `addenda` · `excepcion` · `alerta`.")
    campo: str | None
    valor_ant: str | None = Field(description="Texto guardado; un JSON viene como texto JSON.")
    valor_nuevo: str | None
    detalle: str | None


EJEMPLO_AUDITORIA = [{
    "id": 42, "ts": "2026-03-20T14:05:11.120000-03:00",
    "usuario": {"id": 4, "nombre": "Ana Pereira", "rol": "tecnico"},
    "modulo": "HCE-00", "tipo": "edicion", "campo": "escolaridad",
    "valor_ant": "Inicial", "valor_nuevo": "Primaria", "detalle": None,
}]