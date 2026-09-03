"""Tests de M12.6 — HCE-PAI · Propuesta de Atención Individual.

Mismo criterio que el resto de la ronda (§5.2.2): la base garantiza *integridad
estructural* y es lo único que se prueba acá. **Ningún guard**: la habilitación
de la sección IX por tipo, el cálculo de totales y deltas con verificación previa
a la firma (el Anexo A del Manual) y la resolución de «qué IDEA rige a la fecha
de este PAI» son M11.3 — §5.54 fijó que esta sesión es de solo esquema.

Cada rechazo se prueba junto con su caso que sí pasa: un CHECK que rechaza todo
también «pasaría» un test de rechazo.

Los tres bloques que llevan el peso son:
  · **B** — que `pai` NO tenga las columnas de las secciones de solo lectura, que
    es como se modela «carga única» (§5.22): ausencia, no copia.
  · **C** — que dos PAI del mismo año convivan (§5.22, consecuencia 1).
  · **F** — el test que M12.3 no pudo escribir y §5.21 traspasó a este módulo.
"""
from datetime import date

import pytest
from sqlalchemy.exc import IntegrityError

from app.core.constantes import (
    PAI_ACUERDO_FAMILIA,
    PAI_AREAS,
    PAI_CIRCUITO,
    PAI_CONTROLES,
    PAI_COORDINACION_ACTORES,
    PAI_DECISIONES,
    PAI_DISPOSICIONES,
    PAI_ETAPAS,
    PAI_FRECUENCIAS,
    PAI_LOGROS,
    PAI_PLAZOS,
    PAI_PRESTACIONES,
    PAI_SI_NO,
    PAI_TIPOS,
)
from app.models import (
    HceDiurna,
    Pai,
    PaiCircuito,
    PaiCoordinacion,
    PaiEquipo,
    PaiEvaluacionPrevia,
    PaiObjetivo,
    PaiPrestacion,
    PaiTaller,
    Persona,
    Taller,
)

#: Las 15 secciones del formulario, y de cuál módulo sale cada dato que el
#: prototipo dibuja con `ro()`. Transcrito a mano acá y en ningún otro lado del
#: código — mismo recurso que `LOS_7` en `test_m12_inclusion.py`.
#:
#: Es la lista que **no** puede aparecer como columna de `pai`.
LEIDAS_EN_VIVO = {
    # §I — HCE-00
    "nombre", "apellido", "fnac", "fecha_nac", "edad", "ci", "hc",
    # §II — HCE-ORG
    "sipi", "convenio",
    # §II — HCE-00 / HCE-SEV
    "diag", "diagnostico", "cie11", "nivel", "nivel_soporte", "severidad",
    # §V — HCE-INC (§5.22)
    "centro", "centro_ed", "centroed", "modalidad", "grado",
    # §VI — HCE-LB / HCE-PA / HCE-PB
    "idea_fecha", "idea_total", "prot_a_total", "prot_b_total", "delta",
    # §XI — HCE-00
    "grupo", "grupo_id",
}

#: Valor inválido para cualquiera de los dominios del módulo, **corto a
#: propósito**.
#:
#: La primera versión de estos tests usaba `"valor inventado"` y tres de ellos
#: fallaban con `DataError` en vez de `IntegrityError`: `judicial`, `participo` y
#: `se_coordina` son `String(10)`, así que Postgres los rechazaba **por largo,
#: antes de llegar al CHECK**. Eso convertía un test del dominio en un test de la
#: longitud de la columna — y habría seguido pasando en verde con el CHECK
#: borrado. Con un solo carácter, lo único que puede rechazarlo es el CHECK.
FUERA_DE_DOMINIO = "X"


# --------------------------------------------------------------------------
# Ayudas
# --------------------------------------------------------------------------
def _hce(db, ci="6.666.666-6"):
    p = Persona(nombre="Test", apellido="Pai", ci=ci, fecha_nac=date(2015, 5, 4))
    db.add(p)
    db.flush()
    h = HceDiurna(persona_id=p.id)
    db.add(h)
    db.flush()
    return h


