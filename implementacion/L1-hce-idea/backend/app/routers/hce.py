"""Expediente (HCE-00) y persona — M11.3-a.

Contrato de respuesta y de error: docstring de `app/routers/__init__.py`.
"""
from contextlib import contextmanager
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.models.identidad import Profesional
from app.routers.dependencias import hce_visible, sesion_lectura, sesion_transaccional, usuario_actual
from app.schemas.comunes import RespuestaError, Resultado
from app.schemas.hce import (
    EJEMPLO_RESULTADO_HCE, EJEMPLO_RESUMEN_HCE, GrupoResumen, HceActualizar, HceCrear, HceDetalle, HceResumen,
    PersonaResumen,
)
from app.services import auth
from app.services import flujo as servicio_flujo
from app.services import hce as servicio
from app.services.errores import ConflictError, DuplicadoError

router = APIRouter(prefix="/hce", tags=["hce"])

#: Total de la búsqueda paginada (§5.118 g): va en una **cabecera** y no en un sobre, para
#: que `GET /hce` siga devolviendo la lista directa como todo GET (contrato de
#: `app/routers/__init__.py`). `main.py` la expone por CORS.
CABECERA_TOTAL = "X-Total-Count"
_USUARIO = Annotated[Profesional, Depends(usuario_actual)]
#: §5.119 d — lo que ve un `tecnico` cuando la cédula o el N.º de HC ya existen.
MENSAJE_DUPLICADO_TECNICO = "No se pudo completar el alta: consultá a dirección."


@contextmanager
def _duplicado_generico_para_tecnico(usuario: Profesional):
    """Un `tecnico` no alcanza todos los expedientes: decirle «ya existe una persona con esa
    cédula» (con `campo`) confirmaría un dato de un expediente que no puede ver. Recibe un 409
    genérico, sin campo; el `admin` conserva el mensaje y el campo específicos. **Límite
    aceptado:** que la respuesta sea un 409 distinto del 201 igual revela que el dato existe.
    No se escribe auditoría del intento: el request se deshace entero (§5.108)."""
    # El rol se lee **antes**: un `flush` que choca con el UNIQUE deja la sesión pendiente de
    # rollback y expira los objetos, así que leer `usuario.rol` en el `except` daría un 500.
    es_admin = auth.es_admin(usuario)
    try:
        yield
    except DuplicadoError as exc:
        if es_admin:
            raise
        raise ConflictError(MENSAJE_DUPLICADO_TECNICO, [(None, MENSAJE_DUPLICADO_TECNICO)]) from exc
_VISIBLE = [Depends(hce_visible)]

_ERROR_404 = {404: {"model": RespuestaError, "description": "No existe el expediente."}}
_ERROR_422 = {422: {"model": RespuestaError, "description": "Datos inválidos (detalle por campo)."}}
_ERROR_409_CI = {409: {"model": RespuestaError, "description": (
    "Ya existe una persona con esa cédula, o un expediente con ese N.º de HC. A un `tecnico` se le "
    "responde con un mensaje genérico y `campo: null` (§5.119 d)."
)}}


def _ejemplo(status: int, cuerpo) -> dict:
    return {status: {"content": {"application/json": {"example": cuerpo}}}}


@router.post(
    "",
    status_code=201,
    response_model=Resultado[HceDetalle],
    summary="Alta de persona + expediente",
    responses={
        **_ejemplo(201, EJEMPLO_RESULTADO_HCE), **_ERROR_422, **_ERROR_409_CI,
        403: {"model": RespuestaError, "description": "Un `tecnico` sólo da de alta en un grupo propio."},
    },
)
def crear(datos: HceCrear, db: Annotated[Session, Depends(sesion_transaccional)], usuario: _USUARIO):
    """Crea la persona y su expediente en **una sola transacción**.

    - **422** si falta un obligatorio, hay uno en blanco, el `grupo_id` no existe o
      el `hc_historico` explícito es menor que 1000.
    - **409** si ya hay una persona con esa cédula (en cualquier formato de
      escritura) o el `hc_historico` explícito ya lo tiene otro expediente.
    - La **CI se guarda canónica** (solo dígitos y letras: sin puntos, guiones ni
      espacios).
    - **`hc_historico`**: si no viene, el servidor asigna el siguiente (1001 el
      primero; dos altas simultáneas nunca reciben el mismo).
    - Un texto opcional vacío o en blanco se guarda como `NULL`.
    - Deja **una** fila de `auditoria` con `tipo='carga'`.
    - **403** si quien da el alta es `tecnico` y `grupo_id` no es uno de sus grupos (o no
      viene): el expediente quedaría fuera de su alcance en el mismo acto.
    """
    cuerpo = datos.model_dump()
    persona = cuerpo.pop("persona")
    auth.exigir_grupo_propio(db, usuario, cuerpo.get("grupo_id"))
    with _duplicado_generico_para_tecnico(usuario):
        expediente = servicio.crear_hce(db, persona=persona, hce=cuerpo, usuario_id=usuario.id)
    return Resultado(data=HceDetalle.model_validate(expediente))


