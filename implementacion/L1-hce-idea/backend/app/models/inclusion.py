"""HCE-INC · Inclusión educativa y social — M12.5.

**Archivo propio**, como `severidad.py` (M12.4) y `ateneo.py` (M12.7): no es
parte del flujo firmable (`modulos.py`), no es catálogo puro (`catalogos.py`) y
no es un transversal del expediente (`transversales.py`). Y, sobre todo, es el
punto de conflicto que se evita si M12.6 arranca en paralelo.

Cuatro tablas: la ficha (`inclusion`), su bitácora (`inclusion_bitacora`), el
catálogo de estados (`estado_inclusion`) y el catálogo de centros
(`catalogo_centro_educativo`).

── Qué es el módulo ────────────────────────────────────────────────────────
Registro estructurado del trabajo del área de Inclusión: la situación educativa
del NNA **fuera de IPPU** y la bitácora de todas las articulaciones (familia,
centro educativo, acompañante, INAU, otras instituciones). En palabras del
Prototipo v4, «sustituye la práctica de adjuntar reportes individuales de texto
libre»; los reportes históricos del área quedan en HCE-DOC como archivo de solo
lectura. De ahí que la bitácora **no tenga migración pendiente** — ver el
docstring de `InclusionBitacora.tema`.

── Módulo sin firma ────────────────────────────────────────────────────────
Abierto todo el ciclo, como HCE-SEV: no hay `FirmaMixin`, ni estado de módulo,
ni bloqueo. Lo único fechado es el cambio de estado (`fecha_estado`), que el
prototipo escribe solo en cada cambio (`incEstadoSet`).

── Lo que este módulo NO construye ─────────────────────────────────────────
- **El tablero del área.** Se calcula desde las HCE (dato único, sin planilla
  paralela), y el cálculo es M11.3/M11.4. Acá se garantizan los datos y los
  índices (`estado`, `fecha_estado`, y el par `(inclusion_id, fecha)` del que
  sale la columna «última gestión»).
- **La segmentación de acceso.** `sensible` es una **clasificación**, no un
  permiso. Ver el docstring de `InclusionBitacora.sensible`.
- **La pantalla que administra el catálogo de centros.** No existe; el punto
  está anotado en `docs/notas/puntos-a-validar.md` §2.9, junto con el catálogo
  de talleres y el alta de grupos.
"""
from datetime import date, datetime

from sqlalchemy import (
    CheckConstraint, Date, DateTime, ForeignKey, Index, Integer, SmallInteger,
    String, Text, func,
)
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constantes import (
    INCLUSION_AT_ESTADOS,
    INCLUSION_ESTADO_INICIAL,
    INCLUSION_MEDIOS,
    INCLUSION_ROLES,
    INCLUSION_SEMAFOROS,
    INCLUSION_TEMA_SENSIBLE,
    INCLUSION_TEMAS,
    INCLUSION_TIPOS_CENTRO,
)
from app.core.database import Base


def _dominio(columna: str, valores: tuple[str, ...], *, nullable: bool = True) -> str:
    """SQL para «esta columna está dentro del dominio», escrito desde la constante.

    El CHECK no se transcribe a mano: se genera desde la misma tupla de
    `core/constantes.py` que usan el modelo, el seed y la UI. Es el recurso que
    M12.7 dejó probado con `test_el_check_y_la_constante_no_pueden_divergir` —
    con la lista escrita dos veces, corregir un tema en la constante y no en la
    DDL deja la base aceptando un valor que el código considera inválido, o al
    revés.

    Las comillas simples se duplican porque hay valores con apóstrofo potencial;
    hoy ninguno lo tiene, pero el generador no puede depender de eso.
    """
    lista = ", ".join("'" + v.replace("'", "''") + "'" for v in valores)
    expr = f"{columna} IN ({lista})"
    return f"{columna} IS NULL OR {expr}" if nullable else expr