def _pai(db, hce=None, **kw):
    hce = hce or _hce(db)
    kw.setdefault("anio", 2026)
    kw.setdefault("tipo", PAI_TIPOS[0])
    p = Pai(hce_id=hce.id, **kw)
    db.add(p)
    db.flush()
    return p


def _columnas(modelo) -> set[str]:
    return set(modelo.__table__.columns.keys())


# ==========================================================================
# A · Las 8 tablas del módulo
# ==========================================================================
def test_el_modulo_trae_ocho_tablas():
    """La cabecera y sus siete hijas. Si alguien agrega una, que se note acá."""
    from app.core.database import Base

    del_modulo = {t for t in Base.metadata.tables if t == "pai" or t.startswith("pai_")}
    assert del_modulo == {
        "pai",
        "pai_objetivo",
        "pai_evaluacion_previa",
        "pai_equipo",
        "pai_coordinacion",
        "pai_taller",
        "pai_prestacion",
        "pai_circuito",
    }


@pytest.mark.parametrize(
    "modelo",
    (PaiObjetivo, PaiEvaluacionPrevia, PaiEquipo, PaiCoordinacion, PaiTaller,
     PaiPrestacion, PaiCircuito),
)
def test_toda_hija_cuelga_del_pai_y_no_del_expediente(modelo):
    """`pai_id` y no `hce_id`.

    Es la mitad del error que §5.20 le encontró a `hce_taller`: la unidad de
    registro es **la propuesta**, no el expediente. Con `hce_id` no habría forma
    de decir en qué talleres participaba el NNA *en el PAI del primer semestre*.
    """
    cols = _columnas(modelo)
    assert "pai_id" in cols
    assert "hce_id" not in cols


# ==========================================================================
# B · Carga única: se modela como AUSENCIA de columnas (§5.22)
# ==========================================================================
@pytest.mark.parametrize("campo", sorted(LEIDAS_EN_VIVO))
def test_pai_no_copia_ningun_dato_que_se_lee_en_vivo(campo):
    """El corazón de §5.22, y el modo de falla que evita.

    El PAI se entrega a INAU. Con copia propia del centro educativo, un cambio en
    HCE-INC no se refleja y se entrega **un dato desactualizado a un organismo
    del Estado**. Lo mismo vale para los puntajes: el Δ se calcula, no se guarda.
    """
    assert campo not in _columnas(Pai)


def test_la_seccion_v_conserva_lo_que_si_es_del_pai():
    """§5.22 reparte la sección V: `centro`/`modalidad`/`grado` se leen en vivo,
    `apoyosEd` y `otrasEd` **sí** son de PAI. La mitad que se queda, se queda.
    """
    cols = _columnas(Pai)
    assert "apoyos_ed" in cols
    assert "otras_ed" in cols


@pytest.mark.parametrize(
    "campo",
    ("ingreso_ippu", "padron_inau", "disposicion", "judicial", "expediente",
     "derivado_por", "motivo"),
)
def test_los_campos_editables_de_las_secciones_i_y_ii_son_columnas_propias(campo):
    """La excepción medida contra el código (§5.55 / L2).

    La prosa del prototipo generaliza que las secciones I y II se renderizan «en
    solo lectura», pero su render usa **dos helpers distintos, uno al lado del
    otro**: `ro()` sin binding para `sipi`, `convenio` y el diagnóstico, y
    `fecha()`/`sel()`/`txt()`/`ta()` —que escriben en `getP(id).pai.<k>`— para
    estos siete.

    **La prueba que cierra el caso es negativa:** HCE-ORG no tiene dónde
    guardarlos (su objeto es `inau:{sipi, convenio, referente, ingreso, obs,
    envios[]}`). No existe origen del cual leerlos en vivo.
    """
    assert campo in _columnas(Pai)


def test_la_cabecera_tiene_los_39_campos_propios():
    """El conteo que queda del «~46 campos» de la referencia.

    49 claves en `p.pai` − 3 que se leen en vivo (§5.22) − 3 que son colecciones
    y viven en tablas hijas (`prest`, `talleres`, `circuito`) − 4 de la sección
    VII (FODA), que IPPU retiró (§5.42 / I7) y M12.8a sacó del esquema
    (§5.59) = **39**.
    """
    tecnicas = {"id", "hce_id", "creado_en", "actualizado_en"}
    assert len(_columnas(Pai) - tecnicas) == 39


