# Puntos a validar — IPPU y equipo

> **Estado: 2026-08-07.** Lista de lo que necesita definición externa antes de poder
> avanzar o antes de un uso clínico real. Se arma al cerrar **M11.1 + M11.2** (infra
> Postgres + esquema v2 + catálogos).
>
> Cada punto dice **qué bloquea**: si algo no bloquea nada hoy, se puede resolver sin apuro.
> Las decisiones ya tomadas están en `handoff.md` §5 y no se reabren acá.
>
> **Este documento es interno.** Lo que se le manda a IPPU es
> [`consulta-a-ippu.md`](consulta-a-ippu.md) — sin tecnicismos y en formato de preguntas que un
> funcionario puede responder. Si acá se agrega o cambia un punto que IPPU tiene que definir,
> actualizar también el otro.
>
> ⚠️ **No son «el mismo contenido».** Ese archivo es el **snapshot de lo que se envió el 19/08**, y el
> equipo le sacó tres preguntas al revisarlo (§5.34): las dos del **baremo** y la de las **citas de la
> escala**. Están acá, en §1.2 y §1.4, marcadas «nunca se preguntó». **Su numeración también difiere**
> de §2.7 y §3.2 en adelante: al citarlo, usar la numeración de ese archivo, que es la que IPPU tiene.
>
> ---
>
> ## 🗓️ Actualizado el 2026-08-26 con la **reunión con IPPU del 2026-08-21**
>
> | | |
> |---|---|
> | **Cerrados por la reunión** | **10 de los 14 puntos de IPPU**: §1.1 · §1.2 · §1.4 · §1.7 · §1.8 · §1.9 · §1.10 · §1.11 · §1.12 · §1.13 · §1.14 *(§1.3 ya estaba cerrado desde el 2026-08-14; **§1.12 lo cerró la reunión pero lo re-cerró §5.58 el 2026-09-02, en dirección opuesta** — acceso general, no «por grupo»)* |
> | **Siguen abiertos con IPPU** | **§1.5** (acceso a la HCE — ahora sabemos que está en **Heroku**) y **§1.6** (acuerdo de confidencialidad — **reencuadrado**: ya no bloquea el desarrollo, bloquea que el dato salga) |
> | **Abiertos NUEVOS, por la reunión** | **§2.11** usuarios y permisos · **§2.12** el modelo no representa la divulgación · **§2.13** revisión de informes · **§2.14** indicador de ateneos. Y **§2.8 pasó a BLOQUEANTE** |
> | **Deuda saldada** | **§2.1** — el costo medido del IDEA anual, que §5.31 dejó debiendo el 2026-08-20 |
> | **Decisiones nuevas** | `handoff.md` **§5.36–§5.49** (serie **I**) |
> | 🆕 **Abierto NUEVO, por M12.5** (2026-08-26) | **§1.15** — ¿el estado de inclusión es del **año lectivo** o es una **situación vigente**? Es la pregunta que §5.35 aisló a propósito y que **la reunión no contestó**: contestó la del IDEA, que es otra. El módulo está construido en la dirección reversible (§5.51) y **no bloquea**. Con esto los puntos de IPPU pasan a ser **15** |
>
> ⚠️ **Un punto de esta ronda es de segunda mano** —que el consentimiento no trabe el flujo (§5.38 /
> I3)— y está registrado como **CONFIRMABLE, no cerrado**. Va primero en el próximo contacto con IPPU.
>
> ## 🗓️ Actualizado el 2026-10-05 con las **respuestas escritas de IPPU** (A1–B12)
>
> `docs/notas/respuestas-ippu-2026-10-05.txt` · decisiones en `handoff.md` **§5.93–§5.106** · estado ítem
> por ítem en `preguntas-ippu.md`. **Qué cambió acá:** **§1.5** y **§1.6** respondidas (no hay acceso a la
> HCE; no hay acuerdo firmado) · **§1.9** ratificado · **§1.16** (B1) sigue abierto y re-preguntado, **ya
> no bloquea el 26/11** · **§1.17** (B9) respondido, diferido · **§2.8** (A5) sigue abierto · **§2.11**
> `tecnico_grupo` **CANCELADA** · **§2.12/§2.13/§2.17** (B11/B12/B7) respondidos con alcance acotado · **§3**
> dos supuestos cerrados. El punto de **segunda mano** del consentimiento (§5.38) quedó **CONFIRMADO por
> escrito** (A3, §5.94).
>
> ⚠️ **12 de los 26 bloques del registro de la reunión quedaron SIN respuesta.** La lista está en
> `respuestas-reunion-ippu-2026-08-21.md` §16 — es la agenda del próximo contacto.
>
> *(Sigue pendiente la **cabecera de estado completa** que pide `handoff.md` §6: esto es una nota de
> ronda, no esa cabecera.)*

---

## 1. Para IPPU (institución)

### 1.1 ~~Validar la demo v4.1~~ — **CERRADO** (reunión IPPU 2026-08-21)

> **Contestado en la reunión del 2026-08-21, y por el lado que hacía falta: el IDEA es ANUAL.**
> Se hace **una vez por año, siempre**, y el de cada año se compara con el del anterior. Coincide con lo
> que Fernando Sierra ya había respondido por escrito el 15/06 (P10/P12). **La «línea base única» del
> Documento Técnico no sobrevive.** → `handoff.md` **§5.36 (I1)**; costo medido en **§2.1** de este
> archivo.
>
> ⚠️ **Qué cerró exactamente, para que nadie lo lea de más.** Cerró **la pregunta que hacía a este punto
> «el más importante»**. **No** cerró todo lo que la demo pone sobre la mesa: siguen **sin confirmar** las
> **6 bandas del IDEA** (§5.13 / D4), los **7 estados de inclusión**, la **lista de talleres de este año**
> y si el **estado de inclusión se anualiza**. Están en
> `docs/notas/respuestas-reunion-ippu-2026-08-21.md` §16, en la lista de los 12 bloques sin respuesta.

**Qué es.** Que IPPU revise la demo y confirme que el modelo clínico refleja cómo trabajan.
En particular: **el IDEA pasó de evaluación anual a línea base única** (se aplica al ingreso y
se repite sólo si hay reingreso a más de 12 meses).

**Por qué importa.** Es el cambio más profundo de toda la ronda M0–M10 y viene del Documento
Técnico, no de una preferencia nuestra. Si en la práctica IPPU sigue aplicando el IDEA todos
los años, la tabla `idea` cambia de forma.

**Ya tenemos una fuente primaria, no sólo memoria institucional.** El cuestionario de relevamiento
que Fernando Sierra respondió el 15/06/2026 (`docs/markdown/Cuestionario IPPU UTEC, respuestas.md`,
P10 y P12) dice, en sus palabras: la frecuencia de evaluación con IDEA es **«Anual»**, y **«las
evaluaciones aparecen por año (individual). No hay un histórico consolidado.»** Es anterior al
Documento Técnico (jul-2026) que introdujo la línea base única, así que describe la práctica **con
el sistema viejo**, no una opinión sobre el rediseño — pero es la evidencia más concreta que existe
hoy de que el supuesto puede no sostenerse.

**Qué bloquea.** Formalmente es la puerta de entrada a M11. Se avanzó igual con M11.1 y M11.2
porque el riesgo está acotado a **una** de las 28 tablas y corregirla ahora es barato; después
de M11.3/M11.4 deja de serlo. **Conviene resolverlo antes de seguir con M11.3.**

### 1.2 ~~Cortes del baremo BUND (Decreto 72/025)~~ — **CERRADO** (reunión IPPU 2026-08-21)

> **Los cortes están bien como están cargados.** Confirmado por IPPU y por la documentación oficial de
> **BUND**: 0–4 sin discapacidad · 5–24 leve · 25–49 moderado · 50–95 severo · 96–100 muy severo.
> **Cero trabajo:** no se toca el catálogo `baremo`, y **el guard de abajo —«se ajustan los cortes, nunca
> las etiquetas»— nunca hay que ejercerlo.** → `handoff.md` **§5.48 (I13)**.
>
> ⚠️ **Se cerró sin haberse preguntado por escrito:** las dos preguntas del baremo se sacaron del
> cuestionario en la revisión del 19/08 (§5.34) y **la reunión fue su único canal**. Salió bien; el
> mecanismo que lo produjo sigue siendo el mismo.
>
> ⚠️ **Lo que la reunión NO contestó, y era la otra mitad de este punto:** si el **porcentaje lo fija el
> organismo oficial** y el sistema lo registra tal cual (era §2.8 del borrador). **Eso sigue siendo
> supuesto nuestro.** No bloquea: hoy `pct` es dato de entrada y el baremo sólo deriva de él, que es
> exactamente lo que el supuesto dice.

**Qué es.** Confirmar los porcentajes exactos de cada categoría contra el anexo del decreto.
Hoy están cargados como 0–4 «Sin discapacidad» · 5–24 «Leve» · 25–49 «Moderado» ·
50–95 «Severo» · 96–100 «Muy severo».

**Por qué importa.** De ese porcentaje sale la categoría que habilita prestaciones. Un corte
mal puesto cambia el resultado de una valoración real.

**Qué bloquea.** Nada técnico: la tabla es paramétrica y corregirlo es un UPDATE, sin migración.
**Sí bloquea el uso clínico real.**

> ⚠️ **Al reconciliar contra el anexo: se ajustan los CORTES, NUNCA las ETIQUETAS** (anotado en M12.4;
> el guard completo está en `backend/docs/esquema-datos-v2.md` §4). IPPU declara que **la nomenclatura
> oficial del instrumento puede diferir de la institucional**, y que en sus pantallas e informes se usa
> **siempre la institucional**: «severo / muy severo», nunca «grave» (§8.1). Si el anexo del decreto
> dijera «grave», alinear la columna `categoria` haría saltar en rojo el test de `VOCABULARIO_PROHIBIDO`
> — y **quien lo vea va a creer que el test está mal y el decreto tiene razón**, cuando es exactamente al
> revés. **Se tocan `pct_min` y `pct_max`; `categoria` no se toca.**
>
> Esto se escribe acá, y no sólo en el esquema, porque **acá es donde alguien va a leer la tarea el día
> que llegue el anexo.**

