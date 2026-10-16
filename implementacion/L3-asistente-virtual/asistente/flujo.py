"""Flujo de una consulta: límites (asistente/limites.py) → recuperación (asistente/indice.py) → salida.

Sin generación: la salida es un mensaje fijo o la lista de citas (documento, sección). Nunca completa con
conocimiento general. LIM-5: si ningún fragmento supera el umbral, mensaje B.
"""
from dataclasses import dataclass, field

from asistente import mensajes
from asistente.indice import Indice
from asistente.limites import CITAR_Y_DERIVAR, ESCALAR_HUMANO, RECHAZAR, evaluar

# [supuesto], a confirmar por Samuel. Elegido con el barrido de `python -m asistente.evaluar_banco --barrido`
# sobre eval/banco-v0.md: el valor que maximiza B en la categoría 2 con rechazo indebido ≤ 10 % en la 1
# (empate → mejor precisión de cita → el umbral más bajo). Con banco-v0 la categoría 2 tiene un solo caso y
# ningún umbral lo lleva a B, así que 0.0 sólo manda a B las consultas sin ninguna palabra en común.
UMBRAL_DEFECTO = 0.0

CRISIS = "crisis"
RECHAZO = "rechazo"
DERIVACION = "derivacion"
SIN_RESPALDO = "sin_respaldo"
RESPONDE_CON_CITA = "responde_con_cita"


@dataclass(frozen=True)
class Salida:
    tipo: str
    mensaje: str | None
    citas: tuple[tuple[str, str], ...]
    lims: tuple[str, ...]
    avisos: tuple[str, ...] = field(default=())
    consulta_enmascarada: str = ""


def responder(consulta: str, indice: Indice, umbral: float = UMBRAL_DEFECTO, k: int = 3) -> Salida:
    d = evaluar(consulta)
    base = dict(lims=d.disparados, avisos=d.avisos, consulta_enmascarada=d.consulta_enmascarada)

    if d.accion == ESCALAR_HUMANO:
        return Salida(CRISIS, d.mensaje, (), **base)
    if d.accion == RECHAZAR:
        tipo = SIN_RESPALDO if d.mensaje == mensajes.B else RECHAZO
        return Salida(tipo, d.mensaje, (), **base)

    resultados = indice.buscar(d.consulta_enmascarada, k=k, umbral=umbral)
    citas = tuple((r.documento, r.seccion) for r in resultados)

    if d.accion == CITAR_Y_DERIVAR:
        return Salida(DERIVACION, d.mensaje, citas, **base)
    if not citas:
        return Salida(SIN_RESPALDO, mensajes.B, (), lims=d.disparados + ("LIM-5",), avisos=d.avisos,
                      consulta_enmascarada=d.consulta_enmascarada)
    return Salida(RESPONDE_CON_CITA, d.mensaje, citas, **base)
