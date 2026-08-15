"""Tests de M12.4 — HCE-SEV · Severidad DSM-5-TR (`handoff.md` §5.24).

Mismo criterio que el resto de la ronda (§5.2.2): la base garantiza *integridad
estructural* y es lo único que se prueba acá. Las reglas clínicas —que el nivel
no se derive del IDEA ni de la IPPU-TEA, que toda edición deje auditoría de
campo, que la severidad no participe de ningún cálculo de elegibilidad— son
**guards de M11.3** y están anotadas en `backend/docs/esquema-datos-v2.md` §4.

Cada rechazo se prueba junto con su caso que sí pasa: un CHECK que rechaza todo
también «pasaría» un test de rechazo.
"""
import json
from datetime import date
from pathlib import Path

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

import app
from app.models import (
    HceDiurna, Idea, Persona, Profesional, SeveridadDsm, SeveridadNivel,
)

CATALOGOS = json.loads(
    (Path(app.__file__).parent / "data" / "catalogos_iniciales.json").read_text(
        encoding="utf-8"
    )
)

#: Las 3 etiquetas del Prototipo v4 (`SEV_ETQ`), transcritas a mano acá y en
#: ningún otro lado del código: si alguien regenera el JSON desde otra fuente o
#: edita un texto a mano, este test lo dice. Mismo recurso que `LOS_14` en
#: `test_m12_talleres.py`.
ETIQUETAS = {
    1: "Grado 1 · Necesita ayuda",
    2: "Grado 2 · Necesita ayuda notable",
    3: "Grado 3 · Necesita ayuda muy notable",
}


# --------------------------------------------------------------------------
# Ayudas
# --------------------------------------------------------------------------
def _hce(db, ci="4.444.444-4"):
    p = Persona(nombre="Test", apellido="Severidad", ci=ci, fecha_nac=date(2015, 5, 1))
    db.add(p)
    db.flush()
    h = HceDiurna(persona_id=p.id)
    db.add(h)
    db.flush()
    return h


def _profesional(db, email="sev@ippu.test"):
    pro = Profesional(nombre=email, email=email)
    db.add(pro)
    db.flush()
    return pro


def _severidad(db, hce=None, profesional=None, **campos):
    """Un registro válido, con los campos que el test quiera pisar."""
    datos = {
        "hce_id": (hce or _hce(db)).id,
        "nivel_cs": 2,
        "nivel_crr": 2,
        "justificacion": "Necesidad de ayuda notable en ambos dominios, coherente "
                         "en hogar y centro.",
        "fecha": date(2026, 4, 10),
        "profesional_id": (profesional or _profesional(db)).id,
    }
    datos.update(campos)
    registro = SeveridadDsm(**datos)
    db.add(registro)
    return registro


# --------------------------------------------------------------------------
# Los dos dominios son independientes
# --------------------------------------------------------------------------
def test_los_dos_dominios_son_independientes(db):
    """CS 3 con CRR 1 es un perfil corriente; nada en el modelo los ata.

    Es la propiedad central del módulo: el DSM-5-TR pide especificar la
    severidad **por separado para cada dominio**, y un modelo que obligara a que
    se parezcan estaría inventando una regla clínica.
    """
    _severidad(db, nivel_cs=3, nivel_crr=1)
    db.flush()  # no debe levantar

    registro = db.scalars(select(SeveridadDsm)).one()
    assert (registro.nivel_cs, registro.nivel_crr) == (3, 1)


def test_los_tres_grados_validos_pasan_en_los_dos_dominios(db):
    pro = _profesional(db)
    for grado in (1, 2, 3):
        _severidad(db, hce=_hce(db, ci=f"4.44{grado}.444-{grado}"), profesional=pro,
                   nivel_cs=grado, nivel_crr=grado)
    db.flush()  # no debe levantar
    assert len(db.scalars(select(SeveridadDsm)).all()) == 3


@pytest.mark.parametrize("valor", [0, 4, -1])
def test_nivel_cs_fuera_de_1_3_se_rechaza(db, valor):
    _severidad(db, nivel_cs=valor)
    with pytest.raises(IntegrityError, match="rango_nivel_cs"):
        db.flush()


