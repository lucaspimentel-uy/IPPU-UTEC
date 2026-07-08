"""Punto de entrada de la API (Fase 0).

Levantar con:  uvicorn app.main:app --reload
Docs (Swagger): http://127.0.0.1:8000/docs
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import catalogo, clinica, evaluaciones, nna, personas

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="API de la Historia Clínica Electrónica + protocolo IDEA (IPPU × UTEC-LIDIA).",
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


# Routers de dominio (Fase 2)
app.include_router(nna.router)
app.include_router(evaluaciones.router)
app.include_router(clinica.router)
app.include_router(catalogo.router)
app.include_router(personas.router)
