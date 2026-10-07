"""Schemas de las listas de referencia (grupos, profesionales) — M11.3-a2 · M11.5-a.

Sólo los campos que la demo necesita para elegir una opción. En particular
`Profesional` **no** expone `email` ni `hashed_password`.

M11.5-a agrega la entrada y la salida de `PATCH /grupos/{id}` (asignación de técnicos, §5.120).
"""
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

from app.schemas.comunes import EnteroOpcional
from app.schemas.hce import GrupoResumen

EJEMPLO_GRUPOS = [{"id": 2, "nombre": "Escolares", "anio": 2026}]
EJEMPLO_PROFESIONALES = [{"id": 1, "nombre": "Ana Pérez", "especialidad": "Psicología", "rol": "tecnico", "activo": True}]


class ProfesionalResumen(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    especialidad: str | None
    rol: str
    activo: bool


_Rol = Annotated[str | None, StringConstraints(max_length=60)]


class GrupoTecnicosActualizar(BaseModel):
    """Asignación de técnicos (PATCH: sólo se tocan las claves que vienen). `null` desasigna.

    **Sólo estos cuatro campos** (`extra="forbid"`): crear, renombrar o archivar un grupo es el
    sub-módulo de administración (§5.90), así que `nombre`, `anio` o cualquier otro campo → 422.
    Los roles son **texto libre** (§5.100 B5a).
    """

    model_config = ConfigDict(extra="forbid", json_schema_extra={"examples": [{
        "tecnico1_id": 2, "tecnico1_rol": "Psicólogo/a", "tecnico2_id": 3, "tecnico2_rol": "Maestro/a",
    }]})

    tecnico1_id: EnteroOpcional = Field(None, description="Profesional **activo**; distinto del técnico 2.")
    tecnico1_rol: _Rol = None
    tecnico2_id: EnteroOpcional = Field(None, description="Profesional **activo**; distinto del técnico 1.")
    tecnico2_rol: _Rol = None


class GrupoDetalle(GrupoResumen):
    """Un grupo con sus dos técnicos (ids y roles)."""

    tecnico1_id: int | None
    tecnico1_rol: str | None
    tecnico2_id: int | None
    tecnico2_rol: str | None


EJEMPLO_RESULTADO_GRUPO = {"data": {
    "id": 2, "nombre": "Escolares", "anio": 2026,
    "tecnico1_id": 2, "tecnico1_rol": "Psicólogo/a", "tecnico2_id": 3, "tecnico2_rol": "Maestro/a",
}, "warnings": []}


__all__ = [
    "GrupoResumen", "GrupoDetalle", "GrupoTecnicosActualizar", "ProfesionalResumen",
    "EJEMPLO_GRUPOS", "EJEMPLO_PROFESIONALES", "EJEMPLO_RESULTADO_GRUPO",
]