@pytest.mark.parametrize("valor", [0, 4, -1])
def test_nivel_crr_fuera_de_1_3_se_rechaza(db, valor):
    _severidad(db, nivel_crr=valor)
    with pytest.raises(IntegrityError, match="rango_nivel_crr"):
        db.flush()


# --------------------------------------------------------------------------
# Justificación, fecha y autor: sin eso no es un juicio clínico
# --------------------------------------------------------------------------
def test_justificacion_valida_pasa(db):
    _severidad(db, justificacion="Observación en tres contextos durante seis semanas.")
    db.flush()  # no debe levantar


def test_justificacion_nula_se_rechaza(db):
    _severidad(db, justificacion=None)
    with pytest.raises(IntegrityError):
        db.flush()


@pytest.mark.parametrize("vacia", ["", "   ", "\n\t "])
def test_justificacion_vacia_se_rechaza(db, vacia):
    """NOT NULL no alcanza: una cadena de espacios pasaría igual.

    Importa porque la regla dura del módulo es que el nivel **no se calcula**;
    la justificación es lo único que distingue un juicio clínico de una
    derivación que alguien hizo a ojo desde el IDEA.
    """
    _severidad(db, justificacion=vacia)
    with pytest.raises(IntegrityError, match="justificacion_no_vacia"):
        db.flush()


def test_fecha_nula_se_rechaza(db):
    """La regla dice que la severidad fluctúa y que esto describe la necesidad
    de apoyo **actual**: sin fecha, «actual» no significa nada."""
    _severidad(db, fecha=None)
    with pytest.raises(IntegrityError):
        db.flush()


def test_profesional_nulo_se_rechaza(db):
    _severidad(db, profesional_id=None)
    with pytest.raises(IntegrityError):
        db.flush()


def test_profesional_inexistente_se_rechaza(db):
    _severidad(db, profesional_id=999_999)
    with pytest.raises(IntegrityError):
        db.flush()


# --------------------------------------------------------------------------
# Cardinalidad
# --------------------------------------------------------------------------
def test_un_expediente_sin_severidad_es_valido(db):
    """El módulo **no es obligatorio**: «todavía no se juzgó» es *no tener fila*.

    Es lo que hace correcto que `nivel_cs`/`nivel_crr` sean NOT NULL: el estado
    «sin evaluar» ya tiene representación, y columnas nullable serían una
    segunda forma de decir lo mismo.
    """
    hce = _hce(db)
    db.flush()
    assert hce.severidad is None


def test_un_solo_registro_de_severidad_por_expediente(db):
    """0..1: la PK es `hce_id`. Es la dirección reversible — pasar a 1:N es
    agregar un `id`; el camino inverso obliga a descartar filas."""
    hce = _hce(db)
    _severidad(db, hce=hce)
    db.flush()
    _severidad(db, hce=hce, profesional=_profesional(db, "otro@ippu.test"))
    with pytest.raises(IntegrityError):
        db.flush()


def test_borrar_el_expediente_borra_la_severidad(db):
    hce = _hce(db)
    _severidad(db, hce=hce)
    db.flush()
    assert db.scalars(select(SeveridadDsm)).all()

    db.delete(hce)
    db.flush()
    assert db.scalars(select(SeveridadDsm)).all() == []


# --------------------------------------------------------------------------
# Catálogo: los 3 grados y sus etiquetas derivadas
# --------------------------------------------------------------------------
def test_el_json_trae_los_tres_grados_con_sus_cuatro_textos():
    filas = CATALOGOS["severidad_nivel"]
    assert [f["grado"] for f in filas] == [1, 2, 3]
    for fila in filas:
        assert fila["etiqueta"] == ETIQUETAS[fila["grado"]]
        for campo in ("descriptor_cs", "descriptor_crr", "apoyos"):
            assert fila[campo] and fila[campo].strip(), (fila["grado"], campo)


def test_los_descriptores_de_los_dos_dominios_son_distintos():
    """`SEV_CS` y `SEV_CRR` describen dominios distintos: si alguien generara el
    catálogo mal y copiara uno sobre el otro, el módulo perdería su razón de ser."""
    for fila in CATALOGOS["severidad_nivel"]:
        assert fila["descriptor_cs"] != fila["descriptor_crr"], fila["grado"]


