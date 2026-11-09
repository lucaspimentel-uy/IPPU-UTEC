"""C4 · HCE-INC: `GET /inclusion/opciones`, `GET /inclusion`, `GET|POST|PATCH /hce/{id}/inclusion` y
`GET|POST /hce/{id}/inclusion/bitacora`.

Convención del repo: todo rechazo va emparejado con el caso que pasa (422 ↔ 201/200). Las reglas están en
`app/services/inclusion.py` (§5.154); `fecha_estado` se prueba con `fechas.hoy` congelada.
"""
import json
import re
import threading
from datetime import date
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, event, func, select

from app.core.constantes import (
    INCLUSION_AT_ESTADOS, INCLUSION_MEDIOS, INCLUSION_ROLES, INCLUSION_TEMA_SENSIBLE, INCLUSION_TEMAS,
    INCLUSION_TIPOS_CENTRO,
)
from app.main import app
from app.models.identidad import HceDiurna, Persona, Profesional
from app.models.inclusion import EstadoInclusion, Inclusion, InclusionBitacora
from app.models.transversales import Auditoria
from app.services import fechas
from app.services import inclusion as servicio_inc
from test_m11_3b_idea_flujo import _hce  # noqa: F401  (ayuda)

HOY = date(2026, 11, 4)
CATALOGO = json.loads(
    (Path(__file__).resolve().parents[1] / "app" / "data" / "catalogos_iniciales.json").read_text(encoding="utf-8")
)["estado_inclusion"]
PLENA, PARCIAL, ADAPTACION, SIN_REGISTRAR = "Inclusión plena", "Inclusión parcial (horario reducido)", "En adaptación", "Sin registrar"
FICHA = {
    "centro": "Escuela N.º 000 (ejemplo)", "tipo_centro": "Escuela común (ANEP)", "grado": "4.º año",
    "modalidad": "Jornada completa", "dias_horas": "Lunes a viernes · 4 horas", "at": "No", "at_nombre": None,
    "ref_nombre": "Mtra. de clase", "ref_rol": "Maestra", "ref_tel": "099 000 000", "estado": PLENA,
    "obs": "Sin novedades.",
}
GESTION = {
    "fecha": "2026-09-15", "interlocutor": "Maestra de clase", "rol": "Centro educativo", "medio": "Reunión presencial",
    "tema": "Educativa / pedagógica", "contenido": "Se acordaron apoyos visuales.", "acuerdos": "Revisar en un mes.",
}


@pytest.fixture
def estados(db_api):
    for fila in CATALOGO:
        db_api.add(EstadoInclusion(**fila))
    db_api.commit()
    return {f["nombre"]: f for f in CATALOGO}


@pytest.fixture
def hoy(monkeypatch):
    monkeypatch.setattr(fechas, "hoy", lambda: HOY)
    return HOY


def _ficha(client, hid: int, **campos) -> dict:
    r = client.post(f"/hce/{hid}/inclusion", json={**FICHA, **campos})
    assert r.status_code == 201, r.text
    return r.json()


def _gestion(client, hid: int, **campos) -> dict:
    r = client.post(f"/hce/{hid}/inclusion/bitacora", json={**GESTION, **campos})
    assert r.status_code == 201, r.text
    return r.json()


def _filas(db_api, hid: int, **filtro) -> list[Auditoria]:
    db_api.expire_all()
    q = select(Auditoria).where(Auditoria.hce_id == hid, Auditoria.modulo == "HCE-INC")
    for k, v in filtro.items():
        q = q.where(getattr(Auditoria, k) == v)
    return list(db_api.scalars(q.order_by(Auditoria.id)))


def _campos(r) -> list[str | None]:
    return [d["campo"] for d in r.json()["detail"]]


def _sin_semaforo(cuerpo) -> None:
    assert "semaforo" not in json.dumps(cuerpo), cuerpo


# ── Opciones ─────────────────────────────────────────────────────────────────
def test_las_opciones_son_el_catalogo_y_las_constantes_sin_semaforo(client, estados, crear_profesional, token_de, hash_test):
    r = client.get("/inclusion/opciones")
    assert r.status_code == 200, r.text
    d = r.json()
    assert [e["nombre"] for e in d["estados"]] == [f["nombre"] for f in sorted(CATALOGO, key=lambda f: f["orden"])]
    assert {e["nombre"]: e["asignable"] for e in d["estados"]} == {f["nombre"]: f["nombre"] != SIN_REGISTRAR for f in CATALOGO}
    assert all(e["descripcion"] == estados[e["nombre"]]["descripcion"] for e in d["estados"])
    assert (d["tipos_centro"], d["at_estados"], d["temas"], d["medios"], d["roles"]) == (
        list(INCLUSION_TIPOS_CENTRO), list(INCLUSION_AT_ESTADOS), list(INCLUSION_TEMAS), list(INCLUSION_MEDIOS), list(INCLUSION_ROLES),
    )
    assert d["tema_sensible"] == INCLUSION_TEMA_SENSIBLE
    _sin_semaforo(d)
    tecnico = crear_profesional(nombre="Tina", hashed_password=hash_test)
    assert client.get("/inclusion/opciones", headers=token_de(tecnico)).status_code == 200
    assert TestClient(app).get("/inclusion/opciones").status_code == 401


# ── Ficha: camino feliz ──────────────────────────────────────────────────────
def test_sin_ficha_el_get_es_404_y_con_ficha_200(client, estados, hoy):
    hid = _hce(client)
    r = client.get(f"/hce/{hid}/inclusion")
    assert r.status_code == 404 and r.json()["code"] == "not_found"
    _ficha(client, hid)
    assert client.get(f"/hce/{hid}/inclusion").status_code == 200


