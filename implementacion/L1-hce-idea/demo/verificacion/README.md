# Verificación de la demo L1 — *fingerprint* de comportamiento

La demo no tiene tests unitarios. Esto es lo que hay en su lugar: un script que **captura
cómo se comporta la demo** (un "fingerprint") y otro que **compara dos capturas**.

Sirve para una pregunta concreta:

> Cambié algo que **no debería** alterar el comportamiento (un refactor, mover código,
> partir un archivo, renombrar). ¿Rompí algo?

Se captura antes, se captura después, se comparan. Si difieren, algo se rompió.

## Demo conectada a la API — `conectada.js` (Fase 3-a, 3-b, 3-c y 3-d, `handoff.md` §5.122, §5.124, §5.125 y §5.126)

Es **otra cosa** que el *fingerprint* de abajo: no compara dos versiones de la demo estática, sino que
prueba la demo **contra una API real** (login, listado, HCE-00 y su edición, alta, CI, flujo, IDEA, protocolos A/B, informe de cierre con su documento impreso y recibí, valoración funcional, modo demostración). Corre en Chromium
headless con Playwright y sale con código 0 si pasa todo, 1 si algo falla.

**Qué necesita** (tres cosas arriba a la vez; el script avisa cuál falta):

1. **API en `http://localhost:8000` con la base cargada por el seed** (desde `backend/`, con el `.venv`
   y Postgres arriba — ver `backend/README.md`). En Windows, con `PYTHONUTF8=1` (si no, el «→» de un
   `print` del seed rompe la carga):

   ```powershell
   $env:PYTHONUTF8=1
   alembic upgrade head; python -m app.seed_catalogos
   uvicorn app.main:app --port 8000          # en otra terminal
   $env:IPPU_EMAIL="admin@…"; $env:IPPU_PASSWORD="…"; $env:IPPU_DEMO_PASSWORD="…"
   python -m app.seed_demo --url http://localhost:8000   # en Windows SIEMPRE con PYTHONUTF8=1 (ver arriba)
   ```
2. **La demo servida en `http://localhost:5500`** (no sirve `file://`: la API sólo acepta ese origen por
   CORS, y el login necesita la API):

   ```bash
   cd implementacion/L1-hce-idea/demo && python -m http.server 5500
   ```
3. **`IPPU_DEMO_PASSWORD`** = la contraseña de los profesionales de la demo, la misma con la que corrió el seed.

```bash
cd implementacion/L1-hce-idea/demo/verificacion
CONFIRMA_BASE_DESCARTABLE=1 IPPU_DEMO_PASSWORD=… IPPU_ADMIN_EMAIL=… IPPU_ADMIN_PASSWORD=… node conectada.js
# PowerShell: $env:CONFIRMA_BASE_DESCARTABLE="1"; $env:IPPU_DEMO_PASSWORD="…"; $env:IPPU_ADMIN_EMAIL="…"; $env:IPPU_ADMIN_PASSWORD="…"; node conectada.js
```

⚠️ **La corrida ESCRIBE** (crea expedientes, firma IDEA y protocolos, agrega addendas) **y se niega a correr sin
`CONFIRMA_BASE_DESCARTABLE=1`**, sea cual sea la API (`API=`): sale con **exit 1 antes de pedirle nada a la API**
(el chequeo `3c-j1` lo prueba contra una API inexistente). Ponerla es afirmar que la base es la descartable de
«Base descartable» (abajo) y no la de trabajo.

`IPPU_ADMIN_EMAIL` / `IPPU_ADMIN_PASSWORD` son el **admin del seed** (los `IPPU_EMAIL` / `IPPU_PASSWORD` con los que
se corrió `app.seed_demo`): desde la 3-b el chequeo (c) compara el 409 del técnico con el del admin.

Opcionales: `API=` y `DEMO=` (otras URL), `IPPU_DEMO_EMAIL=` (por omisión `gonzalez@demo.ippu.test`),
`HEADED=1` (ver el navegador). Si Playwright pide un navegador que no está cacheado:
`npx playwright install chromium`.

**`API=` cambia de verdad la API del navegador:** el script abre la demo con `?api=<API>` (`api.js` · `API_BASE`),
así que `API=http://localhost:8001 node conectada.js` hace que **la prueba y la demo hablen con la misma API**
(el chequeo `api` lo afirma). Sin eso, la demo seguía usando `:8000` aunque el script consultara otra.

