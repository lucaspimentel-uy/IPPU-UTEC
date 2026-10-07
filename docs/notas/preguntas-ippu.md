# Preguntas para el próximo contacto con IPPU

> **Qué es.** **La** lista consolidada de todo lo que necesitamos que IPPU defina o confirme. Se arma el
> **2026-09-03** (sesión L9, `handoff.md` §5.78) juntando lo que hoy vive repartido en varios archivos.
> **Dueño del contacto: Lucas.**
>
> **No hace falta saber de informática para responder esto.** Todas las preguntas son sobre cómo trabaja
> IPPU o sobre material que nos falta.
>
> **Cómo leerla.** Cada pregunta dice **qué se pregunta**, **por qué importa**, **qué bloquea** y **dónde
> aterriza la respuesta** (a qué archivo del repo vuelve). Están agrupadas por urgencia:
> **A. bloquea ahora · B. bloquea M11.3 (los servicios del backend) · C. se lleva para el registro.**
>
> **Fuentes consolidadas** (detalle y conteo por fuente al final):
> `docs/notas/puntos-a-validar.md` §1 y §3 · `docs/notas/consulta-a-ippu.md` (lo que quedó abierto tras la
> reunión) · `docs/notas/respuestas-reunion-ippu-2026-08-21.md` §16 (los 12 bloques sin respuesta + los 2
> a medias) · `handoff.md` §6 · los ítems marcados **⚠️ CONFIRMABLE** (`handoff.md` §5.38 y §5.58/§5.63).
>
> ⚠️ **Esta lista reemplaza la costumbre de tener las preguntas dispersas.** Cuando IPPU responda algo, la
> respuesta se escribe en el archivo que dice «dónde aterriza», y el ítem se marca acá.

> ## 🗓️ Respuestas escritas de IPPU — 2026-10-05 (sesión M11.3-0, `handoff.md` §5.93–§5.106)
>
> IPPU contestó **A1–A5 y B1–B12** por escrito (`docs/notas/respuestas-ippu-2026-10-05.txt`, verbatim).
> Cada ítem de abajo lleva su **estado** y **dónde aterrizó**. Resumen: **16 respondidos** de 17 (A1 A2 A3 A4 **A5**
> —cerrada el mismo día—, B2 B3 B4 B5 B6 B7 B8 B9 B10, y B11/B12 por remisión al Protocolo con lectura de Lucas) · **1 sigue
> ABIERTO y reformulado: B1**. El bloque **C** no se preguntó en esta vuelta y sigue como estaba.
> Los archivos que son registro —el acta de la reunión (`respuestas-reunion-ippu-2026-08-21.md`) y el
> snapshot enviado (`consulta-a-ippu.md`)— **no se editan**: el aterrizaje vive en `handoff.md` §5 y en
> `puntos-a-validar.md`.

---

## A · Bloquea trabajo ahora

### A1 · Acuerdo de confidencialidad firmado para UTEC-LIDIA

> **Estado (2026-10-05): RESPONDIDA (negativa).** No existe ningún acuerdo firmado: «olvídate de esto». Rige la regla de `CLAUDE.md`: sólo datos simulados o anonimizados.
> **Aterrizó en:** `handoff.md` §5.104 (y §5.45) · `puntos-a-validar.md` §1.6. Respuesta verbatim en `respuestas-ippu-2026-10-05.txt`.

**Qué se pregunta.** El Protocolo de acceso de IPPU ya trae el **modelo** de acuerdo (su Anexo II) y la
regla (§6.7: para trabajar con datos identificables hace falta acuerdo previo firmado). **Falta la
instancia firmada** para el equipo UTEC-LIDIA: ¿quién lo firma de cada lado y para cuándo?
**Por qué importa.** Hasta que exista la firma, el proyecto trabaja **sólo con datos simulados o
anonimizados** — y eso ahora lo respalda el propio protocolo de IPPU, no sólo un pedido verbal.
**Qué bloquea.** Cualquier prueba con datos reales y el acceso del punto A2.
**Dónde aterriza.** `puntos-a-validar.md` §1.6.

### A2 · Acceso a la HCE actual (está en Heroku) — 🔴 crítico

> **Estado (2026-10-05): RESPONDIDA.** No tienen acceso a la HCE/demo actual; sí un video donde la recorren (youtube.com/watch?v=dMWfc0JKCC0). El esquema legado se reconstruye desde el video, **después del 26/11**; la migración de datos queda fuera del 26/11.
> **Aterrizó en:** `handoff.md` §5.104 · `puntos-a-validar.md` §1.5. Respuesta verbatim en `respuestas-ippu-2026-10-05.txt`.

