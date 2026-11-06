"""C7 · Panel institucional: `GET /panel?anio=` — agregados de la HCE calculados por el servidor (§5.159).

Convención del repo: todo rechazo va emparejado con el caso que pasa. Las reglas están en `app/services/panel.py`.
El escenario se arma **a mano** (filas firmadas escritas directo en la base, con valores elegidos) para que cada
número del panel se pueda contar en el test; las reglas de firma y de Δ tienen sus propios tests (M11.3-b/c).
Los catálogos (`banda_idea`, `delta_interpretacion`) se siembran desde `catalogos_iniciales.json`: los cortes son
los reales, y un test los mueve.
"""
import json
from datetime import date
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import event, update

from app.core.constantes import PROTOCOLO_ESCALAS
from app.main import app
from app.models.catalogos import BandaIdea, DeltaInterpretacion
from app.models.identidad import HceDiurna
from app.models.modulos import Consentimiento, Idea, InformeCierre, Protocolo
from app.seed_catalogos import DATOS
from app.services import fechas
from app.services import panel as servicio
from test_m11_3d1_login_listado import _alta

ESCALAS = list(PROTOCOLO_ESCALAS)


@pytest.fixture
def hoy(monkeypatch):
    monkeypatch.setattr(fechas, "hoy", lambda: date(2026, 11, 6))


@pytest.fixture
def catalogos(db_api):
    datos = json.loads(DATOS.read_text(encoding="utf-8"))
    for fila in datos["banda_idea"]:
        db_api.add(BandaIdea(**fila))
    for fila in datos["delta_interpretacion"]:
        db_api.add(DeltaInterpretacion(**fila))
    db_api.commit()
    return datos


# ── Ayudas para escribir filas firmadas ──────────────────────────────────────
def _idea(db, hce, anio, total, firmado=True, esc=(1, 1, 1, 1)):
    db.add(Idea(hce_id=hce, anio=anio, total=total, esc_a=esc[0], esc_b=esc[1], esc_c=esc[2], esc_d=esc[3], firmado=firmado))


def _prot(db, hce, tipo, anio, esc, firmado=True, deltas=None):
    db.add(Protocolo(hce_id=hce, tipo=tipo, anio=anio, total=sum(esc), firmado=firmado, deltas=deltas,
                     **{e: v for e, v in zip(ESCALAS, esc)}))


def _par(db, hce, anio, pa, pb):
    """PA y PB firmados con el `deltas` = B − A que escribe el servidor al firmar (total y escalas)."""
    _prot(db, hce, "A", anio, pa)
    _prot(db, hce, "B", anio, pb, deltas={"total": sum(pb) - sum(pa), **{e: b - a for e, a, b in zip(ESCALAS, pa, pb)}})


def _ci(db, hce):
    db.add(Consentimiento(hce_id=hce, fecha=date(2026, 3, 2), firmado=True))


def _ic(db, hce, anio, firmado=True):
    db.add(InformeCierre(hce_id=hce, anio=anio, firmado=firmado))


@pytest.fixture
def escena(client, db_api, hoy, catalogos, crear_grupo, crear_profesional, hash_test, token_de):
    """Dos grupos de 2026 (Tina en Uno, Otra en Dos) y un técnico sin grupo (Nadie). Cinco NNA:

    - **A** (Uno): CI · IDEA 2026 firmado 58 (Moderado) · PA 15/15/15/15 → PB 19/21/19/20 · IC 2026: ciclo completo.
    - **B** (Uno): sin CI · IDEA 2025 firmado 40 (vigente, Leve a moderado) · IDEA 2026 **sin firmar** ·
      PA 20/20/20/20 → PB 12/22/20/20 (Δ esc_1 −8: **alerta**) · sin IC.
    - **C** (Dos): CI · sin IDEA · PA 2026 sin firmar · PB 2026 firmado **sin `deltas`**.
    - **D** (Dos): CI · IDEA 2026 firmado 10 (Muy leve) · PA → PB de **2025** con Δ esc_2 −9 (alerta de 2025).
    - **E** (Uno, **inactivo**): todo firmado en 2026 con una alerta: no cuenta en nada.
    """
    tina = crear_profesional(nombre="Tina", hashed_password=hash_test)
    otra = crear_profesional(nombre="Otra", hashed_password=hash_test)
    nadie = crear_profesional(nombre="Nadie", hashed_password=hash_test)
    uno = crear_grupo(nombre="Uno", anio=2026, tecnico1_id=tina.id)
    dos = crear_grupo(nombre="Dos", anio=2026, tecnico2_id=otra.id)
    ids = {k: _alta(client, g.id, nombre=k) for k, g in (("A", uno), ("B", uno), ("C", dos), ("D", dos), ("E", uno))}
    a, b, c, d, e = (ids[k] for k in "ABCDE")

    _ci(db_api, a); _idea(db_api, a, 2026, 58); _par(db_api, a, 2026, (15, 15, 15, 15), (19, 21, 19, 20)); _ic(db_api, a, 2026)
    _idea(db_api, b, 2025, 40); _idea(db_api, b, 2026, 20, firmado=False); _par(db_api, b, 2026, (20, 20, 20, 20), (12, 22, 20, 20))
    _ci(db_api, c); _prot(db_api, c, "A", 2026, (10, 10, 10, 10), firmado=False); _prot(db_api, c, "B", 2026, (11, 11, 11, 11))
    _ci(db_api, d); _idea(db_api, d, 2026, 10); _par(db_api, d, 2025, (20, 20, 20, 20), (20, 11, 20, 20))
    _ci(db_api, e); _idea(db_api, e, 2026, 90); _par(db_api, e, 2026, (20, 20, 20, 20), (10, 10, 10, 10)); _ic(db_api, e, 2026)
    db_api.commit()
    db_api.execute(update(HceDiurna).where(HceDiurna.id == e).values(activo=False, fecha_baja=date(2026, 9, 1)))
    db_api.commit()
    return {"ids": ids, "uno": uno, "dos": dos,
            "cab_tina": token_de(tina), "cab_otra": token_de(otra), "cab_nadie": token_de(nadie)}


