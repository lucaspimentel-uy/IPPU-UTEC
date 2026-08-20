# Agenda — reunión con Fundación IPPU (agosto 2026)

> **Qué es esto:** el guion de una recorrida por la demo, pantalla por pantalla, para que IPPU nos diga si
> el sistema se parece a cómo trabajan. **No es una ronda de frontend** y no pide cambios en `demo/`.
>
> **Por qué importa más que una reunión de avance:** ésta **es** la puerta de validación de `handoff.md`
> §5.8. M11 arrancó sin cruzarla y M12 la volvió a cruzar con más superficie construida encima; el plan
> M12 §7 dice «ratificarlo o pararlo **antes de M12.5**». Hoy **M12.5, M12.6 y M12.8 están frenados por
> esto** (§5.28), no por falta de manos.
>
> - **Autor:** Lucas · **Fecha:** 2026-08-20 · **Estado:** borrador para llevar a la reunión.
> - **Antecedente:** `docs/notas/consulta-a-ippu.md` **se envió el 2026-08-19** y todavía no volvió — pero
>   hace un día, así que **no hay que llevarlo como reclamo**: no hubo tiempo material de contestarlo. La
>   reunión no es una escalada; es el canal donde estas preguntas se responden más rápido que un formulario
>   de 30 ítems. Lo que sí cambia: IPPU **ya tiene el cuestionario en sus manos**, así que conviene
>   apoyarse en él («esto ya se lo mandamos, mirémoslo juntos») en vez de preguntar de cero.

---

## 0. Cómo leer cada punto

Cada pantalla se presenta con tres cosas y en este orden:

1. **Qué supusimos nosotros** — el supuesto que esa pantalla pone a la vista.
2. **Qué cuesta un «no»** — qué habría que rehacer si IPPU dice que no es así. Esto es lo que decide a qué
   le dedicamos la reunión: las pantallas baratas se pueden mirar rápido.
3. **Qué preguntar** — la pregunta concreta, en criollo, sin vocabulario técnico.

**Regla de la reunión:** un «sí, así trabajamos» **cierra** el supuesto y lo anotamos como confirmado con
fecha. Un «no» **no se discute en el momento**: se anota y se resuelve por escrito después (§12.6).

---

## 1. Prioridad máxima — el IDEA: ¿una línea base o todos los años?

**Pantalla:** expediente → **IDEA (HCE-LB)** · `#view-idea`

**Qué supusimos.** Que el IDEA se aplica **una sola vez**, como **línea base** del NNA, y que se repite sólo
si hay un reingreso a más de 12 meses. Es lo que dice el Documento Técnico v1.0 y es la razón por la que la
demo **dejó de tener selector de año** en M4.

**Qué cuesta un «no».** En el backend, **poco y medido** (§5.31): 1 tabla de 38, ninguna FK, y ningún test
roto si el campo va nullable — `idea` **ya admite varias instancias por expediente**. En la demo, **caro**:
`flujo.lb` es un objeto único y hay ~18 usos en 6 módulos que asumen instancia única; volver a anual es
reponer el selector de año que la v3.3 tenía y M4 retiró.

**⚠️ La pregunta cambió de forma.** Ya no es «¿cómo lo hacen?». **Fernando Sierra ya nos contestó «Anual»
por escrito** (cuestionario 15/06/2026, P10 y P12). Lo que hay que preguntar ahora es:

> «En el cuestionario de junio nos dijeron que el IDEA se hace **todos los años**. El documento técnico que
> nos pasaron dice lo contrario: que se hace **una sola vez** como línea base. Construimos siguiendo el
> documento. **¿Nos confirmás que es anual?** Si es anual, lo cambiamos ahora, que es barato.»

Es la única pregunta de la agenda donde IPPU **ya se contradijo consigo mismo**, y por eso va primero:
mientras no se resuelva, todo lo que se construya encima se construye sobre la versión equivocada.

---

## 2. Los 14 talleres

**Pantalla:** **Grupos** · `#view-grupos`

**Qué supusimos.** Que los 14 talleres del Prototipo v4 son la lista real y vigente, que **coordinación los
administra** (agrega, reordena, retira) y que la participación de un NNA se registra **por nombre**, de modo
que retirar un taller no borra lo ya registrado (§5.14 / D5).

**Qué cuesta un «no».** Barato si la lista cambia (es un catálogo: se recarga). Caro si resulta que los
talleres **no son administrables** por coordinación sino fijos, o si la participación tiene que quedar atada
a un taller concreto y no a su nombre: eso último cambia el modelo de `pai_taller` que M12.6 todavía no
escribió, así que conviene saberlo **antes** de M12.6.

**⚠️ Esta pantalla hoy no sirve como sonda.** La rama `demo/F1-navegacion` **quitó la lista de talleres por
grupo**: `g.talleres` sigue existiendo en los 4 grupos pero no se dibuja en ningún lado, y lo único que
sobrevive es el KPI agregado «Talleres cubiertos: N de 14». En la recorrida, IPPU **no va a ver qué talleres
tiene cada grupo**. Dos salidas, y hay que elegir una antes de la reunión:

- **(a)** F1 repone la lista por grupo antes de la reunión, y la sonda funciona.
- **(b)** No se repone, y **este supuesto no se puede validar por recorrida**: se pregunta de palabra, sin
  pantalla que lo sostenga, y se anota que quedó sin verificar.

*(Detalle del hallazgo en `handoff.md` §13, entrada del 2026-08-20.)*

---

## 3. Los dos técnicos que puntúan por separado — **el «no» más caro disponible**

**Pantalla:** expediente → **IDEA**, sección de puntuación · `#view-idea`

**Qué supusimos.** Que **dos técnicos puntúan cada dimensión de forma independiente**, que las dos
puntuaciones se guardan por separado, y que cuando difieren queda **registro del consenso** (§5.16 / D7).

**⚠️ Esto es agregado nuestro.** **No está en el Prototipo v4 de IPPU.** Lo modelamos porque el Manual
describe una aplicación en dupla y porque sin las dos puntuaciones separadas nunca se va a poder calcular
concordancia entre evaluadores — pero **IPPU nunca nos dijo que trabaje así**.

**Qué cuesta un «no».** Es el más caro de la lista, por eso va en tercer lugar y no al final. Un «no,
puntuamos entre los dos y anotamos un número» deja sin sentido las tablas `puntuacion_idea` y
`puntuacion_protocolo` completas (M12.2, 35 → 38 tablas pasaron por ahí), el `CHECK` de evaluadores
distintos, la columna generada `diferencia`, y el guard de «diferencia ≥ 2 exige documentación» que **M11.3
todavía no escribió**. Si la respuesta es «no», es mejor saberlo antes de M11.3 que después.

> «Cuando aplican el IDEA, ¿lo puntúan **dos técnicos por separado** y después comparan, o lo conversan y
> ponen **un número acordado**? Y si hoy es lo segundo — ¿les serviría que el sistema les permita lo
> primero, o les complicaría el trabajo?»

La segunda mitad de la pregunta importa: si es una práctica **a introducir** y no una que ya existe, §5.16
queda latente y **no urge**, pero tampoco se tira.

---

## 4. Los grupos — **mostrado pero no modelado**

**Pantalla:** **Grupos** · `#view-grupos`

**Qué supusimos.** Que los grupos son **por color** (Azul · Celeste · Naranja · Verde), que son **4**, y que
se reconfiguran **año a año** — por eso el backend le puso identidad propia y `UNIQUE(nombre, año)`
(§5.18 / D9), para poder distinguir «Azul 2026» de «Azul 2027».

**⚠️ Lo que IPPU va a ver en la pantalla no es lo que está modelado.** La rama F1 le agregó a cada grupo un
**responsable 1 / responsable 2** y una lista de **técnicos autorizados**, que **§5.18 no modela** y sobre lo
que **no hay decisión escrita en §5**. Si en la reunión IPPU dice «sí, así es», eso **no confirma nada**:
significa **trabajo nuevo de backend**, no un supuesto validado.

**Qué cuesta un «no».** El «no» al color y a los 4 grupos es barato (catálogo). El caro es otro: si IPPU
dice que un cambio de técnico a mitad de año tiene que quedar registrado, hoy **se pierde** — con
granularidad anual se sobrescribe la fila y sólo queda rastro en `auditoria` (residuo ya anotado en §5.18).

**Anotar en la reunión:** todo lo que IPPU confirme sobre responsables y técnicos autorizados va a la lista
de reconciliación de `grupo`, no a la de supuestos confirmados.

---

## 5. Las 6 bandas del IDEA y los cortes del baremo

**Pantalla:** expediente → **IDEA** (interpretación) y **Analítica** · `#view-analitica`

**Qué supusimos.** Que la interpretación del total del IDEA usa **6 tramos** con su correspondencia al
soporte DSM-5-TR (§5.13 / D4), y que los cortes del baremo son **0–4 / 5–24 / 25–49 / 50–95 / 96–100**.

**Qué cuesta un «no».** Barato: los dos son catálogos paramétricos, se cambian sin tocar código.

**⚠️ Precisión importante para no prometer de más.** Los cortes **los confirma el Prototipo v4**, es decir
confirman **qué usa IPPU** — **no** que coincidan con el anexo del **Decreto 72/025**. Ese anexo **seguimos
sin tenerlo**. En la reunión conviene decirlo así y **pedirlo**, en vez de dar el punto por cerrado.

---

## 6. Las fotos y la autorización de uso de imagen (§8.4)

**Pantalla:** expediente → **HCE-DOC / fotos**, y la ficha de grupo

