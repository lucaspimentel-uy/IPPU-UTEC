"""Evaluaciones IDEA (enero/noviembre) e intermedia Likert (junio).

Cada instrumento usa el patrón "portada + detalle": una cabecera con los metadatos
y una tabla de detalle con el puntaje por dimensión / por ítem.
"""
from datetime import date, datetime

from sqlalchemy import (
    Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class EvaluacionIdea(Base):
    """Cabecera de una evaluación IDEA completa (enero=inicial o noviembre=final)."""
    __tablename__ = "evaluacion_idea"
    __table_args__ = (UniqueConstraint("nna_id", "anio", "periodo", name="uq_idea_nna_anio_periodo"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nna_id: Mapped[int] = mapped_column(ForeignKey("nna.id", ondelete="CASCADE"))
    anio: Mapped[int] = mapped_column(Integer)
    periodo: Mapped[str] = mapped_column(String(10))  # inicial | final
    fecha: Mapped[date | None] = mapped_column(Date)
    evaluador_id: Mapped[int | None] = mapped_column(ForeignKey("terapeuta.id"))
    total: Mapped[int | None] = mapped_column(Integer)  # 0..96 (derivado, = suma de dimensiones)
    observaciones: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    nna: Mapped["Nna"] = relationship()
    evaluador: Mapped["Terapeuta"] = relationship()
    dimensiones: Mapped[list["DimensionIdea"]] = relationship(
        back_populates="evaluacion", cascade="all, delete-orphan"
    )


class DimensionIdea(Base):
    """Puntaje 0–8 de una de las 12 dimensiones dentro de una evaluación IDEA."""
    __tablename__ = "dimension_idea"
    __table_args__ = (UniqueConstraint("evaluacion_id", "dimension_id", name="uq_dimidea_eval_dim"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    evaluacion_id: Mapped[int] = mapped_column(ForeignKey("evaluacion_idea.id", ondelete="CASCADE"))
    dimension_id: Mapped[str] = mapped_column(ForeignKey("dimension_catalogo.id"))
    puntaje: Mapped[int] = mapped_column(Integer)  # 0..8

    evaluacion: Mapped["EvaluacionIdea"] = relationship(back_populates="dimensiones")
    dimension: Mapped["DimensionCatalogo"] = relationship()


class EvaluacionLikert(Base):
    """Cabecera de la evaluación intermedia (Likert) de junio."""
    __tablename__ = "evaluacion_likert"
    __table_args__ = (UniqueConstraint("nna_id", "anio", name="uq_likert_nna_anio"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nna_id: Mapped[int] = mapped_column(ForeignKey("nna.id", ondelete="CASCADE"))
    anio: Mapped[int] = mapped_column(Integer)
    fecha: Mapped[date | None] = mapped_column(Date)
    evaluador_id: Mapped[int | None] = mapped_column(ForeignKey("terapeuta.id"))
    equivalente_idea: Mapped[float | None] = mapped_column(Float)  # (5 - promedio) x 2
    observaciones: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    nna: Mapped["Nna"] = relationship()
    evaluador: Mapped["Terapeuta"] = relationship()
    items: Mapped[list["ItemLikert"]] = relationship(
        back_populates="evaluacion", cascade="all, delete-orphan"
    )


class ItemLikert(Base):
    """Un ítem (1–5) de la evaluación Likert: 3 ítems por cada una de las 12 dimensiones."""
    __tablename__ = "item_likert"
    __table_args__ = (
        UniqueConstraint("evaluacion_likert_id", "dimension_id", "item_num", name="uq_itemlikert"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    evaluacion_likert_id: Mapped[int] = mapped_column(
        ForeignKey("evaluacion_likert.id", ondelete="CASCADE")
    )
    dimension_id: Mapped[str] = mapped_column(ForeignKey("dimension_catalogo.id"))
    item_num: Mapped[int] = mapped_column(Integer)  # 1..3
    valor: Mapped[int] = mapped_column(Integer)  # 1..5

    evaluacion: Mapped["EvaluacionLikert"] = relationship(back_populates="items")
    dimension: Mapped["DimensionCatalogo"] = relationship()
