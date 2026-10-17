# Estructura del repositorio

> Mapa de carpetas y rutas del repo IPPU × UTEC-LIDIA: **qué es cada cosa y dónde está**, no contenido de negocio. Para el
> estado y las decisiones, `handoff.md`; para las reglas de trabajo y cómo correr, `CLAUDE.md`. Si una carpeta cambia de
> lugar, actualizar acá y en los mapas resumidos de `README.md` y `CLAUDE.md`.

```
IPPU/
├── handoff.md · CLAUDE.md · README.md
├── .gitattributes · .gitignore
├── docs/
├── implementacion/
│   ├── L1-hce-idea/        # Línea 1 (foco): backend + demo
│   └── L3-asistente-virtual/   # Línea 3 (Samuel)
└── herramientas/
```

## Raíz

| Ruta | Qué es |
|---|---|
| `handoff.md` | Estado vivo entre sesiones: la **cabecera** (una pantalla) dice qué funciona y qué sigue; §5 guarda las decisiones (sólo se agregan), §6 los pendientes abiertos y §7 las preguntas abiertas. La bitácora (§13) vive en `docs/bitacora.md` y deja un stub de redirección (§5.84). |
| `CLAUDE.md` | Reglas vigentes y cómo correr todo. Lo leen las sesiones de Claude Code de los tres. |
| `README.md` | Presentación del proyecto para personas. |
| `.gitattributes` | Finales de línea: el repo guarda **siempre LF** (`text=auto` + `eol=lf`); `.bat`/`.ps1` van en CRLF y los binarios quedan marcados `binary`. |
| `.gitignore` | Venvs, caches, `node_modules/`, capturas y otros temporales. |

## `docs/`

```
docs/
├── bitacora.md             # registro de sesiones, append-only; NO se corrige (§5.84)
├── pendientes-resueltos.md # lo cerrado de §6 y §7, verbatim, con su stub en handoff (§5.84)
├── estructura-repositorio.md   # este archivo
├── guias/
│   └── notas-accesibilidad-ui.md   # contraste, foco y reglas de dominio color↔significado
├── markdown/               # conversiones .md de las fuentes: se lee y se cita desde acá
├── notas/                  # interlocución con IPPU y con el equipo
├── planes/
│   └── L3-asistente-plan.md        # plan de L3
├── fuentes/                # respaldo: 2 archivos, no se leen (§5.29)
└── prototipo-v4/           # insumo de build, SÍ se lee (§5.30)
```

- **`guias/notas-accesibilidad-ui.md`**: se cita por nombre de sección —«Contraste WCAG» (con «Línea base vigente»), «Reglas
  de dominio», «Foco», «Cómo se verifica» y «Pendientes»—, no por número.
- **`markdown/`**: Documento Técnico, Protocolo de acceso/confidencialidad/resguardo, cuestionario respondido, escala IDEA,
  actas de reuniones, `prototipo-v4-referencia.md` y `modelo-datos.md` (propuesta del equipo, registrada y no adoptada). Un
  documento nuevo de IPPU se convierte a Markdown cuando llega y se cita el `.md`.
- **`notas/`**: `puntos-a-validar.md` (interno: qué no está confirmado y qué bloquea) · `preguntas-ippu.md` (lista consolidada
  para el próximo contacto) · `consulta-a-ippu.md` (**snapshot** de lo enviado el 2026-08-19; el equipo le sacó tres
  preguntas al revisarlo y se cita por **su** numeración, §5.34) · `respuestas-reunion-ippu-2026-08-21.md` y
  `respuestas-ippu-2026-10-05.txt` (lo que IPPU contestó; este último es nivel 0, §5.93).
- **`fuentes/`**: `Cuestionario IPPU UTEC, respuestas.docx` (prueba primaria, §5.31) y `HCE_IPPU_Prototipo_v1.html` (sin
  conversión: es una app JS). Recuperables también en el tag `pre-limpieza-2026-08-20`.
- ⚠️ **`prototipo-v4/` no es `fuentes/`, y la diferencia es funcional:** `fuentes/` no se lee; esta carpeta la lee código
  (`herramientas/generar_catalogos_backend.py`). Tiene el HTML original y `prototipo-v4-catalogos.json`. El Prototipo v4 no es
  norma (§5.92): es insumo.

## `implementacion/L1-hce-idea/`

### `demo/` — la demo web, conectada a la API

Se sirve en `http://localhost:5500` (no abre desde un archivo local: el login necesita la API) y habla con la API por
`?api=<url>` (por omisión `:8000`). Lo que no está conectado se ve como «Modo demostración — no se guarda».

```
demo/
├── index.html              # markup y ORDEN DE CARGA de los scripts: ese orden es la semántica
├── css/estilos.css         # tokens (foco, rampa de severidad, estados) y estilos
├── js/                     # 18 módulos, en el orden en que carga index.html:
│   ├── utils.js            #   helpers compartidos y componentes comunes (cargando/error/vacío, diálogos) — lo tocan todos
│   ├── api.js              #   cliente de la API y sesión
│   ├── adaptadores.js      #   funciones puras: respuesta de la API → forma que pinta la demo
│   ├── datos.js            #   expedientes de ejemplo 101–108 (modo demostración)
│   ├── flujo.js            #   motor de flujo de los ejemplos
│   ├── catalogos.js        #   escalas y catálogos de la demo
│   ├── ui-core.js          #   navegación, listado, Likert, analítica
│   ├── wizard-nna.js       #   alta y edición de expedientes (conectado)
│   ├── expediente.js       #   expediente: cabecera, pestañas, CI y stepper
│   ├── evaluaciones.js     #   LB (IDEA), PA y PB (conectado)
│   ├── informe-cierre.js   #   IC, documento impreso A4 y recibí (conectado)
│   ├── hce-doc-org-vf.js   #   VF (conectado) · HCE-DOC y HCE-ORG (demostración)
│   ├── severidad.js        #   SEV: severidad DSM-5-TR (conectado)
│   ├── auditoria.js        #   LOG: registro de cambios, sólo lectura (conectado)
│   ├── recordatorios.js · grupos-usuario.js · inclusion.js · ateneos.js   # vistas en demostración
└── verificacion/           # Playwright: README.md · conectada.js · capturas.js · fingerprint.js · comparar.js
                            #  · package.json y package-lock.json (versión fijada) · salidas/ y node_modules/ ignorados
```

