"""M11.3-a3 · convenciones transversales de la capa de servicios (§5.115).

Cada test fija una convención que **heredan las rebanadas siguientes** (M11.3-b
escribe JSONB `firmas`/`addendas`/`dim` y recibe fechas vacías de los formularios).
Como en el resto de la suite, cada rechazo va emparejado con el caso que pasa.
"""
import itertools

import pytest
from sqlalchemy import func, select, text

from app.models.identidad import HceDiurna, Persona
from app.models.transversales import Auditoria

_cis = itertools.count(7_000_000)
_SECRETO = "secreto-que-no-debe-salir-9f3a"
_SOBRE_500 = {"code": "internal_error", "detail": [{"campo": None, "mensaje": "Error interno"}]}


def _persona(**sobre) -> dict:
    return {
        "nombre": "Ana", "apellido": "Pérez", "ci": f"{next(_cis)}-1",
        "fecha_nac": "2016-04-12", **sobre,
    }


def _alta(client, **hce):
    r = client.post("/hce", json={"persona": _persona(), **hce})
    assert r.status_code == 201, r.text
    return r.json()["data"]["id"]


def _col(db_api, columna, hce_id: int):
    """Valor actual de una columna de `hce_diurna`, sin pasar por el mapa de identidad."""
    db_api.expire_all()
    return db_api.scalar(select(columna).where(HceDiurna.id == hce_id))


def _anamnesis_es_sql_null(db_api, hce_id: int) -> bool | None:
    """`anamnesis IS NULL` evaluado **por Postgres**: distingue SQL NULL de JSON `null`."""
    db_api.expire_all()
    return db_api.scalar(text("SELECT anamnesis IS NULL FROM hce_diurna WHERE id = :i"), {"i": hce_id})


# ── (a) JSONB ausente = SQL NULL ─────────────────────────────────────────────
def test_anamnesis_ausente_o_null_es_sql_null_y_con_contenido_es_json(client, db_api):
    sin = _alta(client)  # el schema serializa `anamnesis: None`
    assert _anamnesis_es_sql_null(db_api, sin) is True

    con = _alta(client, anamnesis={"motivo": "consulta"})
    assert _anamnesis_es_sql_null(db_api, con) is False
    assert db_api.scalar(text("SELECT anamnesis->>'motivo' FROM hce_diurna WHERE id = :i"), {"i": con}) == "consulta"

    # PATCH null sobre un valor con contenido → SQL NULL; y de vuelta a un objeto → JSON.
    assert client.patch(f"/hce/{con}", json={"anamnesis": None}).status_code == 200
    assert _anamnesis_es_sql_null(db_api, con) is True
    assert client.patch(f"/hce/{con}", json={"anamnesis": {"a": 1}}).status_code == 200
    assert _anamnesis_es_sql_null(db_api, con) is False


def test_patch_null_sobre_una_anamnesis_que_ya_era_null_sigue_siendo_sql_null(client, db_api):
    hid = _alta(client)
    assert client.patch(f"/hce/{hid}", json={"anamnesis": None}).status_code == 200
    assert _anamnesis_es_sql_null(db_api, hid) is True


def test_toda_columna_jsonb_nullable_de_los_modelos_guarda_none_como_sql_null():
    """La convención vale para **todas**, no sólo `anamnesis`: las de M11.3-b en adelante entran acá."""
    from sqlalchemy.dialects.postgresql import JSONB

    from app.core.database import Base

    for tabla in Base.metadata.tables.values():
        for col in tabla.columns:
            if isinstance(col.type, JSONB) and col.nullable:
                assert col.type.none_as_null is True, f"{tabla.name}.{col.name}"


# ── (b) vacío en opcionales que no son texto = NULL ──────────────────────────
@pytest.mark.parametrize("vacio", ["", "   "])
def test_alta_con_fecha_fk_y_numero_vacios_es_201_con_null(client, db_api, vacio):
    hid = _alta(client, dx_fecha=vacio, grupo_id=vacio, hc_historico=vacio)
    assert _col(db_api, HceDiurna.dx_fecha, hid) is None
    assert _col(db_api, HceDiurna.grupo_id, hid) is None
    assert _col(db_api, HceDiurna.hc_historico, hid) == 1001  # «vacío» = «asignale uno»