> ### ⚠️ Esto **nunca se le preguntó a IPPU** — se sacó en la revisión del equipo del 19/08
>
> El borrador de `consulta-a-ippu.md` tenía **dos** preguntas sobre esto (§2.7 y §2.8). **Ninguna de las
> dos entró en el documento que se envió**: el equipo las retiró al revisarlo. Verificado sobre el
> documento enviado — **0 ocurrencias** de «baremo», «BUND» y «72/025» (`handoff.md` §5.34).
>
> **Consecuencia:** esto **no** está «preguntado y esperando respuesta». Está **sin preguntar**, y hoy su
> único canal es la reunión. Se conserva acá la redacción original para que se pueda preguntar tal cual:
>
> **Era §2.7 — Los porcentajes de la valoración funcional (baremo)**
>
> > **Lo que asumimos**, según el Decreto 72/025:
> >
> > | Porcentaje | Categoría |
> > |---|---|
> > | 0 % a 4 % | Sin discapacidad |
> > | 5 % a 24 % | Leve |
> > | 25 % a 49 % | Moderado |
> > | 50 % a 95 % | Severo |
> > | 96 % a 100 % | Muy severo |
> >
> > **Por qué importa:** de ese porcentaje depende el acceso a prestaciones. Un corte mal puesto cambia
> > el resultado de una valoración real.
> >
> > **¿Están bien estos cortes? Si tienen el anexo del decreto a mano, nos sirve muchísimo.**
>
> **Era §2.8 — El porcentaje lo define el organismo oficial, no la institución**
>
> > **Lo que asumimos:** el porcentaje de discapacidad **viene del organismo que hace la valoración
> > oficial**. El sistema lo registra tal cual y de ahí saca la categoría, pero **no lo calcula ni lo
> > deduce** de las evaluaciones internas (ni del IDEA ni de la Escala IPPU-TEA).
> >
> > **¿Es correcto?**

### 1.3 ~~Catálogo real de talleres~~ — **CERRADO** (2026-08-14)
> **Lo resolvió la fuente, no una decisión nuestra:** el **Prototipo v4** trae el catálogo real
> (`CAT_TALLERES`, **14 talleres** con sus nombres oficiales). Cargados en **M12.3** (`handoff.md` §5.14 /
> D5), en **reemplazo** de los 8 que había — no coincide ninguno: los nuestros los inventó la demo.
>
> **El «8 vs 18» era falso.** Los 18 de `esquema-datos.md` (v1) no salían de ninguna fuente de IPPU; no
> hay nada que conciliar.
>
> **Lo que sí queda para IPPU, y no bloquea nada:** el catálogo es **dinámico y administrable por
> coordinación** (orden, a qué grupos se orienta cada taller, cuándo se retira). El repo siembra sólo los
> nombres; el resto se carga desde la app. Si IPPU confirma que la oferta 2026 difiere de la del
> prototipo, es un `UPDATE`, sin migración.

### 1.4 ~~Referencias documentales de los 24 ítems de la Escala IPPU-TEA~~ — **CERRADO** (reunión IPPU 2026-08-21)

> **IPPU las da por buenas.** Las 24 referencias quedan confirmadas. → `handoff.md` **§5.48 (I13)**.
>
> ⚠️ **No quedó registrado quién las revisó ni cuándo.** Lo que cierra el punto es la confirmación
> institucional, no la trazabilidad de la revisión: si el instrumento se presenta formalmente ante un
> tercero, es razonable que eso se vuelva a pedir. Igual que §1.2, **esta pregunta nunca se envió por
> escrito** (§5.34) y la reunión fue su único canal.

**Qué es.** Cada ítem trae una cita (DSM-5-TR, CIF, y papers como Wing & Gould 1979 o
Baron-Cohen 1985). **No están verificadas** contra las fuentes originales: se transcribieron
del prototipo tal cual.

**Por qué importa.** Si el instrumento se presenta como fundamentado, las referencias tienen
que ser correctas. Es la clase de detalle que se nota en una revisión externa.

**Qué bloquea.** Nada del desarrollo. Sí conviene resolverlo antes de publicar o presentar el
instrumento.

> ### ⚠️ Esto **nunca se le preguntó a IPPU** — se sacó en la revisión del equipo del 19/08
>
> Era **§3.2 de `consulta-a-ippu.md`, y estaba marcada ⚠️** como una de las cuatro que más destraban.
> **No entró en el documento enviado**: el equipo la retiró al revisarlo. Verificado — 0 ocurrencias de
> ninguna pregunta por citas bibliográficas (`handoff.md` §5.34).
>
> ⚠️ **Y hay algo peor, que IPPU tiene en la mano:** la intro del documento enviado **sigue nombrando
> «3.2 (las citas de la escala)»** entre las tres que más nos frenan — pero en ese documento §3.2 es
> *Acceso al sistema actual*. Si alguien de IPPU fue a buscarla, no la encontró. Se aclara de palabra en
> la reunión (agenda §1), no por escrito: corregir el documento enviado sería reescribir lo que se mandó.
>
> **Redacción original, para preguntarla tal cual:**
>
> > **Las citas bibliográficas de la Escala IPPU-TEA ⚠️**
> >
> > Cada uno de los 24 ítems de la escala tiene asociada una referencia (DSM-5-TR, clasificación CIF, y
> > autores como Wing & Gould, Baron-Cohen, Rivière). Las tomamos **tal cual estaban** en el prototipo
> > que nos pasaron.
> >
> > **No las verificamos contra las fuentes originales, y no deberíamos ser nosotros quienes lo hagan.**
> >
> > **¿Alguien del equipo las revisó en su momento? ¿Podemos darlas por buenas, o convendría que un
> > técnico las repase antes de que el instrumento se presente formalmente?**

### 1.5 Acceso a la HCE actual — 🔴 crítico

> **✅ RESPONDIDA el 2026-10-05 (A2, `handoff.md` §5.104): NO tienen acceso a la HCE ni a la demo actuales.**
> Sí tienen **un video** donde la recorren (youtube.com/watch?v=dMWfc0JKCC0) y la instrucción es
> **reconstruir el esquema de base de datos a partir del video**. Eso queda **después del 26/11**, y la
> **migración de datos queda fuera del 26/11**. Sin acceso al sistema, lo de abajo se entiende como
> «no hay acceso»: no se espera más.


> **Actualizado el 2026-08-26 con lo que aportó la reunión — sigue ABIERTO.**
> Lo único nuevo: **la HCE actual de IPPU está alojada en Heroku** (`handoff.md` **§5.44 / I9**). Es
> **dónde vive hoy**, dato de entrada para saber desde dónde se migra. ⚠️ **No es una decisión de
> despliegue**: §2.5 sigue abierto.
>
> **Y ahora este punto tiene más carga que antes:** IPPU confirmó que **se migran todos los expedientes**,
> activos y archivados (§1.8), y que el número de historia es **un entero desde 1000** (§1.7). Ya sabemos
> *qué* hay que traer; sigue faltando *desde dónde* y *con qué permiso*.

**Qué es.** Acceso al sistema de `fundacionippu.uy` y, sobre todo, **al esquema de su base de datos**.

**Por qué importa.** Sin esto no se puede diseñar la integración ni saber cómo migrar los
expedientes que ya existen (~40 activos y ~40 archivados). Estamos construyendo a ciegas
respecto del sistema con el que hay que convivir.

**Qué bloquea.** La **Fase 3** (conectar la demo a la API) se puede hacer sin esto, pero la
integración real con la HCE de IPPU no.

### 1.6 Acuerdo de confidencialidad — **SE ESTRECHA: la redacción existe, falta la FIRMA para UTEC-LIDIA** (2026-09-03)

> **✅ RESPONDIDA el 2026-10-05 (A1, `handoff.md` §5.104): NO EXISTE ningún acuerdo firmado** y IPPU pide
> dejar de preguntarlo («olvídate de esto»). **Rige, sin cambios, la regla de `CLAUDE.md` / §5.45: sólo
> datos simulados o anonimizados.** Deja de ser un trámite que perseguimos; vuelve a ser una condición:
> **si algún día hace falta un dato real, antes tiene que existir el acuerdo.**


> **ESTRECHADO el 2026-09-03 con el Protocolo de acceso ingresado — sigue ABIERTO.**
> El Protocolo `docs/markdown/protocolo-acceso-confidencialidad-resguardo-hce.md` trae en su **Anexo II un
> modelo de acuerdo de confidencialidad**, y su **§6.7** fija la regla: el trabajo con datos clínicos para
> el desarrollo de herramientas UTEC-LIDIA *«debe priorizar el uso de datos disociados o anonimizados;
> cuando ello no sea posible, el acceso a datos identificables requiere **acuerdo de confidencialidad
> previo** y justificación específica del caso de uso»*. **La redacción, entonces, ya no falta.** Lo que
> falta es el **acuerdo firmado para UTEC-LIDIA**.
>
> ⚠️ **La regla de `CLAUDE.md` no cambia** —hasta que haya firma, sólo datos simulados/anonimizados— y
> **ahora la respalda el propio protocolo de IPPU** (§6.7 + Anexo II), no sólo un pedido verbal del
> Director. Eso vale registrarlo. El trámite en sí **no avanzó**: quién firma de cada lado y para cuándo
> sigue sin respuesta (bloque 12 del acta).
>
> **Encuadre previo (reunión 2026-08-21, `handoff.md` §5.45 / I10) — vigente:** guardar el dato **no**
> requiere permiso; **compartirlo, sí**. Este punto dejó de bloquear el desarrollo y bloquea **que el dato
> salga del sistema** y cualquier prueba con datos reales (junto con §1.5).

**Qué es.** El documento legal que firmarían quienes accedan a datos sensibles. Lo planteó el
Director de IPPU; el **modelo** está en el Anexo II del Protocolo. Falta la instancia firmada para el
convenio UTEC-LIDIA.

**Qué bloquea.** El acceso del punto 1.5 y cualquier prueba con datos reales.

### 1.7 ~~Formato del número de historia anterior~~ — **CERRADO** (reunión IPPU 2026-08-21)

> **Es un entero desde 1000:** 1001, 1002, … → `handoff.md` **§5.43 (I8)**.
>
> Hoy la columna es `hc_historico varchar(30)` **nullable, sin CHECK, sin índice y sin validación de
> aplicación** — el único límite es el largo (relevamiento R0, BLOQUE 8). Con un entero desde 1000 **se
> puede validar**, y conviene decidirlo junto con §1.8 y con `OrigenMigracionMixin`. **No se cambió el
> tipo:** cerrar el punto es saber el formato, no implementarlo.

**Qué es.** El esquema guarda `hc_historico` para poder cruzar cada expediente con el archivo
de la HCE anterior. No sabemos qué formato tiene ese número.

**Por qué importa.** Si tiene estructura (prefijo, año, dígito verificador), conviene validarlo
al cargarlo en vez de aceptar cualquier texto.

**Qué bloquea.** Nada hoy — está como texto libre. Importa al migrar los expedientes existentes.

### 1.8 ~~Cómo llegan los datos históricos~~ — **CERRADO** (reunión IPPU 2026-08-21)

> **Migran todos: activos y archivados.** → `handoff.md` **§5.43 (I8)** · `consulta-a-ippu.md` §3.3.
>
> ⚠️ **Y eso destapa una pregunta clínica que la reunión NO contestó:** qué se hace con los puntajes
> aplicados con la «Guía del aplicador» que tenía el **corrimiento en las dimensiones 3, 4, 6 y 12**. Con
> «migran todos», **esos puntajes entran igual**, sin criterio decidido. Es decisión **de IPPU**, no
> nuestra, y va al próximo contacto (bloque 13.a de
> `docs/notas/respuestas-reunion-ippu-2026-08-21.md`).

