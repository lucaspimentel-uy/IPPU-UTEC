"""M11.5-a · seed espejo de la demo vía la API = **criterio §12-A ejecutable** (`esquema-datos-v2.md`).

Corre `app.seed_demo.cargar_demo` contra la base de test con el `TestClient` y verifica **sólo por
GET**, con los números tal como los devuelve la API:

    usuario demo 1 = Martín (102) → IDEA 58 (18/14/14/12) · PA 60 · PB 79 · Δ total +19 (4/6/4/5), sin alerta.

La base de test no tiene catálogos: el fixture los siembra con `app.seed_catalogos.run` (los mismos
que la base de desarrollo, incluidos los cinco grupos reales de 2026).
"""
from datetime import date, timedelta

import pytest

from app import seed_catalogos
from app.seed_demo import (
    ANIO, GONZALEZ, NNA, TORRES, UBICACION_DEMO, DemoNoCargable, cargar_demo, ejecutar, preparar_usuarios,
)
from tests.conftest import EMAIL_ADMIN, PASSWORD_TEST, _fabrica_sesiones


@pytest.fixture
def catalogos(db_api):
    seed_catalogos.run(db=db_api, verboso=False)
    db_api.commit()


@pytest.fixture
def hash_rapido(monkeypatch):
    """bcrypt con costo 4 para los usuarios que crea `preparar_usuarios`: con el costo 12 de
    producción, los ~8 logins por test sumaban un minuto a la suite. El camino es el mismo."""
    import bcrypt

    import app.crear_usuario

    monkeypatch.setattr(
        app.crear_usuario, "hashear_password",
        lambda p: bcrypt.hashpw(p.encode(), bcrypt.gensalt(rounds=4)).decode(),
    )


@pytest.fixture
def usuarios(db_api, admin, catalogos, hash_rapido):
    preparar_usuarios(db_api, admin_email=EMAIL_ADMIN, admin_password=PASSWORD_TEST, demo_password=PASSWORD_TEST)
    db_api.commit()


@pytest.fixture
def demo(client, usuarios):
    return cargar_demo(client, admin_email=EMAIL_ADMIN, admin_password=PASSWORD_TEST, demo_password=PASSWORD_TEST)


@pytest.fixture
def como_gonzalez(client, demo):
    r = client.post("/auth/login", json={"email": GONZALEZ["email"], "password": PASSWORD_TEST})
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


# ── §12-A: Martín ────────────────────────────────────────────────────────────
def test_12a_idea_de_martin(client, demo):
    idea = client.get(f"/idea/{demo.ids['102.lb']}").json()
    assert (idea["total"], idea["esc_a"], idea["esc_b"], idea["esc_c"], idea["esc_d"]) == (58, 18, 14, 14, 12)
    assert idea["firmado"] is True and idea["anio"] == ANIO
    assert {f["profesional_id"] for f in idea["firmas"]} == set(demo.profesionales.values())


def test_12a_protocolos_y_delta_de_martin(client, demo):
    pa = client.get(f"/protocolo/{demo.ids['102.pa']}").json()
    pb = client.get(f"/protocolo/{demo.ids['102.pb']}").json()
    assert (pa["total"], pa["firmado"]) == (60, True)
    assert (pb["total"], pb["firmado"]) == (79, True)
    assert pb["deltas"] == {"total": 19, "esc_1": 4, "esc_2": 6, "esc_3": 4, "esc_4": 5}
    assert pb["alertas"] == []
    assert not [w for w in demo.warnings if w["code"] == "alerta"]


def test_c1_martin_tiene_la_firma_de_lb_pa_pb_e_ic_en_su_rastro(client, demo):
    """C1: el HCE-LOG de Martín sale de las escrituras que el seed ya hace por la API (no se insertó nada)."""
    r = client.get(f"/hce/{demo.expedientes[102]}/auditoria", params={"tipo": "firma", "limit": 200})
    assert {f["modulo"] for f in r.json()} >= {"HCE-LB", "HCE-PA", "HCE-PB", "HCE-IC"}
    assert all(f["usuario"] for f in r.json())