### Base descartable en otro puerto (para revisar sin tocar la base de trabajo)

Desde la 3-b la corrida **escribe**: crea expedientes, los edita, les da de baja y reingreso, registra CI y (3-c) firma el IDEA de Joaquín, el PA y el PB de Sofía y agrega una addenda al IDEA de Martín. Los
conteos del principio (7 activos, 8 con inactivos…) son los del seed recién cargado, así que **cada corrida pide una
base nueva**. Receta (PowerShell, desde `backend/`, Postgres de `docker compose up -d` arriba):

```powershell
$env:PYTHONUTF8 = "1"
docker exec ippu-postgres psql -U ippu -d ippu -c "DROP DATABASE IF EXISTS ippu_3b WITH (FORCE)" -c "CREATE DATABASE ippu_3b"
$env:DATABASE_URL = "postgresql+psycopg://ippu:ippu@localhost:5440/ippu_3b"      # pisa el del .env (sólo en esta terminal)
.venv\Scripts\python -m alembic upgrade head
.venv\Scripts\python -m app.seed_catalogos
.venv\Scripts\python -m uvicorn app.main:app --port 8001                         # otra terminal, con el mismo DATABASE_URL
# con la API arriba, en la primera terminal (la verificación pide además CONFIRMA_BASE_DESCARTABLE=1):
$env:IPPU_EMAIL = "admin@demo.ippu.test"; $env:IPPU_PASSWORD = "…"; $env:IPPU_DEMO_PASSWORD = "…"
.venv\Scripts\python -m app.seed_demo --url http://localhost:8001
```

Y la suite contra ella: `API=http://localhost:8001` (la demo sigue en `:5500`; CORS acepta ese origen sea cual sea
el puerto de la API). Para repetir la corrida: parar la API, repetir el `DROP/CREATE` + migración + catálogos,
levantarla y volver a cargar el seed.

**Qué verifica** (145 chequeos). **Los identificadores llevan la fase como prefijo** (`3a-…`, `3b-…`, `3c-…`, `3d-…`):

- **Fase 3-a** — `3a-a` login del técnico y chip con su nombre y rol · `3a-b` contraseña mala → mensaje en
  `role="alert"` con foco y `sessionStorage` vacío · `3a-c…` conteos del listado y del filtro de grupo **iguales a los de
  `backend/tests/test_m11_5a_seed_demo.py`** (7 activos · 8 con inactivos · Escolares 3 · Preadolescentes 3 · Adolescentes 2) ·
  `3a-d…`/`3a-m…` búsqueda (regla de la caja contra el GET real) · `3a-e…` Bruno con «CI pendiente» · `3a-f…` HCE-00 de Martín
  contra `GET /hce/{id}`, técnicos del grupo y stepper del flujo, sin lo que la API no guarda · `3a-g…` «Modo demostración»
  en pestañas y vistas no conectadas · `3a-h`/`3a-i`/`3a-j`/`3a-k` logout, 401, recarga con sesión, API caída · `3a-l…` login
  modal con app inerte · `3a-w` sin desborde a 390/1024/1280 px · `3a-s…` «Salir» con cargas en vuelo.
- **Fase 3-b** (escribe) — `3b-m5`/`3b-m6` diálogo de alta (role/aria-modal, app inerte, Esc, foco, sin nivel de apoyo ni
  talleres) · `3b-a…` alta como técnico: `POST /hce` con `grupo_id`, técnicos del grupo, aparece en el listado con «CI
  pendiente» · `3b-b` misma cédula como técnico: 409 **genérico** · `3b-c` como admin: mensaje **específico junto a la cédula** ·
  `3b-d…` editar: `PATCH` sólo con lo que cambió, anamnesis con sus cinco claves, baja y reingreso · `3b-e…` sin CI nada se
  traba, el 404 del CI se lee como «pendiente», registrar y editar el CI · `3b-f…` obligatorios vacíos → error por campo con
  `aria-describedby` · `3b-w2`, `3b-s3`, `3b-api`.
