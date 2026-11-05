"""Schemas de HCE-DOC (documentos, categorías y autorización de imagen) y de las fotos — C5. Reglas:
`app/services/documentos.py`, `app/services/fotos.py` y `app/services/archivos.py` (§5.155).

El **alta** de un documento o de una foto es `multipart/form-data` (el archivo + campos de formulario): esos
campos están en la firma del router, no acá. **`extra="forbid"` en el JSON de entrada**: `es_registro_historico`
se deriva de la categoría al crear, `fecha_carga` y `archivo_ref` los escribe el servidor; un cuerpo que mande
cualquiera de ellos es 422, no se ignora (lo mismo para un campo de formulario que el alta no recibe).
"""
from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, StrictBool

from app.schemas.comunes import EnteroOpcional, FechaOpcional

TipoArchivo = Literal["pdf", "jpg", "png"]

_DOC_EJEMPLO = {
    "id": 7, "categoria": {"id": 2, "nombre": "Informe escolar"}, "nombre": "Informe escolar — primer semestre",
    "fecha_original": "2026-07-10", "fecha_carga": "2026-11-05", "es_registro_historico": False,
    "tipo": "pdf", "tamano_bytes": 1832, "tiene_archivo": True,
}
_FOTO_EJEMPLO = {"id": 3, "descripcion": "Taller de juego estructurado", "fecha": "2026-09-10", "tipo": "png", "tamano_bytes": 912}
_AUT_EJEMPLO = {
    "registrada": True, "fecha": "2026-03-02", "documento_id": 9,
    "documento": {"id": 9, "nombre": "Autorización de uso de imagen firmada", "categoria": "Autorización / consentimiento"},
}
EJEMPLO_DOCUMENTO = _DOC_EJEMPLO
EJEMPLO_DOCUMENTOS = [_DOC_EJEMPLO]
EJEMPLO_RESULTADO_DOCUMENTO = {"data": _DOC_EJEMPLO, "warnings": []}
EJEMPLO_FOTO = _FOTO_EJEMPLO
EJEMPLO_FOTOS = [_FOTO_EJEMPLO]
EJEMPLO_RESULTADO_FOTO = {"data": _FOTO_EJEMPLO, "warnings": []}
EJEMPLO_AUTORIZACION = _AUT_EJEMPLO
EJEMPLO_RESULTADO_AUTORIZACION = {"data": _AUT_EJEMPLO, "warnings": []}
EJEMPLO_CATEGORIAS = [
    {"id": 2, "nombre": "Informe escolar", "es_registro_historico": False, "orden": 2},
    {"id": 9, "nombre": "Registro histórico — HCE anterior (Evaluación General)", "es_registro_historico": True, "orden": 9},
]


# ── Categorías ───────────────────────────────────────────────────────────────
class CategoriaDocumentoFila(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    es_registro_historico: bool = Field(description="Las «Registro histórico — HCE anterior (…)»: un documento de esa categoría es de sólo lectura.")
    orden: int


# ── Documento ────────────────────────────────────────────────────────────────
class CategoriaRef(BaseModel):
    id: int
    nombre: str


class DocumentoDetalle(BaseModel):
    id: int
    categoria: CategoriaRef
    nombre: str = Field(description="Etiqueta del documento (nunca una ruta).")
    fecha_original: date | None = Field(description="Fecha del documento original (opcional).")
    fecha_carga: date = Field(description="Cuándo se cargó; la escribe el servidor.")
    es_registro_historico: bool = Field(description="Derivado de la categoría al cargar: **inmutable** (PATCH 409).")
    tipo: TipoArchivo | None = Field(description="El tipo detectado por el contenido al subirlo.")
    tamano_bytes: int | None = Field(description="El tamaño del archivo guardado (`null` si falta).")
    tiene_archivo: bool


class DocumentoActualizar(BaseModel):
    """Edición de los **metadatos** (sólo las claves presentes) de un documento **no histórico**. El archivo no se
    reemplaza."""

    model_config = ConfigDict(extra="forbid", json_schema_extra={"examples": [{"nombre": "Informe escolar — 2.º semestre"}]})

    nombre: str | None = Field(None, description="No vacío; hasta 200 caracteres (sin blancos alrededor).")
    categoria_id: EnteroOpcional = Field(None, description="Una de `GET /documentos/categorias` que **no** sea «Registro histórico».")
    fecha_original: FechaOpcional = Field(None, description="`null` la borra.")


# ── Autorización de uso de imagen ────────────────────────────────────────────
class _AutorizacionDocumento(BaseModel):
    id: int
    nombre: str
    categoria: str


class AutorizacionDetalle(BaseModel):
    registrada: bool
    fecha: date | None
    documento_id: int | None = Field(description="La copia firmada: un documento de este expediente.")
    documento: _AutorizacionDocumento | None


class AutorizacionCrear(BaseModel):
    """Alta de la autorización de uso de imagen (una por expediente). Regula **compartir** imágenes (fuera de esta
    versión); **guardar fotos no la requiere** (§5.99). No produce avisos ni condiciona nada."""

    model_config = ConfigDict(extra="forbid", json_schema_extra={"examples": [{"registrada": True, "fecha": "2026-03-02", "documento_id": 9}]})

    registrada: StrictBool = Field(description="Si la familia firmó la autorización.")
    fecha: FechaOpcional = None
    documento_id: EnteroOpcional = Field(None, description="Un documento **de este expediente** (si no, 422).")


class AutorizacionActualizar(BaseModel):
    """Edición parcial: sólo las claves presentes. `registrada` no admite `null`; `fecha` y `documento_id`, sí."""

    model_config = ConfigDict(extra="forbid", json_schema_extra={"examples": [{"registrada": False}]})

    registrada: StrictBool | None = None
    fecha: FechaOpcional = None
    documento_id: EnteroOpcional = None


# ── Fotos ────────────────────────────────────────────────────────────────────
class FotoDetalle(BaseModel):
    id: int
    descripcion: str | None
    fecha: date | None = Field(description="Cuándo se tomó (opcional; el servidor no la completa).")
    tipo: TipoArchivo | None = Field(description="`jpg` o `png`, detectado por el contenido.")
    tamano_bytes: int | None
