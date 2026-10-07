"""B-front · lecturas que pedía la demo conectada (Fase 3): lista con `fecha_nac` + `flujo`, técnicos del grupo, CORS.

Convención de la suite: cada visibilidad va emparejada (`tecnico` ↔ `admin`), para que un test en
verde no pueda deberse a que el endpoint devuelve siempre vacío o siempre todo.
"""
import itertools

import pytest
from sqlalchemy import event

from app.services.fechas import anio_actual

_cis = itertools.count(8_200_000)

IDEA_MARTIN = [6, 6, 6, 6, 4, 4, 4, 6, 4, 4, 4, 4]
MODULOS = ["HCE-LB", "HCE-PA", "HCE-PB", "HCE-IC"]


@pytest.fixture
def tecnico(crear_profesional, hash_test):
    return crear_profesional(nombre="Tina Técnica", email="tina@ippu.test", hashed_password=hash_test)


@pytest.fixture
def grupos(crear_grupo, tecnico, crear_profesional):
    """El grupo de `tecnico` (técnica 1, con rol) y uno ajeno con otra técnica y sin técnico 2."""
    otra = crear_profesional(nombre="Otra Técnica", hashed_password=None)
    propio = crear_grupo(nombre="Escolares", tecnico1_id=tecnico.id, tecnico1_rol="Psicólogo/a")
    ajeno = crear_grupo(nombre="Inicial", tecnico1_id=otra.id, tecnico1_rol="Maestro/a")
    return propio, ajeno


@pytest.fixture
def equipo(crear_profesional):
    return crear_profesional(nombre="Ana"), crear_profesional(nombre="Beto")


def _alta(client, grupo_id, nombre="Ana", fecha_nac="2016-04-12") -> int:
    r = client.post("/hce", json={
        "persona": {"nombre": nombre, "apellido": "Pérez", "ci": f"{next(_cis)}-1", "fecha_nac": fecha_nac},
        "grupo_id": grupo_id,
    })
    assert r.status_code == 201, r.text
    return r.json()["data"]["id"]


def _idea(client, hce, equipo, anio, firmar) -> None:
    r = client.post(f"/hce/{hce}/idea", json={
        "anio": anio, "dim": {f"D{i + 1}": {"valor": v} for i, v in enumerate(IDEA_MARTIN)},
        "fecha_consenso": f"{anio}-03-18", "sesiones": 6, "sintesis": "Síntesis. " * 60, "objetivos": "Objetivos.",
        "evaluador_t1_id": equipo[0].id, "evaluador_t2_id": equipo[1].id,
    })
    assert r.status_code == 201, r.text
    if firmar:
        assert client.post(f"/idea/{r.json()['data']['id']}/firmar").status_code == 200


def _protocolo_en_curso(client, hce, anio, tipo="A") -> None:
    r = client.post(f"/hce/{hce}/protocolo", json={"tipo": tipo, "anio": anio, "items": {"1": {"valor": 3}}})
    assert r.status_code == 201, r.text


def _flujo_de_la_lista(client, hce, **params):
    fila = next(f for f in client.get("/hce", params=params).json() if f["id"] == hce)
    return fila["flujo"]


# ── 1. Lista: fecha_nac y flujo ──────────────────────────────────────────────
def test_la_lista_trae_la_fecha_de_nacimiento_de_cada_persona(client, grupos):
    a = _alta(client, grupos[0].id, nombre="Ana", fecha_nac="2016-04-12")
    b = _alta(client, grupos[0].id, nombre="Bea", fecha_nac="2019-11-30")
    filas = {f["id"]: f for f in client.get("/hce").json()}
    assert filas[a]["persona"]["fecha_nac"] == "2016-04-12"
    assert filas[b]["persona"]["fecha_nac"] == "2019-11-30"


