"""M11.3-a · rebanada persona + expediente (HCE-00), por la API.

Convención: **todo rechazo va emparejado con el caso que pasa** (409 ↔ 201,
422 ↔ 201, vacío ↔ con contenido), para que un test en verde no pueda deberse a
que el endpoint rechaza todo.

Los datos los crean las fábricas de `conftest.py` (la base de test no tiene
catálogos) y la verificación lee la base con consultas de columna sobre `db_api`.
"""
import itertools

import pytest
from sqlalchemy import func, select

from app.models.identidad import HceDiurna, Persona
from app.models.transversales import Auditoria
from app.services import hce as servicio_hce
from app.services.errores import ConflictError

_cis = itertools.count(1_000_000)


def _persona(**sobre) -> dict:
    base = {
        "nombre": "Martín", "apellido": "Rodríguez", "ci": f"{next(_cis)}-1",
        "fecha_nac": "2016-04-12",
    }
    return {**base, **sobre}


def _alta(client, persona: dict | None = None, **hce):
    return client.post("/hce", json={"persona": persona or _persona(), **hce})


def _id(r) -> int:
    assert r.status_code == 201, r.text
    return r.json()["data"]["id"]


def _filas(db_api, hce_id: int) -> list[Auditoria]:
    db_api.expire_all()
    return list(db_api.scalars(select(Auditoria).where(Auditoria.hce_id == hce_id).order_by(Auditoria.id)))


def _columna(db_api, columna, hce_id: int):
    """Valor actual de una columna de `hce_diurna`, leído sin pasar por el mapa de identidad."""
    return db_api.scalar(select(columna).where(HceDiurna.id == hce_id))


# ── Alta ─────────────────────────────────────────────────────────────────────
def test_el_alta_crea_persona_y_expediente_y_responde_con_el_sobre(client, db_api):
    r = _alta(client, diagnostico="TEA", cie11="6A02")
    assert r.status_code == 201
    cuerpo = r.json()
    assert set(cuerpo) == {"data", "warnings"}
    assert cuerpo["warnings"] == []
    data = cuerpo["data"]
    assert data["persona"]["nombre"] == "Martín" and data["activo"] is True
    assert data["diagnostico"] == "TEA" and data["grupo"] is None
    assert db_api.scalar(select(func.count()).select_from(Persona)) == 1
    assert db_api.scalar(select(func.count()).select_from(HceDiurna)) == 1


def test_una_ci_repetida_es_409_y_una_distinta_es_201(client):
    ci = "5.789.123-4"
    assert _alta(client, _persona(ci=ci)).status_code == 201
    repetida = _alta(client, _persona(ci=ci))
    assert repetida.status_code == 409
    assert repetida.json()["code"] == "conflict"
    assert repetida.json()["detail"][0]["campo"] == "persona.ci"
    assert _alta(client, _persona(ci="5.789.124-4")).status_code == 201


@pytest.mark.parametrize("otra_forma", ["57891234", " 5789 1234 ", "5-789-123.4"])
def test_la_ci_se_compara_sin_puntos_guiones_ni_espacios(client, otra_forma):
    assert _alta(client, _persona(ci="5.789.123-4")).status_code == 201
    assert _alta(client, _persona(ci=otra_forma)).status_code == 409


def test_la_ci_se_guarda_como_se_escribio(client, db_api):
    hid = _id(_alta(client, _persona(ci="5.789.123-4")))
    assert db_api.scalar(select(Persona.ci).join(HceDiurna).where(HceDiurna.id == hid)) == "5.789.123-4"


def test_un_409_no_envenena_el_siguiente_request_del_mismo_test(client):
    primero = _id(_alta(client, _persona(ci="111")))
    assert _alta(client, _persona(ci="111")).status_code == 409
    # La sesión del request rechazado se descartó: lo siguiente anda y lo anterior sigue ahí.
    segundo = _id(_alta(client, _persona(ci="222")))
    assert client.get(f"/hce/{primero}").status_code == 200
    assert client.get(f"/hce/{segundo}").status_code == 200


def test_la_carrera_por_la_ci_tambien_es_409_y_no_un_500(client, monkeypatch):
    """Dos altas simultáneas pasan la verificación previa y la segunda choca con el UNIQUE."""
    assert _alta(client, _persona(ci="999")).status_code == 201
    monkeypatch.setattr(servicio_hce, "_persona_con_ci", lambda *a, **k: None)  # la verificación «no ve» al otro
    r = _alta(client, _persona(ci="999"))
    assert r.status_code == 409
    assert r.json()["detail"][0]["campo"] == "persona.ci"
    monkeypatch.undo()
    assert _alta(client, _persona(ci="1000")).status_code == 201  # y la conexión sigue sana


