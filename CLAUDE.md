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
│   ├── fuentes/               # Sólo 2 archivos desde la purga del 2026-08-20 (handoff.md §5.29):
│   │                          #  el Prototipo v1 (sin conversión, es app JS) y el cuestionario
│   │                          #  respondido por IPPU (prueba primaria). Respaldo, NO se leen.
│   ├── prototipo-v4/          # HTML del Prototipo v4 + prototipo-v4-catalogos.json (32 constantes).
│   │                          #  FUERA de fuentes/ a propósito (§5.30): esto SÍ se lee — lo consume
│   │                          #  herramientas/generar_catalogos_backend.py como insumo de build.
│   ├── markdown/              # Conversiones .md de las fuentes — leer y citar SIEMPRE desde acá
│   │   └── prototipo-v4-referencia.md   # qué hay dentro del Prototipo v4 y dónde (fuente normativa M12)
│   ├── notas/                 # puntos-a-validar.md (interno) · consulta-a-ippu.md — SNAPSHOT de lo
│   │                          #  enviado el 19/08, sin respuesta. El equipo le sacó 3 preguntas al
│   │                          #  revisarlo y renumeró de §2.7 y §3.2 en adelante (§5.34): citar por
│   │                          #  la numeración de ese archivo, que es la que IPPU tiene delante.
│   ├── planes/                # Planes de ronda (M0–M11 · PLAN-M12 · agenda-reunion-ippu-2026-08.md)
│   └── prompts/               # Prompts de sesión (los que antes vivían sueltos en la raíz)
├── implementacion/
│   └── L1-hce-idea/           # Línea 1 (foco)
│       ├── demo/            # Prototipo front (datos simulados, sin backend)
│       │   ├── index.html   # markup · css/estilos.css · js/*.js (14 módulos, orden de carga = semántica)
│       └── backend/          # API FastAPI + SQLAlchemy + Alembic (ver backend/README.md)
│           ├── app/          # main, core (config/db), models (+severidad.py, M12.4), schemas, routers
│           ├── alembic/      # migraciones · docs/ (esquema-datos-v2.md — los dos docs del v1 se
│           │                 #  borraron el 2026-08-20: describían la API retirada en M11.2)
│           └── tests/        # pytest (base aislada)
└── herramientas/
    ├── conversor_docling.py            # Conversor de documentos → Markdown (Docling)
    ├── extraer_prototipo_v4.js         # Regenera los catálogos del Prototipo v4 desde su URL (para diffear una v5)
    ├── generar_catalogos_backend.py    # Genera app/data/catalogos_iniciales.json (`--check` para validar)
    └── verificar_estado.py             # Mide el repo y lo compara con lo que la doc afirma (`--check`)