- **Fase 3-c** (escribe: firma y addendas) — contra el seed: Martín (IDEA 58, PA 60, PB 79, Δ +19), Sofía (PA en borrador),
  Joaquín (LB en borrador con dos `NS`) y dos expedientes que crea el script:
  `3c-a` IDEA firmado: 58, banda **escrita** con el color de la rampa de un solo matiz (nunca ok/warn/bad), sin «nivel DSM», solo
  lectura · `3c-vigente` HCE-00 muestra el IDEA de `GET …/idea/vigente` · `3c-g` PA/PB/Δ de Martín **como los devuelve la API** ·
  `3c-d`/`3c-d2` addenda (cuerpo sin autor; autor = usuario de la sesión; marca en encabezado, pestaña y stepper; 422 vacía) ·
  `3c-e` NS con su marca propia · `3c-422` el 422 de firmar **por dimensión y por campo** · `3c-h`/`3c-h2` evaluador faltante →
  error junto a su campo; con los dos, `POST /firmar` **sin cuerpo** y aviso «recomendación no cumplida» sin bloquear ·
  `3c-b0…b3` PA de Sofía: ítem 1 sin observación → error junto al ítem; con observación firma; firmado, la API contesta 409 ·
  `3c-prov` suma «provisorio» en vivo, sin banda · `3c-c` PB creado y firmado: **Δ, lectura y alerta mostrados == API** ·
  `3c-i` IDEA en un expediente **sin CI**, sin candados · `3c-f` PA con el LB sin firmar → «fuera de secuencia» que no bloquea ·
  `3c-pa-pb` PB firmado antes que su PA: al firmar el PA se vuelve a leer el PB y aparece su Δ ·
  `3c-add1` la addenda a medio escribir sobrevive al cambio de pestaña y al re-clic en la misma · `3c-add2` relectura en segundo plano
  (GET demorado) mientras otro usuario agrega una addenda: lo tipeado sobrevive y la nueva aparece (**falla sin la guarda de
  `evRepintar`**) · `3c-banda` `total_min` 56 → su paso; 60, 7 y null → estilo neutro con el nombre escrito · `3c-tecla` firmar
  sólo con teclado: Esc cancela sin pedido y Enter×3 hace un único `POST …/firmar` ·
  `3c-j1` la guarda `CONFIRMA_BASE_DESCARTABLE` (exit 1 antes de pedir nada) · `3c-j2`/`3c-j3` «Salir» y 401 con el diálogo
  abierto dejan los campos vacíos y `WIZ.orig` null · `3c-j4`/`3c-j5`/`3c-j11` selector de grupos (técnico: sólo los suyos, sin
  «Sin grupo asignado», uno solo → preseleccionado; admin: todos) · `3c-j6` alta del técnico en un grupo ajeno → el 403 de la API
  se muestra · `3c-j7` una escritura que devuelve `warnings` los muestra sin bloquear · `3c-j8` la cédula se compara por valor
  bruto · `3c-j9` el texto completo de los expedientes de ejemplo 101–108, y su HCE-DOC no dicen «habilitación
  excepcional», «Bloqueado»/«bloqueada» ni llevan candado (salvo el 🔒 del documento histórico, excluido a propósito) · `3c-j9b` guardar
  una foto individual y una grupal sin autorización no bloquea ni avisa (§5.99) · `3c-j10` la marca «Demo
  parcialmente conectada» no tapa contenido a 1280×800 y 1280×900.
