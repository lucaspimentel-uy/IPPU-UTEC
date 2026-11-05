"""HCE-DOC · documentos con archivo, categorías y autorización de uso de imagen — C5 (`handoff.md` §5.155).

Contrato de respuesta y de error: docstring de `app/routers/__init__.py`. Reglas: `app/services/documentos.py`
y `app/services/archivos.py`. Alcance como `GET /hce/{id}` (técnico fuera de sus grupos → 404; sin token → 401).

- `GET /documentos/categorias` — cualquier usuario autenticado.
- `/hce/{hce_id}/documentos` — `GET` (lista paginada), `POST` multipart (alta con archivo), `GET /{doc_id}`,
  `PATCH /{doc_id}` (metadatos de un no histórico) y `GET /{doc_id}/archivo` (descarga). **Sin DELETE** (405).
- `/hce/{hce_id}/autorizacion-imagen` — `GET` (404 = no registrada), `POST`, `PATCH`.

**La descarga (§5.155 f)** devuelve los bytes con el `Content-Type` del tipo detectado al subirlo,
`Content-Disposition: attachment` con un `filename*` (RFC 6266) armado con el nombre y la extensión,
`X-Content-Type-Options: nosniff` y `Cache-Control: no-store`. Nunca `inline`.
"""
from typing import Annotated
from urllib.parse import quote

from fastapi import APIRouter, Depends, File, Form, Query, Request, Response, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.models.identidad import Profesional
from app.routers.dependencias import hce_visible, sesion_lectura, sesion_transaccional, usuario_actual
from app.routers.hce import CABECERA_TOTAL, _ejemplo
from app.schemas.comunes import FechaOpcional, RespuestaError, Resultado
from app.schemas.documentos import (
    EJEMPLO_AUTORIZACION, EJEMPLO_CATEGORIAS, EJEMPLO_DOCUMENTO, EJEMPLO_DOCUMENTOS, EJEMPLO_RESULTADO_AUTORIZACION,
    EJEMPLO_RESULTADO_DOCUMENTO, AutorizacionActualizar, AutorizacionCrear, AutorizacionDetalle, CategoriaDocumentoFila,
    DocumentoActualizar, DocumentoDetalle,
)
from app.services import archivos
from app.services import documentos as servicio
from app.services.errores import ValidationFailed
from app.services.hce import LIMITE_MAXIMO, LIMITE_POR_OMISION

router_categorias = APIRouter(prefix="/documentos", tags=["documentos"])
router_hce = APIRouter(prefix="/hce/{hce_id}/documentos", tags=["documentos"], dependencies=[Depends(hce_visible)])
router_autorizacion = APIRouter(prefix="/hce/{hce_id}/autorizacion-imagen", tags=["documentos"], dependencies=[Depends(hce_visible)])
_USUARIO = Annotated[Profesional, Depends(usuario_actual)]
_LIMIT = Annotated[int, Query(ge=1, le=LIMITE_MAXIMO, description="Filas por página (1–200).")]
_OFFSET = Annotated[int, Query(ge=0, le=2_147_483_647, description="Filas a saltear.")]

_ERROR_404 = {404: {"model": RespuestaError, "description": "No existe el expediente o está fuera del alcance del usuario."}}
_ERROR_404_DOC = {404: {"model": RespuestaError, "description": (
    "No existe el expediente, está fuera del alcance, o el documento no existe o es de otro expediente."
)}}
_ERRORES_ARCHIVO = {
    413: {"model": RespuestaError, "description": "El archivo supera los 10 MB (`code: too_large`, `campo: archivo`)."},
    422: {"model": RespuestaError, "description": (
        "Datos inválidos por campo: `archivo` vacío o con un contenido que no es de un tipo aceptado (se mira el "
        "contenido, no la extensión), `categoria_id` que no existe, `nombre` vacío o largo, o un campo de formulario "
        "que el alta no recibe."
    )},
}


def _total(descripcion: str) -> dict:
    return {"headers": {CABECERA_TOTAL: {"description": descripcion, "schema": {"type": "integer"}}}}


# ── Formulario: sólo los campos que el alta recibe ───────────────────────────
async def campos_del_formulario(request: Request) -> frozenset[str]:
    """Las claves del `multipart/form-data` (Starlette guarda el formulario ya leído: no se lee dos veces)."""
    return frozenset((await request.form()).keys())


def exigir_campos(recibidos: frozenset[str], permitidos: set[str]) -> None:
    """Como `extra="forbid"` de los JSON: un campo que el alta no recibe (`es_registro_historico`, `fecha_carga`,
    `archivo_ref`…) es 422, no se ignora."""
    extra = sorted(recibidos - permitidos)
    if extra:
        raise ValidationFailed([(c, "Este campo no se recibe: lo escribe el servidor o no existe.") for c in extra])


