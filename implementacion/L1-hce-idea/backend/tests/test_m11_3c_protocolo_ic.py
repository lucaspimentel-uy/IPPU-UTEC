"""M11.3-c · Protocolos A/B, Δ, alerta, informe de cierre y datos del documento, por la API.

Convención (la de M11.3-a): **todo rechazo va emparejado con el caso que pasa** (409 ↔ 200/201,
422 ↔ 200, TypeError ↔ valor, alerta ↔ sin alerta), para que un test en verde no pueda deberse a
que el endpoint rechaza todo.

La base de test no tiene catálogos: la fixture `tramos` siembra `delta_interpretacion` desde
`catalogos_iniciales.json` (los tramos reales, para que «el valor que dispara la alerta» sea el del
catálogo y no un literal del test). Los números de Martín son los de `demo/js/flujo.js`.
"""
import itertools
import json
from datetime import date

import pytest
from sqlalchemy import select, update

from app.core.constantes import PROTOCOLO_ESCALAS, PROTOCOLO_ITEMS
from app.models.catalogos import DeltaInterpretacion
from app.models.identidad import Grupo, HceDiurna
from app.models.modulos import Idea, InformeCierre, Protocolo
from app.models.transversales import Auditoria
from app.schemas.protocolo import VALORES_PA_MARTIN, VALORES_PB_MARTIN
from app.seed_catalogos import DATOS
from app.services import auditoria, delta
from app.services import idea as servicio_idea

_cis = itertools.count(3_000_000)

MARTIN_IDEA = [6, 6, 6, 6, 4, 4, 4, 6, 4, 4, 4, 4]
SINTESIS_LARGA = " ".join(["Perfil con mayor compromiso en Relación Social."] * 30)


# ── Ayudas ───────────────────────────────────────────────────────────────────
def _hce(client) -> int:
    r = client.post("/hce", json={"persona": {
        "nombre": "Martín", "apellido": "Rodríguez", "ci": f"{next(_cis)}-1", "fecha_nac": "2016-04-12",
    }})
    assert r.status_code == 201, r.text
    return r.json()["data"]["id"]


def _items(valores, obs=None) -> dict:
    """`{"1": {"valor": v}, ...}`; `obs` = `{índice_1_based: texto}`."""
    salida = {str(i + 1): {"valor": v} for i, v in enumerate(valores)}
    for clave, texto in (obs or {}).items():
        salida[str(clave)]["obs"] = texto
    return salida


@pytest.fixture
def equipo(crear_profesional):
    return (
        crear_profesional(nombre="Ana", especialidad="Psicología"),
        crear_profesional(nombre="Beto", especialidad="Psicopedagogía"),
    )


@pytest.fixture
def tramos(db_api):
    filas = json.loads(DATOS.read_text(encoding="utf-8"))["delta_interpretacion"]
    for fila in filas:
        db_api.add(DeltaInterpretacion(**fila))
    db_api.commit()
    return filas


def _prot(equipo, tipo="A", anio=2026, valores=VALORES_PA_MARTIN, **extra) -> dict:
    """Cuerpo de alta de un protocolo que se puede firmar."""
    return {
        "tipo": tipo, "anio": anio, "items": _items(valores), "fecha": f"{anio}-07-07", "semanas": 16,
        "sint_tec1": "Emergencia clara de atención conjunta.", "sint_tec2": "Mayor permanencia en actividades.",
        "evaluador_t1_id": equipo[0].id, "evaluador_t2_id": equipo[1].id, **extra,
    }


def _crear_prot(client, hce, cuerpo) -> dict:
    r = client.post(f"/hce/{hce}/protocolo", json=cuerpo)
    assert r.status_code == 201, r.text
    return r.json()


def _firmar_prot(client, pid) -> dict:
    r = client.post(f"/protocolo/{pid}/firmar")
    assert r.status_code == 200, r.text
    return r.json()


def _idea_firmada(client, hce, equipo, anio=2026, valores=MARTIN_IDEA) -> int:
    r = client.post(f"/hce/{hce}/idea", json={
        "anio": anio, "dim": {f"D{i + 1}": {"valor": v} for i, v in enumerate(valores)},
        "fecha_consenso": f"{anio}-03-18", "sesiones": 6, "sintesis": SINTESIS_LARGA, "objetivos": "Objetivos.",
        "evaluador_t1_id": equipo[0].id, "evaluador_t2_id": equipo[1].id,
    })
    assert r.status_code == 201, r.text
    iid = r.json()["data"]["id"]
    assert client.post(f"/idea/{iid}/firmar").status_code == 200
    return iid


def _ic(anio=2026, **extra) -> dict:
    return {
        "anio": anio, "fecha": f"{anio}-12-19",
        "sint_escala": {e: f"Síntesis de {e}." for e in PROTOCOLO_ESCALAS},
        "val_tec1": "Valoración del técnico 1.", "val_tec2": "Valoración del técnico 2.",
        "recomendaciones": "Recomendaciones.", "orientaciones": "Orientaciones.", **extra,
    }


def _filas(db_api, hce_id, tipo=None, modulo=None) -> list[Auditoria]:
    db_api.expire_all()
    consulta = select(Auditoria).where(Auditoria.hce_id == hce_id).order_by(Auditoria.id)
    if tipo:
        consulta = consulta.where(Auditoria.tipo == tipo)
    if modulo:
        consulta = consulta.where(Auditoria.modulo == modulo)
    return list(db_api.scalars(consulta))


