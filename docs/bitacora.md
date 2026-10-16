# Bitácora de sesiones — Proyecto IPPU × UTEC-LIDIA

> **Qué es.** El **registro** del proyecto: qué hizo cada sesión, medido, con sus commits. Es la antigua
> **§13 de `handoff.md`**, que se mudó acá el **2026-09-09** por decisión **§5.84** (la bitácora pesaba el
> 39,6 % de un archivo que `CLAUDE.md` manda leer entero al arrancar).
>
> **Cómo se usa.** Se lee para reconstruir *por qué* se hizo algo; **nunca** hace falta para *hacer* el
> trabajo — para eso está `handoff.md` (estado, decisiones §5, pendientes §6). Entradas **de la más nueva
> a la más vieja**.
>
> ⚠️ **Este archivo NO se corrige** (regla 3, que viaja desde `handoff.md`): una entrada dice lo que era
> cierto ese día, cifras viejas incluidas. Las decisiones se enmiendan escribiendo una entrada nueva en
> §5 de `handoff.md`, nunca editando una vieja acá.
>
> **Citas.** El encabezado `## 13. Bitácora de sesiones` se conserva —acá y como stub de redirección en
> `handoff.md`— para que las ~100 citas «§13» del repo (casi todas en `docs/prompts/`) sigan resolviendo.
>
> **Al cerrar una sesión** (§5.82, que sigue vigente): se escribe la entrada acá **y** se actualiza la
> cabecera de `handoff.md` (fecha, nombre de sesión, cifras medidas).

## 13. Bitácora de sesiones

- **2026-10-15 · L3 — F1-c1: límites por reglas, mensajes A/B/C y un test por rechazo** (Samuel con Claude, rama `l3/f1c1-limites`). Sin modelo, sin dependencias nuevas; no toca L1 ni el banco.
  - `asistente/limites.py`: `evaluar(consulta)` → `Decision(lim, accion, mensaje, consulta_enmascarada, continuar, disparados, avisos)`. Orden fijo: LIM-7 → LIM-9 → LIM-6 → LIM-1, 2, 3, 4, 8, 10 → recuperar. Patrones sin tildes y en minúsculas, con la misma normalización que el índice (`normalizar()` sale de `indice.py` y conserva el largo del texto).
  - LIM-7 da el mensaje C y la sesión sigue abierta. LIM-9 quita la instrucción o el rol y sigue con la pregunta legítima (si no queda ninguna, B); `limpiar_instrucciones()` sirve también para fragmentos recuperados. LIM-6 enmascara CI, teléfonos, correos, códigos y nombres, avisa y sigue. LIM-8 deriva sin decidir.
  - `asistente/mensajes.py`: A/B/C literales del plan (comprobado en un test), más DERIVACION y AVISO_DATOS, que son borradores nuevos. `asistente/respuesta.py`: `formatear_contradiccion()` para LIM-11.
  - Tests: 70 en verde (40 nuevos). Informativo sobre el banco (categorías 3–5 y sus gemelas, 26 casos): 10/10 rechazos correctos, 0 indebidos; el detector dice LIM-1 en B07, donde el banco dice LIM-3 (ambigüedad 1). Ojo: las reglas se escribieron conociendo esas preguntas.
  - §5.130 (Samuel). Sigue la F1-c2: corredor de evaluación y umbral.
- **2026-10-15 · L3 — F1-b: índice léxico y recuperación con cita** (Samuel con Claude, rama `l3/f1b-indice`). Sin modelo de lenguaje, sin dependencias nuevas; no toca L1.
  - `asistente/indice.py`: fragmenta por `##` y `###` (sección = ruta «## > ###»; más de 400 palabras → por párrafos, y una tabla larga por líneas) y busca con BM25 en biblioteca estándar (sin tildes ni palabras vacías). `buscar(consulta, k, umbral)` devuelve documento, sección, puntaje y texto, o `[]` si nada supera el umbral.
  - `python -m asistente.indexar` escribe `indice/indice.json` (ignorado en git) e imprime sólo conteos: DT 23 fragmentos en 23 secciones, Prot 23 en 22.
  - Tests: 30 en verde (12 nuevos, con un corpus ficticio, y 1 de humo sobre los documentos reales que no imprime texto).
  - Dato de base, no criterio: de los 21 casos del banco con cita, 16 recuperan una sección citada entre los 3 primeros (11 en el primero, 17 entre 5). Para calibrar el umbral en la F1-c.
  - Sin §5: falta que Samuel confirme la decisión de índice léxico.
- **2026-10-15 · L3 — F1-a: esqueleto de `implementacion/L3-asistente-virtual/`** (Samuel con Claude, rama `l3/f1a-esqueleto`). Primer código de L3; no toca L1.
  - README corto que enlaza al plan (§5.128 c), `requirements.txt` (sólo pytest), `.gitignore`, `pytest.ini` y venv propio en `.venv/` (ignorado).
  - El banco pasa a `eval/banco-v0.md` con `git mv` (historia conservada); se actualizan sus rutas en el plan y en `handoff.md` §6.
  - `asistente/banco.py` lee la tabla del banco; `tests/test_banco.py` controla sus reglas: 20–30 casos, ids únicos, cada par con un caso que dispara y su gemela, LIM-1 a 11 cubiertos, gemelas con cita, citas sólo del DT o el Protocolo, y mensaje fijo donde no hay cita.
  - Verificado: la corrida de pytest de L3 en verde (desde la carpeta de L3, con su venv); prueba de mutación: sin B17 y B18 se pierden LIM-7 y el par P09. `verificar_estado.py --check` OK; 0 archivos en `implementacion/L1-hce-idea/`.
  - Sigue la F1-b: índice en archivo y recuperación con cita.
- **2026-10-15 · L3 — F0 cerrada, §5.129 y plan de acción de la F1** (Samuel con Claude; sólo docs; `l3/f0-limites` mergeada a `main`).
  - **§5.129 (Samuel):** L3 la lleva él solo; v1 sólo técnicos y sólo documentos institucionales; servicio separado con almacén propio; LIM-10 y LIM-11 aceptados; las preguntas a IPPU las lleva él; **sin compuerta** frente a L1, y la F1 arranca ya.
  - Plan: «Decidible ya» → «Decidido (§5.129)»; salen el tope de horas, la pausa del 06/11 y el congelamiento; §4 F1 suma el plan de acción en rebanadas F1-a a F1-d; §7.1 ajustado.
  - `handoff.md` §6: casilla de la F0 tildada y una línea nueva para la F1.
  - Verificado: `verificar_estado.py --check` OK; 0 archivos en `implementacion/`, `CLAUDE.md` o `herramientas/`. Nada enviado a IPPU.
- **2026-10-15 · L3 — F0 (b): ajustes a §7.3** (Samuel con Claude, rama `l3/f0-limites`; sólo docs). Quedan **7 preguntas**.
  - La del convenio pasa a tarea interna (conseguir el texto en UTEC). Se renumeran IPPU-L3-6..8 → 5..7, con sus referencias.
  - IPPU-L3-3 sólo pregunta quién valida; los límites y los mensajes A/B/C van como anexo después del 2026-11-26. IPPU-L3-2: el Catálogo de puertas no se usa en la v1 salvo objeción.
  - Nueva línea de viabilidad [supuesto]: sin GPU o servidor, el «sin servicio externo» deja la F1 degradada o bloqueada. Plan +6 líneas; `verificar_estado.py --check` OK. No se envió nada.
- **2026-10-15 · L3 — F0 (b): preguntas para IPPU** (Samuel con Claude, rama `l3/f0-limites`; sólo docs). §7.3 del plan reescrito: **8 preguntas, IPPU-L3-1 a 8**, en dos tablas (bloquean la F1 / la F2), cada una con qué se pregunta, por qué, qué bloquea, dónde aterriza y qué se hace si no contestan.
  - Se fusionaron «quién valida» y «confirmar los límites y los mensajes» (IPPU-L3-3). El proveedor (IPPU-L3-4) y los datos de salud (IPPU-L3-7) quedan separados y planteados como opciones simples.
  - No se duplica: el Manual es B1 de `preguntas-ippu.md` y el hosting es `puntos-a-validar.md` §2.5. Se sacó el Catálogo de puertas: su origen ya es C9 y la v1 no lo usa.
  - «Nada decidido» → «decidido en §5.128…» en el encabezado del plan y en la línea de §6. Referencias cruzadas a «pregunta n» → IPPU-L3-n.
  - **No se envió nada a IPPU.** `preguntas-ippu.md` no se tocó. El plan pasa de 360 a 374 líneas; `verificar_estado.py --check` OK.
  - F0 completa en contenido (a, b, c); se cierra después de la revisión del equipo. Casilla de §6 abierta; sin §5.
- **2026-10-15 · L3 — monorepo y nombre de carpeta, §5.128** (Samuel con Claude, rama `l3/f0-limites`; sólo docs).
  - La ruta futura pasa a `implementacion/L3-asistente-virtual/` en el plan (4 lugares) y en el banco (la ruta de la F1). La carpeta no se crea hasta la F1. Las entradas viejas de la bitácora conservan `L3-asistente/`.
  - §5.128 (Samuel): monorepo; plan en `docs/planes/`; el README de la F1 enlaza al plan. Reversible. La arquitectura sigue pendiente.
  - Plan §5: `herramientas/` es compartida y sólo se le agrega; L3 copia o parametriza dentro de su carpeta.
  - Verificado: ningún `L3-asistente/` fuera de la bitácora; `verificar_estado.py --check` OK. Casilla de §6 abierta; las líneas del tope de horas no se tocan hasta cerrar la F0.
- **2026-10-15 · L3 — F0 (c): ajustes de la revisión al banco y a §8** (Samuel con Claude, rama `l3/f0-limites`; sólo docs). **Corrige la entrada del banco v0 de abajo, que no se toca.**
  - B25 (rol declarado) = la misma pregunta que B26 sin el rol. Sale el par P07 (cédula) y entra P16 (consejo legal sobre un caso, Prot §6.4); el banco sigue en 30 filas.
  - §8: LIM-8 cubre el consejo legal sobre un caso concreto; una línea aclara que los LIM son del asistente y que los borradores de la propia HCE (DT §7.4, §5.1) son de L1, con cortes pendientes de IPPU. LIM-11 entre fuentes normativas deja de ser ambigüedad.
  - Verificado: 25 citas en su sección, 0 solapamientos de 7 palabras, cobertura LIM-1 a 11, `verificar_estado.py --check` OK.
- **2026-10-15 · L3 — F0 (c): banco de evaluación v0** (Samuel con Claude, rama `l3/f0-limites`; sólo docs). Nuevo `docs/planes/L3-banco-evaluacion-v0.md`: **30 casos en 15 pares** (cada rechazo con su gemela que se responde).
  - Fuentes sólo el Documento Técnico y el Protocolo. Cada LIM-1 a LIM-11 tiene al menos un caso que lo dispara; LIM-3 con dos pares de frontera; están los casos de tercero, conflicto entre documentos, redactar un registro, rol declarado e inyección en la pregunta y en un fragmento recuperado.
  - **Verificado:** las 29 citas, cada frase buscada dentro de la sección citada (0 fallas); ninguna fila comparte 7 palabras seguidas con las fuentes (control automático); cobertura por LIM y pares completos.
  - **8 ambigüedades listadas, sin tocar §8 del plan**: entre ellas, que el DT prevé una interpretación orientativa del total del IDEA (LIM-1/3) y un borrador autogenerado de la VF (LIM-10), y que el lado «se responde» de LIM-3 no tiene fuente en DT ni Prot.
  - **Tope de horas de F0 retirado por el equipo.** El plan todavía lo menciona en §4 y §5; se actualiza al cerrar la F0. Siguen la pausa del 2026-11-06 y el congelamiento del 19 al 26/11.
  - Remotos según `handoff.md` §12.2: `gitlab` (UTEC) y `origin` (GitHub); la rama se pushea a los dos.
  - F0 sigue abierta: falta (b) y la revisión del equipo. Casilla de §6 sin tildar; sin §5.
- **2026-10-15 · L3 — F0 (a): lista de límites** (Samuel con Claude, rama `l3/f0-limites`; sólo docs). §8 nuevo en `docs/planes/L3-asistente-plan.md`, con una revisión aplicada.
  - **11 límites (LIM-1 a LIM-11)** con lo que hace el asistente en su lugar y tres mensajes fijos (A rechazo clínico, B sin respaldo, C crisis).
  - LIM-1 a 4 salen del *Documento de trabajo* (no normativo: los confirma IPPU). LIM-6 (a) y LIM-8 del Protocolo §6.7 y §6.2 (verificado: «una institución educativa» está en el texto literal).
  - Los temas ajenos se unifican con «sin respaldo» (LIM-5, mensaje B); §3 categoría 2 actualizada. Crisis (LIM-7): no corta la sesión; el contacto es un placeholder y queda **bloqueado por IPPU para producción**.
  - **A decidir por el equipo:** LIM-10 (no redacta registros clínicos) y LIM-11 (documentos en conflicto: muestra los dos, no elige).
  - F0 sigue abierta: faltan (b) preguntas para IPPU y (c) banco v0. Casilla de §6 sin tildar; sin §5.
- **2026-10-15 · L3 — responsable y rama al día** (Samuel con Claude, rama `docs/L3-plan`; sólo docs). **Corrige la entrada «L3 — plan de arranque» de abajo, que no se toca:** la excepción a §5.114 f la pidió **Samuel** (§5.32), no Lucas.
  - **Samuel toma L3** (§5.6: se avisa, no se pide permiso). Queda abierto quién lleva las preguntas de L3 a IPPU. Actualizados el plan (§5 y §7.2) y la línea de §6.
  - `fase3d-cierre-vf` ya está en `main`: se mergeó `origin/main` en `docs/L3-plan` y la advertencia de ff-merge de abajo deja de aplicar.
  - Sin §5: tomar un módulo no es una decisión (§5.6).
- **2026-10-15 · L3 — plan de arranque del asistente virtual** (Claude, rama `docs/L3-plan` **sobre `cb9030a`** = `fase3d-cierre-vf`, que no está en `main`). Sólo docs: `docs/planes/L3-asistente-plan.md` + una línea `- [ ]` en `handoff.md` §6. No toca L1 ni `implementacion/`.
  - **Excepción explícita y acotada a §5.114 f**, pedida por Lucas: el plan es un documento nuevo; no habilita otros.
  - **Verificado:** L3 en el repo = `handoff.md` §2, `README.md`, *Documento de trabajo* «Proyecto 3», presentación del 13.05, Protocolo §6.7 (nombra a los «asistentes virtuales», cita literal en el plan), Q47 y `preguntas-ippu.md` C9 (Catálogo de puertas: generado con IA, no validado). El convenio no está en el repo. JWT con sólo `sub`/`exp`; imagen `postgres:16-alpine` sin pgvector.
  - **Supuesto:** umbrales de evaluación, compuerta (F0 ≤ ~2 h/semana; pausa si la Fase 3-e no cerró al 2026-11-06; L3 congelada del 19 al 26/11) y criterios de UI fuera de `notas-accesibilidad-ui.md`.
  - **Pendiente del equipo (3):** audiencia de v1 y compuerta · arquitectura separada con almacén propio · dueño de L3 y quién lleva las preguntas a IPPU (no Lucas por defecto).
  - Sin §5: no se decidió nada. Nada de L3 se envía a IPPU antes del 2026-11-26 salvo decisión del equipo.
  - ⚠️ **No hacer ff-merge de `docs/L3-plan` a `main` antes de mergear `fase3d-cierre-vf`, o hacerlo a sabiendas (arrastra los commits de cierre de la 3-d).**
- **2026-10-15 · §5.126: 151/151 → 155/155 (cifra real tras §5.127 e); README sin ratio del glifo decorativo** (rama `fase3d-cierre-vf`; docs, sin código).
- **2026-10-15 · Mini-revisión de Fase 3-d: corrección de cifras** (rama `fase3d-cierre-vf`; `demo/` y docs, sin backend). **Corrige las dos entradas de 3-d de abajo, que no se tocan:** el «**151/151**» y las «**3 / 5 / 7 hojas**» **no se reproducían** — `3d-b2` fallaba siempre por una medición de margen derecho con `pypdf` (`maxx`) que daba ≈2046 pt para texto que está a ≤ 544 pt. Real tras el arreglo: **`conectada.js` 155/155** (151 + `3d-ci409` + `3d-ev409-lb/-pa/-pb`; base descartable :8001, nunca :8000) y **hojas por escala 1 / 1,25 / 1,5 → 3 / 5 / 6**. Decisiones **§5.127 e–f**.
  - `3d-b2` ya no mide el margen derecho (lo cubre `3d-b0`). Prueba: con sólo el `estilos.css` de `b08f040` fallan `3d-b0` y `3d-b2`; restaurado, pasan. La tabla del IC empieza en la hoja 1 a escala 1 (`.doc-cuant` puede cortarse entre tabla y radares).
  - Un 409 al registrar el CI ya no deja el foco en `<body>` ni el resumen «No se pudo guardar» junto a «Cambió en el servidor»; el foco va a `#ciTitulo`. Los 4 chequeos nuevos usan una escritura concurrente real y **fallan sobre el código anterior**.
  - Docs: `verificacion/README.md` sin conteos exactos de contraste ni de `fingerprint.js` (**32** pasos · **33** campos comparados); el glifo `.big` de los estados vacíos es decorativo (`aria-hidden`).
- **2026-10-15 · Corrección de la revisión de Fase 3-d** (rama `fase3d-cierre-vf`; `demo/` y docs, sin backend). **Corrige la entrada de 3-d de abajo, que no se toca:** su afirmación de que ninguna tabla/radar/firma queda partida «también con la impresión ampliada» **era falsa** — el impreso se recortaba a la derecha (y a escala 1 se achicaba solo ~0,71×) porque la hoja A4 caía en los `@media(max-width)` de pantalla, y el `3d-b2` original usaba CSS `zoom`, que no lo detectaba. Decisiones **§5.127**.
  - **Impresión:** en `@media print` vuelven la tabla real (sin `nowrap`), las firmas en 3 columnas y celdas que parten línea; firmas + pie legal y análisis cuantitativo no se parten. `3d-b0` (media print a 688/550/459 px: el documento mide el ancho de la ventana) y `3d-b2` con `scale` de Playwright 1/1,25/1,5 (3 / 5 / 7 hojas).
  - **Edad** del IC y del reporte de VF a la fecha del propio documento (no al reloj del navegador); «Fecha de impresión» en el reporte. **409** rotulado «Cambió en el servidor» (no «Avisos»). **Foco** tras el diálogo compartido nunca a `<body>`.
  - **Docs:** `verificacion/README.md` sin `categoriaBaremo`, `generarInforme()`/`C6e_vista_informe`, `vfAlertaVigencia` ni las capturas que `fingerprint.js` ya no toma; la corrección de «impresión ampliada» también en §5.126 d y en el README.
  - **Verificado:** `conectada.js` **151/151** sobre base descartable (:8001, nunca :8000); contraste: los mismos pares que fallan que la línea base y todo par nuevo ≥ 4,5:1.

- **2026-10-15 · Sesión Fase 3-d — IC con documento impreso y recibí, y VF conectados** (Lucas + Claude, rama `fase3d-cierre-vf`). Decisiones **§5.126**; sólo `demo/`, docs y las dos herramientas de verificación; backend sin tocar (head `dcc838486407`).
  - **Código:** `informe-cierre.js` reescrito (IC en la pestaña del expediente: crear/editar con `PATCH` mínimo, firmantes elegidos al firmar, 422 por campo, avisos sin bloquear, 409 → solo lectura, addendas, recibí en diálogo accesible, documento impreso desde `/documento` + `GET /hce/{id}`, estado del flujo si no está firmado); la VF en `hce-doc-org-vf.js` (404 = vacío, `pct` texto, categoría y alerta solo de la API, rampa de un solo matiz, sin sugerencia ni borrador, reporte de la familia); `@media print` A4 con encabezado repetido en cada hoja; `#modalFlujo` pasó a diálogo accesible. Se retiraron `view-ic`, el selector de NNA y el IC/informe/recibí/VF del expediente de ejemplo.
  - **Verificado:** `conectada.js` **145/145** sobre base descartable (:8001): IC de Martín impreso 58 · 60 · 79 · Δ +19 (4/6/4/5) == `/documento`; `page.pdf()` A4 (3 hojas, encabezado en cada una, ninguna tabla/radar/firma partida, también con la impresión ampliada); IC de Valentina firmado con dos firmantes en orden inverso al del grupo, recibí (una sola vez), addenda; 409 → solo lectura; VF de Martín (categoría == API, 422 por campo, alerta) y de Sofía (vacío → crear). Contraste: los mismos pares que fallan que la línea base; todo par nuevo ≥ 4,5:1.
  - **Huecos de la API (no simulados):** `categoria` y niveles de autonomía sin orden · `/documento` sin cédula ni CIE-11 · mensajes de validación de la VF en inglés · firmantes del IC no se guardan en el borrador.

- **2026-10-15 · Corrección de cifras de contraste de Fase 3-c** (rama `fase3c-evaluaciones`, sólo docs): las cifras exactas de las dos entradas de 3-c de abajo (72/71 pares, 11/13 pares nuevos, 4,85/4,90–13,78:1) **no se reproducen** al re-medir (revisión G11: 11 pares nuevos, 5,05–13,78:1). Vale: **los mismos 14 pares que fallan que la línea base; todo par nuevo ≥ 4,5:1.** Las líneas de abajo no se tocan; `README.md` de `demo/verificacion/` y `handoff.md` §5.125 (d)/(i) ya dicen esto.

- **2026-10-14 · Corrección de la revisión de Fase 3-c** (Lucas + Claude, rama `fase3c-evaluaciones`): sin backend ni DDL; `demo/`, docs, `fingerprint.js`. La entrada de 3-c de arriba **no se toca**; esta la **corrige**: el rango de contraste de los pares nuevos es **4,90–13,78:1** (no 4,85) sobre **71** pares distintos (no 72), con los mismos 14 que fallan (medido sobre una base recién cargada y contra la punta de 3-b); y la «autorización de foto que sigue bloqueando» ya no es cierta.
  - **Demo:** fuera el bloqueo de fotos individual y grupal (§5.99) y «(o habilitación excepcional)» de la nota del IC; restos muertos de excepción/candado fuera (`excepcion:null`, `exceptuable`, `lt-excepcion`, `.s-bloqueado`, `.aut-no/.aut-ok`). Addenda a medio escribir que sobrevive al cambio de pestaña y al re-clic; banda con `total_min` desconocido/no numérico → `banda-neutra` (nunca un paso inferido); confirmación de firma con `aria-describedby` y Esc. Ejemplo: aviso de que LB/PA/PB se editan en los expedientes conectados.
  - **Verificación:** `conectada.js` **113/113** (+`3c-add1`, `3c-add2`, `3c-banda`, `3c-tecla`, `3c-j9b`; `3c-j9` lee el texto completo de 101–108). `3c-add2` **falla** con la guarda de `evRepintar` quitada (mutación local, no queda en la suite). `fingerprint.js` corre entero (sin el paso de excepción; claves `C4*`/`C6a-c` borradas de los `.json` locales).
  - **Regla de edición:** las entradas de esta rama se pueden corregir hasta el merge; **«sólo agregar» rige desde el merge a `main`.**

- **2026-10-14 · Sesión Fase 3-c — IDEA y Protocolos A/B conectados + arrastre de la revisión de 3-b** (Lucas + Claude, rama `fase3c-evaluaciones`). Decisiones **§5.125**; sólo `demo/`, docs y las dos herramientas de verificación
  - **Código:** `evaluaciones.js` reescrito: LB/PA/PB en las **pestañas del expediente** (se retiraron `view-idea`/`view-prot`, los selectores y el estado en memoria). Crear/editar (`POST`, `PATCH` sólo con lo que cambió), firmar sin cuerpo con confirmación, addendas, 422 por dimensión/ítem/campo, avisos que no bloquean, Δ/interpretación/alertas tal cual la API, rampa de un solo matiz (banda escrita), marca de NS, suma «provisorio». HCE-00 trae la «IDEA vigente». `flujo.js`: sin candados ni excepción, tampoco en el expediente de ejemplo.
  - **Arrastre de 3-b:** selector de grupos del técnico (sólo los suyos), diálogo vaciado al salir/401, cédula por valor bruto, `.demo-tag` a la barra lateral, `conectada.js` con guarda `CONFIRMA_BASE_DESCARTABLE=1`, ids por fase (`3a-`/`3b-`/`3c-`).
  - **Verificado:** `conectada.js` **108/108** sobre base descartable (:8001): firma del IDEA de Joaquín y del PA/PB de Sofía, Δ y alerta == API, PB firmado antes que su PA, addenda con autor = usuario, 403 en grupo ajeno, 390 px. Contraste: **los mismos 14 pares que fallan**; los 11 nuevos miden 4,85–13,78:1.
  - **Huecos de la API (no simulados):** `banda` sin `orden` · un IDEA sin CI no avisa (el aviso de secuencia sale en PA/PB) · addendas/firmas sin nombre del profesional · `GET /grupos` ofrece todos los grupos a un técnico.
  - **Fuera de alcance, sin tocar:** IC, VF, informe impreso; la autorización de foto sigue bloqueando el guardado en la demo de ejemplo (§6, «Realinear la demo»).

- **2026-10-14 · Sesión Fase 3-b — HCE-00 editable, alta con asistente, CI y stepper conectados** (Lucas + Claude, rama `fase3b-escrituras`). Decisiones **§5.124**; sólo `demo/`, `herramientas/` y docs, backend sin tocar (head `dcc838486407`).
  - **Código:** `wizard-nna.js` reescrito (alta `POST /hce` y edición `PATCH` sólo con lo que cambió; sin nivel de apoyo ni talleres; técnicos del grupo; errores por campo + resumen `role="alert"`; 409 tal cual la API), `expediente.js` (cabecera editable, tarjeta «Flujo del año» desde `GET /hce/{id}/flujo`, pestaña CI con `GET`/`POST`/`PATCH`, avisos `warnings[]`), `adaptadores.js`, `index.html`, `estilos.css`; el diálogo es modal (`inert`, Esc, foco). Carry-over de 3-a: `cargarGrupos()` con guarda de secuencia y `conectada.js` pasa `?api=`.
  - **Verificado:** `demo/verificacion/conectada.js` **78/78** sobre una base descartable en `:8001` (alta como técnico, 409 genérico, 409 específico como admin, edición, baja con y sin fecha, CI pendiente → registrado, obligatorios vacíos, 0 errores de JS). `verificar_contraste_ui.js` corre sin tocarlo contra `:5500` con login: **los mismos 14 pares que fallan que la línea base** y los mismos anillos de foco; sin fallas nuevas. `fingerprint.js` acepta una URL.
  - **Corrección a la entrada de 3-a de más abajo** (esta bitácora no se edita): donde dice «63 pares» se debe leer «**los mismos 14 pares que fallan que la línea base**»; el total de pares depende de las pantallas que recorre la herramienta.
  - **Docs:** §5.124 (decisiones de 3-b + las de la revisión de 3-a que no tenían entrada: login modal con app `inert`, «Perfil de ejemplo», etiquetas de fase nunca visibles), §5.123 con un solo encabezado, cabecera, §6 3-b, `CLAUDE.md`, README de `demo/verificacion/`.
  - **Huecos de la API:** `GET /grupos` ofrece a un técnico grupos donde no puede dar de alta (lo sabe por el 403) · el 404 del CI no distingue «sin CI» de «sin expediente».

- **2026-10-14 · Fix de revisión de Fase 3-a** (Lucas + Claude, rama `fase3a-demo-conectada`): desborde horizontal de la lista a 390 px (`.sr-only` dentro de `.tabla-scroll`), sin «Fase 3-x» en texto visible, higiene de sesión con cargas en vuelo, login modal con app inerte y foco al título, tests de búsqueda reales, «Mi usuario» como perfil de ejemplo, docs (`PYTHONUTF8=1`, §5.123 trailer de sesión); `conectada.js` **46/46**, contraste 14/63 = línea base.

- **2026-10-14 · Fix de Fase 3-a — checklist de §6 restaurada, seed con `PYTHONUTF8=1`, Playwright fijado en 1.64.1** (Lucas + Claude, rama `fase3a-demo-conectada`): sólo docs y `demo/verificacion/package.json` (+ lockfile, agregados con `git add -f` porque su `.gitignore` los excluye); `conectada.js` sigue en 32/32.

- **2026-10-14 · Sesión Fase 3-a — la demo se conecta a la API** (Lucas + Claude, rama `fase3a-demo-conectada`). Decisiones **§5.122** (las cuatro del equipo + a–e); sólo `demo/` y docs, backend sin tocar (head `dcc838486407`).
  - **Código:** `js/api.js` (cliente `{data, warnings, total}`, `ApiError`, 401 → login, falla de red legible, base en un solo lugar con `?api=`), `js/adaptadores.js` (puros, sin cálculo de negocio), login real con error en `role="alert"` y foco, listado desde `GET /hce` (búsqueda por cédula/N.º/nombre, grupo desde `GET /grupos`, estado, paginación, CI y módulos por fila), HCE-00 de **solo lectura** con técnicos del grupo y 13 pestañas, componente «Modo demostración — no se guarda» + «Solo demo» (`utils.js`, `estilos.css`), `abrirExpedienteDemo()` para las vistas de ejemplo.
  - **Verificado:** `demo/verificacion/conectada.js` (Playwright headless, API :8000 con `app.seed_demo`, demo :5500) → **32/32 OK**: login/chip, contraseña mala (alert + foco + sessionStorage vacío), 7 activos · 8 con inactivos · Escolares 3 · Preadolescentes 3 · Adolescentes 2, cédula de Martín → 1 fila, Bruno con «CI pendiente», HCE-00 contra `GET /hce/{id}`, panel en las 6 vistas demo, token inválido, API caída, logout, 0 errores de JS.
  - **Contraste** (copia adaptada de `verificar_contraste_ui.js`): 63 pares, **14 fallan = los 14 de la línea base** (mismos ratios); los componentes nuevos pasan.
  - **Huecos de la API** (no se simularon): sin filtro «sólo inactivos» (§5.122 b) · `seed_demo` revienta en cp1252 sin `PYTHONUTF8=1` · SEV/talleres no se leen.
  - ⚠️ **Deuda:** `fingerprint.js` y `verificar_contraste_ui.js` abren la demo por `file://` y ya no loguean (CORS/API). ⚠️ **Incidente:** al quitar un worktree temporal con un junction a `demo/verificacion/node_modules`, git vació esa carpeta (no versionada); se reinstaló con `npm install playwright --no-save`.

- **2026-10-07 · Sesión B-front-fix — cierre de la revisión de B-front** (Lucas + Claude, rama `b-front`). Decisión **§5.121 e**; sin cambio de DDL (head `dcc838486407`).
  - **Media — `ci` en la lista:** `HceResumen.ci` con el mismo `Literal` (`EstadoCi`) y la misma derivación que `FlujoDetalle.ci`; una consulta en bloque (`services/flujo.estados_ci`).
  - **Tests:** consistencia lista vs `/hce/{id}/flujo` (`flujo` y `ci`) sobre los 8 expedientes del seed, con baja (Martín con PB e IC firmados, Bruno sin CI); conteo **exacto** de sentencias de `GET /hce` (9 = SAVEPOINT + usuario + total + página + 3 de flujo + 1 de CI + ROLLBACK TO SAVEPOINT), igual con 2 y con 12 filas en 2 grupos; preflight CORS de POST y PATCH con `Content-Type: application/json`; la aserción de `fecha_nac` de `test_m11_3a_hce.py` ahora compara un valor real (`2016-04-12`).
  - **Menores:** ejemplos de Swagger de `schemas/protocolo.py` e `informe_cierre.py` con las fechas del seed (2026-11-06 / 2026-11-13); `openapi.json` en `backend/.gitignore`.
  - **Medido:** `.venv` `pytest -q` → **815 passed, 0 skipped** (811 + 4); `alembic heads` = `dcc838486407`, `check` sin cambios; ambos `--check` → exit 0.

- **2026-10-07 · Sesión B-front — lecturas para la demo conectada** (Lucas + Claude, sobre `main` 0377d3f). Decisiones **§5.121 a–d**; sin cambio de DDL (head `dcc838486407`).
  - **Lista `GET /hce`:** `persona.fecha_nac` + `flujo` (`[{modulo, estado}]` del año en curso, forma de `modulos[]`), armado en bloque con 3 consultas fijas (`services/flujo.estados_de_flujo`). El test mide que 2 y 12 filas hacen las mismas 8 consultas.
  - **Técnicos:** `GET /grupos` y `HceDetalle.grupo` con `tecnico1`/`tecnico2` `{id, nombre, rol}`; `rol` = rol en el grupo, no `admin`/`tecnico`. `joinedload` en `listar_grupos`.
  - **Seed:** PB de Martín 2026-11-06, IC y recibí 2026-11-13; números intactos. Se tocó **una** aserción del test §12-A (la fecha del recibí). Nota en `backend/README.md`: recargar después del 2026-11-13.
  - **CORS:** ya era configurable con 5500 por omisión; sólo tests nuevos.
  - **Medido:** `.venv` `pytest -q` → **811 passed, 0 skipped** (794 + 17 en `test_front_lecturas.py`; 3 tests viejos con el conjunto de claves ampliado); `alembic heads`/`check` sin cambios; `verificar_estado.py --check` y `generar_catalogos_backend.py --check` → exit 0. ⚠️ `pytest` con el Python global falla en la colección (un paquete `tests` de site-packages pisa al del repo): usar el del `.venv`.

- **2026-10-07 · Sesión M11.5-a-fix — cierre de la revisión de M11.5-a** (Lucas + Claude, sesión en la nube, rama `claude/epic-keller-z3bz8n` sobre `main` 6e40ed0). Sin decisión nueva (aplica §5.120); sin cambio de DDL: head **`dcc838486407`**, un archivo en `versions/`.
  - **Media — orden de la CLI:** `seed_demo.main()` delega en `ejecutar(cliente, sesiones, …)`; los grupos de `UBICACION_DEMO` se miran en la base **antes** de `preparar_usuarios`. Sin `seed_catalogos` → exit 1, «correr primero `python -m app.seed_catalogos`», 0 profesionales escritos (antes: 3 usuarios y «No se escribió nada»). Test + par (con catálogos → exit 0, 3 usuarios, 8 expedientes); con el orden viejo el test falla (3 ≠ 0).
  - **Bajas:** par agregado a los 3 rechazos de `test_m11_5a_grupos.py`; el test de asignación lee técnicos y roles de la fila `grupo` (`GET /grupos` no los expone) y cada técnico, con su token, alcanza un expediente de cada grupo; `README.md` sin el `UPDATE grupo` a mano y con el orden de carga (`IPPU_DEMO_PASSWORD`: sin ella, los técnicos comparten la del admin — sólo desarrollo).
  - **Medido:** `pytest -q` → **794 passed, 0 skipped** (790 + 4); `alembic check` sin cambios; ambos `--check` → exit 0. Postgres 16 local en 5440 (sin Docker en la nube).

- **2026-10-07 · Sesión M11.5-a — seed espejo vía API (§12-A ejecutable) + asignación de técnicos** (Lucas + Claude, sesión en la nube, rama `claude/epic-keller-z3bz8n` sobre `main` c1ba234). Decisiones **§5.120** (a–e). Sin cambio de DDL: head **`dcc838486407`**, un archivo en `versions/`.
  - **`PATCH /grupos/{id}`** (sólo `admin`): `services/grupos.py`, schemas/router en `referencias`; 422 por campo (inexistente, inactivo, misma persona, campo ajeno), 403, 404; auditoría por campo con `hce_id` NULL y `modulo='GRUPO'`, técnico legible.
  - **`app/seed_demo.py`**: bootstrap de usuarios con `crear_usuario` (fuera de la API) + `cargar_demo` sólo por HTTP, clínica cargada por González (`tecnico`). CLI con `IPPU_EMAIL`/`IPPU_PASSWORD`.
  - **Frenar y consultar:** la demo usa grupos por color; Lucas eligió ubicar Azul/Celeste/Naranja en Escolares/Preadolescentes/Adolescentes **sólo en el seed** (§5.120 c: no son franjas de IPPU). Regla de obs y fechas futuras: sin conflicto (§5.120 d).
  - **§12-A por la API (CLI contra `uvicorn`, base de desarrollo vacía):** IDEA 58 (18/14/14/12) · PA 60 · PB 79 · Δ +19 (4/6/4/5) · `alertas: []` · IC firmado con recibí. Segunda corrida → exit 1, 8 expedientes y 47 filas de auditoría antes y después.
  - **Medido:** `pytest -q` → **790 passed, 0 skipped** (751 + 17 de grupos + 22 del seed); `alembic check` sin cambios; ambos `--check` → exit 0. Entorno: Postgres 16 local en 5440 (sin Docker en la nube).

- **2026-10-07 · Sesión M11.3-d1-fix — cierre de la revisión de d1** (Lucas + Claude, sesión en la nube, misma rama **`m11.3-d1`**, sólo `origin`). Decisiones **§5.119** (a–e). Sin cambio de DDL: head **`dcc838486407`**, un archivo en `versions/`.
  - **H1:** `secret_key` sin valor por omisión; falta, < 32 bytes o el literal viejo → la configuración no carga, en todos los entornos. `.env.example` vacía con el comando; `conftest.py` fija una clave de prueba.
  - **M2:** `/addendas` sin `profesional_id` (`extra="forbid"` → 422); el autor es el usuario del token. **Firmas:** las cuatro filas `firma` llevan `usuario_id` del token (ya lo hacían; ahora con test).
  - **M1:** `DuplicadoError` en `services/hce.py`; el router de `/hce` da un 409 genérico sin `campo` a un `tecnico` (se lee el rol antes del servicio: después de un `flush` fallido el objeto expira). **L1:** bcrypt contra un hash ficticio en los caminos sin hash.
  - **L2:** matriz de 19 casos (protocolo, IC, VF, IDEA vigente/Δ, CI, flujo) con 404 igual a inexistente fuera del grupo y 2xx dentro, y búsqueda por CI ajena → `[]` con `X-Total-Count: 0`. **L3:** test de `/profesionales` renombrado y el caso «tabla vacía» pasa al servicio. **L4:** fila «`pct` NULL» de `esquema-datos-v2.md` §4 sin la contradicción.
  - **Tests existentes ajustados:** los cuerpos de `/addendas` de M11.3-b/c sin `profesional_id`; el autor esperado es el `admin` de `client`; «profesional inexistente → 422» pasa a «`profesional_id` en el cuerpo → 422».
  - **Medido:** `pytest -q` → **751 passed, 0 skipped** (718 + 33); `alembic check` sin cambios; ambos `--check` → exit 0. Tres mutaciones (sin `forbid`, sin el 409 genérico, sin el hash ficticio) ponen sus tests en rojo.

- **2026-10-07 · Sesión M11.3-d1 — correcciones de la revisión b+c, HCE-VF y login mínimo** (Lucas + Claude, sesión en la nube, rama **`m11.3-d1`** sobre `m11.3-c`, sólo `origin`). Decisiones **§5.118** (a–g + VF). Sin cambio de DDL: head sigue **`dcc838486407`**.
  - **Login:** `core/seguridad.py` (bcrypt directo + JWT), `services/auth.py` (alcance por grupo, 404 fuera de él), `POST /auth/login`, `GET /auth/yo`, CLI `python -m app.crear_usuario`; todos los routers protegidos desde `main.py`; `usuario_id` en cada fila de auditoría. `passlib` sale de `requirements.txt` (roto con bcrypt 5).
  - **Endpoints nuevos:** `/auth/login`, `/auth/yo`, `POST/GET/PATCH /hce/{id}/valoracion-funcional`; `GET /hce` con `limit`/`offset`/`incluir_inactivos` y `X-Total-Count`; `PATCH /hce/{id}` acepta baja/reingreso.
  - **Firmas:** la firma del PA completa el Δ de un PB ya firmado (+ fila `edicion` `deltas`); recomendados de PA/PB (15 semanas, 113 palabras) e IC (75 por escala) como aviso.
  - **VF:** baremo sólo desde `pct` (cortes del catálogo), «No corresponde» con `pct` NULL, alerta 90/30 al leer, entrada `extra="forbid"`. **Autogeneración no implementada:** los cortes escala → nivel no están en el Documento Técnico §7.4 ni en Especificaciones §1(g).
  - **Tests existentes ajustados (13 que fallaban, sin cambiar lo que prueban):** `client` entra como `admin`; `usuario_id` esperado = admin; listas de `/profesionales` sin el admin; dos tests del 500 crean el expediente antes (el alcance se verifica antes del servicio); «HCE-00 ignora `activo`» pasa a ignorar sólo metadatos de origen; los cuerpos firmables de M11.3-c cumplen los recomendados nuevos.
  - **Medido:** `pytest -q` → **718 passed, 0 skipped** (634 + 84); `alembic check` limpio; ambos `--check` → exit 0.
  - **Smoke `uvicorn` (base de desarrollo):** admin + 2 técnicos con el CLI → login → la técnica ve sólo su grupo (404 en el ajeno), el admin todo → Martín: IDEA 58 → PB 79 firmado **antes** que el PA 60 → Δ +19 en el PB y en `/documento` → VF 58 % «Severo».
  - Anotado, no hecho: asignar técnicos a grupos sin endpoint/CLI; baja/reingreso no escribe `evento`; cortes de la autogeneración de VF (pregunta a IPPU).

- **2026-10-07 · Sesión M11.3-c — PA/PB, Δ, alerta e informe de cierre** (Lucas + Claude, sesión en la nube, rama **`m11.3-c`**, sólo `origin`). Decisiones **§5.117** (a–e + lo fijado). Sin cambio de DDL: head sigue **`dcc838486407`**.
  - **Servicios nuevos:** `protocolo.py` (24 ítems, totales sólo completos, integridad §4.3, Δ + alerta al firmar el PB), `delta.py` (`calcular_delta` tipado, interpretación y alerta desde `delta_interpretacion`), `informe_cierre.py` (firma con dos profesionales, `recibi`, `documento`); `idea.py` suma los recomendados como aviso y el Δ interanual.
  - **Endpoints:** `POST/GET /hce/{id}/protocolo` · `GET/PATCH /protocolo/{id}` · `POST /protocolo/{id}/firmar|addendas` · `GET /hce/{id}/idea/delta` · `POST/GET /hce/{id}/informe-cierre` · `GET/PATCH /informe-cierre/{id}` · `POST /informe-cierre/{id}/firmar|addendas|recibi` · `GET /informe-cierre/{id}/documento`. El ejemplo Swagger `fuera_de_secuencia` se mudó al PA.
  - **§4.3 (Documento Técnico, `1_documento-tecnico-utec-lidia.md:84-86`):** PA/PB = 24 ítems · fecha · obs en 1 y 5 · síntesis de ambos técnicos; IC = síntesis por escala · valoraciones · recomendaciones · orientaciones · fecha (+ «LB/PA/PB firmados», que sólo avisa). Alerta: §5.2 «Δ ≤ −7 en una escala».
  - **Tests M11.3-b ajustados:** el helper `_completo` ahora cumple los recomendados (sesiones 6, síntesis larga) y el test de Swagger mira `recomendacion_no_cumplida` en la firma del IDEA.
  - **Medido:** `pytest -q` → **634 passed, 0 skipped** (600 + 34; tres mutaciones —alerta, obs en 1/5, ajustes en A— rompen tests); `alembic check` limpio; ambos `--check` → exit 0 (sin Docker en la nube: el conteo de tests lo verifica a mano esta entrada).
  - **Smoke `uvicorn` en la nube (Postgres local, base de desarrollo sembrada):** HCE (N.º 1001) → CI → IDEA 58 «Moderado» firmado → PA 60 → PB 79 (Δ +19, «Progreso muy significativo», sin alertas) → IC firmado → recibí → `/documento` completo → flujo con los cuatro `firmado`.
  - Anotado, no hecho: recomendados de PA/PB/IC; recálculo del Δ si el PA se firma después del PB.

- **2026-10-06 · Sesión M11.3-b — motor de flujo, consentimiento mínimo, firma = bloqueo e IDEA** (Lucas + Claude, rama `main`). Decisiones **§5.116** (a–e + lo fijado). Sin cambio de DDL: head sigue **`dcc838486407`**, un archivo en `versions/`.
  - **Servicios nuevos:** `flujo.py` (estado derivado `sin_iniciar|en_curso|firmado`, `faltantes`, CI `pendiente|registrado`, `avisos_de_secuencia` genérico), `firma.py` (`firmar_modulo`, `agregar_addenda`, candado 409 para todo `FirmaMixin`), `idea.py` (totales, banda desde `banda_idea`, validaciones de firma, `idea_vigente`, `idea_de_anio`), `consentimiento.py`.
  - **Endpoints:** `GET /hce/{id}/flujo` · `GET/POST/PATCH /hce/{id}/consentimiento` · `POST/GET /hce/{id}/idea` · `GET /hce/{id}/idea/vigente` · `GET/PATCH /idea/{id}` · `POST /idea/{id}/firmar` · `POST /idea/{id}/addendas`. Swagger con ejemplos, incluido `warnings` con `fuera_de_secuencia`.
  - **§4.3 del IDEA (Documento Técnico, `1_documento-tecnico-utec-lidia.md:82`):** integridad = 12 dimensiones sin NS ni vacías · fecha de consenso · síntesis · objetivos → implementado (422 por campo). Recomendados (≥ 5 sesiones, ≈200 palabras) **no implementados**: «piden constancia» sin mecanismo definido.
  - **Medido:** `pytest -q` → **600 passed, 0 skipped** (539 + 61; cada rechazo con su par que pasa; la falla simulada tras escribir en la firma deja IDEA sin firmar y sin fila); `alembic check` limpio; ambos `--check` → exit 0 (docs de «539» actualizados a 600).
  - **Smoke `uvicorn` contra la base de desarrollo:** HCE → CI → IDEA de Martín (total 58, banda «Moderado») → firma (2 firmas, `manual_version`) → PATCH 409 → flujo `CI registrado · LB firmado`; filas borradas, conteos iguales a los de antes.
  - Anotado, no hecho: el aviso `fuera_de_secuencia` no se puede ejercitar por API hasta M11.3-c (se prueba con filas armadas por los modelos); `puntuacion_*` sigue sin exponerse (§5.98).

- **2026-10-06 · Sesión M11.3-a3 — convenciones transversales tras la revisión de M11.3-a/a2** (Lucas + Claude, rama `main`). Decisiones **§5.115**. Sin cambio de DDL: head sigue **`dcc838486407`**.
  - **(a) JSONB:** `JSONB(none_as_null=True)` en las 13 columnas nullable. Antes, `anamnesis: null` (alta o PATCH) se guardaba como JSON `null`: el test nuevo falló con `assert _anamnesis_es_sql_null(...) is True` → `False`.
  - **(b) Vacío en fecha/entero/FK opcionales → `None`:** `FechaOpcional`/`EnteroOpcional` en `schemas/comunes.py`; aplicado a `dx_fecha`, `grupo_id`, `hc_historico`, `fecha_nac` (PATCH).
  - **(c) 500 con sobre** `internal_error` (mensaje genérico; traceback al log). Es *middleware*, no `exception_handler(Exception)`: éste quedaba fuera de CORS y la demo vería un fallo de red.
  - **(d) GET no commitean** (`sesion_lectura`); test de commit fallido ⇒ 500 con sobre, que rompe si FastAPI (≥ ~0.118) mueve el commit tras la respuesta; pin comentado en `requirements.txt`.
  - **L1** falla tardía en `POST /hce` no deja persona/expediente/auditoría · **L2** `activo` en `/profesionales` · **L6** `anio_actual` → `services/fechas.py`.
  - **Docs A5:** cuerpo de A5 como respondida, fila del resumen, `puntos-a-validar` §2.8, nota en `pendientes-resueltos`, segunda vuelta verbatim en `respuestas-ippu-2026-10-05.txt`.
  - **Medido:** `pytest -q` → **539 passed, 0 skipped** (521 + 18; mutaciones verificadas en (b) y (d)); `alembic check` limpio; ambos `--check` → exit 0.
  - Fuera de alcance, anotado: `?anio=`/`?activo=` vacíos en query siguen dando 422; paginación (L3) a M11.3-d.

- **2026-10-06 · Sesión M11.3-a2 — identidad + listas de lectura** (Lucas + Claude, rama `main`). Correctiva de M11.3-a; decisiones **§5.109–§5.114**.
  - **`hc_historico`** → `Integer`, `CHECK ≥ 1000`, `UNIQUE`; el servidor asigna `max + 1` (1001 el primero) con `pg_advisory_xact_lock` por transacción; explícito: ≥ 1000 y libre (409/422). La búsqueda «N.º de HC» ya no mira `hce.id`.
  - **CI canónica** (sin puntos/guiones/espacios) → el `UNIQUE` atrapa duplicados en cualquier formato. **Búsqueda por grupo con `anio`** (por omisión, el en curso). **Alta → una fila `auditoria` `tipo='carga'`**.
  - **`GET /grupos?anio=`** y **`GET /profesionales?activo=`** (sólo lectura, sin email ni hash).
  - **Migración regenerada** (§5.19): head **`dcc838486407`**, un solo archivo; `alembic check` limpio; dev DB recreada.
  - **Medido:** `pytest -q` → **521 passed, 0 skipped** (501 + 20; incluye un test de concurrencia con dos transacciones reales); ambos `--check` → exit 0; humo con `uvicorn`: dos altas → 1001, 1002, y se borraron.
  - Hallazgo propio: con un N.º explícito en el tope del `integer`, el `max + 1` desbordaba (500); ahora es 409 explicado.
  - Cabecera de `handoff.md` reescrita a una pantalla (§5.114). Sin tocar demo, flujo, firma, auth ni baja/reingreso.

- **2026-10-06 · Sesión M11.3-a — cimientos de servicios + rebanada persona/HCE** (Lucas + Claude, rama `main`).
  Primer código de `app/services/`, `app/schemas/` y `app/routers/`. **Sin cambios de modelo, migración ni seed.**
  - **Cimientos:** errores de dominio (409/422/403/404) con un solo cuerpo `{code, detail[]}`; sobre `{data,
    warnings}` en POST/PATCH; **una transacción por request** (commit sólo en `routers/dependencias.py`);
    `registrar_cambios` (auditoría de campo) y `normalizar_texto` (`''`/blanco → `NULL`). Contrato en **§5.108**.
  - **Rebanada:** `POST/GET/PATCH /hce` + búsqueda por CI · N.º de historia · grupo (+ nombre; fuente: Doc.
    Técnico l.66). La CI se compara sin puntos/guiones; la carrera por `uq_persona_ci` también da 409.
  - **Tests:** fixtures `client`/`db_api` con savepoints (el commit del router no escapa del test). Mutaciones
    verificadas: sin commit → 30 fallan; sin normalizar → 10; sin chequeo de CI → 4; sin traducir
    `IntegrityError` → 1; auditar siempre → 4; commit aun con error → 2. (Sin `rollback` explícito no falla
    nada: `get_db` cierra la sesión y eso ya deshace; el `rollback` queda como cinturón.)
  - **Smoke real** (uvicorn contra la base de desarrollo): 201 persistido, 409, PATCH con 1 fila de auditoría;
    filas de prueba borradas después.
  - **Abiertos (§6):** `tipo` de auditoría de la creación · regla de `hc_historico` · «N.º de HCE» · falta `GET /grupos`.
  - **Medido:** `pytest -q` → **501 passed, 0 skipped** (435 + 66); ambos `--check` → 0; head `b99294aec85c`.

- **2026-10-05 · Sesión M11.3-0b — A5 contestada, B1 con texto definitivo** (Lucas + Claude, rama `main`).
  Continuación corta de M11.3-0; sin cambios de código (sólo comentarios y docstrings).
  - **A5:** IPPU respondió «Taller adolescentes es el nombre de un grupo» → **§5.107** (confirma §5.61; supera
    la ambigüedad de §5.93/§5.104, que no se editan). Corregidos los textos vivos que decían «podría ser el
    servicio Taller Terapéutico»: `handoff.md` (§1, §9, cabecera, §6), `preguntas-ippu.md`, `puntos-a-validar.md`
    §2.8, `esquema-datos-v2.md` fila `grupo`, y los comentarios de `generar_catalogos_backend.py`,
    `seed_catalogos.py` e `identidad.py` (AST contra `HEAD`: sólo docstrings/comentarios).
  - **B1:** sigue abierta; el borrador de M11.3-0 se reemplazó por el texto de Lucas (Manual completo o, si no, qué
    revisión hacen antes de firmar el IDEA). Sin bloquear el 26/11 (§5.105).
  - **Medido:** `pytest -q` → 435 passed, 0 skipped; ambos `--check` → 0; head `b99294aec85c`, 1 archivo.

- **2026-10-05 · Sesión M11.3-0 — respuestas escritas de IPPU (A1–B12) registradas** (Lucas + Claude, rama
  `main`). **Sólo documentación**: ningún cambio de código, modelo, migración, seed ni test.
  - **Fuente.** `docs/notas/respuestas-ippu-2026-10-05.txt` (verbatim; su duplicado
    `respuestas_hasta_B12_…txt` es byte-idéntico y no se versiona). La copia subida del Protocolo
    (`protocolo-acceso-subido-2026-10-05.md`) es **byte-idéntica** (sha256 `53f7b509…`) a la de `HEAD`: **0
    diferencias**. ⚠️ `docs/markdown/protocolo-acceso-…-hce.md` aparece **borrado sin commitear** en el árbol
    desde antes de la sesión; no se restauró ni se incluyó en el commit.
  - **Hecho.** §5.93–§5.106 (14 entradas; la última previa era §5.92) · `preguntas-ippu.md`: 17 ítems con
    estado y destino (15 respondidos; **A5 y B1 abiertos y re-preguntados** — el texto de B1 es un
    borrador mío porque el pedido remitía a un texto que no vino) · `esquema-datos-v2.md` §2.2/§2.3/§2.6/§4/§5/§6
    · `puntos-a-validar.md` · bullet M11 de §6 + cabecera · `CLAUDE.md` · nota en `PLAN-modular…` · docstrings de
    `Consentimiento`, `FirmaMixin`, `Idea`, `PuntuacionConsensoMixin`, `Foto`, `AutorizacionImagen`, `pai.py`.
  - **Verificación.** Docker estaba apagado: se levantó Docker Desktop + `docker compose up -d`. `pytest -q`
    → **435 passed, 0 skipped**. Ambos `--check` → exit 0. `alembic heads` = `current` = `b99294aec85c`; 1
    archivo en `versions/`. `app/`: sólo 3 archivos de `models/`; comparación por AST contra `HEAD` con los
    docstrings anulados → **idénticos** (sólo cambian docstrings).
  - **Barrido (§5.83).** `grep -rIni` de los 10 términos, excluyendo `node_modules`, `graphify-out`, `.git`,
    `.venv`, `bitacora.md`, `relevamiento-*`, `docs/prompts/`: **corregidos** los vivos en `handoff.md`
    (cabecera, §6, §7), `esquema-datos-v2.md`, `puntos-a-validar.md`, `CLAUDE.md`, 3 docstrings de `app/`;
    **sin tocar** (cita/registro/fuente): §5 de `handoff.md`, actas, snapshots, `PLAN-M12`, `agenda`,
    `pendientes-resueltos`, `docs/markdown`, `docs/prototipo-v4`, `docs/fuentes`, tests, `verificacion/*.json`.
    **Vivo y sin tocar por alcance:** textos de la demo (`flujo.js:58,194,259`) → pendiente en §6.
  - **Dudas que quedan para M11.3-b** (§5.94/§5.95): si la falta de CI avisa; contenido de `warnings[]`; uso
    del campo `excepcion`. Commit y push a `gitlab` y `origin` (ver `git log`).

- **2026-09-18 · Sesión M12.9 — el Prototipo v4 deja de ser fuente normativa** (Lucas + Claude, rama
  `main`). Sesión corta, sin tocar código: cerraba un cabo suelto de M12.8-cierre+I1 (la decisión se tomó
  mid-sesión el 2026-09-16 y quedó sin su entrada de §5, con el párrafo de precedencia de `CLAUDE.md` y
  `handoff.md` todavía nombrando al Prototipo v4 como precedencia 1).
  - **Punto de partida, medido (Paso 0).** HEAD y ambos remotos (`gitlab`, `origin`) en `339a726`, árbol
    limpio salvo el prompt de sesión sin trackear. Docker arriba (`ippu-postgres` healthy). `pytest -q` →
    **435 passed, 0 skipped**. Ambos `--check` → exit 0. **51 tablas**, head `b99294aec85c`, un solo
    archivo en `versions/`. Última entrada de §5 confirmada: **§5.91** → se usó **§5.92**.
  - **Paso 1 — §5.92.** Transcrita la decisión de Lucas: el Prototipo v4 y la demo v4.1 pasan de
    especificación a insumo, por relleno generado encontrado en el propio prototipo (§5.37) y por
    confirmarse que Fernando Sierra genera estos artefactos con IA (Prototipo v4 y el «Catálogo de
    puertas» de L3). Fija el alcance del 26/11 (prototipo presentable sin datos reales; §2.17, hosting y
    Fase 4 explícitamente fuera del camino crítico) y deroga por escrito el orden de precedencia de §5.10
    (append-only, no se edita). Verificado sin contradicción contra §5.10, §5.37 y §5.50 antes de escribir.
  - **Paso 2 — párrafo de precedencia.**
    - `handoff.md` (línea del header, antes bajo «Fuente normativa vigente (orden de precedencia,
      §5.10)»): listaba Manual + Prototipo v4 en el nivel 1. Reescrito citando §5.92: nivel 0 igual (§5 +
      acta), 1 el cuestionario del 15/06, 2 el Protocolo, 3 el Manual, 4 el Documento Técnico, 5 la
      presentación; Prototipo v4 y demo v4.1 explícitamente fuera de la lista, como insumo.
    - `CLAUDE.md` (párrafo «Precedencia normativa — enmienda del 2026-09-03», L9/§5.10): mismo contenido
      viejo (Manual + Prototipo v4 por encima del Documento Técnico); mismo reemplazo que en `handoff.md`,
      citando §5.92 y derogando a §5.10/L9. También se cerró ahí mismo el aviso de «cambio de alcance sin
      §5 propia» que había dejado M12.8-cierre.
    - **Grep del resto del repo** (Paso 2c) — instrucciones que afirmaban precedencia vigente, fuera de
      registros: `README.md:85-86` (decía «Ronda M12 ... en curso» y «pasa a ser la fuente normativa por
      encima del Documento Técnico» — corregido: M12 CERRADA, cita a §5.92) y
      `implementacion/L1-hce-idea/backend/docs/esquema-datos-v2.md:29` («Fuente normativa desde ago-2026
      (§5.10/D1): ... por encima del Documento Técnico» — corregido, cita a §5.92). **Revisadas y dejadas
      sin tocar** por ser cita/registro o alcance ya acotado a una ronda cerrada: `CLAUDE.md:54` y
      `docs/estructura-repositorio.md:49` («fuente normativa M12» / «de la ronda M12», ambas ciertas como
      historia de una ronda ya cerrada); `docs/notas/puntos-a-validar.md:499` (nota de trabajo explicando
      por qué M12.6 pudo construirse sin el Manual, no una instrucción a futuro); las entradas §5.10,
      §5.20, §5.37, §5.50 de `handoff.md` (append-only, no se tocan) y el §6 abierto sobre C9 (ya cubierto
      en `preguntas-ippu.md`, verificado, no requería entrada nueva).
  - **Paso 3 — los tres marcadores.** Exactamente tres, ni más ni menos: el header de `handoff.md`
    (resuelto al reescribir la cabecera en el Paso 4), el párrafo de `CLAUDE.md` (resuelto en el Paso 2) y
    el `[x] M12.8` de §6 (resuelto: la frase «la entrada de §5 la asienta él aparte» ahora cita §5.92).
  - **Paso 4 — cierre.** `pytest -q` y ambos `--check` re-corridos, idénticos al Paso 0 (435 passed / 0
    skipped, ambos exit 0) — **no se tocó código**. §6: **M12.8b-3b pasa de diferida a CANCELADA** (no
    desbloquea nada y no hay margen para trabajo que no desbloquee) y **el sub-módulo de administración
    (§2.8/§2.9/§2.11, §5.90) queda explícitamente fuera del alcance del 26/11** (los cinco grupos ya
    sembrados alcanzan para un prototipo presentable). Cabecera de `handoff.md` actualizada (§5.82).
    Prompt de sesión guardado en `docs/prompts/`. Después: **M11.3**.

- **2026-09-16 · Sesión M12.8-cierre+I1 — cierra M12.8/M12 y aterriza I1** (Lucas + Claude, rama `main`).
  Dos partes con checkpoint entre medio, tal como pedía el prompt de sesión.
  - **Punto de partida, medido (Paso 0).** HEAD y ambos remotos (`gitlab`, `origin`) en `dad05ef`, árbol
    limpio salvo el prompt de sesión sin trackear. Docker arriba (`ippu-postgres` healthy). `pytest -q` →
    **432 passed, 0 skipped**. Ambos `--check` → exit 0. **51 tablas**, head `559b1a79cb77`, un solo
    archivo en `versions/`. Última entrada de §5 confirmada: **§5.91**.
  - **PARTE A — cierre de M12.8/M12.**
    - **Paso A1, checklist medido antes de tocar nada.** `DESDE_LA_DEMO` (6 secciones) contra
      `docs/prototipo-v4/`: `idea_dimension`/`ippu_item`/`baremo_categoria` tienen algo parecido en el
      JSON del prototipo (`IDEA_DIMS`/`IPPU_ITEMS`/`BUND_CATS`) pero no idéntico; `categoria_documento`
      tiene fuente exacta pero **inline** en `mDocs()` (array `cats`), no en el JSON; `idea_nivel` y
      `servicio` no tienen fuente extraíble en absoluto. `solo_al_crear`: ya extendido correctamente a
      cada catálogo de M12.3–M12.7 desde que se construyó (nada pendiente). Índices de FK: ya en 0, ya
      probado. `Numeric`→`Decimal`: único caso del esquema, ya correcto. Criterio §12-A: ya escrito en
      prosa y coincidiendo con la ronda construida.
    - **Cambio de alcance, decidido por Lucas en el chat, no medido por la sesión.** El Prototipo v4
      **dejó de ser fuente normativa** — insumo a consultar, no especificación a converger. Consecuencia:
      "vaciar `DESDE_LA_DEMO` pasando todo al prototipo" pierde su justificación (mover datos entre dos
      artefactos de la misma procedencia no gana fidelidad). Se acotó a: mover **sólo** lo verbatim
      (`categoria_documento`, verificado campo por campo antes de mover — el diff del JSON generado
      cambia únicamente `_origen`); todo lo demás se queda, **con el motivo anotado en el código**, no
      como pendiente. La entrada de §5 que asienta esto formalmente la escribe Lucas aparte; esta sesión
      no abrió ninguna.
    - **Auditoría de guards M12.1–M12.7 (Paso A4).** 80 `CheckConstraint` en 8 archivos de modelos.
      Verificados por muestreo dirigido (no exhaustivo uno a uno): `talleres`, `catalogos`, `pai`,
      `ateneo`, `inclusion` y el XOR de `documento` (M12.7) — todos con rechazo **y** caso que pasa
      probados, casi siempre vía tests parametrizados (por eso un grep por `match="<constraint>"` daba
      falsos positivos: no detecta parametrización). **Un hueco real, en `modulos.py`/M12.2:**
      `puntuacion_idea.rango_t2` y `ns_t2_sin_valor` no tenían el caso de rechazo probado, a diferencia de
      sus gemelos `_t1`. Corregido con `test_idea_rechaza_puntuacion_de_t2_fuera_de_0_8` y
      `test_ns_t2_y_valor_numerico_a_la_vez_se_rechazan` en `tests/test_m12_consenso.py`. El resto de lo
      que el grep marcaba como "sin probar" (`rango_dimension`, `escala_valida`, `rango_item`,
      `clave_valida`…) es de catálogos M11.2, fuera del alcance de esta ronda; `identidad.py::rol_valido`
      también es M11.2 y su vocabulario está explícitamente diferido a M11.3/Fase 4 (§5.72).
    - **Cierre de Parte A.** `pytest -q` → **434 passed, 0 skipped** (432 + 2). Ambos `--check` → exit 0.
      **51 tablas**, head `559b1a79cb77` sin cambios de modelo (el rebuild limpio explícito lo bloqueó el
      sandbox de la sesión; no hacía falta, no hubo deriva de modelos). Docs actualizados:
      `esquema-datos-v2.md`, `handoff.md` (cabecera + §6), `CLAUDE.md`, los dos `README.md`,
      `docs/estructura-repositorio.md` (conteos de tests desincronizados que `verificar_estado.py --check`
      encontró y que no eran de esta sesión). **M12 CERRADO**, única excepción registrada: **M12.8b-3b**
      (pase de vocabulario, diferido). Commit `19ab29b`, pusheado a `gitlab` y `origin` — checkpoint del
      prompt cumplido antes de abrir Parte B.
  - **CHECKPOINT.** Reportado a Lucas; confirmó seguir con Parte B en la misma sesión.
  - **PARTE B — I1: `idea.anio`.**
    - **Re-medido antes de confiar en R1 (Paso B1).** `idea` seguía en 23 columnas, 0 `anio`, 0 UNIQUE
      sobre `hce_id`, 1 FK entrante, 9 construcciones `Idea(` exactas en `tests/*.py` — coincide con lo
      que traía el prompt.
    - **Nullabilidad, resuelta explícitamente.** Los tres `*_anio` existentes del esquema (`grupo`,
      `protocolo`, `informe_cierre`) son **todos NOT NULL** — patrón de la casa unánime. El costo de
      seguirlo era agregar `anio=` a las 9 construcciones `Idea(` de test (ninguna del seed: no hay filas
      de `idea` sembradas). **Decisión: NOT NULL** — es la forma que realmente describe «una vez al año,
      siempre», y con `UNIQUE(hce_id, anio)` puesto, nullable habría dejado sin proteger justamente las
      filas cargadas sin año (Postgres no iguala dos `NULL`).
    - **Columna y UNIQUE (Paso B1).** `anio: SmallInteger` — mismo tipo que `grupo.anio` (medido, no
      inventado; `protocolo`/`informe_cierre` usan `Integer` liso, pero el prompt pedía seguir a `grupo`).
      `UniqueConstraint("hce_id", "anio", name="uq_idea_hce_anio")` — mismo patrón de nombre que
      `uq_informe_cierre_hce_anio`.
    - **Lo que I1 no tocó (Paso B2), verificado que sigue así.** La regla «la vigente es la de mayor
      `fecha_consenso`» (`app/models/modulos.py`, docstring de `Idea`) — el marcador de M12.8b-2 se
      actualizó sólo para decir que la columna ya existe, sin reformular la regla. La demo, sin tocar.
      `app/services/` sigue sin abrirse; ningún router nuevo.
    - **La regla del Δ (Paso B3, R1-01).** `esquema-datos-v2.md` línea **723** (no 788, verificado) seguía
      con «Δ sólo B−A, jamás entre instrumentos»; el propio documento ya usaba la redacción nueva en la
      línea **790**. Corregida la fila completa (nombre + descripción) a «Δ sólo dentro del mismo
      instrumento» (§5.36), sin restructurar la tabla. `backend/README.md:131` también corregido.
    - **Tests y migración (Paso B4).** Agregado `test_idea_rechaza_dos_del_mismo_anio`; los 9 sitios
      `Idea(` existentes recibieron `anio=` (dos de ellos con `anio` distinto entre sí a propósito, para
      no confundir el CHECK que prueban con el UNIQUE nuevo). Migración regenerada: `DROP SCHEMA public
      CASCADE` vía `docker compose exec db psql` (el sandbox había bloqueado el engine de SQLAlchemy
      directo y `alembic downgrade base` en Parte A; esta vía sí pasó), se borró
      `alembic/versions/559b1a79cb77_esquema_v2_inicial_m12_8a.py` y se generó
      `b99294aec85c_esquema_v2_inicial_i1.py` con `alembic revision --autogenerate`: detectó exactamente
      las 51 tablas esperadas, ninguna diferencia de más. `alembic upgrade head` + `python -m
      app.seed_catalogos` sin errores. `test_la_migracion_coincide_con_los_modelos` en verde.
    - **Cierre de Parte B.** `pytest -q` → **435 passed, 0 skipped** (434 + 1). Ambos `--check` → exit 0.
      **51 tablas**, head `b99294aec85c`, un solo archivo en `versions/`. Docs actualizados:
      `esquema-datos-v2.md` (cabecera + fila de `idea` en §2 + fila del Δ en §4), `handoff.md` (cabecera +
      §6, cerrando la entrada de I1 bajo «DECIDIDO, SIN IMPLEMENTAR» — **esa sección queda vacía**),
      `CLAUDE.md`, los dos `README.md`, `docs/estructura-repositorio.md`.
  - **Verificación de cierre final, medida (regla 4).** `pytest -q` → **435 passed, 0 skipped**.
    `verificar_estado.py --check` y `generar_catalogos_backend.py --check` → **exit 0**. **51 tablas**,
    head `b99294aec85c`, un solo archivo en `versions/`. Archivos tocados en total: modelos
    (`app/models/modulos.py`), generador de catálogos (`herramientas/generar_catalogos_backend.py`),
    catálogos generados (`app/data/catalogos_iniciales.json`), 4 archivos de tests, la migración, y los
    documentos de estado (`handoff.md`, `CLAUDE.md`, ambos `README.md`, `esquema-datos-v2.md`,
    `docs/estructura-repositorio.md`, `docs/bitacora.md` — esta entrada,
    `docs/prompts/Session M12.8-cierre+I1.md` guardado verbatim).
  - **Observación para quien lea esto después.** El Paso A1 de esta sesión existe porque una sesión
    anterior concluyó de `generar_catalogos_backend.py --check` devolviendo "al día" que M12.8 no
    necesitaba trabajo de catálogos — una verificación real (el JSON coincide con lo que el generador
    produce hoy) sobregeneralizada a una afirmación que no prueba (que `DESDE_LA_DEMO` esté vacía). Mismo
    patrón que el bullet que M12.8b-3a-bis corrigió en §6: una inferencia razonable, verificada de menos.
  - **Commits (con trailer, §5.62):** `19ab29b` (Parte A: cierre de M12.8/M12) y el commit de cierre de
    esta sesión (Parte B + bitácora + cabecera). A `gitlab` y `origin`, mismo hash, árbol limpio.

- **2026-09-11 · Sesión M12.8b-3a-bis — tres decisiones que se habían quedado en el chat** (Lucas +
  Claude, rama `main`). **No toca código en absoluto.** Existe porque tres decisiones que Lucas tomó en
  la misma ronda que produjo §5.86–§5.88 nunca llegaron al repo — el prompt de M12.8b-3a se escribió
  antes de que existieran. **Es el patrón de §5.83 (una redacción/decisión sobrevive fuera del registro)
  aplicado al propio método de trabajo de la sesión**, no al contenido de un documento: vale la pena
  nombrarlo así, en vez de tratarlo como tres entradas sueltas.
  - **Punto de partida, medido.** Árbol limpio en `8f3a8aa` salvo el prompt de sesión sin trackear; los
    dos remotos (`gitlab`, `origin`) en `8f3a8aa`. Docker ya arriba, `ippu-postgres` healthy. `pytest -q`
    → **432 passed, 0 skipped** (30 s). `verificar_estado.py --check` y `generar_catalogos_backend.py
    --check` → **exit 0**. Head de Alembic `559b1a79cb77`, un solo archivo en `versions/`. **51 tablas**.
    Última entrada de §5: **§5.88**.
  - **Paso 1 — tres entradas de §5, transcritas.** Números medidos: **§5.89, §5.90, §5.91**. **§5.89** —
    `btree_gist` **no entra**: el invariante «≤2 asignaciones vigentes» de `tecnico_grupo` queda
    **indefinido** hasta que B5/B6 se respondan, porque el mecanismo propuesto (un `EXCLUDE` pairwise) no
    puede expresar «a lo sumo 2» tal como está redactado — reemplaza el planteo de §5.79 hacia adelante,
    sin corregirlo (es un registro). **§5.90** — la administración (crear/renombrar grupos, catálogos,
    usuarios; §2.8/§2.9/§2.11) es su **propio sub-módulo**, construido **después** del núcleo de M11.3 —
    reemplaza la etiqueta «AHORA BLOQUEA» que R0 le había puesto a §2.8 (R0 no se corrige). **§5.91** — I1
    (`idea.anio`) aterriza **antes** de abrir `app/services/`, arrastrando consigo la corrección de la
    regla del Δ (ya prerrequisito nombrado de I1 vía R1-01); la mitad de demo y la reformulación de «cuál
    IDEA rige» quedan explícitamente **fuera** de I1.
  - **Verificación propia, no heredada de R1/el prompt.** Antes de escribir §5.91 se corrió el conteo
    real: `idea` tiene **23 columnas**, **0** `UNIQUE` sobre `hce_id`, **1** FK entrante (`puntuacion_idea`),
    y **9** construcciones `Idea(` exactas en `tests/*.py` (grep con borde de palabra, no substring — la
    cifra del prompt/R1 coincidió). Antes de tocar el bullet de §6 se corrió `SELECT nombre, anio FROM
    grupo`: los cinco nombres reales, los cinco con `anio=2026`.
  - **Paso 2 — el bullet de §6 sobre crear grupos, corregido, no sólo re-leído.** Estaba mal en tres
    puntos: la etiqueta «BLOQUEANTE» (superada por §5.90), la afirmación de que corregir los nombres «es
    exactamente la operación que no se puede hacer» (cierto de la base en su momento, resuelto por
    M12.8a-1/§5.61, verificado ahora contra la base) y la nota de que `taller.grupos_orientados` todavía
    tenía que cambiar de dominio (ya corregido por M12.8b-2, `esquema-datos-v2.md:577`, sin CHECK). Se
    partió en dos bullets: uno **`[x]`** con lo resuelto —preservando el único hecho que este bullet
    registraba y que sigue siendo cierto, que el seed es *insert-only* sobre `grupo`— y uno **`[ ]`** con
    lo que de verdad queda, apuntando a §5.90. **Observación de por qué duró tanto:** la frase «es la
    operación que no se puede hacer» era cierta de **la base** y se sobregeneralizó a todo — lectura
    plausible de por qué tres barridos seguidos saltearon `demo/`, donde los nombres están hardcodeados y
    sí son editables.
  - **Paso 3 — el hallazgo de la demo, registrado con dueño.** `demo/js/grupos-usuario.js:14-16`
    (verificado línea a línea) afirma en presente los cuatro colores derogados por §5.61 — la **única
    ocurrencia sobreviviente que IPPU puede ver**, no un comentario interno. M12.8b-3a la había encontrado
    en el barrido retroactivo y la había reportado sin registrarla; esta sesión la suma como **cuarto
    punto** al bullet «Tres puntos donde la capa de presentación se desincronizó», con **Lucas** como
    dueño y explícitamente **sin corregir**: esos nombres pueden ser claves de búsqueda, no sólo etiquetas
    de pantalla, y cambiarlos sin verificación visual en navegador arriesga romper la vista.
  - **Verificación de cierre, medida (regla 4).** `pytest -q` → **432 passed, 0 skipped**.
    `verificar_estado.py --check` y `generar_catalogos_backend.py --check` → **exit 0**. **51 tablas**,
    head `559b1a79cb77` — **idéntico al arranque; esta sesión no tocó código**. Archivos tocados:
    `handoff.md` (§5.89–§5.91, §6, cabecera), `docs/bitacora.md` (esta entrada),
    `docs/prompts/Session M12.8b-3a-bis.md` (guardado verbatim).
  - **Commits (con trailer, §5.62):** ver el commit inmediatamente anterior a este en `git log` para el de
    §5/§6 de esta sesión, y el de cierre (cabecera + bitácora + prompt). A `gitlab` y `origin`, mismo
    hash, árbol limpio.

- **2026-09-11 · Sesión M12.8b-3a — tres decisiones de Lucas, R1-01 registrado, el invariante de
  `tecnico_grupo` puesto en duda, la cola de §6 archivada** (Lucas + Claude, rama `main`). **No toca
  `app/services/`, no implementa I1, no regenera el seed de catálogos; sólo docstrings/comentarios de
  `app/` (Paso 3) y documentación.** Alcance recortado a propósito respecto del M12.8b-3 original: el
  pase de vocabulario (§5.75/§5.76) se difiere a **M12.8b-3b**, porque cinco sesiones seguidas no habían
  tocado código y es el único pendiente que no desbloquea nada.
  - **Punto de partida, medido.** Árbol limpio en `12cee57` salvo el prompt de sesión sin trackear; los
    dos remotos (`gitlab`, `origin`) en `12cee57`. Docker Desktop no estaba arriba — se levantó y el
    contenedor `ippu-postgres` quedó healthy. `pytest -q` → **432 passed, 0 skipped** (32 s).
    `verificar_estado.py --check` y `generar_catalogos_backend.py --check` → **exit 0** (el segundo ya
    decía «al día» antes de tocar nada). Head de Alembic `559b1a79cb77`, **un solo archivo** en
    `versions/`. **51 tablas** en `Base.metadata`. `consulta-a-ippu.md` presente.
  - **Paso 1 — tres entradas de §5, transcritas (Lucas decidió, la sesión transcribe).** Números libres
    medidos: **§5.86, §5.87, §5.88**. **§5.86** — el motor de flujo arranca con **409 duro** por default
    (responde la pregunta 3 del BLOQUE 6.4 de R1); no cierra B4 con IPPU. **§5.87** — `tecnico_grupo` se
    parte: la tabla N:M es M11.3 (estructural, sin discusión), el servicio de asignación y sus reglas
    esperan a B5/B6 (pregunta 4); el invariante «≤2 vigentes» queda explícitamente **no decidido ni
    construido** acá. **§5.88** — el registro de accesos con motivo (§2.17) es explícitamente **Fase 4**
    (pregunta 7), dueño **Lucas**, para que no se evapore. Las preguntas 1, 2, 5 y 6 del mismo bloque
    **no** se decidieron.
  - **Paso 2(a) — R1-01 registrado donde no se pierde.** Verificado, no copiado de R1: la redacción
    derogada «Δ sólo B−A» vive en `esquema-datos-v2.md:723` (R1 decía `:723`, correcto) y la redacción
    nueva «mismo instrumento» en `esquema-datos-v2.md:790` (R1 y el prompt de sesión decían `:788` —
    **desactualizado en 2 líneas**, corregido acá). `backend/README.md:131` también con la vieja. Se
    registra en §6 (bullet I1) como **prerrequisito nombrado de I1**; no se corrige (Lucas decidió que
    viaja con I1).
  - **Paso 2(b) — el invariante de `tecnico_grupo` puesto en duda, medido, NO decidido.** §5.79 afirma
    que «≤2 asignaciones vigentes, sin solape» necesita un `EXCLUDE` con `btree_gist`. Cierto pero
    **incompleto y nunca verificado**: un `EXCLUDE` es **pairwise** — `EXCLUDE (grupo_id WITH =, periodo
    WITH &&)` expresa «a lo sumo UNA vigente», no dos; no hay formulación de `EXCLUDE` que exprese «a lo
    sumo DOS» directamente (un discriminador de slot sí daría exactamente dos, pero el esbozo de §5.79
    tiene `rol text, SIN CHECK` — verificado, tres roles distintos lo violarían igual). Verificado contra
    el modelo: `grupo.tecnico1_id`/`tecnico2_id` siguen existiendo (`identidad.py:131,133`) y son la
    fuente de verdad — el «a lo sumo 2» ya está garantizado ahí, estructuralmente; `tecnico_grupo` es la
    **historia**, no el invariante. Propagó sin verificar a §5.79, y a R1 BLOQUE 3.2 (línea 253), 6.1
    (430–431), 6.3 (471) y la pregunta 5 del 6.4 (496) — **el primer hallazgo de esta serie que es una
    afirmación técnica nunca verificada**, no una redacción derogada que sobrevivió (§5.83). Registrado en
    §6 como punto abierto para M11.3, sin corregir §5.79 ni R1 (son registros).
  - **Paso 2(c) — barrido retroactivo de §5.83, medido, no aplicado.** Comandos: `grep -rn "Δ sólo B"`,
    `grep -rn "Azul.*Celeste.*Naranja.*Verde\|cuatro grupos por color"`, `grep -rn
    "tecnico_grupo.*M12.8a\|M12.8a.*tecnico_grupo"` (repo completo, sin `node_modules`/`graphify-out`).
    **§5.36:** sin sobrevivientes nuevos, coincide con R1-01. **§5.61:** ⚠️ **una ocurrencia LIVE no
    detectada antes** — `demo/js/grupos-usuario.js:14-16` afirma en presente que los grupos reales son
    por color, contradiciendo §5.61. **§5.79:** sin sobrevivientes — las apariciones en `handoff.md` son
    registro histórico correcto (§5.72 tal como decía antes de derogarse) o la propia derogación citándola.
    Registrado en §6 como pendiente costado (3 líneas de `demo/js/`, fuera de alcance de esta sesión).
  - **Paso 3 — fixes de docstring/comentario, DENTRO del límite duro (sólo texto, ni una columna).**
    **R1-04** — `app/models/modulos.py:211`: la primera línea del docstring de `Idea` decía «línea base
    única», contradiciendo el aviso de I1 dos líneas abajo; reescrita para decir que el IDEA **es anual**
    por decisión y que el modelo de abajo todavía implementa línea base única. **R1-05** —
    `app/models/pai.py:146` y `:568`: los dos punteros a `puntos-a-validar.md` §2.15 como «tensión
    abierta» se corrigieron para citar la resolución (**§5.57**, salida 2 — declaración fechada, no copia
    sincronizada), dejando el residuo de construcción como puntero opcional a M11.3/M11.4. **R1-10** —
    `backend/README.md:131`: contaba sólo 4 reglas como si fueran todas; medido contra la tabla real de §4
    (`esquema-datos-v2.md`) → **44 filas** (incluye las dos de guards de PAI que sumó M12.8b-1b). Se
    corrigió el conteo y se dejó la fila del Δ **sin tocar su redacción**, con puntero a R1-01. `pytest`
    idéntico después (432 passed).
  - **Paso 4 — archivada la cola resuelta de §6.** Extracción programática (no manual): cada bullet con
    checkbox —a cualquier indentación, dentro y fuera de blockquote— es una unidad; su extensión va de su
    línea de inicio a la línea anterior al próximo bullet **o encabezado de subsección** (cinco
    encabezados identificados y protegidos para que no se absorbieran en el bullet anterior, que era el
    bug de la primera pasada del script). Resultado: **81 bullets totales, 42 `[x]` (199 líneas) → movidos
    verbatim a `docs/pendientes-resueltos.md`**, **39 `[ ]` quedan en §6**. Verificado con **sha256** del
    contenido movido, idéntico entre lo extraído y lo escrito en el archivo nuevo. Verificado además que
    §7 en adelante de `handoff.md` quedó **byte-idéntico** a `12cee57`, y que el prefijo de §5 (antes del
    Paso 1) también. §6 queda con un stub que nombra el archivo, la fecha y la condición verificada en
    M12.8b-1b (ningún archivo cita un bullet resuelto por posición). Antes: §6 = 477 líneas / 81 bullets.
    Después: §6 = 286 líneas / 39 bullets abiertos.
  - **Paso 5 — dos mediciones, sin acción.** (a) Grep de «Heroku» en el repo: **cero** afirmaciones lo
    presentan como destino asentado — todas dicen «dónde vive hoy, no el destino» (§5.44), incluida la
    única entrada de §5. (b) Lo que queda de M12: cierre de M12.8 (regenerar
    `app/data/catalogos_iniciales.json` — **ya sincronizado hoy**, `--check` en verde antes de tocar nada
    — + tests + docs) y el pase de vocabulario, ahora **M12.8b-3b**, diferido.
  - **Verificación de cierre, medida (regla 4).** `pytest -q` → **432 passed, 0 skipped**.
    `verificar_estado.py --check` y `generar_catalogos_backend.py --check` → **exit 0**. **51 tablas**,
    head `559b1a79cb77`, un solo archivo en `versions/` — **idéntico al arranque**. Archivos tocados:
    `handoff.md` (§5.86–§5.88, §6, cabecera), `docs/pendientes-resueltos.md` (**nuevo**),
    `implementacion/L1-hce-idea/backend/app/models/modulos.py`,
    `implementacion/L1-hce-idea/backend/app/models/pai.py`,
    `implementacion/L1-hce-idea/backend/README.md`, `docs/bitacora.md` (esta entrada),
    `docs/prompts/Session M12.8b-3a.md` (guardado verbatim, register desde que nace).
  - **Commits (con trailer, §5.62):** ver el commit inmediatamente anterior a este en `git log` para los
    tres de esta sesión (§5 · fixes de Paso 3 · archivo de §6) y el de cierre (cabecera + §6 + esta
    entrada + el prompt). A `gitlab` y `origin`, mismo hash, árbol limpio.

- **2026-09-10 · Sesión M12.8b-1b + R1 — la sección HCE-PAI del esquema, y el reconocimiento previo a
  M11.3** (Lucas + Claude, rama `main`). **Tres partes que no comparten más que la medición de arranque, y
  ninguna toca código.** PARTE A (M12.8b-1b): escribe un documento. PARTE B (R1): lee y produce un
  informe. PARTE C: mide el archivo de §6, sin mover nada. `pytest` y los dos `--check` **idénticos al
  inicio y al cierre**.
  - **Punto de partida, medido.** Árbol limpio en `bdca401` salvo el prompt de sesión sin trackear; los
    dos remotos (`gitlab`, `origin`) en `bdca401`. Docker arriba, Postgres sano (`ippu-postgres`, 17 h
    healthy). `pytest -q` → **432 passed, 0 skipped** (36 s). `verificar_estado.py --check` y
    `generar_catalogos_backend.py --check` → **exit 0**. Head de Alembic `559b1a79cb77`, **un solo
    archivo** en `versions/`. **51 tablas** en `Base.metadata` y **51** físicas en la base de dev.
    **274** funciones `def test_` (432 casos tras `parametrize`).
  - **PARTE A — M12.8b-1b · la sección HCE-PAI de `esquema-datos-v2.md`.** El documento tenía un marcador
    donde va HCE-PAI (M12.6, solo esquema, §5.54). Medidas **contra los modelos y la migración
    `559b1a79cb77`** (no heredadas): `pai` 43 · `pai_objetivo` 9 · `pai_evaluacion_previa` 7 · `pai_equipo`
    6 · `pai_coordinacion` 7 · `pai_taller` 3 · `pai_prestacion` 3 · `pai_circuito` 3 = **8 tablas / 81
    columnas** — coincide con el 8 / 81 que reportó M12.8b-1. **16 CHECK de dominio** (7 en `pai`, 9 en las
    hijas), **4 UNIQUE compuestos**, `pai` **sin `UNIQUE(hce_id, anio)`** (§5.22). `creado_en`/
    `actualizado_en` sólo en `pai` (1 de las 3 tablas del esquema que las llevan). Sin patrón XOR ni
    polimórfico. Todo dominio enum-like tiene CHECK generado con `_dominio()` — **no** hay dominios
    sólo-documentación.
    - **§2.2:** tabla de las 8 tablas con campos propios en orden del modelo, al estilo de HCE-INC/ateneos,
      con las decisiones §5.14, §5.20–§5.23, §5.26, §5.54–§5.57, §5.59 y tres recuadros: **NO GUARDS**
      (§5.54 · M11.3, Lucas §5.67); **§4 y §8 del Manual sin identificar** (`puntos-a-validar.md` §1.16 /
      B1); **`pai_prestacion` como excepción declarada a §5.22** (§5.57 / L4, salida 2).
    - **Nombre oficial.** Se agregó que el nombre INAU es **«Proyecto de Atención Integral»**, no
      «Propuesta de Atención Individual» del prototipo (§5.42 / I7, `puntos-a-validar.md` §1.11 CERRADO) —
      la tabla se llama `pai` igual; importa para el PDF de M11.4.
    - **§1 (ER):** `pai` + 7 hijas agregadas al diagrama; retirado el aviso «diagrama incompleto».
    - **§4:** dos filas de guards de PAI — §IX del PAI sólo con `tipo` «Actualización anual» (guard, M11.3)
      y **Anexo A** (M11.3, **bloqueado por fuera**: el Anexo A y el Manual §8 no están en el repo).
    - **Versionado (§5.81):** el documento sigue en **v3** y el archivo no se renombra; se amplió la fila
      v3 del registro de versiones y la cabecera. **Cobertura 43/51 → 51/51**; §3 y el registro de
      versiones al día. Grep de «HCE-PAI pendiente/placeholder»: corregidos todos menos
      `agenda-reunion-ippu-2026-08.md` (registro de una reunión pasada, no se toca).
  - **PARTE B — R1 · reconocimiento para M11.3** (`handoff.md` §5.67 / L14: primera tarea de M11.3).
    `docs/notas/relevamiento-M11.3-2026-09-10.md`, **solo lectura**, formato R0 (BLOQUES), hallazgos
    **R1-01…R1-10** citables desde §5/§6. Es un `relevamiento-*` → registro desde que nace, no se corrige
    (dicho en su cabecera). ⚠️ El nombre usa la fecha real de sesión (2026-09-10); la hoja proponía
    `-09-09`.
    - **Qué existe hoy:** la capa de servicios sigue **en cero** — `app/services/` no existe,
      `routers/__init__.py` y `schemas/__init__.py` = 0 bytes, único endpoint `/health` (`main.py:33`).
      Ninguna regla §4 vive en código: se reparten entre CHECK estructural, `hybrid_property` derivado y
      **prosa** (docstrings del modelo + la tabla §4 del esquema, con 8 filas «Pendiente — M11.3»).
    - **El bloque central de M11.3 es construible hoy** con el modelo que existe: secuencia,
      firma=bloqueo, validaciones §4.3, `categoria_baremo(pct)`, fotos §8.4 (individual y grupal),
      histórico inmutable, auditoría de campo, guard de consenso D7. **Lo bloqueado es periférico y
      agrupado:** Anexo A (**B1** / §1.16), «qué IDEA rige» (**B2b** + I1), usuarios + `tecnico_grupo`
      (**B5** + **B6**), informes + divulgación (**B7** + **B11** + **B12**).
    - **Hallazgos que necesitan a Lucas:** **R1-01** — la regla del Δ está a medio reformular:
      `esquema-datos-v2.md` §4 fila 4 y `backend/README.md:131` dicen todavía «Δ sólo B−A», que §5.36
      cambió a «Δ sólo dentro del mismo instrumento» para no bloquear la comparación IDEA-año que IPPU
      pidió; el mismo documento ya usa la nueva en §2.2 → se contradice. **NO se corrigió** (parte B es
      solo lectura; roza M12.8b-3). **R1-02** — «qué IDEA rige» vive sólo en prosa (`modulos.py:228-233`) y
      para el modelo de línea base única. **R1-07** — `puntos-a-validar.md` §2.8 (abrir año de grupos) **no
      bloquea** el arranque de M11.3 (su propia letra chica lo dice); es feature de M11.3/M11.4.
    - **I1 (`idea.anio`) re-medido:** backend **puramente aditivo** — `idea` tiene 23 columnas sin `anio`,
      **0** UNIQUE sobre `hce_id`, **1** FK entrante (`puntuacion_idea`, por instancia → 0 a reconectar),
      **9** construcciones `Idea(` en tests, **0** rotas con `anio` nullable; el patrón `UNIQUE(hce_id,
      anio)` ya está 3 veces. Demo: **17** accesos `(flujo|fl).lb` en 6 módulos (+1 indirecto en
      `ui-core.js`) — verifica el «~18 en 6» de §5.31/R0. **Recomendación (no decisión):** I1 **antes** de
      M11.3, porque el guard «qué IDEA rige» no es escribible sin la columna; el costo caro (selector de
      año en la demo) no es trabajo de M11.3.
    - **7 preguntas para Lucas** en el BLOQUE 6.4 del relevamiento (I1 antes o dentro de M11.3; corregir
      la fila 4 del §4 en M12.8b-3 o al arrancar M11.3; default del motor de flujo pendiente de B4;
      `tecnico_grupo` con B5/B6 sin responder; `btree_gist` sí/no; alcance del alta de grupo/catálogos;
      registro de accesos con motivo en M11.3 o Fase 4).
  - **PARTE C — el archivo de §6, medido sin mover nada.** Lucas aprobó archivar la cola resuelta de §6
    **a condición de que no cause rework**. Medido: §6 = **441 líneas**, **40 `[ ]` abiertos / 40 `[x]`
    resueltos**, el grupo resuelto ocupa **≈173 líneas ≈ 39 %** (coincide con «40/40 y ~40 %»). **Ningún
    archivo de fuera de §6 cita un bullet resuelto por su posición** — las citas a `§6` son punteros
    genéricos o apuntan a bullets **abiertos** (I1, A3/C8/C9/C10); la única que toca uno resuelto es
    `relevamiento-estado-2026-08-26.md:1260` (D-10 / F1-nav), y R0 es un registro congelado. `verificar_
    estado.py` **no lee §6** (corta en `## 5.`). **La técnica del stub cubre el caso y apenas hace falta.
    Rework de archivar la cola: cero.** Registrado en §6, bullet «Partir `handoff.md`». **RECOMENDACIÓN:
    ninguna** — si es una sesión o tres lo decide Lucas.
  - **Verificación de cierre, medida (regla 4 — después de la última escritura).** `pytest -q` → **432
    passed, 0 skipped**. `verificar_estado.py --check` y `generar_catalogos_backend.py --check` → **exit
    0**. **51 tablas**, head `559b1a79cb77`, un solo archivo en `versions/` — **todo idéntico al arranque;
    esta sesión no toca código.** Archivos tocados: `implementacion/L1-hce-idea/backend/docs/esquema-datos-v2.md`
    (§1, §2.2, §3, §4, cabecera, registro de versiones), `docs/notas/relevamiento-M11.3-2026-09-10.md`
    (**nuevo**), `handoff.md` (cabecera §5.82, §6), `docs/bitacora.md` (esta entrada). **Cero archivos de
    código.** §5 **no se tocó** (esta sesión no abrió ninguna entrada — los hallazgos que piden decisión
    están en el relevamiento, para que los escriba Lucas).
  - **Commits (con trailer, §5.62):** `a93eea3` (PARTE A — sección HCE-PAI + ER + cabecera/versiones/§3),
    `99048f1` (PARTE B — el relevamiento R1), `474d93b` (PARTE A — filas de guards de PAI en §4), y el
    commit de cierre (cabecera de `handoff.md`, §6, esta entrada). A `gitlab` y `origin`, mismo hash,
    árbol limpio.

- **2026-09-09 · Sesión M12.8b-4 — higiene: la bitácora deja `handoff.md`** (Lucas + Claude, rama
  `main`). **Primera entrada nativa de este archivo.** `handoff.md` había llegado a 5.081 líneas y §13
  era el 39,6 % de un archivo que `CLAUDE.md` manda leer entero al arrancar. Esta sesión saca §13 a
  `docs/bitacora.md` **byte-idéntica**, escribe dos decisiones (§5.84 la mudanza, §5.85 F1-nav3 perdida),
  **mide** el costo de mover también §5, y aclara una ambigüedad de alcance. **No toca código.** No
  escribe la sección HCE-PAI del esquema (M12.8b-1b), no hace el pase de vocabulario (M12.8b-3), no toca
  la ubicación de §5, no arranca el reconocimiento de M11.3.
  - **Punto de partida, medido.** Árbol limpio en `fd7ab76`, los dos remotos (`gitlab`, `origin`) en el
    mismo hash. Docker arriba, Postgres sano. `pytest -q` → **432 passed, 0 skipped**.
    `verificar_estado.py --check` y `generar_catalogos_backend.py --check` → **exit 0**. Head de Alembic
    `559b1a79cb77`, **un solo archivo** en `versions/`. **51 tablas** (`Base.metadata`). `handoff.md`:
    **5.081 líneas · 79.153 palabras (`wc -w`) · 537.389 bytes**; §13 = de la línea `## 13.` a EOF =
    **2.014 líneas / 266.246 bytes**.
  - **§5.84 y §5.85 — transcritas (decisión de Lucas, acuerdo del equipo), escritas antes de mover nada**
    (§12.6). Número libre medido: la última entrada era §5.83.
    - **§5.84** — §13 se muda a `docs/bitacora.md`, completa y sin modificar. Cinco cláusulas: (i) se
      conserva el encabezado `## 13.` acá y en el archivo nuevo, para que las ~100 citas «§13» sigan
      resolviendo; (ii) `handoff.md` = estado + decisiones + pendientes, `docs/bitacora.md` = el
      registro; (iii) §5.82 sigue: quien escribe bitácora actualiza la cabecera; (iv) la regla 3 viaja
      con el archivo (nunca se corrige); (v) **no decide nada sobre §5**, sólo se mide.
    - **§5.85** — la deuda de registro de F1-nav3 (`648cb04`, rama borrada) se declara **PERDIDA** y su
      pendiente se cierra **por declaración** (misma forma que §5.53): no se reconstruye por inferencia
      (§5.83); el registro que queda es el commit y el bullet de §6.
  - **La mudanza, verificada byte-idéntica (Paso 2).** (a) Se extrajo el bloque §13 (`## 13.` → EOF) a un
    scratch fuera del repo: **2.014 líneas / 266.246 bytes**, sha256
    `b0f98e1d3454c027087cb080bf3a1119ee742c59a6d3f5f5cc68de4f8ed6ac89`; `head + bloque == handoff.md`
    original (`cmp` idéntico). (b) `docs/bitacora.md` = encabezado nuevo (20 líneas: qué es, que no se
    corrige, que se mudó por §5.84, entradas newest-first) + el bloque **verbatim** → verificado `cmp`
    byte-idéntico contra el §13 del último commit (`fd7ab76:handoff.md`), mismo sha256 `b0f98e1d…`. (c) En
    `handoff.md`, el bloque se reemplazó por un **stub de 6 líneas** (mismo `## 13.`, dice que el registro
    vive en `docs/bitacora.md`, que las citas «§13» resuelven acá). (d) Al **prepender la entrada nativa**
    de esta sesión encima del bloque, la edición **se comió la primera línea del encabezado de la entrada
    M12.8b-2b**; lo detectó el re-chequeo (`grep` de encabezados de entrada), se **restauró textual** desde
    `fd7ab76:handoff.md` y se **re-verificó**: el tramo «entrada M12.8b-2b → EOF» quedó **`cmp`
    byte-idéntico**, 2.012 líneas / 266.216 bytes, sha256
    `3e25b66172b720a3be6e903c5868e99ad5f8ab4c4e7b29c8b68d714953b2fb1f` en las dos copias. El registro se
    movió sin tocar un byte. (e) `handoff.md`: **5.081 → 3.139 líneas (−38 %) · 537 KB → 278 KB (−48 %)**
    (incluye §5.84/§5.85, el stub, y las notas de §6 de esta sesión).
  - **`verificar_estado.py` — antes y después (regla 4).** Lee `handoff.md` **por ruta**
    (`herramientas/verificar_estado.py:59`) y **corta en el encabezado `## 5.`**
    (`FIN_DE_LO_VIGENTE`, `:90`; `SOLO_CABECERA`, `:91`): sólo escanea cabecera + §0–§4, nunca llega a
    §13. `--check` → **exit 0 antes y después** de la mudanza. **Es el único lector programático de
    `handoff.md`**: nada más en `app/`, `tests/` ni `herramientas/` lo abre (el resto son citas
    `§5.NN` en comentarios).
  - **Documentos que describen dónde vive la bitácora (Paso 3).** `CLAUDE.md`: «Arranque §4» y el
    recordatorio del final ya no mandan la bitácora a `handoff.md §13` → a `docs/bitacora.md` (§5.84), con
    §5.82 para la cabecera; `docs/bitacora.md` agregado al mapa del repo. `docs/estructura-repositorio.md`:
    fila `handoff.md` («decisiones §5, pendientes §6», bitácora mudada) + fila nueva `docs/bitacora.md` +
    la mención de `docs/planes/` corregida. `PLAN-M12` §M12.8 «Docs:» ahora nombra `docs/bitacora.md`.
    `README.md`: **ya estaba bien** — describe `handoff.md` como «estado + decisiones + flujo» y nunca
    mandó a leer §13. **Instrucciones vs citas:** se corrigieron las **instrucciones** (§12.4/§12.5 de
    `handoff.md`, `PLAN-M12`); las **citas** («ver §13», «handoff.md §13 del 2026-08-15» en
    `demo/js/ateneos.js`, etc.) se dejan — el stub las hace resolver. **`docs/prompts/` no se tocó.**
  - **Precio de mover también §5 (Paso 4 — medición, sin decidir).** En §6, pendiente «Partir
    `handoff.md`». `handoff.md` sin §13 son **3.139 líneas**, de las que **§5 = 2.411 (77 %)**, §6 = 441
    (14 %), estado (§0–§4, §7–§12) + stub = 281 (9 %) — sacar §5 dejaría el archivo en **~700 líneas**.
    Citas que **nombran el archivo** pegadas a `§5.NN` (`handoff.md` + hasta 4 separadores + `§5.NN`):
    **181** fuera de `docs/prompts/` (+6 dentro, históricas); mayores: `puntos-a-validar.md` 29 ·
    `preguntas-ippu.md` 21 · `esquema-datos-v2.md` 13 · `estructura-repositorio.md` 13 · `PLAN-M12` 11 ·
    `consulta-a-ippu.md` 10 · `CLAUDE.md` 10 · `README.md` 6; en `app/`+`tests/` ≈ **29**. Total `§5.NN`
    en el repo: **1.886**; las otras **~1.705 (90 %)** son la forma escueta «§5.NN» sin ruta, que no se
    rompe vivan donde vivan las decisiones. Con la **misma técnica del stub**, incluso las 181 resuelven;
    el costo mecánico baja a **un stub + una línea** en `verificar_estado.py:90` (`^##\s*5\.\s` →
    `^##\s*6\.\s`). Lo no-mecánico: §5 es append-only y lo consultan las sesiones para §12.6 — decisión
    de Lucas.
  - **Ambigüedad de alcance resuelta (Paso 5).** «seed espejo» aparecía con dos sentidos. Leído
    `PLAN-M12` §M12.8 («Seed:», líneas 576–586), §7 y §M12.8 «Criterio de aceptación» (líneas 595–598,
    709–713), y `esquema-datos-v2.md:693`: **son dos artefactos distintos y el plan lo resuelve.** El
    **seed de M12.8** = regenerar `app/data/catalogos_iniciales.json` desde
    `docs/prototipo-v4/prototipo-v4-catalogos.json` con `herramientas/generar_catalogos_backend.py`
    (vaciar `DESDE_LA_DEMO`), respetando `solo_al_crear` — **datos de catálogo**. El **seed espejo de
    M11.5** = seed **clínico**: NNA + evaluaciones IDEA/PA/PB que reproducen los arquetipos de la demo
    (8 NNA, §11; 58 · 60 · 79 · Δ +19), la **forma ejecutable del criterio §12-A** (§5.65), y **no
    existe**. La cabecera de `handoff.md` y `CLAUDE.md` decían «el resto de M12.8 (seed espejo, tests)»
    — palabra de M11.5 usada de más; corregido en la cabecera y anotado en §6 para que la próxima sesión
    no haga el seed clínico creyendo que cierra M12.
  - **§6: open vs resuelto (Paso 6 — medición, sin archivar nada).** §6 = **441 líneas**. Medido en el
    Paso 6, antes de cerrar «Cuatro inconsistencias» en el Paso 7: **41 bullets `[ ]` abiertos**
    (≈255 líneas) · **39 bullets `[x]` resueltos** (≈174 líneas, todos con `~~tachado~~`). Al cierre de
    la sesión, con esa bullet cerrada: **40 / 40**. La cola de resueltos es casi la mitad de los bullets
    y ~40 % de las líneas de §6 — es la próxima pregunta de higiene después de §13 y **merece su propia
    decisión**; esta sesión no archiva nada.
  - **§6 cerrado esta sesión.** F1-nav3 → declarada perdida (§5.85), y con eso **las cuatro
    inconsistencias del 2026-08-19 quedan cerradas** (1 y 2 en M12.8b-2, 3 en M12.8b-2b, 4 acá).
    «Partir `handoff.md`»: mitad hecha (§13) + mitad medida (§5). M12.8b-1b y M12.8b-3 siguen como
    pendientes con nombre y **sin dueño**; **M12.8b como conjunto NO se marca hecho**.
  - **Verificación de cierre, medida.** `pytest -q` → **432 passed, 0 skipped** (idéntico al inicio;
    esta sesión no toca código). `verificar_estado.py --check` y `generar_catalogos_backend.py --check`
    → **exit 0**. Archivos tocados: `handoff.md` (§5.84/§5.85, stub de §13, §6, cabecera, §12),
    `docs/bitacora.md` (**nuevo**), `CLAUDE.md`, `docs/estructura-repositorio.md`, `PLAN-M12`. **Cero
    archivos de código.**
  - **Commits (con trailer, §5.62):** `261e192` (`handoff.md` §5.84/§5.85), `a4e6942` (la
    mudanza de §13 + stub + `handoff.md` §6/cabecera/§12 + `CLAUDE.md` + `estructura-repositorio.md` +
    `PLAN-M12`), esta entrada (primera nativa de `docs/bitacora.md`). A `gitlab` y
    `origin`, mismo hash, árbol limpio.

- **2026-09-09 · Sesión M12.8b-2b — cierre de puntas sueltas de M12.8b-2: dos reglas de proceso en §5,
  cabecera y §6 al día, y medido el costo de partir este archivo** (Lucas + Claude, rama `main`).
  **Documentación + 1 comentario de `app/`** (`ateneo.py`, un solo `#:`: sin columnas, constraints,
  defaults, imports ni nombres). Cierra las cuatro puntas que M12.8b-2 dejó anotadas y sin arreglar más
  la medición que no tuvo dónde escribirse. **No** escribe la sección HCE-PAI del esquema (M12.8b-1b),
  **no** hace el pase de vocabulario §5.75/§5.76 (M12.8b-3) ni arranca el reconocimiento de M11.3. **Abre
  §5.82 y §5.83.**
  - **Punto de partida, medido.** Árbol limpio en `0214db8`, los dos remotos (`gitlab`, `origin`) en el
    mismo hash; los tres commits de M12.8b-2 (`705a59f`, `da5d78c`, `0214db8`) en los dos. Docker
    **estaba apagado** — se levantó (Docker Desktop + `docker compose up -d`), Postgres sano. `pytest -q`
    → **432 passed, 0 skipped**. `verificar_estado.py --check` y `generar_catalogos_backend.py --check` →
    **exit 0**. Head de Alembic `559b1a79cb77`, **un solo archivo** en `versions/`. **51 tablas**
    (`Base.metadata`).
  - **§5.82 y §5.83 — dos reglas de proceso, transcritas (decisión de Lucas, acuerdo del equipo).** Se
    escribieron **antes** de aplicar nada (§12.6). Número libre medido en el archivo: la última entrada
    era §5.81. **§5.82** — la cabecera de `handoff.md` la actualiza toda sesión que escribe una entrada
    de §13, incluidas las de sólo documentación (sustituye el precedente que M12.8b-1/M12.8b-2 siguieron).
    **§5.83** — los registros de sesión sobredeclaran lo que se barrió: tres instancias en una sola
    sesión (el barrido de color de M12.8a-1, el pendiente de M12.8b-2 que omitió §0.5, la lista de
    arrastre de §5.79 que omitió `preguntas-ippu.md` B5/B6); desde ahora un barrido registra **el comando
    y su resultado**, y una lista de arrastre se produce con `grep`. No reabre §5.34, la acota.
  - **Cabecera (§5.82 aplicada a esta sesión).** «Última actualización» reescrita: fecha 2026-09-09,
    sesión M12.8b-2b, cifras medidas (**51 tablas · 432 tests en verde, 0 salteados · head
    `559b1a79cb77`**), y corregido el «Queda M12.8b (docs: `esquema-datos-v2.md` → v3)» —eso ya lo hizo
    M12.8b-1 (§5.81)—: lo que queda es **M12.8b-1b** (sección HCE-PAI del esquema) y **M12.8b-3** (pase de
    vocabulario), más el resto de M12.8. «Foco actual»: lista de HECHOS extendida con
    M12.8b-1/M12.8b-2/M12.8b-2b y la misma corrección.
  - **§6 — rama `demo/F1-navegacion`, RE-MEDIDA (Paso 3).** **No existe** ni local ni en `gitlab` ni en
    `origin`; se **mergeó a `main` el 2026-08-20 22:34** por el merge `d94b102` (2 padres), presente en
    los tres; los `4f29bc9` · `230b4c0` · `554ff37` que la nota daba por «sin pushear» están **todos en
    `main`**; **0 commits que la rama tuviera y `main` no**. El bullet, titulado «⚠️ CON 4 COMMITS SIN
    PUSHEAR», se partió en dos: **(a) push y (d) merge/PR RESUELTOS** (tildado, con la medición) y **(b)
    verificación visual + (c) re-baseline del fingerprint → pasan a la ronda de demo**, preservando cada
    deuda que el bullet era el único en registrar (responsable sin HCE-LOG, §21.1, formato de Nº de HC,
    ateneos sin HCE-LOG/adjuntos, `.hint` sin clase global). **(c):** el *bloqueo de selector* del
    pendiente «El harness no corre de punta a punta» **ya lo arregló `c1ca4eb`** (2026-08-21: mapa
    `VISTAS` de 7 vistas, `usuarios` por `.userchip`, dos guardas con nombre; el commit reporta «42
    pasos, exit 0») — ese pendiente quedó anotado con la medición; lo que queda de (c) es correr el
    harness contra la demo post-F1 y fijar el escenario de la Parte C (§5.69). **La deuda de registro de
    F1-nav3 sigue abierta — de quien la hizo, no se escribe desde acá.** El bullet hermano «Ronda de
    alineación de la demo v4.1» se revisó: no afirma nada sobre la rama ni el re-baseline que la medición
    contradiga (su «Playwright no estaba instalado al momento del commit» es una frase histórica en
    pasado).
  - **§6 — «Cuatro inconsistencias», item (3) CERRADO (Paso 4).** Verificado dónde aterrizó cada
    pregunta. «tutor» → `preguntas-ippu.md` **B5** (vía `puntos-a-validar.md` §2.11, que absorbe §2.10; la
    nota de deduplicación de B5 lo nombra y unifica). Catálogo de centros educativos → `puntos-a-validar.md`
    **§2.9** (gestión del catálogo de centros junto con la de talleres → M11.3/M11.4) + **§5.52**
    (`inclusion.centro` es texto, no FK; el Prototipo v4 no tiene catálogo → nada normativo que sembrar) +
    `preguntas-ippu.md` **C3** (pedir la planilla del Área de Inclusión, de donde saldría). **Queda sólo
    (4)** (F1-nav3). `consulta-a-ippu.md` no se editó (snapshot).
  - **`estructura-repositorio.md` (Paso 5a) — verificado.** «307 en verde» **ya estaba corregido** a
    **432** por M12.8b-2 (línea 225, no 223); `test_m12_pai.py` y `test_m12_divulgacion.py` **ya estaban**
    en el árbol de `tests/`. **Faltaba `pai.py` en el árbol de `app/models/`** (`divulgacion.py` sí estaba
    — la omisión, la segunda del archivo, ahora tapada): se agregó entre `modulos.py` y `severidad.py`
    con su nota (HCE-PAI M12.6, sólo esquema, `PAI_AREAS/PREST/CIRCUITO` constantes, §5.54–§5.56). La
    aritmética del conteo de tablas (28 + 5 + 2 − 1 + 2 + 2 + 4 + 8 + 1 = 51) se verificó, no se tocó.
  - **`preguntas-ippu.md` (Paso 5b) — verificado, ya correcto.** **C11** (población ~120 vs 138) está en
    el bloque C. **B5** y **B6** dicen que `tecnico_grupo` se construye en **M11.3** (§5.79), no en
    M12.8a. El total del apéndice (**28**: A1–A5, B1–B12, C1–C11) coincide con el conteo de encabezados
    `^### ` (28 medidos) y con la tabla por fuente. Nada que arreglar.
  - **`preguntas-ippu.md` C9 (Paso 6).** Nota fechada 2026-09-09, en la voz del documento: IPPU compartió
    un **segundo artefacto en Netlify** (un «Catálogo de puertas», 96 entradas / 12 áreas); Lucas
    confirmó con Fernando Sierra que **lo generó con IA**; es de **L3**, **no de L1**, sin archivos
    fuente, fuera de alcance. Importa a C9 porque el Prototipo v4 —precedencia 1, por encima del
    Documento Técnico— vino del **mismo autor y la misma vía**, y §5.37 ya encontró relleno generado
    adentro. **No abre §5, no toca §5.10.**
  - **`ateneo.py` (Paso 7, comentario `#:` solamente).** El ejemplo «Grupo Celeste **de 2025**» del `#:`
    de `grupo_id` → «grupo **Escolares** de 2025» (§5.61). **Tercer y último pase sobre el barrido de
    color de M12.8a-1.** Grep de cierre de `app/` (`Azul|Celeste|Naranja|Verde`, «4 grupos», «grupos por
    color», «Grupo <Color>»): **cero**, salvo `identidad.py:103` — que es la docstring que M12.8b-2
    **corrigió a propósito** (registra que los colores eran datos de demo del Prototipo v4 leídos como
    fuente). El barrido queda cerrado.
  - **Costo de partir `handoff.md`, medido (Paso 8) — sin actuar, sin recomendar.** Al cierre, con esta
    entrada y el pendiente ya escritos: **~5.080 líneas** (la nota del pendiente decía «2.100+»). Reparto
    por sección: **§5 = 2.370 (46,7 %)**, **§13 = 2.013 (39,6 %)**, **§6 = 417 (8,2 %)**, **estado
    (§0–§4, §7–§12) = 264 (5,2 %)**. Referencias
    `§5.NN` en el repo: **~1.870 apariciones** — ~760 en el propio `handoff.md`, el resto reparte `docs/`
    ~550, `app/` ~150, `backend/docs/` ~120, `demo/` ~130, `tests/` ~75, `CLAUDE.md` 41, `README.md` 11.
    `§13`: **~100** (~50 en `handoff.md`, casi todo el resto en `docs/prompts/`). `§6` (forma «§6» sin
    dígito): **~165**, con ruido — «§6» es también la sección del Protocolo de acceso. Casi todas las
    citas son la forma escueta «§5.NN» sin ruta: **no se rompen como texto si §5 se muda, pero el puntero
    implícito (“está en handoff”) deja de valer en ~1.100 lugares.** **(d)** `verificar_estado.py` lee
    `handoff.md` **por ruta** (`herramientas/verificar_estado.py:59`) y **corta en el encabezado `## 5.`**
    (`FIN_DE_LO_VIGENTE`, `:90`; sólo escanea cabecera + §0–§4): mover §13 o §6 **no lo rompe** (ya los
    ignora); mover §5 obliga a **una línea** — actualizar ese regex al nuevo corte. El pendiente «Partir
    `handoff.md`» quedó actualizado con estos números. Los datos están para que Lucas decida si el split
    es una sesión o tres.
  - **Verificación de cierre, medida.** `pytest -q` → **432 passed, 0 skipped** (idéntico al inicio;
    `test_la_migracion_coincide_con_los_modelos` en verde). `verificar_estado.py --check` y
    `generar_catalogos_backend.py --check` → **exit 0** (ninguno mira prosa). Cuatro archivos tocados:
    `handoff.md`, `docs/estructura-repositorio.md`, `docs/notas/preguntas-ippu.md`, `app/models/ateneo.py`
    (un `#:`). **Ningún cambio de comportamiento.**
  - **Commits (con trailer, §5.62):** `5628a22` (`handoff.md` §5.82/§5.83 — las dos reglas escritas antes
    de aplicarlas), `d453291` (sincronización de documentación: `handoff.md` cabecera/§6/§13 ·
    `estructura-repositorio.md` · `preguntas-ippu.md`), `132c272` (`ateneo.py`, el `#:`), más esta
    corrección de bitácora. A `gitlab` y `origin`, mismo hash, árbol limpio.

- **2026-09-09 · Sesión M12.8b-2 — sincronización de prosa: corregir las afirmaciones falsas (sin pase de
  vocabulario)** (Lucas + Claude, rama `main`). **Documentación + 2 docstrings de `app/`** (sólo
  comentarios: sin columnas, constraints, defaults, imports ni nombres). Ejecuta la lista de
  contradicciones que M12.8b-1 dejó anotada para M12.8b-2, más las que la lista no incluía. **No** hace el
  pase de «fase» / numeración de líneas (§5.75/§5.76 → **M12.8b-3**, registrado en §6), **no** escribe la
  sección HCE-PAI del esquema (M12.8b-1b) ni arranca el reconocimiento de M11.3. **No abre entrada §5.**
  - **Punto de partida, medido.** Árbol limpio en `4b73726`, los dos remotos (`gitlab`, `origin`) en el
    mismo hash. Docker **estaba apagado** — se levantó (Docker Desktop + `docker compose up -d`), Postgres
    sano. `pytest -q` → **432 passed, 0 skipped**. `verificar_estado.py --check` y
    `generar_catalogos_backend.py --check` → **exit 0**. Head de Alembic `559b1a79cb77`, un solo archivo
    en `versions/`. **51 tablas** (`Base.metadata`). Catálogo: `taller` **14 filas**, `grupo` **5**
    (Inicial · Escolares · Preadolescentes · Adolescentes · Taller de Adolescentes).
  - **Rama `demo/F1-navegacion` — medición para la próxima sesión, sin actuar.** **No existe** ni local ni
    en `gitlab` ni en `origin`. **Está mergeada a `main`** (merge `d94b102`, «merge: integrar
    demo/F1-navegacion a main», 2026-08-20 22:34), y ese merge está en los tres (`main`, `gitlab/main`,
    `origin/main`). Commits que la rama tenga y `main` no: **0**. Sin pushear: n/a — la ref ya no existe.
    El registro de §13 del 2026-08-19 («4 commits locales») quedó viejo: la rama se mergeó al día
    siguiente y desde entonces se borró de este clone y de los dos remotos. **No hay nada que borrar.**
  - **`CLAUDE.md`** (Paso 1). (a) `:106` «389 passed» → **432 passed, 0 skipped** (medido; se contradecía
    con `:166`), con el rastro histórico «307 al cerrar M12.5, 389 al cerrar M12.6». (b) `:167`
    «`esquema-datos-v2.md` → v3» → «el **documento** pasa a v3, el nombre del archivo **no** cambia
    (§5.81)». (c) `:180` «Δ sólo B−A» → «**Δ sólo dentro del mismo instrumento**» (§5.36; tal cual estaba
    bloqueaba una comparación que IPPU pidió; la reformulación ya vivía en §6). (d) mismo bullet FALTA:
    **M11.3 lo toma Lucas** (§5.67), primera tarea = reconocimiento estilo R0 contra el código; **M11.5 es
    la forma ejecutable del criterio §12-A** (§5.65). ⚠️ Línea confirmada: «Δ sólo B−A» está en `:180`, no
    en `:184` (una lectura previa la había puesto mal).
  - **`handoff.md` §0, `estructura-repositorio.md`, `README.md`s** (Paso 2). §0 punto 5 «307 passed, 0
    skipped» → **432** — ⚠️ **este NO estaba en la lista de M12.8b-2 en §6**, y sin embargo lo dice el
    mismo archivo que en su cabecera declara 432. `estructura-repositorio.md:223` «307 en verde» → **432**;
    de paso se agregaron `test_m12_pai.py` y `test_m12_divulgacion.py`, que faltaban en la lista del árbol
    (`└──` estaba en `inclusion`). Aritmética del conteo de tablas (líneas ~177-185): **suma 51**,
    correcta —contempla el retiro de `hce_taller` (M12.3) y de la columna `hce_diurna.nivel_soporte`
    (M12.4)—, no se tocó. `README.md` y `backend/README.md`: grepeados, **ya estaban al día** (432 tests ·
    51 tablas · 14 talleres · `esquema-datos-v2.md` sin «→ v3») — los actualizó M12.8a-3.
  - **`handoff.md` §6 y §9/§1** (Paso 3). §6: bullet de usuarios/roles reescrito — `tecnico_grupo` **no**
    entra en M12.8a, se construye en M11.3 (§5.79 deroga la ubicación de §5.72, no la decisión). Bullet
    DIVULGACIÓN → **RESUELTO en M12.8a-3 (§5.80)** con strike-through (convención de I2/I7), dejando en pie
    guards/flujo/compuerta como M11.3/M11.4. Bullet «Cuatro inconsistencias del 2026-08-19»: nota fechada
    de que (1) y (2) se aplicaron; (3) y (4) siguen. §9 partido en viñetas y §1 corregido: **14 talleres**
    (§5.14; decía «18»), **5 grupos con nombre** (§5.61), y la **discrepancia de población** `30 + 108 =
    138 ≠ ~120` marcada en su lugar y ruteada a IPPU **sin reconciliar**. Bullet «Puntos a validar»
    remedido contra el archivo: **§1 = 17 subsecciones / 5 abiertas** (§1.5·§1.6·§1.15·§1.16·§1.17 —
    coincide con la tabla por fuente de `preguntas-ippu.md`), **§2 = 17 / 8** (el «abiertas» de §2 hace un
    juicio sobre §2.10/§2.12/§2.15), **§3 = 6 supuestos**. Al pendiente de `verificar_estado.py`
    chequeo-de-prosa se le agregó la **lección de M12.8b-1**: la ocurrencia de «línea base única» que casi
    se pasa por alto estaba **partida en dos líneas**, así que un grep por línea es ciego a las frases
    envueltas y el chequeo tiene que **normalizar los espacios en blanco** antes de buscar.
  - **`docs/notas/preguntas-ippu.md`** (Paso 4). **B5** y **B6** decían «la tabla de asignación es M12.8a»
    / «M12.8a la crea» → **se construye en M11.3** (§5.79); lo que la pregunta *pide* no cambió. ⚠️ **La
    lista «actualizaciones que arrastra» de §5.79 nombró `puntos-a-validar.md` §2.11 y §6 y se olvidó de
    este archivo** — segundo hallazgo del tipo «la lista de arrastre estaba incompleta» en la sesión.
    Nueva pregunta **C11** (población ~120 vs. 138) en el bloque C —no la cubría ninguna existente—; total
    de preguntas 27 → **28** (A1–A5, B1–B12, C1–C11), tabla por fuente y apéndice al día.
  - **`esquema-datos-v2.md`** (Paso 5). Fila `taller`: `grupos_orientados` «array de nombres de color» →
    «nombres de grupo en texto (§5.61), `ARRAY(String(60))` **sin CHECK** — dominio de documentación»
    (verificado contra `catalogos.py:368`: no hay CheckConstraint); se conservó la razón de §5.14 de por
    qué es nombre y no FK. Nota §4 de M12.7: `creado_en`/`actualizado_en` «1 de las 38 tablas» → **3 de
    las 51** (`hce_diurna` en `identidad.py:178`, `inclusion.py:361`, `pai.py:276`).
  - **Docstrings de `app/`** (Paso 6, sólo comentarios). `identidad.py` docstring de `Grupo`: los cuatro
    colores («Azul · Celeste · Naranja · Verde, dominio real de IPPU») → los **cinco nombres reales**
    (§5.37/§5.61), con los colores registrados como datos de demo del Prototipo v4 leídos como fuente y
    corregidos por la reunión; se conservó la historia en pasado de `A..E` y el fundamento D9; ejemplos
    «Azul 20XX» → «Escolares» (precedente de M12.8b-1). `modulos.py` docstring de `Idea`: **marca**
    añadida —no se reescribió la regla— de que §5.36 hizo el IDEA anual, que el modelo aún no tiene `anio`
    (I1, §6 «DECIDIDO, SIN IMPLEMENTAR»), y de que la regla «la vigente es la de mayor `fecha_consenso`»
    queda para reformular en M11.3.
  - ⚠️ **Hallazgo — un registro «lo hicimos» que no coincide con el código (primero de la serie).** La
    entrada §13 de **M12.8a-1** dice que barrió «cuatro comentarios de `app/` que decían «4 grupos por
    color» (`seed_catalogos.py`, `identidad.py`, `catalogos.py`, `ateneo.py`)». Medido hoy:
    `seed_catalogos.py` y `catalogos.py` **sin colores** (OK); pero en **`identidad.py` el barrido tocó el
    comentario de la columna (`:121`) y NO la docstring de la clase `Grupo` (`:86-117`)**, que seguía con
    los cuatro colores y la afirmación de que eran «el dominio real de IPPU»; y **`ateneo.py:220-225` sigue
    con «Grupo Celeste **de 2025**»** como ejemplo. §13 no se reescribe: el hallazgo queda acá. Esta
    sesión arregló la docstring de `Grupo`; **`ateneo.py:222` queda sin tocar** (fuera de los dos
    docstrings del Paso 6) — es un comentario `#:` de una línea, disponible para el próximo pase.
  - **Verificación de cierre, medida.** `pytest -q` → **432 passed, 0 skipped** (idéntico al inicio).
    `verificar_estado.py --check` y `generar_catalogos_backend.py --check` → **exit 0** (ninguno mira
    prosa; `verificar_estado.py` no cambió de estado). Sólo documentación y 2 docstrings: **ningún cambio
    de comportamiento**.
  - **Commits (con trailer, §5.62):** `705a59f` (docstrings de `Grupo` e `Idea`), `da5d78c`
    (sincronización de prosa: `CLAUDE.md` · `handoff.md` §0/§6/§9/§1 · `estructura-repositorio.md` ·
    `preguntas-ippu.md` · `esquema-datos-v2.md`), y esta entrada. A `gitlab` y `origin`, mismo hash,
    árbol limpio.

- **2026-09-03/04 · Sesión M12.8b-1 — `esquema-datos-v2.md` al día (pase acotado), DOCUMENTACIÓN
  solamente** (Lucas + Claude, rama `main`). **NO toca código:** los únicos archivos modificados son
  `backend/docs/esquema-datos-v2.md` y `handoff.md` (§5.81 nueva, §13, §6). `app/`, `alembic/`,
  `tests/`, `app/data/`, `herramientas/` y `demo/` (solo lectura en el Paso 3) **no se tocaron**.
  Continúa la sesión que había parado en su propio checkpoint (el split está aprobado): **HCE-PAI queda
  para M12.8b-1b**, este pase hace todo lo demás.
  - **Punto de partida, medido.** Árbol limpio en `60ecb63`, los dos remotos (`gitlab`, `origin`) en el
    mismo hash. Docker arriba. `pytest -q` → **432 passed, 0 skipped**. `verificar_estado.py --check` y
    `generar_catalogos_backend.py --check` → **exit 0**. Head de Alembic `559b1a79cb77`, un solo archivo
    en `versions/` (`down_revision = None`, 51 `op.create_table`). **51 tablas** (`Base.metadata`:
    ateneo 2 · catalogos 13 · divulgacion 1 · identidad 5 · inclusion 4 · modulos 6 · pai 8 · severidad
    2 · transversales 10). Próxima entrada libre de §5: `### 5.81`.
  - **§5.81 — el documento a v3, el archivo no.** El `.md` gana encabezado de versión + registro de
    cambios y pasa a **v3**; **`esquema-datos-v2.md` no se renombra** (el nombre es la arquitectura del
    backend v2, incluida la migración `559b1a79cb77_esquema_v2_inicial_m12_8a.py`). Aclara por nombre los
    tres lugares que instalaron el «→ v3» (cabecera de este archivo, `CLAUDE.md:167`,
    `esquema-datos-v2.md:3-8`). Costo de un renombrado, medido (`git grep`): **79 referencias en 24
    archivos**, 8 en `app/`+`tests/`. El pase mecánico de esas menciones a «versión del documento» en
    `CLAUDE.md` y la cabecera es **M12.8b-2**.
  - **Qué se editó en `esquema-datos-v2.md`** (todo documentación): cabecera reescrita al estado medido
    + sección «Registro de versiones» nueva · §3 con las tablas de M12.5/M12.6/M12.7/M12.8a · `grupo`
    con los **cinco nombres reales** (Inicial · Escolares · Preadolescentes · Adolescentes · Taller de
    Adolescentes, §5.61) y `nombre` descrito como `varchar(60)` **sin CHECK**; los ejemplos «Azul 20XX»
    de la nota pasaron a «Escolares», y se conservó la historia en pasado de `A..E` · `idea` descrito
    **como está en el modelo** (23 columnas, **sin `anio`**) + aviso explícito de **I1 / §5.36** (el
    IDEA es anual por decisión, el modelo aún no) en la fila de §2.2, en el ER de §1 y en el §3 ·
    `ateneo.observaciones` agregada (§5.66), fila anotada como **20 columnas** medidas · **`divulgacion`
    nueva**: fila en §2.3 (15 columnas, con su procedencia del Protocolo §6.2–6.7 tomada de §5.80),
    nota en prosa (el CHECK de pertenencia es `num_nonnulls(hce_id, ateneo_id) <= 1` **y no `= 1`**;
    `hce_id` CASCADE con su contra-argumentación; append-only por **postura**, sin trigger, sin seed;
    frontera con `registro_organismo`), 4 aristas en el ER de §1 y **4 filas en §4** (los dos CHECK
    cruzados diferidos a M11.3, el append-only, la coordinación con `registro_organismo`) · **`§2.6` NO
    construido**: esbozo de `tecnico_grupo` como punto de partida para M11.3 (§5.79), **fuera del
    inventario de §2** · **marcador de HCE-PAI** en §2.2 (subsección propia con las 8 tablas y sus
    columnas medidas — `pai` 43, `pai_objetivo` 9, `pai_evaluacion_previa` 7, `pai_equipo` 6,
    `pai_coordinacion` 7, `pai_taller` 3, `pai_prestacion` 3, `pai_circuito` 3 = **8 tablas / 81
    columnas**) y en §3, diciendo que el documento aún no las describe · el bloque «M11.5 — Criterio de
    aceptación §12-A» reescrito en prosa (§5.65): qué afirma con la ronda M12 en pie, qué preserva de
    §12-A, y **que hoy nada lo hace cumplir — es un enunciado de intención, no un chequeo** hasta M11.5.
  - **Corrección de una medición de la sesión anterior — registrada acá, sin entrada §5 (decisión de
    Lucas).** El informe del checkpoint de M12.8b-1 afirmó que los números `IDEA 58 · PA 60 · PB 79 · Δ
    +19` **no estaban** en `demo/js/`. **Es falso.** Están en `demo/js/flujo.js` (Arquetipo 1 — Martín,
    expediente 102, comentado «usuario demo 1 del prototipo», `flujo.js:418`): `flujo.lb.dim =
    [6,6,6,6,4,4,4,6,4,4,4,4]` → `lbTotales()` = **58/96**, escalas **18/14/14/12**; `flujo.pa.item` →
    `protTotales()` = **60/120**; `flujo.pb.item` → **79/120**; `flujo.pb.deltas.total = 19` y
    `calcularDelta(pa,pb)` = 79 − 60 = **Δ +19**. Consistentes, y coinciden con `handoff.md` §13 entrada
    demo M4 (2026-07-15). El grep previo miró `datos.js`/`evaluaciones.js` y **no** `flujo.js`. **La
    premisa de §5.65 era correcta y queda intacta.** La otra afirmación de §5.65 —que `app/` no tiene
    seed más allá de `seed_catalogos.py`— **se verificó y se sostiene** (`seed.py` era de v1, sin
    trackear desde M11.2; sólo queda un `.pyc` viejo). El bloque §12-A del documento ahora escribe los
    números **como medidos y coincidentes**.
  - **Dos apartamientos de la letra del prompt, declarados.** (1) El prompt pedía una segunda entrada §5
    («los números no están en `demo/js/`»); al medir se comprobó que la premisa era falsa y Lucas
    decidió **no abrir esa entrada** — la corrección va sólo acá. (2) Se marcó una segunda aparición de
    «línea base única» que el prompt no listaba: está en el bullet «Validación de la demo» de §6 del
    documento, **partida en dos líneas**, y por eso el grep de la sesión anterior no la había visto. Es
    un marcado de una frase, coherente con la instrucción del Paso 2(d) («no dejar “línea base única” en
    pie sin marcar»).
  - **Contradicciones encontradas en otros documentos vivos — NO corregidas, son de M12.8b-2** (con
    archivo y línea): `CLAUDE.md:106` «389 passed» vs `:166` «432» (y `:136` «240», `:145` «307» son
    hitos históricos en contexto) · `CLAUDE.md:167` «`esquema-datos-v2.md` → v3» — aclarado por §5.81,
    falta el pase mecánico · `CLAUDE.md:180` «Δ sólo B−A» — §5.36 lo reformuló a «Δ sólo dentro del
    mismo instrumento» · `docs/estructura-repositorio.md:223` «307 en verde» · `docs/notas/preguntas-ippu.md`
    **B5** (línea ~128) y **B6** (línea ~139) dicen «la tabla `tecnico_grupo` la crea M12.8a» — derogado
    por §5.79 · **§6 de este archivo:** el bullet de la reunión dice «§5.72 movió parte a M12.8a: entra
    estructural la tabla `tecnico_grupo`» (derogado por §5.79) y el bullet **DIVULGACIÓN** sigue en `[ ]`
    con «la tabla entra en el delta de esquema de M12.8a» (ya construida, §5.80) · **§9** «18 talleres»
    (son 14 desde M12.3 — ya anotado en §6) · **§6** declara conteos viejos de `puntos-a-validar.md`
    («9 para IPPU / 8 para el equipo / 6 supuestos»); **medido hoy: §1 tiene 17 subsecciones, §2 tiene
    17, §3 tiene 6** · `esquema-datos-v2.md:664` (nota §4 de M12.7, fuera del set de edición) «`creado_en`/
    `actualizado_en` en 1 de las 38 tablas» — **medido: 3 de 51** (`hce_diurna`, `inclusion`, `pai`) ·
    `esquema-datos-v2.md:490` (fila `taller`) «array de nombres de color» — §5.61 cambió el dominio de
    `grupos_orientados` a los cinco nombres reales · docstrings de código sin tocar (`app/` fuera de
    alcance): `models/identidad.py:~90-107` (docstring de `Grupo` dice «Azul · Celeste · Naranja ·
    Verde») y `models/modulos.py:~210` (docstring de `Idea` dice «línea base única»).
  - **Verificación de cierre, medida.** `pytest -q` → **432 passed, 0 skipped** (idéntico al punto de
    partida). `verificar_estado.py --check` y `generar_catalogos_backend.py --check` → **exit 0**
    (ninguno mira el documento del esquema). Único archivo del repo modificado además de `handoff.md`:
    `backend/docs/esquema-datos-v2.md` (~+215 / −27 líneas).
  - **Commits (con trailer, §5.62):** `a6fdaf1` (`esquema-datos-v2.md` v3 + `handoff.md` §5.81/§13/§6) +
    esta corrección de bitácora. A `gitlab` y `origin`, mismo hash, árbol limpio.

- **2026-09-03 · Sesión M12.8a-3 — `divulgacion` construida; `tecnico_grupo` diferida a M11.3**
  (Lucas + Claude, rama `main`). **Toca código:** `app/models/` (`divulgacion.py` nuevo + `__init__.py`),
  `app/core/constantes.py`, `tests/` (`test_m12_divulgacion.py` nuevo), `alembic/versions/` (migración
  regenerada). Cierra el delta de esquema de M12.8a: **no queda ninguna tabla nueva pendiente de la
  ronda**.
  - **La sesión de diseño M12.8a-2, registrada acá porque no dejó otro rastro.** Entre M12.8a-1 y esta
    sesión hubo una **instancia de diseño** que midió la forma de las dos tablas nuevas contra el código y
    **no escribió esquema, seed ni test** —igual que la «hoja de L8», no tiene commit ni entrada propia de
    §13—. Su informe es **la fuente de §5.79 y §5.80**: la forma esbozada de `tecnico_grupo`, la lista de
    columnas de `divulgacion`, y las dos observaciones que esta sesión ejecutó (agregar `documento_id`,
    dejar afuera los dos CHECK cruzados). Se deja anotada acá como se hizo con L8.
  - **Confirmado por Lucas antes de la corrida:** **D-A** `tecnico_grupo` se difiere a M11.3 (deroga la
    *ubicación* de §5.72, no la decisión); **D-B** `divulgacion.hce_id` es `ON DELETE CASCADE`, con la
    contra-argumentación registrada en §5.80.
  - **Punto de partida, medido.** Árbol limpio en `e489a79`, los dos remotos (`gitlab`, `origin`) en el
    mismo hash. Docker arriba. `pytest -q` → **390 passed, 0 skipped**. `verificar_estado.py --check` y
    `generar_catalogos_backend.py --check` → **exit 0**. Head de Alembic `0a2d67a35971`, un solo archivo
    en `versions/`. **50 tablas.** Próxima entrada libre de §5: `### 5.79`.
  - **§5.79 — `tecnico_grupo` a M11.3.** Deroga por nombre la ubicación «estructural en M12.8a» de §5.72.
    Motivos (medidos en M12.8a-2): sin consumidor hasta el servicio de asignación (M11.3);
    `grupo.tecnico1_id`/`tecnico2_id` (+ `_rol`, que ya existen) siguen siendo la fuente de verdad y nada
    lee una historia hoy; su forma depende de **B5** y **B6** de `preguntas-ippu.md`, sin responder; su
    único invariante real («≤2 asignaciones vigentes por grupo, sin solape») necesita una `EXCLUDE`
    constraint con `btree_gist` —**la primera extensión del repo**—, decisión de M11.3, y §5.2.2 cierra la
    vía de los triggers. **Sin datos de producción**, construirla luego cuesta un archivo de migración
    incremental. Se registra la forma esbozada como **punto de partida para M11.3**, no como algo hecho.
    Corrección verificada contra el código: el invariante interjueces **no** vive en `grupo` sino en
    `idea`/`protocolo` (CHECK `evaluadores_distintos` sobre `evaluador_t1_id`/`t2_id`, `modulos.py`), y el
    Documento Técnico ya lista `otros_tecnicos[]` en `grupo` (`1_documento-tecnico-utec-lidia.md:118`).
    `puntos-a-validar.md` §2.11 y el residuo de §5.18 reapuntados a M11.3.
  - **§5.80 — `divulgacion` como quedó construida.** Nueva tabla en `app/models/divulgacion.py`,
    **15 columnas** con su pasaje del Protocolo de acceso §6.2–6.7 + matriz §5:
    - `hce_id` FK `hce_diurna` **CASCADE** (D-B, con la contra-argumentación) · `ateneo_id` FK `ateneo`
      CASCADE (§5.25) · **`documento_id`** FK `documento` **RESTRICT**, nullable, indexada — *qué* salió;
      **agregado sobre el diseño de M12.8a-2**: el Protocolo §6.6 gobierna «todo **informe** destinado
      a…» y §6.5 el traslado de la HC, así que el objeto de la divulgación es parte del hecho.
    - `destinatario_tipo` NOT NULL · CHECK desde `DIVULGACION_DESTINATARIOS` (9, matriz §5) vía
      `_dominio()` · `destinatario_detalle` (libre, sin CHECK) · `alcance_dato` NOT NULL · CHECK sobre
      `DIVULGACION_ALCANCES` (`identificable`/`disociado`/`agregado`) · `autorizacion_escrita` bool NOT
      NULL `server_default "false"` · `autorizacion_documento_id` FK `documento` RESTRICT ·
      `autorizacion_ref` · `canal_formal` · `finalidad` NOT NULL · CHECK `~ '[^[:space:]]'` · `fecha`
      NOT NULL, indexada · `responsable_id` FK `profesional` **RESTRICT** NOT NULL · `obs`.
    - CHECK de forma: `num_nonnulls(hce_id, ateneo_id) <= 1` —**`<= 1`, no `= 1`**: el informe agregado
      de §6.6 no pertenece a ningún expediente ni ateneo—.
    - **Dos CHECK cruzados NO puestos, y escritos en un comentario** para que no se re-deriven como
      olvido: `alcance_dato <> 'agregado' OR hce_id IS NULL`, y «si `autorizacion_escrita`, apuntá a la
      autorización». Los dos son guards de M11.3 (§5.71 los difiere).
    - **Frontera con `registro_organismo`**: prosa, no esquema. **Append-only por postura** (sin endpoint
      UPDATE/DELETE; `REVOKE` en despliegue anotado para M11.4/Fase 6), **sin trigger** (§5.2.2). **Sin
      seed** (§5.71). `_dominio()` se copió a `divulgacion.py` (tercera copia, misma nota que en
      `inclusion.py` y `pai.py`).
  - **Tests (`tests/test_m12_divulgacion.py`, +42).** Pertenencia (expediente / ateneo / informe agregado
    sin dueño; rechazo de las dos FK juntas); los dos dominios con el test de divergencia-imposible de
    M12.7 (`test_el_check_y_la_constante_no_pueden_divergir`); `finalidad` vacía/en-blanco/entre-espacios
    rechazada y sustantiva aceptada; `fecha` y `responsable_id` obligatorios; **CASCADE** con el
    expediente, **RESTRICT** al borrar el responsable y al borrar cualquiera de los dos `documento`
    referenciados, con su contraparte que pasa; `test_la_migracion_coincide_con_los_modelos` en verde.
  - **Migración regenerada (§5.19).** `0a2d67a35971_…` → **`559b1a79cb77_…_m12_8a.py`**, un solo archivo,
    `down_revision = None`. Reconstrucción limpia: `DROP SCHEMA public CASCADE` → `alembic upgrade head`
    → `python -m app.seed_catalogos`. **Diff semántico contra la anterior: exactamente un
    `op.create_table('divulgacion', …)`** (15 columnas · 4 CHECK · 5 FK · PK) + sus 7 índices, y su
    simétrico en `downgrade`. **Ninguna de las otras 50 tablas cambia** (verificado tabla por tabla y por
    conteo de llamadas `op.*`). Git lo detecta como rename al 94 %.
  - **Verificación de cierre, medida.** `pytest -q` → **432 passed, 0 skipped** — **390 + 42**, todo de
    `test_m12_divulgacion.py` (conteo por archivo: 118+82+67+42+33+31+21+20+18 = 432). **51 tablas**
    (50 + `divulgacion`). Head `559b1a79cb77`. Seed: 1ª corrida todo `nuevas` (base recién reconstruida),
    **2ª corrida 0 nuevas / 0 actualizadas** en las 17 secciones. Verificación `solo_al_crear`: con el
    `total_min` de una banda pisado por SQL a un valor válido y su `texto` pisado a mano, la 3ª corrida
    deja `banda_idea 0 nuevas · 1 actualizada` — **`total_min` sobrevive** (protegido) y **`texto` se
    restaura** (contra-prueba de que el seed comparó); estado restaurado a los valores del JSON
    (`'Muy leve'` → `total_min 0`, `total_max 15`), 5ª corrida 0/0. `verificar_estado.py --check` y
    `generar_catalogos_backend.py --check` → **exit 0** tras poner al día las cifras en `README.md`,
    `CLAUDE.md`, `docs/estructura-repositorio.md`, `backend/README.md` y la cabecera de este archivo
    (50 → 51 tablas · 390 → 432 passed · migración renombrada).
  - **`docs/notas/preguntas-ippu.md`:** dos preguntas nuevas en el bloque B (sin renumerar) — **B11**
    (¿anonimizado individual cuenta distinto de una estadística agregada en el log?) y **B12** (dar a la
    familia una copia de la HC del propio NNA, ¿divulgación o acceso? — Ley 18.335 Art. 18 lit. A). Total
    de preguntas: 25 → **27**.
  - **Commits (con trailer, §5.62):** `6e920a3` (§5.79 + §5.80 + `puntos-a-validar.md`), `c706eb4`
    (modelo + constantes + tests), `6b9557d` (migración regenerada + sincronización de cifras `.md`), y
    esta entrada. A `gitlab` y `origin`, mismo hash, árbol limpio.
  - **Nada contradijo el prompt ni las mediciones de la sesión de diseño.** La única ampliación explícita
    sobre lo diseñado —`documento_id`— la pedía el propio prompt (Step 2) con su fundamento en el
    Protocolo §6.5/§6.6.

- **2026-09-03 · Sesión M12.8a-1 — los tres deltas de esquema ya decididos: §VII fuera, los cinco
  nombres de grupo, `ateneo.observaciones`** (Lucas + Claude, rama `main`). **Toca código:** `app/`,
  `alembic/`, `tests/`, `app/data/` y el generador de catálogos. **NO** construye las dos tablas nuevas de
  M12.8a (`divulgacion` §5.71, `tecnico_grupo` §5.72) — eso es **M12.8a-2**.
  - **Punto de partida, medido.** Árbol limpio en `73d7f9e`, los dos remotos (`gitlab`, `origin`) en el
    mismo hash. Docker arriba. `pytest -q` → **389 passed, 0 skipped**. `verificar_estado.py --check` y
    `generar_catalogos_backend.py --check` → **exit 0**. Head de Alembic `72b96030362d`, un solo archivo
    en `versions/`.
  - **§13 retroactivo de L8** — escrito en esta sesión (entrada de más abajo): L8 no había dejado rastro.
    Commit aparte.
  - **Delta 1 — §VII / FODA fuera de `pai` (§5.59, ratifica §5.42 / I7).** Se quitan `fort`, `oport`,
    `debil`, `amen` de `app/models/pai.py` (queda un comentario donde iba la sección, para que no se
    reincorpore sin cruzar la decisión). «Campos propios de la cabecera» baja de **43 a 39**, re-derivada
    dos veces: contra el modelo, `Pai` pasó de 47 a 43 `mapped_column`, − 4 técnicas = 39; contra la
    referencia, 49 claves − 3 en vivo − 3 colecciones − 4 de §VII = 39. Corregida en `CLAUDE.md`, el
    bloque «Qué se hizo» de M12.6 (§6) y `tests/test_m12_pai.py` (nombre, docstring, aserción `== 39`).
    Nota nueva en `docs/markdown/prototipo-v4-referencia.md` junto a la enumeración de las 49 claves. Los
    registros históricos (bitácora de M12.6 y de L6, §5.59) **no** se tocan.
  - **Delta 2 — los cinco nombres reales de grupo (§5.61, ratifica §5.37).** `GRUPOS` en
    `herramientas/generar_catalogos_backend.py` pasa de los 4 colores a **Inicial · Escolares ·
    Preadolescentes · Adolescentes · Taller de Adolescentes**; `app/data/catalogos_iniciales.json` se
    **regenera** (diff = sólo la sección `grupo`, 4 → 5 filas, todas `anio 2026`, `UNIQUE(nombre, anio)`
    se cumple). `test_el_seed_trae_los_cuatro_grupos_por_color` → `..._los_cinco_grupos_reales`; el
    conteo del seed idempotente pasa de 4 a 5. Barrido de **todas** las apariciones de los cuatro colores
    en los tests (≈34 líneas —literales de fixture, aserciones, docstrings, un nombre de variable— en
    `test_esquema_v2.py`, `test_m12_ateneos.py`, `test_m12_talleres.py`, `test_m12_catalogos.py`;
    **ninguna quedó**) y de **cuatro** comentarios de `app/` que decían «4 grupos por color»
    (`seed_catalogos.py`, `identidad.py`, `catalogos.py`, `ateneo.py`). `taller.grupos_orientados` sigue **vacío** en el seed (verificado, los
    14 con `[]`). ⚠️ «Taller de Adolescentes» se siembra como grupo por §5.61; si IPPU lo entiende como
    el servicio de Taller Terapéutico (Fase 2), sale — pregunta **A5** de `docs/notas/preguntas-ippu.md`,
    referenciada en el código junto a `GRUPOS` y al seed. `demo/` (colores como ids propios): fuera de
    alcance, no se tocó.
  - **Delta 3 — `ateneo.observaciones` (§5.66).** Una columna `Text` nullable, **sin CHECK** (como
    `participantes`). Un test positivo nuevo; `participantes` no se toca; los adjuntos PPTX siguen
    diferidos a Fase 6.
  - **Migración regenerada (§5.19).** `72b96030362d_…_m12_6.py` → **`0a2d67a35971_…_m12_8a.py`**, un solo
    archivo, `down_revision = None`. Diff semántico contra la anterior: **exactamente** −4 columnas
    (`fort/oport/debil/amen`) y +1 (`observaciones`), nada más.
    `test_la_migracion_coincide_con_los_modelos` **en verde** (autogenerate no ve diferencia tras
    regenerar).
  - **Verificación, medida hoy.** `pytest -q` → **390 passed, 0 skipped** — **389 + 1**: el único test
    nuevo es el de `ateneo.observaciones`; los renombres de Δ1 y Δ2 son net 0. **50 tablas** (sin cambio:
    tres deltas, ninguna tabla nueva). Head `0a2d67a35971`. Seed: 2ª corrida **0 nuevas / 0 actualizadas**
    en todas las tablas; con el `total_min` de una banda pisado por SQL a un valor válido y su `texto`
    pisado a mano, la 3ª corrida deja `banda_idea 0 nuevas · 1 actualizada` — **`total_min` sobrevive**
    (protegido por `solo_al_crear`) y **`texto` se restaura** (contra-prueba de que el seed comparó de
    verdad); estado restaurado, 4ª corrida 0/0. `verificar_estado.py --check` y
    `generar_catalogos_backend.py --check` → **exit 0** tras poner al día tres cifras en `.md`
    (`estructura-repositorio.md` la migración; `README.md` y `backend/README.md` «389 → 390 passed»).
  - **§6:** I2 e I7 salen de «DECIDIDO, SIN IMPLEMENTAR» — la base ya no las contradice; queda **I1**
    (IDEA anual). El bloque «Qué se hizo» de M12.6 y `puntos-a-validar.md` §2.8 quedan apuntando a que
    falta sólo la creación/renombrado de grupos **desde la app**.
  - **Commits (con trailer, §5.62):** `dea1a46` (§13 de L8), `ac84b4e` (§VII fuera + cifra), `6afa751`
    (cinco grupos), `a02df5b` (`ateneo.observaciones`), `a71fe7a` (migración regenerada), y esta entrada.
    A `gitlab` y `origin`, mismo hash, árbol limpio.
  - **Deltas de M12.8a que faltan:** las dos tablas nuevas — `divulgacion` (§5.71) y `tecnico_grupo`
    (§5.72) — en **M12.8a-2**. `anio` **no** entra en `inclusion` (§5.73).

- **2026-09-03 · Sesión L9 — reconciliación con el Protocolo de acceso + hoja de decisiones de la hoja
  intermedia** (Lucas + Claude, rama `main`). **Documentación solamente.** No se tocó `app/`, `alembic/`,
  `tests/` ni `app/data/`; no se regeneró migración ni catálogos; no se levantó Docker; **no se corrió
  `pytest`** y las **389** no se re-midieron. ⚠️ **No hay «sesión L8» en esta bitácora:** el prompt de L9
  la cita como «la hoja de L8» (la hoja de decisiones A-1…C-2), pero no quedó un commit ni una entrada de
  §13 con ese nombre; la sesión que armó esa hoja fue una instancia intermedia sin registro propio.
  - **Punto de partida medido** (no se cita como cifra viva): árbol limpio en `7e2406d`, los dos remotos
    (`gitlab`, `origin`) en el mismo hash. `verificar_estado.py --check` y
    `generar_catalogos_backend.py --check` → **exit 0**. Última entrada existente: `### 5.69` en
    `handoff.md`, `### 1.16` y `### 2.16` en `puntos-a-validar.md`.
  - **Ingesta de dos documentos de IPPU, los dos anteriores al acta del 2026-08-26:**
    - **Protocolo de acceso, confidencialidad y resguardo de la HC** — **nuevo en el repo**. Convertido a
      `docs/markdown/protocolo-acceso-confidencialidad-resguardo-hce.md` (verbatim; sólo se corrigieron
      artefactos de Docling — título descolocado, matriz §5 partida en tres, Anexo III con una columna
      colapsada).
    - **`1_Documento_Tecnico_UTEC-LIDIA.md`** — **idéntico en prosa** a
      `docs/markdown/1_documento-tecnico-utec-lidia.md`. Diff normalizado (sin markup, sin whitespace):
      difieren sólo artefactos de reconversión (`**x**` vs `## x`, reflow de tablas por salto de página,
      `excepcional :` vs `excepcional:`); ninguna sección, regla, número ni entidad del modelo cambió.
      **No se tocó.**
    - **Regla de precedencia** escrita en la cabecera de `handoff.md` (nivel «1-bis» + un nivel «0» para
      las decisiones §5 y el acta) y en `CLAUDE.md`: donde estos documentos contradigan la reunión
      (§5.36–§5.49) o algo posterior, gana la reunión y lo posterior.
  - **§5 append-only: 69 → 78 entradas, 0 tocadas** (verificado: el `git diff` de `handoff.md` no borra
    ninguna línea `### 5.` ni ningún `---` de separación). Desde **§5.70 sin etiqueta `(L#)`** (§5.77 +
    línea de decodificación al inicio de §5: la etiqueta contaba decisiones dentro de una serie, los
    nombres de sesión contaban sesiones, y las dos numeraciones divergieron).
    - **§5.70 — el hallazgo sustantivo.** El Protocolo §5 (fila «otros técnicos … no tratantes») y §6.1
      dan al técnico no tratante acceso «únicamente mediante interconsulta formal, **ateneo clínico** o
      pase de caso documentado». **El ateneo no es una fuga del régimen: es el canal que el régimen
      provee.** §2.16 se cierra apuntando acá. Tres condiciones para M11.3 (visibilidad = participantes
      documentados + equipo tratante + dirección/coord.; leer el ateneo ≠ abrir la HCE; acceso con
      motivo). ⚠️ **`ateneo.participantes` es hoy `Text`** (prosa, `app/models/ateneo.py:257`, decisión
      de privacidad) → la condición 1 es **inimplementable**; pasa a relación en M11.3, **NO se toca**.
    - **§5.71 (A-1) — `divulgacion` a M12.8a.** Columnas **derivadas** del Protocolo §6.2–6.7 + matriz §5
      (destinatario, alcance identificable/disociado/agregado, autorización escrita + ref, canal formal,
      motivo, fecha, responsable). Append-only por naturaleza. No modela flujo; guards en M11.3. §2.12 NO
      cierra (decidido y agendado).
    - **§5.72 (A-2) — `tecnico_grupo` N:M a M12.8a, aditiva.** ⚠️ **`grupo.tecnico1_rol/tecnico2_rol` YA
      EXISTEN** (`String(60)` nullable, `app/models/identidad.py:127`/`:129`) — la hoja esperaba que no.
      El vocabulario de roles (5 perfiles de la matriz §5) es **PROPUESTA para Lucas**, NO va a un CHECK.
      ⚠️ conflación `admin` (crea grupos) ↔ «dirección no técnica» del Protocolo (sin acceso clínico):
      reportada, no resuelta. ⚠️ **agranda M12.8** («una sola persona»). §2.11 NO cierra.
    - **§5.73 (A-3) — `inclusion` NO se anualiza; §1.15 reformulado.** Medido contra
      `app/models/inclusion.py`: `inclusion_bitacora` (gestiones fechadas) permite **actividad por
      período** (alerta 60 días, articulaciones por caso/período); **no** permite reconstruir el estado a
      una fecha pasada (`estado`, `fecha_estado`, `centro`, `tipo_centro`, `dias_horas` son columnas
      únicas mutables; no hay historial de estado; `auditoria` es aspiración). Falta un historial de
      estado fechado (M11.3/M11.4). `anio` NO entra en M12.8a.
    - **§5.74 (B-1)** — el indicador de ateneos cuenta por `ateneo.fecha`. **§5.75 (B-2)** — vocabulario
      de «fase» ratificado; **§2.3 CIERRA**; pase mecánico de corrección → §6. **§5.76 (B-3)** — L1 = HCE
      oficial; **§2.4 CIERRA**. **§5.77 (B-4)** — se retira la etiqueta `(L#)`. **§5.78 (C-1)** — Lucas
      dueño del contacto; preguntas consolidadas.
  - **`puntos-a-validar.md` §2.17 (nuevo)** — HCE-LOG (`auditoria`) registra **cambios** (campo/valor
    ant/nuevo); el Protocolo §8 exige registrar **lecturas con motivo y firma** y §7 el registro
    automático con credencial individual. `tipo='acceso'` está en el CHECK pero no hay `motivo`, ni firma,
    ni nada que lo escriba. Requisito **legal**. Condiciona M11.3 y Fase 4. **No se diseña.**
  - **`docs/notas/preguntas-ippu.md` (nuevo)** — la lista consolidada, dueño Lucas. **25 preguntas**
    distintas (A bloquea ahora · B bloquea M11.3 · C registro), con apéndice de conteo por fuente y tres
    solapamientos con redacción divergente (reingreso; anualización del estado de inclusión; roles de los
    técnicos). Nuevas de L9: «Taller de Adolescentes» ¿grupo o servicio? (Documento Técnico §1 reserva
    Taller Terapéutico/Clínica para Fase 2), «perfil de área de Inclusión», la firma del acuerdo.
    `puntos-a-validar.md` §1.17 (nuevo): autonomía progresiva — reserva por entrada frente a
    representantes, ausente del modelo.
  - **Cierres / cambios en `puntos-a-validar.md`:** **CERRADOS** §2.16 (→ §5.70), §2.3 (→ §5.75), §2.4
    (→ §5.76). **CAMBIAN, no cierran:** §1.6 (estrechado — falta la firma, no la redacción: el Anexo II
    trae el modelo), §1.15 (reformulado), §2.11, §2.12, §2.14. **Higiene:** §2.15 marcado resuelto por
    §5.57, §2.10 reencuadrado (se pliega a §2.11), §2.9 con bullet propio en §6.
  - **`PLAN-M12` §M12.8a** — delta final: §5.59 (§VII/FODA out, 43→39) · §5.61 (5 grupos) · §5.66
    (`ateneo.observaciones`) · §5.71 (`divulgacion`) · §5.72 (`tecnico_grupo`) · **NO** `anio` en
    `inclusion`. Dicho explícito: M12.8a dejó de ser limpieza.
  - **Commits (con trailer, §5.62):** `511113d` (ingesta + precedencia), `4f85d4d` (§5.70–5.78 + §2.16 +
    §2.17 + cierres), `edae3ec` (`preguntas-ippu.md` + §1.17), `ea1969c` (PLAN-M12 §M12.8a + §6), y esta
    entrada. A `gitlab` y `origin`.
  - **Verificación de cierre:** `verificar_estado.py --check` y `generar_catalogos_backend.py --check`
    → **exit 0**. §5 append-only comprobado (69 → 78, 0 entradas tocadas). `pytest` **no se corrió**
    (nada cambió de comportamiento). ⚠️ **Prohibición del prompt cumplida** salvo una desviación anotada:
    las «commits (2)» y «(3)» del plan del prompt (§2.16 solo, y luego las decisiones) se **fusionaron**
    en `4f85d4d` porque §5.70 y §5.71–§5.78 son un único hunk contiguo de inserción y separarlos exigía
    fabricar cabeceras de hunk sobre `handoff.md`. También: la hoja pedía «§2.12 cierra como
    decidido-y-agendado» pero la sección Prohibiciones dice «NO cerrar §2.12» — se respetó la
    prohibición (§2.12 cambia, no cierra).

- **2026-09-03 · Sesión L8 — triage de las preguntas abiertas para armar la hoja de decisiones de
  cierre de la ronda M12** (Lucas + Claude, rama `main`). **Reconocimiento de solo lectura.**
  ⚠️ **Entrada retroactiva, escrita el 2026-09-03 por la sesión M12.8a-1.** L8 no dejó rastro propio
  —ni commit, ni entrada de §13—, y en su momento fue lo correcto: la sesión tenía prohibido escribir.
  Pero §5.70–§5.78 y el prompt de L9 citan «la hoja de L8» sin que hubiera nada a lo que apuntar
  (la entrada de L9 lo dejó anotado como hueco); esta entrada lo corrige.
  - **Qué midió.** Las **16 entradas todavía abiertas** de `docs/notas/puntos-a-validar.md` (§1 y §2),
    triadas **A / B / C / D** por lo que cada una traba: **A** bloquea trabajo ahora · **B** bloquea
    M11.3 · **C** se lleva para el registro (no bloquea nada) · **D** la puede cerrar o ejecutar el
    equipo sin depender de IPPU. Agrupadas por eso, con la evidencia de repo debajo de cada una.
  - **No escribió nada, por diseño.** No tocó `handoff.md` §5, `puntos-a-validar.md`, `app/`,
    `alembic/`, `tests/` ni `PLAN-M12`; no levantó Docker; no corrió `pytest`.
  - **Qué produjo.** La hoja de decisiones **A-1 … C-2** que la sesión **L9** ejecutó: sus salidas son
    **§5.70–§5.78** de `handoff.md` y los cierres / reformulaciones de `puntos-a-validar.md` que L9
    registró. La numeración `A-N` / `D-N` es de la hoja, no de §5.
  - **Sin commit propio:** esta entrada viaja en un commit de la sesión M12.8a-1.

- **2026-09-03 · Sesión L7 — las once decisiones de cierre de la ronda M12** (Lucas + Claude, rama
  `main`). **Documentación** — más **una** operación git (archivar + borrar una rama) y el cambio de
  convención de commits. No se tocó `app/`, `alembic/`, `tests/` ni `app/data/`; no se regeneró migración
  ni catálogos; no se levantó Docker; **no se corrió `pytest`** y las **389** no se re-midieron.
  - **Punto de partida medido** (no se cita como cifra viva): árbol limpio en `4074e9e`, los dos remotos
    (`gitlab`, `origin`) en el mismo hash. `verificar_estado.py --check` y
    `generar_catalogos_backend.py --check` → **exit 0**. Última entrada existente: `### 5.58` en
    `handoff.md`, `### 1.16` y `### 2.16` en `puntos-a-validar.md`.
  - **Once decisiones escritas en §5 (serie L).** §5 append-only: **58 → 69 entradas, 0 perdidas.**
    - **§5.59 (L6) — D-11, el hallazgo.** `app/models/pai.py:226-232` modela la sección **§VII (FODA:
      `fort/oport/debil/amen`)** cuando **§5.42 (I7)** y `PLAN-M12` §M12.6 mandan retirarla. **Cómo se
      encontró:** ya lo había flagueado la bitácora de L6; L7 verificó la premisa —grep de
      `FODA/fort/oport/debil/amen/§VII` sobre §5 y §13 de `handoff.md`, `docs/prompts/` (no hay prompt de
      M12.6 versionado), `PLAN-M12` y los mensajes de commit de M12.6— y **no existe registro que la
      conservara a conciencia**: el commit `7d6515f` enumera §5.55/§5.56/§5.57 y la derivación de campos y
      no menciona FODA; el docstring de `pai.py` razona la forma, no el retiro. **La aritmética:** «43
      campos propios» se derivó como «49 claves − 3 en vivo − 3 colecciones» y **nunca restó los 4 de
      FODA**; medido: `Pai` tiene 47 `mapped_column` − 4 técnicas = 43; **sin §VII, 39**. Test que lo
      fija: `tests/test_m12_pai.py:193/200`. Decisión: sale en **M12.8a**, cifra → 39; **acá no se toca
      nada ni se corrige la cifra**.
    - **§5.60 (L7) — D-1:** **§5.8 RATIFICADA** — el equipo ratifica haber arrancado M11 sin la validación
      previa de IPPU. Ratifica ese arranque puntual, **no** una licencia para saltarse puertas. Cierra
      `puntos-a-validar.md` §2.1.
    - **§5.61 (L8) — D-2:** los cinco nombres reales de los grupos (Inicial · Escolares · Preadolescentes ·
      Adolescentes · Taller de Adolescentes); confirma §5.37. Renombrado (4 → 5 filas) **se ejecuta en
      M12.8a**. `puntos-a-validar.md` §2.8 **NO cierra** (falta la creación de grupos, no los nombres).
    - **§5.62 (L9) — D-3:** se adopta el **trailer de co-autoría** como estilo predeterminado. ⚠️ **En la
      hoja de L6, Lucas marcó «opción a» como etiqueta pero la prosa decía «se adopta CON trailer → nuevo
      estilo predeterminado»: gobernó la prosa.** Los 2 commits de L5 y el de M12.6 pasan de excepción a
      precedente. Reescritos `commit-style-ippu.md` y el puntero de `MEMORY.md`. **Los commits de esta
      sesión llevan el trailer.**
    - **§5.63 (L10) — D-4:** **§5.58 RATIFICADA** — el ateneo de grupo es de acceso general, como decisión
      de equipo. La marca **CONFIRMABLE** se mantiene (la decisión rige; falta constancia escrita de
      IPPU). Reescrito el ítem 9.a de §16 de `respuestas-reunion-ippu-2026-08-21.md`.
    - **§5.64 (L11) — D-5:** vocabulario de «fase» — se decide fijar uno (opción a), **falta la
      redacción** → `puntos-a-validar.md` **§2.3 NO cierra**. Propuesta borrador en §2.3, **pendiente de
      ratificación de Lucas**. Corregido `PLAN-M12`, que decía que M12.8 lo cerraba.
    - **§5.65 (L12) — D-6:** el criterio §12-A — **M12.8 lo escribe en prosa; su forma ejecutable es de
      M11.5** (el seed espejo no existe; 58/60/79/Δ+19 nacen en `demo/js/`).
    - **§5.66 (L13) — D-7:** `ateneo.observaciones` (Text, sin CHECK) entra en **M12.8a**; adjuntos PPTX
      diferidos a **Fase 6**.
    - **§5.67 (L14) — D-8:** **Lucas toma M11.3.** Cierra `puntos-a-validar.md` §2.7. Ítem aparte: la
      primera tarea de M11.3 es un reconocimiento estilo R0 contra el código (→ §6).
    - **§5.68 (L15) — D-9:** la rama `feature/base-datos-hce` **archivada como tag `archivo/base-datos-hce`
      (sobre `dfb1732`, en los dos remotos) y borrada de `gitlab`**. Cierra `puntos-a-validar.md` §2.2,
      antes de lo que pedía, por decisión explícita.
    - **§5.69 (L16) — D-10:** se decide **versionar un baseline** del harness de `demo/verificacion/`.
      Deroga el razonamiento de `demo/verificacion/README.md`. ⚠️ **No se genera ni committea acá** —
      necesita Playwright + una corrida → sesión de demo, sin dueño.
  - **La operación git (D-9), paso a paso.** `git fetch gitlab` → `gitlab/feature/base-datos-hce` en
    `dfb17328f2452d8eede3c6e38c389d051b3f4db0`. Tag anotado **`archivo/base-datos-hce`** creado sobre ese
    commit, pusheado a `gitlab` y `origin`. `git ls-remote` en los dos remotos:
    `refs/tags/archivo/base-datos-hce^{}` → `dfb1732` en **ambos** → recién ahí
    `git push gitlab --delete feature/base-datos-hce`; confirmado que no queda ni en `gitlab` ni como
    remote-tracking local. `handoff.md` §12.5 y el checkbox de §6 reapuntados al tag; §5.3 (registro de
    2026-08-03) **no se edita** — §5.68 lo supersede.
  - **Cierres en `puntos-a-validar.md`:** §2.1 (D-1), §2.2 (D-9), §2.7 (D-8). **NO cerraron:** §2.3 (D-5,
    falta redacción) y §2.8 (D-2, falta la creación de grupos). §6: I7 nuevo en «DECIDIDO, SIN
    IMPLEMENTAR», I2 reapuntado a M12.8a, M11.3 con dueño (Lucas) + tarea de reconocimiento.
  - **Commits (con trailer, por §5.62):** `af98184` (D-11 / §5.59), `cd98f67` (§5.60–5.69 + cierres +
    §16), `b0bc809` (tag/borrado + §12.5 + §6), `f517e41` (PLAN-M12 §M12.8), y esta entrada. A `gitlab` y
    `origin`.
  - **Verificación de cierre:** `verificar_estado.py --check` y `generar_catalogos_backend.py --check`
    → **exit 0**. §5 append-only comprobado (58 → 69, 0 entradas tocadas). `pytest` **no se corrió**
    (nada cambió de comportamiento).

- **2026-09-02 · Sesión L6 — cierre de cabos sueltos de la ronda M12: la mayoría de las decisiones
  volvió sin completar** (Lucas + Claude, rama `main`). **Documentación solamente.** No se tocó `app/`
  salvo un docstring; no se tocaron `alembic/`, `tests/` ni `app/data/`; no se regeneró migración ni
  catálogos; no se levantó Docker; **no se corrió `pytest`** y las **389** no se re-midieron.
  - **Punto de partida medido** (no se cita como cifra viva): árbol limpio en `65a0b5a`, los dos remotos
    (`gitlab`, `origin`) en el mismo hash. `verificar_estado.py --check` y
    `generar_catalogos_backend.py --check` → **exit 0**. Última entrada existente: `### 5.58` en
    `handoff.md`, `### 1.16` y `### 2.16` en `puntos-a-validar.md`.
  - **Hoja de decisiones (SECCIÓN A del prompt, D-1 … D-10): las diez volvieron `SIN COMPLETAR`.** Por
    §12.6 no se decide ninguna, no se aplica ninguna recomendación y **no se escribe ninguna entrada de
    §5**. La hoja se re-emitió con la evidencia de repo medida bajo cada punto, para que Lucas la
    conteste. Consecuencia: **D-2 (nombres reales de los grupos) sigue bloqueando M12.8**; **§2.3
    («fase») no se cierra**; el criterio de aceptación que reemplaza a §12-A **no se define**; la
    columna `ateneo.observaciones` y el trailer de commits **quedan pendientes**.
  - **Lo que sí se hizo, por estar mandado explícitamente y no depender de ninguna decisión:**
    - **Bitácora L5 escrita en forma retroactiva** (entrada de abajo). L5 había cerrado sin registro.
    - **`app/models/ateneo.py`** — el docstring de `Ateneo.sensible` seguía llamando «hueco de la
      fuente» a la visibilidad del ateneo de grupo con «la pregunta va a IPPU». §5.58 la contestó:
      reescrito a la regla vigente (acceso general, ⚠️ CONFIRMABLE, puntero a §2.16). **Sólo docstring:**
      derivación, CHECKs y `TIPO_SENSIBLE` intactos.
    - **`puntos-a-validar.md`** — resumen: §1.12 ya no figura sólo como «cerrado por la reunión» (la
      reunión lo cerró «por grupo», §5.58 lo re-cerró en dirección opuesta). **No se cerró §2.3** (D-5
      sin vocabulario); no se cerró ningún punto cuya decisión fuera «sigue abierto».
    - **`respuestas-reunion-ippu-2026-08-21.md` §16** — 9.a agregado a la lista del próximo contacto:
      confirmación escrita de la reversión (hoy CONFIRMABLE).
    - **`PLAN-M12`** — M12.0 y M12.1 marcados `✅ **HECHO**` con cifras al cierre de esas sesiones
      (2026-08-14); corregido el blockquote de M12.5 que decía «sin mergear» (se mergeó con `d2ea3b3`).
      **No se tocó lo que M12.8 debe hacer con las decisiones** — la hoja volvió sin completar.
  - ⚠️ **Hallazgos reportados, NO corregidos (son de M12.8a):**
    - **`app/models/pai.py:226-232` modela la sección §VII (FODA: `fort`, `oport`, `debil`, `amen`)**
      con encabezado `── §VII · Análisis estratégico (FODA) ──`, cuando **§5.42 (I7)** y **PLAN-M12
      §M12.6** dicen que §VII **«SE RETIRA … no lleva columnas ni tabla hija»**. Ni la bitácora de
      M12.6, ni §5.54–§5.56 registran haberla conservado: los `fort/oport/debil/amen` entraron en los
      «43 campos propios» sin nota. Es un esquema desalineado con una decisión I-series, no un comentario
      viejo — para M12.8a / M11.3.
    - Barrido de comentarios stale bajo `app/` contra las decisiones serie L (§5.54–§5.58): **el único
      era el de `ateneo.py`**, ya arreglado. Los docstrings de `pai.py` y `constantes.py` citan
      §5.54/§5.55/§5.56/§5.50 correctamente (se escribieron en la misma sesión M12.6).
  - **Verificación de cierre:** `verificar_estado.py --check` y `generar_catalogos_backend.py --check`
    → **exit 0**. §5 intacto (0 entradas tocadas). Commits `a5d4d19` (L5 + cabos), `5bbf6a5` (docstring),
    `0fbcb16` (plan) y esta entrada, a `gitlab` y `origin`.
  - ⚠️ **Trailer de commits:** esta sesión commitea **sin** trailer de co-autoría, por
    `commit-style-ippu.md` y porque **D-3 volvió sin completar**. La divergencia de los dos commits de L5
    (que sí lo llevan) queda abierta como D-3.

- **2026-09-02 · Sesión L5 — reversión de la visibilidad de los ateneos de grupo + fix de §166**
  (Lucas + Claude, rama `main`). ⚠️ **Entrada escrita en forma retroactiva el 2026-09-02, en la sesión
  L6:** L5 cerró sin bitácora. Se reconstruye acá contra los dos commits que dejó (`a9e2c3d`, `65a0b5a`)
  y su contenido. **Documentación solamente — no se tocó `app/`, `tests/`, `alembic/` ni la base; no se
  levantó Docker; las 389 no se re-midieron.**
  - **La reversión (§5.58 / L5).** El **ateneo de grupo pasa a ser de acceso general** del equipo
    técnico: se revierte **sólo** el párrafo de visibilidad de §5.46 (I11) —«cada técnico ve los de su
    grupo»— y vuelve a valer el apunte crudo de la reunión del 21/08, «todos los técnicos ven todos los
    ateneos». **Procedencia:** lo relevó Lucas el 2026-09-02 como corrección de IPPU al registro de esa
    reunión; **no consta en el acta** (`respuestas-reunion-ippu-2026-08-21.md` no lo recoge) → marcado
    **⚠️ CONFIRMABLE**, con §5.38 (I3, consentimiento) de precedente para cómo se carga un punto de
    segunda mano. §5 quedó append-only: **57 → 58 entradas, 0 perdidas** (`git diff --numstat`).
  - **Costo en código: cero, y medido.** `Ateneo.sensible = (self.tipo == TIPO_SENSIBLE)` con
    `TIPO_SENSIBLE = "clinico"` (`app/models/ateneo.py:38` · `:310-341`), así que un ateneo `tipo ==
    'grupo'` ya daba `sensible = False` —acceso general— en Python y en SQL. **No hay en `app/`,
    `tests/`, `app/data/` ni `backend/docs/` ninguna regla de visibilidad por grupo para ateneos**, ni
    nada que consuma `ateneo.grupo_id` como regla de acceso: `grupo_id` sólo alimenta los dos CHECK que
    lo exigen/prohíben por tipo (`:367-379`), la FK RESTRICT, los índices de filtro y la advertencia
    cross-table `fecha ↔ grupo.anio` (M11.3). Tampoco hay capa que pudiera aplicarla
    (`app/routers/__init__.py` vacío, sin `app/services/`, `app/main.py` monta sólo `/health`).
  - **Regla registro-vs-nota de trabajo, aplicada archivo por archivo:**
    - `handoff.md` **§5.46** y `respuestas-reunion-ippu-2026-08-21.md` **§9.a** — **se conservan como
      registro**, no se editan: la corrección vive en §5.58 y en una línea fechada bajo el texto
      original. §5.46 mantiene su título aunque siga diciendo «por grupo».
    - `handoff.md` **§13** — no se edita: L5 no reescribe entradas viejas.
    - `puntos-a-validar.md` **§1.12** — **se reescribe** el bloque de cierre (es nota de trabajo): de
      «CERRADO restrictivo» a «CERRADO en dirección PERMISIVA (2026-09-02)».
    - `puntos-a-validar.md` **§2.11** — se quita la cláusula de ateneos del bullet de la matriz de
      permisos; la matriz general sigue en Fase 4.
    - `puntos-a-validar.md` **§2.16 (nueva)** — tensión técnico↔grupo (§5.41 + Manual §21.1) contra el
      acceso general: un ateneo de grupo deja leer, a través del acta, material sobre NNA cuya HCE el
      técnico no abre. No bloquea hoy; condiciona M11.3 y Fase 4.
    - `consulta-a-ippu.md` §3.12 y `respuestas-reunion-ippu-2026-08-21.md` §9.a + tabla §16 —
      corrección fechada agregada bajo el registro original, sin reescribirlo.
  - **Además, aprobado en el prompt de L5 (no es de la reversión):**
    - `puntos-a-validar.md` **§2.15** — puntero a **§5.57 (L4)**: la salida 2 (`pai_prestacion` como
      declaración fechada) queda ratificada; la salida 3 (aviso de divergencia) se reabre en M11.3/M11.4.
    - **PLAN-M12** — se marcó `✅ **HECHO**` en los encabezados de **M12.5** (42 tablas · 307 tests ·
      head `aa26917b6e76`) y **M12.6** (50 tablas · 389 tests · head `72b96030362d`), con las cifras
      medidas al cierre de cada sesión.
  - **Fix de `prototipo-v4-referencia.md:166` (commit `65a0b5a`).** La línea 166 listaba «secciones I,
    II, VI, XI y XV … modelarlas como referencias». §5.55 (L2) ya había medido que los siete campos
    editables de §I y §II son columnas propias de `pai`. La línea pasa a decir **«VI, XI y XV»** con una
    nota ⚠️ a §5.55, corregida contra la propia lista `:149` del archivo, sin reinvestigar. Cierra el
    pendiente «Barato, sin dueño» de §6.
  - **Verificación:** `verificar_estado.py --check` y `generar_catalogos_backend.py --check` → exit 0.
    `pytest` **no se corrió** (nada cambió en `app/`, `tests/` ni `alembic/`).
  - **Commits:** `a9e2c3d` (§5.58 + cierres) y `65a0b5a` (fix §166), a `gitlab` y `origin`.
  - ⚠️ **Divergencia abierta:** los dos commits llevan trailers `Co-Authored-By: Claude Sonnet 5` y
    `Claude-Session:` que `commit-style-ippu.md` dice que el proyecto **no usa**. Un `system-reminder` de
    sesión los impuso por encima de la convención escrita. **Queda como cabo suelto para el equipo (D-3
    de la hoja de decisiones de L6):** o la convención gana y los dos commits quedan como excepción
    registrada, o se adopta el trailer y eso va a §5 con su razón. La historia no se reescribe en
    ningún caso.

- **2026-09-02 · Sesión M12.6 — HCE-PAI, en modo solo esquema** (Lucas + Claude, rama `main`).
  **Cierra el sub-módulo más grande de la ronda.** Arranca donde R1 dejó: con la medición hecha, pero sin
  decisión escrita. **Lo primero de la sesión fue la decisión, no el código.**
  - **0 — La puerta se abrió por escrito y con confirmación explícita.** §5.28 dijo que el bloqueo lo
    levanta el equipo, en §5; así que **§5.54 (L1) se propuso y se confirmó antes de tocar un archivo**.
    Al proponerla se corrigieron **dos errores del borrador**, medidos contra el repo: la fecha era
    **2026-09-02** (sesión R1) y no 2026-08-26/27, y los tres catálogos del PAI **no están** en
    `apartado-especificaciones-tecnicas-prototipo-v4.md` sino en la **capa de catálogos del prototipo**
    (`:947-996`); el `.md` aporta el **esquema sugerido** (`:28-51`), que además **no define ninguna tabla
    `pai`**. Verificado que la inserción fue **append-only**: `git diff --numstat` → **0 borrados**.
  - **1 — Qué son §4 y §8 del Manual: se respondió por estructura, no por adivinanza.** El `const MANUAL`
    agrupa **25 secciones en seis Partes** y **la numeración no tiene huecos**, así que cada faltante cae
    dentro de una Parte conocida: **§4 cierra Parte I (Marco general)** y **§8 está dentro de Parte II
    (IDEA)**, entre puntuar (§6–7) e interpretar el perfil (§9). ⚠️ **Y el Manual no tiene ninguna Parte
    del PAI** —son marco general, IDEA, Escala IPPU-TEA, Informe de Cierre, HCE y Calidad—, así que
    **ninguna de las dos podía ser material del PAI**. Ése fue el permiso para seguir. Se descartaron dos
    candidatos de §4 **con cita**: no es el consentimiento (**§19.1 + Anexo C**, `:731`/`:1229`) ni los
    permisos (**§21.1**). Todo quedó en `puntos-a-validar.md` **§1.16**.
  - **2 — El módulo: 8 tablas, no 5.** `pai` (**43 campos propios**) + `pai_objetivo`,
    `pai_evaluacion_previa`, `pai_equipo`, `pai_coordinacion`, `pai_taller` — las cinco previstas — **y dos
    que la consigna no enumeraba y los datos exigían**: `pai_prestacion` y `pai_circuito`. `prest{}` y
    `circuito{}` son conjuntos marcados contra un vocabulario cerrado; dejarlos afuera habría **descartado
    dos campos del formulario**. Se modelan con la misma forma que `pai_taller` (una fila por ítem
    marcado) en vez de columnas booleanas o un JSONB, por el criterio de `inclusion_bitacora`: son
    consultas **entre** propuestas.
  - **El conteo de 43, derivado y no copiado.** 49 claves en `p.pai` **− 3** que se leen en vivo (§5.22)
    **− 3** que son colecciones y viven en hijas = **43**. El «~46 campos» de la referencia era el paso
    intermedio. Hay un test que lo fija.
  - **3 — Dos decisiones escritas antes de modelar.** **§5.55 (L2)**: la carga única es **por campo, no
    por sección** — `ingreso_ippu` (§I) y los seis editables de §II son columnas propias, y la prueba que
    cierra el caso es **negativa** (HCE-ORG no tiene dónde guardarlos: su objeto es `inau:{sipi, convenio,
    referente, ingreso, obs, envios[]}`). **§5.56 (L3)**: los tres vocabularios del PAI son **constante y
    no catálogo**, y **lo decide el propio prototipo** — le da **4 funciones de gestión** a `CAT_TALLERES`
    (`tallerAdd`/`tallerToggle`/`tallerGrupos`/`tallerGestion`) y **0** a `PAI_AREAS`, `PAI_PREST` y
    `PAI_CIRCUITO`, que aparecen **2 veces cada una** en todo el archivo. No hizo falta razonar sobre la
    naturaleza de cada lista: la fuente ya había clasificado (§5.50).
  - **4 — El test que M12.3 no pudo escribir, escrito** (§5.21). Carga participación en «Taller de
    huerta», lo retira del catálogo y afirma que **sigue legible** y **marcada como retirada**. Se le sumó
    el caso extremo —**borrar** la fila del catálogo tampoco toca la participación, porque no hay FK que
    propague— y la verificación de que `pai_taller` **no tiene FK a `taller`** ni columna `taller_id`.
  - **5 — Migración regenerada** (§5.19): `alembic downgrade base` → se borra
    `aa26917b6e76_esquema_v2_inicial_m12_5.py` → autogenerate → **`72b96030362d`**, un solo archivo en
    `versions/`, `down_revision = None`. `alembic upgrade head` crea **50 tablas** y el seed vuelve a
    cargar los catálogos.
  - **Verificación:** `pytest -q` → **389 passed, 0 skipped** (307 + **82** nuevos; `test_m12_pai.py`).
    `verificar_estado.py --check` → **`OK`, exit 0** tras poner los `.md` al día. **50 tablas · migración
    `72b96030362d` · 389 tests**, las tres medidas, no citadas.
  - ⚠️ **Tres tests propios fallaron primero, y el arreglo no fue cosmético.** `judicial`, `participo` y
    `se_coordina` son `String(10)`: con `"valor inventado"` Postgres los rechazaba **por largo
    (`DataError`), antes de llegar al CHECK**. El test del dominio estaba probando la longitud de la
    columna y **habría seguido en verde con el CHECK borrado**. Se cambió por `FUERA_DE_DOMINIO = "X"`,
    con el porqué escrito al lado de la constante.
  - **Lo que esta sesión NO hizo, a propósito y por acuerdo previo:**
    - **Ningún guard** — habilitación de §IX por tipo, Anexo A, «qué IDEA rige a la fecha del PAI»: todo
      **M11.3** (§5.54).
    - **I2, los nombres reales de los grupos**, que §6 tenía **asignado a M12.6**. Sigue pendiente y
      sigue bloqueado por lo mismo: no hay forma de crear ni renombrar un grupo (§2.8). Se anotó en §6
      para que el cierre de M12.6 no se lea como que quedó hecho.
    - **Endpoints de alta/renombre de `grupo`** (§2.8/§2.11 → M11.3/M11.4).
  - ⚠️ **Dos deudas que la sesión abre y deja escritas, no resueltas:** **`pai_prestacion` choca con
    §5.22** —«vigente» es diagnóstico y debería leerse en vivo, pero `organismo_bps` guarda **una sola**
    prestación en texto libre y dos de los seis ítems no son BPS— → `puntos-a-validar.md` **§2.15**, con
    las tres salidas posibles; y **`prototipo-v4-referencia.md:166` quedó con prosa que §5.55 contradice**
    —se corrige con lo que dice su propia línea `:149`—, anotado en §6.

- **2026-09-02 · Sesión R1 — reconocimiento previo a M12.6: cuatro preguntas contra el código** (Lucas +
  Claude, rama `main`, **sin tocar el modelo**). Sesión de sólo lectura para decidir si M12.6 (HCE-PAI)
  puede arrancar **en modo esquema** o sigue bloqueada. **Alcance respetado:** no se tocó `app/`, ni
  `tests/`, ni `alembic/`, ni la base; **no se levantó Docker**. El único archivo que cambia es esta
  entrada.
  - **1 — Estado medido.** `python herramientas/verificar_estado.py --check` desde el backend →
    **`OK — la documentación coincide con el repo`, exit 0**. Medido: **42 tablas** (`ateneo` 2 ·
    `catalogos` 13 · `identidad` 5 · `inclusion` 4 · `modulos` 6 · `severidad` 2 · `transversales` 10) y
    **un solo head, `aa26917b6e76`** (`aa26917b6e76_esquema_v2_inicial_m12_5.py`, `down_revision = None`,
    único archivo en `versions/`). ⚠️ **Los 307 tests NO se re-midieron:** el script los reporta como
    `NO MEDIDO — Docker abajo`, y levantar el contenedor quedaba fuera del alcance. Piso estático, que
    **no es el mismo número y no se ofrece como tal**: **223 funciones `test_`** en 7 archivos, con
    `parametrize` en 5 de ellos — la diferencia hasta 307 es expansión de casos, y sólo `pytest` la
    cuenta. **307 sigue siendo la cifra medida en M12.5, no una medición de hoy.**
  - **2 — `padronInau`, `disposicion`, `judicial` y `expediente` son campos del propio `pai`. Resuelto
    contra el código, no repetido como contradicción.** En
    `docs/prototipo-v4/HCE_IPPU_Prototipo_v4.html:450` los cuatro están declarados **dentro del literal
    `pai:{…}`** de la plantilla de paciente, con `''` de default. En el render de la sección II
    (`:1069-1076`) el prototipo usa **dos helpers distintos, uno al lado del otro**: `ro()` (`:1012`) es
    un `<input readonly>` que recibe **un valor**, sin binding — `ro(p.inau.sipi)` y `ro(p.inau.convenio)`
    (`:1071-1072`); `fecha()`, `sel()` y `txt()` (`:1013-1016`) emiten
    `onchange="getP(id).pai.<k>=this.value"`, y por ahí entran **`fecha('padronInau')`** (`:1073`),
    **`sel('disposicion',['INAU','Judicial'])`** (`:1074`), **`sel('judicial',['No','Sí'])`** (`:1075`) y
    **`txt('expediente')`** (`:1076`). **La prueba que cierra el caso es negativa:** HCE-ORG **no tiene
    dónde guardarlos** — su objeto es `inau:{sipi, convenio, referente, ingreso, obs, envios[]}` (`:447`)
    y su editor `mOrg()` renderiza exactamente esos cinco campos (`:2253-2257`). No existe origen del cual
    leerlos en solo lectura.
  - **La contradicción existe, pero no es entre dos partes del código: es entre el código y la prosa.**
    El subtítulo de la sección II dice *«N.º SIPI y convenio tomados de HCE-ORG»* (`:1069`) y **nombra
    exactamente los dos campos que son `ro()`** — es preciso. Lo que generaliza de más es la ficha de
    novedades del propio prototipo (`:2011`), que mete *«marco administrativo (II)»* entero en la lista de
    carga única *«en solo lectura»*. **`docs/markdown/prototipo-v4-referencia.md` repitió esa prosa**
    (`:166` — «las secciones I, II, VI, XI y XV se renderizan con `ro()` … modelarlas como referencias»)
    **contradiciendo su propia línea `:149`**, que ya listaba los cuatro campos bajo «Campos de cabecera
    (`p.pai`)». Por §5.50 (J1) —el código ejecutable manda sobre la prosa de la misma fuente— **los cuatro
    corresponden a columnas propias de `pai`**, y lo que sí es referencia en la sección II son **`sipi`,
    `convenio` y el diagnóstico**, nada más. **Queda para decidir por escrito en §5 al abrir M12.6**, no acá.
  - **3 — Qué se midió sobre el material que falta (evidencia, sin veredicto).** `grep` de «Anexo A» y
    «Manual de Procedimientos» sobre `app/`, `tests/` y `alembic/`: **«Anexo A» → 0 apariciones**;
    **«Manual de Procedimientos» → 1 sola**, en `app/models/modulos.py:72`, dentro de
    `PuntuacionConsensoMixin` — y ahí el Manual se cita como **fundamento de una decisión nuestra (D7,
    §5.16)**, no como fuente de forma; lo que ese párrafo dice que el Manual §23 pide (kappa) está
    **explícitamente sin implementar**. Contra eso, **«Prototipo v4» aparece 31 veces en 14 archivos** de
    `app/` y `tests/` — los siete módulos de modelos, `core/constantes.py` y cinco `test_m12_*`.
    ⚠️ **Y el Manual no está en el repo:** no hay archivo ni conversión en `docs/markdown/`; sólo lo
    mencionan otros documentos. **M12.1–M12.5 y M12.7 no pudieron construirse desde él, porque no lo
    tuvieron.**
  - **Qué es el Anexo A, medido.** `docs/markdown/apartado-especificaciones-tecnicas-prototipo-v4.md:77`,
    bajo **§6 Requisitos NO funcionales**: *«Cálculo automático de totales y deltas con verificación
    visible por el evaluador antes de firmar (Anexo A del Manual)»*. Es **un cálculo y un control previo a
    la firma** — la misma familia que el plan M12 §5.6 manda a M11.3. Ni tabla, ni columna, ni catálogo.
  - ⚠️ **Y la lista de «secciones que el prototipo no muestra» está vieja.** El prototipo **embebe una
    versión de consulta del Manual** (`const MANUAL`, `:1730`) con 12 entradas agrupadas: 1 · 2 · 3 · 5 ·
    **6–7** · 9 · 10 · **11–13** · **14–15** · **16–18** · **19–22** · **23–25**. De las trece secciones
    que se reclaman, **once están ahí en forma condensada** (§7, §12, §13, §15, §17, §18, §20, §21, §22,
    §24, §25) y **sólo §4 y §8 faltan de verdad** — no existe `id:'m4'` ni `id:'m8'`, y no hay una sola
    mención textual a «§4» ni «§8» en todo el archivo. Además, los tres catálogos del PAI —`PAI_AREAS`
    (9), `PAI_PREST` (6) y `PAI_CIRCUITO` (4), en `:947-996`— viven en la **capa de catálogos**, que es lo
    que §5.50 clasifica como normativo, y `apartado-especificaciones…md:28-51` trae el esquema de datos
    sugerido, incluido `pai_taller { pai_id, taller_nombre }`. **Esto no decide nada:** §5.28 escribió el
    bloqueo y sólo el equipo lo levanta, por escrito y en §5. Lo que esta sesión aporta es que **la
    premisa del bloqueo se puede volver a medir**, y medida da distinto.
  - **4 — Confirmado: sigue sin haber forma de crear ni de renombrar un `grupo`.**
    `app/routers/__init__.py` pesa **0 bytes** y el directorio no tiene otro `.py`;
    `app/schemas/__init__.py` pesa **0 bytes**; **`app/services/` no existe**; `app/main.py` sólo expone
    `/health`. Igual que lo midió R0 el 2026-08-26 — **nada cambió**. La única precisión que agrega esta
    sesión: **el seed sí crea filas** (`app/seed_catalogos.py:239-244`, las 4 por color, `anio 2026`),
    pero es **`solo_insertar=True`** con test que lo fija (`tests/test_m12_catalogos.py:68`), y su propio
    comentario dice *«de acá en más los administra coordinación»* — **coordinación no tiene con qué**.
    **Renombrar no tiene ningún camino, ni siquiera el seed.** `puntos-a-validar.md` §2.8 sigue
    bloqueante, como lo dejó §5.37.
  - ⚠️ **Un hallazgo adyacente que esta sesión NO corrige, a propósito (fuera de alcance):**
    `tests/test_m12_catalogos.py:60` (`test_el_seed_trae_los_cuatro_grupos_por_color`) todavía **afirma
    como correctos los cuatro nombres por color** que **§5.37 (I2) declaró datos de demostración**, y
    `app/data/catalogos_iniciales.json` los sigue sembrando. Es exactamente el `UPDATE` + regeneración que
    §5.37 dejó costeado y sin hacer. **Queda anotado, no tocado.**
  - **Verificación:** `python herramientas/verificar_estado.py --check` → **exit 0**. No se corrió
    `pytest` (Docker abajo, por alcance). No se tocó ninguna tabla, migración ni test.

- **2026-08-26 · Sesión H1 — higiene del repositorio, sin tocar el modelo** (Lucas + Claude, rama
  `chore/higiene-2026-08-26`, **sin mergear y sin pushear**). Sesión de mantenimiento entre M12.5 y M12.6.
  **Alcance respetado:** no se tocó `app/models/`, ni `alembic/`, ni una fila de catálogo; no se corrió
  `alembic revision|upgrade|downgrade|stamp`. El único código que cambió es el `print()` del seed.
  - **El punto de partida se midió, no se citó.** **42 tablas · 307 passed / 0 skipped · head
    `aa26917b6e76`** — coincide con lo que el encabezado afirmaba, que era lo que había que confirmar.
  - **1 — El mapa del repo estaba viejo.** `verificar_estado.py --check` daba **DESFASADO** en tres puntos,
    los tres en `docs/estructura-repositorio.md`: nombraba la migración `9246e659d2c9` (la de M12.7),
    decía «38 tablas» en dos lugares, y no tenía `app/models/inclusion.py` ni
    `tests/test_m12_inclusion.py`. Corregido y **`--check` en verde**. ⚠️ **Se preservó** el cambio que
    otra sesión había dejado sin commitear en ese mismo archivo desde el 21/08 (la entrada del borrador de
    color): las correcciones fueron **encima**, no en lugar de él.
  - **2 — Los prompts sueltos, versionados.** Tres estaban sin versionar (R0, pre-review del harness, y el
    de la sesión del harness que era un `.txt` con espacios y tilde en el nombre). Se commitearon y se
    normalizaron los nombres a `prompt-<qué>-<cuándo>.md`, **la convención que ya estaba escrita** en
    `docs/prompts/README.md`. Se completaron además dos renombres a medias (D1 y M12.5), con `git mv` para
    que `git log --follow` los siga. **Ni una línea de contenido cambió**, y no queda ninguno sin versionar.
  - **3 — `.gitattributes`, y la hipótesis salió al revés.** Se agregó (`text=auto` + `eol=lf`), pero
    **`git add --renormalize .` movió 0 archivos: el índice ya estaba 100 % LF** (103 de 103). Lo que
    cambió es el árbol de trabajo — **62 archivos de CRLF a LF**. ⚠️ **Y el ruido recurrente de
    `prompt-sesion-pre-reunion-2026-08-20.md` en `git status` NO era CRLF:** verificado línea por línea,
    sus 14 líneas «modificadas» eran **idénticas salvo barras invertidas multiplicadas**
    (`\*\*` → `\\\\\\\*\\\\\\\*`) — una herramienta reescapando markdown. Se revirtió al estado
    commiteado. Lo que **sí** era CRLF era peor de leer: el renombrado del prompt de D1 se diffeaba como
    **574 líneas cambiadas** con el contenido idéntico.
  - **4 — El seed ya no rompe en Windows.** `python -m app.seed_catalogos` —**paso 4 del arranque rápido**,
    §0— terminaba en `UnicodeEncodeError` en una consola **cp1252**: el `Δ` que trae `_origen` (la
    interpretación del Δ del Protocolo A→B). El `commit()` ya había pasado, así que **el seed corría y
    quien lo corría veía un traceback donde tenían que ir los conteos**. Se arregló **la impresión, no el
    dato**: `_preparar_salida()` decide **una vez por corrida** (reconfigurar recién al fallar deja dos
    codificaciones en el mismo archivo redirigido, que es peor porque no se nota). Verificado con
    `PYTHONIOENCODING=cp1252`: antes exit 1, después **dos corridas seguidas en exit 0 y 0/0 en los 17
    catálogos**. `pytest -q`: **307 passed, 0 skipped**.
  - **5 — Registro.** **§5.53 (K1)**: el Google Doc del equipo **está vacío** —lo confirmó Lucas
    mirándolo—, así que **se retira su designación de artefacto autoritativo** (§5.34) y los dos pendientes
    que colgaban de él se cierran **por inexistencia del destino, no por haberse hecho**. §5.34 no se
    editó: §5 es append-only. **§6 estrena la lista «DECIDIDO, SIN IMPLEMENTAR»** con **I1** (el IDEA es
    anual y `idea` no tiene `anio`) e **I2** (los nombres reales de los grupos, y el seed sigue plantando
    los colores), porque §5 dice qué se decidió y §6 qué falta hacer, pero **nada decía «hoy el código
    afirma lo contrario»**. En el acta del 21/08 se anotaron los **presentes**, que estaban en «sin
    registro»: **Boris Furtado, Victor Uria, Lucas Pimentel y Matías López**, más la dirección de IPPU —
    **Boris es una sola persona** (§5.32), no se lo cuenta dos veces.
  - **6 — Encuadre de presentación a terceros, corregido.** El acta y `puntos-a-validar.md` decían «si el
    trabajo se presenta a INAU, eso se dice»; PLAN-M12 decía «para rendir ante INAU no da lo mismo».
    **Nosotros construimos la HCE para IPPU y no tenemos contacto con otras instituciones**: si IPPU le
    muestra el sistema a INAU, eso es de IPPU, y no nos genera obligaciones de documentación. Lo que **sí**
    es obligación nuestra —decirle a IPPU que **el kappa del Manual §23 no es calculable** con la práctica
    actual (§5.47)— quedó **más fuerte, no más flojo**. **No se tocó `consulta-a-ippu.md`** (es el snapshot
    palabra por palabra de lo enviado el 19/08) ni §5.25/§5.47.
  - ⚠️ **Lo que esta sesión NO hizo, a propósito.** **No se implementó I1 ni I2** — están decididas y
    tienen sesión asignada. **No se firmó** `docs/notas/borrador-color-y-significado-clinico.md`: se leyó,
    se resumió en el chat y **se versionó tal cual con su banner intacto**, porque el mapa del repo ya lo
    describía y un puntero a un archivo que sólo existe en un disco es peor que no mencionarlo (§12.1).
    ⚠️ **Su condición de retiro NO se cumple**: sigue sin firmar, y encima **pide el número §5.36, que ya
    está ocupado por I1** desde el 26/08. **No se mergeó ni se pusheó nada.**
  - **Verificación:** `verificar_estado.py --check` **en verde** · `pytest -q` **307 passed, 0 skipped** ·
    seed corrido dos veces en exit 0 · `git status` limpio. **Commits separados por asunto**, con el de
    `.gitattributes` aparte para poder revertirlo solo.

- **2026-08-26 · M12.5 — HCE-INC · Inclusión educativa y social** (Lucas + Claude, rama
  `backend/M12.5-hce-inc`, **sin mergear y sin pushear**). Primera sesión que **toca el backend desde el
  2026-08-15**: las tres del medio (limpieza y pivote, pre-reunión, D1) fueron documentación.
  - **Los números, medidos y no citados.** Antes: **38 tablas · 240 passed / 0 skipped · head
    `9246e659d2c9`** (verificados al arrancar, no tomados del encabezado). Después: **42 tablas ·
    307 passed / 0 skipped · head `aa26917b6e76`**. **+4 tablas, +67 tests.** `--check` del generador de
    catálogos en verde. Reconstrucción limpia hecha: `DROP SCHEMA` → `alembic upgrade head` →
    `seed_catalogos` (idempotente, corrido dos veces).
  - **Qué se construyó.** `inclusion` (ficha, 0..1 por expediente) · `inclusion_bitacora` (gestiones) ·
    `estado_inclusion` (catálogo, 7 filas) · `catalogo_centro_educativo` (catálogo, **0 filas**).
  - **Tres decisiones, escritas ANTES de modelar** — §5.50 (J1), §5.51 (J2), §5.52 (J3). Las dos primeras
    la consigna las pidió explícitamente; la tercera la dejó marcada el plan.
  - **De los 5 catálogos del prototipo, sólo 1 quedó como tabla.** `INC_ESTADOS` tiene atributos propios
    (descripción + semáforo) y el módulo lo consulta por sí mismo → tabla, como `severidad_nivel`.
    `INC_TIPOS`, `INC_TEMAS`, `INC_MEDIOS` e `INC_ROLES` son listas planas sin atributos → constantes con
    CHECK, y los CHECK **se generan desde la constante**, no se transcriben (`_dominio()`), con un test
    parametrizado que impide que se separen — el recurso que M12.7 dejó probado.
  - **Un dominio que ningún documento del repo registraba.** `at` (asistente personal) tiene **tres**
    valores —`No` · `Sí` · `En trámite (lista de espera)`— escritos **inline en el `<select>`** de
    `mInc()`, sin nombre de constante. Ni `PLAN-M12 §M12.5` ni `prototipo-v4-referencia.md` §6 lo dicen:
    los dos listan `at` como un campo más. Apareció **porque la regla de §5.50 obliga a clasificar por
    dónde vive el dato**, y ese caso no entraba en ninguna de las dos categorías de §5.37.
  - **La prueba negativa que cerró la Decisión A.** El prototipo **no tiene ni una fila de datos de
    inclusión**: `nuevoPaciente()` crea `inc:{centro:'', …, estado:'Sin registrar', bitacora:[]}` y
    ninguno de sus pacientes la llena. Los 5 catálogos **no pueden** ser relleno de demo, porque la demo
    no renderiza ninguno.
  - **La regla se aplicó contra nuestro propio relleno, y ése fue el caso más útil.**
    `catalogo_centro_educativo` **se siembra vacío**: los 6 nombres de escuela que existen están en
    `demo/js/inclusion.js` (`INC_SEED`) y son nuestros, no de IPPU. Sembrarlos era §5.37 otra vez, con
    otro sujeto. Hay test que lo fija.
  - **`id` propio en `inclusion` en vez de `hce_id` como PK — y no es cosmético.** `severidad_dsm` usa
    `hce_id` como PK; acá no, porque **esta ficha tiene tabla hija**. Con la PK en `hce_id`, anualizar
    obligaría a repuntar cada fila de la bitácora; con `id` serial, anualizar es **soltar un `UNIQUE`**.
    La decisión de forma la eligió la decisión de fondo (§5.51).
  - **Divergencias declaradas con la fuente, para que nadie las «arregle»:** (a) `at` **nace NULL**, no
    en `'No'` como el prototipo — «no tiene acompañante» es una afirmación sobre el NNA y un formulario
    en blanco no la hace; (b) el semáforo se guarda como `warn`, no como la clase CSS `inc-warn`;
    (c) `tema` es **NOT NULL**, la única obligación que agregamos sobre lo que valida `incAdd`, porque
    con NULL la derivación de `sensible` devolvería el valor peligroso por omisión — y es gratis porque
    la bitácora **no tiene backlog de migración**: los reportes históricos del área van a HCE-DOC, lo
    dice el propio prototipo; (d) `timestamp` del plan se llama **`registrado_en`** (`timestamp` es un
    nombre de tipo en SQL).
  - **`demo/js/inclusion.js` se leyó en modo lectura y no se tocó.** Lo que **IPPU vio el 21/08 fue sólo
    el tablero**: la demo no implementa la ficha ni la bitácora (lo dice su propio encabezado). Las
    9 columnas del tablero están todas cubiertas por el modelo. Divergencia anotada: el tablero de la
    demo filtra `n.activo !== false` y el del prototipo no — **es una decisión de M11.3/M11.4**, no del
    modelo, y queda escrita para que se tome a propósito.
  - ⚠️ **Lo que esta sesión NO hizo, a propósito.** No se abrió M12.6. No se implementó el IDEA anual
    (I1 está escrito; §5.35 pone su puerta antes de M11.3). No se construyó capa de divulgación —es más
    grande que este módulo y §5.39 la pone antes de M11.3/M11.4—, así que `sensible` queda como
    **clasificación sin efecto**, dicho en su docstring. No se re-verificaron los catálogos que §5.50
    lista como deuda: **se listan, no se auditan**.
  - **Verificación:** `pytest -q` → **307 passed, 0 skipped** · `generar_catalogos_backend.py --check` →
    OK · `verificar_estado.py --check` → quedan **3 líneas desfasadas y ninguna es de esta sesión**:
    están en `docs/estructura-repositorio.md`, que **está modificado en el working tree por otra sesión**
    y que la consigna prohíbe tocar. Las de `README.md` y `backend/README.md` sí se actualizaron.

- **2026-06-30** — Setup inicial: conversión de documentos, lectura de contexto, arquitectura de carpetas, creación de `handoff.md`/`CLAUDE.md`/`README.md`, e inicialización de git + push a repo privado `IPPU-UTEC`. (Lucas + Claude)
- **2026-06-30** — Demo L1 extendida a v3.1: agregados los módulos Grupos, Usuario, Evaluación por áreas y Evaluación general (las dos evaluaciones, provisionales). JS validado con `node --check`. Commiteado y pusheado (`cbb3119`). (Lucas + Claude)
- **2026-07-01** — Creado el proyecto **privado** en el **GitLab de UTEC**: `juan.pimentel/IPPU-UTEC` (https://git.utec.edu.uy/juan.pimentel/IPPU-UTEC), vía API v4 con PAT de un solo uso (ya revocable). Agregado remoto local `gitlab` (se mantiene `origin`=GitHub) y push de `main` (`cbb3119`). SSH:22 bloqueado → HTTPS. PAT usado de forma efímera (archivo borrado, no cacheado en `.git/config` ni credential helper). (Lucas + Claude)
- **2026-07-01** — Demo L1 **v3.2**: agregados inicio de sesión (usuario pre-creado), barra de búsqueda en inicio (nombre/apellido, N.º de HCE, cédula), distinción activos/inactivos (filtro + alta/baja desde el expediente) y paso de Anamnesis en el alta de NNA. Verificado con Playwright headless (19/19). Commit `bfd063c` sin trailer de co-autoría (a pedido), aún **sin pushear** a GitLab. (Lucas + Claude)
- **2026-07-01** — Demo L1 **v3.3**: listado simplificado (HCE/CI/Nombres/Apellido/Estado); editar NNA; evaluaciones movidas del sidebar a botones en el expediente (Anamnesis · IDEA · Intermedia · Áreas · General); vista Pendientes; IDEA anual (selector por año, KPIs/seguimiento anuales); informe por NNA con descarga Imprimir→PDF y guía de interpretación embebida. Verificado con Playwright (27/27 + generación de PDF). **Sin commitear todavía** — el push/commit a GitLab lo resuelve Lucas. (Lucas + Claude)
- **2026-07-08** — **Arranca el backend (L1).** Decidido stack: **FastAPI + SQLAlchemy + Alembic**, SQLite→Postgres. En `implementacion/L1-hce-idea/backend/`:
  - **Fase 0:** esqueleto FastAPI (`app/main.py`, `/health`, `/docs`), venv + `requirements.txt`, config por `.env`. Verificado (levanta y responde).
  - **Fase 1:** **esquema de datos** diseñado, documentado (`backend/docs/esquema-datos.md` + explicación en lenguaje simple) y con **diagrama ER interactivo** (Artifact, 18 tablas). Modelos núcleo + provisionales (áreas/general, "tablas rígidas como la demo") + **`observacion`** (pestaña de la HCE: fecha/autor/texto). 3 migraciones Alembic (21 tablas de datos). Seed con datos simulados de la demo. Verificado: `total` IDEA = suma de dimensiones.
  - **Fase 2:** **20 endpoints CRUD** en 5 routers (NNA con búsqueda/estado, IDEA, Likert, observaciones, eventos, catálogo, personas). Schemas Pydantic con validación (IDEA 0–8 y 12 dimensiones; `total` y `equivalente_idea` calculados en servidor; 409 en duplicados/CI; ejemplos en Swagger para "Try it out"). Swagger en `/docs`. **12 tests pytest en verde** (base SQLite aislada) + reporte `backend/docs/ejemplos-endpoints.md` (request/response de cada endpoint).
  - **Commit + push:** todo el backend commiteado en `8d0ce55` (42 archivos) y **pusheado a GitHub** (`origin`, `cbb3119..8d0ce55`). En el mismo push subieron los commits de demo v3.2/v3.3 que estaban locales. **`ippu.db`, `.venv` y `.env` NO se versionan** (gitignore). **Falta pushear a GitLab** (`git push gitlab main`, lo resuelve Lucas por credenciales). Próximo: **Fase 3** (conectar la demo a la API). (Lucas + Claude)
- **2026-07-15** — **Ronda de adaptación al Documento Técnico IPPU v1.0 · M0 (housekeeping).** IPPU envió el Documento Técnico v1.0 (jul-2026), el prototipo `HCE_IPPU_Prototipo_v1.html` y una propuesta de datos (`modelo-datos.md`); Claude Web generó el plan `docs/planes/PLAN-modular-adaptacion-HCE-2026-07.md` (M0–M11). **M0 hecho:**
  1. **Archivos:** fuente normativa ubicada en `docs/markdown/1_documento-tecnico-utec-lidia.md` (nombre canónico del plan); prototipo archivado en `docs/fuentes/HCE_IPPU_Prototipo_v1.html`; `modelo-datos.md` en `docs/markdown/`. **Docling no se corrió sobre el prototipo:** es una app JS (la conversión rinde solo el shell estático) y sus reglas ya están como markdown en el Doc. Técnico §5/§8; queda como referencia HTML interactiva (§11). Si se quisiera la conversión, se corre aparte.
  2. **`handoff.md`:** actualizados foco y fuente normativa (cabecera), registradas las 6 decisiones del plan §0 (nueva §5.1) y depurada §7 (sacadas las resueltas: stack backend y BD).
  3. **Demo:** ocultados los botones "Eval. por áreas" y "Eval. general" del expediente (`hce_idea_ippu_demo.html`, línea ~1821). Código y vistas conservados, solo se dejan de exponer (decisión §5.1.2); se resuelven como archivo histórico en M7.
  - **Verificación:** Playwright headless — la demo carga sin errores de consola y los botones ocultos ya no están en el DOM (los de Anamnesis/IDEA/Intermedia siguen presentes).
  - **Sin commitear** (commit/push los resuelve Lucas). **Próximo: M1** — motor de flujo (estado `bloqueado|borrador|firmado`, firma=bloqueo, addenda, habilitación excepcional, mock HCE-LOG), a revisar antes de construir. (Lucas + Claude)
- **2026-07-15** — **M1 · Motor de flujo (demo v3.5).** Construido sobre `hce_idea_ippu_demo.html` (sin tocar backend). Infraestructura compartida por CI/LB/PA/PB/IC:
  - **Modelo:** por NNA, `flujo={ci,lb,pa,pb,ic}` (cada uno `{firmado, firmas[], addendas[], excepcion}`) + `hceLog[]`. El estado visible (`bloqueado|borrador|firmado`) es **derivado** (sin drift): firmado si `firmado`; borrador si habilitado por secuencia; si no, bloqueado.
  - **Reglas (§4):** `moduloHabilitado()` implementa la secuencia CI→LB→PA→PB→IC; **CI firmado es requisito no exceptuable** (sin él, LB/PA/PB/IC quedan bloqueados y sin opción de excepción). Firma = bloqueo; corrección posterior = **addenda** (no edición directa). **Habilitación excepcional** con constancia obligatoria → pasa bloqueado→borrador y se registra en HCE-LOG (nunca oculta).
  - **UI:** tarjeta "Flujo de módulos" en el expediente (stepper + filas con badge y acciones firmar/addenda/habilitar) + **vista HCE-LOG** (solo lectura, no persistente). Helpers `estadoBadgeM`, `stepperHtml`, `flujoPanelHtml`, `renderFlujo`; modal reusable `#modalFlujo`. La `eval-bar` (Anamnesis/IDEA/Intermedia) queda intacta (se recablea en M2–M6). Firma con **hook de integridad vacío** `validarIntegridad()` (lo llenan M4–M6); el botón "Editar" es stub.
  - **Seed:** los 8 NNA con `flujo`+`hceLog`; los **4 arquetipos §11** = Martín(102) ciclo completo firmado · Sofía(101) CI+LB firmados/PA borrador · Joaquín(104) CI firmado/LB borrador · Bruno(107) CI pendiente/todo bloqueado. Otros (103/105/108) con CI+LB firmados para dar variedad.
  - **Verificación:** Playwright headless — **14/14 checks en verde**, incl. el caso de aceptación (PA sin LB → habilitación excepcional → firma → excepción y firma visibles en HCE-LOG), la regla dura de CI, la regresión de M0 y 0 errores de consola; + 2 screenshots revisados. **Sin commitear.** Próximo: **M2+M3** — HCE-00 (Identificación/Anamnesis, siempre abierto) + HCE-CI (Consentimiento, único bloqueo sin excepción). (Lucas + Claude)
- **2026-07-15** — **M2 + M3 · HCE-00 y HCE-CI (demo v3.5).** Sobre `hce_idea_ippu_demo.html`.
  - **M2 · HCE-00 (Identificación y anamnesis, siempre editable):** nuevos campos en el modelo — `cie11`, `tecnico1`/`tecnico1_rol` + `tecnico2`/`tecnico2_rol` (roles fijos Psicólogo/a + Maestro/a, §0.5) — con backfill de los 8 NNA. Agregados al wizard (paso 2: CIE-11 + 2.º técnico), a `openEditar` y a `crearNNA`. En el expediente: tarjeta "HCE-00 · Identificación y datos clínicos" con badge **"Siempre abierto"**, CIE-11, nivel de soporte y los 2 técnicos; anamnesis rotulada HCE-00; botón "✎ Editar HCE-00" siempre disponible. Al guardar la edición se registra un evento `edicion` en HCE-LOG (módulo `hce00`). Verificado: editar HCE-00 de un NNA con LB/PA/PB/IC firmados **no** altera los módulos firmados.
  - **M3 · HCE-CI (Consentimiento, único bloqueo sin excepción):** el bloqueo ya lo dejó M1; ahora el CI tiene formulario propio — firmante, fecha, **3 autorizaciones** (evaluación / registro / comunicación a organismos) y **adjunto mock** — guardadas en `flujo.ci`. Vista de detalle `verCI` (botón "Ver" en el panel cuando el CI está firmado). Seed de CI con autorizaciones/adjunto.
  - **Fix de un bug latente de M1:** los NNA creados por el alta *después* de la carga ahora reciben `flujo`+`hceLog` (antes, abrir su expediente rompía).
  - **Verificación:** Playwright — **18/18 (M2+M3) en verde** + regresión M1 **14/14** + 2 screenshots revisados; 0 errores de consola. **Sin commitear.** Próximo: **M4** — HCE-LB (IDEA como línea base única): el más delicado, cambia la lógica anual y toca datos seed existentes. (Lucas + Claude)
- **2026-07-15** — **M4 · HCE-LB: IDEA como línea base única (demo v3.6).** El módulo más delicado — cambia de arquitectura, no solo de nombre.
  - **Quitada la lógica anual:** selector de año (`selPeriodo`), KPI/Pendientes por año y el `guardarIDEA` que apilaba entradas anuales en `historial`. El IDEA vive ahora en **`flujo.lb`** como instancia **única** (payload: `dim[12]` (0–8 | 'NS' | null), `obs[12]`, `fecha`, `sesiones`, `sintesis`, `objetivos`, `migrado`). Regla de reingreso (>12 meses) = nueva instancia de LB.
  - **Editor IDEA reconectado:** carga/guarda la LB del NNA (sin año), soporta **NS** por dimensión (`lbTotales` la excluye y bloquea la firma), y agrega sesiones de observación, síntesis, objetivos y marca "migrado". "Firmar línea base" pasa por el motor de M1 (`firmarModulo(id,'lb')`) con **firma doble** y queda read-only al firmar. En el panel de flujo, "Editar IDEA" (borrador) abre el editor y "Ver" (firmado) abre `verLB`.
  - **Validación de integridad (§4.3):** se llenó el hook de M1 para `lb` — 12 dim sin NS + fecha + síntesis + objetivos (bloqueantes).
  - **Migración del seed (calcada al prototipo, criterio de aceptación):** Martín(102) = usuario demo 1 → **total 58**, escalas 18/14/14/12; Sofía(101) = demo 2 (31); Joaquín(104) = demo 3 (borrador con NS en D3/D12); otros con IDEA generado. KPI "Con línea base IDEA", vista Pendientes y tarjeta del expediente reescritas al modelo único. `generarInforme` ajustado al modelo único (rework completo = M6).
  - **Verificación:** Playwright — **17/17 en verde**, incl. el **criterio de aceptación §12-A** (reproducir usuario demo 1: total IDEA 58, escalas 18/14/14/12), NS bloquea la firma, flujo completo de firma de LB, `verLB`, tarjeta del expediente; + regresión M0–M3 (M1 14/14 · M2+M3 18/18) y 0 errores de consola. Screenshots revisados. **Sin commitear.** Próximo: **M5** — HCE-PA/PB (Escala IPPU-TEA: 24 ítems Likert 1–5, delta B−A, y la **regla dura de no-homologabilidad** IDEA vs. IPPU-TEA). (Lucas + Claude)
- **2026-07-15** — **Commit + push M0–M4 y sincronización de remotos.** Dos commits en `main`: `268f1de` (docs: documento técnico, prototipo, modelo-datos, plan) y `72df9a9` (feat demo M0–M4, v3.6). GitLab tenía un commit de un compañero (`08e93ba` Edit README.md) → integrado con **merge** (`0ab7610`, sin conflicto) y **pusheado a los dos remotos**: GitHub `origin` y GitLab `gitlab` ahora en `0ab7610`. (Ya **no** falta pushear a GitLab.) Hay además una rama `feature/base-datos-hce` en GitLab (WIP de un compañero, no tocada). (Lucas + Claude)

- **2026-07-29** — **M5 · HCE-PA/PB: Escala IPPU-TEA completa (demo v3.7).** Cierre de los 4 sub-módulos del checkpoint (M5.1 venía de la sesión anterior):
  - **M5.1 — Datos y lógica:** `IPPU_ITEMS` (24, 4×6), `LIKERT_LBL`, payload `flujo.pa/pb` (`kind:'protocolo'`, `item[24]`, `obs[24]`, `fecha`, `semanas`, `sintTec1/2`, `otros`; `pb.deltas`/`ajustes`), `flujo.lb.kind='idea'`, `protTotales`, `calcularDelta` (guard de no-homologabilidad: lanza error si recibe algo que no sea `kind:'protocolo'`), `deltaInterpreta`, `ALERTA_DELTA=-7`, seed PA/PB (Martín A+B firmados = usuario demo 1: PA 60 / PB 79 / Δ +19; Sofía PA borrador).
  - **M5.2 — Editor PA/PB:** vista única `view-prot` parametrizada A|B (tabs), 24 ítems con las clases CSS que ya había dejado M5.1 (`.prot-esc/.prot-item/.lik-btn/.prot-obs`; ojo: existían y estaban `display:none` por defecto — la obs sólo se muestra si el ítem vale 1/5, obligatoria con marca roja, o si ya tiene texto). Campos fecha/semanas/síntesis 1 y 2/otros (+ ajustes sólo PB); `cargarProt/guardarProt/firmarProt` por el motor M1; validación §4.3 en `validarIntegridad` (24 ítems + obs en 1/5 + fecha + 2 síntesis; semanas<15 advierte sin bloquear); aviso de bloqueo con motivo; read-only al firmar; des-stub de "Editar Protocolo A/B" en el panel de flujo.
  - **M5.3 — Delta/alerta/Ver:** `calcularDeltasPB` en `confirmarFirma` (al firmar B: delta B−A automático; sin PA firmado → `deltas=null` + constancia en HCE-LOG); alerta institucional Δ≤−7 por escala (evento `alerta` en HCE-LOG, tag `lt-alerta`, + toast diferido); `verProt` (detalle firmado: totales por escala, deltas con interpretación y ⚠, síntesis, ajustes, nota de no-homologabilidad, addendas) con botón "Ver" en el panel; **quitado "Eval. intermedia" de la eval-bar** (reemplazada por accesos a Protocolo A/B; el código de la vista se conserva sin exponer, como áreas/general).
  - **M5.4 — Verificación y cierre:** **Playwright 39/39 en verde** (obs 1/5 bloquea la firma, delta automático al firmar B, Δ≤−7 dispara alerta, PB sin PA → sin delta con constancia, guard rechaza la LB, Martín/Sofía/Bruno por arquetipo, regresión M0–M4 incl. criterio §12-A IDEA=58) + 4 screenshots revisados; bump a **v3.7**.
  - **Commit + push:** `1facc1c` (incluye el M5.1 que había quedado sin commitear) pusheado a **ambos remotos** (GitHub `origin` y GitLab `gitlab`, sin conflictos). **Próximo: M6** — HCE-IC (Informe de Cierre Anual: requiere LB+PA+PB firmados, tabla comparativa + radar SVG reimplementado, firma doble + "Recibí" de la familia, PDF vía `@media print` — "el único informe válido"). (Lucas + Claude)

- **2026-07-30** — **M6 · HCE-IC: Informe de Cierre Anual (demo v3.8).** Sobre `hce_idea_ippu_demo.html`, por el motor de M1.
  - **Modelo:** payload en `flujo.ic` — `fecha`, `sintEsc[4]` (síntesis por escala), `valTec1/valTec2` (valoraciones anuales), `recomendaciones`, `orientaciones`, `recibi` (`{firmante, fecha}`, se registra después de la firma).
  - **Editor `view-ic`** (mismo patrón que PA/PB): tabla comparativa IDEA/PA/PB/Δ y **radares SVG propios** (`radarSVG` reimplementado, no copiado del prototipo) **autogenerados sólo desde módulos firmados** (`icDatosFirmados`/`icTablaHtml`/`icRadaresHtml`); módulos sin firmar aparecen como "—". Regla dura §5.2 respetada: IDEA e IPPU-TEA **siempre en radares separados**, delta sólo el que calculó el motor al firmar B. Read-only al firmar.
  - **Validación §4.3** (en `validarIntegridad`): 4 síntesis por escala + valoraciones de ambos técnicos + recomendaciones + orientaciones + fecha (bloqueantes); ≈100 palabras por escala advierte sin bloquear. Firma doble vía `firmarModulo(id,'ic')`.
  - **«Recibí» de la familia:** modal propio (`openRecibiModal`/`confirmarRecibi`), sólo con IC firmado, con constancia en HCE-LOG; visible en el panel de flujo (meta + botón) y en el pie del informe.
  - **`generarInforme` reescrito ("el único informe válido", §5.3):** el PDF con membrete (FUNDACIÓN IPPU, datos del NNA, análisis cuantitativo con tabla+radares, cualitativo por escala, síntesis interdisciplinaria, recomendaciones, orientaciones, addendas, firmas + Recibí, leyes 18.331/18.335) se genera **únicamente desde el HCE-IC firmado**; sin IC firmado se muestra el estado del flujo (stepper) sin versiones alternativas. Descarga vía Imprimir→PDF (`@media print` ya existente).
  - **UI:** fila IC del panel de flujo des-stubeada (✎ Editar Informe / Ver informe / ✍ Recibí); botón "Informe de Cierre (IC)" en la eval-bar; botones del expediente renombrados a "Informe de Cierre Anual". Seed: Martín (102) con IC completo calcado del usuario demo 1 del prototipo (sintEsc con Δ +4/+6/+4/+5, Recibí 2026-12-19).
  - **Verificación:** Playwright — **35/35 en verde**: informe de Martín (membrete, IDEA 58/96 §12-A, PA 60/PB 79/Δ +19, 2 radares separados, PDF), ciclo completo de firma del IC en NNA 103 (integridad §4.3 bloquea incompleto → firma doble → HCE-LOG → Recibí), habilitación excepcional (105) con "—" en no firmados, informe inexistente sin IC firmado (101), regresión M0–M5 (CI no exceptuable, guard de no-homologabilidad, áreas/general/intermedia ocultas) y 0 errores de consola; + screenshots y PDF revisados (fix: etiquetas del radar ya no se recortan).
  - **Commit + push:** `1698b5f` a **ambos remotos** (GitHub `origin` y GitLab `gitlab`). **Próximo: M7** — HCE-DOC (documentos y fotos: adjuntos categorizados, fotos condicionadas a autorización de imagen, y migración simulada de áreas/general a "Registro histórico — HCE anterior" que resuelve formalmente el descarte de M0). (Lucas + Claude)

- **2026-07-30** — **M7 · HCE-DOC: Documentos y fotos (demo v3.9).** Sobre `hce_idea_ippu_demo.html`.
  - **Panel HCE-DOC en el expediente** (`docPanelHtml`/`docBodyHtml`/`renderDoc`): tabla de adjuntos (nombre, categoría —12 del prototipo—, fecha original, fecha de carga), adjuntar/quitar con constancia en HCE-LOG (`MOD_LABEL.doc="HCE-DOC"`). Modelo por NNA: `docs[]`, `fotos[]`, `autImagen{registrada,fecha,adjunto}`; las altas nuevas los inicializan (`crearNNA`).
  - **Archivo histórico (§10):** categorías "Registro histórico — HCE anterior (Eval. por áreas / Eval. General / Observaciones / otro)" quedan **de solo lectura** (`quitarDoc` las rechaza; 🔒 en la tabla; fecha original visible). **Resolución formal del descarte de M0 (§0.2):** se **eliminaron** las vistas y el código de "Eval. por áreas" y "Eval. general" (ocultas desde M0); sus registros del sistema anterior viven como documentos históricos seed (Martín, Sofía, Valentina).
  - **Protección de imagen (§8.4) como regla de lógica, no de UI:** sin `autImagen.registrada`, `subirFoto()` se bloquea aunque se invoque directo, con mensaje claro (art. 11 CNA — Ley 17.823). Registro de autorización por modal → adjunta copia en docs (categoría "Autorización / consentimiento") + constancia en HCE-LOG. **Fotos grupales** en la vista Grupos: exigen autorización de **todas** las familias de los integrantes **activos** del grupo; el sistema informa qué integrantes faltan (`grupoAutImagen`/`subirFotoGrupo`, también bloqueado a nivel de lógica).
  - **Seed:** Martín(102) aut. registrada + informe externo + 2 históricos + 1 foto · Sofía(101) **caso negativo** (sin autorización) + histórico · Valentina(103) aut. + histórico → Grupo C queda habilitado para foto grupal (Tomás 106 no cuenta: inactivo).
  - **Verificación:** Playwright — **25/25 en verde**: caso negativo §8.4 por UI y por llamada directa, registro de autorización habilita la carga, histórico inmutable, fotos grupales bloqueadas con integrantes nombrados, y regresión M0–M6 (áreas/general eliminadas, §12-A IDEA=58, guard de no-homologabilidad, informe IC intacto, Bruno todo bloqueado); 0 errores de consola; screenshots revisados.
  - **Commit + push:** `11bc116` a **ambos remotos**. **Próximo: M8** — HCE-ORG (áreas INAU y BPS por NNA: SIPI/convenio/referente + registro de informes enviados; prestación/trámite/estado/vencimiento + registro de gestiones). (Lucas + Claude)

- **2026-07-30** — **M8 · HCE-ORG: Áreas INAU y BPS (demo v3.10).** Sobre `hce_idea_ippu_demo.html`.
  - **Panel HCE-ORG en el expediente** (`orgPanelHtml`/`orgBodyHtml`/`renderOrg`), dos columnas por NNA: **INAU** (SIPI, convenio, referente territorial, ingreso, obs + tabla de **envíos** de informes/comunicaciones) y **BPS** (prestación, trámite, estado con color + vencimiento, obs + tabla de **gestiones**). Modelo por NNA: `inau{...envios[]}` / `bps{...gestiones[]}`, inicializado en backfill y `crearNNA`.
  - **Registros:** alta con fecha+detalle obligatorios y quita, ambas con constancia en HCE-LOG (`MOD_LABEL.org="HCE-ORG"`). Edición inline de campos (`orgSet`) persistente al re-render. Copy: documentación respaldatoria → HCE-DOC; informe a organismos = **documento único HCE-IC** (§5.3); nota de alertas sugeridas (AYEX 60/30 días → recordatorios M10).
  - **Seed:** Martín(102) convenio INAU completo + 2 envíos (incl. IC 2026) + AYEX vigente con vencimiento 2027 · Sofía(101) AYEX en trámite + 1 gestión · Joaquín(104) ingreso reciente sin envíos.
  - **Verificación:** Playwright — **20/20 en verde**, incl. el criterio del plan (alta de envío INAU y gestión BPS visibles en el expediente), validación fecha+detalle, quitar con log, y regresión M0–M7 (§12-A IDEA=58, guard, informe IC, regla de imagen §8.4, áreas/general fuera); 0 errores de consola; screenshot revisado.
  - **Commit + push:** `f4b2884` a **ambos remotos**. **Próximo: M9** — HCE-VF (valoración funcional BUND/CIF: registro oficial, tabla de categorización **parametrizable** (§0.4), perfil CIF de 6 dominios, **salvaguarda dura** anti-conversión desde puntajes clínicos, autogeneración descriptiva y Reporte de Valoración Funcional imprimible). (Lucas + Claude)

- **2026-07-30** — **M9 · HCE-VF: Valoración funcional BUND/CIF (demo v4.0).** Sobre `hce_idea_ippu_demo.html`.
  - **Panel HCE-VF en el expediente** (`vfPanelHtml`/`vfBodyHtml`/`renderVf`): registro de la valoración oficial (estado/fecha/organismo/%/vigencia/RNPcD; "IPPU registra, no certifica", §7.1; <2 años sólo IBMF/IRSA), **categoría derivada de `BUND_CATS`** (tabla **parametrizable**, constante única, §0.4 — cortes a confirmar por IPPU contra el anexo del Decreto 72/025) y **alerta de vigencia** 90/30 días + vencida (§7.8, `vfAlertaVigencia`).
  - **Salvaguarda dura (§7.5) a nivel de lógica:** `categoriaBaremo()` **lanza error** si recibe cualquier cosa con forma de instrumento clínico (`flujo.lb`, `lbTotales`, protocolo, `protTotales`) — mismo patrón que el guard `calcularDelta` de M5. La categoría sale únicamente de `vf.pct` (oficial).
  - **Perfil CIF (§7.3):** 6 dominios (`VF_DOMINIOS`, referencia CIF) con 4 niveles de autonomía + capacidades/barreras/apoyos/observaciones + síntesis funcional editable.
  - **Autogeneración descriptiva (§7.4)** (`genVFBorrador`): borrador **sólo con frases** (verificado: sin dígitos ni %) desde la LB firmada (`descAfect` por escala, orden fortaleza→necesidad) + evolución desde `pb.deltas` del motor (`descDelta`); sugiere autonomía **sólo** en comunicación←E2 · interacciones←E1 · aprendizaje←E4 y sólo si están vacíos; nota de revisión obligatoria; constancia en HCE-LOG (`MOD_LABEL.vf`).
  - **Reporte de Valoración Funcional (§7.6)** (`generarReporteVF`): imprimible para la familia, generable a demanda, capacidades primero, **las secciones vacías no aparecen**, sin puntajes clínicos crudos, disclaimer "no es certificado ni informe clínico". **Guía de prestaciones (§7.7)** como `<details>` estático (RNPcD, AYEX, AFAM, pensión, asistentes, transporte, cuota laboral, educación). Terminología §8.1 respetada.
  - **Seed:** Martín(102) valoración completa (58 % → Severo, vigencia 2028, dominios y narrativos) · Sofía(101) parcial (En trámite, 3 dominios, sólo capacidades) — para el criterio de datos parciales.
  - **Verificación:** Playwright — **34/34 en verde**: salvaguarda probada por 4 vías (todas lanzan) con la vía oficial intacta, categoría recalculada al cambiar % (20→Leve) y sin categoría fuera de rango, borrador sin números con sugerencias sólo en dominios con correlato y vacíos, reporte completo/parcial/mínimo (secciones vacías ausentes), alertas 90/30/vencida, y regresión M0–M8; 0 errores de consola; screenshots revisados.
  - **Commit + push:** `1dedc8b` a **ambos remotos**. **Próximo: M10** — cierre de ronda: búsqueda por 3 vías (falta "grupo"), recordatorios configurables no bloqueantes, Playwright punta a punta (CI→LB→PA→PB→IC + DOC/ORG/VF), actualizar `README.md` y cerrar `handoff.md` con el estado nuevo. (Lucas + Claude)

- **2026-07-30** — **M10 · Cierre de ronda: transversales y QA (demo v4.0). RONDA M0–M10 COMPLETA.**
  - **Búsqueda por grupo (3.ª vía):** `coincideBusqueda` acepta "grupo a" o la letra exacta del grupo (además de nombre/apellido, cédula y N.º de HCE); placeholder actualizado. Nota: una letra sola también matchea nombres que la contienen (comportamiento pre-existente de la búsqueda por nombre); la sintaxis inequívoca es "grupo X".
  - **Recordatorios configurables (§4):** tarjeta en Analítica institucional con los 4 períodos del Manual (IDEA al ingreso · PA en julio · PB última semana lectiva · IC post-PB), cada uno con toggle activo, período editable y **pendientes derivados del estado del flujo** (módulo previo firmado y éste sin firmar) con link al expediente. **Nunca bloqueantes** — sólo informan.
  - **QA punta a punta (Playwright, 25/25):** ciclo completo de **Bruno (107) desde cero por los editores reales** — firmar CI (modal) → LB puntuada clickeando las 12 dimensiones (total 48) → PA (24 ítems) → PB con ítem=1 (la firma se rechaza sin observación §4.3, luego delta automático) → IC (formulario + firma + Recibí) → informe único con membrete; DOC (foto bloqueada→autorizar→cargar), ORG (envío INAU + gestión BPS), VF (40 % → Moderado + borrador descriptivo + reporte familiar) sobre el mismo NNA; búsqueda por las 3 vías; recordatorios; y regresión M0–M9 (guards §5.2 y §7.5, §12-A IDEA=58, informe IC de Martín con Δ +19 y 2 radares). 0 errores de consola.
  - **Docs:** `README.md` actualizado (árbol con backend y plan, sección "Estado de la Línea 1"); `handoff.md` cerrado con el estado nuevo (cabecera + §3).
  - **Commit + push:** (este commit) a ambos remotos. **PRÓXIMO PASO (decisión de Lucas, 2026-07-30): arrancar el backend — ronda M11 (backend v2).** Recordar la **puerta de entrada** del plan §M11: validar M0–M6 con IPPU (sobre todo IDEA como línea base única) y **cerrar primero las 3 decisiones de arquitectura del Anexo A** — (a) SQLite dev vs. Postgres-only, (b) dónde vive la lógica de negocio (Pydantic/servidor vs. triggers), (c) alcance de portabilidad institucional — más los bugs A y B de `modelo-datos.md` antes de usarlo como base. Luego: esquema v2 → migrar seed → tests → recién ahí Fase 3 (conectar demo↔API). (Lucas + Claude)

- **2026-07-30** — **Arranque de M11 · backend v2.** Cerradas las **3 decisiones de arquitectura** del Anexo A (Lucas eligió las recomendadas; registradas en §5.2): **Postgres-only** (docker-compose, se abandona SQLite en dev) · **lógica de negocio en el servidor** (Pydantic/servicios, sin triggers; BD = integridad estructural) · **portabilidad paramétrica mínima** (baremo/roles-texto/recordatorios/categorías como dato; sin capa `config_institucion`). Escrita y pusheada la **propuesta de esquema v2** (`backend/docs/esquema-datos-v2.md`, commit `d8d6533`): corrige los bugs A (informe_cierre 1:N anual) y B (persona↔hce 0..1 + `persona_servicio`) de `modelo-datos.md`, modela los payloads validados de la demo v4.0 (mixin de firma con estado derivado, `idea` línea base única con dim JSONB, `protocolo` A/B con deltas sólo en B, DOC/foto/ORG/VF/auditoría), mapea cada regla dura a su servicio con test previsto, y define el plan M11.1–M11.6 con criterio de aceptación §12-A (reproducir el usuario demo 1 por API: IDEA 58 · PA 60 · PB 79 · Δ +19). **Próximo: revisar la propuesta con Lucas/equipo → M11.1 (infra Postgres-only: docker-compose, config, Alembic re-inicializado) → M11.2 (modelos + migración + catálogos).** Los 12 tests v1 se reescriben como tests v2 (previsto en el plan). (Lucas + Claude)

- **2026-08-03** — **Coordinación del equipo: se arregla la causa raíz del trabajo duplicado.** Sesión sin cambios de código; el objetivo fue poder trabajar los tres en paralelo sin solaparnos.
  - **Hallazgo:** la rama `gitlab/feature/base-datos-hce` (Victor, 2026-07-15, commits `2bcf7d2`+`dfb1732`, 1.605 líneas en `implementacion/hce-db/`) contiene un **diseño completo y verificado** de la BD en PostgreSQL + JSONB — esquema `hce`, catálogos, seed de los 4 demo del §11, probado end-to-end en PG18 y reproduciendo los mismos números que la demo (IDEA 58 · PA 60 · PB 79 · Δ +19) — pero con las reglas de negocio en **triggers PL/pgSQL**, o sea la decisión **opuesta** a §5.2. Se hizo en paralelo con `esquema-datos-v2.md`, sin que ninguno supiera del otro.
  - **Causa raíz (no fue error de nadie):** `handoff.md` y `CLAUDE.md` estaban en `.gitignore` desde el commit inicial. El `README.md` versionado decía *"handoff.md ← empezar por acá"*, pero para el resto del equipo ese archivo **no existía**: las decisiones de §5 vivían sólo en la máquina de Lucas.
  - **Decisiones (§5.3):** seguimos en `main` con el esquema v2 y §5.2 (lógica en el servidor) · la rama de Victor queda **aparcada, no descartada** (su SQL es material de consulta para M11, ver §12.5) · `handoff.md` y `CLAUDE.md` **salen del `.gitignore`** y se versionan · **M11 lo toma Victor** en una sesión nueva con todo el contexto.
  - **Cambios:** `.gitignore` (quitadas las 2 exclusiones, con nota del porqué) · `handoff.md` (nueva **§12 · Flujo de trabajo del equipo**: contexto versionado, remoto principal, reparto por módulo con la demo como recurso exclusivo, checklist de sesión, qué reutilizar de `hce-db`, regla anti-contradicción; + §5.3, §6 con responsables, §8 equipo actual de 3; la bitácora pasó de §12 a §13) · `CLAUDE.md` (arranque de sesión, estado real de M11, regla anti-contradicción) · `README.md` (puntero al flujo de trabajo).
  - **Próximo: Victor arranca M11.1** (infra Postgres-only: docker-compose + config + Alembic re-inicializado) en rama `feat/M11.1-infra-postgres`, leyendo primero `handoff.md` §5.2/§12 y `backend/docs/esquema-datos-v2.md`. Pendiente de confirmar entre los tres: **remoto principal** (§12.2). (Lucas + Claude)
- **2026-08-07** — **Pull de GitLab + auditoría de estructura del repo + 2 decisiones de flujo.** Sesión sin tocar código de ningún módulo en curso (no se pisó M11 de Victor ni la demo).
  - **Pull:** `git pull` de `gitlab` trajo la rama `rama1` (Victor, 2026-08-05) con `graphify-out/` — grafo de conocimiento del repo generado con `/graphify` (572 nodos, 870 aristas, 80 comunidades) — y una actualización de `.gitignore`. Fast-forward a `main` sin conflictos.
  - **Auditoría de estructura** (grafo + inspección manual del filesystem, antes de decidir push): sin ciclos de import; hygiene de `.gitignore` correcta (`.env`, `__pycache__`, `.pytest_cache`, `ippu.db` no trackeados pese a existir en disco); god nodes del grafo (`ORMModel`, `Base`, `Nna`) son normales para un ORM, no señal de acoplamiento real. Dos brechas reales encontradas y resueltas en esta sesión (ver abajo). Otras dos quedan anotadas para más adelante, sin acción ahora por no pisar el módulo de Victor: `backend/docs/esquema-datos.md` (v1) desactualizado frente a `esquema-datos-v2.md` — se resuelve naturalmente en **M11.6 docs**; cobertura de tests del backend v1 (`test_api.py`, 12 tests) suficiente por ahora — invertir más ahí es esfuerzo tirado porque M11 reemplaza el backend entero (M11.5 ya planea pytest contra Postgres).
  - **Decisiones (§5.4):** `gitlab` ratificado como remoto principal, `origin` como espejo · `docs/notas/` sale de `README.md`/`CLAUDE.md` (estaba vacía y sin trackear — Samuel y Victor no la tenían al clonar).
  - **Cambios:** `README.md` y `CLAUDE.md` (quitada la línea `docs/notas/` del árbol) · carpeta local `docs/notas/` eliminada (no versionada, sin efecto en git) · `handoff.md` (nueva §5.4, §6 con el pendiente de remoto principal cerrado, §12.2 pasa de propuesta a decisión confirmada, esta entrada de bitácora).
  - **Próximo:** push de este commit a los dos remotos (`gitlab` primero, luego `origin`) y arrancar el trabajo que Lucas defina para esta sesión. (Lucas + Claude)
- **2026-08-07** — **Modularización de la demo L1 (§5.5).** Rama `feat/demo-modular`. Refactor puro, sin cambios de lógica.
  - **Qué se hizo:** `hce_idea_ippu_demo.html` (3.949 líneas) → `demo/index.html` (575) + `demo/css/estilos.css` (532) + `demo/js/` (12 módulos, 2.847 líneas). El corte se hizo **por rangos de línea con un script**, no retipeando código, para que el contenido se moviera byte a byte. El monolito se eliminó del repo (sigue en la historia de git).
  - **Reparto de los módulos JS:** `utils.js` (helpers, carga 1º) · `datos.js` (seed NNA) · `flujo.js` (M1 motor de flujo, 554 líneas) · `catalogos.js` (IDEA anual, Escala IPPU-TEA, IDEA oficial) · `ui-core.js` (navegación, tabla, form IDEA, Likert, gráficos, toast, sesión) · `wizard-nna.js` · `expediente.js` · `evaluaciones.js` (M5.2) · `informe-cierre.js` (M6) · `hce-doc-org-vf.js` (M7/M8/M9, 468 líneas) · `recordatorios.js` (M10) · `grupos-usuario.js`.
  - **Un problema real encontrado y resuelto:** al partir, el hoisting de funciones dejó de ser global y el seed de `flujo.js` reventó llamando a `fmtFecha()` (declarada en lo que hoy es `expediente.js`) — `ReferenceError` en carga. Se resolvió creando `js/utils.js`, que carga primero. **Lo detectó el fingerprint, no la vista**: la demo se veía bien igual, porque el error abortaba el seed en silencio. Detalle y regla para el futuro en §5.5.2.
  - **Verificación:** fingerprint Playwright del monolito capturado **antes** del refactor y comparado después → **40 comparaciones, todas idénticas, 0 errores**. Cubre carga, catálogos, las 174 funciones globales, el motor M1 de los 8 NNA, 5 vistas, 8 expedientes, las **reglas duras** (§5.2 y §7.5) y los **caminos interactivos** (firma CI/PA/PB con delta y alerta, addenda, excepción, modales, vistas dinámicas). Integridad del contenido: multiset de líneas idéntico (2.719 JS), orden relativo intacto en 2.712, CSS 510 y markup 499 idénticos línea por línea. El fingerprint quedó **versionado** en `demo/verificacion/` (§5.5.4).
  - **Efecto en el flujo de equipo:** §12.3 cambia — la demo **deja de ser recurso exclusivo**; se puede trabajar en paralelo tomando archivos distintos de `demo/js/`. `index.html` y `js/utils.js` quedan como compartidos (coordinar antes). Con esto Samuel puede entrar a la demo sin esperar.
  - **Code review (cloud, multi-agente):** **2 hallazgos, ambos `nit`, ambos de documentación** — ninguno en el refactor, ni en los 12 módulos, ni en el orden de carga, ni en el harness. (a) la cabecera de este archivo seguía fechada 2026-08-03; (b) `README.md` seguía diciendo "un solo archivo → una sola persona a la vez", contradiciéndose con su propio árbol de estructura. Los dos corregidos antes del merge.
  - **Nota operativa:** las dos primeras corridas del review fallaron. La causa real fue que `feat/demo-modular` y `review-base` **existían sólo en local**: el review corre en un contenedor que clona del remoto y no pudo resolver la base. **Si se usa review en la nube, pushear la rama primero.**
  - **Mergeado a `main`** y pusheado a los dos remotos. Ramas auxiliares (`review-base`, `backup-demo-modular`) eliminadas: su contenido está en `main`. (Lucas + Claude)

- **2026-08-07** — **Analítica institucional calculada (demo v4.1) + exclusión de las fuentes del grafo.** Rama `feat/demo-analitica-real`, mergeada a `main`. Era el último pendiente libre de la demo y la pata menos desarrollada de L1 ("HCE + IDEA + **analítica**").
  - **Hallazgo que cambió el alcance.** La vista seguía anclada a la arquitectura **previa** al Documento Técnico: mostraba *"Puntaje por escala IDEA — Enero vs Noviembre"* y *"Mejora promedio anual · IDEA"*. Desde **M4** el IDEA es **línea base única** (§5.1.1): ese segundo punto temporal no existe en el modelo, y §5.2 prohíbe suplirlo homologando con la Escala IPPU-TEA. O sea que esos dos indicadores **no estaban hardcodeados por comodidad — eran incalculables por diseño**. Se rediseñó la vista antes de programarla, con Lucas aprobando las dos decisiones abiertas.
  - **Qué se hizo** (`renderAnalitica()` + `analiticaAgregados()` en `demo/js/ui-core.js`, markup en `index.html`): KPIs derivados en un `#anKpi` — cobertura de línea base **71 %** (5 de 7 activos) · IDEA promedio **47,0/96** banda Moderado · **Δ B−A IPPU-TEA +19,0** sobre **1 de 7** con ciclo A → B cerrado · ciclos completos **1 de 7**. El gráfico de escalas pasó a **perfil poblacional de la línea base** (/24) y se agregó una **tarjeta nueva y separada** de **evolución Protocolo A → B** (/30), con la advertencia de que ahí el puntaje **sube** cuando hay progreso — dos instrumentos, dos tarjetas, nunca el mismo eje (§5.2). Distribución por banda sobre las LB firmadas, con nota de cuántos activos quedan fuera. Estados vacíos reales en ambos gráficos.
  - **Reglas respetadas:** el **delta no se recalcula** — se promedia el que registró el motor al firmar el PB (M5.3); los NNA con PB firmado por habilitación excepcional (`deltas=null`) quedan fuera. Se **retiró** el KPI "Taller de mayor eficacia": cruzar taller × escala es el heatmap, fuera de alcance por §5.1.3. El heatmap quedó **intacto** y rotulado *"datos ilustrativos"*.
  - **Verificación** (fingerprint versionado): **38 de 40 pasos idénticos**; los 2 distintos son los esperados — la vista analítica y la lista de globales (**+4**, ninguna perdida). **`D1_modelo_final` OK: la analítica sólo lee, no muta.** Guards §5.2 y §7.5 en verde, los 8 expedientes y los caminos interactivos sin cambios, 0 errores de consola. Criterio **§12-A intacto y ahora visible en el panel** (PA 60 · PB 79 · Δ +19). Reactividad probada: baja del NNA 103 → cobertura 71→67 %, promedio 47,0→45,0, banda Moderada 4→3; al reactivarlo vuelve exacto.
  - **Harness ampliado:** paso **`D3_analitica_derivada`** — captura los agregados *después* de las mutaciones y afirma `derivadoOk` contrastando el panel contra un recálculo hecho en el momento. Si alguien vuelve a hardcodear un indicador, D3 lo delata. Documentado en `demo/verificacion/README.md` (incluida la advertencia de no leer el Δ de D3 como dato clínico: es artefacto del Protocolo B vacío que el harness firma para forzar la alerta).
  - **Code review (cloud, multi-agente): 0 hallazgos.** La rama se pusheó **antes** de lanzarlo, siguiendo la nota operativa de la sesión anterior.
  - **`.graphifyignore`** (commit aparte, `2eb128a`): `docs/fuentes/` sale del corpus del grafo (§5.7). Verificado: 77→72 archivos, 99.608→78.110 palabras (−21 %).
  - **Decisiones nuevas:** **§5.6** (no hay módulos exclusivos — deroga la asignación de §5.3.4 y reencuadra §12.3/§12.4) y **§5.7** (los originales no entran al grafo, pero no se borran).
  - **Grafo re-indexado** (cierre de la sesión): **736 nodos · 1.039 aristas · 163 comunidades** (antes 572 · 870 · 80), ahora sí con los 12 módulos de `demo/js/`. La extracción de los 25 documentos **quedó cacheada**. El grafo ubicó `analiticaAgregados()` como **nodo puente** entre las comunidades "Catálogos IDEA/IPPU-TEA" y "Motor de flujo (M1)" — que es exactamente lo que debe ser un agregador de analítica — y sacó a la superficie la tensión ya conocida entre §5.2 y `docs/markdown/modelo-datos.md` (el diseño de la rama aparcada). Salvedades honestas en §6: 67 aristas colgantes y `cost.json` subregistrado.
  - **Próximo:** **M11.1 — infra Postgres-only** (docker-compose + config + Alembic re-inicializado), que ya **no tiene dueño asignado** (§5.6). Sigue pendiente con IPPU la validación de la demo. (Lucas + Claude)

- **2026-08-07** — **M11.1 + M11.2 · Backend v2: infra Postgres-only y esquema v2 con catálogos.** Rama `feat/m11-backend-v2`. Primera sesión de la ronda M11; el backend deja de estar descalzado del Documento Técnico.
  - **Repaso previo, a pedido de Lucas.** Antes de escribir código se revisó el módulo entero: qué decide M11, por qué Docker, si va a producción y qué partes quedan clavadas. Conclusión que ordenó el trabajo: **la decisión real es "Postgres-only"; Docker es sólo cómo se entrega Postgres a tres máquinas**. El código habla con la base por un `DATABASE_URL` y no sabe que hay un contenedor — si prod termina siendo un Postgres gestionado o instalado a mano, no cambia un solo modelo. El despliegue real sigue sin definirse porque **la HCE de IPPU está alojada externamente y no sabemos qué permite ese hosting**.
  - **M11.1 · Infra.** `docker-compose.yml` con Postgres 16-alpine, volumen `ippu_pgdata`, healthcheck y `docker/initdb/` que crea la base **`ippu_test`** aparte (pytest no toca los datos de trabajo). `config.py` **rechaza al arrancar** cualquier `DATABASE_URL` que no sea Postgres, con mensaje que apunta a §5.2.1 — sin eso, un `.env` heredado de SQLite levanta igual y el problema aparece recién cuando falla una migración con JSONB. `database.py` con `pool_pre_ping` (sin él, la primera consulta tras un `docker compose restart` falla) y **convención de nombres de constraints** en la metadata, para que `--autogenerate` produzca el mismo diff en las tres máquinas. `alembic/env.py` sin el batch-mode de SQLite y con `compare_type`/`compare_server_default`.
  - **Un problema real de infra, encontrado y resuelto (§5.9).** El primer arranque falló con `password authentication failed`. Causa: **había un PostgreSQL local escuchando en 5433** (el puerto elegido justamente para no chocar con el 5432) y se quedó con el binding IPv4; Docker tomó sólo el IPv6, así que `localhost` conectaba al Postgres equivocado. Diagnosticado con `Get-NetTCPConnection`. Se pasó a **`127.0.0.1:5440`** con bind explícito — que además no expone la base al resto de la red. Queda documentado en el README como síntoma → causa.
  - **M11.2a · Se retiró el backend v1 completo:** 6 modelos, 6 schemas, 6 routers, `seed.py`, `test_api.py` y las 3 migraciones Alembic. No era código malo: hablaba del modelo **pre-Documento Técnico** (`nna` todo junto, `evaluacion_idea` anual con una fila por dimensión, `evaluacion_likert`), y entre ese mundo y el v2 no hay migración incremental posible — por eso el esquema pide **migración inicial única**. Sin datos reales y con git guardando el historial, reemplazar en el lugar salía más barato que hacer convivir dos modelos sobre la misma `Base`.
  - **M11.2b · 28 tablas** en 4 módulos que espejan el doc: `catalogos` (§2.4) · `identidad` (§2.1) · `modulos` (§2.2, el flujo firmable) · `transversales` (§2.3). Con los **bugs A y B corregidos**: `informe_cierre` pasó a 1:N con `UNIQUE(hce_id, anio)` (es anual, no uno por vida), y `persona` puede existir **sin** expediente de Atención Diurna, con `persona_servicio` N:M para la identidad transversal. `FirmaMixin` compartido (`firmado`/`firmas`/`addendas`/`excepcion`); el **estado visible no se almacena**, lo deriva el servidor — mismo diseño sin drift que la demo desde M1.
  - **Reparto BD/servidor respetado (§5.2.2).** En Postgres quedó sólo integridad **estructural**: rangos (IDEA 0–96, protocolo 24–120, pct 0–100), unicidad (`(hce_id,tipo,anio)`, `(hce_id,anio)`), el XOR de `foto` con `num_nonnulls(hce_id, grupo_id)=1`, y `CHECK(tipo='B' OR deltas IS NULL)`. Las reglas **clínicas** (secuencia, firma=bloqueo, Δ sólo B−A, baremo sólo desde `pct`, autorización de imagen, histórico inmutable) **no se tocaron**: son M11.3, en Python con test. Sin un solo trigger.
  - **M11.2c · Catálogos generados, no transcritos.** En vez de copiar a mano 60 descriptores del IDEA, se extrajeron **por código** de la demo v4.1 (`vm` de Node sobre `catalogos.js`/`hce-doc-org-vf.js`/`recordatorios.js` + los chips de `index.html`) y se transformaron a `app/data/catalogos_iniciales.json`. Cargados: **12 dimensiones IDEA + 60 descriptores · 24 ítems IPPU-TEA · 5 categorías de baremo · 12 categorías documentales · 4 recordatorios · 8 talleres · 3 servicios**. El seed (`python -m app.seed_catalogos`) es **idempotente** y no borra lo que sobra: una categoría eliminada del JSON podría tener documentos apuntándole.
  - **Verificación.** Reconstrucción limpia de punta a punta (borrado del esquema → `alembic upgrade head` → seed) = 29 tablas (28 + `alembic_version`) y los conteos exactos; seed corrido dos veces = **0 nuevas / 0 actualizadas**; **18 tests estructurales en verde** (`tests/test_esquema_v2.py`, base `ippu_test` aislada, cada rechazo probado junto con su caso que sí debe pasar); API levanta y `/health` responde 200.
  - **Dos cosas que salieron a la luz construyendo, y que no tienen fuente:** el esquema dice **18 talleres** pero la demo usa **8** y ningún documento los lista (se cargaron los 8 verificables); y las **referencias documentales de los 24 ítems** (DSM-5-TR, CIF, Wing & Gould, Baron-Cohen…) **no están verificadas** contra las fuentes originales — se transcribieron del prototipo tal cual. Ambas quedaron anotadas para IPPU.
  - **`docs/notas/puntos-a-validar.md`** (carpeta creada ahora, que es lo que §5.4.2 dejó previsto para "contenido real de notas de equipo"): **8 puntos para IPPU** (críticos: validar la demo v4.1 y el acceso a la HCE actual + su esquema de BD), **6 para el equipo** (incl. ratificar §5.8) y **6 supuestos a confirmar**. Cada punto dice explícitamente **qué bloquea**.
  - **Decisiones nuevas: §5.8** (M11 arrancó **sin** cruzar su puerta formal de validación con IPPU — criterio explicado, **pendiente de ratificación del equipo**, no es una decisión cerrada como las de §5.2) y **§5.9** (puerto 5440).
  - **Cierre de sesión:** se agregó `docs/notas/consulta-a-ippu.md` — la versión **no técnica** de los puntos que dependen de IPPU, escrita como cuestionario para que la respondan los funcionarios sin saber nada de informática. Tres partes: **lo que entendimos** de su trabajo (para que nos corrijan: el circuito anual, la firma doble, el consentimiento no salteable, los dos instrumentos no homologables, el informe único), **los 10 supuestos** que tomamos (para confirmar o desmentir) y **10 dudas puntuales**. Cada pregunta tiene su espacio para responder y las 4 que más destraban están marcadas: **2.1** (¿el IDEA se hace una vez o todos los años? — el que condiciona la tabla `idea`), **3.1** (lista real de talleres), **3.2** (citas bibliográficas de los 24 ítems) y **3.3** (acceso al sistema actual). Los dos documentos de `docs/notas/` se mantienen sincronizados a mano: si se agrega un punto en uno, va en el otro.
  - **Revisión del propio commit (`a5fbfda`).** No se pudo correr `/code-review ultra` (créditos agotados), así que la revisión fue manual, verificando **contra la base** en vez de deducir del código. **7 hallazgos, 6 corregidos:**
    - **El grave, autoinfligido: el seed revertía lo que configura la institución.** `_sincronizar` trataba el JSON como autoritativo para *todos* los campos, así que re-correr el seed —que está en el arranque documentado del README— pisaba en silencio los cortes del baremo corregidos por IPPU y los recordatorios desactivados por coordinación. Comprobado en la base: `pct_min=6` volvía a `5`. Eso vaciaba de sentido la decisión §5.2.3 (son tabla y no constante **para** poder ajustarlos sin migración). Arreglo: `solo_al_crear` marca los campos de la institución, que se escriben al insertar y nunca más; el contenido de los instrumentos **sigue** viniendo del JSON. Dos tests cubren las dos caras — "no pisar nada" habría sido un arreglo tan malo como el bug.
    - `valoracion_funcional.pct` estaba anotado `float` pero `Numeric` devuelve `Decimal` (verificado: `Decimal('58.50')`). Trampa puesta para M11.3, que va a comparar ese valor contra los cortes del baremo: mezclar los dos tipos levanta `TypeError`.
    - **21 FKs sin índice de respaldo** (Postgres no los crea solo): cada borrado en cascada por `hce_id` hacía scan secuencial en todas las tablas hijas, y las consultas del panel filtran por ahí. Quedan **0**.
    - Los tests no detectaban desfasaje **modelos ↔ migración** (crean las tablas con `create_all`, no aplicando la migración): un modelo editado sin su migración pasaba hasta el despliegue. Test nuevo que los compara.
    - Orden de herencia del mixin de firma inconsistente (3 de 4 clases al revés de la convención; verificado que las columnas llegaban igual — era convención, no bug) y 5 relaciones anotadas `Mapped["object"]`, que no dice nada.
    - **El que NO se corrigió:** la tabla `grupo` no admite más de un año (ver §6). Se dejó como está porque cambiarlo modifica `esquema-datos-v2.md` §2.1 y eso se decide por escrito, no de hecho en el código.
    - Migración inicial **regenerada** en vez de apilar una segunda (nada está desplegado). Reverificado todo: reconstrucción limpia, seed idempotente, **21 tests en verde**.
  - **Nota para la próxima:** el `ultra` sigue pendiente. Esta revisión la hizo quien escribió el código, que es exactamente el revisor con más puntos ciegos. Cuando haya créditos, conviene correrlo igual sobre `a5fbfda`.
  - **Próximo: M11.3** — los servicios con las reglas duras de §4. Es el sub-módulo con más contenido de M11 y **está sin tomar** (§5.6). Conviene resolver antes el punto 1.1 (validación de la demo con IPPU): mientras nada esté construido encima, cambiar la tabla `idea` sigue siendo barato. (Lucas + Claude)
- **2026-08-14** — **M12.0 · Decisiones al papel y verificación del punto de partida** (ronda **M12 — absorción del Prototipo v4**, plan `docs/planes/PLAN-M12-absorcion-prototipo-v4-2026-08.md`). **Sin código de modelo**: esta sesión es solo el paso 0.
  - **Prototipo incorporado:** `curl` del HTML publicado → `docs/fuentes/prototipo-v4/HCE_IPPU_Prototipo_v4.html` (**406.266 bytes**, coincide con los 406 KB que describe la referencia; contiene `IDEA_MANUAL_V = 'Manual Unificado IDEA v1.0 (07/2026)'`). **No se extrajeron** `CLINICA_HTML_B64` ni `TALLER_HTML_B64` (§5.12 / D3) y **no se corrió Docling** (es una app JS; la versión legible es `docs/markdown/prototipo-v4-referencia.md`, producida por script).
  - **Decisiones D1–D9 escritas en §5.10–§5.18** (Lucas, 2026-08-14), con la cabecera y **§3** actualizados: la fuente normativa pasa a ser Manual v1.0 + Prototipo v4, y las bandas del IDEA de **3 a 6 tramos** con soporte DSM-5-TR. Cinco de las nueve derogan cosas ya escritas — por eso van al papel antes del código (§12.6). **§5.2 sigue entera en pie.** **Pendiente: que el equipo confirme D9** (`grupo`) antes de implementarla en M12.1.
  - **Mapas de estructura actualizados:** `docs/estructura-repositorio.md` (carpeta `prototipo-v4/` con los dos archivos, el `.md` nuevo, los dos planes, `extraer_prototipo_v4.js` con su uso real, y la excepción Docling reescrita para cubrir v1 **y** v4), más los mapas resumidos de `README.md` y `CLAUDE.md`.
  - **Verificación del repo contra la realidad** (no contra el handoff): `alembic heads` = `f6ca521bcc6a`, **una sola cabeza**, y la base está en ella · **28 tablas** + `alembic_version` = 29 en `public` · catálogos cargados (12 dimensiones · 60 descriptores · 24 ítems · 5 baremo · 12 categorías · 4 recordatorios · 8 talleres · 3 servicios) · **21 tests en verde**.
  - **Diferencias encontradas entre el handoff y el repo (todas menores, ninguna bloquea):**
    1. **`pytest -q` no funcionaba tal como está documentado.** No había ningún archivo de configuración de pytest, así que `tests/conftest.py` moría con `ModuleNotFoundError: No module named 'app'` salvo que cada uno exportara `PYTHONPATH` a mano. Se agregó **`backend/pytest.ini`** (`pythonpath = .`, `testpaths = tests`) y ahora sí: `pytest -q` → **21 passed**. Es la única corrección de código de la sesión.
    2. **§6 decía "18 tests estructurales"**; son **21** desde la revisión de M11.2 (la bitácora del 2026-08-07 ya decía 21). Corregido en §6, `README.md` y `CLAUDE.md`.
    3. **El commit `a9f94c7` no tenía entrada de bitácora** (movió el plan a `docs/planes/`, agregó `estructura-repositorio.md`, `prototipo-v4-referencia.md`, la carpeta `prototipo-v4/` y `extraer_prototipo_v4.js`).
  - **Sobre la sospecha de que M11.2c perdió cosas al generar los catálogos: no se confirmó.**
    - **`baremo_categoria.implicancia` NO se perdió.** Está en el modelo (`app/models/catalogos.py:107`), en `app/data/catalogos_iniciales.json` y en la base, y su texto es **idéntico** al `imp` del prototipo en las 5 categorías, igual que los cortes. **El bullet correspondiente de M12.1 no tiene trabajo asociado** — solo verificar.
    - Se comparó **todo lo generado** contra la demo: 60/60 descriptores idénticos, 24/24 ítems idénticos (texto y referencia), 12/12 categorías documentales idénticas con sus 4 marcas de registro histórico, 4/4 recordatorios idénticos. La única diferencia es que la escala pasó de índice 0–3 (demo) a 1–4 (JSON), que es normalización deliberada.
    - `solo_al_crear` **ya está implementado** en `app/seed_catalogos.py` (con su docstring explicando el bug): el plan lo describe en M12.8 como "el bug grave de M11.2", pero se corrigió en la revisión del 2026-08-07. En M12.8 hay que **extenderlo** a los catálogos nuevos, no construirlo.
    - **Lo que sí falta** no se "perdió": nunca entró. Seis catálogos viven como literales en la demo y no tienen tabla ni entrada en el JSON — **`VF_DOMINIOS`** (6, con código CIF), **`VF_NIVELES`** (5), **`PRESTACIONES`** (8), `BPS_PRESTACIONES`, `BPS_ESTADOS` y `LIKERT_LBL` (5 etiquetas). Hoy viven como JSONB dentro de `valoracion_funcional.dominios` o directamente en ningún lado. Decidir en M12.1/M12.8 cuáles merecen tabla.
  - **Diff preliminar de los 60 descriptores del IDEA (solo reportado, NO aplicado):**
    - **59 de 60 difieren textualmente** del `IDEA_DESC` del prototipo, pero **ninguno por corrimiento de niveles**. Se construyó la matriz de similitud de cada nivel nuestro contra los 5 del prototipo: en **58 de 60** el mejor calce es el **mismo nivel**, y los 2 restantes (D6 n2, D9 n2) son señal débil de reformulación, no intercambio — el texto de un nivel nuestro **nunca** aparece en otro nivel del prototipo.
    - Los 60 nuestros son el **texto literal de la fuente oficial** (`docs/markdown/escala-del-inventario-del-espectro-autista-idea.md`, Rivière); los del prototipo son **paráfrasis condensadas** de los mismos niveles (ej. D4/8: "Ausencia de comunicación (relación intencionada, intencional y significante) y de conductas instrumentales con personas" vs. "Ausencia de comunicación entendida como relación intencionada mediante significantes").
    - **El corrimiento que el prototipo dice haber corregido no es contra nosotros.** El literal del HTML lo dice explícito: *"corrimiento de niveles detectado en materiales institucionales previos (Dimensiones 3, 4, 6 y 12 de la «Guía del aplicador», hoy desestimada)"* — un documento interno de IPPU que **nunca tuvimos** y del que **nuestros descriptores no derivan**.
    - **Recomendación (a decidir en M12.1, no tomada acá):** **no reemplazar** los 60 por los del prototipo — perderíamos fidelidad al instrumento original a cambio de nada. Si la versión corta les sirve en pantalla, entra como campo aparte (`descriptor_breve`), no encima del oficial. Lo que sí conviene tomar del prototipo son los catálogos que **no tenemos**: `IDEA_FICHAS` (12), `IDEA_EJ` (12) e `IDEA_REGLAS` (9).
  - **Verificación de la sesión:** `pytest -q` **21 passed** · `alembic heads` una sola cabeza y la base al día · 28 tablas · catálogos con los conteos esperados. **Ningún cambio en modelos, migraciones ni catálogos.**
  - **Próximo: M12.1** (correcciones al esquema existente) — va **primera y sola**, con los 21 tests corriendo después de cada cambio. **Antes:** confirmar **D9** con el equipo. (Lucas + Claude)
- **2026-08-14** — **M12.1 · Correcciones al esquema existente** (ronda **M12**, plan `docs/planes/PLAN-M12-absorcion-prototipo-v4-2026-08.md`). Va **primera y sola**; la sesión corta acá, antes de M12.2.
  - **D9 confirmada por el equipo e implementada.** `grupo` pasa a **id serial sin significado** + `nombre` por color (`Grupo Azul` · `Celeste` · `Naranja` · `Verde`) + **`UNIQUE(nombre, anio)`**, con `anio SMALLINT`. Se barrieron las dos FK (`hce_diurna.grupo_id` y `foto.grupo_id`, de texto a entero) y los usos del id como si fuera el nombre. **Granularidad anual, no por fecha** — con fecha completa volverían a existir dos grupos Azul en el mismo año, y `anio` es lo que ya usan `protocolo` e `informe_cierre`. **Límite aceptado y anotado en §5.18:** un cambio de técnico a mitad de año sobrescribe la fila y sólo deja rastro en la auditoría; depende de las respuestas de IPPU a §3.7/§3.8 de `consulta-a-ippu.md`. **Cerró `puntos-a-validar.md` §2.6.** No hubo migración de datos: los `A..E` sólo existían en un test y en los docstrings.
  - **Catálogos nuevos (5 tablas, 28 → 33).** `banda_idea` (6 tramos con nivel DSM-5-TR y el texto orientativo copiado **tal cual** — es deliberadamente neutro y reescribirlo rompe esa propiedad) · `delta_interpretacion` (6 tramos con acción y `signo`; **la alerta institucional Δ ≤ −7 pasa a derivarse de la fila con `alerta=True`**, ya no de un número suelto) · `idea_ficha` (12) · `idea_ejemplo` (48 = 12 × niveles 8/6/4/2; el prototipo no trae ejemplo de nivel 0 y no se inventó uno) · `idea_regla` (9).
  - **Los 60 descriptores NO se reemplazaron**, cerrando lo que M12.0 dejó recomendado. El corrimiento que el prototipo dice haber corregido es contra una «Guía del aplicador» interna de IPPU que nunca tuvimos; los nuestros son el texto literal de Rivière (1997/2002) y los suyos, paráfrasis condensadas. **Lo que sí entró:** `idea_nivel.descriptor_breve` (la versión corta, **al lado** y nunca encima) y `idea_dimension.que_evalua`. Un test fija que 59 de 60 difieren y nombra el único que coincide (D11/8, «Ausencia completa de conductas de imitación»): si esa cuenta sube, alguien copió los del prototipo encima de los oficiales.
  - **Campos nuevos.** `idea.manual_version` (el literal `Manual Unificado IDEA v1.0 (07/2026)`, que el prototipo pide persistir con cada evaluación firmada) · **`OrigenMigracionMixin`** en `persona`, `hce_diurna` e `idea` (`sistema_origen`, `fecha_original`, `fecha_migracion`, `responsable_migracion`), que **reemplaza al `idea.migrado_origen JSONB`** de M11.2: eran los mismos datos en una bolsa sin forma, imposible de filtrar · **`auditoria` a nivel campo** (`campo`, `valor_ant`, `valor_nuevo`) con **`hce_id` nullable**, porque hay eventos institucionales —cambiar los técnicos de un grupo, retirar un taller— que no son de ningún expediente. Esa granularidad es justamente lo que hace verdadera la garantía de D9.
  - **Recordatorios 4 → 8:** a los del flujo (`lb pa pb ic`, con IDEA en semanas 2–3 e IC a 10 días hábiles) se suman `ayex` (60/30), `vf` (90/30), `inc` (>60 días sin gestiones) e `inau` (informes semestrales). Configurables y **nunca bloqueantes**.
  - **Decisión: los 6 catálogos sueltos de la demo van a constante, no a tabla.** `LIKERT_LBL`, `VF_DOMINIOS`, `VF_NIVELES`, `PRESTACIONES`, `BPS_PRESTACIONES` y `BPS_ESTADOS` viven ahora en **`app/core/constantes.py`**. Criterio escrito ahí: tabla si se consulta, se filtra o la institución lo cambia sin desplegar; constante si es texto fijo de presentación que acompaña a un valor ya guardado. Los 6 dominios de VF, por ejemplo, son las **claves fijas** de `valoracion_funcional.dominios` y vienen de la CIF, no de IPPU. Pasan a tabla el día que el panel necesite filtrar por alguno.
  - **Generador de catálogos versionado.** `herramientas/generar_catalogos_backend.py` (con `--check` para CI) reemplaza al script `vm` de Node de M11.2c, que nunca quedó en el repo. Produce las secciones nuevas desde el Prototipo v4 y **preserva** las que vienen de la demo v4.1; M12.8 tiene que pasar esas también y vaciar la lista `DESDE_LA_DEMO`. `app/data/catalogos_iniciales.json` sigue sin editarse a mano.
  - **Vocabulario §8.1 — el prototipo incumple su propia regla.** El generador normaliza «grave» → «severo» y **reporta cada sustitución**. Hubo **una**: `IDEA_FICHAS[7].nc`, "un trastorno grave de anticipación". También normaliza «Rivière (1997)» → «Rivière (1997/2002)» en las fuentes de `idea_regla`. En el repo propio quedaban dos citas sueltas, en §3 y en el glosario de este archivo: corregidas. **La demo no se tocó** (no-goal §2 del plan): su `js/catalogos.js` sigue diciendo "1997", y el plan §8 ya lo tiene listado como cambio a decidir aparte antes de la reunión con IPPU.
  - **Tests: 53 en verde + 1 salteado a propósito** (`tests/test_m12_catalogos.py`, 32 nuevos). Cubren: los dos casos de D9 (que «Azul 2026» y «Azul 2027» convivan, y que el segundo «Azul 2026» sea rechazado) · los bordes de las 6 bandas (0, 15, 16, 90, 91, 96) y que cubran 0–96 sin huecos · que la alerta del Δ sea una sola y arranque en −7 · que los tramos del Δ no dejen huecos · que ningún catálogo diga «grave» · que los 60 oficiales sigan intactos · **el seed completo corrido dos veces con 0 nuevas / 0 actualizadas** · que el seed no pise los cortes de las bandas ni los grupos ya configurados.
  - ⚠️ ~~**`test_la_migracion_coincide_con_los_modelos` queda salteado hasta M12.8, a propósito.** La regla de la ronda congela las migraciones hasta el cierre, así que los modelos van deliberadamente adelante del esquema aplicado y ese test **tiene que** fallar. No se borró ni se comentó: sigue calculando el diff y lo **reporta al saltear** (`pytest -rs` muestra hoy **32 diferencias**), para que el desfasaje pendiente esté a la vista. **M12.8 tiene que volver a poner el `assert`** — está anotado en el plan y en el docstring del test.~~ → **Revertido el mismo día por la enmienda §5.19** (ver la entrada siguiente de esta bitácora): la migración se regeneró con las 33 tablas y el test volvió a ser bloqueante.
  - **Docs actualizados:** `esquema-datos-v2.md` (cabecera al estado real —decía "no implementada todavía"—, §2.1 `grupo` como fuente de D9, §2.2 `idea`, §2.3 `auditoria`, §2.4 con los 5 catálogos nuevos y el criterio tabla-vs-constante, §4 con 5 reglas más para M11.3) · `PLAN-M12` (corregidos los bullets de `baremo_categoria.implicancia` y de los 60 descriptores, agregado el de los 6 catálogos sueltos, y anotado en M12.8 que `solo_al_crear` **no** era un bug pendiente) · `puntos-a-validar.md` §2.6 cerrado · banner de «documento histórico» en los dos docs del backend v1 (`esquema-datos.md`, `ejemplos-endpoints.md`), que seguían mostrando `"grupo_id": "A"` sin decir que describen una API retirada.
  - **Próximo: M12.2** (puntuación independiente y consenso, D7) — el cambio de modelo más profundo y el único que no sale del prototipo. Después, M12.3–M12.7 se reparten en paralelo. (Lucas + Claude)

- **2026-08-14** — **Enmienda §5.19 · la migración de M12 se descongela.** Sesión corta y de una sola cosa; **M12.2 no arrancó**.
  - **La decisión, primero al papel (§5.19).** La regla de §3 del plan congelaba `alembic revision --autogenerate` hasta M12.8. Se enmienda: **la migración inicial única se regenera al cerrar cada sub-módulo**, con el test de coincidencia modelos ↔ migración pasando, y **sólo se congela si hay trabajo en paralelo real sobre `app/models/`** (ahí descongela y regenera una sola persona al terminar el paralelo). **Dos motivos:** (a) el motivo original —tres `autogenerate` simultáneos— no aplica, la ronda la ejecuta una sola persona; (b) aun aplicando, dejar 32 diferencias acumulándose hasta M12.8, y más de cien después del fan-out, **de autores distintos y vistas por primera vez al final**, es exactamente el riesgo que la regla quería evitar: se movía de lugar, no desaparecía. Se sigue manteniendo **una** migración inicial: se regenera el mismo archivo, no se apilan revisiones.
  - **Texto corregido en los 5 lugares que decían lo contrario:** cabecera de este archivo · §6 (bullet de M12.8) · `PLAN-M12` §3 (con la regla vieja tachada y el porqué), el recuadro de M12.1 y los bullets de M12.8 · `CLAUDE.md` · `backend/README.md` · `docs/estructura-repositorio.md`. La entrada de M12.1 de esta misma bitácora quedó tachada con puntero acá, no reescrita.
  - **Migración regenerada:** se borró `f6ca521bcc6a_..._m11_2.py` (28 tablas) y se generó **`46da34fcc64e_esquema_v2_inicial_m12_1.py`** con las **33** de M12.1 (las 5 nuevas: `banda_idea`, `delta_interpretacion`, `idea_ficha`, `idea_ejemplo`, `idea_regla`; más `grupo` con id propio y las FKs a entero de D9). **Reconstrucción limpia de punta a punta**, dos veces: drop schema → `alembic upgrade head` → `python -m app.seed_catalogos`. 34 tablas en `information_schema` = 33 + `alembic_version`.
  - **Test reactivado.** `test_la_migracion_coincide_con_los_modelos` volvió a tener su `assert`, sin `skip` (queda sólo el de infraestructura, para cuando la base de desarrollo no está levantada). Docstring reescrito y mensaje de error actualizado: ahora explica el flujo de **regenerar la migración única**, no el de agregar una revisión.
  - **`solo_al_crear` verificado a mano, no sólo por unit test.** Seed corrido **dos veces seguidas → 0 nuevas / 0 actualizadas en las 14 secciones**; después, 8 campos de institución pisados por SQL directo (`banda_idea.total_max` 15→20 · `baremo_categoria.pct_min` · `recordatorio.activo`+`periodo` · `taller.activo` · `servicio.activo` · `delta_interpretacion.delta_min`+`alerta` · `grupo.dias`+`obs`, este último por `solo_insertar`) y **tercera corrida: los 8 sobrevivieron intactos**. En la misma corrida se pisó también `banda_idea.texto` —contenido del instrumento, **no** de la institución— y el seed **sí** lo restauró: es la única "1 actualizada" del resumen, y es la contraprueba de que el seed efectivamente corrió y comparó en vez de no hacer nada.
  - **Verificación:** `pytest -q` → **54 en verde, 0 salteados** (los 53 de M12.1 más el que estaba salteado). `generar_catalogos_backend.py --check` → OK. La base de desarrollo quedó reconstruida y sembrada limpia.
  - **Próximo: M12.2** (puntuación independiente y consenso, D7), sin cambios. (Lucas + Claude)

- **2026-08-14** — **M12.2 · Puntuación independiente y consenso (D7)** (ronda **M12**). Sesión de un solo módulo: **M12.3 no arrancó**.
  - **Lo primero: esto no sale del prototipo, y quedó argumentado en el commit, en el docstring del modelo y en el esquema.** El Prototipo v4 guarda un **único array plano de consenso** (`punt[12]`, `punt[24]`) —igual que nosotros hasta hoy— y **no tiene puntuación por evaluador en ninguna parte de su código**; declara kappa como requisito y no lo implementa. Se agrega porque el **Manual de Procedimientos v1.0** establece que los dos técnicos puntúan por separado y después consensúan, y lo llama *el único requisito metodológico invariante*; sin las dos puntuaciones no hay forma de calcular el kappa que el propio Manual §23 pide como control de confiabilidad interjueces. **Es decisión nuestra (D7, §5.16), no requisito del cliente**, tomada ahora porque después de M11.3 cuesta migración **más** reescritura de servicios — hoy no hay ni servicios ni datos. Si en dos meses alguien lo lee como pedido de IPPU, está mal leído.
  - **Dos tablas nuevas (33 → 35): `puntuacion_idea` y `puntuacion_protocolo`.** Una fila por (evaluación, dimensión) y por (protocolo, ítem), con `valor_t1`/`valor_t2` **nullable**, `documentacion` y `diferencia`. **El consenso no se movió:** sigue en `idea.dim` y `protocolo.items`, que es el puntaje del instrumento. Lo que se agrega al lado es el dato de confiabilidad, que es otra cosa.
  - **Por qué tabla y no más claves dentro del JSONB.** El argumento de M11.2 —«el instrumento se lee y se escribe entero»— vale para el consenso y **no** para esto: kappa se calcula **a lo ancho** (t1 vs. t2 de una dimensión sobre toda la cohorte: un `GROUP BY dimension_id`, contra recorrer el JSONB de cada evaluación); «diferencias ≥2 sin documentar» es una **consulta institucional**, no un dato de un expediente; el evaluador es una **FK** que dentro de JSONB nadie garantiza; y `NS` necesita representación tipada. **Tampoco se heredó la forma del prototipo:** sus arrays planos son justamente lo que no sirve para esto.
  - **`NS` con tres estados, no dos.** `valor_tN NULL` + `ns_tN=false` = todavía no puntuó · `0..8` = puntuó · `NULL` + `ns_tN=true` = **puntuó NS**. `CHECK` de exclusión mutua entre los dos. Sólo en el IDEA: la Escala IPPU-TEA es Likert 1–5 y no admite NS. ⚠️ **Caso dejado sin resolver a propósito:** que uno ponga NS y el otro un número es un desacuerdo real que la aritmética no expresa (`diferencia` queda NULL). No se inventó una regla — está anotado en `esquema-datos-v2.md` §4 como definición de M11.3, con un test que fija el caso.
  - **`diferencia` es columna generada; el umbral que la interpreta, no.** Postgres calcula `abs(valor_t1 - valor_t2)`: aritmética pura, sin contenido clínico, imposible de desfasar y consultable. El **2** que la convierte en «ambigüedad clínica» vive en `core/constantes.py`, **no en la DDL** — si estuviera en el `CREATE TABLE`, moverlo sería una migración y nadie lo encontraría. **La base calcula el número, Python lo interpreta**, que es el mismo reparto de §5.2.2.
  - **Los tres tramos son constante y NO catálogo paramétrico**, contra el criterio general de D6 y por un motivo explícito: el Manual los llama el invariante metodológico, y si el umbral se pudiera correr con un `UPDATE`, los kappas de antes y después del `UPDATE` no serían comparables. Hay test que lo fija (no existe tabla de consenso ni de procedimiento).
  - **`procedimiento` y `documentacion_pendiente` son derivados, no columnas** (`hybrid_property`: sirven igual en Python que en el `filter()` de SQL). Mismo criterio sin drift que el estado visible de los módulos desde M1.
  - **Evaluadores en el módulo, no por fila:** `idea.evaluador_t1_id` / `evaluador_t2_id` y sus equivalentes en `protocolo`, con **`CHECK` de que no sean la misma persona** — «puntuación independiente» con un evaluador puesto dos veces daría kappa 1 sin que nadie haya comparado nada. **No se derivan de `firmas`**: la puntuación independiente ocurre *antes* de firmar, cuando `firmas` todavía está vacío. Sin `evaluadorN_rol`: el rol ya viaja en `firmas` y en `profesional.especialidad`, y una tercera copia son dos formas nuevas de quedar desfasada.
  - **Nullable no es comodidad, es requisito.** Una evaluación **sin** puntuaciones independientes sigue siendo válida: hace falta para la migración de históricos y para el seed espejo de la demo, donde sólo existe el consenso — y porque **todavía no sabemos si los técnicos de IPPU ya trabajan así**.
  - **Lo que NO se hizo, a propósito:** no se calcula kappa (fase piloto) · no se hicieron obligatorias las dos puntuaciones · **el guard «diferencia ≥2 exige documentación» no está en la base**: es lógica de negocio, va a M11.3 y quedó anotado en `esquema-datos-v2.md` §4 junto con su test previsto.
  - **Tests: 74 en verde, 0 salteados** (`tests/test_m12_consenso.py`, 20 nuevos). Incluye el caso textual del plan (`valor_t1=4, valor_t2=6, valor=4` → diferencia 2, pendiente de documentar), la consulta SQL de pendientes sobre tres filas, **los tres bordes 0 / 1 / 2 como estados distintos**, la evaluación sin puntuaciones independientes, los tres estados de NS, el CHECK de evaluadores distintos con su caso que sí debe pasar, y el borrado en cascada.
  - **Migración regenerada** (regla §5.19): `46da34fcc64e` (33 tablas) → **`f54959f07cc4_esquema_v2_inicial_m12_2.py`** con las **35**. Reconstrucción limpia: drop schema → `alembic upgrade head` → `python -m app.seed_catalogos` (14 secciones, conteos esperados) → `pytest -q` con **`test_la_migracion_coincide_con_los_modelos` en verde**.
  - **Anotado antes de que se olvide — hueco que dejó M12.1** (`puntos-a-validar.md` §2.8): con `UNIQUE(nombre, anio)` y seed *insert-only*, **no existe todavía ningún mecanismo para «abrir un año nuevo» de grupos**. Que el seed no los cree es correcto —coordinación es dueña de la fila—, pero en marzo de 2027 alguien tiene que poder crearlos y hoy la única vía es un `INSERT` a mano. Es de **M11.3/M11.4**; hoy no bloquea nada.
  - **Para la reunión con IPPU** (`puntos-a-validar.md` §1.9 y `consulta-a-ippu.md` §3.9, sincronizados): **¿los dos técnicos ya puntúan de forma independiente, o es práctica a introducir?** De la respuesta depende si D7 sirve desde el día uno o queda latente. La pregunta se redactó dejando claro que el sistema acepta igual un solo valor: no se les impone una forma de trabajar.
  - **Próximo: M12.3–M12.7 en paralelo** (catálogo de talleres · HCE-SEV · HCE-INC · HCE-PAI · ateneos), uno cada uno y en archivos distintos de `app/models/`. ⚠️ **Ahí sí aplica el congelamiento de §5.19**: mientras haya trabajo en paralelo real sobre los modelos, la migración se congela y la regenera **una sola persona** al terminar. (Lucas + Claude)

- **2026-08-14** — **M12.3 · Catálogo dinámico de talleres (D5)** (ronda **M12**). Corrido **solo**: no había ninguna rama de M12.4–M12.7 abierta, así que **§5.19 no congeló la migración** — se regeneró al cerrar, como en M12.1 y M12.2.
  - **`taller` deja de ser una lista fija.** Suma `orden` (la especificación pide poder **reordenar** y hasta acá el orden era el de inserción), `grupos_orientados` y `retirado_en`. Los tres son de coordinación, no del repo.
  - **`activo` dejó de ser columna: es derivado** (`hybrid_property` = `retirado_en IS NULL`, sirve igual en Python que en el `filter()` de SQL). Un booleano guardado al lado de la fecha se desincroniza en cuanto alguien escribe uno de los dos, y deja dos respuestas a «¿está vigente?». Mismo criterio sin drift que el estado visible de los módulos (M1), `procedimiento`/`documentacion_pendiente` (M12.2) y el `sensible` que viene en M12.5. Hay test de que **no se puede contradecir**: no hay setter ni por atributo ni por constructor, y `activo` no está en `__table__.columns`.
  - **`grupos_orientados` es un array de nombres de color en texto, NO una FK a `grupo.id`.** Desde D9 (§5.18) un grupo es `(nombre, anio)` con id propio: un `grupo_id` ataría el taller al año en que se creó la fila y en enero habría que reapuntar los 14 a mano. Por nombre es robusto al cambio de año — **la misma lógica que D5 aplica a la participación**. Hay test que da de alta «Grupo Azul 2027» y verifica que el taller no se tocó.
  - **Los 14 reales, generados y no transcritos.** `taller` salió de `DESDE_LA_DEMO` en `herramientas/generar_catalogos_backend.py` y ahora se genera desde `CAT_TALLERES` del prototipo (el nombre más largo mide 51 y entra en `String(80)`; el script lo verifica). `grupos_orientados` sale vacío y `retirado_en` en `None`: **el repo carga nombres, no gestión** — a qué grupos se orienta cada taller lo decide coordinación desde la app.
  - **`solo_al_crear` del seed pasó de `("activo",)` a `("orden", "grupos_orientados", "retirado_en")`:** la fila entera es de la institución. Verificado con test: re-correr el seed **no revive un taller retirado** ni pisa el orden ni la orientación.
  - ⚠️ **Los 8 talleres viejos no los borra el seed.** `_sincronizar` no borra ni desactiva lo que dejó de estar en el JSON, **por diseño** (podría haber registros apuntándole). Como no hay datos reales y `hce_taller` desapareció, **nada los referencia** y la reconstrucción limpia documentada (drop schema → `alembic upgrade head` → `python -m app.seed_catalogos`) los elimina sola. **No se escribió una migración de datos para esto.** Pero **una base de desarrollo que no se reconstruya va a conservar 8 talleres fantasma y el seed no lo avisa** — anotado también en `backend/README.md` con el `DELETE`.
  - **Decisión nueva, escrita antes de ejecutarla (§12.6): se retira `hce_taller`** → **§5.20**. Era un resto de v1 que sobrevivió el rewrite sin revisarse: modelaba participación **viva, por expediente y por `taller_id`**, mientras que las Especificaciones Técnicas §3 fijan `pai_taller { pai_id, taller_nombre }` —por nombre y por instancia de PAI—. No son dos implementaciones de lo mismo: son **dos modelos distintos**, y dejar los dos garantizaba dos fuentes de verdad. **Uso hoy: 0 tests, 0 seed, 0 routers, 0 schemas** (relevado). Deroga el `HCE_DIURNA }o--o{ TALLER` del ER §1 y la fila `hce_taller` de §2.1 de `esquema-datos-v2.md`.
  - ⚠️ **El conteo de tablas BAJA: 35 → 34. No es una regresión.** M12.3 **no crea tablas** —`taller` ya existía— y retira una. Dicho explícito acá, en el plan, en el README y en `estructura-repositorio.md` para que nadie lo lea como pérdida de trabajo.
  - **El criterio de verificación del plan se traspasó a M12.6** → **§5.21**. Pedía «cargar participación en Taller de huerta, retirarlo y afirmar que sigue legible y marcada como retirada»: con `hce_taller` retirada y `pai_taller` sin construir **no existe tabla de participación**. No se inventó una acá ni un mock que finja una que M12.6 va a modelar distinto — sería el trabajo duplicado de §5.3. Anotado en el plan, en M12.3 y en M12.6.
  - **Tests: 92 en verde, 0 salteados** (`tests/test_m12_talleres.py`, 18 nuevos). Cubren los 14 con nombres exactos y que no quede ninguno de los 8 viejos · `activo` derivado en Python y en SQL, imposible de contradecir, y retirar/reincorporar reversible · `grupos_orientados` con varios colores y sobreviviendo al alta del grupo del año siguiente · reordenar sin tocar `nombre` · seed idempotente (0/0) que no revive lo retirado · `HceTaller` inexistente e inimportable · y que **ninguna tabla tenga FK a `taller.id`**, que es lo que hace que retirar un taller no pueda arrastrar un registro clínico.
  - **Migración regenerada** (§5.19): `f54959f07cc4` (35 tablas) → **`3f11e10c13ed_esquema_v2_inicial_m12_3.py`** con las **34**. Reconstrucción limpia verificada: drop schema → `alembic upgrade head` → seed (14 secciones) → `pytest -q` con `test_la_migracion_coincide_con_los_modelos` **en verde**. `generar_catalogos_backend.py --check` → OK.
  - **`puntos-a-validar.md` §1.3 CERRADO** y `consulta-a-ippu.md` §3.1 reescrito (los dos sincronizados, como pide su cabecera): la pregunta «¿cuál es la lista completa de talleres?» **la respondió el propio prototipo de IPPU**; queda sólo pedirles confirmación de si esos 14 son los que dictan este año y si alguno va sólo a ciertos grupos. Sale de las 4 preguntas ⚠️ que más nos frenaban: quedan 3.
  - **Para M12.6:** el catálogo queda consumible — tabla **`taller`**, PK `id`, y `nombre` **UNIQUE `String(80)`**. `pai_taller.taller_nombre` casa **por texto exacto contra `taller.nombre`, sin FK** (a propósito: una FK reintroduciría exactamente lo que D5 evita). Para mostrar «retirado del catálogo», resolver el nombre contra el catálogo y leer `Taller.activo`, que filtra también en SQL.
  - **Próximo: M12.4–M12.7.** Si se toman en paralelo, ahí sí aplica el congelamiento de §5.19. (Lucas + Claude)

- **2026-08-15** — **M12.4 · HCE-SEV · Severidad DSM-5-TR** (ronda **M12**). Corrido **solo**: ninguna rama de M12.5–M12.7 abierta, así que **§5.19 no congeló la migración** — se regeneró al cerrar, como en M12.1–M12.3.
  - **Punto de partida verificado contra la realidad, no contra el handoff:** `d6da306`, árbol limpio, head `3f11e10c13ed`, **34 tablas** (metadata y base coinciden), **92 tests en verde, 0 salteados**. Única diferencia: Docker Desktop no estaba levantado y `pytest` **salteaba 67 tests en silencio** en vez de fallar — es entorno, no repo, pero conviene saberlo: **un `92 passed` sólo vale con el contenedor arriba**.
  - **El relevamiento previo cambió el módulo antes de escribirlo.** Con `severidad_dsm` iban a convivir **tres** lugares con un «nivel DSM»: `banda_idea.nivel_dsm`, `hce_diurna.nivel_soporte` y el registro nuevo. Se puso a prueba la hipótesis de que `nivel_soporte` **no** duplicaba nada (que fuera el nivel del **diagnóstico externo**, dato histórico vecino de `diag` y `cie11` en Especificaciones §3), buscando la evidencia en el **HTML del prototipo**, no en el `.md` de referencia. **Quedó refutada, con los tres tests apuntando al mismo lado:** (a) HCE-00 lo rotula `Nivel de soporte DSM-5-TR (orientativo)` —sin ninguna mención al ingreso, y «orientativo» es la misma palabra que usa la banda del IDEA—; (b) el módulo `sev` **lo escribe siempre**: `setSev()` → `p.nivel = sevResumen(p);  // sincroniza la etiqueta visible de la ficha`, dejándole un string de otro formato (`"CS: Grado 2 · CRR: Grado 2"`), y el changelog del prototipo lo dice literal; (c) la ficha **nunca muestra dos** niveles, hay un solo slot cuyo formato cambia en cuanto alguien toca SEV. Dos confirmaciones más: el identificador `nivel_soporte` aparece **una sola vez en las 406 KB** del prototipo —en el «esquema **sugerido**» de §3, que la app nunca usa— y **nuestra propia demo lo confirma**: `demo/js/datos.js` guarda `apoyo:"Grado 2 — Requiere apoyo sustancial"`, que es el contenido de HCE-SEV colapsado en un campo.
  - **Decisión escrita antes de tocar código (§12.6): se retira `hce_diurna.nivel_soporte`** → **§5.24**. Era la etiqueta visible denormalizada: una copia sin justificación, fecha ni autor de lo que `severidad_dsm` registra bien. **No se renombró** a «nivel del diagnóstico de ingreso» porque habría sido inventarle un significado que ninguna fuente le da. **Costo relevado antes de decidir: 0 tests, 0 seed, 0 routers, 0 schemas, 0 usos en la demo.** ⚠️ **Es una columna, no una tabla:** el conteo sube 34 → 36 por las **dos tablas nuevas**, y esto no lo baja. **Divergencia declarada con la fuente normativa** (las Especificaciones §3 lo listan; nosotros no lo implementamos), habilitada por el «Principio de la ronda».
  - **`banda_idea.nivel_dsm` SE QUEDA** y gana docstring: es propiedad **DE LA BANDA**, no del NNA — «un total de 56–75 se corresponde orientativamente con Nivel 2» es contenido del catálogo del IDEA (D4), no un juicio sobre nadie.
  - **`severidad_dsm` en archivo propio `app/models/severidad.py`**, no en `modulos.py` (que es el flujo firmable, y HCE-SEV **no se firma**) ni en `catalogos.py`: son los dos puntos de conflicto si M12.5–M12.7 arrancan en paralelo.
  - **0..1 por expediente, PK = `hce_id`**, como `consentimiento`. Dos razones: la regla del módulo dice que el registro describe la necesidad de apoyo **actual** —que la severidad fluctúe no pide una fila por medición, pide que la fila diga **cuándo** se juzgó—, y **es la dirección reversible**: 0..1 → 1:N es agregar un `id`; el camino inverso obliga a descartar filas. ⚠️ **Con una condición, anotada como guard obligatorio de M11.3:** «la historia vive en `auditoria`» es hoy una **aspiración** —no existe `app/services/`—, así que **toda edición de `severidad_dsm` tiene que registrar auditoría de campo**. Con esa línea escrita el 0..1 es correcto; sin ella borra en silencio la fluctuación que la propia regla menciona como propiedad del fenómeno.
  - **Los dos dominios son independientes en sus *valores*, no en su presencia.** CS 3 con CRR 1 pasa y nada los ata; pero los dos son **NOT NULL**, porque la regla dice que la severidad «se especifica por separado para **cada** dominio». El estado «todavía no se juzgó» ya es representable **sin fila** —eso compra el 0..1—, así que columnas nullable serían una segunda forma de decir lo mismo. `justificacion`, `fecha` y `profesional_id` también NOT NULL: un juicio clínico sin justificación, fecha ni autor no es un juicio clínico.
  - **Bug encontrado al escribir el test de justificación vacía:** `btrim()` sin argumentos recorta **sólo espacios**, así que una justificación de tabuladores o saltos de línea pasaba el CHECK. Cambiado a `justificacion ~ '[^[:space:]]'`. Es exactamente para lo que sirve probar cada rechazo con más de un caso.
  - **La regla del sistema se persiste verbatim** como docstring del modelo, igual que D4 hizo con el texto neutro de las bandas: está redactada para **no prescribir** y para acotar el alcance del registro («no sustituye la determinación de elegibilidad»), y parafrasearla rompe esa propiedad.
  - **Catálogo `severidad_nivel`: una fila por grado, no tres tablas.** `SEV_ETQ`, `SEV_CS`, `SEV_CRR` y `SEV_APOYO` están todas indexadas por el mismo grado 1–3 y el prototipo las renderiza como **una tabla de cuatro columnas**; tres tablas paralelas con la misma PK serían la misma fila partida en pedazos. **Generado**, no transcrito (`herramientas/generar_catalogos_backend.py`, sección nueva) — `--check` en verde. Las **etiquetas se derivan** del número contra este catálogo y **no se guardan** en `severidad_dsm`: guardarlas sería reintroducir ahí el campo que se acaba de retirar de `hce_diurna`.
  - **Sin FK a `severidad_nivel`, a propósito.** `nivel_cs`/`nivel_crr` son el **dato primario** —el juicio clínico—, no una clasificación derivada, y el grado DSM-5-TR vale aunque la tabla de descriptores esté vacía. Mismo criterio que `idea` respecto de `banda_idea`, y **distinto** de `valoracion_funcional.categoria_id`, que sí es FK porque ahí la categoría **la deriva el servidor** desde `pct`. El rango lo garantiza un CHECK.
  - ⚠️ **La cuenta de FKs sin respaldo NO estaba en 0** —el criterio de cierre de la ronda la da por sentada—. `puntuacion_idea.dimension_id` y `puntuacion_protocolo.item_id` quedaron sin índice en **M12.2**: su `UNIQUE` compuesto no las cubre porque no son la columna líder. **Corregidas acá** (`index=True`) y el chequeo quedó **automatizado como test**, para que no vuelva a pasar inadvertido en M12.5–M12.7.
  - **Guards nuevos anotados en `esquema-datos-v2.md` §4** (no implementados: son M11.3), bajo un principio transversal escrito ahí por primera vez — **«IPPU registra, no determina»**, que no es frase nuestra: las Especificaciones §1 la dicen para VF («no certifica») y la regla de HCE-SEV para severidad («no sustituye la determinación de elegibilidad»). **Entrada:** el nivel no se calcula ni se deriva del IDEA ni de la IPPU-TEA. **Salida, en tres afirmaciones precisas y no en una prohibición ancha:** (1) `severidad_dsm` no participa de ningún cálculo de elegibilidad —ni `pct`, ni categoría del baremo, ni prestaciones sugeridas—, que es el **espejo del guard §7.5**, hoy cerrado sólo de entrada; (2) ⚠️ **no se extiende el correlato clínico de la autogeneración de VF**: §1(g) sanciona un mapeo **cerrado** (comunicación ← E2, interacciones ← E1, aprendizaje ← E4) y `severidad_dsm` no está en él — agregarlo sería inventar un correlato que IPPU no definió, justo en el camino que lleva a una determinación de elegibilidad; (3) en el Reporte de VF la severidad va **en palabras** («necesita ayuda notable en comunicación social»), nunca «Grado 3» ni numeral, que es la regla que el propio módulo ya se aplica (§1(g) «nunca números crudos ni porcentajes», §1(h) «no es certificado ni informe clínico»).
  - **Tres guards más, del mismo material y hasta hoy sin anotar en ningún lado:** (4) auditoría de campo obligatoria en toda edición de `severidad_dsm`; (5) **`valoracion_funcional.pct` NULL es un estado válido, no un dato faltante** — en menores de 2 años **no se aplica el BUND** y la constancia sale de IBMF/IRSA, así que `categoria_baremo(NULL)` devuelve **«no corresponde»**, no error ni categoría por defecto (la edad sale de `persona.fecha_nac`, sin campo nuevo; **la demo ya lo implementa desde M9, el backend no**); (6) ⚠️ **cuando llegue el anexo del Decreto 72/025 se reconcilian los CORTES, nunca las ETIQUETAS** — IPPU declara que la nomenclatura oficial puede diferir de la institucional y que en sus pantallas usa siempre la suya; si el anexo dijera «grave», alinear las etiquetas violaría §8.1 y el test de `VOCABULARIO_PROHIBIDO` saltaría en rojo, y **quien lo vea va a creer que el test está mal y el decreto tiene razón**. Anotado **también** en `puntos-a-validar.md` §1.2, que es donde alguien va a leer la tarea el día que llegue.
  - **Tests: 123 en verde, 0 salteados** (`tests/test_m12_severidad.py`, 31 nuevos). Cubren CS 3 / CRR 1 sin que uno arrastre al otro y los tres grados válidos · justificación NULL, vacía y de sólo espacios/tabs rechazadas, con su caso que pasa · ídem `fecha` y `profesional_id`, incluido profesional inexistente · niveles fuera de 1–3 rechazados en los dos dominios · expediente **sin** severidad válido · un solo registro por expediente · **borrado en cascada** · las tres etiquetas derivadas · descriptores de los dos dominios distintos entre sí · ningún texto nuevo dice «grave» · y el **aislamiento estructural en las dos direcciones**: `severidad_dsm` no tiene FK ni columna hacia `idea`/`protocolo`, y ni `valoracion_funcional` ni `baremo_categoria` tienen FK ni columna hacia `severidad_dsm` — que es la forma verificable hoy de «instrumentos no homologables» y de «no participa de la elegibilidad».
  - **Migración regenerada** (§5.19): `3f11e10c13ed` (34 tablas) → **`f432ea139fd9_esquema_v2_inicial_m12_4.py`** con las **36**. Reconstrucción limpia verificada: drop schema → `alembic upgrade head` → seed (**15 secciones**, `severidad_nivel` 3/3) → seed **por segunda vez 0/0 en todo** → `pytest -q` con `test_la_migracion_coincide_con_los_modelos` **en verde** → `/health` 200 → `generar_catalogos_backend.py --check` OK.
  - **Dos decisiones más de la ronda, sin código pero condicionan M12.5 y M12.6:** **§5.22 (E4)** la sección V de HCE-PAI **no duplica HCE-INC** —`centro`, `modalidad` y `grado` pasan a carga única, porque el PAI de INAU es un documento **dinámico** con actualización en SIPI ante cualquier cambio y una copia congelada del centro educativo contradice esa obligación; el modo de falla concreto es entregarle a un organismo del Estado un dato desactualizado—, con dos consecuencias anotadas para M12.6 (**`pai` NO lleva `UNIQUE(hce_id, anio)`**: con revisión semestral puede haber más de un PAI por año; y **verificar el nombre oficial**, «Propuesta de Atención Individual» del prototipo vs. «Proyecto de Atención Integral» de la normativa INAU). ⚠️ Su fuente es **investigación sobre normativa INAU, no material entregado por IPPU** — va a la reunión. Y **§5.23 (E5)** **M12.4 iba antes que M12.6** por dependencia de **conocimiento**, no de esquema: M12.6 no necesita `severidad_dsm` para compilar (carga única es *ausencia* de columnas) pero sí conocer su forma para escribir el mapeo «qué sección lee de qué tabla». **M12.5 y M12.7 siguen libres.**
  - **Anotado en el plan §M12.6:** verificar contra el JS si `padronInau`, `disposicion`, `judicial` y `expediente` existen en el objeto `pai` o sólo se renderizan desde HCE-ORG — `prototipo-v4-referencia.md` §7 **afirma las dos cosas** y no pueden ser ciertas a la vez.
  - **Dos cosas anotadas para M11.4** (§2.2 y §5 del esquema, y el docstring del modelo): (a) **el orden de los módulos en la ficha no está modelado en ninguna tabla y no se inventó una** — `FICHA_TABS` pone **SEV entre CI e IDEA**, hoy vive implícito, y si M11.4 lo materializa que sea decisión suya y quede escrita; (b) ⚠️ **`severidad_dsm` no admite guardado parcial** — con los dos dominios NOT NULL, un técnico que juzgó CS pero todavía no CRR no puede grabar, y este módulo **no tiene borrador ni firma** donde apoyar el a medias. Es defendible (el DSM-5-TR pide especificar los dos, y el prototipo pone los dos `<select>` en el mismo formulario) pero **hay que resolverlo explícitamente**: validar en la UI, borrador del lado del cliente, o volver nullable las dos columnas si IPPU dice que juzgar un dominio y el otro después es práctica real. **No reabre la decisión de M12.4**: es flujo de trabajo, y M12 es capa de modelo.
  - **Deuda que deja:** la demo conserva `p.apoyo` (no se toca, es no-goal de la ronda); cuando incorpore HCE-SEV, `apoyo` pasa a **derivarse** de ese registro. Y el catálogo de talleres de M12.3 **sigue sin forma de administrarse** — ahora se le suma `severidad_nivel`, aunque ése no lo toca coordinación (es texto del instrumento). Ambos en `puntos-a-validar.md` §2.
  - **Próximo: M12.5 · M12.6 · M12.7**, en paralelo y en archivos distintos de `app/models/`. Si se toman a la vez, ahí sí aplica el congelamiento de §5.19. (Lucas + Claude)

- **2026-08-15** (segunda) — **Guardia de entorno en `pytest`: se cierra el hallazgo de M12.4 sobre el instrumento de verificación.** Tarea puntual, **no** es sub-módulo de M12: no toca `app/models/` ni genera migración.
  - **El diagnóstico, corregido respecto de cómo lo veníamos contando.** Los `skip` **no eran silenciosos**: pytest imprime las `s`, el conteo de salteados y, con `-rs`, el motivo completo de cada uno. Lo verificamos. **El defecto es más angosto y peor: la corrida devuelve `exit 0`.** Con el contenedor abajo el resultado de hoy es `34 passed, 89 skipped in 8.81s` y código de salida **0** — para CI, para `if ($?)` y para cualquier automatización, una sesión vacía es **indistinguible** de una válida; y el renglón de resumen **empieza con «34 passed»**, que de un vistazo se lee como verde. De ahí sale el número que termina en la bitácora.
  - **Eran DOS mecanismos, no uno.** (1) `tests/conftest.py`, un `pytest.skip` dentro de la fixture de sesión `engine`, que cascadea a **todo** test que pida `db`; y (2) `tests/test_esquema_v2.py`, un `pytest.skip` propio dentro de `test_la_migracion_coincide_con_los_modelos`, sobre la **base de desarrollo** (no la de test — ese test compara los modelos contra el esquema aplicado, no contra `create_all`). **Los dos se retiraron.** Si sólo se hubiera arreglado el primero, el segundo habría seguido tapando exactamente el desfasaje modelos ↔ migración que §5.19 volvió bloqueante.
  - **Guardia de sesión** (`_entorno_verificado`, fixture `autouse` de scope sesión que además `engine` pide explícitamente, para no depender del orden de las autouse). Tres chequeos, cada uno con `pytest.exit(returncode=1)` y **mensaje accionable**: **(a)** Postgres no responde — con la URL efectiva **sin contraseña** y `docker compose up -d`; **(b)** responde pero la base de desarrollo está vacía — con `alembic upgrade head`; **(c)** tiene esquema pero **no está en el head** — con **las dos revisiones a la vista** (aplicada vs. head) y el mismo comando. Se conservó la guarda que ya existía (`TEST_DATABASE_URL == DATABASE_URL` → abortar: los tests hacen `drop_all`).
  - **Dos bases, no una — y por eso (b) y (c) miran `DATABASE_URL`.** Los tests estructurales corren contra la base de test, que la propia fixture construye con `create_all()` desde los modelos: **no necesita Alembic**. La que tiene que estar migrada es la de **desarrollo**, porque es contra ella que compara el test de coincidencia. (a) chequea las dos.
  - **Sin literales, a propósito.** Ni el número de tablas ni el identificador del head están escritos en el código: las tablas se **cuentan** y el head se **deriva en tiempo de ejecución** de `alembic/versions/` (`ScriptDirectory.from_config`). Los dos cambian al cerrar cada sub-módulo (§5.19), y un literal acá sería deuda que habría que tocar en M12.5, M12.6, M12.7 y M12.8.
  - **El `skip` no quedó como fallback**, a propósito: conviviendo con la guardia, el salteo **gana** cada vez que ella no prevé un caso — que es reproducir el bug. O la sesión corre entera, o no arranca.
  - **Verificado ejerciendo los tres modos de falla a mano**, no con un test verde: Docker abajo → aborta con (a), `no tests ran`, **exit 1** · esquema borrado (`drop schema public cascade`) → aborta con (b), exit 1 · `alembic_version` pisada a `3f11e10c13ed` → aborta con (c) mostrando `Aplicada: 3f11e10c13ed` / `Head: f432ea139fd9`, exit 1 · estado restaurado (`upgrade head` + seed, 15 secciones) → **123 passed, 0 skipped, exit 0**, con `-rs` sin sección SKIPPED. Mismo número que antes del cambio.
  - ⚠️ **Consecuencia retroactiva, que es el motivo de cerrarlo ahora y no después.** **Todos los conteos de tests de la bitácora desde M11.2 (21) hasta M12.4 (123) son válidos sólo si Docker estaba arriba en esa corrida — y no hay forma de auditarlo a posteriori.** El registro dice «N en verde»; no dice cuántos se saltearon, y el exit 0 no dejaba rastro. No implica que estén mal: implica que **no son verificables**. Lo que sí está verificado es el estado de hoy, comprobado en esta sesión con la guardia puesta: **123, 0 salteados**. **De acá en adelante el número que se anote es auditable**, porque una corrida incompleta ya no puede terminar en «passed». Se cierra **antes** de M12.5–M12.7 y de M12.8 justamente para que los conteos del fan-out nazcan confiables.
  - Documentado en `backend/README.md` (sección nueva en el arranque, con la tabla de los tres chequeos) y en `CLAUDE.md`. (Lucas + Claude)
- **2026-08-15** — **M12.7 · Ateneos clínicos y jornadas de capacitación.** **38 tablas** (`ateneo` +
  `ateneo_acuerdo`; 36 → 38, sin tabla de catálogo), **240 tests en verde, 0 salteados** —el primer
  conteo del fan-out que nace auditable, con la guardia de entorno ya puesta—, migración inicial única
  regenerada (**`9246e659d2c9`**) con `test_la_migracion_coincide_con_los_modelos` en verde. Cero
  triggers, `/health` 200, `generar_catalogos_backend.py --check` OK y sin movimiento.
  - **Una sola entidad con campos según tipo**, como el prototipo (`DB.ateneos[]`), no cuatro tablas:
    lo que cambia entre tipos no es la forma del registro sino qué bloque de contenido se llena.
  - **`AT_TIPOS` entró como CONSTANTE, no como catálogo** — la decisión más consecuente del módulo.
    Parece catálogo (alimenta un filtro), pero el tipo es el **discriminador contra el que están
    escritos los 5 CHECK**: con catálogo editable, coordinación agrega «Ateneo de familia» desde la app,
    el tipo nuevo cae fuera de todas las reglas (`tipo = 'clinico' OR …`) y la fila se guarda **sin
    sujeto y con los dos bloques de contenido a la vez**, sin que nadie despliegue ni revise nada.
    Misma forma que `protocolo.tipo` / `evento.tipo` / `servicio.clave`, y mismo razonamiento que
    `CONSENSO_PROCEDIMIENTOS`. Se persiste la **clave**, no la etiqueta.
    `test_el_check_y_la_constante_no_pueden_divergir` es el que hace ruido si alguien agrega una clave.
  - **Identificador: serial + `UNIQUE(anio_correlativo, numero)`, con `codigo` derivado** —el patrón de
    D9 (§5.18)—, no PK de texto. El código codifica año, prefijo y número, y **los tres son
    corregibles**: con PK de texto, renumerar arrastraría las FK hijas y dejaría colgada toda referencia
    ya emitida en papel.
  - **Prefijo `AT-` para los cuatro tipos**, resolviendo la contradicción del prototipo (su seed muestra
    `JC-2026-001`, pero `atNuevo()` genera siempre `AT-` y su contador `id.includes(anio)` cuenta las dos
    formas en **una sola serie**). Además `tipo` es editable: con prefijo por tipo, corregir un tipo mal
    cargado cambiaría el identificador de un registro ya circulado. Como el código es derivado, si IPPU
    prefiere `JC-`, es **una línea y cero migración**. → `docs/notas/`.
  - **El correlativo es de registración, no cronológico.** Se congela al crear —en el prototipo el
    registro nace con `fecha:''`, o sea que el año del hecho **no existe** al numerar— y el filtro de año
    va contra `fecha`. Divergencia declarada: `AT-2027-001` puede tener `fecha = 2026-12-20`. La columna
    se llama `anio_correlativo` y no `anio` justamente para que nadie filtre por la equivocada.
  - **`sensible` derivado** (`tipo == 'clinico'`), nunca capturado, con expresión SQL para Fase 4.
    ⚠️ **Hueco de la fuente:** el aviso del prototipo nombra los clínicos (sensibles) y los
    institucionales y jornadas (acceso general), pero **no dice qué es un ateneo de grupo** — y su propio
    seed muestra uno discutiendo Δ de protocolos de NNA identificables. Se implementó lo que dice la
    fuente y la pregunta va a IPPU; que sea derivado hace que cambiar de criterio cueste una línea.
  - **Dos decisiones nuevas: §5.25 y §5.26.** La primera le da a HCE-DOC **alcance institucional**
    (`documento.hce_id` nullable + `ateneo_id` + XOR), porque un ateneo institucional o una jornada no
    tienen expediente y el prototipo les pide adjuntos («Referencia a documentos en HCE-DOC
    **institucional**»); se relajó la FK de la tabla dueña como M12.1 hizo con `auditoria.hce_id`, en vez
    de crear una tabla paralela que sería una segunda fuente de verdad. La segunda fija la **nomenclatura
    `hce_id` = pertenencia / `hce_<calificador>_id` = referencia**, que **M12.6 hereda**.
  - **Tres hallazgos que no estaban previstos y valen más que el módulo:**
    1. **`lpad` trunca y `f"{n:03d}"` ensancha.** Con `numero = 1000`, las dos mitades de `codigo`
       devolvían códigos **distintos** (`AT-2026-1000` en Python, `AT-2026-100` en SQL) y el `UNIQUE` no
       lo veía, porque es sobre `numero` y no sobre el código. Verificado contra Postgres antes de
       escribirlo. Se cerró con `CHECK numero BETWEEN 1 AND 999`: el formato de tres dígitos pasa de
       convención a **garantía estructural**, y el desborde falla fuerte en vez de generar un código
       colisionante.
    2. **Corregir el tipo de un ateneo clínico exige limpiar `hce_referida_id` en la MISMA sentencia**,
       por el CHECK `(hce_referida_id IS NOT NULL) = (tipo='clinico')`. Es correcto —no puede quedar un
       institucional con un NNA colgado ni un instante— pero es una consecuencia de UI que no estaba
       prevista: se sumó a las otras tres de D6 para M11.4, con su test y el caso que sí pasa.
    3. **`''` y `NULL` conviven y la base ya no los distingue.** Los CHECK usan `~ '[^[:space:]]'` y no
       `num_nonnulls()` —los 17 campos del prototipo nacen en `''`, y `btrim()` sin argumentos recorta
       sólo espacios: el defecto que M12.4 dejó documentado—, y se resolvió en la DDL y no como
       invariante de la API porque `routers/`, `schemas/` y `services/` todavía no existen: una garantía
       estructural que depende de código no escrito no es una garantía. **Pero el efecto es que cualquier
       `WHERE situacion IS NOT NULL` de M11.3/M11.4 estaría mal.** Queda escrito en §4 del esquema:
       **`NULL` es la representación canónica**, el servicio normaliza al guardar, y hasta entonces se
       consulta con el regex. Vale para todo campo de texto opcional del esquema, no sólo para este
       módulo.
  - **Lo que NO se hizo, y por qué:** sin `tsvector`/GIN (btree en `titulo`) — `vAteneos` busca
    **subcadena** y `tsvector` matchea **lexemas**: «capacit» no encontraría «capacitación»; las dos
    opciones y su diferencia semántica quedan en §4. Sin asignación del correlativo (es de M11.3, con la
    race condition y el reuso tras rollback que el `length+1` del prototipo hace mal). Sin timestamps
    (existen en 1 de 38 tablas: no es convención y no se estrena en el módulo más chico). Sin tocar
    `categoria_documento` (está en `DESDE_LA_DEMO`; la categoría propia es de M12.8).
  - **`README.md` estaba desactualizado desde M12.4**, no desde esta sesión: decía «34 tablas y 92 tests
    (M12.0 a M12.3)». Se puso al día con M12.4 + M12.7 y con la guardia de entorno de pytest.
    (Lucas + Claude)

- **2026-08-16** — **Ronda de alineación de la demo v4.1 con el Prototipo v4** (Samuel; commit hecho
  por Lucas). Ronda **paralela a M12**, sobre la demo (no-goal de M12). Decisión en **§5.27 (F1)**.
  **Commiteada en `main`** el 2026-08-16 para desbloquear la sesión F1-nav que arrancó a continuación
  (`demo/F1-navegacion`, ver bitácora del mismo día). Verificación visual + re-baseline del fingerprint
  quedaron pendientes post-commit (ver §6 y la anotación "NO verificado" más abajo).
  - **Alcance: solo alineaciones sobre lo que ya existe.** No se agregaron módulos nuevos (HCE-SEV,
    HCE-INC, HCE-PAI, Ateneos quedan para otra ronda si se decide). §5.2 y §5.5 intactos.
  - **6 alineaciones aplicadas:**
    1. **Cita Rivière 1997 → 1997/2002** (`catalogos.js:102`, comentario del bloque). Cierra la deuda
       que M12.1 ya había arreglado en el backend pero no en la demo.
    2. **Vocabulario «grave» → «severo» (§8.1): ya cumplido.** La única ocurrencia de "grave" en toda
       la demo era un **comentario que cita la regla** (`hce-doc-org-vf.js:243`). Nada que cambiar.
    3. **Bandas del IDEA: 3 tramos → 6 con soporte DSM-5-TR** (§5.13 / D4). Reemplazadas «Leve
       0–32 · Moderada 33–64 · Severa 65–96» por las 6 del prototipo (Muy leve ≤15 · Leve ≤30 · Leve a
       moderado ≤55 · Moderado ≤75 · Moderado a severo ≤90 · Severo a muy severo >90), cada una con su
       nivel DSM-5-TR y su texto orientativo **copiado tal cual** del prototipo (`ideaInterpreta`):
       reescribirlo rompía la neutralidad metodológica, igual que en M12.1. Introducida constante
       `IDEA_BANDAS` en `catalogos.js` con `perfil`, `ns`, `color`, `txt`. `bandaIdea()` y
       `colorBanda()` mantienen su firma (devuelven strings) — no rompe usos en `flujo.js` ni
       `expediente.js`. En `ui-core.js` la distribución por banda ahora se construye desde
       `IDEA_BANDAS`, con el `ns` visible en el label.
    4. **Interpretación del Δ con 6 tramos y acción sugerida** (M12.1). La demo ya tenía los 6 rangos;
       faltaba el campo `a` (acción). Agregado con **texto textual del prototipo** en los 6 tramos.
       El tramo `Regresión significativa` lleva `alerta:true`. **`ALERTA_DELTA` pasa a ser derivado**
       del catálogo (busca el mayor Δ con `alerta:true`) en vez de constante suelta `-7`. Verificado:
       sigue devolviendo `-7`. Una sola fuente de verdad, criterio de §5.20/§5.24.
    5. **Los 14 talleres reales del prototipo** (§5.14 / D5) reemplazan a los 8 inventados. Ninguno
       coincidía exactamente. **Mapeo semántico** aplicado por texto en 4 archivos: Habilidades sociales
       → *Taller de habilidades sociales* · Lenguaje y comunicación → *Taller de cuentos y estimulación
       del lenguaje* · Motricidad → *Educación Física* · Juego simbólico / Actividades lúdicas →
       *Actividades lúdicas y de juego* · Música y expresión → *Taller de música y expresión* · Vida
       diaria (AVD) → *Taller de higiene y AVD* · Arte y plástica → *Taller de expresión plástica* ·
       Psicomotricidad → *Actividades sensoriales* · Cocina → *Taller de cocina*. Archivos tocados:
       `index.html` (14 chips en `#tallerPicker`, antes 8), `datos.js` (8 NNAs), `grupos-usuario.js`
       (4 grupos + fix `de 18 institucionales` → `de 14`), `ui-core.js` (heatmap ilustrativo con nombres
       alineados; valores intactos: §5.1.3 sigue fuera de alcance). **Absorción parcial:** los 14
       nombres se cargan pero la demo **no gestiona** el catálogo (retirar, orientar a grupos, reordenar)
       — hoy es lista fija en el picker. Anotado en §6 como deuda.
    6. **Grupos por color** (§5.18 / D9): A → Azul · B → Celeste · C → Naranja · D → Verde. **Grupo E
       ("Multiedad — taller abierto") retirado** — el prototipo tiene exactamente 4 grupos por color,
       y `datos.js` no tenía ningún NNA en E (verificado antes de retirar). `USUARIO.grupos:["A","E"]`
       → `["Azul"]`. `EQUIPO[i].g` remapeado en las 4 filas. `<select id="f_grupo">` con 4 options.
       ⚠️ **Divergencia acotada con §5.18 — explicada en §5.27:** la demo usa `GRUPOS[i].id = "Azul"`
       (nombre como identidad) en vez del `id serial + UNIQUE(nombre, anio)` del backend, porque la
       demo **no tiene concepto de año**. Se reconcilia en Fase 3 cuando la demo hable con la API.
       Colateral positivo: la búsqueda `deburr("azul")` ya no colisiona con nombres de NNA que
       contengan la letra (antes `"a"` matcheaba grupo A y todos los que tenían «a» en el nombre).
  - **2 fixes de layout aplicados sobre la marcha** (reportados por Samuel al abrir la demo):
    1. **Heatmap desbordado y luego con cuadros desproporcionados** (`css/estilos.css` §Analítica +
       `ui-core.js:441`). Causa raíz: los nombres nuevos son 2-3x más largos que los viejos, y el CSS
       tenía `white-space:nowrap` en `.heat th.row`. Primer fix: envolver con `white-space:normal` +
       `word-break:break-word` y `table-layout:fixed` para que las columnas respeten el ancho. Efecto
       secundario: filas con nombres largos crecían en altura y estiraban los `td` de valor (que sólo
       tenían `height:30px` como mínimo). Segundo fix: mover el cuadrito de color a un `<div
       class="heat-cell">` con dimensiones **fijas** (42×30) dentro del TD, así el visual del heatmap
       queda desacoplado de la altura de la fila.
    2. **Espacio en blanco a la derecha en todas las vistas** (`css/estilos.css:73`). Causa: el `main`
       tenía `max-width:1180px` — en pantallas anchas dejaba franja vacía después del sidebar (218px).
       Sacado el `max-width`, agregado `min-width:0` (previene el bug clásico de flex donde un ítem
       ignora `flex:1` por contenido ancho). `pagedesc` mantiene su `max-width:760px` porque una línea
       de párrafo muy larga se lee mal — sólo cambia el contenedor de cards/tablas/gráficos. El
       `@media print { main{max-width:none} }` de línea 533 seguía siendo redundante en runtime; ahora
       coincide con el layout normal.
  - **Archivos modificados (6):** `demo/index.html` · `demo/css/estilos.css` · `demo/js/catalogos.js`
    · `demo/js/datos.js` · `demo/js/grupos-usuario.js` · `demo/js/ui-core.js`. Diff bruto:
    +96 / −69 en los 5 primeros (antes del fix de layout); el layout suma unas líneas más.
  - **Verificación hasta acá:** **`node --check` en los 7 JS de `demo/js/` → OK** (todos parsean).
    Chequeo derivado con `vm` en Node: `bandaIdea(58)` = «Moderado» (**§12-A crítico intacto** —
    Martín sigue en su banda), bordes 0/15/16/30/58/75/90/96 correctos, `ALERTA_DELTA` = −7. Búsqueda
    por grupo con `"azul"` y `"grupo azul"` — funciona por lectura estática.
  - **NO verificado al momento del commit (deuda post-commit, ver §6):**
    - **Fingerprint Playwright** (`demo/verificacion/`): 3 pasos rompen a propósito (`banda` en analítica,
      talleres del heatmap, grupos en modelo/expediente). Hay que re-baseline con la demo actualizada,
      como se hizo en v4.1 con `D3_analitica_derivada`. Playwright **no estaba instalado en el clone al
      momento del commit** (no es dependencia del repo, §5.5.4) — se instala aparte con el comando del
      README de `demo/verificacion/`.
    - **Visual en navegador**: abrir `demo/index.html` con doble clic y recorrer Analítica · Grupos ·
      alta de NNA (picker de 14 talleres) · expedientes (los 8 NNAs). Los 2 fixes de layout se
      dispararon justamente por hacer este paso — quedan pendientes de revisar de nuevo con el fix.
      **Solapa parcialmente con la verificación visual de F1-nav** (§6.2 del prompt): Grupos y
      expedientes los recorre F1-nav; Analítica y alta de NNA no.
  - **§12.3 (coordinación):** Samuel tomó `demo/*` en esta sesión — avisar en el grupo cuando se
    haga el push, para que Lucas y Victor sincronicen antes de tocar la demo. Push hecho el 2026-08-16
    junto con el commit. (Samuel + Lucas + Claude)

- **2026-08-16** — **F1-nav · ajustes de navegación del frontend** (Lucas + Claude, rama
  `demo/F1-navegacion`). Ronda de demo, **fuera de la ronda M12** (M12.5/6 quedan sin tocar). Prompt
  ejecutado: `prompt-sesion-demo-F1-ajustes-frontend.md`. Arrancó inmediatamente después de commitear
  F1-alineación de Samuel en `main`. **Sin push todavía** — pendiente verificación visual + confirmación.
  - **Alcance real distinto al que asumía el prompt.** El prompt asumía cosas que el código actual no
    tiene (buttons de eval-bar con habilitación por estado, nombre de grupo como link, tres bloques
    del grupo ya existentes). El relevamiento previo (§0 del prompt) las anotó una por una antes de
    tocar código y el usuario aprobó el plan ajustado en base a eso.
  - **4 cambios aplicados:**
    1. **KPI «NNA activos» sin bajada.** `index.html:73` — eliminado el `<div class="sub">Convenio
       INAU</div>`. La bajada era **engañosa**: el número lo llena `ui-core.js:118` con
       `NNA.filter(p=>p.activo).length`, sin filtrar por convenio (el seed de `datos.js` no tiene
       campo `convenio`; verificado con `grep`). Anotado sin corregir: el `pagedesc` de `index.html:70`
       ("Expedientes del convenio INAU.") tiene el mismo problema y queda fuera de alcance de F1-nav.
    2. **`eval-bar` movida arriba de "Flujo de módulos".** `expediente.js:74-88` — swap del bloque
       eval-bar con `${flujoPanelHtml(p)}`. Mismos ids, mismos handlers, mismos botones. **Los botones
       NO dependen del estado del flujo** (contra lo que asumía el prompt §2): siempre visibles y
       enabled, la habilitación se chequea al hacer clic dentro de la vista destino. Como consecuencia,
       la barra no necesita re-renderizarse tras firmar/addendear — sólo `renderFlujo` se llama, que
       actualiza `flujoPanelBody`.
    3. **Barra secundaria de navegación entre `eval-bar` y `flujoPanelHtml`** con **3 accesos** (no 4):
       HCE-DOC, HCE-ORG, HCE-VF. **`Contacto familiar` EXCLUIDO** — no existe como sección propia
       (es una `info-card` en el layout izquierdo del expediente, `expediente.js:118-125`, con
       `p.referente/tel/loc`); se reporta y se espera instrucción (§3 del prompt). Implementación:
       clase CSS nueva `.section-nav` con `border:dashed` para no competir con `.eval-bar` sólida;
       ids `anchor-doc/-org/-vf` agregados a los `flujo-card` wrappers de `docPanelHtml`/`orgPanelHtml`/
       `vfPanelHtml` (`hce-doc-org-vf.js:52,202,394`); helper `scrollASeccion(id)` en `ui-core.js` que
       hace `scrollIntoView({behavior:'smooth', block:'start'})`. El contexto del NNA no cambia.
       `class="no-print"` en la barra la oculta al imprimir (ya en `@media print` del CSS).
    4. **Grupos — botón acceso + barra 3 accesos + bloque "Técnicos autorizados del grupo" NUEVO +
       cambio de responsables.** `grupos-usuario.js` reescrito parcialmente:
       - **Estructura de `GRUPOS[]` migrada:** el array plano `encargados:["Dr. X — Rol"]` se retira;
         cada grupo pasa a tener `responsable1:{nombre,rol}`, `responsable2:{nombre,rol}|null` y
         `tecnicosAutorizados:[]` (vacío por defecto). Helper `todosTecnicosDelGrupo(g)` devuelve la
         nómina completa con alcance derivado ("HCE completa del grupo · firma" para responsables,
         "Texto libre donde participa" para autorizados). Grupos Celeste y Verde tienen sólo
         `responsable1` (así estaban los `encargados` originales).
       - **Bloque nuevo "Técnicos autorizados del grupo"** (§21.1 del Manual): nota, tabla con
         Profesional/Rol/Alcance/acciones, alta por nombre+disciplina, botón Quitar por fila. Copiado
         semánticamente del Prototipo v4 (`HCE_IPPU_Prototipo_v4.html:2328-2330`). ⚠️ Esto es un
         **módulo nuevo en la demo** — pisa parcialmente la regla de §5.27 ("sin módulos nuevos");
         el usuario aprobó el override explícitamente para F1-nav (opción "crearlo copiando del
         prototipo v4"). No se cambian decisiones §5; queda anotado acá.
       - **Cambio de responsable 1/2:** vía modal reutilizando `openFlujoModal` (el mismo que HCE-DOC
         usa para autorización de imagen). Alcance fijo mostrado en el modal.
       - **⚠️ HCE-LOG a nivel grupo NO existe** — `logEvento(nna,...)` en `flujo.js:104` es por NNA.
         Los cambios de responsable **NO quedan registrados**. La UI lo dice explícitamente en el
         modal ("El cambio no queda registrado en HCE-LOG..."), y §5.18 ya conocía el límite (la
         fila del grupo es anual: el cambio sobrescribe). No se inventa vía nueva.
       - **KPI "Técnicos asignados"** ahora cuenta desde la estructura nueva
         (`GRUPOS.flatMap(g=>todosTecnicosDelGrupo(g).map(t=>t.nombre))` únicos), no desde `encargados`.
       - **Botón "→ Abrir detalle"** al lado del `h2` de cada card: como no hay vista de detalle
         separada (todo está inline en la card), hace `scrollASeccion('grp-${g.id}')`. El nombre del
         grupo NO se convierte en link (el prompt asumía que ya lo era; no lo era; se mantiene tal cual
         para no cambiar UX).
       - **Barra `.section-nav` al comienzo de cada cardbody** con 3 accesos: `Integrantes y estado
         del ciclo` (ancla `grp-{id}-integrantes`), `Técnicos autorizados del grupo`
         (`grp-{id}-tecnicos`), `Registro fotográfico grupal` (`grp-{id}-fotos`). "Estado del ciclo"
         no existe en la data — la etiqueta va tal cual la pidió el prompt, apunta al mismo bloque
         de Integrantes.
       - **Regla dura §8.4 / art. 11 CNA** (autorización de imagen bloquea fotos si falta consentimiento
         de las familias): NO se toca. Sigue en `hce-doc-org-vf.js` con `subirFoto`/`subirFotoGrupo`.
       - **CSS nuevo:** `.tec-aut-table` y `.tec-aut-alta` en `estilos.css`, más el bloque `.section-nav`
         del cambio 3.
  - **Regla anti-contradicción respetada:** no se reabre §5.2 (no-homologabilidad IDEA/IPPU-TEA,
    baremo desde `pct`, etc.), no se toca backend/pytest/M12, no se inventa el rol "tutor" (§7 y
    `puntos-a-validar.md` §2.10).
  - **Contradicciones código↔prompt anotadas** (que el prompt asumía como dadas y no lo eran):
    - Convenio INAU en el KPI (el número no filtra por convenio; el seed no tiene el campo).
    - Eval-bar con habilitación por estado (los botones no tienen tal lógica hoy).
    - Nombre de grupo como link (no lo era).
    - Detalle de grupo como vista aparte (no existe; todo es inline).
    - "Los tres bloques del grupo ya existen" (Técnicos autorizados NO existía; se creó copiando el prototipo v4).
    - `3 NNA del seed` (son 8, verificado con `grep 'id: \+\+nnaSeq' datos.js`).
  - **Verificación:** `node --check` sobre los 4 archivos JS modificados (expediente.js,
    hce-doc-org-vf.js, ui-core.js, grupos-usuario.js) — todos parsean OK. **NO** hice recorrida
    visual en navegador (esta sesión de Claude Code no controla un navegador). **NO** corrí el
    fingerprint Playwright (no está instalado en este clone; corresponde correrlo antes del push
    para tener una nueva línea de base F1-nav que incluya los cambios estructurales del
    `renderGrupos()`).
  - **§12.3 (coordinación):** rama `demo/F1-navegacion` local, sin push. Cuando se pushee, avisar
    en el grupo — Lucas retomó `demo/*` en esta sesión después de la F1-alineación de Samuel.
    (Lucas + Claude)

- **2026-08-17** — **Cruce del cuestionario de relevamiento (15/06) contra §2.1: la pregunta del IDEA
  no cierra sola.** Tarea de notas, **no** es sub-módulo de M12: no toca `app/models/` ni genera
  migración.
  - **El hallazgo.** `docs/markdown/Cuestionario IPPU UTEC, respuestas.md` — ya estaba en el repo,
    nunca se había cruzado contra §2.1 de `consulta-a-ippu.md` — responde P10 y P12 del Bloque 1: la
    frecuencia de evaluación con IDEA es «Anual» y las evaluaciones «aparecen por año (individual), no
    hay un histórico consolidado». Es anterior al Documento Técnico que introdujo la línea base única,
    así que describe la práctica con el sistema viejo — no resuelve la pregunta, pero es la primera
    evidencia escrita, y va en contra del supuesto vigente.
  - **Corrección al plan M12 §4.** Tenía a `consulta-a-ippu.md` §2.1 en la lista de preguntas que
    "cierran solas" en M12.8, por inferencia de que el Prototipo v4 modela `idea` como objeto único
    (no por confirmación de IPPU). Corregido: sigue abierta, con nota explicando por qué no se acorta.
  - **Agregado:** cita de fuente en `puntos-a-validar.md` §1.1 · párrafo reformulado en
    `consulta-a-ippu.md` §2.1, dirigido a Fernando, sin tocar la pregunta ni los checkboxes.
  - Nota aparte, sin acción: P31 del mismo cuestionario confirma que existe un «Área de Inclusión»
    (hoy todo en Drive, sin planilla estructurada) — contexto para cuando se resuelva el punto de
    catálogo de centros educativos de M12.5. No se creó pregunta nueva por esto.
  - Sin tests (no aplica). Commit + push a los dos remotos. (Lucas + Claude)

- **2026-08-17** — **F1-nav2 · rework de la vista Grupos: listado + detalle** (Lucas + Claude, rama
  `demo/F1-navegacion`). Continuación de F1-nav sobre la misma rama. Motivo: al ver la vista Grupos
  post-F1-nav, quedaba "todo inline en cards" — no coincidía con `vGrupos`/`vGrupoDetalle` del
  Prototipo v4 (`HCE_IPPU_Prototipo_v4.html:2295-2349`), donde el listado es breve (con link al
  detalle) y el detalle es una vista dedicada con crumb + header + 3 cards.
  - **Cambio de paradigma:** de una vista larga con todo inline a **listado plano + detalle-view
    separada dentro de la misma sección** (`#view-grupos`). Sin cambiar rutas ni sidebar. Estado
    local `_grupoAbierto` decide qué renderizar; `renderGrupos()` reinicia a listado,
    `abrirGrupo(gid)` → `renderGrupoDetalle(gid)`.
  - **Listado (`renderGrupos`, rewrite):** una card por grupo con h2 clickable (`btn-link.h2-link`),
    dupla técnica en la línea de hint, mini-tabla NNA/firmados-de-5, contador de fotos, botón
    "Abrir grupo". El KPI grid (`#gruposKpi`) sigue visible; se oculta con `display:none` al abrir
    detalle. **Se retiran** los ítems que F1-nav (2026-08-16) había puesto inline por card: la
    barra `.section-nav`, la data-row Encargados (ahora sólo en la nómina §21.1 del detalle), la
    data-row de Talleres/Días/etc (van al header del detalle). Semánticamente todo sigue vivo, sólo
    cambia dónde aparece.
  - **Detalle (`renderGrupoDetalle`, nuevo):** crumb «Grupos de referencia › Grupo X» (link
    invocando `renderGrupos()`), pagehead con h1 y línea "Técnicos responsables: · · N integrante(s)
    · Días · Horario", `obs` como bajada en itálica, y **3 cards**:
    1. **Integrantes y estado del ciclo** — tabla `.grupo-integrantes` con 4 columnas: NNA (nombre
       + edad + sexo, con `nroHC(n)` derivado y CI abajo), CIE-11 · Soporte (CIE-11 corto sin
       descripción + `p.apoyo` abajo), CI · LB · PA · PB · IC (5 mini-badges por `estadoModulo`),
       Uso de imagen (mbadge firmado/bloqueado según `p.autImagen.registrada`).
    2. **Técnicos autorizados del grupo** — **CONDICIONAL** a `puedeAdministrarTecnicos()` (ver
       abajo). Si no se ve, en lugar aparece `notice.info` explicando "Nómina §21.1 no visible:
       tu rol actual (X) no incluye la administración…".
    3. **Registro fotográfico grupal** — usa `notice.ok`/`notice.warn` según `grupoAutImagen(g.id).ok`,
       con `uprow` para el form de carga (input file + descripción + botón), thumbnails con
       placeholder visual (📷). La regla dura §8.4 sigue en `subirFotoGrupo` de recordatorios.js,
       intacta.
  - **Permiso §21.1 (nuevo modelo, simplificado para demo):**
    - `USUARIO.puedeAdministrarTecnicos: false` — flag nuevo, default false porque el USUARIO seed
      es "Técnico de referencia" (cargo Manual).
    - Helper `puedeAdministrarTecnicos()` retorna el flag.
    - Toggle nuevo en `renderUsuario()`: card "Permisos (simulación demo)" con checkbox "Simular
      rol con acceso a la nómina §21.1 (Coordinación / Dirección técnica)". Handler
      `toggleCoordinacionDemo(v)` — si el detalle está abierto, re-renderiza para reflejar el cambio
      instantáneamente. **La demo NO decide qué roles tienen acceso** — eso lo define IPPU; el toggle
      simula la matriz de permisos que va a implementar el backend.
    - Bloque §21.1 se render sólo si el flag es true; si no, `notice.info` visible con el
      motivo. Los handlers (`agregarTecnicoAutorizado`, `quitarTecnicoAutorizado`,
      `abrirCambioResponsable`, `confirmarCambioResponsable`) siguen igual, pero ahora llaman
      `_refrescarVistaGrupos()` (nuevo helper) que decide entre `renderGrupos()` o
      `renderGrupoDetalle(_grupoAbierto)`.
  - **`todosTecnicosDelGrupo(g)` retocado:** ahora devuelve `{nombre, rol, disciplina, alcance,
    esResponsable, ixAutorizado}`. Para responsables `rol="Técnico/a responsable 1|2"` y
    `disciplina=responsable.rol` (Psicología, Fonoaudiología…). Para otros habilitados
    `rol=disciplina`. Esto matchea la columna "Rol / disciplina" del prototipo v4, donde para los
    responsables sale «Técnico/a responsable 1» y para los demás la disciplina directamente.
  - **`nroHC(n)` helper (nuevo):** deriva `HC-YYYY-NNN` a partir de `id` con año de `altaFecha` o
    año actual como fallback. Formato copiado del prototipo v4 (que muestra `HC-2025-014`). Como
    los ids seed son 101-108, salen `HC-YYYY-101`..`HC-YYYY-108`. Si IPPU tiene un formato oficial,
    se sustituye (§7 F1-nav2, nueva pregunta abierta).
  - **CSS nuevo (`estilos.css`):** `.grupos-grid` (grid auto-fill), `.grupo-card`, `.btn-link.h2-link`
    (el h2 clickable), `.grupo-mini` (mini-tabla del listado), `.grupo-integrantes` (tabla del
    detalle), `.notice`/`.notice.ok`/`.notice.warn`/`.notice.info` (boxes reutilizables del
    prototipo v4), `.uprow` (fila de carga), `.thumbs`/`.thumb`/`.thumb-img`/`.cap` (thumbnails
    con placeholder 📷 — no hay sistema de archivos real), `.pagehead` (cabecera de página estilo
    prototipo v4).
  - **Regla anti-contradicción respetada:** no se toca §5.2 (reglas duras); §8.4 (autorización
    de imagen) intacta; no se cambia el modelo de datos §21.1 más allá de lo que ya se había
    decidido en F1-nav (responsable1/2 + tecnicosAutorizados); no se agrega backend.
  - **Contradicción resuelta:** F1-nav (2026-08-16) había asumido que la vista Grupos era "una
    sola vista larga" (por eso las barras `.section-nav` inline). En realidad el prototipo v4 la
    modela como listado + detalle. F1-nav2 corrige esa lectura y adopta el paradigma del prototipo.
    La `.section-nav` de F1-nav se retira de la vista Grupos (sigue vigente en el expediente,
    Cambio 3 de F1-nav — ahí el paradigma sí es una vista larga).
  - **Preguntas abiertas nuevas (§7 F1-nav2):**
    - Matriz de roles §21.1 — quiénes ven / administran la nómina. Impacta backend.
    - Formato oficial del Nº de HCE — el `nroHC(n)` derivado puede no coincidir con el usado en la
      HCE actual (≈14 años).
  - **Verificación:** `node --check` en verde en `grupos-usuario.js` (+ los 3 JS de F1-nav que no
    se re-tocaron). **NO** hay recorrida visual en navegador (Claude Code no controla browser).
    **NO** hay fingerprint Playwright post-cambio (Playwright no instalado). F1-nav2 rompe varios
    pasos del fingerprint por diseño (nueva estructura de `renderGrupos()`, tabla de integrantes,
    thumbnails) — cuando se re-baseline habrá que aceptarlos.
  - **§12.3 (coordinación):** rama `demo/F1-navegacion` (pusheada el 2026-08-16 con F1-nav; se
    pushea F1-nav2 hoy). Cuando se pushee, avisar en el grupo. (Lucas + Claude)

- **2026-08-19** — **F1-nav4 · sección «Ateneos y capacitación» en la demo** (Samuel + Claude, rama
  `demo/F1-navegacion`). Continuación de F1-nav sobre la misma rama. Se porta la sección `#/ateneos`
  del Prototipo v4 (`HCE_IPPU_Prototipo_v4.html`: nav línea 227 · `AT_TIPOS` 1822 · `DB.ateneos[]`
  1823-1861 · `vAteneos` 1878 · `vAteneoDet` 1911 · panel del resumen 882), con la fuente, los
  colores y el formato de la demo. Es el tercero de los tres módulos que Samuel dejó anotados como
  «FALTA agregar» al cerrar el 2026-08-16 (§6); **quedan PAI INAU y HCE-INC individual**.
  - ⚠️ **Deuda de registro heredada:** la ronda **F1-nav3 (tablero de Inclusión, `js/inclusion.js`,
    fechada 2026-08-18)** está en el código pero **no tiene entrada en esta bitácora ni en §6**.
    No la escribe esta sesión (no la hizo y no va a inventar lo que se decidió ahí): la tiene que
    completar quien la haya hecho.
  - **Archivos:** **nuevo** `demo/js/ateneos.js` (único archivo propio de la ronda) · `index.html`
    (ítem de menú + `#view-ateneos` + `<script>` al final) · `css/estilos.css` (bloque `.at-*`) ·
    `js/expediente.js` (**dos líneas**: `${ateneosPanelHtml(p)}` y su atajo en la `.section-nav`).
  - **Alcance portado:** listado con los 4 filtros del prototipo (tipo · año · grupo · texto en
    título/situación/contenidos), alta con correlativo, baja con confirmación, y detalle editable
    con **campos según tipo** — desarrollo clínico (situación → hipótesis → recursos → tabla de
    acuerdos con responsable y plazo → seguimiento) para los tres tipos de ateneo, y capacitador /
    modalidad / contenidos / materiales / evaluación para la jornada. La `notice` de
    **confidencialidad** (Ley 18.331) va textual del prototipo.
  - **Ajuste del mismo día (Samuel):** se **retira** la `notice` que el prototipo pone al abrir el
    listado con el flujo del registro (situación → hipótesis → recursos → acuerdos → seguimiento).
    La secuencia no cambia —es la del prototipo y sigue guiando el formulario— y el detalle la
    conserva en su propio `hint`, que es donde se carga; arriba del listado sólo empujaba la tabla
    hacia abajo. **Es la única `notice` del prototipo que la demo no reproduce.**
  - **Paradigma de navegación:** listado + detalle **dentro de la misma vista**, como Grupos
    post-F1-nav2. El prototipo usa dos rutas de hash (`#/ateneos` y `#/ateneos/<id>`) y la demo no
    tiene router. Clickear el ítem del menú vuelve siempre al listado (mismo criterio que Grupos).
  - **Vínculo cruzado con la HCE:** `ateneosPanelHtml(p)` agrega al expediente la tarjeta «Ateneos
    clínicos referidos a este NNA» (`anchor-ateneos`), siguiendo el patrón de
    `docPanelHtml`/`orgPanelHtml`/`vfPanelHtml`. Se hizo porque el texto del prototipo **promete**
    ese vínculo en la propia descripción de la sección: dejarlo sin implementar era escribirlo y
    que no fuera cierto.
  - **Dos divergencias deliberadas respecto del prototipo, las dos escritas en la cabecera del
    archivo:**
    1. **Prefijo único `AT-`.** El seed del prototipo escribe la jornada como `JC-2026-001`, pero
       su propio `atNuevo()` genera siempre `AT-` y **M12.7 ya cerró el punto**: `Ateneo.codigo` es
       derivado con un único `ATENEO_CODIGO_PREFIJO`. Emitir `JC-` contradecía una decisión ya
       registrada (regla anti-contradicción de `CLAUDE.md`), así que la jornada del seed es
       `AT-2026-002`.
    2. **Cambiar el tipo limpia las referencias que ese tipo no admite** (`nna` y/o `grupo`). El
       prototipo las deja colgadas; el backend tiene CHECK que lo prohíbe (bitácora del
       2026-08-15). Una demo que deja armar un registro que la API va a rechazar miente.
    - También se sigue la semántica de `anio_correlativo` de M12.7: el correlativo es del **año de
      registración** y el filtro por año mira **`fecha`**, así que un `AT-2027-001` con fecha de
      diciembre 2026 aparece bajo «2026». Es a propósito — libro de actas, no orden cronológico.
  - **Remapeo del seed al modelo de la demo:** `nna:'U-0001'` → `nna:101` (Sofía R., que ya está en
    grupo Celeste como allá) y `'Grupo Celeste'` → `'Celeste'` (los ids reales de `GRUPOS`, §5.18/D9).
  - **Dos cosas que NO son del prototipo y se agregaron igual, chicas:** `atEsc()` (escape de texto
    del usuario en atributos — sin él, un título con comillas rompe el formulario, y acá el
    contenido se tipea en pantalla) y el re-render **sólo de las filas** al filtrar (`atRenderFilas`),
    porque el buscador usa `oninput` y recrear el `<input>` le robaba el foco en cada tecla. El
    prototipo puede permitirse `route()` entero porque usa `onchange`.
  - **Deudas conocidas (no bloquean, quedan anotadas):**
    - **Sin HCE-LOG.** El HCE-LOG de la demo es por NNA y un ateneo es transversal — misma
      limitación ya registrada para el cambio de responsable de grupo (§5.18). El prototipo tampoco
      lo hace: lo declara pendiente del sistema definitivo.
    - **Sin adjuntos.** `docs[]` existe en el prototipo y §5.25 ya modeló el XOR
      `documento.hce_id` / `documento.ateneo_id`, pero HCE-DOC en la demo es por expediente. Cuando
      la demo absorba el alcance institucional de HCE-DOC, se engancha acá.
    - **Sin guard «una jornada no lleva acuerdos»** ni coherencia `fecha` ↔ año del grupo: son
      guards de **M11.3**, no de la demo. La UI ya no ofrece acuerdos cuando el tipo es jornada,
      pero el array queda si alguien cambia el tipo después de cargarlos.
    - **`.hint` no existe como clase global** (sólo `.field .hint`), así que Grupos e Inclusión la
      vienen usando suelta y sin estilo. Esta ronda **no la tocó** para no cambiar de aspecto vistas
      ajenas: definió `.at-hint` propia. Si el equipo quiere, promoverla a global es un renglón.
  - **Verificación:** `node --check` en verde en los 14 JS. Además, **concatenación en el orden de
    `index.html`** para descartar redeclaraciones en el scope global (los `<script>` clásicos lo
    comparten) — en verde. Y un **smoke test headless** con un shim mínimo de DOM (no hay Playwright
    ni jsdom en esta máquina, sin red para instalarlos): carga los 14 scripts sin excepciones y
    ejercita 30 asserts sobre la sección — render, los 4 filtros, detalle clínico vs. jornada,
    alta/baja, herencia de grupo al elegir NNA, limpieza al cambiar de tipo, escape de texto y el
    panel del expediente. **Todo en verde.** El harness quedó **fuera del repo** (scratchpad de la
    sesión): agregarlo a `demo/verificacion/` cambiaría la historia de tooling del equipo y eso se
    decide en grupo — si lo quieren, se commitea aparte.
    **NO** hay recorrida visual en navegador (Claude Code no controla browser) ni fingerprint
    Playwright — F1-nav4 agrega markup nuevo, así que cuando se re-baseline habrá pasos nuevos.
  - **Regla anti-contradicción respetada:** no se toca §5.2; `AT_TIPOS` entra como **constante** y no
    como catálogo, igual que en M12.7; la entidad es **una sola con campos según tipo**, no cuatro.
  - **§12.3 (coordinación):** archivo propio `js/ateneos.js`; de compartidos sólo `index.html`,
    `css/estilos.css` y **dos líneas** de `js/expediente.js`. Avisar en el grupo antes de pushear.
    (Samuel + Claude)

- **2026-08-19** (segunda) — **Cruce del handoff contra las preguntas abiertas: seis inconsistencias.**
  Tarea de notas, sin código. Se corrigieron dos; las otras cuatro quedan anotadas acá.
  - **Corregida 1 — la rama iba una commit atrás de `main`.** `684c4f5` (el cruce del cuestionario
    15/06 que **reabre §2.1, IDEA anual**) estaba en `main` y no en `demo/F1-navegacion`, así que en
    esta rama §2.1 seguía figurando como pregunta que "cierra sola" en M12.8. **Merge, no rebase** —
    la rama ya está pusheada y Lucas y Victor la tienen. Único conflicto: §13, porque los dos lados
    agregan bitácora al final; resuelto por fecha real de commit (cruce 09:48 antes de F1-nav2 10:44).
  - **Corregida 2 — `consulta-a-ippu.md` §3.1 le prometía a IPPU algo que no existe.** Decía, en
    presente y en el documento que se les manda, que «el sistema los deja agregar, cambiar de orden,
    indicar a qué grupos se orientan y dar de baja desde la propia aplicación». Eso lo tiene el
    **Prototipo v4** (`tallerAdd`, `tallerToggle`, `tallerGrupos`), no lo nuestro: §6 de este archivo
    y `puntos-a-validar.md` §2.9 registran que **la demo carga nombres y no administra**, y que no
    hay endpoint ni pantalla. Reescrito: se mantiene lo que sí es cierto (el diseño del catálogo y
    que la participación se guarda **por nombre**, así que dar de baja no borra lo registrado) y se
    dice explícitamente que **la pantalla todavía no está construida**.
  - **Anotadas, sin tocar** (cambian documentos que §5 manda modificar por escrito, o tienen dueño):
    1. **§9 «Datos clave» quedó pre-M12 y se contradice con §5 y §7 de este mismo archivo:** dice
       **«5 grupos»** (§5.18/D9: son **4** por color, el grupo E se retiró) y **«18 talleres»** (§7
       Resueltas: son **14** y «el "8 vs 18" **era falso**»). Además `30 INAU + 108 BPS` = 138, no
       los «~120 NNA» de la misma línea.
    2. **Los conteos de `puntos-a-validar.md` en §6 están viejos:** dice «9 puntos para IPPU / 8 para
       el equipo»; el archivo tiene **14** (§1.1–§1.14) y **10** (§2.1–§2.10). Los 6 supuestos sí dan.
    3. **Dos preguntas de §7 que nunca entraron a `consulta-a-ippu.md`:** el **catálogo de centros
       educativos** (y P31 del cuestionario ya confirmó que el Área de Inclusión existe y está «todo
       en Drive, sin planilla estructurada» — es el momento de preguntarlo) y **«tutor»** (§2.10 de
       `puntos-a-validar.md`; está clasificada como punto de equipo, pero el fondo —si hay un
       referente por NNA distinto del técnico responsable— sólo lo contesta IPPU).
    4. **F1-nav3 (Inclusión, commit `648cb04`) sigue sin entrada en esta bitácora ni en §6.** La
       tiene que completar quien la hizo; esta sesión no inventa lo que se decidió ahí.
  - **Cruzó consistente, sin acción:** las dos divergencias de F1-nav4 coinciden con lo ya decidido
    en `puntos-a-validar.md` §1.13 (prefijo único `AT-`) y §1.14 (correlativo de registración), y la
    consulta ya las pregunta en §3.14. §3.13 pregunta por el ateneo de grupo, que es justamente el
    silencio que la demo reproduce del prototipo. (Samuel + Claude)

- **2026-08-20** — **Sesión de pivote y limpieza del repo · Fase 1 (decisiones).** Con M12.5/M12.6/M12.8
  frenados por validación y no por falta de manos, la sesión no escribe modelos: escribe decisiones, mide
  costos y ordena el repo. **Cinco decisiones nuevas: §5.28–§5.32.** (Lucas + Claude)
  - **§5.28** — el bloqueo del backend nombrado sub-módulo por sub-módulo, con su condición de desbloqueo. Y
    **M13 no se abre**: el restyle que iba a hacer ya está en curso dentro de F1 (`5544e71`, 1.371 líneas de
    `estilos.css`), así que abrirlo en paralelo era la duplicación de §5.3. Queda como evaluado y absorbido.
  - **§5.29** — enmienda a §5.7: se purgan los originales de `docs/fuentes/`, con keep-list archivo por
    archivo y con lo que se acepta perder medido (29 imágenes, no estimadas).
  - **§5.30** — `docs/fuentes/prototipo-v4/` estaba mal clasificado: código lo lee en runtime mientras la
    regla dice «no se leen». Se mueve a `docs/prototipo-v4/`.
  - **§5.31** — el argumento de costo de §5.8 se dio vuelta, **medido contra el código**.
  - **§5.32** — «Samuel» y «Boris Furtado» son la misma persona.
  - **Creado `docs/planes/agenda-reunion-ippu-2026-08.md`**: la recorrida con IPPU pantalla por pantalla,
    cada una con el supuesto que pone a prueba y lo que costaría un «no». Es agenda, no ronda de frontend:
    no toca `demo/`.
  - **Corrección de hecho al cuestionario.** El plan M12 afirma en tres lugares (líneas 452, 557 y 577,
    escritas el 2026-08-14) que `consulta-a-ippu.md` «nunca se envió». **Se envió el 2026-08-19** (dato de
    Lucas). Era cierto al escribirse y dejó de serlo cinco días después: el plan quedó **viejo, no
    equivocado**. ⚠️ Todavía no hay respuesta, pero **hace un día**: no es «IPPU no contesta». Y queda una
    **tensión sin resolver** — la línea 577 decidió el 14/08 «no por correo» y el 19/08 salió por correo;
    lo aclara por escrito quien envió (§5.28). Se corrige en la Fase 2.

- **2026-08-20** — **Hallazgos sobre `demo/F1-navegacion`, registrados sin tocar la rama.** F1 es ronda
  abierta de otra persona (§5.32: Boris/Samuel) y su ítem (d) —si se mergea— es decisión del dueño. **No se
  mergeó y no se editó un solo archivo de `demo/`.** Se dejan asentados porque son deuda que su cierre
  hereda, y porque uno de ellos afecta la agenda de la reunión. (Lucas + Claude)
  1. ⚠️ **Regresión de talleres.** `g.talleres` sigue definido en los 4 grupos
     (`js/grupos-usuario.js:34, 40, 46, 52`) y **no se dibuja en ningún lado**: lo único que sobrevive es el
     KPI agregado «Talleres cubiertos: N de 14» (`:93`). En `main` la lista se dibujaba como tags por grupo
     (`:56`). Es **pérdida silenciosa de capacidad** y cae justo sobre §5.14 / D5, que es uno de los
     supuestos que la reunión tenía que validar mirando la pantalla. Además `index.html:401` sigue
     prometiendo que «cada grupo tiene técnicos **encargados**, días/horarios y **talleres asignados**»:
     las dos mitades son falsas hoy — F1 renombró `encargados` y sacó los talleres de la vista.
  2. ⚠️ **El harness de verificación está roto en F1 y no tiene baseline para volver.** `fingerprint.js:82`
     recorre `['inicio','pendientes','analitica','grupos','usuarios']` y clickea
     `.navitem[data-view="${v}"]`; **B2 borró `data-view="usuarios"`** del `index.html` (0 ocurrencias en
     F1, 1 en `main`), así que muere en ese paso. **F1 no puede auto-verificarse.** Y el problema de fondo es
     peor: `demo/verificacion/.gitignore` excluye `*.json`, de modo que **no hay ningún fingerprint
     versionado** contra el cual re-baselinear. El ítem (c) de F1 en §6 —«re-baseline del fingerprint»— **no
     es una tarea pendiente: es imposible tal como está diseñado el harness**. El único método que funciona
     es comparar dos worktrees, y el `README.md` lo menciona **en una línea suelta** (línea 44, «usá
     `git stash` o un `git worktree`»), no como procedimiento. §5.5 vendió este harness como la red de
     seguridad de todo refactor de la demo; **hoy no atrapa nada**. Deuda que hereda el cierre de F1.
     **Arreglo propuesto, a elección de quien cierre F1:** versionar un fingerprint de referencia, **o**
     escribir el procedimiento de dos worktrees en `demo/verificacion/README.md`.
  3. ⚠️ **Cambio de modelo hecho en la capa de presentación.** `GRUPOS` pasó de `encargados: string[]` a
     `responsable1` / `responsable2` (objetos `{nombre, rol}`, el segundo nullable) **+
     `tecnicosAutorizados: []`**. **§5.18 / D9 no modela nada de eso**: modeló `grupo` con id propio y
     `UNIQUE(nombre, anio)`, sin responsables y sin técnicos autorizados. **No hay decisión en §5 detrás de
     este cambio** y diverge del backend. Queda como **ítem de reconciliación** para la próxima vez que se
     toque `grupo` — y con efecto inmediato en la reunión: lo que IPPU vea en esa pantalla está **mostrado
     pero no modelado**, así que un «sí» de ellos es **trabajo nuevo**, no un supuesto confirmado
     (`agenda-reunion-ippu-2026-08.md` §4).
  4. ⚠️ **F1 excedió el alcance que §5.27 le fijó.** §5.27 dice, textual: «**No** se agregan módulos nuevos
     (HCE-SEV, HCE-INC, HCE-PAI, **Ateneos**)». F1 agregó `js/ateneos.js` (488 líneas) y `js/inclusion.js`
     (175 líneas) — es decir, Ateneos y HCE-INC — **sin enmendar §5.27**. El propio §6 de F1 los describe
     como F1-nav3 y F1-nav4, así que no está oculto; lo que falta es la enmienda escrita. Por §12.6 esto se
     resuelve por escrito en §5, no de hecho: **lo tiene que hacer quien cierre F1**, ampliando §5.27 o
     abriendo decisión nueva. No se toca desde acá.
  5. ✅ **Resultado positivo, y vale registrarlo.** El restyle **no tocó comportamiento**: 23 pasos idénticos
     cubriendo todos los guards clínicos, catálogos byte a byte iguales, cero funciones globales perdidas.
     El riesgo grande de un restyle de 1.371 líneas **no se materializó**; lo que se rompió es lo de arriba,
     que es acotado y reparable.
  - **Nota:** los puntos 1 y 2 ya se los pasó Lucas a Boris de palabra; quedan acá igual, fechados, para que
    existan en el repo y no dependan de que alguien se acuerde.

- **2026-08-20** — **Fase 2: ejecución de la limpieza.** Cuatro commits separados por propósito, sobre el
  tag `pre-limpieza-2026-08-20` (anotado, pusheado a los dos remotos, y su mensaje **dice que marca `main`
  sin F1 mergeada** para que nadie lo confunda con una foto completa). (Lucas + Claude)
  - **Borrado** (`f3a97f4`): 10 originales de `docs/fuentes/` + `docs/markdown/IPPU.md` + los dos
    documentos del backend v1 (`esquema-datos.md`, `ejemplos-endpoints.md`). `docs/fuentes/` queda con
    **dos** archivos. **Movido:** `docs/fuentes/prototipo-v4/` → **`docs/prototipo-v4/`**, con la exclusión
    del grafo repuesta a mano en `.graphifyignore` — al salir de `fuentes/` la había perdido.
  - **Barrido de referencias completo:** `CLAUDE.md` (mapa, ejemplo de conversión, regla de conversión —
    reescrita para decir que el original **se borra**) · `README.md` · `docs/estructura-repositorio.md` ·
    `prototipo-v4-referencia.md` · `PLAN-M12` · `backend/README.md` · `esquema-datos-v2.md` ·
    `catalogos_iniciales.json` (`_origen`, regenerado) · `handoff.md` §0.6 y cabecera.
    **Rutas en código:** `generar_catalogos_backend.py` (líneas 41–42) y `extraer_prototipo_v4.js`.
  - ⚠️ **Corrección de hecho al plan M12**, en tres lugares: decía que `consulta-a-ippu.md` «nunca se
    envió». **Se envió el 2026-08-19.** Sin respuesta todavía, pero hace un día: se corrigió el texto para
    que no se lea como reclamo a IPPU, y se dejó anotada la tensión con la decisión de «no por correo».
  - **`graphify-out/` desversionado** (`e782f36`) y **`docs/prompts/` creada** (`70bf2aa`).
  - **`herramientas/verificar_estado.py`** (`0271ea8`), el arreglo durable del desfasaje docs↔repo que ya
    pasó **cuatro veces**. Dos cosas que costaron iteraciones y quedan escritas en su docstring: el corte
    entre presente e historia es **estructural** (en `handoff.md` se compara sólo hasta `## 5.`), porque
    adivinar por prosa marcaba 13 líneas correctas para su fecha — y **el nombre de un sub-módulo no marca
    historia**: ponerlo producía el falso negativo exacto que el script viene a evitar, ya que la línea
    real que decía «36 tablas» es *«…de M12.7: **38 tablas**»*. **Probado inyectando las cuatro derivas.**
  - **Verificación, con los números reales:** barrido de referencias colgantes → **0** ·
    `generar_catalogos_backend.py --check` → **OK** · `pytest -q` → **240 passed, 0 skipped** ·
    `verificar_estado.py --check` → **OK** · `node --check` sobre los 12 módulos de la demo → OK.
  - ⚠️ **`git merge --no-commit --no-ff gitlab/demo/F1-navegacion` da UN conflicto**, y es esta misma
    entrada de bitácora contra las de F1: las dos apéndices al final del archivo. **Medido antes y después
    de la sesión:** el baseline era limpio y **la Fase 2 no agregó ninguno** — la purga, el movimiento, la
    desversión, `docs/prompts/` y el verificador mergean todos limpio, porque F1 no toca ninguno de esos
    archivos. **La resolución es determinista:** primero las entradas de F1 (16 al 19), después ésta (20),
    que es la cronología que §13 ya usa. Nada se pierde.
  - **La demo no se tocó:** `git status` sobre `demo/` vacío en toda la sesión. La verificación fue
    **read-only**; no se abrió navegador, así que lo que se afirma es que los archivos están intactos y
    parsean, no que alguien miró la consola.

- **2026-08-20** — **Fase B: se mergea F1, y aparece que el repo tenía el cuestionario equivocado.**
  Sesión de víspera (la reunión con IPPU es el 21/08). **Tres decisiones nuevas: §5.33–§5.35.**
  (Lucas + Claude)
  - **§5.33 primero, y el orden importa.** F1 agregó `ateneos.js` (488) e `inclusion.js` (175) — **663
    líneas de módulo nuevo** que §5.27 prohibía textualmente. La enmienda se escribió **antes** del merge,
    no después: §12.6 pide que una decisión escrita se cambie por escrito y antes del hecho, no que el
    merge la cambie de hecho. Se acepta porque esas 663 líneas son lo único que pone M12.5 y M12.7
    delante de IPPU mañana — **el exceso de alcance y el valor para la reunión son el mismo hecho**.
  - **Merge `--no-ff` de `demo/F1-navegacion` (`5544e71`).** Conflicto **único**, en §13, **tal cual lo
    predijo el dry-run de la Fase A** — y la entrada §5.33, escrita antes, **no agregó ninguno**.
    Resuelto en cronología: primero las entradas de F1 (17 y 19), después las del 20. **Nada se
    descartó de ninguno de los dos lados** (100 líneas de un lado, 194 del otro, 295 con el separador).
  - **Regresión de talleres reparada (§5.14 / D5).** `g.talleres` seguía sembrado en los 4 grupos
    (`grupos-usuario.js:34/40/46/52`) pero F1 había retirado la fila que los dibujaba: sobrevivía sólo el
    KPI agregado «Talleres cubiertos: N de 14». **Se restauró en el markup y el estilo de F1**, no
    revirtiendo su restyle — `.talleres-list`/`.taller-tag` **siguen definidas** en `estilos.css:832`, F1
    las restiló y las dejó **sin uso**. Va como card propia en el detalle del grupo. Y `index.html:401`
    prometía «técnicos **encargados** … y **talleres asignados**»: F1 renombró lo primero y quitó lo
    segundo, así que las dos mitades se leían como bugs en una recorrida.
  - **Deuda del harness, descargada por el lado barato.** El ítem (c) de §6 de F1 —«re-baseline del
    fingerprint»— **es imposible como está diseñado el harness**: `verificacion/.gitignore` excluye
    `*.json`, así que **no existe ninguna captura versionada** contra la cual re-basear. En vez de
    inventar una a medianoche, se escribió el **procedimiento de dos worktrees** en
    `demo/verificacion/README.md` —pasó de ser una línea suelta a comandos que se copian y pegan— más
    por qué no hay baseline y qué haría falta para tenerlo. ⚠️ **Y lo que faltaba decir en voz alta: el
    harness hoy no corre de punta a punta.** `fingerprint.js:82` hace click en
    `.navitem[data-view="usuarios"]`, que **B2 sacó de la barra** (el `#view-usuarios` existe, se llega
    por otro lado), así que la corrida **aborta ahí**; y no visita `inclusion` ni `ateneos`. §5.5 vendió
    este harness como la red de todo refactor de la demo: **una red que no se sabe rota es peor que no
    tenerla.**
  - ⚠️ **§5.34 — el repo describía un cuestionario que IPPU no tiene.** El documento que salió el 19/08
    **no** es `consulta-a-ippu.md` con §3.1 corregido: el equipo lo revisó antes de mandarlo, **sacó tres
    preguntas** y renumeró todo lo posterior. Es la **quinta** divergencia docs↔realidad de la ronda y
    **la primera con la otra mitad afuera del repo**, que es exactamente la que ningún script de acá
    podía ver.
    - **Las tres que se sacaron y nunca se preguntaron:** §2.7 y §2.8 (los dos del **baremo**) y **§3.2,
      las citas de la Escala IPPU-TEA, que estaba marcada ⚠️**. Verificado sobre el documento enviado:
      **0** ocurrencias de «baremo», «BUND» y «72/025»; **0** de cualquier pregunta por citas. **No se
      relocalizaron: no están.**
    - ⚠️ **El documento se contradice a sí mismo y IPPU lo tiene en la mano:** su intro sigue diciendo
      que las que más frenan son «**3.2** (las citas de la escala) y **3.3** (el acceso al sistema)» —
      numeración del borrador. En el enviado, §3.2 **es** «Acceso al sistema» y §3.3 es «Qué hacer con
      los expedientes que ya existen». **Dos punteros rotos, no uno.** No se corrige el archivo: es el
      registro de lo que se mandó. Se aclara de palabra en la reunión (agenda §1).
    - **§3.1 está bien.** Trae la corrección de F1 (`554ff37`): «lo que todavía no construimos es la
      pantalla para hacer esos cambios». **Sin sobrepromesa. Nada que desdecir mañana.**
    - **Qué se hizo:** `consulta-a-ippu.md` pasa a ser el **snapshot del documento enviado**, palabra por
      palabra — **verificado: 2.695 palabras idénticas**, sólo se normalizó el marcado que arrastraba la
      conversión del `.docx`. Cabecera de estado nueva (es snapshot de un **Google Doc del equipo**,
      ⚠️ **falta pegar el link**). La versión superada **se borró**, apoyándose en git y en el tag
      `pre-limpieza-2026-08-20` (precedente §5.5, reusado en §5.29), y las tres preguntas retiradas se
      conservan **con su redacción original** en `puntos-a-validar.md` §1.2 y §1.4.
    - **Barrido de referencias, misma disciplina que la purga de la Fase 2.** Corregidas: `handoff.md`
      §5.18 y §6 (F1-nav), `puntos-a-validar.md` §2.6, `esquema-datos-v2.md` §2.1 y `PLAN-M12` §4.
      **Resultado: 0 citas vivas apuntando a numeración vieja.** Las de §13 no se tocaron: describen
      estado pasado y eran correctas a su fecha.
    - **Dos afirmaciones falsas que no eran de numeración:** §6 decía «Parte 3, **11** dudas puntuales»
      (son **14**) y nombraba entre las cuatro ⚠️ una pregunta **que no existe**; §7 daba el baremo por
      **preguntado** cuando nunca se preguntó.
    - ⚠️ **`verificar_estado.py` no puede atrapar esta clase de deriva**, y quedó escrito como límite
      conocido con arreglo candidato (contar secciones `^### N.N` de `docs/notas/` contra lo que §6
      afirma). **Se dejó sin implementar a propósito:** la víspera de una reunión no es noche de extender
      la herramienta de verificación.
  - **§5.35 — la puerta de §5.8 no está antes de M12.5, está antes de M11.3.** Medido contra el código:
    M12.5 no toca `idea` en ninguna línea de su especificación, y el pase a IDEA anual **ya es aditivo**
    —`ix_idea_hce_id … unique=False` (`9246e659d2c9:392`), `idea` ya es 1:N—. Deja de serlo en **M11.3**,
    donde «la vigente es la de mayor `fecha_consenso`» (`modulos.py:219`, test en `test_esquema_v2.py:54`)
    pasa de docstring a guards. **Enmienda la fila de §5.28 escrita el mismo día** (entrada nueva, no
    edición: §5 es append-only). ⚠️ **No ratifica §5.8 y no destraba M12.6**, cuyo segundo bloqueo —el
    material que falta de IPPU— sigue en pie. `PLAN-M12` §7 dejó de decir «antes de M12.5».
  - **Sexta divergencia, y la creó este mismo merge:** la doc decía **12 módulos** de demo y pasaron a
    **14**. Corregida en `CLAUDE.md`, `README.md`, `docs/estructura-repositorio.md` y la cabecera de este
    archivo. ⚠️ **`verificar_estado.py --check` daba OK igual** — no cuenta módulos de la demo. La
    encontró un `grep`.
  - **Agenda reescrita y hoja de aterrizaje creada.** La agenda ahora **no vuelve a preguntar lo que IPPU
    ya contestó** en el cuestionario del 15/06: acceso a la HCE (P3/P45) pasa a «quién redacta el
    documento de confidencialidad y para cuándo»; fotos (P43, la autorización de imagen ya existe y es
    genérica) pasa a «¿el bloqueo les traba el día a día?»; inclusión (P31) pasa a «pásennos la planilla
    del Drive». **Talleres subió al tope**: en junio contestaron **«No»** a registrar asistencia (P14) e
    indicadores por taller (P15), y **M12.6 está por construir `pai_taller`** — la primera pregunta es si
    estamos modelando una práctica que no existe. **§4 (dos técnicos) se pregunta SIN mostrar la
    pantalla**, con la frase exacta escrita: la pantalla del IDEA muestra **firma doble sobre puntaje
    único de consenso** (`flujo.js:195`), que es **lo contrario** de §5.16/D7, y un «sí» contra ella
    confirmaría el modelo que no construimos. `docs/notas/respuestas-reunion-ippu-2026-08-21.md` queda
    pre-armado para llenar: cada pregunta con la respuesta de junio citada debajo y **una línea que nombra
    qué §5 o sub-módulo dispara cada respuesta posible**.
  - **Verificación, con los números reales:** `node --check` sobre los **14** módulos de `demo/js/` → **14
    OK** · `generar_catalogos_backend.py --check` → **OK, al día** · `pytest -q` → **240 passed, 0
    skipped** (28,00 s) · `verificar_estado.py --check` → **OK** · barrido de citas renumeradas → **0**.
    **Ningún conteo se movió**: 38 tablas, 240 tests, migración `9246e659d2c9`.
  - **Reconciliación del corpus del grafo, que la Fase A dejó debiendo — cierra exacto.** Se recuperó
    `graphify-out/manifest.json` de la historia (`e782f36^`), que es la lista real de lo que el grafo
    indexó el 2026-08-07: **72 archivos**. Con la misma regla hoy: **77**.
    **72 − 26 (bajas) + 31 (altas) = 77.** Las bajas son el **backend v1** (23 archivos, retirado en
    M11.2) + los **3** de la purga de §5.29 (`docs/markdown/IPPU.md` y los dos docs del backend v1). Las
    altas son 16 de backend v2/M12, 9 de `docs/`, 3 de `herramientas/`, 2 de demo (`ateneos.js`,
    `inclusion.js`) y 1 prompt. ⚠️ **Un detalle que costó una pasada:** `git ls-tree --name-only` **cita
    con escapes** las rutas con acentos, así que las 3 actas de reunión aparecían como borradas cuando
    nunca se tocaron — se rehizo con `-z`. Y `PLAN-modular-…md` es un **movimiento** a `docs/planes/`, no
    una baja.
  - ⚠️ **Lo que esta sesión NO pudo cerrar, y hay que decirlo: nadie abrió la demo en un navegador.**
    Toda la verificación fue automática. El merge trajo **1.371 líneas de `estilos.css`** que ninguna
    sesión miró con ojos, y mañana eso se abre delante de IPPU. **Es el único riesgo que ninguna sesión
    puede cerrar por sí sola.**

- **2026-08-21** — **Notas de accesibilidad de la UI, para quien retome el restyle** (`6f31145`;
  backfill: la sesión cerró sin este ítem, §12.4 paso 6). No se tocó `demo/` — sólo documentación, nueva
  `docs/guias/notas-accesibilidad-ui.md` (182 líneas) + `docs/estructura-repositorio.md` con la carpeta
  registrada. (Lucas + Claude)
  - **§2 — 6 ratios WCAG sobre la paleta *borrador* que motivó el restyle de F1** (anillo de foco 1,23:1,
    borde de campo 1,48:1, blanco sobre ámbar/verde de acento 3,19:1/3,30:1, fila seleccionada 1,15:1, texto
    secundario 4,55:1 — éste pasa AA por ~1%). Ninguno de esos hex está en `estilos.css` hoy: son diagnóstico
    de qué evitar al fijar la paleta definitiva, no del código vigente.
  - **§1 confirma que el criterio ya se aplicó una vez con éxito**: el naranja institucional pasó de 2,6:1
    (según el propio mensaje de F1) a ≈4,8:1 verificado acá — pasa AA.
  - **§2.6 — mismo defecto, sin resolver, en el código vigente**: el patrón "sacar `outline` nativo y
    reemplazarlo por `box-shadow`" sigue vivo en 10 selectores de `estilos.css` (líneas 255, 324, 430, 583,
    790, 878, 903, 955, 1019, 1060). ⚠️ **Los dos ratios de §2.6 (≈1,6:1 anillo naranja, ≈1,37:1 ámbar de
    observaciones) están calculados a mano, no con herramienta — quedan pendientes de verificación por
    script.** Item 4 de la sesión siguiente (2026-08-21, tarde) los recalculó por script: ver esa entrada.
  - **§3 — dos reglas de dominio verificadas contra el código de hoy**, con cita de archivo:línea: severidad
    ≠ urgencia (`catalogos.js:16-23`, `ui-core.js:192,204,257-268` — las 6 bandas del IDEA y su total usan
    la tríada `--ok/--warn/--bad`, que debería quedar reservada a bloqueos accionables) y dos vocabularios de
    estado sin token propio (ciclo de vida del módulo — vacío/en curso colapsan, addenda sin marca de badge,
    excepción sin color propio — y `NS` vs. `null` sin tratamiento visual distinto de un número).
  - **Verificación:** ninguna — es documentación, no código; el propio documento lo dice en su cabecera.
    `python herramientas/verificar_estado.py --check` **no se corrió al cerrar** (no lo mide: no hay tablas,
    migración ni tests de por medio), pero tampoco se registró el resultado — hueco de proceso, no de
    contenido. Cerrado por la sesión siguiente (2026-08-21, tarde): ver esa entrada.

- **2026-08-21 (tarde)** — **Se arregla el harness de `demo/verificacion/`, se mide (no se adopta) un
  baseline versionado, se hace el retro-test contra la regresión de talleres, y se reemplazan por script los
  dos ratios a mano de `notas-accesibilidad-ui.md` §2.6.** Alcance de archivos respetado: sólo
  `demo/verificacion/`, `handoff.md`, `docs/` y `herramientas/` — **cero cambios en `demo/css/`, `demo/js/`
  o `demo/index.html`.** (Lucas + Claude)
  - **1 — Harness.** `npx playwright --version` → 1.62.1, Chromium 151.0.7922.34 lanza sin error (verificado
    con un `chromium.launch()` real, no asumido). `fingerprint.js` tenía un único punto de entrada hardcodeado
    (`.navitem[data-view="${v}"]`) que asumía las 5 vistas viejas; se reemplazó por un mapa `VISTAS` declarado
    una sola vez (`entrada` + `contenido` por vista, las 7 que existen hoy — incluida `usuarios`, cuyo punto
    de entrada real es `.userchip`, no un `.navitem`), con dos guardas que fallan **con el nombre de la vista**
    en vez de morir en silencio: (a) antes de arrancar, que cada `entrada` resuelva en el DOM; (b) después de
    cada click, que el `contenido` haya quedado no-vacío — existe porque `usuarios` es el caso real de "click
    sin contenido" (su `render()` sólo corre si se llama `renderUsuario()`, a diferencia de
    grupos/inclusión/ateneos que se pintan solos al cargar la página). Verificado que el click al `.userchip`
    **alcanza** (su propio `onclick` encadena `go()` + `renderUsuario()`): `#usuarioContent` capturó 2.457
    caracteres reales, no un shell vacío. **Corrida real:** 42 pasos capturados, 0 errores de consola/página,
    exit 0. Dos corridas seguidas sobre el mismo commit: **43/43 campos comparados idénticos** (los 42
    pasos + el campo `errors`).
  - **2 — Baseline: medido, no adoptado.** Determinismo perfecto (arriba). Dependencia del calendario:
    de 8 sitios con `new Date()`/`Date.now()` en `demo/js/`, sólo **2 llegan a un paso que el harness
    captura hoy**, y se confirmó adelantando el reloj del navegador +48h con `page.addInitScript` —
    `incDiasSin()` en `A3_vista_inclusion` (`inclusion.js:35-39`) corrió 92→94, 127→129, 162→164, 50→52,
    51→53, 97→99 (un día por día real) y `fechaGen` de `generarInforme()` en `C6e_vista_informe`
    (`expediente.js:193-194`) corrió 21/08/2026→23/08/2026. Un tercer campo (`nroHC()`, año de fallback
    porque ningún NNA seed tiene `altaFecha`) rota una vez al año. ⚠️ **Se descartaron dos sospechosos que el
    enunciado asumía riesgosos y no lo son**: `vfAlertaVigencia` (90/30 días) y `edadDesde()` usan fechas
    **fijas** (`HOY="2026-07-15"` y `"2026-06-10"` hardcodeada) contra el reloj real, no `new Date()` sin
    ancla — no calendario-dependientes. Tamaño: ~528 KB por captura (540.546 bytes), 43 campos comparados.
    **Tres opciones escritas en `demo/verificacion/README.md`** con su costo real: (1) versionar tal cual —
    rota solo, no recomendada; (2) sólo el procedimiento de dos worktrees ya documentado — **recomendada, sin
    adoptar**, porque "antes" y "después" comparten el mismo reloj real dentro de la misma corrida y los 2
    campos volátiles nunca generan falso positivo; (3) versionar con los 2 campos normalizados (mismo
    mecanismo que ya usa `HH:MM`) — más mantenimiento (un campo nuevo no se normaliza solo). **Decisión
    queda para Lucas, va a §5** (borrador impreso al cierre de esta sesión, sin commitear).
  - **3 — Retro-test.** `pre-limpieza-2026-08-20` confirmado por su propio mensaje de tag: marca `main`
    **sin** F1 mergeada. Comparación literal (tag vs. `main` actual, dos worktrees): **20 de 43 campos
    comparados distintos** (42 pasos + el campo `errors`; vocabulario fijado en `demo/verificacion/README.md`)
    — esperable, F1 fue un restyle completo. **La regresión de talleres NO aparece en este par**,
    pero no porque el harness sea ciego: **no existe entre estos dos extremos** — se verificó por script que
    `A3_vista_grupos` contiene "taller" tanto en el tag (pre-F1) como en `main` hoy (la regresión se abrió y
    se cerró *dentro* del rango, en el merge `d94b102` → el fix `c452aa8`, ambos posteriores al tag).
    **Prueba dirigida, más reveladora:** se comparó `d94b102` (el merge de F1, con la regresión) contra
    `c452aa8` (el commit inmediato siguiente que la repara — 13 líneas, 2 archivos) con el harness ya
    arreglado corriendo sobre los dos. Resultado: **1 de 43 campos comparados distinto**, exactamente `A3_vista_grupos`,
    con la primera divergencia cayendo en la frase de `index.html` que `c452aa8` corrigió. **El harness
    arreglado sí atrapa la regresión, limpio, cuando los dos extremos la enmarcan.** Lo que esto separa: un
    diff entre dos puntos con un restyle completo de por medio es de valor bajo para encontrar una pérdida de
    contenido puntual (20 de 43 campos "distintos" no dice cuál importa); un diff entre un commit y su fix
    inmediato es nítido. **Independiente del harness, por grep:** hoy en `main` los talleres **sí** se
    renderizan (`grupos-usuario.js:172-177`, card propia) y `index.html` **ya no contiene** la frase vieja
    "días/horarios y talleres asignados" — no porque siga sin cumplirse, sino porque el bloque estático que
    la tenía se **retiró entero** esta misma mañana (`8fbb629`, cabecera duplicada de Grupos) y la descripción
    que la reemplaza (`grupos-usuario.js:97`) no promete nada sobre talleres/técnicos. **La regresión de
    talleres está cerrada en `main` hoy, por dos commits distintos y anteriores a esta sesión.**
  - **4 — Contraste por script.** Nuevo `herramientas/verificar_contraste_ui.js` (Playwright, reusa el
    install de `demo/verificacion/`): extrae colores estáticos de `estilos.css` (30 variables + 40
    literales con color) y mide en vivo lo que realmente se renderiza. **Anillos de foco:** el regex de
    extracción (no es un parser CSS) encontró 6 de los ~10 selectores que citaba la sesión de la mañana —
    los 4 que no aparecieron **no se dan por resueltos**, se marcan como no verificados. De los 6, se
    midieron 5 con foco real disparado en el DOM: los 4 que usan `--focus` (naranja) dieron **1,61:1** en
    cuatro pantallas independientes (login, búsqueda, `select`, campo de formulario); el de observaciones del
    Protocolo (ámbar propio) dio **1,34:1**, medido sobre `NNA 101` (Sofía, PA en borrador) porque `NNA 102`
    tiene el PA firmado y sus `textarea` quedan `disabled` — no aceptan foco. **Los dos números a mano de la
    mañana se sostuvieron:** error de 0,01 en el naranja, 0,03 en el ámbar; mismo veredicto (fallan 2.4.11)
    en los dos. **Pares texto/fondo en vivo:** 59 pares distintos en 6 vistas + usuarios + un expediente + el
    formulario IDEA; **14 no llegan a su criterio** — los 4 peores (<2,2:1) son texto blanco sobre el color de
    dato puro de una escala en heatmap/barras de progreso; el resto incluye `.pill.pend` (4,30:1, el mismo
    hallazgo de dominio de §3.1) y los `.at-chip` de Ateneos. Tabla completa y método en
    `notas-accesibilidad-ui.md` §2.6/§2.7; script registrado en `docs/estructura-repositorio.md`.
  - **Verificación de cierre:** `node --check` sobre los dos scripts → OK · harness re-corrido una vez más
    tras el último cambio → 42 pasos, 0 errores · `python herramientas/verificar_estado.py --check` → **OK**.
    Sin Docker levantado esta sesión — no se corrió `pytest` (no se tocó `backend/`).
  - **Lo que quedó sin resolver, dicho en voz alta:** de los ~10 anillos de foco citados, 5 no se midieron
    (`.btn`/`.opcion` por la limitación real de `:focus-visible` con foco programático en Chromium headless;
    técnicos-autorizados/acuerdos-de-ateneo/fila-de-usuario por no abrirse su modo edición en esta corrida) —
    quedan como no verificados, no como "iguales a los otros por declaración". El barrido de pares vivos no
    cubre Protocolo A/B, Informe de Cierre ni los modales de firma/addenda/excepción.

- **2026-08-26 — Sesión D1 · Se registra en el repo la reunión con IPPU del 2026-08-21.**
  **SÓLO DOCUMENTACIÓN, y el alcance se respetó:** no se tocó `app/`, `tests/`, `alembic/`, ni la base de
  datos; no se corrió `alembic revision|upgrade|downgrade|stamp` ni `python -m app.seed_catalogos`; no se
  hizo `commit`, `push`, `merge`, `checkout` ni `branch -d`. **Los cambios quedan en el árbol de trabajo.**
  Archivos tocados: **5** — `docs/notas/respuestas-reunion-ippu-2026-08-21.md`, `handoff.md`,
  `docs/notas/puntos-a-validar.md`, `docs/notas/consulta-a-ippu.md` y
  `docs/planes/PLAN-M12-absorcion-prototipo-v4-2026-08.md`. (Lucas + Claude)
  - **Por qué existió esta sesión.** La reunión fue el **21/08** y hasta hoy **el repo no tenía ningún
    registro de lo que IPPU contestó**: el archivo `respuestas-reunion-ippu-2026-08-21.md` existía con sus
    **26 bloques `**Respuesta:**` vacíos**, y R0 lo verificó por script y lo marcó **NO VERIFICABLE**
    (`docs/notas/relevamiento-estado-2026-08-26.md`, D-2). **Cinco días de trabajo posible se hicieron
    contra supuestos que la reunión ya había volteado.**
  - **1 — El acta.** Los 26 bloques quedaron escritos: **12 contestados · 2 a medias · 12 sin respuesta**
    (§16 del propio archivo, nuevo). Se registraron además **dos errores de acta que la propia reunión
    corrigió**, para que nadie los relitigue: **«no es lineal»** (sobre el orden A→B) y **«posible cambio
    de puntaje del IDEA»** (hablaba de la escala IPPU-TEA) — **los dos se descartan; no hay cambio de
    escala en ningún instrumento.**
  - **2 — Las decisiones: §5.36–§5.49, serie I.** Catorce entradas, todas con fuente «reunión IPPU
    2026-08-21» y **append-only** (§12.6): donde la reunión corrige algo, hay **entrada nueva que
    supersede**, nunca edición de la vieja.
  - **Lo que cerró.** **El IDEA es ANUAL** (§5.36) — la pregunta más importante de la ronda, y **cae la
    «línea base única» del Documento Técnico**. **La puntuación es conjunta** (§5.47). **`hc_historico` es
    entero desde 1000 y migran todos los expedientes** (§5.43). **El PAI se llama «Proyecto de Atención
    Integral», se retira su sección VII y puede haber más de uno por año** (§5.42). **Los ateneos: prefijo
    único, número del año de registración, visibilidad por grupo** (§5.46). **Baremo, 24 citas y severidad
    DSM-5-TR confirmados sin trabajo** (§5.48). En `puntos-a-validar.md` eso cerró **10 de los 14 puntos
    de IPPU**.
  - **Lo que ahora bloquea y antes no.** **Crear grupos desde la aplicación** (§5.37): los cuatro nombres
    por color **no son de IPPU** —son **Inicial · Escolares · Preadolescentes · Adolescentes · Taller de
    Adolescentes**— y corregirlos es justamente la operación que no existe. **Usuarios, roles y asignación
    técnico↔grupo** (§5.41). **Cómo se representa la divulgación** (§5.39/§5.45): el modelo tiene
    almacenamiento y **no tiene compartir** — y los guards que existen **bloquean el guardado, que es el
    punto equivocado del flujo**. **Estado de revisión de informes** (§5.40). **Indicador de ateneos**
    (§5.46). Cuatro puntos nuevos en `puntos-a-validar.md`: **§2.11 a §2.14**, y **§2.8 pasó a
    bloqueante**.
  - **3 — Deuda saldada.** `puntos-a-validar.md` **§2.1** tiene por fin el **costo medido del IDEA anual**
    que §5.31 dejó debiendo el 2026-08-20 (el archivo estaba congelado por F1). Medido dos veces —§5.31 y
    R0— y coincide: **aditivo, 1 tabla de 38, 0 FKs, 0 tests rotos con `anio` nullable**; lo caro es el
    **selector de año** en 6 módulos de la demo.
  - **4 — El cuestionario.** `consulta-a-ippu.md` pasó de **0 a 25 respuestas de 28**, escritas **bajo su**
    **`> _Respuesta:_`**, sin tocar una palabra de pregunta ni la numeración: sigue siendo el snapshot de
    lo que se envió el 19/08. **Quedan 3 abiertas: §2.2, §2.4 y §3.1** (de la Parte 3, **una sola**).
    ⚠️ **Dos respuestas contradicen el documento que IPPU tiene en la mano:** **§1.3** (el consentimiento
    **no** es el paso que nunca se saltea) y **§2.8** (la autorización de imagen aplica a **compartir**, no
    a **guardar**).
  - **5 — El plan M12, dos enmiendas y nada más.** **§M12.6**: nombre oficial + **la sección VII se
    retira** (el módulo pasa a describir 14 secciones, no 15). **No-goal de autenticación**: marcado
    **enmendado, no borrado**, con puntero a §5.41 — el plan es anterior a la reunión, está viejo, no
    equivocado.
  - ⚠️ **Lo que esta sesión NO hizo, a propósito.** **No se tocó una línea de código, ni la demo, ni el
    esquema.** **No se corrigieron las 12 divergencias que encontró R0**: varias dejan de existir cuando
    el modelo cambie, y reparar documentación contra un modelo que está por moverse produce una segunda
    ronda de ediciones. **No se corrigió §9 «Datos clave»** (fuera del alcance de archivos) — ⚠️ aunque
    ahora dice «**5 grupos**» y, con los nombres reales, **vuelven a ser 5**: es coincidencia de número,
    no una confirmación. **No se borró el archivo de respuestas** aunque tres de sus cuatro condiciones de
    retiro se cumplieron: falta el Google Doc, y además es lo único que conserva los 12 bloques sin
    contestar.
  - ⚠️ **El riesgo que esta sesión NO puede cerrar:** **un solo punto de toda la serie es de segunda
    mano** —que el consentimiento no trabe el flujo (§5.38 / I3)— y **cambia una regla dura que ya está
    escrita y que IPPU tiene por escrito al revés** (`consulta-a-ippu.md` §1.3). Está marcado
    **CONFIRMABLE, no cerrado**, y es **lo primero del próximo contacto**.
  - **Verificación:** ninguna automática — es documentación y no toca tablas, migración ni tests.
    `python herramientas/verificar_estado.py --check` **no se corrió**: esta sesión no cambia nada de lo
    que ese script mide, y **§5.34 ya dejó escrito que no compara prosa**. Las cifras del encabezado (38
    tablas · 240 tests · head `9246e659d2c9`) **no se re-midieron acá**: se toman de **R0 del 2026-08-26**,
    que las midió contra la base y el código el mismo día.
