"""La auditoría no muestra el id interno del expediente (decisión del equipo, corrección del bloque A).

El `detalle` de cada fila `carga` habla del módulo, no del número de fila de `hce_diurna`: ese id no
significa nada para quien lee la historia (el que sí significa es el N.º de HC). Un único test
parametrizado carga cada módulo que escribe una `carga` y mira **todas** las filas de auditoría del
expediente, no sólo la de la carga.
"""
import re

import pytest
from fastapi.routing import APIRoute
from sqlalchemy import select, text

from app.main import app

from app.models.transversales import Auditoria
from test_c2_severidad import CUERPO as SEV, niveles  # noqa: F401  (fixture)
from test_c3_organismos import BPS, INAU, REGISTRO
from test_c4_inclusion import FICHA, GESTION, estados  # noqa: F401  (estados: fixture)
from test_c5_documentos import AUTORIZACION, categorias, hoy  # noqa: F401  (fixtures)
from test_c5_documentos import _subir as _subir_doc
from test_c5_fotos import _subir as _subir_foto
from test_m11_3b_idea_flujo import _crear, _completo, _firmado
from test_m11_3d1_login_listado import _alta, grupos, tecnico  # noqa: F401  (fixtures)
from test_m11_3c_protocolo_ic import (  # noqa: F401  (equipo, tramos: fixtures)
    VALORES_PB_MARTIN, _crear_prot, _firmar_prot, _hce, _ic, _prot, equipo, tramos,
)
from test_m11_3d1_firmas_vf import baremo  # noqa: F401  (fixture)

ID_INTERNO = re.compile(r"expediente \d+")


def _cargar_hce_00(client, hce, equipo):
    """El alta del expediente ya la hizo `_hce`."""


def _cargar_ci(client, hce, equipo):
    assert client.post(f"/hce/{hce}/consentimiento", json={"firmante": "Marta R.", "fecha": "2026-03-02"}).status_code == 201


def _cargar_lb(client, hce, equipo):
    _crear(client, hce, _completo(equipo))


def _cargar_pa(client, hce, equipo):
    _crear_prot(client, hce, _prot(equipo, "A"))


def _cargar_pb(client, hce, equipo):
    _crear_prot(client, hce, _prot(equipo, "B", 2026, VALORES_PB_MARTIN, ajustes="Agenda visual."))


def _cargar_ic(client, hce, equipo):
    assert client.post(f"/hce/{hce}/informe-cierre", json=_ic()).status_code == 201


def _cargar_vf(client, hce, equipo):
    r = client.post(f"/hce/{hce}/valoracion-funcional", json={
        "estado": "Vigente", "fecha": "2025-11-10", "organismo": "MIDES", "pct": 58, "dominios": {"comunicacion": "Apoyo frecuente"},
    })
    assert r.status_code == 201, r.text


def _cargar_sev(client, hce, equipo):
    assert client.post(f"/hce/{hce}/severidad", json=SEV).status_code == 201


def _cargar_org(client, hce, equipo):
    assert client.post(f"/hce/{hce}/organismos/inau", json=INAU).status_code == 201
    assert client.post(f"/hce/{hce}/organismos/bps", json=BPS).status_code == 201
    assert client.post(f"/hce/{hce}/organismos/registros", json=REGISTRO).status_code == 201
    assert client.post(f"/hce/{hce}/organismos/registros", json={**REGISTRO, "organismo": "bps"}).status_code == 201


#: (cargador, lo que tiene que seguir diciendo el detalle de la carga)
MODULOS = {
    "HCE-00": (_cargar_hce_00, ["Alta del expediente (N.º de HC"]),
    "HCE-CI": (_cargar_ci, ["consentimiento informado"]),
    "HCE-LB": (_cargar_lb, ["Alta de HCE-LB (IDEA 2026)"]),
    "HCE-PA": (_cargar_pa, ["Protocolo A 2026"]),
    "HCE-PB": (_cargar_pb, ["Protocolo B 2026"]),
    "HCE-IC": (_cargar_ic, ["informe de cierre 2026"]),
    "HCE-VF": (_cargar_vf, ["Alta de HCE-VF"]),
    "HCE-SEV": (_cargar_sev, ["severidad DSM-5-TR"]),
    "HCE-ORG": (_cargar_org, ["vínculo con INAU", "vínculo con BPS", "Envío a INAU registrado", "Gestión ante BPS registrada"]),
}


