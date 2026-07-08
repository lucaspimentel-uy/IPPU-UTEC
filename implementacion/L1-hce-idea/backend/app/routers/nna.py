"""Expediente NNA: CRUD."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Anamnesis, Nna, Taller
from app.routers.deps import get_nna
from app.schemas.nna import (
    EstadoUpdate, NnaCreate, NnaDetail, NnaListItem, NnaUpdate,
)

router = APIRouter(prefix="/nna", tags=["NNA"])


def _asignar_talleres(db: Session, nna: Nna, ids: list[int]) -> None:
    talleres = db.scalars(select(Taller).where(Taller.id.in_(ids))).all() if ids else []
    faltan = set(ids) - {t.id for t in talleres}
    if faltan:
        raise HTTPException(400, f"Talleres inexistentes: {sorted(faltan)}")
    nna.talleres = list(talleres)


@router.get("", response_model=list[NnaListItem])
def listar_nna(
    db: Session = Depends(get_db),
    q: str | None = Query(None, description="Busca en nombre, apellido o C.I."),
    activo: bool | None = Query(None, description="Filtra por estado"),
):
    stmt = select(Nna)
    if activo is not None:
        stmt = stmt.where(Nna.activo.is_(activo))
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(Nna.nombre.ilike(like), Nna.apellido.ilike(like), Nna.ci.ilike(like)))
    return db.scalars(stmt.order_by(Nna.apellido, Nna.nombre)).all()


@router.post("", response_model=NnaDetail, status_code=status.HTTP_201_CREATED)
def crear_nna(datos: NnaCreate, db: Session = Depends(get_db)):
    payload = datos.model_dump(exclude={"anamnesis", "talleres"})
    nna = Nna(**payload)
    if datos.anamnesis:
        nna.anamnesis = Anamnesis(**datos.anamnesis.model_dump())
    _asignar_talleres(db, nna, datos.talleres)
    db.add(nna)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, f"Ya existe un NNA con la C.I. {datos.ci}")
    db.refresh(nna)
    return nna


@router.get("/{nna_id}", response_model=NnaDetail)
def ver_nna(nna: Nna = Depends(get_nna)):
    return nna


@router.put("/{nna_id}", response_model=NnaDetail)
def editar_nna(datos: NnaUpdate, db: Session = Depends(get_db), nna: Nna = Depends(get_nna)):
    for campo, valor in datos.model_dump(exclude={"anamnesis", "talleres"}).items():
        setattr(nna, campo, valor)
    if datos.anamnesis is not None:
        if nna.anamnesis:
            for c, v in datos.anamnesis.model_dump().items():
                setattr(nna.anamnesis, c, v)
        else:
            nna.anamnesis = Anamnesis(**datos.anamnesis.model_dump())
    if datos.talleres is not None:
        _asignar_talleres(db, nna, datos.talleres)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, f"Ya existe un NNA con la C.I. {datos.ci}")
    db.refresh(nna)
    return nna


@router.patch("/{nna_id}/estado", response_model=NnaDetail)
def cambiar_estado(estado: EstadoUpdate, db: Session = Depends(get_db), nna: Nna = Depends(get_nna)):
    """Da de alta (activo=true) o de baja (activo=false, con fecha_baja) el expediente."""
    nna.activo = estado.activo
    nna.fecha_baja = estado.fecha_baja if not estado.activo else None
    db.commit()
    db.refresh(nna)
    return nna
