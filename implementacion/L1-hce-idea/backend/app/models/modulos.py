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

4. **El consenso vive en JSONB; las puntuaciones independientes, en tablas.**
   `idea.dim` y `protocolo.items` guardan el valor **consensuado** —el que vale
   como puntaje del instrumento— y no se tocaron en M12.2. Las dos puntuaciones
   previas al consenso van en `puntuacion_idea` / `puntuacion_protocolo`, que
   son tablas de verdad (ver su docstring). Son dos cosas distintas: una es el
   resultado del instrumento, la otra es el dato de confiabilidad interjueces.
"""
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean, CheckConstraint, Computed, Date, ForeignKey, Integer, SmallInteger,
    String, Text, UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, declared_attr, mapped_column, relationship

from app.core.constantes import CONSENSO_DIFERENCIA_AMBIGUEDAD, CONSENSO_PROCEDIMIENTOS
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


class PuntuacionConsensoMixin:
    """Puntuación independiente de los dos técnicos, previa al consenso (D7).

    ── Por qué existe ──────────────────────────────────────────────────────
    **Esto no sale del Prototipo v4.** El prototipo guarda un único array plano
    de consenso (`punt[12]` para el IDEA, `punt[24]` para el protocolo) y **no
    tiene puntuación por evaluador en ninguna parte**; declara kappa como
    requisito y no lo implementa. Es el único cambio de toda la ronda M12 que es
    agregado nuestro: **decisión D7** (`handoff.md` §5.16), no requisito del
    cliente. Que quede claro para quien lo lea dentro de dos meses.

    El fundamento es el **Manual de Procedimientos v1.0**, que establece que los
    dos técnicos puntúan de forma independiente y después consensúan, y llama a
    ese circuito *el único requisito metodológico invariante* del instrumento.
    Sin las dos puntuaciones no hay forma de calcular el kappa de confiabilidad
    interjueces que el propio Manual §23 pide como control. Se modela **ahora**
    y no después porque hacerlo después de M11.3 cuesta migración **más**
    reescritura de servicios; hoy no hay ni servicios ni datos.

    ── Por qué tabla y no JSONB ────────────────────────────────────────────
    El consenso sigue donde estaba (`idea.dim`, `protocolo.items`): el
    instrumento se lee y se escribe entero, y ese argumento de M11.2 sigue en
    pie. Para las puntuaciones independientes **no vale**, por cuatro motivos:

    1. **Kappa se calcula a lo ancho, no a lo largo.** Compara t1 contra t2 para
       una misma dimensión sobre toda la cohorte. Como filas es un `GROUP BY
       dimension_id`; dentro de `dim` es recorrer el JSONB de cada evaluación.
    2. **«Diferencias ≥2 sin documentar» es una consulta institucional**, no un
       dato de un expediente: es el control de confiabilidad del Manual.
    3. **El evaluador es una FK.** Dentro de JSONB sería un entero que nadie
       garantiza que exista.
    4. **`NS` necesita representación tipada** distinta de «todavía no puntuado»
       (ver `PuntuacionIdea`).

    ── Qué NO está acá ─────────────────────────────────────────────────────
    - **El guard.** «Diferencia ≥2 exige documentación» es lógica de negocio y
      va al servicio de firma en M11.3 (§5.2.2: la BD no lleva reglas clínicas).
      Acá está el campo y el marcador, no el rechazo.
    - **El cálculo de kappa.** Se guardan los datos que lo hacen posible y nada
      más; el cálculo es de la fase piloto.
    - **La obligatoriedad.** Todo es nullable: una evaluación con sólo el
      consenso es válida. Hace falta para los históricos migrados y para el seed
      espejo de la demo, donde el consenso es lo único que existe — y porque
      todavía no sabemos si los técnicos de IPPU ya trabajan así o si es una
      práctica a introducir (pregunta abierta, `handoff.md` §7).

    `diferencia` es **columna generada** (`abs(valor_t1 - valor_t2)`): aritmética
    pura, sin contenido clínico, imposible de desfasar y consultable. El umbral
    que la interpreta —el 2 de la ambigüedad clínica— **no** está en la DDL: vive
    en `core/constantes.py`. La base calcula el número, Python lo interpreta.
    """

    #: Puntuación del técnico 1 (`evaluador_t1_id` del módulo padre).
    valor_t1: Mapped[int | None] = mapped_column(SmallInteger)
    #: Puntuación del técnico 2 (`evaluador_t2_id` del módulo padre).
    valor_t2: Mapped[int | None] = mapped_column(SmallInteger)
    #: Generada por Postgres. NULL si falta alguna de las dos (o si una es NS):
    #: no hay diferencia que calcular, que es distinto de una diferencia de 0.
    diferencia: Mapped[int | None] = mapped_column(
        SmallInteger, Computed("abs(valor_t1 - valor_t2)", persisted=True)
    )
    #: Cómo se resolvió el consenso. Campo propio y **no una observación suelta**:
    #: es el registro que el Manual exige cuando hay ambigüedad clínica, y tiene
    #: que poder consultarse sin leer texto libre de otra tabla.
    documentacion: Mapped[str | None] = mapped_column(Text)

    @hybrid_property
    def procedimiento(self) -> str | None:
        """`registro` · `discusion_breve` · `ambiguedad_clinica`.

        **Derivado, no almacenado** — mismo criterio que el estado visible de los
        módulos: guardarlo sería una segunda fuente de verdad que en algún
        momento queda desfasada de `diferencia`.
        """
        if self.diferencia is None:
            return None
        clave = None
        for minimo, valor, _ in CONSENSO_PROCEDIMIENTOS:
            if self.diferencia >= minimo:
                clave = valor
        return clave

    @hybrid_property
    def documentacion_pendiente(self) -> bool:
        """Ambigüedad clínica sin documentar.

        Es un marcador, no un guard: quien rechaza la firma es el servicio
        (M11.3). Como `hybrid_property` sirve igual en Python (`p.documentacion_
        pendiente`) que en SQL (`filter(Modelo.documentacion_pendiente)`), que es
        la consulta de control de confiabilidad del Manual.
        """
        return (
            self.diferencia is not None
            and self.diferencia >= CONSENSO_DIFERENCIA_AMBIGUEDAD
            and self.documentacion is None
        )

    @documentacion_pendiente.inplace.expression
    @classmethod
    def _documentacion_pendiente_sql(cls):
        # `NULL >= 2` es NULL en SQL, así que las filas sin diferencia calculable
        # quedan fuera del filtro — igual que en la versión Python.
        return (cls.diferencia >= CONSENSO_DIFERENCIA_AMBIGUEDAD) & cls.documentacion.is_(None)


class EvaluadoresMixin:
    """Los dos técnicos que puntuaron por separado (D7).

    Van en el módulo y no en cada dimensión: son los mismos para toda la
    evaluación. `t1`/`t2` de las filas de puntuación refieren a estos.

    **No se derivan de `firmas`.** La puntuación independiente ocurre *antes* de
    firmar, así que en el momento en que hacen falta `firmas` todavía está vacío.
    Además el firmante puede no ser el evaluador (una addenda la firma quien
    corresponda).

    **Sin `evaluadorN_rol`**, a diferencia de `grupo`: el rol ya viaja en
    `firmas` (`{profesional_id, rol, fecha}`) y en `profesional.especialidad`.
    Repetirlo acá sería una tercera copia con dos formas de quedar desfasada.

    Nullable: ver `PuntuacionConsensoMixin` (históricos y seed espejo).
    """

    @declared_attr
    def evaluador_t1_id(cls) -> Mapped[int | None]:
        return mapped_column(ForeignKey("profesional.id"), index=True)

    @declared_attr
    def evaluador_t2_id(cls) -> Mapped[int | None]:
        return mapped_column(ForeignKey("profesional.id"), index=True)


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


class Idea(FirmaMixin, EvaluadoresMixin, OrigenMigracionMixin, Base):
    """HCE-LB — el IDEA es **ANUAL** (§5.36); el modelo de abajo todavía implementa
    la **línea base única** del Documento Técnico, no la anualidad decidida — ver I1.

    ⚠️ **Desactualizado por decisión, no por implementar — I1 (`handoff.md` §5.36,
    2026-08-26; §6 «DECIDIDO, SIN IMPLEMENTAR»).** IPPU confirmó que el IDEA es
    **anual** y que el de cada año se compara con el del anterior; cae la «línea
    base única» del Documento Técnico. El modelo **todavía no lo refleja**: `idea`
    no tiene columna `anio` y sigue como se describe abajo. El cambio está medido
    y es aditivo (`anio` nullable + `UNIQUE(hce_id, anio)`, el patrón que el
    esquema ya usa tres veces); su puerta está **antes de M11.3** y lo implementa
    M11.3 (§5.67), no esta capa. Lo que sigue describe el modelo **vigente en el
    código**, no la decisión.

    Este es el cambio de M4 que rompe con la v1 (`evaluacion_idea` era anual con
    una fila por dimensión). Ahora hay una instancia por línea base y las 12
    dimensiones van en `dim` JSONB: el instrumento se lee y se escribe entero,
    así que el detalle por fila no pagaba su costo.

    Es 1:N y no 1:1 porque un reingreso a más de 12 meses genera una **línea base
    nueva**; la vigente es la de mayor `fecha_consenso`. ⚠️ **Esa regla —«la
    vigente es la de mayor `fecha_consenso`»— también queda para reformular en
    M11.3** (§5.36 / §5.35): con un IDEA por año, «la más reciente» y «la de este
    año» dejan de ser la misma pregunta, y qué IDEA rige a una fecha pasada es un
    guard todavía sin escribir.

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
    puntuaciones: Mapped[list["PuntuacionIdea"]] = relationship(
        back_populates="idea", cascade="all, delete-orphan",
        order_by="PuntuacionIdea.dimension_id",
    )

    __table_args__ = (
        CheckConstraint("total IS NULL OR total BETWEEN 0 AND 96", name="rango_total"),
        CheckConstraint(
            "evaluador_t1_id IS NULL OR evaluador_t2_id IS NULL "
            "OR evaluador_t1_id <> evaluador_t2_id",
            name="evaluadores_distintos",
        ),
    )