Dos personas pueden trabajar en paralelo en `demo/js/` si toman **archivos distintos**; `index.html` y `js/utils.js` los
tocan todos y se coordinan antes (`handoff.md` §12.3).

### `backend/` — API FastAPI + SQLAlchemy + Alembic + PostgreSQL

```
backend/
├── README.md               # arranque, login, carga de la demo
├── docs/esquema-datos-v2.md   # esquema vigente: leer antes de tocar app/models/ (§2 tablas, §4 dónde vive cada regla)
├── docker-compose.yml      # Postgres 16 en 127.0.0.1:5440 (contenedor ippu-postgres)
├── docker/initdb/00-crear-base-test.sql   # crea la base ippu_test al inicializar el volumen
├── .env.example · alembic.ini · pytest.ini · requirements.txt
├── alembic/versions/dcc838486407_esquema_v2_inicial_a2.py   # migración única del esquema v2 (51 tablas)
├── app/
│   ├── main.py             # entrypoint FastAPI
│   ├── core/               # config (rechaza todo DATABASE_URL que no sea Postgres) · constantes · database · seguridad (JWT) · destino (guardia de las CLI que escriben, §5.139)
│   ├── models/             # SQLAlchemy: catalogos · identidad · modulos · transversales · severidad · inclusion · pai · ateneo · divulgacion · mixins
│   ├── schemas/            # Pydantic (contrato de cada recurso)
│   ├── services/           # reglas de negocio: flujo, firma, IDEA, protocolos, Δ, informe de cierre, VF, grupos, auditoría…
│   ├── routers/            # endpoints REST; el router hace el commit, el servicio sólo `flush` (§5.108)
│   ├── data/catalogos_iniciales.json   # generado, no se edita a mano
│   ├── seed_catalogos.py · seed_demo.py · crear_usuario.py
└── tests/                  # pytest contra la base aislada `ippu_test`; una guardia de sesión aborta si falta Docker (exit 1)
```

- **Requisito:** Docker arriba. La guardia de `tests/conftest.py` aborta `pytest` —no lo saltea— si el contenedor no está, si la
  base de desarrollo está vacía o si no está en el head.
- **Catálogos:** `python herramientas/generar_catalogos_backend.py` los regenera y `--check` valida; lo que no es catálogo vive en
  `app/core/constantes.py`, con el criterio tabla-vs-constante en su docstring.
- **Migraciones:** la migración inicial es **única** (§5.19); un cambio de modelos regenera ese mismo archivo, sin apilar
  revisiones, con `test_la_migracion_coincide_con_los_modelos` en verde.

## `implementacion/L3-asistente-virtual/`

Línea 3 (Samuel): asistente para técnicos que responde sólo con documentos autorizados. Monorepo, entorno propio, no importa
nada de L1 (§5.128–§5.134). Tiene `asistente/` (código), `eval/` (banco de evaluación y set retenido), `tests/`, `pytest.ini` y
`requirements.txt`. Su README y el plan `docs/planes/L3-asistente-plan.md` dicen cómo se trabaja ahí. **No se toca desde L1.**

## `herramientas/`

| Ruta | Qué es |
|---|---|
| `generar_catalogos_backend.py` | Genera `backend/app/data/catalogos_iniciales.json` desde la demo y el Prototipo v4. Con `--check` no escribe: falla si el archivo del repo quedó desfasado. |
| `verificar_estado.py` | `--check` **mide el repo** (tablas, migración, un solo head, tests si Docker está arriba) y lo compara con lo que afirman `handoff.md` (sólo su cabecera), `README.md`, `CLAUDE.md`, este archivo y `backend/README.md`. Silencioso si coincide; exit ≠ 0 con el diff si no. Va en el cierre de cada sesión. |
| `verificar_contraste_ui.js` | Mide contraste WCAG y anillos de foco sobre lo que **realmente se renderiza** en la demo conectada. **Nunca escribe en la API, por construcción**: deja pasar sólo `GET` y `POST /auth/login`, devuelve un 422 enlatado a las dos confirmaciones de firma que pulsa y aborta —con código 1— cualquier otra escritura. Reusa el Playwright de `demo/verificacion/`. Uso: `demo/verificacion/README.md`. |
| `preparar_presentacion.ps1` | Deja la base de la presentación (`ippu_presentacion`) lista con **un comando**: recrea la base, esquema, catálogos, admin, API en `:8000`, seed por la API y demo en `:5500`. Volver a correrlo da lo mismo; se niega a tocar `ippu_test` y `ippu` (salvo `-ConfirmarBaseDeTrabajo`); `-Detener` para lo que arrancó. Las contraseñas salen del entorno. Uso: `CLAUDE.md`, «Presentación» (§5.139). |
| `verificar_presentacion.js` | Chequeo de **sólo lectura** de que esa demo está lista: el técnico entra, los 7 activos y las cifras de Martín (LB 58, PA 60, PB 79, Δ +19, su IC impreso) tal como las da la API. Mismo filtro que `verificar_contraste_ui.js`. Una línea `OK` o `FALLA …` (exit 1). |