def _cadena(client, hce, equipo, anio=2026) -> dict:
    """LB, PA (60) y PB (79) de Martín firmados, en secuencia. Devuelve los ids y la firma del PB."""
    lb = _idea_firmada(client, hce, equipo, anio)
    pa = _crear_prot(client, hce, _prot(equipo, "A", anio))["data"]["id"]
    _firmar_prot(client, pa)
    pb = _crear_prot(client, hce, _prot(equipo, "B", anio, VALORES_PB_MARTIN, ajustes="Agenda visual."))["data"]["id"]
    firma_pb = _firmar_prot(client, pb)
    return {"lb": lb, "pa": pa, "pb": pb, "firma_pb": firma_pb}


# ── Composición de escalas y totales ─────────────────────────────────────────
def test_las_escalas_del_protocolo_coinciden_con_ippu_item_del_catalogo():
    filas = json.loads(DATOS.read_text(encoding="utf-8"))["ippu_item"]
    desde_catalogo = {f"esc_{n}": tuple(str(f["id"]) for f in filas if f["escala"] == n) for n in range(1, 5)}
    assert PROTOCOLO_ESCALAS == desde_catalogo
    assert PROTOCOLO_ITEMS == tuple(str(f["id"]) for f in sorted(filas, key=lambda f: f["id"]))


def test_martin_pa_60_pb_79_y_delta_mas_19_con_las_escalas_de_la_demo(client, db_api, equipo, tramos):
    hce = _hce(client)
    ids = _cadena(client, hce, equipo)
    pa = client.get(f"/protocolo/{ids['pa']}").json()
    pb = ids["firma_pb"]["data"]
    assert pa["total"] == 60 and [pa[e] for e in PROTOCOLO_ESCALAS] == [16, 15, 16, 13]
    assert pb["total"] == 79 and [pb[e] for e in PROTOCOLO_ESCALAS] == [20, 21, 20, 18]
    assert pb["deltas"] == {"total": 19, "esc_1": 4, "esc_2": 6, "esc_3": 4, "esc_4": 5}
    assert ids["firma_pb"]["warnings"] == [] and pb["alertas"] == []
    assert pb["interpretacion"]["total"]["etiqueta"] == next(t["etiqueta"] for t in tramos if t["delta_min"] == 13)
    assert pa["deltas"] is None and pa["interpretacion"] is None
    assert _filas(db_api, hce, tipo="alerta") == [] and _filas(db_api, hce, tipo="excepcion") == []


def test_los_totales_quedan_null_mientras_falte_un_item_y_se_completan_al_cargarlo(client, equipo):
    hce = _hce(client)
    valores = list(VALORES_PA_MARTIN)
    valores[23] = None
    p = _crear_prot(client, hce, _prot(equipo, valores=valores))["data"]
    assert p["total"] is None and p["esc_4"] is None and p["puntuados"] == 23
    assert [p[e] for e in ("esc_1", "esc_2", "esc_3")] == [16, 15, 16]
    r = client.patch(f"/protocolo/{p['id']}", json={"items": {"24": {"valor": 2}}})
    assert r.status_code == 200 and r.json()["data"]["total"] == 60 and r.json()["data"]["esc_4"] == 13


# ── Validaciones de entrada ──────────────────────────────────────────────────
@pytest.mark.parametrize("valor", [0, 6, "3", 2.5])
def test_un_item_fuera_de_1_a_5_es_422_y_los_extremos_1_y_5_son_200(client, equipo, valor):
    hce = _hce(client)
    p = _crear_prot(client, hce, _prot(equipo, items={}))["data"]
    r = client.patch(f"/protocolo/{p['id']}", json={"items": {"7": {"valor": valor}}})
    assert r.status_code == 422
    assert any(d["campo"] in ("items.7.valor", "items.7.valor.int") or (d["campo"] or "").startswith("items.7") for d in r.json()["detail"])
    for extremo in (1, 5):
        r = client.patch(f"/protocolo/{p['id']}", json={"items": {"7": {"valor": extremo}}})
        assert r.status_code == 200 and r.json()["data"]["items"]["7"]["valor"] == extremo
    assert client.patch(f"/protocolo/{p['id']}", json={"items": {"25": {"valor": 3}}}).status_code == 422


def test_ajustes_en_un_a_es_422_y_en_un_b_es_201(client, equipo):
    hce = _hce(client)
    r = client.post(f"/hce/{hce}/protocolo", json=_prot(equipo, "A", ajustes="Agenda visual."))
    assert r.status_code == 422 and r.json()["detail"][0]["campo"] == "ajustes"
    a = _crear_prot(client, hce, _prot(equipo, "A", ajustes="   "))["data"]  # en blanco = sin ajustes
    assert client.patch(f"/protocolo/{a['id']}", json={"ajustes": "Algo"}).status_code == 422
    b = _crear_prot(client, hce, _prot(equipo, "B", ajustes="Agenda visual."))["data"]
    assert b["ajustes"] == "Agenda visual."


def test_un_protocolo_duplicado_es_409_y_otro_tipo_u_otro_anio_es_201(client, equipo):
    hce = _hce(client)
    _crear_prot(client, hce, _prot(equipo, "A", 2026))
    r = client.post(f"/hce/{hce}/protocolo", json=_prot(equipo, "A", 2026))
    assert r.status_code == 409 and r.json()["code"] == "conflict"
    _crear_prot(client, hce, _prot(equipo, "B", 2026))
    _crear_prot(client, hce, _prot(equipo, "A", 2027))
    assert [(p["anio"], p["tipo"]) for p in client.get(f"/hce/{hce}/protocolo").json()] == [(2027, "A"), (2026, "A"), (2026, "B")]
    assert client.post("/hce/99999/protocolo", json=_prot(equipo)).status_code == 404


