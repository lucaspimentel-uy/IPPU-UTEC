"""S1 · B1 y B8 (`handoff.md` §5.163 a): la entrada que la base no acepta se rechaza antes con un 422 o un 404, y un error
de la base nunca llega al cliente ni deja los valores en el log.

- NUL (U+0000) en un texto, en una clave o en una cadena de un JSON, en un formulario o en la query → 422 con su `campo`.
- Un id de ruta fuera de `int4` → el mismo 404 que uno que no existe.
- Un `DataError` que aun así escape → 422 `invalid_value`, `campo` null, mensaje genérico, sin la causa.
- `hide_parameters`: el log de un error de la base no lleva el valor enlazado.

Convención del repo: cada rechazo va con el caso que pasa (acentos, eñes, emoji, tabulaciones y saltos de línea).
"""
import logging

import pytest
from sqlalchemy import select, text
from sqlalchemy.exc import DataError

from app.core import database
from app.core.entrada import normalizar_ruta
from app.models.identidad import Persona
from app.services import hce as servicio_hce
from test_c5_documentos import INFORME, PDF, categorias, hoy  # noqa: F401  (fixtures)
from test_m11_3b_idea_flujo import _cis, _hce

NUL = "\x00"


def _persona(**campos) -> dict:
    return {"persona": {"nombre": "Martín", "apellido": "Rodríguez", "ci": f"{next(_cis)}-1", "fecha_nac": "2016-04-12", **campos}}


def _campos(r) -> list:
    return [d["campo"] for d in r.json()["detail"]]


# ── NUL ──────────────────────────────────────────────────────────────────────
def test_un_nul_en_el_alta_de_la_hce_es_422_en_su_campo_y_sin_el_pasa(client, db_api):
    r = client.post("/hce", json=_persona(nombre=f"Mar{NUL}tín"))
    assert r.status_code == 422 and r.json()["code"] == "validation_error"
    assert _campos(r) == ["persona.nombre"]
    assert r.json()["detail"][0]["mensaje"] == "No puede contener el carácter nulo (U+0000)."
    r = client.post("/hce", json={**_persona(), "diagnostico": f"TEA{NUL}"})
    assert r.status_code == 422 and _campos(r) == ["diagnostico"]
    assert db_api.scalar(select(Persona).where(Persona.nombre.like("Mar%"))) is None    # nada quedó escrito
    assert client.post("/hce", json=_persona()).status_code == 201


def test_un_nul_en_el_patch_de_la_hce_es_422_en_su_campo_y_sin_el_pasa(client):
    hid = _hce(client)
    for cuerpo, campo in (({"persona": {"localidad": f"Monte{NUL}video"}}, "persona.localidad"), ({"alerta": f"a{NUL}"}, "alerta")):
        r = client.patch(f"/hce/{hid}", json=cuerpo)
        assert r.status_code == 422 and _campos(r) == [campo], r.text
    assert client.patch(f"/hce/{hid}", json={"persona": {"localidad": "Montevideo"}, "alerta": "Alergia"}).status_code == 200


def test_un_nul_en_un_formulario_de_documentos_es_422_en_su_campo_y_sin_el_pasa(client, categorias):
    hid = _hce(client)
    ruta = f"/hce/{hid}/documentos"
    r = client.post(ruta, files={"archivo": ("a.pdf", PDF, "application/pdf")}, data={"categoria_id": str(categorias[INFORME]), "nombre": f"in{NUL}forme"})
    assert r.status_code == 422 and _campos(r) == ["nombre"]
    r = client.post(ruta, files={"archivo": ("a.pdf", PDF, "application/pdf")}, data={"categoria_id": str(categorias[INFORME]), "nombre": "informe"})
    assert r.status_code == 201


