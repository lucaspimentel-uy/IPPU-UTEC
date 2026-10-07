"""Informe de Cierre Anual (HCE-IC): alta, edición, firma, addendas, recibí y datos del documento. M11.3-c.

Un IC por `(hce_id, anio)` — «el único informe válido» (§5.3, Documento Técnico §5.3). Cierra
la cadena del año: LB → PA → PB → **IC**.

## Reglas que fija este módulo

- **`sint_escala`** es `{"esc_1": str, …, "esc_4": str}`: una síntesis por escala de la
  IPPU-TEA (comenta el Δ de cada una). En un PATCH se fusiona **escala por escala**; una
  síntesis en blanco borra esa clave. Se audita una fila `sint_escala.esc_N` por escala.
- **Integridad para firmar** (Documento Técnico §4.3, fila HCE-IC): síntesis por escala (las
  4) · valoraciones anuales (`val_tec1`, `val_tec2`) · recomendaciones · orientaciones ·
  fecha. El primer requisito de esa fila —«LB, PA y PB firmados (o habilitación
  excepcional)»— **no bloquea**: desde §5.95 la secuencia sólo avisa (`fuera_de_secuencia`).
- **Firma** (§5.117 b): el IC no tiene columnas de evaluadores, así que `/firmar` recibe dos
  `profesional_id` **distintos y activos**; `firmas` guarda a los dos.
- **Recibí** (§5.117 e): `{firmante, fecha}` de la familia se registra **después** de la
  firma, por `registrar_recibi`, **una sola vez** (la segunda es 409), con una fila
  `auditoria` `tipo='carga'`: registra la entrega, no edita el contenido firmado. Cualquier
  otro cambio a un IC firmado es 409 (firma = bloqueo).
- **Documento** (§5.3 · §5.97 · §5.102): `documento()` arma todo lo que necesita el informe
  imprimible, **sólo de un IC firmado** (sin firmar → 409). El IDEA es **el del año del IC**
  (`idea.idea_de_anio`), firmado o marcado explícitamente como no firmado. No hay PDF en el
  servidor: lo imprime el frontend.
"""
from collections.abc import Mapping
from typing import Any

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.constantes import (
    ESTADO_EN_CURSO, ESTADO_FIRMADO, IC_SINTESIS_ESCALAS, MODULO_HCE_IC, PROTOCOLO_ESCALAS,
)
from app.models.identidad import Profesional
from app.models.modulos import InformeCierre
from app.services import auditoria, delta, firma, flujo
from app.services import idea as servicio_idea
from app.services import protocolo as servicio_protocolo
from app.services.errores import ConflictError, NotFound, ValidationFailed
from app.services.hce import obtener_hce
from app.services.texto import normalizar_opcionales, normalizar_texto

CAMPOS_TEXTO = ("val_tec1", "val_tec2", "recomendaciones", "orientaciones")
CAMPOS_ESCALARES = ("fecha", *CAMPOS_TEXTO)
_UQ_IC = "uq_informe_cierre_hce_anio"
#: Cuántos firman el IC (los dos técnicos, como LB/PA/PB — `FirmaMixin`).
FIRMANTES_IC = 2


# ── Lectura ──────────────────────────────────────────────────────────────────
def obtener_informe(db: Session, informe_id: int) -> InformeCierre:
    informe = db.get(InformeCierre, informe_id)
    if informe is None:
        raise NotFound(f"No existe el informe de cierre {informe_id}")
    return informe


def listar_informes(db: Session, hce_id: int) -> list[InformeCierre]:
    """Los IC del expediente, el de mayor año primero. 404 si no existe el expediente."""
    obtener_hce(db, hce_id)
    return list(db.scalars(
        select(InformeCierre).where(InformeCierre.hce_id == hce_id).order_by(InformeCierre.anio.desc())
    ))


def informe_de_anio(db: Session, hce_id: int, anio: int) -> InformeCierre | None:
    return db.scalars(select(InformeCierre).where(
        InformeCierre.hce_id == hce_id, InformeCierre.anio == anio,
    )).first()


def vista(informe: InformeCierre) -> dict[str, Any]:
    """El IC como lo devuelve la API: `sint_escala` con las 4 claves (las vacías en `null`)."""
    sint = informe.sint_escala or {}
    return {
        "id": informe.id, "hce_id": informe.hce_id, "anio": informe.anio, "fecha": informe.fecha,
        "sint_escala": {e: sint.get(e) for e in IC_SINTESIS_ESCALAS},
        "val_tec1": informe.val_tec1, "val_tec2": informe.val_tec2,
        "recomendaciones": informe.recomendaciones, "orientaciones": informe.orientaciones,
        "recibi": informe.recibi,
        "estado": ESTADO_FIRMADO if informe.firmado else ESTADO_EN_CURSO,
        "firmado": bool(informe.firmado),
        "firmas": informe.firmas or [], "addendas": informe.addendas or [],
    }


