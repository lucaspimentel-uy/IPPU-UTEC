"""M11.3-b · estado de flujo, consentimiento, firma = bloqueo, addendas e IDEA (HCE-LB), por la API.

Convención (la de M11.3-a): **todo rechazo va emparejado con el caso que pasa** (409 ↔ 200,
422 ↔ 200/201), para que un test en verde no pueda deberse a que el endpoint rechaza todo.

La base de test no tiene catálogos: la fixture `bandas` siembra `banda_idea` desde
`catalogos_iniciales.json` (los cortes reales, para que «la banda que el catálogo asigna a 58»
sea la del catálogo y no un literal del test). Los profesionales los crea `crear_profesional`.
"""
import itertools
import json
from datetime import date

import pytest
from sqlalchemy import func, select

from app.core.constantes import IDEA_DIMENSIONES, IDEA_ESCALAS
from app.models.catalogos import BandaIdea
from app.models.modulos import Consentimiento, Idea, InformeCierre, Protocolo
from app.models.transversales import Auditoria
from app.seed_catalogos import DATOS
from app.services import auditoria, fechas, flujo
from app.services import idea as servicio_idea

_cis = itertools.count(2_000_000)

#: Martín (usuario 1 de la demo): D1–D3 = 6·6·6 · D4–D6 = 6·4·4 · D7–D9 = 4·6·4 · D10–D12 = 4·4·4
MARTIN = [6, 6, 6, 6, 4, 4, 4, 6, 4, 4, 4, 4]


# ── Ayudas ───────────────────────────────────────────────────────────────────
def _dim(valores) -> dict:
    return {f"D{i + 1}": {"valor": v} for i, v in enumerate(valores)}


def _hce(client) -> int:
    r = client.post("/hce", json={"persona": {
        "nombre": "Martín", "apellido": "Rodríguez", "ci": f"{next(_cis)}-1", "fecha_nac": "2016-04-12",
    }})
    assert r.status_code == 201, r.text
    return r.json()["data"]["id"]


@pytest.fixture
def equipo(crear_profesional):
    """Dos técnicos activos."""
    return (
        crear_profesional(nombre="Ana", especialidad="Psicología"),
        crear_profesional(nombre="Beto", especialidad="Psicopedagogía"),
    )


@pytest.fixture
def bandas(db_api):
    filas = json.loads(DATOS.read_text(encoding="utf-8"))["banda_idea"]
    for fila in filas:
        db_api.add(BandaIdea(**fila))
    db_api.commit()
    return filas


@pytest.fixture
def hoy(monkeypatch):
    """Congela «hoy». Los servicios leen el reloj sólo por `fechas.hoy()`."""
    def _congelar(dia: date):
        monkeypatch.setattr(fechas, "hoy", lambda: dia)
    return _congelar


#: Síntesis que cumple el recomendado de extensión (§5.117 a, M11.3-c): sin ella, cada firma
#: traería un aviso `recomendacion_no_cumplida` y los `warnings == []` de abajo no probarían lo suyo.
SINTESIS_LARGA = " ".join(["Perfil con mayor compromiso en Relación Social."] * 30)


def _completo(equipo, anio=2026, valores=MARTIN, **extra) -> dict:
    """Cuerpo de alta de un IDEA que se puede firmar (y que cumple los recomendados del §4.3)."""
    return {
        "anio": anio, "dim": _dim(valores), "fecha_consenso": f"{anio}-03-20", "sesiones": 6,
        "sintesis": SINTESIS_LARGA, "objetivos": "Ampliar la iniciación.",
        "evaluador_t1_id": equipo[0].id, "evaluador_t2_id": equipo[1].id, **extra,
    }


def _crear(client, hce_id: int, cuerpo: dict) -> dict:
    r = client.post(f"/hce/{hce_id}/idea", json=cuerpo)
    assert r.status_code == 201, r.text
    return r.json()["data"]


def _firmado(client, hce_id: int, equipo, anio=2026, **extra) -> int:
    idea_id = _crear(client, hce_id, _completo(equipo, anio, **extra))["id"]
    r = client.post(f"/idea/{idea_id}/firmar")
    assert r.status_code == 200, r.text
    return idea_id


def _filas(db_api, hce_id: int, tipo: str | None = None, modulo: str | None = None) -> list[Auditoria]:
    db_api.expire_all()
    consulta = select(Auditoria).where(Auditoria.hce_id == hce_id).order_by(Auditoria.id)
    if tipo:
        consulta = consulta.where(Auditoria.tipo == tipo)
    if modulo:
        consulta = consulta.where(Auditoria.modulo == modulo)
    return list(db_api.scalars(consulta))


def _campos(db_api, idea_id: int, *columnas):
    db_api.expire_all()
    return db_api.execute(select(*columnas).where(Idea.id == idea_id)).one()


def _banda_de(bandas, total: int) -> dict:
    return next(b for b in bandas if b["total_min"] <= total <= b["total_max"])


# ── Totales y banda ──────────────────────────────────────────────────────────
def test_martin_da_58_con_las_escalas_18_14_14_12_y_la_banda_del_catalogo(client, equipo, bandas):
    idea = _crear(client, _hce(client), _completo(equipo))
    assert idea["total"] == 58
    assert (idea["esc_a"], idea["esc_b"], idea["esc_c"], idea["esc_d"]) == (18, 14, 14, 12)
    esperada = _banda_de(bandas, 58)
    assert idea["banda"]["perfil"] == esperada["perfil"] and idea["banda"]["nivel_dsm"] == esperada["nivel_dsm"]
    assert (idea["banda"]["total_min"], idea["banda"]["total_max"]) == (esperada["total_min"], esperada["total_max"])
    assert idea["puntuadas"] == 12 and idea["estado"] == "en_curso" and idea["firmado"] is False


