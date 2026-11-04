"""F2 · `GET /recordatorios`: los períodos sugeridos del Manual §4, de sólo lectura (lista fija, sin paginar).

La base de test no tiene catálogos sembrados: se cargan las 8 filas del JSON del seed.
"""
import json

import pytest

from app.models.catalogos import Recordatorio
from app.seed_catalogos import DATOS

CLAVES = {"clave", "texto", "periodo", "activo"}


@pytest.fixture
def recordatorios(db_api):
    filas = json.loads(DATOS.read_text(encoding="utf-8"))["recordatorio"]
    for fila in filas:
        db_api.add(Recordatorio(**fila))
    db_api.commit()
    return filas


def test_devuelve_las_8_filas_en_orden_y_solo_esas_claves(client, recordatorios):
    r = client.get("/recordatorios")
    assert r.status_code == 200
    filas = r.json()
    assert len(filas) == 8 == len(recordatorios)
    assert [f["clave"] for f in filas] == [f["clave"] for f in sorted(recordatorios, key=lambda f: f["orden"])]
    assert filas[0]["clave"] == "lb"
    assert all(set(f) == CLAVES for f in filas)
    assert "x-total-count" not in {k.lower() for k in r.headers}, "lista fija: sin X-Total-Count"


def test_sin_token_es_401(client, recordatorios):
    assert client.get("/recordatorios").status_code == 200  # con el token del cliente
    r = client.get("/recordatorios", headers={"Authorization": ""})
    assert r.status_code == 401 and r.json()["code"]


def test_tecnico_y_admin_ven_lo_mismo(client, recordatorios, crear_profesional, hash_test, token_de):
    tecnico = crear_profesional(nombre="Téc Recordatorios", rol="tecnico", hashed_password=hash_test)
    como_admin = client.get("/recordatorios")
    como_tecnico = client.get("/recordatorios", headers=token_de(tecnico))
    assert como_admin.status_code == como_tecnico.status_code == 200
    assert como_admin.json() == como_tecnico.json()


def test_un_recordatorio_inactivo_vuelve_con_activo_false(client, recordatorios, db_api):
    fila = db_api.query(Recordatorio).filter_by(clave="ayex").one()
    fila.activo = False
    db_api.commit()
    por_clave = {f["clave"]: f["activo"] for f in client.get("/recordatorios").json()}
    assert por_clave["ayex"] is False and por_clave["lb"] is True
    assert len(por_clave) == 8, "los inactivos también vuelven: filtrar es presentación"


@pytest.mark.parametrize("metodo", ["post", "put", "patch", "delete"])
def test_es_de_solo_lectura_405(client, recordatorios, metodo):
    r = getattr(client, metodo)("/recordatorios")
    assert r.status_code == 405
