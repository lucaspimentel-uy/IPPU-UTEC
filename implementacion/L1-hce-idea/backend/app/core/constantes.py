"""Constantes institucionales — texto fijo que no es dato configurable.

**Criterio de esta ronda (M12.1) para decidir tabla vs. constante:**

- **Tabla** si se consulta, se filtra, se ordena, o **la institución lo cambia**
  sin que nadie despliegue nada (bandas del IDEA, interpretación del Δ, baremo,
  recordatorios, talleres, centros educativos).
- **Constante** si es **texto fijo de presentación**: acompaña a un valor que ya
  está guardado, nadie lo consulta por sí mismo y cambiarlo es un cambio de
  código con revisión, que es exactamente lo que se quiere para el vocabulario.

Lo de acá es lo segundo. Está en `core/` y no en cada módulo para que schemas,
servicios y textos generados compartan una sola copia (`esquema-datos-v2.md` §4,
fila «Terminología §8.1»).
"""

# --------------------------------------------------------------------------
# IDEA
# --------------------------------------------------------------------------
#: Versión del manual con la que se aplicó una evaluación. El Prototipo v4 pide
#: explícitamente persistirla junto a cada IDEA firmado (`idea.manual_version`):
#: sin esto, un cambio de descriptores reescribe el pasado.
IDEA_MANUAL_VERSION = "Manual Unificado IDEA v1.0 (07/2026)"

#: Cita del instrumento. **1997/2002**, nunca "1997" suelto: la edición de 2002
#: es la que circula y la que citan los materiales de IPPU.
IDEA_CITA = "Rivière, Á. (1997/2002). IDEA — Inventario de Espectro Autista."

# --------------------------------------------------------------------------
# Consenso interjueces (D7 · `handoff.md` §5.16 · M12.2)
# --------------------------------------------------------------------------
# Los dos técnicos puntúan por separado y después consensúan. El Manual de
# Procedimientos v1.0 define el procedimiento **por la diferencia** entre las dos
# puntuaciones independientes, y llama a ese circuito «el único requisito
# metodológico invariante» del instrumento.
#
# **Constante y no catálogo, a propósito.** Por el criterio de arriba, un tramo
# es catálogo cuando la institución lo mueve sin desplegar (bandas del IDEA,
# baremo, interpretación del Δ). Estos tres tramos son lo contrario: son el
# invariante metodológico. Si alguien pudiera correr el umbral de la ambigüedad
# clínica con un UPDATE, dejaría de ser invariante — y los kappas calculados
# antes y después del UPDATE no serían comparables.

#: Tramos: (diferencia mínima, clave, qué corresponde hacer).
CONSENSO_PROCEDIMIENTOS: tuple[tuple[int, str, str], ...] = (
    (0, "registro", "Coincidencia: se registra la puntuación y se sigue."),
    (1, "discusion_breve", "Discusión breve entre los dos técnicos hasta acordar."),
    (2, "ambiguedad_clinica",
     "Ambigüedad clínica: exige documentar por escrito cómo se resolvió el consenso."),
)

#: Diferencia a partir de la cual hay ambigüedad clínica y la documentación pasa
#: a ser obligatoria. El **guard** que la exige para firmar vive en el servicio
#: (M11.3), no acá y no en la base: decisión §5.2.2.
CONSENSO_DIFERENCIA_AMBIGUEDAD = 2

# --------------------------------------------------------------------------
# Vocabulario institucional (§8.1)
# --------------------------------------------------------------------------
#: Términos **prohibidos** en todo texto generado, catálogo o etiqueta, con su
#: reemplazo. «Grave» describe a la persona; «severo» describe la intensidad del
#: apoyo que necesita, que es lo que el instrumento mide.
VOCABULARIO_PROHIBIDO: dict[str, str] = {
    "grave": "severo",
    "muy grave": "muy severo",
}

#: Alternativa preferida cuando el texto habla de la persona y no de la escala.
NECESIDAD_DE_APOYO = "alta necesidad de apoyo"

