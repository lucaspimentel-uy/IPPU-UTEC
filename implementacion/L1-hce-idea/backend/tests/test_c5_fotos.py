"""C5 · fotos individuales (`/hce/{id}/fotos`) y grupales (`/grupos/{id}/fotos`) — §5.155 e, §5.99.

Guardar una foto **no requiere la autorización de imagen y no avisa**; sólo JPEG o PNG por el contenido; la grupal
la ven, suben y descargan sólo el admin y los técnicos de ese grupo (404 para cualquier otro); sin DELETE (405).
"""
import re
from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select

from app.core import config
from app.core.constantes import ARCHIVO_TAMANO_MAXIMO
from app.main import app
from app.models.transversales import Auditoria, AutorizacionImagen, Foto
from app.services import fotos as servicio_fotos
from test_c5_documentos import HTML, JPEG, PDF, PNG, SVG, _archivos
from test_m11_3b_idea_flujo import _hce  # noqa: F401  (ayuda)

REF_GRUPO = re.compile(r"^grupo/\d+/[0-9a-f]{32}\.(jpg|png)$")


def _subir(client, ruta: str, contenido: bytes = PNG, nombre_archivo: str = "foto.png", ctype: str = "image/png", headers=None, **campos):
    return client.post(ruta, files={"archivo": (nombre_archivo, contenido, ctype)}, data={k: v for k, v in campos.items() if v is not None},
                       headers=headers)


def _foto(client, ruta: str, **kw) -> dict:
    r = _subir(client, ruta, **kw)
    assert r.status_code == 201, r.text
    return r.json()["data"]


def _campos(r) -> list[str | None]:
    return [d["campo"] for d in r.json()["detail"]]


@pytest.fixture
def escenario(client, crear_grupo, crear_profesional, hash_test, token_de):
    """Tina es técnica 1 de Escolares; Otra, técnica 2 de Inicial; Nadie no tiene grupo. Un expediente en cada grupo."""
    tina, otra = crear_profesional(nombre="Tina", hashed_password=hash_test), crear_profesional(nombre="Otra", hashed_password=hash_test)
    escolares = crear_grupo(nombre="Escolares", tecnico1_id=tina.id)
    inicial = crear_grupo(nombre="Inicial", tecnico2_id=otra.id)
    hces = {}
    for nombre, grupo, ci in (("propio", escolares, "86001-1"), ("ajeno", inicial, "86002-1")):
        r = client.post("/hce", json={"persona": {"nombre": "A", "apellido": nombre, "ci": ci, "fecha_nac": "2016-04-12"}, "grupo_id": grupo.id})
        assert r.status_code == 201, r.text
        hces[nombre] = r.json()["data"]["id"]
    return {"tina": token_de(tina), "otra": token_de(otra), "escolares": escolares, "inicial": inicial, **hces}


# ── Individuales ─────────────────────────────────────────────────────────────
def test_guardar_una_foto_sin_autorizacion_no_avisa_ni_bloquea(client, db_api):
    hid = _hce(client)
    assert client.get(f"/hce/{hid}/autorizacion-imagen").status_code == 404
    r = _subir(client, f"/hce/{hid}/fotos", descripcion="  Taller de juego  ", fecha="2026-09-10")
    assert r.status_code == 201 and r.json()["warnings"] == []
    d = r.json()["data"]
    assert (d["descripcion"], d["fecha"], d["tipo"], d["tamano_bytes"]) == ("  Taller de juego  ", "2026-09-10", "png", len(PNG))
    db_api.expire_all()
    assert db_api.get(AutorizacionImagen, hid) is None  # no se creó nada de autorización
    assert client.get(f"/hce/{hid}/fotos").json() == [d]
    assert client.get(f"/hce/{hid}/fotos/{d['id']}").json() == d


