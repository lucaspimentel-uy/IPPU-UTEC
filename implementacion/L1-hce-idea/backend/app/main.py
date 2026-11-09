"""Punto de entrada de la API.

Levantar con:  uvicorn app.main:app --reload
Docs (Swagger): http://127.0.0.1:8000/docs — sólo con ENVIRONMENT=dev (por omisión); con otro valor son 404 (B12, §5.163 c)

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
Desde **C2**, la severidad DSM-5-TR (`/hce/{id}/severidad`, `/severidad-niveles`).
Desde **C3**, los vínculos con INAU y BPS y sus registros (`/hce/{id}/organismos`, `/organismos/opciones`).
Desde **C5**, los documentos con archivo, la autorización de imagen y las fotos (`/hce/{id}/documentos`,
`/documentos/categorias`, `/hce/{id}/autorizacion-imagen`, `/hce/{id}/fotos`, `/grupos/{id}/fotos`).
Desde **C6**, los ateneos y las jornadas con sus acuerdos, su indicador y sus documentos (`/ateneos`).
Los routers se
entregan **por rebanadas** (M11.4 se disolvió, `handoff.md` §5.106); los de la v1
se retiraron porque hablaban del modelo anterior al Documento Técnico (ver
backend/docs/esquema-datos-v2.md §3). El contrato de respuesta está en el
docstring de `app/routers/__init__.py`.
"""
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.cabeceras import CabecerasDeSeguridad
from app.core.config import settings
from app.core.entrada import IdsFueraDeRango, sin_caracter_nulo
from app.core.limites import LimitesDelCuerpo
from app.routers import (
    accesos, ateneos, auditoria, auth, documentos, flujo, fotos, hce, idea, inclusion, informe_cierre, organismos, panel,
    protocolo, referencias, severidad, valoracion_funcional,
)
from app.routers.dependencias import usuario_actual
from app.routers.errores import registrar_manejadores
from app.schemas.comunes import RESPUESTA_500

_DESCRIPCION = (
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
    "`Authorization: Bearer <token>` (sin token o vencido: `401`).\n\n"
    "**Roles y matriz** (Fase 4): `tecnico` · `coordinacion` · `administrativo` · `direccion_nt`. El tratante es técnico/a 1 "
    "o 2 del grupo del expediente. El rol se mira antes que la existencia (`403` `forbidden`, exista o no); un inexistente es "
    "`404`; un expediente que el técnico no tratante o la coordinación abren con motivo responde `403` `reason_required` "
    "hasta registrar el motivo en `POST /hce/{id}/accesos` (una ventana de 120 minutos).\n\n"
    "**Límites del cuerpo** (`POST`, `PATCH`, `PUT`; se deciden antes de leer el cuerpo): sin un token válido, `401` "
    "(salvo `/auth/login`); chunked sin `Content-Length`, `411`; más de 1 MB —o de 10 MB + 64 KiB en las cuatro "
    "subidas multipart—, `413` `too_large`.\n\n"
    "**Entrada.** Un carácter nulo (U+0000) en cualquier texto, clave o valor de un JSON, de un formulario o de la "
    "query es `422` con su `campo`; un id de ruta fuera del rango de `int4` es `404`, igual que uno que no existe; "
    "un valor que la base rechaza igual es `422` `invalid_value`."
)


def es_dev(entorno: str) -> bool:
    return entorno.strip().lower() == "dev"


def crear_app(entorno: str | None = None) -> FastAPI:
    """La aplicación. `entorno` (por omisión `settings.environment`, o sea `ENVIRONMENT`) decide la documentación:
    `/docs`, `/redoc` y `/openapi.json` existen **sólo con `dev`**, que es el valor por omisión (la presentación y el
    trabajo local no cambian); con cualquier otro valor son 404 (B12, §5.163 c). `openapi.json` se genera en dev."""
    entorno = settings.environment if entorno is None else entorno
    documentacion = (
        {} if es_dev(entorno) else {"docs_url": None, "redoc_url": None, "openapi_url": None}
    )
    app = FastAPI(
        title=settings.app_name, version="2.0.0-dev", description=_DESCRIPCION, responses=RESPUESTA_500, **documentacion,
    )

    # **Orden de los middlewares** (el último que se agrega queda más afuera): cabeceras de seguridad → CORS → el del
    # 500 (`registrar_manejadores`) → ids fuera de int4 → `LimitesDelCuerpo` → la app. Los límites van primero para quedar
    # **adentro de los dos**: sus 401/411/413 llevan las cabeceras CORS y, si algo de ellos falla, sale el sobre
    # `internal_error` con CORS (§5.115 c, §5.157 a). Las cabeceras de seguridad van **al final**, o sea las más
    # externas: cubren también el preflight de CORS, los 401/411/413 de los límites y el sobre del 500 (§5.163 d).
    app.add_middleware(LimitesDelCuerpo)
    app.add_middleware(IdsFueraDeRango)
    registrar_manejadores(app)

    # Sin token: sólo el login (y `/health` y la documentación, que no pasan por un router). Un NUL en el email o la
    # contraseña es un 422, no un 500 de la base.
    app.include_router(auth.router, dependencies=[Depends(sin_caracter_nulo)])

    # **Todo lo demás pide token** (§5.101): la dependencia va en el `include_router`, así una
    # ruta nueva de estos routers no puede quedar abierta por olvido. El alcance por grupo
    # (404 fuera de él) lo agrega cada router sobre su `{hce_id}` o id de recurso. Después del token y **antes** de
    # los guards de alcance, el rechazo del NUL (B1).
    protegido = [Depends(usuario_actual), Depends(sin_caracter_nulo)]
    for router in (
        hce.router,
        flujo.router,
        auditoria.router,
        idea.router_hce, idea.router,
        protocolo.router_hce, protocolo.router,
        informe_cierre.router_hce, informe_cierre.router,
        valoracion_funcional.router,
        severidad.router_hce, severidad.router_niveles,
        organismos.router_hce, organismos.router_opciones,
        inclusion.router_hce, inclusion.router,
        documentos.router_categorias, documentos.router_hce, documentos.router_autorizacion,
        fotos.router_hce, fotos.router_grupo,
        ateneos.router, ateneos.router_ateneo,
        panel.router,
        referencias.router_grupos, referencias.router_profesionales, referencias.router_recordatorios,
        accesos.router_motivos, accesos.router_hce,
    ):
        app.include_router(router, dependencies=protegido)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        # La demo manda el token en `Authorization: Bearer` y no usa cookies: sin credenciales (B13, §5.163 d).
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
        # Sin esto el navegador no deja leer el total de la búsqueda paginada (`GET /hce`) ni el nombre de una descarga (C5).
        expose_headers=[hce.CABECERA_TOTAL, "Content-Disposition"],
    )
    app.add_middleware(CabecerasDeSeguridad)

    @app.get("/health", tags=["infra"])
    def health():
        """Chequeo de vida de la API."""
        return {"status": "ok", "app": settings.app_name, "env": settings.environment}

    return app


app = crear_app()