- **Fase 3-d** (escribe: IC, recibí, addenda, VF; **necesita `python` con `pypdf`** para leer el PDF) — contra el seed y tres expedientes (Martín, Valentina, Camila, Sofía):
  `3d-lay`/`3d-lay2` sin `view-ic`, selector, funciones ni manejadores muertos (8 ejemplos + 13 pestañas) · `3d-a1…a3` **IC de Martín impreso**: IDEA 58 · PA 60 · PB 79 · Δ +19 y por escala 4/6/4/5, **igual a una llamada directa a `GET …/documento`**, sin alerta, cédula y CIE-11 de `GET /hce`, firmas de `informe.firmas[]`, sin «Soporte» ·
  `3d-b1`/`3d-b2` **`page.pdf()` A4** de ese documento (se guarda en `salidas/ic-martin.pdf`, gitignored): cantidad de hojas, tamaño A4, encabezado del expediente en cada hoja y **ninguna tabla, radar, bloque de firmas ni membrete partido** — se lee el texto de cada hoja con `pypdf` y se exige que los marcadores de inicio y de fin de cada bloque (p. ej. «18 / 24» … «+19» de la tabla) caigan **en la misma hoja**, también con la impresión ampliada 1,25× y 1,5× (otros cortes de página) ·
  `3d-c0…c5` **IC de Valentina**: crear (`POST` sólo lo tipeado), 422 por campo, dos firmantes iguales → 422, firmar con dos distintos en orden inverso al del grupo, solo lectura, avisos de la API, impreso con las firmas de quienes firmaron · `3d-r1…r3` recibí: diálogo accesible, 422 por campo, Esc y foco, una sola vez (409) · `3d-ad` addenda con autor · `3d-n1…n3` Camila: impreso sin IC / con borrador = estado del flujo (sin `/documento` / con su 409) y 409 al guardar → solo lectura ·
  `3d-e1…e3` **VF vacía → crear**, sin sugerencia ni «Autogenerar» · `3d-d1…d5` VF de Martín: categoría == API, `PATCH` sólo con `pct`, % rechazado → error por campo, alerta de vigencia de la API, reporte con la lectura del Δ de la API · `3d-d7` categorías y niveles en la rampa de un solo matiz (nunca ok/warn/bad) · `3d-f` el código no usa lbTotales/protTotales/calcularDelta/deltaInterpreta/categoriaBaremo/sugiereNivel… · `3d-ax` toda entrada con su etiqueta · `3d-w` sin desborde a 390/1024 px.
- `z` — **0 errores de JavaScript** en toda la corrida.

Depende de que la base sea la del seed (8 NNA, Tomás dado de baja): sobre otra base los conteos no dan.

### Las otras dos herramientas también corren contra la demo conectada (3-b y 3-c)

- **`herramientas/verificar_contraste_ui.js`** (raíz del repo) abre la demo por `http://localhost:5500/index.html?api=<API>`
  y hace login con el técnico del seed (`IPPU_DEMO_PASSWORD`; opcionales `API=`, `DEMO=`, `IPPU_DEMO_EMAIL=`): corre
  **sin tocarlo** desde el repo. Recorre las vistas, las 13 pestañas de un expediente de la API, el CI pendiente con sus
  errores y el diálogo de alta/edición en sus cuatro pasos. Resultado de referencia: **los mismos 14 pares que fallan que
  la línea base** (misma tabla, mismos ratios) y los mismos anillos de foco; ninguna pantalla nueva agrega una falla. **Desde la 3-c** también recorre las pantallas de IDEA y protocolos (Joaquín: borrador con `NS`, barra de totales,
  confirmación de firma y 422; Martín: LB firmado con banda, PB con Δ; Sofía: PA editable): **los mismos 14 pares que fallan**
  (los mismos 14 pares que fallan que la línea base; todo par nuevo —rampa de bandas, marca de NS, addenda, barra— ≥ 4,5:1; medido sobre una base recién cargada y contra la punta de 3-b).
  Conviene correrla sobre el seed recién cargado y **antes** de `conectada.js` (que firma lo que el seed deja en borrador).
  ⚠️ La herramienta no pulsa teclas: una tecla pasa Chromium a modalidad de teclado y cambiaría qué anillos de
  `:focus-visible` se miden.
- **`fingerprint.js`** acepta una **URL** además de una ruta: `node fingerprint.js http://localhost:5500/index.html salida.json`
  (con `API=` e `IPPU_DEMO_PASSWORD`) hace login y recorre el modo demostración (los ejemplos 101–108 se abren con
  `abrirExpedienteDemo`). Con una ruta a un `.html` sigue siendo la herramienta de siempre para versiones anteriores a
  la Fase 3. El modal de edición de ejemplo ya no existe (la edición es la del expediente de la API).

---

## Instalación (una vez)

Playwright está **fijado a una versión exacta** en `package.json` (devDependency, sin `^`), con su
`package-lock.json`: todo el equipo corre el mismo. Desde esta carpeta:

```bash
cd implementacion/L1-hce-idea/demo/verificacion
npm ci                          # instala lo del lockfile (o `npm install` si no hay lockfile)
npx playwright install chromium # una vez por máquina y por versión de Playwright
```

`npx playwright install chromium` baja el navegador a `~/AppData/Local/ms-playwright`
(~120 MB; queda cacheado). Si Playwright se actualiza, hay que repetirlo: cada versión pide su build.
**No** instalar con `npm install playwright --no-save` (sin versión): trae la última y se rompe el pin.