def test_las_escalas_son_trios_consecutivos_y_coinciden_con_el_catalogo():
    assert IDEA_ESCALAS == {
        "A": ("D1", "D2", "D3"), "B": ("D4", "D5", "D6"), "C": ("D7", "D8", "D9"), "D": ("D10", "D11", "D12"),
    }
    catalogo = json.loads(DATOS.read_text(encoding="utf-8"))["idea_dimension"]
    for fila in catalogo:
        assert fila["codigo"] in IDEA_ESCALAS[fila["escala"]], fila


def test_calcular_totales_excluye_ns_y_vacias_y_no_inventa_ceros():
    vacio = servicio_idea.calcular_totales(None)
    assert vacio == {"esc_a": None, "esc_b": None, "esc_c": None, "esc_d": None, "total": None, "puntuadas": 0}
    t = servicio_idea.calcular_totales({
        "D1": {"valor": 2}, "D2": {"valor": "NS"}, "D3": {"valor": None}, "D4": {"valor": 0},
    })
    assert (t["esc_a"], t["esc_b"], t["esc_c"], t["total"], t["puntuadas"]) == (2, 0, None, 2, 2)  # 0 real ≠ sin dato


def test_un_ns_se_excluye_del_total_y_no_se_puede_firmar_y_con_numero_si(client, equipo, bandas):
    hce = _hce(client)
    idea = _crear(client, hce, _completo(equipo))
    r = client.patch(f"/idea/{idea['id']}", json={"dim": {"D5": {"valor": "NS", "obs": "No se observó"}}})
    assert r.status_code == 200
    assert r.json()["data"]["total"] == 54 and r.json()["data"]["esc_b"] == 10 and r.json()["data"]["puntuadas"] == 11
    firmar = client.post(f"/idea/{idea['id']}/firmar")
    assert firmar.status_code == 422 and firmar.json()["code"] == "validation_error"
    assert [d["campo"] for d in firmar.json()["detail"]] == ["dim.D5"]
    # el par que pasa: con número, firma
    assert client.patch(f"/idea/{idea['id']}", json={"dim": {"D5": {"valor": 4}}}).status_code == 200
    ok = client.post(f"/idea/{idea['id']}/firmar")
    assert ok.status_code == 200 and ok.json()["data"]["total"] == 58


@pytest.mark.parametrize("invalido", [9, -1, "4", "ns", 4.5, True])
def test_un_valor_fuera_de_rango_o_de_otro_tipo_es_422(client, equipo, invalido):
    hce = _hce(client)
    r = client.post(f"/hce/{hce}/idea", json={"anio": 2026, "dim": {"D5": {"valor": invalido}}})
    assert r.status_code == 422 and r.json()["code"] == "validation_error"
    assert client.get(f"/hce/{hce}/idea").json() == []  # no se guardó nada


@pytest.mark.parametrize("valido", [0, 8, "NS", None])
def test_los_valores_del_borde_se_aceptan(client, valido):
    hce = _hce(client)
    r = client.post(f"/hce/{hce}/idea", json={"anio": 2026, "dim": {"D5": {"valor": valido}}})
    assert r.status_code == 201 and r.json()["data"]["dim"]["D5"]["valor"] == valido


def test_el_patch_rechaza_valores_invalidos_y_una_clave_que_no_es_dimension(client, equipo):
    idea = _crear(client, _hce(client), _completo(equipo))
    r = client.patch(f"/idea/{idea['id']}", json={"dim": {"D5": {"valor": 9}}})
    assert r.status_code == 422 and r.json()["detail"][0]["campo"] == "dim.D5.valor"
    r = client.patch(f"/idea/{idea['id']}", json={"dim": {"D13": {"valor": 4}}})
    assert r.status_code == 422 and r.json()["detail"][0]["campo"] == "dim.D13"
    assert client.patch(f"/idea/{idea['id']}", json={"dim": {"D12": {"valor": 8}}}).status_code == 200


def test_un_idea_sin_ninguna_dimension_numerica_no_tiene_total_ni_banda(client, bandas):
    idea = _crear(client, _hce(client), {"anio": 2026})
    assert idea["total"] is None and idea["banda"] is None and idea["puntuadas"] == 0
    assert list(idea["dim"]) == list(IDEA_DIMENSIONES) and idea["dim"]["D1"] == {"valor": None, "obs": None}
    con_cero = _crear(client, _hce(client), {"anio": 2026, "dim": {"D1": {"valor": 0}}})
    assert con_cero["total"] == 0 and con_cero["banda"]["total_min"] == 0  # un 0 real sí cuenta


def test_los_totales_se_recalculan_en_cada_patch_sin_firmar_y_quedan_congelados_al_firmar(client, db_api, equipo):
    idea = _crear(client, _hce(client), _completo(equipo))
    iid = idea["id"]
    assert client.patch(f"/idea/{iid}", json={"dim": {"D1": {"valor": 8}}}).json()["data"]["total"] == 60
    assert client.patch(f"/idea/{iid}", json={"dim": {"D1": {"valor": 8}, "D10": {"valor": 0}}}).json()["data"]["total"] == 56
    assert tuple(_campos(db_api, iid, Idea.total, Idea.esc_a, Idea.esc_d)) == (56, 20, 8)
    assert client.post(f"/idea/{iid}/firmar").status_code == 200
    leido = client.get(f"/idea/{iid}").json()
    assert (leido["total"], leido["esc_a"], leido["esc_d"]) == (56, 20, 8)
    assert tuple(_campos(db_api, iid, Idea.total, Idea.esc_a, Idea.esc_d)) == (56, 20, 8)
    # y cualquier intento de moverlo es 409: el total no cambia
    assert client.patch(f"/idea/{iid}", json={"dim": {"D1": {"valor": 0}}}).status_code == 409
    assert client.get(f"/idea/{iid}").json()["total"] == 56


