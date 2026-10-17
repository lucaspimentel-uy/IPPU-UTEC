# Verificación de la demo L1

Herramientas de Playwright (Chromium headless) que prueban la demo **contra una API real**. Cómo se levanta todo
—base descartable, API en `:8001`, demo en `:5500`— está **una sola vez** en `CLAUDE.md`, sección «Cómo correr»;
acá va el uso de cada herramienta.

| Herramienta | Para qué | ¿Escribe en la API? |
|---|---|---|
| `conectada.js` | Prueba de punta a punta de las pantallas conectadas | **Sí** |
| `capturas.js` | Una imagen por pantalla, para mirar | **Sí** (crea una VF) |
| `../../../../herramientas/verificar_contraste_ui.js` | Contraste y anillos de foco | **No, por construcción** |
| `fingerprint.js` + `comparar.js` | Que un refactor no cambie las vistas en modo demostración | No |

## Instalación (una vez)

Playwright está fijado a una versión exacta en `package.json` y `package-lock.json`: todo el equipo corre la misma.

```bash
cd implementacion/L1-hce-idea/demo/verificacion
npm ci                          # instala lo del lockfile
npx playwright install chromium # una vez por máquina y por versión de Playwright
```

`conectada.js` lee el PDF del informe de cierre con el `python` que haya en el PATH: necesita `pypdf`
(`pip install pypdf`). No instalar con `npm install playwright --no-save`: trae la última y rompe el pin.

## Base descartable

`conectada.js` y `capturas.js` **escriben** (crean expedientes, los editan, firman, agregan addendas, registran el
recibí, crean la VF). Los conteos del principio son los del seed recién cargado, así que **cada corrida pide una base
nueva** y ambas se niegan a correr sin `CONFIRMA_BASE_DESCARTABLE=1`: salen con exit 1 **antes de pedirle nada a la
API**. Ponerla es afirmar que la base es la descartable y no la de trabajo ni la de la presentación.
Receta: `CLAUDE.md`, «Cómo correr», pasos 2 a 4 (con `DATABASE_URL` en la misma terminal, antes de `alembic` y del seed).
Entre una corrida y la siguiente: parar la API y repetir esos pasos.

## `conectada.js`

```powershell
$env:API = "http://localhost:8001"; $env:CONFIRMA_BASE_DESCARTABLE = "1"
$env:IPPU_DEMO_PASSWORD = "…"; $env:IPPU_ADMIN_EMAIL = "…"; $env:IPPU_ADMIN_PASSWORD = "…"
node conectada.js
```

Sale con 0 si pasa todo y con 1 si algo falla o si la API o la demo no están arriba. Cada chequeo se imprime con su
identificador y nombre.

- `IPPU_DEMO_PASSWORD`: contraseña de los técnicos de la demo (la del seed). `IPPU_DEMO_EMAIL` (opcional): por omisión
  `gonzalez@demo.ippu.test`.
- `IPPU_ADMIN_EMAIL` / `IPPU_ADMIN_PASSWORD`: el admin con el que se corrió `app.seed_demo` (`IPPU_EMAIL` / `IPPU_PASSWORD`).
- `API=` y `DEMO=`: otras URL. `API=` cambia de verdad la API del navegador (la demo se abre con `?api=<API>`): la prueba
  y la demo hablan con la misma. `HEADED=1` muestra el navegador.
- Depende de que la base sea la del seed (8 NNA, Tomás dado de baja): sobre otra base los conteos no dan.

El **prefijo** del identificador es la fase que lo introdujo:

| Prefijo | Qué cubre |
|---|---|
| `3a-` | Login (técnico, contraseña mala, 401, recarga con sesión, API caída), listado y filtros, búsqueda, HCE-00 de lectura, modo demostración, sin desborde |
| `3b-` | HCE-00 editable (`PATCH` sólo con lo que cambió, baja y reingreso), alta con asistente, 409 de cédula, CI, stepper del flujo, errores por campo |
| `3c-` | IDEA, PA y PB: crear, editar, firmar sin cuerpo, addendas, 422 por dimensión y por campo, Δ y alerta de la API, NS, suma «provisorio», selector de grupos del técnico, sin candados, fotos sin trabas |
| `3d-` | IC (crear, dos firmantes, addendas, recibí), documento impreso A4 con `page.pdf()` a tres escalas, edad a la fecha del documento, 409 como «Cambió en el servidor», VF (categoría y alerta sólo de la API) |
| `3e-` | Con teclado real: enlace de salto, recorrido completo sin que el foco caiga en `<body>`, anillo de foco, tabindex móvil del IDEA, diálogos con Tab atrapado, confirmar al cerrar, reflow, mensajes de validación en castellano, regla de color, estados compartidos, panel de demostración |
| `f1-` | Banda del paciente (posición del primer bloque a 1280×800 y 1024×768, pegada al bajar, alerta clínica en todas las pestañas), pestañas en una/dos filas, WCAG 2.2 2.4.11 (foco no tapado) y 2.5.8 (objetivos ≥ 24 px), listado de cinco columnas (un Tab por fila, «✓ CI»), sin la vista «Intermedia» ni textos de desarrollo, `aria-current`, KPI y layout por debajo de 1180 px |
| `f1b-` | Tipografía y color (F1b): Segoe UI sin webfont, títulos en sans 600, ningún texto visible por debajo de 12 px, `--fs-base` 15 px, etiquetas en sans 12 px / 600 sin versalitas, monoespaciada sólo en códigos y puntajes, serif sólo en documentos; todo `.btn-primary` en tinta, el naranja de marca sin texto, sin superficies oscuras fuera de la barra superior y la lateral. (La tira de pestañas de F1b la mide `f1-tabs`: una fila con ≥ 40 px libres a 1280, mismo alto, «Solo demo» compacto) |
| `c1-` | HCE-LOG de sólo lectura (C1): las firmas de LB, PA, PB e IC de Martín con el nombre del autor, una edición de HCE-00 con antes → después, filtros por módulo y tipo (las opciones son las válidas), paginado de 25, hora local del navegador, valores largos con «ver completo» y JSON legible, estado vacío, errores 404/500 de la API, sin botón «Ver auditoría» en el expediente conectado, sólo lectura (no agrega filas) y 404 para un técnico en un expediente ajeno |
| `c2-` | HCE-SEV (C2): la severidad de Martín con la etiqueta de la API, justificación, fecha y autor, y la regla del módulo una vez; la referencia DSM-5-TR (de `GET /severidad-niveles`) plegada; la severidad no sale de su pestaña; estado vacío y registro (un POST con los cuatro campos); con un dominio o todo vacío se marcan los campos y no sale ningún pedido; 422 por campo; confirmación al descartar; editar CS de 2 a 3 (PATCH de un campo) y verlo en Auditoría con antes → después; 404 para un técnico en un expediente ajeno; el Reporte de VF no lleva la severidad (`c2-vf-reporte`: ni «Grado», ni las etiquetas, ni la justificación) |
| `z` | Cero errores de JavaScript en toda la corrida |

