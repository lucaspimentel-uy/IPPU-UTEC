"""Tests de M12.5 — HCE-INC · Inclusión educativa y social.

Mismo criterio que el resto de la ronda (§5.2.2): la base garantiza *integridad
estructural* y es lo único que se prueba acá. El tablero del área, la alerta de
los 60 días y la **segmentación de acceso** son M11.3/M11.4 y Fase 4; de ellos
acá sólo se garantiza que el dato y el índice existan.

Cada rechazo se prueba junto con su caso que sí pasa: un CHECK que rechaza todo
también «pasaría» un test de rechazo.
"""
import json
from datetime import date
from pathlib import Path

import pytest
from sqlalchemy import inspect, select
from sqlalchemy.exc import IntegrityError

import app
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
from app.models import (
    CatalogoCentroEducativo,
    EstadoInclusion,
    HceDiurna,
    Inclusion,
    InclusionBitacora,
    Persona,
    Profesional,
)

CATALOGOS = json.loads(
    (Path(app.__file__).parent / "data" / "catalogos_iniciales.json").read_text(
        encoding="utf-8"
    )
)

#: Los 7 estados del Prototipo v4 (`INC_ESTADOS`), transcritos a mano acá y en
#: ningún otro lado del código: si alguien regenera el JSON desde otra fuente o
#: edita un texto a mano, este test lo dice. Mismo recurso que `LOS_14` en
#: `test_m12_talleres.py` y `ETIQUETAS` en `test_m12_severidad.py`.
LOS_7 = [
    ("Inclusión plena", "ok"),
    ("Inclusión parcial (horario reducido)", "warn"),
    ("En adaptación", "warn"),
    ("En espera de cupo / trámite", "warn"),
    ("Desvinculado/a", "danger"),
    ("Sin escolarizar", "danger"),
    ("Sin registrar", "off"),
]


# --------------------------------------------------------------------------
# Ayudas
# --------------------------------------------------------------------------
def _hce(db, ci="5.555.555-5"):
    p = Persona(nombre="Test", apellido="Inclusion", ci=ci, fecha_nac=date(2014, 3, 2))
    db.add(p)
    db.flush()
    h = HceDiurna(persona_id=p.id)
    db.add(h)
    db.flush()
    return h


def _estados(db):
    """Los 7 estados en la sesión. `inclusion.estado` es FK contra esta tabla."""
    if db.scalar(select(EstadoInclusion).limit(1)) is None:
        db.add_all([
            EstadoInclusion(nombre=n, orden=i, semaforo=s, descripcion=f"desc {n}")
            for i, (n, s) in enumerate(LOS_7)
        ])
        db.flush()


def _ficha(db, ci="5.555.555-5", **kw):
    _estados(db)
    h = _hce(db, ci)
    inc = Inclusion(hce_id=h.id, **kw)
    db.add(inc)
    db.flush()
    return inc


def _entrada(inclusion_id, **kw):
    base = dict(
        inclusion_id=inclusion_id,
        fecha=date(2026, 5, 20),
        interlocutor="Madre",
        tema="Educativa / pedagógica",
        contenido="Se conversó sobre la adaptación al horario.",
    )
    base.update(kw)
    return InclusionBitacora(**base)


# --------------------------------------------------------------------------
# El catálogo de estados (`estado_inclusion`)
# --------------------------------------------------------------------------
def test_el_json_trae_los_siete_estados_con_su_semaforo():
    filas = {f["nombre"]: f for f in CATALOGOS["estado_inclusion"]}
    assert len(filas) == 7
    for i, (nombre, semaforo) in enumerate(LOS_7):
        assert nombre in filas, f"falta el estado {nombre!r}"
        assert filas[nombre]["semaforo"] == semaforo
        assert filas[nombre]["orden"] == i
        assert filas[nombre]["descripcion"].strip(), f"{nombre} sin descripción"


