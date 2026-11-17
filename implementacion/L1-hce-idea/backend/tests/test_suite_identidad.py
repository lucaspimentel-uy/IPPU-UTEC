"""La identidad por omisión de la suite y el marcador `matriz_real` (A1, §5.165 c; A2, §5.178 f).

Sin el marcador —como en toda la suite que no es de acceso—, el `client` por omisión **pasa la matriz** y **no deja
filas automáticas** en el registro de accesos. Con el marcador, es una coordinación sin grupos como cualquier otra: la
matriz la frena y, donde entra, queda registrada. Los dos casos, sobre el mismo pedido.
"""
import pytest
from sqlalchemy import func, select

from app.models.acceso import AccesoHce
from test_m11_3d1_login_listado import _alta


def _accesos(db_api) -> int:
    return db_api.scalar(select(func.count()).select_from(AccesoHce))


def test_sin_el_marcador_la_identidad_por_omision_pasa_la_matriz_y_no_deja_filas(client, db_api, crear_grupo, crear_profesional):
    grupo = crear_grupo(nombre="De otro", tecnico1_id=crear_profesional(nombre="Otra").id)
    h = _alta(client, grupo.id)
    assert client.get(f"/hce/{h}").status_code == 200  # lo clínico de un expediente que no trata, sin motivo
    assert client.patch(f"/hce/{h}", json={"derivacion": "Pediatra"}).status_code == 200  # y lo escribe
    assert client.get(f"/hce/{h}/identificacion").status_code == 200
    assert client.get(f"/hce/{h}/organismos").status_code == 200
    assert _accesos(db_api) == 0


@pytest.mark.matriz_real
def test_con_el_marcador_la_misma_identidad_ejerce_la_matriz_y_queda_registrada(client, db_api, crear_grupo, crear_profesional, admin):
    grupo = crear_grupo(nombre="De otro", tecnico1_id=crear_profesional(nombre="Otra").id)
    h = _alta(client)  # coordinación da de alta con datos identificatorios, sin grupo…
    assert client.patch(f"/hce/{h}/identificacion", json={"grupo_id": grupo.id}).status_code == 200  # …y lo asigna
    r = client.get(f"/hce/{h}")
    assert (r.status_code, r.json()["code"]) == (403, "reason_required")
    assert client.patch(f"/hce/{h}", json={"derivacion": "Pediatra"}).status_code == 403
    assert client.get(f"/hce/{h}/identificacion").status_code == 200
    filas = list(db_api.scalars(select(AccesoHce)))
    assert [(f.usuario_id, f.relacion, f.rol) for f in filas] == [(admin.id, "gestion", "coordinacion")]
