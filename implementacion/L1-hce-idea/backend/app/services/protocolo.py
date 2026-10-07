"""Protocolos A y B (HCE-PA / HCE-PB, Escala IPPU-TEA): alta, edición, totales, firma, Δ y alerta. M11.3-c.

Un protocolo por `(hce_id, tipo, anio)`. Sus 24 ítems van en `protocolo.items`, un dict
`{"1": {"valor": 1..5 | None, "obs": str | None}, ..., "24": {...}}` (la clave es el `id` de
`ippu_item`); un ítem que nunca se tocó **no tiene entrada**. Es el espejo del IDEA
(`services/idea.py`): mismas convenciones de PATCH, auditoría, firma y addendas.

## Reglas que fija este módulo

- **Totales** (§5.105, Documento Técnico §5.2): cada escala (6 ítems, `PROTOCOLO_ESCALAS`)
  va de 6 a 30 y el total de 24 a 120. **Se materializan sólo completos**: una escala con
  algún ítem sin puntuar, y el total con alguno de los 24 sin puntuar, quedan `NULL`. Una
  suma parcial no es un puntaje de la escala (y el `CHECK(total BETWEEN 24 AND 120)` la
  rechazaría). Se recalculan en cada guardado sin firmar y **se congelan al firmar**.
- **`ajustes` es sólo del B** (§2.2): un A con `ajustes` → 422.
- **Integridad para firmar** (Documento Técnico §4.3, fila HCE-PA / HCE-PB): 24 ítems
  puntuados · fecha · **fundamentación obligatoria en ítems con valor 1 o 5** · síntesis de
  ambos técnicos responsables (`sint_tec1`, `sint_tec2`). Más los dos evaluadores,
  distintos y activos (decisión b de §5.117: la firma es un solo acto, como el IDEA).
- **Δ y alerta al firmar el B** (§5.117 c–d): si el PA del mismo año está firmado,
  `deltas` = PB − PA (total y 4 escalas, `services/delta.py`); si no, `deltas` queda `NULL`
  y el aviso `fuera_de_secuencia` (que ya lista `HCE-PA`) lo explica. Si el Δ de alguna
  escala cae en un tramo `alerta=True` del catálogo, se escribe **una** fila `auditoria`
  `tipo='alerta'` y la respuesta trae `alertas`. Todo en la transacción del request.
- **Secuencia** (§5.95 · §5.116 e): crear o firmar un PA sin LB firmado, o un PB sin PA
  firmado, se acepta con `fuera_de_secuencia` + una fila `excepcion`.
"""
from collections.abc import Mapping
from typing import Any

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.constantes import (
    AUDITORIA_TIPO_ALERTA, ESTADO_EN_CURSO, ESTADO_FIRMADO, MODULO_HCE_PA, MODULO_HCE_PB,
    PROTOCOLO_ESCALAS, PROTOCOLO_ITEMS, PROTOCOLO_VALOR_MAX, PROTOCOLO_VALOR_MIN,
    PROTOCOLO_VALORES_CON_OBS,
)
from app.models.identidad import Profesional
from app.models.modulos import Protocolo
from app.services import auditoria, delta, firma, flujo
from app.services.errores import ConflictError, NotFound, ValidationFailed
from app.services.hce import obtener_hce
from app.services.texto import normalizar_opcionales, normalizar_texto

TIPOS = ("A", "B")
CAMPOS_TEXTO = ("sint_tec1", "sint_tec2", "otros", "ajustes")
CAMPOS_ESCALARES = ("fecha", "semanas", *CAMPOS_TEXTO, "evaluador_t1_id", "evaluador_t2_id")
_UQ_PROTOCOLO = "uq_protocolo_hce_tipo_anio"
_ENTRADA_VACIA = {"valor": None, "obs": None}


def modulo_de(tipo: str) -> str:
    """`HCE-PA` para el A, `HCE-PB` para el B: el eslabón de la cadena y el `modulo` de auditoría."""
    return MODULO_HCE_PA if tipo == "A" else MODULO_HCE_PB


def _numerico(valor: Any) -> bool:
    return isinstance(valor, int) and not isinstance(valor, bool)


def _valor_de(items: Mapping | None, clave: str) -> Any:
    entrada = (items or {}).get(clave)
    return entrada.get("valor") if isinstance(entrada, Mapping) else None


