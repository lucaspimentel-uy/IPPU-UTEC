# Respuestas de IPPU — reunión del 2026-08-21

> ## 🗓️ Archivo **temporal por diseño**. No es documentación: es una hoja para llenar.
>
> **Cómo se usa:** se abre **durante** la reunión y se escribe abajo de cada pregunta. No hay que redactar
> nada: cada sección ya trae la pregunta como se va a hacer, lo que IPPU **ya contestó en junio** cuando
> corresponde, y **qué dispara cada respuesta posible**. La idea es que la sesión de después sea mecánica
> y no interpretativa.
>
> **Condición de retiro — cuándo se borra este archivo.** Se pliega **después** de la reunión, no esta
> noche, y recién entonces se borra:
> 1. Cada «sí» pasa a `docs/notas/puntos-a-validar.md` como **confirmado con fecha**.
> 2. Cada «no» abre entrada en `handoff.md` **§5**, con fecha y autor, **antes de tocar código** (§12.6).
> 3. Lo que IPPU responda de las preguntas del cuestionario se transcribe bajo su `> _Respuesta:_` en
>    `docs/notas/consulta-a-ippu.md` — y, si el artefacto autoritativo es el Google Doc, **también ahí**.
> 4. Recién cuando 1–3 estén hechos, este archivo se borra. Queda en la historia de git.
>
> **Numeración:** todo `§N.N` de acá es del **documento que IPPU tiene delante** (enviado el 19/08), que no
> es el del borrador anterior. Mapa en `handoff.md` §5.34.
>
> - **Agenda que sigue:** `docs/planes/agenda-reunion-ippu-2026-08.md` (mismo orden que este archivo).
> - **Presentes** *(anotados el 2026-08-26)*: por UTEC-LIDIA **Boris Furtado**, **Victor Uria**,
>   **Lucas Pimentel** y **Matías López**; por IPPU, la **dirección**. ⚠️ **Boris es una sola persona:**
>   Boris Furtado firma «Samuel» en la documentación y `Boris Furtado` en los commits (**§5.32**), así que
>   **no se lo cuenta dos veces**. · **Hora inicio / fin:** *sin registro*
>
> ## ✍️ LLENADO EL 2026-08-26 — cinco días después de la reunión, desde el registro de lo que se dijo
>
> La reunión **fue** el 2026-08-21 y este archivo quedó **vacío** hasta hoy: R0
> (`docs/notas/relevamiento-estado-2026-08-26.md`, D-2) verificó por script que sus **26 bloques
> `**Respuesta:**` no tenían texto**, y lo marcó **NO VERIFICABLE**.
>
> - **Lo que se escribe abajo es el registro de la reunión, no interpretación.** Donde no hubo respuesta,
>   dice **«sin respuesta»** y no se completa por inferencia.
> - **Balance en §16, al final:** **12 contestados · 2 a medias · 12 sin respuesta · 1 contestado a
>   confirmar por escrito (9.a).**
> - ⚠️ **Un punto es de segunda mano** —el del consentimiento (I3, §14)— y está marcado como
>   **CONFIRMABLE**, no cerrado.
> - ⚠️ **Un punto contestado fue revertido después por una corrección de segunda mano** —**9.a**, la
>   visibilidad del ateneo de grupo: la reunión dijo «por grupo» (2026-08-26) y el 2026-09-02 IPPU lo
>   corrigió a **acceso general** (§5.58 / L5), sin que conste en el acta. Va al próximo contacto para
>   **confirmación escrita**, junto al del consentimiento.
> - **El archivo NO se borra todavía:** su condición de retiro exige que las respuestas también estén en
>   el **Google Doc del equipo**, que está fuera de este repo. Ver §16.

---

# 1. Las tres que **nunca les llegaron**

> Se dicen al principio, de corrido. No tienen `> _Respuesta:_` en el cuestionario porque **no se enviaron**
> (§5.34). Ésta es su única instancia.

## 1.a — Los cortes del baremo *(era §2.7 del borrador; nunca se envió)*

> «Los porcentajes que usamos son 0–4 sin discapacidad · 5–24 leve · 25–49 moderado · 50–95 severo ·
> 96–100 muy severo. **¿Están bien esos cortes?** Y si tienen a mano **el anexo del Decreto 72/025**, nos
> sirve muchísimo.»

**Respuesta:**

**Confirmados, sin cambios.** Los cinco cortes están bien como están cargados
(0–4 sin discapacidad · 5–24 leve · 25–49 moderado · 50–95 severo · 96–100 muy severo). IPPU los
confirma, y coinciden además con la documentación oficial de **BUND**. → `puntos-a-validar.md` §1.2
**cerrado**. **Cero trabajo:** no se toca el catálogo `baremo`, y el guard de «se ajustan los cortes,
nunca las etiquetas» **nunca hay que ejercerlo**. *(Sin registro sobre el anexo del Decreto 72/025:
no quedó comprometida su entrega.)*


**Dispara:**
- *Cortes confirmados* → `puntos-a-validar.md` §1.2 pasa a **confirmado con fecha**. Sin cambio de código.
- *Cortes distintos* → `UPDATE` sobre el catálogo `baremo`. ⚠️ **Se tocan `pct_min`/`pct_max`, NUNCA la
  columna `categoria`** — el test de `VOCABULARIO_PROHIBIDO` salta en rojo y quien lo vea va a creer que el
  test está mal (§1.2).
- *Nos pasan el anexo* → se guarda en `docs/fuentes/` y se cierra `handoff.md` §7.

## 1.b — De dónde sale el porcentaje *(era §2.8; nunca se envió)*

> «¿El porcentaje de discapacidad **lo pone el organismo oficial**, y el sistema lo registra tal cual?
> Nosotros no lo calculamos ni lo deducimos del IDEA ni de la Escala IPPU-TEA.»

**Respuesta:**

**Sin respuesta registrada.** La reunión confirmó los **cortes** (1.a), no de dónde sale el
porcentaje. El supuesto —lo fija el organismo oficial y el sistema lo registra tal cual, sin calcularlo
ni deducirlo del IDEA ni de la Escala IPPU-TEA— **sigue siendo nuestro**. No bloquea: `pct` es dato de
entrada y el baremo sólo deriva de él, que es lo que el supuesto describe.


