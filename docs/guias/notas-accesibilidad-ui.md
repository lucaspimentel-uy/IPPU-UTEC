# Notas de accesibilidad — UI de la demo

> **Qué es esto.** Un registro de hallazgos y de reglas **medidas**, para quien toque `demo/`. No es una guía de estilo:
> dice qué se exige (WCAG 2.x AA), cómo se mide, qué decisión de color y de foco rige hoy y qué queda abierto.
>
> **Historia.** La primera versión es del 2026-08-21 (sólo documentación, escrita antes de las Fases 3-a…3-d) y se apoyaba en
> una paleta borrador que nunca se publicó. **Se reescribió el 2026-10-16 (Fase 3-e, `handoff.md` §5.135)** contra lo que corre
> hoy: las secciones que contradecían decisiones posteriores (§5.94, §5.95, §5.99) se corrigieron y las ya resueltas se
> dieron por cerradas.
>
> **Regla de higiene (`CLAUDE.md`, «Verificación — reglas de higiene»).** Este archivo **no afirma cantidades de pares ni
> rangos de contraste, ni números de línea**: no se reproducen entre corridas ni entre pantallas. Sólo se escribe **«los
> mismos pares que fallan que la línea base»** (§2.3) y **«todo par nuevo ≥ 4,5:1»**.
>
> **Concordancia con la numeración anterior** (para no romper citas viejas): el §2.1–§2.5 de la versión de agosto (paleta
> borrador) es hoy la nota histórica del §2.1; el §2.6 (anillos de foco) pasó al **§4 «Foco»**; el §2.7 (pares texto/fondo)
> es hoy el §2.2–§2.3; el §3.1 y el §3.2 (A y B) conservan su número.
>
> Citar por sección: p. ej. `notas-accesibilidad-ui.md §3.1`.

---

## 1. Relación con el restyle de F1

F1 (`5544e71`, «restyle visual completo») ya corrigió una instancia de esta misma familia de problemas: oscureció el naranja
institucional de `#DD7B0C` a `#B4590A` porque «se usa como texto y no llegaba a AA». Es la prueba de que el criterio de
este documento se aplica y se verifica. Lo que vino después —la pasada de la Fase 3-e— generaliza ese criterio a todo el
cromo, a los estados, a los campos y al foco.

---

## 2. Contraste WCAG

### 2.1 Nota histórica — la paleta borrador de agosto

La versión original medía una **paleta borrador** (anillo de foco translúcido, borde de campo `#CBD5E1`, blanco sobre `#D97706` y
`#16A34A`, fila seleccionada `#E0F2FE`, texto secundario `#64748B`) que motivó el restyle pero **nunca se publicó**: ninguno de
esos valores existe en `estilos.css`. Sus ratios dejaron de describir la demo y se retiraron. Quedan de ella tres lecciones que
siguen vigentes y hoy están resueltas por construcción:

- un anillo de foco translúcido no alcanza (se reemplazó por un contorno sólido: **§4**);
- el borde de un campo tiene que distinguirse del fondo, no sólo de otro borde (el token `--control-borde`: **§2.4**);
- un dato clínico numérico no debería apoyarse en un contraste que pasa «por poco»: ninguna cifra se pinta con el color
  terciario `--ink-3` (**§2.4**).

### 2.2 Qué mide la herramienta y dónde

`herramientas/verificar_contraste_ui.js` abre la demo con Playwright, recorre pantallas y diálogos, y lee **lo que el navegador
ya resolvió** (`getComputedStyle`, no el CSS): no hay estimaciones a mano. Mide, por separado:

1. **Pares texto/fondo** (1.4.3: 4,5:1, o 3:1 para texto grande) de todo elemento con texto propio visible, más el **texto que
   escribe una persona** en un campo (el color del valor y el de su `placeholder`). El fondo es el real: se componen las capas
   translúcidas hacia arriba hasta el primer fondo opaco.
2. **Borde de los campos** (`input`, `select`, `textarea`): 3:1 contra lo que tienen detrás (1.4.11).
3. **Anillo de foco** con **teclado real** (ver **§4**).

**Cobertura** (la lista exacta se imprime al final de cada corrida, en «Cobertura»):

