"""C6 · Ateneos y jornadas: `/ateneos` (lista, alta, detalle, edición), acuerdos, indicador y documentos (con PPTX).

Convención del repo: todo rechazo va emparejado con el caso que pasa. Las reglas están en `app/services/ateneos.py`
(§5.158); `fechas.hoy` se congela (el correlativo es del año de registración). Las reglas de forma de la BD siguen
probadas en `test_m12_ateneos.py` (incluido `test_una_jornada_con_acuerdos_hoy_se_guarda`: la regla vive en el servicio).
"""
import io
import threading
import zipfile
from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, event, select

from app.core.constantes import ATENEO_TIPOS, PPTX_TIPO_PRINCIPAL
from app.main import app
from app.models.ateneo import Ateneo, AteneoAcuerdo
from app.models.identidad import Profesional
from app.models.transversales import Auditoria, Documento
from app.services import ateneos as servicio
from app.services import fechas
from test_c5_documentos import HISTORICO, OTRO, PDF, _subir, categorias  # noqa: F401  (categorias: fixture)
from test_m11_3d1_login_listado import _alta

HOY = date(2026, 11, 6)
NBSP = " "


@pytest.fixture
def hoy(monkeypatch):
    monkeypatch.setattr(fechas, "hoy", lambda: HOY)
    return HOY


@pytest.fixture
def escena(client, hoy, crear_grupo, crear_profesional, hash_test, token_de):
    """Tina (técnica de Escolares 2026), Otra (técnica de Inicial 2026); un NNA en cada grupo; Escolares 2025."""
    tina = crear_profesional(nombre="Tina", hashed_password=hash_test)
    otra = crear_profesional(nombre="Otra", hashed_password=hash_test)
    propio = crear_grupo(nombre="Escolares", anio=2026, tecnico1_id=tina.id)
    ajeno = crear_grupo(nombre="Inicial", anio=2026, tecnico1_id=otra.id)
    viejo = crear_grupo(nombre="Escolares", anio=2025)
    return {
        "tina": tina, "otra": otra, "propio": propio, "ajeno": ajeno, "viejo": viejo,
        "nna_propio": _alta(client, propio.id, nombre="Martín"), "nna_ajeno": _alta(client, ajeno.id, nombre="Sofía"),
        "cab_tina": token_de(tina), "cab_otra": token_de(otra),
    }


def _cuerpo(tipo: str, escena: dict | None = None, **extra) -> dict:
    base = {"tipo": tipo, "fecha": "2026-09-18", "titulo": f"Registro {tipo}"}
    if tipo == "clinico":
        base |= {"hce_referida_id": escena["nna_propio"], "grupo_id": escena["propio"].id,
                 "situacion": "Meseta en las transiciones.", "hipotesis": "Falta de anticipación visual."}
    elif tipo == "grupo":
        base |= {"grupo_id": escena["propio"].id, "situacion": "Revisión del semestre."}
    elif tipo == "institucional":
        base |= {"situacion": "Análisis de los ateneos del año."}
    else:
        base |= {"capacitador": "Equipo técnico interno", "modalidad": "Presencial", "contenidos": "Reglas comunes del IDEA."}
    return base | extra