def test_c2_martin_y_valentina_tienen_severidad_y_los_demas_no(client, demo):
    """C2: Martín con los dos dominios distintos, otro expediente con registro, el resto en el estado vacío.
    La registró el técnico del grupo (autor = usuario del token), con etiquetas del catálogo."""
    martin = client.get(f"/hce/{demo.expedientes[102]}/severidad")
    assert martin.status_code == 200, martin.text
    m = martin.json()
    assert m["nivel_cs"] != m["nivel_crr"] and m["etiqueta_cs"] and m["etiqueta_crr"]
    assert m["profesional"]["nombre"] == GONZALEZ["nombre"]
    assert client.get(f"/hce/{demo.expedientes[103]}/severidad").status_code == 200
    sin = [d for d in NNA if client.get(f"/hce/{demo.expedientes[d]}/severidad").status_code == 404]
    assert sorted(sin) == [101, 104, 105, 106, 107, 108]
    assert demo.severidad == ["Martín", "Valentina"]


@pytest.mark.parametrize("demo_id", [102, 103])
def test_c2_la_justificacion_sembrada_no_cita_puntajes_del_idea_ni_de_la_ippu_tea(client, demo, demo_id):
    """El nivel no se deriva del IDEA ni de la Escala IPPU-TEA: la justificación tampoco los nombra ni da cifras."""
    texto = client.get(f"/hce/{demo.expedientes[demo_id]}/severidad").json()["justificacion"]
    assert not any(p in texto.lower() for p in ("idea", "ippu-tea", "protocolo", "puntaje", "/96", "/120"))
    assert not any(c.isdigit() for c in texto)


def test_c3_martin_sofia_y_joaquin_tienen_organismos_y_los_demas_no(client, demo):
    """C3: Martín con INAU (dos envíos) y la AYEX vigente lejos del vencimiento; Sofía con la AYEX en trámite a
    25 días (alerta de 30) y una gestión; Joaquín con INAU y sin envíos. Los cargó el técnico del grupo."""
    def org(demo_id):
        return client.get(f"/hce/{demo.expedientes[demo_id]}/organismos").json()

    def registros(demo_id):
        return client.get(f"/hce/{demo.expedientes[demo_id]}/organismos/registros").json()

    hoy = date.today()
    martin = org(102)
    assert martin["inau"]["convenio"] and martin["inau"]["referente"] and martin["inau"]["ingreso"]
    assert martin["bps"]["prestacion"] == "Ayuda Extraordinaria (AYEX)" and martin["bps"]["estado"] == "Vigente"
    assert date.fromisoformat(martin["bps"]["vencimiento"]).year >= 2027 and martin["bps"]["alerta"] is None
    assert [r["organismo"] for r in registros(102)] == ["inau", "inau"]
    assert {r["autor"]["nombre"] for r in registros(102)} == {GONZALEZ["nombre"]}

    sofia = org(101)
    assert sofia["inau"] is None and sofia["bps"]["estado"] == "En trámite"
    assert sofia["bps"]["vencimiento"] == (hoy + timedelta(days=25)).isoformat()
    assert (sofia["bps"]["alerta"]["nivel"], sofia["bps"]["alerta"]["dias"]) == ("30_dias", 25)
    assert [r["organismo"] for r in registros(101)] == ["bps"]

    joaquin = org(104)
    assert joaquin["inau"]["ingreso"] and joaquin["bps"] is None and registros(104) == []

    sin = [d for d in NNA if org(d) == {"inau": None, "bps": None}]
    assert sorted(sin) == [103, 105, 106, 107, 108]
    assert demo.organismos == ["Martín", "Sofía", "Joaquín"]


def test_c3_el_organismo_sembrado_deja_su_rastro_en_el_log(client, demo):
    filas = client.get(f"/hce/{demo.expedientes[102]}/auditoria", params={"modulo": "HCE-ORG", "limit": 200}).json()
    assert len(filas) == 4 and {f["tipo"] for f in filas} == {"carga"}  # INAU, BPS y dos envíos
    assert all(f["usuario"]["nombre"] == GONZALEZ["nombre"] for f in filas)


def test_12a_informe_de_cierre_firmado_con_recibi_y_documento(client, demo):
    ic = client.get(f"/informe-cierre/{demo.ids['102.ic']}").json()
    assert ic["firmado"] is True
    assert ic["recibi"] == {"firmante": "Pablo G. (padre)", "fecha": "2026-11-13"}

    doc = client.get(f"/informe-cierre/{demo.ids['102.ic']}/documento").json()
    assert doc["expediente"]["nombre"] == "Martín" and doc["expediente"]["grupo"]["nombre"] == "Escolares"
    assert (doc["idea"]["total"], doc["idea"]["esc_a"], doc["idea"]["esc_b"], doc["idea"]["esc_c"], doc["idea"]["esc_d"]) == (58, 18, 14, 14, 12)
    assert doc["protocolos"]["a"]["total"] == 60
    assert doc["protocolos"]["b"]["total"] == 79
    assert doc["protocolos"]["deltas"] == {"total": 19, "esc_1": 4, "esc_2": 6, "esc_3": 4, "esc_4": 5}
    assert doc["protocolos"]["alertas"] == []
    assert [f["nombre"] for f in doc["informe"]["firmas"]] == [GONZALEZ["nombre"], TORRES["nombre"]]


