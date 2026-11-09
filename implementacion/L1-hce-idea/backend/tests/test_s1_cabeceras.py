"""S1 · B3, B12 y B13 (`handoff.md` §5.163 c–d): el token exige `exp` y `sub`, la documentación sólo existe en dev y toda
respuesta lleva las cabeceras de seguridad.

Convención del repo: cada rechazo va con el caso que pasa.
"""
from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from jose import jwt

from app.core.config import settings
from app.core.seguridad import ALGORITMO, crear_token, leer_token
from app.main import app, crear_app
from app.services import hce as servicio_hce
from test_m11_3b_idea_flujo import _hce

ORIGEN_DEMO = "http://localhost:5500"
FIJAS = {"x-content-type-options": "nosniff", "referrer-policy": "no-referrer", "x-frame-options": "DENY"}
CSP = "default-src 'none'; frame-ancestors 'none'"


@pytest.fixture
def sin_token(client) -> TestClient:
    return TestClient(app)


# ── B3: exp y sub obligatorios ───────────────────────────────────────────────
def _firmar(**carga) -> dict[str, str]:
    return {"Authorization": f"Bearer {jwt.encode(carga, settings.secret_key, algorithm=ALGORITMO)}"}


def _vence(minutos: int) -> datetime:
    return datetime.now(UTC) + timedelta(minutes=minutos)


def test_un_token_bien_firmado_sin_exp_es_401_y_el_de_la_app_pasa(client, admin):
    r = client.get("/hce", headers=_firmar(sub=str(admin.id)))
    assert r.status_code == 401 and r.json()["code"] == "unauthorized"
    assert client.get("/hce", headers=_firmar(sub=str(admin.id), exp=_vence(5))).status_code == 200
    assert client.get("/hce", headers={"Authorization": f"Bearer {crear_token(admin.id)}"}).status_code == 200


def test_un_token_vencido_es_401(client, admin):
    assert client.get("/hce", headers=_firmar(sub=str(admin.id), exp=_vence(-5))).status_code == 401
    assert client.get("/hce", headers=_firmar(sub=str(admin.id), exp=_vence(5))).status_code == 200


def test_un_token_sin_sub_es_401(client, admin):
    assert client.get("/hce", headers=_firmar(exp=_vence(5))).status_code == 401
    assert client.get("/hce", headers=_firmar(sub=str(admin.id), exp=_vence(5))).status_code == 200


def test_un_token_sin_exp_tampoco_pasa_por_el_middleware_de_los_limites(client, admin):
    """El 401 temprano de los POST/PATCH/PUT usa el mismo `leer_token`."""
    r = client.post("/hce", json={}, headers=_firmar(sub=str(admin.id)))
    assert r.status_code == 401 and r.json()["code"] == "unauthorized"
    assert client.post("/hce", json={}, headers=_firmar(sub=str(admin.id), exp=_vence(5))).status_code == 422   # pasó el token


def test_leer_token_exige_exp_y_sub():
    ok = jwt.encode({"sub": "7", "exp": _vence(5)}, settings.secret_key, algorithm=ALGORITMO)
    assert leer_token(ok) == 7
    assert leer_token(jwt.encode({"sub": "7"}, settings.secret_key, algorithm=ALGORITMO)) is None
    assert leer_token(jwt.encode({"exp": _vence(5)}, settings.secret_key, algorithm=ALGORITMO)) is None
    assert leer_token(jwt.encode({"sub": "7", "exp": _vence(-1)}, settings.secret_key, algorithm=ALGORITMO)) is None
    assert leer_token(jwt.encode({"sub": "7", "exp": _vence(5)}, "otra-clave-de-32-bytes-o-mas-0123456789", algorithm=ALGORITMO)) is None


# ── B12: la documentación sólo en dev ────────────────────────────────────────
RUTAS_DE_DOCUMENTACION = ("/docs", "/redoc", "/openapi.json")


def test_con_dev_la_documentacion_existe():
    cliente = TestClient(crear_app("dev"))
    for ruta in RUTAS_DE_DOCUMENTACION:
        assert cliente.get(ruta).status_code == 200, ruta


@pytest.mark.parametrize("entorno", ["produccion", "prod", "staging", "", "development"])
def test_con_cualquier_otro_entorno_la_documentacion_es_404(entorno):
    cliente = TestClient(crear_app(entorno))
    for ruta in RUTAS_DE_DOCUMENTACION:
        r = cliente.get(ruta)
        assert r.status_code == 404 and r.json()["code"] == "http_error", (entorno, ruta)
    assert cliente.get("/health").status_code == 200       # lo demás sigue en pie


def test_el_entorno_sale_de_la_configuracion_y_dev_es_el_valor_por_omision(monkeypatch):
    assert type(settings).model_fields["environment"].default == "dev"
    monkeypatch.setattr(settings, "environment", "produccion")
    assert TestClient(crear_app()).get("/docs").status_code == 404
    monkeypatch.setattr(settings, "environment", "dev")
    assert TestClient(crear_app()).get("/docs").status_code == 200
    assert TestClient(crear_app()).get("/health").json()["env"] == "dev"