# ── Validación de entrada ────────────────────────────────────────────────────
def _fusionar_sintesis(
    actual: Mapping | None, cambios: Mapping[str, Any] | None, errores: list[tuple[str | None, str]],
) -> tuple[dict[str, str], dict[str, Any], dict[str, Any]]:
    """Aplica `cambios` (`{"esc_2": "texto"}`) escala por escala; en blanco borra la clave.
    Devuelve `(resultante, antes, despues)` indexados por `sint_escala.esc_N`, sólo lo que cambió."""
    resultante: dict[str, str] = dict(actual or {})
    antes: dict[str, Any] = {}
    despues: dict[str, Any] = {}
    for clave, texto in (cambios or {}).items():
        if clave not in IC_SINTESIS_ESCALAS:
            errores.append((f"sint_escala.{clave}", f"No es una escala: {', '.join(IC_SINTESIS_ESCALAS)}"))
            continue
        if texto is not None and not isinstance(texto, str):
            errores.append((f"sint_escala.{clave}", "Debe ser texto"))
            continue
        nuevo = normalizar_texto(texto)
        previo = resultante.get(clave)
        if nuevo == previo:
            continue
        antes[f"sint_escala.{clave}"] = previo
        despues[f"sint_escala.{clave}"] = nuevo
        if nuevo is None:
            resultante.pop(clave, None)
        else:
            resultante[clave] = nuevo
    return resultante, antes, despues


def _flush_traduciendo(db: Session) -> None:
    try:
        db.flush()
    except IntegrityError as exc:
        diag = getattr(exc.orig, "diag", None)
        if getattr(diag, "constraint_name", None) == _UQ_IC:
            raise ConflictError(
                "Ya existe un informe de cierre de ese año para el expediente",
                [("anio", "Ya existe un informe de cierre de ese año para el expediente")],
            ) from exc
        raise


# ── Escritura ────────────────────────────────────────────────────────────────
def crear_informe(
    db: Session, hce_id: int, datos: Mapping[str, Any], *, usuario_id: int | None = None,
) -> tuple[InformeCierre, list[dict[str, Any]]]:
    """Alta del IC de un año. 404 sin expediente · 422 sin año · 409 si ya hay uno ese año.
    Escribe una fila `carga` y, fuera de secuencia, el aviso y una fila `excepcion`."""
    obtener_hce(db, hce_id)
    errores: list[tuple[str | None, str]] = []
    anio = datos.get("anio")
    if not isinstance(anio, int) or isinstance(anio, bool) or not 1 <= anio <= 32767:
        errores.append(("anio", "Es obligatorio: un año entre 1 y 32767"))
    escalares = normalizar_opcionales({c: datos[c] for c in CAMPOS_ESCALARES if c in datos}, CAMPOS_TEXTO)
    sintesis, _, _ = _fusionar_sintesis(None, datos.get("sint_escala"), errores)
    if errores:
        raise ValidationFailed(errores)
    if informe_de_anio(db, hce_id, anio) is not None:
        raise ConflictError(
            f"El expediente {hce_id} ya tiene un informe de cierre del {anio}",
            [("anio", "Ya existe un informe de cierre de ese año para el expediente")],
        )

    informe = InformeCierre(hce_id=hce_id, anio=anio, sint_escala=sintesis or None, **escalares)
    db.add(informe)
    _flush_traduciendo(db)
    auditoria.registrar_carga(
        db, modulo=MODULO_HCE_IC, hce_id=hce_id, usuario_id=usuario_id,
        detalle=f"Alta de {MODULO_HCE_IC} (informe de cierre {anio}) del expediente {hce_id}",
    )
    avisos = flujo.avisos_de_secuencia(
        db, hce_id=hce_id, anio=anio, modulo=MODULO_HCE_IC, accion="creación", usuario_id=usuario_id,
    )
    return informe, avisos


def _obtener_para_escribir(db: Session, informe_id: int) -> InformeCierre:
    informe = db.get(InformeCierre, informe_id, with_for_update=True)
    if informe is None:
        raise NotFound(f"No existe el informe de cierre {informe_id}")
    return informe