**Dispara:**
- *Sí* → supuesto confirmado; nada que hacer. `puntos-a-validar.md` §1.2.
- *No, lo calcula la institución* → ⚠️ **contradice el diseño**: hoy `pct` es dato de entrada y el baremo
  sólo deriva de él. Abre entrada en **§5** antes de tocar nada.

## 1.c — Las 24 citas de la Escala IPPU-TEA ⚠️ *(era §3.2, marcada ⚠️; nunca se envió)*

> «Cada ítem tiene una referencia — DSM-5-TR, CIF, Wing & Gould, Baron-Cohen, Rivière — tomada tal cual del
> prototipo. **No las verificamos, y no deberíamos ser nosotros.** ¿Alguien las revisó? ¿Las damos por
> buenas o las repasa un técnico?»

**Respuesta:**

**Confirmadas.** Las 24 referencias de la Escala IPPU-TEA se dan por buenas. →
`puntos-a-validar.md` §1.4 **cerrado**. ⚠️ **No quedó registrado quién las revisó ni cuándo**: lo que
cierra el punto es la confirmación institucional, no la trazabilidad de la revisión. Si el instrumento
se presenta formalmente, eso puede volver a pedirse.


**Dispara:**
- *Ya están revisadas* → `puntos-a-validar.md` §1.4 **cerrado con fecha y con quién las revisó**.
- *Hay que repasarlas* → queda como tarea **de IPPU**, con responsable y fecha. No bloquea desarrollo.
- ⚠️ **Decir antes:** la intro del cuestionario que tienen menciona esta pregunta y la pregunta no está en
  el documento. Se avisa, sin drama.

---

# 2. Talleres — ¿estamos modelando una práctica que no existe?

**Pantalla:** Grupos → abrir un grupo → card «Talleres del grupo»

> **Ya contestaron en junio (15/06/2026, Fernando Sierra):**
> **P14 — ¿Hay registros de asistencia a talleres? ¿En qué formato?** → **«No»**
> **P15 — ¿Se registran indicadores de progreso por taller? ¿Cuáles?** → **«No»**

## 2.a — ⚠️ La pregunta que decide si `pai_taller` existe

> «En junio nos dijeron que **no** llevan registro de asistencia a talleres ni indicadores por taller.
> Nosotros tenemos armado un módulo para registrar **la participación de cada chico en cada taller**.
> **¿Eso es algo que quieren tener, o es algo que nosotros inventamos?**»

**Respuesta:**

**Sin respuesta.** La reunión **no trató** la participación por taller. Queda como está: la
única fuente sigue siendo **P14 y P15 de junio** («No» a registros de asistencia y a indicadores por
taller), y `pai_taller` sigue siendo alcance de **M12.6 sin confirmación de IPPU**. ⚠️ **Es la más cara
de las que quedaron sin tocar**: si la respuesta hubiera sido «no lo queremos», M12.6 se achica y §5.21
queda sin objeto.


**Dispara:**
- *«No lo queremos»* → ⚠️ **`pai_taller` sale del alcance de M12.6.** Entrada en **§5** enmendando §5.14/D5
  y §5.20 (que lo asignó a M12.6). **M12.6 se achica.** Y §5.21 (el test de participación traspasado a
  M12.6) queda sin objeto.
- *«Nos serviría, hoy no lo hacemos»* → se construye, **anotado como práctica a introducir**, mismo
  tratamiento que §5.16. `puntos-a-validar.md` gana un punto nuevo.
- *«Ya lo hacemos»* → ⚠️ contradice P14/P15 de junio. **Preguntar dónde se registra hoy** y anotar la
  contradicción en §7, sin resolverla en la sala.

## 2.b — Sólo si 2.a fue «sí»: la lista y quién la maneja *(cuestionario §3.1)*

> «¿Esos catorce son los que dictan este año? ¿Alguno va sólo a ciertos grupos? ¿La lista la maneja
> coordinación?»

**Respuesta:**

**Sin respuesta** (dependía de 2.a). Los 14 talleres siguen cargados como los trae el
Prototipo v4, sin confirmar que sean los que se dictan este año y sin saber si alguno va sólo a ciertos
grupos. `consulta-a-ippu.md` **§3.1 sigue abierta**.


**Dispara:**
- *Lista distinta* → recarga de catálogo. Barato. `generar_catalogos_backend.py`.
- *Talleres orientados a grupos* → confirma `taller.grupos_orientados` (M12.3). Sin cambio.
- *No la maneja coordinación* → se revisa D5; el catálogo dejaría de necesitar gestión.
- ⚠️ **No prometer** que la pantalla de administración existe: **no existe**, y eso ya está por escrito en
  §3.1 del cuestionario enviado.

---

# 3. El IDEA: ¿línea base única o anual?

**Pantalla:** expediente → IDEA (HCE-LB) · *cuestionario §2.1 ⚠️*

> **Ya contestaron en junio:**
> **P10 — ¿Con qué frecuencia se evalúa a cada NNA con IDEA?** → **«Anual»**
> **P12 — ¿Existe algún archivo que consolide todas las evaluaciones?** → **«No, las evaluaciones aparecen
> por año (individual). No hay un histórico consolidado.»**
> *(El Documento Técnico v1.0 dice lo contrario: línea base única. Es la única pregunta donde IPPU se
> contradijo consigo mismo.)*

## 3.a — Confirmación

> «En junio nos dijeron que el IDEA se hace **todos los años**; el documento técnico dice **una sola vez**.
> Construimos siguiendo el documento. **¿Nos confirmás que es anual?**»

**Respuesta:**

**ANUAL.** El IDEA se hace **una vez por año, siempre**, y el de cada año **se compara con el
del año anterior**. Es la respuesta a la pregunta más importante de la ronda, y coincide con lo que
Fernando Sierra ya había contestado por escrito el 15/06 (P10/P12). **La «línea base única» del
Documento Técnico no sobrevive.** → `handoff.md` **§5.36 (I1)** · `puntos-a-validar.md` §1.1 cerrado ·
`consulta-a-ippu.md` §2.1 contestada.