def test_registrar_leer_y_editar_la_ficha(client, estados, hoy):
    hid = _hce(client)
    r = _ficha(client, hid)
    assert r["warnings"] == []
    d = r["data"]
    assert {c: d[c] for c in FICHA} == FICHA
    assert d["estado_descripcion"] == estados[PLENA]["descripcion"] and d["fecha_estado"] == HOY.isoformat()
    assert d["actualizado_en"]
    _sin_semaforo(d)
    leida = client.get(f"/hce/{hid}/inclusion").json()
    assert leida == d
    r = client.patch(f"/hce/{hid}/inclusion", json={"grado": "5.º año", "at": "Sí", "at_nombre": "Acompañante (ejemplo)"})
    assert r.status_code == 200 and r.json()["warnings"] == []
    assert (r.json()["data"]["grado"], r.json()["data"]["at"], r.json()["data"]["at_nombre"]) == ("5.º año", "Sí", "Acompañante (ejemplo)")
    assert client.get(f"/hce/{hid}/inclusion").json() == r.json()["data"]


def test_una_ficha_sin_estado_queda_sin_registrar_y_sin_fecha(client, estados, hoy):
    hid = _hce(client)
    r = client.post(f"/hce/{hid}/inclusion", json={"centro": "Escuela N.º 000 (ejemplo)"})
    assert r.status_code == 201, r.text
    d = r.json()["data"]
    assert (d["estado"], d["fecha_estado"]) == (SIN_REGISTRAR, None)
    assert d["estado_descripcion"] == estados[SIN_REGISTRAR]["descripcion"]


def test_en_el_patch_null_borra_un_campo_y_la_ausencia_no_toca(client, estados, hoy):
    hid = _hce(client)
    _ficha(client, hid)
    d = client.patch(f"/hce/{hid}/inclusion", json={"obs": None}).json()["data"]
    assert d["obs"] is None and d["centro"] == FICHA["centro"]
    d = client.patch(f"/hce/{hid}/inclusion", json={"ref_tel": "  "}).json()["data"]
    assert d["ref_tel"] is None


# ── Ficha: rechazos con su par ───────────────────────────────────────────────
def test_registrar_dos_veces_es_409_y_la_primera_queda(client, estados, hoy):
    hid = _hce(client)
    _ficha(client, hid)
    r = client.post(f"/hce/{hid}/inclusion", json={**FICHA, "centro": "Otro"})
    assert r.status_code == 409 and r.json()["code"] == "conflict"
    assert client.get(f"/hce/{hid}/inclusion").json()["centro"] == FICHA["centro"]


def test_la_carrera_por_la_ficha_es_409_y_no_un_500(client, estados, hoy, monkeypatch):
    """La verificación previa «no ve» a la otra: el UNIQUE(hce_id) es la última defensa."""
    hid = _hce(client)
    _ficha(client, hid)
    original = servicio_inc._ficha_de
    monkeypatch.setattr(servicio_inc, "_ficha_de", lambda *a, **k: None)
    r = client.post(f"/hce/{hid}/inclusion", json=FICHA)
    assert r.status_code == 409 and r.json()["code"] == "conflict"
    monkeypatch.setattr(servicio_inc, "_ficha_de", original)
    assert client.post(f"/hce/{_hce(client)}/inclusion", json=FICHA).status_code == 201  # la conexión sigue sana


def test_dos_altas_concurrentes_dan_exactamente_un_201(engine, hash_test, token_de):
    """Dos requests **reales y simultáneos** (conexiones propias, con commit) sobre el mismo expediente: los dos
    pasan la verificación previa a la vez y el UNIQUE decide. Uno 201 y el otro 409. Limpia lo que creó."""
    from sqlalchemy.orm import sessionmaker

    from app.core.database import get_db

    Sesion = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    with Sesion() as s:
        admin = Profesional(nombre="Zz Carrera", email="carrera-c4@ippu.test", rol="coordinacion", activo=True, hashed_password=hash_test)
        persona = Persona(nombre="A", apellido="B", ci="70000441", fecha_nac=date(2016, 1, 1))
        sembrado = s.get(EstadoInclusion, SIN_REGISTRAR) is None  # el default de `estado` tiene que existir (FK)
        if sembrado:
            s.add(EstadoInclusion(**next(f for f in CATALOGO if f["nombre"] == SIN_REGISTRAR)))
        s.add_all([admin, persona])
        s.flush()
        hce = HceDiurna(persona_id=persona.id, hc_historico=9441)
        s.add(hce)
        s.commit()
        ids = (admin.id, persona.id, hce.id)
        admin_obj = Profesional(id=admin.id)

    barrera = threading.Barrier(2, timeout=10)
    original = servicio_inc._ficha_de

    def _ambas_pasan_la_verificacion(db, hce_id, **kw):
        if kw.get("para_escribir"):
            return original(db, hce_id, **kw)
        visto = original(db, hce_id)
        barrera.wait()
        return visto

    def _get_db():
        s = Sesion()
        try:
            yield s
        finally:
            s.close()

    estados: list[int] = []
    servicio_inc._ficha_de = _ambas_pasan_la_verificacion
    app.dependency_overrides[get_db] = _get_db
    try:
        def _post():
            with TestClient(app, headers=token_de(admin_obj)) as c:
                estados.append(c.post(f"/hce/{ids[2]}/inclusion", json={"centro": "Escuela (carrera)"}).status_code)

        hilos = [threading.Thread(target=_post) for _ in range(2)]
        for h in hilos:
            h.start()
        for h in hilos:
            h.join(20)
        assert sorted(estados) == [201, 409], estados
        with Sesion() as s:
            assert s.scalar(select(func.count()).select_from(Inclusion).where(Inclusion.hce_id == ids[2])) == 1
    finally:
        servicio_inc._ficha_de = original
        app.dependency_overrides.pop(get_db, None)
        with Sesion() as s:
            s.execute(delete(HceDiurna).where(HceDiurna.id == ids[2]))  # ficha y auditoría caen por CASCADE
            s.execute(delete(Auditoria).where(Auditoria.usuario_id == ids[0]))
            s.execute(delete(Persona).where(Persona.id == ids[1]))
            s.execute(delete(Profesional).where(Profesional.id == ids[0]))
            if sembrado:
                s.execute(delete(EstadoInclusion).where(EstadoInclusion.nombre == SIN_REGISTRAR))
            s.commit()