def actualizar_informe(
    db: Session, informe_id: int, datos: Mapping[str, Any], *, usuario_id: int | None = None,
) -> InformeCierre:
    """Edición parcial de un IC **sin firmar** (firmado → 409). Audita por campo y una fila
    `sint_escala.esc_N` por escala cambiada; un PATCH idéntico no escribe ninguna."""
    informe = _obtener_para_escribir(db, informe_id)
    firma.exigir_no_firmado(informe, MODULO_HCE_IC)

    errores: list[tuple[str | None, str]] = []
    cambios = normalizar_opcionales({c: datos[c] for c in CAMPOS_ESCALARES if c in datos}, CAMPOS_TEXTO)
    sintesis, antes_sint, despues_sint = _fusionar_sintesis(informe.sint_escala, datos.get("sint_escala"), errores)
    if errores:
        raise ValidationFailed(errores)

    antes = {c: getattr(informe, c) for c in cambios}
    for campo, valor in cambios.items():
        setattr(informe, campo, valor)
    if despues_sint:
        informe.sint_escala = sintesis or None
    db.flush()
    auditoria.registrar_cambios(
        db, modulo=MODULO_HCE_IC, hce_id=informe.hce_id, antes=antes, despues=cambios, usuario_id=usuario_id,
    )
    auditoria.registrar_cambios(
        db, modulo=MODULO_HCE_IC, hce_id=informe.hce_id, antes=antes_sint, despues=despues_sint, usuario_id=usuario_id,
    )
    return informe


def _errores_de_firma(
    db: Session, informe: InformeCierre, firmantes_ids: list[int] | None,
) -> tuple[list[tuple[str | None, str]], list[Profesional]]:
    """Integridad del Documento Técnico §4.3 (fila HCE-IC) + los dos firmantes, todo junto."""
    errores: list[tuple[str | None, str]] = []
    sint = informe.sint_escala or {}
    for escala in IC_SINTESIS_ESCALAS:
        if normalizar_texto(sint.get(escala)) is None:
            errores.append((f"sint_escala.{escala}", "Falta la síntesis de la escala"))
    for campo, nombre in (
        ("val_tec1", "La valoración anual del técnico 1"), ("val_tec2", "La valoración anual del técnico 2"),
        ("recomendaciones", "Las recomendaciones"), ("orientaciones", "Las orientaciones"),
    ):
        if normalizar_texto(getattr(informe, campo)) is None:
            errores.append((campo, f"{nombre} es obligatoria para firmar" if campo.startswith("val") else f"{nombre} son obligatorias para firmar"))
    if informe.fecha is None:
        errores.append(("fecha", "Es obligatoria para firmar"))

    profesionales: list[Profesional] = []
    ids = list(firmantes_ids or [])
    if len(ids) != FIRMANTES_IC:
        errores.append(("firmantes", f"Firman {FIRMANTES_IC} profesionales: mandá sus dos id"))
    elif ids[0] == ids[1]:
        errores.append(("firmantes", "Los dos firmantes tienen que ser distintos"))
    else:
        for posicion, profesional_id in enumerate(ids):
            profesional = db.get(Profesional, profesional_id)
            if profesional is None or not profesional.activo:
                errores.append((f"firmantes.{posicion}", f"El profesional {profesional_id} no existe o no está activo"))
            else:
                profesionales.append(profesional)
    return errores, profesionales


def firmar_informe(
    db: Session, informe_id: int, firmantes_ids: list[int] | None, *, usuario_id: int | None = None,
) -> tuple[InformeCierre, list[dict[str, Any]]]:
    """Firma el IC con los dos profesionales del cuerpo (§5.117 b). 409 si ya está firmado ·
    422 con todo lo que falta. Fuera de secuencia (LB/PA/PB sin firmar) se acepta con aviso."""
    informe = _obtener_para_escribir(db, informe_id)
    firma.exigir_no_firmado(informe, MODULO_HCE_IC)
    errores, profesionales = _errores_de_firma(db, informe, firmantes_ids)
    if errores:
        raise ValidationFailed(errores)
    avisos = firma.firmar_modulo(
        db, informe, codigo=MODULO_HCE_IC, hce_id=informe.hce_id, anio=informe.anio,
        firmantes=profesionales, usuario_id=usuario_id,
    )
    return informe, avisos


def agregar_addenda(
    db: Session, informe_id: int, *, texto: str | None, profesional_id: int | None,
    usuario_id: int | None = None,
) -> InformeCierre:
    informe = _obtener_para_escribir(db, informe_id)
    firma.agregar_addenda(
        db, informe, codigo=MODULO_HCE_IC, hce_id=informe.hce_id,
        texto=texto, profesional_id=profesional_id, usuario_id=usuario_id,
    )
    return informe