# ── Descarga (§5.155 f) ──────────────────────────────────────────────────────
def _nombre_de_descarga(nombre: str, tipo: str) -> str:
    limpio = "".join("_" if c in '/\\' or ord(c) < 32 or ord(c) == 127 else c for c in nombre).strip() or "archivo"
    extensiones = (".jpg", ".jpeg") if tipo == "jpg" else (f".{tipo}",)
    return limpio if limpio.lower().endswith(extensiones) else f"{limpio}.{tipo}"


def respuesta_de_archivo(ref: str | None, nombre: str) -> FileResponse:
    """Los bytes como **adjunto**, con el `Content-Type` del tipo detectado y sin caché ni *sniffing*."""
    ruta, tipo_mime = archivos.archivo_para_descargar(ref)
    archivo = _nombre_de_descarga(nombre, archivos.tipo_de_ref(ref))
    ascii_ = "".join(c if 32 <= ord(c) < 127 and c not in '"\\;' else "_" for c in archivo)
    return FileResponse(ruta, media_type=tipo_mime, headers={
        "Content-Disposition": f"attachment; filename=\"{ascii_}\"; filename*=UTF-8''{quote(archivo, safe='')}",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-store",
    })


DESCARGA = {200: {"content": {"application/pdf": {}, "image/jpeg": {}, "image/png": {}},
                  "description": "El archivo, como adjunto (`Content-Disposition: attachment`), sin caché."}}


# ── Categorías ───────────────────────────────────────────────────────────────
@router_categorias.get(
    "/categorias", response_model=list[CategoriaDocumentoFila], summary="Categorías de documento",
    responses=_ejemplo(200, EJEMPLO_CATEGORIAS),
)
def categorias(db: Annotated[Session, Depends(sesion_lectura)]):
    """Las 12 categorías en `orden`, con la marca de las «Registro histórico — HCE anterior (…)». Lista fija de
    referencia, sin paginar."""
    return [CategoriaDocumentoFila.model_validate(c) for c in servicio.listar_categorias(db)]


# ── Documentos del expediente ────────────────────────────────────────────────
@router_hce.get(
    "", response_model=list[DocumentoDetalle], summary="Documentos del expediente",
    responses={200: {"content": {"application/json": {"example": EJEMPLO_DOCUMENTOS}},
                     **_total("Total de documentos del expediente (todas las páginas).")}, **_ERROR_404},
)
def listar(hce_id: int, response: Response, db: Annotated[Session, Depends(sesion_lectura)],
           limit: _LIMIT = LIMITE_POR_OMISION, offset: _OFFSET = 0):
    """**El de carga más reciente primero** (`fecha_carga` e `id` descendentes). `tipo` y `tamano_bytes` salen del
    archivo guardado. Total en **`X-Total-Count`**."""
    filas, total = servicio.listar(db, hce_id, limit=limit, offset=offset)
    response.headers[CABECERA_TOTAL] = str(total)
    return [DocumentoDetalle.model_validate(servicio.vista(d)) for d in filas]


@router_hce.post(
    "", status_code=201, response_model=Resultado[DocumentoDetalle], summary="Cargar un documento (multipart)",
    responses={**_ejemplo(201, EJEMPLO_RESULTADO_DOCUMENTO), **_ERROR_404, **_ERRORES_ARCHIVO},
)
def cargar(
    hce_id: int,
    db: Annotated[Session, Depends(sesion_transaccional)],
    usuario: _USUARIO,
    recibidos: Annotated[frozenset[str], Depends(campos_del_formulario)],
    archivo: Annotated[UploadFile, File(description="PDF, JPG o PNG (por el contenido), hasta 10 MB.")],
    categoria_id: Annotated[int, Form(description="Una de `GET /documentos/categorias`.")],
    nombre: Annotated[str | None, Form(description="Etiqueta; vacía = el nombre del archivo, sin ruta. Hasta 200.")] = None,
    fecha_original: Annotated[FechaOpcional, Form(description="Fecha del original (opcional).")] = None,
):
    """`multipart/form-data` con `archivo`, `categoria_id`, `nombre?` y `fecha_original?`. **El tipo se detecta por
    el contenido** (PDF, JPEG o PNG), nunca por la extensión ni por el `Content-Type`; el servidor genera el nombre
    y la ruta del archivo. `es_registro_historico` sale de la categoría. Deja una fila `carga` que no nombra el
    documento."""
    exigir_campos(recibidos, {"archivo", "categoria_id", "nombre", "fecha_original"})
    doc = servicio.crear(
        db, hce_id, archivo=archivo.file, nombre_archivo=archivo.filename, categoria_id=categoria_id,
        nombre=nombre, fecha_original=fecha_original, profesional_id=usuario.id,
    )
    return Resultado(data=DocumentoDetalle.model_validate(servicio.vista(doc)))


@router_hce.get(
    "/{doc_id}", response_model=DocumentoDetalle, summary="Un documento del expediente",
    responses={**_ejemplo(200, EJEMPLO_DOCUMENTO), **_ERROR_404_DOC},
)
def leer(hce_id: int, doc_id: int, db: Annotated[Session, Depends(sesion_lectura)]):
    """Los metadatos de un documento de **este** expediente (uno de otro es 404)."""
    return DocumentoDetalle.model_validate(servicio.vista(servicio.obtener(db, hce_id, doc_id)))