class PuntuacionIdea(PuntuacionConsensoMixin, Base):
    """Puntuación independiente de cada dimensión del IDEA, antes del consenso.

    Una fila por (evaluación, dimensión). El valor **consensuado** no está acá:
    sigue en `idea.dim`, que es el puntaje del instrumento. Acá está el dato de
    confiabilidad interjueces. El porqué de todo esto: `PuntuacionConsensoMixin`.

    **`NS` se modela aparte del número.** En el consenso `NS` es el literal
    `"NS"` dentro de un JSONB, que ahí no molesta; en una columna tipada haría
    falta guardar texto y perder el rango. Con `valor_tN` + `ns_tN` quedan
    distinguibles los tres estados que existen de verdad:

    | `valor_t1` | `ns_t1` | significa |
    |---|---|---|
    | NULL | false | todavía no puntuó |
    | 0..8 | false | puntuó |
    | NULL | true  | puntuó **NS** (observación insuficiente) |

    `NS` sigue siendo valor válido del IDEA y **bloquea la firma** — eso último
    lo impone el servicio (M11.3), como siempre.

    ⚠️ **Caso sin resolver, a propósito:** que uno ponga `NS` y el otro un número
    es un desacuerdo real que la diferencia numérica no puede expresar (queda
    NULL). No se inventa una regla acá: qué hacer con eso lo define el servicio
    en M11.3 y está anotado en `esquema-datos-v2.md` §4.
    """
    __tablename__ = "puntuacion_idea"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    idea_id: Mapped[int] = mapped_column(
        ForeignKey("idea.id", ondelete="CASCADE"), index=True
    )
    # `index=True` agregado en M12.4: el `UNIQUE(idea_id, dimension_id)` no sirve
    # a esta FK porque `dimension_id` no es la columna líder. Era la única FK sin
    # respaldo del esquema junto con la de abajo (criterio de cierre de la ronda).
    dimension_id: Mapped[int] = mapped_column(ForeignKey("idea_dimension.id"), index=True)
    ns_t1: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    ns_t2: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")

    idea: Mapped["Idea"] = relationship(back_populates="puntuaciones")

    __table_args__ = (
        UniqueConstraint("idea_id", "dimension_id", name="uq_puntuacion_idea_dimension"),
        CheckConstraint("valor_t1 IS NULL OR valor_t1 BETWEEN 0 AND 8", name="rango_t1"),
        CheckConstraint("valor_t2 IS NULL OR valor_t2 BETWEEN 0 AND 8", name="rango_t2"),
        # NS y número son excluyentes: si puntuó NS no hay valor numérico.
        CheckConstraint("NOT (ns_t1 AND valor_t1 IS NOT NULL)", name="ns_t1_sin_valor"),
        CheckConstraint("NOT (ns_t2 AND valor_t2 IS NOT NULL)", name="ns_t2_sin_valor"),
        CheckConstraint(
            "documentacion IS NULL OR btrim(documentacion) <> ''",
            name="documentacion_no_vacia",
        ),
    )


