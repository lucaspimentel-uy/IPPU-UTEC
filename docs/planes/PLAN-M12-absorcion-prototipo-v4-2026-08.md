# Plan M12 — Absorción del Prototipo v4 de IPPU en el backend

> **Para Claude Code.** Se lee junto con `handoff.md` y `CLAUDE.md`. Rige la **regla anti-contradicción**
> (`handoff.md` §12.6): si algo choca con una decisión ya registrada en §5, se frena y se resuelve por
> escrito. Este plan trae sus propias contradicciones con §5 ya identificadas y resueltas en §0 — esas
> están habilitadas; cualquier otra, no.
>
> **Fuente normativa:** Manual de Procedimientos v1.0 + Especificaciones técnicas del **Prototipo v4**
> (IPPU, agosto 2026), publicado en `https://lovely-salmiakki-4db73d.netlify.app/`.
> Reemplaza al Documento Técnico v1.0 (jul-2026) donde haya conflicto (§0, D1).
>
> **Material de trabajo ya extraído** — no hay que volver a derivarlo:
> - `docs/markdown/prototipo-v4-referencia.md` — qué hay adentro del prototipo y dónde. **Leer esto.**
> - `docs/fuentes/prototipo-v4/prototipo-v4-catalogos.json` — 32 constantes (fichas IDEA, 60 descriptores,
>   24 ítems, 14 talleres, campos de PAI/INC/ateneos). Fuera del grafo por `.graphifyignore`.
> - `herramientas/extraer_prototipo_v4.js` — lo regenera desde la URL, para diffear si sale una v5.
>
> **Dónde se intercala:** entre **M11.2** (hecho) y **M11.3** (sin arrancar). Toca la misma capa que
> M11.2 — modelos, migración inicial, catálogos —, y por eso va antes: escribir los servicios de M11.3
> contra un modelo que está por cambiar es el trabajo que después hay que rehacer. **M11.3–M11.6 se
> retoman al cerrar M12**, ya cubriendo los módulos nuevos.

---

## Principio de la ronda — qué se toma y qué no

**El objetivo no es replicar el prototipo de IPPU: es trasladar a nuestro sistema la forma de trabajar de
la institución.** El prototipo v4 es la especificación más precisa que tenemos de esa forma de trabajar,
no un diseño a copiar. Nuestro producto tiene identidad propia y, en varios puntos, modela mejor que el
prototipo.

**Vinculante — es la institución, se toma tal cual:**
los 14 talleres · las 6 bandas del IDEA y su mapeo DSM · los 60 descriptores del Manual Unificado · las 15
secciones del PAI (es un formulario de INAU, no una elección de diseño) · los cortes del baremo y sus
implicancias · los 7 estados de inclusión · los 4 tipos de ateneo · la secuencia del año y sus plazos · las
reglas de firma, consenso y excepción · el vocabulario institucional.

**No vinculante — es su implementación, decidimos nosotros:**
nombres de campo (`sintLB`, `fort/oport/debil/amen`, `psicologa`/`maestra`) · cómo se agrupan las tablas ·
arrays planos `punt[12]`/`punt[24]` · paleta, tipografía y tokens de estilo · layout de pestañas y
navegación · routing · los iframes.

**El plan ya se aparta del prototipo donde conviene, a propósito:** D7 agrega la puntuación independiente
que ellos no tienen · D8 corrige sus roles hardcodeados · D9 arregla la tabla `grupo` que ninguno de los
dos había resuelto · M12.5 deriva `sensible` en vez de dejarlo suelto · M12.6 modela la carga única por
referencia en vez de copiar su objeto plano · M12.7 separa los acuerdos en tabla hija. Cuando el prototipo
y el buen modelado no coinciden, **gana el buen modelado** — y queda anotado en el commit.

---

## 0. Decisiones de esta ronda

Tomadas por Lucas al recibir el Prototipo v4. **Van escritas a `handoff.md` §5 en M12.0, antes de tocar
código.** Numeración sugerida §5.10 en adelante.

