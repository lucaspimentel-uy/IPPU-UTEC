# Handoff — Proyecto IPPU × UTEC-LIDIA · Línea 1 (HCE + IDEA)

> **Bitácora de contexto entre sesiones.** Sirve para que cualquier sesión (Claude o persona)
> recupere el estado del proyecto sin releer todo. **Actualizar al final de cada sesión** (sección 4 y 6).
>
> ⚠️ **Este archivo está versionado en el repo desde el 2026-08-03** (antes era local y por eso el equipo
> trabajaba a ciegas — ver §12). Es el **contexto compartido de los tres**: leerlo al empezar, actualizarlo
> al terminar, pushearlo siempre. **Cómo trabajamos en paralelo sin pisarnos: §12.**
>
> - **Última actualización:** 2026-08-16
> - **Responsable del documento:** Lucas Pimentel (UTEC-LIDIA) · **Equipo:** Lucas · Samuel · Victor
> - **Foco actual:** **L1 — Ronda M0–M10 COMPLETA (demo v4.1)** · **M11.1 y M11.2 HECHOS** (backend v2: 28 tablas, migración única, catálogos, 21 tests). En curso: **M12 · absorción del Prototipo v4**, intercalada **entre M11.2 y M11.3** porque toca la misma capa (modelos, migración inicial, catálogos) — ver §5.10–§5.18 y `docs/planes/PLAN-M12-absorcion-prototipo-v4-2026-08.md`. **M12.0 a M12.4 y M12.7 hechos** (2026-08-15): **38 tablas** (34 tras M12.3, ⚠️ que **bajó de 35 y no fue regresión**: retira `hce_taller`, §5.20; M12.4 sube a 36 con `severidad_dsm` + `severidad_nivel` y retira la **columna** `hce_diurna.nivel_soporte`, §5.24; M12.7 sube a 38 con `ateneo` + `ateneo_acuerdo`), **240 tests**. **Siguen M12.5 y M12.6**, que se reparten **en paralelo** (uno cada uno, archivos distintos de `app/models/`) — y ahí sí **se congela la migración** hasta que termine el paralelo (§5.19). El orden **M12.4 → M12.6** ya se cumplió (§5.23); M12.5 no depende de nadie. ⚠️ **M12.6 arranca con §5.26 ya decidida** (nomenclatura `hce_id` = pertenencia · `hce_<calificador>_id` = referencia) y con §5.22. ⚠️ **La regla de migraciones de M12 quedó enmendada el 2026-08-14 (§5.19):** la migración inicial única **se regenera al cerrar cada sub-módulo**, con el test de coincidencia modelos ↔ migración pasando; sólo se congela si hay trabajo en paralelo real sobre `app/models/`. **M11.3–M11.6 se retoman al cerrar M12.** Ningún módulo tiene dueño exclusivo (§5.6): se avisa qué se toma y se trabaja. En paralelo, pendiente con IPPU: **validar la demo** (sobre todo el cambio de IDEA a línea base única).
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
5. El **backend** está en **`implementacion/L1-hce-idea/backend/`** (ver su `README.md`). Correr: **`docker compose up -d`** → `.venv\Scripts\Activate.ps1` → `alembic upgrade head` → `python -m app.seed_catalogos` → `uvicorn app.main:app --reload` (docs en `/docs`). Tests: `pytest -q` — **una corrida válida es `123 passed, 0 skipped`**; si el contenedor no está arriba, si la base está vacía o si no está en el head, `pytest` **aborta con exit 1** y te dice el comando (guardia de sesión en `tests/conftest.py`, 2026-08-15). Antes se salteaba en silencio y devolvía **exit 0** con la mitad de los tests sin correr.
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
(se buscó en `docs/fuentes/prototipo-v4/HCE_IPPU_Prototipo_v4.html`, no en el `.md` de referencia):

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

---

## 6. Pendientes / próximos pasos (sugeridos)
- [x] ~~Ronda M0–M10 (adaptar la demo al Doc. Técnico)~~ → **COMPLETA** (2026-07-30, demo v4.0). Ver bitácora.
- [ ] **Validar la demo v4.0 con IPPU** (puerta de entrada a M11 según el plan; en especial el cambio de IDEA a línea base única). Ritmo sugerido por el Doc. Técnico §12: revisiones quincenales.
- [ ] **Ronda de alineación de la demo v4.1 con el Prototipo v4 · COMMITEADA, pendientes de verificación** (Samuel + Lucas, 2026-08-16, §5.27). **6 alineaciones aplicadas** (cita Rivière · bandas IDEA 6 tramos · Δ con acción · 14 talleres · grupos por color · vocabulario ya cumplido) + 2 fixes de layout (heatmap, ancho de main). **Commiteada en `main` el 2026-08-16** por Lucas para desbloquear la sesión F1-nav que arrancó a continuación (`demo/F1-navegacion`). **Falta post-commit (migradas de pre-commit):** **(a)** verificar visualmente en navegador (doble clic en `demo/index.html`, recorrer Analítica · Grupos · alta de NNA · expedientes) — solapa parcialmente con la verificación de §6 de F1-nav; **(b)** re-baseline del **fingerprint Playwright** (`demo/verificacion/`) — 3 pasos rompen a propósito (bandas, talleres, grupos); Playwright no estaba instalado en el clone al momento del commit. **Deudas nuevas:** el catálogo de talleres ahora tiene los 14 pero **sin gestión** (retirar/agregar, orientación a grupos) — la demo carga nombres, no administra; anotado como absorción parcial de D5 (§5.14). Cuando la demo incorpore HCE-SEV en una ronda futura, `p.apoyo` de `datos.js` pasa a derivarse (deuda que ya venía de §5.24).
  - **Notas de Samuel al cerrar sesión (2026-08-16) para la próxima ronda:**
    - **FALTA agregar como módulos nuevos** (no entraron en las alineaciones, requieren ronda propia):
      - **PAI INAU** (= HCE-PAI, Propuesta de Atención Individual) — 15 secciones + tablas hijas
        (objetivos, evaluación PAI anterior, equipo, coordinaciones con 6 filas fijas). El más grande.
        Sección VII y XI son referencias (carga única desde HCE-00/ORG/LB/PA/PB/SEV), decidido en §5.22.
      - **HCE-INC** (Inclusión educativa, dentro del expediente) — ficha (`centro`, `tipoCentro`, `grado`,
        `modalidad`, referente educativo, estado) + **bitácora** con 5 catálogos (TIPOS, ESTADOS, TEMAS,
        MEDIOS, ROLES). `sensible` derivado (`tema === 'Clínica — sensible'`). No hay catálogo de
        centros educativos en el prototipo — es texto libre.
      - **Ateneos clínicos y jornadas de capacitación** (vista transversal, no por NNA) — una sola
        entidad `DB.ateneos[]` con **4 tipos** (`AT_TIPOS`: Ateneo clínico · Ateneo de grupo · Ateneo
        institucional · Jornada de capacitación); correlativo `AT-2026-001`. Campos según tipo. Ver
        §5.25 y §5.26 del backend por convenciones de nomenclatura y XOR con HCE-DOC.
      - *(Pendiente de decidir si entra: **HCE-SEV** — módulo chico, va entre CI e IDEA. La demo hoy
        tiene `p.apoyo` como string suelto que se derivaría de este módulo.)*
    - **CORREGIR** (chico, dentro del alcance actual):
      - **Panel inicial** (vista Inicio, no expediente): tiene una **referencia a «Eval. intermedia»**
        que quedó colgada. La Eval. intermedia fue reemplazada por PA/PB en M5 (v3.7, §M5.2 del plan);
        el código sigue en `demo/js/` sin exponerse — pero el panel inicial la menciona. Buscar en
        `index.html` y `js/ui-core.js`.
      - **Pestaña Analítica Institucional**: también tiene la misma referencia a Eval. intermedia,
        corregir en el mismo pasaje.
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
  - [x] ~~**M12.2** puntuación independiente y consenso (D7)~~ → **HECHO** (2026-08-14, Lucas). **35 tablas**:
        `puntuacion_idea` (0–8 + `NS` tipado en 3 estados) y `puntuacion_protocolo` (1–5), con `valor_t1`/
        `valor_t2` **nullable**, `documentacion`, `diferencia` como **columna generada** y evaluadores en
        `idea`/`protocolo` con `CHECK` de que no sean la misma persona. **El consenso no se movió** de
        `dim`/`items`. `procedimiento` y `documentacion_pendiente` son derivados (`hybrid_property`), y los
        tres tramos (0 · 1 · ≥2) son **constante y no catálogo** — es el invariante metodológico del
        Manual. **El guard queda para M11.3**; kappa **no** se calcula. **74 tests en verde, 0 salteados**,
        migración regenerada (`f54959f07cc4`) con el test de coincidencia pasando. Ver bitácora §13.
  - [x] ~~**M12.3** catálogo dinámico de talleres (D5)~~ → **HECHO** (2026-08-14, Lucas). Los **14 reales**
        del prototipo reemplazan a los 8 de la demo; `taller` suma `orden`, `grupos_orientados`
        (**array de nombres de color, no FK**: con D9 un `grupo_id` ataría el taller a un año) y
        `retirado_en`, y **`activo` pasó a derivado** (`hybrid_property`). Se **retiró `hce_taller`**
        (§5.20): la participación la crea M12.6 como `pai_taller`, por nombre. ⚠️ **34 tablas — bajó de 35
        y no es regresión:** M12.3 no crea tablas. El test de participación del plan se traspasó a **M12.6**
        (§5.21). **92 tests en verde, 0 salteados**, migración regenerada (`3f11e10c13ed`). Ver bitácora §13.
  - [x] ~~**M12.4** HCE-SEV · Severidad DSM-5-TR~~ → **HECHO** (2026-08-15, Lucas). **36 tablas**:
        `severidad_dsm` (**0..1 por expediente, PK = `hce_id`**, dos dominios independientes 1–3,
        justificación / fecha / profesional NOT NULL) y su catálogo `severidad_nivel` (3 grados con
        etiqueta, los dos descriptores largos y los apoyos, generados de `SEV_*`). Las **etiquetas se
        derivan**, no se guardan. ⚠️ **Se retiró `hce_diurna.nivel_soporte`** (§5.24) — es una columna,
        no una tabla: **el conteo sube de 34 a 36 por las dos tablas nuevas, nada más**. **123 tests en
        verde, 0 salteados**, migración regenerada (`f432ea139fd9`). Ver bitácora §13.
  - [x] ~~**M12.7** Ateneos y jornadas~~ → **HECHO** (2026-08-15, Lucas). **38 tablas**: `ateneo` (una
        sola entidad con campos según tipo, como el prototipo) y `ateneo_acuerdo`. **`AT_TIPOS` entró
        como constante, NO como catálogo** (`core/constantes.py::ATENEO_TIPOS`) porque el tipo es el
        **discriminador** contra el que están escritos los 5 CHECK de obligación/prohibición: como
        catálogo editable, un quinto tipo cargado desde la app caería fuera de todos. **`codigo`
        (`AT-2026-001`) y `sensible` son derivados**, no columnas — el correlativo real es
        `UNIQUE(anio_correlativo, numero)`, patrón de D9. **Dos decisiones nuevas: §5.25** (HCE-DOC gana
        alcance institucional — `documento.hce_id` nullable + `ateneo_id` + XOR) y **§5.26** (nomenclatura
        `hce_id` = pertenencia · `hce_<calificador>_id` = referencia, **que M12.6 hereda**).
        **240 tests en verde, 0 salteados**, migración regenerada (`9246e659d2c9`). Ver bitácora §13.
  - [ ] En paralelo (uno cada uno, archivos distintos de `app/models/`):
        **M12.5** HCE-INC · **M12.6** HCE-PAI (el más grande). ~~M12.7~~ hecho.
        ⚠️ **§5.23:** **M12.4 iba antes que M12.6** (dependencia de conocimiento, ya resuelta);
        **M12.5 no depende de nadie**. M12.6 arranca con §5.22 y **§5.26** ya decididas.
  - [ ] **M12.8** cierre: seed desde el JSON del prototipo, tests y docs. **Una sola persona.**
        ⚠️ Ya **no** es el único momento en que se toca la migración: desde la enmienda **§5.19**
        (2026-08-14) se regenera al cerrar **cada** sub-módulo, con el test de coincidencia en verde.
