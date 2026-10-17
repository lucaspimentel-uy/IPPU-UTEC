"""C3 · HCE-ORG: `GET /organismos/opciones`, `GET /hce/{id}/organismos`, `POST|PATCH …/inau` y `…/bps`,
`GET|POST …/registros`.

Convención del repo: todo rechazo va emparejado con el caso que pasa (422 ↔ 201/200). Las reglas están en
`app/services/organismos.py`; la alerta AYEX se prueba con `fechas.hoy` congelada.
"""
from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select

from app.core.constantes import AYEX_ALERTA_DIAS, BPS_ESTADOS, BPS_PRESTACIONES, BPS_PRESTACIONES_AYEX
from app.main import app
from app.models.transversales import Auditoria, RegistroOrganismo
from app.services import fechas
from app.services import organismos as servicio_org
from test_m11_3b_idea_flujo import _hce  # noqa: F401  (ayuda)

HOY = date(2026, 11, 26)
AYEX = BPS_PRESTACIONES_AYEX[1]  # «Ayuda Extraordinaria (AYEX)»
NO_AYEX = "Asignación Familiar por discapacidad"
INAU = {"sipi": "SIPI-48213", "convenio": "Convenio de atención diurna 2026", "referente": "Lic. M. Rodríguez", "ingreso": "2026-03-02", "obs": "Sin novedades."}
BPS = {"prestacion": AYEX, "tramite": "AYEX-2026-0417", "estado": "En trámite", "vencimiento": "2027-05-10", "obs": "Falta la constancia."}
REGISTRO = {"organismo": "inau", "fecha": "2026-06-20", "detalle": "Informe semestral enviado."}


@pytest.fixture
def hoy(monkeypatch):
    monkeypatch.setattr(fechas, "hoy", lambda: HOY)
    return HOY


def _inau(client, hid: int, **campos) -> dict:
    r = client.post(f"/hce/{hid}/organismos/inau", json={**INAU, **campos})
    assert r.status_code == 201, r.text
    return r.json()


def _bps(client, hid: int, **campos) -> dict:
    r = client.post(f"/hce/{hid}/organismos/bps", json={**BPS, **campos})
    assert r.status_code == 201, r.text
    return r.json()


def _registro(client, hid: int, **campos) -> dict:
    r = client.post(f"/hce/{hid}/organismos/registros", json={**REGISTRO, **campos})
    assert r.status_code == 201, r.text
    return r.json()


def _filas(db_api, hid: int, **filtro) -> list[Auditoria]:
    db_api.expire_all()
    q = select(Auditoria).where(Auditoria.hce_id == hid, Auditoria.modulo == "HCE-ORG")
    for k, v in filtro.items():
        q = q.where(getattr(Auditoria, k) == v)
    return list(db_api.scalars(q.order_by(Auditoria.id)))


def _campos(r) -> list[str | None]:
    return [d["campo"] for d in r.json()["detail"]]


# ── Opciones ─────────────────────────────────────────────────────────────────
def test_las_opciones_son_las_constantes_y_las_ve_un_tecnico(client, crear_profesional, token_de, hash_test):
    r = client.get("/organismos/opciones")
    assert r.status_code == 200, r.text
    assert r.json() == {"bps_prestaciones": list(BPS_PRESTACIONES), "bps_estados": list(BPS_ESTADOS)}
    tecnico = crear_profesional(nombre="Tina", hashed_password=hash_test)
    assert client.get("/organismos/opciones", headers=token_de(tecnico)).status_code == 200


def test_las_opciones_sin_token_son_401():
    assert TestClient(app).get("/organismos/opciones").status_code == 401


def test_las_prestaciones_ayex_son_exactamente_las_dos_de_la_lista():
    assert BPS_PRESTACIONES_AYEX == ("Ayuda Extraordinaria (AYEX) — instituto habilitado", "Ayuda Extraordinaria (AYEX)")
    assert AYEX_ALERTA_DIAS == (60, 30)


# ── Camino feliz ─────────────────────────────────────────────────────────────
def test_sin_vinculos_el_get_devuelve_los_dos_null(client):
    hid = _hce(client)
    r = client.get(f"/hce/{hid}/organismos")
    assert r.status_code == 200 and r.json() == {"inau": None, "bps": None}


