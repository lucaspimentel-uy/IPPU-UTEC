"""Tablas puente para las relaciones muchos-a-muchos (M:N)."""
from sqlalchemy import Column, ForeignKey, Table

from app.core.database import Base

# Qué terapeuta es encargado de qué grupo(s).
terapeuta_grupo = Table(
    "terapeuta_grupo", Base.metadata,
    Column("terapeuta_id", ForeignKey("terapeuta.id", ondelete="CASCADE"), primary_key=True),
    Column("grupo_id", ForeignKey("grupo.id", ondelete="CASCADE"), primary_key=True),
)

# Qué talleres ofrece cada grupo.
grupo_taller = Table(
    "grupo_taller", Base.metadata,
    Column("grupo_id", ForeignKey("grupo.id", ondelete="CASCADE"), primary_key=True),
    Column("taller_id", ForeignKey("taller.id", ondelete="CASCADE"), primary_key=True),
)

# A qué talleres asiste cada NNA.
nna_taller = Table(
    "nna_taller", Base.metadata,
    Column("nna_id", ForeignKey("nna.id", ondelete="CASCADE"), primary_key=True),
    Column("taller_id", ForeignKey("taller.id", ondelete="CASCADE"), primary_key=True),
)
