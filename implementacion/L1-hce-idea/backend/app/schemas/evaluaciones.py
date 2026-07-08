"""Schemas de evaluaciones IDEA (completa) e intermedia Likert."""
from datetime import date

from pydantic import ConfigDict, Field, field_validator

from app.schemas.base import ORMModel

DIMS_IDEA = {f"D{i}" for i in range(1, 13)}

# Ejemplos para que Swagger ("Try it out") prefille cuerpos válidos.
_EJEMPLO_DIMS = [
    {"dimension_id": f"D{i}", "puntaje": p}
    for i, p in zip(range(1, 13), [4, 4, 4, 3, 3, 3, 2, 2, 2, 2, 2, 2])
]
_EJEMPLO_ITEMS = [
    {"dimension_id": f"D{i}", "item_num": j, "valor": 3}
    for i in range(1, 13) for j in range(1, 4)
]


# ---- IDEA ----
class DimensionIdeaIn(ORMModel):
    dimension_id: str
    puntaje: int = Field(ge=0, le=8, description="0–8 (impares 1,3,5,7 para casos intermedios)")


class EvaluacionIdeaCreate(ORMModel):
    model_config = ConfigDict(json_schema_extra={"example": {
        "anio": 2026, "periodo": "inicial", "fecha": "2026-01-15", "evaluador_id": 1,
        "observaciones": "Evaluación inicial del ciclo.", "dimensiones": _EJEMPLO_DIMS,
    }})

    anio: int
    periodo: str  # inicial | final
    fecha: date | None = None
    evaluador_id: int | None = None
    observaciones: str | None = None
    dimensiones: list[DimensionIdeaIn]

    @field_validator("periodo")
    @classmethod
    def _periodo(cls, v: str) -> str:
        if v not in ("inicial", "final"):
            raise ValueError("periodo debe ser 'inicial' o 'final'")
        return v

    @field_validator("dimensiones")
    @classmethod
    def _doce_dimensiones(cls, v: list[DimensionIdeaIn]) -> list[DimensionIdeaIn]:
        ids = [d.dimension_id for d in v]
        if len(ids) != 12 or set(ids) != DIMS_IDEA:
            raise ValueError("Se requieren exactamente las 12 dimensiones D1..D12, sin repetir")
        return v


class DimensionIdeaOut(DimensionIdeaIn):
    pass


class EvaluacionIdeaOut(ORMModel):
    id: int
    nna_id: int
    anio: int
    periodo: str
    fecha: date | None = None
    evaluador_id: int | None = None
    total: int | None = None
    observaciones: str | None = None
    dimensiones: list[DimensionIdeaOut] = []


# ---- Likert (intermedia) ----
class ItemLikertIn(ORMModel):
    dimension_id: str
    item_num: int = Field(ge=1, le=3)
    valor: int = Field(ge=1, le=5)


class EvaluacionLikertCreate(ORMModel):
    model_config = ConfigDict(json_schema_extra={"example": {
        "anio": 2026, "fecha": "2026-06-10", "evaluador_id": 1,
        "observaciones": "Evaluación intermedia (junio).", "items": _EJEMPLO_ITEMS,
    }})

    anio: int
    fecha: date | None = None
    evaluador_id: int | None = None
    observaciones: str | None = None
    items: list[ItemLikertIn]

    @field_validator("items")
    @classmethod
    def _items(cls, v: list[ItemLikertIn]) -> list[ItemLikertIn]:
        if not v:
            raise ValueError("Se requiere al menos un ítem")
        for it in v:
            if it.dimension_id not in DIMS_IDEA:
                raise ValueError(f"dimension_id inválido: {it.dimension_id}")
        return v


class EvaluacionLikertOut(ORMModel):
    id: int
    nna_id: int
    anio: int
    fecha: date | None = None
    evaluador_id: int | None = None
    equivalente_idea: float | None = None
    observaciones: str | None = None
    items: list[ItemLikertIn] = []


def equivalente_idea(items: list[ItemLikertIn]) -> float:
    """Convierte los ítems Likert a equivalente IDEA (0–96).

    Por dimensión: (5 − promedio de sus ítems) × 2  →  0–8.  Total = suma de las 12.
    """
    from collections import defaultdict

    por_dim: dict[str, list[int]] = defaultdict(list)
    for it in items:
        por_dim[it.dimension_id].append(it.valor)
    total = sum((5 - sum(v) / len(v)) * 2 for v in por_dim.values())
    return round(total, 1)
