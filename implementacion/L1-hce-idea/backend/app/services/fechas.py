"""Fechas de referencia compartidas por los servicios.

`hoy()` es **el único lugar** que lee el reloj: los servicios la llaman por el módulo
(`fechas.hoy()`), así que un test la congela con `monkeypatch.setattr(fechas, "hoy", ...)`.
"""
from datetime import date


def hoy() -> date:
    return date.today()


def anio_actual() -> int:
    """Año calendario en curso: el que se asume cuando una consulta por grupo o por flujo no dice el año."""
    return hoy().year