**Regla de comparación, dicha en la reunión:** se compara **siempre dentro del mismo instrumento** —
el IDEA de este año contra el del anterior, el Protocolo B contra el A — **nunca entre instrumentos**.
⚠️ Eso obliga a reformular la regla de M11.3 hoy escrita «Δ sólo B−A» como «Δ **sólo dentro del mismo
instrumento**»: tal cual está redactada, bloquea una comparación que IPPU pidió explícitamente.


**Dispara:**
- *«Anual»* → **§5.8 se resuelve por el lado del contenido.** Entrada en §5 nueva: `idea` gana `anio` +
  `UniqueConstraint("hce_id","anio")`. Costo medido en **§5.31**: aditivo, 1 tabla de 38, 0 FKs, 0 tests
  rotos si es nullable. ⚠️ **La demo paga**: `flujo.lb` es objeto único, ~18 usos en 6 módulos → selector de
  año. Se hace **antes de M11.3** (§5.35).
- *«Una sola vez, línea base»* → el Documento Técnico gana; se anota que **P10 de junio queda desmentido
  por escrito** y se cierra §2.1. No se toca nada.
- *Cualquiera de las dos* → **§5.8 sigue sin ratificar hasta que el equipo lo escriba** (§5.35). La reunión
  no lo ratifica sola.

## 3.b — Sólo si es anual: qué IDEA muestra un documento viejo

> «Un PAI de 2024, ¿muestra el IDEA de 2024 o el último?»

**Respuesta:**

**Sin respuesta directa.** La reunión fijó *qué se compara* (dentro del mismo instrumento,
año contra año), no *qué IDEA renderiza un documento viejo*. Sigue siendo **requisito de M11.3** y va a
`backend/docs/esquema-datos-v2.md` §4 (§5.35, derivado 2).

⚠️ **Y ahora hay que revisar la regla vigente, no sólo escribir la nueva:** «la vigente es la de mayor
`fecha_consenso`» (`app/models/modulos.py:219`) se escribió para un modelo de línea base con reingresos.
Con **una por año**, «la más reciente» y «la de este año» dejan de ser la misma pregunta.


**Dispara:** en cualquier caso → **requisito para M11.3**, a `backend/docs/esquema-datos-v2.md` **§4**
(dónde vive cada regla), **no** a una tabla. Hoy la regla es «rige la de mayor `fecha_consenso`»
(`modulos.py:219`) y sin esta respuesta un documento viejo puede renderizar en silencio el IDEA de hoy.

---

# 4. Los dos técnicos que puntúan por separado — **sin pantalla**

*Cuestionario §3.8 ⚠️ (era §3.9 antes de la revisión) · §5.16 / D7*

> ⚠️ **NO se muestra la pantalla del IDEA.** Muestra firma doble sobre **puntaje único de consenso**, que
> es lo contrario de lo que modelamos. Un «sí» contra esa pantalla confirmaría el modelo equivocado.

> «Cuando aplican el IDEA entre dos técnicos: **¿cada uno pone su puntaje por separado y después comparan,
> o lo conversan y ponen un número acordado?** Y si hoy es lo segundo — **¿les serviría que el sistema les
> permita lo primero, o les complicaría el día a día?** El sistema acepta igual un solo valor.»

**Respuesta:**

**Puntaje único de consenso.** Los dos técnicos **acuerdan en persona** y registran **un solo
número, un solo campo**. → `puntos-a-validar.md` §1.9 **cerrado** · `consulta-a-ippu.md` §3.8
contestada.

**Consecuencia, sin adornos:** D7 (§5.16) **no queda equivocada, queda latente** — `puntuacion_idea` y
`puntuacion_protocolo` se modelaron nullable exactamente para este caso, y no se retira nada. Pero **el
kappa de confiabilidad interjueces que el Manual §23 llama el único requisito metodológico invariante
del instrumento NO es calculable** con la práctica actual. **Eso se le dice a IPPU, y se dice acá: el
modelo lo soporta y el dato no existe.** No se deja implícito en un «lo soporta».
→ `handoff.md` **§5.47 (I12)**.


**Dispara:**
- *«Puntuamos por separado»* → **§5.16 confirmada**, deja de ser «agregado nuestro». `puntos-a-validar.md`
  §1.9 cerrado. El guard de «diferencia ≥ 2 exige documentación» entra a **M11.3** con prioridad.
- *«Ponemos un número acordado, y nos serviría lo otro»* → §5.16 queda **latente**: se conserva el modelo,
  **no** se construye el guard todavía. Anotado como práctica a introducir.
- *«Un número acordado, y lo otro nos complica»* → ⚠️ **el «no» más caro.** Entrada en §5 retirando D7:
  quedan sin sentido `puntuacion_idea`, `puntuacion_protocolo`, el `CHECK` de evaluadores distintos y la
  columna generada `diferencia` (M12.2). **Mejor ahora que después de M11.3.**
- *Cualquiera* → kappa **sigue sin calcularse** (§5.16 ya lo dice); esto no lo cambia.

---

# 5. Los grupos

**Pantalla:** Grupos (listado y detalle) · *§5.18 / D9*

## 5.a — Los 4 grupos por color

**Respuesta:**

⚠️ **Los cuatro nombres por color no existen en IPPU.** Los grupos reales son:
**Inicial · Escolares · Preadolescentes · Adolescentes · Taller de Adolescentes.**

«Grupo Azul / Celeste / Naranja / Verde» **no son el dominio de IPPU**: son datos de demostración que
venían adentro del Prototipo v4 y que el repo levantó como si fueran la realidad institucional.
**La estructura de D9 (§5.18) está bien** —id propio + `UNIQUE(nombre, anio)`— y no se toca; lo que está
mal son las **4 filas sembradas**. Además: **los grupos nuevos los crea ADMIN** cuando hace falta.
→ `handoff.md` **§5.37 (I2)**.


**Dispara:** *distinto* → catálogo, barato. *Igual* → D9 confirmada con fecha.

## 5.b — ⚠️ Responsables y técnicos autorizados: **mostrado, no modelado**

> La pantalla muestra responsable 1 / responsable 2 y una nómina de técnicos autorizados que **§5.18 no
> modela**. Un «sí, así es» **NO confirma un supuesto**: significa **trabajo nuevo de backend**.

**Respuesta:**

