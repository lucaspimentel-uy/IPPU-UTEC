"""Transversales: DOC · ORG · VF · LOG + seguimiento — esquema v2 §2.3.

A diferencia de los módulos del flujo, nada de acá se firma ni bloquea: son
registros que acompañan al expediente durante todo el año.
"""
from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean, CheckConstraint, Date, DateTime, ForeignKey, Integer, Numeric, String,
    Text, func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:  # sólo para los tipos: evita el import circular en runtime
    from app.models.catalogos import BaremoCategoria, CategoriaDocumento


class Documento(Base):
    """HCE-DOC — adjuntos categorizados.

    `es_registro_historico` marca lo migrado de la HCE anterior (§10): esos
    documentos son **inmutables**. El servicio rechaza UPDATE y DELETE sobre
    ellos; acá sólo queda la marca, porque «inmutable» es una regla de negocio
    y las reglas viven en Python (§5.2.2).

    `archivo_ref` es una referencia, no el binario: el storage real es Fase 6.
    """
    __tablename__ = "documento"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    hce_id: Mapped[int] = mapped_column(
        ForeignKey("hce_diurna.id", ondelete="CASCADE"), index=True
    )
    categoria_id: Mapped[int] = mapped_column(
        ForeignKey("categoria_documento.id"), index=True
    )
    nombre: Mapped[str] = mapped_column(String(200))
    fecha_original: Mapped[date | None] = mapped_column(Date)
    fecha_carga: Mapped[date] = mapped_column(Date)
    es_registro_historico: Mapped[bool] = mapped_column(Boolean, default=False)
    archivo_ref: Mapped[str | None] = mapped_column(String(400))

    categoria: Mapped["CategoriaDocumento"] = relationship()


class AutorizacionImagen(Base):
    """§8.4 — condición previa para poder cargar fotos del NNA.

    PK = hce_id: es a lo sumo una por expediente.
    """
    __tablename__ = "autorizacion_imagen"

    hce_id: Mapped[int] = mapped_column(
        ForeignKey("hce_diurna.id", ondelete="CASCADE"), primary_key=True
    )
    registrada: Mapped[bool] = mapped_column(Boolean, default=False)
    fecha: Mapped[date | None] = mapped_column(Date)
    documento_id: Mapped[int | None] = mapped_column(ForeignKey("documento.id"), index=True)


class Foto(Base):
    """Foto individual (de un NNA) **o** grupal (de un grupo), nunca ambas.

    El `CHECK` con `num_nonnulls` es el XOR estructural: exactamente una de las
    dos FK tiene valor. Es integridad de forma, así que sí va en la BD.

    Lo que **no** va en la BD es el permiso: una foto individual exige la
    autorización del NNA, y una grupal la de **todas** las familias activas del
    grupo. Eso lo verifica el servicio, que además puede devolver *quiénes*
    faltan — un CHECK sólo podría decir que no.
    """
    __tablename__ = "foto"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    hce_id: Mapped[int | None] = mapped_column(
        ForeignKey("hce_diurna.id", ondelete="CASCADE"), index=True
    )
    grupo_id: Mapped[str | None] = mapped_column(ForeignKey("grupo.id"), index=True)
    descripcion: Mapped[str | None] = mapped_column(Text)
    fecha: Mapped[date | None] = mapped_column(Date)
    archivo_ref: Mapped[str | None] = mapped_column(String(400))

    __table_args__ = (
        CheckConstraint("num_nonnulls(hce_id, grupo_id) = 1", name="individual_xor_grupal"),
    )


class OrganismoInau(Base):
    """HCE-ORG — vínculo con INAU. PK = hce_id (0..1 por expediente)."""
    __tablename__ = "organismo_inau"

    hce_id: Mapped[int] = mapped_column(
        ForeignKey("hce_diurna.id", ondelete="CASCADE"), primary_key=True
    )
    sipi: Mapped[str | None] = mapped_column(String(40))
    convenio: Mapped[str | None] = mapped_column(String(120))
    referente: Mapped[str | None] = mapped_column(String(120))
    ingreso: Mapped[date | None] = mapped_column(Date)
    obs: Mapped[str | None] = mapped_column(Text)


class OrganismoBps(Base):
    """HCE-ORG — vínculo con BPS. Las alertas AYEX (60/30 días antes del
    vencimiento) las calcula el servidor desde `vencimiento`; no se almacenan.
    """
    __tablename__ = "organismo_bps"

    hce_id: Mapped[int] = mapped_column(
        ForeignKey("hce_diurna.id", ondelete="CASCADE"), primary_key=True
    )
    prestacion: Mapped[str | None] = mapped_column(String(120))
    tramite: Mapped[str | None] = mapped_column(String(120))
    estado: Mapped[str | None] = mapped_column(String(60))
    vencimiento: Mapped[date | None] = mapped_column(Date)
    obs: Mapped[str | None] = mapped_column(Text)