class EstadoInclusion(Base):
    """Los 7 estados sintéticos del caso, con su descripción y su semáforo.

    **Tabla y no constante — el único de los cinco vocabularios de HCE-INC que
    lo es.** Por el criterio de `core/constantes.py`: tiene atributos propios
    (descripción y nivel de semáforo) y el módulo **lo consulta por sí mismo**,
    renderizándolo como tabla de referencia mientras el área decide qué estado
    poner, y recorriéndolo para armar las 7 tarjetas del tablero. Mismo caso que
    `severidad_nivel` (M12.4) y opuesto al de `INC_TIPOS` / `INC_TEMAS` /
    `INC_MEDIOS` / `INC_ROLES`, que son listas planas sin atributos.

    ── El nombre es la PK, y por eso `inclusion.estado` es texto ────────────
    Como `severidad_nivel.grado`, la clave natural del vocabulario **es** la
    clave de la tabla: lo que el área registra es el estado, y el estado es su
    nombre. Dos consecuencias buscadas:

    1. `inclusion.estado` guarda la cadena legible y el tablero la muestra sin
       join — que es exactamente lo que hacen el prototipo y la demo (`incChip`
       recibe el nombre, no un id).
    2. El `server_default` puede ser el valor que fija el plan
       (`'Sin registrar'`) en vez de un id de fila del seed, que sería
       hardcodear un número de secuencia.

    Renombrar un estado se propaga por `ON UPDATE CASCADE`; borrar uno en uso lo
    impide `RESTRICT`. Ver `Inclusion.estado`.

    ── El semáforo se guarda sin la clase CSS ──────────────────────────────
    El prototipo escribe `cls:'inc-warn'`. Acá va `'warn'`: se toma la semántica
    del vocabulario y se descarta su implementación —el principio de la ronda
    M12—, porque el nombre de una clase de hoja de estilos no es un dato del
    dominio y ata el modelo a una hoja de estilos que no es la nuestra.
    """
    __tablename__ = "estado_inclusion"

    #: "Inclusión plena", "En espera de cupo / trámite", "Sin registrar"…
    nombre: Mapped[str] = mapped_column(String(60), primary_key=True)
    #: Orden de presentación — el del prototipo, de mejor a peor situación, con
    #: "Sin registrar" al final. El tablero recorre el catálogo en este orden
    #: para armar las tarjetas.
    orden: Mapped[int] = mapped_column(SmallInteger, default=0)
    #: Nivel del semáforo: `ok` · `warn` · `danger` · `off`.
    semaforo: Mapped[str] = mapped_column(String(10))
    #: Qué significa el estado. Es texto institucional del área y el módulo lo
    #: muestra completo; por eso es `Text` y no un tooltip corto.
    descripcion: Mapped[str] = mapped_column(Text)

    __table_args__ = (
        CheckConstraint(
            _dominio("semaforo", INCLUSION_SEMAFOROS, nullable=False),
            name="semaforo_valido",
        ),
    )

    @hybrid_property
    def asignable(self) -> bool:
        """Si el área puede **elegir** este estado. **Derivado, no columna.**

        `asignable = (nombre != 'Sin registrar')`. El prototipo filtra ese valor
        del `<select>` con el que se cambia el estado
        (`INC_ESTADOS.filter(e => e.n !== 'Sin registrar')`) porque no es una
        situación que alguien decida: es la **ausencia de registro** con la que
        nace la ficha, y volver a ella sería borrar información, no describirla.

        Derivado y no booleano guardado por el mismo criterio sin drift que
        `Taller.activo` (§5.20) y `Ateneo.codigo` (M12.7): dos columnas que
        dicen lo mismo se separan en cuanto alguien escribe una sola.
        """
        return self.nombre != INCLUSION_ESTADO_INICIAL

    @asignable.inplace.expression
    @classmethod
    def _asignable_sql(cls):
        return cls.nombre != INCLUSION_ESTADO_INICIAL


