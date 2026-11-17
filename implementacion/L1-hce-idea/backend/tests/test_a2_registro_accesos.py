"""A2 (§5.178) · el registro de accesos completo: qué fila queda, a quién, cuándo se repite, y quién lo lee.

Sobre **la conexión única de la suite** (`conexion_api`): la sesión del registro es otro SAVEPOINT de esa conexión
(`conftest.sesiones_inyectadas`). Eso prueba *qué* se registra; que sea otra transacción y el candado se prueban con
conexiones reales en `test_a2_registro_real.py` (el porqué, en el docstring de `app/services/registro_accesos.py`).

Todos los pedidos van con **usuarios reales** (`token_de`); el `client` sólo es el transporte. El módulo lleva
`matriz_real`: acá la identidad por omisión tampoco saltea nada. Cada rechazo va con su par que pasa.

- **Tina** (técnica 1) y **Cleo** (coordinación, técnica 2) tratan el grupo **Uno**, el del expediente H.
- **Nico** es técnico de **Dos**: no trata H. **Cora** y **Coti** son coordinación sin grupos.
- **Ada** es administrativa y **Dina**, dirección no técnica.

El tiempo se simula moviendo `inicio` y `vence` de las filas con SQL (la tabla es de sólo inserción para la aplicación).
"""
from datetime import date, datetime, timedelta, timezone
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import event, inspect, select, text

from app.core.constantes import MOTIVO_LABEL_DE_RELACION, MOTIVOS_ACCESO, VENTANA_ACCESO_MINUTOS
from app.main import app
from app.models.acceso import AccesoHce, AccesoIntento
from app.services import matriz
from test_m11_3c_protocolo_ic import equipo, tramos  # noqa: F401  (fixtures)
from test_s1b_ids_no_canonicos import CASOS, RUTAS, _pedir, _registro, _url

pytestmark = pytest.mark.matriz_real

ANIO = date.today().year
CI_DE_H = "5.789.123-4"
CI_OTRA = "1.234.567-8"
_PROHIBIDO = {"code": "forbidden", "detail": [{"campo": None, "mensaje": matriz.MENSAJE_PROHIBIDO}]}


@pytest.fixture
def e(client, db_api, crear_grupo, crear_profesional, hash_test, token_de):
    """El escenario. `c` es el transporte (los pedidos llevan siempre `headers=`); `cab[nombre]`, las cabeceras."""
    p = {
        nombre: crear_profesional(nombre=nombre.capitalize(), email=f"{nombre}@a2.ippu.test", rol=rol, hashed_password=hash_test)
        for nombre, rol in (("tina", "tecnico"), ("nico", "tecnico"), ("cleo", "coordinacion"), ("cora", "coordinacion"),
                            ("coti", "coordinacion"), ("ada", "administrativo"), ("dina", "direccion_nt"))
    }
    uno = crear_grupo(nombre="Uno", tecnico1_id=p["tina"].id, tecnico2_id=p["cleo"].id)
    crear_grupo(nombre="Dos", tecnico1_id=p["nico"].id)
    cab = {nombre: token_de(prof) for nombre, prof in p.items()}
    r = client.post("/hce", headers=cab["tina"], json={"persona": {
        "nombre": "Martín", "apellido": "Rodríguez", "ci": CI_DE_H, "fecha_nac": "2016-04-12"}, "grupo_id": uno.id})
    assert r.status_code == 201, r.text
    return SimpleNamespace(c=client, db=db_api, cab=cab, ids={n: prof.id for n, prof in p.items()}, h=r.json()["data"]["id"],
                           grupo=uno.id)


def _filas(e, nombre: str | None = None) -> list[AccesoHce]:
    e.db.expire_all()
    consulta = select(AccesoHce).order_by(AccesoHce.id)
    if nombre is not None:
        consulta = consulta.where(AccesoHce.usuario_id == e.ids[nombre])
    return list(e.db.scalars(consulta))


def _intentos(e) -> list[AccesoIntento]:
    e.db.expire_all()
    return list(e.db.scalars(select(AccesoIntento).order_by(AccesoIntento.id)))


def _envejecer(e, minutos: int, **donde) -> None:
    """Hace que las filas (todas, o las de un usuario) hayan empezado `minutos` antes: el reloj de la prueba."""
    filtro = " AND usuario_id = :u" if "nombre" in donde else ""
    e.db.execute(
        text(f"UPDATE acceso_hce SET inicio = inicio - make_interval(mins => :m), vence = vence - make_interval(mins => :m) WHERE true{filtro}"),
        {"m": minutos, "u": e.ids.get(donde.get("nombre"))},
    )
    e.db.commit()


def _abrir(e, nombre: str, cuerpo: dict, hce_id: int | None = None):
    return e.c.post(f"/hce/{hce_id or e.h}/accesos", headers=e.cab[nombre], json=cuerpo)


# ── (a) El tratante: una fila por ventana ────────────────────────────────────
def test_el_primer_pedido_del_tratante_deja_una_fila_y_los_siguientes_de_la_ventana_ninguna(e):
    assert _filas(e) == []  # el alta (`POST /hce`) no es una ruta de un expediente: no registra
    assert e.c.get(f"/hce/{e.h}", headers=e.cab["tina"]).status_code == 200
    (fila,) = _filas(e, "tina")
    assert (fila.hce_id, fila.rol, fila.relacion, fila.motivo_codigo, fila.motivo_texto, fila.ateneo_id) == (
        e.h, "tecnico", "tratante", None, None, None)
    assert fila.vence - fila.inicio == timedelta(minutes=VENTANA_ACCESO_MINUTOS) and fila.token_version == 0
    # dentro de la ventana: lecturas, una escritura, otra ruta del expediente → cero filas nuevas
    for metodo, ruta, cuerpo in (("GET", f"/hce/{e.h}", None), ("GET", f"/hce/{e.h}/flujo", None),
                                 ("PATCH", f"/hce/{e.h}", {"derivacion": "Pediatra"}), ("GET", f"/hce/{e.h}/auditoria", None),
                                 ("GET", f"/hce/{e.h}/organismos", None), ("GET", f"/hce/{e.h}/identificacion", None)):
        r = e.c.request(metodo, ruta, headers=e.cab["tina"], json=cuerpo)
        assert r.status_code == 200, (ruta, r.text)
    assert [f.id for f in _filas(e)] == [fila.id]