def test_mover_un_corte_de_banda_cambia_la_banda_devuelta_del_mismo_idea_firmado(client, db_api, equipo, bandas):
    iid = _firmado(client, _hce(client), equipo)
    antes = client.get(f"/idea/{iid}").json()
    assert antes["total"] == 58 and antes["banda"]["perfil"] == _banda_de(bandas, 58)["perfil"]
    # IPPU corre el corte: el tramo que contenía a 58 pasa a terminar en 57, y el siguiente empieza en 58
    actual = db_api.scalars(select(BandaIdea).where(BandaIdea.perfil == antes["banda"]["perfil"])).one()
    siguiente = db_api.scalars(select(BandaIdea).where(BandaIdea.orden == actual.orden + 1)).one()
    actual.total_max, siguiente.total_min = 57, 58
    db_api.commit()
    despues = client.get(f"/idea/{iid}").json()
    assert despues["total"] == 58  # congelado
    assert despues["banda"]["perfil"] == siguiente.perfil != antes["banda"]["perfil"]  # derivada
    assert despues["banda"]["total_min"] == 58


# ── Evaluadores y firma ──────────────────────────────────────────────────────
def test_el_mismo_evaluador_dos_veces_es_422_y_dos_distintos_pasa(client, equipo):
    hce = _hce(client)
    r = client.post(f"/hce/{hce}/idea", json=_completo(equipo, evaluador_t2_id=equipo[0].id))
    assert r.status_code == 422 and r.json()["detail"][0]["campo"] == "evaluador_t2_id"
    idea = _crear(client, hce, _completo(equipo))
    mal = client.patch(f"/idea/{idea['id']}", json={"evaluador_t2_id": equipo[0].id})
    assert mal.status_code == 422 and mal.json()["detail"][0]["campo"] == "evaluador_t2_id"
    assert client.post(f"/idea/{idea['id']}/firmar").status_code == 200


def test_falta_un_evaluador_no_se_firma_y_con_los_dos_si(client, equipo):
    hce = _hce(client)
    idea = _crear(client, hce, _completo(equipo, evaluador_t2_id=None))
    r = client.post(f"/idea/{idea['id']}/firmar")
    assert r.status_code == 422 and [d["campo"] for d in r.json()["detail"]] == ["evaluador_t2_id"]
    assert client.patch(f"/idea/{idea['id']}", json={"evaluador_t2_id": equipo[1].id}).status_code == 200
    assert client.post(f"/idea/{idea['id']}/firmar").status_code == 200


def test_un_evaluador_inactivo_se_puede_guardar_pero_no_firma_y_activo_si(client, db_api, equipo, crear_profesional):
    hce = _hce(client)
    inactivo = crear_profesional(nombre="Cora", activo=False)
    idea = _crear(client, hce, _completo(equipo, evaluador_t2_id=inactivo.id))
    r = client.post(f"/idea/{idea['id']}/firmar")
    assert r.status_code == 422 and [d["campo"] for d in r.json()["detail"]] == ["evaluador_t2_id"]
    inactivo.activo = True
    db_api.commit()
    assert client.post(f"/idea/{idea['id']}/firmar").status_code == 200


def test_un_evaluador_que_no_existe_es_422_al_guardar_y_uno_que_existe_es_201(client, equipo):
    hce = _hce(client)
    r = client.post(f"/hce/{hce}/idea", json=_completo(equipo, evaluador_t1_id=99999))
    assert r.status_code == 422 and r.json()["detail"][0]["campo"] == "evaluador_t1_id"
    assert client.post(f"/hce/{hce}/idea", json=_completo(equipo)).status_code == 201


def test_firmar_exige_fecha_sintesis_y_objetivos_del_documento_tecnico_4_3(client, equipo):
    hce = _hce(client)
    idea = _crear(client, hce, {"anio": 2026, "evaluador_t1_id": equipo[0].id, "evaluador_t2_id": equipo[1].id})
    r = client.post(f"/idea/{idea['id']}/firmar")
    assert r.status_code == 422
    campos = [d["campo"] for d in r.json()["detail"]]
    assert campos == [f"dim.D{n}" for n in range(1, 13)] + ["fecha_consenso", "sintesis", "objetivos"]
    # una síntesis en blanco cuenta como faltante; con contenido, pasa
    cuerpo = _completo(equipo)
    cuerpo.update(anio=2027, sintesis="   ", fecha_consenso="2027-03-20")
    otro = _crear(client, hce, cuerpo)
    r = client.post(f"/idea/{otro['id']}/firmar")
    assert r.status_code == 422 and [d["campo"] for d in r.json()["detail"]] == ["sintesis"]
    assert client.patch(f"/idea/{otro['id']}", json={"sintesis": "Con contenido."}).status_code == 200
    assert client.post(f"/idea/{otro['id']}/firmar").status_code == 200


def test_la_firma_guarda_a_los_dos_evaluadores_la_version_del_manual_y_una_fila_de_auditoria(
    client, db_api, equipo, hoy, monkeypatch,
):
    hoy(date(2026, 4, 2))
    monkeypatch.setattr(servicio_idea, "IDEA_MANUAL_VERSION", "Manual X v1")
    hce = _hce(client)
    idea = _crear(client, hce, _completo(equipo))
    assert idea["manual_version"] is None and idea["firmas"] == []
    r = client.post(f"/idea/{idea['id']}/firmar")
    assert r.status_code == 200
    firmado = r.json()
    assert firmado["warnings"] == []
    data = firmado["data"]
    assert data["firmado"] is True and data["estado"] == "firmado" and data["manual_version"] == "Manual X v1"
    assert data["firmas"] == [
        {"profesional_id": equipo[0].id, "rol": "Psicología", "fecha": "2026-04-02"},
        {"profesional_id": equipo[1].id, "rol": "Psicopedagogía", "fecha": "2026-04-02"},
    ]
    filas = _filas(db_api, hce, tipo="firma")
    assert len(filas) == 1 and filas[0].modulo == "HCE-LB" and filas[0].usuario_id is None


