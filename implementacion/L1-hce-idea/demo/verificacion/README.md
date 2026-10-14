# Verificación de la demo L1 — *fingerprint* de comportamiento

La demo no tiene tests unitarios. Esto es lo que hay en su lugar: un script que **captura
cómo se comporta la demo** (un "fingerprint") y otro que **compara dos capturas**.

Sirve para una pregunta concreta:

> Cambié algo que **no debería** alterar el comportamiento (un refactor, mover código,
> partir un archivo, renombrar). ¿Rompí algo?

Se captura antes, se captura después, se comparan. Si difieren, algo se rompió.

## Demo conectada a la API — `conectada.js` (Fase 3-a, `handoff.md` §5.122)

Es **otra cosa** que el *fingerprint* de abajo: no compara dos versiones de la demo estática, sino que
prueba la demo **contra una API real** (login, listado, HCE-00, modo demostración). Corre en Chromium
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
IPPU_DEMO_PASSWORD=… node conectada.js          # PowerShell: $env:IPPU_DEMO_PASSWORD="…"; node conectada.js
```

Opcionales: `API=` y `DEMO=` (otras URL), `IPPU_DEMO_EMAIL=` (por omisión `gonzalez@demo.ippu.test`),
`HEADED=1` (ver el navegador). Si Playwright pide un navegador que no está cacheado:
`npx playwright install chromium`.

**Qué verifica** (46 chequeos): (a) login del técnico y chip con su nombre y rol · (b) contraseña mala →
mensaje en `role="alert"` con foco y `sessionStorage` vacío · (c) conteos del listado y del filtro de
grupo **iguales a los de `backend/tests/test_m11_5a_seed_demo.py`** (7 activos · 8 con inactivos ·
Escolares 3 · Preadolescentes 3 · Adolescentes 2) · (d) búsqueda por la cédula de Martín → 1 fila ·
(e) Bruno con «CI pendiente» · (f) HCE-00 de Martín contra `GET /hce/{id}` y los técnicos del grupo, sin
los campos que la API no guarda y sin los colores de grupo de la demo · (g) panel «Modo demostración — no
se guarda» en pestañas y vistas no conectadas · (h) logout · y además token inválido (401 → login),
recarga con sesión, API caída (mensaje legible), pestañas por teclado y **0 errores de JavaScript**. Desde el fix de revisión también: la **regla de búsqueda** (cédula de 7/8 dígitos → `ci`, límite 6/7 dígitos, nombre) contra el GET real, el **login como diálogo modal** (app inerte, Tab sin escapes, foco al título tras entrar), **sin desborde horizontal** a 390/1024/1280 px, **sin «Fase …» en texto visible**, y **«Salir» con cargas en vuelo** (detalle y recarga del flujo, con `page.route` demorando la respuesta).
Depende de que la base sea la del seed (8 NNA, Tomás dado de baja): sobre otra base los conteos no dan.

⚠️ **`fingerprint.js` y `herramientas/verificar_contraste_ui.js` NO corren tal cual desde la Fase 3-a:**
abren la demo por `file://` y esperan que «Ingresar» entre sin API. Hay que adaptarlos (servir en :5500 y
loguear con el seed). Para el contraste se usó una copia adaptada (`handoff.md` §5.122); el original sigue
sin tocar.

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
| **C — Interacciones** | Firma de CI (con autorizaciones y adjunto) · firma PA + PB con **delta B−A y alerta institucional** (M5.3) · addenda sobre módulo firmado y rechazo sobre no firmado · habilitación excepcional · modales de alta/edición/recibí · vistas armadas por JS (IDEA, protocolos, informe de cierre, HCE-VF) |
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
> de `F.pasos` — lo que `fingerprint.js` captura (hoy: **42**, `pasos capturados` en su propia
> salida). Un **campo comparado** es lo que `comparar.js` reporta por fila — los 42 pasos **más**
> el campo `errors` (comparado aparte, bajo «ERRORES DE CONSOLA / PAGINA») — hoy: **43**. Todo lo
> que hable de un `.json` capturado dice "pasos"; todo lo que hable de una corrida de
> `comparar.js` (`X iguales · Y distintos`, o "X/43") dice "campos comparados". Los dos números
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