def test_cuando_la_ventana_vence_el_pedido_siguiente_vuelve_a_registrar(e):
    ruta = f"/hce/{e.h}/flujo"
    assert e.c.get(ruta, headers=e.cab["tina"]).status_code == 200
    _envejecer(e, VENTANA_ACCESO_MINUTOS - 1)  # faltando un minuto todavía es la misma ventana
    assert e.c.get(ruta, headers=e.cab["tina"]).status_code == 200
    assert len(_filas(e, "tina")) == 1
    _envejecer(e, 2)  # ya venció
    assert e.c.get(ruta, headers=e.cab["tina"]).status_code == 200
    assert e.c.get(ruta, headers=e.cab["tina"]).status_code == 200
    vieja, nueva = _filas(e, "tina")
    assert vieja.vence < nueva.inicio and nueva.relacion == "tratante"


def test_la_ventana_solo_vale_con_la_token_version_del_usuario(e):
    """(h) Nada la sube todavía (A3): se sube a mano. Con otra versión, el pedido siguiente registra de nuevo."""
    assert e.c.get(f"/hce/{e.h}", headers=e.cab["tina"]).status_code == 200
    e.db.execute(text("UPDATE profesional SET token_version = 1 WHERE id = :i"), {"i": e.ids["tina"]})
    e.db.commit()
    assert e.c.get(f"/hce/{e.h}", headers=e.cab["tina"]).status_code == 200
    assert e.c.get(f"/hce/{e.h}", headers=e.cab["tina"]).status_code == 200
    assert [f.token_version for f in _filas(e, "tina")] == [0, 1]


def test_dos_expedientes_son_dos_ventanas_y_dos_usuarios_tambien(e):
    otro = e.c.post("/hce", headers=e.cab["tina"], json={"persona": {
        "nombre": "Otra", "apellido": "NNA", "ci": "4.333.333-3", "fecha_nac": "2016-01-01"}, "grupo_id": e.grupo}).json()["data"]["id"]
    for hce in (e.h, otro, e.h, otro):
        assert e.c.get(f"/hce/{hce}", headers=e.cab["tina"]).status_code == 200
    assert e.c.get(f"/hce/{e.h}", headers=e.cab["cleo"]).status_code == 200
    assert sorted((f.usuario_id, f.hce_id) for f in _filas(e)) == sorted(
        [(e.ids["tina"], e.h), (e.ids["tina"], otro), (e.ids["cleo"], e.h)])


# ── Listas y agregados; 401, 403 y 404 ───────────────────────────────────────
def test_las_listas_y_los_agregados_no_registran_y_abrir_el_expediente_si(e):
    for ruta in ("/hce", "/hce?nombre=Mart", "/inclusion", "/ateneos", "/panel", "/grupos", "/ateneos/indicador"):
        for nombre in ("tina", "cleo", "cora"):
            assert e.c.get(ruta, headers=e.cab[nombre]).status_code == 200, (ruta, nombre)
    assert e.c.get("/panel", headers=e.cab["dina"]).status_code == 200
    assert e.c.get("/hce", headers=e.cab["ada"]).status_code == 200
    assert e.c.post("/hce/consulta", headers=e.cab["tina"], json={"ci": CI_DE_H}).status_code == 200
    assert _filas(e) == []
    assert e.c.get(f"/hce/{e.h}", headers=e.cab["tina"]).status_code == 200  # el par
    assert len(_filas(e)) == 1


def test_un_pedido_que_termina_en_401_403_o_404_no_registra(e):
    assert e.c.get(f"/hce/{e.h}", headers={"Authorization": "Bearer no-es-un-token"}).status_code == 401
    r = e.c.get(f"/hce/{e.h}", headers=e.cab["nico"])  # técnico no tratante sin ventana
    assert (r.status_code, r.json()["code"]) == (403, "reason_required")
    r = e.c.patch(f"/hce/{e.h}", headers=e.cab["nico"], json={"derivacion": "x"})
    assert (r.status_code, r.json()) == (403, _PROHIBIDO)
    for ruta in (f"/hce/{e.h}", f"/hce/{e.h}/identificacion", f"/hce/{e.h}/organismos", "/hce/999999"):
        r = e.c.get(ruta, headers=e.cab["dina"])  # dirección no técnica: 403 exista o no
        assert (r.status_code, r.json()) == (403, _PROHIBIDO), ruta
    assert e.c.get("/hce/999999", headers=e.cab["tina"]).status_code == 404
    assert e.c.get("/hce/999999/identificacion", headers=e.cab["ada"]).status_code == 404
    assert e.c.get("/idea/999999", headers=e.cab["tina"]).status_code == 404
    assert _filas(e) == []
    assert e.c.get(f"/hce/{e.h}", headers=e.cab["tina"]).status_code == 200  # el par: quien pasa, registra
    assert [f.relacion for f in _filas(e)] == ["tratante"]


def test_el_no_tratante_con_ventana_deja_la_fila_del_post_y_ninguna_automatica(e):
    assert _abrir(e, "nico", {"motivo_codigo": "interconsulta", "ci": CI_DE_H}).status_code == 201
    for ruta in (f"/hce/{e.h}", f"/hce/{e.h}/flujo", f"/hce/{e.h}/identificacion", f"/hce/{e.h}/organismos"):
        assert e.c.get(ruta, headers=e.cab["nico"]).status_code == 200, ruta
    assert [(f.relacion, f.motivo_codigo) for f in _filas(e, "nico")] == [("no_tratante", "interconsulta")]


