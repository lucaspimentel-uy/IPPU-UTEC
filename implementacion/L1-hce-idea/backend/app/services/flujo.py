"""Motor de flujo — estado derivado de los módulos y avisos de secuencia. M11.3-b.

## Qué es el flujo (§5.94 · §5.95 · §5.96)

- **La cadena es por año:** LB(año) → PA(año) → PB(año) → IC(año), **sin dependencia
  entre años** (LB-2027 no espera a IC-2026). El **CI** se hace una vez por HCE y **no
  es un eslabón**: ningún paso lo exige.
- **Nada del estado se almacena** (`modulos.py`, punto 1): `sin_iniciar | en_curso |
  firmado` y `pendiente | registrado` se derivan de las filas que existen, así que no
  hay una segunda fuente de verdad que se desfase.
- **La secuencia sólo AVISA.** Crear o firmar un módulo con eslabones anteriores sin
  firmar **se acepta**: la respuesta lleva un aviso `fuera_de_secuencia` en `warnings[]`
  y se escribe **una** fila `auditoria` `tipo='excepcion'`. **No existe un error de
  secuencia** (`app/services/errores.py`). La columna `FirmaMixin.excepcion` **no se
  usa**: el rastro es sólo `auditoria` (decisión e de §5.116).
- **La falta de CI no avisa ni deja fila:** es únicamente el estado «CI pendiente».

LB (IDEA) es el primer eslabón y nunca sale fuera de secuencia; desde M11.3-c la usan
tal cual PA, PB e IC (`services/protocolo.py`, `services/informe_cierre.py`), al crear y
al firmar.
"""
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.constantes import (
    AUDITORIA_TIPO_EXCEPCION, AVISO_FUERA_DE_SECUENCIA, CADENA_FLUJO, CI_PENDIENTE,
    CI_REGISTRADO, ESTADO_EN_CURSO, ESTADO_FIRMADO, ESTADO_SIN_INICIAR, MODULO_HCE_IC,
    MODULO_HCE_LB, MODULO_HCE_PA, MODULO_HCE_PB,
)
from app.models.modulos import Consentimiento, Idea, InformeCierre, Protocolo
from app.services import auditoria, fechas
from app.services.errores import ValidationFailed
from app.services.hce import obtener_hce


def _fila(db: Session, hce_id: int, anio: int, modulo: str):
    """La fila del eslabón `modulo` del `anio`, o `None` si todavía no existe."""
    if modulo == MODULO_HCE_LB:
        consulta = select(Idea).where(Idea.hce_id == hce_id, Idea.anio == anio)
    elif modulo in (MODULO_HCE_PA, MODULO_HCE_PB):
        tipo = "A" if modulo == MODULO_HCE_PA else "B"
        consulta = select(Protocolo).where(
            Protocolo.hce_id == hce_id, Protocolo.anio == anio, Protocolo.tipo == tipo
        )
    elif modulo == MODULO_HCE_IC:
        consulta = select(InformeCierre).where(
            InformeCierre.hce_id == hce_id, InformeCierre.anio == anio
        )
    else:
        raise ValueError(f"{modulo!r} no es un eslabón de la cadena: {CADENA_FLUJO}")
    return db.scalars(consulta).first()


def estado_modulo(db: Session, hce_id: int, anio: int, modulo: str) -> str:
    """`sin_iniciar` (no hay fila) · `en_curso` (hay fila sin firmar) · `firmado`. Derivado."""
    fila = _fila(db, hce_id, anio, modulo)
    if fila is None:
        return ESTADO_SIN_INICIAR
    return ESTADO_FIRMADO if fila.firmado else ESTADO_EN_CURSO


def faltantes(db: Session, hce_id: int, anio: int, modulo: str) -> list[str]:
    """Los eslabones **anteriores** de `modulo`, en el mismo `anio`, que no están firmados.

    Un eslabón que ni se inició cuenta como faltante. Para LB (el primero) siempre `[]`.
    """
    if modulo not in CADENA_FLUJO:
        raise ValueError(f"{modulo!r} no es un eslabón de la cadena: {CADENA_FLUJO}")
    previos = CADENA_FLUJO[:CADENA_FLUJO.index(modulo)]
    return [m for m in previos if estado_modulo(db, hce_id, anio, m) != ESTADO_FIRMADO]