# ── Firma: integridad (§4.3) ─────────────────────────────────────────────────
def test_un_item_en_1_sin_observacion_impide_firmar_422_y_con_observacion_firma(client, equipo):
    hce = _hce(client)
    valores = list(VALORES_PA_MARTIN)
    valores[4] = 1
    p = _crear_prot(client, hce, _prot(equipo, valores=valores))["data"]
    r = client.post(f"/protocolo/{p['id']}/firmar")
    assert r.status_code == 422 and [d["campo"] for d in r.json()["detail"]] == ["items.5.obs"]
    assert client.get(f"/protocolo/{p['id']}").json()["firmado"] is False
    assert client.patch(f"/protocolo/{p['id']}", json={"items": {"5": {"obs": "Regresión ante el cambio de sala."}}}).status_code == 200
    assert client.post(f"/protocolo/{p['id']}/firmar").status_code == 200


def test_firmar_un_protocolo_incompleto_detalla_todo_lo_que_falta_y_completo_firma(client, equipo):
    hce = _hce(client)
    valores = list(VALORES_PA_MARTIN)
    valores[0] = None
    valores[9] = 5
    pid = _crear_prot(client, hce, {"tipo": "A", "anio": 2026, "items": _items(valores)})["data"]["id"]
    r = client.post(f"/protocolo/{pid}/firmar")
    assert r.status_code == 422
    assert {d["campo"] for d in r.json()["detail"]} == {
        "items.1", "items.10.obs", "fecha", "sint_tec1", "sint_tec2", "evaluador_t1_id", "evaluador_t2_id",
    }
    completo = {k: v for k, v in _prot(equipo).items() if k not in ("tipo", "anio", "items")}
    completo["items"] = {"1": {"valor": 3}, "10": {"obs": "Gestos comunicativos generalizados."}}
    assert client.patch(f"/protocolo/{pid}", json=completo).status_code == 200
    assert client.post(f"/protocolo/{pid}/firmar").status_code == 200


def test_crear_con_un_evaluador_inexistente_es_422(client, equipo):
    hce = _hce(client)
    r = client.post(f"/hce/{hce}/protocolo", json=_prot(equipo, evaluador_t2_id=999_999))
    assert r.status_code == 422 and r.json()["detail"][0]["campo"] == "evaluador_t2_id"
    r = client.post(f"/hce/{hce}/protocolo", json=_prot(equipo, evaluador_t2_id=equipo[0].id))
    assert r.status_code == 422
    _crear_prot(client, hce, _prot(equipo))


def test_firma_bloquea_edicion_409_y_la_addenda_corrige(client, db_api, equipo):
    hce = _hce(client)
    pid = _crear_prot(client, hce, _prot(equipo))["data"]["id"]
    assert client.post(f"/protocolo/{pid}/addendas", json={"texto": "x", "profesional_id": equipo[0].id}).status_code == 409
    assert client.patch(f"/protocolo/{pid}", json={"semanas": 17}).status_code == 200
    _firmar_prot(client, pid)
    r = client.patch(f"/protocolo/{pid}", json={"semanas": 18})
    assert r.status_code == 409 and r.json()["code"] == "signed_module"
    assert client.post(f"/protocolo/{pid}/firmar").status_code == 409
    r = client.post(f"/protocolo/{pid}/addendas", json={"texto": "Corrección.", "profesional_id": equipo[0].id})
    assert r.status_code == 201 and r.json()["data"]["addendas"][0]["texto"] == "Corrección."
    assert r.json()["data"]["semanas"] == 17
    assert [f.modulo for f in _filas(db_api, hce, tipo="addenda")] == ["HCE-PA"]
    assert len(_filas(db_api, hce, tipo="firma", modulo="HCE-PA")) == 1


def test_editar_items_audita_una_fila_por_item_y_un_patch_identico_ninguna(client, db_api, equipo):
    hce = _hce(client)
    pid = _crear_prot(client, hce, _prot(equipo))["data"]["id"]
    assert len(_filas(db_api, hce, tipo="carga", modulo="HCE-PA")) == 1
    cambio = {"items": {"3": {"valor": 4}, "8": {"valor": 4, "obs": "Mejor."}}, "semanas": 17}
    assert client.patch(f"/protocolo/{pid}", json=cambio).status_code == 200
    assert sorted(f.campo for f in _filas(db_api, hce, tipo="edicion")) == ["items.3", "items.8", "semanas"]
    assert client.patch(f"/protocolo/{pid}", json=cambio).status_code == 200
    assert len(_filas(db_api, hce, tipo="edicion")) == 3


# ── Δ ────────────────────────────────────────────────────────────────────────
def test_calcular_delta_con_tipos_mezclados_es_type_error_y_con_el_mismo_tipo_da_el_valor():
    pa = Protocolo(hce_id=1, tipo="A", anio=2026, total=60, esc_1=16, esc_2=15, esc_3=16, esc_4=13)
    pb = Protocolo(hce_id=1, tipo="B", anio=2026, total=79, esc_1=20, esc_2=21, esc_3=20, esc_4=18)
    idea = Idea(hce_id=1, anio=2026, total=58, esc_a=18, esc_b=14, esc_c=14, esc_d=12)
    with pytest.raises(TypeError):
        delta.calcular_delta(pa, idea)
    with pytest.raises(TypeError):
        delta.calcular_delta(idea, pb)
    with pytest.raises(TypeError):
        delta.calcular_delta(60, 79)
    assert delta.calcular_delta(pa, pb) == {"total": 19, "esc_1": 4, "esc_2": 6, "esc_3": 4, "esc_4": 5}
    idea_2027 = Idea(hce_id=1, anio=2027, total=52, esc_a=16, esc_b=12, esc_c=14, esc_d=10)
    assert delta.calcular_delta(idea, idea_2027) == {"total": -6, "esc_a": -2, "esc_b": -2, "esc_c": 0, "esc_d": -2}
    # mismo tipo, mal emparejado
    with pytest.raises(ValueError):
        delta.calcular_delta(pb, pa)
    with pytest.raises(ValueError):
        delta.calcular_delta(idea_2027, idea)


