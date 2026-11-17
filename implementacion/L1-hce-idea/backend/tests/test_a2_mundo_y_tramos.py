"""A2 (§5.178 g) · un módulo puede usar `mundo` (A1, de módulo) y `tramos` (S1b, por test) — y `client`.

**La causa del bloqueo de §5.174 f:** `mundo` deja los catálogos sembrados en una transacción **abierta** (dura todo el
módulo); `tramos` insertaba las mismas `etiqueta` únicas de `delta_interpretacion` por `db_api`, que era **otra
conexión**. Postgres hace esperar al segundo INSERT hasta que la primera transacción termine, y la primera es una fixture
del mismo hilo: pytest quedaba colgado para siempre. Arreglo, en la causa: mientras hay un escenario de módulo abierto,
`conexion_api` **es su conexión** (con un SAVEPOINT por test) y `tramos` no vuelve a insertar lo que ya está.

Si el arreglo se perdiera, estos tests no se cuelgan: fallan a los 5 segundos (`lock_timeout`).
"""
import pytest
from sqlalchemy import func, select, text

from app.models.catalogos import DeltaInterpretacion
from app.models.identidad import Profesional
from test_a1_matriz import carpeta_uploads, mundo  # noqa: F401  (fixtures)
from test_m11_3c_protocolo_ic import tramos  # noqa: F401  (fixture)

pytestmark = pytest.mark.matriz_real


@pytest.fixture(autouse=True)
def _sin_cuelgue(conexion_api):
    """Un INSERT que tuviera que esperar a otra transacción falla en 5 s en vez de colgar la corrida."""
    conexion_api.execute(text("SET LOCAL lock_timeout = '5s'"))


def test_tramos_sin_mundo_siembra_los_suyos_en_su_propia_conexion(tramos, db_api):  # noqa: F811
    """Antes de que exista el escenario del módulo: `conexion_api` abre su conexión y `tramos` inserta, como siempre."""
    assert db_api.scalar(select(func.count()).select_from(DeltaInterpretacion)) == len(tramos) > 0


def test_mundo_y_tramos_en_el_mismo_test_no_se_bloquean(mundo, tramos, db_api, conexion_api):  # noqa: F811
    assert conexion_api is mundo["Sesion"].kw["bind"]  # una sola conexión: nadie espera a nadie
    assert db_api.scalar(select(func.count()).select_from(DeltaInterpretacion)) == len(tramos)  # los del módulo, sin duplicar
    r = mundo["cliente"].get(f"/hce/{mundo['e']['hce_id']}", headers=mundo["cab"]["tratante"])
    assert r.status_code == 200


def test_lo_que_un_test_escribe_por_db_api_se_deshace_y_lo_del_modulo_queda(mundo, db_api):  # noqa: F811
    db_api.add(Profesional(nombre="De un test", email="de-un-test@a2.ippu.test", rol="tecnico"))
    db_api.commit()
    assert db_api.scalar(select(func.count()).select_from(Profesional).where(Profesional.email == "de-un-test@a2.ippu.test")) == 1


def test_el_test_siguiente_no_ve_lo_del_anterior_y_el_mundo_sigue_entero(mundo, db_api, tramos):  # noqa: F811
    assert db_api.scalar(select(func.count()).select_from(Profesional).where(Profesional.email == "de-un-test@a2.ippu.test")) == 0
    assert db_api.scalar(select(func.count()).select_from(Profesional).where(Profesional.email == "tina@a1.ippu.test")) == 1
    assert db_api.scalar(select(func.count()).select_from(DeltaInterpretacion)) == len(tramos)


def test_client_dentro_de_un_modulo_con_mundo_no_le_saca_las_sesiones_al_modulo(mundo, client, token_de, db_api):  # noqa: F811
    """`client` inyecta las suyas (sobre la misma conexión) y, al salir, deja las del módulo: el test siguiente las usa."""
    h, tina = mundo["e"]["hce_id"], db_api.get(Profesional, mundo["ids"]["tratante"])
    assert client.get(f"/hce/{h}", headers=token_de(tina)).status_code == 200
    r = client.get(f"/hce/{h}")  # la identidad por omisión, con `matriz_real`: una coordinación sin grupos
    assert (r.status_code, r.json()["code"]) == (403, "reason_required")


def test_despues_de_un_test_con_client_el_mundo_sigue_respondiendo(mundo):  # noqa: F811
    r = mundo["cliente"].get(f"/hce/{mundo['e']['hce_id']}/flujo", headers=mundo["cab"]["tratante"])
    assert r.status_code == 200
    r = mundo["cliente"].get(f"/hce/{mundo['e']['hce_id']}", headers=mundo["cab"]["nt_sin_motivo"])
    assert (r.status_code, r.json()["code"]) == (403, "reason_required")