def test_un_grupo_inexistente_es_422_y_uno_existente_es_201(client, db_api, crear_grupo):
    grupo = crear_grupo(nombre="Escolares", anio=2026)
    malo = _alta(client, grupo_id=grupo.id + 999)
    assert malo.status_code == 422
    assert malo.json()["code"] == "validation_error"
    assert malo.json()["detail"][0]["campo"] == "grupo_id"
    assert db_api.scalar(select(func.count()).select_from(Persona)) == 0, "un alta rechazada no deja nada"
    bueno = _alta(client, grupo_id=grupo.id)
    assert bueno.status_code == 201
    assert bueno.json()["data"]["grupo"] == {"id": grupo.id, "nombre": "Escolares", "anio": 2026}


@pytest.mark.parametrize("campo", ["nombre", "apellido", "ci"])
def test_un_obligatorio_en_blanco_es_422_y_con_contenido_es_201(client, campo):
    en_blanco = _alta(client, _persona(**{campo: "   "}))
    assert en_blanco.status_code == 422
    assert en_blanco.json()["detail"][0]["campo"] == f"persona.{campo}"
    assert _alta(client, _persona(**{campo: "Ana-1"})).status_code == 201


def test_varios_problemas_vuelven_juntos_en_la_lista(client):
    r = _alta(client, _persona(nombre="", apellido=" "), grupo_id=987654)
    assert r.status_code == 422
    assert {d["campo"] for d in r.json()["detail"]} == {"persona.nombre", "persona.apellido", "grupo_id"}


def test_la_validacion_de_entrada_usa_el_mismo_cuerpo_de_error(client):
    faltante = client.post("/hce", json={"persona": {"nombre": "Ana"}})
    assert faltante.status_code == 422
    assert faltante.json()["code"] == "validation_error"
    assert {"persona.apellido", "persona.ci", "persona.fecha_nac"} <= {d["campo"] for d in faltante.json()["detail"]}
    largo = _alta(client, _persona(nombre="x" * 81))
    assert largo.status_code == 422 and largo.json()["detail"][0]["campo"] == "persona.nombre"
    assert _alta(client, _persona(nombre="x" * 80)).status_code == 201


def test_el_vacio_se_guarda_como_null_y_el_texto_tal_cual(client, db_api):
    hid = _id(_alta(
        client,
        _persona(localidad="", telefono="   ", referente="Marta R."),
        diagnostico="", cie11=" \t", alerta="   ", derivacion="Pediatría", medicacion=" dos veces por día ",
    ))
    fila = db_api.execute(
        select(Persona.localidad, Persona.telefono, Persona.referente, HceDiurna.diagnostico,
               HceDiurna.cie11, HceDiurna.alerta, HceDiurna.derivacion, HceDiurna.medicacion)
        .join(HceDiurna).where(HceDiurna.id == hid)
    ).one()
    assert fila == (None, None, "Marta R.", None, None, None, "Pediatría", " dos veces por día ")


def test_hc_historico_se_acepta_como_dato_opcional(client):
    con = _alta(client, hc_historico="1001")
    assert con.status_code == 201 and con.json()["data"]["hc_historico"] == "1001"
    sin = _alta(client, hc_historico="  ")
    assert sin.status_code == 201 and sin.json()["data"]["hc_historico"] is None


# ── Lectura ──────────────────────────────────────────────────────────────────
def test_leer_un_expediente_devuelve_el_recurso_sin_sobre(client):
    hid = _id(_alta(client, anamnesis={"gestacion": "a término"}))
    r = client.get(f"/hce/{hid}")
    assert r.status_code == 200
    assert "data" not in r.json() and "warnings" not in r.json()
    assert r.json()["id"] == hid
    assert r.json()["persona"]["ci"] and r.json()["anamnesis"] == {"gestacion": "a término"}


def test_un_expediente_inexistente_es_404_y_uno_existente_es_200(client):
    hid = _id(_alta(client))
    assert client.get(f"/hce/{hid}").status_code == 200
    r = client.get(f"/hce/{hid + 999}")
    assert r.status_code == 404
    assert r.json()["code"] == "not_found" and isinstance(r.json()["detail"], list)


