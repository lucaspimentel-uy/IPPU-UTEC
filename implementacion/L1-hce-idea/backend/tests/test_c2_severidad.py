"""C2 · HCE-SEV: `GET /severidad-niveles` y `GET/POST/PATCH /hce/{id}/severidad`.

Convención del repo: todo rechazo va emparejado con el caso que pasa (422 ↔ 201/200). Las reglas
están en `app/services/severidad.py`; los guards de §4 del esquema («HCE-SEV · entrada», «salida (1)
y (2)» y «toda edición registra auditoría de campo») tienen su test acá.
"""
import ast
import inspect
import json
import re
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select

from app.main import app
from app.models.severidad import SeveridadNivel
from app.models.transversales import Auditoria
from app.seed_catalogos import DATOS
from app.services import severidad as servicio_sev
from test_m11_3b_idea_flujo import _hce  # noqa: F401  (ayuda)

CUERPO = {"nivel_cs": 2, "nivel_crr": 3, "justificacion": "Observación en sala y entrevista con la familia.", "fecha": "2026-03-16"}


@pytest.fixture
def niveles(db_api):
    filas = json.loads(DATOS.read_text(encoding="utf-8"))["severidad_nivel"]
    for fila in filas:
        db_api.add(SeveridadNivel(**fila))
    db_api.commit()
    return {f["grado"]: f for f in filas}


def _sev(client, hid: int, **cambios) -> dict:
    r = client.post(f"/hce/{hid}/severidad", json={**CUERPO, **cambios})
    assert r.status_code == 201, r.text
    return r.json()


def _filas(db_api, hid: int, **filtro) -> list[Auditoria]:
    db_api.expire_all()
    q = select(Auditoria).where(Auditoria.hce_id == hid, Auditoria.modulo == "HCE-SEV")
    for k, v in filtro.items():
        q = q.where(getattr(Auditoria, k) == v)
    return list(db_api.scalars(q.order_by(Auditoria.id)))


# ── Catálogo ─────────────────────────────────────────────────────────────────
def test_los_niveles_son_los_tres_grados_en_orden(client, niveles):
    r = client.get("/severidad-niveles")
    assert r.status_code == 200, r.text
    assert [n["grado"] for n in r.json()] == [1, 2, 3]
    assert r.json()[1] == niveles[2]
    assert set(r.json()[0]) == {"grado", "etiqueta", "descriptor_cs", "descriptor_crr", "apoyos"}


def test_los_niveles_los_ve_un_tecnico_y_sin_token_es_401(client, niveles, crear_profesional, token_de, hash_test):
    tecnico = crear_profesional(nombre="Tina", hashed_password=hash_test)
    assert len(client.get("/severidad-niveles", headers=token_de(tecnico)).json()) == 3
    assert TestClient(app).get("/severidad-niveles").status_code == 401


# ── Camino feliz ─────────────────────────────────────────────────────────────
def test_registrar_leer_y_editar(client, admin, niveles):
    hid = _hce(client)
    assert client.get(f"/hce/{hid}/severidad").status_code == 404  # sin registro: el estado vacío, como el CI
    r = _sev(client, hid)
    assert r["warnings"] == []
    d = r["data"]
    assert (d["nivel_cs"], d["nivel_crr"]) == (2, 3)
    assert d["etiqueta_cs"] == niveles[2]["etiqueta"] and d["etiqueta_crr"] == niveles[3]["etiqueta"]
    assert d["justificacion"] == CUERPO["justificacion"] and d["fecha"] == "2026-03-16"
    assert d["profesional"] == {"id": admin.id, "nombre": admin.nombre}
    assert client.get(f"/hce/{hid}/severidad").json() == d
    r = client.patch(f"/hce/{hid}/severidad", json={"nivel_cs": 3})
    assert r.status_code == 200, r.text
    assert r.json()["data"]["nivel_cs"] == 3 and r.json()["data"]["etiqueta_cs"] == niveles[3]["etiqueta"]
    assert r.json()["data"]["nivel_crr"] == 3 and r.json()["data"]["justificacion"] == CUERPO["justificacion"]
    assert client.get(f"/hce/{hid}/severidad").json() == r.json()["data"]