def test_con_autorizacion_no_registrada_tampoco_avisa(client):
    hid = _hce(client)
    client.post(f"/hce/{hid}/autorizacion-imagen", json={"registrada": False})
    r = _subir(client, f"/hce/{hid}/fotos", contenido=JPEG, nombre_archivo="a.jpg", ctype="image/jpeg")
    assert r.status_code == 201 and r.json()["warnings"] == [] and r.json()["data"]["tipo"] == "jpg"


def test_las_fotos_van_de_la_ultima_subida_a_la_primera_y_paginan(client):
    hid = _hce(client)
    ids = [_foto(client, f"/hce/{hid}/fotos", fecha=f)["id"] for f in ("2026-01-01", None, "2025-05-05")]
    r = client.get(f"/hce/{hid}/fotos")
    assert [f["id"] for f in r.json()] == ids[::-1] and r.headers["X-Total-Count"] == "3"
    r = client.get(f"/hce/{hid}/fotos", params={"limit": 1, "offset": 1})
    assert [f["id"] for f in r.json()] == [ids[1]] and r.headers["X-Total-Count"] == "3"


@pytest.mark.parametrize("contenido, nombre_archivo, ctype", [
    (PDF, "foto.png", "image/png"), (HTML, "foto.jpg", "image/jpeg"), (SVG, "foto.svg", "image/svg+xml"), (b"", "vacia.png", "image/png"),
])
def test_una_foto_que_no_es_jpg_ni_png_es_422_en_archivo_y_una_png_pasa(client, db_api, contenido, nombre_archivo, ctype):
    hid = _hce(client)
    r = _subir(client, f"/hce/{hid}/fotos", contenido=contenido, nombre_archivo=nombre_archivo, ctype=ctype)
    assert r.status_code == 422 and _campos(r) == ["archivo"]
    assert _archivos() == []
    db_api.expire_all()
    assert db_api.scalar(select(func.count()).select_from(Foto)) == 0
    assert _subir(client, f"/hce/{hid}/fotos").status_code == 201


def test_una_foto_de_mas_de_10_mb_es_413_y_de_10_mb_pasa(client):
    hid = _hce(client)
    justo = PNG + b"\x00" * (ARCHIVO_TAMANO_MAXIMO - len(PNG))
    r = _subir(client, f"/hce/{hid}/fotos", contenido=justo + b"\x00")
    assert r.status_code == 413 and r.json()["code"] == "too_large" and _campos(r) == ["archivo"] and _archivos() == []
    assert _foto(client, f"/hce/{hid}/fotos", contenido=justo)["tamano_bytes"] == ARCHIVO_TAMANO_MAXIMO


def test_la_descarga_de_una_foto_es_un_adjunto_con_su_tipo(client):
    hid = _hce(client)
    d = _foto(client, f"/hce/{hid}/fotos", contenido=JPEG, nombre_archivo="x.png", ctype="image/png", fecha="2026-09-10")
    r = client.get(f"/hce/{hid}/fotos/{d['id']}/archivo")
    assert r.status_code == 200 and r.content == JPEG and r.headers["content-type"] == "image/jpeg"
    assert r.headers["x-content-type-options"] == "nosniff" and r.headers["cache-control"] == "no-store"
    assert r.headers["content-disposition"].startswith("attachment;") and "foto-2026-09-10.jpg" in r.headers["content-disposition"]


@pytest.mark.parametrize("intruso", ["hce_id", "grupo_id", "archivo_ref"])
def test_un_campo_que_la_foto_no_recibe_es_422_y_sin_el_pasa(client, intruso):
    hid = _hce(client)
    r = _subir(client, f"/hce/{hid}/fotos", **{intruso: "1"})
    assert r.status_code == 422 and _campos(r) == [intruso] and _archivos() == []
    assert _subir(client, f"/hce/{hid}/fotos").status_code == 201


def test_la_carga_individual_deja_una_fila_sin_la_descripcion(client, db_api, admin):
    hid = _hce(client)
    _foto(client, f"/hce/{hid}/fotos", descripcion="Descripción-Secreta", nombre_archivo="archivo-secreto.png")
    db_api.expire_all()
    filas = list(db_api.scalars(select(Auditoria).where(Auditoria.hce_id == hid, Auditoria.modulo == "HCE-DOC")))
    assert [(f.tipo, f.detalle, f.usuario_id) for f in filas] == [("carga", "Foto individual cargada", admin.id)]


