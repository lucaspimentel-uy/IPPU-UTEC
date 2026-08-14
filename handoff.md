# Handoff — Proyecto IPPU × UTEC-LIDIA · Línea 1 (HCE + IDEA)

> **Bitácora de contexto entre sesiones.** Sirve para que cualquier sesión (Claude o persona)
> recupere el estado del proyecto sin releer todo. **Actualizar al final de cada sesión** (sección 4 y 6).
>
> ⚠️ **Este archivo está versionado en el repo desde el 2026-08-03** (antes era local y por eso el equipo
> trabajaba a ciegas — ver §12). Es el **contexto compartido de los tres**: leerlo al empezar, actualizarlo
> al terminar, pushearlo siempre. **Cómo trabajamos en paralelo sin pisarnos: §12.**
>
> - **Última actualización:** 2026-08-14
> - **Responsable del documento:** Lucas Pimentel (UTEC-LIDIA) · **Equipo:** Lucas · Samuel · Victor
> - **Foco actual:** **L1 — Ronda M0–M10 COMPLETA (demo v4.1)** · **M11.1 y M11.2 HECHOS** (backend v2: 28 tablas, migración única, catálogos, 21 tests). En curso: **M12 · absorción del Prototipo v4**, intercalada **entre M11.2 y M11.3** porque toca la misma capa (modelos, migración inicial, catálogos) — ver §5.10–§5.18 y `docs/planes/PLAN-M12-absorcion-prototipo-v4-2026-08.md`. **M12.0 y M12.1 hechos** (2026-08-14): **33 tablas**, 53 tests. **Sigue M12.2** (puntuación independiente y consenso, D7). ⚠️ **La regla de migraciones de M12 quedó enmendada el 2026-08-14 (§5.19):** la migración inicial única **se regenera al cerrar cada sub-módulo**, con el test de coincidencia modelos ↔ migración pasando; sólo se congela si hay trabajo en paralelo real sobre `app/models/`. **M11.3–M11.6 se retoman al cerrar M12.** Ningún módulo tiene dueño exclusivo (§5.6): se avisa qué se toma y se trabaja. En paralelo, pendiente con IPPU: **validar la demo** (sobre todo el cambio de IDEA a línea base única).
> - **Fuente normativa vigente (orden de precedencia, §5.10):** **1.** Manual de Procedimientos v1.0 + **Prototipo v4** (IPPU, ago-2026) → `docs/markdown/prototipo-v4-referencia.md` + `docs/fuentes/prototipo-v4/` · **2.** `docs/markdown/1_documento-tecnico-utec-lidia.md` (Doc. Técnico IPPU v1.0, jul-2026) · **3.** presentación 13.05.2026. **En conflicto, gana el de más arriba.** Planes de ronda: `docs/planes/PLAN-modular-adaptacion-HCE-2026-07.md` (M0–M11) y `PLAN-M12-absorcion-prototipo-v4-2026-08.md` (M12, vigente). Referencia previa de UX/reglas: `docs/fuentes/HCE_IPPU_Prototipo_v1.html`.

---

## 0. Cómo retomar el trabajo (arranque rápido)
0. **`git pull`** antes de tocar nada, y avisar en el grupo qué módulo tomás (§12).
1. Terminal → `cd` a la carpeta del repo → `claude`.
2. Leer este `handoff.md` y luego `CLAUDE.md` (ambos versionados: los tenés al clonar).
3. Toda la documentación del proyecto está convertida a Markdown (legible y citable) en **`docs/markdown/`**.
   Los originales (PDF/PPTX/DOCX/XLSX) están en **`docs/fuentes/`**.
4. La demo (front) de la L1 está en **`implementacion/L1-hce-idea/demo/index.html`** (abrir en navegador, sin servidor).
   Desde 2026-08-07 está **modularizada**: `index.html` + `css/estilos.css` + `js/*.js` (12 módulos, ver §5.5).
5. El **backend** está en **`implementacion/L1-hce-idea/backend/`** (ver su `README.md`). Correr: `.venv\Scripts\Activate.ps1` → `alembic upgrade head` → `python -m app.seed` → `uvicorn app.main:app --reload` (docs en `/docs`). Tests: `pytest -q`.
6. **Diagrama ER interactivo** del esquema **v1** (Artifact, 18 tablas): https://claude.ai/code/artifact/0f0d9484-aa6a-437b-9608-4499ab0ef5b2 — ⚠️ es privado de la cuenta de Lucas, **Samuel y Victor no pueden abrirlo**; la versión citable para todos es `backend/docs/esquema-datos.md`. El esquema **v2** (el que se implementa en M11) está en `backend/docs/esquema-datos-v2.md`. Fuente HTML del Artifact: no quedó en el repo; si hace falta, se regenera.

---

## 1. Qué es el proyecto
Convenio estratégico **Fundación IPPU × UTEC** (Licenciatura en Ingeniería de Datos e IA, laboratorio **LIDIA**),
firmado en 2025, con implementación en 2026. Objetivo: aplicar IA y ciencia de datos a la atención de
**NNA (niños, niñas y adolescentes) con TEA** (Trastorno del Espectro Autista).

- **IPPU** = Instituto/Fundación Psico-Pedagógico Uruguayo. Montevideo. Fundada en 1980; Fundación desde 1983;
  estatus consultivo ONU (2008); convenio INAU (2017). HCE propia desde ~2020 (`fundacionippu.uy`, sistema React).