# ── Edición de HCE-00 ────────────────────────────────────────────────────────
def test_editar_dos_campos_deja_exactamente_dos_filas_de_auditoria(client, db_api):
    hid = _id(_alta(client, diagnostico="TEA", alerta="alergia"))
    r = client.patch(f"/hce/{hid}", json={"diagnostico": "TEA nivel 2", "alerta": "sin alergias"})
    assert r.status_code == 200
    assert r.json()["warnings"] == []
    assert r.json()["data"]["diagnostico"] == "TEA nivel 2"
    filas = _filas(db_api, hid)
    assert len(filas) == 2
    cambios = {f.campo: (f.valor_ant, f.valor_nuevo) for f in filas}
    assert cambios == {"diagnostico": ("TEA", "TEA nivel 2"), "alerta": ("alergia", "sin alergias")}
    assert all(f.modulo == "HCE-00" and f.tipo == "edicion" and f.usuario_id is None for f in filas)


def test_editar_con_valores_identicos_no_escribe_auditoria(client, db_api):
    hid = _id(_alta(client, diagnostico="TEA"))
    r = client.patch(f"/hce/{hid}", json={"diagnostico": "TEA", "persona": {"nombre": "Martín"}})
    assert r.status_code == 200 and r.json()["warnings"] == []
    assert _filas(db_api, hid) == []
    # …y el mismo endpoint con un valor distinto sí escribe: el cero de arriba no es un endpoint mudo.
    client.patch(f"/hce/{hid}", json={"diagnostico": "otro"})
    assert len(_filas(db_api, hid)) == 1


def test_editar_la_persona_tambien_se_audita_y_toca_el_expediente(client, db_api):
    hid = _id(_alta(client, _persona(telefono="099 111 111")))
    antes = _columna(db_api, HceDiurna.actualizado_en, hid)
    r = client.patch(f"/hce/{hid}", json={"persona": {"telefono": "098 222 222", "localidad": "Canelones"}})
    assert r.status_code == 200
    assert r.json()["data"]["persona"]["telefono"] == "098 222 222"
    assert {(f.campo, f.valor_ant, f.valor_nuevo) for f in _filas(db_api, hid)} == {
        ("telefono", "099 111 111", "098 222 222"), ("localidad", None, "Canelones"),
    }
    db_api.expire_all()
    assert _columna(db_api, HceDiurna.actualizado_en, hid) >= antes


def test_borrar_un_opcional_con_vacio_o_null_lo_deja_en_null_y_se_audita(client, db_api):
    hid = _id(_alta(client, diagnostico="TEA", alerta="alergia"))
    r = client.patch(f"/hce/{hid}", json={"diagnostico": "", "alerta": None})
    assert r.status_code == 200
    assert r.json()["data"]["diagnostico"] is None and r.json()["data"]["alerta"] is None
    assert {(f.campo, f.valor_ant, f.valor_nuevo) for f in _filas(db_api, hid)} == {
        ("diagnostico", "TEA", None), ("alerta", "alergia", None),
    }


def test_lo_que_no_viene_en_el_cuerpo_no_se_toca(client, db_api):
    hid = _id(_alta(client, diagnostico="TEA", alerta="alergia"))
    client.patch(f"/hce/{hid}", json={"diagnostico": "TEA 2"})
    db_api.expire_all()
    assert _columna(db_api, HceDiurna.alerta, hid) == "alergia"


def test_un_obligatorio_de_la_persona_no_se_puede_borrar(client, db_api):
    hid = _id(_alta(client, _persona(nombre="Martín")))
    for vacio in (None, "", "  "):
        r = client.patch(f"/hce/{hid}", json={"persona": {"nombre": vacio}})
        assert r.status_code == 422 and r.json()["detail"][0]["campo"] == "persona.nombre"
    assert client.patch(f"/hce/{hid}", json={"persona": {"nombre": "Martina"}}).status_code == 200
    assert [f.campo for f in _filas(db_api, hid)] == ["nombre"]


def test_cambiar_la_ci_a_una_ajena_es_409_y_a_una_libre_es_200(client, db_api):
    a = _id(_alta(client, _persona(ci="111")))
    b = _id(_alta(client, _persona(ci="222")))
    assert client.patch(f"/hce/{b}", json={"persona": {"ci": "1.11"}}).status_code == 409
    assert client.patch(f"/hce/{b}", json={"persona": {"ci": "333"}}).status_code == 200
    assert client.patch(f"/hce/{a}", json={"persona": {"ci": "1.1.1"}}).status_code == 200, "la propia CI no es duplicada"
    assert [(f.valor_ant, f.valor_nuevo) for f in _filas(db_api, b)] == [("222", "333")]


