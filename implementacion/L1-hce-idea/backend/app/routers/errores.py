"""Traducción de errores a HTTP — un solo cuerpo para todos: `{"code", "detail": [...]}`.

Contrato en `app/routers/__init__.py`. Los servicios no saben nada de esto: sólo
levantan `ErrorDeDominio` (`app/services/errores.py`).
"""
import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import DataError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.services.errores import (
    ArchivoDemasiadoGrande, ConflictError, ErrorDeDominio, ForbiddenAction, NotFound, Unauthorized, ValidationFailed,
)

logger = logging.getLogger(__name__)

# El orden importa sólo para las subclases: `SignedModuleError` es un
# `ConflictError`, así que cae en el 409 sin figurar acá.
_STATUS: tuple[tuple[type[ErrorDeDominio], int], ...] = (
    (NotFound, 404),
    (ConflictError, 409),
    (ValidationFailed, 422),
    (ForbiddenAction, 403),
    (Unauthorized, 401),
    (ArchivoDemasiadoGrande, 413),
)


def _cuerpo(code: str, detail: list[dict]) -> dict:
    return {"code": code, "detail": detail}


def _status_de(exc: ErrorDeDominio) -> int:
    for clase, status in _STATUS:
        if isinstance(exc, clase):
            return status
    return 400  # un ErrorDeDominio sin mapear es un error del cliente, no un bug nuestro


def registrar_manejadores(app: FastAPI) -> None:
    # ── 500: lo que nadie previó (§5.115 c) ──────────────────────────────────
    # Es un *middleware* y no `@app.exception_handler(Exception)` por dos motivos:
    #  1. Starlette resuelve ese handler en `ServerErrorMiddleware`, que está **afuera**
    #     de `CORSMiddleware`: la respuesta saldría sin cabeceras CORS y el navegador
    #     de la demo vería un fallo de red en vez del sobre.
    #  2. Ese camino vuelve a levantar la excepción después de responder, y uvicorn
    #     la loguea una segunda vez.
    # Hay que registrarlo **antes** de `add_middleware(CORSMiddleware)` (en `main.py`
    # esta función se llama primero): el último agregado queda más afuera.
    @app.middleware("http")
    async def _inesperado(request: Request, call_next):
        try:
            return await call_next(request)
        except Exception:  # noqa: BLE001 — es justamente el «cualquier otra cosa»
            logger.exception("Error no controlado en %s %s", request.method, request.url.path)
            return JSONResponse(
                _cuerpo("internal_error", [{"campo": None, "mensaje": "Error interno"}]),
                status_code=500,
            )

    @app.exception_handler(ErrorDeDominio)
    async def _dominio(_: Request, exc: ErrorDeDominio) -> JSONResponse:
        # RFC 6750: un 401 de un recurso protegido con Bearer anuncia el esquema.
        cabeceras = {"WWW-Authenticate": "Bearer"} if isinstance(exc, Unauthorized) else None
        return JSONResponse(
            _cuerpo(exc.code, list(exc.detalle)), status_code=_status_de(exc), headers=cabeceras,
        )

    @app.exception_handler(DataError)
    async def _dato_que_la_base_rechaza(request: Request, exc: DataError) -> JSONResponse:
        """Un valor que pasó la validación pero que la base no acepta (un entero fuera de rango, una fecha imposible…):
        **422** `invalid_value`, `campo` null y un mensaje genérico (B1, §5.163 a). La sesión ya hizo rollback (la
        dependencia transaccional, o el cierre de la sesión en un GET) antes de llegar acá. **La causa va al log y no a
        la respuesta**, y el log lleva la clase, el SQLSTATE y —si el driver los da— la tabla y la columna, pero ni el
        texto del error ni los valores: el mensaje de Postgres puede citar el dato que se mandó (`invalid input syntax
        for type date: "…"`) y con `hide_parameters` el log tampoco los trae (B8)."""
        origen = exc.orig
        diag = getattr(origen, "diag", None)
        logger.warning(
            "Valor rechazado por la base en %s %s: %s sqlstate=%s tabla=%s columna=%s",
            request.method, request.url.path, type(origen).__name__, getattr(origen, "sqlstate", None),
            getattr(diag, "table_name", None), getattr(diag, "column_name", None),
        )
        return JSONResponse(
            _cuerpo("invalid_value", [{"campo": None, "mensaje": "Alguno de los valores enviados no es válido."}]),
            status_code=422,
        )

    @app.exception_handler(RequestValidationError)
    async def _entrada(_: Request, exc: RequestValidationError) -> JSONResponse:
        """Lo que FastAPI/Pydantic rechazan antes de llegar al servicio (tipos, largos).

        Un mismo valor puede fallar en dos lugares y salir dos veces idéntico: el id de `/idea/{idea_id}` lo valida la
        dependencia de alcance (`_visible_por`, S1b §5.168) y otra vez el endpoint. Es **un** error, así que los pares
        `(campo, mensaje)` repetidos se cuentan una sola vez, en el orden en que aparecen."""
        detalle: list[dict] = []
        for e in exc.errors():
            item = {
                # `loc` empieza con «body» / «query» / «path»: se descarta.
                "campo": ".".join(str(p) for p in e["loc"][1:]) or None,
                "mensaje": e["msg"],
            }
            if item not in detalle:
                detalle.append(item)
        return JSONResponse(_cuerpo(ValidationFailed.code, detalle), status_code=422)

    @app.exception_handler(StarletteHTTPException)
    async def _http(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        """404 de ruta inexistente, 405, etc.: mismo cuerpo que el resto."""
        return JSONResponse(
            _cuerpo("http_error", [{"campo": None, "mensaje": str(exc.detail)}]),
            status_code=exc.status_code,
            headers=getattr(exc, "headers", None),
        )
