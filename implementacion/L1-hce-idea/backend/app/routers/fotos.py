"""Fotos individuales y grupales — C5 (`handoff.md` §5.155 e, §5.99). Reglas: `app/services/fotos.py`.

- `/hce/{hce_id}/fotos` — alcance del expediente (`hce_visible`): `GET` (lista paginada), `POST` multipart,
  `GET /{foto_id}` y `GET /{foto_id}/archivo`.
- `/grupos/{grupo_id}/fotos` — lo mismo para un grupo: **sólo el `admin` y el técnico 1 o 2 de ese grupo**; para
  cualquier otro, 404 (como un expediente fuera de alcance, §5.101).

**Guardar no requiere la autorización de imagen ni produce avisos** (`warnings` vacío, §5.99). Sin DELETE (405).
"""
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Query, Response, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.models.identidad import Grupo, Profesional
from app.routers.dependencias import hce_visible, sesion_lectura, sesion_transaccional, usuario_actual
from app.routers.documentos import DESCARGA, campos_del_formulario, exigir_campos, respuesta_de_archivo
from app.routers.hce import CABECERA_TOTAL, _ejemplo
from app.schemas.comunes import Aviso, FechaOpcional, RespuestaError, Resultado
from app.schemas.documentos import EJEMPLO_FOTO, EJEMPLO_FOTOS, EJEMPLO_RESULTADO_FOTO, FotoDetalle
from app.services import auth
from app.services import fotos as servicio
from app.services.hce import LIMITE_MAXIMO, LIMITE_POR_OMISION
from app.core.database import get_db

router_hce = APIRouter(prefix="/hce/{hce_id}/fotos", tags=["fotos"], dependencies=[Depends(hce_visible)])
router_grupo = APIRouter(prefix="/grupos/{grupo_id}/fotos", tags=["fotos"])
_USUARIO = Annotated[Profesional, Depends(usuario_actual)]
_LIMIT = Annotated[int, Query(ge=1, le=LIMITE_MAXIMO, description="Filas por página (1–200).")]
_OFFSET = Annotated[int, Query(ge=0, le=2_147_483_647, description="Filas a saltear.")]
_PERMITIDOS = {"archivo", "descripcion", "fecha"}
_ARCHIVO = Annotated[UploadFile, File(description="JPG o PNG (por el contenido), hasta 10 MB.")]
_DESCRIPCION = Annotated[str | None, Form(description="Descripción o contexto (opcional).")]
_FECHA = Annotated[FechaOpcional, Form(description="Cuándo se tomó (opcional).")]

_ERROR_404_HCE = {404: {"model": RespuestaError, "description": "No existe el expediente, está fuera del alcance, o la foto es de otro dueño."}}
_ERROR_404_GRUPO = {404: {"model": RespuestaError, "description": (
    "No existe el grupo, el usuario no es admin ni técnico de ese grupo, o la foto es de otro dueño."
)}}
_ERRORES_ARCHIVO = {
    413: {"model": RespuestaError, "description": "El archivo supera los 10 MB (`code: too_large`, `campo: archivo`)."},
    422: {"model": RespuestaError, "description": "`archivo` vacío o que no es JPG ni PNG (se mira el contenido), o un campo que no se recibe."},
}


def _total(descripcion: str) -> dict:
    return {"headers": {CABECERA_TOTAL: {"description": descripcion, "schema": {"type": "integer"}}}}


def grupo_visible(
    grupo_id: int, usuario: Annotated[Profesional, Depends(usuario_actual)], db: Session = Depends(get_db),
) -> Grupo:
    """**404** si el grupo no existe o el usuario no es `admin` ni su técnico/a 1 o 2."""
    return auth.exigir_grupo_visible(db, usuario, grupo_id)


def _nombre(foto) -> str:
    return f"foto-{foto.fecha.isoformat() if foto.fecha else foto.id}"


# ── Individuales ─────────────────────────────────────────────────────────────
@router_hce.get("", response_model=list[FotoDetalle], summary="Fotos individuales del expediente",
                responses={200: {"content": {"application/json": {"example": EJEMPLO_FOTOS}},
                                 **_total("Total de fotos del expediente.")}, **_ERROR_404_HCE})
def listar(hce_id: int, response: Response, db: Annotated[Session, Depends(sesion_lectura)],
           limit: _LIMIT = LIMITE_POR_OMISION, offset: _OFFSET = 0):
    """La última subida primero. Total en **`X-Total-Count`**."""
    filas, total = servicio.listar(db, hce_id=hce_id, limit=limit, offset=offset)
    response.headers[CABECERA_TOTAL] = str(total)
    return [FotoDetalle.model_validate(servicio.vista(f)) for f in filas]


@router_hce.post("", status_code=201, response_model=Resultado[FotoDetalle], summary="Cargar una foto individual (multipart)",
                 responses={**_ejemplo(201, EJEMPLO_RESULTADO_FOTO), **_ERROR_404_HCE, **_ERRORES_ARCHIVO})