@pytest.mark.parametrize("vacio", [{}, {"centro": "", "grado": "  ", "obs": " \t\n"}, {c: None for c in FICHA if c != "estado"}])
def test_una_ficha_toda_vacia_es_422_sin_campo_y_con_un_dato_pasa(client, estados, vacio):
    hid = _hce(client)
    r = client.post(f"/hce/{hid}/inclusion", json=vacio)
    assert r.status_code == 422 and _campos(r) == [None]
    assert client.get(f"/hce/{hid}/inclusion").status_code == 404
    assert client.post(f"/hce/{hid}/inclusion", json={**vacio, "grado": "4.º año"}).status_code == 201


@pytest.mark.parametrize("metodo", ["POST", "PATCH"])
@pytest.mark.parametrize("estado", [SIN_REGISTRAR, "Inventado", "inclusión plena"])
def test_sin_registrar_o_un_estado_desconocido_es_422_y_uno_asignable_pasa(client, estados, hoy, metodo, estado):
    hid = _hce(client)
    if metodo == "PATCH":
        _ficha(client, hid, estado=ADAPTACION)
    r = client.request(metodo, f"/hce/{hid}/inclusion", json={"centro": "X", "estado": estado})
    assert r.status_code == 422 and _campos(r) == ["estado"], r.text
    r = client.request(metodo, f"/hce/{hid}/inclusion", json={"centro": "X", "estado": PARCIAL})
    assert r.status_code in (200, 201) and r.json()["data"]["estado"] == PARCIAL


def test_en_el_patch_estado_null_o_blanco_es_422_y_un_estado_pasa(client, estados, hoy):
    hid = _hce(client)
    _ficha(client, hid)
    for malo in (None, "", "   "):
        r = client.patch(f"/hce/{hid}/inclusion", json={"estado": malo})
        assert r.status_code == 422 and _campos(r) == ["estado"], malo
    assert client.get(f"/hce/{hid}/inclusion").json()["estado"] == PLENA
    assert client.patch(f"/hce/{hid}/inclusion", json={"estado": ADAPTACION}).status_code == 200


def test_en_el_alta_estado_null_es_422_y_sin_la_clave_pasa(client, estados):
    hid = _hce(client)
    r = client.post(f"/hce/{hid}/inclusion", json={"centro": "X", "estado": None})
    assert r.status_code == 422 and _campos(r) == ["estado"]
    assert client.post(f"/hce/{hid}/inclusion", json={"centro": "X"}).status_code == 201


@pytest.mark.parametrize("campo,dominio", [("tipo_centro", INCLUSION_TIPOS_CENTRO), ("at", INCLUSION_AT_ESTADOS)])
def test_un_valor_fuera_del_dominio_es_422_y_uno_de_la_lista_pasa(client, estados, campo, dominio):
    hid = _hce(client)
    r = client.post(f"/hce/{hid}/inclusion", json={"centro": "X", campo: "Inventado"})
    assert r.status_code == 422 and _campos(r) == [campo]
    for valor in dominio:
        hid = _hce(client)
        assert client.post(f"/hce/{hid}/inclusion", json={"centro": "X", campo: valor}).status_code == 201, valor


@pytest.mark.parametrize("campo,largo", [
    ("centro", 200), ("grado", 120), ("modalidad", 200), ("dias_horas", 120), ("at_nombre", 200),
    ("ref_nombre", 200), ("ref_rol", 120), ("ref_tel", 60),
])
def test_un_texto_mas_largo_que_la_columna_es_422_y_el_borde_pasa(client, estados, campo, largo):
    hid = _hce(client)
    r = client.post(f"/hce/{hid}/inclusion", json={campo: "x" * (largo + 1)})
    assert r.status_code == 422 and _campos(r) == [campo]
    assert client.post(f"/hce/{hid}/inclusion", json={campo: "x" * largo}).status_code == 201
    r = client.patch(f"/hce/{hid}/inclusion", json={campo: "y" * (largo + 1)})
    assert r.status_code == 422 and _campos(r) == [campo]


