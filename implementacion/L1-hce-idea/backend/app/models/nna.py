"""NNA (expediente) y datos clínicos: anamnesis y línea de tiempo de eventos."""
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.associations import nna_taller


class Nna(Base):
    """Expediente del niño, niña o adolescente. Es el centro del modelo."""
    __tablename__ = "nna"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(80))
    apellido: Mapped[str] = mapped_column(String(80))
    ci: Mapped[str | None] = mapped_column(String(20), unique=True)
    fecha_nac: Mapped[date | None] = mapped_column(Date)  # la edad se calcula, no se guarda
    sexo: Mapped[str | None] = mapped_column(String(20))
    localidad: Mapped[str | None] = mapped_column(String(80))
    referente: Mapped[str | None] = mapped_column(String(120))
    telefono: Mapped[str | None] = mapped_column(String(40))

    grupo_id: Mapped[str | None] = mapped_column(ForeignKey("grupo.id"))
    tecnico_id: Mapped[int | None] = mapped_column(ForeignKey("terapeuta.id"))

    diagnostico: Mapped[str | None] = mapped_column(String(160))
    dx_fecha: Mapped[date | None] = mapped_column(Date)
    derivacion: Mapped[str | None] = mapped_column(String(160))
    grado_apoyo: Mapped[str | None] = mapped_column(String(80))
    antecedentes: Mapped[str | None] = mapped_column(Text)
    medicacion: Mapped[str | None] = mapped_column(String(160))
    alerta: Mapped[str | None] = mapped_column(String(160))

    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    fecha_baja: Mapped[date | None] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, onupdate=func.now())

    grupo: Mapped["Grupo"] = relationship()
    tecnico: Mapped["Terapeuta"] = relationship()
    talleres: Mapped[list["Taller"]] = relationship(secondary=nna_taller)

    @property
    def edad(self) -> int | None:
        """Edad en años, calculada desde fecha_nac (no se persiste)."""
        if not self.fecha_nac:
            return None
        hoy = date.today()
        return hoy.year - self.fecha_nac.year - (
            (hoy.month, hoy.day) < (self.fecha_nac.month, self.fecha_nac.day)
        )
    anamnesis: Mapped["Anamnesis"] = relationship(
        back_populates="nna", uselist=False, cascade="all, delete-orphan"
    )
    eventos: Mapped[list["Evento"]] = relationship(
        back_populates="nna", cascade="all, delete-orphan", order_by="Evento.fecha"
    )
    observaciones: Mapped[list["Observacion"]] = relationship(
        back_populates="nna", cascade="all, delete-orphan", order_by="Observacion.fecha"
    )


class Anamnesis(Base):
    """Historia de ingreso. Relación 1:1 con el NNA (su PK es también FK)."""
    __tablename__ = "anamnesis"

    nna_id: Mapped[int] = mapped_column(ForeignKey("nna.id", ondelete="CASCADE"), primary_key=True)
    motivo: Mapped[str | None] = mapped_column(Text)
    perinatal: Mapped[str | None] = mapped_column(Text)
    desarrollo: Mapped[str | None] = mapped_column(Text)
    familiares: Mapped[str | None] = mapped_column(Text)

    nna: Mapped["Nna"] = relationship(back_populates="anamnesis")


class Evento(Base):
    """Línea de tiempo clínica no-evaluativa: alta, nota clínica, baja."""
    __tablename__ = "evento"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nna_id: Mapped[int] = mapped_column(ForeignKey("nna.id", ondelete="CASCADE"))
    tipo: Mapped[str] = mapped_column(String(20))  # alta | nota | baja
    fecha: Mapped[date] = mapped_column(Date)
    titulo: Mapped[str | None] = mapped_column(String(160))
    descripcion: Mapped[str | None] = mapped_column(Text)
    autor_id: Mapped[int | None] = mapped_column(ForeignKey("terapeuta.id"))

    nna: Mapped["Nna"] = relationship(back_populates="eventos")
    autor: Mapped["Terapeuta"] = relationship()


class Observacion(Base):
    """Observación clínica de seguimiento: fecha, autor (quién la hizo) y texto.

    Es la pestaña 'Observación' de la HCE (registro cualitativo del seguimiento).
    A diferencia de `evento` (hitos alta/baja), es el diario de observaciones del NNA.
    """
    __tablename__ = "observacion"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nna_id: Mapped[int] = mapped_column(ForeignKey("nna.id", ondelete="CASCADE"))
    fecha: Mapped[date] = mapped_column(Date)
    autor_id: Mapped[int | None] = mapped_column(ForeignKey("terapeuta.id"))
    texto: Mapped[str] = mapped_column(Text)

    nna: Mapped["Nna"] = relationship(back_populates="observaciones")
    autor: Mapped["Terapeuta"] = relationship()
