"""Expediente (HCE-00) y persona — M11.3-a; la identificación y la consulta por C.I. — Fase 4, A1.

Contrato de respuesta y de error: docstring de `app/routers/__init__.py`. Quién puede qué lo decide la matriz
(`app/services/matriz.py`): las dependencias `permitido(...)` (rutas sin expediente) y `hce_visible` /
`hce_identificacion` (rutas de un expediente) corren antes de leer el cuerpo.
"""
from contextlib import contextmanager
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.models.identidad import Profesional
from app.routers.dependencias import (
    hce_identificacion, hce_visible, permitido, sesion_lectura, sesion_transaccional, usuario_actual,
)
from app.schemas.comunes import RespuestaError, Resultado
from app.schemas.hce import (
    EJEMPLO_RESULTADO_HCE, EJEMPLO_RESUMEN_HCE, ConsultaCi, ConsultaFila, GrupoResumen, HceActualizar, HceCrear,
    HceDetalle, HceResumen, IdentificacionActualizar, IdentificacionDetalle, PersonaResumen,
)
from app.services import flujo as servicio_flujo
from app.services import hce as servicio
from app.services import matriz
from app.services.errores import ConflictError, DuplicadoError, ValidationFailed

router = APIRouter(prefix="/hce", tags=["hce"])

#: Total de la búsqueda paginada (§5.118 g): va en una **cabecera** y no en un sobre, para
#: que `GET /hce` siga devolviendo la lista directa como todo GET (contrato de
#: `app/routers/__init__.py`). `main.py` la expone por CORS.
CABECERA_TOTAL = "X-Total-Count"
_USUARIO = Annotated[Profesional, Depends(usuario_actual)]
#: B5 (§5.162 i, F4-14): lo que recibe quien **no** ve la nómina (el técnico) cuando la C.I. ya existe. Sin `campo`.
MENSAJE_CI_DUPLICADA_TECNICO = "Ya hay un NNA registrado con esa C.I. Consultá con coordinación."
#: …y cuando el N.º de HC explícito ya lo tiene otro expediente (§5.119 d, con «coordinación» en lugar de «dirección»).
MENSAJE_DUPLICADO_TECNICO = "No se pudo completar el alta: consultá con coordinación."
#: Un dato clínico en el alta de coordinación o administrativo, o en `PATCH /hce/{id}/identificacion` (F4-5, F4-6).
MENSAJE_DATO_CLINICO = "Es un dato clínico: lo carga el equipo tratante."
MENSAJE_NO_ES_IDENTIFICACION = "No es un dato de la identificación del expediente."


@contextmanager
def _duplicado_segun_quien(usuario: Profesional):
    """B5 (F4-14): la C.I. es `UNIQUE`, así que el alta (o el cambio) con una que ya existe sigue siendo **409**. Quien ve
    la nómina (coordinación, administrativo) recibe el mensaje específico con su `campo`; el técnico, que no la ve, uno
    que no nombra a nadie ni su grupo, con `campo: null`. **Límite aceptado:** el 409 revela que el dato existe. No se
    escribe auditoría del intento: el request se deshace entero (§5.108)."""
    # Se decide **antes**: un `flush` que choca con el UNIQUE deja la sesión pendiente de rollback y expira los objetos,
    # así que leer `usuario.rol` en el `except` daría un 500.
    especifico = matriz.ve_la_nomina(usuario)
    try:
        yield
    except DuplicadoError as exc:
        if especifico:
            raise
        mensaje = MENSAJE_CI_DUPLICADA_TECNICO if any(d["campo"] == "persona.ci" for d in exc.detalle) else MENSAJE_DUPLICADO_TECNICO
        raise ConflictError(mensaje, [(None, mensaje)]) from exc


_VISIBLE = [Depends(hce_visible)]

