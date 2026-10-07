"""Schemas del Informe de Cierre Anual (HCE-IC) — M11.3-c. Reglas: `app/services/informe_cierre.py`."""
from datetime import date
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.comunes import FechaOpcional
from app.schemas.idea import EJEMPLO_IDEA, IdeaDetalle
from app.schemas.protocolo import AlertaDelta, Interpretacion

# ── Ejemplos para Swagger (Martín, `demo/js/flujo.js`) ───────────────────────
_SINT_ESCALA = {
    "esc_1": "Progreso moderado y sostenido en la relación social (Δ +4)…",
    "esc_2": "Área de mayor progreso del año (Δ +6)…",
    "esc_3": "Progreso moderado (Δ +4). La agenda visual individual…",
    "esc_4": "Progreso leve (Δ +5 sobre una base muy descendida)…",
}
_FIRMAS = [
    {"profesional_id": 1, "rol": "Psicología", "fecha": "2026-11-13"},
    {"profesional_id": 2, "rol": "Psicopedagogía", "fecha": "2026-11-13"},
]
EJEMPLO_IC = {
    "id": 31, "hce_id": 3, "anio": 2026, "fecha": "2026-11-13", "sint_escala": _SINT_ESCALA,
    "val_tec1": "Año de progreso clínicamente significativo…",
    "val_tec2": "La incorporación de apoyos visuales sistemáticos…",
    "recomendaciones": "1) Profundizar el uso funcional del sistema aumentativo…",
    "orientaciones": "Sostener la agenda visual en el hogar…",
    "recibi": {"firmante": "Marta R. (madre)", "fecha": "2026-11-13"},
    "estado": "firmado", "firmado": True, "firmas": _FIRMAS, "addendas": [],
}
EJEMPLO_RESULTADO_IC = {"data": EJEMPLO_IC, "warnings": []}
_RESUMEN = {"fecha": "2026-07-07", "firmado": True}
EJEMPLO_DOCUMENTO = {
    "expediente": {
        "hce_id": 3, "hc_numero": 1001, "nombre": "Martín", "apellido": "Rodríguez", "fecha_nac": "2016-04-12",
        "grupo": {"id": 2, "nombre": "Escolares", "anio": 2026},
    },
    "anio": 2026,
    "idea": EJEMPLO_IDEA,
    "protocolos": {
        "a": {**_RESUMEN, "id": 20, "tipo": "A", "total": 60, "esc_1": 16, "esc_2": 15, "esc_3": 16, "esc_4": 13},
        "b": {**_RESUMEN, "id": 21, "tipo": "B", "fecha": "2026-11-06", "total": 79, "esc_1": 20, "esc_2": 21, "esc_3": 20, "esc_4": 18},
        "deltas": {"total": 19, "esc_1": 4, "esc_2": 6, "esc_3": 4, "esc_4": 5},
        "interpretacion": {"total": {"etiqueta": "Progreso muy significativo", "accion": "Documentar y analizar…", "signo": "positivo"}},
        "alertas": [],
    },
    "informe": {**EJEMPLO_IC, "firmas": [{**f, "nombre": n} for f, n in zip(_FIRMAS, ("Ana", "Beto"))]},
}


# ── Entrada ──────────────────────────────────────────────────────────────────
class _InformeCampos(BaseModel):
    fecha: FechaOpcional = None
    sint_escala: dict[str, str | None] | None = Field(
        None,
        description=(
            "Una síntesis por escala de la IPPU-TEA: claves `esc_1`…`esc_4`. En un PATCH **sólo las que vengan** "
            "se tocan; una en blanco la borra. Otra clave → 422."
        ),
    )
    val_tec1: str | None = Field(None, description="Valoración anual del técnico 1.")
    val_tec2: str | None = Field(None, description="Valoración anual del técnico 2.")
    recomendaciones: str | None = None
    orientaciones: str | None = None


