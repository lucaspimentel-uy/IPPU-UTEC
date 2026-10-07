"""Schemas del IDEA (HCE-LB) — M11.3-b. Reglas: `app/services/idea.py`.

**Vacío y blanco (§5.115 b):** `""` en la fecha, los enteros y las FK es `null`; los textos
se normalizan en el servicio. `valor` de una dimensión se valida en el servicio (mensaje por
dimensión: `dim.D5.valor`), no acá.
"""
from datetime import date
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, StrictInt

from app.schemas.comunes import EnteroOpcional, FechaOpcional

# ── Ejemplos para Swagger ────────────────────────────────────────────────────
# Martín (usuario 1 de la demo): D1–D3 = 6·6·6 · D4–D6 = 6·4·4 · D7–D9 = 4·6·4 · D10–D12 = 4·4·4
_VALORES_MARTIN = [6, 6, 6, 6, 4, 4, 4, 6, 4, 4, 4, 4]
_DIM_MARTIN = {f"D{i + 1}": {"valor": v, "obs": None} for i, v in enumerate(_VALORES_MARTIN)}
_DIM_MARTIN["D5"] = {"valor": 4, "obs": "Uso funcional de pocas palabras en rutinas conocidas"}
_BANDA_EJEMPLO = {
    "perfil": "Moderado", "total_min": 56, "total_max": 75, "nivel_dsm": "Nivel 2",
    "texto": "Sugerencia: el perfil por escala del IDEA…",
}
EJEMPLO_IDEA = {
    "id": 11, "hce_id": 3, "anio": 2026, "dim": _DIM_MARTIN,
    "fecha_consenso": "2026-03-20", "sesiones": 6,
    "sintesis": "Perfil con mayor compromiso en Relación Social…",
    "objetivos": "Ampliar la iniciación de interacciones…",
    "evaluador_t1_id": 1, "evaluador_t2_id": 2,
    "total": 58, "esc_a": 18, "esc_b": 14, "esc_c": 14, "esc_d": 12, "puntuadas": 12,
    "banda": _BANDA_EJEMPLO, "estado": "firmado", "firmado": True,
    "firmas": [
        {"profesional_id": 1, "rol": "Psicología", "fecha": "2026-03-21"},
        {"profesional_id": 2, "rol": "Psicopedagogía", "fecha": "2026-03-21"},
    ],
    "addendas": [{"texto": "Corrección de la fecha de consenso.", "profesional_id": 1, "fecha": "2026-04-02"}],
    "manual_version": "Manual Unificado IDEA v1.0 (07/2026)",
}
EJEMPLO_RESULTADO_IDEA = {"data": EJEMPLO_IDEA, "warnings": []}
EJEMPLO_RESULTADO_IDEA_CON_RECOMENDACION = {"data": EJEMPLO_IDEA, "warnings": [{
    "code": "recomendacion_no_cumplida", "modulo": "HCE-LB", "recomendacion": "sesiones",
    "mensaje": "Se recomiendan al menos 5 sesiones de observación previas (cargadas: 3)",
    "minimo": 5, "valor": 3,
}]}
EJEMPLO_DELTA_IDEA = {
    "anio": 2027, "anio_anterior": 2026, "idea_id": 12, "idea_anterior_id": 11,
    "delta": {"total": -6, "esc_a": -2, "esc_b": -2, "esc_c": 0, "esc_d": -2},
}
EJEMPLO_VIGENTE = {"vigente": EJEMPLO_IDEA, "en_curso": None}


# ── Entrada ──────────────────────────────────────────────────────────────────
class DimensionEntrada(BaseModel):
    """Una dimensión. En un PATCH sólo se pisan las claves presentes (`{"valor": 4}` no borra la `obs`)."""

    valor: StrictInt | str | None = Field(
        None, description="Entero de 0 a 8, `\"NS\"` (observación insuficiente: **impide firmar**) o `null` (en blanco)."
    )
    obs: str | None = Field(None, description="Observación; `\"\"` se guarda como `null`.")


class _IdeaCampos(BaseModel):
    dim: dict[str, DimensionEntrada] | None = Field(
        None,
        description=(
            "Claves `D1`…`D12`; **sólo las que vengan** se tocan (un PATCH con `D5` y `D7` no modifica el resto). "
            "Una clave que no es una dimensión → 422."
        ),
    )
    fecha_consenso: FechaOpcional = None
    sesiones: EnteroOpcional = Field(None, description="Sesiones de observación previas (≥ 0).")
    sintesis: str | None = None
    objetivos: str | None = None
    evaluador_t1_id: EnteroOpcional = Field(None, description="Técnico 1. Para firmar: cargado, distinto del 2 y activo.")
    evaluador_t2_id: EnteroOpcional = Field(None, description="Técnico 2. Para firmar: cargado, distinto del 1 y activo.")


