"""Tests estructurales de M12.1 — absorción del Prototipo v4.

Mismo criterio que `test_esquema_v2.py`: acá sólo se prueba lo que la base
garantiza (rangos, unicidad, CHECK) y la **forma del JSON de catálogos**, que es
la entrada del seed. Las reglas clínicas son M11.3.

Cada test que espera un rechazo prueba también el caso que debe pasar.
"""
import json
import re
from pathlib import Path

import pytest
from sqlalchemy.exc import IntegrityError

import app
from app.models import Auditoria, BandaIdea, DeltaInterpretacion, Grupo, IdeaEjemplo

CATALOGOS = json.loads(
    (Path(app.__file__).parent / "data" / "catalogos_iniciales.json").read_text(
        encoding="utf-8"
    )
)


# --------------------------------------------------------------------------
# D9 — `grupo` con id propio y UNIQUE(nombre, anio)
# --------------------------------------------------------------------------
def test_el_mismo_grupo_puede_existir_en_dos_anios(db):
    """El punto de D9 (§5.18).

    Antes la PK era la letra, así que un grupo existía una sola vez en toda la
    historia: crear el de 2027 obligaba a sobrescribir el de 2026 —se perdía
    quiénes fueron sus técnicos— y los expedientes de 2026 pasaban a apuntar al
    grupo nuevo sin aviso.
    """
    db.add(Grupo(nombre="Inicial", anio=2026, tecnico1_rol="Psicólogo/a"))
    db.add(Grupo(nombre="Inicial", anio=2027, tecnico1_rol="Maestro/a"))
    db.flush()  # no debe levantar

    filas = db.query(Grupo).filter_by(nombre="Inicial").all()
    assert len(filas) == 2
    assert len({g.id for g in filas}) == 2, "cada año tiene su propia fila, con id propio"


def test_grupo_rechaza_dos_filas_del_mismo_nombre_y_anio(db):
    """La contracara: el UNIQUE existe para que no haya dos «Inicial 2026»."""
    db.add(Grupo(nombre="Inicial", anio=2026))
    db.flush()
    db.add(Grupo(nombre="Inicial", anio=2026))
    with pytest.raises(IntegrityError, match="uq_grupo_nombre_anio"):
        db.flush()


def test_grupos_distintos_del_mismo_anio_conviven(db):
    db.add(Grupo(nombre="Escolares", anio=2026))
    db.add(Grupo(nombre="Preadolescentes", anio=2026))
    db.flush()


def test_el_seed_trae_los_cinco_grupos_reales():
    """Los cuatro nombres por color eran datos de demostración; los reales de
    IPPU son cinco (§5.37, ejecución fijada en §5.61)."""
    nombres = {g["nombre"] for g in CATALOGOS["grupo"]}
    assert nombres == {
        "Inicial", "Escolares", "Preadolescentes", "Adolescentes",
        "Taller de Adolescentes",
    }
    assert all(isinstance(g["anio"], int) for g in CATALOGOS["grupo"])


def test_el_seed_no_pisa_un_grupo_ya_configurado(db):
    """`grupo` es insert-only: coordinación es dueña de la fila entera.

    Quiénes son los técnicos de un grupo no puede venir de un archivo del repo,
    y con granularidad anual esa fila es el único registro de quién estuvo a
    cargo ese año (§5.18).
    """
    from app.seed_catalogos import _sincronizar

    db.add(Grupo(nombre="Inicial", anio=2026))
    db.flush()
    g = db.query(Grupo).filter_by(nombre="Inicial", anio=2026).one()
    g.tecnico1_rol = "Psicóloga"
    g.dias = "Lunes a jueves"
    db.flush()

    nuevas, act = _sincronizar(
        db, Grupo, [{"nombre": "Inicial", "anio": 2026}], ("nombre", "anio"),
        solo_insertar=True,
    )
    db.flush()

    assert (nuevas, act) == (0, 0)
    g = db.query(Grupo).filter_by(nombre="Inicial", anio=2026).one()
    assert g.tecnico1_rol == "Psicóloga"
    assert g.dias == "Lunes a jueves"


# --------------------------------------------------------------------------
# D4 — las 6 bandas del IDEA
# --------------------------------------------------------------------------
def test_las_seis_bandas_cubren_0_96_sin_huecos():
    bandas = sorted(CATALOGOS["banda_idea"], key=lambda b: b["orden"])
    assert len(bandas) == 6
    assert bandas[0]["total_min"] == 0
    assert bandas[-1]["total_max"] == 96
    for previa, siguiente in zip(bandas, bandas[1:]):
        assert siguiente["total_min"] == previa["total_max"] + 1, (
            f"hueco o solapamiento entre {previa['perfil']} y {siguiente['perfil']}"
        )