**Qué es.** Los ~80 expedientes existentes: ¿se migran, se cargan a mano, se dejan sólo como
archivo consultable?

**Por qué importa.** Cambia bastante trabajo. El esquema ya prevé el archivo histórico de solo
lectura (§10), pero no una migración masiva.

**Qué bloquea.** Nada del desarrollo actual. Hay que decidirlo antes de un piloto.

### 1.9 ~~¿Los dos técnicos ya puntúan de forma independiente?~~ — **CERRADO** (reunión IPPU 2026-08-21)

> **✅ RATIFICADO por escrito el 2026-10-05 (B2a, `handoff.md` §5.98):** «Consenso del puntaje. Se
> requiere un campo en donde los técnicos registrarán un solo número». D7 sigue dormida, las tablas
> `puntuacion_*` **se quedan y la API no las expone**, y el kappa **sigue sin ser calculable**.


> **No: la puntuación es conjunta.** Los dos técnicos **acuerdan en persona** y registran **un solo
> número, un solo campo**. → `handoff.md` **§5.47 (I12)** · `consulta-a-ippu.md` §3.8.
>
> **D7 (§5.16) no queda equivocada: queda DORMIDA.** `puntuacion_idea` y `puntuacion_protocolo` se
> modelaron **nullable exactamente para este caso**; no se retira nada, y el guard de «diferencia ≥ 2
> exige documentación» que M11.3 tenía anotado **queda sin sujeto** mientras la práctica no cambie.
>
> ⚠️ **La consecuencia se dice, no se deja implícita:** el **kappa** que exige el **Manual §23** —al que
> el propio Manual llama el **único requisito metodológico invariante** del instrumento— **NO es
> calculable** con la práctica actual. Con un solo puntaje de consenso no hay dos series que comparar.
> **Eso se le dice a IPPU, con todas las letras: el modelo lo soporta y el dato no existe.** Qué hace IPPU
> con esa información frente a INAU es de IPPU; la obligación nuestra es no dejarlo implícito.

**Qué es.** El Manual de Procedimientos v1.0 establece que los dos técnicos puntúan **por separado** y
después consensúan, y llama a ese circuito *el único requisito metodológico invariante* del instrumento.
La pregunta es de hecho, no de norma: **¿así se trabaja hoy en IPPU, o es una práctica a introducir?**

**Por qué importa.** En **M12.2** se modeló toda la puntuación independiente (`puntuacion_idea`,
`puntuacion_protocolo`, evaluadores identificados, registro del consenso) para que el kappa de
confiabilidad interjueces que pide el Manual §23 sea calculable. **De la respuesta depende si eso sirve
desde el día uno o queda latente:** si hoy los técnicos consensúan de entrada y anotan un solo valor, las
columnas van a quedar en NULL hasta que cambie la práctica — que es exactamente por qué se modelaron
nullable.

**Ojo con el contexto:** ⚠️ **es agregado nuestro, no algo que IPPU haya pedido.** Su propio Prototipo v4
guarda un único array de consenso y **no** tiene puntuación por evaluador; declara kappa como requisito y
no lo implementa. La decisión de modelarlo es D7 (`handoff.md` §5.16), tomada porque agregarlo después de
M11.3 cuesta migración más reescritura de servicios. Conviene presentarlo así en la reunión.

**Qué bloquea.** Nada técnico: está modelado y es opcional. Bloquea saber si hay que acompañar el cambio
con formación/instructivo, y cuándo tiene sentido empezar a calcular kappa.

### 1.10 ~~¿La severidad DSM-5-TR se re-evalúa en una instancia fija?~~ — **CERRADO** (reunión IPPU 2026-08-21)

> **No hay cadencia fija: se corrige cuando el equipo lo ve necesario.** **Confirma M12.4 tal cual está
> implementado** — `severidad_dsm` **0..1 por expediente**, revisable, con los dos dominios separados.
> **Cero trabajo:** no hay que versionar por año. → `handoff.md` **§5.48 (I13)** · `consulta-a-ippu.md`
> §3.10.
>
> **Aporte extra de la reunión:** **DSM-5** y **CIF** son documentos de **referencia** para tener
> vocabulario común; conviene dejarlos accesibles desde la aplicación.

**Qué es.** ¿La severidad se vuelve a mirar **en una instancia institucional fija** —al cierre anual,
junto con el IDEA— o **se ajusta cuando el equipo lo ve necesario**?

**Por qué importa.** Define la forma final de `severidad_dsm`. Hoy es **0..1 por expediente** (un registro
que se edita), que es lo correcto si la respuesta es «se corrige cuando cambia». Si hay **cadencia
institucional**, debería ser **1:N con `anio`**, como `protocolo` e `informe_cierre` — y entonces cada
re-evaluación queda como fila propia y comparable, en vez de como una edición.

**Qué bloquea.** **Nada:** 0..1 se eligió justamente por ser **la dirección reversible** (pasar a 1:N es
agregar un `id` y soltar la PK, sin perder filas; el camino inverso obliga a descartar). Pero conviene
preguntarlo antes de M11.3, porque el guard de auditoría que hoy compensa el 0..1 deja de ser suficiente
si lo que quieren es una serie temporal comparable.

### 1.11 ~~¿Cómo se llama oficialmente el PAI?~~ — **CERRADO** (reunión IPPU 2026-08-21)

> **«Proyecto de Atención Integral»** — el nombre de **INAU**, no «Propuesta de Atención Individual» del
> prototipo. **Va impreso en lo que se le entrega a INAU.** → `handoff.md` **§5.42 (I7)** ·
> `consulta-a-ippu.md` §3.11.
>
> **Dos cosas más que vinieron en la misma respuesta, y que sí cambian M12.6:**
> - **Se retira la sección VII** («Análisis estratégico de la situación actual»), a pedido de IPPU.
> - **Puede haber más de un PAI por año** → confirma la **consecuencia 1 de §5.22**: `pai` **no** lleva
>   `UNIQUE(hce_id, anio)`. Y que sea **herramienta de trabajo de uso frecuente** confirma la lectura de
>   **documento dinámico** de §5.22, que se apoyaba en investigación sobre normativa INAU y **no** en
>   material de IPPU.

**Qué es.** El Prototipo v4 lo llama «**Propuesta** de Atención **Individual**»; la normativa INAU aparece
como «**Proyecto** de Atención **Integral**». Los campos confirman que es el mismo instrumento.

**Por qué importa.** **El nombre va impreso en lo que se le entrega a INAU.** No es una cuestión de
etiqueta interna.

**Qué bloquea.** Nada de modelo (la tabla se llama `pai` en cualquier caso), pero conviene tenerlo antes
de generar el PDF en M11.4.

### 1.12 ~~Los ateneos de grupo, ¿son dato sensible?~~ — **CERRADO** (reunión IPPU 2026-08-21)

> **CERRADO en dirección PERMISIVA (2026-09-02).** El **ateneo de grupo es de acceso general del equipo
> técnico**: el apunte crudo de la reunión —«todos los técnicos ven todos los ateneos»— era el correcto.
> Se cerró primero en dirección restrictiva el 2026-08-26 («cada técnico ve los de su propio grupo») y se
> revirtió el 2026-09-02 por una corrección de IPPU. → `handoff.md` **§5.58 (L5)** (⚠️ CONFIRMABLE, no
> está en el acta), que revierte **sólo** el párrafo de visibilidad de **§5.46 (I11)**; `consulta-a-ippu.md`
> §3.12.
>
> **Lo implementado ya lo expresa.** `Ateneo.sensible = (tipo == 'clinico')` (`app/models/ateneo.py:310-341`):
> un ateneo de grupo da `sensible = False` = acceso general, que es exactamente lo que ahora rige. Sin
> cambio de modelo, esquema, migración ni tests. La segmentación fina de permisos —qué HCE abre cada
> técnico— sigue siendo **matriz de permisos → Fase 4**, y su tensión con este acceso general está en
> **§2.16**.

**Qué es.** El aviso de confidencialidad del Prototipo v4 dice que los **ateneos clínicos referidos a un
NNA** contienen datos sensibles de salud (Ley 18.331) y heredan la matriz de acceso de su HCE, y que los
**institucionales y las jornadas** son de acceso general del equipo técnico. **No dice nada del ateneo de
grupo**, que es el cuarto tipo.

**Por qué importa.** No es un hueco teórico: el propio seed del prototipo trae uno —«Cierre de ciclo —
Grupo Celeste»— que discute los Δ de protocolos de un grupo de NNA identificables. Bajo la regla tal como
está escrita, eso queda **no sensible** y de acceso general.

**Qué implementamos mientras tanto.** Lo que dice la fuente: `sensible = (tipo == 'Ateneo clínico
(NNA)')`. **Como el campo es derivado y no una columna, cambiar el criterio cuesta una línea y ninguna
migración** — por eso no bloquea.

**Qué bloquea.** Nada del modelo. Sí condiciona la matriz de permisos de **Fase 4**.

### 1.13 ~~El código de los ateneos: ¿un prefijo o dos?~~ — **CERRADO** (reunión IPPU 2026-08-21)

> **Alcanza con un solo prefijo**, y un `JC-` propio para las jornadas es **aceptable si es barato** — y
> lo es: `codigo` es **derivado** (`app/models/ateneo.py:284-308`), **una línea y ninguna migración**. Lo
> elegido en M12.7 (`AT-` para los cuatro) **queda validado**; si se quiere el `JC-`, se hace cuando toque
> y sin costo de esquema. → `handoff.md` **§5.46 (I11)**.

**Qué es.** El prototipo se contradice: el seed muestra `JC-2026-001` para la jornada de capacitación,
pero la función que crea registros (`atNuevo()`) genera siempre `AT-`, y su contador cuenta las dos
formas en **una sola serie por año**.

**Qué elegimos y por qué.** `AT-` para los cuatro tipos, leyendo «AT» como el módulo («Ateneos y
Capacitación») y no como el tipo. Motivo concreto: el tipo se puede corregir después de crear el
registro, y con prefijo por tipo **corregir un tipo mal cargado cambiaría el identificador de un
registro ya circulado**.

**Qué bloquea.** Nada: el código se **deriva**, no se guarda. Si IPPU prefiere `JC-` para las jornadas,
es una línea de código y cero migración.

### 1.14 ~~El número de ateneo, ¿es del año en que se hizo o del año en que se cargó?~~ — **CERRADO** (reunión IPPU 2026-08-21)

> **Del año en que se REGISTRÓ** — exactamente lo implementado (`anio_correlativo`; el correlativo se
> congela al crear). **Cero trabajo.** El efecto visible que preguntábamos —un ateneo de diciembre de 2026
> cargado en enero queda `AT-2027-001`— **a IPPU le sirve así**. → `handoff.md` **§5.46 (I11)** ·
> `consulta-a-ippu.md` §3.13.