def _panel(client, headers=None, **params):
    r = client.get("/panel", params=params, headers=headers)
    assert r.status_code == 200, r.text
    return r.json()


def _bandas(d) -> dict[str, int]:
    return {f["perfil"]: f["cantidad"] for f in d["bandas"]["filas"]}


def _por_escala(d, seccion, campo) -> list:
    return [x[campo] for x in d[seccion]["escalas"]]


# ── Cada número, contra el escenario ─────────────────────────────────────────
def test_admin_2026_cada_numero_es_el_del_escenario(client, escena, catalogos):
    d = _panel(client, anio=2026)
    assert (d["anio"], d["alcance"], d["n_activos"]) == (2026, "institucion", 4)               # E está inactivo
    assert d["cobertura_lb"] == {"cantidad": 2, "de": 4, "porcentaje": 50}                    # A y D (el de B no está firmado)
    assert d["ciclos_completos"] == {"cantidad": 1, "de": 4, "porcentaje": 25}                # sólo A
    # Bandas: el IDEA VIGENTE (firmado de mayor año): A 58, B 40 (el de 2025: el de 2026 no está firmado), D 10.
    assert [f["perfil"] for f in d["bandas"]["filas"]] == [b["perfil"] for b in catalogos["banda_idea"]]   # todas, en su orden
    assert [(f["total_min"], f["total_max"], f["nivel_dsm"]) for f in d["bandas"]["filas"]] == [
        (b["total_min"], b["total_max"], b["nivel_dsm"]) for b in catalogos["banda_idea"]]
    assert _bandas(d) == {"Muy leve": 1, "Leve": 0, "Leve a moderado": 1, "Moderado": 1,
                          "Moderado a severo (alta necesidad de apoyo)": 0,
                          "Severo a muy severo (necesidad de apoyo muy sustancial)": 0}
    assert (d["bandas"]["sin_idea_firmado"], d["bandas"]["fuera_de_catalogo"]) == (1, 0)    # C
    # Protocolo: A y B (C tiene el PB sin Δ; D es de 2025; E inactivo).
    assert d["protocolo"]["n_ciclo_ab"] == 2
    assert d["protocolo"]["escalas"] == [
        {"escala": "esc_1", "media_pa": 17.5, "media_pb": 15.5, "media_delta": -2.0},
        {"escala": "esc_2", "media_pa": 17.5, "media_pb": 21.5, "media_delta": 4.0},
        {"escala": "esc_3", "media_pa": 17.5, "media_pb": 19.5, "media_delta": 2.0},
        {"escala": "esc_4", "media_pa": 17.5, "media_pb": 20.0, "media_delta": 2.5},
    ]
    assert d["alertas"] == {"nna_con_alguna": 1, "escalas": [
        {"escala": "esc_1", "cantidad": 1}, {"escala": "esc_2", "cantidad": 0},
        {"escala": "esc_3", "cantidad": 0}, {"escala": "esc_4", "cantidad": 0}]}
    assert d["pendientes_flujo"] == {"ci": 1, "lb": 2, "pa": 2, "pb": 1, "ic": 3}
    assert "nombre" not in json.dumps(d) and "hce_id" not in json.dumps(d)                    # un agregado: sin nombres ni ids


