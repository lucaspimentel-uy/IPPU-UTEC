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