def test_alta_con_fecha_fk_y_numero_validos_es_201_y_se_guardan(client, db_api, crear_grupo):
    g = crear_grupo()
    hid = _alta(client, dx_fecha="2020-03-01", grupo_id=g.id, hc_historico=1500)
    assert str(_col(db_api, HceDiurna.dx_fecha, hid)) == "2020-03-01"
    assert _col(db_api, HceDiurna.grupo_id, hid) == g.id
    assert _col(db_api, HceDiurna.hc_historico, hid) == 1500


def test_el_vacio_no_tapa_un_valor_basura_que_sigue_siendo_422(client):
    r = client.post("/hce", json={"persona": _persona(), "dx_fecha": "no-es-una-fecha"})
    assert r.status_code == 422 and r.json()["detail"][0]["campo"] == "dx_fecha"
    r = client.post("/hce", json={"persona": _persona(), "grupo_id": "abc"})
    assert r.status_code == 422 and r.json()["detail"][0]["campo"] == "grupo_id"


def test_patch_con_fecha_y_fk_vacias_las_deja_en_null_y_con_valor_las_guarda(client, db_api, crear_grupo):
    g = crear_grupo()
    hid = _alta(client, dx_fecha="2020-03-01", grupo_id=g.id)
    assert client.patch(f"/hce/{hid}", json={"dx_fecha": "", "grupo_id": ""}).status_code == 200
    assert _col(db_api, HceDiurna.dx_fecha, hid) is None
    assert _col(db_api, HceDiurna.grupo_id, hid) is None
    assert client.patch(f"/hce/{hid}", json={"dx_fecha": "2021-05-06", "grupo_id": g.id}).status_code == 200
    assert str(_col(db_api, HceDiurna.dx_fecha, hid)) == "2021-05-06"
    assert _col(db_api, HceDiurna.grupo_id, hid) == g.id


def test_patch_del_numero_de_hc_vacio_sigue_siendo_422_y_con_valor_es_200(client, db_api):
    hid = _alta(client)
    r = client.patch(f"/hce/{hid}", json={"hc_historico": ""})
    assert r.status_code == 422 and r.json()["detail"][0]["campo"] == "hc_historico"
    assert client.patch(f"/hce/{hid}", json={"hc_historico": 2000}).status_code == 200
    assert _col(db_api, HceDiurna.hc_historico, hid) == 2000


def test_patch_de_fecha_nac_vacia_es_422_del_servicio_y_con_fecha_es_200(client):
    hid = _alta(client)
    r = client.patch(f"/hce/{hid}", json={"persona": {"fecha_nac": ""}})
    assert r.status_code == 422
    assert r.json()["detail"] == [{"campo": "persona.fecha_nac", "mensaje": "No puede estar vacío"}]
    assert client.patch(f"/hce/{hid}", json={"persona": {"fecha_nac": "2015-01-02"}}).status_code == 200


# ── (c) un error no previsto conserva el sobre ───────────────────────────────
def test_un_error_no_previsto_es_500_con_el_sobre_sin_el_texto_y_con_traceback_en_el_log(
    client, monkeypatch, caplog,
):
    from app.services import hce as servicio_hce

    def _explota(*a, **k):
        raise RuntimeError(_SECRETO)

    monkeypatch.setattr(servicio_hce, "obtener_hce", _explota)
    with caplog.at_level("ERROR"):
        r = client.get("/hce/1")
    assert r.status_code == 500
    assert r.json() == _SOBRE_500
    assert _SECRETO not in r.text
    registro = next(x for x in caplog.records if x.exc_info)
    assert registro.exc_info[0] is RuntimeError and _SECRETO in str(registro.exc_info[1])  # el log sí lo tiene
    monkeypatch.undo()
    assert client.get("/hce/999999").status_code == 404  # sin la falla, el mismo camino responde normal


def test_el_500_lleva_las_cabeceras_cors(client, monkeypatch):
    """Por eso es un middleware y no `exception_handler(Exception)`: éste quedaría fuera de CORS."""
    from app.core.config import settings
    from app.services import hce as servicio_hce

    monkeypatch.setattr(servicio_hce, "obtener_hce", lambda *a, **k: 1 / 0)
    origen = settings.cors_origins[0]
    r = client.get("/hce/1", headers={"Origin": origen})
    assert r.status_code == 500
    assert r.headers["access-control-allow-origin"] == origen