def test_si_falla_despues_de_escribir_la_foto_se_borra(client, db_api, monkeypatch):
    hid = _hce(client)
    original = servicio_fotos.registrar_carga

    def _falla(*_a, **_k):
        raise RuntimeError("falla simulada")

    monkeypatch.setattr(servicio_fotos, "registrar_carga", _falla)
    assert _subir(client, f"/hce/{hid}/fotos").status_code == 500
    assert _archivos() == []
    db_api.expire_all()
    assert db_api.scalar(select(func.count()).select_from(Foto)) == 0
    monkeypatch.setattr(servicio_fotos, "registrar_carga", original)
    assert _subir(client, f"/hce/{hid}/fotos").status_code == 201 and len(_archivos()) == 1


# ── Grupales ─────────────────────────────────────────────────────────────────
def test_la_foto_grupal_la_ve_el_tecnico_del_grupo_y_el_admin_y_no_otro(client, db_api, escenario, crear_profesional, hash_test, token_de):
    g = escenario["escolares"]
    ruta = f"/grupos/{g.id}/fotos"
    d = _foto(client, ruta, headers=escenario["tina"], descripcion="Salida del grupo")
    db_api.expire_all()
    ref = db_api.scalar(select(Foto.archivo_ref).where(Foto.id == d["id"]))
    assert REF_GRUPO.match(ref) and ref.startswith(f"grupo/{g.id}/")
    assert (config.raiz_de_archivos() / ref).resolve().is_relative_to(config.raiz_de_archivos())
    for cab in (escenario["tina"], None):  # el técnico del grupo y el admin (cabecera por omisión de `client`)
        assert client.get(ruta, headers=cab).json() == [d]
        assert client.get(f"{ruta}/{d['id']}", headers=cab).status_code == 200
        assert client.get(f"{ruta}/{d['id']}/archivo", headers=cab).content == PNG
    assert _subir(client, ruta).status_code == 201  # el admin también sube
    nadie = token_de(crear_profesional(nombre="Nadie", hashed_password=hash_test))
    for cab in (escenario["otra"], nadie):  # técnico de otro grupo y técnico sin grupo
        for metodo, sufijo in (("GET", ""), ("GET", f"/{d['id']}"), ("GET", f"/{d['id']}/archivo")):
            r = client.request(metodo, ruta + sufijo, headers=cab)
            assert r.status_code == 404 and r.json()["code"] == "not_found", (metodo, sufijo)
        r = _subir(client, ruta, headers=cab)
        assert r.status_code == 404
    assert client.get(ruta).headers["X-Total-Count"] == "2"
    anonimo = TestClient(app)
    for sufijo in ("", f"/{d['id']}", f"/{d['id']}/archivo"):
        assert anonimo.get(ruta + sufijo).status_code == 401
    assert _subir(anonimo, ruta).status_code == 401
    assert client.get("/grupos/987654/fotos").status_code == 404


def test_la_foto_grupal_deja_una_fila_institucional_con_el_grupo(client, db_api, escenario):
    g = escenario["escolares"]
    _foto(client, f"/grupos/{g.id}/fotos", headers=escenario["tina"], descripcion="Descripción-Secreta")
    db_api.expire_all()
    filas = list(db_api.scalars(select(Auditoria).where(Auditoria.modulo == "GRUPO")))
    assert len(filas) == 1
    f = filas[0]
    assert (f.hce_id, f.tipo, f.campo) == (None, "carga", None)
    assert f.detalle == f"Grupo {g.nombre} {g.anio} · foto grupal cargada" and "Secreta" not in f.detalle


def test_la_foto_grupal_no_requiere_autorizaciones_ni_avisa(client, escenario):
    r = _subir(client, f"/grupos/{escenario['inicial'].id}/fotos", headers=escenario["otra"])
    assert r.status_code == 201 and r.json()["warnings"] == []


