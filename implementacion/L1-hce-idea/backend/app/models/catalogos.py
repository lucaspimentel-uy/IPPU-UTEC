"""Catálogos paramétricos — esquema v2 §2.4.

Decisión §5.2.3, **ampliada por D6** (`handoff.md` §5.15): acá entra lo que la
institución efectivamente ajusta. Suman en M12.1 las **bandas del IDEA**, la
**interpretación del Δ** y los **recordatorios** ampliados. Sigue sin haber
`config_institucion` genérica ni UI de configuración: eso sería portabilidad
especulativa y se descartó.

**Lo que NO es catálogo** vive en `app/core/constantes.py` (Likert, dominios y
niveles de VF, prestaciones, vocabulario): texto fijo de presentación que
acompaña a un valor ya guardado. El criterio completo está en el docstring de
ese archivo.

Todo lo de este módulo se carga con `python -m app.seed_catalogos`.
"""
from sqlalchemy import (
    Boolean, CheckConstraint, ForeignKey, Integer, SmallInteger, String, Text,
    UniqueConstraint,
)
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
    # Resumen de una línea de qué mide la dimensión (`IDEA_DESC.que` del
    # Prototipo v4). Es el encabezado del editor de niveles; la versión larga
    # está en `idea_ficha.definicion`.
    que_evalua: Mapped[str | None] = mapped_column(Text)

    niveles: Mapped[list["IdeaNivel"]] = relationship(
        back_populates="dimension", cascade="all, delete-orphan", order_by="IdeaNivel.valor"
    )
    ficha: Mapped["IdeaFicha | None"] = relationship(
        back_populates="dimension", cascade="all, delete-orphan", uselist=False
    )
    ejemplos: Mapped[list["IdeaEjemplo"]] = relationship(
        back_populates="dimension", cascade="all, delete-orphan", order_by="IdeaEjemplo.valor"
    )

    __table_args__ = (
        CheckConstraint("id BETWEEN 1 AND 12", name="rango_dimension"),
        CheckConstraint("escala IN ('A','B','C','D')", name="escala_valida"),
    )


class IdeaNivel(Base):
    """Descriptores oficiales de cada dimensión: 5 niveles (8, 6, 4, 2, 0).

    El puntaje es 0–8 pero sólo se usan los pares — así está el instrumento y
    así lo muestra el editor de la demo.

    **`descriptor` es el texto literal de la fuente oficial** (Rivière, 1997/2002
    — `docs/markdown/escala-del-inventario-del-espectro-autista-idea.md`) y **no
    se reemplaza por el del Prototipo v4** (decisión de M12.1). El diff completo
    está en la bitácora del 2026-08-14: 59 de 60 difieren textualmente pero
    **ninguno por corrimiento de niveles** (58/60 calzan mejor contra su propio
    nivel, y el texto de un nivel nuestro nunca aparece en otro nivel del
    prototipo). El corrimiento que el prototipo dice haber corregido es contra
    una «Guía del aplicador» interna de IPPU que nunca tuvimos y de la que los
    nuestros no derivan. Cambiarlos sería perder fidelidad al instrumento a
    cambio de nada.

    **`descriptor_breve` es la paráfrasis condensada del prototipo** (`IDEA_DESC`),
    que sirve en pantalla —los botones de nivel del editor— donde el texto
    oficial no entra. Es un campo **aparte**, nunca un reemplazo: el que vale
    para el instrumento firmado es `descriptor`.
    """
    __tablename__ = "idea_nivel"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    dimension_id: Mapped[int] = mapped_column(ForeignKey("idea_dimension.id", ondelete="CASCADE"))
    valor: Mapped[int] = mapped_column(Integer)
    descriptor: Mapped[str] = mapped_column(Text)
    descriptor_breve: Mapped[str | None] = mapped_column(Text)

    dimension: Mapped["IdeaDimension"] = relationship(back_populates="niveles")

    __table_args__ = (
        UniqueConstraint("dimension_id", "valor", name="uq_idea_nivel_dimension_valor"),
        CheckConstraint("valor BETWEEN 0 AND 8", name="rango_valor"),
    )


