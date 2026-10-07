"""M11.3-d1 · Δ del PB firmado antes que su PA, recomendados de PA/PB/IC, huecos de la revisión de
b+c y HCE-VF (valoración funcional).

Convención de la suite: **todo rechazo va emparejado con el caso que pasa**. Los cuerpos y ayudas
de la cadena (Martín: IDEA 58 · PA 60 · PB 79 · Δ +19) se reusan de `test_m11_3c_protocolo_ic.py`.
"""
import ast
import inspect
import json
from datetime import date, timedelta
from decimal import Decimal

import pytest
from sqlalchemy import select, update

from app.models.catalogos import BaremoCategoria
from app.models.identidad import Profesional
from app.models.modulos import Protocolo
from app.schemas.protocolo import VALORES_PA_MARTIN, VALORES_PB_MARTIN
from app.seed_catalogos import DATOS
from app.services import auditoria, fechas
from app.services import valoracion_funcional as servicio_vf
from tests.test_m11_3c_protocolo_ic import (  # noqa: F401  (`equipo` y `tramos` son fixtures)
    SINTESIS_TECNICO, _crear_prot, _filas, _firmar_prot, _hce, _ic, _idea_firmada, _idea_para_firmar,
    _prot, _sint_escala, equipo, tramos,
)


def _palabras(n: int) -> str:
    return " ".join(["palabra"] * n)


def _warnings_de(respuesta: dict, code="recomendacion_no_cumplida") -> list[tuple[str, int | None]]:
    return [(w["recomendacion"], w["valor"]) for w in respuesta["warnings"] if w["code"] == code]


def _deltas_en_base(db_api, pid):
    db_api.expire_all()
    return db_api.scalar(select(Protocolo.deltas).where(Protocolo.id == pid))


# ── (a) PB firmado antes que su PA ───────────────────────────────────────────
def _pb_antes_que_pa(client, equipo, hce) -> tuple[int, int, dict]:
    """LB firmado; PA creado sin firmar; PB creado y firmado (sin Δ). Devuelve (pa, pb, firma_pb)."""
    _idea_firmada(client, hce, equipo)
    pa = _crear_prot(client, hce, _prot(equipo, "A"))["data"]["id"]
    pb = _crear_prot(client, hce, _prot(equipo, "B", valores=VALORES_PB_MARTIN, ajustes="Agenda."))["data"]["id"]
    return pa, pb, _firmar_prot(client, pb)


def test_pb_firmado_antes_y_despues_el_pa_completa_el_delta_del_pb_y_el_documento_lo_muestra(
    client, db_api, equipo, tramos,
):
    hce = _hce(client)
    pa, pb, firma_pb = _pb_antes_que_pa(client, equipo, hce)
    assert firma_pb["data"]["deltas"] is None
    firma_pa = _firmar_prot(client, pa)
    assert firma_pa["data"]["firmado"] is True and firma_pa["warnings"] == []
    assert _deltas_en_base(db_api, pb) == {"total": 19, "esc_1": 4, "esc_2": 6, "esc_3": 4, "esc_4": 5}
    filas = [f for f in _filas(db_api, hce, tipo="edicion") if f.campo == "deltas"]
    assert len(filas) == 1 and filas[0].modulo == "HCE-PB" and filas[0].valor_ant is None
    assert json.loads(filas[0].valor_nuevo)["total"] == 19
    leido = client.get(f"/protocolo/{pb}").json()
    assert leido["deltas"]["total"] == 19 and leido["interpretacion"]["total"]["etiqueta"]
    iid = client.post(f"/hce/{hce}/informe-cierre", json=_ic()).json()["data"]["id"]
    client.post(f"/informe-cierre/{iid}/firmar", json={"firmantes": [equipo[0].id, equipo[1].id]})
    doc = client.get(f"/informe-cierre/{iid}/documento").json()
    assert doc["protocolos"]["deltas"]["total"] == 19


def test_pa_firmado_primero_no_cambia_nada_y_no_deja_fila_de_deltas(client, db_api, equipo, tramos):
    hce = _hce(client)
    _idea_firmada(client, hce, equipo)
    pa = _crear_prot(client, hce, _prot(equipo, "A"))["data"]["id"]
    _firmar_prot(client, pa)
    pb = _crear_prot(client, hce, _prot(equipo, "B", valores=VALORES_PB_MARTIN))["data"]["id"]
    assert _firmar_prot(client, pb)["data"]["deltas"]["total"] == 19
    assert [f for f in _filas(db_api, hce, tipo="edicion") if f.campo == "deltas"] == []


