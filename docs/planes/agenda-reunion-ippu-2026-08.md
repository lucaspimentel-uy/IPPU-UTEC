# Agenda — reunión con Fundación IPPU (2026-08-21)

> **Qué es esto:** el guion de una recorrida por la demo, pantalla por pantalla, para que IPPU nos diga si
> el sistema se parece a cómo trabajan. **No es una ronda de frontend** y no pide cambios en `demo/`.
>
> **Por qué importa más que una reunión de avance:** ésta **es** la puerta de validación de `handoff.md`
> §5.8. Hoy **M12.5, M12.6 y M12.8 están frenados por esto** (§5.28), no por falta de manos.
> ⚠️ **Precisión de §5.35 (2026-08-20):** la puerta **no** está antes de M12.5 sino **antes de M11.3**, y
> **§5.8 no queda ratificado por esta reunión** salvo que el equipo lo escriba después, con fecha.
>
> - **Autor:** Lucas · **Reescrita:** 2026-08-20 (Fase B) · **Estado:** para llevar a la reunión.
> - **Antecedente:** `docs/notas/consulta-a-ippu.md` **se envió el 2026-08-19** y todavía no volvió — pero
>   hace un día, así que **no se lleva como reclamo**: no hubo tiempo material de contestarlo. La reunión
>   no es una escalada; es el canal donde estas preguntas se responden más rápido que un formulario de 30
>   ítems. IPPU **ya lo tiene en sus manos**: conviene apoyarse en él («esto ya se lo mandamos, mirémoslo
>   juntos») en vez de preguntar de cero.
> - ⚠️ **Toda cita `§N.N` de esta agenda usa la numeración del documento que IPPU tiene delante**, que
>   **no** es la del borrador anterior al 19/08 (mapa en `handoff.md` §5.34).
> - **Dónde se anota:** `docs/notas/respuestas-reunion-ippu-2026-08-21.md`, ya armado para llenar.

---

## 0. Cómo leer cada punto

Cada pantalla se presenta con tres cosas y en este orden:

1. **Qué supusimos nosotros** — el supuesto que esa pantalla pone a la vista.
2. **Qué cuesta un «no»** — qué habría que rehacer si IPPU dice que no es así. Esto es lo que decide a qué
   le dedicamos la reunión: las pantallas baratas se pueden mirar rápido.
3. **Qué preguntar** — la pregunta concreta, en criollo, sin vocabulario técnico.

**Regla de la reunión:** un «sí, así trabajamos» **cierra** el supuesto y lo anotamos como confirmado con
fecha. Un «no» **no se discute en el momento**: se anota y se resuelve por escrito después (§12.6).

⚠️ **Regla nueva, y es la más importante de esta agenda.** Varias preguntas **ya tienen respuesta escrita
de IPPU** en el cuestionario de relevamiento del **15/06/2026** (Fernando Sierra). Esas **no se vuelven a
preguntar**: se leen en voz alta y se pregunta **lo que sigue abierto**. Volver a preguntar algo ya
contestado gasta la reunión y le dice a IPPU que no leímos lo que nos mandaron.

**Por qué este orden.** §1 son 30 segundos de trámite. §2 y §3 son los dos «no» que más borran trabajo, y
§2 va primero porque puede **sacar un módulo entero del alcance**. §4 es el «no» más caro que existe, pero
va después porque **no se recorre en pantalla** (ver ahí el motivo).

---

## 1. Trámite de 30 segundos — tres preguntas que **nunca les llegaron**

**Sin pantalla.** Se dice al principio, de corrido, y se sigue.

Al revisar el cuestionario antes de mandarlo, el equipo sacó tres preguntas y **no se enviaron**
(`handoff.md` §5.34). Dos son del **baremo** y una es la de las **citas de la Escala IPPU-TEA**. Como no
tienen ningún canal escrito, **la reunión es el único que queda**.