# ==========================================================================
# C · Cardinalidad: N por expediente, y NO anual (§5.22, consecuencia 1)
# ==========================================================================
def test_conviven_dos_pai_del_mismo_anio_en_el_mismo_expediente():
    """**La diferencia con `informe_cierre`**, que sí es anual único.

    El PAI de INAU se revisa en el semestre: en un mismo año conviven el inicial
    y su actualización. Con `UNIQUE(hce_id, anio)`, cargar la actualización
    pisaría el documento contra el cual la sección IX evalúa.
    """
    # Se construye con la misma sesión para que el flush ocurra de verdad.
    assert not any(
        set(c.columns.keys()) == {"hce_id", "anio"}
        for c in Pai.__table__.constraints
        if hasattr(c, "columns")
    )


def test_dos_pai_del_mismo_anio_se_guardan(db):
    h = _hce(db)
    _pai(db, h, tipo=PAI_TIPOS[0], anio=2026)
    _pai(db, h, tipo=PAI_TIPOS[1], anio=2026)
    db.flush()
    assert db.query(Pai).filter_by(hce_id=h.id, anio=2026).count() == 2


def test_borrar_el_expediente_se_lleva_el_pai(db):
    h = _hce(db)
    p = _pai(db, h)
    db.delete(h)
    db.flush()
    assert db.query(Pai).filter_by(id=p.id).first() is None


def test_borrar_el_pai_se_lleva_las_hijas(db):
    p = _pai(db)
    db.add_all([
        PaiObjetivo(pai_id=p.id, area=PAI_AREAS[0], plazo=PAI_PLAZOS[0]),
        PaiTaller(pai_id=p.id, taller_nombre="Taller de huerta"),
        PaiPrestacion(pai_id=p.id, prestacion=PAI_PRESTACIONES[0]),
        PaiCircuito(pai_id=p.id, item=PAI_CIRCUITO[0]),
        PaiEquipo(pai_id=p.id, nombre="Alguien"),
        PaiEvaluacionPrevia(pai_id=p.id, logro=PAI_LOGROS[0]),
        PaiCoordinacion(pai_id=p.id, actor=PAI_COORDINACION_ACTORES[0]),
    ])
    db.flush()
    db.delete(p)
    db.flush()
    for modelo in (PaiObjetivo, PaiTaller, PaiPrestacion, PaiCircuito, PaiEquipo,
                   PaiEvaluacionPrevia, PaiCoordinacion):
        assert db.query(modelo).filter_by(pai_id=p.id).count() == 0


# ==========================================================================
# D · Dominios — el CHECK y la constante no pueden divergir
# ==========================================================================
def test_el_check_y_la_constante_no_pueden_divergir(db):
    """El modo de falla que justifica que los tres vocabularios del PAI sean
    constante y no catálogo (§5.56 / L3).

    Si `PAI_AREAS` gana un valor y la DDL no se toca, la base rechaza algo que el
    código considera válido. Como constante, sumar un área toca a la vez la
    constante, el CHECK y este test — que es la revisión que se quiere. Como
    catálogo editable habría sido un INSERT que nadie ve.
    """
    p = _pai(db)
    for area in PAI_AREAS:
        db.add(PaiObjetivo(pai_id=p.id, area=area))
    for plazo in PAI_PLAZOS:
        db.add(PaiObjetivo(pai_id=p.id, plazo=plazo))
    for prestacion in PAI_PRESTACIONES:
        db.add(PaiPrestacion(pai_id=p.id, prestacion=prestacion))
    for item in PAI_CIRCUITO:
        db.add(PaiCircuito(pai_id=p.id, item=item))
    for actor in PAI_COORDINACION_ACTORES:
        db.add(PaiCoordinacion(pai_id=p.id, actor=actor))
    for logro in PAI_LOGROS:
        db.add(PaiEvaluacionPrevia(pai_id=p.id, logro=logro))
    for decision in PAI_DECISIONES:
        db.add(PaiEvaluacionPrevia(pai_id=p.id, decision=decision))
    for si_no in PAI_SI_NO:
        db.add(PaiEquipo(pai_id=p.id, participo=si_no))
    db.flush()   # ninguno rebota contra su CHECK


