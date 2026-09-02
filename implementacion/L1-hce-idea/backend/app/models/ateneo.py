"""Ateneos clínicos y jornadas de capacitación — M12.7.

**Archivo propio**, como `severidad.py`: no es parte del flujo firmable
(`modulos.py`), no es catálogo (`catalogos.py`) y no cuelga del expediente
(`transversales.py`). Es un **registro institucional transversal** — el propio
prototipo lo saca de la ficha del NNA y lo pone en su sección de nivel general.

**Una sola entidad con campos según tipo**, no cuatro tablas: así lo modela el
Prototipo v4 (`DB.ateneos[]` con `AT_TIPOS`) y así lo fija el plan M12 §M12.7.
Lo que cambia entre tipos no es la forma del registro (fecha, título,
participantes, acuerdos) sino **qué bloque de contenido se llena**, y eso son
columnas nullable con CHECK, no tablas distintas.

── Qué NO es este módulo ───────────────────────────────────────────────────
No es parte del expediente. `hce_referida_id` es una **referencia** con
RESTRICT, no una pertenencia con cascada — ver su docstring, que es la
distinción que M12.6 hereda.
"""
from datetime import date

from sqlalchemy import (
    CheckConstraint, Date, ForeignKey, Integer, SmallInteger, String, Text,
    UniqueConstraint, cast, func, literal,
)
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constantes import ATENEO_CODIGO_PREFIJO, ATENEO_TIPOS
from app.core.database import Base

#: Los campos del bloque «Jornada de capacitación» del prototipo (`esJ`).
CAMPOS_JORNADA = ("capacitador", "modalidad", "contenidos", "materiales", "evaluacion")

#: Los del bloque «Desarrollo clínico del ateneo» (la rama `else` de `esJ`).
CAMPOS_DESARROLLO_CLINICO = ("situacion", "hipotesis", "recursos", "seguimiento")

#: El tipo que marca el registro como dato sensible de salud (Ley 18.331).
TIPO_SENSIBLE = "clinico"


def _con_texto(*columnas: str) -> str:
    """SQL para «alguna de estas columnas tiene texto sustantivo».

    **`~ '[^[:space:]]'` y no `num_nonnulls()` ni `btrim()`.** Es el mismo
    defecto que M12.4 dejó documentado en `severidad_dsm.justificacion`: los
    17 campos de texto del prototipo nacen en `''` (`atNuevo()`), así que un
    `num_nonnulls()` contaría la cadena vacía como valor presente y el CHECK de
    exclusividad rechazaría un registro que en realidad está vacío. Y `btrim()`
    sin argumentos recorta **sólo espacios**: un campo de tabuladores o saltos
    de línea pasaría igual.

    Se resuelve **en la DDL y no como invariante de la API** a propósito: hoy
    `app/routers/` y `app/schemas/` están vacíos y no existe `app/services/`.
    Una garantía estructural que depende de código de aplicación todavía no
    escrito no es una garantía estructural — es la misma promesa que M12.4
    prefirió no hacerse.

    `NULL ~ regex` es NULL, y un CHECK con resultado NULL **pasa**: por eso una
    fila con las cinco columnas en NULL no viola nada.
    """
    return " OR ".join(f"{c} ~ '[^[:space:]]'" for c in columnas)


