# CLAUDE.md — Guía para Claude en el proyecto IPPU

> Contexto operativo para asistir en el proyecto **IPPU × UTEC-LIDIA**.
> **Antes de trabajar, leer también `handoff.md`** (estado vivo del proyecto entre sesiones).
>
> Este archivo está **versionado y es compartido por el equipo** (Lucas · Samuel · Victor) desde el
> 2026-08-03: lo tienen los tres al clonar, y aplica igual en la sesión de cualquiera.

## Arranque de sesión (obligatorio)
1. `git pull` y leer **`handoff.md`** — cabecera, **§5** (decisiones tomadas), **§6** (pendientes y sus
   responsables) y **§12** (flujo de trabajo del equipo).
2. Mirar en §6 si alguien ya está en eso y trabajar en rama corta. **Desde el 2026-08-07 ningún módulo
   tiene dueño exclusivo** (`handoff.md` §5.6): se avisa qué se toma, no se pide permiso.
3. **La demo está modularizada** (`demo/index.html` + `demo/css/` + `demo/js/*.js`, 2026-08-07): se puede
   trabajar en paralelo **siempre que cada uno tome archivos distintos** de `demo/js/`. Avisar qué archivo
   se toma (§12.3). `index.html` y `js/utils.js` los tocan todos → coordinar antes.
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
│   ├── estructura-repositorio.md  # Mapa detallado de carpetas y rutas del repo
│   ├── fuentes/               # Originales (PDF, PPTX, DOCX) + reuniones/ (XLSX) — respaldo, NO se leen
│   ├── markdown/              # Conversiones .md de las fuentes — leer y citar SIEMPRE desde acá
│   ├── notas/                 # puntos-a-validar.md (interno) · consulta-a-ippu.md (para enviar)
│   └── planes/                # Planes de ronda (p. ej. PLAN-modular-adaptacion-HCE-2026-07.md)
├── implementacion/
│   └── L1-hce-idea/           # Línea 1 (foco)
│       ├── demo/            # Prototipo front (datos simulados, sin backend)
│       │   ├── index.html   # markup · css/estilos.css · js/*.js (12 módulos, orden de carga = semántica)
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

**Regla: una vez convertido, se trabaja con el `.md`.** Los originales quedan sólo como respaldo, y por eso
`docs/fuentes/` está excluido del grafo de conocimiento vía `.graphifyignore` (`handoff.md` §5.7): indexar
las dos copias duplica el costo en tokens sin agregar información. **Excepción:** `HCE_IPPU_Prototipo_v1.html`
no tiene conversión a propósito (es una app JS y Docling rinde sólo el shell vacío) y se cita desde su ruta
original en `docs/fuentes/`.

## Dominio mínimo (IDEA)
4 escalas → **12 dimensiones (D1–D12)**, cada una **0–8**, total **0–96** (menor = mejor).
Ciclo: IDEA completa enero/noviembre + intermedia Likert en junio (`equiv. IDEA = (5 − promedio)×2`).
Detalle completo en `handoff.md` §3 y en `docs/markdown/escala-del-inventario-del-espectro-autista-idea.md`.

## Stack objetivo de L1
React + Tailwind (frontend) · FastAPI o Node (API REST, JWT por terapeuta) · PostgreSQL · Docker.

**Backend** (`implementacion/L1-hce-idea/backend/`): **Python + FastAPI + SQLAlchemy + Alembic + PostgreSQL**. Correr: `cd` al backend → **`docker compose up -d`** (Postgres 16 en `127.0.0.1:5440`) → `.venv\Scripts\Activate.ps1` → `alembic upgrade head` → `python -m app.seed_catalogos` → `uvicorn app.main:app --reload` (docs en `/docs`). Tests: `pytest -q` (base `ippu_test`, aislada). **Docker es requisito**: `config.py` rechaza al arrancar cualquier `DATABASE_URL` que no sea Postgres.

**Ronda en curso — M11 (backend v2).** Sin dueño exclusivo (`handoff.md` §5.6). Decisiones cerradas (`handoff.md` §5.2, **no reabrir sin acuerdo del equipo**): **Postgres-only** · **lógica de negocio en el servidor** (Pydantic + servicios, **sin triggers PL/pgSQL**; la BD sólo garantiza integridad estructural) · **portabilidad paramétrica mínima**.
- **HECHO (2026-08-07):** **M11.1** infra + **M11.2** modelos (28 tablas en `app/models/{catalogos,identidad,modulos,transversales}.py`), migración inicial única y catálogos. El backend v1 **se retiró entero** (hablaba del modelo pre-Documento Técnico). Verificado: 18 tests estructurales.
- **FALTA:** **M11.3** servicios y guards (§4 del esquema: secuencia, firma=bloqueo, Δ sólo B−A, baremo sólo desde `pct`, fotos §8.4) → **M11.4** routers → **M11.5** seed espejo de la demo + pytest → **M11.6** docs. Después: Fase 3 (demo↔API), Fase 4 (JWT), Fase 6 (Docker completo).
- **Al tocar los modelos, leer primero `backend/docs/esquema-datos-v2.md`** (§2 tablas, §4 dónde vive cada regla). Los catálogos de `app/data/catalogos_iniciales.json` **se generan desde la demo**, no se editan a mano.
- **Antes de dar algo por definido, mirar `docs/notas/puntos-a-validar.md`**: hay supuestos tomados por nosotros que IPPU todavía no confirmó.

## Reglas importantes
- **Solo datos simulados/anonimizados** hasta que exista acuerdo de confidencialidad firmado con IPPU.
- Datos de NNA = sensibles: nunca subir identificadores/imágenes reales a servicios externos sin evaluación.
- La IA **apoya**, no reemplaza, el juicio clínico.
- **Al terminar una sesión con cambios relevantes, actualizar `handoff.md`** (§5 decisiones, §6 pendientes, §13 bitácora) y pushear a los dos remotos.
