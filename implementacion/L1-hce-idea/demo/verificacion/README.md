# Verificación de la demo L1

Herramientas de Playwright (Chromium headless) que prueban la demo **contra una API real**. Cómo se levanta todo
—base descartable, API en `:8001`, demo en `:5500`— está **una sola vez** en `CLAUDE.md`, sección «Cómo correr»;
acá va el uso de cada herramienta.

**Para correr `conectada.js` (y medir el contraste) se usa el runner `herramientas/correr_conectada.ps1`** (§5.167 d), no una receta a mano:
recrea la base descartable y su carpeta de archivos, levanta la API (`:8001`) y la demo con `preparar_presentacion.ps1 -Base ippu_ver
-PuertoApi 8001`, corre la herramienta, muestrea cada 5 s la memoria disponible, las conexiones TCP por estado y la memoria de node y
python, guarda por corrida la salida, los logs y las muestras **fuera del repo**, imprime una tabla y detiene todo lo que arrancó.
Una falla se lee con lo que deja: el volcado de diagnóstico de `conectada.js` y las muestras de esa corrida.

```powershell
$env:IPPU_PASSWORD = "<clave del admin>"; $env:IPPU_DEMO_PASSWORD = "<clave de los técnicos>"
powershell -ExecutionPolicy Bypass -File herramientas\correr_conectada.ps1 -Corridas 2 -ConContraste *> $env:TEMP\correr.txt   # nunca por un pipe
```