| # | Decisión | Qué deroga o amplía |
|---|---|---|
| **D1** | **Precedencia normativa:** Manual v1.0 + Prototipo v4 (ago-2026) **>** Documento Técnico v1.0 (jul-2026) **>** presentación 13.05.2026. | Actualiza la cabecera de `handoff.md` y §5.1.1 |
| **D2** | **Alcance: se cubre todo el modelo institucional que el Prototipo v4 especifica para el Servicio de Atención Diurna.** Sin triage sobre *qué* se cubre; con criterio propio sobre *cómo* se implementa (ver «Principio de la ronda»). | — |
| **D3** | **Clínica y Taller Terapéutico siguen fuera de alcance.** Están embebidos en el prototipo (`CLINICA_HTML_B64`, `TALLER_HTML_B64`) y montados en `<iframe>`, pero el propio prototipo declara esa integración "de navegación y presentación" y deja la identidad única "a resolver en el sistema definitivo". Resolvemos **solo la parte de modelo** — `persona` + `persona_servicio` ya la cubren. **No se extraen los base64.** | Ratifica §5.1.3 con fundamento nuevo |
| **D4** | **Bandas del IDEA: de 3 a 6 tramos**, con soporte DSM-5-TR, como **catálogo paramétrico**. | Deroga `handoff.md` §3 |
| **D5** | **Talleres: catálogo dinámico** administrado por coordinación. Participación **por nombre**. Se cargan **los 14 reales del prototipo**, que reemplazan a los 8 nuestros. | Deroga M11.2c y **cierra** `puntos-a-validar.md` §1.3 |
| **D6** | **Portabilidad: se amplía §5.2.3.** Suman como paramétricos: bandas IDEA, interpretación del Δ, catálogo de centros educativos, catálogo de talleres, recordatorios. Sigue **sin** capa `config_institucion` genérica ni UI de configuración. | Amplía §5.2.3 |
| **D7** | **Kappa: se modela ahora, se calcula después.** ⚠ **Esto es agregado nuestro, no del prototipo** — el prototipo guarda un único array de consenso (`punt[12]`, `punt[24]`) y no tiene puntuación por evaluador. Lo agregamos porque el Manual lo declara "el único requisito metodológico invariante" y porque después de M11.3 cuesta migración + reescritura de servicios. | Nuevo |
| **D8** | **Roles genéricos por defecto.** El prototipo declara portabilidad pero tiene `psicologa`/`maestra` hardcodeados como nombres de campo; nosotros no repetimos eso: `tecnicoN` + `tecnicoN_rol`. | Amplía §5.1.5 |
| **D9** | **`grupo` se corrige.** Dos motivos ahora, no uno: sigue sin admitir más de un año (`puntos-a-validar.md` §2.6) **y** la PK `id (A..E)` no representa el dominio real — los grupos de IPPU son **por color** (Azul, Celeste, Naranja, Verde). Implementar id propio + `UNIQUE(nombre, anio)`. | Cierra `puntos-a-validar.md` §2.6 |

**Lo que estas decisiones NO habilitan:** reabrir Postgres-only, mover lógica a triggers, o construir la
capa de configuración institucional completa. §5.2 sigue en pie.

---

## 1. Paso 0 — Incorporar el prototipo al repo

El gate bloqueante que tenía la primera versión de este plan **ya está resuelto**: el prototipo es un HTML
autocontenido de 406 KB (≈15 KB de markup/CSS y **387 KB de JavaScript** con todos los catálogos como
literales) y se extrajo entero. Lo que queda es incorporarlo.

1. **Bajar el original** a `docs/fuentes/prototipo-v4/HCE_IPPU_Prototipo_v4.html`
   (`curl -sSL <url> -o …`), junto al `prototipo-v4-catalogos.json` que ya está ahí. El nombre sigue la
   convención de `HCE_IPPU_Prototipo_v1.html`.
2. **No convertir el HTML con Docling.** Es una app JS: rinde el shell vacío, misma razón por la que el
   v1 es la excepción documentada en `docs/estructura-repositorio.md`. La diferencia es que el v4 **sí
   tiene versión legible** — `docs/markdown/prototipo-v4-referencia.md` —, producida por script en lugar
   de por Docling. La regla de conversión se cumple igual: se lee y se cita desde `docs/markdown/`.
3. **Actualizar los mapas de estructura**, que el cambio lo exige explícitamente:
   `docs/estructura-repositorio.md` (carpeta `docs/fuentes/prototipo-v4/`, el `.md` nuevo en
   `docs/markdown/`, el plan nuevo en `docs/planes/`, la herramienta nueva en `herramientas/`) y los mapas
   resumidos de `README.md` y `CLAUDE.md`.
