"""Lo que se rechaza de la entrada **antes** de que llegue a la base (B1, `handoff.md` §5.163 a).

Postgres no acepta el carácter NUL (U+0000) en un `text` ni en un `jsonb`, ni un entero fuera de `int4` en una columna
`INTEGER`: el driver levanta un `DataError` y, antes de esto, el cliente recibía un 500 por un dato que él mismo mandó.

- **NUL en un campo** (`sin_caracter_nulo`): una dependencia de FastAPI, puesta en `main.py` en cada `include_router`
  **después** de `usuario_actual` (sin token, 401 primero) y **antes** de los guards de alcance. Mira las cadenas del
  JSON (a cualquier profundidad: la anamnesis es un JSON libre, y las claves de un objeto también van al `jsonb`), los
  campos de texto de un formulario multipart y la query. Levanta un `RequestValidationError`: sale por el mismo manejador
  que cualquier 422 de validación, con `campo` = el camino al valor («nombre», «anamnesis.cuadro.0»).
- **Id de ruta fuera de `int4`** (`IdsFueraDeRango`): un middleware ASGI que reemplaza, en la ruta, todo segmento
  numérico mayor que `2**31 - 1` por `0`. Ninguna fila tiene el id 0, así que lo que sigue es **exactamente** la respuesta
  de un id que no existe (el mismo cuerpo, en cada ruta, para el `admin` y para un técnico), sin repetir en cada router
  cuál es su mensaje de 404. Ninguna columna de ids es `bigint` (`models/`): `int4` es el tope en todas.
- Lo que aun así llegue a la base y levante un `DataError` (un entero de un cuerpo o de una query fuera de rango, una
  fecha imposible…) lo traduce `routers/errores.py` a un 422 `invalid_value`.
"""
from __future__ import annotations

import json
import re
from collections.abc import Iterator

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from starlette.types import ASGIApp, Receive, Scope, Send

INT4_MAX = 2**31 - 1
MENSAJE_NUL = "No puede contener el carácter nulo (U+0000)."
_DIGITOS = re.compile(r"[0-9]+")


# ── NUL ──────────────────────────────────────────────────────────────────────
def _con_nul(valor: object, camino: tuple[str, ...]) -> Iterator[tuple[str, ...]]:
    """Los caminos de todo lo que contiene un NUL: una cadena, la clave de un objeto o un elemento de una lista."""
    if isinstance(valor, str):
        if "\x00" in valor:
            yield camino
    elif isinstance(valor, dict):
        for clave, hijo in valor.items():
            if isinstance(clave, str) and "\x00" in clave:
                yield (*camino, clave)
            yield from _con_nul(hijo, (*camino, str(clave)))
    elif isinstance(valor, list):
        for i, hijo in enumerate(valor):
            yield from _con_nul(hijo, (*camino, str(i)))


def _error(origen: str, camino: tuple[str, ...]) -> dict:
    return {"type": "value_error", "loc": (origen, *camino), "msg": MENSAJE_NUL, "input": None}


async def sin_caracter_nulo(request: Request) -> None:
    """422 con el `campo` de cada valor que trae un NUL (JSON, formulario o query); si no hay ninguno, no hace nada."""
    errores: list[dict] = []
    tipo = request.headers.get("content-type", "").lower()
    if request.method in ("POST", "PUT", "PATCH"):
        if not tipo or "json" in tipo:
            cuerpo = await request.body()  # FastAPI ya lo leyó: Starlette lo guarda
            if cuerpo:
                try:
                    datos = json.loads(cuerpo)
                except ValueError:
                    datos = None  # un JSON inválido ya lo rechazó FastAPI con su propio 422
                errores += [_error("body", c) for c in _con_nul(datos, ())]
        elif tipo.startswith(("multipart/form-data", "application/x-www-form-urlencoded")):
            formulario = await request.form()  # también guardado: no se parsea dos veces
            for clave, valor in formulario.multi_items():
                if "\x00" in clave:
                    errores.append(_error("body", (clave,)))
                elif isinstance(valor, str) and "\x00" in valor:
                    errores.append(_error("body", (clave,)))
    for clave, valor in request.query_params.multi_items():
        if "\x00" in clave or "\x00" in valor:
            errores.append(_error("query", (clave,)))
    if errores:
        raise RequestValidationError(errores)


# ── Ids fuera de int4 ────────────────────────────────────────────────────────
def _segmento(segmento: str) -> str:
    if _DIGITOS.fullmatch(segmento):
        sin_ceros = segmento.lstrip("0")
        if len(sin_ceros) > 10 or (sin_ceros and int(sin_ceros) > INT4_MAX):
            return "0"
    return segmento


def normalizar_ruta(ruta: str) -> str:
    """`ruta` con cada segmento numérico mayor que `int4` reemplazado por `0` (el id que no existe)."""
    return "/".join(_segmento(s) for s in ruta.split("/"))


class IdsFueraDeRango:
    """Middleware ASGI puro: ver el docstring del módulo."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] == "http":
            nueva = normalizar_ruta(scope["path"])
            if nueva != scope["path"]:
                scope = {**scope, "path": nueva}
                if "raw_path" in scope:
                    scope["raw_path"] = nueva.encode()
        await self.app(scope, receive, send)
