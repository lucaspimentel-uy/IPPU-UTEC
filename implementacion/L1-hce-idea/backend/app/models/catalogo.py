"""Catálogo del protocolo IDEA (datos de referencia): escalas, dimensiones y descriptores.

Esta parte es el "reglamento" del test: se carga una vez y la comparten todas las
evaluaciones. Vive en la base (no hardcodeada en el frontend) para tener una sola
fuente de verdad.
"""
from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Escala(Base):
    """Las 4 escalas del IDEA (A Relación Social · B Comunicación · C Anticipación · D Simbolización)."""
    __tablename__ = "escala"

    id: Mapped[str] = mapped_column(String(1), primary_key=True)  # "A".."D"
    nombre: Mapped[str] = mapped_column(String(80))
    orden: Mapped[int] = mapped_column(Integer)

    dimensiones: Mapped[list["DimensionCatalogo"]] = relationship(
        back_populates="escala", order_by="DimensionCatalogo.numero"
    )


class DimensionCatalogo(Base):
    """Las 12 dimensiones D1–D12, cada una dentro de una escala."""
    __tablename__ = "dimension_catalogo"

    id: Mapped[str] = mapped_column(String(4), primary_key=True)  # "D1".."D12"
    escala_id: Mapped[str] = mapped_column(ForeignKey("escala.id"))
    numero: Mapped[int] = mapped_column(Integer)  # 1..12
    nombre: Mapped[str] = mapped_column(String(160))

    escala: Mapped["Escala"] = relationship(back_populates="dimensiones")
    niveles: Mapped[list["NivelIdea"]] = relationship(
        back_populates="dimension", order_by="NivelIdea.puntaje"
    )


class NivelIdea(Base):
    """Descriptor oficial de cada nivel de puntaje (0, 2, 4, 6, 8) de cada dimensión."""
    __tablename__ = "nivel_idea"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    dimension_id: Mapped[str] = mapped_column(ForeignKey("dimension_catalogo.id"))
    puntaje: Mapped[int] = mapped_column(Integer)  # 0,2,4,6,8
    descriptor: Mapped[str] = mapped_column(Text)

    dimension: Mapped["DimensionCatalogo"] = relationship(back_populates="niveles")