@pytest.mark.parametrize(
    "campo,valores",
    (
        ("tipo", PAI_TIPOS),
        ("disposicion", PAI_DISPOSICIONES),
        ("judicial", PAI_SI_NO),
        ("controles", PAI_CONTROLES),
        ("acuerdo", PAI_ACUERDO_FAMILIA),
        ("frecuencia", PAI_FRECUENCIAS),
        ("etapa", PAI_ETAPAS),
    ),
)
def test_la_cabecera_acepta_todo_su_dominio(db, campo, valores):
    h = _hce(db)
    for valor in valores:
        _pai(db, h, **{campo: valor})
    db.flush()


@pytest.mark.parametrize(
    "campo",
    ("tipo", "disposicion", "judicial", "controles", "acuerdo", "frecuencia", "etapa"),
)
def test_la_cabecera_rechaza_lo_que_esta_fuera_del_dominio(db, campo):
    with pytest.raises(IntegrityError):
        _pai(db, **{campo: FUERA_DE_DOMINIO})


@pytest.mark.parametrize(
    "modelo,campo",
    (
        (PaiObjetivo, "area"),
        (PaiObjetivo, "plazo"),
        (PaiEvaluacionPrevia, "logro"),
        (PaiEvaluacionPrevia, "decision"),
        (PaiEquipo, "participo"),
        (PaiCoordinacion, "se_coordina"),
        (PaiPrestacion, "prestacion"),
        (PaiCircuito, "item"),
    ),
)
def test_las_hijas_rechazan_lo_que_esta_fuera_del_dominio(db, modelo, campo):
    p = _pai(db)
    kw = {"pai_id": p.id, campo: FUERA_DE_DOMINIO}
    if modelo is PaiCoordinacion and campo != "actor":
        kw["actor"] = PAI_COORDINACION_ACTORES[0]
    with pytest.raises(IntegrityError):
        db.add(modelo(**kw))
        db.flush()


def test_una_coordinacion_sin_actor_no_se_guarda(db):
    """`actor` es el único CHECK no-nullable del módulo, y puede serlo porque el
    valor **no lo elige el usuario**: viene precargado con la pauta.
    """
    p = _pai(db)
    with pytest.raises(IntegrityError):
        db.add(PaiCoordinacion(pai_id=p.id, actor=None))
        db.flush()


# ==========================================================================
# E · Se guarda el valor, no el índice
# ==========================================================================
def test_la_prestacion_guarda_el_texto_y_no_la_posicion(db):
    """El prototipo marca por posición (`P.prest[ix]`) y esa forma no se copia.

    Con el índice guardado, insertar un ítem en `PAI_PRESTACIONES` correría todos
    los que siguen y **reescribiría en silencio** lo ya registrado — exactamente
    lo que D5 (§5.14) existe para impedir.
    """
    p = _pai(db)
    db.add(PaiPrestacion(pai_id=p.id, prestacion=PAI_PRESTACIONES[3]))
    db.flush()
    fila = db.query(PaiPrestacion).filter_by(pai_id=p.id).one()
    assert fila.prestacion == "Valoración Funcional (Ley 20.378 / Dec. 72/025)"


@pytest.mark.parametrize(
    "modelo,campo,valor",
    (
        (PaiPrestacion, "prestacion", PAI_PRESTACIONES[0]),
        (PaiCircuito, "item", PAI_CIRCUITO[0]),
        (PaiCoordinacion, "actor", PAI_COORDINACION_ACTORES[0]),
    ),
)
def test_un_item_no_se_puede_marcar_dos_veces_en_el_mismo_pai(db, modelo, campo, valor):
    p = _pai(db)
    db.add(modelo(pai_id=p.id, **{campo: valor}))
    db.flush()
    with pytest.raises(IntegrityError):
        db.add(modelo(pai_id=p.id, **{campo: valor}))
        db.flush()