# --------------------------------------------------------------------------
# Likert de la Escala IPPU-TEA (`LIKERT_LBL` del prototipo)
# --------------------------------------------------------------------------
#: Etiquetas de los 5 valores. **Constante y no tabla**: acompañan a un entero
#: 1–5 que ya está guardado en `protocolo.items`, nadie consulta ni filtra por la
#: etiqueta, y su redacción difiere levemente entre el Manual y el código del
#: prototipo (Anexo B.6 del plan M12) — o sea que es justo el texto que conviene
#: que cambie con revisión y no por UPDATE.
LIKERT_ETIQUETAS: dict[int, str] = {
    1: "Regresión significativa",
    2: "Sin cambio observable",
    3: "Progreso leve / Emergente",
    4: "Progreso moderado / Consistente",
    5: "Progreso notable / Generalizado",
}

# --------------------------------------------------------------------------
# HCE-VF — dominios y niveles funcionales (`VF_DOMINIOS`, `VF_NIVELES`)
# --------------------------------------------------------------------------
#: Los 6 dominios funcionales con su referencia CIF. **Constante y no tabla:**
#: son la estructura fija de `valoracion_funcional.dominios` (JSONB con esas 6
#: claves), vienen de la CIF y no de IPPU, y agregarle un séptimo dominio no es
#: un UPDATE sino un cambio de formulario. La clave es lo que se persiste.
VF_DOMINIOS: tuple[tuple[str, str, str], ...] = (
    ("comunicacion", "Comunicación (comprender y expresarse, con o sin apoyos)", "CIF d310–d360"),
    ("autocuidado", "Autocuidado (alimentación, higiene, vestido)", "CIF d510–d570"),
    ("movilidad", "Movilidad y desplazamientos", "CIF d450–d470"),
    ("aprendizaje", "Aprendizaje y aplicación del conocimiento", "CIF d110–d179"),
    ("interacciones", "Interacciones y relaciones interpersonales", "CIF d710–d799"),
    ("comunidad", "Vida doméstica, comunitaria y uso de servicios", "CIF d610–d699 · d910–d999"),
)

#: Escala ordinal de apoyo de cada dominio. `""` = sin registrar.
VF_NIVELES: tuple[str, ...] = ("", "Autónomo", "Apoyo ocasional", "Apoyo frecuente", "Apoyo permanente")

# --------------------------------------------------------------------------
# HCE-ORG / guía de prestaciones
# --------------------------------------------------------------------------
#: Prestación y estado del trámite BPS (`BPS_PRESTACIONES`, `BPS_ESTADOS`).
#: **Constante:** hoy `organismo_bps.prestacion` y `.estado` son texto libre y el
#: valor queda guardado en el expediente; esto son las opciones sugeridas del
#: formulario. Pasan a tabla el día que el panel institucional necesite filtrar
#: por estado — hoy no lo hace.
BPS_PRESTACIONES: tuple[str, ...] = (
    "Ayuda Extraordinaria (AYEX) — instituto habilitado",
    "Ayuda Extraordinaria (AYEX)",
    "Asignación Familiar por discapacidad",
    "Pensión por invalidez (del hogar)",
    "Otra",
)

BPS_ESTADOS: tuple[str, ...] = (
    "Vigente", "En trámite", "Observada", "Vencida", "Denegada", "No corresponde",
)