def test_la_etiqueta_se_deriva_del_numero_y_no_se_guarda_en_el_registro(db):
    """«Grado 2 · Necesita ayuda notable» sale del catálogo, no de una columna.

    Guardarla en `severidad_dsm` sería reintroducir ahí el mismo campo que se
    acaba de retirar de `hce_diurna` (§5.24).
    """
    assert not hasattr(SeveridadDsm, "etiqueta_cs")
    assert not hasattr(SeveridadDsm, "etiqueta_crr")

    for fila in CATALOGOS["severidad_nivel"]:
        db.add(SeveridadNivel(**fila))
    db.flush()

    registro = _severidad(db, nivel_cs=3, nivel_crr=1)
    db.flush()

    etiqueta_cs = db.get(SeveridadNivel, registro.nivel_cs).etiqueta
    etiqueta_crr = db.get(SeveridadNivel, registro.nivel_crr).etiqueta
    assert etiqueta_cs == "Grado 3 · Necesita ayuda muy notable"
    assert etiqueta_crr == "Grado 1 · Necesita ayuda"


def test_el_catalogo_rechaza_un_grado_fuera_de_1_3(db):
    db.add(SeveridadNivel(grado=4, etiqueta="Grado 4", descriptor_cs="x",
                          descriptor_crr="y", apoyos="z"))
    with pytest.raises(IntegrityError, match="rango_grado"):
        db.flush()


def test_ningun_texto_de_severidad_dice_grave():
    """Vocabulario institucional §8.1: «severo / muy severo», nunca «grave».

    Ya hay un test general de catálogos; éste cubre la sección nueva por si
    alguien la agrega al JSON sin pasar por el generador.
    """
    for fila in CATALOGOS["severidad_nivel"]:
        volcado = " ".join(str(v) for v in fila.values()).lower()
        assert "grave" not in volcado, fila["grado"]


# --------------------------------------------------------------------------
# Aislamiento estructural — las dos direcciones
# --------------------------------------------------------------------------
def _referencias_hacia(nombre_tabla: str) -> set[str]:
    from app.core.database import Base

    return {
        f"{tabla.name}.{fk.parent.name}"
        for tabla in Base.metadata.tables.values()
        for fk in tabla.foreign_keys
        if fk.column.table.name == nombre_tabla
    }


def test_severidad_no_apunta_a_los_instrumentos_clinicos():
    """**Entrada:** el nivel no se deriva del IDEA ni de la Escala IPPU-TEA.

    Son instrumentos no homologables (regla del módulo y §5.2). Una FK o una
    columna hacia `idea`/`protocolo` sería el primer paso de esa derivación, así
    que se verifica que no exista **ninguna**. El guard de servicio es M11.3;
    esto fija la estructura.
    """
    from app.core.database import Base

    tabla = Base.metadata.tables["severidad_dsm"]

    apunta_a = {fk.column.table.name for fk in tabla.foreign_keys}
    assert apunta_a == {"hce_diurna", "profesional"}, apunta_a

    columnas = " ".join(tabla.columns.keys()).lower()
    for prohibida in ("idea", "protocolo", "ippu", "total", "puntaje", "pct"):
        assert prohibida not in columnas, prohibida


def test_las_tablas_de_hce_vf_no_apuntan_a_severidad():
    """**Salida:** la severidad no participa de ningún cálculo de elegibilidad.

    Es el espejo del guard §7.5, que hoy cierra la entrada del baremo y deja la
    salida abierta. «Grado 3» no implica ni sugiere un porcentaje de baremo ni
    la «Dependencia Severa» que evalúan MIDES/BPS: son determinaciones de otros
    organismos. IPPU registra, no determina.
    """
    from app.core.database import Base

    for nombre in ("valoracion_funcional", "baremo_categoria"):
        tabla = Base.metadata.tables[nombre]
        apuntan = {fk.column.table.name for fk in tabla.foreign_keys}
        assert "severidad_dsm" not in apuntan, nombre
        columnas = " ".join(tabla.columns.keys()).lower()
        for prohibida in ("severidad", "nivel_cs", "nivel_crr", "dsm"):
            assert prohibida not in columnas, (nombre, prohibida)

    assert _referencias_hacia("severidad_dsm") == set()


