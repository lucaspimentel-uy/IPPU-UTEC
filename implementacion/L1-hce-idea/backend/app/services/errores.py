"""Errores de dominio — lo que un servicio puede decir que salió mal.

Los servicios **levantan estas excepciones y nunca importan FastAPI**: la
traducción a HTTP (409/422/403/404 + cuerpo JSON) vive en
`app/routers/errores.py`. Así la misma regla se puede llamar desde un router, un
script de seed o un test sin arrastrar el framework.

Cada error lleva `detalle`: una lista de `{"campo": str | None, "mensaje": str}`.
Es una **lista** también cuando hay un solo problema, para que el cliente tenga
una sola forma que leer (la validación de entrada puede juntar varios).

⚠️ **No hay un error de secuencia, a propósito.** IPPU contestó (B4) que la
secuencia «sólo avisa» (`handoff.md` §5.95): escribir o firmar fuera de orden se
acepta y sale como `warnings[]` en la respuesta, no como excepción. Lo que sí
sigue bloqueando es **firma = bloqueo** → `SignedModuleError`.
"""
from collections.abc import Iterable
from typing import TypedDict


class Detalle(TypedDict):
    campo: str | None
    mensaje: str


class ErrorDeDominio(Exception):
    """Base. `code` es estable y legible por máquina; `mensaje` es para personas."""

    code = "error"

    def __init__(self, mensaje: str, detalle: Iterable[tuple[str | None, str]] | None = None):
        super().__init__(mensaje)
        self.mensaje = mensaje
        pares = list(detalle) if detalle is not None else [(None, mensaje)]
        self.detalle: list[Detalle] = [{"campo": c, "mensaje": m} for c, m in pares]


class NotFound(ErrorDeDominio):
    """El recurso pedido no existe → 404."""

    code = "not_found"


class ConflictError(ErrorDeDominio):
    """El pedido choca con el estado actual (duplicado, estado incompatible) → 409."""

    code = "conflict"


class SignedModuleError(ConflictError):
    """Se intentó editar un módulo ya firmado → 409. Se corrige por addenda (§4.1).

    Subclase de `ConflictError`: para el cliente es un 409, pero con su propio
    `code` para que la pantalla pueda ofrecer «agregar addenda» y no «reintentar».
    """

    code = "signed_module"


class ValidationFailed(ErrorDeDominio):
    """Datos inválidos según una regla del servidor → 422, con un detalle por campo."""

    code = "validation_error"

    def __init__(self, detalle: Iterable[tuple[str | None, str]]):
        pares = list(detalle)
        if not pares:
            raise ValueError("ValidationFailed necesita al menos un problema")
        super().__init__("Datos inválidos", pares)


class ForbiddenAction(ErrorDeDominio):
    """La acción no está permitida en este estado o para este actor → 403."""

    code = "forbidden"
