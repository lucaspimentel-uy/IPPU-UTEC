"""Schemas de ateneos y jornadas — C6 (`handoff.md` §5.158). Reglas: `app/services/ateneos.py`.

**`extra="forbid"` en la entrada, a propósito.** `anio_correlativo` y `numero` los asigna el servidor; `codigo` y
`sensible` son derivados; el autor es el usuario del token. Un cuerpo que mande cualquiera de ellos es 422, no se
ignora. Los largos son los de las columnas (`app/models/ateneo.py`). La forma según el tipo (qué referencias y qué
bloque de campos) la valida el servicio sobre el estado final, con un 422 por campo.
"""
from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.comunes import EnteroOpcional, FechaOpcional
from app.schemas.documentos import DocumentoDetalle

_ACUERDO_EJEMPLO = {"id": 4, "acuerdo": "Implementar agenda visual de transiciones en sala", "responsable_rol": "Técnico/a responsable 2",
                    "plazo": "2026-10-15", "orden": 0}
_FILA_EJEMPLO = {
    "id": 1, "codigo": "AT-2026-001", "tipo": "clinico", "tipo_label": "Ateneo clínico (NNA)", "fecha": "2026-09-18",
    "titulo": "Revisión de proceso", "sensible": True, "grupo": {"id": 2, "nombre": "Escolares", "anio": 2026},
    "nna": {"hce_id": 2, "hc_historico": 1002, "nombre": "Martín", "apellido": "G."}, "acuerdos": 2, "documentos": 0,
}
_DETALLE_EJEMPLO = {
    "id": 1, "codigo": "AT-2026-001", "anio_correlativo": 2026, "numero": 1, "tipo": "clinico",
    "tipo_label": "Ateneo clínico (NNA)", "sensible": True, "fecha": "2026-09-18", "titulo": "Revisión de proceso",
    "hce_referida_id": 2, "grupo_id": 2, "nna": _FILA_EJEMPLO["nna"], "grupo": _FILA_EJEMPLO["grupo"],
    "autor": {"id": 3, "nombre": "Dr. González"},
    "participantes": "Técnicos responsables del grupo · Coordinación técnica", "observaciones": None,
    "situacion": "Meseta en la regulación emocional en las transiciones.", "hipotesis": "Falta de anticipación visual.",
    "recursos": "Interés por la música.", "seguimiento": "Revisión en el ateneo de grupo de noviembre.",
    "capacitador": None, "modalidad": None, "contenidos": None, "materiales": None, "evaluacion": None,
    "acuerdos": [_ACUERDO_EJEMPLO], "documentos": 0,
}
EJEMPLO_FILAS = [_FILA_EJEMPLO]
EJEMPLO_DETALLE = _DETALLE_EJEMPLO
EJEMPLO_RESULTADO = {"data": _DETALLE_EJEMPLO, "warnings": []}
EJEMPLO_ACUERDO = {"data": _ACUERDO_EJEMPLO, "warnings": []}
EJEMPLO_INDICADOR = {
    "anio": 2026, "meta_total": 8, "total": 3, "meta_por_grupo": 2, "tipos_contados": ["clinico", "grupo", "institucional"],
    "grupos": [{"id": 2, "nombre": "Escolares", "anio": 2026, "cantidad": 1}],
}
EJEMPLO_OPCIONES = {
    "tipos": [{"clave": "clinico", "label": "Ateneo clínico (NNA)"}, {"clave": "jornada", "label": "Jornada de capacitación"}],
    "tipo_sensible": "clinico",
    "campos_jornada": ["capacitador", "modalidad", "contenidos", "materiales", "evaluacion"],
    "campos_desarrollo_clinico": ["situacion", "hipotesis", "recursos", "seguimiento"],
    "metas": {"total": 8, "por_grupo": 2}, "tipos_indicador": ["clinico", "grupo", "institucional"],
}