def test_un_nul_dentro_de_una_cadena_de_la_anamnesis_es_422_con_el_camino_y_sin_el_pasa(client):
    hid = _hce(client)
    for anamnesis, campo in (
        ({"embarazo": f"sin{NUL}complicaciones"}, "anamnesis.embarazo"),
        ({"hitos": {"sentado": ["6 meses", f"gateo{NUL}"]}}, "anamnesis.hitos.sentado.1"),
        ({f"cla{NUL}ve": "x"}, "anamnesis.cla\x00ve"),
    ):
        r = client.patch(f"/hce/{hid}", json={"anamnesis": anamnesis})
        assert r.status_code == 422 and _campos(r) == [campo], r.text
    ok = {"embarazo": "Sin complicaciones — ñandú 🙂", "notas": "línea 1\n\tlínea 2", "hitos": {"sentado": ["6 meses"]}, "n": 3, "x": None}
    r = client.patch(f"/hce/{hid}", json={"anamnesis": ok})
    assert r.status_code == 200 and client.get(f"/hce/{hid}").json()["anamnesis"] == ok


def test_acentos_enie_emoji_tabs_y_saltos_de_linea_pasan(client):
    r = client.post("/hce", json={**_persona(nombre="Ñandú Ángel", referente="Mamá 🙂"), "medicacion": "Risperidona\n\t0,5 mg — noche", "alerta": "Alergia a la penicilina\r\nverificar"})
    assert r.status_code == 201, r.text
    d = client.get(f"/hce/{r.json()['data']['id']}").json()
    assert d["medicacion"] == "Risperidona\n\t0,5 mg — noche" and d["persona"]["nombre"] == "Ñandú Ángel"


def test_un_nul_en_la_query_es_422_y_sin_el_pasa(client):
    r = client.get("/hce", params={"q": f"mar{NUL}tin"})
    assert r.status_code == 422 and _campos(r) == ["q"]
    assert client.get("/hce", params={"q": "martín"}).status_code == 200


def test_un_nul_en_el_login_es_422_y_sin_el_un_401(sin_token):
    r = sin_token.post("/auth/login", json={"email": f"a{NUL}@x.test", "password": "x"})
    assert r.status_code == 422 and _campos(r) == ["email"]
    assert sin_token.post("/auth/login", json={"email": "a@x.test", "password": "x"}).status_code == 401


def test_sin_token_el_nul_no_se_juzga_primero(sin_token):
    """El 401 va antes: un cliente sin credenciales no recibe un 422 sobre su cuerpo."""
    r = sin_token.post("/hce", json=_persona(nombre=f"a{NUL}"))
    assert r.status_code == 401


@pytest.fixture
def sin_token(client):
    from fastapi.testclient import TestClient

    from app.main import app

    return TestClient(app)


# ── Ids fuera de int4 ────────────────────────────────────────────────────────
@pytest.mark.parametrize("grande", [2_147_483_648, 9_223_372_036_854_775_808, 10**30, "0000000000000000000002147483648"])
@pytest.mark.parametrize("ruta", ["/hce/{}", "/idea/{}", "/ateneos/{}"])
def test_un_id_fuera_de_int4_es_el_mismo_404_que_uno_inexistente(client, ruta, grande):
    inexistente = client.get(ruta.format(999_999))
    assert inexistente.status_code == 404
    r = client.get(ruta.format(grande))
    assert r.status_code == 404 and r.json() == inexistente.json()


def test_el_maximo_de_int4_es_un_404_comun_y_un_id_real_pasa(client):
    assert client.get("/hce/2147483647").status_code == 404
    assert client.get(f"/hce/{_hce(client)}").status_code == 200
    # con ceros a la izquierda sigue siendo el mismo número
    hid = _hce(client)
    assert client.get(f"/hce/000000000000000{hid}").status_code == 200


def test_un_id_fuera_de_int4_en_cualquier_ruta_y_metodo_es_404_tambien_para_un_tecnico(client, crear_profesional, hash_test, token_de):
    tecnico = crear_profesional(hashed_password=hash_test)
    for metodo, ruta in (("GET", "/hce/9223372036854775808/documentos"), ("PATCH", "/hce/2147483648"), ("GET", "/hce/1/documentos/2147483648"),
                         ("GET", "/grupos/2147483648/fotos"), ("PATCH", "/ateneos/2147483648/acuerdos/1")):
        r = client.request(metodo, ruta, json={} if metodo == "PATCH" else None, headers=token_de(tecnico))
        assert r.status_code == 404, (metodo, ruta, r.text)


