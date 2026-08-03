# CLAUDE.md — Guía para Claude en el proyecto IPPU

> Contexto operativo para asistir en el proyecto **IPPU × UTEC-LIDIA**.
> **Antes de trabajar, leer también `handoff.md`** (estado vivo del proyecto entre sesiones).
>
> Este archivo está **versionado y es compartido por el equipo** (Lucas · Samuel · Victor) desde el
> 2026-08-03: lo tienen los tres al clonar, y aplica igual en la sesión de cualquiera.

## Arranque de sesión (obligatorio)
1. `git pull` y leer **`handoff.md`** — cabecera, **§5** (decisiones tomadas), **§6** (pendientes y sus
   responsables) y **§12** (flujo de trabajo del equipo).
2. Confirmar que el módulo que se va a tocar **no lo tiene otro integrante** (§6) y trabajar en rama corta.
3. **La demo (`hce_idea_ippu_demo.html`, ~3.700 líneas) es de una sola persona a la vez** — nunca editarla
   en paralelo.
4. Al terminar: verificar (pytest / Playwright), **actualizar `handoff.md`** (§5 si hubo decisión, §6, §13
   bitácora) y commit + push **a los dos remotos** (`gitlab` y `origin`).

## Regla anti-contradicción
Si algo que se está por implementar **contradice una decisión ya registrada en `handoff.md` §5**, no se
implementa: se frena, se anota en §7 (preguntas abiertas) y lo resuelve el equipo. Las decisiones se
cambian por escrito en §5 (fecha + autor), nunca de hecho en el código. El porqué de esta regla está en
`handoff.md` §5.3 (trabajo duplicado de julio-2026).

## Resumen
Convenio Fundación **IPPU** × **UTEC-LIDIA** para aplicar IA/datos a la atención de **NNA con TEA**.
Tiene **4 líneas**; el foco actual es **L1 = Historia Clínica Electrónica + protocolo IDEA + analítica**.
La fuente de verdad del estado del proyecto es `handoff.md`.

## Idioma y estilo
- Responder e escribir documentación **en español** (rioplatense neutro).
- Ser conciso y accionable. Citar documentos por su ruta en `docs/markdown/` cuando se afirme algo del material.

## Mapa del repositorio
```
IPPU/
├── handoff.md                 # Estado del proyecto entre sesiones (LEER PRIMERO)
├── CLAUDE.md                  # Este archivo
├── README.md                  # Overview para humanos
├── docs/
│   ├── fuentes/               # Originales (PDF, PPTX, DOCX) + reuniones/ (XLSX)
│   ├── markdown/              # Conversiones .md de las fuentes (legibles/citables)
│   └── notas/                 # Notas y síntesis propias del equipo
├── implementacion/
│   └── L1-hce-idea/           # Línea 1 (foco)
│       ├── demo/hce_idea_ippu_demo.html   # Prototipo front (datos simulados, sin backend)
│       └── backend/          # API FastAPI + SQLAlchemy + Alembic (ver backend/README.md)
│           ├── app/          # main, core (config/db), models, schemas, routers
│           ├── alembic/      # migraciones · docs/ (esquema-datos.md, ejemplos-endpoints.md)
│           └── tests/        # pytest (base aislada)
└── herramientas/
    └── conversor_docling.py   # Conversor de documentos → Markdown (Docling)
```

## Convertir documentos a Markdown
El conversor usa [Docling]. Salida recomendada: `docs/markdown/`.
```bash
# Un archivo
python herramientas/conversor_docling.py "docs/fuentes/IPPU.pdf" -o "docs/markdown"
# Varios / una carpeta entera (batch). -r para recursivo, --overwrite para rehacer.
python herramientas/conversor_docling.py "docs/fuentes" -o "docs/markdown"
```
Por defecto omite los `.md` ya existentes. Si no se pasa `-o`, escribe en `./markdown_convertido`.
Nota: `IPPU.pdf` es escaneado → Docling aplica OCR (la primera corrida descarga modelos y tarda).

## Dominio mínimo (IDEA)
4 escalas → **12 dimensiones (D1–D12)**, cada una **0–8**, total **0–96** (menor = mejor).
Ciclo: IDEA completa enero/noviembre + intermedia Likert en junio (`equiv. IDEA = (5 − promedio)×2`).
Detalle completo en `handoff.md` §3 y en `docs/markdown/escala-del-inventario-del-espectro-autista-idea.md`.

## Stack objetivo de L1
React + Tailwind (frontend) · FastAPI o Node (API REST, JWT por terapeuta) · PostgreSQL · Docker.

**Backend** (`implementacion/L1-hce-idea/backend/`): **Python + FastAPI + SQLAlchemy + Alembic**. Correr: `cd` al backend → `.venv\Scripts\Activate.ps1` → `alembic upgrade head` → `python -m app.seed` → `uvicorn app.main:app --reload` (docs en `/docs`). Tests: `pytest -q`.

**Ronda en curso — M11 (backend v2), responsable Victor.** Las Fases 0–2 (21 tablas, 20 endpoints, 12 tests) están construidas sobre el modelo *previo* al Documento Técnico y se **rediseñan** en M11 según `backend/docs/esquema-datos-v2.md`. Decisiones cerradas (`handoff.md` §5.2, **no reabrir sin acuerdo del equipo**): **Postgres-only** (docker-compose; se abandona SQLite en dev) · **lógica de negocio en el servidor** (Pydantic + servicios, **sin triggers PL/pgSQL**; la BD sólo garantiza integridad estructural) · **portabilidad paramétrica mínima**. Secuencia: M11.1 infra → M11.2 modelos/catálogos → M11.3 servicios y guards → M11.4 routers → M11.5 seed + pytest → M11.6 docs. Después: Fase 3 (conectar la demo a la API), Fase 4 (JWT), Fase 6 (Docker completo).

## Reglas importantes
- **Solo datos simulados/anonimizados** hasta que exista acuerdo de confidencialidad firmado con IPPU.
- Datos de NNA = sensibles: nunca subir identificadores/imágenes reales a servicios externos sin evaluación.
- La IA **apoya**, no reemplaza, el juicio clínico.
- **Al terminar una sesión con cambios relevantes, actualizar `handoff.md`** (§5 decisiones, §6 pendientes, §13 bitácora) y pushear a los dos remotos.