**Confirmado como práctica — y por eso es trabajo nuevo, no un supuesto validado.**
Cada técnico tiene **su propio usuario**. Los técnicos ven **sólo los grupos que tienen asignados**.
**ADMIN ve todo**, asigna los grupos y puede crear otros ADMIN.

⚠️ Hoy `grupo` resuelve esto con **dos columnas fijas** (`tecnico1_id`, `tecnico2_id`): no hay tabla
`usuario`, ni `rol`, ni asignación técnico↔grupo (verificado por R0, BLOQUE 7). Lo que IPPU describe es
**usuario + rol + una asignación N:M**. Va a la **lista de reconciliación**, no a la de confirmados.
→ `handoff.md` **§5.41 (I6)**. Secuencia: **después de M12.5 y M12.6**, que no dependen de esto.


**Dispara:** cualquier «sí» → a la **lista de reconciliación de `grupo`**, no a la de confirmados. Entrada
en §6 como pendiente con nombre. *(Hallazgo 3 de §13, 2026-08-20: mergear F1 no lo modela.)*

## 5.c — Cambio de técnico a mitad de año

> «Si un responsable cambia a mitad de año, ¿tiene que quedar registrado quién era antes y desde cuándo?»

**Respuesta:**

**Sin respuesta.** No se preguntó por el cambio de **técnico** a mitad de año. Lo que sí se
contestó es el caso del **NNA que cambia de grupo** (consulta §3.6 / §3.7): *lo firmado queda firmado, lo
pendiente lo firma el técnico nuevo* — **es otra pregunta**. El residuo de §5.18 (la fila se sobrescribe
y sólo queda rastro en `auditoria`) **sigue abierto**, y ahora tiene dónde resolverse: la asignación N:M
de I6 es el lugar natural para modelar vigencias.


**Dispara:** *«sí»* → el residuo de §5.18 deja de ser aceptable: hay que **modelar vigencias por técnico**.
Es el cambio caro de este punto. *«No importa»* → el residuo se cierra como aceptado, con fecha.

## 5.d — Qué es «tutor» *(abierta por F1, `handoff.md` §7)*

> «¿Es el técnico responsable del grupo, otro rol — referente por chico —, o el tutor legal de la familia?»

**Respuesta:**

**Sin respuesta.** «Tutor» sigue sin fuente normativa. `puntos-a-validar.md` §2.10 y
`handoff.md` §7 quedan como están.


**Dispara:** *rol nuevo* → tabla o columna nueva, y `puntos-a-validar.md` §2.10 se reclasifica **de punto
de equipo a punto de IPPU**. *Sinónimo* → se cierra §7 sin código.

---

# 6. Las 6 bandas del IDEA

*§5.13 / D4*

**Respuesta:**

**Sin respuesta.** Lo único adyacente es una **corrección de acta**: «posible cambio de puntaje
del IDEA» fue **error de transcripción** —hablaba de la Escala IPPU-TEA— y **se descarta igual**: no hay
cambio de escala en ningún instrumento. Eso deja el IDEA como está, pero **no confirma las 6 bandas**,
que son catálogo nuestro (§5.13 / D4) tomado del Prototipo v4.


**Dispara:** *distintas* → catálogo `banda_idea`, barato. *Iguales* → D4 confirmada con fecha.

---

# 7. Fotos y autorización de uso de imagen

**Pantalla:** expediente → HCE-DOC / fotos · detalle de grupo → Registro fotográfico grupal · *§8.4*

> **Ya contestaron en junio:**
> **P43 — ¿Existe un protocolo de consentimiento informado para el uso de datos de los NNA?** → «Se hace
> puntualmente y en base a situaciones particulares **a excepción del uso de imagen, que tiene un formato
> genérico**.»
> *(O sea: la autorización de imagen **existe** y es genérica. Eso ya está confirmado — no se re-pregunta.)*

## 7.a — Lo único abierto: ¿la regla dura les traba el día a día?

> «Hoy el sistema **bloquea** la foto si falta la autorización, y para la foto grupal exige que la tengan
> **todas** las familias del grupo. **¿Les sirve así, o les traba?**»

**Respuesta:**

⚠️ **La regla está al revés.** **Guardar** una foto en la HCE **no requiere autorización**;
**compartirla sí**. Hoy la autorización bloquea el **guardado** —`demo/js/hce-doc-org-vf.js:117-124`
(individual) y `demo/js/recordatorios.js:39-55` (grupal)—, que es exactamente el punto equivocado del
flujo.

**Y el hallazgo es más grande que las fotos:** el modelo representa **almacenamiento** y **no representa
divulgación**. R0 lo midió: no existe ninguna noción de compartir o exportar en `app/` (el único hit es
un comentario en `modulos.py:429`). → `handoff.md` **§5.39 (I4)** y **§5.45 (I10)**.


**Dispara:**
- *«Sirve así»* → §8.4 confirmada. El guard entra a **M11.3** tal cual está.
- *«Nos traba, sacamos la foto y regularizamos después»* → ⚠️ la regla pasa de **bloqueo** a **advertencia**.
  Entrada en §5: es un cambio de una regla dura ya escrita, no un ajuste.

## 7.b — HCE-DOC institucional *(§5.25)*

> «¿Hay documentación institucional que no pertenece a ningún chico en particular?»

**Respuesta:**

**Sin respuesta a la pregunta como está formulada.** IPPU no habló de documentación
institucional en general. Lo que sí pidió, y cae del mismo lado del XOR de §5.25, es **adjuntar
documentos a los ateneos —PPTX en particular—** (ver 9). No alcanza para cerrar §5.25: lo deja como
capacidad **con al menos un uso pedido**.


**Dispara:** *«sí»* → confirma el XOR `documento.hce_id` / `ateneo_id` de §5.25. *«No»* → §5.25 queda como
capacidad sin uso; no se retira, pero se anota.

---

# 8. Inclusión educativa — la planilla del Drive

**Pantalla:** Inclusión (**tablero institucional**, ⚠️ no es la ficha por chico)

> **Ya contestaron en junio:**
> **P31 — ¿Hay intercambio con los centros educativos formales?** → «Sí. Hay un **“Área de Inclusión”** que
> se encarga de eso. **Todo se registra en el Drive.**»
> *(El área existe: eso ya está confirmado. Lo que falta es el archivo.)*

