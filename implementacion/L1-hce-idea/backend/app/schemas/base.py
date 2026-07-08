"""Base común de los schemas Pydantic."""
from pydantic import BaseModel, ConfigDict


class ORMModel(BaseModel):
    """Schema que sabe leerse desde un objeto ORM (SQLAlchemy)."""
    model_config = ConfigDict(from_attributes=True)
