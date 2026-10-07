"""M11.3-d1-fix · cierre de la revisión de d1 (§5.119): clave de firma obligatoria, autor de la
addenda = usuario del token, `usuario_id` de la firma, 409 de unicidad genérico para `tecnico`,
tiempo del login y la matriz de visibilidad por grupo.

Convención de la suite: **todo rechazo va emparejado con el caso que pasa**.
"""
import itertools

import pytest
from pydantic import ValidationError
from sqlalchemy import func, select

from app.core import seguridad
from app.core.config import SECRET_KEY_PROHIBIDA, Settings
from app.models.transversales import Auditoria
from app.routers.hce import MENSAJE_DUPLICADO_TECNICO
from tests.conftest import PASSWORD_TEST
from tests.test_m11_3c_protocolo_ic import (  # noqa: F401  (`equipo` y `tramos` son fixtures)
    _ic, _idea_firmada, _prot, equipo, tramos,
)
from tests.test_m11_3d1_firmas_vf import baremo  # noqa: F401  (fixture)
from tests.test_m11_3d1_login_listado import grupos, sin_token, tecnico  # noqa: F401  (fixtures)

_cis = itertools.count(9_100_000)
_FALSO = 1_000_000  # se suma a un id real para tener uno que no existe


def _persona(ci=None) -> dict:
    return {"nombre": "Ana", "apellido": "Paz", "ci": ci or f"{next(_cis)}-1", "fecha_nac": "2016-04-12"}


def _alta(client, grupo_id, **extra) -> int:
    r = client.post("/hce", json={"persona": _persona(), "grupo_id": grupo_id, **extra})
    assert r.status_code == 201, r.text
    return r.json()["data"]["id"]


def _auditoria(db_api, hce_id=None) -> list[Auditoria]:
    db_api.expire_all()
    consulta = select(Auditoria).order_by(Auditoria.id)
    if hce_id is not None:
        consulta = consulta.where(Auditoria.hce_id == hce_id)
    return list(db_api.scalars(consulta))


# ── H1 · SECRET_KEY obligatoria ──────────────────────────────────────────────
def test_sin_secret_key_la_configuracion_no_carga(monkeypatch):
    monkeypatch.delenv("SECRET_KEY")
    with pytest.raises(ValidationError, match="Falta SECRET_KEY"):
        Settings(_env_file=None)


@pytest.mark.parametrize(("clave", "motivo"), [
    ("x" * 31, "menos de 32 bytes"),
    (SECRET_KEY_PROHIBIDA, "valor de ejemplo"),
    ("   ", "Falta SECRET_KEY"),
])
def test_una_secret_key_corta_en_blanco_o_la_vieja_por_omision_no_carga(monkeypatch, clave, motivo):
    monkeypatch.setenv("SECRET_KEY", clave)
    with pytest.raises(ValidationError, match=motivo):
        Settings(_env_file=None)


def test_una_secret_key_de_32_bytes_carga(monkeypatch):
    monkeypatch.setenv("SECRET_KEY", "k" * 32)
    assert Settings(_env_file=None).secret_key == "k" * 32
    monkeypatch.setenv("SECRET_KEY", "ñ" * 16)  # 32 bytes en UTF-8 aunque sean 16 caracteres
    assert Settings(_env_file=None).secret_key == "ñ" * 16


# ── M2 · el autor de la addenda es el usuario del token ──────────────────────
def _firmado(client, hce, equipo, modulo) -> str:
    """Crea y firma el módulo; devuelve la ruta de sus addendas."""
    if modulo == "idea":
        return f"/idea/{_idea_firmada(client, hce, equipo)}/addendas"
    if modulo == "protocolo":
        pid = client.post(f"/hce/{hce}/protocolo", json=_prot(equipo, "A")).json()["data"]["id"]
        assert client.post(f"/protocolo/{pid}/firmar").status_code == 200
        return f"/protocolo/{pid}/addendas"
    iid = client.post(f"/hce/{hce}/informe-cierre", json=_ic()).json()["data"]["id"]
    assert client.post(f"/informe-cierre/{iid}/firmar", json={"firmantes": [equipo[0].id, equipo[1].id]}).status_code == 200
    return f"/informe-cierre/{iid}/addendas"


