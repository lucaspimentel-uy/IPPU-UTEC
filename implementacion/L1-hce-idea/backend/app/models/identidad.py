"""Identidad y organización — esquema v2 §2.1.

El cambio de fondo respecto de la v1: **identidad ≠ expediente**. La v1 tenía una
sola tabla `nna` con todo junto. Acá `persona` es la identidad (transversal a los
servicios) y `hce_diurna` es su expediente en Atención Diurna, que puede no
existir (corrección del bug B de `modelo-datos.md`: era 1:1 obligatorio).
"""
from datetime import date, datetime

from sqlalchemy import (
    Boolean, CheckConstraint, Date, DateTime, ForeignKey, Integer, String, Text,
    UniqueConstraint, func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Profesional(Base):
    """Ex-`terapeuta` de la v1. Es también evaluador y firmante de los módulos."""
    __tablename__ = "profesional"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(120))
    especialidad: Mapped[str | None] = mapped_column(String(80))
    email: Mapped[str] = mapped_column(String(120), unique=True)
    rol: Mapped[str] = mapped_column(String(20), default="tecnico")
    # Fase 4 (JWT). Nullable mientras no haya login real.
    hashed_password: Mapped[str | None] = mapped_column(String(200))
    activo: Mapped[bool] = mapped_column(Boolean, default=True)

    __table_args__ = (
        CheckConstraint("rol IN ('admin','tecnico')", name="rol_valido"),
    )


class Persona(Base):
    """Identidad única, transversal a servicios (§3.1).

    La edad **no se guarda**: se calcula desde `fecha_nac`. Guardarla obliga a
    mantenerla al día y garantiza que en algún momento quede mal.
    """
    __tablename__ = "persona"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(80))
    apellido: Mapped[str] = mapped_column(String(80))
    ci: Mapped[str] = mapped_column(String(20), unique=True)
    fecha_nac: Mapped[date] = mapped_column(Date)
    sexo: Mapped[str | None] = mapped_column(String(20))
    localidad: Mapped[str | None] = mapped_column(String(80))
    referente: Mapped[str | None] = mapped_column(String(120))
    telefono: Mapped[str | None] = mapped_column(String(40))

    servicios: Mapped[list["PersonaServicio"]] = relationship(
        back_populates="persona", cascade="all, delete-orphan"
    )
    hce: Mapped["HceDiurna | None"] = relationship(back_populates="persona")


class PersonaServicio(Base):
    """N:M persona ↔ servicio. Permite que alguien esté en Atención Diurna y en
    Taller Terapéutico sin duplicar su identidad.
    """
    __tablename__ = "persona_servicio"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    persona_id: Mapped[int] = mapped_column(ForeignKey("persona.id", ondelete="CASCADE"))
    servicio_id: Mapped[int] = mapped_column(ForeignKey("servicio.id"), index=True)
    fecha_alta: Mapped[date] = mapped_column(Date)
    fecha_baja: Mapped[date | None] = mapped_column(Date)

    persona: Mapped["Persona"] = relationship(back_populates="servicios")

    __table_args__ = (
        UniqueConstraint("persona_id", "servicio_id", name="uq_persona_servicio"),
    )


