"""HCE-SEV · Severidad DSM-5-TR — M12.4.

**Archivo propio a propósito.** No va en `modulos.py` (ese archivo es el flujo
firmable CI → LB → PA → PB → IC, y HCE-SEV no se firma nunca) ni en
`catalogos.py`, que son los dos puntos de conflicto si otro sub-módulo de M12
arranca en paralelo. Acá viven las dos tablas del módulo: el registro clínico
(`severidad_dsm`) y su tabla de referencia (`severidad_nivel`).

**Qué NO es este módulo.** Al modelarlo iban a convivir tres lugares con un
«nivel DSM». Quedan dos, y son cosas distintas:

- `banda_idea.nivel_dsm` (M12.1 · D4) — propiedad **de la banda**, no del NNA:
  «un total de 56–75 se corresponde orientativamente con Nivel 2». Es contenido
  del catálogo del IDEA.
- `severidad_dsm` (acá) — **la evaluación actual de IPPU**, por juicio clínico,
  separada por dominio, con justificación, fecha y autor.

El tercero, `hce_diurna.nivel_soporte`, **se retiró** en este mismo módulo
(`handoff.md` §5.24): era la etiqueta visible de la ficha, que en el prototipo
el propio HCE-SEV pisa en cada edición (`setSev()` → `p.nivel = sevResumen(p)`),
o sea una copia sin justificación ni autor de lo que esta tabla registra bien.
"""
from datetime import date

