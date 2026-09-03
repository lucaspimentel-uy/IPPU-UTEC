"""HCE-DIV · Registro de divulgación de datos — M12.8a.

**Archivo propio**, como `severidad.py` (M12.4), `inclusion.py` (M12.5),
`ateneo.py` (M12.7) y `pai.py` (M12.6): no es parte del flujo firmable
(`modulos.py`), no es catálogo (`catalogos.py`) y no es un transversal del
expediente en el sentido de `transversales.py`.

── Qué representa ──────────────────────────────────────────────────────────
El **acto de comunicar un dato clínico a un tercero**: a quién, por qué, con
qué grado de identificación y bajo qué autorización. Es lo que el modelo no
tenía —R0 midió que hoy sólo se representa el **almacenamiento**, no la
**divulgación**— y sobre lo que caen cuatro afirmaciones distintas de IPPU
(fotos §5.39/I4, confidencialidad §5.45/I10, revisión de informes por
dirección §5.40/I5, «a las instituciones se les manda un resumen, no el
expediente»).

La fuente de las columnas es el **Protocolo institucional de acceso,
confidencialidad y resguardo de la HC** —matriz §5 y procedimientos §6.2–6.7—,
no el Prototipo v4, que no modela esto. La decisión de crear la tabla está en
`handoff.md` §5.71; cómo quedó construida, en §5.80.

── Append-only: una postura, no una restricción ───────────────────────────
No hay endpoint de UPDATE ni DELETE sobre esta tabla, igual que `auditoria`:
`divulgacion` registra un **hecho ocurrido**, no una solicitud en trámite, y un
hecho registrado no se edita. En despliegue se recomienda además
`REVOKE UPDATE, DELETE ON divulgacion FROM rol_app` — un **permiso**, no lógica
de negocio, así que no contradice §5.2.2 (anotado para M11.4 / Fase 6). **Sin
trigger.**

── Lo que este módulo NO construye ────────────────────────────────────────
- **Ningún guard.** Quién *puede* divulgar según su rol (matriz §5), si un
  consentimiento *habilita* la salida, la compuerta «borrador → revisado por
  dirección → entregado» de §5.40 (§2.13), y los dos CHECK cruzados que se
  dejaron afuera a propósito (ver `__table_args__`) — todo **M11.3/M11.4**.
  §5.71 difiere los guards explícitamente.
- **La frontera con `registro_organismo`**, que es **prosa, no esquema**.
  `registro_organismo` registra el **trámite** que la institución sigue con INAU
  o BPS (parte de HCE-ORG); `divulgacion` registra el **acto de comunicar un
  dato** bajo el régimen del Protocolo. Un envío a INAU puede generar una fila
  en cada tabla y está bien: son afirmaciones sobre sujetos distintos. **No hay
  CHECK ni FK entre ellas**; la coordinación es guard de M11.3.
- **El registro de accesos con motivo** (`puntos-a-validar.md` §2.17): leer una
  HC no es divulgar un dato. Es otra tabla y otro hueco.
- **Sin seed:** la tabla nace vacía (§5.71).
"""
from datetime import date

