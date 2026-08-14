# Estructura del repositorio

> Mapa detallado de carpetas y rutas del repo IPPU × UTEC-LIDIA. Para el estado del proyecto y las
> decisiones tomadas, ver `handoff.md`; para las reglas de trabajo de cada sesión, `CLAUDE.md`.
>
> Este documento describe **rutas y su propósito**, no contenido de negocio. Si una carpeta cambia de
> lugar, actualizar acá y en los mapas resumidos de `README.md` y `CLAUDE.md`.

```
IPPU/
├── handoff.md
├── CLAUDE.md
├── README.md
├── .gitignore
├── .graphifyignore
├── docs/
├── implementacion/
├── herramientas/
└── graphify-out/
```

## Raíz del repo

| Ruta | Qué es |
|---|---|
| `handoff.md` | Estado vivo del proyecto entre sesiones (decisiones, pendientes, bitácora). **Se lee primero.** |
| `CLAUDE.md` | Guía de contexto y reglas operativas para las sesiones de Claude en este repo. |
| `README.md` | Overview del proyecto para humanos (equipo, líneas de trabajo, cómo retomar). |
| `.gitignore` | Exclusiones del repositorio (venvs, caches, temporales, etc.). |
| `.graphifyignore` | Exclusiones propias del grafo de conocimiento (`/graphify`); se combina con `.gitignore`. |
| `graphify-out/` | Salida generada por `/graphify` (grafo, caches, reportes). No se edita a mano. |

## `docs/` — documentación y fuentes

```
docs/
├── estructura-repositorio.md   # este archivo
├── fuentes/                    # originales sin convertir — respaldo, NO se leen ni indexan
│   ├── Cuestionario IPPU UTEC, respuestas.docx
│   ├── Documento de trabajo.docx
│   ├── Fundaciones Internacionales que financian proyectos TEA-Neurodivergencia.pdf
│   ├── Guia_Relevamiento.docx
│   ├── HCE_IPPU_Prototipo_v1.html   # excepción: se cita desde acá, no tiene conversión (ver abajo)
│   ├── IPPU.pdf
│   ├── IPPU_UTEC_Presentacion_13.05.2026.pptx
│   ├── Proyectos, Investigaciones y Oportunidades de Desarrollo.pdf
│   ├── escala-del-inventario-del-espectro-autista-idea.pdf
│   ├── prototipo-v4/            # Prototipo v4 de IPPU (ago-2026) — fuente normativa de la ronda M12
│   │   ├── HCE_IPPU_Prototipo_v4.html    # original bajado de la URL publicada (406 KB, app JS)
│   │   └── prototipo-v4-catalogos.json   # 32 constantes extraídas del HTML (sin los 2 base64, D3)
│   └── reuniones/               # actas de reunión (XLSX)
├── markdown/                    # conversiones .md de docs/fuentes/ — fuente de lectura y cita
│   ├── 1_documento-tecnico-utec-lidia.md   # Documento Técnico IPPU v1.0 (fuente normativa vigente)
│   ├── Cuestionario IPPU UTEC, respuestas.md
│   ├── Documento de trabajo.md
│   ├── Fundaciones Internacionales que financian proyectos TEA-Neurodivergencia.md
│   ├── Guia_Relevamiento.md
│   ├── IPPU.md
│   ├── IPPU_UTEC_Presentacion_13.05.2026.md
│   ├── Proyectos, Investigaciones y Oportunidades de Desarrollo.md
│   ├── Reunión IPPU_UTEC - 2026_05_13 ....md
│   ├── Reunión Proyecto IPPU - 2026_05_20 ....md
│   ├── Reunión Proyecto IPPU - 2026_05_27 ....md
│   ├── escala-del-inventario-del-espectro-autista-idea.md
│   ├── hce_idea_ippu_demo.md
│   ├── modelo-datos.md          # propuesta Postgres+JSONB de un integrante — registrada, no adoptada
│   └── prototipo-v4-referencia.md   # versión legible y citable del Prototipo v4 (extraída por script)
├── notas/
│   ├── consulta-a-ippu.md       # cuestionario no técnico, versión para enviar a IPPU
│   └── puntos-a-validar.md      # versión interna: qué no está confirmado y qué bloquea
└── planes/
    ├── PLAN-modular-adaptacion-HCE-2026-07.md    # ronda M0–M11 (adaptación al Documento Técnico)
    └── PLAN-M12-absorcion-prototipo-v4-2026-08.md # ronda M12 (absorción del Prototipo v4) — vigente
```

Notas:
- **Regla de conversión:** una vez que un original en `docs/fuentes/` tiene su `.md` en `docs/markdown/`,
  se trabaja siempre con el `.md`. Los originales quedan solo como respaldo verificable (por eso
  `docs/fuentes/` está en `.graphifyignore`: indexar las dos copias duplica costo sin agregar información).
- **Excepción:** los prototipos de IPPU son apps JS y Docling solo rinde su shell vacío, así que **no se
  convierten con Docling**.
  - `HCE_IPPU_Prototipo_v1.html` no tiene conversión de ningún tipo: se cita desde su ruta original.
  - `prototipo-v4/HCE_IPPU_Prototipo_v4.html` **sí tiene versión legible**, producida por script
    (`herramientas/extraer_prototipo_v4.js`) en lugar de por Docling: `docs/markdown/prototipo-v4-referencia.md`
    (narrativa) y `docs/fuentes/prototipo-v4/prototipo-v4-catalogos.json` (los datos). La regla se cumple
    igual: se lee y se cita desde `docs/markdown/`, y el HTML queda solo como respaldo.