@pytest.mark.parametrize(
    ("total", "perfil"),
    [
        (0, "Muy leve"),
        (15, "Muy leve"),
        (16, "Leve"),
        (90, "Moderado a severo (alta necesidad de apoyo)"),
        (91, "Severo a muy severo (necesidad de apoyo muy sustancial)"),
        (96, "Severo a muy severo (necesidad de apoyo muy sustancial)"),
    ],
)
def test_los_bordes_de_las_bandas_caen_donde_corresponde(total, perfil):
    """Los bordes son donde un corte mal copiado se nota, y el único lugar
    donde el cambio de 3 a 6 tramos (D4) puede pasar inadvertido."""
    calzan = [
        b for b in CATALOGOS["banda_idea"] if b["total_min"] <= total <= b["total_max"]
    ]
    assert len(calzan) == 1, f"total {total} cae en {len(calzan)} bandas"
    assert calzan[0]["perfil"] == perfil


def test_banda_idea_rechaza_un_tramo_invertido(db):
    db.add(BandaIdea(total_min=30, total_max=10, perfil="X", nivel_dsm="Nivel 1",
                     texto="…", orden=1))
    with pytest.raises(IntegrityError, match="min_menor_que_max"):
        db.flush()


def test_banda_idea_acepta_un_tramo_valido(db):
    db.add(BandaIdea(total_min=0, total_max=15, perfil="Muy leve", nivel_dsm="Nivel 1",
                     texto="…", orden=1))
    db.flush()


def test_el_texto_de_las_bandas_es_neutro():
    """«Neutralidad metodológica»: el texto alude a escalas y dimensiones del
    IDEA y **no prescribe abordajes** (§5.13). Se copia tal cual del prototipo;
    reescribirlo rompe esa propiedad, así que el test la fija."""
    for banda in CATALOGOS["banda_idea"]:
        assert "IDEA" in banda["texto"], banda["perfil"]


# --------------------------------------------------------------------------
# Interpretación del Δ — la alerta institucional sale del catálogo
# --------------------------------------------------------------------------
def test_la_alerta_del_delta_se_deriva_del_catalogo():
    """Antes Δ ≤ −7 era un número suelto en el código; ahora es una fila."""
    tramos = CATALOGOS["delta_interpretacion"]
    assert len(tramos) == 6

    con_alerta = [t for t in tramos if t["alerta"]]
    assert len(con_alerta) == 1, "una sola banda dispara la alerta institucional"
    assert con_alerta[0]["delta_max"] == -7, "el corte sigue siendo Δ ≤ −7"
    assert con_alerta[0]["delta_min"] is None, "el tramo no tiene piso"
    assert con_alerta[0]["signo"] == "negativo"


def test_los_tramos_del_delta_no_dejan_huecos():
    tramos = sorted(CATALOGOS["delta_interpretacion"], key=lambda t: t["orden"])
    assert tramos[0]["delta_max"] is None, "el primer tramo no tiene techo"
    for previo, siguiente in zip(tramos, tramos[1:]):
        assert siguiente["delta_max"] == previo["delta_min"] - 1, (
            f"hueco entre {previo['etiqueta']} y {siguiente['etiqueta']}"
        )


def test_delta_interpretacion_rechaza_un_signo_invalido(db):
    db.add(DeltaInterpretacion(delta_min=1, delta_max=6, etiqueta="X", accion="…",
                               signo="d-pos", orden=1))
    with pytest.raises(IntegrityError, match="signo_valido"):
        db.flush()


def test_delta_interpretacion_acepta_un_tramo_abierto(db):
    db.add(DeltaInterpretacion(delta_min=None, delta_max=-7, etiqueta="Regresión significativa",
                               accion="…", signo="negativo", alerta=True, orden=6))
    db.flush()


def test_delta_interpretacion_rechaza_un_tramo_sin_limites(db):
    """Sin piso ni techo, el tramo abarcaría todo y taparía a los otros cinco."""
    db.add(DeltaInterpretacion(delta_min=None, delta_max=None, etiqueta="X", accion="…",
                               signo="neutro", orden=1))
    with pytest.raises(IntegrityError, match="tramo_no_vacio"):
        db.flush()