from sqlalchemy import (
    Boolean, CheckConstraint, Date, ForeignKey, Integer, String, Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constantes import DIVULGACION_ALCANCES, DIVULGACION_DESTINATARIOS
from app.core.database import Base


def _dominio(columna: str, valores: tuple[str, ...], *, nullable: bool = True) -> str:
    """SQL para «esta columna está dentro del dominio», escrito desde la constante.

    Tercera copia del helper: nació en M12.7, `inclusion.py` (M12.5) lo copió y
    `pai.py` (M12.6) también, cada uno con la misma nota —son cuatro líneas y
    factorizarlo a un módulo común toca archivos ya cerrados—. La consolidación
    sigue anotada para una limpieza posterior (M12.8b / pase de higiene); acá se
    copia por el mismo motivo que las veces anteriores.

    El CHECK **no se transcribe a mano**: se genera desde la misma tupla de
    `core/constantes.py` que usan el modelo, el seed y la UI, y el test
    `test_el_check_y_la_constante_no_pueden_divergir` (M12.7) lo verifica sobre
    los dos dominios de este módulo.
    """
    lista = ", ".join("'" + v.replace("'", "''") + "'" for v in valores)
    expr = f"{columna} IN ({lista})"
    return f"{columna} IS NULL OR {expr}" if nullable else expr


class Divulgacion(Base):
    """Un acto de divulgación de datos clínicos a un tercero.

    ── De qué expediente / ateneo salió el dato ───────────────────────────
    `hce_id` y `ateneo_id` son la **pertenencia**: el dato divulgado es
    contenido de un expediente, o de un ateneo institucional (§5.25). Los dos
    nullable, y el CHECK es `num_nonnulls(...) <= 1` y **no `= 1`**: el informe
    agregado de §6.6 —una estadística de todo el servicio, «de modo que sea
    imposible identificar a un usuario en particular»— **no pertenece a ningún
    expediente ni ateneo** y tiene que poder registrarse con las dos FK en NULL.

    ── `hce_id` CASCADE, con la contra-argumentación registrada (D-B) ──────
    Cascada, como `severidad_dsm`, `inclusion` y `pai`: `divulgacion` es
    contenido del expediente —es *sobre* sus datos—. La contra-argumentación,
    para que quede escrita: un registro de divulgación es rastro de rendición de
    cuentas, y ese hecho puede importar *después* de que el expediente físico se
    borre; por eso `ateneo` y `auditoria` **no** cascadean. Se eligió CASCADE
    igual porque (a) un DELETE físico de `hce_diurna` es una corrección
    administrativa o un borrado por protección de datos —la baja normal es
    lógica (`activo` + `fecha_baja`)—, y en un borrado por protección de datos
    en general se quiere que los registros sobre esa persona también se vayan;
    (b) CASCADE → RESTRICT es una migración sin pérdida y al revés no (mismo
    argumento que M12.4 y `ateneo`).

    ── `documento_id`: qué salió ─────────────────────────────────────────
    El diseño registraba *a quién*, *por qué* y *con qué alcance*, pero no
    **qué**. El Protocolo §6.6 gobierna «todo **informe** destinado a…» y §6.5
    el traslado de la HC completa: el objeto de la divulgación es parte del
    hecho. Nullable porque no todo lo que se divulga es una fila de `documento`
    cargada (un informe agregado al Consejo puede no serlo); **RESTRICT** porque
    un documento referenciado por un registro de divulgación no puede
    desaparecer. Sin CHECK que lo ate a `alcance_dato` — eso es guard.

    ── Autorización: bandera + puntero + referencia ──────────────────────
    `autorizacion_escrita` es el hecho (`server_default false`);
    `autorizacion_documento_id` apunta a la autorización cuando está cargada
    como `documento` (RESTRICT, mismo motivo que arriba); `autorizacion_ref` es
    la referencia en texto cuando no hay documento. **No hay CHECK** que exija
    el puntero cuando la bandera es verdadera: es un guard de M11.3 (§5.71).

    ── Obligatoriedad ───────────────────────────────────────────────────
    NOT NULL: `destinatario_tipo`, `alcance_dato`, `autorizacion_escrita`,
    `finalidad`, `fecha`, `responsable_id` — sin ninguno de esos, el registro no
    es el registro de nada. El resto es contexto y es opcional. `finalidad`
    lleva además el `~ '[^[:space:]]'` de `ateneo.titulo`: un motivo en blanco
    no es un motivo (Protocolo §8 y §4).
    """
    __tablename__ = "divulgacion"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    #: El expediente del que salió el dato. Pertenencia → cascada (ver docstring).
    hce_id: Mapped[int | None] = mapped_column(
        ForeignKey("hce_diurna.id", ondelete="CASCADE"), index=True
    )
    #: El ateneo institucional del que salió el dato (§5.25). Cascada como
    #: `documento.ateneo_id`: la divulgación que salió de un ateneo se va con él.
    ateneo_id: Mapped[int | None] = mapped_column(
        ForeignKey("ateneo.id", ondelete="CASCADE"), index=True
    )
    #: **Qué** salió: el informe o documento comunicado. RESTRICT — no puede
    #: desvanecerse un documento que un registro de divulgación referencia.
    documento_id: Mapped[int | None] = mapped_column(
        ForeignKey("documento.id", ondelete="RESTRICT"), index=True
    )

    #: A quién — clave de `core/constantes.py::DIVULGACION_DESTINATARIOS`
    #: (categorías de actor de la matriz §5 del Protocolo).
    destinatario_tipo: Mapped[str] = mapped_column(String(80), index=True)
    #: Nombre o referencia del destinatario concreto. Libre, **sin CHECK**
    #: (§6.2: «indicando el alcance y la finalidad»).
    destinatario_detalle: Mapped[str | None] = mapped_column(Text)

    #: `identificable` / `disociado` / `agregado` — el grado con que salió el
    #: dato. Es el valor contra el que M11.3 escribe el guard de §6.6/§6.7.
    alcance_dato: Mapped[str] = mapped_column(String(20))

    #: ¿Hubo autorización expresa y por escrito del titular o representante?
    #: (§6.2 terceros · §6.5 traslado de HC). `default` + `server_default="false"`
    #: es el mismo idioma que `puntuacion_idea.ns_t1` (`modulos.py:307`): NOT NULL
    #: con un default de «no», para que la ausencia de dato sea «no consta
    #: autorización», nunca NULL.
    autorizacion_escrita: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false"
    )
    #: La autorización escrita, cuando está cargada como documento. RESTRICT.
    autorizacion_documento_id: Mapped[int | None] = mapped_column(
        ForeignKey("documento.id", ondelete="RESTRICT"), index=True
    )
    #: Referencia a la autorización cuando no hay documento cargado (nº de acta,
    #: expediente, oficio). Libre.
    autorizacion_ref: Mapped[str | None] = mapped_column(String(200))

    #: Por qué vía formal salió: Unidad Competente Territorial/Programática de
    #: INAU (§6.3); canal de auditoría/habilitación de MSP-BPS (§6.3); Dirección
    #: General para requerimientos judiciales (§6.4). Libre.
    canal_formal: Mapped[str | None] = mapped_column(String(200))

    #: Para qué se comunicó el dato (§8 «motivo de la consulta» · §4 finalidad y
    #: minimización). NOT NULL y no vacío.
    finalidad: Mapped[str] = mapped_column(Text)

    #: Cuándo (§8). Se filtra y se ordena por acá.
    fecha: Mapped[date] = mapped_column(Date, index=True)
    #: Quién hizo la divulgación (§8 «persona que accede»). NOT NULL — un acto de
    #: divulgación sin responsable no se puede auditar. RESTRICT: dar de baja a
    #: un profesional no borra el registro de lo que divulgó.
    responsable_id: Mapped[int] = mapped_column(
        ForeignKey("profesional.id", ondelete="RESTRICT"), index=True
    )

    #: Texto libre.
    obs: Mapped[str | None] = mapped_column(Text)

    hce: Mapped["HceDiurna | None"] = relationship()          # noqa: F821
    ateneo: Mapped["Ateneo | None"] = relationship()          # noqa: F821
    documento: Mapped["Documento | None"] = relationship(     # noqa: F821
        foreign_keys=[documento_id]
    )
    autorizacion_documento: Mapped["Documento | None"] = relationship(  # noqa: F821
        foreign_keys=[autorizacion_documento_id]
    )
    responsable: Mapped["Profesional"] = relationship()       # noqa: F821

    __table_args__ = (
        # Pertenencia: a lo sumo una. **`<= 1`, no `= 1`**: el informe agregado
        # de §6.6 no es de ningún expediente ni ateneo — es una estadística de
        # todo el servicio — y tiene que poder registrarse con las dos en NULL.
        CheckConstraint(
            "num_nonnulls(hce_id, ateneo_id) <= 1", name="expediente_o_ateneo"
        ),
        CheckConstraint(
            _dominio("destinatario_tipo", DIVULGACION_DESTINATARIOS, nullable=False),
            name="destinatario_tipo_valido",
        ),
        CheckConstraint(
            _dominio("alcance_dato", DIVULGACION_ALCANCES, nullable=False),
            name="alcance_dato_valido",
        ),
        CheckConstraint("finalidad ~ '[^[:space:]]'", name="finalidad_no_vacia"),
        # ── Los dos CHECK cruzados que NO se ponen, escritos para que no se
        #    re-deriven como un olvido (§5.80) ────────────────────────────────
        # (1) `alcance_dato <> 'agregado' OR hce_id IS NULL` — un informe
        #     agregado no debería colgar de un expediente puntual.
        # (2) «si `autorizacion_escrita` es verdadero, entonces
        #     `autorizacion_documento_id` o `autorizacion_ref` tiene que estar».
        # Los dos son **guards de M11.3**: §5.71 difiere los guards, y el
        # segundo además necesita devolver *qué* falta, cosa que un CHECK no
        # puede.
    )
