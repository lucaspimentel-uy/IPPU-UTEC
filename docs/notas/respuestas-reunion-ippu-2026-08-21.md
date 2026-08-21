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
> - **Presentes:** ______________________________ · **Hora inicio / fin:** ________ / ________

---

# 1. Las tres que **nunca les llegaron**

> Se dicen al principio, de corrido. No tienen `> _Respuesta:_` en el cuestionario porque **no se enviaron**
> (§5.34). Ésta es su única instancia.

## 1.a — Los cortes del baremo *(era §2.7 del borrador; nunca se envió)*

> «Los porcentajes que usamos son 0–4 sin discapacidad · 5–24 leve · 25–49 moderado · 50–95 severo ·
> 96–100 muy severo. **¿Están bien esos cortes?** Y si tienen a mano **el anexo del Decreto 72/025**, nos
> sirve muchísimo.»

**Respuesta:**


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


**Dispara:**
- *Sí* → supuesto confirmado; nada que hacer. `puntos-a-validar.md` §1.2.
- *No, lo calcula la institución* → ⚠️ **contradice el diseño**: hoy `pct` es dato de entrada y el baremo
  sólo deriva de él. Abre entrada en **§5** antes de tocar nada.

## 1.c — Las 24 citas de la Escala IPPU-TEA ⚠️ *(era §3.2, marcada ⚠️; nunca se envió)*

> «Cada ítem tiene una referencia — DSM-5-TR, CIF, Wing & Gould, Baron-Cohen, Rivière — tomada tal cual del
> prototipo. **No las verificamos, y no deberíamos ser nosotros.** ¿Alguien las revisó? ¿Las damos por
> buenas o las repasa un técnico?»

**Respuesta:**


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


**Dispara:** *distinto* → catálogo, barato. *Igual* → D9 confirmada con fecha.

## 5.b — ⚠️ Responsables y técnicos autorizados: **mostrado, no modelado**

> La pantalla muestra responsable 1 / responsable 2 y una nómina de técnicos autorizados que **§5.18 no
> modela**. Un «sí, así es» **NO confirma un supuesto**: significa **trabajo nuevo de backend**.

**Respuesta:**


**Dispara:** cualquier «sí» → a la **lista de reconciliación de `grupo`**, no a la de confirmados. Entrada
en §6 como pendiente con nombre. *(Hallazgo 3 de §13, 2026-08-20: mergear F1 no lo modela.)*

## 5.c — Cambio de técnico a mitad de año

> «Si un responsable cambia a mitad de año, ¿tiene que quedar registrado quién era antes y desde cuándo?»

**Respuesta:**


**Dispara:** *«sí»* → el residuo de §5.18 deja de ser aceptable: hay que **modelar vigencias por técnico**.
Es el cambio caro de este punto. *«No importa»* → el residuo se cierra como aceptado, con fecha.

## 5.d — Qué es «tutor» *(abierta por F1, `handoff.md` §7)*

> «¿Es el técnico responsable del grupo, otro rol — referente por chico —, o el tutor legal de la familia?»

**Respuesta:**


**Dispara:** *rol nuevo* → tabla o columna nueva, y `puntos-a-validar.md` §2.10 se reclasifica **de punto
de equipo a punto de IPPU**. *Sinónimo* → se cierra §7 sin código.

---

# 6. Las 6 bandas del IDEA

*§5.13 / D4*

**Respuesta:**


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


**Dispara:**
- *«Sirve así»* → §8.4 confirmada. El guard entra a **M11.3** tal cual está.
- *«Nos traba, sacamos la foto y regularizamos después»* → ⚠️ la regla pasa de **bloqueo** a **advertencia**.
  Entrada en §5: es un cambio de una regla dura ya escrita, no un ajuste.

## 7.b — HCE-DOC institucional *(§5.25)*

> «¿Hay documentación institucional que no pertenece a ningún chico en particular?»

**Respuesta:**


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


**Dispara:** *nos la pasan* → sale de ahí el **catálogo de centros educativos**, que es lo que M12.5 necesita
para decidir si `centro` es texto libre o FK. Cierra la pregunta abierta de §7. *No la pasan* → `centro`
queda **texto libre**, como en el Prototipo v4, y se anota la decisión.

## 8.b — Los 7 estados de inclusión

> «Hoy los inventamos nosotros: inclusión plena · parcial (horario reducido) · en adaptación · en espera de
> cupo / trámite · desvinculado/a… **¿son estos?**»

**Respuesta:**


**Dispara:** *distintos* → los 7 `INC_ESTADOS` se corrigen **antes** de M12.5 (hoy son supuesto nuestro).
*Iguales* → confirmados con fecha, y M12.5 arranca con un supuesto menos.

## 8.c — ⚠️ ¿Se anualiza el estado de inclusión? *(pregunta de §5.35, distinta de §5.8)*

> «El estado de inclusión de un chico, ¿es del **año lectivo** — como el grupo — o es una situación vigente
> que se va actualizando?»

**Respuesta:**


**Dispara:** *«del año»* → `inclusion.estado` / `fecha_estado` necesitan `anio`, mismo patrón que D9.
⚠️ **No mezclar con la respuesta del IDEA (3.a): son dos preguntas distintas** — el IDEA es un instrumento
con línea base, esto es una situación. Va como entrada propia en §5.

---

# 9. Ateneos y jornadas

**Pantalla:** Ateneos · panel de ateneos del expediente · *M12.7*

## 9.a — ¿El ateneo de grupo es sensible? *(cuestionario §3.12 ⚠️, era §3.13)*

**Respuesta:**


**Dispara:** *«sensible»* → el derivado `sensible` de `ateneo` suma el tipo «de grupo». Cambio chico, es
`hybrid_property`. *«La ve cualquier técnico del grupo»* → queda como está; `puntos-a-validar.md` §1.12
cerrado.

## 9.b — El año del correlativo `AT-2026-001` *(cuestionario §3.13, era §3.14)*

> «¿Es el año en que **se hizo** el ateneo o el año en que **se cargó**?»

**Respuesta:**


**Dispara:** cierra `puntos-a-validar.md` §1.14. Hoy asumimos **año de registración**
(`UNIQUE(anio_correlativo, numero)`); si es el año del hecho, cambia qué alimenta `anio_correlativo`.

## 9.c — El prefijo *(`puntos-a-validar.md` §1.13)*

> «¿Un solo prefijo `AT-` para los cuatro tipos, o uno por tipo?»

**Respuesta:**


---

# 10. HCE-SEV — severidad DSM-5-TR *(no se recorre: la demo no lo tiene)*

*Cuestionario §3.10 (era §3.11) · M12.4*

> «¿Se registra una vez y queda, o se revisa en un momento fijo del año? ¿Y es **un nivel global** o **dos
> dominios** separados — comunicación social y conductas repetitivas?»

**Respuesta:**


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


---

# 13. Preguntas clínicas — se plantean, no se resuelven acá

## 13.a — Los descriptores corridos de la «Guía del aplicador»

> «Si aplicaron evaluaciones con la guía que tenía el corrimiento en las dimensiones 3, 4, 6 y 12, **¿qué se
> hace con esos puntajes históricos?**»

**Respuesta:**


**Dispara:** decisión **clínica de IPPU**, no nuestra. Sólo necesitamos saber **si esos datos entran o no a
la migración** → afecta la estrategia de datos históricos (`puntos-a-validar.md` §1.8).

## 13.b — Secuencia dura o guiada

> «El Manual §3 dice que ningún instrumento se aplica sin que el anterior esté completo y firmado; las
> Especificaciones §1 dicen “flujo guiado, no impuesto”. **¿Cuál rige?**»

**Respuesta:**


**Dispara:** *dura* → los guards de M11.3 bloquean. *Guiada* → sugieren. Es la diferencia entre un sistema
que traba y uno que avisa; hoy implementamos **guiada**, igual que su propio código.

---

# 14. Lo que IPPU trae y nosotros no preguntamos

> El cuestionario termina con **§3.14 «Algo que no preguntamos»** y esa suele ser la más útil. Acá va todo
> lo que salga y no encaje arriba: quejas, un campo que usan y no está, algo del día a día que no vimos.

**Anotar sin filtrar, y clasificar después:**


---

# 15. Cierre — antes de cortar la reunión

- [ ] ¿Quedó alguna pregunta del cuestionario **sin tocar**? → decidir si se pide por escrito o queda para la próxima
- [ ] **Próxima instancia:** fecha ________ · modalidad ____________
- [ ] ¿Quién de IPPU queda como **contacto** para las respuestas que faltan? ____________________
- [ ] ¿Se comprometió alguna fecha de entrega de material? → anotarla arriba, en 12.a
- [ ] **§5.8:** ¿el equipo lo ratifica o lo para? → **no lo ratifica la reunión**, lo ratifica el equipo por
      escrito en §5, con fecha (§5.35)

**Sensación general / cosas a no olvidar:**