def test_el_flujo_de_la_lista_es_el_de_modulos_del_endpoint_de_flujo(client, grupos, equipo):
    anio = anio_actual()
    sin = _alta(client, grupos[0].id, nombre="Sin")
    mixto = _alta(client, grupos[0].id, nombre="Mixto")
    _idea(client, mixto, equipo, anio, firmar=True)
    _protocolo_en_curso(client, mixto, anio, "A")

    assert [(m["modulo"], m["estado"]) for m in _flujo_de_la_lista(client, sin)] == [
        (m, "sin_iniciar") for m in MODULOS
    ]
    assert _flujo_de_la_lista(client, mixto) == [
        {"modulo": "HCE-LB", "estado": "firmado"}, {"modulo": "HCE-PA", "estado": "en_curso"},
        {"modulo": "HCE-PB", "estado": "sin_iniciar"}, {"modulo": "HCE-IC", "estado": "sin_iniciar"},
    ]
    # Misma forma y mismos estados que `modulos[]` de `GET /hce/{id}/flujo`.
    for hce in (sin, mixto):
        modulos = client.get(f"/hce/{hce}/flujo", params={"anio": anio}).json()["modulos"]
        assert [{"modulo": m["modulo"], "estado": m["estado"]} for m in modulos] == _flujo_de_la_lista(client, hce)


def test_el_flujo_de_la_lista_mira_solo_el_anio_en_curso(client, grupos, equipo):
    hce = _alta(client, grupos[0].id)
    _idea(client, hce, equipo, anio_actual() - 1, firmar=True)  # un IDEA firmado, pero de otro año
    assert [m["estado"] for m in _flujo_de_la_lista(client, hce)] == ["sin_iniciar"] * 4
    _idea(client, hce, equipo, anio_actual(), firmar=False)
    assert [m["estado"] for m in _flujo_de_la_lista(client, hce)] == ["en_curso", "sin_iniciar", "sin_iniciar", "sin_iniciar"]


def test_la_lista_vacia_sigue_siendo_valida_con_el_flujo_en_bloque(client):
    r = client.get("/hce")
    assert r.status_code == 200 and r.json() == []


def _consultas(db_api_engine_conexion, llamada) -> int:
    contador = {"n": 0}

    def _cuenta(*_a, **_k):
        contador["n"] += 1

    event.listen(db_api_engine_conexion, "before_cursor_execute", _cuenta)
    try:
        llamada()
    finally:
        event.remove(db_api_engine_conexion, "before_cursor_execute", _cuenta)
    return contador["n"]


#: Sentencias de un `GET /hce` (B-front-fix), medidas en la conexión de test: SAVEPOINT + usuario del token +
#: total + página (con persona y grupo) + 3 de flujo (IDEA, protocolos, informes) + 1 de CI + ROLLBACK TO
#: SAVEPOINT. El número no depende de las filas ni de los grupos: si alguien agrega una consulta por fila,
#: o una más a la lista, este test lo dice.
CONSULTAS_GET_HCE = 9


def test_la_lista_hace_exactamente_las_mismas_consultas_con_pocas_o_muchas_filas_en_varios_grupos(
    client, conexion_api, grupos, equipo,
):
    """El `flujo` y el `ci` se arman en bloque: las consultas no crecen con las filas (nada de un request por fila)."""
    propio, ajeno = grupos
    anio = anio_actual()
    for i, grupo in enumerate((propio, ajeno)):
        hce = _alta(client, grupo.id, nombre=f"N{i}")
        _idea(client, hce, equipo, anio, firmar=True)
    pocas = _consultas(conexion_api, lambda: client.get("/hce"))

    for i in range(10):
        hce = _alta(client, (propio, ajeno)[i % 2].id, nombre=f"M{i}")
        _idea(client, hce, equipo, anio, firmar=bool(i % 2))
        _protocolo_en_curso(client, hce, anio)
        if i % 3 == 0:
            assert client.post(f"/hce/{hce}/consentimiento", json={"firmante": "Marta", "fecha": f"{anio}-03-02"}).status_code == 201
    muchas = _consultas(conexion_api, lambda: client.get("/hce"))

    assert len(client.get("/hce").json()) == 12
    assert pocas == muchas == CONSULTAS_GET_HCE


