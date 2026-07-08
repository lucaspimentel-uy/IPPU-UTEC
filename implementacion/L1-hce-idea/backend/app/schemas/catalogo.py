"""Schemas del catálogo IDEA (solo lectura)."""
from app.schemas.base import ORMModel


class DimensionOut(ORMModel):
    id: str
    escala_id: str
    numero: int
    nombre: str


class EscalaOut(ORMModel):
    id: str
    nombre: str
    orden: int
    dimensiones: list[DimensionOut] = []