def test_el_semaforo_no_guarda_la_clase_css_del_prototipo():
    """Del prototipo se toma el vocabulario y se descarta su implementación.

    Ahí el campo es `cls:'inc-warn'` — una clase de hoja de estilos. Acá va el
    nivel semántico (`warn`): el nombre de una clase CSS no es un dato del
    dominio y ataría el modelo a una hoja de estilos que no es la nuestra.
    """
    for fila in CATALOGOS["estado_inclusion"]:
        assert not fila["semaforo"].startswith("inc-"), fila
        assert fila["semaforo"] in INCLUSION_SEMAFOROS


def test_el_catalogo_rechaza_un_semaforo_fuera_del_dominio(db):
    db.add(EstadoInclusion(nombre="Inventado", semaforo="rojo", descripcion="x"))
    with pytest.raises(IntegrityError):
        db.flush()


def test_sin_registrar_es_el_unico_estado_no_asignable(db):
    """`asignable` es derivado: el prototipo filtra «Sin registrar» del `<select>`
    porque es la ausencia de registro, no una situación que alguien elija."""
    _estados(db)
    no_asignables = [
        e.nombre for e in db.scalars(select(EstadoInclusion)) if not e.asignable
    ]
    assert no_asignables == [INCLUSION_ESTADO_INICIAL]
    # Y la versión SQL dice lo mismo, sin traer las filas a Python.
    en_sql = db.scalars(
        select(EstadoInclusion.nombre).where(~EstadoInclusion.asignable)
    ).all()
    assert list(en_sql) == [INCLUSION_ESTADO_INICIAL]


def test_asignable_no_es_una_columna(db):
    cols = {c["name"] for c in inspect(db.bind).get_columns("estado_inclusion")}
    assert "asignable" not in cols
    assert cols == {"nombre", "orden", "semaforo", "descripcion"}


# --------------------------------------------------------------------------
# El catálogo de centros educativos — nace VACÍO a propósito (§5.50)
# --------------------------------------------------------------------------
def test_el_catalogo_de_centros_se_siembra_vacio():
    """No es un olvido: es la decisión J1 aplicada a nuestra propia demo.

    El Prototipo v4 **no tiene** catálogo de centros (`centro` es texto libre) y
    los seis nombres de escuela de `demo/js/inclusion.js` son relleno nuestro.
    Sembrarlos pondría en el sistema de IPPU centros inventados por nosotros —
    el mecanismo de §5.37 con otro sujeto.
    """
    assert CATALOGOS["catalogo_centro_educativo"] == []


def test_el_catalogo_de_centros_acepta_filas_y_exige_nombre_unico(db):
    db.add(CatalogoCentroEducativo(nombre="Escuela N.º 1", tipo="Escuela común (ANEP)"))
    db.flush()
    db.add(CatalogoCentroEducativo(nombre="Escuela N.º 1"))
    with pytest.raises(IntegrityError):
        db.flush()


def test_el_catalogo_de_centros_rechaza_un_tipo_fuera_del_dominio(db):
    db.add(CatalogoCentroEducativo(nombre="Escuela X", tipo="Escuela mágica"))
    with pytest.raises(IntegrityError):
        db.flush()


# --------------------------------------------------------------------------
# La decisión central del módulo: `centro` es texto, no FK
# --------------------------------------------------------------------------
def test_la_ficha_no_tiene_fk_al_catalogo_de_centros(db):
    """Fija la decisión §5.52 (J3), que es la que un refactor futuro tocaría sin
    darse cuenta.

    Un centro educativo es una entidad **externa y de mundo abierto**: el
    catálogo no puede estar completo de antemano, y hoy además no existe pantalla
    que lo administre (`puntos-a-validar.md` §2.9). Con FK, una pantalla que
    falta se convierte en un registro clínico bloqueado.
    """
    destinos = {
        fk["referred_table"] for fk in inspect(db.bind).get_foreign_keys("inclusion")
    }
    assert "catalogo_centro_educativo" not in destinos
    assert destinos == {"hce_diurna", "estado_inclusion"}