def test_instrumentos_mezclados_por_la_api_son_422_y_no_500(client, equipo, monkeypatch):
    hce = _hce(client)
    _idea_firmada(client, hce, equipo, 2027)
    pid = _crear_prot(client, hce, _prot(equipo, anio=2026))["data"]["id"]
    _firmar_prot(client, pid)
    original = servicio_idea.idea_de_anio

    def devuelve_un_protocolo_el_anio_anterior(db, hce_id, anio):
        if anio == 2026:
            return db.get(Protocolo, pid)
        return original(db, hce_id, anio)

    monkeypatch.setattr(servicio_idea, "idea_de_anio", devuelve_un_protocolo_el_anio_anterior)
    r = client.get(f"/hce/{hce}/idea/delta", params={"anio": 2027})
    assert r.status_code == 422 and r.json()["code"] == "validation_error"
    monkeypatch.setattr(servicio_idea, "idea_de_anio", original)
    r = client.get(f"/hce/{hce}/idea/delta", params={"anio": 2027})
    assert r.status_code == 200 and r.json()["delta"] is None  # no hay IDEA 2026


def test_delta_interanual_del_idea_es_null_sin_los_dos_firmados_y_se_calcula_con_los_dos(client, equipo):
    hce = _hce(client)
    _idea_firmada(client, hce, equipo, 2026)
    r = client.get(f"/hce/{hce}/idea/delta", params={"anio": 2027})
    assert r.status_code == 200 and r.json()["delta"] is None and r.json()["idea_anterior_id"] is not None
    # un IDEA 2027 sin firmar todavía no cuenta
    r = client.post(f"/hce/{hce}/idea", json={"anio": 2027, "dim": {f"D{i + 1}": {"valor": 4} for i in range(12)}})
    iid = r.json()["data"]["id"]
    assert client.get(f"/hce/{hce}/idea/delta", params={"anio": 2027}).json()["delta"] is None
    client.patch(f"/idea/{iid}", json={
        "fecha_consenso": "2027-03-18", "sesiones": 6, "sintesis": SINTESIS_LARGA, "objetivos": "O.",
        "evaluador_t1_id": equipo[0].id, "evaluador_t2_id": equipo[1].id,
    })
    assert client.post(f"/idea/{iid}/firmar").status_code == 200
    d = client.get(f"/hce/{hce}/idea/delta", params={"anio": 2027}).json()
    assert d["delta"] == {"total": 48 - 58, "esc_a": 12 - 18, "esc_b": 12 - 14, "esc_c": 12 - 14, "esc_d": 12 - 12}
    assert d["idea_id"] == iid and d["anio_anterior"] == 2026
    assert client.get(f"/hce/{hce}/idea/delta", params={"anio": 1}).status_code == 422
    assert client.get("/hce/99999/idea/delta", params={"anio": 2027}).status_code == 404


def test_pb_firmado_con_pa_sin_firmar_deja_deltas_null_y_avisa_y_con_pa_firmado_los_escribe(client, db_api, equipo, tramos):
    hce = _hce(client)
    _idea_firmada(client, hce, equipo)
    _crear_prot(client, hce, _prot(equipo, "A"))  # PA sin firmar
    pb = _crear_prot(client, hce, _prot(equipo, "B", valores=VALORES_PB_MARTIN))
    assert [w["faltan"] for w in pb["warnings"]] == [["HCE-PA"]]
    firma = _firmar_prot(client, pb["data"]["id"])
    assert firma["data"]["deltas"] is None and firma["data"]["alertas"] == []
    assert [(w["code"], w["faltan"]) for w in firma["warnings"]] == [("fuera_de_secuencia", ["HCE-PA"])]
    db_api.expire_all()
    assert db_api.scalar(select(Protocolo.deltas).where(Protocolo.id == firma["data"]["id"])) is None
    # el par que pasa: otro expediente con el PA firmado → deltas escritos y sin aviso
    otro = _hce(client)
    ids = _cadena(client, otro, equipo)
    assert ids["firma_pb"]["warnings"] == []
    db_api.expire_all()
    assert db_api.scalar(select(Protocolo.deltas).where(Protocolo.id == ids["pb"]))["total"] == 19


# ── Alerta ───────────────────────────────────────────────────────────────────
def _pa_pb_con_delta_esc_1(client, equipo, delta_esc_1: int) -> tuple[int, dict]:
    """PA con la escala 1 en 24 (todo 4) y el resto en 3; PB igual salvo la escala 1, que baja `−delta`."""
    hce = _hce(client)
    _idea_firmada(client, hce, equipo)
    pa_valores = [4] * 6 + [3] * 18
    pa = _crear_prot(client, hce, _prot(equipo, "A", valores=pa_valores))["data"]["id"]
    _firmar_prot(client, pa)
    esc_1 = [3] * 6  # 18 → Δ −6
    if delta_esc_1 == -7:
        esc_1[5] = 2  # 17 → Δ −7
    pb = _crear_prot(client, hce, _prot(equipo, "B", valores=esc_1 + [3] * 18))["data"]["id"]
    return hce, _firmar_prot(client, pb)


