"""Personas y estructura institucional: terapeutas, grupos y talleres."""
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.associations import grupo_taller, terapeuta_grupo


class Terapeuta(Base):
    """Profesional del equipo. Es también el usuario que inicia sesión (Fase 4)."""
    __tablename__ = "terapeuta"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(120))
    especialidad: Mapped[str | None] = mapped_column(String(80))
    email: Mapped[str] = mapped_column(String(160), unique=True)
    cargo: Mapped[str | None] = mapped_column(String(120))
    rol: Mapped[str] = mapped_column(String(20), default="tecnico")  # admin | tecnico
    hashed_password: Mapped[str | None] = mapped_column(String(255))  # se completa en Fase 4
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    grupos: Mapped[list["Grupo"]] = relationship(
        secondary=terapeuta_grupo, back_populates="encargados"
    )


class Grupo(Base):
    """Grupos de referencia A–E (por edad y modalidad)."""
    __tablename__ = "grupo"

    id: Mapped[str] = mapped_column(String(2), primary_key=True)  # "A".."E"
    franja: Mapped[str | None] = mapped_column(String(60))
    dias: Mapped[str | None] = mapped_column(String(60))
    horario: Mapped[str | None] = mapped_column(String(60))
    obs: Mapped[str | None] = mapped_column(Text)

    encargados: Mapped[list["Terapeuta"]] = relationship(
        secondary=terapeuta_grupo, back_populates="grupos"
    )
    talleres: Mapped[list["Taller"]] = relationship(
        secondary=grupo_taller, back_populates="grupos"
    )


class Taller(Base):
    """Catálogo de los talleres institucionales."""
    __tablename__ = "taller"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(120), unique=True)

    grupos: Mapped[list["Grupo"]] = relationship(
        secondary=grupo_taller, back_populates="talleres"
    )
