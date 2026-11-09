"""Schema de `GET /panel` — el panel institucional (C7, §5.159). Reglas: `app/services/panel.py`.

GET plano, sin sobre (contrato de `app/routers/__init__.py`). Todo es un agregado: cantidades y medias, sin nombres.
"""
from typing import Literal

from pydantic import BaseModel, Field


class Proporcion(BaseModel):
    cantidad: int
    de: int = Field(description="`n_activos`.")
    porcentaje: int | None = Field(description="`cantidad / de` en %, entero, redondeado mitad hacia arriba; `null` si `de` es 0.")


class FilaBanda(BaseModel):
    perfil: str
    total_min: int
    total_max: int
    nivel_dsm: str = Field(description="Propiedad **de la banda** en el catálogo, orientativa; no es el nivel de apoyo de ningún NNA.")
    cantidad: int


class Bandas(BaseModel):
    filas: list[FilaBanda] = Field(description="Una por banda de `banda_idea`, en su orden, con ceros.")
    sin_idea_firmado: int = Field(description="NNA activos sin ningún IDEA firmado.")
    fuera_de_catalogo: int = Field(description="NNA cuyo IDEA vigente tiene un total que ningún tramo cubre (0 con el catálogo completo).")


class EscalaProtocolo(BaseModel):
    escala: str = Field(description="`esc_1` … `esc_4` (Escala IPPU-TEA).")
    media_pa: float | None
    media_pb: float | None
    media_delta: float | None = Field(description="Media de los `deltas` B − A guardados; **sin interpretación**.")


class Protocolo(BaseModel):
    n_ciclo_ab: int = Field(description="NNA activos con PA y PB del año firmados y `deltas` guardados.")
    suprimido: bool = Field(False, description=(
        "`true`: las medias van `null` porque `n_ciclo_ab` es menor que 5 y quien pregunta es dirección no técnica "
        "(F4-7: una media de pocos NNA identifica). Las cuentas no se suprimen."
    ))
    escalas: list[EscalaProtocolo]


class EscalaAlerta(BaseModel):
    escala: str
    cantidad: int = Field(description="NNA con el Δ de esa escala en un tramo con alerta.")


class Alertas(BaseModel):
    nna_con_alguna: int
    escalas: list[EscalaAlerta]


class PendientesFlujo(BaseModel):
    ci: int = Field(description="Consentimiento no registrado.")
    lb: int
    pa: int
    pb: int
    ic: int


class Panel(BaseModel):
    anio: int
    alcance: Literal["institucion", "mis_grupos"]
    n_activos: int
    cobertura_lb: Proporcion = Field(description="NNA con el IDEA **de `anio`** firmado.")
    ciclos_completos: Proporcion = Field(description="CI registrado y LB, PA, PB, IC de `anio` firmados.")
    bandas: Bandas = Field(description="Por el IDEA **vigente** (el firmado de mayor año, §5.97): no depende de `anio`.")
    protocolo: Protocolo
    alertas: Alertas
    pendientes_flujo: PendientesFlujo = Field(description="La regla de Pendientes (§5.153 b): lo no firmado de `anio`.")


EJEMPLO_PANEL = {
    "anio": 2026, "alcance": "mis_grupos", "n_activos": 7,
    "cobertura_lb": {"cantidad": 5, "de": 7, "porcentaje": 71},
    "ciclos_completos": {"cantidad": 1, "de": 7, "porcentaje": 14},
    "bandas": {"filas": [
        {"perfil": "Moderado", "total_min": 56, "total_max": 75, "nivel_dsm": "Nivel 2", "cantidad": 3},
    ], "sin_idea_firmado": 2, "fuera_de_catalogo": 0},
    "protocolo": {"n_ciclo_ab": 2, "escalas": [
        {"escala": "esc_1", "media_pa": 14.5, "media_pb": 18.0, "media_delta": 3.5},
    ]},
    "alertas": {"nna_con_alguna": 0, "escalas": [{"escala": "esc_1", "cantidad": 0}]},
    "pendientes_flujo": {"ci": 1, "lb": 2, "pa": 3, "pb": 5, "ic": 6},
}