# ── Gestión: administrativo y coordinación en la identificación y ORG ────────
def test_administrativo_en_lo_clinico_es_403_sin_fila_y_en_identificacion_u_org_deja_una_de_gestion(e):
    for ruta in (f"/hce/{e.h}", f"/hce/{e.h}/flujo", f"/hce/{e.h}/auditoria"):
        r = e.c.get(ruta, headers=e.cab["ada"])
        assert (r.status_code, r.json()) == (403, _PROHIBIDO), ruta
    assert _filas(e) == []
    assert e.c.get(f"/hce/{e.h}/identificacion", headers=e.cab["ada"]).status_code == 200
    (fila,) = _filas(e, "ada")
    assert (fila.relacion, fila.rol, fila.motivo_codigo, fila.hce_id) == ("gestion", "administrativo", None, e.h)
    assert fila.vence - fila.inicio == timedelta(minutes=VENTANA_ACCESO_MINUTOS)
    # la misma ventana cubre ORG y la edición de la identificación
    assert e.c.get(f"/hce/{e.h}/organismos", headers=e.cab["ada"]).status_code == 200
    r = e.c.patch(f"/hce/{e.h}/identificacion", headers=e.cab["ada"], json={"persona": {"telefono": "099 111 222"}})
    assert r.status_code == 200, r.text
    assert len(_filas(e)) == 1


def test_administrativo_que_entra_por_org_tambien_deja_su_fila_de_gestion(e):
    assert e.c.get(f"/hce/{e.h}/organismos", headers=e.cab["ada"]).status_code == 200
    assert [(f.relacion, f.rol) for f in _filas(e)] == [("gestion", "administrativo")]


def test_una_fila_de_gestion_no_abre_lo_clinico(e):
    assert e.c.get(f"/hce/{e.h}/identificacion", headers=e.cab["cora"]).status_code == 200
    assert [(f.relacion, f.rol) for f in _filas(e, "cora")] == [("gestion", "coordinacion")]
    r = e.c.get(f"/hce/{e.h}", headers=e.cab["cora"])
    assert (r.status_code, r.json()["code"]) == (403, "reason_required")


# ── Coordinación: asignada al grupo es tratante; sin asignar, su fila es la del POST ──
def test_la_coordinacion_asignada_a_un_grupo_deja_una_fila_tratante_con_rol_coordinacion(e):
    """Hallazgo 5 de la auditoría del 2026-11-13: trata al grupo, así que no pide motivo… y tiene que quedar registrada."""
    for ruta in (f"/hce/{e.h}", f"/hce/{e.h}/identificacion", f"/hce/{e.h}/auditoria"):
        assert e.c.get(ruta, headers=e.cab["cleo"]).status_code == 200, ruta
    (fila,) = _filas(e, "cleo")
    assert (fila.relacion, fila.rol, fila.motivo_codigo) == ("tratante", "coordinacion", None)


def test_la_coordinacion_sin_asignar_con_motivo_deja_la_fila_del_post_y_ninguna_automatica(e):
    r = e.c.get(f"/hce/{e.h}", headers=e.cab["cora"])
    assert (r.status_code, r.json()["code"]) == (403, "reason_required") and _filas(e) == []
    assert _abrir(e, "cora", {"motivo_codigo": "supervision"}).status_code == 201
    # con su ventana: lo clínico, la auditoría, ORG y la identificación (que sin ventana sería gestión) → ninguna fila más
    for ruta in (f"/hce/{e.h}", f"/hce/{e.h}/auditoria", f"/hce/{e.h}/organismos", f"/hce/{e.h}/identificacion"):
        assert e.c.get(ruta, headers=e.cab["cora"]).status_code == 200, ruta
    assert [(f.relacion, f.motivo_codigo, f.rol) for f in _filas(e, "cora")] == [("supervision", "supervision", "coordinacion")]
    # el par: otra coordinación sin ventana, en la identificación, sí deja su fila de gestión
    assert e.c.get(f"/hce/{e.h}/identificacion", headers=e.cab["coti"]).status_code == 200
    assert [f.relacion for f in _filas(e, "coti")] == ["gestion"]


# ── Las 14 rutas por id de módulo registran como las /hce/{hce_id} ───────────
@pytest.mark.parametrize("metodo,plantilla", RUTAS, ids=[f"{m} {p}" for m, p in RUTAS])
def test_cada_ruta_por_id_de_modulo_registra_como_las_del_expediente(e, equipo, tramos, metodo, plantilla):  # noqa: F811
    estado, cuerpo, esperado = CASOS[(metodo, plantilla)]
    del_tratante = SimpleNamespace(client=TestClient(app, headers=e.cab["tina"]), equipo=equipo, hce=e.h)
    ident = _registro(del_tratante, plantilla, estado)  # armarlo ya registró a Tina (son rutas /hce/{hce_id}/…)
    assert len(_filas(e, "tina")) == 1
    _envejecer(e, VENTANA_ACCESO_MINUTOS + 1)  # …así que se deja vencer esa ventana

    # quien no puede abrir el expediente no registra por esta ruta tampoco
    for nombre in ("nico", "ada", "dina", "cora"):
        assert _pedir(del_tratante, metodo, _url(plantilla, ident), e.cab[nombre], cuerpo).status_code == 403, nombre
    assert _pedir(del_tratante, metodo, _url(plantilla, 999999), e.cab["tina"], cuerpo).status_code == 404
    assert len(_filas(e)) == 1

    r = _pedir(del_tratante, metodo, _url(plantilla, ident), e.cab["tina"], cuerpo)
    assert r.status_code == esperado, r.text
    vieja, nueva = _filas(e, "tina")
    assert (nueva.hce_id, nueva.relacion, nueva.rol, nueva.motivo_codigo) == (e.h, "tratante", "tecnico", None)
    assert nueva.vence - nueva.inicio == timedelta(minutes=VENTANA_ACCESO_MINUTOS)
    # y la ventana que abrió vale para las rutas del expediente (y al revés: es la misma)
    assert e.c.get(f"/hce/{e.h}", headers=e.cab["tina"]).status_code == 200
    assert len(_filas(e)) == 2