def _crear(client, cuerpo: dict, headers=None) -> dict:
    r = client.post("/ateneos", json=cuerpo, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()


def _campos(r) -> list:
    return [d["campo"] for d in r.json()["detail"]]


def _filas(db_api, **filtro) -> list[Auditoria]:
    db_api.expire_all()
    q = select(Auditoria).where(Auditoria.modulo == "ATENEO")
    for k, v in filtro.items():
        q = q.where(getattr(Auditoria, k) == v)
    return list(db_api.scalars(q.order_by(Auditoria.id)))


# ── Opciones ─────────────────────────────────────────────────────────────────
def test_las_opciones_son_las_constantes_y_piden_token(client):
    d = client.get("/ateneos/opciones").json()
    assert [t["clave"] for t in d["tipos"]] == list(ATENEO_TIPOS) and d["tipos"][0]["label"] == ATENEO_TIPOS["clinico"]
    assert d["campos_jornada"] == ["capacitador", "modalidad", "contenidos", "materiales", "evaluacion"]
    assert d["campos_desarrollo_clinico"] == ["situacion", "hipotesis", "recursos", "seguimiento"]
    assert d["metas"] == {"total": 8, "por_grupo": 2} and d["tipo_sensible"] == "clinico"
    assert TestClient(app).get("/ateneos/opciones").status_code == 401


# ── Camino feliz por tipo ────────────────────────────────────────────────────
@pytest.mark.parametrize("tipo", list(ATENEO_TIPOS))
def test_cada_tipo_se_registra_completo_y_se_lee_igual(client, escena, admin, tipo):
    acuerdos = [] if tipo == "jornada" else [
        {"acuerdo": "Implementar agenda visual", "responsable_rol": "Técnico/a responsable 2", "plazo": "2026-10-15"},
        {"acuerdo": "Registrar la frecuencia de episodios"},
    ]
    r = _crear(client, _cuerpo(tipo, escena, participantes="Técnicos responsables · Coordinación", acuerdos=acuerdos))
    assert r["warnings"] == []
    d = r["data"]
    assert (d["codigo"], d["anio_correlativo"], d["numero"]) == ("AT-2026-001", 2026, 1)
    assert d["tipo"] == tipo and d["tipo_label"] == ATENEO_TIPOS[tipo] and d["sensible"] == (tipo == "clinico")
    assert d["autor"] == {"id": admin.id, "nombre": admin.nombre}
    assert [(a["acuerdo"], a["responsable_rol"], a["plazo"], a["orden"]) for a in d["acuerdos"]] == [
        (a["acuerdo"], a.get("responsable_rol"), a.get("plazo"), i) for i, a in enumerate(acuerdos)]
    if tipo == "clinico":
        assert d["nna"]["hce_id"] == escena["nna_propio"] and d["nna"]["nombre"] == "Martín"
        assert d["grupo"] == {"id": escena["propio"].id, "nombre": "Escolares", "anio": 2026}
    assert client.get(f"/ateneos/{d['id']}").json() == d


def test_el_correlativo_es_secuencial_por_anio_de_registro_y_un_rechazo_no_gasta_numero(client, escena, monkeypatch):
    assert client.post("/ateneos", json=_cuerpo("institucional", titulo=" ")).status_code == 422
    codigos = [_crear(client, _cuerpo("institucional"))["data"]["codigo"] for _ in range(3)]
    assert codigos == ["AT-2026-001", "AT-2026-002", "AT-2026-003"]
    monkeypatch.setattr(fechas, "hoy", lambda: date(2027, 1, 3))
    assert _crear(client, _cuerpo("institucional", fecha="2026-12-20"))["data"]["codigo"] == "AT-2027-001"


def test_el_anio_del_codigo_se_congela_y_el_filtro_va_por_la_fecha(client, escena):
    d = _crear(client, _cuerpo("institucional", fecha="2025-12-20"))["data"]
    assert d["codigo"] == "AT-2026-001" and d["fecha"] == "2025-12-20"
    assert [f["id"] for f in client.get("/ateneos", params={"anio": 2025}).json()] == [d["id"]]
    assert client.get("/ateneos", params={"anio": 2026}).json() == []
    r = client.patch(f"/ateneos/{d['id']}", json={"fecha": "2026-01-15"})
    assert r.status_code == 200 and r.json()["data"]["codigo"] == "AT-2026-001"   # editar la fecha no renumera
    assert [f["id"] for f in client.get("/ateneos", params={"anio": 2026}).json()] == [d["id"]]


def test_el_numero_mil_es_422_sin_campo_y_el_999_pasa(client, escena, db_api):
    db_api.add(Ateneo(anio_correlativo=2026, numero=998, tipo="institucional", fecha=date(2026, 1, 1), titulo="x"))
    db_api.commit()
    assert _crear(client, _cuerpo("institucional"))["data"]["codigo"] == "AT-2026-999"
    r = client.post("/ateneos", json=_cuerpo("institucional"))
    assert r.status_code == 422 and _campos(r) == [None], r.text


def test_dos_altas_concurrentes_reales_reciben_numeros_distintos(engine, hash_test, token_de, monkeypatch):
    """Dos requests **reales y simultáneos** (conexiones propias, con commit): los dos llegan a la vez al candado del
    correlativo (una barrera los junta justo antes); el candado los serializa y salen 1 y 2. Sin el candado, los dos
    leerían el mismo máximo y el UNIQUE haría fallar a uno. Año 2031 (nadie más escribe ahí). Limpia lo que creó."""
    from sqlalchemy.orm import sessionmaker

    from app.core.database import get_db

    anio = 2031
    monkeypatch.setattr(fechas, "hoy", lambda: date(anio, 3, 1))
    Sesion = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    with Sesion() as s:
        admin = Profesional(nombre="Zz Carrera C6", email="carrera-c6@ippu.test", rol="coordinacion", activo=True, hashed_password=hash_test)
        s.add(admin)
        s.commit()
        admin_id = admin.id
    barrera = threading.Barrier(2, timeout=10)
    original = servicio._bloquear_correlativo

    def _juntos(db, a):
        barrera.wait()
        return original(db, a)

    def _get_db():
        s = Sesion()
        try:
            yield s
        finally:
            s.close()

    codigos: list[tuple[int, str]] = []
    monkeypatch.setattr(servicio, "_bloquear_correlativo", _juntos)
    app.dependency_overrides[get_db] = _get_db
    try:
        def _post(i):
            with TestClient(app, headers=token_de(Profesional(id=admin_id))) as c:
                r = c.post("/ateneos", json={"tipo": "institucional", "fecha": f"{anio}-02-0{i + 1}", "titulo": f"Carrera {i}"})
                codigos.append((r.status_code, r.json().get("data", {}).get("codigo")))

        hilos = [threading.Thread(target=_post, args=(i,)) for i in range(2)]
        for h in hilos:
            h.start()
        for h in hilos:
            h.join(20)
        assert sorted(codigos) == [(201, f"AT-{anio}-001"), (201, f"AT-{anio}-002")], codigos
    finally:
        app.dependency_overrides.pop(get_db, None)
        with Sesion() as s:
            s.execute(delete(Ateneo).where(Ateneo.anio_correlativo == anio))
            s.execute(delete(Auditoria).where(Auditoria.usuario_id == admin_id))
            s.execute(delete(Profesional).where(Profesional.id == admin_id))
            s.commit()


# ── Forma por tipo: cada CHECK como 422 por campo, nunca 500 ─────────────────
def test_el_clinico_exige_nna_y_con_nna_pasa(client, escena):
    r = client.post("/ateneos", json=_cuerpo("clinico", escena, hce_referida_id=None))
    assert r.status_code == 422 and _campos(r) == ["hce_referida_id"]
    _crear(client, _cuerpo("clinico", escena))


@pytest.mark.parametrize("tipo", ["grupo", "institucional", "jornada"])
def test_un_no_clinico_con_nna_es_422_y_sin_nna_pasa(client, escena, tipo):
    r = client.post("/ateneos", json=_cuerpo(tipo, escena, hce_referida_id=escena["nna_propio"]))
    assert r.status_code == 422 and _campos(r) == ["hce_referida_id"]
    _crear(client, _cuerpo(tipo, escena))


def test_el_de_grupo_exige_grupo_y_el_clinico_lo_admite_sin_exigirlo(client, escena):
    r = client.post("/ateneos", json=_cuerpo("grupo", escena, grupo_id=None))
    assert r.status_code == 422 and _campos(r) == ["grupo_id"]
    _crear(client, _cuerpo("grupo", escena))
    _crear(client, _cuerpo("clinico", escena, grupo_id=None))
    _crear(client, _cuerpo("clinico", escena))


@pytest.mark.parametrize("tipo", ["institucional", "jornada"])
def test_institucional_y_jornada_con_grupo_son_422_y_sin_grupo_pasan(client, escena, tipo):
    r = client.post("/ateneos", json=_cuerpo(tipo, escena, grupo_id=escena["propio"].id))
    assert r.status_code == 422 and _campos(r) == ["grupo_id"]
    _crear(client, _cuerpo(tipo, escena))


@pytest.mark.parametrize("campo", ["capacitador", "modalidad", "contenidos", "materiales", "evaluacion"])
def test_un_campo_de_jornada_en_un_ateneo_es_422_y_en_la_jornada_pasa(client, escena, campo):
    r = client.post("/ateneos", json=_cuerpo("grupo", escena, **{campo: "texto"}))
    assert r.status_code == 422 and _campos(r) == [campo]
    assert _crear(client, _cuerpo("jornada", **{campo: "texto"}))["data"][campo] == "texto"


@pytest.mark.parametrize("campo", ["situacion", "hipotesis", "recursos", "seguimiento"])
def test_el_desarrollo_clinico_en_una_jornada_es_422_y_en_un_ateneo_pasa(client, escena, campo):
    r = client.post("/ateneos", json=_cuerpo("jornada", **{campo: "texto"}))
    assert r.status_code == 422 and _campos(r) == [campo]
    assert _crear(client, _cuerpo("institucional", **{campo: "texto"}))["data"][campo] == "texto"


@pytest.mark.parametrize("blanco", ["", "   ", f"\t{NBSP}\n"])
def test_un_campo_de_otro_bloque_en_blanco_no_cuenta_y_se_guarda_null(client, escena, blanco):
    d = _crear(client, _cuerpo("grupo", escena, capacitador=blanco, evaluacion=blanco))["data"]
    assert (d["capacitador"], d["evaluacion"]) == (None, None)


def test_cambiar_un_clinico_a_institucional_exige_limpiar_nna_y_grupo_en_el_mismo_patch(client, escena):
    a = _crear(client, _cuerpo("clinico", escena))["data"]
    r = client.patch(f"/ateneos/{a['id']}", json={"tipo": "institucional"})
    assert r.status_code == 422 and sorted(_campos(r)) == ["grupo_id", "hce_referida_id"], r.text
    r = client.patch(f"/ateneos/{a['id']}", json={"tipo": "institucional", "grupo_id": None})
    assert r.status_code == 422 and _campos(r) == ["hce_referida_id"]
    r = client.patch(f"/ateneos/{a['id']}", json={"tipo": "institucional", "hce_referida_id": None, "grupo_id": None})
    assert r.status_code == 200, r.text
    d = r.json()["data"]
    assert (d["tipo"], d["sensible"], d["nna"], d["grupo"], d["codigo"]) == ("institucional", False, None, None, a["codigo"])


def test_volver_clinico_un_institucional_exige_el_nna(client, escena):
    a = _crear(client, _cuerpo("institucional"))["data"]
    r = client.patch(f"/ateneos/{a['id']}", json={"tipo": "clinico"})
    assert r.status_code == 422 and _campos(r) == ["hce_referida_id"]
    r = client.patch(f"/ateneos/{a['id']}", json={"tipo": "clinico", "hce_referida_id": escena["nna_propio"]})
    assert r.status_code == 200 and r.json()["data"]["sensible"] is True


def test_una_jornada_con_acuerdos_es_422_en_acuerdos_y_sin_acuerdos_pasa(client, escena):
    r = client.post("/ateneos", json=_cuerpo("jornada", acuerdos=[{"acuerdo": "Algo"}]))
    assert r.status_code == 422 and _campos(r) == ["acuerdos"]
    _crear(client, _cuerpo("jornada", acuerdos=[]))


def test_pasar_a_jornada_un_ateneo_con_acuerdos_es_422_en_tipo_y_sin_acuerdos_pasa(client, escena):
    con = _crear(client, _cuerpo("institucional", acuerdos=[{"acuerdo": "Algo"}]))["data"]
    sin = _crear(client, _cuerpo("institucional"))["data"]
    vaciar = {"tipo": "jornada", "situacion": None}
    r = client.patch(f"/ateneos/{con['id']}", json=vaciar)
    assert r.status_code == 422 and _campos(r) == ["tipo"]
    assert client.patch(f"/ateneos/{sin['id']}", json=vaciar).status_code == 200


def test_un_acuerdo_en_una_jornada_es_422_y_en_un_ateneo_pasa(client, escena):
    j = _crear(client, _cuerpo("jornada"))["data"]
    g = _crear(client, _cuerpo("grupo", escena))["data"]
    r = client.post(f"/ateneos/{j['id']}/acuerdos", json={"acuerdo": "Algo"})
    assert r.status_code == 422 and _campos(r) == [None]
    assert client.post(f"/ateneos/{g['id']}/acuerdos", json={"acuerdo": "Algo"}).status_code == 201


def test_un_nna_ajeno_y_uno_inexistente_dan_el_mismo_422_y_el_propio_pasa(client, escena):
    cab = escena["cab_tina"]
    ajeno = client.post("/ateneos", json=_cuerpo("clinico", escena, hce_referida_id=escena["nna_ajeno"], grupo_id=None), headers=cab)
    falso = client.post("/ateneos", json=_cuerpo("clinico", escena, hce_referida_id=9_999_001, grupo_id=None), headers=cab)
    assert ajeno.status_code == falso.status_code == 422 and ajeno.json() == falso.json(), (ajeno.text, falso.text)
    assert _campos(ajeno) == ["hce_referida_id"]
    _crear(client, _cuerpo("clinico", escena), headers=cab)
    a = _crear(client, _cuerpo("institucional"), headers=cab)["data"]   # PATCH a clínico con el NNA ajeno: el mismo 422
    r = client.patch(f"/ateneos/{a['id']}", json={"tipo": "clinico", "hce_referida_id": escena["nna_ajeno"]}, headers=cab)
    assert r.status_code == 422 and r.json() == falso.json()


def test_un_grupo_inexistente_es_422_y_uno_real_pasa(client, escena):
    r = client.post("/ateneos", json=_cuerpo("grupo", escena, grupo_id=9_999_001))
    assert r.status_code == 422 and _campos(r) == ["grupo_id"]
    _crear(client, _cuerpo("grupo", escena))


def test_la_fecha_fuera_del_anio_del_grupo_es_un_aviso_y_se_guarda(client, escena):
    r = _crear(client, _cuerpo("grupo", escena, grupo_id=escena["viejo"].id, fecha="2026-02-10"))
    assert [w["code"] for w in r["warnings"]] == ["fecha_y_anio_del_grupo"] and r["warnings"][0]["campo"] == "fecha"
    assert _crear(client, _cuerpo("grupo", escena))["warnings"] == []
    r = client.patch(f"/ateneos/{r['data']['id']}", json={"grupo_id": escena["propio"].id})
    assert r.status_code == 200 and r.json()["warnings"] == []


@pytest.mark.parametrize("blanco", ["", "  ", f"{NBSP}", "\t", "\n", f" {NBSP}\t\n "])
def test_un_titulo_en_blanco_es_422_y_con_texto_pasa(client, escena, blanco):
    r = client.post("/ateneos", json=_cuerpo("institucional", titulo=blanco))
    assert r.status_code == 422 and _campos(r) == ["titulo"]
    a = _crear(client, _cuerpo("institucional"))["data"]
    r = client.patch(f"/ateneos/{a['id']}", json={"titulo": blanco})
    assert r.status_code == 422 and _campos(r) == ["titulo"]
    assert client.patch(f"/ateneos/{a['id']}", json={"titulo": f"{blanco}Con texto"}).status_code == 200


@pytest.mark.parametrize("blanco", ["", NBSP, "\t", "\n"])
def test_un_acuerdo_en_blanco_es_422_y_con_texto_pasa(client, escena, blanco):
    r = client.post("/ateneos", json=_cuerpo("institucional", acuerdos=[{"acuerdo": "Uno"}, {"acuerdo": blanco}]))
    assert r.status_code == 422 and _campos(r) == ["acuerdos.1.acuerdo"]
    a = _crear(client, _cuerpo("institucional", acuerdos=[{"acuerdo": "Uno"}]))["data"]
    r = client.post(f"/ateneos/{a['id']}/acuerdos", json={"acuerdo": blanco})
    assert r.status_code == 422 and _campos(r) == ["acuerdo"]
    aid = a["acuerdos"][0]["id"]
    r = client.patch(f"/ateneos/{a['id']}/acuerdos/{aid}", json={"acuerdo": blanco})
    assert r.status_code == 422 and _campos(r) == ["acuerdo"]
    assert client.patch(f"/ateneos/{a['id']}/acuerdos/{aid}", json={"acuerdo": "Corregido"}).status_code == 200


def test_el_texto_vacio_se_guarda_como_null(client, escena, db_api):
    d = _crear(client, _cuerpo("institucional", participantes="", observaciones=f"{NBSP} ", recursos="\t",
                               acuerdos=[{"acuerdo": "Uno", "responsable_rol": "  "}]))["data"]
    db_api.expire_all()
    fila = db_api.get(Ateneo, d["id"])
    assert (fila.participantes, fila.observaciones, fila.recursos) == (None, None, None)
    assert db_api.scalar(select(AteneoAcuerdo.responsable_rol).where(AteneoAcuerdo.ateneo_id == d["id"])) is None
    r = client.patch(f"/ateneos/{d['id']}", json={"situacion": ""})
    assert r.status_code == 200 and r.json()["data"]["situacion"] is None
    # el texto con contenido se guarda tal cual (sin recortar)
    assert client.patch(f"/ateneos/{d['id']}", json={"observaciones": "  hola\n"}).json()["data"]["observaciones"] == "  hola\n"


@pytest.mark.parametrize("campo,valor", [
    ("anio_correlativo", 2026), ("numero", 5), ("codigo", "AT-2026-005"), ("sensible", False), ("autor_id", 1), ("id", 3),
])
def test_lo_que_pone_el_servidor_en_el_cuerpo_es_422(client, escena, campo, valor):
    r = client.post("/ateneos", json=_cuerpo("institucional", **{campo: valor}))
    assert r.status_code == 422 and _campos(r) == [campo]
    a = _crear(client, _cuerpo("institucional"))["data"]
    r = client.patch(f"/ateneos/{a['id']}", json={campo: valor})
    assert r.status_code == 422 and _campos(r) == [campo]


def test_tipo_fecha_y_titulo_vacios_en_el_alta_son_422_por_campo_y_con_valor_pasan(client, escena):
    r = client.post("/ateneos", json={"tipo": "", "fecha": "", "titulo": ""})
    assert r.status_code == 422 and sorted(_campos(r)) == ["fecha", "tipo", "titulo"], r.text
    _crear(client, {"tipo": "institucional", "fecha": "2026-10-01", "titulo": "Con valor"})


def test_tipo_invalido_y_obligatorios_nulos_son_422_y_validos_pasan(client, escena):
    r = client.post("/ateneos", json={**_cuerpo("institucional"), "tipo": "meta"})
    assert r.status_code == 422 and _campos(r) == ["tipo"]
    a = _crear(client, _cuerpo("institucional"))["data"]
    for campo in ("tipo", "fecha", "titulo"):
        r = client.patch(f"/ateneos/{a['id']}", json={campo: None})
        assert r.status_code == 422 and _campos(r) == [campo], campo
    assert client.patch(f"/ateneos/{a['id']}", json={"tipo": "institucional", "fecha": "2026-10-01"}).status_code == 200


@pytest.mark.parametrize("campo,largo", [("titulo", 200), ("capacitador", 200), ("modalidad", 200)])
def test_los_largos_del_modelo_son_422_por_campo(client, escena, campo, largo):
    tipo = "institucional" if campo == "titulo" else "jornada"
    r = client.post("/ateneos", json=_cuerpo(tipo, **{campo: "x" * (largo + 1)}))
    assert r.status_code == 422 and _campos(r) == [campo]
    _crear(client, _cuerpo(tipo, **{campo: "x" * largo}))


def test_el_rol_responsable_largo_es_422(client, escena):
    r = client.post("/ateneos", json=_cuerpo("institucional", acuerdos=[{"acuerdo": "Uno", "responsable_rol": "x" * 81}]))
    assert r.status_code == 422 and _campos(r) == ["acuerdos.0.responsable_rol"]
    _crear(client, _cuerpo("institucional", acuerdos=[{"acuerdo": "Uno", "responsable_rol": "x" * 80}]))


# ── Acuerdos después del alta ────────────────────────────────────────────────
def test_un_acuerdo_agregado_va_al_final_y_se_edita(client, escena):
    a = _crear(client, _cuerpo("grupo", escena, acuerdos=[{"acuerdo": "Uno"}, {"acuerdo": "Dos"}]))["data"]
    r = client.post(f"/ateneos/{a['id']}/acuerdos", json={"acuerdo": "Tres", "plazo": "2026-12-01"})
    assert r.status_code == 201 and r.json()["data"]["orden"] == 2
    aid = r.json()["data"]["id"]
    r = client.patch(f"/ateneos/{a['id']}/acuerdos/{aid}", json={"responsable_rol": "Coordinación técnica", "plazo": None})
    assert r.status_code == 200 and (r.json()["data"]["responsable_rol"], r.json()["data"]["plazo"]) == ("Coordinación técnica", None)
    assert [x["acuerdo"] for x in client.get(f"/ateneos/{a['id']}").json()["acuerdos"]] == ["Uno", "Dos", "Tres"]
    otro = _crear(client, _cuerpo("institucional", acuerdos=[{"acuerdo": "X"}]))["data"]
    r = client.patch(f"/ateneos/{otro['id']}/acuerdos/{aid}", json={"acuerdo": "Y"})   # el acuerdo es de otro ateneo
    assert r.status_code == 404


def test_no_hay_delete_de_ateneos_acuerdos_ni_documentos(client, escena, categorias):
    a = _crear(client, _cuerpo("institucional", acuerdos=[{"acuerdo": "Uno"}]))["data"]
    doc = _subir_at(client, a["id"], categorias[OTRO]).json()["data"]["id"]
    for ruta in (f"/ateneos/{a['id']}", f"/ateneos/{a['id']}/acuerdos/{a['acuerdos'][0]['id']}", f"/ateneos/{a['id']}/documentos/{doc}"):
        assert client.delete(ruta).status_code == 405, ruta
    assert client.get(f"/ateneos/{a['id']}").status_code == 200


# ── Lista ────────────────────────────────────────────────────────────────────
def test_la_lista_ordena_por_fecha_y_filtra_en_el_servidor(client, escena):
    c = _crear(client, _cuerpo("clinico", escena, fecha="2026-03-01", titulo="Revisión de proceso",
                               acuerdos=[{"acuerdo": "a"}, {"acuerdo": "b"}]))["data"]
    g = _crear(client, _cuerpo("grupo", escena, fecha="2026-05-01", situacion="Cierre 100% del ciclo"))["data"]
    i = _crear(client, _cuerpo("institucional", fecha="2026-05-01"))["data"]
    j = _crear(client, _cuerpo("jornada", fecha="2025-08-01", contenidos="Aplicación CALIBRADA del IDEA"))["data"]
    r = client.get("/ateneos")
    assert [f["id"] for f in r.json()] == [i["id"], g["id"], c["id"], j["id"]] and r.headers["X-Total-Count"] == "4"
    fila = next(f for f in r.json() if f["id"] == c["id"])
    assert fila == {
        "id": c["id"], "codigo": "AT-2026-001", "tipo": "clinico", "tipo_label": "Ateneo clínico (NNA)", "fecha": "2026-03-01",
        "titulo": "Revisión de proceso", "sensible": True, "grupo": {"id": escena["propio"].id, "nombre": "Escolares", "anio": 2026},
        "nna": {"hce_id": escena["nna_propio"], "hc_historico": client.get(f"/hce/{escena['nna_propio']}").json()["hc_historico"],
                "nombre": "Martín", "apellido": "Pérez"},
        "acuerdos": 2, "documentos": 0,
    }
    ids = lambda **p: [f["id"] for f in client.get("/ateneos", params=p).json()]  # noqa: E731
    assert ids(anio=2025) == [j["id"]] and ids(tipo="grupo") == [g["id"]]
    assert ids(grupo_id=escena["propio"].id) == [g["id"], c["id"]] and ids(hce_referida_id=escena["nna_propio"]) == [c["id"]]
    assert ids(q="calibrada") == [j["id"]] and ids(q="100%") == [g["id"]] and ids(q="REVISIÓN") == [c["id"]]
    assert ids(q="%") == [g["id"]] and ids(q="_") == [] and ids(q="  ") == ids()   # `%` y `_` son literales, no comodines
    p = client.get("/ateneos", params={"limit": 2, "offset": 2})
    assert [f["id"] for f in p.json()] == [c["id"], j["id"]] and p.headers["X-Total-Count"] == "4"
    r = client.get("/ateneos", params={"tipo": "meta"})
    assert r.status_code == 422 and _campos(r) == ["tipo"]


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


#: Sentencias de un `GET /ateneos`, medidas en la conexión de test: SAVEPOINT + usuario del token + total + página
#: (ateneo, grupo, NNA y las dos cantidades en una) + ROLLBACK TO SAVEPOINT. No depende de las filas.
CONSULTAS_GET_ATENEOS = 5


def test_la_lista_hace_siempre_las_mismas_consultas(client, conexion_api, escena, categorias):
    pocas = _consultas(conexion_api, lambda: client.get("/ateneos"))
    for i in range(6):
        a = _crear(client, _cuerpo(list(ATENEO_TIPOS)[i % 4], escena, acuerdos=[] if i % 4 == 3 else [{"acuerdo": "x"}] * (i % 3)))
        if i % 2:
            _subir_at(client, a["data"]["id"], categorias[OTRO])
    muchas = _consultas(conexion_api, lambda: client.get("/ateneos"))
    tecnico = _consultas(conexion_api, lambda: client.get("/ateneos", params={"q": "x"}, headers=escena["cab_otra"]))
    assert pocas == muchas == tecnico == CONSULTAS_GET_ATENEOS, (pocas, muchas, tecnico)


# ── Acceso ───────────────────────────────────────────────────────────────────
def test_un_clinico_ajeno_es_404_en_todas_sus_rutas_y_no_esta_en_la_lista(client, escena, categorias):
    cab = escena["cab_tina"]
    ajeno = _crear(client, _cuerpo("clinico", escena, hce_referida_id=escena["nna_ajeno"], grupo_id=escena["ajeno"].id,
                                   acuerdos=[{"acuerdo": "Uno"}]))["data"]
    propio = _crear(client, _cuerpo("clinico", escena))["data"]
    _subir_at(client, ajeno["id"], categorias[OTRO])
    falso = 9_999_001
    aid = ajeno["acuerdos"][0]["id"]
    rutas = [
        ("GET", "", None), ("PATCH", "", {"titulo": "x"}), ("POST", "/acuerdos", {"acuerdo": "x"}),
        ("PATCH", f"/acuerdos/{aid}", {"acuerdo": "x"}), ("GET", "/documentos", None), ("GET", "/documentos/1", None),
        ("GET", "/documentos/1/archivo", None),
    ]
    for metodo, ruta, cuerpo in rutas:
        real = client.request(metodo, f"/ateneos/{ajeno['id']}{ruta}", json=cuerpo, headers=cab)
        nada = client.request(metodo, f"/ateneos/{falso}{ruta}", json=cuerpo, headers=cab)
        assert real.status_code == nada.status_code == 404 and real.json() == nada.json(), (metodo, ruta, real.text)
    r = _subir_at(client, ajeno["id"], categorias[OTRO], headers=cab)
    assert r.status_code == 404 and r.json() == _subir_at(client, falso, categorias[OTRO], headers=cab).json()
    lista = client.get("/ateneos", headers=cab)
    assert [f["id"] for f in lista.json()] == [propio["id"]] and lista.headers["X-Total-Count"] == "1"
    assert client.get("/ateneos", params={"hce_referida_id": escena["nna_ajeno"]}, headers=cab).json() == []
    # el par: el clínico propio pasa en las mismas rutas, y el admin ve los dos
    assert client.get(f"/ateneos/{propio['id']}", headers=cab).status_code == 200
    assert client.patch(f"/ateneos/{propio['id']}", json={"titulo": "y"}, headers=cab).status_code == 200
    assert client.post(f"/ateneos/{propio['id']}/acuerdos", json={"acuerdo": "x"}, headers=cab).status_code == 201
    assert client.get("/ateneos").headers["X-Total-Count"] == "2"
    assert client.get(f"/ateneos/{ajeno['id']}").status_code == 200


@pytest.mark.parametrize("tipo", ["grupo", "institucional", "jornada"])
def test_los_no_clinicos_los_ve_y_los_edita_cualquier_tecnico(client, escena, tipo):
    """Acceso general (§5.58): un ateneo del grupo de Tina lo lee y lo edita Otra, que no es de ese grupo."""
    a = _crear(client, _cuerpo(tipo, escena), headers=escena["cab_tina"])["data"]
    cab = escena["cab_otra"]
    assert client.get(f"/ateneos/{a['id']}", headers=cab).status_code == 200
    assert a["id"] in [f["id"] for f in client.get("/ateneos", headers=cab).json()]
    assert client.patch(f"/ateneos/{a['id']}", json={"observaciones": "Lo editó otra técnica"}, headers=cab).status_code == 200
    if tipo != "jornada":
        assert client.post(f"/ateneos/{a['id']}/acuerdos", json={"acuerdo": "x"}, headers=cab).status_code == 201


def test_sin_token_es_401_en_todas_las_rutas(client, escena):
    a = _crear(client, _cuerpo("institucional", acuerdos=[{"acuerdo": "Uno"}]))["data"]
    anon = TestClient(app)
    for metodo, ruta in (("GET", "/ateneos"), ("POST", "/ateneos"), ("GET", "/ateneos/indicador"), ("GET", f"/ateneos/{a['id']}"),
                         ("PATCH", f"/ateneos/{a['id']}"), ("POST", f"/ateneos/{a['id']}/acuerdos"),
                         ("PATCH", f"/ateneos/{a['id']}/acuerdos/{a['acuerdos'][0]['id']}"),
                         ("GET", f"/ateneos/{a['id']}/documentos"), ("POST", f"/ateneos/{a['id']}/documentos")):
        assert anon.request(metodo, ruta, json={} if metodo != "GET" else None).status_code == 401, (metodo, ruta)


# ── Auditoría ────────────────────────────────────────────────────────────────
def test_la_auditoria_dice_el_codigo_sin_titulo_contenido_ni_id(client, escena, db_api, admin):
    a = _crear(client, _cuerpo("clinico", escena, titulo="Título privado", situacion="Contenido privado",
                               acuerdos=[{"acuerdo": "Acuerdo privado"}]))["data"]
    cargas = _filas(db_api, tipo="carga")
    assert [(f.detalle, f.hce_id, f.usuario_id) for f in cargas] == [("Ateneo AT-2026-001", None, admin.id)]
    r = client.patch(f"/ateneos/{a['id']}", json={"titulo": "Otro", "hipotesis": "Nueva", "fecha": "2026-09-18"})
    assert r.status_code == 200
    ediciones = _filas(db_api, tipo="edicion")
    assert sorted(f.campo for f in ediciones) == ["hipotesis", "titulo"]   # la fecha no cambió: sin fila
    assert {f.detalle for f in ediciones} == {"Ateneo AT-2026-001"} and all(f.hce_id is None for f in ediciones)
    assert client.patch(f"/ateneos/{a['id']}", json={"titulo": "Otro"}).status_code == 200
    assert len(_filas(db_api, tipo="edicion")) == 2                        # nada cambió: ninguna fila
    client.patch(f"/ateneos/{a['id']}", json={"grupo_id": None})
    fila = _filas(db_api, tipo="edicion", campo="grupo_id")[0]
    assert (fila.valor_ant, fila.valor_nuevo) == ("Escolares 2026", None)  # el grupo legible, no su id
    aid = a["acuerdos"][0]["id"]
    client.post(f"/ateneos/{a['id']}/acuerdos", json={"acuerdo": "Otro acuerdo"})
    client.patch(f"/ateneos/{a['id']}/acuerdos/{aid}", json={"acuerdo": "Corregido", "plazo": "2026-12-01"})
    assert [f.detalle for f in _filas(db_api, tipo="carga")][-1] == "Ateneo AT-2026-001 · acuerdo agregado"
    assert sorted(f.campo for f in _filas(db_api, tipo="edicion", detalle="Ateneo AT-2026-001 · acuerdo")) == ["acuerdo", "plazo"]
    for f in _filas(db_api):
        assert "privado" not in (f.detalle or "") and str(a["id"]) not in (f.detalle or "").replace("2026", "")


# ── Indicador ────────────────────────────────────────────────────────────────
def test_el_indicador_cuenta_por_fecha_sin_jornadas_por_grupo_y_sin_mirar_quien_pregunta(client, escena):
    propio, ajeno, viejo = escena["propio"], escena["ajeno"], escena["viejo"]
    _crear(client, _cuerpo("clinico", escena, hce_referida_id=escena["nna_ajeno"], grupo_id=ajeno.id))   # Tina no lo ve
    _crear(client, _cuerpo("grupo", escena))
    _crear(client, _cuerpo("grupo", escena, fecha="2026-02-10", grupo_id=viejo.id))   # cuenta 2026 en el total, no en Escolares 2026
    _crear(client, _cuerpo("institucional"))
    _crear(client, _cuerpo("jornada"))                                               # la jornada no suma
    _crear(client, _cuerpo("institucional", fecha="2025-12-20"))                     # código 2026, fecha 2025
    d = client.get("/ateneos/indicador", params={"anio": 2026}, headers=escena["cab_tina"]).json()
    assert (d["anio"], d["meta_total"], d["total"], d["meta_por_grupo"]) == (2026, 8, 4, 2)
    assert d["tipos_contados"] == ["clinico", "grupo", "institucional"]
    assert [(g["nombre"], g["anio"], g["cantidad"]) for g in d["grupos"]] == [("Escolares", 2026, 1), ("Inicial", 2026, 1)]
    d25 = client.get("/ateneos/indicador", params={"anio": 2025}).json()
    assert d25["total"] == 1 and [(g["nombre"], g["cantidad"]) for g in d25["grupos"]] == [("Escolares", 0)]
    assert client.get("/ateneos/indicador").json()["anio"] == 2026                     # por omisión, el año en curso


# ── Documentos del ateneo ────────────────────────────────────────────────────
def _subir_at(client, ateneo_id, cat, contenido=PDF, nombre_archivo="acta.pdf", ctype="application/pdf", headers=None, **campos):
    datos = {"categoria_id": str(cat), **campos}
    return client.post(f"/ateneos/{ateneo_id}/documentos", files={"archivo": (nombre_archivo, contenido, ctype)}, data=datos, headers=headers)


def test_un_pdf_en_un_institucional_se_lista_y_se_descarga_con_las_cabeceras_de_c5(client, escena, categorias, db_api):
    a = _crear(client, _cuerpo("institucional"))["data"]
    r = _subir_at(client, a["id"], categorias[OTRO], nombre="Acta firmada", fecha_original="2026-04-16")
    assert r.status_code == 201, r.text
    d = r.json()["data"]
    assert (d["nombre"], d["tipo"], d["es_registro_historico"], d["fecha_carga"]) == ("Acta firmada", "pdf", False, HOY.isoformat())
    db_api.expire_all()
    fila = db_api.get(Documento, d["id"])
    assert fila.hce_id is None and fila.ateneo_id == a["id"] and fila.archivo_ref.startswith(f"ateneo/{a['id']}/")
    lista = client.get(f"/ateneos/{a['id']}/documentos")
    assert [x["id"] for x in lista.json()] == [d["id"]] and lista.headers["X-Total-Count"] == "1"
    assert client.get(f"/ateneos/{a['id']}").json()["documentos"] == 1
    assert client.get("/ateneos").json()[0]["documentos"] == 1
    baja = client.get(f"/ateneos/{a['id']}/documentos/{d['id']}/archivo")
    assert baja.status_code == 200 and baja.content == PDF and baja.headers["content-type"] == "application/pdf"
    assert baja.headers["content-disposition"].startswith("attachment;") and "Acta%20firmada.pdf" in baja.headers["content-disposition"]
    assert baja.headers["x-content-type-options"] == "nosniff" and baja.headers["cache-control"] == "no-store"
    carga = _filas(db_api, tipo="carga")[-1]
    assert carga.detalle == f"Ateneo AT-2026-001 · documento de la categoría «{OTRO}» cargado el {HOY.isoformat()}"
    assert "Acta" not in carga.detalle
    # un documento de un ateneo no se ve desde otro ni desde un expediente
    otro = _crear(client, _cuerpo("institucional"))["data"]
    assert client.get(f"/ateneos/{otro['id']}/documentos/{d['id']}").status_code == 404


def test_una_categoria_historica_es_422_y_una_comun_pasa(client, escena, categorias):
    a = _crear(client, _cuerpo("institucional"))["data"]
    r = _subir_at(client, a["id"], categorias[HISTORICO])
    assert r.status_code == 422 and _campos(r) == ["categoria_id"]
    assert _subir_at(client, a["id"], categorias[OTRO]).status_code == 201


def test_un_html_o_un_campo_extra_son_422(client, escena, categorias):
    a = _crear(client, _cuerpo("institucional"))["data"]
    r = _subir_at(client, a["id"], categorias[OTRO], contenido=b"<html></html>", nombre_archivo="x.pdf")
    assert r.status_code == 422 and _campos(r) == ["archivo"]
    r = _subir_at(client, a["id"], categorias[OTRO], es_registro_historico="true")
    assert r.status_code == 422 and _campos(r) == ["es_registro_historico"]


def test_la_subida_de_un_ateneo_tiene_el_tope_de_las_subidas(client, escena):
    from app.core.limites import TOPE_JSON, TOPE_SUBIDA, tope_de

    assert tope_de("POST", "/ateneos/7/documentos") == TOPE_SUBIDA and tope_de("POST", "/ateneos") == TOPE_JSON
    a = _crear(client, _cuerpo("institucional"))["data"]
    r = client.post(f"/ateneos/{a['id']}/documentos", content=b"", headers={"Content-Length": str(TOPE_SUBIDA + 1), "Content-Type": "multipart/form-data; boundary=x"})
    assert r.status_code == 413 and r.json()["detail"][0]["campo"] == "archivo"


# ── PPTX (§5.158 i) ──────────────────────────────────────────────────────────
def _zip(partes: dict[str, str | bytes]) -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for nombre, texto in partes.items():
            zf.writestr(nombre, texto)
    return buf.getvalue()


def _office(principal: str, parte: str = "/ppt/presentation.xml") -> bytes:
    tipos = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
             '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
             '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
             '<Default Extension="xml" ContentType="application/xml"/>'
             f'<Override PartName="{parte}" ContentType="{principal}"/></Types>')
    return _zip({"[Content_Types].xml": tipos, parte.lstrip("/"): "<p:presentation xmlns:p='x'/>", "_rels/.rels": "<Relationships/>"})


