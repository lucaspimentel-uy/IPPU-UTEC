# Notas de accesibilidad — UI de la demo

> **Qué es esto.** No es una guía de estilo: es un registro de hallazgos **medidos**, para quien retome
> el restyle de `demo/`. No prescribe una paleta nueva ni componentes — dice qué falla, contra qué norma,
> y qué significa en esta app en concreto (quién se ve afectado, con qué pantalla).
>
> **Qué NO es.** Esta sesión (2026-08-21) **no tocó `demo/`** — es sólo documentación, escrita para la
> próxima ronda de restyle.
>
> **Dos tipos de hallazgo, con vigencia distinta:**
> - **§2** — ratios WCAG calculados sobre la **paleta borrador** que motivó el restyle de F1 (`5544e71`,
>   2026-08-19). Son de un boceto, no de lo que corre hoy en el repo — ningún hex de §2.1–§2.5 aparece en
>   `demo/css/estilos.css`. Sirven como diagnóstico de qué evitar al definir la paleta definitiva.
> - **§3** — reglas de dominio (qué significa cada color, no cuánto contrasta) verificadas **contra el
>   código que corre hoy** en `demo/js/` y `demo/css/estilos.css`, con cita de archivo y línea. Esta
>   sección tiene vida corta: si el restyle toca esos archivos, hay que re-verificarla, no asumir que
>   sigue valiendo.
>
> Citar este archivo por sección: p. ej. `notas-accesibilidad-ui.md §3.1`.

---

## 1. Relación con el restyle de F1

F1 (`5544e71`, "restyle visual completo") ya corrigió **una** instancia de esta misma familia de
problemas: oscureció el naranja institucional de `#DD7B0C` a `#B4590A` porque, en su propio mensaje de
commit, "se usa como texto y daba 2,6:1 (no AA)". Verificado acá: blanco sobre `#B4590A` da **≈4,8:1** —
pasa AA. Es la prueba de que el criterio de este documento ya se aplicó una vez, con éxito, sobre el color
de acento principal. Lo que sigue abierto —§2 y §2.6— es todo lo que **no** es el acento principal: bordes,
anillo de foco, chips de estado, texto secundario.

---

## 2. Contraste WCAG — paleta borrador que motivó el restyle

| # | Elemento | Ratio medido | Umbral / norma | Veredicto |
|---|---|---|---|---|
| 2.1 | Anillo de foco, `rgba(14,116,144,.15)` sobre blanco | 1,23:1 | 3:1 · WCAG 2.4.11 | **Falla** |
| 2.2 | Borde de campo de formulario, `#CBD5E1` sobre blanco | 1,48:1 | 3:1 · WCAG 1.4.11 | **Falla** |
| 2.3a | Blanco sobre `#D97706` | 3,19:1 | 4,5:1 (texto normal) · WCAG AA | **Falla** (pasaría para texto grande, ≥3:1) |
| 2.3b | Blanco sobre `#16A34A` | 3,30:1 | 4,5:1 (texto normal) · WCAG AA | **Falla** (ídem) |
| 2.4 | Fila seleccionada, `#E0F2FE` sobre card blanca | 1,15:1 | — (diferenciación visual) | **Prácticamente invisible** |
| 2.5 | Texto/dato secundario, `#64748B` sobre blanco | 4,55:1 | 4,5:1 AA / 7:1 AAA | Pasa AA **por ~1%** |

### 2.1 — Anillo de foco

1,23:1 contra un mínimo de 3:1. Si además el CSS quita el `outline` nativo (que es exactamente lo que hace
el código vigente, ver §2.6), el foco de teclado queda **sin ningún indicador visible**. No es un detalle
cosmético: es el único rastro que tiene un usuario de teclado (o cualquiera que dependa de navegación por
foco) de dónde está parado en un formulario de 20+ campos como el de IDEA o el Protocolo A/B.

### 2.2 — Borde de campo

1,48:1 contra un mínimo de 3:1. Sin borde visible, la única señal de "acá hay un campo" es el placeholder,
que desaparece apenas se escribe. En las pantallas de carga (IDEA, Protocolo A/B, Informe de Cierre) esto
se multiplica por decenas de campos por vista.

### 2.3 — Texto blanco sobre botón de acento

Ninguno de los dos tonos (`#D97706` ámbar, `#16A34A` verde) llega a 4,5:1 para texto normal. Si se usan
como fondo de un `.btn` o `.pill` con el tamaño de letra que usa el resto de la demo (chico, ~13px), es una
falla de AA lisa y llana — pasarían sólo si el texto fuera grande (18pt/24px, o 14pt/negrita), que no es el
caso de un botón.