def _obs_de(items: Mapping | None, clave: str) -> Any:
    entrada = (items or {}).get(clave)
    return entrada.get("obs") if isinstance(entrada, Mapping) else None


# ── Totales ──────────────────────────────────────────────────────────────────
def calcular_totales(items: Mapping | None) -> dict[str, int | None]:
    """`total`, `esc_1..esc_4` y `puntuados` (cuántos de los 24 ítems tienen valor).

    Una escala vale la suma de sus 6 ítems **sólo si los 6 están puntuados**; el total, la
    suma de los 24 sólo si están los 24. Si no, `None`.
    """
    resultado: dict[str, int | None] = {}
    for escala, claves in PROTOCOLO_ESCALAS.items():
        valores = [_valor_de(items, c) for c in claves]
        resultado[escala] = sum(valores) if all(_numerico(v) for v in valores) else None
    puntuados = sum(1 for c in PROTOCOLO_ITEMS if _numerico(_valor_de(items, c)))
    resultado["total"] = (
        sum(resultado[e] for e in PROTOCOLO_ESCALAS) if puntuados == len(PROTOCOLO_ITEMS) else None
    )
    resultado["puntuados"] = puntuados
    return resultado


def _aplicar_totales(protocolo: Protocolo) -> None:
    for campo, valor in calcular_totales(protocolo.items).items():
        if campo != "puntuados":
            setattr(protocolo, campo, valor)


# ── Lectura ──────────────────────────────────────────────────────────────────
def obtener_protocolo(db: Session, protocolo_id: int) -> Protocolo:
    protocolo = db.get(Protocolo, protocolo_id)
    if protocolo is None:
        raise NotFound(f"No existe el protocolo {protocolo_id}")
    return protocolo


def listar_protocolos(db: Session, hce_id: int) -> list[Protocolo]:
    """Los protocolos del expediente: el de mayor año primero y, dentro del año, A antes que B."""
    obtener_hce(db, hce_id)
    return list(db.scalars(
        select(Protocolo).where(Protocolo.hce_id == hce_id).order_by(Protocolo.anio.desc(), Protocolo.tipo)
    ))


def protocolo_de(db: Session, hce_id: int, tipo: str, anio: int) -> Protocolo | None:
    """El protocolo `tipo` de ese año, firmado o no, o `None`."""
    return db.scalars(select(Protocolo).where(
        Protocolo.hce_id == hce_id, Protocolo.tipo == tipo, Protocolo.anio == anio,
    )).first()


def vista(db: Session, protocolo: Protocolo) -> dict[str, Any]:
    """El protocolo como lo devuelve la API: los 24 ítems completos (los no cargados, en
    blanco), totales guardados, `deltas` guardados y su `interpretacion` y `alertas`
    **derivadas ahora** del catálogo `delta_interpretacion`."""
    items = {c: {"valor": _valor_de(protocolo.items, c), "obs": _obs_de(protocolo.items, c)} for c in PROTOCOLO_ITEMS}
    return {
        "id": protocolo.id, "hce_id": protocolo.hce_id, "tipo": protocolo.tipo, "anio": protocolo.anio,
        "modulo": modulo_de(protocolo.tipo), "items": items,
        "fecha": protocolo.fecha, "semanas": protocolo.semanas,
        "sint_tec1": protocolo.sint_tec1, "sint_tec2": protocolo.sint_tec2,
        "otros": protocolo.otros, "ajustes": protocolo.ajustes,
        "evaluador_t1_id": protocolo.evaluador_t1_id, "evaluador_t2_id": protocolo.evaluador_t2_id,
        "total": protocolo.total, **{e: getattr(protocolo, e) for e in PROTOCOLO_ESCALAS},
        "puntuados": calcular_totales(protocolo.items)["puntuados"],
        "deltas": protocolo.deltas,
        "interpretacion": delta.interpretar(db, protocolo.deltas),
        "alertas": delta.alertas_del_protocolo(db, protocolo.deltas),
        "estado": ESTADO_FIRMADO if protocolo.firmado else ESTADO_EN_CURSO,
        "firmado": bool(protocolo.firmado),
        "firmas": protocolo.firmas or [], "addendas": protocolo.addendas or [],
    }


