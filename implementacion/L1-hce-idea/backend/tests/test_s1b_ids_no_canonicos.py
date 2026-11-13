"""S1b (§5.168) · los ids de `/idea`, `/protocolo` e `/informe-cierre` no se esquivan con una forma no canónica.

La dependencia de alcance (`_visible_por`) leía la cadena cruda del path y, si `not crudo.isdigit()`, volvía sin
mirar nada «porque la validación del path ya lo rechaza». Era falso: FastAPI/Pydantic convierten `+1`, `1.0`, ` 1`,
`1 ` y `1\\n` a un `int` válido, y el endpoint corría sobre un registro que la dependencia nunca revisó (un técnico de
otro grupo lo leía y lo modificaba). Ahora la dependencia recibe el id **ya convertido por FastAPI**, el mismo valor
que el endpoint.

Convención de la suite: **todo rechazo va emparejado con el caso que pasa**. Acá, con usuarios reales (no el `client`
por omisión: es el admin y ve todo): el técnico que **no** trata el registro, para cada ruta y cada forma, recibe lo
mismo que con el id canónico (el 404), **el servicio no corre** (la fila y la auditoría no cambian), y el técnico que
**sí** lo trata, con el id canónico, recibe lo de siempre (200, 201).

El barrido sale de `app.routes`, no de una lista a mano: una ruta nueva por id sin caso acá falla el test de cobertura.
"""
import re
from types import SimpleNamespace
from urllib.parse import quote

import pytest
from fastapi.routing import APIRoute
from sqlalchemy import func, select
from sqlalchemy import inspect as sa_inspect

from app.main import app
from app.models.modulos import Idea, InformeCierre, Protocolo
from app.models.transversales import Auditoria
from test_m11_3b_idea_flujo import _completo, _crear
from test_m11_3c_protocolo_ic import (  # noqa: F401  (equipo, tramos: fixtures)
    _crear_prot, _firmar_prot, _ic, _prot, equipo, tramos,
)
from test_m11_3d1_login_listado import _alta

_RUTA_POR_ID = re.compile(r"/(idea|protocolo|informe-cierre)/\{(idea|protocolo|informe)_id\}(/\w+)?")
MODELO = {"idea": Idea, "protocolo": Protocolo, "informe-cierre": InformeCierre}


def _rutas_por_id() -> list[tuple[str, str]]:
    """`(método, plantilla)` de **toda** ruta de los tres routers que lleva el id del recurso en el path."""
    return sorted(
        (metodo, ruta.path)
        for ruta in app.routes
        if isinstance(ruta, APIRoute) and _RUTA_POR_ID.fullmatch(ruta.path)
        for metodo in ruta.methods
    )


RUTAS = _rutas_por_id()

# (método, plantilla) → (estado en que hay que dejar el registro, cuerpo, lo que recibe **quien lo trata** con el id canónico)
_RECIBI = {"firmante": "Marta R. (madre)", "fecha": "2026-12-20"}
CASOS = {
    ("GET", "/idea/{idea_id}"): ("borrador", None, 200),
    ("PATCH", "/idea/{idea_id}"): ("borrador", {"objetivos": "Objetivos ajustados."}, 200),
    ("POST", "/idea/{idea_id}/firmar"): ("borrador", None, 200),
    ("POST", "/idea/{idea_id}/addendas"): ("firmado", {"texto": "Corrección."}, 201),
    ("GET", "/protocolo/{protocolo_id}"): ("borrador", None, 200),
    ("PATCH", "/protocolo/{protocolo_id}"): ("borrador", {"semanas": 12}, 200),
    ("POST", "/protocolo/{protocolo_id}/firmar"): ("borrador", None, 200),
    ("POST", "/protocolo/{protocolo_id}/addendas"): ("firmado", {"texto": "Corrección."}, 201),
    ("GET", "/informe-cierre/{informe_id}"): ("borrador", None, 200),
    ("PATCH", "/informe-cierre/{informe_id}"): ("borrador", {"recomendaciones": "Recomendaciones ajustadas."}, 200),
    ("POST", "/informe-cierre/{informe_id}/firmar"): ("borrador", "FIRMANTES", 200),
    ("POST", "/informe-cierre/{informe_id}/addendas"): ("firmado", {"texto": "Corrección."}, 201),
    ("POST", "/informe-cierre/{informe_id}/recibi"): ("firmado", _RECIBI, 201),
    ("GET", "/informe-cierre/{informe_id}/documento"): ("firmado", None, 200),
}