@pytest.mark.parametrize("intruso", [
    {"fecha_estado": "2026-01-01"}, {"estado_descripcion": "x"}, {"semaforo": "ok"}, {"hce_id": 1}, {"actualizado_en": "2026-01-01T00:00:00"},
])
def test_un_campo_que_la_ficha_no_recibe_es_422_y_sin_el_pasa(client, estados, hoy, intruso):
    hid = _hce(client)
    r = client.post(f"/hce/{hid}/inclusion", json={**FICHA, **intruso})
    assert r.status_code == 422 and _campos(r) == list(intruso)
    _ficha(client, hid)
    r = client.patch(f"/hce/{hid}/inclusion", json={"grado": "x", **intruso})
    assert r.status_code == 422 and _campos(r) == list(intruso)
    assert client.patch(f"/hce/{hid}/inclusion", json={"grado": "x"}).status_code == 200


def test_patch_sin_ficha_es_404_y_con_ficha_pasa(client, estados, hoy):
    hid = _hce(client)
    assert client.patch(f"/hce/{hid}/inclusion", json={"grado": "x"}).status_code == 404
    _ficha(client, hid)
    assert client.patch(f"/hce/{hid}/inclusion", json={"grado": "x"}).status_code == 200


def test_el_texto_vacio_se_guarda_como_null(client, db_api, estados, hoy):
    hid = _hce(client)
    _ficha(client, hid, ref_tel="", at_nombre=" ")
    db_api.expire_all()
    fila = db_api.scalar(select(Inclusion).where(Inclusion.hce_id == hid))
    assert (fila.ref_tel, fila.at_nombre) == (None, None)
    client.patch(f"/hce/{hid}/inclusion", json={"obs": "\t\n"})
    db_api.expire_all()
    assert db_api.scalar(select(Inclusion.obs).where(Inclusion.hce_id == hid)) is None
    # El par: un texto con contenido se guarda tal cual (sin strip).
    client.patch(f"/hce/{hid}/inclusion", json={"obs": " con espacios "})
    db_api.expire_all()
    assert db_api.scalar(select(Inclusion.obs).where(Inclusion.hce_id == hid)) == " con espacios "


# ── fecha_estado: la escribe el sistema ──────────────────────────────────────
def test_fecha_estado_es_hoy_al_cambiar_el_estado_y_no_se_toca_si_no_cambia(client, estados, monkeypatch):
    hid = _hce(client)
    monkeypatch.setattr(fechas, "hoy", lambda: date(2026, 3, 2))
    assert _ficha(client, hid)["data"]["fecha_estado"] == "2026-03-02"
    monkeypatch.setattr(fechas, "hoy", lambda: date(2026, 6, 10))
    # Sin cambio de estado (otro campo, o el mismo estado), la fecha queda.
    assert client.patch(f"/hce/{hid}/inclusion", json={"grado": "x"}).json()["data"]["fecha_estado"] == "2026-03-02"
    assert client.patch(f"/hce/{hid}/inclusion", json={"estado": PLENA}).json()["data"]["fecha_estado"] == "2026-03-02"
    # Con cambio de estado, es la de hoy del servidor.
    d = client.patch(f"/hce/{hid}/inclusion", json={"estado": ADAPTACION}).json()["data"]
    assert (d["estado"], d["fecha_estado"]) == (ADAPTACION, "2026-06-10")


# ── Auditoría ────────────────────────────────────────────────────────────────
def test_el_alta_deja_una_fila_carga_sin_el_id_interno(client, db_api, admin, estados, hoy):
    hid = _hce(client)
    _ficha(client, hid)
    (fila,) = _filas(db_api, hid)
    assert (fila.tipo, fila.usuario_id, fila.campo) == ("carga", admin.id, None)
    assert "inclusión" in fila.detalle and not re.search(r"expediente \d+", fila.detalle)


def test_cada_campo_que_cambia_deja_su_fila_y_el_estado_arrastra_su_fecha(client, db_api, estados, monkeypatch):
    hid = _hce(client)
    monkeypatch.setattr(fechas, "hoy", lambda: date(2026, 3, 2))
    _ficha(client, hid)
    monkeypatch.setattr(fechas, "hoy", lambda: date(2026, 6, 10))
    client.patch(f"/hce/{hid}/inclusion", json={"centro": "Escuela nueva (ejemplo)", "grado": FICHA["grado"]})
    (centro,) = _filas(db_api, hid, tipo="edicion")
    assert (centro.campo, centro.valor_ant, centro.valor_nuevo) == ("centro", FICHA["centro"], "Escuela nueva (ejemplo)")
    client.patch(f"/hce/{hid}/inclusion", json={"estado": ADAPTACION})
    filas = {f.campo: (f.valor_ant, f.valor_nuevo) for f in _filas(db_api, hid, tipo="edicion")[1:]}
    assert filas == {"estado": (PLENA, ADAPTACION), "fecha_estado": ("2026-03-02", "2026-06-10")}


def test_un_patch_que_no_cambia_nada_no_deja_filas_y_uno_que_cambia_si(client, db_api, estados, hoy):
    hid = _hce(client)
    _ficha(client, hid)
    antes = len(_filas(db_api, hid))
    assert client.patch(f"/hce/{hid}/inclusion", json=FICHA).status_code == 200
    assert client.patch(f"/hce/{hid}/inclusion", json={}).status_code == 200
    assert client.patch(f"/hce/{hid}/inclusion", json={"at_nombre": "  "}).status_code == 200  # ya era NULL
    assert len(_filas(db_api, hid)) == antes
    client.patch(f"/hce/{hid}/inclusion", json={"ref_tel": "098 111 111"})
    assert len(_filas(db_api, hid)) == antes + 1