## 8.a — ¿Nos pasan la planilla?

**Respuesta:** *(link / archivo / a quién se lo piden:)*

**Sin respuesta.** No se registró link, archivo ni a quién pedírselo. `centro` sigue sin
decidirse entre texto libre y FK a catálogo, que es lo que **M12.5** necesita saber.


**Dispara:** *nos la pasan* → sale de ahí el **catálogo de centros educativos**, que es lo que M12.5 necesita
para decidir si `centro` es texto libre o FK. Cierra la pregunta abierta de §7. *No la pasan* → `centro`
queda **texto libre**, como en el Prototipo v4, y se anota la decisión.

## 8.b — Los 7 estados de inclusión

> «Hoy los inventamos nosotros: inclusión plena · parcial (horario reducido) · en adaptación · en espera de
> cupo / trámite · desvinculado/a… **¿son estos?**»

**Respuesta:**

**Sin respuesta.** Los 7 `INC_ESTADOS` **siguen siendo supuesto nuestro**. M12.5 arranca con
el mismo supuesto sin confirmar con el que estaba.


**Dispara:** *distintos* → los 7 `INC_ESTADOS` se corrigen **antes** de M12.5 (hoy son supuesto nuestro).
*Iguales* → confirmados con fecha, y M12.5 arranca con un supuesto menos.

## 8.c — ⚠️ ¿Se anualiza el estado de inclusión? *(pregunta de §5.35, distinta de §5.8)*

> «El estado de inclusión de un chico, ¿es del **año lectivo** — como el grupo — o es una situación vigente
> que se va actualizando?»

**Respuesta:**

**Sin respuesta.** ⚠️ **Y esto importa más que las otras dos de esta sección:** §5.35 avisó
que ésta y la del IDEA (3.a) son **dos preguntas distintas** y que una respuesta no contesta la otra.
La del IDEA **se contestó** y ésta **no**. **No leer el IDEA anual como si anualizara el estado de
inclusión.**


**Dispara:** *«del año»* → `inclusion.estado` / `fecha_estado` necesitan `anio`, mismo patrón que D9.
⚠️ **No mezclar con la respuesta del IDEA (3.a): son dos preguntas distintas** — el IDEA es un instrumento
con línea base, esto es una situación. Va como entrada propia en §5.

---

# 9. Ateneos y jornadas

**Pantalla:** Ateneos · panel de ateneos del expediente · *M12.7*

## 9.a — ¿El ateneo de grupo es sensible? *(cuestionario §3.12 ⚠️, era §3.13)*

**Respuesta:**

⚠️ **Restrictivo — y corrige el acta cruda de la reunión.** El apunte del día decía «todos
los técnicos ven todos los ateneos»; **no es así**: **cada técnico ve los de su propio grupo**, y la
**jornada de capacitación** es la instancia transversal, donde varios técnicos se juntan a repasar
ateneos. → `puntos-a-validar.md` §1.12 **cerrado en dirección restrictiva**, la contraria a la que
sugería el apunte.

⚠️ **El derivado implementado no expresa esto.** Hoy es `sensible = (tipo == 'clinico')`
(`app/models/ateneo.py:310-326`): una regla de dos valores sobre un tipo, cuando lo que IPPU describe es
visibilidad **por grupo**. → `handoff.md` **§5.46 (I11)**.


**Dispara:** *«sensible»* → el derivado `sensible` de `ateneo` suma el tipo «de grupo». Cambio chico, es
`hybrid_property`. *«La ve cualquier técnico del grupo»* → queda como está; `puntos-a-validar.md` §1.12
cerrado.

> **[corrección 2026-09-02]** IPPU revirtió la lectura restrictiva de arriba: **el ateneo de grupo es de
> acceso general del equipo técnico** — el apunte crudo de la reunión («todos los técnicos ven todos los
> ateneos») era el correcto. Con eso, la ⚠️ «el derivado implementado no expresa esto» queda **sin
> objeto**: `sensible = (tipo == 'clinico')` ya da acceso general para el ateneo de grupo, y **no hay
> cambio de modelo, esquema, migración ni tests**. → `handoff.md` **§5.58 (L5)**. ⚠️ Relevado por Lucas,
> no consta en el acta (CONFIRMABLE).

## 9.b — El año del correlativo `AT-2026-001` *(cuestionario §3.13, era §3.14)*

> «¿Es el año en que **se hizo** el ateneo o el año en que **se cargó**?»

**Respuesta:**

**Año de registración** — exactamente lo implementado (`anio_correlativo`, el correlativo se
congela al crear). Cierra `puntos-a-validar.md` §1.14 **con cero trabajo**.


**Dispara:** cierra `puntos-a-validar.md` §1.14. Hoy asumimos **año de registración**
(`UNIQUE(anio_correlativo, numero)`); si es el año del hecho, cambia qué alimenta `anio_correlativo`.

## 9.c — El prefijo *(`puntos-a-validar.md` §1.13)*

> «¿Un solo prefijo `AT-` para los cuatro tipos, o uno por tipo?»

**Respuesta:**

**Alcanza con un solo prefijo.** Un `JC-` propio para las jornadas es **aceptable si sale
barato** — y sale: `codigo` es `hybrid_property` (`app/models/ateneo.py:284-308`), **una línea y ninguna
migración**. Cierra `puntos-a-validar.md` §1.13.


---

# 10. HCE-SEV — severidad DSM-5-TR *(no se recorre: la demo no lo tiene)*

*Cuestionario §3.10 (era §3.11) · M12.4*

> «¿Se registra una vez y queda, o se revisa en un momento fijo del año? ¿Y es **un nivel global** o **dos
> dominios** separados — comunicación social y conductas repetitivas?»

**Respuesta:**

**0..1 por expediente, revisable, sin cadencia fija** — confirma **M12.4 tal cual está
implementado**: un registro que se edita, dos dominios independientes, sin versionado por año.
→ `puntos-a-validar.md` §1.10 **cerrado** · `consulta-a-ippu.md` §3.10 contestada. **Cero trabajo.**

**Aporte extra de la reunión:** **DSM-5** y **CIF** son documentos de **referencia**, para tener
vocabulario común; conviene dejarlos accesibles desde la aplicación.


**Dispara:**
- *«Una vez»* + *«dos dominios»* → M12.4 confirmado tal cual. `puntos-a-validar.md` §1.10 cerrado.
- *«Se revisa periódicamente»* → ⚠️ la PK deja de ser `hce_id` y hay que **versionarlo**. Es el mismo
  problema que el punto 3, en otra tabla. Entrada en §5.
- *«Un nivel global»* → sobra media tabla; `severidad_dsm` se simplifica. Entrada en §5 enmendando M12.4.

---

# 11. HCE-PAI — el nombre oficial *(no se recorre: no existe)*

*Cuestionario §3.11 (era §3.12) · M12.6 · §5.22*

> «El PAI, ¿cómo se llama oficialmente? En la normativa INAU aparece como “Proyecto de Atención Integral”.»

**Respuesta:**

«**Proyecto de Atención Integral**» — el nombre de **INAU**, no «Propuesta de Atención
Individual» del prototipo. **Va impreso en lo que se le entrega a INAU.** → `puntos-a-validar.md` §1.11
**cerrado** · `consulta-a-ippu.md` §3.11 contestada.

**Dos cosas más sobre el PAI, dichas en la misma respuesta:**
- **La sección VII (Análisis estratégico de la situación actual) se retira**, a pedido de IPPU.
- **Puede haber más de un PAI por año** → confirma la **consecuencia 1 de §5.22**: `pai` **no** lleva
  `UNIQUE(hce_id, anio)`. Y es **una herramienta de trabajo de uso frecuente**, lo que confirma la
  lectura de documento dinámico de §5.22 — que hasta ahora se apoyaba en investigación sobre normativa
  INAU y **no** en material de IPPU.
→ `handoff.md` **§5.42 (I7)**.


**Dispara:** cierra `puntos-a-validar.md` §1.11. El nombre **va impreso en lo que se entrega a la familia**,
así que no es cosmético.

---

# 12. Acceso a la HCE y confidencialidad — **falta el papel, no el «sí»**

> **Ya contestaron en junio:**
> **P3 — ¿Pueden brindarnos acceso al módulo donde trabajan con la HCE?** → «**Sí**, tenemos que resolver el
> tema de la confidencialidad. … en todo caso **mandamos documento** para que las personas que accederán
> firmen.»
> **P45** → «Tal vez el mecanismo es **generar un documento legal para ser firmado**…»

> «**¿Lo redactan ustedes o lo redactamos nosotros?** ¿Quién firma de cada lado, y **para cuándo**?»

**Respuesta:** *(quién redacta / quién firma / fecha comprometida:)*

**Sin respuesta en lo concreto:** no quedó registrado quién redacta el documento, quién firma
de cada lado ni para cuándo. **El trámite sigue igual que antes de la reunión.**

**Lo que sí cambió es el encuadre** (`handoff.md` §5.45 / I10): **guardar** el dato en la HCE **no
requiere permiso**; **compartirlo sí**. `puntos-a-validar.md` §1.6 **deja de bloquear el desarrollo** y
pasa a bloquear **la salida del dato del sistema**. La regla de `CLAUDE.md` no se mueve: **hasta que haya
acuerdo firmado, sólo datos simulados**.


**Dispara:** hasta que exista → **todo sigue siendo dato simulado** (regla de `CLAUDE.md`) y no se mira la
base actual. Con fecha comprometida → entra a §6 como pendiente **con fecha**, no como deseo.

## 12.a — El pedido formal de material *(marcar lo que quede comprometido)*

- [ ] **Anexo A del Manual** y las secciones que el prototipo no muestra (§4, §7, §8, §12, §13, §15, §17,
      §18, §20–22, §24, §25) → ⚠️ **esto es lo que bloquea M12.6** (§5.28)
- [ ] **Matriz de 14 roles**
- [ ] **Anexo del Decreto 72/025** *(ver 1.a)*
- [ ] **Acceso al repositorio de la HCE actual + esquema de su base de datos**
- [ ] **Planilla del Área de Inclusión** *(ver 8.a)*

**Quién lo manda y cuándo:**

**Nada quedó comprometido con nombre y fecha.** Ninguno de los cinco ítems de arriba se marcó como
entrega acordada. Lo único que aportó la reunión sobre este bloque: la **HCE actual de IPPU está alojada
en Heroku** (`handoff.md` §5.44 / I9). Es **dónde vive hoy**, dato de entrada para `puntos-a-validar.md`
§1.5 y `consulta-a-ippu.md` §3.2 — **no** es una decisión de despliegue: `puntos-a-validar.md` §2.5
sigue abierto.


---

# 13. Preguntas clínicas — se plantean, no se resuelven acá

## 13.a — Los descriptores corridos de la «Guía del aplicador»

> «Si aplicaron evaluaciones con la guía que tenía el corrimiento en las dimensiones 3, 4, 6 y 12, **¿qué se
> hace con esos puntajes históricos?**»

**Respuesta:**

**Sin respuesta.** No se trató qué hacer con los puntajes históricos aplicados con la guía que
tenía el corrimiento en las dimensiones 3, 4, 6 y 12. ⚠️ **Y ahora pesa más:** IPPU confirmó que **se
migran todos los expedientes**, activos y archivados (I8 / §5.43), así que esos puntajes **entran** — sin
que esté decidido con qué criterio clínico.


**Dispara:** decisión **clínica de IPPU**, no nuestra. Sólo necesitamos saber **si esos datos entran o no a
la migración** → afecta la estrategia de datos históricos (`puntos-a-validar.md` §1.8).

## 13.b — Secuencia dura o guiada

> «El Manual §3 dice que ningún instrumento se aplica sin que el anterior esté completo y firmado; las
> Especificaciones §1 dicen “flujo guiado, no impuesto”. **¿Cuál rige?**»

**Respuesta:**

**Contestada a medias.** El **orden A→B es firme**; los **períodos son recordatorios, sin
fechas rígidas** (consulta §2.7). ⚠️ **Corrección de acta:** «no es lineal» fue **error de
transcripción** y **se descarta** — no dice nada sobre el orden.