class CatalogoCentroEducativo(Base):
    """Centros educativos y socioeducativos — catálogo **nuestro**.

    ⚠️ **No existe en el Prototipo v4**: ahí `centro` es texto libre y no hay
    catálogo. Lo piden las Especificaciones Técnicas para el sistema definitivo
    y lo lista D6 (`handoff.md` §5.15) entre los catálogos paramétricos.

    ── Nace VACÍO, a propósito ─────────────────────────────────────────────
    No hay nada que sembrar: la fuente normativa no trae ni una fila. Los seis
    nombres de escuela que se ven en la demo (`demo/js/inclusion.js`, `INC_SEED`)
    son **relleno de nuestra propia demo** —«Escuela pública N.º 87», «Liceo
    público N.º 12»—, exactamente la clase de dato que §5.50 (J1) prohíbe
    promover a normativo. Sembrarlos pondría en el sistema de IPPU seis centros
    inventados por nosotros, que es el mecanismo de §5.37 con otro sujeto.

    El seed declara la sección con **cero filas** y es *insert-only*: las filas
    son de coordinación, como las de `grupo`.

    ── Sin FK entrante desde `inclusion` ───────────────────────────────────
    `inclusion.centro` es **texto**, no `centro_id`. El fundamento completo está
    en el docstring de esa columna y en `handoff.md` §5.52 (J3); en una línea:
    un centro educativo es una entidad **externa y de mundo abierto**, y un
    catálogo que no puede estar completo de antemano no puede ser la condición
    para registrar un caso.

    Este catálogo sirve para lo que sí puede: normalizar, autocompletar y
    resolver `zona` y `contacto` por nombre, y darle a coordinación una lista de
    «centros mencionados que todavía no tienen ficha».
    """
    __tablename__ = "catalogo_centro_educativo"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    #: Clave natural: es por acá que se resuelve `inclusion.centro`.
    nombre: Mapped[str] = mapped_column(String(200), unique=True)
    #: Mismo vocabulario que `inclusion.tipo_centro` (`INCLUSION_TIPOS_CENTRO`),
    #: y **otro sujeto**: acá es una propiedad del centro; allá, lo que el área
    #: registró para este NNA. Misma distinción que `banda_idea.nivel_dsm` frente
    #: a `severidad_dsm.nivel_cs` (§5.24). Nullable: un centro puede entrar al
    #: catálogo antes de que alguien resuelva cómo clasificarlo.
    tipo: Mapped[str | None] = mapped_column(String(60))
    #: Barrio, localidad o zona. Texto: no hay nomenclador de zonas en ninguna
    #: fuente del proyecto y no se inventa uno.
    zona: Mapped[str | None] = mapped_column(String(120))
    #: Teléfono, correo o referente administrativo del centro.
    contacto: Mapped[str | None] = mapped_column(String(200))

    __table_args__ = (
        CheckConstraint(_dominio("tipo", INCLUSION_TIPOS_CENTRO), name="tipo_valido"),
    )


