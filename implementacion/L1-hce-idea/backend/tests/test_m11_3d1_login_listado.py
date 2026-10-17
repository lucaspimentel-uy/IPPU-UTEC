"""M11.3-d1 · login mínimo (2 roles), alcance por grupo, listado paginado, baja/reingreso y CORS.

Convención de la suite: **todo rechazo va emparejado con el caso que pasa** (401 ↔ 200, 404 ↔ 200,
422 ↔ 200), para que un test en verde no pueda deberse a que el endpoint rechaza todo.

`client` entra como `admin` (`conftest.py`); `token_de(p)` da las cabeceras de otro profesional y
`sin_token` es un cliente sin cabecera de autorización.
"""
import itertools

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.config import Settings
from app.core.seguridad import crear_token, verificar_password
from app.crear_usuario import DatoInvalido, crear_usuario
from app.main import app
from app.models.identidad import HceDiurna, Profesional
from app.models.transversales import Auditoria
from tests.conftest import EMAIL_ADMIN, PASSWORD_TEST

_cis = itertools.count(8_000_000)


@pytest.fixture
def sin_token(client):
    """Mismo `get_db` que `client` (los overrides son de la app), sin `Authorization`."""
    return TestClient(app)


@pytest.fixture
def tecnico(crear_profesional, hash_test):
    return crear_profesional(nombre="Tina Técnica", email="tina@ippu.test", hashed_password=hash_test)


@pytest.fixture
def grupos(crear_grupo, tecnico, crear_profesional):
    """El grupo de `tecnico` (es técnica 2) y otro grupo ajeno, con su propia técnica."""
    otra = crear_profesional(nombre="Otra Técnica")
    return crear_grupo(nombre="Escolares", tecnico2_id=tecnico.id), crear_grupo(nombre="Inicial", tecnico1_id=otra.id)


def _alta(client, grupo_id=None, nombre="Ana", **extra) -> int:
    persona = {"nombre": nombre, "apellido": "Pérez", "ci": f"{next(_cis)}-1", "fecha_nac": "2016-04-12"}
    r = client.post("/hce", json={"persona": persona, "grupo_id": grupo_id, **extra})
    assert r.status_code == 201, r.text
    return r.json()["data"]["id"]


def _filas(db_api, hce_id) -> list[Auditoria]:
    db_api.expire_all()
    return list(db_api.scalars(select(Auditoria).where(Auditoria.hce_id == hce_id).order_by(Auditoria.id)))


# ── Sin token → 401 ──────────────────────────────────────────────────────────
def test_sin_token_toda_ruta_protegida_es_401_y_con_token_200(client, sin_token):
    r = sin_token.get("/hce")
    assert r.status_code == 401
    assert r.json() == {"code": "unauthorized", "detail": [{"campo": None, "mensaje": "Falta el token de acceso"}]}
    assert r.headers["www-authenticate"] == "Bearer"
    assert client.get("/hce").status_code == 200  # el par


def test_todas_las_rutas_salvo_health_y_login_exigen_token(client, sin_token):
    """Barrido sobre el OpenAPI: una ruta nueva que quede abierta por olvido pone esto en rojo."""
    abiertas = {"/health", "/auth/login"}
    esquema = client.get("/openapi.json").json()
    revisadas = 0
    for ruta, operaciones in esquema["paths"].items():
        if ruta in abiertas:
            continue
        concreta = ruta.replace("{hce_id}", "1").replace("{idea_id}", "1").replace(
            "{protocolo_id}", "1").replace("{informe_id}", "1")
        for metodo in operaciones:
            r = sin_token.request(metodo.upper(), concreta, json={})
            assert r.status_code == 401, f"{metodo.upper()} {ruta} → {r.status_code}"
            revisadas += 1
    assert revisadas > 30
    assert sin_token.get("/health").status_code == 200
    assert sin_token.get("/docs").status_code == 200 and sin_token.get("/openapi.json").status_code == 200