- **Conectadas** — login y su error; listado con sus estados (cargando, error, vacío, filas, filtro «Todos»); aviso (*toast*);
  Pendientes (con el bloque de períodos abierto, un filtro activo, cargando, error y vacío) y Grupos (listado, un grupo abierto y, como
  admin, «Asignar técnicos» con su diálogo abierto —con errores de muestra y la confirmación de descarte— sin guardar); Inclusión
  (la lista del área, su filtro por estado, cargando, error y vacío);
  expediente de la API con sus 13 pestañas; Auditoría (LOG: carga, filtros, paginado, error y vacío); Severidad (SEV: vacía,
  lectura, diálogo de registro y de edición) y Organismos (ORG: vacía, lectura con la alerta AYEX, diálogos del vínculo y del
  registro); Inclusión del expediente (INC: lectura con una gestión «Sensible», la referencia de los 7 estados, el diálogo de la ficha
  —sin cambios y confirmación de descarte— y el de una gestión con un error de muestra junto al campo, sin ficha y con error);
  Documentos del expediente (DOC, C5: lectura con un registro histórico, la foto con su miniatura y la autorización; los diálogos
  «Cargar documento» —con un error de muestra junto al archivo y la confirmación de descarte—, «Editar documento», «Cargar foto» y el
  de la autorización; sin autorización y con error) y la tarjeta «Fotos del grupo» de Grupos (con miniatura, su diálogo y «no encontrado»);
  Ateneos (C6: el indicador y la lista con un clínico «Sensible», cargando, error y vacío; el detalle de un clínico con acuerdos,
  documentos y un aviso de la API; «no encontrado»; los diálogos «Nuevo registro» —clínico con un acuerdo y errores de muestra junto
  al NNA y a los acuerdos, y el bloque de la jornada—, «Editar registro» —con la banda de confirmación de la conversión de un clínico, con cada uno de sus dos textos—, «Agregar acuerdo» con un error de muestra y «Adjuntar
  documento», abiertos sin guardar) y la tarjeta «Ateneos clínicos» de la pestaña «Datos» de Martín;
  el Panel institucional (C7: el técnico y el admin, el año anterior, las alertas por escala, sin ciclo A → B, sin expedientes
  activos, cargando y error; el heatmap de demostración de su tarjeta se mide con él);
  CI (pendiente con errores, registrado, en edición); IDEA (borrador con `NS`,
  confirmación de firma, 422 por dimensión y por campo, firmado con banda y addendas); PA y PB (borrador, errores de firma, Δ);
  IC (sin crear, confirmación y errores de firma, avisos y «Cambió en el servidor», firmado); documento impreso del IC; VF
  (vacía, formulario, las cinco categorías del baremo, los niveles y la alerta de vigencia) y su reporte; diálogo de alta/edición
  en sus cuatro pasos y su confirmación de descarte; diálogo del recibí y su confirmación; estados compartidos (cargando, error,
  vacío, error en línea); enlace de salto enfocado; y el **cromo** (barra superior y lateral) en todas ellas.
- **Modo demostración**, informadas aparte: Perfil y el expediente de ejemplo (desde C7 la Analítica es el Panel institucional conectado).
  El panel «Modo demostración» y la marca «Solo demo» se miden además dentro de las pantallas conectadas (pestañas sin API).

**Lo que la herramienta no ve** (queda en §6): estados `:hover` y `:active`, contenido dentro de SVG (los radares), la vista
legada «Evaluación intermedia» (no se expone desde M5.3) y cualquier pantalla que no esté en la lista de arriba.

### 2.3 Línea base vigente (medida el 2026-10-16, base recién cargada, antes de `conectada.js`)

La línea base es una **tabla de pares** (elemento · primer plano · fondo · criterio), sin totales ni ratios. Hoy está **vacía**:
ningún par ni borde de campo falla su criterio, ni en las pantallas conectadas ni en las vistas de modo demostración.

| Elemento | Primer plano | Fondo | Criterio |
|---|---|---|---|
| — ninguno — | | | |

«**Los mismos pares que fallan que la línea base**» significa, desde ahora, **ninguno**. Un par o un borde que aparezca en esta
tabla en una corrida futura es una regresión. **Todo par nuevo ≥ 4,5:1** (3:1 si el texto es grande o es un componente de
interfaz).

