"""HCE-VF · valoración funcional (BUND / CIF): alta, lectura y edición. M11.3-d1.

Una por expediente (PK `hce_id`). **IPPU registra, no certifica** (Documento Técnico §7.1):
el módulo guarda lo que dictaminó el organismo —estado, fecha, organismo, porcentaje,
vigencia, RNPcD— más el perfil funcional en clave CIF (§7.3).

## Reglas que fija este módulo

- **Salvaguarda §7.5 (regla dura):** `categoria_id` la escribe **únicamente**
  `categoria_baremo(pct)`, con los cortes leídos de `baremo_categoria` (nunca escritos acá).
  Ningún camino acepta ni lee puntajes del IDEA, del protocolo ni `severidad_dsm`: este
  módulo **no importa** esos modelos ni sus servicios (lo verifica un test), y la entrada
  rechaza cualquier campo que no sea de la VF (`extra="forbid"` en el schema), así que
  mandar `categoria_id` o un puntaje es 422.
- **`pct` NULL es un estado válido** (§7.1: en menores de 2 años no aplica el BUND):
  `categoria_baremo(None)` → sin categoría, y la vista dice «No corresponde». `pct` 0 es
  otra cosa: la categoría de 0–4 %.
- **Cortes enteros, `pct` con decimales:** el baremo trae rangos enteros (0–4, 5–24, …) y
  `pct` es `NUMERIC(5,2)`. Un porcentaje cae en el tramo de **su parte entera**
  (`pct_min ≤ pct < pct_max + 1`): 4,5 % es «0 % a 4 %». Si el catálogo no cubre el valor
  (cortes mal cargados) es 422 sobre `pct`, nunca una categoría por defecto.
- **Alerta de vigencia** (§7.8): a 90 y 30 días de `vigencia`, y vencida. **Se calcula al
  leer**, no se guarda.
- **Auditoría:** el alta es una fila `carga`; cada PATCH, una fila `edicion` por campo que
  cambió (de `dominios`, una por dominio: `dominios.comunicacion`), incluida
  `categoria_id` cuando el `pct` nuevo la mueve.
- **Sin autogeneración** (§7.4): ver la decisión de M11.3-d1 en `handoff.md` §5.118 — las
  Especificaciones sancionan el mapeo de escalas a dominios pero no sus cortes.
"""
from collections.abc import Mapping
from datetime import date
from decimal import Decimal
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.constantes import MODULO_HCE_VF, VF_ALERTA_DIAS, VF_CATEGORIA_NO_CORRESPONDE, VF_DOMINIOS, VF_NIVELES
from app.models.catalogos import BaremoCategoria
from app.models.transversales import ValoracionFuncional
from app.services import auditoria, fechas
from app.services.errores import ConflictError, NotFound, ValidationFailed
from app.services.hce import obtener_hce
from app.services.texto import normalizar_opcionales

CAMPOS_TEXTO = ("estado", "organismo", "rnpcd", "capacidades", "barreras", "apoyos", "obs", "sintesis_funcional")
CAMPOS_ESCALARES = (*CAMPOS_TEXTO, "fecha", "pct", "vigencia")
DOMINIOS: tuple[str, ...] = tuple(clave for clave, _, _ in VF_DOMINIOS)
NIVELES: tuple[str, ...] = tuple(n for n in VF_NIVELES if n)


# ── Baremo ───────────────────────────────────────────────────────────────────
def categoria_baremo(db: Session, pct: Decimal | int | None) -> BaremoCategoria | None:
    """La categoría del baremo para `pct`, **la única derivación** de `categoria_id` (§7.5).

    `None` → `None` («No corresponde»). Si ninguna fila del catálogo cubre el valor, 422.
    """
    if pct is None:
        return None
    valor = Decimal(pct)
    fila = db.scalars(
        select(BaremoCategoria)
        .where(BaremoCategoria.pct_min <= valor, valor < BaremoCategoria.pct_max + 1)
        .order_by(BaremoCategoria.orden, BaremoCategoria.id)
    ).first()
    if fila is None:
        raise ValidationFailed([("pct", f"El baremo configurado no tiene una categoría para {valor} %")])
    return fila


# ── Lectura ──────────────────────────────────────────────────────────────────
def obtener_vf(db: Session, hce_id: int, *, para_escribir: bool = False) -> ValoracionFuncional:
    obtener_hce(db, hce_id)
    vf = db.get(ValoracionFuncional, hce_id, with_for_update=True if para_escribir else None)
    if vf is None:
        raise NotFound(f"El expediente {hce_id} no tiene valoración funcional registrada")
    return vf


def alerta_vigencia(vigencia: date | None, hoy: date | None = None) -> dict[str, Any] | None:
    """`{nivel, dias, mensaje}` o `None`: vencida (`dias` < 0), ≤ 30 días o ≤ 90 días (§7.8)."""
    if vigencia is None:
        return None
    dias = (vigencia - (hoy or fechas.hoy())).days
    if dias < 0:
        return {"nivel": "vencida", "dias": dias, "mensaje": f"La valoración oficial venció hace {-dias} días"}
    for umbral in sorted(VF_ALERTA_DIAS):
        if dias <= umbral:
            return {
                "nivel": f"{umbral}_dias", "dias": dias,
                "mensaje": f"La valoración oficial vence en {dias} días: revisar o renovar",
            }
    return None


