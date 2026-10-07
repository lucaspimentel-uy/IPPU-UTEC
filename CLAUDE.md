# CLAUDE.md — Guía para Claude en el proyecto IPPU

> Contexto operativo para asistir en el proyecto **IPPU × UTEC-LIDIA**.
> **Antes de trabajar, leer también `handoff.md`** (estado vivo del proyecto entre sesiones).
>
> Este archivo está **versionado y es compartido por el equipo** (Lucas · Samuel · Victor) desde el
> 2026-08-03: lo tienen los tres al clonar, y aplica igual en la sesión de cualquiera.

## Arranque de sesión (obligatorio)
1. `git pull` y leer la **cabecera de `handoff.md`** (una pantalla: qué funciona, próxima rebanada,
   bloqueos) y el **§6** de la rebanada que se toma. **Hasta el 2026-11-26 rige la documentación mínima
   (`handoff.md` §5.114, enmienda §5.82):** el resto de `handoff.md` (§5, §12) y los documentos largos son
   **referencia**, no lectura obligatoria — se consultan cuando la tarea los toca (la regla
   anti-contradicción de abajo sigue vigente).
2. Mirar en §6 si alguien ya está en eso y trabajar en rama corta. **Desde el 2026-08-07 ningún módulo
   tiene dueño exclusivo** (`handoff.md` §5.6): se avisa qué se toma, no se pide permiso.
3. **La demo está modularizada** (`demo/index.html` + `demo/css/` + `demo/js/*.js`, 2026-08-07): se puede
   trabajar en paralelo **siempre que cada uno tome archivos distintos** de `demo/js/`. Avisar qué archivo
   se toma (§12.3). `index.html` y `js/utils.js` los tocan todos → coordinar antes.
4. Al terminar: verificar (pytest / Playwright) y escribir **sólo** (§5.114): la entrada de **`docs/bitacora.md`**
   (≤ 15 líneas), la casilla de **§6** tildada, un **§5** únicamente si se tomó una decisión, y la **cabecera de
   `handoff.md`** al día (≤ 15 líneas). **Sin notas, relevamientos ni resúmenes nuevos.** Después, commit + push
   **a los dos remotos** (`gitlab` y `origin`).

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
├── handoff.md                 # Estado, decisiones (§5) y pendientes (§6) — LEER PRIMERO. §13 bitácora → docs/bitacora.md
├── CLAUDE.md                  # Este archivo
├── README.md                  # Overview para humanos
├── docs/
│   ├── bitacora.md            # Bitácora de sesiones — EL REGISTRO (era §13 de handoff.md; mudada 2026-09-09, §5.84). NO se corrige.
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

⚠️ **Para el 26/11/2026 el frontend es la demo HTML existente conectada a la API** (Fase 3), no React: React + Tailwind es **posterior al 26/11** (`handoff.md` §5.106, 2026-10-05).

**Backend** (`implementacion/L1-hce-idea/backend/`): **Python + FastAPI + SQLAlchemy + Alembic + PostgreSQL**. Correr: `cd` al backend → **`docker compose up -d`** (Postgres 16 en `127.0.0.1:5440`) → `.venv\Scripts\Activate.ps1` → `alembic upgrade head` → `python -m app.seed_catalogos` → `uvicorn app.main:app --reload` (docs en `/docs`). Tests: `pytest -q` (base `ippu_test`, aislada). **Docker es requisito**: `config.py` rechaza al arrancar cualquier `DATABASE_URL` que no sea Postgres, y desde el 2026-08-15 una **guardia de sesión** en `tests/conftest.py` **aborta `pytest` con exit 1** si el contenedor no está arriba, si la base de desarrollo está vacía o si no está en el head — cada caso con el comando que lo arregla. Antes se salteaba y la corrida devolvía **exit 0** con la mitad de los tests sin correr; **ya no hay ningún `skip`**. Una corrida válida es **600 passed, 0 skipped** (307 al cerrar M12.5, 389 al cerrar M12.6, 432 al cerrar M12.8a, 434 al cerrar M12.8, 435 al cerrar M12, 501 al cerrar M11.3-a, 521 al cerrar M11.3-a2, 539 al cerrar M11.3-a3, 600 al cerrar M11.3-b): si ves «skipped», algo está mal.

**Ronda M12 (absorción del Prototipo v4) — CERRADA el 2026-09-16**, intercalada entre M11.2 y M11.3.
Rige `docs/planes/PLAN-M12-absorcion-prototipo-v4-2026-08.md`. Toca la misma capa que M11.2 —modelos,
migración inicial, catálogos— por eso fue antes de escribir servicios. Leer también
`docs/markdown/prototipo-v4-referencia.md`. **Sigue ahora M11.3** — única excepción registrada de M12:
**M12.8b-3b, CANCELADA** (pase de vocabulario, `handoff.md` §6). ⚠️ **Cambio de alcance, 2026-09-16
(Lucas, sesión M12.8-cierre+I1), asentado en `handoff.md` §5.92:** el Prototipo v4 y la demo v4.1
**dejaron de ser fuente normativa** — son insumo a consultar, no especificación a la que converger.
Motivo: §5.37 encontró relleno generado dentro del propio prototipo, leído como fuente, y se confirmó que
el mismo autor genera con IA el material de la línea L3. El párrafo de "Precedencia normativa" de abajo
ya refleja esto.