class Grupo(Base):
    """Grupo de Atención Diurna (A..E), con hasta 2 técnicos a cargo.

    `tecnicoN_rol` es **texto libre** y no un enum: decisión §5.2.3 de
    portabilidad. Hoy IPPU usa "Psicólogo/a" y "Maestro/a", pero otra
    institución podría tener otros y no queremos una migración para eso.

    ⚠️ **LIMITACIÓN CONOCIDA, SIN RESOLVER.** La PK es sólo la letra pero la
    tabla lleva `anio`: el grupo A existe para **un único año en toda la
    historia**. Crear el A de 2027 obliga a sobrescribir el de 2026 —se pierde
    quiénes fueron sus técnicos— y los expedientes viejos, que en `grupo_id`
    guardan sólo la letra, pasan a apuntar al grupo nuevo sin aviso.
    Está así porque así lo especifica `docs/esquema-datos-v2.md` §2.1; cambiarlo
    modifica ese documento y se decide por escrito. Ver la nota en el esquema y
    `docs/notas/puntos-a-validar.md` §2.6 antes de tocar esta tabla.
    """
    __tablename__ = "grupo"

    id: Mapped[str] = mapped_column(String(2), primary_key=True)   # "A".."E"
    franja: Mapped[str | None] = mapped_column(String(60))
    dias: Mapped[str | None] = mapped_column(String(60))
    horario: Mapped[str | None] = mapped_column(String(60))
    anio: Mapped[int] = mapped_column(Integer)
    tecnico1_id: Mapped[int | None] = mapped_column(ForeignKey("profesional.id"), index=True)
    tecnico1_rol: Mapped[str | None] = mapped_column(String(60))
    tecnico2_id: Mapped[int | None] = mapped_column(ForeignKey("profesional.id"), index=True)
    tecnico2_rol: Mapped[str | None] = mapped_column(String(60))
    obs: Mapped[str | None] = mapped_column(Text)

    tecnico1: Mapped["Profesional | None"] = relationship(foreign_keys=[tecnico1_id])
    tecnico2: Mapped["Profesional | None"] = relationship(foreign_keys=[tecnico2_id])


class HceDiurna(Base):
    """El expediente en el Servicio de Atención Diurna. HCE-00.

    Este módulo **siempre está abierto**: no se firma y por lo tanto no se
    bloquea nunca (a diferencia de CI/LB/PA/PB/IC). Editarlo sí deja rastro en
    `auditoria`, pero eso lo hace el servicio.

    Un expediente por persona. Los ciclos anuales no viven acá sino en
    `protocolo.anio` e `informe_cierre.anio` — así una persona conserva un solo
    expediente a lo largo de los años.
    """
    __tablename__ = "hce_diurna"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    persona_id: Mapped[int] = mapped_column(ForeignKey("persona.id"), unique=True)
    # Número de historia de la HCE anterior. Identificador secundario (§10):
    # sirve para cruzar con el archivo histórico, no como clave.
    hc_historico: Mapped[str | None] = mapped_column(String(30))
    grupo_id: Mapped[str | None] = mapped_column(ForeignKey("grupo.id"), index=True)

    diagnostico: Mapped[str | None] = mapped_column(String(200))
    cie11: Mapped[str | None] = mapped_column(String(20))
    nivel_soporte: Mapped[str | None] = mapped_column(String(40))
    dx_fecha: Mapped[date | None] = mapped_column(Date)
    derivacion: Mapped[str | None] = mapped_column(String(200))
    medicacion: Mapped[str | None] = mapped_column(Text)
    alerta: Mapped[str | None] = mapped_column(Text)
    anamnesis: Mapped[dict | None] = mapped_column(JSONB)

    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    fecha_baja: Mapped[date | None] = mapped_column(Date)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    actualizado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    persona: Mapped["Persona"] = relationship(back_populates="hce")
    grupo: Mapped["Grupo | None"] = relationship()
    talleres: Mapped[list["HceTaller"]] = relationship(
        back_populates="hce", cascade="all, delete-orphan"
    )


class HceTaller(Base):
    """N:M expediente ↔ taller: el plan de talleres del NNA."""
    __tablename__ = "hce_taller"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    hce_id: Mapped[int] = mapped_column(ForeignKey("hce_diurna.id", ondelete="CASCADE"))
    taller_id: Mapped[int] = mapped_column(ForeignKey("taller.id"), index=True)

    hce: Mapped["HceDiurna"] = relationship(back_populates="talleres")

    __table_args__ = (
        UniqueConstraint("hce_id", "taller_id", name="uq_hce_taller"),
    )