def test_la_coordinacion_asignada_registra_por_una_ruta_por_id_de_modulo(e):
    idea = e.c.post(f"/hce/{e.h}/idea", headers=e.cab["tina"], json={"anio": ANIO}).json()["data"]["id"]
    assert e.c.get(f"/idea/{idea}", headers=e.cab["cleo"]).status_code == 200
    assert [(f.relacion, f.rol) for f in _filas(e, "cleo")] == [("tratante", "coordinacion")]


# ── (c) El ateneo clínico ────────────────────────────────────────────────────
@pytest.fixture
def ateneos(e):
    def _crear(cuerpo):
        r = e.c.post("/ateneos", headers=e.cab["tina"], json={"fecha": f"{ANIO}-09-18", **cuerpo})
        assert r.status_code == 201, r.text
        return r.json()["data"]["id"]

    clinico = _crear({"tipo": "clinico", "titulo": "Ateneo de Martín", "hce_referida_id": e.h, "grupo_id": e.grupo,
                      "situacion": "Meseta en las transiciones."})
    return SimpleNamespace(clinico=clinico, otro=_crear({"tipo": "institucional", "titulo": "Ateneo institucional"}))


def test_abrir_un_ateneo_clinico_sin_tratar_el_expediente_deja_una_fila_sin_ventana(e, ateneos):
    assert _filas(e) == []  # registrarlo (`POST /ateneos`) y listarlos no deja nada
    assert e.c.get("/ateneos", headers=e.cab["cora"]).status_code == 200
    assert _filas(e) == []
    assert e.c.get(f"/ateneos/{ateneos.clinico}", headers=e.cab["cora"]).status_code == 200
    (fila,) = _filas(e, "cora")
    assert (fila.hce_id, fila.ateneo_id, fila.motivo_codigo, fila.relacion, fila.rol) == (
        e.h, ateneos.clinico, "ateneo", "supervision", "coordinacion")
    assert fila.vence == fila.inicio  # no es una ventana…
    r = e.c.get(f"/hce/{e.h}", headers=e.cab["cora"])  # …así que el expediente sigue pidiendo el motivo
    assert (r.status_code, r.json()["code"]) == (403, "reason_required")
    r = e.c.get(f"/hce/{e.h}/auditoria", headers=e.cab["cora"])
    assert (r.status_code, r.json()["code"]) == (403, "reason_required")


def test_la_fila_del_ateneo_se_deduplica_por_usuario_y_ateneo_dentro_de_120_minutos(e, ateneos):
    a = ateneos.clinico
    for metodo, ruta, cuerpo in (("GET", f"/ateneos/{a}", None), ("GET", f"/ateneos/{a}/documentos", None),
                                 ("PATCH", f"/ateneos/{a}", {"seguimiento": "Revisar en marzo."}),
                                 ("POST", f"/ateneos/{a}/acuerdos", {"acuerdo": "Revisar en marzo."})):
        r = e.c.request(metodo, ruta, headers=e.cab["cora"], json=cuerpo)
        assert r.status_code in (200, 201), (ruta, r.text)
    assert len(_filas(e, "cora")) == 1
    assert e.c.get(f"/ateneos/{a}", headers=e.cab["coti"]).status_code == 200  # otro usuario: su propia fila
    assert len(_filas(e, "coti")) == 1
    _envejecer(e, VENTANA_ACCESO_MINUTOS - 1)
    assert e.c.get(f"/ateneos/{a}", headers=e.cab["cora"]).status_code == 200
    assert len(_filas(e, "cora")) == 1
    _envejecer(e, 2)
    assert e.c.get(f"/ateneos/{a}", headers=e.cab["cora"]).status_code == 200
    assert e.c.get(f"/ateneos/{a}", headers=e.cab["cora"]).status_code == 200
    assert [(f.motivo_codigo, f.ateneo_id) for f in _filas(e, "cora")] == [("ateneo", a), ("ateneo", a)]


def test_el_tratante_y_un_ateneo_no_clinico_no_dejan_fila_de_ateneo(e, ateneos):
    assert e.c.get(f"/ateneos/{ateneos.clinico}", headers=e.cab["tina"]).status_code == 200  # trata el expediente referido
    assert e.c.get(f"/ateneos/{ateneos.clinico}", headers=e.cab["cleo"]).status_code == 200  # coordinación asignada: ídem
    for nombre in ("cora", "nico", "tina"):
        assert e.c.get(f"/ateneos/{ateneos.otro}", headers=e.cab[nombre]).status_code == 200
    assert _filas(e) == []


def test_el_tecnico_no_tratante_abre_el_clinico_solo_con_su_ventana_y_deja_la_fila_del_ateneo(e, ateneos):
    r = e.c.get(f"/ateneos/{ateneos.clinico}", headers=e.cab["nico"])
    assert r.status_code == 404 and _filas(e) == []  # sin ventana ni lo ve: nada que registrar
    assert _abrir(e, "nico", {"motivo_codigo": "interconsulta", "ci": CI_DE_H}).status_code == 201
    assert e.c.get(f"/ateneos/{ateneos.clinico}", headers=e.cab["nico"]).status_code == 200
    assert [(f.relacion, f.motivo_codigo, f.ateneo_id) for f in _filas(e, "nico")] == [
        ("no_tratante", "interconsulta", None), ("no_tratante", "ateneo", ateneos.clinico)]
    for nombre in ("ada", "dina"):  # sin ateneos por rol: 403 y nada
        assert e.c.get(f"/ateneos/{ateneos.clinico}", headers=e.cab[nombre]).status_code == 403
    assert len(_filas(e)) == 2


