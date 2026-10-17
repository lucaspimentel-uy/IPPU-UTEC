"""Guardia de destino de las CLI que escriben en la base (`seed_demo`, `crear_usuario`) — D0, §5.139.

`app.seed_demo` y `app.crear_usuario` escriben en la base que diga `DATABASE_URL` **o, si la variable no está
exportada, el `.env`**: una revisión sembró la base de trabajo así. Antes de escribir, cada CLI imprime a qué
base va a escribir y **sale con 1 sin tocar nada** salvo que la variable `IPPU_SEED_DESTINO` valga exactamente
ese nombre de base. Quien la pone tiene que haber leído el nombre.
"""
from __future__ import annotations

import os
import sys

from sqlalchemy.engine import make_url

from app.core.config import settings

VARIABLE = "IPPU_SEED_DESTINO"


def base_destino() -> str:
    """El nombre de la base a la que escribiría esta corrida: la que usa el `engine` (entorno, si no `.env`)."""
    return make_url(settings.database_url).database or ""


def confirmar_destino(*, api: str | None = None) -> bool:
    """Imprime el destino; `True` sólo si `IPPU_SEED_DESTINO` es igual al nombre de la base. No escribe nada."""
    base = base_destino()
    print(f"Destino: base de datos «{base}»" + (f" · API {api}" if api else ""))
    if os.environ.get(VARIABLE) == base:
        return True
    print(
        f"No se escribió nada: para escribir en «{base}», {VARIABLE} tiene que valer «{base}»"
        f" (hoy: {os.environ.get(VARIABLE) or 'sin definir'}). Si no es la base que querías, "
        "exportá DATABASE_URL en esta terminal antes de correr.",
        file=sys.stderr,
    )
    return False