**Lo que sigue sin contestar es la pregunta de fondo:** si el sistema **traba** o **avisa** cuando el
orden no se cumple (Manual §3 vs. Especificaciones §1). Hoy implementamos **guiada**, igual que su propio
código. ⚠️ Y hay un cruce nuevo: I3 saca al **consentimiento** del lugar de bloqueo duro, que era el
único caso donde las dos fuentes coincidían en «traba».


**Dispara:** *dura* → los guards de M11.3 bloquean. *Guiada* → sugieren. Es la diferencia entre un sistema
que traba y uno que avisa; hoy implementamos **guiada**, igual que su propio código.

---

# 14. Lo que IPPU trae y nosotros no preguntamos

> El cuestionario termina con **§3.14 «Algo que no preguntamos»** y esa suele ser la más útil. Acá va todo
> lo que salga y no encaje arriba: quejas, un campo que usan y no está, algo del día a día que no vimos.

**Anotar sin filtrar, y clasificar después:**

Lo que sigue **no tenía pregunta nuestra** y salió igual. Cada punto ya está registrado como decisión en
`handoff.md` §5, serie I.

- **El consentimiento no traba el proceso.** ⚠️ IPPU pidió que el consentimiento **no detenga el proceso
  de evaluación del NNA**. Resolución: el expediente avanza con un estado **«CI pendiente» visible** y una
  **notificación**, en vez de un bloqueo duro. El registro del consentimiento **no cambia**: nombre del
  referente familiar, fecha, botón de firmar. ⚠️ **Este punto es de segunda mano** —lo traen compañeros
  del equipo, no se escuchó en la reunión— aunque el apunte crudo del 21/08 dice «que no tranque los
  procedimientos de evaluación» y las dos fuentes coinciden. **Queda como CONFIRMABLE, no cerrado**, y
  primero en la lista del próximo contacto con IPPU. → `handoff.md` **§5.38 (I3)**.
  ⚠️ **Contradice `consulta-a-ippu.md` §1.3, que IPPU ya tiene en la mano** y que afirma que el
  consentimiento es el único paso que no se puede saltear nunca.
- **Informes: se generan a pedido, sin fecha fija**, para familias e instituciones. **BPS:** siempre a fin
  de año, completo. **INAU:** a pedido, y puede ser por **un solo chico**. Lo que IPPU pidió es un **área
  de generación de informes configurable**, no un catálogo cerrado de tipos. **Regla nueva: todo informe
  lo revisa ADMIN —en los hechos, la dirección— antes de entregarse.** Es un **estado de flujo**
  (borrador → revisado por dirección → entregado), no un permiso de impresión. El **informe de cierre
  anual sigue siendo uno por año**. → `handoff.md` **§5.40 (I5)**.
- **Usuarios y roles.** Un usuario por técnico; el técnico ve sólo sus grupos; ADMIN ve todo, asigna
  grupos y crea otros ADMIN. → **§5.41 (I6)**, y ver 5.b.
- **`hc_historico` es un entero desde 1000** (1001, 1002, …), y **se migran todos los expedientes**,
  activos y archivados. Cierra `puntos-a-validar.md` §1.7 y §1.8. → **§5.43 (I8)**.
- **La HCE actual está alojada en Heroku.** No es el destino confirmado: las opciones se evalúan después.
  → **§5.44 (I9)**.
- **Confidencialidad, reencuadrada:** guardar no requiere permiso, **compartir sí**. §1.6 deja de bloquear
  el desarrollo y pasa a bloquear la salida del dato. → **§5.45 (I10)**.
- **Ateneos:** los **cuatro tipos se confirman**, con la **jornada de capacitación incluida** — es la
  instancia donde varios técnicos se juntan a repasar ateneos, así que pertenece al módulo. **Falta un
  campo explícito de observaciones** y **adjuntos de documentos, PPTX en particular**. «Agregar acuerdo»
  ya existe y se queda. **Meta institucional: 8 ateneos al año, al menos 2 por grupo** — indicador para
  el tablero de M11.3/M11.4; hoy **nada cuenta ateneos por grupo ni por año**. → **§5.46 (I11)**.
- **Guía de trámites para las familias.** IPPU quiere tener una guía a mano para dar a las familias,
  sobre todo para **trámites: BPS, MIDES, INAU**. El que más consultan es **AYEX**. **Va junto con los
  informes.** Es contenido, no modelo — pero necesita **dueño** y una decisión: si el texto se edita
  desde la aplicación o es fijo. → `handoff.md` **§5.49 (I14)**.
- **Confirmaciones que no abren trabajo** (detalle en **§5.48 / I13**): firmas de dos técnicos y cierre
  al firmar, con corrección por nota aparte · el NNA que cambia de grupo (lo firmado queda firmado, lo
  pendiente lo firma el técnico nuevo) · «Evaluación por áreas» y «general» **reemplazadas por los
  Protocolos A y B** · el documento de la familia **se entrega casi siempre en papel** · un NNA puede
  **dejar la diurna y seguir en clínica** (⚠️ tensión con §5.12 / D3, que deja clínica fuera de alcance:
  la transición igual tiene que poder registrarse) · **DSM-5 y CIF** como documentos de referencia.

**Dos errores de acta que la propia reunión corrigió — no relitigar:**
1. **«No es lineal»** (sobre el orden A→B) fue **error de transcripción**. Se descarta. **El orden A→B
   es firme**; lo que no es rígido son **los períodos**.
2. **«Posible cambio de puntaje del IDEA»** fue **error de transcripción**: hablaba de la Escala
   IPPU-TEA. **Se descarta igual. No hay cambio de escala en ningún instrumento.** El proyecto se adapta
   a cómo IPPU trabaja hoy, más las funcionalidades que pidieron.


---

# 15. Cierre — antes de cortar la reunión

- [ ] ¿Quedó alguna pregunta del cuestionario **sin tocar**? → decidir si se pide por escrito o queda para la próxima
- [ ] **Próxima instancia:** fecha ________ · modalidad ____________
- [ ] ¿Quién de IPPU queda como **contacto** para las respuestas que faltan? ____________________
- [ ] ¿Se comprometió alguna fecha de entrega de material? → anotarla arriba, en 12.a
- [ ] **§5.8:** ¿el equipo lo ratifica o lo para? → **no lo ratifica la reunión**, lo ratifica el equipo por
      escrito en §5, con fecha (§5.35)