> **Y hay que decirlo de frente, sin drama:** «Una cosa antes de empezar: en el cuestionario que les
> mandamos, la introducción menciona una pregunta sobre **las citas bibliográficas de la escala** — y esa
> pregunta **no quedó en el documento**, se nos cayó al revisarlo. Si la fueron a buscar, no estaba. Se la
> hago acá.»

**(a) Los cortes del baremo** *(era §2.7 del borrador)*

> «Los porcentajes que usamos para la valoración funcional son 0–4 sin discapacidad · 5–24 leve · 25–49
> moderado · 50–95 severo · 96–100 muy severo. **¿Están bien esos cortes?** Y si tienen a mano **el anexo
> del Decreto 72/025**, nos sirve muchísimo — es lo único que nos falta para dejar de asumirlo.»

**(b) De dónde sale el porcentaje** *(era §2.8 del borrador)*

> «¿El porcentaje de discapacidad **lo pone el organismo oficial** que hace la valoración, y el sistema lo
> registra tal cual? Pregunto porque **nosotros no lo calculamos ni lo deducimos** de las evaluaciones
> internas, ni del IDEA ni de la Escala IPPU-TEA.»

**(c) Las 24 citas de la Escala IPPU-TEA** *(era §3.2 del borrador, y estaba marcada ⚠️)*

> «Cada uno de los 24 ítems de la escala tiene una referencia — DSM-5-TR, CIF, Wing & Gould, Baron-Cohen,
> Rivière. Las tomamos **tal cual estaban en el prototipo**. **No las verificamos contra las fuentes
> originales, y no deberíamos ser nosotros quienes lo hagan.** ¿Alguien del equipo las revisó en su
> momento? ¿Las damos por buenas, o conviene que un técnico las repase antes de presentar el instrumento
> formalmente?»

**Qué cuesta un «no».** El baremo es barato — tabla paramétrica, se cambian los cortes con un `UPDATE`.
⚠️ **Al reconciliar contra el anexo se ajustan los CORTES, nunca las ETIQUETAS**: IPPU usa siempre la
nomenclatura institucional («severo / muy severo», nunca «grave»), y hay un test que salta en rojo si
alguien toca la columna `categoria` (`puntos-a-validar.md` §1.2). Las citas no cuestan desarrollo: cuestan
credibilidad del instrumento si se presentan mal.

---

## 2. Talleres — ⚠️ **¿estamos modelando una práctica que no existe?**

**Pantalla:** **Grupos** → abrir un grupo → card **«Talleres del grupo»** · `#view-grupos`

**⚠️ Esto va primero por una razón: en junio ustedes ya nos dijeron que no.** El cuestionario del 15/06:

> **P14 — ¿Hay registros de asistencia a talleres? ¿En qué formato?** → **«No»**
> **P15 — ¿Se registran indicadores de progreso por taller? ¿Cuáles?** → **«No»**

Y **M12.6 está por construir `pai_taller`**, que es exactamente eso: la participación de cada NNA en cada
taller. **La primera pregunta no es quién administra los talleres. Es si esto se registra.**

> «En junio nos dijeron que **no** llevan registro de asistencia a talleres ni indicadores por taller.
> Nosotros tenemos armado un módulo para registrar **la participación de cada chico en cada taller**.
> **¿Eso es algo que quieren tener, o es algo que nosotros inventamos?** Si no lo van a usar, preferimos
> **no construirlo** — no es que nos cueste, es que un campo que nadie llena ensucia la historia clínica.»

**Consecuencia, escrita, para que la respuesta sea accionable:**
- **«No lo queremos»** → **`pai_taller` sale del alcance de M12.6** y §5.14/D5 queda sólo como catálogo de
  talleres, sin participación. M12.6 se achica.
- **«Sí, nos serviría, hoy no lo hacemos»** → se construye, y queda anotado que es **práctica a
  introducir**, no práctica existente (mismo tratamiento que §5.16).
