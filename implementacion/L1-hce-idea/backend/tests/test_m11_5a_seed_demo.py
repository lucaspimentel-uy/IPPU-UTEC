"""M11.5-a · seed espejo de la demo vía la API = **criterio §12-A ejecutable** (`esquema-datos-v2.md`).

Corre `app.seed_demo.cargar_demo` contra la base de test con el `TestClient` y verifica **sólo por
GET**, con los números tal como los devuelve la API:

    usuario demo 1 = Martín (102) → IDEA 58 (18/14/14/12) · PA 60 · PB 79 · Δ total +19 (4/6/4/5), sin alerta.

La base de test no tiene catálogos: el fixture los siembra con `app.seed_catalogos.run` (los mismos
que la base de desarrollo, incluidos los cinco grupos reales de 2026).
"""
import pytest

from app import seed_catalogos
from app.seed_demo import (
    ANIO, GONZALEZ, NNA, TORRES, UBICACION_DEMO, DemoNoCargable, cargar_demo, preparar_usuarios,
)
from tests.conftest import EMAIL_ADMIN, PASSWORD_TEST


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


def test_12a_informe_de_cierre_firmado_con_recibi_y_documento(client, demo):
    ic = client.get(f"/informe-cierre/{demo.ids['102.ic']}").json()
    assert ic["firmado"] is True
    assert ic["recibi"] == {"firmante": "Pablo G. (padre)", "fecha": "2026-12-19"}

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


def test_los_dos_tecnicos_quedan_asignados_a_los_tres_grupos(client, demo):
    grupos = {g["id"]: g for g in client.get("/grupos", params={"anio": ANIO}).json()}
    assert set(demo.grupos) == {"Escolares", "Preadolescentes", "Adolescentes"}
    gonzalez, torres = demo.profesionales[GONZALEZ["nombre"]], demo.profesionales[TORRES["nombre"]]
    for grupo_id in demo.grupos.values():
        assert grupos[grupo_id]  # existe en el año
    # La asignación se ve en el alcance: González (tecnico) lee los 8 expedientes.
    r = client.post("/auth/login", json={"email": GONZALEZ["email"], "password": PASSWORD_TEST})
    cab = {"Authorization": f"Bearer {r.json()['access_token']}"}
    vistos = client.get("/hce", params={"incluir_inactivos": "true"}, headers=cab)
    assert int(vistos.headers["X-Total-Count"]) == len(NNA)
    assert gonzalez != torres


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