**Qué es.** En el prototipo el número sale del **año de creación del registro**, pero el filtro de la
lista busca por el **año de la fecha del ateneo**. Son dos cosas distintas y en el prototipo conviven sin
que nadie lo note.

**Qué elegimos.** El número se congela al crear (es un correlativo **de registración**, como el de un
libro de actas) y el filtro va contra la fecha del hecho. **Consecuencia visible:** un ateneo del
20-dic-2026 cargado en enero queda como `AT-2027-001` y aparece bajo el filtro «2026».

**Qué preguntar.** Si eso les resulta raro en la práctica, o si prefieren que el número siga al año del
hecho — que obliga a renumerar cuando alguien corrige la fecha.

### 1.15 `inclusion_bitacora`, ¿alcanza para reconstruir el estado y calcular el tablero del área? — **REFORMULADO** (2026-09-03, `handoff.md` §5.73)

> **REFORMULADO el 2026-09-03.** La pregunta ya no es «¿se anualiza `inclusion`?». **No se anualiza:**
> nada en las fuentes lo dice, y el tablero de Inclusión del Prototipo v4 calcula sus indicadores **desde
> fechas y desde la bitácora**, no desde una foto anual. `anio` **NO entra en M12.8a**; §5.51 (dirección
> reversible) sigue en pie. → `handoff.md` **§5.73**.
>
> **La pregunta ahora:** ¿la `inclusion_bitacora` registra lo suficiente para (a) reconstruir el estado a
> una fecha arbitraria y (b) calcular los siete indicadores del tablero para un período?

**Respuesta, medida contra el código** (`app/models/inclusion.py`):

- **`inclusion_bitacora` es serie de *gestiones*, no de *transiciones de estado*.** Columnas: `fecha`
  (NOT NULL), `interlocutor` (NOT NULL), `rol`, `medio`, `tema` (NOT NULL), `contenido` (NOT NULL),
  `acuerdos`, `autor_id`, `registrado_en`.
- **Las transiciones de estado NO se registran.** `inclusion.estado` y `fecha_estado` son columnas únicas
  mutables (`fecha_estado` «se reescribe en cada cambio»). Lo mismo `centro`, `tipo_centro`, `dias_horas`,
  `modalidad`. **No hay historial de estado**, y `auditoria` es aspiración (no hay `app/services/`).

| Indicador | ¿Para un período? | ¿Reconstruir a una fecha pasada? |
|---|---|---|
| Tasa de escolarización | foto actual (desde `estado`) | **No** — `estado` se pisa |
| Distribución por tipo de centro | foto actual | **No** — `tipo_centro` se pisa |
| Promedio de horas | **No** — `dias_horas` es texto libre | **No** |
| Casos en espera + tiempo de ingreso | «en espera» actual | **No** — falta *cuándo entró/salió* de «en espera» |
| Alerta >60 días sin gestión | **Sí** — `max(bitacora.fecha)` por ficha (índice ya existe) | n/a |
| Articulaciones por caso | **Sí** — `count(bitacora)` | n/a |
| Articulaciones por período | **Sí** — `count(...) WHERE fecha BETWEEN` | n/a |

**Qué falta, como trabajo de M11.3/M11.4:**
- Un **historial de estado fechado** (`inclusion_estado_historial`, o `auditoria` real y consultable para
  `campo='estado'`) → escolarización histórica + tiempo de ingreso.
- Lo mismo para `centro`/`tipo_centro` si se quiere la distribución **a lo largo del tiempo**.
- Un **campo de horas estructurado** (o aceptar que «promedio de horas» no es calculable).

**Qué se le sigue preguntando a IPPU** (ya no bloquea nada de M12.8a): *cuando un chico cambia de estado
o de escuela, ¿necesitan poder mirar después «cómo estaba en 2025» como una foto de ese año, o alcanza con
ver cómo está hoy + leer la bitácora?* Si la respuesta es «necesitamos la foto», eso confirma que hace
falta el historial de estado de arriba (que igual conviene para el tablero).

**Qué bloquea.** **Nada hoy.** `anio` salió de la lista de candidatos a M12.8a.

---

### 1.16 ¿De qué son las secciones **§4 y §8** del Manual de Procedimientos? — abierto por M12.6 (2026-09-02)

> **⚠️ SIGUE ABIERTO — RE-PREGUNTADO el 2026-10-05 (B1, `handoff.md` §5.105).** IPPU contestó «No entendí
> exactamente qué querés, especifícamelo mejor». La pregunta se reformuló (borrador en `preguntas-ippu.md`
> B1). **Ya NO bloquea el 26/11:** los totales del IDEA son las sumas definidas (12 dimensiones → 0–96 y
> 4 escalas; 24 ítems → 24–120) y el Δ va dentro del mismo instrumento. Si el Anexo A o §8 dicen otra
> cosa, se revisa cuando lleguen.


**Qué es.** El Manual de Procedimientos v1.0 tiene **25 secciones en seis Partes**, y **no está en el
repo**: nunca se entregó. Lo que sí tenemos es la **versión de consulta que el Prototipo v4 embebe**
(`const MANUAL`, `HCE_IPPU_Prototipo_v4.html:1730`), con 12 entradas agrupadas que cubren **23 de las 25**.
Faltan exactamente dos, **§4 y §8**, y no hay una sola mención textual a ninguna de las dos en todo el
archivo — ni `id:'m4'` ni `id:'m8'`.

**Qué sabemos igual, por la estructura.** La numeración no tiene huecos, así que cada sección faltante cae
dentro de una Parte conocida:

| Parte | Secciones | Qué falta |
|---|---|---|
| I — Marco general | §1 propósito · §2 glosario · §3 secuencia longitudinal · **§4** | **§4** |
| II — IDEA | §5 qué es · §6–7 aplicación y puntuación · **§8** · §9 interpretación del perfil | **§8** |
| III — Escala IPPU-TEA | §10–15 | — |
| IV — Informe de Cierre | §16–18 | — |
| V — HCE | §19–22 | — |
| VI — Calidad | §23–25 | — |

⚠️ **Ninguna de las dos es del PAI, y eso no es una conjetura: el Manual no tiene una Parte del PAI.** Las
seis Partes son marco general, IDEA, Escala IPPU-TEA, Informe de Cierre, HCE y Calidad. Por eso M12.6 pudo
construirse igual (`handoff.md` §5.54): la fuente normativa del PAI es el **Prototipo v4** y el `.md` de
especificaciones, no el Manual.

**Nuestra mejor inferencia, para que la pregunta sea corta:**
- **§4** cierra el **Marco general**. **No es el consentimiento** (eso es **§19.1 + Anexo C**, citado en
  `:731` y `:1229`) ni los **permisos** (**§21.1**). Queda el marco institucional: **roles y habilitación
  del personal técnico**, y/o **los grupos de referencia** — §1 los nombra («todo el personal técnico
  habilitado», «todos los grupos de referencia activos») sin que ninguna sección visible los defina.
- **§8** es un paso **interno del IDEA**, entre *puntuar* (§6–7) e *interpretar el perfil* (§9): lo más
  probable es **el cálculo de totales por escala / el perfil por dimensiones**. Lo refuerza que el
  **Anexo A** —«cálculo automático de totales y deltas con verificación visible antes de firmar»— encaje
  exactamente en esa ranura.

**Qué preguntar, en criollo.** *Del Manual de Procedimientos nos falta ver dos partes: la §4, que cierra
el marco general, y la §8, que está entre la puntuación del IDEA y la interpretación del perfil.
¿Nos pasan esas dos, y el Anexo A?*

**Qué bloquea.** **El esquema, nada** — M12.6 se construyó sin ellas. **§8 y el Anexo A sí importan para
M11.3**, que es donde se implementa el cálculo de totales y la verificación previa a la firma. Si al
identificarlas resultan tocar el PAI, se revisa lo construido (§5.54 lo dejó dicho).

---

### 1.17 Adolescentes con autonomía progresiva: ¿reserva de datos frente a padres/tutores? — abierto por el Protocolo (2026-09-03)

> **✅ RESPONDIDA el 2026-10-05 (B9, `handoff.md` §5.104), y se DIFIERE.** IPPU: «es un derecho de la
> persona según la Ley 18.331. No pensamos modelarlo ahora. Se deja para después». **Sale de M11.3** y de
> la lista de lo que condiciona al 26/11; la reserva por entrada contra el representante legal queda
> para una ronda posterior.


**Qué es.** El **Protocolo de acceso**, en la matriz §5, da a los **adolescentes con autonomía
progresiva** el *«Derecho a solicitar reserva de determinados datos incluso respecto de sus
padres/tutores, a criterio fundado del profesional tratante»* (base: Decreto 274/010, reglamentario de la
Ley 18.335; Ley 17.823). Es un derecho **por entrada**, no por expediente: se reserva *un dato concreto*,
no toda la HCE, y frente a un actor específico (el representante legal).

**Por qué importa.** **Nada en el modelo expresa una reserva por entrada contra los representantes.**
Hoy la única clasificación de acceso restringido es `inclusion_bitacora.sensible` (derivada del tema) y
`ateneo.sensible` (derivada del tipo), las dos **de dos valores y sin destinatario**: dicen «esto es
sensible», no «esto se reserva **frente a estos**». Un flag «reservado frente a representantes», con
`profesional_id` y justificación, es otra cosa.

**Qué preguntar, en criollo.** *Cuando un adolescente pide que algo puntual de su historia no lo vean sus
padres o tutores, ¿cómo lo manejan hoy? ¿Lo decide el técnico tratante y queda anotado en algún lado, o
es una conversación que no se registra?*

**Qué bloquea.** **Nada hoy** — no hay acceso de familias al sistema. Condiciona **M11.3** (el modelo de
la reserva por entrada) y **Fase 4** (que el acceso del representante la respete). Va en la lista de IPPU.

---

## 2. Para el equipo (grupo + Matías)

### 2.1 ~~Ratificar que M11 avanzó sin cruzar su propia puerta~~ — **CERRADO** (2026-09-03, `handoff.md` §5.60 / L7)

> **D-1 de la hoja de L6.** El equipo **ratifica** §5.8: haber arrancado M11.1 + M11.2 sin la validación
> de la demo con IPPU. La pregunta de contenido que había detrás —¿el IDEA es anual?— la contestó IPPU
> (§5.36 / I1) y §5.31 midió que el cambio es aditivo, así que la decisión de criterio quedó confirmada
> por los hechos. ⚠️ **Ratifica ese arranque puntual, no una licencia para saltarse puertas:** la próxima
> —«qué IDEA rige a la fecha»— sigue en pie y es de **M11.3** (§5.35, §5.36).

**Qué es.** El documento de esquema v2 (§6) dice que validar la demo con IPPU es «la puerta
formal de M11». Esa validación no ocurrió, y M11.1 + M11.2 se hicieron igual.

