"""Abrir una ventana de acceso a una HC con motivo — Fase 4, A1 (`docs/diseno/fase4-acceso.md` c, d, e; §5.164, §5.165).

`POST /hce/{id}/accesos {motivo_codigo, motivo_texto?, ci?}` deja **una fila** de `acceso_hce`:

- el **técnico no tratante** (`no_tratante`) y **coordinación** (`supervision`) abren una ventana de
  `VENTANA_ACCESO_MINUTOS` sobre el expediente (F4-9);
- la **copia de la HC a la familia** (`copia_familia`, del tratante o de coordinación) es un acceso del **titular**
  (`titular`, §5.103): `vence = inicio`, no abre nada.

**Decisión (a) del equipo (§5.165, corrige F4-8 y F4-9):** el técnico no tratante manda además la **C.I. completa** del
NNA, que se compara canónica (§5.110) con la del expediente; si no coincide, la respuesta es el **404 de un expediente
inexistente**. Los ids son correlativos: sin esto, un técnico abriría cualquier expediente recorriéndolos, con el registro
como único control y después del hecho. Coordinación no la manda (si la manda, no se mira).

**Orden (A1c, §5.174; invierte el de A1):** el rol y la existencia los miró la dependencia (403, 404); después **se valida
todo el cuerpo y se devuelve junto, en un solo 422** (el motivo del catálogo y de la relación, el texto y, para el técnico no
tratante, que la C.I. *esté*); **recién entonces se compara la C.I.** (el 404). Así la comparación es el último paso y no
hay respuesta que dependa de ella sin que quede una fila: con un motivo inválido, la C.I. correcta y la equivocada reciben
el mismo 422, y la única manera de confirmar una C.I. es abrir una ventana, que se registra.

**Reglas del motivo** (sección e): del catálogo `MOTIVOS_ACCESO` y para la relación de quien lo pide (422 por campo si no);
`motivo_texto` vacío o en blanco → NULL; obligatorio en `copia_familia` y `otro`; hasta `MOTIVO_TEXTO_MAX` caracteres; sin
NUL (lo rechaza la dependencia `sin_caracter_nulo`, §5.163 a); los caracteres Cf y Cc se quitan **salvo** salto de línea,
retorno y tabulación, con el aviso de §5.163 b.

**A2 (§5.178).** El registro automático del tratante, de la gestión y del ateneo clínico y los intentos por C.I. se
escriben en `app/services/registro_accesos.py`. Acá, además de `abrir`, están **los lectores** (`listar`,
`listar_intentos`: sólo coordinación, sin motivo; quién, cuándo y por qué, **sin contenido clínico**) y `vista`, que pone
`motivo_label` en toda fila que sale: el rótulo del catálogo o, en una fila automática, el motivo fijo de su relación
(«Atención directa (tratante)», «Gestión (identificación y organismos)»: §5.176 e) — un rótulo del servidor, no un valor
guardado.
"""
from collections.abc import Mapping
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.constantes import (
    ACCESO_NO_TRATANTE, ACCESO_RELACIONES, ACCESO_SUPERVISION, ACCESO_TITULAR, INTENTO_TIPOS, MOTIVO_COPIA_FAMILIA,
    MOTIVO_LABEL_DE_RELACION, MOTIVO_QUIEN_COORDINACION, MOTIVO_TEXTO_MAX, MOTIVOS_ACCESO, VENTANA_ACCESO_MINUTOS,
)
from app.models.acceso import AccesoHce, AccesoIntento
from app.models.identidad import HceDiurna, Profesional
from app.services import matriz
from app.services.errores import NotFound, ValidationFailed
from app.services.hce import clave_ci
from app.services.texto import aviso_invisibles, normalizar_texto, quitar_invisibles

#: Lo que se conserva de los caracteres de control en el texto del motivo (puede tener varias líneas).
_CONSERVAR = "\n\r\t"


class CiNoCoincide(NotFound):
    """La C.I. que mandó el técnico no tratante no es la del expediente. **Para el cliente es el 404 de un id que no
    existe** (el mismo `code`, el mismo mensaje: §5.174 a); la subclase existe para que el router deje el intento en
    `acceso_intento` antes de responder (§5.178 e). `hce_id` es el expediente al que apuntaba; la C.I. no viaja."""

    def __init__(self, hce_id: int):
        super().__init__("No existe el expediente")
        self.hce_id = hce_id


def motivos() -> list[dict[str, Any]]:
    """El catálogo, con quién puede usar cada motivo (`quien`: `tratante` · `no_tratante` · `coordinacion`)."""
    return [
        {"codigo": codigo, "label": m["label"], "quien": list(m["quien"]), "texto_obligatorio": m["texto_obligatorio"]}
        for codigo, m in MOTIVOS_ACCESO.items()
    ]


