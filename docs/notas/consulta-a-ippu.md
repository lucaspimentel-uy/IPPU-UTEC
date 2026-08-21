<!-- ESTADO DEL DOCUMENTO — cabecera nuestra, NO forma parte de lo que recibió IPPU. -->

> ## ⚠️ Este archivo es un **snapshot** — el original vive en un Google Doc del equipo
>
> | | |
> |---|---|
> | **Qué es** | El cuestionario **tal como se envió a IPPU**, palabra por palabra. |
> | **Enviado** | **2026-08-19** (`handoff.md` §5.28). |
> | **Respuesta** | **Todavía no hay.** No es que IPPU no conteste: un cuestionario de 30 preguntas no vuelve en 24 horas (§5.28). |
> | **Artefacto autoritativo** | **Google Doc del equipo** → `⟨pegar link acá⟩` · **fecha del snapshot: 2026-08-20**. |
> | **Revisión** | El equipo lo revisó antes de mandarlo y **sacó tres preguntas** (ver abajo). |
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

---

### 1.2 Sobre las firmas

Entendimos que **cada evaluación la firman dos técnicos** (por ejemplo, psicólogo/a y maestro/a),
y que una vez firmada **queda cerrada**: si después hay que agregar o corregir algo, no se modifica
lo firmado sino que se agrega una nota aclaratoria aparte, que queda registrada con su fecha y
autor.

**¿Es así como trabajan? ¿Siempre firman dos personas?**

> _Respuesta:_

---

### 1.3 Sobre el consentimiento

Entendimos que el consentimiento de la familia es **el único paso que no se puede saltear
bajo** **ninguna circunstancia**. Los demás sí: si por alguna razón hay que hacer el Protocolo A
antes de tener la evaluación IDEA, se puede, dejando constancia escrita del motivo.

**¿Es correcto? ¿Hay algún otro paso que tampoco debería poder saltearse nunca?**

> _Respuesta:_

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

---

### 1.5 Sobre el informe

Entendimos que **el Informe de Cierre Anual es el único informe válido** que sale de la
institución, y que se genera a partir de lo que quedó firmado durante el año. La familia deja
constancia de que lo recibió.

**¿Es así? ¿Hay otros informes que se entreguen (a escuelas, a organismos) y que también deberíamos** **contemplar?**

> _Respuesta:_

---

### 1.6 Lo demás que registramos

Además de las evaluaciones, el sistema guarda: datos de identificación y anamnesis ·
documentos adjuntos (informes médicos, escolares, de otras instituciones) · fotos (sólo con
autorización de imagen registrada) · el vínculo con **INAU** y con **BPS** · la **valoración
funcional** con su porcentaje oficial · observaciones de seguimiento · altas y bajas · y un registro
de quién hizo qué y cuándo.

**¿Falta algo que registren habitualmente y que no esté en esta lista?**

> _Respuesta:_

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

---

### 2.6 Una persona puede estar en la institución sin tener expediente de Atención Diurna (Sin estar en el HCE)

**Lo que asumimos:** alguien puede concurrir **sólo** al Taller Terapéutico o **sólo** a la Clínica, sin ser parte del Servicio de Atención Diurna. En ese caso está registrado como persona, pero no tiene un expediente de Atención Diurna abierto.

**¿Pasa esto en la práctica? ¿Hay personas que estén en más de un servicio a la vez?**

> _Respuesta:_

---

### 2.7 Los períodos son recordatorios, no fechas límite

**Lo que asumimos:** los períodos sugeridos (IDEA al ingreso · Protocolo A en julio · Protocolo B en la última semana lectiva · Informe de Cierre después del Protocolo B) son **avisos**, no plazos que bloqueen. El sistema recuerda, pero nunca impide firmar fuera de fecha.

**¿Están de acuerdo, o preferirían que alguno sí sea obligatorio?**

> _Respuesta:_

---

### 2.8 Las fotos requieren autorización

**Lo que asumimos:** para guardar una foto de un niño/a hace falta tener registrada la autorización de imagen de su familia. Para una **foto grupal**, hace falta la autorización de **todas** las familias de los chicos que aparecen.

**¿Es así como lo manejan? ¿La autorización de imagen es un documento aparte del consentimiento** **general, o van juntos?**

> _Respuesta:_

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

---

### 3.3 Qué hacer con los expedientes que ya existen

Nos dijeron que hay alrededor de **40 activos y otros tantos archivados**.