### 2.4 — Fila seleccionada

1,15:1 es, a efectos prácticos, "no se ve". En un listado de NNA (Grupos, Pendientes, Analítica) esto es
más que un problema de estética: es un **riesgo de paciente equivocado** si dos personas comparten
pantalla o alguien confía en el resaltado para saber con quién está trabajando. Necesita una segunda señal
que no dependa del color — borde, ícono, negrita — nunca sólo un tinte de fondo.

### 2.5 — Texto secundario / dato numérico

4,55:1 pasa AA (4,5:1) por un margen de ~1%: cualquier variación de renderizado — subpíxeles, una pantalla
mal calibrada, una impresión — lo empuja por debajo. La demo usa este peso para datos clínicos numéricos:
puntajes, deltas, porcentajes. Para **dato numérico específicamente** conviene apuntar a 7:1 (AAA), no a
4,5:1: acá un dígito mal leído no es una molestia de legibilidad, es un dato clínico mal transcripto.

### 2.6 — Esto es la paleta borrador, no lo que corre hoy

Ninguno de los hex de §2.1–§2.5 aparece en `demo/css/estilos.css`. Dos verificaciones contra lo que sí está
en el repo, para saber qué ya se resolvió y qué sigue abierto:

- **Ya resuelto** — ver §1: el naranja de acento pasó de 2,6:1 a ≈4,8:1 como texto. Es la misma familia de
  problema que §2.3, ya corregida para el color principal.
- **Mismo defecto, otro color, todavía sin resolver** — el patrón "sacar el `outline` nativo y reemplazarlo
  por un `box-shadow` de color" (el mismo mecanismo de §2.1) está vivo hoy en **10 selectores** de
  `estilos.css` (líneas 255, 324, 430, 583, 790, 878, 903, 955, 1019, 1060 — botones, `select`, inputs de
  login/búsqueda/técnicos-autorizados/ateneos/fotos/observaciones). 9 de los 10 usan
  `--focus: 0 0 0 3px rgba(180,89,10,.34)` (el naranja institucional al 34% de opacidad); el décimo
  (línea 790, textarea de observaciones del Protocolo) usa un tono ámbar propio,
  `rgba(138,109,31,.24)`. Calculado a mano con la fórmula de luminancia relativa de WCAG — **no** verificado
  con herramienta, así que conviene remedir antes de dar esto por cerrado —: el anillo naranja sobre blanco
  da **≈1,6:1** y el ámbar **≈1,37:1**. Los dos siguen fallando 2.4.11, sólo que con otro número que en
  §2.1.

---

## 3. Reglas de dominio — no son estética

### 3.1 Severidad no es urgencia

**Regla.** El rojo se reserva para bloqueos **accionables**: algo que la persona usuaria puede y debe
resolver ahora — un CI sin firmar, una foto sin autorización de uso de imagen (§8.4), una acción
irreversible ("Eliminar registro"). El rojo **nunca** es la lectura de una banda del IDEA ni de un nivel de
soporte DSM: son clasificaciones clínicas, no alarmas operativas. Confundirlas entrena a la persona usuaria
a "apagar el rojo" en vez de leer el dato.

**Hoy la demo lo hace al revés, y se puede citar exacto:**
- `catalogos.js:16-23` — las 6 `IDEA_BANDAS` (§5.13 / D4) mapean literalmente a `--ok` (bandas 1-2),
  `--warn` (bandas 3-4), `--bad` (bandas 5-6): el semáforo transaccional aplicado a una clasificación
  clínica.
- `ui-core.js:257-268` — el total del IDEA en el formulario en vivo pinta `nivel.style.background` en
  `--bad` si el total ≥65, `--warn` entre 33 y 64, `--ok` por debajo de 33. Mismo criterio, otro punto del
  código.
- `ui-core.js:192,204` (`badgeClass`) — el badge de cada opción de puntaje (0/2/4/6/8) usa la misma tríada
  ok/warn/bad.

**Qué hacer en su lugar.** Las escalas de severidad necesitan una **rampa secuencial de un solo matiz**
(por ejemplo, un azul o violeta institucional, de claro a oscuro en 6 pasos para las 6 bandas del IDEA),
separada por completo de `--ok/--warn/--bad`. Esa tríada queda libre para lo que ya hace bien: estado de
flujo (firmado/bloqueado) y error de validación.

