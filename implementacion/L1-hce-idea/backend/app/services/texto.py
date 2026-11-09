"""Normalización de texto al guardar.

`''` y `NULL` significan lo mismo —«no hay dato»— y la base ya no los distingue
(`esquema-datos-v2.md` §4, fila «M12.7 · `''` y `NULL`»): los CHECK aceptan las
dos representaciones del vacío. **`NULL` es la canónica** y esta función es la
única línea que lo garantiza; hasta que todos los servicios la usen, cualquier
`WHERE campo IS NOT NULL` sobre un texto opcional puede estar mal.
"""
import unicodedata
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


#: Categorías Unicode que no se ven pero cambian lo que se lee: `Cf` (formato: U+202E «de derecha a izquierda» que da vuelta
#: «cod.pdf» → «fdp.doc», el espacio de ancho cero U+200B, la marca de orden de bytes…) y `Cc` (control: NUL, BEL, ESC,
#: tabulación y salto de línea incluidos).
CATEGORIAS_INVISIBLES = frozenset({"Cf", "Cc"})
#: El aviso de B11 (§5.163 b): `code` estable, el texto de la decisión del equipo.
AVISO_INVISIBLES = "nombre_con_caracteres_invisibles"
MENSAJE_INVISIBLES = "Se quitaron caracteres invisibles del nombre."


def quitar_invisibles(texto: str, *, conservar: str = "") -> tuple[str, bool]:
    """`(texto sin los caracteres de categoría Cf y Cc, si se quitó alguno)`. `conservar` lista los que se dejan
    (una descripción de varias líneas conserva el salto de línea y la tabulación)."""
    limpio = "".join(c for c in texto if c in conservar or unicodedata.category(c) not in CATEGORIAS_INVISIBLES)
    return limpio, limpio != texto


def aviso_invisibles(campo: str = "nombre") -> dict[str, Any]:
    """El elemento de `warnings[]` de B11."""
    return {"code": AVISO_INVISIBLES, "mensaje": MENSAJE_INVISIBLES, "campo": campo}