class Inclusion(Base):
    """La ficha de inclusión educativa y social del expediente. HCE-INC.

    ── Cardinalidad: 0..1 por expediente, y es la dirección reversible ─────
    **Una ficha por expediente, con estado vigente**, no una por año lectivo.
    La pregunta la aisló §5.35 (derivado 1) para que no se perdiera detrás de la
    del IDEA, y **IPPU no la contestó**: la reunión del 21/08 respondió que el
    IDEA es anual (I1 · §5.36), que es una pregunta distinta. Queda decidida acá
    en la dirección reversible y anotada en `docs/notas/puntos-a-validar.md`.

    **Tres razones, en orden de peso:**

    1. **La historia ya está modelada, y no es esta tabla.** El módulo tiene su
       serie temporal: la **bitácora**, que es 1:N y fechada. Anualizar la ficha
       crearía un segundo lugar donde leer «cómo venía la inclusión en 2025» —
       dos fuentes de verdad sobre lo mismo, que es lo que §5.20, §5.22 y §5.24
       prohíben tres veces.
    2. **Es lo que el instrumento describe.** El estado es una **situación
       vigente**, no un instrumento con línea base: por eso `fecha_estado` se
       reescribe en cada cambio (`incEstadoSet` del prototipo) en vez de
       acumular filas, y por eso el prototipo modela `p.inc` como objeto y no
       como array.
    3. **Es la dirección que no descarta datos.** Pasar a 1:N es **quitar un
       `UNIQUE`**; el camino inverso obliga a elegir una fila por expediente y
       tirar el resto. Mismo criterio que `severidad_dsm` (§5.48 / M12.4).

    ⚠️ **La contracara, dicha entera:** con una sola fila, cambiar de centro
    **pisa** el centro anterior, y el rastro queda sólo en `auditoria` — que hoy
    es una aspiración, porque `app/services/` no existe y nada garantiza todavía
    que un UPDATE escriba `campo`/`valor_ant`/`valor_nuevo`. Es el mismo hueco
    que M12.4 dejó anotado para `severidad_dsm`, y el guard **«toda edición de
    `inclusion` registra auditoría de campo»** queda en §4 del esquema junto al
    de severidad. En la práctica el cambio de centro sí queda narrado en la
    bitácora, que es donde el área lo escribe.

    ── `id` propio aunque hoy sea 0..1 ─────────────────────────────────────
    **Refina el patrón de `severidad_dsm`, que usa `hce_id` como PK.** La
    diferencia es que esta ficha **tiene tabla hija**: con la PK en `hce_id`,
    pasar a 1:N obligaría a repuntar cada fila de `inclusion_bitacora` y
    reconstruir su FK. Con `id` serial y `UNIQUE(hce_id)`, la anualización es
    **soltar una restricción**: cero movimiento de datos y la FK de la hija
    nunca se entera.

    ── Nomenclatura (§5.26) ────────────────────────────────────────────────
    `hce_id` **es pertenencia**: la ficha es contenido del expediente y muere con
    él (`ondelete="CASCADE"`). No lleva calificador.

    ── Contrato de nombres con M12.6 (§5.22) ───────────────────────────────
    La sección V del PAI **no duplica** estas columnas: las lee en vivo desde
    acá. Los tres nombres del contrato son **`centro`, `modalidad` y `grado`**,
    tal cual, y no se renombran sin tocar §5.22.

    ── Sin flujo de firma ──────────────────────────────────────────────────
    Abierto todo el ciclo, como HCE-SEV.
    """
    __tablename__ = "inclusion"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    #: Pertenencia (§5.26). `UNIQUE` = 0..1 por expediente; quitarlo es todo lo
    #: que hace falta para pasar a una ficha por año.
    hce_id: Mapped[int] = mapped_column(
        ForeignKey("hce_diurna.id", ondelete="CASCADE"), unique=True
    )

    # ── Ficha del centro (contrato §5.22: `centro`, `modalidad`, `grado`) ───
    #: Nombre del centro educativo o socioeducativo, **como texto**.
    #:
    #: **Por qué no es FK a `catalogo_centro_educativo`** — con el precedente de
    #: M12.3 explícitamente sobre la mesa. D5 (§5.14) eligió texto sin FK para
    #: `taller_nombre` de modo que retirar o reordenar un taller nunca arrastre
    #: un registro clínico. Acá la conclusión es la misma y **el fundamento es
    #: otro, más fuerte**: un taller es oferta **propia** de IPPU —lista cerrada
    #: de 14 que la institución controla—, mientras que un centro educativo es
    #: una entidad **externa y de mundo abierto**. El catálogo no puede estar
    #: completo de antemano, y con FK obligatoria el área no podría registrar la
    #: escuela a la que el NNA ya entró hasta que alguien la dé de alta.
    #:
    #: **Y hoy ese «alguien» no existe:** no hay endpoint ni pantalla que cree
    #: filas de catálogo (`puntos-a-validar.md` §2.8 / §2.9). Con FK, una
    #: pantalla faltante se convierte en un registro clínico bloqueado. Con
    #: texto, el catálogo mejora la carga cuando está y no la impide cuando no.
    #:
    #: Nullable porque «Sin escolarizar» y «Sin registrar» son estados
    #: legítimos y sin centro.
    centro: Mapped[str | None] = mapped_column(String(200))
    #: Tipo de centro (`INCLUSION_TIPOS_CENTRO`). Es el dato **del caso**: lo que
    #: el área registró para este NNA. `catalogo_centro_educativo.tipo` es el
    #: dato **del centro**. Comparten vocabulario y no son la misma afirmación.
    tipo_centro: Mapped[str | None] = mapped_column(String(60))
    #: Grado, clase o taller. Texto libre: «3.er año», «Taller textil», «Grupo B»
    #: no son un dominio enumerable. Contrato §5.22.
    grado: Mapped[str | None] = mapped_column(String(120))
    #: Modalidad de concurrencia («jornada parcial con acompañante»,
    #: «escolaridad compartida»). Texto libre en el prototipo y acá.
    #: Contrato §5.22.
    modalidad: Mapped[str | None] = mapped_column(String(200))
    #: Días y carga horaria, como los escribe el área («3 veces por semana ·
    #: 2 horas»). **No se descompone en números**: la fuente lo trata como frase
    #: y descomponerlo obligaría a inventar una gramática de horarios que
    #: ninguna fuente define.
    dias_horas: Mapped[str | None] = mapped_column(String(120))

    # ── Asistente personal / AT ─────────────────────────────────────────────
    #: `No` · `Sí` · `En trámite (lista de espera)` (`INCLUSION_AT_ESTADOS`).
    #:
    #: **No es booleano**: el tercer valor es información de gestión —hay un
    #: trámite abierto— que un `bool` perdería, y el área lo usa para saber a
    #: quién hay que seguirle el trámite.
    #:
    #: ⚠️ **Nullable y sin `server_default`, a diferencia del prototipo**, que
    #: nace en `at:'No'`. «No tiene acompañante» es una afirmación sobre el NNA;
    #: que un formulario en blanco la haga por defecto es un artefacto de UI, no
    #: un dato. NULL = todavía no se registró, y así lo muestra el tablero
    #: (`I.at || '—'`).
    at: Mapped[str | None] = mapped_column(String(30))
    #: Nombre del/la acompañante. Texto y no FK a `profesional`: el AT suele ser
    #: externo a IPPU y no es usuario del sistema. Mismo criterio que
    #: `OrigenMigracionMixin.responsable_migracion` y `ateneo.participantes`.
    at_nombre: Mapped[str | None] = mapped_column(String(200))

    # ── Referente en el centro ──────────────────────────────────────────────
    #: Persona de contacto en el centro educativo.
    ref_nombre: Mapped[str | None] = mapped_column(String(200))
    #: Su rol («maestra», «directora», «adscripta»). Texto libre y **no** el
    #: dominio de `INCLUSION_ROLES`: aquéllos son roles del interlocutor de una
    #: gestión (Familia, INAU, Equipo de salud) y éste es un cargo dentro de un
    #: centro educativo. Son dos vocabularios distintos y el prototipo los tiene
    #: como widgets distintos: `<input>` acá, `<select>` allá.
    ref_rol: Mapped[str | None] = mapped_column(String(120))
    #: Teléfono o contacto del referente.
    ref_tel: Mapped[str | None] = mapped_column(String(60))

    # ── Estado sintético ────────────────────────────────────────────────────
    #: Estado semaforizado del caso. **FK por nombre** a `estado_inclusion`.
    #:
    #: **Por qué acá sí hay FK y en `centro` no.** La diferencia es de quién es
    #: el dominio: los 7 estados son una clasificación **cerrada e interna** del
    #: área —un valor fuera de la lista es un error de tipeo, no un hecho
    #: nuevo—, mientras que un centro fuera del catálogo es una escuela real que
    #: todavía nadie cargó. `RESTRICT` impide borrar un estado en uso;
    #: `ON UPDATE CASCADE` propaga el renombre, que es la única edición que el
    #: área puede querer sobre un vocabulario de 7 filas.
    #:
    #: NOT NULL con `server_default`: toda ficha tiene estado, y la ausencia de
    #: registro **es** un estado del catálogo (`'Sin registrar'`), no un NULL.
    estado: Mapped[str] = mapped_column(
        ForeignKey("estado_inclusion.nombre", ondelete="RESTRICT", onupdate="CASCADE"),
        server_default=INCLUSION_ESTADO_INICIAL,
        index=True,
    )
    #: Cuándo se fijó el estado vigente. El prototipo la escribe sola en cada
    #: cambio (`incEstadoSet`), nunca a mano. Nullable: una ficha que nunca
    #: cambió de estado sigue en «Sin registrar» y no tiene fecha que declarar.
    #: Indexada porque el tablero ordena y filtra por antigüedad del estado.
    fecha_estado: Mapped[date | None] = mapped_column(Date, index=True)
    #: Observaciones generales de la situación de inclusión.
    obs: Mapped[str | None] = mapped_column(Text)

    creado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    actualizado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    hce: Mapped["HceDiurna"] = relationship(back_populates="inclusion")  # noqa: F821
    estado_ref: Mapped["EstadoInclusion"] = relationship()
    bitacora: Mapped[list["InclusionBitacora"]] = relationship(
        back_populates="inclusion",
        cascade="all, delete-orphan",
        order_by="InclusionBitacora.fecha.desc(), InclusionBitacora.id.desc()",
    )

    __table_args__ = (
        CheckConstraint(
            _dominio("tipo_centro", INCLUSION_TIPOS_CENTRO), name="tipo_centro_valido"
        ),
        CheckConstraint(_dominio("at", INCLUSION_AT_ESTADOS), name="at_valido"),
    )