def _tramo_alerta(tramos) -> dict:
    return next(t for t in tramos if t["alerta"])


def test_el_delta_en_el_borde_del_tramo_con_alerta_dispara_alerta_y_auditoria_y_el_adyacente_no(client, db_api, equipo, tramos):
    borde = _tramo_alerta(tramos)["delta_max"]
    assert borde == -7  # el catálogo de hoy; el test de abajo lo mueve
    hce, firma = _pa_pb_con_delta_esc_1(client, equipo, borde)
    assert firma["data"]["deltas"]["esc_1"] == borde
    assert firma["data"]["alertas"] == [{"escala": "esc_1", "delta": borde, "etiqueta": _tramo_alerta(tramos)["etiqueta"]}]
    filas = _filas(db_api, hce, tipo="alerta")
    assert len(filas) == 1 and filas[0].modulo == "HCE-PB" and "esc_1" in filas[0].detalle
    # el par: el valor adyacente (−6) no alerta ni escribe
    hce2, firma2 = _pa_pb_con_delta_esc_1(client, equipo, borde + 1)
    assert firma2["data"]["deltas"]["esc_1"] == borde + 1
    assert firma2["data"]["alertas"] == [] and _filas(db_api, hce2, tipo="alerta") == []


def test_mover_el_tramo_con_alerta_en_el_catalogo_cambia_el_resultado(client, db_api, equipo, tramos):
    # IPPU corre el corte a −6 (por UPDATE, sin tocar el código): −6 pasa a alertar
    db_api.execute(update(DeltaInterpretacion).where(DeltaInterpretacion.alerta.is_(True)).values(delta_max=-6))
    db_api.execute(update(DeltaInterpretacion).where(DeltaInterpretacion.etiqueta == "Regresión leve").values(delta_min=-5))
    db_api.commit()
    hce, firma = _pa_pb_con_delta_esc_1(client, equipo, -6)
    assert firma["data"]["alertas"] == [{"escala": "esc_1", "delta": -6, "etiqueta": "Regresión significativa"}]
    assert len(_filas(db_api, hce, tipo="alerta")) == 1


def test_el_delta_del_total_se_interpreta_pero_no_alerta(client, db_api, equipo, tramos):
    """Documento Técnico §5.2: la alerta es «en una escala». Δ total −8 con ninguna escala ≤ −7."""
    hce = _hce(client)
    _idea_firmada(client, hce, equipo)
    pa = _crear_prot(client, hce, _prot(equipo, "A", valores=[4] * 24))["data"]["id"]
    _firmar_prot(client, pa)
    pb_valores = [4, 4, 4, 4, 3, 3] * 4  # cada escala −2 → total −8
    pb = _firmar_prot(client, _crear_prot(client, hce, _prot(equipo, "B", valores=pb_valores))["data"]["id"])
    assert pb["data"]["deltas"]["total"] == -8
    assert pb["data"]["interpretacion"]["total"]["etiqueta"] == _tramo_alerta(tramos)["etiqueta"]
    assert pb["data"]["alertas"] == [] and _filas(db_api, hce, tipo="alerta") == []


def test_una_falla_despues_de_escribir_al_firmar_el_pb_no_deja_deltas_ni_firma_ni_auditoria(client, db_api, equipo, tramos, monkeypatch):
    hce = _hce(client)
    _idea_firmada(client, hce, equipo)
    pa = _crear_prot(client, hce, _prot(equipo, "A"))["data"]["id"]
    _firmar_prot(client, pa)
    pb = _crear_prot(client, hce, _prot(equipo, "B", valores=VALORES_PB_MARTIN))["data"]["id"]
    antes = len(_filas(db_api, hce))
    original = auditoria.registrar_evento

    def escribe_y_falla(*args, **kwargs):
        original(*args, **kwargs)
        raise RuntimeError("falla simulada")

    monkeypatch.setattr(auditoria, "registrar_evento", escribe_y_falla)
    r = client.post(f"/protocolo/{pb}/firmar")
    assert r.status_code == 500 and r.json()["code"] == "internal_error"
    db_api.expire_all()
    firmado, firmas, deltas, total = db_api.execute(
        select(Protocolo.firmado, Protocolo.firmas, Protocolo.deltas, Protocolo.total).where(Protocolo.id == pb)
    ).one()
    assert firmado is False and firmas is None and deltas is None
    assert len(_filas(db_api, hce)) == antes
    # el par que pasa: sin la falla, la misma firma entra completa
    monkeypatch.setattr(auditoria, "registrar_evento", original)
    assert _firmar_prot(client, pb)["data"]["deltas"]["total"] == 19
    assert len(_filas(db_api, hce, tipo="firma", modulo="HCE-PB")) == 1


# ── Secuencia ────────────────────────────────────────────────────────────────
def test_pa_sin_lb_firmado_avisa_y_deja_una_excepcion_al_crear_y_otra_al_firmar(client, db_api, equipo):
    hce = _hce(client)
    r = _crear_prot(client, hce, _prot(equipo, "A"))
    assert [(w["code"], w["modulo"], w["faltan"]) for w in r["warnings"]] == [("fuera_de_secuencia", "HCE-PA", ["HCE-LB"])]
    assert len(_filas(db_api, hce, tipo="excepcion")) == 1
    assert client.patch(f"/protocolo/{r['data']['id']}", json={"semanas": 17}).json()["warnings"] == []
    assert len(_filas(db_api, hce, tipo="excepcion")) == 1  # guardar no avisa
    f = _firmar_prot(client, r["data"]["id"])
    assert [w["faltan"] for w in f["warnings"]] == [["HCE-LB"]]
    assert len(_filas(db_api, hce, tipo="excepcion", modulo="HCE-PA")) == 2
    # en secuencia: ni aviso ni fila
    otro = _hce(client)
    _idea_firmada(client, otro, equipo)
    r2 = _crear_prot(client, otro, _prot(equipo, "A"))
    assert r2["warnings"] == [] and _firmar_prot(client, r2["data"]["id"])["warnings"] == []
    assert _filas(db_api, otro, tipo="excepcion") == []