def _quien(usuario: Profesional, relacion: str | None) -> str:
    """Contra qué `quien` del catálogo se mira el motivo: coordinación es siempre `coordinacion` (trate o no al grupo);
    el técnico, su relación."""
    return MOTIVO_QUIEN_COORDINACION if matriz.es_coordinacion(usuario) else (relacion or "")


def abrir(db: Session, usuario: Profesional, hce_id: int, datos: Mapping[str, Any]) -> tuple[AccesoHce, list[dict]]:
    """La fila de `acceso_hce` y los avisos. El rol y la existencia los miró la dependencia de la ruta; acá, primero el
    cuerpo entero (422) y después la C.I. (404)."""
    hce = matriz.exigir_en_hce(db, usuario, "accesos.abrir", hce_id)
    relacion = matriz.relacion(usuario, hce)
    errores: list[tuple[str | None, str]] = []
    avisos: list[dict] = []

    # (1) TODO el cuerpo se valida primero y se devuelve junto (un solo 422), **sin mirar si la C.I. coincide**. Si la
    # C.I. se comparara antes, un 422 por el motivo (C.I. correcta) y un 404 (C.I. equivocada) le dirían al técnico no
    # tratante cuál de sus C.I. es la del expediente sin dejar ninguna fila (hallazgo 2 de la auditoría del 2026-11-13).
    codigo = datos.get("motivo_codigo")
    motivo = MOTIVOS_ACCESO.get(codigo) if isinstance(codigo, str) else None
    if motivo is None:
        errores.append(("motivo_codigo", "Elegí uno de los motivos del catálogo."))
    elif _quien(usuario, relacion) not in motivo["quien"]:
        errores.append(("motivo_codigo", "Ese motivo no corresponde a tu relación con este expediente."))

    # Del técnico no tratante, además, que **mande** la C.I. (sólo que esté, no si es la del expediente).
    ci = datos.get("ci")
    pide_ci = matriz.es_tecnico(usuario) and relacion != matriz.TRATANTE
    if pide_ci and (not isinstance(ci, str) or normalizar_texto(ci) is None):
        errores.append(("ci", "Es obligatoria: escribí la C.I. completa del NNA."))

    texto = datos.get("motivo_texto")
    if texto is not None and not isinstance(texto, str):
        errores.append(("motivo_texto", "Tiene que ser un texto."))
        texto = None
    if isinstance(texto, str):
        texto, quitados = quitar_invisibles(texto, conservar=_CONSERVAR)
        if quitados:
            avisos.append(aviso_invisibles("motivo_texto"))
        texto = normalizar_texto(texto)
    if texto is not None and len(texto) > MOTIVO_TEXTO_MAX:
        errores.append(("motivo_texto", f"Hasta {MOTIVO_TEXTO_MAX} caracteres."))
    if motivo is not None and motivo["texto_obligatorio"] and texto is None:
        errores.append(("motivo_texto", "Es obligatorio para este motivo: escribilo (sin datos clínicos del NNA)."))
    if errores:
        raise ValidationFailed(errores)

    # (2) Recién con el cuerpo válido se compara la C.I.: la **única** forma de confirmarla es abrir una ventana, y eso
    # deja una fila. Si no coincide, el 404 de un expediente inexistente (el mismo cuerpo que el de un id que no existe).
    if pide_ci and clave_ci(ci).strip() != hce.persona.ci:
        raise CiNoCoincide(hce.id)

    titular = codigo == MOTIVO_COPIA_FAMILIA
    ahora = func.now()
    fila = AccesoHce(
        hce_id=hce.id, usuario_id=usuario.id, rol=usuario.rol,
        relacion=ACCESO_TITULAR if titular else (ACCESO_SUPERVISION if matriz.es_coordinacion(usuario) else ACCESO_NO_TRATANTE),
        motivo_codigo=codigo, motivo_texto=texto, inicio=ahora,
        vence=ahora if titular else ahora + timedelta(minutes=VENTANA_ACCESO_MINUTOS),
        token_version=usuario.token_version,
    )
    db.add(fila)
    db.flush()
    db.refresh(fila)
    return fila, avisos


def motivo_label(fila: AccesoHce) -> str | None:
    """El motivo **como lo lee una persona**, siempre puesto por el servidor (§5.178 b): el rótulo del catálogo o, en una
    fila automática (`motivo_codigo` NULL), el motivo fijo de su relación."""
    if fila.motivo_codigo:
        return MOTIVOS_ACCESO[fila.motivo_codigo]["label"]
    return MOTIVO_LABEL_DE_RELACION.get(fila.relacion)


def vista(fila: AccesoHce) -> dict[str, Any]:
    return {
        "id": fila.id, "hce_id": fila.hce_id, "relacion": fila.relacion, "motivo_codigo": fila.motivo_codigo,
        "motivo_label": motivo_label(fila),
        "motivo_texto": fila.motivo_texto, "inicio": fila.inicio, "vence": fila.vence,
    }