Parámetros: `-Corridas` · `-Base` (descartable; se niega con `ippu`, `ippu_test` e `ippu_presentacion`) · `-Salida` (por omisión
`%TEMP%\ippu-correr-conectada\<fecha-hora>`; se niega dentro del repo) · `-ConContraste` (mide el contraste sobre la base recién cargada,
antes de que `conectada.js` escriba) · `-LimiteMinutos` · `-MuestreoSegundos` · `-ServidorDemo` (medición, §5.167 f). Si hay una
presentación preparada sobre otra base, no corre. En cada `corrida-NN\`: `conectada.txt`, `api.log`, `demo.log`, `preparar.log`, `muestras.csv`.

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
Receta a mano (el runner de arriba la hace por vos): `CLAUDE.md`, «Cómo correr», pasos 2 a 4 (con `DATABASE_URL` en la misma terminal, antes de `alembic` y del seed). **Todo por
`127.0.0.1`, no `localhost`** (§5.166): el `DATABASE_URL`, el `API=` y el `DEMO=` de las herramientas (que ya lo traen por omisión).
Entre una corrida y la siguiente: parar la API y repetir esos pasos.

## `conectada.js`

```powershell
$env:API = "http://127.0.0.1:8001"; $env:CONFIRMA_BASE_DESCARTABLE = "1"
$env:IPPU_DEMO_PASSWORD = "…"; $env:IPPU_ADMIN_EMAIL = "…"; $env:IPPU_ADMIN_PASSWORD = "…"
node conectada.js
```

Sale con 0 si pasa todo y con 1 si algo falla o si la API o la demo no están arriba. Cada chequeo se imprime con su
identificador y nombre.

**Si la corrida se cuelga o se aborta** (un timeout, un error del script, `SIGINT`/`SIGTERM` o el tope `CONECTADA_LIMITE_MS` que pone el
runner), antes de salir vuelca por stderr un `DIAGNÓSTICO`: el último chequeo registrado, los **pedidos en vuelo** (método, URL, desde cuándo),
los archivos de la demo que fallaron (con la hora y el chequeo anterior) y las **últimas 20 líneas de consola**. Con eso se ve qué estaba esperando.

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
| `f1b-` | Tipografía y color (F1b): Segoe UI sin webfont, títulos en sans 600, ningún texto visible por debajo de 12 px, `--fs-base` 15 px, etiquetas en sans 12 px / 600 sin versalitas, monoespaciada sólo en códigos e identificadores (desde F3, también en ORG y en Auditoría con «ver completo»), serif sólo en documentos; todo `.btn-primary` en tinta, el naranja de marca sin texto, sin superficies oscuras fuera de la barra superior y la lateral. (La tira de pestañas de F1b la mide `f1-tabs`: una fila con ≥ 40 px libres a 1280, mismo alto, «Solo demo» compacto) |
| `f3-` | Pasada visual final (F3, §5.160), **no escribe** (las escrituras que dispara se contestan en el navegador): una cabecera de tarjeta y una familia de etiquetas en las 20 pantallas conectadas; la banda del IDEA en un renglón y sin recortarse a 1280 y 1024; el editor del LB de Joaquín sin nada bajo 12 px ni recortado y su consigna una vez; las etiquetas del radar del IC ≥ 12 px; valores de ficha en 400, iniciales del avatar, título de Pendientes; el tipo del aviso flotante; sin emoji en las fuentes y ningún control sin nombre; «Guardar» secundario junto a «Firmar»; Auditoría con módulo y campo legibles; los estados de SEV, ORG y LOG |
| `c1-` | HCE-LOG de sólo lectura (C1): las firmas de LB, PA, PB e IC de Martín con el nombre del autor, una edición de HCE-00 con antes → después, filtros por módulo y tipo (las opciones son las válidas), paginado de 25, hora local del navegador, valores largos con «ver completo» y JSON legible, estado vacío, errores 404/500 de la API, sin botón «Ver auditoría» en el expediente conectado, sólo lectura (no agrega filas) y 404 para un técnico en un expediente ajeno |
| `c2-` | HCE-SEV (C2): la severidad de Martín con la etiqueta de la API, justificación, fecha y autor, y la regla del módulo una vez; la referencia DSM-5-TR (de `GET /severidad-niveles`) plegada; la severidad no sale de su pestaña; estado vacío y registro (un POST con los cuatro campos); con un dominio o todo vacío se marcan los campos y no sale ningún pedido; 422 por campo; confirmación al descartar; editar CS de 2 a 3 (PATCH de un campo) y verlo en Auditoría con antes → después; 404 para un técnico en un expediente ajeno; el Reporte de VF no lleva la severidad (`c2-vf-reporte`: ni «Grado», ni las etiquetas, ni la justificación) |
| `c3-` | HCE-ORG (C3): INAU y BPS de Martín con lo que devuelve la API y sus envíos del más nuevo al más viejo; la nota del IC (§5.3); la alerta AYEX es la de la respuesta (`c3-sin-calculo` fuerza respuestas distintas: el navegador no cuenta días); la alerta de 30 días de Sofía con ⚠ y en palabras; estado vacío y registrar (un POST sólo con lo completado); Joaquín con INAU y sin envíos; opciones de BPS de `GET /organismos/opciones`; sin cambios, vacío (422 sin campo) y 422 por campo en el resumen `role="alert"`; confirmación al descartar; editar BPS (PATCH sólo de lo que cambió; la alerta desaparece); agregar una gestión (aparece primera, con el autor del token); Auditoría con `bps.estado` antes → después; 404 en las siete rutas para un técnico en un expediente ajeno |
| `c4-` | HCE-INC (C4): la ficha de Martín con lo que devuelve la API, agrupada, con el estado en tinta (sin ok/warn/bad), su descripción y «desde»; `c4-sin-calculo` fuerza respuestas distintas (fecha_estado, descripción, sensible, última gestión, cantidad: el navegador no calcula); Joaquín «Sin registrar», sin «Agregar gestión» y 404 de la API a una gestión sin ficha; registrar desde el diálogo (un POST, 201, fila en Auditoría); cambiar el estado (sólo los asignables; PATCH sólo del estado; «Sin registrar» → 422 por la API); agregar una gestión (contenido en blanco → 422 de la API junto al campo; con texto, primera); la marca «Sensible» de Sofía en texto; 404 en las cinco rutas para un técnico en un expediente ajeno; la vista «Inclusión» contra `GET /inclusion` (filtro por estado, alcance, abre la pestaña); «Salir» con la lista en vuelo. **Escribe** (ficha y gestión de Joaquín, un expediente ajeno del admin) |
| `c5-` | HCE-DOC (C5): los documentos de Martín contra `GET /hce/{id}/documentos` (el histórico con su marca en texto y sin «Editar»); subir un PDF desde el diálogo (un POST multipart, queda primero; la descarga trae los mismos bytes, va con `Authorization` y sin token es 401); un HTML llamado «.pdf» → 422 junto al campo con el resumen enfocado y un archivo de 11 MB → el 413; PATCH de un histórico → 409 y editar el nombre de uno común deja su fila en Auditoría; la foto de Sofía sin autorización (sin aviso, miniatura `blob:`); la autorización de Joaquín con uno de sus documentos (y 422 con uno de otro expediente); la foto del grupo Escolares (Torres y el admin la ven; en Inicial, 404); un expediente ajeno (404 y «no encontrado»); DELETE → 405. **Escribe** (documentos y fotos de Martín, Sofía, Joaquín y Escolares; un expediente ajeno y una foto en Inicial, del admin) |
| `f2-` | Pendientes y Grupos conectados (F2): `GET /recordatorios`; las filas de Pendientes contra el `ci`/`flujo` de `GET /hce`, filtros con su conteo y los dos botones de Inicio; Grupos del técnico y del admin contra `GET /grupos`, integrantes idénticos a los del listado, «Salir» con una respuesta en vuelo, WCAG 2.5.8 / 2.4.11 y celdas sin recortar a 1024 y 1280; **`f2-asignar` ESCRIBE** (asigna técnicos a Inicial desde el diálogo: 200, 422 junto al campo, descarte) y va al final |
| `c7-` | Panel institucional (C7): cada número de la pantalla contra `GET /panel?anio=` (sólo formato), el selector de año (`?anio=`; el año anterior sin enlaces a Pendientes), los recordatorios de `GET /recordatorios` (una cuenta abre Pendientes con su filtro), `c7-sin-calculo` (una respuesta simulada con números incoherentes: la pantalla los muestra tal cual), error con «Reintentar», sólo el heatmap en demostración, «Salir» con la respuesta en vuelo; **`c7-alcance` ESCRIBE** (saca a la Mtra. Torres de sus grupos para tener un técnico sin grupo: n 0 y estados vacíos) y va al final |
| `sec-` | Auditoría de seguridad (§5.157 b): con una sesión abierta, `?api=` a un servidor espía en `127.0.0.1:9999` (que contesta el preflight) no le manda ningún `Authorization` y el login muestra a qué API iría la contraseña; un host que no es `localhost` ni `127.0.0.1` se ignora; con el `?api=` de la corrida entra y una recarga conserva la sesión. **Necesita el puerto 9999 libre** |
| `carga-` | La página que no carga completa (§5.166 c): se aborta a propósito `js/expediente.js` con `route.abort`. **Una carga completa** no muestra el aviso y no deja la marca `ippu.cargaReintento`; **si falla sólo la primera vez** hay una recarga automática (el módulo se pide dos veces), no hay aviso y la sesión arranca; **si falla siempre** queda el aviso «La página no cargó completa. Recargá para seguir.» (`role="alert"`, la lista de lo que falta en `data-faltan` **incluye** `expediente.js`: si por un fallo de red real cayó otro archivo, aparece también y `z-carga` lo cuenta), el login inerte, ningún pedido a la API, «Recargar» con el foco, alcanzable con Tab y operable con Enter; y cuando el archivo vuelve, «Recargar» completa la carga y borra la marca. **La hoja de estilos** (§5.167 a, `carga-css-*`): `index.html` lee `--ink` (la define `:root` de `css/estilos.css`) y trata la hoja como un módulo más: si falta la primera vez, una recarga y todo normal; si falta siempre, el aviso —que lleva su estilo mínimo en línea y es legible sin la hoja— con `css/estilos.css` en `data-faltan`; y cuando la hoja vuelve, «Recargar» completa la carga |
| `z` | Cero errores de JavaScript en toda la corrida (descarta el texto «Failed to load resource»: es el 4xx/5xx esperado de la API) |
| `z-carga` | Ningún archivo estático de la demo falló al cargar: un `requestfailed` de un pedido al origen de la demo (`index.html`, `js/`, `css/`) falla la corrida con el nombre del archivo, el error, la hora y el chequeo que acababa de registrarse (§5.166 d, §5.167 e). En las páginas de `carga-` sólo se descuenta el archivo que se aborta a propósito: otro que falle, cuenta |

## `capturas.js`

```powershell
$env:API = "http://127.0.0.1:8001"; $env:CONFIRMA_BASE_DESCARTABLE = "1"; $env:IPPU_DEMO_PASSWORD = "…"
node capturas.js
```

Deja una imagen por pantalla (login, listado, HCE-00, CI, LB, PA, PB con Δ, editor del IC, informe impreso, VF, los organismos —lectura, la alerta AYEX y el formulario de BPS— y una vista
de modo demostración; F2: Pendientes con su filtro, el listado de Grupos, un grupo abierto y, con `IPPU_ADMIN_EMAIL` / `IPPU_ADMIN_PASSWORD`, el diálogo «Asignar técnicos») a **1280×800 y a 1024×768** en `salidas/` (ignorada por git), más tres de página completa (`f1-…-completa`: editor de LB, PB con su «Resultado» y editor del IC; mientras se captura, la barra de acciones pasa al flujo normal —queda al pie y no tapa nada— y después se restaura). No compara nada: es para mirar.
Escribe: sólo contra una base descartable recién cargada.

## Contraste — `herramientas/verificar_contraste_ui.js`

```powershell
$env:API = "http://127.0.0.1:8001"; $env:IPPU_DEMO_PASSWORD = "…"
node ..\..\..\..\herramientas\verificar_contraste_ui.js [--tabla] [--json salida.json]
```

Abre la demo en `:5500` con `?api=<API>`, entra como el técnico del seed (y, si están `IPPU_ADMIN_EMAIL` / `IPPU_ADMIN_PASSWORD`, al final como el admin para medir «Asignar técnicos» y su diálogo, sin guardar) y mide, sobre lo que **realmente se renderiza**:
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
- Se mide sobre una base **recién cargada** y **antes** de `conectada.js`, que firma lo que el seed deja en borrador. Mide también el aviso
«La página no cargó completa» (con `js/expediente.js` abortado y, aparte, con `css/estilos.css` abortada: ahí mide sólo el aviso, que lleva su estilo en línea, §5.167 a) y el anillo de su botón «Recargar»; un `requestfailed` de un archivo de la demo
invalida la medición y sale con 1.

## `fingerprint.js` y `comparar.js` — que un refactor no cambie las vistas en modo demostración

No dicen que la demo esté bien: dicen que **se comporta igual que antes**. Sirven al refactorizar `demo/js/` sin querer
cambiar comportamiento. `fingerprint.js` captura el estado de las vistas y de los expedientes de ejemplo 101–108 en
modo demostración (con las horas normalizadas para que dos corridas en distinto minuto no den falsos positivos);
`comparar.js` compara dos capturas.

```powershell
$env:API = "http://127.0.0.1:8001"; $env:IPPU_DEMO_PASSWORD = "…"
node fingerprint.js http://127.0.0.1:5500/index.html antes.json     # demo conectada: hace login y recorre el modo demostración; no escribe
node fingerprint.js ../index.html antes.json                        # ruta a un .html: versiones anteriores a la Fase 3, sin API
node comparar.js antes.json despues.json                            # exit 0 = idénticos; exit 1 = diferencias, con la primera
```

Para comparar dos versiones: `git worktree add ../ippu-wt-antes <commit-o-rama>`, capturar la versión anterior (con la ruta
a su `index.html` si es previa a la Fase 3; si ya es la conectada, con su `demo/` servida en `:5500`) y la de trabajo,
comparar y `git worktree remove ../ippu-wt-antes`. **Nunca** con un
junction/symlink a `node_modules` (`CLAUDE.md`, «Verificación — reglas de higiene»). Los `*.json` capturados son artefactos
locales: `.gitignore` los excluye y **no hay captura de referencia versionada**; el orden de los pasos importa (cada
interacción muta el modelo del siguiente), así que los pasos nuevos van al final.