# ── B13: cabeceras de seguridad en toda respuesta ────────────────────────────
def _con_las_fijas(r, *, csp: bool = True) -> None:
    for nombre, valor in FIJAS.items():
        assert r.headers.get_list(nombre) == [valor], (nombre, dict(r.headers))
    assert r.headers.get_list("content-security-policy") == ([CSP] if csp else [])


def test_un_200_lleva_las_cabeceras(client):
    for ruta in ("/health", "/hce"):
        _con_las_fijas(client.get(ruta))


def test_un_401_lleva_las_cabeceras(sin_token):
    r = sin_token.get("/hce")
    assert r.status_code == 401
    _con_las_fijas(r)
    r = sin_token.post("/hce", json={})        # el 401 temprano del middleware de los límites
    assert r.status_code == 401
    _con_las_fijas(r)


def test_un_413_y_un_411_llevan_las_cabeceras(client):
    r = client.post("/hce", content=b"x" * (1024 * 1024 + 1), headers={"Content-Type": "application/json"})
    assert r.status_code == 413
    _con_las_fijas(r)
    r = client.post("/hce", content=iter([b"{}"]), headers={"Content-Type": "application/json"})    # chunked
    assert r.status_code == 411
    _con_las_fijas(r)


def test_un_422_y_un_404_llevan_las_cabeceras(client):
    r = client.post("/hce", json={})
    assert r.status_code == 422
    _con_las_fijas(r)
    r = client.get("/hce/999999")
    assert r.status_code == 404
    _con_las_fijas(r)
    r = client.get("/ruta-que-no-existe")
    assert r.status_code == 404
    _con_las_fijas(r)


def test_un_500_lleva_las_cabeceras(client, monkeypatch):
    def romper(*a, **k):
        raise RuntimeError("falla que nadie previó")

    hid = _hce(client)
    monkeypatch.setattr(servicio_hce, "obtener_hce", romper)
    r = client.get(f"/hce/{hid}")
    assert r.status_code == 500 and r.json()["code"] == "internal_error"
    _con_las_fijas(r)
    assert r.headers["cache-control"] == "no-store"


def test_un_preflight_lleva_las_cabeceras_y_no_las_credenciales(client):
    r = client.options("/hce", headers={"Origin": ORIGEN_DEMO, "Access-Control-Request-Method": "GET",
                                        "Access-Control-Request-Headers": "authorization"})
    assert r.status_code == 200
    assert r.headers["access-control-allow-origin"] == ORIGEN_DEMO
    assert "access-control-allow-credentials" not in r.headers      # la demo manda un Bearer, no cookies
    _con_las_fijas(r)
    # un pedido común desde la demo tampoco declara credenciales
    r = client.get("/health", headers={"Origin": ORIGEN_DEMO})
    assert r.headers["access-control-allow-origin"] == ORIGEN_DEMO and "access-control-allow-credentials" not in r.headers


def test_las_paginas_de_la_documentacion_no_llevan_la_csp_y_el_resto_de_la_api_si():
    cliente = TestClient(crear_app("dev"))
    for ruta in ("/docs", "/redoc"):
        r = cliente.get(ruta)
        assert r.status_code == 200
        _con_las_fijas(r, csp=False)
    r = cliente.get("/openapi.json")       # es JSON: la CSP aplica
    _con_las_fijas(r)


def test_lo_que_esta_detras_del_token_no_se_cachea_y_lo_publico_si(client, sin_token):
    assert client.get("/hce").headers["cache-control"] == "no-store"
    hid = _hce(client)
    assert client.get(f"/hce/{hid}").headers["cache-control"] == "no-store"
    assert sin_token.get("/hce").headers["cache-control"] == "no-store"       # ni los errores de lo protegido
    assert "cache-control" not in sin_token.get("/health").headers
    assert "cache-control" not in TestClient(crear_app("dev")).get("/docs").headers
    # el login lleva un token: tampoco se cachea
    assert sin_token.post("/auth/login", json={"email": "nadie@x.test", "password": "x"}).headers["cache-control"] == "no-store"


def test_una_descarga_no_duplica_las_cabeceras_que_ya_traia(client):
    hid = _hce(client)
    # una foto no pide categoría (la base de pruebas no tiene catálogos sembrados)
    r = client.post(f"/hce/{hid}/fotos", files={"archivo": ("f.png", b"\x89PNG\r\n\x1a\n" + b"\x00" * 16, "image/png")})
    assert r.status_code == 201, r.text
    d = client.get(f"/hce/{hid}/fotos/{r.json()['data']['id']}/archivo")
    assert d.status_code == 200
    assert d.headers.get_list("cache-control") == ["no-store"]
    assert d.headers.get_list("x-content-type-options") == ["nosniff"]
    assert d.headers["content-disposition"].startswith("attachment")
    _con_las_fijas(d)