- **«Sí, ya lo hacemos»** → contradice P14/P15 de junio; se pide dónde se registra hoy.

**Recién después, si la respuesta fue sí, lo segundo:**

> «Estos catorce talleres los sacamos del prototipo que nos pasaron. **¿Son los que están dictando este
> año?** ¿Hay alguno que se ofrezca sólo a ciertos grupos? Y la lista, **¿la maneja coordinación** —
> agregar, reordenar, dar de baja?»

**Qué cuesta un «no».** La lista es un catálogo: barato. Lo caro es `pai_taller`, y es el punto de arriba.
⚠️ **Lo que la demo hoy NO tiene** es la **pantalla para administrar** el catálogo: los 14 están cargados y
se leen, pero agregarlos o darlos de baja lo hacemos nosotros. Eso ya se lo dijimos por escrito (§3.1 del
cuestionario enviado) — **no prometer que se administra sola.**

---

## 3. El IDEA: ¿una línea base o todos los años? — **donde IPPU ya se contradijo consigo mismo**

**Pantalla:** expediente → **IDEA (HCE-LB)** · `#view-idea`

**Qué supusimos.** Que el IDEA se aplica **una sola vez**, como **línea base** del NNA, repitiéndose sólo
ante un reingreso a más de 12 meses. Es lo que dice el Documento Técnico v1.0 y la razón por la que la demo
**dejó de tener selector de año** en M4.

**⚠️ La pregunta cambió de forma: ya no es «¿cómo lo hacen?».** El cuestionario del 15/06:

> **P10 — ¿Con qué frecuencia se evalúa a cada NNA con IDEA?** → **«Anual»**
> **P12 — ¿Existe algún archivo que consolide todas las evaluaciones?** → **«No, las evaluaciones aparecen
> por año (individual). No hay un histórico consolidado.»**

> «En junio nos dijeron que el IDEA se hace **todos los años**. El documento técnico que nos pasaron dice
> lo contrario: **una sola vez**, como línea base. Construimos siguiendo el documento. **¿Nos confirmás que
> es anual?** Si es anual lo cambiamos ahora, que es el momento barato.»

**Qué cuesta un «no».** En el backend, **poco y medido** (§5.31 y §5.35): el cambio es **aditivo** — `idea`
**ya admite varias instancias por expediente**, no hay `UNIQUE` que cambiar, ninguna FK se reconecta y
ningún test se rompe si el campo va nullable. **1 tabla de 38.** En la demo, **caro**: `flujo.lb` es un
objeto único y ~18 usos en 6 módulos lo asumen; volver a anual es reponer el selector de año que la v3.3
tenía y M4 retiró.

**Segunda pregunta, sólo si la respuesta es «anual»:**

> «Si el IDEA es anual, **¿el informe de un año tiene que mostrar el IDEA de ese año**, aunque después
> hayan hecho otro? Es decir: un PAI de 2024, ¿muestra el IDEA de 2024 o el último?»

*(Esto es requisito de M11.3, anotado en §5.35: hoy la regla es «rige la de mayor `fecha_consenso`», y sin
esta respuesta un documento viejo puede renderizar en silencio el IDEA de hoy.)*

---

## 4. Los dos técnicos que puntúan por separado — **el «no» más caro disponible**

### ⚠️ Esta se pregunta. **NO se muestra la pantalla.** Decidido 2026-08-20.

**Motivo, y hay que tenerlo claro antes de entrar:** la pantalla del IDEA de la demo muestra **firma doble
sobre un puntaje único de consenso** (`flujo.js:195`; `lb.dim` es un arreglo plano de 12 valores) — es **lo
contrario** de lo que el backend modela en §5.16/D7 (dos puntuaciones independientes + registro de
consenso). Si se muestra como sonda, un **«sí, así trabajamos»** confirma **el modelo que no construimos**,
y lo anotaríamos como supuesto validado cuando no validó nada. **Se pregunta en seco.**

