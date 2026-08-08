"""Punto de entrada de la API.

Levantar con:  uvicorn app.main:app --reload
Docs (Swagger): http://127.0.0.1:8000/docs

Estado: **M11.2** — modelos y catálogos del esquema v2 en su lugar. Los routers
de dominio se reconstruyen en M11.4 (los de la v1 se retiraron porque hablaban
del modelo anterior al Documento Técnico; ver backend/docs/esquema-datos-v2.md §3).
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

app = FastAPI(
    title=settings.app_name,
    version="2.0.0-dev",
    description=(
        "API de la Historia Clínica Electrónica + protocolo IDEA (IPPU × UTEC-LIDIA). "
        "Esquema v2 (M11) — Servicio de Atención Diurna."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["infra"])
def health():
    """Chequeo de vida de la API."""
    return {"status": "ok", "app": settings.app_name, "env": settings.environment}