4. **Verificar el punto de partida contra la realidad, no contra el handoff:** `alembic heads`, conteo de
   tablas, `pytest -q`, y el contenido de
   `implementacion/L1-hce-idea/backend/app/data/catalogos_iniciales.json`. El handoff describe el estado
   al 2026-08-07. Reportar cualquier diferencia antes de seguir.

---

## 2. No-goals

- **No se toca la demo** — `implementacion/L1-hce-idea/demo/` completa (12 módulos en `js/`,
  `index.html`, `verificacion/`). Ver §7 y §8.
- **No se construyen Clínica ni Taller**, ni se extraen sus base64 (D3).
- **No se calcula kappa.** Se guardan los datos que lo hacen posible (D7).
- **No se implementan servicios ni routers.** Esto es capa de modelo, catálogos y migración. Los guards
  son M11.3; este plan solo deja escrito qué tendrán que cubrir (§6).
- **No se toca autenticación.** La segmentación de HCE-INC se modela como **dato**, no como permiso.
- **No se migran expedientes reales.** El esquema debe *soportar* la estrategia de migración; ejecutarla
  es otra ronda y depende del acuerdo de confidencialidad.
- **No se copia nada de la capa de presentación del prototipo:** ni paleta, ni tipografías, ni tokens de
  estilo, ni layout, ni navegación. Nuestra demo tiene su propio `estilos.css` y su propia identidad.
- **No se heredan sus nombres de campo ni su agrupación de tablas.** Se usa la nomenclatura del esquema v2,
  y el mapeo prototipo → nuestro modelo se documenta en `backend/docs/esquema-datos-v2.md` v3.

---

## 3. Módulos

**Paralelismo:** M12.1 y M12.2 tocan tablas existentes → van **primero y solos**. M12.3 a M12.7 son
tablas nuevas e independientes → se reparten entre los tres (§12.3), cada uno en su archivo de
`app/models/`. M12.8 lo hace **una sola persona**.

**Regla de migraciones:** nadie corre `alembic revision --autogenerate` hasta M12.8. Se trabaja sobre los
modelos; la migración inicial única **se regenera una sola vez al cierre**, como en M11.2. Nada está
desplegado y no hay datos reales — apilar ocho migraciones no compra nada y tres autogenerate en paralelo
garantizan conflicto.

---

### M12.0 — Decisiones al papel y verificación del punto de partida
Sin código.
- Escribir D1–D9 en `handoff.md` §5 (fecha + autor). Actualizar cabecera (fuente normativa) y §3 (bandas).
- Confirmar D9 con el equipo antes de implementarla.
- Completar el §1: bajar el HTML, actualizar `docs/estructura-repositorio.md` + `README.md` + `CLAUDE.md`,
  y verificar el repo.
- **Verificación:** §5 contiene las decisiones y está pusheado a los dos remotos antes de M12.1.

---

### M12.1 — Correcciones al esquema existente
Primero, solo, con los tests de M11.2 corriendo después de cada cambio.

- **`banda_idea`** (catálogo paramétrico, 6 tramos): 0–15 Muy leve (Nivel 1) · 16–30 Leve (1) · 31–55 Leve
  a moderado (1–2) · 56–75 Moderado (2) · 76–90 Moderado a severo (2–3) · 91–96 Severo a muy severo (3).
  Copiar también el texto orientativo de cada banda desde `ideaInterpreta` — es deliberadamente neutro
  ("neutralidad metodológica": alude solo a escalas y dimensiones del IDEA, no prescribe abordajes) y
  reescribirlo rompe esa propiedad.
- **`delta_interpretacion`** (catálogo paramétrico, 6 tramos con etiqueta y acción, de `deltaInterpreta`).
  La alerta institucional Δ ≤ −7 pasa a derivarse de esta tabla, no de un número suelto.
- **`idea`**: agregar `manual_version` (persistir `'Manual Unificado IDEA v1.0 (07/2026)'` con cada
  evaluación firmada — el prototipo lo pide explícitamente al backend) y los campos de migración:
  `sistema_origen`, `fecha_original`, `fecha_migracion`, `responsable_migracion`. Mismos campos de origen
  en `persona`/`hce_diurna`.