def test_la_lista_trae_el_ci_con_el_vocabulario_del_flujo(client, grupos):
    sin, con = _alta(client, grupos[0].id, nombre="Sin"), _alta(client, grupos[0].id, nombre="Con")
    assert client.post(f"/hce/{con}/consentimiento", json={"firmante": "Marta", "fecha": "2026-03-02"}).status_code == 201
    filas = {f["id"]: f for f in client.get("/hce").json()}
    assert (filas[sin]["ci"], filas[con]["ci"]) == ("pendiente", "registrado")
    assert {f["ci"] for f in filas.values()} <= set(client.get("/openapi.json").json()["components"]["schemas"]["FlujoDetalle"]["properties"]["ci"]["enum"])


def test_el_tecnico_ve_en_la_lista_solo_sus_filas_con_su_flujo_y_el_admin_todas(client, grupos, equipo, tecnico, token_de):
    propio, ajeno = grupos
    anio = anio_actual()
    mio = _alta(client, propio.id, nombre="Mio")
    otro = _alta(client, ajeno.id, nombre="Otro")
    _idea(client, mio, equipo, anio, firmar=True)
    _idea(client, otro, equipo, anio, firmar=False)

    del_tecnico = client.get("/hce", headers=token_de(tecnico)).json()
    assert [f["id"] for f in del_tecnico] == [mio]
    assert del_tecnico[0]["flujo"][0] == {"modulo": "HCE-LB", "estado": "firmado"}
    assert "fecha_nac" in del_tecnico[0]["persona"]

    del_admin = {f["id"]: f for f in client.get("/hce").json()}
    assert set(del_admin) == {mio, otro}
    assert del_admin[otro]["flujo"][0] == {"modulo": "HCE-LB", "estado": "en_curso"}


def test_la_paginacion_y_el_total_no_cambian_con_el_flujo(client, grupos):
    for i in range(3):
        _alta(client, grupos[0].id, nombre=f"P{i}")
    r = client.get("/hce", params={"limit": 2})
    assert len(r.json()) == 2 and r.headers["X-Total-Count"] == "3"
    assert all(len(f["flujo"]) == 4 for f in r.json())


# ── 2. Técnicos del grupo ────────────────────────────────────────────────────
def test_get_grupos_trae_los_tecnicos_con_su_rol_en_el_grupo_y_null_si_no_hay(client, grupos, tecnico):
    propio, ajeno = grupos
    por_nombre = {g["nombre"]: g for g in client.get("/grupos").json()}
    assert por_nombre["Escolares"]["tecnico1"] == {"id": tecnico.id, "nombre": "Tina Técnica", "rol": "Psicólogo/a"}
    assert por_nombre["Escolares"]["tecnico2"] is None
    assert por_nombre["Inicial"]["tecnico1"]["rol"] == "Maestro/a" and por_nombre["Inicial"]["tecnico2"] is None
    assert {"id", "nombre", "anio"} <= set(por_nombre["Escolares"])  # los campos de antes siguen


def test_get_grupos_lo_ven_igual_un_admin_y_un_tecnico_sin_permisos_nuevos(client, grupos, tecnico, token_de):
    como_admin = client.get("/grupos").json()
    como_tecnico = client.get("/grupos", headers=token_de(tecnico)).json()
    assert como_admin == como_tecnico and len(como_admin) == 2
    assert client.get("/grupos", headers={"Authorization": "Bearer invalido"}).status_code == 401


def test_un_grupo_sin_tecnicos_devuelve_ambos_en_null(client, crear_grupo):
    crear_grupo(nombre="Vacío")
    g = next(g for g in client.get("/grupos").json() if g["nombre"] == "Vacío")
    assert g["tecnico1"] is None and g["tecnico2"] is None


def test_get_grupos_hace_una_sola_consulta_de_grupos_con_cualquier_cantidad_de_tecnicos(client, conexion_api, crear_grupo, crear_profesional):
    crear_grupo(nombre="Uno")
    antes = _consultas(conexion_api, lambda: client.get("/grupos"))
    for i in range(4):
        crear_grupo(nombre=f"G{i}", tecnico1_id=crear_profesional().id, tecnico2_id=crear_profesional().id)
    despues = _consultas(conexion_api, lambda: client.get("/grupos"))
    assert antes == despues


