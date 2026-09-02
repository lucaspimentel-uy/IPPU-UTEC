<!-- ESTADO DEL DOCUMENTO — cabecera nuestra, NO forma parte de lo que recibió IPPU. -->
Link del docs: 
https://docs.google.com/document/d/1F1GdDwluxQR_uLaYdr0GF-RgQUfcTXx7/edit?rtpof=true

> ## ⚠️ Este archivo es un **snapshot** — el original vive en un Google Doc del equipo
>
> | | |
> |---|---|
> | **Qué es** | El cuestionario **tal como se envió a IPPU**, palabra por palabra. |
> | **Enviado** | **2026-08-19** (`handoff.md` §5.28). |
> | **Respuesta** | **CONTESTADO EN LA REUNIÓN DEL 2026-08-21**, transcripto acá el **2026-08-26**. **25 de 28** preguntas quedaron contestadas; **3 siguen abiertas** (§2.2, §2.4, §3.1). |
> | **Artefacto autoritativo** | **Google Doc del equipo** → `⟨pegar link acá⟩` · **fecha del snapshot: 2026-08-20**. |
> | **Revisión** | El equipo lo revisó antes de mandarlo y **sacó tres preguntas** (ver abajo). |
>
> ### ✍️ Transcripción de la reunión — qué se escribió y qué falta
>
> Las respuestas de abajo salen de la **reunión con IPPU del 2026-08-21** y se escribieron el
> **2026-08-26**, **bajo cada `> _Respuesta:_`**, que es el procedimiento que §6 de `handoff.md` fija.
> **No se tocó ni una palabra de pregunta, ni la numeración, ni la estructura**: el archivo sigue siendo
> el snapshot de lo que se envió el 19/08.
>
> | | |
> |---|---|
> | **Contestadas** | **25 de 28** — Parte 1: **6/6** · Parte 2: **6/8** · Parte 3: **13/14** |
> | **Abiertas** | **3** — **§2.2** (plazo del reingreso) · **§2.4** (roles de los dos técnicos) · **§3.1** (los 14 talleres de este año) |
> | **Contestada a medias** | **§3.2** — sabemos **dónde** está la HCE actual (Heroku), no en qué estado va el trámite ni con quién hablar |
> | **Corrige lo que dice el documento** | **§1.3** (el consentimiento **no** es un bloqueo duro) y **§2.8** (la autorización de imagen aplica a **compartir**, no a guardar) |
>
> ⚠️ **ESTO TODAVÍA NO ESTÁ EN EL GOOGLE DOC.** El artefacto autoritativo es el Doc del equipo, no este
> `.md` (§5.34): **alguien tiene que copiar estas respuestas ahí a mano**. Hasta que eso pase, el Doc y el
> repo vuelven a divergir — que es exactamente lo que §5.34 documenta. Pendiente con nombre en
> `handoff.md` §6.
>
> **Si el Google Doc cambia, este archivo queda viejo y nadie se entera.** Esa es exactamente la
> divergencia que documenta **§5.34**: entre el 19/08 y el 20/08 el repo describió un cuestionario que
> IPPU no tenía. Al actualizar el Doc, volver a bajar el snapshot y actualizar la fecha de arriba.
>
> **Qué bloquea, con nombre y apellido** (§5.28): **M12.5** (HCE-INC) · **M12.6** (HCE-PAI) · **M12.8**
> (cierre). No están esperando manos, están esperando estas respuestas.
>
> ### Las tres preguntas que el equipo sacó en la revisión del 19/08 — **nunca se preguntaron**
>
> No están acá abajo porque **no se enviaron**. Siguen abiertas y su único canal hoy es la reunión:
> `docs/notas/puntos-a-validar.md` **§1.2** (las dos del baremo) y **§1.4** (las citas de la escala),
> donde quedaron con su redacción original.
>
> | Sacada | Era | Sigue abierta en |
> |---|---|---|
> | §2.7 | Los porcentajes de la valoración funcional (baremo) | `puntos-a-validar.md` §1.2 · `handoff.md` §7 · agenda §6 |
> | §2.8 | El porcentaje lo define el organismo oficial, no la institución | ídem |
> | §3.2 ⚠️ | Las citas bibliográficas de la Escala IPPU-TEA | `puntos-a-validar.md` §1.4 |
>
> ### ⚠️ Dos cosas que están mal en el documento y que IPPU tiene en la mano
>
> 1. **La intro apunta a preguntas que no existen.** Dice que las que más frenan son «**3.2** (las citas
>    de la escala) y **3.3** (el acceso al sistema actual)» — numeración **anterior** a la revisión. En el
>    documento enviado **§3.2 es «Acceso al sistema actual»** y **§3.3 es «Qué hacer con los expedientes
>    que ya existen»**; la pregunta por las citas **no está en ninguna parte**. Si alguien de IPPU la fue a
>    buscar, no la encontró. **No se corrige acá** —esto es el registro de lo que se mandó—, se aclara de
>    palabra en la reunión (agenda §1).
> 2. **El documento termina cortado.** Después de §3.14 hay un encabezado vacío: la sección «Para cerrar»
>    que tenía el borrador **no llegó**. No se reconstruye: agregarla sería escribir texto que IPPU nunca
>    recibió.
>
> **Numeración:** de §2.7 y §3.2 en adelante **no coincide** con la del borrador interno anterior a la
> revisión (borrado el 2026-08-20, recuperable por git y por el tag `pre-limpieza-2026-08-20`). El mapa
> de renumeración está en §5.34 de `handoff.md`. **Toda cita a este archivo usa la numeración de acá**,
> que es la que IPPU tiene delante.