def test_ic_sin_pb_firmado_avisa_y_deja_una_excepcion_y_en_secuencia_no(client, db_api, equipo, tramos):
    hce = _hce(client)
    _idea_firmada(client, hce, equipo)
    pa = _crear_prot(client, hce, _prot(equipo, "A"))["data"]["id"]
    _firmar_prot(client, pa)
    r = client.post(f"/hce/{hce}/informe-cierre", json=_ic())
    assert r.status_code == 201
    assert [(w["code"], w["modulo"], w["faltan"]) for w in r.json()["warnings"]] == [("fuera_de_secuencia", "HCE-IC", ["HCE-PB"])]
    assert len(_filas(db_api, hce, tipo="excepcion", modulo="HCE-IC")) == 1
    f = client.post(f"/informe-cierre/{r.json()['data']['id']}/firmar", json={"firmantes": [equipo[0].id, equipo[1].id]})
    assert f.status_code == 200 and [w["faltan"] for w in f.json()["warnings"]] == [["HCE-PB"]]
    assert len(_filas(db_api, hce, tipo="excepcion", modulo="HCE-IC")) == 2
    # en secuencia
    otro = _hce(client)
    _cadena(client, otro, equipo)
    r2 = client.post(f"/hce/{otro}/informe-cierre", json=_ic())
    assert r2.json()["warnings"] == []
    f2 = client.post(f"/informe-cierre/{r2.json()['data']['id']}/firmar", json={"firmantes": [equipo[0].id, equipo[1].id]})
    assert f2.json()["warnings"] == [] and _filas(db_api, otro, tipo="excepcion") == []


# ── Informe de cierre ────────────────────────────────────────────────────────
def test_ic_duplicado_del_mismo_anio_es_409_y_de_otro_anio_es_201(client, equipo):
    hce = _hce(client)
    assert client.post(f"/hce/{hce}/informe-cierre", json=_ic(2026)).status_code == 201
    r = client.post(f"/hce/{hce}/informe-cierre", json=_ic(2026))
    assert r.status_code == 409 and r.json()["code"] == "conflict"
    assert client.post(f"/hce/{hce}/informe-cierre", json=_ic(2027)).status_code == 201
    assert [i["anio"] for i in client.get(f"/hce/{hce}/informe-cierre").json()] == [2027, 2026]
    assert client.post("/hce/99999/informe-cierre", json=_ic()).status_code == 404


def test_firmar_el_ic_exige_integridad_y_dos_firmantes_distintos_y_activos(client, db_api, equipo, crear_profesional):
    hce = _hce(client)
    iid = client.post(f"/hce/{hce}/informe-cierre", json={"anio": 2026, "sint_escala": {"esc_1": "Sólo una."}}).json()["data"]["id"]
    r = client.post(f"/informe-cierre/{iid}/firmar", json={"firmantes": [equipo[0].id, equipo[1].id]})
    assert r.status_code == 422
    assert {d["campo"] for d in r.json()["detail"]} == {
        "sint_escala.esc_2", "sint_escala.esc_3", "sint_escala.esc_4",
        "val_tec1", "val_tec2", "recomendaciones", "orientaciones", "fecha",
    }
    completo = {k: v for k, v in _ic().items() if k != "anio"}
    assert client.patch(f"/informe-cierre/{iid}", json=completo).status_code == 200
    inactivo = crear_profesional(nombre="Inés", activo=False)
    for firmantes in ([equipo[0].id], [equipo[0].id, equipo[0].id], [equipo[0].id, inactivo.id], [equipo[0].id, 999_999]):
        r = client.post(f"/informe-cierre/{iid}/firmar", json={"firmantes": firmantes})
        assert r.status_code == 422 and r.json()["detail"][0]["campo"].startswith("firmantes"), firmantes
    r = client.post(f"/informe-cierre/{iid}/firmar", json={"firmantes": [equipo[0].id, equipo[1].id]})
    assert r.status_code == 200 and r.json()["data"]["firmado"] is True
    assert [f["profesional_id"] for f in r.json()["data"]["firmas"]] == [equipo[0].id, equipo[1].id]
    assert len(_filas(db_api, hce, tipo="firma", modulo="HCE-IC")) == 1
    assert client.post(f"/informe-cierre/{iid}/firmar", json={"firmantes": [equipo[0].id, equipo[1].id]}).status_code == 409