## `capturas.js`

```powershell
$env:API = "http://localhost:8001"; $env:CONFIRMA_BASE_DESCARTABLE = "1"; $env:IPPU_DEMO_PASSWORD = "…"
node capturas.js
```

Deja una imagen por pantalla (login, listado, HCE-00, CI, LB, PA, PB con Δ, editor del IC, informe impreso, VF y una vista
de modo demostración) a **1280×800 y a 1024×768** en `salidas/` (ignorada por git), más tres de página completa (`f1-…-completa`: editor de LB, PB con su «Resultado» y editor del IC; la banda y la barra de acciones quedan donde las deja el desplazamiento). No compara nada: es para mirar.
Escribe: sólo contra una base descartable recién cargada.

## Contraste — `herramientas/verificar_contraste_ui.js`

```powershell
$env:API = "http://localhost:8001"; $env:IPPU_DEMO_PASSWORD = "…"
node ..\..\..\..\herramientas\verificar_contraste_ui.js [--tabla] [--json salida.json]
```

Abre la demo en `:5500` con `?api=<API>`, entra como el técnico del seed y mide, sobre lo que **realmente se renderiza**:
los pares texto/fondo, el texto que se escribe en un campo, el borde de los campos (3:1) y el anillo de foco con
teclado real. Recorre todas las pantallas conectadas y los diálogos, y separa lo que falla en ellas de lo que falla sólo
en las vistas de modo demostración. Al final imprime su cobertura. `--tabla` lista los pares que fallan; `--json` guarda
el resultado crudo. Sale con 1 si falla algo en una pantalla conectada, si falla un anillo o si el CSS apaga un contorno.

- **Línea base: ningún par ni borde falla**; todo par nuevo ≥ 4,5:1. Las notas están en
  `docs/guias/notas-accesibilidad-ui.md`, sección «Línea base vigente».
- **Nunca escribe en la API, por construcción:** una ruta del navegador deja pasar sólo `GET` y `POST /auth/login`; las dos
  confirmaciones de firma que pulsa para medir los errores reciben un 422 enlatado, y cualquier otro `POST`/`PATCH`/`PUT`/`DELETE`
  se aborta y termina la corrida con código 1 nombrándolo. Al final imprime los contadores; con `VERIFICAR_AUTOPRUEBA=1`
  prueba el filtro (un `POST` sin ruta debe terminar en código 1).
- Se mide sobre una base **recién cargada** y **antes** de `conectada.js`, que firma lo que el seed deja en borrador.

## `fingerprint.js` y `comparar.js` — que un refactor no cambie las vistas en modo demostración

No dicen que la demo esté bien: dicen que **se comporta igual que antes**. Sirven al refactorizar `demo/js/` sin querer
cambiar comportamiento. `fingerprint.js` captura el estado de las vistas y de los expedientes de ejemplo 101–108 en
modo demostración (con las horas normalizadas para que dos corridas en distinto minuto no den falsos positivos);
`comparar.js` compara dos capturas.

```powershell
$env:API = "http://localhost:8001"; $env:IPPU_DEMO_PASSWORD = "…"
node fingerprint.js http://localhost:5500/index.html antes.json     # demo conectada: hace login y recorre el modo demostración; no escribe
node fingerprint.js ../index.html antes.json                        # ruta a un .html: versiones anteriores a la Fase 3, sin API
node comparar.js antes.json despues.json                            # exit 0 = idénticos; exit 1 = diferencias, con la primera
```

Para comparar dos versiones: `git worktree add ../ippu-wt-antes <commit-o-rama>`, capturar la versión anterior (con la ruta
a su `index.html` si es previa a la Fase 3; si ya es la conectada, con su `demo/` servida en `:5500`) y la de trabajo,
comparar y `git worktree remove ../ippu-wt-antes`. **Nunca** con un
junction/symlink a `node_modules` (`CLAUDE.md`, «Verificación — reglas de higiene»). Los `*.json` capturados son artefactos
locales: `.gitignore` los excluye y **no hay captura de referencia versionada**; el orden de los pasos importa (cada
interacción muta el modelo del siguiente), así que los pasos nuevos van al final.
