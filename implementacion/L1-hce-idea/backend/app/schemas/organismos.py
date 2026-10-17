"""Schemas de HCE-ORG (vínculos con INAU y BPS y sus registros) — C3. Reglas: `app/services/organismos.py`.

**`extra="forbid"` en la entrada, a propósito.** El autor de un registro es el usuario del token (como el de
las addendas, §5.119 b): un cuerpo que mande `autor_id` es 422, no se ignora. Lo mismo vale para `alerta`:
la calcula el servidor desde `vencimiento` y no se guarda.
"""
from datetime import date

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.comunes import FechaOpcional

_INAU_EJEMPLO = {
    "sipi": "SIPI-48213", "convenio": "Convenio de atención diurna 2026", "referente": "Lic. M. Rodríguez (INAU)",
    "ingreso": "2026-03-02", "obs": None,
}
_ALERTA_EJEMPLO = {"nivel": "30_dias", "dias": 25, "mensaje": "La Ayuda Extraordinaria (AYEX) vence en 25 días: renovar el trámite"}
_BPS_EJEMPLO = {
    "prestacion": "Ayuda Extraordinaria (AYEX)", "tramite": "AYEX-2026-0417", "estado": "En trámite",
    "vencimiento": "2026-12-12", "obs": None, "alerta": _ALERTA_EJEMPLO,
}
_REGISTRO_EJEMPLO = {
    "id": 7, "organismo": "inau", "fecha": "2026-06-20", "detalle": "Informe semestral enviado.",
    "autor": {"id": 2, "nombre": "Lic. Ana González"},
}
EJEMPLO_ORGANISMOS = {"inau": _INAU_EJEMPLO, "bps": _BPS_EJEMPLO}
EJEMPLO_OPCIONES = {
    "bps_prestaciones": ["Ayuda Extraordinaria (AYEX) — instituto habilitado", "Ayuda Extraordinaria (AYEX)", "Otra"],
    "bps_estados": ["Vigente", "En trámite", "Observada"],
}
EJEMPLO_INAU = {"data": _INAU_EJEMPLO, "warnings": []}
EJEMPLO_BPS = {"data": _BPS_EJEMPLO, "warnings": []}
EJEMPLO_REGISTRO = {"data": _REGISTRO_EJEMPLO, "warnings": []}
EJEMPLO_REGISTROS = [_REGISTRO_EJEMPLO]


class _Entrada(BaseModel):
    model_config = ConfigDict(extra="forbid")


# ── Vínculo con INAU ─────────────────────────────────────────────────────────
class _InauCampos(_Entrada):
    sipi: str | None = Field(None, max_length=40, description="N.º SIPI.")
    convenio: str | None = Field(None, max_length=120, description="Convenio o proyecto.")
    referente: str | None = Field(None, max_length=120, description="Referente territorial de INAU.")
    ingreso: FechaOpcional = Field(None, description="Ingreso al convenio.")
    obs: str | None = Field(None, description="Situación, medidas, coordinaciones.")


class InauCrear(_InauCampos):
    """Alta del vínculo con INAU (uno por expediente). Todo es opcional, pero **no todo vacío**."""

    model_config = ConfigDict(extra="forbid", json_schema_extra={"examples": [{
        "convenio": "Convenio de atención diurna 2026", "referente": "Lic. M. Rodríguez (INAU)", "ingreso": "2026-03-02",
    }]})


class InauActualizar(_InauCampos):
    """Edición parcial: sólo las claves presentes. `null` o blanco borra el campo."""

    model_config = ConfigDict(extra="forbid", json_schema_extra={"examples": [{"referente": "Lic. P. Techera (INAU)"}]})


class InauDetalle(BaseModel):
    sipi: str | None
    convenio: str | None
    referente: str | None
    ingreso: date | None
    obs: str | None


# ── Vínculo con BPS ──────────────────────────────────────────────────────────
_DESCRIPCION_PRESTACION = (
    "Texto libre; el formulario ofrece las de `GET /organismos/opciones`. **Sólo las dos Ayuda Extraordinaria "
    "(AYEX) disparan la alerta de vencimiento.**"
)


class _BpsCampos(_Entrada):
    prestacion: str | None = Field(None, max_length=120, description=_DESCRIPCION_PRESTACION)
    tramite: str | None = Field(None, max_length=120, description="N.º de trámite o de expediente.")
    estado: str | None = Field(None, max_length=60, description="Texto libre; el formulario ofrece los de `GET /organismos/opciones`.")
    vencimiento: FechaOpcional = Field(None, description="Vencimiento o renovación; alerta a 60 y 30 días si es AYEX.")
    obs: str | None = Field(None, description="Documentación, constancias, recordatorios.")


class BpsCrear(_BpsCampos):
    """Alta del vínculo con BPS (uno por expediente). Todo es opcional, pero **no todo vacío**."""

    model_config = ConfigDict(extra="forbid", json_schema_extra={"examples": [{
        "prestacion": "Ayuda Extraordinaria (AYEX)", "estado": "En trámite", "vencimiento": "2026-12-12",
    }]})


class BpsActualizar(_BpsCampos):
    """Edición parcial: sólo las claves presentes. `null` o blanco borra el campo."""

    model_config = ConfigDict(extra="forbid", json_schema_extra={"examples": [{"estado": "Vigente", "vencimiento": "2027-12-12"}]})


class AlertaAyex(BaseModel):
    nivel: str = Field(description="`vencida` · `30_dias` · `60_dias`.")
    dias: int = Field(description="Días hasta `vencimiento` (negativo si ya venció).")
    mensaje: str


class BpsDetalle(BaseModel):
    prestacion: str | None
    tramite: str | None
    estado: str | None
    vencimiento: date | None
    obs: str | None
    alerta: AlertaAyex | None = Field(
        description="Calculada al leer (60/30 días, o vencida) y sólo si la prestación es AYEX; nunca guardada ni bloqueante.",
    )


class OrganismosDetalle(BaseModel):
    inau: InauDetalle | None = Field(description="`null` mientras no se haya registrado el vínculo.")
    bps: BpsDetalle | None = Field(description="`null` mientras no se haya registrado el vínculo.")


class OpcionesOrganismos(BaseModel):
    bps_prestaciones: list[str]
    bps_estados: list[str]


# ── Registros ────────────────────────────────────────────────────────────────
class RegistroCrear(_Entrada):
    """Un envío a INAU o una gestión ante BPS. **Los tres campos son obligatorios**; el autor es el usuario del token."""

    model_config = ConfigDict(extra="forbid", json_schema_extra={"examples": [{
        "organismo": "inau", "fecha": "2026-06-20", "detalle": "Informe semestral enviado.",
    }]})

    organismo: str = Field(description="`inau` (envío) o `bps` (gestión).")
    fecha: date = Field(description="Cuándo se hizo el envío o la gestión.")
    detalle: str = Field(description="Qué se envió o gestionó. No en blanco.")


class AutorRegistro(BaseModel):
    id: int
    nombre: str


class RegistroDetalle(BaseModel):
    id: int
    organismo: str
    fecha: date
    detalle: str | None
    autor: AutorRegistro | None = Field(description="Quien lo registró; `null` si el profesional ya no existe.")