### 2.4 Cómo se sostiene (tokens, `estilos.css`)

- **Texto sobre cromo oscuro:** `--on-dark`, `--on-dark-2`, `--on-dark-3` (los hex sueltos de la barra lateral, la cabecera y la
  barra de totales se reemplazaron por estos tokens).
- **`--ink-3` ya no es color de texto:** se reserva para filetes y bordes. El texto secundario es `--ink-2` (incluidos los
  `placeholder`).
- **Texto sobre un fondo suave del mismo matiz:** `--warn-ink` sobre `--warn-soft`, `--teal-ink` sobre `--teal-soft` y
  `--orange-hover` sobre `--orange-soft` (el color puro del estado no alcanza como texto).
- **Borde de campo:** `--control-borde` (3:1 sobre blanco) en `input`, `select`, `textarea`. `--rule` es un filete de tarjeta, no
  el límite de un control.
- **Cifra sobre el color de una serie:** no se pinta. En Analítica las cifras de las barras van **fuera** del relleno y cada
  celda del mapa de calor elige su texto contra su propio fondo.

### 2.5 Tipografía, escala, acción principal y neutros (F1b, `handoff.md` §5.141; tokens en `estilos.css`)

Los ratios de cada token están **en el comentario de CSS junto al token** (no se repiten acá, `CLAUDE.md` «Verificación — reglas de
higiene»); la herramienta los mide sobre lo que se renderiza.

- **Fuentes de sistema, sin webfont** (la presentación puede correr sin conexión): `--f-text` (sans, «Segoe UI» primero) es toda la
  interfaz; `--f-display` es un alias suyo (títulos de pantalla en sans 600); `--f-doc` (serif) **sólo** para documentos impresos
  (membrete, encabezado del informe, títulos del IC); `--f-dato` (monoespaciada) **sólo** para códigos e identificadores (lista en
  §2.6). Toda cifra —un puntaje, un total, un KPI— va en sans, tabular (desde F3, §5.160; F1b admitía puntajes en monoespaciada).
- **Nada por debajo de 12 px:** `--fs-2xs` es el piso y `--fs-3xs` quedó como alias suyo. `--fs-base` (15 px) es el texto de lectura
  clínica: valores de ficha, descriptores del IDEA, ítems de PA/PB, síntesis y observaciones.
- **Etiquetas** (cabeceras de tabla, `.kpi .lab`, `.section-label`, `.st`, rótulos de grupo): sans 12 px, 600, en minúscula normal,
  sin espaciado entre letras. La cabecera de una tarjeta no es una etiqueta: es el patrón de §2.6.
- **Acción principal en tinta:** `--accion` / `--accion-hover` rellenan `.btn-primary`. **El naranja es marca** (logo, ítem activo de la
  barra lateral, regla de la pestaña activa y anillo de foco): nunca texto sobre `--bg` ni relleno de un botón. «Firmar» conserva
  `--accion-firma`; «Guardar» es secundario salvo que sea la única acción que confirma la pantalla.
- **`--ink-2` más oscuro; `--ink-3` sólo bordes y decoración**, nunca texto.
- **Superficies oscuras: sólo la barra superior y la lateral.** El encabezado del informe, el de los diálogos y el login son
  `--paper` con un filete; por eso el anillo oscuro ya no cubre esos contenedores. El aviso flotante (toast) y el enlace de salto
  son la excepción: no son superficies de la pantalla.
- **Operable se ve operable:** `.btn-ghost`, el botón de impresión y los chips de filtro del listado usan `--control-borde` (el
  filete `--rule` no delimita un control).
- **Radios:** `--r-sm` para todo chip y todo control, `--r` para tarjetas, `--r-lg` para diálogos.

### 2.6 Un patrón por componente (F3, `handoff.md` §5.160)

Cada pieza tiene **una** forma; una pantalla nueva usa éstas y no arma la suya. Las mide `conectada.js` (`f3-…`) en las pantallas
conectadas, a 1280×800 y a 1024×768 donde importa el ancho.