def test_pa_firmado_con_el_pb_sin_firmar_no_le_escribe_deltas(client, db_api, equipo, tramos):
    hce = _hce(client)
    _idea_firmada(client, hce, equipo)
    pa = _crear_prot(client, hce, _prot(equipo, "A"))["data"]["id"]
    pb = _crear_prot(client, hce, _prot(equipo, "B", valores=VALORES_PB_MARTIN))["data"]["id"]
    _firmar_prot(client, pa)
    assert _deltas_en_base(db_api, pb) is None  # el Δ lo escribe la firma del PB, como siempre
    assert _firmar_prot(client, pb)["data"]["deltas"]["total"] == 19


def test_una_falla_despues_de_escribir_el_delta_al_firmar_el_pa_no_deja_ni_firma_ni_delta(
    client, db_api, equipo, tramos, monkeypatch,
):
    hce = _hce(client)
    pa, pb, _ = _pb_antes_que_pa(client, equipo, hce)
    antes = len(_filas(db_api, hce))
    original = auditoria.registrar_cambios

    def escribe_y_falla(*args, **kwargs):
        filas = original(*args, **kwargs)
        if "deltas" in kwargs["despues"]:
            raise RuntimeError("falla simulada")
        return filas

    monkeypatch.setattr(auditoria, "registrar_cambios", escribe_y_falla)
    r = client.post(f"/protocolo/{pa}/firmar")
    assert r.status_code == 500 and r.json()["code"] == "internal_error"
    db_api.expire_all()
    assert db_api.scalar(select(Protocolo.firmado).where(Protocolo.id == pa)) is False
    assert _deltas_en_base(db_api, pb) is None and len(_filas(db_api, hce)) == antes
    monkeypatch.setattr(auditoria, "registrar_cambios", original)  # el par: sin la falla, entra todo
    assert _firmar_prot(client, pa)["data"]["firmado"] is True
    assert _deltas_en_base(db_api, pb)["total"] == 19


def test_el_delta_tardio_que_cae_en_alerta_escribe_la_fila_alerta(client, db_api, equipo, tramos):
    hce = _hce(client)
    _idea_firmada(client, hce, equipo)
    pa = _crear_prot(client, hce, _prot(equipo, "A", valores=[4] * 6 + [3] * 18))["data"]["id"]
    pb = _crear_prot(client, hce, _prot(equipo, "B", valores=[3] * 5 + [2] + [3] * 18))["data"]["id"]  # esc_1 Δ −7
    _firmar_prot(client, pb)
    assert _filas(db_api, hce, tipo="alerta") == []
    _firmar_prot(client, pa)
    filas = _filas(db_api, hce, tipo="alerta")
    assert len(filas) == 1 and filas[0].modulo == "HCE-PB" and "esc_1" in filas[0].detalle
    assert client.get(f"/protocolo/{pb}").json()["alertas"][0]["escala"] == "esc_1"


# ── (c) Recomendados de PA/PB e IC ───────────────────────────────────────────
@pytest.mark.parametrize(("semanas", "avisa"), [(14, True), (15, False), (None, True)])
def test_semanas_por_debajo_de_15_avisa_y_15_no(client, equipo, semanas, avisa):
    hce = _hce(client)
    _idea_firmada(client, hce, equipo)
    pa = _crear_prot(client, hce, _prot(equipo, "A", semanas=semanas))["data"]["id"]
    firma = _firmar_prot(client, pa)
    assert firma["data"]["firmado"] is True
    assert _warnings_de(firma) == ([("semanas", semanas)] if avisa else [])


