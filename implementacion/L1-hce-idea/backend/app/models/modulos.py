"""Módulos del flujo CI → LB → PA → PB → IC — esquema v2 §2.2.

Tres cosas que hay que entender de este archivo:

1. **El estado visible no se almacena.** `bloqueado | borrador | firmado` lo
   deriva el servidor a partir de qué módulos previos están firmados. Guardarlo
   sería una segunda fuente de verdad que tarde o temprano queda desfasada — es
   el mismo diseño sin drift que ya usa la demo desde M1.

2. **Firma = bloqueo.** Un módulo firmado no se edita más; se corrige por
   addenda. El `UPDATE` lo rechaza el servicio (M11.3), no un trigger: decisión
   §5.2.2. La BD sólo garantiza integridad estructural.

3. **Los totales se materializan pero los calcula Python.** `total`, `esc_*` y
   `deltas` son columnas para que el panel institucional no tenga que recorrer
   JSONB, pero las escribe el servidor al guardar/firmar.
"""
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean, CheckConstraint, Date, ForeignKey, Integer, String, Text, UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import OrigenMigracionMixin

if TYPE_CHECKING:  # sólo para los tipos: evita el import circular en runtime
    from app.models.identidad import HceDiurna


class FirmaMixin:
    """Columnas de firma comunes a todos los módulos firmables.

    `firmas` es una lista de `{profesional_id, rol, fecha}`: doble para LB/PA/PB/IC
    (dos técnicos), de la familia para el CI.

    `excepcion` guarda la habilitación excepcional (`{motivo, texto,
    profesional_id, fecha}`) — permite firmar un módulo salteando la secuencia,
    dejando constancia. **El CI es el único que no la admite** (§4.2); esa regla
    la impone el servicio.
    """
    firmado: Mapped[bool] = mapped_column(Boolean, default=False)
    firmas: Mapped[list | None] = mapped_column(JSONB)
    addendas: Mapped[list | None] = mapped_column(JSONB)
    excepcion: Mapped[dict | None] = mapped_column(JSONB)


class Consentimiento(FirmaMixin, Base):
    """HCE-CI. El único bloqueo sin excepción posible de todo el flujo (§4.2).

    PK = hce_id: hay a lo sumo uno por expediente, y no necesita id propio.
    """
    __tablename__ = "consentimiento"

    hce_id: Mapped[int] = mapped_column(
        ForeignKey("hce_diurna.id", ondelete="CASCADE"), primary_key=True
    )
    firmante: Mapped[str | None] = mapped_column(String(120))
    fecha: Mapped[date | None] = mapped_column(Date)
    # {evaluacion, registro, comunicacion} — las 3 autorizaciones del CI.
    autorizaciones: Mapped[dict | None] = mapped_column(JSONB)
    documento_id: Mapped[int | None] = mapped_column(ForeignKey("documento.id"), index=True)


class Idea(FirmaMixin, OrigenMigracionMixin, Base):
    """HCE-LB — el IDEA como **línea base única**, no como evaluación anual.

    Este es el cambio de M4 que rompe con la v1 (`evaluacion_idea` era anual con
    una fila por dimensión). Ahora hay una instancia por línea base y las 12
    dimensiones van en `dim` JSONB: el instrumento se lee y se escribe entero,
    así que el detalle por fila no pagaba su costo.

    Es 1:N y no 1:1 porque un reingreso a más de 12 meses genera una **línea base
    nueva**; la vigente es la de mayor `fecha_consenso`.

    `dim` = 12 × `{valor: 0..8 | "NS", obs}`. "NS" (no sabe / no corresponde)
    excluye la dimensión del total y **bloquea la firma** — regla del servicio.

    **M12.1:** se agrega `manual_version` y el `migrado_origen JSONB` de M11.2 se
    reemplaza por los cuatro campos tipados de `OrigenMigracionMixin` (ver su
    docstring). Es el único módulo del flujo que los lleva: la estrategia de
    migración de IPPU trae **sólo el IDEA** estructurado, el resto entra como
    documento legacy.
    """
    __tablename__ = "idea"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    hce_id: Mapped[int] = mapped_column(
        ForeignKey("hce_diurna.id", ondelete="CASCADE"), index=True
    )
    dim: Mapped[dict | None] = mapped_column(JSONB)
    fecha_consenso: Mapped[date | None] = mapped_column(Date)
    sesiones: Mapped[int | None] = mapped_column(Integer)
    sintesis: Mapped[str | None] = mapped_column(Text)
    objetivos: Mapped[str | None] = mapped_column(Text)
    # Versión del manual con la que se aplicó esta evaluación. El Prototipo v4
    # lo pide explícitamente al backend: la escribe el servidor al firmar, con
    # `IDEA_MANUAL_VERSION` de `core/constantes.py`. Sin esto, corregir un
    # descriptor reescribiría el criterio de todas las evaluaciones pasadas.
    # Nullable porque los históricos migrados no la tienen.
    manual_version: Mapped[str | None] = mapped_column(String(60))

    # Materializados por el servidor. Menor = mejor (0 = sin trastorno).
    total: Mapped[int | None] = mapped_column(Integer)
    esc_a: Mapped[int | None] = mapped_column(Integer)
    esc_b: Mapped[int | None] = mapped_column(Integer)
    esc_c: Mapped[int | None] = mapped_column(Integer)
    esc_d: Mapped[int | None] = mapped_column(Integer)

    hce: Mapped["HceDiurna"] = relationship()

    __table_args__ = (
        CheckConstraint("total IS NULL OR total BETWEEN 0 AND 96", name="rango_total"),
    )