class Ateneo(Base):
    """Un ateneo (clínico, de grupo o institucional) o una jornada de capacitación.

    ── El identificador: serial + correlativo, código derivado ──────────────
    El plan fija el formato **`AT-2026-001`**, pero eso es el **código visible**,
    no la PK. La PK es un serial sin significado y la identidad del correlativo
    es `UNIQUE(anio_correlativo, numero)` — el patrón de D9 (`handoff.md` §5.18)
    y el de las etiquetas de M12.4.

    **Por qué no PK de texto** (o sea, por qué no repetir lo que §5.18 corrigió):
    el código codifica año, prefijo y número, y **los tres son corregibles**. Si
    el ateneo del 20-dic-2026 se carga el 3-ene-2027 y hay que renumerarlo, o si
    se corrige el tipo, la PK cambiaría y habría que arrastrar
    `ateneo_acuerdo.ateneo_id` y `documento.ateneo_id` con `ON UPDATE CASCADE`,
    dejando además colgada toda referencia externa ya emitida en papel. Con
    serial y código derivado, corregir el correlativo es un UPDATE de dos
    columnas y **ninguna fila hija se entera**.

    ── Año del correlativo ≠ año del hecho ─────────────────────────────────
    `anio_correlativo` es el año de **registración** y se congela al crear;
    `fecha` es cuándo ocurrió el ateneo, y **es contra `fecha` que se filtra por
    año** (igual que `vAteneos`, que hace `(a.fecha||'').startsWith(anio)`).

    No es una preferencia: `atNuevo()` crea el registro con **`fecha:''`**, así
    que en el momento de asignar el número el año del hecho **no existe todavía**.
    Y si el correlativo siguiera a `fecha`, editar la fecha renumeraría un
    registro ya referenciado.

    ⚠️ **La divergencia, escrita para que nadie la «arregle»:** `AT-2027-001`
    puede tener `fecha = 2026-12-20` y aparecer bajo el filtro «2026» con un
    código que dice 2027. Es un correlativo **de registración**, no cronológico
    — la semántica de un libro de actas. Anotada en `docs/notas/`.

    ── Obligatoriedad: prohibición en la BD, obligación de contenido afuera ──
    El corte no es «CHECK vs. servicio» sino **prohibición vs. obligación**:

    - Lo que es **forma** (qué referencias pueden o deben existir según el tipo)
      vale en todo momento y no depende de que el registro esté completo →
      CHECK. Es la misma clase que `foto.individual_xor_grupal`, que §2.3 ya
      declara «integridad de forma, así que sí va en la BD».
    - Lo que es **obligación clínica de contenido** (¿hay hipótesis?, ¿la
      jornada trae evaluación?) no está ni en la BD ni en un guard: **ninguno de
      esos campos es `req`** en el prototipo, y `evaluacion` se llena *después*
      de la jornada.
    - Lo **cross-table** no puede ser CHECK sin trigger, y §5.2.2 los prohíbe:
      «una jornada no lleva acuerdos» y la coherencia `fecha` ↔ `grupo.anio` son
      guards de M11.3 (esta última **advertencia, no bloqueo**: un ateneo de
      febrero-2026 que revisa el ciclo del Grupo Celeste 2025 es legítimo).

    La regla que ordena los cinco CHECK de tipo: **el sujeto del registro es
    obligatorio; el contexto es opcional; las referencias ajenas están
    prohibidas.**

    ── Sin guardado parcial: el registro nace completo ─────────────────────
    `tipo`, `fecha` y `titulo` son NOT NULL — los tres `req` de la UI. Es la
    misma trampa que `severidad_dsm` (módulo sin firma ni borrador donde apoyar
    el «a medias»), con un agravante propio: **el correlativo**. `atNuevo()`
    quema `AT-2026-007` en el click; si el usuario cierra la pestaña queda un
    hueco, y como el contador del prototipo es `length+1`, el número se
    reasigna después — que con `UNIQUE(anio_correlativo, numero)` deja de ser un
    detalle cosmético y pasa a ser un `IntegrityError`.

    Un registro sin tipo, sin fecha y sin título no es el registro de nada: es
    una fila vacía ocupando un número. **Las consecuencias para la UI están
    anotadas para M11.4** en `backend/docs/esquema-datos-v2.md` §4.

    ── Sin timestamps ni convención de autoría nueva ───────────────────────
    `autor_id` copia la forma de `registro_organismo`, `observacion` y `evento`
    —los tres registros fechados transversales del esquema, idénticos— así que
    no estrena nada. `creado_en`/`actualizado_en` **no** se agregan: existen en
    una sola de las 36 tablas (`hce_diurna`) y eso no es una convención. Que un
    registro institucional no tenga marca temporal propia es un problema real,
    pero se resuelve con `auditoria` y con una convención de todo el esquema —
    no inventándola en el módulo más chico. Queda anotado para M11.3/M11.4.
    """
    __tablename__ = "ateneo"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    #: Año de **registración**, no del hecho. Sin CHECK de rango: ningún `anio`
    #: del esquema lo lleva (`grupo.anio`, `protocolo.anio`,
    #: `informe_cierre.anio`) y estrenar uno acá sería incoherente.
    anio_correlativo: Mapped[int] = mapped_column(SmallInteger)
    #: Correlativo dentro del año de registración, **1..999**.
    #:
    #: **Su asignación no está implementada a propósito** (ni secuencia, ni
    #: trigger, ni `max()+1`): la BD garantiza la unicidad y el servicio la
    #: asigna en M11.3, que es donde se puede resolver bien la race condition y
    #: el reuso de números tras un rollback — el `length+1` del prototipo hace
    #: las dos cosas mal.
    #:
    #: ⚠️ **El techo de 999 no es cosmético: cierra una divergencia real entre
    #: las dos mitades de `codigo`.** `f"{n:03d}"` en Python **ensancha** el
    #: campo (1000 → `"1000"`), pero `lpad(texto, 3, '0')` en Postgres
    #: **trunca a la derecha** (1000 → `"100"`). Con `numero = 1000` la misma
    #: propiedad devolvería `AT-2026-1000` en Python y `AT-2026-100` en SQL —una
    #: colisión silenciosa con el ateneo 100— y el `UNIQUE` no lo vería, porque
    #: es sobre `numero`, no sobre el código. El CHECK convierte el formato de
    #: tres dígitos en **garantía estructural** en vez de convención, y hace que
    #: el desborde falle fuerte en lugar de generar un código equivocado.
    #: Margen: 999 ateneos por año son ~3 por día hábil, para una institución de
    #: ~120 NNA cuyo prototipo registra 4 en dos años.
    numero: Mapped[int] = mapped_column(SmallInteger)

    #: Clave de `core/constantes.py::ATENEO_TIPOS`, no la etiqueta.
    tipo: Mapped[str] = mapped_column(String(20), index=True)
    #: Cuándo ocurrió. Es lo que se filtra y lo que ordena la lista.
    fecha: Mapped[date] = mapped_column(Date, index=True)
    #: Título / tema. Índice btree: es la columna de la búsqueda de texto de
    #: esta ronda (ver la nota de `__table_args__`).
    titulo: Mapped[str] = mapped_column(String(200), index=True)

    #: El expediente del NNA sobre el que trata el ateneo clínico.
    #:
    #: ── Por qué NO se llama `hce_id` ────────────────────────────────────────
    #: En las otras 12 tablas del esquema, `hce_id` significa **pertenencia**: la
    #: fila *es* contenido del expediente y muere con él (`ondelete="CASCADE"`).
    #: Acá es lo contrario —una **referencia** que sobrevive al expediente— y con
    #: el mismo nombre la diferencia sería invisible al leer el modelo. Es la
    #: clase de ambigüedad que §5.24 documenta como causa de divergencia
    #: silenciosa, así que la resuelve el nombre y no un comentario.
    #:
    #: **Convención que queda fijada para el resto de la ronda:**
    #: `hce_id` = pertenencia, cascada · `hce_<calificador>_id` = referencia,
    #: RESTRICT. **M12.6 la hereda: `pai.hce_id` es pertenencia** (el PAI es
    #: contenido del expediente y se va con él).
    #:
    #: ── Por qué al expediente y no a `persona` ──────────────────────────────
    #: 1. La matriz que hereda es la **del expediente** («heredan la matriz de
    #:    acceso por roles de la HCE del NNA»). Con FK a `persona`, una persona
    #:    sin expediente daría un registro sensible **sin matriz que heredar** —
    #:    un agujero en el modelo de permisos de Fase 4.
    #: 2. El vínculo cruzado se renderiza **dentro** del expediente.
    #: 3. Las otras 12 tablas que hablan de un NNA cuelgan de `hce_diurna`; una
    #:    FK a `persona` sería una segunda forma de decir lo mismo.
    #: Costo aceptado: un ateneo clínico sólo se registra sobre un NNA **con
    #: expediente**. Consistente con §5.1.3 (la ronda es Atención Diurna).
    #:
    #: ── Por qué RESTRICT y no cascada ───────────────────────────────────────
    #: `severidad_dsm` cascadea porque **es parte** del expediente. El ateneo es
    #: **historia institucional**: una sesión del equipo con acuerdos,
    #: responsables y plazos, que alimenta el meta-ateneo. El seed del prototipo
    #: lo muestra literal — `AT-2025-001` acuerda algo que `AT-2025-002` después
    #: generaliza a todo el grupo; esa cadena no es del expediente de nadie.
    #: `SET NULL` está descartado por incoherente: chocaría con
    #: `nna_solo_en_ateneo_clinico` y el DELETE fallaría igual, pero con un error
    #: de CHECK en vez de uno de FK.
    #: Costo operativo: **cero**. `hce_diurna` tiene `activo` + `fecha_baja`, o
    #: sea que la baja es **lógica**; un DELETE físico es una corrección
    #: administrativa o un borrado por protección de datos, y en los dos casos
    #: querés que el sistema frene y pregunte. Y es la dirección reversible
    #: (mismo argumento que M12.4 usó para el 0..1): RESTRICT → CASCADE es una
    #: migración sin pérdida; al revés no recupera lo que ya se borró.
    hce_referida_id: Mapped[int | None] = mapped_column(
        ForeignKey("hce_diurna.id", ondelete="RESTRICT"), index=True
    )
    #: El grupo **de ese año** (D9). Es un dato del hecho, no una copia de la
    #: situación actual del NNA: el ateneo del 2025-11-20 fue sobre el Grupo
    #: Celeste **de 2025**, con los técnicos de 2025. Leerlo «en vivo» en 2027
    #: daría el grupo equivocado — por eso acá sí se guarda el vínculo, y no
    #: contradice §5.22 (el PAI es un documento vivo; un ateneo es un hecho
    #: cerrado y fechado).
    #:
    #: `ondelete` **explícito**, a diferencia de `hce_diurna.grupo_id`, que lo
    #: deja implícito: mismo comportamiento, dicho en voz alta.
    grupo_id: Mapped[int | None] = mapped_column(
        ForeignKey("grupo.id", ondelete="RESTRICT"), index=True
    )
    #: Quién registró el ateneo.
    #:
    #: **Nullable, y es la definición completa, no un olvido.** Los tres
    #: registros fechados transversales del esquema —`registro_organismo`,
    #: `observacion`, `evento`— tienen `autor_id` nullable, y `auditoria.
    #: usuario_id` también. El único `profesional_id` NOT NULL del esquema es el
    #: de `severidad_dsm`, y ahí el docstring dice por qué: «un juicio clínico
    #: sin autor no es un juicio clínico». Un ateneo **no es un juicio clínico**:
    #: es el acta de una reunión, y las 4 del seed del prototipo no tienen autor.
    #: Hacerlo NOT NULL además agregaría un **cuarto campo obligatorio** que D6
    #: no listó y que la UI no pide.
    #:
    #: `ondelete` **explícito** por la convención de `hce_referida_id`: es una
    #: referencia, no una pertenencia — dar de baja a un profesional no puede
    #: borrar las actas que registró. `severidad_dsm.profesional_id` lo deja
    #: implícito (mismo comportamiento, NO ACTION); acá se dice en voz alta, como
    #: en `grupo_id`.
    autor_id: Mapped[int | None] = mapped_column(
        ForeignKey("profesional.id", ondelete="RESTRICT"), index=True
    )

    #: «Se consignan **roles, no nombres**, salvo firma de acuerdos» — es el
    #: placeholder literal del prototipo, y es una decisión de privacidad, no de
    #: formato. Por eso es texto y no una tabla de participantes con FK a
    #: `profesional`.
    participantes: Mapped[str | None] = mapped_column(Text)

    # ── Bloque «Desarrollo clínico del ateneo» ──────────────────────────────
    situacion: Mapped[str | None] = mapped_column(Text)
    hipotesis: Mapped[str | None] = mapped_column(Text)
    recursos: Mapped[str | None] = mapped_column(Text)
    seguimiento: Mapped[str | None] = mapped_column(Text)

    # ── Bloque «Jornada de capacitación» ────────────────────────────────────
    capacitador: Mapped[str | None] = mapped_column(String(200))
    modalidad: Mapped[str | None] = mapped_column(String(200))
    contenidos: Mapped[str | None] = mapped_column(Text)
    materiales: Mapped[str | None] = mapped_column(Text)
    evaluacion: Mapped[str | None] = mapped_column(Text)

    hce_referida: Mapped["HceDiurna | None"] = relationship()   # noqa: F821
    grupo: Mapped["Grupo | None"] = relationship()              # noqa: F821
    autor: Mapped["Profesional | None"] = relationship()        # noqa: F821
    acuerdos: Mapped[list["AteneoAcuerdo"]] = relationship(
        back_populates="ateneo",
        cascade="all, delete-orphan",
        order_by="AteneoAcuerdo.orden, AteneoAcuerdo.id",
    )
    documentos: Mapped[list["Documento"]] = relationship(       # noqa: F821
        back_populates="ateneo", cascade="all, delete-orphan"
    )

    @hybrid_property
    def codigo(self) -> str:
        """`AT-2026-001`. **Derivado, no columna.**

        Guardarlo sería una segunda fuente de verdad sobre el identificador, que
        se desincroniza en cuanto alguien corrige el correlativo — el mismo
        criterio con el que `severidad_dsm` no copia la etiqueta del grado
        (§5.24) y con el que `Taller.activo` no se almacena (§5.20).
        """
        return f"{ATENEO_CODIGO_PREFIJO}-{self.anio_correlativo}-{self.numero:03d}"

    @codigo.inplace.expression
    @classmethod
    def _codigo_sql(cls):
        """La versión SQL, para poder **buscar y ordenar por `AT-2026-003`**.

        Sin esto, «buscame el AT-2026-003» obliga a traer las filas a Python.
        Mismo recurso que `documentacion_pendiente` (M12.2).
        """
        return (
            literal(f"{ATENEO_CODIGO_PREFIJO}-")
            + cast(cls.anio_correlativo, Text)
            + literal("-")
            + func.lpad(cast(cls.numero, Text), 3, "0")
        )

    @hybrid_property
    def sensible(self) -> bool:
        """Dato sensible de salud (Ley 18.331). **Derivado, nunca capturado.**

        `sensible = (tipo == 'clinico')`, siguiendo el aviso del prototipo: los
        ateneos clínicos referidos a un NNA heredan la matriz de acceso por
        roles de su HCE; los institucionales y las jornadas son de acceso
        general del equipo técnico.

        Mismo criterio sin drift que `Taller.activo` (§5.20 · M12.3),
        `procedimiento` y `documentacion_pendiente` (M12.2), y el `sensible` del
        tema que modela M12.5. Un booleano guardado se desincroniza en cuanto
        alguien corrige `tipo`, y acá la respuesta equivocada no es un bug
        cosmético: es exponer un dato de salud.

        **El ateneo de grupo es de acceso general** — §5.58 (L5, 2026-09-02).
        Antes acá decía que la fuente no lo definía y que la pregunta iba a IPPU;
        se resolvió revirtiendo la lectura «cada técnico ve los de su grupo» que
        §5.46 (I11) le había puesto encima — el apunte crudo de la reunión,
        «todos los técnicos ven todos los ateneos», era el correcto. Con
        `sensible = (tipo == 'clinico')` el ateneo de grupo ya daba `False`, así
        que la reversión **no tocó modelo, CHECKs ni `TIPO_SENSIBLE`**: es justo
        lo que hace que cambiar de criterio cueste una línea y cero migración.

        ⚠️ **CONFIRMABLE, no está en el acta.** Lo relevó Lucas como corrección
        de IPPU al registro de la reunión del 2026-08-21, que no lo recoge; rige
        como decisión del equipo (§12.6) a la espera del respaldo escrito. Deja
        una tensión abierta con la tabla de permisos (§5.41 · Manual §21.1),
        anotada en `docs/notas/puntos-a-validar.md` §2.16.

        El **permiso** es Fase 4; acá está sólo la clasificación.
        """
        return self.tipo == TIPO_SENSIBLE

    @sensible.inplace.expression
    @classmethod
    def _sensible_sql(cls):
        return cls.tipo == TIPO_SENSIBLE

    __table_args__ = (
        UniqueConstraint("anio_correlativo", "numero", name="uq_ateneo_correlativo"),
        CheckConstraint(
            "tipo IN ({})".format(", ".join(f"'{t}'" for t in ATENEO_TIPOS)),
            name="tipo_valido",
        ),
        # `numero` sí lleva CHECK aunque `anio_correlativo` no, y por los dos
        # lados: 0 o negativo produce `AT-2026-000`, que no identifica nada, y
        # ≥1000 hace que `codigo` devuelva **cosas distintas en Python y en SQL**
        # (ver el docstring de la columna). Es el rango en que el formato de tres
        # dígitos es cierto, como `rango_grado` lo es del instrumento.
        CheckConstraint("numero BETWEEN 1 AND 999", name="rango_numero"),
        CheckConstraint("titulo ~ '[^[:space:]]'", name="titulo_no_vacio"),
        # ── Los 5 CHECK de tipo ────────────────────────────────────────────
        # Obligación **y** prohibición en una sola expresión: el NNA es el sujeto
        # del ateneo clínico, y un institucional o una jornada con un NNA colgado
        # filtraría el vínculo sensible. Los dos lados son booleanos NOT NULL, así
        # que no hay tri-valencia.
        CheckConstraint(
            "(hce_referida_id IS NOT NULL) = (tipo = 'clinico')",
            name="nna_solo_en_ateneo_clinico",
        ),
        # Un «ateneo de grupo» sin grupo no está identificado: el grupo es su
        # sujeto.
        CheckConstraint(
            "tipo <> 'grupo' OR grupo_id IS NOT NULL",
            name="grupo_requerido_en_ateneo_de_grupo",
        ),
        # …pero en el clínico el grupo es **contexto y opcional**, contra el `req`
        # del prototipo: `hce_diurna.grupo_id` es nullable, y exigirlo impediría
        # registrar un ateneo clínico sobre un NNA sin grupo asignado. Bloquear el
        # registro de trabajo clínico real por un hueco administrativo es peor que
        # perder un filtro.
        CheckConstraint(
            "tipo IN ('clinico', 'grupo') OR grupo_id IS NULL",
            name="grupo_solo_con_sujeto",
        ),
        # Los dos bloques de contenido son exclusivos en la UI
        # (`esJ ? <jornada> : <desarrollo clínico>`): una fila con los dos llenos
        # no es representable en el formulario y sería un error de datos.
        CheckConstraint(
            f"tipo = 'jornada' OR NOT ({_con_texto(*CAMPOS_JORNADA)})",
            name="campos_de_jornada_solo_en_jornada",
        ),
        CheckConstraint(
            f"tipo <> 'jornada' OR NOT ({_con_texto(*CAMPOS_DESARROLLO_CLINICO)})",
            name="desarrollo_clinico_no_va_en_jornada",
        ),
    )