**Precedencia normativa — enmendada el 2026-09-16 (`handoff.md` §5.92, deroga a §5.10/L9).** Normativo es
lo que IPPU dijo sobre sí misma: el acta de la reunión del 2026-08-26 (`handoff.md` §5.36–§5.49 / serie
I), **sus respuestas escritas del 2026-10-05** (`docs/notas/respuestas-ippu-2026-10-05.txt`, §5.93 — nivel 0, junto al acta), el cuestionario respondido por escrito el 15/06, el Protocolo de acceso/confidencialidad/resguardo de
la HC (`docs/markdown/protocolo-acceso-confidencialidad-resguardo-hce.md` — matriz de roles §5,
procedimientos de divulgación §6, trazabilidad §8, Anexo II acuerdo de confidencialidad), el Manual de
Procedimientos institucional y el Documento Técnico. **En conflicto, gana el acta del 2026-08-26 y
cualquier decisión posterior**; los demás son autoritativos para todo lo que el acta no tocó. **El
Prototipo v4 y la demo v4.1 (IPPU, ago-2026) NO están en esta lista**: se consultan como insumo —se les
extrae información útil— pero no se modela ni se siembra nada sólo porque aparece ahí; la verificación
real de los catálogos propios de IPPU la da IPPU, no el prototipo.
- **M12.0 a M12.4 y M12.7 HECHOS** (2026-08-15): **38 tablas**, 6 catálogos nuevos, D9 (`grupo`) implementada, la
  **puntuación independiente de los dos técnicos** con su registro de consenso (D7, §5.16 — ⚠️ **agregado
  nuestro, no del prototipo**; el guard de «diferencia ≥2 exige documentación» **salió de M11.3 el 2026-10-05** —IPPU registra un solo número de consenso, §5.98— y el kappa **no es calculable** con su práctica), el **catálogo dinámico de talleres** con los 14 reales (D5, M12.3) y
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
  ESQUEMA**. `pai` (39 campos propios — 43 en M12.6; la sección VII/FODA salió en
  M12.8a, §5.59) + siete hijas — `pai_objetivo`,
  `pai_evaluacion_previa`, `pai_equipo`, `pai_coordinacion`, `pai_taller`, `pai_prestacion` y
  `pai_circuito`. Cerró en 50 tablas · 389 tests · migración `72b96030362d` (2026-09-02).
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
- **M12.8a HECHO** (2026-09-03) — deltas de esquema/seed de la serie L + L9. M12.8a-1 (§VII/FODA fuera de
  `pai`, cinco nombres reales de grupo, `ateneo.observaciones`) y M12.8a-3 (`divulgacion` §5.80 — registro
  de divulgación de datos, append-only, sin seed). ⛔ **`tecnico_grupo` se difirió a M11.3 (§5.79) y el 2026-10-05 se CANCELÓ** (§5.100: IPPU no necesita historial de asignaciones ni referente por NNA; `btree_gist` cerrado).
- **M12.8b HECHO** (2026-09-16, sesión M12.8-cierre+I1) — docs (`esquema-datos-v2.md` a **v3**, §5.81;
  README; `estructura-repositorio.md`), el seed de **catálogos** (`categoria_documento` re-sembrado desde
  el Prototipo v4 verbatim; el resto de `DESDE_LA_DEMO` se queda, con motivo anotado en el código — el
  Prototipo v4 dejó de ser fuente normativa, ver arriba) y los guards de M12.1–M12.7 auditados (un hueco
  real corregido en `puntuacion_idea`). **No** es el seed espejo (eso es M11.5). Estado final: **51
  tablas**, **600 tests en verde y 0 salteados** (435 al cerrar M12: 434 de M12.8 + 1 de I1; +66 de M11.3-a; +20 de M11.3-a2; +18 de M11.3-a3; +61 de M11.3-b), migración
  `dcc838486407`, un solo archivo en `versions/`. **Única excepción registrada: M12.8b-3b** (pase de
  vocabulario, diferido).
- **I1 HECHO** (2026-09-16, mismo sesión que cierra M12.8, §5.36/§5.91) — `idea.anio` **SmallInteger NOT
  NULL** (mismo tipo que `grupo.anio`) + `UniqueConstraint(hce_id, anio)` (`uq_idea_hce_anio`, mismo patrón
  que `protocolo`/`informe_cierre`). También fija la fila de `esquema-datos-v2.md` §4 y `backend/README.md`
  que seguían con «Δ sólo B−A» (derogada por §5.36). **No** tocó la demo, ni la regla de «cuál IDEA rige»,
  ni abrió `app/services/` — eso sigue siendo M11.3.