_TIPO = "Una de las claves de `GET /ateneos/opciones` (`clinico`, `grupo`, `institucional`, `jornada`)."
_NNA = "El expediente del NNA (`hce_id`): **obligatorio si y sólo si** el tipo es `clinico`; uno que no podés ver es 422."
_GRUPO = "Obligatorio en `grupo`; permitido en `clinico` (contexto); prohibido en `institucional` y `jornada`."


# ── Entrada ──────────────────────────────────────────────────────────────────
class AcuerdoCrear(BaseModel):
    """Un acuerdo: qué se acordó (no en blanco), el **rol** responsable (no un nombre) y el plazo."""

    model_config = ConfigDict(extra="forbid", json_schema_extra={"examples": [
        {"acuerdo": "Implementar agenda visual de transiciones en sala", "responsable_rol": "Técnico/a responsable 2", "plazo": "2026-10-15"},
    ]})

    acuerdo: str = Field(description="Qué se acordó. No en blanco.")
    responsable_rol: str | None = Field(None, max_length=80, description="Responsable **(rol)**, no un nombre.")
    plazo: FechaOpcional = None


class AcuerdoActualizar(BaseModel):
    """Edición de un acuerdo (sólo las claves presentes). `acuerdo` no admite vacío; `responsable_rol` y `plazo` sí."""

    model_config = ConfigDict(extra="forbid", json_schema_extra={"examples": [{"plazo": "2026-11-30"}]})

    acuerdo: str | None = None
    responsable_rol: str | None = Field(None, max_length=80)
    plazo: FechaOpcional = None


class _Campos(BaseModel):
    participantes: str | None = Field(None, description="Roles, no nombres («se consignan roles, no nombres, salvo firma de acuerdos»).")
    observaciones: str | None = None
    situacion: str | None = Field(None, description="Desarrollo clínico (no en una jornada).")
    hipotesis: str | None = Field(None, description="Desarrollo clínico (no en una jornada).")
    recursos: str | None = Field(None, description="Desarrollo clínico (no en una jornada).")
    seguimiento: str | None = Field(None, description="Desarrollo clínico (no en una jornada).")
    capacitador: str | None = Field(None, max_length=200, description="Sólo en una jornada.")
    modalidad: str | None = Field(None, max_length=200, description="Sólo en una jornada.")
    contenidos: str | None = Field(None, description="Sólo en una jornada.")
    materiales: str | None = Field(None, description="Sólo en una jornada.")
    evaluacion: str | None = Field(None, description="Sólo en una jornada.")


class AteneoCrear(_Campos):
    """Alta **completa** en un solo POST (el registro nace completo): tipo, fecha, título, sus referencias según el tipo
    y los acuerdos juntados en el cliente. `anio_correlativo`, `numero`, `codigo`, `sensible` y el autor los pone el
    servidor (mandarlos es 422)."""

    model_config = ConfigDict(extra="forbid", json_schema_extra={"examples": [{
        "tipo": "grupo", "fecha": "2026-10-08", "titulo": "Revisión de los acuerdos del primer semestre", "grupo_id": 3,
        "participantes": "Técnicos responsables · Coordinación técnica",
        "acuerdos": [{"acuerdo": "Unificar la agenda visual de la sala", "responsable_rol": "Coordinación técnica", "plazo": "2026-11-30"}],
    }]})

    tipo: str = Field(max_length=20, description=_TIPO)
    fecha: FechaOpcional = Field(description="Cuándo ocurrió (obligatoria: vacía es 422 en `fecha`). El filtro por año y el indicador van por esta fecha.")
    titulo: str = Field(max_length=200, description="Título o tema. No en blanco.")
    hce_referida_id: EnteroOpcional = Field(None, description=_NNA)
    grupo_id: EnteroOpcional = Field(None, description=_GRUPO)
    acuerdos: list[AcuerdoCrear] = Field(default_factory=list, description="Una jornada no lleva acuerdos (422 en `acuerdos`).")