@pytest.mark.parametrize("modulo", ["idea", "protocolo", "informe"])
def test_el_autor_de_la_addenda_es_el_usuario_del_token_y_profesional_id_en_el_cuerpo_es_422(
    client, db_api, equipo, grupos, tecnico, token_de, modulo,
):
    hce = _alta(client, grupos[0].id)
    ruta = _firmado(client, hce, equipo, modulo)
    cab = token_de(tecnico)
    r = client.post(ruta, json={"texto": "Aclaración.", "profesional_id": equipo[0].id}, headers=cab)
    assert r.status_code == 422 and r.json()["detail"][0]["campo"] == "profesional_id"
    r = client.post(ruta, json={"texto": "Aclaración."}, headers=cab)
    assert r.status_code == 201
    assert [a["profesional_id"] for a in r.json()["data"]["addendas"]] == [tecnico.id]
    filas = [f for f in _auditoria(db_api, hce) if f.tipo == "addenda"]
    assert [f.usuario_id for f in filas] == [tecnico.id]


# ── Firmas: `usuario_id` = quien ejecutó la acción, los firmantes no se atan al token ──
def test_toda_fila_firma_lleva_al_usuario_del_token_aunque_no_sea_firmante(
    client, db_api, equipo, grupos, tecnico, token_de,
):
    hce = _alta(client, grupos[0].id)
    cab = token_de(tecnico)  # Tina no es ninguno de los dos evaluadores ni firmantes (§5.98: acto de consenso)
    iid = client.post(f"/hce/{hce}/idea", json={
        "anio": 2026, "dim": {f"D{i}": {"valor": 4} for i in range(1, 13)}, "fecha_consenso": "2026-03-18",
        "sintesis": "S.", "objetivos": "O.", "evaluador_t1_id": equipo[0].id, "evaluador_t2_id": equipo[1].id,
    }, headers=cab).json()["data"]["id"]
    assert client.post(f"/idea/{iid}/firmar", headers=cab).status_code == 200
    for tipo in ("A", "B"):
        pid = client.post(f"/hce/{hce}/protocolo", json=_prot(equipo, tipo), headers=cab).json()["data"]["id"]
        assert client.post(f"/protocolo/{pid}/firmar", headers=cab).status_code == 200
    ic = client.post(f"/hce/{hce}/informe-cierre", json=_ic(), headers=cab).json()["data"]["id"]
    r = client.post(f"/informe-cierre/{ic}/firmar", json={"firmantes": [equipo[0].id, equipo[1].id]}, headers=cab)
    assert r.status_code == 200
    assert {f["profesional_id"] for f in r.json()["data"]["firmas"]} == {equipo[0].id, equipo[1].id}
    firmas = [f for f in _auditoria(db_api, hce) if f.tipo == "firma"]
    assert sorted(f.modulo for f in firmas) == ["HCE-IC", "HCE-LB", "HCE-PA", "HCE-PB"]
    assert {f.usuario_id for f in firmas} == {tecnico.id}
    # y nada de la cadena quedó con `usuario_id` NULL
    assert [f.tipo for f in _auditoria(db_api, hce) if f.usuario_id is None] == []


# ── M1 · 409 de unicidad genérico para un `tecnico` ──────────────────────────
def test_un_tecnico_recibe_un_409_generico_por_cedula_repetida_y_el_admin_el_especifico(
    client, db_api, grupos, tecnico, token_de,
):
    propio, ajeno = grupos
    ci_ajena = f"{next(_cis)}-9"
    client.post("/hce", json={"persona": _persona(ci_ajena), "grupo_id": ajeno.id})
    cab = token_de(tecnico)
    filas_antes = len(_auditoria(db_api))
    r = client.post("/hce", json={"persona": _persona(ci_ajena), "grupo_id": propio.id}, headers=cab)
    assert r.status_code == 409
    assert r.json() == {"code": "conflict", "detail": [{"campo": None, "mensaje": MENSAJE_DUPLICADO_TECNICO}]}
    assert len(_auditoria(db_api)) == filas_antes, "el intento fallido no deja auditoría"
    r = client.post("/hce", json={"persona": _persona(ci_ajena), "grupo_id": propio.id})  # admin
    assert r.status_code == 409 and r.json()["detail"][0]["campo"] == "persona.ci"
    assert "cédula" in r.json()["detail"][0]["mensaje"]
    # el par: la misma técnica, sin conflicto, da el alta
    assert client.post("/hce", json={"persona": _persona(), "grupo_id": propio.id}, headers=cab).status_code == 201


