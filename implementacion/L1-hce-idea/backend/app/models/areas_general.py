"""Evaluaciones PROVISIONALES 'por áreas' y 'general'.

⚠️ Estructura provisional: IPPU tiene el protocolo de estas evaluaciones en revisión.
Se modelan con el patrón portada+detalle (como IDEA/Likert), pero los indicadores y
dimensiones son texto libre a propósito, para poder ajustarlos sin migraciones grandes
cuando el equipo clínico defina el protocolo definitivo.

Fiel a la demo:
- Áreas:   por cada taller que asiste el NNA, N indicadores (Likert 1–5).
- General: dimensiones globales (Likert 1–5) + una observación clínica.
"""
from datetime import date, datetime

from sqlalchemy import (
    Date, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class EvaluacionArea(Base):
    """Cabecera de una evaluación por áreas/talleres (provisional)."""
    __tablename__ = "evaluacion_area"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nna_id: Mapped[int] = mapped_column(ForeignKey("nna.id", ondelete="CASCADE"))
    anio: Mapped[int] = mapped_column(Integer)
    fecha: Mapped[date | None] = mapped_column(Date)
    evaluador_id: Mapped[int | None] = mapped_column(ForeignKey("terapeuta.id"))
    observaciones: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    nna: Mapped["Nna"] = relationship()
    evaluador: Mapped["Terapeuta"] = relationship()
    items: Mapped[list["ItemArea"]] = relationship(
        back_populates="evaluacion", cascade="all, delete-orphan"
    )


class ItemArea(Base):
    """Un indicador (Likert 1–5) de un taller dentro de una evaluación por áreas."""
    __tablename__ = "item_area"
    __table_args__ = (
        UniqueConstraint("evaluacion_area_id", "taller_id", "indicador", name="uq_item_area"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    evaluacion_area_id: Mapped[int] = mapped_column(
        ForeignKey("evaluacion_area.id", ondelete="CASCADE")
    )
    taller_id: Mapped[int] = mapped_column(ForeignKey("taller.id"))
    indicador: Mapped[str] = mapped_column(String(160))  # texto libre (provisional)
    valor: Mapped[int] = mapped_column(Integer)  # 1..5

    evaluacion: Mapped["EvaluacionArea"] = relationship(back_populates="items")
    taller: Mapped["Taller"] = relationship()


class EvaluacionGeneral(Base):
    """Cabecera de la evaluación general / perfil global (provisional)."""
    __tablename__ = "evaluacion_general"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nna_id: Mapped[int] = mapped_column(ForeignKey("nna.id", ondelete="CASCADE"))
    anio: Mapped[int] = mapped_column(Integer)
    fecha: Mapped[date | None] = mapped_column(Date)
    evaluador_id: Mapped[int | None] = mapped_column(ForeignKey("terapeuta.id"))
    observacion_clinica: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    nna: Mapped["Nna"] = relationship()
    evaluador: Mapped["Terapeuta"] = relationship()
    items: Mapped[list["ItemGeneral"]] = relationship(
        back_populates="evaluacion", cascade="all, delete-orphan"
    )


class ItemGeneral(Base):
    """Una dimensión global (Likert 1–5) dentro de una evaluación general."""
    __tablename__ = "item_general"
    __table_args__ = (
        UniqueConstraint("evaluacion_general_id", "dimension", name="uq_item_general"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    evaluacion_general_id: Mapped[int] = mapped_column(
        ForeignKey("evaluacion_general.id", ondelete="CASCADE")
    )
    dimension: Mapped[str] = mapped_column(String(160))  # texto libre (provisional)
    valor: Mapped[int] = mapped_column(Integer)  # 1..5

    evaluacion: Mapped["EvaluacionGeneral"] = relationship(back_populates="items")