def test_un_token_vencido_o_adulterado_es_401_y_uno_vigente_200(client, sin_token, admin):
    vencido = {"Authorization": f"Bearer {crear_token(admin.id, minutos=-1)}"}
    adulterado = {"Authorization": f"Bearer {crear_token(admin.id)}x"}
    for cabeceras in (vencido, adulterado, {"Authorization": "Basic dXNlcjpwYXNz"}):
        r = sin_token.get("/hce", headers=cabeceras)
        assert r.status_code == 401 and r.json()["code"] == "unauthorized"
    assert sin_token.get("/hce", headers={"Authorization": f"Bearer {crear_token(admin.id)}"}).status_code == 200


def test_un_profesional_dado_de_baja_pierde_la_sesion_abierta(client, db_api, tecnico, token_de):
    cabeceras = token_de(tecnico)
    assert client.get("/auth/yo", headers=cabeceras).status_code == 200
    db_api.get(Profesional, tecnico.id).activo = False
    db_api.commit()
    assert client.get("/auth/yo", headers=cabeceras).status_code == 401


# ── Login ────────────────────────────────────────────────────────────────────
def test_login_correcto_devuelve_un_token_que_sirve_y_contrasena_incorrecta_es_401(client, sin_token, tecnico):
    r = sin_token.post("/auth/login", json={"email": "Tina@IPPU.test ", "password": PASSWORD_TEST})
    assert r.status_code == 200, r.text
    cuerpo = r.json()
    assert cuerpo["token_type"] == "bearer" and cuerpo["expira_en_minutos"] == 480
    assert cuerpo["usuario"] == {"id": tecnico.id, "nombre": "Tina Técnica", "email": "tina@ippu.test", "rol": "tecnico"}
    cabeceras = {"Authorization": f"Bearer {cuerpo['access_token']}"}
    assert sin_token.get("/auth/yo", headers=cabeceras).json()["id"] == tecnico.id

    mal = sin_token.post("/auth/login", json={"email": "tina@ippu.test", "password": "otra-cosa"})
    assert mal.status_code == 401 and mal.json()["code"] == "unauthorized"
    nadie = sin_token.post("/auth/login", json={"email": "nadie@ippu.test", "password": PASSWORD_TEST})
    assert nadie.status_code == 401 and nadie.json() == mal.json(), "no revela si el email existe"


def test_login_de_un_inactivo_o_sin_contrasena_es_401(client, sin_token, crear_profesional, hash_test):
    crear_profesional(email="baja@ippu.test", hashed_password=hash_test, activo=False)
    crear_profesional(email="sinclave@ippu.test")
    for email in ("baja@ippu.test", "sinclave@ippu.test"):
        assert sin_token.post("/auth/login", json={"email": email, "password": PASSWORD_TEST}).status_code == 401
    assert sin_token.post("/auth/login", json={"email": EMAIL_ADMIN, "password": PASSWORD_TEST}).status_code == 200


# ── Alcance por grupo ────────────────────────────────────────────────────────
def test_un_tecnico_recibe_404_en_el_expediente_de_otro_grupo_y_200_en_el_suyo(client, grupos, tecnico, token_de):
    propio, ajeno = grupos
    mio, otro = _alta(client, propio.id), _alta(client, ajeno.id)
    cab = token_de(tecnico)
    assert client.get(f"/hce/{mio}", headers=cab).status_code == 200
    r = client.get(f"/hce/{otro}", headers=cab)
    assert r.status_code == 404
    inexistente = client.get(f"/hce/{otro + 999}", headers=cab)
    assert r.json()["detail"][0]["mensaje"] == inexistente.json()["detail"][0]["mensaje"].replace(str(otro + 999), str(otro))
    # lo que cuelga del expediente, por su ruta y por id
    for ruta in ("flujo", "idea", "protocolo", "informe-cierre", "valoracion-funcional", "consentimiento"):
        assert client.get(f"/hce/{otro}/{ruta}", headers=cab).status_code == 404, ruta
    assert client.patch(f"/hce/{otro}", json={"diagnostico": "x"}, headers=cab).status_code == 404
    assert client.patch(f"/hce/{mio}", json={"diagnostico": "x"}, headers=cab).status_code == 200
    # el admin ve los dos
    assert client.get(f"/hce/{otro}").status_code == 200


