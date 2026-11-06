"""Auditoría de seguridad M1 (§5.157 a): el cuerpo de un request se juzga **antes de leerlo**.

Antes (FastAPI 0.115.6 lee el formulario o el JSON antes de resolver las dependencias), un multipart de 50 MB sin
token terminaba en un temporal de disco y recién ahí daba 401. Ahora `core/limites.py` decide con las cabeceras:
token (401) → `Content-Length` (411 si es chunked) → tope de la ruta (413) → recorte de lo que sobre.

Cómo se prueba que **no se leyó**: (1) se cuentan las instancias del temporal del parser multipart
(`starlette.formparsers.SpooledTemporaryFile`), y (2) para el JSON, se llama a la app ASGI directamente con un
`receive` espía que registra si entregó el cuerpo antes de que saliera la respuesta. Convención del repo: cada
rechazo va con el caso que pasa.
"""
import asyncio
import json

import pytest
from fastapi.testclient import TestClient
from starlette import formparsers

from app.core.config import settings
from app.core.constantes import ARCHIVO_TAMANO_MAXIMO
from app.main import app
from test_c5_documentos import INFORME, PDF, categorias, hoy  # noqa: F401  (fixtures)
from test_m11_3b_idea_flujo import _hce
from tests.conftest import EMAIL_ADMIN, PASSWORD_TEST

ORIGEN_DEMO = "http://localhost:5500"


@pytest.fixture
def temporales(monkeypatch) -> list:
    """Cada `SpooledTemporaryFile` que crea el parser multipart de Starlette queda en esta lista."""
    creados: list = []

    class _Contado(formparsers.SpooledTemporaryFile):
        def __init__(self, *a, **k):
            creados.append(self)
            super().__init__(*a, **k)

    monkeypatch.setattr(formparsers, "SpooledTemporaryFile", _Contado)
    return creados


@pytest.fixture
def sin_token(client) -> TestClient:
    """Un cliente sin `Authorization` (usa el `get_db` de prueba que deja puesto `client`)."""
    return TestClient(app)


def _multipart(tamano: int) -> dict:
    return {"files": {"archivo": ("grande.pdf", PDF + b"0" * (tamano - len(PDF)), "application/pdf")}, "data": {"categoria_id": "1"}}


def _llamar_asgi(metodo: str, ruta: str, cuerpo: bytes, cabeceras: dict[str, str], declarado: int | None = None,
                sin_largo: bool = False) -> dict:
    """Llama a la app como lo haría uvicorn, con un `receive` espía. Devuelve el status, el cuerpo de la respuesta y
    si el cuerpo del request se entregó **antes** de que saliera `http.response.start`."""
    estado = {"respondio": False, "entregado_antes": False, "entregado": False, "status": None, "respuesta": b""}
    todas = ({} if sin_largo else {"content-length": str(len(cuerpo) if declarado is None else declarado)}) | cabeceras
    scope = {
        "type": "http", "asgi": {"version": "3.0", "spec_version": "2.3"}, "http_version": "1.1",
        "method": metodo, "scheme": "http", "path": ruta, "raw_path": ruta.encode(), "root_path": "", "query_string": b"",
        "headers": [(k.lower().encode(), v.encode()) for k, v in todas.items()] + [(b"host", b"testserver")],
        "client": ("127.0.0.1", 50000), "server": ("testserver", 80),
    }

    async def receive():
        if estado["entregado"] or estado["respondio"]:
            return {"type": "http.disconnect"}
        estado["entregado"] = True
        estado["entregado_antes"] = not estado["respondio"]
        return {"type": "http.request", "body": cuerpo, "more_body": False}

    async def send(mensaje):
        if mensaje["type"] == "http.response.start":
            estado["respondio"], estado["status"] = True, mensaje["status"]
        elif mensaje["type"] == "http.response.body":
            estado["respuesta"] += mensaje.get("body", b"")

    asyncio.run(app(scope, receive, send))
    return estado


def _sobre(r) -> tuple[str, list]:
    cuerpo = r.json()
    return cuerpo["code"], [(d["campo"], d["mensaje"]) for d in cuerpo["detail"]]