def test_inau_registrar_leer_y_editar(client):
    hid = _hce(client)
    r = _inau(client, hid)
    assert r["warnings"] == [] and r["data"] == INAU
    assert client.get(f"/hce/{hid}/organismos").json()["inau"] == INAU
    r = client.patch(f"/hce/{hid}/organismos/inau", json={"referente": "Lic. P. Techera"})
    assert r.status_code == 200 and r.json()["warnings"] == []
    assert r.json()["data"] == {**INAU, "referente": "Lic. P. Techera"}
    assert client.get(f"/hce/{hid}/organismos").json()["inau"] == r.json()["data"]


def test_bps_registrar_leer_y_editar(client, hoy):
    hid = _hce(client)
    r = _bps(client, hid)
    assert r["warnings"] == [] and r["data"] == {**BPS, "alerta": None}
    assert client.get(f"/hce/{hid}/organismos").json()["bps"] == r["data"]
    r = client.patch(f"/hce/{hid}/organismos/bps", json={"estado": "Vigente"})
    assert r.status_code == 200 and r.json()["data"] == {**BPS, "estado": "Vigente", "alerta": None}


def test_un_vinculo_no_toca_al_otro(client):
    hid = _hce(client)
    _inau(client, hid)
    assert client.get(f"/hce/{hid}/organismos").json()["bps"] is None
    _bps(client, hid)
    assert client.get(f"/hce/{hid}/organismos").json()["inau"] == INAU


@pytest.mark.parametrize("organismo,cuerpo,campo", [("inau", INAU, "obs"), ("bps", BPS, "vencimiento")])
def test_en_el_patch_null_borra_el_campo_y_la_ausencia_no_toca(client, hoy, organismo, cuerpo, campo):
    hid = _hce(client)
    client.post(f"/hce/{hid}/organismos/{organismo}", json=cuerpo)
    assert client.patch(f"/hce/{hid}/organismos/{organismo}", json={}).json()["data"][campo] == cuerpo[campo]
    r = client.patch(f"/hce/{hid}/organismos/{organismo}", json={campo: None})
    assert r.status_code == 200 and r.json()["data"][campo] is None
    assert r.json()["data"]["convenio" if organismo == "inau" else "tramite"] == cuerpo["convenio" if organismo == "inau" else "tramite"]


@pytest.mark.parametrize("organismo,campo", [("inau", "ingreso"), ("bps", "vencimiento")])
def test_la_fecha_vacia_en_el_patch_borra_la_fecha_y_en_el_alta_cuenta_como_vacia(client, organismo, campo):
    hid = _hce(client)
    r = client.post(f"/hce/{hid}/organismos/{organismo}", json={campo: ""})
    assert r.status_code == 422 and _campos(r) == [None]
    assert client.post(f"/hce/{hid}/organismos/{organismo}", json={campo: "2026-05-01"}).status_code == 201
    r = client.patch(f"/hce/{hid}/organismos/{organismo}", json={campo: ""})
    assert r.status_code == 200 and r.json()["data"][campo] is None


# ── Rechazos, cada uno con su caso que pasa ──────────────────────────────────
@pytest.mark.parametrize("organismo,cuerpo", [("inau", INAU), ("bps", BPS)])
def test_registrar_dos_veces_es_409_y_la_primera_queda(client, hoy, organismo, cuerpo):
    hid = _hce(client)
    primera = client.post(f"/hce/{hid}/organismos/{organismo}", json=cuerpo)
    assert primera.status_code == 201
    r = client.post(f"/hce/{hid}/organismos/{organismo}", json={k: None for k in cuerpo} | {"obs": "Otra"})
    assert r.status_code == 409 and r.json()["code"] == "conflict"
    assert client.get(f"/hce/{hid}/organismos").json()[organismo] == primera.json()["data"]


@pytest.mark.parametrize("organismo,cuerpo", [("inau", INAU), ("bps", BPS)])
def test_patch_sin_vinculo_es_404_y_con_vinculo_pasa(client, hoy, organismo, cuerpo):
    hid = _hce(client)
    r = client.patch(f"/hce/{hid}/organismos/{organismo}", json={"obs": "x"})
    assert r.status_code == 404 and r.json()["code"] == "not_found"
    assert client.post(f"/hce/{hid}/organismos/{organismo}", json=cuerpo).status_code == 201
    assert client.patch(f"/hce/{hid}/organismos/{organismo}", json={"obs": "x"}).status_code == 200