def estados_de_flujo(db: Session, hce_ids: list[int], anio: int | None = None) -> dict[int, list[dict[str, str]]]:
    """`{hce_id: [{"modulo", "estado"}, …]}` de los cuatro eslabones del `anio` (por omisión, el en curso).

    Es `flujo_del_anio` **en bloque**, para la lista de expedientes: **tres consultas fijas**
    (IDEA, protocolos, informes) con `hce_id IN (…)`, sin importar cuántos ids lleguen — nada de un
    request por fila. Misma derivación (`sin_iniciar` · `en_curso` · `firmado`) y mismo orden de la
    cadena que `modulos[]` de `GET /hce/{id}/flujo`. Un id sin filas sale con los cuatro `sin_iniciar`.
    """
    anio = anio if anio is not None else fechas.anio_actual()
    firmado: dict[tuple[int, str], bool] = {}
    if hce_ids:
        for hce_id, f in db.execute(select(Idea.hce_id, Idea.firmado).where(Idea.hce_id.in_(hce_ids), Idea.anio == anio)):
            firmado[hce_id, MODULO_HCE_LB] = f
        for hce_id, tipo, f in db.execute(
            select(Protocolo.hce_id, Protocolo.tipo, Protocolo.firmado)
            .where(Protocolo.hce_id.in_(hce_ids), Protocolo.anio == anio)
        ):
            firmado[hce_id, MODULO_HCE_PA if tipo == "A" else MODULO_HCE_PB] = f
        for hce_id, f in db.execute(
            select(InformeCierre.hce_id, InformeCierre.firmado).where(InformeCierre.hce_id.in_(hce_ids), InformeCierre.anio == anio)
        ):
            firmado[hce_id, MODULO_HCE_IC] = f
    return {
        hce_id: [
            {
                "modulo": modulo,
                "estado": (
                    ESTADO_SIN_INICIAR if (hce_id, modulo) not in firmado
                    else ESTADO_FIRMADO if firmado[hce_id, modulo] else ESTADO_EN_CURSO
                ),
            }
            for modulo in CADENA_FLUJO
        ]
        for hce_id in hce_ids
    }


def estado_ci(db: Session, hce_id: int) -> str:
    """`registrado` si existe la fila de `consentimiento` del expediente; si no, `pendiente`.

    «CI pendiente» es un estado visible, no un error ni un aviso (§5.94).
    """
    existe = db.scalar(select(Consentimiento.hce_id).where(Consentimiento.hce_id == hce_id))
    return CI_REGISTRADO if existe is not None else CI_PENDIENTE


def flujo_del_anio(db: Session, hce_id: int, anio: int | None = None) -> dict[str, Any]:
    """Estado del CI y de los cuatro eslabones del `anio` (por omisión, el en curso). 404 si no existe el expediente."""
    obtener_hce(db, hce_id)
    anio = anio if anio is not None else fechas.anio_actual()
    if not 1 <= anio <= 32767:
        raise ValidationFailed([("anio", "Debe estar entre 1 y 32767")])
    modulos = []
    for modulo in CADENA_FLUJO:
        fila = _fila(db, hce_id, anio, modulo)
        modulos.append({
            "modulo": modulo,
            "id": fila.id if fila is not None else None,
            "estado": (
                ESTADO_SIN_INICIAR if fila is None
                else ESTADO_FIRMADO if fila.firmado else ESTADO_EN_CURSO
            ),
            "faltantes": faltantes(db, hce_id, anio, modulo),
        })
    return {"hce_id": hce_id, "anio": anio, "ci": estado_ci(db, hce_id), "modulos": modulos}


def avisos_de_secuencia(
    db: Session,
    *,
    hce_id: int,
    anio: int,
    modulo: str,
    accion: str,
    usuario_id: int | None = None,
) -> list[dict[str, Any]]:
    """Avisos de `warnings[]` por hacer `accion` («creación» | «firma») fuera de secuencia.

    Si no falta ningún eslabón anterior devuelve `[]` y **no escribe nada**. Si falta
    alguno devuelve **un** aviso `{"code": "fuera_de_secuencia", "mensaje", "modulo",
    "anio", "faltan": [...]}` y escribe **una** fila `auditoria` `tipo='excepcion'`, en
    la transacción del request. **El que llama sólo la usa al crear y al firmar**, nunca
    en cada guardado. Nunca levanta por secuencia (§5.95).
    """
    faltan = faltantes(db, hce_id, anio, modulo)
    if not faltan:
        return []
    auditoria.registrar_evento(
        db, modulo=modulo, hce_id=hce_id, tipo=AUDITORIA_TIPO_EXCEPCION, usuario_id=usuario_id,
        detalle=f"{accion.capitalize()} de {modulo} ({anio}) fuera de secuencia: sin firmar {', '.join(faltan)}",
    )
    return [{
        "code": AVISO_FUERA_DE_SECUENCIA,
        "mensaje": f"{modulo} ({anio}) quedó fuera de secuencia: faltan firmar {', '.join(faltan)}",
        "modulo": modulo,
        "anio": anio,
        "faltan": faltan,
    }]