class IdeaFicha(Base):
    """Ficha de ayuda contextual por dimensión (`IDEA_FICHAS` del Prototipo v4).

    Es el primero de los tres niveles de ayuda que pide el changelog v2 del
    prototipo: **ficha** (esto) → **ejemplo clínico por nivel** (`IdeaEjemplo`) →
    **reglas generales** (`IdeaRegla`).

    Una por dimensión, de ahí el `UNIQUE` sobre `dimension_id`.
    """
    __tablename__ = "idea_ficha"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    dimension_id: Mapped[int] = mapped_column(
        ForeignKey("idea_dimension.id", ondelete="CASCADE"), unique=True
    )
    codigo: Mapped[str] = mapped_column(String(12), unique=True)   # "IDEA-D01".."IDEA-D12"
    titulo: Mapped[str] = mapped_column(String(160))
    escala_nombre: Mapped[str] = mapped_column(String(60))
    definicion: Mapped[str] = mapped_column(Text)
    objetivo: Mapped[str] = mapped_column(Text)
    indicadores: Mapped[str] = mapped_column(Text)
    no_confundir: Mapped[str] = mapped_column(Text)
    errores_frecuentes: Mapped[str] = mapped_column(Text)
    preguntas_guia: Mapped[str] = mapped_column(Text)
    claves_martos: Mapped[str | None] = mapped_column(Text)   # J. Martos / Equipo Deletrea
    nota_evidencia: Mapped[str | None] = mapped_column(Text)

    dimension: Mapped["IdeaDimension"] = relationship(back_populates="ficha")


class IdeaEjemplo(Base):
    """Ejemplo clínico por nivel (`IDEA_EJ`). 12 dimensiones × 4 niveles = 48.

    **Sólo 8, 6, 4 y 2**: el prototipo no trae ejemplo para el nivel 0 y no se
    inventa uno — 0 es «sin trastorno cualitativo», que no tiene ilustración
    clínica que dar.
    """
    __tablename__ = "idea_ejemplo"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    dimension_id: Mapped[int] = mapped_column(ForeignKey("idea_dimension.id", ondelete="CASCADE"))
    valor: Mapped[int] = mapped_column(Integer)
    ejemplo: Mapped[str] = mapped_column(Text)

    dimension: Mapped["IdeaDimension"] = relationship(back_populates="ejemplos")

    __table_args__ = (
        UniqueConstraint("dimension_id", "valor", name="uq_idea_ejemplo_dimension_valor"),
        CheckConstraint("valor IN (2, 4, 6, 8)", name="nivel_con_ejemplo"),
    )


class IdeaRegla(Base):
    """Las 9 reglas de aplicación del IDEA (`IDEA_REGLAS`), con su fuente.

    Panel IDEA-REGLAS del prototipo. Son catálogo y no constante porque IPPU las
    muestra como material y puede agregar las suyas.
    """
    __tablename__ = "idea_regla"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    regla: Mapped[str] = mapped_column(String(120), unique=True)
    descripcion: Mapped[str] = mapped_column(Text)
    fuente: Mapped[str | None] = mapped_column(String(120))
    orden: Mapped[int] = mapped_column(Integer)