**Qué supusimos.** Que **dos técnicos puntúan cada dimensión de forma independiente**, que las dos
puntuaciones se guardan por separado, y que cuando difieren queda **registro del consenso** (§5.16 / D7).

**⚠️ Es agregado nuestro. No está en el Prototipo v4.** Lo modelamos porque el Manual describe aplicación
en dupla y porque sin las dos puntuaciones separadas nunca se va a poder medir concordancia — pero **IPPU
nunca nos dijo que trabaje así**.

**La pregunta, textual, para no improvisarla en la sala:**

> «Cuando aplican el IDEA entre dos técnicos: **¿cada uno pone su puntaje por separado y después los
> comparan, o lo conversan y ponen un número acordado?** Y si hoy es lo segundo — **¿les serviría que el
> sistema les permita lo primero, o les complicaría el día a día?** Pregunto porque el sistema acepta igual
> un solo valor: no les estamos imponiendo una forma de trabajar.»

La segunda mitad importa: si es práctica **a introducir** y no una que ya existe, §5.16 queda **latente** —
no urge, pero tampoco se tira.

**Está también por escrito:** es la **§3.8** del cuestionario que tienen (era §3.9 antes de la revisión).

**Qué cuesta un «no».** El más caro de la lista. Un «no, ponemos un número acordado» deja sin sentido
`puntuacion_idea` y `puntuacion_protocolo` enteras (M12.2), el `CHECK` de evaluadores distintos, la columna
generada `diferencia`, y el guard de «diferencia ≥ 2 exige documentación» que **M11.3 todavía no escribió**.
Mejor saberlo antes de M11.3 que después.

---

## 5. Los grupos — **mostrado pero no modelado**

**Pantalla:** **Grupos** · `#view-grupos` (listado y detalle)

**Qué supusimos.** Que los grupos son **por color** (Azul · Celeste · Naranja · Verde), que son **4**, y que
se reconfiguran **año a año** — por eso el backend le puso identidad propia y `UNIQUE(nombre, año)`
(§5.18 / D9), para distinguir «Azul 2026» de «Azul 2027».

**⚠️ Lo que IPPU va a ver en la pantalla no es lo que está modelado.** La pantalla muestra **responsable 1 /
responsable 2** y una nómina de **técnicos autorizados** que **§5.18 no modela** y sobre la que **no hay
decisión escrita en §5**. Si IPPU dice «sí, así es», eso **no confirma nada**: significa **trabajo nuevo de
backend**, no un supuesto validado. **Va a la lista de reconciliación, no a la de confirmados.**

**Qué cuesta un «no».** El «no» al color y a los 4 es barato (catálogo). El caro es otro:

> «Si un técnico responsable de un grupo **cambia a mitad de año**, ¿eso tiene que quedar registrado — quién
> era antes y desde cuándo? Hoy nosotros **lo perdemos**: se sobrescribe y sólo queda rastro en la
> auditoría.»

**Y la que no está en ningún lado todavía** (§7 de `handoff.md`, abierta por F1):

> «Cuando dicen **“tutor”**, ¿es lo mismo que el técnico responsable del grupo, es **otro rol** — un
> referente por chico —, o es el **tutor legal** de la familia? Los tres nos cambian el modelo.»

---

## 6. Las 6 bandas del IDEA

**Pantalla:** expediente → **IDEA** (interpretación) y **Analítica** · `#view-analitica`

**Qué supusimos.** Que la interpretación del total del IDEA usa **6 tramos** con su correspondencia al
soporte DSM-5-TR (§5.13 / D4).

**Qué cuesta un «no».** Barato: es un catálogo paramétrico, se cambia sin tocar código.

*(Los cortes del baremo y el anexo del Decreto 72/025 se preguntan en **§1**, porque nunca se enviaron.)*

---

## 7. Las fotos y la autorización de uso de imagen (§8.4)

**Pantalla:** expediente → **HCE-DOC / fotos**, y el detalle de grupo → **Registro fotográfico grupal**