class InformeCrear(_InformeCampos):
    """Alta del IC de un año. `anio` obligatorio; uno por `(expediente, anio)` (409)."""

    model_config = ConfigDict(json_schema_extra={"examples": [{
        "anio": 2026, "fecha": "2026-11-13", "sint_escala": _SINT_ESCALA,
        "val_tec1": "Año de progreso clínicamente significativo…",
        "val_tec2": "La incorporación de apoyos visuales sistemáticos…",
        "recomendaciones": "1) Profundizar el uso funcional…", "orientaciones": "Sostener la agenda visual…",
    }]})

    anio: int = Field(ge=1, le=32767)


class InformeActualizar(_InformeCampos):
    """Edición parcial de un IC **sin firmar** (firmado: 409). El año no se edita; el recibí va por `/recibi`."""

    model_config = ConfigDict(json_schema_extra={"examples": [{"sint_escala": {"esc_2": "Área de mayor progreso…"}}]})


class InformeFirmar(BaseModel):
    """Los dos profesionales que firman (el IC no tiene columnas de evaluadores)."""

    model_config = ConfigDict(json_schema_extra={"examples": [{"firmantes": [1, 2]}]})

    firmantes: list[int] = Field(description="Dos `profesional_id` **distintos y activos**.")


class RecibiCrear(BaseModel):
    """Recibí de la familia: se registra **una vez**, sobre el IC firmado."""

    model_config = ConfigDict(json_schema_extra={"examples": [{"firmante": "Marta R. (madre)", "fecha": "2026-11-13"}]})

    firmante: str | None = Field(None, description="Obligatorio, no en blanco.")
    fecha: FechaOpcional = Field(None, description="Obligatoria.")


# ── Salida ───────────────────────────────────────────────────────────────────
class InformeDetalle(BaseModel):
    id: int
    hce_id: int
    anio: int
    fecha: date | None
    sint_escala: dict[str, str | None] = Field(description="Siempre las 4 claves `esc_1`…`esc_4`; las vacías en `null`.")
    val_tec1: str | None
    val_tec2: str | None
    recomendaciones: str | None
    orientaciones: str | None
    recibi: dict[str, Any] | None = Field(description="`{firmante, fecha}` de la familia, o `null` si todavía no se registró.")
    estado: str = Field(description="`en_curso` | `firmado`.")
    firmado: bool
    firmas: list[dict[str, Any]] = Field(description="`{profesional_id, rol, fecha}` de los dos firmantes.")
    addendas: list[dict[str, Any]]


class GrupoDocumento(BaseModel):
    id: int
    nombre: str
    anio: int


class ExpedienteDocumento(BaseModel):
    hce_id: int
    hc_numero: int | None = Field(description="N.º de HC institucional.")
    nombre: str
    apellido: str
    fecha_nac: date
    grupo: GrupoDocumento | None


class ResumenProtocolo(BaseModel):
    id: int
    tipo: str
    fecha: date | None
    firmado: bool
    total: int | None
    esc_1: int | None
    esc_2: int | None
    esc_3: int | None
    esc_4: int | None


class ProtocolosDocumento(BaseModel):
    a: ResumenProtocolo | None
    b: ResumenProtocolo | None
    deltas: dict[str, int | None] | None = Field(description="B − A guardado al firmar el B; `null` si no se calculó.")
    interpretacion: dict[str, Interpretacion | None] | None
    alertas: list[AlertaDelta]


class InformeDocumentoFirmas(InformeDetalle):
    firmas: list[dict[str, Any]] = Field(description="`{profesional_id, rol, fecha, nombre}`.")


class InformeDocumento(BaseModel):
    """Todo lo que imprime el frontend (§5.102: sin PDF en el servidor)."""

    expediente: ExpedienteDocumento
    anio: int
    idea: IdeaDetalle | None = Field(
        description="El IDEA **del año del informe** (§5.97), firmado o no (mirar `firmado`); `null` si no hay.",
    )
    protocolos: ProtocolosDocumento
    informe: InformeDocumentoFirmas