**Qué se pregunta.** Sabemos que la HCE actual de IPPU está alojada en **Heroku**. Falta: ¿en qué estado
está el trámite para darnos acceso, con quién hay que hablar, y podemos ver el **esquema de su base de
datos**?
**Por qué importa.** Sin el esquema del sistema viejo no se puede diseñar la migración de los expedientes
que ya existen (IPPU confirmó que **migran todos**, activos y archivados).
**Qué bloquea.** La integración real y la migración; no bloquea la Fase 3 (conectar la demo a la API).
**Dónde aterriza.** `puntos-a-validar.md` §1.5 · `consulta-a-ippu.md` §3.2.

### A3 · ⚠️ Confirmar por escrito: el consentimiento no traba el proceso de evaluación

> **Estado (2026-10-05): RESPONDIDA — CONFIRMADO por escrito.** «Así es, el CI no traba el proceso de evaluación». Cierra la marca CONFIRMABLE de §5.38.
> **Aterrizó en:** `handoff.md` §5.94 (cierra §5.38) · `puntos-a-validar.md` (nota de cabecera). Respuesta verbatim en `respuestas-ippu-2026-10-05.txt`.

**Qué se pregunta.** Nos llegó, **de segunda mano** (no se escuchó en la reunión), que IPPU quiere que la
falta de consentimiento firmado **no detenga** la evaluación del NNA — que el expediente avance con un
aviso de «CI pendiente» en vez de un bloqueo. ¿Es así?
**Por qué importa.** Contradice lo que dice el cuestionario que ya tienen en la mano
(`consulta-a-ippu.md` §1.3: «el único paso que no se puede saltear»). Necesitamos la confirmación por
escrito antes de cambiarlo.
**Qué bloquea.** Es el **primero** de la lista del próximo contacto. No bloquea código hoy (la regla vive
en un solo lugar de la demo), pero condiciona lo que se le mostró a IPPU.
**Dónde aterriza.** `handoff.md` §5.38 (⚠️ CONFIRMABLE) · `respuestas-reunion-ippu-2026-08-21.md` §16.

### A4 · ⚠️ Confirmar por escrito: el ateneo de grupo es de acceso general

> **Estado (2026-10-05): RESPONDIDA — CONFIRMADO por escrito.** «Así es, el ateneo de grupo es de acceso general». Cierra la marca CONFIRMABLE de §5.58 y §5.63.
> **Aterrizó en:** `handoff.md` §5.104 (cierra §5.58/§5.63). Respuesta verbatim en `respuestas-ippu-2026-10-05.txt`.

**Qué se pregunta.** En la reunión del 21/08 se anotó «todos los técnicos ven todos los ateneos»; el
26/08 se registró lo contrario («cada técnico ve los de su grupo»); una corrección de IPPU del 02/09 lo
volvió a **acceso general**. Esa última corrección **no consta en ningún acta escrita**. ¿La confirman?
**Por qué importa.** Rige como decisión de equipo, pero falta el respaldo escrito para el registro. La
tensión con «el técnico ve sólo sus grupos» ya se resolvió (el ateneo es el canal formal que el propio
Protocolo prevé — `handoff.md` §5.70).
**Qué bloquea.** Nada del modelo. Es respaldo de un punto **CONFIRMABLE**.
**Dónde aterriza.** `handoff.md` §5.58/§5.63 · `respuestas-reunion-ippu-2026-08-21.md` §16 (9.a).

### A5 · «Taller de Adolescentes»: ¿es un **grupo** o es el **servicio de Taller Terapéutico**?

> **Estado (2026-10-05): ✅ RESPONDIDA — «grupo».** Primera respuesta (por escrito): Taller Terapéutico y Clínica son otros servicios, fuera de Atención Diurna, «no son nombres de grupos» — ambigua. Re-preguntada con la pregunta reformulada, IPPU contestó: **«Taller adolescentes es el nombre de un grupo»**. Confirma los cinco grupos sembrados (§5.61); la fila no sale.
> **Aterrizó en:** `handoff.md` §5.107 (confirma §5.61; supera lo que dejaron §5.93/§5.104) · `puntos-a-validar.md` §2.8. Respuesta verbatim de la primera vuelta en `respuestas-ippu-2026-10-05.txt`; la segunda llegó por Lucas y consta en §5.107.

**Qué se preguntó.** IPPU dio cinco nombres de grupo: Inicial · Escolares · Preadolescentes · Adolescentes
· **Taller de Adolescentes**. El Documento Técnico §1 reserva los servicios de **Taller Terapéutico** y
**Clínica** para la **Fase 2**, separados del Servicio de Atención Diurna; la duda era si «Taller de
Adolescentes» era ese servicio (y no una fila de `grupo`).
**Qué quedó decidido.** Es **un grupo**: los cinco grupos sembrados se quedan (`handoff.md` §5.61,
confirmada). Taller Terapéutico y Clínica son otros servicios, fuera de Atención Diurna.
**Dónde aterrizó.** `handoff.md` §5.107 · `puntos-a-validar.md` §2.8.