**⚠️ La parte del «sí» ya está contestada, no se vuelve a preguntar.** El cuestionario del 15/06:

> **P43 — ¿Existe un protocolo de consentimiento informado para el uso de datos de los NNA?** → «Se hace
> puntualmente y en base a situaciones particulares **a excepción del uso de imagen, que tiene un formato
> genérico**.»

Es decir: **la autorización de uso de imagen existe y es un formulario genérico.** Eso confirma el campo.
**Lo que falta preguntar es una sola cosa, la operativa:**

> «Hoy el sistema **bloquea** la carga de una foto si esa familia no tiene la autorización registrada; y
> para una **foto grupal** exige que la tengan **todas** las familias del grupo, y les dice cuáles faltan.
> **¿Eso les sirve así, o les traba el día a día?** Si en la práctica sacan la foto igual y regularizan
> después, es mejor que lo aflojemos ahora.»

**Qué cuesta un «no».** Barata de aflojar, cara de descubrir en producción.

**Preguntar también**, por el alcance institucional de HCE-DOC (§5.25):

> «¿Hay documentación institucional que **no pertenece a ningún chico en particular** — de un ateneo, de una
> jornada? Porque hoy la modelamos colgando **de un expediente o de un ateneo**, nunca de los dos.»

---

## 8. Inclusión educativa — **la planilla del Drive**

**Pantalla:** **Inclusión** · `#view-inclusion` (tablero institucional por estado)

**⚠️ Ya nos contestaron que el área existe. No se pregunta de nuevo.** El cuestionario del 15/06:

> **P31 — ¿Hay intercambio con los centros educativos formales donde asisten los NNA?** → «Sí. Hay un **“Área
> de Inclusión”** que se encarga de eso. **Todo se registra en el Drive.**»

**Lo que hace falta es el archivo, no la confirmación:**

> «Nos dijeron que el Área de Inclusión registra todo en el Drive. **¿Nos pasan esa planilla?** No para
> migrarla — para sacar de ahí **la lista de centros educativos** y ver si los estados que usamos son los
> que ustedes usan. Hoy los inventamos nosotros: “inclusión plena”, “inclusión parcial (horario reducido)”,
> “en adaptación”, “en espera de cupo / trámite”, “desvinculado/a”… **¿son estos?**»

**Qué cuesta un «no».** Los estados son un catálogo (barato). El centro educativo hoy es **texto libre**
porque el prototipo lo resuelve así; si tienen lista cerrada, se vuelve catálogo — que es lo que M12.5
necesita saber antes de arrancar.

**⚠️ Alcance, para no prometer de más.** Lo que se muestra es un **tablero institucional por estado**. **No
es la ficha ni la bitácora por chico** de HCE-INC: eso es M12.5 y **no está construido** (§5.33).

---

## 9. Ateneos y jornadas de capacitación

**Pantalla:** **Ateneos** · `#view-ateneos`, y el panel de ateneos dentro del expediente

**Qué supusimos.** Una sola entidad con **4 tipos** (ateneo clínico · de grupo · institucional · jornada de
capacitación), campos según el tipo, y correlativo `AT-2026-001` (M12.7).

**Dos preguntas, las dos ya por escrito** — **§3.12** y **§3.13** del cuestionario que tienen (eran §3.13 y
§3.14 antes de la revisión):

> «El **ateneo de grupo**, ¿quién puede verlo? ¿Es información sensible como la de un ateneo clínico, o la
> ve cualquier técnico del grupo?»
>
> «El número `AT-2026-001`: ese 2026, ¿es el año en que **se hizo** el ateneo o el año en que **se cargó**
> al sistema? Si alguien carga en enero un ateneo de diciembre, ¿qué número le toca?»