#: Las formas que FastAPI/Pydantic convierten al `int` del id canónico (en la URL, tal cual viajan).
FORMAS = {
    "signo +": lambda i: f"%2B{i}",
    "decimal .0": lambda i: f"{i}.0",
    "espacio antes": lambda i: f"%20{i}",
    "espacio después": lambda i: f"{i}%20",
    "salto de línea": lambda i: f"{i}%0A",
}


def _ancho_completo(ident: int) -> str:
    """Los mismos dígitos en ancho completo (U+FF10…): `str.isdigit()` los acepta, Pydantic no los convierte."""
    return quote("".join(chr(0xFF10 + int(d)) for d in str(ident)))


def _url(plantilla: str, segmento) -> str:
    return re.sub(r"\{\w+\}", str(segmento), plantilla)


# ── Escenario: un técnico que trata el expediente y otro que no, con los tres registros ──────────────────────
@pytest.fixture
def escenario(client, crear_grupo, crear_profesional, hash_test, equipo, tramos, token_de):
    tratante = crear_profesional(nombre="Teo Tratante", email="teo@ippu.test", hashed_password=hash_test)
    intruso = crear_profesional(nombre="Ivo Intruso", email="ivo@ippu.test", hashed_password=hash_test)
    grupo_del_tratante = crear_grupo(nombre="Del tratante", tecnico1_id=tratante.id)
    crear_grupo(nombre="Del intruso", tecnico1_id=intruso.id)
    return SimpleNamespace(
        client=client, equipo=equipo, hce=_alta(client, grupo_del_tratante.id),
        cab_tratante=token_de(tratante), cab_intruso=token_de(intruso),
    )


def _registro(e, ruta: str, estado: str) -> int:
    """Crea (como admin) el registro del módulo de `ruta` en el estado pedido y devuelve su id."""
    c, ids = e.client, [p.id for p in e.equipo]
    if ruta.startswith("/idea"):
        ident = _crear(c, e.hce, _completo(e.equipo))["id"]
        firmar = lambda: c.post(f"/idea/{ident}/firmar")  # noqa: E731
    elif ruta.startswith("/protocolo"):
        ident = _crear_prot(c, e.hce, _prot(e.equipo, "A"))["data"]["id"]
        firmar = lambda: c.post(f"/protocolo/{ident}/firmar")  # noqa: E731
    else:
        r = c.post(f"/hce/{e.hce}/informe-cierre", json=_ic())
        assert r.status_code == 201, r.text
        ident = r.json()["data"]["id"]
        firmar = lambda: c.post(f"/informe-cierre/{ident}/firmar", json={"firmantes": ids})  # noqa: E731
    if estado == "firmado":
        f = firmar()
        assert f.status_code == 200, f.text
    return ident


def _modelo_de(plantilla: str):
    return MODELO[plantilla.split("/")[1]]


def _foto(db_api, plantilla: str, ident: int) -> tuple[dict, int]:
    """Todas las columnas de la fila y cuántas filas de auditoría hay: si el servicio corriera, cambiaría alguna."""
    db_api.expire_all()
    fila = db_api.get(_modelo_de(plantilla), ident)
    columnas = {a.key: getattr(fila, a.key) for a in sa_inspect(_modelo_de(plantilla)).column_attrs}
    return columnas, db_api.scalar(select(func.count()).select_from(Auditoria))


def _pedir(e, metodo, url, cabeceras, cuerpo):
    if cuerpo == "FIRMANTES":
        cuerpo = {"firmantes": [p.id for p in e.equipo]}
    return e.client.request(metodo, url, json=cuerpo, headers=cabeceras)


