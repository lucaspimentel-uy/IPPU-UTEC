"""Normalización de texto al guardar.

`''` y `NULL` significan lo mismo —«no hay dato»— y la base ya no los distingue
(`esquema-datos-v2.md` §4, fila «M12.7 · `''` y `NULL`»): los CHECK aceptan las
dos representaciones del vacío. **`NULL` es la canónica** y esta función es la
única línea que lo garantiza; hasta que todos los servicios la usen, cualquier
`WHERE campo IS NOT NULL` sobre un texto opcional puede estar mal.
"""
from collections.abc import Iterable, Mapping
from typing import Any


def normalizar_texto(valor: str | None) -> str | None:
    """`None`, `''` o sólo espacios en blanco (Unicode) → `None`. Otro texto, **sin tocar**.

    Un texto con contenido se devuelve tal cual: **no se hace `strip()`** de lo
    que el técnico escribió (dos espacios o un salto de línea al final no son
    asunto del servidor). «En blanco» se decide con `str.strip()`, que reconoce
    el espacio no separable (U+00A0), tabulaciones y saltos de línea.
    """
    if valor is None or not valor.strip():
        return None
    return valor


def normalizar_opcionales(datos: Mapping[str, Any], campos: Iterable[str]) -> dict[str, Any]:
    """Copia de `datos` con `normalizar_texto` aplicado a los `campos` que estén.

    Sólo toca las claves presentes: en un PATCH, la ausencia de una clave significa
    «no modificar» y agregarla con `None` la borraría.
    """
    salida = dict(datos)
    for campo in campos:
        if campo in salida and (salida[campo] is None or isinstance(salida[campo], str)):
            salida[campo] = normalizar_texto(salida[campo])
    return salida