**Por qué importa.** Fue una decisión de criterio, no un descuido: el riesgo está acotado a la
tabla `idea` (punto 1.1) y frenar todo por eso dejaba la ronda parada por tiempo indefinido.
Pero es una decisión que corresponde al equipo, no a quien la tomó solo.

**Qué se pide.** Ratificarlo o pararlo. Si se ratifica, va a `handoff.md` §5 con fecha y autor.


> ### 💵 Deuda de §5.31 pagada — el costo medido del IDEA anual (2026-08-26)
>
> §5.31 (2026-08-20) dejó **declarado por escrito** que este número tenía que estar acá y no estaba,
> porque el archivo estaba congelado por F1. **Ahora está**, y además **ya no es hipotético**: la reunión
> del 21/08 confirmó que **el IDEA es anual** (§1.1, `handoff.md` §5.36).
>
> **Medido dos veces contra el código —§5.31 el 20/08 y el relevamiento R0 el 26/08— y da lo mismo: el
> cambio es puramente ADITIVO.**
>
> | Qué | Medido |
> |---|---|
> | `UNIQUE` sobre `idea.hce_id` que cambiar | **ninguno** — `ix_idea_hce_id … unique=False` (migración `9246e659d2c9:392`). **`idea` ya es 1:N** |
> | Tablas afectadas | **1 de 38** |
> | FKs entrantes a reconectar | **ninguna** — la única es `puntuacion_idea.idea_id` (CASCADE), y es **por instancia** |
> | Tests que construyen `Idea(` | **9** en 3 archivos. Con `anio` **nullable** no rompe **ninguno**; con `NOT NULL`, un kwarg en esos 9 |
> | Qué se agrega | `anio` + `UniqueConstraint("hce_id","anio")` — **patrón que el esquema ya usa 3 veces** |
> | Migración | se regenera el archivo único, como en cada sub-módulo (§5.19) |
> | **La demo** | ⚠️ **la parte cara**: `nna.flujo.lb` es un **objeto único**, ~**18 usos en 6 módulos** → hay que construir un **selector de año** |
>
> **Y la puerta ya se movió por escrito:** §5.35 la puso **antes de M11.3**, no antes de M12.5 — porque
> mientras el cambio sea aditivo, construir M12.5 encima **no lo encarece**. Deja de ser aditivo en M11.3,
> donde «cuál IDEA rige» pasa de docstring a código con guards y tests.
>
> ⚠️ **Qué queda de este §2.1 después de todo esto.** La pregunta de contenido **la contestó IPPU**. Lo que
> el equipo todavía **no ratificó por escrito** es la **decisión de procedimiento**: haber arrancado M11
> sin cruzar su propia puerta. Eso se ratifica o se para **acá**, no en la reunión (§5.35).

### 2.2 ~~Qué se hace con la rama `feature/base-datos-hce`~~ — **CERRADO** (2026-09-03, `handoff.md` §5.68 / L15)

> **D-9 de la hoja de L6.** Decisión: **archivar como tag anotado `archivo/base-datos-hce`** (sobre
> `dfb1732`, en los dos remotos) y **borrar la rama** de `gitlab`. Ejecutado en L7 — la rama existía sólo
> en `gitlab`, estaba 2 commits adelante y 104 detrás de `main`, ningún archivo de `docs/` cita su SQL, y
> contradecía §5.2.2. El contenido queda accesible por el tag; `handoff.md` §12.5 reapunta ahí.
> ⚠️ **Se cierra antes de lo que este punto pedía** («al terminar M11»): por decisión explícita — la rama
> divergía más cada semana y el tag preserva todo.

**Qué es.** La rama de Victor (PostgreSQL + triggers PL/pgSQL, 1.605 líneas, probada
end-to-end) quedó aparcada porque contradice la decisión §5.2.2 de poner la lógica en el
servidor. Su SQL se está usando como material de consulta.

**Por qué importaba.** Es trabajo real que no se puede dejar en el limbo indefinidamente.

### 2.3 ~~Nomenclatura de «fases»~~ — **CERRADO** (2026-09-03, `handoff.md` §5.75)

> **Ratificada la redacción tal cual la propuesta borrador de abajo** (`handoff.md` §5.75, que ratifica
> §5.64 / L11 — el que decidió «fijar uno» y dejó la redacción pendiente). Un término por sentido:
> **etapa** (backend 0–6) · **etapa del convenio** · **línea** (L1–L4; la *numeración* es §2.4) · **ronda**
> (M0–M12) · **fase** — reservada **sólo** para el vocabulario del Documento Técnico (Fase 1/2 · A–D ·
> «fase piloto»), que no reescribimos.
>
> ⚠️ **El pase mecánico de corrección** —renombrar las apariciones en los documentos vivos, con su conteo
> por archivo— **NO se hizo en esta sesión**: es un bullet aparte en `handoff.md` §6, junto con el de §2.4.

**Qué era.** Hoy conviven **cinco** usos distintos de la palabra (L6 los midió: ~98 apariciones en 17
archivos): (1) fases del backend 0–6, (2) fases del convenio, (3) líneas L1–L4, (4) módulos M0–M11/M12,
(5) las fases del Documento Técnico (Fase 1/2 · A/B/C/D · «fase piloto»).

**Por qué importaba.** Ya generó confusión al leer los documentos entre integrantes.

**Redacción ratificada — un término por sentido:**

| Sentido | Término | Qué documentos quedan por corregir (pase mecánico, §6) |
|---|---|---|
| (1) backend 0–6 (infra → routers → Docker completo) | **etapa** (del backend) | `PLAN-M12`, `backend/docs/esquema-datos-v2.md`, `backend/README.md`, cabecera de `handoff.md` |
| (2) etapas del convenio IPPU×UTEC | **etapa del convenio** | `README.md`, material de presentación, `handoff.md` §resumen |
| (3) L1–L4 | **línea** (sin cambio de término) | ninguno por el término; la *numeración* es **§2.4** |
| (4) M0–M12 (rondas de trabajo) | **ronda** (ya es el uso mayoritario) | `handoff.md`, los `PLAN-M*` |
| (5) Documento Técnico (Fase 1/2 · A–D · «fase piloto») | **fase** — reservada **sólo** para esto | ninguno (se deja como está) |

### 2.4 ~~Numeración de las líneas de trabajo~~ — **CERRADO** (2026-09-03, `handoff.md` §5.76)

> **L1 = HCE + IDEA + analítica es la numeración oficial**, consistente en todo el material técnico
> (presentación 13.05.2026, demo, Documento Técnico; lo ratifica §5.1.1 y `handoff.md` §7). → `handoff.md`
> **§5.76**.
>
> ⚠️ **Documentos que divergen** —el `docs/markdown/Documento de trabajo.md` y el cuestionario Q47— **no se
> reescriben** (son material de fuente): se anota la divergencia y el repo cita siempre la numeración
> oficial. Va al mismo pase mecánico que §2.3, bullet en `handoff.md` §6.

**Qué era.** La presentación y la demo usan L1 = HCE. El *Documento de trabajo* y el
cuestionario Q47 usan numeraciones distintas.

**Por qué importaba.** Al citar «Línea 2» entre nosotros o con IPPU, no siempre hablamos de lo
mismo.

### 2.5 Despliegue de producción
**Qué es.** Dónde y cómo corre esto cuando salga de nuestras máquinas. La arquitectura
objetivo dice «Docker + NGINX», pero la HCE de IPPU está **alojada externamente** y no sabemos
qué permite ese hosting.

**Por qué importa.** Si es hosting compartido, Docker no es opción y hay que pensar otra cosa.

**Qué bloquea.** Nada ahora — Docker se usa **sólo para desarrollo** y el código no depende de
él (habla con la base por un `DATABASE_URL`). Se decide en Fase 6, con la respuesta al punto 1.5.

### 2.6 ~~La tabla `grupo` no soporta más de un año~~ — **CERRADO** (2026-08-14)
> **Decidido y confirmado por el equipo el 2026-08-14** (`handoff.md` §5.18 / D9): opción **(b)**, id
> propio + **`UNIQUE(nombre, anio)`**, y el nombre pasa a ser el **color** (Azul · Celeste · Naranja ·
> Verde), que es el dominio real de IPPU según el Prototipo v4. Granularidad **anual**, no por fecha: es
> la que ya usan `protocolo` e `informe_cierre`. Implementado en **M12.1**.
>
> **Queda abierto un residuo, más chico:** con granularidad anual, un cambio de técnico a mitad de año
> sobrescribe la fila y sólo deja rastro en la auditoría. Se acepta; depende de las respuestas de IPPU a
> §3.6 y §3.7 de `consulta-a-ippu.md` (eran §3.7/§3.8 antes de la revisión del 19/08 — §5.34). Si pasa
> seguido, hay que modelar vigencias por técnico.

**Qué era.** `esquema-datos-v2.md` §2.1 definía `grupo` con clave primaria `id (A..E)` y además una
columna `anio`. Como la clave era sólo la letra, **el grupo A podía existir para un solo año en toda
la historia**.

**Por qué importa.** En 2027, crear el grupo A obliga a sobrescribir la fila de 2026 — se pierde el
registro de quiénes fueron sus técnicos ese año, y los expedientes viejos (`hce_diurna.grupo_id`)
pasan a apuntar silenciosamente al grupo del año nuevo. Contradice cómo el propio documento maneja
los ciclos anuales en `protocolo` e `informe_cierre`, que usan `(hce_id, …, anio)` justamente para
esto.

**Qué se pide.** Decidir entre: (a) clave primaria compuesta `(id, anio)`, (b) id propio con
`UNIQUE(letra, anio)`, o (c) dejarlo así porque los grupos no se reconfiguran año a año — que es
posible, y en ese caso sobra la columna `anio`. **No se cambió por cuenta propia** porque modifica el
documento de esquema. Detectado revisando M11.2; no bloquea M11.3.

### 2.7 ~~Quién sigue con M11.3~~ — **CERRADO** (2026-09-03, `handoff.md` §5.67 / L14)

> **D-8 de la hoja de L6.** **Lo toma Lucas.** ⚠️ **Ítem aparte, no es decisión:** el estado real de
> M11.3 no se ha medido — la primera tarea es un **reconocimiento estilo R0 contra el código** (qué
> existe, qué asumió la puerta de §5.8, y qué cambiaron por debajo la serie L y §5.59 / D-11). Anotado en
> `handoff.md` §6.

**Qué era.** M11.3 son los servicios con las reglas duras: secuencia del flujo, firma = bloqueo,
Δ sólo dentro del mismo instrumento (reformulado por §5.36), categoría del baremo sólo desde el
porcentaje oficial.

### 2.8 No hay forma de «abrir un año nuevo» de grupos — ⚠️ **AHORA BLOQUEA** (2026-08-26)

