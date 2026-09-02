"""Modelos SQLAlchemy del esquema v2 (M11.2).

Importar todo acá para que quede registrado en `Base.metadata` — de eso depende
que `alembic revision --autogenerate` vea las tablas.

Organización (espeja `backend/docs/esquema-datos-v2.md` §2):
  catalogos     §2.4  catálogos paramétricos (IDEA, IPPU-TEA, baremo, …)
  identidad     §2.1  persona / expediente / grupo / profesional
  modulos       §2.2  el flujo firmable CI → LB → PA → PB → IC
  severidad     §2.2  HCE-SEV (M12.4) — módulo **sin firma**, con su catálogo
  inclusion     §2.2  HCE-INC (M12.5) — módulo **sin firma**: ficha, bitácora y
                      sus dos catálogos (estados y centros educativos)
  ateneo        §2.5  Ateneos y jornadas (M12.7) — registro **institucional**,
                      transversal: no cuelga del expediente, lo referencia
  pai           §2.2  HCE-PAI (M12.6) — la propuesta y sus 7 tablas hijas.
                      Módulo **sin firma**; N por expediente, no anual
  transversales §2.3  DOC · ORG · VF · LOG + seguimiento
"""
from app.models.ateneo import (
    Ateneo,
    AteneoAcuerdo,
)
from app.models.catalogos import (
    BandaIdea,
    BaremoCategoria,
    CategoriaDocumento,
    DeltaInterpretacion,
    IdeaDimension,
    IdeaEjemplo,
    IdeaFicha,
    IdeaNivel,
    IdeaRegla,
    IppuItem,
    Recordatorio,
    Servicio,
    Taller,
)
from app.models.inclusion import (
    CatalogoCentroEducativo,
    EstadoInclusion,
    Inclusion,
    InclusionBitacora,
)
from app.models.identidad import (
    Grupo,
    HceDiurna,
    Persona,
    PersonaServicio,
    Profesional,
)
from app.models.modulos import (
    Consentimiento,
    Idea,
    InformeCierre,
    Protocolo,
    PuntuacionIdea,
    PuntuacionProtocolo,
)
from app.models.pai import (
    Pai,
    PaiCircuito,
    PaiCoordinacion,
    PaiEquipo,
    PaiEvaluacionPrevia,
    PaiObjetivo,
    PaiPrestacion,
    PaiTaller,
)
from app.models.severidad import (
    SeveridadDsm,
    SeveridadNivel,
)
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
    # ateneos y jornadas (M12.7)
    "Ateneo", "AteneoAcuerdo",
    # catálogos
    "BandaIdea", "BaremoCategoria", "CategoriaDocumento", "DeltaInterpretacion",
    "IdeaDimension", "IdeaEjemplo", "IdeaFicha", "IdeaNivel", "IdeaRegla",
    "IppuItem", "Recordatorio", "Servicio", "Taller",
    # identidad
    "Grupo", "HceDiurna", "Persona", "PersonaServicio", "Profesional",
    # HCE-INC (M12.5)
    "CatalogoCentroEducativo", "EstadoInclusion", "Inclusion", "InclusionBitacora",
    # módulos del flujo
    "Consentimiento", "Idea", "InformeCierre", "Protocolo",
    "PuntuacionIdea", "PuntuacionProtocolo",
    # HCE-PAI (M12.6)
    "Pai", "PaiCircuito", "PaiCoordinacion", "PaiEquipo", "PaiEvaluacionPrevia",
    "PaiObjetivo", "PaiPrestacion", "PaiTaller",
    # HCE-SEV (M12.4)
    "SeveridadDsm", "SeveridadNivel",
    # transversales
    "Auditoria", "AutorizacionImagen", "Documento", "Evento", "Foto",
    "Observacion", "OrganismoBps", "OrganismoInau", "RegistroOrganismo",
    "ValoracionFuncional",
]