@pytest.mark.parametrize("modulo", list(MODULOS))
def test_ningun_detalle_de_la_auditoria_lleva_el_id_interno_del_expediente(client, db_api, equipo, tramos, niveles, baremo, modulo):
    cargador, esperado = MODULOS[modulo]
    hce = _hce(client)
    cargador(client, hce, equipo)
    db_api.expire_all()
    filas = list(db_api.scalars(select(Auditoria).where(Auditoria.hce_id == hce).order_by(Auditoria.id)))
    cargas = [f for f in filas if f.tipo == "carga" and f.modulo == modulo]
    assert cargas, f"{modulo} no dejó fila de carga"
    for f in filas:
        assert not ID_INTERNO.search(f.detalle or ""), f"{f.modulo}/{f.tipo}: {f.detalle!r}"
    detalles = " | ".join(f.detalle for f in cargas)
    for texto in esperado:
        assert texto in detalles, f"{texto!r} no está en {detalles!r}"


# ── Barrido de rutas: ningún rechazo ni ninguna fila de auditoría lleva el id interno de un recurso ────
#
# Decisión del equipo (misma que A7 / §5.152, ampliada en la corrección del bloque B): ningún texto que lee una
# persona lleva el id de una fila. Los ids de estos tests son todos de 7 cifras o más (`ids_altos` sube las
# secuencias; el inexistente es `INEXISTENTE`), así que un id que se cuele en un texto se reconoce sin ambigüedad.
# Lo que SÍ puede aparecer: el año («del 2026») y el N.º de HC, que son datos de la persona, no de la tabla.
INEXISTENTE = 9_999_001
ID_EN_TEXTO = re.compile(r"\d{7,}")
RECURSO_Y_NUMERO = re.compile(
    r"(?i)\b(?:expediente|grupo|idea|protocolo|documento|foto|informe(?: de cierre)?|profesional|registro|id)\s+#?(?!20\d\d\b)\d+"
)
N_DE_HC = re.compile(r"N\.º de HC\s*\d+")


@pytest.fixture
def ids_altos(db_api):
    """Sube todas las secuencias a 4 242 000 y las deja donde estaban al terminar (no las revierte el rollback)."""
    previas = db_api.execute(text("SELECT schemaname, sequencename, last_value FROM pg_sequences")).all()
    for esquema, nombre, _ in previas:
        db_api.execute(text("SELECT setval(quote_ident(:e) || '.' || quote_ident(:n), 4242000)"), {"e": esquema, "n": nombre})
    db_api.commit()
    yield
    for esquema, nombre, ultimo in previas:
        db_api.execute(
            text("SELECT setval(quote_ident(:e) || '.' || quote_ident(:n), :v, :llamada)"),
            {"e": esquema, "n": nombre, "v": ultimo if ultimo is not None else 1, "llamada": ultimo is not None},
        )
    db_api.commit()


@pytest.fixture
def rastro(client, ids_altos):
    """Anota cada respuesta del `client` (método, ruta, respuesta) sin cambiarla."""
    visto: list[tuple[str, str, object]] = []
    original = client.request

    def request(method, url, **kw):
        r = original(method, url, **kw)
        visto.append((method.upper(), str(url), r))
        return r

    client.request = request
    yield visto
    client.request = original


def _mensajes(r) -> list[str]:
    return [d["mensaje"] for d in r.json().get("detail", [])]