def test_una_gestion_deja_una_fila_carga_sin_tema_ni_contenido(client, db_api, admin, estados, hoy):
    hid = _hce(client)
    _ficha(client, hid)
    contenido = "Texto propio de la familia que no va a la auditoría"
    _gestion(client, hid, tema=INCLUSION_TEMA_SENSIBLE, contenido=contenido)
    filas = _filas(db_api, hid)
    assert [f.tipo for f in filas] == ["carga", "carga"] and filas[1].usuario_id == admin.id
    for f in filas:
        assert contenido not in f.detalle and INCLUSION_TEMA_SENSIBLE not in f.detalle and "sensible" not in f.detalle.lower()
        assert not re.search(r"expediente \d+", f.detalle)


def test_los_cambios_de_inclusion_se_leen_en_get_auditoria(client, estados, hoy):
    hid = _hce(client)
    _ficha(client, hid)
    client.patch(f"/hce/{hid}/inclusion", json={"grado": "5.º año"})
    _gestion(client, hid)
    filas = client.get(f"/hce/{hid}/auditoria", params={"modulo": "HCE-INC"}).json()
    assert [(f["tipo"], f["campo"]) for f in filas] == [("carga", None), ("edicion", "grado"), ("carga", None)]
    for f in filas:
        assert not re.search(r"expediente \d+", f["detalle"] or "")


def test_un_rechazo_no_escribe_nada(client, db_api, estados, hoy):
    hid = _hce(client)
    _ficha(client, hid)
    db_api.expire_all()
    total = db_api.scalar(select(func.count()).select_from(Auditoria))
    client.patch(f"/hce/{hid}/inclusion", json={"grado": "nuevo", "estado": SIN_REGISTRAR})
    client.post(f"/hce/{hid}/inclusion", json=FICHA)
    client.post(f"/hce/{hid}/inclusion/bitacora", json={**GESTION, "contenido": " "})
    db_api.expire_all()
    assert db_api.scalar(select(func.count()).select_from(Auditoria)) == total
    assert client.get(f"/hce/{hid}/inclusion").json()["grado"] == FICHA["grado"]
    assert client.get(f"/hce/{hid}/inclusion/bitacora").json() == []


# ── Bitácora ─────────────────────────────────────────────────────────────────
def test_registrar_una_gestion_y_leerla(client, admin, estados, hoy):
    hid = _hce(client)
    _ficha(client, hid)
    r = _gestion(client, hid)
    assert r["warnings"] == []
    d = r["data"]
    assert {c: d[c] for c in GESTION} == GESTION
    assert d["sensible"] is False and d["autor"] == {"id": admin.id, "nombre": admin.nombre} and d["registrado_en"]
    lista = client.get(f"/hce/{hid}/inclusion/bitacora")
    assert lista.status_code == 200 and lista.headers["X-Total-Count"] == "1" and lista.json() == [d]


def test_sin_ficha_la_bitacora_es_una_lista_vacia_con_total_0(client, estados):
    hid = _hce(client)
    r = client.get(f"/hce/{hid}/inclusion/bitacora")
    assert r.status_code == 200 and r.json() == [] and r.headers["X-Total-Count"] == "0"


def test_una_gestion_sin_ficha_es_404_que_pide_registrarla_y_con_ficha_pasa(client, estados, hoy):
    hid = _hce(client)
    r = client.post(f"/hce/{hid}/inclusion/bitacora", json=GESTION)
    assert r.status_code == 404 and r.json()["code"] == "not_found"
    assert "registr" in r.json()["detail"][0]["mensaje"] and "ficha" in r.json()["detail"][0]["mensaje"]
    _ficha(client, hid)
    assert client.post(f"/hce/{hid}/inclusion/bitacora", json=GESTION).status_code == 201


@pytest.mark.parametrize("tema", INCLUSION_TEMAS)
def test_sensible_sale_true_solo_para_el_tema_sensible(client, estados, hoy, tema):
    hid = _hce(client)
    _ficha(client, hid)
    d = _gestion(client, hid, tema=tema)["data"]
    assert d["sensible"] is (tema == INCLUSION_TEMA_SENSIBLE)
    assert client.get(f"/hce/{hid}/inclusion/bitacora").json()[0]["sensible"] is (tema == INCLUSION_TEMA_SENSIBLE)


def test_sensible_no_se_manda_ni_se_guarda(client, estados, hoy):
    hid = _hce(client)
    _ficha(client, hid)
    r = client.post(f"/hce/{hid}/inclusion/bitacora", json={**GESTION, "sensible": False})
    assert r.status_code == 422 and _campos(r) == ["sensible"]
    assert "sensible" not in InclusionBitacora.__table__.columns


def test_las_gestiones_van_de_la_mas_nueva_a_la_mas_vieja_y_el_id_desempata(client, estados, hoy):
    hid = _hce(client)
    _ficha(client, hid)
    a = _gestion(client, hid, fecha="2026-05-01")["data"]["id"]
    b = _gestion(client, hid, fecha="2026-09-01")["data"]["id"]
    c = _gestion(client, hid, fecha="2026-05-01")["data"]["id"]
    assert [g["id"] for g in client.get(f"/hce/{hid}/inclusion/bitacora").json()] == [b, c, a]


def test_la_bitacora_pagina_sin_perder_el_total(client, estados, hoy):
    hid = _hce(client)
    _ficha(client, hid)
    for dia in range(1, 6):
        _gestion(client, hid, fecha=f"2026-06-0{dia}")
    r = client.get(f"/hce/{hid}/inclusion/bitacora", params={"limit": 2, "offset": 2})
    assert r.headers["X-Total-Count"] == "5" and [g["fecha"] for g in r.json()] == ["2026-06-03", "2026-06-02"]
    assert client.get(f"/hce/{hid}/inclusion/bitacora", params={"limit": 0}).status_code == 422