#: Guía orientativa de prestaciones (§7.7). **Constante:** es material
#: informativo que se muestra al equipo; no se referencia desde ningún registro
#: del expediente, así que una tabla sólo agregaría FKs que nadie usa.
PRESTACIONES: tuple[tuple[str, str, str], ...] = (
    ("Registro Nacional de Personas con Discapacidad (RNPcD)", "MIDES",
     "Inscripción voluntaria a partir de la valoración con el BUND. Puerta de entrada a "
     "prestaciones y programas."),
    ("Ayuda Extraordinaria (AYEX)", "BPS",
     "Contribución para la concurrencia a institutos habilitados (como IPPU). Se gestiona y se "
     "sigue desde HCE-ORG."),
    ("Asignación Familiar por discapacidad", "BPS",
     "Prestación económica; puede corresponder duplicación según la situación. Requiere "
     "valoración vigente."),
    ("Pensión por invalidez", "BPS",
     "Para situaciones de discapacidad severa según baremo y condiciones del hogar. Resolución "
     "exclusiva de BPS."),
    ("Asistentes personales", "Sistema Nacional Integrado de Cuidados (MIDES)",
     "Para situaciones de dependencia severa, según valoración del Sistema de Cuidados."),
    ("Transporte accesible / boleto", "Intendencias · MTOP",
     "Beneficios de transporte según normativa departamental y nacional."),
    ("Cuota laboral (4 % en el Estado · Ley 19.691 en el sector privado)", "ONSC · MTSS",
     "Relevante para adolescentes y jóvenes en transición a la vida adulta; requiere inscripción "
     "en el RNPcD."),
    ("Apoyos a la inclusión educativa", "ANEP · MEC",
     "Adaptaciones curriculares, acompañamiento y protocolos de inclusión según normativa "
     "educativa vigente."),
)

# --------------------------------------------------------------------------
# Ateneos y jornadas (M12.7 · `AT_TIPOS` del Prototipo v4)
# --------------------------------------------------------------------------
#: Los 4 tipos de registro, como **clave → etiqueta**.
#:
#: **Constante y no catálogo, a propósito** — y es la decisión más consecuente
#: del módulo. Por el criterio de arriba, un valor es catálogo cuando la
#: institución lo mueve sin desplegar. `AT_TIPOS` **parece** eso (la lista
#: alimenta un filtro y un `<select>`), pero es lo contrario: el tipo es el
#: **discriminador que decide qué es el registro** — qué referencias son
#: obligatorias, cuáles están prohibidas y qué bloque del formulario se
#: renderiza. Los CHECK de `ateneo` están escritos contra estas cuatro claves.
#:
#: **Modo de falla que evita.** Con catálogo editable, coordinación agrega
#: «Ateneo de familia» desde la app; los CHECK están escritos como
#: `tipo = 'clinico' OR …`, así que el tipo nuevo **cae fuera de todos**: la fila
#: se guarda sin NNA, sin grupo, y con campos de jornada y de desarrollo clínico
#: a la vez. Nadie despliega, nadie revisa, y el módulo acepta en silencio un
#: registro cuyo formulario no tiene secciones definidas. Como constante, sumar
#: un quinto tipo es un cambio que toca a la vez esta línea, los CHECK y los
#: tests — que es exactamente la revisión que se quiere.
#:
#: Mismo razonamiento que `CONSENSO_PROCEDIMIENTOS`, y misma forma que los
#: dominios cerrados que ya gobiernan comportamiento en el esquema
#: (`protocolo.tipo`, `evento.tipo`, `registro_organismo.organismo`,
#: `servicio.clave`): **CHECK IN (...) + constante**, nunca tabla.
#:
#: **Se persiste la clave, no la etiqueta** (segunda mitad del criterio de este
#: archivo: texto fijo de presentación que acompaña a un valor ya guardado). Si
#: IPPU reformula «Ateneo clínico (NNA)», no se reescribe ni una fila.
ATENEO_TIPOS: dict[str, str] = {
    "clinico": "Ateneo clínico (NNA)",
    "grupo": "Ateneo de grupo",
    "institucional": "Ateneo institucional",
    "jornada": "Jornada de capacitación",
}

#: Prefijo del código visible (`AT-2026-001`). **Uno solo para los cuatro
#: tipos**, aunque el seed del prototipo muestre `JC-2026-001` para la jornada:
#: su `atNuevo()` genera siempre `AT-` y su contador (`a.id.includes(anio)`)
#: cuenta las dos formas en **una sola serie**, o sea que el propio prototipo no
#: implementa las series separadas que su seed sugiere. Además `tipo` es
#: editable después de crear: con prefijo por tipo, corregir un tipo mal cargado
#: cambiaría el identificador de un registro ya circulado.
#:
#: `AT` se lee como el **módulo** («Ateneos y Capacitación»), no como el tipo.
#: Pregunta abierta con IPPU (`docs/notas/consulta-a-ippu.md`): si prefieren
#: `JC-` para jornadas, es **una línea de `Ateneo.codigo`** y cero migración,
#: porque el código es derivado y no la PK.
ATENEO_CODIGO_PREFIJO = "AT"


