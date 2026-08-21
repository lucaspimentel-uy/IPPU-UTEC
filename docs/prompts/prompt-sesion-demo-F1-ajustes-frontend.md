# Prompt — Sesión de demo F1: ajustes de navegación del frontend

> Pegá todo lo que sigue en Claude Code, en el repo IPPU, en una rama corta (`demo/F1-navegacion`).

---

Sesión **de demo únicamente**. No toca backend, ni `app/models/`, ni la migración, ni los tests de pytest,
ni avanza la ronda M12 (M12.5 / M12.6 / M12.7 quedan como están; el plan de absorción del Prototipo v4 está
en pausa por decisión del equipo). Todo el trabajo es sobre `implementacion/L1-hce-idea/demo/`.

Arranque estándar de `CLAUDE.md`: `git pull`, leer `handoff.md` (cabecera, §5, §6, §12) y trabajar en rama
corta `demo/F1-navegacion`.

## 0) Relevamiento primero — no implementes nada todavía

Regla del proyecto: **antes de decidir nada sobre la UI, relevá el código real**; no infieras de los `.md`
(ya hubo dos veces en que el repo y la documentación no coincidían). Leé y reportá, con ruta y número de
línea, antes de escribir una sola línea de código:

1. **Tarjeta KPI "NNA ACTIVOS"** de la pestaña Inicio: dónde se arma el markup y la bajada `Convenio INAU`
   (¿`index.html` fijo, o generado en `js/ui-core.js`?). Decime además **qué cuenta el número** (¿todos los
   NNA activos del seed, o sólo los del convenio INAU?) y si hay otras tarjetas KPI con bajada.
2. **Barra "Cargar evaluación"** (`eval-bar`) dentro del expediente: en qué archivo y función se renderiza,
   en qué orden queda respecto de la tarjeta **"Flujo de módulos"**, qué botones muestra y **si esos botones
   dependen del estado del flujo** (habilitados/ocultos según CI→LB→PA→PB→IC).
3. **Cómo se llega hoy** a: *Contacto familiar*, *HCE-DOC*, *HCE-ORG* y *HCE-VF* desde el expediente
   (¿pestañas, tarjetas, sidebar, funciones de `js/hce-doc-org-vf.js`?). Nombre exacto de la función de
   entrada de cada una y **si "Contacto familiar" existe hoy como sección propia** o es un bloque dentro de
   HCE-00 / la anamnesis.
4. **Vista Grupos** (`js/grupos-usuario.js`): cómo se llega hoy al detalle de un grupo (ej. "Grupo Naranja"),
   y cómo se renderizan sus tres bloques: *Integrantes y estado del ciclo*, *Técnicos autorizados del grupo*
   y *Registro fotográfico grupal*. Decime si el detalle es una vista aparte o una lista que se despliega.
5. **Estado del harness de verificación** (`demo/verificacion/`): si hay fingerprints previos utilizables
   como línea de base y con qué comando se generan y comparan.

Con eso, escribí un **plan de 4 cambios** (archivos que vas a tocar, en qué orden) y **frená para que lo
apruebe**. Si algo del relevamiento contradice lo que asumo abajo, decilo en vez de acomodarlo.

## 1) Inicio — sacar la bajada "Convenio INAU"

En la tarjeta KPI **NNA ACTIVOS**, eliminar la línea inferior `Convenio INAU`. Queda sólo el rótulo y el
número.

- Eliminar el elemento, no ocultarlo con CSS.
- **No** tocar el cálculo del número ni las demás tarjetas.
- Si la bajada estaba mal (por ejemplo, el número cuenta INAU + BPS y la etiqueta decía sólo INAU),
  anotalo en el reporte de cierre: es un dato para `handoff.md`, no sólo un ajuste cosmético.
- El dato de convenio no se pierde: sigue viviendo en HCE-ORG.

## 2) Expediente — subir la barra "Cargar evaluación"

Mover la barra **"Cargar evaluación"** (Editar HCE-00 · Evaluación IDEA · Protocolo A · Protocolo B ·
Informe de Cierre) **por encima** de la tarjeta **"Flujo de módulos"**.

- Es un cambio de **orden de render**, no de comportamiento: mismos ids, mismos handlers, mismos botones,
  misma lógica de habilitación según el estado del flujo.
- Verificá que la barra **se siga actualizando** cuando cambia el estado del flujo (firmar, addenda,
  habilitación excepcional): si el orden de las llamadas de render importaba, ajustalo sin duplicar renders.
- Revisá que no se rompa el bloque `@media print` ni el layout de la vista impresa/PDF.

## 3) Expediente — barra de navegación de secciones

Agregar, **debajo de "Cargar evaluación" y arriba de "Flujo de módulos"**, una segunda barra —estilo
secundario, para que no compita con la de evaluaciones— con estos cuatro accesos, en este orden y con estas
etiquetas exactas:

1. `Contacto familiar`
2. `HCE-DOC · Documentos y fotos`
3. `HCE-ORG · Áreas INAU y BPS`
4. `HCE-VF · Valoración funcional (BUND / CIF)`

Requisitos:

- **Reutilizar las funciones de entrada que ya existen** (las que relevaste en el punto 0.3). No dupliques
  markup ni lógica de esas secciones: son botones de navegación, no vistas nuevas.
- El contexto del NNA se conserva al navegar, y desde cada sección se puede volver al expediente por la vía
  que ya exista (no inventes un botón "volver" nuevo si ya hay uno).