PPTX = _office(PPTX_TIPO_PRINCIPAL)
PPTM = _office("application/vnd.ms-powerpoint.presentation.macroEnabled.main+xml")
DOCX = _office("application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml", "/word/document.xml")
MIME_PPTX = "application/vnd.openxmlformats-officedocument.presentationml.presentation"


def test_un_pptx_real_se_acepta_en_un_ateneo_y_se_descarga_como_pptx(client, escena, categorias, db_api):
    a = _crear(client, _cuerpo("jornada"))["data"]
    r = _subir_at(client, a["id"], categorias[OTRO], contenido=PPTX, nombre_archivo="jornada.pptx", ctype=MIME_PPTX)
    assert r.status_code == 201, r.text
    d = r.json()["data"]
    assert d["tipo"] == "pptx" and d["nombre"] == "jornada.pptx"
    db_api.expire_all()
    assert db_api.get(Documento, d["id"]).archivo_ref.endswith(".pptx")
    baja = client.get(f"/ateneos/{a['id']}/documentos/{d['id']}/archivo")
    assert baja.status_code == 200 and baja.content == PPTX and baja.headers["content-type"] == MIME_PPTX
    assert baja.headers["content-disposition"].startswith("attachment;") and "jornada.pptx" in baja.headers["content-disposition"]