# ==========================================================================
# F · `pai_taller` — el test que §5.21 traspasó desde M12.3
# ==========================================================================
def test_la_participacion_no_tiene_fk_al_catalogo_de_talleres():
    """D5 (§5.14) / §5.20: **por nombre**, nunca por `taller_id`.

    Con FK, retirar un taller obliga a elegir entre `RESTRICT` —que impide
    retirarlo mientras alguien lo haya cursado— y `CASCADE`, que **borra la
    participación**. En los dos casos el catálogo manda sobre el registro
    clínico.
    """
    destinos = {fk.column.table.name for fk in PaiTaller.__table__.foreign_keys}
    assert destinos == {"pai"}
    assert "taller_id" not in _columnas(PaiTaller)


def test_la_participacion_sobrevive_al_retiro_del_taller_del_catalogo(db):
    """**El test que M12.3 no pudo escribir** (§5.21), acá al fin.

    Carga participación en «Taller de huerta», lo retira del catálogo y afirma
    que la participación **sigue legible** y queda **marcada como retirada** — que
    es lo que el prototipo hace en `talleresUI` con la etiqueta «retirado del
    catálogo».
    """
    huerta = Taller(nombre="Taller de huerta", orden=6)
    db.add(huerta)
    db.flush()
    assert huerta.activo is True

    p = _pai(db)
    db.add(PaiTaller(pai_id=p.id, taller_nombre="Taller de huerta"))
    db.flush()

    # El catálogo retira el taller: la oferta cambia por período.
    huerta.retirado_en = date(2026, 3, 1)
    db.flush()

    # 1 · la participación sigue ahí, y sigue siendo legible por su nombre
    fila = db.query(PaiTaller).filter_by(pai_id=p.id).one()
    assert fila.taller_nombre == "Taller de huerta"

    # 2 · y el catálogo la marca como retirada, sin haberla tocado
    del_catalogo = db.query(Taller).filter_by(nombre=fila.taller_nombre).one()
    assert del_catalogo.activo is False


def test_un_taller_borrado_del_catalogo_no_se_lleva_la_participacion(db):
    """El caso extremo del mismo criterio: ni siquiera borrar la fila del
    catálogo toca el registro clínico, porque no hay FK que propague nada.
    """
    t = Taller(nombre="Taller que se borra", orden=99)
    db.add(t)
    db.flush()
    p = _pai(db)
    db.add(PaiTaller(pai_id=p.id, taller_nombre="Taller que se borra"))
    db.flush()

    db.delete(t)
    db.flush()

    assert db.query(PaiTaller).filter_by(pai_id=p.id).one().taller_nombre == (
        "Taller que se borra"
    )


def test_no_se_registra_dos_veces_el_mismo_taller_en_un_pai(db):
    p = _pai(db)
    db.add(PaiTaller(pai_id=p.id, taller_nombre="Taller de cocina"))
    db.flush()
    with pytest.raises(IntegrityError):
        db.add(PaiTaller(pai_id=p.id, taller_nombre="Taller de cocina"))
        db.flush()


def test_el_mismo_taller_puede_estar_en_dos_pai(db):
    """El `UNIQUE` es por propuesta, no global: el NNA cursa el mismo taller en
    el PAI inicial y en la actualización, y son dos hechos distintos.
    """
    h = _hce(db)
    a = _pai(db, h, tipo=PAI_TIPOS[0])
    b = _pai(db, h, tipo=PAI_TIPOS[1])
    db.add_all([
        PaiTaller(pai_id=a.id, taller_nombre="Taller de música y expresión"),
        PaiTaller(pai_id=b.id, taller_nombre="Taller de música y expresión"),
    ])
    db.flush()
    assert db.query(PaiTaller).filter_by(
        taller_nombre="Taller de música y expresión"
    ).count() == 2


def test_el_nombre_del_taller_entra_completo(db):
    """`pai_taller.taller_nombre` es `String(80)`, el mismo largo que
    `taller.nombre`: ningún nombre válido del catálogo se trunca al registrarse.
    El más largo de los 14 reales es «Participación de familia / referentes en
    actividades».
    """
    largo = PaiTaller.__table__.columns["taller_nombre"].type.length
    assert largo == Taller.__table__.columns["nombre"].type.length == 80
