"""Schemas de HCE-INC (ficha de inclusión y bitácora de gestiones) — C4. Reglas: `app/services/inclusion.py`.

**`extra="forbid"` en la entrada, a propósito.** `fecha_estado` la escribe el sistema en cada cambio de
estado, nunca a mano (docstring de `Inclusion.fecha_estado`); `sensible` se deriva del tema; el autor de
una gestión es el usuario del token (§5.119 b). Un cuerpo que mande cualquiera de ellos es 422, no se
ignora. Los largos son los de las columnas (`app/models/inclusion.py`). **La API no expone `semaforo`**
(§5.154 d): el estado se muestra en tinta, con su nombre y su descripción.
"""
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

_FICHA_EJEMPLO = {
    "centro": "Escuela N.º 000 (ejemplo)", "tipo_centro": "Escuela común (ANEP)", "grado": "4.º año",
    "modalidad": "Jornada completa con apoyo de maestra de clase", "dias_horas": "Lunes a viernes · 4 horas",
    "at": "No", "at_nombre": None, "ref_nombre": "Mtra. de clase (ejemplo)", "ref_rol": "Maestra",
    "ref_tel": None, "estado": "Inclusión plena",
    "estado_descripcion": "Concurre con regularidad, en horario completo o acordado como suficiente.",
    "fecha_estado": "2026-11-04", "obs": None, "actualizado_en": "2026-11-04T10:00:00-03:00",
}
_GESTION_EJEMPLO = {
    "id": 5, "fecha": "2026-09-15", "interlocutor": "Maestra de clase", "rol": "Centro educativo",
    "medio": "Reunión presencial", "tema": "Educativa / pedagógica", "sensible": False,
    "contenido": "Se acordaron apoyos visuales para las consignas.", "acuerdos": "Revisar en un mes.",
    "autor": {"id": 2, "nombre": "Dr. González"}, "registrado_en": "2026-09-15T12:00:00-03:00",
}
_FILA_EJEMPLO = {
    "hce_id": 2, "hc_historico": 1002, "persona": {"nombre": "Martín", "apellido": "G.", "fecha_nac": "2017-06-05"},
    "grupo": {"id": 2, "nombre": "Escolares", "anio": 2026}, "centro": "Escuela N.º 000 (ejemplo)",
    "grado": "4.º año", "tipo_centro": "Escuela común (ANEP)", "at": "No", "estado": "Inclusión plena",
    "fecha_estado": "2026-11-04", "ultima_gestion": "2026-10-20", "gestiones": 2,
}
EJEMPLO_FICHA = _FICHA_EJEMPLO
EJEMPLO_RESULTADO_FICHA = {"data": _FICHA_EJEMPLO, "warnings": []}
EJEMPLO_GESTION = {"data": _GESTION_EJEMPLO, "warnings": []}
EJEMPLO_GESTIONES = [_GESTION_EJEMPLO]
EJEMPLO_LISTA = [_FILA_EJEMPLO]
EJEMPLO_OPCIONES = {
    "estados": [
        {"nombre": "Inclusión plena", "descripcion": "Concurre con regularidad…", "orden": 0, "asignable": True},
        {"nombre": "Sin registrar", "descripcion": "El área de Inclusión aún no registró la situación.", "orden": 6, "asignable": False},
    ],
    "tipos_centro": ["Escuela especial (ANEP)", "Escuela común (ANEP)", "…"],
    "at_estados": ["No", "Sí", "En trámite (lista de espera)"],
    "temas": ["Educativa / pedagógica", "…", "Clínica — sensible"],
    "tema_sensible": "Clínica — sensible",
    "medios": ["WhatsApp", "Llamada", "…"],
    "roles": ["Familia", "Centro educativo", "…"],
}

_DESCRIPCION_ESTADO = (
    "Uno de los estados **asignables** de `GET /inclusion/opciones` («Sin registrar» es la ausencia de "
    "registro y no se elige). Cambiarlo fija `fecha_estado` = hoy, en el servidor."
)


# ── Ficha ────────────────────────────────────────────────────────────────────
class _FichaCampos(BaseModel):
    centro: str | None = Field(None, max_length=200, description="Nombre del centro educativo, **como texto** (sin catálogo, §5.52).")
    tipo_centro: str | None = Field(None, max_length=60, description="Uno de `tipos_centro` de `GET /inclusion/opciones`.")
    grado: str | None = Field(None, max_length=120, description="Grado, clase o taller (texto libre).")
    modalidad: str | None = Field(None, max_length=200, description="Modalidad de concurrencia (texto libre).")
    dias_horas: str | None = Field(None, max_length=120, description="Días y carga horaria, como frase.")
    at: str | None = Field(None, max_length=30, description="Asistente personal / AT: uno de `at_estados`.")
    at_nombre: str | None = Field(None, max_length=200, description="Nombre del/la acompañante.")
    ref_nombre: str | None = Field(None, max_length=200, description="Referente en el centro.")
    ref_rol: str | None = Field(None, max_length=120, description="Su cargo en el centro (texto libre).")
    ref_tel: str | None = Field(None, max_length=60, description="Teléfono o contacto del referente.")
    estado: str | None = Field(None, max_length=60, description=_DESCRIPCION_ESTADO)
    obs: str | None = Field(None, description="Observaciones generales.")


