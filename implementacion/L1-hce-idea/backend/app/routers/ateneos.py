"""Ateneos y jornadas de capacitación — C6 (`handoff.md` §5.158).

Contrato de respuesta y de error: docstring de `app/routers/__init__.py`. Reglas: `app/services/ateneos.py`.

- `GET /ateneos/opciones` · `GET /ateneos/indicador?anio=` — cualquier usuario autenticado.
- `GET /ateneos` (lista paginada con `X-Total-Count`) · `POST /ateneos` · `GET|PATCH /ateneos/{id}`.
- `POST /ateneos/{id}/acuerdos` · `PATCH /ateneos/{id}/acuerdos/{aid}`.
- `GET|POST /ateneos/{id}/documentos` · `GET …/{doc_id}` · `GET …/{doc_id}/archivo` (la descarga de C5).

**Sin DELETE** de ateneos, acuerdos ni documentos (405): es un libro de actas. Institucional, de grupo y jornada son de
acceso general del equipo; un **clínico** que el técnico no puede abrir (no es tratante del expediente referido ni tiene
una ventana sobre él) es 404 con el mismo mensaje que uno inexistente, en todas las rutas `/ateneos/{id}…` (la dependencia
`ateneo_visible`); con la ventana, lo lee y no lo escribe (403). Administrativo y dirección no técnica: 403 (el indicador,
dirección sí).
"""
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Query, Request, Response, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.identidad import Profesional
from app.routers.dependencias import permitido, sesion_lectura, sesion_transaccional, usuario_actual
from app.routers.documentos import DESCARGA, campos_del_formulario, exigir_campos, respuesta_de_archivo
from app.routers.hce import CABECERA_TOTAL, _ejemplo
from app.schemas.ateneos import (
    EJEMPLO_ACUERDO, EJEMPLO_DETALLE, EJEMPLO_FILAS, EJEMPLO_INDICADOR, EJEMPLO_OPCIONES, EJEMPLO_RESULTADO,
    AcuerdoActualizar, AcuerdoCrear, AcuerdoDetalle, AteneoActualizar, AteneoCrear, AteneoDetalle, AteneoFila,
    DocumentoAteneoDetalle, Indicador, OpcionesAteneo,
)
from app.schemas.comunes import Aviso, FechaOpcional, RespuestaError, Resultado
from app.services import ateneos as servicio
from app.services import documentos as servicio_documentos
from app.services.hce import LIMITE_MAXIMO, LIMITE_POR_OMISION


def ateneo_visible(
    ateneo_id: int, request: Request, usuario: Annotated[Profesional, Depends(usuario_actual)], db: Session = Depends(get_db),
) -> None:
    """La matriz de un ateneo (`ateneo.leer` en un GET, `ateneo.escribir` en otro método): 403 para los roles sin ateneos
    (exista o no), **404** si no existe o es un clínico que el usuario no puede abrir (el mismo mensaje), 403 si lo lee
    con su ventana pero no lo puede escribir. Corre antes de leer el cuerpo o el formulario de la ruta."""
    servicio.exigir_visible(db, usuario, ateneo_id, escribir=request.method not in ("GET", "HEAD"))


router = APIRouter(prefix="/ateneos", tags=["ateneos"])
router_ateneo = APIRouter(prefix="/ateneos/{ateneo_id}", tags=["ateneos"], dependencies=[Depends(ateneo_visible)])
_USUARIO = Annotated[Profesional, Depends(usuario_actual)]
_LIMIT = Annotated[int, Query(ge=1, le=LIMITE_MAXIMO, description="Filas por página (1–200).")]
_OFFSET = Annotated[int, Query(ge=0, le=2_147_483_647, description="Filas a saltear.")]
_ANIO = Annotated[int | None, Query(ge=1900, le=2999, description="Año de la **fecha** del ateneo (no el del código).")]