@pytest.mark.parametrize("organismo,uno", [("inau", {"sipi": "SIPI-1"}), ("bps", {"estado": "Vigente"})])
@pytest.mark.parametrize("vacio", [{}, {"obs": None}, {"obs": "   "}, {"obs": "\n\t"}, {"obs": ""}])
def test_un_vinculo_todo_vacio_es_422_sin_campo_y_con_un_dato_pasa(client, organismo, uno, vacio):
    """Un vínculo vacío no dice nada (§5.144): se rechaza; con un solo dato alcanza."""
    hid = _hce(client)
    r = client.post(f"/hce/{hid}/organismos/{organismo}", json=vacio)
    assert r.status_code == 422 and r.json()["code"] == "validation_error" and _campos(r) == [None]
    assert client.get(f"/hce/{hid}/organismos").json()[organismo] is None
    r = client.post(f"/hce/{hid}/organismos/{organismo}", json=uno)
    assert r.status_code == 201


@pytest.mark.parametrize("organismo,campo,largo", [("inau", "sipi", 40), ("inau", "convenio", 120), ("bps", "prestacion", 120), ("bps", "estado", 60)])
def test_un_texto_mas_largo_que_la_columna_es_422_y_el_borde_pasa(client, organismo, campo, largo):
    hid = _hce(client)
    r = client.post(f"/hce/{hid}/organismos/{organismo}", json={campo: "x" * (largo + 1)})
    assert r.status_code == 422 and _campos(r) == [campo]
    assert client.post(f"/hce/{hid}/organismos/{organismo}", json={campo: "x" * largo}).status_code == 201
    r = client.patch(f"/hce/{hid}/organismos/{organismo}", json={campo: "y" * (largo + 1)})
    assert r.status_code == 422 and _campos(r) == [campo]


def test_prestacion_y_estado_son_texto_libre(client):
    hid = _hce(client)
    d = _bps(client, hid, prestacion="Algo que no está en la lista", estado="Un estado nuevo", vencimiento=None)["data"]
    assert (d["prestacion"], d["estado"], d["alerta"]) == ("Algo que no está en la lista", "Un estado nuevo", None)


@pytest.mark.parametrize("intruso", [{"alerta": None}, {"hce_id": 9}, {"autor_id": 1}])
@pytest.mark.parametrize("organismo", ["inau", "bps"])
def test_un_campo_ajeno_es_422_y_sin_el_pasa(client, organismo, intruso):
    hid = _hce(client)
    r = client.post(f"/hce/{hid}/organismos/{organismo}", json={"obs": "x", **intruso})
    assert r.status_code == 422 and _campos(r) == [next(iter(intruso))]
    assert client.post(f"/hce/{hid}/organismos/{organismo}", json={"obs": "x"}).status_code == 201
    assert client.patch(f"/hce/{hid}/organismos/{organismo}", json=intruso).status_code == 422
    assert client.patch(f"/hce/{hid}/organismos/{organismo}", json={"obs": "y"}).status_code == 200


def test_expediente_inexistente_es_404_en_todas_las_rutas(client):
    rutas = [
        ("GET", "organismos", None), ("POST", "organismos/inau", INAU), ("PATCH", "organismos/inau", {"obs": "x"}),
        ("POST", "organismos/bps", BPS), ("PATCH", "organismos/bps", {"obs": "x"}),
        ("GET", "organismos/registros", None), ("POST", "organismos/registros", REGISTRO),
    ]
    for metodo, ruta, cuerpo in rutas:
        r = client.request(metodo, f"/hce/999999/{ruta}", json=cuerpo)
        assert r.status_code == 404, (metodo, ruta, r.text)


# ── Alerta AYEX ──────────────────────────────────────────────────────────────
@pytest.mark.parametrize("dias,nivel", [
    (61, None), (60, "60_dias"), (31, "60_dias"), (30, "30_dias"), (1, "30_dias"), (0, "30_dias"), (-1, "vencida"),
])
@pytest.mark.parametrize("prestacion", BPS_PRESTACIONES_AYEX)
def test_la_alerta_ayex_en_los_bordes_de_60_y_30_dias(client, db_api, hoy, prestacion, dias, nivel):
    hid = _hce(client)
    venc = (hoy + timedelta(days=dias)).isoformat()
    alta = _bps(client, hid, prestacion=prestacion, vencimiento=venc)["data"]["alerta"]
    antes = len(_filas(db_api, hid))
    leida = client.get(f"/hce/{hid}/organismos").json()["bps"]["alerta"]
    assert alta == leida
    assert (leida and leida["nivel"]) == nivel and (leida is None or leida["dias"] == dias)
    assert leida is None or "AYEX" in leida["mensaje"]
    assert len(_filas(db_api, hid)) == antes, "leer no escribe nada: la alerta no se guarda ni deja fila"