## Uso

**1. Capturar el estado ANTES del cambio.** Si ya lo hiciste, recuperá la versión previa
desde git a un archivo aparte:

```bash
git show HEAD:implementacion/L1-hce-idea/demo/index.html > /tmp/antes.html
node fingerprint.js /tmp/antes.html antes.json
```

⚠️ **Recuperar sólo el `index.html` no alcanza.** La demo está partida en `css/` y `js/`
desde la modularización (§5.5): el `index.html` define el orden de carga, pero el
comportamiento vive en los 14 módulos. El procedimiento completo está abajo, en
**«Comparar dos versiones con `git worktree`»** — usalo, no improvises con `git stash`.

**2. Capturar el estado DESPUÉS.**

```bash
node fingerprint.js ../index.html despues.json
```

**3. Comparar.**

```bash
node comparar.js antes.json despues.json
```

Sale con código 0 si son idénticos, 1 si hay diferencias (y te muestra el primer punto donde
divergen, con contexto alrededor).

## Qué cubre

| Parte | Qué verifica |
|---|---|
| **A — Estado inicial** | Carga sin errores · catálogos y constantes · **lista de funciones globales** (delata una función perdida al mover código) · motor de flujo M1 de los 8 NNA · las 5 vistas · los 8 expedientes |
| **B — Reglas duras** | **No-homologabilidad (§5.2):** `calcularDelta` debe *lanzar* si se le pasa el IDEA en vez de un protocolo. **Baremo (§7.5):** `categoriaBaremo` debe *lanzar* si se le pasa un puntaje clínico en vez del % oficial. Más bordes del baremo y cálculo puro |
| **C — Interacciones** | Firma de CI (con autorizaciones y adjunto) · firma PA + PB con **delta B−A y alerta institucional** (M5.3) · addenda sobre módulo firmado y rechazo sobre no firmado · modales de alta/edición/recibí · vistas armadas por JS (IDEA, protocolos, informe de cierre, HCE-VF) |
| **D — Modelo final** | Volcado JSON completo de los 8 expedientes tras todas las mutaciones · **analítica institucional derivada** (`D3`): agregados y KPIs recalculados al final, más una aserción `derivadoOk` que contrasta el panel contra un recálculo hecho en el momento |

## Cosas a tener en cuenta

- **No es un test de corrección, es un test de *no-cambio*.** No dice que la demo esté bien;
  dice que se comporta igual que antes. Para un refactor es exactamente lo que hace falta.
- **Las horas se normalizan.** El HCE-LOG guarda `HH:MM` de la hora real; el script las
  reemplaza por `HH:MM` literal para que dos corridas en distinto minuto no den falso positivo.
- **El orden de la Parte C importa**: las interacciones mutan el modelo y cada paso depende
  del anterior. Si agregás pasos, agregalos al final o vas a correr todo lo que sigue.
- **Los escenarios son deterministas, no clínicamente realistas.** Por ejemplo se firma un
  Protocolo B vacío para forzar el camino de la alerta institucional (Δ ≤ −7). Está bien: lo
  que importa es que el mismo escenario dé el mismo resultado antes y después.
- **Ojo con leer `D3` como dato clínico.** Por lo anterior, el Δ promedio que reporta el paso
  D3 es negativo (≈ −30): es consecuencia de ese Protocolo B vacío, no del seed. Los números
  reales del seed se ven en `A3_vista_analitica`, antes de cualquier mutación.
- **`D3` sirve para detectar un indicador re-hardcodeado.** Se captura después de las
  mutaciones: si un KPI vuelve a ser una constante, sus números se quedan quietos mientras el
  modelo se movió. `derivadoOk: false` significa que el panel quedó desincronizado del modelo
  (falta un re-render, o hay un valor fijo en el markup).

## Historia

Se escribió el 2026-08-07 para verificar la modularización de la demo (`handoff.md` §5.5).
Ahí atrapó un error real que **no se veía en pantalla**: al partir el monolito, el seed de
`flujo.js` llamaba a `fmtFecha()` —declarada en otro archivo que cargaba después— y tiraba
`ReferenceError` en carga, abortando el seed en silencio. La demo se veía perfecta.

## Comparar dos versiones con `git worktree` — **el procedimiento**