- ⚠️ **Regla de migraciones de la ronda, enmendada el 2026-08-14 (`handoff.md` §5.19):** la migración
  inicial **única** se regenera **al cerrar cada sub-módulo**, con `test_la_migracion_coincide_con_los_modelos`
  **en verde** (ya no se saltea). Se congela **sólo si hay trabajo en paralelo real** sobre `app/models/`,
  y ahí la descongela y regenera una sola persona al terminar el paralelo.
- Los catálogos se regeneran con **`python herramientas/generar_catalogos_backend.py`** (`--check` valida
  que el JSON del repo esté al día). Lo que **no** es catálogo —Likert, dominios de VF, prestaciones,
  vocabulario— vive en `app/core/constantes.py`, con el criterio escrito en su docstring.

**M11 (backend v2).** Sin dueño exclusivo (`handoff.md` §5.6). Decisiones cerradas (`handoff.md` §5.2, **no reabrir sin acuerdo del equipo**): **Postgres-only** · **lógica de negocio en el servidor** (Pydantic + servicios, **sin triggers PL/pgSQL**; la BD sólo garantiza integridad estructural) · **portabilidad paramétrica mínima**.
- **HECHO (2026-08-07):** **M11.1** infra + **M11.2** modelos (28 tablas en `app/models/{catalogos,identidad,modulos,transversales}.py`), migración inicial única y catálogos. El backend v1 **se retiró entero** (hablaba del modelo pre-Documento Técnico). Verificado: **21 tests estructurales**.
- **FALTA — en REBANADAS VERTICALES** (`handoff.md` §5.106, 2026-10-05; **M11.4 se disuelve**: cada rebanada trae servicio + schema + router + tests): **M11.3-a** cimientos + persona/HCE (**HECHA 2026-10-06**, `handoff.md` §5.108: contrato `{data, warnings}`, una transacción por request) → **M11.3-a2** identidad (N.º de HC asignado, CI canónica) + `GET /grupos`/`/profesionales` (**HECHA 2026-10-06**, §5.109–§5.114) → **M11.3-b** estado de flujo + `warnings` + firma/addendas + validaciones/totales/banda del IDEA → **M11.3-c** PA/PB/IC + Δ + alerta + datos del IC para el PDF → **M11.5-a** seed espejo **vía API** como test ejecutable de §12-A (§5.65) → **M11.3-d** VF/baremo, SEV, INC, documento histórico, foto, **login con 2 roles** (`admin` | `tecnico`) y routers que pidan las pantallas conectadas → **M11.6 reducido** (Swagger reemplaza `ejemplos-endpoints.md`). **Reglas nuevas de IPPU (2026-10-05) que la implementación respeta:** el CI **no traba** (§5.94) · la secuencia **sólo avisa** — `warnings[]` + fila `auditoria` `tipo='excepcion'`; **firma = bloqueo sigue dando 409** (§5.95) · cadena por año LB→PA→PB→IC (§5.96) · **Δ sólo dentro del mismo instrumento** (§5.36) · qué IDEA rige: el de su año, y en la HCE el firmado de mayor `anio` (§5.97) · **puntaje único** (§5.98) · **guardar una foto no requiere nada** (§5.99) · baremo sólo desde `pct`. **Meta: prototipo presentable sin datos reales el 26/11** con la demo HTML conectada. **M11.3 lo toma Lucas** (§5.67). Después: Fase 4 completa (roles y matriz), Fase 6 (Docker completo), React + Tailwind.
- **Al tocar los modelos, leer primero `backend/docs/esquema-datos-v2.md`** (§2 tablas, §4 dónde vive cada regla). Los catálogos de `app/data/catalogos_iniciales.json` **se generan** con `herramientas/generar_catalogos_backend.py`, no se editan a mano.
- **Antes de dar algo por definido, mirar `docs/notas/puntos-a-validar.md`**: hay supuestos tomados por nosotros que IPPU todavía no confirmó.

## Reglas importantes
- **Solo datos simulados/anonimizados** hasta que exista acuerdo de confidencialidad firmado con IPPU.
  Esta regla la respalda ahora el **propio protocolo de IPPU**: `protocolo-…-hce.md` §6.7 exige acuerdo
  de confidencialidad previo para trabajar con datos identificables en el marco del convenio UTEC-LIDIA, y
  su Anexo II trae el modelo de acuerdo. Lo que falta es la **firma** (`puntos-a-validar.md` §1.6).
- Datos de NNA = sensibles: nunca subir identificadores/imágenes reales a servicios externos sin evaluación.
- La IA **apoya**, no reemplaza, el juicio clínico.
- **Al terminar una sesión con cambios relevantes:** la documentación mínima de «Arranque de sesión», punto 4 (§5.114, vigente hasta el 2026-11-26). Pushear a los dos remotos.