# --------------------------------------------------------------------------
# HCE-INC · Inclusión educativa y social (M12.5 · Prototipo v4)
# --------------------------------------------------------------------------
# Los cinco vocabularios del módulo salen de la **capa de catálogos** del
# Prototipo v4 —`const INC_* = [...]` declaradas dentro del bloque de HCE-INC y
# consumidas por sus propias funciones (`incChip`, `mInc`, `incAdd`)—, no del
# seed de su base de demostración. La clasificación completa, con la evidencia
# de cada uno, está en `handoff.md` §5.50 (J1).
#
# **De los cinco, sólo `INC_ESTADOS` es tabla** (`estado_inclusion`): es el
# único que tiene atributos propios —descripción y semáforo— y que el módulo
# **consulta por sí mismo**, renderizándolo como tabla de referencia mientras el
# técnico decide. Los otros cuatro son listas planas de cadenas sin atributos:
# por el criterio de la cabecera de este archivo, constante.

#: Tipos de centro educativo o socioeducativo (`INC_TIPOS`, 10).
#:
#: **Constante y no catálogo.** Es una clasificación del **sistema educativo
#: nacional** (ANEP, UTU, liceo público/privado), no de IPPU: un tipo nuevo lo
#: crea el Estado, no coordinación, así que incorporarlo es un cambio de código
#: con revisión y no un `UPDATE`. No tiene atributos que consultar y la lista se
#: cierra con «Otro», que es lo que absorbe el caso no previsto sin bloquear la
#: carga.
#:
#: Gobierna **dos** columnas —`inclusion.tipo_centro` y
#: `catalogo_centro_educativo.tipo`— y ese es el segundo motivo para que sea una
#: sola constante: son dos afirmaciones sobre sujetos distintos («este NNA
#: concurre a un centro de este tipo» / «este centro es de este tipo»), y lo
#: único que no puede pasar es que usen dos vocabularios distintos.
INCLUSION_TIPOS_CENTRO: tuple[str, ...] = (
    "Escuela especial (ANEP)",
    "Escuela común (ANEP)",
    "Educación inicial / jardín",
    "Liceo público",
    "Liceo privado",
    "UTU / educación técnica",
    "Taller de continuidad educativa",
    "Centro privado especializado",
    "Maestra comunitaria / domiciliaria",
    "Otro",
)

#: Temas de una entrada de bitácora (`INC_TEMAS`, 5).
#:
#: **Constante y no catálogo — y es la decisión más consecuente del módulo**,
#: por el mismo motivo que `ATENEO_TIPOS` (M12.7): el tema es el
#: **discriminador** contra el que está escrita la derivación de `sensible`.
#:
#: **Modo de falla que evita.** Con catálogo editable, el área agrega «Salud
#: mental» desde la app; la derivación está escrita como
#: `tema = 'Clínica — sensible'`, así que el tema nuevo **cae fuera** y la
#: entrada queda clasificada como no sensible **sin que nadie lo decida**. La
#: consecuencia concreta no es cosmética: es información familiar grave
#: circulando junto al dato escolar, que es exactamente lo que la segmentación
#: existe para evitar. Como constante, sumar un sexto tema toca a la vez esta
#: línea, el CHECK y los tests — que es la revisión que se quiere.
INCLUSION_TEMAS: tuple[str, ...] = (
    "Educativa / pedagógica",
    "Coordinación interinstitucional",
    "Familiar / social",
    "Trámite o gestión",
    "Clínica — sensible",
)

#: El tema del que se deriva `sensible`. Se nombra una sola vez, acá: el modelo,
#: el CHECK y los tests lo leen de esta constante, así que no hay forma de que la
#: cadena del modelo y la del catálogo se separen (`InclusionBitacora.sensible`).
INCLUSION_TEMA_SENSIBLE = "Clínica — sensible"