> **⚠️ A5 (2026-10-05, `handoff.md` §5.104) — respuesta AMBIGUA, sigue abierta.** IPPU dijo que Taller
> Terapéutico y Clínica son otros servicios, fuera de Atención Diurna, y que «no son nombres de grupos»;
> **no dijo** si «Taller de Adolescentes» es uno de ellos. Se re-pregunta (`preguntas-ippu.md` A5) y
> **los cinco grupos sembrados (§5.61) se quedan** hasta que conteste. Además, §5.92 ya sacó del 26/11
> la creación de grupos desde la aplicación.


> ### ⚠️ Dejó de ser un hueco anotado: es un hueco bloqueante (reunión IPPU 2026-08-21)
>
> **Dos cosas de la reunión lo cambian de categoría:**
> 1. **ADMIN crea los grupos cuando hace falta** (`handoff.md` **§5.37 / I2** y **§5.41 / I6**). No es una
>    tarea de marzo de 2027: es **una operación normal del sistema** que hoy no existe.
> 2. **Los cuatro nombres por color están mal** — los grupos reales son **Inicial · Escolares ·
>    Preadolescentes · Adolescentes · Taller de Adolescentes** (§5.37).
>
> ⚠️ **D-2 de la hoja de L6 (2026-09-03, `handoff.md` §5.61 / L8) separa las dos cosas:**
> - **Los nombres** ya están **ratificados** y su renombrado (4 → 5 filas, `UPDATE` + regenerar catálogos
>   + el test + los literales de fixture + la demo) se ejecuta en **M12.8a**. **«Taller de Adolescentes»**
>   se toma como fila de `grupo`; si IPPU quiere decir otra cosa con él, vuelve.
> - **Lo que este punto pide y NO se cierra** es la **creación** de grupos desde la aplicación: que ADMIN
>   pueda abrir el año nuevo con sus técnicos. Eso es **M11.3/M11.4** y **sigue abierto**.
>
> **Qué bloquea, con nombre:** que IPPU pueda usar el sistema con **sus** grupos año a año. Hoy el único
> camino es un `INSERT` a mano o regenerar el seed — R0 verificó que **no existe endpoint, servicio,
> script ni pantalla que cree un grupo** (`app/routers/__init__.py` = 0 bytes, `app/services/` no existe),
> y que el seed es *insert-only* sobre `grupo` con un test que lo fija.
>
> **Va junto con §2.11** (usuarios y asignación técnico↔grupo): es la misma pantalla.

**Qué es.** D9 (§5.18) resolvió que `grupo` tenga id propio y `UNIQUE(nombre, anio)`, justamente para que
«Azul 2026» y «Azul 2027» sean dos filas distintas. Pero **nadie puede crear la de 2027**: el seed de
catálogos es *insert-only* sobre `grupo` (coordinación es dueña de la fila entera y el seed no la pisa —
correcto, y hay test que lo fija) y **todavía no existe endpoint ni pantalla que cree grupos**.

**Por qué importa.** En marzo de 2027 alguien tiene que poder abrir los cuatro grupos del año con sus
técnicos. Hoy la única vía es un `INSERT` a mano contra la base. La mitad del valor de D9 —preservar
quién estuvo a cargo cada año— depende de que crear el año siguiente sea una operación normal y no una
intervención de DBA.

**Qué se pide.** Que **M11.3/M11.4** incluyan el alta de grupo (crear el año, asignar técnicos) y su
registro en HCE-LOG con `hce_id NULL`, como el resto de los eventos institucionales. Conviene resolverlo
junto con la pregunta abierta de §5.18: qué pasa cuando un técnico cambia a mitad de año.

**Qué bloquea.** **Nada hoy** — los grupos de 2026 están sembrados y el año no cambia hasta marzo.
Se anota ahora para que no se descubra el día que haga falta.

### 2.9 El catálogo de talleres quedó sin forma de administrarse — hueco que dejó M12.3
**Qué es.** D5 (§5.14) decidió que el catálogo de talleres es **dinámico y lo administra coordinación**:
agregar, reordenar, orientar a grupos y retirar. M12.3 cargó **los 14 nombres reales** con
`grupos_orientados` vacío y `retirado_en` en `None` —el repo carga nombres, no gestión— pero **no hay
endpoint ni pantalla** para nada de eso. El prototipo sí los tiene (`tallerAdd`, `tallerToggle`,
`tallerGrupos`, `tallerGestion`).

**Por qué importa.** Es **el mismo hueco y el mismo destino que §2.8** (abrir un año nuevo de grupos): una
decisión de modelo que delega en coordinación una operación que todavía no existe. La mitad del valor de
D5 —que la oferta cambie por grupo y por período sin tocar código— depende de que exista la pantalla.

**Qué se pide.** Que **M11.3/M11.4** incluyan la gestión del catálogo de talleres (alta, orden,
orientación a grupos, retiro) con su registro en HCE-LOG y `hce_id NULL`, como el resto de los eventos
institucionales. Conviene resolverlo junto con §2.8: es el mismo tipo de pantalla.

**Qué bloquea.** **Nada hoy** — los 14 están sembrados y `activo` es derivado, así que el catálogo
funciona para leer. Se anota para que no se descubra cuando IPPU pida cambiar la oferta.

> **Corregido el 2026-08-19:** `consulta-a-ippu.md` §3.1 afirmaba, en presente y en el documento que
> se le manda a IPPU, que «el sistema los deja agregar, cambiar de orden, indicar a qué grupos se
> orientan y dar de baja desde la propia aplicación». Era la funcionalidad del **Prototipo v4**, no la
> nuestra. Reescrito para decir qué está diseñado, qué ya funciona (participación **por nombre**, así
> que dar de baja no borra lo registrado) y que **la pantalla todavía no existe**. Mientras este punto
> siga abierto, ese párrafo no puede volver a prometerla.

> **M12.4 no agrega nada acá.** Su catálogo nuevo (`severidad_nivel`, los 3 grados DSM-5-TR) **no lo toca
> coordinación**: es texto del instrumento, no configuración institucional — por eso se sembró **sin**
> `solo_al_crear`, y ahí el seed manda. Si M12.5–M12.7 agregan catálogos que coordinación **sí** deba
> tocar (el de **centros educativos** de M12.5 es el candidato claro), suman a este mismo punto.

> ### 🆕 **M12.5 sí agrega, y era el candidato previsto** (2026-08-26)
>
> **`catalogo_centro_educativo` es el tercer caso de esta misma familia**, después de los grupos (§2.8) y
> los talleres (acá arriba): una decisión de modelo que delega en coordinación una operación que **no
> existe**. Se anota acá y **no se abre punto nuevo**, tal como el párrafo de arriba lo había previsto por
> escrito.
>
> **Y con dos particularidades que lo hacen distinto de los otros dos:**
>
> 1. **Nace con CERO filas, y es correcto que así sea** (`handoff.md` §5.50 / J1). El Prototipo v4 **no
>    tiene** catálogo de centros —ahí `centro` es texto libre—, así que no hay nada normativo que sembrar;
>    y los seis nombres de escuela que sí existen («Escuela pública N.º 87», «Liceo público N.º 12») están
>    en **`demo/js/inclusion.js`** y son **relleno de nuestra propia demo**. Sembrarlos habría puesto seis
>    centros inventados por nosotros dentro del sistema de IPPU — exactamente el mecanismo de §5.37, con
>    otro sujeto. A diferencia de talleres y grupos, acá **no hay ni siquiera un punto de partida**.
> 2. ⚠️ **Pero NO bloquea la carga clínica, y ésa es la diferencia que importa.** `inclusion.centro` es
>    **texto sin FK** (`handoff.md` §5.52 / J3), decidido con este hueco explícitamente sobre la mesa: con
>    FK obligatoria, la pantalla que falta se habría convertido en un **registro clínico bloqueado** — el
>    área no podría anotar la escuela a la que el NNA ya entró. Con texto, el catálogo **mejora la carga
>    cuando está y no la impide cuando no**.
>
> **Qué se pide.** Que **M11.3/M11.4** incluyan la gestión del catálogo de centros junto con la de talleres
> y el alta de grupos — **es la misma pantalla y el mismo tipo de trabajo**. Y que la vista del área ofrezca
> la lista de **«centros mencionados en fichas que todavía no tienen ficha de catálogo»**: es una **cola de
> trabajo** para coordinación, no un error de validación.
>
> **Qué bloquea.** **Nada hoy** — por el punto 2. Se anota para que no se descubra el día que IPPU pida
> los datos de contacto de los centros y no haya dónde ponerlos.

### 2.10 ~~«Tutor» en el panel de Grupos~~ — **REENCUADRADO: la mitad cosmética está hecha; el resto se pliega a §2.11** (2026-09-03)

> **REENCUADRADO el 2026-09-03 (higiene, `handoff.md` L9 · Step 6).** Este punto ya no es autónomo.
> - **La mitad cosmética está hecha.** F1-nav dejó el panel §21.1 con «Técnico/a responsable 1 y 2»,
>   sin ningún rol «tutor» en ninguna parte del repo. La **etiqueta** de rol la cubre el Documento
>   Técnico §3.1 con `grupo.tecnico1_rol` / `tecnico2_rol` —que **ya existen** como `String(60)` nullable
>   (`app/models/identidad.py:127`, `:129`)—.
> - **Lo que queda** —¿hay un **referente por NNA** distinto del técnico responsable del grupo?— se
>   pliega a **§2.11** (modelo de roles y asignación) y va a la lista de IPPU (`preguntas-ippu.md`). Sólo
>   IPPU lo contesta.

**Qué era.** Durante F1-nav se pidió «poder asignar tutores» al panel de Grupos. «Tutor» no aparece en
ninguna fuente normativa; podía ser (1) sinónimo de Técnico/a responsable del grupo —cosmético—, (2) un
referente por NNA distinto del técnico de grupo —tabla o campo nuevo—, o (3) el tutor legal de la familia
—ya modelado como contacto—. F1-nav implementó sólo lo definido (responsables 1 y 2 desde §21.1).

---

### 2.11 Usuarios, roles y asignación técnico↔grupo — **abierto; el vocabulario de roles ya tiene fuente y propuesta** (2026-08-26, actualizado 2026-09-03 · `handoff.md` §5.72 y §5.79)

> **⛔ `tecnico_grupo` CANCELADA el 2026-10-05 (`handoff.md` §5.100).** B6 «No» (no hace falta ver quién
> estuvo antes) y B5(b) «No» (no hay referente por NNA) → **la tabla no se construye**; supera §5.79 y
> §5.87, y la pregunta de `btree_gist` se cierra (§5.89). **B5(a): los roles son texto libre.** **Para el
> 26/11** (§5.101): login mínimo con `admin` | `tecnico` — el `tecnico` ve sólo los grupos donde es
> tecnico1/tecnico2, el `admin` ve todo. **El resto de la matriz, la conflación `admin` ↔ «dirección no
> técnica» y el «perfil de área de Inclusión» quedan para después del 26/11.** Lo de abajo se conserva
> como historia de cómo se llegó acá.


