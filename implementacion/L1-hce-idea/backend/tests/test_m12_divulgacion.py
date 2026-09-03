"""Tests de M12.8a — HCE-DIV · Registro de divulgación de datos.

Mismo criterio que el resto de la ronda (§5.2.2): la base garantiza *integridad
estructural* y es lo único que se prueba acá. Lo que es guard —quién puede
divulgar según su rol, si un consentimiento habilita la salida, los dos CHECK
cruzados que §5.80 dejó afuera a propósito— es **M11.3/M11.4**. Los casos que
hoy la base deja pasar se fijan igual con un test (bloque G), para que el hueco
esté escrito y no se descubra por sorpresa.

Cada rechazo se prueba junto con su caso que sí pasa: un CHECK que rechaza todo
también «pasaría» un test de rechazo.
"""
from datetime import date

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.core.constantes import DIVULGACION_ALCANCES, DIVULGACION_DESTINATARIOS
from app.models import (
    Ateneo, CategoriaDocumento, Divulgacion, Documento, HceDiurna, Persona,
    Profesional,
)

#: Los dos vocabularios, transcritos a mano acá y en ningún otro lado del código.
#: Mismo recurso que `TIPOS` en `test_m12_ateneos.py` y `LOS_14` en
#: `test_m12_talleres.py`: si alguien edita la constante, este archivo lo dice.
DESTINATARIOS = (
    "Familia / representante legal",
    "Tercero autorizado por escrito",
    "INAU",
    "MSP / BPS",
    "Ministerio Público",
    "Poder Judicial",
    "Dirección institucional / gobierno / Consejo de Administración",
    "Organismo convenio / donante",
    "Equipo de investigación (convenio UTEC-LIDIA)",
)
ALCANCES = ("identificable", "disociado", "agregado")

#: Formas de «texto que no es texto» — `finalidad` lleva el mismo `~ '[^[:space:]]'`
#: que `ateneo.titulo`. `'\t'` y `'\n'` están porque `btrim()` sin argumentos
#: recorta sólo espacios.
EN_BLANCO = ("", "   ", "\t", "\n", " \t\n ")

_N = {"i": 0}


# --------------------------------------------------------------------------
# Ayudas
# --------------------------------------------------------------------------
def _hce(db):
    _N["i"] += 1
    p = Persona(
        nombre="Test", apellido="Div", ci=f"5.555.{_N['i']:03d}-5",
        fecha_nac=date(2015, 5, 1),
    )
    db.add(p)
    db.flush()
    h = HceDiurna(persona_id=p.id)
    db.add(h)
    db.flush()
    return h


def _profesional(db):
    _N["i"] += 1
    pro = Profesional(nombre=f"Prof {_N['i']}", email=f"div{_N['i']}@ippu.test")
    db.add(pro)
    db.flush()
    return pro


def _ateneo(db):
    _N["i"] += 1
    a = Ateneo(
        anio_correlativo=2026, numero=_N["i"], tipo="institucional",
        fecha=date(2026, 4, 16), titulo="Ateneo institucional de prueba",
    )
    db.add(a)
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
        "nombre": "informe.pdf",
        "fecha_carga": date(2026, 5, 20),
    }
    datos.update(campos)
    if "hce_id" not in datos and "ateneo_id" not in datos:
        datos["hce_id"] = _hce(db).id     # `documento` exige exactamente un dueño
    d = Documento(**datos)
    db.add(d)
    db.flush()
    return d


def _divulgacion(db, *, agregado=False, flush=True, **campos):
    """Una divulgación válida. Por defecto cuelga de un expediente nuevo; con
    `agregado=True` no cuelga de nada (el informe estadístico de §6.6)."""
    datos = {
        "destinatario_tipo": "INAU",
        "alcance_dato": "identificable",
        "finalidad": "Informe de seguimiento solicitado por la UCT de INAU",
        "fecha": date(2026, 5, 20),
    }
    datos.setdefault("responsable_id", _profesional(db).id)
    if not agregado and "hce_id" not in campos and "ateneo_id" not in campos:
        datos["hce_id"] = _hce(db).id
    datos.update(campos)
    d = Divulgacion(**datos)
    db.add(d)
    if flush:
        db.flush()
    return d


# ==========================================================================
# A · Pertenencia: expediente, ateneo, o nada (informe agregado)
# ==========================================================================
def test_una_divulgacion_de_un_expediente_es_valida(db):
    d = _divulgacion(db)
    assert d.hce_id is not None and d.ateneo_id is None


def test_una_divulgacion_de_un_ateneo_es_valida(db):
    """§5.25 — un dato puede salir de un ateneo institucional."""
    a = _ateneo(db)
    d = _divulgacion(db, ateneo_id=a.id)
    assert d.ateneo_id == a.id and d.hce_id is None


def test_un_informe_agregado_no_cuelga_de_nada(db):
    """El CHECK es `<= 1` y no `= 1`: la estadística de §6.6 —«de modo que sea
    imposible identificar a un usuario»— no pertenece a ningún expediente ni
    ateneo y se registra con las dos FK en NULL."""
    d = _divulgacion(db, agregado=True, alcance_dato="agregado",
                     destinatario_tipo="Organismo convenio / donante",
                     finalidad="Reporte anual agregado para el organismo de convenio")
    assert d.hce_id is None and d.ateneo_id is None


def test_expediente_y_ateneo_juntos_se_rechazan(db):
    hce = _hce(db)
    a = _ateneo(db)
    with pytest.raises(IntegrityError, match="expediente_o_ateneo"):
        _divulgacion(db, hce_id=hce.id, ateneo_id=a.id)


# ==========================================================================
# B · `destinatario_tipo` — dominio cerrado
# ==========================================================================
@pytest.mark.parametrize("valor", DESTINATARIOS)
def test_cada_destinatario_del_dominio_se_guarda(db, valor):
    assert _divulgacion(db, destinatario_tipo=valor).destinatario_tipo == valor


def test_un_destinatario_fuera_del_dominio_se_rechaza(db):
    with pytest.raises(IntegrityError, match="destinatario_tipo_valido"):
        _divulgacion(db, destinatario_tipo="Prensa")


def test_destinatario_tipo_nulo_se_rechaza(db):
    with pytest.raises(IntegrityError):
        _divulgacion(db, destinatario_tipo=None)


# ==========================================================================
# C · `alcance_dato` — los tres valores
# ==========================================================================
@pytest.mark.parametrize("valor", ALCANCES)
def test_cada_alcance_del_dominio_se_guarda(db, valor):
    # el agregado no cuelga de un expediente, pero los tres valores del dominio
    # son válidos en sí mismos — es lo único que este test mira.
    assert _divulgacion(db, agregado=(valor == "agregado"),
                        alcance_dato=valor).alcance_dato == valor


def test_un_alcance_fuera_del_dominio_se_rechaza(db):
    with pytest.raises(IntegrityError, match="alcance_dato_valido"):
        _divulgacion(db, alcance_dato="parcial")


def test_alcance_dato_nulo_se_rechaza(db):
    with pytest.raises(IntegrityError):
        _divulgacion(db, alcance_dato=None)


# ==========================================================================
# D · `finalidad` — obligatoria y no vacía (§8 · §4)
# ==========================================================================
@pytest.mark.parametrize("blanco", (None,) + EN_BLANCO)
def test_una_finalidad_vacia_o_en_blanco_se_rechaza(db, blanco):
    with pytest.raises(IntegrityError):
        _divulgacion(db, finalidad=blanco)


def test_una_finalidad_con_texto_entre_espacios_se_rechaza(db):
    """El caso que impide que el anterior pase por vacuidad: si el CHECK
    aceptara cualquier cosa, este también pasaría."""
    with pytest.raises(IntegrityError, match="finalidad_no_vacia"):
        _divulgacion(db, finalidad="   \t  ")


def test_una_finalidad_sustantiva_pasa(db):
    d = _divulgacion(db, finalidad="Traslado de HC por cambio de institución (§6.5)")
    assert d.finalidad.startswith("Traslado")


# ==========================================================================
# E · `fecha` y `responsable_id` obligatorios
# ==========================================================================
def test_fecha_nula_se_rechaza(db):
    with pytest.raises(IntegrityError):
        _divulgacion(db, fecha=None)


def test_responsable_nulo_se_rechaza(db):
    with pytest.raises(IntegrityError):
        _divulgacion(db, responsable_id=None)


def test_un_responsable_inexistente_se_rechaza(db):
    with pytest.raises(IntegrityError):
        _divulgacion(db, responsable_id=999999)


# ==========================================================================
# F · CHECK ↔ constante, y borrados
# ==========================================================================
def test_el_check_y_la_constante_no_pueden_divergir(db):
    """El modo de falla que justifica que los dos vocabularios sean constante y
    no catálogo (mismo test que M12.7 sobre `ATENEO_TIPOS`). Si la constante
    gana un valor y el CHECK no se toca, ese valor cae fuera del dominio: la
    fila se rechaza en silencio, o —si el CHECK se hubiera aflojado— se
    aceptaría algo que el código considera inválido.
    """
    assert set(DIVULGACION_DESTINATARIOS) == set(DESTINATARIOS)
    assert tuple(DIVULGACION_ALCANCES) == ALCANCES
    for valor in DIVULGACION_DESTINATARIOS:
        _divulgacion(db, destinatario_tipo=valor)
    for valor in DIVULGACION_ALCANCES:
        _divulgacion(db, agregado=(valor == "agregado"), alcance_dato=valor)


def test_borrar_el_expediente_se_lleva_la_divulgacion(db):
    """`hce_id` CASCADE (D-B): `divulgacion` es contenido del expediente. La
    contra-argumentación —es rastro de rendición de cuentas y podría querer
    sobrevivir— está en el docstring del modelo y en §5.80."""
    hce = _hce(db)
    _divulgacion(db, hce_id=hce.id)
    assert db.query(Divulgacion).count() == 1
    db.delete(hce)
    db.flush()
    assert db.query(Divulgacion).count() == 0


def test_borrar_el_responsable_falla_mientras_exista_la_divulgacion(db):
    """RESTRICT: dar de baja a un profesional no puede borrar el registro de lo
    que divulgó."""
    pro = _profesional(db)
    _divulgacion(db, responsable_id=pro.id)
    with pytest.raises(IntegrityError):
        db.delete(pro)
        db.flush()


def test_borrar_un_documento_referenciado_falla(db):
    """RESTRICT sobre `documento_id`: el objeto de la divulgación —el informe que
    salió— no puede desvanecerse mientras el registro lo referencie."""
    hce = _hce(db)
    doc = _documento(db, hce_id=hce.id)
    _divulgacion(db, hce_id=hce.id, documento_id=doc.id)
    with pytest.raises(IntegrityError):
        db.delete(doc)
        db.flush()


def test_una_divulgacion_con_documento_es_valida(db):
    """La contraparte que pasa: con el documento en su lugar, la fila se guarda
    y la relación resuelve."""
    hce = _hce(db)
    doc = _documento(db, hce_id=hce.id)
    d = _divulgacion(db, hce_id=hce.id, documento_id=doc.id)
    assert d.documento_id == doc.id and d.documento.nombre == "informe.pdf"


def test_borrar_un_documento_de_autorizacion_referenciado_falla(db):
    """Mismo RESTRICT sobre `autorizacion_documento_id`."""
    hce = _hce(db)
    doc = _documento(db, hce_id=hce.id)
    _divulgacion(db, hce_id=hce.id, autorizacion_escrita=True,
                 autorizacion_documento_id=doc.id)
    with pytest.raises(IntegrityError):
        db.delete(doc)
        db.flush()


# ==========================================================================
# G · Huecos conocidos y forma del esquema — fijados para que estén escritos
# ==========================================================================
def test_autorizacion_escrita_por_defecto_es_false(db):
    """NOT NULL con `server_default="false"` (idioma de `puntuacion_idea.ns_t1`):
    la ausencia de dato es «no consta autorización», nunca NULL."""
    d = _divulgacion(db)
    assert d.autorizacion_escrita is False


def test_una_divulgacion_a_agregado_puede_colgar_de_un_expediente_hoy(db):
    """El CHECK cruzado `alcance_dato <> 'agregado' OR hce_id IS NULL` **no
    está**: es un guard de M11.3 (§5.80). El test fija el estado actual para que
    el hueco esté escrito, como `test_una_jornada_con_acuerdos_hoy_se_guarda` en
    M12.7."""
    d = _divulgacion(db, alcance_dato="agregado")
    assert d.alcance_dato == "agregado" and d.hce_id is not None


def test_autorizacion_escrita_sin_puntero_se_guarda_hoy(db):
    """El otro CHECK cruzado que no está: «si `autorizacion_escrita`, entonces
    apuntá a la autorización». Guard de M11.3 —además necesita devolver *qué*
    falta, cosa que un CHECK no puede—."""
    d = _divulgacion(db, autorizacion_escrita=True)
    assert d.autorizacion_escrita is True
    assert d.autorizacion_documento_id is None and d.autorizacion_ref is None


def test_la_tabla_no_tiene_xor_estricto_entre_expediente_y_ateneo():
    """A diferencia de `documento` y `foto` —`num_nonnulls(...) = 1`—, acá el
    CHECK es `<= 1`. La diferencia es el informe agregado de §6.6."""
    from app.core.database import Base

    checks = {
        c.name: str(c.sqltext)
        for c in Base.metadata.tables["divulgacion"].constraints
        if c.__class__.__name__ == "CheckConstraint"
    }
    pertenencia = next(v for k, v in checks.items() if k.endswith("expediente_o_ateneo"))
    assert "<= 1" in pertenencia and "num_nonnulls(hce_id, ateneo_id)" in pertenencia


def test_ningun_texto_nuevo_dice_grave():
    """Vocabulario institucional §8.1: «severo / muy severo», nunca «grave»."""
    from app.core.database import Base

    textos = list(DIVULGACION_DESTINATARIOS) + list(DIVULGACION_ALCANCES)
    tabla = Base.metadata.tables["divulgacion"]
    textos += ["divulgacion", *tabla.columns.keys()]
    textos += [c.name for c in tabla.constraints if c.name]
    con_grave = [t for t in textos if "grave" in t.lower()]
    assert not con_grave, con_grave