# ── Estado de flujo de cada arquetipo ────────────────────────────────────────
ESPERADO = {
    #       CI            LB             PA             PB             IC
    102: ("registrado", "firmado",     "firmado",     "firmado",     "firmado"),
    101: ("registrado", "firmado",     "en_curso",    "sin_iniciar", "sin_iniciar"),
    104: ("registrado", "en_curso",    "sin_iniciar", "sin_iniciar", "sin_iniciar"),
    107: ("pendiente",  "sin_iniciar", "sin_iniciar", "sin_iniciar", "sin_iniciar"),
    103: ("registrado", "firmado",     "sin_iniciar", "sin_iniciar", "sin_iniciar"),
    105: ("registrado", "firmado",     "sin_iniciar", "sin_iniciar", "sin_iniciar"),
    108: ("registrado", "firmado",     "sin_iniciar", "sin_iniciar", "sin_iniciar"),
    106: ("pendiente",  "sin_iniciar", "sin_iniciar", "sin_iniciar", "sin_iniciar"),
}


@pytest.mark.parametrize("demo_id", sorted(ESPERADO))
def test_flujo_de_cada_arquetipo(client, demo, demo_id):
    flujo = client.get(f"/hce/{demo.expedientes[demo_id]}/flujo", params={"anio": ANIO}).json()
    obtenido = (flujo["ci"], *(m["estado"] for m in flujo["modulos"]))
    assert obtenido == ESPERADO[demo_id]


def test_los_borradores_conservan_lo_cargado(client, demo):
    joaquin = client.get(f"/idea/{demo.ids['104.lb']}").json()
    assert joaquin["dim"]["D3"]["valor"] == "NS" and joaquin["dim"]["D12"]["valor"] == "NS"
    assert joaquin["dim"]["D3"]["obs"].startswith("NS: se requiere más observación")
    sofia_pa = client.get(f"/protocolo/{demo.ids['101.pa']}").json()
    assert (sofia_pa["puntuados"], sofia_pa["semanas"], sofia_pa["fecha"]) == (24, 16, None)


def test_tomas_queda_dado_de_baja(client, demo):
    tomas = client.get(f"/hce/{demo.expedientes[106]}").json()
    assert (tomas["activo"], tomas["fecha_baja"]) == (False, "2026-05-20")


def test_datos_de_identidad_verbatim(client, demo):
    for demo_id, nna in NNA.items():
        persona = client.get(f"/hce/{demo.expedientes[demo_id]}").json()["persona"]
        esperado = nna["persona"]
        assert (persona["nombre"], persona["apellido"], persona["fecha_nac"]) == (
            esperado["nombre"], esperado["apellido"], esperado["fecha_nac"])
        assert persona["ci"] == "".join(c for c in esperado["ci"] if c.isalnum())  # canónica (§5.110)


# ── Grupos (§5.120) ──────────────────────────────────────────────────────────
@pytest.mark.parametrize("grupo, cantidad", [("Escolares", 3), ("Preadolescentes", 3), ("Adolescentes", 2)])
def test_cada_grupo_lista_sus_nna(client, demo, grupo, cantidad):
    # `incluir_inactivos`: Tomás (Adolescentes) está dado de baja y la búsqueda lo excluye por omisión.
    r = client.get("/hce", params={"grupo": grupo, "anio": ANIO, "incluir_inactivos": "true"})
    nombres = {h["persona"]["nombre"] for h in r.json()}
    esperados = {n["persona"]["nombre"] for n in NNA.values() if UBICACION_DEMO[n["color"]] == grupo}
    assert len(r.json()) == cantidad and nombres == esperados


