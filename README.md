# Proyecto IPPU × UTEC-LIDIA

Repositorio de trabajo del convenio entre la **Fundación IPPU** (Instituto Psico-Pedagógico Uruguayo)
y **UTEC-LIDIA** (Licenciatura en Ingeniería de Datos e IA) para aplicar inteligencia artificial y
ciencia de datos a la atención de **niños, niñas y adolescentes (NNA) con TEA**.

El proyecto tiene **4 líneas de trabajo**. El foco actual es la **Línea 1 (L1): Historia Clínica
Electrónica + protocolo IDEA + analítica institucional**.

| Línea | Tema |
|---|---|
| **L1** ⭐ | Historia Clínica Electrónica (HCE) + inventario **IDEA** + analítica |
| L2 | Pictogramas personalizados con IA (CAA/AAC) |
| L3 | Asistente virtual (chatbot RAG) para técnicos, familias y docentes |
| L4 | Patrones de visualización / dashboards (incl. eye-tracking) |

## 📂 Estructura del repositorio
```
IPPU/
├── handoff.md      ← Estado del proyecto entre sesiones (empezar por acá)
├── CLAUDE.md       ← Guía de contexto para Claude
├── README.md       ← Este archivo
├── PLAN-modular-adaptacion-HCE-2026-07.md  ← Plan de la ronda M0–M11 (adaptación al Doc. Técnico)
├── docs/
│   ├── fuentes/    ← Documentos originales (PDF, PPTX, DOCX) + reuniones/ (XLSX)
│   ├── markdown/   ← Conversiones a Markdown de las fuentes (legibles y citables)
│   └── notas/      ← Notas y síntesis propias del equipo
├── implementacion/
│   └── L1-hce-idea/ ← Código y prototipos de la Línea 1
│       ├── demo/hce_idea_ippu_demo.html   ← Demo navegable (datos simulados, sin backend)
│       └── backend/                       ← API FastAPI + SQLAlchemy + Alembic (ver su README)
└── herramientas/
    └── conversor_docling.py   ← Conversor de documentos a Markdown
```

## 📌 Estado de la Línea 1 (jul-2026)
- **Demo v4.0 — ronda M0–M10 completa**, adaptada al **Documento Técnico IPPU v1.0**: motor de flujo con
  firma/bloqueo/addendas/habilitación excepcional y auditoría (HCE-LOG), módulos **HCE-00** (identificación
  y anamnesis), **HCE-CI** (consentimiento), **HCE-LB** (IDEA como línea base única), **HCE-PA/PB** (Escala
  IPPU-TEA con delta B−A y alerta institucional), **HCE-IC** (Informe de Cierre Anual con radar y PDF, único
  informe válido), **HCE-DOC** (documentos, archivo histórico y protección de imagen), **HCE-ORG** (INAU/BPS)
  y **HCE-VF** (valoración funcional BUND/CIF con salvaguarda anti-conversión), + búsqueda por 3 vías y
  recordatorios configurables. Reglas duras verificadas con Playwright (E2E punta a punta).
- **Backend Fases 0–2** (FastAPI + SQLAlchemy + Alembic, 21 tablas, 20 endpoints, tests): construido sobre el
  modelo *previo* al Documento Técnico → el rediseño de esquema es la próxima ronda (**M11**, backend v2),
  a arrancar tras validar la demo con IPPU.

## 🚀 Cómo retomar el trabajo
```bash
cd "C:\Proyectos\IPPU"
claude
```
Luego leer `handoff.md` (estado vivo) y `CLAUDE.md` (contexto). La documentación lista para leer está
en `docs/markdown/`; la demo de la L1 se abre en el navegador desde `implementacion/L1-hce-idea/demo/`.

## 🛠️ Convertir nuevos documentos a Markdown
```bash
python herramientas/conversor_docling.py "docs/fuentes/<archivo>" -o "docs/markdown"
# o una carpeta entera:
python herramientas/conversor_docling.py "docs/fuentes" -o "docs/markdown"
```

## 👥 Equipo
- **UTEC-LIDIA (estudiantes):** Samuel Furtado, Lucas Pimentel, Victor Uria.
- **UTEC (referentes):** Matías López.
- **IPPU:** Fernando Sierra (Director).

## 🔒 Nota de privacidad
Trabajar **solo con datos simulados o anonimizados** mientras no exista un acuerdo de confidencialidad
firmado con IPPU. Los datos de los NNA son sensibles.