from sqlalchemy import (
    CheckConstraint, Date, ForeignKey, Integer, SmallInteger, String, Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class SeveridadNivel(Base):
    """Los 3 grados del DSM-5-TR con su descriptor por dominio y sus apoyos.

    Una fila por grado, con las cuatro columnas que el prototipo muestra juntas
    como tabla de referencia dentro del módulo: `SEV_ETQ` (etiqueta), `SEV_CS`
    (comunicación social), `SEV_CRR` (comportamientos restringidos y
    repetitivos) y `SEV_APOYO` (tipo de apoyos que orienta el grado).

    **Por qué una tabla y no tres.** Las cuatro constantes del prototipo están
    todas indexadas por el mismo grado 1–3 y se renderizan en una sola tabla de
    cuatro columnas. Tres tablas paralelas con la misma PK serían la misma fila
    partida en pedazos.

    **Por qué catálogo y no constante.** El criterio de §2.4 del esquema manda a
    `core/constantes.py` el texto fijo de presentación que acompaña a un valor
    ya guardado. Estas filas se consultan por sí mismas —el módulo las muestra
    como tabla de referencia mientras el técnico decide— y su redacción es texto
    institucional sujeto a la regla de vocabulario §8.1. Es la decisión que ya
    tomó el plan M12 (§M12.4: «como catálogo»).

    **La etiqueta se guarda una sola vez, acá.** `severidad_dsm` **no** la copia:
    resolverla es leer la fila del grado. Ver el docstring de `SeveridadDsm`.
    """
    __tablename__ = "severidad_nivel"

    #: El grado DSM-5-TR (1, 2, 3) **es** la PK: es parte del instrumento, no un
    #: detalle de implementación. Mismo criterio que `idea_dimension.id`.
    grado: Mapped[int] = mapped_column(SmallInteger, primary_key=True, autoincrement=False)
    #: "Grado 1 · Necesita ayuda", "Grado 2 · Necesita ayuda notable", …
    etiqueta: Mapped[str] = mapped_column(String(60), unique=True)
    #: Descriptor largo del dominio **comunicación social** (`SEV_CS`).
    descriptor_cs: Mapped[str] = mapped_column(Text)
    #: Descriptor largo del dominio **comportamientos restringidos y
    #: repetitivos** (`SEV_CRR`).
    descriptor_crr: Mapped[str] = mapped_column(Text)
    #: Tipo de apoyos que **orienta** el grado (`SEV_APOYO`). Orienta: no
    #: determina prestaciones ni elegibilidad (ver §4 del esquema, guard de
    #: salida 1).
    apoyos: Mapped[str] = mapped_column(Text)

    __table_args__ = (
        CheckConstraint("grado BETWEEN 1 AND 3", name="rango_grado"),
    )


class SeveridadDsm(Base):
    """HCE-SEV. El nivel de severidad DSM-5-TR registrado por juicio clínico.

    ── La regla del sistema, tal cual la escribe el Prototipo v4 ────────────
    Se transcribe **verbatim** y no se parafrasea, por la misma razón que el
    `texto` de `banda_idea`: está redactada para no prescribir y para acotar
    explícitamente el alcance del registro. Reescribirla rompe esa propiedad.

        «El nivel de severidad DSM-5-TR se registra por juicio clínico del
        profesional habilitado y se especifica por separado para cada dominio
        diagnóstico. No se deriva del puntaje IDEA ni de la Escala IPPU-TEA
        (instrumentos no homologables). La severidad puede variar según el
        contexto y fluctuar en el tiempo: este registro describe la necesidad de
        apoyo actual y no sustituye la determinación de elegibilidad para
        servicios o prestaciones.»

    ── Cardinalidad: 0..1 por expediente, PK = `hce_id` ─────────────────────
    Como `consentimiento` y `valoracion_funcional`. Dos razones:

    1. **La regla de arriba lo pide así.** Que la severidad fluctúe no pide una
       fila por medición: pide que la fila diga **cuándo** se juzgó, y para eso
       están `fecha` y `profesional_id`. El registro describe la necesidad de
       apoyo **actual**.
    2. **Es la dirección reversible.** 0..1 → 1:N es agregar un `id` y soltar la
       PK, sin perder ninguna fila. 1:N → 0..1 obliga a elegir una fila por
       expediente y **descartar el resto**.

    ⚠️ **Condición sin la cual esto es una pérdida de datos diferida.** «La
    historia vive en `auditoria`» es hoy una **aspiración**: no existe
    `app/services/`, así que nada garantiza todavía que un UPDATE escriba
    `campo`/`valor_ant`/`valor_nuevo`. El guard **«toda edición de
    `severidad_dsm` registra auditoría de campo»** queda anotado como
    obligatorio para M11.3 (§4 del esquema). Con esa línea escrita, 0..1 es
    correcto; sin ella, borra en silencio exactamente la fluctuación que la
    regla menciona como propiedad del fenómeno.

    Si IPPU responde que la severidad se re-evalúa en una instancia fija (al
    cierre anual, junto con el IDEA), esto pasa a 1:N con `anio`. Está anotado en
    `docs/notas/puntos-a-validar.md` §1.

    ── Los dos dominios son independientes ─────────────────────────────────
    Nada ata `nivel_cs` con `nivel_crr`: CS 3 con CRR 1 es un perfil clínico
    corriente y el modelo no tiene que opinar. «Independientes» es sobre sus
    **valores**, no sobre su presencia: los dos son NOT NULL porque la regla dice
    que la severidad «se especifica por separado para **cada** dominio», y una
    fila con un dominio en blanco sería una afirmación a medias. El estado
    «todavía no se juzgó» ya es representable **sin fila** — que es justo lo que
    compra el 0..1. Columnas nullable serían una segunda forma de decir lo mismo.

    ── Las etiquetas no se guardan ─────────────────────────────────────────
    «Grado 2 · Necesita ayuda notable» **se deriva** del número contra
    `severidad_nivel`, no se copia acá. Guardarla sería reintroducir en esta
    tabla el mismo campo que se acaba de retirar de `hce_diurna` (§5.24).

    ── Sin FK a `severidad_nivel`, a propósito ─────────────────────────────
    `nivel_cs`/`nivel_crr` son el **dato primario** (el juicio clínico), no una
    clasificación derivada de otra cosa: el grado DSM-5-TR es un hecho del
    instrumento y vale aunque nadie haya cargado todavía la tabla de
    descriptores. Mismo criterio que `idea`, que no tiene FK a `banda_idea` —y
    distinto de `valoracion_funcional.categoria_id`, que sí es FK porque ahí la
    categoría **la deriva el servidor** desde `pct`. El rango lo garantiza el
    `CHECK`; la resolución del descriptor es un lookup por grado, como
    `pai_taller.taller_nombre` contra el catálogo de talleres.

    ── Módulo sin flujo de firma ───────────────────────────────────────────
    Siempre editable: no hay `FirmaMixin` ni estado. Va **entre CI e IDEA** en el
    orden de la ficha (`FICHA_TABS`: `ci · sev · idea`); ese orden hoy no está
    modelado en ninguna tabla y no se inventa una — queda anotado para M11.4.
    """
    __tablename__ = "severidad_dsm"

    hce_id: Mapped[int] = mapped_column(
        ForeignKey("hce_diurna.id", ondelete="CASCADE"), primary_key=True
    )
    #: Comunicación social. Grado DSM-5-TR 1–3.
    nivel_cs: Mapped[int] = mapped_column(SmallInteger)
    #: Comportamientos restringidos y repetitivos. Grado DSM-5-TR 1–3.
    nivel_crr: Mapped[int] = mapped_column(SmallInteger)
    #: Obligatoria y no vacía: es lo que convierte los dos números en un juicio
    #: clínico. La regla dura del módulo (§4 del esquema) es que el nivel **no
    #: se calcula**; sin justificación no hay forma de distinguir un juicio de
    #: una derivación que alguien hizo a ojo desde el IDEA.
    justificacion: Mapped[str] = mapped_column(Text)
    #: Cuándo se emitió el juicio. NOT NULL: la regla dice que la severidad
    #: fluctúa en el tiempo y que este registro describe la necesidad de apoyo
    #: **actual** — sin fecha, «actual» no significa nada.
    fecha: Mapped[date] = mapped_column(Date)
    #: Quién lo emitió. NOT NULL: un juicio clínico sin autor no es un juicio
    #: clínico. Que el profesional esté **habilitado** para diagnosticar es
    #: permiso (Fase 4), no integridad: acá sólo se exige que exista.
    profesional_id: Mapped[int] = mapped_column(
        ForeignKey("profesional.id"), index=True
    )

    hce: Mapped["HceDiurna"] = relationship(back_populates="severidad")  # noqa: F821
    profesional: Mapped["Profesional"] = relationship()                  # noqa: F821

    __table_args__ = (
        CheckConstraint("nivel_cs BETWEEN 1 AND 3", name="rango_nivel_cs"),
        CheckConstraint("nivel_crr BETWEEN 1 AND 3", name="rango_nivel_crr"),
        # `btrim()` sin argumentos recorta **sólo espacios**: una justificación
        # de tabuladores o saltos de línea pasaba. El regex exige al menos un
        # carácter que no sea espacio en blanco, sea cual sea.
        CheckConstraint(
            "justificacion ~ '[^[:space:]]'", name="justificacion_no_vacia"
        ),
    )