def test_la_alerta_sigue_al_dia_de_hoy_y_no_se_guarda(client, monkeypatch, hoy):
    hid = _hce(client)
    _bps(client, hid, vencimiento=(hoy + timedelta(days=25)).isoformat())
    assert client.get(f"/hce/{hid}/organismos").json()["bps"]["alerta"]["nivel"] == "30_dias"
    monkeypatch.setattr(fechas, "hoy", lambda: hoy - timedelta(days=400))  # otro «hoy»: la alerta se mueve sola
    assert client.get(f"/hce/{hid}/organismos").json()["bps"]["alerta"] is None
    monkeypatch.setattr(fechas, "hoy", lambda: hoy + timedelta(days=40))
    assert client.get(f"/hce/{hid}/organismos").json()["bps"]["alerta"]["nivel"] == "vencida"


@pytest.mark.parametrize("dias", [-30, 0, 25, 45])
def test_una_prestacion_que_no_es_ayex_no_alerta_aunque_el_vencimiento_este_cerca(client, hoy, dias):
    hid = _hce(client)
    venc = (hoy + timedelta(days=dias)).isoformat()
    assert _bps(client, hid, prestacion=NO_AYEX, vencimiento=venc)["data"]["alerta"] is None
    # El par: la misma fecha con una AYEX sí alerta.
    r = client.patch(f"/hce/{hid}/organismos/bps", json={"prestacion": AYEX})
    assert r.json()["data"]["alerta"] is not None


def test_sin_prestacion_o_sin_vencimiento_no_hay_alerta(client, hoy):
    cerca = (hoy + timedelta(days=10)).isoformat()
    hid = _hce(client)
    assert _bps(client, hid, prestacion=None, vencimiento=cerca)["data"]["alerta"] is None
    assert client.patch(f"/hce/{hid}/organismos/bps", json={"prestacion": AYEX}).json()["data"]["alerta"]["dias"] == 10
    assert client.patch(f"/hce/{hid}/organismos/bps", json={"vencimiento": None}).json()["data"]["alerta"] is None


@pytest.mark.parametrize("estado", [None, "Vigente", "Vencida", "Denegada", "No corresponde"])
def test_la_alerta_no_mira_el_estado(client, hoy, estado):
    """No hay regla escrita sobre `estado` (§5.144): sólo cuentan la prestación y el vencimiento."""
    hid = _hce(client)
    cerca = _bps(client, hid, estado=estado, vencimiento=(hoy + timedelta(days=20)).isoformat())["data"]["alerta"]
    assert cerca["nivel"] == "30_dias"
    lejos = client.patch(f"/hce/{hid}/organismos/bps", json={"vencimiento": (hoy + timedelta(days=200)).isoformat()})
    assert lejos.json()["data"]["alerta"] is None


@pytest.mark.parametrize("dias,fragmento", [
    (-2, "venció hace 2 días"), (-1, "venció hace 1 día"), (0, "vence hoy"), (1, "vence en 1 día"), (25, "vence en 25 días"),
])
def test_el_mensaje_de_la_alerta_se_lee_en_palabras(dias, fragmento):
    alerta = servicio_org.alerta_ayex(AYEX, HOY + timedelta(days=dias), HOY)
    assert fragmento in alerta["mensaje"] and alerta["dias"] == dias


# ── Registros ────────────────────────────────────────────────────────────────
def test_registrar_un_envio_y_leerlo(client, admin):
    hid = _hce(client)
    assert client.get(f"/hce/{hid}/organismos/registros").json() == []
    r = _registro(client, hid)
    assert r["warnings"] == []
    d = r["data"]
    assert (d["organismo"], d["fecha"], d["detalle"]) == ("inau", "2026-06-20", "Informe semestral enviado.")
    assert d["autor"] == {"id": admin.id, "nombre": admin.nombre}
    lista = client.get(f"/hce/{hid}/organismos/registros")
    assert lista.status_code == 200 and lista.json() == [d] and lista.headers["X-Total-Count"] == "1"


