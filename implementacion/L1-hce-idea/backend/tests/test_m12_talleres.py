"""Tests de M12.3 — catálogo dinámico de talleres (D5, `handoff.md` §5.14).

Mismo criterio que el resto de la ronda: se prueba lo que la base garantiza y la
forma del JSON que alimenta el seed. Las reglas de flujo son M11.3.

**Lo que este archivo NO prueba, a propósito.** El plan M12 pedía verificar D5
con un test que carga participación en «Taller de huerta», lo retira del catálogo
y afirma que la participación sigue legible y marcada como retirada. Con
`hce_taller` retirada (§5.20) y `pai_taller` sin construir **no existe tabla de
participación**, así que ese criterio se traspasó a **M12.6** (§5.21). Fabricar
acá una tabla de participación —o un mock que finja una— sería trabajo que M12.6
va a rehacer distinto.
"""
import json
from datetime import date
from pathlib import Path

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

import app
from app.models import Grupo, Taller

CATALOGOS = json.loads(
    (Path(app.__file__).parent / "data" / "catalogos_iniciales.json").read_text(
        encoding="utf-8"
    )
)

#: Los 14 del Prototipo v4, en el orden de `CAT_TALLERES`. Se escriben acá a
#: mano —única transcripción del proyecto— justamente para que el test falle si
#: alguien regenera el JSON desde otra fuente o edita un nombre a mano.
LOS_14 = [
    "Taller de cuentos y estimulación del lenguaje",
    "Taller de música y expresión",
    "Taller de expresión plástica",
    "Taller pedagógico / iniciación a la lógica",
    "Taller de cocina",
    "Taller de huerta",
    "Taller de higiene y AVD",
    "Taller de habilidades sociales",
    "Taller de TICs",
    "Educación Física",
    "Actividades lúdicas y de juego",
    "Actividades sensoriales",
    "Salidas didácticas / paseos",
    "Participación de familia / referentes en actividades",
]

#: Los 8 de la demo v4.1 que M12.3 reemplaza. No coincide **ninguno** con los
#: reales: los inventó la demo, no vinieron de ninguna fuente de IPPU.
LOS_8_VIEJOS = {
    "Habilidades sociales", "Lenguaje y comunicación", "Motricidad",
    "Juego simbólico", "Música y expresión", "Vida diaria (AVD)",
    "Arte y plástica", "Psicomotricidad",
}


# --------------------------------------------------------------------------
# Los 14 reales, en reemplazo de los 8 de la demo
# --------------------------------------------------------------------------
def test_el_seed_trae_los_catorce_talleres_del_prototipo():
    nombres = [t["nombre"] for t in sorted(CATALOGOS["taller"], key=lambda t: t["orden"])]
    assert nombres == LOS_14


def test_no_queda_ninguno_de_los_ocho_de_la_demo():
    """Se reemplazan, no se complementan (§5.14): no coincide ninguno."""
    nombres = {t["nombre"] for t in CATALOGOS["taller"]}
    assert not (nombres & LOS_8_VIEJOS)


def test_los_nombres_entran_en_la_columna():
    """El más largo mide 51 caracteres y `nombre` es `String(80)`."""
    assert max(len(t["nombre"]) for t in CATALOGOS["taller"]) <= 80


def test_el_seed_no_orienta_ni_retira_ningun_taller():
    """El repo carga nombres, no gestión.

    A qué grupos se orienta cada taller y cuándo se retira lo decide
    coordinación desde la app; sembrarlo sería inventar un dato que IPPU no dio.
    """
    for t in CATALOGOS["taller"]:
        assert t["grupos_orientados"] == []
        assert t["retirado_en"] is None


def test_taller_rechaza_un_nombre_repetido(db):
    db.add(Taller(nombre="Taller de huerta", orden=1))
    db.flush()
    db.add(Taller(nombre="Taller de huerta", orden=2))
    with pytest.raises(IntegrityError):
        db.flush()


# --------------------------------------------------------------------------
# `activo` derivado de `retirado_en`
# --------------------------------------------------------------------------
def test_un_taller_sin_fecha_de_retiro_esta_activo(db):
    t = Taller(nombre="Taller de cocina", orden=1)
    db.add(t)
    db.flush()
    assert t.activo is True


