"""Límites del cuerpo de un request **antes de leerlo** (auditoría de seguridad M1, §5.157 a).

Por qué hace falta: FastAPI 0.115.6 espera `request.form()` / `request.body()` **antes** de resolver las
dependencias, así que `usuario_actual` y `hce_visible` corrían con el cuerpo ya leído: un multipart de 50 MB sin
token terminaba en un temporal de 49 MB y recién ahí daba 401, y un JSON de 50 MB ocupaba memoria. FastAPI no se
sube (§5.115 d): esto es un middleware ASGI puro que decide **sin tocar un solo byte del cuerpo**.

Sólo en los métodos con cuerpo (`POST`, `PATCH`, `PUT`); `GET`, `HEAD`, `OPTIONS` y `DELETE` pasan de largo. En
este orden:

1. **Token.** Toda ruta salvo `POST /auth/login` necesita un `Authorization: Bearer` con firma y `exp` válidos
   (`leer_token`, **sin la base**); si no, **401** con `WWW-Authenticate: Bearer`. Que el profesional exista y
   esté activo lo sigue mirando `usuario_actual` (con la base), después.
2. **Tamaño declarado.** Sin `Content-Length` y con `Transfer-Encoding` (chunked) → **411**; un `Content-Length`
   que no es un número → **400**. Sin ninguna de las dos cabeceras el cuerpo es vacío (HTTP/1.1) y se trata como 0.
3. **Tope por ruta.** `Content-Length` mayor que el tope → **413** `too_large`: las tres subidas multipart
   (`POST /hce/{id}/documentos`, `/hce/{id}/fotos`, `/grupos/{id}/fotos`) admiten `ARCHIVO_TAMANO_MAXIMO` + 64 KiB
   (el archivo más el sobre multipart; el tope exacto del archivo lo sigue aplicando `services/archivos.py`) y el
   `campo` es `archivo`; cualquier otra ruta, **1 MiB** con `campo` null.
4. **Recorte.** Lo que llegue más allá del `Content-Length` declarado no le llega a la app.

Va **adentro** de `CORSMiddleware` (sus 401/411/413 llevan las cabeceras CORS: la demo los puede leer) y adentro
del middleware del 500 (`routers/errores.py`): si algo de acá falla, sale el sobre `internal_error` con CORS
(§5.115 c). Ver el orden en `main.py`.
"""
import re

from starlette.datastructures import Headers
from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.core.constantes import ARCHIVO_TAMANO_MAXIMO
from app.core.seguridad import MENSAJE_SIN_TOKEN, MENSAJE_TOKEN_INVALIDO, leer_token

METODOS_CON_CUERPO = frozenset({"POST", "PATCH", "PUT"})
#: La única ruta con cuerpo que no pide token.
RUTA_SIN_TOKEN = "/auth/login"
#: Tope de las subidas multipart: el archivo (10 MB) más el sobre (boundary, cabeceras de cada parte y los
#: campos de texto: categoría, nombre, fecha, descripción). 64 KiB sobran para eso y no para otro archivo.
TOPE_SUBIDA = ARCHIVO_TAMANO_MAXIMO + 64 * 1024
#: Tope de todo lo demás (JSON). El cuerpo más grande que mandan la demo y el seed: 1749 bytes (§5.157 a).
TOPE_JSON = 1024 * 1024
#: Las tres rutas de subida (`POST`), por su forma; un id que no es número llega igual y lo rechaza la ruta (422).
_RUTAS_DE_SUBIDA = re.compile(r"^/(?:hce/[^/]+/(?:documentos|fotos)|grupos/[^/]+/fotos)/?$")
_DIGITOS = re.compile(r"[0-9]{1,18}")

_MENSAJE_SUBIDA = "El archivo supera los 10 MB: el máximo es 10 MB."   # el mismo de services/archivos.py
_MENSAJE_JSON = "El pedido supera el máximo de 1 MB."
_MENSAJE_SIN_LARGO = "El pedido tiene que declarar su tamaño (Content-Length)."
_MENSAJE_LARGO_INVALIDO = "El tamaño declarado del pedido (Content-Length) no es válido."


def es_ruta_de_subida(metodo: str, ruta: str) -> bool:
    return metodo == "POST" and _RUTAS_DE_SUBIDA.match(ruta) is not None