#: Medio por el que se hizo la gestión (`INC_MEDIOS`, 7).
#:
#: **Constante con CHECK, y no texto libre**, aunque no gobierne comportamiento:
#: el módulo existe para que el área tenga indicadores («cantidad de
#: articulaciones por caso», por qué medio se articula), y con texto libre
#: «WhatsApp», «whatsapp» y «wsp» son tres categorías distintas y el indicador
#: se vuelve ruido. «Otro» es la salida para el caso no previsto.
INCLUSION_MEDIOS: tuple[str, ...] = (
    "WhatsApp",
    "Llamada",
    "Reunión presencial",
    "Videollamada",
    "Correo",
    "Visita al centro",
    "Otro",
)

#: Rol del interlocutor de una gestión (`INC_ROLES`, 8). Mismo criterio que
#: `INCLUSION_MEDIOS`. «INAU» es un organismo del Estado ya modelado en HCE-ORG,
#: no un nombre propio de IPPU: el vocabulario no trae nada institucional
#: específico (ver la clasificación de §5.50).
INCLUSION_ROLES: tuple[str, ...] = (
    "Familia",
    "Centro educativo",
    "Acompañante terapéutico",
    "Maestra comunitaria / itinerante",
    "INAU",
    "Equipo de salud",
    "Otra institución",
    "Otro",
)

#: Estado inicial de la ficha de inclusión, y **el único que el sistema asigna
#: solo**: el Prototipo v4 lo excluye del `<select>` con el que el área cambia
#: el estado (`INC_ESTADOS.filter(e => e.n !== 'Sin registrar')`), porque no es
#: una situación que alguien elija sino la ausencia de registro. Es el
#: `server_default` de `inclusion.estado` y el fallback del tablero.
INCLUSION_ESTADO_INICIAL = "Sin registrar"

#: Presencia de asistente personal / acompañante terapéutico.
#:
#: ⚠️ **No estaba declarado como catálogo en el prototipo y el plan M12 no lo
#: registra como dominio**: los tres valores están **inline** dentro del
#: `<select>` de `mInc()`, sin nombre. No es contenido de la capa de catálogos
#: ni relleno del seed —las dos categorías que ordena §5.50—, así que se
#: clasifica y se declara: es un **dominio de tres estados** («no tiene»,
#: «tiene», «lo está tramitando»), y el tercero es información de gestión que un
#: booleano perdería.
INCLUSION_AT_ESTADOS: tuple[str, ...] = (
    "No",
    "Sí",
    "En trámite (lista de espera)",
)

#: Niveles del semáforo del tablero del área, tal como los usa `estado_inclusion.
#: semaforo`. Del prototipo se toma la **semántica** y se descarta su
#: implementación: ahí los valores son clases CSS (`inc-ok`, `inc-warn`,
#: `inc-danger`, `inc-off`) y acá se guarda el nivel sin el prefijo, porque el
#: nombre de una clase de hoja de estilos no es un dato del dominio.
INCLUSION_SEMAFOROS: tuple[str, ...] = ("ok", "warn", "danger", "off")

#: Días sin gestiones registradas a partir de los cuales el módulo avisa. El
#: prototipo lo llama «umbral configurable» y ya existe como fila de
#: `recordatorio` (clave `inc`, M12.1), que es donde coordinación lo ajusta: acá
#: está sólo como el valor con el que nació, para que el número no quede suelto
#: en una consulta de M11.3. **No bloquea nada** (§4).
INCLUSION_ALERTA_DIAS = 60