def test_el_409_generico_vale_tambien_para_el_patch_de_la_cedula_y_para_el_numero_de_hc(
    client, db_api, grupos, tecnico, token_de,
):
    propio, ajeno = grupos
    ci_ajena = f"{next(_cis)}-8"
    otro = client.post("/hce", json={"persona": _persona(ci_ajena), "grupo_id": ajeno.id}).json()["data"]
    mio = _alta(client, propio.id)
    cab = token_de(tecnico)
    generico = {"code": "conflict", "detail": [{"campo": None, "mensaje": MENSAJE_DUPLICADO_TECNICO}]}
    filas_antes = len(_auditoria(db_api))
    casos = [
        ("patch", f"/hce/{mio}", {"persona": {"ci": ci_ajena}}, "persona.ci"),
        ("patch", f"/hce/{mio}", {"hc_historico": otro["hc_historico"]}, "hc_historico"),
        ("post", "/hce", {"persona": _persona(), "grupo_id": propio.id, "hc_historico": otro["hc_historico"]}, "hc_historico"),
    ]
    for metodo, ruta, cuerpo, campo in casos:
        r = getattr(client, metodo)(ruta, json=cuerpo, headers=cab)
        assert (r.status_code, r.json()) == (409, generico), (ruta, cuerpo)
        r = getattr(client, metodo)(ruta, json=cuerpo)  # admin: el específico
        assert r.status_code == 409 and r.json()["detail"][0]["campo"] == campo
    assert len(_auditoria(db_api)) == filas_antes
    assert client.patch(f"/hce/{mio}", json={"persona": {"ci": f"{next(_cis)}-7"}}, headers=cab).status_code == 200


# ── L1 · el login tarda lo mismo exista o no el email ────────────────────────
def test_un_email_inexistente_inactivo_o_sin_clave_corre_bcrypt_igual_y_da_el_mismo_401(
    client, sin_token, tecnico, crear_profesional, hash_test, monkeypatch,
):
    crear_profesional(email="baja@ippu.test", hashed_password=hash_test, activo=False)
    crear_profesional(email="sinclave@ippu.test")
    llamadas = []
    original = seguridad.bcrypt.checkpw

    def espia(password, hashed):
        llamadas.append(hashed)
        return original(password, hashed)

    monkeypatch.setattr(seguridad.bcrypt, "checkpw", espia)
    mal = sin_token.post("/auth/login", json={"email": "tina@ippu.test", "password": "otra-cosa"})
    assert mal.status_code == 401 and len(llamadas) == 1 and llamadas[0] != seguridad._HASH_FICTICIO
    for email in ("nadie@ippu.test", "baja@ippu.test", "sinclave@ippu.test"):
        llamadas.clear()
        r = sin_token.post("/auth/login", json={"email": email, "password": PASSWORD_TEST})
        assert (r.status_code, r.json()) == (401, mal.json()), email
        assert llamadas == [seguridad._HASH_FICTICIO], email
    llamadas.clear()  # el par: con la clave correcta entra, y contra el hash real
    assert sin_token.post("/auth/login", json={"email": "tina@ippu.test", "password": PASSWORD_TEST}).status_code == 200
    assert llamadas and seguridad._HASH_FICTICIO not in llamadas


# ── L2 · matriz de visibilidad: fuera del grupo 404 (igual que inexistente), dentro 2xx ──
def _prot_abierto(c, hce, eq):
    return c.post(f"/hce/{hce}/protocolo", json=_prot(eq, "A")).json()["data"]["id"]


def _prot_firmado(c, hce, eq):
    pid = _prot_abierto(c, hce, eq)
    assert c.post(f"/protocolo/{pid}/firmar").status_code == 200
    return pid


def _ic_abierto(c, hce, eq):
    return c.post(f"/hce/{hce}/informe-cierre", json=_ic()).json()["data"]["id"]


def _ic_firmado(c, hce, eq):
    iid = _ic_abierto(c, hce, eq)
    assert c.post(f"/informe-cierre/{iid}/firmar", json={"firmantes": [eq[0].id, eq[1].id]}).status_code == 200
    return iid


def _hce_id(c, hce, eq):
    return hce


def _con_vf(c, hce, eq):
    assert c.post(f"/hce/{hce}/valoracion-funcional", json={"pct": 30}).status_code == 201
    return hce


def _con_ci(c, hce, eq):
    assert c.post(f"/hce/{hce}/consentimiento", json={"firmante": "Marta", "fecha": "2026-03-02"}).status_code == 201
    return hce


def _con_idea(c, hce, eq):
    _idea_firmada(c, hce, eq)
    return hce