_ERROR_404 = {404: {"model": RespuestaError, "description": "No existe el ateneo o es un ateneo clínico fuera del alcance del usuario."}}
_ERROR_422 = {422: {"model": RespuestaError, "description": (
    "Datos inválidos por campo: la forma según el tipo (NNA sólo y siempre en el clínico, grupo en el de grupo, los bloques "
    "de jornada y de desarrollo clínico), una jornada con acuerdos, un título o un acuerdo en blanco, un NNA o un grupo que "
    "no existen (o un NNA que el usuario no ve), un largo excedido, o un campo que el servidor escribe (`anio_correlativo`, "
    "`numero`, `codigo`, `sensible`, `autor_id`)."
)}}


def _total(descripcion: str) -> dict:
    return {"headers": {CABECERA_TOTAL: {"description": descripcion, "schema": {"type": "integer"}}}}


def _resultado(db: Session, ateneo, avisos) -> Resultado[AteneoDetalle]:
    return Resultado(data=AteneoDetalle.model_validate(servicio.vista(db, ateneo)), warnings=[Aviso(**a) for a in avisos])


# ── Referencias ──────────────────────────────────────────────────────────────
@router.get("/opciones", response_model=OpcionesAteneo, summary="Tipos de ateneo, bloques de campos y metas",
            responses=_ejemplo(200, EJEMPLO_OPCIONES))
def opciones():
    """Los 4 tipos (clave y etiqueta), qué tipo es sensible, los campos de cada bloque (jornada / desarrollo clínico),
    las metas del indicador y los tipos que suma. Lista fija, sin paginar."""
    return OpcionesAteneo(**servicio.opciones())


@router.get("/indicador", response_model=Indicador, summary="Indicador institucional: 8 al año, 2 por grupo",
            responses=_ejemplo(200, EJEMPLO_INDICADOR), dependencies=[Depends(permitido("ateneos.indicador"))])
def indicador(db: Annotated[Session, Depends(sesion_lectura)], anio: _ANIO = None):
    """**Por `fecha`** (por omisión, el año en curso). El total suma los ateneos clínicos, de grupo e institucionales (la
    jornada no); cada grupo **de ese año**, los ateneos con su `grupo_id`. Cuenta todos, los pueda abrir o no quien
    pregunta: es un agregado sin contenido."""
    return Indicador(**servicio.indicador(db, anio))


# ── Lista y alta ─────────────────────────────────────────────────────────────
@router.get(
    "", response_model=list[AteneoFila], summary="Ateneos y jornadas",
    responses={200: {"content": {"application/json": {"example": EJEMPLO_FILAS}},
                     **_total("Total de registros que cumplen los filtros (todas las páginas).")},
               422: {"model": RespuestaError, "description": "`tipo` que no es uno de los 4, o un parámetro fuera de rango."}},
    dependencies=[Depends(permitido("ateneos.lista"))],
)
def listar(
    response: Response,
    db: Annotated[Session, Depends(sesion_lectura)],
    usuario: _USUARIO,
    anio: _ANIO = None,
    tipo: Annotated[str | None, Query(description="Una de las claves de `GET /ateneos/opciones`.")] = None,
    grupo_id: Annotated[int | None, Query(ge=1, le=2_147_483_647)] = None,
    hce_referida_id: Annotated[int | None, Query(ge=1, le=2_147_483_647, description="Los ateneos clínicos de ese expediente.")] = None,
    q: Annotated[str | None, Query(max_length=200, description="Subcadena, sin mayúsculas, en título, situación y contenidos.")] = None,
    limit: _LIMIT = LIMITE_POR_OMISION,
    offset: _OFFSET = 0,
):
    """**La fecha más nueva primero** (después el registro más nuevo). Un ateneo clínico que el usuario no puede abrir no
    aparece ni cuenta en el total. Total en **`X-Total-Count`**."""
    filas, total = servicio.listar(
        db, usuario=usuario, anio=anio, tipo=tipo, grupo_id=grupo_id, hce_referida_id=hce_referida_id, q=q,
        limit=limit, offset=offset,
    )
    response.headers[CABECERA_TOTAL] = str(total)
    return [AteneoFila.model_validate(f) for f in filas]