- **`docs/fuentes/prototipo-v4/`** es la única subcarpeta de `fuentes/` con original **y** datos extraídos
  juntos. El JSON no incluye `CLINICA_HTML_B64` ni `TALLER_HTML_B64` (Clínica y Taller Terapéutico están
  fuera de alcance — `handoff.md` §5.12 / D3); si el alcance cambia, se extraen del HTML.
- **`docs/planes/`** agrupa los planes de ronda de trabajo (documentos de alcance/roadmap para una
  ronda concreta, distintos de la bitácora continua de `handoff.md`). Nuevos planes van acá.

## `implementacion/L1-hce-idea/` — Línea 1 (foco actual)

```
implementacion/
└── L1-hce-idea/
    ├── demo/          # prototipo frontend, datos simulados, sin backend
    └── backend/       # API FastAPI + SQLAlchemy + Alembic + PostgreSQL
```

### `demo/`

```
demo/
├── index.html            # markup de la demo — se abre directo en el navegador
├── css/
│   └── estilos.css
├── js/                    # 12 módulos; EL ORDEN DE CARGA en index.html ES la semántica
│   ├── utils.js           # helpers compartidos — lo tocan todos, coordinar antes
│   ├── ui-core.js
│   ├── datos.js
│   ├── catalogos.js
│   ├── flujo.js
│   ├── wizard-nna.js
│   ├── expediente.js
│   ├── evaluaciones.js
│   ├── informe-cierre.js
│   ├── grupos-usuario.js
│   ├── recordatorios.js
│   └── hce-doc-org-vf.js
└── verificacion/          # harness de verificación E2E (Playwright)
    ├── README.md
    ├── comparar.js
    ├── fingerprint.js
    ├── .gitignore          # ignora node_modules/, package-lock.json y los *.json de fingerprints
    └── node_modules/       # se instala local a demanda, no versionado
```

### `backend/`

```
backend/
├── README.md              # cómo levantar el backend (Docker + venv + alembic + uvicorn)
├── .env / .env.example     # config local (.env no versionado)
├── .gitignore
├── docker-compose.yml      # Postgres 16 en 127.0.0.1:5440
├── docker/
│   └── initdb/
│       └── 00-crear-base-test.sql   # crea la base ippu_test (aislada) al levantar el contenedor
├── alembic.ini
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│       └── f6ca521bcc6a_esquema_v2_inicial_m11_2.py   # migración única del esquema v2 (28 tablas)
├── app/
│   ├── main.py             # entrypoint FastAPI
│   ├── core/
│   │   ├── config.py        # settings; rechaza cualquier DATABASE_URL que no sea Postgres
│   │   └── database.py
│   ├── models/               # SQLAlchemy — 28 tablas del esquema v2
│   │   ├── catalogos.py
│   │   ├── identidad.py
│   │   ├── modulos.py
│   │   └── transversales.py
│   ├── schemas/              # Pydantic (pendiente: M11.3/M11.4)
│   ├── routers/               # endpoints REST (pendiente: M11.4)
│   ├── data/
│   │   └── catalogos_iniciales.json   # generado desde la demo — no editar a mano
│   └── seed_catalogos.py
├── docs/
│   ├── esquema-datos.md        # esquema v1 (histórico, backend v1 retirado)
│   ├── esquema-datos-v2.md      # esquema v2 vigente — leer antes de tocar app/models/
│   └── ejemplos-endpoints.md
├── pytest.ini                   # pythonpath=. → que `pytest -q` funcione tal como está documentado
├── tests/
│   ├── conftest.py
│   └── test_esquema_v2.py       # tests estructurales contra Postgres (21)
├── requirements.txt
├── .venv/                       # entorno virtual local, no versionado
└── .pytest_cache/               # no versionado
```

Notas:
- **Requisito de arranque:** `docker compose up -d` (Postgres) antes de correr Alembic o `uvicorn`. Ver
  el arranque paso a paso en `CLAUDE.md` (sección "Stack objetivo de L1") y en `backend/README.md`.
- **`app/schemas/` y `app/routers/`** existen como paquetes vacíos a la espera de M11.3 (servicios y
  guards) y M11.4 (routers) — ver `handoff.md` §6 para el estado exacto.
- **Catálogos:** `app/data/catalogos_iniciales.json` se genera desde la demo, nunca se edita a mano.

## `herramientas/`

| Ruta | Qué es |
|---|---|
| `herramientas/conversor_docling.py` | Convierte `docs/fuentes/*` → `docs/markdown/*.md` (Docling). Uso en `CLAUDE.md`. |
| `herramientas/extraer_prototipo_v4.js` | `node herramientas/extraer_prototipo_v4.js` → regenera `docs/fuentes/prototipo-v4/prototipo-v4-catalogos.json` desde la URL publicada del Prototipo v4. Existe para **diffear** si IPPU publica una v5, no para correrlo de rutina. |

## `graphify-out/`

Salida generada de `/graphify` (grafo de conocimiento del repo): `graph.json`, `graph.html`,
`GRAPH_REPORT.md`, `manifest.json` y caches. Se regenera con el skill; no se edita a mano y partes de
su caché están excluidas de git (ver `.gitignore`).