---

## B · Bloquea M11.3 (los servicios y guards del backend)

### B1 · Las secciones §4 y §8 del Manual de Procedimientos, y el Anexo A

> **Estado (2026-10-05): ⚠️ ABIERTA — REFORMULADA, texto definitivo.** IPPU contestó «No entendí exactamente qué querés, especifícamelo mejor». **Ya no bloquea el 26/11**: para esa fecha los totales son las sumas ya definidas (`handoff.md` §5.105). Se re-pregunta con el texto definitivo de abajo (aportado por Lucas; **reemplaza el borrador anterior**). **Pendiente de respuesta.**
>
> **Pregunta reformulada:** «Sobre el Manual de Procedimientos (B1). En la copia que tenemos del Manual faltan la sección 4, la sección 8 y el Anexo A. ¿Nos pueden mandar el archivo completo del Manual (Word o PDF)? Si no lo tienen a mano, nos alcanza con esto: cuando terminan de puntuar el IDEA, antes de firmar, ¿hacen alguna cuenta o revisión además de sumar las 12 dimensiones y los totales por escala? Por ejemplo, controlar que no quede ninguna dimensión sin puntuar, o compararlo con el IDEA del año anterior.»
> **Aterrizó en:** `handoff.md` §5.105 y §5.107 · `puntos-a-validar.md` §1.16. Primera respuesta verbatim en `respuestas-ippu-2026-10-05.txt`.

**Qué se pregunta.** Del Manual nos falta ver **dos partes**: la **§4** (cierra el marco general) y la
**§8** (está entre la puntuación del IDEA y la interpretación del perfil). ¿Nos pasan esas dos y el
**Anexo A**?
**Por qué importa.** El esquema se construyó sin ellas, pero **§8 y el Anexo A** describen el **cálculo de
totales del IDEA y la verificación previa a la firma**, que es justo lo que M11.3 implementa.
**Qué bloquea.** M11.3. Si al verlas resultan tocar el PAI, se revisa lo construido.
**Dónde aterriza.** `puntos-a-validar.md` §1.16.

### B2 · Los dos técnicos, ¿puntúan por separado o consensúan de entrada? (y qué IDEA rige)

> **Estado (2026-10-05): RESPONDIDA.** **(a)** Consenso: un solo número, en un solo campo (ratifica §5.47). **(b)** Un informe viejo muestra el IDEA de **su** año; el apartado HCE del NNA muestra lo más actual. Reemplaza «mayor `fecha_consenso`».
> **Aterrizó en:** `handoff.md` §5.98 (a) y §5.97 (b) · `puntos-a-validar.md` §1.9. Respuesta verbatim en `respuestas-ippu-2026-10-05.txt`.

**Qué se pregunta.** Dos cosas relacionadas: **(a)** ¿los dos técnicos puntúan cada uno por su lado y
después acuerdan, o acuerdan en persona y anotan un solo número? (IPPU dijo lo segundo en la reunión, se
pide ratificar); **(b)** cuando un documento viejo muestra un IDEA, ¿el sistema debe mostrar el IDEA **de
ese año** o **el más reciente**?
**Por qué importa.** (a) define si el kappa de confiabilidad interjueces sirve desde el día uno o queda
latente; (b) es un guard de M11.3 que hoy vive sólo en prosa.
**Qué bloquea.** M11.3 (el guard de «qué IDEA rige a la fecha»).
**Dónde aterriza.** `puntos-a-validar.md` §1.9 (ya cerrado, se ratifica) ·
`respuestas-reunion-ippu-2026-08-21.md` §16 (3.b).

### B3 · ¿Quieren registrar la **participación de cada NNA en cada taller**?

> **Estado (2026-10-05): RESPONDIDA (condicional).** Se registra la participación de cada NNA en cada taller **si es viable y no complica mucho**; si no, alcanza el catálogo. `pai_taller` se queda y se expone sólo si se conecta la pantalla del PAI.
> **Aterrizó en:** `handoff.md` §5.104. Respuesta verbatim en `respuestas-ippu-2026-10-05.txt`.

**Qué se pregunta.** ¿El sistema tiene que llevar qué talleres hace cada NNA, o alcanza con tener el
**catálogo** de talleres del año?
**Por qué importa.** Decide si la tabla `pai_taller` (participación por PAI, por nombre de taller) tiene
sentido o sobra.
**Qué bloquea.** El alcance de esa parte de M12.6 / M11.3.
**Dónde aterriza.** `respuestas-reunion-ippu-2026-08-21.md` §16 (2.a) · `handoff.md` §5.21.