**Qué es.** IPPU confirmó cómo trabajan: **cada técnico tiene su propio usuario**, **ve sólo los grupos
que tiene asignados**, y **ADMIN ve todo, asigna grupos y puede crear otros ADMIN** (`handoff.md`
**§5.41 / I6**). El **Protocolo de acceso §5** aporta ahora la **matriz de roles** con base normativa.

**Qué se decidió el 2026-09-03 (`handoff.md` §5.72):**
- **Lista de roles de aplicación, como PROPUESTA para que Lucas confirme** (⚠️ **no** va todavía a un
  CHECK): (1) equipo técnico-asistencial tratante · (2) otros técnicos no tratantes · (3)
  dirección/coordinación técnica-clínica · (4) personal administrativo vinculado a la atención · (5)
  dirección no técnica / administración / gobierno (**sólo datos agregados**). Cada una con su fila de la
  matriz §5 detrás. ⚠️ 6º candidato sin resolver: estudiantes/investigadores UTEC-LIDIA (fila propia:
  «acceso supervisado»).
- ⚠️ **Conflación a resolver (M11.3 / Fase 4):** nuestro `admin` es el ADMIN institucional que crea
  grupos (§5.41); la «Dirección no técnica» del Protocolo **no accede al contenido clínico individual**.
  Si son el mismo usuario, el modelo contradice el Protocolo.
- ⚠️ **Perfil que nadie modeló:** la demo nombra un **«perfil de área de Inclusión»**, ausente de la
  matriz §5 y de nuestro CHECK. → lista de IPPU.
- **`grupo.tecnico1_rol` / `tecnico2_rol` YA EXISTEN** (`String(60)` nullable, `app/models/identidad.py:127`
  / `:129`) — el delta de M12.8a **no** los agrega.
- ⛔ **`tecnico_grupo`: historia — hoy CANCELADA (§5.100).** Se había diferido a M11.3 (`handoff.md` §5.79,
  2026-09-03) — §5.72 la había puesto como delta estructural de M12.8a. Se **deroga esa ubicación, no la decisión de fondo**: la tabla N:M
  con vigencias (`grupo_id`, `profesional_id`, `rol` sin CHECK, `desde` NOT NULL / `hasta` nullable,
  `UNIQUE(grupo_id, profesional_id, desde)`, `CHECK(hasta IS NULL OR hasta > desde)`) se construye
  **junto con el servicio de asignación que la lee**. Motivos en §5.79: no tiene consumidor hasta
  M11.3, `tecnico1_id`/`tecnico2_id` siguen siendo la fuente de verdad, su forma depende de **B5 y B6**
  de `preguntas-ippu.md` (sin responder), y su invariante real («≤2 vigentes, sin solape») necesita
  `EXCLUDE` + `btree_gist` —la primera extensión del repo—, decisión de M11.3. Sin datos de producción,
  hacerla después cuesta **un archivo de migración incremental**.
- **M12.8a NO toca** `profesional.rol` ni su CHECK de dos valores: el vocabulario aterriza en M11.3 / Fase
  4 con la lista que Lucas confirme.

**Qué bloquea.**
- **Toda la matriz de permisos** — **Fase 4**. (Ateneos de grupo: §1.12 cerrado en acceso general — §5.58
  / §5.63; su tensión residual es §2.16, cerrado por §5.70.)
- **La reconciliación de `grupo`**: F1 puso `responsable1`, `responsable2` y `tecnicosAutorizados` en la
  demo **sin modelo detrás** — la resuelven `grupo.tecnico1_id` / `tecnico2_id` como fuente de verdad
  (§5.100), no una tabla nueva.
- **El residuo de §5.18** (cambio de **técnico** a mitad de año): **CERRADO el 2026-10-05** — B6 contestó
  «No» (no hace falta ver quién estuvo antes) y el cambio se rastrea por la **auditoría de campo**
  (§5.100). No hay tabla que construir.

**Secuencia.** **Enmienda el no-goal del plan M12** («no se toca autenticación»), ya marcado en el plan.

### 2.12 El modelo no representa la DIVULGACIÓN — **la tabla `divulgacion` YA ESTÁ CONSTRUIDA (M12.8a-3); el flujo y los guards son M11.3** (2026-08-26, construida 2026-09-03 · `handoff.md` §5.71 y §5.80)

> **✅ B11 y B12 respondidas el 2026-10-05 (por remisión al Protocolo; lectura de Lucas, `handoff.md`
> §5.103).** **B11:** para el guard de §6.6, `disociado` y `agregado` son **equivalentes** (2 valores
> efectivos; la columna conserva 3, sin cambio de esquema). **B12:** darle a la familia una copia de la HC
> es un **acceso del titular/representante** (Ley 18.335 art. 18 lit. A), **no una divulgación**: va al
> registro de accesos (§2.17), no a `divulgacion`; «Familia / representante legal» sigue en
> `DIVULGACION_DESTINATARIOS` como **deuda conocida** (el catálogo no se cambia). **Los guards de
> divulgación quedan fuera del 26/11.**


**Estado al 2026-09-03 (`handoff.md` §5.80).** La tabla **`divulgacion` se construyó en M12.8a-3**, con
sus columnas derivadas del Protocolo §6.2–6.7 y de la matriz §5. Columnas (detalle y pasaje en §5.80):
`hce_id` (CASCADE, D-B) · `ateneo_id` (CASCADE, §5.25) · **`documento_id`** (RESTRICT — *qué* salió;
agregado sobre el diseño) · `destinatario_tipo` (CHECK desde `DIVULGACION_DESTINATARIOS`) ·
`destinatario_detalle` · `alcance_dato` (`identificable` / `disociado` / `agregado`) ·
`autorizacion_escrita` (bool, `server_default false`) · `autorizacion_documento_id` (RESTRICT) +
`autorizacion_ref` · `canal_formal` · `finalidad` (CHECK no vacío) · `fecha` · `responsable_id`
(RESTRICT) · `obs`. CHECK de forma: `num_nonnulls(hce_id, ateneo_id) <= 1` (**`<= 1`**, no XOR: el
informe agregado de §6.6 no pertenece a ningún expediente). **Sin seed.** Append-only por postura (sin
endpoint de UPDATE/DELETE; `REVOKE` en despliegue), no por trigger.

**Qué NO hace.** No modela un **flujo de compartición**. Los guards —quién *puede* divulgar según su rol
(matriz §5), si un consentimiento *habilita* la salida, la compuerta «revisado por dirección → entregado»
de §5.40, los dos CHECK cruzados que la sesión de diseño marcó como inferencia y §5.80 dejó afuera— son
**M11.3/M11.4**. `divulgacion` registra un **hecho ocurrido**, no una solicitud en trámite.

**Por qué acá.** Cuatro afirmaciones de IPPU caen sobre este concepto ausente: fotos (§5.39 / I4),
confidencialidad (§5.45 / I10), revisión de informes por dirección (§5.40 / I5), «mandar un resumen y no el
expediente». R0 verificó de forma negativa que hoy el modelo tiene **almacenamiento** y no **divulgación**
(una sola línea en `app/`, y es un comentario). Momento barato: **0 routers, 0 schemas, 0 servicios**.

**Estado.** **NO cierra.** La *representación* está construida; lo que queda abierto es el **flujo** y los
**guards** (M11.3/M11.4), y va junto con §2.13. Dos preguntas nuevas para IPPU (bloque B de
`preguntas-ippu.md`): anonimizado individual vs. agregado puro en el log; y copia de la HC a la familia
= ¿divulgación o acceso? (Ley 18.335 Art. 18 lit. A).

### 2.13 Los informes necesitan un estado de revisión, y un área configurable — **abierto por la reunión** (2026-08-26)

> **✅ B7 respondida el 2026-10-05 (`handoff.md` §5.102): es secundario y queda fuera del 26/11.** IPPU
> lo describió como una pestaña de generación de informes con plantillas de los recurrentes, «no es
> crítico, pensado a futuro». El **estado «revisado por dirección»** y el **área configurable** se
> posponen (§5.40 sigue siendo la regla; se pospone implementarla). **Sí entra al 26/11:** el IC firmado
> exportable a PDF, como exportación de demostración.

**Qué es.** Dos cosas de §5.40 (I5): **(a)** todo informe **lo revisa ADMIN antes de entregarse** —
*borrador → revisado por dirección → entregado*, que es un **estado de flujo**, no un permiso de
impresión; **(b)** lo que IPPU pidió es un **área de generación de informes configurable**, no un catálogo
cerrado de tipos.

**Por qué importa.** R0: **no existe ningún estado de revisión o aprobación** en el modelo, **ninguna otra
entidad de informe** además de `informe_cierre`, **ni destinatario, ni solicitante, ni tipo**, y **ninguna
generación de PDF** (1 comentario; `requirements.txt` sin librería de PDF). Modelar los tipos que IPPU
nombró (BPS anual completo, INAU a pedido) **como enumeración fija sería repetir el error de tomar el
ejemplo por la regla**.

**Qué bloquea.** **M11.3 (el estado) y M11.4 (la generación).** No bloquea M12.5/M12.6. Va junto con §2.12:
«revisado antes de entregar» es una **compuerta de salida**, y la salida es justamente lo que no está
modelado. ⚠️ **El informe de cierre anual no cambia:** `informe_cierre` y su `UNIQUE(hce_id, anio)` están
bien.

### 2.14 Indicador de ateneos: 8 al año, al menos 2 por grupo — **abierto (construcción); semántica fijada el 2026-09-03** (`handoff.md` §5.74)

**Qué es.** IPPU tiene una **meta institucional: 8 ateneos al año, con un mínimo de 2 por grupo**
(`handoff.md` **§5.46 / I11**).

**Semántica fijada (`handoff.md` §5.74).** El indicador **cuenta por `ateneo.fecha`**, no por
`anio_correlativo`: mide **actividad en un año**, y **§1.14** ya fijó que el filtro sigue la **fecha del
hecho**. El denominador «≥2 por grupo» usará los **cinco nombres reales** una vez que **§5.61** se ejecute
en M12.8a.

**Qué bloquea.** **Nada hoy.** Es una consulta del **tablero de M11.3/M11.4**; R0 confirmó que hoy nada
cuenta ateneos por grupo ni por año. **Sigue abierto como trabajo de construcción**, ahora con la
semántica resuelta.

### 2.15 ~~Las prestaciones se declaran en dos lugares~~ — **RESUELTO por §5.57 (salida 2); queda sólo el puntero de construcción a M11.3/M11.4** (2026-09-02, marcado 2026-09-03)

> **RESUELTO como decisión (`handoff.md` §5.57 / L4):** `pai_prestacion` es **declaración fechada** del
> PAI, no lectura en vivo ni copia sincronizada de `organismo_bps` (salida 2). **Ya no es una pregunta
> viva.** Lo único que queda es el **puntero de construcción**: la **salida 3** (aviso de divergencia
> desde el servicio, contra una tabla de equivalencias `BPS_PRESTACIONES` ↔ `PAI_PRESTACIONES`) se
> **reabre en M11.3/M11.4** si conviene. La salida 1 quedó descartada por costo.