# ── 401 antes de leer ────────────────────────────────────────────────────────
@pytest.mark.parametrize("ruta", ["/hce/{hid}/documentos", "/hce/{hid}/fotos", "/grupos/1/fotos"])
def test_un_multipart_de_30_mb_sin_token_es_401_sin_crear_ningun_temporal(client, sin_token, temporales, carpeta_uploads, ruta):
    hid = _hce(client)
    r = sin_token.post(ruta.format(hid=hid), headers={"Origin": ORIGEN_DEMO}, **_multipart(3 * ARCHIVO_TAMANO_MAXIMO))
    assert r.status_code == 401, r.text
    assert _sobre(r) == ("unauthorized", [(None, "Falta el token de acceso")])
    assert r.headers["www-authenticate"] == "Bearer"
    assert r.headers["access-control-allow-origin"] == ORIGEN_DEMO   # la demo puede leer el 401
    assert temporales == []
    assert not any(p.is_file() for p in carpeta_uploads.rglob("*"))


def test_un_token_con_la_firma_mal_o_vencido_es_401_sin_leer(client, sin_token, temporales):
    from app.core.seguridad import crear_token

    hid = _hce(client)
    for token in ("no-es-un-jwt", crear_token(1) + "x", crear_token(1, minutos=-1)):
        r = sin_token.post(f"/hce/{hid}/documentos", headers={"Authorization": f"Bearer {token}"}, **_multipart(3 * ARCHIVO_TAMANO_MAXIMO))
        assert r.status_code == 401 and _sobre(r) == ("unauthorized", [(None, "El token de acceso es inválido o venció")]), r.text
    r = sin_token.post(f"/hce/{hid}/documentos", headers={"Authorization": f"Basic {crear_token(1)}"}, **_multipart(1024))
    assert r.status_code == 401 and _sobre(r)[1] == [(None, "Falta el token de acceso")]   # otro esquema = sin token
    assert temporales == []


def test_un_json_de_2_mib_sin_token_es_401_sin_que_se_lea_el_cuerpo(client):
    cuerpo = json.dumps({"persona": {"nombre": "x" * (2 * 1024 * 1024)}}).encode()
    e = _llamar_asgi("POST", "/hce", cuerpo, {"content-type": "application/json", "origin": ORIGEN_DEMO})
    assert e["status"] == 401
    assert e["entregado_antes"] is False and e["entregado"] is False
    assert json.loads(e["respuesta"])["code"] == "unauthorized"


# ── 413 antes de leer ────────────────────────────────────────────────────────
@pytest.mark.parametrize("ruta", ["/hce/{hid}/documentos", "/hce/{hid}/fotos", "/grupos/1/fotos"])
def test_un_multipart_sobre_el_tope_con_token_es_413_sin_crear_ningun_temporal(client, temporales, carpeta_uploads, ruta):
    hid = _hce(client)
    r = client.post(ruta.format(hid=hid), headers={"Origin": ORIGEN_DEMO}, **_multipart(3 * ARCHIVO_TAMANO_MAXIMO))
    assert r.status_code == 413, r.text
    assert _sobre(r) == ("too_large", [("archivo", "El archivo supera los 10 MB: el máximo es 10 MB.")])
    assert r.headers["access-control-allow-origin"] == ORIGEN_DEMO
    assert temporales == []
    assert not any(p.is_file() for p in carpeta_uploads.rglob("*"))


def test_el_tope_de_las_subidas_es_10_mb_mas_64_kib_y_el_de_lo_demas_1_mib(client, token_de, admin):
    from app.core import limites   # adentro: el módulo no existe antes de §5.157 y los demás tests tienen que correr igual

    assert limites.TOPE_SUBIDA == ARCHIVO_TAMANO_MAXIMO + 64 * 1024 and limites.TOPE_JSON == 1024 * 1024
    auth = token_de(admin)
    hid = _hce(client)
    # un byte sobre el tope: 413 y el cuerpo nunca se pide
    for ruta, tope, campo in ((f"/hce/{hid}/documentos", limites.TOPE_SUBIDA, "archivo"), (f"/hce/{hid}", limites.TOPE_JSON, None),
                              ("/hce", limites.TOPE_JSON, None)):
        metodo = "PATCH" if ruta == f"/hce/{hid}" else "POST"
        e = _llamar_asgi(metodo, ruta, b"", auth, declarado=tope + 1)
        assert e["status"] == 413 and e["entregado"] is False, (ruta, e)
        assert json.loads(e["respuesta"])["detail"][0]["campo"] == campo
    # justo en el tope del JSON: pasa (blancos al final de un JSON válido)
    base = json.dumps({"persona": {"ci": "2.222-2"}}).encode()
    r = client.patch(f"/hce/{hid}", content=base + b" " * (limites.TOPE_JSON - len(base)), headers={"Content-Type": "application/json"})
    assert r.status_code == 200, r.text
    r = client.patch(f"/hce/{hid}", content=base + b" " * (limites.TOPE_JSON + 1 - len(base)), headers={"Content-Type": "application/json"})
    assert r.status_code == 413 and _sobre(r) == ("too_large", [(None, "El pedido supera el máximo de 1 MB.")])


