"""Evaluaciones IDEA (completa) e intermedia Likert."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import (
    DimensionIdea, EvaluacionIdea, EvaluacionLikert, ItemLikert, Nna,
)
from app.routers.deps import get_nna
from app.schemas.evaluaciones import (
    EvaluacionIdeaCreate, EvaluacionIdeaOut, EvaluacionLikertCreate,
    EvaluacionLikertOut, equivalente_idea,
)

router = APIRouter(tags=["evaluaciones"])


# ---------- IDEA ----------
@router.get("/nna/{nna_id}/idea", response_model=list[EvaluacionIdeaOut])
def listar_idea(nna: Nna = Depends(get_nna), db: Session = Depends(get_db)):
    return db.scalars(
        select(EvaluacionIdea).where(EvaluacionIdea.nna_id == nna.id)
        .order_by(EvaluacionIdea.anio, EvaluacionIdea.periodo)
    ).all()


@router.post("/nna/{nna_id}/idea", response_model=EvaluacionIdeaOut,
             status_code=status.HTTP_201_CREATED)
def crear_idea(datos: EvaluacionIdeaCreate, nna: Nna = Depends(get_nna),
               db: Session = Depends(get_db)):
    existe = db.scalar(
        select(EvaluacionIdea).where(
            EvaluacionIdea.nna_id == nna.id,
            EvaluacionIdea.anio == datos.anio,
            EvaluacionIdea.periodo == datos.periodo,
        )
    )
    if existe:
        raise HTTPException(
            409, f"Ya existe una IDEA {datos.periodo} de {datos.anio} para este NNA")

    total = sum(d.puntaje for d in datos.dimensiones)  # derivado, 0–96
    ev = EvaluacionIdea(
        nna_id=nna.id, anio=datos.anio, periodo=datos.periodo, fecha=datos.fecha,
        evaluador_id=datos.evaluador_id, observaciones=datos.observaciones, total=total,
    )
    ev.dimensiones = [
        DimensionIdea(dimension_id=d.dimension_id, puntaje=d.puntaje) for d in datos.dimensiones
    ]
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev


@router.get("/idea/{eval_id}", response_model=EvaluacionIdeaOut)
def ver_idea(eval_id: int, db: Session = Depends(get_db)):
    ev = db.get(EvaluacionIdea, eval_id)
    if not ev:
        raise HTTPException(404, f"Evaluación IDEA {eval_id} no encontrada")
    return ev


# ---------- Likert (intermedia) ----------
@router.get("/nna/{nna_id}/likert", response_model=list[EvaluacionLikertOut])
def listar_likert(nna: Nna = Depends(get_nna), db: Session = Depends(get_db)):
    return db.scalars(
        select(EvaluacionLikert).where(EvaluacionLikert.nna_id == nna.id)
        .order_by(EvaluacionLikert.anio)
    ).all()


@router.post("/nna/{nna_id}/likert", response_model=EvaluacionLikertOut,
             status_code=status.HTTP_201_CREATED)
def crear_likert(datos: EvaluacionLikertCreate, nna: Nna = Depends(get_nna),
                 db: Session = Depends(get_db)):
    existe = db.scalar(
        select(EvaluacionLikert).where(
            EvaluacionLikert.nna_id == nna.id, EvaluacionLikert.anio == datos.anio)
    )
    if existe:
        raise HTTPException(409, f"Ya existe una intermedia de {datos.anio} para este NNA")

    ev = EvaluacionLikert(
        nna_id=nna.id, anio=datos.anio, fecha=datos.fecha, evaluador_id=datos.evaluador_id,
        observaciones=datos.observaciones, equivalente_idea=equivalente_idea(datos.items),
    )
    ev.items = [
        ItemLikert(dimension_id=i.dimension_id, item_num=i.item_num, valor=i.valor)
        for i in datos.items
    ]
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev
