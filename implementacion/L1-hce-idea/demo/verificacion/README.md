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

Ojo: si la demo está partida en `css/` y `js/`, recuperar sólo el `index.html` no alcanza —
usá `git stash` o un `git worktree` de la versión previa completa.

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
