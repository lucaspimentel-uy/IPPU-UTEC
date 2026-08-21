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
> - `docs/prototipo-v4/prototipo-v4-catalogos.json` — 32 constantes (fichas IDEA, 60 descriptores,
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
   > ⚠️ **Ruta histórica.** La carpeta se movió a **`docs/prototipo-v4/`** el 2026-08-20
   > (`handoff.md` §5.30): estar bajo `fuentes/` hacía falsa la regla «respaldo, no se leen», porque
   > `generar_catalogos_backend.py` la lee. El paso se hizo tal como está escrito; la ruta de hoy es otra.
2. **No convertir el HTML con Docling.** Es una app JS: rinde el shell vacío, misma razón por la que el
   v1 es la excepción documentada en `docs/estructura-repositorio.md`. La diferencia es que el v4 **sí
   tiene versión legible** — `docs/markdown/prototipo-v4-referencia.md` —, producida por script en lugar
   de por Docling. La regla de conversión se cumple igual: se lee y se cita desde `docs/markdown/`.
3. **Actualizar los mapas de estructura**, que el cambio lo exige explícitamente:
   `docs/estructura-repositorio.md` (carpeta `docs/prototipo-v4/` — entonces `docs/fuentes/prototipo-v4/`,
   ver §5.30 —, el `.md` nuevo en
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

**Regla de migraciones** — ⚠️ **enmendada el 2026-08-14** (`handoff.md` **§5.19**; el texto original queda
citado abajo):

> La migración inicial única se regenera **al cerrar cada sub-módulo de M12**, con el test
> `test_la_migracion_coincide_con_los_modelos` pasando. Se congela **sólo si hay trabajo en paralelo real**
> sobre `app/models/` — en ese caso se descongela al terminar el paralelo y regenera **una sola persona**.
> Mientras la ronda la ejecute alguien solo, **no hay congelamiento**.

Se mantiene una migración inicial **única**: se regenera el mismo archivo, no se apilan revisiones.

~~Regla original: nadie corre `alembic revision --autogenerate` hasta M12.8. Se trabaja sobre los modelos;
la migración inicial única se regenera una sola vez al cierre, como en M11.2. Nada está desplegado y no hay
datos reales — apilar ocho migraciones no compra nada y tres autogenerate en paralelo garantizan conflicto.~~
El motivo (evitar conflictos entre tres `autogenerate` simultáneos) sólo aplica cuando efectivamente hay
tres personas sobre `app/models/`; y dejar el desfasaje acumulándose hasta M12.8 —32 diferencias en M12.1,
más de cien después del fan-out, de autores distintos, vistas por primera vez al final— era el mismo riesgo
corrido de lugar.

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
- **`nivel_idea` — los 60 descriptores: NO se reemplazan.** ✅ **Resuelto en M12.1** (el diff se hizo en
  M12.0, ver bitácora del 2026-08-14). **Fundamento:** 59 de 60 difieren textualmente del `IDEA_DESC` del
  prototipo pero **ninguno por corrimiento de niveles** — en 58 de 60 el mejor calce es el mismo nivel y
  el texto de un nivel nuestro nunca aparece en otro nivel del prototipo. **El corrimiento que el
  prototipo dice haber corregido no es contra nosotros**: su propio literal lo declara contra una «Guía
  del aplicador» interna de IPPU, hoy desestimada, que nunca tuvimos y de la que nuestros descriptores no
  derivan. Los nuestros son el **texto literal de la fuente oficial** (Rivière, 1997/2002); los suyos son
  paráfrasis condensadas. Reemplazarlos sería perder fidelidad al instrumento a cambio de nada.
  **Lo que sí se toma:** la versión corta entra **aparte** como `idea_nivel.descriptor_breve` (sirve en
  pantalla, donde el oficial no entra) y el resumen de dimensión como `idea_dimension.que_evalua`.
  La pregunta clínica sigue abierta pero **no nos toca resolverla**: si IPPU aplicó evaluaciones con la
  Guía corrida, qué se hace con esos puntajes. Ya está en `handoff.md` §7 y va a la reunión.
- **Catálogos IDEA nuevos, del JSON:** `IDEA_FICHAS` (12 fichas: `def, obj, ind, nc, err, pg, martos,
  evid`), `IDEA_EJ` (ejemplo clínico por nivel: `e8, e6, e4, e2`) y `IDEA_REGLAS` (9 reglas con fuente).
  Son la ayuda contextual en tres niveles que pide el changelog v2.
- **`grupo`**: implementar D9 — id propio, nombre por color, `UNIQUE(nombre, anio)`. Revisar todas las FKs
  a `grupo_id` y las consultas del panel.
- **`recordatorio`**: hoy 4. Cargar IDEA semanas 2–3 del ingreso · PA receso de julio · PB última semana
  lectiva · IC 10 días hábiles tras PB · AYEX 60/30 · valoración funcional 90/30 · HCE-INC sin gestiones
  >60 días · informes semestrales INAU pendientes. Configurables y **no bloqueantes**.
- ~~**`baremo_categoria`**: agregar el campo **`implicancia`**.~~ ❌ **Este bullet no tenía trabajo.**
  Verificado en M12.0: `implicancia` **ya está** en el modelo (`app/models/catalogos.py`), en
  `app/data/catalogos_iniciales.json` y en la base, con texto **idéntico** al `imp` del prototipo en las
  5 categorías, igual que los cortes. La sospecha de que M11.2c había perdido cosas al generar los
  catálogos **no se confirmó**: se comparó todo lo generado contra la demo y coincide (60/60
  descriptores, 24/24 ítems, 12/12 categorías documentales, 4/4 recordatorios). Lo que falta no se
  perdió: **nunca entró** (ver el bullet de abajo).
- **`auditoria`**: verificar granularidad de campo (`modulo, campo, valor_ant, valor_nuevo`).
- **Los 6 catálogos que viven sueltos en la demo** y no tienen tabla ni entrada en el JSON —
  `VF_DOMINIOS`, `VF_NIVELES`, `PRESTACIONES`, `BPS_PRESTACIONES`, `BPS_ESTADOS`, `LIKERT_LBL`.
  **Criterio:** tabla si se consulta, se filtra o la institución lo puede cambiar; constante si es texto
  fijo de presentación. ✅ **Decidido en M12.1: los seis van a `app/core/constantes.py`**, ninguno a
  tabla — acompañan a un valor que ya está guardado (un entero Likert 1–5, una clave de dominio dentro de
  `valoracion_funcional.dominios`, texto libre de BPS), nadie los consulta por sí mismos y cambiarlos
  tiene que pasar por revisión de código, no por `UPDATE`. Pasan a tabla el día que el panel necesite
  filtrar por alguno.
- **Vocabulario:** «severo / muy severo» o «alta necesidad de apoyo», **nunca** «grave / muy grave».
- **Cita:** «Rivière, **1997/2002**» en todo el repo, docs incluidos.

**Verificación:** los 21 tests de M11.2 en verde · test de que ningún registro de catálogo contiene
"grave" · test de los 6 tramos con sus bordes (0, 15, 16, 90, 91, 96) · el diff de descriptores reportado
por escrito, se aplique o no.

> ⚠️ ~~**Ajuste al criterio de verificación, hecho en M12.1.** El test
> `test_la_migracion_coincide_con_los_modelos` no puede estar en verde durante la ronda: la regla de §3
> dice que la migración se regenera una sola vez en M12.8, así que los modelos van deliberadamente adelante
> del esquema aplicado. Queda salteado con el conteo de diferencias en el mensaje (visible con `pytest -rs`)
> en vez de borrado, y M12.8 tiene que volver a poner el `assert`.~~
> **Revertido el 2026-08-14 por la enmienda §5.19** (ver §3): la migración se regeneró con las 33 tablas de
> M12.1, el test volvió a ser bloqueante y **ya no se saltea durante la ronda**. Los 21 de M11.2 en verde.

---

### M12.2 — Puntuación independiente y consenso ✅ **HECHO** (2026-08-14, Lucas)
Implementa D7. Es el cambio de modelo más profundo, y **el único que no sale del prototipo** — modelarlo
es decisión nuestra, así que conviene que quede especialmente bien argumentado en el commit.

> **Cómo quedó.** Dos tablas nuevas — **`puntuacion_idea`** (0–8 + `NS` tipado) y
> **`puntuacion_protocolo`** (1–5, sin `NS`) — con `valor_t1`/`valor_t2` nullable, `documentacion` y
> `diferencia` como **columna generada** (`abs(t1-t2)`). Los evaluadores van en `idea`/`protocolo`
> (`evaluador_t1_id`/`evaluador_t2_id`, con `CHECK` de que no sean la misma persona), no por fila: son los
> mismos para toda la evaluación, y **no se derivan de `firmas`** porque la puntuación independiente pasa
> antes de firmar. **El consenso no se movió:** sigue en `idea.dim` / `protocolo.items`.
> `procedimiento` y `documentacion_pendiente` son **derivados** (`hybrid_property`, sirven en Python y en
> SQL), no columnas: mismo criterio sin drift que el estado visible de los módulos. Los tres tramos
> (0 · 1 · ≥2) son **constante** (`core/constantes.py`) y no catálogo paramétrico — es el invariante
> metodológico del Manual; si se pudiera correr con un `UPDATE`, los kappas de antes y después no serían
> comparables. **El guard queda para M11.3** (§4 del esquema), kappa no se calcula. **35 tablas · 74 tests
> en verde, 0 salteados**, migración regenerada con el test de coincidencia pasando.

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

### M12.3 — Catálogo dinámico de talleres ✅ **HECHO** (2026-08-14, Lucas)
Implementa D5.
- `taller`: `id, nombre, activo, grupos_orientados[], retirado_en`. Administrable por coordinación.
- Participación **por nombre** (`pai.talleres{}` en el prototipo). Agregar, reordenar o desactivar nunca
  altera lo registrado; un taller retirado queda visible marcado.
- **Cargar los 14 del prototipo** (`CAT_TALLERES`) y **retirar los 8 anteriores**: no coincide ninguno con
  los reales, salieron de la demo. Documentar el reemplazo en la bitácora.
- Todo cambio del catálogo va a HCE-LOG.

> **Cómo quedó.** `taller` suma `orden` (no había forma de **reordenar**), `grupos_orientados` y
> `retirado_en`; **`activo` dejó de ser columna** y es `hybrid_property` (`retirado_en IS NULL`) — un
> booleano al lado de la fecha se desincroniza, mismo criterio sin drift que `procedimiento` (M12.2).
> `grupos_orientados` es **array de nombres de color en texto, no FK**: desde D9 un grupo es
> `(nombre, anio)` y un `grupo_id` ataría el taller al año en que se creó la fila. Los **14 reales** salen
> ahora de `CAT_TALLERES` (`taller` salió de `DESDE_LA_DEMO` en el generador) y el `solo_al_crear` del seed
> pasó de `("activo",)` a `("orden", "grupos_orientados", "retirado_en")`: la fila entera es de la
> institución, y por eso re-correr el seed **no revive un taller retirado**.
> **Se retiró `hce_taller`** (§5.20): resto de v1, sin uso (0 tests/seed/routers/schemas), incompatible con
> la participación por nombre que fija la especificación. ⚠️ **34 tablas — bajó de 35 y no es regresión:**
> M12.3 no crea tablas, `taller` ya existía. **92 tests en verde, 0 salteados**, migración regenerada
> (`3f11e10c13ed`) con el test de coincidencia pasando.

~~**Verificación:** test que carga participación en "Taller de huerta", lo retira del catálogo y afirma que
la participación sigue legible y marcada como retirada.~~ → **traspasada a M12.6** (`handoff.md` §5.21):
con `hce_taller` retirada y `pai_taller` sin construir **no existe tabla de participación**, y fabricar
acá una —o un mock— sería trabajo que M12.6 rehace distinto.

**Verificación efectiva de M12.3:** los 14 con los nombres exactos del prototipo y ninguno de los 8 viejos ·
`activo` derivado, coherente en Python y en SQL, e **imposible de contradecir** (no hay setter, no es
columna) · `grupos_orientados` con varios colores, que sobrevive al alta del mismo grupo en otro año ·
`orden` reordena sin tocar `nombre` · seed idempotente (0/0 en la segunda corrida) que **no revive** un
taller retirado a mano · `HceTaller` no existe ni es importable, y **ninguna tabla tiene FK a `taller.id`**.

---

### M12.4 — HCE-SEV · Severidad DSM-5-TR ✅ **HECHO** (2026-08-15, Lucas)
> **Cómo quedó.** **`severidad_dsm`** con **PK = `hce_id` (0..1)**, como `consentimiento`: la regla del
> módulo dice que el registro describe la necesidad de apoyo **actual**, y 0..1 es además **la dirección
> reversible** (→1:N es agregar un `id`; el inverso obliga a descartar filas). ⚠️ Es correcto **sólo con el
> guard de auditoría de campo** anotado en §4 del esquema — sin `app/services/` nada garantiza todavía que
> un UPDATE deje rastro. Los dos dominios son independientes **en sus valores**, pero los dos son NOT NULL
> (la regla dice «por separado para **cada** dominio», y «sin juzgar» ya es *no tener fila*); ídem
> `justificacion` —con `CHECK` de no-vacío por regex, porque `btrim()` recorta sólo espacios—, `fecha` y
> `profesional_id`. Las **etiquetas se derivan**, no se guardan. El catálogo es **`severidad_nivel`**: una
> fila por grado con `etiqueta`, `descriptor_cs`, `descriptor_crr` y `apoyos` — las cuatro constantes del
> prototipo comparten la misma clave 1–3 y se renderizan como una sola tabla, así que tres tablas
> paralelas serían la misma fila partida. **Sin FK entrantes ni salientes hacia los instrumentos**, con
> tests estructurales en las dos direcciones. La regla del sistema quedó **verbatim** como docstring.
> ⚠️ **Se retiró `hce_diurna.nivel_soporte`** (§5.24): es **una columna, no una tabla**, y el conteo sube
> **34 → 36** por las dos tablas nuevas. **123 tests en verde, 0 salteados**, migración regenerada
> (`f432ea139fd9`) con el test de coincidencia pasando.
>
> **Hallazgo colateral:** la cuenta de FKs sin respaldo **no estaba en 0** — `puntuacion_idea.dimension_id`
> y `puntuacion_protocolo.item_id` quedaron sin índice en M12.2 (su `UNIQUE` compuesto no las cubre).
> Corregidas, y el chequeo quedó **automatizado como test** para M12.5–M12.7.

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

> ⚠️ **Tres cosas decididas antes de arrancar (2026-08-15), leerlas primero.**
> 1. **§5.22 — la sección V no duplica HCE-INC.** `centro`, `modalidad` y `grado` viven en `inclusion`
>    (M12.5) y pasan a ser una **sexta sección de carga única**, junto a I, II, VI, XI y XV. `apoyosEd` y
>    `otrasEd` **sí** son de PAI. El PAI de INAU es un documento **dinámico** (actualización en SIPI ante
>    cualquier cambio significativo + revisiones periódicas); una copia congelada del centro educativo
>    contradice esa obligación, y el modo de falla es entregarle a un organismo del Estado un dato
>    desactualizado. Reparto que fija: **lo que se compromete** se congela por instancia (`pai_objetivo`,
>    `pai_coordinacion`); **lo que es diagnóstico de situación** se lee en vivo. **Costo de orden:
>    ninguno** — carga única es *ausencia* de columnas, no FK.
> 2. **`pai` NO lleva `UNIQUE(hce_id, anio)`.** Con revisión semestral puede haber más de un PAI por año
>    (inicial + actualización; de ahí `tipo` y la sección IX). **No replicar el patrón de
>    `informe_cierre`**, que sí es anual único.
> 3. **§5.23 — M12.4 iba antes que este módulo** y ya está hecho: `severidad_dsm` tiene PK = `hce_id`,
>    `nivel_cs`/`nivel_crr` 1–3 y las etiquetas derivadas de `severidad_nivel`. Con eso alcanza para
>    escribir el mapeo «qué sección lee de qué tabla» de la sección VI.
>
> **Verificar contra el JS antes de modelar la cabecera:** si `padronInau`, `disposicion`, `judicial` y
> `expediente` **existen en el objeto `pai`** o **sólo se renderizan desde HCE-ORG**.
> `prototipo-v4-referencia.md` §7 afirma **las dos cosas** —los lista en «campos de cabecera» y a la vez
> declara la sección II de carga única— y no pueden ser ciertas a la vez.
>
> **Preguntar a IPPU (ya anotado):** el nombre oficial. El prototipo dice «Propuesta de Atención
> Individual»; la normativa INAU aparece como «**Proyecto de Atención Integral**». Los campos confirman que
> es el mismo instrumento, pero el nombre va impreso en lo que se entrega.

- Cabecera `pai` (~46 campos) + tablas hijas: `pai_objetivo {area, obj, estr, ind, resp, plazo}` ·
  `pai_evaluacion_previa {obj, logro, com, dec}` · `pai_equipo {nombre, rol, participacion}` ·
  `pai_coordinacion {area, situacion, frecuencia, contacto}` con **6 filas fijas precargadas**.
- Marcados por nombre contra catálogo: `talleres` (M12.3), `prest` (`PAI_PREST`, 6), `circuito`
  (`PAI_CIRCUITO`, 4). `pai_objetivo.area` desde `PAI_AREAS` (9), `plazo` ∈ Trimestral/Semestral/Anual.
- ⚠️ **La participación en talleres la crea este módulo, desde cero:** `pai_taller { pai_id,
  taller_nombre }` (Especificaciones Técnicas §3). **No hay nada preexistente que reusar** — el
  `hce_taller` de v1 se retiró en M12.3 (`handoff.md` §5.20) por ser el modelo contrario: participación por
  expediente y por `taller_id`. `taller_nombre` es **texto que casa contra `taller.nombre`** (UK,
  `String(80)`), **sin FK**: retirar o reordenar un taller no puede arrastrar un registro clínico, y un
  taller retirado se muestra con la marca «retirado del catálogo» resolviendo el nombre contra el catálogo
  (`Taller.activo` es derivado y filtra también en SQL).
- **Hereda de M12.3 el criterio de verificación que allá no era escribible** (§5.21): cargar participación
  en «Taller de huerta», retirarlo del catálogo y afirmar que la participación **sigue legible y marcada
  como retirada**.
- **Carga única confirmada en el código:** las secciones I, II, VI, XI y XV se renderizan `readonly` desde
  HCE-00/ORG/LB/PA/PB/SEV. Modelarlas como **referencias, no como columnas propias** — copiarlas crea
  drift, que es justo lo que el diseño de M11.2 evita en el estado de flujo.
- Es **pestaña propia** en la ficha, además del acceso desde HCE-ORG.

**Verificación:** test que afirma que ningún campo de carga única existe como columna propia de `pai`.

---

### M12.7 — Ateneos y jornadas ✅ **HECHO** (2026-08-15, Lucas)
- **Una sola entidad** con campos según tipo (así lo hace el prototipo, no cuatro tablas):
  `ateneo { id, tipo, fecha, titulo, nna_id, grupo_id, participantes, situacion, hipotesis, recursos,
  seguimiento, capacitador, modalidad, contenidos, materiales, evaluacion }` + `ateneo_acuerdo
  { ateneo_id, acuerdo, responsable_rol, plazo }` + adjuntos.
- `id` con formato **`AT-2026-001`**, correlativo por año.
- `AT_TIPOS` (4): ateneo clínico (NNA) · de grupo · institucional · jornada de capacitación.
- Vínculo cruzado con el NNA; hereda su matriz de acceso (dato sensible). Modelar el vínculo; el permiso
  es Fase 4.
- Filtros por tipo, año, grupo y texto → índices correspondientes.

> **Cómo quedó, y en qué se apartó de este texto.** **38 tablas** (36 → 38), **240 tests, 0 salteados**,
> migración `9246e659d2c9`. Detalle completo en `handoff.md` §13 y en `backend/docs/esquema-datos-v2.md`
> §2.5.
>
> 1. **`AT_TIPOS` es constante, no catálogo.** El tipo es el **discriminador** contra el que están
>    escritos los 5 CHECK de obligación/prohibición: con catálogo editable, un quinto tipo cargado desde
>    la app cae fuera de todas las reglas y la fila se guarda sin sujeto y con los dos bloques de
>    contenido a la vez. Por eso el conteo es 38 y no 39.
> 2. **`id` no es el código.** El plan fija el **formato visible**; la PK es un serial y la identidad del
>    correlativo es `UNIQUE(anio_correlativo, numero)`, con `codigo` como `hybrid_property` — el patrón
>    de D9 (§5.18). Una PK de texto repetiría lo que §5.18 corrigió.
> 3. **`nna_id` se llama `hce_referida_id`** y apunta a `hce_diurna`, con **RESTRICT**: es una
>    referencia, no una pertenencia. Fijado como regla de nomenclatura en **§5.26**, que **M12.6 hereda**.
> 4. **Los adjuntos obligaron a §5.25:** `documento.hce_id` era NOT NULL, así que un ateneo institucional
>    o una jornada no podían tener ninguno. Se le dio a HCE-DOC **alcance institucional** (nullable +
>    `ateneo_id` + XOR), como M12.1 hizo con `auditoria.hce_id`.
> 5. **El índice de texto quedó como btree en `titulo`**, no `tsvector`: `vAteneos` busca **subcadena** y
>    `tsvector` matchea **lexemas** («capacit» no encontraría «capacitación»). Las dos opciones y su
>    diferencia semántica están en §4 del esquema, para decidirlas cuando exista la consulta.

---

### M12.8 — Cierre: seed, tests, docs
Una sola persona.
- **Regenerar la migración inicial única** una última vez, con la reconstrucción limpia de siempre: drop
  schema → `alembic upgrade head` → `python -m app.seed_catalogos`. ⚠️ Desde la enmienda **§5.19**
  (2026-08-14) esto **ya se hizo al cerrar cada sub-módulo**, así que acá es confirmación, no puesta al día.
- **Seed:** terminar de regenerar `app/data/catalogos_iniciales.json` desde
  `docs/prototipo-v4/prototipo-v4-catalogos.json` — la fuente autoritativa cambió.
  **M12.1 ya dejó el generador versionado:** `herramientas/generar_catalogos_backend.py` (con `--check`
  para CI). Hoy produce las secciones nuevas y **preserva** las que vienen de la demo v4.1
  (`DESDE_LA_DEMO`); M12.8 tiene que pasar esas también al prototipo y vaciar esa lista.
  **Respetar `solo_al_crear`**: cortes del baremo y de las bandas del IDEA, recordatorios desactivados,
  catálogo de talleres y catálogo de centros son campos de la institución; se escriben al insertar y no
  se pisan al re-correr el seed. **Corrección al plan:** esto **no es un bug pendiente de M11.2** — ya
  estaba implementado en `app/seed_catalogos.py` desde la revisión del 2026-08-07 (verificado en M12.0).
  M12.1 lo **extendió** a bandas, Δ y grupos, y agregó el caso `solo_insertar` para `grupo`. Lo que queda
  para M12.8 es extenderlo a los catálogos de M12.3–M12.7.
- **Índices de FK** en cada tabla nueva: que la cuenta de FKs sin respaldo siga en **0**.
- **Tipos:** columnas `Numeric` anotadas `Decimal`, no `float`.
- **Tests:** los 21 de M11.2 + los nuevos de cada módulo, con el test de desfasaje modelos ↔ migración en
  verde (ya reactivado el 2026-08-14 por §5.19; no hay nada que "volver a activar"). Cada rechazo probado
  junto con su caso que sí debe pasar.
- **Docs:** `backend/docs/esquema-datos-v2.md` → **v3** · `backend/README.md` · `CLAUDE.md` (ronda en
  curso) · `handoff.md` §6 y §13 · `docs/estructura-repositorio.md` si aparecieron carpetas nuevas.
- **Nomenclatura:** cerrar `puntos-a-validar.md` §2.3 — conviven cinco usos de "fase" y esta ronda agrega
  vocabulario.

---

## 4. Qué cambia en `docs/notas/puntos-a-validar.md` y `docs/notas/consulta-a-ippu.md`

⚠️ **Enmendado el 2026-08-20 (`handoff.md` §5.28): `consulta-a-ippu.md` se envió el 2026-08-19.** Lo de
abajo se escribió el 14/08, cuando todavía era cierto que no había salido. Consecuencia concreta: **ahora
sí hay un documento en circulación**, así que reescribirlo corto ya no es gratis — cualquier cambio a esas
preguntas cae sobre algo que IPPU **ya tiene en sus manos**, y corresponde decírselo en la reunión en vez
de reemplazarlo en silencio.

~~`consulta-a-ippu.md` **nunca se envió**, así que no hay que corregir un documento en circulación:~~ hay que
**reescribirlo mucho más corto**. El prototipo respondió gran parte solo.

**Cierran (el prototipo los responde):**
- §1.3 talleres → **14 nombres reales**. El "8 vs 18" era falso.
- §1.7 número de HC anterior → identificador secundario.
- §1.8 datos históricos → estrategia completa (solo IDEA estructurado; resto legacy; acta de cierre;
  coexistencia acotada; verificación por muestreo; metadatos de origen).
- §2.6 `grupo` → se decide en M12 (D9), con el dato nuevo de que los grupos son por color.
- De `consulta-a-ippu.md`, **renumerado el 2026-08-20 contra el documento realmente enviado** (§5.34):
  **2.3** (informe anual), **2.5** (áreas/general), **2.7** (períodos como recordatorios), **2.8**
  (fotos), **3.1** (talleres), **3.5** (quién ve qué, en 4 perfiles).
  ⚠️ **El baremo y su origen salieron de la lista**: eran §2.7/§2.8 del borrador y **el equipo los
  retiró antes de enviar**, así que no están preguntados. Siguen abiertos en `puntos-a-validar.md`
  §1.2.

⚠️ **`consulta-a-ippu.md` §2.1 (IDEA una sola vez) NO cierra.** Estaba en esta lista por inferencia —
el Prototipo v4 modela `idea` como objeto único por paciente, no como arreglo anual — pero esa es la
estructura de datos de **nuestra propia herramienta de referencia**, no una confirmación de IPPU. Y
desde el cuestionario del 15/06/2026 (P10, P12) tenemos lo contrario **por escrito**: Fernando Sierra
dijo que el IDEA se aplica anualmente y que las evaluaciones no se consolidan. Sigue siendo, de las
cuatro marcadas ⚠️, la que más pesa — no se acorta en M12.8.

**Siguen abiertos:** §1.2 cortes contra el **anexo del Decreto 72/025** (el prototipo repite los mismos
que asumimos — confirma qué usa IPPU, no qué dice el decreto) · §1.4 citas de los 24 ítems (ahora tenemos
el texto exacto de cada una, pero siguen sin verificar) · §1.5 acceso a la HCE actual · §1.6
confidencialidad · **`consulta-a-ippu.md` §2.1** (IDEA una sola vez — ver nota arriba) ·
`puntos-a-validar.md` §2.1 ratificar §5.8 · §2.2 rama aparcada · §2.4 numeración de líneas · §2.5
despliegue.

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

**De M12.7 (ateneos), con su detalle en `esquema-datos-v2.md` §4:**
- **Las 4 consecuencias de UI de que el registro nazca completo** (D6): «+ Nuevo registro» abre formulario
  y hace **un POST completo**, no crea una fila vacía · **el correlativo lo asigna el servidor** ·
  «+ Agregar acuerdo» agrega la fila en el cliente · **corregir un tipo mal cargado exige limpiar
  `hce_referida_id` en la misma sentencia** (el CHECK rechaza el estado intermedio, y está bien que lo
  haga).
- **`''` vs `NULL`:** los CHECK usan `~ '[^[:space:]]'`, así que la base **acepta las dos
  representaciones del vacío**. **`NULL` es la canónica** y el servicio normaliza al guardar; hasta
  entonces, **cualquier `WHERE campo IS NOT NULL` está mal**. Vale para todo campo de texto opcional del
  esquema.
- **Asignación del correlativo:** race condition + reuso tras rollback (el `length+1` del prototipo hace
  las dos cosas mal).
- **«Una jornada no lleva acuerdos»** y **`ateneo.fecha` ↔ `grupo.anio`** (esta última **advertencia,
  nunca bloqueo**): las dos son cross-table, o sea que un CHECK no alcanza y §5.2.2 prohíbe los triggers.
- **Búsqueda de texto:** hoy btree en `titulo`. `tsvector`+GIN vs. `pg_trgm`, con la diferencia semántica
  explicada, cuando exista la consulta.
- **Autoría y timestamps:** no hay convención de esquema (`creado_en` existe en 1 de 38 tablas). Definirla
  para todo el esquema, no por módulo.

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

No es parte del plan técnico, pero lo condiciona. ⚠️ **Enmendado el 2026-08-20 (§5.28):** esto se
escribió el 14/08, cuando `consulta-a-ippu.md` no se había enviado. **Se envió el 2026-08-19.** Todavía no
hay respuesta, pero **hace un día**: no es que IPPU no conteste, es que no hubo tiempo. Lo que sigue vale
igual — la reunión sigue siendo el canal rápido — pero **sin leerlo como reclamo**. Sigue habiendo fecha de
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
   > ⚠️ **Tensión abierta (2026-08-20).** Esta decisión se tomó el 14/08 y el **19/08 el cuestionario salió
   > por correo igual**. O se revirtió sin escribirlo —que es justo lo que §12.6 pide no hacer— o el envío
   > se pensó como **complemento** de la reunión y no como reemplazo. **Lo aclara por escrito quien envió**,
   > en `handoff.md` §5. Mientras tanto valen las dos cosas: el cuestionario está en circulación y la
   > reunión sigue siendo donde se responden.
   > La agenda está en `docs/planes/agenda-reunion-ippu-2026-08.md`: pantalla por pantalla, con el supuesto
   > que cada una pone a prueba y lo que costaría un «no».

---

## Anexo A — Mapa de brechas: Prototipo v4 → estado actual

| Prototipo v4 | Estado actual | Acción |
|---|---|---|
| 6 bandas IDEA con nivel DSM y texto neutro | 3 bandas | M12.1 · D4 |
| Interpretación del Δ en 6 tramos con acción | Solo alerta Δ ≤ −7 | M12.1 |
| `IDEA_MANUAL_V` persistido por evaluación | No existe | M12.1 |
| 60 descriptores, «corregidos» en D3/D4/D6/D12 | 60 del texto oficial de Rivière | ✅ **Se mantienen los nuestros**; la versión corta entra como `descriptor_breve` (diff en M12.0) |
| `IDEA_FICHAS` (12) · `IDEA_EJ` (12) · `IDEA_REGLAS` (9) | No existen | M12.1 ✅ (`idea_ficha` 12 · `idea_ejemplo` 48 · `idea_regla` 9) |
| 14 talleres reales, catálogo dinámico, por nombre | 8 talleres inventados, catálogo cerrado | M12.3 · D5 |
| Grupos por color | `grupo.id (A..E)` | M12.1 · D9 |
| `baremo_categoria.implicancia` | **Ya está** (verificado en M12.0) | Sin trabajo |
| HCE-SEV | No existe | M12.4 ✅ (`severidad_dsm` 0..1 + `severidad_nivel` 3 grados; `hce_diurna.nivel_soporte` retirada, §5.24) |
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

> **Corregido el 2026-08-15 (§5.23):** el fan-out no era del todo libre. **`M12.4` va antes que `M12.6`** —
> no por esquema (la carga única de la sección VI es *ausencia* de columnas, así que M12.6 compila igual)
> sino **por conocimiento**: M12.6 necesita conocer la forma de `severidad_dsm` para escribir el mapeo «qué
> sección lee de qué tabla» que el plan le exige. **M12.5 y M12.7 siguen sin dependencias.** Orden
> efectivo: `M12.3` → `M12.4` → **[M12.5 · M12.6 · M12.7]** → `M12.8`.

Cortes buenos para revisar: **después de M12.1** (toca tablas con tests existentes y produce el diff de
descriptores, que tiene consecuencias clínicas) y **después de M12.2** (el cambio de modelo más profundo).
M12.6 es el más grande de los paralelos.