def test_patch_de_un_ic_firmado_es_409_y_sin_firmar_audita_por_escala(client, db_api, equipo):
    hce = _hce(client)
    iid = client.post(f"/hce/{hce}/informe-cierre", json=_ic()).json()["data"]["id"]
    r = client.patch(f"/informe-cierre/{iid}", json={"sint_escala": {"esc_2": "Nueva.", "esc_3": "Síntesis de esc_3."}})
    assert r.status_code == 200 and r.json()["data"]["sint_escala"]["esc_2"] == "Nueva."
    assert [f.campo for f in _filas(db_api, hce, tipo="edicion")] == ["sint_escala.esc_2"]
    assert client.patch(f"/informe-cierre/{iid}", json={"sint_escala": {"esc_9": "x"}}).status_code == 422
    client.post(f"/informe-cierre/{iid}/firmar", json={"firmantes": [equipo[0].id, equipo[1].id]})
    r = client.patch(f"/informe-cierre/{iid}", json={"recomendaciones": "Otra cosa."})
    assert r.status_code == 409 and r.json()["code"] == "signed_module"
    assert client.get(f"/informe-cierre/{iid}").json()["recomendaciones"] == "Recomendaciones."
    r = client.post(f"/informe-cierre/{iid}/addendas", json={"texto": "Aclaración.", "profesional_id": equipo[0].id})
    assert r.status_code == 201 and len(r.json()["data"]["addendas"]) == 1


def test_el_recibi_va_despues_de_la_firma_una_sola_vez_y_con_auditoria(client, db_api, equipo):
    hce = _hce(client)
    iid = client.post(f"/hce/{hce}/informe-cierre", json=_ic()).json()["data"]["id"]
    recibi = {"firmante": "Marta R. (madre)", "fecha": "2026-12-19"}
    r = client.post(f"/informe-cierre/{iid}/recibi", json=recibi)
    assert r.status_code == 409  # sin firmar
    client.post(f"/informe-cierre/{iid}/firmar", json={"firmantes": [equipo[0].id, equipo[1].id]})
    assert client.post(f"/informe-cierre/{iid}/recibi", json={"firmante": "  ", "fecha": "2026-12-19"}).status_code == 422
    assert client.post(f"/informe-cierre/{iid}/recibi", json={"firmante": "Marta", "fecha": ""}).status_code == 422
    r = client.post(f"/informe-cierre/{iid}/recibi", json=recibi)
    assert r.status_code == 201 and r.json()["data"]["recibi"] == recibi
    filas = _filas(db_api, hce, tipo="carga", modulo="HCE-IC")
    assert len(filas) == 2 and "Recibí" in filas[-1].detalle and "Marta" not in filas[-1].detalle
    r = client.post(f"/informe-cierre/{iid}/recibi", json={"firmante": "Otra persona", "fecha": "2026-12-20"})
    assert r.status_code == 409
    assert client.get(f"/informe-cierre/{iid}").json()["recibi"] == recibi


def test_documento_de_un_ic_sin_firmar_es_409_y_firmado_trae_todo_con_el_idea_de_su_anio(client, db_api, equipo, tramos, crear_grupo):
    hce = _hce(client)
    grupo = crear_grupo(nombre="Escolares", anio=2026)
    db_api.execute(update(HceDiurna).where(HceDiurna.id == hce).values(grupo_id=grupo.id))
    db_api.commit()
    ids = _cadena(client, hce, equipo, 2026)
    _idea_firmada(client, hce, equipo, 2027, valores=[2] * 12)  # un año posterior también existe
    iid = client.post(f"/hce/{hce}/informe-cierre", json=_ic()).json()["data"]["id"]
    r = client.get(f"/informe-cierre/{iid}/documento")
    assert r.status_code == 409 and r.json()["code"] == "conflict"
    client.post(f"/informe-cierre/{iid}/firmar", json={"firmantes": [equipo[0].id, equipo[1].id]})
    client.post(f"/informe-cierre/{iid}/recibi", json={"firmante": "Marta", "fecha": "2026-12-19"})
    r = client.get(f"/informe-cierre/{iid}/documento")
    assert r.status_code == 200
    doc = r.json()
    hc_numero = client.get(f"/hce/{hce}").json()["hc_historico"]
    assert doc["expediente"]["hc_numero"] == hc_numero and doc["expediente"]["nombre"] == "Martín"
    assert doc["expediente"]["grupo"] == {"id": grupo.id, "nombre": "Escolares", "anio": 2026}
    assert doc["anio"] == 2026
    assert doc["idea"]["id"] == ids["lb"] and doc["idea"]["anio"] == 2026 and doc["idea"]["total"] == 58
    assert doc["idea"]["firmado"] is True
    assert doc["protocolos"]["a"]["total"] == 60 and doc["protocolos"]["b"]["total"] == 79
    assert doc["protocolos"]["deltas"]["total"] == 19 and doc["protocolos"]["alertas"] == []
    assert doc["protocolos"]["interpretacion"]["esc_2"]["etiqueta"]
    assert doc["informe"]["sint_escala"]["esc_1"] == "Síntesis de esc_1." and doc["informe"]["recibi"]["firmante"] == "Marta"
    assert [f["nombre"] for f in doc["informe"]["firmas"]] == ["Ana", "Beto"]
    assert client.get("/informe-cierre/99999/documento").status_code == 404


def test_el_documento_marca_explicitamente_un_idea_sin_firmar_y_null_si_no_hay(client, equipo):
    hce = _hce(client)
    iid = client.post(f"/hce/{hce}/informe-cierre", json=_ic()).json()["data"]["id"]
    client.post(f"/informe-cierre/{iid}/firmar", json={"firmantes": [equipo[0].id, equipo[1].id]})
    doc = client.get(f"/informe-cierre/{iid}/documento").json()
    assert doc["idea"] is None and doc["protocolos"]["a"] is None and doc["protocolos"]["deltas"] is None
    client.post(f"/hce/{hce}/idea", json={"anio": 2026})
    doc = client.get(f"/informe-cierre/{iid}/documento").json()
    assert doc["idea"]["anio"] == 2026 and doc["idea"]["firmado"] is False and doc["idea"]["estado"] == "en_curso"


