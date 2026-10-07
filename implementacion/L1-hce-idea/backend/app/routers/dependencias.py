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

    **Un commit que falla tiene que salir como error, no como 2xx.** Eso depende de
    que FastAPI corra el código de salida de las dependencias *antes* de enviar la
    respuesta, que es el comportamiento de `fastapi==0.115.x`; versiones posteriores
    (~0.118+, según su changelog) lo mueven *después*, y un `commit()` fallido pasaría a ser un 201 con
    datos que no se guardaron. `tests/test_m11_3a3_convenciones.py` lo verifica, y
    `requirements.txt` fija la versión por esto.
    """
    try:
        yield db
        db.commit()
    except BaseException:
        db.rollback()
        raise


def sesion_lectura(db: Session = Depends(get_db)) -> Session:
    """Sesión de los **GET**: nunca commitea (§5.115 d).

    Un GET no escribe, así que no hay nada que confirmar; `get_db` cierra la sesión
    al terminar y eso descarta la transacción implícita. Usar esto en vez de
    `sesion_transaccional` evita un `COMMIT` por cada lectura y deja el `commit`
    como señal de «este request escribió».
    """
    return db