---

# Consulta a Fundación IPPU — para poder seguir desarrollando

**De:** equipo UTEC-LIDIA · **Para:** equipo técnico y coordinación de IPPU **Fecha:** agosto 2026

## Por qué les mandamos esto

Estuvimos construyendo el sistema de historia clínica a partir del **Documento Técnico** que
nos pasaron y de la demo que les mostramos. Llegamos a un punto en el que, para seguir, necesitamos
que nos confirmen algunas cosas.

Buena parte de lo que hicimos **lo dedujimos** de los documentos. En varios lugares tuvimos
que elegir entre dos formas posibles de hacer algo, y elegimos la que nos pareció más razonable.
Si elegimos mal, **es mucho más barato corregirlo ahora** que dentro de dos meses.

**No hace falta que sepan nada de informática para responder esto.** Todas las preguntas son sobre cómo trabajan ustedes.

**Cómo responder:** escriban debajo de cada pregunta, o marquen con una X donde corresponda. Si algo no aplica o no saben, pónganlo — también nos sirve. No hace falta responder todo de una sola vez ni en orden; si algo requiere consultar con otra persona del equipo, dejenlo señalado.

Las preguntas marcadas con ⚠️ son las que más nos frenan: **2.1** (si el IDEA se hace una vez o
todos los años), **3.2** (las citas de la escala) y **3.3** (el acceso al sistema actual). Si sólo
pueden responder algunas, esas tres son las que más nos destraban. (**3.1**, la lista de talleres,
ya quedó resuelta con el prototipo: sólo pedimos confirmación.)

El resto puede venir después, sin problema.

Gracias por el tiempo. Cualquier duda sobre alguna pregunta, avisen y la reformulamos.

# Parte 1 — Lo que entendimos

Esto es cómo entendimos que funciona el trabajo en el Servicio de Atención Diurna. **Léanlo y
corríjannos donde nos hayamos equivocado.** Si algo está bien, no hace falta escribir nada.

### 1.1 El recorrido de un niño, niña o adolescente durante el año

Entendimos que hay un orden que se respeta:

1. **Consentimiento de la familia** — antes de cualquier otra cosa

2. **Evaluación IDEA** — al ingreso, para tener un punto de partida

3. **Protocolo A** — hacia mitad de año

4. **Protocolo B** — al final del año lectivo

5. **Informe de Cierre Anual** — que se entrega a la familia

**¿Es así? ¿Falta algún paso o hay alguno que sobra?**

