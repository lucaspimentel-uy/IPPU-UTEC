"""M11.5-a · `PATCH /grupos/{id}`: asignación de técnicos a un grupo, sólo `admin` (§5.120).

Convención de la suite: **todo rechazo va emparejado con el caso que pasa** (403 ↔ 200, 404 ↔ 200,
422 ↔ 200), para que un test en verde no pueda deberse a que el endpoint rechaza todo.
"""
import itertools

import pytest
from sqlalchemy import select

from app.core.constantes import AUDITORIA_TIPO_EDICION, MODULO_GRUPO
from app.models.identidad import Grupo
from app.models.transversales import Auditoria

_cis = itertools.count(9_100_000)


@pytest.fixture
def equipo(crear_profesional, hash_test):
    """Dos técnicos con contraseña (pueden entrar) y uno inactivo."""
    return (
        crear_profesional(nombre="Dr. González", especialidad="Psicólogo/a", hashed_password=hash_test),
        crear_profesional(nombre="Mtra. Torres", especialidad="Maestro/a", hashed_password=hash_test),
        crear_profesional(nombre="Inactivo", activo=False),
    )


@pytest.fixture
def grupo(crear_grupo):
    return crear_grupo(nombre="Escolares")


def _filas_grupo(db_api) -> list[Auditoria]:
    db_api.expire_all()
    return list(db_api.scalars(
        select(Auditoria).where(Auditoria.modulo == MODULO_GRUPO).order_by(Auditoria.id)
    ))


def _expediente(client, grupo_id) -> int:
    persona = {"nombre": "Ana", "apellido": "Pérez", "ci": f"{next(_cis)}-1", "fecha_nac": "2016-04-12"}
    r = client.post("/hce", json={"persona": persona, "grupo_id": grupo_id})
    assert r.status_code == 201, r.text
    return r.json()["data"]["id"]


# ── El caso que pasa ─────────────────────────────────────────────────────────
def test_admin_asigna_los_dos_tecnicos_con_su_rol(client, grupo, equipo):
    gonzalez, torres, _ = equipo
    r = client.patch(f"/grupos/{grupo.id}", json={
        "tecnico1_id": gonzalez.id, "tecnico1_rol": "Psicólogo/a",
        "tecnico2_id": torres.id, "tecnico2_rol": "Maestro/a",
    })
    assert r.status_code == 200, r.text
    assert r.json() == {"data": {
        "id": grupo.id, "nombre": "Escolares", "anio": grupo.anio,
        "tecnico1_id": gonzalez.id, "tecnico1_rol": "Psicólogo/a",
        "tecnico2_id": torres.id, "tecnico2_rol": "Maestro/a",
    }, "warnings": []}


def test_patch_toca_solo_lo_que_viene_y_null_desasigna(client, grupo, equipo):
    gonzalez, torres, _ = equipo
    client.patch(f"/grupos/{grupo.id}", json={"tecnico1_id": gonzalez.id, "tecnico2_id": torres.id})
    r = client.patch(f"/grupos/{grupo.id}", json={"tecnico2_id": None, "tecnico1_rol": ""})
    assert r.status_code == 200, r.text
    data = r.json()["data"]
    assert (data["tecnico1_id"], data["tecnico2_id"], data["tecnico1_rol"]) == (gonzalez.id, None, None)


# ── Rechazos, cada uno con su par ────────────────────────────────────────────
def test_tecnico_recibe_403_y_admin_200(client, grupo, equipo, token_de):
    gonzalez, torres, _ = equipo
    cuerpo = {"tecnico1_id": torres.id}
    r = client.patch(f"/grupos/{grupo.id}", json=cuerpo, headers=token_de(gonzalez))
    assert r.status_code == 403
    assert r.json()["code"] == "forbidden"
    assert client.patch(f"/grupos/{grupo.id}", json=cuerpo).status_code == 200  # el par


def test_tecnico_recibe_403_aunque_el_grupo_no_exista(client, equipo, token_de):
    r = client.patch("/grupos/999999", json={}, headers=token_de(equipo[0]))
    assert r.status_code == 403


def test_grupo_inexistente_404_y_existente_200(client, grupo, equipo):
    r = client.patch("/grupos/999999", json={"tecnico1_id": equipo[0].id})
    assert r.status_code == 404
    assert r.json() == {"code": "not_found", "detail": [{"campo": None, "mensaje": "No existe el grupo 999999"}]}
    assert client.patch(f"/grupos/{grupo.id}", json={"tecnico1_id": equipo[0].id}).status_code == 200


def test_profesional_inactivo_422_por_campo_y_activo_200(client, grupo, equipo):
    gonzalez, _, inactivo = equipo
    r = client.patch(f"/grupos/{grupo.id}", json={"tecnico2_id": inactivo.id})
    assert r.status_code == 422
    assert r.json()["detail"] == [{"campo": "tecnico2_id", "mensaje": "Tiene que ser un profesional activo"}]
    assert client.patch(f"/grupos/{grupo.id}", json={"tecnico2_id": gonzalez.id}).status_code == 200


def test_profesional_inexistente_422_por_campo(client, grupo):
    r = client.patch(f"/grupos/{grupo.id}", json={"tecnico1_id": 999999})
    assert r.status_code == 422
    assert r.json()["detail"] == [{"campo": "tecnico1_id", "mensaje": "No existe el profesional 999999"}]