_ERROR_403 = {403: {"model": RespuestaError, "description": (
    "`forbidden`: el rol o la relación con el expediente no lo permiten (exista o no). `reason_required`: el expediente "
    "existe y se abre registrando el motivo (`POST /hce/{id}/accesos`)."
)}}
_ERROR_404 = {404: {"model": RespuestaError, "description": "No existe el expediente."}}
_ERROR_422 = {422: {"model": RespuestaError, "description": "Datos inválidos (detalle por campo)."}}
_ERROR_409_CI = {409: {"model": RespuestaError, "description": (
    "Ya existe una persona con esa cédula, o un expediente con ese N.º de HC. Quien no ve la nómina (el técnico) recibe "
    "un mensaje que no nombra a nadie, con `campo: null` (B5, F4-14)."
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
        403: {"model": RespuestaError, "description": "Un `tecnico` sólo da de alta en un grupo propio; dirección no técnica no da altas."},
    },
)
def crear(
    datos: HceCrear, db: Annotated[Session, Depends(sesion_transaccional)], usuario: _USUARIO,
    _condicion: Annotated[str | None, Depends(permitido("hce.alta"))],
):
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
    - **Coordinación y administrativo** dan de alta **sólo con datos identificatorios y logísticos** (F4-5, F4-6): un dato
      clínico de HCE-00 con valor (diagnóstico, CIE-11, fecha del diagnóstico, derivación, medicación, alerta, anamnesis)
      es 422 por campo; lo carga después el equipo tratante.
    """
    cuerpo = datos.model_dump()
    persona = cuerpo.pop("persona")
    matriz.exigir_grupo_propio(db, usuario, cuerpo.get("grupo_id"))
    if matriz.solo_identificacion(usuario) and (clinicos := servicio.datos_clinicos_presentes(cuerpo)):
        raise ValidationFailed([(campo, MENSAJE_DATO_CLINICO) for campo in clinicos])
    with _duplicado_segun_quien(usuario):
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
        403: {"model": RespuestaError, "description": "Dirección no técnica no busca expedientes."},
    },
)
def buscar(
    response: Response,
    db: Annotated[Session, Depends(sesion_lectura)],
    usuario: _USUARIO,
    _condicion: Annotated[str | None, Depends(permitido("hce.buscar"))],
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
    expedientes de sus grupos (§5.101); coordinación y administrativo, la institución (F4-8). Un expediente de otro grupo
    lo encuentra el técnico con `POST /hce/consulta`.

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


@router.post(
    "/consulta",
    response_model=Resultado[ConsultaFila],
    summary="Consulta por C.I. completa (para una interconsulta o un pase)",
    responses={
        **_ERROR_422,
        403: {"model": RespuestaError, "description": "Dirección no técnica no consulta expedientes."},
        404: {"model": RespuestaError, "description": "Ninguna persona tiene exactamente esa C.I. (una parcial no coincide)."},
    },
)
def consultar(datos: ConsultaCi, db: Annotated[Session, Depends(sesion_lectura)], usuario: _USUARIO,
              _condicion: Annotated[str | None, Depends(permitido("hce.consulta"))]):
    """**Coincidencia exacta** de la C.I. canónica (§5.110), activo o no: la fila mínima —id, N.º de HC, nombre, apellido,
    grupo y la relación de quien consulta (`tratante` | `no_tratante`)—, sin fecha de nacimiento, flujo ni nada clínico.
    Por **cuerpo** y no por URL, para no dejar C.I. en el log de accesos del servidor (B8). No escribe (F4-8): abrir el
    expediente es `GET /hce/{id}`, con el motivo si hace falta."""
    hce = servicio.consultar_por_ci(db, datos.ci)
    return Resultado(data=ConsultaFila(
        id=hce.id, hc_historico=hce.hc_historico, nombre=hce.persona.nombre, apellido=hce.persona.apellido,
        grupo=GrupoResumen.model_validate(hce.grupo) if hce.grupo is not None else None,
        relacion=matriz.TRATANTE if matriz.relacion(usuario, hce) == matriz.TRATANTE else matriz.NO_TRATANTE,
    ))


@router.get(
    "/{hce_id}",
    response_model=HceDetalle,
    summary="Un expediente con su persona",
    responses={**_ejemplo(200, EJEMPLO_RESULTADO_HCE["data"]), **_ERROR_403, **_ERROR_404},
    dependencies=_VISIBLE,
)
def leer(hce_id: int, db: Annotated[Session, Depends(sesion_lectura)]):
    return HceDetalle.model_validate(servicio.obtener_hce(db, hce_id))


@router.patch(
    "/{hce_id}",
    response_model=Resultado[HceDetalle],
    summary="Edición parcial de HCE-00",
    responses={
        **_ejemplo(200, EJEMPLO_RESULTADO_HCE), **_ERROR_403, **_ERROR_404, **_ERROR_422, **_ERROR_409_CI,
    },
    dependencies=_VISIBLE,
)
def actualizar(
    hce_id: int, datos: HceActualizar, db: Annotated[Session, Depends(sesion_transaccional)], usuario: _USUARIO,
):
    """HCE-00 **siempre es editable** (sin firma), **por el equipo tratante** (F4-4, F4-5: quien no trata no escribe;
    coordinación y administrativo editan lo logístico por `PATCH /hce/{id}/identificacion`). Sólo se tocan las claves que
    vienen en el cuerpo. Cada campo que realmente cambia deja **una fila** en `auditoria` (`campo`, valor anterior y
    nuevo); si nada cambió, no se escribe ninguna.

    **Baja y reingreso** (M11.3-d1): `{"activo": false, "fecha_baja": "2026-10-07"}` da de baja
    (sin `fecha_baja` es 422); `{"activo": true}` reingresa y borra `fecha_baja`. Las dos dejan
    su fila de auditoría por campo. Un expediente dado de baja sale de la búsqueda salvo
    `incluir_inactivos=true`, pero se sigue leyendo por id.
    """
    cuerpo = datos.model_dump(exclude_unset=True)
    persona = cuerpo.pop("persona", None)
    if "grupo_id" in cuerpo:
        matriz.exigir_grupo_propio(db, usuario, cuerpo["grupo_id"])
    with _duplicado_segun_quien(usuario):
        expediente = servicio.actualizar_hce_00(db, hce_id, persona=persona, hce=cuerpo, usuario_id=usuario.id)
    return Resultado(data=HceDetalle.model_validate(expediente))


# ── Identificación (Fase 4, F4-5, F4-6) ──────────────────────────────────────
@router.get(
    "/{hce_id}/identificacion",
    response_model=IdentificacionDetalle,
    summary="La identificación y la logística del expediente (sin nada clínico)",
    responses={**_ERROR_403, **_ERROR_404},
    dependencies=[Depends(hce_identificacion)],
)
def leer_identificacion(hce_id: int, db: Annotated[Session, Depends(sesion_lectura)]):
    """La persona, el N.º de HC, el grupo con sus técnicos y el estado (activo, fecha de baja). **Ningún campo clínico.**
    Para el tratante, coordinación y administrativo **sin motivo**; el no tratante, con su ventana."""
    return IdentificacionDetalle.model_validate(servicio.obtener_hce(db, hce_id))


@router.patch(
    "/{hce_id}/identificacion",
    response_model=Resultado[IdentificacionDetalle],
    summary="Editar la identificación y la logística (persona, N.º de HC, grupo, baja y reingreso)",
    responses={**_ERROR_403, **_ERROR_404, **_ERROR_422, **_ERROR_409_CI},
    dependencies=[Depends(hce_identificacion)],
)
def actualizar_identificacion(
    hce_id: int, datos: IdentificacionActualizar, db: Annotated[Session, Depends(sesion_transaccional)], usuario: _USUARIO,
):
    """Las reglas de `PATCH /hce/{id}` sobre **sólo** la persona, `hc_historico`, `grupo_id`, `activo` y `fecha_baja`:
    otra clave es 422 por campo. Mover el expediente de grupo (un pase de caso) cambia desde este pedido quién es
    tratante; un técnico sólo lo mueve a un grupo propio. Cada campo que cambia deja su fila de auditoría."""
    extras = sorted((datos.model_extra or {}).keys())
    if extras:
        raise ValidationFailed([
            (c, MENSAJE_DATO_CLINICO if c in servicio.HCE_CAMPOS_CLINICOS else MENSAJE_NO_ES_IDENTIFICACION) for c in extras
        ])
    cuerpo = datos.model_dump(exclude_unset=True, include={"persona", *servicio.IDENTIFICACION_CAMPOS})
    persona = cuerpo.pop("persona", None)
    if "grupo_id" in cuerpo:
        matriz.exigir_grupo_propio(db, usuario, cuerpo["grupo_id"])
    with _duplicado_segun_quien(usuario):
        expediente = servicio.actualizar_hce_00(db, hce_id, persona=persona, hce=cuerpo, usuario_id=usuario.id)
    return Resultado(data=IdentificacionDetalle.model_validate(expediente))
