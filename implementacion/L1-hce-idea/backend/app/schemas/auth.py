"""Schemas del login mínimo (§5.101) — M11.3-d1."""
from pydantic import BaseModel, ConfigDict, Field


class LoginEntrada(BaseModel):
    model_config = ConfigDict(json_schema_extra={"examples": [
        {"email": "tecnica@ippu.test", "password": "una-contraseña"}
    ]})

    email: str = Field(min_length=1, max_length=120, description="Sin distinguir mayúsculas.")
    password: str = Field(min_length=1, max_length=200)


class UsuarioActual(BaseModel):
    """Quién está logueado: lo que la pantalla necesita para mostrarlo y decidir qué ofrece."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    email: str
    rol: str = Field(description="`admin` (ve todo) · `tecnico` (sólo los expedientes de sus grupos).")


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expira_en_minutos: int
    usuario: UsuarioActual


EJEMPLO_TOKEN = {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…",
    "token_type": "bearer",
    "expira_en_minutos": 480,
    "usuario": {"id": 4, "nombre": "Ana Pereira", "email": "tecnica@ippu.test", "rol": "tecnico"},
}
