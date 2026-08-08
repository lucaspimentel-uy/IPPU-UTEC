"""Fixtures de pytest — base Postgres aislada.

Usa `TEST_DATABASE_URL` (base `ippu_test`, que crea
`docker/initdb/00-crear-base-test.sql`). Nunca la base de desarrollo.

Requiere el contenedor arriba:  docker compose up -d
"""
import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.database import Base
import app.models  # noqa: F401  (registra las tablas en Base.metadata)


@pytest.fixture(scope="session")
def engine():
    if settings.test_database_url == settings.database_url:
        pytest.fail(
            "TEST_DATABASE_URL apunta a la misma base que DATABASE_URL. "
            "Los tests borran tablas: revisá el .env."
        )
    eng = create_engine(settings.test_database_url, pool_pre_ping=True)
    try:
        with eng.connect() as c:
            c.execute(text("SELECT 1"))
    except Exception as exc:  # noqa: BLE001
        pytest.skip(f"Postgres de test no disponible ({exc}). Correr: docker compose up -d")

    Base.metadata.drop_all(eng)
    Base.metadata.create_all(eng)
    yield eng
    eng.dispose()


@pytest.fixture
def db(engine):
    """Sesión por test, con rollback al terminar: los tests no se contaminan."""
    conexion = engine.connect()
    trans = conexion.begin()
    sesion = sessionmaker(bind=conexion, autocommit=False, autoflush=False)()
    try:
        yield sesion
    finally:
        sesion.close()
        # Un test que provoca IntegrityError deja la transacción ya abortada por
        # Postgres; sin este chequeo, el rollback explícito emite un SAWarning.
        if trans.is_active:
            trans.rollback()
        conexion.close()