- **No** quites los accesos actuales a esas secciones en esta sesión (si hoy se llega por otro lado, que
  convivan). Si el resultado queda redundante, proponelo en el cierre y lo decido yo.
- Si *Contacto familiar* **no existe** hoy como sección navegable, **no la crees**: dejá el botón fuera,
  reportá qué encontraste (dónde están hoy los datos de contacto de la familia) y esperá instrucción.

## 4) Grupos — acceso por grupo y navegación de sus tres bloques

En la pestaña **Grupos**: que desde el listado se entre al detalle de cada grupo con un **botón explícito**
(hoy se entra por el nombre; el botón se agrega, el enlace del nombre se mantiene).

Dentro del detalle del grupo, una barra de navegación con tres accesos, mismo criterio visual que la del
punto 3:

1. `Integrantes y estado del ciclo`
2. `Técnicos autorizados del grupo`
3. `Registro fotográfico grupal`

Requisitos:

- Los tres bloques **ya existen**: los accesos llevan a ellos (scroll/anclaje si el detalle es una sola
  vista larga, o cambio de panel si son paneles). Elegí lo que ya usa la demo y decilo en el cierre.
- Se mantiene íntegro lo que hay en "Técnicos autorizados del grupo": la nota del Manual §21.1, la nómina
  con rol/disciplina/alcance, el botón *Quitar* y el alta por nombre + disciplina.
- Se mantiene íntegra la regla de imagen del bloque fotográfico (§8.4 / art. 11 CNA — Ley 17.823): sin
  autorización de **todas** las familias de los integrantes, la carga sigue bloqueada **a nivel de lógica**,
  no sólo de UI. No la toques.

### 4.b) "Asignar tutores" — pendiente de definición, no lo implementes de una

Pedí "poder asignar tutores" en ese panel. **El término "tutor" no aparece en ninguna fuente normativa del
proyecto** (ni en el Manual, ni en el Prototipo v4, ni en `esquema-datos-v2.md`, ni en `handoff.md`), así que
inventar el rol contradice la regla anti-contradicción de `CLAUDE.md`. Hacé esto:

- **Sí implementá** lo que sí está definido: que desde ese mismo panel se pueda **asignar o cambiar
  `Técnico/a responsable 1` y `Técnico/a responsable 2`** del grupo, con el mismo formulario de alta
  (nombre + disciplina) y el alcance fijo `HCE completa del grupo · firma`. Al cambiar un responsable, dejar
  constancia por la vía que la demo ya use para eventos institucionales (HCE-LOG / auditoría) — si no existe
  esa vía para grupos, **no la inventes**: reportalo.
- Recordá el límite ya conocido (`handoff.md` §5.18): la fila de grupo es **anual**, así que un cambio de
  técnico a mitad de año **sobrescribe** y sólo deja rastro en la auditoría. Si tu implementación lo hace
  visible o lo empeora, decilo.
- **No** crees un rol nuevo "tutor" en la demo. Anotá la pregunta en `docs/notas/puntos-a-validar.md`
  (sección del equipo) y en `handoff.md` §7, con esta formulación: *¿"tutor" es sinónimo de técnico/a
  responsable del grupo, un rol distinto (referente por NNA), o el tutor legal de la familia?* Los tres
  tienen consecuencias distintas en el modelo.

## 5) Qué NO tocar en esta sesión

- Backend, modelos, migración `f432ea139fd9`, catálogos, pytest.
- Reglas clínicas de la demo: secuencia del flujo, firma = bloqueo, Δ sólo B−A, autorización de imagen,
  histórico de solo lectura.
- Textos normativos citados en pantalla (Manual §21.1, art. 11 CNA).
- `js/utils.js` salvo que sea imprescindible; si lo tocás, avisalo aparte.

## 6) Verificación antes de cerrar

1. `node --check` sobre cada `.js` modificado.
2. Abrir la demo y recorrer a mano: Inicio (tarjeta sin bajada) → expediente de los 3 NNA del seed (barra
   arriba, navegación a las 4 secciones y vuelta) → Grupos (botón de acceso, los 3 bloques, alta y cambio de
   responsable) → firmar algo y confirmar que la `eval-bar` refleja el cambio de estado.
3. Fingerprint de `demo/verificacion/`: línea de base **antes** de los cambios y comparación después.
   Esperado: **sólo** las diferencias intencionales de estos 4 puntos. Si aparece otra, no la justifiques —
   listala. (Precedente §5.5.2: un error de carga puede abortar el seed en silencio y la vista verse bien
   igual; el fingerprint es lo que lo detecta.)
4. `handoff.md`: §13 bitácora (trabajo de demo, fuera de la ronda M12), §6 si queda algo pendiente, §7 con
   la pregunta de "tutor". **No** inventes decisiones nuevas en §5.
5. Commit + push a **los dos remotos** (`gitlab` y `origin`).

## 7) Formato del reporte de cierre

Terminá con un reporte en este orden, que voy a pegar tal cual:

- **Relevamiento**: las 5 respuestas del punto 0, con archivo:línea.
- **Cambios por punto (1–4)**: qué archivos, qué funciones, qué quedó fuera y por qué.
- **Decisiones que tomaste vos** porque el prompt no las cubría (explícitas, una por línea).
- **Contradicciones entre el código y la documentación** que encontraste de paso (aunque no las hayas
  tocado).
- **Verificación**: `node --check`, recorrida manual, diff de fingerprint (qué cambió y si era esperado).
- **Pendientes** que dejás abiertos, incluida la definición de "tutor".
- Commit(s) y confirmación del push a los dos remotos.
