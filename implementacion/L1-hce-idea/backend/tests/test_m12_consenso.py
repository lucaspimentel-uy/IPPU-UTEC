"""Tests de M12.2 — puntuación independiente y consenso (D7 · `handoff.md` §5.16).

**Lo que se prueba acá es que los datos para calcular kappa se puedan guardar y
consultar; no que kappa se calcule** (eso es fase piloto) ni que la firma se
rechace cuando falta documentar (eso es el guard de M11.3, §5.2.2).

Mismo criterio que los otros dos archivos: lo que la base garantiza —rangos,
unicidad, CHECK, columna generada— más las dos derivaciones que viven en el
modelo (`procedimiento` y `documentacion_pendiente`), que son derivadas y no
almacenadas justamente para que no se desfasen.

Cada test que espera un rechazo prueba también el caso que debe pasar.
"""
from datetime import date

import pytest
from sqlalchemy.exc import IntegrityError

from app.core.constantes import CONSENSO_DIFERENCIA_AMBIGUEDAD, CONSENSO_PROCEDIMIENTOS
from app.models import (
    HceDiurna, Idea, IdeaDimension, IppuItem, Persona, Profesional, Protocolo,
    PuntuacionIdea, PuntuacionProtocolo,
)


# --------------------------------------------------------------------------
# Ayudas
# --------------------------------------------------------------------------
def _hce(db, ci="2.222.222-2"):
    p = Persona(nombre="Test", apellido="Consenso", ci=ci, fecha_nac=date(2015, 5, 1))
    db.add(p)
    db.flush()
    h = HceDiurna(persona_id=p.id)
    db.add(h)
    db.flush()
    return h


def _idea(db, ci="2.222.222-2"):
    ev = Idea(hce_id=_hce(db, ci).id, fecha_consenso=date(2026, 3, 1))
    db.add(ev)
    db.flush()
    return ev


def _dimension(db, numero=1):
    """Los catálogos no están sembrados en la base de test: la FK los exige."""
    dim = db.get(IdeaDimension, numero)
    if dim is None:
        dim = IdeaDimension(
            id=numero, codigo=f"D{numero}", escala="A", escala_nombre="Relación Social",
            nombre=f"Dimensión {numero}",
        )
        db.add(dim)
        db.flush()
    return dim


def _item(db, numero=1):
    it = db.get(IppuItem, numero)
    if it is None:
        it = IppuItem(
            id=numero, escala=1, escala_nombre="Relación Social",
            orden_en_escala=numero, texto=f"Ítem {numero}",
        )
        db.add(it)
        db.flush()
    return it


def _puntuar(db, ev, dimension=1, **kw):
    p = PuntuacionIdea(idea_id=ev.id, dimension_id=_dimension(db, dimension).id, **kw)
    db.add(p)
    db.flush()
    db.refresh(p)   # `diferencia` la calcula Postgres
    return p


def _profesional(db, email):
    pro = Profesional(nombre=email, email=email)
    db.add(pro)
    db.flush()
    return pro


# --------------------------------------------------------------------------
# El caso del plan: t1=4, t2=6, consenso=4
# --------------------------------------------------------------------------
def test_diferencia_de_dos_queda_pendiente_de_documentar(db):
    """El caso textual de M12.2.

    Los dos técnicos puntuaron 4 y 6 la misma dimensión y consensuaron 4. Para
    el Manual una diferencia ≥2 es **ambigüedad clínica** y exige documentar
    cómo se resolvió; mientras no esté documentado, la fila queda marcada.
    """
    ev = _idea(db)
    ev.dim = {"1": {"valor": 4, "obs": "consenso tras discusión"}}
    p = _puntuar(db, ev, valor_t1=4, valor_t2=6)

    assert p.diferencia == 2
    assert p.procedimiento == "ambiguedad_clinica"
    assert p.documentacion_pendiente is True
    # El consenso no se movió de donde estaba: sigue en `idea.dim`.
    assert ev.dim["1"]["valor"] == 4


def test_la_consulta_de_pendientes_encuentra_la_fila(db):
    """`documentacion_pendiente` también filtra en SQL.

    No es un detalle: «qué dimensiones tienen ambigüedad clínica sin documentar»
    es el control de confiabilidad que pide el Manual, y se hace sobre toda la
    cohorte, no sobre un expediente.
    """
    ev = _idea(db)
    _puntuar(db, ev, dimension=1, valor_t1=4, valor_t2=6)                 # pendiente
    _puntuar(db, ev, dimension=2, valor_t1=4, valor_t2=4)                 # coincide
    _puntuar(db, ev, dimension=3, valor_t1=2, valor_t2=6,
             documentacion="Se revisaron registros de sesión; se acordó 4.")

    pendientes = (
        db.query(PuntuacionIdea)
        .filter(PuntuacionIdea.documentacion_pendiente)
        .all()
    )
    assert [p.dimension_id for p in pendientes] == [1]


def test_documentar_saca_la_fila_de_pendientes(db):
    ev = _idea(db)
    p = _puntuar(db, ev, valor_t1=0, valor_t2=4)
    assert p.documentacion_pendiente is True

    p.documentacion = "Ambigüedad por escasa observación en el aula; se acordó 2."
    db.flush()
    assert p.documentacion_pendiente is False
    assert p.procedimiento == "ambiguedad_clinica", "el procedimiento no cambia por documentarlo"


# --------------------------------------------------------------------------
# Bordes: 0, 1 y 2 son tres estados distintos
# --------------------------------------------------------------------------
@pytest.mark.parametrize(
    "t1, t2, diferencia, procedimiento, pendiente",
    [
        (4, 4, 0, "registro", False),
        (4, 5, 1, "discusion_breve", False),
        (4, 6, 2, "ambiguedad_clinica", True),
    ],
)
def test_los_tres_tramos_del_procedimiento(db, t1, t2, diferencia, procedimiento, pendiente):
    """0 → se registra · 1 → discusión breve · ≥2 → ambigüedad clínica.

    El borde que importa es 1 vs. 2: es donde la documentación pasa de opcional
    a obligatoria.
    """
    p = _puntuar(db, _idea(db), valor_t1=t1, valor_t2=t2)
    assert p.diferencia == diferencia
    assert p.procedimiento == procedimiento
    assert p.documentacion_pendiente is pendiente


def test_la_diferencia_no_depende_del_orden_de_los_evaluadores(db):
    """Es `abs()`: quién puntuó más alto no cambia el procedimiento."""
    ev = _idea(db)
    assert _puntuar(db, ev, dimension=1, valor_t1=6, valor_t2=4).diferencia == 2
    assert _puntuar(db, ev, dimension=2, valor_t1=4, valor_t2=6).diferencia == 2


# --------------------------------------------------------------------------
# Nullable no es opcional: es requisito (históricos + seed espejo)
# --------------------------------------------------------------------------
def test_una_evaluacion_sin_puntuaciones_independientes_es_valida(db):
    """El requisito duro de D7.

    Los históricos migrados y el seed espejo de la demo **sólo** tienen el
    consenso: si las dos puntuaciones fueran obligatorias, no habría forma de
    cargarlos. Y todavía no sabemos si los técnicos de IPPU ya trabajan así
    (pregunta abierta de `handoff.md` §7).
    """
    ev = _idea(db)
    ev.dim = {str(d): {"valor": 4, "obs": ""} for d in range(1, 13)}
    ev.total = 48
    db.flush()   # no debe levantar

    assert ev.puntuaciones == []
    assert ev.evaluador_t1_id is None and ev.evaluador_t2_id is None


def test_una_sola_puntuacion_no_produce_diferencia(db):
    """Uno cargó la suya y el otro todavía no. No es una diferencia de 0."""
    p = _puntuar(db, _idea(db), valor_t1=4)
    assert p.diferencia is None
    assert p.procedimiento is None
    assert p.documentacion_pendiente is False


# --------------------------------------------------------------------------
# NS — sigue siendo valor válido del IDEA
# --------------------------------------------------------------------------
def test_ns_es_distinguible_de_no_haber_puntuado(db):
    """Tres estados, no dos: sin puntuar · puntuó un número · puntuó NS."""
    ev = _idea(db)
    sin_puntuar = _puntuar(db, ev, dimension=1)
    numero = _puntuar(db, ev, dimension=2, valor_t1=4)
    ns = _puntuar(db, ev, dimension=3, ns_t1=True)

    assert (sin_puntuar.valor_t1, sin_puntuar.ns_t1) == (None, False)
    assert (numero.valor_t1, numero.ns_t1) == (4, False)
    assert (ns.valor_t1, ns.ns_t1) == (None, True)


def test_ns_contra_numero_no_produce_diferencia_numerica(db):
    """Desacuerdo real que la aritmética no expresa.

    Uno dice «no pude observarlo» y el otro puntúa 4. Es un desacuerdo, pero no
    tiene magnitud. Acá sólo se registra que pasó; **qué hacer con eso lo define
    el servicio en M11.3** (anotado en `esquema-datos-v2.md` §4).
    """
    p = _puntuar(db, _idea(db), ns_t1=True, valor_t2=4)
    assert p.diferencia is None
    assert p.procedimiento is None


def test_ns_y_valor_numerico_a_la_vez_se_rechazan(db):
    p = PuntuacionIdea(
        idea_id=_idea(db).id, dimension_id=_dimension(db).id, ns_t1=True, valor_t1=4,
    )
    db.add(p)
    with pytest.raises(IntegrityError, match="ns_t1_sin_valor"):
        db.flush()


def test_ns_t2_y_valor_numerico_a_la_vez_se_rechazan(db):
    """Simétrico al de arriba, para el segundo evaluador — `rango_t1`/`ns_t1_sin_valor`
    tenían su rechazo probado; `rango_t2`/`ns_t2_sin_valor` no (Step A4, M12.8)."""
    p = PuntuacionIdea(
        idea_id=_idea(db).id, dimension_id=_dimension(db).id, ns_t2=True, valor_t2=4,
    )
    db.add(p)
    with pytest.raises(IntegrityError, match="ns_t2_sin_valor"):
        db.flush()


# --------------------------------------------------------------------------
# Integridad estructural
# --------------------------------------------------------------------------
def test_idea_rechaza_puntuacion_fuera_de_0_8(db):
    ev = _idea(db)
    _puntuar(db, ev, dimension=1, valor_t1=8)          # el máximo válido pasa
    db.add(PuntuacionIdea(idea_id=ev.id, dimension_id=_dimension(db, 2).id, valor_t1=9))
    with pytest.raises(IntegrityError, match="rango_t1"):
        db.flush()


def test_idea_rechaza_puntuacion_de_t2_fuera_de_0_8(db):
    """Simétrico al de arriba, para el segundo evaluador (Step A4, M12.8)."""
    ev = _idea(db)
    _puntuar(db, ev, dimension=1, valor_t2=8)          # el máximo válido pasa
    db.add(PuntuacionIdea(idea_id=ev.id, dimension_id=_dimension(db, 2).id, valor_t2=9))
    with pytest.raises(IntegrityError, match="rango_t2"):
        db.flush()


def test_protocolo_rechaza_puntuacion_fuera_de_1_5(db):
    """La escala IPPU-TEA es Likert 1–5 y **no admite NS**, a diferencia del IDEA."""
    proto = Protocolo(hce_id=_hce(db).id, tipo="A", anio=2026)
    db.add(proto)
    db.flush()

    ok = PuntuacionProtocolo(
        protocolo_id=proto.id, item_id=_item(db, 1).id, valor_t1=1, valor_t2=3,
    )
    db.add(ok)
    db.flush()
    db.refresh(ok)
    assert ok.diferencia == 2 and ok.documentacion_pendiente is True

    db.add(PuntuacionProtocolo(
        protocolo_id=proto.id, item_id=_item(db, 2).id, valor_t1=0,
    ))
    with pytest.raises(IntegrityError, match="rango_t1"):
        db.flush()


def test_no_puede_haber_dos_puntuaciones_de_la_misma_dimension(db):
    ev = _idea(db)
    _puntuar(db, ev, dimension=1, valor_t1=4)
    db.add(PuntuacionIdea(idea_id=ev.id, dimension_id=_dimension(db, 1).id, valor_t1=6))
    with pytest.raises(IntegrityError, match="uq_puntuacion_idea_dimension"):
        db.flush()


def test_documentacion_en_blanco_se_rechaza(db):
    """Documentar con espacios no es documentar."""
    ev = _idea(db)
    db.add(PuntuacionIdea(
        idea_id=ev.id, dimension_id=_dimension(db).id, valor_t1=2, valor_t2=6,
        documentacion="   ",
    ))
    with pytest.raises(IntegrityError, match="documentacion_no_vacia"):
        db.flush()


def test_los_dos_evaluadores_no_pueden_ser_la_misma_persona(db):
    """El invariante metodológico, expresado donde no se puede eludir.

    «Puntuación independiente» con un solo evaluador puesto dos veces no es
    independiente: el kappa daría 1 sin que nadie haya comparado nada.
    """
    uno = _profesional(db, "uno@ippu.uy")
    otra = _profesional(db, "otra@ippu.uy")
    hce = _hce(db)

    db.add(Idea(hce_id=hce.id, evaluador_t1_id=uno.id, evaluador_t2_id=otra.id))
    db.flush()   # dos personas distintas: pasa

    db.add(Idea(hce_id=hce.id, evaluador_t1_id=uno.id, evaluador_t2_id=uno.id))
    with pytest.raises(IntegrityError, match="evaluadores_distintos"):
        db.flush()


def test_un_solo_evaluador_cargado_es_valido(db):
    """La contracara del CHECK anterior: cargar uno y todavía no el otro."""
    uno = _profesional(db, "solo@ippu.uy")
    db.add(Idea(hce_id=_hce(db).id, evaluador_t1_id=uno.id))
    db.flush()


def test_borrar_la_evaluacion_borra_sus_puntuaciones(db):
    """Son datos de esa evaluación, no registros independientes."""
    ev = _idea(db)
    _puntuar(db, ev, valor_t1=4, valor_t2=4)
    db.delete(ev)
    db.flush()
    assert db.query(PuntuacionIdea).count() == 0


# --------------------------------------------------------------------------
# Los umbrales son constante, no catálogo
# --------------------------------------------------------------------------
def test_los_tramos_del_consenso_no_son_parametrizables(db):
    """El Manual llama a este circuito «el único requisito metodológico
    invariante». Si el umbral se pudiera correr con un UPDATE, los kappas de
    antes y después del UPDATE no serían comparables — por eso va en
    `core/constantes.py` y no en una tabla, contra el criterio general de D6.
    """
    from app.core.database import Base

    assert [minimo for minimo, _, _ in CONSENSO_PROCEDIMIENTOS] == [0, 1, 2]
    assert CONSENSO_DIFERENCIA_AMBIGUEDAD == 2
    assert not [t for t in Base.metadata.tables if "consenso" in t or "procedimiento" in t]