def _sin_id_en_los_rechazos(rastro) -> int:
    """404/409/422 del rastro: ni un número de 7 cifras ni «recurso + número». Devuelve cuántos revisó."""
    revisados = 0
    for metodo, url, r in rastro:
        if r.status_code not in (404, 409, 422):
            continue
        assert not ID_EN_TEXTO.search(r.text), f"{metodo} {url} → {r.status_code}: {r.text!r}"  # la respuesta entera
        for texto in _mensajes(r):
            assert not ID_EN_TEXTO.search(texto), f"{metodo} {url} → {r.status_code}: {texto!r}"
            assert not RECURSO_Y_NUMERO.search(texto), f"{metodo} {url} → {r.status_code}: {texto!r}"
        revisados += 1
    return revisados


def _sin_id_en_la_auditoria(db_api) -> int:
    db_api.expire_all()
    filas = list(db_api.scalars(select(Auditoria)))
    for f in filas:
        detalle = N_DE_HC.sub("", f.detalle or "")
        assert not ID_EN_TEXTO.search(detalle), f"{f.modulo}/{f.tipo}: {f.detalle!r}"
        assert not RECURSO_Y_NUMERO.search(detalle), f"{f.modulo}/{f.tipo}: {f.detalle!r}"
    return len(filas)


def _rutas_con_parametros():
    for ruta in app.routes:
        if isinstance(ruta, APIRoute) and "{" in ruta.path:
            for metodo in sorted(ruta.methods & {"GET", "PATCH", "POST", "PUT", "DELETE"}):
                yield metodo, ruta.path


def _llamar(c, metodo, plantilla, valores, **kw):
    url = re.sub(r"\{(\w+)\}", lambda m: str(valores.get(m.group(1), INEXISTENTE)), plantilla)
    return c.request(metodo, url, json={} if metodo in ("POST", "PATCH", "PUT") else None, **kw)


def test_ninguna_ruta_con_id_inexistente_o_ajeno_dice_el_id_y_el_ajeno_es_igual_al_inexistente(
    client, db_api, rastro, grupos, tecnico, token_de,
):
    propio, ajeno = grupos
    hce_propio, hce_ajeno = _alta(client, propio.id), _alta(client, ajeno.id)
    cab = token_de(tecnico)
    rutas = list(_rutas_con_parametros())
    assert len(rutas) > 60, "el barrido tiene que recorrer todas las rutas con parámetros"

    comparadas = inexistentes = 0
    for metodo, plantilla in rutas:
        # (a) todo inexistente → 404 (o el 405/422 de la forma de la ruta), nunca 500
        r = _llamar(client, metodo, plantilla, {})
        assert r.status_code < 500, (metodo, plantilla, r.status_code, r.text)
        inexistentes += r.status_code == 404
        # (b) el expediente y el grupo ajenos al técnico, contra los inexistentes del admin: la MISMA respuesta
        ajeno_tec = _llamar(client, metodo, plantilla, {"hce_id": hce_ajeno, "grupo_id": ajeno.id}, headers=cab)
        nada_admin = _llamar(client, metodo, plantilla, {"hce_id": INEXISTENTE, "grupo_id": INEXISTENTE})
        if ajeno_tec.status_code == 404:
            assert nada_admin.status_code == 404, (metodo, plantilla)
            assert ajeno_tec.json() == nada_admin.json(), (metodo, plantilla, ajeno_tec.json(), nada_admin.json())
            comparadas += 1
        # (c) el expediente propio no se rechaza por alcance
        propio_tec = _llamar(client, metodo, plantilla, {"hce_id": hce_propio, "grupo_id": propio.id}, headers=cab)
        assert propio_tec.status_code < 500, (metodo, plantilla)
    assert inexistentes > 40 and comparadas > 40, (inexistentes, comparadas)
    assert _sin_id_en_los_rechazos(rastro) > 100

    # el par exacto: la misma ruta con un expediente propio pasa, con uno ajeno o inexistente no
    assert client.get(f"/hce/{hce_propio}/flujo", headers=cab).status_code == 200
    assert client.get(f"/hce/{hce_ajeno}/flujo", headers=cab).status_code == 404
    assert client.get(f"/hce/{INEXISTENTE}/flujo").status_code == 404
    _sin_id_en_la_auditoria(db_api)