class InclusionBitacora(Base):
    """Bitácora cronológica de las gestiones del área de Inclusión.

    Una fila por gestión: con quién se habló, por qué medio, qué se trató y qué
    se acordó. **Es la serie temporal del módulo** — la razón por la que la ficha
    no necesita ser anual (ver `Inclusion`).

    ── Tabla hija y no JSONB ───────────────────────────────────────────────
    Mismo criterio que `ateneo_acuerdo` (M12.7): «cuántas articulaciones hubo por
    caso», «qué casos no tienen gestiones hace más de 60 días» y «cuántas
    entradas sensibles hay» son consultas **entre** fichas, no dentro de una.

    ── Sin migración pendiente, y por eso `tema` puede ser NOT NULL ─────────
    §5.43 (I8) fijó que **migran todos** los expedientes, lo que normalmente
    obligaría a admitir filas históricas incompletas. Acá no aplica, y lo dice la
    propia fuente: el módulo «sustituye la práctica de adjuntar reportes
    individuales de texto libre» y **los reportes históricos del área se
    conservan en HCE-DOC como archivo de solo lectura**. La bitácora nace vacía.
    """
    __tablename__ = "inclusion_bitacora"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    #: Apunta a `inclusion.id` y no a `hce_id`: ver `Inclusion` — es lo que hace
    #: que anualizar la ficha no toque una sola fila de esta tabla.
    inclusion_id: Mapped[int] = mapped_column(
        ForeignKey("inclusion.id", ondelete="CASCADE")
    )
    #: Cuándo ocurrió la gestión. NOT NULL: `incAdd` la exige, y de ella sale la
    #: alerta de caso sin seguimiento. **Distinta de `registrado_en`**, que es
    #: cuándo se tipeó — la misma distinción que `ateneo.fecha` frente a
    #: `anio_correlativo`.
    fecha: Mapped[date] = mapped_column(Date)
    #: Con quién se habló, como nombre de persona o de institución. NOT NULL y
    #: no vacío: `incAdd` lo exige junto con `fecha` y `contenido`, y una gestión
    #: sin interlocutor no es una gestión.
    interlocutor: Mapped[str] = mapped_column(String(200))
    #: Rol del interlocutor (`INCLUSION_ROLES`). Nullable: el `<select>` del
    #: prototipo llega con la primera opción preseleccionada, pero eso es un
    #: artefacto del widget — `incAdd` sólo valida fecha, interlocutor y
    #: contenido, así que exigirlo acá sería inventar una obligación que la
    #: fuente no tiene.
    rol: Mapped[str | None] = mapped_column(String(60))
    #: Medio de la gestión (`INCLUSION_MEDIOS`). Nullable por lo mismo que `rol`.
    medio: Mapped[str | None] = mapped_column(String(60))
    #: Etiqueta temática (`INCLUSION_TEMAS`). **NOT NULL, y es la única
    #: obligación que este módulo agrega sobre lo que valida el prototipo.**
    #: Motivo: de acá se deriva `sensible`, y con NULL la derivación devolvería
    #: «no sensible» —el valor peligroso— por omisión y no por decisión. Que la
    #: bitácora no tenga backlog de migración es lo que hace que esto no bloquee
    #: nada (ver el docstring de la clase).
    tema: Mapped[str] = mapped_column(String(60), index=True)
    #: El registro narrativo, íntegro. NOT NULL y no vacío (`incAdd`).
    contenido: Mapped[str] = mapped_column(Text)
    #: Acuerdos o próximos pasos. Opcional en el prototipo y acá.
    acuerdos: Mapped[str | None] = mapped_column(Text)
    #: Quién registró la gestión. Nullable como `observacion.autor_id` y
    #: `evento.autor_id`: el autor lo pone el servicio desde la sesión (M11.3) y
    #: todavía no hay sesión.
    autor_id: Mapped[int | None] = mapped_column(
        ForeignKey("profesional.id"), index=True
    )
    #: Cuándo se tipeó. Es el `timestamp` del plan M12, renombrado: `timestamp`
    #: es un nombre de tipo en SQL y quedaría citado en cada consulta. Mismo
    #: sufijo que `creado_en` en el resto del esquema.
    registrado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    inclusion: Mapped["Inclusion"] = relationship(back_populates="bitacora")
    autor: Mapped["Profesional | None"] = relationship()  # noqa: F821

    __table_args__ = (
        CheckConstraint(
            _dominio("tema", INCLUSION_TEMAS, nullable=False), name="tema_valido"
        ),
        CheckConstraint(_dominio("rol", INCLUSION_ROLES), name="rol_valido"),
        CheckConstraint(_dominio("medio", INCLUSION_MEDIOS), name="medio_valido"),
        CheckConstraint(
            "interlocutor ~ '[^[:space:]]'", name="interlocutor_no_vacio"
        ),
        CheckConstraint("contenido ~ '[^[:space:]]'", name="contenido_no_vacio"),
        # Cubre la FK (`inclusion_id` es el prefijo) y, en el mismo índice, la
        # columna «última gestión» del tablero y la alerta de los 60 días, que
        # son un `max(fecha)` por ficha.
        Index("ix_inclusion_bitacora_inclusion_fecha", "inclusion_id", "fecha"),
    )

    @hybrid_property
    def sensible(self) -> bool:
        """Entrada de acceso restringido. **Derivada, nunca capturada.**

        `sensible = (tema == 'Clínica — sensible')`, tal cual la escribe el
        Prototipo v4 en `incAdd`. Un booleano guardado al lado del tema se
        desincroniza en cuanto alguien corrige el tema, y acá la respuesta
        equivocada no es cosmética: es información familiar grave —salud mental,
        medidas de protección— circulando junto al dato escolar, que es
        exactamente lo que la segmentación existe para evitar.

        Mismo criterio sin drift que `Taller.activo` (§5.20), `Ateneo.sensible`
        y `Ateneo.codigo` (M12.7).

        ── Qué significa hoy, dicho sin eufemismo ──────────────────────────
        **Restringida para COMPARTIR, no para GUARDAR** — y hoy no está
        restringida para nada: es una **clasificación sin efecto**.

        Guardar la entrada no requiere autorización de nadie; lo que la requiere
        es que salga (I4 · §5.39 y I10 · §5.45, reunión IPPU del 21/08). El
        prototipo lo dice en el mismo sentido: las entradas así etiquetadas «son
        **visibles** sólo para los técnicos responsables del grupo, el área de
        Inclusión, coordinación y dirección técnica» — es una regla sobre quién
        las ve, no sobre si se registran.

        ⚠️ **Y el modelo todavía no tiene dónde aplicarla.** R0 (2026-08-26)
        verificó que el esquema representa el **almacenamiento** y no representa
        la **divulgación**: no hay columnas ni tablas de compartición,
        destinatario, exportación o entrega en todo `app/`. Esa capa es más
        grande que este módulo y §5.39 la pone **antes de M11.3/M11.4**. Acá
        queda sólo la clasificación —bien derivada y consultable en SQL— para
        que el día que exista el filtro tenga contra qué filtrar.
        """
        return self.tema == INCLUSION_TEMA_SENSIBLE

    @sensible.inplace.expression
    @classmethod
    def _sensible_sql(cls):
        """La versión SQL, para poder **filtrar sin traer las filas a Python**.

        Es el requisito concreto que deja servida la Fase 4: `WHERE NOT
        sensible` tiene que resolverse en la base, porque un filtro de acceso
        que se aplica después de leer ya leyó lo que no debía.
        """
        return cls.tema == INCLUSION_TEMA_SENSIBLE
