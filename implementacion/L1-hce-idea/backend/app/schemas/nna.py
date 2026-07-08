"""Schemas del expediente NNA."""
from datetime import date

from pydantic import BaseModel, ConfigDict

from app.schemas.base import ORMModel
from app.schemas.personas import GrupoOut, TallerOut, TerapeutaOut


class AnamnesisIn(ORMModel):
    motivo: str | None = None
    perinatal: str | None = None
    desarrollo: str | None = None
    familiares: str | None = None


class NnaBase(ORMModel):
    nombre: str
    apellido: str
    ci: str | None = None
    fecha_nac: date | None = None
    sexo: str | None = None
    localidad: str | None = None
    referente: str | None = None
    telefono: str | None = None
    grupo_id: str | None = None
    tecnico_id: int | None = None
    diagnostico: str | None = None
    dx_fecha: date | None = None
    derivacion: str | None = None
    grado_apoyo: str | None = None
    antecedentes: str | None = None
    medicacion: str | None = None
    alerta: str | None = None


class NnaCreate(NnaBase):
    model_config = ConfigDict(json_schema_extra={"example": {
        "nombre": "Ana", "apellido": "Pérez", "ci": "5.111.222-3",
        "fecha_nac": "2016-05-10", "sexo": "Femenino", "localidad": "Montevideo",
        "referente": "Marta (madre)", "telefono": "099 111 222",
        "grupo_id": "A", "tecnico_id": 1, "diagnostico": "TEA — Trastorno del Espectro Autista",
        "dx_fecha": "2020-03-01", "grado_apoyo": "Grado 2 — Requiere apoyo sustancial",
        "anamnesis": {"motivo": "Ingreso para abordaje interdisciplinario."},
        "talleres": [1],
    }})

    anamnesis: AnamnesisIn | None = None
    talleres: list[int] = []  # ids de taller


class NnaUpdate(NnaBase):
    anamnesis: AnamnesisIn | None = None
    talleres: list[int] | None = None


class NnaListItem(ORMModel):
    """Fila del listado (N.º HCE, C.I., Nombres, Apellido, Estado)."""
    id: int
    nombre: str
    apellido: str
    ci: str | None = None
    grupo_id: str | None = None
    edad: int | None = None
    activo: bool


class NnaDetail(NnaBase):
    """Expediente completo."""
    id: int
    activo: bool
    fecha_baja: date | None = None
    edad: int | None = None
    anamnesis: AnamnesisIn | None = None
    talleres: list[TallerOut] = []
    grupo: GrupoOut | None = None
    tecnico: TerapeutaOut | None = None


class EstadoUpdate(BaseModel):
    """Alta/baja del expediente."""
    activo: bool
    fecha_baja: date | None = None