Es la forma soportada de usar este harness. `git stash` no sirve: deja una sola copia del
árbol y la demo necesita `index.html` + `css/` + `js/` **completos y coherentes entre sí**.

Un worktree es un segundo checkout del mismo repo en otra carpeta, sin clonar de nuevo y sin
tocar tu rama actual.

```bash
cd implementacion/L1-hce-idea/demo/verificacion

# WT queda al lado del repo, no adentro. Se calcula, no se cuenta con "../.." a ojo.
WT="$(git rev-parse --show-toplevel)/../ippu-wt-antes"

# 1. Segundo checkout de la versión ANTES (un commit, un tag o una rama).
git worktree add "$WT" <commit-tag-o-rama>

# 2. Capturar la versión ANTES (demo completa, no sólo el HTML).
node fingerprint.js "$WT/implementacion/L1-hce-idea/demo/index.html" antes.json

# 3. Capturar la versión DESPUÉS (tu árbol de trabajo actual).
node fingerprint.js ../index.html despues.json

# 4. Comparar. Exit 0 = idénticos; exit 1 = hay diferencias y te muestra la primera.
node comparar.js antes.json despues.json

# 5. Limpiar.
git worktree remove "$WT"
```

En PowerShell es lo mismo con `$WT = "$(git rev-parse --show-toplevel)/../ippu-wt-antes"`.

**Cuándo se corre:** antes de mergear cualquier rama que refactorice `demo/js/` sin querer
cambiar comportamiento. Si el diff sale limpio, el refactor no rompió nada. Si sale sucio,
hay que mirar **cada** diferencia y decidir si era intencional — el script no lo sabe.

## Por qué no hay un baseline versionado

`.gitignore` de esta carpeta excluye `*.json`, así que **las capturas nunca se commitean**:
son artefactos locales de cada comparación. La consecuencia es que **no existe un
«fingerprint de referencia» en el repo** contra el cual comparar sin generar el lado
«antes» uno mismo. Por eso el procedimiento de arriba genera los dos lados.

Además de lo estructural (2, abajo), hay un motivo medido y no sólo teórico — **dos de los 42
pasos capturados hoy dependen del reloj real** y rotarían solos si se versionara una captura de
referencia. Ver «Determinismo y dependencia del calendario» más abajo, con los números exactos
y las tres opciones evaluadas (ninguna adoptada).

Tenerlo requeriría tres cosas, y ninguna es gratis: (1) sacar `*.json` del `.gitignore` o
exceptuar un `baseline.json`; (2) **fijar** el escenario de la Parte C, que hoy muta el
modelo en un orden que cambia cuando alguien agrega un paso; y (3) aceptar que cada cambio
intencional de comportamiento obliga a re-commitear el baseline, con la revisión que eso
implica — si no, se vuelve un archivo que todos regeneran sin mirar. **Queda anotado como
opción, no como pendiente**: mientras el harness se use para verificar refactors puntuales,
dos capturas locales alcanzan.

## ✅ Estado del harness al 2026-08-21 — arreglado, corre de punta a punta

El problema descripto abajo (histórico, se deja para que quede el porqué) está resuelto.
`fingerprint.js` ahora declara un único mapa `VISTAS` (`entrada` + `contenido` por vista) en
vez de asumir que toda vista es un `.navitem[data-view=...]` con el mismo patrón de click. Dos
guardas nuevas, las dos con mensaje que nombra la vista — no un timeout genérico de Playwright:

1. **Antes de tocar nada:** por cada vista declarada, se verifica que su selector `entrada`
   exista en el DOM. Si la nav vuelve a cambiar (se saca/renombra un `.navitem`, como pasó con
   `usuarios`), la corrida **falla al arranque** con el nombre de la vista rota, no a mitad de
   la Parte A con un mensaje genérico de Playwright.
2. **Después de cada click:** se verifica que el `contenido` de esa vista (el contenedor que
   arma su `render()`) haya quedado no-vacío. Existe porque `usuarios` es un caso real de
   "click sin contenido": su entrada no es un `.navitem` sino el `.userchip` (`index.html:43`)
   y, a diferencia de grupos/inclusión/ateneos —cuyo `render()` corre una vez al cargar la
   página—, su contenido **sólo** se llena cuando corre `renderUsuario()`. El propio
   `onclick="go('usuarios'); renderUsuario()"` ya encadena las dos llamadas, así que un solo
   click **alcanza** — se verificó (`#usuarioContent`, 2.457 caracteres capturados, no un shell
   vacío). La guarda queda igual, por si el día de mañana algún `render()` deja de correr al
   cargar.

