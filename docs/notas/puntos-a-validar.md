# Puntos a validar — IPPU y equipo

> **Estado: 2026-08-07.** Lista de lo que necesita definición externa antes de poder
> avanzar o antes de un uso clínico real. Se arma al cerrar **M11.1 + M11.2** (infra
> Postgres + esquema v2 + catálogos).
>
> Cada punto dice **qué bloquea**: si algo no bloquea nada hoy, se puede resolver sin apuro.
> Las decisiones ya tomadas están en `handoff.md` §5 y no se reabren acá.
>
> **Este documento es interno.** Lo que se le manda a IPPU es
> [`consulta-a-ippu.md`](consulta-a-ippu.md) — mismo contenido en la parte que les toca, pero sin
> tecnicismos y en formato de preguntas que un funcionario puede responder. Si acá se agrega o cambia
> un punto que IPPU tiene que definir, actualizar también el otro.

---

## 1. Para IPPU (institución)

### 1.1 Validar la demo v4.1 — ⚠️ el más importante
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

### 1.2 Cortes del baremo BUND (Decreto 72/025)
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

### 1.4 Referencias documentales de los 24 ítems de la Escala IPPU-TEA
**Qué es.** Cada ítem trae una cita (DSM-5-TR, CIF, y papers como Wing & Gould 1979 o
Baron-Cohen 1985). **No están verificadas** contra las fuentes originales: se transcribieron
del prototipo tal cual.

**Por qué importa.** Si el instrumento se presenta como fundamentado, las referencias tienen
que ser correctas. Es la clase de detalle que se nota en una revisión externa.

**Qué bloquea.** Nada del desarrollo. Sí conviene resolverlo antes de publicar o presentar el
instrumento.

### 1.5 Acceso a la HCE actual — 🔴 crítico
**Qué es.** Acceso al sistema de `fundacionippu.uy` y, sobre todo, **al esquema de su base de datos**.

**Por qué importa.** Sin esto no se puede diseñar la integración ni saber cómo migrar los
expedientes que ya existen (~40 activos y ~40 archivados). Estamos construyendo a ciegas
respecto del sistema con el que hay que convivir.

**Qué bloquea.** La **Fase 3** (conectar la demo a la API) se puede hacer sin esto, pero la
integración real con la HCE de IPPU no.

### 1.6 Acuerdo de confidencialidad
**Qué es.** El documento legal que firmarían quienes accedan a datos sensibles. Lo planteó el
Director de IPPU y quedó en que la Fundación lo redacta.

**Por qué importa.** Hasta que esté firmado, el proyecto trabaja **sólo con datos simulados**.

**Qué bloquea.** El acceso del punto 1.5 y cualquier prueba con datos reales.

### 1.7 Formato del número de historia anterior
**Qué es.** El esquema guarda `hc_historico` para poder cruzar cada expediente con el archivo
de la HCE anterior. No sabemos qué formato tiene ese número.

**Por qué importa.** Si tiene estructura (prefijo, año, dígito verificador), conviene validarlo
al cargarlo en vez de aceptar cualquier texto.

**Qué bloquea.** Nada hoy — está como texto libre. Importa al migrar los expedientes existentes.

### 1.8 Cómo llegan los datos históricos
**Qué es.** Los ~80 expedientes existentes: ¿se migran, se cargan a mano, se dejan sólo como
archivo consultable?

**Por qué importa.** Cambia bastante trabajo. El esquema ya prevé el archivo histórico de solo
lectura (§10), pero no una migración masiva.

**Qué bloquea.** Nada del desarrollo actual. Hay que decidirlo antes de un piloto.

### 1.9 ¿Los dos técnicos ya puntúan de forma independiente? — ⚠️ **para la reunión**
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

### 1.10 ¿La severidad DSM-5-TR se re-evalúa en una instancia fija? (M12.4)
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

### 1.11 ¿Cómo se llama oficialmente el PAI? (M12.4 · §5.22)
**Qué es.** El Prototipo v4 lo llama «**Propuesta** de Atención **Individual**»; la normativa INAU aparece
como «**Proyecto** de Atención **Integral**». Los campos confirman que es el mismo instrumento.

**Por qué importa.** **El nombre va impreso en lo que se le entrega a INAU.** No es una cuestión de
etiqueta interna.

**Qué bloquea.** Nada de modelo (la tabla se llama `pai` en cualquier caso), pero conviene tenerlo antes
de generar el PDF en M11.4.

### 1.12 Los ateneos de grupo, ¿son dato sensible? (M12.7 · D7) — ⚠️ **para la reunión**
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

### 1.13 El código de los ateneos: ¿un prefijo o dos? (M12.7 · D2)
**Qué es.** El prototipo se contradice: el seed muestra `JC-2026-001` para la jornada de capacitación,
pero la función que crea registros (`atNuevo()`) genera siempre `AT-`, y su contador cuenta las dos
formas en **una sola serie por año**.

**Qué elegimos y por qué.** `AT-` para los cuatro tipos, leyendo «AT» como el módulo («Ateneos y
Capacitación») y no como el tipo. Motivo concreto: el tipo se puede corregir después de crear el
registro, y con prefijo por tipo **corregir un tipo mal cargado cambiaría el identificador de un
registro ya circulado**.

**Qué bloquea.** Nada: el código se **deriva**, no se guarda. Si IPPU prefiere `JC-` para las jornadas,
es una línea de código y cero migración.

### 1.14 El número de ateneo, ¿es del año en que se hizo o del año en que se cargó? (M12.7 · D3)
**Qué es.** En el prototipo el número sale del **año de creación del registro**, pero el filtro de la
lista busca por el **año de la fecha del ateneo**. Son dos cosas distintas y en el prototipo conviven sin
que nadie lo note.

**Qué elegimos.** El número se congela al crear (es un correlativo **de registración**, como el de un
libro de actas) y el filtro va contra la fecha del hecho. **Consecuencia visible:** un ateneo del
20-dic-2026 cargado en enero queda como `AT-2027-001` y aparece bajo el filtro «2026».

**Qué preguntar.** Si eso les resulta raro en la práctica, o si prefieren que el número siga al año del
hecho — que obliga a renumerar cuando alguien corrige la fecha.

---

## 2. Para el equipo (grupo + Matías)

### 2.1 Ratificar que M11 avanzó sin cruzar su propia puerta
**Qué es.** El documento de esquema v2 (§6) dice que validar la demo con IPPU es «la puerta
formal de M11». Esa validación no ocurrió, y M11.1 + M11.2 se hicieron igual.

**Por qué importa.** Fue una decisión de criterio, no un descuido: el riesgo está acotado a la
tabla `idea` (punto 1.1) y frenar todo por eso dejaba la ronda parada por tiempo indefinido.
Pero es una decisión que corresponde al equipo, no a quien la tomó solo.

**Qué se pide.** Ratificarlo o pararlo. Si se ratifica, va a `handoff.md` §5 con fecha y autor.

### 2.2 Qué se hace con la rama `feature/base-datos-hce`
**Qué es.** La rama de Victor (PostgreSQL + triggers PL/pgSQL, 1.605 líneas, probada
end-to-end) quedó aparcada porque contradice la decisión §5.2.2 de poner la lógica en el
servidor. Su SQL se está usando como material de consulta.

**Por qué importa.** Es trabajo real que no se puede dejar en el limbo indefinidamente.

**Qué se pide.** Decidir al terminar M11: mergear lo reutilizable como referencia SQL en
`docs/`, o cerrarla dejando constancia. Ver `handoff.md` §12.5.

### 2.3 Nomenclatura de «fases»
**Qué es.** Hoy conviven **cinco** usos distintos de la palabra: fases del backend (0–6),
fases del convenio, líneas L1–L4, módulos M0–M11, y las fases del Documento Técnico.

**Por qué importa.** Ya generó confusión al leer los documentos entre integrantes.

**Qué se pide.** Acordar un vocabulario único y aplicarlo. No bloquea nada, pero cuanto más
tarde se haga, más documentos hay que corregir.

### 2.4 Numeración de las líneas de trabajo
**Qué es.** La presentación y la demo usan L1 = HCE. El *Documento de trabajo* y el
cuestionario Q47 usan numeraciones distintas.

**Por qué importa.** Al citar «Línea 2» entre nosotros o con IPPU, no siempre hablamos de lo
mismo.

**Qué se pide.** Confirmar cuál es la oficial. No bloquea: el foco L1 = HCE es consistente en
todo el material técnico.

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
> §3.7 y §3.8 de `consulta-a-ippu.md`. Si pasa seguido, hay que modelar vigencias por técnico.

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

### 2.7 Quién sigue con M11.3
**Qué es.** M11.3 son los servicios con las reglas duras: secuencia del flujo, firma = bloqueo,
Δ sólo B−A, categoría del baremo sólo desde el porcentaje oficial.

**Por qué importa.** Es el sub-módulo con más contenido de todo M11 y donde está el valor real
del backend. Desde §5.6 no hay módulos con dueño exclusivo: quien lo toma, avisa.

**Qué se pide.** Que alguien lo tome y lo diga, para no duplicar trabajo como pasó en julio.

### 2.8 No hay forma de «abrir un año nuevo» de grupos — hueco que dejó M12.1
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

> **M12.4 no agrega nada acá.** Su catálogo nuevo (`severidad_nivel`, los 3 grados DSM-5-TR) **no lo toca
> coordinación**: es texto del instrumento, no configuración institucional — por eso se sembró **sin**
> `solo_al_crear`, y ahí el seed manda. Si M12.5–M12.7 agregan catálogos que coordinación **sí** deba
> tocar (el de **centros educativos** de M12.5 es el candidato claro), suman a este mismo punto.

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
