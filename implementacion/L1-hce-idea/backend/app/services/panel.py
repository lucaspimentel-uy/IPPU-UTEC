"""Panel institucional: agregados de la HCE calculados por el servidor — C7 (§5.159).

`GET /panel?anio=` (por omisión, el año en curso). **Nada de esto se guarda**: se deriva al leer, como el flujo
(`services/flujo.py`), y el navegador sólo lo pinta (esquema §5 ítem 7; «el navegador no calcula valores que se
persisten», §5.122).

## Reglas que fija este módulo

- **Alcance** (decisión a; la matriz desde A1): coordinación ve la institución entera; un `tecnico`, los expedientes de
  sus grupos (§5.101, la misma condición que `GET /hce`); **dirección no técnica**, la institución con las medias del
  protocolo suprimidas si `n_ciclo_ab` < `UMBRAL_CELDA_CHICA` (`suprimido: true`, F4-7); administrativo, 403. Sólo
  **expedientes activos**. La respuesta dice cuál (`alcance`) y el `n`.
- **El IDEA es anual** (§5.96, §5.97): la **cobertura de LB** es el IDEA **firmado de `anio`**; la **distribución por
  banda** es la del IDEA **vigente** (el firmado de mayor `anio`, `idea.idea_vigente`), así que no cambia con `anio`.
  La banda sale sólo de `banda_idea` (`idea.banda_en`, D4): una fila por banda del catálogo, en su orden, con ceros.
- **Δ sólo dentro del mismo instrumento** (§5.36, §5.105, `delta.py`): las medias del protocolo son de PA, de PB y de
  los `deltas` B − A **guardados** en el PB firmado, por escala de la IPPU-TEA; ningún valor del IDEA entra ahí. La
  media del Δ **no se interpreta**: el catálogo lee el Δ entero de un NNA; rotular una media redondeada inventaría una
  lectura (decisión b).
- **La alerta es por escala** (Documento Técnico §5.2, `delta.alertas_con_catalogo`), nunca sobre el total; el panel
  cuenta NNA, sin nombres.
- **Ciclo completo** = CI registrado y LB, PA, PB, IC de `anio` firmados. **Pendientes del flujo** = la regla de la
  vista Pendientes (§5.153 b): CI no registrado, y cada eslabón de `anio` que no está firmado.
- **Consultas fijas** (sin importar cuántos expedientes): los ids del alcance, el CI (`flujo.estados_ci`), los cuatro
  eslabones del año (`flujo.estados_de_flujo`, tres), los IDEA firmados, los protocolos firmados del año y los dos
  catálogos. Con el alcance vacío, los del flujo y el CI no consultan (devuelven vacío).
"""
from collections.abc import Iterable
from decimal import ROUND_HALF_UP, Decimal
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.constantes import (
    CADENA_FLUJO, CI_REGISTRADO, ESTADO_FIRMADO, MODULO_HCE_IC, MODULO_HCE_LB, MODULO_HCE_PA, MODULO_HCE_PB,
    PROTOCOLO_ESCALAS, UMBRAL_CELDA_CHICA,
)
from app.models.identidad import Grupo, HceDiurna, Profesional
from app.models.modulos import Idea, Protocolo
from app.services import delta, fechas, flujo, matriz
from app.services import idea as servicio_idea
from app.services.errores import ValidationFailed

ALCANCE_INSTITUCION = "institucion"
ALCANCE_MIS_GRUPOS = "mis_grupos"
ANIO_MIN, ANIO_MAX = 2, 32767

#: Clave de `pendientes_flujo` → eslabón de la cadena (la de los filtros de Pendientes, §5.153 b).
CLAVES_FLUJO: dict[str, str] = {
    "lb": MODULO_HCE_LB, "pa": MODULO_HCE_PA, "pb": MODULO_HCE_PB, "ic": MODULO_HCE_IC,
}


def _redondeo(valor: Decimal, lugares: str) -> float:
    """Redondeo **mitad hacia arriba** (no el bancario de `round`): 60,25 → 60,3; el mismo para todo el panel."""
    return float(valor.quantize(Decimal(lugares), rounding=ROUND_HALF_UP))


def _media(valores: Iterable[int | None]) -> float | None:
    """Media con un decimal de los valores no nulos; `None` si no hay ninguno."""
    numeros = [v for v in valores if v is not None]
    if not numeros:
        return None
    return _redondeo(Decimal(sum(numeros)) / Decimal(len(numeros)), "0.1")


def _proporcion(cantidad: int, de: int) -> dict[str, Any]:
    """`{cantidad, de, porcentaje}`: el porcentaje entero (mitad hacia arriba), `None` si `de` es 0."""
    porcentaje = None if de == 0 else int(_redondeo(Decimal(cantidad * 100) / Decimal(de), "1"))
    return {"cantidad": cantidad, "de": de, "porcentaje": porcentaje}


def _ids_activos(db: Session, usuario: Profesional) -> list[int]:
    """Los expedientes **activos** que el usuario ve (§5.101): todos para el admin, los de sus grupos para un técnico."""
    consulta = select(HceDiurna.id).outerjoin(Grupo, HceDiurna.grupo_id == Grupo.id).where(HceDiurna.activo.is_(True))
    if (alcance := matriz.condicion_de_alcance(usuario, "panel")) is not None:
        consulta = consulta.where(alcance)
    return list(db.scalars(consulta.order_by(HceDiurna.id)))