def test_ninguna_fk_del_esquema_queda_sin_indice():
    """Criterio de cierre de la ronda: la cuenta de FKs sin respaldo va en 0.

    Se escribe acá porque en M12.4 **no estaba en 0**: `puntuacion_idea.
    dimension_id` y `puntuacion_protocolo.item_id` quedaron sin índice en M12.2 —
    su `UNIQUE` compuesto no las cubre, porque no son la columna líder. Se
    corrigieron y el chequeo queda automatizado para que no vuelva a pasar
    inadvertido en M12.5–M12.7.

    Un índice **compuesto** sirve si la FK es su prefijo; la PK también cuenta.
    """
    from app.core.database import Base

    sin_respaldo = []
    for tabla in Base.metadata.tables.values():
        prefijos = {tuple(i.columns.keys()) for i in tabla.indexes}
        prefijos |= {
            tuple(c.name for c in tabla.columns if c.unique or c.primary_key)
        }
        prefijos |= {
            tuple(c.name for c in con.columns)
            for con in tabla.constraints
            if con.__class__.__name__ in ("UniqueConstraint", "PrimaryKeyConstraint")
        }
        for fk in tabla.foreign_key_constraints:
            cols = tuple(c.name for c in fk.columns)
            if not any(p[: len(cols)] == cols for p in prefijos):
                sin_respaldo.append(f"{tabla.name}.{cols}")
    assert not sin_respaldo, sin_respaldo


def test_el_catalogo_de_severidad_no_tiene_fk_entrantes():
    """Mismo criterio que `taller` (M12.3): `nivel_cs`/`nivel_crr` son el dato
    primario —el juicio clínico—, no una clasificación derivada, y valen aunque
    la tabla de descriptores esté vacía. El rango lo garantiza el CHECK."""
    assert _referencias_hacia("severidad_nivel") == set()


# --------------------------------------------------------------------------
# `hce_diurna.nivel_soporte` retirado (§5.24)
# --------------------------------------------------------------------------
def test_nivel_soporte_ya_no_existe_en_el_expediente():
    """Era la tercera fuente de verdad sobre el nivel DSM.

    En el prototipo es la etiqueta visible de la ficha, que el propio HCE-SEV
    pisa en cada edición (`setSev()` → `p.nivel = sevResumen(p)`) — una copia sin
    justificación, fecha ni autor de lo que `severidad_dsm` registra bien.
    """
    from app.core.database import Base

    assert not hasattr(HceDiurna, "nivel_soporte")
    assert "nivel_soporte" not in Base.metadata.tables["hce_diurna"].columns


def test_la_banda_del_idea_conserva_su_nivel_dsm():
    """`banda_idea.nivel_dsm` **se queda**: es propiedad DE LA BANDA, no del NNA.

    Dice «un total de 56–75 se corresponde orientativamente con Nivel 2» — es
    contenido del catálogo del IDEA (D4), no un juicio sobre nadie. Que se
    retire `nivel_soporte` no lo toca.
    """
    from app.core.database import Base

    assert "nivel_dsm" in Base.metadata.tables["banda_idea"].columns
    assert {f["nivel_dsm"] for f in CATALOGOS["banda_idea"]}


def test_severidad_e_idea_conviven_sin_tocarse(db):
    """Los dos registros coexisten en el mismo expediente y ninguno depende del
    otro: es la forma verificable de «instrumentos no homologables»."""
    hce = _hce(db)
    db.add(Idea(hce_id=hce.id, total=91, esc_a=24, esc_b=23, esc_c=22, esc_d=22))
    _severidad(db, hce=hce, nivel_cs=1, nivel_crr=1)
    db.flush()  # un IDEA de 91/96 con severidad Grado 1 es representable

    registro = db.scalars(select(SeveridadDsm)).one()
    assert (registro.nivel_cs, registro.nivel_crr) == (1, 1)