@pytest.mark.parametrize("contenido", [
    PPTM, DOCX, _zip({"ppt/presentation.xml": "<x/>"}), b"PK\x03\x04" + b"\x00" * 60,
    _zip({"[Content_Types].xml": f'<!DOCTYPE x [<!ENTITY a "b">]><Types><Override ContentType="{PPTX_TIPO_PRINCIPAL}"/></Types>'}),
    _zip({"[Content_Types].xml": "<Types><Override"}),
], ids=["pptm", "docx", "zip-sin-content-types", "zip-roto", "con-doctype", "xml-roto"])
def test_lo_que_no_es_un_pptx_sin_macros_es_422_y_el_pptx_pasa(client, escena, categorias, contenido):
    a = _crear(client, _cuerpo("institucional"))["data"]
    r = _subir_at(client, a["id"], categorias[OTRO], contenido=contenido, nombre_archivo="x.pptx", ctype=MIME_PPTX)
    assert r.status_code == 422 and _campos(r) == ["archivo"], r.text
    assert _subir_at(client, a["id"], categorias[OTRO], contenido=PPTX, nombre_archivo="x.pptx").status_code == 201


_TIPOS_XML = ('<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
              f'<Override PartName="/ppt/presentation.xml" ContentType="{PPTX_TIPO_PRINCIPAL}"/></Types>')