- [ ] **Puntos a validar con IPPU y el equipo** → `docs/notas/puntos-a-validar.md` (2026-08-07, **interno**). **9 puntos para IPPU** (los críticos: **validar la demo v4.1** y **acceso a la HCE actual + su esquema de BD**; el §1.9 lo agregó M12.2: **¿los técnicos ya puntúan de forma independiente?**), **8 para el equipo** (incl. **ratificar §5.8** y el §2.8 de M12.2: **no hay forma de abrir un año nuevo de grupos**) y 6 supuestos a confirmar. Salió de M11.2: varios se detectaron construyendo el esquema (ej. las referencias documentales de los 24 ítems no están verificadas). **§1.3 (catálogo de talleres) quedó CERRADO en M12.3**: el «8 vs 18» era falso y la lista real la trae el propio Prototipo v4.
- [x] ~~**DECISIÓN TÉCNICA PENDIENTE — la tabla `grupo` no admite más de un año.**~~ → **CERRADA**
  (2026-08-14, **§5.18 / D9**): opción (b), **id propio + `UNIQUE(nombre, anio)`**, y el nombre pasa a ser el
  **color** (Azul · Celeste · Naranja · Verde), que es el dominio real de IPPU. **Confirmada por el equipo
  e implementada en M12.1** (modelo, FKs de `hce_diurna` y `foto` a entero, seed de los 4 grupos, 5 tests).
  Queda **un residuo más chico anotado en §5.18**: con granularidad anual, un cambio de técnico a mitad de
  año sobrescribe la fila y sólo deja rastro en `auditoria`. El planteo original queda abajo como registro:
- [ ] ~~**la tabla `grupo` no admite más de un año**~~ (contexto histórico): Su PK es sólo la letra (`A..E`) pero lleva columna `anio`, así que **el grupo A existe para un único año en toda la historia**: crear el de 2027 obliga a sobrescribir el de 2026 (se pierde quiénes fueron sus técnicos) y los expedientes viejos, que en `grupo_id` guardan sólo la letra, pasan a apuntar al grupo nuevo **sin aviso**. Contradice cómo `protocolo` e `informe_cierre` resuelven los ciclos anuales con `(hce_id, …, anio)`. Detectado al revisar M11.2; **se implementó tal cual lo especifica `esquema-datos-v2.md` §2.1, sin corregirlo por cuenta propia** (cambiarlo modifica ese documento). Opciones: (a) PK compuesta `(id, anio)` · (b) id propio con `UNIQUE(letra, anio)` · (c) dejarlo y **quitar la columna `anio`**, si los grupos no se reconfiguran año a año. Anotado en los 3 lugares donde se va a mirar: `esquema-datos-v2.md` §2.1, el docstring de `Grupo` y `docs/notas/puntos-a-validar.md` §2.6. **No bloquea M11.3.**
- [ ] **ENVIAR A IPPU:** `docs/notas/consulta-a-ippu.md` (2026-08-07). Versión **no técnica** del anterior, en formato de cuestionario respondible por los funcionarios: **Parte 1** lo que entendimos de su trabajo (para que nos corrijan) · **Parte 2** los 10 supuestos que tomamos (para confirmar o desmentir) · **Parte 3** 11 dudas puntuales (la §3.9, puntuación independiente, la agregó M12.2). Las 4 marcadas ⚠️ son las que destraban más: **2.1** (¿el IDEA se hace una vez o todos los años?), **3.1** (lista de talleres), **3.2** (citas bibliográficas de la escala) y **3.3** (acceso al sistema actual). Los dos documentos se mantienen sincronizados: si cambia uno, cambia el otro.
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

- **2026-08-14** — **M12.2 · Puntuación independiente y consenso (D7)** (ronda **M12**). Sesión de un solo módulo: **M12.3 no arrancó**.
  - **Lo primero: esto no sale del prototipo, y quedó argumentado en el commit, en el docstring del modelo y en el esquema.** El Prototipo v4 guarda un **único array plano de consenso** (`punt[12]`, `punt[24]`) —igual que nosotros hasta hoy— y **no tiene puntuación por evaluador en ninguna parte de su código**; declara kappa como requisito y no lo implementa. Se agrega porque el **Manual de Procedimientos v1.0** establece que los dos técnicos puntúan por separado y después consensúan, y lo llama *el único requisito metodológico invariante*; sin las dos puntuaciones no hay forma de calcular el kappa que el propio Manual §23 pide como control de confiabilidad interjueces. **Es decisión nuestra (D7, §5.16), no requisito del cliente**, tomada ahora porque después de M11.3 cuesta migración **más** reescritura de servicios — hoy no hay ni servicios ni datos. Si en dos meses alguien lo lee como pedido de IPPU, está mal leído.
  - **Dos tablas nuevas (33 → 35): `puntuacion_idea` y `puntuacion_protocolo`.** Una fila por (evaluación, dimensión) y por (protocolo, ítem), con `valor_t1`/`valor_t2` **nullable**, `documentacion` y `diferencia`. **El consenso no se movió:** sigue en `idea.dim` y `protocolo.items`, que es el puntaje del instrumento. Lo que se agrega al lado es el dato de confiabilidad, que es otra cosa.
  - **Por qué tabla y no más claves dentro del JSONB.** El argumento de M11.2 —«el instrumento se lee y se escribe entero»— vale para el consenso y **no** para esto: kappa se calcula **a lo ancho** (t1 vs. t2 de una dimensión sobre toda la cohorte: un `GROUP BY dimension_id`, contra recorrer el JSONB de cada evaluación); «diferencias ≥2 sin documentar» es una **consulta institucional**, no un dato de un expediente; el evaluador es una **FK** que dentro de JSONB nadie garantiza; y `NS` necesita representación tipada. **Tampoco se heredó la forma del prototipo:** sus arrays planos son justamente lo que no sirve para esto.
  - **`NS` con tres estados, no dos.** `valor_tN NULL` + `ns_tN=false` = todavía no puntuó · `0..8` = puntuó · `NULL` + `ns_tN=true` = **puntuó NS**. `CHECK` de exclusión mutua entre los dos. Sólo en el IDEA: la Escala IPPU-TEA es Likert 1–5 y no admite NS. ⚠️ **Caso dejado sin resolver a propósito:** que uno ponga NS y el otro un número es un desacuerdo real que la aritmética no expresa (`diferencia` queda NULL). No se inventó una regla — está anotado en `esquema-datos-v2.md` §4 como definición de M11.3, con un test que fija el caso.
  - **`diferencia` es columna generada; el umbral que la interpreta, no.** Postgres calcula `abs(valor_t1 - valor_t2)`: aritmética pura, sin contenido clínico, imposible de desfasar y consultable. El **2** que la convierte en «ambigüedad clínica» vive en `core/constantes.py`, **no en la DDL** — si estuviera en el `CREATE TABLE`, moverlo sería una migración y nadie lo encontraría. **La base calcula el número, Python lo interpreta**, que es el mismo reparto de §5.2.2.
  - **Los tres tramos son constante y NO catálogo paramétrico**, contra el criterio general de D6 y por un motivo explícito: el Manual los llama el invariante metodológico, y si el umbral se pudiera correr con un `UPDATE`, los kappas de antes y después del `UPDATE` no serían comparables. Hay test que lo fija (no existe tabla de consenso ni de procedimiento).
  - **`procedimiento` y `documentacion_pendiente` son derivados, no columnas** (`hybrid_property`: sirven igual en Python que en el `filter()` de SQL). Mismo criterio sin drift que el estado visible de los módulos desde M1.
  - **Evaluadores en el módulo, no por fila:** `idea.evaluador_t1_id` / `evaluador_t2_id` y sus equivalentes en `protocolo`, con **`CHECK` de que no sean la misma persona** — «puntuación independiente» con un evaluador puesto dos veces daría kappa 1 sin que nadie haya comparado nada. **No se derivan de `firmas`**: la puntuación independiente ocurre *antes* de firmar, cuando `firmas` todavía está vacío. Sin `evaluadorN_rol`: el rol ya viaja en `firmas` y en `profesional.especialidad`, y una tercera copia son dos formas nuevas de quedar desfasada.
  - **Nullable no es comodidad, es requisito.** Una evaluación **sin** puntuaciones independientes sigue siendo válida: hace falta para la migración de históricos y para el seed espejo de la demo, donde sólo existe el consenso — y porque **todavía no sabemos si los técnicos de IPPU ya trabajan así**.
  - **Lo que NO se hizo, a propósito:** no se calcula kappa (fase piloto) · no se hicieron obligatorias las dos puntuaciones · **el guard «diferencia ≥2 exige documentación» no está en la base**: es lógica de negocio, va a M11.3 y quedó anotado en `esquema-datos-v2.md` §4 junto con su test previsto.
  - **Tests: 74 en verde, 0 salteados** (`tests/test_m12_consenso.py`, 20 nuevos). Incluye el caso textual del plan (`valor_t1=4, valor_t2=6, valor=4` → diferencia 2, pendiente de documentar), la consulta SQL de pendientes sobre tres filas, **los tres bordes 0 / 1 / 2 como estados distintos**, la evaluación sin puntuaciones independientes, los tres estados de NS, el CHECK de evaluadores distintos con su caso que sí debe pasar, y el borrado en cascada.
  - **Migración regenerada** (regla §5.19): `46da34fcc64e` (33 tablas) → **`f54959f07cc4_esquema_v2_inicial_m12_2.py`** con las **35**. Reconstrucción limpia: drop schema → `alembic upgrade head` → `python -m app.seed_catalogos` (14 secciones, conteos esperados) → `pytest -q` con **`test_la_migracion_coincide_con_los_modelos` en verde**.
  - **Anotado antes de que se olvide — hueco que dejó M12.1** (`puntos-a-validar.md` §2.8): con `UNIQUE(nombre, anio)` y seed *insert-only*, **no existe todavía ningún mecanismo para «abrir un año nuevo» de grupos**. Que el seed no los cree es correcto —coordinación es dueña de la fila—, pero en marzo de 2027 alguien tiene que poder crearlos y hoy la única vía es un `INSERT` a mano. Es de **M11.3/M11.4**; hoy no bloquea nada.
  - **Para la reunión con IPPU** (`puntos-a-validar.md` §1.9 y `consulta-a-ippu.md` §3.9, sincronizados): **¿los dos técnicos ya puntúan de forma independiente, o es práctica a introducir?** De la respuesta depende si D7 sirve desde el día uno o queda latente. La pregunta se redactó dejando claro que el sistema acepta igual un solo valor: no se les impone una forma de trabajar.
  - **Próximo: M12.3–M12.7 en paralelo** (catálogo de talleres · HCE-SEV · HCE-INC · HCE-PAI · ateneos), uno cada uno y en archivos distintos de `app/models/`. ⚠️ **Ahí sí aplica el congelamiento de §5.19**: mientras haya trabajo en paralelo real sobre los modelos, la migración se congela y la regenera **una sola persona** al terminar. (Lucas + Claude)

- **2026-08-14** — **M12.3 · Catálogo dinámico de talleres (D5)** (ronda **M12**). Corrido **solo**: no había ninguna rama de M12.4–M12.7 abierta, así que **§5.19 no congeló la migración** — se regeneró al cerrar, como en M12.1 y M12.2.
  - **`taller` deja de ser una lista fija.** Suma `orden` (la especificación pide poder **reordenar** y hasta acá el orden era el de inserción), `grupos_orientados` y `retirado_en`. Los tres son de coordinación, no del repo.
  - **`activo` dejó de ser columna: es derivado** (`hybrid_property` = `retirado_en IS NULL`, sirve igual en Python que en el `filter()` de SQL). Un booleano guardado al lado de la fecha se desincroniza en cuanto alguien escribe uno de los dos, y deja dos respuestas a «¿está vigente?». Mismo criterio sin drift que el estado visible de los módulos (M1), `procedimiento`/`documentacion_pendiente` (M12.2) y el `sensible` que viene en M12.5. Hay test de que **no se puede contradecir**: no hay setter ni por atributo ni por constructor, y `activo` no está en `__table__.columns`.
  - **`grupos_orientados` es un array de nombres de color en texto, NO una FK a `grupo.id`.** Desde D9 (§5.18) un grupo es `(nombre, anio)` con id propio: un `grupo_id` ataría el taller al año en que se creó la fila y en enero habría que reapuntar los 14 a mano. Por nombre es robusto al cambio de año — **la misma lógica que D5 aplica a la participación**. Hay test que da de alta «Grupo Azul 2027» y verifica que el taller no se tocó.
  - **Los 14 reales, generados y no transcritos.** `taller` salió de `DESDE_LA_DEMO` en `herramientas/generar_catalogos_backend.py` y ahora se genera desde `CAT_TALLERES` del prototipo (el nombre más largo mide 51 y entra en `String(80)`; el script lo verifica). `grupos_orientados` sale vacío y `retirado_en` en `None`: **el repo carga nombres, no gestión** — a qué grupos se orienta cada taller lo decide coordinación desde la app.
  - **`solo_al_crear` del seed pasó de `("activo",)` a `("orden", "grupos_orientados", "retirado_en")`:** la fila entera es de la institución. Verificado con test: re-correr el seed **no revive un taller retirado** ni pisa el orden ni la orientación.
  - ⚠️ **Los 8 talleres viejos no los borra el seed.** `_sincronizar` no borra ni desactiva lo que dejó de estar en el JSON, **por diseño** (podría haber registros apuntándole). Como no hay datos reales y `hce_taller` desapareció, **nada los referencia** y la reconstrucción limpia documentada (drop schema → `alembic upgrade head` → `python -m app.seed_catalogos`) los elimina sola. **No se escribió una migración de datos para esto.** Pero **una base de desarrollo que no se reconstruya va a conservar 8 talleres fantasma y el seed no lo avisa** — anotado también en `backend/README.md` con el `DELETE`.
  - **Decisión nueva, escrita antes de ejecutarla (§12.6): se retira `hce_taller`** → **§5.20**. Era un resto de v1 que sobrevivió el rewrite sin revisarse: modelaba participación **viva, por expediente y por `taller_id`**, mientras que las Especificaciones Técnicas §3 fijan `pai_taller { pai_id, taller_nombre }` —por nombre y por instancia de PAI—. No son dos implementaciones de lo mismo: son **dos modelos distintos**, y dejar los dos garantizaba dos fuentes de verdad. **Uso hoy: 0 tests, 0 seed, 0 routers, 0 schemas** (relevado). Deroga el `HCE_DIURNA }o--o{ TALLER` del ER §1 y la fila `hce_taller` de §2.1 de `esquema-datos-v2.md`.
  - ⚠️ **El conteo de tablas BAJA: 35 → 34. No es una regresión.** M12.3 **no crea tablas** —`taller` ya existía— y retira una. Dicho explícito acá, en el plan, en el README y en `estructura-repositorio.md` para que nadie lo lea como pérdida de trabajo.
  - **El criterio de verificación del plan se traspasó a M12.6** → **§5.21**. Pedía «cargar participación en Taller de huerta, retirarlo y afirmar que sigue legible y marcada como retirada»: con `hce_taller` retirada y `pai_taller` sin construir **no existe tabla de participación**. No se inventó una acá ni un mock que finja una que M12.6 va a modelar distinto — sería el trabajo duplicado de §5.3. Anotado en el plan, en M12.3 y en M12.6.
  - **Tests: 92 en verde, 0 salteados** (`tests/test_m12_talleres.py`, 18 nuevos). Cubren los 14 con nombres exactos y que no quede ninguno de los 8 viejos · `activo` derivado en Python y en SQL, imposible de contradecir, y retirar/reincorporar reversible · `grupos_orientados` con varios colores y sobreviviendo al alta del grupo del año siguiente · reordenar sin tocar `nombre` · seed idempotente (0/0) que no revive lo retirado · `HceTaller` inexistente e inimportable · y que **ninguna tabla tenga FK a `taller.id`**, que es lo que hace que retirar un taller no pueda arrastrar un registro clínico.
  - **Migración regenerada** (§5.19): `f54959f07cc4` (35 tablas) → **`3f11e10c13ed_esquema_v2_inicial_m12_3.py`** con las **34**. Reconstrucción limpia verificada: drop schema → `alembic upgrade head` → seed (14 secciones) → `pytest -q` con `test_la_migracion_coincide_con_los_modelos` **en verde**. `generar_catalogos_backend.py --check` → OK.
  - **`puntos-a-validar.md` §1.3 CERRADO** y `consulta-a-ippu.md` §3.1 reescrito (los dos sincronizados, como pide su cabecera): la pregunta «¿cuál es la lista completa de talleres?» **la respondió el propio prototipo de IPPU**; queda sólo pedirles confirmación de si esos 14 son los que dictan este año y si alguno va sólo a ciertos grupos. Sale de las 4 preguntas ⚠️ que más nos frenaban: quedan 3.
  - **Para M12.6:** el catálogo queda consumible — tabla **`taller`**, PK `id`, y `nombre` **UNIQUE `String(80)`**. `pai_taller.taller_nombre` casa **por texto exacto contra `taller.nombre`, sin FK** (a propósito: una FK reintroduciría exactamente lo que D5 evita). Para mostrar «retirado del catálogo», resolver el nombre contra el catálogo y leer `Taller.activo`, que filtra también en SQL.
  - **Próximo: M12.4–M12.7.** Si se toman en paralelo, ahí sí aplica el congelamiento de §5.19. (Lucas + Claude)

- **2026-08-15** — **M12.4 · HCE-SEV · Severidad DSM-5-TR** (ronda **M12**). Corrido **solo**: ninguna rama de M12.5–M12.7 abierta, así que **§5.19 no congeló la migración** — se regeneró al cerrar, como en M12.1–M12.3.
  - **Punto de partida verificado contra la realidad, no contra el handoff:** `d6da306`, árbol limpio, head `3f11e10c13ed`, **34 tablas** (metadata y base coinciden), **92 tests en verde, 0 salteados**. Única diferencia: Docker Desktop no estaba levantado y `pytest` **salteaba 67 tests en silencio** en vez de fallar — es entorno, no repo, pero conviene saberlo: **un `92 passed` sólo vale con el contenedor arriba**.
  - **El relevamiento previo cambió el módulo antes de escribirlo.** Con `severidad_dsm` iban a convivir **tres** lugares con un «nivel DSM»: `banda_idea.nivel_dsm`, `hce_diurna.nivel_soporte` y el registro nuevo. Se puso a prueba la hipótesis de que `nivel_soporte` **no** duplicaba nada (que fuera el nivel del **diagnóstico externo**, dato histórico vecino de `diag` y `cie11` en Especificaciones §3), buscando la evidencia en el **HTML del prototipo**, no en el `.md` de referencia. **Quedó refutada, con los tres tests apuntando al mismo lado:** (a) HCE-00 lo rotula `Nivel de soporte DSM-5-TR (orientativo)` —sin ninguna mención al ingreso, y «orientativo» es la misma palabra que usa la banda del IDEA—; (b) el módulo `sev` **lo escribe siempre**: `setSev()` → `p.nivel = sevResumen(p);  // sincroniza la etiqueta visible de la ficha`, dejándole un string de otro formato (`"CS: Grado 2 · CRR: Grado 2"`), y el changelog del prototipo lo dice literal; (c) la ficha **nunca muestra dos** niveles, hay un solo slot cuyo formato cambia en cuanto alguien toca SEV. Dos confirmaciones más: el identificador `nivel_soporte` aparece **una sola vez en las 406 KB** del prototipo —en el «esquema **sugerido**» de §3, que la app nunca usa— y **nuestra propia demo lo confirma**: `demo/js/datos.js` guarda `apoyo:"Grado 2 — Requiere apoyo sustancial"`, que es el contenido de HCE-SEV colapsado en un campo.
  - **Decisión escrita antes de tocar código (§12.6): se retira `hce_diurna.nivel_soporte`** → **§5.24**. Era la etiqueta visible denormalizada: una copia sin justificación, fecha ni autor de lo que `severidad_dsm` registra bien. **No se renombró** a «nivel del diagnóstico de ingreso» porque habría sido inventarle un significado que ninguna fuente le da. **Costo relevado antes de decidir: 0 tests, 0 seed, 0 routers, 0 schemas, 0 usos en la demo.** ⚠️ **Es una columna, no una tabla:** el conteo sube 34 → 36 por las **dos tablas nuevas**, y esto no lo baja. **Divergencia declarada con la fuente normativa** (las Especificaciones §3 lo listan; nosotros no lo implementamos), habilitada por el «Principio de la ronda».
  - **`banda_idea.nivel_dsm` SE QUEDA** y gana docstring: es propiedad **DE LA BANDA**, no del NNA — «un total de 56–75 se corresponde orientativamente con Nivel 2» es contenido del catálogo del IDEA (D4), no un juicio sobre nadie.
  - **`severidad_dsm` en archivo propio `app/models/severidad.py`**, no en `modulos.py` (que es el flujo firmable, y HCE-SEV **no se firma**) ni en `catalogos.py`: son los dos puntos de conflicto si M12.5–M12.7 arrancan en paralelo.
  - **0..1 por expediente, PK = `hce_id`**, como `consentimiento`. Dos razones: la regla del módulo dice que el registro describe la necesidad de apoyo **actual** —que la severidad fluctúe no pide una fila por medición, pide que la fila diga **cuándo** se juzgó—, y **es la dirección reversible**: 0..1 → 1:N es agregar un `id`; el camino inverso obliga a descartar filas. ⚠️ **Con una condición, anotada como guard obligatorio de M11.3:** «la historia vive en `auditoria`» es hoy una **aspiración** —no existe `app/services/`—, así que **toda edición de `severidad_dsm` tiene que registrar auditoría de campo**. Con esa línea escrita el 0..1 es correcto; sin ella borra en silencio la fluctuación que la propia regla menciona como propiedad del fenómeno.
  - **Los dos dominios son independientes en sus *valores*, no en su presencia.** CS 3 con CRR 1 pasa y nada los ata; pero los dos son **NOT NULL**, porque la regla dice que la severidad «se especifica por separado para **cada** dominio». El estado «todavía no se juzgó» ya es representable **sin fila** —eso compra el 0..1—, así que columnas nullable serían una segunda forma de decir lo mismo. `justificacion`, `fecha` y `profesional_id` también NOT NULL: un juicio clínico sin justificación, fecha ni autor no es un juicio clínico.
  - **Bug encontrado al escribir el test de justificación vacía:** `btrim()` sin argumentos recorta **sólo espacios**, así que una justificación de tabuladores o saltos de línea pasaba el CHECK. Cambiado a `justificacion ~ '[^[:space:]]'`. Es exactamente para lo que sirve probar cada rechazo con más de un caso.
  - **La regla del sistema se persiste verbatim** como docstring del modelo, igual que D4 hizo con el texto neutro de las bandas: está redactada para **no prescribir** y para acotar el alcance del registro («no sustituye la determinación de elegibilidad»), y parafrasearla rompe esa propiedad.
  - **Catálogo `severidad_nivel`: una fila por grado, no tres tablas.** `SEV_ETQ`, `SEV_CS`, `SEV_CRR` y `SEV_APOYO` están todas indexadas por el mismo grado 1–3 y el prototipo las renderiza como **una tabla de cuatro columnas**; tres tablas paralelas con la misma PK serían la misma fila partida en pedazos. **Generado**, no transcrito (`herramientas/generar_catalogos_backend.py`, sección nueva) — `--check` en verde. Las **etiquetas se derivan** del número contra este catálogo y **no se guardan** en `severidad_dsm`: guardarlas sería reintroducir ahí el campo que se acaba de retirar de `hce_diurna`.
  - **Sin FK a `severidad_nivel`, a propósito.** `nivel_cs`/`nivel_crr` son el **dato primario** —el juicio clínico—, no una clasificación derivada, y el grado DSM-5-TR vale aunque la tabla de descriptores esté vacía. Mismo criterio que `idea` respecto de `banda_idea`, y **distinto** de `valoracion_funcional.categoria_id`, que sí es FK porque ahí la categoría **la deriva el servidor** desde `pct`. El rango lo garantiza un CHECK.
  - ⚠️ **La cuenta de FKs sin respaldo NO estaba en 0** —el criterio de cierre de la ronda la da por sentada—. `puntuacion_idea.dimension_id` y `puntuacion_protocolo.item_id` quedaron sin índice en **M12.2**: su `UNIQUE` compuesto no las cubre porque no son la columna líder. **Corregidas acá** (`index=True`) y el chequeo quedó **automatizado como test**, para que no vuelva a pasar inadvertido en M12.5–M12.7.
  - **Guards nuevos anotados en `esquema-datos-v2.md` §4** (no implementados: son M11.3), bajo un principio transversal escrito ahí por primera vez — **«IPPU registra, no determina»**, que no es frase nuestra: las Especificaciones §1 la dicen para VF («no certifica») y la regla de HCE-SEV para severidad («no sustituye la determinación de elegibilidad»). **Entrada:** el nivel no se calcula ni se deriva del IDEA ni de la IPPU-TEA. **Salida, en tres afirmaciones precisas y no en una prohibición ancha:** (1) `severidad_dsm` no participa de ningún cálculo de elegibilidad —ni `pct`, ni categoría del baremo, ni prestaciones sugeridas—, que es el **espejo del guard §7.5**, hoy cerrado sólo de entrada; (2) ⚠️ **no se extiende el correlato clínico de la autogeneración de VF**: §1(g) sanciona un mapeo **cerrado** (comunicación ← E2, interacciones ← E1, aprendizaje ← E4) y `severidad_dsm` no está en él — agregarlo sería inventar un correlato que IPPU no definió, justo en el camino que lleva a una determinación de elegibilidad; (3) en el Reporte de VF la severidad va **en palabras** («necesita ayuda notable en comunicación social»), nunca «Grado 3» ni numeral, que es la regla que el propio módulo ya se aplica (§1(g) «nunca números crudos ni porcentajes», §1(h) «no es certificado ni informe clínico»).
  - **Tres guards más, del mismo material y hasta hoy sin anotar en ningún lado:** (4) auditoría de campo obligatoria en toda edición de `severidad_dsm`; (5) **`valoracion_funcional.pct` NULL es un estado válido, no un dato faltante** — en menores de 2 años **no se aplica el BUND** y la constancia sale de IBMF/IRSA, así que `categoria_baremo(NULL)` devuelve **«no corresponde»**, no error ni categoría por defecto (la edad sale de `persona.fecha_nac`, sin campo nuevo; **la demo ya lo implementa desde M9, el backend no**); (6) ⚠️ **cuando llegue el anexo del Decreto 72/025 se reconcilian los CORTES, nunca las ETIQUETAS** — IPPU declara que la nomenclatura oficial puede diferir de la institucional y que en sus pantallas usa siempre la suya; si el anexo dijera «grave», alinear las etiquetas violaría §8.1 y el test de `VOCABULARIO_PROHIBIDO` saltaría en rojo, y **quien lo vea va a creer que el test está mal y el decreto tiene razón**. Anotado **también** en `puntos-a-validar.md` §1.2, que es donde alguien va a leer la tarea el día que llegue.
  - **Tests: 123 en verde, 0 salteados** (`tests/test_m12_severidad.py`, 31 nuevos). Cubren CS 3 / CRR 1 sin que uno arrastre al otro y los tres grados válidos · justificación NULL, vacía y de sólo espacios/tabs rechazadas, con su caso que pasa · ídem `fecha` y `profesional_id`, incluido profesional inexistente · niveles fuera de 1–3 rechazados en los dos dominios · expediente **sin** severidad válido · un solo registro por expediente · **borrado en cascada** · las tres etiquetas derivadas · descriptores de los dos dominios distintos entre sí · ningún texto nuevo dice «grave» · y el **aislamiento estructural en las dos direcciones**: `severidad_dsm` no tiene FK ni columna hacia `idea`/`protocolo`, y ni `valoracion_funcional` ni `baremo_categoria` tienen FK ni columna hacia `severidad_dsm` — que es la forma verificable hoy de «instrumentos no homologables» y de «no participa de la elegibilidad».
  - **Migración regenerada** (§5.19): `3f11e10c13ed` (34 tablas) → **`f432ea139fd9_esquema_v2_inicial_m12_4.py`** con las **36**. Reconstrucción limpia verificada: drop schema → `alembic upgrade head` → seed (**15 secciones**, `severidad_nivel` 3/3) → seed **por segunda vez 0/0 en todo** → `pytest -q` con `test_la_migracion_coincide_con_los_modelos` **en verde** → `/health` 200 → `generar_catalogos_backend.py --check` OK.
  - **Dos decisiones más de la ronda, sin código pero condicionan M12.5 y M12.6:** **§5.22 (E4)** la sección V de HCE-PAI **no duplica HCE-INC** —`centro`, `modalidad` y `grado` pasan a carga única, porque el PAI de INAU es un documento **dinámico** con actualización en SIPI ante cualquier cambio y una copia congelada del centro educativo contradice esa obligación; el modo de falla concreto es entregarle a un organismo del Estado un dato desactualizado—, con dos consecuencias anotadas para M12.6 (**`pai` NO lleva `UNIQUE(hce_id, anio)`**: con revisión semestral puede haber más de un PAI por año; y **verificar el nombre oficial**, «Propuesta de Atención Individual» del prototipo vs. «Proyecto de Atención Integral» de la normativa INAU). ⚠️ Su fuente es **investigación sobre normativa INAU, no material entregado por IPPU** — va a la reunión. Y **§5.23 (E5)** **M12.4 iba antes que M12.6** por dependencia de **conocimiento**, no de esquema: M12.6 no necesita `severidad_dsm` para compilar (carga única es *ausencia* de columnas) pero sí conocer su forma para escribir el mapeo «qué sección lee de qué tabla». **M12.5 y M12.7 siguen libres.**
  - **Anotado en el plan §M12.6:** verificar contra el JS si `padronInau`, `disposicion`, `judicial` y `expediente` existen en el objeto `pai` o sólo se renderizan desde HCE-ORG — `prototipo-v4-referencia.md` §7 **afirma las dos cosas** y no pueden ser ciertas a la vez.
  - **Dos cosas anotadas para M11.4** (§2.2 y §5 del esquema, y el docstring del modelo): (a) **el orden de los módulos en la ficha no está modelado en ninguna tabla y no se inventó una** — `FICHA_TABS` pone **SEV entre CI e IDEA**, hoy vive implícito, y si M11.4 lo materializa que sea decisión suya y quede escrita; (b) ⚠️ **`severidad_dsm` no admite guardado parcial** — con los dos dominios NOT NULL, un técnico que juzgó CS pero todavía no CRR no puede grabar, y este módulo **no tiene borrador ni firma** donde apoyar el a medias. Es defendible (el DSM-5-TR pide especificar los dos, y el prototipo pone los dos `<select>` en el mismo formulario) pero **hay que resolverlo explícitamente**: validar en la UI, borrador del lado del cliente, o volver nullable las dos columnas si IPPU dice que juzgar un dominio y el otro después es práctica real. **No reabre la decisión de M12.4**: es flujo de trabajo, y M12 es capa de modelo.
  - **Deuda que deja:** la demo conserva `p.apoyo` (no se toca, es no-goal de la ronda); cuando incorpore HCE-SEV, `apoyo` pasa a **derivarse** de ese registro. Y el catálogo de talleres de M12.3 **sigue sin forma de administrarse** — ahora se le suma `severidad_nivel`, aunque ése no lo toca coordinación (es texto del instrumento). Ambos en `puntos-a-validar.md` §2.
  - **Próximo: M12.5 · M12.6 · M12.7**, en paralelo y en archivos distintos de `app/models/`. Si se toman a la vez, ahí sí aplica el congelamiento de §5.19. (Lucas + Claude)

- **2026-08-15** (segunda) — **Guardia de entorno en `pytest`: se cierra el hallazgo de M12.4 sobre el instrumento de verificación.** Tarea puntual, **no** es sub-módulo de M12: no toca `app/models/` ni genera migración.
  - **El diagnóstico, corregido respecto de cómo lo veníamos contando.** Los `skip` **no eran silenciosos**: pytest imprime las `s`, el conteo de salteados y, con `-rs`, el motivo completo de cada uno. Lo verificamos. **El defecto es más angosto y peor: la corrida devuelve `exit 0`.** Con el contenedor abajo el resultado de hoy es `34 passed, 89 skipped in 8.81s` y código de salida **0** — para CI, para `if ($?)` y para cualquier automatización, una sesión vacía es **indistinguible** de una válida; y el renglón de resumen **empieza con «34 passed»**, que de un vistazo se lee como verde. De ahí sale el número que termina en la bitácora.
  - **Eran DOS mecanismos, no uno.** (1) `tests/conftest.py`, un `pytest.skip` dentro de la fixture de sesión `engine`, que cascadea a **todo** test que pida `db`; y (2) `tests/test_esquema_v2.py`, un `pytest.skip` propio dentro de `test_la_migracion_coincide_con_los_modelos`, sobre la **base de desarrollo** (no la de test — ese test compara los modelos contra el esquema aplicado, no contra `create_all`). **Los dos se retiraron.** Si sólo se hubiera arreglado el primero, el segundo habría seguido tapando exactamente el desfasaje modelos ↔ migración que §5.19 volvió bloqueante.
  - **Guardia de sesión** (`_entorno_verificado`, fixture `autouse` de scope sesión que además `engine` pide explícitamente, para no depender del orden de las autouse). Tres chequeos, cada uno con `pytest.exit(returncode=1)` y **mensaje accionable**: **(a)** Postgres no responde — con la URL efectiva **sin contraseña** y `docker compose up -d`; **(b)** responde pero la base de desarrollo está vacía — con `alembic upgrade head`; **(c)** tiene esquema pero **no está en el head** — con **las dos revisiones a la vista** (aplicada vs. head) y el mismo comando. Se conservó la guarda que ya existía (`TEST_DATABASE_URL == DATABASE_URL` → abortar: los tests hacen `drop_all`).
  - **Dos bases, no una — y por eso (b) y (c) miran `DATABASE_URL`.** Los tests estructurales corren contra la base de test, que la propia fixture construye con `create_all()` desde los modelos: **no necesita Alembic**. La que tiene que estar migrada es la de **desarrollo**, porque es contra ella que compara el test de coincidencia. (a) chequea las dos.
  - **Sin literales, a propósito.** Ni el número de tablas ni el identificador del head están escritos en el código: las tablas se **cuentan** y el head se **deriva en tiempo de ejecución** de `alembic/versions/` (`ScriptDirectory.from_config`). Los dos cambian al cerrar cada sub-módulo (§5.19), y un literal acá sería deuda que habría que tocar en M12.5, M12.6, M12.7 y M12.8.
  - **El `skip` no quedó como fallback**, a propósito: conviviendo con la guardia, el salteo **gana** cada vez que ella no prevé un caso — que es reproducir el bug. O la sesión corre entera, o no arranca.
  - **Verificado ejerciendo los tres modos de falla a mano**, no con un test verde: Docker abajo → aborta con (a), `no tests ran`, **exit 1** · esquema borrado (`drop schema public cascade`) → aborta con (b), exit 1 · `alembic_version` pisada a `3f11e10c13ed` → aborta con (c) mostrando `Aplicada: 3f11e10c13ed` / `Head: f432ea139fd9`, exit 1 · estado restaurado (`upgrade head` + seed, 15 secciones) → **123 passed, 0 skipped, exit 0**, con `-rs` sin sección SKIPPED. Mismo número que antes del cambio.
  - ⚠️ **Consecuencia retroactiva, que es el motivo de cerrarlo ahora y no después.** **Todos los conteos de tests de la bitácora desde M11.2 (21) hasta M12.4 (123) son válidos sólo si Docker estaba arriba en esa corrida — y no hay forma de auditarlo a posteriori.** El registro dice «N en verde»; no dice cuántos se saltearon, y el exit 0 no dejaba rastro. No implica que estén mal: implica que **no son verificables**. Lo que sí está verificado es el estado de hoy, comprobado en esta sesión con la guardia puesta: **123, 0 salteados**. **De acá en adelante el número que se anote es auditable**, porque una corrida incompleta ya no puede terminar en «passed». Se cierra **antes** de M12.5–M12.7 y de M12.8 justamente para que los conteos del fan-out nazcan confiables.
  - Documentado en `backend/README.md` (sección nueva en el arranque, con la tabla de los tres chequeos) y en `CLAUDE.md`. (Lucas + Claude)
- **2026-08-15** — **M12.7 · Ateneos clínicos y jornadas de capacitación.** **38 tablas** (`ateneo` +
  `ateneo_acuerdo`; 36 → 38, sin tabla de catálogo), **240 tests en verde, 0 salteados** —el primer
  conteo del fan-out que nace auditable, con la guardia de entorno ya puesta—, migración inicial única
  regenerada (**`9246e659d2c9`**) con `test_la_migracion_coincide_con_los_modelos` en verde. Cero
  triggers, `/health` 200, `generar_catalogos_backend.py --check` OK y sin movimiento.
  - **Una sola entidad con campos según tipo**, como el prototipo (`DB.ateneos[]`), no cuatro tablas:
    lo que cambia entre tipos no es la forma del registro sino qué bloque de contenido se llena.
  - **`AT_TIPOS` entró como CONSTANTE, no como catálogo** — la decisión más consecuente del módulo.
    Parece catálogo (alimenta un filtro), pero el tipo es el **discriminador contra el que están
    escritos los 5 CHECK**: con catálogo editable, coordinación agrega «Ateneo de familia» desde la app,
    el tipo nuevo cae fuera de todas las reglas (`tipo = 'clinico' OR …`) y la fila se guarda **sin
    sujeto y con los dos bloques de contenido a la vez**, sin que nadie despliegue ni revise nada.
    Misma forma que `protocolo.tipo` / `evento.tipo` / `servicio.clave`, y mismo razonamiento que
    `CONSENSO_PROCEDIMIENTOS`. Se persiste la **clave**, no la etiqueta.
    `test_el_check_y_la_constante_no_pueden_divergir` es el que hace ruido si alguien agrega una clave.
  - **Identificador: serial + `UNIQUE(anio_correlativo, numero)`, con `codigo` derivado** —el patrón de
    D9 (§5.18)—, no PK de texto. El código codifica año, prefijo y número, y **los tres son
    corregibles**: con PK de texto, renumerar arrastraría las FK hijas y dejaría colgada toda referencia
    ya emitida en papel.
  - **Prefijo `AT-` para los cuatro tipos**, resolviendo la contradicción del prototipo (su seed muestra
    `JC-2026-001`, pero `atNuevo()` genera siempre `AT-` y su contador `id.includes(anio)` cuenta las dos
    formas en **una sola serie**). Además `tipo` es editable: con prefijo por tipo, corregir un tipo mal
    cargado cambiaría el identificador de un registro ya circulado. Como el código es derivado, si IPPU
    prefiere `JC-`, es **una línea y cero migración**. → `docs/notas/`.
  - **El correlativo es de registración, no cronológico.** Se congela al crear —en el prototipo el
    registro nace con `fecha:''`, o sea que el año del hecho **no existe** al numerar— y el filtro de año
    va contra `fecha`. Divergencia declarada: `AT-2027-001` puede tener `fecha = 2026-12-20`. La columna
    se llama `anio_correlativo` y no `anio` justamente para que nadie filtre por la equivocada.
  - **`sensible` derivado** (`tipo == 'clinico'`), nunca capturado, con expresión SQL para Fase 4.
    ⚠️ **Hueco de la fuente:** el aviso del prototipo nombra los clínicos (sensibles) y los
    institucionales y jornadas (acceso general), pero **no dice qué es un ateneo de grupo** — y su propio
    seed muestra uno discutiendo Δ de protocolos de NNA identificables. Se implementó lo que dice la
    fuente y la pregunta va a IPPU; que sea derivado hace que cambiar de criterio cueste una línea.
  - **Dos decisiones nuevas: §5.25 y §5.26.** La primera le da a HCE-DOC **alcance institucional**
    (`documento.hce_id` nullable + `ateneo_id` + XOR), porque un ateneo institucional o una jornada no
    tienen expediente y el prototipo les pide adjuntos («Referencia a documentos en HCE-DOC
    **institucional**»); se relajó la FK de la tabla dueña como M12.1 hizo con `auditoria.hce_id`, en vez
    de crear una tabla paralela que sería una segunda fuente de verdad. La segunda fija la **nomenclatura
    `hce_id` = pertenencia / `hce_<calificador>_id` = referencia**, que **M12.6 hereda**.
  - **Tres hallazgos que no estaban previstos y valen más que el módulo:**
    1. **`lpad` trunca y `f"{n:03d}"` ensancha.** Con `numero = 1000`, las dos mitades de `codigo`
       devolvían códigos **distintos** (`AT-2026-1000` en Python, `AT-2026-100` en SQL) y el `UNIQUE` no
       lo veía, porque es sobre `numero` y no sobre el código. Verificado contra Postgres antes de
       escribirlo. Se cerró con `CHECK numero BETWEEN 1 AND 999`: el formato de tres dígitos pasa de
       convención a **garantía estructural**, y el desborde falla fuerte en vez de generar un código
       colisionante.
    2. **Corregir el tipo de un ateneo clínico exige limpiar `hce_referida_id` en la MISMA sentencia**,
       por el CHECK `(hce_referida_id IS NOT NULL) = (tipo='clinico')`. Es correcto —no puede quedar un
       institucional con un NNA colgado ni un instante— pero es una consecuencia de UI que no estaba
       prevista: se sumó a las otras tres de D6 para M11.4, con su test y el caso que sí pasa.
    3. **`''` y `NULL` conviven y la base ya no los distingue.** Los CHECK usan `~ '[^[:space:]]'` y no
       `num_nonnulls()` —los 17 campos del prototipo nacen en `''`, y `btrim()` sin argumentos recorta
       sólo espacios: el defecto que M12.4 dejó documentado—, y se resolvió en la DDL y no como
       invariante de la API porque `routers/`, `schemas/` y `services/` todavía no existen: una garantía
       estructural que depende de código no escrito no es una garantía. **Pero el efecto es que cualquier
       `WHERE situacion IS NOT NULL` de M11.3/M11.4 estaría mal.** Queda escrito en §4 del esquema:
       **`NULL` es la representación canónica**, el servicio normaliza al guardar, y hasta entonces se
       consulta con el regex. Vale para todo campo de texto opcional del esquema, no sólo para este
       módulo.
  - **Lo que NO se hizo, y por qué:** sin `tsvector`/GIN (btree en `titulo`) — `vAteneos` busca
    **subcadena** y `tsvector` matchea **lexemas**: «capacit» no encontraría «capacitación»; las dos
    opciones y su diferencia semántica quedan en §4. Sin asignación del correlativo (es de M11.3, con la
    race condition y el reuso tras rollback que el `length+1` del prototipo hace mal). Sin timestamps
    (existen en 1 de 38 tablas: no es convención y no se estrena en el módulo más chico). Sin tocar
    `categoria_documento` (está en `DESDE_LA_DEMO`; la categoría propia es de M12.8).
  - **`README.md` estaba desactualizado desde M12.4**, no desde esta sesión: decía «34 tablas y 92 tests
    (M12.0 a M12.3)». Se puso al día con M12.4 + M12.7 y con la guardia de entorno de pytest.
    (Lucas + Claude)