### B4 · La secuencia de instrumentos, ¿**traba** o sólo **avisa**?

> **Estado (2026-10-05): RESPONDIDA.** «Solo avisa». Enmienda el «409 duro» de §5.86.
> **Aterrizó en:** `handoff.md` §5.95 (enmienda §5.86). Respuesta verbatim en `respuestas-ippu-2026-10-05.txt`.

**Qué se pregunta.** El Manual §3 dice «ningún instrumento se aplica sin que el anterior esté completo y
firmado»; las Especificaciones dicen «flujo guiado, **no impuesto**». El orden A→B es firme y los períodos
son recordatorios — eso ya está claro. La duda es: si alguien intenta saltear un paso, ¿el sistema **lo
impide** o **lo deja pasar con una advertencia y una constancia**?
**Por qué importa.** Es la diferencia entre un bloqueo duro y una habilitación excepcional registrada.
**Qué bloquea.** M11.3 (el motor de flujo).
**Dónde aterriza.** `respuestas-reunion-ippu-2026-08-21.md` §16 (13.b).

### B5 · Roles de los técnicos: ¿etiqueta libre o lista cerrada? ¿Hay un «referente por NNA»?

> **Estado (2026-10-05): RESPONDIDA (c por remisión; alcance acotado por Lucas).** **(a)** Texto libre. **(b)** No hay referente por NNA. **(c)** «Revisar Protocolo de Acceso.md. Cuidado con el alcance: sólo los críticos para 26/11». Para el 26/11: login mínimo con los roles `admin` | `tecnico`. El resto de la matriz y el «perfil de área de Inclusión» quedan **sin contestar y fuera del 26/11**.
> **Aterrizó en:** `handoff.md` §5.100 y §5.101 · `puntos-a-validar.md` §2.11 y §3. Respuesta verbatim en `respuestas-ippu-2026-10-05.txt`.

**Qué se pregunta.** Tres cosas de la misma familia: **(a)** los roles «Psicólogo/a», «Maestro/a del
grupo», ¿son texto que cada institución escribe, o una lista cerrada?; **(b)** ¿además del técnico
responsable **del grupo**, hay un **referente por cada NNA** distinto?; **(c)** la lista de perfiles de
usuario que armamos a partir del Protocolo —equipo tratante · otros técnicos no tratantes ·
dirección/coordinación técnica-clínica · personal administrativo vinculado · dirección no técnica (sólo
datos agregados)— ¿refleja cómo trabajan? ¿Y el **«perfil de área de Inclusión»** que aparece en el
tablero es un perfil propio?
**Por qué importa.** Define el modelo de usuarios y asignación técnico↔grupo (`tecnico_grupo`) y la matriz
de permisos.
**Qué bloquea.** El vocabulario de roles de M11.3 / Fase 4 (la tabla de asignación `tecnico_grupo` se
difirió a M11.3 por `handoff.md` §5.79; los permisos, Fase 4).
**Dónde aterriza.** `puntos-a-validar.md` §2.11 (absorbe §2.10) · `consulta-a-ippu.md` §2.4 ·
`respuestas-reunion-ippu-2026-08-21.md` §16 (5.d) · `handoff.md` §5.72.

### B6 · Cuando un **técnico** cambia de grupo a mitad de año

> **Estado (2026-10-05): RESPONDIDA.** «No»: no hace falta ver quién estuvo antes cuando un técnico cambia. **`tecnico_grupo` se cancela**; el cambio se rastrea por auditoría de campo.
> **Aterrizó en:** `handoff.md` §5.100 (supera §5.79 y §5.87) · `puntos-a-validar.md` §2.11. Respuesta verbatim en `respuestas-ippu-2026-10-05.txt`.

**Qué se pregunta.** En la reunión se preguntó por el **NNA** que cambia de grupo (contestado). Falta el
otro caso: cuando **cambia el técnico** a cargo de un grupo a mitad de año, ¿necesitan poder ver después
quién estuvo antes?
**Por qué importa.** Si pasa seguido, la asignación técnico↔grupo tiene que guardar **vigencias** (desde /
hasta), no un solo valor.
**Qué bloquea.** El detalle de la tabla `tecnico_grupo` (se construye en M11.3 —`handoff.md` §5.79 la
difirió desde M12.8a—, junto con el servicio de asignación que usa las vigencias).
**Dónde aterriza.** `puntos-a-validar.md` §2.11 · `respuestas-reunion-ippu-2026-08-21.md` §16 (5.c) ·
`handoff.md` §5.18.

### B7 · Los informes: tipos y qué significa «área configurable»