> _Respuesta:_
>
> **[reunión IPPU 2026-08-21]** El recorrido es ése, con **dos correcciones**: el **IDEA es anual**
> (no sólo al ingreso), y el **consentimiento no traba** el proceso — el expediente avanza con «CI
> pendiente» visible y una notificación. → `handoff.md` §5.36 y §5.38.

---

### 1.2 Sobre las firmas

Entendimos que **cada evaluación la firman dos técnicos** (por ejemplo, psicólogo/a y maestro/a),
y que una vez firmada **queda cerrada**: si después hay que agregar o corregir algo, no se modifica
lo firmado sino que se agrega una nota aclaratoria aparte, que queda registrada con su fecha y
autor.

**¿Es así como trabajan? ¿Siempre firman dos personas?**

> _Respuesta:_
>
> **[reunión IPPU 2026-08-21]** Confirmado: firman **dos técnicos**, y una vez firmado **queda
> cerrado**; las correcciones van en una **nota aparte**.

---

### 1.3 Sobre el consentimiento

Entendimos que el consentimiento de la familia es **el único paso que no se puede saltear
bajo** **ninguna circunstancia**. Los demás sí: si por alguna razón hay que hacer el Protocolo A
antes de tener la evaluación IDEA, se puede, dejando constancia escrita del motivo.

**¿Es correcto? ¿Hay algún otro paso que tampoco debería poder saltearse nunca?**

> _Respuesta:_
>
> **[reunión IPPU 2026-08-21]** ⚠️ **No es así — IPPU lo corrigió.** Pidieron que el
> consentimiento **no trabe el proceso de evaluación**: se avanza con estado **«CI pendiente» visible** y
> notificación, en vez de bloqueo. El registro sigue siendo mínimo (referente familiar, fecha, firma).
> ⚠️ **Punto de segunda mano**, registrado como **CONFIRMABLE** en `handoff.md` §5.38: **a re-confirmar con
> IPPU**.

---

### 1.4 Sobre los dos instrumentos de evaluación

Entendimos que son **dos cosas distintas que no se comparan entre sí**:

|  | Qué mide | Cómo se lee |
| ----- | ----- | ----- |
| **IDEA** (12 dimensiones) | El punto de partida, al ingreso | **Puntaje más bajo = mejor** |
| **Escala IPPU-TEA** (24 ítems) | La evolución durante el año | **Puntaje más alto = mejor** |

Como van en direcciones opuestas y miden cosas diferentes, el sistema **nunca los suma ni los
resta** **entre sí**. La evolución del año sale de comparar el Protocolo B con el Protocolo A, y
nada más.

**¿Coincide con cómo lo entienden ustedes?**

> _Respuesta:_
>
> **[reunión IPPU 2026-08-21]** Confirmado, y con la regla dicha explícita: se compara **siempre
> dentro del mismo instrumento** — el IDEA contra el IDEA del año anterior, el Protocolo B contra el A.
> **Nunca entre instrumentos.**

---

### 1.5 Sobre el informe

Entendimos que **el Informe de Cierre Anual es el único informe válido** que sale de la
institución, y que se genera a partir de lo que quedó firmado durante el año. La familia deja
constancia de que lo recibió.

**¿Es así? ¿Hay otros informes que se entreguen (a escuelas, a organismos) y que también deberíamos** **contemplar?**

> _Respuesta:_
>
> **[reunión IPPU 2026-08-21]** **Hay más informes.** Se generan **a pedido, sin fecha fija**,
> para familias e instituciones: **BPS** siempre a fin de año y completo; **INAU** a pedido, y puede ser por
> **un solo chico**. **Todos los revisa la dirección (ADMIN) antes de entregarse.** El **Informe de Cierre
> Anual sigue siendo uno por año**. → `handoff.md` §5.40.

---

### 1.6 Lo demás que registramos

