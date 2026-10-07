"""Configuración de la aplicación (variables de entorno).

Se lee de un archivo `.env` (ver `.env.example`). Desde M11.1 el proyecto es
**Postgres-only** en dev y en prod (decisión `handoff.md` §5.2.1): se abandonó
SQLite porque el esquema v2 usa JSONB y CHECKs que SQLite acepta sin aplicar,
lo que dejaba pasar en los tests errores que sí explotan contra Postgres.
"""
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    app_name: str = "HCE IDEA IPPU — API"
    environment: str = "dev"

    # Base de datos. El puerto 5440 es el que publica docker-compose.yml.
    # No es 5432 ni 5433 porque ambos suelen estar tomados por un PostgreSQL
    # instalado localmente (en esta máquina lo estaba el 5433).
    database_url: str = "postgresql+psycopg://ippu:ippu@localhost:5440/ippu"

    # Base separada para pytest (M11.5); la crea docker/initdb/00-crear-base-test.sql.
    test_database_url: str = "postgresql+psycopg://ippu:ippu@localhost:5440/ippu_test"

    # Login mínimo (§5.101, M11.3-d1): firma de los JWT y su duración. `SECRET_KEY` se
    # cambia en cualquier despliegue que no sea la máquina de cada uno (`.env.example`).
    secret_key: str = "cambiar-en-produccion"
    access_token_expire_minutes: int = 480  # 8 h: una jornada

    # CORS — orígenes desde los que el navegador puede llamar a la API (la demo HTML conectada,
    # Fase 3). Variable `CORS_ORIGINS`, **como lista JSON** (así la lee pydantic-settings). Por
    # omisión, la demo servida localmente con `python -m http.server 5500` desde `demo/`
    # (abrirla como `file://` no sirve: el navegador manda `Origin: null`).
    cors_origins: list[str] = ["http://localhost:5500", "http://127.0.0.1:5500"]

    @field_validator("database_url", "test_database_url")
    @classmethod
    def _exigir_postgres(cls, v: str) -> str:
        """Falla temprano y con un mensaje claro si alguien apunta a otro motor.

        Sin este guard, un `.env` heredado con la URL de SQLite arranca igual y
        el problema recién aparece cuando una migración con JSONB falla — lejos
        de la causa. Mejor no levantar.
        """
        if not v.startswith("postgresql"):
            raise ValueError(
                f"El proyecto es Postgres-only desde M11.1 (handoff.md §5.2.1). "
                f"URL recibida: {v!r}. Usar postgresql+psycopg://... "
                f"y levantar la base con `docker compose up -d`."
            )
        return v


settings = Settings()