# --------------------------------------------------------------------------
# HCE-PAI · Propuesta de Atención Individual (M12.6 · Prototipo v4)
# --------------------------------------------------------------------------
# Los vocabularios del módulo salen de la **capa de catálogos** del Prototipo v4
# (`const PAI_* = [...]`, `HCE_IPPU_Prototipo_v4.html:947-996`), que es lo que
# §5.50 (J1) clasifica como normativo. La decisión tabla-vs-constante de los tres
# está en `handoff.md` §5.56 (L3); el resumen del criterio, acá.
#
# **Los tres son constante, y el prototipo mismo lo dice.** Por el criterio de la
# cabecera de este archivo, un vocabulario es tabla cuando la institución lo
# mueve sin que nadie despliegue. `CAT_TALLERES` es ese caso y por eso es tabla
# (M12.3): el prototipo le da **cuatro funciones de gestión** —`tallerAdd`,
# `tallerToggle`, `tallerGrupos`, `tallerGestion`—. `PAI_AREAS`, `PAI_PREST` y
# `PAI_CIRCUITO` **no tienen ninguna**, y cada una aparece exactamente **dos
# veces** en todo el archivo: la declaración y el único lugar que la consume. La
# misma fuente que hizo administrable la oferta de talleres dejó estas tres
# fijas, a propósito.
#
# **Se persiste el valor, no el índice.** El prototipo marca las de `checks()`
# por **posición** (`P[campo][ix]`, `paiChk`), y esa forma no se copia: un índice
# es un artefacto de cómo se dibujó la lista, no un dato del dominio —el mismo
# recorte que `INCLUSION_SEMAFOROS` le hizo a las clases CSS del tablero—.
# Guardar la posición haría que insertar un ítem reescribiera en silencio lo ya
# registrado, que es exactamente lo que D5 (§5.14) existe para impedir.

#: Áreas de un objetivo del PAI (`PAI_AREAS`, 9).
#:
#: **Constante y no catálogo.** No tiene atributos que consultar, nadie la
#: renderiza como tabla de referencia (a diferencia de `estado_inclusion`, que
#: sí) y cierra con «Otra», que absorbe el caso no previsto sin bloquear la
#: carga. Mismo criterio que `INCLUSION_MEDIOS` e `INCLUSION_ROLES`: **CHECK y
#: no texto libre**, porque «cuántos objetivos por área» es justo el indicador
#: que el módulo habilita, y con texto libre «Autonomía y AVD», «autonomia» y
#: «AVD» son tres áreas distintas.
#:
#: ⚠️ **No confundir con el «área configurable» de `puntos-a-validar.md` §2.13**,
#: que IPPU pidió en la reunión: aquello es el **área de generación de
#: informes** (M11.3/M11.4), no el área de un objetivo. Son dos cosas distintas
#: con el mismo nombre y no comparten vocabulario.
PAI_AREAS: tuple[str, ...] = (
    "Comunicación y lenguaje",
    "Interacción social",
    "Desarrollo cognitivo",
    "Autonomía y AVD",
    "Regulación emocional",
    "Flexibilidad y anticipación",
    "Juego y simbolización",
    "Motricidad",
    "Otra",
)

#: Plazo de un objetivo. Está **inline** en el `<select>` del prototipo, sin
#: nombre de constante —igual que `INCLUSION_AT_ESTADOS`—, así que se clasifica y
#: se declara: es un dominio cerrado de tres valores, no texto libre.
PAI_PLAZOS: tuple[str, ...] = ("Trimestral", "Semestral", "Anual")

#: Prestaciones y certificaciones vigentes que el PAI declara (`PAI_PREST`, 6).
#:
#: **Constante y no catálogo**, por el mismo motivo que `INCLUSION_TIPOS_CENTRO`:
#: el dominio no es de IPPU. Son prestaciones y certificaciones **del Estado**
#: (BPS, Ley 20.378 / Dec. 72/025) — una nueva la crea la normativa, no
#: coordinación, así que incorporarla es un cambio de código con revisión.
#: Cierra con «Otra (detallar en observaciones)», y el detalle tiene dónde ir:
#: `pai.prest_obs`.
#:
#: ⚠️ **No es el vocabulario de `BPS_PRESTACIONES`, y la diferencia importa.**
#: Aquél describe **el trámite** que HCE-ORG sigue (`organismo_bps.prestacion`,
#: con su `estado` y su `vencimiento`); éste describe **qué tiene vigente el NNA**
#: al momento de escribir el PAI, e incluye dos ítems que no son prestaciones
#: BPS: la Valoración Funcional y el certificado de discapacidad. Son dos
#: afirmaciones sobre sujetos distintos, como `inclusion.tipo_centro` y
#: `catalogo_centro_educativo.tipo`. **La tensión que esto deja abierta —dos
#: lugares que dicen algo sobre prestaciones— está anotada en
#: `docs/notas/puntos-a-validar.md` §2.15**, no resuelta acá.
PAI_PRESTACIONES: tuple[str, ...] = (
    "Pensión por invalidez (BPS)",
    "Asignación familiar",
    "AYEX — Ayudas Extraordinarias",
    "Valoración Funcional (Ley 20.378 / Dec. 72/025)",
    "Certificado de discapacidad",
    "Otra (detallar en observaciones)",
)

