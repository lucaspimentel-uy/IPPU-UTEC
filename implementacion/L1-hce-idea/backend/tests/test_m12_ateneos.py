"""Tests de M12.7 — Ateneos clínicos y jornadas de capacitación.

Mismo criterio que el resto de la ronda (§5.2.2): la base garantiza *integridad
estructural* y es lo único que se prueba acá. Lo que es cross-table —«una
jornada no lleva acuerdos», la coherencia `fecha` ↔ `grupo.anio`— y lo que es
obligación clínica de contenido son **guards de M11.3**, anotados en
`backend/docs/esquema-datos-v2.md` §4. Los casos que hoy la base deja pasar se
fijan igual con un test, para que el hueco esté escrito y no se descubra por
sorpresa (misma práctica que `test_ns_contra_numero_no_produce_diferencia_
numerica` en M12.2).

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
from app.core.constantes import ATENEO_CODIGO_PREFIJO, ATENEO_TIPOS
from app.models import (
    Ateneo, AteneoAcuerdo, CategoriaDocumento, Documento, Grupo, HceDiurna,
    Persona, Profesional,
)
from app.models.ateneo import CAMPOS_DESARROLLO_CLINICO, CAMPOS_JORNADA

CATALOGOS = json.loads(
    (Path(app.__file__).parent / "data" / "catalogos_iniciales.json").read_text(
        encoding="utf-8"
    )
)

#: Los 4 tipos del Prototipo v4 (`AT_TIPOS`), transcritos a mano acá y en ningún
#: otro lado del código. Mismo recurso que `LOS_14` en `test_m12_talleres.py` y
#: `ETIQUETAS` en `test_m12_severidad.py`: si alguien edita la constante, este
#: archivo lo dice.
TIPOS = {
    "clinico": "Ateneo clínico (NNA)",
    "grupo": "Ateneo de grupo",
    "institucional": "Ateneo institucional",
    "jornada": "Jornada de capacitación",
}

#: Los tres tipos que **no** admiten NNA referido.
SIN_NNA = ("grupo", "institucional", "jornada")

#: Formas de «texto que no es texto»: el prototipo crea los 17 campos en `''`.
#: `'\t'` y `'\n'` están porque `btrim()` sin argumentos recorta **sólo
#: espacios** — el defecto que M12.4 dejó documentado.
EN_BLANCO = ("", "   ", "\t", "\n", " \t\n ")


# --------------------------------------------------------------------------
# Ayudas
# --------------------------------------------------------------------------
def _hce(db, ci="7.777.777-7"):
    p = Persona(nombre="Test", apellido="Ateneo", ci=ci, fecha_nac=date(2015, 5, 1))
    db.add(p)
    db.flush()
    h = HceDiurna(persona_id=p.id)
    db.add(h)
    db.flush()
    return h


def _grupo(db, nombre="Escolares", anio=2026):
    g = Grupo(nombre=nombre, anio=anio)
    db.add(g)
    db.flush()
    return g


def _profesional(db, email="ateneo@ippu.test"):
    pro = Profesional(nombre=email, email=email)
    db.add(pro)
    db.flush()
    return pro


_CONTADOR = {"n": 0}


def _ateneo(db, tipo="institucional", *, flush=True, **campos):
    """Un ateneo válido del tipo pedido, con las referencias mínimas que exige.

    El correlativo se autoincrementa acá y **no** en el modelo: su asignación es
    de M11.3 a propósito (C7), así que los tests la explicitan.
    """
    _CONTADOR["n"] += 1
    datos = {
        "anio_correlativo": 2026,
        "numero": _CONTADOR["n"],
        "tipo": tipo,
        "fecha": date(2026, 4, 16),
        "titulo": "Ateneo de prueba",
    }
    if tipo == "clinico" and "hce_referida_id" not in campos:
        datos["hce_referida_id"] = _hce(db, ci=f"7.777.{_CONTADOR['n']:03d}-7").id
    if tipo == "grupo" and "grupo_id" not in campos:
        datos["grupo_id"] = _grupo(db, anio=2000 + _CONTADOR["n"] % 100).id
    datos.update(campos)
    a = Ateneo(**datos)
    db.add(a)
    if flush:
        db.flush()
    return a


def _categoria(db):
    c = db.scalars(select(CategoriaDocumento).limit(1)).first()
    if c is None:
        c = CategoriaDocumento(nombre="Otro", orden=99)
        db.add(c)
        db.flush()
    return c


def _documento(db, **campos):
    datos = {
        "categoria_id": _categoria(db).id,
        "nombre": "adjunto.pdf",
        "fecha_carga": date(2026, 4, 16),
    }
    datos.update(campos)
    d = Documento(**datos)
    db.add(d)
    return d


# ==========================================================================
# A · Tipo: dominio cerrado
# ==========================================================================
@pytest.mark.parametrize("tipo", sorted(TIPOS))
def test_los_cuatro_tipos_validos_se_guardan(db, tipo):
    a = _ateneo(db, tipo)
    assert db.scalars(select(Ateneo).where(Ateneo.id == a.id)).one().tipo == tipo


def test_un_tipo_fuera_del_dominio_se_rechaza(db):
    with pytest.raises(IntegrityError):
        _ateneo(db, "familia")


def test_el_check_y_la_constante_no_pueden_divergir(db):
    """El modo de falla que justifica que `AT_TIPOS` sea constante y no catálogo.

    Si `ATENEO_TIPOS` gana una clave y los CHECK no se tocan, el tipo nuevo cae
    **fuera de las cinco reglas de obligación/prohibición**: la fila se guardaría
    sin sujeto y con los dos bloques de contenido a la vez. Como constante, esto
    es un cambio de código revisado; como catálogo editable habría sido un
    INSERT que nadie ve. Este test es el que hace ruido.
    """
    assert set(ATENEO_TIPOS) == set(TIPOS)
    for clave in ATENEO_TIPOS:
        _ateneo(db, clave)   # cada clave de la constante pasa el CHECK


def test_las_etiquetas_son_las_del_prototipo():
    assert ATENEO_TIPOS == TIPOS


# ==========================================================================
# B · Los 5 CHECK de tipo, en las dos direcciones
# ==========================================================================
def test_el_ateneo_clinico_exige_nna(db):
    with pytest.raises(IntegrityError):
        _ateneo(db, "clinico", hce_referida_id=None)


def test_el_ateneo_clinico_con_nna_pasa(db):
    a = _ateneo(db, "clinico")
    assert a.hce_referida_id is not None


@pytest.mark.parametrize("tipo", SIN_NNA)
def test_un_ateneo_no_clinico_con_nna_se_rechaza(db, tipo):
    hce = _hce(db, ci=f"7.111.11{SIN_NNA.index(tipo)}-1")
    with pytest.raises(IntegrityError):
        _ateneo(db, tipo, hce_referida_id=hce.id)


@pytest.mark.parametrize("tipo", SIN_NNA)
def test_un_ateneo_no_clinico_sin_nna_pasa(db, tipo):
    assert _ateneo(db, tipo).hce_referida_id is None


def test_el_ateneo_de_grupo_exige_grupo(db):
    with pytest.raises(IntegrityError):
        _ateneo(db, "grupo", grupo_id=None)


def test_el_ateneo_de_grupo_con_grupo_pasa(db):
    assert _ateneo(db, "grupo").grupo_id is not None


def test_el_ateneo_clinico_no_exige_grupo(db):
    """Desviación deliberada del `req` del prototipo.

    `hce_diurna.grupo_id` es nullable: exigirlo impediría registrar un ateneo
    clínico sobre un NNA sin grupo asignado. Bloquear el registro de trabajo
    clínico real por un hueco administrativo es peor que perder un filtro.
    """
    assert _ateneo(db, "clinico").grupo_id is None


def test_el_ateneo_clinico_admite_grupo(db):
    """La otra mitad: el grupo es **contexto** del ateneo clínico, y se guarda
    porque es un dato del hecho (el grupo **de ese año**, D9), no una copia de la
    situación actual del NNA."""
    g = _grupo(db, "Inicial", 2025)
    assert _ateneo(db, "clinico", grupo_id=g.id).grupo_id == g.id


@pytest.mark.parametrize("tipo", ("institucional", "jornada"))
def test_institucional_y_jornada_no_admiten_grupo(db, tipo):
    g = _grupo(db, f"Adolescentes {tipo}", 2026)
    with pytest.raises(IntegrityError):
        _ateneo(db, tipo, grupo_id=g.id)


@pytest.mark.parametrize("campo", CAMPOS_JORNADA)
def test_los_campos_de_jornada_no_van_en_un_ateneo(db, campo):
    with pytest.raises(IntegrityError):
        _ateneo(db, "institucional", **{campo: "Equipo técnico interno"})


@pytest.mark.parametrize("campo", CAMPOS_JORNADA)
def test_los_campos_de_jornada_van_en_la_jornada(db, campo):
    a = _ateneo(db, "jornada", **{campo: "Equipo técnico interno"})
    assert getattr(a, campo) == "Equipo técnico interno"


@pytest.mark.parametrize("campo", CAMPOS_DESARROLLO_CLINICO)
def test_el_desarrollo_clinico_no_va_en_una_jornada(db, campo):
    with pytest.raises(IntegrityError):
        _ateneo(db, "jornada", **{campo: "Meseta en regulación emocional"})


@pytest.mark.parametrize("campo", CAMPOS_DESARROLLO_CLINICO)
def test_el_desarrollo_clinico_va_en_un_ateneo(db, campo):
    a = _ateneo(db, "clinico", **{campo: "Meseta en regulación emocional"})
    assert getattr(a, campo) == "Meseta en regulación emocional"


# ==========================================================================
# C · Vacío vs NULL — lo que motivó `~ '[^[:space:]]'` en vez de `num_nonnulls`
# ==========================================================================
@pytest.mark.parametrize("blanco", EN_BLANCO)
def test_un_campo_de_jornada_en_blanco_no_cuenta_como_cargado(db, blanco):
    """`atNuevo()` crea los 17 campos en `''`.

    Con `num_nonnulls()` la cadena vacía cuenta como valor presente y este
    registro —que en realidad está vacío— sería rechazado.
    """
    a = _ateneo(db, "institucional", capacitador=blanco)
    assert a.capacitador == blanco


@pytest.mark.parametrize("blanco", EN_BLANCO)
def test_un_campo_de_desarrollo_clinico_en_blanco_no_cuenta_como_cargado(db, blanco):
    a = _ateneo(db, "jornada", situacion=blanco)
    assert a.situacion == blanco


def test_un_campo_con_texto_entre_espacios_si_cuenta(db):
    """El caso que impide que los dos anteriores pasen por vacuidad: si el CHECK
    aceptara cualquier cosa, este también pasaría."""
    with pytest.raises(IntegrityError):
        _ateneo(db, "institucional", capacitador="   Equipo interno   ")


def test_una_jornada_con_desarrollo_clinico_entre_espacios_se_rechaza(db):
    with pytest.raises(IntegrityError):
        _ateneo(db, "jornada", situacion="  hipótesis  ")


@pytest.mark.parametrize("blanco", EN_BLANCO)
def test_titulo_en_blanco_se_rechaza(db, blanco):
    with pytest.raises(IntegrityError):
        _ateneo(db, "institucional", titulo=blanco)


def test_titulo_con_texto_pasa(db):
    assert _ateneo(db, "institucional", titulo="Meta-ateneo 2026").titulo


def test_titulo_nulo_se_rechaza(db):
    with pytest.raises(IntegrityError):
        _ateneo(db, "institucional", titulo=None)


def test_fecha_nula_se_rechaza(db):
    with pytest.raises(IntegrityError):
        _ateneo(db, "institucional", fecha=None)


def test_tipo_nulo_se_rechaza(db):
    with pytest.raises(IntegrityError):
        _ateneo(db, None)


# ==========================================================================
# D · Correlativo
# ==========================================================================
def test_dos_ateneos_no_comparten_anio_y_numero(db):
    _ateneo(db, "institucional", anio_correlativo=2026, numero=7)
    with pytest.raises(IntegrityError):
        _ateneo(db, "institucional", anio_correlativo=2026, numero=7)


def test_el_mismo_numero_en_otro_anio_pasa(db):
    _ateneo(db, "institucional", anio_correlativo=2026, numero=9)
    _ateneo(db, "institucional", anio_correlativo=2027, numero=9)
    assert db.scalars(select(Ateneo).where(Ateneo.numero == 9)).all().__len__() == 2


def test_numeros_distintos_del_mismo_anio_pasan(db):
    _ateneo(db, "institucional", anio_correlativo=2026, numero=11)
    _ateneo(db, "institucional", anio_correlativo=2026, numero=12)


@pytest.mark.parametrize("numero", (0, -1, 1000, 1001))
def test_numero_fuera_de_1_999_se_rechaza(db, numero):
    """0 y negativos dan `AT-2026-000`; ≥1000 hace que `codigo` devuelva **cosas
    distintas en Python y en SQL** — `f"{1000:03d}"` ensancha a `"1000"` y
    `lpad('1000',3,'0')` **trunca** a `"100"`, colisionando en silencio con el
    ateneo 100. El `UNIQUE` no lo vería: es sobre `numero`, no sobre el código."""
    with pytest.raises(IntegrityError):
        _ateneo(db, "institucional", numero=numero)


@pytest.mark.parametrize("numero", (1, 999))
def test_los_bordes_del_correlativo_pasan(db, numero):
    assert _ateneo(db, "institucional", numero=numero).numero == numero


@pytest.mark.parametrize("anio", (1999, 2200))
def test_el_anio_del_correlativo_no_tiene_rango(db, anio):
    """Espeja a `grupo.anio`, `protocolo.anio` e `informe_cierre.anio`: ninguno
    lleva CHECK de rango, y estrenar uno acá sería incoherente."""
    assert _ateneo(db, "institucional", anio_correlativo=anio).anio_correlativo == anio


def test_el_correlativo_puede_ser_de_otro_anio_que_la_fecha(db):
    """La divergencia D3, **declarada a propósito**: el correlativo es de
    registración, no cronológico. Un ateneo del 20-dic-2026 cargado en enero
    aparece bajo el filtro «2026» (que va contra `fecha`) con un código que dice
    2027. Es la semántica de un libro de actas."""
    a = _ateneo(db, "institucional", anio_correlativo=2027, fecha=date(2026, 12, 20))
    assert a.codigo.startswith("AT-2027-") and a.fecha.year == 2026


# ==========================================================================
# E · `codigo` derivado
# ==========================================================================
@pytest.mark.parametrize("numero,esperado", ((1, "001"), (42, "042"), (999, "999")))
def test_el_codigo_se_forma_con_ceros_a_la_izquierda(db, numero, esperado):
    a = _ateneo(db, "institucional", anio_correlativo=2026, numero=numero)
    assert a.codigo == f"AT-2026-{esperado}"


def test_el_codigo_filtra_en_sql_igual_que_en_python(db):
    a = _ateneo(db, "institucional", anio_correlativo=2026, numero=3)
    _ateneo(db, "institucional", anio_correlativo=2026, numero=4)
    encontrado = db.scalars(select(Ateneo).where(Ateneo.codigo == "AT-2026-003")).one()
    assert encontrado.id == a.id == db.scalars(
        select(Ateneo).where(Ateneo.codigo == a.codigo)
    ).one().id


def test_el_codigo_no_existe_como_columna():
    from app.core.database import Base

    assert "codigo" not in Base.metadata.tables["ateneo"].columns


def test_el_prefijo_es_el_mismo_para_los_cuatro_tipos(db):
    """Fija D2 contra la contradicción interna del prototipo: su seed muestra
    `JC-2026-001` para la jornada, pero `atNuevo()` genera siempre `AT-` y su
    contador cuenta las dos formas en **una sola serie**."""
    assert ATENEO_CODIGO_PREFIJO == "AT"
    for i, tipo in enumerate(sorted(TIPOS), start=100):
        assert _ateneo(db, tipo, numero=i).codigo.startswith("AT-")


# ==========================================================================
# F · `sensible` derivado
# ==========================================================================
@pytest.mark.parametrize("tipo", sorted(TIPOS))
def test_solo_el_ateneo_clinico_es_sensible(db, tipo):
    assert _ateneo(db, tipo).sensible is (tipo == "clinico")


def test_sensible_filtra_en_sql_igual_que_en_python(db):
    clinico = _ateneo(db, "clinico")
    _ateneo(db, "institucional")
    _ateneo(db, "jornada")
    en_sql = db.scalars(select(Ateneo).where(Ateneo.sensible)).all()
    assert [a.id for a in en_sql] == [clinico.id]
    assert all(a.sensible for a in en_sql)


def test_sensible_no_existe_como_columna():
    from app.core.database import Base

    assert "sensible" not in Base.metadata.tables["ateneo"].columns


def test_cambiar_el_tipo_cambia_sensible_sin_tocar_ninguna_columna(db):
    """La prueba de que el drift es imposible.

    La transición es **institucional ↔ jornada** y no «clínico → otro» por una
    razón concreta que apareció al escribir esto: el CHECK
    `nna_solo_en_ateneo_clinico` hace que sacar a un ateneo clínico de su tipo
    sin limpiar `hce_referida_id` en el **mismo** UPDATE sea un rechazo. Está
    fijado aparte, en `test_cambiar_el_tipo_de_un_clinico_exige_limpiar_el_nna`.
    """
    a = _ateneo(db, "institucional")
    assert a.sensible is False
    a.tipo = "jornada"
    db.flush()
    assert a.sensible is False

    # El expediente se crea **antes** de tocar el tipo: `_hce()` hace su propio
    # `flush()`, y si se lo llama en medio del cambio adelanta el UPDATE de
    # `tipo` sin la referencia — que es el mismo rechazo que fija el test de
    # abajo, sólo que disfrazado de fallo del test.
    hce = _hce(db, ci="7.999.999-9")
    a.tipo = "clinico"
    a.hce_referida_id = hce.id
    db.flush()
    assert a.sensible is True     # ninguna columna `sensible` se escribió nunca
    assert db.scalars(select(Ateneo).where(Ateneo.sensible)).one().id == a.id


def test_cambiar_el_tipo_de_un_clinico_exige_limpiar_el_nna(db):
    """Consecuencia de UI que nadie había previsto, y es correcta.

    `(hce_referida_id IS NOT NULL) = (tipo = 'clinico')` obliga a que corregir un
    tipo mal cargado y soltar la referencia ocurran en la **misma sentencia**.
    Es lo que se quiere —no puede quedar un institucional con un NNA colgado ni
    un instante— pero la UI tiene que enterarse: está anotado con las otras
    consecuencias de D6 para M11.4.
    """
    a = _ateneo(db, "clinico")
    a.tipo = "institucional"
    with pytest.raises(IntegrityError):
        db.flush()


def test_cambiar_el_tipo_de_un_clinico_limpiando_el_nna_pasa(db):
    a = _ateneo(db, "clinico")
    a.tipo = "institucional"
    a.hce_referida_id = None
    db.flush()
    assert a.sensible is False


# ==========================================================================
# G · Acuerdos
# ==========================================================================
def _acuerdo(db, ateneo, texto="Implementar agenda visual", **campos):
    ac = AteneoAcuerdo(ateneo_id=ateneo.id, acuerdo=texto, **campos)
    db.add(ac)
    return ac


def test_borrar_el_ateneo_borra_sus_acuerdos(db):
    a = _ateneo(db, "clinico")
    _acuerdo(db, a)
    db.flush()
    assert db.query(AteneoAcuerdo).count() == 1

    db.delete(a)
    db.flush()
    assert db.query(AteneoAcuerdo).count() == 0


def test_los_acuerdos_salen_en_el_orden_registrado(db):
    a = _ateneo(db, "clinico")
    _acuerdo(db, a, "tercero", orden=2)
    _acuerdo(db, a, "primero", orden=0)
    _acuerdo(db, a, "segundo", orden=1)
    db.flush()
    db.expire(a)
    assert [ac.acuerdo for ac in a.acuerdos] == ["primero", "segundo", "tercero"]


def test_dos_acuerdos_con_el_mismo_orden_salen_en_orden_de_carga(db):
    """Sin `UNIQUE(ateneo_id, orden)` a propósito: el empate no produce orden
    indefinido porque la relación desempata por `id`, que es el orden de
    inserción — la misma semántica posicional del array del prototipo. Un
    `UNIQUE` habría rechazado el segundo acuerdo en vez de ordenarlo."""
    a = _ateneo(db, "clinico")
    _acuerdo(db, a, "cargado primero")
    _acuerdo(db, a, "cargado segundo")
    db.flush()
    db.expire(a)
    assert [ac.orden for ac in a.acuerdos] == [0, 0]
    assert [ac.acuerdo for ac in a.acuerdos] == ["cargado primero", "cargado segundo"]


@pytest.mark.parametrize("texto", (None,) + EN_BLANCO)
def test_un_acuerdo_sin_texto_se_rechaza(db, texto):
    a = _ateneo(db, "clinico")
    with pytest.raises(IntegrityError):
        _acuerdo(db, a, texto)
        db.flush()


def test_un_acuerdo_con_texto_pasa(db):
    a = _ateneo(db, "clinico")
    _acuerdo(db, a, "Registrar frecuencia de episodios")
    db.flush()
    assert db.query(AteneoAcuerdo).count() == 1


def test_un_acuerdo_sin_responsable_ni_plazo_es_valido(db):
    a = _ateneo(db, "clinico")
    ac = _acuerdo(db, a)
    db.flush()
    assert (ac.responsable_rol, ac.plazo) == (None, None)


def test_un_acuerdo_con_responsable_y_plazo_es_valido(db):
    a = _ateneo(db, "clinico")
    ac = _acuerdo(db, a, responsable_rol="Coordinación técnica", plazo=date(2026, 5, 1))
    db.flush()
    assert ac.responsable_rol == "Coordinación técnica"


def test_el_responsable_del_acuerdo_es_un_rol_y_no_una_fk():
    """§5.17 (roles genéricos como texto) + la decisión de privacidad del
    prototipo: «se consignan roles, no nombres»."""
    from app.core.database import Base

    tabla = Base.metadata.tables["ateneo_acuerdo"]
    assert {fk.column.table.name for fk in tabla.foreign_keys} == {"ateneo"}
    assert tabla.c.responsable_rol.type.python_type is str


# ==========================================================================
# H · RESTRICT: el ateneo referencia, no pertenece
# ==========================================================================
def test_borrar_el_expediente_falla_mientras_exista_el_ateneo(db):
    """La decisión D8. Es lo contrario de `severidad_dsm`, que **sí** cascadea:
    un ateneo es historia institucional —una reunión con acuerdos, responsables
    y plazos— que no puede desaparecer como efecto secundario de borrar un
    expediente."""
    hce = _hce(db)
    _ateneo(db, "clinico", hce_referida_id=hce.id)
    with pytest.raises(IntegrityError):
        db.delete(hce)
        db.flush()


def test_borrado_el_ateneo_el_expediente_se_puede_borrar(db):
    hce = _hce(db)
    a = _ateneo(db, "clinico", hce_referida_id=hce.id)
    db.delete(a)
    db.flush()
    db.delete(hce)
    db.flush()
    assert db.query(HceDiurna).filter_by(id=hce.id).count() == 0


def test_borrar_el_grupo_falla_mientras_exista_el_ateneo(db):
    g = _grupo(db, "Preadolescentes", 2026)
    _ateneo(db, "grupo", grupo_id=g.id)
    with pytest.raises(IntegrityError):
        db.delete(g)
        db.flush()


def test_el_ateneo_no_tiene_columna_hce_id():
    """Fija la convención de nomenclatura que M12.6 hereda:
    `hce_id` = pertenencia (cascada) · `hce_<calificador>_id` = referencia
    (RESTRICT). Con el mismo nombre, la diferencia sería invisible al leer el
    modelo — la clase de ambigüedad que §5.24 documenta."""
    from app.core.database import Base

    columnas = Base.metadata.tables["ateneo"].columns
    assert "hce_id" not in columnas
    assert "hce_referida_id" in columnas


def test_un_autor_inexistente_se_rechaza(db):
    with pytest.raises(IntegrityError):
        _ateneo(db, "institucional", autor_id=9999)


def test_un_ateneo_sin_autor_es_valido(db):
    """Nullable como los tres registros fechados transversales del esquema. Las
    4 actas del seed del prototipo no traen autor, y hacerlo NOT NULL sería un
    cuarto campo obligatorio que D6 no listó."""
    assert _ateneo(db, "institucional").autor_id is None


def test_un_ateneo_con_autor_es_valido(db):
    pro = _profesional(db)
    assert _ateneo(db, "institucional", autor_id=pro.id).autor_id == pro.id


# ==========================================================================
# I · `documento` con alcance institucional (§5.25)
# ==========================================================================
def test_un_documento_del_expediente_es_valido(db):
    _documento(db, hce_id=_hce(db).id)
    db.flush()
    assert db.query(Documento).count() == 1


def test_un_documento_del_ateneo_es_valido(db):
    _documento(db, ateneo_id=_ateneo(db, "jornada").id)
    db.flush()
    assert db.query(Documento).count() == 1


def test_un_documento_sin_dueno_se_rechaza(db):
    with pytest.raises(IntegrityError):
        _documento(db)
        db.flush()


def test_un_documento_con_los_dos_duenos_se_rechaza(db):
    with pytest.raises(IntegrityError):
        _documento(db, hce_id=_hce(db).id, ateneo_id=_ateneo(db, "jornada").id)
        db.flush()


def test_borrar_el_ateneo_borra_sus_documentos(db):
    a = _ateneo(db, "jornada")
    _documento(db, ateneo_id=a.id)
    db.flush()
    assert db.query(Documento).count() == 1

    db.delete(a)
    db.flush()
    assert db.query(Documento).count() == 0


def test_el_registro_historico_no_depende_del_expediente(db):
    """La regla §4 «Registro histórico inmutable (§10)» se apoya en
    `es_registro_historico`, no en `hce_id`: sigue siendo coherente con un
    documento sin expediente."""
    d = _documento(db, ateneo_id=_ateneo(db, "jornada").id)
    db.flush()
    assert d.es_registro_historico is False
    assert "es_registro_historico" in Documento.__table__.columns


# ==========================================================================
# J · Vocabulario y forma del esquema
# ==========================================================================
def test_ningun_texto_nuevo_dice_grave():
    """Vocabulario institucional §8.1: «severo / muy severo», nunca «grave»."""
    from app.core.database import Base

    textos = list(ATENEO_TIPOS) + list(ATENEO_TIPOS.values()) + [ATENEO_CODIGO_PREFIJO]
    for nombre in ("ateneo", "ateneo_acuerdo"):
        tabla = Base.metadata.tables[nombre]
        textos += [nombre, *tabla.columns.keys()]
        textos += [c.name for c in tabla.constraints if c.name]
    con_grave = [t for t in textos if "grave" in t.lower()]
    assert not con_grave, con_grave


def test_los_tipos_de_ateneo_no_entraron_como_catalogo():
    """`AT_TIPOS` es **constante**, así que el JSON de catálogos no gana sección
    y `generar_catalogos_backend.py --check` no debería moverse."""
    assert not [s for s in CATALOGOS if "ateneo" in s]


def test_observaciones_es_un_campo_libre_opcional(db):
    """§5.66 — primer «faltante concreto» de §5.46 (I11).

    Texto opcional, **sin CHECK** (como `participantes`): vale para cualquier
    tipo y no está en los dos grupos de exclusividad de contenido. Se prueba en
    una jornada justamente para mostrar que el CHECK de jornada no lo alcanza.
    """
    a = _ateneo(db, "jornada", observaciones="  se reprograma la próxima  ")
    assert a.observaciones == "  se reprograma la próxima  "
    assert _ateneo(db, "clinico", observaciones=None).observaciones is None
    assert "observaciones" not in CAMPOS_JORNADA
    assert "observaciones" not in CAMPOS_DESARROLLO_CLINICO


# ==========================================================================
# K · Huecos conocidos, fijados para que estén escritos
# ==========================================================================
def test_una_jornada_con_acuerdos_hoy_se_guarda(db):
    """El bloque de acuerdos vive en la rama **no**-jornada del prototipo, así
    que una jornada no debería llevarlos. Es cross-table: un CHECK no alcanza y
    §5.2.2 prohíbe los triggers. **Guard de M11.3.** El test fija el estado
    actual para que el hueco esté escrito."""
    a = _ateneo(db, "jornada")
    _acuerdo(db, a, "acuerdo en una jornada")
    db.flush()
    assert db.query(AteneoAcuerdo).count() == 1


def test_la_fecha_puede_no_coincidir_con_el_anio_del_grupo(db):
    """También cross-table → M11.3, y como **advertencia, no bloqueo**: un
    ateneo de febrero-2026 que revisa el ciclo del grupo Escolares **2025** es
    legítimo."""
    g = _grupo(db, "Escolares", 2025)
    a = _ateneo(db, "grupo", grupo_id=g.id, fecha=date(2026, 2, 10))
    assert a.fecha.year != g.anio
