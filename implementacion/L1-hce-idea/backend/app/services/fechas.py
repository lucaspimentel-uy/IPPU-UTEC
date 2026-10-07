"""Fechas de referencia compartidas por los servicios."""
from datetime import date


def anio_actual() -> int:
    """Año calendario en curso: el que se asume cuando una consulta por grupo no dice el año."""
    return date.today().year
