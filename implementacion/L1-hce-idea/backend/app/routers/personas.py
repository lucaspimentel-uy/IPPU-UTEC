"""Terapeutas, grupos y talleres (lectura)."""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.models import Grupo, Taller, Terapeuta
from app.schemas.personas import GrupoOut, TallerOut, TerapeutaOut

router = APIRouter(tags=["personas"])


@router.get("/terapeutas", response_model=list[TerapeutaOut])
def listar_terapeutas(db: Session = Depends(get_db)):
    return db.scalars(select(Terapeuta).order_by(Terapeuta.nombre)).all()


@router.get("/grupos", response_model=list[GrupoOut])
def listar_grupos(db: Session = Depends(get_db)):
    return db.scalars(
        select(Grupo).options(selectinload(Grupo.talleres)).order_by(Grupo.id)
    ).all()


@router.get("/talleres", response_model=list[TallerOut])
def listar_talleres(db: Session = Depends(get_db)):
    return db.scalars(select(Taller).order_by(Taller.nombre)).all()