- **Población:** ~120 NNA en total (convenio INAU: 30 · BPS: 108), en **5 grupos de referencia** por edad/modalidad.
  ~40 expedientes activos en la HCE. **18 talleres especializados**. ~20 personas usan la HCE.

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
- **Frontend:** React + React Router + Tailwind CSS. Módulo: Formulario IDEA (12 dim), Form Likert (3 ítems/dim), Informe final + BarChart (recharts).
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
1. **Conversor mejorado** (`herramientas/conversor_docling.py`): ahora acepta archivos/carpetas por CLI (modo batch), `-o` carpeta de salida, `-r` recursivo, `--overwrite`; salida UTF-8 (arregla crash con emojis en consola Windows); mantiene modo interactivo si se ejecuta sin argumentos.
2. **Convertidos a Markdown** los 12 documentos del proyecto (incl. `IPPU.pdf` escaneado con OCR) → `docs/markdown/`. 0 errores.
3. **Leído y sintetizado** todo el material (propuesta, presentación, documento de trabajo, respuestas de IPPU, guía de relevamiento, demo, escala IDEA).
4. **Arquitectura de carpetas** creada e implementada (ver sección 5 de `README.md`); archivos reubicados; carpetas viejas (`Implemetacion`, `Registro asistencia reuniones`) eliminadas.
5. Creados `handoff.md`, `CLAUDE.md`, `README.md`, `.gitignore`.
6. **Git + GitHub:** `git init`, commit inicial en rama `main`, y push a repo **privado** `lucaspimentel-uy/IPPU-UTEC` (https://github.com/lucaspimentel-uy/IPPU-UTEC). `handoff.md`, `CLAUDE.md` y `herramientas/conversor_docling.py` están en `.gitignore` (NO se publican). Se instaló `gh` (GitHub CLI) v2.95.0.

## 5. Decisiones tomadas
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
  técnico es bastante más caro. Depende de las respuestas de IPPU a §3.7 y §3.8 de
  `docs/notas/consulta-a-ippu.md` (qué hacen cuando falta un técnico y cuando un chico cambia de grupo).
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

---

## 6. Pendientes / próximos pasos (sugeridos)
- [x] ~~Ronda M0–M10 (adaptar la demo al Doc. Técnico)~~ → **COMPLETA** (2026-07-30, demo v4.0). Ver bitácora.
- [ ] **Validar la demo v4.0 con IPPU** (puerta de entrada a M11 según el plan; en especial el cambio de IDEA a línea base única). Ritmo sugerido por el Doc. Técnico §12: revisiones quincenales.
- [ ] **M11 · Backend v2 — EN CURSO.** Desde §5.6 no tiene dueño exclusivo — quien lo tome, avisa. Las 3 decisiones de arquitectura están cerradas (§5.2) y el esquema v2 escrito (`backend/docs/esquema-datos-v2.md`).
  - [x] ~~**M11.1** infra Postgres-only~~ → **HECHO** (2026-08-07, rama `feat/m11-backend-v2`). `docker-compose.yml` con Postgres 16 en `127.0.0.1:5440` (§5.9) + base `ippu_test` aparte para pytest; `config.py` **rechaza al arrancar** cualquier URL que no sea Postgres; Alembic sin el batch-mode de SQLite y con `compare_type`; convención de nombres de constraints para que el autogenerate sea reproducible entre las tres máquinas.
  - [x] ~~**M11.2** modelos + migración + catálogos~~ → **HECHO** (2026-08-07). **28 tablas** en 4 módulos (`catalogos` · `identidad` · `modulos` · `transversales`), migración inicial única, y seed idempotente de catálogos **generado desde la demo v4.1** (12 dimensiones IDEA + 60 descriptores, 24 ítems IPPU-TEA, baremo, 12 categorías documentales, 4 recordatorios, 8 talleres, 3 servicios). Se retiró el backend v1 completo (modelos/schemas/routers/seed/tests + 3 migraciones): hablaba del modelo pre-Documento Técnico. **Verificado:** reconstrucción limpia (drop schema → `alembic upgrade head` → seed) + **21 tests estructurales en verde** + API levanta.
  - [ ] **M11.3** servicios/motor de flujo con guards (§4: secuencia, firma=bloqueo, Δ sólo B−A, baremo sólo desde `pct`, fotos §8.4, histórico inmutable) — **el sub-módulo con más contenido; sin tomar.**
  - [ ] **M11.4** routers · **M11.5** seed espejo de la demo + pytest (criterio §12-A: usuario demo 1 por API = IDEA 58 · PA 60 · PB 79 · Δ +19) · **M11.6** docs.
  - ⚠️ **M11.3–M11.6 están en pausa hasta cerrar M12** (ver abajo): tocan la capa que M12 está por cambiar.
  - Después: Fase 3 (demo↔API) → Fase 4 (JWT) → Fase 6 (Docker completo: app + NGINX).
- [ ] **M12 · Absorción del Prototipo v4 — EN CURSO** (arrancó 2026-08-14). Se intercala **entre M11.2 y
  M11.3**. Decisiones D1–D9 escritas en **§5.10–§5.18**. Plan:
  `docs/planes/PLAN-M12-absorcion-prototipo-v4-2026-08.md`. Sin dueño exclusivo (§5.6).
  - [x] ~~**M12.0** decisiones al papel + verificación del punto de partida~~ → **HECHO** (2026-08-14, Lucas).
        HTML del prototipo incorporado, mapas de estructura actualizados, repo verificado contra la realidad
        y **diff de los 60 descriptores reportado** (ver bitácora §13).
  - [x] ~~**M12.1** correcciones al esquema existente~~ → **HECHO** (2026-08-14, Lucas). **D9 confirmada**
        e implementada · 6 bandas (`banda_idea`) · interpretación del Δ (`delta_interpretacion`, la alerta
        Δ ≤ −7 sale de ahí) · `manual_version` + metadatos de origen · `idea_ficha`/`idea_ejemplo`/
        `idea_regla` + `descriptor_breve` · recordatorios 4 → 8 · auditoría a nivel campo · vocabulario ·
        cita Rivière 1997/2002. **33 tablas**, generador de catálogos versionado,
        **53 tests en verde + 1 salteado a propósito** → tras la enmienda **§5.19** (mismo día): migración
        regenerada con las 33 tablas y **54 en verde, 0 salteados**. Ver bitácora §13.
  - [ ] **M12.2** puntuación independiente y consenso (D7). El cambio de modelo más profundo.
  - [ ] En paralelo (uno cada uno, archivos distintos de `app/models/`): **M12.3** catálogo de talleres ·
        **M12.4** HCE-SEV · **M12.5** HCE-INC · **M12.6** HCE-PAI (el más grande) · **M12.7** ateneos.
  - [ ] **M12.8** cierre: seed desde el JSON del prototipo, tests y docs. **Una sola persona.**
        ⚠️ Ya **no** es el único momento en que se toca la migración: desde la enmienda **§5.19**
        (2026-08-14) se regenera al cerrar **cada** sub-módulo, con el test de coincidencia en verde.
- [ ] **Puntos a validar con IPPU y el equipo** → `docs/notas/puntos-a-validar.md` (2026-08-07, **interno**). 8 puntos para IPPU (los críticos: **validar la demo v4.1** y **acceso a la HCE actual + su esquema de BD**), 6 para el equipo (incl. **ratificar §5.8**) y 6 supuestos a confirmar. Salió de M11.2: varios se detectaron construyendo el esquema (ej. la demo usa 8 talleres y el esquema dice 18, sin fuente que los liste; las referencias documentales de los 24 ítems no están verificadas).
- [x] ~~**DECISIÓN TÉCNICA PENDIENTE — la tabla `grupo` no admite más de un año.**~~ → **CERRADA**
  (2026-08-14, **§5.18 / D9**): opción (b), **id propio + `UNIQUE(nombre, anio)`**, y el nombre pasa a ser el
  **color** (Azul · Celeste · Naranja · Verde), que es el dominio real de IPPU. **Confirmada por el equipo
  e implementada en M12.1** (modelo, FKs de `hce_diurna` y `foto` a entero, seed de los 4 grupos, 5 tests).
  Queda **un residuo más chico anotado en §5.18**: con granularidad anual, un cambio de técnico a mitad de
  año sobrescribe la fila y sólo deja rastro en `auditoria`. El planteo original queda abajo como registro:
- [ ] ~~**la tabla `grupo` no admite más de un año**~~ (contexto histórico): Su PK es sólo la letra (`A..E`) pero lleva columna `anio`, así que **el grupo A existe para un único año en toda la historia**: crear el de 2027 obliga a sobrescribir el de 2026 (se pierde quiénes fueron sus técnicos) y los expedientes viejos, que en `grupo_id` guardan sólo la letra, pasan a apuntar al grupo nuevo **sin aviso**. Contradice cómo `protocolo` e `informe_cierre` resuelven los ciclos anuales con `(hce_id, …, anio)`. Detectado al revisar M11.2; **se implementó tal cual lo especifica `esquema-datos-v2.md` §2.1, sin corregirlo por cuenta propia** (cambiarlo modifica ese documento). Opciones: (a) PK compuesta `(id, anio)` · (b) id propio con `UNIQUE(letra, anio)` · (c) dejarlo y **quitar la columna `anio`**, si los grupos no se reconfiguran año a año. Anotado en los 3 lugares donde se va a mirar: `esquema-datos-v2.md` §2.1, el docstring de `Grupo` y `docs/notas/puntos-a-validar.md` §2.6. **No bloquea M11.3.**
- [ ] **ENVIAR A IPPU:** `docs/notas/consulta-a-ippu.md` (2026-08-07). Versión **no técnica** del anterior, en formato de cuestionario respondible por los funcionarios: **Parte 1** lo que entendimos de su trabajo (para que nos corrijan) · **Parte 2** los 10 supuestos que tomamos (para confirmar o desmentir) · **Parte 3** 10 dudas puntuales. Las 4 marcadas ⚠️ son las que destraban más: **2.1** (¿el IDEA se hace una vez o todos los años?), **3.1** (lista de talleres), **3.2** (citas bibliográficas de la escala) y **3.3** (acceso al sistema actual). Los dos documentos se mantienen sincronizados: si cambia uno, cambia el otro.
- [x] ~~**Modularizar la demo**~~ → **HECHO** (2026-08-07, §5.5). La demo dejó de ser recurso exclusivo: **se puede trabajar en paralelo** tomando archivos distintos de `demo/js/`.
- [x] ~~**Demo — analítica institucional real**~~ → **HECHO** (2026-08-07, demo **v4.1**, ver §3 y bitácora). Los 4 KPIs y los gráficos por escala se calculan del modelo; se agregó la tarjeta de evolución Protocolo A → B. Hallazgo del camino: dos de los indicadores viejos no estaban hardcodeados por comodidad sino que eran **incalculables por diseño** desde M4. **Lo que queda abierto ahí:** el heatmap de talleres sigue con datos de muestra (§5.1.3) y el cruce taller × escala no va a tener sustento hasta que haya varios NNA con el ciclo A → B cerrado — hoy hay **1 de 7**.
- [x] ~~**Re-indexar el grafo de conocimiento (`graphify-out/`)**~~ → **HECHO** (2026-08-07). Pasó de 572 nodos / 870 aristas / 80 comunidades a **736 / 1.039 / 163**, ya con los 12 módulos de `demo/js/` como comunidades propias. **La extracción semántica de los 25 documentos quedó cacheada**, así que re-correrlo no vuelve a gastar LLM salvo en los archivos que cambien. Dos cosas a saber: el diagnóstico reporta **67 aristas con extremo colgante** (5,8 % — el extractor emitió aristas hacia IDs que no declaró como nodos; artefacto típico de LLM, no corrupción), y `cost.json` **subregistra esta corrida** con 0 tokens porque los subagentes murieron por límite de sesión antes de poder reportar su uso.
- [ ] **Rama `gitlab/feature/base-datos-hce` (Victor):** aparcada, **no** descartada (§5.3). Decidir en reunión de equipo qué se hace con ella al terminar M11 (mergear lo reutilizable como referencia SQL en `docs/`, o cerrarla dejando constancia). Ver §12.5.
- [x] ~~Elegir un remoto principal~~ → **decidido 2026-08-07: `gitlab` principal, `origin` espejo** (§5.4, ver §12.2).
- [ ] **Mirar el video demo de la HCE actual:** https://youtube.com/watch?v=dMWfc0JKCC0
- [ ] **Pedir a IPPU (crítico):** acceso al repositorio de la HCE actual + **esquema de la base de datos** actual.
- [ ] **Resolver confidencialidad:** documento legal a firmar por quienes accedan a datos sensibles (lo planteó el Director).
- [ ] Definir **integración**: iframe (MVP) vs módulo nativo con API propia.
- [x] ~~Definir **stack backend**~~ → **Python + FastAPI + SQLAlchemy + Alembic**, SQLite en dev → PostgreSQL en prod. (Lucas eligió esta recomendación.)
- [x] ~~Diseñar **esquema de datos**~~ → hecho y documentado en `implementacion/L1-hce-idea/backend/docs/esquema-datos.md` (+ diagrama ER interactivo como Artifact). 14 tablas núcleo + 4 provisionales (áreas/general). **Pendiente:** los **9 endpoints CRUD** (Fase 2).
- [x] ~~**Fase 2 (backend):** endpoints CRUD~~ → hecho: 20 endpoints (NNA CRUD + búsqueda/estado, IDEA, Likert, observaciones, eventos, catálogo, personas) con validación Pydantic, Swagger en `/docs`, `total`/`equivalente_idea` calculados en servidor. **12 tests pytest en verde** (base aislada). **Pendiente:** endpoints de áreas/general (provisionales) y de notas si hicieran falta.
- [ ] **Fase 3:** conectar la demo HTML a la API (reemplazar el array `NNA` por `fetch`) → persistencia real.
- [ ] **Fase 4:** auth JWT por terapeuta + roles. · **Fase 5:** tests + docs. · **Fase 6:** Docker + PostgreSQL.
- [ ] **Micro-tarea:** importar a `nivel_idea` los descriptores oficiales (texto largo por nivel) desde `docs/markdown/escala-...idea.md`.
- [ ] **Con IPPU:** definir el protocolo real de "áreas" y "general" (hoy modeladas como provisionales, indicadores en texto libre).
- [x] ~~Extender la demo con los módulos faltantes~~ → hecho (v3.1): Grupos, Usuario, Eval. por áreas y Eval. general. **Pendiente:** que IPPU defina los protocolos reales de "por áreas" y "general" (hoy son provisionales); luego ajustarlos. Ya commiteado y pusheado (commit `cbb3119`).
- [x] ~~Demo v3.2~~ → hecho: pantalla de **inicio de sesión** (usuario pre-creado), **barra de búsqueda** en inicio (nombre/apellido, N.º de HCE, cédula — tolerante a acentos y puntos), **distinción activos/inactivos** (campo `activo`, filtro por estado, alta/baja desde el expediente) y paso **Anamnesis** en el alta de NNA (wizard reordenado: Datos del NNA → Datos clínicos → Anamnesis → Confirmar). Verificado con Playwright (19/19 checks). **Pendiente:** login real (JWT) y persistencia son backend.
- [x] ~~Demo v3.3~~ → hecho: **listado simplificado** (N.º HCE, C.I., Nombres, Apellido, Estado); **editar NNA** (modal reutilizado en modo edición); **evaluaciones movidas al expediente** (barra de botones Anamnesis · IDEA · Intermedia · Áreas · General bajo el encabezado; se quitaron del sidebar); vista **Pendientes** (NNA activos sin IDEA anual); **IDEA con frecuencia ANUAL** (selector por año, KPIs y seguimiento anuales); **informe por NNA** generado automáticamente con **descarga vía Imprimir→PDF** (`@media print`) y **guía de interpretación** de bandas embebida. Verificado con Playwright headless (27/27 + PDF). **Pendiente (no prioritario):** separar HTML/CSS en archivos y organizar por pestañas. **Pendiente:** que IPPU defina protocolos reales de áreas/general y de la evaluación anual.
- [x] ~~inicializar git~~ → hecho: repo privado `lucaspimentel-uy/IPPU-UTEC`. Recordar `git push` tras cambios. (Ojo: `handoff.md`/`CLAUDE.md`/conversor no se versionan a propósito.)
- [x] ~~Crear repo en GitLab de UTEC~~ → hecho: proyecto **privado** `juan.pimentel/IPPU-UTEC` (https://git.utec.edu.uy/juan.pimentel/IPPU-UTEC). Remoto local `gitlab` (además de `origin`=GitHub). SSH puerto 22 bloqueado → se usa **HTTPS**. Para pushear a UTEC: `git push gitlab main` (pide credenciales: PAT o login por navegador vía Git Credential Manager).

## 7. Preguntas abiertas / a aclarar con el equipo o IPPU
- **Numeración de líneas:** la presentación y la demo usan L1=HCE. El *Documento de trabajo* y el cuestionario Q47 usan numeraciones distintas. Confirmar la oficial (no bloquea; el foco L1=HCE es consistente y el Documento Técnico lo ratifica).
- **Cortes del baremo BUND:** que IPPU confirme los porcentajes exactos contra el anexo del Decreto 72/025 antes de un uso clínico real (decisión §5.1.4). No bloquea la demo (tabla parametrizable, M9).
- **Para M11 (backend v2, no antes de validar M0–M6 con IPPU):** decisiones de arquitectura del Anexo A del plan — (a) SQLite vs. Postgres-only en dev, (b) dónde vive la lógica de negocio (Pydantic/servidor vs. triggers PL/pgSQL), (c) alcance de portabilidad institucional — y la nomenclatura de "fases" (hoy conviven 5 usos distintos del término).

### Abiertas por la ronda M12 (2026-08-14)
- **Descriptores del IDEA — ¿qué pasa con las evaluaciones ya aplicadas?** El Prototipo v4 declara haber
  corregido "un corrimiento de niveles detectado en materiales institucionales previos (Dimensiones 3, 4, 6
  y 12 de la «Guía del aplicador», hoy desestimada)". **Ese documento no lo tenemos y nuestros descriptores
  no vienen de ahí** (ver la bitácora del 2026-08-14: los 60 nuestros salen de la fuente oficial de Rivière
  y están en los niveles correctos). Igual queda la pregunta clínica, que **no nos toca resolver**: si IPPU
  aplicó evaluaciones con la Guía corrida, ¿qué se hace con esos puntajes históricos? Va a
  `puntos-a-validar.md` y a la reunión.
- **¿Los dos técnicos ya puntúan de forma independiente, o es práctica a introducir?** De la respuesta
  depende si §5.16 (D7, kappa) sirve desde el día uno o queda latente.
- **Catálogo de centros educativos:** ¿lo arma coordinación o sale de la planilla del área de inclusión?
- **Contradicción del prototipo: secuencia dura vs. guiada.** Manual §3 ("ningún instrumento puede aplicarse
  sin que el anterior esté completo y firmado") vs. Especificaciones §1 ("flujo guiado, **no impuesto**").
  Su código implementa la guiada; nosotros también. Confirmar. (Anexo B del plan M12 tiene las otras cinco.)
- **Sigue faltando material de IPPU:** el Anexo A del Manual, las secciones que el prototipo no muestra
  (§4, §7, §8, §12, §13, §15, §17, §18, §20–22, §24, §25), la **matriz de 14 roles** (mencionada en sus
  pendientes, ausente del prototipo), el **anexo del Decreto 72/025** y la verificación de las 24 citas
  bibliográficas de la Escala IPPU-TEA.

**Resueltas (movidas desde aquí):** stack backend = **FastAPI + SQLAlchemy + Alembic** (SQLite→Postgres); base = **PostgreSQL** (no MariaDB); alcance del MVP = ronda **M0–M10** sobre la demo + Fases A–D del Documento Técnico §12. **Cortes del baremo:** el prototipo usa exactamente los que asumimos (0–4 / 5–24 / 25–49 / 50–95 / 96–100) con su implicancia — confirma **qué usa IPPU**, no qué dice el decreto, así que el anexo del Decreto 72/025 sigue pendiente. **Talleres:** los 14 reales están en el prototipo (§5.14 / D5); el "8 vs 18" era falso.

## 8. Equipo y contactos
- **UTEC-LIDIA — equipo actual (3):** **Lucas Pimentel** · **Samuel (Boris) Furtado** · **Victor Uria**.
  (Bruno Delvalle y Rafael Quintanilla figuraban en el equipo inicial; hoy no están activos en L1.)
- **UTEC (docentes/referentes):** Matías López (`matias.lopez@utec.edu.uy`), Vitalio Alfonso Reguera (agregado por Victor, 2026-08-03), Mikaela/Ruth Pivani (`ruth.pivani@utec.edu.uy`).
- **IPPU:** Fernando Sierra — Director.

## 9. Datos clave (cifras)
- ~120 NNA total · 30 INAU + 108 BPS · 5 grupos · 18 talleres · ~40 expedientes activos · ~150 evaluaciones IDEA históricas (sin consolidar).

## 10. Glosario
- **NNA**: niños, niñas y adolescentes. · **TEA**: Trastorno del Espectro Autista.
- **HCE**: Historia Clínica Electrónica. · **IDEA**: Inventario de Espectro Autista (Á. Rivière, 1997/2002).
- **CAA/AAC**: Comunicación Aumentativa y Alternativa. · **INAU/BPS**: organismos uruguayos (convenios).
- **LIDIA**: laboratorio de la Lic. en Ing. de Datos e IA de UTEC. · **ARASAAC**: banco mundial de pictogramas (referencia L2).

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
tienen cuenta UTEC; **`origin` (GitHub) = espejo**, que Lucas sincroniza. Mientras haya dos, la regla es
**pushear siempre a ambos** en el mismo momento:
```bash
git push gitlab main && git push origin main
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
| **`handoff.md`** | raíz | Todos escriben, pero **sólo agregando** (bitácora al final, pendientes en §6). Si dos editan a la vez, el conflicto es trivial de resolver. |

### 12.4 Ciclo de una sesión de trabajo (checklist)
**Al empezar:**
1. `git pull` (de los dos remotos si hiciste push a ambos).
2. Leer `handoff.md` — cabecera, §5 (decisiones) y §6 (pendientes). Mirar en §6 si alguien ya está en eso
   (§5.6: no hay dueños, pero sí conviene no duplicar).
3. Avisar en el grupo qué tomás.
4. Rama corta con nombre del módulo: `git checkout -b feat/M11.1-infra-postgres`.

**Al terminar:**
5. Verificar antes de dar por hecho (pytest / Playwright según corresponda) y decir el resultado real.
6. **Actualizar `handoff.md`**: §5 si tomaste una decisión de arquitectura · §6 pendientes · §13 bitácora
   (qué se hizo, cómo se verificó, qué sigue).
7. Commit + merge a `main` + **push a los dos remotos**.

**Vida máxima de una rama: ~1 semana.** La rama `feature/base-datos-hce` vivió 19 días sin integrarse y por
eso divergió tanto. Si un módulo lleva más, mergeás lo que tengas hecho o al menos pusheás la rama y lo
anotás en §6 para que los demás lo vean.

### 12.5 Qué hacemos con `feature/base-datos-hce` (Victor)
Queda **aparcada, no descartada** (§5.3.2). No se adopta porque pone la lógica de negocio en triggers
PL/pgSQL, y la decisión §5.2 es lógica en el servidor (Pydantic/FastAPI, testeable con pytest). **Pero su
contenido es material de consulta directo para M11**, en particular:
- `sql/04_seed_catalogos.sql` — catálogos IDEA / IPPU-TEA / baremo / categorías documentales.
- `sql/05_seed_demo.sql` — los 4 usuarios demo del §11, con los mismos números que la demo (IDEA 58 · PA 60 · PB 79 · Δ +19).
- `sql/02_esquema.sql` y `docs/modelo-datos.md` — segunda opinión sobre tablas, constraints e índices.
- `03_funciones_triggers.sql` — la lista de reglas duras que hay que cubrir; en v2 esas reglas van como
  **guards en servicios Python con test**, no como triggers.

Para consultarla sin cambiar de rama:
```bash
git show gitlab/feature/base-datos-hce:implementacion/hce-db/sql/04_seed_catalogos.sql
```

### 12.6 Regla anti-contradicción (vale también para las sesiones de Claude)
Si mientras trabajás (vos o Claude) aparece una propuesta que **contradice una decisión ya registrada en
§5**, no se implementa: se frena, se anota en §7 (preguntas abiertas) y se resuelve en la reunión de equipo.
Las decisiones se cambian **explícitamente y por escrito** en §5, con fecha y autor — nunca de hecho, en el
código. Esto es exactamente lo que evita el escenario de §5.3.

## 13. Bitácora de sesiones
- **2026-06-30** — Setup inicial: conversión de documentos, lectura de contexto, arquitectura de carpetas, creación de `handoff.md`/`CLAUDE.md`/`README.md`, e inicialización de git + push a repo privado `IPPU-UTEC`. (Lucas + Claude)
- **2026-06-30** — Demo L1 extendida a v3.1: agregados los módulos Grupos, Usuario, Evaluación por áreas y Evaluación general (las dos evaluaciones, provisionales). JS validado con `node --check`. Commiteado y pusheado (`cbb3119`). (Lucas + Claude)
- **2026-07-01** — Creado el proyecto **privado** en el **GitLab de UTEC**: `juan.pimentel/IPPU-UTEC` (https://git.utec.edu.uy/juan.pimentel/IPPU-UTEC), vía API v4 con PAT de un solo uso (ya revocable). Agregado remoto local `gitlab` (se mantiene `origin`=GitHub) y push de `main` (`cbb3119`). SSH:22 bloqueado → HTTPS. PAT usado de forma efímera (archivo borrado, no cacheado en `.git/config` ni credential helper). (Lucas + Claude)
- **2026-07-01** — Demo L1 **v3.2**: agregados inicio de sesión (usuario pre-creado), barra de búsqueda en inicio (nombre/apellido, N.º de HCE, cédula), distinción activos/inactivos (filtro + alta/baja desde el expediente) y paso de Anamnesis en el alta de NNA. Verificado con Playwright headless (19/19). Commit `bfd063c` sin trailer de co-autoría (a pedido), aún **sin pushear** a GitLab. (Lucas + Claude)
- **2026-07-01** — Demo L1 **v3.3**: listado simplificado (HCE/CI/Nombres/Apellido/Estado); editar NNA; evaluaciones movidas del sidebar a botones en el expediente (Anamnesis · IDEA · Intermedia · Áreas · General); vista Pendientes; IDEA anual (selector por año, KPIs/seguimiento anuales); informe por NNA con descarga Imprimir→PDF y guía de interpretación embebida. Verificado con Playwright (27/27 + generación de PDF). **Sin commitear todavía** — el push/commit a GitLab lo resuelve Lucas. (Lucas + Claude)
- **2026-07-08** — **Arranca el backend (L1).** Decidido stack: **FastAPI + SQLAlchemy + Alembic**, SQLite→Postgres. En `implementacion/L1-hce-idea/backend/`:
  - **Fase 0:** esqueleto FastAPI (`app/main.py`, `/health`, `/docs`), venv + `requirements.txt`, config por `.env`. Verificado (levanta y responde).
  - **Fase 1:** **esquema de datos** diseñado, documentado (`backend/docs/esquema-datos.md` + explicación en lenguaje simple) y con **diagrama ER interactivo** (Artifact, 18 tablas). Modelos núcleo + provisionales (áreas/general, "tablas rígidas como la demo") + **`observacion`** (pestaña de la HCE: fecha/autor/texto). 3 migraciones Alembic (21 tablas de datos). Seed con datos simulados de la demo. Verificado: `total` IDEA = suma de dimensiones.
  - **Fase 2:** **20 endpoints CRUD** en 5 routers (NNA con búsqueda/estado, IDEA, Likert, observaciones, eventos, catálogo, personas). Schemas Pydantic con validación (IDEA 0–8 y 12 dimensiones; `total` y `equivalente_idea` calculados en servidor; 409 en duplicados/CI; ejemplos en Swagger para "Try it out"). Swagger en `/docs`. **12 tests pytest en verde** (base SQLite aislada) + reporte `backend/docs/ejemplos-endpoints.md` (request/response de cada endpoint).
  - **Commit + push:** todo el backend commiteado en `8d0ce55` (42 archivos) y **pusheado a GitHub** (`origin`, `cbb3119..8d0ce55`). En el mismo push subieron los commits de demo v3.2/v3.3 que estaban locales. **`ippu.db`, `.venv` y `.env` NO se versionan** (gitignore). **Falta pushear a GitLab** (`git push gitlab main`, lo resuelve Lucas por credenciales). Próximo: **Fase 3** (conectar la demo a la API). (Lucas + Claude)
- **2026-07-15** — **Ronda de adaptación al Documento Técnico IPPU v1.0 · M0 (housekeeping).** IPPU envió el Documento Técnico v1.0 (jul-2026), el prototipo `HCE_IPPU_Prototipo_v1.html` y una propuesta de datos (`modelo-datos.md`); Claude Web generó el plan `docs/planes/PLAN-modular-adaptacion-HCE-2026-07.md` (M0–M11). **M0 hecho:**
  1. **Archivos:** fuente normativa ubicada en `docs/markdown/1_documento-tecnico-utec-lidia.md` (nombre canónico del plan); prototipo archivado en `docs/fuentes/HCE_IPPU_Prototipo_v1.html`; `modelo-datos.md` en `docs/markdown/`. **Docling no se corrió sobre el prototipo:** es una app JS (la conversión rinde solo el shell estático) y sus reglas ya están como markdown en el Doc. Técnico §5/§8; queda como referencia HTML interactiva (§11). Si se quisiera la conversión, se corre aparte.
  2. **`handoff.md`:** actualizados foco y fuente normativa (cabecera), registradas las 6 decisiones del plan §0 (nueva §5.1) y depurada §7 (sacadas las resueltas: stack backend y BD).
  3. **Demo:** ocultados los botones "Eval. por áreas" y "Eval. general" del expediente (`hce_idea_ippu_demo.html`, línea ~1821). Código y vistas conservados, solo se dejan de exponer (decisión §5.1.2); se resuelven como archivo histórico en M7.
  - **Verificación:** Playwright headless — la demo carga sin errores de consola y los botones ocultos ya no están en el DOM (los de Anamnesis/IDEA/Intermedia siguen presentes).
  - **Sin commitear** (commit/push los resuelve Lucas). **Próximo: M1** — motor de flujo (estado `bloqueado|borrador|firmado`, firma=bloqueo, addenda, habilitación excepcional, mock HCE-LOG), a revisar antes de construir. (Lucas + Claude)
- **2026-07-15** — **M1 · Motor de flujo (demo v3.5).** Construido sobre `hce_idea_ippu_demo.html` (sin tocar backend). Infraestructura compartida por CI/LB/PA/PB/IC:
  - **Modelo:** por NNA, `flujo={ci,lb,pa,pb,ic}` (cada uno `{firmado, firmas[], addendas[], excepcion}`) + `hceLog[]`. El estado visible (`bloqueado|borrador|firmado`) es **derivado** (sin drift): firmado si `firmado`; borrador si habilitado por secuencia; si no, bloqueado.
  - **Reglas (§4):** `moduloHabilitado()` implementa la secuencia CI→LB→PA→PB→IC; **CI firmado es requisito no exceptuable** (sin él, LB/PA/PB/IC quedan bloqueados y sin opción de excepción). Firma = bloqueo; corrección posterior = **addenda** (no edición directa). **Habilitación excepcional** con constancia obligatoria → pasa bloqueado→borrador y se registra en HCE-LOG (nunca oculta).
  - **UI:** tarjeta "Flujo de módulos" en el expediente (stepper + filas con badge y acciones firmar/addenda/habilitar) + **vista HCE-LOG** (solo lectura, no persistente). Helpers `estadoBadgeM`, `stepperHtml`, `flujoPanelHtml`, `renderFlujo`; modal reusable `#modalFlujo`. La `eval-bar` (Anamnesis/IDEA/Intermedia) queda intacta (se recablea en M2–M6). Firma con **hook de integridad vacío** `validarIntegridad()` (lo llenan M4–M6); el botón "Editar" es stub.
  - **Seed:** los 8 NNA con `flujo`+`hceLog`; los **4 arquetipos §11** = Martín(102) ciclo completo firmado · Sofía(101) CI+LB firmados/PA borrador · Joaquín(104) CI firmado/LB borrador · Bruno(107) CI pendiente/todo bloqueado. Otros (103/105/108) con CI+LB firmados para dar variedad.
  - **Verificación:** Playwright headless — **14/14 checks en verde**, incl. el caso de aceptación (PA sin LB → habilitación excepcional → firma → excepción y firma visibles en HCE-LOG), la regla dura de CI, la regresión de M0 y 0 errores de consola; + 2 screenshots revisados. **Sin commitear.** Próximo: **M2+M3** — HCE-00 (Identificación/Anamnesis, siempre abierto) + HCE-CI (Consentimiento, único bloqueo sin excepción). (Lucas + Claude)
- **2026-07-15** — **M2 + M3 · HCE-00 y HCE-CI (demo v3.5).** Sobre `hce_idea_ippu_demo.html`.
  - **M2 · HCE-00 (Identificación y anamnesis, siempre editable):** nuevos campos en el modelo — `cie11`, `tecnico1`/`tecnico1_rol` + `tecnico2`/`tecnico2_rol` (roles fijos Psicólogo/a + Maestro/a, §0.5) — con backfill de los 8 NNA. Agregados al wizard (paso 2: CIE-11 + 2.º técnico), a `openEditar` y a `crearNNA`. En el expediente: tarjeta "HCE-00 · Identificación y datos clínicos" con badge **"Siempre abierto"**, CIE-11, nivel de soporte y los 2 técnicos; anamnesis rotulada HCE-00; botón "✎ Editar HCE-00" siempre disponible. Al guardar la edición se registra un evento `edicion` en HCE-LOG (módulo `hce00`). Verificado: editar HCE-00 de un NNA con LB/PA/PB/IC firmados **no** altera los módulos firmados.
  - **M3 · HCE-CI (Consentimiento, único bloqueo sin excepción):** el bloqueo ya lo dejó M1; ahora el CI tiene formulario propio — firmante, fecha, **3 autorizaciones** (evaluación / registro / comunicación a organismos) y **adjunto mock** — guardadas en `flujo.ci`. Vista de detalle `verCI` (botón "Ver" en el panel cuando el CI está firmado). Seed de CI con autorizaciones/adjunto.
  - **Fix de un bug latente de M1:** los NNA creados por el alta *después* de la carga ahora reciben `flujo`+`hceLog` (antes, abrir su expediente rompía).
  - **Verificación:** Playwright — **18/18 (M2+M3) en verde** + regresión M1 **14/14** + 2 screenshots revisados; 0 errores de consola. **Sin commitear.** Próximo: **M4** — HCE-LB (IDEA como línea base única): el más delicado, cambia la lógica anual y toca datos seed existentes. (Lucas + Claude)
- **2026-07-15** — **M4 · HCE-LB: IDEA como línea base única (demo v3.6).** El módulo más delicado — cambia de arquitectura, no solo de nombre.
  - **Quitada la lógica anual:** selector de año (`selPeriodo`), KPI/Pendientes por año y el `guardarIDEA` que apilaba entradas anuales en `historial`. El IDEA vive ahora en **`flujo.lb`** como instancia **única** (payload: `dim[12]` (0–8 | 'NS' | null), `obs[12]`, `fecha`, `sesiones`, `sintesis`, `objetivos`, `migrado`). Regla de reingreso (>12 meses) = nueva instancia de LB.
  - **Editor IDEA reconectado:** carga/guarda la LB del NNA (sin año), soporta **NS** por dimensión (`lbTotales` la excluye y bloquea la firma), y agrega sesiones de observación, síntesis, objetivos y marca "migrado". "Firmar línea base" pasa por el motor de M1 (`firmarModulo(id,'lb')`) con **firma doble** y queda read-only al firmar. En el panel de flujo, "Editar IDEA" (borrador) abre el editor y "Ver" (firmado) abre `verLB`.
  - **Validación de integridad (§4.3):** se llenó el hook de M1 para `lb` — 12 dim sin NS + fecha + síntesis + objetivos (bloqueantes).
  - **Migración del seed (calcada al prototipo, criterio de aceptación):** Martín(102) = usuario demo 1 → **total 58**, escalas 18/14/14/12; Sofía(101) = demo 2 (31); Joaquín(104) = demo 3 (borrador con NS en D3/D12); otros con IDEA generado. KPI "Con línea base IDEA", vista Pendientes y tarjeta del expediente reescritas al modelo único. `generarInforme` ajustado al modelo único (rework completo = M6).
  - **Verificación:** Playwright — **17/17 en verde**, incl. el **criterio de aceptación §12-A** (reproducir usuario demo 1: total IDEA 58, escalas 18/14/14/12), NS bloquea la firma, flujo completo de firma de LB, `verLB`, tarjeta del expediente; + regresión M0–M3 (M1 14/14 · M2+M3 18/18) y 0 errores de consola. Screenshots revisados. **Sin commitear.** Próximo: **M5** — HCE-PA/PB (Escala IPPU-TEA: 24 ítems Likert 1–5, delta B−A, y la **regla dura de no-homologabilidad** IDEA vs. IPPU-TEA). (Lucas + Claude)
- **2026-07-15** — **Commit + push M0–M4 y sincronización de remotos.** Dos commits en `main`: `268f1de` (docs: documento técnico, prototipo, modelo-datos, plan) y `72df9a9` (feat demo M0–M4, v3.6). GitLab tenía un commit de un compañero (`08e93ba` Edit README.md) → integrado con **merge** (`0ab7610`, sin conflicto) y **pusheado a los dos remotos**: GitHub `origin` y GitLab `gitlab` ahora en `0ab7610`. (Ya **no** falta pushear a GitLab.) Hay además una rama `feature/base-datos-hce` en GitLab (WIP de un compañero, no tocada). (Lucas + Claude)

- **2026-07-29** — **M5 · HCE-PA/PB: Escala IPPU-TEA completa (demo v3.7).** Cierre de los 4 sub-módulos del checkpoint (M5.1 venía de la sesión anterior):
  - **M5.1 — Datos y lógica:** `IPPU_ITEMS` (24, 4×6), `LIKERT_LBL`, payload `flujo.pa/pb` (`kind:'protocolo'`, `item[24]`, `obs[24]`, `fecha`, `semanas`, `sintTec1/2`, `otros`; `pb.deltas`/`ajustes`), `flujo.lb.kind='idea'`, `protTotales`, `calcularDelta` (guard de no-homologabilidad: lanza error si recibe algo que no sea `kind:'protocolo'`), `deltaInterpreta`, `ALERTA_DELTA=-7`, seed PA/PB (Martín A+B firmados = usuario demo 1: PA 60 / PB 79 / Δ +19; Sofía PA borrador).
  - **M5.2 — Editor PA/PB:** vista única `view-prot` parametrizada A|B (tabs), 24 ítems con las clases CSS que ya había dejado M5.1 (`.prot-esc/.prot-item/.lik-btn/.prot-obs`; ojo: existían y estaban `display:none` por defecto — la obs sólo se muestra si el ítem vale 1/5, obligatoria con marca roja, o si ya tiene texto). Campos fecha/semanas/síntesis 1 y 2/otros (+ ajustes sólo PB); `cargarProt/guardarProt/firmarProt` por el motor M1; validación §4.3 en `validarIntegridad` (24 ítems + obs en 1/5 + fecha + 2 síntesis; semanas<15 advierte sin bloquear); aviso de bloqueo con motivo; read-only al firmar; des-stub de "Editar Protocolo A/B" en el panel de flujo.
  - **M5.3 — Delta/alerta/Ver:** `calcularDeltasPB` en `confirmarFirma` (al firmar B: delta B−A automático; sin PA firmado → `deltas=null` + constancia en HCE-LOG); alerta institucional Δ≤−7 por escala (evento `alerta` en HCE-LOG, tag `lt-alerta`, + toast diferido); `verProt` (detalle firmado: totales por escala, deltas con interpretación y ⚠, síntesis, ajustes, nota de no-homologabilidad, addendas) con botón "Ver" en el panel; **quitado "Eval. intermedia" de la eval-bar** (reemplazada por accesos a Protocolo A/B; el código de la vista se conserva sin exponer, como áreas/general).
  - **M5.4 — Verificación y cierre:** **Playwright 39/39 en verde** (obs 1/5 bloquea la firma, delta automático al firmar B, Δ≤−7 dispara alerta, PB sin PA → sin delta con constancia, guard rechaza la LB, Martín/Sofía/Bruno por arquetipo, regresión M0–M4 incl. criterio §12-A IDEA=58) + 4 screenshots revisados; bump a **v3.7**.
  - **Commit + push:** `1facc1c` (incluye el M5.1 que había quedado sin commitear) pusheado a **ambos remotos** (GitHub `origin` y GitLab `gitlab`, sin conflictos). **Próximo: M6** — HCE-IC (Informe de Cierre Anual: requiere LB+PA+PB firmados, tabla comparativa + radar SVG reimplementado, firma doble + "Recibí" de la familia, PDF vía `@media print` — "el único informe válido"). (Lucas + Claude)

- **2026-07-30** — **M6 · HCE-IC: Informe de Cierre Anual (demo v3.8).** Sobre `hce_idea_ippu_demo.html`, por el motor de M1.
  - **Modelo:** payload en `flujo.ic` — `fecha`, `sintEsc[4]` (síntesis por escala), `valTec1/valTec2` (valoraciones anuales), `recomendaciones`, `orientaciones`, `recibi` (`{firmante, fecha}`, se registra después de la firma).
  - **Editor `view-ic`** (mismo patrón que PA/PB): tabla comparativa IDEA/PA/PB/Δ y **radares SVG propios** (`radarSVG` reimplementado, no copiado del prototipo) **autogenerados sólo desde módulos firmados** (`icDatosFirmados`/`icTablaHtml`/`icRadaresHtml`); módulos sin firmar aparecen como "—". Regla dura §5.2 respetada: IDEA e IPPU-TEA **siempre en radares separados**, delta sólo el que calculó el motor al firmar B. Read-only al firmar.
  - **Validación §4.3** (en `validarIntegridad`): 4 síntesis por escala + valoraciones de ambos técnicos + recomendaciones + orientaciones + fecha (bloqueantes); ≈100 palabras por escala advierte sin bloquear. Firma doble vía `firmarModulo(id,'ic')`.
  - **«Recibí» de la familia:** modal propio (`openRecibiModal`/`confirmarRecibi`), sólo con IC firmado, con constancia en HCE-LOG; visible en el panel de flujo (meta + botón) y en el pie del informe.
  - **`generarInforme` reescrito ("el único informe válido", §5.3):** el PDF con membrete (FUNDACIÓN IPPU, datos del NNA, análisis cuantitativo con tabla+radares, cualitativo por escala, síntesis interdisciplinaria, recomendaciones, orientaciones, addendas, firmas + Recibí, leyes 18.331/18.335) se genera **únicamente desde el HCE-IC firmado**; sin IC firmado se muestra el estado del flujo (stepper) sin versiones alternativas. Descarga vía Imprimir→PDF (`@media print` ya existente).
  - **UI:** fila IC del panel de flujo des-stubeada (✎ Editar Informe / Ver informe / ✍ Recibí); botón "Informe de Cierre (IC)" en la eval-bar; botones del expediente renombrados a "Informe de Cierre Anual". Seed: Martín (102) con IC completo calcado del usuario demo 1 del prototipo (sintEsc con Δ +4/+6/+4/+5, Recibí 2026-12-19).
  - **Verificación:** Playwright — **35/35 en verde**: informe de Martín (membrete, IDEA 58/96 §12-A, PA 60/PB 79/Δ +19, 2 radares separados, PDF), ciclo completo de firma del IC en NNA 103 (integridad §4.3 bloquea incompleto → firma doble → HCE-LOG → Recibí), habilitación excepcional (105) con "—" en no firmados, informe inexistente sin IC firmado (101), regresión M0–M5 (CI no exceptuable, guard de no-homologabilidad, áreas/general/intermedia ocultas) y 0 errores de consola; + screenshots y PDF revisados (fix: etiquetas del radar ya no se recortan).
  - **Commit + push:** `1698b5f` a **ambos remotos** (GitHub `origin` y GitLab `gitlab`). **Próximo: M7** — HCE-DOC (documentos y fotos: adjuntos categorizados, fotos condicionadas a autorización de imagen, y migración simulada de áreas/general a "Registro histórico — HCE anterior" que resuelve formalmente el descarte de M0). (Lucas + Claude)

- **2026-07-30** — **M7 · HCE-DOC: Documentos y fotos (demo v3.9).** Sobre `hce_idea_ippu_demo.html`.
  - **Panel HCE-DOC en el expediente** (`docPanelHtml`/`docBodyHtml`/`renderDoc`): tabla de adjuntos (nombre, categoría —12 del prototipo—, fecha original, fecha de carga), adjuntar/quitar con constancia en HCE-LOG (`MOD_LABEL.doc="HCE-DOC"`). Modelo por NNA: `docs[]`, `fotos[]`, `autImagen{registrada,fecha,adjunto}`; las altas nuevas los inicializan (`crearNNA`).
  - **Archivo histórico (§10):** categorías "Registro histórico — HCE anterior (Eval. por áreas / Eval. General / Observaciones / otro)" quedan **de solo lectura** (`quitarDoc` las rechaza; 🔒 en la tabla; fecha original visible). **Resolución formal del descarte de M0 (§0.2):** se **eliminaron** las vistas y el código de "Eval. por áreas" y "Eval. general" (ocultas desde M0); sus registros del sistema anterior viven como documentos históricos seed (Martín, Sofía, Valentina).
  - **Protección de imagen (§8.4) como regla de lógica, no de UI:** sin `autImagen.registrada`, `subirFoto()` se bloquea aunque se invoque directo, con mensaje claro (art. 11 CNA — Ley 17.823). Registro de autorización por modal → adjunta copia en docs (categoría "Autorización / consentimiento") + constancia en HCE-LOG. **Fotos grupales** en la vista Grupos: exigen autorización de **todas** las familias de los integrantes **activos** del grupo; el sistema informa qué integrantes faltan (`grupoAutImagen`/`subirFotoGrupo`, también bloqueado a nivel de lógica).
  - **Seed:** Martín(102) aut. registrada + informe externo + 2 históricos + 1 foto · Sofía(101) **caso negativo** (sin autorización) + histórico · Valentina(103) aut. + histórico → Grupo C queda habilitado para foto grupal (Tomás 106 no cuenta: inactivo).
  - **Verificación:** Playwright — **25/25 en verde**: caso negativo §8.4 por UI y por llamada directa, registro de autorización habilita la carga, histórico inmutable, fotos grupales bloqueadas con integrantes nombrados, y regresión M0–M6 (áreas/general eliminadas, §12-A IDEA=58, guard de no-homologabilidad, informe IC intacto, Bruno todo bloqueado); 0 errores de consola; screenshots revisados.
  - **Commit + push:** `11bc116` a **ambos remotos**. **Próximo: M8** — HCE-ORG (áreas INAU y BPS por NNA: SIPI/convenio/referente + registro de informes enviados; prestación/trámite/estado/vencimiento + registro de gestiones). (Lucas + Claude)

- **2026-07-30** — **M8 · HCE-ORG: Áreas INAU y BPS (demo v3.10).** Sobre `hce_idea_ippu_demo.html`.
  - **Panel HCE-ORG en el expediente** (`orgPanelHtml`/`orgBodyHtml`/`renderOrg`), dos columnas por NNA: **INAU** (SIPI, convenio, referente territorial, ingreso, obs + tabla de **envíos** de informes/comunicaciones) y **BPS** (prestación, trámite, estado con color + vencimiento, obs + tabla de **gestiones**). Modelo por NNA: `inau{...envios[]}` / `bps{...gestiones[]}`, inicializado en backfill y `crearNNA`.
  - **Registros:** alta con fecha+detalle obligatorios y quita, ambas con constancia en HCE-LOG (`MOD_LABEL.org="HCE-ORG"`). Edición inline de campos (`orgSet`) persistente al re-render. Copy: documentación respaldatoria → HCE-DOC; informe a organismos = **documento único HCE-IC** (§5.3); nota de alertas sugeridas (AYEX 60/30 días → recordatorios M10).
  - **Seed:** Martín(102) convenio INAU completo + 2 envíos (incl. IC 2026) + AYEX vigente con vencimiento 2027 · Sofía(101) AYEX en trámite + 1 gestión · Joaquín(104) ingreso reciente sin envíos.
  - **Verificación:** Playwright — **20/20 en verde**, incl. el criterio del plan (alta de envío INAU y gestión BPS visibles en el expediente), validación fecha+detalle, quitar con log, y regresión M0–M7 (§12-A IDEA=58, guard, informe IC, regla de imagen §8.4, áreas/general fuera); 0 errores de consola; screenshot revisado.
  - **Commit + push:** `f4b2884` a **ambos remotos**. **Próximo: M9** — HCE-VF (valoración funcional BUND/CIF: registro oficial, tabla de categorización **parametrizable** (§0.4), perfil CIF de 6 dominios, **salvaguarda dura** anti-conversión desde puntajes clínicos, autogeneración descriptiva y Reporte de Valoración Funcional imprimible). (Lucas + Claude)

- **2026-07-30** — **M9 · HCE-VF: Valoración funcional BUND/CIF (demo v4.0).** Sobre `hce_idea_ippu_demo.html`.
  - **Panel HCE-VF en el expediente** (`vfPanelHtml`/`vfBodyHtml`/`renderVf`): registro de la valoración oficial (estado/fecha/organismo/%/vigencia/RNPcD; "IPPU registra, no certifica", §7.1; <2 años sólo IBMF/IRSA), **categoría derivada de `BUND_CATS`** (tabla **parametrizable**, constante única, §0.4 — cortes a confirmar por IPPU contra el anexo del Decreto 72/025) y **alerta de vigencia** 90/30 días + vencida (§7.8, `vfAlertaVigencia`).
  - **Salvaguarda dura (§7.5) a nivel de lógica:** `categoriaBaremo()` **lanza error** si recibe cualquier cosa con forma de instrumento clínico (`flujo.lb`, `lbTotales`, protocolo, `protTotales`) — mismo patrón que el guard `calcularDelta` de M5. La categoría sale únicamente de `vf.pct` (oficial).
  - **Perfil CIF (§7.3):** 6 dominios (`VF_DOMINIOS`, referencia CIF) con 4 niveles de autonomía + capacidades/barreras/apoyos/observaciones + síntesis funcional editable.
  - **Autogeneración descriptiva (§7.4)** (`genVFBorrador`): borrador **sólo con frases** (verificado: sin dígitos ni %) desde la LB firmada (`descAfect` por escala, orden fortaleza→necesidad) + evolución desde `pb.deltas` del motor (`descDelta`); sugiere autonomía **sólo** en comunicación←E2 · interacciones←E1 · aprendizaje←E4 y sólo si están vacíos; nota de revisión obligatoria; constancia en HCE-LOG (`MOD_LABEL.vf`).
  - **Reporte de Valoración Funcional (§7.6)** (`generarReporteVF`): imprimible para la familia, generable a demanda, capacidades primero, **las secciones vacías no aparecen**, sin puntajes clínicos crudos, disclaimer "no es certificado ni informe clínico". **Guía de prestaciones (§7.7)** como `<details>` estático (RNPcD, AYEX, AFAM, pensión, asistentes, transporte, cuota laboral, educación). Terminología §8.1 respetada.
  - **Seed:** Martín(102) valoración completa (58 % → Severo, vigencia 2028, dominios y narrativos) · Sofía(101) parcial (En trámite, 3 dominios, sólo capacidades) — para el criterio de datos parciales.
  - **Verificación:** Playwright — **34/34 en verde**: salvaguarda probada por 4 vías (todas lanzan) con la vía oficial intacta, categoría recalculada al cambiar % (20→Leve) y sin categoría fuera de rango, borrador sin números con sugerencias sólo en dominios con correlato y vacíos, reporte completo/parcial/mínimo (secciones vacías ausentes), alertas 90/30/vencida, y regresión M0–M8; 0 errores de consola; screenshots revisados.
  - **Commit + push:** `1dedc8b` a **ambos remotos**. **Próximo: M10** — cierre de ronda: búsqueda por 3 vías (falta "grupo"), recordatorios configurables no bloqueantes, Playwright punta a punta (CI→LB→PA→PB→IC + DOC/ORG/VF), actualizar `README.md` y cerrar `handoff.md` con el estado nuevo. (Lucas + Claude)

- **2026-07-30** — **M10 · Cierre de ronda: transversales y QA (demo v4.0). RONDA M0–M10 COMPLETA.**
  - **Búsqueda por grupo (3.ª vía):** `coincideBusqueda` acepta "grupo a" o la letra exacta del grupo (además de nombre/apellido, cédula y N.º de HCE); placeholder actualizado. Nota: una letra sola también matchea nombres que la contienen (comportamiento pre-existente de la búsqueda por nombre); la sintaxis inequívoca es "grupo X".
  - **Recordatorios configurables (§4):** tarjeta en Analítica institucional con los 4 períodos del Manual (IDEA al ingreso · PA en julio · PB última semana lectiva · IC post-PB), cada uno con toggle activo, período editable y **pendientes derivados del estado del flujo** (módulo previo firmado y éste sin firmar) con link al expediente. **Nunca bloqueantes** — sólo informan.
  - **QA punta a punta (Playwright, 25/25):** ciclo completo de **Bruno (107) desde cero por los editores reales** — firmar CI (modal) → LB puntuada clickeando las 12 dimensiones (total 48) → PA (24 ítems) → PB con ítem=1 (la firma se rechaza sin observación §4.3, luego delta automático) → IC (formulario + firma + Recibí) → informe único con membrete; DOC (foto bloqueada→autorizar→cargar), ORG (envío INAU + gestión BPS), VF (40 % → Moderado + borrador descriptivo + reporte familiar) sobre el mismo NNA; búsqueda por las 3 vías; recordatorios; y regresión M0–M9 (guards §5.2 y §7.5, §12-A IDEA=58, informe IC de Martín con Δ +19 y 2 radares). 0 errores de consola.
  - **Docs:** `README.md` actualizado (árbol con backend y plan, sección "Estado de la Línea 1"); `handoff.md` cerrado con el estado nuevo (cabecera + §3).
  - **Commit + push:** (este commit) a ambos remotos. **PRÓXIMO PASO (decisión de Lucas, 2026-07-30): arrancar el backend — ronda M11 (backend v2).** Recordar la **puerta de entrada** del plan §M11: validar M0–M6 con IPPU (sobre todo IDEA como línea base única) y **cerrar primero las 3 decisiones de arquitectura del Anexo A** — (a) SQLite dev vs. Postgres-only, (b) dónde vive la lógica de negocio (Pydantic/servidor vs. triggers), (c) alcance de portabilidad institucional — más los bugs A y B de `modelo-datos.md` antes de usarlo como base. Luego: esquema v2 → migrar seed → tests → recién ahí Fase 3 (conectar demo↔API). (Lucas + Claude)

- **2026-07-30** — **Arranque de M11 · backend v2.** Cerradas las **3 decisiones de arquitectura** del Anexo A (Lucas eligió las recomendadas; registradas en §5.2): **Postgres-only** (docker-compose, se abandona SQLite en dev) · **lógica de negocio en el servidor** (Pydantic/servicios, sin triggers; BD = integridad estructural) · **portabilidad paramétrica mínima** (baremo/roles-texto/recordatorios/categorías como dato; sin capa `config_institucion`). Escrita y pusheada la **propuesta de esquema v2** (`backend/docs/esquema-datos-v2.md`, commit `d8d6533`): corrige los bugs A (informe_cierre 1:N anual) y B (persona↔hce 0..1 + `persona_servicio`) de `modelo-datos.md`, modela los payloads validados de la demo v4.0 (mixin de firma con estado derivado, `idea` línea base única con dim JSONB, `protocolo` A/B con deltas sólo en B, DOC/foto/ORG/VF/auditoría), mapea cada regla dura a su servicio con test previsto, y define el plan M11.1–M11.6 con criterio de aceptación §12-A (reproducir el usuario demo 1 por API: IDEA 58 · PA 60 · PB 79 · Δ +19). **Próximo: revisar la propuesta con Lucas/equipo → M11.1 (infra Postgres-only: docker-compose, config, Alembic re-inicializado) → M11.2 (modelos + migración + catálogos).** Los 12 tests v1 se reescriben como tests v2 (previsto en el plan). (Lucas + Claude)

- **2026-08-03** — **Coordinación del equipo: se arregla la causa raíz del trabajo duplicado.** Sesión sin cambios de código; el objetivo fue poder trabajar los tres en paralelo sin solaparnos.
  - **Hallazgo:** la rama `gitlab/feature/base-datos-hce` (Victor, 2026-07-15, commits `2bcf7d2`+`dfb1732`, 1.605 líneas en `implementacion/hce-db/`) contiene un **diseño completo y verificado** de la BD en PostgreSQL + JSONB — esquema `hce`, catálogos, seed de los 4 demo del §11, probado end-to-end en PG18 y reproduciendo los mismos números que la demo (IDEA 58 · PA 60 · PB 79 · Δ +19) — pero con las reglas de negocio en **triggers PL/pgSQL**, o sea la decisión **opuesta** a §5.2. Se hizo en paralelo con `esquema-datos-v2.md`, sin que ninguno supiera del otro.
  - **Causa raíz (no fue error de nadie):** `handoff.md` y `CLAUDE.md` estaban en `.gitignore` desde el commit inicial. El `README.md` versionado decía *"handoff.md ← empezar por acá"*, pero para el resto del equipo ese archivo **no existía**: las decisiones de §5 vivían sólo en la máquina de Lucas.
  - **Decisiones (§5.3):** seguimos en `main` con el esquema v2 y §5.2 (lógica en el servidor) · la rama de Victor queda **aparcada, no descartada** (su SQL es material de consulta para M11, ver §12.5) · `handoff.md` y `CLAUDE.md` **salen del `.gitignore`** y se versionan · **M11 lo toma Victor** en una sesión nueva con todo el contexto.
  - **Cambios:** `.gitignore` (quitadas las 2 exclusiones, con nota del porqué) · `handoff.md` (nueva **§12 · Flujo de trabajo del equipo**: contexto versionado, remoto principal, reparto por módulo con la demo como recurso exclusivo, checklist de sesión, qué reutilizar de `hce-db`, regla anti-contradicción; + §5.3, §6 con responsables, §8 equipo actual de 3; la bitácora pasó de §12 a §13) · `CLAUDE.md` (arranque de sesión, estado real de M11, regla anti-contradicción) · `README.md` (puntero al flujo de trabajo).
  - **Próximo: Victor arranca M11.1** (infra Postgres-only: docker-compose + config + Alembic re-inicializado) en rama `feat/M11.1-infra-postgres`, leyendo primero `handoff.md` §5.2/§12 y `backend/docs/esquema-datos-v2.md`. Pendiente de confirmar entre los tres: **remoto principal** (§12.2). (Lucas + Claude)
- **2026-08-07** — **Pull de GitLab + auditoría de estructura del repo + 2 decisiones de flujo.** Sesión sin tocar código de ningún módulo en curso (no se pisó M11 de Victor ni la demo).
  - **Pull:** `git pull` de `gitlab` trajo la rama `rama1` (Victor, 2026-08-05) con `graphify-out/` — grafo de conocimiento del repo generado con `/graphify` (572 nodos, 870 aristas, 80 comunidades) — y una actualización de `.gitignore`. Fast-forward a `main` sin conflictos.
  - **Auditoría de estructura** (grafo + inspección manual del filesystem, antes de decidir push): sin ciclos de import; hygiene de `.gitignore` correcta (`.env`, `__pycache__`, `.pytest_cache`, `ippu.db` no trackeados pese a existir en disco); god nodes del grafo (`ORMModel`, `Base`, `Nna`) son normales para un ORM, no señal de acoplamiento real. Dos brechas reales encontradas y resueltas en esta sesión (ver abajo). Otras dos quedan anotadas para más adelante, sin acción ahora por no pisar el módulo de Victor: `backend/docs/esquema-datos.md` (v1) desactualizado frente a `esquema-datos-v2.md` — se resuelve naturalmente en **M11.6 docs**; cobertura de tests del backend v1 (`test_api.py`, 12 tests) suficiente por ahora — invertir más ahí es esfuerzo tirado porque M11 reemplaza el backend entero (M11.5 ya planea pytest contra Postgres).
  - **Decisiones (§5.4):** `gitlab` ratificado como remoto principal, `origin` como espejo · `docs/notas/` sale de `README.md`/`CLAUDE.md` (estaba vacía y sin trackear — Samuel y Victor no la tenían al clonar).
  - **Cambios:** `README.md` y `CLAUDE.md` (quitada la línea `docs/notas/` del árbol) · carpeta local `docs/notas/` eliminada (no versionada, sin efecto en git) · `handoff.md` (nueva §5.4, §6 con el pendiente de remoto principal cerrado, §12.2 pasa de propuesta a decisión confirmada, esta entrada de bitácora).
  - **Próximo:** push de este commit a los dos remotos (`gitlab` primero, luego `origin`) y arrancar el trabajo que Lucas defina para esta sesión. (Lucas + Claude)
- **2026-08-07** — **Modularización de la demo L1 (§5.5).** Rama `feat/demo-modular`. Refactor puro, sin cambios de lógica.
  - **Qué se hizo:** `hce_idea_ippu_demo.html` (3.949 líneas) → `demo/index.html` (575) + `demo/css/estilos.css` (532) + `demo/js/` (12 módulos, 2.847 líneas). El corte se hizo **por rangos de línea con un script**, no retipeando código, para que el contenido se moviera byte a byte. El monolito se eliminó del repo (sigue en la historia de git).
  - **Reparto de los módulos JS:** `utils.js` (helpers, carga 1º) · `datos.js` (seed NNA) · `flujo.js` (M1 motor de flujo, 554 líneas) · `catalogos.js` (IDEA anual, Escala IPPU-TEA, IDEA oficial) · `ui-core.js` (navegación, tabla, form IDEA, Likert, gráficos, toast, sesión) · `wizard-nna.js` · `expediente.js` · `evaluaciones.js` (M5.2) · `informe-cierre.js` (M6) · `hce-doc-org-vf.js` (M7/M8/M9, 468 líneas) · `recordatorios.js` (M10) · `grupos-usuario.js`.
  - **Un problema real encontrado y resuelto:** al partir, el hoisting de funciones dejó de ser global y el seed de `flujo.js` reventó llamando a `fmtFecha()` (declarada en lo que hoy es `expediente.js`) — `ReferenceError` en carga. Se resolvió creando `js/utils.js`, que carga primero. **Lo detectó el fingerprint, no la vista**: la demo se veía bien igual, porque el error abortaba el seed en silencio. Detalle y regla para el futuro en §5.5.2.
  - **Verificación:** fingerprint Playwright del monolito capturado **antes** del refactor y comparado después → **40 comparaciones, todas idénticas, 0 errores**. Cubre carga, catálogos, las 174 funciones globales, el motor M1 de los 8 NNA, 5 vistas, 8 expedientes, las **reglas duras** (§5.2 y §7.5) y los **caminos interactivos** (firma CI/PA/PB con delta y alerta, addenda, excepción, modales, vistas dinámicas). Integridad del contenido: multiset de líneas idéntico (2.719 JS), orden relativo intacto en 2.712, CSS 510 y markup 499 idénticos línea por línea. El fingerprint quedó **versionado** en `demo/verificacion/` (§5.5.4).
  - **Efecto en el flujo de equipo:** §12.3 cambia — la demo **deja de ser recurso exclusivo**; se puede trabajar en paralelo tomando archivos distintos de `demo/js/`. `index.html` y `js/utils.js` quedan como compartidos (coordinar antes). Con esto Samuel puede entrar a la demo sin esperar.
  - **Code review (cloud, multi-agente):** **2 hallazgos, ambos `nit`, ambos de documentación** — ninguno en el refactor, ni en los 12 módulos, ni en el orden de carga, ni en el harness. (a) la cabecera de este archivo seguía fechada 2026-08-03; (b) `README.md` seguía diciendo "un solo archivo → una sola persona a la vez", contradiciéndose con su propio árbol de estructura. Los dos corregidos antes del merge.
  - **Nota operativa:** las dos primeras corridas del review fallaron. La causa real fue que `feat/demo-modular` y `review-base` **existían sólo en local**: el review corre en un contenedor que clona del remoto y no pudo resolver la base. **Si se usa review en la nube, pushear la rama primero.**
  - **Mergeado a `main`** y pusheado a los dos remotos. Ramas auxiliares (`review-base`, `backup-demo-modular`) eliminadas: su contenido está en `main`. (Lucas + Claude)

- **2026-08-07** — **Analítica institucional calculada (demo v4.1) + exclusión de las fuentes del grafo.** Rama `feat/demo-analitica-real`, mergeada a `main`. Era el último pendiente libre de la demo y la pata menos desarrollada de L1 ("HCE + IDEA + **analítica**").
  - **Hallazgo que cambió el alcance.** La vista seguía anclada a la arquitectura **previa** al Documento Técnico: mostraba *"Puntaje por escala IDEA — Enero vs Noviembre"* y *"Mejora promedio anual · IDEA"*. Desde **M4** el IDEA es **línea base única** (§5.1.1): ese segundo punto temporal no existe en el modelo, y §5.2 prohíbe suplirlo homologando con la Escala IPPU-TEA. O sea que esos dos indicadores **no estaban hardcodeados por comodidad — eran incalculables por diseño**. Se rediseñó la vista antes de programarla, con Lucas aprobando las dos decisiones abiertas.
  - **Qué se hizo** (`renderAnalitica()` + `analiticaAgregados()` en `demo/js/ui-core.js`, markup en `index.html`): KPIs derivados en un `#anKpi` — cobertura de línea base **71 %** (5 de 7 activos) · IDEA promedio **47,0/96** banda Moderado · **Δ B−A IPPU-TEA +19,0** sobre **1 de 7** con ciclo A → B cerrado · ciclos completos **1 de 7**. El gráfico de escalas pasó a **perfil poblacional de la línea base** (/24) y se agregó una **tarjeta nueva y separada** de **evolución Protocolo A → B** (/30), con la advertencia de que ahí el puntaje **sube** cuando hay progreso — dos instrumentos, dos tarjetas, nunca el mismo eje (§5.2). Distribución por banda sobre las LB firmadas, con nota de cuántos activos quedan fuera. Estados vacíos reales en ambos gráficos.
  - **Reglas respetadas:** el **delta no se recalcula** — se promedia el que registró el motor al firmar el PB (M5.3); los NNA con PB firmado por habilitación excepcional (`deltas=null`) quedan fuera. Se **retiró** el KPI "Taller de mayor eficacia": cruzar taller × escala es el heatmap, fuera de alcance por §5.1.3. El heatmap quedó **intacto** y rotulado *"datos ilustrativos"*.
  - **Verificación** (fingerprint versionado): **38 de 40 pasos idénticos**; los 2 distintos son los esperados — la vista analítica y la lista de globales (**+4**, ninguna perdida). **`D1_modelo_final` OK: la analítica sólo lee, no muta.** Guards §5.2 y §7.5 en verde, los 8 expedientes y los caminos interactivos sin cambios, 0 errores de consola. Criterio **§12-A intacto y ahora visible en el panel** (PA 60 · PB 79 · Δ +19). Reactividad probada: baja del NNA 103 → cobertura 71→67 %, promedio 47,0→45,0, banda Moderada 4→3; al reactivarlo vuelve exacto.
  - **Harness ampliado:** paso **`D3_analitica_derivada`** — captura los agregados *después* de las mutaciones y afirma `derivadoOk` contrastando el panel contra un recálculo hecho en el momento. Si alguien vuelve a hardcodear un indicador, D3 lo delata. Documentado en `demo/verificacion/README.md` (incluida la advertencia de no leer el Δ de D3 como dato clínico: es artefacto del Protocolo B vacío que el harness firma para forzar la alerta).
  - **Code review (cloud, multi-agente): 0 hallazgos.** La rama se pusheó **antes** de lanzarlo, siguiendo la nota operativa de la sesión anterior.
  - **`.graphifyignore`** (commit aparte, `2eb128a`): `docs/fuentes/` sale del corpus del grafo (§5.7). Verificado: 77→72 archivos, 99.608→78.110 palabras (−21 %).
  - **Decisiones nuevas:** **§5.6** (no hay módulos exclusivos — deroga la asignación de §5.3.4 y reencuadra §12.3/§12.4) y **§5.7** (los originales no entran al grafo, pero no se borran).
  - **Grafo re-indexado** (cierre de la sesión): **736 nodos · 1.039 aristas · 163 comunidades** (antes 572 · 870 · 80), ahora sí con los 12 módulos de `demo/js/`. La extracción de los 25 documentos **quedó cacheada**. El grafo ubicó `analiticaAgregados()` como **nodo puente** entre las comunidades "Catálogos IDEA/IPPU-TEA" y "Motor de flujo (M1)" — que es exactamente lo que debe ser un agregador de analítica — y sacó a la superficie la tensión ya conocida entre §5.2 y `docs/markdown/modelo-datos.md` (el diseño de la rama aparcada). Salvedades honestas en §6: 67 aristas colgantes y `cost.json` subregistrado.
  - **Próximo:** **M11.1 — infra Postgres-only** (docker-compose + config + Alembic re-inicializado), que ya **no tiene dueño asignado** (§5.6). Sigue pendiente con IPPU la validación de la demo. (Lucas + Claude)

- **2026-08-07** — **M11.1 + M11.2 · Backend v2: infra Postgres-only y esquema v2 con catálogos.** Rama `feat/m11-backend-v2`. Primera sesión de la ronda M11; el backend deja de estar descalzado del Documento Técnico.
  - **Repaso previo, a pedido de Lucas.** Antes de escribir código se revisó el módulo entero: qué decide M11, por qué Docker, si va a producción y qué partes quedan clavadas. Conclusión que ordenó el trabajo: **la decisión real es "Postgres-only"; Docker es sólo cómo se entrega Postgres a tres máquinas**. El código habla con la base por un `DATABASE_URL` y no sabe que hay un contenedor — si prod termina siendo un Postgres gestionado o instalado a mano, no cambia un solo modelo. El despliegue real sigue sin definirse porque **la HCE de IPPU está alojada externamente y no sabemos qué permite ese hosting**.
  - **M11.1 · Infra.** `docker-compose.yml` con Postgres 16-alpine, volumen `ippu_pgdata`, healthcheck y `docker/initdb/` que crea la base **`ippu_test`** aparte (pytest no toca los datos de trabajo). `config.py` **rechaza al arrancar** cualquier `DATABASE_URL` que no sea Postgres, con mensaje que apunta a §5.2.1 — sin eso, un `.env` heredado de SQLite levanta igual y el problema aparece recién cuando falla una migración con JSONB. `database.py` con `pool_pre_ping` (sin él, la primera consulta tras un `docker compose restart` falla) y **convención de nombres de constraints** en la metadata, para que `--autogenerate` produzca el mismo diff en las tres máquinas. `alembic/env.py` sin el batch-mode de SQLite y con `compare_type`/`compare_server_default`.
  - **Un problema real de infra, encontrado y resuelto (§5.9).** El primer arranque falló con `password authentication failed`. Causa: **había un PostgreSQL local escuchando en 5433** (el puerto elegido justamente para no chocar con el 5432) y se quedó con el binding IPv4; Docker tomó sólo el IPv6, así que `localhost` conectaba al Postgres equivocado. Diagnosticado con `Get-NetTCPConnection`. Se pasó a **`127.0.0.1:5440`** con bind explícito — que además no expone la base al resto de la red. Queda documentado en el README como síntoma → causa.
  - **M11.2a · Se retiró el backend v1 completo:** 6 modelos, 6 schemas, 6 routers, `seed.py`, `test_api.py` y las 3 migraciones Alembic. No era código malo: hablaba del modelo **pre-Documento Técnico** (`nna` todo junto, `evaluacion_idea` anual con una fila por dimensión, `evaluacion_likert`), y entre ese mundo y el v2 no hay migración incremental posible — por eso el esquema pide **migración inicial única**. Sin datos reales y con git guardando el historial, reemplazar en el lugar salía más barato que hacer convivir dos modelos sobre la misma `Base`.
  - **M11.2b · 28 tablas** en 4 módulos que espejan el doc: `catalogos` (§2.4) · `identidad` (§2.1) · `modulos` (§2.2, el flujo firmable) · `transversales` (§2.3). Con los **bugs A y B corregidos**: `informe_cierre` pasó a 1:N con `UNIQUE(hce_id, anio)` (es anual, no uno por vida), y `persona` puede existir **sin** expediente de Atención Diurna, con `persona_servicio` N:M para la identidad transversal. `FirmaMixin` compartido (`firmado`/`firmas`/`addendas`/`excepcion`); el **estado visible no se almacena**, lo deriva el servidor — mismo diseño sin drift que la demo desde M1.
  - **Reparto BD/servidor respetado (§5.2.2).** En Postgres quedó sólo integridad **estructural**: rangos (IDEA 0–96, protocolo 24–120, pct 0–100), unicidad (`(hce_id,tipo,anio)`, `(hce_id,anio)`), el XOR de `foto` con `num_nonnulls(hce_id, grupo_id)=1`, y `CHECK(tipo='B' OR deltas IS NULL)`. Las reglas **clínicas** (secuencia, firma=bloqueo, Δ sólo B−A, baremo sólo desde `pct`, autorización de imagen, histórico inmutable) **no se tocaron**: son M11.3, en Python con test. Sin un solo trigger.
  - **M11.2c · Catálogos generados, no transcritos.** En vez de copiar a mano 60 descriptores del IDEA, se extrajeron **por código** de la demo v4.1 (`vm` de Node sobre `catalogos.js`/`hce-doc-org-vf.js`/`recordatorios.js` + los chips de `index.html`) y se transformaron a `app/data/catalogos_iniciales.json`. Cargados: **12 dimensiones IDEA + 60 descriptores · 24 ítems IPPU-TEA · 5 categorías de baremo · 12 categorías documentales · 4 recordatorios · 8 talleres · 3 servicios**. El seed (`python -m app.seed_catalogos`) es **idempotente** y no borra lo que sobra: una categoría eliminada del JSON podría tener documentos apuntándole.
  - **Verificación.** Reconstrucción limpia de punta a punta (borrado del esquema → `alembic upgrade head` → seed) = 29 tablas (28 + `alembic_version`) y los conteos exactos; seed corrido dos veces = **0 nuevas / 0 actualizadas**; **18 tests estructurales en verde** (`tests/test_esquema_v2.py`, base `ippu_test` aislada, cada rechazo probado junto con su caso que sí debe pasar); API levanta y `/health` responde 200.
  - **Dos cosas que salieron a la luz construyendo, y que no tienen fuente:** el esquema dice **18 talleres** pero la demo usa **8** y ningún documento los lista (se cargaron los 8 verificables); y las **referencias documentales de los 24 ítems** (DSM-5-TR, CIF, Wing & Gould, Baron-Cohen…) **no están verificadas** contra las fuentes originales — se transcribieron del prototipo tal cual. Ambas quedaron anotadas para IPPU.
  - **`docs/notas/puntos-a-validar.md`** (carpeta creada ahora, que es lo que §5.4.2 dejó previsto para "contenido real de notas de equipo"): **8 puntos para IPPU** (críticos: validar la demo v4.1 y el acceso a la HCE actual + su esquema de BD), **6 para el equipo** (incl. ratificar §5.8) y **6 supuestos a confirmar**. Cada punto dice explícitamente **qué bloquea**.
  - **Decisiones nuevas: §5.8** (M11 arrancó **sin** cruzar su puerta formal de validación con IPPU — criterio explicado, **pendiente de ratificación del equipo**, no es una decisión cerrada como las de §5.2) y **§5.9** (puerto 5440).
  - **Cierre de sesión:** se agregó `docs/notas/consulta-a-ippu.md` — la versión **no técnica** de los puntos que dependen de IPPU, escrita como cuestionario para que la respondan los funcionarios sin saber nada de informática. Tres partes: **lo que entendimos** de su trabajo (para que nos corrijan: el circuito anual, la firma doble, el consentimiento no salteable, los dos instrumentos no homologables, el informe único), **los 10 supuestos** que tomamos (para confirmar o desmentir) y **10 dudas puntuales**. Cada pregunta tiene su espacio para responder y las 4 que más destraban están marcadas: **2.1** (¿el IDEA se hace una vez o todos los años? — el que condiciona la tabla `idea`), **3.1** (lista real de talleres), **3.2** (citas bibliográficas de los 24 ítems) y **3.3** (acceso al sistema actual). Los dos documentos de `docs/notas/` se mantienen sincronizados a mano: si se agrega un punto en uno, va en el otro.
  - **Revisión del propio commit (`a5fbfda`).** No se pudo correr `/code-review ultra` (créditos agotados), así que la revisión fue manual, verificando **contra la base** en vez de deducir del código. **7 hallazgos, 6 corregidos:**
    - **El grave, autoinfligido: el seed revertía lo que configura la institución.** `_sincronizar` trataba el JSON como autoritativo para *todos* los campos, así que re-correr el seed —que está en el arranque documentado del README— pisaba en silencio los cortes del baremo corregidos por IPPU y los recordatorios desactivados por coordinación. Comprobado en la base: `pct_min=6` volvía a `5`. Eso vaciaba de sentido la decisión §5.2.3 (son tabla y no constante **para** poder ajustarlos sin migración). Arreglo: `solo_al_crear` marca los campos de la institución, que se escriben al insertar y nunca más; el contenido de los instrumentos **sigue** viniendo del JSON. Dos tests cubren las dos caras — "no pisar nada" habría sido un arreglo tan malo como el bug.
    - `valoracion_funcional.pct` estaba anotado `float` pero `Numeric` devuelve `Decimal` (verificado: `Decimal('58.50')`). Trampa puesta para M11.3, que va a comparar ese valor contra los cortes del baremo: mezclar los dos tipos levanta `TypeError`.
    - **21 FKs sin índice de respaldo** (Postgres no los crea solo): cada borrado en cascada por `hce_id` hacía scan secuencial en todas las tablas hijas, y las consultas del panel filtran por ahí. Quedan **0**.
    - Los tests no detectaban desfasaje **modelos ↔ migración** (crean las tablas con `create_all`, no aplicando la migración): un modelo editado sin su migración pasaba hasta el despliegue. Test nuevo que los compara.
    - Orden de herencia del mixin de firma inconsistente (3 de 4 clases al revés de la convención; verificado que las columnas llegaban igual — era convención, no bug) y 5 relaciones anotadas `Mapped["object"]`, que no dice nada.
    - **El que NO se corrigió:** la tabla `grupo` no admite más de un año (ver §6). Se dejó como está porque cambiarlo modifica `esquema-datos-v2.md` §2.1 y eso se decide por escrito, no de hecho en el código.
    - Migración inicial **regenerada** en vez de apilar una segunda (nada está desplegado). Reverificado todo: reconstrucción limpia, seed idempotente, **21 tests en verde**.
  - **Nota para la próxima:** el `ultra` sigue pendiente. Esta revisión la hizo quien escribió el código, que es exactamente el revisor con más puntos ciegos. Cuando haya créditos, conviene correrlo igual sobre `a5fbfda`.
  - **Próximo: M11.3** — los servicios con las reglas duras de §4. Es el sub-módulo con más contenido de M11 y **está sin tomar** (§5.6). Conviene resolver antes el punto 1.1 (validación de la demo con IPPU): mientras nada esté construido encima, cambiar la tabla `idea` sigue siendo barato. (Lucas + Claude)
- **2026-08-14** — **M12.0 · Decisiones al papel y verificación del punto de partida** (ronda **M12 — absorción del Prototipo v4**, plan `docs/planes/PLAN-M12-absorcion-prototipo-v4-2026-08.md`). **Sin código de modelo**: esta sesión es solo el paso 0.
  - **Prototipo incorporado:** `curl` del HTML publicado → `docs/fuentes/prototipo-v4/HCE_IPPU_Prototipo_v4.html` (**406.266 bytes**, coincide con los 406 KB que describe la referencia; contiene `IDEA_MANUAL_V = 'Manual Unificado IDEA v1.0 (07/2026)'`). **No se extrajeron** `CLINICA_HTML_B64` ni `TALLER_HTML_B64` (§5.12 / D3) y **no se corrió Docling** (es una app JS; la versión legible es `docs/markdown/prototipo-v4-referencia.md`, producida por script).
  - **Decisiones D1–D9 escritas en §5.10–§5.18** (Lucas, 2026-08-14), con la cabecera y **§3** actualizados: la fuente normativa pasa a ser Manual v1.0 + Prototipo v4, y las bandas del IDEA de **3 a 6 tramos** con soporte DSM-5-TR. Cinco de las nueve derogan cosas ya escritas — por eso van al papel antes del código (§12.6). **§5.2 sigue entera en pie.** **Pendiente: que el equipo confirme D9** (`grupo`) antes de implementarla en M12.1.
  - **Mapas de estructura actualizados:** `docs/estructura-repositorio.md` (carpeta `prototipo-v4/` con los dos archivos, el `.md` nuevo, los dos planes, `extraer_prototipo_v4.js` con su uso real, y la excepción Docling reescrita para cubrir v1 **y** v4), más los mapas resumidos de `README.md` y `CLAUDE.md`.
  - **Verificación del repo contra la realidad** (no contra el handoff): `alembic heads` = `f6ca521bcc6a`, **una sola cabeza**, y la base está en ella · **28 tablas** + `alembic_version` = 29 en `public` · catálogos cargados (12 dimensiones · 60 descriptores · 24 ítems · 5 baremo · 12 categorías · 4 recordatorios · 8 talleres · 3 servicios) · **21 tests en verde**.
  - **Diferencias encontradas entre el handoff y el repo (todas menores, ninguna bloquea):**
    1. **`pytest -q` no funcionaba tal como está documentado.** No había ningún archivo de configuración de pytest, así que `tests/conftest.py` moría con `ModuleNotFoundError: No module named 'app'` salvo que cada uno exportara `PYTHONPATH` a mano. Se agregó **`backend/pytest.ini`** (`pythonpath = .`, `testpaths = tests`) y ahora sí: `pytest -q` → **21 passed**. Es la única corrección de código de la sesión.
    2. **§6 decía "18 tests estructurales"**; son **21** desde la revisión de M11.2 (la bitácora del 2026-08-07 ya decía 21). Corregido en §6, `README.md` y `CLAUDE.md`.
    3. **El commit `a9f94c7` no tenía entrada de bitácora** (movió el plan a `docs/planes/`, agregó `estructura-repositorio.md`, `prototipo-v4-referencia.md`, la carpeta `prototipo-v4/` y `extraer_prototipo_v4.js`).
  - **Sobre la sospecha de que M11.2c perdió cosas al generar los catálogos: no se confirmó.**
    - **`baremo_categoria.implicancia` NO se perdió.** Está en el modelo (`app/models/catalogos.py:107`), en `app/data/catalogos_iniciales.json` y en la base, y su texto es **idéntico** al `imp` del prototipo en las 5 categorías, igual que los cortes. **El bullet correspondiente de M12.1 no tiene trabajo asociado** — solo verificar.
    - Se comparó **todo lo generado** contra la demo: 60/60 descriptores idénticos, 24/24 ítems idénticos (texto y referencia), 12/12 categorías documentales idénticas con sus 4 marcas de registro histórico, 4/4 recordatorios idénticos. La única diferencia es que la escala pasó de índice 0–3 (demo) a 1–4 (JSON), que es normalización deliberada.
    - `solo_al_crear` **ya está implementado** en `app/seed_catalogos.py` (con su docstring explicando el bug): el plan lo describe en M12.8 como "el bug grave de M11.2", pero se corrigió en la revisión del 2026-08-07. En M12.8 hay que **extenderlo** a los catálogos nuevos, no construirlo.
    - **Lo que sí falta** no se "perdió": nunca entró. Seis catálogos viven como literales en la demo y no tienen tabla ni entrada en el JSON — **`VF_DOMINIOS`** (6, con código CIF), **`VF_NIVELES`** (5), **`PRESTACIONES`** (8), `BPS_PRESTACIONES`, `BPS_ESTADOS` y `LIKERT_LBL` (5 etiquetas). Hoy viven como JSONB dentro de `valoracion_funcional.dominios` o directamente en ningún lado. Decidir en M12.1/M12.8 cuáles merecen tabla.
  - **Diff preliminar de los 60 descriptores del IDEA (solo reportado, NO aplicado):**
    - **59 de 60 difieren textualmente** del `IDEA_DESC` del prototipo, pero **ninguno por corrimiento de niveles**. Se construyó la matriz de similitud de cada nivel nuestro contra los 5 del prototipo: en **58 de 60** el mejor calce es el **mismo nivel**, y los 2 restantes (D6 n2, D9 n2) son señal débil de reformulación, no intercambio — el texto de un nivel nuestro **nunca** aparece en otro nivel del prototipo.
    - Los 60 nuestros son el **texto literal de la fuente oficial** (`docs/markdown/escala-del-inventario-del-espectro-autista-idea.md`, Rivière); los del prototipo son **paráfrasis condensadas** de los mismos niveles (ej. D4/8: "Ausencia de comunicación (relación intencionada, intencional y significante) y de conductas instrumentales con personas" vs. "Ausencia de comunicación entendida como relación intencionada mediante significantes").
    - **El corrimiento que el prototipo dice haber corregido no es contra nosotros.** El literal del HTML lo dice explícito: *"corrimiento de niveles detectado en materiales institucionales previos (Dimensiones 3, 4, 6 y 12 de la «Guía del aplicador», hoy desestimada)"* — un documento interno de IPPU que **nunca tuvimos** y del que **nuestros descriptores no derivan**.
    - **Recomendación (a decidir en M12.1, no tomada acá):** **no reemplazar** los 60 por los del prototipo — perderíamos fidelidad al instrumento original a cambio de nada. Si la versión corta les sirve en pantalla, entra como campo aparte (`descriptor_breve`), no encima del oficial. Lo que sí conviene tomar del prototipo son los catálogos que **no tenemos**: `IDEA_FICHAS` (12), `IDEA_EJ` (12) e `IDEA_REGLAS` (9).
  - **Verificación de la sesión:** `pytest -q` **21 passed** · `alembic heads` una sola cabeza y la base al día · 28 tablas · catálogos con los conteos esperados. **Ningún cambio en modelos, migraciones ni catálogos.**
  - **Próximo: M12.1** (correcciones al esquema existente) — va **primera y sola**, con los 21 tests corriendo después de cada cambio. **Antes:** confirmar **D9** con el equipo. (Lucas + Claude)
- **2026-08-14** — **M12.1 · Correcciones al esquema existente** (ronda **M12**, plan `docs/planes/PLAN-M12-absorcion-prototipo-v4-2026-08.md`). Va **primera y sola**; la sesión corta acá, antes de M12.2.
  - **D9 confirmada por el equipo e implementada.** `grupo` pasa a **id serial sin significado** + `nombre` por color (`Grupo Azul` · `Celeste` · `Naranja` · `Verde`) + **`UNIQUE(nombre, anio)`**, con `anio SMALLINT`. Se barrieron las dos FK (`hce_diurna.grupo_id` y `foto.grupo_id`, de texto a entero) y los usos del id como si fuera el nombre. **Granularidad anual, no por fecha** — con fecha completa volverían a existir dos grupos Azul en el mismo año, y `anio` es lo que ya usan `protocolo` e `informe_cierre`. **Límite aceptado y anotado en §5.18:** un cambio de técnico a mitad de año sobrescribe la fila y sólo deja rastro en la auditoría; depende de las respuestas de IPPU a §3.7/§3.8 de `consulta-a-ippu.md`. **Cerró `puntos-a-validar.md` §2.6.** No hubo migración de datos: los `A..E` sólo existían en un test y en los docstrings.
  - **Catálogos nuevos (5 tablas, 28 → 33).** `banda_idea` (6 tramos con nivel DSM-5-TR y el texto orientativo copiado **tal cual** — es deliberadamente neutro y reescribirlo rompe esa propiedad) · `delta_interpretacion` (6 tramos con acción y `signo`; **la alerta institucional Δ ≤ −7 pasa a derivarse de la fila con `alerta=True`**, ya no de un número suelto) · `idea_ficha` (12) · `idea_ejemplo` (48 = 12 × niveles 8/6/4/2; el prototipo no trae ejemplo de nivel 0 y no se inventó uno) · `idea_regla` (9).
  - **Los 60 descriptores NO se reemplazaron**, cerrando lo que M12.0 dejó recomendado. El corrimiento que el prototipo dice haber corregido es contra una «Guía del aplicador» interna de IPPU que nunca tuvimos; los nuestros son el texto literal de Rivière (1997/2002) y los suyos, paráfrasis condensadas. **Lo que sí entró:** `idea_nivel.descriptor_breve` (la versión corta, **al lado** y nunca encima) y `idea_dimension.que_evalua`. Un test fija que 59 de 60 difieren y nombra el único que coincide (D11/8, «Ausencia completa de conductas de imitación»): si esa cuenta sube, alguien copió los del prototipo encima de los oficiales.
  - **Campos nuevos.** `idea.manual_version` (el literal `Manual Unificado IDEA v1.0 (07/2026)`, que el prototipo pide persistir con cada evaluación firmada) · **`OrigenMigracionMixin`** en `persona`, `hce_diurna` e `idea` (`sistema_origen`, `fecha_original`, `fecha_migracion`, `responsable_migracion`), que **reemplaza al `idea.migrado_origen JSONB`** de M11.2: eran los mismos datos en una bolsa sin forma, imposible de filtrar · **`auditoria` a nivel campo** (`campo`, `valor_ant`, `valor_nuevo`) con **`hce_id` nullable**, porque hay eventos institucionales —cambiar los técnicos de un grupo, retirar un taller— que no son de ningún expediente. Esa granularidad es justamente lo que hace verdadera la garantía de D9.
  - **Recordatorios 4 → 8:** a los del flujo (`lb pa pb ic`, con IDEA en semanas 2–3 e IC a 10 días hábiles) se suman `ayex` (60/30), `vf` (90/30), `inc` (>60 días sin gestiones) e `inau` (informes semestrales). Configurables y **nunca bloqueantes**.
  - **Decisión: los 6 catálogos sueltos de la demo van a constante, no a tabla.** `LIKERT_LBL`, `VF_DOMINIOS`, `VF_NIVELES`, `PRESTACIONES`, `BPS_PRESTACIONES` y `BPS_ESTADOS` viven ahora en **`app/core/constantes.py`**. Criterio escrito ahí: tabla si se consulta, se filtra o la institución lo cambia sin desplegar; constante si es texto fijo de presentación que acompaña a un valor ya guardado. Los 6 dominios de VF, por ejemplo, son las **claves fijas** de `valoracion_funcional.dominios` y vienen de la CIF, no de IPPU. Pasan a tabla el día que el panel necesite filtrar por alguno.
  - **Generador de catálogos versionado.** `herramientas/generar_catalogos_backend.py` (con `--check` para CI) reemplaza al script `vm` de Node de M11.2c, que nunca quedó en el repo. Produce las secciones nuevas desde el Prototipo v4 y **preserva** las que vienen de la demo v4.1; M12.8 tiene que pasar esas también y vaciar la lista `DESDE_LA_DEMO`. `app/data/catalogos_iniciales.json` sigue sin editarse a mano.
  - **Vocabulario §8.1 — el prototipo incumple su propia regla.** El generador normaliza «grave» → «severo» y **reporta cada sustitución**. Hubo **una**: `IDEA_FICHAS[7].nc`, "un trastorno grave de anticipación". También normaliza «Rivière (1997)» → «Rivière (1997/2002)» en las fuentes de `idea_regla`. En el repo propio quedaban dos citas sueltas, en §3 y en el glosario de este archivo: corregidas. **La demo no se tocó** (no-goal §2 del plan): su `js/catalogos.js` sigue diciendo "1997", y el plan §8 ya lo tiene listado como cambio a decidir aparte antes de la reunión con IPPU.
  - **Tests: 53 en verde + 1 salteado a propósito** (`tests/test_m12_catalogos.py`, 32 nuevos). Cubren: los dos casos de D9 (que «Azul 2026» y «Azul 2027» convivan, y que el segundo «Azul 2026» sea rechazado) · los bordes de las 6 bandas (0, 15, 16, 90, 91, 96) y que cubran 0–96 sin huecos · que la alerta del Δ sea una sola y arranque en −7 · que los tramos del Δ no dejen huecos · que ningún catálogo diga «grave» · que los 60 oficiales sigan intactos · **el seed completo corrido dos veces con 0 nuevas / 0 actualizadas** · que el seed no pise los cortes de las bandas ni los grupos ya configurados.
  - ⚠️ ~~**`test_la_migracion_coincide_con_los_modelos` queda salteado hasta M12.8, a propósito.** La regla de la ronda congela las migraciones hasta el cierre, así que los modelos van deliberadamente adelante del esquema aplicado y ese test **tiene que** fallar. No se borró ni se comentó: sigue calculando el diff y lo **reporta al saltear** (`pytest -rs` muestra hoy **32 diferencias**), para que el desfasaje pendiente esté a la vista. **M12.8 tiene que volver a poner el `assert`** — está anotado en el plan y en el docstring del test.~~ → **Revertido el mismo día por la enmienda §5.19** (ver la entrada siguiente de esta bitácora): la migración se regeneró con las 33 tablas y el test volvió a ser bloqueante.
  - **Docs actualizados:** `esquema-datos-v2.md` (cabecera al estado real —decía "no implementada todavía"—, §2.1 `grupo` como fuente de D9, §2.2 `idea`, §2.3 `auditoria`, §2.4 con los 5 catálogos nuevos y el criterio tabla-vs-constante, §4 con 5 reglas más para M11.3) · `PLAN-M12` (corregidos los bullets de `baremo_categoria.implicancia` y de los 60 descriptores, agregado el de los 6 catálogos sueltos, y anotado en M12.8 que `solo_al_crear` **no** era un bug pendiente) · `puntos-a-validar.md` §2.6 cerrado · banner de «documento histórico» en los dos docs del backend v1 (`esquema-datos.md`, `ejemplos-endpoints.md`), que seguían mostrando `"grupo_id": "A"` sin decir que describen una API retirada.
  - **Próximo: M12.2** (puntuación independiente y consenso, D7) — el cambio de modelo más profundo y el único que no sale del prototipo. Después, M12.3–M12.7 se reparten en paralelo. (Lucas + Claude)

- **2026-08-14** — **Enmienda §5.19 · la migración de M12 se descongela.** Sesión corta y de una sola cosa; **M12.2 no arrancó**.
  - **La decisión, primero al papel (§5.19).** La regla de §3 del plan congelaba `alembic revision --autogenerate` hasta M12.8. Se enmienda: **la migración inicial única se regenera al cerrar cada sub-módulo**, con el test de coincidencia modelos ↔ migración pasando, y **sólo se congela si hay trabajo en paralelo real sobre `app/models/`** (ahí descongela y regenera una sola persona al terminar el paralelo). **Dos motivos:** (a) el motivo original —tres `autogenerate` simultáneos— no aplica, la ronda la ejecuta una sola persona; (b) aun aplicando, dejar 32 diferencias acumulándose hasta M12.8, y más de cien después del fan-out, **de autores distintos y vistas por primera vez al final**, es exactamente el riesgo que la regla quería evitar: se movía de lugar, no desaparecía. Se sigue manteniendo **una** migración inicial: se regenera el mismo archivo, no se apilan revisiones.
  - **Texto corregido en los 5 lugares que decían lo contrario:** cabecera de este archivo · §6 (bullet de M12.8) · `PLAN-M12` §3 (con la regla vieja tachada y el porqué), el recuadro de M12.1 y los bullets de M12.8 · `CLAUDE.md` · `backend/README.md` · `docs/estructura-repositorio.md`. La entrada de M12.1 de esta misma bitácora quedó tachada con puntero acá, no reescrita.
  - **Migración regenerada:** se borró `f6ca521bcc6a_..._m11_2.py` (28 tablas) y se generó **`46da34fcc64e_esquema_v2_inicial_m12_1.py`** con las **33** de M12.1 (las 5 nuevas: `banda_idea`, `delta_interpretacion`, `idea_ficha`, `idea_ejemplo`, `idea_regla`; más `grupo` con id propio y las FKs a entero de D9). **Reconstrucción limpia de punta a punta**, dos veces: drop schema → `alembic upgrade head` → `python -m app.seed_catalogos`. 34 tablas en `information_schema` = 33 + `alembic_version`.
  - **Test reactivado.** `test_la_migracion_coincide_con_los_modelos` volvió a tener su `assert`, sin `skip` (queda sólo el de infraestructura, para cuando la base de desarrollo no está levantada). Docstring reescrito y mensaje de error actualizado: ahora explica el flujo de **regenerar la migración única**, no el de agregar una revisión.
  - **`solo_al_crear` verificado a mano, no sólo por unit test.** Seed corrido **dos veces seguidas → 0 nuevas / 0 actualizadas en las 14 secciones**; después, 8 campos de institución pisados por SQL directo (`banda_idea.total_max` 15→20 · `baremo_categoria.pct_min` · `recordatorio.activo`+`periodo` · `taller.activo` · `servicio.activo` · `delta_interpretacion.delta_min`+`alerta` · `grupo.dias`+`obs`, este último por `solo_insertar`) y **tercera corrida: los 8 sobrevivieron intactos**. En la misma corrida se pisó también `banda_idea.texto` —contenido del instrumento, **no** de la institución— y el seed **sí** lo restauró: es la única "1 actualizada" del resumen, y es la contraprueba de que el seed efectivamente corrió y comparó en vez de no hacer nada.
  - **Verificación:** `pytest -q` → **54 en verde, 0 salteados** (los 53 de M12.1 más el que estaba salteado). `generar_catalogos_backend.py --check` → OK. La base de desarrollo quedó reconstruida y sembrada limpia.
  - **Próximo: M12.2** (puntuación independiente y consenso, D7), sin cambios. (Lucas + Claude)
