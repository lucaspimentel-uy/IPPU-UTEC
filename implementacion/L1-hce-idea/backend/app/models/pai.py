"""HCE-PAI · Propuesta de Atención Individual — M12.6.

**Archivo propio**, como `severidad.py` (M12.4), `inclusion.py` (M12.5) y
`ateneo.py` (M12.7): no es parte del flujo firmable (`modulos.py`), no es
catálogo puro (`catalogos.py`) y no es un transversal del expediente
(`transversales.py`).

Ocho tablas: la cabecera (`pai`) y siete hijas — `pai_objetivo`,
`pai_evaluacion_previa`, `pai_equipo`, `pai_coordinacion`, `pai_taller`,
`pai_prestacion` y `pai_circuito`.

── Qué es el módulo ────────────────────────────────────────────────────────
La digitalización del **Formulario PAI de IPPU**, escrito contra la pauta de
INAU: quince secciones que van desde la identificación del NNA hasta el equipo
que elabora la propuesta. Es **el documento que se entrega a un organismo del
Estado**, y de ahí salen casi todas las decisiones de forma de este archivo.

── Módulo sin firma ────────────────────────────────────────────────────────
No lleva `FirmaMixin`, como HCE-SEV y HCE-INC. **No es un olvido, es lo que dice
la fuente:** el objeto `pai` del Prototipo v4 (`:450-459`) es el único de los
módulos del expediente que **no tiene `estado`** —`idea`, `protA`, `protB`,
`cierre` y `ci` sí lo tienen— y las tres líneas de firma de la sección XV son
rótulos de impresión, no un flujo. El bloqueo por firma, si IPPU lo pide, es
M11.3.

── Las cinco secciones de solo lectura, y sus excepciones ──────────────────
Las secciones I, II, VI, XI y XV se dibujan mayormente con `ro()` —un
`<input readonly>` sin binding— alimentado desde HCE-00, HCE-ORG, HCE-LB,
HCE-PA, HCE-PB y HCE-SEV. Eso **se modela como ausencia de columnas**, nunca
como copia: `nombre`, `ci`, `hc`, `sipi`, `convenio`, el diagnóstico, las fechas
y puntajes de los instrumentos, el Δ, la severidad y el grupo **no están acá**.

⚠️ **Pero la regla no es «la sección entera es de solo lectura», y medirlo
importó.** De las cinco, **cuatro tienen campos editables** que son columnas
propias de `pai`, porque no hay ningún módulo del cual leerlos. La única
enteramente de lectura es §XV, y aun ahí el resto del equipo se carga a mano en
`pai_equipo`:

- **§I** — `ingreso_ippu` (`fecha('ingresoIppu')`, `:1068`).
- **§II** — `padron_inau`, `disposicion`, `judicial`, `expediente`,
  `derivado_por` y `motivo` (`:1073-1078`). HCE-ORG **no tiene dónde
  guardarlos**: su objeto es `inau:{sipi, convenio, referente, ingreso, obs,
  envios[]}` (`:447`) y su editor `mOrg()` renderiza exactamente esos cinco
  campos. Los únicos `ro()` de la sección son `sipi`, `convenio` y el
  diagnóstico.
- **§VI y §XI** — `sint_lb`, `delta_interp`, `frecuencia`, `etapa` y
  `otras_act`: los puntajes se leen, la interpretación clínica se escribe.

La prosa que generalizaba «I, II, VI, XI y XV se renderizan con `ro()`»
(`prototipo-v4-referencia.md:166`) contradecía su propia lista de campos de
`p.pai` (`:149`). Por §5.50 (J1) —el código ejecutable manda sobre la prosa de
la misma fuente— gana la lista. Registrado en `handoff.md` §5.55 (L2).

── Lo que este módulo NO construye ─────────────────────────────────────────
- **Ningún guard de validación.** Sesión de solo esquema (§5.54). El cálculo de
  totales y deltas con verificación previa a la firma —el **Anexo A** del
  Manual— es M11.3, y también lo son la habilitación de la sección IX por tipo
  y la resolución de «qué IDEA rige a la fecha de este PAI» (§5.35, derivado 2).
- **La sección V.** `centro`, `modalidad` y `grado` **no son columnas de acá**:
  se leen en vivo de `inclusion` (M12.5). Es §5.22, y el contrato de nombres
  está escrito en el docstring de `Inclusion`.
- **La pantalla que administra nada.** Sigue sin haber routers ni servicios.
"""
from datetime import date, datetime