# ── Validación de entrada ────────────────────────────────────────────────────
def _preparar_escalares(
    db: Session, tipo: str | None, datos: Mapping[str, Any], errores: list[tuple[str | None, str]],
) -> dict[str, Any]:
    d = normalizar_opcionales({c: datos[c] for c in CAMPOS_ESCALARES if c in datos}, CAMPOS_TEXTO)
    semanas = d.get("semanas")
    if semanas is not None and (not _numerico(semanas) or semanas < 0):
        errores.append(("semanas", "Debe ser un número entero mayor o igual a 0"))
    if tipo == "A" and d.get("ajustes") is not None:
        errores.append(("ajustes", "Los ajustes son sólo del Protocolo B"))
    for campo in ("evaluador_t1_id", "evaluador_t2_id"):
        profesional_id = d.get(campo)
        if profesional_id is not None and db.get(Profesional, profesional_id) is None:
            errores.append((campo, f"No existe el profesional {profesional_id}"))
    return d


def _fusionar_items(
    actual: Mapping | None, cambios: Mapping[str, Any] | None, errores: list[tuple[str | None, str]],
) -> tuple[dict[str, dict], dict[str, Any], dict[str, Any]]:
    """Aplica `cambios` (`{"7": {"valor"?, "obs"?}}`) sobre `actual` **ítem por ítem**.

    Igual que `idea._fusionar_dim`: sólo se pisan las claves que vinieron, y devuelve
    `(items resultantes, antes, despues)` indexados por `items.N`, sólo con lo que cambió.
    """
    resultante: dict[str, dict] = {k: dict(v) for k, v in (actual or {}).items()}
    antes: dict[str, Any] = {}
    despues: dict[str, Any] = {}
    for clave, entrada in (cambios or {}).items():
        if clave not in PROTOCOLO_ITEMS:
            errores.append((f"items.{clave}", f"No es un ítem de la Escala IPPU-TEA (1 a {len(PROTOCOLO_ITEMS)})"))
            continue
        previa = resultante.get(clave)
        nueva = {**_ENTRADA_VACIA, **(previa or {}), **{k: v for k, v in (entrada or {}).items() if k in _ENTRADA_VACIA}}
        nueva["obs"] = normalizar_texto(nueva["obs"])
        valor = nueva["valor"]
        if valor is not None and not (_numerico(valor) and PROTOCOLO_VALOR_MIN <= valor <= PROTOCOLO_VALOR_MAX):
            errores.append((
                f"items.{clave}.valor",
                f"Debe ser un número entero de {PROTOCOLO_VALOR_MIN} a {PROTOCOLO_VALOR_MAX}",
            ))
            continue
        if previa is None and nueva == _ENTRADA_VACIA:
            continue
        if previa != nueva:
            antes[f"items.{clave}"] = previa
            despues[f"items.{clave}"] = nueva
            resultante[clave] = nueva
    return resultante, antes, despues


def _exigir_evaluadores_distintos(t1: int | None, t2: int | None, errores: list[tuple[str | None, str]]) -> None:
    if t1 is not None and t1 == t2:
        errores.append(("evaluador_t2_id", "Tiene que ser distinto del evaluador 1"))


def _flush_traduciendo(db: Session) -> None:
    """`flush()` que convierte la violación del UNIQUE (carrera entre dos altas) en 409."""
    try:
        db.flush()
    except IntegrityError as exc:
        diag = getattr(exc.orig, "diag", None)
        if getattr(diag, "constraint_name", None) == _UQ_PROTOCOLO:
            raise ConflictError(
                "Ya existe un protocolo de ese tipo y año para el expediente",
                [("anio", "Ya existe un protocolo de ese tipo y año para el expediente")],
            ) from exc
        raise


# ── Escritura ────────────────────────────────────────────────────────────────
def crear_protocolo(
    db: Session, hce_id: int, datos: Mapping[str, Any], *, usuario_id: int | None = None,
) -> tuple[Protocolo, list[dict[str, Any]]]:
    """Alta del protocolo `tipo` de un año. Devuelve `(protocolo, avisos)`.

    404 si no existe el expediente · 422 si falta `tipo`/`anio` o un dato es inválido (`ajustes`
    en un A incluido) · 409 si ya hay uno de ese tipo y año. Escribe **una** fila `carga` y,
    si está fuera de secuencia, el aviso y **una** fila `excepcion`.
    """
    obtener_hce(db, hce_id)
    errores: list[tuple[str | None, str]] = []
    tipo = datos.get("tipo")
    if tipo not in TIPOS:
        errores.append(("tipo", "Es obligatorio: «A» o «B»"))
    anio = datos.get("anio")
    if not _numerico(anio) or not 1 <= anio <= 32767:
        errores.append(("anio", "Es obligatorio: un año entre 1 y 32767"))
    escalares = _preparar_escalares(db, tipo, datos, errores)
    items, _, _ = _fusionar_items(None, datos.get("items"), errores)
    _exigir_evaluadores_distintos(escalares.get("evaluador_t1_id"), escalares.get("evaluador_t2_id"), errores)
    if errores:
        raise ValidationFailed(errores)
    if protocolo_de(db, hce_id, tipo, anio) is not None:
        raise ConflictError(
            f"El expediente {hce_id} ya tiene un Protocolo {tipo} del {anio}",
            [("anio", "Ya existe un protocolo de ese tipo y año para el expediente")],
        )

    protocolo = Protocolo(hce_id=hce_id, tipo=tipo, anio=anio, items=items or None, **escalares)
    _aplicar_totales(protocolo)
    db.add(protocolo)
    _flush_traduciendo(db)
    modulo = modulo_de(tipo)
    auditoria.registrar_carga(
        db, modulo=modulo, hce_id=hce_id, usuario_id=usuario_id,
        detalle=f"Alta de {modulo} (Protocolo {tipo} {anio}) del expediente {hce_id}",
    )
    avisos = flujo.avisos_de_secuencia(
        db, hce_id=hce_id, anio=anio, modulo=modulo, accion="creación", usuario_id=usuario_id,
    )
    return protocolo, avisos


def _obtener_para_escribir(db: Session, protocolo_id: int) -> Protocolo:
    """El protocolo con la fila bloqueada (`FOR UPDATE`) hasta el fin de la transacción."""
    protocolo = db.get(Protocolo, protocolo_id, with_for_update=True)
    if protocolo is None:
        raise NotFound(f"No existe el protocolo {protocolo_id}")
    return protocolo


def actualizar_protocolo(
    db: Session, protocolo_id: int, datos: Mapping[str, Any], *, usuario_id: int | None = None,
) -> Protocolo:
    """Edición parcial de un protocolo **sin firmar** (409 si está firmado). `tipo` y `anio` no
    se editan. `items` se fusiona ítem por ítem. Recalcula los totales. Audita por campo y una
    fila `items.N` por ítem que cambió; un PATCH idéntico no escribe ninguna."""
    protocolo = _obtener_para_escribir(db, protocolo_id)
    modulo = modulo_de(protocolo.tipo)
    firma.exigir_no_firmado(protocolo, modulo)

    errores: list[tuple[str | None, str]] = []
    cambios = _preparar_escalares(db, protocolo.tipo, datos, errores)
    items, antes_items, despues_items = _fusionar_items(protocolo.items, datos.get("items"), errores)
    _exigir_evaluadores_distintos(
        cambios.get("evaluador_t1_id", protocolo.evaluador_t1_id),
        cambios.get("evaluador_t2_id", protocolo.evaluador_t2_id),
        errores,
    )
    if errores:
        raise ValidationFailed(errores)

    antes = {c: getattr(protocolo, c) for c in cambios}
    for campo, valor in cambios.items():
        setattr(protocolo, campo, valor)
    if despues_items:
        protocolo.items = items
    _aplicar_totales(protocolo)
    db.flush()

    auditoria.registrar_cambios(
        db, modulo=modulo, hce_id=protocolo.hce_id, antes=antes, despues=cambios, usuario_id=usuario_id,
    )
    auditoria.registrar_cambios(
        db, modulo=modulo, hce_id=protocolo.hce_id, antes=antes_items, despues=despues_items, usuario_id=usuario_id,
    )
    return protocolo