def test_los_dos_dominios_son_independientes(client, niveles):
    hid = _hce(client)
    assert _sev(client, hid, nivel_cs=3, nivel_crr=1)["data"]["etiqueta_crr"] == niveles[1]["etiqueta"]


def test_sin_la_fila_del_catalogo_la_etiqueta_es_null_y_el_grado_vale_igual(client):
    """Sin FK a `severidad_nivel`, a propósito: el grado es el dato primario (docstring de `SeveridadDsm`)."""
    hid = _hce(client)
    d = _sev(client, hid)["data"]
    assert d["nivel_cs"] == 2 and d["etiqueta_cs"] is None


def test_la_etiqueta_no_se_guarda_se_resuelve_al_leer(client, db_api, niveles):
    hid = _hce(client)
    _sev(client, hid)
    fila = db_api.get(SeveridadNivel, 2)
    fila.etiqueta = "Grado 2 · rótulo nuevo"
    db_api.commit()
    assert client.get(f"/hce/{hid}/severidad").json()["etiqueta_cs"] == "Grado 2 · rótulo nuevo"


# ── Rechazos, cada uno con su caso que pasa ──────────────────────────────────
@pytest.mark.parametrize("campo", ["nivel_cs", "nivel_crr"])
@pytest.mark.parametrize("malo,bueno", [(0, 1), (4, 3)])
def test_nivel_fuera_de_1_a_3_es_422_y_el_borde_pasa(client, campo, malo, bueno):
    hid = _hce(client)
    r = client.post(f"/hce/{hid}/severidad", json={**CUERPO, campo: malo})
    assert r.status_code == 422 and [d["campo"] for d in r.json()["detail"]] == [campo]
    assert _sev(client, hid, **{campo: bueno})["data"][campo] == bueno
    r = client.patch(f"/hce/{hid}/severidad", json={campo: malo})
    assert r.status_code == 422 and [d["campo"] for d in r.json()["detail"]] == [campo]
    assert client.patch(f"/hce/{hid}/severidad", json={campo: 2}).status_code == 200


@pytest.mark.parametrize("blanco", ["", "   ", "\t\t", "\n \r\n", " "])
def test_justificacion_en_blanco_es_422_y_con_texto_pasa(client, blanco):
    hid = _hce(client)
    r = client.post(f"/hce/{hid}/severidad", json={**CUERPO, "justificacion": blanco})
    assert r.status_code == 422 and [d["campo"] for d in r.json()["detail"]] == ["justificacion"]
    assert _sev(client, hid, justificacion="Sí")["data"]["justificacion"] == "Sí"  # sin largo mínimo (§5.143)
    r = client.patch(f"/hce/{hid}/severidad", json={"justificacion": blanco})
    assert r.status_code == 422 and [d["campo"] for d in r.json()["detail"]] == ["justificacion"]
    assert client.patch(f"/hce/{hid}/severidad", json={"justificacion": " otra\n"}).json()["data"]["justificacion"] == " otra\n"


@pytest.mark.parametrize("falta", ["nivel_cs", "nivel_crr", "justificacion", "fecha"])
def test_al_registrar_falta_un_campo_es_422_por_campo_y_completo_pasa(client, falta):
    """Entero o nada (§5.138 d): sin un dominio no se guarda nada."""
    hid = _hce(client)
    r = client.post(f"/hce/{hid}/severidad", json={k: v for k, v in CUERPO.items() if k != falta})
    assert r.status_code == 422 and r.json()["code"] == "validation_error"
    assert [d["campo"] for d in r.json()["detail"]] == [falta]
    assert client.get(f"/hce/{hid}/severidad").status_code == 404
    _sev(client, hid)


def test_al_registrar_vacio_marca_los_cuatro_campos(client):
    hid = _hce(client)
    r = client.post(f"/hce/{hid}/severidad", json={})
    assert r.status_code == 422
    assert sorted(d["campo"] for d in r.json()["detail"]) == ["fecha", "justificacion", "nivel_crr", "nivel_cs"]