> **Estado (2026-10-05): RESPONDIDA.** Una pestaña para generar informes con plantillas de los recurrentes. «No es crítico, pensado a futuro»: secundario, fuera del 26/11. El IC firmado sí se exporta a PDF.
> **Aterrizó en:** `handoff.md` §5.102 · `puntos-a-validar.md` §2.13. Respuesta verbatim en `respuestas-ippu-2026-10-05.txt`.

**Qué se pregunta.** IPPU pidió un **área de generación de informes configurable**, no una lista fija de
tipos. ¿Qué tiene que poder configurar el usuario (destinatario, contenido, formato)? ¿Y qué informes
existen además del de cierre anual (BPS a fin de año completo, INAU a pedido por un solo chico…)?
**Por qué importa.** Todo informe **lo revisa la dirección antes de entregarse** (un estado de flujo,
`borrador → revisado → entregado`), y hoy no existe ningún estado de revisión, ni destinatario, ni
generación de PDF.
**Qué bloquea.** M11.3 (el estado) y M11.4 (la generación). El informe de cierre anual no cambia.
**Dónde aterriza.** `puntos-a-validar.md` §2.13 · `respuestas-reunion-ippu-2026-08-21.md` §16.

### B8 · Datos históricos con la «Guía del aplicador» corrida (dimensiones 3, 4, 6 y 12)

> **Estado (2026-10-05): RESPONDIDA.** «Todos entran igual»: sin marca especial para los puntajes con la guía corrida.
> **Aterrizó en:** `handoff.md` §5.104. Respuesta verbatim en `respuestas-ippu-2026-10-05.txt`.

**Qué se pregunta.** El Prototipo v4 dice que corrigió un corrimiento de niveles en una «Guía del
aplicador» previa, en las dimensiones **3, 4, 6 y 12**. Si IPPU aplicó IDEA con esa guía, ¿qué se hace con
esos puntajes al migrarlos? (Con «migran todos», entran igual.)
**Por qué importa.** Es una decisión **clínica** de IPPU, no nuestra. Afecta cómo se marcan esos
registros al migrarlos.
**Qué bloquea.** La estrategia de migración de datos históricos (pre-piloto).
**Dónde aterriza.** `respuestas-reunion-ippu-2026-08-21.md` §16 (13.a) · `handoff.md` §7.

### B9 · Adolescentes con autonomía progresiva: reserva de datos frente a padres/tutores

> **Estado (2026-10-05): RESPONDIDA (diferida).** Es un derecho de la persona según la Ley 18.331; «no pensamos modelarlo ahora, se deja para después». Sale de M11.3.
> **Aterrizó en:** `handoff.md` §5.104 · `puntos-a-validar.md` §1.17. Respuesta verbatim en `respuestas-ippu-2026-10-05.txt`.

**Qué se pregunta.** El Protocolo (matriz §5) da al adolescente con autonomía progresiva el derecho a
pedir **reserva de datos puntuales incluso respecto de sus padres o tutores**, a criterio del técnico
tratante. ¿Cómo lo manejan hoy? ¿Lo decide el técnico y queda anotado, o es una conversación que no se
registra?
**Por qué importa.** Nada en el modelo expresa una reserva **por entrada** y **contra un actor** (el
representante legal). Es distinto de «esto es sensible».
**Qué bloquea.** M11.3 (el modelo de la reserva) y Fase 4 (que el acceso del representante la respete).
**Dónde aterriza.** `puntos-a-validar.md` §1.17.

### B10 · Qué IDEA abre una instancia nueva, ahora que el IDEA es anual

> **Estado (2026-10-05): RESPONDIDA.** «No, no cambia nada»: el reingreso no abre una instancia especial.
> **Aterrizó en:** `handoff.md` §5.96 · `puntos-a-validar.md` §3. Respuesta verbatim en `respuestas-ippu-2026-10-05.txt`.

**Qué se pregunta.** Asumimos que un **reingreso a más de 12 meses** genera un IDEA de línea base nuevo.
Con el IDEA **anual** (ya confirmado), «reingreso» deja de ser lo que abre una instancia nueva — ya hay
uno por año. ¿Cambia algo en cómo IPPU piensa el reingreso?
**Por qué importa.** Es un supuesto nuestro que la respuesta «IDEA anual» dejó a mitad de camino.
**Qué bloquea.** La implementación de §5.36 (IDEA anual) en M11.3.
**Dónde aterriza.** `puntos-a-validar.md` §3 · `consulta-a-ippu.md` §2.2.
⚠️ **Aparece con redacción distinta en dos fuentes** (ver apéndice).

### B11 · En el registro de divulgación, ¿un dato anonimizado individual cuenta distinto de una estadística agregada?

