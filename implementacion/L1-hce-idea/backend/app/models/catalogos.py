"""Catálogos paramétricos — esquema v2 §2.4.

Decisión §5.2.3 (portabilidad paramétrica **mínima**): acá sólo entra lo que el
Documento Técnico exige que sea *dato* configurable. No hay `config_institucion`
ni `vocabulario`: eso sería portabilidad especulativa y se descartó.

Todo lo de este módulo se carga con `python -m app.seed_catalogos`.
"""
from sqlalchemy import Boolean, CheckConstraint, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class IdeaDimension(Base):
    """Las 12 dimensiones del IDEA (Rivière), agrupadas en 4 escalas.

    La escala se guarda desnormalizada (letra + nombre) en vez de en una tabla
    aparte: son 4 valores fijos del instrumento, no algo que IPPU configure.
    """
    __tablename__ = "idea_dimension"

    # id = número de dimensión (1..12). No es autoincremental a propósito: el
    # número es parte del instrumento, no un detalle de implementación.
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=False)
    codigo: Mapped[str] = mapped_column(String(4), unique=True)          # "D1".."D12"
    escala: Mapped[str] = mapped_column(String(1))                       # "A".."D"
    escala_nombre: Mapped[str] = mapped_column(String(60))
    nombre: Mapped[str] = mapped_column(String(120))

    niveles: Mapped[list["IdeaNivel"]] = relationship(
        back_populates="dimension", cascade="all, delete-orphan", order_by="IdeaNivel.valor"
    )

    __table_args__ = (
        CheckConstraint("id BETWEEN 1 AND 12", name="rango_dimension"),
        CheckConstraint("escala IN ('A','B','C','D')", name="escala_valida"),
    )


class IdeaNivel(Base):
    """Descriptores oficiales de cada dimensión: 5 niveles (8, 6, 4, 2, 0).

    El puntaje es 0–8 pero sólo se usan los pares — así está el instrumento y
    así lo muestra el editor de la demo.
    """
    __tablename__ = "idea_nivel"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    dimension_id: Mapped[int] = mapped_column(ForeignKey("idea_dimension.id", ondelete="CASCADE"))
    valor: Mapped[int] = mapped_column(Integer)
    descriptor: Mapped[str] = mapped_column(Text)

    dimension: Mapped["IdeaDimension"] = relationship(back_populates="niveles")

    __table_args__ = (
        UniqueConstraint("dimension_id", "valor", name="uq_idea_nivel_dimension_valor"),
        CheckConstraint("valor BETWEEN 0 AND 8", name="rango_valor"),
    )


class IppuItem(Base):
    """Los 24 ítems de la Escala IPPU-TEA: 4 escalas × 6 ítems, Likert 1–5.

    Instrumento propio de IPPU — por eso es catálogo y no constante: pueden
    ajustar la redacción sin migración.

    OJO con `referencia`: el prototipo trae citas (DSM-5-TR, CIF, papers) que
    **no están verificadas** contra las fuentes originales. Se transcriben tal
    cual; validarlas es punto abierto con IPPU.
    """
    __tablename__ = "ippu_item"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=False)  # 1..24
    escala: Mapped[int] = mapped_column(Integer)                 # 1..4
    escala_nombre: Mapped[str] = mapped_column(String(60))
    orden_en_escala: Mapped[int] = mapped_column(Integer)        # 1..6
    texto: Mapped[str] = mapped_column(Text)
    referencia: Mapped[str | None] = mapped_column(Text)

    __table_args__ = (
        UniqueConstraint("escala", "orden_en_escala", name="uq_ippu_item_escala_orden"),
        CheckConstraint("id BETWEEN 1 AND 24", name="rango_item"),
        CheckConstraint("escala BETWEEN 1 AND 4", name="rango_escala"),
        CheckConstraint("orden_en_escala BETWEEN 1 AND 6", name="rango_orden"),
    )


class BaremoCategoria(Base):
    """Baremo Único Nacional de Discapacidad (BUND) — Decreto 72/025.

    Parametrizable **a propósito** (§0.4): los cortes exactos están pendientes de
    que IPPU los confirme contra el anexo del decreto. Cambiarlos es un UPDATE,
    no una migración.

    Regla dura §7.5: la categoría se deriva **sólo** del porcentaje de la
    valoración oficial, nunca de puntajes IDEA o IPPU-TEA. El guard vive en el
    servicio (M11.3), no acá.
    """
    __tablename__ = "baremo_categoria"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    pct_min: Mapped[int] = mapped_column(Integer)
    pct_max: Mapped[int] = mapped_column(Integer)
    categoria: Mapped[str] = mapped_column(String(40), unique=True)
    rango: Mapped[str] = mapped_column(String(40))       # etiqueta legible, ej. "5 % a 24 %"
    implicancia: Mapped[str] = mapped_column(Text)
    orden: Mapped[int] = mapped_column(Integer)

    __table_args__ = (
        CheckConstraint("pct_min BETWEEN 0 AND 100", name="rango_min"),
        CheckConstraint("pct_max BETWEEN 0 AND 100", name="rango_max"),
        CheckConstraint("pct_min <= pct_max", name="min_menor_que_max"),
    )


class CategoriaDocumento(Base):
    """Categorías de HCE-DOC. Las que empiezan con «Registro histórico» marcan
    documentos migrados de la HCE anterior (§10): inmutables una vez cargados.
    """
    __tablename__ = "categoria_documento"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(120), unique=True)
    es_registro_historico: Mapped[bool] = mapped_column(Boolean, default=False)
    orden: Mapped[int] = mapped_column(Integer)


class Recordatorio(Base):
    """Períodos sugeridos del Manual (§4). **Nunca bloquean una firma**: informan.

    Configurables por coordinación — por eso `periodo` es texto libre y no una
    fecha calculada.
    """
    __tablename__ = "recordatorio"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    clave: Mapped[str] = mapped_column(String(10), unique=True)   # lb | pa | pb | ic
    texto: Mapped[str] = mapped_column(Text)
    periodo: Mapped[str] = mapped_column(String(60))
    activo: Mapped[bool] = mapped_column(Boolean, default=True)


class Taller(Base):
    """Talleres del plan IPPU.

    PENDIENTE: se siembran los 8 que usa la demo v4.1, que son los únicos con
    respaldo verificable. `esquema-datos-v2.md` §2.4 menciona 18 pero no hay
    fuente que los liste — está anotado como punto a definir con IPPU.
    """
    __tablename__ = "taller"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(80), unique=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)


class Servicio(Base):
    """Los 3 servicios de IPPU. Atención Diurna es el único en alcance;
    Taller Terapéutico y Clínica quedan reservados para Fase 2 (§0.3).

    Existen como fila desde ahora para que `persona_servicio` pueda modelar la
    identidad transversal sin forzar el esquema después (corrección del bug B).
    """
    __tablename__ = "servicio"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    clave: Mapped[str] = mapped_column(String(30), unique=True)
    nombre: Mapped[str] = mapped_column(String(60))
    activo: Mapped[bool] = mapped_column(Boolean, default=True)

    __table_args__ = (
        CheckConstraint(
            "clave IN ('atencion_diurna','taller_terapeutico','clinica')",
            name="clave_valida",
        ),
    )
