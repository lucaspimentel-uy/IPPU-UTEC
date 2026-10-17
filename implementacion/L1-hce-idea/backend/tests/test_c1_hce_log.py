"""C1 · HCE-LOG de sólo lectura: `GET /hce/{id}/auditoria`.

Convención del repo: todo rechazo va emparejado con el caso que pasa (422 ↔ 200). Las filas las
escriben las escrituras de siempre por la API; acá no se inserta nada en `auditoria` a mano.
"""
import pytest
from sqlalchemy import func, select

from app.models.transversales import Auditoria
from test_m11_3b_idea_flujo import _firmado, _hce, bandas, equipo  # noqa: F401  (fixtures y ayudas)


def _log(client, hce_id: int, **params):
    return client.get(f"/hce/{hce_id}/auditoria", params=params)


def _cuenta(db_api) -> int:
    db_api.expire_all()
    return db_api.scalar(select(func.count()).select_from(Auditoria))


# ── Contenido ────────────────────────────────────────────────────────────────
def test_un_patch_de_hce_00_aparece_con_autor_antes_y_despues(client, admin):
    hid = _hce(client)
    assert client.patch(f"/hce/{hid}", json={"diagnostico": "TEA nivel 2"}).status_code == 200
    r = _log(client, hid, tipo="edicion")
    assert r.status_code == 200, r.text
    (fila,) = r.json()
    assert fila["campo"] == "diagnostico" and fila["modulo"] == "HCE-00"
    assert fila["valor_ant"] is None and fila["valor_nuevo"] == "TEA nivel 2"
    assert fila["usuario"] == {"id": admin.id, "nombre": admin.nombre, "rol": "admin"}
    assert fila["ts"].endswith("Z") or "+" in fila["ts"] or fila["ts"][-6] == "-"  # con zona horaria


def test_la_carga_del_alta_tambien_esta_y_no_trae_campo_ni_valores(client):
    hid = _hce(client)
    (fila,) = _log(client, hid).json()
    assert fila["tipo"] == "carga" and fila["campo"] is None
    assert fila["valor_ant"] is None and fila["valor_nuevo"] is None and fila["detalle"]


def test_la_firma_aparece_con_autor_y_modulo(client, admin, equipo, bandas):  # noqa: F811
    hid = _hce(client)
    _firmado(client, hid, equipo)
    firmas = _log(client, hid, tipo="firma", modulo="HCE-LB").json()
    assert len(firmas) == 1
    assert firmas[0]["usuario"]["nombre"] == admin.nombre and firmas[0]["detalle"]


def test_un_patch_con_varios_campos_sale_en_el_orden_en_que_se_escribio(client):
    """Las filas de un mismo request comparten `ts`: manda `id DESC` (la última escrita, primero)."""
    hid = _hce(client)
    assert client.patch(f"/hce/{hid}", json={"diagnostico": "A", "derivacion": "B", "medicacion": "C"}).status_code == 200
    filas = _log(client, hid, tipo="edicion").json()
    assert len({f["ts"] for f in filas}) == 1  # mismo instante
    assert [f["id"] for f in filas] == sorted((f["id"] for f in filas), reverse=True)
    assert {f["campo"] for f in filas} == {"diagnostico", "derivacion", "medicacion"}


def test_lo_mas_nuevo_va_primero(client):
    hid = _hce(client)
    client.patch(f"/hce/{hid}", json={"diagnostico": "uno"})
    client.patch(f"/hce/{hid}", json={"diagnostico": "dos"})
    filas = _log(client, hid).json()
    assert [f["tipo"] for f in filas] == ["edicion", "edicion", "carga"]
    assert [f["valor_nuevo"] for f in filas[:2]] == ["dos", "uno"]


def test_un_valor_json_viene_como_texto_json(client):
    hid = _hce(client)
    client.patch(f"/hce/{hid}", json={"anamnesis": {"b": 1, "a": [2]}})
    (fila,) = _log(client, hid, tipo="edicion").json()
    assert fila["valor_nuevo"] == '{"a": [2], "b": 1}'


def test_solo_trae_las_filas_de_ese_expediente(client):
    uno, otro = _hce(client), _hce(client)
    client.patch(f"/hce/{otro}", json={"diagnostico": "ajeno"})
    assert [f["tipo"] for f in _log(client, uno).json()] == ["carga"]