> **Estado (2026-10-05): RESPONDIDA POR REMISIÓN — lectura de Lucas.** «Ver Protocolo de Acceso.md». Lectura de Lucas sobre el Protocolo §6.6: `disociado` y `agregado` equivalen para el guard (2 valores efectivos; la columna conserva 3). Guards fuera del 26/11.
> **Aterrizó en:** `handoff.md` §5.103 · `puntos-a-validar.md` §2.12. Respuesta verbatim en `respuestas-ippu-2026-10-05.txt`.

**Qué se pregunta.** La tabla de divulgación (M12.8a-3) clasifica cada salida de datos en tres grados:
**identificable**, **disociado/anonimizado** (un registro de una persona, pero sin poder saber quién) y
**agregado** (una estadística, sin individuos). El Protocolo §6.6 trata a los dos últimos casi igual
(«datos disociados o anonimizados»). ¿Para IPPU son lo mismo a efectos de registro y de permiso, o hay
que poder distinguir «le pasamos el caso anonimizado de un chico» de «le pasamos un número agregado»?
**Por qué importa.** Define si el guard de §6.6 (informes a dirección / convenio / donantes) mira dos
valores o tres, y si «anonimizado individual» necesita algún recaudo extra.
**Qué bloquea.** M11.3 (el guard de alcance del dato).
**Dónde aterriza.** `puntos-a-validar.md` §2.12 · `handoff.md` §5.80.

### B12 · Dar a la familia una copia de la HC del propio NNA, ¿es una divulgación o sólo un acceso?

> **Estado (2026-10-05): RESPONDIDA POR REMISIÓN — lectura de Lucas.** «Ver Protocolo de Acceso.md». Lectura de Lucas (matriz §5, Ley 18.335 art. 18 lit. A): la copia a la familia es un **acceso del titular**, no una divulgación → registro de accesos, posterior al 26/11. «Familia» queda en `DIVULGACION_DESTINATARIOS` como deuda conocida.
> **Aterrizó en:** `handoff.md` §5.103 · `puntos-a-validar.md` §2.12 y §2.17. Respuesta verbatim en `respuestas-ippu-2026-10-05.txt`.

**Qué se pregunta.** La Ley 18.335 Art. 18 **lit. A** le da al paciente (y a su representante) el
derecho a **acceder a su propia HC y a obtener copia** — es un derecho distinto del lit. D, que regula a
quién *más* se le puede mostrar. Cuando una familia pide y se lleva una copia de la HC de su hijo, ¿IPPU
lo vive como una **entrega de datos a un tercero** (que se registra en el log de divulgación, con
finalidad y responsable) o como un **acceso del titular** (que iría en el registro de accesos, §2.17)?
**Por qué importa.** Cambia en qué tabla se registra y qué recaudos aplican. Hoy la familia entra en
`DIVULGACION_DESTINATARIOS` como «Familia / representante legal», pero puede que ese caso no sea una
divulgación en el sentido del Protocolo §6.
**Qué bloquea.** M11.3 (dónde se registra la entrega al titular) y el registro de accesos (§2.17).
**Dónde aterriza.** `puntos-a-validar.md` §2.12 y §2.17 · `handoff.md` §5.80.

---

## C · Se lleva para el registro (no bloquea nada hoy)

### C1 · Las 6 bandas orientativas del IDEA
**Qué.** Reemplazamos las 3 bandas viejas (Leve/Moderada/Severa) por **6 tramos** con soporte DSM-5-TR
(0–15 / 16–30 / 31–55 / 56–75 / 76–90 / 91–96). Es catálogo nuestro, **sin confirmar por IPPU**.
**Dónde aterriza.** `respuestas-reunion-ippu-2026-08-21.md` §16 (6) · `handoff.md` §5.13.

### C2 · El estado de inclusión, ¿necesitan «foto» de un año pasado?
**Qué.** Decidimos que la ficha de inclusión es **una por expediente con estado vigente** (no una por
año). La pregunta afinada: cuando un chico cambia de escuela o de estado, ¿necesitan poder mirar después
**cómo estaba en 2025** como una foto de ese año, o alcanza con ver cómo está hoy y leer la bitácora de
gestiones?
**Por qué importa.** Si necesitan la foto, hace falta un **historial de estado fechado** (hoy el estado se
pisa en cada cambio).
**Dónde aterriza.** `puntos-a-validar.md` §1.15 · `respuestas-reunion-ippu-2026-08-21.md` §16 (8.c).
⚠️ **Aparece con redacción distinta en dos fuentes** (ver apéndice).

### C3 · La planilla del Área de Inclusión y sus 7 estados
**Qué.** ¿Nos pasan la planilla que hoy usa el área (está «todo en Drive, sin planilla estructurada»)? Y
los **7 estados** semaforizados que tomamos del prototipo, ¿son los que usan?
**Dónde aterriza.** `respuestas-reunion-ippu-2026-08-21.md` §16 (8.a, 8.b).