def test_los_dos_tecnicos_quedan_asignados_a_los_tres_grupos(client, demo, db_api):
    """Los dos técnicos, con su rol, en cada uno de los tres grupos. Se leen de la fila `grupo`:
    `GET /grupos` es una lista de referencia (`id`, `nombre`, `anio`) y no expone los técnicos."""
    from sqlalchemy import select

    from app.models.identidad import Grupo

    gonzalez, torres = demo.profesionales[GONZALEZ["nombre"]], demo.profesionales[TORRES["nombre"]]
    assert gonzalez != torres
    db_api.expire_all()
    filas = {g.nombre: g for g in db_api.scalars(select(Grupo).where(Grupo.id.in_(demo.grupos.values())))}
    assert set(filas) == {"Escolares", "Preadolescentes", "Adolescentes"}
    for nombre, g in filas.items():
        assert (g.tecnico1_id, g.tecnico1_rol, g.tecnico2_id, g.tecnico2_rol) == (
            gonzalez, GONZALEZ["especialidad"], torres, TORRES["especialidad"]), nombre
    # Y en `GET /grupos` aparecen los tres, con el id que se asignó.
    por_id = {g["id"]: g["nombre"] for g in client.get("/grupos", params={"anio": ANIO}).json()}
    assert {por_id[i] for i in demo.grupos.values()} == set(demo.grupos)


@pytest.mark.parametrize("tecnico", [GONZALEZ, TORRES], ids=["gonzalez", "torres"])
def test_cada_tecnico_alcanza_un_expediente_de_cada_grupo(client, demo, tecnico):
    """La asignación se ve en el alcance (§5.101): cada técnico, con su propio token, lee un
    expediente de cada uno de los tres grupos y los 8 en la búsqueda."""
    r = client.post("/auth/login", json={"email": tecnico["email"], "password": PASSWORD_TEST})
    assert r.status_code == 200, r.text
    cab = {"Authorization": f"Bearer {r.json()['access_token']}"}
    for grupo in demo.grupos:
        demo_id = next(i for i, n in NNA.items() if UBICACION_DEMO[n["color"]] == grupo)
        leido = client.get(f"/hce/{demo.expedientes[demo_id]}", headers=cab)
        assert leido.status_code == 200, (grupo, leido.text)
        assert leido.json()["grupo"]["nombre"] == grupo
    vistos = client.get("/hce", params={"incluir_inactivos": "true"}, headers=cab)
    assert int(vistos.headers["X-Total-Count"]) == len(NNA)


# ── Avisos esperados: no bloquean ────────────────────────────────────────────
def test_las_sintesis_cortas_de_la_demo_avisan_sin_bloquear(demo):
    """Los textos de la demo son más cortos que los recomendados del §4.3 (§5.117 a, §5.118 c): cada
    uno avisa `recomendacion_no_cumplida` y **todo se firma igual**. Ninguna otra clase de aviso."""
    avisos = [(w["code"], w["modulo"], w["recomendacion"]) for w in demo.warnings]
    r = "recomendacion_no_cumplida"
    assert avisos == [
        (r, "HCE-LB", "sintesis"),                                            # Martín
        (r, "HCE-PA", "sint_tec1"), (r, "HCE-PA", "sint_tec2"),
        (r, "HCE-PB", "sint_tec1"), (r, "HCE-PB", "sint_tec2"),
        *[(r, "HCE-IC", f"sint_escala.esc_{n}") for n in (1, 2, 3, 4)],
        (r, "HCE-LB", "sintesis"),                                            # Sofía
        *[(r, "HCE-LB", "sintesis")] * 3,                                     # LB_OTROS
    ]
    # 6 CI · LB de Martín, Sofía y los 3 otros · PA, PB e IC de Martín: firmados pese a los avisos.
    assert len(demo.firmados) == 6 + 5 + 3


# ── Alcance ──────────────────────────────────────────────────────────────────
def test_un_tecnico_sin_grupo_no_ve_a_martin_y_el_admin_si(client, demo, crear_profesional, hash_test, token_de):
    ajeno = crear_profesional(nombre="Técnico sin grupo", hashed_password=hash_test)
    martin = demo.expedientes[102]
    assert client.get(f"/hce/{martin}", headers=token_de(ajeno)).status_code == 404
    assert client.get(f"/idea/{demo.ids['102.lb']}", headers=token_de(ajeno)).status_code == 404
    assert client.get(f"/hce/{martin}").status_code == 200  # `client` entra como admin


# ── Segunda corrida ──────────────────────────────────────────────────────────
def test_una_segunda_corrida_aborta_sin_escribir(client, demo, db_api):
    from sqlalchemy import func, select

    from app.models.identidad import HceDiurna
    from app.models.transversales import Auditoria

    antes = (db_api.scalar(select(func.count(HceDiurna.id))), db_api.scalar(select(func.count(Auditoria.id))))
    with pytest.raises(DemoNoCargable, match="ya está cargada"):
        cargar_demo(client, admin_email=EMAIL_ADMIN, admin_password=PASSWORD_TEST, demo_password=PASSWORD_TEST)
    db_api.expire_all()
    assert (db_api.scalar(select(func.count(HceDiurna.id))), db_api.scalar(select(func.count(Auditoria.id)))) == antes