@pytest.mark.parametrize("campo", ["interlocutor", "contenido"])
@pytest.mark.parametrize("blanco", ["", "   ", " ", "\t", "\n", " \t\n "])
def test_interlocutor_o_contenido_en_blanco_es_422_y_con_texto_pasa(client, estados, hoy, campo, blanco):
    hid = _hce(client)
    _ficha(client, hid)
    r = client.post(f"/hce/{hid}/inclusion/bitacora", json={**GESTION, campo: blanco})
    assert r.status_code == 422 and _campos(r) == [campo]
    assert client.post(f"/hce/{hid}/inclusion/bitacora", json={**GESTION, campo: "Texto"}).status_code == 201


@pytest.mark.parametrize("falta", ["fecha", "interlocutor", "tema", "contenido"])
def test_al_registrar_falta_un_campo_obligatorio_es_422_por_campo_y_completo_pasa(client, estados, hoy, falta):
    hid = _hce(client)
    _ficha(client, hid)
    r = client.post(f"/hce/{hid}/inclusion/bitacora", json={k: v for k, v in GESTION.items() if k != falta})
    assert r.status_code == 422 and _campos(r) == [falta]
    assert client.post(f"/hce/{hid}/inclusion/bitacora", json=GESTION).status_code == 201


def test_rol_medio_y_acuerdos_son_opcionales(client, estados, hoy):
    hid = _hce(client)
    _ficha(client, hid)
    d = _gestion(client, hid, rol=None, medio="", acuerdos="  ")["data"]
    assert (d["rol"], d["medio"], d["acuerdos"]) == (None, None, None)


@pytest.mark.parametrize("campo,dominio", [("tema", INCLUSION_TEMAS), ("rol", INCLUSION_ROLES), ("medio", INCLUSION_MEDIOS)])
def test_tema_rol_o_medio_fuera_de_la_lista_es_422_y_de_la_lista_pasa(client, estados, hoy, campo, dominio):
    hid = _hce(client)
    _ficha(client, hid)
    r = client.post(f"/hce/{hid}/inclusion/bitacora", json={**GESTION, campo: "Inventado"})
    assert r.status_code == 422 and _campos(r) == [campo]
    for valor in dominio:
        assert client.post(f"/hce/{hid}/inclusion/bitacora", json={**GESTION, campo: valor}).status_code == 201, valor


@pytest.mark.parametrize("campo,largo", [("interlocutor", 200)])
def test_un_interlocutor_mas_largo_que_la_columna_es_422_y_el_borde_pasa(client, estados, hoy, campo, largo):
    hid = _hce(client)
    _ficha(client, hid)
    r = client.post(f"/hce/{hid}/inclusion/bitacora", json={**GESTION, campo: "x" * (largo + 1)})
    assert r.status_code == 422 and _campos(r) == [campo]
    assert client.post(f"/hce/{hid}/inclusion/bitacora", json={**GESTION, campo: "x" * largo}).status_code == 201


@pytest.mark.parametrize("intruso", [{"autor_id": 1}, {"autor": {"id": 1}}, {"registrado_en": "2026-01-01T00:00:00"}, {"inclusion_id": 1}])
def test_un_campo_ajeno_en_la_gestion_es_422_y_el_autor_es_el_del_token(client, admin, estados, hoy, intruso):
    hid = _hce(client)
    _ficha(client, hid)
    r = client.post(f"/hce/{hid}/inclusion/bitacora", json={**GESTION, **intruso})
    assert r.status_code == 422 and _campos(r) == list(intruso)
    assert _gestion(client, hid)["data"]["autor"]["id"] == admin.id


def test_una_gestion_no_se_edita_ni_se_borra(client, estados, hoy):
    hid = _hce(client)
    _ficha(client, hid)
    gid = _gestion(client, hid)["data"]["id"]
    for metodo in ("PATCH", "PUT", "DELETE"):
        assert client.request(metodo, f"/hce/{hid}/inclusion/bitacora", json=GESTION).status_code == 405, metodo
        assert client.request(metodo, f"/hce/{hid}/inclusion/bitacora/{gid}", json=GESTION).status_code in (404, 405)
    assert client.delete(f"/hce/{hid}/inclusion").status_code == 405
    assert len(client.get(f"/hce/{hid}/inclusion/bitacora").json()) == 1


def test_el_autor_es_null_si_el_profesional_ya_no_existe(client, db_api, estados, hoy, crear_profesional, token_de, hash_test):
    hid = _hce(client)
    _ficha(client, hid)
    otro = crear_profesional(nombre="Se va", rol="coordinacion", hashed_password=hash_test)
    gid = client.post(f"/hce/{hid}/inclusion/bitacora", json=GESTION, headers=token_de(otro)).json()["data"]["id"]
    db_api.execute(delete(Auditoria).where(Auditoria.usuario_id == otro.id))
    db_api.execute(InclusionBitacora.__table__.update().where(InclusionBitacora.id == gid).values(autor_id=None))
    db_api.commit()
    assert client.get(f"/hce/{hid}/inclusion/bitacora").json()[0]["autor"] is None


def test_expediente_inexistente_es_404_en_todas_las_rutas(client, estados):
    for metodo, ruta, cuerpo in [
        ("GET", "", None), ("POST", "", FICHA), ("PATCH", "", {"grado": "x"}),
        ("GET", "/bitacora", None), ("POST", "/bitacora", GESTION),
    ]:
        r = client.request(metodo, f"/hce/987654/inclusion{ruta}", json=cuerpo)
        assert r.status_code == 404 and r.json()["code"] == "not_found", (metodo, ruta)