### C4 · Los 14 talleres de este año y a qué grupos se orientan
**Qué.** El Prototipo v4 trae 14 talleres con nombres oficiales; los cargamos. ¿La oferta 2026 coincide, y
a qué grupos se orienta cada uno? (Si difiere, es un cambio de datos, sin migración.)
**Dónde aterriza.** `consulta-a-ippu.md` §3.1 · `respuestas-reunion-ippu-2026-08-21.md` §16 (2.b).

### C5 · De dónde sale el porcentaje del baremo, y el anexo del Decreto 72/025
**Qué.** Asumimos que el **porcentaje** de la valoración funcional lo fija el **organismo oficial** y el
sistema lo registra tal cual (no lo calcula). ¿Es correcto? Y si tienen a mano el **anexo del Decreto
72/025**, nos sirve para verificar los cortes (0–4 / 5–24 / 25–49 / 50–95 / 96–100), que IPPU ya confirmó
como los que usa.
**Dónde aterriza.** `puntos-a-validar.md` §1.2 · `respuestas-reunion-ippu-2026-08-21.md` §16 (1.b) ·
`handoff.md` §7.

### C6 · Las 24 citas bibliográficas de la Escala IPPU-TEA
**Qué.** IPPU las dio por buenas en la reunión, pero **no quedó registrado quién las revisó ni cuándo**.
Si el instrumento se presenta formalmente ante un tercero, conviene que un técnico las repase.
**Dónde aterriza.** `puntos-a-validar.md` §1.4.

### C7 · HCE-DOC con alcance institucional
**Qué.** Modelamos que un documento pueda colgar de un expediente **o** de un ateneo (adjuntos, PPTX). ¿Le
ven otros usos institucionales al archivo documental más allá de los adjuntos de ateneo?
**Dónde aterriza.** `respuestas-reunion-ippu-2026-08-21.md` §16 (7.b) · `handoff.md` §5.25.

### C8 · Guía de trámites para las familias — falta dueño y una decisión
**Qué.** IPPU quiere una guía a mano para dar a las familias (BPS, MIDES, INAU; el trámite más consultado
es **AYEX**), y va junto con los informes. ¿El texto se **edita desde la aplicación** o es **fijo**? Y del
lado del equipo: falta quién la arma.
**Dónde aterriza.** `handoff.md` §5.49 / §6.

### C9 · ¿Cuánto del Prototipo v4 es material de IPPU y cuánto es relleno generado?
**Qué.** Los cuatro nombres de grupo «por color» (Azul/Celeste/Naranja/Verde) resultaron **inventados** y
venían **dentro del Prototipo v4**. Si eso pasó una vez, la fuente normativa que más peso tiene necesita
el mismo escrutinio: ¿qué partes del Prototipo v4 son contenido de IPPU y cuáles son datos de demostración?
**Dónde aterriza.** `handoff.md` §5.37 / §6.
⚠️ **Nota — 2026-09-09.** En septiembre de 2026 IPPU compartió un **segundo artefacto alojado en Netlify**:
un «Catálogo de puertas — orientación y derivación» de **96 entradas en 12 áreas**. Lucas confirmó con
Fernando Sierra que **lo generó con IA**. Es material de la **línea L3** (el asistente conversacional),
**no de L1**; sus archivos fuente no están disponibles y queda **deliberadamente fuera del alcance** de
estas sesiones. Por qué toca a C9: el **Prototipo v4** —fuente normativa de precedencia 1, **por encima
del Documento Técnico**— vino del **mismo autor y por la misma vía de publicación**, y §5.37 ya encontró
relleno generado adentro, leído como fuente (los cuatro nombres de grupo por color). Esto **no reabre
nada de lo ya construido**: sube la vara de escrutinio para cualquier cosa nueva que llegue por esta vía.
Es una advertencia dentro de una nota de trabajo — no abre entrada de §5 y no cambia ninguna decisión;
§5.10 (precedencia) no se toca.

### C10 · Numeración de las líneas de trabajo (aclaración de 30 segundos)
**Qué.** La intro del cuestionario que les enviamos apunta a preguntas con una numeración vieja (habla de
«3.2, las citas de la escala», pero en el documento §3.2 es otra cosa). Aclararlo de palabra, no reescribir
lo enviado.
**Dónde aterriza.** `handoff.md` §6 · agenda §1.