def test_la_ruta_se_normaliza_solo_en_los_segmentos_que_pasan_de_int4():
    assert normalizar_ruta("/hce/2147483647/documentos/2147483648") == "/hce/2147483647/documentos/0"
    assert normalizar_ruta("/hce/12/idea/vigente") == "/hce/12/idea/vigente"
    assert normalizar_ruta("/hce/abc9999999999") == "/hce/abc9999999999"
    assert normalizar_ruta("/") == "/"


# ── DataError → 422 invalid_value ────────────────────────────────────────────
def test_un_entero_fuera_de_rango_en_el_cuerpo_es_422_invalid_value_sin_la_causa_y_no_deja_nada(client, db_api):
    antes = db_api.scalar(select(Persona.id).order_by(Persona.id.desc()).limit(1))
    r = client.post("/hce", json={**_persona(nombre="Fuera de rango"), "grupo_id": 99_999_999_999})
    assert r.status_code == 422
    assert r.json() == {"code": "invalid_value", "detail": [{"campo": None, "mensaje": "Alguno de los valores enviados no es válido."}]}
    assert not any(palabra in r.text.lower() for palabra in ("integer", "range", "psycopg", "sql", "select"))
    db_api.expire_all()
    assert db_api.scalar(select(Persona.id).order_by(Persona.id.desc()).limit(1)) == antes     # el rollback no dejó la persona
    assert client.post("/hce", json=_persona(nombre="En rango")).status_code == 201             # y la sesión sigue sirviendo


def test_un_data_error_forzado_en_un_servicio_es_422_sin_la_causa(client, monkeypatch, caplog):
    def romper(*a, **k):
        raise DataError("SELECT secreto FROM persona", {"v": "valor-secreto-123"}, Exception("integer out of range: valor-secreto-123"))

    hid = _hce(client)
    monkeypatch.setattr(servicio_hce, "obtener_hce", romper)
    with caplog.at_level(logging.WARNING):
        r = client.get(f"/hce/{hid}")
    assert r.status_code == 422 and r.json()["code"] == "invalid_value" and r.json()["detail"][0]["campo"] is None
    assert "valor-secreto-123" not in r.text and "secreto" not in r.text and "out of range" not in r.text
    assert "valor-secreto-123" not in caplog.text          # ni la causa ni el valor van al log
    assert "Valor rechazado por la base" in caplog.text                  # pero queda constancia de qué pasó


# ── B8: hide_parameters ──────────────────────────────────────────────────────
def test_el_engine_de_la_app_oculta_los_parametros():
    assert database.engine.hide_parameters is True


def test_un_error_de_la_base_no_deja_el_valor_enlazado_en_el_log(caplog):
    """Se fuerza un error con el engine real de la app: la sentencia y el tipo de error salen; el valor, no."""
    valor = 7_654_321_098_765   # fuera de int4: Postgres lo rechaza sin citar el valor
    with database.engine.connect() as con, caplog.at_level(logging.DEBUG):
        try:
            con.execute(text("SELECT CAST(:v AS INTEGER)"), {"v": valor})
        except Exception as exc:  # noqa: BLE001
            logging.getLogger("app.test").exception("falló: %s", exc)
    assert caplog.text and "CAST" in caplog.text            # la sentencia está
    assert str(valor) not in caplog.text


def test_el_500_de_un_error_de_la_base_no_lleva_el_valor_ni_en_la_respuesta_ni_en_el_log(client, monkeypatch, caplog):
    """Con el engine de pruebas (que también oculta parámetros, como el de la app) un `StatementError` que llega al
    middleware del 500 deja la sentencia en el log y ningún valor."""
    from sqlalchemy.exc import StatementError

    valor = "ci-secreta-5555555-5"

    def romper(*a, **k):
        raise StatementError("falló", "SELECT ci FROM persona WHERE ci = :ci", {"ci": valor}, Exception("boom"), hide_parameters=True)

    hid = _hce(client)
    monkeypatch.setattr(servicio_hce, "obtener_hce", romper)
    with caplog.at_level(logging.ERROR):
        r = client.get(f"/hce/{hid}")
    assert r.status_code == 500 and r.json()["code"] == "internal_error" and valor not in r.text
    assert "SELECT ci FROM persona" in caplog.text and valor not in caplog.text
