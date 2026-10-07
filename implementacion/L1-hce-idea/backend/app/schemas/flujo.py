"""Schemas del estado de flujo — M11.3-b. Reglas: `app/services/flujo.py`."""
from typing import Literal

from pydantic import BaseModel, Field

_EJEMPLO_MODULOS = [
    {"modulo": "HCE-LB", "id": 11, "estado": "firmado", "faltantes": []},
    {"modulo": "HCE-PA", "id": None, "estado": "sin_iniciar", "faltantes": []},
    {"modulo": "HCE-PB", "id": None, "estado": "sin_iniciar", "faltantes": ["HCE-PA"]},
    {"modulo": "HCE-IC", "id": None, "estado": "sin_iniciar", "faltantes": ["HCE-PA", "HCE-PB"]},
]
EJEMPLO_FLUJO = {"hce_id": 3, "anio": 2026, "ci": "registrado", "modulos": _EJEMPLO_MODULOS}

#: Ejemplo de `warnings[]` por escribir o firmar fuera de secuencia (§5.95). La secuencia sólo
#: avisa: la respuesta es 2xx y el aviso viaja acá. Es el contrato que usan PA/PB/IC; LB es el
#: primer eslabón y por eso nunca lo produce.
EJEMPLO_AVISO_SECUENCIA = [{
    "code": "fuera_de_secuencia",
    "mensaje": "HCE-PB (2026) quedó fuera de secuencia: faltan firmar HCE-PA",
    "modulo": "HCE-PB",
    "anio": 2026,
    "faltan": ["HCE-PA"],
}]


class EslabonFlujo(BaseModel):
    modulo: str = Field(description="`HCE-LB` · `HCE-PA` · `HCE-PB` · `HCE-IC`, en el orden de la cadena.")
    id: int | None = Field(description="Id de la fila del módulo; `null` si todavía no existe.")
    estado: Literal["sin_iniciar", "en_curso", "firmado"] = Field(
        description="Derivado, nunca almacenado: sin fila · fila sin firmar · fila firmada."
    )
    faltantes: list[str] = Field(
        description="Eslabones **anteriores** del mismo año que no están firmados (los ve la pantalla; no bloquean)."
    )


class FlujoDetalle(BaseModel):
    hce_id: int
    anio: int
    ci: Literal["pendiente", "registrado"] = Field(
        description="Estado del consentimiento (una vez por HCE). `pendiente` no traba nada ni produce aviso (§5.94)."
    )
    modulos: list[EslabonFlujo]