Además de las evaluaciones, el sistema guarda: datos de identificación y anamnesis ·
documentos adjuntos (informes médicos, escolares, de otras instituciones) · fotos (sólo con
autorización de imagen registrada) · el vínculo con **INAU** y con **BPS** · la **valoración
funcional** con su porcentaje oficial · observaciones de seguimiento · altas y bajas · y un registro
de quién hizo qué y cuándo.

**¿Falta algo que registren habitualmente y que no esté en esta lista?**

> _Respuesta:_
>
> **[reunión IPPU 2026-08-21]** Falta la **guía de trámites para las familias** (BPS, MIDES,
> INAU; el más consultado es **AYEX**), que se entrega **junto con los informes** (§5.49). Y en los
> **ateneos** faltan un campo de **observaciones** y los **adjuntos de documentos**, PPTX en particular
> (§5.46).

---

# Parte 2 — Lo que tuvimos que asumir

Acá van las decisiones que **tomamos nosotros** porque los documentos no lo aclaraban. Cada una
puede estar bien o mal. **Por favor confirmen o corrijan cada punto.**

### 2.1 La evaluación IDEA se hace una sola vez ⚠️

**Lo que asumimos:** el IDEA se aplica **una vez, al ingreso**, como punto de partida. No se repite todos los años. Sólo se vuelve a hacer si el niño/a se va y **regresa después de más de un año**.

**Por qué lo asumimos:** así lo indica el Documento Técnico, un rediseño que hicimos después de nuestra primera consulta con ustedes. Pero en esa primera consulta, en junio, usted nos dijo que el IDEA se hacía todos los años — y no volvimos a confirmar si eso cambió con el nuevo enfoque. Por eso esta es, de todas, la pregunta que más necesitamos que respondan.

**Por qué importa:** es el punto que más nos condiciona. Si en la práctica ustedes lo siguen aplicando todos los años, tenemos que rehacer una parte del sistema — y es mucho más simple hacerlo ahora que más adelante.

**¿Es correcto?**

☐ Sí, se hace una sola vez al ingreso ☐ No, se sigue haciendo todos los años ☐ Depende — explicar:

> _Respuesta:_
>
> **[reunión IPPU 2026-08-21]** **☒ No, se sigue haciendo todos los años.** El IDEA es **anual,
> siempre**, y el de cada año **se compara con el del anterior** — coincide con lo respondido en junio
> (P10/P12). **La «línea base única» del Documento Técnico no rige.** → `handoff.md` §5.36.

---

### 2.2 Cuánto tiempo tiene que pasar para considerar un "reingreso"

**Lo que asumimos:** si un niño/a se va y vuelve después de **más de 12 meses**, se le hace una evaluación IDEA nueva. La anterior no se borra: queda guardada como antecedente.

**¿Doce meses es el criterio correcto, o debería ser otro plazo?**

> _Respuesta:_

---

### 2.3 El Informe de Cierre es uno por año

**Lo que asumimos:** cada año se genera **un** Informe de Cierre. Si un chico está cinco años en la institución, tiene cinco informes, uno por año, y todos quedan guardados.

**¿Es así, o el informe es uno solo que se va actualizando?**

> _Respuesta:_
>
> **[reunión IPPU 2026-08-21]** Confirmado: **uno por año**, y todos quedan guardados.

---

### 2.4 Los roles de los dos técnicos

**Lo que asumimos:** cada grupo tiene dos técnicos a cargo, habitualmente **un/a psicólogo/a y** **un/a maestro/a**. Lo dejamos preparado para que puedan ser otros roles si hiciera falta.

**¿Son siempre esos dos roles? ¿Hay grupos con otra combinación (por ejemplo, dos maestras, o un** **trabajador social)?**

> _Respuesta:_

---

### 2.5 "Evaluación por áreas" y "Evaluación general" ya no se usan

**Lo que asumimos:** estas dos evaluaciones, que existían en el sistema anterior, **dejaron de** **usarse**. Las que hay cargadas quedan guardadas para poder consultarlas, pero no se cargan nuevas.

**¿Es correcto? ¿O todavía las usan para algo?**

> _Respuesta:_
>
> **[reunión IPPU 2026-08-21]** Confirmado: quedaron **reemplazadas por los Protocolos A y B**.

