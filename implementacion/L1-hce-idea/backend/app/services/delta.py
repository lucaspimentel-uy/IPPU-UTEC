"""Δ entre dos aplicaciones del **mismo** instrumento, su interpretación y la alerta. M11.3-c.

## Reglas (§5.36 · §5.105 · §5.117 c–d · Documento Técnico §5.2)

- **Δ sólo dentro del mismo instrumento.** `calcular_delta(a, b)` acepta dos `Protocolo`
  (A y B del mismo expediente y año) o dos `Idea` (del mismo expediente, `a` de un año
  anterior a `b`). Mezclar tipos es `InstrumentosNoHomologables`, que **es** un `TypeError`
  (error de programación) y **también** un `ValidationFailed` (si alguna vez llegara a la
  API, sale como 422 y no como 500). El IDEA mide severidad (menor = mejor) y la IPPU-TEA
  progreso (mayor = mejor): restarlos no significa nada (regla dura de no homologabilidad).
- El Δ se calcula **sobre los totales materializados** (`total` y las 4 escalas), que en un
  módulo firmado están congelados: es `b − a`, clave por clave, y `None` si a alguno le falta.
- **Interpretación y alerta sólo desde `delta_interpretacion`** (D4/M12.1): ningún corte en
  el código. El catálogo es el `deltaInterpreta` del Prototipo v4, que interpreta el **Δ
  B − A de la IPPU-TEA**; por eso **sólo se aplica al protocolo** y nunca al Δ interanual
  del IDEA (dirección opuesta, sin tramos documentados). **La alerta es por escala**
  (Documento Técnico §5.2: «Δ ≤ −7 **en una escala** dispara alerta institucional»; la demo
  hace lo mismo): el Δ del total se interpreta pero no alerta.
"""
from collections.abc import Mapping, Sequence
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.constantes import IDEA_ESCALAS, PROTOCOLO_ESCALAS
from app.models.catalogos import DeltaInterpretacion
from app.models.modulos import Idea, Protocolo
from app.services.errores import ValidationFailed

#: Claves de un Δ, por instrumento: los nombres de sus columnas de totales.
CLAVES_DELTA: dict[type, tuple[str, ...]] = {
    Protocolo: ("total", *PROTOCOLO_ESCALAS),
    Idea: ("total", *(f"esc_{letra.lower()}" for letra in IDEA_ESCALAS)),
}


class InstrumentosNoHomologables(ValidationFailed, TypeError):
    """Se intentó restar dos instrumentos distintos (o algo que no es un instrumento)."""

    def __init__(self, a: Any, b: Any):
        super().__init__([(None, (
            f"Δ sólo dentro del mismo instrumento: no se resta {type(b).__name__} − {type(a).__name__}"
        ))])


def calcular_delta(a: Protocolo | Idea, b: Protocolo | Idea) -> dict[str, int | None]:
    """`b − a` sobre `total` y las escalas, para **dos instancias del mismo modelo**.

    - Tipos distintos (o que no sean `Protocolo`/`Idea`) → `InstrumentosNoHomologables`
      (`TypeError`).
    - Mismo tipo pero mal emparejados → `ValueError`: protocolos que no son A y B del mismo
      expediente y año; IDEA de otro expediente o con `a` que no es de un año anterior a `b`.
    """
    if type(a) is not type(b) or type(a) not in CLAVES_DELTA:
        raise InstrumentosNoHomologables(a, b)
    if a.hce_id != b.hce_id:
        raise ValueError("El Δ compara dos aplicaciones del mismo expediente")
    if isinstance(a, Protocolo):
        if (a.tipo, b.tipo) != ("A", "B") or a.anio != b.anio:
            raise ValueError("El Δ del protocolo es B − A del mismo año")
    elif not a.anio < b.anio:
        raise ValueError("El Δ del IDEA es el de un año menos el de un año anterior")
    return {
        clave: (getattr(b, clave) - getattr(a, clave))
        if getattr(a, clave) is not None and getattr(b, clave) is not None else None
        for clave in CLAVES_DELTA[type(a)]
    }


def tramos(db: Session) -> list[DeltaInterpretacion]:
    """El catálogo `delta_interpretacion` entero, por `orden` e `id`: **una** consulta. Quien lee muchos Δ
    a la vez (el panel institucional, C7) lo trae una vez y usa `tramo_en`; la regla es la misma."""
    return list(db.scalars(select(DeltaInterpretacion).order_by(DeltaInterpretacion.orden, DeltaInterpretacion.id)))


def tramo_en(catalogo: Sequence[DeltaInterpretacion], valor: int) -> DeltaInterpretacion | None:
    """La fila de `catalogo` (ya ordenado por `orden`, `id`) que cubre `valor` (límites `NULL` = abiertos).
    Si dos tramos se superponen gana el de menor `orden`; `None` si ninguno lo cubre."""
    for tramo in catalogo:
        if (tramo.delta_min is None or tramo.delta_min <= valor) and (tramo.delta_max is None or valor <= tramo.delta_max):
            return tramo
    return None


def interpretar(db: Session, deltas: Mapping[str, int | None] | None) -> dict[str, Any] | None:
    """`{clave: {etiqueta, accion, signo} | None}` para cada clave de `deltas`, **derivado ahora**
    del catálogo (mover un tramo cambia la lectura, también de un PB firmado). `None` sin Δ."""
    if deltas is None:
        return None
    catalogo = tramos(db)
    salida: dict[str, Any] = {}
    for clave, valor in deltas.items():
        tramo = tramo_en(catalogo, valor) if valor is not None else None
        salida[clave] = (
            {"etiqueta": tramo.etiqueta, "accion": tramo.accion, "signo": tramo.signo}
            if tramo is not None else None
        )
    return salida


def alertas_del_protocolo(db: Session, deltas: Mapping[str, int | None] | None) -> list[dict[str, Any]]:
    """Las **escalas** del Δ B − A cuyo valor cae en un tramo con `alerta=True`.

    `[{escala, delta, etiqueta}]`, en el orden de las escalas; `[]` sin Δ o sin alerta. El
    `total` no alerta (Documento Técnico §5.2: la alerta es «en una escala»).
    """
    if not deltas:
        return []
    return alertas_con_catalogo(tramos(db), deltas)


def alertas_con_catalogo(
    catalogo: Sequence[DeltaInterpretacion], deltas: Mapping[str, int | None] | None,
) -> list[dict[str, Any]]:
    """`alertas_del_protocolo` con el catálogo ya leído (`tramos`): misma regla, sin consultas."""
    if not deltas:
        return []
    alertas = []
    for escala in PROTOCOLO_ESCALAS:
        valor = deltas.get(escala)
        if valor is None:
            continue
        tramo = tramo_en(catalogo, valor)
        if tramo is not None and tramo.alerta:
            alertas.append({"escala": escala, "delta": valor, "etiqueta": tramo.etiqueta})
    return alertas