### C11 · La población total: ¿son ~120 NNA o 138 (30 INAU + 108 BPS)?
**Qué.** Nuestras notas arrastran dos cifras para lo mismo: **~120 NNA en total** y, a la vez, **30 del
convenio INAU + 108 de BPS**, que suman **138**. No sabemos cuál es la buena ni de dónde salió cada una
(pueden ser cortes distintos: matriculados vs. activos, un año vs. otro, con o sin Taller Terapéutico /
Clínica).
**Por qué importa.** No bloquea nada —son datos de contexto, no del modelo— pero la discrepancia aparece
en varios lugares del repo y conviene tener un número único con su definición.
**Dónde aterriza.** `handoff.md` §9 y §1.

---

## Apéndice — conteo por fuente y solapamientos

**Conteo de ítems abiertos consolidados, por fuente** (un ítem puede venir de varias):

| Fuente | Ítems abiertos aportados | Cuáles |
|---|---|---|
| `puntos-a-validar.md` §1 | **5** | §1.5 (A2) · §1.6 (A1) · §1.15 (C2) · §1.16 (B1) · §1.17 (B9) |
| `puntos-a-validar.md` §3 (supuestos) | **2** | roles de los técnicos = texto libre (B5) · reingreso >12 meses = línea base nueva (B10) |
| `puntos-a-validar.md` §2 (para el equipo, pero los contesta IPPU) | **2** | §2.11 (B5/B6) · §2.13 (B7) |
| `consulta-a-ippu.md` | **4** | §2.2 (B10) · §2.4 (B5) · §3.1 (C4) · §3.2 a medias (A2) |
| `respuestas-reunion-ippu-2026-08-21.md` §16 | **15** | 9.a (A4) · 1.b (C5) · 2.a (B3) · 2.b (C4) · 3.b (B2) · 5.c (B6) · 5.d (B5) · 6 (C1) · 7.b (C7) · 8.a (C3) · 8.b (C3) · 8.c (C2) · 13.a (B8) · 12 a medias (A1) · 13.b a medias (B4) |
| `handoff.md` §6 | **4** | §5.38 consentimiento (A3) · §5.49 guía de trámites (C8) · §5.37 relleno del prototipo (C9) · aclaración de la intro (C10) |
| ⚠️ CONFIRMABLE (`handoff.md` §5.38, §5.58/§5.63) | **2** | consentimiento no traba (A3) · ateneo de grupo = acceso general (A4) — ya contados arriba |
| Nuevas / afiladas en L9 | **2** | «perfil de área de Inclusión» + lista de 5 roles (B5) · tipos de informe y «área configurable» (B7) |
| Nuevas en M12.8a-3 (al construir `divulgacion`, `handoff.md` §5.80) | **2** | anonimizado individual vs. estadística agregada en el log (B11) · copia de la HC a la familia = ¿divulgación o acceso? Ley 18.335 Art. 18 lit. A (B12) |
| Nueva en M12.8b-2 (sincronización de prosa, `handoff.md` §9/§1) | **1** | población total: ~120 vs. 138 (30 INAU + 108 BPS) (C11) |

**Total de preguntas distintas tras deduplicar: 28** (A1–A5, B1–B12, C1–C11). *(La fila «Nuevas / afiladas en L9» dejó de contar A5: respondida el 2026-10-05, `handoff.md` §5.107.)*

**Preguntas que aparecen en dos fuentes con redacción distinta:**

1. **Plazo / naturaleza del reingreso (B10).**
   - `consulta-a-ippu.md` §2.2 lo plantea como *«¿cuánto tiempo tiene que pasar para considerar un
     reingreso?»* — pregunta de umbral.
   - `puntos-a-validar.md` §3 lo plantea, **después** de saber que el IDEA es anual, como *«reingreso deja
     de ser lo que abre una instancia nueva»* — pregunta de si el concepto sigue teniendo sentido.
   - **Es la misma pregunta de fondo**, en dos momentos distintos del proyecto. Se lleva la segunda
     redacción, que es la vigente.

2. **Anualización del estado de inclusión (C2).**
   - `respuestas-reunion-ippu-2026-08-21.md` §16 (8.c) lo plantea binario: *«¿se anualiza el estado de
     inclusión, sí o no?»*.
   - `puntos-a-validar.md` §1.15, **reformulado el 2026-09-03**, lo plantea como *«¿necesitan una foto de
     un año pasado, o alcanza con el estado de hoy + la bitácora?»*, y agrega qué historial de estado
     falta en el modelo.
   - **Misma pregunta de fondo, reencuadrada.** Se lleva la redacción de §1.15.

3. **Roles de los técnicos (B5).** `consulta-a-ippu.md` §2.4 pregunta sólo por la etiqueta (texto libre vs.
   lista); `respuestas` §16 (5.d) pregunta qué es «tutor»; el análisis de L9 (`handoff.md` §5.72) agrega la
   lista de 5 perfiles y el «perfil de área de Inclusión». **Se unifican en B5** como una sola pregunta con
   tres partes.
