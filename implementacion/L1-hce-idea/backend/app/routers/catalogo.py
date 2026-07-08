"""Catálogo IDEA (solo lectura): escalas y dimensiones."""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.models import DimensionCatalogo, Escala
from app.schemas.catalogo import DimensionOut, EscalaOut

router = APIRouter(prefix="/catalogo", tags=["catálogo IDEA"])


@router.get("/escalas", response_model=list[EscalaOut])
def listar_escalas(db: Session = Depends(get_db)):
    return db.scalars(
        select(Escala).options(selectinload(Escala.dimensiones)).order_by(Escala.orden)
    ).all()


@router.get("/dimensiones", response_model=list[DimensionOut])
def listar_dimensiones(db: Session = Depends(get_db)):
    return db.scalars(select(DimensionCatalogo).order_by(DimensionCatalogo.numero)).all()