def test_un_cambio_posterior_de_la_version_del_manual_no_toca_un_idea_firmado(client, equipo, monkeypatch):
    monkeypatch.setattr(servicio_idea, "IDEA_MANUAL_VERSION", "Manual A")
    iid = _firmado(client, _hce(client), equipo)
    monkeypatch.setattr(servicio_idea, "IDEA_MANUAL_VERSION", "Manual B")
    assert client.get(f"/idea/{iid}").json()["manual_version"] == "Manual A"
    # el par que pasa: un IDEA que se firma después sí lleva la versión nueva
    otro = _firmado(client, _hce(client), equipo)
    assert client.get(f"/idea/{otro}").json()["manual_version"] == "Manual B"


def test_editar_un_idea_firmado_es_409_y_sin_firmar_es_200(client, equipo):
    hce = _hce(client)
    idea = _crear(client, hce, _completo(equipo))
    assert client.patch(f"/idea/{idea['id']}", json={"sesiones": 7}).status_code == 200
    assert client.post(f"/idea/{idea['id']}/firmar").status_code == 200
    r = client.patch(f"/idea/{idea['id']}", json={"sesiones": 8})
    assert r.status_code == 409 and r.json()["code"] == "signed_module"
    assert client.get(f"/idea/{idea['id']}").json()["sesiones"] == 7


def test_firmar_dos_veces_es_409_y_la_primera_sigue_en_pie(client, db_api, equipo):
    hce = _hce(client)
    iid = _firmado(client, hce, equipo)
    r = client.post(f"/idea/{iid}/firmar")
    assert r.status_code == 409 and r.json()["code"] == "signed_module"
    assert len(_filas(db_api, hce, tipo="firma")) == 1
    assert len(client.get(f"/idea/{iid}").json()["firmas"]) == 2


def test_la_addenda_en_un_idea_firmado_se_agrega_con_su_auditoria_y_en_uno_sin_firmar_es_409(client, db_api, equipo, hoy):
    hoy(date(2026, 5, 4))
    hce = _hce(client)
    sin_firmar = _crear(client, hce, _completo(equipo, anio=2025))
    r = client.post(f"/idea/{sin_firmar['id']}/addendas", json={"texto": "Algo", "profesional_id": equipo[0].id})
    assert r.status_code == 409 and r.json()["code"] == "conflict"
    assert _filas(db_api, hce, tipo="addenda") == []
    # el par que pasa
    iid = _firmado(client, hce, equipo, anio=2026)
    r = client.post(f"/idea/{iid}/addendas", json={"texto": "Corrección de fecha.", "profesional_id": equipo[0].id})
    assert r.status_code == 201
    assert r.json()["warnings"] == []
    assert r.json()["data"]["addendas"] == [{"texto": "Corrección de fecha.", "profesional_id": equipo[0].id, "fecha": "2026-05-04"}]
    r2 = client.post(f"/idea/{iid}/addendas", json={"texto": "Segunda.", "profesional_id": equipo[1].id})
    assert [a["texto"] for a in r2.json()["data"]["addendas"]] == ["Corrección de fecha.", "Segunda."]
    filas = _filas(db_api, hce, tipo="addenda")
    assert len(filas) == 2 and all(f.modulo == "HCE-LB" for f in filas)
    # la addenda no toca los datos firmados
    assert client.get(f"/idea/{iid}").json()["total"] == 58


def test_una_addenda_sin_texto_o_de_un_profesional_inexistente_es_422_y_completa_es_201(client, equipo):
    iid = _firmado(client, _hce(client), equipo)
    r = client.post(f"/idea/{iid}/addendas", json={"texto": "   ", "profesional_id": equipo[0].id})
    assert r.status_code == 422 and r.json()["detail"][0]["campo"] == "texto"
    r = client.post(f"/idea/{iid}/addendas", json={"texto": "Algo", "profesional_id": 99999})
    assert r.status_code == 422 and r.json()["detail"][0]["campo"] == "profesional_id"
    assert client.get(f"/idea/{iid}").json()["addendas"] == []
    assert client.post(f"/idea/{iid}/addendas", json={"texto": "Algo", "profesional_id": equipo[0].id}).status_code == 201


def test_una_falla_despues_de_escribir_al_firmar_deja_el_idea_sin_firmar_y_sin_fila_de_auditoria(
    client, db_api, equipo, monkeypatch,
):
    hce = _hce(client)
    idea = _crear(client, hce, _completo(equipo))
    original = auditoria.registrar_evento

    def escribe_y_falla(*args, **kwargs):
        original(*args, **kwargs)  # la fila SÍ se escribe… y después revienta
        raise RuntimeError("falla simulada")

    monkeypatch.setattr(auditoria, "registrar_evento", escribe_y_falla)
    r = client.post(f"/idea/{idea['id']}/firmar")
    assert r.status_code == 500 and r.json()["code"] == "internal_error"
    firmado, firmas, total_mv = _campos(db_api, idea["id"], Idea.firmado, Idea.firmas, Idea.manual_version)
    assert firmado is False and firmas is None and total_mv is None
    assert _filas(db_api, hce, tipo="firma") == []
    # el par que pasa: sin la falla, la misma firma entra completa
    monkeypatch.setattr(auditoria, "registrar_evento", original)
    assert client.post(f"/idea/{idea['id']}/firmar").status_code == 200
    assert len(_filas(db_api, hce, tipo="firma")) == 1


