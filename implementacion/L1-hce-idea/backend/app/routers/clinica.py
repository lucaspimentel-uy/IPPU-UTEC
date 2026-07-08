"""Línea de tiempo clínica: observaciones y eventos por NNA."""
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Evento, Nna, Observacion
from app.routers.deps import get_nna
from app.schemas.clinica import EventoCreate, EventoOut, ObservacionCreate, ObservacionOut

router = APIRouter(tags=["clínica"])


# ---------- Observaciones ----------
@router.get("/nna/{nna_id}/observaciones", response_model=list[ObservacionOut])
def listar_observaciones(nna: Nna = Depends(get_nna), db: Session = Depends(get_db)):
    return db.scalars(
        select(Observacion).where(Observacion.nna_id == nna.id).order_by(Observacion.fecha)
    ).all()


@router.post("/nna/{nna_id}/observaciones", response_model=ObservacionOut,
             status_code=status.HTTP_201_CREATED)
def crear_observacion(datos: ObservacionCreate, nna: Nna = Depends(get_nna),
                      db: Session = Depends(get_db)):
    obs = Observacion(nna_id=nna.id, **datos.model_dump())
    db.add(obs)
    db.commit()
    db.refresh(obs)
    return obs


# ---------- Eventos ----------
@router.get("/nna/{nna_id}/eventos", response_model=list[EventoOut])
def listar_eventos(nna: Nna = Depends(get_nna), db: Session = Depends(get_db)):
    return db.scalars(
        select(Evento).where(Evento.nna_id == nna.id).order_by(Evento.fecha)
    ).all()


@router.post("/nna/{nna_id}/eventos", response_model=EventoOut,
             status_code=status.HTTP_201_CREATED)
def crear_evento(datos: EventoCreate, nna: Nna = Depends(get_nna),
                 db: Session = Depends(get_db)):
    ev = Evento(nna_id=nna.id, **datos.model_dump())
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev
