"""Tests estructurales del esquema v2 (M11.2).

**Qué se prueba acá y qué no.** Por la decisión §5.2.2, la base de datos sólo
garantiza *integridad estructural* — las reglas clínicas viven en servicios
Python y se prueban en M11.3/M11.5. Así que este archivo verifica únicamente
que las restricciones que sí delegamos a Postgres estén realmente puestas y
funcionando: rangos, unicidad, XOR y FK.

Cada test que espera un rechazo prueba también el caso que debe pasar. Un
CHECK que rechaza todo también "pasaría" un test de rechazo.
"""
from datetime import date

import pytest
from sqlalchemy.exc import IntegrityError

from app.models import (
    Foto, Grupo, HceDiurna, Idea, InformeCierre, Persona, Protocolo,
)


# --------------------------------------------------------------------------
# Ayudas
# --------------------------------------------------------------------------
def _persona(db, ci="1.111.111-1"):
    p = Persona(nombre="Test", apellido="Prueba", ci=ci, fecha_nac=date(2015, 5, 1))
    db.add(p)
    db.flush()
    return p


def _hce(db, ci="1.111.111-1"):
    h = HceDiurna(persona_id=_persona(db, ci).id)
    db.add(h)
    db.flush()
    return h


# --------------------------------------------------------------------------
# IDEA (HCE-LB)
# --------------------------------------------------------------------------
def test_idea_acepta_total_en_rango(db):
    """0–96: 12 dimensiones × 0–8."""
    db.add(Idea(hce_id=_hce(db).id, total=58, esc_a=18, esc_b=14, esc_c=14, esc_d=12))
    db.flush()  # no debe levantar


def test_idea_rechaza_total_fuera_de_rango(db):
    db.add(Idea(hce_id=_hce(db).id, total=97))
    with pytest.raises(IntegrityError, match="rango_total"):
        db.flush()


def test_idea_admite_varias_lineas_base_por_expediente(db):
    """1:N a propósito: un reingreso a más de 12 meses abre una línea base nueva."""
    hce = _hce(db)
    db.add(Idea(hce_id=hce.id, fecha_consenso=date(2024, 3, 1), total=60))
    db.add(Idea(hce_id=hce.id, fecha_consenso=date(2026, 3, 1), total=52))
    db.flush()  # no debe levantar


# --------------------------------------------------------------------------
# Protocolo (HCE-PA / HCE-PB)
# --------------------------------------------------------------------------
def test_protocolo_acepta_a_y_b_del_mismo_anio(db):
    hce = _hce(db)
    db.add(Protocolo(hce_id=hce.id, tipo="A", anio=2026, total=60))
    db.add(Protocolo(hce_id=hce.id, tipo="B", anio=2026, total=79))
    db.flush()


def test_protocolo_rechaza_dos_a_del_mismo_anio(db):
    hce = _hce(db)
    db.add(Protocolo(hce_id=hce.id, tipo="A", anio=2026))
    db.flush()
    db.add(Protocolo(hce_id=hce.id, tipo="A", anio=2026))
    with pytest.raises(IntegrityError, match="uq_protocolo_hce_tipo_anio"):
        db.flush()


def test_protocolo_rechaza_tipo_invalido(db):
    db.add(Protocolo(hce_id=_hce(db).id, tipo="C", anio=2026))
    with pytest.raises(IntegrityError, match="tipo_valido"):
        db.flush()


def test_protocolo_rechaza_total_fuera_de_rango(db):
    """24–120: 24 ítems × 1–5. Un total de 23 es imposible."""
    db.add(Protocolo(hce_id=_hce(db).id, tipo="A", anio=2026, total=23))
    with pytest.raises(IntegrityError, match="rango_total"):
        db.flush()


def test_protocolo_a_no_puede_tener_deltas(db):
    """El delta es siempre B−A, así que un A con deltas es incoherente (§5.2)."""
    db.add(Protocolo(hce_id=_hce(db).id, tipo="A", anio=2026, deltas={"esc_1": 5}))
    with pytest.raises(IntegrityError, match="deltas_solo_en_b"):
        db.flush()


def test_protocolo_b_si_puede_tener_deltas(db):
    db.add(Protocolo(hce_id=_hce(db).id, tipo="B", anio=2026, deltas={"esc_1": 5}))
    db.flush()


# --------------------------------------------------------------------------
# Informe de cierre — corrección del bug A
# --------------------------------------------------------------------------
def test_informe_cierre_admite_uno_por_anio(db):
    """Bug A: era 0..1 en toda la vida del NNA; es anual, como el protocolo."""
    hce = _hce(db)
    db.add(InformeCierre(hce_id=hce.id, anio=2025))
    db.add(InformeCierre(hce_id=hce.id, anio=2026))
    db.flush()