**Qué era.** Después de M12.6 hay **dos sitios** en el modelo que dicen algo sobre prestaciones del NNA, y
no son el mismo dato:

| | Qué afirma | Forma |
|---|---|---|
| `organismo_bps` (HCE-ORG) | **el trámite** que la institución sigue | 0..1 por expediente, **una sola** `prestacion` en texto libre, con `estado` y `vencimiento` |
| `pai_prestacion` (M12.6) | **qué tiene vigente el NNA** al escribir el PAI | N filas por PAI, contra `PAI_PRESTACIONES` (6, con CHECK) |

**Por qué existe la tensión.** Por el reparto de `handoff.md` **§5.22**, «prestaciones y certificaciones
vigentes» es **diagnóstico de situación**, y eso **se lee en vivo, no se congela** — es exactamente el
argumento por el que la sección V del PAI **no** duplica el centro educativo. Si el criterio se aplicara
igual acá, `pai_prestacion` no debería existir.

**Por qué se modeló igual, dicho como es.** Porque **no hay de dónde leerlo**: `organismo_bps` guarda una
sola prestación en texto libre, no un conjunto, y **dos de los seis ítems no son prestaciones BPS** —la
Valoración Funcional (Ley 20.378 / Dec. 72/025) y el certificado de discapacidad—. Leerlo en vivo hoy
significaría rediseñar HCE-ORG, que está fuera del alcance de M12.6. Se registró la decisión y la deuda en
**§5.56 (L3)** en vez de resolverla en el código.

**El modo de falla, concreto.** El PAI **se entrega a INAU**. Si una prestación cambia en HCE-ORG y el PAI
conserva su copia, se entrega **un dato desactualizado a un organismo del Estado** — el mismo modo de
falla que §5.22 usó para sacar el centro educativo del PAI.

**Las tres salidas, para que el equipo elija una:**
1. **HCE-ORG pasa a N:1** (una fila por prestación, con estado y vencimiento) y el PAI **lee en vivo**.
   Es la coherente con §5.22 y la más cara: toca un módulo ya construido.
2. **Se queda como está** y se acepta que el PAI es una **foto declarada a una fecha** — defendible,
   porque el PAI *es* un documento fechado, pero hay que escribirlo para que no se lea como descuido.
3. **Híbrido:** el PAI guarda su declaración y el servicio (M11.3) **avisa** cuando difiere de HCE-ORG.

**Ratificado el 2026-09-02 — §5.57 (L4):** el equipo elige la **salida 2**. `pai_prestacion` queda como
**declaración fechada** del PAI (no como lectura en vivo ni copia sincronizada de `organismo_bps`). La
**salida 3** (aviso de divergencia desde el servicio) **sigue disponible** y se **reabre en M11.3/M11.4**,
contra una tabla de equivalencias `BPS_PRESTACIONES` ↔ `PAI_PRESTACIONES` a definir entonces. La salida 1
queda descartada por costo.

**Qué bloquea.** **Nada hoy** — el esquema funciona en las tres. Bloquea **M11.3/M11.4**, que es donde se
decide qué se muestra y qué se imprime en el PAI.

> **Corregido el 2026-09-02:** el texto de arriba dice que **dos** de los seis ítems de
> `PAI_PRESTACIONES` no son prestaciones administradas por BPS. Son **tres**: al contar la Valoración
> Funcional y el certificado de discapacidad se omitió el comodín **«Otra (detallar en observaciones)»**,
> que tampoco lo es —no tiene referente: su detalle va a `pai.prest_obs`—. El resto de la entrada no
> cambia.

### 2.16 ~~Un ateneo de grupo deja ver NNA cuya HCE el técnico no puede abrir~~ — **CERRADO** (2026-09-03, `handoff.md` §5.70)

> **La pieza que faltaba era una fila del Protocolo de acceso**, no un bando entre §5.58/§5.63 y §5.41 +
> Manual §21.1. El Protocolo `docs/markdown/protocolo-acceso-confidencialidad-resguardo-hce.md` **§5** —fila
> «Otros técnicos … no tratantes»— y **§6.1** dan al técnico no tratante acceso «únicamente mediante
> interconsulta formal, **ateneo clínico** o pase de caso documentado, y sólo a la información pertinente a
> esa consulta puntual». **El ateneo no es una fuga del régimen: es el canal que el régimen provee.**
> Ateneos de grupo de acceso general y ateneos clínicos sensibles conviven. → `handoff.md` **§5.70**.
>
> **No se resuelve en el modelo hoy** — quedan cuatro ítems de construcción, todos M11.3 / Fase 4:
> 1. Guard de visibilidad del **ateneo clínico**: participantes documentados + equipo tratante +
>    dirección/coordinación técnica-clínica. «Sensible» **no** puede significar «sólo el equipo tratante».
> 2. Leer el ateneo **no** es abrir la HCE: el endpoint enmascara a «lo pertinente» según quién consulta
>    (la **opción 2** de la hoja).
> 3. Registro del acceso **con motivo** (Protocolo §8: fecha, persona, HC consultada, motivo, firma) → ver
>    §2.17.
> 4. ⚠️ **`ateneo.participantes` es hoy `Text` (prosa, `app/models/ateneo.py:257`), por decisión de
>    privacidad.** Con eso el guard 1 es **inimplementable**: una lista en prosa no autoriza a nadie. Para
>    que autorice tiene que pasar a **relación** (`ateneo_participante` N:M a `profesional`), y eso necesita
>    el modelo de usuarios (§2.11 / `handoff.md` §5.72) por debajo. **No se toca ahora.**

---

### 2.17 HCE-LOG registra CAMBIOS, no ACCESOS con motivo — abierto por el Protocolo (2026-09-03)

> **2026-10-05 (B12, `handoff.md` §5.103):** a este registro de accesos va **también la entrega a la
> familia de una copia de la HC** (acceso del titular, no divulgación). Sigue siendo **posterior al 26/11**
> (§5.88 · §5.101).


**Qué es.** El **Documento Técnico** define HCE-LOG (`auditoria`) como *«quién, cuándo, **qué campo, valor
anterior y nuevo**»* (§3.2) — un **registro de cambios**. El **Protocolo de acceso** exige algo distinto y
adicional: su **§8** manda registrar **accesos (lecturas)** *«indicando como mínimo: fecha, persona que
accede, HC consultada, **motivo de la consulta** y firma»*, y su **§7** pide *«acceso mediante usuario y
clave individual … registro automático de accesos cuando el sistema lo permita»*. El **§4** lo eleva a
principio rector: *«todo acceso a una HC debe quedar registrado (quién, cuándo, con qué motivo)»*.

**Qué registra hoy `auditoria`, medido contra el código** (`app/models/transversales.py:227-272`):
`hce_id` (nullable), `ts`, `usuario_id` (nullable), `modulo` (nullable), `tipo` (`CHECK IN
('edicion','firma','excepcion','addenda','alerta','carga','acceso')`), `campo`, `valor_ant`, `valor_nuevo`,
`detalle`.

- El **tipo `'acceso'` está en el CHECK** — o sea la *forma* de un evento de lectura está prevista.
- Pero **no hay columna de `motivo`**: el único candidato es `detalle` (texto libre), que no es
  estructurado ni obligatorio. Y **no hay `firma`** de acceso modelada.
- **Nada escribe eventos de acceso.** `app/services/` no existe, `app/routers/__init__.py` está vacío,
  `app/main.py` monta sólo `/health`. **El concepto «lectura con motivo» no existe operativamente** — y
  estructuralmente sólo existe a medias (el valor de enum, sí; un campo `motivo` y cualquier escritor, no).

**Qué bloquea.** **Nada hoy.** Condiciona **M11.3** (la capa de servicios es donde vivirían los guards que
escriben `auditoria`, incluido el de §5.70 ítem 3) y **Fase 4** (login con credencial individual + registro
automático de accesos, Protocolo §7). **Es un requisito legal**, no un extra: Ley 18.331 Art. 8
(finalidad), principio de trazabilidad, y Protocolo §4 + §8 lo exigen por escrito. El Anexo III del
Protocolo trae la planilla de papel «mientras se define o mejora un registro electrónico».

**No se diseña acá.** Se registra para que M11.3 no lo pase por alto.

---


## 3. Supuestos que tomamos — confirmar, no discutir

Cosas que se resolvieron eligiendo la opción razonable para no frenar. Si alguna está mal, es
barato corregirla ahora:

| Supuesto | Dónde |
|---|---|
| Los roles de los técnicos son **texto libre** ("Psicólogo/a", "Maestro/a"), no una lista cerrada | `grupo.tecnico1_rol` |
| «Evaluación por áreas» y «Evaluación general» quedan como **archivo histórico de solo lectura**, no como módulos activos | decisión §5.1.2, ya aplicada en la demo |
| El informe de cierre es **anual** (uno por año), no uno por NNA en toda su trayectoria | corrección del bug A |
| Una persona puede existir **sin** expediente de Atención Diurna (p. ej. si sólo va a Taller Terapéutico) | corrección del bug B |
| Un reingreso a más de 12 meses genera una **línea base IDEA nueva**, sin borrar la anterior | tabla `idea` es 1:N |
| Taller Terapéutico y Clínica quedan **fuera de alcance**, pero existen como fila para no forzar el modelo después | tabla `servicio` |

> ### ✅ Qué pasó con estos seis en la reunión del 2026-08-21
>
> | Supuesto | Estado |
> |---|---|
> | Roles de los técnicos = **texto libre** | ✅ **CONFIRMADO el 2026-10-05** (B5a: «texto libre», `handoff.md` §5.100). Antes: sin respuesta |
> | «Por áreas» y «general» = archivo histórico | **CONFIRMADO** — quedaron **reemplazadas por los Protocolos A y B** (consulta §2.5) |
> | Informe de cierre **anual**, uno por año | **CONFIRMADO** (consulta §2.3 · `handoff.md` §5.40) |
> | Una persona puede existir **sin** expediente de Atención Diurna | **CONFIRMADO**, y con un caso concreto: un NNA puede **dejar la diurna y seguir en clínica** (consulta §2.6) |
> | Reingreso >12 meses = **línea base nueva** | ✅ **CERRADO el 2026-10-05** (B10: «no, no cambia nada», `handoff.md` §5.96). Con el IDEA anual hay uno por año igual y un reingreso no abre ninguna instancia especial. Antes: «hay que revisarlo» |
> | Taller Terapéutico y Clínica **fuera de alcance** | ⚠️ **Tensión, no contradicción.** §5.12 / D3 sigue en pie, pero la **transición** diurna → clínica **tiene que poder registrarse**: es un hecho del expediente de diurna |