@pytest.mark.parametrize(("palabras", "avisa"), [(112, True), (113, False)])
def test_sintesis_de_tecnico_de_112_palabras_avisa_y_113_no(client, db_api, equipo, palabras, avisa):
    hce = _hce(client)
    _idea_firmada(client, hce, equipo)
    pa = _crear_prot(client, hce, _prot(equipo, "A", sint_tec2=_palabras(palabras)))["data"]["id"]
    antes = len(_filas(db_api, hce))
    firma = _firmar_prot(client, pa)
    assert _warnings_de(firma) == ([("sint_tec2", palabras)] if avisa else [])
    aviso = firma["warnings"][0] if avisa else None
    assert aviso is None or (aviso["modulo"] == "HCE-PA" and aviso["minimo"] == 113)
    assert len(_filas(db_api, hce)) == antes + 1  # sólo la fila `firma`: el aviso no deja rastro


@pytest.mark.parametrize(("palabras", "avisa"), [(74, True), (75, False)])
def test_sintesis_de_escala_del_ic_de_74_palabras_avisa_y_75_no(client, equipo, palabras, avisa):
    hce = _hce(client)
    sint = {e: _sint_escala(e) for e in ("esc_1", "esc_2", "esc_3", "esc_4")}
    sint["esc_3"] = _palabras(palabras)
    iid = client.post(f"/hce/{hce}/informe-cierre", json=_ic(sint_escala=sint)).json()["data"]["id"]
    r = client.post(f"/informe-cierre/{iid}/firmar", json={"firmantes": [equipo[0].id, equipo[1].id]})
    assert r.status_code == 200 and r.json()["data"]["firmado"] is True
    assert _warnings_de(r.json()) == ([("sint_escala.esc_3", palabras)] if avisa else [])


@pytest.mark.parametrize(("palabras", "avisa"), [(149, True), (150, False)])
def test_sintesis_del_idea_de_149_palabras_avisa_y_150_no(client, equipo, palabras, avisa):
    hce = _hce(client)
    r = client.post(f"/idea/{_idea_para_firmar(client, hce, equipo, sintesis=_palabras(palabras))}/firmar")
    assert r.status_code == 200
    assert _warnings_de(r.json()) == ([("sintesis", palabras)] if avisa else [])


# ── Huecos de la revisión de b+c ─────────────────────────────────────────────
@pytest.mark.parametrize("tipo", ["A", "B"])
def test_firmar_un_protocolo_con_un_evaluador_inactivo_es_422_y_reactivado_firma(client, db_api, equipo, tipo):
    hce = _hce(client)
    _idea_firmada(client, hce, equipo)
    if tipo == "B":
        _firmar_prot(client, _crear_prot(client, hce, _prot(equipo, "A"))["data"]["id"])
    pid = _crear_prot(client, hce, _prot(equipo, tipo, valores=VALORES_PB_MARTIN if tipo == "B" else VALORES_PA_MARTIN))["data"]["id"]
    db_api.execute(update(Profesional).where(Profesional.id == equipo[1].id).values(activo=False))
    db_api.commit()
    r = client.post(f"/protocolo/{pid}/firmar")
    assert r.status_code == 422
    assert r.json()["detail"] == [{"campo": "evaluador_t2_id", "mensaje": "El evaluador tiene que ser un profesional activo"}]
    db_api.execute(update(Profesional).where(Profesional.id == equipo[1].id).values(activo=True))
    db_api.commit()
    assert client.post(f"/protocolo/{pid}/firmar").status_code == 200


@pytest.mark.parametrize("tipo", ["A", "B"])
def test_un_evaluador_repetido_es_422_y_no_llega_a_la_firma(client, equipo, tipo):
    """El CHECK `evaluadores_distintos` impide guardar el par repetido, así que el 422 sale **al
    guardarlo** (crear o PATCH) y la firma nunca ve uno; el par válido firma."""
    hce = _hce(client)
    r = client.post(f"/hce/{hce}/protocolo", json=_prot(equipo, tipo, evaluador_t2_id=equipo[0].id))
    assert r.status_code == 422 and r.json()["detail"][0]["campo"] == "evaluador_t2_id"
    pid = _crear_prot(client, hce, _prot(equipo, tipo))["data"]["id"]
    r = client.patch(f"/protocolo/{pid}", json={"evaluador_t2_id": equipo[0].id})
    assert r.status_code == 422 and r.json()["detail"][0]["campo"] == "evaluador_t2_id"
    assert client.post(f"/protocolo/{pid}/firmar").status_code == 200


