"""Identidad y organización — esquema v2 §2.1.

El cambio de fondo respecto de la v1: **identidad ≠ expediente**. La v1 tenía una
sola tabla `nna` con todo junto. Acá `persona` es la identidad (transversal a los
servicios) y `hce_diurna` es su expediente en Atención Diurna, que puede no
existir (corrección del bug B de `modelo-datos.md`: era 1:1 obligatorio).
"""
from datetime import date, datetime

from sqlalchemy import (
    Boolean, CheckConstraint, Date, DateTime, ForeignKey, Integer, SmallInteger,
    String, Text, UniqueConstraint, func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import OrigenMigracionMixin


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


class Persona(OrigenMigracionMixin, Base):
    """Identidad única, transversal a servicios (§3.1).

    La edad **no se guarda**: se calcula desde `fecha_nac`. Guardarla obliga a
    mantenerla al día y garantiza que en algún momento quede mal.

    Lleva los metadatos de origen (M12.1) porque en la migración hay personas
    que existen sólo en la HCE anterior: hay que poder decir cuáles y verificar
    ese subconjunto por muestreo.
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
    """Grupo de Atención Diurna de **un año**, con hasta 2 técnicos a cargo.

    **D9 (`handoff.md` §5.18), confirmada por el equipo el 2026-08-14.** El `id`
    es un entero autoincremental **sin significado**: no es la letra ni el
    nombre. La identidad real del grupo es `UNIQUE(nombre, anio)`.

    Antes la PK era la letra (`A..E`), y eso hacía que un grupo existiera **una
    sola vez en toda la historia**: crear el de 2027 obligaba a sobrescribir la
    fila de 2026 —se perdía quiénes fueron sus técnicos ese año— y los
    expedientes de 2026 (`hce_diurna.grupo_id`) pasaban a apuntar al grupo nuevo
    sin aviso. Con id propio, "Escolares 2026" y "Escolares 2027" son dos filas
    distintas y el vínculo de cada expediente no se mueve nunca; el `UNIQUE`
    impide el problema opuesto, dos filas "Escolares 2026" por error.

    **`nombre` es el nombre real del grupo** — Inicial · Escolares ·
    Preadolescentes · Adolescentes · Taller de Adolescentes (`handoff.md`
    §5.37 / §5.61). Los colores "Azul · Celeste · Naranja · Verde" que estuvieron
    acá eran **datos de demostración del Prototipo v4** leídos como si fueran el
    dominio de IPPU, corregidos por la reunión del 2026-08-21; `A..E` era una
    invención nuestra anterior. Va en la fila y no en un catálogo aparte: si en
    2028 dejan de usar "Preadolescentes", la fila de 2026 lo sigue diciendo.
    ("Taller de Adolescentes" es un grupo: IPPU lo confirmó el 2026-10-05,
    `handoff.md` §5.107, pregunta A5.)

    **Granularidad anual, no por fecha**: con fecha completa volverían a existir
    dos grupos "Escolares" en el mismo año, y `anio` es además la granularidad
    que ya usan `protocolo` e `informe_cierre`.

    ⚠️ **Límite aceptado:** si un técnico cambia a mitad de año, la fila se
    sobrescribe y sólo queda rastro en `auditoria`. Ver la nota de
    `docs/esquema-datos-v2.md` §2.1 antes de tocar esto.

    `tecnicoN_rol` es **texto libre** y no un enum: decisión §5.2.3 de
    portabilidad. Hoy IPPU usa "Psicólogo/a" y "Maestro/a", pero otra
    institución podría tener otros y no queremos una migración para eso.
    """
    __tablename__ = "grupo"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(60))       # "Inicial", "Escolares", … (§5.61)
    anio: Mapped[int] = mapped_column(SmallInteger)
    franja: Mapped[str | None] = mapped_column(String(60))
    dias: Mapped[str | None] = mapped_column(String(60))
    horario: Mapped[str | None] = mapped_column(String(60))
    tecnico1_id: Mapped[int | None] = mapped_column(ForeignKey("profesional.id"), index=True)
    tecnico1_rol: Mapped[str | None] = mapped_column(String(60))
    tecnico2_id: Mapped[int | None] = mapped_column(ForeignKey("profesional.id"), index=True)
    tecnico2_rol: Mapped[str | None] = mapped_column(String(60))
    obs: Mapped[str | None] = mapped_column(Text)

    tecnico1: Mapped["Profesional | None"] = relationship(foreign_keys=[tecnico1_id])
    tecnico2: Mapped["Profesional | None"] = relationship(foreign_keys=[tecnico2_id])

    __table_args__ = (
        UniqueConstraint("nombre", "anio", name="uq_grupo_nombre_anio"),
    )


class HceDiurna(OrigenMigracionMixin, Base):
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
    # **N.º de HC institucional** (§5.43, §5.109): entero ≥ 1000, único. Lo asigna
    # el servidor (`max + 1`, el primero 1001) y es la vía «N.º de historia clínica»
    # de la búsqueda; `id` es interno y no se busca. Los expedientes migrados
    # conservan el suyo (§5.113). El UNIQUE ya crea el índice que pide el Documento
    # Técnico §3.3. Nullable sólo para filas armadas fuera del servicio (tests,
    # migración): el alta por la API siempre lo completa.
    hc_historico: Mapped[int | None] = mapped_column(Integer, unique=True)
    # D9: apunta a la fila del grupo **de ese año**, no a una letra. Para
    # mostrarlo se usa `grupo.nombre`; el id no significa nada.
    grupo_id: Mapped[int | None] = mapped_column(ForeignKey("grupo.id"), index=True)

    diagnostico: Mapped[str | None] = mapped_column(String(200))
    cie11: Mapped[str | None] = mapped_column(String(20))
    # `nivel_soporte` **se retiró en M12.4** (`handoff.md` §5.24). Era la
    # etiqueta visible de la ficha, no un dato del diagnóstico de ingreso: en el
    # prototipo el propio HCE-SEV la pisa en cada edición
    # (`setSev()` → `p.nivel = sevResumen(p)`). El nivel de apoyo que IPPU juzga
    # vive en `severidad_dsm` —con justificación, fecha y autor— y la etiqueta
    # se deriva de ahí contra `severidad_nivel`.
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

    __table_args__ = (
        CheckConstraint("hc_historico >= 1000", name="hc_historico_desde_1000"),
    )

    persona: Mapped["Persona"] = relationship(back_populates="hce")
    grupo: Mapped["Grupo | None"] = relationship()
    # HCE-SEV (M12.4). 0..1: el expediente sin registro de severidad es válido —
    # el módulo no es obligatorio. `cascade` para que borrar el expediente se
    # lleve el registro, igual que el resto de los módulos.
    severidad: Mapped["SeveridadDsm | None"] = relationship(  # noqa: F821
        back_populates="hce", cascade="all, delete-orphan", uselist=False
    )
    # HCE-INC (M12.5). 0..1 como severidad, y por el mismo motivo: el expediente
    # sin ficha de inclusión es válido. El `UNIQUE(hce_id)` que lo garantiza está
    # en `Inclusion` y **quitarlo es todo lo que hay que hacer** para pasar a una
    # ficha por año lectivo, si IPPU contesta que así lo quiere (§5.51).
    inclusion: Mapped["Inclusion | None"] = relationship(  # noqa: F821
        back_populates="hce", cascade="all, delete-orphan", uselist=False
    )

    # HCE-PAI (M12.6). **Lista y no 0..1**, a diferencia de `severidad` e
    # `inclusion`: puede haber más de un PAI por año (inicial + actualización
    # semestral) y por eso `pai` no lleva `UNIQUE(hce_id, anio)` — §5.22.
    pai: Mapped[list["Pai"]] = relationship(  # noqa: F821
        back_populates="hce",
        cascade="all, delete-orphan",
        order_by="Pai.anio.desc(), Pai.fecha.desc(), Pai.id.desc()",
    )

    # La participación en talleres **no cuelga del expediente**: `hce_taller`
    # (N:M por `taller_id`) se retiró en M12.3 — `handoff.md` §5.20. Era un resto
    # de v1; el modelo que fija la especificación es `pai_taller { pai_id,
    # taller_nombre }`, por nombre y por instancia de PAI, y lo construye M12.6.
