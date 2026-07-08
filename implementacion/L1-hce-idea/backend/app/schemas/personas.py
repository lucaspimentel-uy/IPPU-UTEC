"""Schemas de terapeutas, grupos y talleres."""
from app.schemas.base import ORMModel


class TallerOut(ORMModel):
    id: int
    nombre: str


class TerapeutaOut(ORMModel):
    id: int
    nombre: str
    especialidad: str | None = None
    email: str
    cargo: str | None = None
    rol: str
    activo: bool


class GrupoOut(ORMModel):
    id: str
    franja: str | None = None
    dias: str | None = None
    horario: str | None = None
    obs: str | None = None
    talleres: list[TallerOut] = []
