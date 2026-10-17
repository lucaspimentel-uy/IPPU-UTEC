# Handoff — Proyecto IPPU × UTEC-LIDIA · Línea 1 (HCE + IDEA)

> **Bitácora de contexto entre sesiones.** Sirve para que cualquier sesión (Claude o persona)
> recupere el estado del proyecto sin releer todo. **Actualizar al final de cada sesión** (la cabecera y §6).
>
> ⚠️ **Este archivo está versionado en el repo desde el 2026-08-03** (antes era local y por eso el equipo
> trabajaba a ciegas — ver §12). Es el **contexto compartido de los tres**: leerlo al empezar, actualizarlo
> al terminar, pushearlo siempre. **Cómo trabajamos en paralelo sin pisarnos: §12.**
>
> **Estado al 2026-10-16 · sesión D0 (la presentación con un comando)** — una pantalla (§5.114); el detalle está en §5 (decisiones), §6 (pendientes) y `docs/bitacora.md`.
>
> - **Backend:** FastAPI + Postgres · **51 tablas** · head `dcc838486407` · 827 tests, 0 salteados · contrato `{data, warnings}` / `{code, detail[]}` (§5.108, §5.115).
> - **Acceso:** `POST /auth/login` → JWT (`SECRET_KEY` obligatoria); roles `admin` | `tecnico`; el técnico ve sólo los expedientes de sus grupos (fuera de alcance = 404) — §5.101, §5.118–§5.120.
> - **API:** `/hce` (alta, PATCH con baja/reingreso, búsqueda, listado paginado), `/grupos`, `/profesionales`, flujo, CI, IDEA → PA/PB → IC con `/documento`, y VF (§5.116–§5.118, §5.121).
> - **Reglas:** la secuencia sólo avisa; firmar = bloquear (409); el CI no traba nada (§5.94, §5.95).
> - **Seed de la demo:** `python -m app.seed_demo --url …`, por la API, 8 NNA (§5.120); no escribe sin `IPPU_SEED_DESTINO` = nombre de la base (§5.139). **Presentación en un comando:** `herramientas/preparar_presentacion.ps1` + chequeo `verificar_presentacion.js`, base `ippu_presentacion` (`CLAUDE.md`, «Presentación»).
> - **Demo conectada (Fase 3-a a 3-e):** login, listado, HCE-00 editable, alta, CI, LB/PA/PB, IC con documento A4 y VF; accesibilidad en la 3-e (§5.122, §5.124–§5.126, §5.135). Lo no conectado dice «Modo demostración — no se guarda».
> - **Verificación:** `conectada.js` 181/181 y contraste sin pares que fallen, sobre una base descartable. Cómo correr todo: `CLAUDE.md`, «Cómo correr».
> - **Próxima rebanada:** desarrollo de la demo (F1–F3 y C1–C7 del plan L1; D0 hecha) · guion de la demo del 2026-11-26 · recargar la presentación después del 2026-11-13 (§6) · ensayo.
> - **Plan L1 y prompts de sesión (§5.136 d):** https://claude.ai/artifact/MBRpxNWCpW2qd2CxhsLS5S
> - **Meta:** prototipo presentable sin datos reales el 2026-11-26 (demo HTML conectada a la API, en `localhost:5500`).
> - **Abierto con IPPU (no bloquea el 26/11):** Manual completo, pregunta B1 (§5.105) · cortes de la autogeneración de VF (§5.118) · acceso a la HCE actual y migración de datos, posteriores (§5.104).
> - **Sin responsable, fuera del 26/11:** crear/renombrar grupos desde la app (§5.90, §5.92).
> - **Equipo:** Lucas Pimentel (UTEC-LIDIA, responsable del documento) · Samuel · Victor — sin dueño exclusivo de módulos (§5.6). Precedencia de fuentes: `CLAUDE.md`, «Precedencia normativa».

---

## 0. Cómo retomar el trabajo (arranque rápido)
0. **`git pull`** y avisar en el grupo qué tomás (§12). Leer la cabecera de este archivo y `CLAUDE.md`: reglas vigentes y **cómo correr todo** (backend, seed, demo y verificación).
1. Rama corta desde `main`; las ramas se suben sólo a `origin` (`CLAUDE.md`, «Arranque de sesión»).
2. La documentación de IPPU convertida a Markdown está en **`docs/markdown/`**; los originales que se conservan, en `docs/fuentes/`.
3. **La demo** está en `implementacion/L1-hce-idea/demo/` (`index.html` + `css/estilos.css` + `js/*.js`: **16** módulos, medidos el 2026-10-16). **Necesita la API:** se sirve en `http://localhost:5500` y no abre por `file://`.
4. El **backend** está en `implementacion/L1-hce-idea/backend/` (su `README.md`). El esquema vigente es **`backend/docs/esquema-datos-v2.md`** (§2 tablas, §4 dónde vive cada regla).

---

## 1. Qué es el proyecto
Convenio estratégico **Fundación IPPU × UTEC** (Licenciatura en Ingeniería de Datos e IA, laboratorio **LIDIA**),
firmado en 2025, con implementación en 2026. Objetivo: aplicar IA y ciencia de datos a la atención de
**NNA (niños, niñas y adolescentes) con TEA** (Trastorno del Espectro Autista).

- **IPPU** = Instituto/Fundación Psico-Pedagógico Uruguayo. Montevideo. Fundada en 1980; Fundación desde 1983;
  estatus consultivo ONU (2008); convenio INAU (2017). HCE propia desde ~2020 (`fundacionippu.uy`, sistema React).
- **Población:** las fuentes dan **~120 NNA en total** y a la vez **convenio INAU: 30 · BPS: 108** (que
  suman **138**; ⚠️ discrepancia sin reconciliar — `docs/notas/preguntas-ippu.md` C11), en **5 grupos de
  referencia** por edad/modalidad — Inicial · Escolares · Preadolescentes · Adolescentes · Taller de
  Adolescentes (§5.61, **confirmados por IPPU el 2026-10-05**, §5.107). ~40 expedientes activos en la HCE. **14 talleres especializados** (§5.14).
  ~20 personas usan la HCE.

## 2. Las 4 líneas de trabajo
| Línea | Nombre | En una frase |
|---|---|---|
| **L1** ⭐ | **HCE + IDEA + analítica institucional** | Rehacer la HCE e integrar el inventario IDEA con arquitectura moderna. *Base estructural de todo.* |
| L2 | Pictogramas personalizados con IA | Generar pictogramas (CAA/AAC) desde fotos reales del entorno del NNA, con validación profesional. |
| L3 | Asistente virtual | Chatbot RAG 24/7 para técnicos, familias y docentes, con guardrails clínicos. |
| L4 | Patrones de visualización | Dashboards/analítica de patrones conductuales, comunicativos y sensoriales (incl. eye-tracking). |

> ⭐ **Foco de este proyecto/sesiones = L1.** Las 4 líneas se integran (sinergias): la HCE (L1) alimenta las
> visualizaciones (L4); los pictogramas (L2) se registran en la HCE y los entrega el asistente (L3); etc.

## 3. Línea 1 en detalle (FOCO)
**Problema:** la HCE actual (≈14 años, alojada externamente) está obsoleta: información estática, sin flujo
interno, sin consolidación histórica, sin análisis automático; informes 100% manuales en Word (1–2 h/semana).
Evaluaciones en papel/planillas sueltas, sin trazabilidad longitudinal ni comparativa entre períodos.

**Meta:** registro digital integrado en la HCE — de la evaluación IDEA al expediente del NNA en un solo flujo,
con consolidación histórica, análisis automático y reportes automáticos.

**Rol UTEC:** construir el **módulo de evaluación IDEA dentro del sistema HCE** (o como módulo nativo con API propia).

### Protocolo IDEA (Inventario de Espectro Autista — Ángel Rivière, 1997/2002)
- **4 escalas → 12 dimensiones (D1–D12); cada dimensión 0–8; total 0–96.** Menor puntaje = mejor (0 = sin trastorno, 8 = afectación severa). Criterio: asignar siempre el valor más bajo posible. Puntuaciones impares (1,3,5,7) para casos entre dos niveles.
  - **Escala A — Relación Social:** D1 Relaciones sociales · D2 Referencia conjunta · D3 Capacidades intersubjetivas/mentalistas (Teoría de la Mente).
  - **Escala B — Comunicación y Lenguaje:** D4 Funciones comunicativas · D5 Lenguaje expresivo · D6 Lenguaje receptivo.
  - **Escala C — Anticipación/Flexibilidad:** D7 Anticipación · D8 Flexibilidad · D9 Sentido de la actividad.
  - **Escala D — Simbolización:** D10 Ficción e imaginación · D11 Imitación · D12 Suspensión.
  - (Los descriptores oficiales de cada nivel están en `docs/markdown/escala-del-inventario-del-espectro-autista-idea.md` y embebidos en la demo HTML.)
- **Bandas orientativas — 6 tramos con soporte DSM-5-TR** (§5.13 / D4, 2026-08-14; **deroga** las 3 bandas
  anteriores «Leve 0–32 · Moderada 33–64 · Severa 65–96»):

  | Total | Perfil | Soporte DSM-5-TR |
  |---|---|---|
  | 0–15 | Muy leve | Nivel 1 |
  | 16–30 | Leve | Nivel 1 |
  | 31–55 | Leve a moderado | Nivel 1–2 |
  | 56–75 | Moderado | Nivel 2 |
  | 76–90 | Moderado a severo (alta necesidad de apoyo) | Nivel 2–3 |
  | 91–96 | Severo a muy severo (necesidad de apoyo muy sustancial) | Nivel 3 |

  Vocabulario institucional: «severo / muy severo» o «alta necesidad de apoyo», **nunca** «grave / muy
  grave». Cita del instrumento: «Rivière, **1997/2002**». Implementación pendiente en M12.1 (backend) y en
  la demo (`js/catalogos.js`, `js/ui-core.js`).
- **Ciclo de evaluación:** IDEA completa en **enero (inicial)** y **noviembre (final)**; **intermedia Likert en junio**
  (3 ítems/dimensión, escala 1–5). Conversión a equivalente IDEA: `(5 − promedio) × 2`.

### Arquitectura técnica objetivo (según presentación 13.05.2026)
- **Frontend:** React + React Router + Tailwind CSS. Módulo: Formulario IDEA (12 dim), Form Likert (3 ítems/dim), Informe final + BarChart (recharts). *(Arquitectura objetivo de la presentación; **para el 26/11 el frontend es la demo HTML conectada a la API**, React es posterior — §5.106.)*
- **API REST:** Node.js **o** Python **FastAPI** · **9 endpoints CRUD** · **autenticación JWT por terapeuta** · validación Zod/Pydantic · OpenAPI/Swagger.
- **Base de datos:** PostgreSQL (o MariaDB). Tablas: `nna`, `evaluaciones_idea`, `dimensiones_idea`, `items_likert`, `terapeutas`, `roles`. Prisma ORM / `pg_dump` backup.
- **Integración con la HCE existente:** vía **iframe** (mínimo viable) **o** módulo nativo con API propia.
- **DevOps:** Docker + NGINX · CI/CD GitHub.

### Estado de la demo L1 (`implementacion/L1-hce-idea/demo/index.html`)
- Prototipo HTML/CSS/JS, **datos simulados, "no funcional"** (sin backend). **Modularizado el 2026-08-07**
  (§5.5): dejó de ser un archivo único de 3.949 líneas → `index.html` + `css/estilos.css` + `js/*.js`.
- **v4.0 (2026-07-30, ronda M0–M10 completa, adaptada al Doc. Técnico IPPU v1.0):** motor de flujo CI→LB→PA→PB→IC (estado derivado, firma doble=bloqueo, addendas, habilitación excepcional, HCE-LOG), HCE-00 siempre abierto, HCE-CI (único bloqueo sin excepción), HCE-LB (IDEA línea base única con NS), HCE-PA/PB (Escala IPPU-TEA 24 ítems, delta B−A automático, alerta Δ≤−7, guard de no-homologabilidad), HCE-IC (informe único con tabla+radares y PDF, Recibí de la familia), HCE-DOC (adjuntos categorizados, archivo histórico §10 de solo lectura, protección de imagen §8.4 individual y grupal), HCE-ORG (INAU/BPS con registros), HCE-VF (BUND/CIF, tabla parametrizable, salvaguarda §7.5, autogeneración descriptiva, Reporte VF), búsqueda por 3 vías (nombre/CI/HCE/grupo), recordatorios configurables §4, Grupos y Usuario. "Eval. por áreas/general" **eliminadas** (archivo histórico en HCE-DOC).
- **v4.1 (2026-08-07): la Analítica institucional se calcula.** Era la única vista con los indicadores fijos (4 KPIs en el markup + 2 series en `ui-core.js`). Ahora `renderAnalitica()` los deriva del array `NNA` y del motor de flujo, y se recalculan con cada cambio (se llama desde `renderNNA()`). Quedan: cobertura de línea base · IDEA promedio de la LB con su banda · **Δ B−A de la Escala IPPU-TEA** (promediando el delta que registró el motor al firmar el PB, nunca recalculándolo) · ciclos de flujo completos; más el perfil poblacional por escala IDEA y una **tarjeta nueva y separada** de evolución Protocolo A → B. Al abrirla se vio que **"IDEA enero vs noviembre" y "mejora promedio anual" eran incalculables por diseño**: desde M4 el IDEA es línea base única y §5.2 prohíbe homologarlo con la IPPU-TEA — por eso el delta va en otra tarjeta y con la advertencia de que ahí el puntaje sube cuando hay progreso. Se retiró el KPI "Taller de mayor eficacia" (cruzar taller × escala es el heatmap, fuera de alcance por §5.1.3).
- Las vistas heredadas pre-Doc. Técnico que siguen en el archivo sin exponerse: "Eval. intermedia" (reemplazada por PA/PB). El heatmap de talleres de Analítica no se tocó (decisión §0.3) y desde v4.1 está **rotulado "datos ilustrativos"**, para que no quede un gráfico simulado sin marcar entre tres calculados.

## 4. Qué se hizo en esta sesión (2026-06-30)
Sesión inicial del proyecto. Lo que rige hoy está en la cabecera de este archivo; la historia de sesiones, en `docs/bitacora.md`.

## 5. Decisiones tomadas

> **Sobre la etiqueta `(L#)` de los títulos (decodificación, §5.77 / L9, 2026-09-03).** Entre §5.10 y
> §5.69 los títulos llevan un paréntesis `(D1)`, `(I3)`, `(L8)`… Esa letra+número **contaba decisiones
> dentro de una serie**, no sesiones: la serie **L** llegó a `(L16)` en §5.69. Los **nombres de sesión**
> de la bitácora (§13) contaron **sesiones** — L5, L6, L7, y ésta, **L9** — y las dos numeraciones
> **divergieron** (no hay «sesión L8» en §13; la hoja de decisiones que esta sesión ejecuta se armó en una
> instancia intermedia). **Desde §5.70 las entradas nuevas NO llevan etiqueta:** se citan sólo por
> `§5.NN`, que es la clave estable y append-only. Las etiquetas ya escritas **se dejan como están** —
> están citadas en commits (`af98184`, `cd98f67`) y en referencias cruzadas, y renumerar rompería enlaces.

- Proyecto vive en `C:\Proyectos\IPPU`. Workflow: `cd` a la carpeta → `claude`.
- Originales en `docs/fuentes/`; conversiones en `docs/markdown/`; código por línea en `implementacion/Lx-...`.
- La demo se renombró de `hce_idea_ippu_demo (1).html` → `hce_idea_ippu_demo.html`.
- `L1 = HCE/IDEA` se toma como numeración **canónica** (presentación 13.05.2026 + demo).

### 5.1 Decisiones de la ronda de adaptación al Documento Técnico (2026-07-15, plan §0)
1. **El Documento Técnico IPPU v1.0 (jul-2026) gana** en caso de conflicto con la presentación 13.05.2026 (ej. ya identificado: frecuencia del IDEA → deja de ser anual, ver M4).
2. **"Evaluación por áreas" y "Evaluación general" se descartan** como módulos activos → pasan a archivo histórico de solo lectura (§10 Doc. Técnico). En M0 se ocultaron sus accesos en la demo; se resuelven formalmente en M7 (HCE-DOC).
3. **Fuera de alcance:** Taller Terapéutico y Clínica. Toda esta ronda = **Servicio de Atención Diurna**. El heatmap de talleres existente no se extiende ni se rompe.
4. **Baremo (BUND):** validado parcialmente — Decreto 72/025 vigente; los cortes exactos (0–4 / 5–24 / 25–49 / 50–95 / 96–100 %) los confirma IPPU contra el anexo del Decreto. Se implementa como **tabla parametrizable** (M9); no bloquea la demo.
5. **Roles de técnicos:** lo simple — fijos "Psicólogo/a" + "Maestro/a", con campos genéricos (`tecnico1_rol` / `tecnico2_rol`) para portabilidad futura. Sin UI de configuración institucional en esta ronda.
6. **`modelo-datos.md`** (propuesta Postgres+JSONB de un integrante): **registrada, no adoptada.** Se retoma en M11, después de corregir los bugs A y B del Anexo A del plan y cerrar las 3 decisiones de arquitectura.

### 5.2 Decisiones de arquitectura de M11 (2026-07-30, Lucas — cierran el Anexo A del plan)
1. **BD: Postgres-only.** Dev y prod contra PostgreSQL vía docker-compose (se adelanta esa parte de la Fase 6). Se abandona SQLite en dev — revierte la decisión previa, con el modelo clínico ya estable y un esquema v2 que usa JSON/CHECKs donde SQLite es permisivo.
2. **Lógica de negocio: en el servidor** (Pydantic + servicios FastAPI), como las Fases 0–2. Las reglas duras (delta sólo entre protocolos, baremo sólo desde % oficial, validaciones §4.3) son guards en Python, testeables con pytest. La BD guarda integridad estructural (FKs, UNIQUE, CHECKs simples de rango) — no reglas clínicas, no triggers PL/pgSQL.
3. **Portabilidad: paramétrico mínimo.** Sólo lo que el Doc. Técnico exige como dato configurable: tabla `baremo_categoria` (§0.4), roles como texto (`tecnicoN_rol`), recordatorios como tabla simple, categorías documentales como catálogo. Sin capa `config_institucion`/`vocabulario` ni UI de configuración.
- **Bugs A y B de `modelo-datos.md`:** se corrigen en el esquema v2 (informe de cierre 1:N por ciclo anual; persona↔servicio N:M sin 1:1 obligatorio).

### 5.3 Decisiones de coordinación del equipo (2026-08-03, Lucas)
Contexto: se detectó **trabajo duplicado y contradictorio** — la rama `gitlab/feature/base-datos-hce`
(Victor, 2026-07-15, 1.605 líneas) contiene un diseño **completo y verificado** de la BD en
`implementacion/hce-db/` (PostgreSQL + JSONB, esquema `hce`, catálogos, seed de los 4 demo, probado
end-to-end en PG18, con los mismos números que la demo: IDEA 58 · PA 60 · PB 79 · Δ +19), pero construido
sobre la decisión **opuesta** a §5.2: las reglas de negocio viven en **triggers PL/pgSQL**
(`03_funciones_triggers.sql`), y su `CONTEXTO.md` §3 propone archivar el backend FastAPI.
No fue un error de nadie: **esa rama se hizo sin acceso a `handoff.md` ni `CLAUDE.md`**, que estaban en
`.gitignore` y por lo tanto no existían para el resto del equipo.

1. **Seguimos en `main`** con el esquema v2 ya propuesto (`backend/docs/esquema-datos-v2.md`) y las
   decisiones de §5.2 (lógica en el servidor, sin triggers). No se adopta la rama `hce-db`.
2. **La rama `feature/base-datos-hce` queda aparcada, no descartada.** Sigue viva en GitLab; su SQL es
   **material de consulta valioso** para M11 (ver §12.5: qué reutilizar de ahí).
3. **`handoff.md` y `CLAUDE.md` salen del `.gitignore`** y pasan a versionarse: son el contexto compartido.
   Sin esto, cualquier integrante (o sesión de Claude) arranca sin conocer las decisiones ya tomadas.
4. **M11 lo toma Victor**, en una sesión nueva y con todo el contexto del proyecto disponible.
5. Se adopta el **flujo de trabajo de §12** para trabajar los tres en paralelo sin solaparnos.

### 5.4 Remoto principal y `docs/notas/` (2026-08-07, Lucas)
1. **`gitlab` (UTEC) queda ratificado como remoto principal**, `origin` (GitHub) como espejo — cierra la
   propuesta que §12.2 dejaba abierta ("a confirmar entre los tres"). Se sigue pusheando a los dos en
   cada sesión (§12.2/§12.4); lo que cambia es que `gitlab` es la fuente de verdad si algo diverge.
2. **`docs/notas/` sale de la documentación** (`README.md`, `CLAUDE.md`). Estaba vacía desde su creación
   y, al no tener contenido, git nunca la trackeó — Samuel y Victor no la tenían al clonar pese a que la
   documentación decía que existía. Se elimina la referencia en vez de crear el placeholder; si surge
   contenido real de notas de equipo, se crea entonces.

### 5.5 Modularización de la demo (2026-08-07, Lucas)
La demo dejó de ser `hce_idea_ippu_demo.html` (3.949 líneas en un archivo) y pasó a
`demo/index.html` + `demo/css/estilos.css` + `demo/js/*.js` (12 archivos). El archivo viejo se
**eliminó** (queda en la historia de git). Motivo: era el único recurso del repo que obligaba a la regla
"una sola persona a la vez" (§12.3) y bloqueaba el trabajo en paralelo.

1. **Scripts planos, sin `defer` ni `type="module"`.** Dos razones, las dos duras:
   (a) el orden de carga de `index.html` **es** el orden de ejecución del monolito original, y hay
   código de seed que corre en tiempo de carga y muta `NNA` — reordenar cambia el comportamiento;
   (b) `type="module"` lo bloquearía CORS al abrir por `file://`, y la demo se abre con doble clic,
   sin servidor. **No convertir a ES modules sin resolver antes las dos cosas.**
2. **`js/utils.js` carga primero** y contiene los helpers puros compartidos. En el monolito, un único
   `<script>` hoisteaba todas las declaraciones de función, así que el seed de `flujo.js` podía llamar a
   `fmtFecha()` declarada 1.000 líneas más abajo. Al partir, el hoisting es **por archivo**: esa llamada
   se rompió. Si aparece otro helper con el mismo patrón, va a `utils.js` — no se reordenan los módulos.
3. **Verificación:** se capturó un *fingerprint* de comportamiento (Playwright) del monolito **antes** de
   partir y se comparó contra el resultado: **40 comparaciones, todas idénticas, 0 errores.** Cubre carga,
   catálogos, las 174 funciones globales, el motor de flujo M1 de los 8 NNA, las 5 vistas, los 8 expedientes,
   **las reglas duras** (`calcularDelta` lanza contra el IDEA §5.2 · `categoriaBaremo` lanza desde puntaje
   clínico §7.5, con bordes del baremo), y **los caminos interactivos**: firma de CI con autorizaciones,
   firma PA+PB con delta B−A y alerta institucional (M5.3), addenda sobre firmado y su rechazo sobre no
   firmado, habilitación excepcional, modales, vistas dinámicas y el volcado final del modelo.
   Además se verificó línea por línea que no se perdió ni alteró código (2.719 de JS, 510 de CSS, 499 de markup).
   **Cero cambios de lógica: es un refactor puro.**
4. **El fingerprint quedó versionado** en `demo/verificacion/` (script + comparador + README), no en la
   máquina de quien lo corrió — si no, §5.5.3 sería una afirmación que nadie puede reproducir (§12.1).
   Reusarlo ante cualquier cambio que *no debería* alterar el comportamiento. Playwright se instala suelto
   y a demanda; no es dependencia del repo.

### 5.6 Reparto del trabajo: no hay módulos exclusivos (2026-08-07, Lucas)
Se levanta la asignación por dueño. Cualquiera de los tres puede tomar cualquier módulo —incluido
**M11 (backend v2)**, que §5.3.4 había asignado a Victor—. Lo que se mantiene es **avisar en el grupo qué
se toma** antes de empezar y anotarlo en §6.

- **Qué cambia:** §5.3.4 ("M11 lo toma Victor") deja de ser una asignación exclusiva. §12.3 pasa de "nos
  repartimos por módulo" a "se avisa qué se toma": la columna *Regla* de esa tabla se lee como coordinación,
  no como propiedad. §12.4 paso 2 ya no exige *confirmar que nadie tomó tu módulo*, alcanza con avisar.
- **Qué NO cambia:** el resto de §12 sigue igual — contexto versionado (§12.1), push a los dos remotos
  (§12.2), vida máxima de una rama ~1 semana (§12.4) y, sobre todo, la **regla anti-contradicción (§12.6)**.
  Que no haya dueños no habilita a contradecir una decisión de §5: eso se sigue frenando y se resuelve por
  escrito.
- **Por qué:** con la demo ya modularizada (§5.5) desapareció el único recurso que forzaba exclusividad, y el
  cuello de botella pasó a ser la espera. El riesgo que atacaba §5.3 nunca fue que dos tomaran el mismo
  módulo, sino que trabajaran **sin ver las decisiones del otro** — y eso lo resuelve el contexto versionado,
  no el reparto.

### 5.7 Los originales no entran al grafo de conocimiento (2026-08-07, Lucas)
`docs/fuentes/` (PDF · DOCX · PPTX · XLSX · HTML) queda **excluido del indexado de `/graphify`** con un
`.graphifyignore` en la raíz. Al grafo entra sólo `docs/markdown/`: la misma información a una fracción de
los tokens. Medido con `graphify detect`: el corpus pasó de **77 a 72 archivos** y de **99.608 a 78.110
palabras (−21 %)**, y salió del lote el `IPPU.pdf` escaneado de 2,2 MB, el más caro de extraer.

**Se excluyen del grafo, no se borran del repo.** Se evaluó eliminar la carpeta y se descartó por dos
motivos concretos: los originales son el respaldo verificable de lo que entregó IPPU y la única fuente para
rehacer una conversión lossy (`IPPU.md` salió de OCR), y `HCE_IPPU_Prototipo_v1.html` **no tiene** conversión
markdown a propósito (es una app JS; Docling rinde sólo el shell estático vacío — §13, M0), así que borrar la
carpeta dejaba sin equivalente a un archivo que la cabecera cita como referencia de UX/reglas.

> La regla "trabajar sólo con las conversiones markdown" es una **preferencia general de trabajo de Lucas**,
> no una particularidad de este proyecto: aplica igual en cualquier repo.

### 5.8 Arranque de M11 sin la validación previa de IPPU (2026-08-07, Lucas — **a ratificar por el equipo**)
`backend/docs/esquema-datos-v2.md` §6 define la validación de la demo con IPPU como **puerta formal de
M11** ("si IPPU pide cambios en la línea base única, se ajusta `idea` antes de M11.2"), y §7 repite
"no antes de validar M0–M6 con IPPU". Esa validación **no ocurrió** y aun así se hicieron M11.1 y M11.2.

**El criterio:** la puerta es específicamente sobre la forma de la tabla `idea`, no sobre el esquema
entero. De las 28 tablas, 27 son inmunes a lo que IPPU responda. Si pidieran volver al IDEA anual, el
arreglo es agregar `anio` y cambiar un `UNIQUE` — barato **ahora**, caro después de que M11.3 y M11.4
construyan encima. Frenar todo dejaba la ronda parada por tiempo indefinido.

**Esto no es una decisión cerrada como las de §5.2: está pendiente de ratificación del equipo**
(anotada en `docs/notas/puntos-a-validar.md` §2.1). Si el equipo la rechaza, se revierte M11.2 y se
espera. Se registra acá por la regla anti-contradicción: cambiar de hecho lo que un documento decide
por escrito es exactamente lo que §5.3 buscaba evitar.

### 5.9 Puerto 5440 para el Postgres de desarrollo (2026-08-07, Lucas)
`docker-compose.yml` publica Postgres en **`127.0.0.1:5440`**, no en 5432 ni 5433. Motivo concreto: en
la máquina donde se montó había un PostgreSQL local escuchando en 5433 que se quedó con el binding
IPv4; Docker tomó sólo el IPv6 y `localhost` conectaba **al Postgres equivocado** con un
`password authentication failed` que no delataba la causa. El bind explícito a `127.0.0.1` evita el
problema y además no expone la base al resto de la red. Si a alguien le choca el 5440, se cambia en
`docker-compose.yml` y en su `.env`: **nada del código depende del número**.

---

## 5.10 → 5.18 · Decisiones de la ronda M12 (2026-08-14, Lucas)

> **Contexto.** IPPU publicó su **Prototipo v4** (`https://lovely-salmiakki-4db73d.netlify.app/`) junto con
> el **Manual de Procedimientos v1.0** (ago-2026). Es la especificación más precisa que tenemos de cómo
> trabaja la institución, y es más nueva que el Documento Técnico v1.0 de julio. Se abre la ronda **M12 —
> Absorción del Prototipo v4**, intercalada **entre M11.2 (hecho) y M11.3 (sin arrancar)**: toca la misma
> capa que M11.2 —modelos, migración inicial, catálogos—, y escribir los servicios de M11.3 contra un
> modelo que está por cambiar es el trabajo que después hay que rehacer.
> Rige `docs/planes/PLAN-M12-absorcion-prototipo-v4-2026-08.md`.
>
> **Principio de la ronda.** El objetivo **no es replicar el prototipo de IPPU**: es trasladar a nuestro
> sistema **la forma de trabajar de la institución**. Se toma lo vinculante (talleres, bandas,
> descriptores, secciones del PAI, cortes del baremo, secuencia, reglas de firma y vocabulario) y se
> descarta su implementación (nombres de campo, agrupación de tablas, paleta, tipografía, layout,
> navegación, routing, iframes). **Donde el prototipo y el buen modelado no coincidan, gana el buen
> modelado**, y queda anotado en el commit.
>
> **Cinco de estas nueve decisiones derogan cosas ya escritas.** Por eso se escriben acá **antes** de tocar
> una línea de código: es exactamente el caso que cubre la regla anti-contradicción (§12.6).
>
> **Lo que estas decisiones NO habilitan:** reabrir Postgres-only, mover lógica de negocio a triggers, ni
> construir la capa de configuración institucional completa. **§5.2 sigue entera en pie.**

### 5.10 (D1) Precedencia normativa: Manual v1.0 + Prototipo v4 > Documento Técnico v1.0
Orden de precedencia, de mayor a menor: **Manual de Procedimientos v1.0 + Prototipo v4 (ago-2026)** →
**Documento Técnico IPPU v1.0 (jul-2026)** → presentación 13.05.2026. En conflicto, gana el de arriba.
- **Deroga** la cabecera de este archivo (fuente normativa) y **actualiza §5.1.1**, que puso al Documento
  Técnico por encima de la presentación: esa relación sigue valiendo, pero ahora hay un escalón más arriba.
- **Por qué:** es material posterior, de la propia institución, y responde con precisión cosas que el
  Documento Técnico dejaba abiertas (talleres reales, bandas, descriptores, secciones del PAI).

### 5.11 (D2) Alcance: se cubre todo el modelo institucional del Servicio de Atención Diurna
Se absorbe **todo** lo que el Prototipo v4 especifica para el Servicio de Atención Diurna. **No hay triage
sobre *qué* se cubre**; sí hay criterio propio sobre *cómo* se implementa (ver el principio de la ronda).

### 5.12 (D3) Clínica y Taller Terapéutico siguen fuera de alcance
Los dos están embebidos en el prototipo (`CLINICA_HTML_B64`, `TALLER_HTML_B64`, 63 y 68 KB) y montados en
`<iframe>`. **No se extraen esos base64.**
- **Ratifica §5.1.3 con fundamento nuevo:** el propio prototipo declara esa integración como "de navegación
  y presentación" y deja la identidad única "a resolver en el sistema definitivo". De esa parte resolvemos
  **solo el modelo**, y ya está resuelto: `persona` + `persona_servicio` (§3.1 del esquema v2, bug B).
- Si el alcance cambia, los base64 siguen disponibles dentro del HTML original.

### 5.13 (D4) Bandas del IDEA: de 3 tramos a 6, con soporte DSM-5-TR, como catálogo paramétrico
| Total | Perfil | Soporte DSM-5-TR |
|---|---|---|
| 0–15 | Muy leve | Nivel 1 |
| 16–30 | Leve | Nivel 1 |
| 31–55 | Leve a moderado | Nivel 1–2 |
| 56–75 | Moderado | Nivel 2 |
| 76–90 | Moderado a severo (alta necesidad de apoyo) | Nivel 2–3 |
| 91–96 | Severo a muy severo (necesidad de apoyo muy sustancial) | Nivel 3 |

- **Deroga §3** de este archivo ("Bandas orientativas: Leve 0–32 · Moderada 33–64 · Severa 65–96"), ya
  actualizada más arriba. Alcanza a la demo (`js/catalogos.js`, `js/ui-core.js`) y al backend (`banda_idea`).
- El **texto orientativo** de cada banda se copia tal cual del prototipo (`ideaInterpreta`): es
  deliberadamente neutro —alude solo a escalas y dimensiones del IDEA, no prescribe abordajes— y
  reescribirlo rompe esa propiedad.

### 5.14 (D5) Talleres: catálogo dinámico, participación por nombre, y los 14 reales
`taller` pasa a ser un **catálogo administrable por coordinación** (`activo`, `grupos_orientados`,
`retirado_en`); la participación se registra **por nombre**, de modo que agregar, reordenar o desactivar un
taller nunca altera lo ya registrado. Un taller retirado queda visible, marcado.
- Se cargan **los 14 talleres reales** del prototipo y **se retiran los 8 nuestros**: no coincide ninguno.
  Los nuestros salían de la demo, que los inventó — no venían de ninguna fuente de IPPU.
- **Deroga la carga de talleres de M11.2c** y **cierra `puntos-a-validar.md` §1.3**: el "8 vs 18" era falso.

### 5.15 (D6) Portabilidad: se amplía §5.2.3
Suman como catálogos paramétricos: **bandas del IDEA · interpretación del Δ · catálogo de centros
educativos · catálogo de talleres · recordatorios**.
- **Amplía §5.2.3, no la deroga:** sigue **sin** capa `config_institucion` genérica, sin `vocabulario` y
  **sin UI de configuración**. Sólo se parametriza lo que la institución efectivamente ajusta.

### 5.16 (D7) Kappa: se modela ahora, se calcula después
Se agregan `valor_t1` / `valor_t2` (nullable) junto al `valor` consensuado, con el evaluador identificado,
por cada dimensión del IDEA y cada ítem de protocolo, más el registro del **procedimiento de consenso**
(diferencia 0 → registrar · 1 → discusión breve · ≥2 → ambigüedad clínica, exige documentación).
- ⚠️ **Esto es agregado nuestro, no del prototipo.** El prototipo guarda un **único array de consenso**
  (`punt[12]`, `punt[24]`) y **no** tiene puntuación por evaluador; declara kappa como requisito y no lo
  implementa. Lo agregamos porque el Manual lo llama "el único requisito metodológico invariante" y porque
  hacerlo después de M11.3 cuesta migración **más** reescritura de servicios.
- **No se calcula kappa en esta ronda**: sólo se guardan los datos que lo hacen posible. Una evaluación
  **sin** puntuaciones independientes sigue siendo válida (hace falta para migrar históricos).

### 5.17 (D8) Roles genéricos por defecto
Se mantienen `tecnicoN` + `tecnicoN_rol` (texto). **No** se adoptan `psicologa`/`maestra` como nombres de
campo.
- **Amplía §5.1.5.** El prototipo **declara** portabilidad de roles ("Técnico/a responsable 1 y 2 con
  etiqueta configurable") pero los tiene **hardcodeados en el modelo**. Implementamos lo declarado, no lo
  implementado (contradicción interna del prototipo, Anexo B.2 del plan).

### 5.18 (D9) La tabla `grupo` se corrige: id propio + `UNIQUE(nombre, anio)`
**CONFIRMADA POR EL EQUIPO el 2026-08-14** (Lucas). Era lo único que bloqueaba M12.1; se implementa ahí.

```
grupo
  id            PK, serial      -- identificador vacío: no es la letra ni el color
  nombre        text            -- "Grupo Azul" · "Grupo Celeste" · "Grupo Naranja" · "Grupo Verde"
  anio          smallint
  tecnico1_id, tecnico1_rol · tecnico2_id, tecnico2_rol
  UNIQUE (nombre, anio)
```

- **Dos motivos, no uno.** (a) La PK por letra **no admite más de un año**: crear el grupo A de 2027 obliga
  a sobrescribir el de 2026 y los expedientes viejos pasan a apuntar al nuevo sin aviso (limitación ya
  registrada en §6 y en `esquema-datos-v2.md` §2.1). (b) **La PK `A..E` no representa el dominio real**:
  los grupos de IPPU son **por color** — Azul, Celeste, Naranja, Verde.
- **Cierra `puntos-a-validar.md` §2.6** eligiendo la opción (b) de las tres que estaban sobre la mesa.
- **Con id propio, «Azul 2026» y «Azul 2027» son dos filas distintas** y el vínculo de cada expediente
  (`hce_diurna.grupo_id`) no se mueve nunca. El `UNIQUE` impide el problema opuesto: dos filas
  "Azul 2026" por error.
- **Granularidad anual, no por fecha** (aclaración de la confirmación). Con fecha completa, "Azul
  2026-03-01" y "Azul 2026-08-15" serían dos filas válidas y volvería a haber dos grupos Azul en el mismo
  año. Además `anio` es la granularidad que ya usan `protocolo` e `informe_cierre` para los ciclos
  anuales: mantenerla es **coherencia interna del esquema**, no preferencia.
- **Nombres por color en la propia fila, sin catálogo aparte.** Si en 2028 dejan de usar "Naranja", la
  fila de 2026 lo sigue diciendo. Un catálogo de colores sólo agregaría una tabla que mantener.
- **Los técnicos van en la fila del grupo**: es lo que hace que se preserve quién estuvo a cargo cada año,
  y es el punto que justifica todo el cambio.
- ⚠️ **Límite aceptado, queda anotado:** con granularidad anual, si un técnico cambia a mitad de año la
  fila se sobrescribe y sólo queda rastro en la auditoría. Se acepta por ahora — modelar vigencias por
  técnico es bastante más caro. Depende de las respuestas de IPPU a §3.6 y §3.7 de
  `docs/notas/consulta-a-ippu.md` (qué hacen cuando falta un técnico y cuando un chico cambia de grupo;
  eran §3.7/§3.8 antes de la revisión del equipo del 19/08 — §5.34).
  **Si responden que pasa seguido, se revisa.**

### 5.19 (E1) **Enmienda** a la regla de migraciones de M12: se regenera por sub-módulo, no al final (2026-08-14, Lucas)
La regla original del plan (§3 de `PLAN-M12-absorcion-prototipo-v4-2026-08.md`) congelaba
`alembic revision --autogenerate` **hasta M12.8**. **Queda enmendada así:**

> La migración inicial única se regenera **al cerrar cada sub-módulo de M12**, con el test
> `test_la_migracion_coincide_con_los_modelos` pasando. Se congela **sólo si hay trabajo en paralelo real**
> sobre `app/models/` — en ese caso se descongela al terminar el paralelo y regenera **una sola persona**.
> Mientras la ronda la ejecute alguien solo, **no hay congelamiento**.

- **Por qué se enmienda (dos motivos).** (a) El motivo original era evitar que tres `autogenerate` en
  paralelo conflictúen; **hoy no aplica: la ronda la está ejecutando una sola persona.** (b) Aun cuando
  aplicara, se pasó por alto que dejar diferencias acumulándose hasta M12.8 es **justamente lo que la regla
  quería evitar**: M12.1 ya dejaba 32 diferencias y después del fan-out (M12.3–M12.7) serían más de cien,
  de autores distintos, vistas por primera vez al final. El riesgo se movía de sitio, no desaparecía.
- **Qué cambia en la práctica:** el test de coincidencia modelos ↔ migración **deja de estar salteado** y
  vuelve a ser bloqueante. Cerrar un sub-módulo incluye regenerar la migración inicial única y correr la
  reconstrucción limpia (drop schema → `alembic upgrade head` → `python -m app.seed_catalogos`).
- **Deroga** la «Regla de migraciones» de §3 del plan, el recuadro de ajuste al criterio de verificación de
  M12.1, el ⚠️ de la cabecera de este archivo y el de `CLAUDE.md`, y la línea de §6 sobre M12.8 (todos
  corregidos en esta sesión). **M12.8 sigue existiendo como cierre**, pero ya no es el único momento en que
  se toca la migración.
- **Se sigue manteniendo una migración inicial *única*:** no se apilan revisiones. Se regenera el mismo
  archivo, no se agrega uno nuevo por sub-módulo.
- **Aplicada en la misma sesión:** migración regenerada con las 33 tablas de M12.1 y test reactivado.

### 5.20 (E2) Se retira `hce_taller`: la participación en talleres la modela M12.6 como `pai_taller` (2026-08-14, Lucas)
`HceTaller` (`app/models/identidad.py`, N:M `hce_diurna` ↔ `taller` por FK) **se elimina**, junto con
`HceDiurna.talleres`. **El conteo de tablas baja de 35 a 34 — no es una regresión, es esto.**

- **Qué es:** un resto del esquema v1 que sobrevivió el rewrite a v2 sin revisarse contra las decisiones
  nuevas. Modela la participación **viva, por expediente y por `taller_id`**.
- **Qué dice la fuente normativa:** las Especificaciones Técnicas del Prototipo v4 (§3, modelo sugerido)
  fijan `pai_taller { pai_id, taller_nombre }` — **por nombre** y **por instancia de PAI**, no por
  expediente ni por FK. Es exactamente lo que D5 (§5.14) decidió: agregar, reordenar o retirar un taller
  no puede alterar lo ya registrado, y un `taller_id` ata el registro a la fila del catálogo.
- **Por qué se borra en vez de adaptarse:** no son dos implementaciones de lo mismo, son **dos modelos
  distintos** (unidad de registro distinta y clave de participación distinta). Dejar los dos garantiza dos
  fuentes de verdad sobre "en qué talleres está el NNA", que es justo lo que §5.3 manda evitar.
- **Costo cero hoy:** relevamiento verificado — **0 tests, 0 seed, 0 routers, 0 schemas** la referencian.
  No hay datos reales ni nada desplegado.
- **Deroga:** el `HCE_DIURNA }o--o{ TALLER` del diagrama ER §1 de `backend/docs/esquema-datos-v2.md` y la
  fila `hce_taller` de su §2.1.
- **Consecuencia para M12.6:** la participación **no tiene nada preexistente que reusar**; la construye ese
  módulo como `pai_taller`. Queda anotado en el plan, junto con el criterio de verificación de M12.3 que se
  le traspasa (ver §5.21).

### 5.21 (E3) El test de participación de M12.3 pasa a M12.6 (2026-08-14, Lucas)
El plan pedía verificar M12.3 con un test que "carga participación en Taller de huerta, lo retira del
catálogo y afirma que la participación sigue legible y marcada como retirada". **No es escribible en
M12.3:** con `hce_taller` retirada (§5.20) y `pai_taller` sin construir, **no existe tabla de
participación**. Se traspasa **tal cual a M12.6**, que es donde nace `pai_taller`.
- **No se inventó una tabla de participación en M12.3 ni un mock que finja una** que M12.6 va a modelar
  distinto: sería exactamente el trabajo duplicado que §5.3 documenta.
- M12.3 verifica lo que sí le corresponde: el catálogo (los 14, `activo` derivado, `grupos_orientados`,
  `orden`, idempotencia del seed). Ver bitácora §13.

### 5.22 (E4) La sección V de HCE-PAI no duplica HCE-INC: es carga única (2026-08-15, Lucas)
`centro`, `modalidad` y `grado` viven en **`inclusion`** (M12.5) y **no** se modelan como columnas propias
de `pai` (M12.6): la sección V pasa a ser una **sexta sección de carga única**, junto a I, II, VI, XI y XV.
`apoyosEd` y `otrasEd` **sí** son de PAI y se quedan ahí.

- **Fundamento principal.** El PAI de INAU es un **documento dinámico** que debe reflejar el estado actual
  del NNA, con actualización en SIPI ante cualquier cambio significativo y revisiones formales periódicas.
  Una copia congelada del centro educativo contradice esa obligación. **El propio prototipo lo corrobora:**
  `fRev`, `fAnual`, `frecuencia`, `etapa` y la sección IX «Evaluación del PAI anterior (solo
  actualizaciones)» sólo tienen sentido en un instrumento con revisión periódica.
- **El reparto que fija.** Lo que **se compromete** se congela por instancia (`pai_objetivo`,
  `pai_coordinacion` son filas hijas de ese PAI; la firma marca el inicio de esos compromisos). Lo que es
  **diagnóstico de situación** se lee en vivo. La sección V es diagnóstico, no compromiso.
- **Fundamento secundario:** mismo criterio de fuente única que §5.20 (`hce_taller`), que `sensible`
  (M12.5) y que `activo` (M12.3). El prototipo dejó V editable, pero ahí `centro` es **texto libre en
  ambos lados** y duplicar no cuesta nada; nosotros lo convertimos en FK a catálogo.
- **Modo de falla que evita:** el PAI se presenta a INAU; con copia propia, un cambio de centro en HCE-INC
  no se refleja y se entrega **un dato desactualizado a un organismo del Estado**.
- **El registro histórico se resuelve archivando el PDF** de cada revisión en HCE-DOC, como el informe de
  cierre — no duplicando columnas.
- **Costo de orden: ninguno.** Carga única es *ausencia* de columnas, no FK: M12.5 y M12.6 siguen siendo
  independientes entre sí y se pueden hacer en cualquier orden.
- ⚠️ **Reversible, con la carga de la prueba invertida:** hoy documentar el PAI como foto congelada es lo
  que requeriría justificación. **Fuente: investigación sobre normativa INAU (2026-08-15), no material
  entregado por IPPU** — confirmar en la reunión.

**Dos consecuencias para M12.6, anotadas ahora:**
1. **`pai` NO lleva `UNIQUE(hce_id, anio)`.** Con revisión semestral puede haber más de un PAI por año
   (inicial + actualización; de ahí `tipo` y la sección IX). **No replicar el patrón de `informe_cierre`**,
   que sí es anual único.
2. **Verificar el nombre oficial con IPPU:** el prototipo dice «Propuesta de Atención Individual»; la
   normativa INAU aparece como «Proyecto de Atención Integral». Los campos confirman que es el mismo
   instrumento; el nombre va impreso en lo que se entrega. → `consulta-a-ippu.md` y `puntos-a-validar.md`
   §1, sincronizados.

### 5.23 (E5) M12.4 va antes que M12.6 — dependencia de conocimiento, no de esquema (2026-08-15, Lucas)
M12.6 **no necesita `severidad_dsm` para compilar** (la carga única de la sección VI es *ausencia* de
columnas), pero **sí necesita conocer su forma** para escribir el mapeo «qué sección lee de qué tabla» que
el plan le exige. Queda fijado el orden **M12.4 → M12.6**; **M12.5 y M12.7 siguen libres** y sin
dependencias entre sí. Corregidos el checklist de §6 y el plan.

Anotado además en el plan §M12.6: **verificar contra el JS del prototipo** si los campos de cabecera de las
secciones de carga única (`padronInau`, `disposicion`, `judicial`, `expediente`) existen en el objeto `pai`
o sólo se renderizan desde HCE-ORG. `prototipo-v4-referencia.md` §7 afirma **las dos cosas** y no pueden ser
ciertas a la vez.

### 5.24 (E6) Se retira `hce_diurna.nivel_soporte`: era una tercera fuente de verdad sobre el nivel DSM (2026-08-15, Lucas)
Al modelar HCE-SEV (M12.4) iban a convivir **tres** lugares con un «nivel DSM». Relevados los tres, **uno
no era un dato**: `hce_diurna.nivel_soporte` (`String(40)`, nullable) **se elimina**. El conteo de tablas
no cambia; es una columna.

**Qué queda, y por qué son cosas distintas:**
- **`banda_idea.nivel_dsm`** (M12.1 · D4) — **se queda.** Es propiedad **de la banda**, no del NNA: dice
  «un total de 56–75 se corresponde orientativamente con Nivel 2». Es contenido del catálogo, no un juicio
  sobre nadie. Gana docstring aclarándolo y su guard en §4 del esquema.
- **`severidad_dsm.nivel_cs` / `.nivel_crr`** (M12.4) — **la evaluación actual de IPPU**, por juicio
  clínico, separada por dominio, con justificación, fecha y autor.

**La hipótesis que se probó y se refutó.** Se sospechaba que `nivel_soporte` era el nivel que trae el
**diagnóstico externo** —dato histórico que llega con el NNA, vecino de `diag` y `cie11` en las
Especificaciones §3— y por lo tanto no duplicaba nada. **La evidencia del HTML del prototipo dice que no**
(se buscó en `docs/prototipo-v4/HCE_IPPU_Prototipo_v4.html` —entonces bajo `docs/fuentes/`, ver §5.30—, no en el `.md` de referencia):

1. **La etiqueta con que HCE-00 lo renderiza es `Nivel de soporte DSM-5-TR (orientativo)`**, con opciones
   `No determinado / Nivel 1 / Nivel 2 / Nivel 3`. No dice «del diagnóstico de ingreso» ni nada parecido, y
   «orientativo» es la **misma palabra** que el módulo IDEA usa para la banda.
2. **El módulo `sev` lo escribe, siempre.** `setSev()` hace
   `const r=sevResumen(p); if(r) p.nivel=r;  // sincroniza la etiqueta visible de la ficha`, dejando en el
   campo un string de otro formato (`"CS: Grado 2 · CRR: Grado 2"`). El changelog del propio prototipo lo
   dice literal: «La etiqueta de nivel de la ficha del usuario **se sincroniza automáticamente** con este
   registro». Un dato histórico del diagnóstico de ingreso que el módulo de severidad pisa en cada edición
   no es un dato histórico.
3. **La ficha nunca muestra dos.** Hay un solo slot (`Soporte orientativo: ${p.nivel}`, y
   `CIE-11 / Soporte` en el informe), cuyo contenido cambia de formato en cuanto alguien toca SEV.

**Dos confirmaciones más, por fuera de los tres tests:**
- `nivel_soporte` aparece **una sola vez en las 406 KB** del prototipo: en el «esquema **sugerido**» de
  Especificaciones §3. La aplicación no lo usa nunca — el campo real es `p.nivel`.
- **Nuestra propia demo lo confirma:** `demo/js/datos.js` guarda `apoyo:"Grado 2 — Requiere apoyo
  sustancial"`. Es el contenido de HCE-SEV colapsado en un campo, no el nivel de un diagnóstico externo.

**Por qué se borra en vez de renombrarse.** Renombrarlo a «nivel de soporte del diagnóstico de ingreso»
habría sido inventarle un significado que ninguna fuente le da — el error que la propia consigna del
módulo señala como peor que dejarlo. Y mantenerlo garantiza el modo de falla concreto: dos lugares
respondiendo «¿qué nivel de apoyo necesita este NNA?», uno con justificación, fecha y autor y otro sin
nada, divergiendo en silencio.

- **Costo, relevado antes de decidir:** **0 tests, 0 seed, 0 routers, 0 schemas, 0 usos en la demo.** Toca
  `app/models/identidad.py` (1 línea), la migración (que se regenera igual) y la fila de `hce_diurna` en
  `backend/docs/esquema-datos-v2.md` §2.1. Mismo perfil que §5.20.
- **Divergencia declarada con la fuente normativa.** Las Especificaciones §3 lo listan; nosotros no lo
  implementamos. Es un **esquema sugerido** que el propio prototipo no sigue, y el «Principio de la ronda»
  del plan M12 habilita apartarse cuando el prototipo y el buen modelado no coinciden. Queda escrito acá y
  en §2.1 del esquema, no sólo en el commit.
- ⚠️ **La demo queda con `p.apoyo`** y **no se toca** (no-goal de la ronda). Cuando la demo incorpore
  HCE-SEV, `apoyo` pasa a **derivarse** de ese registro; anotado como deuda en §6.

### 5.25 (E7) HCE-DOC gana alcance institucional: un documento cuelga de un expediente **o** de un ateneo (2026-08-15, Lucas)
`documento.hce_id` pasa a **nullable**, aparece `documento.ateneo_id` (FK a `ateneo`, CASCADE, con
índice) y un `CHECK(num_nonnulls(hce_id, ateneo_id) = 1)` garantiza que sea exactamente uno.
**El conteo de tablas no cambia por esto: son columnas.**

- **Qué lo obliga.** Un ateneo institucional y una jornada de capacitación **no tienen expediente**, y
  hasta acá `documento.hce_id` era NOT NULL: no había forma de adjuntarles material. **No es invención
  nuestra:** el placeholder de `materiales` del Prototipo v4 dice literalmente *«Referencia a documentos
  en **HCE-DOC institucional**»*. Es un requisito que apareció en el relevamiento.
- **Por qué se relaja la FK de la tabla dueña y no se crea una tabla aparte.** Es **exactamente** lo que
  hizo M12.1 con `auditoria.hce_id`, por la misma razón (eventos de la institución que no son de ningún
  expediente). Una `ateneo_documento` paralela daría **dos formas de adjuntar un archivo** = dos fuentes
  de verdad sobre «documentos de la institución», que es lo que §5.20, §5.22 y §5.24 prohíben tres veces.
- **El XOR no afloja nada:** conserva el invariante «no hay documentos huérfanos» que daba el NOT NULL, y
  es la misma forma que `foto.individual_xor_grupal`.
- **La regla «Registro histórico inmutable (§10)» sigue intacta**, verificado antes de tocar nada: se
  apoya en `es_registro_historico`, no en `hce_id`. Un documento de ateneo nace con el flag en `False`
  (material producido en el sistema nuevo, no migrado) y, si algún día se migrara un acta vieja, la regla
  aplica textual.
- **Costo, relevado antes de decidir:** **0 tests, 0 routers, 0 schemas, 0 seed** referencian `Documento`.
  Mismo perfil que §5.20 y §5.24.
- ⚠️ **`categoria_documento` NO se tocó.** Está en `DESDE_LA_DEMO` del generador y el propio comentario
  dice que tocarla antes de M12.8 «sería trabajo perdido». Un documento institucional usa «Otro»
  mientras tanto; **la categoría propia queda anotada para M12.8**.
- **Deroga** dos cosas de `backend/docs/esquema-datos-v2.md`, las dos corregidas en esta sesión:
  **(a)** la arista `HCE_DIURNA ||--o{ DOCUMENTO : "HCE-DOC"` del **diagrama ER §1**, que pasa a XOR con
  `ATENEO` (actualizada con su comentario `%%`, como M12.3 hizo con la suya);
  **(b)** la fila `documento` de **§2.3**, que decía `hce_id FK` sin marcar nullable —a diferencia de
  `auditoria` y de `foto`, que sí lo marcan— y ahora dice
  `hce_id FK nullable / ateneo_id FK nullable + CHECK(num_nonnulls(hce_id, ateneo_id)=1)`, con el mismo
  formato que la fila de `foto`.

### 5.26 (E8) Nomenclatura: `hce_id` es pertenencia, `hce_<calificador>_id` es referencia (2026-08-15, Lucas)
**Regla de nomenclatura para todo el esquema. M12.6 y lo que venga la heredan.**

> Una columna que se llama **`hce_id`** significa que la fila **es contenido del expediente** y muere con
> él: `ondelete="CASCADE"`. Una **referencia** —una fila que menciona a un expediente pero no le
> pertenece y le sobrevive— lleva un **calificador en el nombre** y `ondelete="RESTRICT"` explícito:
> `ateneo.hce_referida_id`.

- **De dónde sale.** M12.7 necesitaba la primera referencia no-perteneciente hacia `hce_diurna`. Con el
  nombre `hce_id`, las dos semánticas opuestas quedaban indistinguibles al leer el modelo, y el borrado
  de un expediente se comportaría distinto según la tabla sin que nada lo dijera. Es la misma clase de
  ambigüedad que §5.24 documenta como causa de divergencia silenciosa — con la diferencia de que acá se
  resuelve **antes** de que exista el problema.
- **Qué NO cambia.** Ninguna de las 12 tablas existentes se renombra: todas son pertenencia y su
  `hce_id` ya dice la verdad. Esto sólo fija cómo se nombra lo que viene.
- **Aplicación inmediata en M12.6:** **`pai.hce_id` es pertenencia** (el PAI es contenido del expediente
  y se va con él). No hace falta calificador.
- **Se extiende a las otras FK del mismo tipo.** `ateneo.grupo_id` y `ateneo.autor_id` llevan
  `ondelete="RESTRICT"` **explícito** aunque `hce_diurna.grupo_id` y `severidad_dsm.profesional_id` lo
  dejen implícito (mismo comportamiento, NO ACTION): en una tabla donde conviven referencias y cascadas,
  decirlo en voz alta es lo que hace legible la diferencia.
- Escrito también en `backend/docs/esquema-datos-v2.md` §1 (comentario `%%` del ER) y §2.5, y fijado por
  `test_el_ateneo_no_tiene_columna_hce_id`.

### 5.27 (F1) Se abre una ronda de alineación de la demo v4.1 con el Prototipo v4 (2026-08-16, Samuel)
La demo dejó de estar alineada con las decisiones que M12 fue tomando en el backend (bandas de 3 tramos
vs. 6, talleres inventados vs. los 14 reales, grupos por letra vs. por color, cita Rivière 1997 vs.
1997/2002). Aunque **M12 tiene la demo como no-goal** (plan §2), estas divergencias son deuda visual
para cualquiera que abra la demo esperando que refleje el modelo institucional. Se abre una **ronda
paralela sobre la demo** — no reemplaza M12, va aparte.

- **Alcance de esta ronda: sólo alineaciones** de lo que ya existe con el Prototipo v4. **No** se
  agregan módulos nuevos (HCE-SEV, HCE-INC, HCE-PAI, Ateneos) — eso queda para rondas posteriores si
  se decide. Cambios concretos en §13 (bitácora 2026-08-16).
- **§5.2 sigue en pie.** La demo no tiene backend, sólo `demo/*` se toca.
- ⚠️ **Divergencia acotada con §5.18 (D9) — a propósito.** El backend usa **`grupo.id` serial + `nombre`
  por color + `UNIQUE(nombre, anio)`** porque necesita distinguir «Azul 2026» de «Azul 2027» (§5.18). La
  demo usa **el color como identidad** (`GRUPOS[i].id = "Azul"`) porque **no tiene concepto de año** en
  el seed y meter serial + `anio` obligaría a inventar un modelo que la demo no representa. **No
  contradice §5.18:** la propiedad de dominio que D9 fija —«los grupos son por color»— se cumple; lo
  que difiere es la implementación. El día que la demo hable con la API (Fase 3), esto se reconcilia.
- ⚠️ **Grupo E ("Multiedad — taller abierto") retirado de la demo.** El prototipo v4 tiene exactamente
  4 grupos por color; el E era invención de la demo original y **ningún NNA seed lo usaba** (verificado
  antes de retirar). El `USUARIO.grupos` y `EQUIPO` se ajustaron para no referenciarlo. Si en el
  dominio real IPPU tiene un espacio multiedad, se agrega como grupo o como categoría aparte.
- ⚠️ **`ALERTA_DELTA` pasa a ser derivado** del catálogo `deltaInterpreta` (busca el mayor Δ con
  `alerta:true`) en vez de constante suelta `-7`. Mismo criterio sin drift que §5.20/§5.24: una sola
  fuente de verdad. Verificado: sigue devolviendo `-7`.

**Lo que esta ronda NO habilita:** tocar decisiones de §5.2, agregar módulos nuevos a la demo sin abrir
otra ronda, ni reemplazar los 60 descriptores del IDEA por las paráfrasis del prototipo (M12.1
lo decidió — los nuestros son texto literal de Rivière).

## 5.28 → 5.32 · Decisiones de la sesión de limpieza y pivote (2026-08-20, Lucas)

### 5.28 (G1) El backend está bloqueado por validación, no por trabajo; y **M13 no se abre** (2026-08-20, Lucas)
M12 llegó hasta donde puede llegar sola. Hecho: **M12.0–M12.4 y M12.7** — 38 tablas, 240 tests, migración
única `9246e659d2c9`. Lo que falta **no está esperando manos, está esperando respuestas**:

| Sub-módulo | Qué le falta para arrancar |
|---|---|
| **M12.5** (HCE-INC) | **Ratificación de §5.8.** El plan M12 §7 lo dice con todas las letras: «ratificarlo o pararlo **antes de M12.5**». No depende de ningún otro sub-módulo (§5.23) ni del catálogo de centros educativos —el Prototipo v4 lo resuelve como texto libre—, así que su única puerta es esa. |
| **M12.6** (HCE-PAI) | La misma ratificación de §5.8, **y** material de IPPU que no tenemos: el Anexo A del Manual y las secciones que el prototipo no muestra (§4, §7, §8, §12, §13, §15, §17, §18, §20–22, §24, §25). Es el módulo más grande (15 secciones, ~46 campos, 4 tablas hijas) y el que más superficie construye sobre supuestos sin confirmar. Sus dependencias internas **ya están resueltas**: §5.22, §5.26 y M12.4 (§5.23). |
| **M12.8** (cierre) | Depende de los dos anteriores. Una sola persona. |

**El motivo del bloqueo, dicho como es.** `consulta-a-ippu.md` **se envió el 2026-08-19** y todavía no hay
respuesta — pero **hace un solo día**, así que **esto no es «IPPU no contesta»**: es una pregunta **en
vuelo**, sin tiempo material de volver. Decirlo de otra forma sería cargarle a IPPU una demora que no
existe. Lo que bloquea a M12.5 y M12.6 **no es el silencio de IPPU, es que la respuesta todavía no llegó**,
y un cuestionario de 30 preguntas no vuelve en 24 horas.

Consecuencia práctica: la reunión **no es una escalada**, es el canal donde esas preguntas se responden más
rápido de lo que volvería el formulario. Y si a la fecha de la reunión el cuestionario sigue sin respuesta,
**eso tampoco es un dato sobre IPPU** — es lo esperable.

⚠️ **Dos cosas quedan abiertas por el envío del 19/08, y las resuelve el equipo, no una sesión:**
1. **El plan M12 quedó viejo, no equivocado.** Afirma en tres lugares (§6 línea 452, §8 líneas 557 y 577)
   que el cuestionario «nunca se envió»; **era cierto el 2026-08-14**, cuando se escribió, y dejó de serlo
   cinco días después. Se marca como enmendado, no como error.
2. **Hay una tensión real con la decisión de la línea 577** —«las preguntas se llevan a la reunión, **no
   por correo**», tomada el 14/08— porque el 19/08 el cuestionario **salió por correo igual**. O la
   decisión se revirtió sin escribirlo (lo que §12.6 pide no hacer), o el envío se pensó como complemento
   de la reunión y no como reemplazo. **No lo resolvemos acá**: queda anotado para que lo aclare quien
   envió, por escrito y en §5.

**M13 no se abre.** Se evaluó abrir una ronda de restyle de la demo y **se descarta**: el commit `5544e71`
de `demo/F1-navegacion` es literalmente «restyle visual completo + B1/B2» y toca **1.371 líneas de
`demo/css/estilos.css`**. El trabajo que M13 iba a hacer **ya está en curso, dentro de F1, hecho por otra
persona**. Abrir una ronda paralela sobre los mismos archivos es exactamente la duplicación que §5.3
documenta y que la regla anti-contradicción existe para evitar. Queda registrado como **evaluado y
absorbido por F1**, no como pendiente.

**Lo que sí es nuestro y no choca con nada:** la **agenda de la reunión**
(`docs/planes/agenda-reunion-ippu-2026-08.md`). Es agenda, no CSS: no toca un solo archivo de `demo/`.
El **no-goal del plan M12 sobre la capa de presentación del Prototipo v4 no se modifica**.

### 5.29 (G2) **Enmienda a §5.7:** se purgan los originales de `docs/fuentes/` (2026-08-20, Lucas)
§5.7 (2026-08-07) evaluó borrar esta carpeta y **lo descartó** por dos motivos. Se revisan los dos:

1. *«Los originales son el respaldo verificable de lo que entregó IPPU y la única fuente para rehacer una
   conversión lossy (`IPPU.md` salió de OCR)».* **No sobrevive.** El grep del 2026-08-20 muestra que
   `IPPU.md` lo citan exactamente dos lugares y **ninguno lo consume**: `docs/estructura-repositorio.md:58`
   (el mapa listándose a sí mismo) y `handoff.md:210`, que es **§5.7 argumentando que hay que guardar el PDF
   para poder rehacer `IPPU.md`**. El argumento se sostiene a sí mismo y nada más. Y el «respaldo
   verificable» ya lo da la historia de git — **precedente: §5.5**, donde el monolito de 3.949 líneas se
   borró apoyándose justamente en eso.
2. *«`HCE_IPPU_Prototipo_v1.html` no tiene conversión markdown a propósito».* **Sobrevive intacto.** Ese
   archivo **se queda**.

**Keep-list, archivo por archivo** (A2–A4 + extensión, Lucas 2026-08-20). No se decide nada en tiempo de
ejecución: lo que no está en esta lista, no se toca.

- **SE QUEDAN en `docs/fuentes/`, y son los dos únicos:**
  - `HCE_IPPU_Prototipo_v1.html` — no tiene conversión markdown a propósito (motivo 2 de §5.7).
  - `Cuestionario IPPU UTEC, respuestas.docx` — es la **prueba primaria** de lo que IPPU contestó por
    escrito, y es justo la fuente que §5.31 necesita citar para el IDEA anual (P10/P12, Fernando Sierra).
    Un original que sostiene una decisión abierta no es respaldo redundante.
- **SE MUEVE:** `prototipo-v4/` → ver **§5.30**.
- **SE VAN** (10 archivos): `IPPU.pdf` · `IPPU_UTEC_Presentacion_13.05.2026.pptx` ·
  `escala-del-inventario-del-espectro-autista-idea.pdf` ·
  `Fundaciones Internacionales que financian proyectos TEA-Neurodivergencia.pdf` ·
  `Proyectos, Investigaciones y Oportunidades de Desarrollo.pdf` ·
  `Documento de trabajo.docx` · `Guia_Relevamiento.docx` · los 3 `.xlsx` de `reuniones/`.
- **SE VA también `docs/markdown/IPPU.md`** (A2): OCR degradado —`Diagn6stico`, `autorizaci6n`,
  `yel analisisdedatosofrecen`, tablas partidas (`Cornunicacion`, `Evaiuacionesy`), índice desordenado
  1-3-2-4-6-6— que **ningún documento normativo consume**. Borrar el PDF y conservar el `.md` era la
  opción menos coherente de las tres: se pierde la capacidad de rehacerlo y se conserva algo que nadie lee.
- **Todas las demás conversiones `.md` se quedan**, incluida la del cuestionario respondido.

**Lo que se acepta perder, explícito:**
- **29 imágenes** que las conversiones nunca extrajeron (dejaron `<!-- image -->`): **25** del PPTX,
  **3** del PDF de Fundaciones, **1** del de Proyectos. Medido, no estimado.
- El **PDF de la escala IDEA y `IPPU.pdf` no pierden ninguna imagen** (0 placeholders): en esos dos el
  original no aportaba nada que el `.md` no tenga, más allá del OCR.
- Las **planillas de asistencia** de las 3 reuniones de mayo, más allá de sus `.md`.

**Se aprovecha la misma limpieza para otros dos borrados que no son de `docs/fuentes/`:**
- **La documentación del backend v1, completa:** `backend/docs/esquema-datos.md` **y**
  `backend/docs/ejemplos-endpoints.md`. Los dos describen un backend y una API que **se retiraron enteros
  en M11.2**, los dos ya tenían banner de «documento histórico», y borrar uno solo dejaba media
  documentación de una API inexistente. ⚠️ Al borrarlos hay que arreglar **`handoff.md` §0.6**, que hoy
  manda a Samuel y Victor a citar el esquema **v1** como «la versión citable para todos» — eso es falso
  desde M11.2 y se arreglaba igual aunque el archivo se conservara. El esquema vigente es
  `esquema-datos-v2.md`.
- **`graphify-out/` se desversiona** (`git rm -r --cached` + `.gitignore`): 1,6 MB de artefacto
  **generado**, y desactualizado desde el 2026-08-07 — no conoce M12.1–M12.7 ni F1, así que hoy describe
  un repo que no existe. Se regenera a demanda al cerrar ronda, y así queda escrito en
  `docs/estructura-repositorio.md`.

**Requisito previo, no negociable:** tag anotado **`pre-limpieza-2026-08-20`** antes de borrar nada, y su
mensaje **tiene que decir que marca `main` sin F1 mergeada**. Si no lo dice, el próximo que busque un punto
de recuperación va a creer que ahí está todo el trabajo del equipo, y lo que hay es `main` sin la ronda de
la demo.

### 5.30 (G3) `docs/fuentes/prototipo-v4/` estaba mal clasificado: es insumo de build (2026-08-20, Lucas)
`CLAUDE.md` y `docs/estructura-repositorio.md` declaran que `docs/fuentes/` es «respaldo, **NO se leen**».
Es falso desde M12.1: `herramientas/generar_catalogos_backend.py` **lee esa carpeta en tiempo de ejecución**
—`prototipo-v4-catalogos.json` (línea 39) y `HCE_IPPU_Prototipo_v4.html` (línea 40)— y
`herramientas/extraer_prototipo_v4.js:12` **escribe** ahí. Contradicción regla↔código, y **tercera
divergencia docs↔repo de esta ronda**.

Se evaluaron dos salidas:
- **(A) Mover** a una ruta que signifique «insumo de build». Costo: un barrido de referencias que **ya está
  enumerado** por esta sesión, así que hacerlo ahora sale casi gratis; hacerlo después obliga a rehacer el
  barrido.
- **(B) Enmendar la regla** con una excepción explícita. Más barato hoy, pero deja una carpeta con dos
  semánticas y un lector que tiene que acordarse de cuál aplica a cada archivo.

**Decidido: (A).** `docs/fuentes/prototipo-v4/` → **`docs/prototipo-v4/`**. Es fuente normativa n.º 1
(§5.10) **y** insumo de build: pertenece a `docs/`, pero fuera de la carpeta cuya regla es «no se leen».
⚠️ **Consecuencia que hay que atender en el mismo movimiento:** `.graphifyignore` excluye `docs/fuentes/`,
así que al salir de ahí los 400 KB de HTML + 64 KB de JSON **entrarían al grafo**. La ruta nueva se agrega
explícitamente a `.graphifyignore`: el criterio de §5.7 —no indexar originales caros— no cambia, cambia
dónde vive el archivo.

Con (A) o con (B), lo que **no** podía quedar es el texto de la regla diciendo algo falso.

### 5.31 (G4) §5.8 / IDEA anual: el argumento de costo se dio vuelta. Se mide y **no se toca el modelo** (2026-08-20, Lucas)
§5.8 (2026-08-07) sostuvo el arranque de M11 sin la validación de IPPU con este razonamiento: si IPPU
pidiera volver al IDEA anual, «el arreglo es agregar `anio` y cambiar un `UNIQUE` — barato **ahora**, caro
después de que M11.3 y M11.4 construyan encima».

**Ya no es hipotético.** Fernando Sierra respondió **«Anual»** por escrito (cuestionario 15/06/2026, P10 y
P12; cruzado por Victor el 2026-08-17). El Documento Técnico dice lo contrario —línea base única— y es la
base sobre la que se construyó M4 y todo el esquema v2.

**El costo, medido contra el código y no contra los documentos:**

- ⚠️ **`idea` ya es 1:N.** **No hay `UNIQUE` sobre `idea.hce_id` que cambiar**: el índice es
  `ix_idea_hce_id ... unique=False` (migración `9246e659d2c9`, línea 392), y hay un test que lo afirma —
  `test_idea_admite_varias_lineas_base_por_expediente` (`tests/test_esquema_v2.py:54`), puesto ahí a
  propósito porque «un reingreso a más de 12 meses abre una línea base nueva». **§5.8 se equivocó en este
  punto**, y se equivocó **sobreestimando**: el cambio es puramente **aditivo**.
- **Tablas afectadas: 1 de 38.** Se agrega `anio` + `UniqueConstraint("hce_id", "anio")` — el mismo patrón
  que el esquema ya usa **tres veces**: `uq_informe_cierre_hce_anio`, `uq_protocolo_hce_tipo_anio` y
  `uq_grupo_nombre_anio` (D9, §5.18).
- **FKs a reconectar: ninguna.** La única que apunta a `idea.id` es `puntuacion_idea.idea_id`
  (`app/models/modulos.py:301`, CASCADE) y es **por instancia**: sigue siendo correcta si hay N instancias.
- **Tests: 9 sitios** construyen `Idea(` en 3 archivos (`test_esquema_v2.py` ×4, `test_m12_consenso.py` ×4,
  `test_m12_severidad.py` ×1). Con `anio` nullable no rompe **ninguno**; con `NOT NULL` hay que agregar un
  kwarg en esos 9. Tests que hablan de la **forma** de `idea`: 3.
- **Migración:** se regenera el archivo único, como en cada sub-módulo (§5.19).
- **Docs a tocar:** docstring de `Idea` (`modulos.py:211`), `esquema-datos-v2.md` §2.2, y el vocabulario
  «línea base única» de la cabecera de este archivo, de `CLAUDE.md` y de los dos planes.
- ⚠️ **La demo sí paga, y es la parte cara.** `nna.flujo.lb` es un **objeto único, no una colección**:
  `Object.assign(f.lb, {...})` (`demo/js/flujo.js:39`), `f.lb.kind` (`:41`), y ~18 sitios en 6 módulos
  (`catalogos.js`, `evaluaciones.js`, `expediente.js`, `flujo.js`, `hce-doc-org-vf.js`,
  `informe-cierre.js`) leen `p.flujo.lb.*` como instancia única. Pasar a anual obliga a un **selector de
  año** — que es, con precisión incómoda, **el trabajo que la v3.3 ya tenía hecho y que M4 retiró**.

**Conclusión: el argumento de §5.8 apunta al revés que hace dos semanas.** En el backend el cambio salió
**más barato** de lo estimado (aditivo · 1 tabla · 0 FKs · 0 tests rotos si es nullable), y **M11.3 no
arrancó**: sigue siendo el momento barato. Lo caro se mudó a la demo, que hoy está **bajo F1** y no se toca.

**No se cambia el modelo.** Se deja el número escrito para que la decisión se tome **mirándolo**, y no por
inercia ni por la urgencia de la reunión. **Punto abierto, con número puesto:** decidir con IPPU si `idea`
pasa a anual; si la respuesta es sí, el costo backend es el de arriba y el costo demo es un selector de año
en 6 módulos.
⚠️ **Deuda declarada:** la actualización de `docs/notas/puntos-a-validar.md` §2.1 queda **debiendo** — el
archivo está congelado por F1 (§12.3). Se hace al aterrizar F1.

### 5.32 (G5) «Samuel» y «Boris Furtado» son la misma persona (2026-08-20, Lucas)
§8 ya los nombra juntos, pero la **historia de git no tiene ningún «Samuel»**: los commits de
`demo/F1-navegacion` están firmados **`Boris Furtado <boris.furtado.b@estudiantes.utec.edu.uy>`**.
Confirmado por Lucas. Se anota para que ninguna sesión futura vuelva a deducirlo, y sobre todo **para que
§5.27 y los pendientes de §6 no se lean como si acreditaran la ronda F1 a un tercero**: el «Samuel» de la
documentación y el «Boris Furtado» de los commits son el mismo autor.

---

## 5.33 → 5.35 · Decisiones de la sesión de pre-reunión (Fase B, 2026-08-20, Lucas)

### 5.33 (H1) **Enmienda a §5.27:** F1 se pasó del alcance que esa decisión fijó, y aun así se mergea (2026-08-20, Lucas)
§5.27 (2026-08-16, Samuel) abrió la ronda F1 y escribió su alcance con todas las letras: «**Alcance de esta
ronda: sólo alineaciones** de lo que ya existe con el Prototipo v4. **No** se agregan módulos nuevos
(HCE-SEV, HCE-INC, HCE-PAI, **Ateneos**) — eso queda para rondas posteriores si se decide».

**Lo que F1 agregó igual**, medido sobre `5544e71` contra la base `684c4f5`:

| Archivo nuevo | Líneas | Qué es |
|---|---|---|
| `demo/js/ateneos.js` | 488 | La sección **Ateneos y capacitación** — uno de los módulos que §5.27 nombra. |
| `demo/js/inclusion.js` | 175 | Tablero institucional de **Inclusión** — el otro. |

**663 líneas de módulo nuevo.** Esto **no estaba permitido** por §5.27 y no se lo va a leer como si lo
hubiera estado: la decisión decía lo contrario, por escrito, cuatro días antes.

**Por qué se acepta en vez de revertirse, dicho como es.** Esas mismas 663 líneas son **lo único que puede
poner M12.5 (HCE-INC) y M12.7 (Ateneos) delante de IPPU mañana**, y los dos sub-módulos están **bloqueados
por validación** (§5.28) — es decir, están esperando exactamente la conversación de la reunión. El exceso de
alcance y el valor para la reunión **son el mismo hecho**: si F1 se hubiera quedado dentro de §5.27, mañana
no habría nada que mostrar de esos dos módulos. Se acepta el trabajo y se registra el exceso; no se
regulariza el procedimiento. Lo que §12.6 pide es que la decisión se cambie **por escrito y antes**, y esta
entrada existe para que el merge no la cambie **de hecho, en el código**.

⚠️ **Qué es `inclusion.js` en realidad — para que nadie lea la demo como si cubriera M12.5.** Es un
**tablero institucional**: KPIs y listado **por estado** sobre los 7 `INC_ESTADOS`, con datos simulados por
expediente. **No** es la ficha/bitácora **por NNA** de HCE-INC (`mInc()` del prototipo) — el propio archivo
lo declara en su cabecera (`inclusion.js:10`) — y **no deriva `sensible`** (`tema === 'Clínica — sensible'`),
que es una de las reglas que M12.5 tiene que implementar. Siembra un array `bitacora` sólo para poder
calcular «días desde la última gestión» en el tablero. **Mostrar Inclusión mañana no es mostrar HCE-INC.**

**Lo que esta enmienda NO habilita.** Las demás prohibiciones de §5.27 siguen en pie, sin cambios:
- **§5.2 intacta** — la demo no tiene backend, sólo se toca `demo/*`.
- **Los 60 descriptores del IDEA no se reemplazan** por las paráfrasis del Prototipo v4 (M12.1: los
  nuestros son texto literal de Rivière).
- **No se abren módulos nuevos adicionales** en la demo sin abrir otra ronda. HCE-PAI y HCE-SEV **siguen
  fuera**: ninguna de las dos ramas los tiene (verificado en la Fase A de esta sesión).

### 5.34 (H2) El repo describía un cuestionario que IPPU no tiene — **quinta divergencia, y la primera con la otra mitad afuera** (2026-08-20, Lucas)
Desde el **2026-08-19** hasta esta noche, `docs/notas/consulta-a-ippu.md` **no era el documento que se le
envió a IPPU**. El equipo lo revisó antes de mandarlo, **sacó tres preguntas** y renumeró todo lo que
venía después. El repo siguió describiendo el borrador.

**Es la quinta vez en esta ronda que la documentación se desfasa de la realidad**, y por eso se escribió
`verificar_estado.py` (§13, Fase 2: «el desfasaje docs↔repo que ya pasó cuatro veces»). Pero **ésta es de
otra clase**: las cuatro anteriores tenían las dos mitades adentro del repo —un `.md` contra el código—,
y ésta tiene **la otra mitad en manos de un tercero**. Ningún script del repo la podía ver.

**Las tres preguntas que se sacaron. No están «enviadas y esperando respuesta»: están sin preguntar.**

| Se sacó | Era | Dónde sigue abierta |
|---|---|---|
| §2.7 | Los porcentajes de la valoración funcional (baremo) | `puntos-a-validar.md` §1.2 · §7 de este archivo · agenda §1 |
| §2.8 | El porcentaje lo define el organismo oficial, no la institución | ídem |
| §3.2 ⚠️ | Las citas bibliográficas de la Escala IPPU-TEA | `puntos-a-validar.md` §1.4 · agenda §1 |

Verificado por búsqueda sobre el documento enviado: **0** ocurrencias de «baremo», «BUND» y «72/025»;
**0** de cualquier pregunta por citas bibliográficas. **No se relocalizaron: no están.**

⚠️ **La §3.2 estaba marcada ⚠️** como una de las cuatro que más destraban. Que se haya caído en la
revisión significa que la verificación de las 24 citas de la Escala IPPU-TEA **no tiene hoy ningún canal
escrito**. La reunión es el único que queda.

⚠️ **El documento enviado se contradice a sí mismo, y IPPU lo tiene en la mano.** Su intro sigue diciendo
que las que más frenan son «**3.2** (las citas de la escala) y **3.3** (el acceso al sistema actual)» —
numeración **anterior** a la revisión. En el documento que recibieron, **§3.2 es «Acceso al sistema
actual»** y **§3.3 es «Qué hacer con los expedientes que ya existen»**. Son **dos punteros rotos**, no uno,
y la pregunta por las citas no está en ninguna parte. Si alguien de IPPU la fue a buscar, no la encontró.
**No se corrige el archivo** —es el registro de lo que se mandó—; se aclara de palabra en la reunión.

**Otras diferencias, menores y verificadas:** §2.6 ganó «(Sin estar en el HCE)» · §2.1 conserva su ⚠️ pero
perdió el «*el más importante*» · §3.1 trae la corrección de F1 (`554ff37`), **sin sobrepromesa**: dice
«**Lo que todavía no construimos es la pantalla para hacer esos cambios**». **Nada que desdecir mañana.**
· El documento **termina cortado**: después de §3.14 hay un encabezado vacío donde el borrador tenía «Para
cerrar». No se reconstruye.

**Mapa de renumeración — la referencia canónica del repo.** Toda cita usa la columna «Enviado».

| Borrador | Enviado | Borrador | Enviado |
|---|---|---|---|
| 2.7 baremo | **se sacó** | 3.6 quién ve qué | **3.5** |
| 2.8 organismo oficial | **se sacó** | 3.7 falta un técnico | **3.6** |
| 2.9 períodos | **2.7** | 3.8 cambia de grupo | **3.7** |
| 2.10 fotos | **2.8** | 3.9 puntuación independiente ⚠️ | **3.8** |
| 3.1 talleres | **3.1** (texto cambiado) | 3.10 informe a la familia | **3.9** |
| 3.2 citas de la escala ⚠️ | **se sacó** | 3.11 severidad DSM | **3.10** |
| 3.3 acceso al sistema ⚠️ | **3.2** | 3.12 nombre del PAI | **3.11** |
| 3.4 expedientes existentes | **3.3** | 3.13 ateneos de grupo ⚠️ | **3.12** |
| 3.5 número de historia | **3.4** | 3.14 número de ateneo | **3.13** |
| | | 3.15 algo que no preguntamos | **3.14** |

§1.1–§1.6 y §2.1–§2.6 no cambiaron.

**Qué se hizo esta noche.** `consulta-a-ippu.md` pasa a ser el **snapshot del documento enviado**, palabra
por palabra (verificado: **2.695 palabras idénticas**; sólo se normalizó el marcado que arrastraba la
conversión del `.docx`). Se le puso cabecera de estado. **La versión superada se borró**, apoyándose en la
historia de git y en el tag `pre-limpieza-2026-08-20` — precedente §5.5, reusado en §5.29 —, y las tres
preguntas retiradas se conservan **con su redacción original** en `puntos-a-validar.md` §1.2 y §1.4. Por
eso el archivo viejo no necesita sobrevivir como hermano: lo que había que rescatar de él, se rescató.

⚠️ **El artefacto autoritativo es un Google Doc del equipo, no este repo.** El `.md` es un snapshot
fechado. Si el Doc cambia y nadie re-baja el snapshot, **esta misma divergencia vuelve**. Falta pegar el
link en la cabecera del archivo.

### ⚠️ `verificar_estado.py` no puede atrapar esta clase de deriva — límite conocido
El script compara **tablas, migración, un solo head y conteo de tests**. **No compara prosa.** Su propio
docstring lo dice de otra forma: el corte presente/historia es *estructural*, y adivinar por redacción
producía 13 falsos positivos. Consecuencia concreta y medible: §6 de este archivo afirmaba «Parte 3 **11**
dudas puntuales» cuando el documento enviado tiene **14**, y nombraba entre las cuatro ⚠️ una pregunta que
**no existe** — y `--check` daba **OK** mientras tanto. Lo mismo pasó esta noche con «12 módulos» de la
demo, que el merge de F1 convirtió en 14: lo encontró un `grep`, no el verificador.

**Arreglo candidato, para después de la reunión:** contar las secciones `^### N.N` de los archivos de
`docs/notas/` y compararlas contra los números que `handoff.md` §6 afirma sobre ellos. Es barato y cubre
la familia entera de «un `.md` dice cuántas cosas tiene otro `.md`».

⚠️ **No se implementa esta noche.** La víspera de una reunión no es el momento de extender la herramienta
de verificación: si la extensión sale ruidosa, el costo lo paga el día que nadie la corra (§13, Fase 2).
Queda en §6 con dueño a definir.

### 5.35 (H3) La puerta de §5.8 no está antes de M12.5: está antes de **M11.3** (2026-08-20, Lucas)
**Esto NO ratifica §5.8.** §5.8 sigue **«a ratificar por el equipo»**, exactamente igual que ayer. Lo que
cambia es **dónde está la puerta**: no «antes de M12.5», sino **antes de M11.3**.

**La medición, contra el código y no contra los documentos.** M12.5 (HCE-INC) no toca `idea` en ninguna
línea de su especificación: ficha (`centro`, `tipoCentro`, `grado`, `modalidad`, referente, estado) +
bitácora con 5 catálogos + `sensible` derivado. Y del lado del esquema, **pasar el IDEA a anual ya es
aditivo**:

- **No hay `UNIQUE` sobre `idea.hce_id` que cambiar.** El índice es `ix_idea_hce_id … unique=False`
  (migración `9246e659d2c9`, línea 392). `idea` **ya es 1:N** (§5.31 lo midió primero).
- La regla que resuelve cuál rige está escrita en prosa, no en el esquema: **«la vigente es la de mayor
  `fecha_consenso`»** (`app/models/modulos.py:219`), y su test es
  `test_idea_admite_varias_lineas_base_por_expediente` (`tests/test_esquema_v2.py:54`).

**Por eso la puerta se corre.** Mientras el cambio sea aditivo sobre el esquema, construir M12.5 encima
**no lo encarece**. Deja de ser aditivo **en M11.3**, que es donde se implementa la resolución por
`fecha_consenso` — ahí el «cuál IDEA rige» pasa de docstring a código con guards y tests, y cambiar el
modelo después obliga a reescribirlos. **La puerta está antes de M11.3, no antes de M12.5.**

⚠️ **Esto enmienda §5.28, escrita hoy mismo.** Su tabla dice que la «única puerta» de M12.5 es la
ratificación de §5.8. **Medido, es falso:** M12.5 está frenada **por asociación** —se decidió no abrir
sub-módulos con la validación en vuelo—, no por una dependencia técnica sobre `idea`. §5 es **append-only**
(§12.6): esto es una entrada nueva que corrige esa fila, **no una edición** de §5.28.

⚠️ **M12.6 NO queda destrabada por esto, y «desacoplado de §5.8» no se lee «destrabado».** Su esquema
también está libre de `idea`, pero §5.28 le puso **dos** bloqueos independientes y **el segundo sigue en
pie**: falta material de IPPU — el **Anexo A del Manual** y las 13 secciones que el prototipo no muestra
(§4, §7, §8, §12, §13, §15, §17, §18, §20–22, §24, §25). Es el módulo más grande y el que más superficie
construye sobre supuestos sin confirmar. **Sigue bloqueada.**

**Dos derivados de la medición, con destinatario, para que no se pierdan:**

1. **Una pregunta distinta, que no es §5.8 y no se mezcla con ella.** Si el IDEA pasa a anual, hay que
   decidir aparte si `inclusion.estado` / `fecha_estado` (M12.5) también se anualizan — el estado de
   inclusión educativa es del año lectivo, igual que el grupo (D9). **Son dos preguntas, no una:** el IDEA
   es un instrumento con línea base; el estado de inclusión es una situación vigente. Mezclarlas hace que
   una respuesta de IPPU se lea como si contestara las dos. **Destinatario: el equipo, al abrir M12.5.**
2. **Requisito para M11.3, y va al esquema, no a una tabla.** Con `idea` 1:N y la resolución por
   `fecha_consenso`, un **PAI de 2024 no puede renderizar en silencio el IDEA de hoy**: tiene que resolver
   contra la línea base vigente **a su fecha**, o decir explícitamente cuál usó. El propio test lo deja
   servido — siembra un IDEA de 2024 y otro de 2026 sobre el mismo expediente. **Destinatario:
   `backend/docs/esquema-datos-v2.md` §4** (dónde vive cada regla), cuando M11.3 se tome.

---

## 5.36 → 5.49 · Decisiones de la ronda posterior a la reunión con IPPU (serie **I**, 2026-08-26, Lucas)

**Fuente única de toda la serie: la reunión con IPPU del 2026-08-21.** Se registra **cinco días después**:
el archivo `docs/notas/respuestas-reunion-ippu-2026-08-21.md` existía y estaba **vacío** —R0 verificó por
script que sus 26 bloques `**Respuesta:**` no tenían texto (`docs/notas/relevamiento-estado-2026-08-26.md`,
D-2)—, así que hasta hoy **el repo no tenía ningún registro de lo que IPPU contestó**.

- **§5 es append-only (§12.6).** Donde la reunión corrige una decisión anterior, va **entrada nueva que la
  supersede**; la vieja no se edita. Cada entrada dice qué decía el repo y que estaba mal.
- **Esta ronda no implementa nada.** No se tocó `app/`, `tests/`, `alembic/` ni la base. Lo que sigue son
  decisiones escritas; el trabajo que abren está en §6.
- **Serie H (§5.33–§5.35) fue la de pre-reunión.** Ésta es la de después.

### 5.36 (I1) El IDEA es **ANUAL**. Cae la «línea base única» del Documento Técnico (2026-08-26, Lucas)
**IPPU:** el IDEA se hace **una vez al año, siempre**, y el de cada año **se compara con el del año
anterior**.

**Qué cierra.** `puntos-a-validar.md` §1.1 y `consulta-a-ippu.md` §2.1 — **la pregunta más importante de
la ronda**. Coincide con lo que Fernando Sierra ya había contestado **por escrito el 15/06** (cuestionario
P10 y P12: «Anual» y «las evaluaciones aparecen por año»).

**Qué decía el repo y estaba mal.** El **Documento Técnico v1.0** introdujo la **línea base única** —se
aplica al ingreso y sólo se repite en un reingreso a más de 12 meses— y sobre eso se construyó **M4** y
todo el esquema v2. **No sobrevive.** El vocabulario «línea base única» queda desactualizado en la
cabecera de este archivo, en `CLAUDE.md`, en los dos planes y en `esquema-datos-v2.md`; R0 los enumeró uno
por uno (BLOQUE 1).

**Qué pasa con §5.8.** Su puerta tenía **una sola pregunta detrás** y **IPPU la contestó**. Y **§5.35 ya
movió la puerta**: está **antes de M11.3**, no antes de M12.5. Lo que queda, entonces, **no es decidir
dónde está la puerta: es aplicar el cambio**.

**El costo, ya medido dos veces —por §5.31 y de nuevo por R0— y es puramente aditivo:**

| Qué | Medido |
|---|---|
| `UNIQUE` sobre `idea.hce_id` que haya que cambiar | **ninguno** — `ix_idea_hce_id … unique=False` (migración `9246e659d2c9:392`). `idea` **ya es 1:N** |
| FKs entrantes a reconectar | **una**, `puntuacion_idea.idea_id` (`app/models/modulos.py:301`, CASCADE) — es **por instancia**, sigue siendo correcta |
| Construcciones `Idea(` en tests | **9** en 3 archivos (`test_esquema_v2.py` ×4, `test_m12_consenso.py` ×4, `test_m12_severidad.py` ×1). Con `anio` nullable no rompe ninguna |
| Columna `anio` en `idea` | **no existe todavía** |
| Qué se agrega | `anio` + `UniqueConstraint("hce_id","anio")` — **el patrón que el esquema ya usa tres veces** (`uq_informe_cierre_hce_anio`, `uq_protocolo_hce_tipo_anio`, `uq_grupo_nombre_anio`) |

⚠️ **Lo que sí hay que revisar, y no es una columna.** §5.35 dejó registrado que la regla de cuál IDEA
rige vive **en prosa**: «la vigente es la de mayor `fecha_consenso`» (`app/models/modulos.py:219`). Esa
regla se escribió para un modelo de línea base con reingresos. **Con una por año, «la más reciente» y «la
de este año» dejan de ser la misma pregunta** — y el bloque 3.b del registro de la reunión (qué IDEA
muestra un documento viejo) **quedó sin contestar**.

⚠️ **Regla de comparación, y hay que reformular un guard de M11.3 por ella.** IPPU dijo que se compara
**siempre dentro del mismo instrumento**: el IDEA de este año contra el del anterior, el Protocolo B
contra el A, **nunca entre instrumentos**. La regla de M11.3 hoy escrita **«Δ sólo B−A»** tiene que
reformularse como **«Δ sólo dentro del mismo instrumento»**: tal cual está, **bloquea una comparación que
IPPU pidió explícitamente**.

**NO SE IMPLEMENTA EN ESTA SESIÓN.** Y queda a la vista lo que §5.31 ya midió: **la parte cara es la
demo** — `nna.flujo.lb` es un objeto único, ~18 usos en 6 módulos, y pasar a anual obliga a un selector de
año.

### 5.37 (I2) Los grupos por color **no eran el dominio de IPPU**: eran datos de demostración leídos como fuente (2026-08-26, Lucas)
**Los nombres reales de los grupos son cinco:**
**Inicial · Escolares · Preadolescentes · Adolescentes · Taller de Adolescentes.**

**«Grupo Azul / Celeste / Naranja / Verde» no existen en IPPU.** Se registran como lo que la reunión dijo
que son: **una invención de una IA que entró al repo como si fuera fuente**. Esto se escribe con todas las
letras porque **la falla de proceso importa más que las cuatro cadenas equivocadas**: el mismo mecanismo
puede repetirse con cualquier otra cosa que hayamos tomado del mismo material.

**Cómo entró, medido contra el repo — y acá el diagnóstico se afina, no se ablanda:**

- Los cuatro colores **están adentro del Prototipo v4**: `docs/prototipo-v4/HCE_IPPU_Prototipo_v4.html`
  (Azul ×1, Celeste ×6, Naranja ×2, Verde ×2) y `docs/prototipo-v4/prototipo-v4-catalogos.json` bajo
  **`GRUPOS_EQUIPO`**, con profesionales rotulados **«(demo)»**.
- **No están en ningún catálogo del prototipo.** No hay un `CAT_GRUPOS` como hay `CAT_TALLERES`: los
  colores viven en el **seed de su base de demostración**, no en su capa de catálogos.
- Entraron al repo con **D9 (§5.18, 2026-08-14)**, implementada en **M12.1** (commit `2a75c25`), que
  escribió *«los grupos de IPPU son **por color** — Azul, Celeste, Naranja, Verde»* como **afirmación
  sobre la realidad institucional**. El seed es `herramientas/generar_catalogos_backend.py:99-100` →
  `app/data/catalogos_iniciales.json`; hoy hay **4 filas en `grupo`**, todas `anio = 2026` y **sin
  técnicos asignados** (R0, BLOQUE 4).
- **El mecanismo que falló, dicho para que se pueda evitar: se leyó el dato de demostración de una fuente
  como si fuera su contenido normativo.** El criterio que separa un caso del otro es **dónde vive el dato
  en la fuente**: un catálogo (`CAT_TALLERES`, `INC_ESTADOS`, `AT_TIPOS`) es contenido; el seed de su demo
  (`GRUPOS_EQUIPO`, `DB.*`) es relleno. **Los 14 talleres, los 7 estados de inclusión y los 4 tipos de
  ateneo salieron de catálogos**; los colores, no.
- ⚠️ **Y hay una consecuencia mayor que el repo no puede resolver solo:** si los colores fueron
  inventados por una IA y **ya venían adentro del Prototipo v4**, entonces la invención es **anterior a
  nuestro repo** y está en la **fuente normativa de precedencia 1** (§5.10). **Eso hay que preguntarlo:
  cuánto del Prototipo v4 es material de IPPU y cuánto es relleno generado.**

**Qué NO cambia.** **La estructura de D9 es correcta y no se toca**: id propio + `UNIQUE(nombre, anio)`.
El problema son las **filas**, no la tabla. Y la granularidad anual sigue siendo la adecuada.

**Qué abre, y es lo caro.** **ADMIN crea los grupos nuevos cuando hace falta.** Eso convierte
`puntos-a-validar.md` **§2.8** de hueco anotado en **hueco bloqueante**: R0 confirmó que **no existe
endpoint, servicio, script ni pantalla que cree un grupo** — `app/routers/__init__.py` pesa 0 bytes,
`app/services/` no existe, y **el único camino que crea un grupo hoy es el seed**, que además es
*insert-only* sobre `grupo` y tiene un test que lo fija (`test_el_seed_no_pisa_un_grupo_ya_configurado`).

**Costo de corregir los nombres (no se hace acá).** Es un `UPDATE` + regenerar catálogos, **pero son cinco
nombres y no cuatro**, y `taller.grupos_orientados` (M12.3) es **un array de nombres de grupo**: al
cambiar el dominio de nombres, cambia lo que ese array puede contener. La demo también los muestra.

⚠️ **Nota para quien corrija §9 «Datos clave» de este archivo:** §6 tenía anotado como inconsistencia que
§9 dijera «**5 grupos**» contra los 4 de D9. **Con los nombres reales vuelven a ser 5** — pero eso es
coincidencia de número, no una confirmación de §9, que sigue siendo pre-M12. No se toca acá: §9 está fuera
del alcance de archivos de esta sesión.

### 5.38 (I3) El consentimiento **no traba** el flujo — ⚠️ **CONFIRMABLE, no cerrado** (2026-08-26, Lucas)
**IPPU pidió que el consentimiento no detenga el proceso de evaluación del NNA.** Resolución: el
expediente **avanza** con un estado **«CI pendiente» visible** y una **notificación**, en vez de un
bloqueo duro. **El registro del consentimiento en sí no cambia y sigue siendo mínimo:** nombre del
referente familiar, fecha, botón de firmar.

**Qué contradice, dicho abiertamente.** `consulta-a-ippu.md` **§1.3 — que ya se le envió a IPPU el
19/08** — afirma que el consentimiento es *«el único paso que no se puede saltear bajo ninguna
circunstancia»*. **Esa afirmación ahora es falsa, y IPPU tiene el documento en la mano.** También queda
desmentido el docstring de `Consentimiento` (`app/models/modulos.py:194`): *«El único bloqueo sin
excepción posible de todo el flujo (§4.2)»* — que además era **prosa sin código que la ejecutara**.

**Por qué es barato, medido por R0 (BLOQUE 2):** la regla vive **en un solo lugar de todo el repo**,
`demo/js/flujo.js:54-64` (`moduloHabilitado`). **No hay CHECK, no hay servicio, no hay test**:
`grep -rci "consentimiento" tests/*.py` da **0 en los 7 archivos**. Hacerla no bloqueante cuesta
**1 archivo y 0 tests**; los 5 módulos que consumen el resultado renderizan lo que se les devuelva y no se
tocan.

**Y la contracara, que es la parte incómoda:** **lo que IPPU vio en la demo no está respaldado por el
backend en absoluto.** La notificación y el estado «CI pendiente» los tiene que **implementar M11.3**.

⚠️ **CALIDAD DE LA FUENTE — es el único punto de segunda mano de toda la serie.** Lo reportan compañeros
del equipo; **no se escuchó en la reunión**. El apunte crudo del 21/08 sí dice *«que no tranque los
procedimientos de evaluación»*, así que **dos fuentes coinciden** — pero se registra **CONFIRMABLE, no
cerrado**, y va **primero en la lista del próximo contacto con IPPU**.

### 5.39 (I4) **Guardar** no requiere autorización; **COMPARTIR** sí. El código está al revés (2026-08-26, Lucas)
**Fotos:** guardar una foto en la HCE **no requiere consentimiento**. **Compartirla, sí.**

**Lo que hace el código hoy es lo contrario, y R0 lo midió (BLOQUE 3):** la autorización de imagen
**bloquea el GUARDADO** — `demo/js/hce-doc-org-vf.js:117-124` (individual, el guard está *antes* del
`push`) y `demo/js/recordatorios.js:39-55` (grupal, exige la autorización de **todas** las familias
activas del grupo). En el backend hay tablas y un docstring, no una regla: `autorizacion_imagen` sin
CHECK, `foto` con un solo CHECK que es **XOR de forma, no de permiso**, y 4 tests que prueban el XOR y
**ninguno** el permiso.

**El hallazgo es más grande que las fotos, y por eso se registra acá y no como un ajuste de §8.4:**

> **El modelo representa el ALMACENAMIENTO y no representa la DIVULGACIÓN.**

R0 lo verificó de forma negativa: `grep -rni "compartir|exportar|export|pdf|difusion|difundir|publicar"`
sobre `app/` devuelve **exactamente una línea, y es un comentario** (`app/models/modulos.py:429`). No hay
columnas ni tablas de compartición, destinatario, exportación, publicación o entrega.

**Cuatro cosas distintas que dijo IPPU caen sobre el mismo concepto ausente:**
1. las **fotos** (esta entrada);
2. la **regla de confidencialidad** (I10, §5.45);
3. la **revisión de los informes por dirección** antes de entregarlos (I5, §5.40);
4. **mandarle a las instituciones un resumen y no el expediente**.

**Hay que resolverlo antes de que M11.3/M11.4 construyan encima**, y **éste es el momento barato por la
misma razón que el IDEA**: R0 midió **0 routers, 0 schemas, 0 servicios** y un solo endpoint (`/health`).
No se implementa acá; se decide antes de M11.3.

### 5.40 (I5) Informes: a pedido, **configurables**, y todos pasan por **revisión de ADMIN** (2026-08-26, Lucas)
**Cómo funciona en IPPU.** Los informes **se generan a pedido, sin fecha fija**, para **familias e
instituciones**. **BPS:** siempre a **fin de año** y **completo**. **INAU:** **a pedido**, y puede ser por
**un solo chico**.

**Lo que IPPU pidió es un área de generación de informes CONFIGURABLE, no un catálogo cerrado de tipos.**
Los tipos de arriba se registran como **idea de implementación**, no como modelo decidido — modelarlos
como enumeración fija sería repetir el error de tomar el ejemplo por la regla.

**Qué NO cambia.** El **informe de cierre anual sigue siendo uno por año**: `informe_cierre` y su
`uq_informe_cierre_hce_anio` (`app/models/modulos.py:451`) son correctos y **no se tocan**.

**REGLA NUEVA: todo informe lo revisa ADMIN —en los hechos, la dirección de IPPU— antes de entregarse.**
Eso es un **estado de flujo** (*borrador → revisado por dirección → entregado*), **no un permiso de
impresión**. La lectura anterior —«la impresión pasa por ADMIN»— era **más angosta y estaba mal**: no es
quién puede apretar imprimir, es que el documento tiene un estado más antes de salir.

**Lo que hoy no existe (R0, BLOQUE 5):** ningún estado de revisión o aprobación en el modelo; ninguna otra
entidad de informe (`information_schema` con `LIKE '%inform%'` devuelve **sólo `informe_cierre`**);
**ni destinatario, ni solicitante, ni tipo de informe** (`grep` → 0 resultados); y **ninguna generación de
PDF** — 1 comentario en `modulos.py:429` y `requirements.txt` sin ninguna librería de PDF.

### 5.41 (I6) Usuarios, roles y asignación técnico↔grupo (2026-08-26, Lucas)
**IPPU:** **cada técnico tiene su propio usuario**. Los técnicos ven **sólo los grupos que tienen
asignados**. **ADMIN ve todo**, **asigna los grupos** y **puede crear otros ADMIN**.

**Enmienda el no-goal del plan M12** —*«No se toca autenticación. La segmentación de HCE-INC se modela
como **dato**, no como permiso»* (`PLAN-M12-…md:109`)—. El plan es **anterior a la reunión**: queda
**enmendado, no borrado**, con puntero a esta entrada.

**Distancia entre lo que IPPU describe y lo que hay (R0, BLOQUES 4 y 7):**

| Lo que describe IPPU | Lo que existe hoy |
|---|---|
| Usuario por técnico | `profesional` — 7 columnas, `email` único, `hashed_password` **nullable** |
| Rol | `rol varchar(20)` con `ck_profesional_rol_valido CHECK (rol IN ('admin','tecnico'))` — **dos roles fijos por CHECK, no una tabla** |
| Asignación técnico↔grupo (N:M) | **dos columnas fijas**: `grupo.tecnico1_id` y `grupo.tecnico2_id`. **Techo de 2 técnicos por grupo**, y **sin vigencias** |
| «ve sólo sus grupos» | **nada**. `usuario`, `rol`, `permiso` → `to_regclass` **NULL** las tres |
| Login | **no existe**. `app/main.py` monta **sólo `/health`**; `passlib` y `python-jose` están instaladas y **sin usar** |

**Secuencia: DESPUÉS de M12.5 y M12.6**, que no dependen de esto.

**Esto es la decisión escrita que le faltaba a un pendiente que ya estaba anotado.** §6 lo trae como
**«`grupo` — mostrado y no modelado»**: F1 introdujo `responsable1`, `responsable2` y
`tecnicosAutorizados` **en la capa de presentación, sin decisión de §5 detrás**, y esa entrada predecía
que un «sí» de IPPU **abriría trabajo de backend en vez de confirmar un supuesto**. **Pasó exactamente
eso.**

### 5.42 (I7) PAI: nombre oficial, se retira la sección VII, y puede haber más de uno por año (2026-08-26, Lucas)
- **Nombre oficial: «Proyecto de Atención Integral»** (INAU), **no** «Propuesta de Atención Individual»
  del prototipo. **Va impreso en lo que se le entrega a INAU.** Cierra `puntos-a-validar.md` §1.11 y
  `consulta-a-ippu.md` §3.11.
- **La sección VII — «Análisis estratégico de la situación actual» — se RETIRA**, a pedido de IPPU.
  Registrada en el plan M12, §M12.6.
- **Puede haber más de un PAI por año.** **Confirma la consecuencia 1 de §5.22**: `pai` **no** lleva
  `UNIQUE(hce_id, anio)` — no se replica el patrón de `informe_cierre`.
- **Es una herramienta de trabajo de uso frecuente.** Eso **confirma la lectura de documento dinámico de
  §5.22**, que hasta ahora se apoyaba en **investigación sobre normativa INAU y no en material de IPPU**;
  la propia §5.22 lo marcaba «confirmar en la reunión». **Confirmado.**

**Costo: ninguno de esquema.** R0 verificó que **ninguna de las 6 tablas de PAI existe** (`to_regclass`
NULL en `pai`, `pai_objetivo`, `pai_equipo`, `pai_coordinacion`, `pai_taller`, `pai_evaluacion_previa`).
Esto cambia **la especificación** de M12.6, no un esquema construido.

### 5.43 (I8) `hc_historico` es un entero desde 1000, y **migran todos** los expedientes (2026-08-26, Lucas)
- **Formato:** entero **desde 1000** — 1001, 1002, … Cierra `puntos-a-validar.md` §1.7 y
  `consulta-a-ippu.md` §3.4.
- **Migración:** **todos los registros pasan al sistema nuevo**, activos **y** archivados. Cierra
  `puntos-a-validar.md` §1.8 y `consulta-a-ippu.md` §3.3.

**Hoy la columna es `varchar(30)` nullable, sin CHECK, sin índice y sin validación de aplicación** (R0,
BLOQUE 8): el único límite es el largo. Con un entero desde 1000 **se puede validar**, y conviene
decidirlo junto con §10 (archivo histórico) y con `OrigenMigracionMixin`, que ya aporta
`sistema_origen`/`fecha_original`/`fecha_migracion`/`responsable_migracion` en **3 tablas** (`persona`,
`hce_diurna`, `idea`). **No se cambia el tipo en esta sesión.**

⚠️ **Consecuencia que esto NO cierra y que ahora pesa más:** el bloque 13.a del registro de la reunión
—qué se hace con los puntajes históricos aplicados con la «Guía del aplicador» que tenía el corrimiento en
las dimensiones **3, 4, 6 y 12**— **quedó sin contestar**. Con «migran todos», **esos puntajes entran**,
sin criterio clínico decidido.

### 5.44 (I9) Heroku es **dónde vive hoy** la HCE de IPPU. **No** es el destino (2026-08-26, Lucas)
La HCE actual de IPPU está **alojada en Heroku**. **No es el destino confirmado del sistema nuevo**: las
opciones de despliegue **se evalúan más adelante**.

- **Entra como dato de** `puntos-a-validar.md` §1.5 y `consulta-a-ippu.md` §3.2 — dónde viven los datos y
  desde dónde habría que migrar.
- ⚠️ **`puntos-a-validar.md` §2.5 (despliegue de producción) SIGUE ABIERTO.** Esta entrada **no** es una
  decisión de despliegue y no se puede citar como tal.

### 5.45 (I10) Confidencialidad, reencuadrada: **guardar no, compartir sí** (2026-08-26, Lucas)
Guardar el dato en la HCE **no requiere permiso**; **compartirlo, sí**.

**Consecuencia sobre `puntos-a-validar.md` §1.6:** deja de **bloquear el desarrollo** y pasa a bloquear
**que el dato salga del sistema**. Es la misma familia que **I4 (§5.39)**: el modelo tiene almacenamiento
y **no tiene divulgación**.

⚠️ **Lo que esto NO mueve.** La regla de `CLAUDE.md` sigue igual: **hasta que exista acuerdo de
confidencialidad firmado, sólo datos simulados/anonimizados**. Lo que se reencuadra es **qué bloquea el
papel**, no si hace falta. Y el trámite en sí **no avanzó**: el bloque 12 del registro de la reunión
—quién lo redacta, quién firma, para cuándo— **quedó sin respuesta**.

### 5.46 (I11) Ateneos: cuatro tipos, visibilidad **por grupo**, y un indicador institucional (2026-08-26, Lucas)
**M12.7 ya está cerrado. Esto son deltas sobre lo implementado.**

- **Los cuatro tipos se confirman, con la jornada de capacitación incluida** — es **la instancia donde
  varios técnicos se juntan a repasar ateneos**, así que pertenece al módulo y no es un cuerpo extraño.
- **Prefijo:** alcanza con **uno común**; un `JC-` propio para las jornadas es **aceptable si es barato**
  — y lo es: `codigo` es **derivado** (`app/models/ateneo.py:284-308`), **una línea y ninguna migración**.
  Cierra `puntos-a-validar.md` §1.13.
- **El número es del año en que se REGISTRÓ** — exactamente lo implementado (`anio_correlativo`, el
  correlativo se congela al crear). Cierra `puntos-a-validar.md` §1.14 y `consulta-a-ippu.md` §3.13 **con
  cero trabajo**.
- **Falta, y hay que construirlo:** un campo explícito de **observaciones** (R0: **no existe** — los dos
  hits de «observ» en `ateneo.py` son referencias a la tabla `observacion` en comentarios) y **adjuntos de
  documentos, PPTX en particular** (R0: **ninguna** restricción ni validación de tipo de archivo;
  `documento.archivo_ref` es `varchar(400)` y el storage real está diferido a Fase 6). **«Agregar acuerdo»
  ya existe y se queda.**

⚠️ **VISIBILIDAD — esto CORRIGE el apunte crudo de la reunión.** El apunte decía «todos los técnicos ven
todos los ateneos». **No es así:** **cada técnico ve los de su propio grupo**, y **la jornada de
capacitación es la instancia transversal**. Cierra `puntos-a-validar.md` §1.12 y `consulta-a-ippu.md`
§3.12 **en dirección RESTRICTIVA — la contraria a la que sugería el apunte**, y por eso se dice explícito.

**Y hay que decirlo porque lo implementado no lo expresa:** el derivado es
`sensible = (tipo == 'clinico')` (`app/models/ateneo.py:310-326`), una regla de dos valores **sobre el
tipo**, cuando lo que IPPU describe es visibilidad **por grupo**. Lo bueno es que hay con qué resolverlo:
`ateneo.grupo_id` ya existe, con dos CHECK que lo **exigen** en el ateneo de grupo y lo **prohíben** en
institucional y jornada. Pero es **matriz de permisos**: depende de **I6 (§5.41)** y cae en **Fase 4**.

**Indicador institucional: 8 ateneos al año, al menos 2 por grupo.** Va al **tablero de M11.3/M11.4**.
R0 confirmó que **hoy nada cuenta ateneos por grupo ni por año**.

### 5.47 (I12) La puntuación es **conjunta**: un solo número. D7 queda **latente**, y **kappa no es calculable** (2026-08-26, Lucas)
**IPPU:** los dos técnicos **acuerdan en persona** y registran **un solo número, un solo campo**. Cierra
`puntos-a-validar.md` §1.9 y `consulta-a-ippu.md` §3.8.

**D7 (§5.16) no queda equivocada: queda DORMIDA.** `puntuacion_idea` y `puntuacion_protocolo` se
modelaron **nullable exactamente para este caso** — el propio §5.16 lo escribió así. **No se retira
nada**, y el guard de «diferencia ≥ 2 exige documentación» que M11.3 tenía anotado **queda sin sujeto**
mientras la práctica no cambie.

⚠️ **La consecuencia hay que decirla en voz alta:** el **kappa de confiabilidad interjueces** que exige el
**Manual §23** —y al que el propio Manual llama **el único requisito metodológico invariante del
instrumento**— **NO ES CALCULABLE** con la práctica actual de IPPU. Con un solo puntaje de consenso no hay
dos series que comparar. **Si el trabajo se presenta a INAU, eso se dice; no se deja implícito en que el
modelo «lo soporta».**

### 5.48 (I13) Confirmaciones que cierran puntos **sin abrir trabajo** (2026-08-26, Lucas)
Todo lo de esta entrada viene de la misma reunión y **no cambia nada de lo implementado**.

| Qué confirmó IPPU | Qué cierra | Trabajo |
|---|---|---|
| **Los cortes del baremo son correctos** como están cargados (0–4 · 5–24 · 25–49 · 50–95 · 96–100), confirmados por IPPU y por la documentación oficial de **BUND** | `puntos-a-validar.md` **§1.2**. ⚠️ **No es pregunta del cuestionario**: se retiró antes de enviarlo (§5.34) | **Ninguno.** Y el guard de «se ajustan los cortes, nunca las etiquetas» **nunca hay que ejercerlo** |
| **Las 24 citas de la Escala IPPU-TEA están bien** | `puntos-a-validar.md` **§1.4** — mismo caso: retirada antes de enviar | Ninguno |
| **Severidad DSM-5-TR: 0..1 por expediente, revisable, sin cadencia fija** | `puntos-a-validar.md` **§1.10** / `consulta-a-ippu.md` **§3.10**. **Confirma M12.4 tal cual** | Ninguno |
| **DSM-5 y CIF son documentos de referencia** para vocabulario común | — | Vale tenerlos **accesibles desde la aplicación** |
| **Firmas: dos técnicos; firmado = cerrado; las correcciones van en nota aparte** | `consulta-a-ippu.md` **§1.2** | Ninguno — es lo modelado (`FirmaMixin`, `addendas`) |
| **NNA que cambia de grupo a mitad de año: lo firmado queda firmado; lo pendiente lo firma el técnico nuevo** | `consulta-a-ippu.md` **§3.6 y §3.7**, y el residuo abierto en `puntos-a-validar.md` §2.6 | Ninguno de esquema |
| **«Evaluación por áreas» y «general» quedaron reemplazadas por los Protocolos A y B** | `consulta-a-ippu.md` **§2.5** | Ninguno — §5.1.2 ya las había sacado |
| **Los períodos son recordatorios sin fechas rígidas; el orden A→B es firme** | `consulta-a-ippu.md` **§2.7** | Ninguno |
| **El documento de la familia se entrega casi siempre en papel** | `consulta-a-ippu.md` **§3.9** | Ninguno |
| **Un NNA puede dejar de concurrir a diurna y seguir en clínica** | `consulta-a-ippu.md` **§2.6** | ⚠️ **Ver abajo** |

⚠️ **La última tiene tensión con §5.12 (D3), que deja Clínica y Taller Terapéutico fuera de alcance.**
No se reabre D3 acá: lo que hay que registrar es que **la transición igual tiene que poder anotarse** —
que un expediente de diurna se cierre porque la persona pasó a clínica **es un hecho del expediente de
diurna**, no de un módulo fuera de alcance.

### 5.49 (I14) Guía de trámites para las familias (2026-08-26, Lucas)
IPPU quiere tener **una guía a mano para dar a las familias**, sobre todo para **trámites: BPS, MIDES,
INAU**. **El trámite que más consultan es AYEX.** **Va junto con los informes.**

**Es contenido, no modelo** — pero **necesita dueño** y una decisión que sí es de diseño: **si el texto se
edita desde la aplicación o es fijo**. Va a §6 sin dueño asignado.

---

## 5.50 → 5.52 · Decisiones de M12.5 (HCE-INC), serie **J** (2026-08-26, Lucas)

> **Ésta sí implementa.** A diferencia de la serie I —que fue registro de la reunión y no tocó `app/`—,
> las tres entradas de acá se escriben **antes** de modelar y quedan implementadas en la misma sesión:
> **42 tablas**, **307 tests en verde y 0 salteados**, migración regenerada (`aa26917b6e76`).
>
> **Ninguna de las tres deroga nada.** J1 fija una regla nueva que no existía; J2 contesta una pregunta
> que §5.35 dejó explícitamente abierta; J3 decide algo que el plan M12 dejó marcado como «decidir».

### 5.50 (J1) Cómo se lee una fuente que es **a la vez** especificación y aplicación (2026-08-26, Lucas)
**Regla general para toda la ronda M12 y lo que venga. La hereda cada sub-módulo que siembre catálogos.**

> Antes de sembrar **cualquier** valor tomado del Prototipo v4 —o de cualquier fuente que sea a la vez
> especificación normativa y programa ejecutable— se clasifica **por dónde vive el dato dentro de la
> fuente**, nunca por lo que el dato parece:
>
> | Dónde vive en la fuente | Qué es | Qué se hace |
> |---|---|---|
> | **Capa de catálogos** — `const NOMBRE = [...]` declarada junto al módulo y consumida por sus propias funciones de render o derivación | contenido normativo | **se siembra** |
> | **Seed de su base de demostración** — `DB.*`, `GRUPOS_EQUIPO`, objetos con nombres propios de personas o rotulados «(demo)» | relleno | **NO se siembra** |
> | **Inline dentro de un widget** — literal en un `<select>`, sin nombre de constante | ni una cosa ni la otra | **se clasifica caso por caso y se declara por escrito** |
> | **Dentro del cuerpo de una función** — tramos calculados en `ideaInterpreta()`, `deltaInterpreta()` | contenido, pero extraído por parsing | se siembra **y se dice de dónde salió** |
>
> Lo que **no se pueda clasificar con evidencia entra SIN SEMBRAR**, con pregunta abierta. La evidencia se
> escribe: dónde está en la fuente, si hay marcadores «(demo)», si hay nombres propios, si hay valores
> plausiblemente específicos de una institución.

**De dónde sale.** §5.37 (I2) diagnosticó el caso: los cuatro grupos por color entraron al repo como
afirmación sobre la realidad institucional y eran **datos de demostración** del propio prototipo. Esa
entrada dejó el criterio dicho en una línea («un catálogo es contenido; el seed de su demo es relleno»);
esto lo convierte en **procedimiento con evidencia obligatoria**, porque M12.5 tomaba cinco catálogos más
de la misma fuente y no había forma de saber cuál era cuál sin volver a mirar el HTML.

**La clasificación de los cinco catálogos de M12.5, con la evidencia medida.** Los cinco están declarados
como `const` **dentro del bloque de HCE-INC** de `docs/prototipo-v4/HCE_IPPU_Prototipo_v4.html` (offsets
358251–359700), inmediatamente después del comentario de diseño del módulo, y los consumen sus propias
funciones (`incChip`, `mInc`, `incAdd`). **Ninguno** trae marcador «(demo)», nombre propio de persona ni
valor específico de IPPU.

| Catálogo | n | Evidencia | Veredicto |
|---|---|---|---|
| `INC_TIPOS` | 10 | Categorías del **sistema educativo nacional** (ANEP, UTU, liceo público/privado), no de IPPU. Cierra con «Otro» | **normativo** → constante |
| `INC_ESTADOS` | 7 | Cada fila trae **definición propia** («Concurre con regularidad, en horario completo o acordado como suficiente») y clase de semáforo. El módulo la renderiza como tabla de referencia | **normativo** → **tabla** |
| `INC_TEMAS` | 5 | Clasificación temática; uno de los cinco es el discriminador de `sensible` | **normativo** → constante |
| `INC_MEDIOS` | 7 | Canales de comunicación genéricos (WhatsApp, Llamada, Correo…). Cierra con «Otro» | **normativo** → constante |
| `INC_ROLES` | 8 | Roles de interlocutor. El único valor institucional es **«INAU»**, un organismo del Estado ya modelado en HCE-ORG | **normativo** → constante |

⚠️ **La prueba que cierra el caso, y es negativa:** el prototipo **no tiene ni una fila de datos de
inclusión**. Su plantilla de paciente nace con `inc:{centro:'', tipoCentro:'', …, estado:'Sin registrar',
bitacora:[]}` (offset 189624) y ninguno de los pacientes de su demo la llena. **Los cinco catálogos no
pueden ser «filas que la demo necesitaba para renderizar»: la demo no renderiza ninguna.**

**Lo que la regla obligó a declarar, y el plan no tenía.** El campo `at` (asistente personal /
acompañante terapéutico) tiene un **dominio de tres valores** —`No` · `Sí` · `En trámite (lista de
espera)`— escrito **inline en el `<select>` de `mInc()`**, sin nombre de constante. No está en la capa de
catálogos ni en el seed: es el tercer caso de la tabla de arriba. Se clasifica como dominio, se implementa
con CHECK y **queda dicho acá** porque ni `PLAN-M12 §M12.5` ni `prototipo-v4-referencia.md` §6 lo
registran — los dos listan `at` como un campo más.

**La regla se aplicó también a NUESTRO propio relleno, y ése es el caso más útil.**
`catalogo_centro_educativo` **se siembra con CERO filas**. El prototipo no tiene catálogo de centros
(`centro` es texto libre), así que no hay nada normativo que extraer; y los seis nombres de escuela que sí
existen —«Escuela pública N.º 87», «Liceo público N.º 12»— están en **`demo/js/inclusion.js`
(`INC_SEED`)**, que es relleno de nuestra propia demo. Sembrarlos habría puesto seis centros inventados
por nosotros dentro del sistema de IPPU: **el mecanismo de §5.37 con otro sujeto**. Fijado por
`test_el_catalogo_de_centros_se_siembra_vacio`.

**Catálogos ya en el repo que NUNCA se verificaron contra esta regla — se listan, NO se re-verifican acá.**
Es deuda anotada, no trabajo de esta sesión; el lugar natural para saldarla es **M12.8**, que ya tiene que
tocar `DESDE_LA_DEMO`.

| Catálogo | Entró en | Origen declarado | Por qué queda pendiente |
|---|---|---|---|
| `taller` (14) | M12.3 | `CAT_TALLERES` | §5.37 lo nombra como caso correcto **al pasar**, sin la evidencia escrita que esta regla exige |
| `severidad_nivel` (3) | M12.4 | `SEV_ETQ` · `SEV_CS` · `SEV_CRR` · `SEV_APOYO` | sin verificar |
| `ATENEO_TIPOS` (4) | M12.7 | `AT_TIPOS` | sin verificar |
| `idea_ficha` (12) · `idea_ejemplo` (48) · `idea_regla` (9) | M12.1 | `IDEA_FICHAS` · `IDEA_EJ` · `IDEA_REGLAS` | sin verificar |
| `idea_nivel.descriptor_breve` · `idea_dimension.que_evalua` | M12.1 | `IDEA_DESC` | sin verificar |
| `banda_idea` (6) · `delta_interpretacion` (6) | M12.1 | `ideaInterpreta()` · `deltaInterpreta()` | ⚠️ **cuarto caso**: no salen de un `const`, se extraen **parseando el cuerpo de una función**. La regla los cubre en su cuarta fila, escrita justamente porque estos dos no entraban en las tres primeras |
| `grupo` (4) | M12.1 | `GRUPOS_EQUIPO` | **ya verificado y ya está mal** — §5.37. Es el precedente, no deuda |

⚠️ **Y queda en pie la pregunta que §5.37 abrió y el repo no puede contestar solo:** si los cuatro colores
fueron inventados por una IA y **ya venían adentro del Prototipo v4**, la invención es **anterior a
nuestro repo** y está en la fuente de **precedencia 1** (§5.10). **Cuánto del Prototipo v4 es material de
IPPU y cuánto es relleno generado hay que preguntárselo a IPPU.** Esta regla acota el daño; no lo cierra.

### 5.51 (J2) El estado de inclusión es **CONTINUO**, no anual (2026-08-26, Lucas)
**Una ficha de inclusión por expediente, con estado vigente** (`inclusion`, 0..1, `UNIQUE(hce_id)`) —
**no** una por año lectivo.

**Contesta la pregunta que §5.35 aisló a propósito** (derivado 1) para que no se perdiera detrás de la del
IDEA. **IPPU no la contestó**: la reunión del 21/08 respondió que el **IDEA** es anual (I1 · §5.36), que
es una pregunta distinta — el IDEA es un instrumento con línea base; el estado de inclusión es una
situación vigente. Mezclarlas haría que una respuesta se leyera como si contestara las dos, que es
exactamente lo que §5.35 quiso evitar.

**Tres razones, en orden de peso:**

1. **La historia ya está modelada, y no es esa tabla.** El módulo **ya tiene** su serie temporal: la
   **bitácora**, 1:N y fechada. Anualizar la ficha crearía un segundo lugar donde leer «cómo venía la
   inclusión en 2025» — **dos fuentes de verdad sobre lo mismo**, que es lo que §5.20, §5.22 y §5.24
   prohíben tres veces.
2. **Es lo que describe el instrumento.** `fecha_estado` **se reescribe** en cada cambio
   (`incEstadoSet` del prototipo) en vez de acumular filas, y `p.inc` es un **objeto**, no un array. El
   patrón anual del esquema (`protocolo`, `informe_cierre`, `grupo`, y el `idea` que viene) se aplica a
   **ciclos**; esto es un **estado**.
3. **Es la dirección reversible**, el mismo criterio con que M12.4 eligió `severidad_dsm` 0..1
   (`puntos-a-validar.md` §1.10, confirmado por IPPU en §5.48): pasar a 1:N no pierde ninguna fila; el
   camino inverso obliga a elegir una por expediente y **descartar el resto**.

**Y acá el costo de cambiar es MENOR que en severidad, por una decisión de forma que se tomó por esto.**
`inclusion` lleva **`id` propio + `UNIQUE(hce_id)`**, y no `hce_id` como PK como hace `severidad_dsm`. El
motivo es que esta ficha **tiene tabla hija**: con la PK en `hce_id`, anualizar obligaría a repuntar cada
fila de `inclusion_bitacora` y reconstruir su FK. Con `id` serial, **anualizar es soltar un `UNIQUE`** —
cero movimiento de datos, y la hija no se entera. **Refina el precedente de M12.4; no lo contradice.**

⚠️ **La contracara, dicha entera:** con una sola fila, **cambiar de centro pisa el centro anterior** y el
rastro queda sólo en `auditoria` — que hoy es una **aspiración**, porque `app/services/` no existe y nada
garantiza que un UPDATE escriba `campo`/`valor_ant`/`valor_nuevo`. Es el **mismo hueco** que M12.4 dejó
anotado para `severidad_dsm`, y el guard **«toda edición de `inclusion` registra auditoría de campo»**
queda en §4 del esquema junto al de severidad. En la práctica el cambio de centro **sí queda narrado en la
bitácora**, que es donde el área lo escribe.

**Va como pregunta a IPPU** en `docs/notas/puntos-a-validar.md` §1.15, con el costo de darla vuelta
escrito: **quitar un `UNIQUE`, agregar `anio`, y decidir qué significa «la ficha vigente» para el
tablero**. Ninguna fila se pierde.

### 5.52 (J3) `inclusion.centro` es **texto**, no FK al catálogo de centros (2026-08-26, Lucas)
El plan M12 §M12.5 lo dejó marcado para decidir, con el precedente de M12.3 explícitamente sobre la mesa.
**Se decide igual que M12.3 —texto sin FK— y el fundamento es distinto y más fuerte.**

**Lo que decidió M12.3 (D5 · §5.14 · §5.20).** `pai_taller.taller_nombre` es texto sin FK para que retirar
o reordenar un taller nunca arrastre un registro clínico, y para que un taller retirado siga legible,
marcado.

**Por qué acá no alcanza con repetir ese argumento.** Un taller es **oferta propia de IPPU**: lista
cerrada de 14 que la institución controla entera. Un centro educativo es una entidad **externa y de mundo
abierto** — hay miles y IPPU no es dueña de la lista. **El catálogo no puede estar completo de antemano**,
y ésa es la diferencia que decide:

> Con FK obligatoria, el área **no puede registrar la escuela a la que el NNA ya entró** hasta que alguien
> la dé de alta en el catálogo. **Y hoy ese «alguien» no existe:** no hay endpoint, servicio ni pantalla
> que cree filas de catálogo (`puntos-a-validar.md` §2.8 y §2.9, verificado por R0). Con FK, **una
> pantalla que falta se convierte en un registro clínico bloqueado.**

**Qué se conserva.** `catalogo_centro_educativo` existe igual —lo pide D6 (§5.15) y lo pide el plan— y
sirve para lo que sí puede: normalizar, autocompletar, resolver `zona` y `contacto` por nombre, y darle a
coordinación la lista de **centros mencionados que todavía no tienen ficha**, que es una cola de trabajo y
no un error. Fijado por `test_la_ficha_no_tiene_fk_al_catalogo_de_centros` y
`test_se_puede_registrar_un_centro_que_no_esta_en_el_catalogo`.

**La asimetría con `estado`, que es la parte que hay que entender para no «arreglarla» después.**
`inclusion.estado` **sí es FK** (por nombre, `RESTRICT` + `ON UPDATE CASCADE`) contra `estado_inclusion`.
No es incoherencia: **es de quién es el dominio.** Los 7 estados son una clasificación **cerrada e
interna** del área —un valor fuera de la lista es un error de tipeo—, mientras que un centro fuera del
catálogo **es una escuela real que todavía nadie cargó**. La integridad referencial se pone donde el
universo es cerrado y se saca donde es abierto.

**Se suma a `puntos-a-validar.md` §2.9 y no abre punto nuevo**, como esa entrada ya había previsto por
escrito: es la tercera decisión de modelo que delega en coordinación una operación que no existe (grupos
§2.8 · talleres §2.9 · centros educativos, ahora).

---

## 5.53 · Decisión de la sesión de higiene (serie **K**, 2026-08-26, Lucas)

### 5.53 (K1) Se retira la designación del Google Doc como artefacto autoritativo: **el registro es el repo** (2026-08-26, Lucas)
**El Google Doc del equipo está vacío.** Lo confirmó Lucas el **2026-08-26**, mirándolo. Nunca se llenó.

**Qué decía §5.34 y por qué deja de valer.** Esa entrada cerró con «⚠️ **El artefacto autoritativo es un
Google Doc del equipo, no este repo**», y de ahí colgaban dos pendientes de §6: **pasar a mano las 25
respuestas al Doc** y **pegar el link del Doc** en la cabecera de `consulta-a-ippu.md`. El razonamiento era
correcto para lo que se sabía entonces —el `.md` había salido de un Doc que el equipo había editado, así
que el Doc iba adelante—, pero **la premisa era falsa**: no hay nada del otro lado.

**Lo que se retira es la designación, no §5.34.** §5.34 sigue vigente entera y sigue siendo la referencia
canónica de la renumeración: **el mapa borrador→enviado no se toca**, ni el hecho de que las tres preguntas
retiradas nunca se preguntaron, ni que `consulta-a-ippu.md` es el **snapshot palabra por palabra de lo que
IPPU recibió el 19/08**. Lo único que cae es la última línea de esa entrada: **el artefacto autoritativo es
este repositorio.**

**Consecuencias, todas de registro:**
- El pendiente de §6 «pasar las respuestas al Google Doc — a mano, y lo tiene que hacer una persona»
  **se cierra por inexistencia del destino**, no por haberse hecho.
- El pendiente «pegar el link del Doc» **se cierra igual**: no hay link que pegar.
- La condición de retiro de `docs/notas/respuestas-reunion-ippu-2026-08-21.md` tenía **cuatro** pasos y el
  cuarto era el Doc. **Con esto quedan cumplidos los cuatro** — pero ⚠️ **el archivo sigue sin borrarse**,
  por la otra razón que §6 ya daba y que no depende del Doc: es lo único que conserva **las dos
  correcciones de acta** y **los 12 bloques sin respuesta** (§16 del propio archivo).
- **`consulta-a-ippu.md` no cambia de contenido.** Sigue siendo el snapshot fechado de lo enviado; lo que
  cambia es que ya no se lo describe como copia de segunda de algo mejor que vive afuera.

⚠️ **Lo que esto NO borra: la lección de §5.34.** La quinta divergencia existió, y existió porque **la otra
mitad del documento estaba fuera del alcance de cualquier script del repo**. Que el Doc esté vacío hoy no
prueba que el mecanismo sea seguro: prueba que **esta vez** el riesgo no se materializó porque nadie usó el
Doc. La regla que queda es la de §12.1 —**el contexto vive en el repo**—, y con ella el límite conocido de
`verificar_estado.py` (no compara prosa) sigue abierto en §6.

---

## 5.54 · Decisión de la sesión de reconocimiento (serie **L**, 2026-09-02, Lucas)

### 5.54 (L1) El bloqueo de material de IPPU sobre M12.6 **se reencuadra, no se levanta entero** (2026-09-02, Lucas)
§5.28 (G1) le puso a M12.6 **dos** bloqueos. El primero —la ratificación de §5.8— ya lo movió **§5.35 (H3)**:
la puerta está **antes de M11.3**, no antes de los sub-módulos de M12. Queda el segundo, y es el que esta
entrada reencuadra: «falta material de IPPU — el **Anexo A del Manual** y las **13 secciones** que el
prototipo no muestra (§4, §7, §8, §12, §13, §15, §17, §18, §20–22, §24, §25)».

**Medido contra el código, no contra los `.md`** (sesión R1, §13):

1. **De las 13 secciones, 11 estaban a la vista.** El Prototipo v4 **embebe una versión de consulta del
   Manual** (`const MANUAL`, `docs/prototipo-v4/HCE_IPPU_Prototipo_v4.html:1730`) con 12 entradas
   agrupadas: 1 · 2 · 3 · 5 · **6–7** · 9 · 10 · **11–13** · **14–15** · **16–18** · **19–22** · **23–25**.
   Once de las trece reclamadas —**§7, §12, §13, §15, §17, §18, §20, §21, §22, §24 y §25**— **están ahí en
   forma condensada**. **Sólo §4 y §8 faltan de verdad:** no existe `id:'m4'` ni `id:'m8'`, y no hay una
   sola mención textual a «§4» ni a «§8» en todo el archivo. ⚠️ **La premisa de §5.28 no era falsa cuando
   se escribió: no se había medido.**
2. **El Anexo A no es material de esquema.** `docs/markdown/apartado-especificaciones-tecnicas-prototipo-v4.md:77`,
   bajo **§6 Requisitos NO funcionales**, lo cita una sola vez y dice qué es: *«Cálculo automático de
   totales y deltas con verificación visible por el evaluador antes de firmar (Anexo A del Manual)»*.
   Es **un cálculo y un control previo a la firma** — ni tabla, ni columna, ni catálogo. Pertenece a
   **M11.3**, que es donde el plan M12 §5.6 manda esa familia entera. **No bloquea el esquema de M12.6.**
3. **Lo que M12.6 necesita para modelar, está** — y está en dos lugares distintos, que no se confunden:
   - Los tres vocabularios del PAI —**`PAI_AREAS` (9), `PAI_PREST` (6) y `PAI_CIRCUITO` (4)**— viven en la
     **capa de catálogos del prototipo** (`HCE_IPPU_Prototipo_v4.html:947-996`), que es exactamente lo que
     **§5.50 (J1)** clasifica como normativo.
   - El **esquema de datos sugerido** está en `apartado-especificaciones-tecnicas-prototipo-v4.md:28-51`,
     e incluye **`pai_taller { pai_id, taller_nombre }` — «por nombre, robusto a cambios del catálogo»**
     (`:50`), que es lo que §5.20/§5.21 ya habían decidido por su cuenta.
   - ⚠️ **Ese esquema sugerido NO define una tabla `pai`.** La cabecera de ~46 campos sale del prototipo y
     de `docs/markdown/prototipo-v4-referencia.md` §7, no del `.md` de especificaciones.

**Se autoriza M12.6 en modo SOLO ESQUEMA**, con el mismo patrón que M12.1–M12.5 y M12.7: **tablas,
columnas y catálogos**. **Sin guards de validación** — quedan en **M11.3**, por el plan M12 §5.6.

⚠️ **Esto NO cierra el bloqueo, y no hay que leerlo así.** **§4 y §8 del Manual siguen faltando y no
sabemos de qué son** — el prototipo no las nombra ni por número. Se anotan en `docs/notas/puntos-a-validar.md`
hasta identificarlas. Lo que esta entrada dice es que **el esquema no las necesita para escribirse**, no que
dejen de importar: **si al identificarlas resultan ser de PAI, lo que se construya acá se revisa.**

⚠️ **§5 es append-only (§12.6):** esto es una **entrada nueva** que reencuadra la fila de M12.6 de §5.28
—precedente exacto: **§5.35 hizo lo mismo con la fila de M12.5**—, **no una edición** de §5.28.

---

## 5.55 → 5.56 · Decisiones de M12.6 (HCE-PAI), serie **L** (2026-09-02, Lucas)

> **Ésta implementa**, como la serie J: las dos entradas se escriben **antes** de
> modelar y quedan implementadas en la misma sesión — **50 tablas**, **389 tests en verde y 0
> salteados**, migración regenerada (`72b96030362d`). **Ninguna de las dos deroga nada:** L2 resuelve una
> contradicción **interna de la fuente** que §5.50 (J1) ya sabía arbitrar, y L3 aplica a tres vocabularios
> nuevos el criterio que M12.3, M12.5 y M12.7 ya habían fijado.

### 5.55 (L2) Los campos editables de las secciones I y II **son columnas propias de `pai`** (2026-09-02, Lucas)
La documentación decía que las secciones **I, II, VI, XI y XV** del PAI «se renderizan con `ro()` … hay
que modelarlas como referencias» (`docs/markdown/prototipo-v4-referencia.md:166`). **Medido contra el
código, es falso para cuatro de las cinco.**

**Qué muestra el render.** El prototipo usa **dos helpers distintos, uno al lado del otro**:

| Helper | Qué emite | Semántica |
|---|---|---|
| `ro(v)` (`:1012`) | `<input readonly>` con **un valor**, sin binding | se lee de otro módulo |
| `fecha(k)` · `sel(k,…)` · `txt(k)` · `ta(k)` (`:1013-1016`) | `onchange="getP(id).pai.<k>=this.value"` | **escribe en `p.pai`** |

En la sección II conviven los dos: `ro(p.inau.sipi)` y `ro(p.inau.convenio)` (`:1071-1072`) junto a
**`fecha('padronInau')`**, **`sel('disposicion',…)`**, **`sel('judicial',…)`**, **`txt('expediente')`**,
**`txt('derivadoPor')`** y **`ta('motivo')`** (`:1073-1078`). La sección I hace lo mismo con
**`fecha('ingresoIppu')`** (`:1068`).

**La prueba que cierra el caso es negativa: no hay de dónde leerlos.** HCE-ORG no los modela — su objeto
es `inau:{sipi, convenio, referente, ingreso, obs, envios[]}` (`:447`) y su editor `mOrg()` renderiza
exactamente esos cinco campos (`:2253-2257`). Modelarlos «como referencia» habría dejado **siete campos
del formulario sin ningún lugar donde guardarse**.

**La contradicción no era entre dos partes del código: era entre el código y la prosa.** El subtítulo de
la sección II —*«N.º SIPI y convenio tomados de HCE-ORG»* (`:1069`)— **nombra exactamente los dos campos
que son `ro()`** y es preciso. Lo que generalizó de más fue la ficha de novedades del prototipo (`:2011`),
que mete «marco administrativo (II)» entero en la lista de carga única, y
`prototipo-v4-referencia.md:166` repitió esa prosa **contradiciendo su propia línea `:149`**, que ya
listaba los cuatro campos bajo «Campos de cabecera (`p.pai`)».

**Se resuelve por §5.50 (J1)** —el código ejecutable manda sobre la prosa de la misma fuente—: los siete
son **columnas propias**. Lo que sí es referencia en la sección II son **`sipi`, `convenio` y el
diagnóstico**, nada más.

**Alcance exacto, para que no se lea de más:**
- **§I** — solo `ingreso_ippu` es propio; nombre, fecha de nacimiento, edad, CI y N.º de HC se leen.
- **§II** — siete propios; tres referencias.
- **§VI y §XI** — los **puntajes** se leen (IDEA, A, B, Δ, severidad, grupo) y la **interpretación
  clínica** se escribe: `sint_lb`, `delta_interp`, `frecuencia`, `etapa`, `otras_act`.
- **§XV** — es la única enteramente de lectura para los dos técnicos responsables; el resto del equipo se
  carga a mano en `pai_equipo`.
- ⚠️ **§V no se toca acá:** la fija §5.22 y sigue igual — `centro`, `modalidad` y `grado` se leen en vivo
  de `inclusion`, `apoyos_ed` y `otras_ed` son del PAI.

**Corolario de método, que es lo que hay que llevarse.** La categoría «sección de carga única» **no
existe**: la carga única es **por campo**. Ninguna de las cinco secciones es homogénea, y tratarlas como
bloque fue lo que produjo el error. Hay `test_los_campos_editables_de_las_secciones_i_y_ii_son_columnas_propias`
para que no vuelva.

⚠️ **`prototipo-v4-referencia.md:166` queda con prosa que esta entrada contradice.** No se edita en esta
sesión —es material de referencia, no de decisión—, y se anota en §6 para que lo corrija quien lo tome:
el texto correcto es el de su propia línea `:149`.

### 5.56 (L3) Los tres vocabularios del PAI son **constante, no catálogo** — y lo dice el prototipo (2026-09-02, Lucas)
`PAI_AREAS` (9), `PAI_PREST` (6) y `PAI_CIRCUITO` (4) van a `app/core/constantes.py` con CHECK generado
desde la constante, **no** a tablas de catálogo. Se decide con el criterio ya escrito —tabla si la
institución lo mueve sin que nadie despliegue; constante si cambiarlo es un cambio de código con
revisión— y con el mismo razonamiento de `ATENEO_TIPOS` (M12.7) y los cinco `INC_*` (M12.5).

**La evidencia que decide, y es del propio prototipo.** No hace falta razonar sobre la naturaleza de cada
lista: la fuente ya clasificó, y §5.50 (J1) manda leer su capa ejecutable.

| | Funciones de gestión en el prototipo | Apariciones en todo el archivo | Resultado |
|---|---|---|---|
| `CAT_TALLERES` | **4** — `tallerAdd`, `tallerToggle`, `tallerGrupos`, `tallerGestion` | muchas | **tabla** (M12.3) |
| `PAI_AREAS` | **0** | **2** (declaración + un consumo) | constante |
| `PAI_PREST` | **0** | **2** | constante |
| `PAI_CIRCUITO` | **0** | **2** | constante |

**La misma fuente que hizo administrable la oferta de talleres dejó estas tres fijas.** Es la distinción
que §5.50 pide y no una inferencia nuestra.

**Y cada una lo confirma por su lado:**
- **`PAI_AREAS`** — lista plana sin atributos, nadie la consulta por sí misma (a diferencia de
  `estado_inclusion`, que el módulo **renderiza como tabla de referencia**), y cierra con «Otra». CHECK y
  no texto libre porque «cuántos objetivos por área» es justo el indicador que el módulo habilita.
  ⚠️ **No confundir con el «área configurable» de `puntos-a-validar.md` §2.13**, que IPPU pidió en la
  reunión: aquello es el **área de generación de informes** (M11.3/M11.4). Mismo nombre, otra cosa.
- **`PAI_PREST`** — el dominio **no es de IPPU**: son prestaciones y certificaciones del Estado (BPS,
  Ley 20.378 / Dec. 72/025). Una nueva la crea la normativa, no coordinación. Mismo argumento que
  `INCLUSION_TIPOS_CENTRO`.
- **`PAI_CIRCUITO`** — el más claro: no son opciones, son **el procedimiento institucional escrito en
  oraciones completas**. Es el único de los tres que **no cierra con «Otra»**, a propósito.

**Decisión de forma que va con esto: se persiste el valor, no el índice.** El prototipo marca las de
`checks()` por **posición** (`P[campo][ix]`, `paiChk`) y esa forma **no se copia**: un índice es un
artefacto de cómo se dibujó la lista. Guardar la posición haría que insertar un ítem reescribiera en
silencio lo ya registrado — exactamente lo que D5 (§5.14) existe para impedir. Mismo recorte que
`INCLUSION_SEMAFOROS` le hizo a las clases CSS del tablero.

⚠️ **Lo que esta entrada NO resuelve, y queda anotado: `prest` choca con §5.22.** «Prestaciones y
certificaciones vigentes» es **diagnóstico de situación**, y por el reparto de §5.22 eso se lee en vivo,
no se congela. **Pero hoy no hay de dónde leerlo:** `organismo_bps` es 0..1 por expediente con **una
sola** `prestacion` en texto libre —no un conjunto— y dos de los seis ítems (la Valoración Funcional y el
certificado de discapacidad) **no son prestaciones BPS**. Se modela como `pai_prestacion`, hija propia del
PAI, y la pregunta —¿unificar con HCE-ORG, y en qué dirección?— va a **`puntos-a-validar.md` §2.15**. No
se decide de hecho en el código: se decide por escrito cuando haya con qué.

---

## 5.57 · Ratificación posterior a M12.6 (serie **L**, 2026-09-02, el equipo)

### 5.57 (L4) `pai_prestacion` se ratifica como excepción declarada a §5.22, no como lectura en vivo (2026-09-02, ratificado por el equipo)
Sobre §2.15 (tres salidas, `puntos-a-validar.md`). Medido en la sesión de reconocimiento del
2026-09-02: ningún módulo del backend implementa lectura en vivo hoy — `app/services/` no
existe, `app/routers/__init__.py` está vacío; el único otro caso de «leer en vivo» ya
decidido (§5.22, sección V del PAI contra `inclusion`) está en el mismo estado: ausencia de
columnas, sin lector todavía. La opción 1 (HCE-ORG → N:1 + lectura en vivo) supondría
adelantar la arquitectura completa de M11.3/M11.4 sólo para esta tabla — fuera de alcance
de M12.6/M12.8. La opción 3 (híbrido, avisar cuando difiere) requeriría antes una tabla de
equivalencias: `BPS_PRESTACIONES` (5) y `PAI_PRESTACIONES` (6) no comparten ninguna cadena
exacta.

Se ratifica la opción 2: `pai_prestacion` queda como declaración fechada del PAI, no como
copia sincronizada de `organismo_bps`. No es un descuido: es una foto a la fecha de la
propuesta, igual que el resto del documento. Se reabre en M11.3/M11.4, cuando exista la
capa de servicios, si conviene construir ahí el aviso de divergencia (opción 3) contra una
tabla de equivalencias a definir en ese momento.

---

## 5.58 · Reversión tras una corrección de IPPU (serie **L**, 2026-09-02, Lucas)

### 5.58 (L5) El ateneo de grupo es de **acceso general**, no «por grupo»: se revierte la visibilidad de §5.46 (I11) — ⚠️ **CONFIRMABLE, no está en el acta** (2026-09-02, Lucas)

**Qué revierte, y sólo eso.** El **párrafo de VISIBILIDAD de §5.46 (I11)** — sus dos partes: el bloque
«⚠️ VISIBILIDAD — esto CORRIGE el apunte crudo de la reunión» y su sub-párrafo «hay que decirlo porque
lo implementado no lo expresa». **Todo el resto de §5.46 queda en pie, sin tocar:** los cuatro tipos
con la jornada de capacitación incluida, el prefijo único (`AT-` para los cuatro, `JC-` opcional), el
correlativo por año de **registración**, el **indicador institucional de 8 ateneos al año / ≥2 por
grupo**, y los dos faltantes por construir (campo de **observaciones** y **adjuntos PPTX**). El título
de §5.46 se deja como está aunque siga diciendo «por grupo»: la corrección vive acá, no se edita §5.46.

**Qué es verdad ahora.** El **ateneo de grupo es de acceso general del equipo técnico**. El apunte
crudo de la reunión del 2026-08-21 —«todos los técnicos ven todos los ateneos»— **era el correcto**.
La lectura restrictiva que se le puso encima el 2026-08-26 —«cada técnico ve los de su propio grupo; la
jornada de capacitación es la instancia transversal»— **se retira**.

**Procedencia.** Lo relevó **Lucas el 2026-09-02**, como corrección de IPPU al registro de la reunión
del 2026-08-21. **No consta en el acta escrita** (`docs/notas/respuestas-reunion-ippu-2026-08-21.md` no
lo recoge). Se marca **⚠️ CONFIRMABLE**, igual que §5.38 (consentimiento): rige como decisión del
equipo desde hoy (§12.6), pero falta el respaldo escrito de IPPU. **No** se escribe como si IPPU lo
hubiera dicho en la reunión.

**Efecto sobre lo implementado: cero.** El derivado ya trata el ateneo de grupo como acceso general.
`Ateneo.sensible` es `self.tipo == TIPO_SENSIBLE` con `TIPO_SENSIBLE = "clinico"`
(`app/models/ateneo.py:38` · `:310-341`), así que un ateneo `tipo == 'grupo'` da `sensible = False`
—acceso general— tanto en Python (`:336`) como en SQL (`:338-341`). **No hay en `app/`, `tests/`,
`app/data/` ni `backend/docs/` ninguna regla de visibilidad por grupo para ateneos**, ni nada que
consuma `ateneo.grupo_id` como regla de acceso: `grupo_id` sólo alimenta los dos CHECK que lo
exigen/prohíben por tipo (`grupo_requerido_en_ateneo_de_grupo` y `grupo_solo_con_sujeto`, `:367-379`),
la FK RESTRICT, los índices de filtro y la advertencia cross-table `fecha ↔ grupo.anio` (M11.3). Tampoco existe todavía capa que pudiera aplicarla
(`app/routers/__init__.py` vacío, sin `app/services/`, `app/main.py` monta sólo `/health`). **Esta
reversión no toca modelo, esquema, migración ni tests.** Con ella, las **tres ⚠️ «lo implementado NO
expresa esto»** —handoff §5.46, `puntos-a-validar.md` §1.12, `respuestas-reunion-ippu-2026-08-21.md`
§9.a— **quedan retiradas por esta entrada, no por borrarlas**: §5.46 y §9.a se conservan como
registro; la de §1.12 se reescribe porque es nota de trabajo.

**Alcance, explícito.** Esto es **sólo** sobre el ateneo de grupo. El **ateneo clínico (NNA) no se
toca**: sigue heredando la matriz de acceso por roles de su HCE, según el aviso de confidencialidad
del Prototipo v4. Los institucionales y las jornadas ya eran de acceso general. **Que nadie extienda
esta reversión a los cuatro tipos.**

**Qué abre, no qué resuelve.** Queda una tensión sin cerrar con **§5.41 (I6)** —«un usuario por
técnico, cada uno ve sus grupos»— y con la **tabla de permisos del Manual §21.1**, que le **niega** a
un técnico «la HCE de otros grupos». Un ateneo de grupo discute NNA identificables de ese grupo —el
seed del propio prototipo: «Cierre de ciclo — Grupo Celeste» repasa Δ de protocolos—, así que un
técnico puede ahora leer, **a través del ateneo**, material sobre NNA cuya HCE no puede abrir. Se
registra en `puntos-a-validar.md` **§2.16**. **Acá no se resuelve.**

---

## 5.59 · Hallazgo de la sesión L7: el esquema del PAI modela una sección que IPPU mandó retirar (serie **L**, 2026-09-03, Lucas)

### 5.59 (L6) El esquema de `pai` lleva la sección §VII (FODA), que **§5.42 (I7)** decidió retirar — sale en M12.8a (2026-09-03, Lucas)

**Los hechos, medidos.** `app/models/pai.py:226-232` lleva **cuatro columnas propias** —`fort`, `oport`,
`debil`, `amen`, las cuatro `Text`— bajo el encabezado `── §VII · Análisis estratégico (FODA) ──`, con un
docstring que razona «cuatro columnas y no un JSONB». Y **§5.42 (I7)** registra que **IPPU pidió retirar
la sección VII** («Análisis estratégico de la situación actual»). Esa instrucción está escrita en cuatro
lugares: `handoff.md` §5.42 (`:1162`), `docs/notas/puntos-a-validar.md` §1.11 (bloque de cierre, `:344`),
`docs/notas/consulta-a-ippu.md` §3.11 (`:566`) y `docs/notas/respuestas-reunion-ippu-2026-08-21.md` §11
(`:551`). Y en el plan: **`PLAN-M12` §M12.6** (`:463`) dice *«SE RETIRA … no lleva columnas ni tabla hija»*.

**Se buscó un registro que la conservara a conciencia y no existe.** Grep de
`FODA|fort|oport|debil|amen|§VII|análisis estratég` sobre §5 y §13 de `handoff.md`, sobre `docs/prompts/`
(no hay prompt de M12.6 versionado — sólo M12.5, R0, D1 y los del harness), sobre `PLAN-M12` y sobre los
mensajes de commit de M12.6 (`7d6515f`, más `a9e2c3d` y `65a0b5a`). **Toda** mención de FODA/§VII es (a) la
instrucción de retiro, o (b) el hallazgo que la bitácora de L6 ya dejó anotado (`handoff.md:2215-2220`). El
commit `7d6515f` enumera §5.55, §5.56, §5.57, la derivación «43 = 49 − 3 − 3» y «`pai` NO lleva `UNIQUE`»
y **no dice una palabra sobre FODA**. El docstring de `pai.py:227-228` razona sobre la *forma* (cuatro
columnas vs. JSONB) y **no menciona §5.42 ni el retiro**. Conclusión: M12.6 no conservó §VII por decisión;
la escribió sin cruzarla contra la decisión de cliente que ya la había modificado.

**La aritmética que quedó mal.** La cifra «43 campos propios» se presentó en M12.6 como **derivada**: «49
claves en `p.pai` − 3 que se leen en vivo (§5.22) − 3 que son colecciones = 43» (`tests/test_m12_pai.py:196-197`).
Esa derivación **nunca restó los cuatro campos de FODA**. Verificado en esta sesión: las 49 claves del
enunciado (la enumeración de `docs/markdown/prototipo-v4-referencia.md:149-153`, que ya excluye las cuatro
colecciones-tabla `objetivos`, `prev`, `equipo`, `coords`) **incluyen `fort, oport, debil, amen`**;
sobreviven a las dos restas y caen en las 43. El modelo lo confirma: la clase `Pai` tiene **47**
`mapped_column`, menos las cuatro técnicas (`id`, `hce_id`, `creado_en`, `actualizado_en`) = **43**. **Sin
la sección VII son 39.** Hay un test que fija el 43: `test_la_cabecera_tiene_los_43_campos_propios`
(`tests/test_m12_pai.py:193`, aserción en `:200`, `len(...) == 43`).

**La decisión (D-11, Lucas, 2026-09-03).** Las cuatro columnas **salen en M12.8a**, la cifra se corrige a
**39** en todos los lugares donde se afirma, y el test pasa a `== 39`. **No se tocan en esta sesión**
(§12.6: la decisión se escribe antes que el código).

**Qué dice del proceso, dicho sin dramatismo.** M12.6 construyó contra una decisión de cliente ya escrita
y ninguna entrada registró la divergencia; el inventario de campos de §5.55 (L2) no lo detectó porque
trabajó **hacia adelante desde las secciones del prototipo**, no **hacia atrás desde las decisiones que ya
las habían modificado**. Es el modo de falla que §5.3 existe para atrapar. Se registra como **hallazgo, no
como reproche** — mismo criterio que §5.37 (I2) con los grupos por color.

**Dónde aparece la cifra, y qué corrige M12.8a.** ⚠️ **Acá no se corrige ninguna:** el número sigue siendo
43 hasta que las columnas salgan, y corregir la prosa antes que el código es el mismo drift al revés.
- **Prosa viva (M12.8a la corrige a 39):** `CLAUDE.md:139` · `handoff.md:1973` (bloque «Qué se hizo» de
  M12.6 en la sección de estado) · `tests/test_m12_pai.py:193` (nombre de la función), `:196-197` (docstring
  de la derivación) y `:200` (la aserción).
- **Registro histórico (no se edita):** `handoff.md:2304` y `:2311` (bitácora de M12.6), `handoff.md:2219`
  (el hallazgo de L6, que ya describe bien el problema).
- **Referencia:** `docs/markdown/prototipo-v4-referencia.md:149-153` enumera las 49 claves *incluyendo*
  `fort, oport, debil, amen` — describe el prototipo, que sí las tiene; le falta una nota de que §VII se
  retira. `PLAN-M12` usa «~46 campos» (`:472`, `:733`), aproximado y pre-M12.6.
- ⚠️ Los números `handoff.md:1922 / :2154 / :2161` del enunciado de la hoja corresponden, tras el
  corrimiento que metió la bitácora de L6, a `:1973 / :2304 / :2311`.

**Qué NO decide.** No decide *cómo* se quita más allá de lo que el plan ya fijó («no lleva columnas ni
tabla hija»). No toca el resto de `pai`. No adelanta ningún guard: todo eso es **M11.3**. Y no corrige la
cifra en ningún archivo — eso es **M12.8a**.

---

## 5.60 → 5.69 · Decisiones de cierre de la ronda M12 (serie **L**, 2026-09-03, Lucas)

> Salidas de la hoja de decisiones que L6 volvió a emitir **sin completar** (D-1 … D-10 de ese prompt; la
> numeración `D-N` es de la hoja, no de §5). **Esta sesión no implementa nada de esquema, seed ni test:**
> escribe las decisiones (§12.6) y cierra los puntos de `puntos-a-validar.md` que corresponden. Lo único
> no-documental es el archivado + borrado de la rama `feature/base-datos-hce` (D-9) y el cambio de
> convención de commits (D-3). Varias **ratifican** decisiones que estaban «a ratificar»; **ninguna deroga
> esquema**. Donde una deroga un razonamiento anterior, se dice **por nombre**.

### 5.60 (L7) §5.8 **RATIFICADA**: el equipo ratifica haber arrancado M11 sin la validación previa de IPPU (2026-09-03, Lucas)
La puerta que **§5.35 (H3)** puso **antes de M11.3** queda cruzada. La pregunta que guardaba —¿el IDEA es
anual?— se hizo y se contestó: **IPPU confirmó que es anual** (§5.36 / I1) y el cambio ya se decidió
aplicar; **§5.31** había medido antes que el argumento de costo se invirtió (con `idea` ya 1:N
—`ix_idea_hce_id … unique=False`—, pasar a anual es **aditivo**). No queda nada que decidir sobre *dónde*
está la puerta ni sobre *qué* respondería IPPU: sólo **aplicar el cambio**, que es trabajo de M11.3.

**Qué ratifica, por nombre: §5.8** («Arranque de M11 sin la validación previa de IPPU», 2026-08-07, que
estaba **«a ratificar por el equipo»**). Con esto deja de estar pendiente. El razonamiento: era una
decisión de **criterio** —el riesgo estaba acotado a la tabla `idea` (1 de 38) y frenar todo dejaba la
ronda parada por tiempo indefinido— y correspondía al equipo, no a quien la tomó solo (`puntos-a-validar.md`
§2.1). La medición le dio la razón: el cambio resultó aditivo y M12.1–M12.7 encima no lo encarecieron.

**Qué NO decide, explícito.** Ratificar §5.8 ratifica **ese arranque puntual sin validación previa**, **no
una licencia general para saltarse puertas**. La próxima puerta —«qué IDEA rige a la fecha de un documento
viejo», que pasa de prosa (`app/models/modulos.py:219`) a guards con test— sigue en pie y es de **M11.3**
(§5.35, §5.36).

**Cierra `puntos-a-validar.md` §2.1.**

### 5.61 (L8) Los grupos reales son **cinco, con nombre**: se ejecuta el renombrado en M12.8a (2026-09-03, Lucas)
Los colores eran ejemplos. Los grupos reales de IPPU son cinco: **Inicial · Escolares · Preadolescentes ·
Adolescentes · Taller de Adolescentes**. **Confirma §5.37 (I2)**, que ya los había registrado como la
corrección de la reunión del 21/08.

**Costo medido (L6, verificado en L7).** Es **4 → 5 filas** en `grupo`, todas `anio = 2026`, todas
distintas bajo `UNIQUE(nombre, anio)` (`uq_grupo_nombre_anio`). El único test que afirma los colores
**como correctos** es `tests/test_m12_catalogos.py:61-65` (`test_el_seed_trae_los_cuatro_grupos_por_color`);
el resto los usa como **literales de fixture** (`test_m12_catalogos.py:41` y `:46-58`, `test_esquema_v2.py`,
`test_m12_ateneos.py`, `test_m12_talleres.py`). `hce_diurna.grupo_id` (`transversales.py:124`) y
`ateneo.grupo_id` (`ateneo.py:230`) apuntan a **`grupo.id` (entero), no a nombres**.
`taller.grupos_orientados` (`catalogos.py:368`) es un **array de texto** cuyo dominio de nombres válidos
**cambia con esto**.

**Se ejecuta en M12.8a:** `UPDATE` de las filas + regenerar catálogos (`generar_catalogos_backend.py`) +
actualizar `test_el_seed_trae_los_cuatro_grupos_por_color` + revisar los literales de fixture + la demo.
**No en esta sesión.**

**Qué queda abierto.** **«Taller de Adolescentes»** está listado como el quinto en la misma enumeración
que los otros cuatro y se toma como una fila de `grupo` sobre esa base. **Si IPPU quiere decir otra cosa
con él** (un taller, no un grupo), vuelve. Se anota en `puntos-a-validar.md` §2.8.

⚠️ **`puntos-a-validar.md` §2.8 NO cierra:** lo que falta ahí es la **creación** de grupos desde la
aplicación (ADMIN abre el año nuevo), no los nombres. §2.8 se actualiza para separar las dos cosas.

### 5.62 (L9) Se adopta el **trailer de co-autoría** en los commits — nuevo estilo predeterminado (2026-09-03, Lucas)
⚠️ **En la hoja de L6, Lucas marcó «opción a» como etiqueta pero escribió:** *«se adopta el estilo CON
trailer de co-autoría → nuevo estilo predeterminado»*. **Manda la prosa; la etiqueta fue un desliz.** Se
deja anotado el desajuste acá para que nadie relea la hoja y concluya lo contrario.

**Qué decide.** De acá en adelante los commits del repo IPPU llevan trailer
`Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>` + `Claude-Session: <url>`, con conventional
commits y cuerpo en viñetas en español, como hasta ahora.

**Qué deroga, por nombre.** La línea de `commit-style-ippu.md` (memoria del equipo) y el puntero de
`MEMORY.md` que decían **«sin trailer de co-autoría»**: se reescriben para el nuevo predeterminado. Los
**dos commits de L5** (`a9e2c3d`, `65a0b5a`) —y el de M12.6, `7d6515f`— **dejan de ser una excepción
abierta** (la «divergencia» que anotaron las bitácoras de L5 y L6) y **pasan a ser el precedente**. La
historia no se reescribe en ningún caso.

**Consecuencia inmediata:** los commits de **esta sesión** llevan el trailer.

### 5.63 (L10) §5.58 **RATIFICADA**: el ateneo de grupo es de acceso general, como decisión de equipo (2026-09-03, Lucas)
El **ateneo de grupo es de acceso general** del equipo técnico; esto rige ahora como **decisión de equipo
ratificada**, no provisional. **Ratifica §5.58 (L5)** — que revirtió el párrafo de visibilidad de §5.46
(I11).

**La distinción que llevaba la marca ⚠️ CONFIRMABLE se mantiene tal como era:** nunca fue sobre si el
equipo había decidido —lo decidió el 2026-09-02 (§12.6)—, sino sobre que **IPPU no tiene nada por
escrito**. Así que esta entrada dice **las dos cosas**: la decisión **rige**, y **se sigue pidiendo
constancia escrita de IPPU** para el registro.

**Consecuencia de registro.** Se reescribe el ítem 9.a de la tabla de §16 de
`docs/notas/respuestas-reunion-ippu-2026-08-21.md` —hoy planteado como «falta respaldo, la decisión está
pendiente»— a **«la decisión rige; se pide constancia escrita»**. El ítem **no se borra**.

**Qué NO decide.** No toca `puntos-a-validar.md` §2.16 (la tensión entre acceso general al ateneo y §5.41
+ Manual §21.1), que sigue abierta y es de **M11.3 / Fase 4**.

### 5.64 (L11) Vocabulario de «fase»: se decide **fijar uno solo** (opción a); falta redactarlo — §2.3 NO cierra (2026-09-03, Lucas)
Lucas eligió **fijar un vocabulario único** para «fase» (la opción a de la hoja). Pero **el vocabulario no
se suministró**: falta la redacción concreta. **Por eso `puntos-a-validar.md` §2.3 NO cierra en esta
sesión.**

**Lo que se hace en su lugar:** se deja en §2.3 una **propuesta**, anclada en el uso que L6 midió —~98
apariciones en 17 archivos, **cinco sentidos**: (1) fases del backend 0–6, (2) fases del convenio, (3)
líneas L1–L4, (4) módulos M0–M11, (5) las fases del Documento Técnico (Fase 1/2 · A/B/C/D · «fase
piloto»)—. La propuesta nombra **un término por sentido**, dice **qué documentos normativos habría que
cambiar** para cada uno, y queda marcada **pendiente de ratificación de Lucas**.

**Solape con §2.4** (numeración de las líneas de trabajo): el sentido (3) es el mismo terreno. **Se anota,
no se resuelve acá.**

### 5.65 (L12) El criterio de aceptación §12-A: **M12.8 lo escribe en prosa; su forma ejecutable es de M11.5** (2026-09-03, Lucas)
La instrucción del plan («extender nuestro propio seed» — `PLAN-M12` §7 y §M12.8) **no tiene sujeto**: el
criterio **§12-A** vive sólo como prosa, en `backend/docs/esquema-datos-v2.md:532-533` (bloque «M11.5 —
Seed clínico + tests») y en `PLAN-M12` §M12.8; y el **seed espejo que extendería es trabajo de M11.5 que
no existe** — `app/` no tiene más seed que `seed_catalogos.py`, y los números **58 · 60 · 79 · Δ +19**
nacen como **datos simulados en `demo/js/`**.

**Decisión: M12.8 escribe el criterio en prosa** y registra que su **forma ejecutable aterriza en M11.5**.
La redacción de M12.8 dice qué afirma el criterio una vez que estén los **cuatro módulos de la ronda**
(HCE-INC, HCE-PAI, ateneos/HCE-DOC, HCE-SEV), las **seis bandas** del IDEA y los **catorce talleres**; qué
**conserva de §12-A** (reproducir por API el ciclo del usuario demo 1 con números idénticos + guards +
secuencia); y que **nada lo hace cumplir hasta M11.5**.

**Dicho claro:** hasta entonces es una **declaración de intención, no un chequeo**. No cierra ningún punto
de `puntos-a-validar.md` (§12-A no es un punto).

### 5.66 (L13) `ateneo.observaciones` entra en M12.8a; los adjuntos siguen diferidos a Fase 6 (2026-09-03, Lucas)
**Forma medida.** `observaciones: Mapped[str | None] = mapped_column(Text)`, **sin CHECK**, siguiendo a
`participantes` (`app/models/ateneo.py:257-270`). El regex `~ '[^[:space:]]'` es sólo para columnas
**obligatorias o mutuamente excluyentes**; un campo opcional no lo lleva.

**Por qué los adjuntos NO son problema de esquema.** `documento.archivo_ref` es `varchar(400)` sin
validación de tipo de archivo, y el almacenamiento real es **Fase 6**. El XOR `documento.hce_id` /
`ateneo_id` ya lo modeló §5.25 (M12.7); lo que falta —subir el PPTX, validar el tipo— es infraestructura,
no tabla.

**Qué ratifica.** Cierra el **primero** de los dos «faltantes concretos» que §5.46 (I11) dejó anotados
para ateneos (**observaciones**). El **segundo** (adjuntos PPTX) queda **explícitamente diferido a Fase
6**, no pendiente de M12.8a.

### 5.67 (L14) **Lucas toma M11.3** (2026-09-03, Lucas)
Desde §5.6 no hay módulos con dueño exclusivo: se avisa qué se toma. **Lucas toma M11.3** — servicios y
guards: secuencia del flujo, firma = bloqueo, **Δ sólo dentro del mismo instrumento** (reformulado por
§5.36, no «Δ sólo B−A»), baremo sólo desde `pct`, Anexo A del Manual, habilitación de §IX del PAI por
tipo, «qué IDEA rige a la fecha».

**Cierra `puntos-a-validar.md` §2.7.**

**Ítem aparte, no es decisión.** No se ha medido el estado real de M11.3. **La primera tarea de M11.3 es
un reconocimiento estilo R0 contra el código** — qué existe, qué asumió la puerta de §5.8, y qué cambiaron
por debajo las decisiones de la serie L (§5.54–§5.58) y **D-11 (§5.59)**. Se registra en `handoff.md` §6.

### 5.68 (L15) La rama `feature/base-datos-hce` se **archiva como tag y se borra** (2026-09-03, Lucas)
La operación está en la bitácora §13 y en §12.5. **Lo que registra la decisión:** la rama era trabajo de
**Victor** (PostgreSQL + triggers PL/pgSQL, ~1.605 líneas en `implementacion/hce-db/`, probada
end-to-end, reproduce IDEA 58 · PA 60 · PB 79 · Δ +19), **existe sólo en `gitlab`** (no está en `origin`),
está **2 commits adelante y 104 detrás** de `main`, su último commit es **`dfb1732`** (2026-07-15), **ningún
archivo de `docs/` cita su SQL**, y **contradice §5.2.2** (lógica en el servidor, sin triggers PL/pgSQL).

**Decisión:** archivar como **tag anotado `archivo/base-datos-hce`** sobre `dfb1732` —empujado a los **dos**
remotos— y **borrar la rama** de `gitlab`. El contenido queda accesible por el tag; `handoff.md` §12.5 y
toda referencia al nombre de la rama se reapuntan al tag.

**Cierra `puntos-a-validar.md` §2.2.** ⚠️ **La cierra antes de lo que §2.2 pedía** («decidir al terminar
M11»): por decisión explícita — la rama diverge más cada semana, nadie la consulta, y el tag preserva todo
lo que había que preservar.

### 5.69 (L16) Se decide **versionar un baseline** del harness de `demo/verificacion/` (2026-09-03, Lucas)
Hoy `demo/verificacion/.gitignore:6` excluye `*.json` y los únicos baselines son **tres capturas locales
del 2026-08-21 en una sola máquina** (§13, entrada «2026-08-21 (tarde)»), así que **la verificación de
§5.27 no la puede hacer nadie más** — un chequeo diferido que depende de artefactos locales sin versionar
**no existe** (§12.1).

**Decisión: se versiona un baseline.** ⚠️ Esta entrada **deroga el razonamiento** de
`demo/verificacion/README.md` —las secciones **«Por qué no hay un baseline versionado»** y **«Opciones para
un baseline versionado — medidas, no elegidas»**, cuya recomendación es la **opción 2** (sin baseline,
procedimiento de dos worktrees)—. El README **se reescribe cuando se committee el baseline**.

⚠️ **No se genera ni se committea el baseline en esta sesión.** Necesita Playwright, un navegador y una
corrida; va a una **sesión de demo** junto con el chequeo visual (Analítica · Grupos · alta de NNA ·
expedientes), que **sigue sin dueño**.

---

## 5.70 → 5.78 · Sesión L9 — reconciliación con el Protocolo de acceso y ejecución de la hoja de decisiones (2026-09-03, Lucas)

> **Contexto.** Ingresaron dos documentos de IPPU, los dos **anteriores al acta del 2026-08-26**:
> `docs/markdown/protocolo-acceso-confidencialidad-resguardo-hce.md` (Protocolo institucional de acceso,
> confidencialidad y resguardo de la HC — **nuevo en el repo**) y una reconversión del Documento Técnico
> (**idéntica en prosa** a `docs/markdown/1_documento-tecnico-utec-lidia.md`; sólo difieren artefactos de
> Docling — no se tocó). La regla de precedencia quedó en la cabecera de este archivo y en `CLAUDE.md`.
> **Esta sesión no implementa esquema, seed ni test.** Escribe decisiones (§12.6), cierra puntos de
> `puntos-a-validar.md` y actualiza `PLAN-M12` §M12.8a. Desde §5.70 las entradas **no llevan etiqueta
> `(L#)`** (§5.77 / decodificación al inicio de §5).

### 5.70 El ateneo es el canal que el régimen de acceso provee, no un hueco — §2.16 se resuelve contra el Protocolo (2026-09-03, Lucas)

**El hallazgo, verificado en el archivo ingresado.** El **§5** del Protocolo, fila **«Otros técnicos de
la institución, no tratantes directos del caso»**, dice: *«Acceso restringido, **únicamente mediante
interconsulta formal, ateneo clínico o pase de caso documentado**, y solo a la información pertinente a
esa consulta puntual»* (base normativa citada: Ley 18.335 Art. 18 lit. D — «responsables de la atención
médica» — y principio de finalidad, Ley 18.331 Art. 8). El **§6.1** lo repite como procedimiento: *«Todo
técnico no tratante que requiera consultar una HC ajena a su caso debe hacerlo mediante interconsulta
formal o en el marco de un ateneo clínico documentado, **dejando constancia del motivo**. El acceso se
limita a la información pertinente a esa consulta puntual.»*

**Qué cierra, y por qué no fue eligiendo un bando.** Cierra `puntos-a-validar.md` **§2.16** —«un ateneo
de grupo deja ver NNA cuya HCE el técnico no puede abrir»—. **No** se resolvió eligiendo entre §5.58/§5.63
(ateneo de grupo = acceso general del equipo) y §5.41 + Manual §21.1 (el técnico ve sólo sus grupos): la
pieza que faltaba era **esta fila del Protocolo**. El ateneo no es una fuga del régimen de acceso, **es el
canal que el régimen provee** para que un técnico no tratante vea lo pertinente de un caso ajeno. Ateneos
de grupo de acceso general y ateneos clínicos sensibles **conviven**. Cuatro fuentes lo sostienen a la
vez: **Protocolo §5 + §6.1**, **§5.58/§5.63** (decisión de equipo), **§5.41 (I6)** y **Manual §21.1**.

**Tres condiciones que el Protocolo impone, cada una escrita como lo que M11.3 tiene que construir:**

1. **«Sensible» no puede querer decir «sólo el equipo tratante».** El ateneo clínico es *justamente* cómo
   un técnico no tratante ve legítimamente lo pertinente de un caso ajeno. El guard es: visible para sus
   **participantes documentados** + el **equipo tratante** + **dirección/coordinación técnica-clínica** —
   no «el equipo tratante y nadie más».
2. **Leer el ateneo no es abrir la HCE.** *«Sólo a la información pertinente a esa consulta puntual»*
   (Protocolo §5 y §6.1) es la distinción de **enmascaramiento** que la hoja llamó **opción 2**: el
   endpoint de ateneos devuelve el acta, no el expediente.
3. **El acceso se registra con su motivo.** Protocolo §8: el registro lleva como mínimo *«fecha, persona
   que accede, HC consultada, **motivo de la consulta** y firma»*. Todo acceso a un ateneo que toca un
   caso ajeno deja registro **con motivo**.

**⚠️ El problema de modelado que esto destapa, medido contra el código antes de escribir nada.** La
condición 1 exige que la lista de **participantes documentados** autorice el acceso. Hoy
`ateneo.participantes` es **`Mapped[str | None] = mapped_column(Text)`** — prosa libre —
(`app/models/ateneo.py:257`), y su docstring (`:253-256`) lo dice explícito: *«Se consignan roles, no
nombres, salvo firma de acuerdos … es una decisión de privacidad, no de formato. Por eso es texto y no
una tabla de participantes con FK a `profesional`.»* **Con eso, la condición 1 es hoy inimplementable:**
una lista en prosa no autoriza a nadie. Para que autorice, `participantes` tendría que ser una
**relación** (`ateneo_participante` N:M a `profesional`), y eso necesita el **modelo de usuarios (§5.72)**
por debajo. **No se toca `ateneo.participantes` en esta sesión** — es trabajo de M11.3 y va **después** de
§5.72.

**Qué NO decide.** No diseña la matriz de permisos (Fase 4) ni el registro de accesos con motivo (§5.71
lo abre como pregunta, no como diseño). No cambia `ateneo.participantes` — sólo deja escrito que tiene que
dejar de ser prosa cuando M11.3 construya la condición 1. §5.58 y §5.63 quedan **enteras** en pie.

**Ítems residuales de construcción, para que no se pierdan** (todos M11.3 / Fase 4, anotados también en
`puntos-a-validar.md` §2.16, que cierra apuntando acá): (a) el guard de visibilidad del ateneo clínico =
participantes documentados + equipo tratante + dirección/coordinación; (b) el endpoint de ateneos
enmascara a «lo pertinente» según quién consulta; (c) `ateneo.participantes` pasa de `Text` a relación;
(d) registro de acceso con motivo (§5.71).

### 5.71 §2.12 DIVULGACIÓN — la tabla `divulgacion` entra en M12.8a, y el Protocolo aporta sus columnas (2026-09-03, Lucas)

**Qué cambia respecto de §2.12.** Hasta ahora `divulgacion` era «un concepto ausente que hay que
inventar». Ya no: **el juego de columnas se deriva del Protocolo §6.2–6.7 y de la matriz §5**, no se
inventa. La tabla **entra en el delta de esquema de M12.8a** (§5.71 en `PLAN-M12` §M12.8a).

**La tabla, propuesta columna por columna, con el pasaje que la funda:**

| Columna | Qué registra | Fundamento en el Protocolo |
|---|---|---|
| `hce_id` (o `ateneo_id`, XOR — §5.25) | de qué expediente / ateneo salió el dato | pertenencia |
| `destinatario_tipo` | a quién — **las categorías de actor de la matriz §5**: familia / tercero autorizado / INAU / MSP-BPS / Ministerio Público / Poder Judicial / dirección-gobierno / donante / UTEC-LIDIA | matriz §5 (filas de la tabla) |
| `destinatario_detalle` | nombre o referencia del destinatario concreto | §6.2 («indicando el alcance y la finalidad») |
| `alcance_dato` | **identificable** / **disociado-anonimizado** / **agregado** | §6.6 (informes a dirección, convenio y **donantes** *deben* ser disociados o anonimizados) · §6.7 (UTEC-LIDIA prioriza disociado/anonimizado) |
| `autorizacion_escrita` (bool) + `autorizacion_ref` | si hay autorización escrita del titular/representante y su referencia | §6.2 (terceros: «autorización expresa y por escrito») · §6.5 (traslado de HC: «previa autorización expresa») |
| `canal_formal` | por qué vía formal salió (Unidad Competente Territorial/Programática de INAU; canal de auditoría/habilitación de MSP-BPS; Dirección General para requerimientos judiciales) | §6.3 · §6.4 |
| `finalidad` / `motivo` | para qué se comunicó el dato | §8 («motivo de la consulta») · §4 (finalidad, minimización) |
| `fecha` | cuándo | §8 |
| `responsable_id` | quién hizo la divulgación | §8 («persona que accede») |
| `obs` | texto libre | — |

**Qué NO hace, dicho en claro.** **No modela un flujo de compartición.** Los guards —quién *puede*
divulgar según su rol (matriz §5), si un consentimiento *habilita* la salida, la compuerta «revisado por
dirección → entregado» de §5.40— son **M11.3**. `divulgacion` es **append-only por naturaleza**: registra
un **hecho** ocurrido, no una solicitud en trámite.

**Por qué acá y no como ajuste puntual: cuatro afirmaciones distintas de IPPU caen sobre este mismo
concepto ausente** — **§5.39 (I4)** fotos («guardar no requiere autorización; compartir sí»), **§5.45
(I10)** confidencialidad reencuadrada, **§5.40 (I5)** revisión de informes por dirección antes de
entregar, y **«a las instituciones se les manda un resumen, no el expediente»**. R0 midió que hoy el
modelo representa el **almacenamiento** y **no** la **divulgación** (una sola línea en `app/`, y es un
comentario). Es el momento barato por la misma razón que el IDEA anual: **0 routers, 0 schemas, 0
servicios**.

**Estado de §2.12.** **Decidido y agendado a M12.8a.** No cierra: lo que queda abierto es el **flujo** y
los **guards** (M11.3/M11.4). §2.12 se reescribe para reflejarlo.

### 5.72 §2.11 — el modelo de asignación técnico↔grupo entra en M12.8a de forma estructural; el vocabulario de roles queda como propuesta (2026-09-03, Lucas)

**⚠️ Leer la matriz §5 del Protocolo antes de derivar nada: la mayoría de sus filas NO son usuarios de la
aplicación.** Paciente, padres/tutores, adolescentes con autonomía progresiva, terceros autorizados,
INAU, MSP/BPS, Ministerio Público, Poder Judicial y los estudiantes/investigadores UTEC-LIDIA son
**destinatarios** gobernados por los procedimientos §6 — que es exactamente lo que `divulgacion` (§5.71)
registra. **Sólo un puñado de filas son personas que inician sesión.**

**Lista de roles de aplicación, derivada de la matriz, como PROPUESTA para que Lucas confirme en una
línea** (⚠️ **no se escribe en un CHECK como si estuviera cerrada**):

| Rol de aplicación propuesto | Pasaje de la matriz §5 que lo funda |
|---|---|
| **Equipo técnico-asistencial tratante** | fila «Equipo técnico-asistencial tratante … acceso completo al contenido clínico del/de los usuarios que atiende directamente» |
| **Otros técnicos de la institución, no tratantes** | fila «Otros técnicos … acceso restringido, únicamente mediante interconsulta / ateneo / pase de caso» (§5.70) |
| **Dirección / coordinación técnica-clínica** | fila «Dirección/coordinación técnica-clínica … acceso de supervisión clínica … con registro del motivo» |
| **Personal administrativo vinculado a la atención** | fila «Personal administrativo vinculado … datos identificatorios y logísticos … contenido clínico sólo … puntual» |
| **Dirección no técnica / administración / gobierno** | fila «Dirección no Técnica … **sin acceso al contenido clínico individual** … sólo información agregada, disociada o anonimizada» + Nota general + §10 |

⚠️ **Un sexto candidato, sin resolver:** «Estudiantes en formación, pasantes, investigadores (incl.
convenio UTEC-LIDIA)» tiene fila propia («acceso supervisado; datos preferentemente
disociados/anonimizados»). Puede ser un rol de aplicación supervisado o quedar como destinatario de
`divulgacion`. **Va a la lista de IPPU.**

**Medido contra el código:**
- **`profesional.rol`** hoy es `Mapped[str] = mapped_column(String(20), default="tecnico")` con
  `CheckConstraint("rol IN ('admin','tecnico')", name="rol_valido")` (`app/models/identidad.py:29` y
  `:35`; en la base, por la convención de nombres, la constraint es `ck_profesional_rol_valido`). **Dos
  roles fijos por CHECK, no una tabla.**
- ⚠️ **La conflación que ese CHECK esconde:** nuestro `admin` es el **ADMIN institucional que crea grupos
  y asigna técnicos** (§5.41 / I6), mientras que la **«Dirección no técnica»** del Protocolo **no tiene
  acceso al contenido clínico individual** (matriz §5, Nota general, §10). Si en el modelo son el mismo
  usuario, **el modelo contradice el Protocolo**. Se registra; **no se resuelve acá** — es diseño de
  M11.3 + Fase 4, con la lista de roles ya confirmada.
- **La demo trae un «perfil de área de Inclusión»** en su tablero, al lado de «coordinación» y «dirección
  técnica» — un rol que **no está** ni en la matriz §5 del Protocolo ni en nuestro CHECK. **Va a la lista
  de IPPU** como pregunta.
- **`grupo.tecnico1_rol` / `grupo.tecnico2_rol` YA EXISTEN.** Contra lo que la hoja esperaba: son
  `Mapped[str | None] = mapped_column(String(60))` (`app/models/identidad.py:127` y `:129`), con docstring
  que cita §5.2.3 (portabilidad). El Documento Técnico §3.1 los especifica como etiqueta de rol
  configurable por institución (IPPU: «Psicólogo/a» y «Maestro/a del grupo»), y **ya están modelados tal
  cual**. **El delta de M12.8a NO los agrega** — no hay nada que agregar.

**Qué entra en M12.8a, estructural:** una tabla **`tecnico_grupo`** N:M (`grupo_id`, `profesional_id`,
`rol` etiqueta, `desde`, `hasta`), **aditiva** — se agrega **al lado** de `grupo.tecnico1_id`/`tecnico2_id`,
que siguen siendo la fuente de verdad hasta que M11.3 conecte las lecturas. Esto le da **dónde vivir** a
las vigencias y cierra el lado *estructural* del residuo de §5.18 (técnico que cambia a mitad de año) sin
tocar permisos ni login.

**Qué NO entra en M12.8a:** el **vocabulario de roles**. `profesional.rol` y su CHECK de dos valores **no
se tocan**; la lista de cinco (o seis) queda como propuesta; el CHECK ampliado o la tabla `rol` de
consulta aterriza en **M11.3 / Fase 4** con la lista que Lucas confirme.

**⚠️ Esto agranda el alcance de M12.8, que el plan fijó como «una sola persona».** `tecnico_grupo` es una
tabla nueva + su seed + revisión de fixtures, encima del retiro de §VII (§5.59), los cinco nombres de
grupo (§5.61), `ateneo.observaciones` (§5.66) y la tabla `divulgacion` (§5.71). **M12.8a es ahora una
ronda de esquema sustancial, no una limpieza.** Se dice acá y no se deja crecer en silencio.

**§2.11 NO cierra** — la matriz de permisos es Fase 4. Se actualiza para reflejar lo decidido (la lista
propuesta, `tecnico_grupo` en M12.8a, la conflación `admin`, el perfil de Inclusión, y que `tecnico?_rol`
ya existen).

### 5.73 §1.15 — `inclusion` NO se anualiza; la pregunta se reformula alrededor de la bitácora (2026-09-03, Lucas)

**La evidencia.** **Nada** en las fuentes dice que la inclusión sea anual. El tablero de Inclusión del
Prototipo v4 lista indicadores **calculados desde fechas y desde la bitácora**, no desde una foto anual:
tasa de escolarización, distribución por tipo de centro, promedio de horas, casos en espera y tiempo de
ingreso, alerta de **>60 días sin gestión**, y articulaciones **por caso y por período**, descritos como
**insumo directo de la rendición a INAU**. Esa es la fuente de la decisión.

**Decisión.** `inclusion` **queda 0..1 por expediente, con su bitácora** (`UNIQUE(hce_id)`), y la
dirección reversible de **§5.51 (J2)** sigue en pie. **`anio` NO entra en M12.8a.**

**La pregunta reformulada, que reemplaza a la actual de §1.15:** ¿la `inclusion_bitacora` registra lo
suficiente para (a) reconstruir el estado a una fecha arbitraria y (b) calcular esos indicadores para un
período? **Respondida contra el código** (`app/models/inclusion.py`):

- **Columnas de `inclusion_bitacora`:** `id`, `inclusion_id` (→ `inclusion.id`, no `hce_id`), `fecha`
  (NOT NULL — cuándo ocurrió la gestión), `interlocutor` (NOT NULL), `rol` (null), `medio` (null), `tema`
  (NOT NULL), `contenido` (NOT NULL), `acuerdos` (null), `autor_id` (null), `registrado_en`. **Es una
  serie de *gestiones*, no de *transiciones de estado*.**
- **Las transiciones de estado NO se registran.** `inclusion.estado` y `inclusion.fecha_estado` son
  **columnas únicas mutables**: `fecha_estado` «se reescribe en cada cambio» (docstring del modelo). Lo
  mismo `centro`, `tipo_centro`, `dias_horas`, `modalidad`. **No hay tabla de historial de estado**, y
  `auditoria` —que sería el único rastro— hoy es **aspiración**: no hay `app/services/` que la escriba.

| Indicador del tablero | ¿Para un período? | ¿Reconstruir a una fecha pasada? |
|---|---|---|
| Tasa de escolarización | foto actual sí (desde `inclusion.estado`) | **No** — `estado` se pisa |
| Distribución por tipo de centro | foto actual sí | **No** — `tipo_centro` se pisa |
| Promedio de horas | **No** — `dias_horas` es **texto libre** («3 veces por semana · 2 horas»), sin descomponer | **No** |
| Casos en espera + tiempo de ingreso | «en espera» actual sí | **No** — hace falta *cuándo entró* y *cuándo salió* de «en espera»; `fecha_estado` sólo guarda la última |
| Alerta >60 días sin gestión | **Sí** — `max(inclusion_bitacora.fecha)` por ficha (el índice `ix_inclusion_bitacora_inclusion_fecha` existe para esto) | n/a |
| Articulaciones por caso | **Sí** — `count(inclusion_bitacora)` por ficha | n/a |
| Articulaciones por período | **Sí** — `count(...) WHERE fecha BETWEEN …` | n/a |

**Conclusión.** Para **un período** (indicadores de actividad: alerta 60 días, articulaciones por
caso/período) **sí alcanza**. Para **reconstruir el estado a una fecha arbitraria** (escolarización,
distribución por centro, horas, tiempo de ingreso) **no**, y el promedio de horas además está bloqueado
por el texto libre.

**Qué falta, como trabajo de M11.3/M11.4:**
- Un **historial de estado fechado** para `inclusion.estado` — tabla `inclusion_estado_historial`, o
  hacer `auditoria` real y consultable para `campo='estado'`. Necesario para escolarización histórica y
  tiempo de ingreso.
- Lo mismo para `centro`/`tipo_centro` si se quiere la distribución por tipo de centro **a lo largo del
  tiempo**.
- Un **campo de horas estructurado** (o aceptar que «promedio de horas» no es calculable y derivarlo
  aproximado).
- «Tiempo de ingreso» necesita las dos marcas —entró y salió de «en espera»— → depende del historial de
  estado.

**§1.15 NO cierra:** se reescribe alrededor de esta pregunta, con lo que falta anotado como M11.3/M11.4.
La confirmación de IPPU sigue en la lista (la de si necesitan «foto del año pasado» o les alcanza con «hoy
+ bitácora»), **pero ya no es candidata a M12.8a**.

### 5.74 §2.14 — el indicador de ateneos cuenta por `ateneo.fecha`, no por `anio_correlativo` (2026-09-03, Lucas)

El indicador institucional de **§5.46 (I11)** —8 ateneos al año, al menos 2 por grupo— **cuenta por
`ateneo.fecha`**: mide **actividad en un año**, y **§1.14 ya dejó fijado** que el filtro de la lista sigue
la **fecha del hecho**, no el correlativo (que es de registración y puede caer en otro año). El
`anio_correlativo` es del año en que se cargó el acta y no sirve para «cuántos ateneos hubo en 2026».

**Costo hoy: cero.** Es una consulta de **M11.3/M11.4**. El denominador («≥2 por grupo») usará los **cinco
nombres reales** una vez que **§5.61** se ejecute en M12.8a. **§2.14 sigue abierto** como trabajo de
construcción — ahora con su semántica fijada.

### 5.75 §2.3 — vocabulario de «fase» RATIFICADO como estaba redactado; §2.3 CIERRA (2026-09-03, Lucas)

**Qué ratifica, por nombre: §5.64 (L11)**, que decidió «fijar un vocabulario único» pero dejó la
redacción pendiente de Lucas. **La redacción se ratifica tal cual la propuesta borrador de §2.3:**

| Sentido | Término |
|---|---|
| backend 0–6 (infra → routers → Docker completo) | **etapa** (del backend) |
| etapas del convenio IPPU×UTEC | **etapa del convenio** |
| L1–L4 | **línea** (la *numeración* es §2.4 → §5.76) |
| M0–M12 (rondas de trabajo) | **ronda** |
| Documento Técnico (Fase 1/2 · A–D · «fase piloto») | **fase** — reservada **sólo** para esto, que es vocabulario de un documento normativo externo que no reescribimos |

**§2.3 CIERRA.** Apunta a esta entrada.

**Documentos que quedan por corregir — NO se corrigen en esta sesión** (es un pase mecánico aparte,
registrado como bullet en §6). L6 midió **~98 apariciones de «fase» en 17 archivos, cinco sentidos**.
Conteo por archivo (grep `\bfase`, insensible a mayúsculas), los que más pesan:

| Archivo | apariciones | Sentidos a renombrar |
|---|---|---|
| `handoff.md` | 48 | (1) etapa backend, (4) ronda, (5) se deja |
| `docs/markdown/Documento de trabajo.md` | 14 | material de fuente — **no se toca** (se cita, no se reescribe) |
| `docs/notas/puntos-a-validar.md` | 10 | (1), (5) |
| `implementacion/L1-hce-idea/backend/docs/esquema-datos-v2.md` | 9 | (1) etapa backend |
| `docs/planes/PLAN-modular-adaptacion-HCE-2026-07.md` | 9 | (1), (4) |
| `docs/planes/PLAN-M12-…-2026-08.md` | 3 | (1), (4) |
| `implementacion/L1-hce-idea/backend/README.md` | 2 | (1) |
| `README.md` · `CLAUDE.md` | 1 c/u | (2) etapa del convenio |

(Los `docs/prompts/*` y `docs/notas/relevamiento-…` son registro histórico y **no se editan**.)

### 5.76 §2.4 — L1 = HCE es la numeración oficial de las líneas; §2.4 CIERRA (2026-09-03, Lucas)

**L1 = HCE + IDEA + analítica** es la numeración oficial, **consistente en todo el material técnico**: la
presentación 13.05.2026, la demo y el **Documento Técnico** la usan. Lo confirma §5.1.1 y el propio §7
(«el foco L1=HCE es consistente en todo el material técnico»).

**§2.4 CIERRA.** Apunta a esta entrada.

**Documentos que divergen — NO se corrigen acá**, van al mismo pase mecánico que §5.75 (bullet en §6): el
**`docs/markdown/Documento de trabajo.md`** y el **cuestionario Q47** usan numeraciones distintas de las
líneas. Son material de fuente: se **anota la divergencia**, no se reescribe la fuente; donde el repo cite
«Línea N» se usa la numeración oficial.

### 5.77 Se retira la etiqueta `(L#)` de las entradas de §5 (2026-09-03, Lucas)

Las decisiones se citan **sólo por `§5.NN`**, que ya es la clave estable y append-only. **Las etiquetas
`(D#)`, `(I#)`, `(J#)`, `(K#)`, `(L#)` ya escritas se dejan como están** — están citadas en commits
(`af98184`, `cd98f67`) y en referencias cruzadas, y renumerar rompería enlaces. **Las entradas nuevas no
llevan etiqueta.** La línea de decodificación —qué contaba la etiqueta (decisiones dentro de una serie) y
qué contaban los nombres de sesión (sesiones), y que las dos numeraciones divergieron— está **al inicio de
§5**.

### 5.78 Lucas es el dueño del contacto con IPPU; las preguntas se consolidan en un solo documento (2026-09-03, Lucas)

**Lucas queda como responsable del contacto con IPPU.** Todas las preguntas que hoy viven repartidas se
consolidan en **`docs/notas/preguntas-ippu.md`** (creado en esta sesión), que es **la** lista para el
próximo contacto. Consolida: `puntos-a-validar.md` §1 (entradas abiertas) y §3 (los dos supuestos sin
confirmar), `consulta-a-ippu.md`, `respuestas-reunion-ippu-2026-08-21.md` §16 (los 12 bloques sin
respuesta + pendientes), `handoff.md` §6, y los ítems **⚠️ CONFIRMABLE** (§5.38 consentimiento;
§5.58/§5.63 la reversión del ateneo de grupo). Agrupa por: **bloquea ahora** / **bloquea M11.3** / **se
lleva para el registro**. **No inventa preguntas y no descarta ninguna**; el documento dice qué fuentes
consolidó y el conteo por fuente.

## 5.79 → 5.80 · Sesión M12.8a-3 — `tecnico_grupo` a M11.3, `divulgacion` construida (2026-09-03, Lucas)

> **Contexto.** M12.8a-1 dejó tres deltas de esquema hechos y las **dos tablas nuevas de la ronda**
> pendientes. Entre esa sesión y ésta hubo una **sesión de diseño (M12.8a-2)** que **no dejó rastro
> por diseño** —no escribió esquema, seed ni test, y no tiene commit ni entrada de §13 propia, igual
> que pasó con L8—: su informe es la fuente de las dos decisiones de abajo, y esta sesión lo registra
> en §13. Lucas confirmó antes de la corrida: **`tecnico_grupo` se difiere a M11.3** (D-A) y
> **`divulgacion.hce_id` es `ON DELETE CASCADE`**, con la contra-argumentación registrada (D-B).

### 5.79 `tecnico_grupo` se difiere a M11.3 — se deroga la *ubicación* de §5.72, no la decisión de construirla (2026-09-03, Lucas)

**Qué deroga, por nombre.** §5.72 puso `tecnico_grupo` como delta **estructural de M12.8a** («una
tabla `tecnico_grupo` N:M … entra en M12.8a, estructural»). Esta entrada **deroga esa ubicación**: la
tabla se construye en **M11.3**, junto con el servicio de asignación que la va a leer. **No** cambia lo
que §5.72 decidió sobre el *fondo* —hace falta modelar la asignación técnico↔grupo con vigencias— ni
toca su lista propuesta de roles de aplicación, que sigue siendo propuesta para Lucas.

**Por qué se mueve (medido en la sesión de diseño M12.8a-2):**
- **No tiene consumidor hasta que exista el servicio de asignación**, que es M11.3. Una tabla
  estructural sin nada que la escriba ni la lea es deuda que hay que mantener sin réditos — el mismo
  criterio con el que `ateneo.participantes` **no** pasa a relación hasta M11.3 (§5.70).
- **`grupo.tecnico1_id` / `tecnico2_id` siguen siendo la fuente de verdad**, y **`tecnico1_rol` /
  `tecnico2_rol` ya existen** (`String(60)` nullable, `app/models/identidad.py:127` y `:129`, decisión
  §5.2.3). Hoy **nada lee una historia** de asignaciones: no hay endpoint, servicio ni pantalla que la
  consulte.
- **Su forma está condicionada a dos preguntas sin respuesta de IPPU:** `docs/notas/preguntas-ippu.md`
  **B5** (los roles, ¿etiqueta libre o lista cerrada? ¿hay un referente por NNA?) y **B6** (cuando un
  técnico cambia de grupo a mitad de año, ¿necesitan ver quién estuvo antes?). Construir la tabla ahora
  es fijar en el esquema una forma que la respuesta puede desarmar.
- **Su único invariante real —a lo sumo dos asignaciones vigentes por grupo, sin solaparse en el
  tiempo— no se puede expresar en la DDL** sin una `EXCLUDE` constraint con `btree_gist`, que sería
  **la primera extensión de Postgres del repo**. Sumar una extensión es una decisión de M11.3, no un
  efecto colateral de una ronda de cierre, y §5.2.2 cierra la otra vía (los triggers están prohibidos).
- **No hay datos de producción.** Construirla más tarde cuesta **un archivo de migración incremental**,
  no una migración de datos. **El cierre de la ronda no es una fecha límite.**

**La forma que la sesión de diseño especificó — se registra como PUNTO DE PARTIDA para M11.3, no como
algo construido:**

```
tecnico_grupo
  id             PK serial
  grupo_id       FK grupo(id)        ON DELETE CASCADE   -- es parte de la organización del grupo
  profesional_id FK profesional(id)  ON DELETE RESTRICT  -- dar de baja a alguien no borra el historial
  rol            text, SIN CHECK     -- etiqueta configurable (§5.2.3); el vocabulario es M11.3/Fase 4 (§5.72)
  desde          date NOT NULL       -- intervalo semiabierto [desde, hasta)
  hasta          date NULL           -- NULL = asignación vigente
  UNIQUE (grupo_id, profesional_id, desde)
  CHECK (hasta IS NULL OR hasta > desde)
```

El invariante de «a lo sumo dos vigentes, sin solape» **no** está en este esbozo: es lo que necesita
`EXCLUDE` / `btree_gist` y lo resuelve M11.3.

**Corrección a una lectura propia, verificada contra el código.** En la revisión se dijo que el
invariante interjueces (dos evaluadores distintos) tenía que apoyarse en `grupo`. **No es así:** vive
**a nivel de instrumento**, en el CHECK `evaluadores_distintos` de `idea` y `protocolo` sobre
`evaluador_t1_id` / `evaluador_t2_id` (`app/models/modulos.py:264-266` y `:377-379`, vía
`EvaluadoresMixin`). Y el propio **Documento Técnico** ya lista `otros_tecnicos[]` en `grupo` (esquema
conceptual §7, `docs/markdown/1_documento-tecnico-utec-lidia.md:118`; la entidad en §3.1 habla de «dos
evaluadores por grupo»). O sea: `grupo` **ya tiene** dónde nombrar a los otros técnicos el día que
haga falta, y el control de confiabilidad no depende de esta tabla.

**Actualizaciones que arrastra:** `docs/notas/puntos-a-validar.md` §2.11 (sacar `tecnico_grupo` de
«M12.8a agrega, estructural» → M11.3) y el residuo de §5.18 anotado en §2.11 y en §6 (el cambio de
técnico a mitad de año: la tabla que le da dónde vivir es M11.3, no M12.8a).

### 5.80 `divulgacion` — la tabla como quedó construida en M12.8a-3 (2026-09-03, Lucas)

**Qué es.** La primera tabla del esquema que representa un **acto de divulgación** —a quién salió un
dato del expediente, por qué, con qué alcance y bajo qué autorización—. §5.71 la decidió, la agendó y
derivó su juego de columnas del Protocolo de acceso; esta entrada registra **cómo quedó** al
construirla, con las diferencias respecto de lo diseñado y por qué.

**La tabla, columna por columna:**

| Columna | Tipo / regla | Procedencia |
|---|---|---|
| `id` | PK serial | — |
| `hce_id` | FK `hce_diurna(id)` **ON DELETE CASCADE**, nullable, indexada | pertenencia; ver la contra-argumentación abajo |
| `ateneo_id` | FK `ateneo(id)` ON DELETE CASCADE, nullable, indexada | §5.25 (un dato puede salir de un ateneo institucional) |
| `documento_id` | FK `documento(id)` **ON DELETE RESTRICT**, nullable, indexada | **agregado en esta sesión** — ver abajo |
| `destinatario_tipo` | NOT NULL · CHECK desde `DIVULGACION_DESTINATARIOS` vía `_dominio()` | matriz §5 (categorías de actor) |
| `destinatario_detalle` | texto, nullable, **sin CHECK** | §6.2 («indicando el alcance y la finalidad») |
| `alcance_dato` | NOT NULL · CHECK sobre `identificable` / `disociado` / `agregado` | §6.6 · §6.7 |
| `autorizacion_escrita` | boolean NOT NULL · `server_default false` | §6.2 · §6.5 |
| `autorizacion_documento_id` | FK `documento(id)` ON DELETE RESTRICT, nullable | §6.2 / §6.5 (la autorización escrita, cuando está cargada) |
| `autorizacion_ref` | texto, nullable | §6.2 / §6.5 (referencia cuando no hay documento cargado) |
| `canal_formal` | texto, nullable | §6.3 · §6.4 |
| `finalidad` | NOT NULL · CHECK `~ '[^[:space:]]'` | §8 («motivo de la consulta») · §4 (finalidad, minimización) |
| `fecha` | date NOT NULL, indexada | §8 |
| `responsable_id` | FK `profesional(id)` **ON DELETE RESTRICT**, NOT NULL | §8 («persona que accede») |
| `obs` | texto, nullable | — |

**CHECKs de forma:** `num_nonnulls(hce_id, ateneo_id) <= 1` — **`<= 1`, no `= 1`**: el informe
agregado de §6.6 (una estadística de todo el servicio, «de modo que sea imposible identificar a un
usuario») **no pertenece a ningún expediente ni ateneo** y tiene que poder registrarse con las dos FK
en NULL. Más los tres CHECK de dominio (`destinatario_tipo`, `alcance_dato`, `finalidad`).

**`hce_id` CASCADE, con la contra-argumentación registrada (D-B).** `divulgacion` cuelga del
expediente como **contenido** —es sobre los datos de *ese* expediente— y se va con él (`ON DELETE
CASCADE`), igual que `severidad_dsm`, `inclusion` y `pai`. **La contra-argumentación, para que quede
escrita:** un registro de divulgación es rastro de rendición de cuentas —«se comunicó tal dato a INAU
el tal día»— y ese hecho puede importar *después* de que el expediente físico se borre; por eso
`ateneo` y `auditoria` **no** cascadean. Se eligió CASCADE igual porque (a) un DELETE físico de
`hce_diurna` es una corrección administrativa o un borrado por protección de datos —la baja normal es
lógica (`activo` + `fecha_baja`)— y en un borrado por protección de datos en general se quiere que los
registros sobre esa persona también se vayan; (b) CASCADE → RESTRICT es una migración sin pérdida y al
revés no (mismo argumento que M12.4 y `ateneo`). El alcance institucional usa RESTRICT donde el objeto
referenciado **no** es del expediente (`documento_id`, `autorizacion_documento_id`, `responsable_id`).

**`documento_id` — lo que el diseño no tenía, y por qué se agregó.** La tabla registraba *a quién*,
*por qué* y *con qué alcance*, pero no **qué salió**. El Protocolo §6.6 gobierna «todo **informe**
destinado a…» y §6.5 el traslado de la HC completa: **el objeto de la divulgación es parte del
hecho**. Es nullable porque no todo lo que se divulga es una fila de `documento` cargada (un informe
agregado al Consejo puede no serlo) y **RESTRICT** porque un documento referenciado por un registro de
divulgación no puede desaparecer. **No** lleva CHECK que lo ate a `alcance_dato`: eso es territorio de
guard.

**Los dos CHECK cruzados que NO se pusieron.** La sesión de diseño marcó dos como inferencia propia, y
esta sesión los dejó afuera a propósito, para que nadie los re-derive como un olvido: (1)
`alcance_dato <> 'agregado' OR hce_id IS NULL` y (2) «si `autorizacion_escrita` es verdadero, entonces
`autorizacion_documento_id` o `autorizacion_ref` tiene que estar». Los dos son **guards de M11.3** —
§5.71 difiere los guards explícitamente—.

**Regla de frontera con `registro_organismo`, en prosa (no en el esquema).** `registro_organismo`
registra **envíos a INAU y gestiones ante BPS** como parte de HCE-ORG: el trámite que la institución
sigue con el organismo. `divulgacion` registra el **acto de comunicar un dato a un tercero** bajo el
régimen del Protocolo. Un envío a INAU puede generar filas en las dos tablas —una en
`registro_organismo` (el trámite) y otra en `divulgacion` (qué se comunicó, con qué alcance, con qué
autorización)— y **está bien que así sea**: son dos afirmaciones sobre sujetos distintos. **No hay
CHECK ni FK entre ellas**; la coordinación es un guard de M11.3. La frontera es escrita, no esquema.

**Append-only es una postura, no una restricción.** No hay endpoint de UPDATE ni DELETE sobre
`divulgacion`, igual que `auditoria`. En despliegue se recomienda además `REVOKE UPDATE, DELETE ON
divulgacion FROM rol_app` — un permiso, no lógica de negocio, así que no contradice §5.2.2 (anotado
para M11.4 / Fase 6). **Sin trigger.**

**Sin seed.** La tabla nace vacía (§5.71).

**Qué NO hace.** No modela un flujo de compartición: quién *puede* divulgar según su rol, si un
consentimiento *habilita* la salida, la compuerta «revisado por dirección → entregado» de §5.40 —
todo M11.3/M11.4, junto con §2.13. `divulgacion` registra un **hecho ocurrido**, no una solicitud en
trámite.

**Dos preguntas que abrió la sesión de diseño**, ahora en `docs/notas/preguntas-ippu.md` (bloque B):
si un registro individual **anonimizado** necesita distinguirse de una **estadística puramente
agregada** en el log de divulgación; y si **dar a la familia una copia de la HC del propio NNA** es
una divulgación o sólo una entrada de acceso (Ley 18.335 Art. 18 lit. A es un derecho distinto del
lit. D).

### 5.81 El **documento** `esquema-datos-v2.md` pasa a v3; el **archivo NO se renombra** (2026-09-03, Lucas)

**Decisión.** `backend/docs/esquema-datos-v2.md` incorpora un **encabezado de versión** (versión del
documento, fecha, ronda que refleja) y un **registro de cambios**, y su versión pasa a **v3**. **El
nombre del archivo sigue siendo `esquema-datos-v2.md` y no cambia.**

**Por qué el archivo no se toca.** «Esquema v2» nombra la **arquitectura del backend v2** en todo el
repo —no un número de ese texto—, y en particular es el nombre de la migración inicial única
`559b1a79cb77_esquema_v2_inicial_m12_8a.py`. Renombrar el `.md` a `-v3` implicaría un esquema v3 que no
existe (el esquema es el mismo; lo que avanzó es la ronda de sub-módulos M12). Lo que se versiona es el
**documento**, que venía con la cabecera de estado congelada en M12.3 (34 tablas) mientras el modelo ya
tenía 51.

**Aclara por nombre tres lugares que instalaron por escrito la expectativa «→ v3»**, para que nadie
salga a buscar un `esquema-datos-v3.md`: (a) la **cabecera de `handoff.md`** («Queda **M12.8b** (docs:
`esquema-datos-v2.md` → v3)»); (b) **`CLAUDE.md:167`** (mismo texto); (c) **`esquema-datos-v2.md` líneas
3-8** («Este documento pasa a **v3** en M12.8»). Los tres se leen ahora como **versión del documento**,
no como cambio de archivo. El pase mecánico de esas menciones en `CLAUDE.md` y la cabecera queda para
**M12.8b-2** (junto con el resto de la sincronización de prosa).

**Costo de un renombrado, medido esta sesión (`git grep esquema-datos-v2`):** **79 referencias en 24
archivos**. **8** están en `app/` y `tests/` (rutas importables y docstrings de test:
`app/models/__init__.py`, `identidad.py`, `modulos.py`, `ateneo.py`, `severidad.py`,
`app/core/constantes.py`, `app/main.py`, más `tests/test_m12_{ateneos,consenso,severidad}.py` — 11 hits
en esos 8 archivos), el resto en Markdown (`handoff.md` 29, `PLAN-M12` 5, los dos `README.md`,
`CLAUDE.md`, `docs/notas/*`, `docs/prompts/*`). Un renombrado obligaría a barrer las 24 y arriesgar
enlaces rotos en registros congelados; no lo paga.

## 5.82 → 5.83 · Sesión M12.8b-2b — la cabecera la mueve toda sesión; los barridos dejan evidencia (2026-09-09, Lucas)

> **Contexto.** Las dos entradas de abajo son de Lucas, tomadas con el acuerdo de los tres integrantes
> del equipo. Esta sesión sólo las **transcribe** (§12.6: la decisión se escribe antes del cambio). Salen
> de un patrón que se repitió tres veces en las sesiones de sincronización de prosa (M12.8b-1, M12.8b-2):
> un registro dice «lo hicimos» y el código —o la cabecera, o una lista de arrastre— dice otra cosa.
> Ninguna reabre §5.34 ni la deroga: la acotan. Se usan los dos números libres siguientes a §5.81,
> medidos en el archivo.

### 5.82 La cabecera de `handoff.md` la actualiza **toda** sesión que escribe una entrada de §13, incluidas las de sólo documentación (2026-09-09, Lucas)

**Qué se decide.** La cabecera —«Última actualización» más el resumen de estado de las primeras
viñetas— es lo primero que lee cualquier sesión y lo que una sesión nueva cree con menos reservas. Hasta
ahora las sesiones de sólo documentación la dejaban quieta por precedente (M12.8b-1 no la tocó; M12.8b-2
siguió ese precedente y lo marcó), y así la cabecera podía quedar varias sesiones atrás del registro
mientras se presentaba como el estado.

**Desde ahora:** **cualquier** sesión que agregue una entrada a §13 actualiza también la cabecera —la
fecha, el nombre de la sesión y las cifras medidas—. Si una sesión no cambia ninguna cifra, igual mueve
la fecha y se nombra.

**Alcance.** Lo acuerdan los tres integrantes del equipo. **Sustituye el precedente** de las sesiones de
documentación, no una decisión escrita. Esta misma sesión la aplica (§13).

### 5.83 Los registros de sesión sobredeclaran lo que se barrió; un barrido tiene que dejar evidencia medida (2026-09-09, Lucas)

**Qué se decide.** Se registraron tres instancias del mismo defecto dentro de una sola sesión, y nada en
el repo lo detecta:

1. La entrada de §13 de **M12.8a-1** afirma que barrió cuatro archivos de `app/` por el comentario «4
   grupos por color». M12.8b-2 midió que `seed_catalogos.py` y `catalogos.py` estaban limpios, que el
   barrido tocó un comentario de columna en `identidad.py` y **se salteó la docstring de la clase
   `Grupo`**, y que `ateneo.py` seguía con «Grupo Celeste de 2025».
2. El pendiente de M12.8b-2 en §6 listó los archivos que arrastró y **omitió `handoff.md` §0 punto 5**,
   que llevaba la misma cifra vieja que ese pendiente existía para arreglar.
3. La propia lista «actualizaciones que arrastra» de §5.79 nombró `puntos-a-validar.md` §2.11 y §6 y
   **omitió `preguntas-ippu.md` B5/B6**.

**La regla, desde ahora:** cuando una sesión afirma haber barrido N archivos o N ocurrencias, su entrada
de §13 registra **el comando y su resultado**, no la afirmación; y cuando una decisión declara qué
arrastra, esa lista se produce con `grep`, no de memoria.

**Qué no cambia.** No reabre el pendiente de §5.34 (que `verificar_estado.py` compare prosa) — **acota**
lo que ese chequeo tendría que atrapar, y ese pendiente queda abierto y sin dueño.

## 5.84 → 5.85 · Sesión M12.8b-4 — la bitácora sale de `handoff.md`; F1-nav3 se declara perdida (2026-09-09, Lucas)

> **Contexto.** Las dos entradas son de Lucas, con el acuerdo de los tres integrantes del equipo, y esta
> sesión sólo las **transcribe** (§12.6: la decisión se escribe antes del cambio). Número libre medido en
> el archivo: la última entrada era §5.83.

### 5.84 La bitácora (§13) se muda a `docs/bitacora.md`; `handoff.md` queda como estado, decisiones y pendientes (2026-09-09, Lucas)

**Qué se decide.** `handoff.md` llegó a **5.081 líneas** y del orden de **140k–160k tokens** (≈ 537 KB,
~79.000 palabras), y `CLAUDE.md` manda **leerlo entero al arrancar cualquier sesión**. **§13 es el
39,6 % de ese peso** y es un **registro**: hace falta para reconstruir *por qué* se hizo algo y **nunca**
para *hacer* el trabajo. Dos sesiones seguidas cuyo propósito declarado era higiene documental
(**M12.8b-2 y M12.8b-2b**) **sumaron 279 líneas netas** al archivo, porque §13 es append-only y **nada
sale nunca**. Por eso **§13 se muda a `docs/bitacora.md`**, completa y sin modificar.

**Las cinco cláusulas —importan más que la mudanza:**

- **(i)** `handoff.md` **conserva el encabezado `## 13. Bitácora de sesiones`** como stub de redirección,
  y `docs/bitacora.md` **conserva ese mismo encabezado de sección**, para que **toda cita «§13» del repo
  —unas 100, casi todas en `docs/prompts/`— siga siendo verdadera** y no se reescriba ninguna.
- **(ii)** Desde ahora `handoff.md` es **estado, decisiones y pendientes**; `docs/bitacora.md` es **el
  registro**. Cada sesión escribe su entrada en el archivo nuevo.
- **(iii)** **§5.82 sigue rigiendo sin cambios:** una sesión que escribe una entrada de bitácora —ahora
  en `docs/bitacora.md`— **también actualiza la cabecera de `handoff.md`**. La regla se escribió sobre el
  acto, no sobre el archivo.
- **(iv)** La regla 3 viaja con el archivo: **`docs/bitacora.md` nunca se corrige**, cifras viejas
  incluidas.
- **(v)** Esto **no decide nada sobre §5**, que se queda en `handoff.md`. Su mudanza se **mide** aparte
  en esta sesión y se decide después.

### 5.85 La deuda de registro de F1-nav3 se declara PERDIDA y su pendiente se cierra (2026-09-09, Lucas)

**Qué se decide.** F1-nav3 (tablero de Inclusión, 2026-08-18, commit `648cb04`, sobre la rama
`demo/F1-navegacion` —mergeada por `d94b102` y borrada de los dos remotos—) **nunca tuvo entrada de
§13**. Tres sesiones seguidas la reportaron abierta; la rama ya no existe; pasaron tres semanas; quien la
hizo no la escribió. El equipo la declara **PERDIDA** y **cierra el pendiente**. **No se va a escribir
una entrada a posteriori por reconstrucción:** un registro armado por inferencia es peor que un hueco
reconocido —es el argumento entero de §5.83—. Lo que queda como registro es **el propio commit
`648cb04`** y **el bullet de F1-nav en §6**. Este pendiente **cierra no por haberse hecho, sino por
declaración** — la misma forma que §5.53 (el Google Doc que se cerró porque no había destino).

---

## 5.86 → 5.88 · Sesión M12.8b-3a — tres respuestas de Lucas a BLOQUE 6.4 de R1 (2026-09-11, Lucas)

> **Contexto.** Las tres entradas son decisiones de Lucas, respuesta a las preguntas 3, 4 y 7 de
> `docs/notas/relevamiento-M11.3-2026-09-10.md` §6.4 (R1). Esta sesión sólo las **transcribe** (§12.6: la
> decisión se escribe antes del cambio). Las preguntas 1, 2, 5 y 6 de ese mismo bloque **no** se deciden
> acá. Número libre medido en el archivo: la última entrada era §5.85.

### 5.86 El motor de flujo arranca con default **409 duro** (2026-09-11, Lucas)

**Qué se decide.** Responde a la pregunta 3 de R1 §6.4. R1 (BLOQUE 2.1, R1-03) encontró que el mecanismo
de flujo (el campo `excepcion` JSONB) sirve tanto para un bloqueo duro como para una habilitación
registrada, y que sólo faltaba elegir el default. El default es **409 duro**: se respetan las reglas del
esquema y su integridad, y una escritura fuera de secuencia se **rechaza** en vez de registrarse como
excepción. Esto **no** cierra la pregunta B4 pendiente con IPPU — R1 la clasificó como «no bloquea, pero
mejor responderla antes de fijar el comportamiento». Si la respuesta de IPPU exige una habilitación
registrada, el mecanismo ya existe y el default se suaviza entonces, en una entrada nueva.

**Costo aceptado.** Un 409 que resulte equivocado le hace perder trabajo a mitad de sesión a un técnico.

### 5.87 `tecnico_grupo` se parte: la tabla se construye, las reglas de asignación esperan (2026-09-11, Lucas)

**Qué se decide.** Responde a la pregunta 4 de R1 §6.4. §5.79 difirió `tecnico_grupo` a M11.3 y dejó su
esbozo como punto de partida; B5 y B6 siguen sin responder. El trabajo se parte en dos:

- La **tabla N:M en sí** es estructural, sus columnas no están en discusión, y **se construye en M11.3**.
- El **servicio de asignación y sus reglas** — quién puede ser asignado, qué significa un `rol`, si hace
  falta historia — dependen de B5/B6 y **esperan**.

⚠️ El invariante «a lo sumo 2 asignaciones vigentes por grupo, sin solaparse» **no se decide acá y no se
construye acá**: ver §6 y el hallazgo del Paso 2(b) de esta sesión (`docs/bitacora.md`, entrada
M12.8b-3a), que registra por qué ese invariante, tal como está redactado en §5.79, no es expresable con un
solo `EXCLUDE`.

### 5.88 El registro de accesos con motivo (§2.17) es explícitamente Fase 4 (2026-09-11, Lucas)

**Qué se decide.** Responde a la pregunta 7 de R1 §6.4. §2.17 exige registrar quién accedió a una historia
clínica y por qué. Es un requisito **legal**, no una comodidad. Depende del modelo de usuarios y
autenticación, que es **Fase 4**, así que **no se diseña en M11.3**. Se deja explícito en vez de quedar
implícito precisamente para que no se evapore: se registra en §6 como pendiente nombrado con **Lucas**
como responsable, y cualquier diseño de Fase 4 que lo omita está incompleto.

---

## 5.89 → 5.91 · Sesión M12.8b-3a-bis — tres decisiones de Lucas que no habían llegado al repo (2026-09-11, Lucas)

> **Contexto.** Las tres entradas son decisiones de Lucas, tomadas en la misma ronda que produjo §5.86–5.88
> pero que quedaron sólo en un chat y nunca llegaron al repo — el patrón de §5.83 aplicado al propio método
> de trabajo. Esta sesión sólo las **transcribe** (§12.6). Número libre medido en el archivo: la última
> entrada era §5.88.

### 5.89 `btree_gist` NO entra — el invariante de `tecnico_grupo` queda indefinido hasta B5/B6 (2026-09-11, Lucas)

**Qué se decide.** §5.79 dejó planteado que el invariante «a lo sumo dos asignaciones vigentes por grupo,
sin solaparse» requería un `EXCLUDE` con `btree_gist` —la primera extensión de Postgres del repo— y lo dejó
como decisión de M11.3. R1 arrastró la afirmación (BLOQUE 3.2, 6.1, 6.3, pregunta 5). La decisión es que
**`btree_gist` NO entra, ni ahora ni como pendiente de M11.3**, y el motivo no es de costo: el invariante,
tal como está redactado, no es expresable con el mecanismo que se le proponía. Un `EXCLUDE` se evalúa **de a
pares**, así que `EXCLUDE (grupo_id WITH =, periodo WITH &&)` expresa «a lo sumo UNA asignación vigente», no
dos, y no hay una formulación de `EXCLUDE` que exprese «a lo sumo 2» directamente. Un discriminador de slot
sí daría exactamente dos, pero el propio esbozo de §5.79 define `rol` como texto libre sin CHECK, así que
tres filas con tres etiquetas distintas lo satisfarían igual. Además `grupo.tecnico1_id`/`tecnico2_id`
siguen siendo la fuente de verdad (§5.79), así que el «a lo sumo 2» ya está garantizado estructuralmente por
que `grupo` tiene exactamente dos columnas; `tecnico_grupo` es la **historia**, y una historia tiene que
poder registrar a A en marzo, a B en junio y a A saliendo — exactamente lo que una restricción de no-solape
prohibiría. **El invariante queda INDEFINIDO hasta que B5** (roles: ¿lista cerrada o etiqueta libre?) **y
B6** (¿hace falta historia de asignaciones?) se respondan, porque son las que determinan si la tabla tiene
slots nombrados o es un N:M plano, y por lo tanto qué invariante le corresponde. Si las respuestas producen
slots nombrados, `EXCLUDE (grupo_id WITH =, slot WITH =, periodo WITH &&)` con `btree_gist` pasa a ser la
herramienta correcta y entra entonces, ya bien planteado. Se registra como pendiente nombrado para la sesión
que procese B5/B6.

⚠️ Esto **no corrige** §5.79 ni R1 —los dos son registros—: reemplaza el planteo de §5.79 **hacia adelante**.
M12.8b-3a ya dejó registrado dónde propagó la afirmación sin verificar.

### 5.90 La administración (§2.8/§2.9/§2.11) es su propio sub-módulo, después del núcleo de M11.3 (2026-09-11, Lucas)

**Qué se decide.** R0 había marcado `puntos-a-validar.md` §2.8 («no hay forma de abrir un año nuevo de
grupos») como «⚠️ AHORA BLOQUEA». R1 lo remidió y la etiqueta no se sostiene: la propia letra chica de §2.8
(`puntos-a-validar.md:735`) ya decía que no bloquea nada hoy, los cinco grupos reales están sembrados con
`anio=2026`, y el renombre 4→5 lo hizo M12.8a-1 (§5.61). Lo que queda de §2.8 es **crear y renombrar grupos
DESDE LA APLICACIÓN**, que R1 ubica en la misma pantalla que §2.9 (catálogos de talleres y centros
educativos) y §2.11 (usuarios). La decisión: **esa pantalla es su propio sub-módulo, construido DESPUÉS del
núcleo de M11.3.** Es administración, no trabajo clínico, y depende del modelo de usuarios y roles, que es
Fase 4. R1 (BLOQUE 5.1) midió que ninguna de las doce preguntas del bloque B bloquea el núcleo de M11.3
(secuencia, firma=bloqueo, validaciones §4.3, baremo desde `pct`, fotos §8.4, histórico inmutable, auditoría
de campo, guard de consenso D7), así que el núcleo arranca sin esto. Se deja anotado qué tiene que llevar el
sub-módulo cuando se construya: alta/renombre de grupo, asignación de técnicos, administración de catálogos
(§2.9), usuarios (§2.11), y entradas de HCE-LOG con `hce_id NULL` para acciones que no cuelgan de un NNA. Su
número y su ubicación relativa a M11.4 no se deciden acá.

⚠️ R0 es un registro y no se corrige; esto reemplaza su etiqueta hacia adelante.

### 5.91 I1 (`idea.anio`) aterriza ANTES de abrir `app/services/` (2026-09-11, Lucas)

**Qué se decide.** §5.35 puso la puerta de I1 antes de M11.3 y §5.36 estableció que el IDEA es anual, pero
I1 seguía siendo la única entrada viva bajo «DECIDIDO, SIN IMPLEMENTAR». El BLOQUE 4 de R1 remidió el costo
contra `Base.metadata` y los tests, y esta sesión lo verificó de nuevo: `idea` tiene **23 columnas** y no
tiene `anio`, **0 UNIQUE** sobre `hce_id`, **1 FK entrante** (`puntuacion_idea`, 0 a reconectar), **9**
construcciones `Idea(` en tests (grep exacto, no substring) y **0** romperían con `anio` nullable — puramente
aditivo. También confirmó que el guard «qué IDEA rige a la fecha» **NO SE PUEDE ESCRIBIR** sin la columna, y
que §5.8 había sobreestimado el costo (`idea` ya era 1:N sin UNIQUE sobre `hce_id`). Decisión: **la mitad de
backend de I1 aterriza como trabajo propio, ANTES de abrir `app/services/`**, y se lleva consigo la
corrección de la regla del Δ en `esquema-datos-v2.md` §4 fila 4 y `backend/README.md:131`, ya registrada en
§6 como su prerrequisito nombrado (R1-01).

Dos cosas quedan explícitamente FUERA de I1, para que no se absorban por error: **(a)** la mitad de demo —17
usos directos + 1 indirecto en 6 módulos, medido por R1— va a la ronda de demo; **(b)** la reformulación de
«la vigente es la de mayor `fecha_consenso`» que §5.36 asignó a M11.3 se queda asignada ahí, porque depende
de B2(b) y B10, que IPPU no respondió. I1 agrega la columna y conserva el marcador en
`app/models/modulos.py`; no reescribe la regla.

### 5.92 El Prototipo v4 y la demo v4.1 dejan de ser fuentes normativas (2026-09-16, Lucas)

§5.10 puso al Prototipo v4 en precedencia 1, por encima del Documento Técnico, y toda la ronda M12 se hizo
conforme a eso. Dos hechos posteriores le sacan esa base. **§5.37** encontró relleno generado dentro del
propio prototipo, leído como fuente — los cuatro nombres de grupo por color. Y en septiembre se confirmó
que **Fernando Sierra genera estos artefactos con IA**: tanto el Prototipo v4 como el «Catálogo de
puertas» de la línea L3. Prototipo y demo son entonces dos artefactos del mismo autor y el mismo método,
no una fuente y su versión mejorada.

**Decisión.** El Prototipo v4 y la demo v4.1 pasan de **especificación** a **insumo**: se consultan, se
extrae información útil, y **no se modela ni se siembra nada sólo porque aparece ahí**. Normativo es lo
que IPPU dijo sobre sí misma — el acta de la reunión del 2026-08-26, el cuestionario respondido por
escrito el 15/06, el Protocolo de acceso y resguardo, el Manual institucional y el Documento Técnico. El
desarrollo avanza desde lo que sabemos y tenemos documentado sobre cómo trabaja IPPU y qué quiere.

**Método de validación.** Se valida contra IPPU, no contra artefactos. Cuando algo funciona, se les manda
para que lo prueben, y su devolución vuelve. La devolución es fuente; el prototipo no.

**Alcance del 26/11.** La primera línea (HCE) vence el 26/11 como **prototipo funcional y presentable SIN
datos reales** — no listo para producción. Consecuencias a registrar: §2.17 (registro de accesos con
motivo) es requisito para producción con historias clínicas reales, no bloqueante para el 26/11; el
hosting es un despliegue de demostración y no se decide acá; y la Fase 4 (usuarios, login, roles) queda
fuera del camino crítico, reemplazada por un login mínimo de demostración.

**Qué NO reabre esto.** Nada de lo ya construido. Los catálogos y módulos de M12 se verificaron cruzando
otras fuentes en su momento, y §5.50 ya fijó cómo se lee una fuente que es a la vez especificación y demo.
Esto rige de acá en adelante.

**Qué cambia, en concreto:**
- El criterio de cierre de `DESDE_LA_DEMO` se enmienda: de «la lista queda vacía» a **«cada sección tiene
  una fuente nombrada, y nada se re-referencia sin un diff verificado-vacío»**. Con el prototipo
  degradado, re-referenciar es un movimiento lateral y sólo se hace cuando es demostrablemente sin
  pérdida. `idea_nivel` (una paráfrasis, no el texto oficial de Rivière — M12.1) y `servicio` (sólo
  menciones en prosa) se quedan **por decisión, no como deuda**. M12.8-cierre ya aplicó esto.
- La verificación real de los catálogos propios de IPPU — sobre todo `ippu_item` y `baremo_categoria` —
  sólo puede venir de IPPU. Va a `preguntas-ippu.md` si no está cubierta ya (**medido: ya está cubierta,
  en C9**).
- `PLAN-M12` §M12.8 se enmienda en su justificación («cambió la fuente autoritativa» ya no aplica).
- ⚠️ **Esto reemplaza el orden de precedencia de §5.10.** §5.10 es append-only y no se edita; esta entrada
  deja asentado que el Prototipo v4 sale del nivel 1 y que las fuentes normativas son las listadas arriba.

---

## 5.93 → 5.106 · Sesión M11.3-0 — respuestas escritas de IPPU (A1–B12), 2026-10-05 (Lucas)

> **Contexto.** IPPU contestó por escrito las preguntas A1–A5 y B1–B12 de `docs/notas/preguntas-ippu.md`
> (`docs/notas/respuestas-ippu-2026-10-05.txt`, verbatim). Las 14 entradas de abajo son decisiones de
> **Lucas, 2026-10-05**; esta sesión **sólo las transcribe** (§12.6: la decisión se escribe antes del
> código) y **no toca código ni esquema** — únicamente docstrings de `app/models/`. Número libre medido en
> el archivo: la última entrada era §5.92. §5 es append-only: donde una entrada corrige una anterior, la
> anterior **no se edita** y esta dice cuál supera.
>
> | § | Tema | Pregunta | Relación con lo anterior |
> |---|---|---|---|
> | 5.93 | Respuestas escritas = fuente (nivel 0) | A1–B12 | amplía §5.92 |
> | 5.94 | El CI no traba | A3 | **cierra** §5.38 (CONFIRMABLE → confirmado) |
> | 5.95 | La secuencia sólo avisa | B4 | **enmienda** §5.86 |
> | 5.96 | Cadena por año | B10 | precisa §5.36 |
> | 5.97 | Qué IDEA rige | B2b | **reemplaza** «mayor `fecha_consenso`» (§5.36 / §5.91 b) |
> | 5.98 | Puntaje único | B2a | **ratifica** §5.47 |
> | 5.99 | Fotos: guardar sin trabas | §5.39 | precisa §5.39 |
> | 5.100 | `tecnico_grupo` CANCELADA | B5b · B6 | **supera** §5.79 y §5.87; **cierra** §5.89 |
> | 5.101 | Usuarios para el 26/11 | B5 | **refina** §5.92 («login mínimo») |
> | 5.102 | Informes | B7 | acota §5.40 al 26/11 |
> | 5.103 | Divulgación y copia a la familia | B11 · B12 | acota §5.80 |
> | 5.104 | Resto de A y B | A1 A2 A4 A5 B3 B8 B9 | **cierra** §5.58/§5.63 como confirmados |
> | 5.105 | Anexo A ya no bloquea el 26/11 | B1 | **acota** §5.54 y §5.67 |
> | 5.106 | Entrega en rebanadas verticales | — | **reemplaza** el orden M11.3→M11.6 de `esquema-datos-v2.md` §5 |

### 5.93 Las respuestas escritas de IPPU del 2026-10-05 se registran como fuente, nivel 0 (2026-10-05, Lucas)

**Qué se decide.** `docs/notas/respuestas-ippu-2026-10-05.txt` es **fuente normativa de nivel 0**, junto al
acta de la reunión del 2026-08-26 (§5.92): es lo que IPPU dijo sobre sí misma, por escrito. Donde
contradiga una decisión anterior de §5, rige una entrada nueva que la supere —las §5.94–§5.106 de esta
serie—, no una edición de la vieja.

**Cómo se lee.** Las respuestas son cortas y **dos quedan sin cerrar**: **A5** (contesta sobre «Taller
Terapéutico» y «Clínica» pero no dice qué es «Taller de Adolescentes») y **B1** (IPPU dice que no entendió
qué se le pide). Ninguna de las dos se interpreta como sí o no: se re-preguntan (`preguntas-ippu.md`).
B11 y B12 contestan «ver Protocolo de Acceso.md»: la lectura de esas dos es de Lucas, sobre el Protocolo
(§5.103), y consta como lectura, no como cita de IPPU.

**Evidencia.** El archivo `docs/notas/respuestas_hasta_B12_preguntas_a_ippu.txt` es **byte-idéntico** al
anterior (`diff` sin salida) y no se versiona. `docs/notas/protocolo-acceso-subido-2026-10-05.md` es
**byte-idéntico** (mismo sha256 `53f7b509…`) a `docs/markdown/protocolo-acceso-confidencialidad-resguardo-hce.md`
tal como está en `HEAD`: **no hay diferencias que reportar**.

**Qué cambia en las listas de fuentes.** La «Fuente normativa vigente» de la cabecera y de `CLAUDE.md` suma
estas respuestas en el nivel 0.

### 5.94 El consentimiento NO traba el proceso de evaluación — §5.38 queda confirmada (2026-10-05, Lucas)

**IPPU (A3):** «Así es, el CI no traba el proceso de evaluación». **Cierra §5.38 como confirmada**: la marca
⚠️ CONFIRMABLE ya no aplica y el ítem «re-confirmar con IPPU» de §6 se cierra.

**Regla.** **Ningún paso de la secuencia exige el CI.** «CI pendiente» es un **estado derivado y visible**
del expediente (no se almacena, como el estado visible de los módulos), con la notificación que §5.38 ya
describía. El registro del consentimiento en sí no cambia (referente familiar, fecha, firma).

**Qué dejan desmentido, y se corrige en esta sesión:** el docstring de `Consentimiento` («el único bloqueo
sin excepción posible») y el de `FirmaMixin` («el CI es el único que no la admite»); la fila 1 de
`esquema-datos-v2.md` §4 («nada sin CI», «CI no exceptuable») y la nota de `consentimiento` en §2.2.
`consulta-a-ippu.md` §1.3 —que IPPU tiene— dice lo contrario y es snapshot: no se edita, lo supera esta
respuesta. **La demo no está corregida** (`demo/js/flujo.js:54-64` sigue bloqueando): se anota en §6.

**Detalle NO decidido** (queda para M11.3-b): si la **falta** de CI, además de verse como «CI pendiente»,
agrega un ítem a `warnings[]` (§5.95) o una fila de `auditoria`. La regla de arriba sólo dice que no traba
y que es un estado visible.

### 5.95 La secuencia SÓLO AVISA — enmienda a §5.86 (2026-10-05, Lucas)

**IPPU (B4):** «Solo avisa». **Enmienda §5.86** (el default «409 duro»): §5.86 ya preveía suavizarlo «en
una entrada nueva» si IPPU pedía una habilitación registrada; es esta.

**Regla.** Una **escritura o firma fuera de secuencia se ACEPTA**. La respuesta lleva `warnings[]`, y se
escribe una fila de `auditoria` con **`tipo='excepcion'`** (el valor ya está en el CHECK,
`app/models/transversales.py:269`). El motor de flujo no devuelve 409 por secuencia.

**Qué NO cambia.** **Firma = bloqueo es otra regla y sigue en pie** (esquema §4.1): editar un módulo
firmado devuelve **409**; la corrección va por addenda. Tampoco cambia la regla de no-triggers (§5.2.2): el
aviso y la auditoría los escribe el servicio.

**Detalle NO decidido** (M11.3-b): el contenido de cada aviso, si el mecanismo es el campo `excepcion` JSONB
del módulo o sólo `auditoria`, y si el aviso pide un motivo. Esta entrada fija únicamente `warnings[]` y la
fila `tipo='excepcion'`.

### 5.96 Cadena por año: CI una vez por HCE, LB → PA → PB → IC dentro de cada año (2026-10-05, Lucas)

**IPPU (B10, sobre el reingreso):** «No, no cambia nada». **Regla.** El **CI** se hace **una vez por HCE**.
Cada año corre la cadena **LB(año) → PA(año) → PB(año) → IC(año)**, **sin dependencia entre años**: LB(2027)
no espera a IC(2026). Un reingreso no abre ninguna instancia especial.

**Qué cierra.** El supuesto «reingreso a más de 12 meses = línea base nueva» (`puntos-a-validar.md` §3, ya
marcado «hay que revisarlo» por §5.36): **deja de ser un supuesto**, el IDEA anual lo hace innecesario. Y
queda **precisada** la parte de §5.36 que decía que «reingreso» deja de ser lo que abre una instancia; el
CI no forma parte de la cadena como prerrequisito (§5.94). Esto es lo que M11.3-b usa para decidir qué es
«fuera de secuencia» (§5.95).

### 5.97 Qué IDEA rige: el de **su propio año**; en la HCE, el **firmado de mayor `anio`** (2026-10-05, Lucas)

**IPPU (B2b):** los informes se exportan a PDF; al ver un informe viejo se muestra **el IDEA de ese año**;
al entrar a un NNA en el apartado HCE se muestra **lo más actual**. **Reemplaza** la regla «la vigente es la
de mayor `fecha_consenso`» (docstring de `Idea`; `esquema-datos-v2.md` §2.2 y §4; §5.36; marcador de §5.91
b), que se escribió para un modelo de línea base con reingresos.

**Regla, tres vistas:**
1. **Un documento o informe** muestra el IDEA **de su propio año**.
2. **La vista de la HCE** muestra el **IDEA firmado de mayor `anio`**.
3. **Un IDEA sin firmar del año en curso** se muestra **aparte, como «en curso»**; no desplaza al firmado.

Esto **define el guard «qué IDEA rige a la fecha»** que §5.35/§5.36 dejaron en prosa; lo implementa M11.3 (en qué rebanada, se decide al diseñarla).

### 5.98 Puntaje único: D7 y «NS contra número» salen de M11.3; kappa sigue sin ser calculable (2026-10-05, Lucas)

**IPPU (B2a):** «Consenso del puntaje. Se requiere un campo en donde los técnicos registrarán un solo
número». **Ratifica §5.47 (I12).** Consecuencias:
- **El guard D7** («diferencia ≥2 exige documentar el consenso») y la pregunta **«`NS` de un técnico contra
  número del otro»** **salen de M11.3**: no tienen sujeto con un solo puntaje.
- **`puntuacion_idea` y `puntuacion_protocolo` se quedan en el esquema**, la API **no los expone**, y **no
  se retiran** (siguen nullable, D7 sigue dormida; los tests de `test_m12_consenso.py` no se tocan).
- ⚠️ **Se sigue diciendo:** el **kappa interjueces** (Manual §23) **no es calculable** con la práctica de
  IPPU. Quien presente el trabajo a INAU debe decirlo; no se deja implícito en que el modelo «lo soporta».

### 5.99 Fotos: guardar no requiere autorización y no produce aviso ni bloqueo (2026-10-05, Lucas)

**Regla (§5.39 + decisión de equipo).** **Guardar una foto nunca exige autorización** y **no produce ni
aviso ni bloqueo**, ni individual ni grupal. **Supera** la fila de `esquema-datos-v2.md` §4 «carga sin
autorización → 403 con detalle de quiénes faltan» y el docstring de `Foto`. Las reglas de **compartir** una
foto quedan **fuera del alcance del 26/11** (siguen vigentes como regla: §5.39/§5.45).

**Qué no se decide.** `autorizacion_imagen` **no se retira**: sigue siendo el registro de la autorización.
La demo todavía **bloquea el guardado** (`demo/js/hce-doc-org-vf.js:117-124`, `recordatorios.js:39-55`) — se
anota en §6, no se toca acá. **[Actualizado el 2026-10-14: la demo ya no bloquea el guardado de fotos, §5.125 (i).]**

[2026-10-16, Lucas] La demo ya no bloquea el guardado: subirFoto y subirFotoGrupo guardan sin autorización (§5.136 e; 3c-j9b).

### 5.100 `tecnico_grupo` se CANCELA; `btree_gist` queda cerrado (2026-10-05, Lucas)

**IPPU:** B6 «No» (no hace falta ver quién estuvo antes cuando un técnico cambia de grupo) y B5(b) «No» (no
hay referente por NNA). **Supera §5.79 y §5.87** (la tabla N:M con vigencias: ya no se construye) y **cierra
§5.89**: sin tabla no hay invariante que expresar, así que **`btree_gist` no entra** y la pregunta queda
cerrada.

**Fuente de verdad:** `grupo.tecnico1_id` / `tecnico2_id` (+ `tecnico1_rol` / `tecnico2_rol`). **Cómo se
rastrea un cambio de técnico:** por la **auditoría de campo** (esquema §4: «cambiar el técnico de un grupo
deja el valor anterior legible»). **B5(a):** las etiquetas de rol son **texto libre** — confirma el
supuesto de `puntos-a-validar.md` §3 y el diseño de §5.2.3. El esbozo de `esquema-datos-v2.md` §2.6 se
**conserva como historia**, marcado cancelado. Esta entrada **no** decide nada sobre el techo de dos
técnicos por grupo.

### 5.101 Usuarios para el 26/11: login mínimo con los dos roles existentes (2026-10-05, Lucas)

**IPPU (B5c):** «Revisar "Protocolo de Acceso.md". Cuidado con el alcance, no es necesario modelar todos los
usuarios … solo los críticos para 26/11». **Refina el «login mínimo» de §5.92.**

**Alcance 26/11.** **Login JWT mínimo sobre `profesional`**, con los roles que ya existen —**`admin` |
`tecnico`**, `ck_profesional_rol_valido`—: el **`tecnico` ve sólo los grupos en los que es tecnico1/tecnico2**;
el **`admin` ve todo**. **Posterior al 26/11:** el resto de la matriz de roles del Protocolo §5 (los 5
perfiles de §5.72, la conflación `admin` ↔ «dirección no técnica», el «perfil de área de Inclusión») y el
**registro de accesos con motivo** (§2.17 / §5.88).

### 5.102 Informes: área configurable y estado «revisado por dirección» son secundarios (2026-10-05, Lucas)

**IPPU (B7):** una pestaña para generar informes con plantillas de los que se hacen recurrentemente; «no es
crítico y está pensado a futuro». **Acota §5.40 al 26/11:** el **área de informes configurable** y el
**estado «revisado por dirección»** quedan **fuera del 26/11**. **Sí entra:** el **IC firmado exportable a
PDF**.

⚠️ **§5.40 sigue siendo la regla** (todo informe pasa por revisión de dirección antes de entregarse); lo que
se pospone es **implementarla**. El PDF del 26/11 es una exportación de **demostración con datos simulados**
(§5.92), no una entrega; antes de que salga un informe con datos reales, el estado de revisión tiene que
existir.

### 5.103 Divulgación: `disociado` ≡ `agregado` para el guard §6.6; la copia a la familia es acceso, no divulgación (2026-10-05, Lucas)

**IPPU (B11, B12):** «Ver Protocolo de Acceso.md». **Lectura de Lucas sobre el Protocolo §5 y §6.6:**
- **B11.** Para el guard de §6.6 (informes a dirección, convenio, donantes: «datos disociados o
  anonimizados», con ejemplos todos agregados), **`disociado` y `agregado` son equivalentes**: **dos valores
  efectivos**. La columna `alcance_dato` **conserva los tres** para el registro; **sin cambio de esquema**.
- **B12.** Entregar a la familia una copia de la HC del propio NNA es un **acceso del titular o su
  representante** (Ley 18.335 art. 18 lit. A; matriz §5, filas «Paciente» y «Padres, tutores»), **no una
  divulgación**: corresponde al **registro de accesos** (§2.17), no a `divulgacion`.

**Alcance.** Los **guards de divulgación quedan fuera del 26/11**, y el registro de accesos es posterior
(§5.88/§5.101). **Deuda conocida:** `DIVULGACION_DESTINATARIOS` incluye «Familia / representante legal»
(`app/core/constantes.py`), que bajo B12 no es una divulgación. **No se cambia el catálogo**; queda
anotado para cuando se escriba el guard.

### 5.104 Resto de A y B: confidencialidad, acceso a la HCE actual, ateneo, talleres, histórico, reserva (2026-10-05, Lucas)

- **A1 — no existe acuerdo de confidencialidad firmado** («olvídate de esto»). **Rige** la regla de
  `CLAUDE.md` / §5.45: **sólo datos simulados o anonimizados**. Deja de ser un trámite que perseguimos.
- **A2 — sin acceso a la HCE actual**; sólo un video donde la recorren. **Reconstruir el esquema legado
  desde el video queda después del 26/11**; la **migración de datos queda fuera del 26/11**.
- **A4 — el ateneo de grupo es de acceso general.** **Cierra §5.58 y §5.63 como confirmados** (se acaba
  su ⚠️ CONFIRMABLE).
- **A5 — SIGUE ABIERTA** (respuesta ambigua, §5.93). IPPU dice que Taller Terapéutico y Clínica son otros
  servicios, fuera de Atención Diurna, y «no son nombres de grupos». **No dice** si «Taller de
  Adolescentes» es uno de ellos. **§5.61 no se toca**: los cinco grupos sembrados quedan hasta que conteste.
- **B3 — participación por NNA y taller:** se registra «con la condición de que sea viable y no complique
  mucho»; si no, **basta el catálogo**. **`pai_taller` se queda**, y se **expone sólo si se conecta la
  pantalla del PAI** (no es requisito de ninguna rebanada).
- **B8 — los históricos con la «Guía del aplicador» corrida entran igual**, sin marca (§5.43).
- **B9 — reserva de datos del adolescente:** IPPU la ubica como derecho de la persona (Ley 18.331) y
  **no piensa modelarla ahora**. **Se difiere** más allá del 26/11; sale de M11.3.

### 5.105 El Anexo A ya no bloquea el 26/11 (2026-10-05, Lucas)

**IPPU (B1):** «No entendí exactamente qué querés, especificámelo mejor» → **B1 se re-pregunta** y sigue
abierta. **Pero deja de bloquear el 26/11.** **Acota §5.54 y §5.67 y levanta el «BLOQUEADO por fuera»** de la
fila de `esquema-datos-v2.md` §4 sobre el Anexo A. **Regla para el 26/11:** los totales son las **sumas ya
definidas** —12 dimensiones → **total 0–96** y las 4 escalas; 24 ítems → **total 24–120**— y el Δ se calcula
**sólo dentro del mismo instrumento** (§5.36). Si el Anexo A o el Manual §8 dicen algo distinto, se revisa
cuando lleguen.

### 5.106 La entrega se corta en rebanadas verticales; el frontend del 26/11 es la demo HTML conectada (2026-10-05, Lucas)

**Reemplaza** el orden M11.3 → M11.4 → M11.5 → M11.6 de `esquema-datos-v2.md` §5. **M11.4 se disuelve** en
rebanadas verticales (servicio + schema + router + tests por dominio). **M11.5** (seed espejo vía API, la
forma ejecutable de §12-A, §5.65) pasa **justo después de la rebanada del ciclo clínico**. **M11.6** se
reduce: **Swagger reemplaza a `ejemplos-endpoints.md`**. Orden:

1. **M11.3-a** — cimientos + persona/HCE.
2. **M11.3-b** — estado de flujo + `warnings` + firma/addendas + validaciones/totales/banda del IDEA.
3. **M11.3-c** — PA/PB/IC + Δ + alerta + datos del IC para el PDF.
4. **M11.5-a** — seed espejo vía API como test ejecutable de §12-A.
5. **M11.3-d** — VF/baremo, SEV, INC, documento histórico, foto · login (2 roles) · routers restantes que
   necesiten las pantallas conectadas · **M11.6 reducido**.

**Frontend del 26/11:** la **demo HTML existente conectada a la API** (Fase 3). **React + Tailwind**
(`CLAUDE.md`, «Stack objetivo») es **posterior al 26/11**. **M11.3 sigue siendo de Lucas** (§5.67).

---

## 5.107 · Sesión M11.3-0b — A5 contestada; B1 queda con su texto definitivo (2026-10-05, Lucas)

### 5.107 «Taller de Adolescentes» ES UN GRUPO — A5 cerrada, §5.61 confirmada (2026-10-05, Lucas)

**IPPU (A5, respuesta a la pregunta reformulada, transmitida por Lucas):** «Taller adolescentes es el
nombre de un grupo». **Cierra A5 y confirma §5.61**: los **cinco grupos sembrados** —Inicial · Escolares ·
Preadolescentes · Adolescentes · Taller de Adolescentes— son correctos, y la fila de «Taller de
Adolescentes» **no sale**. **Resuelve la ambigüedad que §5.93 y §5.104 dejaron registrada** (la respuesta
escrita del 2026-10-05 sólo decía que Taller Terapéutico y Clínica no son grupos); esas dos entradas **no se
editan**, las supera ésta. Taller Terapéutico y Clínica siguen fuera de Atención Diurna (§5.12 / D3).
**Sin trabajo de esquema ni de seed.** Los comentarios y docstrings que seguían diciendo «podría ser el
servicio Taller Terapéutico» se corrigen en esta misma sesión.

**B1 sigue ABIERTA**, ahora con su **texto definitivo** (reemplaza el borrador de la sesión M11.3-0): se
pide el Manual completo (Word o PDF) y, si no lo tienen a mano, si al terminar de puntuar el IDEA y antes de
firmar hacen alguna cuenta o revisión además de sumar las 12 dimensiones y los totales por escala (p. ej.
que no quede ninguna dimensión sin puntuar, o compararlo con el IDEA del año anterior). El texto completo
está en `preguntas-ippu.md` B1. **Sigue sin bloquear el 26/11** (§5.105).

---

## 5.108 · Sesión M11.3-a — contrato de la API y regla de transacción (2026-10-06, Lucas)

### 5.108 Contrato de respuesta y una transacción por request: base de todas las rebanadas (2026-10-06, Lucas)

**Contexto.** La demo HTML se conecta a esta API en Fase 3 (§5.106), así que lo que se fija en la primera
rebanada **no se cambia sin acuerdo del equipo**. Estas son las reglas, tal como las implementa M11.3-a;
la explicación completa está en los docstrings de `app/routers/__init__.py` y `app/services/__init__.py`.

1. **Éxito.** `GET` → el recurso (o la lista) **directo**. `POST`/`PATCH`/`PUT` → **`{"data": …, "warnings": []}`**;
   `warnings` **siempre presente**, lista de `{code, mensaje, …}` no bloqueantes. Es el lugar donde
   M11.3-b pone los avisos de secuencia (§5.95).
2. **Error.** Todos —404, 409, 422, 403, y también la validación de entrada de FastAPI y las rutas
   inexistentes— devuelven **`{"code": str, "detail": [{"campo": str|null, "mensaje": str}]}`**. `detail`
   es siempre una lista. Códigos: `not_found` · `conflict` · `signed_module` (409) · `validation_error` ·
   `forbidden` · `http_error`. **No existe un error de secuencia** (§5.95).
3. **Transacción.** **Una por request.** Los servicios **sólo `flush()`**, nunca `commit` ni `rollback`; el
   commit ocurre **una vez**, en `app/routers/dependencias.py::sesion_transaccional`, y cualquier excepción
   deshace todo. Es lo que permite que «firmar» = módulo + totales + auditoría entren o no entren juntos.
4. **Capas.** Los servicios levantan errores de dominio y **no importan FastAPI** (un test lo fija por AST).
5. **Textos.** `''` y blanco → `NULL` al guardar en los opcionales (`esquema-datos-v2.md` §4); un texto con
   contenido se guarda **sin tocar**. **CI:** se guarda como se escribió y la unicidad ignora puntos,
   guiones y espacios.

---

## 5.109 → 5.114 · Sesión M11.3-a2 — identidad y listas de lectura para la demo (2026-10-06, Lucas)

Sesión correctiva corta de M11.3-a: la revisión encontró cuatro problemas de identidad y dos lecturas que
faltaban para que la demo pudiera crear un expediente. Las seis decisiones las tomó el equipo; acá se
transcriben (a–f) y entre paréntesis va lo que la implementación **fijó sin que estuviera dicho**.

### 5.109 (a) `hc_historico` es el N.º de HC institucional: entero ≥ 1000, único, asignado por el servidor (2026-10-06, Lucas)
**Enmienda §5.43**, que decía «no se cambia el tipo en esta sesión»: el tipo cambia ahora.
- `hce_diurna.hc_historico` → `Integer`, `CHECK (hc_historico >= 1000)`, `UNIQUE` (que ya es el índice que pide
  el Documento Técnico §3.3).
- **Alta sin número:** el servidor asigna `max(hc_historico) + 1` (el primero, 1001) **dentro de la transacción
  del request**, bajo un lock de aplicación (`pg_advisory_xact_lock`) que dura hasta el commit: dos altas
  simultáneas nunca reciben el mismo número. **Alta con número explícito:** se acepta si es ≥ 1000 y está
  libre; **409** si está tomado, **422** si es < 1000. Una colisión que llegue al `UNIQUE` (carga fuera del
  servicio) también es 409, nunca 500.
- **`hce.id` es interno.** La vía «N.º de historia clínica» de la búsqueda compara **sólo** `hc_historico`.
- *(Fijado por la implementación:)* la columna queda **nullable** —sólo para filas armadas fuera del servicio,
  p. ej. tests o migración—; el alta por la API siempre la completa. **Editable por `PATCH`** con las mismas
  reglas (≥ 1000, libre), pero **no se puede borrar** (`null` → 422). Tope: lo que cabe en un `integer`; si el
  máximo está en el tope, el alta sin número da 409 explicado (no hay «siguiente»). Un valor que no es un
  entero, o uno que no cabe, **no coincide con nada** en la búsqueda (lista vacía, no error). Un `""`/blanco
  en el campo se trata como ausente.

### 5.110 (b) La CI se guarda canónica (2026-10-06, Lucas)
Se guarda **sin puntos, guiones ni espacios** (`1.234.567-8` → `12345678`); **el formato es asunto del
frontend**. El `UNIQUE` ya existente sobre `persona.ci` pasa a atrapar los duplicados sea cual sea el formato en
que lleguen, **la carrera entre dos altas incluida**. *(Fijado:)* se quitan sólo los separadores, **no** se
descartan letras (un documento extranjero no se destruye); una CI que queda vacía tras canonizar es 422. La
búsqueda por CI es «contiene» sobre el valor canónico. Reemplaza el «se guarda tal cual se escribió» de §5.108.5.

### 5.111 (c) La búsqueda por grupo es por año (2026-10-06, Lucas)
Parámetro opcional `anio`; **por omisión, el año calendario en curso**. Corrige el punto abierto de M11.3-a
(«Escolares» devolvía a los de 2026 y a los de 2027). *(Fijado:)* `anio` **sólo califica a `grupo`**: sin
`grupo` no filtra nada, para que buscar por CI no deje afuera a quien está en un grupo de otro año.

### 5.112 (d) Crear un registro escribe una fila `auditoria` `tipo='carga'` (2026-10-06, Lucas)
`campo`, `valor_ant` y `valor_nuevo` en `NULL`; `detalle` nombra el registro. Hoy lo escribe el alta del
expediente (módulo `HCE-00`), en la misma transacción. *(Fijado:)* el `detalle` **no lleva datos personales**
(«Alta del expediente 3 (N.º de HC 1001)»). Las ediciones siguen siendo `tipo='edicion'`, una fila por campo.
Cierra el punto abierto «`tipo` de la auditoría de creación» de M11.3-a.

### 5.113 (e) Restricción de numeración heredada — para la migración de datos, **no implementada ahora** (2026-10-06, Lucas)
Los expedientes migrados **conservan su `hc_historico` legado**. Antes de crear **cualquier expediente real**
en el sistema nuevo, hay que **migrar primero los legados** o **arrancar la asignación por encima del máximo
legado**; si no, el `max + 1` choca con números ya usados en la HCE anterior. (Con la asignación actual,
migrar primero ya alcanza: el siguiente número sale de `max + 1`.) Puntero en `puntos-a-validar.md` §1.8.

### 5.114 (f) Documentación mínima hasta el 2026-11-26 (2026-10-06, Lucas) — **enmienda §5.82**
- La **cabecera de `handoff.md`** pasa a ser **una pantalla** (≤ 15 líneas): qué funciona, próxima rebanada y
  qué está bloqueado, con su responsable.
- Cada sesión escribe **sólo** su entrada de `docs/bitacora.md` (≤ 15 líneas), tilda su casilla de §6 y suma un
  §5 **sólo si tomó una decisión**. **Sin notas, relevamientos ni resúmenes nuevos.**
- Los documentos largos existentes quedan como **referencia**, no como lectura obligatoria. `CLAUDE.md`
  («Arranque de sesión») se actualizó en consecuencia.

## 5.115 · Convenciones transversales de la capa de servicios (2026-10-06, Lucas — sesión M11.3-a3)
Salen de la revisión de conformidad de M11.3-a/a2. **Las heredan M11.3-b en adelante** (JSONB `firmas`/`addendas`/`dim`, fechas vacías de formularios). Sin cambio de DDL.
- **(a) JSONB ausente = `NULL` de SQL**, nunca el `null` de JSON: `JSONB(none_as_null=True)` en toda columna JSONB nullable (sólo Python; el head no cambia). Un test recorre `Base.metadata` y falla si una nueva no lo lleva.
- **(b) Vacío en opcionales que no son texto = `NULL`.** `""`/blanco → `None` con `FechaOpcional`/`EnteroOpcional` (`app/schemas/comunes.py`, `BeforeValidator`); también para FK. Cada schema nuevo los reusa, no escribe su validador. Los **textos** se siguen normalizando en el servicio (`services/texto.py`).
- **(c) Un error no previsto conserva el sobre:** 500 → `{"code": "internal_error", "detail": [{"campo": null, "mensaje": "Error interno"}]}`, nunca el texto de la excepción; el traceback va al log. Se implementa como **middleware** registrado antes de CORS (un `exception_handler(Exception)` queda afuera de CORS). Documentado en Swagger para todas las rutas.
- **(d) Los GET no commitean:** usan `sesion_lectura`; sólo las mutaciones pasan por `sesion_transaccional`. Un `commit()` que falla tiene que salir como error, lo que depende de que FastAPI corra la salida de las dependencias **antes** de enviar la respuesta (0.115.x): `fastapi` queda fijado con el motivo en `requirements.txt` y un test se rompe si cambia.
- **(e) Elecciones de M11.3-a2 que no estaban escritas:** `anio` fuera de 1..32767 → **422** · la auditoría de `persona.ci` guarda el valor **canónico** (§5.110) · `GET /grupos` → `[{id, nombre, anio}]` y `GET /profesionales` → `[{id, nombre, especialidad, rol, activo}]` (sin email ni hash), ambos **sin sobre**.

## 5.116 · Sesión M11.3-b — motor de flujo, firma y IDEA (2026-10-06, Lucas)

### 5.116 Decisiones a–e de M11.3-b: cierran los «detalles no decididos» de §5.94 y §5.95 (2026-10-06, Lucas)
Sin cambio de DDL (head `dcc838486407`). Código: `services/{flujo,firma,idea,consentimiento}.py`.
- **(a) Una sola firma del IDEA.** Firmar exige `evaluador_t1_id` y `evaluador_t2_id` cargados, **distintos y activos**; `firmas` guarda a los dos `{profesional_id, rol, fecha}`; `usuario_id` de la fila `firma` queda `NULL` hasta el login (§5.101). Razón: §5.98 (un único puntaje de consenso, acordado en persona). Dos iguales también son 422 **al guardar** (el CHECK `evaluadores_distintos` lo daría como 500).
- **(b) Totales.** `total` y `esc_a..esc_d` se recalculan en **cada guardado sin firmar** (las `NS` y las vacías, afuera) y **se congelan al firmar**. Escalas = tríos consecutivos (A D1–D3 · B D4–D6 · C D7–D9 · D D10–D12), **verificado** contra Documento Técnico §5.1 y contra `idea_dimension.escala`: coincide. *(Fijado:)* sin ninguna dimensión numérica el total es `NULL`, no 0.
- **(c) La banda se deriva al leer** desde `banda_idea` (nunca guardada ni con cortes en el código): mover un corte cambia la banda devuelta, también para un IDEA firmado.
- **(d) Auditoría de campo de `dim`:** una fila `edicion` por dimensión que cambió, `campo='dim.Dn'`; el alta es una sola fila `carga`.
- **(e) Avisos.** La **falta de CI no produce aviso ni fila**: es sólo el estado «CI pendiente». Una creación o firma **fuera de secuencia** agrega `{code: "fuera_de_secuencia", mensaje, modulo, anio, faltan[]}` a `warnings` y escribe **una** fila `auditoria` `tipo='excepcion'`, **sólo al crear y al firmar** (no en cada guardado). **`FirmaMixin.excepcion` no se usa** (docstring actualizado; la columna queda sin migración). Hoy ninguna operación del IDEA puede salir de secuencia (LB es el primer eslabón); la lógica es genérica para PA/PB/IC (M11.3-c).
- **Fijado por la implementación sin que estuviera dicho:** (1) **Integridad para firmar el IDEA** = Documento Técnico §4.3, fila HCE-LB: 12 dimensiones puntuadas sin `NS` ni vacías · **fecha de consenso** · **síntesis clínica** · **objetivos del período** (422 con un detalle por campo, todo junto). (2) El consentimiento exige `firmante` y `fecha` al registrarse; `autorizaciones`, si viene, trae las tres. (3) `firmas[].rol` = `profesional.especialidad`. (4) PATCH de `dim` fusiona **dimensión por dimensión** y, dentro de una, sólo las claves que vinieron. (5) `GET /hce/{id}/idea/vigente` → `{vigente, en_curso}`; `idea_de_anio` devuelve el IDEA de ese año **firmado o no** (quien lo usa mira `.firmado`). (6) Las filas se bloquean (`FOR UPDATE`) en PATCH/firma/addenda. (7) Un solo lugar lee el reloj: `fechas.hoy()`.
- **No se implementó (queda para decidir):** los «recomendados» de §4.3 para el IDEA —≥ 5 sesiones previas, extensión de la síntesis (≈200 palabras)—: el documento dice «advierten y **piden constancia**» pero no define el mecanismo, y (e) sólo prevé `fuera_de_secuencia`. `idea.sesiones` ya se guarda.

## 5.117 · Sesión M11.3-c — PA/PB, Δ, alerta e informe de cierre (2026-10-07, Lucas)

### 5.117 Decisiones a–e de M11.3-c: cierran la cadena anual LB → PA → PB → IC (2026-10-07, Lucas)
Sin cambio de DDL (head `dcc838486407`). Código: `services/{protocolo,delta,informe_cierre,idea}.py`.
- **(a) Recomendados del IDEA (Documento Técnico §4.3, fila HCE-LB).** Al firmar, `sesiones` < 5 (o sin cargar) o una síntesis de < 150 palabras (las sugeridas son ≈200) agregan a `warnings` un `{code: "recomendacion_no_cumplida", modulo, recomendacion: "sesiones"|"sintesis", minimo, valor, mensaje}` por cada uno. **Nunca bloquean**, sin constancia y **sin fila de auditoría**. Umbrales en `constantes.py` (`IDEA_SESIONES_RECOMENDADAS`, `IDEA_SINTESIS_PALABRAS_*`). Cierra el «no se implementó» de §5.116. Los recomendados de PA/PB (≥ 15 semanas, ≈150 palabras) e IC (≈100 por escala, cercanía al PB) **no se implementan** (fuera de esta decisión).
- **(b) Firma.** Protocolo = un solo acto, como el IDEA: `evaluador_t1_id`/`t2_id` cargados, distintos y activos. **IC:** no tiene columnas de evaluadores → `POST /informe-cierre/{id}/firmar` recibe `{"firmantes": [id, id]}`, dos profesionales distintos y activos (422 con `firmantes`/`firmantes.N`).
- **(c) Δ.** `delta.calcular_delta(a, b)` acepta dos instancias del **mismo** modelo: `Protocolo` A y B del mismo expediente y año, o `Idea` del mismo expediente con `a` de un año anterior; tipos mezclados → `InstrumentosNoHomologables`, que es `TypeError` **y** `ValidationFailed` (por la API sale 422, nunca 500); mismo tipo mal emparejado → `ValueError`. Resta los totales materializados (congelados al firmar). **PB firmado:** `deltas = {total, esc_1..esc_4}` = PB − PA si el PA del año está firmado; si no, `NULL` y el `fuera_de_secuencia` (que lista `HCE-PA`) lo explica. **IDEA interanual:** `GET /hce/{id}/idea/delta?anio=` = firmado de `anio` − firmado de `anio − 1`, al leer; `delta: null` si falta alguno.
- **(d) Alerta.** Sólo desde filas `alerta=True` de `delta_interpretacion`. **Lectura:** el catálogo es `deltaInterpreta` del Prototipo v4 e interpreta el **Δ B − A de la IPPU-TEA** (mayor = mejor); el Documento Técnico §5.2 dice «Δ ≤ −7 **en una escala** dispara alerta institucional» y la demo (`calcularDeltasPB`) hace lo mismo → **la alerta es por escala del protocolo**; el Δ total se **interpreta** (etiqueta/acción) pero **no alerta**; el Δ interanual del IDEA **no se interpreta ni alerta** (dirección opuesta, sin tramos documentados). Una alerta va en `data.alertas` y escribe **una** fila `auditoria` `tipo='alerta'` al firmar el PB. `interpretacion` y `alertas` se derivan al leer (mover un tramo cambia la lectura; la fila de auditoría queda como se escribió).
- **(e) Recibí del IC.** `POST /informe-cierre/{id}/recibi {firmante, fecha}`: sólo sobre un IC **firmado** (si no, 409), **una vez** (la segunda, 409), fila `auditoria` `tipo='carga'` sin el nombre del firmante. Registra la entrega, no edita lo firmado; cualquier otro cambio a un IC firmado es 409.
- **Fijado por la implementación sin que estuviera dicho:** (1) `protocolo.items` = `{"1".."24": {valor 1..5, obs}}` (clave = `ippu_item.id`); escalas = 6 ítems consecutivos, **verificado** contra Documento Técnico §5.2 y `ippu_item.escala` (test). (2) **Totales del protocolo sólo completos:** una escala con algún ítem vacío, o el total con alguno de los 24 vacío, quedan `NULL` (el `CHECK 24..120` rechaza una suma parcial). (3) **Integridad PA/PB** (Documento Técnico §4.3): 24 ítems · fecha · `obs` en ítems 1 o 5 · `sint_tec1` y `sint_tec2`. **IC:** las 4 `sint_escala` · `val_tec1` · `val_tec2` · recomendaciones · orientaciones · fecha; su «LB, PA y PB firmados» **sólo avisa** (§5.95). (4) `sint_escala` = `{esc_1..esc_4}` (las escalas de la IPPU-TEA), PATCH por escala, auditoría `sint_escala.esc_N`; auditoría de ítems `items.N`. (5) `GET /informe-cierre/{id}/documento` → `{expediente{hce_id, hc_numero, nombre, apellido, fecha_nac, grupo}, anio, idea (de su año, firmado o con `firmado:false`, o `null`), protocolos{a, b, deltas, interpretacion, alertas}, informe{…, firmas con nombre, addendas, recibi}}`; 409 sin firmar. (6) ~~Un PB firmado antes que su PA queda con `deltas` `NULL` para siempre (no se recalcula al firmar después el PA).~~ **Enmendado por §5.118 (a):** la firma del PA le completa los `deltas`. (7) El ejemplo Swagger de `fuera_de_secuencia` pasó de la firma del IDEA al alta y la firma del PA.

## 5.118 · Sesión M11.3-d1 — correcciones de la revisión b+c, VF y login mínimo (2026-10-07, Lucas)

### 5.118 Decisiones a–g de M11.3-d1: lo que las pantallas conectadas del 26/11 todavía le pedían al backend (2026-10-07, Lucas)
Sin cambio de DDL (head `dcc838486407`): el login usa columnas que ya existían (`profesional.email` UNIQUE, `rol`, `hashed_password`, `activo`). Código: `services/{auth,valoracion_funcional,protocolo,informe_cierre,hce}.py`, `core/seguridad.py`, `crear_usuario.py`.
- **(a) PB firmado antes que su PA — enmienda §5.117 (6).** Al firmar el **PA**, si el PB del mismo año está firmado con `deltas` `NULL`, el servidor escribe sus `deltas` (PB − PA) **en la misma transacción**, con **una** fila `auditoria` `tipo='edicion'`, `campo='deltas'` (`valor_ant` NULL) y, si una escala cae en un tramo con alerta, la fila `alerta` de siempre. Es dato derivado por el servidor de dos módulos firmados, **no** una edición del contenido firmado del PB. PB sin firmar o con Δ → no se toca.
- **(b) Grupo en `/documento` = el grupo actual del expediente** (`hce_diurna.grupo_id`): no hay historial de grupos (§5.100). **Limitación conocida, no se corrige**: un IC de 2026 impreso en 2027 muestra el grupo de 2027 si el expediente cambió.
- **(c) Recomendados de PA/PB e IC (Documento Técnico §4.3)** → `recomendacion_no_cumplida` en `warnings[]` al firmar, como el IDEA (§5.117 a): **nunca bloquean, sin auditoría**. PA/PB: `semanas` < **15** (o sin cargar) · síntesis de técnico < **113** palabras (≈150). IC: síntesis de escala < **75** palabras (≈100). Las extensiones «≈» usan la tolerancia del IDEA (75 % de lo sugerido); las semanas son mínimo exacto. «Elaboración próxima al cierre del PB» **no se verifica** (sin umbral escrito). Constantes en `constantes.py`.
- **(d) Login (§5.101).** `POST /auth/login {email, password}` → `{access_token, token_type, expira_en_minutos, usuario}` (JWT HS256, `sub` = `profesional.id`, `SECRET_KEY` y `ACCESS_TOKEN_EXPIRE_MINUTES` de settings). **Todo** pide `Authorization: Bearer` salvo `/health`, `/auth/login` y la documentación (dependencia en el `include_router`: una ruta nueva no queda abierta por olvido). `tecnico` alcanza sólo los expedientes cuyo grupo actual lo tiene como `tecnico1_id`/`tecnico2_id`; `admin`, todo. Fuera de alcance → **404 con el mismo mensaje que «no existe»**, también para lo que cuelga del expediente (`/idea/{id}`, `/protocolo/{id}`, `/informe-cierre/{id}`, VF, CI, flujo). `auditoria.usuario_id` = el usuario del token. CLI `python -m app.crear_usuario` (contraseña por teclado o `IPPU_PASSWORD`; email existente → exit 1). **Fijado por la implementación:** 401 con `code: unauthorized` y `WWW-Authenticate: Bearer`; el mismo mensaje para email inexistente, contraseña incorrecta, inactivo o sin contraseña; email sin distinguir mayúsculas; un profesional desactivado pierde la sesión abierta; `GET /auth/yo`; un `tecnico` sólo da de alta o mueve un expediente a un **grupo propio** (403); hash con **`bcrypt` directo** (passlib 1.7.4 no funciona con bcrypt ≥ 4.1: se retiró de `requirements.txt`). **Abierto:** asignar técnicos a un grupo no tiene endpoint ni CLI (§5.90): hoy es un `UPDATE grupo` a mano.
- **(e) Orden — enmienda §5.106:** **M11.5-a (seed vía API) va después de esta rebanada**, porque el seed tiene que autenticarse. Queda M11.3-d1 → **M11.5-a** → resto de M11.3-d (SEV, INC, documento histórico, foto) → M11.6 reducido.
- **(f) Elecciones de M11.3-b/c que la revisión encontró sin escribir:** `GET /hce/{id}/idea/delta?anio=` exige **`anio ≥ 2`** (compara contra `anio − 1`, que tiene que ser un año válido); el IDEA expone **`puntuadas`** y el protocolo **`puntuados`** (cuántas dimensiones/ítems tienen número; 12/24 = completo); `/documento` incluye PA y PB **aunque no estén firmados**, cada uno con `firmado` explícito (como el IDEA).
- **(g) Listado y baja/reingreso.** `GET /hce` pagina con `limit` (50 por omisión, 1–200) y `offset`; el **total va en la cabecera `X-Total-Count`** (expuesta por CORS) y no en un sobre: los GET siguen devolviendo el recurso directo (§5.108). La búsqueda excluye los expedientes dados de baja salvo `incluir_inactivos=true`; por id se siguen leyendo. **Baja** = `PATCH /hce/{id} {activo: false, fecha_baja}` (sin fecha → 422); **reingreso** = `{activo: true}`, que borra `fecha_baja`; las dos con auditoría por campo. `fecha_baja` en un activo o `activo: null` → 422. No escribe `evento` (la línea de tiempo queda para cuando haya pantalla). **CORS:** `CORS_ORIGINS` (lista JSON) en `.env`; por omisión la demo servida con `python -m http.server 5500`.
- **HCE-VF — fijado por la implementación:** una por expediente (`POST/GET/PATCH /hce/{id}/valoracion-funcional`, 409 la segunda); `categoria_baremo(pct)` es el **único** escritor de `categoria_id`, con los cortes de `baremo_categoria`: un `pct` decimal cae en el tramo de su parte entera (4,5 % → 0–4 %); `pct` NULL → sin categoría y etiqueta «No corresponde»; un `pct` que el catálogo no cubre → 422 (nunca una categoría por defecto). La entrada **rechaza** campos ajenos (`categoria_id`, puntajes: 422) y el módulo no importa IDEA, protocolo ni severidad (test estructural). Alerta de vigencia `90_dias` / `30_dias` / `vencida`, **calculada al leer**. Auditoría por campo y por dominio (`dominios.<dominio>`), incluida `categoria_id` cuando el `pct` la mueve. **Autogeneración descriptiva (§7.4 / Especificaciones §1(g)) NO implementada:** los documentos sancionan el mapeo (comunicación ← E2, interacciones ← E1, aprendizaje ← E4) pero **no definen los cortes** que llevan de la escala IDEA a un nivel de apoyo; sólo existen en el JS del Prototipo v4 (`sugiereNivel`), que no es fuente normativa (§5.92). Pregunta para IPPU.

## 5.119 · Sesión M11.3-d1-fix — cierre de la revisión de d1 (2026-10-07, Lucas)

### 5.119 Decisiones a–e: el contrato de auth/addendas que recibe main antes de M11.5-a (2026-10-07, Lucas)
Sin cambio de DDL (head `dcc838486407`). No edita §5.118: la complementa.
- **(a) `SECRET_KEY` obligatoria, sin valor por omisión, en todos los entornos.** La API no arranca si falta, mide menos de 32 bytes o es el viejo literal `cambiar-en-produccion` (está en la historia de git: con él cualquiera firmaba un token de `admin`). `.env.example` la trae vacía con el comando para generarla; la suite fija la suya en `tests/conftest.py`.
- **(b) El autor de una addenda es el usuario del token** (IDEA, protocolo, IC), sin excepción para `admin`. Los cuerpos de `/addendas` rechazan campos ajenos (`extra="forbid"`): un cliente que todavía mande `profesional_id` recibe 422, no un silencio.
- **(c) `auditoria.usuario_id` de cada fila `firma` = el usuario del token** (enmienda el «NULL hasta el login» de §5.116 a; ya lo hacía d1, ahora con test en los cuatro eslabones). **Los firmantes no se atan al token:** firmar es un acto de consenso de los dos técnicos (§5.98); el token registra quién ejecutó la acción.
- **(d) Unicidad (`persona.ci`, `hc_historico`) para un `tecnico`: 409 genérico** «No se pudo completar el alta: consultá a dirección.» con `campo: null`, en el alta y en el PATCH; el `admin` conserva el mensaje y el campo específicos. **Limitación aceptada:** que la respuesta sea un 409 y no un 201 igual revela que la CI o el N.º de HC existen. **Sin fila de auditoría del intento:** el request se deshace entero (§5.108). También: un login con email inexistente, inactivo o sin contraseña corre bcrypt contra un hash ficticio, para tardar lo mismo que una contraseña incorrecta.
- **(e) Registrado tal como está, sin cambio:** un expediente dado de baja **se sigue pudiendo escribir por id**; `GET /grupos` y `GET /profesionales` devuelven todo también a un `tecnico`.

## 5.120 · Sesión M11.5-a — seed espejo vía API y asignación de técnicos (2026-10-07, Lucas)

### 5.120 Decisiones a–e de M11.5-a (2026-10-07, Lucas + equipo)
Sin cambio de DDL (head `dcc838486407`). Código: `services/grupos.py`, `routers/referencias.py`, `app/seed_demo.py`.
- **(a) `PATCH /grupos/{id}` — sólo `admin`.** Cuerpo `extra="forbid"` con **sólo** `tecnico1_id`, `tecnico2_id`, `tecnico1_rol`, `tecnico2_rol` (PATCH; `null` desasigna). Profesional inexistente o inactivo, o técnico 1 = técnico 2 **contra el estado final** → 422 por campo; `tecnico` → 403 (antes que el 404, también por un grupo inexistente); grupo inexistente → 404; cualquier otro campo (`nombre`, `anio`…) → 422. Respuesta `{data, warnings}`. **Una fila `auditoria` `edicion` por campo que cambió**, `hce_id` NULL, `modulo='GRUPO'` (constante nueva `MODULO_GRUPO`), `detalle` = «grupo N · nombre año», y el técnico **legible**: `"Nombre (id N)"` (§5.100). Crear, renombrar o archivar grupos **sigue fuera** (§5.90). Cierra el «abierto» de §5.118 d.
- **(b) Seed en dos partes.** `preparar_usuarios(db, …)` crea admin + «Dr. González» (Psicólogo/a) + «Mtra. Torres» (Maestro/a) con `app.crear_usuario.crear_usuario` — **escribe en la base, fuera de la API, a propósito**: la API no da de alta usuarios. `cargar_demo(cliente, …)` hace **todo lo demás sólo por HTTP** (sirve con `TestClient` y con `httpx.Client`): el admin asigna los técnicos con `PATCH /grupos`; **los datos clínicos los carga González, que es `tecnico`**. Arquetipos verbatim de `demo/js/flujo.js` (102 ciclo completo + recibí · 101 PA borrador · 104 LB borrador con NS · 107 sin CI · 103/105/108 CI+LB); 106 Tomás, expediente dado de baja (`bajaFecha` de la demo). `cie11` = sólo el código de `CIE_SEED` (columna de 20); `alerta: "—"` de la demo no se carga. CLI `python -m app.seed_demo --url …` con `IPPU_EMAIL`/`IPPU_PASSWORD` (+ `IPPU_DEMO_PASSWORD`); si alguna CI de la demo existe, **aborta antes de escribir** (exit 1). **Una transacción por request (§5.108): una falla a mitad deja carga parcial** (docstring).
- **(c) Ubicación de los datos de demo en grupos — decisión del equipo sobre DATOS DE DEMOSTRACIÓN.** La demo usa colores (Azul/Celeste/Naranja), que no existen en IPPU (§5.37/§5.61). El seed los ubica con un dict **que vive sólo en `app/seed_demo.py`** (`UBICACION_DEMO`): Azul → Escolares · Celeste → Preadolescentes · Naranja → Adolescentes (2026). ⚠️ **IPPU no dio franjas de edad para sus grupos y este mapeo NO debe leerse como tales**: no se persistió ninguna franja (ni catálogo, ni constante, ni schema, ni doc de dominio). Inicial y Taller de Adolescentes quedan sin NNA de demo. Reversible: es un dict. La demo (`demo/`) **no se tocó**: realinear sus colores es trabajo de Fase 3.
- **(d) Condiciones de frenar, resultado.** **Regla de obs:** el backend exige obs en ítems **puntuados 1 o 5** (`services/protocolo.py:320`, `PROTOCOLO_VALORES_CON_OBS = (1, 5)` en `constantes.py`), igual que la demo (`flujo.js:85`); Martín no tiene ítems en 1 ni 5 → firma sin agregar obs. **Fechas futuras:** la API **acepta** PB 2026-12-11, IC y recibí 2026-12-19 → **ninguna fecha se corrió**. **§12-A:** los números devueltos por la API coinciden (IDEA 58 · 18/14/14/12 · PA 60 · PB 79 · Δ +19 · 4/6/4/5 · sin alerta). Las `firmas[].fecha` son la fecha del servidor (`fechas.hoy()`), no la de la demo.
- **(e) Avisos esperados.** Las síntesis de la demo son más cortas que los recomendados (§5.117 a, §5.118 c): 13 `recomendacion_no_cumplida` (LB ×5, PA ×2, PB ×2, IC ×4), **ninguno bloquea**; ningún `fuera_de_secuencia`. El test los fija exactos.

## 5.121 · Sesión B-front — lecturas que pedía la demo conectada (2026-10-07, Lucas)

### 5.121 Decisiones a–e de B-front (2026-10-07, Lucas)
Sin cambio de DDL (head `dcc838486407`). Sólo lecturas y fechas del seed; ningún endpoint de escritura nuevo. Código: `schemas/{hce,flujo,referencias}.py`, `services/{flujo,referencias}.py`, `routers/{hce,referencias}.py`, `app/seed_demo.py`.
- **(a) Lista `GET /hce`:** cada fila trae `persona.fecha_nac` y `flujo` = `[{modulo, estado}]` de los cuatro módulos del **año en curso**, con la forma de `modulos[]` de `GET /hce/{id}/flujo` (sin `id` ni `faltantes`; `EstadoEslabon` es la base de `EslabonFlujo`). Se arma **en bloque** (`services/flujo.estados_de_flujo`): **3 consultas fijas** (IDEA, protocolos, informes) con `hce_id IN (…)`, no una por fila — un test mide que las consultas son las mismas con 2 y con 12 filas. Visibilidad igual que antes (`tecnico` sólo sus grupos, 404 fuera de alcance en el detalle; el `flujo` sólo se calcula para las filas ya filtradas).
- **(b) Técnicos del grupo:** `GET /grupos` y el `grupo` de `HceDetalle` exponen `tecnico1`/`tecnico2` = `{id, nombre, rol}` (`null` si el puesto está sin asignar). ⚠️ **`rol` es el rol en el grupo** (`grupo.tecnicoN_rol`: «Psicólogo/a», «Maestro/a»), **no** `Profesional.rol` (`admin`/`tecnico`, de sesión): el pedido no lo aclaraba y lo que la pantalla muestra es el primero. Sin permisos nuevos: `/grupos` y `/profesionales` ya los leía cualquier usuario autenticado. `HceResumen.grupo` y la respuesta del `PATCH /grupos/{id}` (forma plana `tecnicoN_id`/`tecnicoN_rol`) **no cambian**. Efecto sobre 3 tests de contrato viejos (`test_m11_3a2_referencias`, `test_m11_3a_hce` ×2): sólo sus conjuntos de claves esperadas.
- **(c) Fechas del seed (enmienda de §5.120 d, que no las había movido):** PB de Martín → 2026-11-06; IC y recibí → 2026-11-13. **Ningún número cambió** (IDEA 58 · PA 60 · PB 79 · Δ +19 · 4/6/4/5). ⚠️ El test §12-A afirmaba la fecha del recibí (`test_m11_5a_seed_demo.py:78`, «2026-12-19»): **se cambió esa única aserción** a 2026-11-13; el pedido decía «intacto», pero era imposible dejarlo así si se movía el dato que afirma. Las `firmas[].fecha` las pone el servidor (`fechas.hoy()`): **volver a cargar la base de la presentación después del 2026-11-13** (nota en `backend/README.md`).
- **(d) CORS:** `http://localhost:5500` (y `127.0.0.1:5500`) **ya era el valor por omisión** de `Settings.cors_origins`, configurable por `CORS_ORIGINS` (lista JSON). Sin cambio de código; ahora lo fijan tests (preflight 200 con ese origen, 400 con otro; `X-Total-Count` expuesto; la variable se lee).
- **(e) `ci` en cada fila de la lista (B-front-fix, cierre de la revisión):** `HceResumen.ci` = `pendiente` | `registrado`, **el mismo vocabulario y la misma derivación** que `FlujoDetalle.ci` (el `Literal` es uno solo, `EstadoCi`; «registrado» = existe la fila de `consentimiento`). En bloque: **una** consulta (`consentimiento WHERE hce_id IN (…)`), `services/flujo.estados_ci`; el `GET /hce` hace en total 9 sentencias fijas en la conexión de test, con 2 o con 12 filas y en 2 grupos (test con el número exacto). Test de consistencia sobre **todo lo sembrado** por `seed_demo` (los 8, con baja): `flujo` y `ci` de la lista == `/hce/{id}/flujo`. También: preflight CORS de POST y PATCH con `Content-Type: application/json`, aserción real de `fecha_nac`, ejemplos de Swagger de PB/IC con las fechas del seed, y `openapi.json` en el `.gitignore` del backend.

## 5.122 · Sesión Fase 3-a — la demo se conecta a la API (2026-10-14, Lucas)

### 5.122 Las cuatro decisiones del equipo sobre la Fase 3, y el estado de 3-a (2026-10-14, Lucas + equipo)
Sin cambio de backend ni de DDL (head `dcc838486407`): sólo `demo/` y docs. Código: `demo/js/{api,adaptadores}.js` (nuevos), `ui-core.js` (sesión, listado), `expediente.js` (HCE-00 conectado), `utils.js` (componente de modo demo), `css/estilos.css`. Verificación: `demo/verificacion/conectada.js`.
- **(1) Capa de adaptadores.** La demo no se reescribe: `js/api.js` habla con la API y `js/adaptadores.js` traduce a las formas que ya usan los renderers (`nombre`, `apellido`, `ci`, `edad`, `tecnico1_rol`…). Los adaptadores son **funciones puras y no calculan negocio**.
- **(2) Dato de backend y dato de demo, siempre distinguibles.** Una vista o pestaña **no conectada** lleva el mismo panel «**Modo demostración — no se guarda**» (`role="note"`, texto + ícono + borde punteado: no depende del color); un campo suelto sin respaldo en la API lleva la marca de texto «**Solo demo**» o se **oculta**. Un solo componente (`panelModoDemo()` / `badgeSoloDemo()` en `utils.js`; los `<div data-modo-demo>` de `index.html` los completan al arrancar). Nunca se mezcla en una pantalla una persona de la API con datos de ejemplo.
- **(3) El navegador no calcula ningún valor de negocio que se persiste:** totales guardados, Δ, alertas, banda del IDEA, categoría del baremo, sugerencia de VF. Una suma en vivo mientras se tipea sólo se admite rotulada «provisorio»; tras guardar se muestra lo que devolvió la API. (Edad y cédula con puntos son presentación: no se guardan.)
- **(4) Pantallas conectadas el 26/11:** login, listado, HCE-00, CI, IDEA, PA/PB, IC (impreso) y VF. **Todo lo demás queda en modo demostración**: Pendientes, Analítica, Grupos, Inclusión, Ateneos, Usuarios, Intermedia, HCE-DOC, ORG, INC, LOG, PAI, SEV.
- **Estado de 3-a (HECHO):** login real (`POST /auth/login`, token y usuario en `sessionStorage`, `GET /auth/yo` al recargar, 401 → pantalla de login, error en `role="alert"` con foco, el login **muestra a qué API manda la contraseña** porque `?api=` la puede cambiar) · listado desde `GET /hce` (búsqueda, filtro de grupo desde `GET /grupos`, activos/inactivos/todos, paginación con `X-Total-Count`, estado de CI y de LB/PA/PB/IC por fila, «CI pendiente» visible) · HCE-00 **de solo lectura** con los técnicos del grupo y el estado de los módulos del año (`GET /hce/{id}/flujo`) · pestañas de módulos (13), las no conectadas con su panel y **sin datos** · `abrirExpedienteDemo()` conserva el expediente de ejemplo (ids 101–108 de `datos.js`, **no** los de la API) para las vistas de demostración, con su panel.
- **Elecciones de implementación que no estaban escritas:** (a) **caja de búsqueda** → `ci` si trae `.`/`-` o 7+ dígitos (se manda canónica) · `numero` si son ≤ 6 dígitos sin separadores (el N.º de HCE tiene 4 hoy) · `nombre` en cualquier otro caso; una cédula corta sin separadores se lee como N.º de HCE (ambigüedad aceptada de una sola caja) · (b) **«Inactivos»**: la API no tiene ese filtro → se pide todo con `incluir_inactivos=true` y se filtra y pagina en el cliente · (c) **KPIs de Inicio**: sólo los derivables de `GET /hce` (activos · con LB firmada · pendientes de IDEA · CI pendiente); «Evaluaciones registradas» **se retiró** (no sale de la API) · (d) **el alta y la edición no se ofrecen** (no hay nada que guardar todavía): el botón «Registrar nuevo NNA» salió del listado hasta 3-b · (e) los colores de grupo de `datos.js` **no aparecen** en ninguna pantalla conectada (cierra la parte conectada del pendiente de §5.120 c; las vistas en modo demo siguen con sus colores, bajo el panel).
- **Huecos de la API hallados (no se simularon en el navegador):** (i) `GET /hce` no filtra «sólo inactivos»; (ii) la CLI `python -m app.seed_demo` revienta en una consola Windows cp1252 por el «→» de un `print` (con `PYTHONUTF8=1` anda) — es del backend, no se tocó; (iii) **no hay lectura de SEV ni de talleres/nivel de soporte** → esos campos del expediente no se muestran (SEV es M11.3-d).
- ⚠️ **Herramientas que dejaron de andar por `file://`:** el login exige la API y ésta sólo acepta el origen `localhost:5500` (CORS, §5.121 d). `demo/verificacion/fingerprint.js` y `herramientas/verificar_contraste_ui.js` abren la demo por `file://` y esperan el login sin API → **hay que adaptarlas** (servir en 5500 + loguear). El contraste se midió con una copia adaptada: **fallan los mismos 14 pares que en la línea base, con los mismos ratios**; los 5 anillos de foco de §2.6 siguen igual; los componentes nuevos pasan (sin pares nuevos que fallen). **Adaptadas en 3-b (§5.124 g)** y extendidas en 3-c (§5.125).
- **Reparto de la Fase 3:** el de la checklist de §6 (3-a … 3-e), tal como estaba planeado.


### 5.123 Enmienda a §5.62: el trailer `Claude-Session:` se exige sólo si la sesión tiene URL (2026-10-14, Lucas)
- **Qué dice §5.62:** los commits de IPPU cierran con `Co-Authored-By: …` y `Claude-Session: <url de la sesión>`.
- **Qué cambia:** `Co-Authored-By:` sigue siendo **siempre**. `Claude-Session:` es obligatorio **sólo cuando la sesión tiene una URL** (sesiones web/cloud). Una sesión local de la CLI **no tiene** URL y **omite la línea**: no se inventa una ni se deja vacía.
- **Qué no cambia:** los commits ya hechos **no se reescriben** (varios salieron sin el trailer por esta razón, p. ej. `c49c63a`, `88e1d7a`, `4e582bd`).

### 5.124 Fase 3-b — HCE-00 editable, alta con asistente, CI y stepper conectados; y las decisiones de 3-a que no tenían entrada (2026-10-14, Lucas)
Sin cambio de backend ni de DDL (head `dcc838486407`): sólo `demo/`, `herramientas/` y docs. Código: `demo/js/{wizard-nna,expediente,adaptadores,ui-core,recordatorios}.js`, `index.html`, `css/estilos.css`. Verificación: `demo/verificacion/conectada.js` **78/78** (`README.md` de esa carpeta) y `herramientas/verificar_contraste_ui.js`.
- **(a) Alta (`POST /hce`) y edición (`PATCH /hce/{id}`) con el mismo asistente de 4 pasos.** Se **retiran** «Nivel de apoyo», «Talleres» y los selectores de técnico (§5.24 retiró `nivel_soporte`; talleres y técnico por NNA no tienen dónde guardarse). Los técnicos **se muestran** a partir del grupo elegido, nunca se eligen por NNA. El grupo sale de `GET /grupos?anio=`: el año del listado en el alta, el de `GET /hce/{id}/flujo` → `anio` en la edición. Obligatorios con error por campo: nombre, apellido, fecha de nacimiento y **cédula** (los de `PersonaCrear`). **El grupo no es obligatorio** (la API no lo exige): un `tecnico` sin grupo propio recibe el 403 de la API. Todo lo demás que se manda existe en el esquema; lo que no, no está en el formulario. Se muestra **«N.º de HC»** (`hc_historico`), nunca el id interno.
- **(b) La edición manda sólo lo que cambió.** La **anamnesis** (que el `PATCH` reemplaza entera) va **siempre con las cinco claves** —`motivo`, `perinatal`, `desarrollo`, `familiares` y **`observaciones`**, que es donde vive lo que la demo llamaba `antec`— y conserva las claves ajenas que ya hubiera. La **baja** lleva un campo «Fecha de baja»; que falte lo dice **la API** (422 por campo `fecha_baja`), no el navegador. Sin cambios no se llama a la API. Tras guardar se vuelve a pintar **desde la respuesta**; los `warnings[]` se muestran y no bloquean.
- **(c) 409: el mensaje de la API, tal cual.** El navegador **no detecta el rol** para reformularlo (§5.119 d): el `admin` ve «Ya existe una persona con esa cédula» junto al campo; el `tecnico`, el genérico «consultá a dirección» sin campo. Errores: uno por campo (`aria-invalid` + `aria-describedby`) y un resumen `role="alert"` con enlaces, que recibe el foco.
- **(d) CI.** `GET /hce/{id}/consentimiento`: **404 = «CI pendiente»**, un estado y no un error; se **registra** con `POST` y se **edita** con `PATCH`. **Nunca «firmado»**: «registrado» es el estado final, editable. Sin campo de adjunto (documentos, diferidos). Autorizaciones **sin tildar** por omisión y fecha **sin valor por omisión** (no se usa el reloj del navegador). Tras registrar se vuelve a pedir el flujo y la lista a la API.
- **(e) Stepper del expediente** = tarjeta «Flujo del año N» con **una sola fuente**, `GET /hce/{id}/flujo`: el **CI aparte** y la cadena LB → PA → PB → IC con los tres estados de la API (● firmado · ◐ en curso · ○ sin iniciar, glifo **y** texto). **Sin candado, sin «Bloqueado» y sin modal de excepción** en lo conectado (§5.94, §5.95): un módulo fuera de secuencia sólo muestra «fuera de secuencia: falta firmar …» (`faltantes`, informativo). Los módulos aún no conectados (LB/PA/PB/IC/VF) muestran su estado y abren el panel de modo demostración; «Ver auditoría» abre ese mismo panel. El HCE-00 conectado no tiene «Historial clínico», «Tendencia», nivel de soporte ni talleres; el año sale siempre del flujo.
- **(f) Efectos laterales.** El expediente **de ejemplo** (vistas en modo demostración) **pierde sus botones de edición**: el diálogo ahora es de la API y no se mezcla. El diálogo **no se cierra con un clic en el fondo** (se perdería lo tipeado): «×», Cancelar o Esc; es modal (`role="dialog"`, app `inert`, foco al abrir y de vuelta al cerrar, no queda abierto detrás del login).
- **(g) Herramientas.** `herramientas/verificar_contraste_ui.js` corre **sin tocarlo** contra `:5500` con login (reproduce los **mismos 14 pares que fallan que la línea base**, mismos ratios y mismos anillos de foco; las pantallas nuevas no agregan fallas; no pulsa teclas, que cambiaría qué anillos mide). `fingerprint.js` acepta una URL. `conectada.js` pasa `?api=<API>` a la demo y `cargarGrupos()` descarta su respuesta tras «Salir» (carry-over de la revisión de 3-a). ⚠️ **Desde 3-b `conectada.js` escribe**: cada corrida pide una base nueva (README: «Base descartable») y `IPPU_ADMIN_EMAIL`/`IPPU_ADMIN_PASSWORD`.
- **Decisiones de la revisión de 3-a que no tenían entrada (se asientan acá):** **(1)** el login es un **diálogo modal** (`role="dialog"`, `aria-modal`) y la app de atrás queda **`inert`** mientras se ve; tras entrar, el foco va al título de Inicio · **(2)** «**Mi usuario**» pasó a «**Perfil de ejemplo**» (la vista es de demostración y no es la cuenta con sesión) · **(3)** las **etiquetas internas de fase** («Fase 3-x», «3-c»…) **no se muestran** nunca en texto ni en tooltips · **(4)** las cargas en vuelo del expediente y de los grupos se descartan con una guarda de secuencia al cerrar la sesión; `.sr-only` dentro de `.tabla-scroll` (sin desborde a 390 px).
- **Huecos de la API (no se simularon):** `GET /grupos` devuelve **todos** los grupos también a un `tecnico` (§5.119 e), así que el selector ofrece grupos donde no puede dar de alta y recién lo sabe por el 403 al guardar · el 404 de `GET /consentimiento` no distingue «no hay CI» de «no existe el expediente» (alcanza: el expediente ya se leyó) · no hay lectura del año en curso del servidor: en el alta se toma el de los grupos que devolvió la API.

---

### 5.125 Fase 3-c — IDEA, Protocolos A/B conectados; rampa de severidad, marca de NS y suma «provisorio»; y las decisiones de la revisión de 3-b (2026-10-14, Lucas)
Sin cambio de backend ni de DDL (head `dcc838486407`): `demo/`, docs y las dos herramientas de verificación (`herramientas/verificar_contraste_ui.js`, `demo/verificacion/fingerprint.js`, que referenciaban funciones retiradas). Código: `demo/js/evaluaciones.js` (reescrito), `expediente.js`, `flujo.js`, `wizard-nna.js`, `css/estilos.css`. Verificación: `conectada.js` **113/113** (`README.md` de esa carpeta).
- **(a) Dónde viven.** LB, PA y PB se editan y firman **en las pestañas del expediente**, no en vistas sueltas: `view-idea`, `view-prot`, los selectores de NNA y el estado en memoria **se retiraron**. El estado de cada pestaña se conserva al cambiar de pestaña (lo tipeado sin guardar no se pierde); un registro firmado se **presenta aparte, de solo lectura** (no es el formulario con controles deshabilitados). Año = `GET /hce/{id}/flujo` → `anio`.
- **(b) Qué hace el navegador y qué no.** Guardar = `POST` si no existe, `PATCH` **sólo con lo que cambió** (valor bruto contra lo guardado); **firmar** = guardar lo pendiente y `POST …/firmar` **sin cuerpo**, tras una confirmación en la barra («la firma bloquea…»). No hay validación propia: el **422 por `campo`** (`dim.D5`, `items.7.obs`, `evaluador_t2_id`, `fecha_consenso`…) se muestra junto a la dimensión/ítem/campo (`aria-describedby`) y en un resumen `role="alert"` con foco. Un 409 vuelve a leer el registro y lo muestra de solo lectura. Los `warnings[]` se muestran (`role="status"`) y nunca bloquean. Los dos evaluadores son campos del borrador, precargados con los técnicos del grupo (**sólo precarga**: se guardan con el borrador).
- **(c) Suma «provisorio».** Mientras se tipea, la suma y los subtotales se rotulan «**provisorio — suma sin guardar**» y el conteo es «n / 12 dimensiones puntuadas» / «n / 24 ítems puntuados». **Sin banda en vivo** (se retiró la de 3 niveles). Con lo guardado se muestra lo que devolvió la API: total, `esc_*`, banda, `deltas`, `interpretacion`, `alertas`; el total del protocolo es `—` hasta los 24 ítems. Se retiraron de lo conectado `calcularDeltasPB`, el `validarIntegridad` de LB/PA/PB y los totales locales (`calcularDelta`, `deltaInterpreta`, `ALERTA_DELTA`, `lbTotales`, `protTotales` quedan sólo para el IC de ejemplo).
- **(d) Rampa de severidad (notas de accesibilidad §3.1).** Seis pasos de **un solo matiz** (`--rampa-1…6`, banda 1 = claro … 6 = oscuro) para la banda del IDEA y el puntaje de cada descripción (0…8); texto oscuro sobre los pasos 1–4 y blanco sobre 5–6 (contraste de 3-c, medido contra la punta de 3-b: los mismos 14 pares que fallan que la línea base; todo par nuevo ≥ 4,5:1). El **nombre de la banda va siempre escrito** («Moderado · 56–75»); **`nivel_dsm` no se muestra** (no es el nivel de apoyo del NNA). Se borró `.badge-0…8` (la tríada ok/warn/bad sobre una clasificación clínica). ⚠️ **Hueco de la API:** `banda` trae nombre y rango pero **no su orden**; el paso de color sale de un mapa JS por `total_min` (0·16·31·56·76·91; nunca del total). Si el `total_min` no está en el mapa o no es un número **no se infiere un paso**: el chip sale con el estilo neutro `banda-neutra` (fondo neutro, texto de tinta, mismo borde) y el nombre y el rango siguen escritos. Pedir `banda.orden` a la API (después del 2026-11-26); hasta entonces el mapa JS es la única fuente del orden.
- **(e) Marca de NS (§3.2 B).** `NS` es un valor válido del IDEA, **distinto de «sin puntuar» y de cualquier número**: borde punteado, glifo ◌, texto «NS» y «observación insuficiente» para lector de pantalla; su botón es propio y también punteado. «Sin puntuar» es texto en cursiva. Nunca cae en la rampa.
- **(f) Addendas y estado (§3.2 A).** Se agregan con `{texto}` (el autor es el usuario del token; la lista lo muestra por nombre con `GET /profesionales`). El estado del módulo es **sin iniciar · en curso · firmado + «✚ con N addenda(s)»** (glifo y texto) en el encabezado, la pestaña y el stepper; sale de `GET /hce/{id}/idea` y `/protocolo` del año, que se vuelven a pedir tras cada escritura. Firmado un PA, se vuelve a leer **el PB del año** (`GET /protocolo/{id}`): el servidor le completa el Δ si se había firmado antes. HCE-00 muestra la «Línea base IDEA vigente» de `GET …/idea/vigente`; el Δ interanual (`…/idea/delta`) aparece **sólo si la API devuelve uno** (hoy hay un solo año firmado: queda oculto).
- **(g) Sin candados en ninguna pantalla.** Se retiró «Habilitar por excepción» (modal y funciones) y todo bloqueo, también del **expediente de ejemplo** (`moduloHabilitado` siempre habilita; `estadoModulo` = borrador | firmado; sin 🔒 ni «Bloqueado» en el stepper y el panel). El de ejemplo ya no ofrece editar/firmar LB, PA ni PB (sólo el IC, que se conecta en 3-d). `lb_migrado` no se ofrece (post 26/11, §5.104).
- **(h) Decisiones de la revisión de 3-b.** **Selector de grupo:** el `tecnico` ve **sólo los grupos donde es `tecnico1` o `tecnico2`** (por id), sin «Sin grupo asignado» (eso es del `admin`), con uno solo queda elegido; **es presentación**: la autoridad es la API y un 403 (probado con un grupo ajeno simulado) se sigue mostrando. **Cédula:** `wizCambios` compara el texto **bruto** contra el que se mostró al abrir; la canonicalización es de la API. **Marca «Demo parcialmente conectada»:** pasó al pie de la barra lateral (en flujo, `pointer-events:none`): ya no tapa tablas a 1280×800 ni 1280×900. **Diálogo de alta/edición:** «Salir» y un 401 vacían todos sus campos y dejan `WIZ.orig`/`WIZ.grupos` en null.
- **(i) Corrección de la revisión de 3-c (2026-10-14, Lucas).** `conectada.js` pasa a **113/113** con cinco chequeos nuevos: `3c-add1` (la addenda a medio escribir sobrevive al cambio de pestaña y al re-clic), `3c-add2` (relectura demorada con una addenda ajena: lo tipeado sobrevive y la nueva aparece; **verificado que falla** sin la guarda de `evRepintar`), `3c-banda` (`total_min` 56 → su paso; 60, 7 y null → neutro, con el nombre escrito), `3c-tecla` (firma sólo con teclado: Esc cancela sin pedido y un único `POST …/firmar`) y `3c-j9b` (guardar una foto individual y una grupal sin autorización no bloquea ni avisa); `3c-j9` ahora lee el texto completo de los expedientes de ejemplo 101–108, su HCE-DOC y su vista de IC (único 🔒 permitido: el del documento histórico, inmutable, que no es un bloqueo de secuencia). **Se retiró el bloqueo de fotos de la demo** (§5.99: guardar nunca exige autorización; la autorización sólo regula compartir) y «(o habilitación excepcional)» de la nota del IC. Banda con `total_min` desconocido o no numérico → estilo neutro (ver (d)). Confirmación de firma con `aria-describedby` y Esc. **Contraste corregido:** las cifras exactas (cantidad de pares, rango de los nuevos) no se reproducían al re-medir (revisión G11) y se retiraron; vale: los mismos 14 pares que fallan que la línea base; todo par nuevo ≥ 4,5:1. **Regla de edición:** esta entrada se puede corregir mientras la rama no se fusione; **«sólo agregar» rige desde el merge a `main`.**
- **Huecos de la API (no se simularon en el navegador):** `banda.orden` (d) · **un IDEA sobre un expediente sin CI no devuelve aviso** (el LB es el primer eslabón y el CI sólo es un estado, §5.94/§5.116 e): el aviso de secuencia aparece en el PA/PB, no en el IDEA · addendas y firmas traen `profesional_id` sin nombre (se resuelve con `GET /profesionales`) · `GET /grupos` sigue devolviendo todos los grupos a un `tecnico` (la presentación filtra).

### 5.126 Fase 3-d — IC con documento impreso y recibí, y VF; decisiones de impresión y VF sin sugerencia (2026-10-15, Lucas)
Sin cambio de backend ni de DDL (head `dcc838486407`): `demo/`, docs y las dos herramientas de verificación (`herramientas/verificar_contraste_ui.js`, `demo/verificacion/fingerprint.js`). Código: `demo/js/informe-cierre.js` (reescrito), `hce-doc-org-vf.js` (la VF, reescrita), `expediente.js`, `flujo.js`, `evaluaciones.js`, `css/estilos.css`. Verificación: `conectada.js` **155/155** tras la corrección de §5.127 (e) (`README.md` de esa carpeta).
- **(a) Dónde viven.** IC y VF son **pestañas del expediente conectado** (como LB/PA/PB, §5.125 a). Se retiraron `view-ic`, el selector de NNA del IC y, del **expediente de ejemplo**, el IC, el informe, el «recibí», la VF y sus funciones (`cargarIC`, `generarInforme`, `irAEval`, `categoriaBaremo`, `sugiereNivel`, `genVFBorrador`, `vfAlertaVigencia`…); el ejemplo muestra el estado de sus módulos sin acciones. `view-informe` pasa a ser **la vista imprimible conectada** (IC firmado y reporte de VF) y se abre desde las pestañas; no tiene entrada en la barra lateral. `3d-lay`/`3d-lay2` prueban que no queda vista, selector ni manejador (onclick/onchange/oninput) apuntando a algo retirado.
- **(b) IC.** El año sale de `GET /hce/{id}/flujo`. Crear = `POST` con el año y sólo lo tipeado; editar = `PATCH` sólo con lo que cambió (por escala en `sint_escala`). **Los firmantes no se guardan en el borrador** (el IC no tiene columnas de evaluadores, §5.117 b): se **eligen al firmar** entre `GET /profesionales` (precarga con `grupo.tecnico1/2`) y viajan en `POST …/firmar {firmantes:[id, id]}`. Los 422 (incluido `firmantes`/`firmantes.N`) salen junto al campo y en un resumen `role="alert"` con foco; los `warnings[]` (`fuera_de_secuencia`, `recomendacion_no_cumplida`) se muestran en `role="status"` y no bloquean; un 409 (otra sesión ya firmó) vuelve a leer y deja la pantalla **de solo lectura** descartando lo tipeado tarde. Tabla y radares usan `esc_*`, `total`, `deltas`, `interpretacion` y `alertas` de la API, sólo de módulos **firmados** («—» si no): no hay `lbTotales`/`protTotales`/Δ locales (`3d-f` lo verifica sobre el código).
- **(c) Documento impreso.** Se arma con `GET /informe-cierre/{id}/documento`; **cédula y CIE-11 salen de `GET /hce/{id}`** (el documento no los trae), el año de `documento.anio`. **Quienes firmaron** son `informe.firmas[]` (nombre y rol tal como los devuelve la API, en ese orden), nunca los técnicos del grupo de hoy (`3d-c5` firma con el orden inverso al del grupo); los nombres de los autores de addendas se resuelven con `GET /profesionales`. **Sin fila «Soporte»** (§5.24). El grupo es el actual del expediente (limitación de §5.118 b). Sin IC firmado —no creado, o `/documento` responde 409— se muestra **el estado del flujo** y no el documento (§5.3: no hay versiones alternativas). Δ: por escala sólo el número (y «⚠ alerta» si la API lo marca); el total con su lectura. Los radares siguen **separados** (IDEA e IPPU-TEA, §5.2) y se distinguen también por **trazo** (PA punteado con cuadrados, PB continuo con círculos) y llevan texto alternativo.
- **(d) Impresión.** `@media print`: A4, márgenes 16/14 mm; el encabezado con nombre, N.º de HC, C.I. y año **se repite en cada hoja** porque el documento va dentro de una **tabla de maquetación** (`role="presentation"`) cuyo `<thead>` el navegador repite — se midió que `position:fixed` con margen negativo no se pintaba y que un contenedor `div` con `display:table-header-group` no se repetía; tablas, radares, firmas y membrete son indivisibles (`break-inside:avoid`; los radares son bloques en línea atómicos) y el texto fluye entre hojas; navegación, botones y banner no se imprimen. `page.pdf()` de Martín se guarda en `demo/verificacion/salidas/` (**gitignored**). ⚠️ **Corregido (§5.127 a):** «tablas, radares, firmas y membrete indivisibles» y la verificación «también con la impresión ampliada» **no eran ciertas**: con la impresión ampliada (y, en silencio, a escala 1) el impreso salía recortado a la derecha o achicado ~0,71×, porque a ese ancho de hoja valían reglas de pantalla; el `3d-b2` original usaba CSS `zoom` y no lo detectaba.
- **(e) Recibí.** `POST /informe-cierre/{id}/recibi {firmante, fecha}` desde el modal compartido (`#modalFlujo`), que **pasó a ser un diálogo accesible** (`role="dialog"` + `aria-modal`, app `inert`, foco al primer campo, Tab atrapado, Esc, foco de vuelta; también para los modales del expediente de ejemplo). **Sin fecha por omisión** (regla de §5.124 d: no se usa el reloj del navegador); 422 por campo; **una vez** (el segundo intento da 409 en la API y la pantalla se vuelve a leer). El impreso muestra el recibí y deja de ofrecerlo.
- **(f) VF.** `GET` con **404 = «todavía no se creó»**: estado vacío con «Registrar valoración funcional» (formulario de alta, todo opcional; `POST` sólo con lo completado), no un error. `pct` es un campo de **texto** que viaja como string (Decimal) y la API lo valida; `PATCH` sólo con lo que cambió (dominios fusionados uno a uno, `""` borra). **Categoría (`categoria`, `categoria_etiqueta`) y alerta de vigencia salen sólo de la respuesta** y tras cada guardado se vuelve a pintar todo desde ella, con el foco en el resultado. **No hay sugerencia de nivel CIF ni «Autogenerar borrador»** (§5.118: los cortes están pendientes con IPPU; ver `puntos-a-validar.md`): la síntesis dice «la escriben los técnicos». La guía de categorías y prestaciones queda como contenido estático con la marca «Solo demo». **Categorías y niveles de autonomía usan la rampa de un solo matiz de las bandas del IDEA** (`banda-1…6`/`neutra`), nunca ok/warn/bad; el paso sale de un mapa por **nombre** (la API no devuelve el orden) y un nombre desconocido cae al chip neutro con el nombre escrito. El reporte imprimible de la VF lee de la API (VF, PB del año, expediente): la «Evolución del año» usa la **lectura que devuelve el servidor del Δ B−A**, en palabras y sin cifras.
- **Huecos de la API (no se simularon en el navegador):** `categoria` y los niveles de autonomía **sin orden** (mismo hueco que `banda.orden`, §5.125 d) · `/documento` **no trae cédula ni CIE-11** (se piden aparte) · los mensajes de validación de la VF (`pct`, fechas) llegan **en inglés** (los de pydantic: «Input should be a valid decimal») · `estado` de la VF es texto libre (la demo ofrece los cuatro del Prototipo v4 y respeta otro valor guardado) · los firmantes del IC no se guardan en el borrador · addendas sin nombre del autor (se resuelve por `GET /profesionales`, como en 3-c).

### 5.127 Corrección de la revisión de Fase 3-d (2026-10-15, Lucas)
Sin cambio de backend ni de DDL. Corrige y completa §5.126 en su misma rama (`fase3d-cierre-vf`); `demo/` y docs.
- **(a) Impresión A4 sin recorte.** La hoja A4 (688 px útiles a escala 1; 550 a 1,25×; 459 a 1,5×) cae dentro de `@media(max-width:760px)` y `(max-width:700px)` de **pantalla**: la tabla del IC pasaba a `display:block; white-space:nowrap` (ancho mínimo ≈ 935 px) y las firmas a una columna, así que el documento medía más que la hoja y se recortaba o se achicaba solo. En `@media print` se restaura la maquetación de documento (tabla real, sin `nowrap`, firmas en 3 columnas, celdas que parten línea) y el bloque de firmas + pie legal (`.doc-cierre`) y el análisis cuantitativo (`.doc-cuant`) no se parten. **Verificación:** `3d-b0` mide en media print a 688/550/459 px que `.print-wrap` mide **exactamente** el ancho de la ventana; `3d-b2` genera el PDF con la opción `scale` de Playwright (1, 1,25, 1,5; **no** CSS `zoom`, que no cambia el ancho de maquetación) y exige encabezado en cada hoja, tabla/radares/firmas/membrete en una sola hoja, pie legal nunca solo y ningún texto pasado del margen derecho.
- **(b) La edad impresa es la de la fecha del documento.** IC: `informe.fecha` (de `/documento`); reporte de VF: `fecha` de la valoración; en ambos, con `fecha_nac` de la API. **Nunca el reloj del navegador**: reimprimir un documento no cambia la edad que figura en él. Sin fecha del documento no se imprime edad. En el reporte de VF «Fecha del reporte» pasa a «**Fecha de impresión**» (esa sí es la de hoy). `3d-edad1`/`3d-edad2` adelantan el reloj de la página a 2033.
- **(c) Un 409 no es un aviso.** Los conflictos (otra sesión firmó o registró lo mismo) se rotulan «**Cambió en el servidor:** …» y nunca bajo «Avisos de la API (no bloquean)», que queda para los `warnings[]` de una escritura que salió bien. Aplica a IC, VF, IDEA/PA/PB y CI (`avisosCuerpoHtml`, marca `{conflicto: true}`).
- **(d) Foco tras el diálogo compartido.** Al cerrar `#modalFlujo`, si quien lo abrió fue repintado (el botón desaparece), el foco pasa al mismo control si reaparece, o al encabezado de su tarjeta / `#icTitulo`: nunca a `<body>`. Cubre el recibí con 409 y los modales del expediente de ejemplo (`3d-n5`, `3d-foco`).
- **(e) Correcciones de la mini-revisión (2026-10-15, Lucas).** (1) **`3d-b2` ya no mide el margen derecho desde el PDF:** `pypdf` daba un `maxx` erróneo a escala 1 (≈2046 pt para texto que está a ≤ 544 pt) y la corrida fallaba siempre; el desborde a la derecha lo cubre `3d-b0` (media print a 688/550/459 px, `scrollWidth` == ancho de la ventana) y `3d-b2` conserva el resto (encabezado en cada hoja; tabla, cada radar, firmas + pie legal y membrete en una sola hoja; pie nunca solo) y el PDF `salidas/ic-martin.pdf` con las hojas por escala (hoy **3 / 5 / 6**, no «3 / 5 / 7»). Prueba: con sólo el `estilos.css` de `b08f040` fallan `3d-b0` y `3d-b2`; restaurado, pasan. (2) **Impresión:** `.doc-cuant` **sí puede cortarse** entre el bloque de la tabla y el de los radares (cada uno sigue con `break-inside:avoid`); lo que §5.127 a dijo sobre «el análisis cuantitativo no se parte» queda **reemplazado** por esto: así la tabla empieza en la hoja 1 a escala 1 y el membrete no queda solo con media hoja en blanco. `.doc-cierre` (firmas + pie) sigue indivisible. (3) **Cifras de contraste de §5.127 reemplazadas:** donde §5.126/§5.127 den conteos o rangos exactos, vale sólo «**los mismos pares que fallan que la línea base**» y «**todo par nuevo ≥ 4,5:1**» (CLAUDE.md, «reglas de higiene»). (4) **Se agregan** (§5.127 c) `3d-ci409` y `3d-ev409-lb/-pa/-pb`: 409 con escritura concurrente real; `conectada.js` pasa a **155/155**.
- **(f) Foco tras un 409 del CI (decisión).** `cargarCi()` repinta el panel y destruía el resumen «No se pudo guardar» y su foco (quedaba en `<body>`, y el resumen viejo convivía con «Cambió en el servidor»). Ahora, ante un 409 al registrar el CI, **no se arma ese resumen**: se muestra «Cambió en el servidor», se vuelve a leer el CI y el foco va a un destino estable, **`#ciTitulo`** (como `#evTitulo` en IDEA/PA/PB). Los demás errores del CI siguen igual (resumen con foco, formulario intacto). El glifo `.big` de los estados vacíos es decorativo: `aria-hidden="true"` en todos.

### 5.128 L3: monorepo, carpeta `implementacion/L3-asistente-virtual/` y el plan en `docs/planes/` (2026-10-15, Samuel)
- **(a) Monorepo.** L3 vive en este repo, en `implementacion/L3-asistente-virtual/`, y le aplican las reglas compartidas de docs, herramientas y datos sensibles. Separar el repo partiría la fuente de verdad (§5.3).
- **(b) Nombre de la carpeta:** `implementacion/L3-asistente-virtual/`. Se crea en la F1; no se crean carpetas vacías.
- **(c) El plan queda en `docs/planes/L3-asistente-plan.md`.** El README de la carpeta, que se escribe en la F1, es corto, enlaza al plan y no lo reemplaza; es el único documento nuevo permitido.
- **(d) Reversible:** L3 se puede extraer con su historial. **Sigue pendiente** la decisión de arquitectura (servicio separado con almacén propio, plan §2.3).

### 5.129 L3: Samuel la lleva solo, recomendaciones del plan adoptadas y sin compuerta frente a L1 (2026-10-15, Samuel)
- **(a)** L3 la lleva **Samuel solo**: sus decisiones no esperan revisión del equipo. La regla anti-contradicción frente a §5 sigue rigiendo.
- **(b) v1 sólo para técnicos**; fuentes de v1, sólo documentos institucionales: el Catálogo de puertas y la HCE quedan fuera (plan §2.1 y §2.2). Lo confirma IPPU (IPPU-L3-1 y 2).
- **(c) Servicio separado** que no importa `app.models`, con almacén propio (plan §2.3). El hosting sigue abierto (`puntos-a-validar.md` §2.5).
- **(d) Se aceptan LIM-10** (no redacta registros clínicos) **y LIM-11** (documentos en conflicto: muestra los dos y no elige) (plan §8).
- **(e) Las preguntas de L3 a IPPU las lleva Samuel**, no Lucas; cuándo se mandan lo decide él.
- **(f) Sin compuerta:** L3 avanza a su ritmo, sin tope de horas ni pausas atadas al calendario de L1, y la F1 arranca ya. Siguen: no tocar `implementacion/L1-hce-idea/`, sólo datos simulados (§5.104) y ningún documento de IPPU en una API hospedada sin autorización escrita (plan §2.4).

### 5.130 L3: índice léxico, F1-c partida en dos y límites por reglas fuera del modelo (2026-10-15, Samuel)
- **(a) Índice léxico BM25** con la biblioteca estándar, fragmentos por sección (`##` y `###`). El índice se regenera con `python -m asistente.indexar` y queda fuera de git (`indice/`).
- **(b) La F1-c se parte** en F1-c1 (límites por reglas) y F1-c2 (corredor de evaluación y umbral).
- **(c) Los límites se detectan por reglas, antes del modelo y fuera de él** (`asistente/limites.py`). El proveedor de la F1-d no decide límites.
- **(d) LIM-6 enmascara, avisa y sigue respondiendo** con la consulta enmascarada; la consulta original no se devuelve ni se registra.

### 5.131 L3: el corredor de evaluación puntúa por comportamiento (2026-10-15, Samuel)
- **(a)** El corredor (`python -m asistente.evaluar_banco`) puntúa por **comportamiento**: A, B, C, derivación o responde con cita. El LIM que dispara es informativo y no puntúa. B07 (LIM-1 o LIM-3) queda como está hasta que responda IPPU.
- **(b) Cita correcta** = la sección esperada, su padre o su hija, entre las 3 citadas.
- El valor del umbral de LIM-5 **no** se registra acá: es [supuesto] en `asistente/flujo.py` (`UMBRAL_DEFECTO`).

### 5.132 L3: set retenido intocable, umbral provisional y orden F1-c3 → F1-c4 → F1-d (2026-10-15, Samuel)
- **(a)** El set retenido (`eval/retenido-v0.md`) **no se usa para ajustar reglas**: sus fallos se registran y se arreglan con casos aparte, nunca mirando el retenido.
- **(b)** `UMBRAL_DEFECTO = 0.0` es **provisional**: no se fija hasta tener más casos de la categoría 2 («sin respaldo»).
- **(c) Orden:** F1-c3 (medición) → F1-c4 (recuperación y categoría 2) → F1-d (proveedor).

### 5.133 L3: límites clínicos por «caso particular + pedido», con casos propios (2026-10-15, Samuel)
- **(a)** Los límites clínicos (LIM-1, 2, 3, 4, 8 y 10) se detectan por **«caso particular + pedido de juicio o acción»**; ante la duda, se rechaza. Redactar un registro y pedir un diagnóstico se rechazan haya caso o no. Siguen siendo reglas fuera del modelo (§5.130 c).
- **(b)** El falso positivo de crisis ante preguntas generales (por ejemplo, «violencia» en una consulta sobre el documento) **se acepta como costo**. La frontera la valida IPPU (IPPU-L3-3).
- **(c) Orden:** F1-c4 (límites) → F1-c5 (retenido v1) → F1-c6 (recuperación y categoría 2, con casos escritos por Samuel) → F1-d.
- **(d)** Los ajustes se hacen **con casos propios**: los retenidos nunca se copian ni se parafrasean de cerca en reglas o tests.

### 5.134 L3: la lista de excepciones de LIM-6 queda corta hasta que valide IPPU (2026-10-15, Samuel)
- La lista de palabras con mayúscula que LIM-6 **no** enmascara (siglas, IDEA, IPPU, UTEC, LIDIA, HCE, Documento Técnico, Protocolo, MIDES, BPS, ASSE, INAU, ANEP) **queda corta** hasta que IPPU la valide (IPPU-L3-3). Ante la duda, se enmascara.

### 5.135 Fase 3-e — accesibilidad y pasada visual de las pantallas conectadas (2026-10-16, Lucas)
Sin cambio de backend ni de DDL (head `dcc838486407`): `demo/`, docs y las herramientas de verificación. Rama `fase3e-accesibilidad`. Código: `css/estilos.css` (tokens y foco), `js/utils.js` (estados compartidos, trampa de Tab, confirmación de descarte), `api.js` (mensajes de validación), `wizard-nna.js`, `flujo.js`, `expediente.js`, `evaluaciones.js`, `informe-cierre.js`, `hce-doc-org-vf.js`, `ui-core.js`, `catalogos.js`, `index.html`. Verificación: `demo/verificacion/conectada.js` **181/181** (155 + 26 de la 3-e) y `herramientas/verificar_contraste_ui.js` (ampliada). Notas: `docs/guias/notas-accesibilidad-ui.md`, reescritas.
⚠️ **Numeración.** El encargo pedía §5.128, pero **§5.128–§5.134 ya los tomó L3** (Samuel, 2026-10-15): esta decisión es el **siguiente §5 libre, §5.135**.
- **(a) Regla de color.** `--ok` / `--warn` / `--bad` **nunca** pintan una clasificación clínica (bandas del IDEA, insignias de puntaje, categorías y niveles de la VF, tampoco las cifras sueltas de un KPI). Quedan para: error de validación y su resumen (`bad`), confirmación destructiva o irreversible (`bad`), avisos no bloqueantes de la API y «Cambió en el servidor» (`warn`), y marcadores de estado de flujo / CI **con glifo + texto** (no se recolorearon sólo para salir de la tríada). Tokens con nombre: la rampa de un solo matiz (`--rampa-1…6`, `--rampa-neutra-*`), los marcadores de estado de módulo (`--st-*`), la marca de NS (`--ns-*`), el aviso (`--aviso-*`), el anillo (`--ring`, `--ring-dark`) y las acciones (`--accion-firma`: «Firmar» es irreversible pero **no** es un error ni un estado, así que dejó de usar `--ok`). Vistas de demostración: `IDEA_BANDAS[].color` y `colorBanda()` **se retiraron** (cada banda lleva su `paso` en la rampa), la distribución por banda de Analítica pinta con la rampa y las cifras de sus barras viven **fuera** del relleno (no hay texto sobre el color de una serie).
- **(b) Anillo de foco.** **Uno solo**, sólido, `2px` con `2px` de separación, en todo lo operable y en lo que recibe el foco por programa: un único `:focus-visible`; ya no hay `box-shadow` translúcido ni `outline:none` (salvo `<main>`, destino del salto). `--ring` cambia a `--ring-dark` por herencia sobre el cromo oscuro. `scroll-padding` evita que la barra superior o la de totales tapen lo enfocado (2.4.11). **Enlace «Saltar al contenido»** como primer Tab (a `<main id="contenido">`), inerte mientras un diálogo modal está abierto. `#panelExp` lleva `tabindex="0"` sólo cuando no hay nada operable adentro (los módulos en demostración). **Tabindex móvil en el editor del IDEA** (un punto de Tab por dimensión; flechas, Inicio y Fin dentro de ella). El toast pasó a `role="status"`.
- **(c) Confirmar al cerrar con datos tipeados.** × , Cancelar y Esc de un diálogo (alta/edición y los del flujo: recibí, autorización de imagen, ejemplo) piden confirmación **si lo tipeado difiere de lo que tenía al abrir** y la persona tocó algo (volver al valor original no cuenta; que llegue el grupo preseleccionado de la API tampoco). La confirmación es una banda destructiva **dentro** del diálogo (no un segundo diálogo), con foco en «Seguir editando»; Esc también sigue editando; «Descartar y cerrar» cierra, **vacía los campos** y devuelve el foco. **«Salir» y el 401 siguen cerrando y limpiando SIN preguntar** (§5.125 h). Si quien abrió el diálogo ya no existe, el foco va a un destino estable (el título), nunca a `<body>` (§5.127 d, ahora también para el alta/edición y para un diálogo recién cerrado que todavía figura como activo).
- **(d) Línea base de contraste nueva.** La herramienta se amplió: recorre todas las pantallas y diálogos conectados (lista en la propia salida), mide el **texto que se escribe en un campo**, el **borde de los campos** (3:1, 1.4.11) y el **anillo con teclado real** contra el fondo que queda detrás, y separa «conectadas» de «sólo demostración». Medida sobre una base recién cargada: **no falla ningún par ni borde**, ni conectado ni demostración (tabla vacía en `notas-accesibilidad-ui.md` §2.3). **Desde ahora «los mismos pares que fallan que la línea base» = ninguno, y todo par nuevo ≥ 4,5:1.** Lo que hizo falta: `--ink-3` deja de ser color de texto (queda para filetes), `--warn-ink`/`--teal-ink` para texto sobre su fondo suave, `--on-dark-*` para el cromo, `--control-borde` para los campos, y texto elegido contra su fondo en el mapa de calor.
- **(e) Mensajes de validación en castellano (sólo presentación).** `api.js` traduce los 422 de **Pydantic** (obligatorio, número/entero/fecha inválidos, menor/mayor o igual, largo máximo/mínimo, decimales) y usa un genérico en castellano para un tipo que no está en la tabla («El valor ingresado no es válido.»); **los mensajes de negocio ya en castellano pasan intactos** y `Value error, …` se muestra sin el prefijo. Sólo para 422; el `campo` no cambia; el original queda en `mensajeOriginal`. **No se valida nada en el navegador.** ⚠️ El hueco de la API sigue: **el backend sigue mandando esos mensajes en inglés** (§5.126), no se tocó.
- **(f) Otros acuerdos.** Cargando · error (con «Reintentar») · vacío son **un solo componente** en todas las pantallas conectadas (`estadoCargandoHtml`/`estadoErrorHtml`/`estadoVacioHtml`); la autorización de imagen se rotula como lo que es (regula **compartir**, no guardar, §5.99); el CSS muerto se retiró (excepción, bloqueado, `.score-chip`, `.s-high/mid/low`, el gráfico de barras viejo…) y los comentarios que hablaban de candados o excepciones se corrigieron; `3e-hoja1`: a escala 1 la tabla cuantitativa del IC empieza en la hoja 1 (a 1,25× y 1,5× puede caer en la 2: aceptado).
- **(g) Qué NO se hizo.** Ninguna prueba con lector de pantalla ni con ampliación real: todo es automático. Tabindex móvil del Likert de PA/PB, el reflow a 320 px fuera del listado y HCE-00, los estados `:hover`, los SVG de los radares y la vista legada «Intermedia»: en `notas-accesibilidad-ui.md` §6.
- **(h) Cierre de la revisión de 3-e (2026-10-16).** `verificar_contraste_ui.js` **nunca escribe en la API, por construcción**: un `ctx.route` sobre la base de la API deja pasar sólo GET (y OPTIONS) y `POST /auth/login`; las dos confirmaciones de firma que pulsa (IDEA de Joaquín, PA de Sofía) reciben un **422 enlatado** con la forma `{code, detail[]}`, copiado de un 422 real del mismo endpoint, y cualquier otro POST/PATCH/PUT/DELETE se **aborta** y termina la corrida con código 1 nombrándolo; los contadores se imprimen al final y `VERIFICAR_AUTOPRUEBA=1` prueba el filtro (un POST sin ruta → código 1). Los marcadores `ok`/`warn`/`bad` que quedan en vistas sólo-demo (`flujo.js` Sí/No, `hce-doc-org-vf.js` INAU/BPS, `inclusion.js`, `recordatorios.js`) son **marcadores de estado con texto**, permitidos por la regla de color (a): sin cambio.
- **Huecos de la API.** Ninguno nuevo. El de los mensajes de validación en inglés (§5.126) se **mitiga en la presentación** y sigue abierto en el backend.

### 5.136 Higiene H1 — qué se descarta del repo, con qué criterio, y qué pasa con los prompts de sesión (2026-10-16, Lucas)
Sin cambio de backend ni de DDL (head `dcc838486407`). Rama `higiene-h1`. Lo que sale queda en la historia de git (precedentes §5.5 y §5.29); ningún archivo se reescribió para esconder que existió.
- **(a) Criterio.** Un archivo sale del repo cuando se cumplen las tres: (1) **nada lo carga ni lo corre** —ni código, ni herramienta, ni build—; (2) **ninguna referencia viva lo nombra** —sólo §5, la bitácora y los registros históricos (`puntos-a-validar.md`, `preguntas-ippu.md`, `consulta-a-ippu.md`, `respuestas-*`, `pendientes-resueltos.md`), que lo citan como historia—; (3) **lo que importaba de él ya está en una decisión firmada, o se regenera cuando haga falta**. Cada borrado se confirmó con un grep antes de hacerlo; el resto de los archivos que lo nombraban se corrigió en el mismo commit con la edición mínima.
- **(b) Qué cayó bajo ese criterio** (por clase, no por archivo): los **prompts de sesión** y los **relevamientos fechados** (fotos de un día: lo que importó vive en §5 y en la bitácora) · los **planes de ronda ya cerrados** y la agenda de la reunión con IPPU (rondas M0–M11 y M12 cerradas; sus decisiones son §5.2–§5.92) · el **borrador de color y significado clínico** (su propio banner pedía borrarlo cuando la regla se firmara; se firmó en §5.135 (a)) · las **herramientas sin uso** (el extractor del Prototipo v4 —el Prototipo v4 ya no es normativo, §5.92, y el JSON que lee el build está versionado—, el conversor Docling —sin uso desde agosto; cuando llegue un documento nuevo de IPPU se convierte en ese momento— y **graphify** —el grafo no se regeneró después de instalarlo—, con su `.graphifyignore` y sus líneas en `.gitignore` y `.gitattributes`) · la conversión Markdown de **la demo propia de junio** (`hce_idea_ippu_demo.md`: la historia muestra que es del equipo —primer commit del 2026-06-30, bitácora «Demo L1 extendida a v3.1 (Lucas + Claude)»— y que el HTML de origen ya se eliminó en §5.5; no es una fuente de IPPU).
- **(c) Qué NO se tocó:** `docs/fuentes/`, `docs/prototipo-v4/`, el resto de `docs/markdown/` (incluido `modelo-datos.md`), los registros nombrados en (a), la bitácora, `fingerprint.js` y `comparar.js`, y todo lo de L3. `calcularDelta` (`catalogos.js`) **se queda**: `fingerprint.js` la ejecuta, la cita `esquema-datos-v2.md` y el README de la verificación; no tiene 0 referencias.
- **(d) Enmienda a §5.75 (la línea que decía «los `docs/prompts/*` y `docs/notas/relevamiento-…` son registro histórico y no se editan»):** siguen sin editarse —ahora además no están—. Y **los prompts de sesión viven en el documento de plan del equipo** (p. ej. `docs/planes/L3-asistente-plan.md` para L3), **no en `docs/prompts/`**: la convención de esa carpeta queda derogada.
- **(e) Cierre de las observaciones de la revisión de 3-e.** §5.99 recupera **su texto original** (la reescritura al pasado de la 3-e se deshizo); al pie lleva sólo una nota fechada con autor. La verificación de que `subirFoto` y `subirFotoGrupo` guardan sin consultar `autImagen` (`3c-j9b`) estaba en la nota que se retira de §5.99, no en §5.135 (h). Los botones primarios que pisaban el fondo con `--teal` en línea (addenda del flujo, «Siguiente ›» de la vista legada de Intermedia) usan el estilo primario estándar; ya no queda ningún `background:var(--teal)` en línea en `demo/`, y salió la regla de hover que existía sólo para ellos. Código muerto: salió la rama `k.color` de los KPI de Analítica (nadie la alimentaba) y el comentario de `ui-core.js` dejó de decir «etiqueta/color».
- **(f) Fuera de git:** las bases descartables que dejaron las sesiones de la Fase 3 y sus revisiones se borraron de Postgres; quedan `ippu` e `ippu_test`.

### 5.137 Higiene H2 — qué lleva cada documento de entrada, regla de cifras y de ramas, y §6/§7 sólo con lo abierto (2026-10-16, Lucas)
Sin cambio de backend, de DDL ni de código (head `dcc838486407`). Rama `docs/h2-documentos-de-entrada`. Reescribe `CLAUDE.md`, `README.md`, `docs/estructura-repositorio.md`, `demo/verificacion/README.md` y, en este archivo, la cabecera, §0, §4, §6 y §7; de §5 sólo agrega esta entrada. No toca nada de L3 (§5.128–§5.134 ni sus ítems de §6).
- **(a) Qué lleva cada documento.** `CLAUDE.md` lleva **sólo lo que rige hoy**: arranque de sesión, regla anti-contradicción, precedencia normativa (§5.92, §5.93), privacidad, mapa del repo, **un** bloque «Cómo correr» (cada comando una vez), las reglas de negocio de L1 en vigor con su §, las reglas de higiene de verificación y una línea de lo posterior al 26/11. **No lleva historia** de rondas (M11/M12, conteos de tests o de tablas, rondas cerradas): eso vive en §5, la bitácora y `docs/pendientes-resueltos.md`. `README.md` es para personas: qué es el proyecto, las cuatro líneas, el estado de L1 en un párrafo, cómo correr (→ `CLAUDE.md`), dónde está cada cosa, equipo y privacidad. Los prompts de sesión viven en el plan del equipo (§5.136 d); el de L1, enlazado en la cabecera de este archivo.
- **(b) Regla de cifras.** Las cifras que cambian (tests, tablas, hojas del impreso) **no se escriben en `CLAUDE.md` ni en `README.md`**: las lleva la cabecera de este archivo y las mide `herramientas/verificar_estado.py --check`. **Contraste:** la documentación no afirma cantidades ni ratios de contraste (cuántos pares, entre qué valores); escribe «ningún par falla» (línea base, §5.135) y «todo par nuevo ≥ 4,5:1». **Sí** pueden escribirse los conteos de chequeos que pasan (`181/181`) en la cabecera y en la bitácora, y los ratios en un comentario de CSS junto a su token.
- **(c) Ramas y remotos** (precisa §12.2, que decía «pushear siempre a ambos»): las **ramas se suben sólo a `origin`**; `main` avanza por fast-forward (`git merge --ff-only`) y se sube a `origin` **y** a `gitlab`, sin `--force`.
- **(d) §6 y §7 sólo con lo abierto.** Lo cerrado y lo superado por decisiones posteriores se mudó **verbatim** a `docs/pendientes-resueltos.md` (sección «Movido el 2026-10-16»), cada bloque con la decisión o el motivo que lo cierra (`P-NN`, `Q-NN`, `S-01`); `handoff.md` conserva los encabezados «6.» y «7.» (técnica del stub de §5.84). §6 quedó en tres grupos: L1 hasta el 2026-11-26 · L1 después · L3. Siete ítems quedaron **partidos o reescritos** (`P-05`, `P-07`, `P-15`, `P-17`, `P-22`, `P-27` y `P-32`): el original está intacto en el archivo y en §6 queda lo que seguía abierto. Los ítems de L3 de §6 no se tocaron. Un ítem abierto («Aclararle a IPPU») recibió la edición mínima de reemplazar el nombre de la agenda de la reunión, que borró H1 (§5.136). La lista «DECIDIDO, SIN IMPLEMENTAR» se revisó contra lo que construyó M11.3: su única entrada viva es la de §5.103 (B12).
- **(e) Sin baseline del *fingerprint*.** `fingerprint.js` y `comparar.js` no tienen ni tendrán una captura de referencia versionada; se comparan dos árboles con `git worktree` (la opción que el README de agosto recomendaba sin adoptar). Las opciones de baseline y la historia del harness salen de `demo/verificacion/README.md`.
- **(f) Plan de L1.** La secuencia D0, F1–F3 y C1–C7 hasta el 06/11 es la del plan del equipo del 2026-10-16 (enlace en la cabecera); las decisiones que la sostienen están en §5.138. Trae al desarrollo previo al 26/11 lo que el bullet de §6 dejaba «sólo si sobra tiempo después del ensayo» (el «resto de M11.3-d» de §5.118 (e): SEV, INC, documentos, foto, ORG y auditoría) y lo que no entre queda en el segundo grupo de §6. §5.106 sigue rigiendo: M11.3-d es parte de la entrega del 26/11.

### 5.138 Decisiones del equipo para el desarrollo de la demo (2026-10-16, Lucas)
Sin cambio de backend, de DDL ni de código. Son las decisiones que sostienen el plan de L1 (enlace en la cabecera; §5.137 f); cada sesión del plan las cita desde acá. Nada de L3.
- **(a) Alcance y fecha.** El resto de M11.3-d (lectura de HCE-LOG, SEV, ORG, INC y DOC con fotos) y las vistas institucionales entran **antes del 2026-11-26**, en las sesiones del plan de L1. **El alcance nuevo cierra el 2026-11-06.** Lo que no entre se corta en el orden de §6. Sigue rigiendo §5.106.
- **(b) Archivos de HCE-DOC.** Se guardan en una **carpeta local del backend, fuera de git**; `archivo_ref` guarda la **ruta relativa**; la descarga es **autenticada**; hasta **10 MB**; sólo **PDF, JPG y PNG**. Enmienda a §5.66 sólo en lo que difería a Fase 6 el almacenamiento de estos archivos; los adjuntos de ateneos no se deciden acá (siguen en §6).
- **(c) PAI.** Entra **sólo si sobra tiempo**; si no, queda después del 26/11 (§5.104 B3).
- **(d) HCE-SEV.** Se guarda **entero —los dos dominios— o no se guarda**; se resuelve en la interfaz y **el esquema no se toca**. El guardado parcial se revisa sólo si sobra tiempo.
- **(e) Vista legada «Intermedia».** Se quita (ya está en §6).
- **(f) Navegación.** Sigue la estructura de servicios de IPPU: **«General»** y **«Servicio de Atención Diurna»** (§5.11). Taller Terapéutico y Clínica siguen fuera de alcance (§5.12) y **no se muestran**.
- **(g) Revisiones.** Una review por bloque de 2–3 sesiones, con Sonnet en esfuerzo alto.
- **(h) Dirección del frontend.** Una **historia clínica electrónica moderna y profesional**.

### 5.139 D0 — la presentación con un comando y la guardia de destino de las CLI (2026-10-16, Lucas)
Sin DDL (head `dcc838486407`), sin cambio de la demo ni endpoints nuevos. Rama `d0-presentacion`. Código: `app/core/destino.py` (nuevo), `main()` de `app/seed_demo.py` y de `app/crear_usuario.py`, `tests/test_d0_guardia_destino.py`, `herramientas/preparar_presentacion.ps1` y `herramientas/verificar_presentacion.js`.
- **(a) Guardia de destino.** `app.seed_demo` y `app.crear_usuario` imprimen la base a la que van a escribir —el nombre de `DATABASE_URL` **tal como la ve el `engine`**: la variable de entorno o, si no está exportada, el `.env`— y la URL de la API, y **salen con 1 sin escribir** salvo que `IPPU_SEED_DESTINO` valga **exactamente** ese nombre. Es el caso de la revisión de 3-e (seed sobre la base de trabajo por no exportar `DATABASE_URL`): ahora dice «ippu» y frena. Va **antes** de las credenciales, la red y la base. Las funciones (`cargar_demo`, `preparar_usuarios`, `crear_usuario()`) no se guardan: las llaman los tests y la otra CLI. Consecuencia: en «Cómo correr», los pasos 2 a 4 exportan `IPPU_SEED_DESTINO` junto con `DATABASE_URL`.
- **(b) La base de la presentación se llama `ippu_presentacion`** (API `:8000`, demo `:5500`). `preparar_presentacion.ps1` se niega siempre a recrear `ippu_test` y las bases del sistema, y a recrear `ippu` salvo `-ConfirmarBaseDeTrabajo`; valida el nombre, los puertos y las contraseñas **antes de tocar nada**. Las contraseñas salen **sólo del entorno** (`IPPU_PASSWORD` del admin, `IPPU_DEMO_PASSWORD` de los técnicos; `IPPU_EMAIL` opcional) y no se imprimen nunca. La conexión a Postgres es la del `.env` con otro nombre de base.
- **(c) Volver a correrlo da lo mismo.** Detiene **sólo lo que arrancó la corrida anterior** (PID y hora de inicio guardados en `%TEMP%\ippu-presentacion.json`; un PID reciclado no se mata) y rehace todo. Un puerto ocupado por otro proceso **frena el script y lo dice**: no se mata lo ajeno. Si algo falla a mitad, detiene lo que arrancó y sale con 1. `-Detener` hace lo primero y no toca la base. Las variables de entorno de la terminal se restauran al terminar.
- **(d) Chequeo de sólo lectura.** `verificar_presentacion.js` usa el mismo filtro que `verificar_contraste_ui.js` (sólo `GET`, `OPTIONS` y `POST /auth/login`; lo demás se aborta y termina en 1; `VERIFICAR_AUTOPRUEBA=1` lo prueba) y comprueba lo que se va a mostrar: el técnico entra, los 7 activos, Martín (LB 58 con su banda, PA 60, PB 79, Δ +19), cada cifra igual a la de la API, y su IC impreso. Una línea `OK` (exit 0) o una `FALLA …` que nombra el primer problema (exit 1).
- **(e) Después del 2026-11-13** se recarga con ese comando y ese chequeo (§6). **Huecos de la API:** ninguno.

## 6. Pendientes / próximos pasos (sugeridos)

> **Sólo lo abierto.** Lo cerrado y lo superado por decisiones posteriores se mudó el 2026-10-16, verbatim y con la decisión que lo cierra,
> a `docs/pendientes-resueltos.md` (sección «Movido el 2026-10-16», `P-NN` y `Q-NN`; §5.137 d). Las citas «§6» siguen resolviendo (§5.84).
> Tres grupos: **L1 hasta el 2026-11-26** · **L1 después** · **L3** (Samuel). Plan de L1 y prompts de sesión (§5.136 d): https://claude.ai/artifact/MBRpxNWCpW2qd2CxhsLS5S

### L1 hasta el 2026-11-26
- [x] **Higiene H2** — **HECHO 2026-10-16** (§5.137): `CLAUDE.md`, `README.md`, `docs/estructura-repositorio.md`, `demo/verificacion/README.md` y, en este archivo, la cabecera, §0, §4, §6 y §7 reescritos sobre el árbol que dejó H1; lo cerrado y lo superado de §6/§7 está en `docs/pendientes-resueltos.md`.
- [ ] **Desarrollo de la demo hasta el 06/11** (plan L1, enlace arriba; el alcance nuevo cierra el 06/11): **D0 — HECHO 2026-10-16** (§5.139: `preparar_presentacion.ps1`, guardia de `seed_demo`, `verificar_presentacion.js`) · **F1** estructura del expediente y del listado · **C1** HCE-LOG (`GET /hce/{id}/auditoria`) · **C2** HCE-SEV · **C3** HCE-ORG · **F2** Pendientes y Grupos conectados · **C4** HCE-INC · **C5** HCE-DOC (archivos, autorización de imagen, fotos) · **C6** Ateneos y capacitación (con el indicador de abajo) · **C7** Analítica institucional · **F3** pasada final. Una review por bloque; si falta tiempo se corta en este orden: C7, C6, los archivos de C5, la parte Grupos de F2. C1–C5 son el «resto de M11.3-d» de §5.118 (e), antes diferido.
- [ ] **Guion de la demo del 2026-11-26** (sesión aparte; **no** es parte de la 3-e) · ensayo.
- [ ] **Recargar la base de la presentación después del 2026-11-13** (las firmas llevan la fecha de la corrida, §5.121 c): con `IPPU_PASSWORD` e `IPPU_DEMO_PASSWORD` en la terminal, desde la raíz, **un comando** —`powershell -ExecutionPolicy Bypass -File herramientas\preparar_presentacion.ps1`— y **el chequeo** —`node herramientas\verificar_presentacion.js`, que tiene que decir `OK`—. Se para con `-Detener`. Detalle: `CLAUDE.md`, «Presentación», y §5.139.
- [ ] **Tres puntos de presentación en las vistas en demostración** (verificados en el código el 2026-10-16; el primero de los cuatro originales —el total del IDEA en vivo con los cortes derogados de §5.13— ya no existe tras la 3-e): (1) `renderUsuario()` (`grupos-usuario.js`) arma su propia cabecera con `<h1>` además de la estática de `index.html`; (2) el detalle de Ateneos (`ateneos.js`) repite su `<h1>` bajo el `h1.pagetitle` estático; (3) el comentario de `grupos-usuario.js` (líneas 14–16) afirma los cuatro colores de grupo derogados por §5.61 — **no se corrige sin verificar en navegador**: esos nombres pueden ser claves de búsqueda; F2 conecta Grupos y reemplaza esa vista. **Dueño: Lucas.** Texto original: `P-15` de `docs/pendientes-resueltos.md`.
- [ ] **Quitar la vista legada «Intermedia»** (`view-intermedia` en `demo/index.html`, no expuesta desde M5.3) y cualquier referencia que quede en el panel de Inicio o en Analítica (un grep del 2026-10-16 sólo encuentra la vista y los títulos de los ejemplos de `datos.js`) — plan L1, F1. Origen: la nota «CORREGIR» de Samuel, en `P-17`.
- [x] **`seed_demo`: exigir `DATABASE_URL` explícita o mostrar la base destino antes de escribir** (review 3-e) — **HECHO 2026-10-16** (§5.139 a): muestra la base y exige `IPPU_SEED_DESTINO` igual a su nombre; lo mismo en `crear_usuario`.

### L1 después del 2026-11-26 (y lo que espera a IPPU sin bloquear el 26/11)
- **Fuera del 26/11** (decidido; ver los pendientes respectivos): guards de divulgación y de compartir
  (§5.103) · registro de accesos con motivo y copia a la familia (§5.88/§5.103) · reserva de datos del
  adolescente (§5.104/B9) · área de informes configurable + «revisado por dirección» (§5.102) · matriz de
  roles completa (§5.101) · administración de grupos/catálogos/usuarios (§5.90/§5.92) · `pai_taller`
  salvo pantalla del PAI conectada (§5.104/B3) · reconstrucción del esquema legado y migración de datos
  (§5.104/A2).
- Después: Fase 4 completa (roles, matriz) → Fase 6 (Docker completo: app + NGINX) → React + Tailwind.
- [ ] **Lo de M11.3-d que no entre en C1–C5** (SEV, INC, documento histórico, foto, ORG; §5.118 e) **y M11.6 reducido** (Swagger reemplaza `ejemplos-endpoints.md`), después de `GET /hce/{id}/auditoria` de sólo lectura para HCE-LOG (C1). **Foto sin trabas** (§5.99). Texto anterior: `P-22`.
- [ ] **PAI (HCE-PAI) conectado** — fuera del 26/11 y en modo demostración (plan L1; entra antes sólo si sobra tiempo). El esquema existe (8 tablas) **sin guards**: habilitación de §IX por tipo y Anexo A (§5.54–§5.56, §5.105). `pai_taller` se expone sólo si se conecta la pantalla del PAI (§5.104 B3).
- [ ] **Roles y matriz de permisos completos** (§5.41 / I6 · §5.72 · §5.101 · `puntos-a-validar.md` §2.11): el login mínimo `admin` | `tecnico` ya está (§5.101, §5.118) y `tecnico_grupo` se canceló (§5.100). **Queda:** el vocabulario de roles (5 propuestos en §5.72, a confirmar por Lucas), la conflación `admin` ↔ «dirección no técnica» del Protocolo y la matriz completa del Protocolo §5, con el perfil de Inclusión. Texto original: `P-05`.
- [ ] **Crear y renombrar grupos desde la aplicación** (§5.37 / I2 · `puntos-a-validar.md` §2.8 ·
  **§5.90**, 2026-09-11). Lo que queda, sin la etiqueta de bloqueo: **hoy no existe endpoint, servicio,
  script ni pantalla** que cree o renombre un grupo — el único camino sigue siendo el seed. **§5.90
  decide que esto es su propio sub-módulo de administración, construido DESPUÉS del núcleo de M11.3**
  (depende del modelo de usuarios, que es Fase 4; R1 BLOQUE 5.1 midió que nada de esto bloquea el núcleo
  clínico). Va en la misma pantalla que §2.9 (catálogos de talleres/centros) y §2.11 (usuarios): alta/
  renombre de grupo, asignación de técnicos, administración de catálogos, usuarios, y HCE-LOG con
  `hce_id NULL` para lo que no cuelga de un NNA. Número y ubicación relativa a M11.4: **no decididos**.
  ⚠️ **Fuera del alcance del 26/11 (2026-09-16, sesión M12.9, §5.92).** Decisión nombrada de Lucas, no
  pendiente que siga presionando en noviembre: los **cinco grupos ya sembrados** (§5.61) alcanzan para
  un prototipo presentable sin datos reales; este sub-módulo entero —§2.8/§2.9/§2.11— queda para después
  del 26/11.
- [ ] ⚠️ **ACOTADO el 2026-10-05 (§5.102, B7): secundario y FUERA del 26/11** (el IC firmado sí se exporta a PDF; §5.40 sigue siendo la regla). **Estado de revisión de los informes + área de generación configurable** (§5.40 / I5 ·
  `puntos-a-validar.md` §2.13). **Todo informe lo revisa la dirección antes de entregarse**: es un
  **estado de flujo**, no un permiso de impresión. Y lo que pidieron es un **área configurable**, no un
  catálogo cerrado de tipos. Hoy no existe ningún estado de aprobación, ni destinatario, ni generación de
  PDF. **El informe de cierre anual no cambia.**
- [ ] **Indicador de ateneos: 8 al año, ≥2 por grupo** (§5.46 / I11 · `puntos-a-validar.md` §2.14). Para
  el tablero de M11.3/M11.4. Hoy **nada los cuenta**. ⚠️ Definir **qué año** se cuenta: el correlativo es
  del año de registración y el filtro va por la fecha del hecho.
- [ ] **Ateneos — adjuntos de documentos, PPTX en particular** (§5.46 / I11): hoy no hay ninguna validación de tipo de archivo. El campo de observaciones ya existe (`ateneo.observaciones`, M12.8a-1) y «Agregar acuerdo» también. Plan L1: C6. Texto original: `P-07`.
- [ ] **Guía de trámites para las familias — FALTA DUEÑO** (§5.49 / I14). BPS, MIDES, INAU; el trámite
  más consultado es **AYEX**; **va junto con los informes**. Es contenido, no modelo — pero hay que
  decidir **si el texto se edita desde la aplicación o es fijo**, y **eso no lo puede decidir quien
  escribe el código solo**.
- [ ] **Administración de los catálogos de talleres y de centros educativos** (`puntos-a-validar.md` §2.9).
  Hoy vivía sólo dentro de §2.9 y se perdía. D5 (§5.14) y M12.5 dejaron `taller` (14 filas, sin gestión) y
  `catalogo_centro_educativo` (0 filas) **sin endpoint ni pantalla** para alta / orden / orientación a
  grupos / retiro. **Misma pantalla y mismo tipo de trabajo que el alta de grupos (§2.8)** → **M11.3 /
  M11.4**, con registro en HCE-LOG y `hce_id NULL`.
- [ ] **Registro de accesos con motivo (HCE-LOG)** (`puntos-a-validar.md` §2.17, abierto por el Protocolo). ⚠️ **2026-10-05 (§5.103, B12):** acá cae también la **copia de la HC a la familia** (acceso del titular, no divulgación). Posterior al 26/11.
  `auditoria` registra **cambios** (`campo`/`valor_ant`/`valor_nuevo`); el Protocolo §8 exige registrar
  **lecturas con motivo y firma**, y §7 el registro automático de accesos con credencial individual. El
  `tipo='acceso'` está en el CHECK pero **no hay `motivo`, ni firma, ni nada que lo escriba**. Requisito
  **legal**. Condiciona **M11.3** (guards que escriben `auditoria`) y **Fase 4** (login). **No se diseña
  en M11.3: es explícitamente Fase 4** (§5.88, 2026-09-11) — depende del modelo de usuarios y
  autenticación. **Dueño: Lucas.** Cualquier diseño de Fase 4 que lo omita está incompleto.
- [ ] **Guards del acceso al ateneo** (`puntos-a-validar.md` §2.16 cerrado por §5.70 → residuo M11.3):
  (a) visibilidad del ateneo clínico = participantes documentados + equipo tratante + dirección/coord.;
  (b) el endpoint de ateneos enmascara a «lo pertinente» según quién consulta; (c) `ateneo.participantes`
  pasa de `Text` a **relación** (`ateneo_participante` N:M) — necesita el modelo de usuarios (§5.72)
  debajo. **No se toca `ateneo.participantes` hasta M11.3.**
- [ ] **DECIDIDO, SIN IMPLEMENTAR** — decisiones de §5 que la base contradice hoy (lista revisada el 2026-10-16 contra lo que construyó M11.3; una entrada sale cuando la base deja de contradecir la decisión, no cuando alguien la mira). **Única entrada:** §5.103 (B12): `divulgacion.destinatario_tipo` admite «Familia / representante legal» (`DIVULGACION_DESTINATARIOS`, `app/core/constantes.py`) y la copia de la HC a la familia es un acceso del titular, no una divulgación; se corrige cuando se escriba el guard de divulgación. Sin contradicción con la base al contrastar §5.36 y §5.94–§5.100 con los servicios y el esquema. Texto anterior: `P-02`.
- [ ] **`verificar_estado.py` — chequeo de afirmaciones de prosa** (§5.34): contar las secciones
  `^### N.N` de los archivos de `docs/notas/` y compararlas con lo que §6 afirma sobre ellos.
  **Después de la reunión**, no antes. ⚠️ **Lección de M12.8b-1:** la ocurrencia de «línea base única»
  que casi se pasó por alto estaba **partida en dos líneas**, así que un grep por línea es ciego a las
  frases envueltas — el chequeo tiene que **normalizar los espacios en blanco** (unir el texto en un solo
  flujo) antes de buscar.
- [ ] **Puntos a validar con IPPU y el equipo** → `docs/notas/puntos-a-validar.md` (interno: qué no está confirmado y qué bloquea cada cosa) y la lista consolidada para el próximo contacto, `docs/notas/preguntas-ippu.md` (§5.78). Abiertos críticos: el acceso a la HCE actual y su esquema (§1.5; hoy sólo hay un video, §5.104 A2) y, del lado del equipo, no hay forma de abrir un año nuevo de grupos (§2.8). Texto anterior, con sus conteos del 2026-09-09: `P-27`.
- [ ] ⚠️ **2026-10-05: las A1–A5 y B1–B12 de `preguntas-ippu.md` se contestaron por escrito (§5.93); sigue abierta B1 (re-preguntada con su texto definitivo; A5 se cerró el mismo día, §5.107), más el bloque C.** **Llevar al próximo contacto los 12 bloques que quedaron SIN respuesta** — la lista completa está
  en `docs/notas/respuestas-reunion-ippu-2026-08-21.md` §16. Los tres que más cuestan: **2.a**
  (¿quieren registrar participación por taller? — decide el alcance de M12.6), **8.a/8.b/8.c** (la
  planilla de Inclusión, los 7 estados y si el estado se anualiza — **M12.5 arranca sin eso**) y
  **13.a** (qué se hace con los puntajes de la guía con corrimiento, que **ahora migran igual**).
- [ ] **Aclararle a IPPU** que la intro del cuestionario apunta a una pregunta que no quedó en el
  documento (la agenda de la reunión, retirada en H1, §5.136). Treinta segundos, dicho de frente.
- [ ] **Mirar el video demo de la HCE actual:** https://youtube.com/watch?v=dMWfc0JKCC0 — ⚠️ **2026-10-05 (A2, §5.104): no hay acceso a la HCE; reconstruir el esquema legado desde el video es POSTERIOR al 26/11.**
- [ ] Definir **integración**: iframe (MVP) vs módulo nativo con API propia.

### L3 (Samuel; texto textual)
- [x] **L3 · asistente virtual — plan de arranque y F0** → `docs/planes/L3-asistente-plan.md` (límites §8, preguntas §7.3) y el banco (desde la F1-a, `implementacion/L3-asistente-virtual/eval/banco-v0.md`). **F0 cerrada el 2026-10-15** (Samuel). Decisiones en §5.128 y §5.129.
- [ ] **L3 · F1 — prototipo RAG para técnicos** → plan §4, rebanadas F1-a a F1-d, en `implementacion/L3-asistente-virtual/` (Samuel, desde el 2026-10-15, §5.129). **F1-c5 medida** (retenido v1); sigue según resultados (ajuste de límites o F1-c6).

## 7. Preguntas abiertas / a aclarar con el equipo o IPPU

> Sólo las abiertas. Las respondidas se mudaron el 2026-10-16 a `docs/pendientes-resueltos.md` (sección «Movido el 2026-10-16», `Q-NN`), cada una con el § que la contestó (§5.137 d).

- **Cortes del baremo BUND:** que IPPU confirme los porcentajes exactos contra el anexo del Decreto 72/025 antes de un uso clínico real (decisión §5.1.4). No bloquea la demo (tabla parametrizable, M9). ⚠️ **Nunca se preguntó por escrito.** El borrador de `consulta-a-ippu.md` traía dos preguntas sobre esto (§2.7 y §2.8) y **el equipo las retiró en la revisión del 19/08** (§5.34, verificado: 0 ocurrencias de «baremo», «BUND» y «72/025» en el documento enviado). No está «preguntado y esperando respuesta»: está **sin preguntar**, y su único canal hoy es la reunión. Redacción original conservada en `puntos-a-validar.md` §1.2.
- **Catálogo de centros educativos:** ¿lo arma coordinación o sale de la planilla del área de inclusión?
- **Sigue faltando material de IPPU** (⚠️ el Anexo A y §8 **ya no bloquean el 26/11**, §5.105; B1 re-preguntada): el Anexo A del Manual, las secciones que el prototipo no muestra
  (§4, §7, §8, §12, §13, §15, §17, §18, §20–22, §24, §25), la **matriz de 14 roles** (mencionada en sus
  pendientes, ausente del prototipo), el **anexo del Decreto 72/025** y la verificación de las 24 citas
  bibliográficas de la Escala IPPU-TEA.
- **Matriz de roles §21.1 — quiénes ven / administran la nómina de Técnicos autorizados del grupo.**
  El Prototipo v4 y el Manual dicen «esta nómina la administra coordinación». La demo lo simula con
  un flag `USUARIO.puedeAdministrarTecnicos` y un toggle en `/usuarios`. En el sistema real esto sale
  del rol asignado (Coordinación / Dirección técnica). Falta que IPPU precise: ¿qué roles ven el
  bloque? ¿pueden todos verlo pero sólo administrar coordinación, o directamente no lo ven los
  técnicos comunes? Impacta la matriz de permisos del backend.

## 8. Equipo y contactos
- **UTEC-LIDIA — equipo actual (3):** **Lucas Pimentel** · **Samuel (Boris) Furtado** · **Victor Uria**.
  (Bruno Delvalle y Rafael Quintanilla figuraban en el equipo inicial; hoy no están activos en L1.)
  ⚠️ **En git no existe ningún «Samuel»:** Samuel firma como **`Boris Furtado
  <boris.furtado.b@estudiantes.utec.edu.uy>`** — es quien commitea `demo/F1-navegacion`. Misma persona (§5.32).
- **UTEC (docentes/referentes):** Matías López (`matias.lopez@utec.edu.uy`), Vitalio Alfonso Reguera (agregado por Victor, 2026-08-03), Mikaela/Ruth Pivani (`ruth.pivani@utec.edu.uy`).
- **IPPU:** Fernando Sierra — Director.

## 9. Datos clave (cifras)
- **NNA:** las fuentes dan **~120 en total** y a la vez **30 INAU + 108 BPS**, que suman **138**. ⚠️ **No
  cuadra**, y la discrepancia no se reconcilia acá: va a IPPU (`docs/notas/preguntas-ippu.md` C11).
- **5 grupos** (§5.61): Inicial · Escolares · Preadolescentes · Adolescentes · Taller de Adolescentes (✅ confirmados por IPPU
  el 2026-10-05: «Taller de Adolescentes» **es un grupo**, §5.107).
- **14 talleres** (§5.14 / D5; antes acá decía «18» — el «8 vs 18» era falso).
- ~40 expedientes activos · ~150 evaluaciones IDEA históricas (sin consolidar).

## 10. Glosario
- **NNA**: niños, niñas y adolescentes. · **TEA**: Trastorno del Espectro Autista.
- **HCE**: Historia Clínica Electrónica. · **IDEA**: Inventario de Espectro Autista (Á. Rivière, 1997/2002).
- **CAA/AAC**: Comunicación Aumentativa y Alternativa. · **INAU/BPS**: organismos uruguayos (convenios).
- **LIDIA**: laboratorio de la Lic. en Ing. de Datos e IA de UTEC. · **ARASAAC**: banco mundial de pictogramas (referencia L2).

### Tres términos que se parecen y **no son lo mismo** (M12.4)
Se escriben acá para que no se confundan en una reunión con INAU o con BPS:
- **Severidad DSM-5-TR** (HCE-SEV): nivel de apoyo clínico **1 / 2 / 3, por dominio** (comunicación social
  y comportamientos restringidos y repetitivos). Lo registra **el técnico de IPPU por juicio clínico**,
  con justificación, fecha y autor. Es lo que modela `severidad_dsm`.
- **Dependencia Severa** (Uruguay): **condición legal** que evalúan **MIDES/BPS** para pensiones y
  cuidados. **No la determina IPPU** ni sale de este registro. «Grado 3» no la implica ni la sugiere.
- **SEV** a secas, en documentación del Estado: **Sistema de Evaluación Presupuestal** (gestión de fondos
  públicos, INAU). **Sin relación** con este módulo, que se llama HCE-SEV porque así lo nombra el
  `FICHA_TABS` del Prototipo v4 (D1).

Y un cuarto que se parece a los tres pero es de otra cosa: **`banda_idea.nivel_dsm`** es el soporte
DSM-5-TR **orientativo de una banda del total IDEA** — propiedad de la banda, no del NNA (§5.24).

## 11. Privacidad y ética (importante)
- Trabajar **solo con datos simulados/anonimizados** mientras no exista acuerdo de confidencialidad firmado.
- Datos de NNA son sensibles: anonimización, consentimiento informado, no subir imágenes/identificadores a servicios externos sin evaluación. La IA **apoya**, no reemplaza el juicio clínico.

## 12. Flujo de trabajo del equipo (Lucas · Samuel · Victor)
> Acordado el 2026-08-03 tras detectar trabajo duplicado (§5.3). Objetivo: **trabajar los tres en
> paralelo sin pisarnos ni desincronizarnos**, con el mínimo de ceremonia posible.

### 12.1 El principio: el contexto vive en el repo, no en la máquina de uno
La causa del solapamiento no fue técnica: `handoff.md` y `CLAUDE.md` estaban en `.gitignore`, así que
las decisiones tomadas sólo existían en la computadora de Lucas. **Regla:** todo lo que otro necesite
para no repetir tu trabajo va **versionado**. Estado → `handoff.md`. Decisiones → §5 con fecha y autor.
Diseño → `docs/` o `backend/docs/`.

### 12.2 Un solo remoto principal
Hoy hay dos remotos y eso ya nos partió el trabajo (la rama de Victor vivió sólo en GitLab; los commits
M0–M11 sólo se veían completos en GitHub hasta que se sincronizaron a mano):

| Remoto | URL |
|---|---|
| `gitlab` (UTEC) | https://git.utec.edu.uy/juan.pimentel/IPPU-UTEC |
| `origin` (GitHub) | https://github.com/lucaspimentel-uy/IPPU-UTEC |

**Decidido (2026-08-07, §5.4):** **`gitlab` = remoto principal** — es el institucional y los tres
tienen cuenta UTEC; **`origin` (GitHub) = espejo**, que Lucas sincroniza. **Precisado por §5.137 (c) (2026-10-16):** las
**ramas se suben sólo a `origin`**; `main` avanza por fast-forward (`git merge --ff-only`) y se sube a
`origin` **y** a `gitlab`, sin `--force`:
```bash
git merge --ff-only <rama>
git push origin main
git push gitlab main
```

### 12.3 Reparto: quién toca qué
> **Actualizado por §5.6 (2026-08-07): ya no hay módulos con dueño exclusivo.** Antes de empezar: avisar en
> el grupo **qué tomás** y anotarlo en el pendiente correspondiente de §6. La tabla de abajo dice **dónde hay
> riesgo de pisarse**, no quién es dueño de qué.

| Zona | Archivo/carpeta | Regla |
|---|---|---|
| **Demo** | `implementacion/L1-hce-idea/demo/js/*.js` | **Se puede en paralelo desde la modularización (§5.5)**, siempre que cada uno tome **archivos distintos**. Avisar cuál tomás. |
| **Demo — compartidos** | `demo/index.html`, `demo/js/utils.js` | Los tocan todos → **coordinar antes**. `index.html` define el **orden de carga**, que es la semántica del programa (ver §5.5). |
| **Backend v2 (M11)** | `implementacion/L1-hce-idea/backend/` | Se reparte por sub-módulo (M11.1 … M11.6), que son **secuenciales**: acá el riesgo no es el archivo sino el orden. Coordinar quién sigue. |
| **Documentación** | `docs/`, `README.md` | Libre, poco riesgo de conflicto. |
| **`handoff.md`** | raíz | Todos escriben, pero **sólo agregando** (decisiones en §5, pendientes en §6; la bitácora se escribe en `docs/bitacora.md`, §5.84). Si dos editan a la vez, el conflicto es trivial de resolver. |

### 12.4 Ciclo de una sesión de trabajo (checklist)
**Al empezar:**
1. `git pull` (`main` vive en `origin` y en `gitlab`; las ramas, sólo en `origin`).
2. Leer `handoff.md` — cabecera, §5 (decisiones) y §6 (pendientes). Mirar en §6 si alguien ya está en eso
   (§5.6: no hay dueños, pero sí conviene no duplicar).
3. Avisar en el grupo qué tomás.
4. Rama corta con nombre del módulo: `git checkout -b feat/M11.1-infra-postgres` (se sube sólo a `origin`).

**Al terminar:**
5. Verificar antes de dar por hecho (pytest / Playwright según corresponda) y decir el resultado real.
5b. **`python herramientas/verificar_estado.py --check`** — mide el repo (tablas, migración, un solo head,
   tests si Docker está arriba) y falla si algún `.md` afirma otra cosa. Existe porque la documentación se
   desfasó del repo **cuatro veces** en la ronda M12 y las cuatro se encontraron de casualidad (§5.29).
   Silencioso si coincide. ⚠️ Sin Docker **no estima** el conteo de tests: lo reporta como no medido.
6. **Actualizar `handoff.md`**: §5 si tomaste una decisión de arquitectura · §6 pendientes · **cabecera**
   (§5.82). La entrada de bitácora (qué se hizo, cómo se verificó, qué sigue) va en **`docs/bitacora.md`**
   (§5.84).
7. Commit y push de la rama **sólo a `origin`**; `main` avanza con `git merge --ff-only` y se sube a `origin` **y** `gitlab`, nunca con `--force`.

**Vida máxima de una rama: ~1 semana.** La rama `feature/base-datos-hce` vivió 19 días sin integrarse y por
eso divergió tanto. Si un módulo lleva más, mergeás lo que tengas hecho o al menos pusheás la rama a `origin` y lo
anotás en §6 para que los demás lo vean.

### 12.5 Qué hicimos con `feature/base-datos-hce` (Victor) — **ARCHIVADA** (2026-09-03, §5.68 / L15)
La rama **se archivó como tag anotado `archivo/base-datos-hce`** (sobre `dfb1732`, en los dos remotos) y
**se borró de `gitlab`**. No se adoptó porque pone la lógica de negocio en triggers PL/pgSQL, y la
decisión §5.2 es lógica en el servidor (Pydantic/FastAPI, testeable con pytest). Su contenido **sigue
siendo material de consulta** y ahora vive en el tag:
- `sql/04_seed_catalogos.sql` — catálogos IDEA / IPPU-TEA / baremo / categorías documentales.
- `sql/05_seed_demo.sql` — los 4 usuarios demo del §11, con los mismos números que la demo (IDEA 58 · PA 60 · PB 79 · Δ +19).
- `sql/02_esquema.sql` y `docs/modelo-datos.md` — segunda opinión sobre tablas, constraints e índices.
- `03_funciones_triggers.sql` — la lista de reglas duras que hay que cubrir; en v2 esas reglas van como
  **guards en servicios Python con test**, no como triggers.

Para consultarla sin cambiar de rama (el tag está en los dos remotos tras `git fetch --tags`):
```bash
git show archivo/base-datos-hce:implementacion/hce-db/sql/04_seed_catalogos.sql
```

### 12.6 Regla anti-contradicción (vale también para las sesiones de Claude)
Si mientras trabajás (vos o Claude) aparece una propuesta que **contradice una decisión ya registrada en
§5**, no se implementa: se frena, se anota en §7 (preguntas abiertas) y se resuelve en la reunión de equipo.
Las decisiones se cambian **explícitamente y por escrito** en §5, con fecha y autor — nunca de hecho, en el
código. Esto es exactamente lo que evita el escenario de §5.3.

## 13. Bitácora de sesiones

El registro de sesiones ahora vive en **`docs/bitacora.md`** (mudado el 2026-09-09 por **§5.84**;
`handoff.md` quedó como estado, decisiones y pendientes). Las citas «§13» del repo siguen resolviendo
acá: este encabezado se conserva a propósito. Para agregar una entrada, escribila en `docs/bitacora.md`
y actualizá la cabecera de este archivo (§5.82).
