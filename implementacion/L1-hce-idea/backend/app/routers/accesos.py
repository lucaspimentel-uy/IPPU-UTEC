"""El acceso con motivo y el registro de accesos — Fase 4, A1 y A2 (`docs/diseno/fase4-acceso.md` c, d, e; §5.164, §5.165, §5.178).

- `GET /accesos/motivos` — el catálogo de motivos, con quién puede usar cada uno (todo usuario con sesión, F4-19).
- `POST /hce/{hce_id}/accesos` — abre la ventana (o registra la copia a la familia). Reglas: `app/services/accesos.py`.
- `GET /hce/{hce_id}/accesos` · `GET /accesos` — **el registro de accesos**, de un expediente y de la institución (A2).
- `GET /accesos/intentos` — las consultas por C.I. y las C.I. equivocadas (A2).

Los tres lectores son **sólo de coordinación, sin motivo** (F4-10): las filas dicen quién, cuándo y por qué, sin contenido
clínico. Cualquier otro rol recibe 403 `forbidden`, exista o no el expediente. Leer el registro no deja fila.
"""
from datetime import datetime
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query, Response
from pydantic import AwareDatetime, BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app.core.constantes import (
    ACCESO_RELACIONES, INTENTO_CI_ERRADA, INTENTO_RECHAZADO, INTENTO_RESULTADOS, INTENTO_TIPOS, MOTIVO_TEXTO_MAX,
    MOTIVOS_ACCESO,
)
from app.models.identidad import Profesional
from app.routers.dependencias import (
    RegistroPropio, SesionTransaccional, acceso_hce, permitido, sesion_lectura, usuario_actual,
)
from app.routers.hce import CABECERA_TOTAL
from app.schemas.comunes import Aviso, RespuestaError, Resultado
from app.services import accesos as servicio
from app.services import registro_accesos
from app.services.hce import LIMITE_MAXIMO, LIMITE_POR_OMISION

#: `/accesos…`: el catálogo (todo usuario con sesión) y los dos lectores institucionales (coordinación).
router_motivos = APIRouter(prefix="/accesos", tags=["accesos"])
#: `/hce/{hce_id}/accesos`: cada ruta declara su dependencia (el POST, la matriz del expediente; el GET, el rol).
router_hce = APIRouter(prefix="/hce/{hce_id}/accesos", tags=["accesos"])

#: El rol se mira antes que nada (403 exista o no el expediente), como en toda la matriz.
_SOLO_COORDINACION = [Depends(permitido("accesos.leer"))]
_ERROR_403_LECTOR = {403: {"model": RespuestaError, "description": "Sólo coordinación lee el registro (exista o no el expediente)."}}
_LIMIT = Annotated[int, Query(ge=1, le=LIMITE_MAXIMO, description="Filas por página (1–200).")]
_OFFSET = Annotated[int, Query(ge=0, le=2_147_483_647, description="Filas a saltear.")]
_ID = Annotated[int | None, Query(ge=1, le=2_147_483_647)]
_DESDE = Annotated[AwareDatetime | None, Query(description=(
    "Desde ese momento, **incluido** (ISO 8601 **con zona horaria**, p. ej. `2026-07-01T00:00:00-03:00`; en una URL el "
    "`+` va como `%2B`)."
))]
_HASTA = Annotated[AwareDatetime | None, Query(description="Hasta ese momento, **excluido** (ISO 8601 con zona horaria).")]


def _total(descripcion: str) -> dict:
    return {"headers": {CABECERA_TOTAL: {"description": descripcion, "schema": {"type": "integer"}}}}


class Motivo(BaseModel):
    codigo: str
    label: str
    quien: list[Literal["tratante", "no_tratante", "coordinacion"]] = Field(
        description="Qué relación lo puede usar: `no_tratante` (técnico de otro grupo), `coordinacion`, `tratante` (sólo la copia a la familia).",
    )
    texto_obligatorio: bool