@pytest.mark.parametrize("campo", ["nivel_cs", "nivel_crr", "justificacion", "fecha"])
def test_en_el_patch_null_es_422_y_la_ausencia_no_toca(client, campo):
    hid = _hce(client)
    d = _sev(client, hid)["data"]
    r = client.patch(f"/hce/{hid}/severidad", json={campo: None})
    assert r.status_code == 422 and [e["campo"] for e in r.json()["detail"]] == [campo]
    assert client.patch(f"/hce/{hid}/severidad", json={}).json()["data"] == d


def test_la_fecha_vacia_en_el_patch_es_422(client):
    hid = _hce(client)
    _sev(client, hid)
    r = client.patch(f"/hce/{hid}/severidad", json={"fecha": ""})
    assert r.status_code == 422 and [e["campo"] for e in r.json()["detail"]] == ["fecha"]
    assert client.patch(f"/hce/{hid}/severidad", json={"fecha": "2026-04-01"}).json()["data"]["fecha"] == "2026-04-01"


@pytest.mark.parametrize("intruso", [
    {"profesional_id": 1}, {"etiqueta_cs": "Grado 1"}, {"idea_total": 58}, {"total": 79}, {"hce_id": 9},
])
def test_un_campo_ajeno_es_422_y_sin_el_pasa(client, admin, intruso):
    """El autor es el usuario del token (§5.119 b, §5.143) y el nivel no se deriva de ningún puntaje."""
    hid = _hce(client)
    r = client.post(f"/hce/{hid}/severidad", json={**CUERPO, **intruso})
    assert r.status_code == 422 and [d["campo"] for d in r.json()["detail"]] == [next(iter(intruso))]
    assert _sev(client, hid)["data"]["profesional"]["id"] == admin.id
    assert client.patch(f"/hce/{hid}/severidad", json=intruso).status_code == 422
    assert client.patch(f"/hce/{hid}/severidad", json={"nivel_cs": 1}).status_code == 200


def test_registrar_dos_veces_es_409_y_la_primera_queda(client):
    hid = _hce(client)
    primera = _sev(client, hid)["data"]
    r = client.post(f"/hce/{hid}/severidad", json={**CUERPO, "nivel_cs": 1})
    assert r.status_code == 409 and r.json()["code"] == "conflict"
    assert client.get(f"/hce/{hid}/severidad").json() == primera


def test_patch_sin_registro_es_404_y_con_registro_pasa(client):
    hid = _hce(client)
    r = client.patch(f"/hce/{hid}/severidad", json={"nivel_cs": 1})
    assert r.status_code == 404 and r.json()["code"] == "not_found"
    _sev(client, hid)
    assert client.patch(f"/hce/{hid}/severidad", json={"nivel_cs": 1}).status_code == 200


def test_expediente_inexistente_es_404_en_las_tres_rutas(client):
    for metodo, cuerpo in (("get", None), ("post", CUERPO), ("patch", {"nivel_cs": 1})):
        r = client.request(metodo.upper(), "/hce/999999/severidad", json=cuerpo)
        assert r.status_code == 404, (metodo, r.text)


# ── Autor y auditoría ────────────────────────────────────────────────────────
def test_el_alta_deja_una_fila_carga_con_el_autor(client, db_api, admin):
    hid = _hce(client)
    _sev(client, hid)
    (fila,) = _filas(db_api, hid)
    assert fila.tipo == "carga" and fila.usuario_id == admin.id and fila.campo is None


def test_cada_campo_que_cambia_deja_su_fila_con_antes_y_despues(client, db_api):
    hid = _hce(client)
    _sev(client, hid, nivel_cs=2)
    client.patch(f"/hce/{hid}/severidad", json={"nivel_cs": 3, "justificacion": "Nueva", "fecha": "2026-06-01"})
    filas = {f.campo: (f.valor_ant, f.valor_nuevo) for f in _filas(db_api, hid, tipo="edicion")}
    assert filas == {
        "nivel_cs": ("2", "3"), "justificacion": (CUERPO["justificacion"], "Nueva"), "fecha": ("2026-03-16", "2026-06-01"),
    }