| Pieza | La forma | Dónde vive |
|---|---|---|
| **Cabecera de tarjeta** | franja `--paper-2` con filete, 12/16 px; título sans 14 px / 600 en tinta; una cuenta opcional (`.card-n`, texto 14 px en `--ink-2`, nunca un chip); acciones a la derecha; **sin glifo decorativo** y sin versalitas | `.card > .cardhead`, `.info-card > h3`, `.flujo-card > h3`, `.escala > header`, `.prot-esc > header` (`f3-cabecera`) |
| **Etiqueta o chip** | sans 12 px / 600, 1 px de borde, radio `--r-sm`, una línea; la variante sólo cambia color o estilo del borde. **Marca** («Sensible», «Registro histórico», «Inactivo»): tinta con borde `--ink-2`, sin relleno. La rampa (`.banda-chip`) es la única con relleno propio y no parte el rango | `.st`, `.pill`, `.mbadge`, `.log-tipo`, `.solo-demo`, `.marca` (`f3-chips`, `f3-banda`) |
| **Aviso flotante** | `toast(msg, tipo)`: `ok` ✓ · `info` ℹ · `error` ! (+ «Error:» sólo para lectores de pantalla); glifo `aria-hidden` + texto, `role="status"` | `ui-core.js` (`f3-toast`) |
| **Íconos** | glifos de texto (✎ + ✓ ⚠ › ‹ ⌕ ● ◐ ○ ✚ ◌ ◇ ☰ ▣ ⨯ ↻ ◷ ▤ ↑ ↓ →) o SVG en línea en `currentColor` (`iconoHtml()`, `utils.js`), siempre `aria-hidden`; el control lleva su nombre en texto o en `aria-label`. **Ningún emoji** ni recurso de otro servidor; ⚠ e ℹ se admiten porque Windows los dibuja monocromos | `f3-iconos` |
| **«Guardar»** | secundario donde la pantalla tiene su acción principal propia («Firmar»); principal donde guardar es la única acción que confirma (un diálogo, la VF, el CI) | `f3-guardar` |
| **Vacío · cargando · error** | `estadoVacioHtml` / `estadoCargandoHtml` / `estadoErrorHtml` (`utils.js`); lo que todavía no se registró es «Sin registrar.» | `f3-estados`, `3e-…` |
| **Descripción (chevron)** | el texto que **sólo explica** una pestaña o vista va detrás de UN `<button class="btn-desc">` con un chevron junto al título de **cada** pestaña (≥ 24×24 px, nombre «Descripción: <título>», `aria-expanded`, `aria-controls`); el chevron mira a la derecha cerrado y hacia abajo abierto (sin animación con `prefers-reduced-motion`); el texto, sin cambios, en un `.ayuda-panel` con `hidden` que abre justo debajo del título y empuja el contenido. Clic, Enter y Espacio alternan; Esc lo cierra y devuelve el foco al botón. Lo que **no** describe la pestaña abierta lleva el chevron **con texto visible** (`.btn-desc-txt`: «Estados del ciclo», «Cómo puntuar cada dimensión»): su nombre es ese texto. No hay botón «?» en ninguna parte. **Se queda a la vista** lo que dice por qué algo está bloqueado, los errores, estados, avisos de bloque, «Modo demostración» y la nota de ORG | `utils.js` (`ayudaBotonHtml`, `ayudaPanelHtml`, `cabConAyudaHtml`), `l0-ayudas`, `l1-sin-interrogacion` |

**Monoespaciada permitida** (`f1b-tipo`): `.cod` (HC, C.I., N.º, AT-2026-003, CIE-11), `.tab-cod` (código de módulo en la pestaña),
`.fr-code` y `.fstep .fname` (códigos del flujo del expediente de ejemplo). La regla `.grupo-integrantes .hint` (la HC en el detalle de un grupo) queda en
el CSS, pero **hoy ninguna plantilla la usa**. Nada más: ni puntajes, ni fechas (la de un registro de ORG), ni nombres de campo ni el «ver completo» de Auditoría.

**Valores de ficha.** Rótulo 13 px en `--ink-2`, valor 15 px en tinta, **los dos en 400**: la jerarquía la dan el tamaño y el color. En
una tarjeta angosta (≤ 360 px) el rótulo va arriba del valor.