- **`nivel_idea` — los 60 descriptores:** **diffear** los actuales contra `IDEA_DESC` del JSON extraído
  (forma `{que, n8, n6, n4, n2, n0}` por dimensión). El prototipo declara haber corregido un corrimiento
  de niveles en **D3, D4, D6 y D12**. **Reportar el diff antes de aplicarlo**: si el corrimiento es real,
  hay una pregunta clínica que no nos toca resolver — qué pasa con las evaluaciones ya aplicadas con los
  descriptores viejos — y va a `puntos-a-validar.md`.
- **Catálogos IDEA nuevos, del JSON:** `IDEA_FICHAS` (12 fichas: `def, obj, ind, nc, err, pg, martos,
  evid`), `IDEA_EJ` (ejemplo clínico por nivel: `e8, e6, e4, e2`) y `IDEA_REGLAS` (9 reglas con fuente).
  Son la ayuda contextual en tres niveles que pide el changelog v2.
- **`grupo`**: implementar D9 — id propio, nombre por color, `UNIQUE(nombre, anio)`. Revisar todas las FKs
  a `grupo_id` y las consultas del panel.
- **`recordatorio`**: hoy 4. Cargar IDEA semanas 2–3 del ingreso · PA receso de julio · PB última semana
  lectiva · IC 10 días hábiles tras PB · AYEX 60/30 · valoración funcional 90/30 · HCE-INC sin gestiones
  >60 días · informes semestrales INAU pendientes. Configurables y **no bloqueantes**.
- **`baremo_categoria`**: agregar el campo **`implicancia`**. Ojo: **la demo ya lo tiene** — las 5
  categorías con su `imp` están en `demo/js/hce-doc-org-vf.js` (~línea 243), con el mismo texto que el
  prototipo. O sea que M11.2c lo perdió al generar los catálogos. Verificar qué más se perdió en esa
  generación antes de dar por buena la tabla. Los cortes sí coinciden exactamente.
- **`auditoria`**: verificar granularidad de campo (`modulo, campo, valor_ant, valor_nuevo`).
- **Vocabulario:** «severo / muy severo» o «alta necesidad de apoyo», **nunca** «grave / muy grave».
- **Cita:** «Rivière, **1997/2002**» en todo el repo, docs incluidos.

**Verificación:** los 21 tests de M11.2 en verde · test de que ningún registro de catálogo contiene
"grave" · test de los 6 tramos con sus bordes (0, 15, 16, 90, 91, 96) · el diff de descriptores reportado
por escrito, se aplique o no.

---

### M12.2 — Puntuación independiente y consenso
Implementa D7. Es el cambio de modelo más profundo, y **el único que no sale del prototipo** — modelarlo
es decisión nuestra, así que conviene que quede especialmente bien argumentado en el commit.

- Hoy `idea` y `protocolo` guardan el consenso, igual que el prototipo. El Manual establece que los dos
  técnicos puntúan **de forma independiente** y después consensúan; sin las dos puntuaciones no hay kappa.
- Modelar `valor_t1` / `valor_t2` (nullable) junto al `valor` consensuado, con el evaluador identificado,
  por cada dimensión IDEA y cada ítem de protocolo.
- Registrar el **procedimiento de consenso**: diferencia 0 → registrar · 1 → discusión breve · ≥2 →
  ambigüedad clínica, exige documentación. Campo, no texto suelto.
- `NS` sigue siendo valor válido en IDEA.

**Verificación:** test con `valor_t1=4, valor_t2=6, valor=4` que afirma que la diferencia ≥2 queda marcada
como pendiente de documentar · test de que una evaluación **sin** puntuaciones independientes sigue siendo
válida — hace falta para la migración de históricos y para el seed espejo del prototipo, donde solo existe
el consenso.

---

### M12.3 — Catálogo dinámico de talleres
Implementa D5.
- `taller`: `id, nombre, activo, grupos_orientados[], retirado_en`. Administrable por coordinación.
- Participación **por nombre** (`pai.talleres{}` en el prototipo). Agregar, reordenar o desactivar nunca
  altera lo registrado; un taller retirado queda visible marcado.
- **Cargar los 14 del prototipo** (`CAT_TALLERES`) y **retirar los 8 anteriores**: no coincide ninguno con
  los reales, salieron de la demo. Documentar el reemplazo en la bitácora.
- Todo cambio del catálogo va a HCE-LOG.

**Verificación:** test que carga participación en "Taller de huerta", lo retira del catálogo y afirma que
la participación sigue legible y marcada como retirada.

---

