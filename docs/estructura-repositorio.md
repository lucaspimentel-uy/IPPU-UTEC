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
│       └── 9246e659d2c9_esquema_v2_inicial_m12_7.py   # migración única del esquema v2 (38 tablas)
│           # se regenera —el mismo archivo, sin apilar revisiones— al cerrar cada sub-módulo de M12
├── app/
│   ├── main.py             # entrypoint FastAPI
│   ├── core/
│   │   ├── config.py        # settings; rechaza cualquier DATABASE_URL que no sea Postgres
│   │   ├── constantes.py    # texto fijo que NO es catálogo (Likert, VF, prestaciones, vocabulario)
│   │   └── database.py
│   ├── models/               # SQLAlchemy — 38 tablas (28 de M11.2 + 5 de M12.1 + 2 de M12.2
│   │                         #  − hce_taller, retirada en M12.3: handoff §5.20
│   │                         #  + 2 de M12.4; ahí se retiró la COLUMNA hce_diurna.nivel_soporte,
│   │                         #    que no mueve el conteo de tablas: handoff §5.24
│   │                         #  + 2 de M12.7: ateneo + ateneo_acuerdo, handoff §5.25/§5.26)
│   │   ├── ateneo.py         # Ateneos clínicos y jornadas (M12.7): ateneo + ateneo_acuerdo
│   │   │                     # AT_TIPOS es CONSTANTE, no catálogo: es el discriminador de los 5 CHECK
│   │   ├── catalogos.py
│   │   ├── identidad.py
│   │   ├── mixins.py         # OrigenMigracionMixin (metadatos de dato migrado, §10)
│   │   │                     # (Firma/Evaluadores/PuntuacionConsenso viven en modulos.py)
│   │   ├── modulos.py
│   │   ├── severidad.py      # HCE-SEV (M12.4): severidad_dsm + su catálogo severidad_nivel
│   │   │                     # archivo propio: no es flujo firmable ni catálogo paramétrico
│   │   └── transversales.py
│   ├── schemas/              # Pydantic (pendiente: M11.3/M11.4)
│   ├── routers/               # endpoints REST (pendiente: M11.4)
│   ├── data/
│   │   └── catalogos_iniciales.json   # generado por herramientas/generar_catalogos_backend.py
│   └── seed_catalogos.py
├── docs/
│   ├── esquema-datos.md        # esquema v1 (histórico, backend v1 retirado)
│   ├── esquema-datos-v2.md      # esquema v2 vigente — leer antes de tocar app/models/
│   └── ejemplos-endpoints.md
├── pytest.ini                   # pythonpath=. → que `pytest -q` funcione tal como está documentado
├── tests/
│   ├── conftest.py
│   ├── test_esquema_v2.py       # tests estructurales de M11.2 + coincidencia modelos ↔ migración
│   ├── test_m12_catalogos.py    # M12.1: grupo/D9, bandas, Δ, catálogos IDEA, seed, vocabulario
│   ├── test_m12_consenso.py     # M12.2 · D7: puntuación independiente, diferencia, NS tipado
│   ├── test_m12_talleres.py     # M12.3 · D5: los 14, `activo` derivado, sin FK a taller.id
│   ├── test_m12_severidad.py    # M12.4: HCE-SEV, aislamiento en las dos direcciones, FKs con índice
│   └── test_m12_ateneos.py      # M12.7: los 4 tipos, los 5 CHECK, correlativo, codigo/sensible derivados
│                                # (240 en verde, 0 salteados — requieren el contenedor arriba)
├── requirements.txt
├── .venv/                       # entorno virtual local, no versionado
└── .pytest_cache/               # no versionado
```

Notas:
- **Requisito de arranque:** `docker compose up -d` (Postgres) antes de correr Alembic o `uvicorn`. Ver
  el arranque paso a paso en `CLAUDE.md` (sección "Stack objetivo de L1") y en `backend/README.md`.
- **`app/schemas/` y `app/routers/`** existen como paquetes vacíos a la espera de M11.3 (servicios y
  guards) y M11.4 (routers) — ver `handoff.md` §6 para el estado exacto.
- **Catálogos:** `app/data/catalogos_iniciales.json` lo genera `herramientas/generar_catalogos_backend.py`
  (`--check` valida que el del repo esté al día); nunca se edita a mano. Lo que **no** es catálogo va a
  `app/core/constantes.py`, con el criterio tabla-vs-constante escrito en su docstring.
- **Migraciones (regla enmendada el 2026-08-14, `handoff.md` §5.19):** la migración inicial **única** se
  regenera **al cerrar cada sub-módulo de M12**, con `test_la_migracion_coincide_con_los_modelos` en verde.
  Se regenera el mismo archivo, no se apilan revisiones. Sólo se congela si hay trabajo en paralelo real
  sobre `app/models/`, y ahí la descongela y regenera una sola persona al terminar.

## `herramientas/`

| Ruta | Qué es |
|---|---|
| `herramientas/conversor_docling.py` | Convierte `docs/fuentes/*` → `docs/markdown/*.md` (Docling). Uso en `CLAUDE.md`. |
| `herramientas/generar_catalogos_backend.py` | `python herramientas/generar_catalogos_backend.py` → genera `backend/app/data/catalogos_iniciales.json` desde la demo v4.1 y el Prototipo v4. Con `--check` no escribe: falla si el archivo del repo quedó desfasado (sirve para CI y para detectar ediciones a mano). |
| `herramientas/extraer_prototipo_v4.js` | `node herramientas/extraer_prototipo_v4.js` → regenera `docs/fuentes/prototipo-v4/prototipo-v4-catalogos.json` desde la URL publicada del Prototipo v4. Existe para **diffear** si IPPU publica una v5, no para correrlo de rutina. |

## `graphify-out/`

Salida generada de `/graphify` (grafo de conocimiento del repo): `graph.json`, `graph.html`,
`GRAPH_REPORT.md`, `manifest.json` y caches. Se regenera con el skill; no se edita a mano y partes de
su caché están excluidas de git (ver `.gitignore`).
