"""Schemas de los Protocolos A y B (HCE-PA / HCE-PB, Escala IPPU-TEA) — M11.3-c. Reglas: `app/services/protocolo.py`.

**Vacío y blanco (§5.115 b):** `""` en la fecha, los enteros y las FK es `null`; los textos se
normalizan en el servicio. `valor` de un ítem se valida en el servicio (mensaje por ítem:
`items.7.valor`), no acá.
"""
from datetime import date
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, StrictInt

from app.schemas.comunes import EnteroOpcional, FechaOpcional
from app.schemas.flujo import EJEMPLO_AVISO_SECUENCIA

# ── Ejemplos para Swagger ────────────────────────────────────────────────────
# Martín (usuario 1 de la demo, `demo/js/flujo.js`): PA = 60 (16·15·16·13), PB = 79 (20·21·20·18), Δ +19.
VALORES_PA_MARTIN = [3, 3, 3, 2, 3, 2, 3, 3, 2, 3, 2, 2, 3, 2, 3, 2, 3, 3, 2, 3, 2, 2, 2, 2]
VALORES_PB_MARTIN = [4, 3, 4, 3, 3, 3, 4, 4, 3, 4, 3, 3, 3, 3, 3, 3, 4, 4, 3, 4, 3, 3, 3, 2]


def _items(valores) -> dict:
    return {str(i + 1): {"valor": v, "obs": None} for i, v in enumerate(valores)}


_ITEMS_PB = _items(VALORES_PB_MARTIN)
_ITEMS_PB["1"]["obs"] = "Contacto visual consistente en saludo y pedido."
_DELTAS_MARTIN = {"total": 19, "esc_1": 4, "esc_2": 6, "esc_3": 4, "esc_4": 5}
_INTERPRETACION = {
    "total": {"etiqueta": "Progreso muy significativo", "accion": "Documentar y analizar qué estrategias lo produjeron para replicarlas.", "signo": "positivo"},
    "esc_1": {"etiqueta": "Progreso leve", "accion": "Revisar si los objetivos de esa escala son suficientemente ambiciosos.", "signo": "positivo"},
    "esc_2": {"etiqueta": "Progreso leve", "accion": "Revisar si los objetivos de esa escala son suficientemente ambiciosos.", "signo": "positivo"},
    "esc_3": {"etiqueta": "Progreso leve", "accion": "Revisar si los objetivos de esa escala son suficientemente ambiciosos.", "signo": "positivo"},
    "esc_4": {"etiqueta": "Progreso leve", "accion": "Revisar si los objetivos de esa escala son suficientemente ambiciosos.", "signo": "positivo"},
}
EJEMPLO_PROTOCOLO = {
    "id": 21, "hce_id": 3, "tipo": "B", "anio": 2026, "modulo": "HCE-PB", "items": _ITEMS_PB,
    "fecha": "2026-12-11", "semanas": 17,
    "sint_tec1": "Generalización parcial de la comunicación al hogar…",
    "sint_tec2": "Participa de rutinas grupales completas…",
    "otros": "Psicomotricidad: mejora en regulación ante estímulos sonoros.",
    "ajustes": "Agenda visual individual (agosto)…",
    "evaluador_t1_id": 1, "evaluador_t2_id": 2,
    "total": 79, "esc_1": 20, "esc_2": 21, "esc_3": 20, "esc_4": 18, "puntuados": 24,
    "deltas": _DELTAS_MARTIN, "interpretacion": _INTERPRETACION, "alertas": [],
    "estado": "firmado", "firmado": True,
    "firmas": [
        {"profesional_id": 1, "rol": "Psicología", "fecha": "2026-12-11"},
        {"profesional_id": 2, "rol": "Psicopedagogía", "fecha": "2026-12-11"},
    ],
    "addendas": [],
}
EJEMPLO_RESULTADO_PROTOCOLO = {"data": EJEMPLO_PROTOCOLO, "warnings": []}
_PA_SIN_LB = {
    **EJEMPLO_PROTOCOLO, "id": 20, "tipo": "A", "modulo": "HCE-PA", "items": _items(VALORES_PA_MARTIN),
    "fecha": "2026-07-07", "semanas": 16, "ajustes": None,
    "total": 60, "esc_1": 16, "esc_2": 15, "esc_3": 16, "esc_4": 13,
    "deltas": None, "interpretacion": None,
}
EJEMPLO_RESULTADO_PA_FUERA_DE_SECUENCIA = {
    "data": _PA_SIN_LB,
    "warnings": [{**EJEMPLO_AVISO_SECUENCIA[0], "modulo": "HCE-PA", "faltan": ["HCE-LB"],
                  "mensaje": "HCE-PA (2026) quedó fuera de secuencia: faltan firmar HCE-LB"}],
}
EJEMPLO_RESULTADO_PB_CON_ALERTA = {
    "data": {
        **EJEMPLO_PROTOCOLO,
        "deltas": {"total": -9, "esc_1": -7, "esc_2": 0, "esc_3": -1, "esc_4": -1},
        "interpretacion": {**_INTERPRETACION, "esc_1": {
            "etiqueta": "Regresión significativa",
            "accion": "Reunión técnica urgente; contacto con familia; posible revisión del plan.", "signo": "negativo",
        }},
        "alertas": [{"escala": "esc_1", "delta": -7, "etiqueta": "Regresión significativa"}],
    },
    "warnings": [],
}