@router_hce.patch(
    "/{doc_id}", response_model=Resultado[DocumentoDetalle], summary="Editar los metadatos de un documento",
    responses={
        **_ejemplo(200, EJEMPLO_RESULTADO_DOCUMENTO), **_ERROR_404_DOC,
        409: {"model": RespuestaError, "description": "Es un registro histórico de la HCE anterior: es de sólo lectura."},
        422: {"model": RespuestaError, "description": (
            "Nombre vacío o largo, una categoría que no existe o que es «Registro histórico», o un campo que no se edita."
        )},
    },
)
def editar(hce_id: int, doc_id: int, datos: DocumentoActualizar, db: Annotated[Session, Depends(sesion_transaccional)], usuario: _USUARIO):
    """`nombre`, `categoria_id` y `fecha_original` (sólo las claves presentes). **Un registro histórico es inmutable
    (409).** Cada campo que cambia deja una fila de auditoría con el valor anterior y el nuevo."""
    doc = servicio.actualizar(db, hce_id, doc_id, datos.model_dump(exclude_unset=True), profesional_id=usuario.id)
    return Resultado(data=DocumentoDetalle.model_validate(servicio.vista(doc)))


@router_hce.get("/{doc_id}/archivo", response_class=FileResponse, summary="Descargar el archivo de un documento",
                responses={**DESCARGA, **_ERROR_404_DOC})
def descargar(hce_id: int, doc_id: int, db: Annotated[Session, Depends(sesion_lectura)]):
    """Los bytes, como adjunto, con el `Content-Type` del tipo detectado (`application/pdf`, `image/jpeg`,
    `image/png`), `nosniff` y `no-store`. Requiere el token como cualquier otra ruta."""
    doc = servicio.obtener(db, hce_id, doc_id)
    return respuesta_de_archivo(doc.archivo_ref, doc.nombre)


# ── Autorización de uso de imagen ────────────────────────────────────────────
_ERROR_404_AUT = {404: {"model": RespuestaError, "description": (
    "No existe el expediente, está fuera del alcance, o la autorización todavía no está registrada."
)}}
_ERROR_422_AUT = {422: {"model": RespuestaError, "description": (
    "`registrada` ausente (alta) o `null`, o `documento_id` que no es un documento de este expediente."
)}}


@router_autorizacion.get("", response_model=AutorizacionDetalle, summary="La autorización de uso de imagen",
                         responses={**_ejemplo(200, EJEMPLO_AUTORIZACION), **_ERROR_404_AUT})
def leer_autorizacion(hce_id: int, db: Annotated[Session, Depends(sesion_lectura)]):
    """**404** mientras no esté registrada (la pantalla lo muestra como «Sin registrar», no como error)."""
    return AutorizacionDetalle.model_validate(servicio.vista_autorizacion(db, servicio.obtener_autorizacion(db, hce_id)))


@router_autorizacion.post(
    "", status_code=201, response_model=Resultado[AutorizacionDetalle], summary="Registrar la autorización de uso de imagen",
    responses={**_ejemplo(201, EJEMPLO_RESULTADO_AUTORIZACION), **_ERROR_404, **_ERROR_422_AUT,
               409: {"model": RespuestaError, "description": "Ya está registrada: se edita con PATCH."}},
)
def registrar_autorizacion(hce_id: int, datos: AutorizacionCrear, db: Annotated[Session, Depends(sesion_transaccional)], usuario: _USUARIO):
    """Una por expediente. **No condiciona nada ni avisa** (§5.99): guardar fotos no la requiere; regula compartir,
    que no está en esta versión. Deja una fila `carga`."""
    aut = servicio.crear_autorizacion(db, hce_id, datos.model_dump(exclude_unset=True), profesional_id=usuario.id)
    return Resultado(data=AutorizacionDetalle.model_validate(servicio.vista_autorizacion(db, aut)))


@router_autorizacion.patch(
    "", response_model=Resultado[AutorizacionDetalle], summary="Editar la autorización de uso de imagen",
    responses={**_ejemplo(200, EJEMPLO_RESULTADO_AUTORIZACION), **_ERROR_404_AUT, **_ERROR_422_AUT},
)
def editar_autorizacion(hce_id: int, datos: AutorizacionActualizar, db: Annotated[Session, Depends(sesion_transaccional)], usuario: _USUARIO):
    """Sólo las claves presentes; `registrada` no admite `null`. Cada campo que cambia deja su fila de auditoría."""
    aut = servicio.actualizar_autorizacion(db, hce_id, datos.model_dump(exclude_unset=True), profesional_id=usuario.id)
    return Resultado(data=AutorizacionDetalle.model_validate(servicio.vista_autorizacion(db, aut)))