def test_una_foto_de_otro_dueno_es_404(client, escenario):
    propio, ajeno, g, gi = escenario["propio"], escenario["ajeno"], escenario["escolares"], escenario["inicial"]
    individual = _foto(client, f"/hce/{propio}/fotos")
    grupal = _foto(client, f"/grupos/{g.id}/fotos")
    otra_grupal = _foto(client, f"/grupos/{gi.id}/fotos")
    casos = [
        f"/hce/{ajeno}/fotos/{individual['id']}",          # individual de otro expediente
        f"/hce/{propio}/fotos/{grupal['id']}",             # una grupal por la ruta de un expediente
        f"/grupos/{g.id}/fotos/{individual['id']}",        # una individual por la ruta de un grupo
        f"/grupos/{g.id}/fotos/{otra_grupal['id']}",       # la de otro grupo
    ]
    for ruta in casos:
        for sufijo in ("", "/archivo"):
            r = client.get(ruta + sufijo)
            assert r.status_code == 404 and r.json()["code"] == "not_found", ruta + sufijo
    assert client.get(f"/hce/{propio}/fotos/{individual['id']}/archivo").status_code == 200
    assert client.get(f"/hce/{ajeno}/fotos").json() == []


# ── Acceso individual y DELETE ───────────────────────────────────────────────
def test_alcance_de_las_fotos_individuales(client, escenario):
    propio, ajeno = escenario["propio"], escenario["ajeno"]
    d = _foto(client, f"/hce/{propio}/fotos", headers=escenario["tina"])
    for sufijo in ("", f"/{d['id']}", f"/{d['id']}/archivo"):
        assert client.get(f"/hce/{propio}/fotos{sufijo}", headers=escenario["tina"]).status_code == 200
    da = _foto(client, f"/hce/{ajeno}/fotos")  # el admin
    for sufijo in ("", f"/{da['id']}", f"/{da['id']}/archivo"):
        r = client.get(f"/hce/{ajeno}/fotos{sufijo}", headers=escenario["tina"])
        assert r.status_code == 404 and r.json()["code"] == "not_found", sufijo
        assert client.get(f"/hce/{ajeno}/fotos{sufijo}").status_code == 200  # admin
        assert TestClient(app).get(f"/hce/{propio}/fotos{sufijo}").status_code == 401
    assert _subir(client, f"/hce/{ajeno}/fotos", headers=escenario["tina"]).status_code == 404
    assert _subir(TestClient(app), f"/hce/{propio}/fotos").status_code == 401
    assert client.get(f"/hce/{ajeno}/fotos").headers["X-Total-Count"] == "1"


def test_delete_de_una_foto_es_405(client, escenario):
    d = _foto(client, f"/hce/{escenario['propio']}/fotos")
    g = _foto(client, f"/grupos/{escenario['escolares'].id}/fotos")
    for ruta in (f"/hce/{escenario['propio']}/fotos/{d['id']}", f"/hce/{escenario['propio']}/fotos/{d['id']}/archivo",
                 f"/grupos/{escenario['escolares'].id}/fotos/{g['id']}", f"/grupos/{escenario['escolares'].id}/fotos"):
        assert client.delete(ruta).status_code == 405, ruta
    assert client.get(f"/hce/{escenario['propio']}/fotos/{d['id']}").status_code == 200


def test_fecha_invalida_es_422_y_vacia_pasa(client):
    hid = _hce(client)
    r = _subir(client, f"/hce/{hid}/fotos", fecha="31/12/2026")
    assert r.status_code == 422 and _campos(r) == ["fecha"] and _archivos() == []
    assert _foto(client, f"/hce/{hid}/fotos", fecha="")["fecha"] is None
    assert date.fromisoformat(_foto(client, f"/hce/{hid}/fotos", fecha="2026-12-31")["fecha"]) == date(2026, 12, 31)