def test_un_tecnico_no_alcanza_por_id_un_idea_de_otro_grupo(client, grupos, tecnico, token_de, crear_profesional):
    propio, ajeno = grupos
    idea_ajena = client.post(f"/hce/{_alta(client, ajeno.id)}/idea", json={"anio": 2026}).json()["data"]["id"]
    idea_propia = client.post(f"/hce/{_alta(client, propio.id)}/idea", json={"anio": 2026}).json()["data"]["id"]
    cab = token_de(tecnico)
    r = client.get(f"/idea/{idea_ajena}", headers=cab)
    assert r.status_code == 404 and r.json()["detail"][0]["mensaje"] == f"No existe el IDEA {idea_ajena}"
    assert client.patch(f"/idea/{idea_ajena}", json={"objetivos": "x"}, headers=cab).status_code == 404
    assert client.post(f"/idea/{idea_ajena}/firmar", headers=cab).status_code == 404
    assert client.get(f"/idea/{idea_propia}", headers=cab).status_code == 200
    assert client.patch(f"/idea/{idea_propia}", json={"objetivos": "x"}, headers=cab).status_code == 200


def test_la_busqueda_de_un_tecnico_trae_solo_sus_grupos_y_la_del_admin_todo(client, grupos, tecnico, token_de):
    propio, ajeno = grupos
    mio, otro = _alta(client, propio.id), _alta(client, ajeno.id)
    sin_grupo = _alta(client)
    r = client.get("/hce", headers=token_de(tecnico))
    assert [f["id"] for f in r.json()] == [mio] and r.headers["x-total-count"] == "1"
    todos = client.get("/hce")
    assert sorted(f["id"] for f in todos.json()) == sorted([mio, otro, sin_grupo])
    assert todos.headers["x-total-count"] == "3"


def test_las_filas_de_auditoria_llevan_el_usuario_del_token(client, db_api, grupos, tecnico, token_de, admin):
    propio, _ = grupos
    hid = _alta(client, propio.id)
    client.patch(f"/hce/{hid}", json={"diagnostico": "TEA"}, headers=token_de(tecnico))
    filas = _filas(db_api, hid)
    assert [(f.tipo, f.usuario_id) for f in filas] == [("carga", admin.id), ("edicion", tecnico.id)]


def test_un_tecnico_da_de_alta_solo_en_un_grupo_propio(client, grupos, tecnico, token_de, db_api):
    propio, ajeno = grupos
    persona = lambda: {"nombre": "Leo", "apellido": "Gil", "ci": f"{next(_cis)}-2", "fecha_nac": "2017-01-01"}  # noqa: E731
    cab = token_de(tecnico)
    for grupo_id in (ajeno.id, None):
        r = client.post("/hce", json={"persona": persona(), "grupo_id": grupo_id}, headers=cab)
        assert r.status_code == 403 and r.json()["detail"][0]["campo"] == "grupo_id"
    r = client.post("/hce", json={"persona": persona(), "grupo_id": propio.id}, headers=cab)
    assert r.status_code == 201
    hid = r.json()["data"]["id"]
    assert client.patch(f"/hce/{hid}", json={"grupo_id": ajeno.id}, headers=cab).status_code == 403
    assert client.patch(f"/hce/{hid}", json={"grupo_id": ajeno.id}).status_code == 200  # el admin sí