class IdeaCrear(_IdeaCampos):
    """Alta del IDEA de un año. `anio` es obligatorio; hay a lo sumo uno por `(expediente, anio)` (409)."""

    model_config = ConfigDict(json_schema_extra={"examples": [{
        "anio": 2026, "dim": _DIM_MARTIN, "fecha_consenso": "2026-03-20", "sesiones": 6,
        "sintesis": "Perfil con mayor compromiso en Relación Social…",
        "objetivos": "Ampliar la iniciación de interacciones…",
        "evaluador_t1_id": 1, "evaluador_t2_id": 2,
    }]})

    anio: int = Field(ge=1, le=32767)


class IdeaActualizar(_IdeaCampos):
    """Edición parcial de un IDEA **sin firmar** (si está firmado: 409). El año no se edita."""

    model_config = ConfigDict(json_schema_extra={"examples": [
        {"dim": {"D5": {"valor": 6}, "D7": {"valor": "NS", "obs": "Observación insuficiente"}}}
    ]})


class AddendaCrear(BaseModel):
    model_config = ConfigDict(json_schema_extra={"examples": [
        {"texto": "Corrección de la fecha de consenso.", "profesional_id": 1}
    ]})

    texto: str = Field(description="Obligatorio, no en blanco. Fecha y profesional quedan registrados.")
    profesional_id: int


# ── Salida ───────────────────────────────────────────────────────────────────
class Banda(BaseModel):
    """Tramo del total según `banda_idea`, **derivado en cada lectura** (nunca guardado)."""

    perfil: str
    total_min: int
    total_max: int
    nivel_dsm: str
    texto: str


class IdeaDetalle(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    hce_id: int
    anio: int
    dim: dict[str, DimensionEntrada] = Field(description="Siempre las 12 (`D1`…`D12`); las no cargadas, en blanco.")
    fecha_consenso: date | None
    sesiones: int | None
    sintesis: str | None
    objetivos: str | None
    evaluador_t1_id: int | None
    evaluador_t2_id: int | None
    total: int | None = Field(description="0–96. Suma las dimensiones numéricas (sin `NS` ni vacías); `null` si ninguna. Se congela al firmar.")
    esc_a: int | None = Field(description="Relación Social (D1–D3), 0–24.")
    esc_b: int | None = Field(description="Comunicación y Lenguaje (D4–D6), 0–24.")
    esc_c: int | None = Field(description="Anticipación y Flexibilidad (D7–D9), 0–24.")
    esc_d: int | None = Field(description="Simbolización (D10–D12), 0–24.")
    puntuadas: int = Field(description="Cuántas de las 12 dimensiones tienen número (12 = completo).")
    banda: Banda | None = Field(description="Banda del `total` en el catálogo; `null` si no hay total.")
    estado: str = Field(description="`en_curso` | `firmado`.")
    firmado: bool
    firmas: list[dict[str, Any]] = Field(description="`{profesional_id, rol, fecha}` de los dos evaluadores: una sola firma.")
    addendas: list[dict[str, Any]] = Field(description="`{texto, profesional_id, fecha}`, en orden.")
    manual_version: str | None = Field(description="Se escribe al firmar; un cambio posterior del manual no la toca.")


class IdeaVigente(BaseModel):
    """«Qué IDEA rige» (§5.97)."""

    vigente: IdeaDetalle | None = Field(description="El **firmado de mayor `anio`**.")
    en_curso: IdeaDetalle | None = Field(description="El **sin firmar del año en curso**; no desplaza al vigente.")


class IdeaDelta(BaseModel):
    """Δ interanual del IDEA (§5.36): el firmado de `anio` menos el firmado de `anio − 1`."""

    anio: int
    anio_anterior: int
    idea_id: int | None = Field(description="IDEA **firmado** de `anio`; `null` si no hay.")
    idea_anterior_id: int | None = Field(description="IDEA **firmado** de `anio − 1`; `null` si no hay.")
    delta: dict[str, int | None] | None = Field(
        description=(
            "`{total, esc_a..esc_d}` = actual − anterior; `null` si falta alguno de los dos firmados. "
            "En el IDEA **menor es mejor**: un Δ negativo es una mejora. Sin interpretación ni alerta "
            "(el catálogo `delta_interpretacion` es del protocolo)."
        ),
    )