def test_se_puede_registrar_un_centro_que_no_esta_en_el_catalogo(db):
    """El caso concreto que la decisión protege: el NNA ya entró a la escuela y
    nadie dio de alta la escuela en el catálogo."""
    assert db.scalar(select(CatalogoCentroEducativo).limit(1)) is None
    inc = _ficha(db, centro="Escuela pública N.º 87", tipo_centro="Escuela común (ANEP)")
    assert inc.centro == "Escuela pública N.º 87"


# --------------------------------------------------------------------------
# La ficha: cardinalidad, pertenencia y estado
# --------------------------------------------------------------------------
def test_un_expediente_sin_ficha_de_inclusion_es_valido(db):
    h = _hce(db)
    assert h.inclusion is None


def test_una_sola_ficha_de_inclusion_por_expediente(db):
    """0..1 hoy (§5.51). El `UNIQUE(hce_id)` es lo único que habría que quitar
    para pasar a una ficha por año lectivo."""
    inc = _ficha(db)
    db.add(Inclusion(hce_id=inc.hce_id))
    with pytest.raises(IntegrityError):
        db.flush()


def test_la_ficha_tiene_id_propio_y_la_bitacora_apunta_a_el(db):
    """Refina el patrón de `severidad_dsm` (PK = `hce_id`) para el caso en que el
    registro tiene tabla hija: con `id` propio, anualizar la ficha no toca una
    sola fila de `inclusion_bitacora`."""
    insp = inspect(db.bind)
    assert insp.get_pk_constraint("inclusion")["constrained_columns"] == ["id"]
    fk = next(
        f for f in insp.get_foreign_keys("inclusion_bitacora")
        if f["referred_table"] == "inclusion"
    )
    assert fk["referred_columns"] == ["id"]


def test_borrar_el_expediente_se_lleva_la_ficha_y_la_bitacora(db):
    """`hce_id` es **pertenencia** (§5.26): sin calificador y con CASCADE."""
    inc = _ficha(db)
    db.add(_entrada(inc.id))
    db.flush()
    hce_id, inc_id = inc.hce_id, inc.id
    db.delete(db.get(HceDiurna, hce_id))
    db.flush()
    assert db.get(Inclusion, inc_id) is None
    assert db.scalars(
        select(InclusionBitacora).where(InclusionBitacora.inclusion_id == inc_id)
    ).all() == []


def test_la_ficha_nace_en_sin_registrar(db):
    inc = _ficha(db)
    db.refresh(inc)
    assert inc.estado == INCLUSION_ESTADO_INICIAL
    assert inc.fecha_estado is None


def test_un_estado_fuera_del_catalogo_se_rechaza(db):
    _estados(db)
    h = _hce(db)
    db.add(Inclusion(hce_id=h.id, estado="Inclusión total"))
    with pytest.raises(IntegrityError):
        db.flush()


def test_no_se_puede_borrar_un_estado_en_uso(db):
    """`RESTRICT`: el vocabulario no puede desaparecer debajo de las fichas."""
    inc = _ficha(db, estado="Inclusión plena")
    db.flush()
    db.delete(db.get(EstadoInclusion, "Inclusión plena"))
    with pytest.raises(IntegrityError):
        db.flush()


def test_renombrar_un_estado_se_propaga_a_las_fichas(db):
    """`ON UPDATE CASCADE`: es la única edición que el área puede querer sobre un
    vocabulario de 7 filas, y con FK por nombre tiene que propagarse sola."""
    inc = _ficha(db, estado="En adaptación")
    estado = db.get(EstadoInclusion, "En adaptación")
    estado.nombre = "En proceso de adaptación"
    db.flush()
    db.refresh(inc)
    assert inc.estado == "En proceso de adaptación"


@pytest.mark.parametrize("valor", INCLUSION_TIPOS_CENTRO)
def test_los_diez_tipos_de_centro_se_aceptan(db, valor):
    _ficha(db, ci=f"1.111.11{INCLUSION_TIPOS_CENTRO.index(valor)}-1", tipo_centro=valor)


