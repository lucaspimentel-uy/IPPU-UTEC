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
engine = create_engine(settings.database_url, pool_pre_ping=True)
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