class AccesoCrear(BaseModel):
    """`ci` sólo la manda el técnico **no tratante** (decisión (a), §5.165): la C.I. completa del NNA."""

    model_config = ConfigDict(json_schema_extra={"examples": [
        {"motivo_codigo": "interconsulta", "motivo_texto": "Interconsulta pedida por el equipo de Escolares", "ci": "5.789.123-4"},
        {"motivo_codigo": "supervision"},
        {"motivo_codigo": "copia_familia", "motivo_texto": "A la madre: el informe de cierre 2026"},
    ]})

    motivo_codigo: str | None = Field(None, max_length=30, description="Una de las claves de `GET /accesos/motivos`.")
    motivo_texto: str | None = Field(None, max_length=MOTIVO_TEXTO_MAX * 4, description=(
        f"Hasta {MOTIVO_TEXTO_MAX} caracteres; obligatorio en `copia_familia` y `otro`. «Escribí el motivo, no datos "
        "clínicos del NNA.»"
    ))
    ci: str | None = Field(None, max_length=40, description="La C.I. completa del NNA (sólo el técnico no tratante).")


class AccesoDetalle(BaseModel):
    id: int
    hce_id: int
    relacion: Literal["no_tratante", "supervision", "titular"]
    motivo_codigo: str
    motivo_label: str
    motivo_texto: str | None
    inicio: datetime
    vence: datetime = Field(description="Fin de la ventana; igual a `inicio` en la copia a la familia (no abre ninguna).")


class AutorAcceso(BaseModel):
    id: int
    nombre: str


class AccesoFila(BaseModel):
    """Una fila del registro de accesos (Protocolo §8: fecha, persona, HC consultada y motivo). Sin contenido clínico."""

    model_config = ConfigDict(json_schema_extra={"examples": [{
        "id": 310, "hce_id": 12, "usuario": {"id": 4, "nombre": "Ana Pereira"}, "rol": "tecnico", "relacion": "tratante",
        "motivo_codigo": None, "motivo_label": "Atención directa (tratante)", "motivo_texto": None,
        "inicio": "2026-11-17T09:02:11.120000-03:00", "vence": "2026-11-17T11:02:11.120000-03:00", "ateneo_id": None,
    }]})

    id: int
    hce_id: int = Field(description="La HC consultada.")
    usuario: AutorAcceso = Field(description="Quien accedió.")
    rol: str = Field(description="Su rol **en ese momento** (el rol puede cambiar; la fila no).")
    relacion: str = Field(description=f"`{'` · `'.join(ACCESO_RELACIONES)}`.")
    motivo_codigo: str | None = Field(description=(
        "Clave de `GET /accesos/motivos`; `null` en las filas automáticas (`tratante`, `gestion`)."
    ))
    motivo_label: str = Field(description=(
        "El motivo para leer, **siempre presente y puesto por el servidor**: el rótulo del catálogo o, en una fila "
        "automática, «Atención directa (tratante)» / «Gestión (identificación y organismos)»."
    ))
    motivo_texto: str | None
    inicio: datetime = Field(description="Cuándo (con zona horaria).")
    vence: datetime = Field(description=(
        "Fin de la ventana de 120 minutos; igual a `inicio` en la copia a la familia y en el ateneo clínico (no abren ninguna)."
    ))
    ateneo_id: int | None = Field(description="El ateneo clínico por el que se accedió, si fue por uno.")


class IntentoFila(BaseModel):
    """Una consulta por C.I. o una C.I. equivocada. **La C.I. escrita no se guarda ni se devuelve.**"""

    id: int
    usuario: AutorAcceso
    rol: str
    tipo: str = Field(description=f"`{'` · `'.join(INTENTO_TIPOS)}`.")
    hce_id: int | None = Field(description=(
        "El expediente encontrado, o el destino de la C.I. equivocada; `null` si la consulta no encontró nada."
    ))
    resultado: str = Field(description=f"`{'` · `'.join(INTENTO_RESULTADOS)}`.")
    momento: datetime


def _filas(filas) -> list[AccesoFila]:
    return [AccesoFila.model_validate(servicio.vista_de_registro(a, p)) for a, p in filas]