#: Circuito institucional de seguimiento del PAI (`PAI_CIRCUITO`, 4).
#:
#: **Constante y no catálogo**, y es el más claro de los tres: no son opciones de
#: una lista sino **el procedimiento institucional escrito en oraciones
#: completas** («Revisión intermedia de objetivos (semestral)»). Cambiarlo es
#: cambiar el procedimiento —un acto documentado, con revisión—, no un `UPDATE`
#: desde una pantalla. **Es el único de los tres que no cierra con «Otra»**: el
#: circuito es cerrado a propósito.
#:
#: Mismo lugar que `CONSENSO_PROCEDIMIENTOS` ocupa para el IDEA: el invariante
#: metodológico del módulo.
PAI_CIRCUITO: tuple[str, ...] = (
    "Seguimiento de evolución en reuniones mensuales de coordinación",
    "Revisión intermedia de objetivos (semestral)",
    "Informe anual en diciembre (técnicos de referencia y equipo de coordinación)",
    "Registro de evoluciones en la HCE",
)

#: Tipo de propuesta. Discriminador **con consecuencia**: el prototipo habilita
#: la sección IX (evaluación del PAI anterior) sólo cuando vale
#: «Actualización anual» (`esAct`). Mismo papel que `ATENEO_TIPOS` en M12.7.
PAI_TIPOS: tuple[str, ...] = ("PAI inicial (ingreso)", "Actualización anual")

#: El tipo que habilita la sección IX. Se nombra una sola vez, acá.
PAI_TIPO_ACTUALIZACION = "Actualización anual"

#: Estado de los controles de salud (§IV). Inline en el prototipo.
PAI_CONTROLES: tuple[str, ...] = ("Al día", "Pendientes", "En regularización")

#: Grado de acuerdo de la familia con la propuesta (§VIII). Inline en el
#: prototipo. **No es booleano**: «Sí — informada» y «Parcialmente» son estados
#: intermedios que un `bool` perdería, y la pauta INAU pide constancia del
#: acuerdo, no sólo de la notificación.
PAI_ACUERDO_FAMILIA: tuple[str, ...] = (
    "Sí — acuerdo expreso",
    "Sí — informada",
    "Parcialmente",
    "Pendiente",
)

#: Frecuencia semanal de concurrencia (§XI). Inline en el prototipo. Se guarda
#: **la frase, no el número**: el prototipo la escribe así y descomponerla
#: obligaría a decidir qué significa la asistencia parcial, que ninguna fuente
#: define. Mismo criterio que `inclusion.dias_horas`.
PAI_FRECUENCIAS: tuple[str, ...] = ("1 vez", "2 veces", "3 veces", "4 veces", "5 veces")

#: Etapa del proceso de atención (§XI). Inline en el prototipo.
PAI_ETAPAS: tuple[str, ...] = (
    "Adaptación / ingreso",
    "Proceso en curso",
    "Preparación de transición / egreso",
)

#: Grado de logro de un objetivo del PAI anterior (§IX). Inline en el prototipo.
PAI_LOGROS: tuple[str, ...] = (
    "Logrado",
    "Parcialmente logrado",
    "No logrado",
    "Discontinuado",
)