### M12.4 — HCE-SEV · Severidad DSM-5-TR
- `severidad_dsm { hce_id, nivel_cs, nivel_crr, justificacion, fecha, profesional_id }` — dos campos
  **independientes**, con los descriptores largos de `SEV_CS`/`SEV_CRR` y la tabla de apoyos `SEV_APOYO`
  como catálogo.
- Etiquetas: `Grado 1 · Necesita ayuda` / `Grado 2 · Necesita ayuda notable` / `Grado 3 · Necesita ayuda
  muy notable`.
- **Regla dura (guard de M11.3):** el nivel **no se calcula ni se deriva** del IDEA ni de la IPPU-TEA.
  Justificación clínica obligatoria.
- La etiqueta de nivel de la ficha se **deriva** de este registro, no se almacena dos veces.
- Módulo **sin flujo de firma**, siempre editable. Va **entre CI e IDEA** en el orden de la ficha.

---

### M12.5 — HCE-INC · Inclusión educativa y social
- `catalogo_centro_educativo { id, nombre, tipo, zona, contacto }` — **no existe en el prototipo** (ahí
  `centro` es texto libre); lo pide la especificación para el sistema definitivo, así que lo creamos
  nosotros. `tipo` desde `INC_TIPOS` (10).
- `inclusion { hce_id, centro_id, tipo_centro, grado, modalidad, dias_horas, at, at_nombre, ref_nombre,
  ref_rol, ref_tel, estado, fecha_estado, obs }`. `estado` desde `INC_ESTADOS` (7, con descripción y
  semáforo; el default es **"Sin registrar"**).
- `inclusion_bitacora { inclusion_id, fecha, interlocutor, rol, medio, tema, contenido, acuerdos,
  autor_id, timestamp }`. Catálogos: `INC_TEMAS` (5), `INC_MEDIOS` (7), `INC_ROLES` (8).
- **`sensible` es derivado, no capturado:** en el prototipo, `sensible = (tema === 'Clínica — sensible')`.
  Modelarlo como columna calculada o derivación en el servicio — un booleano suelto se desincroniza del
  tema, y la consecuencia concreta es que información familiar grave termine circulando junto al dato
  escolar, que es exactamente lo que la segmentación existe para evitar.
- Módulo **sin firma**, abierto todo el ciclo.
- El **tablero del área** se calcula desde las HCE (dato único, sin planilla paralela). Acá solo garantizar
  datos e índices sobre `estado` y `fecha_estado`; el cálculo es M11.3/M11.4.

---

### M12.6 — HCE-PAI · Propuesta de Atención Individual (INAU)
El más grande. Las 15 secciones y todos los campos están en `docs/markdown/prototipo-v4-referencia.md` §7.

- Cabecera `pai` (~46 campos) + tablas hijas: `pai_objetivo {area, obj, estr, ind, resp, plazo}` ·
  `pai_evaluacion_previa {obj, logro, com, dec}` · `pai_equipo {nombre, rol, participacion}` ·
  `pai_coordinacion {area, situacion, frecuencia, contacto}` con **6 filas fijas precargadas**.
- Marcados por nombre contra catálogo: `talleres` (M12.3), `prest` (`PAI_PREST`, 6), `circuito`
  (`PAI_CIRCUITO`, 4). `pai_objetivo.area` desde `PAI_AREAS` (9), `plazo` ∈ Trimestral/Semestral/Anual.
- **Carga única confirmada en el código:** las secciones I, II, VI, XI y XV se renderizan `readonly` desde
  HCE-00/ORG/LB/PA/PB/SEV. Modelarlas como **referencias, no como columnas propias** — copiarlas crea
  drift, que es justo lo que el diseño de M11.2 evita en el estado de flujo.
- Es **pestaña propia** en la ficha, además del acceso desde HCE-ORG.

**Verificación:** test que afirma que ningún campo de carga única existe como columna propia de `pai`.

---

### M12.7 — Ateneos y jornadas
- **Una sola entidad** con campos según tipo (así lo hace el prototipo, no cuatro tablas):
  `ateneo { id, tipo, fecha, titulo, nna_id, grupo_id, participantes, situacion, hipotesis, recursos,
  seguimiento, capacitador, modalidad, contenidos, materiales, evaluacion }` + `ateneo_acuerdo
  { ateneo_id, acuerdo, responsable_rol, plazo }` + adjuntos.
