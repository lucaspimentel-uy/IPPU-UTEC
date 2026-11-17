"""Configuración de SQLAlchemy: engine, sesión y Base declarativa.

Postgres-only (handoff.md §5.2.1) — sin los `connect_args` que necesitaba SQLite.
"""
from sqlalchemy import MetaData, create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

# Nombres deterministas para índices y constraints. Sin esto Postgres inventa
# nombres y `alembic revision --autogenerate` produce diffs distintos en cada
# máquina; con esto, las migraciones son reproducibles entre los tres del equipo.
CONVENCION_NOMBRES = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

# pool_pre_ping: descarta conexiones muertas antes de usarlas. Con el Postgres
# en un contenedor que se reinicia, sin esto la primera consulta tras un
# `docker compose restart` falla.
#
# hide_parameters: un error de la base (`StatementError`, `DataError`) sale en el log con el SQL **sin** los valores
# enlazados. Sin esto, el log llevaba `[parameters: (...)]` con la C.I., el nombre o lo que hubiera en la sentencia
# (B8, §5.157): datos de NNA en un archivo de texto. Sigue la sentencia y el tipo de error, que es lo que sirve.
engine = create_engine(settings.database_url, pool_pre_ping=True, hide_parameters=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base declarativa de la que heredan todos los modelos."""

    metadata = MetaData(naming_convention=CONVENCION_NOMBRES)


def get_db():
    """Dependencia de FastAPI: entrega una sesión y la cierra al terminar."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def fabrica_registro():
    """Dependencia de FastAPI: **la fábrica de sesiones del registro de accesos** (A2, §5.178).

    Las filas automáticas de `acceso_hce` y las de `acceso_intento` se escriben en **su propia sesión** —otra conexión
    del pool, otra transacción—, que se commitea antes de que siga el pedido: lo que le pase después a la transacción del
    pedido no las toca (`app/services/registro_accesos.py` dice por qué). En producción es `SessionLocal`; un test la
    reemplaza por `app.dependency_overrides[fabrica_registro]` (la suite, por una fábrica sobre su única conexión; los
    de concurrencia, por una sobre conexiones reales).

    Es la misma fábrica y el mismo pool que `get_db` a propósito: quien registra **suelta primero** la conexión del
    pedido (`Registro.escribir`, en `app/routers/dependencias.py`), así que nadie espera una segunda conexión con una en
    la mano y el pool no se puede trabar.
    """
    return SessionLocal