**Qué cuesta un «no».** Chico: el correlativo y el flag de sensible son derivados, no columnas.
⚠️ **Lo que la demo no tiene:** adjuntos por ateneo (el XOR de §5.25 está modelado en el backend, no en la
demo) y bitácora de cambios a nivel ateneo.

---

## 10. Acceso a la HCE actual y confidencialidad — **el «sí» ya lo dieron; falta el papel**

**Sin pantalla.**

**⚠️ Ya está contestado que sí. No se vuelve a preguntar.** El cuestionario del 15/06:

> **P3 — ¿Pueden brindarnos acceso al módulo donde trabajan con la HCE?** → «**Sí**, tenemos que resolver el
> tema de la confidencialidad de los datos. Planteo a la Fundación y en todo caso **mandamos documento** para
> que las personas que accederán a la misma, firmen.»
> **P45 — ¿Hay restricciones legales o institucionales…?** → «Tal vez el mecanismo es **generar un documento
> legal para ser firmado** por las personas que accederán a la información sensible.»

**Lo único que falta es una fecha y un responsable:**

> «En junio nos dijeron que iban a **mandar un documento** de confidencialidad para que firmen quienes
> accedan a los datos. **¿Lo redactan ustedes o lo redactamos nosotros?** ¿Quién lo firma de cada lado, y
> **para cuándo** lo podemos tener? Mientras no exista, **todo lo que estamos mostrando es dato simulado** —
> y no podemos ni mirar la base de datos actual.»

**Y en el mismo tramo, lo que sólo se consigue pidiéndolo:**

- el **anexo del Decreto 72/025** *(ver §1)*
- el **Anexo A del Manual** y las secciones que el prototipo no muestra (§4, §7, §8, §12, §13, §15, §17,
  §18, §20–22, §24, §25) — ⚠️ **esto es lo que bloquea M12.6**, el módulo más grande (§5.28)
- la **matriz de 14 roles** que sus pendientes mencionan y el prototipo no trae
- **acceso al repositorio de la HCE actual y a su esquema de base de datos**

---

## 11. Qué **no** se puede recorrer, y hay que decirlo

| Módulo | Estado | Cómo se trata en la reunión |
|---|---|---|
| **HCE-SEV** (severidad DSM-5-TR) | **En el backend (M12.4), no en la demo.** No lo tiene ninguna rama. | Se pregunta de palabra o se muestra el modelo. **No cuenta como pantalla validada.** |
| **HCE-PAI** (M12.6) | No existe en ningún lado todavía. | No se muestra. Se pregunta el **nombre oficial** (§3.11 del cuestionario). |
| **HCE-INC ficha + bitácora por NNA** (M12.5) | La demo tiene **sólo el tablero institucional**. | Ver §8. No presentar el tablero como si fuera el módulo. |

**HCE-SEV, la pregunta:**

> «La severidad DSM-5-TR: **¿se registra una vez y queda**, o se revisa en algún momento fijo del año? ¿Y la
> registran como **un nivel global**, o separada en **dos dominios** — comunicación social por un lado,
> conductas repetitivas por el otro?»

*(Es la §3.10 del cuestionario que tienen.)* **Qué cuesta un «no»:** si es un nivel global, sobra media
tabla; si se registra **más de una vez en el tiempo**, la PK deja de ser `hce_id` y hay que versionarlo —
el mismo problema del punto 3, en otra tabla.

---

## 12. Qué cierra una recorrida que un cuestionario no

- **Lo que la recorrida cierra mejor:** el **orden** de las pantallas y si el flujo se parece a la secuencia
  real de trabajo; si **falta un campo** que usan todos los días (eso aparece mirando, no leyendo); si algo
  que modelamos como obligatorio **les traba** la operativa; y §5 — que alguien mire la pantalla de grupos y
  diga «esto no es un grupo nuestro» es inmediato, y por escrito no pasa.
- **Lo que la recorrida NO cierra:** todo lo del §10. Son documentos y accesos, no pantallas.
- **Lo que hay que resolver sí o sí, y no es técnico:** el **acuerdo de confidencialidad**.