- `id` con formato **`AT-2026-001`**, correlativo por año.
- `AT_TIPOS` (4): ateneo clínico (NNA) · de grupo · institucional · jornada de capacitación.
- Vínculo cruzado con el NNA; hereda su matriz de acceso (dato sensible). Modelar el vínculo; el permiso
  es Fase 4.
- Filtros por tipo, año, grupo y texto → índices correspondientes.

---

### M12.8 — Cierre: migración regenerada, seed, tests, docs
Una sola persona.
- **Regenerar la migración inicial única.** Reconstrucción limpia: drop schema → `alembic upgrade head` →
  `python -m app.seed_catalogos`.
- **Seed:** regenerar `app/data/catalogos_iniciales.json` **desde
  `docs/fuentes/prototipo-v4/prototipo-v4-catalogos.json`**, no desde la demo
  — la fuente autoritativa cambió. **Respetar `solo_al_crear`**: cortes del baremo, recordatorios
  desactivados, catálogo de talleres y catálogo de centros son campos de la institución; se escriben al
  insertar y no se pisan al re-correr el seed. Es el bug grave de M11.2 y los catálogos nuevos son todos
  de esa clase.
- **Índices de FK** en cada tabla nueva: que la cuenta de FKs sin respaldo siga en **0**.
- **Tipos:** columnas `Numeric` anotadas `Decimal`, no `float`.
- **Tests:** los 21 de M11.2 + los nuevos de cada módulo + el test de desfasaje modelos ↔ migración. Cada
  rechazo probado junto con su caso que sí debe pasar.
- **Docs:** `backend/docs/esquema-datos-v2.md` → **v3** · `backend/README.md` · `CLAUDE.md` (ronda en
  curso) · `handoff.md` §6 y §13 · `docs/estructura-repositorio.md` si aparecieron carpetas nuevas.
- **Nomenclatura:** cerrar `puntos-a-validar.md` §2.3 — conviven cinco usos de "fase" y esta ronda agrega
  vocabulario.

---

## 4. Qué cambia en `docs/notas/puntos-a-validar.md` y `docs/notas/consulta-a-ippu.md`

`consulta-a-ippu.md` **nunca se envió**, así que no hay que corregir un documento en circulación: hay que
**reescribirlo mucho más corto**. El prototipo respondió gran parte solo.

**Cierran (el prototipo los responde):**
- §1.3 talleres → **14 nombres reales**. El "8 vs 18" era falso.
- §1.7 número de HC anterior → identificador secundario.
- §1.8 datos históricos → estrategia completa (solo IDEA estructurado; resto legacy; acta de cierre;
  coexistencia acotada; verificación por muestreo; metadatos de origen).
- §2.6 `grupo` → se decide en M12 (D9), con el dato nuevo de que los grupos son por color.
- De `consulta-a-ippu.md`: **2.1** (IDEA una sola vez), **2.3** (informe anual), **2.5** (áreas/general),
  **2.7/2.8** (baremo y su origen), **2.9** (períodos como recordatorios), **2.10** (fotos), **3.1**
  (talleres), **3.6** (quién ve qué, en 4 perfiles).

**Siguen abiertos:** §1.2 cortes contra el **anexo del Decreto 72/025** (el prototipo repite los mismos
que asumimos — confirma qué usa IPPU, no qué dice el decreto) · §1.4 citas de los 24 ítems (ahora tenemos
el texto exacto de cada una, pero siguen sin verificar) · §1.5 acceso a la HCE actual · §1.6
confidencialidad · §2.1 ratificar §5.8 · §2.2 rama aparcada · §2.4 numeración de líneas · §2.5 despliegue.

**Nuevos (van a los dos documentos):**
- **Descriptores IDEA:** si el Manual Unificado corrigió el corrimiento en D3/D4/D6/D12, **¿qué pasa con
  las evaluaciones ya aplicadas con los criterios anteriores?** Es la pregunta clínica más seria que
  aparece de todo esto.
- **Anexo A del Manual** y las secciones que el prototipo no muestra (§4, §7, §8, §12, §13, §15, §17, §18,
  §20–22, §24, §25).
- **Matriz de 14 roles:** mencionada en los pendientes, ausente del prototipo.
- **Catálogo de centros educativos:** ¿lo arma coordinación o lo sacamos de la planilla del área?
- **Kappa:** ¿los técnicos ya puntúan de forma independiente, o es práctica a introducir? De la respuesta
  depende si D7 sirve desde el día uno o queda latente.