def test_una_falla_despues_de_la_fila_alerta_no_deja_ni_la_alerta_ni_la_firma(
    client, db_api, equipo, tramos, monkeypatch,
):
    hce = _hce(client)
    _idea_firmada(client, hce, equipo)
    _firmar_prot(client, _crear_prot(client, hce, _prot(equipo, "A", valores=[4] * 6 + [3] * 18))["data"]["id"])
    pb = _crear_prot(client, hce, _prot(equipo, "B", valores=[3] * 5 + [2] + [3] * 18))["data"]["id"]
    original = auditoria.registrar_evento

    def alerta_y_falla(*args, **kwargs):
        fila = original(*args, **kwargs)
        if kwargs.get("tipo") == "alerta":
            raise RuntimeError("falla simulada después de la alerta")
        return fila

    monkeypatch.setattr(auditoria, "registrar_evento", alerta_y_falla)
    r = client.post(f"/protocolo/{pb}/firmar")
    assert r.status_code == 500
    db_api.expire_all()
    assert db_api.scalar(select(Protocolo.firmado).where(Protocolo.id == pb)) is False
    assert _filas(db_api, hce, tipo="alerta") == [] and _deltas_en_base(db_api, pb) is None
    monkeypatch.setattr(auditoria, "registrar_evento", original)  # el par
    assert _firmar_prot(client, pb)["data"]["alertas"][0]["escala"] == "esc_1"
    assert len(_filas(db_api, hce, tipo="alerta")) == 1


# ── HCE-VF ───────────────────────────────────────────────────────────────────
@pytest.fixture
def baremo(db_api):
    filas = json.loads(DATOS.read_text(encoding="utf-8"))["baremo_categoria"]
    for fila in filas:
        db_api.add(BaremoCategoria(**fila))
    db_api.commit()
    return filas


def _vf(client, hce, **cuerpo) -> dict:
    r = client.post(f"/hce/{hce}/valoracion-funcional", json=cuerpo)
    assert r.status_code == 201, r.text
    return r.json()["data"]


def test_vf_alta_lectura_y_una_por_expediente(client, db_api, baremo):
    hce = _hce(client)
    assert client.get(f"/hce/{hce}/valoracion-funcional").status_code == 404
    data = _vf(client, hce, estado="Vigente", fecha="2025-11-10", organismo="MIDES", pct=58,
               dominios={"comunicacion": "Apoyo frecuente"})
    assert data["categoria"]["categoria"] == "Severo" and data["categoria_etiqueta"] == "Severo"
    assert Decimal(data["pct"]) == 58 and data["dominios"] == {"comunicacion": "Apoyo frecuente"}
    assert client.get(f"/hce/{hce}/valoracion-funcional").json() == data
    r = client.post(f"/hce/{hce}/valoracion-funcional", json={"pct": 10})
    assert r.status_code == 409
    assert [f.tipo for f in _filas(db_api, hce, modulo="HCE-VF")] == ["carga"]
    assert client.post(f"/hce/{hce + 999}/valoracion-funcional", json={}).status_code == 404


@pytest.mark.parametrize(("pct", "categoria"), [
    (0, "Sin discapacidad"), (4, "Sin discapacidad"), ("4.99", "Sin discapacidad"), (5, "Leve"),
    ("24.5", "Leve"), (25, "Moderado"), (49, "Moderado"), (50, "Severo"), (58, "Severo"),
    (95, "Severo"), (96, "Muy severo"), (100, "Muy severo"),
])
def test_la_categoria_sale_de_pct_con_los_cortes_del_catalogo(client, baremo, pct, categoria):
    assert _vf(client, _hce(client), pct=pct)["categoria"]["categoria"] == categoria


def test_pct_null_es_no_corresponde_y_pct_0_es_la_categoria_de_0_a_4(client, baremo):
    sin = _vf(client, _hce(client), estado="No corresponde (menor de 2 años)")
    assert (sin["pct"], sin["categoria"], sin["categoria_etiqueta"]) == (None, None, "No corresponde")
    cero = _vf(client, _hce(client), pct=0)
    assert cero["categoria"]["rango"] == "0 % a 4 %" and cero["categoria_etiqueta"] == "Sin discapacidad"