# ── /accesos ─────────────────────────────────────────────────────────────────
@router_motivos.get("/motivos", response_model=list[Motivo], summary="Motivos de acceso a una HC")
def listar_motivos():
    """El catálogo corto del Protocolo §5–§8 (borrador del equipo, a validar con IPPU, D4). Lista fija, sin paginar."""
    return [Motivo(**m) for m in servicio.motivos()]


@router_motivos.get(
    "", response_model=list[AccesoFila], summary="El registro de accesos de la institución (auditoría semestral)",
    responses={200: _total("Total de filas que cumplen los filtros (todas las páginas)."), **_ERROR_403_LECTOR,
               422: {"model": RespuestaError, "description": "`relacion` o `motivo` fuera de sus valores, una fecha sin zona horaria o un parámetro fuera de rango."}},
    dependencies=_SOLO_COORDINACION,
)
def listar(
    response: Response,
    db: Annotated[Session, Depends(sesion_lectura)],
    desde: _DESDE = None,
    hasta: _HASTA = None,
    usuario_id: _ID = None,
    hce_id: _ID = None,
    relacion: Annotated[str | None, Query(description=f"Una de: {' · '.join(ACCESO_RELACIONES)}.")] = None,
    motivo: Annotated[str | None, Query(description=(
        f"Un `motivo_codigo`: {' · '.join(MOTIVOS_ACCESO)}. Las filas automáticas no tienen código: se piden por `relacion`."
    ))] = None,
    limit: _LIMIT = LIMITE_POR_OMISION,
    offset: _OFFSET = 0,
):
    """Todas las filas de `acceso_hce` (Protocolo §8), **la más nueva primero**; los filtros se combinan con **Y** y el
    período es sobre `inicio`. Total en **`X-Total-Count`**. Incluye las aperturas automáticas del tratante y de gestión,
    las ventanas con motivo, los ateneos clínicos y la copia de la HC a la familia (`relacion` `titular`). **Sólo
    coordinación, sin motivo**; leerlo no deja fila."""
    filas, total = servicio.listar(
        db, hce_id=hce_id, usuario_id=usuario_id, relacion=relacion, motivo=motivo, desde=desde, hasta=hasta,
        limit=limit, offset=offset,
    )
    response.headers[CABECERA_TOTAL] = str(total)
    return _filas(filas)


@router_motivos.get(
    "/intentos", response_model=list[IntentoFila], summary="Consultas por C.I. y C.I. equivocadas",
    responses={200: _total("Total de filas que cumplen los filtros (todas las páginas)."), **_ERROR_403_LECTOR,
               422: {"model": RespuestaError, "description": "`tipo` fuera de sus valores, una fecha sin zona horaria o un parámetro fuera de rango."}},
    dependencies=_SOLO_COORDINACION,
)
def listar_intentos(
    response: Response,
    db: Annotated[Session, Depends(sesion_lectura)],
    desde: _DESDE = None,
    hasta: _HASTA = None,
    usuario_id: _ID = None,
    tipo: Annotated[str | None, Query(description=f"Uno de: {' · '.join(INTENTO_TIPOS)}.")] = None,
    limit: _LIMIT = LIMITE_POR_OMISION,
    offset: _OFFSET = 0,
):
    """Cada `POST /hce/consulta` que se ejecutó (`consulta_ci`: `encontrado` o `no_encontrado`) y cada
    `POST /hce/{id}/accesos` rechazado porque la C.I. no era la del expediente (`ci_errada`: `rechazado`), **el más nuevo
    primero**. No trae la C.I. que se escribió: no se guarda. **Sólo coordinación.**"""
    filas, total = servicio.listar_intentos(db, usuario_id=usuario_id, tipo=tipo, desde=desde, hasta=hasta,
                                            limit=limit, offset=offset)
    response.headers[CABECERA_TOTAL] = str(total)
    return [IntentoFila.model_validate(servicio.vista_de_intento(i, p)) for i, p in filas]