from sqlalchemy import (
    CheckConstraint, Date, DateTime, ForeignKey, Integer, String, Text,
    UniqueConstraint, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constantes import (
    PAI_ACUERDO_FAMILIA,
    PAI_AREAS,
    PAI_CIRCUITO,
    PAI_CONTROLES,
    PAI_COORDINACION_ACTORES,
    PAI_DECISIONES,
    PAI_DISPOSICIONES,
    PAI_ETAPAS,
    PAI_FRECUENCIAS,
    PAI_LOGROS,
    PAI_PLAZOS,
    PAI_PRESTACIONES,
    PAI_SI_NO,
    PAI_TIPOS,
)
from app.core.database import Base


def _dominio(columna: str, valores: tuple[str, ...], *, nullable: bool = True) -> str:
    """SQL para «esta columna está dentro del dominio», escrito desde la constante.

    Copia deliberada del helper de `inclusion.py` (M12.5), que a su vez viene de
    M12.7: el CHECK **no se transcribe a mano**, se genera desde la misma tupla
    de `core/constantes.py` que usan el modelo, el seed y la UI. Con la lista
    escrita dos veces, corregir un valor en la constante y no en la DDL deja la
    base aceptando algo que el código considera inválido, o al revés — y el test
    `test_el_check_y_la_constante_no_pueden_divergir` existe por eso.

    No se factorizó a un módulo común **todavía**: son cuatro líneas y sacarlo de
    los dos archivos que lo usan es un refactor que toca M12.5 ya cerrado. Queda
    anotado para M12.8, que es la ronda de cierre.
    """
    lista = ", ".join("'" + v.replace("'", "''") + "'" for v in valores)
    expr = f"{columna} IN ({lista})"
    return f"{columna} IS NULL OR {expr}" if nullable else expr


class Pai(Base):
    """La cabecera del PAI. Una fila por propuesta, **no** por año.

    ── Cardinalidad: N por expediente, y sin `UNIQUE(hce_id, anio)` ────────
    **Deliberado, y es la diferencia con `informe_cierre`**, que sí es anual
    único. §5.22 lo dejó anotado antes de escribir una línea: el PAI de INAU es
    un **documento dinámico** con revisión semestral, así que en un mismo año
    conviven el PAI inicial y su actualización. El propio formulario lo
    corrobora por tres lados: el campo `tipo` («PAI inicial (ingreso)» /
    «Actualización anual»), la sección IX —«Evaluación del PAI anterior»— y las
    dos fechas de revisión (`f_rev`, `f_anual`).

    **No replicar el patrón de `informe_cierre`.** Un `UNIQUE(hce_id, anio)` acá
    haría que cargar la actualización semestral **pisara** el PAI inicial, que es
    justamente el documento contra el cual la sección IX evalúa.

    ── Nomenclatura (§5.26) ────────────────────────────────────────────────
    `hce_id` **es pertenencia**: el PAI es contenido del expediente y muere con
    él (`ondelete="CASCADE"`). No lleva calificador. Las hijas cuelgan de
    `pai_id`, no de `hce_id`, por la misma razón que la bitácora de inclusión
    cuelga de `inclusion_id`: son contenido **de esta propuesta**, no del
    expediente.

    ── Lo que se congela acá y lo que se lee en vivo ───────────────────────
    El reparto lo fijó §5.22 y este módulo lo respeta entero: **lo que se
    compromete** se congela por instancia (los objetivos, las coordinaciones
    previstas, el circuito de seguimiento, los talleres del período: la firma
    marca el inicio de esos compromisos) y **lo que es diagnóstico de situación**
    se lee en vivo (el centro educativo, los puntajes de los instrumentos, la
    severidad, el grupo).

    ⚠️ **`prest` es el caso que no cierra limpio con esa regla**, y queda
    anotado en vez de resuelto: «prestaciones y certificaciones vigentes» es
    diagnóstico de situación —debería leerse en vivo—, pero hoy **no hay de dónde
    leerlo**: `organismo_bps` es 0..1 por expediente con **una sola**
    `prestacion` en texto libre, no un conjunto. Se modela como hija propia del
    PAI y la tensión va a `docs/notas/puntos-a-validar.md` §2.15.
    """
    __tablename__ = "pai"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    #: Pertenencia (§5.26). **Sin `unique`**: ver el docstring de la clase.
    hce_id: Mapped[int] = mapped_column(
        ForeignKey("hce_diurna.id", ondelete="CASCADE"), index=True
    )

    # ── Cabecera ────────────────────────────────────────────────────────────
    #: `PAI_TIPOS`. Discriminador de la sección IX: el prototipo la habilita
    #: sólo con «Actualización anual» (`esAct`). El guard que lo hace cumplir es
    #: M11.3; acá sólo se garantiza el dominio.
    tipo: Mapped[str | None] = mapped_column(String(40))
    #: Año del PAI. **Entero**, como `protocolo.anio` e `informe_cierre.anio`,
    #: aunque el prototipo lo tenga como `<input type="text">` con `'2026'` de
    #: default: un año es un número y el widget no es el dominio.
    anio: Mapped[int | None] = mapped_column(Integer, index=True)
    #: Fecha de elaboración de la propuesta.
    fecha: Mapped[date | None] = mapped_column(Date)

    # ── §I · Identificación (todo lo demás se lee de HCE-00) ────────────────
    #: Fecha de ingreso a IPPU. **Columna propia**: es el único campo editable de
    #: la sección I (`fecha('ingresoIppu')`), y `hce_diurna` no la tiene.
    ingreso_ippu: Mapped[date | None] = mapped_column(Date)

    # ── §II · Marco administrativo INAU ─────────────────────────────────────
    #: Ingreso al padrón de INAU. Columna propia — HCE-ORG no la modela.
    padron_inau: Mapped[date | None] = mapped_column(Date)
    #: `PAI_DISPOSICIONES` — por qué marco está el NNA en IPPU.
    disposicion: Mapped[str | None] = mapped_column(String(20))
    #: Si la situación está judicializada (`PAI_SI_NO`).
    judicial: Mapped[str | None] = mapped_column(String(10))
    #: N.º de expediente administrativo o judicial.
    expediente: Mapped[str | None] = mapped_column(String(60))
    #: Quién derivó al NNA a IPPU.
    derivado_por: Mapped[str | None] = mapped_column(String(200))
    #: Motivo de atención, en prosa.
    motivo: Mapped[str | None] = mapped_column(Text)

    # ── §III · Adulto responsable, familia y referentes ─────────────────────
    #: Adulto responsable, con nombre y vínculo en el mismo campo — así lo pide
    #: el formulario y separarlos inventaría una estructura que la fuente no
    #: tiene. Texto y no FK: el adulto responsable no es usuario del sistema.
    responsable: Mapped[str | None] = mapped_column(String(200))
    tel: Mapped[str | None] = mapped_column(String(60))
    #: Composición del núcleo familiar o de convivencia.
    nucleo: Mapped[str | None] = mapped_column(Text)
    #: Otras personas referentes.
    referentes: Mapped[str | None] = mapped_column(Text)

    # ── §IV · Salud, tratamientos y prestaciones ────────────────────────────
    #: Prestador de salud. Texto libre: es mundo abierto, como `inclusion.centro`.
    cobertura: Mapped[str | None] = mapped_column(String(120))
    #: `PAI_CONTROLES`.
    controles: Mapped[str | None] = mapped_column(String(40))
    tratamientos: Mapped[str | None] = mapped_column(Text)
    medicacion: Mapped[str | None] = mapped_column(Text)
    #: Observaciones y trámites en curso. Es **el destino del «Otra (detallar en
    #: observaciones)»** de `pai_prestacion`, y el propio prototipo aclara acá
    #: que «el estado detallado de prestaciones BPS se gestiona en HCE-ORG».
    prest_obs: Mapped[str | None] = mapped_column(Text)

    # ── §V · Educación — sólo lo que NO está en HCE-INC (§5.22) ─────────────
    #: Apoyos y adaptaciones vigentes en el centro educativo. §5.22 lo dice con
    #: todas las letras: `apoyosEd` y `otrasEd` **sí** son de PAI y se quedan
    #: acá; `centro`, `modalidad` y `grado` se leen en vivo de `inclusion`.
    apoyos_ed: Mapped[str | None] = mapped_column(Text)
    #: Otras actividades informales, comunitarias o deportivas.
    otras_ed: Mapped[str | None] = mapped_column(Text)

    # ── §VI · Evaluación clínica (los puntajes se leen; esto se escribe) ────
    #: Síntesis cualitativa de la línea de base.
    sint_lb: Mapped[str | None] = mapped_column(Text)
    #: Interpretación clínica del Δ. **El Δ no se guarda acá**: se calcula desde
    #: los protocolos (§4 del esquema, M11.3). Esto es la lectura clínica de ese
    #: número, que sí es dato propio del PAI.
    delta_interp: Mapped[str | None] = mapped_column(Text)

    # ── §VII · Análisis estratégico (FODA) — RETIRADA ─────────────────────
    # IPPU pidió retirar la sección VII (§5.42 / I7, ratificado por §5.59): no
    # lleva columnas ni tabla hija. `fort`, `oport`, `debil` y `amen` salieron
    # en M12.8a y la cabecera pasó de 43 a 39 campos propios. El comentario
    # queda para que la sección no se «reincorpore» sin cruzar la decisión —
    # que es exactamente cómo entró en M12.6 (§5.59).

    # ── §VIII · Participación del NNA y de su familia ───────────────────────
    #: Intereses, preferencias y motivadores del NNA.
    intereses_nna: Mapped[str | None] = mapped_column(Text)
    #: Expresiones, opiniones o elecciones del NNA consideradas en la propuesta.
    #: La pauta INAU y la CDN piden relevarla «por todos los medios disponibles»
    #: —verbales, gestuales, por apoyos aumentativos, conductuales—, así que es
    #: texto y no una escala.
    voz_nna: Mapped[str | None] = mapped_column(Text)
    #: Expectativas y prioridades de la familia o referentes.
    expect_familia: Mapped[str | None] = mapped_column(Text)
    #: `PAI_ACUERDO_FAMILIA` — grado de acuerdo con la propuesta.
    acuerdo: Mapped[str | None] = mapped_column(String(30))
    #: Fecha de la entrevista de devolución a la familia.
    fecha_devol: Mapped[date | None] = mapped_column(Date)

    # ── §XI · Dispositivo de atención (el grupo se lee de HCE-00) ───────────
    #: `PAI_FRECUENCIAS` — concurrencia semanal, como frase.
    frecuencia: Mapped[str | None] = mapped_column(String(20))
    #: `PAI_ETAPAS` — en qué etapa del proceso está el NNA.
    etapa: Mapped[str | None] = mapped_column(String(60))
    #: Otras actividades o dispositivos específicos.
    otras_act: Mapped[str | None] = mapped_column(Text)

    # ── §XII · Área social ──────────────────────────────────────────────────
    #: Dinámica familiar y organización de los cuidados.
    dinamica: Mapped[str | None] = mapped_column(Text)
    #: Ingresos del núcleo. **Texto y no número**: el formulario los describe
    #: («dos jubilaciones y una changa»), y convertirlo a monto obligaría a fijar
    #: moneda, período y fecha de corte que ninguna fuente define.
    ingresos: Mapped[str | None] = mapped_column(String(200))
    vivienda: Mapped[str | None] = mapped_column(String(200))
    redes: Mapped[str | None] = mapped_column(Text)
    #: Fortalezas y debilidades del sistema familiar · pronóstico social.
    pronostico: Mapped[str | None] = mapped_column(Text)

    # ── §XIV · Seguimiento y evaluación ─────────────────────────────────────
    #: Fecha prevista de revisión intermedia.
    f_rev: Mapped[date | None] = mapped_column(Date)
    #: Fecha prevista de evaluación anual.
    f_anual: Mapped[date | None] = mapped_column(Date)
    #: Criterios de ajuste anticipado de la propuesta.
    criterios: Mapped[str | None] = mapped_column(Text)

    creado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    actualizado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    hce: Mapped["HceDiurna"] = relationship(back_populates="pai")  # noqa: F821
    objetivos: Mapped[list["PaiObjetivo"]] = relationship(
        back_populates="pai",
        cascade="all, delete-orphan",
        order_by="PaiObjetivo.orden, PaiObjetivo.id",
    )
    evaluacion_previa: Mapped[list["PaiEvaluacionPrevia"]] = relationship(
        back_populates="pai",
        cascade="all, delete-orphan",
        order_by="PaiEvaluacionPrevia.orden, PaiEvaluacionPrevia.id",
    )
    equipo: Mapped[list["PaiEquipo"]] = relationship(
        back_populates="pai",
        cascade="all, delete-orphan",
        order_by="PaiEquipo.orden, PaiEquipo.id",
    )
    coordinaciones: Mapped[list["PaiCoordinacion"]] = relationship(
        back_populates="pai",
        cascade="all, delete-orphan",
        order_by="PaiCoordinacion.orden, PaiCoordinacion.id",
    )
    talleres: Mapped[list["PaiTaller"]] = relationship(
        back_populates="pai",
        cascade="all, delete-orphan",
        order_by="PaiTaller.taller_nombre",
    )
    prestaciones: Mapped[list["PaiPrestacion"]] = relationship(
        back_populates="pai", cascade="all, delete-orphan"
    )
    circuito: Mapped[list["PaiCircuito"]] = relationship(
        back_populates="pai", cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint(_dominio("tipo", PAI_TIPOS), name="pai_tipo_valido"),
        CheckConstraint(
            _dominio("disposicion", PAI_DISPOSICIONES), name="pai_disposicion_valida"
        ),
        CheckConstraint(_dominio("judicial", PAI_SI_NO), name="pai_judicial_valido"),
        CheckConstraint(
            _dominio("controles", PAI_CONTROLES), name="pai_controles_validos"
        ),
        CheckConstraint(
            _dominio("acuerdo", PAI_ACUERDO_FAMILIA), name="pai_acuerdo_valido"
        ),
        CheckConstraint(
            _dominio("frecuencia", PAI_FRECUENCIAS), name="pai_frecuencia_valida"
        ),
        CheckConstraint(_dominio("etapa", PAI_ETAPAS), name="pai_etapa_valida"),
    )


class PaiObjetivo(Base):
    """§X · Un objetivo del período, con su estrategia, indicador y plazo.

    **El corazón del módulo**: es lo que el PAI compromete. Por eso es tabla
    hija congelada por instancia (§5.22) y no una lectura en vivo de nada.

    Tabla y no JSONB, por el criterio de `inclusion_bitacora` y `ateneo_acuerdo`:
    «cuántos objetivos por área», «qué objetivos vencen este trimestre» y «qué
    PAIs no tienen ningún objetivo de comunicación» son consultas **entre**
    propuestas, no dentro de una.
    """
    __tablename__ = "pai_objetivo"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    pai_id: Mapped[int] = mapped_column(
        ForeignKey("pai.id", ondelete="CASCADE"), index=True
    )
    #: `PAI_AREAS`. Indexada: agrupar objetivos por área es la consulta del
    #: módulo.
    area: Mapped[str | None] = mapped_column(String(60), index=True)
    #: Qué se propone lograr.
    objetivo: Mapped[str | None] = mapped_column(Text)
    #: Cómo: estrategias, apoyos visuales, modelado.
    estrategias: Mapped[str | None] = mapped_column(Text)
    #: Conducta observable esperada. La pauta pide que sea **observable**; que lo
    #: sea es criterio clínico y no lo puede verificar un CHECK.
    indicador: Mapped[str | None] = mapped_column(Text)
    #: Responsable, **como rol y no como FK a `profesional`**: el formulario pide
    #: rol explícitamente («Rol» es el placeholder), y un objetivo sobrevive a
    #: que la persona que lo asumió deje la institución. Mismo criterio que
    #: `ateneo_acuerdo.responsable`.
    responsable_rol: Mapped[str | None] = mapped_column(String(120))
    #: `PAI_PLAZOS`.
    plazo: Mapped[str | None] = mapped_column(String(20))
    #: Orden en que el equipo los escribió. El formulario es una tabla que se
    #: llena de arriba abajo y ese orden es información: el primero es el
    #: prioritario.
    orden: Mapped[int] = mapped_column(Integer, default=0)

    pai: Mapped["Pai"] = relationship(back_populates="objetivos")

    __table_args__ = (
        CheckConstraint(_dominio("area", PAI_AREAS), name="pai_objetivo_area_valida"),
        CheckConstraint(_dominio("plazo", PAI_PLAZOS), name="pai_objetivo_plazo_valido"),
    )


class PaiEvaluacionPrevia(Base):
    """§IX · Evaluación de los objetivos del PAI anterior. Sólo actualizaciones.

    Es la **bisagra entre un PAI y el siguiente**: cierra cada objetivo del
    período anterior con un grado de logro y una decisión, y esa decisión es el
    insumo directo de los objetivos nuevos.

    ⚠️ **`objetivo` es texto y no FK a `pai_objetivo`, a propósito.** Encadenarlo
    parece más limpio y es peor: el PAI se entrega a INAU como documento, y el
    texto del objetivo evaluado tiene que ser **el que se evaluó**, no el que la
    fila apuntada diga hoy. Con FK, editar un objetivo del PAI anterior
    reescribiría en silencio la evaluación ya entregada. Es el mismo criterio de
    robustez que §5.20 aplica a `pai_taller`.

    **Que sólo aplique a actualizaciones no se garantiza acá.** El prototipo
    esconde la sección cuando el tipo no es «Actualización anual» (`esAct`); eso
    es un guard, y los guards son M11.3 (§5.54).
    """
    __tablename__ = "pai_evaluacion_previa"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    pai_id: Mapped[int] = mapped_column(
        ForeignKey("pai.id", ondelete="CASCADE"), index=True
    )
    #: El objetivo del PAI anterior, **transcrito**. Ver el docstring.
    objetivo: Mapped[str | None] = mapped_column(Text)
    #: `PAI_LOGROS`.
    logro: Mapped[str | None] = mapped_column(String(30))
    #: Comentario del equipo.
    comentario: Mapped[str | None] = mapped_column(Text)
    #: `PAI_DECISIONES` — qué se hace con este objetivo en el período nuevo.
    decision: Mapped[str | None] = mapped_column(String(30))
    orden: Mapped[int] = mapped_column(Integer, default=0)

    pai: Mapped["Pai"] = relationship(back_populates="evaluacion_previa")

    __table_args__ = (
        CheckConstraint(_dominio("logro", PAI_LOGROS), name="pai_prev_logro_valido"),
        CheckConstraint(
            _dominio("decision", PAI_DECISIONES), name="pai_prev_decision_valida"
        ),
    )


class PaiEquipo(Base):
    """§XV · Quién elaboró la propuesta.

    Los dos técnicos responsables **no se guardan acá**: el prototipo los dibuja
    con `ro()` desde HCE-00 y los marca «Automático». Esta tabla es para **los
    demás** — el resto del equipo, y el propio NNA, que la pauta INAU pide
    incluir «en lo posible».

    `nombre` es texto y no FK a `profesional` por eso mismo: un integrante puede
    ser el NNA, un familiar o alguien externo, y ninguno es usuario del sistema.
    Mismo criterio que `inclusion.at_nombre` y `ateneo.participantes`.
    """
    __tablename__ = "pai_equipo"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    pai_id: Mapped[int] = mapped_column(
        ForeignKey("pai.id", ondelete="CASCADE"), index=True
    )
    nombre: Mapped[str | None] = mapped_column(String(200))
    #: Rol institucional, texto libre: la fuente lo deja como `<input>`.
    rol: Mapped[str | None] = mapped_column(String(120))
    #: Si participó de la elaboración (`PAI_SI_NO`). Que figure en el equipo y
    #: que haya participado son dos cosas distintas, y la pauta pregunta las dos.
    participo: Mapped[str | None] = mapped_column(String(10))
    orden: Mapped[int] = mapped_column(Integer, default=0)

    pai: Mapped["Pai"] = relationship(back_populates="equipo")

    __table_args__ = (
        CheckConstraint(_dominio("participo", PAI_SI_NO), name="pai_equipo_participo_valido"),
    )


class PaiCoordinacion(Base):
    """§XIII · Las coordinaciones previstas para el período.

    ── Seis filas fijas, no una lista que crece ────────────────────────────
    El prototipo **precarga los seis actores** en cada PAI nuevo (`coords:[…]`,
    `:458`) y no ofrece agregar ni quitar: la pauta INAU pregunta por estos seis
    y un PAI que no los responda está incompleto. De ahí el `UNIQUE(pai_id,
    actor)` y el CHECK contra `PAI_COORDINACION_ACTORES` — la tabla registra
    **respuestas a un cuestionario cerrado**, no una colección abierta.

    Que las seis filas se creen al abrir el PAI es trabajo del servicio (M11.3):
    acá está la forma que lo permite, no el automatismo.

    `se_coordina` es lo que compromete la propuesta, y por eso se congela por
    instancia (§5.22) en vez de leerse de ningún lado.
    """
    __tablename__ = "pai_coordinacion"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    pai_id: Mapped[int] = mapped_column(
        ForeignKey("pai.id", ondelete="CASCADE"), index=True
    )
    #: `PAI_COORDINACION_ACTORES`. **NOT NULL**: una fila sin actor no responde
    #: nada. Es el único CHECK no-nullable del módulo, y puede serlo porque el
    #: valor no lo elige el usuario — viene precargado.
    actor: Mapped[str] = mapped_column(String(120))
    #: Si se coordina con ese actor (`PAI_SI_NO`). Nullable: «todavía no se
    #: contestó» es un estado real de un formulario en elaboración.
    se_coordina: Mapped[str | None] = mapped_column(String(10))
    #: Frecuencia prevista, como frase («mensual», «a demanda»).
    frecuencia: Mapped[str | None] = mapped_column(String(120))
    #: Contenido o propósito de la coordinación.
    contenido: Mapped[str | None] = mapped_column(Text)
    #: Orden de la pauta. Se guarda para que las seis filas salgan siempre en el
    #: orden del formulario impreso, que es el que INAU lee.
    orden: Mapped[int] = mapped_column(Integer, default=0)

    pai: Mapped["Pai"] = relationship(back_populates="coordinaciones")

    __table_args__ = (
        CheckConstraint(
            _dominio("actor", PAI_COORDINACION_ACTORES, nullable=False),
            name="pai_coordinacion_actor_valido",
        ),
        CheckConstraint(
            _dominio("se_coordina", PAI_SI_NO), name="pai_coordinacion_se_coordina_valido"
        ),
        UniqueConstraint("pai_id", "actor", name="uq_pai_coordinacion_pai_actor"),
    )


class PaiTaller(Base):
    """§XI · Participación en talleres. **Por nombre, sin FK.**

    ── La tabla que M12.3 no pudo escribir ─────────────────────────────────
    §5.20 retiró `hce_taller` (N:M por `taller_id` y por expediente, resto de v1)
    y dejó dicho que la participación la modela este módulo con la forma que fija
    la especificación: **`pai_taller { pai_id, taller_nombre }`**
    (`apartado-especificaciones-tecnicas-prototipo-v4.md:50`, «por nombre,
    robusto a cambios del catálogo»). §5.21 traspasó acá el test de M12.3 que no
    era escribible sin esta tabla.

    ── Por qué `taller_nombre` y no `taller_id` ────────────────────────────
    Es D5 (§5.14): agregar, reordenar o **retirar** un taller no puede alterar lo
    ya registrado. Con FK, retirar «Taller de huerta» del catálogo obliga a
    elegir entre `RESTRICT` —que impide retirarlo mientras alguien lo haya
    cursado, o sea siempre— y `CASCADE`, que **borra la participación**: en los
    dos casos el catálogo manda sobre el registro clínico. Por nombre, el
    prototipo sigue mostrando la participación con la marca «retirado del
    catálogo» (`talleresUI`, `:979`) y no se pierde nada.

    ── La unidad es la propuesta, no el expediente ─────────────────────────
    `pai_id` y no `hce_id`: la oferta de talleres cambia por período, así que
    «en qué talleres participa» sólo tiene respuesta **dentro de un PAI**. Era la
    otra mitad del error de `hce_taller`.
    """
    __tablename__ = "pai_taller"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    pai_id: Mapped[int] = mapped_column(
        ForeignKey("pai.id", ondelete="CASCADE"), index=True
    )
    #: Nombre del taller, **copiado** del catálogo al marcarlo. `String(80)` es
    #: el mismo largo que `taller.nombre`, para que ningún nombre válido del
    #: catálogo se trunque al registrarse. Indexado: «cuántos NNA participan del
    #: taller X» es la consulta que el catálogo dinámico habilita.
    taller_nombre: Mapped[str] = mapped_column(String(80), index=True)

    pai: Mapped["Pai"] = relationship(back_populates="talleres")

    __table_args__ = (
        UniqueConstraint("pai_id", "taller_nombre", name="uq_pai_taller_pai_nombre"),
    )


class PaiPrestacion(Base):
    """§IV · Prestaciones y certificaciones vigentes al escribir el PAI.

    Una fila por ítem marcado, contra `PAI_PRESTACIONES`. **El valor, no el
    índice**: el prototipo las marca por posición (`P.prest[ix]`) y esa forma no
    se copia — insertar un ítem en la constante reescribiría en silencio lo ya
    registrado.

    ⚠️ **Es la tabla con la tensión abierta del módulo.** Por §5.22, «vigente» es
    diagnóstico de situación y debería leerse en vivo; pero no hay de dónde:
    `organismo_bps` guarda **una sola** `prestacion` en texto libre (0..1 por
    expediente), no un conjunto, y dos de los seis ítems —la Valoración Funcional
    y el certificado de discapacidad— **no son prestaciones BPS**. Se modela acá
    como declaración del PAI y la pregunta —¿unificar con HCE-ORG, y en qué
    dirección?— queda en `docs/notas/puntos-a-validar.md` §2.15.
    """
    __tablename__ = "pai_prestacion"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    pai_id: Mapped[int] = mapped_column(
        ForeignKey("pai.id", ondelete="CASCADE"), index=True
    )
    #: `PAI_PRESTACIONES`. NOT NULL: la fila **es** la marca.
    prestacion: Mapped[str] = mapped_column(String(120))

    pai: Mapped["Pai"] = relationship(back_populates="prestaciones")

    __table_args__ = (
        CheckConstraint(
            _dominio("prestacion", PAI_PRESTACIONES, nullable=False),
            name="pai_prestacion_valida",
        ),
        UniqueConstraint("pai_id", "prestacion", name="uq_pai_prestacion_pai_item"),
    )


class PaiCircuito(Base):
    """§XIV · Circuito institucional de seguimiento comprometido en este PAI.

    Una fila por ítem marcado, contra `PAI_CIRCUITO`. Mismo criterio de forma que
    `PaiPrestacion` —el valor y no el índice—, y **compromiso, no diagnóstico**:
    por el reparto de §5.22 se congela por instancia, porque es lo que la
    propuesta se obliga a hacer durante el período.
    """
    __tablename__ = "pai_circuito"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    pai_id: Mapped[int] = mapped_column(
        ForeignKey("pai.id", ondelete="CASCADE"), index=True
    )
    #: `PAI_CIRCUITO`. NOT NULL: la fila **es** la marca.
    item: Mapped[str] = mapped_column(String(120))

    pai: Mapped["Pai"] = relationship(back_populates="circuito")

    __table_args__ = (
        CheckConstraint(
            _dominio("item", PAI_CIRCUITO, nullable=False), name="pai_circuito_valido"
        ),
        UniqueConstraint("pai_id", "item", name="uq_pai_circuito_pai_item"),
    )
