"""Modelos SQLAlchemy del esquema v2 (M11.2).

Importar todo acá para que quede registrado en `Base.metadata` — de eso depende
que `alembic revision --autogenerate` vea las tablas.

Organización (espeja `backend/docs/esquema-datos-v2.md` §2):
  catalogos     §2.4  catálogos paramétricos (IDEA, IPPU-TEA, baremo, …)
  identidad     §2.1  persona / expediente / grupo / profesional
  modulos       §2.2  el flujo firmable CI → LB → PA → PB → IC
  transversales §2.3  DOC · ORG · VF · LOG + seguimiento
"""
from app.models.catalogos import (
    BaremoCategoria,
    CategoriaDocumento,
    IdeaDimension,
    IdeaNivel,
    IppuItem,
    Recordatorio,
    Servicio,
    Taller,
)
from app.models.identidad import (
    Grupo,
    HceDiurna,
    HceTaller,
    Persona,
    PersonaServicio,
    Profesional,
)
from app.models.modulos import Consentimiento, Idea, InformeCierre, Protocolo
from app.models.transversales import (
    Auditoria,
    AutorizacionImagen,
    Documento,
    Evento,
    Foto,
    Observacion,
    OrganismoBps,
    OrganismoInau,
    RegistroOrganismo,
    ValoracionFuncional,
)

__all__ = [
    # catálogos
    "BaremoCategoria", "CategoriaDocumento", "IdeaDimension", "IdeaNivel",
    "IppuItem", "Recordatorio", "Servicio", "Taller",
    # identidad
    "Grupo", "HceDiurna", "HceTaller", "Persona", "PersonaServicio", "Profesional",
    # módulos del flujo
    "Consentimiento", "Idea", "InformeCierre", "Protocolo",
    # transversales
    "Auditoria", "AutorizacionImagen", "Documento", "Evento", "Foto",
    "Observacion", "OrganismoBps", "OrganismoInau", "RegistroOrganismo",
    "ValoracionFuncional",
]
