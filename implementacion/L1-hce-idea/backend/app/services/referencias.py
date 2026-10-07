"""Listas de referencia de sólo lectura para la demo: grupos y profesionales (M11.3-a2).

Sin escritura: crear o renombrar grupos es el sub-módulo de administración
(`handoff.md` §5.90) y el alta de profesionales llega con el login (§5.101).
"""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.identidad import Grupo, Profesional
from app.services.hce import anio_actual


def listar_grupos(db: Session, anio: int | None = None) -> list[Grupo]:
    """Los grupos **de un año** (por omisión el año en curso, §5.111), por nombre."""
    return list(db.scalars(
        select(Grupo).where(Grupo.anio == (anio if anio is not None else anio_actual()))
        .order_by(Grupo.nombre, Grupo.id)
    ))


def listar_profesionales(db: Session, activo: bool | None = None) -> list[Profesional]:
    """Profesionales por nombre. `activo=None` trae todos; `True`/`False` filtra."""
    consulta = select(Profesional).order_by(Profesional.nombre, Profesional.id)
    if activo is not None:
        consulta = consulta.where(Profesional.activo == activo)
    return list(db.scalars(consulta))