**Qué supusimos.** Que **no se puede subir una foto sin autorización de uso de imagen registrada**, y que
para una **foto grupal** hacen falta las autorizaciones de **todas las familias activas del grupo** — si
falta una, el sistema rechaza y dice **quiénes faltan**.

**Qué cuesta un «no».** Es una regla dura, de las que conviene que sean exactamente como IPPU las necesita:
si en la práctica se saca la foto igual y la autorización se regulariza después, la regla tal como está
**les va a trabar el trabajo diario**. Es barata de aflojar y cara de descubrir en producción.

**Preguntar también** por el alcance institucional de HCE-DOC (§5.25): un documento cuelga de **un
expediente o de un ateneo**, nunca de los dos. ¿Hay documentación institucional que hoy no pertenece a
ningún NNA en particular?

---

## 7. HCE-SEV — la severidad DSM-5-TR

**Pantalla:** expediente → ficha de severidad *(módulo de backend; hoy la demo no lo tiene)*

**Qué supusimos.** Que la severidad se registra **como máximo una vez por expediente**, con **dos dominios
independientes** (comunicación social / conductas repetitivas), cada uno **1–3**, y con justificación, fecha
y profesional **obligatorios** (M12.4). Y que el «nivel» que se muestra es **derivado**, no un tercer campo
que alguien carga a mano (§5.24).

**Qué cuesta un «no».** Medio. Si IPPU registra **un solo nivel global** en vez de dos dominios, sobra media
tabla; si lo registran **más de una vez a lo largo del tiempo**, la PK deja de ser `hce_id` y hay que
versionarlo — que es el mismo problema del punto 1, en otra tabla.

**⚠️ Esta no se puede recorrer.** La demo no tiene el módulo. Se pregunta de palabra o se muestra el
modelo; **no cuenta como pantalla validada**.

---

## 8. Qué cierra una recorrida que un cuestionario no

Vale la pena tenerlo presente para no gastar la reunión en lo que ya preguntamos por escrito:

- **Lo que la recorrida cierra mejor:** el **orden** de las pantallas y si el flujo se parece a la secuencia
  real de trabajo; si **falta un campo** que usan todos los días (eso aparece mirando, no leyendo); si algo
  que modelamos como obligatorio **les traba** la operativa; y el punto 4 — que alguien mire la pantalla de
  grupos y diga «esto no es un grupo nuestro» es inmediato y por escrito no pasa.
- **Lo que la recorrida NO cierra y hay que pedir igual:** el **anexo del Decreto 72/025**, el **Anexo A del
  Manual**, las secciones del Manual que el prototipo no muestra, la **matriz de 14 roles**, el **acceso a
  la HCE actual y a su base de datos**, y las **24 citas bibliográficas** de la Escala IPPU-TEA. Nada de eso
  sale de mirar la demo: son documentos y accesos.
- **Lo que hay que resolver sí o sí, y no es técnico:** el **acuerdo de confidencialidad**. Hasta que exista,
  todo lo que mostramos es y sigue siendo **dato simulado**.

---

## 9. Preguntas clínicas que no nos toca resolver, pero hay que dejar planteadas

- **Los descriptores corridos.** El Prototipo v4 dice haber corregido «un corrimiento de niveles detectado
  en materiales institucionales previos (Dimensiones 3, 4, 6 y 12 de la Guía del aplicador, hoy
  desestimada)». Nosotros **no usamos esa guía** —nuestros 60 descriptores salen del texto oficial de
  Rivière— pero la pregunta queda: **si IPPU aplicó evaluaciones con la guía corrida, ¿qué se hace con esos
  puntajes históricos?** Es decisión clínica de ellos, no nuestra; sólo necesitamos saber si esos datos
  entran o no a la migración.
- **Secuencia dura o guiada.** El Manual §3 dice que «ningún instrumento puede aplicarse sin que el anterior
  esté completo y firmado»; sus Especificaciones §1 dicen «flujo guiado, **no impuesto**». Su propio código
  implementa la guiada, y nosotros también. **Confirmar cuál rige**, porque es la diferencia entre un
  sistema que bloquea y uno que sugiere.

---

## 10. Checklist de cierre de la reunión

- [ ] IDEA: ¿anual o línea base única? → **respuesta que destraba M12.5, M12.6 y M12.8**
- [ ] §5.8 ratificado o parado, con fecha y por escrito
- [ ] Talleres: lista vigente y quién los administra
- [ ] Puntuación de dos técnicos: ¿práctica actual, práctica a introducir, o no?
- [ ] Grupos: responsables y técnicos autorizados → a lista de reconciliación, no de confirmados
- [ ] Pedido formal: Decreto 72/025 (anexo) · Anexo A del Manual · matriz de roles · acceso a la HCE actual
- [ ] Confidencialidad: quién firma y cuándo

> Al terminar: los «sí» se anotan como **confirmados con fecha** en `docs/notas/puntos-a-validar.md`, y los
> «no» abren entrada en `handoff.md` §5 **antes** de tocar una línea de código (§12.6).
