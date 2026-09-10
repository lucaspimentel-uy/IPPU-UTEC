# Handoff — Proyecto IPPU × UTEC-LIDIA · Línea 1 (HCE + IDEA)

> **Bitácora de contexto entre sesiones.** Sirve para que cualquier sesión (Claude o persona)
> recupere el estado del proyecto sin releer todo. **Actualizar al final de cada sesión** (sección 4 y 6).
>
> ⚠️ **Este archivo está versionado en el repo desde el 2026-08-03** (antes era local y por eso el equipo
> trabajaba a ciegas — ver §12). Es el **contexto compartido de los tres**: leerlo al empezar, actualizarlo
> al terminar, pushearlo siempre. **Cómo trabajamos en paralelo sin pisarnos: §12.**
>
> - **Última actualización:** 2026-09-10 (sesión **M12.8b-1b + R1** — **dos mitades, ninguna toca código**.
>   **PARTE A (M12.8b-1b):** se escribió la **sección HCE-PAI** de `esquema-datos-v2.md` §2.2 (8 tablas /
>   81 columnas, re-medidas contra `Base.metadata` **y** la migración), se completó el **diagrama ER** de
>   §1 con `pai` + 7 hijas, se agregaron **dos filas de guards de PAI a §4** (§IX por `tipo`, Anexo A) y la
>   cobertura del documento pasó de **43/51 → 51/51**. **PARTE B (R1):** primer reconocimiento estilo R0
>   para M11.3 → `docs/notas/relevamiento-M11.3-2026-09-10.md`, solo lectura, hallazgos **R1-01…R1-10**.
>   **PARTE C:** medido —sin mover nada— que archivar la cola resuelta de §6 (**40 `[x]` ≈ 39 % de sus 441
>   líneas**) **no cita ningún bullet resuelto desde afuera** → rework cero (registrado en §6, bullet
>   «Partir `handoff.md`»). `pytest -q` → **432 passed, 0 skipped**; ambos `--check` → exit 0; **51 tablas**;
>   head `559b1a79cb77` — **idénticos al inicio.** Bitácora en `docs/bitacora.md` (§5.84); esta cabecera se
>   actualiza igual (§5.82).) **Queda de M12.8b:** **M12.8b-3** (pase de vocabulario §5.75/§5.76); más el
>   resto de M12.8 (seed de **catálogos** desde el JSON del prototipo, tests, docs — **no** el seed espejo,
>   que es M11.5). **M12.8b-1b HECHO** (esta sesión).
> - **Responsable del documento:** Lucas Pimentel (UTEC-LIDIA) · **Equipo:** Lucas · Samuel · Victor
> - **Foco actual:** **L1 — M12 (absorción del Prototipo v4), intercalada entre M11.2 y M11.3.** **HECHOS: M12.0 · M12.1 · M12.2 · M12.3 · M12.4 · M12.5 · M12.6 · M12.7 · M12.8a-1 · M12.8a-3 · M12.8b-1 · M12.8b-1b · M12.8b-2 · M12.8b-2b** — **51 tablas**, **432 tests en verde y 0 salteados**, head de Alembic **`559b1a79cb77`** (un solo archivo en `versions/`). ⚠️ **Las tres cifras se remidieron contra el código y la base en M12.8b-1b** (2026-09-10), no son afirmación de documento; el punto de partida lo había verificado el relevamiento **R0** del 2026-08-26 (`docs/notas/relevamiento-estado-2026-08-26.md`) y ahora también **R1** (`docs/notas/relevamiento-M11.3-2026-09-10.md`). **FALTA para cerrar M12.8a:** nada estructural — `divulgacion` se construyó en M12.8a-3 (§5.80) y `tecnico_grupo` se difirió a M11.3 (§5.79 deroga la ubicación de §5.72). **De M12.8b** ya están hechos M12.8b-1 (`esquema-datos-v2.md` a documento v3, §5.81), **M12.8b-1b** (la sección HCE-PAI del esquema — esta sesión) y M12.8b-2 (sincronización de prosa); **queda M12.8b-3** (el pase de vocabulario §5.75/§5.76), más el resto de M12.8 (seed de **catálogos** desde el JSON del prototipo, tests, docs — **no** el seed espejo, que es M11.5). **M11.3 ya tiene su reconocimiento R0-style hecho (R1, PARTE B de esta sesión).** ⚠️ **La §13 (bitácora) se mudó a `docs/bitacora.md` el 2026-09-09 (§5.84)**; en este archivo quedó un stub. 🆕 **M12.6 (HCE-PAI) se cerró el 2026-09-02 en modo SOLO ESQUEMA**: §5.54 reencuadró el bloqueo de §5.28 —de las 13 secciones del Manual que se daban por faltantes, **11 estaban en el `const MANUAL` del prototipo** y el Anexo A resultó ser material de M11.3, no de esquema— y quedan **§4 y §8 sin identificar**, anotadas en `puntos-a-validar.md` §1.16. **Ningún guard: los guards son M11.3.** El orden **M12.4 → M12.6** ya se cumplió (§5.23); **M12.6 arranca con §5.22 y §5.26 ya decididas, y ahora también con §5.50**. 🆕 **M12.5 (HCE-INC) se cerró el 2026-08-26** con tres decisiones nuevas: **§5.50 (J1)** cómo se lee una fuente que es a la vez especificación y demo —la regla que faltaba después de §5.37—, **§5.51 (J2)** el estado de inclusión es **continuo, no anual**, y **§5.52 (J3)** `inclusion.centro` es **texto, no FK**. ⚠️ **El backend estuvo quieto entre el 2026-08-15 y el 2026-08-26** (R0, D-11): lo que se había movido era documentación, demo y herramientas. **M11.3–M11.6 se retoman al cerrar M12.** Ningún módulo tiene dueño exclusivo (§5.6): se avisa qué se toma y se trabaja. 🆕 **La reunión con IPPU del 2026-08-21 está registrada desde el 2026-08-26** en `docs/notas/respuestas-reunion-ippu-2026-08-21.md` y en **§5.36–§5.49 (serie I)**. Lo más grande que cambió: **el IDEA es ANUAL** (§5.36 — cae la «línea base única» del Documento Técnico), **los nombres de los grupos por color eran datos de demostración** (§5.37), **el consentimiento no traba el flujo** (§5.38, ⚠️ de segunda mano), **guardar no requiere autorización pero compartir sí** (§5.39/§5.45) y **hay que modelar usuarios, roles y asignación técnico↔grupo** (§5.41). ⚠️ **Nada de eso está implementado:** son decisiones escritas; el trabajo está en §6.
> - **Fuente normativa vigente (orden de precedencia, §5.10):** **0.** las **decisiones de este archivo §5** y el **acta de la reunión con IPPU del 2026-08-26** (`respuestas-reunion-ippu-2026-08-21.md`) — todo documento normativo anterior a esa fecha cede ante ellas donde haya contradicción · **1.** Manual de Procedimientos v1.0 + **Prototipo v4** (IPPU, ago-2026) → `docs/markdown/prototipo-v4-referencia.md` + `docs/prototipo-v4/` · **1-bis.** `docs/markdown/protocolo-acceso-confidencialidad-resguardo-hce.md` (Protocolo institucional de acceso/confidencialidad/resguardo de la HC — matriz de roles §5, procedimientos de divulgación §6, trazabilidad §8, Anexo II acuerdo de confidencialidad; ingresado el 2026-09-03 · **anterior al acta**, autoritativo para lo que el acta no tocó) · **2.** `docs/markdown/1_documento-tecnico-utec-lidia.md` (Doc. Técnico IPPU v1.0, jul-2026) · **3.** presentación 13.05.2026. **En conflicto, gana el de más arriba.** Planes de ronda: `docs/planes/PLAN-modular-adaptacion-HCE-2026-07.md` (M0–M11) y `PLAN-M12-absorcion-prototipo-v4-2026-08.md` (M12, vigente). Referencia previa de UX/reglas: `docs/fuentes/HCE_IPPU_Prototipo_v1.html`.

---

## 0. Cómo retomar el trabajo (arranque rápido)
0. **`git pull`** antes de tocar nada, y avisar en el grupo qué módulo tomás (§12).
1. Terminal → `cd` a la carpeta del repo → `claude`.
2. Leer este `handoff.md` y luego `CLAUDE.md` (ambos versionados: los tenés al clonar).
3. Toda la documentación del proyecto está convertida a Markdown (legible y citable) en **`docs/markdown/`**.
   Los originales (PDF/PPTX/DOCX/XLSX) están en **`docs/fuentes/`**.
4. La demo (front) de la L1 está en **`implementacion/L1-hce-idea/demo/index.html`** (abrir en navegador, sin servidor).
   Desde 2026-08-07 está **modularizada**: `index.html` + `css/estilos.css` + `js/*.js` (**14** módulos desde el merge de F1, ver §5.5 y §5.33).
