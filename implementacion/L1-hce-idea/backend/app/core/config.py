"""Configuración de la aplicación (variables de entorno).

Se lee de un archivo `.env` (ver `.env.example`). Por defecto usa SQLite
para el spike local; en la Fase 6 se cambia `DATABASE_URL` a PostgreSQL.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    app_name: str = "HCE IDEA IPPU — API"
    environment: str = "dev"

    # Base de datos. SQLite por defecto (un archivo local, cero instalación).
    # Para Postgres (Fase 6): "postgresql+psycopg://user:pass@localhost:5432/ippu"
    database_url: str = "sqlite:///./ippu.db"

    # Auth (Fase 4)
    secret_key: str = "cambiar-en-produccion"
    access_token_expire_minutes: int = 480  # 8 h

    # CORS — orígenes permitidos del frontend (la demo)
    cors_origins: list[str] = ["http://localhost:8000", "http://127.0.0.1:8000"]


settings = Settings()