def test_el_anio_por_omision_es_el_en_curso_y_otro_anio_cambia_lo_anual_pero_no_la_banda_vigente(client, escena):
    assert _panel(client) == _panel(client, anio=2026)
    d = _panel(client, anio=2025)
    assert d["anio"] == 2025 and d["n_activos"] == 4
    assert d["cobertura_lb"] == {"cantidad": 1, "de": 4, "porcentaje": 25}                    # el IDEA 2025 de B
    assert d["ciclos_completos"]["cantidad"] == 0
    assert d["bandas"] == _panel(client, anio=2026)["bandas"]                                 # la vigente no depende de `anio`
    assert d["protocolo"]["n_ciclo_ab"] == 1 and _por_escala(d, "protocolo", "media_delta") == [0.0, -9.0, 0.0, 0.0]
    assert d["alertas"]["nna_con_alguna"] == 1 and _por_escala(d, "alertas", "cantidad") == [0, 1, 0, 0]
    assert d["pendientes_flujo"] == {"ci": 1, "lb": 3, "pa": 3, "pb": 3, "ic": 4}


def test_la_alerta_es_por_escala_y_el_total_no_alerta(client, db_api, escena):
    """Un Δ del total que caería en el tramo con alerta, con todas las escalas fuera de él, no cuenta como alerta."""
    f = _alta(client, escena["uno"].id, nombre="F")
    _prot(db_api, f, "A", 2026, (20, 20, 20, 20))
    _prot(db_api, f, "B", 2026, (18, 18, 18, 18), deltas={"total": -8, "esc_1": -2, "esc_2": -2, "esc_3": -2, "esc_4": -2})
    db_api.commit()
    d = _panel(client, anio=2026)
    assert d["protocolo"]["n_ciclo_ab"] == 3 and d["alertas"]["nna_con_alguna"] == 1            # sigue siendo sólo B


def test_las_bandas_siguen_al_catalogo_mover_un_corte_mueve_la_cuenta(client, db_api, escena):
    antes = _bandas(_panel(client, anio=2026))
    assert (antes["Leve a moderado"], antes["Moderado"]) == (1, 1)
    db_api.execute(update(BandaIdea).where(BandaIdea.perfil == "Leve a moderado").values(total_max=58))
    db_api.execute(update(BandaIdea).where(BandaIdea.perfil == "Moderado").values(total_min=59))
    db_api.commit()
    d = _panel(client, anio=2026)
    despues = _bandas(d)
    assert (despues["Leve a moderado"], despues["Moderado"]) == (2, 0)                        # el 58 de A cambió de banda
    assert next(f for f in d["bandas"]["filas"] if f["perfil"] == "Moderado")["total_min"] == 59
    # Un hueco en el catálogo no esconde al NNA: queda en `fuera_de_catalogo` y la suma sigue dando n.
    db_api.execute(update(BandaIdea).where(BandaIdea.perfil == "Muy leve").values(total_max=5))
    db_api.commit()
    d = _panel(client, anio=2026)
    b = d["bandas"]
    assert b["fuera_de_catalogo"] == 1 and sum(f["cantidad"] for f in b["filas"]) + b["sin_idea_firmado"] + 1 == d["n_activos"]


def test_la_alerta_sigue_al_catalogo_de_tramos(client, db_api, escena):
    assert _panel(client, anio=2026)["alertas"]["nna_con_alguna"] == 1
    db_api.execute(update(DeltaInterpretacion).where(DeltaInterpretacion.alerta.is_(True)).values(delta_max=-9))
    db_api.execute(update(DeltaInterpretacion).where(DeltaInterpretacion.etiqueta == "Regresión leve").values(delta_min=-8))
    db_api.commit()
    d = _panel(client, anio=2026)
    assert d["alertas"]["nna_con_alguna"] == 0 and _por_escala(d, "alertas", "cantidad") == [0, 0, 0, 0]   # el −8 ya no alerta
    assert _por_escala(d, "protocolo", "media_delta") == [-2.0, 4.0, 2.0, 2.5]                # la media no se reinterpreta: es la misma