# --------------------------------------------------------------------------
# Catálogos IDEA nuevos y los 60 descriptores que NO se reemplazan
# --------------------------------------------------------------------------
def test_los_catalogos_idea_nuevos_estan_completos():
    assert len(CATALOGOS["idea_ficha"]) == 12
    assert len(CATALOGOS["idea_ejemplo"]) == 48      # 12 dimensiones × 4 niveles
    assert len(CATALOGOS["idea_regla"]) == 9
    assert {f["codigo"] for f in CATALOGOS["idea_ficha"]} == {
        f"IDEA-D{i:02d}" for i in range(1, 13)
    }


def test_los_ejemplos_cubren_solo_los_niveles_8_6_4_2():
    """El prototipo no trae ejemplo del nivel 0 y no se inventa uno: 0 es «sin
    trastorno cualitativo», que no tiene ilustración clínica que dar."""
    por_dim: dict[int, set[int]] = {}
    for e in CATALOGOS["idea_ejemplo"]:
        por_dim.setdefault(e["dimension_id"], set()).add(e["valor"])
    assert len(por_dim) == 12
    assert all(v == {2, 4, 6, 8} for v in por_dim.values())


def test_idea_ejemplo_rechaza_el_nivel_cero(db):
    db.add(IdeaEjemplo(dimension_id=1, valor=0, ejemplo="…"))
    with pytest.raises(IntegrityError, match="nivel_con_ejemplo"):
        db.flush()


def test_los_60_descriptores_oficiales_siguen_intactos():
    """M12.1 decidió **no reemplazarlos** por los del Prototipo v4.

    El diff de M12.0 mostró que 59 de 60 difieren textualmente pero ninguno por
    corrimiento de niveles: los nuestros son el texto literal de la fuente
    oficial (Rivière, 1997/2002) y los del prototipo, paráfrasis condensadas de
    los mismos niveles. El corrimiento que el prototipo declara haber corregido
    es contra una «Guía del aplicador» interna de IPPU que nunca tuvimos.

    La versión corta entra **al lado**, como `descriptor_breve`, nunca encima.
    """
    niveles = CATALOGOS["idea_nivel"]
    assert len(niveles) == 60
    assert all(n["descriptor"] for n in niveles), "el oficial nunca queda vacío"
    assert all(n.get("descriptor_breve") for n in niveles), "los 60 tienen versión corta"

    # 59 de 60 difieren; el único que coincide es D11/8 («Ausencia completa de
    # conductas de imitación»), que es tan corto que la paráfrasis del prototipo
    # dio igual al literal. Si esta cuenta subiera, alguien copió los del
    # prototipo encima de los oficiales.
    iguales = [
        (n["dimension_id"], n["valor"])
        for n in niveles if n["descriptor"] == n["descriptor_breve"]
    ]
    assert iguales == [(11, 8)], f"coincidencias inesperadas: {iguales}"

    d1_n8 = next(n for n in niveles if n["dimension_id"] == 1 and n["valor"] == 8)
    assert d1_n8["descriptor"].startswith("Aislamiento completo. No apego"), (
        "el texto literal de Rivière para D1/8"
    )


def test_las_dimensiones_tienen_el_resumen_de_una_linea():
    assert all(d.get("que_evalua") for d in CATALOGOS["idea_dimension"])


# --------------------------------------------------------------------------
# Recordatorios — de 4 a 8, ninguno bloqueante
# --------------------------------------------------------------------------
def test_los_ocho_recordatorios_estan_y_no_se_pisaron_los_cuatro_viejos():
    claves = [r["clave"] for r in CATALOGOS["recordatorio"]]
    assert len(claves) == len(set(claves)) == 8
    assert {"lb", "pa", "pb", "ic"} <= set(claves), "los 4 del flujo siguen"
    assert {"ayex", "vf", "inc", "inau"} <= set(claves), "los 4 de vencimiento"
    assert all(r["periodo"] for r in CATALOGOS["recordatorio"])


# --------------------------------------------------------------------------
# Vocabulario institucional (§8.1)
# --------------------------------------------------------------------------
def test_ningun_catalogo_dice_grave():
    """«Grave» describe a la persona; «severo» describe la intensidad del apoyo
    que necesita, que es lo que el instrumento mide. La regla vale para todo
    texto del repo, y acá se fija donde más caro sale romperla: los catálogos,
    que se muestran tal cual al equipo técnico."""
    prohibido = re.compile(r"\bgrave(s|mente)?\b", re.IGNORECASE)
    encontrados = [
        (seccion, texto)
        for seccion, filas in CATALOGOS.items()
        if isinstance(filas, list)
        for fila in filas
        for texto in fila.values()
        if isinstance(texto, str) and prohibido.search(texto)
    ]
    assert not encontrados, f"vocabulario prohibido (§8.1): {encontrados}"