# ── Recomendados del IDEA (§5.117 a) ─────────────────────────────────────────
def _idea_para_firmar(client, hce, equipo, **extra) -> int:
    cuerpo = {
        "anio": 2026, "dim": {f"D{i + 1}": {"valor": v} for i, v in enumerate(MARTIN_IDEA)},
        "fecha_consenso": "2026-03-18", "sesiones": 6, "sintesis": SINTESIS_LARGA, "objetivos": "O.",
        "evaluador_t1_id": equipo[0].id, "evaluador_t2_id": equipo[1].id, **extra,
    }
    r = client.post(f"/hce/{hce}/idea", json=cuerpo)
    assert r.status_code == 201, r.text
    return r.json()["data"]["id"]


def test_idea_con_3_sesiones_firma_200_con_aviso_y_con_5_sin_aviso_ni_auditoria(client, db_api, equipo):
    hce = _hce(client)
    iid = _idea_para_firmar(client, hce, equipo, sesiones=3)
    antes = len(_filas(db_api, hce))
    r = client.post(f"/idea/{iid}/firmar")
    assert r.status_code == 200 and r.json()["data"]["firmado"] is True
    assert [(w["code"], w["recomendacion"], w["valor"]) for w in r.json()["warnings"]] == [
        ("recomendacion_no_cumplida", "sesiones", 3)
    ]
    assert len(_filas(db_api, hce)) == antes + 1  # sólo la fila `firma`: el aviso no deja rastro
    otro = _hce(client)
    r = client.post(f"/idea/{_idea_para_firmar(client, otro, equipo, sesiones=5)}/firmar")
    assert r.status_code == 200 and r.json()["warnings"] == []


def test_una_sintesis_corta_avisa_y_sin_sesiones_cargadas_tambien(client, equipo):
    hce = _hce(client)
    r = client.post(f"/idea/{_idea_para_firmar(client, hce, equipo, sesiones=None, sintesis='Síntesis breve.')}/firmar")
    assert r.status_code == 200
    assert sorted(w["recomendacion"] for w in r.json()["warnings"]) == ["sesiones", "sintesis"]
    sintesis = next(w for w in r.json()["warnings"] if w["recomendacion"] == "sintesis")
    assert sintesis["valor"] == 2


# ── Smoke de la cadena y Swagger ─────────────────────────────────────────────
def test_la_cadena_completa_deja_los_cuatro_eslabones_firmados_en_el_flujo(client, equipo, tramos):
    hce = _hce(client)
    assert client.post(f"/hce/{hce}/consentimiento", json={"firmante": "Marta", "fecha": "2026-03-02"}).status_code == 201
    _cadena(client, hce, equipo)
    iid = client.post(f"/hce/{hce}/informe-cierre", json=_ic()).json()["data"]["id"]
    client.post(f"/informe-cierre/{iid}/firmar", json={"firmantes": [equipo[0].id, equipo[1].id]})
    flujo = client.get(f"/hce/{hce}/flujo", params={"anio": 2026}).json()
    assert flujo["ci"] == "registrado"
    assert [(m["modulo"], m["estado"], m["faltantes"]) for m in flujo["modulos"]] == [
        ("HCE-LB", "firmado", []), ("HCE-PA", "firmado", []), ("HCE-PB", "firmado", []), ("HCE-IC", "firmado", []),
    ]
    assert client.get(f"/informe-cierre/{iid}/documento").status_code == 200


def test_swagger_documenta_los_endpoints_nuevos_y_el_aviso_fuera_de_secuencia_en_pa(client):
    spec = client.get("/openapi.json").json()
    esperados = {
        ("post", "/hce/{hce_id}/protocolo"), ("get", "/hce/{hce_id}/protocolo"),
        ("get", "/protocolo/{protocolo_id}"), ("patch", "/protocolo/{protocolo_id}"),
        ("post", "/protocolo/{protocolo_id}/firmar"), ("post", "/protocolo/{protocolo_id}/addendas"),
        ("post", "/hce/{hce_id}/informe-cierre"), ("get", "/hce/{hce_id}/informe-cierre"),
        ("get", "/informe-cierre/{informe_id}"), ("patch", "/informe-cierre/{informe_id}"),
        ("post", "/informe-cierre/{informe_id}/firmar"), ("post", "/informe-cierre/{informe_id}/addendas"),
        ("post", "/informe-cierre/{informe_id}/recibi"), ("get", "/informe-cierre/{informe_id}/documento"),
        ("get", "/hce/{hce_id}/idea/delta"),
    }
    for metodo, ruta in esperados:
        op = spec["paths"][ruta][metodo]
        assert op["summary"], (metodo, ruta)
        ok = next(c for c in op["responses"] if c.startswith("2"))
        contenido = op["responses"][ok]["content"]["application/json"]
        assert "example" in contenido or "examples" in contenido, (metodo, ruta)
        if "requestBody" in op:
            esquema = op["requestBody"]["content"]["application/json"]["schema"]
            nombre = esquema["$ref"].rsplit("/", 1)[-1]
            assert spec["components"]["schemas"][nombre].get("examples"), (metodo, ruta)
    for ruta, codigo in (("/protocolo/{protocolo_id}/firmar", "200"), ("/hce/{hce_id}/protocolo", "201")):
        ejemplos = spec["paths"][ruta]["post"]["responses"][codigo]["content"]["application/json"]["examples"]
        aviso = ejemplos["fuera_de_secuencia"]["value"]["warnings"][0]
        assert aviso["code"] == "fuera_de_secuencia" and aviso["modulo"] == "HCE-PA" and aviso["faltan"] == ["HCE-LB"]
