"""Cabeceras de seguridad de **toda** respuesta de la API (B13, parte de la API; `handoff.md` §5.163 d).

Un middleware ASGI puro, el **más externo** de la pila (`main.py`): así cubre también el preflight de CORS, los 401, 411
y 413 de `LimitesDelCuerpo` y el sobre del 500. Pone, en cada respuesta:

- `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` y `X-Frame-Options: DENY`;
- `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`, **salvo** en `/docs`, `/redoc` y la página de
  retorno de OAuth2 de Swagger: esas páginas necesitan sus scripts y sólo existen con `ENVIRONMENT=dev` (B12);
- `Cache-Control: no-store` en todo lo que no sea público: cualquier respuesta que no sea `/health`, la documentación
  ni un preflight. Eso incluye el `POST /auth/login` (lleva el token) y todo lo que está detrás de él. Las descargas de
  archivos ya lo traen y no se duplica.

Una cabecera que la ruta ya puso **no se pisa**. **HSTS no va acá**: es del despliegue (TLS). La CSP de la demo (que es un
HTML servido aparte, no por esta API) espera al frontend en React (R8).
"""
from starlette.datastructures import MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send

#: Las páginas de la documentación (sólo con `ENVIRONMENT=dev`): llevan scripts, así que no tienen esta CSP.
RUTAS_DE_DOCUMENTACION = frozenset({"/docs", "/docs/oauth2-redirect", "/redoc"})
#: Lo que se puede cachear: no hay datos detrás de un token.
RUTAS_PUBLICAS = RUTAS_DE_DOCUMENTACION | {"/health", "/openapi.json"}
CSP = "default-src 'none'; frame-ancestors 'none'"

CABECERAS_FIJAS = (
    ("X-Content-Type-Options", "nosniff"),
    ("Referrer-Policy", "no-referrer"),
    ("X-Frame-Options", "DENY"),
)


class CabecerasDeSeguridad:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        ruta, metodo = scope["path"].rstrip("/") or "/", scope["method"]

        async def enviar(mensaje: Message) -> None:
            if mensaje["type"] == "http.response.start":
                cabeceras = MutableHeaders(scope=mensaje)
                for nombre, valor in CABECERAS_FIJAS:
                    cabeceras.setdefault(nombre, valor)
                if ruta not in RUTAS_DE_DOCUMENTACION:
                    cabeceras.setdefault("Content-Security-Policy", CSP)
                if ruta not in RUTAS_PUBLICAS and metodo != "OPTIONS":
                    cabeceras.setdefault("Cache-Control", "no-store")
            await send(mensaje)

        await self.app(scope, receive, enviar)
