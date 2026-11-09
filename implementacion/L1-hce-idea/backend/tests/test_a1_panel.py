"""A1 · el panel de dirección no técnica (F4-7, `docs/diseno/fase4-acceso.md` b): la institución, con las medias del
protocolo suprimidas si `n_ciclo_ab` < `UMBRAL_CELDA_CHICA` (5). Aparte de `test_a1_matriz.py`: aquel arma su escenario en
una transacción de módulo, y este siembra los catálogos en la suya.
"""
from datetime import date

import pytest

from app.seed_catalogos import run as sembrar_catalogos

ANIO = date.today().year

# ── El panel de dirección no técnica (F4-7) ──────────────────────────────────
@pytest.mark.parametrize("n, suprimido", [(4, True), (5, False)])
def test_el_panel_de_direccion_suprime_las_medias_con_menos_de_5(
    client, db_api, crear_profesional, hash_test, token_de, n, suprimido,
):
    from test_c7_panel import _par
    from test_m11_3d1_login_listado import _alta

    sembrar_catalogos(db=db_api, verboso=False)
    db_api.commit()
    dina = crear_profesional(nombre="Dina", rol="direccion_nt", hashed_password=hash_test)
    cora = crear_profesional(nombre="Cora", rol="coordinacion", hashed_password=hash_test)
    for i in range(n):
        _par(db_api, _alta(client, None, nombre=f"N{i}"), ANIO, (15, 15, 15, 15), (19, 21, 19, 20))
    db_api.commit()
    r = client.get("/panel", headers=token_de(dina))
    assert r.status_code == 200
    p = r.json()["protocolo"]
    assert p["n_ciclo_ab"] == n and p["suprimido"] is suprimido and r.json()["alcance"] == "institucion"
    medias = [e[k] for e in p["escalas"] for k in ("media_pa", "media_pb", "media_delta")]
    assert all(m is None for m in medias) if suprimido else medias[:3] == [15.0, 19.0, 4.0]
    # Las cuentas no se suprimen, y coordinación ve las medias con cualquier n.
    assert r.json()["n_activos"] == n
    pc = client.get("/panel", headers=token_de(cora)).json()["protocolo"]
    assert pc["suprimido"] is False and pc["escalas"][0]["media_pa"] == 15.0