def test_editar_el_nivel_de_2_a_3_queda_legible_en_get_auditoria(client):
    """La condición que hace correcto el 0..1 (esquema §2.2 y §4): el nivel anterior no se pierde."""
    hid = _hce(client)
    _sev(client, hid, nivel_crr=2)
    client.patch(f"/hce/{hid}/severidad", json={"nivel_crr": 3})
    (fila,) = client.get(f"/hce/{hid}/auditoria", params={"modulo": "HCE-SEV", "tipo": "edicion"}).json()
    assert (fila["campo"], fila["valor_ant"], fila["valor_nuevo"]) == ("nivel_crr", "2", "3")


def test_un_patch_que_no_cambia_nada_no_deja_filas_ni_cambia_el_autor(client, db_api, admin, crear_grupo, crear_profesional, token_de, hash_test):
    tecnico = crear_profesional(nombre="Tina", hashed_password=hash_test)
    grupo = crear_grupo(nombre="Escolares", tecnico1_id=tecnico.id)
    r = client.post("/hce", json={"persona": {"nombre": "A", "apellido": "B", "ci": "7123401-1", "fecha_nac": "2016-04-12"}, "grupo_id": grupo.id})
    hid = r.json()["data"]["id"]
    _sev(client, hid)
    antes = len(_filas(db_api, hid))
    r = client.patch(f"/hce/{hid}/severidad", json=CUERPO, headers=token_de(tecnico))
    assert r.status_code == 200 and r.json()["data"]["profesional"]["id"] == admin.id
    assert len(_filas(db_api, hid)) == antes
    # El par: un cambio real del técnico lo vuelve autor, y el cambio de autor también queda legible.
    r = client.patch(f"/hce/{hid}/severidad", json={"nivel_cs": 1}, headers=token_de(tecnico))
    assert r.json()["data"]["profesional"] == {"id": tecnico.id, "nombre": "Tina"}
    filas = {f.campo: (f.valor_ant, f.valor_nuevo, f.usuario_id) for f in _filas(db_api, hid, tipo="edicion")}
    assert filas == {
        "nivel_cs": ("2", "1", tecnico.id),
        "profesional_id": (f"{admin.nombre} (id {admin.id})", f"Tina (id {tecnico.id})", tecnico.id),
    }


def test_un_rechazo_no_escribe_nada(client, db_api):
    hid = _hce(client)
    _sev(client, hid)
    db_api.expire_all()
    total = db_api.scalar(select(func.count()).select_from(Auditoria))
    client.patch(f"/hce/{hid}/severidad", json={"nivel_cs": 1, "justificacion": " "})
    client.post(f"/hce/{hid}/severidad", json=CUERPO)
    db_api.expire_all()
    assert db_api.scalar(select(func.count()).select_from(Auditoria)) == total
    assert client.get(f"/hce/{hid}/severidad").json()["nivel_cs"] == 2