_DOCTYPE = '<!DOCTYPE Types [<!ENTITY a "b">]>'


def _ct_utf16(cuerpo: str, codec: str) -> bytes:
    """Un PPTX cuyo `[Content_Types].xml` está en UTF-16 (el filtro de bytes `<!DOCTYPE` no lo ve)."""
    return _zip({"[Content_Types].xml": cuerpo.encode(codec), "ppt/presentation.xml": "<p:presentation xmlns:p='x'/>"})


@pytest.mark.parametrize("codec", ["utf-16", "utf-16-le", "utf-16-be"])
def test_un_content_types_en_utf16_con_doctype_es_422_y_sin_doctype_pasa(client, escena, categorias, codec):
    a = _crear(client, _cuerpo("institucional"))["data"]
    con = _ct_utf16(f'<?xml version="1.0"?>{_DOCTYPE}{_TIPOS_XML}', codec)
    sin = _ct_utf16(f'<?xml version="1.0"?>{_TIPOS_XML}', codec)
    r = _subir_at(client, a["id"], categorias[OTRO], contenido=con, nombre_archivo="x.pptx", ctype=MIME_PPTX)
    assert r.status_code == 422 and _campos(r) == ["archivo"], r.text
    assert _subir_at(client, a["id"], categorias[OTRO], contenido=sin, nombre_archivo="x.pptx", ctype=MIME_PPTX).status_code == 201