def test_misma_persona_en_los_dos_puestos_422_y_distintas_200(client, grupo, equipo):
    gonzalez, torres, _ = equipo
    r = client.patch(f"/grupos/{grupo.id}", json={"tecnico1_id": gonzalez.id, "tecnico2_id": gonzalez.id})
    assert r.status_code == 422
    assert [d["campo"] for d in r.json()["detail"]] == ["tecnico2_id"]
    ok = client.patch(f"/grupos/{grupo.id}", json={"tecnico1_id": gonzalez.id, "tecnico2_id": torres.id})
    assert ok.status_code == 200


def test_misma_persona_contra_el_estado_vigente_tambien_es_422(client, grupo, equipo):
    """Mandar sólo `tecnico1_id` igual al técnico 2 ya asignado: se compara contra el estado final."""
    gonzalez, torres, _ = equipo
    client.patch(f"/grupos/{grupo.id}", json={"tecnico2_id": gonzalez.id})
    r = client.patch(f"/grupos/{grupo.id}", json={"tecnico1_id": gonzalez.id})
    assert r.status_code == 422
    assert [d["campo"] for d in r.json()["detail"]] == ["tecnico1_id"]
    assert client.patch(f"/grupos/{grupo.id}", json={"tecnico1_id": torres.id}).status_code == 200


@pytest.mark.parametrize("campo", ["nombre", "anio", "obs", "tecnico3_id"])
def test_campo_ajeno_a_los_tecnicos_422_y_sin_el_200(client, grupo, equipo, db_api, campo):
    r = client.patch(f"/grupos/{grupo.id}", json={"tecnico1_id": equipo[0].id, campo: "x"})
    assert r.status_code == 422
    assert r.json()["code"] == "validation_error"
    db_api.expire_all()
    assert db_api.get(Grupo, grupo.id).tecnico1_id is None  # nada se aplicó
    assert client.patch(f"/grupos/{grupo.id}", json={"tecnico1_id": equipo[0].id}).status_code == 200


def test_un_rechazo_no_escribe_nada(client, grupo, equipo, db_api):
    gonzalez, _, inactivo = equipo
    r = client.patch(f"/grupos/{grupo.id}", json={"tecnico1_id": gonzalez.id, "tecnico2_id": inactivo.id})
    assert r.status_code == 422
    db_api.expire_all()
    assert db_api.get(Grupo, grupo.id).tecnico1_id is None
    assert _filas_grupo(db_api) == []


# ── Auditoría ────────────────────────────────────────────────────────────────
def test_una_fila_de_auditoria_por_campo_que_cambio_con_valor_anterior_legible(
    client, grupo, equipo, db_api, admin,
):
    gonzalez, torres, _ = equipo
    client.patch(f"/grupos/{grupo.id}", json={"tecnico1_id": gonzalez.id, "tecnico1_rol": "Psicólogo/a"})
    filas = _filas_grupo(db_api)
    assert {(f.campo, f.valor_ant, f.valor_nuevo) for f in filas} == {
        ("tecnico1_id", None, f"Dr. González (id {gonzalez.id})"),
        ("tecnico1_rol", None, "Psicólogo/a"),
    }
    assert all(f.tipo == AUDITORIA_TIPO_EDICION and f.hce_id is None for f in filas)
    assert all(f.usuario_id == admin.id for f in filas)
    assert all(f.detalle == f"grupo {grupo.id} · Escolares {grupo.anio}" for f in filas)

    # Cambiar el técnico deja el anterior legible; repetir el mismo rol no escribe fila.
    client.patch(f"/grupos/{grupo.id}", json={"tecnico1_id": torres.id, "tecnico1_rol": "Psicólogo/a"})
    nuevas = _filas_grupo(db_api)[len(filas):]
    assert [(f.campo, f.valor_ant, f.valor_nuevo) for f in nuevas] == [
        ("tecnico1_id", f"Dr. González (id {gonzalez.id})", f"Mtra. Torres (id {torres.id})"),
    ]


def test_sin_cambios_no_escribe_auditoria(client, grupo, equipo, db_api):
    client.patch(f"/grupos/{grupo.id}", json={"tecnico1_id": equipo[0].id})
    antes = len(_filas_grupo(db_api))
    assert client.patch(f"/grupos/{grupo.id}", json={"tecnico1_id": equipo[0].id}).status_code == 200
    assert len(_filas_grupo(db_api)) == antes


# ── Efecto sobre el alcance (§5.101) ─────────────────────────────────────────
def test_tras_la_asignacion_el_tecnico_alcanza_el_expediente_del_grupo(client, grupo, equipo, token_de):
    gonzalez, _, _ = equipo
    hce = _expediente(client, grupo.id)
    assert client.get(f"/hce/{hce}", headers=token_de(gonzalez)).status_code == 404  # antes
    assert client.patch(f"/grupos/{grupo.id}", json={"tecnico2_id": gonzalez.id}).status_code == 200
    assert client.get(f"/hce/{hce}", headers=token_de(gonzalez)).status_code == 200  # después
    # Y al desasignarlo lo pierde.
    assert client.patch(f"/grupos/{grupo.id}", json={"tecnico2_id": None}).status_code == 200
    assert client.get(f"/hce/{hce}", headers=token_de(gonzalez)).status_code == 404