# ── Listado paginado ─────────────────────────────────────────────────────────
def test_la_busqueda_pagina_con_limit_y_offset_y_el_total_va_en_la_cabecera(client):
    ids = [_alta(client, nombre=f"N{i}") for i in range(5)]
    ordenados = [f["id"] for f in client.get("/hce").json()]
    assert sorted(ordenados) == sorted(ids)
    p1 = client.get("/hce", params={"limit": 2})
    p3 = client.get("/hce", params={"limit": 2, "offset": 4})
    assert [f["id"] for f in p1.json()] == ordenados[:2] and [f["id"] for f in p3.json()] == ordenados[4:]
    assert p1.headers["x-total-count"] == p3.headers["x-total-count"] == "5"
    assert client.get("/hce", params={"offset": 10}).json() == []


@pytest.mark.parametrize("params", [{"limit": 0}, {"limit": 201}, {"offset": -1}])
def test_limit_fuera_de_1_a_200_u_offset_negativo_es_422_y_200_en_el_borde(client, params):
    assert client.get("/hce", params=params).status_code == 422
    assert client.get("/hce", params={"limit": 200, "offset": 0}).status_code == 200


def test_el_limite_por_omision_es_50(client, monkeypatch):
    from app.services import hce as servicio_hce

    visto = {}
    original = servicio_hce.buscar_hce

    def espia(*a, **k):
        visto.update(k)
        return original(*a, **k)

    monkeypatch.setattr(servicio_hce, "buscar_hce", espia)
    assert client.get("/hce").status_code == 200
    assert (visto["limit"], visto["offset"]) == (50, 0)


# ── Baja y reingreso ─────────────────────────────────────────────────────────
def test_la_baja_exige_fecha_y_con_fecha_audita_y_saca_al_expediente_de_la_busqueda(client, db_api):
    hid = _alta(client, nombre="Baja")
    r = client.patch(f"/hce/{hid}", json={"activo": False})
    assert r.status_code == 422 and r.json()["detail"] == [{"campo": "fecha_baja", "mensaje": "La baja exige la fecha de baja"}]
    r = client.patch(f"/hce/{hid}", json={"activo": False, "fecha_baja": "2026-10-07"})
    assert r.status_code == 200
    assert (r.json()["data"]["activo"], r.json()["data"]["fecha_baja"]) == (False, "2026-10-07")
    assert [(f.campo, f.valor_ant, f.valor_nuevo) for f in _filas(db_api, hid) if f.tipo == "edicion"] == [
        ("activo", "True", "False"), ("fecha_baja", None, "2026-10-07"),
    ]
    assert hid not in [f["id"] for f in client.get("/hce").json()]
    con = client.get("/hce", params={"incluir_inactivos": "true"})
    assert hid in [f["id"] for f in con.json()] and con.headers["x-total-count"] == "1"
    assert client.get(f"/hce/{hid}").status_code == 200  # por id se sigue leyendo


def test_el_reingreso_borra_la_fecha_de_baja_y_audita(client, db_api):
    hid = _alta(client)
    client.patch(f"/hce/{hid}", json={"activo": False, "fecha_baja": "2026-03-01"})
    r = client.patch(f"/hce/{hid}", json={"activo": True})
    assert r.status_code == 200 and (r.json()["data"]["activo"], r.json()["data"]["fecha_baja"]) == (True, None)
    assert [(f.campo, f.valor_ant, f.valor_nuevo) for f in _filas(db_api, hid) if f.tipo == "edicion"][-2:] == [
        ("activo", "False", "True"), ("fecha_baja", "2026-03-01", None),
    ]
    assert hid in [f["id"] for f in client.get("/hce").json()]


def test_fecha_de_baja_en_un_activo_o_activo_null_es_422(client):
    hid = _alta(client)
    assert client.patch(f"/hce/{hid}", json={"fecha_baja": "2026-03-01"}).status_code == 422
    assert client.patch(f"/hce/{hid}", json={"activo": True, "fecha_baja": "2026-03-01"}).status_code == 422
    assert client.patch(f"/hce/{hid}", json={"activo": None}).status_code == 422
    # el par: un activo que «reingresa» no cambia nada ni falla; uno de baja corrige su fecha
    assert client.patch(f"/hce/{hid}", json={"activo": True}).status_code == 200
    client.patch(f"/hce/{hid}", json={"activo": False, "fecha_baja": "2026-03-01"})
    r = client.patch(f"/hce/{hid}", json={"fecha_baja": "2026-03-02"})
    assert r.status_code == 200 and r.json()["data"]["fecha_baja"] == "2026-03-02"