- **Contradicción secuencia dura vs. guiada** (Anexo B).

---

## 5. Verificación de la ronda

Mismo estándar que M11.2:
1. Reconstrucción limpia con conteo exacto de tablas.
2. Seed corrido **dos veces** = 0 nuevas / 0 actualizadas, con un campo de institución modificado a mano
   en el medio para probar que el seed **no lo pisa**.
3. Tests estructurales: cada regla nueva con su caso que rechaza **y** su caso que pasa.
4. Test modelos ↔ migración.
5. API levanta y `/health` responde 200.
6. **Cero triggers.** Si aparece la tentación de poner una regla clínica en la base, ese guard va a M11.3.

---

## 6. Qué le queda a M11.3

Anotarlo en `implementacion/L1-hce-idea/backend/docs/esquema-datos-v2.md` v3 §4 para que M11.3 lo tome
completo.

**Ya previstos:** secuencia CI→LB→PA→PB→IC · firma = bloqueo · addenda · habilitación excepcional con
constancia (CI sin excepción) · Δ solo B−A · baremo solo desde `pct` · fotos §8.4 · histórico inmutable.

**Nuevos:** severidad DSM no derivable de puntajes · fundamentación obligatoria en ítems con valor 1 o 5 ·
consenso con diferencia ≥2 exige documentación · IDEA firmado atado a `manual_version` · participación en
talleres robusta a cambios de catálogo · `sensible` derivado del tema, nunca capturado suelto · carga
única del PAI por referencia · mínimos recomendados (≥5 sesiones, ≥15 semanas) → advertencia + constancia,
**nunca** bloqueo · vocabulario institucional en todo texto generado · alertas de plazo como recordatorio.

---

## 7. Deuda que esta ronda genera

- **La demo queda descalzada.** Al terminar M12 el backend va a tener cuatro módulos, seis bandas y
  catorce talleres que la demo v4.1 no tiene. El **criterio §12-A** (seed espejo de la demo: IDEA 58 ·
  PA 60 · PB 79 · Δ +19) deja de alcanzar como prueba de aceptación. Definir uno nuevo en M12.8 **extendiendo
  nuestro propio seed**, no reemplazándolo por el de ellos: los casos de la demo son nuestros y el
  fingerprint existe para detectar regresiones en nuestro sistema. Los 5 pacientes del prototipo sirven
  como contraste para verificar cálculos, no como reemplazo.
- **Hay fecha de demo con IPPU y esta ronda no produce nada visible.** Ver §8.
- **§5.8 sigue sin ratificar.** M11 arrancó sin cruzar su puerta de validación y M12 la cruza otra vez,
  con más superficie construida. Ratificarlo o pararlo antes de M12.5.

---

## 8. Nota sobre la reunión con IPPU

No es parte del plan técnico, pero lo condiciona: **`consulta-a-ippu.md` nunca se envió** y hay fecha de
demo. Dos cosas para decidir antes de M12.5:

1. **Qué se muestra.** Se muestra **nuestra demo**, con nuestro diseño — no una versión de la de ellos.
   Lo que aporta UTEC es un sistema que funciona y persiste; su prototipo es una especificación. El
   problema concreto es otro: hay cuatro datos de la demo que **ya sabemos que están desactualizados**
   respecto de cómo trabaja IPPU, y mostrarlos así invita a una corrección que ya tenemos hecha. Revisada
   la demo, el costo de cada uno no es parejo:

   | Pieza | Dónde | Costo |
   |---|---|---|
   | Vocabulario «severo/muy severo» | Ya está — `hce-doc-org-vf.js` cita la regla §8.1 y no hay ningún "grave" suelto | **Cero** |
   | 6 bandas del IDEA | `js/catalogos.js` (`bandaIdea`, ~l.14) + `js/ui-core.js` (contador ~l.344 y el array `BANDAS` ~l.413) | **Bajo** |
   | Cita Rivière 1997/2002 | `js/catalogos.js` (~l.102) e `index.html` | **Trivial** |
   | 14 talleres reales | **No hay catálogo**: los nombres están sueltos como strings de seed en `js/datos.js` y `js/grupos-usuario.js`, más el heatmap hardcodeado de `js/ui-core.js` (~l.427) | **Medio** |

   Las tres primeras no tocan el motor de flujo, así que el fingerprint de `demo/verificacion/` sigue
   sirviendo como red. La cuarta toca datos de muestra en tres archivos, uno de ellos compartido
   (`ui-core.js`) — conviene decidirla aparte, y notar que el heatmap de talleres ya está declarado fuera
   de alcance en el propio comentario del código (§5.1.3).