def test_el_idea_el_protocolo_y_el_informe_ajenos_dicen_lo_mismo_que_los_inexistentes(
    client, rastro, grupos, tecnico, token_de, equipo, tramos,
):
    propio, ajeno = grupos
    h_aj, h_pr = _alta(client, ajeno.id), _alta(client, propio.id)
    cab = token_de(tecnico)
    ajenos = {
        "idea": _crear(client, h_aj, _completo(equipo))["id"],
        "protocolo": client.post(f"/hce/{h_aj}/protocolo", json=_prot(equipo, "A")).json()["data"]["id"],
        "informe-cierre": client.post(f"/hce/{h_aj}/informe-cierre", json=_ic()).json()["data"]["id"],
    }
    propio_idea = _crear(client, h_pr, _completo(equipo))["id"]
    for modulo, ident in ajenos.items():
        for metodo in ("GET", "PATCH"):
            cuerpo = {} if metodo == "PATCH" else None
            real = client.request(metodo, f"/{modulo}/{ident}", json=cuerpo, headers=cab)
            falso = client.request(metodo, f"/{modulo}/{INEXISTENTE}", json=cuerpo, headers=cab)
            assert real.status_code == falso.status_code == 404, (modulo, metodo)
            assert real.json() == falso.json(), (modulo, metodo, real.json(), falso.json())
    assert client.get(f"/idea/{propio_idea}", headers=cab).status_code == 200  # el par: el propio pasa
    _sin_id_en_los_rechazos(rastro)


def test_un_documento_y_una_foto_de_otro_expediente_dicen_lo_mismo_que_los_inexistentes(client, rastro, categorias, hoy):
    h1, h2 = _hce(client), _hce(client)
    doc = _subir_doc(client, h1, categorias[AUTORIZACION]).json()["data"]["id"]
    foto = _subir_foto(client, f"/hce/{h1}/fotos").json()["data"]["id"]
    for ruta, ident in (("documentos", doc), ("fotos", foto)):
        propio = client.get(f"/hce/{h1}/{ruta}/{ident}")
        ajeno = client.get(f"/hce/{h2}/{ruta}/{ident}")
        falso = client.get(f"/hce/{h2}/{ruta}/{INEXISTENTE}")
        assert propio.status_code == 200
        assert ajeno.status_code == falso.status_code == 404 and ajeno.json() == falso.json(), ruta
    _sin_id_en_los_rechazos(rastro)


def _altas_unicas(equipo):
    """(ruta del alta, cuerpo): lo que se registra una sola vez por expediente (o por año)."""
    return [
        ("consentimiento", {"firmante": "Marta R.", "fecha": "2026-03-02"}),
        ("idea", _completo(equipo)),
        ("protocolo", _prot(equipo, "A")),
        ("informe-cierre", _ic()),
        ("valoracion-funcional", {
            "estado": "Vigente", "fecha": "2025-11-10", "organismo": "MIDES", "pct": 58, "dominios": {"comunicacion": "Apoyo frecuente"},
        }),
        ("severidad", SEV),
        ("organismos/inau", INAU),
        ("organismos/bps", BPS),
        ("inclusion", FICHA),
        ("autorizacion-imagen", {"registrada": True}),
    ]


def test_el_alta_repetida_es_409_y_la_primera_es_201_y_ningun_texto_lleva_el_id(
    client, db_api, rastro, equipo, tramos, niveles, baremo, estados,
):
    for ruta, cuerpo in _altas_unicas(equipo):
        hid = _hce(client)
        primera = client.post(f"/hce/{hid}/{ruta}", json=cuerpo)
        assert primera.status_code == 201, (ruta, primera.text)
        segunda = client.post(f"/hce/{hid}/{ruta}", json=cuerpo)
        assert segunda.status_code == 409, (ruta, segunda.text)
    _sin_id_en_los_rechazos(rastro)
    _sin_id_en_la_auditoria(db_api)