def test_un_tipo_de_centro_fuera_del_dominio_se_rechaza(db):
    _estados(db)
    h = _hce(db)
    db.add(Inclusion(hce_id=h.id, tipo_centro="Escuela flotante"))
    with pytest.raises(IntegrityError):
        db.flush()


@pytest.mark.parametrize("valor", INCLUSION_AT_ESTADOS)
def test_los_tres_estados_de_at_se_aceptan(db, valor):
    _ficha(db, ci=f"2.222.22{INCLUSION_AT_ESTADOS.index(valor)}-2", at=valor)


def test_at_no_es_booleano_y_admite_el_tramite_en_curso(db):
    """El tercer valor es información de gestión que un `bool` perdería."""
    assert "En trámite (lista de espera)" in INCLUSION_AT_ESTADOS
    inc = _ficha(db, at="En trámite (lista de espera)")
    assert inc.at == "En trámite (lista de espera)"


def test_at_nace_nulo_y_no_en_no(db):
    """Divergencia declarada con el prototipo, que crea la ficha en `at:'No'`.

    «No tiene acompañante» es una afirmación sobre el NNA; que un formulario en
    blanco la haga por defecto es un artefacto de UI, no un dato.
    """
    inc = _ficha(db)
    db.refresh(inc)
    assert inc.at is None


def test_un_at_fuera_del_dominio_se_rechaza(db):
    _estados(db)
    h = _hce(db)
    db.add(Inclusion(hce_id=h.id, at="Tal vez"))
    with pytest.raises(IntegrityError):
        db.flush()


def test_el_contrato_de_nombres_con_m12_6_se_mantiene(db):
    """§5.22: la sección V del PAI **lee estas tres columnas en vivo**.

    No es un test de estilo: si alguien las renombra, M12.6 mapea contra columnas
    que se movieron y la sección V del documento que se le entrega a INAU queda
    en blanco sin que nada falle.
    """
    cols = {c["name"] for c in inspect(db.bind).get_columns("inclusion")}
    assert {"centro", "modalidad", "grado"} <= cols


def test_la_ficha_no_tiene_flujo_de_firma(db):
    """Módulo abierto todo el ciclo, como HCE-SEV."""
    cols = {c["name"] for c in inspect(db.bind).get_columns("inclusion")}
    assert not {c for c in cols if "firma" in c or "firmado" in c}


# --------------------------------------------------------------------------
# La bitácora
# --------------------------------------------------------------------------
def test_la_bitacora_acepta_una_gestion_completa(db):
    inc = _ficha(db)
    db.add(_entrada(inc.id, rol="Familia", medio="WhatsApp", acuerdos="Reunión el 15/08"))
    db.flush()
    assert len(db.scalars(select(InclusionBitacora)).all()) == 1


@pytest.mark.parametrize("campo", ["interlocutor", "contenido"])
def test_los_campos_que_incadd_exige_no_pueden_ir_vacios(db, campo):
    """`incAdd` valida exactamente fecha, interlocutor y contenido."""
    inc = _ficha(db)
    db.add(_entrada(inc.id, **{campo: "   "}))
    with pytest.raises(IntegrityError):
        db.flush()


def test_la_fecha_de_la_gestion_es_obligatoria(db):
    inc = _ficha(db)
    db.add(_entrada(inc.id, fecha=None))
    with pytest.raises(IntegrityError):
        db.flush()


@pytest.mark.parametrize("campo,valores", [("rol", INCLUSION_ROLES), ("medio", INCLUSION_MEDIOS)])
def test_rol_y_medio_son_opcionales_pero_acotados(db, campo, valores):
    """Opcionales porque `incAdd` no los exige —el `<select>` preseleccionado es
    un artefacto del widget—, y acotados porque el módulo existe para dar
    indicadores del área: con texto libre «WhatsApp» y «wsp» son dos categorías.
    """
    inc = _ficha(db)
    db.add(_entrada(inc.id, **{campo: None}))
    db.flush()
    for v in valores:
        db.add(_entrada(inc.id, **{campo: v}))
    db.flush()
    db.add(_entrada(inc.id, **{campo: "Telepatía"}))
    with pytest.raises(IntegrityError):
        db.flush()