# ── Auditoría de campo ───────────────────────────────────────────────────────
def test_editar_d5_y_d7_deja_exactamente_dos_filas_dim_d5_y_dim_d7_y_un_patch_identico_ninguna(client, db_api, equipo):
    hce = _hce(client)
    idea = _crear(client, hce, _completo(equipo))
    assert _filas(db_api, hce, tipo="edicion", modulo="HCE-LB") == []  # el alta es una `carga`, no ediciones
    r = client.patch(f"/idea/{idea['id']}", json={"dim": {"D5": {"valor": 6}, "D7": {"valor": 2}}})
    assert r.status_code == 200
    filas = _filas(db_api, hce, tipo="edicion", modulo="HCE-LB")
    assert [f.campo for f in filas] == ["dim.D5", "dim.D7"]
    assert json.loads(filas[0].valor_ant)["valor"] == 4 and json.loads(filas[0].valor_nuevo)["valor"] == 6
    assert json.loads(filas[1].valor_ant)["valor"] == 4 and json.loads(filas[1].valor_nuevo)["valor"] == 2
    # el mismo PATCH otra vez: nada cambió → ninguna fila nueva
    assert client.patch(f"/idea/{idea['id']}", json={"dim": {"D5": {"valor": 6}, "D7": {"valor": 2}}}).status_code == 200
    assert len(_filas(db_api, hce, tipo="edicion", modulo="HCE-LB")) == 2


def test_una_fila_por_cada_campo_escalar_que_cambia_y_la_obs_se_conserva_si_no_viene(client, db_api, equipo):
    hce = _hce(client)
    idea = _crear(client, hce, _completo(equipo, dim={**_dim(MARTIN), "D5": {"valor": 4, "obs": "Observación previa"}}))
    r = client.patch(f"/idea/{idea['id']}", json={"sesiones": 7, "sintesis": "Nueva síntesis.", "dim": {"D5": {"valor": 6}}})
    assert r.status_code == 200 and r.json()["data"]["dim"]["D5"] == {"valor": 6, "obs": "Observación previa"}
    assert sorted(f.campo for f in _filas(db_api, hce, tipo="edicion", modulo="HCE-LB")) == ["dim.D5", "sesiones", "sintesis"]


def test_el_alta_deja_una_fila_carga_y_un_idea_sin_dimensiones_cargadas_no_crea_entradas(client, db_api):
    hce = _hce(client)
    _crear(client, hce, {"anio": 2026, "dim": {"D1": {"valor": None, "obs": ""}}})
    cargas = _filas(db_api, hce, tipo="carga", modulo="HCE-LB")
    assert len(cargas) == 1 and "2026" in cargas[0].detalle
    assert db_api.scalar(select(Idea.dim).where(Idea.hce_id == hce)) is None  # NULL de SQL, no `{}` ni `null` de JSON


# ── Alta, duplicados y listas ────────────────────────────────────────────────
def test_el_duplicado_hce_anio_es_409_y_otro_anio_u_otro_expediente_es_201(client, equipo):
    hce = _hce(client)
    _crear(client, hce, {"anio": 2026})
    r = client.post(f"/hce/{hce}/idea", json={"anio": 2026})
    assert r.status_code == 409 and r.json()["detail"][0]["campo"] == "anio"
    assert client.post(f"/hce/{hce}/idea", json={"anio": 2027}).status_code == 201
    assert client.post(f"/hce/{_hce(client)}/idea", json={"anio": 2026}).status_code == 201


def test_el_alta_requiere_anio_y_un_expediente_que_existe(client):
    hce = _hce(client)
    r = client.post(f"/hce/{hce}/idea", json={})
    assert r.status_code == 422 and r.json()["detail"][0]["campo"] == "anio"
    assert client.post(f"/hce/{hce}/idea", json={"anio": 0}).status_code == 422
    assert client.post("/hce/99999/idea", json={"anio": 2026}).status_code == 404
    assert client.post(f"/hce/{hce}/idea", json={"anio": 2026}).status_code == 201


def test_listar_devuelve_el_mayor_anio_primero_y_404_si_no_hay_expediente(client):
    hce = _hce(client)
    for anio in (2025, 2027, 2026):
        _crear(client, hce, {"anio": anio})
    assert [i["anio"] for i in client.get(f"/hce/{hce}/idea").json()] == [2027, 2026, 2025]
    assert client.get("/hce/99999/idea").status_code == 404
    assert client.get("/idea/99999").status_code == 404


def test_vacio_en_fecha_enteros_y_fk_es_null_en_el_idea(client, equipo):
    hce = _hce(client)
    r = client.post(f"/hce/{hce}/idea", json={
        "anio": 2026, "fecha_consenso": "", "sesiones": "", "evaluador_t1_id": "", "sintesis": "  ",
    })
    assert r.status_code == 201
    d = r.json()["data"]
    assert d["fecha_consenso"] is None and d["sesiones"] is None and d["evaluador_t1_id"] is None and d["sintesis"] is None
    assert client.patch(f"/idea/{d['id']}", json={"sesiones": -1}).status_code == 422
    assert client.patch(f"/idea/{d['id']}", json={"sesiones": 0}).status_code == 200


