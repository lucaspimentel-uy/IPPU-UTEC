"""Lectura del rastro de un expediente (HCE-LOG) — C1. Sólo lee: no escribe nada.

Qué registra `auditoria` lo decide `app/services/auditoria.py`; acá sólo se lista. **Registra
cambios, no accesos** (puntos-a-validar §2.17, abierto): leer esta lista tampoco deja fila.
"""
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.constantes import AUDITORIA_TIPOS_LEIBLES, MODULOS_HCE
from app.models.identidad import Profesional
from app.models.transversales import Auditoria
from app.services.errores import ValidationFailed


def listar_auditoria(
    db: Session, hce_id: int, *, modulo: str | None = None, tipo: str | None = None,
    limit: int, offset: int,
) -> tuple[list[tuple[Auditoria, Profesional | None]], int]:
    """Filas del expediente, la más nueva primero, y el total que cumple los filtros.

    Orden `ts DESC, id DESC`: las filas de un mismo request comparten `ts` (`now()` es el inicio
    de la transacción), así que el `id` desempata y mantiene el orden en que se escribieron.
    Un `modulo` o `tipo` fuera de las constantes es 422 por campo (ambos a la vez).
    """
    problemas = []
    if modulo is not None and modulo not in MODULOS_HCE:
        problemas.append(("modulo", f"Debe ser uno de: {', '.join(MODULOS_HCE)}"))
    if tipo is not None and tipo not in AUDITORIA_TIPOS_LEIBLES:
        problemas.append(("tipo", f"Debe ser uno de: {', '.join(AUDITORIA_TIPOS_LEIBLES)}"))
    if problemas:
        raise ValidationFailed(problemas)

    condiciones = [Auditoria.hce_id == hce_id]
    if modulo is not None:
        condiciones.append(Auditoria.modulo == modulo)
    if tipo is not None:
        condiciones.append(Auditoria.tipo == tipo)

    total = db.scalar(select(func.count()).select_from(Auditoria).where(*condiciones))
    filas = db.execute(
        select(Auditoria, Profesional)
        .outerjoin(Profesional, Profesional.id == Auditoria.usuario_id)
        .where(*condiciones)
        .order_by(Auditoria.ts.desc(), Auditoria.id.desc())
        .limit(limit).offset(offset)
    ).all()
    return [(a, p) for a, p in filas], total