# ── Lista del área: GET /inclusion ───────────────────────────────────────────
def _alta_en(client, grupo, nombre: str, apellido: str, ci: str) -> int:
    r = client.post("/hce", json={"persona": {"nombre": nombre, "apellido": apellido, "ci": ci, "fecha_nac": "2016-04-12"}, "grupo_id": grupo.id})
    assert r.status_code == 201, r.text
    return r.json()["data"]["id"]


@pytest.fixture
def escenario(client, estados, hoy, crear_grupo, crear_profesional, hash_test):
    """Dos grupos (el de Tina y uno ajeno), tres expedientes con ficha, uno sin ficha y uno dado de baja."""
    tina = crear_profesional(nombre="Tina", hashed_password=hash_test)
    propio, ajeno = crear_grupo(nombre="Escolares", tecnico1_id=tina.id), crear_grupo(nombre="Inicial")
    ids = {
        "zeta": _alta_en(client, propio, "Ana", "Zeta", "81001-1"),
        "alfa": _alta_en(client, propio, "Beto", "Alfa", "81002-1"),
        "ajeno": _alta_en(client, ajeno, "Ciro", "Medio", "81003-1"),
        "sin": _alta_en(client, propio, "Dani", "Sinficha", "81004-1"),
        "baja": _alta_en(client, propio, "Eva", "Baja", "81005-1"),
    }
    _ficha(client, ids["zeta"], estado=PLENA)
    _ficha(client, ids["alfa"], estado=PARCIAL, at="Sí")
    _ficha(client, ids["ajeno"], estado=PLENA)
    _ficha(client, ids["baja"], estado=PLENA)
    _gestion(client, ids["alfa"], fecha="2026-05-01")
    _gestion(client, ids["alfa"], fecha="2026-10-20")
    _gestion(client, ids["alfa"], fecha="2026-07-01")
    assert client.patch(f"/hce/{ids['baja']}", json={"activo": False, "fecha_baja": "2026-09-01"}).status_code == 200
    return {"tina": tina, "propio": propio, "ajeno": ajeno, "ids": ids}


def test_la_lista_trae_las_fichas_activas_por_apellido_con_ultima_gestion_y_cantidad(client, escenario):
    ids = escenario["ids"]
    r = client.get("/inclusion")
    assert r.status_code == 200 and r.headers["X-Total-Count"] == "3"
    filas = r.json()
    assert [f["hce_id"] for f in filas] == [ids["alfa"], ids["ajeno"], ids["zeta"]]
    alfa = filas[0]
    assert alfa["persona"] == {"nombre": "Beto", "apellido": "Alfa", "fecha_nac": "2016-04-12"}
    assert alfa["grupo"] == {"id": escenario["propio"].id, "nombre": "Escolares", "anio": escenario["propio"].anio}
    assert (alfa["estado"], alfa["at"], alfa["fecha_estado"]) == (PARCIAL, "Sí", HOY.isoformat())
    assert (alfa["centro"], alfa["grado"], alfa["tipo_centro"]) == (FICHA["centro"], FICHA["grado"], FICHA["tipo_centro"])
    assert (alfa["ultima_gestion"], alfa["gestiones"]) == ("2026-10-20", 3)
    assert (filas[2]["ultima_gestion"], filas[2]["gestiones"]) == (None, 0)
    assert isinstance(alfa["hc_historico"], int)
    _sin_semaforo(filas)


def test_el_inactivo_no_aparece_y_al_reingresar_si(client, escenario):
    ids = escenario["ids"]
    assert ids["baja"] not in [f["hce_id"] for f in client.get("/inclusion").json()]
    client.patch(f"/hce/{ids['baja']}", json={"activo": True})
    assert ids["baja"] in [f["hce_id"] for f in client.get("/inclusion").json()]


def test_el_tecnico_ve_solo_las_fichas_de_sus_grupos_y_el_admin_todas(client, escenario, token_de):
    ids = escenario["ids"]
    r = client.get("/inclusion", headers=token_de(escenario["tina"]))
    assert r.status_code == 200 and r.headers["X-Total-Count"] == "2"
    assert [f["hce_id"] for f in r.json()] == [ids["alfa"], ids["zeta"]]
    assert len(client.get("/inclusion").json()) == 3
    assert TestClient(app).get("/inclusion").status_code == 401


def test_el_filtro_por_estado_y_un_estado_invalido_es_422(client, escenario):
    ids = escenario["ids"]
    r = client.get("/inclusion", params={"estado": PARCIAL})
    assert r.headers["X-Total-Count"] == "1" and [f["hce_id"] for f in r.json()] == [ids["alfa"]]
    assert client.get("/inclusion", params={"estado": SIN_REGISTRAR}).json() == []  # válido, sin filas
    assert client.get("/inclusion", params={"estado": ADAPTACION}).headers["X-Total-Count"] == "0"
    r = client.get("/inclusion", params={"estado": "Inventado"})
    assert r.status_code == 422 and _campos(r) == ["estado"]
    assert client.get("/inclusion", params={"estado": ""}).headers["X-Total-Count"] == "3"  # vacío = sin filtro


def test_la_lista_pagina_sin_perder_el_total(client, escenario):
    ids = escenario["ids"]
    r = client.get("/inclusion", params={"limit": 1, "offset": 1})
    assert r.headers["X-Total-Count"] == "3" and [f["hce_id"] for f in r.json()] == [ids["ajeno"]]
    assert client.get("/inclusion", params={"limit": 201}).status_code == 422