# ── Qué IDEA rige ────────────────────────────────────────────────────────────
def test_vigente_es_el_firmado_de_mayor_anio_y_en_curso_solo_si_es_el_anio_en_curso(client, equipo, hoy):
    hce = _hce(client)
    _firmado(client, hce, equipo, anio=2025)
    firmado_2026 = _firmado(client, hce, equipo, anio=2026)
    sin_firmar_2027 = _crear(client, hce, _completo(equipo, anio=2027))["id"]

    hoy(date(2027, 6, 1))  # 2027 es el año en curso
    r = client.get(f"/hce/{hce}/idea/vigente").json()
    assert r["vigente"]["id"] == firmado_2026 and r["vigente"]["anio"] == 2026
    assert r["en_curso"]["id"] == sin_firmar_2027  # aparte: no desplaza al firmado

    hoy(date(2026, 6, 1))  # 2027 NO es el año en curso: no es «en curso»
    r = client.get(f"/hce/{hce}/idea/vigente").json()
    assert r["vigente"]["id"] == firmado_2026 and r["en_curso"] is None


def test_un_idea_sin_firmar_de_un_anio_pasado_no_es_en_curso_y_el_firmado_gana_aunque_sea_mas_viejo(client, equipo, hoy):
    hoy(date(2027, 6, 1))
    hce = _hce(client)
    firmado_2025 = _firmado(client, hce, equipo, anio=2025)
    _crear(client, hce, {"anio": 2026})  # sin firmar, pero no del año en curso
    r = client.get(f"/hce/{hce}/idea/vigente").json()
    assert r["vigente"]["id"] == firmado_2025 and r["en_curso"] is None
    # el par que pasa: sin firmar del año en curso, sí
    _crear(client, hce, {"anio": 2027})
    assert client.get(f"/hce/{hce}/idea/vigente").json()["en_curso"]["anio"] == 2027


def test_vigente_sin_ideas_es_null_null_y_con_expediente_inexistente_es_404(client):
    hce = _hce(client)
    assert client.get(f"/hce/{hce}/idea/vigente").json() == {"vigente": None, "en_curso": None}
    assert client.get("/hce/99999/idea/vigente").status_code == 404


def test_idea_de_anio_devuelve_el_de_ese_anio_y_none_si_no_hay(client, db_api, equipo):
    hce = _hce(client)
    id_2025 = _firmado(client, hce, equipo, anio=2025)
    _firmado(client, hce, equipo, anio=2026)
    assert servicio_idea.idea_de_anio(db_api, hce, 2025).id == id_2025
    assert servicio_idea.idea_de_anio(db_api, hce, 2024) is None
    assert servicio_idea.idea_de_anio(db_api, 99999, 2025) is None


# ── Flujo ────────────────────────────────────────────────────────────────────
def test_sin_ci_el_estado_es_pendiente_sin_aviso_y_sin_fila_y_con_ci_registrado(client, db_api, equipo, hoy):
    hoy(date(2026, 6, 1))
    hce = _hce(client)
    r = client.get(f"/hce/{hce}/flujo")
    assert r.status_code == 200 and r.json()["ci"] == "pendiente" and r.json()["anio"] == 2026
    # trabajar sin CI: se puede, y no deja aviso ni rastro por la falta del CI
    creado = client.post(f"/hce/{hce}/idea", json=_completo(equipo))
    assert creado.status_code == 201 and creado.json()["warnings"] == []
    firmado = client.post(f"/idea/{creado.json()['data']['id']}/firmar")
    assert firmado.status_code == 200 and firmado.json()["warnings"] == []
    assert _filas(db_api, hce, tipo="excepcion") == [] and _filas(db_api, hce, modulo="HCE-CI") == []
    assert client.get(f"/hce/{hce}/flujo").json()["ci"] == "pendiente"
    # el par que pasa: registrar el CI lo pasa a `registrado`
    assert client.post(f"/hce/{hce}/consentimiento", json={"firmante": "Marta R.", "fecha": "2026-03-02"}).status_code == 201
    flujo_ = client.get(f"/hce/{hce}/flujo").json()
    assert flujo_["ci"] == "registrado"
    lb, pa, pb, ic = flujo_["modulos"]
    assert (lb["modulo"], lb["estado"], lb["faltantes"]) == ("HCE-LB", "firmado", [])
    assert (pa["modulo"], pa["estado"], pa["faltantes"]) == ("HCE-PA", "sin_iniciar", [])
    assert (pb["estado"], pb["faltantes"]) == ("sin_iniciar", ["HCE-PA"])
    assert (ic["modulo"], ic["faltantes"]) == ("HCE-IC", ["HCE-PA", "HCE-PB"])


def test_el_flujo_es_por_anio_y_valida_el_anio_y_el_expediente(client, equipo, hoy):
    hoy(date(2026, 6, 1))
    hce = _hce(client)
    _firmado(client, hce, equipo, anio=2025)
    en_2025 = client.get(f"/hce/{hce}/flujo", params={"anio": 2025}).json()
    en_2026 = client.get(f"/hce/{hce}/flujo").json()
    assert en_2025["modulos"][0]["estado"] == "firmado" and en_2026["modulos"][0]["estado"] == "sin_iniciar"
    assert client.get(f"/hce/{hce}/flujo", params={"anio": 0}).status_code == 422
    assert client.get("/hce/99999/flujo").status_code == 404


def test_un_idea_sin_firmar_esta_en_curso_en_el_flujo(client, equipo, hoy):
    hoy(date(2026, 6, 1))
    hce = _hce(client)
    iid = _crear(client, hce, {"anio": 2026})["id"]
    lb = client.get(f"/hce/{hce}/flujo").json()["modulos"][0]
    assert (lb["estado"], lb["id"]) == ("en_curso", iid)