---

## 3. Reglas de dominio — no son estética

### 3.1 Severidad no es urgencia

**Regla.** El rojo se reserva para lo **accionable**: un error de validación que la persona puede y debe corregir, o una acción
irreversible o destructiva («Descartar y cerrar»). **Nunca** es la lectura de una banda del IDEA, de un nivel de apoyo, de una
categoría del baremo ni de un puntaje: son clasificaciones clínicas, no alarmas operativas. Confundirlas entrena a la persona
usuaria a «apagar el rojo» en vez de leer el dato.

> **Qué ya no es un ejemplo de bloqueo.** La versión de agosto citaba «un CI sin firmar» y «una foto sin autorización de uso de
> imagen» como bloqueos accionables. **Ya no lo son:** el CI no traba nada y es un estado visible (§5.94), la secuencia sólo
> avisa (§5.95) y guardar una foto no requiere nada (§5.99; la autorización regula **compartir**, no guardar). El «CI
> pendiente» sigue marcándose con glifo y texto (§3.2 A), pero no es un bloqueo.

**Regla de color (decisión de la Fase 3-e, `handoff.md` §5.135).**

| Familia de tokens | Para qué se usa | Para qué **nunca** |
|---|---|---|
| `--ok` · `--warn` · `--bad` | error de validación y resumen de errores (`bad`); confirmación destructiva o irreversible (`bad`); avisos no bloqueantes de la API y «Cambió en el servidor» (`warn`); marcadores de estado de flujo y de CI **con glifo + texto** | bandas del IDEA, insignias de puntaje, categorías y niveles de la VF, cualquier otra clasificación clínica |
| `--rampa-1…6` (un solo matiz, de claro a oscuro) | bandas del IDEA, niveles y categorías de la VF, insignias de puntaje 0–8 | estados de flujo, errores |
| `--accion-firma`, `--accion-destructiva` | el botón «Firmar» (irreversible, pero no es un error ni un estado) y «Descartar y cerrar» | decorar cifras o estados |

El IDEA va de menor a mayor **puntaje** y el puntaje sube con la afectación: el paso más claro es la banda 1 y el más oscuro la
banda 6. No hace falta invertir nada; el riesgo real es que sobreviva el hábito de «verde = banda 1». **El nombre de la banda se
escribe siempre**: el color sólo la ordena. Si el servidor devuelve una banda o un nivel que no está en el mapa, no se infiere un
paso: el chip sale con el estilo neutro y el nombre y el rango siguen escritos.

**Estado del cumplimiento.**
- Bandas del IDEA y niveles/categorías de la VF **en las pantallas conectadas: resuelto** (§5.125 d, §5.126 f).
- **Vistas de modo demostración: resuelto en la Fase 3-e.** `IDEA_BANDAS[].color` y `colorBanda()` se retiraron (cada banda lleva
  su `paso` en la rampa), la distribución por banda de Analítica pinta con la rampa y los textos de banda del expediente de ejemplo
  van en tinta, sin color de estado.
- Las cifras sueltas ya no se tiñen con `--ok` (los KPI «Con línea base IDEA», «Cobertura» y «NNA en seguimiento» van en tinta).

**Mismo criterio: HCE-SEV** (`severidad_dsm` / `severidad_nivel`, M12.4) ya tiene pantalla (C2, §5.143 d) y **no lleva color por
grado**: los niveles 1–3 de apoyo por dominio (comunicación social · conductas repetitivas) van en tinta, con la etiqueta del
servidor, nunca con `--ok/--warn/--bad` ni con una rampa por grado.

**Mismo criterio: HCE-INC** (`inclusion` / `estado_inclusion`, M12.5) ya tiene pantalla (C4, `handoff.md` §5.154 d) y **no lleva color
por estado**: el estado va en tinta con su nombre, la descripción del servidor y «desde» la fecha del servidor, en la pestaña y en la
vista «Inclusión». Los 7 estados no son una clasificación clínica confirmada (IPPU no los validó) y la API no da semáforo: se
retiraron los chips `inc-ok/warn/danger/off`. La marca «Sensible» de una gestión es texto con borde, en tinta.

### 3.2 Estados: el vocabulario implementado