def test_ningun_valor_del_idea_entra_al_protocolo_y_ninguno_del_protocolo_a_la_banda(client, db_api, escena):
    """Instrumentos no homologables (§5.36): cambiar todos los IDEA no mueve el protocolo, y cambiar todos los
    protocolos no mueve la cobertura ni las bandas."""
    base = _panel(client, anio=2026)
    db_api.execute(update(Idea).values(total=96, esc_a=24, esc_b=24, esc_c=24, esc_d=24))
    db_api.commit()
    con_idea = _panel(client, anio=2026)
    assert con_idea["protocolo"] == base["protocolo"] and con_idea["alertas"] == base["alertas"]
    assert con_idea["bandas"] != base["bandas"]                                               # control: el IDEA sí movió la banda
    db_api.execute(update(Protocolo).values(total=120, esc_1=30, esc_2=30, esc_3=30, esc_4=30))
    db_api.commit()
    con_prot = _panel(client, anio=2026)
    assert con_prot["bandas"] == con_idea["bandas"] and con_prot["cobertura_lb"] == con_idea["cobertura_lb"]
    assert con_prot["protocolo"] != con_idea["protocolo"]                                     # control: el protocolo sí cambió
    assert _por_escala(con_prot, "protocolo", "media_delta") == _por_escala(base, "protocolo", "media_delta")   # Δ guardado, no recalculado


def test_pendientes_del_flujo_es_la_misma_regla_que_la_lista_de_hce(client, escena):
    """§5.153 b: Pendientes cuenta, sobre `GET /hce` (activos), el CI no registrado y cada eslabón del año sin firmar."""
    filas = client.get("/hce", params={"limit": 100}).json()
    esperado = {"ci": sum(f["ci"] != "registrado" for f in filas)}
    for clave, modulo in servicio.CLAVES_FLUJO.items():
        esperado[clave] = sum(next(m["estado"] for m in f["flujo"] if m["modulo"] == modulo) != "firmado" for f in filas)
    assert _panel(client, anio=2026)["pendientes_flujo"] == esperado


def test_la_media_redondea_a_un_decimal_mitad_hacia_arriba():
    assert servicio._media([0, 0, 0, 1]) == 0.3                     # 0,25 → 0,3 (el `round` de Python daría 0,2)
    assert servicio._media([-1, 0, 0, 0]) == -0.3                   # simétrico: mitad lejos del cero
    assert servicio._media([1, 2, 2]) == 1.7 and servicio._media([5]) == 5.0
    assert servicio._media([]) is None and servicio._media([None, 4]) == 4.0
    assert servicio._proporcion(1, 8) == {"cantidad": 1, "de": 8, "porcentaje": 13}      # 12,5 → 13
    assert servicio._proporcion(0, 0) == {"cantidad": 0, "de": 0, "porcentaje": None}
    assert isinstance(servicio._redondeo(Decimal("2.5"), "1"), float)


# ── Alcance ──────────────────────────────────────────────────────────────────
def test_un_tecnico_ve_solo_los_agregados_de_sus_grupos(client, escena):
    t = _panel(client, escena["cab_tina"], anio=2026)                                          # A y B
    assert (t["alcance"], t["n_activos"]) == ("mis_grupos", 2)
    assert t["cobertura_lb"] == {"cantidad": 1, "de": 2, "porcentaje": 50}
    assert t["ciclos_completos"] == {"cantidad": 1, "de": 2, "porcentaje": 50}
    assert {k: v for k, v in _bandas(t).items() if v} == {"Leve a moderado": 1, "Moderado": 1}
    assert t["bandas"]["sin_idea_firmado"] == 0
    assert t["protocolo"]["n_ciclo_ab"] == 2 and t["alertas"]["nna_con_alguna"] == 1
    assert t["pendientes_flujo"] == {"ci": 1, "lb": 1, "pa": 0, "pb": 0, "ic": 1}
    o = _panel(client, escena["cab_otra"], anio=2026)                                          # C y D
    assert (o["alcance"], o["n_activos"]) == ("mis_grupos", 2)
    assert o["cobertura_lb"]["cantidad"] == 1 and o["bandas"]["sin_idea_firmado"] == 1
    assert o["protocolo"]["n_ciclo_ab"] == 0 and o["alertas"]["nna_con_alguna"] == 0
    assert o["pendientes_flujo"] == {"ci": 0, "lb": 1, "pa": 2, "pb": 1, "ic": 2}
    a = _panel(client, anio=2026)                                                              # el admin: la institución
    assert a["alcance"] == "institucion" and a["n_activos"] == t["n_activos"] + o["n_activos"]