def vista(vf: ValoracionFuncional) -> dict[str, Any]:
    categoria = vf.categoria
    return {
        "hce_id": vf.hce_id,
        **{c: getattr(vf, c) for c in CAMPOS_ESCALARES},
        "dominios": vf.dominios or {},
        "categoria": (
            {"id": categoria.id, "categoria": categoria.categoria, "rango": categoria.rango,
             "implicancia": categoria.implicancia}
            if categoria is not None else None
        ),
        "categoria_etiqueta": categoria.categoria if categoria is not None else (
            VF_CATEGORIA_NO_CORRESPONDE if vf.pct is None else None
        ),
        "alerta_vigencia": alerta_vigencia(vf.vigencia),
    }


# ── Validación ───────────────────────────────────────────────────────────────
def _preparar(datos: Mapping[str, Any], errores: list[tuple[str | None, str]]) -> dict[str, Any]:
    d = normalizar_opcionales({c: datos[c] for c in CAMPOS_ESCALARES if c in datos}, CAMPOS_TEXTO)
    pct = d.get("pct")
    if pct is not None and not Decimal(0) <= Decimal(pct) <= Decimal(100):
        errores.append(("pct", "Tiene que estar entre 0 y 100"))
    return d


def _exigir_vigencia_posterior(fecha: date | None, vigencia: date | None, errores: list[tuple[str | None, str]]) -> None:
    if fecha is not None and vigencia is not None and vigencia < fecha:
        errores.append(("vigencia", "No puede ser anterior a la fecha de la valoración"))


def _fusionar_dominios(
    actuales: Mapping[str, str] | None, entrada: Mapping[str, Any] | None, errores: list[tuple[str | None, str]],
) -> tuple[dict[str, str], dict[str, Any], dict[str, Any]]:
    """Fusiona dominio por dominio. `""` o `null` borra el nivel de ese dominio.
    Devuelve `(nuevo, antes, despues)` con sólo los dominios que vinieron (para auditar)."""
    nuevo = dict(actuales or {})
    antes: dict[str, Any] = {}
    despues: dict[str, Any] = {}
    for clave, nivel in (entrada or {}).items():
        if clave not in DOMINIOS:
            errores.append((f"dominios.{clave}", f"Dominio desconocido: uno de {', '.join(DOMINIOS)}"))
            continue
        if nivel in (None, ""):
            nivel = None
        elif nivel not in NIVELES:
            errores.append((f"dominios.{clave}", f"Nivel inválido: uno de {', '.join(NIVELES)}"))
            continue
        antes[f"dominios.{clave}"] = nuevo.get(clave)
        despues[f"dominios.{clave}"] = nivel
        if nivel is None:
            nuevo.pop(clave, None)
        else:
            nuevo[clave] = nivel
    return nuevo, antes, despues


# ── Escritura ────────────────────────────────────────────────────────────────
def crear_vf(
    db: Session, hce_id: int, datos: Mapping[str, Any], *, usuario_id: int | None = None,
) -> ValoracionFuncional:
    """Alta (una por expediente: la segunda es 409). Deriva `categoria_id` de `pct`. Fila `carga`."""
    obtener_hce(db, hce_id)
    if db.get(ValoracionFuncional, hce_id) is not None:
        raise ConflictError(
            f"El expediente {hce_id} ya tiene valoración funcional: se edita con PATCH",
            [(None, "Ya existe la valoración funcional del expediente")],
        )
    errores: list[tuple[str | None, str]] = []
    escalares = _preparar(datos, errores)
    _exigir_vigencia_posterior(escalares.get("fecha"), escalares.get("vigencia"), errores)
    dominios, _, _ = _fusionar_dominios(None, datos.get("dominios"), errores)
    if errores:
        raise ValidationFailed(errores)
    categoria = categoria_baremo(db, escalares.get("pct"))
    vf = ValoracionFuncional(
        hce_id=hce_id, **escalares, dominios=dominios or None,
        categoria_id=categoria.id if categoria is not None else None,
    )
    db.add(vf)
    db.flush()
    auditoria.registrar_carga(
        db, modulo=MODULO_HCE_VF, hce_id=hce_id, usuario_id=usuario_id,
        detalle=f"Alta de {MODULO_HCE_VF} del expediente {hce_id}",
    )
    db.refresh(vf)
    return vf


def actualizar_vf(
    db: Session, hce_id: int, datos: Mapping[str, Any], *, usuario_id: int | None = None,
) -> ValoracionFuncional:
    """Edición parcial. Si cambia `pct`, re-deriva `categoria_id`. Audita por campo y por dominio."""
    vf = obtener_vf(db, hce_id, para_escribir=True)
    errores: list[tuple[str | None, str]] = []
    cambios = _preparar(datos, errores)
    if "fecha" in cambios or "vigencia" in cambios:  # la regla mira el par completo
        _exigir_vigencia_posterior(cambios.get("fecha", vf.fecha), cambios.get("vigencia", vf.vigencia), errores)
    dominios, antes_dom, despues_dom = _fusionar_dominios(vf.dominios, datos.get("dominios"), errores)
    if errores:
        raise ValidationFailed(errores)
    if "pct" in cambios:
        categoria = categoria_baremo(db, cambios["pct"])
        cambios["categoria_id"] = categoria.id if categoria is not None else None

    antes = {c: getattr(vf, c) for c in cambios}
    for campo, valor in cambios.items():
        setattr(vf, campo, valor)
    if despues_dom:
        vf.dominios = dominios or None
    db.flush()
    auditoria.registrar_cambios(
        db, modulo=MODULO_HCE_VF, hce_id=hce_id, antes=antes, despues=cambios, usuario_id=usuario_id,
    )
    auditoria.registrar_cambios(
        db, modulo=MODULO_HCE_VF, hce_id=hce_id, antes=antes_dom, despues=despues_dom, usuario_id=usuario_id,
    )
    db.refresh(vf)
    return vf