# ── Acceso ───────────────────────────────────────────────────────────────────
def test_alcance_propio_ajeno_admin_y_sin_token(client, niveles, crear_grupo, crear_profesional, token_de, hash_test):
    mia = crear_profesional(nombre="Tina", hashed_password=hash_test)
    otra = crear_profesional(nombre="Otra", hashed_password=hash_test)
    propio, ajeno = crear_grupo(nombre="Escolares", tecnico1_id=mia.id), crear_grupo(nombre="Inicial", tecnico1_id=otra.id)

    def alta(g):
        r = client.post("/hce", json={"persona": {"nombre": "A", "apellido": "B", "ci": f"8{g.id}01-1", "fecha_nac": "2016-04-12"}, "grupo_id": g.id})
        assert r.status_code == 201, r.text
        return r.json()["data"]["id"]

    h_propio, h_ajeno = alta(propio), alta(ajeno)
    cab = token_de(mia)
    # Propio: las tres rutas, y el técnico queda como autor.
    assert client.get(f"/hce/{h_propio}/severidad", headers=cab).status_code == 404  # sin registro todavía
    r = client.post(f"/hce/{h_propio}/severidad", json=CUERPO, headers=cab)
    assert r.status_code == 201 and r.json()["data"]["profesional"]["id"] == mia.id
    assert client.get(f"/hce/{h_propio}/severidad", headers=cab).status_code == 200
    assert client.patch(f"/hce/{h_propio}/severidad", json={"nivel_cs": 1}, headers=cab).status_code == 200
    # Ajeno: 404 en las tres, aunque el registro exista; nada se escribe.
    assert client.post(f"/hce/{h_ajeno}/severidad", json=CUERPO).status_code == 201  # lo carga el admin
    for metodo, cuerpo in (("GET", None), ("POST", CUERPO), ("PATCH", {"nivel_cs": 1})):
        r = client.request(metodo, f"/hce/{h_ajeno}/severidad", json=cuerpo, headers=cab)
        assert r.status_code == 404 and r.json()["code"] == "not_found", metodo
    assert client.get(f"/hce/{h_ajeno}/severidad").json()["nivel_cs"] == 2  # admin ve todo; el PATCH ajeno no tocó
    # Sin token: 401 en las tres.
    anonimo = TestClient(app)
    for metodo, cuerpo in (("GET", None), ("POST", CUERPO), ("PATCH", {"nivel_cs": 1})):
        assert anonimo.request(metodo, f"/hce/{h_propio}/severidad", json=cuerpo).status_code == 401, metodo


# ── Guards estructurales de §4 del esquema ───────────────────────────────────
def _importados(modulo) -> tuple[set[str], set[str]]:
    arbol = ast.parse(inspect.getsource(modulo))
    importados = {n.module for n in ast.walk(arbol) if isinstance(n, ast.ImportFrom)} | {
        a.name for n in ast.walk(arbol) if isinstance(n, ast.Import) for a in n.names
    }
    nombres = {n.id for n in ast.walk(arbol) if isinstance(n, ast.Name)} | {
        a.name for n in ast.walk(arbol) if isinstance(n, ast.ImportFrom) for a in n.names
    }
    return importados, nombres


def test_hce_sev_entrada_el_nivel_no_lee_idea_protocolo_ni_ippu_tea():
    """§4 «HCE-SEV · entrada»: ni import ni nombre a mano de los instrumentos clínicos ni sus catálogos."""
    prohibidos = {
        "app.models.modulos", "app.models.catalogos", "app.services.idea", "app.services.protocolo",
        "app.services.delta", "app.services.informe_cierre", "app.services.flujo", "app.services.valoracion_funcional",
    }
    import app.routers.severidad as router_sev
    import app.schemas.severidad as schema_sev
    for modulo in (servicio_sev, schema_sev, router_sev):
        importados, nombres = _importados(modulo)
        assert not importados & prohibidos, (modulo.__name__, importados & prohibidos)
        assert not nombres & {"Idea", "Protocolo", "IppuItem", "BandaIdea", "InformeCierre"}, modulo.__name__


def test_hce_sev_salida_nadie_fuera_del_modulo_lee_la_severidad():
    """§4 «HCE-SEV · salida (1) y (2)»: ni la VF, ni el baremo, ni una sugerencia CIF (que hoy no existe, §5.118)
    leen `severidad_dsm`. Sólo el servicio y el router de la rebanada lo tocan; un tercer lector → rojo."""
    raiz = Path(servicio_sev.__file__).resolve().parents[1]
    lector = re.compile(r"SeveridadDsm|models\.severidad|services\.severidad|services import [^\n]*\bseveridad\b")
    lectores = set()
    for archivo in sorted(raiz.rglob("*.py")):
        rel = archivo.relative_to(raiz.parent).as_posix()
        if rel.startswith("app/models/") or rel == "app/seed_catalogos.py":
            continue  # el modelo y su relación, y la carga del catálogo de referencia
        if lector.search(archivo.read_text(encoding="utf-8")):
            lectores.add(rel)
    assert lectores == {"app/services/severidad.py", "app/routers/severidad.py"}, lectores