_FIRMANTES = "firmantes"  # el cuerpo se arma con los ids de `equipo`
CASOS = [
    # (id, preparación, método, ruta con {} en el id, cuerpo, 2xx esperado)
    ("protocolo-get", _prot_abierto, "get", "/protocolo/{}", None, 200),
    ("protocolo-patch", _prot_abierto, "patch", "/protocolo/{}", {"otros": "x"}, 200),
    ("protocolo-firmar", _prot_abierto, "post", "/protocolo/{}/firmar", None, 200),
    ("protocolo-addendas", _prot_firmado, "post", "/protocolo/{}/addendas", {"texto": "x"}, 201),
    ("ic-get", _ic_abierto, "get", "/informe-cierre/{}", None, 200),
    ("ic-patch", _ic_abierto, "patch", "/informe-cierre/{}", {"recomendaciones": "x"}, 200),
    ("ic-firmar", _ic_abierto, "post", "/informe-cierre/{}/firmar", _FIRMANTES, 200),
    ("ic-addendas", _ic_firmado, "post", "/informe-cierre/{}/addendas", {"texto": "x"}, 201),
    ("ic-recibi", _ic_firmado, "post", "/informe-cierre/{}/recibi", {"firmante": "Marta", "fecha": "2026-12-19"}, 201),
    ("ic-documento", _ic_firmado, "get", "/informe-cierre/{}/documento", None, 200),
    ("vf-post", _hce_id, "post", "/hce/{}/valoracion-funcional", {"pct": 10}, 201),
    ("vf-get", _con_vf, "get", "/hce/{}/valoracion-funcional", None, 200),
    ("vf-patch", _con_vf, "patch", "/hce/{}/valoracion-funcional", {"obs": "x"}, 200),
    ("idea-vigente", _con_idea, "get", "/hce/{}/idea/vigente", None, 200),
    ("idea-delta", _con_idea, "get", "/hce/{}/idea/delta?anio=2026", None, 200),
    ("ci-post", _hce_id, "post", "/hce/{}/consentimiento", {"firmante": "Marta", "fecha": "2026-03-02"}, 201),
    ("ci-get", _con_ci, "get", "/hce/{}/consentimiento", None, 200),
    ("ci-patch", _con_ci, "patch", "/hce/{}/consentimiento", {"firmante": "Marta R."}, 200),
    ("flujo", _hce_id, "get", "/hce/{}/flujo?anio=2026", None, 200),
]


@pytest.mark.parametrize(("preparar", "metodo", "ruta", "cuerpo", "ok"), [c[1:] for c in CASOS], ids=[c[0] for c in CASOS])
def test_un_tecnico_fuera_del_grupo_recibe_404_como_inexistente_y_uno_del_grupo_2xx(
    client, equipo, grupos, tecnico, token_de, baremo, preparar, metodo, ruta, cuerpo, ok,
):
    propio, ajeno = grupos
    if cuerpo == _FIRMANTES:
        cuerpo = {"firmantes": [equipo[0].id, equipo[1].id]}
    cab = token_de(tecnico)

    def pedir(recurso_id):
        kwargs = {"headers": cab} | ({"json": cuerpo} if cuerpo is not None else {})
        return getattr(client, metodo)(ruta.format(recurso_id), **kwargs)

    ajeno_id = preparar(client, _alta(client, ajeno.id), equipo)
    fuera, inexistente = pedir(ajeno_id), pedir(ajeno_id + _FALSO)
    assert fuera.status_code == inexistente.status_code == 404
    assert fuera.json()["detail"][0]["mensaje"].replace(str(ajeno_id), "N") == \
        inexistente.json()["detail"][0]["mensaje"].replace(str(ajeno_id + _FALSO), "N")
    propio_id = preparar(client, _alta(client, propio.id), equipo)
    dentro = pedir(propio_id)
    assert dentro.status_code == ok, dentro.text


def test_buscar_por_la_cedula_de_otro_grupo_da_lista_vacia_y_total_0(client, grupos, tecnico, token_de, db_api):
    propio, ajeno = grupos
    ci_ajena, ci_propia = f"{next(_cis)}-1", f"{next(_cis)}-2"
    client.post("/hce", json={"persona": _persona(ci_ajena), "grupo_id": ajeno.id})
    client.post("/hce", json={"persona": _persona(ci_propia), "grupo_id": propio.id})
    cab = token_de(tecnico)
    r = client.get("/hce", params={"ci": ci_ajena}, headers=cab)
    assert r.status_code == 200 and r.json() == [] and r.headers["x-total-count"] == "0"
    r = client.get("/hce", params={"ci": ci_propia}, headers=cab)
    assert len(r.json()) == 1 and r.headers["x-total-count"] == "1"
    assert client.get("/hce", params={"ci": ci_ajena}).headers["x-total-count"] == "1"  # el admin sí
    assert db_api.scalar(select(func.count()).select_from(Auditoria).where(Auditoria.tipo == "acceso")) == 0
