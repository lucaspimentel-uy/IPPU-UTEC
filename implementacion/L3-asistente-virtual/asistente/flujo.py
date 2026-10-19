"""Flujo de una consulta: límites (asistente/limites.py) → recuperación (asistente/indice.py) → salida.

Sin generación: la salida es un mensaje fijo o la lista de citas (documento, sección). Nunca completa con
conocimiento general. LIM-5: si ningún fragmento supera el umbral, mensaje B.
Lo que ve la persona lo arma sólo `texto_para_mostrar()` (§5.147 b); el pie de crisis va en todo rechazo, derivación
y B (§5.146 b).
Capa 2 (F1-d0, §5.148): un clasificador local, opcional, que corre después de las reglas y sólo agrega rechazos.
"""
from dataclasses import dataclass, field, replace

from asistente import mensajes
from asistente.capa2 import Clasificacion, Clasificador, caida
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

CAPA2 = "capa2"  # en `lims`: el rechazo lo agregó la capa 2


@dataclass(frozen=True)
class Salida:
    tipo: str
    mensaje: str | None
    citas: tuple[tuple[str, str], ...]
    lims: tuple[str, ...]
    avisos: tuple[str, ...] = field(default=())
    consulta_enmascarada: str = ""
    pie: str | None = None
    capa2_caida: bool = False  # marca interna: la capa 2 no respondió; no se le muestra a la persona


def responder(consulta: str, indice: Indice, umbral: float = UMBRAL_DEFECTO, k: int = 3,
              clasificador: Clasificador | None = None) -> Salida:
    """Las reglas deciden primero, como siempre; `clasificador` (capa 2) sólo ve la consulta ya enmascarada y sólo
    puede agregar rechazos. Sin clasificador, la salida es la de las reglas solas."""
    salida = _por_reglas(consulta, indice, umbral, k)
    if clasificador is None or salida.tipo == CRISIS:  # C ya es el rechazo más fuerte: no se espera al modelo
        return salida
    return _con_capa2(salida, _clasificar(clasificador, salida.consulta_enmascarada))


def _clasificar(clasificador: Clasificador, consulta_enmascarada: str) -> Clasificacion:
    try:
        return clasificador.clasificar(consulta_enmascarada)
    except Exception as e:  # la capa nunca tumba el flujo: quedan las reglas solas
        return caida(f"excepción ({type(e).__name__})")


def _con_capa2(salida: Salida, c: Clasificacion) -> Salida:
    """Crisis → C desde cualquier salida; pedido clínico → A sólo desde una respuesta con cita; nunca al revés.
    Caída → la salida de las reglas, con la marca interna (§5.148 a y d)."""
    if not c.disponible:
        return replace(salida, capa2_caida=True)
    if c.crisis:  # como la C de las reglas: sin citas, sin avisos delante del contacto y sin pie
        return Salida(CRISIS, mensajes.C, (), salida.lims + ("LIM-7", CAPA2),
                      consulta_enmascarada=salida.consulta_enmascarada)
    if c.pedido_clinico and salida.tipo == RESPONDE_CON_CITA:
        return Salida(RECHAZO, mensajes.A, (), salida.lims + (CAPA2,), salida.avisos, salida.consulta_enmascarada,
                      mensajes.PIE_CRISIS)
    return salida


def _por_reglas(consulta: str, indice: Indice, umbral: float, k: int) -> Salida:
    d = evaluar(consulta)
    base = dict(lims=d.disparados, avisos=d.avisos, consulta_enmascarada=d.consulta_enmascarada)
    con_pie = dict(base, pie=mensajes.PIE_CRISIS)

    if d.accion == ESCALAR_HUMANO:
        return Salida(CRISIS, d.mensaje, (), **base)
    if d.accion == RECHAZAR:
        tipo = SIN_RESPALDO if d.mensaje == mensajes.B else RECHAZO
        return Salida(tipo, d.mensaje, (), **con_pie)

    resultados = indice.buscar(d.consulta_enmascarada, k=k, umbral=umbral)
    citas = tuple((r.documento, r.seccion) for r in resultados)

    if d.accion == CITAR_Y_DERIVAR:
        return Salida(DERIVACION, d.mensaje, citas, **con_pie)
    if not citas:
        return Salida(SIN_RESPALDO, mensajes.B, (), **dict(con_pie, lims=d.disparados + ("LIM-5",)))
    return Salida(RESPONDE_CON_CITA, d.mensaje, citas, **base)


def texto_para_mostrar(salida: Salida) -> str:
    """La ÚNICA función que arma lo que ve la persona (§5.147 b); nada más del asistente arma texto para mostrar.

    Orden: avisos (LIM-6 y LIM-9) → mensaje → citas (documento y sección, nunca el texto del fragmento) → pie de crisis,
    si la salida lo trae. LIM-11 (`respuesta.formatear_contradiccion`) todavía no está conectado al flujo. `capa2_caida`
    no se muestra.
    """
    lineas = [aviso for aviso in salida.avisos if aviso != salida.mensaje]
    if salida.mensaje:
        lineas.append(salida.mensaje)
    if salida.citas:
        lineas.append("Fuentes:")
        lineas.extend(f"- {documento}, «{seccion}»" for documento, seccion in salida.citas)
    if salida.pie:
        lineas.append(salida.pie)
    return "\n".join(lineas)