@router.post("", status_code=201, response_model=Resultado[AteneoDetalle], summary="Registrar un ateneo o una jornada",
             responses={**_ejemplo(201, EJEMPLO_RESULTADO), **_ERROR_422}, dependencies=[Depends(permitido("ateneos.alta"))])
def registrar(datos: AteneoCrear, db: Annotated[Session, Depends(sesion_transaccional)], usuario: _USUARIO):
    """**Un solo POST completo** con sus acuerdos. El servidor asigna el código (`AT-<año de hoy>-<siguiente>`), el autor
    (el usuario del token) y deja una fila `carga`. Una fecha fuera del año del grupo es un **aviso**, no un error."""
    ateneo, avisos = servicio.crear(db, datos.model_dump(exclude_unset=True), usuario=usuario)
    return _resultado(db, ateneo, avisos)


# ── Un ateneo ────────────────────────────────────────────────────────────────
@router_ateneo.get("", response_model=AteneoDetalle, summary="Un ateneo", responses={**_ejemplo(200, EJEMPLO_DETALLE), **_ERROR_404})
def leer(ateneo_id: int, db: Annotated[Session, Depends(sesion_lectura)], usuario: _USUARIO):
    """Todos los campos, el código, si es sensible, el autor, el NNA y el grupo, y los acuerdos en el orden del acta."""
    return AteneoDetalle.model_validate(servicio.vista(db, servicio.obtener(db, usuario, ateneo_id)))


@router_ateneo.patch("", response_model=Resultado[AteneoDetalle], summary="Editar un ateneo",
                     responses={**_ejemplo(200, EJEMPLO_RESULTADO), **_ERROR_404, **_ERROR_422})
def editar(ateneo_id: int, datos: AteneoActualizar, db: Annotated[Session, Depends(sesion_transaccional)], usuario: _USUARIO):
    """Sólo las claves presentes. La forma se valida sobre el estado **final** (cambiar un clínico a otro tipo exige
    `hce_referida_id: null` en el mismo pedido). Cada campo que cambia deja una fila de auditoría."""
    ateneo, avisos = servicio.actualizar(db, ateneo_id, datos.model_dump(exclude_unset=True), usuario=usuario)
    return _resultado(db, ateneo, avisos)


@router_ateneo.post("/acuerdos", status_code=201, response_model=Resultado[AcuerdoDetalle], summary="Agregar un acuerdo",
                    responses={**_ejemplo(201, EJEMPLO_ACUERDO), **_ERROR_404, **_ERROR_422})
def agregar_acuerdo(ateneo_id: int, datos: AcuerdoCrear, db: Annotated[Session, Depends(sesion_transaccional)], usuario: _USUARIO):
    """Al final del acta. Una jornada no lleva acuerdos (422). Deja una fila `carga`."""
    acuerdo = servicio.crear_acuerdo(db, ateneo_id, datos.model_dump(exclude_unset=True), usuario=usuario)
    return Resultado(data=AcuerdoDetalle.model_validate(servicio.vista_acuerdo(acuerdo)))


@router_ateneo.patch("/acuerdos/{acuerdo_id}", response_model=Resultado[AcuerdoDetalle], summary="Editar un acuerdo",
                     responses={**_ejemplo(200, EJEMPLO_ACUERDO), **_ERROR_404, **_ERROR_422})
def editar_acuerdo(ateneo_id: int, acuerdo_id: int, datos: AcuerdoActualizar,
                   db: Annotated[Session, Depends(sesion_transaccional)], usuario: _USUARIO):
    """Un acuerdo equivocado se edita (no se borra). Cada campo que cambia deja una fila de auditoría."""
    acuerdo = servicio.actualizar_acuerdo(db, ateneo_id, acuerdo_id, datos.model_dump(exclude_unset=True), usuario=usuario)
    return Resultado(data=AcuerdoDetalle.model_validate(servicio.vista_acuerdo(acuerdo)))


