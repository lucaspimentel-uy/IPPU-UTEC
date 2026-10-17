"""Punto de entrada de la API.

Levantar con:  uvicorn app.main:app --reload
Docs (Swagger): http://127.0.0.1:8000/docs

Estado: **M11.3-c** sobre los cimientos de M11.3-a (errores, sobre de respuesta
`{data, warnings}`, una transacción por request, auditoría de campo): persona +
expediente (`/hce`), las listas de sólo lectura `/grupos` y `/profesionales`
(M11.3-a2) y, desde M11.3-b, el estado de flujo y el consentimiento
(`/hce/{id}/flujo`, `/hce/{id}/consentimiento`) y el IDEA con su firma, addendas
y «cuál rige» (`/hce/{id}/idea`, `/idea/{id}`). Desde **M11.3-c**, los
Protocolos A/B con su Δ y alerta (`/hce/{id}/protocolo`, `/protocolo/{id}`), el
Δ interanual del IDEA (`/hce/{id}/idea/delta`) y el informe de cierre con su
recibí y los datos del documento imprimible (`/hce/{id}/informe-cierre`,
`/informe-cierre/{id}`). Desde **M11.3-d1**, el login mínimo (`/auth/login`: todo lo
demás pide token; el `tecnico` ve sólo los expedientes de sus grupos, §5.101), la
valoración funcional (`/hce/{id}/valoracion-funcional`) y la paginación de `GET /hce`.
Los routers se
entregan **por rebanadas** (M11.4 se disolvió, `handoff.md` §5.106); los de la v1
se retiraron porque hablaban del modelo anterior al Documento Técnico (ver
backend/docs/esquema-datos-v2.md §3). El contrato de respuesta está en el
docstring de `app/routers/__init__.py`.
"""
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import auditoria, auth, flujo, hce, idea, informe_cierre, protocolo, referencias, valoracion_funcional
from app.routers.dependencias import usuario_actual
from app.routers.errores import registrar_manejadores
from app.schemas.comunes import RESPUESTA_500

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
        "Los errores no previstos son `500` con `code: \"internal_error\"` y un mensaje "
        "genérico (la causa va al log, no a la respuesta). "
        "Una transacción por request; los GET no commitean.\n\n"
        "**Autenticación.** `POST /auth/login` con `{email, password}` devuelve `access_token`; "
        "todas las rutas salvo `/health`, `/auth/login` y la documentación lo piden en "
        "`Authorization: Bearer <token>` (sin token o vencido: `401`). Un `tecnico` sólo ve los "
        "expedientes de los grupos en los que es técnico/a 1 o 2; uno fuera de su alcance es `404`, "
        "igual que uno que no existe."
    ),
    responses=RESPUESTA_500,
)

registrar_manejadores(app)

# Sin token: sólo el login (y `/health` y la documentación, que no pasan por un router).
app.include_router(auth.router)

# **Todo lo demás pide token** (§5.101): la dependencia va en el `include_router`, así una
# ruta nueva de estos routers no puede quedar abierta por olvido. El alcance por grupo
# (404 fuera de él) lo agrega cada router sobre su `{hce_id}` o id de recurso.
_PROTEGIDO = [Depends(usuario_actual)]
for _router in (
    hce.router,
    flujo.router,
    auditoria.router,
    idea.router_hce, idea.router,
    protocolo.router_hce, protocolo.router,
    informe_cierre.router_hce, informe_cierre.router,
    valoracion_funcional.router,
    referencias.router_grupos, referencias.router_profesionales,
):
    app.include_router(_router, dependencies=_PROTEGIDO)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    # Sin esto el navegador no deja leer el total de la búsqueda paginada (`GET /hce`).
    expose_headers=[hce.CABECERA_TOTAL],
)


@app.get("/health", tags=["infra"])
def health():
    """Chequeo de vida de la API."""
    return {"status": "ok", "app": settings.app_name, "env": settings.environment}