**A. Estado de un módulo.** Los estados vienen de la API y **nunca se calculan en el navegador**: `sin_iniciar`, `en_curso`,
`firmado` (§5.116). No hay estado «bloqueado» ni «excepción»: la secuencia sólo avisa y el CI no traba nada. Cada marcador lleva
**glifo + texto**, nunca sólo color:

| Estado | Marcador | Cómo se distingue sin el color |
|---|---|---|
| sin iniciar | `○` · «sin iniciar» | **contorno** vacío |
| en curso | `◐` · «en curso» | relleno suave con **borde punteado** |
| firmado | `●` · «firmado» | relleno **macizo** |
| con addenda | `✚` · «con N addenda(s)» | **doble borde**, junto al estado de firmado (encabezado, pestaña y flujo) |
| CI pendiente | `⚠` · «CI pendiente» | un aviso accionable: ícono de alerta |
| CI registrado | `●` · «Registrado» | relleno macizo (el CI no se firma); en las listas, «✓ CI» (ver abajo) |
| «Cambió en el servidor» | rótulo propio | un 409 **no** es un aviso de la API; se rotula aparte y la pantalla muestra lo que hay en el servidor |
| fuera de secuencia | `!` · «fuera de secuencia: falta firmar …» | glifo propio en la pestaña del módulo; informa, no bloquea |

**Listas contra expediente (F1, `handoff.md` §5.140).** En una lista el estado normal no tiene que gritar: **«firmado» es `●` +
texto en `--ok`, sin relleno**, y «en curso» conserva su relleno suave con borde punteado; **el CI registrado es «✓ CI» en
`--ink-2`, sin relleno ni borde**, y sólo «⚠ CI pendiente» conserva su chip rojo. En el **expediente** (encabezado del módulo,
pestaña CI) «Firmado» y «Registrado» siguen macizos. En las pestañas del ciclo anual el estado va como glifo, con su texto sólo
para lectores de pantalla. La **alerta clínica** de la banda del paciente va en tinta, con `⚠` y «Alerta clínica»: no es un estado
de la app y nunca usa ok/warn/bad.

**Avisos y errores.** Los **avisos no bloqueantes** de la API (`warnings[]`) se muestran con `role="status"` (se anuncian sin
interrumpir y nunca bloquean). Los **errores** se muestran junto al campo (`aria-describedby`) y en un resumen con
`role="alert"` que recibe el foco; un resumen con enlaces lleva a cada campo. «Cargando» es `role="status"`; un error de carga es
`role="alert"` con «Reintentar» (un solo componente compartido en todas las pantallas conectadas).

**B. `NS` contra `null`.** **Resuelto** (§5.125 e). `NS` (observación insuficiente) es un valor válido del IDEA y se muestra con
una marca propia: borde punteado, sin relleno, glifo `◌` y el texto «NS» (con un texto sólo para lectores de pantalla), distinta de
un número y de «sin puntuar». En el editor es un botón aparte de los puntajes y de los intermedios.

---

## 4. Foco

**Decisión (Fase 3-e).** Un solo anillo, **sólido**, en todo lo operable y en todo lo que recibe el foco por programa (títulos con
`tabindex="-1"`, resúmenes de error):

- **Token:** `--ring` (sobre superficies claras) y `--ring-dark` (sobre el cromo oscuro: barra superior, barra lateral y enlace de
  salto). Desde F1 la banda del paciente y la barra de acciones son claras, y desde F1b también el encabezado del informe y el de los
  diálogos (§2.5). `--ring` cambia a `--ring-dark` **por herencia** dentro de esos contenedores.
  Ancho `--ring-w` y separación `--ring-off` (2 px y 2 px).
- **Un único selector `:focus-visible`.** Ningún selector reemplaza el contorno por un `box-shadow` translúcido ni lo apaga con
  `outline:none`; la única excepción es `<main>`, que sólo recibe el foco como destino del enlace de salto.
