"""Schemas de persona + expediente (HCE-00) — M11.3-a.

Los largos máximos son los de las columnas (`app/models/identidad.py`): un texto
demasiado largo se rechaza con 422 acá, y no explota como `DataError` al insertar.

**Vacío y blanco no se resuelven en estos schemas** sino en el servicio
(`app/services/hce.py`): las dos cosas —`''` → `NULL` en los opcionales, rechazo
de los obligatorios en blanco— tienen que valer para cualquier que llame al
servicio, no sólo para quien entre por HTTP.
"""
from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

# ── Ejemplos para Swagger ────────────────────────────────────────────────────
_PERSONA_EJEMPLO = {
    "id": 7, "nombre": "Martín", "apellido": "Rodríguez", "ci": "5.789.123-4",
    "fecha_nac": "2016-04-12", "sexo": "M", "localidad": "Montevideo",
    "referente": "Marta R. (madre)", "telefono": "099 456 789",
}
_HCE_EJEMPLO = {
    "id": 3, "hc_historico": "1001", "activo": True, "fecha_baja": None,
    "grupo_id": 2, "grupo": {"id": 2, "nombre": "Escolares", "anio": 2026},
    "diagnostico": "TEA", "cie11": "6A02", "dx_fecha": "2020-03-01",
    "derivacion": "Pediatría", "medicacion": None, "alerta": None, "anamnesis": None,
    "creado_en": "2026-10-06T14:00:00Z", "actualizado_en": "2026-10-06T14:00:00Z",
    "persona": _PERSONA_EJEMPLO,
}
EJEMPLO_RESULTADO_HCE = {"data": _HCE_EJEMPLO, "warnings": []}
EJEMPLO_RESUMEN_HCE = [
    {"id": 3, "hc_historico": "1001", "activo": True,
     "grupo": {"id": 2, "nombre": "Escolares", "anio": 2026},
     "persona": {"id": 7, "nombre": "Martín", "apellido": "Rodríguez", "ci": "5.789.123-4"}}
]


# ── Entrada ──────────────────────────────────────────────────────────────────
class PersonaCrear(BaseModel):
    """Identidad. `nombre`, `apellido`, `ci` y `fecha_nac` son obligatorios."""

    nombre: str = Field(max_length=80)
    apellido: str = Field(max_length=80)
    ci: str = Field(max_length=20, description="Se guarda tal cual se escribe; la unicidad ignora puntos, guiones y espacios.")
    fecha_nac: date
    sexo: str | None = Field(None, max_length=20)
    localidad: str | None = Field(None, max_length=80)
    referente: str | None = Field(None, max_length=120)
    telefono: str | None = Field(None, max_length=40)


class PersonaActualizar(BaseModel):
    """Edición parcial: sólo se tocan los campos presentes. Los obligatorios no admiten `null`."""

    nombre: str | None = Field(None, max_length=80)
    apellido: str | None = Field(None, max_length=80)
    ci: str | None = Field(None, max_length=20)
    fecha_nac: date | None = None
    sexo: str | None = Field(None, max_length=20)
    localidad: str | None = Field(None, max_length=80)
    referente: str | None = Field(None, max_length=120)
    telefono: str | None = Field(None, max_length=40)


class Hce00Campos(BaseModel):
    """Campos de HCE-00 propios del expediente (todos opcionales)."""

    hc_historico: str | None = Field(
        None, max_length=30,
        description="N.º de historia de la HCE anterior. Texto libre por ahora: ver el punto abierto sobre su regla.",
    )
    grupo_id: int | None = Field(None, description="Debe existir; es el grupo **de ese año** (id propio, D9).")
    diagnostico: str | None = Field(None, max_length=200)
    cie11: str | None = Field(None, max_length=20)
    dx_fecha: date | None = None
    derivacion: str | None = Field(None, max_length=200)
    medicacion: str | None = None
    alerta: str | None = None
    anamnesis: dict[str, Any] | None = Field(None, description="Objeto JSON libre; se reemplaza completo.")


class HceCrear(Hce00Campos):
    """Alta de persona + expediente en una sola transacción."""

    model_config = ConfigDict(json_schema_extra={"examples": [{
        "persona": {
            "nombre": "Martín", "apellido": "Rodríguez", "ci": "5.789.123-4",
            "fecha_nac": "2016-04-12", "sexo": "M", "localidad": "Montevideo",
            "referente": "Marta R. (madre)", "telefono": "099 456 789",
        },
        "grupo_id": 2, "diagnostico": "TEA", "cie11": "6A02", "dx_fecha": "2020-03-01",
    }]})

    persona: PersonaCrear


class HceActualizar(Hce00Campos):
    """Edición parcial de HCE-00. Sólo se tocan las claves que vienen en el cuerpo.

    HCE-00 **siempre es editable** (no se firma). Mandar `null` o `""` en un
    campo opcional lo borra; los obligatorios de `persona` no admiten ninguna de
    las dos. Cada campo que cambia deja una fila en `auditoria`.
    """

    model_config = ConfigDict(json_schema_extra={"examples": [
        {"diagnostico": "TEA nivel 2", "persona": {"telefono": "098 111 222"}}
    ]})

    persona: PersonaActualizar | None = None


# ── Salida ───────────────────────────────────────────────────────────────────
class GrupoResumen(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    anio: int


class PersonaResumen(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    apellido: str
    ci: str


class PersonaDetalle(PersonaResumen):
    fecha_nac: date
    sexo: str | None
    localidad: str | None
    referente: str | None
    telefono: str | None


class HceResumen(BaseModel):
    """Fila de la lista de búsqueda."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    hc_historico: str | None
    activo: bool
    grupo: GrupoResumen | None
    persona: PersonaResumen


class HceDetalle(BaseModel):
    """El expediente (HCE-00) con su persona."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    hc_historico: str | None
    activo: bool
    fecha_baja: date | None
    grupo_id: int | None
    grupo: GrupoResumen | None
    diagnostico: str | None
    cie11: str | None
    dx_fecha: date | None
    derivacion: str | None
    medicacion: str | None
    alerta: str | None
    anamnesis: dict[str, Any] | None
    creado_en: datetime
    actualizado_en: datetime
    persona: PersonaDetalle
