"""Punto de entrada de la API.

Levantar con:  uvicorn app.main:app --reload
Docs (Swagger): http://127.0.0.1:8000/docs

Estado: **M11.3-a** — cimientos de la capa de servicios (errores, sobre de
respuesta `{data, warnings}`, una transacción por request, auditoría de campo) y
la primera rebanada vertical: persona + expediente (`/hce`) y, desde M11.3-a2, las
listas de sólo lectura `/grupos` y `/profesionales`. Los routers se
entregan **por rebanadas** (M11.4 se disolvió, `handoff.md` §5.106); los de la v1
se retiraron porque hablaban del modelo anterior al Documento Técnico (ver
backend/docs/esquema-datos-v2.md §3). El contrato de respuesta está en el
docstring de `app/routers/__init__.py`.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import hce, referencias
from app.routers.errores import registrar_manejadores

app = FastAPI(
    title=settings.app_name,
    version="2.0.0-dev",
    description=(
        "API de la Historia Clínica Electrónica + protocolo IDEA (IPPU × UTEC-LIDIA). "
        "Esquema v2 (M11) — Servicio de Atención Diurna.\n\n"
        "**Contrato de respuesta.** GET devuelve el recurso directo. POST/PATCH/PUT "
        "devuelven `{\"data\": <recurso>, \"warnings\": []}` (`warnings` siempre presente: "
        "avisos no bloqueantes). Todos los errores devuelven "
        "`{\"code\": str, \"detail\": [{\"campo\": str|null, \"mensaje\": str}]}`. "
        "Una transacción por request."
    ),
)

registrar_manejadores(app)
app.include_router(hce.router)
app.include_router(referencias.router_grupos)
app.include_router(referencias.router_profesionales)

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