# ── Los lectores (A2, §5.178 d, e): sólo coordinación, sin motivo ────────────
def _autor(p: Profesional) -> dict[str, Any]:
    return {"id": p.id, "nombre": p.nombre}


def vista_de_registro(fila: AccesoHce, autor: Profesional) -> dict[str, Any]:
    """Una fila del registro para quien lo audita: quién, con qué rol **en ese momento**, sobre qué expediente, por qué
    y cuándo. Nada clínico (ni el nombre del NNA: el expediente va por su id)."""
    return {**vista(fila), "usuario": _autor(autor), "rol": fila.rol, "ateneo_id": fila.ateneo_id}


def exigir_expediente(db: Session, hce_id: int) -> None:
    """404 si el expediente no existe (el rol ya lo miró la dependencia de la ruta: 403 exista o no)."""
    if db.scalar(select(HceDiurna.id).where(HceDiurna.id == hce_id)) is None:
        raise NotFound("No existe el expediente")


def _periodo(columna, desde: datetime | None, hasta: datetime | None) -> list:
    """`desde` incluido, `hasta` excluido."""
    condiciones = []
    if desde is not None:
        condiciones.append(columna >= desde)
    if hasta is not None:
        condiciones.append(columna < hasta)
    return condiciones


def listar(
    db: Session, *, hce_id: int | None = None, usuario_id: int | None = None, relacion: str | None = None,
    motivo: str | None = None, desde: datetime | None = None, hasta: datetime | None = None, limit: int, offset: int,
) -> tuple[list[tuple[AccesoHce, Profesional]], int]:
    """Las filas de `acceso_hce` que cumplen los filtros (se combinan con **Y**), **la más nueva primero** (`inicio` e
    `id` descendentes), y el total. `relacion` o `motivo` fuera de las constantes es 422 por campo (los dos a la vez).
    `motivo` filtra por `motivo_codigo`: las filas automáticas (sin código) se piden por su `relacion`."""
    problemas = []
    if relacion is not None and relacion not in ACCESO_RELACIONES:
        problemas.append(("relacion", f"Debe ser una de: {', '.join(ACCESO_RELACIONES)}"))
    if motivo is not None and motivo not in MOTIVOS_ACCESO:
        problemas.append(("motivo", f"Debe ser uno de: {', '.join(MOTIVOS_ACCESO)}"))
    if problemas:
        raise ValidationFailed(problemas)

    condiciones = _periodo(AccesoHce.inicio, desde, hasta)
    for columna, valor in ((AccesoHce.hce_id, hce_id), (AccesoHce.usuario_id, usuario_id),
                           (AccesoHce.relacion, relacion), (AccesoHce.motivo_codigo, motivo)):
        if valor is not None:
            condiciones.append(columna == valor)
    total = db.scalar(select(func.count()).select_from(AccesoHce).where(*condiciones))
    filas = db.execute(
        select(AccesoHce, Profesional).join(Profesional, Profesional.id == AccesoHce.usuario_id)
        .where(*condiciones).order_by(AccesoHce.inicio.desc(), AccesoHce.id.desc()).limit(limit).offset(offset)
    ).all()
    return [(a, p) for a, p in filas], total


def listar_intentos(
    db: Session, *, usuario_id: int | None = None, tipo: str | None = None, desde: datetime | None = None,
    hasta: datetime | None = None, limit: int, offset: int,
) -> tuple[list[tuple[AccesoIntento, Profesional]], int]:
    """Las filas de `acceso_intento`, la más nueva primero, y el total. Un `tipo` fuera de `INTENTO_TIPOS` es 422."""
    if tipo is not None and tipo not in INTENTO_TIPOS:
        raise ValidationFailed([("tipo", f"Debe ser uno de: {', '.join(INTENTO_TIPOS)}")])
    condiciones = _periodo(AccesoIntento.momento, desde, hasta)
    for columna, valor in ((AccesoIntento.usuario_id, usuario_id), (AccesoIntento.tipo, tipo)):
        if valor is not None:
            condiciones.append(columna == valor)
    total = db.scalar(select(func.count()).select_from(AccesoIntento).where(*condiciones))
    filas = db.execute(
        select(AccesoIntento, Profesional).join(Profesional, Profesional.id == AccesoIntento.usuario_id)
        .where(*condiciones).order_by(AccesoIntento.momento.desc(), AccesoIntento.id.desc()).limit(limit).offset(offset)
    ).all()
    return [(i, p) for i, p in filas], total


def vista_de_intento(fila: AccesoIntento, autor: Profesional) -> dict[str, Any]:
    return {
        "id": fila.id, "usuario": _autor(autor), "rol": fila.rol, "tipo": fila.tipo, "hce_id": fila.hce_id,
        "resultado": fila.resultado, "momento": fila.momento,
    }
