"""Modelos SQLAlchemy. Importar todo acá para que queden registrados en Base.metadata
(lo necesita Alembic para autogenerar migraciones)."""
from app.models.areas_general import (
    EvaluacionArea, EvaluacionGeneral, ItemArea, ItemGeneral,
)
from app.models.associations import grupo_taller, nna_taller, terapeuta_grupo
from app.models.catalogo import DimensionCatalogo, Escala, NivelIdea
from app.models.evaluaciones import (
    DimensionIdea, EvaluacionIdea, EvaluacionLikert, ItemLikert,
)
from app.models.nna import Anamnesis, Evento, Nna, Observacion
from app.models.personas import Grupo, Taller, Terapeuta

__all__ = [
    "Escala", "DimensionCatalogo", "NivelIdea",
    "Terapeuta", "Grupo", "Taller",
    "Nna", "Anamnesis", "Evento", "Observacion",
    "EvaluacionIdea", "DimensionIdea", "EvaluacionLikert", "ItemLikert",
    "EvaluacionArea", "ItemArea", "EvaluacionGeneral", "ItemGeneral",
    "terapeuta_grupo", "grupo_taller", "nna_taller",
]