def test_el_tema_es_obligatorio(db):
    """La única obligación que el módulo agrega sobre lo que valida el prototipo.

    Con `tema` NULL la derivación de `sensible` devolvería «no sensible» —el
    valor peligroso— por omisión y no por decisión.
    """
    inc = _ficha(db)
    db.add(_entrada(inc.id, tema=None))
    with pytest.raises(IntegrityError):
        db.flush()


@pytest.mark.parametrize("valor", INCLUSION_TEMAS)
def test_los_cinco_temas_se_aceptan(db, valor):
    inc = _ficha(db, ci=f"3.333.33{INCLUSION_TEMAS.index(valor)}-3")
    db.add(_entrada(inc.id, tema=valor))
    db.flush()


def test_un_tema_fuera_del_dominio_se_rechaza(db):
    inc = _ficha(db)
    db.add(_entrada(inc.id, tema="Salud mental"))
    with pytest.raises(IntegrityError):
        db.flush()


def test_borrar_la_ficha_se_lleva_su_bitacora(db):
    inc = _ficha(db)
    db.add(_entrada(inc.id))
    db.flush()
    inc_id = inc.id
    db.delete(inc)
    db.flush()
    assert db.scalars(
        select(InclusionBitacora).where(InclusionBitacora.inclusion_id == inc_id)
    ).all() == []


def test_el_autor_es_opcional_y_debe_existir_si_se_pone(db):
    inc = _ficha(db)
    db.add(_entrada(inc.id, autor_id=None))
    db.flush()
    db.add(_entrada(inc.id, autor_id=999999))
    with pytest.raises(IntegrityError):
        db.flush()


def test_la_fecha_de_la_gestion_y_la_de_registro_son_columnas_distintas(db):
    """Como `ateneo.fecha` frente a `anio_correlativo`: cuándo pasó ≠ cuándo se
    tipeó. Una gestión del viernes cargada el lunes conserva la del viernes."""
    inc = _ficha(db)
    e = _entrada(inc.id, fecha=date(2026, 5, 20))
    db.add(e)
    db.flush()
    db.refresh(e)
    assert e.fecha == date(2026, 5, 20)
    assert e.registrado_en is not None
    assert e.registrado_en.date() != date(2026, 5, 20)


# --------------------------------------------------------------------------
# `sensible` — derivado, nunca capturado
# --------------------------------------------------------------------------
def test_sensible_no_es_una_columna(db):
    """Un booleano guardado al lado del tema se desincroniza en cuanto alguien
    corrige el tema, y acá la respuesta equivocada expone información familiar
    grave junto al dato escolar."""
    cols = {c["name"] for c in inspect(db.bind).get_columns("inclusion_bitacora")}
    assert "sensible" not in cols


def test_sensible_se_deriva_del_tema(db):
    inc = _ficha(db)
    sens = _entrada(inc.id, tema=INCLUSION_TEMA_SENSIBLE)
    normal = _entrada(inc.id, tema="Trámite o gestión")
    db.add_all([sens, normal])
    db.flush()
    assert sens.sensible is True
    assert normal.sensible is False


def test_corregir_el_tema_cambia_sensible_sin_tocar_nada_mas(db):
    """La propiedad que compra la derivación: no hay segundo campo que actualizar."""
    inc = _ficha(db)
    e = _entrada(inc.id, tema="Familiar / social")
    db.add(e)
    db.flush()
    assert e.sensible is False
    e.tema = INCLUSION_TEMA_SENSIBLE
    db.flush()
    assert e.sensible is True


