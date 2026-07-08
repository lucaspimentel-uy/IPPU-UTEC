"""Fixtures de test: una base SQLite temporal y aislada por test."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.models  # noqa: F401  (registra los modelos en Base.metadata)
from app.core.database import Base, get_db
from app.main import app
from app.models import DimensionCatalogo, Escala, Grupo, Taller, Terapeuta

_ESCALAS = [("A", "Relación Social", 1), ("B", "Comunicación", 2),
            ("C", "Anticipación", 3), ("D", "Simbolización", 4)]
_MAP = ["A", "A", "A", "B", "B", "B", "C", "C", "C", "D", "D", "D"]


def _seed(db):
    for eid, nombre, orden in _ESCALAS:
        db.add(Escala(id=eid, nombre=nombre, orden=orden))
    for i in range(1, 13):
        db.add(DimensionCatalogo(id=f"D{i}", escala_id=_MAP[i - 1], numero=i, nombre=f"Dimensión {i}"))
    db.add(Terapeuta(id=1, nombre="Dr. Test", especialidad="Psicología", email="test@ippu.uy", rol="tecnico"))
    db.add(Grupo(id="A", franja="6-9", dias="Lun", horario="9-12"))
    db.add(Taller(id=1, nombre="Habilidades sociales"))
    db.add(Taller(id=2, nombre="Música"))
    db.commit()


@pytest.fixture
def client(tmp_path):
    engine = create_engine(
        f"sqlite:///{tmp_path/'test.db'}", connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestingSession() as db:
        _seed(db)

    yield TestClient(app)
    app.dependency_overrides.clear()