def test_mover_un_corte_del_catalogo_cambia_la_categoria_que_se_deriva(client, db_api, baremo):
    hce = _hce(client)
    assert _vf(client, hce, pct=55)["categoria"]["categoria"] == "Severo"
    db_api.execute(update(BaremoCategoria).where(BaremoCategoria.categoria == "Moderado").values(pct_max=59))
    db_api.execute(update(BaremoCategoria).where(BaremoCategoria.categoria == "Severo").values(pct_min=60))
    db_api.commit()
    r = client.patch(f"/hce/{hce}/valoracion-funcional", json={"pct": 56})
    assert r.status_code == 200 and r.json()["data"]["categoria"]["categoria"] == "Moderado"


def test_un_pct_que_el_baremo_no_cubre_es_422_y_no_una_categoria_por_defecto(client, db_api, baremo):
    db_api.execute(update(BaremoCategoria).where(BaremoCategoria.categoria == "Muy severo").values(pct_min=97))
    db_api.commit()
    hce = _hce(client)
    r = client.post(f"/hce/{hce}/valoracion-funcional", json={"pct": "96.5"})
    assert r.status_code == 422 and r.json()["detail"][0]["campo"] == "pct"
    assert _vf(client, hce, pct=97)["categoria"]["categoria"] == "Muy severo"


@pytest.mark.parametrize("intruso", [
    {"categoria_id": 1}, {"categoria": "Leve"}, {"idea_total": 58}, {"total": 79}, {"severidad": 3},
])
def test_la_vf_rechaza_categoria_y_puntajes_clinicos_en_la_entrada(client, baremo, intruso):
    hce = _hce(client)
    r = client.post(f"/hce/{hce}/valoracion-funcional", json={"pct": 10, **intruso})
    assert r.status_code == 422 and r.json()["code"] == "validation_error"
    vf = _vf(client, hce, pct=10)  # el par: sin el intruso
    assert client.patch(f"/hce/{hce}/valoracion-funcional", json=intruso).status_code == 422
    assert client.get(f"/hce/{hce}/valoracion-funcional").json()["categoria"] == vf["categoria"]


@pytest.mark.parametrize("pct", [-1, 101, "50.123"])
def test_pct_fuera_de_rango_o_con_mas_de_dos_decimales_es_422(client, baremo, pct):
    hce = _hce(client)
    assert client.post(f"/hce/{hce}/valoracion-funcional", json={"pct": pct}).status_code == 422
    assert _vf(client, hce, pct="50.12")["categoria"]["categoria"] == "Severo"


def test_el_servicio_de_vf_no_importa_ni_lee_instrumentos_clinicos_ni_severidad():
    """Salvaguarda §7.5 / §4 «HCE-SEV · salida (1)», estructural: ni import ni nombre a mano."""
    prohibidos = {
        "app.models.modulos", "app.models.severidad", "app.services.idea", "app.services.protocolo",
        "app.services.delta", "app.services.informe_cierre", "app.services.flujo",
    }
    for modulo in (servicio_vf, __import__("app.schemas.valoracion_funcional", fromlist=["x"]),
                   __import__("app.routers.valoracion_funcional", fromlist=["x"])):
        arbol = ast.parse(inspect.getsource(modulo))
        importados = {n.module for n in ast.walk(arbol) if isinstance(n, ast.ImportFrom)} | {
            a.name for n in ast.walk(arbol) if isinstance(n, ast.Import) for a in n.names
        }
        assert not importados & prohibidos, (modulo.__name__, importados & prohibidos)
        nombres = {n.id for n in ast.walk(arbol) if isinstance(n, ast.Name)}
        assert not nombres & {"Idea", "Protocolo", "SeveridadDsm", "InformeCierre"}, modulo.__name__
    firma = inspect.signature(servicio_vf.categoria_baremo)
    assert list(firma.parameters) == ["db", "pct"], "categoria_baremo recibe sólo el porcentaje"


@pytest.mark.parametrize(("dias", "nivel"), [
    (91, None), (90, "90_dias"), (31, "90_dias"), (30, "30_dias"), (0, "30_dias"), (-1, "vencida"),
])
def test_la_alerta_de_vigencia_se_calcula_al_leer(client, db_api, baremo, monkeypatch, dias, nivel):
    hoy = date(2026, 10, 7)
    monkeypatch.setattr(fechas, "hoy", lambda: hoy)
    hce = _hce(client)
    _vf(client, hce, pct=30, vigencia=(hoy + timedelta(days=dias)).isoformat())
    antes = len(_filas(db_api, hce))
    alerta = client.get(f"/hce/{hce}/valoracion-funcional").json()["alerta_vigencia"]
    assert (alerta and alerta["nivel"]) == nivel and (alerta is None or alerta["dias"] == dias)
    monkeypatch.setattr(fechas, "hoy", lambda: hoy - timedelta(days=400))  # otro «hoy»: la alerta se mueve sola
    assert client.get(f"/hce/{hce}/valoracion-funcional").json()["alerta_vigencia"] is None
    assert len(_filas(db_api, hce)) == antes, "leer no escribe nada"


def test_el_patch_audita_por_campo_y_por_dominio_y_uno_identico_no_audita(client, db_api, baremo):
    hce = _hce(client)
    _vf(client, hce, pct=58, dominios={"comunicacion": "Apoyo frecuente", "movilidad": "Autónomo"})
    r = client.patch(f"/hce/{hce}/valoracion-funcional", json={
        "pct": 30, "dominios": {"comunicacion": "Apoyo ocasional", "movilidad": ""}, "obs": "Revisar en marzo.",
    })
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["categoria"]["categoria"] == "Moderado" and data["dominios"] == {"comunicacion": "Apoyo ocasional"}
    filas = [(f.campo, f.valor_ant, f.valor_nuevo) for f in _filas(db_api, hce, tipo="edicion")]
    severo, moderado = (
        db_api.scalar(select(BaremoCategoria.id).where(BaremoCategoria.categoria == c)) for c in ("Severo", "Moderado")
    )
    assert sorted(filas) == sorted([
        ("pct", "58.00", "30"), ("obs", None, "Revisar en marzo."),
        ("categoria_id", str(severo), str(moderado)),
        ("dominios.comunicacion", "Apoyo frecuente", "Apoyo ocasional"), ("dominios.movilidad", "Autónomo", None),
    ])
    antes = len(_filas(db_api, hce))
    assert client.patch(f"/hce/{hce}/valoracion-funcional", json={"pct": 30, "obs": "Revisar en marzo."}).status_code == 200
    assert len(_filas(db_api, hce)) == antes


def test_pct_null_por_patch_deja_no_corresponde_y_audita_la_categoria(client, db_api, baremo):
    hce = _hce(client)
    _vf(client, hce, pct=10)
    data = client.patch(f"/hce/{hce}/valoracion-funcional", json={"pct": None}).json()["data"]
    assert (data["categoria"], data["categoria_etiqueta"]) == (None, "No corresponde")
    assert {f.campo for f in _filas(db_api, hce, tipo="edicion")} == {"pct", "categoria_id"}


@pytest.mark.parametrize("dominios", [{"vuelo": "Autónomo"}, {"comunicacion": "Grave"}])
def test_dominio_o_nivel_desconocido_es_422(client, baremo, dominios):
    hce = _hce(client)
    r = client.post(f"/hce/{hce}/valoracion-funcional", json={"dominios": dominios})
    assert r.status_code == 422 and r.json()["detail"][0]["campo"].startswith("dominios.")
    assert _vf(client, hce, dominios={"comunicacion": "Autónomo"})["dominios"] == {"comunicacion": "Autónomo"}


def test_vigencia_anterior_a_la_fecha_es_422(client, baremo):
    hce = _hce(client)
    r = client.post(f"/hce/{hce}/valoracion-funcional", json={"fecha": "2026-05-01", "vigencia": "2026-04-30"})
    assert r.status_code == 422 and r.json()["detail"][0]["campo"] == "vigencia"
    _vf(client, hce, fecha="2026-05-01", vigencia="2026-05-01")
    assert client.patch(f"/hce/{hce}/valoracion-funcional", json={"vigencia": "2026-04-01"}).status_code == 422


def test_la_sintesis_de_tecnico_de_los_cuerpos_firmables_cumple_el_recomendado():
    """Guarda de la propia suite: si alguien acorta `SINTESIS_TECNICO`, los `warnings == []` de M11.3-c
    dejarían de probar lo que dicen."""
    from app.core.constantes import PROTOCOLO_SINTESIS_PALABRAS_AVISO

    assert len(SINTESIS_TECNICO.split()) >= PROTOCOLO_SINTESIS_PALABRAS_AVISO