def test_un_taller_con_fecha_de_retiro_esta_inactivo(db):
    t = Taller(nombre="Taller de TICs", orden=1, retirado_en=date(2026, 3, 1))
    db.add(t)
    db.flush()
    assert t.activo is False


def test_activo_no_se_puede_contradecir_con_retirado_en(db):
    """El punto de que sea derivado y no columna.

    No existe forma de dejar «activo=True, retirado_en=<fecha>»: `activo` no es
    asignable, así que el drift que tendría un booleano guardado al lado no puede
    ocurrir. Es el mismo criterio de `procedimiento` (M12.2) y `sensible` (M12.5).
    """
    t = Taller(nombre="Taller de huerta", orden=1)
    db.add(t)
    db.flush()

    with pytest.raises(AttributeError):
        t.activo = False                       # no hay setter: es derivado

    with pytest.raises(AttributeError):
        Taller(nombre="Otro taller", orden=2, activo=False)   # ni por constructor

    assert "activo" not in Taller.__table__.columns, "`activo` no es columna"


def test_activo_filtra_en_sql_igual_que_en_python(db):
    """Sirve para la consulta de coordinación, no sólo para el objeto cargado."""
    db.add(Taller(nombre="Taller vigente", orden=1))
    db.add(Taller(nombre="Taller retirado", orden=2, retirado_en=date(2026, 3, 1)))
    db.flush()

    activos = db.scalars(select(Taller).where(Taller.activo)).all()
    retirados = db.scalars(select(Taller).where(~Taller.activo)).all()

    assert [t.nombre for t in activos] == ["Taller vigente"]
    assert [t.nombre for t in retirados] == ["Taller retirado"]
    assert all(t.activo for t in activos) and not any(t.activo for t in retirados)


def test_retirar_y_reincorporar_un_taller_es_reversible(db):
    """Coordinación retira y vuelve a incorporar; no hay estado intermedio raro."""
    t = Taller(nombre="Taller de huerta", orden=1)
    db.add(t)
    db.flush()

    t.retirado_en = date(2026, 6, 30)
    db.flush()
    assert t.activo is False

    t.retirado_en = None
    db.flush()
    assert t.activo is True


# --------------------------------------------------------------------------
# `grupos_orientados`: nombres de grupo en texto, no FK a `grupo.id`
# --------------------------------------------------------------------------
def test_un_taller_se_orienta_a_varios_grupos(db):
    t = Taller(
        nombre="Taller de huerta", orden=1,
        grupos_orientados=["Inicial", "Preadolescentes"],
    )
    db.add(t)
    db.flush()
    db.expire(t)
    assert t.grupos_orientados == ["Inicial", "Preadolescentes"]


def test_la_orientacion_sobrevive_al_alta_del_grupo_del_ano_siguiente(db):
    """El motivo de no usar FK.

    Desde D9 (§5.18) un grupo es `(nombre, anio)` con id propio, así que
    «Inicial 2027» es una fila **distinta** de «Inicial 2026». Con `grupo_id` el
    taller quedaría atado al año en que se creó la fila y en enero habría que
    reapuntar los 14 a mano; por nombre, el alta del año siguiente no lo toca.
    """
    db.add(Grupo(nombre="Inicial", anio=2026))
    db.flush()
    t = Taller(nombre="Taller de huerta", orden=1, grupos_orientados=["Inicial"])
    db.add(t)
    db.flush()

    inicial_2027 = Grupo(nombre="Inicial", anio=2027)
    db.add(inicial_2027)
    db.flush()
    db.expire(t)

    assert t.grupos_orientados == ["Inicial"], "el taller no se tocó"
    assert inicial_2027.id != db.query(Grupo).filter_by(anio=2026).one().id
    assert db.scalars(
        select(Taller).where(Taller.grupos_orientados.any("Inicial"))
    ).all() == [t], "sigue orientado a Inicial, sea cual sea el año"


def test_un_taller_sin_orientacion_registrada_vale(db):
    """Vacío = «sin orientación registrada», el estado con que se siembran."""
    t = Taller(nombre="Educación Física", orden=1)
    db.add(t)
    db.flush()
    db.expire(t)
    assert t.grupos_orientados == []


# --------------------------------------------------------------------------
# `orden`: reordenar sin tocar el nombre
# --------------------------------------------------------------------------
def test_reordenar_no_toca_el_nombre(db):
    """«Agregar, reordenar o desactivar» — hasta acá no había con qué reordenar.

    Y como la participación se guarda por **nombre** (no por posición), mover un
    taller de lugar no puede alterar nada de lo ya registrado.
    """
    huerta = Taller(nombre="Taller de huerta", orden=1)
    cocina = Taller(nombre="Taller de cocina", orden=2)
    db.add_all([huerta, cocina])
    db.flush()

    huerta.orden, cocina.orden = 2, 1
    db.flush()

    ordenados = db.scalars(select(Taller).order_by(Taller.orden)).all()
    assert [t.nombre for t in ordenados] == ["Taller de cocina", "Taller de huerta"]
    assert {t.nombre for t in ordenados} == {"Taller de huerta", "Taller de cocina"}


# --------------------------------------------------------------------------
# El seed: idempotente y respetuoso de lo que coordinación configuró
# --------------------------------------------------------------------------
def test_el_seed_carga_los_catorce_y_es_idempotente(db):
    from app.seed_catalogos import run

    resumen = run(db, verboso=False)
    assert db.query(Taller).count() == 14
    assert [l for l in resumen if l.strip().startswith("taller")][0].strip() == (
        "taller                  14 nuevas ·   0 actualizadas"
    )

    segunda = [l for l in run(db, verboso=False) if l.strip().startswith("taller")][0]
    assert "  0 nuevas ·   0 actualizadas" in segunda, segunda


def test_el_seed_no_revive_un_taller_que_coordinacion_retiro(db):
    """La razón por la que `retirado_en` está en `solo_al_crear`.

    El seed corre en cada arranque documentado del backend. Si reescribiera
    `retirado_en`, un taller retirado por coordinación volvería al catálogo sin
    aviso — exactamente el bug que §5.2.3 quiere evitar al hacer estas filas
    parametrizables. Vale igual para `orden` y `grupos_orientados`: la fila
    entera es de la institución.
    """
    from app.seed_catalogos import run

    run(db, verboso=False)
    huerta = db.query(Taller).filter_by(nombre="Taller de huerta").one()
    huerta.retirado_en = date(2026, 6, 30)
    huerta.orden = 99
    huerta.grupos_orientados = ["Adolescentes"]
    db.flush()

    run(db, verboso=False)
    db.expire_all()

    huerta = db.query(Taller).filter_by(nombre="Taller de huerta").one()
    assert huerta.retirado_en == date(2026, 6, 30)
    assert huerta.activo is False
    assert huerta.orden == 99
    assert huerta.grupos_orientados == ["Adolescentes"]
    assert db.query(Taller).count() == 14, "tampoco lo duplicó"


# --------------------------------------------------------------------------
# `hce_taller` retirada (§5.20)
# --------------------------------------------------------------------------
def test_hce_taller_ya_no_existe():
    """Era un resto de v1: participación viva, por expediente y por `taller_id`.

    El modelo que fija la especificación es `pai_taller { pai_id, taller_nombre }`
    —por nombre y por instancia de PAI— y lo construye M12.6. Dejar los dos daba
    dos fuentes de verdad sobre en qué talleres está el NNA.
    """
    import app.models as modelos
    from app.core.database import Base
    from app.models import HceDiurna

    assert not hasattr(modelos, "HceTaller")
    assert "HceTaller" not in modelos.__all__
    assert "hce_taller" not in Base.metadata.tables
    assert not hasattr(HceDiurna, "talleres")

    with pytest.raises(ImportError):
        from app.models.identidad import HceTaller  # noqa: F401


def test_ninguna_tabla_referencia_al_catalogo_de_talleres():
    """El catálogo queda **sin FK entrantes**, que es el punto de D5.

    Si algo apuntara a `taller.id`, retirar o renombrar una fila volvería a
    arrastrar registros clínicos. La participación entra en M12.6 por nombre.
    """
    from app.core.database import Base

    apuntan = {
        f"{tabla.name}.{fk.parent.name}"
        for tabla in Base.metadata.tables.values()
        for fk in tabla.foreign_keys
        if fk.column.table.name == "taller"
    }
    assert not apuntan, apuntan