def test_sensible_se_puede_filtrar_en_sql(db):
    """Requisito concreto de la Fase 4: `WHERE NOT sensible` tiene que resolverse
    en la base. Un filtro de acceso aplicado después de leer ya leyó lo que no
    debía."""
    inc = _ficha(db)
    db.add_all([
        _entrada(inc.id, tema=INCLUSION_TEMA_SENSIBLE, contenido="reservado"),
        _entrada(inc.id, tema="Educativa / pedagógica", contenido="escolar"),
    ])
    db.flush()
    visibles = db.scalars(
        select(InclusionBitacora.contenido).where(~InclusionBitacora.sensible)
    ).all()
    assert list(visibles) == ["escolar"]
    reservadas = db.scalars(
        select(InclusionBitacora.contenido).where(InclusionBitacora.sensible)
    ).all()
    assert list(reservadas) == ["reservado"]


def test_el_tema_sensible_es_el_del_prototipo():
    """`sensible: tema === 'Clínica — sensible'` (`incAdd` del Prototipo v4).

    El guion es **raya** (—), no guion medio: si alguien lo normaliza, la
    derivación deja de encontrar el tema y todas las entradas pasan a no
    sensibles en silencio.
    """
    assert INCLUSION_TEMA_SENSIBLE == "Clínica — sensible"
    assert INCLUSION_TEMA_SENSIBLE in INCLUSION_TEMAS


# --------------------------------------------------------------------------
# Los CHECK no pueden divergir de las constantes (recurso de M12.7)
# --------------------------------------------------------------------------
@pytest.mark.parametrize(
    "tabla,columna,constante",
    [
        ("inclusion", "tipo_centro", INCLUSION_TIPOS_CENTRO),
        ("inclusion", "at", INCLUSION_AT_ESTADOS),
        ("catalogo_centro_educativo", "tipo", INCLUSION_TIPOS_CENTRO),
        ("inclusion_bitacora", "tema", INCLUSION_TEMAS),
        ("inclusion_bitacora", "rol", INCLUSION_ROLES),
        ("inclusion_bitacora", "medio", INCLUSION_MEDIOS),
    ],
)
def test_el_check_y_la_constante_no_pueden_divergir(db, tabla, columna, constante):
    """Con la lista escrita dos veces, corregir un valor en la constante y no en
    la DDL deja la base aceptando algo que el código considera inválido."""
    checks = {
        c["name"]: c["sqltext"] for c in inspect(db.bind).get_check_constraints(tabla)
    }
    sql = next(v for k, v in checks.items() if k.endswith(f"{columna}_valido"))
    for valor in constante:
        assert f"'{valor}'" in sql, f"{valor!r} no está en el CHECK de {tabla}.{columna}"


def test_el_catalogo_de_estados_y_la_constante_del_inicial_coinciden():
    nombres = {f["nombre"] for f in CATALOGOS["estado_inclusion"]}
    assert INCLUSION_ESTADO_INICIAL in nombres


# --------------------------------------------------------------------------
# Índices que el tablero del área necesita (el cálculo es M11.3/M11.4)
# --------------------------------------------------------------------------
def test_los_indices_del_tablero_existen(db):
    """El plan pide índices sobre `estado` y `fecha_estado`; el par
    `(inclusion_id, fecha)` es la columna «última gestión» y la alerta de los 60
    días, que son un `max(fecha)` por ficha."""
    insp = inspect(db.bind)
    cols_inc = {tuple(i["column_names"]) for i in insp.get_indexes("inclusion")}
    assert ("estado",) in cols_inc
    assert ("fecha_estado",) in cols_inc
    cols_bit = {tuple(i["column_names"]) for i in insp.get_indexes("inclusion_bitacora")}
    assert ("inclusion_id", "fecha") in cols_bit
    assert ("tema",) in cols_bit


def test_el_catalogo_de_centros_no_tiene_fk_entrantes(db):
    """Mismo criterio que `taller` (M12.3) y `severidad_nivel` (M12.4): el dato
    primario se guarda directo y el catálogo es referencia."""
    insp = inspect(db.bind)
    entrantes = [
        f"{t}.{fk['constrained_columns']}"
        for t in insp.get_table_names()
        for fk in insp.get_foreign_keys(t)
        if fk["referred_table"] == "catalogo_centro_educativo"
    ]
    assert entrantes == []