def _consultas(conexion, llamada) -> int:
    contador = {"n": 0}

    def _cuenta(*_a, **_k):
        contador["n"] += 1

    event.listen(conexion, "before_cursor_execute", _cuenta)
    try:
        llamada()
    finally:
        event.remove(conexion, "before_cursor_execute", _cuenta)
    return contador["n"]


#: Sentencias de un `GET /inclusion`, medidas en la conexión de test: SAVEPOINT + usuario del token + total +
#: página (ficha, expediente, persona, grupo y las gestiones agregadas, en una) + ROLLBACK TO SAVEPOINT. Con
#: `estado`, una más (validar el estado). No depende de las filas: una consulta por fila lo rompería.
CONSULTAS_GET_INCLUSION = 5


def test_la_lista_hace_siempre_las_mismas_consultas_con_pocas_o_muchas_filas(client, conexion_api, escenario):
    pocas = _consultas(conexion_api, lambda: client.get("/inclusion"))
    for i in range(8):
        hid = _alta_en(client, (escenario["propio"], escenario["ajeno"])[i % 2], f"N{i}", f"Extra{i}", f"8200{i}-1")
        _ficha(client, hid, estado=PLENA)
        for _ in range(i % 3):
            _gestion(client, hid)
    muchas = _consultas(conexion_api, lambda: client.get("/inclusion"))
    assert len(client.get("/inclusion").json()) == 11
    assert pocas == muchas == CONSULTAS_GET_INCLUSION
    con_estado = _consultas(conexion_api, lambda: client.get("/inclusion", params={"estado": PLENA}))
    assert con_estado == CONSULTAS_GET_INCLUSION + 1


# ── Acceso ───────────────────────────────────────────────────────────────────
def test_alcance_propio_ajeno_admin_y_sin_token(client, estados, hoy, crear_grupo, crear_profesional, token_de, hash_test):
    mia = crear_profesional(nombre="Tina", hashed_password=hash_test)
    otra = crear_profesional(nombre="Otra", hashed_password=hash_test)
    propio, ajeno = crear_grupo(nombre="Escolares", tecnico1_id=mia.id), crear_grupo(nombre="Inicial", tecnico1_id=otra.id)
    h_propio = _alta_en(client, propio, "A", "B", "83001-1")
    h_ajeno = _alta_en(client, ajeno, "C", "D", "83002-1")
    cab = token_de(mia)
    rutas = [
        ("POST", "", FICHA), ("GET", "", None), ("PATCH", "", {"grado": "x"}),
        ("POST", "/bitacora", GESTION), ("GET", "/bitacora", None),
    ]
    # Propio: las cinco rutas, y el técnico queda como autor de la gestión.
    for metodo, ruta, cuerpo in rutas:
        r = client.request(metodo, f"/hce/{h_propio}/inclusion{ruta}", json=cuerpo, headers=cab)
        assert r.status_code in (200, 201), (metodo, ruta, r.text)
    assert client.get(f"/hce/{h_propio}/inclusion/bitacora", headers=cab).json()[0]["autor"]["id"] == mia.id
    # El admin carga todo en el ajeno; el técnico recibe 404 en las cinco, y nada se escribe.
    _ficha(client, h_ajeno)
    _gestion(client, h_ajeno)
    antes = client.get(f"/hce/{h_ajeno}/inclusion").json()
    for metodo, ruta, cuerpo in rutas:
        r = client.request(metodo, f"/hce/{h_ajeno}/inclusion{ruta}", json=cuerpo, headers=cab)
        assert r.status_code == 404 and r.json()["code"] == "not_found", (metodo, ruta)
    assert client.get(f"/hce/{h_ajeno}/inclusion").json() == antes
    assert len(client.get(f"/hce/{h_ajeno}/inclusion/bitacora").json()) == 1
    # Sin token: 401 en las cinco y en las dos rutas del área.
    anonimo = TestClient(app)
    for metodo, ruta, cuerpo in rutas:
        assert anonimo.request(metodo, f"/hce/{h_propio}/inclusion{ruta}", json=cuerpo).status_code == 401, (metodo, ruta)
    assert anonimo.get("/inclusion").status_code == 401 and anonimo.get("/inclusion/opciones").status_code == 401


def test_ninguna_respuesta_expone_el_semaforo(client, estados, hoy):
    hid = _hce(client)
    respuestas = [
        client.get("/inclusion/opciones"), client.post(f"/hce/{hid}/inclusion", json=FICHA),
        client.get(f"/hce/{hid}/inclusion"), client.patch(f"/hce/{hid}/inclusion", json={"estado": PARCIAL}),
        client.post(f"/hce/{hid}/inclusion/bitacora", json=GESTION), client.get(f"/hce/{hid}/inclusion/bitacora"),
        client.get("/inclusion"),
    ]
    for r in respuestas:
        assert r.status_code in (200, 201), r.text
        _sin_semaforo(r.json())
    esquema = json.dumps(client.get("/openapi.json").json()["components"]["schemas"])
    assert all(f'"{n}"' in esquema for n in ("FichaDetalle", "FichaFila", "OpcionesInclusion"))
    for nombre in ("FichaDetalle", "FichaFila", "OpcionesInclusion", "EstadoOpcion", "GestionDetalle"):
        assert "semaforo" not in json.dumps(client.get("/openapi.json").json()["components"]["schemas"][nombre])