def registrar_recibi(
    db: Session, informe_id: int, datos: Mapping[str, Any], *, usuario_id: int | None = None,
) -> InformeCierre:
    """Registra el recibí de la familia `{firmante, fecha}` en un IC **firmado**, una sola vez.

    409 si el IC no está firmado (la familia recibe el informe firmado) o si ya tiene recibí ·
    422 si falta el firmante o la fecha. Una fila `auditoria` `tipo='carga'` (sin el nombre
    del firmante en el detalle: el rastro dice qué pasó, no a quién).
    """
    informe = _obtener_para_escribir(db, informe_id)
    if not informe.firmado:
        raise ConflictError(
            "El recibí se registra sobre el informe firmado",
            [(None, "El informe de cierre no está firmado")],
        )
    if informe.recibi is not None:
        raise ConflictError(
            "El recibí ya está registrado: se registra una sola vez",
            [("recibi", "Ya está registrado")],
        )
    errores: list[tuple[str | None, str]] = []
    firmante = normalizar_texto(datos.get("firmante"))
    fecha = datos.get("fecha")
    if firmante is None:
        errores.append(("firmante", "Es obligatorio"))
    if fecha is None:
        errores.append(("fecha", "Es obligatoria"))
    if errores:
        raise ValidationFailed(errores)
    informe.recibi = {"firmante": firmante, "fecha": fecha.isoformat()}
    db.flush()
    auditoria.registrar_carga(
        db, modulo=MODULO_HCE_IC, hce_id=informe.hce_id, usuario_id=usuario_id,
        detalle=f"Recibí de la familia del {MODULO_HCE_IC} ({informe.anio})",
    )
    return informe


# ── Documento imprimible ─────────────────────────────────────────────────────
def _firmas_con_nombre(db: Session, firmas: list[dict] | None) -> list[dict[str, Any]]:
    salida = []
    for entrada in firmas or []:
        profesional = db.get(Profesional, entrada.get("profesional_id"))
        salida.append({**entrada, "nombre": profesional.nombre if profesional is not None else None})
    return salida


def _resumen_protocolo(protocolo) -> dict[str, Any] | None:
    if protocolo is None:
        return None
    return {
        "id": protocolo.id, "tipo": protocolo.tipo, "fecha": protocolo.fecha,
        "firmado": bool(protocolo.firmado),
        "total": protocolo.total, **{e: getattr(protocolo, e) for e in PROTOCOLO_ESCALAS},
    }


def documento(db: Session, informe_id: int) -> dict[str, Any]:
    """Todo lo que necesita el informe imprimible, **sólo de un IC firmado** (409 si no).

    Cabecera (N.º de HC, nombre, grupo), el IDEA **de su propio año** (§5.97; `null` si no
    hay, y con `firmado` explícito si lo hay), PA/PB del año con sus totales, el Δ B − A con
    su interpretación y alertas, y el contenido, firmas (con nombre), addendas y recibí del IC.
    """
    informe = obtener_informe(db, informe_id)
    if not informe.firmado:
        raise ConflictError(
            "El informe de cierre no está firmado: no hay informe (único informe válido, §5.3)",
            [(None, "Firmá el informe de cierre para obtener el documento")],
        )
    hce = obtener_hce(db, informe.hce_id)
    persona = hce.persona
    grupo = hce.grupo
    idea = servicio_idea.idea_de_anio(db, hce.id, informe.anio)
    pa = servicio_protocolo.protocolo_de(db, hce.id, "A", informe.anio)
    pb = servicio_protocolo.protocolo_de(db, hce.id, "B", informe.anio)
    deltas = pb.deltas if pb is not None else None
    return {
        "expediente": {
            "hce_id": hce.id, "hc_numero": hce.hc_historico,
            "nombre": persona.nombre, "apellido": persona.apellido, "fecha_nac": persona.fecha_nac,
            "grupo": {"id": grupo.id, "nombre": grupo.nombre, "anio": grupo.anio} if grupo is not None else None,
        },
        "anio": informe.anio,
        "idea": servicio_idea.vista(db, idea) if idea is not None else None,
        "protocolos": {
            "a": _resumen_protocolo(pa), "b": _resumen_protocolo(pb),
            "deltas": deltas,
            "interpretacion": delta.interpretar(db, deltas),
            "alertas": delta.alertas_del_protocolo(db, deltas),
        },
        "informe": {
            **vista(informe),
            "firmas": _firmas_con_nombre(db, informe.firmas),
        },
    }