class AteneoActualizar(_Campos):
    """Edición parcial: sólo las claves presentes. `null` (o blanco) borra un opcional; `tipo`, `fecha` y `titulo` no
    admiten vacío. **El tipo se puede cambiar**, pero el estado final tiene que tener la forma del tipo nuevo (p. ej.
    pasar un clínico a institucional exige mandar `hce_referida_id: null` en el mismo PATCH)."""

    model_config = ConfigDict(extra="forbid", json_schema_extra={"examples": [{"tipo": "institucional", "hce_referida_id": None, "grupo_id": None}]})

    tipo: str | None = Field(None, max_length=20, description=_TIPO)
    fecha: FechaOpcional = None
    titulo: str | None = Field(None, max_length=200)
    hce_referida_id: EnteroOpcional = Field(None, description=_NNA)
    grupo_id: EnteroOpcional = Field(None, description=_GRUPO)


# ── Salida ───────────────────────────────────────────────────────────────────
class GrupoRef(BaseModel):
    id: int
    nombre: str
    anio: int


class NnaRef(BaseModel):
    hce_id: int
    hc_historico: int | None
    nombre: str
    apellido: str


class AutorRef(BaseModel):
    id: int
    nombre: str


class AcuerdoDetalle(BaseModel):
    id: int
    acuerdo: str
    responsable_rol: str | None
    plazo: date | None
    orden: int


class AteneoFila(BaseModel):
    id: int
    codigo: str = Field(description="`AT-<año de registración>-<número>`: lo asigna el servidor.")
    tipo: str
    tipo_label: str
    fecha: date
    titulo: str
    sensible: bool = Field(description="`true` sólo en el clínico: dato sensible de salud (Ley 18.331), con el acceso de su HCE.")
    grupo: GrupoRef | None
    nna: NnaRef | None
    acuerdos: int = Field(description="Cantidad de acuerdos.")
    documentos: int = Field(description="Cantidad de documentos adjuntos.")


class AteneoDetalle(BaseModel):
    id: int
    codigo: str
    anio_correlativo: int = Field(description="Año de **registración** (congelado al crear), no el de la fecha.")
    numero: int
    tipo: str
    tipo_label: str
    sensible: bool
    fecha: date
    titulo: str
    hce_referida_id: int | None
    grupo_id: int | None
    nna: NnaRef | None
    grupo: GrupoRef | None
    autor: AutorRef | None = Field(description="Quien lo registró (el usuario del token del alta).")
    participantes: str | None
    observaciones: str | None
    situacion: str | None
    hipotesis: str | None
    recursos: str | None
    seguimiento: str | None
    capacitador: str | None
    modalidad: str | None
    contenidos: str | None
    materiales: str | None
    evaluacion: str | None
    acuerdos: list[AcuerdoDetalle] = Field(description="En el orden del acta (`orden`, después el de carga).")
    documentos: int


class IndicadorGrupo(BaseModel):
    id: int
    nombre: str
    anio: int
    cantidad: int = Field(description="Ateneos de ese año (por `fecha`) con ese grupo: de grupo y clínicos con el grupo de contexto.")


class Indicador(BaseModel):
    anio: int
    meta_total: int
    total: int = Field(description="Ateneos con `fecha` en el año, de los tipos de `tipos_contados` (la jornada no suma).")
    meta_por_grupo: int
    tipos_contados: list[str]
    grupos: list[IndicadorGrupo] = Field(description="Los grupos de ese año, por nombre.")


class TipoOpcion(BaseModel):
    clave: str
    label: str


class Metas(BaseModel):
    total: int
    por_grupo: int


class OpcionesAteneo(BaseModel):
    tipos: list[TipoOpcion]
    tipo_sensible: str
    campos_jornada: list[str]
    campos_desarrollo_clinico: list[str]
    metas: Metas
    tipos_indicador: list[str]


class DocumentoAteneoDetalle(DocumentoDetalle):
    """Un documento de un ateneo: la misma forma que los del expediente (nunca es histórico) y, además, PPTX."""

    tipo: Literal["pdf", "jpg", "png", "pptx"] | None = Field(description="El tipo detectado por el contenido al subirlo.")