---

### 2.6 Una persona puede estar en la institución sin tener expediente de Atención Diurna (Sin estar en el HCE)

**Lo que asumimos:** alguien puede concurrir **sólo** al Taller Terapéutico o **sólo** a la Clínica, sin ser parte del Servicio de Atención Diurna. En ese caso está registrado como persona, pero no tiene un expediente de Atención Diurna abierto.

**¿Pasa esto en la práctica? ¿Hay personas que estén en más de un servicio a la vez?**

> _Respuesta:_
>
> **[reunión IPPU 2026-08-21]** Confirmado. En particular, un NNA puede **dejar de concurrir a
> diurna y seguir en clínica**. ⚠️ Esa transición **igual tiene que poder registrarse**, aunque clínica esté
> fuera de alcance (§5.12 / D3).

---

### 2.7 Los períodos son recordatorios, no fechas límite

**Lo que asumimos:** los períodos sugeridos (IDEA al ingreso · Protocolo A en julio · Protocolo B en la última semana lectiva · Informe de Cierre después del Protocolo B) son **avisos**, no plazos que bloqueen. El sistema recuerda, pero nunca impide firmar fuera de fecha.

**¿Están de acuerdo, o preferirían que alguno sí sea obligatorio?**

> _Respuesta:_
>
> **[reunión IPPU 2026-08-21]** Confirmado: los períodos son **recordatorios sin fechas
> rígidas**. ⚠️ Pero **el orden A→B es firme**. *(«No es lineal», del apunte del día, fue error de
> transcripción y se descarta.)*

---

### 2.8 Las fotos requieren autorización

**Lo que asumimos:** para guardar una foto de un niño/a hace falta tener registrada la autorización de imagen de su familia. Para una **foto grupal**, hace falta la autorización de **todas** las familias de los chicos que aparecen.

**¿Es así como lo manejan? ¿La autorización de imagen es un documento aparte del consentimiento** **general, o van juntos?**

> _Respuesta:_
>
> **[reunión IPPU 2026-08-21]** ⚠️ **Al revés de como lo tenemos.** **Guardar** una foto en la
> HCE **no requiere autorización**; **compartirla, sí**. Hoy el sistema bloquea el **guardado**, que es el
> punto equivocado del flujo. → `handoff.md` §5.39.

---

# Parte 3 — Dudas puntuales

Preguntas concretas que no pudimos resolver con el material que tenemos.

### 3.1 La lista de talleres — ya la respondió el Prototipo v4 ✅

La pregunta era cuál es la lista completa. **La encontramos en el prototipo que nos pasaron**, así
que cargamos esos catorce y dimos de baja los ocho que teníamos (los habíamos armado nosotros para
poder mostrar algo, y no coincidía ninguno):

Taller de cuentos y estimulación del lenguaje · Taller de música y expresión · Taller de
expresión plástica · Taller pedagógico / iniciación a la lógica · Taller de cocina · Taller de
huerta · Taller de higiene y AVD · Taller de habilidades sociales · Taller de TICs · Educación
Física · Actividades lúdicas y de juego · Actividades sensoriales · Salidas didácticas / paseos ·
Participación de familia / referentes en actividades.

**Sólo nos queda confirmar dos cosas, y ninguna nos frena:** ¿esos catorce son los que están dictando este año?, y ¿hay talleres que se ofrecen sólo a algunos grupos?

**Cómo está hoy, para no prometerles de más.** La lista está diseñada para que la manejen ustedes: agregar un taller, cambiar el orden, indicar a qué grupos se orienta cada uno y dar de baja los que dejen de dictarse. Y la participación de cada chico se guarda **por el nombre del taller**, así que dar de baja uno **no borra ni cambia** lo que ya quedó registrado: sigue viéndose, con la aclaración de que el taller salió de la lista. **Lo que todavía no construimos es la pantalla para hacer esos** **cambios**: hoy los catorce están cargados y se leen, pero modificarlos lo tenemos que hacer nosotros. Está entre lo próximo que viene. Si la oferta de este año ya es distinta de esos catorce, avísennos igual y la ajustamos nosotros mientras tanto.