def test_el_grupo_del_detalle_trae_los_tecnicos_y_el_de_la_lista_no_cambia(client, grupos, tecnico):
    propio, _ = grupos
    hce = _alta(client, propio.id)
    grupo = client.get(f"/hce/{hce}").json()["grupo"]
    assert grupo == {
        "id": propio.id, "nombre": "Escolares", "anio": propio.anio,
        "tecnico1": {"id": tecnico.id, "nombre": "Tina Técnica", "rol": "Psicólogo/a"}, "tecnico2": None,
    }
    assert client.get("/hce").json()[0]["grupo"] == {"id": propio.id, "nombre": "Escolares", "anio": propio.anio}


def test_el_detalle_sin_grupo_sigue_siendo_null(client):
    r = client.post("/hce", json={"persona": {"nombre": "Sin", "apellido": "Grupo", "ci": f"{next(_cis)}-1", "fecha_nac": "2016-04-12"}})
    assert r.status_code == 201
    assert client.get(f"/hce/{r.json()['data']['id']}").json()["grupo"] is None


def test_la_asignacion_por_patch_se_ve_en_get_grupos_y_en_el_detalle(client, crear_grupo, crear_profesional):
    grupo = crear_grupo(nombre="Escolares")
    ana = crear_profesional(nombre="Ana")
    hce = _alta(client, grupo.id)
    assert client.get(f"/hce/{hce}").json()["grupo"]["tecnico1"] is None
    r = client.patch(f"/grupos/{grupo.id}", json={"tecnico1_id": ana.id, "tecnico1_rol": "Psicólogo/a"})
    assert r.status_code == 200
    assert r.json()["data"]["tecnico1_id"] == ana.id  # el PATCH conserva su forma plana
    esperado = {"id": ana.id, "nombre": "Ana", "rol": "Psicólogo/a"}
    assert client.get(f"/hce/{hce}").json()["grupo"]["tecnico1"] == esperado
    assert next(g for g in client.get("/grupos").json() if g["id"] == grupo.id)["tecnico1"] == esperado


# ── 4. CORS ──────────────────────────────────────────────────────────────────
def test_cors_acepta_la_demo_en_localhost_5500_y_rechaza_otro_origen(client):
    pedido = {"Access-Control-Request-Method": "GET", "Access-Control-Request-Headers": "authorization"}
    ok = client.options("/hce", headers={"Origin": "http://localhost:5500", **pedido})
    assert ok.status_code == 200
    assert ok.headers["access-control-allow-origin"] == "http://localhost:5500"
    ajeno = client.options("/hce", headers={"Origin": "http://localhost:9999", **pedido})
    assert ajeno.status_code == 400 and "access-control-allow-origin" not in ajeno.headers


def test_el_total_de_la_lista_se_puede_leer_desde_el_navegador(client):
    r = client.get("/hce", headers={"Origin": "http://localhost:5500"})
    assert r.headers["access-control-expose-headers"] == "X-Total-Count"


def test_los_origenes_se_configuran_por_cors_origins(monkeypatch):
    from app.core.config import Settings

    monkeypatch.setenv("SECRET_KEY", "x" * 48)
    monkeypatch.setenv("CORS_ORIGINS", '["http://demo.local:8080"]')
    assert Settings().cors_origins == ["http://demo.local:8080"]
    monkeypatch.delenv("CORS_ORIGINS")
    assert "http://localhost:5500" in Settings().cors_origins


@pytest.mark.parametrize("metodo", ["POST", "PATCH"])
def test_cors_preflight_de_escritura_con_content_type_json_desde_la_demo(client, metodo):
    pedido = {"Access-Control-Request-Method": metodo, "Access-Control-Request-Headers": "content-type,authorization"}
    ok = client.options("/hce" if metodo == "POST" else "/hce/1", headers={"Origin": "http://localhost:5500", **pedido})
    assert ok.status_code == 200
    assert ok.headers["access-control-allow-origin"] == "http://localhost:5500"
    assert metodo in ok.headers["access-control-allow-methods"] or ok.headers["access-control-allow-methods"] == "*"
    assert "content-type" in ok.headers["access-control-allow-headers"].lower()
    ajeno = client.options("/hce", headers={"Origin": "http://localhost:9999", **pedido})
    assert ajeno.status_code == 400