**IDEA está invertido** — 0 es "sin trastorno", 96 es "afectación severa" (leyenda en `ui-core.js:226`) —
así que la rampa lee de menor a mayor **puntaje**, no de "malo a bueno": el paso más claro/menos saturado
es la banda 1 (0–15, mejor pronóstico), el más oscuro/saturado es la banda 6 (76–96, mayor necesidad de
apoyo). No hace falta invertir nada — el eje ya es el puntaje, y el puntaje ya sube con la severidad. El
riesgo real es el opuesto: que sobreviva el hábito de "verde = banda 1" heredado de `--ok`, cuando una
rampa secuencial de un solo matiz no arranca de ningún verde.

**Mismo criterio, todavía sin pantalla:** HCE-SEV (`severidad_dsm` / `severidad_nivel`, M12.4) sólo existe
en el backend — la demo no lo tiene en ninguna rama. Cuando se construya su UI, los niveles 1–3 de apoyo
por dominio (comunicación social · conductas repetitivas) necesitan la misma rampa neutra, nunca
`--ok/--warn/--bad`.

### 3.2 Dos vocabularios de estado sin token

**A. Ciclo de vida del módulo.** El vocabulario de dominio es **vacío · en curso · firmado/bloqueado ·
addenda · excepción** — cinco estados. El código hoy sólo modela tres: `estadoModulo()` (`flujo.js:67-70`)
devuelve `firmado` · `borrador` · `bloqueado`, siempre derivados y nunca guardados (buena práctica —
evita drift entre estado guardado y estado real; conservarla), más un flag `excepcion` superpuesto en el
stepper (`fstep.exc`, `flujo.js:322-324`).

Lo que falta, concretamente:
- **Vacío vs. en curso** colapsan en el mismo `borrador`: `estadoModulo()` sólo pregunta si está firmado o
  habilitado, nunca si tiene algún campo cargado. Un módulo que nadie tocó y uno completado a mitad se ven
  idénticos.
- **Addenda** existe como dato (`lb.addendas` / `pr.addendas`, listado en `flujo.js:276` y `:309`) pero no
  es un estado visual: un módulo firmado con una addenda posterior no tiene ninguna marca en su badge
  (`estadoBadgeM`, `flujo.js:315-317`, sólo mapea firmado/borrador/bloqueado). Para enterarse de que el
  registro se modificó después de firmado hay que abrir el modal y llegar hasta el final.
- **Excepción** existe pero sin contrato de color propio: se apoya en el color que ya tenga
  `s-borrador`/`s-bloqueado` más el texto "⚠ excep.", y no aparece fuera del stepper (`estadoBadgeM` no la
  contempla). Necesita una marca independiente del color — ícono o patrón, no un tinte — para no pisarse
  con la rampa de severidad de §3.1 si algún día conviven en la misma pantalla.

Antes de que el restyle toque cualquier `.pill` o `.mbadge`, definir los cinco tokens explícitamente:
vacío y en curso con tratamientos visualmente distintos (p. ej. contorno vs. relleno), addenda con una
marca propia junto al badge de firmado — no sólo dentro del modal —, excepción con un marcador que no
dependa sólo del color.

**B. `NS` contra `null`.** El dato ya viene tipado en tres estados desde el modelo — `flujo.lb.dim` es
`0–8 | 'NS' | null` (`catalogos.js:27`) — y el backend lo confirma: "sin puntuar · puntuó un número ·
puntuó NS" (`test_m12_consenso.py:198-201`), NS sigue siendo valor válido del IDEA. En el formulario
editable hay un control aparte para NS (`.inter-btn[data-ns]`, distinto de las `.opcion` numéricas —
`ui-core.js:283-290`, `evaluaciones.js:60`), así que ahí no se confunden entre sí. Lo que **no** existe es
un token visual para NS en sí mismo: se muestra como el texto literal `NS` con el mismo estilo que un
número (`ui-core.js:237`, `sval-${dimKey}.textContent = val`) — sin color ni ícono propio. Dar a NS un
tratamiento visual fijo (por ejemplo, un símbolo neutro en gris) para que no lea como "otro número más" ni,
si algún resumen futuro lo compacta a badges, termine cayendo dentro de la rampa de severidad de §3.1.

---

## 4. Para quien retome esto

- Los ratios de §2.1–§2.5 son de la paleta borrador: antes de aplicar una corrección hay que fijar la
  paleta definitiva y volver a medir contra **esa**, no asumir que estos hex son el objetivo final.
- §2.6 y §3 sí están medidos contra el código que corre hoy (2026-08-21) — es la parte de vida más corta
  de este documento. Si el restyle toca `estilos.css` o cualquiera de los archivos citados, hay que
  remedir, no dar por buenas estas líneas.
- Los cálculos de contraste de §2.6 son a mano (fórmula de luminancia relativa de WCAG), no verificados con
  una herramienta dedicada — sirven para priorizar, no como número final de aceptación.