> _Respuesta:_

---

### 3.2 Acceso al sistema actual ⚠️ *crítico para nosotros*

Para que el sistema nuevo pueda convivir con el que usan hoy (fundacionippu.uy), necesitamos
ver **cómo está organizada la información ahí adentro**. No los datos de los chicos: la estructura.

Entendemos que esto depende del acuerdo de confidencialidad que planteó la Dirección.

**¿En qué estado está ese trámite? ¿Hay alguien de parte del proveedor del sistema actual con quien** **podamos hablar?**

> _Respuesta:_
>
> **[reunión IPPU 2026-08-21]** La HCE actual está **alojada en Heroku**. ⚠️ Eso es **dónde vive
> hoy**, **no** el destino del sistema nuevo: las opciones de despliegue se evalúan más adelante (§5.44).
> **Sin registro** sobre el estado del trámite de confidencialidad ni sobre un contacto del proveedor
> actual: **esa parte sigue abierta**.

---

### 3.3 Qué hacer con los expedientes que ya existen

Nos dijeron que hay alrededor de **40 activos y otros tantos archivados**.

**¿Qué prefieren?**

☐ Pasarlos todos al sistema nuevo ☐ Empezar de cero y dejar los viejos donde están, para consultar ☐
Pasar sólo los activos ☐ Otra cosa:

> _Respuesta:_
>
> **[reunión IPPU 2026-08-21]** **☒ Pasarlos todos al sistema nuevo** — **activos y
> archivados**. → `handoff.md` §5.43.

---

### 3.4 El número de historia clínica actual

Guardamos un espacio para el número que cada expediente tiene hoy en el sistema viejo, para
poder cruzarlos.

**¿Qué forma tiene ese número? (por ejemplo: 1234, HC-2024-015, u otra)**

> _Respuesta:_
>
> **[reunión IPPU 2026-08-21]** Es un **entero desde 1000**: 1001, 1002, … → `handoff.md`
> §5.43.

---

### 3.5 Quién puede ver qué

**¿Todos los técnicos ven todos los expedientes, o cada uno ve sólo los de su grupo?** **¿Hay información que sólo deberían ver ciertas personas (por ejemplo, coordinación o dirección)?**

> _Respuesta:_
>
> **[reunión IPPU 2026-08-21]** **Cada técnico ve sólo los grupos que tiene asignados**, y tiene
> **su propio usuario**. **ADMIN ve todo**, asigna los grupos y puede **crear otros ADMIN**. ⚠️ Hoy nada de
> eso está modelado — es trabajo nuevo, no un supuesto confirmado (§5.41).

---

### 3.6 Cuando falta un técnico para firmar

Si una evaluación necesita dos firmas y uno de los dos técnicos no está (licencia, se fue de
la institución, cambio de grupo a mitad de año):

**¿Qué hacen hoy? ¿Firma otra persona? ¿Se espera? ¿Firma coordinación?**

> _Respuesta:_
>
> **[reunión IPPU 2026-08-21]** **Lo firmado queda firmado; lo que está pendiente lo firma el
> técnico nuevo.**

---

### 3.7 Cuando un chico cambia de grupo durante el año

**¿Pasa? Y si pasa, ¿qué debería ocurrir con las evaluaciones ya firmadas y con las que faltan?** **¿Las firma el técnico del grupo nuevo o el del anterior?**

> _Respuesta:_
>
> **[reunión IPPU 2026-08-21]** Pasa. **Lo que ya está firmado queda firmado; lo que falta lo
> firma el técnico del grupo nuevo.**

---

### 3.8 Los dos técnicos, ¿puntúan cada uno por su lado y después acuerdan? ⚠️

Cuando se aplica el IDEA o la Escala IPPU-TEA y participan dos técnicos:

**¿Cada uno pone su puntaje por separado y recién después se juntan a acordar el valor final?** **¿O lo conversan mientras evalúan y anotan un solo número?**

