"""Dependencias compartidas por los routers."""
from collections.abc import Iterator

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db


def sesion_transaccional(db: Session = Depends(get_db)) -> Iterator[Session]:
    """**Una transacción por request**: commit al volver el endpoint, rollback si falla.

    Se apoya en `get_db` (que abre y cierra la sesión) y le agrega el único
    `commit` del request. Los servicios no commitean (`app/services/__init__.py`).

    - El endpoint vuelve sin excepción → `commit()`.
    - Cualquier excepción (de dominio, de validación, un bug) → `rollback()` de
      todo lo que el request escribió, y la excepción sigue su camino hacia el
      manejador que arma la respuesta de error.

    Los endpoints tienen que **armar la respuesta antes de volver**
    (`Schema.model_validate(...)` dentro de la función): el commit expira los
    objetos del ORM y no se debe depender de que se serialicen después.
    """
    try:
        yield db
        db.commit()
    except BaseException:
        db.rollback()
        raise