def cargar(
    hce_id: int, db: Annotated[Session, Depends(sesion_transaccional)], usuario: _USUARIO,
    recibidos: Annotated[frozenset[str], Depends(campos_del_formulario)],
    archivo: _ARCHIVO, descripcion: _DESCRIPCION = None, fecha: _FECHA = None,
):
    """**No requiere la autorización de imagen y no avisa** (§5.99). Deja una fila `carga` en el expediente."""
    exigir_campos(recibidos, _PERMITIDOS)
    foto, avisos = servicio.crear(
        db, hce_id=hce_id, archivo=archivo.file, descripcion=descripcion, fecha=fecha, profesional_id=usuario.id,
    )
    return Resultado(data=FotoDetalle.model_validate(servicio.vista(foto)), warnings=[Aviso(**a) for a in avisos])


@router_hce.get("/{foto_id}", response_model=FotoDetalle, summary="Una foto del expediente",
                responses={**_ejemplo(200, EJEMPLO_FOTO), **_ERROR_404_HCE})
def leer(hce_id: int, foto_id: int, db: Annotated[Session, Depends(sesion_lectura)]):
    return FotoDetalle.model_validate(servicio.vista(servicio.obtener(db, hce_id=hce_id, foto_id=foto_id)))


@router_hce.get("/{foto_id}/archivo", response_class=FileResponse, summary="Descargar una foto del expediente",
                responses={**DESCARGA, **_ERROR_404_HCE})
def descargar(hce_id: int, foto_id: int, db: Annotated[Session, Depends(sesion_lectura)]):
    foto = servicio.obtener(db, hce_id=hce_id, foto_id=foto_id)
    return respuesta_de_archivo(foto.archivo_ref, _nombre(foto))


# ── Grupales ─────────────────────────────────────────────────────────────────
_GRUPO = Annotated[Grupo, Depends(grupo_visible)]


@router_grupo.get("", response_model=list[FotoDetalle], summary="Fotos del grupo",
                  responses={200: {"content": {"application/json": {"example": EJEMPLO_FOTOS}},
                                   **_total("Total de fotos del grupo.")}, **_ERROR_404_GRUPO})
def listar_grupo(grupo: _GRUPO, response: Response, db: Annotated[Session, Depends(sesion_lectura)],
                 limit: _LIMIT = LIMITE_POR_OMISION, offset: _OFFSET = 0):
    """Sólo admin y los técnicos del grupo. La última subida primero. Total en **`X-Total-Count`**."""
    filas, total = servicio.listar(db, grupo_id=grupo.id, limit=limit, offset=offset)
    response.headers[CABECERA_TOTAL] = str(total)
    return [FotoDetalle.model_validate(servicio.vista(f)) for f in filas]


@router_grupo.post("", status_code=201, response_model=Resultado[FotoDetalle], summary="Cargar una foto grupal (multipart)",
                   responses={**_ejemplo(201, EJEMPLO_RESULTADO_FOTO), **_ERROR_404_GRUPO, **_ERRORES_ARCHIVO})
def cargar_grupo(
    grupo: _GRUPO, db: Annotated[Session, Depends(sesion_transaccional)], usuario: _USUARIO,
    recibidos: Annotated[frozenset[str], Depends(campos_del_formulario)],
    archivo: _ARCHIVO, descripcion: _DESCRIPCION = None, fecha: _FECHA = None,
):
    """**No requiere autorizaciones ni avisa** (§5.99). Deja una fila `carga` con `hce_id` NULL, módulo `GRUPO` y
    `detalle` «grupo N · nombre año» (§5.120)."""
    exigir_campos(recibidos, _PERMITIDOS)
    foto, avisos = servicio.crear(
        db, grupo=db.get(Grupo, grupo.id), archivo=archivo.file, descripcion=descripcion, fecha=fecha, profesional_id=usuario.id,
    )
    return Resultado(data=FotoDetalle.model_validate(servicio.vista(foto)), warnings=[Aviso(**a) for a in avisos])


@router_grupo.get("/{foto_id}", response_model=FotoDetalle, summary="Una foto del grupo",
                  responses={**_ejemplo(200, EJEMPLO_FOTO), **_ERROR_404_GRUPO})
def leer_grupo(grupo: _GRUPO, foto_id: int, db: Annotated[Session, Depends(sesion_lectura)]):
    return FotoDetalle.model_validate(servicio.vista(servicio.obtener(db, grupo_id=grupo.id, foto_id=foto_id)))


@router_grupo.get("/{foto_id}/archivo", response_class=FileResponse, summary="Descargar una foto del grupo",
                  responses={**DESCARGA, **_ERROR_404_GRUPO})
def descargar_grupo(grupo: _GRUPO, foto_id: int, db: Annotated[Session, Depends(sesion_lectura)]):
    foto = servicio.obtener(db, grupo_id=grupo.id, foto_id=foto_id)
    return respuesta_de_archivo(foto.archivo_ref, _nombre(foto))