# ── (e) Los intentos ─────────────────────────────────────────────────────────
def test_una_consulta_que_encuentra_una_que_no_y_una_ci_equivocada_dejan_un_intento_cada_una(e):
    assert e.c.post("/hce/consulta", headers=e.cab["nico"], json={"ci": CI_DE_H}).status_code == 200
    assert e.c.post("/hce/consulta", headers=e.cab["nico"], json={"ci": CI_OTRA}).status_code == 404
    equivocada = _abrir(e, "nico", {"motivo_codigo": "interconsulta", "ci": CI_OTRA})
    assert equivocada.status_code == 404
    assert [(i.usuario_id, i.rol, i.tipo, i.resultado, i.hce_id) for i in _intentos(e)] == [
        (e.ids["nico"], "tecnico", "consulta_ci", "encontrado", e.h),
        (e.ids["nico"], "tecnico", "consulta_ci", "no_encontrado", None),
        (e.ids["nico"], "tecnico", "ci_errada", "rechazado", e.h),
    ]
    assert _filas(e) == []  # ninguno abrió nada: el registro de accesos sigue vacío

    # el 404 de la C.I. equivocada es, byte por byte, el de un id que no existe (§5.174 a) — y ése no es un intento
    inexistente = _abrir(e, "nico", {"motivo_codigo": "interconsulta", "ci": CI_OTRA}, hce_id=999999)
    assert (equivocada.status_code, equivocada.content) == (inexistente.status_code, inexistente.content)
    assert equivocada.headers["content-type"] == inexistente.headers["content-type"]
    assert len(_intentos(e)) == 3


def test_la_ci_escrita_no_esta_en_ninguna_parte_de_la_fila(e):
    for ci in (CI_DE_H, CI_OTRA):
        e.c.post("/hce/consulta", headers=e.cab["nico"], json={"ci": ci})
        _abrir(e, "nico", {"motivo_codigo": "interconsulta", "ci": ci})
    assert {c["name"] for c in inspect(e.db.connection()).get_columns("acceso_intento")} == {
        "id", "usuario_id", "rol", "tipo", "hce_id", "resultado", "momento"}
    volcado = " ".join(str(v) for fila in e.db.execute(text("SELECT * FROM acceso_intento")) for v in fila)
    for digitos in ("5789123", "57891234", "1234567", "12345678", "5.789", "1.234"):
        assert digitos not in volcado, digitos
    # ni en lo que lee coordinación
    r = e.c.get("/accesos/intentos", headers=e.cab["cora"])
    assert r.status_code == 200 and len(r.json()) == 3  # dos consultas y una C.I. equivocada (la correcta abrió)
    assert all(set(fila) == {"id", "usuario", "rol", "tipo", "hce_id", "resultado", "momento"} for fila in r.json())
    assert "5789" not in r.text and "1234567" not in r.text


def test_lo_que_no_llega_a_consultar_ni_a_comparar_no_es_un_intento_y_la_ci_correcta_tampoco(e):
    assert e.c.post("/hce/consulta", headers=e.cab["nico"], json={"ci": "   "}).status_code == 422
    assert e.c.post("/hce/consulta", headers=e.cab["dina"], json={"ci": CI_DE_H}).status_code == 403
    assert _abrir(e, "nico", {"motivo_codigo": "no-existe", "ci": CI_OTRA}).status_code == 422  # no se comparó (§5.174)
    assert _abrir(e, "cora", {"motivo_codigo": "supervision", "ci": CI_OTRA}).status_code == 201  # coordinación no manda C.I.
    assert _abrir(e, "nico", {"motivo_codigo": "interconsulta", "ci": CI_DE_H}).status_code == 201
    assert _intentos(e) == []
    assert e.c.post("/hce/consulta", headers=e.cab["ada"], json={"ci": CI_DE_H}).status_code == 200  # el par
    assert [(i.rol, i.resultado) for i in _intentos(e)] == [("administrativo", "encontrado")]


# ── (d) Los lectores: cada ruta por cada rol ─────────────────────────────────
_LECTORES = ("/hce/{h}/accesos", "/accesos", "/accesos/intentos")


@pytest.mark.parametrize("plantilla", _LECTORES)
def test_el_registro_lo_lee_solo_coordinacion_sin_motivo_y_los_demas_reciben_403(e, plantilla):
    ruta = plantilla.format(h=e.h)
    for nombre in ("tina", "nico", "ada", "dina"):  # técnico tratante y no tratante, administrativo, dirección NT
        r = e.c.get(ruta, headers=e.cab[nombre])
        assert (r.status_code, r.json()) == (403, _PROHIBIDO), nombre
        r = e.c.get(plantilla.format(h=999999), headers=e.cab[nombre])  # el rol, antes que la existencia
        assert (r.status_code, r.json()) == (403, _PROHIBIDO), nombre
    for nombre in ("cora", "cleo"):  # coordinación: sin asignar y asignada al grupo, las dos sin motivo
        r = e.c.get(ruta, headers=e.cab[nombre])
        assert r.status_code == 200 and r.json() == [] and r.headers["X-Total-Count"] == "0", (nombre, r.text)
    assert TestClient(app).get(ruta).status_code == 401  # sin token (un cliente sin la cabecera por omisión)
    assert _filas(e) == []  # leer el registro no deja fila (ni a Cleo, que trata el expediente)