# ── Entrada ──────────────────────────────────────────────────────────────────
class ItemEntrada(BaseModel):
    """Un ítem. En un PATCH sólo se pisan las claves presentes (`{"valor": 4}` no borra la `obs`)."""

    valor: StrictInt | None = Field(None, description="Entero de 1 a 5 o `null` (en blanco).")
    obs: str | None = Field(None, description="Observación; **obligatoria para firmar si el valor es 1 o 5**. `\"\"` se guarda como `null`.")


class _ProtocoloCampos(BaseModel):
    items: dict[str, ItemEntrada] | None = Field(
        None,
        description=(
            "Claves `\"1\"`…`\"24\"` (el id de `ippu_item`); **sólo las que vengan** se tocan. "
            "Una clave que no es un ítem → 422."
        ),
    )
    fecha: FechaOpcional = None
    semanas: EnteroOpcional = Field(None, description="Semanas de asistencia efectiva (≥ 0).")
    sint_tec1: str | None = Field(None, description="Síntesis del técnico 1 (obligatoria para firmar).")
    sint_tec2: str | None = Field(None, description="Síntesis del técnico 2 (obligatoria para firmar).")
    otros: str | None = Field(None, description="Aportes de otros técnicos.")
    ajustes: str | None = Field(None, description="**Sólo Protocolo B**: en un A → 422.")
    evaluador_t1_id: EnteroOpcional = Field(None, description="Técnico 1. Para firmar: cargado, distinto del 2 y activo.")
    evaluador_t2_id: EnteroOpcional = Field(None, description="Técnico 2. Para firmar: cargado, distinto del 1 y activo.")


class ProtocoloCrear(_ProtocoloCampos):
    """Alta de un protocolo. `tipo` y `anio` obligatorios; uno por `(expediente, tipo, anio)` (409)."""

    model_config = ConfigDict(json_schema_extra={"examples": [{
        "tipo": "A", "anio": 2026, "items": _items(VALORES_PA_MARTIN), "fecha": "2026-07-07", "semanas": 16,
        "sint_tec1": "Emergencia clara de atención conjunta con apoyo…",
        "sint_tec2": "Mayor permanencia en actividades estructuradas…",
        "evaluador_t1_id": 1, "evaluador_t2_id": 2,
    }]})

    tipo: Literal["A", "B"]
    anio: int = Field(ge=1, le=32767)


class ProtocoloActualizar(_ProtocoloCampos):
    """Edición parcial de un protocolo **sin firmar** (firmado: 409). `tipo` y `anio` no se editan."""

    model_config = ConfigDict(json_schema_extra={"examples": [
        {"items": {"5": {"valor": 1, "obs": "Regresión ante el cambio de sala."}}, "sint_tec2": "…"}
    ]})


# ── Salida ───────────────────────────────────────────────────────────────────
class Interpretacion(BaseModel):
    """Tramo de `delta_interpretacion` que cubre un Δ, **derivado en cada lectura**."""

    etiqueta: str
    accion: str
    signo: str


class AlertaDelta(BaseModel):
    escala: str = Field(description="`esc_1`…`esc_4`.")
    delta: int
    etiqueta: str


class ProtocoloDetalle(BaseModel):
    id: int
    hce_id: int
    tipo: Literal["A", "B"]
    anio: int
    modulo: str = Field(description="`HCE-PA` o `HCE-PB`.")
    items: dict[str, ItemEntrada] = Field(description="Siempre los 24 (`\"1\"`…`\"24\"`); los no cargados, en blanco.")
    fecha: date | None
    semanas: int | None
    sint_tec1: str | None
    sint_tec2: str | None
    otros: str | None
    ajustes: str | None
    evaluador_t1_id: int | None
    evaluador_t2_id: int | None
    total: int | None = Field(description="24–120; `null` mientras falte algún ítem. Se congela al firmar.")
    esc_1: int | None = Field(description="Relación Social (ítems 1–6), 6–30; `null` mientras falte alguno.")
    esc_2: int | None = Field(description="Comunicación y Lenguaje (ítems 7–12), 6–30.")
    esc_3: int | None = Field(description="Anticipación y Flexibilidad (ítems 13–18), 6–30.")
    esc_4: int | None = Field(description="Simbolización (ítems 19–24), 6–30.")
    puntuados: int = Field(description="Cuántos de los 24 ítems tienen valor (24 = completo).")
    deltas: dict[str, int | None] | None = Field(
        description="Sólo B: `{total, esc_1..esc_4}` = B − A, escrito al firmar el B si el A del año está firmado; si no, `null`.",
    )
    interpretacion: dict[str, Interpretacion | None] | None = Field(description="Tramo del catálogo para cada Δ; `null` sin Δ.")
    alertas: list[AlertaDelta] = Field(description="Escalas cuyo Δ cae en un tramo con alerta institucional (catálogo).")
    estado: str = Field(description="`en_curso` | `firmado`.")
    firmado: bool
    firmas: list[dict[str, Any]]
    addendas: list[dict[str, Any]]