def tope_de(metodo: str, ruta: str) -> int:
    return TOPE_SUBIDA if es_ruta_de_subida(metodo, ruta) else TOPE_JSON


def _error_de_token(autorizacion: str | None) -> str | None:
    """`None` si la cabecera trae un Bearer con firma y `exp` válidos; si no, el mensaje del 401.
    Se parsea como `HTTPBearer` (`esquema token`, el esquema sin mayúsculas): otro esquema = sin token."""
    esquema, _, token = (autorizacion or "").partition(" ")
    if esquema.lower() != "bearer" or not token:
        return MENSAJE_SIN_TOKEN
    return None if leer_token(token) is not None else MENSAJE_TOKEN_INVALIDO


def _sobre(status: int, code: str, campo: str | None, mensaje: str, cabeceras: dict[str, str] | None = None) -> JSONResponse:
    # **Sin** `Connection: close`, a propósito: cerrar con el cuerpo sin leer hace que el sistema operativo mande un
    # RST y el navegador vea «conexión reiniciada» en vez de esta respuesta. Con la conexión viva, uvicorn (httptools)
    # descarta el resto del cuerpo él solo —sabe dónde termina por el Content-Length o por los chunks— sin guardarlo
    # (`on_body` lo ignora cuando la respuesta ya salió). Se comprobó con `c5-rechazo` en Chrome (§5.157 a).
    return JSONResponse({"code": code, "detail": [{"campo": campo, "mensaje": mensaje}]}, status_code=status, headers=cabeceras)


def _recortado(receive: Receive, declarado: int) -> Receive:
    """`receive` que entrega a lo sumo `declarado` bytes de cuerpo; lo que sobre se descarta."""
    entregados = 0
    completo = False

    async def recibir() -> Message:
        nonlocal entregados, completo
        if completo:
            # La app ya recibió el cuerpo entero y vuelve a llamar (para enterarse de una desconexión): lo que
            # quede de cuerpo en el original —más de lo declarado— se tira y se devuelve lo siguiente.
            while True:
                mensaje = await receive()
                if mensaje["type"] != "http.request":
                    return mensaje
        mensaje = await receive()
        if mensaje["type"] != "http.request":
            return mensaje
        cuerpo = mensaje.get("body", b"")
        falta = declarado - entregados
        if len(cuerpo) >= falta:
            cuerpo, mas, completo = cuerpo[:falta], False, True
        else:
            mas = mensaje.get("more_body", False)
        entregados += len(cuerpo)
        return {"type": "http.request", "body": cuerpo, "more_body": mas}

    return recibir


class LimitesDelCuerpo:
    """Middleware ASGI puro (sin `BaseHTTPMiddleware`: ése envuelve `receive` y no hace falta)."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http" or scope["method"] not in METODOS_CON_CUERPO:
            await self.app(scope, receive, send)
            return
        metodo, ruta = scope["method"], scope["path"]
        cabeceras = Headers(scope=scope)

        # 1 · token (sin la base)
        if ruta != RUTA_SIN_TOKEN:
            error = _error_de_token(cabeceras.get("authorization"))
            if error is not None:
                await _sobre(401, "unauthorized", None, error, {"WWW-Authenticate": "Bearer"})(scope, receive, send)
                return

        # 2 · tamaño declarado
        largo = cabeceras.get("content-length")
        if largo is None:
            if "transfer-encoding" in cabeceras:
                await _sobre(411, "length_required", None, _MENSAJE_SIN_LARGO)(scope, receive, send)
                return
            declarado = 0
        elif _DIGITOS.fullmatch(largo.strip()):
            declarado = int(largo.strip())
        else:
            await _sobre(400, "http_error", None, _MENSAJE_LARGO_INVALIDO)(scope, receive, send)
            return

        # 3 · tope por ruta
        if declarado > tope_de(metodo, ruta):
            subida = es_ruta_de_subida(metodo, ruta)
            await _sobre(
                413, "too_large", "archivo" if subida else None, _MENSAJE_SUBIDA if subida else _MENSAJE_JSON,
            )(scope, receive, send)
            return

        # 4 · recorte de lo que pase del declarado
        await self.app(scope, _recortado(receive, declarado), send)