def test_un_subconjunto_interno_con_entity_es_422_y_el_pptx_valido_pasa(client, escena, categorias):
    """En UTF-8 y en UTF-16: la declaración de la entidad corta el parseo, no se expande nada."""
    a = _crear(client, _cuerpo("institucional"))["data"]
    for contenido in (_zip({"[Content_Types].xml": f'{_DOCTYPE}{_TIPOS_XML}'}), _ct_utf16(f'{_DOCTYPE}{_TIPOS_XML}', "utf-16")):
        r = _subir_at(client, a["id"], categorias[OTRO], contenido=contenido, nombre_archivo="x.pptx", ctype=MIME_PPTX)
        assert r.status_code == 422 and _campos(r) == ["archivo"], r.text
    assert _subir_at(client, a["id"], categorias[OTRO], contenido=PPTX, nombre_archivo="x.pptx", ctype=MIME_PPTX).status_code == 201


def test_tipos_declarados_lee_los_content_type_y_rechaza_doctype_y_entidades():
    from app.services.archivos import _tipos_declarados
    assert _tipos_declarados(_TIPOS_XML.encode("utf-8")) == [PPTX_TIPO_PRINCIPAL]
    assert _tipos_declarados(_TIPOS_XML.encode("utf-16")) == [PPTX_TIPO_PRINCIPAL]
    assert _tipos_declarados(f"{_DOCTYPE}{_TIPOS_XML}".encode("utf-16-le")) is None
    assert _tipos_declarados(f'<!DOCTYPE Types SYSTEM "http://x/y.dtd">{_TIPOS_XML}'.encode("utf-16-be")) is None
    assert _tipos_declarados(b"<Types><Override") is None


