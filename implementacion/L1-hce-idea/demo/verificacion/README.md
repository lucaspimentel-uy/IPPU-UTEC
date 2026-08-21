# Verificación de la demo L1 — *fingerprint* de comportamiento

La demo no tiene tests unitarios. Esto es lo que hay en su lugar: un script que **captura
cómo se comporta la demo** (un "fingerprint") y otro que **compara dos capturas**.

Sirve para una pregunta concreta:

> Cambié algo que **no debería** alterar el comportamiento (un refactor, mover código,
> partir un archivo, renombrar). ¿Rompí algo?

Se captura antes, se captura después, se comparan. Si difieren, algo se rompió.

## Instalación (una vez)

Playwright no está como dependencia del repo. Se instala suelto:

```bash
cd implementacion/L1-hce-idea/demo/verificacion
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install playwright --no-save
```

En PowerShell:

```powershell
cd implementacion\L1-hce-idea\demo\verificacion
$env:PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1; npm install playwright --no-save
```

`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` evita bajar los navegadores de nuevo: en las máquinas
del equipo ya están cacheados en `~/AppData/Local/ms-playwright`. Si es una máquina nueva y
falla por falta de navegador, corré `npx playwright install chromium` una vez.

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

Tenerlo requeriría tres cosas, y ninguna es gratis: (1) sacar `*.json` del `.gitignore` o
exceptuar un `baseline.json`; (2) **fijar** el escenario de la Parte C, que hoy muta el
modelo en un orden que cambia cuando alguien agrega un paso; y (3) aceptar que cada cambio
intencional de comportamiento obliga a re-commitear el baseline, con la revisión que eso
implica — si no, se vuelve un archivo que todos regeneran sin mirar. **Queda anotado como
opción, no como pendiente**: mientras el harness se use para verificar refactors puntuales,
dos capturas locales alcanzan.

## ⚠️ Estado del harness al 2026-08-20 — hoy no corre de punta a punta

Después del merge de `demo/F1-navegacion`, la Parte A quedó desalineada con la demo. Antes
de confiar en una corrida hay que arreglar dos cosas (ninguna se hizo la noche del 20/08,
a propósito: era la víspera de la reunión con IPPU):

- **`fingerprint.js:82` recorre `['inicio','pendientes','analitica','grupos','usuarios']`.**
  `usuarios` **ya no es un `.navitem`**: F1/B2 lo sacó de la barra de navegación (el
  `#view-usuarios` sigue existiendo, se llega por otro lado). El `page.click()` sobre
  `.navitem[data-view="usuarios"]` **tira**, así que la corrida aborta ahí.
- **Faltan las dos vistas nuevas:** `inclusion` y `ateneos` existen como `.navitem` y como
  `#view-*`, y el harness no las visita — o sea que no las cubre.

Arreglarlo es cambiar esa lista por las vistas que la demo realmente tiene. Es barato; lo
que **no** es barato es correrlo sin saber esto y creer que el verde significa algo.