# ── 411 ──────────────────────────────────────────────────────────────────────
def test_un_cuerpo_chunked_sin_content_length_es_411_y_sin_token_401(client, sin_token):
    def trozos():
        yield b'{"persona": {"nombre": "Ana", '
        yield b'"apellido": "Paz", "fecha_nac": "2016-01-01"}}'

    r = client.post("/hce", content=trozos(), headers={"Content-Type": "application/json", "Origin": ORIGEN_DEMO})
    assert "content-length" not in r.request.headers and r.request.headers["transfer-encoding"] == "chunked"
    assert r.status_code == 411, r.text
    assert _sobre(r)[0] == "length_required" and r.headers["access-control-allow-origin"] == ORIGEN_DEMO
    assert sin_token.post("/hce", content=trozos(), headers={"Content-Type": "application/json"}).status_code == 401   # primero el token


# ── recorte ──────────────────────────────────────────────────────────────────
def test_lo_que_pasa_del_content_length_declarado_no_llega_a_la_app(client):
    login = json.dumps({"email": EMAIL_ADMIN, "password": PASSWORD_TEST}).encode()
    e = _llamar_asgi("POST", "/auth/login", login + b"}basura que no es JSON", {"content-type": "application/json"}, declarado=len(login))
    assert e["status"] == 200, e["respuesta"]   # sin el recorte, el JSON con basura al final es 422
    assert json.loads(e["respuesta"])["access_token"]


# ── el 500 sigue cubriendo al middleware ─────────────────────────────────────
def test_si_el_middleware_falla_sale_el_500_con_su_sobre_y_con_cors(client, monkeypatch):
    from app.core import limites

    def _explota(_token):
        raise RuntimeError("falla dentro de los límites")

    monkeypatch.setattr(limites, "leer_token", _explota)
    r = client.post("/hce", json={}, headers={"Origin": ORIGEN_DEMO})
    assert r.status_code == 500
    assert r.json() == {"code": "internal_error", "detail": [{"campo": None, "mensaje": "Error interno"}]}
    assert r.headers["access-control-allow-origin"] == ORIGEN_DEMO
    assert ORIGEN_DEMO in settings.cors_origins


# ── lo que pasa ──────────────────────────────────────────────────────────────
def test_un_pdf_de_1_mb_con_token_es_201(client, categorias, hoy, temporales):
    hid = _hce(client)
    r = client.post(f"/hce/{hid}/documentos", files={"archivo": ("informe.pdf", PDF + b"0" * (1024 * 1024 - len(PDF)), "application/pdf")},
                    data={"categoria_id": str(categorias[INFORME])})
    assert r.status_code == 201, r.text
    assert r.json()["data"]["tamano_bytes"] == 1024 * 1024
    assert len(temporales) == 1   # el contador cuenta: el temporal sí se crea cuando el pedido pasa


def test_un_patch_normal_y_el_login_sin_token_pasan(client, sin_token):
    hid = _hce(client)
    assert client.patch(f"/hce/{hid}", json={"persona": {"ci": "2.222-2"}}).status_code == 200
    r = sin_token.post("/auth/login", json={"email": EMAIL_ADMIN, "password": PASSWORD_TEST})
    assert r.status_code == 200, r.text
    # un POST sin cuerpo y sin Content-Length (lo que manda un cliente que no pone la cabecera) es un cuerpo vacío
    e = _llamar_asgi("POST", "/auth/login", b"", {"content-type": "application/json"}, sin_largo=True)
    assert e["status"] == 422   # llegó a la app (falta el cuerpo), no es 411


def test_los_get_no_cambian(client, sin_token):
    assert sin_token.get("/health").status_code == 200
    r = sin_token.get("/hce")
    assert r.status_code == 401 and r.headers["www-authenticate"] == "Bearer"   # el 401 de siempre, de `usuario_actual`
    assert client.get("/hce").status_code == 200
    assert sin_token.options("/hce", headers={"Origin": ORIGEN_DEMO, "Access-Control-Request-Method": "POST"}).status_code == 200