class FichaCrear(_FichaCampos):
    """Alta de la ficha (una por expediente). Todo es opcional, pero **no todo vacío**. Sin `estado`, la
    ficha queda en «Sin registrar» y sin `fecha_estado`."""

    model_config = ConfigDict(extra="forbid", json_schema_extra={"examples": [{
        "centro": "Escuela N.º 000 (ejemplo)", "tipo_centro": "Escuela común (ANEP)", "grado": "4.º año",
        "estado": "Inclusión plena",
    }]})


class FichaActualizar(_FichaCampos):
    """Edición parcial: sólo las claves presentes. `null` o blanco borra un campo; **`estado` no admite
    `null`**."""

    model_config = ConfigDict(extra="forbid", json_schema_extra={"examples": [{"estado": "En adaptación"}]})


class FichaDetalle(BaseModel):
    centro: str | None
    tipo_centro: str | None
    grado: str | None
    modalidad: str | None
    dias_horas: str | None
    at: str | None
    at_nombre: str | None
    ref_nombre: str | None
    ref_rol: str | None
    ref_tel: str | None
    estado: str
    estado_descripcion: str | None = Field(description="Del catálogo `estado_inclusion`, resuelta al leer.")
    fecha_estado: date | None = Field(description="Cuándo se fijó el estado vigente; la escribe el servidor.")
    obs: str | None
    actualizado_en: datetime


# ── Bitácora ─────────────────────────────────────────────────────────────────
class GestionCrear(BaseModel):
    """Una gestión del área. `fecha`, `interlocutor`, `tema` y `contenido` son obligatorios (los textos no
    en blanco); el autor es el usuario del token. `sensible` lo deriva el servidor del tema."""

    model_config = ConfigDict(extra="forbid", json_schema_extra={"examples": [{
        "fecha": "2026-09-15", "interlocutor": "Maestra de clase", "rol": "Centro educativo",
        "medio": "Reunión presencial", "tema": "Educativa / pedagógica",
        "contenido": "Se acordaron apoyos visuales para las consignas.", "acuerdos": "Revisar en un mes.",
    }]})

    fecha: date = Field(description="Cuándo ocurrió la gestión.")
    interlocutor: str = Field(max_length=200, description="Con quién se habló (persona o institución). No en blanco.")
    rol: str | None = Field(None, max_length=60, description="Uno de `roles` de `GET /inclusion/opciones`.")
    medio: str | None = Field(None, max_length=60, description="Uno de `medios`.")
    tema: str = Field(max_length=60, description="Uno de `temas`; `tema_sensible` marca la entrada como sensible.")
    contenido: str = Field(description="Qué se trató. No en blanco.")
    acuerdos: str | None = Field(None, description="Acuerdos o próximos pasos.")


class AutorGestion(BaseModel):
    id: int
    nombre: str


class GestionDetalle(BaseModel):
    id: int
    fecha: date
    interlocutor: str
    rol: str | None
    medio: str | None
    tema: str
    sensible: bool = Field(description=(
        "Derivado del tema («Clínica — sensible»). Restringe **compartir**, no guardar; hoy no tiene efecto (§5.39)."
    ))
    contenido: str
    acuerdos: str | None
    autor: AutorGestion | None = Field(description="Quien la registró; `null` si el profesional ya no existe.")
    registrado_en: datetime


# ── Opciones y lista del área ────────────────────────────────────────────────
class EstadoOpcion(BaseModel):
    nombre: str
    descripcion: str
    orden: int
    asignable: bool = Field(description="`false` sólo para «Sin registrar»: la ausencia de registro no se elige.")


class OpcionesInclusion(BaseModel):
    estados: list[EstadoOpcion] = Field(description="Los 7 estados en `orden`. **Supuesto nuestro, sin confirmar por IPPU.**")
    tipos_centro: list[str]
    at_estados: list[str]
    temas: list[str]
    tema_sensible: str
    medios: list[str]
    roles: list[str]


class PersonaFila(BaseModel):
    nombre: str
    apellido: str
    fecha_nac: date | None = Field(description="Para mostrar la edad (no se guarda en ningún lado).")


class GrupoFila(BaseModel):
    id: int
    nombre: str
    anio: int


class FichaFila(BaseModel):
    hce_id: int
    hc_historico: int | None
    persona: PersonaFila
    grupo: GrupoFila | None
    centro: str | None
    grado: str | None
    tipo_centro: str | None
    at: str | None
    estado: str
    fecha_estado: date | None
    ultima_gestion: date | None = Field(description="La fecha más reciente de la bitácora (`null` sin gestiones). La calcula el servidor.")
    gestiones: int = Field(description="Cantidad de gestiones registradas.")