class Protocolo(FirmaMixin, Base):
    """HCE-PA / HCE-PB — Escala IPPU-TEA: 24 ítems Likert 1–5, por año.

    A = mitad de año, B = fin de año. `UNIQUE(hce_id, tipo, anio)` impide dos
    protocolos A del mismo año.

    **Regla dura §5.2 (no-homologabilidad):** `deltas` es siempre B − A entre dos
    protocolos. El IDEA y la IPPU-TEA miden constructos distintos y en direcciones
    opuestas (en el IDEA menor es mejor; acá mayor es mejor), así que nunca se
    restan entre sí. El `CHECK` de abajo garantiza lo estructural — que sólo un B
    tenga deltas — pero *quién* puede restarse con quién lo impone el servicio
    con una función tipada que sólo acepta dos `Protocolo`.
    """
    __tablename__ = "protocolo"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    hce_id: Mapped[int] = mapped_column(
        ForeignKey("hce_diurna.id", ondelete="CASCADE"), index=True
    )
    tipo: Mapped[str] = mapped_column(String(1))
    anio: Mapped[int] = mapped_column(Integer)
    fecha: Mapped[date | None] = mapped_column(Date)
    semanas: Mapped[int | None] = mapped_column(Integer)
    # 24 × {valor: 1..5, obs}. La obs es obligatoria si el valor es 1 o 5.
    items: Mapped[dict | None] = mapped_column(JSONB)
    sint_tec1: Mapped[str | None] = mapped_column(Text)
    sint_tec2: Mapped[str | None] = mapped_column(Text)
    otros: Mapped[str | None] = mapped_column(Text)
    ajustes: Mapped[str | None] = mapped_column(Text)          # sólo B
    # Sólo B. Lo escribe el servidor al firmar; si no hay A firmado queda NULL
    # y se registra la constancia en auditoría.
    deltas: Mapped[dict | None] = mapped_column(JSONB)

    total: Mapped[int | None] = mapped_column(Integer)
    esc_1: Mapped[int | None] = mapped_column(Integer)
    esc_2: Mapped[int | None] = mapped_column(Integer)
    esc_3: Mapped[int | None] = mapped_column(Integer)
    esc_4: Mapped[int | None] = mapped_column(Integer)

    hce: Mapped["HceDiurna"] = relationship()

    __table_args__ = (
        UniqueConstraint("hce_id", "tipo", "anio", name="uq_protocolo_hce_tipo_anio"),
        CheckConstraint("tipo IN ('A','B')", name="tipo_valido"),
        CheckConstraint("total IS NULL OR total BETWEEN 24 AND 120", name="rango_total"),
        CheckConstraint("tipo = 'B' OR deltas IS NULL", name="deltas_solo_en_b"),
    )


class InformeCierre(FirmaMixin, Base):
    """HCE-IC — Informe de Cierre Anual. «El único informe válido» (§5.3).

    Bug A de `modelo-datos.md` corregido: era 0..1 por expediente (uno en toda la
    vida del NNA), cuando en realidad es **anual**, igual que el protocolo. De ahí
    el `UNIQUE(hce_id, anio)`.

    El PDF se genera desde acá y sólo desde acá: si el informe no está firmado,
    no hay informe.
    """
    __tablename__ = "informe_cierre"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    hce_id: Mapped[int] = mapped_column(
        ForeignKey("hce_diurna.id", ondelete="CASCADE"), index=True
    )
    anio: Mapped[int] = mapped_column(Integer)
    fecha: Mapped[date | None] = mapped_column(Date)
    sint_escala: Mapped[dict | None] = mapped_column(JSONB)     # 4 síntesis, una por escala
    val_tec1: Mapped[str | None] = mapped_column(Text)
    val_tec2: Mapped[str | None] = mapped_column(Text)
    recomendaciones: Mapped[str | None] = mapped_column(Text)
    orientaciones: Mapped[str | None] = mapped_column(Text)
    # {firmante, fecha} — la familia acusa recibo DESPUÉS de la firma técnica.
    recibi: Mapped[dict | None] = mapped_column(JSONB)

    hce: Mapped["HceDiurna"] = relationship()

    __table_args__ = (
        UniqueConstraint("hce_id", "anio", name="uq_informe_cierre_hce_anio"),
    )
