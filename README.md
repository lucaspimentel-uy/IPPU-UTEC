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
├── handoff.md      ← Estado del proyecto + decisiones + flujo de trabajo (EMPEZAR POR ACÁ)
├── CLAUDE.md       ← Guía de contexto para las sesiones de Claude
├── README.md       ← Este archivo
├── PLAN-modular-adaptacion-HCE-2026-07.md  ← Plan de la ronda M0–M11 (adaptación al Doc. Técnico)
├── docs/
│   ├── fuentes/    ← Documentos originales (PDF, PPTX, DOCX) + reuniones/ (XLSX)
│   └── markdown/   ← Conversiones a Markdown de las fuentes (legibles y citables)
├── implementacion/
│   └── L1-hce-idea/ ← Código y prototipos de la Línea 1
│       ├── demo/           ← Demo navegable (datos simulados, sin backend)
│       │   ├── index.html  ← abrir en el navegador (doble clic, no necesita servidor)
│       │   ├── css/estilos.css
│       │   └── js/         ← 12 módulos; se cargan en orden y ese orden ES la semántica
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
  modelo *previo* al Documento Técnico → el rediseño de esquema es la ronda **en curso** (**M11**, backend v2,
  responsable **Victor**), sobre la propuesta `implementacion/L1-hce-idea/backend/docs/esquema-datos-v2.md`.

## 🚀 Cómo retomar el trabajo
```bash
git pull
cd <carpeta del repo>
claude
```
1. Leer **`handoff.md`** — es el estado vivo del proyecto: **§5** decisiones ya tomadas, **§6** pendientes y
   quién los tiene, **§12 el flujo de trabajo del equipo** (cómo trabajamos los tres en paralelo sin pisarnos).
2. Leer `CLAUDE.md` (contexto y reglas para las sesiones de Claude).
3. La documentación lista para leer está en `docs/markdown/`; la demo de la L1 se abre en el navegador desde
   `implementacion/L1-hce-idea/demo/`.

> ⚠️ **Antes de tocar código:** confirmá en `handoff.md` §6 que nadie más tomó ese módulo, y avisá en el grupo.
> Desde la modularización (2026-08-07, `handoff.md` §5.5) **la demo se puede trabajar en paralelo**, siempre
> que cada uno tome **archivos distintos** de `demo/js/`; avisá cuál tomás. `demo/index.html` y
> `demo/js/utils.js` los tocan todos → **coordinar antes** (§12.3).

## 🛠️ Convertir nuevos documentos a Markdown
```bash
python herramientas/conversor_docling.py "docs/fuentes/<archivo>" -o "docs/markdown"
# o una carpeta entera:
python herramientas/conversor_docling.py "docs/fuentes" -o "docs/markdown"
```

## 👥 Equipo
- **UTEC-LIDIA (estudiantes):** Samuel Furtado, Lucas Pimentel, Victor Uria.
- **UTEC (referentes):** Matías López, Vitalio Alfonso Reguera.
- **IPPU:** Fernando Sierra (Director).

## 🔒 Nota de privacidad
Trabajar **solo con datos simulados o anonimizados** mientras no exista un acuerdo de confidencialidad
firmado con IPPU. Los datos de los NNA son sensibles.