def test_informe_cierre_rechaza_dos_del_mismo_anio(db):
    hce = _hce(db)
    db.add(InformeCierre(hce_id=hce.id, anio=2026))
    db.flush()
    db.add(InformeCierre(hce_id=hce.id, anio=2026))
    with pytest.raises(IntegrityError, match="uq_informe_cierre_hce_anio"):
        db.flush()


# --------------------------------------------------------------------------
# Foto — XOR individual / grupal (§8.4)
# --------------------------------------------------------------------------
def test_foto_individual_ok(db):
    db.add(Foto(hce_id=_hce(db).id, descripcion="individual"))
    db.flush()


def test_foto_grupal_ok(db):
    g = Grupo(nombre="Inicial", anio=2026)
    db.add(g)
    db.flush()
    db.add(Foto(grupo_id=g.id, descripcion="grupal"))
    db.flush()


def test_foto_rechaza_ambas_referencias(db):
    """Una foto es del NNA o del grupo: las condiciones de autorización difieren."""
    g = Grupo(nombre="Escolares", anio=2026)
    db.add(g)
    db.flush()
    db.add(Foto(hce_id=_hce(db).id, grupo_id=g.id))
    with pytest.raises(IntegrityError, match="individual_xor_grupal"):
        db.flush()


def test_foto_rechaza_sin_referencia(db):
    db.add(Foto(descripcion="huérfana"))
    with pytest.raises(IntegrityError, match="individual_xor_grupal"):
        db.flush()


# --------------------------------------------------------------------------
# Persona / HCE — corrección del bug B
# --------------------------------------------------------------------------
def test_persona_puede_existir_sin_expediente(db):
    """Bug B: era 1:1 obligatorio. Alguien puede estar sólo en Taller Terapéutico."""
    p = _persona(db)
    db.flush()
    assert p.hce is None


def test_un_solo_expediente_de_atencion_diurna_por_persona(db):
    p = _persona(db)
    db.add(HceDiurna(persona_id=p.id))
    db.flush()
    db.add(HceDiurna(persona_id=p.id))
    with pytest.raises(IntegrityError):
        db.flush()


# --------------------------------------------------------------------------
# Catálogos
# --------------------------------------------------------------------------
def test_catalogos_del_json_tienen_la_forma_esperada():
    """El JSON es la entrada del seed: si se desarma, el seed carga basura."""
    import json
    from pathlib import Path

    import app

    datos = json.loads(
        (Path(app.__file__).parent / "data" / "catalogos_iniciales.json").read_text(
            encoding="utf-8"
        )
    )
    assert len(datos["idea_dimension"]) == 12
    assert len(datos["idea_nivel"]) == 60          # 12 dimensiones × 5 niveles
    assert len(datos["ippu_item"]) == 24           # 4 escalas × 6 ítems
    assert len(datos["baremo_categoria"]) == 5
    assert len(datos["servicio"]) == 3

    # Los 5 niveles de cada dimensión son 8, 6, 4, 2, 0.
    for dim in datos["idea_dimension"]:
        valores = sorted(
            n["valor"] for n in datos["idea_nivel"] if n["dimension_id"] == dim["id"]
        )
        assert valores == [0, 2, 4, 6, 8], f"{dim['codigo']}: {valores}"

    # El baremo cubre 0–100 sin huecos ni solapamientos.
    tramos = sorted((b["pct_min"], b["pct_max"]) for b in datos["baremo_categoria"])
    assert tramos[0][0] == 0 and tramos[-1][1] == 100
    for (_, fin), (ini, _) in zip(tramos, tramos[1:]):
        assert ini == fin + 1, f"hueco o solapamiento entre {fin} y {ini}"