```

## Convertir documentos a Markdown
El conversor usa [Docling]. Salida recomendada: `docs/markdown/`.
```bash
# Un archivo
python herramientas/conversor_docling.py "docs/fuentes/UnDocumento.pdf" -o "docs/markdown"
# Varios / una carpeta entera (batch). -r para recursivo, --overwrite para rehacer.
python herramientas/conversor_docling.py "docs/fuentes" -o "docs/markdown"
```
Por defecto omite los `.md` ya existentes. Si no se pasa `-o`, escribe en `./markdown_convertido`.
Si el PDF es escaneado, Docling aplica OCR (la primera corrida descarga modelos y tarda).

**Regla: una vez convertido, se trabaja con el `.md`.** Desde el **2026-08-20** la regla se aplicó hasta el
final: los originales que ya tenían conversión **se borraron** (`handoff.md` §5.29), porque el respaldo
verificable lo da la historia de git —precedente §5.5— y conservar las dos copias sólo duplicaba el peso.
En `docs/fuentes/` quedan **dos** archivos, cada uno por un motivo escrito:
- `HCE_IPPU_Prototipo_v1.html` — no tiene conversión a propósito (es una app JS y Docling rinde sólo el
  shell vacío); se cita desde su ruta original.
- `Cuestionario IPPU UTEC, respuestas.docx` — prueba primaria de lo que IPPU contestó por escrito (§5.31).

La carpeta sigue excluida del grafo vía `.graphifyignore`. ⚠️ **`docs/prototipo-v4/` NO está bajo
`fuentes/`** y no es respaldo: es **insumo de build** y el código lo lee (§5.30).

**Si borrás un original, borrá también su `.md` si nadie lo consume** — y verificá con un grep antes, que
es exactamente lo que destapó que `IPPU.md` no lo leía nadie.

## Dominio mínimo (IDEA)
4 escalas → **12 dimensiones (D1–D12)**, cada una **0–8**, total **0–96** (menor = mejor).
Ciclo: IDEA completa enero/noviembre + intermedia Likert en junio (`equiv. IDEA = (5 − promedio)×2`).
Detalle completo en `handoff.md` §3 y en `docs/markdown/escala-del-inventario-del-espectro-autista-idea.md`.

## Stack objetivo de L1
React + Tailwind (frontend) · FastAPI o Node (API REST, JWT por terapeuta) · PostgreSQL · Docker.

**Backend** (`implementacion/L1-hce-idea/backend/`): **Python + FastAPI + SQLAlchemy + Alembic + PostgreSQL**. Correr: `cd` al backend → **`docker compose up -d`** (Postgres 16 en `127.0.0.1:5440`) → `.venv\Scripts\Activate.ps1` → `alembic upgrade head` → `python -m app.seed_catalogos` → `uvicorn app.main:app --reload` (docs en `/docs`). Tests: `pytest -q` (base `ippu_test`, aislada). **Docker es requisito**: `config.py` rechaza al arrancar cualquier `DATABASE_URL` que no sea Postgres, y desde el 2026-08-15 una **guardia de sesión** en `tests/conftest.py` **aborta `pytest` con exit 1** si el contenedor no está arriba, si la base de desarrollo está vacía o si no está en el head — cada caso con el comando que lo arregla. Antes se salteaba y la corrida devolvía **exit 0** con la mitad de los tests sin correr; **ya no hay ningún `skip`**. Una corrida válida es **389 passed, 0 skipped** (eran 307 hasta M12.6): si ves «skipped», algo está mal.

**Ronda en curso — M12 (absorción del Prototipo v4), intercalada entre M11.2 y M11.3.**
Rige `docs/planes/PLAN-M12-absorcion-prototipo-v4-2026-08.md`; fuente normativa nueva: Manual de
Procedimientos v1.0 + Prototipo v4 (`handoff.md` §5.10, por encima del Documento Técnico). Toca la misma
capa que M11.2 —modelos, migración inicial, catálogos— por eso va antes de escribir servicios. Leer también
`docs/markdown/prototipo-v4-referencia.md`. **M11.3–M11.6 se retoman al cerrar M12.**
- **M12.0 a M12.4 y M12.7 HECHOS** (2026-08-15): **38 tablas**, 6 catálogos nuevos, D9 (`grupo`) implementada, la
  **puntuación independiente de los dos técnicos** con su registro de consenso (D7, §5.16 — ⚠️ **agregado
  nuestro, no del prototipo**; el guard de «diferencia ≥2 exige documentación» va a **M11.3**, y kappa
  **no** se calcula todavía), el **catálogo dinámico de talleres** con los 14 reales (D5, M12.3) y
  **HCE-SEV** (M12.4): `severidad_dsm` **0..1 por expediente** (dos dominios independientes 1–3, con
  justificación / fecha / profesional obligatorios) + `severidad_nivel` (3 grados, etiquetas **derivadas**).
  ⚠️ **El conteo se movió dos veces y ninguna fue regresión:** M12.3 lo bajó de 35 a 34 —no crea tablas y
  **retira `hce_taller`** (§5.20), resto de v1; la participación la crea M12.6 como `pai_taller`, **por
  nombre**— y M12.4 lo subió a 36 con las dos tablas nuevas, retirando además la **columna**
  `hce_diurna.nivel_soporte` (§5.24: era una tercera fuente de verdad sobre el nivel DSM), y **M12.7**
  lo llevó a **38** con `ateneo` + `ateneo_acuerdo` (una sola entidad con campos según tipo; `AT_TIPOS`
  entró como **constante** y no como catálogo, porque el tipo es el discriminador contra el que están
  escritos los 5 CHECK; `codigo` y `sensible` son **derivados**). M12.7 dejó además **§5.25** (HCE-DOC
  con alcance institucional: `documento.hce_id` nullable + `ateneo_id` + XOR) y **§5.26** (nomenclatura
  **`hce_id` = pertenencia / `hce_<calificador>_id` = referencia**, que **M12.6 hereda**).
  **240 tests** al cerrar M12.7.
- **M12.5 HECHO** (2026-08-26): **HCE-INC · inclusión educativa y social**. **42 tablas** — `inclusion`
  (ficha) + `inclusion_bitacora` (gestiones) + dos catálogos, `estado_inclusion` (7 filas) y
  `catalogo_centro_educativo` (**0 filas, a propósito**). Los otros cuatro vocabularios (`INC_TIPOS`,
  `INC_TEMAS`, `INC_MEDIOS`, `INC_ROLES`) son **constantes con CHECK, no catálogos**, y `sensible` es
  **derivado** de `INC_TEMAS` — significa **restringido para COMPARTIR, no para guardar** (§5.39/§5.45), y
  hoy es una clasificación **sin efecto**, porque el modelo todavía no representa la divulgación. Tres
  decisiones nuevas: **§5.50** (cómo se lee una fuente que es a la vez especificación y demo — **M12.6 y
  M12.8 la heredan**), **§5.51** (el estado de inclusión es **continuo**, no anual) y **§5.52**
  (`inclusion.centro` es **texto, no FK**). **307 tests**, migración `aa26917b6e76`.
- **M12.6 HECHO** (2026-09-02) — **HCE-PAI · Propuesta de Atención Individual**, en modo **SOLO
  ESQUEMA**. **50 tablas**: `pai` (43 campos propios) + siete hijas — `pai_objetivo`,
  `pai_evaluacion_previa`, `pai_equipo`, `pai_coordinacion`, `pai_taller`, `pai_prestacion` y
  `pai_circuito`. **389 tests**, migración `72b96030362d`.
  - **§5.54** reencuadró el bloqueo de §5.28: de las 13 secciones del Manual que se daban por faltantes,
    **11 están en el `const MANUAL` del Prototipo v4** y el **Anexo A** resultó ser «cálculo de totales y
    deltas con verificación antes de firmar» — o sea **M11.3, no esquema**. ⚠️ **§4 y §8 siguen sin
    identificar** (`puntos-a-validar.md` §1.16); son de **Marco general** e **IDEA**, no del PAI.
  - **§5.55** — la carga única es **por campo, no por sección**: `ingreso_ippu` (§I) y los seis campos
    editables de §II (`padron_inau`, `disposicion`, `judicial`, `expediente`, `derivado_por`, `motivo`)
    **son columnas propias de `pai`**, porque HCE-ORG no tiene dónde guardarlas.
  - **§5.56** — `PAI_AREAS`, `PAI_PREST` y `PAI_CIRCUITO` son **constantes con CHECK, no catálogos**: el
    prototipo le da 4 funciones de gestión a `CAT_TALLERES` y **cero** a estas tres.
  - ⚠️ **Ningún guard**: los guards (habilitación de §IX por tipo, Anexo A, «qué IDEA rige») son **M11.3**.
  - ⚠️ **`pai` NO lleva `UNIQUE(hce_id, anio)`** (§5.22): hay más de un PAI por año.
- **Queda sólo M12.8** para cerrar la ronda. Con M12.5, M12.6 y M12.7 hechos **ya no hay trabajo en
  paralelo sobre `app/models/`**, así que §5.19 no congela nada.
- ⚠️ **Regla de migraciones de la ronda, enmendada el 2026-08-14 (`handoff.md` §5.19):** la migración
  inicial **única** se regenera **al cerrar cada sub-módulo**, con `test_la_migracion_coincide_con_los_modelos`
  **en verde** (ya no se saltea). Se congela **sólo si hay trabajo en paralelo real** sobre `app/models/`,
  y ahí la descongela y regenera una sola persona al terminar el paralelo.
- Los catálogos se regeneran con **`python herramientas/generar_catalogos_backend.py`** (`--check` valida
  que el JSON del repo esté al día). Lo que **no** es catálogo —Likert, dominios de VF, prestaciones,
  vocabulario— vive en `app/core/constantes.py`, con el criterio escrito en su docstring.

**M11 (backend v2).** Sin dueño exclusivo (`handoff.md` §5.6). Decisiones cerradas (`handoff.md` §5.2, **no reabrir sin acuerdo del equipo**): **Postgres-only** · **lógica de negocio en el servidor** (Pydantic + servicios, **sin triggers PL/pgSQL**; la BD sólo garantiza integridad estructural) · **portabilidad paramétrica mínima**.
- **HECHO (2026-08-07):** **M11.1** infra + **M11.2** modelos (28 tablas en `app/models/{catalogos,identidad,modulos,transversales}.py`), migración inicial única y catálogos. El backend v1 **se retiró entero** (hablaba del modelo pre-Documento Técnico). Verificado: **21 tests estructurales**.
- **FALTA:** **M11.3** servicios y guards (§4 del esquema: secuencia, firma=bloqueo, Δ sólo B−A, baremo sólo desde `pct`, fotos §8.4) → **M11.4** routers → **M11.5** seed espejo de la demo + pytest → **M11.6** docs. Después: Fase 3 (demo↔API), Fase 4 (JWT), Fase 6 (Docker completo).
- **Al tocar los modelos, leer primero `backend/docs/esquema-datos-v2.md`** (§2 tablas, §4 dónde vive cada regla). Los catálogos de `app/data/catalogos_iniciales.json` **se generan** con `herramientas/generar_catalogos_backend.py`, no se editan a mano.
- **Antes de dar algo por definido, mirar `docs/notas/puntos-a-validar.md`**: hay supuestos tomados por nosotros que IPPU todavía no confirmó.

## Reglas importantes
- **Solo datos simulados/anonimizados** hasta que exista acuerdo de confidencialidad firmado con IPPU.
- Datos de NNA = sensibles: nunca subir identificadores/imágenes reales a servicios externos sin evaluación.
- La IA **apoya**, no reemplaza, el juicio clínico.
- **Al terminar una sesión con cambios relevantes, actualizar `handoff.md`** (§5 decisiones, §6 pendientes, §13 bitácora) y pushear a los dos remotos.