Y si puntúan por separado: **cuando hay una diferencia grande entre los dos, ¿queda registrado
en** **algún lado cómo se resolvió, o sólo queda el valor acordado?**

*Por qué preguntamos.* El Manual de Procedimientos dice que la puntuación es independiente y el consenso viene después, y lo presenta como el punto metodológico más importante del instrumento. Preparamos el sistema para poder guardar las dos puntuaciones y lo que se conversó, pero **queremos** **saber si eso es lo que ya hacen o algo que habría que empezar a hacer.** Si hoy anotan un solo número, el sistema lo acepta igual — no queremos imponerles una forma de trabajar.

> _Respuesta:_
>
> **[reunión IPPU 2026-08-21]** **Lo conversan y anotan un solo número:** los dos técnicos
> acuerdan **en persona** y se registra **un único valor, un solo campo**. ⚠️ Consecuencia que hay que
> decir: el **kappa de confiabilidad interjueces** que pide el Manual §23 **no es calculable** con la
> práctica actual (§5.47).

---

### 3.9 Cómo se entrega el informe a la familia

**¿En papel firmado, por correo electrónico, en una entrevista, o varias de estas?** **Y la constancia de que la familia lo recibió, ¿cómo se registra hoy?**

> _Respuesta:_
>
> **[reunión IPPU 2026-08-21]** **Casi siempre en papel.** *(Sin registro sobre cómo se deja
> constancia hoy de que la familia lo recibió.)*

---

### 3.10 El nivel de severidad DSM-5-TR, ¿se revisa en algún momento fijo del año?

Ya está el módulo para registrarlo: los dos niveles por separado (comunicación social
y comportamientos restringidos y repetitivos), con la justificación, la fecha y quién lo registró.

**Lo que no sabemos es cada cuánto se vuelve a mirar.** ¿Se revisa en una instancia fija —por ejemplo al cierre del año, junto con la evaluación— o se corrige cuando el equipo ve que cambió?

Las dos formas son válidas y el sistema sirve para las dos; lo preguntamos porque cambia **cómo
se** **guarda el historial**: si hay una revisión anual, conviene que quede una ficha por año y se
puedan comparar; si se corrige cuando hace falta, alcanza con una sola que se va actualizando (y de
todos modos queda registrado quién la cambió y cuándo).

> _Respuesta:_
>
> **[reunión IPPU 2026-08-21]** **Se corrige cuando el equipo lo ve necesario: sin cadencia
> fija.** Confirma lo implementado — un registro **0..1 por expediente**, revisable, con los dos dominios
> separados. **Sin cambios.**

---

### 3.11 El PAI, ¿cómo se llama oficialmente?

En el prototipo que nos pasaron figura como «**Propuesta** de Atención **Individual**». En
la normativa de INAU lo encontramos como «**Proyecto** de Atención **Integral**». Por los campos,
es claramente el mismo documento.

**¿Cuál es el nombre que corresponde poner en lo que se presenta a INAU?** Lo preguntamos porque ese nombre va impreso en el documento que se entrega.

Aprovechamos: entendemos que el PAI **se actualiza durante el año** (hay una sección de
«evaluación del PAI anterior» y fechas de revisión). **¿Puede haber más de un PAI en el mismo año**
—uno inicial y una actualización posterior—, o siempre es uno solo por año?

> _Respuesta:_
>
> **[reunión IPPU 2026-08-21]** «**Proyecto de Atención Integral**» (el nombre de INAU). Y **sí
> puede haber más de un PAI por año**. Además, IPPU pidió **retirar la sección VII (Análisis estratégico)**.
> → `handoff.md` §5.42.

---

### 3.12 Los ateneos de grupo, ¿quién puede verlos? ⚠️

En el prototipo dice que los **ateneos clínicos de un NNA** son datos sensibles y que sólo los ve
quien tiene acceso a su historia, y que los **institucionales y las jornadas de capacitación** los
puede ver todo el equipo técnico. Nos queda una duda con el cuarto tipo: **el ateneo de grupo**.

