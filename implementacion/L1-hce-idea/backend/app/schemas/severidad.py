"""Schemas de HCE-SEV (severidad DSM-5-TR) — C2. Reglas: `app/services/severidad.py`.

**`extra="forbid"` en la entrada, a propósito.** El autor del juicio es el usuario del token, como
el de las addendas (§5.119 b): un cuerpo que mande `profesional_id` es 422, no se ignora. Lo mismo
vale para cualquier puntaje (`idea_total`, `total`…): el nivel **no se deriva** de otro instrumento
(regla del módulo, `esquema-datos-v2.md` §4 «HCE-SEV · entrada»), así que no hay campo donde
mandarlo. Las etiquetas («Grado 2 · Necesita ayuda notable») tampoco se mandan: las resuelve el
servidor contra `severidad_nivel`.
"""
from datetime import date

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.comunes import FechaOpcional

_DESCRIPCION_NIVEL = "Grado DSM-5-TR (1, 2 o 3), por **juicio clínico**. No se deriva del IDEA ni de la Escala IPPU-TEA."
_DESCRIPCION_JUSTIFICACION = "Obligatoria y no en blanco: es lo que hace del número un juicio clínico."

_SEV_EJEMPLO = {
    "hce_id": 3, "nivel_cs": 2, "nivel_crr": 3,
    "etiqueta_cs": "Grado 2 · Necesita ayuda notable", "etiqueta_crr": "Grado 3 · Necesita ayuda muy notable",
    "justificacion": "Observación en sala y entrevista con la familia…", "fecha": "2026-03-16",
    "profesional": {"id": 2, "nombre": "Lic. Ana González"},
}
EJEMPLO_SEV = _SEV_EJEMPLO
EJEMPLO_RESULTADO_SEV = {"data": _SEV_EJEMPLO, "warnings": []}
EJEMPLO_NIVELES = [{
    "grado": 1, "etiqueta": "Grado 1 · Necesita ayuda", "descriptor_cs": "Sin apoyos, las dificultades…",
    "descriptor_crr": "La inflexibilidad interfiere…", "apoyos": "Apoyo puntual o intermitente…",
}]


class SeveridadCrear(BaseModel):
    """Registro de la severidad del expediente (una vez). **Los cuatro campos son obligatorios**: se
    guarda entero —los dos dominios— o no se guarda (§5.138 d)."""

    model_config = ConfigDict(extra="forbid", json_schema_extra={"examples": [{
        "nivel_cs": 2, "nivel_crr": 3, "justificacion": "Observación en sala y entrevista con la familia…",
        "fecha": "2026-03-16",
    }]})

    nivel_cs: int = Field(ge=1, le=3, description=f"Comunicación social. {_DESCRIPCION_NIVEL}")
    nivel_crr: int = Field(ge=1, le=3, description=f"Comportamientos restringidos y repetitivos. {_DESCRIPCION_NIVEL}")
    justificacion: str = Field(description=_DESCRIPCION_JUSTIFICACION)
    fecha: date = Field(description="Cuándo se emitió el juicio.")


class SeveridadActualizar(BaseModel):
    """Edición parcial: sólo las claves presentes. Ninguna admite `null` ni blanco (no hay dominio a medias)."""

    model_config = ConfigDict(extra="forbid", json_schema_extra={"examples": [{
        "nivel_crr": 2, "justificacion": "Revisión del equipo tras el primer semestre…",
    }]})

    nivel_cs: int | None = Field(None, ge=1, le=3, description=_DESCRIPCION_NIVEL)
    nivel_crr: int | None = Field(None, ge=1, le=3, description=_DESCRIPCION_NIVEL)
    justificacion: str | None = Field(None, description=_DESCRIPCION_JUSTIFICACION)
    fecha: FechaOpcional = None


class ProfesionalAutor(BaseModel):
    id: int
    nombre: str


class SeveridadDetalle(BaseModel):
    hce_id: int
    nivel_cs: int
    nivel_crr: int
    etiqueta_cs: str | None = Field(description="Resuelta al leer contra `severidad_nivel`; nunca guardada (`null` si falta la fila).")
    etiqueta_crr: str | None = Field(description="Ídem, para el dominio CRR.")
    justificacion: str
    fecha: date
    profesional: ProfesionalAutor = Field(description="Quien emitió el juicio: el usuario que lo registró o lo editó por última vez.")


class SeveridadNivelDetalle(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    grado: int
    etiqueta: str
    descriptor_cs: str
    descriptor_crr: str
    apoyos: str