---

## 13. Preguntas clínicas que no nos toca resolver, pero hay que dejar planteadas

- **Los descriptores corridos.** El Prototipo v4 dice haber corregido «un corrimiento de niveles detectado
  en materiales institucionales previos (Dimensiones 3, 4, 6 y 12 de la Guía del aplicador, hoy
  desestimada)». Nosotros **no usamos esa guía** —nuestros 60 descriptores salen del texto oficial de
  Rivière—, pero la pregunta queda: **si IPPU aplicó evaluaciones con la guía corrida, ¿qué se hace con esos
  puntajes históricos?** Es decisión clínica de ellos; sólo necesitamos saber si esos datos entran o no a la
  migración.
- **Secuencia dura o guiada.** El Manual §3 dice que «ningún instrumento puede aplicarse sin que el anterior
  esté completo y firmado»; sus Especificaciones §1 dicen «flujo guiado, **no impuesto**». Su propio código
  implementa la guiada, y nosotros también. **Confirmar cuál rige**: es la diferencia entre un sistema que
  bloquea y uno que sugiere.

---

## 14. Qué demo se muestra, y qué cubre

**Una sola.** `main` con `demo/F1-navegacion` **ya mergeada** (2026-08-20): no hay que elegir rama ni
advertir que «esto está en la otra».

**Cubre:** Inicio · Pendientes · Analítica institucional · **Grupos** (listado + detalle, con los talleres
por grupo) · **Inclusión** (tablero) · **Ateneos** · y el expediente completo — Consentimiento, IDEA,
Protocolo A/B con su Δ, Informe de Cierre, HCE-DOC/ORG/VF, fotos con la regla de autorización.

**No cubre, y no se presenta como si lo hiciera:** **HCE-SEV** (ninguna rama lo tiene) · **HCE-PAI** · la
**ficha y bitácora de HCE-INC por chico** · la **administración** del catálogo de talleres.

⚠️ **Lo que nadie verificó todavía:** la demo **no se abrió en un navegador** después del merge. Toda la
verificación de esta noche fue automática (sintaxis, tests, catálogos). **Recorrerla con los ojos antes de
la reunión es la única tarea que ninguna sesión pudo cerrar.**

---

## 15. Checklist de cierre de la reunión

- [ ] **Talleres:** ¿se registra la participación por taller, sí o no? → si es no, **`pai_taller` sale de M12.6**
- [ ] **IDEA:** ¿anual o línea base única? → y si es anual, ¿el documento de un año muestra el IDEA de ese año?
- [ ] **Dos técnicos:** ¿práctica actual, práctica a introducir, o no? → decide el futuro de §5.16 / D7
- [ ] **Baremo:** cortes confirmados y **anexo del Decreto 72/025** pedido
- [ ] **Citas de la Escala IPPU-TEA:** ¿las damos por buenas o las repasa un técnico?
- [ ] **Inclusión:** planilla del Drive pedida + lista de estados confirmada
- [ ] **Grupos:** responsables / técnicos autorizados → a **reconciliación**, no a confirmados · y qué es «tutor»
- [ ] **Ateneos:** sensibilidad del ateneo de grupo + año del correlativo
- [ ] **Confidencialidad:** quién redacta, quién firma, para cuándo
- [ ] **Pedido formal:** Anexo A del Manual · secciones faltantes · matriz de 14 roles · acceso a la HCE y su BD
- [ ] **§5.8:** ratificado o parado, con fecha y por escrito *(no se ratifica solo por haber tenido la reunión)*

> Al terminar: las respuestas se anotan en `docs/notas/respuestas-reunion-ippu-2026-08-21.md` **durante** la
> reunión. Después, los «sí» pasan a `docs/notas/puntos-a-validar.md` como **confirmados con fecha**, y los
> «no» abren entrada en `handoff.md` §5 **antes** de tocar una línea de código (§12.6).