# ── /hce/{hce_id}/accesos ────────────────────────────────────────────────────
@router_hce.post(
    "", status_code=201, response_model=Resultado[AccesoDetalle], summary="Abrir el expediente con un motivo",
    responses={
        403: {"model": RespuestaError, "description": "Personal administrativo y dirección no técnica (exista o no el expediente)."},
        404: {"model": RespuestaError, "description": "No existe el expediente, o el técnico no tratante mandó una C.I. que no es la suya."},
        422: {"model": RespuestaError, "description": "Motivo fuera del catálogo o de otra relación, texto obligatorio que falta, más de 500 caracteres, o falta la C.I. (técnico no tratante)."},
    },
    #: El rol y la existencia se miran antes que el cuerpo (el orden de la sección b), como en toda ruta de un expediente.
    dependencies=[Depends(acceso_hce("accesos.abrir", "accesos.abrir"))],
)
def abrir(hce_id: int, datos: AccesoCrear, db: SesionTransaccional,
          usuario: Annotated[Profesional, Depends(usuario_actual)], registro_: RegistroPropio):
    """Deja **una fila** del registro de accesos (quién, cuándo, a qué expediente y por qué: Protocolo §8). Para el
    técnico no tratante y coordinación abre una **ventana de 120 minutos**: durante ella el expediente responde como a
    quien lo puede leer (sin escribir; el no tratante, sin la auditoría ni las fotos). Pedir otro motivo abre otra. La
    copia a la familia la registra el tratante o coordinación, sin ventana. El técnico no tratante manda la **C.I.**
    completa del NNA: si no es la del expediente, 404 —el mismo cuerpo que un id que no existe— y el intento queda en
    `GET /accesos/intentos` (sin la C.I.)."""
    try:
        fila, avisos = servicio.abrir(db, usuario, hce_id, datos.model_dump())
    except servicio.CiNoCoincide as rechazo:
        # El 404 deshace la transacción del pedido: el intento va en la suya (§5.178 e). La respuesta no cambia.
        registro_.escribir(
            registro_accesos.registrar_intento, registro_accesos.Quien.de(usuario), INTENTO_CI_ERRADA,
            INTENTO_RECHAZADO, rechazo.hce_id,
        )
        raise
    return Resultado(data=AccesoDetalle.model_validate(servicio.vista(fila)), warnings=[Aviso(**a) for a in avisos])


@router_hce.get(
    "", response_model=list[AccesoFila], summary="El registro de accesos de un expediente",
    responses={200: _total("Total de filas que cumplen los filtros (todas las páginas)."), **_ERROR_403_LECTOR,
               404: {"model": RespuestaError, "description": "No existe el expediente."},
               422: {"model": RespuestaError, "description": "`relacion` o `motivo` fuera de sus valores, una fecha sin zona horaria o un parámetro fuera de rango."}},
    dependencies=_SOLO_COORDINACION,
)
def listar_de_un_expediente(
    hce_id: int,
    response: Response,
    db: Annotated[Session, Depends(sesion_lectura)],
    desde: _DESDE = None,
    hasta: _HASTA = None,
    usuario_id: _ID = None,
    relacion: Annotated[str | None, Query(description=f"Una de: {' · '.join(ACCESO_RELACIONES)}.")] = None,
    motivo: Annotated[str | None, Query(description=f"Un `motivo_codigo`: {' · '.join(MOTIVOS_ACCESO)}.")] = None,
    limit: _LIMIT = LIMITE_POR_OMISION,
    offset: _OFFSET = 0,
):
    """Quién abrió **este** expediente, cuándo y por qué, la fila más nueva primero (total en **`X-Total-Count`**): las
    aperturas automáticas del equipo tratante y de gestión, las ventanas con motivo, los ateneos clínicos y la copia a
    la familia. **Sólo coordinación, sin motivo** —también la que es técnica del grupo: se decide por rol—; no es parte
    de la HC y leerlo no deja fila."""
    servicio.exigir_expediente(db, hce_id)
    filas, total = servicio.listar(
        db, hce_id=hce_id, usuario_id=usuario_id, relacion=relacion, motivo=motivo, desde=desde, hasta=hasta,
        limit=limit, offset=offset,
    )
    response.headers[CABECERA_TOTAL] = str(total)
    return _filas(filas)