def test_los_registros_van_del_mas_nuevo_al_mas_viejo_y_el_id_desempata(client):
    hid = _hce(client)
    a = _registro(client, hid, fecha="2026-03-01", detalle="a")["data"]["id"]
    b = _registro(client, hid, fecha="2026-09-01", detalle="b")["data"]["id"]
    c = _registro(client, hid, fecha="2026-06-01", detalle="c")["data"]["id"]
    d = _registro(client, hid, fecha="2026-06-01", detalle="d", organismo="bps")["data"]["id"]
    r = client.get(f"/hce/{hid}/organismos/registros")
    assert [x["id"] for x in r.json()] == [b, d, c, a] and r.headers["X-Total-Count"] == "4"


def test_filtrar_por_organismo_y_paginar_sin_perder_el_total(client):
    hid = _hce(client)
    for i in range(3):
        _registro(client, hid, fecha=f"2026-01-0{i + 1}", detalle=f"envío {i}")
    _registro(client, hid, organismo="bps", detalle="gestión")
    r = client.get(f"/hce/{hid}/organismos/registros", params={"organismo": "inau"})
    assert [x["detalle"] for x in r.json()] == ["envío 2", "envío 1", "envío 0"] and r.headers["X-Total-Count"] == "3"
    r = client.get(f"/hce/{hid}/organismos/registros", params={"organismo": "bps"})
    assert [x["detalle"] for x in r.json()] == ["gestión"] and r.headers["X-Total-Count"] == "1"
    r = client.get(f"/hce/{hid}/organismos/registros", params={"limit": 2, "offset": 1})
    assert len(r.json()) == 2 and r.headers["X-Total-Count"] == "4"


def test_los_registros_de_un_expediente_no_aparecen_en_otro(client):
    uno, otro = _hce(client), _hce(client)
    _registro(client, uno)
    r = client.get(f"/hce/{otro}/organismos/registros")
    assert r.json() == [] and r.headers["X-Total-Count"] == "0"


def test_un_organismo_invalido_es_422_en_el_get_y_en_el_post_y_los_validos_pasan(client):
    hid = _hce(client)
    r = client.get(f"/hce/{hid}/organismos/registros", params={"organismo": "mides"})
    assert r.status_code == 422 and _campos(r) == ["organismo"]
    for ok in ("inau", "bps"):
        assert client.get(f"/hce/{hid}/organismos/registros", params={"organismo": ok}).status_code == 200
        assert client.post(f"/hce/{hid}/organismos/registros", json={**REGISTRO, "organismo": ok}).status_code == 201
    for malo in ("mides", "INAU", "", None):
        r = client.post(f"/hce/{hid}/organismos/registros", json={**REGISTRO, "organismo": malo})
        assert r.status_code == 422 and _campos(r) == ["organismo"], malo
    assert client.get(f"/hce/{hid}/organismos/registros").headers["X-Total-Count"] == "2"


@pytest.mark.parametrize("blanco", ["", "   ", "\t\t", "\n \r\n", " "])
def test_detalle_en_blanco_es_422_y_con_texto_pasa(client, blanco):
    hid = _hce(client)
    r = client.post(f"/hce/{hid}/organismos/registros", json={**REGISTRO, "detalle": blanco})
    assert r.status_code == 422 and _campos(r) == ["detalle"]
    assert _registro(client, hid, detalle="Sí")["data"]["detalle"] == "Sí"


@pytest.mark.parametrize("falta", ["organismo", "fecha", "detalle"])
def test_al_registrar_falta_un_campo_es_422_por_campo_y_completo_pasa(client, falta):
    hid = _hce(client)
    r = client.post(f"/hce/{hid}/organismos/registros", json={k: v for k, v in REGISTRO.items() if k != falta})
    assert r.status_code == 422 and _campos(r) == [falta]
    assert client.get(f"/hce/{hid}/organismos/registros").json() == []
    _registro(client, hid)


def test_la_fecha_vacia_o_invalida_es_422_y_una_fecha_real_pasa(client):
    hid = _hce(client)
    for mala in ("", "2026-13-40", "ayer"):
        r = client.post(f"/hce/{hid}/organismos/registros", json={**REGISTRO, "fecha": mala})
        assert r.status_code == 422 and _campos(r) == ["fecha"], mala
    _registro(client, hid, fecha="2026-02-28")