**Sensación general / cosas a no olvidar:**

**Sin registro.** No quedó anotada la sensación general de la reunión, ni horario, ni próxima
instancia, ni contacto para lo que falta (bloque 15). **Se anota como hueco del acta, no como «no hubo».**
*(Los **presentes** sí se completaron el 2026-08-26, en la cabecera: eran el único dato de este bloque que
alguien recordaba con certeza.)*

---

# 16. Estado del registro — qué quedó contestado y qué no *(escrito el 2026-08-26)*

> **Esta sección no estaba en el archivo original**: se agrega al transcribir la reunión, porque la lista
> de lo que **no** se contestó vale tanto como las respuestas. El archivo tiene **26 bloques
> `**Respuesta:**`**; R0 (`docs/notas/relevamiento-estado-2026-08-26.md`, D-2) verificó que el
> **2026-08-26 estaban los 26 vacíos**.

**12 contestados · 2 a medias · 12 sin respuesta · 1 contestado a confirmar por escrito (9.a).**

### Contestados (12)

| Bloque | Qué cerró | Va a |
|---|---|---|
| **1.a** cortes del baremo | Confirmados | `puntos-a-validar.md` §1.2 |
| **1.c** 24 citas IPPU-TEA | Confirmadas | `puntos-a-validar.md` §1.4 |
| **3.a** IDEA | **ANUAL** | `handoff.md` §5.36 (I1) · consulta §2.1 |
| **4** puntuación | Consenso conjunto, un solo número | §5.47 (I12) · §1.9 · consulta §3.8 |
| **5.a** grupos | Los 4 colores no existen; son otros 5 nombres | §5.37 (I2) |
| **5.b** técnicos del grupo | Usuario por técnico; ve sólo sus grupos | §5.41 (I6) · consulta §3.5 |
| **7.a** fotos | Guardar no requiere autorización; compartir sí | §5.39 (I4) · consulta §2.8 |
| **9.a** ateneo de grupo | Sólo su grupo (2026-08-26) → **REVERTIDO 2026-09-02: acceso general** | §5.58 (L5) · §5.46 (I11) · §1.12 · consulta §3.12 |
| **9.b** año del correlativo | Año de registración (lo implementado) | §1.14 · consulta §3.13 |
| **9.c** prefijo | Uno solo alcanza; `JC-` si es barato | §1.13 · consulta §3.13 |
| **10** HCE-SEV | 0..1, revisable, sin cadencia (lo implementado) | §1.10 · consulta §3.10 |
| **11** nombre del PAI | «Proyecto de Atención Integral» | §5.42 (I7) · §1.11 · consulta §3.11 |

### Contestados a medias (2)

| Bloque | Qué sí | Qué no |
|---|---|---|
| **12** confidencialidad | El **encuadre**: guardar no, compartir sí (§5.45 / I10) | Quién redacta el documento, quién firma, para cuándo. **El trámite no se movió.** |
| **13.b** secuencia | El **orden A→B es firme**; los períodos son recordatorios | Si el sistema **traba** o **avisa** (Manual §3 vs. Especificaciones §1) |

### Sin respuesta (12) + 1 a confirmar — la lista que hay que llevar al próximo contacto

| Bloque | Qué quedó sin preguntar/contestar | Qué sigue bloqueando |
|---|---|---|
| **9.a** ⚠️ | **Confirmación escrita** de que el ateneo de grupo es de **acceso general**. La reunión lo cerró «por grupo» (2026-08-26); una corrección de IPPU lo revirtió el 2026-09-02 (§5.58 / L5) pero **no consta en el acta** | Nada del modelo — `Ateneo.sensible` ya da acceso general. Es respaldo de una decisión **CONFIRMABLE**, como §5.38 (I3) |
| **1.b** | De dónde sale el porcentaje del baremo | Nada. Supuesto nuestro, no confirmado |
| **2.a** ⚠️ | ¿Quieren registrar participación por taller? | **El alcance de M12.6** (`pai_taller`) y §5.21 |
| **2.b** | Los 14 talleres de este año / orientación por grupo | `consulta-a-ippu.md` §3.1 |
| **3.b** | Qué IDEA muestra un documento viejo | Requisito de **M11.3** (§5.35, derivado 2) |
| **5.c** | Cambio de **técnico** a mitad de año | El residuo de §5.18 (vigencias por técnico) |
| **5.d** | Qué es «tutor» | `puntos-a-validar.md` §2.10 · `handoff.md` §7 |
| **6** | Las 6 bandas del IDEA | Nada. Catálogo nuestro sin confirmar (§5.13 / D4) |
| **7.b** | HCE-DOC institucional en general | §5.25 queda como capacidad con **un** uso pedido (adjuntos de ateneo) |
| **8.a** | La planilla del Área de Inclusión | **M12.5**: `centro` texto libre vs. FK a catálogo |
| **8.b** | Los 7 `INC_ESTADOS` | **M12.5** arranca con el supuesto sin confirmar |
| **8.c** ⚠️ | ¿Se anualiza el estado de inclusión? | **M12.5.** ⚠️ **No** la contesta el IDEA anual (§5.35) |
| **13.a** | Qué hacer con los puntajes de la guía con corrimiento | Estrategia de datos históricos — **y ahora migran todos** (I8) |

### Condición de retiro del archivo — **NO se cumple todavía**

La cabecera fija cuatro pasos antes de borrarlo. Estado al **2026-08-26**:

1. ✅ Cada «sí» pasó a `puntos-a-validar.md` con fecha y con «reunión IPPU 2026-08-21».
2. ✅ Cada «no» abrió entrada en `handoff.md` §5 (serie **I**, §5.36–§5.49).
3. ⚠️ **A medias.** Las respuestas se transcribieron bajo su `> _Respuesta:_` en `consulta-a-ippu.md`,
   **pero el artefacto autoritativo es el Google Doc del equipo** (§5.34) y **eso lo tiene que hacer una
   persona, a mano**. Queda como pendiente con nombre en `handoff.md` §6.
4. ⛔ **Por lo tanto el archivo NO se borra.** Además, este registro conserva algo que no está en ningún
   otro lado: **las dos correcciones de acta** y **los 12 bloques sin respuesta**.
