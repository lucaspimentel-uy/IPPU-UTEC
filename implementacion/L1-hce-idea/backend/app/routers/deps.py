"""Dependencias compartidas por los routers."""
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Nna


def get_nna(nna_id: int, db: Session = Depends(get_db)) -> Nna:
    """Devuelve el NNA o 404."""
    nna = db.get(Nna, nna_id)
    if not nna:
        raise HTTPException(status_code=404, detail=f"NNA {nna_id} no encontrado")
    return nna
