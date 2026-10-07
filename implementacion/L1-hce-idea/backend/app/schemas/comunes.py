"""Schemas compartidos por todos los routers: el sobre de respuesta y el de error.

El contrato está explicado en el docstring de `app/routers/__init__.py`.
"""
from datetime import date
from typing import Annotated, Generic, TypeVar

from pydantic import BaseModel, BeforeValidator, ConfigDict, Field

T = TypeVar("T")


# ── Vacío en campos opcionales que no son texto (§5.115 b) ───────────────────
def _vacio_a_none(valor):
    """`""` o sólo blancos → `None`; cualquier otra cosa pasa **sin tocar**."""
    return None if isinstance(valor, str) and not valor.strip() else valor


# `BeforeValidator` corre antes de que Pydantic intente interpretar el valor: un
# `<input type="date">` vacío manda `""`, y sin esto sería un 422 «fecha inválida»
# por no haber cargado un dato opcional. Es el equivalente, para fechas, enteros y
# FKs, de `''` → `NULL` en los textos (`app/services/texto.py`, que sigue en el
# servicio porque ahí vale también para quien no entra por HTTP). **Toda rebanada
# usa estos alias en sus schemas de entrada**, no escribe su propio validador:
#
#     fecha: FechaOpcional = None
#     grupo_id: EnteroOpcional = Field(None, description="...")
VacioANone = BeforeValidator(_vacio_a_none)
FechaOpcional = Annotated[date | None, VacioANone]
EnteroOpcional = Annotated[int | None, VacioANone]  # también para las FK (`xxx_id`)


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
    """Cuerpo de **todos** los errores de la API (404, 409, 422, 403 y 500)."""

    code: str = Field(
        description="not_found · conflict · signed_module · validation_error · forbidden · http_error · "
                    "internal_error (500: mensaje genérico, nunca el texto de la excepción)",
    )
    detail: list[DetalleError]


# Respuesta 500 documentada en Swagger para **todas** las rutas (`FastAPI(responses=...)`).
RESPUESTA_500 = {500: {
    "model": RespuestaError,
    "description": "Error interno: `{\"code\": \"internal_error\", ...}` con un mensaje genérico. "
                   "La causa va al log del servidor, no a la respuesta.",
}}