def test_swagger_documenta_el_500_en_todas_las_rutas_y_el_codigo_nuevo(client):
    esquema = client.get("/openapi.json").json()
    for ruta, operaciones in esquema["paths"].items():
        for metodo, op in operaciones.items():
            assert "500" in op["responses"], f"{metodo.upper()} {ruta}"
    assert "internal_error" in esquema["components"]["schemas"]["RespuestaError"]["properties"]["code"]["description"]
    assert esquema["paths"]["/hce"]["post"]["responses"]["500"]["content"]["application/json"]["schema"] == {
        "$ref": "#/components/schemas/RespuestaError"
    }


# ── (d) los GET no commitean; un commit fallido no es un 2xx ─────────────────
@pytest.fixture
def commits(monkeypatch):
    """Cuenta los `Session.commit()` que ocurren **durante** el test (después de armar las fixtures)."""
    from sqlalchemy.orm import Session

    real = Session.commit
    llamadas = []

    def _contado(self):
        llamadas.append(1)
        return real(self)

    monkeypatch.setattr(Session, "commit", _contado)
    return llamadas


def test_los_get_no_commitean_y_el_post_si(client, commits):
    hid = _alta(client)
    assert len(commits) == 1  # la mutación commitea una vez

    commits.clear()
    for ruta in (f"/hce/{hid}", "/hce", "/hce?nombre=ana", "/grupos", "/profesionales"):
        assert client.get(ruta).status_code == 200, ruta
    assert client.get("/hce/999999").status_code == 404  # un GET que falla tampoco commitea
    assert commits == []


def test_un_commit_que_falla_en_una_mutacion_no_responde_2xx_y_no_deja_nada(client, db_api, monkeypatch):
    """**Este test debe romperse si FastAPI mueve el commit después de enviar la respuesta**
    (~0.118+): ahí el cliente recibiría el 201 y el fallo quedaría sólo en el log. Ver
    `sesion_transaccional` y el comentario de `requirements.txt`."""
    from sqlalchemy.orm import Session

    def _commit_roto(self):
        raise RuntimeError(_SECRETO)

    monkeypatch.setattr(Session, "commit", _commit_roto)
    r = client.post("/hce", json={"persona": _persona()})
    monkeypatch.undo()
    assert r.status_code == 500
    assert r.json() == _SOBRE_500 and _SECRETO not in r.text
    assert db_api.scalar(select(func.count()).select_from(Persona)) == 0
    assert db_api.scalar(select(func.count()).select_from(HceDiurna)) == 0
    assert client.post("/hce", json={"persona": _persona()}).status_code == 201  # y sin la falla, queda guardado


# ── L1: una falla después de escribir deja el POST /hce entero sin efecto ────
def test_una_falla_despues_de_escribir_en_el_alta_no_deja_persona_expediente_ni_auditoria(
    client, db_api, monkeypatch,
):
    from app.services import hce as servicio_hce

    real = servicio_hce.registrar_carga

    def _falla_tras_escribir(db, **kw):
        real(db, **kw)  # la fila de auditoría ya está en la transacción…
        raise RuntimeError(_SECRETO)  # …y recién ahora falla

    monkeypatch.setattr(servicio_hce, "registrar_carga", _falla_tras_escribir)
    r = client.post("/hce", json={"persona": _persona()})
    monkeypatch.undo()
    assert r.status_code == 500 and r.json() == _SOBRE_500

    for modelo in (Persona, HceDiurna, Auditoria):
        assert db_api.scalar(select(func.count()).select_from(modelo)) == 0, modelo.__name__

    # emparejado: sin la falla, las tres filas quedan
    assert client.post("/hce", json={"persona": _persona()}).status_code == 201
    for modelo in (Persona, HceDiurna, Auditoria):
        assert db_api.scalar(select(func.count()).select_from(modelo)) == 1, modelo.__name__


# ── L2 · L6 ──────────────────────────────────────────────────────────────────
def test_profesionales_expone_activo_en_cada_fila(client, crear_profesional):
    crear_profesional(nombre="Ana", activo=True)
    crear_profesional(nombre="Beto", activo=False)
    filas = client.get("/profesionales").json()
    assert [(f["nombre"], f["activo"]) for f in filas] == [("Ana", True), ("Beto", False)]
    assert [f["nombre"] for f in client.get("/profesionales?activo=false").json()] == ["Beto"]


def test_anio_actual_vive_en_un_solo_lugar_y_los_dos_servicios_lo_importan_de_ahi():
    from datetime import date

    from app.services import fechas, hce, referencias

    assert fechas.anio_actual() == date.today().year
    assert hce.anio_actual is fechas.anio_actual
    assert referencias.anio_actual is fechas.anio_actual