> **Vocabulario, para no repetir la confusión de sesiones anteriores:** un **paso** es una clave
> de `F.pasos` — lo que `fingerprint.js` captura (hoy: **36** contra la demo conectada —la Fase 3-c retiró el paso de excepción, las tres vistas de LB/PA/PB y, en conectada, el modal de edición de ejemplo—, `pasos capturados` en su propia
> salida). Un **campo comparado** es lo que `comparar.js` reporta por fila — los 36 pasos **más**
> el campo `errors` (comparado aparte, bajo «ERRORES DE CONSOLA / PAGINA») — hoy: **37**. Todo lo
> que hable de un `.json` capturado dice "pasos"; todo lo que hable de una corrida de
> `comparar.js` (`X iguales · Y distintos`, o "X/37") dice "campos comparados". Los dos números
> son reales y **distintos a propósito** — no es un typo si en un párrafo dice 42 y en el de al
> lado dice 43.

**Corrida verificada (2026-08-21):** 7 vistas (`inicio · pendientes · analitica · grupos ·
inclusion · ateneos · usuarios`) + 8 expedientes, **42 pasos capturados, 0 errores de
consola/página**, exit 0. Dos corridas seguidas sobre el mismo commit, comparadas con
`comparar.js`: **43/43 campos comparados idénticos** (los 42 pasos + el campo `errors`) — ver
«Determinismo» más abajo.

<details>
<summary>Histórico — el problema tal como estaba el 2026-08-20 (ya resuelto arriba)</summary>

Después del merge de `demo/F1-navegacion`, la Parte A quedó desalineada con la demo. Antes
de confiar en una corrida había que arreglar dos cosas (ninguna se hizo la noche del 20/08,
a propósito: era la víspera de la reunión con IPPU):

- **`fingerprint.js:82` recorría `['inicio','pendientes','analitica','grupos','usuarios']`.**
  `usuarios` **ya no era un `.navitem`**: F1/B2 lo sacó de la barra de navegación (el
  `#view-usuarios` seguía existiendo, se llegaba por otro lado). El `page.click()` sobre
  `.navitem[data-view="usuarios"]` **tiraba**, así que la corrida abortaba ahí.
- **Faltaban las dos vistas nuevas:** `inclusion` y `ateneos` existían como `.navitem` y como
  `#view-*`, y el harness no las visitaba — o sea que no las cubría.

</details>

## Determinismo y dependencia del calendario (medido 2026-08-21)

**Determinismo: perfecto.** Dos corridas seguidas de `fingerprint.js` sobre el mismo commit
(sin ningún cambio de por medio) dan **43/43 campos comparados idénticos** (`comparar.js` →
exit 0, `IDENTICOS`). No hay ningún ID aleatorio, orden de `Object.keys()` inestable, ni
timestamp sin normalizar filtrándose al resultado — más allá de lo que ya cubre la
normalización de `HH:MM`.

**Dependencia del calendario: dos pasos, medidos, no dos categorías completas.** Grep de
`new Date()`/`Date.now()` en `demo/js/` da 8 sitios; de esos, sólo **2 llegan a un paso que el
harness captura hoy**, y se verificó adelantando el reloj del navegador +48h con
`page.addInitScript`:

| Paso capturado | Campo | Hoy (2026-08-21) | +48h (simulado) | Frecuencia |
|---|---|---|---|---|
| `A3_vista_inclusion` | `incDiasSin()` (`inclusion.js:35-39`, `Date.now()`) — "días sin gestión" por fila | 92, 127, 162, 50, 51, 97 | 94, 129, 164, 52, 53, 99 | **cambia cada día** (y cruza el umbral `>60` que cambia la clase CSS `pill due`) |
| `C6e_vista_informe` | `fechaGen` de `generarInforme()` (`expediente.js:193-194`, `new Date()`) — fecha de generación embebida en el HTML | `21/08/2026` | `23/08/2026` | **cambia cada día** |