**¿Qué prefieren?**

☐ Pasarlos todos al sistema nuevo ☐ Empezar de cero y dejar los viejos donde están, para consultar ☐
Pasar sólo los activos ☐ Otra cosa:

> _Respuesta:_

---

### 3.4 El número de historia clínica actual

Guardamos un espacio para el número que cada expediente tiene hoy en el sistema viejo, para
poder cruzarlos.

**¿Qué forma tiene ese número? (por ejemplo: 1234, HC-2024-015, u otra)**

> _Respuesta:_

---

### 3.5 Quién puede ver qué

**¿Todos los técnicos ven todos los expedientes, o cada uno ve sólo los de su grupo?** **¿Hay información que sólo deberían ver ciertas personas (por ejemplo, coordinación o dirección)?**

> _Respuesta:_

---

### 3.6 Cuando falta un técnico para firmar

Si una evaluación necesita dos firmas y uno de los dos técnicos no está (licencia, se fue de
la institución, cambio de grupo a mitad de año):

**¿Qué hacen hoy? ¿Firma otra persona? ¿Se espera? ¿Firma coordinación?**

> _Respuesta:_

---

### 3.7 Cuando un chico cambia de grupo durante el año

**¿Pasa? Y si pasa, ¿qué debería ocurrir con las evaluaciones ya firmadas y con las que faltan?** **¿Las firma el técnico del grupo nuevo o el del anterior?**

> _Respuesta:_

---

### 3.8 Los dos técnicos, ¿puntúan cada uno por su lado y después acuerdan? ⚠️

Cuando se aplica el IDEA o la Escala IPPU-TEA y participan dos técnicos:

**¿Cada uno pone su puntaje por separado y recién después se juntan a acordar el valor final?** **¿O lo conversan mientras evalúan y anotan un solo número?**

Y si puntúan por separado: **cuando hay una diferencia grande entre los dos, ¿queda registrado
en** **algún lado cómo se resolvió, o sólo queda el valor acordado?**

*Por qué preguntamos.* El Manual de Procedimientos dice que la puntuación es independiente y el consenso viene después, y lo presenta como el punto metodológico más importante del instrumento. Preparamos el sistema para poder guardar las dos puntuaciones y lo que se conversó, pero **queremos** **saber si eso es lo que ya hacen o algo que habría que empezar a hacer.** Si hoy anotan un solo número, el sistema lo acepta igual — no queremos imponerles una forma de trabajar.

> _Respuesta:_

---

### 3.9 Cómo se entrega el informe a la familia

**¿En papel firmado, por correo electrónico, en una entrevista, o varias de estas?** **Y la constancia de que la familia lo recibió, ¿cómo se registra hoy?**

> _Respuesta:_

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

---

### 3.12 Los ateneos de grupo, ¿quién puede verlos? ⚠️

En el prototipo dice que los **ateneos clínicos de un NNA** son datos sensibles y que sólo los ve
quien tiene acceso a su historia, y que los **institucionales y las jornadas de capacitación** los
puede ver todo el equipo técnico. Nos queda una duda con el cuarto tipo: **el ateneo de grupo**.

Lo preguntamos porque en el ejemplo que trae el propio prototipo, el ateneo de grupo («Cierre de
ciclo — Grupo Celeste») repasa la evolución de los chicos del grupo. **¿Ese registro lo puede ver
todo el equipo,** **o sólo quienes trabajan con ese grupo?**

> _Respuesta:_

---

### 3.13 El número del ateneo (AT-2026-001)

Dos preguntas chicas sobre cómo numerarlos:

1. En el prototipo, las jornadas de capacitación aparecen a veces como JC-… y a veces como AT-…. **¿Quieren que las jornadas lleven su propio prefijo, o alcanza con uno solo para todo?**

2. Si un ateneo se hizo en **diciembre** y se carga en **enero**, ¿el número tendría que ser del año en que se hizo o del año en que se cargó? Nosotros lo dejamos como el año en que se carga (así el número no cambia nunca una vez asignado), pero eso hace que un ateneo de diciembre de 2026 pueda quedar numerado como AT-2027-001. **¿Les sirve así?**

> _Respuesta:_

---

### 3.14 Algo que no preguntamos

**¿Hay algo de cómo trabajan que creen que deberíamos saber y que no aparece en ninguna de estas** **preguntas?** Esta es probablemente la pregunta más útil de todas.

> _Respuesta:_

---