def calcular(db: Session, usuario: Profesional, anio: int | None = None) -> dict[str, Any]:
    """Los agregados del panel para `anio` (por omisión, el en curso), sobre el alcance de `usuario`. 422 si el año
    no está entre 2 y 32767. Ver el docstring del módulo."""
    anio = anio if anio is not None else fechas.anio_actual()
    if not ANIO_MIN <= anio <= ANIO_MAX:
        raise ValidationFailed([("anio", f"Debe estar entre {ANIO_MIN} y {ANIO_MAX}")])

    ids = _ids_activos(db, usuario)
    n = len(ids)
    ci = flujo.estados_ci(db, ids)
    estados = {
        hce_id: {m["modulo"]: m["estado"] for m in modulos}
        for hce_id, modulos in flujo.estados_de_flujo(db, ids, anio).items()
    }

    # IDEA firmados de todos los años: el de `anio` da la cobertura; el de mayor año (el vigente, §5.97), la banda.
    vigente: dict[int, int | None] = {}
    for hce_id, total in db.execute(
        select(Idea.hce_id, Idea.total)
        .where(Idea.hce_id.in_(ids), Idea.firmado.is_(True))
        .order_by(Idea.hce_id, Idea.anio.desc())
    ):
        vigente.setdefault(hce_id, total)
    catalogo_bandas = servicio_idea.bandas(db)
    por_banda = {b.id: 0 for b in catalogo_bandas}
    for total in vigente.values():
        banda = servicio_idea.banda_en(catalogo_bandas, total)
        if banda is not None:
            por_banda[banda.id] += 1
    # Un IDEA firmado tiene total (12 dimensiones puntuadas); si un corte deja un total sin banda, no se lo esconde:
    # cuenta con los que no tienen banda. La suma de las filas + `sin_idea_firmado` + `fuera_de_catalogo` = n.
    fuera_de_catalogo = len(vigente) - sum(por_banda.values())

    # Protocolos firmados de `anio`: los valores guardados (totales congelados al firmar y el Δ del PB).
    pa: dict[int, Protocolo] = {}
    pb: dict[int, Protocolo] = {}
    for prot in db.scalars(
        select(Protocolo).where(Protocolo.hce_id.in_(ids), Protocolo.anio == anio, Protocolo.firmado.is_(True))
    ):
        (pa if prot.tipo == "A" else pb)[prot.hce_id] = prot
    ciclo_ab = [h for h in ids if h in pa and h in pb and pb[h].deltas]
    catalogo_tramos = delta.tramos(db)
    alertas_por_nna = {h: delta.alertas_con_catalogo(catalogo_tramos, pb[h].deltas) for h in ciclo_ab}

    def cadena_firmada(hce_id: int) -> bool:
        return all(estados[hce_id][m] == ESTADO_FIRMADO for m in CADENA_FLUJO)

    # F4-7: dirección no técnica ve la institución, pero una media de menos de `UMBRAL_CELDA_CHICA` NNA identifica (la de
    # uno es su puntaje, Protocolo §6.6): se suprimen las medias, no las cuentas.
    suprimido = matriz.es_agregado(usuario, "panel") and len(ciclo_ab) < UMBRAL_CELDA_CHICA

    def media(valores) -> float | None:
        return None if suprimido else _media(valores)

    return {
        "anio": anio,
        "alcance": ALCANCE_MIS_GRUPOS if matriz.exigir_rol(usuario, "panel") == "mis_grupos" else ALCANCE_INSTITUCION,
        "n_activos": n,
        "cobertura_lb": _proporcion(sum(1 for h in ids if estados[h][MODULO_HCE_LB] == ESTADO_FIRMADO), n),
        "ciclos_completos": _proporcion(sum(1 for h in ids if ci[h] == CI_REGISTRADO and cadena_firmada(h)), n),
        "bandas": {
            "filas": [
                {"perfil": b.perfil, "total_min": b.total_min, "total_max": b.total_max, "nivel_dsm": b.nivel_dsm,
                 "cantidad": por_banda[b.id]}
                for b in catalogo_bandas
            ],
            "sin_idea_firmado": n - len(vigente),
            "fuera_de_catalogo": fuera_de_catalogo,
        },
        "protocolo": {
            "n_ciclo_ab": len(ciclo_ab),
            "suprimido": suprimido,
            "escalas": [
                {
                    "escala": escala,
                    "media_pa": media(getattr(pa[h], escala) for h in ciclo_ab),
                    "media_pb": media(getattr(pb[h], escala) for h in ciclo_ab),
                    "media_delta": media(pb[h].deltas.get(escala) for h in ciclo_ab),
                }
                for escala in PROTOCOLO_ESCALAS
            ],
        },
        "alertas": {
            "nna_con_alguna": sum(1 for a in alertas_por_nna.values() if a),
            "escalas": [
                {"escala": escala, "cantidad": sum(1 for a in alertas_por_nna.values() if any(x["escala"] == escala for x in a))}
                for escala in PROTOCOLO_ESCALAS
            ],
        },
        "pendientes_flujo": {
            "ci": sum(1 for h in ids if ci[h] != CI_REGISTRADO),
            **{clave: sum(1 for h in ids if estados[h][modulo] != ESTADO_FIRMADO) for clave, modulo in CLAVES_FLUJO.items()},
        },
    }