def test_el_registro_de_un_expediente_que_no_existe_es_404_para_coordinacion(e):
    r = e.c.get("/hce/999999/accesos", headers=e.cab["cora"])
    assert (r.status_code, r.json()["code"]) == (404, "not_found")
    assert e.c.get(f"/hce/{e.h}/accesos", headers=e.cab["cora"]).status_code == 200


_CLAVES = {"id", "hce_id", "usuario", "rol", "relacion", "motivo_codigo", "motivo_label", "motivo_texto", "inicio", "vence",
           "ateneo_id"}


def _historia(e, ateneos) -> None:
    """Una fila de cada clase sobre H: tratante (Tina), gestión (Ada), supervisión (Cora), no tratante (Nico), la copia
    a la familia (Tina, `titular`) y un ateneo clínico (Coti)."""
    assert e.c.get(f"/hce/{e.h}", headers=e.cab["tina"]).status_code == 200
    assert e.c.get(f"/hce/{e.h}/identificacion", headers=e.cab["ada"]).status_code == 200
    assert _abrir(e, "cora", {"motivo_codigo": "supervision", "motivo_texto": "Revisión semestral"}).status_code == 201
    assert _abrir(e, "nico", {"motivo_codigo": "interconsulta", "ci": CI_DE_H}).status_code == 201
    assert _abrir(e, "tina", {"motivo_codigo": "copia_familia", "motivo_texto": "A la madre: el IC del año."}).status_code == 201
    assert e.c.get(f"/ateneos/{ateneos.clinico}", headers=e.cab["coti"]).status_code == 200


def test_cada_fila_dice_quien_con_que_rol_por_que_y_cuando_y_nada_clinico(e, ateneos):
    _historia(e, ateneos)
    r = e.c.get(f"/hce/{e.h}/accesos", headers=e.cab["cora"])
    assert r.status_code == 200 and r.headers["X-Total-Count"] == "6"
    filas = r.json()
    assert all(set(f) == _CLAVES and set(f["usuario"]) == {"id", "nombre"} and f["hce_id"] == e.h for f in filas)
    por_relacion = {(f["relacion"], f["motivo_codigo"]): f for f in filas}

    tratante = por_relacion[("tratante", None)]  # (b): el motivo fijo es un rótulo del servidor, no un valor guardado
    assert (tratante["usuario"], tratante["rol"], tratante["motivo_label"], tratante["motivo_texto"], tratante["ateneo_id"]) == (
        {"id": e.ids["tina"], "nombre": "Tina"}, "tecnico", "Atención directa (tratante)", None, None)
    gestion = por_relacion[("gestion", None)]
    assert (gestion["usuario"]["nombre"], gestion["rol"], gestion["motivo_label"]) == (
        "Ada", "administrativo", "Gestión (identificación y organismos)")
    assert MOTIVO_LABEL_DE_RELACION == {"tratante": tratante["motivo_label"], "gestion": gestion["motivo_label"]}

    supervision = por_relacion[("supervision", "supervision")]
    assert (supervision["motivo_label"], supervision["motivo_texto"], supervision["rol"]) == (
        "Supervisión clínica", "Revisión semestral", "coordinacion")
    assert por_relacion[("no_tratante", "interconsulta")]["motivo_label"] == "Interconsulta"
    # la copia de la HC a la familia se ve acá (§5.103): del titular, sin ventana, con quien la entregó
    copia = por_relacion[("titular", "copia_familia")]
    assert (copia["usuario"]["nombre"], copia["motivo_label"], copia["motivo_texto"]) == (
        "Tina", "Copia de la HC entregada a la familia", "A la madre: el IC del año.")
    assert copia["vence"] == copia["inicio"]
    ateneo = por_relacion[("supervision", "ateneo")]
    assert (ateneo["ateneo_id"], ateneo["motivo_label"], ateneo["usuario"]["nombre"]) == (ateneos.clinico, "Ateneo clínico", "Coti")
    assert ateneo["vence"] == ateneo["inicio"]
    dur = datetime.fromisoformat(tratante["vence"]) - datetime.fromisoformat(tratante["inicio"])
    assert dur == timedelta(minutes=VENTANA_ACCESO_MINUTOS)
    assert all(f["motivo_label"] for f in filas)  # toda fila lleva su motivo para leer
    assert "Martín" not in r.text and "Rodríguez" not in r.text and "5789" not in r.text  # ni el nombre ni la C.I. del NNA
    # la más nueva primero
    assert [f["id"] for f in filas] == sorted((f["id"] for f in filas), reverse=True)


def test_la_respuesta_del_post_no_cambia_de_forma_y_lleva_el_rotulo(e):
    d = _abrir(e, "cora", {"motivo_codigo": "supervision"}).json()
    assert set(d) == {"data", "warnings"}
    assert set(d["data"]) == {"id", "hce_id", "relacion", "motivo_codigo", "motivo_label", "motivo_texto", "inicio", "vence"}
    assert d["data"]["motivo_label"] == MOTIVOS_ACCESO["supervision"]["label"]


def _iso(momento: datetime) -> str:
    return momento.astimezone(timezone.utc).isoformat()