def test_un_tecnico_sin_grupo_recibe_n_0_con_las_secciones_vacias_pero_bien_formadas(client, escena, catalogos):
    d = _panel(client, escena["cab_nadie"], anio=2026)
    assert (d["alcance"], d["n_activos"]) == ("mis_grupos", 0)
    assert d["cobertura_lb"] == d["ciclos_completos"] == {"cantidad": 0, "de": 0, "porcentaje": None}
    assert [f["perfil"] for f in d["bandas"]["filas"]] == [b["perfil"] for b in catalogos["banda_idea"]]
    assert all(f["cantidad"] == 0 for f in d["bandas"]["filas"]) and d["bandas"]["sin_idea_firmado"] == 0
    assert d["protocolo"] == {"n_ciclo_ab": 0, "escalas": [
        {"escala": e, "media_pa": None, "media_pb": None, "media_delta": None} for e in ESCALAS]}
    assert d["alertas"] == {"nna_con_alguna": 0, "escalas": [{"escala": e, "cantidad": 0} for e in ESCALAS]}
    assert d["pendientes_flujo"] == {"ci": 0, "lb": 0, "pa": 0, "pb": 0, "ic": 0}


def test_sin_catalogos_las_secciones_siguen_bien_formadas(client, hoy):
    """La base de test sin sembrar: sin bandas ni tramos el panel no falla (filas vacías, nada en alerta)."""
    d = _panel(client)
    assert d["n_activos"] == 0 and d["bandas"]["filas"] == [] and d["alertas"]["nna_con_alguna"] == 0


def test_sin_token_es_401_y_con_token_200():
    assert TestClient(app).get("/panel").status_code == 401


def test_con_token_200_y_solo_lectura(client, escena):
    assert client.get("/panel").status_code == 200
    for metodo in ("post", "put", "patch", "delete"):
        assert getattr(client, metodo)("/panel").status_code == 405


# ── Parámetros ───────────────────────────────────────────────────────────────
@pytest.mark.parametrize("anio", ["1", "0", "-3", "32768", "dos mil"])
def test_un_anio_fuera_de_rango_es_422_por_campo(client, escena, anio):
    r = client.get("/panel", params={"anio": anio})
    assert r.status_code == 422 and [x["campo"] for x in r.json()["detail"]] == ["anio"], r.text


@pytest.mark.parametrize("anio", [2, 32767])
def test_los_bordes_del_anio_pasan(client, escena, anio):
    d = _panel(client, anio=anio)
    assert d["anio"] == anio and d["cobertura_lb"]["cantidad"] == 0 and d["n_activos"] == 4


def test_el_servicio_rechaza_el_anio_fuera_de_rango_igual_que_la_ruta(db_api, admin):
    from app.services.errores import ValidationFailed

    with pytest.raises(ValidationFailed):
        servicio.calcular(db_api, admin, 1)
    assert servicio.calcular(db_api, admin, 2)["anio"] == 2


# ── Consultas fijas ──────────────────────────────────────────────────────────
def _consultas(conexion, llamada) -> int:
    contador = {"n": 0}

    def _cuenta(*_a, **_k):
        contador["n"] += 1

    event.listen(conexion, "before_cursor_execute", _cuenta)
    try:
        llamada()
    finally:
        event.remove(conexion, "before_cursor_execute", _cuenta)
    return contador["n"]


#: Sentencias de un `GET /panel` con el alcance no vacío, medidas en la conexión de test: SAVEPOINT + usuario del
#: token + ids del alcance + CI + los tres eslabones del flujo (IDEA, protocolos, IC) + IDEA firmados + bandas +
#: protocolos firmados del año + tramos + ROLLBACK TO SAVEPOINT. No depende de cuántos expedientes haya.
CONSULTAS_GET_PANEL = 12


def test_el_panel_hace_siempre_las_mismas_consultas(client, conexion_api, db_api, escena):
    pocas = _consultas(conexion_api, lambda: client.get("/panel"))
    for i in range(6):
        h = _alta(client, escena["uno"].id if i % 2 else escena["dos"].id, nombre=f"N{i}")
        _ci(db_api, h)
        _idea(db_api, h, 2025, 30 + i)
        _idea(db_api, h, 2026, 40 + i)
        _par(db_api, h, 2026, (10 + i, 12, 14, 16), (12, 12 + i, 10, 18))
        _ic(db_api, h, 2026, firmado=bool(i % 3))
    db_api.commit()
    muchas = _consultas(conexion_api, lambda: client.get("/panel"))
    tecnico = _consultas(conexion_api, lambda: client.get("/panel", params={"anio": 2025}, headers=escena["cab_tina"]))
    assert pocas == muchas == tecnico == CONSULTAS_GET_PANEL, (pocas, muchas, tecnico)
    # Con el alcance vacío, el CI y el flujo no consultan: menos sentencias, nunca más.
    vacio = _consultas(conexion_api, lambda: client.get("/panel", headers=escena["cab_nadie"]))
    assert vacio < CONSULTAS_GET_PANEL