class RegistroOrganismo(Base):
    """Envíos a INAU y gestiones ante BPS.

    Tabla hija en vez de un JSONB dentro de `organismo_*` a propósito: el panel
    institucional necesita consultarlos y ordenarlos por fecha entre expedientes.
    """
    __tablename__ = "registro_organismo"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    hce_id: Mapped[int] = mapped_column(
        ForeignKey("hce_diurna.id", ondelete="CASCADE"), index=True
    )
    organismo: Mapped[str] = mapped_column(String(10))
    fecha: Mapped[date] = mapped_column(Date)
    detalle: Mapped[str | None] = mapped_column(Text)
    autor_id: Mapped[int | None] = mapped_column(ForeignKey("profesional.id"), index=True)

    __table_args__ = (
        CheckConstraint("organismo IN ('inau','bps')", name="organismo_valido"),
    )


class ValoracionFuncional(Base):
    """HCE-VF — valoración funcional (BUND / CIF). PK = hce_id.

    **Salvaguarda §7.5:** `categoria_id` la escribe el servidor **únicamente** a
    partir de `pct` (el porcentaje de la valoración oficial). Ningún camino del
    código la deriva de puntajes IDEA o IPPU-TEA: son constructos no equivalentes.
    El guard tipado vive en el servicio de VF (M11.3).

    La alerta de vigencia (90/30 días) se calcula, no se guarda.
    """
    __tablename__ = "valoracion_funcional"

    hce_id: Mapped[int] = mapped_column(
        ForeignKey("hce_diurna.id", ondelete="CASCADE"), primary_key=True
    )
    estado: Mapped[str | None] = mapped_column(String(60))
    fecha: Mapped[date | None] = mapped_column(Date)
    organismo: Mapped[str | None] = mapped_column(String(120))
    # Decimal, NO float: `Numeric` devuelve `Decimal` y mezclarlo con float en
    # una operación aritmética levanta TypeError. Importa para M11.3, donde
    # `categoria_baremo(pct)` compara este valor contra los cortes del baremo.
    pct: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    categoria_id: Mapped[int | None] = mapped_column(
        ForeignKey("baremo_categoria.id"), index=True
    )
    vigencia: Mapped[date | None] = mapped_column(Date)
    rnpcd: Mapped[str | None] = mapped_column(String(60))
    dominios: Mapped[dict | None] = mapped_column(JSONB)      # 6 dominios CIF
    capacidades: Mapped[str | None] = mapped_column(Text)
    barreras: Mapped[str | None] = mapped_column(Text)
    apoyos: Mapped[str | None] = mapped_column(Text)
    obs: Mapped[str | None] = mapped_column(Text)
    sintesis_funcional: Mapped[str | None] = mapped_column(Text)

    categoria: Mapped["BaremoCategoria | None"] = relationship()

    __table_args__ = (
        CheckConstraint("pct IS NULL OR (pct >= 0 AND pct <= 100)", name="rango_pct"),
    )


class Auditoria(Base):
    """HCE-LOG — registro de actividad. **Solo inserción.**

    No hay endpoints de UPDATE ni DELETE sobre esta tabla, y en despliegue se
    recomienda además `REVOKE UPDATE, DELETE ON auditoria FROM rol_app`. Eso es
    un permiso, no lógica de negocio, así que no contradice la decisión §5.2.2
    de no poner reglas en la BD.
    """
    __tablename__ = "auditoria"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    hce_id: Mapped[int] = mapped_column(
        ForeignKey("hce_diurna.id", ondelete="CASCADE"), index=True
    )
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    usuario_id: Mapped[int | None] = mapped_column(ForeignKey("profesional.id"), index=True)
    modulo: Mapped[str | None] = mapped_column(String(20))
    tipo: Mapped[str] = mapped_column(String(20))
    detalle: Mapped[str | None] = mapped_column(Text)

    __table_args__ = (
        CheckConstraint(
            "tipo IN ('edicion','firma','excepcion','addenda','alerta','carga','acceso')",
            name="tipo_valido",
        ),
    )


class Observacion(Base):
    """Seguimiento clínico libre. Se conserva igual que en la v1."""
    __tablename__ = "observacion"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    hce_id: Mapped[int] = mapped_column(
        ForeignKey("hce_diurna.id", ondelete="CASCADE"), index=True
    )
    fecha: Mapped[date] = mapped_column(Date)
    autor_id: Mapped[int | None] = mapped_column(ForeignKey("profesional.id"), index=True)
    texto: Mapped[str] = mapped_column(Text)


class Evento(Base):
    """Altas y bajas — la línea de tiempo del expediente. Igual que en la v1."""
    __tablename__ = "evento"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    hce_id: Mapped[int] = mapped_column(
        ForeignKey("hce_diurna.id", ondelete="CASCADE"), index=True
    )
    tipo: Mapped[str] = mapped_column(String(10))
    fecha: Mapped[date] = mapped_column(Date)
    titulo: Mapped[str | None] = mapped_column(String(200))
    descripcion: Mapped[str | None] = mapped_column(Text)
    autor_id: Mapped[int | None] = mapped_column(ForeignKey("profesional.id"), index=True)

    __table_args__ = (
        CheckConstraint("tipo IN ('alta','baja')", name="tipo_valido"),
    )