- **2026-08-16** — **Ronda de alineación de la demo v4.1 con el Prototipo v4** (Samuel; commit hecho
  por Lucas). Ronda **paralela a M12**, sobre la demo (no-goal de M12). Decisión en **§5.27 (F1)**.
  **Commiteada en `main`** el 2026-08-16 para desbloquear la sesión F1-nav que arrancó a continuación
  (`demo/F1-navegacion`, ver bitácora del mismo día). Verificación visual + re-baseline del fingerprint
  quedaron pendientes post-commit (ver §6 y la anotación "NO verificado" más abajo).
  - **Alcance: solo alineaciones sobre lo que ya existe.** No se agregaron módulos nuevos (HCE-SEV,
    HCE-INC, HCE-PAI, Ateneos quedan para otra ronda si se decide). §5.2 y §5.5 intactos.
  - **6 alineaciones aplicadas:**
    1. **Cita Rivière 1997 → 1997/2002** (`catalogos.js:102`, comentario del bloque). Cierra la deuda
       que M12.1 ya había arreglado en el backend pero no en la demo.
    2. **Vocabulario «grave» → «severo» (§8.1): ya cumplido.** La única ocurrencia de "grave" en toda
       la demo era un **comentario que cita la regla** (`hce-doc-org-vf.js:243`). Nada que cambiar.
    3. **Bandas del IDEA: 3 tramos → 6 con soporte DSM-5-TR** (§5.13 / D4). Reemplazadas «Leve
       0–32 · Moderada 33–64 · Severa 65–96» por las 6 del prototipo (Muy leve ≤15 · Leve ≤30 · Leve a
       moderado ≤55 · Moderado ≤75 · Moderado a severo ≤90 · Severo a muy severo >90), cada una con su
       nivel DSM-5-TR y su texto orientativo **copiado tal cual** del prototipo (`ideaInterpreta`):
       reescribirlo rompía la neutralidad metodológica, igual que en M12.1. Introducida constante
       `IDEA_BANDAS` en `catalogos.js` con `perfil`, `ns`, `color`, `txt`. `bandaIdea()` y
       `colorBanda()` mantienen su firma (devuelven strings) — no rompe usos en `flujo.js` ni
       `expediente.js`. En `ui-core.js` la distribución por banda ahora se construye desde
       `IDEA_BANDAS`, con el `ns` visible en el label.
    4. **Interpretación del Δ con 6 tramos y acción sugerida** (M12.1). La demo ya tenía los 6 rangos;
       faltaba el campo `a` (acción). Agregado con **texto textual del prototipo** en los 6 tramos.
       El tramo `Regresión significativa` lleva `alerta:true`. **`ALERTA_DELTA` pasa a ser derivado**
       del catálogo (busca el mayor Δ con `alerta:true`) en vez de constante suelta `-7`. Verificado:
       sigue devolviendo `-7`. Una sola fuente de verdad, criterio de §5.20/§5.24.
    5. **Los 14 talleres reales del prototipo** (§5.14 / D5) reemplazan a los 8 inventados. Ninguno
       coincidía exactamente. **Mapeo semántico** aplicado por texto en 4 archivos: Habilidades sociales
       → *Taller de habilidades sociales* · Lenguaje y comunicación → *Taller de cuentos y estimulación
       del lenguaje* · Motricidad → *Educación Física* · Juego simbólico / Actividades lúdicas →
       *Actividades lúdicas y de juego* · Música y expresión → *Taller de música y expresión* · Vida
       diaria (AVD) → *Taller de higiene y AVD* · Arte y plástica → *Taller de expresión plástica* ·
       Psicomotricidad → *Actividades sensoriales* · Cocina → *Taller de cocina*. Archivos tocados:
       `index.html` (14 chips en `#tallerPicker`, antes 8), `datos.js` (8 NNAs), `grupos-usuario.js`
       (4 grupos + fix `de 18 institucionales` → `de 14`), `ui-core.js` (heatmap ilustrativo con nombres
       alineados; valores intactos: §5.1.3 sigue fuera de alcance). **Absorción parcial:** los 14
       nombres se cargan pero la demo **no gestiona** el catálogo (retirar, orientar a grupos, reordenar)
       — hoy es lista fija en el picker. Anotado en §6 como deuda.
    6. **Grupos por color** (§5.18 / D9): A → Azul · B → Celeste · C → Naranja · D → Verde. **Grupo E
       ("Multiedad — taller abierto") retirado** — el prototipo tiene exactamente 4 grupos por color,
       y `datos.js` no tenía ningún NNA en E (verificado antes de retirar). `USUARIO.grupos:["A","E"]`
       → `["Azul"]`. `EQUIPO[i].g` remapeado en las 4 filas. `<select id="f_grupo">` con 4 options.
       ⚠️ **Divergencia acotada con §5.18 — explicada en §5.27:** la demo usa `GRUPOS[i].id = "Azul"`
       (nombre como identidad) en vez del `id serial + UNIQUE(nombre, anio)` del backend, porque la
       demo **no tiene concepto de año**. Se reconcilia en Fase 3 cuando la demo hable con la API.
       Colateral positivo: la búsqueda `deburr("azul")` ya no colisiona con nombres de NNA que
       contengan la letra (antes `"a"` matcheaba grupo A y todos los que tenían «a» en el nombre).
  - **2 fixes de layout aplicados sobre la marcha** (reportados por Samuel al abrir la demo):
    1. **Heatmap desbordado y luego con cuadros desproporcionados** (`css/estilos.css` §Analítica +
       `ui-core.js:441`). Causa raíz: los nombres nuevos son 2-3x más largos que los viejos, y el CSS
       tenía `white-space:nowrap` en `.heat th.row`. Primer fix: envolver con `white-space:normal` +
       `word-break:break-word` y `table-layout:fixed` para que las columnas respeten el ancho. Efecto
       secundario: filas con nombres largos crecían en altura y estiraban los `td` de valor (que sólo
       tenían `height:30px` como mínimo). Segundo fix: mover el cuadrito de color a un `<div
       class="heat-cell">` con dimensiones **fijas** (42×30) dentro del TD, así el visual del heatmap
       queda desacoplado de la altura de la fila.
    2. **Espacio en blanco a la derecha en todas las vistas** (`css/estilos.css:73`). Causa: el `main`
       tenía `max-width:1180px` — en pantallas anchas dejaba franja vacía después del sidebar (218px).
       Sacado el `max-width`, agregado `min-width:0` (previene el bug clásico de flex donde un ítem
       ignora `flex:1` por contenido ancho). `pagedesc` mantiene su `max-width:760px` porque una línea
       de párrafo muy larga se lee mal — sólo cambia el contenedor de cards/tablas/gráficos. El
       `@media print { main{max-width:none} }` de línea 533 seguía siendo redundante en runtime; ahora
       coincide con el layout normal.
  - **Archivos modificados (6):** `demo/index.html` · `demo/css/estilos.css` · `demo/js/catalogos.js`
    · `demo/js/datos.js` · `demo/js/grupos-usuario.js` · `demo/js/ui-core.js`. Diff bruto:
    +96 / −69 en los 5 primeros (antes del fix de layout); el layout suma unas líneas más.
  - **Verificación hasta acá:** **`node --check` en los 7 JS de `demo/js/` → OK** (todos parsean).
    Chequeo derivado con `vm` en Node: `bandaIdea(58)` = «Moderado» (**§12-A crítico intacto** —
    Martín sigue en su banda), bordes 0/15/16/30/58/75/90/96 correctos, `ALERTA_DELTA` = −7. Búsqueda
    por grupo con `"azul"` y `"grupo azul"` — funciona por lectura estática.
  - **NO verificado al momento del commit (deuda post-commit, ver §6):**
    - **Fingerprint Playwright** (`demo/verificacion/`): 3 pasos rompen a propósito (`banda` en analítica,
      talleres del heatmap, grupos en modelo/expediente). Hay que re-baseline con la demo actualizada,
      como se hizo en v4.1 con `D3_analitica_derivada`. Playwright **no estaba instalado en el clone al
      momento del commit** (no es dependencia del repo, §5.5.4) — se instala aparte con el comando del
      README de `demo/verificacion/`.
    - **Visual en navegador**: abrir `demo/index.html` con doble clic y recorrer Analítica · Grupos ·
      alta de NNA (picker de 14 talleres) · expedientes (los 8 NNAs). Los 2 fixes de layout se
      dispararon justamente por hacer este paso — quedan pendientes de revisar de nuevo con el fix.
      **Solapa parcialmente con la verificación visual de F1-nav** (§6.2 del prompt): Grupos y
      expedientes los recorre F1-nav; Analítica y alta de NNA no.
  - **§12.3 (coordinación):** Samuel tomó `demo/*` en esta sesión — avisar en el grupo cuando se
    haga el push, para que Lucas y Victor sincronicen antes de tocar la demo. Push hecho el 2026-08-16
    junto con el commit. (Samuel + Lucas + Claude)