class AteneoAcuerdo(Base):
    """Un acuerdo del ateneo: qué se acordó, quién responde (rol) y para cuándo.

    `acuerdos[] → {a, r, p}` del prototipo. Tabla hija y no JSONB por el mismo
    motivo que `registro_organismo`: el panel institucional los consulta y los
    ordena **entre ateneos** («acuerdos vencidos sin cumplir» es una consulta
    transversal, no un dato de un registro).

    **Cascada desde el ateneo**, a diferencia de `ateneo.hce_referida_id`: los
    acuerdos **son partes** del ateneo, como `puntuacion_idea` lo es de su
    evaluación. Borrar el ateneo borra sus acuerdos; no hay acuerdo suelto.

    ⚠️ «Una jornada no lleva acuerdos» (el bloque de acuerdos vive en la rama
    no-jornada del prototipo) **no está acá**: es cross-table y un CHECK no
    alcanza. Guard de M11.3 (§5.2.2 prohíbe los triggers).
    """
    __tablename__ = "ateneo_acuerdo"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    ateneo_id: Mapped[int] = mapped_column(
        ForeignKey("ateneo.id", ondelete="CASCADE"), index=True
    )
    #: Qué se acordó. NOT NULL y no vacío: `atAddAc()` empuja `{a:'',r:'',p:''}`,
    #: pero un acuerdo sin texto no es un acuerdo. La consecuencia para la UI —
    #: «+ Agregar acuerdo» agrega la fila en el cliente, no en la base— está
    #: anotada con las otras tres en el esquema §4.
    acuerdo: Mapped[str] = mapped_column(Text)
    #: **Rol**, no FK a `profesional`: el prototipo rotula «Responsable (rol)» y
    #: su seed guarda «Técnico/a responsable 2», «Coordinación técnica». Es la
    #: misma decisión de §5.17 (roles genéricos como texto) y la misma de
    #: privacidad que `participantes`.
    responsable_rol: Mapped[str | None] = mapped_column(String(80))
    #: Plazo. Nullable: no es `req` y un acuerdo sin fecha límite es legítimo.
    plazo: Mapped[date | None] = mapped_column(Date)
    #: Orden de presentación. **El acta se imprime en orden** y el del prototipo
    #: es posicional (`push` / `splice`), que sin columna se pierde en cuanto la
    #: consulta no garantiza el orden de inserción. Precedente `taller.orden`.
    #:
    #: ── Sin `UNIQUE(ateneo_id, orden)`, y el empate igual no existe ──────────
    #: `taller.orden` tampoco lo lleva, pero acá el argumento no es la coherencia
    #: sino que el `UNIQUE` **no arregla el problema y crea uno**: en Postgres una
    #: restricción única no diferida se verifica **por fila**, así que el
    #: `UPDATE … SET orden = CASE …` que intercambia dos acuerdos falla a mitad
    #: de sentencia. Habría que hacerla `DEFERRABLE` —sin precedente en el
    #: esquema— o pasar por un valor temporal.
    #:
    #: El modo de falla real que señala C2 es **«el acta se imprime en orden
    #: indefinido»**, y eso lo cierra el desempate, no la unicidad: la relación
    #: ordena por `(orden, id)`. `id` es el orden de inserción, que es
    #: exactamente la semántica posicional del array del prototipo. Con dos
    #: acuerdos en `orden = 0` el resultado es determinístico y es el que el
    #: usuario cargó — con `UNIQUE` habría sido un `IntegrityError` al guardar el
    #: segundo.
    orden: Mapped[int] = mapped_column(Integer, default=0)

    ateneo: Mapped["Ateneo"] = relationship(back_populates="acuerdos")

    __table_args__ = (
        CheckConstraint("acuerdo ~ '[^[:space:]]'", name="acuerdo_no_vacio"),
    )