class Protocolo(FirmaMixin, EvaluadoresMixin, Base):
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
    puntuaciones: Mapped[list["PuntuacionProtocolo"]] = relationship(
        back_populates="protocolo", cascade="all, delete-orphan",
        order_by="PuntuacionProtocolo.item_id",
    )

    __table_args__ = (
        UniqueConstraint("hce_id", "tipo", "anio", name="uq_protocolo_hce_tipo_anio"),
        CheckConstraint("tipo IN ('A','B')", name="tipo_valido"),
        CheckConstraint("total IS NULL OR total BETWEEN 24 AND 120", name="rango_total"),
        CheckConstraint("tipo = 'B' OR deltas IS NULL", name="deltas_solo_en_b"),
        CheckConstraint(
            "evaluador_t1_id IS NULL OR evaluador_t2_id IS NULL "
            "OR evaluador_t1_id <> evaluador_t2_id",
            name="evaluadores_distintos",
        ),
    )


class PuntuacionProtocolo(PuntuacionConsensoMixin, Base):
    """Puntuación independiente de cada ítem de la Escala IPPU-TEA (24), antes
    del consenso. El porqué está en `PuntuacionConsensoMixin`.

    Igual que su par del IDEA, pero **sin `NS`**: la escala es Likert 1–5 y no
    admite «no sabe» (lo que exige es observación obligatoria en los extremos
    1 y 5, y eso es del consenso, no de esta tabla).

    Una fila por (protocolo, ítem). El valor consensuado sigue en
    `protocolo.items`.

    Es tabla propia y no una tabla polimórfica compartida con el IDEA: los dos
    instrumentos tienen rango distinto, referencian catálogos distintos y sólo
    uno admite NS. Una FK polimórfica los uniría en el papel y perdería las tres
    garantías estructurales.
    """
    __tablename__ = "puntuacion_protocolo"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    protocolo_id: Mapped[int] = mapped_column(
        ForeignKey("protocolo.id", ondelete="CASCADE"), index=True
    )
    # Ídem: el `UNIQUE(protocolo_id, item_id)` no cubre esta FK (M12.4).
    item_id: Mapped[int] = mapped_column(ForeignKey("ippu_item.id"), index=True)

    protocolo: Mapped["Protocolo"] = relationship(back_populates="puntuaciones")

    __table_args__ = (
        UniqueConstraint("protocolo_id", "item_id", name="uq_puntuacion_protocolo_item"),
        CheckConstraint("valor_t1 IS NULL OR valor_t1 BETWEEN 1 AND 5", name="rango_t1"),
        CheckConstraint("valor_t2 IS NULL OR valor_t2 BETWEEN 1 AND 5", name="rango_t2"),
        CheckConstraint(
            "documentacion IS NULL OR btrim(documentacion) <> ''",
            name="documentacion_no_vacia",
        ),
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
