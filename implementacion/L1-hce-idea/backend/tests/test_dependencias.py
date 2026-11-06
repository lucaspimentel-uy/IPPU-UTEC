"""Auditoría de seguridad M4 (§5.157 d): la versión instalada de `python-multipart` no es más vieja que el pin.

`requirements.txt` fija la más baja que arregla los avisos que se alcanzan sin token; un `.venv` armado antes del
cambio (con 0.0.20) seguiría pasando todo lo demás sin enterarse. Esto lo frena.
"""
import re
from importlib.metadata import version
from pathlib import Path

REQUIREMENTS = Path(__file__).resolve().parents[1] / "requirements.txt"
#: La más baja sin avisos de pip-audit al 2026-11-05 (CVE-2026-24486, -40347, -42561, -53538, -53539, -53540).
MINIMA_SIN_AVISOS = (0, 0, 31)


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