- **Hacia adentro en las pestañas** (`outline-offset` negativo): la pestaña toca a sus vecinas y al filete.
- **Norma:** WCAG 2.4.7 (foco visible) y 1.4.11 (contraste de componentes: el anillo ≥ 3:1 contra lo que queda detrás).
- **WCAG 2.2 adoptados en F1 (§5.140 f):**
  - **2.4.11 Foco no tapado (mínimo).** La barra superior, la banda del paciente y la barra de acciones quedan pegadas; el
    documento lleva `scroll-padding-top` = `--topbar-h` + `--banda-h` + margen (sólo con la banda a la vista; `--banda-h` lo
    actualiza el alto real de la banda) y `scroll-padding-bottom` = `--barra-h` + margen (sólo con una barra de acciones). Se
    verifica con Tab real por los editores de LB y PA: en el centro de cada control enfocado está el control (`f1-c`).
  - **2.5.8 Tamaño del objetivo (mínimo).** Todo lo operable del listado, la banda, las pestañas y la barra de acciones mide
    ≥ 24×24 px o cumple la excepción de espaciado (un círculo de 24 px centrado no toca otro objetivo) (`f1-d`).

**Cómo se mide.** Con teclado real: se pulsa una tecla (el navegador pasa a la modalidad de teclado, y `:focus-visible` aplica a
cualquier `.focus()` posterior), se enfoca el control y se lee el contorno computado (estilo, ancho, color, separación). El fondo
«detrás del anillo» **no** se asume: se esconde el control y se mira qué hay a su lado (`elementsFromPoint`), de modo que un
control sobre la barra oscura, sobre un fondo de error o sobre otro control se mide contra lo que de verdad tiene detrás. La
herramienta mide una muestra de cada **familia** (botón, enlace, lista, campo de texto, área de texto, casilla, botón de puntaje,
pestaña, ítem de la barra lateral, resumen desplegable, controles sobre cromo oscuro y sobre fondos de error o aviso);
`conectada.js` (`3e-ring`) lo repite con **Tab** real, sin clics.

**Lo que se completa con el foco** (verificado en `conectada.js`, `3e-…`):

- **Enlace de salto** «Saltar al contenido»: es el primer Tab de la app, aparece a la vista al enfocarse y lleva el foco a `<main>`;
  queda inerte mientras un diálogo modal está abierto.
- **Diálogos** (login, alta/edición, recibí): Tab y Mayús+Tab no salen; Esc cierra; el foco vuelve a quien lo abrió o, si ese
  control ya no existe (el expediente se repintó), a un destino estable (el título), nunca a `<body>`. Las confirmaciones de firma
  (en la barra del editor, no son modales): Esc cancela y devuelve el foco a «Firmar».
- **Confirmar al cerrar con datos sin guardar** (×, Cancelar o Esc): una banda destructiva dentro del diálogo, con foco en
  «Seguir editando» (Esc también sigue editando); «Descartar y cerrar» cierra, vacía los campos y devuelve el foco. Tipear y volver
  al valor original no cuenta como cambio. **«Salir» y el 401 cierran y limpian sin preguntar** (§5.125 h).
- **`#panelExp`** lleva `tabindex="0"` sólo cuando su contenido no tiene nada operable (los módulos en modo demostración): así el
  texto es alcanzable con teclado.
- **Tabindex móvil** en el editor del IDEA: un punto de Tab por dimensión (las flechas, Inicio y Fin mueven el foco dentro de ella;
  Enter o Espacio eligen).
- **Listado (F1):** un solo punto de Tab por fila (el nombre, un botón; Enter abre el expediente); con el mouse abre la fila entera.
- **Pestañas del expediente (F1b, §5.141 i; L1, §5.171):** «Estados del ciclo» (botón con texto y chevron) va al final de la tira de pestañas, en el DOM y a la vista
  (a 1280 px, sobre el borde derecho de la tira, en la franja de los rótulos de grupo): Tab desde una pestaña llega a «Estados del ciclo» y después al panel, cuyo primer
  control es el chevron de la descripción.
- **Orden de Tab:** el del DOM (barra superior → barra lateral → contenido). Se verificó recorriendo con el teclado login → listado
  → expediente → las siete pestañas del flujo → informe impreso → volver, sin que el foco caiga en `<body>`.

---

## 5. Cómo se verifica