@router.get(
    "",
    response_model=list[HceResumen],
    summary="Búsqueda de expedientes",
    responses={
        200: {
            "content": {"application/json": {"example": EJEMPLO_RESUMEN_HCE}},
            "headers": {CABECERA_TOTAL: {
                "description": "Total de expedientes que cumplen los filtros (todas las páginas).",
                "schema": {"type": "integer"},
            }},
        },
        **_ERROR_422,
    },
)
def buscar(
    response: Response,
    db: Annotated[Session, Depends(sesion_lectura)],
    usuario: _USUARIO,
    ci: Annotated[str | None, Query(description="Cédula: contiene, sin puntos ni guiones.")] = None,
    numero: Annotated[str | None, Query(description="N.º de historia clínica (`hc_historico`, igual). No busca por el id interno.")] = None,
    grupo: Annotated[str | None, Query(description="Nombre del grupo (igual; sin mayúsculas ni acentos), del año `anio`.")] = None,
    anio: Annotated[int | None, Query(ge=1, le=32767, description="Año del grupo; por omisión el año en curso. Sólo tiene efecto junto con `grupo`.")] = None,
    nombre: Annotated[str | None, Query(description="Nombre y/o apellido: contiene; sin mayúsculas ni acentos.")] = None,
    incluir_inactivos: Annotated[bool, Query(description="`true`: incluye los expedientes dados de baja.")] = False,
    limit: Annotated[int, Query(ge=1, le=servicio.LIMITE_MAXIMO, description="Filas por página (1–200).")] = servicio.LIMITE_POR_OMISION,
    offset: Annotated[int, Query(ge=0, le=2_147_483_647, description="Filas a saltear.")] = 0,
):
    """Las **tres vías institucionales** —cédula, N.º de historia, grupo— más el
    nombre (Documento Técnico, línea 66). Los filtros se combinan con **Y**; sin
    filtros devuelve todos. Una lista vacía es un resultado válido, no un error.

    **Paginada** (`limit` 50 por omisión, máx. 200; `offset`), ordenada por apellido y
    nombre; el total de todas las páginas va en la cabecera **`X-Total-Count`**. Los
    dados de baja no aparecen salvo `incluir_inactivos=true`. Un `tecnico` sólo ve los
    expedientes de sus grupos (§5.101).

    Cada fila trae la `fecha_nac` de la persona y `flujo`: el estado de los módulos del **año en
    curso** (`modulo`, `estado`), como `modulos[]` de `GET /hce/{id}/flujo`, y `ci`, el estado del
    consentimiento (`pendiente` · `registrado`) tal como lo devuelve ese mismo endpoint.
    """
    filas, total = servicio.buscar_hce(
        db, ci=ci, numero=numero, grupo=grupo, anio=anio, nombre=nombre,
        incluir_inactivos=incluir_inactivos, usuario=usuario, limit=limit, offset=offset,
    )
    response.headers[CABECERA_TOTAL] = str(total)
    ids = [h.id for h in filas]
    flujo = servicio_flujo.estados_de_flujo(db, ids)  # en bloque: 3 consultas por página
    ci_por_id = servicio_flujo.estados_ci(db, ids)  # y una más para el consentimiento
    return [
        HceResumen(
            id=h.id, hc_historico=h.hc_historico, activo=h.activo,
            grupo=GrupoResumen.model_validate(h.grupo) if h.grupo is not None else None,
            persona=PersonaResumen.model_validate(h.persona), ci=ci_por_id[h.id], flujo=flujo[h.id],
        )
        for h in filas
    ]


@router.get(
    "/{hce_id}",
    response_model=HceDetalle,
    summary="Un expediente con su persona",
    responses={**_ejemplo(200, EJEMPLO_RESULTADO_HCE["data"]), **_ERROR_404},
    dependencies=_VISIBLE,
)
def leer(hce_id: int, db: Annotated[Session, Depends(sesion_lectura)]):
    return HceDetalle.model_validate(servicio.obtener_hce(db, hce_id))


@router.patch(
    "/{hce_id}",
    response_model=Resultado[HceDetalle],
    summary="Edición parcial de HCE-00",
    responses={
        **_ejemplo(200, EJEMPLO_RESULTADO_HCE), **_ERROR_404, **_ERROR_422, **_ERROR_409_CI,
        403: {"model": RespuestaError, "description": "Un `tecnico` sólo mueve el expediente a un grupo propio."},
    },
    dependencies=_VISIBLE,
)
def actualizar(
    hce_id: int, datos: HceActualizar, db: Annotated[Session, Depends(sesion_transaccional)], usuario: _USUARIO,
):
    """HCE-00 **siempre es editable** (sin firma). Sólo se tocan las claves que
    vienen en el cuerpo. Cada campo que realmente cambia deja **una fila** en
    `auditoria` (`campo`, valor anterior y nuevo); si nada cambió, no se escribe
    ninguna.

    **Baja y reingreso** (M11.3-d1): `{"activo": false, "fecha_baja": "2026-10-07"}` da de baja
    (sin `fecha_baja` es 422); `{"activo": true}` reingresa y borra `fecha_baja`. Las dos dejan
    su fila de auditoría por campo. Un expediente dado de baja sale de la búsqueda salvo
    `incluir_inactivos=true`, pero se sigue leyendo por id.
    """
    cuerpo = datos.model_dump(exclude_unset=True)
    persona = cuerpo.pop("persona", None)
    if "grupo_id" in cuerpo:
        auth.exigir_grupo_propio(db, usuario, cuerpo["grupo_id"])
    with _duplicado_generico_para_tecnico(usuario):
        expediente = servicio.actualizar_hce_00(db, hce_id, persona=persona, hce=cuerpo, usuario_id=usuario.id)
    return Resultado(data=HceDetalle.model_validate(expediente))