# ── Cobertura: el barrido sale de las rutas reales ───────────────────────────────────────────────────────────
def test_el_barrido_cubre_las_14_rutas_por_id_de_los_tres_routers():
    assert len(RUTAS) == 14, RUTAS
    assert set(RUTAS) == set(CASOS), (
        f"rutas sin caso: {sorted(set(RUTAS) - set(CASOS))}; casos sin ruta: {sorted(set(CASOS) - set(RUTAS))}"
    )
    print(f"\nrutas por id barridas: {len(RUTAS)}")
    for metodo, plantilla in RUTAS:
        print(f"  {metodo:5} {plantilla}")


# ── Control: las formas SÍ llegan al endpoint como el mismo int (si no, el barrido no probaría nada) ─────────
@pytest.mark.parametrize("modulo,param", [("idea", "idea_id"), ("protocolo", "protocolo_id"), ("informe-cierre", "informe_id")])
def test_control_el_admin_lee_el_mismo_registro_con_cada_forma_y_el_ancho_completo_es_422(escenario, modulo, param):
    ident = _registro(escenario, f"/{modulo}/x", "borrador")
    admin = escenario.client
    canonico = admin.get(f"/{modulo}/{ident}")
    assert canonico.status_code == 200
    for nombre, forma in FORMAS.items():
        r = admin.get(f"/{modulo}/{forma(ident)}")
        assert r.status_code == 200 and r.json() == canonico.json(), (nombre, r.status_code, r.text)
    invalido = admin.get(f"/{modulo}/abc")
    ancho = admin.get(f"/{modulo}/{_ancho_completo(ident)}")
    assert invalido.status_code == ancho.status_code == 422
    assert invalido.json() == ancho.json() == {
        "code": "validation_error",
        "detail": [{"campo": param, "mensaje": "Input should be a valid integer, unable to parse string as an integer"}],
    }  # un único error: ni la dependencia ni el endpoint lo repiten


# ── El barrido: el técnico que no trata el registro, con cada forma, de cada ruta ────────────────────────────
@pytest.mark.parametrize("metodo,plantilla", RUTAS, ids=[f"{m} {p}" for m, p in RUTAS])
def test_un_tecnico_que_no_trata_el_registro_recibe_lo_mismo_con_cualquier_forma_del_id_y_el_servicio_no_corre(
    db_api, escenario, metodo, plantilla,
):
    estado, cuerpo, esperado = CASOS[(metodo, plantilla)]
    ident = _registro(escenario, plantilla, estado)
    cab = escenario.cab_intruso

    # lo que recibe con el id canónico: el 404 del recurso, igual que si no existiera
    canonico = _pedir(escenario, metodo, _url(plantilla, ident), cab, cuerpo)
    assert canonico.status_code == 404, (canonico.status_code, canonico.text)
    assert canonico.json()["code"] == "not_found"
    antes = _foto(db_api, plantilla, ident)

    for nombre, forma in FORMAS.items():
        r = _pedir(escenario, metodo, _url(plantilla, forma(ident)), cab, cuerpo)
        assert (r.status_code, r.json()) == (canonico.status_code, canonico.json()), (nombre, r.status_code, r.text)
        assert _foto(db_api, plantilla, ident) == antes, f"{nombre}: el servicio corrió y cambió la fila o la auditoría"

    # ancho completo (U+FF11…): Pydantic no lo convierte → el mismo 422 que un id que no es un número, y nada corre
    invalido = _pedir(escenario, metodo, _url(plantilla, "abc"), cab, cuerpo)
    ancho = _pedir(escenario, metodo, _url(plantilla, _ancho_completo(ident)), cab, cuerpo)
    assert invalido.status_code == ancho.status_code == 422, (invalido.status_code, ancho.status_code, ancho.text)
    assert ancho.json() == invalido.json()
    assert _foto(db_api, plantilla, ident) == antes

    # el par: quien SÍ lo trata, con el id canónico, recibe lo de siempre (y la fila y la auditoría sí cambian cuando escribe)
    propio = _pedir(escenario, metodo, _url(plantilla, ident), escenario.cab_tratante, cuerpo)
    assert propio.status_code == esperado, (propio.status_code, propio.text)
    if metodo != "GET":
        assert _foto(db_api, plantilla, ident) != antes, "el caso que pasa tiene que escribir (si no, el barrido no distingue)"