#: Qué se decide con ese objetivo de cara al período nuevo (§IX). Inline en el
#: prototipo. Es la bisagra entre un PAI y el siguiente.
PAI_DECISIONES: tuple[str, ...] = (
    "Se cierra",
    "Continúa igual",
    "Continúa reformulado",
    "Se reemplaza",
)

#: Marco por el que el NNA está en IPPU (§II). Inline en el prototipo.
PAI_DISPOSICIONES: tuple[str, ...] = ("INAU", "Judicial")

#: Dominio de los dos campos «Sí / No» del formulario (§XIII se coordina, §XV
#: participó de la elaboración). **Texto y no booleano**: el dominio real tiene
#: tres estados —«sí», «no» y «todavía no se contestó»— y un `bool` nullable
#: diría lo mismo peor, obligando a la UI a distinguir `False` de `None` sin
#: ayuda del dominio.
PAI_SI_NO: tuple[str, ...] = ("Sí", "No")

#: Los 6 actores con los que el PAI declara si se coordina (§XIII). El prototipo
#: los **precarga como filas fijas** en cada PAI nuevo (`coords:[…]`) y no ofrece
#: agregar ni quitar: la pauta INAU pregunta por estos seis, y un PAI que no los
#: responda está incompleto. De ahí que sean constante y que `pai_coordinacion`
#: nazca con las seis filas.
PAI_COORDINACION_ACTORES: tuple[str, ...] = (
    "Familia y/o referentes de hogar",
    "Equipo médico tratante",
    "Docente de educación formal / informal",
    "Equipo de clínica",
    "INAU / supervisión de convenio",
    "Otros (especificar)",
)


# --------------------------------------------------------------------------
# HCE-DIV · Divulgación de datos (M12.8a · Protocolo de acceso)
# --------------------------------------------------------------------------
# Los dos vocabularios de `divulgacion` (M12.8a-3) salen del **Protocolo
# institucional de acceso, confidencialidad y resguardo de la HC** —matriz §5 y
# procedimientos §6.2–6.7—, no del Prototipo v4, que no modela la divulgación.
# La decisión de crear la tabla y de dónde salen sus columnas está en
# `handoff.md` §5.71; cómo quedó construida, en §5.80.
#
# **Constante con CHECK, no catálogo**, por el criterio de la cabecera de este
# archivo: son categorías normativas —las fija la ley y el Protocolo, no
# coordinación con un UPDATE—, no tienen atributos propios que consultar, y el
# módulo existe para poder auditar la divulgación (Protocolo §8), cosa que con
# texto libre se vuelve ruido. Mismo lugar que `INCLUSION_MEDIOS` /
# `INCLUSION_ROLES` / `PAI_AREAS`. **Se persiste el valor**, no un índice.

#: A quién se comunicó el dato — las **categorías de actor de la matriz §5** del
#: Protocolo (`handoff.md` §5.71). No es una lista de la aplicación: el paciente,
#: la familia, los organismos y los terceros son **destinatarios** gobernados por
#: los procedimientos §6, no usuarios que inician sesión (§5.72).
DIVULGACION_DESTINATARIOS: tuple[str, ...] = (
    "Familia / representante legal",
    "Tercero autorizado por escrito",
    "INAU",
    "MSP / BPS",
    "Ministerio Público",
    "Poder Judicial",
    "Dirección institucional / gobierno / Consejo de Administración",
    "Organismo convenio / donante",
    "Equipo de investigación (convenio UTEC-LIDIA)",
)

#: Con qué grado de identificación salió el dato. **Tokens cortos y estables**
#: (como `INCLUSION_SEMAFOROS`) porque este es el valor contra el que M11.3 va a
#: escribir el guard del Protocolo §6.6 —informes a dirección, convenio y
#: **donantes** *deben* ser disociados o anonimizados— y §6.7 —UTEC-LIDIA
#: prioriza disociado/anonimizado—. `"disociado"` abarca «disociado o
#: anonimizado» del §6.6; `"agregado"` es la estadística sin individuos.
DIVULGACION_ALCANCES: tuple[str, ...] = ("identificable", "disociado", "agregado")
