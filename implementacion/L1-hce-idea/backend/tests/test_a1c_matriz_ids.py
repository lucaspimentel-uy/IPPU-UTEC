"""A1c (§5.174) · hallazgo 3c: los ids no canónicos de las 14 rutas por id de módulo (S1b, §5.168), con los demás roles.

Administrativo, dirección no técnica y coordinación sin asignación reciben, con cada forma del id (`FORMAS` de S1b), lo mismo
que con el id canónico, y la fila no cambia (el servicio no corre); el ancho completo y «abc» son el mismo 422. El par: el
tratante recibe lo de siempre.

Va en su propio archivo y no en `test_a1c_matriz.py` porque `mundo` (A1) es de módulo y deja los catálogos sembrados en una
transacción abierta: `tramos` (S1b) inserta las mismas filas de `delta_interpretacion` desde otra conexión y las dos se
bloquean para siempre. Con usuarios reales, no la identidad de la suite. (A2, §5.178 g, arregló ese bloqueo en su causa
—`conftest.conexion_api`—; el archivo se queda donde está.)
"""
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.main import app
from test_m11_3c_protocolo_ic import equipo, tramos  # noqa: F401  (fixtures)
from test_s1b_ids_no_canonicos import CASOS, FORMAS, RUTAS, _ancho_completo, _foto, _pedir, _registro, _url

#: Un módulo de acceso: la identidad por omisión de la suite no saltea la matriz (A2, §5.178 f).
pytestmark = pytest.mark.matriz_real

# ── 4 · Los ids no canónicos de las 14 rutas por id de módulo, con los demás roles ─────────────────────────
@pytest.fixture
def roles(client, crear_grupo, crear_profesional, hash_test, equipo, tramos, token_de):
    """Un tratante y, sin relación con el expediente: administrativo, dirección no técnica y coordinación sin asignar."""
    from test_m11_3d1_login_listado import _alta

    tratante = crear_profesional(nombre="Teo Tratante", email="teo@a1c.ippu.test", hashed_password=hash_test)
    grupo = crear_grupo(nombre="Del tratante", tecnico1_id=tratante.id)
    otros = {
        rol: crear_profesional(nombre=f"{rol} a1c", email=f"{rol}@a1c.ippu.test", rol=rol, hashed_password=hash_test)
        for rol in ("administrativo", "direccion_nt", "coordinacion")
    }
    # El escenario lo arma **quien trata el expediente**: con `matriz_real` la identidad por omisión (`client`) es una
    # coordinación sin grupos, que no escribe lo clínico (A2, §5.178 f). `client` sigue pedido: inyecta las sesiones.
    del_tratante = TestClient(app, headers=token_de(tratante))
    return SimpleNamespace(client=del_tratante, equipo=equipo, hce=_alta(del_tratante, grupo.id),
                           cab_tratante=token_de(tratante), cabs={rol: token_de(p) for rol, p in otros.items()})


def _esperado(rol: str, metodo: str) -> str:
    """Qué `code` recibe el rol con el id canónico (la matriz): administrativo y dirección, siempre `forbidden`; coordinación
    sin asignación, `reason_required` al leer y `forbidden` al escribir."""
    return "reason_required" if rol == "coordinacion" and metodo == "GET" else "forbidden"


@pytest.mark.parametrize("metodo,plantilla", RUTAS, ids=[f"{m} {p}" for m, p in RUTAS])
def test_administrativo_direccion_y_coordinacion_sin_asignar_reciben_lo_mismo_con_cualquier_forma_del_id(
    db_api, roles, metodo, plantilla,
):
    estado, cuerpo, esperado = CASOS[(metodo, plantilla)]
    ident = _registro(roles, plantilla, estado)
    antes = _foto(db_api, plantilla, ident)

    for rol, cab in roles.cabs.items():
        canonico = _pedir(roles, metodo, _url(plantilla, ident), cab, cuerpo)
        assert (canonico.status_code, canonico.json()["code"]) == (403, _esperado(rol, metodo)), (rol, canonico.text)
        assert _foto(db_api, plantilla, ident) == antes
        for nombre, forma in FORMAS.items():
            r = _pedir(roles, metodo, _url(plantilla, forma(ident)), cab, cuerpo)
            assert (r.status_code, r.json()) == (canonico.status_code, canonico.json()), (rol, nombre, r.text)
            assert _foto(db_api, plantilla, ident) == antes, f"{rol}, {nombre}: el servicio corrió"
        # ancho completo: Pydantic no lo convierte → el mismo 422 que «abc» (se mira el tipo del id antes que el rol)
        invalido = _pedir(roles, metodo, _url(plantilla, "abc"), cab, cuerpo)
        ancho = _pedir(roles, metodo, _url(plantilla, _ancho_completo(ident)), cab, cuerpo)
        assert invalido.status_code == ancho.status_code == 422 and ancho.json() == invalido.json(), rol
        assert _foto(db_api, plantilla, ident) == antes

    # el par: el tratante, con el id canónico, recibe lo de siempre
    propio = _pedir(roles, metodo, _url(plantilla, ident), roles.cab_tratante, cuerpo)
    assert propio.status_code == esperado, (propio.status_code, propio.text)