def test_sin_los_grupos_reales_no_escribe_nada(client, admin, db_api, hash_rapido):
    """Sin `seed_catalogos` no hay grupos: se detiene antes de la primera escritura."""
    preparar_usuarios(db_api, admin_email=EMAIL_ADMIN, admin_password=PASSWORD_TEST, demo_password=PASSWORD_TEST)
    db_api.commit()
    with pytest.raises(DemoNoCargable, match="Faltan los grupos"):
        cargar_demo(client, admin_email=EMAIL_ADMIN, admin_password=PASSWORD_TEST, demo_password=PASSWORD_TEST)
    assert client.get("/hce", params={"incluir_inactivos": "true"}).json() == []


# ── CLI (M11.5-a-fix): los grupos se comprueban ANTES del bootstrap de usuarios ──
@pytest.fixture
def cliente_sin_usuarios(conexion_api):
    """`TestClient` contra la base de test **sin ningún profesional** (el `client` de conftest crea
    el admin): es la base recién migrada de la CLI."""
    from fastapi.testclient import TestClient

    from app.core.database import get_db
    from app.main import app

    sesiones = _fabrica_sesiones(conexion_api)

    def _get_db():
        with sesiones() as sesion:
            yield sesion

    app.dependency_overrides[get_db] = _get_db
    try:
        yield TestClient(app), sesiones
    finally:
        app.dependency_overrides.pop(get_db, None)


def _profesionales(sesiones) -> int:
    from sqlalchemy import func, select

    from app.models.identidad import Profesional

    with sesiones() as db:
        return db.scalar(select(func.count(Profesional.id)))


def test_cli_sin_grupos_sale_con_1_y_no_crea_usuarios(cliente_sin_usuarios, hash_rapido, capsys):
    cliente, sesiones = cliente_sin_usuarios
    assert _profesionales(sesiones) == 0
    codigo = ejecutar(cliente, sesiones, admin_email=EMAIL_ADMIN, admin_password=PASSWORD_TEST,
                      demo_password=PASSWORD_TEST)
    assert codigo == 1
    assert _profesionales(sesiones) == 0
    err = capsys.readouterr().err
    assert "Faltan los grupos" in err and "python -m app.seed_catalogos" in err


def test_cli_con_grupos_crea_los_usuarios_y_carga_la_demo(cliente_sin_usuarios, hash_rapido, db_api, capsys):
    """El par: con `seed_catalogos`, la misma base y el mismo camino terminan con código 0."""
    cliente, sesiones = cliente_sin_usuarios
    seed_catalogos.run(db=db_api, verboso=False)
    db_api.commit()
    codigo = ejecutar(cliente, sesiones, admin_email=EMAIL_ADMIN, admin_password=PASSWORD_TEST,
                      demo_password=PASSWORD_TEST)
    salida = capsys.readouterr()
    assert codigo == 0, salida.err
    assert _profesionales(sesiones) == 3
    assert "Expedientes: 8" in salida.out
    assert "Severidad DSM-5-TR registrada (2): Martín, Valentina" in salida.out
    assert "Organismos (INAU/BPS) registrados (3): Martín, Sofía, Joaquín" in salida.out
    assert PASSWORD_TEST not in salida.out + salida.err


# ── B-front-fix: la lista dice lo mismo que el endpoint de flujo, para TODO lo sembrado ──────────
def test_la_lista_coincide_con_el_flujo_de_cada_expediente_sembrado(client, demo):
    filas = client.get("/hce", params={"incluir_inactivos": True, "limit": 200}).json()
    assert {f["id"] for f in filas} == set(demo.expedientes.values())  # los 8, con Tomás (baja)
    for f in filas:
        flujo = client.get(f"/hce/{f['id']}/flujo").json()
        assert f["flujo"] == [{"modulo": m["modulo"], "estado": m["estado"]} for m in flujo["modulos"]], f["id"]
        assert f["ci"] == flujo["ci"], f["id"]
    por_demo = {d: next(f for f in filas if f["id"] == i) for d, i in demo.expedientes.items()}
    # Martín (102): PB e IC firmados; Bruno (107): sin CI.
    assert [m["estado"] for m in por_demo[102]["flujo"]] == ["firmado"] * 4 and por_demo[102]["ci"] == "registrado"
    assert por_demo[107]["ci"] == "pendiente" and {m["estado"] for m in por_demo[107]["flujo"]} == {"sin_iniciar"}