def test_un_content_types_enorme_es_422_sin_leerlo_entero(client, escena, categorias):
    enorme = f'<Types><Override ContentType="{PPTX_TIPO_PRINCIPAL}"/>' + " " * (300 * 1024) + "</Types>"
    a = _crear(client, _cuerpo("institucional"))["data"]
    r = _subir_at(client, a["id"], categorias[OTRO], contenido=_zip({"[Content_Types].xml": enorme}))
    assert r.status_code == 422 and _campos(r) == ["archivo"]


def test_un_pptx_en_un_documento_del_expediente_sigue_siendo_422(client, escena, categorias):
    """Los documentos del expediente siguen en PDF, JPG o PNG (§5.155 b): un .pptx, aunque se llame .pdf, es 422."""
    r = _subir(client, escena["nna_propio"], categorias[OTRO], contenido=PPTX, nombre_archivo="informe.pdf")
    assert r.status_code == 422 and _campos(r) == ["archivo"] and "PDF, JPG o PNG" in r.json()["detail"][0]["mensaje"]
    assert _subir(client, escena["nna_propio"], categorias[OTRO]).status_code == 201


def test_la_ref_de_un_pptx_solo_es_valida_bajo_ateneo():
    from app.services.archivos import REF_VALIDA

    uuid = "0" * 32
    assert REF_VALIDA.match(f"ateneo/3/{uuid}.pptx") and REF_VALIDA.match(f"ateneo/3/{uuid}.pdf")
    assert not REF_VALIDA.match(f"hce/3/{uuid}.pptx") and not REF_VALIDA.match(f"grupo/3/{uuid}.pptx")
    assert not REF_VALIDA.match(f"ateneo/../{uuid}.pdf") and not REF_VALIDA.match(f"ateneo/0/{uuid}.pdf")
