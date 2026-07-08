"""Schemas de la línea de tiempo clínica: observaciones y eventos."""
from datetime import date

from app.schemas.base import ORMModel


class ObservacionCreate(ORMModel):
    fecha: date
    autor_id: int | None = None
    texto: str


class ObservacionOut(ORMModel):
    id: int
    nna_id: int
    fecha: date
    autor_id: int | None = None
    texto: str


class EventoCreate(ORMModel):
    tipo: str  # alta | baja
    fecha: date
    titulo: str | None = None
    descripcion: str | None = None
    autor_id: int | None = None


class EventoOut(EventoCreate):
    id: int
    nna_id: int
