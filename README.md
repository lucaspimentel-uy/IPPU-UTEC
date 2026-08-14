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
├── docs/
│   ├── estructura-repositorio.md  ← Mapa detallado de carpetas y rutas del repo
│   ├── fuentes/    ← Documentos originales (PDF, PPTX, DOCX) + reuniones/ (XLSX)
│   ├── markdown/   ← Conversiones a Markdown de las fuentes (legibles y citables)
│   ├── notas/      ← Notas de equipo · puntos-a-validar.md (qué falta definir con IPPU)
│   └── planes/     ← Planes de ronda (p. ej. PLAN-modular-adaptacion-HCE-2026-07.md, M0–M11)
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

## 📌 Estado de la Línea 1 (ago-2026)
- **Demo v4.1 — ronda M0–M10 completa**, adaptada al **Documento Técnico IPPU v1.0**: motor de flujo con
  firma/bloqueo/addendas/habilitación excepcional y auditoría (HCE-LOG), módulos **HCE-00** (identificación
  y anamnesis), **HCE-CI** (consentimiento), **HCE-LB** (IDEA como línea base única), **HCE-PA/PB** (Escala
  IPPU-TEA con delta B−A y alerta institucional), **HCE-IC** (Informe de Cierre Anual con radar y PDF, único
  informe válido), **HCE-DOC** (documentos, archivo histórico y protección de imagen), **HCE-ORG** (INAU/BPS)
  y **HCE-VF** (valoración funcional BUND/CIF con salvaguarda anti-conversión), + búsqueda por 3 vías y
  recordatorios configurables. Reglas duras verificadas con Playwright (E2E punta a punta).
- **Analítica institucional calculada (v4.1):** los KPIs y gráficos de esa vista se derivan del modelo —
  cobertura de línea base, perfil poblacional por escala IDEA, evolución Protocolo A → B (Escala IPPU-TEA,
  en tarjeta aparte porque los dos instrumentos no son homologables), distribución por banda y ciclos de
  flujo completos— en lugar de constantes. El heatmap de talleres sigue con datos de muestra por decisión
  de alcance y está rotulado como tal.
- **Backend v2 — ronda M11 en curso.** Las Fases 0–2 (21 tablas, 20 endpoints) estaban construidas sobre el
  modelo *previo* al Documento Técnico y **se retiraron**: entre ese modelo y el actual no hay migración
  incremental posible. Hecho el 2026-08-07: **M11.1** (infra Postgres-only con docker-compose) y **M11.2**
  (28 tablas del esquema v2, migración inicial única y catálogos cargados — 12 dimensiones IDEA con sus 60
  descriptores, 24 ítems IPPU-TEA, baremo, categorías documentales, recordatorios, talleres y servicios).
  Verificado con 18 tests estructurales contra Postgres. **Falta M11.3** (los servicios con las reglas
  clínicas), M11.4 (routers), M11.5 (seed + tests) y M11.6 (docs). Arranque en
  `implementacion/L1-hce-idea/backend/README.md`; esquema en `backend/docs/esquema-datos-v2.md`.
  Desde el 2026-08-07 **no hay módulos con dueño exclusivo** (`handoff.md` §5.6): se avisa qué se toma y listo.
- **Qué falta definir con IPPU** (validar la demo, cortes del baremo, acceso a la HCE actual…) está en
  `docs/notas/puntos-a-validar.md` — versión interna, con lo que bloquea cada punto. La versión **no
  técnica para mandarle a IPPU**, en formato de cuestionario, es `docs/notas/consulta-a-ippu.md`.

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
