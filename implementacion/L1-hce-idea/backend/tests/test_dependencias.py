"""Auditoría de seguridad M4 (§5.157 d) y S3 (§5.177): las versiones instaladas no son más viejas que el pin.

`requirements.txt` fija la más baja que arregla los avisos que se alcanzan sin token; un `.venv` armado antes del
cambio (con `python-multipart` 0.0.20, o con FastAPI 0.115 y `python-jose`) seguiría pasando casi todo sin enterarse.
Esto lo frena.
"""
import re
from importlib.metadata import PackageNotFoundError, version
from pathlib import Path

import pytest

REQUIREMENTS = Path(__file__).resolve().parents[1] / "requirements.txt"
#: La más baja sin avisos de pip-audit al 2026-11-05 (CVE-2026-24486, -40347, -42561, -53538, -53539, -53540).
MINIMA_SIN_AVISOS = (0, 0, 31)
#: Desde 0.121 `Depends(..., scope="function")` corre la salida de una dependencia con `yield` antes de enviar la
#: respuesta; sin eso el `commit()` de `sesion_transaccional` fallaría con el 201 ya enviado (§5.177, reemplaza §5.115 d).
FASTAPI_MINIMA = (0, 121, 0)


def _tupla(v: str) -> tuple[int, ...]:
    return tuple(int(p) for p in re.findall(r"\d+", v)[:3])


def _pin(paquete: str) -> str:
    m = re.search(rf"^{re.escape(paquete)}==(\S+)\s*$", REQUIREMENTS.read_text(encoding="utf-8"), re.MULTILINE)
    assert m, f"{paquete} no está fijado con == en requirements.txt"
    return m.group(1)


def test_python_multipart_fijado_sin_avisos_y_el_instalado_no_es_mas_viejo():
    pin = _pin("python-multipart")
    assert _tupla(pin) >= MINIMA_SIN_AVISOS, f"el pin {pin} es anterior a la versión que arregla los avisos"
    instalada = version("python-multipart")
    assert _tupla(instalada) >= _tupla(pin), f"instalada {instalada} < fijada {pin}: correr pip install -r requirements.txt"


def test_starlette_usa_python_multipart_y_no_el_modulo_viejo():
    from starlette import formparsers

    assert formparsers.multipart is not None and formparsers.multipart.__name__ == "python_multipart"


def test_fastapi_fijado_e_instalado_admiten_scope_function():
    pin = _pin("fastapi")
    assert _tupla(pin) >= FASTAPI_MINIMA, f"el pin {pin} es anterior a 0.121: sin `scope=\"function\"` el commit corre tras la respuesta"
    instalada = version("fastapi")
    assert _tupla(instalada) >= FASTAPI_MINIMA, f"instalada {instalada}: correr pip install -r requirements.txt"
    assert _tupla(instalada) >= _tupla(pin), f"instalada {instalada} < fijada {pin}: correr pip install -r requirements.txt"


def test_pyjwt_fijado_e_instalado_y_python_jose_ni_esta():
    assert _tupla(version("PyJWT")) >= _tupla(_pin("PyJWT"))
    assert not re.search(r"^python-jose", REQUIREMENTS.read_text(encoding="utf-8"), re.MULTILINE | re.IGNORECASE)
    with pytest.raises(PackageNotFoundError):
        version("python-jose")  # §5.177: 4 avisos de pip-audit; y con él, `ecdsa` (sin versión arreglada)
    with pytest.raises(PackageNotFoundError):
        version("ecdsa")


def test_toda_ruta_que_commitea_pide_la_sesion_con_scope_function():
    """Cada uso de `sesion_transaccional` en las rutas reales viene de `SesionTransaccional` (`scope="function"`).
    Si un endpoint nuevo escribe `Depends(sesion_transaccional)` a secas, el commit volvería a correr tras la respuesta."""
    from fastapi.routing import APIRoute, iter_route_contexts

    from app.main import app
    from app.routers.dependencias import SesionTransaccional, get_db, sesion_transaccional

    def hijas(dependant):
        for d in dependant.dependencies:
            yield d
            yield from hijas(d)

    usos = []
    for contexto in iter_route_contexts(app.routes):
        ruta = contexto.original_route
        if not isinstance(ruta, APIRoute):
            continue
        for d in hijas(ruta.dependant):
            if d.call is sesion_transaccional:
                usos.append((sorted(ruta.methods), ruta.path, d.scope))
    assert len(usos) >= 30, f"no se encontraron las rutas que commitean ({len(usos)}): ¿cambió la forma de recorrerlas?"
    mal = [u for u in usos if u[2] != "function"]
    assert not mal, f"rutas que commitean sin scope=\"function\": {mal}"
    assert SesionTransaccional.__metadata__[0].scope == "function"
    # `get_db` queda con el scope por omisión: sólo abre y cierra, y su `close()` tras la respuesta no cambia lo que se envía
    assert all(d.scope in (None, "request") for c in iter_route_contexts(app.routes)
               if isinstance(c.original_route, APIRoute)
               for d in hijas(c.original_route.dependant) if d.call is get_db)
