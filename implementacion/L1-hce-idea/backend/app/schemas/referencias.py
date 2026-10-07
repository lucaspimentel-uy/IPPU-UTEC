"""Schemas de las listas de referencia (grupos, profesionales) — M11.3-a2.

Sólo los campos que la demo necesita para elegir una opción. En particular
`Profesional` **no** expone `email` ni `hashed_password`.
"""
from pydantic import BaseModel, ConfigDict

from app.schemas.hce import GrupoResumen

EJEMPLO_GRUPOS = [{"id": 2, "nombre": "Escolares", "anio": 2026}]
EJEMPLO_PROFESIONALES = [{"id": 1, "nombre": "Ana Pérez", "especialidad": "Psicología", "rol": "tecnico"}]


class ProfesionalResumen(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    especialidad: str | None
    rol: str


__all__ = ["GrupoResumen", "ProfesionalResumen", "EJEMPLO_GRUPOS", "EJEMPLO_PROFESIONALES"]