@pytest.mark.parametrize("intruso", [{"autor_id": 1}, {"id": 9}, {"hce_id": 9}, {"autor": {"id": 1}}])
def test_un_campo_ajeno_en_el_registro_es_422_y_el_autor_es_el_del_token(client, admin, intruso):
    """El autor es el usuario del token (§5.119 b, §5.144), nunca un campo del cuerpo."""
    hid = _hce(client)
    r = client.post(f"/hce/{hid}/organismos/registros", json={**REGISTRO, **intruso})
    assert r.status_code == 422 and _campos(r) == [next(iter(intruso))]
    assert _registro(client, hid)["data"]["autor"]["id"] == admin.id


def test_un_registro_no_se_edita_ni_se_borra(client):
    """Es una constancia: la API no ofrece edición ni baja (§5.144)."""
    hid = _hce(client)
    rid = _registro(client, hid)["data"]["id"]
    for metodo in ("PATCH", "PUT", "DELETE"):
        assert client.request(metodo, f"/hce/{hid}/organismos/registros", json={}).status_code == 405, metodo
        assert client.request(metodo, f"/hce/{hid}/organismos/registros/{rid}", json={}).status_code in (404, 405), metodo
    assert client.get(f"/hce/{hid}/organismos/registros").json()[0]["detalle"] == REGISTRO["detalle"]


def test_el_autor_es_null_si_el_profesional_ya_no_existe(client, db_api):
    hid = _hce(client)
    rid = _registro(client, hid)["data"]["id"]
    db_api.get(RegistroOrganismo, rid).autor_id = None
    db_api.commit()
    assert client.get(f"/hce/{hid}/organismos/registros").json()[0]["autor"] is None


# ── Auditoría ────────────────────────────────────────────────────────────────
@pytest.mark.parametrize("organismo,cuerpo", [("inau", INAU), ("bps", BPS)])
def test_el_alta_deja_una_fila_carga_con_el_autor(client, db_api, admin, hoy, organismo, cuerpo):
    hid = _hce(client)
    client.post(f"/hce/{hid}/organismos/{organismo}", json=cuerpo)
    (fila,) = _filas(db_api, hid)
    assert fila.tipo == "carga" and fila.usuario_id == admin.id and fila.campo is None
    assert "Alta" in fila.detalle and organismo.upper() in fila.detalle


def test_cada_campo_que_cambia_deja_su_fila_con_antes_y_despues(client, db_api, hoy):
    hid = _hce(client)
    _bps(client, hid)
    client.patch(f"/hce/{hid}/organismos/bps", json={"estado": "Vigente", "vencimiento": "2027-12-31", "obs": None})
    filas = {f.campo: (f.valor_ant, f.valor_nuevo) for f in _filas(db_api, hid, tipo="edicion")}
    assert filas == {
        "bps.estado": ("En trámite", "Vigente"), "bps.vencimiento": ("2027-05-10", "2027-12-31"),
        "bps.obs": ("Falta la constancia.", None),
    }


def test_el_mismo_nombre_de_campo_en_los_dos_vinculos_se_distingue(client, db_api, hoy):
    hid = _hce(client)
    _inau(client, hid)
    _bps(client, hid)
    client.patch(f"/hce/{hid}/organismos/inau", json={"obs": "A"})
    client.patch(f"/hce/{hid}/organismos/bps", json={"obs": "B"})
    assert sorted(f.campo for f in _filas(db_api, hid, tipo="edicion")) == ["bps.obs", "inau.obs"]


def test_un_patch_que_no_cambia_nada_no_deja_filas(client, db_api, hoy):
    hid = _hce(client)
    _inau(client, hid)
    _bps(client, hid)
    antes = len(_filas(db_api, hid))
    assert client.patch(f"/hce/{hid}/organismos/inau", json=INAU).status_code == 200
    assert client.patch(f"/hce/{hid}/organismos/bps", json=BPS).status_code == 200
    assert client.patch(f"/hce/{hid}/organismos/bps", json={}).status_code == 200
    assert client.patch(f"/hce/{hid}/organismos/bps", json={"obs": "   "}).status_code == 200 and len(_filas(db_api, hid)) == antes + 1
    # El par: un cambio real sí deja su fila.
    antes = len(_filas(db_api, hid))
    client.patch(f"/hce/{hid}/organismos/inau", json={"sipi": "SIPI-2"})
    assert len(_filas(db_api, hid)) == antes + 1