def test_los_filtros_del_registro_institucional_se_combinan(e, ateneos):
    _historia(e, ateneos)
    otro = e.c.post("/hce", headers=e.cab["tina"], json={"persona": {
        "nombre": "Otra", "apellido": "NNA", "ci": "4.333.333-3", "fecha_nac": "2016-01-01"}, "grupo_id": e.grupo}).json()["data"]["id"]
    assert e.c.get(f"/hce/{otro}", headers=e.cab["tina"]).status_code == 200
    cab = e.cab["cora"]

    def ids(**params) -> list[int]:
        r = e.c.get("/accesos", headers=cab, params=params)
        assert r.status_code == 200, r.text
        assert r.headers["X-Total-Count"] == str(len(r.json()))
        return [f["id"] for f in r.json()]

    todas = {f.id: f for f in _filas(e)}
    assert len(todas) == 7 and ids() == sorted(todas, reverse=True)
    assert ids(hce_id=otro) == [f.id for f in todas.values() if f.hce_id == otro] != []
    assert set(ids(usuario_id=e.ids["tina"])) == {f.id for f in todas.values() if f.usuario_id == e.ids["tina"]}
    assert len(ids(usuario_id=e.ids["tina"])) == 3  # H, la copia y el otro expediente
    assert len(ids(usuario_id=e.ids["tina"], hce_id=e.h)) == 2
    assert len(ids(usuario_id=e.ids["tina"], hce_id=e.h, relacion="titular")) == 1
    for relacion, cuantas in (("tratante", 2), ("gestion", 1), ("supervision", 2), ("no_tratante", 1), ("titular", 1)):
        assert len(ids(relacion=relacion)) == cuantas, relacion
    for motivo, cuantas in (("supervision", 1), ("interconsulta", 1), ("copia_familia", 1), ("ateneo", 1), ("otro", 0)):
        assert len(ids(motivo=motivo)) == cuantas, motivo
    assert ids(relacion="tratante", motivo="supervision") == []  # se combinan con Y

    # el período, sobre `inicio`: `desde` incluido, `hasta` excluido. La fila de Ada pasa a ser de hace 10 días.
    e.db.execute(text("UPDATE acceso_hce SET inicio = inicio - interval '10 days', vence = vence - interval '10 days' "
                      "WHERE usuario_id = :u"), {"u": e.ids["ada"]})
    e.db.commit()
    de_ada = next(f for f in _filas(e) if f.usuario_id == e.ids["ada"])
    ahora = e.db.scalar(text("SELECT now()"))
    assert len(ids(desde=_iso(ahora - timedelta(days=1)))) == 6
    assert ids(hasta=_iso(ahora - timedelta(days=1))) == [de_ada.id]
    assert ids(desde=_iso(de_ada.inicio), hasta=_iso(de_ada.inicio + timedelta(seconds=1))) == [de_ada.id]
    assert ids(desde=_iso(ahora - timedelta(days=11)), hasta=_iso(de_ada.inicio)) == []  # `hasta` es excluyente
    assert len(ids(desde=_iso(ahora - timedelta(days=11)), hasta=_iso(ahora + timedelta(days=1)))) == 7
    # y en el de un expediente, los mismos filtros (menos el expediente)
    r = e.c.get(f"/hce/{e.h}/accesos", headers=cab, params={"relacion": "tratante", "usuario_id": e.ids["tina"]})
    assert r.status_code == 200 and len(r.json()) == 1 and r.headers["X-Total-Count"] == "1"


@pytest.mark.parametrize("plantilla", ["/accesos", "/hce/{h}/accesos"])
def test_un_filtro_fuera_de_sus_valores_es_422_por_campo_y_los_validos_pasan(e, plantilla):
    ruta, cab = plantilla.format(h=e.h), e.cab["cora"]
    r = e.c.get(ruta, headers=cab, params={"relacion": "curioso", "motivo": "porque-si"})
    assert r.status_code == 422 and [d["campo"] for d in r.json()["detail"]] == ["relacion", "motivo"]
    assert e.c.get(ruta, headers=cab, params={"desde": "2026-07-01T00:00:00"}).status_code == 422  # sin zona horaria
    assert e.c.get(ruta, headers=cab, params={"hasta": "ayer"}).status_code == 422
    for malo in ({"limit": 0}, {"limit": 201}, {"offset": -1}, {"usuario_id": 0}):
        assert e.c.get(ruta, headers=cab, params=malo).status_code == 422, malo
    bueno = {"relacion": "tratante", "motivo": "supervision", "desde": "2026-07-01T00:00:00-03:00",
             "hasta": "2027-01-01T00:00:00+00:00", "limit": 200, "offset": 0, "usuario_id": e.ids["tina"]}
    assert e.c.get(ruta, headers=cab, params=bueno).status_code == 200


@pytest.mark.parametrize("plantilla", ["/accesos", "/hce/{h}/accesos"])
def test_el_registro_se_pagina_como_la_auditoria(e, ateneos, plantilla):
    _historia(e, ateneos)
    ruta, cab = plantilla.format(h=e.h), e.cab["cora"]
    todas = [f.id for f in reversed(_filas(e))]
    assert len(todas) == 6
    paginas = []
    for offset in (0, 2, 4, 6):
        r = e.c.get(ruta, headers=cab, params={"limit": 2, "offset": offset})
        assert r.status_code == 200 and r.headers["X-Total-Count"] == "6"  # el total, no el de la página
        paginas.append([f["id"] for f in r.json()])
    assert paginas == [todas[0:2], todas[2:4], todas[4:6], []]
    assert "X-Total-Count" in e.c.get(ruta, headers=cab).headers
    assert len(e.c.get(ruta, headers=cab).json()) == 6  # 50 por omisión


