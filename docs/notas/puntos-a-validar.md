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

### 1.3 Catálogo real de talleres
**Qué es.** La lista completa de talleres del plan IPPU, con sus nombres oficiales.

**Por qué importa.** Hay una inconsistencia sin resolver: la demo usa **8** talleres, el
documento de esquema menciona **18**, y no encontramos ninguna fuente que los liste. Se
cargaron los 8 verificables.

**Qué bloquea.** Nada urgente — es un catálogo, se completa con un INSERT. Importa cuando se
quiera usar el cruce taller × evolución.

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