def test_cambiar_el_grupo_valida_que_exista_y_se_audita(client, db_api, crear_grupo):
    g1, g2 = crear_grupo(nombre="Inicial"), crear_grupo(nombre="Escolares")
    hid = _id(_alta(client, grupo_id=g1.id))
    assert client.patch(f"/hce/{hid}", json={"grupo_id": g2.id + 999}).status_code == 422
    r = client.patch(f"/hce/{hid}", json={"grupo_id": g2.id})
    assert r.status_code == 200 and r.json()["data"]["grupo"]["nombre"] == "Escolares"
    assert [(f.campo, f.valor_ant, f.valor_nuevo) for f in _filas(db_api, hid)] == [
        ("grupo_id", str(g1.id), str(g2.id))
    ]


def test_la_anamnesis_se_reemplaza_completa_y_se_audita_como_un_campo(client, db_api):
    hid = _id(_alta(client, anamnesis={"a": 1}))
    client.patch(f"/hce/{hid}", json={"anamnesis": {"a": 1}})  # igual → nada
    assert _filas(db_api, hid) == []
    client.patch(f"/hce/{hid}", json={"anamnesis": {"a": 2}})
    assert [(f.campo, f.valor_ant, f.valor_nuevo) for f in _filas(db_api, hid)] == [
        ("anamnesis", '{"a": 1}', '{"a": 2}')
    ]


def test_editar_un_expediente_inexistente_es_404_y_uno_existente_es_200(client):
    hid = _id(_alta(client))
    assert client.patch(f"/hce/{hid}", json={"diagnostico": "x"}).status_code == 200
    assert client.patch(f"/hce/{hid + 999}", json={"diagnostico": "x"}).status_code == 404


def test_los_campos_que_hce_00_no_edita_se_ignoran(client, db_api):
    hid = _id(_alta(client))
    r = client.patch(f"/hce/{hid}", json={"activo": False, "fecha_baja": "2026-01-01", "sistema_origen": "heroku"})
    assert r.status_code == 200
    assert r.json()["data"]["activo"] is True and r.json()["data"]["fecha_baja"] is None
    assert _filas(db_api, hid) == []


def test_un_error_de_dominio_deshace_todo_lo_que_escribio_el_request(client, db_api, monkeypatch):
    """Una excepción **después** de escribir el cambio: no queda ni el cambio ni su rastro."""
    hid = _id(_alta(client, diagnostico="TEA"))
    real = servicio_hce.registrar_cambios

    def _falla_tras_escribir(db, **kw):
        real(db, **kw)  # la auditoría ya se escribió (flush)…
        raise ConflictError("falla tardía")  # …y recién ahora falla

    monkeypatch.setattr(servicio_hce, "registrar_cambios", _falla_tras_escribir)
    r = client.patch(f"/hce/{hid}", json={"diagnostico": "cambiado"})
    assert r.status_code == 409
    monkeypatch.undo()
    db_api.expire_all()
    assert _columna(db_api, HceDiurna.diagnostico, hid) == "TEA"
    assert _filas(db_api, hid) == []
    # y la misma edición, sin la falla, queda guardada (el commit del éxito sí ocurre)
    assert client.patch(f"/hce/{hid}", json={"diagnostico": "cambiado"}).status_code == 200
    db_api.expire_all()
    assert _columna(db_api, HceDiurna.diagnostico, hid) == "cambiado"
    assert len(_filas(db_api, hid)) == 1


# ── Búsqueda: las tres vías + nombre ─────────────────────────────────────────
@pytest.fixture
def legajos(client, crear_grupo):
    """Tres expedientes: dos en «Escolares», uno sin grupo."""
    escolares, inicial = crear_grupo(nombre="Escolares"), crear_grupo(nombre="Inicial")
    ids = {
        "martin": _id(_alta(client, _persona(nombre="Martín", apellido="Núñez", ci="5.789.123-4"),
                            grupo_id=escolares.id, hc_historico="1001")),
        "sofia": _id(_alta(client, _persona(nombre="Sofía", apellido="Pérez", ci="6.012.345-1"),
                           grupo_id=escolares.id, hc_historico="1002")),
        "tomas": _id(_alta(client, _persona(nombre="Tomás", apellido="Gil", ci="7.000.111-2"))),
    }
    ids["inicial_id"] = inicial.id
    return ids


def _buscar(client, **filtros) -> list[int]:
    r = client.get("/hce", params=filtros)
    assert r.status_code == 200, r.text
    return [h["id"] for h in r.json()]


