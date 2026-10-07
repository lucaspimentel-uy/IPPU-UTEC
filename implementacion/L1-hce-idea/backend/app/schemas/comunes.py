"""Schemas compartidos por todos los routers: el sobre de respuesta y el de error.

El contrato está explicado en el docstring de `app/routers/__init__.py`.
"""
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class Aviso(BaseModel):
    """Un aviso no bloqueante dentro de `warnings[]`.

    `code` es estable (para que la pantalla decida qué mostrar); `mensaje` es
    para personas. Admite campos extra por tipo de aviso (p. ej. el módulo al que
    se refiere), así que **agregar un aviso nuevo no cambia el contrato**.
    """

    model_config = ConfigDict(extra="allow")

    code: str
    mensaje: str


class Resultado(BaseModel, Generic[T]):
    """Sobre de las respuestas de **mutación** (POST / PATCH / PUT).

    `warnings` está **siempre presente**; vacío cuando no hay nada que avisar. La
    secuencia del flujo sólo avisa (`handoff.md` §5.95): una escritura fuera de
    orden se acepta y el aviso viaja acá, con HTTP 2xx.
    """

    data: T
    warnings: list[Aviso] = Field(default_factory=list)


class DetalleError(BaseModel):
    campo: str | None = Field(None, description="Campo al que se refiere, si aplica.")
    mensaje: str


class RespuestaError(BaseModel):
    """Cuerpo de **todos** los errores de la API (404, 409, 422, 403)."""

    code: str = Field(description="not_found · conflict · signed_module · validation_error · forbidden · http_error")
    detail: list[DetalleError]