| Qué | Cómo |
|---|---|
| Contraste y anillos | `API=… IPPU_DEMO_PASSWORD=… node herramientas/verificar_contraste_ui.js [--tabla] [--json out.json]` sobre una **base descartable recién cargada**, **antes** de `conectada.js` (que escribe). Sale con código 1 si falla un par o un borde en una pantalla conectada, si falla un anillo o si el CSS apaga un contorno. |
| Comportamiento (foco, diálogos, reflow, mensajes) | `demo/verificacion/conectada.js` (los chequeos `3e-…`), con `CONFIRMA_BASE_DESCARTABLE=1`. |
| A ojo | `demo/verificacion/capturas.js`: una imagen por pantalla a 1280×800 y a 1024×768 en `demo/verificacion/salidas/`. |

Nada de esto reemplaza una prueba con personas y con tecnología de apoyo real (§6).

---

## 6. Pendientes (lo que queda después de la Fase 3-e)

- **Sin pasada manual con lectores de pantalla** (NVDA, JAWS, VoiceOver) ni con ampliación al 200 % o 400 % en un dispositivo
  real: todo lo medido es automático (estilos computados y teclado simulado). Es lo primero que conviene hacer con personas del
  equipo antes de mostrar la demo a quienes usan estas tecnologías.
- **Reflow a 320 px (1.4.10):** verificado en el listado y en HCE-00; las demás pantallas conectadas están verificadas a 1024 y
  1280 px y a 390 px en el alta, el IC y la VF, pero no a 320 px.
- **Estados `:hover` / `:active` / `:disabled`:** la herramienta no los mide.
- **Gráficos SVG** (los radares del IC): el contraste de sus ejes y trazos no pasa por la herramienta; los colores están como hex
  dentro del JS, no como tokens. El dato no depende sólo del color (trazo continuo o punteado, marca redonda o cuadrada). Desde F3 las
  etiquetas de los ejes miden 12 px en pantalla y no se salen del gráfico (`f3-radar`).
- **Likert de los protocolos** (PA/PB): sus cinco botones por ítem siguen siendo un punto de Tab cada uno. El tabindex móvil se
  hizo sólo en el editor del IDEA.
- **Expediente de ejemplo en modo demostración:** su cabecera pasó a clara en F1 (sin el rótulo «Activo/Inactivo» coloreado), pero
  el cuerpo conserva colores y estilos en línea propios de la demo original. No se mezcla con la API y lleva el panel de modo
  demostración.
- **2.5.8 fuera del listado, la banda, las pestañas y la barra:** los formularios y los editores no se midieron (los botones de
  puntaje y los campos ya superan los 24 px, pero no hay chequeo).
- **Colores de grupo:** cerrado en las pantallas conectadas (§5.122 e: el nombre es el de la API y no se pinta); las vistas de modo
  demostración los conservan bajo el panel.
- **HCE-SEV:** con pantalla desde C2 y sin color por grado (§3.1, §5.143 d).
- **HCE-INC:** con pantalla desde C4 y sin color por estado (§3.1, §5.154 d).
- **HCE-DOC:** con pantalla desde C5 (§5.155). El registro histórico se marca con texto («Registro histórico — sólo lectura»), no
  con un candado ni con color; las miniaturas tienen la descripción como texto alternativo y, sin miniatura, «Vista previa no
  disponible» para lectores de pantalla; el `accept` del selector de archivo es una pista: el tipo lo decide la API.
- **Ateneos:** con pantalla desde C6 (§5.158). El tipo va en tinta, sin chips de color (no es un estado); «Sensible» es una marca de
  texto con borde, como en INC; el indicador es texto («2026: 3 de 8 ateneos»), sin ok/warn/bad; un solo punto de Tab por fila (el
  título); el código va en la fuente de códigos.
- **Panel institucional:** conectado desde C7 (§5.159). Las bandas se pintan con el chip de la rampa de la banda del IDEA (pasos 1–6,
  el nombre y el rango escritos), nunca con ok/warn/bad; el Δ medio y las alertas van en tinta con glifo (↑ ↓ = · ⚠) + texto; los
  números van en tablas con `caption` y encabezados; sólo la tarjeta del heatmap lleva el panel de modo demostración.
- **Modo oscuro, `prefers-contrast` y colores forzados (`forced-colors`):** no se tratan.