# ── Documentos del ateneo ────────────────────────────────────────────────────
@router_ateneo.get(
    "/documentos", response_model=list[DocumentoAteneoDetalle], summary="Documentos del ateneo",
    responses={200: _total("Total de documentos del ateneo (todas las páginas)."), **_ERROR_404},
)
def listar_documentos(ateneo_id: int, response: Response, db: Annotated[Session, Depends(sesion_lectura)], usuario: _USUARIO,
                      limit: _LIMIT = LIMITE_POR_OMISION, offset: _OFFSET = 0):
    """El de carga más reciente primero. Total en **`X-Total-Count`**."""
    filas, total = servicio.listar_documentos(db, usuario, ateneo_id, limit=limit, offset=offset)
    response.headers[CABECERA_TOTAL] = str(total)
    return [DocumentoAteneoDetalle.model_validate(servicio_documentos.vista(d)) for d in filas]


@router_ateneo.post(
    "/documentos", status_code=201, response_model=Resultado[DocumentoAteneoDetalle], summary="Adjuntar un documento (multipart)",
    responses={**_ERROR_404,
               413: {"model": RespuestaError, "description": "El archivo supera los 10 MB (`code: too_large`, `campo: archivo`)."},
               422: {"model": RespuestaError, "description": (
                   "`archivo` vacío o de un tipo no aceptado (PDF, JPG, PNG o PPTX sin macros, por el contenido), una categoría "
                   "que no existe o «Registro histórico», un nombre largo, o un campo que el alta no recibe.")}},
)
def adjuntar(
    ateneo_id: int,
    db: Annotated[Session, Depends(sesion_transaccional)],
    usuario: _USUARIO,
    recibidos: Annotated[frozenset[str], Depends(campos_del_formulario)],
    archivo: Annotated[UploadFile, File(description="PDF, JPG, PNG o PPTX (por el contenido), hasta 10 MB.")],
    categoria_id: Annotated[int, Form(description="Una de `GET /documentos/categorias` que no sea «Registro histórico».")],
    nombre: Annotated[str | None, Form(description="Etiqueta; vacía = el nombre del archivo, sin ruta. Hasta 200.")] = None,
    fecha_original: Annotated[FechaOpcional, Form(description="Fecha del original (opcional).")] = None,
):
    """`multipart/form-data` como el de los documentos del expediente (C5). Deja una fila `carga` con el código del
    ateneo, la categoría y la fecha (nunca el nombre del documento)."""
    exigir_campos(recibidos, {"archivo", "categoria_id", "nombre", "fecha_original"})
    doc, avisos = servicio.crear_documento(
        db, usuario, ateneo_id, archivo=archivo.file, nombre_archivo=archivo.filename, categoria_id=categoria_id,
        nombre=nombre, fecha_original=fecha_original,
    )
    return Resultado(
        data=DocumentoAteneoDetalle.model_validate(servicio_documentos.vista(doc)), warnings=[Aviso(**a) for a in avisos],
    )


@router_ateneo.get("/documentos/{doc_id}", response_model=DocumentoAteneoDetalle, summary="Un documento del ateneo",
                   responses=_ERROR_404)
def leer_documento(ateneo_id: int, doc_id: int, db: Annotated[Session, Depends(sesion_lectura)], usuario: _USUARIO):
    return DocumentoAteneoDetalle.model_validate(servicio_documentos.vista(servicio.obtener_documento(db, usuario, ateneo_id, doc_id)))


@router_ateneo.get("/documentos/{doc_id}/archivo", response_class=FileResponse, summary="Descargar un documento del ateneo",
                   responses={**DESCARGA, **_ERROR_404})
def descargar_documento(ateneo_id: int, doc_id: int, db: Annotated[Session, Depends(sesion_lectura)], usuario: _USUARIO):
    """Como en C5: adjunto, con el `Content-Type` del tipo detectado, `nosniff` y `no-store`."""
    doc = servicio.obtener_documento(db, usuario, ateneo_id, doc_id)
    return respuesta_de_archivo(doc.archivo_ref, doc.nombre)