# ── Filtros ──────────────────────────────────────────────────────────────────
def test_filtra_por_modulo_y_por_tipo(client, equipo, bandas):  # noqa: F811
    hid = _hce(client)
    client.patch(f"/hce/{hid}", json={"diagnostico": "x"})
    _firmado(client, hid, equipo)
    todos = _log(client, hid).json()
    assert {f["modulo"] for f in todos} >= {"HCE-00", "HCE-LB"}
    assert {f["modulo"] for f in _log(client, hid, modulo="HCE-LB").json()} == {"HCE-LB"}
    assert {f["tipo"] for f in _log(client, hid, tipo="edicion").json()} == {"edicion"}
    cruzado = _log(client, hid, modulo="HCE-00", tipo="edicion").json()
    assert [f["campo"] for f in cruzado] == ["diagnostico"]
    assert _log(client, hid, modulo="HCE-PB").json() == []  # válido y sin filas: lista vacía, no error


@pytest.mark.parametrize("params,campos", [
    ({"tipo": "acceso"}, ["tipo"]),
    ({"modulo": "GRUPO"}, ["modulo"]),
    ({"tipo": "lo-que-sea"}, ["tipo"]),
    ({"modulo": "hce-00"}, ["modulo"]),
    ({"modulo": "GRUPO", "tipo": "acceso"}, ["modulo", "tipo"]),
    ({"modulo": "HCE-00", "tipo": "acceso"}, ["tipo"]),
    ({"modulo": "GRUPO", "tipo": "edicion"}, ["modulo"]),
])
def test_modulo_o_tipo_invalido_es_422_por_campo(client, params, campos):
    hid = _hce(client)
    r = _log(client, hid, **params)
    assert r.status_code == 422 and r.json()["code"] == "validation_error"
    assert [d["campo"] for d in r.json()["detail"]] == campos


def test_los_valores_validos_de_cada_filtro_pasan(client):
    from app.core.constantes import AUDITORIA_TIPOS_LEIBLES, MODULOS_HCE
    hid = _hce(client)
    assert len(AUDITORIA_TIPOS_LEIBLES) == 6
    for m in MODULOS_HCE:
        assert _log(client, hid, modulo=m).status_code == 200
    for t in AUDITORIA_TIPOS_LEIBLES:
        assert _log(client, hid, tipo=t).status_code == 200


# ── Paginación ───────────────────────────────────────────────────────────────
def test_pagina_y_el_total_va_en_la_cabecera(client):
    hid = _hce(client)
    for i in range(4):
        client.patch(f"/hce/{hid}", json={"diagnostico": f"d{i}"})
    todos = _log(client, hid).json()
    r = _log(client, hid, limit=2, offset=1)
    assert r.headers["X-Total-Count"] == str(len(todos)) == "5"
    assert r.json() == todos[1:3]
    assert _log(client, hid, limit=2, offset=10).json() == []
    assert _log(client, hid, tipo="edicion", limit=1).headers["X-Total-Count"] == "4"
    assert _log(client, hid, limit=0).status_code == 422
    assert _log(client, hid, limit=201).status_code == 422


# ── Acceso ───────────────────────────────────────────────────────────────────
def test_alcance_propio_ajeno_admin_y_sin_token(client, crear_grupo, crear_profesional, token_de, hash_test):
    mia = crear_profesional(nombre="Tina", hashed_password=hash_test)
    otra = crear_profesional(nombre="Otra", hashed_password=hash_test)
    propio, ajeno = crear_grupo(nombre="Escolares", tecnico1_id=mia.id), crear_grupo(nombre="Inicial", tecnico1_id=otra.id)
    def alta(g):
        r = client.post("/hce", json={"persona": {"nombre": "A", "apellido": "B", "ci": f"9{g.id}01-1", "fecha_nac": "2016-04-12"}, "grupo_id": g.id})
        assert r.status_code == 201, r.text
        return r.json()["data"]["id"]
    h_propio, h_ajeno = alta(propio), alta(ajeno)
    cab = token_de(mia)
    assert client.get(f"/hce/{h_propio}/auditoria", headers=cab).status_code == 200
    r = client.get(f"/hce/{h_ajeno}/auditoria", headers=cab)
    assert r.status_code == 404 and r.json()["code"] == "not_found"
    assert client.get(f"/hce/{h_ajeno}/auditoria").status_code == 200  # admin
    from fastapi.testclient import TestClient

    from app.main import app

    assert TestClient(app).get(f"/hce/{h_propio}/auditoria").status_code == 401  # sin cabecera
    assert client.get(f"/hce/{999_999}/auditoria").status_code == 404


def test_leer_no_escribe_nada(client, db_api):
    hid = _hce(client)
    client.patch(f"/hce/{hid}", json={"diagnostico": "x"})
    antes = _cuenta(db_api)
    for params in ({}, {"tipo": "edicion"}, {"modulo": "GRUPO"}, {"limit": 1, "offset": 1}):
        _log(client, hid, **params)
    assert _cuenta(db_api) == antes