5. El **backend** está en **`implementacion/L1-hce-idea/backend/`** (ver su `README.md`). Correr: **`docker compose up -d`** → `.venv\Scripts\Activate.ps1` → `alembic upgrade head` → `python -m app.seed_catalogos` → `uvicorn app.main:app --reload` (docs en `/docs`). Tests: `pytest -q` — **una corrida válida es `432 passed, 0 skipped`**; si el contenedor no está arriba, si la base está vacía o si no está en el head, `pytest` **aborta con exit 1** y te dice el comando (guardia de sesión en `tests/conftest.py`, 2026-08-15). Antes se salteaba en silencio y devolvía **exit 0** con la mitad de los tests sin correr.
6. **El esquema vigente es `backend/docs/esquema-datos-v2.md`** — es el que se implementa desde M11 y **la única versión citable**. ⚠️ **Corregido el 2026-08-20 (§5.29):** este punto decía que «la versión citable para todos es `backend/docs/esquema-datos.md`», que era el esquema **v1**, del backend **retirado entero en M11.2**; mandaba a Samuel y Victor a citar un modelo muerto. Ese archivo y `ejemplos-endpoints.md` se borraron. El **diagrama ER interactivo** del v1 sigue existiendo como Artifact (https://claude.ai/code/artifact/0f0d9484-aa6a-437b-9608-4499ab0ef5b2) pero es **privado de la cuenta de Lucas** y describe 18 tablas de un esquema que ya no rige: no es referencia para nadie. Si alguna vez hace falta un ER del v2, se genera de nuevo.

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
  Adolescentes (§5.61; ⚠️ el último podría ser el servicio de Taller Terapéutico de Fase 2 y no un grupo,
  `preguntas-ippu.md` A5). ~40 expedientes activos en la HCE. **14 talleres especializados** (§5.14).
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

## 6. Pendientes / próximos pasos (sugeridos)

> ### 🛑 DECIDIDO, SIN IMPLEMENTAR — decisiones de §5 que la base de datos contradice hoy
>
> **Qué es esta lista y por qué existe** (2026-08-26, sesión de higiene). Una decisión escrita en §5 rige
> desde que se firma (§12.6), pero **el esquema puede seguir diciendo lo contrario durante semanas**. Esa
> ventana no está anotada en ningún lado: §5 dice qué se decidió y los bloques de arriba dicen qué falta
> hacer, pero **nada dice «el código todavía afirma lo contrario de esto»**. Se abre esta lista para que
> ninguna de las dos se pierda de vista, y con una regla: **una entrada sale de acá cuando la base deja de
> contradecir la decisión, no cuando alguien la mira.**
>
> - [ ] **I1 · El IDEA es ANUAL** (§5.36) — **la tabla `idea` no tiene columna `anio`.** La decisión está
>   firmada desde el 2026-08-26 y el modelo sigue siendo el de la línea base única del Documento Técnico.
>   **La puerta está antes de M11.3** (§5.35), no antes de M12.5 ni de M12.6. **El costo está medido dos
>   veces y coincide** (§5.31 el 20/08 · R0 el 26/08): **puramente aditivo** — `idea` ya es 1:N
>   (`ix_idea_hce_id … unique=False`), **0 FKs** a reconectar, **0 tests rotos** con `anio` nullable, y el
>   patrón `UNIQUE(hce_id, anio)` ya se usa tres veces en el esquema. ⚠️ **Lo caro no es la columna: es el
>   selector de año en la demo** (`nna.flujo.lb` es un objeto único, ~18 usos en 6 módulos) y **la regla de
>   cuál IDEA rige**, que hoy vive en prosa como «la de mayor `fecha_consenso`» (`app/models/modulos.py:219`)
>   y con una por año deja de ser la misma pregunta.
> - [x] ~~**I2 · Los nombres reales de los grupos** (§5.37)~~ → **RESUELTO en M12.8a-1 (2026-09-03).** El
>   seed planta los **cinco** reales (Inicial · Escolares · Preadolescentes · Adolescentes · Taller de
>   Adolescentes) por la vía sancionada —`GRUPOS` en el generador + regeneración de
>   `catalogos_iniciales.json`—; `taller.grupos_orientados` sigue vacío y su dominio queda con esos cinco.
>   ⚠️ **Sigue abierto, en la otra lista:** crear/renombrar grupos **desde la app** (`puntos-a-validar.md`
>   §2.8), y si «Taller de Adolescentes» es el servicio de Taller Terapéutico y no un grupo (pregunta A5
>   de `docs/notas/preguntas-ippu.md`).
> - [x] ~~**I7 · Se retira la sección VII del PAI (FODA)** (§5.42, ratificado por **§5.59 / L6**)~~ →
>   **RESUELTO en M12.8a-1 (2026-09-03).** `fort`, `oport`, `debil`, `amen` salieron de `app/models/pai.py`
>   y de la migración; la cifra «campos propios» bajó de 43 a **39** en `CLAUDE.md`, el bloque «Qué se
>   hizo» de M12.6 y `tests/test_m12_pai.py`. Queda un comentario en el lugar de la sección para que no se
>   reincorpore sin cruzar la decisión.
>
> ⚠️ **La entrada que queda (I1) tiene su trabajo detallado en los bloques de abajo.** Acá no se duplica el
> plan: se registra que **hoy la base afirma lo contrario de una decisión firmada**, que es lo que se pierde.

> ### 🆕 Pendientes abiertos por la reunión con IPPU del 2026-08-21 (registrada el 2026-08-26, §5.36–§5.49)
>
> **Ninguno de estos existía antes de la reunión. Todos tienen decisión escrita detrás y ninguno tiene
> dueño.** El detalle de cada uno está en `docs/notas/puntos-a-validar.md`.
>
> - [ ] ⚠️ **Crear grupos desde la aplicación — pasó de hueco anotado a BLOQUEANTE** (§5.37 / I2 ·
>   `puntos-a-validar.md` §2.8). **Los cuatro nombres por color están mal**: los grupos reales de IPPU son
>   **Inicial · Escolares · Preadolescentes · Adolescentes · Taller de Adolescentes**, y **ADMIN los crea
>   cuando hace falta**. Hoy **no existe endpoint, servicio, script ni pantalla que cree un grupo** — el
>   único camino es el seed, que además es *insert-only* sobre `grupo`. **Corregir los nombres es
>   exactamente la operación que no se puede hacer.** ⚠️ Y son **cinco**, no cuatro: cambia también el
>   dominio de `taller.grupos_orientados` (M12.3), que es un array de nombres de grupo.
> - [ ] **Modelar usuarios, roles y asignación técnico↔grupo** (§5.41 / I6 · **§5.72** · **§5.79** ·
>   `puntos-a-validar.md` §2.11). Un usuario por técnico · el técnico ve sólo sus grupos · ADMIN ve todo,
>   asigna y crea otros ADMIN. ⚠️ **§5.79 derogó la ubicación de §5.72:** la tabla **`tecnico_grupo`** N:M
>   con vigencias (aditiva, al lado de `tecnico1_id`/`tecnico2_id`) **NO entra en M12.8a — se construye en
>   M11.3**, junto con el servicio de asignación que la va a leer; §5.79 deroga la *ubicación*, no la
>   decisión de fondo. **`grupo.tecnico?_rol` ya existen** y no se agregan. **Queda también para M11.3 /
>   Fase 4:** el **vocabulario de roles** (lista de 5 propuesta en §5.72, a confirmar por Lucas — no va
>   todavía a un CHECK), la **conflación `admin` ↔ «dirección no técnica»** del Protocolo, y toda la
>   **matriz de permisos**. Con `tecnico_grupo` fuera de M12.8a, esta pieza ya **no agranda M12.8**.
> - [x] ~~**DIVULGACIÓN — DECIDIDA Y AGENDADA a M12.8a** (§5.39 / I4, §5.45 / I10, **§5.71** ·
>   `puntos-a-validar.md` §2.12)~~ → **RESUELTO en M12.8a-3 (2026-09-03, §5.80).** La tabla
>   **`divulgacion`** se construyó en `app/models/divulgacion.py` (15 columnas derivadas del Protocolo
>   §6.2–6.7 y la matriz §5, append-only por postura, sin seed), migración `559b1a79cb77`. ⚠️ **Sigue
>   abierto, y §5.80 no lo toca:** los guards (quién puede divulgar, si el consentimiento habilita, los dos
>   CHECK cruzados diferidos), el **flujo** de compartición y la compuerta «revisado por dirección →
>   entregado» de §5.40 son **M11.3 / M11.4** (§5.71 los difiere), junto con `puntos-a-validar.md` §2.13.
>   Cuatro afirmaciones de IPPU caen sobre este concepto (fotos · confidencialidad · revisión de informes ·
>   resumen y no expediente).
> - [ ] **Estado de revisión de los informes + área de generación configurable** (§5.40 / I5 ·
>   `puntos-a-validar.md` §2.13). **Todo informe lo revisa la dirección antes de entregarse**: es un
>   **estado de flujo**, no un permiso de impresión. Y lo que pidieron es un **área configurable**, no un
>   catálogo cerrado de tipos. Hoy no existe ningún estado de aprobación, ni destinatario, ni generación de
>   PDF. **El informe de cierre anual no cambia.**
> - [ ] **Indicador de ateneos: 8 al año, ≥2 por grupo** (§5.46 / I11 · `puntos-a-validar.md` §2.14). Para
>   el tablero de M11.3/M11.4. Hoy **nada los cuenta**. ⚠️ Definir **qué año** se cuenta: el correlativo es
>   del año de registración y el filtro va por la fecha del hecho.
> - [ ] **Ateneos — dos faltantes concretos** (§5.46 / I11): un campo explícito de **observaciones** (hoy
>   no existe) y **adjuntos de documentos, PPTX en particular** (hoy no hay ninguna validación de tipo de
>   archivo). «Agregar acuerdo» ya existe y se queda.
> - [ ] **Guía de trámites para las familias — FALTA DUEÑO** (§5.49 / I14). BPS, MIDES, INAU; el trámite
>   más consultado es **AYEX**; **va junto con los informes**. Es contenido, no modelo — pero hay que
>   decidir **si el texto se edita desde la aplicación o es fijo**, y **eso no lo puede decidir quien
>   escribe el código solo**.
> - [x] ~~⚠️ **Pasar estas respuestas al Google Doc del equipo — a mano, y lo tiene que hacer una
>   persona.**~~ → **CERRADO el 2026-08-26 por §5.53 (K1): el Google Doc está VACÍO** —lo confirmó Lucas
>   mirándolo— y **se retira su designación como artefacto autoritativo. El registro es el repo.** No se
>   cierra por haberse hecho: se cierra **porque no hay destino**. `docs/notas/consulta-a-ippu.md` conserva
>   las 25 respuestas bajo su `> _Respuesta:_` y sigue siendo el snapshot de lo enviado el 19/08.
> - [ ] ⚠️ **Re-confirmar con IPPU el punto de segunda mano: el consentimiento no traba el flujo**
>   (§5.38 / I3). Es el **único** ítem de la serie I que no se escuchó en la reunión. **Primero en la
>   lista del próximo contacto.**
> - [ ] **Llevar al próximo contacto los 12 bloques que quedaron SIN respuesta** — la lista completa está
>   en `docs/notas/respuestas-reunion-ippu-2026-08-21.md` §16. Los tres que más cuestan: **2.a**
>   (¿quieren registrar participación por taller? — decide el alcance de M12.6), **8.a/8.b/8.c** (la
>   planilla de Inclusión, los 7 estados y si el estado se anualiza — **M12.5 arranca sin eso**) y
>   **13.a** (qué se hace con los puntajes de la guía con corrimiento, que **ahora migran igual**).
> - [ ] **Preguntar cuánto del Prototipo v4 es material de IPPU y cuánto es relleno generado** (§5.37).
>   Los cuatro nombres de grupo por color **estaban adentro del Prototipo v4** y no son de IPPU: si eso
>   pasó una vez, la **fuente normativa de precedencia 1** (§5.10) necesita el mismo escrutinio que le
>   hicimos al cuestionario.
>
> ### 🆕 Abiertos / movidos por la sesión L9 (2026-09-03, §5.70–§5.78)
>
> - [ ] **Pase mecánico de vocabulario: «fase» y numeración de líneas** (§5.75 / §2.3 y §5.76 / §2.4). Las
>   dos decisiones están cerradas; falta **renombrar las apariciones en los documentos vivos** — un término
>   por sentido (**etapa** backend · **etapa del convenio** · **línea** · **ronda** · **fase** sólo para el
>   Documento Técnico) y citar siempre «L1 = HCE». Conteo por archivo en §2.3. **No** se tocan las fuentes
>   (`Documento de trabajo.md`, cuestionario Q47, `docs/prompts/*`, `relevamiento-*`): se anota la
>   divergencia. Es un pase aparte, sin dueño.
> - [ ] **Administración de los catálogos de talleres y de centros educativos** (`puntos-a-validar.md` §2.9).
>   Hoy vivía sólo dentro de §2.9 y se perdía. D5 (§5.14) y M12.5 dejaron `taller` (14 filas, sin gestión) y
>   `catalogo_centro_educativo` (0 filas) **sin endpoint ni pantalla** para alta / orden / orientación a
>   grupos / retiro. **Misma pantalla y mismo tipo de trabajo que el alta de grupos (§2.8)** → **M11.3 /
>   M11.4**, con registro en HCE-LOG y `hce_id NULL`.
> - [ ] **Registro de accesos con motivo (HCE-LOG)** (`puntos-a-validar.md` §2.17, abierto por el Protocolo).
>   `auditoria` registra **cambios** (`campo`/`valor_ant`/`valor_nuevo`); el Protocolo §8 exige registrar
>   **lecturas con motivo y firma**, y §7 el registro automático de accesos con credencial individual. El
>   `tipo='acceso'` está en el CHECK pero **no hay `motivo`, ni firma, ni nada que lo escriba**. Requisito
>   **legal**. Condiciona **M11.3** (guards que escriben `auditoria`) y **Fase 4** (login). No se diseña.
> - [ ] **Guards del acceso al ateneo** (`puntos-a-validar.md` §2.16 cerrado por §5.70 → residuo M11.3):
>   (a) visibilidad del ateneo clínico = participantes documentados + equipo tratante + dirección/coord.;
>   (b) el endpoint de ateneos enmascara a «lo pertinente» según quién consulta; (c) `ateneo.participantes`
>   pasa de `Text` a **relación** (`ateneo_participante` N:M) — necesita el modelo de usuarios (§5.72)
>   debajo. **No se toca `ateneo.participantes` hasta M11.3.**
>
> ### 📌 Pendientes abiertos por la Fase B del 2026-08-20 (F1 aterrizó — estos ya no esperan a nada)
>
> **Los que decían «cuando aterrice F1» y ahora se deben por nombre:**
> - [ ] **Partir `handoff.md` — mitad hecha, la otra mitad medida.**
>   - ✅ **§13 (la bitácora) se mudó a `docs/bitacora.md` el 2026-09-09** (M12.8b-4, §5.84). Verificada
>     **byte-idéntica** (mismo sha256, 2.014 líneas / 266.246 bytes), con stub de redirección acá.
>     `handoff.md` pasó de **5.081 → 3.139 líneas (−38 %)** · 537 KB → 278 KB (−48 %).
>   - **¿Se muda también §5? — precio medido en M12.8b-4, sin decidir nada.**
>     - `handoff.md` sin §13 son **3.139 líneas**; de eso **§5 = 2.411 (77 %)**, §6 = 441 (14 %), estado
>       (§0–§4, §7–§12) + stub = 281 (9 %). Sacar §5 dejaría `handoff.md` en **~700 líneas**.
>     - Citas que **nombran el archivo** pegado a `§5.NN` (`handoff.md §5.NN`, con o sin backtick, hasta
>       4 separadores): **181** fuera de `docs/prompts/` (+6 dentro, históricas). `puntos-a-validar.md` 29
>       · `preguntas-ippu.md` 21 · `esquema-datos-v2.md` 13 · `estructura-repositorio.md` 13 · `PLAN-M12`
>       11 · `consulta-a-ippu.md` 10 · `CLAUDE.md` 10 · `README.md` 6 · `constantes.py` 5 ·
>       `backend/README.md` 5 · `generar_catalogos_backend.py` 5 · `catalogos.py` 4 · resto ≤3. En
>       `app/` + `tests/`: **~29**.
>     - Total `§5.NN` en el repo: **1.886**. Las otras **~1.705 (90 %)** son la forma escueta «§5.NN» sin
>       ruta: **no se rompen** vivan donde vivan las decisiones. (Medido con `grep -rhoE` sobre `§5\.[0-9]+`
>       menos `node_modules`/`graphify-out`; las filename-adjacentes, con `handoff(\.md)?` seguido de hasta
>       4 separadores y `§5\.[0-9]+`.)
>     - Con la **misma técnica del stub** (conservar `## 5. Decisiones tomadas` como redirección) las 181
>       tampoco se rompen: el costo mecánico baja a **un stub + una línea** en
>       `herramientas/verificar_estado.py:90` — `FIN_DE_LO_VIGENTE = re.compile(r"^##\s*5\.\s", …)` pasaría
>       a `r"^##\s*6\.\s"` para que el corte de «lo vigente» sea §6. **`verificar_estado.py:59` es el
>       único lector programático de `handoff.md`**; nada más en `app/`, `tests/` ni `herramientas/` lo abre.
>     - Lo no-mecánico: §5 es append-only y lo consultan las sesiones para la regla anti-contradicción
>       (§12.6). Sacarlo de «el archivo que se lee primero» es decisión de Lucas, no medición.
>   - **Archivar la cola resuelta de §6 — medido en M12.8b-1b (2026-09-10), sin mover nada.** Lucas aprobó
>     archivar la cola `[x]` de §6 **a condición de que no cause rework**; esta medición es esa condición.
>     - §6 son **441 líneas** (2523–2963). Checkboxes: **40 abiertos `[ ]` / 40 resueltos `[x]`** (a
>       cualquier indentación). El grupo resuelto ocupa **≈173 líneas ≈ 39 %** de §6 (asignando cada línea
>       al último bullet abierto hasta el siguiente bullet o encabezado). Coincide con «40 / 40 y ~40 % de
>       líneas» de la última medición.
>     - **Ningún archivo de fuera de §6 cita un bullet resuelto por su posición.** `grep` de
>       `handoff.md §6` / `§6` sobre `docs/` + `app/` + `tests/` + `demo/` + `CLAUDE.md` + `docs/bitacora.md`:
>       todas las citas son (a) punteros genéricos «ver §6 para el estado» / «§6 fija el procedimiento», o
>       (b) punteros a bullets **abiertos** — **I1** (`esquema-datos-v2.md:73,817`, `README.md:109`),
>       A3/C8/C9/C10 (`preguntas-ippu.md:302`). La única cita que **toca** un bullet resuelto es
>       `relevamiento-estado-2026-08-26.md:1260` (D-10 cita la entrada F1-nav) — y R0 es un registro
>       congelado que ya la da por resuelta; moverla no lo invalida.
>     - `verificar_estado.py` **no lee §6**: corta `handoff.md` en `## 5.` (`FIN_DE_LO_VIGENTE`,
>       `verificar_estado.py:90`) y sólo compara su cabecera (`SOLO_CABECERA`). Archivar la cola de §6 no
>       lo afecta.
>     - **La técnica del stub de M12.8b-4 cubre el caso** —y apenas hace falta—: como nadie cita un bullet
>       resuelto por posición, un puntero de una línea donde estaba la cola alcanza; las citas genéricas a
>       «§6 = pendientes» siguen resolviendo porque §6 sigue existiendo con sus 40 abiertos.
>     - **Rework de archivar la cola resuelta: cero.** Si es una sesión o tres lo decide Lucas.
> - [ ] **Cabecera de estado en `puntos-a-validar.md`**, como la que ganó `consulta-a-ippu.md`: qué es,
>   qué no es, y que **ya no es «el mismo contenido»** que la consulta.
> - [x] ~~**`puntos-a-validar.md` §2.1 — la deuda declarada de §5.31.** El costo medido del IDEA anual~~
>   → **HECHO** (2026-08-26). El número está escrito en `puntos-a-validar.md` §2.1, medido dos veces
>   (§5.31 el 20/08 y R0 el 26/08) y coincidente: **aditivo · 1 tabla de 38 · 0 FKs · 0 tests rotos si
>   `anio` es nullable**; la parte cara es el **selector de año en la demo**. ⚠️ **Lo que sigue abierto de
>   §2.1 es otra cosa:** ratificar por escrito la *decisión de procedimiento* de haber arrancado M11 sin
>   cruzar su puerta. Eso lo ratifica el equipo, no la reunión (§5.35).
> - [x] ~~Mover el prompt de F1 a `docs/prompts/`~~ → **HECHO** (`281405b`).
> - [ ] **Plegar `docs/notas/respuestas-reunion-ippu-2026-08-21.md`** — ⚠️ **3 de 4 pasos HECHOS el
>   2026-08-26; el archivo NO se borra.** Hechos: los «sí» pasaron a `puntos-a-validar.md` con fecha, los
>   «no» abrieron entradas en §5 (serie **I**, §5.36–§5.49) y las respuestas se escribieron bajo su
>   `> _Respuesta:_` en `consulta-a-ippu.md`. ⚠️ **El cuarto —el Google Doc del equipo— quedó cumplido
>   el 2026-08-26 por §5.53 (K1): el Doc está vacío y se retiró su designación.** Con eso **los cuatro
>   pasos están**, y aun así **el archivo NO se borra**, por la razón que este pendiente ya daba y que
>   nunca dependió del Doc: es lo único que conserva **las dos correcciones de acta** y **los 12 bloques
>   que quedaron sin respuesta** (§16 del propio archivo).
>
> **Nuevos de esta noche:**
> - [ ] ⚠️ **El harness de verificación no corre de punta a punta.** `fingerprint.js:82` recorre
>   `['inicio','pendientes','analitica','grupos','usuarios']` y **`usuarios` ya no es un `.navitem`**
>   (B2 lo sacó de la barra): el `page.click()` **tira** y la corrida aborta. Faltan además `inclusion`
>   y `ateneos`. Es barato de arreglar; lo caro es correrlo sin saberlo. **Decidido que el procedimiento
>   de dos worktrees queda documentado en vez de commitear un baseline** (§13, Fase B): si se prefiere
>   un baseline versionado, hay que sacar `*.json` del `.gitignore` y **fijar el escenario de la Parte
>   C**, y eso es una decisión, no una tarea.
>   - ⚠️ **Medido el 2026-09-09 (M12.8b-2b):** el *bloqueo de selector* de arriba **ya no aplica.**
>     `c1ca4eb` (2026-08-21) reemplazó el `.navitem`-para-todo por un mapa `VISTAS` con las **7 vistas**
>     (`usuarios` por `.userchip`; `inclusion` y `ateneos` incluidas) y dos guardas que fallan nombrando
>     la vista; el mensaje del commit reporta «42 pasos, exit 0». Los `*.json` **ya están versionados**
>     (`baseline.json` · `mut41.json` · `mut42.json`, §5.69) y Playwright está instalado local (gitignore).
>     Lo que **queda abierto** es correr el harness contra la demo post-F1, confirmar que `baseline.json`
>     es la foto post-F1 y **fijar el escenario de la Parte C** — la decisión que este pendiente ya pedía.
> - [x] ~~⚠️ **`grupo` — mostrado y no modelado, y mergear F1 no lo modeló.** `responsable1`,~~
>   ~~`responsable2` y `tecnicosAutorizados` viven en la demo y **§5.18 no los tiene**. Si IPPU confirma~~
>   ~~mañana, eso **no valida un supuesto: abre trabajo de backend**. Va a lista de reconciliación.~~
>   → **CONTESTADO el 2026-08-21, y salió como este pendiente predijo: abre trabajo de backend.**
>   La decisión está en **§5.41 (I6)** y el pendiente vivo, arriba, en el bloque de la reunión.
> - [ ] **`verificar_estado.py` — chequeo de afirmaciones de prosa** (§5.34): contar las secciones
>   `^### N.N` de los archivos de `docs/notas/` y compararlas con lo que §6 afirma sobre ellos.
>   **Después de la reunión**, no antes. ⚠️ **Lección de M12.8b-1:** la ocurrencia de «línea base única»
>   que casi se pasó por alto estaba **partida en dos líneas**, así que un grep por línea es ciego a las
>   frases envueltas — el chequeo tiene que **normalizar los espacios en blanco** (unir el texto en un solo
>   flujo) antes de buscar.
> - [x] ~~**Pegar el link del Google Doc** en la cabecera de `docs/notas/consulta-a-ippu.md`.~~ →
>   **CERRADO el 2026-08-26 por §5.53 (K1): no hay link que pegar.** ⚠️ **Lo que NO se cierra es la
>   lección de §5.34** — el riesgo de tener media documentación fuera del alcance de cualquier script del
>   repo sigue existiendo, y su arreglo candidato (que `verificar_estado.py` compare prosa) sigue abierto
>   más abajo en esta misma sección.
> - [ ] **Aclararle a IPPU** que la intro del cuestionario apunta a una pregunta que no quedó en el
>   documento (agenda §1). Treinta segundos, dicho de frente.

- [ ] ⚠️ **Tres puntos donde la capa de presentación se desincronizó de una decisión ya tomada —**
  **próxima sesión de demo, antes que cualquier otra cosa (verificados contra un harness que ya funciona,
  no a ciegas):**
  1. **`ui-core.js:257-268` pinta el total del IDEA en vivo con los cortes DEROGADOS.** No es un problema
     de color, es una **vista en vivo que contradice una decisión de §5 ya ratificada**: usa `total>=65 →
     --bad`, `total>=33 → --warn`, si no `--ok` — el modelo de **3 tramos** que **§5.13 (D4) declaró
     derogado el 2026-08-14** en favor de `IDEA_BANDAS` (`catalogos.js:16-23`, 6 bandas: 0–15/16–30/
     31–55/56–75/76–90/91–96, con sus propios colores ya asignados por banda). Nadie tocó
     `ui-core.js:257-268` cuando D4 landeó. **Medido, no estimado — los dos modelos disienten en 13 de
     los 97 totales posibles (0–96):** en **31 y 32** el indicador en vivo muestra *"Espectro leve"*
     (`--ok`) cuando la banda ratificada dice **"Leve a moderado"** (`--warn`) — subestima; en **65 a
     75** (11 puntajes) muestra *"Espectro severo"* (`--bad`) cuando la banda ratificada dice
     **"Moderado"** (`--warn`, no llega a banda 5 hasta 76) — **sobreestima**. Un técnico cargando el
     formulario en vivo ve un nivel de severidad distinto del que el propio sistema declara oficial
     apenas guarda. **No se toca ahora** (§5 de esta sesión lo prohíbe): es el primer cambio de la
     próxima ronda de demo, para verificarlo contra el harness ya arreglado.
  2. **`renderUsuario()` (`grupos-usuario.js:317`) duplica crumbs/título** — mismo defecto que
     `8fbb629` corrigió en Grupos (cabecera estática de `index.html` + cabecera propia del `render()`),
     prometido para "la próxima" en el mensaje de ese commit y **nunca llegó a escribirse acá** — se
     escribe ahora para que no se pierda una segunda vez.
  3. **El detalle de Ateneos (`ateneos.js:416`) duplica título** — el `h1` del registro contra el
     `h1.pagetitle` estático de `index.html`, mismo defecto, mismo commit que lo prometió sin cumplirlo.
  - **Por qué van juntos:** los tres son la misma familia — la presentación quedó un paso atrás de una
    decisión ya tomada (§5.13 en el primero, la limpieza de `8fbb629` en los otros dos) — y **son
    exactamente el primer cambio que corresponde verificar contra el harness recién arreglado**, no
    contra la pantalla a ojo. **No se tocan en la sesión que escribe esto** (alcance explícito: sólo mide
    y documenta). Borrador de la regla de dominio que motivó encontrar el punto 1:
    `docs/notas/borrador-color-y-significado-clinico.md` (sin firmar — ver banner del archivo).

- [x] ~~Ronda M0–M10 (adaptar la demo al Doc. Técnico)~~ → **COMPLETA** (2026-07-30, demo v4.0). Ver bitácora.
- [x] ~~**Validar la demo v4.0 con IPPU** (puerta de entrada a M11 según el plan; en especial el cambio de IDEA a línea base única).~~ → **La reunión fue el 2026-08-21** y contestó lo que hacía a este pendiente: **el IDEA es ANUAL** (§5.36) — o sea que **el cambio a línea base única estaba equivocado**. ⚠️ **Lo que NO quedó validado** sigue anotado: 6 bandas del IDEA, 7 estados de inclusión, lista de talleres del año, anualización del estado de inclusión (ver `respuestas-reunion-ippu-2026-08-21.md` §16). Ritmo sugerido por el Doc. Técnico §12: revisiones quincenales.
- [x] ~~**F1-nav · ajustes de navegación del frontend · rama `demo/F1-navegacion`** — (a) push y (d) merge/PR~~ → **RESUELTOS · medido el 2026-09-09 (sesión M12.8b-2b).** Cuatro rondas sobre esa rama (**F1-nav** · **F1-nav2** · **F1-nav3** `648cb04` · **F1-nav4** `4f29bc9`), 2026-08-16 → 2026-08-19, ver §13. **La rama ya no existe** —ni local, ni en `gitlab`, ni en `origin`—: se **mergeó a `main` el 2026-08-20 22:34** por el merge `d94b102` (2 padres; «merge: integrar demo/F1-navegacion a main (restyle + B1/B2 + Ateneos + Inclusión)»), presente en los tres (`main`, `gitlab/main`, `origin/main`); **0 commits que la rama tuviera y `main` no**. Los `4f29bc9` · `230b4c0` (merge de `main`) · `554ff37` que la nota original (2026-08-19) daba por «sin pushear» están **todos en `main`**. El «⚠️ CON 4 COMMITS SIN PUSHEAR» y la duda «a qué remotos» se resolvieron **al día siguiente de escribirse** y nadie volvió a mirar en tres semanas. Este clone tiene **los dos remotos** (`gitlab` + `origin`), no sólo `origin`.
- [ ] **F1-nav · lo que quedó abierto → pasa a la próxima ronda de demo:**
  - **(b) verificación visual en navegador** — ninguna de las 4 rondas la hizo (Claude Code no controla browser): recorrer Analítica · Grupos · alta de NNA · expedientes · Inclusión · Ateneos.
  - **(c) re-baseline del fingerprint Playwright** (`demo/verificacion/`, §5.69). ⚠️ El *bloqueo de selector* que registra el pendiente «El harness de verificación no corre de punta a punta» de este mismo §6 —`fingerprint.js:82` asumía `.navitem` para `usuarios`— **ya está arreglado** por `c1ca4eb` (2026-08-21): el mapa `VISTAS` cubre las 7 vistas (`usuarios` por `.userchip`, `inclusion` y `ateneos` incluidas) con dos guardas que fallan **nombrando la vista**; el commit reporta «42 pasos, exit 0». Lo que **queda** de (c): correr el harness contra la demo post-F1 y decidir si el `baseline.json` versionado es la foto post-F1 + fijar el escenario de la Parte C (§5.69). Cruzar con ese pendiente de §6.
  - **Deudas que este bullet es el único registro de — se preservan:** cambio de responsable **sin HCE-LOG** (§5.18 y §7); **matriz de roles §21.1 pendiente con IPPU** (§7 F1-nav2); **formato oficial del Nº de HCE** por confirmar (§7 F1-nav2); de F1-nav4 — **ateneos sin HCE-LOG** (el de la demo es por NNA, un ateneo es transversal — misma limitación que §5.18) y **sin adjuntos** (HCE-DOC en la demo es por expediente; §5.25 ya modeló el XOR) y sin los guards de M11.3; **`.hint` no existe como clase global** (sólo `.field .hint`), Grupos e Inclusión la usan suelta y sin estilo, y F1-nav4 definió `.at-hint` propia. **Preguntas abiertas de las rondas:** «tutor» (2026-08-16, §7 — hoy absorbida en `preguntas-ippu.md` B5), permisos §21.1 y formato HC (2026-08-17, §7). F1-nav4 no abrió ninguna: sus dos divergencias ya están en `puntos-a-validar.md` §1.13 (prefijo único `AT-`) y §1.14 (correlativo de registración) y `consulta-a-ippu.md` **§3.12 y §3.13** las preguntan (eran §3.13/§3.14 antes de la revisión del equipo del 19/08 — §5.34).
  - ~~**F1-nav3 sin entrada de bitácora ni acá**~~ → **DECLARADA PERDIDA y cerrada por declaración** (2026-09-09, **§5.85**). Tres sesiones la reportaron abierta, la rama ya no existe, nadie la escribió: no se reconstruye por inferencia (§5.83). El registro que queda es el commit `648cb04` y este bullet.
- [x] **Cuatro inconsistencias detectadas en el cruce del 2026-08-19** → **LAS CUATRO CERRADAS** (1 y 2 en M12.8b-2, 3 y 4 en M12.8b-4 — ver sub-notas). El texto original y su rastreo se conservan abajo. Eran (ver §13, segunda entrada del día); ninguna bloqueaba, todas de documentación: **(1)** **§9 «Datos clave» quedó pre-M12** y se contradice con §5 y §7 de este mismo archivo — dice «**5 grupos**» (§5.18/D9: son **4** por color) y «**18 talleres**» (§7 Resueltas: son **14**, y el «8 vs 18» **era falso**); además `30 INAU + 108 BPS` = 138, no los «~120 NNA» de la misma línea. **(2)** Los conteos de `puntos-a-validar.md` que declara §6 están viejos: dice «9 puntos para IPPU / 8 para el equipo», el archivo tiene **14** y **10** (los 6 supuestos sí dan). **(3)** Dos preguntas de §7 que nunca entraron a `consulta-a-ippu.md`: **catálogo de centros educativos** —y P31 del cuestionario ya confirmó que el Área de Inclusión existe y está «todo en Drive, sin planilla estructurada», así que hay contexto para preguntarlo— y **«tutor»** (`puntos-a-validar.md` §2.10; está clasificada como punto de equipo, pero el fondo —si hay un referente por NNA distinto del técnico responsable— sólo lo contesta IPPU). **(4)** La deuda de registro de F1-nav3. Se dejaron anotadas y sin tocar porque §9 y los conteos son cambios sobre decisiones que §5 manda modificar por escrito, y la bitácora de F1-nav3 tiene dueño.
  - ⚠️ **Actualización M12.8b-2 (2026-09-09):** **(1) y (2) aplicadas.** §9 y §1 corregidos contra medición — 5 grupos con nombre (§5.61), 14 talleres (§5.14), y la discrepancia `30 + 108 = 138` vs «~120» marcada y ruteada a IPPU (`preguntas-ippu.md` C11); el conteo de `puntos-a-validar.md` que declara §6 se remidió (§1 = 17 subsecciones / 5 abiertas · §2 = 17 / 8 · §3 = 6 supuestos). El argumento de «§5 manda modificar por escrito» ya no aplica: §5.14 y §5.61 están escritas y esta sesión sólo las aplicó. **Siguen abiertas (3)** —las dos preguntas que nunca entraron a `consulta-a-ippu.md`; «tutor» ya está absorbido en `preguntas-ippu.md` B5— **y (4)** —la deuda de registro de F1-nav3—.
  - ⚠️ **Actualización M12.8b-2b (2026-09-09):** **(3) CERRADA — verificado dónde aterrizó cada pregunta.** «tutor» → `preguntas-ippu.md` **B5** (vía `puntos-a-validar.md` §2.11, que «absorbe §2.10»; la nota de deduplicación de B5 nombra «tutor» y lo unifica). Catálogo de centros educativos → `puntos-a-validar.md` **§2.9** (gestión del catálogo de centros junto con la de talleres → M11.3/M11.4) + **§5.52** (`inclusion.centro` es **texto, no FK**; el Prototipo v4 **no tiene** catálogo de centros → no hay nada normativo que sembrar) + `preguntas-ippu.md` **C3** (pedir la planilla del Área de Inclusión, de donde saldría el catálogo — `respuestas-reunion-ippu-2026-08-21.md` §16 lo dispara desde P31). `consulta-a-ippu.md` es snapshot y no se edita. **Queda sólo (4)** —la deuda de registro de F1-nav3, de quien la hizo—.
  - ⚠️ **Actualización M12.8b-4 (2026-09-09):** **(4) CERRADA por declaración — §5.85.** La deuda de registro de F1-nav3 se declara **PERDIDA**: nadie la escribió en tres semanas, la rama `demo/F1-navegacion` ya no existe, y un registro reconstruido por inferencia es peor que un hueco reconocido (§5.83). El registro que queda es el commit `648cb04` y el bullet de F1-nav de este §6. Con esto **las cuatro inconsistencias del 2026-08-19 están cerradas** (1 y 2 en M12.8b-2, 3 y 4 acá).
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
      - ~~**Ateneos clínicos y jornadas de capacitación** (vista transversal, no por NNA) — una sola
        entidad `DB.ateneos[]` con **4 tipos** (`AT_TIPOS`: Ateneo clínico · Ateneo de grupo · Ateneo
        institucional · Jornada de capacitación); correlativo `AT-2026-001`. Campos según tipo. Ver
        §5.25 y §5.26 del backend por convenciones de nomenclatura y XOR con HCE-DOC.~~
        → **HECHO en la demo** (F1-nav4, 2026-08-19, ver §13): `demo/js/ateneos.js` + vista
        `#view-ateneos` + panel en el expediente. Falta la parte de HCE-DOC (adjuntos por ateneo).
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
  - [ ] **M11.3** servicios/motor de flujo con guards (§4: secuencia, firma=bloqueo, **Δ sólo dentro del
    mismo instrumento** —reformulado por §5.36, no «Δ sólo B−A»—, baremo sólo desde `pct`, fotos §8.4,
    histórico inmutable, Anexo A, habilitación de §IX del PAI por tipo, «qué IDEA rige a la fecha») — **el
    sub-módulo con más contenido. Lo toma Lucas** (§5.67 / L14, 2026-09-03 — cierra `puntos-a-validar.md`
    §2.7).
    - [x] ~~⚠️ **Primera tarea de M11.3: un reconocimiento estilo R0 contra el código**~~ → **HECHO
      (2026-09-10, sesión M12.8b-1b · PARTE B) — `docs/notas/relevamiento-M11.3-2026-09-10.md` (R1).**
      Solo lectura, en BLOQUES, hallazgos numerados **R1-01…R1-10**. Medido: la capa de servicios sigue
      en cero (0 routers/schemas/services, sólo `/health`); **el bloque central de M11.3 es construible
      hoy** (secuencia, firma=bloqueo, validaciones §4.3, baremo desde `pct`, fotos §8.4, histórico
      inmutable, guard D7); lo bloqueado es periférico y agrupado — **Anexo A** (B1 / §1.16), **«qué IDEA
      rige»** (B2b + I1), **usuarios + `tecnico_grupo`** (B5 + B6), **informes + divulgación** (B7 + B11 +
      B12). Hallazgos que necesitan a Lucas: **R1-01** la regla del Δ está a medio reformular en
      `esquema-datos-v2.md` §4 y `backend/README.md:131` (§5.36 la cambió a «mismo instrumento», el
      documento se contradice) — prerrequisito de escribir ese guard; **R1-02** «qué IDEA rige» sólo en
      prosa (`modulos.py:228-233`) y para el modelo viejo; **R1-07** §2.8 (abrir año de grupos) **no**
      bloquea el arranque, es feature de M11.3/M11.4. **I1 re-medido:** backend aditivo (0 FK, 0 tests
      rotos); demo **17 usos `flujo.lb` en 6 módulos**. Recomendación (no decisión): I1 **antes** de
      M11.3, porque «qué IDEA rige» no es escribible sin `idea.anio`. Las 7 preguntas para Lucas están en
      el BLOQUE 6.4 del relevamiento.
  - [ ] **M11.4** routers · **M11.5** seed espejo de la demo + pytest (**forma ejecutable del criterio de
    aceptación** — §5.65 / L12: hoy §12-A vive sólo como prosa y el seed espejo no existe; usuario demo 1
    por API = IDEA 58 · PA 60 · PB 79 · Δ +19) · **M11.6** docs.
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
  - [x] ~~**M12.5** HCE-INC · Inclusión educativa y social~~ → **HECHO** (2026-08-26, Lucas).
        **42 tablas**: `inclusion` (ficha), `inclusion_bitacora` (gestiones) y **dos catálogos** —
        `estado_inclusion` (7 filas, con descripción y semáforo) y `catalogo_centro_educativo`
        (**0 filas, a propósito**). Los otros cuatro vocabularios del módulo (`INC_TIPOS`, `INC_TEMAS`,
        `INC_MEDIOS`, `INC_ROLES`) entraron como **constantes** con CHECK, no como catálogos: son listas
        planas sin atributos, y `INC_TEMAS` además es el **discriminador** de `sensible` — el mismo
        argumento con que `AT_TIPOS` es constante (M12.7). **`sensible` es derivado**
        (`tema == 'Clínica — sensible'`), con expresión SQL para que la Fase 4 pueda filtrar **en la
        base**; su docstring dice explícitamente que significa **restringido para COMPARTIR, no para
        guardar** (I4 · §5.39 / I10 · §5.45) y que **hoy es una clasificación sin efecto**, porque el
        modelo todavía no representa la divulgación. **Tres decisiones nuevas: §5.50** (regla de lectura
        de fuentes con demo adentro, **que M12.6 y M12.8 heredan**), **§5.51** (el estado es continuo, no
        anual — pregunta abierta a IPPU en `puntos-a-validar.md` §1.15) y **§5.52** (`centro` es texto,
        no FK — se suma a `puntos-a-validar.md` §2.9). **307 tests en verde, 0 salteados**, migración
        regenerada (`aa26917b6e76`). Ver bitácora §13.
  - [x] ~~**M12.6** HCE-PAI~~ — **HECHO el 2026-09-02, en modo SOLO ESQUEMA** (§5.54). **8 tablas**:
        `pai` (39 campos propios — eran 43 en M12.6; la sección VII/FODA salió en M12.8a, §5.59) +
        `pai_objetivo` · `pai_evaluacion_previa` · `pai_equipo` ·
        `pai_coordinacion` · `pai_taller` · `pai_prestacion` · `pai_circuito`. **50 tablas**, **389 tests**,
        migración `72b96030362d`. Decisiones **§5.55 (L2)** —los campos editables de las secciones I y II
        son columnas propias, la carga única es **por campo y no por sección**— y **§5.56 (L3)** —los tres
        vocabularios del PAI son **constante y no catálogo**, y lo dice el propio prototipo—. El test de
        participación que §5.21 traspasó desde M12.3 **quedó escrito**. Ver bitácora §13.
        ⚠️ **Lo que M12.6 NO hizo, a pesar de tenerlo asignado: los nombres reales de los grupos (I2).**
        Se sacó del alcance de M12.6 a propósito; **lo ejecutó M12.8a-1 (2026-09-03)** — el seed planta
        los cinco reales (§5.61). Queda sólo la creación/renombrado **desde la app**
        (`puntos-a-validar.md` §2.8).
  - [x] ~~**Corregir `docs/markdown/prototipo-v4-referencia.md:166`**~~ → **HECHO (2026-09-02, sesión L5).**
        La línea decía «las secciones I, II, VI, XI y XV … modelarlas como referencias»; ahora dice
        **VI, XI y XV**, y una nota ⚠️ remite a **§5.55 (L2)**: los siete campos editables de I y II
        (`ingresoIppu` + los seis de §II) son **columnas propias de `pai`**. Corregido contra la lista
        «Campos de cabecera (`p.pai`)» del mismo archivo, sin reinvestigar.
  - [ ] **M12.8** cierre: seed desde el JSON del prototipo, tests y docs. **Una sola persona.**
        ⚠️ Ya **no** es el único momento en que se toca la migración: desde la enmienda **§5.19**
        (2026-08-14) se regenera al cerrar **cada** sub-módulo, con el test de coincidencia en verde.
        - ⚠️ **El "seed" de M12.8 NO es el "seed espejo" de M11.5 — son dos artefactos distintos**
          (verificado contra `PLAN-M12` §M12.8 «Seed:» y §7, y `esquema-datos-v2.md:693`, en M12.8b-4).
          **M12.8** = el **seed de catálogos**: regenerar `app/data/catalogos_iniciales.json` desde
          `docs/prototipo-v4/prototipo-v4-catalogos.json` con `herramientas/generar_catalogos_backend.py`
          (pasar las secciones `DESDE_LA_DEMO` al prototipo y vaciar esa lista), respetando `solo_al_crear`.
          **M11.5** = el **seed clínico espejo**: NNA + evaluaciones IDEA/PA/PB que reproducen los
          arquetipos de la demo (8 NNA, §11; números 58 · 60 · 79 · Δ +19), y que es **la forma ejecutable
          del criterio §12-A** (§5.65). **No existe** (`app/` sólo tiene `seed_catalogos.py`). La cabecera
          y `CLAUDE.md` dicen «el resto de M12.8 (seed espejo, tests)» — es la palabra de M11.5 usada de
          más; lo que le queda a M12.8 es el seed de **catálogos** + tests + docs.
    - [x] ~~**M12.8b-1** — `backend/docs/esquema-datos-v2.md` al día, pase acotado~~ → **HECHO
          (2026-09-03/04, sesión M12.8b-1, solo documentación).** El documento pasa a **v3** (encabezado
          de versión + registro de cambios); **el archivo no se renombra** (§5.81). Puesto al día:
          cabecera y §3 al estado medido (**51 tablas**, migración `559b1a79cb77`), `grupo` con los cinco
          nombres reales (§5.61), `idea` descrito como está + aviso **I1 / §5.36**, `ateneo.observaciones`
          (§5.66), **`divulgacion`** completa en §2.3 + §1 + §4 (§5.80), esbozo de `tecnico_grupo` **NO
          construido** (§5.79), bloque §12-A reescrito en prosa (§5.65). ⚠️ El criterio §12-A: los cuatro
          números `IDEA 58 · PA 60 · PB 79 · Δ +19` **se verificaron presentes y consistentes** en
          `demo/js/flujo.js` (Arquetipo 1 / Martín / 102) — el checkpoint previo los había dado por
          ausentes por un grep incompleto; §5.65 y su premisa quedan intactas (ver bitácora §13).
    - [x] ~~**M12.8b-1b** — la **sección HCE-PAI** del documento del esquema~~ → **HECHO (2026-09-10,
          sesión M12.8b-1b, sólo documentación).** `esquema-datos-v2.md` §2.2 describe las **8 tablas /
          81 columnas** de `app/models/pai.py` (re-medidas contra `Base.metadata` **y** la migración
          `559b1a79cb77` — coinciden con el 8 / 81 de M12.8b-1), en el formato de HCE-INC/ateneos, con
          las decisiones §5.14, §5.20–§5.23, §5.26, §5.54–§5.57, §5.59 y los tres recuadros (NO GUARDS ·
          §4/§8 del Manual sin identificar · `pai_prestacion` como excepción a §5.22). **§1:** `pai` + 7
          hijas agregadas al ER; retirado el aviso «diagrama incompleto». **§4:** dos filas de guards de
          PAI (§IX por `tipo`, Anexo A — la 2.ª BLOQUEADA por fuera, §1.16 / B1). **Cabecera, registro de
          versiones (fila v3) y §3:** cobertura 43/51 → **51/51**. Se agregó también el **nombre oficial
          «Proyecto de Atención Integral»** (§5.42, `puntos-a-validar.md` §1.11). Commits `a93eea3` +
          `474d93b`.
    - [x] ~~**M12.8b-2** — pase mecánico de prosa en el resto de los documentos vivos (no toca el
          esquema)~~ → **HECHO (2026-09-09, sesión M12.8b-2, sólo documentación + 2 docstrings de `app/`).**
          Corregidos: `CLAUDE.md` (432 tests · «documento v3, el archivo no» · «Δ sólo dentro del mismo
          instrumento» + dueño de M11.3 y §12-A→M11.5), `handoff.md` §0.5 (307→432 — **no estaba en la
          lista de M12.8b-1**), §6 (bullet `tecnico_grupo` → §5.79 · bullet DIVULGACIÓN → RESUELTO §5.80),
          §9/§1 (14 talleres §5.14 · 5 grupos con nombre §5.61 · discrepancia 138 vs ~120 → `preguntas-ippu.md`
          C11), `docs/estructura-repositorio.md:223` (307→432 · + 2 tests que faltaban en la lista),
          `preguntas-ippu.md` B5/B6 (`tecnico_grupo` a M11.3) + **C11** nueva, `esquema-datos-v2.md`
          (`grupos_orientados` = nombres §5.61 sin CHECK · `creado_en/actualizado_en` «1 de 38» → **3 de
          51**), y las docstrings de `Grupo` (`identidad.py`: cuatro colores → cinco nombres reales) e
          `Idea` (`modulos.py`: marca I1 / §5.36). Conteo de `puntos-a-validar.md` remedido: §1 = 17
          subsecciones / 5 abiertas · §2 = 17 / 8 · §3 = 6. Ver bitácora §13.
    - [ ] **M12.8b-3** — pase mecánico de **vocabulario**: «fase» → un término por sentido y «L1 = HCE»
          para la numeración de líneas (§5.75 / §2.3 · §5.76 / §2.4). **Sin dueño.** Detalle y conteo por
          archivo en el bullet «Pase mecánico de vocabulario» de esta misma sección y en
          `puntos-a-validar.md` §2.3. **M12.8b-2 no lo tocó** (alcance explícito: sólo cifras/afirmaciones
          falsas, sin pase de vocabulario).
- [ ] **Puntos a validar con IPPU y el equipo** → `docs/notas/puntos-a-validar.md` (2026-08-07, **interno**). **Medido el 2026-09-09 (M12.8b-2):** §1 (para IPPU) = **17 subsecciones `### 1.N`, 5 abiertas** (§1.5 · §1.6 · §1.15 · §1.16 · §1.17 — coincide con la tabla por fuente de `preguntas-ippu.md`); §2 (para el equipo) = **17 subsecciones `### 2.N`, 8 abiertas** (§2.5 · §2.8 · §2.9 · §2.11 · §2.12 · §2.13 · §2.14 · §2.17; el conteo de «abiertas» hace un juicio sobre §2.10 —plegada a §2.11— y §2.12/§2.15 —parcialmente resueltas—); §3 (supuestos) = **6 filas** (la reunión del 21/08 confirmó 4 y dejó 2 para revisar), sin subsecciones `### 3.N`. Lo abierto y crítico: **acceso a la HCE actual + su esquema de BD** (§1.5) y **la firma del acuerdo de confidencialidad** (§1.6); del lado del equipo, **no hay forma de abrir un año nuevo de grupos** (§2.8). La lista consolidada para el próximo contacto con IPPU es `docs/notas/preguntas-ippu.md` (§5.78). Salió de M11.2: varios se detectaron construyendo el esquema (ej. las referencias documentales de los 24 ítems no están verificadas). **§1.3 (catálogo de talleres) quedó CERRADO en M12.3**: el «8 vs 18» era falso y la lista real la trae el propio Prototipo v4. §1.1 ganó cita de fuente primaria (cuestionario 15/06, P10/P12) y se corrigió el plan M12 §4, que la daba por cerrada por error — ver bitácora 2026-08-17.
- [x] ~~**DECISIÓN TÉCNICA PENDIENTE — la tabla `grupo` no admite más de un año.**~~ → **CERRADA**
  (2026-08-14, **§5.18 / D9**): opción (b), **id propio + `UNIQUE(nombre, anio)`**, y el nombre pasa a ser el
  **color** (Azul · Celeste · Naranja · Verde), que es el dominio real de IPPU. **Confirmada por el equipo
  e implementada en M12.1** (modelo, FKs de `hce_diurna` y `foto` a entero, seed de los 4 grupos, 5 tests).
  Queda **un residuo más chico anotado en §5.18**: con granularidad anual, un cambio de técnico a mitad de
  año sobrescribe la fila y sólo deja rastro en `auditoria`. El planteo original queda abajo como registro:
- [ ] ~~**la tabla `grupo` no admite más de un año**~~ (contexto histórico): Su PK es sólo la letra (`A..E`) pero lleva columna `anio`, así que **el grupo A existe para un único año en toda la historia**: crear el de 2027 obliga a sobrescribir el de 2026 (se pierde quiénes fueron sus técnicos) y los expedientes viejos, que en `grupo_id` guardan sólo la letra, pasan a apuntar al grupo nuevo **sin aviso**. Contradice cómo `protocolo` e `informe_cierre` resuelven los ciclos anuales con `(hce_id, …, anio)`. Detectado al revisar M11.2; **se implementó tal cual lo especifica `esquema-datos-v2.md` §2.1, sin corregirlo por cuenta propia** (cambiarlo modifica ese documento). Opciones: (a) PK compuesta `(id, anio)` · (b) id propio con `UNIQUE(letra, anio)` · (c) dejarlo y **quitar la columna `anio`**, si los grupos no se reconfiguran año a año. Anotado en los 3 lugares donde se va a mirar: `esquema-datos-v2.md` §2.1, el docstring de `Grupo` y `docs/notas/puntos-a-validar.md` §2.6. **No bloquea M11.3.**
- [x] ~~**ENVIAR A IPPU:** `docs/notas/consulta-a-ippu.md`~~ → **ENVIADO el 2026-08-19**, sin respuesta todavía (§5.28: es una pregunta en vuelo, no un silencio). ⚠️ **El equipo lo revisó antes de mandarlo y sacó tres preguntas, y el repo describió mal el documento hasta el 2026-08-20 (§5.34).** Contenido real de lo enviado: **Parte 1** lo que entendimos de su trabajo (6 puntos) · **Parte 2** **8** supuestos que tomamos —no 10: se retiraron los dos del **baremo**— · **Parte 3** **14** dudas puntuales —no 11: las agregaron M12.2 (§3.8, puntuación independiente) y M12.7—. Las ⚠️ que quedaron en el documento enviado son **tres**: **2.1** (¿el IDEA se hace una vez o todos los años?), **3.2** (acceso al sistema actual) y **3.8** (puntuación independiente); **3.1** (talleres) va sin ⚠️ porque el Prototipo v4 ya la respondió, y **3.12** (ateneos de grupo) la marcó M12.7. **La cuarta ⚠️ que este pendiente nombraba —«citas bibliográficas de la escala»— ya no existe:** era §3.2 del borrador y **nunca se preguntó** → `puntos-a-validar.md` §1.4. **La numeración cambió de §2.7 y §3.2 en adelante** (mapa en §5.34): citar siempre por la del archivo, que es la que IPPU tiene delante. ⚠️ **Y los dos documentos ya no son «el mismo contenido»** — `consulta-a-ippu.md` es el snapshot de un Google Doc del equipo; `puntos-a-validar.md` es interno y **más largo**.
- [x] ~~**Modularizar la demo**~~ → **HECHO** (2026-08-07, §5.5). La demo dejó de ser recurso exclusivo: **se puede trabajar en paralelo** tomando archivos distintos de `demo/js/`.
- [x] ~~**Demo — analítica institucional real**~~ → **HECHO** (2026-08-07, demo **v4.1**, ver §3 y bitácora). Los 4 KPIs y los gráficos por escala se calculan del modelo; se agregó la tarjeta de evolución Protocolo A → B. Hallazgo del camino: dos de los indicadores viejos no estaban hardcodeados por comodidad sino que eran **incalculables por diseño** desde M4. **Lo que queda abierto ahí:** el heatmap de talleres sigue con datos de muestra (§5.1.3) y el cruce taller × escala no va a tener sustento hasta que haya varios NNA con el ciclo A → B cerrado — hoy hay **1 de 7**.
- [x] ~~**Re-indexar el grafo de conocimiento (`graphify-out/`)**~~ → **HECHO** (2026-08-07). Pasó de 572 nodos / 870 aristas / 80 comunidades a **736 / 1.039 / 163**, ya con los 12 módulos de `demo/js/` como comunidades propias. **La extracción semántica de los 25 documentos quedó cacheada**, así que re-correrlo no vuelve a gastar LLM salvo en los archivos que cambien. Dos cosas a saber: el diagnóstico reporta **67 aristas con extremo colgante** (5,8 % — el extractor emitió aristas hacia IDs que no declaró como nodos; artefacto típico de LLM, no corrupción), y `cost.json` **subregistra esta corrida** con 0 tokens porque los subagentes murieron por límite de sesión antes de poder reportar su uso.
- [x] ~~**Rama `gitlab/feature/base-datos-hce` (Victor):** aparcada, **no** descartada (§5.3). Decidir en reunión de equipo qué se hace con ella al terminar M11.~~ → **CERRADO el 2026-09-03 (§5.68 / L15):** archivada como tag anotado **`archivo/base-datos-hce`** (sobre `dfb1732`, en los dos remotos) y **borrada de `gitlab`**. Ver §12.5.
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
- **Cortes del baremo BUND:** que IPPU confirme los porcentajes exactos contra el anexo del Decreto 72/025 antes de un uso clínico real (decisión §5.1.4). No bloquea la demo (tabla parametrizable, M9). ⚠️ **Nunca se preguntó por escrito.** El borrador de `consulta-a-ippu.md` traía dos preguntas sobre esto (§2.7 y §2.8) y **el equipo las retiró en la revisión del 19/08** (§5.34, verificado: 0 ocurrencias de «baremo», «BUND» y «72/025» en el documento enviado). No está «preguntado y esperando respuesta»: está **sin preguntar**, y su único canal hoy es la reunión. Redacción original conservada en `puntos-a-validar.md` §1.2.
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

### Abierta por F1-nav (2026-08-16)
- **¿«Tutor» es sinónimo de Técnico/a responsable del grupo, un rol distinto (referente por NNA), o el
  tutor legal de la familia?** Los tres tienen consecuencias distintas en el modelo. F1-nav implementó
  lo definido (asignar/cambiar responsables 1 y 2 desde el panel §21.1) y NO creó un rol nuevo. Detalle
  en `docs/notas/puntos-a-validar.md` §2.10.

### Abiertas por F1-nav2 (2026-08-17)
- **Matriz de roles §21.1 — quiénes ven / administran la nómina de Técnicos autorizados del grupo.**
  El Prototipo v4 y el Manual dicen «esta nómina la administra coordinación». La demo lo simula con
  un flag `USUARIO.puedeAdministrarTecnicos` y un toggle en `/usuarios`. En el sistema real esto sale
  del rol asignado (Coordinación / Dirección técnica). Falta que IPPU precise: ¿qué roles ven el
  bloque? ¿pueden todos verlo pero sólo administrar coordinación, o directamente no lo ven los
  técnicos comunes? Impacta la matriz de permisos del backend.
- **Nº de HCE (`HC-YYYY-NNN`).** El Prototipo v4 muestra HC formateado (`HC-2025-014`). La demo no
  lo tiene como campo; F1-nav2 lo deriva con `nroHC(n) = HC-${año(altaFecha)||actual}-${id.padStart(3,'0')}`.
  Como los ids seed son 101-108, salen `HC-YYYY-101`..`HC-YYYY-108`. Si IPPU tiene un formato oficial
  del nº de HCE (probablemente sí — la HCE actual tiene ≈14 años), sustituirlo. Anexado a la lista
  §1.7 de `puntos-a-validar.md` cuando corresponda.

**Resueltas (movidas desde aquí):** stack backend = **FastAPI + SQLAlchemy + Alembic** (SQLite→Postgres); base = **PostgreSQL** (no MariaDB); alcance del MVP = ronda **M0–M10** sobre la demo + Fases A–D del Documento Técnico §12. **Cortes del baremo:** el prototipo usa exactamente los que asumimos (0–4 / 5–24 / 25–49 / 50–95 / 96–100) con su implicancia — confirma **qué usa IPPU**, no qué dice el decreto, así que el anexo del Decreto 72/025 sigue pendiente. **Talleres:** los 14 reales están en el prototipo (§5.14 / D5); el "8 vs 18" era falso.

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
- **5 grupos** (§5.61): Inicial · Escolares · Preadolescentes · Adolescentes · Taller de Adolescentes. ⚠️
  «Taller de Adolescentes» podría ser el servicio de **Taller Terapéutico** (Fase 2) y no un grupo —
  `preguntas-ippu.md` A5.
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
| **`handoff.md`** | raíz | Todos escriben, pero **sólo agregando** (decisiones en §5, pendientes en §6; la bitácora se escribe en `docs/bitacora.md`, §5.84). Si dos editan a la vez, el conflicto es trivial de resolver. |

### 12.4 Ciclo de una sesión de trabajo (checklist)
**Al empezar:**
1. `git pull` (de los dos remotos si hiciste push a ambos).
2. Leer `handoff.md` — cabecera, §5 (decisiones) y §6 (pendientes). Mirar en §6 si alguien ya está en eso
   (§5.6: no hay dueños, pero sí conviene no duplicar).
3. Avisar en el grupo qué tomás.
4. Rama corta con nombre del módulo: `git checkout -b feat/M11.1-infra-postgres`.

**Al terminar:**
5. Verificar antes de dar por hecho (pytest / Playwright según corresponda) y decir el resultado real.
5b. **`python herramientas/verificar_estado.py --check`** — mide el repo (tablas, migración, un solo head,
   tests si Docker está arriba) y falla si algún `.md` afirma otra cosa. Existe porque la documentación se
   desfasó del repo **cuatro veces** en la ronda M12 y las cuatro se encontraron de casualidad (§5.29).
   Silencioso si coincide. ⚠️ Sin Docker **no estima** el conteo de tests: lo reporta como no medido.
6. **Actualizar `handoff.md`**: §5 si tomaste una decisión de arquitectura · §6 pendientes · **cabecera**
   (§5.82). La entrada de bitácora (qué se hizo, cómo se verificó, qué sigue) va en **`docs/bitacora.md`**
   (§5.84).
7. Commit + merge a `main` + **push a los dos remotos**.

**Vida máxima de una rama: ~1 semana.** La rama `feature/base-datos-hce` vivió 19 días sin integrarse y por
eso divergió tanto. Si un módulo lleva más, mergeás lo que tengas hecho o al menos pusheás la rama y lo
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