def test_el_alta_ignora_activo_y_fecha_baja(client, db_api):
    hid = _alta(client, activo=False, fecha_baja="2026-01-01")
    db_api.expire_all()
    assert db_api.scalar(select(HceDiurna.activo).where(HceDiurna.id == hid)) is True


# ── CORS ─────────────────────────────────────────────────────────────────────
def test_cors_origins_sale_de_la_variable_de_entorno(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", '["http://demo.local:5500"]')
    assert Settings(_env_file=None).cors_origins == ["http://demo.local:5500"]
    monkeypatch.delenv("CORS_ORIGINS")
    assert "http://localhost:5500" in Settings(_env_file=None).cors_origins


def test_la_demo_local_pasa_el_preflight_y_puede_leer_el_total(client):
    from app.core.config import settings

    origen = settings.cors_origins[0]
    pre = client.options("/hce", headers={
        "Origin": origen, "Access-Control-Request-Method": "GET", "Access-Control-Request-Headers": "authorization",
    })
    assert pre.status_code == 200 and pre.headers["access-control-allow-origin"] == origen
    r = client.get("/hce", headers={"Origin": origen})
    assert "x-total-count" in r.headers["access-control-expose-headers"].lower()
    ajeno = client.options("/hce", headers={"Origin": "http://evil.test", "Access-Control-Request-Method": "GET"})
    assert "access-control-allow-origin" not in ajeno.headers


# ── CLI `python -m app.crear_usuario` ────────────────────────────────────────
def test_crear_usuario_hashea_y_el_usuario_puede_entrar(client, sin_token, db_api):
    p = crear_usuario(db_api, email=" Nuevo@IPPU.test", nombre="Nuevo", rol="tecnico", password="una-clave-larga")
    db_api.commit()
    assert p.email == "nuevo@ippu.test" and p.hashed_password != "una-clave-larga"
    assert verificar_password("una-clave-larga", p.hashed_password)
    r = sin_token.post("/auth/login", json={"email": "nuevo@ippu.test", "password": "una-clave-larga"})
    assert r.status_code == 200 and r.json()["usuario"]["rol"] == "tecnico"


@pytest.mark.parametrize("cambio", [
    {"email": "admin@ippu.test"}, {"rol": "director"}, {"password": "corta"}, {"email": "sin-arroba"},
])
def test_crear_usuario_rechaza_duplicado_rol_invalido_y_clave_corta(client, db_api, cambio):
    datos = {"email": "otro@ippu.test", "nombre": "Otro", "rol": "admin", "password": "una-clave-larga", **cambio}
    with pytest.raises(DatoInvalido):
        crear_usuario(db_api, **datos)
    datos.update(email="valido@ippu.test", rol="admin", password="una-clave-larga")
    assert crear_usuario(db_api, **datos).id is not None  # el par


def test_el_cli_sale_con_1_si_el_email_existe(monkeypatch, capsys):
    from app import crear_usuario as cli

    class _Sesion:
        def __enter__(self):
            return self

        def __exit__(self, *a):
            return False

    def _falla(*a, **k):
        raise DatoInvalido("Ya existe un profesional con el email x@ippu.test")

    from app.core.destino import VARIABLE, base_destino

    monkeypatch.setenv("IPPU_PASSWORD", "una-clave-larga")
    monkeypatch.setenv(VARIABLE, base_destino())  # la guardia de destino (D0, §5.139) deja pasar
    monkeypatch.setattr("app.core.database.SessionLocal", _Sesion)
    monkeypatch.setattr(cli, "crear_usuario", _falla)
    assert cli.main(["--email", "x@ippu.test", "--nombre", "X", "--rol", "tecnico"]) == 1
    assert "Ya existe" in capsys.readouterr().err