class BandaIdea(Base):
    """Las **6 bandas** del total IDEA con su soporte DSM-5-TR — D4 (§5.13).

    Deroga las 3 bandas de `handoff.md` §3 (Leve 0–32 · Moderada 33–64 · Severa
    65–96), que eran nuestras. Los 6 tramos y su texto salen de `ideaInterpreta`
    del Prototipo v4.

    **El `texto` se copia tal cual, no se reescribe.** Es deliberadamente neutro:
    alude sólo a escalas y dimensiones del IDEA y **no prescribe abordajes** —
    la elección del abordaje es del equipo técnico. Reformularlo rompe esa
    propiedad, que las especificaciones llaman "neutralidad metodológica".

    Es catálogo paramétrico (D6): IPPU puede correr un corte sin migración.
    """
    __tablename__ = "banda_idea"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    total_min: Mapped[int] = mapped_column(SmallInteger)
    total_max: Mapped[int] = mapped_column(SmallInteger)
    perfil: Mapped[str] = mapped_column(String(80), unique=True)
    nivel_dsm: Mapped[str] = mapped_column(String(20))     # "Nivel 1", "Nivel 1–2", …
    texto: Mapped[str] = mapped_column(Text)
    orden: Mapped[int] = mapped_column(Integer)

    __table_args__ = (
        CheckConstraint("total_min BETWEEN 0 AND 96", name="rango_min"),
        CheckConstraint("total_max BETWEEN 0 AND 96", name="rango_max"),
        CheckConstraint("total_min <= total_max", name="min_menor_que_max"),
    )


class DeltaInterpretacion(Base):
    """Interpretación del Δ (B − A) en 6 tramos, con acción sugerida.

    De `deltaInterpreta` del Prototipo v4. Hasta ahora sólo teníamos la alerta
    institucional **Δ ≤ −7** como número suelto en el código; ahora **se deriva
    de este catálogo** (`alerta = True` en el último tramo), que es lo que
    permite que IPPU la mueva sin tocar el servicio.

    Los extremos son **abiertos**: el primer tramo no tiene techo y el último no
    tiene piso. Por eso los límites son nullable — el mismo catálogo se aplica al
    Δ del total y al Δ por escala, que tienen magnitudes distintas.

    **Sigue valiendo la regla dura §5.2:** el Δ es siempre B − A entre dos
    protocolos. Este catálogo interpreta el número; no habilita restar
    instrumentos distintos.
    """
    __tablename__ = "delta_interpretacion"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    delta_min: Mapped[int | None] = mapped_column(SmallInteger)   # NULL = sin piso
    delta_max: Mapped[int | None] = mapped_column(SmallInteger)   # NULL = sin techo
    etiqueta: Mapped[str] = mapped_column(String(60), unique=True)
    accion: Mapped[str] = mapped_column(Text)
    signo: Mapped[str] = mapped_column(String(10))       # positivo | neutro | negativo
    alerta: Mapped[bool] = mapped_column(Boolean, default=False)
    orden: Mapped[int] = mapped_column(Integer)

    __table_args__ = (
        CheckConstraint("signo IN ('positivo','neutro','negativo')", name="signo_valido"),
        CheckConstraint(
            "delta_min IS NOT NULL OR delta_max IS NOT NULL", name="tramo_no_vacio"
        ),
        CheckConstraint(
            "delta_min IS NULL OR delta_max IS NULL OR delta_min <= delta_max",
            name="min_menor_que_max",
        ),
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

    **M12.1: de 4 a 8.** A los del flujo (`lb`, `pa`, `pb`, `ic`) se suman los de
    vencimiento y seguimiento que el Prototipo v4 tiene sueltos por módulo:
    AYEX 60/30 (`ayex`), valoración funcional 90/30 (`vf`), HCE-INC sin
    gestiones por más de 60 días (`inc`) e informes semestrales de INAU
    pendientes (`inau`). Cuál está activo y en qué período lo decide
    coordinación: son `solo_al_crear` en el seed.
    """
    __tablename__ = "recordatorio"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # lb | pa | pb | ic | ayex | vf | inc | inau
    clave: Mapped[str] = mapped_column(String(10), unique=True)
    texto: Mapped[str] = mapped_column(Text)
    periodo: Mapped[str] = mapped_column(String(60))
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    orden: Mapped[int] = mapped_column(Integer, default=0)


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