def test_buscar_por_ci_ignora_puntos_y_guiones_y_no_inventa_resultados(client, legajos):
    assert _buscar(client, ci="5.789.123-4") == [legajos["martin"]]
    assert _buscar(client, ci="5789") == [legajos["martin"]]
    assert _buscar(client, ci="6-012") == [legajos["sofia"]]
    assert _buscar(client, ci="999") == []


def test_buscar_por_numero_encuentra_el_expediente_o_la_historia_anterior(client, legajos):
    assert _buscar(client, numero=str(legajos["tomas"])) == [legajos["tomas"]]
    assert _buscar(client, numero="1002") == [legajos["sofia"]]
    assert _buscar(client, numero="424242") == []
    assert _buscar(client, numero="12345678901234567890") == []  # no cabe en un int: no debe explotar


def test_buscar_por_grupo_ignora_mayusculas_y_no_encuentra_otro_grupo(client, legajos):
    assert _buscar(client, grupo="Escolares") == [legajos["martin"], legajos["sofia"]]
    assert _buscar(client, grupo="  escolares ") == [legajos["martin"], legajos["sofia"]]
    assert _buscar(client, grupo="Inicial") == []  # el grupo existe pero no tiene integrantes
    assert _buscar(client, grupo="Adolescentes") == []


def test_buscar_por_nombre_ignora_acentos_y_vale_en_cualquier_orden(client, legajos):
    assert _buscar(client, nombre="sofia") == [legajos["sofia"]]
    assert _buscar(client, nombre="PÉREZ sofía") == [legajos["sofia"]]
    assert _buscar(client, nombre="nunez") == [legajos["martin"]]
    assert _buscar(client, nombre="martin n") == [legajos["martin"]]
    assert _buscar(client, nombre="zzz") == []


def test_los_caracteres_comodin_se_buscan_literalmente(client, legajos):
    assert _buscar(client, nombre="%") == []
    assert _buscar(client, nombre="_") == []


def test_una_ci_sin_digitos_ni_letras_es_422_y_con_digitos_es_200(client, legajos):
    r = client.get("/hce", params={"ci": ".-."})
    assert r.status_code == 422 and r.json()["detail"][0]["campo"] == "ci"
    assert client.get("/hce", params={"ci": "5.7"}).status_code == 200


def test_los_filtros_se_combinan_con_y(client, legajos):
    assert _buscar(client, grupo="Escolares", nombre="sofia") == [legajos["sofia"]]
    assert _buscar(client, grupo="Escolares", nombre="tomas") == []
    assert _buscar(client, grupo="Escolares", ci="5789") == [legajos["martin"]]


def test_un_filtro_vacio_se_ignora_y_sin_filtros_devuelve_todos_ordenados(client, legajos):
    todos = _buscar(client)
    assert sorted(todos) == sorted([legajos["martin"], legajos["sofia"], legajos["tomas"]])
    assert _buscar(client, ci="", nombre="  ") == todos
    # orden por apellido: Gil, Núñez, Pérez
    assert todos == [legajos["tomas"], legajos["martin"], legajos["sofia"]]


def test_la_lista_trae_el_resumen_sin_sobre(client, legajos):
    fila = client.get("/hce", params={"ci": "5789"}).json()[0]
    assert set(fila) == {"id", "hc_historico", "activo", "grupo", "persona"}
    assert fila["persona"] == {
        "id": fila["persona"]["id"], "nombre": "Martín", "apellido": "Núñez", "ci": "5.789.123-4",
    }
    assert fila["grupo"]["nombre"] == "Escolares"


# ── Contrato en Swagger e infraestructura ────────────────────────────────────
def test_swagger_documenta_los_endpoints_con_el_sobre_de_ejemplo(client):
    spec = client.get("/openapi.json").json()
    assert set(spec["paths"]["/hce"]) == {"post", "get"}
    assert set(spec["paths"]["/hce/{hce_id}"]) == {"get", "patch"}
    for metodo, ruta, status in (("post", "/hce", "201"), ("patch", "/hce/{hce_id}", "200")):
        ejemplo = spec["paths"][ruta][metodo]["responses"][status]["content"]["application/json"]["example"]
        assert ejemplo["warnings"] == [] and "data" in ejemplo, f"{metodo} {ruta}"
    esquema = spec["components"]["schemas"]
    assert "examples" in esquema["HceCrear"] and "examples" in esquema["HceActualizar"]
    assert "RespuestaError" in esquema


def test_health_no_cambia(client):
    r = client.get("/health")
    assert r.status_code == 200 and r.json()["status"] == "ok"