**Un tercer campo cambia, pero sólo una vez al año:** `nroHC()` (`grupos-usuario.js:71-73`)
usa `new Date().getFullYear()` como *fallback* cuando `n.altaFecha` no existe — y **ningún** NNA
del seed tiene `altaFecha`, así que el fallback se usa siempre. Aparece en `A3_vista_inclusion`
(`HC-2026-101` hoy) y en el hint de `A3_vista_ateneos`. Rota el 1.º de enero, no a diario.

**Lo que se descartó por código, y vale decirlo porque el enunciado de esta tarea asumía que
podía estar ahí:** las alertas de vigencia de 90/30 días (`vfAlertaVigencia`,
`hce-doc-org-vf.js:336`) y las edades (`edadDesde`, `flujo.js:551-557`) usan `new Date(...)`
contra una fecha **fija** — `HOY = "2026-07-15"` la primera, `"2026-06-10"` hardcodeada la
segunda — no contra el reloj real. **No son calendario-dependientes** aunque el nombre
`vfAlertaVigencia` sugiera lo contrario, y hoy ninguna de las dos está en un paso que el
harness capture. Los recordatorios del panel institucional (`recordatorios.js`) tampoco: su
"pendiente/al día" sale de `flujo.*.firmado`, no de una fecha.

**Tamaño y cantidad de comparaciones.** Cada captura: **~528 KB** (540.546 bytes exactos,
un solo `.json`). `comparar.js` recorre **43 campos comparados** (42 pasos + `errors`).

### Opciones para un baseline versionado — medidas, no elegidas

`.gitignore` sigue excluyendo `*.json`: nada de esto se adoptó. Tres opciones, con su costo
real a la luz de lo medido arriba:

1. **Versionar un `baseline.json` tal cual.** Costo: ~528 KB en el repo (y de nuevo cada vez
   que se re-genera) + **rota solo, sin que nadie toque `demo/`**: `A3_vista_inclusion` cambia
   todos los días y cruza el umbral de 60 días en algún momento no controlado, `C6e_vista_informe`
   cambia todos los días. Un `git diff`/CI que compare contra este baseline da **falso positivo
   a diario** en 2 de 42 pasos, entrenando a ignorar el rojo — exactamente el patrón que
   `notas-accesibilidad-ui.md` §3.1 describe para el color. No se recomienda.
2. **Sólo el procedimiento de dos worktrees (el que ya está documentado arriba).** Costo: manual,
   dos corridas (~528 KB × 2, no versionadas) cada vez que alguien quiere comparar, y hay que
   tener a mano el commit/tag/rama de referencia. Beneficio real medido: como "antes" y
   "después" se capturan con **el mismo reloj real**, dentro de la misma corrida, los 2 pasos
   calendario-dependientes **no generan falso positivo nunca** — la comparación es efectivamente
   inmune al calendario sin tocar el código. Es la única opción de las tres con **0 mantenimiento**
   contra deriva de fecha.
3. **Versionar un `baseline.json`, pero con los 2 pasos volátiles normalizados** (mismo mecanismo
   que ya usa `norm()` para `HH:MM`: dos regex más, una para `\d+ días` dentro de
   `A3_vista_inclusion` → `N días`, otra para `dd/mm/aaaa` dentro de `C6e_vista_informe` →
   `DD/MM/AAAA`). Costo: ~15 líneas en `fingerprint.js`, revisadas una vez; sigue pesando ~528 KB
   en el repo. Lo que **no** cubre: un tercer campo calendario-dependiente que aparezca mañana
   (se agrega `nroHC` a la Parte A, se activa `atNuevo`/`toggleActivo`/`crearNNA` en un paso nuevo)
   **no se normaliza solo** — hay que acordarse de extenderlo, y si no, vuelve el falso positivo,
   sólo que una vez al año o al agregar un paso, no a diario, así que es más fácil que pase
   desapercibido que el caso 1.

**Recomendación (no adoptada): opción 2, sin cambios.** El determinismo ya es perfecto y la
dependencia del calendario es angosta pero real; con dos worktrees el problema desaparece sin
tocar código ni mantener una lista de regex. La 3 vale la pena **sólo si** en algún momento se
necesita correr esto sin un segundo worktree (p. ej. un CI de un solo checkout) — ahí el costo
de mantenimiento de los regex se paga solo. La decisión es de Lucas, va a `handoff.md` §5.