Lo preguntamos porque en el ejemplo que trae el propio prototipo, el ateneo de grupo («Cierre de
ciclo — Grupo Celeste») repasa la evolución de los chicos del grupo. **¿Ese registro lo puede ver
todo el equipo,** **o sólo quienes trabajan con ese grupo?**

> _Respuesta:_
>
> **[reunión IPPU 2026-08-21]** **Sólo quienes trabajan con ese grupo.** Cada técnico ve los
> ateneos de **su propio grupo**; la **jornada de capacitación** es la instancia transversal. → `handoff.md`
> §5.46.
>
> **[corrección 2026-09-02]** IPPU revirtió esto: **el ateneo de grupo es de acceso general del equipo
> técnico** — el apunte crudo de la reunión era el correcto y la lectura restrictiva del 2026-08-21 se
> retira. → `handoff.md` **§5.58 (L5)**. ⚠️ Relevado por Lucas, **no** consta en el acta escrita
> (CONFIRMABLE, como §5.38).

---

### 3.13 El número del ateneo (AT-2026-001)

Dos preguntas chicas sobre cómo numerarlos:

1. En el prototipo, las jornadas de capacitación aparecen a veces como JC-… y a veces como AT-…. **¿Quieren que las jornadas lleven su propio prefijo, o alcanza con uno solo para todo?**

2. Si un ateneo se hizo en **diciembre** y se carga en **enero**, ¿el número tendría que ser del año en que se hizo o del año en que se cargó? Nosotros lo dejamos como el año en que se carga (así el número no cambia nunca una vez asignado), pero eso hace que un ateneo de diciembre de 2026 pueda quedar numerado como AT-2027-001. **¿Les sirve así?**

> _Respuesta:_
>
> **[reunión IPPU 2026-08-21]** **(1)** Alcanza con **un solo prefijo**; un `JC-` propio para
> las jornadas es aceptable **si es barato**. **(2)** Sí, sirve así: el número es el del **año en que se
> carga**. → `handoff.md` §5.46.

---

### 3.14 Algo que no preguntamos

**¿Hay algo de cómo trabajan que creen que deberíamos saber y que no aparece en ninguna de estas** **preguntas?** Esta es probablemente la pregunta más útil de todas.

> _Respuesta:_
>
> **[reunión IPPU 2026-08-21]** Sí, y salió bastante. Lo principal:
>
> - **El consentimiento no debe trabar el proceso de evaluación** (§5.38 — ⚠️ de segunda mano).
> - **Informes a pedido y configurables**, revisados por dirección antes de entregarse (§5.40).
> - **Usuarios y permisos:** un usuario por técnico, cada uno ve sus grupos, ADMIN ve todo y asigna (§5.41).
> - **Ateneos:** falta **observaciones** y **adjuntos** (PPTX); meta institucional de **8 al año, ≥2 por
>   grupo** (§5.46).
> - **Guía de trámites para las familias** — BPS, MIDES, INAU; el más consultado es **AYEX** (§5.49).
> - **DSM-5 y CIF** como documentos de referencia, accesibles desde la aplicación.
> - **Del PAI: se retira la sección VII** (§5.42).

---

<!-- CIERRE — nuestro, NO forma parte de lo que recibió IPPU. Escrito el 2026-08-26. -->

> ## 📋 Al cierre de la transcripción (2026-08-26)
>
> **De las 14 preguntas de la Parte 3 queda abierta 1: §3.1** (si los catorce talleres son los que se
> dictan este año y si alguno va sólo a ciertos grupos). **§3.2 quedó contestada a medias**: sabemos que
> la HCE actual está en **Heroku**, no en qué estado va el trámite de confidencialidad.
>
> **En todo el documento quedan abiertas 3 de 28:** **§2.2** · **§2.4** · **§3.1**.
>
> **Lo que la reunión contestó y este documento NO preguntaba** está en
> `docs/notas/respuestas-reunion-ippu-2026-08-21.md` §14 y en `handoff.md` §5.36–§5.49. **Lo que la
> reunión NO contestó**, incluidas las tres que nunca se enviaron, está en el §16 de ese mismo archivo.