# --------------------------------------------------------------------------
# Seed — lo que la institución configura no se pisa al re-correrlo
# --------------------------------------------------------------------------
def test_seed_no_pisa_lo_que_configura_la_institucion(db):
    """El seed corre en cada arranque; ajustar el baremo no puede perderse.

    Los cortes del baremo y qué recordatorios están activos son datos que IPPU
    define (§0.4 y §4). Se hicieron tabla justamente para que se puedan cambiar
    sin migración — si el seed los revirtiera, esa parametrización no serviría
    de nada. Regresión de un bug real: la primera versión los pisaba.
    """
    from app.models import BaremoCategoria, Recordatorio
    from app.seed_catalogos import _sincronizar

    db.add(BaremoCategoria(
        pct_min=5, pct_max=24, categoria="Leve", rango="5 % a 24 %",
        implicancia="…", orden=2,
    ))
    db.add(Recordatorio(clave="pa", texto="Protocolo A", periodo="Julio", activo=True))
    db.flush()

    # IPPU corrige el corte y coordinación desactiva un recordatorio.
    db.query(BaremoCategoria).filter_by(categoria="Leve").one().pct_min = 6
    rec = db.query(Recordatorio).filter_by(clave="pa").one()
    rec.activo = False
    rec.periodo = "Agosto"
    db.flush()

    # Vuelve a correr el seed con los valores originales del JSON.
    _sincronizar(
        db, BaremoCategoria,
        [{"pct_min": 5, "pct_max": 24, "categoria": "Leve", "rango": "5 % a 24 %",
          "implicancia": "…", "orden": 2}],
        "categoria", ("pct_min", "pct_max"),
    )
    _sincronizar(
        db, Recordatorio,
        [{"clave": "pa", "texto": "Protocolo A", "periodo": "Julio", "activo": True}],
        "clave", ("activo", "periodo"),
    )
    db.flush()

    assert db.query(BaremoCategoria).filter_by(categoria="Leve").one().pct_min == 6
    rec = db.query(Recordatorio).filter_by(clave="pa").one()
    assert rec.activo is False
    assert rec.periodo == "Agosto"


def test_seed_si_actualiza_el_texto_de_los_instrumentos(db):
    """La contracara: el contenido del instrumento sí lo manda el JSON.

    Si IPPU reescribe un ítem de la escala, el cambio va en la demo y el seed
    tiene que propagarlo. Sin este test, «no pisar nada» sería un arreglo tan
    malo como el bug.
    """
    from app.models import IppuItem
    from app.seed_catalogos import _sincronizar

    db.add(IppuItem(id=1, escala=1, escala_nombre="Relación Social",
                    orden_en_escala=1, texto="texto viejo", referencia="ref"))
    db.flush()

    _sincronizar(
        db, IppuItem,
        [{"id": 1, "escala": 1, "escala_nombre": "Relación Social",
          "orden_en_escala": 1, "texto": "texto corregido", "referencia": "ref"}],
        "id",
    )
    db.flush()

    assert db.query(IppuItem).filter_by(id=1).one().texto == "texto corregido"


# --------------------------------------------------------------------------
# Migración
# --------------------------------------------------------------------------
def test_la_migracion_coincide_con_los_modelos():
    """Detecta el desfasaje modelos ↔ migración.

    Los tests crean las tablas desde los modelos (`create_all`), no aplicando la
    migración. Sin este chequeo, alguien puede editar un modelo y olvidarse de
    generar la migración: los tests pasarían igual y el desfasaje aparecería
    recién al desplegar.

    Estuvo salteado durante M12.1, mientras la regla de la ronda congelaba la
    migración hasta M12.8. **La enmienda §5.19 de `handoff.md` (2026-08-14) la
    derogó**: la migración inicial única se regenera al cerrar cada sub-módulo
    —sólo se congela si hay trabajo en paralelo real sobre `app/models/`— así que
    este test volvió a ser bloqueante y **ya no se saltea durante la ronda**.

    **Ya no queda ningún skip** (2026-08-15). Acá había uno de infraestructura
    —«si la base de desarrollo no está levantada no hay con qué comparar»— que
    era correcto en su intención y equivocado en su efecto: con el contenedor
    abajo la sesión entera terminaba en `34 passed, 89 skipped` y **exit 0**, o
    sea indistinguible de una corrida válida para cualquier automatización. Que
    la base esté arriba y en el head lo verifica ahora la guardia de sesión de
    `tests/conftest.py`, que **aborta** en vez de saltear. Si este test corre, es
    porque hay con qué comparar.
    """
    from alembic.autogenerate import compare_metadata
    from alembic.migration import MigrationContext
    from sqlalchemy import create_engine

    from app.core.config import settings
    from app.core.database import Base

    eng = create_engine(settings.database_url)
    try:
        with eng.connect() as conn:
            diff = compare_metadata(MigrationContext.configure(conn), Base.metadata)
    finally:
        eng.dispose()

    assert not diff, (
        "Los modelos y el esquema aplicado difieren. Regenerar la migración inicial\n"
        "única (no apilar revisiones): borrar el archivo de alembic/versions/,\n"
        "  psql -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'\n"
        "  alembic revision --autogenerate -m 'esquema v2 inicial (<sub-módulo>)'\n"
        "  alembic upgrade head && python -m app.seed_catalogos\n"
        f"Diferencias: {diff}"
    )