def _errores_de_firma(db: Session, protocolo: Protocolo) -> list[tuple[str | None, str]]:
    """Todo lo que impide firmar (Documento Técnico §4.3, fila HCE-PA / HCE-PB), junto."""
    errores: list[tuple[str | None, str]] = []
    for clave in PROTOCOLO_ITEMS:
        valor = _valor_de(protocolo.items, clave)
        if valor is None:
            errores.append((f"items.{clave}", "Falta puntuar el ítem"))
        elif valor in PROTOCOLO_VALORES_CON_OBS and normalizar_texto(_obs_de(protocolo.items, clave)) is None:
            errores.append((f"items.{clave}.obs", f"Un ítem puntuado {valor} exige fundamentación (observación)"))
    if protocolo.fecha is None:
        errores.append(("fecha", "Es obligatoria para firmar"))
    if normalizar_texto(protocolo.sint_tec1) is None:
        errores.append(("sint_tec1", "La síntesis del técnico 1 es obligatoria para firmar"))
    if normalizar_texto(protocolo.sint_tec2) is None:
        errores.append(("sint_tec2", "La síntesis del técnico 2 es obligatoria para firmar"))

    t1, t2 = protocolo.evaluador_t1_id, protocolo.evaluador_t2_id
    for campo, profesional_id in (("evaluador_t1_id", t1), ("evaluador_t2_id", t2)):
        if profesional_id is None:
            errores.append((campo, "Falta el evaluador: firman los dos técnicos"))
        else:
            profesional = db.get(Profesional, profesional_id)
            if profesional is None or not profesional.activo:
                errores.append((campo, "El evaluador tiene que ser un profesional activo"))
    if t1 is not None and t1 == t2:
        errores.append(("evaluador_t2_id", "Tiene que ser distinto del evaluador 1"))
    return errores


def firmar_protocolo(
    db: Session, protocolo_id: int, *, usuario_id: int | None = None,
) -> tuple[Protocolo, list[dict[str, Any]]]:
    """Firma el protocolo (**un solo acto**, §5.117 b) y devuelve `(protocolo, avisos)`.

    409 si ya está firmado · 422 con todo lo que falta. Congela los totales y, si es un **B**,
    escribe `deltas` = B − A cuando el A del mismo año está firmado (si no, `NULL`; el aviso
    `fuera_de_secuencia` lo explica) y la fila `alerta` si alguna escala cae en un tramo con
    alerta. Todo en la transacción del request.
    """
    protocolo = _obtener_para_escribir(db, protocolo_id)
    modulo = modulo_de(protocolo.tipo)
    firma.exigir_no_firmado(protocolo, modulo)
    errores = _errores_de_firma(db, protocolo)
    if errores:
        raise ValidationFailed(errores)

    def congelar() -> None:
        _aplicar_totales(protocolo)
        if protocolo.tipo == "B":
            pa = protocolo_de(db, protocolo.hce_id, "A", protocolo.anio)
            protocolo.deltas = delta.calcular_delta(pa, protocolo) if pa is not None and pa.firmado else None

    avisos = firma.firmar_modulo(
        db, protocolo, codigo=modulo, hce_id=protocolo.hce_id, anio=protocolo.anio,
        firmantes=[db.get(Profesional, protocolo.evaluador_t1_id), db.get(Profesional, protocolo.evaluador_t2_id)],
        congelar=congelar, usuario_id=usuario_id,
    )
    alertas = delta.alertas_del_protocolo(db, protocolo.deltas)
    if alertas:
        auditoria.registrar_evento(
            db, modulo=modulo, hce_id=protocolo.hce_id, tipo=AUDITORIA_TIPO_ALERTA, usuario_id=usuario_id,
            detalle=f"Alerta institucional del Δ ({protocolo.anio}): " + " · ".join(
                f"{a['escala']} Δ {a['delta']:+d} ({a['etiqueta']})" for a in alertas
            ),
        )
    return protocolo, avisos


def agregar_addenda(
    db: Session, protocolo_id: int, *, texto: str | None, profesional_id: int | None,
    usuario_id: int | None = None,
) -> Protocolo:
    """Addenda sobre un protocolo firmado (ver `firma.agregar_addenda`): 409 si no está firmado."""
    protocolo = _obtener_para_escribir(db, protocolo_id)
    firma.agregar_addenda(
        db, protocolo, codigo=modulo_de(protocolo.tipo), hce_id=protocolo.hce_id,
        texto=texto, profesional_id=profesional_id, usuario_id=usuario_id,
    )
    return protocolo