def test_lo_que_no_esta_registrado_es_404_sin_id_y_registrado_es_200(client, rastro, equipo, niveles, baremo, estados):
    altas = dict(_altas_unicas(equipo))
    for ruta in ("consentimiento", "valoracion-funcional", "severidad", "organismos/inau", "organismos/bps", "inclusion", "autorizacion-imagen"):
        vacio, lleno = _hce(client), _hce(client)
        # los vínculos con INAU y BPS no tienen GET propio: se mira con su PATCH
        leer = (lambda hid: client.patch(f"/hce/{hid}/{ruta}", json=altas[ruta])) if ruta.startswith("organismos/")             else (lambda hid: client.get(f"/hce/{hid}/{ruta}"))
        assert leer(vacio).status_code == 404, ruta
        assert client.post(f"/hce/{lleno}/{ruta}", json=altas[ruta]).status_code == 201, ruta
        assert leer(lleno).status_code == 200, ruta
    sin_ficha = _hce(client)
    assert client.patch(f"/hce/{sin_ficha}/inclusion", json={"grado": "4.º año"}).status_code == 404
    assert client.post(f"/hce/{sin_ficha}/inclusion/bitacora", json=GESTION).status_code == 404
    assert _sin_id_en_los_rechazos(rastro) >= 9
    for metodo, url, r in rastro:
        if r.status_code == 404:
            assert all(m.startswith(("Este expediente", "No existe", "El expediente")) for m in _mensajes(r)), (metodo, url, _mensajes(r))


def test_un_idea_firmado_no_se_toca_409_sin_id_y_el_borrador_si(client, rastro, equipo):
    firmado = _firmado(client, _hce(client), equipo)
    borrador = _crear(client, _hce(client), _completo(equipo))["id"]
    assert client.patch(f"/idea/{borrador}", json={"objetivos": "x"}).status_code == 200
    assert client.patch(f"/idea/{firmado}", json={"objetivos": "x"}).status_code == 409
    assert _sin_id_en_los_rechazos(rastro) >= 1


def test_un_profesional_o_un_grupo_inexistente_es_422_sin_id_y_uno_real_pasa(client, rastro, equipo, grupos):
    propio, _ = grupos
    assert client.post(f"/hce/{_hce(client)}/idea", json=_completo(equipo)).status_code == 201
    r = client.post(f"/hce/{_hce(client)}/idea", json={**_completo(equipo), "evaluador_t1_id": INEXISTENTE})
    assert r.status_code == 422 and _mensajes(r) == ["El profesional elegido no existe"]
    assert client.patch(f"/grupos/{propio.id}", json={"tecnico1_id": equipo[0].id}).status_code == 200
    r = client.patch(f"/grupos/{propio.id}", json={"tecnico1_id": INEXISTENTE})
    assert r.status_code == 422 and _mensajes(r) == ["El profesional elegido no existe"]
    r = client.patch(f"/grupos/{INEXISTENTE}", json={})
    assert r.status_code == 404 and _mensajes(r) == ["No existe el grupo"]
    persona = {"nombre": "A", "apellido": "B", "ci": "5512345-1", "fecha_nac": "2016-04-12"}
    r = client.post("/hce", json={"persona": persona, "grupo_id": INEXISTENTE})
    assert r.status_code == 422 and _mensajes(r) == ["No existe el grupo"]
    assert client.post("/hce", json={"persona": persona, "grupo_id": propio.id}).status_code == 201
    assert _sin_id_en_los_rechazos(rastro) >= 4


def test_el_detalle_de_la_auditoria_de_un_grupo_lleva_el_nombre_y_el_anio_y_no_el_id(client, db_api, rastro, grupos, equipo):
    propio, _ = grupos
    assert client.patch(f"/grupos/{propio.id}", json={"tecnico1_id": equipo[0].id}).status_code == 200
    assert _subir_foto(client, f"/grupos/{propio.id}/fotos").status_code == 201
    db_api.expire_all()
    filas = list(db_api.scalars(select(Auditoria).where(Auditoria.modulo == "GRUPO")))
    assert {f.detalle for f in filas} == {f"Grupo {propio.nombre} {propio.anio}", f"Grupo {propio.nombre} {propio.anio} · foto grupal cargada"}
    assert _sin_id_en_la_auditoria(db_api) >= 2