def test_los_intentos_se_filtran_por_usuario_periodo_y_tipo_y_se_paginan(e):
    for nombre, ci in (("nico", CI_DE_H), ("nico", CI_OTRA), ("ada", CI_DE_H), ("tina", CI_OTRA)):
        e.c.post("/hce/consulta", headers=e.cab[nombre], json={"ci": ci})
    assert _abrir(e, "nico", {"motivo_codigo": "interconsulta", "ci": CI_OTRA}).status_code == 404
    cab = e.cab["coti"]

    def filas(**params) -> list[dict]:
        r = e.c.get("/accesos/intentos", headers=cab, params=params)
        assert r.status_code == 200, r.text
        return r.json()

    todos = filas()
    assert [f["id"] for f in todos] == [i.id for i in reversed(_intentos(e))] and len(todos) == 5
    assert todos[0] == {"id": todos[0]["id"], "usuario": {"id": e.ids["nico"], "nombre": "Nico"}, "rol": "tecnico",
                        "tipo": "ci_errada", "hce_id": e.h, "resultado": "rechazado", "momento": todos[0]["momento"]}
    assert len(filas(usuario_id=e.ids["nico"])) == 3 and len(filas(usuario_id=e.ids["ada"])) == 1
    assert len(filas(tipo="consulta_ci")) == 4 and len(filas(tipo="ci_errada")) == 1
    assert len(filas(tipo="consulta_ci", usuario_id=e.ids["nico"])) == 2
    assert [f["resultado"] for f in filas(usuario_id=e.ids["tina"])] == ["no_encontrado"]
    r = e.c.get("/accesos/intentos", headers=cab, params={"tipo": "adivinanza"})
    assert r.status_code == 422 and [d["campo"] for d in r.json()["detail"]] == ["tipo"]
    assert e.c.get("/accesos/intentos", headers=cab, params={"desde": "2026-07-01"}).status_code == 422
    # período: el intento de Ada pasa a ser de hace 10 días
    e.db.execute(text("UPDATE acceso_intento SET momento = momento - interval '10 days' WHERE usuario_id = :u"), {"u": e.ids["ada"]})
    e.db.commit()
    ahora = e.db.scalar(text("SELECT now()"))
    assert len(filas(desde=_iso(ahora - timedelta(days=1)))) == 4
    assert [f["usuario"]["nombre"] for f in filas(hasta=_iso(ahora - timedelta(days=1)))] == ["Ada"]
    # paginado
    r = e.c.get("/accesos/intentos", headers=cab, params={"limit": 2, "offset": 2})
    assert r.headers["X-Total-Count"] == "5" and len(r.json()) == 2


# ── Costo ────────────────────────────────────────────────────────────────────
def _consultas(conexion, llamada) -> list[str]:
    sentencias: list[str] = []

    def _anota(conn, cursor, statement, parameters, context, executemany):
        sentencias.append(statement)

    event.listen(conexion, "before_cursor_execute", _anota)
    try:
        assert llamada().status_code == 200
    finally:
        event.remove(conexion, "before_cursor_execute", _anota)
    return sentencias


@pytest.mark.parametrize("ruta", ["/hce/{h}", "/hce/{h}/flujo", "/idea/{idea}"])
def test_dentro_de_su_ventana_un_pedido_del_tratante_agrega_una_sola_consulta(e, conexion_api, monkeypatch, ruta):
    idea = e.c.post(f"/hce/{e.h}/idea", headers=e.cab["tina"], json={"anio": ANIO}).json()["data"]["id"]
    ruta = ruta.format(h=e.h, idea=idea)
    pedir = lambda: e.c.get(ruta, headers=e.cab["tina"])  # noqa: E731
    assert pedir().status_code == 200 and len(_filas(e, "tina")) == 1  # la ventana ya está abierta
    con_registro = _consultas(conexion_api, pedir)
    with monkeypatch.context() as m:  # el mismo pedido, sin el registro automático
        m.setattr(matriz, "registro_al_abrir", lambda *a, **k: None)
        sin_registro = _consultas(conexion_api, pedir)
    de_mas = [s for s in con_registro if "acceso_hce" in s]
    assert len(con_registro) - len(sin_registro) == 1, (len(con_registro), len(sin_registro))
    assert len(de_mas) == 1 and de_mas[0].lstrip().upper().startswith("SELECT")  # una lectura; ningún candado ni INSERT
    assert not any("pg_advisory" in s or "INSERT INTO acceso_hce" in s for s in con_registro)
    assert len(_filas(e, "tina")) == 1


# ── Un GET que falla después de registrar ────────────────────────────────────
def test_un_get_que_falla_despues_de_registrar_deja_la_fila_tambien_en_la_conexion_de_la_suite(e, monkeypatch):
    """Lo que esta conexión puede probar: el registro se commitea **antes** de que corra el endpoint, y lo que el pedido
    haga (o deshaga) después no se lo lleva. Que sea de verdad otra transacción: `test_a2_registro_real.py`."""
    from app.routers import hce as router_hce

    def _roto(*a, **k):
        raise RuntimeError("falla del endpoint, después del registro")

    monkeypatch.setattr(router_hce.servicio, "obtener_hce", _roto)
    r = e.c.get(f"/hce/{e.h}", headers=e.cab["tina"])
    assert (r.status_code, r.json()["code"]) == (500, "internal_error")
    assert [(f.relacion, f.hce_id) for f in _filas(e, "tina")] == [("tratante", e.h)]


def test_una_escritura_que_falla_con_409_o_422_despues_de_registrar_deja_la_fila(e):
    r = e.c.patch(f"/hce/{e.h}", headers=e.cab["tina"], json={"activo": False})  # baja sin fecha: 422 del servicio
    assert r.status_code == 422, r.text
    assert [f.relacion for f in _filas(e, "tina")] == ["tratante"]


# ── (f) El marcador: acá la identidad por omisión no saltea la matriz ────────
def test_en_un_modulo_de_acceso_el_client_por_omision_ejerce_la_matriz(e, admin):
    r = e.c.get(f"/hce/{e.h}")  # sin `headers=`: la identidad por omisión, una coordinación sin grupos
    assert (r.status_code, r.json()["code"]) == (403, "reason_required")
    assert e.c.patch(f"/hce/{e.h}", json={"derivacion": "x"}).status_code == 403
    assert e.c.get(f"/hce/{e.h}/identificacion").status_code == 200  # y registra, como cualquier coordinación
    assert [(f.usuario_id, f.relacion) for f in _filas(e)] == [(admin.id, "gestion")]
