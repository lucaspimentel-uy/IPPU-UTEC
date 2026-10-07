"""M11.3-a2 · listas de referencia de sólo lectura: `GET /grupos` y `GET /profesionales`.

Todo rechazo va con su par que pasa. Las fábricas son las de `conftest.py` (la base de
test no tiene catálogos).
"""
from app.services.fechas import anio_actual


def test_grupos_devuelve_solo_los_del_anio_pedido_ordenados_por_nombre(client, crear_grupo):
    hoy = anio_actual()
    crear_grupo(nombre="Preadolescentes", anio=hoy)
    crear_grupo(nombre="Escolares", anio=hoy)
    crear_grupo(nombre="Escolares", anio=hoy - 1)
    r = client.get("/grupos", params={"anio": hoy})
    assert r.status_code == 200
    assert [(g["nombre"], g["anio"]) for g in r.json()] == [("Escolares", hoy), ("Preadolescentes", hoy)]
    assert set(r.json()[0]) == {"id", "nombre", "anio"}
    assert [(g["nombre"], g["anio"]) for g in client.get("/grupos", params={"anio": hoy - 1}).json()] == [
        ("Escolares", hoy - 1)
    ]


def test_grupos_por_omision_es_el_anio_en_curso(client, crear_grupo):
    hoy = anio_actual()
    crear_grupo(nombre="Inicial", anio=hoy)
    crear_grupo(nombre="Adolescentes", anio=hoy + 1)
    r = client.get("/grupos")
    assert r.status_code == 200 and [g["nombre"] for g in r.json()] == ["Inicial"]
    assert [g["nombre"] for g in client.get("/grupos", params={"anio": hoy + 1}).json()] == ["Adolescentes"]


def test_grupos_sin_filas_es_lista_vacia_y_un_anio_invalido_es_422(client, crear_grupo):
    assert client.get("/grupos").json() == []
    assert client.get("/grupos", params={"anio": 2026}).status_code == 200
    r = client.get("/grupos", params={"anio": 0})
    assert r.status_code == 422 and r.json()["code"] == "validation_error"
    assert client.get("/grupos", params={"anio": "dos mil"}).status_code == 422


def _sin_login(filas: list[dict], admin) -> list[dict]:
    """Las filas sin el `admin` con el que entra `client` (M11.3-d1): es del login, no del test."""
    return [f for f in filas if f["id"] != admin.id]


def test_profesionales_ordenados_por_nombre_con_los_campos_minimos(client, admin, crear_profesional):
    crear_profesional(nombre="Zulema Gil", especialidad="Psicología", rol="admin")
    crear_profesional(nombre="Ana Paz", especialidad=None)
    r = client.get("/profesionales")
    assert r.status_code == 200
    filas = _sin_login(r.json(), admin)
    assert [p["nombre"] for p in filas] == ["Ana Paz", "Zulema Gil"]
    assert set(filas[0]) == {"id", "nombre", "especialidad", "rol", "activo"}, "ni email ni hash"
    assert (filas[1]["especialidad"], filas[1]["rol"]) == ("Psicología", "admin")
    assert filas[0]["especialidad"] is None


def test_profesionales_filtra_por_activo(client, admin, crear_profesional):
    crear_profesional(nombre="Activa Uno")
    crear_profesional(nombre="Inactivo Dos", activo=False)
    nombres = lambda **q: [p["nombre"] for p in _sin_login(client.get("/profesionales", params=q).json(), admin)]  # noqa: E731
    assert nombres(activo="true") == ["Activa Uno"]
    assert nombres(activo="false") == ["Inactivo Dos"]
    assert nombres() == ["Activa Uno", "Inactivo Dos"]
    assert client.get("/profesionales", params={"activo": "quizás"}).status_code == 422


def test_profesionales_sin_inactivos_por_la_api_es_lista_vacia(client, admin):
    """Por la API la tabla nunca está vacía (hay que estar logueado: el `admin` del login es una
    fila, activa). Lo que se puede probar acá es un filtro sin coincidencias → `[]`, no un error."""
    r = client.get("/profesionales", params={"activo": "false"})
    assert r.status_code == 200 and r.json() == []


def test_listar_profesionales_con_la_tabla_vacia_es_lista_vacia(db):
    """El caso «sin profesionales», en el servicio: la fixture `db` no crea al `admin` del login."""
    from app.services.referencias import listar_profesionales

    assert listar_profesionales(db) == [] and listar_profesionales(db, True) == []


def test_solo_lectura_y_documentado_en_swagger(client):
    spec = client.get("/openapi.json").json()
    assert set(spec["paths"]["/grupos"]) == {"get"}
    assert set(spec["paths"]["/profesionales"]) == {"get"}
    assert client.post("/grupos", json={"nombre": "x", "anio": 2026}).status_code == 405
    assert client.delete("/profesionales").status_code == 405