def test_faltantes_de_pb_con_pa_sin_firmar_lista_pa_y_con_pa_firmado_queda_vacio(db_api, client, equipo):
    hce = _hce(client)
    db_api.add(Idea(hce_id=hce, anio=2026, firmado=True))
    db_api.add(Protocolo(hce_id=hce, tipo="A", anio=2026, firmado=False))
    db_api.commit()
    assert flujo.faltantes(db_api, hce, 2026, "HCE-PB") == ["HCE-PA"]
    assert flujo.estado_modulo(db_api, hce, 2026, "HCE-PA") == "en_curso"
    assert flujo.estado_modulo(db_api, hce, 2026, "HCE-PB") == "sin_iniciar"
    db_api.expire_all()
    db_api.scalars(select(Protocolo).where(Protocolo.hce_id == hce)).one().firmado = True
    db_api.commit()
    assert flujo.faltantes(db_api, hce, 2026, "HCE-PB") == []
    assert flujo.estado_modulo(db_api, hce, 2026, "HCE-PA") == "firmado"


def test_un_eslabon_que_ni_se_inicio_cuenta_como_faltante_y_la_cadena_es_por_anio(db_api, client):
    hce = _hce(client)
    db_api.add(Idea(hce_id=hce, anio=2025, firmado=True))  # LB de OTRO año: no ayuda
    db_api.add(Protocolo(hce_id=hce, tipo="B", anio=2026, firmado=True))
    db_api.add(InformeCierre(hce_id=hce, anio=2026, firmado=False))
    db_api.commit()
    assert flujo.faltantes(db_api, hce, 2026, "HCE-PA") == ["HCE-LB"]
    assert flujo.faltantes(db_api, hce, 2026, "HCE-IC") == ["HCE-LB", "HCE-PA"]  # PB sí está firmado
    assert flujo.faltantes(db_api, hce, 2025, "HCE-PA") == []  # LB-2025 firmado
    assert flujo.faltantes(db_api, hce, 2026, "HCE-LB") == []  # el primero nunca tiene faltantes
    with pytest.raises(ValueError):
        flujo.faltantes(db_api, hce, 2026, "HCE-CI")


def test_fuera_de_secuencia_avisa_y_deja_una_fila_excepcion_y_en_secuencia_no_avisa_ni_escribe(db_api, client):
    hce = _hce(client)
    db_api.add(Idea(hce_id=hce, anio=2026, firmado=True))
    db_api.add(Protocolo(hce_id=hce, tipo="A", anio=2026, firmado=False))
    db_api.commit()
    avisos = flujo.avisos_de_secuencia(db_api, hce_id=hce, anio=2026, modulo="HCE-PB", accion="firma")
    assert avisos == [{
        "code": "fuera_de_secuencia", "mensaje": avisos[0]["mensaje"], "modulo": "HCE-PB", "anio": 2026, "faltan": ["HCE-PA"],
    }]
    filas = _filas(db_api, hce, tipo="excepcion")
    assert len(filas) == 1 and filas[0].modulo == "HCE-PB" and "HCE-PA" in filas[0].detalle
    # el par que pasa: PA sí está en secuencia (LB firmado) → ni aviso ni fila nueva
    assert flujo.avisos_de_secuencia(db_api, hce_id=hce, anio=2026, modulo="HCE-PA", accion="creación") == []
    assert len(_filas(db_api, hce, tipo="excepcion")) == 1


def test_crear_un_idea_nunca_devuelve_fuera_de_secuencia_aunque_haya_otros_modulos_sin_firmar(client, db_api, equipo):
    hce = _hce(client)
    db_api.add(Protocolo(hce_id=hce, tipo="A", anio=2026, firmado=False))
    db_api.add(InformeCierre(hce_id=hce, anio=2026, firmado=False))
    db_api.commit()
    r = client.post(f"/hce/{hce}/idea", json=_completo(equipo))
    assert r.status_code == 201 and r.json()["warnings"] == []
    firmar = client.post(f"/idea/{r.json()['data']['id']}/firmar")
    assert firmar.status_code == 200 and firmar.json()["warnings"] == []
    assert _filas(db_api, hce, tipo="excepcion") == []


# ── Consentimiento ───────────────────────────────────────────────────────────
def test_el_consentimiento_se_registra_se_lee_y_el_get_es_404_mientras_esta_pendiente(client, db_api):
    hce = _hce(client)
    assert client.get(f"/hce/{hce}/consentimiento").status_code == 404
    cuerpo = {
        "firmante": "Marta R. (madre)", "fecha": "2026-03-02",
        "autorizaciones": {"evaluacion": True, "registro": True, "comunicacion": False},
    }
    r = client.post(f"/hce/{hce}/consentimiento", json=cuerpo)
    assert r.status_code == 201 and r.json()["warnings"] == [] and r.json()["data"]["hce_id"] == hce
    assert client.get(f"/hce/{hce}/consentimiento").json()["autorizaciones"] == cuerpo["autorizaciones"]
    cargas = _filas(db_api, hce, tipo="carga", modulo="HCE-CI")
    assert len(cargas) == 1


def test_el_consentimiento_se_registra_una_sola_vez_409_y_en_otro_expediente_es_201(client):
    hce = _hce(client)
    cuerpo = {"firmante": "Marta R.", "fecha": "2026-03-02"}
    assert client.post(f"/hce/{hce}/consentimiento", json=cuerpo).status_code == 201
    assert client.post(f"/hce/{hce}/consentimiento", json=cuerpo).status_code == 409
    assert client.post(f"/hce/{_hce(client)}/consentimiento", json=cuerpo).status_code == 201
    assert client.post("/hce/99999/consentimiento", json=cuerpo).status_code == 404


@pytest.mark.parametrize("cuerpo", [
    {"fecha": "2026-03-02"}, {"firmante": "  ", "fecha": "2026-03-02"}, {"firmante": "Marta"},
    {"firmante": "Marta", "fecha": "2026-03-02", "autorizaciones": {"evaluacion": True}},
    {"firmante": "Marta", "fecha": "2026-03-02", "autorizaciones": {"evaluacion": True, "registro": "si", "comunicacion": True}},
    {"firmante": "Marta", "fecha": "2026-03-02", "autorizaciones": {"evaluacion": True, "registro": True, "comunicacion": True, "otra": True}},
])
def test_un_consentimiento_incompleto_o_con_autorizaciones_mal_formadas_es_422(client, cuerpo):
    hce = _hce(client)
    r = client.post(f"/hce/{hce}/consentimiento", json=cuerpo)
    assert r.status_code == 422 and r.json()["code"] == "validation_error"
    assert client.get(f"/hce/{hce}/consentimiento").status_code == 404  # no quedó registrado
    ok = {"firmante": "Marta", "fecha": "2026-03-02", "autorizaciones": {"evaluacion": True, "registro": True, "comunicacion": True}}
    assert client.post(f"/hce/{hce}/consentimiento", json=ok).status_code == 201


def test_editar_el_consentimiento_audita_por_campo_y_un_patch_identico_no_deja_filas(client, db_api):
    hce = _hce(client)
    client.post(f"/hce/{hce}/consentimiento", json={"firmante": "Marta R.", "fecha": "2026-03-02"})
    r = client.patch(f"/hce/{hce}/consentimiento", json={
        "firmante": "Marta Ramos", "autorizaciones": {"evaluacion": True, "registro": True, "comunicacion": True},
    })
    assert r.status_code == 200 and r.json()["data"]["firmante"] == "Marta Ramos"
    filas = _filas(db_api, hce, tipo="edicion", modulo="HCE-CI")
    assert sorted(f.campo for f in filas) == ["autorizaciones", "firmante"]
    assert [(f.valor_ant, f.valor_nuevo) for f in filas if f.campo == "firmante"] == [("Marta R.", "Marta Ramos")]
    assert client.patch(f"/hce/{hce}/consentimiento", json={"firmante": "Marta Ramos"}).status_code == 200
    assert len(_filas(db_api, hce, tipo="edicion", modulo="HCE-CI")) == 2


def test_editar_el_consentimiento_sin_registrar_es_404_y_no_se_puede_borrar_el_firmante(client):
    hce = _hce(client)
    assert client.patch(f"/hce/{hce}/consentimiento", json={"firmante": "X"}).status_code == 404
    client.post(f"/hce/{hce}/consentimiento", json={"firmante": "Marta", "fecha": "2026-03-02"})
    assert client.patch(f"/hce/{hce}/consentimiento", json={"firmante": ""}).status_code == 422
    assert client.patch(f"/hce/{hce}/consentimiento", json={"fecha": ""}).status_code == 422
    assert client.patch(f"/hce/{hce}/consentimiento", json={"firmante": "Marta R."}).status_code == 200


def test_un_consentimiento_firmado_no_se_edita_409_el_candado_es_generico(client, db_api):
    hce = _hce(client)
    client.post(f"/hce/{hce}/consentimiento", json={"firmante": "Marta", "fecha": "2026-03-02"})
    assert client.patch(f"/hce/{hce}/consentimiento", json={"firmante": "A"}).status_code == 200
    db_api.scalars(select(Consentimiento).where(Consentimiento.hce_id == hce)).one().firmado = True
    db_api.commit()
    r = client.patch(f"/hce/{hce}/consentimiento", json={"firmante": "B"})
    assert r.status_code == 409 and r.json()["code"] == "signed_module"


def test_registrar_el_consentimiento_no_traba_ni_cambia_nada_del_resto(client, db_api, equipo):
    hce = _hce(client)
    antes = client.get(f"/hce/{hce}").json()
    client.post(f"/hce/{hce}/consentimiento", json={"firmante": "Marta", "fecha": "2026-03-02"})
    assert client.get(f"/hce/{hce}").json() == antes
    assert db_api.scalar(select(func.count()).select_from(Auditoria).where(Auditoria.tipo == "excepcion")) == 0


# ── Documentación en Swagger ─────────────────────────────────────────────────
def test_swagger_documenta_cada_endpoint_nuevo_con_ejemplos_y_el_aviso_fuera_de_secuencia(client):
    spec = client.get("/openapi.json").json()
    esperados = {
        ("get", "/hce/{hce_id}/flujo"), ("get", "/hce/{hce_id}/consentimiento"),
        ("post", "/hce/{hce_id}/consentimiento"), ("patch", "/hce/{hce_id}/consentimiento"),
        ("post", "/hce/{hce_id}/idea"), ("get", "/hce/{hce_id}/idea"), ("get", "/hce/{hce_id}/idea/vigente"),
        ("get", "/idea/{idea_id}"), ("patch", "/idea/{idea_id}"),
        ("post", "/idea/{idea_id}/firmar"), ("post", "/idea/{idea_id}/addendas"),
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
    # M11.3-c: el ejemplo `fuera_de_secuencia` se mudó a PA (LB nunca lo produce; ver
    # test_m11_3c_protocolo_ic.py); en la firma del IDEA queda el de los recomendados (§5.117 a).
    firmar = spec["paths"]["/idea/{idea_id}/firmar"]["post"]["responses"]["200"]["content"]["application/json"]["examples"]
    assert "fuera_de_secuencia" not in firmar
    aviso = firmar["recomendacion_no_cumplida"]["value"]["warnings"][0]
    assert aviso["code"] == "recomendacion_no_cumplida" and aviso["modulo"] == "HCE-LB"