def test_la_cita_de_riviere_lleva_las_dos_ediciones():
    """«1997/2002» en todo el repo: la edición de 2002 es la que circula."""
    solo_1997 = re.compile(r"Rivi[èe]re[^)]*\(1997\)")
    for regla in CATALOGOS["idea_regla"]:
        assert not (regla["fuente"] and solo_1997.search(regla["fuente"])), regla


# --------------------------------------------------------------------------
# El seed completo, de punta a punta
# --------------------------------------------------------------------------
def test_el_seed_completo_carga_y_es_idempotente(db):
    """Corre el seed entero dos veces sobre una base vacía.

    Es la verificación §5.2 del plan M12 llevada a pytest: la segunda corrida
    tiene que dar **0 nuevas y 0 actualizadas** en todas las tablas. Sin esto,
    que el seed sea idempotente es una afirmación del docstring y nada más — y
    el seed corre en cada arranque documentado del backend.
    """
    from app.models import IdeaDimension, IdeaFicha, IdeaNivel
    from app.seed_catalogos import run

    run(db, verboso=False)

    assert db.query(IdeaDimension).count() == 12
    assert db.query(IdeaNivel).count() == 60
    assert db.query(IdeaFicha).count() == 12
    assert db.query(IdeaEjemplo).count() == 48
    assert db.query(BandaIdea).count() == 6
    assert db.query(DeltaInterpretacion).count() == 6
    assert db.query(Grupo).count() == 5

    segunda = run(db, verboso=False)
    for linea in segunda:
        assert "  0 nuevas ·   0 actualizadas" in linea, linea


def test_el_seed_no_pisa_los_cortes_de_las_bandas(db):
    """Los cortes son de la institución (D6): correr el seed no los revierte.

    Misma regresión que ya cubre el baremo en `test_esquema_v2.py`; las bandas
    del IDEA son de la misma clase y se agregaron en esta ronda.
    """
    from app.seed_catalogos import run

    run(db, verboso=False)
    banda = db.query(BandaIdea).filter_by(orden=1).one()
    banda.total_max = 18                      # IPPU corre el primer corte
    texto_original = banda.texto
    banda.texto = "texto pisado a mano"       # esto sí lo manda el JSON
    db.flush()

    run(db, verboso=False)
    banda = db.query(BandaIdea).filter_by(orden=1).one()
    assert banda.total_max == 18, "el corte es de la institución: no se pisa"
    assert banda.texto == texto_original, "el texto neutro sí lo manda la fuente"


# --------------------------------------------------------------------------
# Metadatos de migración y auditoría a nivel campo
# --------------------------------------------------------------------------
def test_auditoria_registra_el_cambio_de_un_campo(db):
    """Con granularidad anual del grupo (D9), un cambio de técnico a mitad de
    año sobrescribe la fila: el valor anterior sólo sobrevive acá."""
    reg = Auditoria(
        hce_id=None, modulo="grupo", tipo="edicion", campo="tecnico1_id",
        valor_ant="3", valor_nuevo="7", detalle="Inicial 2026",
    )
    db.add(reg)
    db.flush()
    assert reg.id is not None


def test_auditoria_sigue_rechazando_un_tipo_invalido(db):
    db.add(Auditoria(hce_id=None, tipo="borrado"))
    with pytest.raises(IntegrityError, match="tipo_valido"):
        db.flush()


def test_los_metadatos_de_origen_son_opcionales(db):
    """Un registro creado en el sistema nuevo deja `sistema_origen` en NULL, y
    eso es exactamente «este dato nació acá»."""
    from datetime import date

    from app.models import Persona

    p = Persona(nombre="Test", apellido="Migrado", ci="9.999.999-9",
                fecha_nac=date(2014, 2, 2))
    db.add(p)
    db.flush()
    assert p.sistema_origen is None

    p.sistema_origen = "HCE anterior IPPU"
    p.fecha_original = date(2019, 3, 1)
    p.fecha_migracion = date(2026, 8, 14)
    p.responsable_migracion = "Coordinación IPPU"
    db.flush()
