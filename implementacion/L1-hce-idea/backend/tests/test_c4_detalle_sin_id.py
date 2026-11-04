"""La auditoría no muestra el id interno del expediente (decisión del equipo, corrección del bloque A).

El `detalle` de cada fila `carga` habla del módulo, no del número de fila de `hce_diurna`: ese id no
significa nada para quien lee la historia (el que sí significa es el N.º de HC). Un único test
parametrizado carga cada módulo que escribe una `carga` y mira **todas** las filas de auditoría del
expediente, no sólo la de la carga.
"""
import re

import pytest
from sqlalchemy import select

from app.models.transversales import Auditoria
from test_c2_severidad import CUERPO as SEV, niveles  # noqa: F401  (fixture)
from test_c3_organismos import BPS, INAU, REGISTRO
from test_m11_3b_idea_flujo import _crear, _completo
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