2. **Las preguntas se llevan a la reunión, no por correo.** Un cuestionario de 30 preguntas sin enviar es
   peor que seis preguntas hechas en persona. Las que destraban ahora: los descriptores corregidos y qué
   pasa con las evaluaciones viejas · el anexo del Decreto 72/025 · el acceso a la HCE actual · el acuerdo
   de confidencialidad · la matriz de roles · si ya puntúan de forma independiente.

---

## Anexo A — Mapa de brechas: Prototipo v4 → estado actual

| Prototipo v4 | Estado actual | Acción |
|---|---|---|
| 6 bandas IDEA con nivel DSM y texto neutro | 3 bandas | M12.1 · D4 |
| Interpretación del Δ en 6 tramos con acción | Solo alerta Δ ≤ −7 | M12.1 |
| `IDEA_MANUAL_V` persistido por evaluación | No existe | M12.1 |
| 60 descriptores, corregidos en D3/D4/D6/D12 | 60 extraídos de la demo | M12.1 · **diffear** |
| `IDEA_FICHAS` (12) · `IDEA_EJ` (12) · `IDEA_REGLAS` (9) | No existen | M12.1 |
| 14 talleres reales, catálogo dinámico, por nombre | 8 talleres inventados, catálogo cerrado | M12.3 · D5 |
| Grupos por color | `grupo.id (A..E)` | M12.1 · D9 |
| `baremo_categoria.implicancia` | Sin el campo | M12.1 |
| HCE-SEV | No existe | M12.4 |
| HCE-INC + catálogo de centros + tablero | No existe | M12.5 |
| HCE-PAI (15 secciones, ~46 campos, 4 tablas hijas) | No existe | M12.6 |
| Ateneos y jornadas (una entidad, 4 tipos) | No existe | M12.7 |
| Metadatos de origen en registros migrados | No existen | M12.1 |
| Auditoría a nivel campo | Verificar | M12.1 |
| Recordatorios (8+) | 4 | M12.1 |
| «severo/muy severo», nunca «grave» | Sin regla | M12.1 |
| Rivière 1997/2002 | "1997" suelto | M12.1 |
| Puntuación independiente por evaluador | No existe — **tampoco en el prototipo** | M12.2 · D7 (agregado nuestro) |
| Identidad única entre 3 servicios | `persona` + `persona_servicio` | Nada — ya resuelto |
| Cortes del baremo | Coinciden exactamente | Sin cambio (falta el decreto) |
| Flujo guiado no impuesto + excepción | Ya implementado en demo, guard en M11.3 | Sin cambio |

---

## Anexo B — Contradicciones internas del prototipo

Para llevar a IPPU, no para resolver por nuestra cuenta. Detalle en
`docs/markdown/prototipo-v4-referencia.md` §12.

1. **Secuencia dura vs. guiada** — Manual §3 ("ningún instrumento puede aplicarse sin que el anterior esté
   completo y firmado") vs. Especificaciones §1 ("flujo guiado, no impuesto"). El código implementa la
   guiada; nosotros también. Confirmar.
2. **Roles genéricos vs. `psicologa`/`maestra` hardcodeados** — la portabilidad está declarada, no
   implementada. Nosotros implementamos la declarada (D8).
3. **14 roles vs. 4 perfiles.**
4. **Kappa** como requisito no funcional y "único requisito metodológico invariante", con un modelo que
   guarda un solo consenso.
5. **Grupos por color vs. `A..E`** — y ninguno de los dos resuelve el grupo por año.
6. **`LIKERT_LBL`** difiere levemente entre el Manual y el código.

---

## Anexo C — Orden sugerido de sesiones

`M12.0` (corto) → `M12.1` → `M12.2` → **[M12.3 · M12.4 · M12.5 · M12.6 · M12.7 en paralelo]** → `M12.8`.

Cortes buenos para revisar: **después de M12.1** (toca tablas con tests existentes y produce el diff de
descriptores, que tiene consecuencias clínicas) y **después de M12.2** (el cambio de modelo más profundo).
M12.6 es el más grande de los paralelos.