def test_un_registro_deja_una_fila_carga_sin_el_texto_del_detalle(client, db_api, admin):
    hid = _hce(client)
    _registro(client, hid, detalle="Dato sensible de la familia")
    _registro(client, hid, organismo="bps")
    envio, gestion = _filas(db_api, hid)
    assert (envio.tipo, envio.usuario_id) == ("carga", admin.id) and "INAU" in envio.detalle
    assert gestion.tipo == "carga" and "BPS" in gestion.detalle
    assert "sensible" not in envio.detalle


def test_los_cambios_de_organismos_se_leen_en_get_auditoria(client, hoy):
    hid = _hce(client)
    _bps(client, hid)
    client.patch(f"/hce/{hid}/organismos/bps", json={"estado": "Vigente"})
    _registro(client, hid)
    filas = client.get(f"/hce/{hid}/auditoria", params={"modulo": "HCE-ORG"}).json()
    assert [(f["tipo"], f["campo"]) for f in filas] == [("carga", None), ("edicion", "bps.estado"), ("carga", None)][::-1]


def test_un_rechazo_no_escribe_nada(client, db_api, hoy):
    hid = _hce(client)
    _bps(client, hid)
    db_api.expire_all()
    total = db_api.scalar(select(func.count()).select_from(Auditoria))
    client.patch(f"/hce/{hid}/organismos/bps", json={"estado": "Vigente", "sipi": "x"})
    client.post(f"/hce/{hid}/organismos/bps", json=BPS)
    client.post(f"/hce/{hid}/organismos/registros", json={**REGISTRO, "detalle": " "})
    db_api.expire_all()
    assert db_api.scalar(select(func.count()).select_from(Auditoria)) == total
    assert client.get(f"/hce/{hid}/organismos").json()["bps"]["estado"] == "En trámite"
    assert client.get(f"/hce/{hid}/organismos/registros").json() == []


# ── Acceso ───────────────────────────────────────────────────────────────────
def test_alcance_propio_ajeno_admin_y_sin_token(client, crear_grupo, crear_profesional, token_de, hash_test, hoy):
    mia = crear_profesional(nombre="Tina", hashed_password=hash_test)
    otra = crear_profesional(nombre="Otra", hashed_password=hash_test)
    propio, ajeno = crear_grupo(nombre="Escolares", tecnico1_id=mia.id), crear_grupo(nombre="Inicial", tecnico1_id=otra.id)

    def alta(g):
        r = client.post("/hce", json={"persona": {"nombre": "A", "apellido": "B", "ci": f"8{g.id}01-1", "fecha_nac": "2016-04-12"}, "grupo_id": g.id})
        assert r.status_code == 201, r.text
        return r.json()["data"]["id"]

    h_propio, h_ajeno = alta(propio), alta(ajeno)
    cab = token_de(mia)
    rutas = [
        ("GET", "", None), ("POST", "/inau", INAU), ("PATCH", "/inau", {"obs": "x"}), ("POST", "/bps", BPS),
        ("PATCH", "/bps", {"obs": "x"}), ("GET", "/registros", None), ("POST", "/registros", REGISTRO),
    ]
    # Propio: las siete rutas, y el técnico queda como autor del registro.
    for metodo, ruta, cuerpo in rutas:
        r = client.request(metodo, f"/hce/{h_propio}/organismos{ruta}", json=cuerpo, headers=cab)
        assert r.status_code in (200, 201), (metodo, ruta, r.text)
    assert client.get(f"/hce/{h_propio}/organismos/registros", headers=cab).json()[0]["autor"]["id"] == mia.id
    # El admin carga todo en el ajeno; el técnico recibe 404 en las siete, y nada se escribe.
    _inau(client, h_ajeno), _bps(client, h_ajeno), _registro(client, h_ajeno)
    antes = client.get(f"/hce/{h_ajeno}/organismos").json()
    for metodo, ruta, cuerpo in rutas:
        r = client.request(metodo, f"/hce/{h_ajeno}/organismos{ruta}", json=cuerpo, headers=cab)
        assert r.status_code == 404 and r.json()["code"] == "not_found", (metodo, ruta)
    assert client.get(f"/hce/{h_ajeno}/organismos").json() == antes
    assert len(client.get(f"/hce/{h_ajeno}/organismos/registros").json()) == 1
    # Sin token: 401 en las siete.
    anonimo = TestClient(app)
    for metodo, ruta, cuerpo in rutas:
        assert anonimo.request(metodo, f"/hce/{h_propio}/organismos{ruta}", json=cuerpo).status_code == 401, (metodo, ruta)
