# Handoff — Proyecto IPPU × UTEC-LIDIA · Línea 1 (HCE + IDEA)

> **Bitácora de contexto entre sesiones.** Sirve para que cualquier sesión (Claude o persona)
> recupere el estado del proyecto sin releer todo. **Actualizar al final de cada sesión** (sección 4 y 6).
>
> ⚠️ **Este archivo está versionado en el repo desde el 2026-08-03** (antes era local y por eso el equipo
> trabajaba a ciegas — ver §12). Es el **contexto compartido de los tres**: leerlo al empezar, actualizarlo
> al terminar, pushearlo siempre. **Cómo trabajamos en paralelo sin pisarnos: §12.**
>
> - **Última actualización:** 2026-08-03
> - **Responsable del documento:** Lucas Pimentel (UTEC-LIDIA) · **Equipo:** Lucas · Samuel · Victor
> - **Foco actual:** **L1 — Ronda M0–M10 COMPLETA (demo v4.0).** En curso: **M11 · backend v2** (rediseño de esquema al modelo del Doc. Técnico) — **responsable: Victor**, arranca por **M11.1** (infra Postgres-only) sobre la propuesta ya escrita en `backend/docs/esquema-datos-v2.md`. Las 3 decisiones de arquitectura del Anexo A **ya están cerradas** (§5.2). En paralelo, pendiente con IPPU: **validar la demo v4.0** (sobre todo el cambio de IDEA a línea base única).
> - **Fuente normativa vigente:** `docs/markdown/1_documento-tecnico-utec-lidia.md` (Doc. Técnico IPPU v1.0, jul-2026) + plan `PLAN-modular-adaptacion-HCE-2026-07.md` (módulos M0–M11). Referencia de UX/reglas: `docs/fuentes/HCE_IPPU_Prototipo_v1.html`. **En conflicto con el diseño previo, gana el Documento Técnico.** El backend (Fases 0–2) **no se toca** en esta ronda (rediseño de esquema = M11).

---

## 0. Cómo retomar el trabajo (arranque rápido)
0. **`git pull`** antes de tocar nada, y avisar en el grupo qué módulo tomás (§12).
1. Terminal → `cd` a la carpeta del repo → `claude`.
2. Leer este `handoff.md` y luego `CLAUDE.md` (ambos versionados: los tenés al clonar).
3. Toda la documentación del proyecto está convertida a Markdown (legible y citable) en **`docs/markdown/`**.
   Los originales (PDF/PPTX/DOCX/XLSX) están en **`docs/fuentes/`**.
4. La demo (front) de la L1 está en **`implementacion/L1-hce-idea/demo/hce_idea_ippu_demo.html`** (abrir en navegador).
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

### Protocolo IDEA (Inventario de Espectro Autista — Ángel Rivière, 1997)
- **4 escalas → 12 dimensiones (D1–D12); cada dimensión 0–8; total 0–96.** Menor puntaje = mejor (0 = sin trastorno, 8 = afectación severa). Criterio: asignar siempre el valor más bajo posible. Puntuaciones impares (1,3,5,7) para casos entre dos niveles.
  - **Escala A — Relación Social:** D1 Relaciones sociales · D2 Referencia conjunta · D3 Capacidades intersubjetivas/mentalistas (Teoría de la Mente).
  - **Escala B — Comunicación y Lenguaje:** D4 Funciones comunicativas · D5 Lenguaje expresivo · D6 Lenguaje receptivo.
  - **Escala C — Anticipación/Flexibilidad:** D7 Anticipación · D8 Flexibilidad · D9 Sentido de la actividad.
  - **Escala D — Simbolización:** D10 Ficción e imaginación · D11 Imitación · D12 Suspensión.
  - (Los descriptores oficiales de cada nivel están en `docs/markdown/escala-del-inventario-del-espectro-autista-idea.md` y embebidos en la demo HTML.)
- **Bandas orientativas:** Leve 0–32 · Moderada 33–64 · Severa 65–96.
- **Ciclo de evaluación:** IDEA completa en **enero (inicial)** y **noviembre (final)**; **intermedia Likert en junio**
  (3 ítems/dimensión, escala 1–5). Conversión a equivalente IDEA: `(5 − promedio) × 2`.

### Arquitectura técnica objetivo (según presentación 13.05.2026)
- **Frontend:** React + React Router + Tailwind CSS. Módulo: Formulario IDEA (12 dim), Form Likert (3 ítems/dim), Informe final + BarChart (recharts).
- **API REST:** Node.js **o** Python **FastAPI** · **9 endpoints CRUD** · **autenticación JWT por terapeuta** · validación Zod/Pydantic · OpenAPI/Swagger.
- **Base de datos:** PostgreSQL (o MariaDB). Tablas: `nna`, `evaluaciones_idea`, `dimensiones_idea`, `items_likert`, `terapeutas`, `roles`. Prisma ORM / `pg_dump` backup.
- **Integración con la HCE existente:** vía **iframe** (mínimo viable) **o** módulo nativo con API propia.
- **DevOps:** Docker + NGINX · CI/CD GitHub.

### Estado de la demo L1 (`implementacion/L1-hce-idea/demo/hce_idea_ippu_demo.html`)
- Prototipo HTML/CSS/JS de un solo archivo, **datos simulados, "no funcional"** (sin backend).
- **v4.0 (2026-07-30, ronda M0–M10 completa, adaptada al Doc. Técnico IPPU v1.0):** motor de flujo CI→LB→PA→PB→IC (estado derivado, firma doble=bloqueo, addendas, habilitación excepcional, HCE-LOG), HCE-00 siempre abierto, HCE-CI (único bloqueo sin excepción), HCE-LB (IDEA línea base única con NS), HCE-PA/PB (Escala IPPU-TEA 24 ítems, delta B−A automático, alerta Δ≤−7, guard de no-homologabilidad), HCE-IC (informe único con tabla+radares y PDF, Recibí de la familia), HCE-DOC (adjuntos categorizados, archivo histórico §10 de solo lectura, protección de imagen §8.4 individual y grupal), HCE-ORG (INAU/BPS con registros), HCE-VF (BUND/CIF, tabla parametrizable, salvaguarda §7.5, autogeneración descriptiva, Reporte VF), búsqueda por 3 vías (nombre/CI/HCE/grupo), recordatorios configurables §4, Grupos y Usuario. "Eval. por áreas/general" **eliminadas** (archivo histórico en HCE-DOC).
- Las vistas heredadas pre-Doc. Técnico que siguen en el archivo sin exponerse: "Eval. intermedia" (reemplazada por PA/PB). El heatmap de talleres de Analítica no se tocó (decisión §0.3).

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

## 6. Pendientes / próximos pasos (sugeridos)
- [x] ~~Ronda M0–M10 (adaptar la demo al Doc. Técnico)~~ → **COMPLETA** (2026-07-30, demo v4.0). Ver bitácora.
- [ ] **Validar la demo v4.0 con IPPU** (puerta de entrada a M11 según el plan; en especial el cambio de IDEA a línea base única). Ritmo sugerido por el Doc. Técnico §12: revisiones quincenales.
- [ ] **M11 · Backend v2 — EN CURSO · responsable: Victor** (asignado 2026-08-03). Las 3 decisiones de arquitectura ya están cerradas (§5.2) y la propuesta de esquema v2 escrita (`backend/docs/esquema-datos-v2.md`). Secuencia: **M11.1** infra Postgres-only (docker-compose + config + Alembic re-init) → **M11.2** modelos + catálogos → **M11.3** servicios/motor de flujo con guards → **M11.4** routers → **M11.5** seed espejo de la demo + pytest contra Postgres (criterio §12-A: usuario demo 1 por API = IDEA 58 · PA 60 · PB 79 · Δ +19) → **M11.6** docs. Después: Fase 3 (demo↔API) → Fase 4 (JWT) → Fase 6 (Docker completo).
- [ ] **Rama `gitlab/feature/base-datos-hce` (Victor):** aparcada, **no** descartada (§5.3). Decidir en reunión de equipo qué se hace con ella al terminar M11 (mergear lo reutilizable como referencia SQL en `docs/`, o cerrarla dejando constancia). Ver §12.5.
- [ ] **Elegir un remoto principal** (hoy hay dos: `origin`=GitHub y `gitlab`=UTEC) — a confirmar entre los tres, ver §12.2.
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

**Resueltas (movidas desde aquí):** stack backend = **FastAPI + SQLAlchemy + Alembic** (SQLite→Postgres); base = **PostgreSQL** (no MariaDB); alcance del MVP = ronda **M0–M10** sobre la demo + Fases A–D del Documento Técnico §12.

## 8. Equipo y contactos
- **UTEC-LIDIA — equipo actual (3):** **Lucas Pimentel** · **Samuel (Boris) Furtado** · **Victor Uria**.
  (Bruno Delvalle y Rafael Quintanilla figuraban en el equipo inicial; hoy no están activos en L1.)
- **UTEC (docentes/referentes):** Matías López (`matias.lopez@utec.edu.uy`), Mikaela/Ruth Pivani (`ruth.pivani@utec.edu.uy`).
- **IPPU:** Fernando Sierra — Director.

## 9. Datos clave (cifras)
- ~120 NNA total · 30 INAU + 108 BPS · 5 grupos · 18 talleres · ~40 expedientes activos · ~150 evaluaciones IDEA históricas (sin consolidar).

## 10. Glosario
- **NNA**: niños, niñas y adolescentes. · **TEA**: Trastorno del Espectro Autista.
- **HCE**: Historia Clínica Electrónica. · **IDEA**: Inventario de Espectro Autista (Á. Rivière, 1997).
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

**Propuesta (a confirmar entre los tres):** **`gitlab` = remoto principal** — es el institucional y los tres
tienen cuenta UTEC; **`origin` (GitHub) = espejo**, que Lucas sincroniza. Mientras haya dos, la regla es
**pushear siempre a ambos** en el mismo momento:
```bash
git push gitlab main && git push origin main
```

### 12.3 Reparto: quién toca qué
Nos repartimos **por módulo**, no por archivo. Antes de empezar: avisar en el grupo **qué módulo tomás**
y anotarlo como responsable en el pendiente correspondiente de §6.

| Zona | Archivo/carpeta | Regla |
|---|---|---|
| **Demo** | `implementacion/L1-hce-idea/demo/hce_idea_ippu_demo.html` | **Un solo archivo de ~3.700 líneas → una sola persona a la vez.** Editarlo en paralelo garantiza conflictos irresolubles. |
| **Backend v2 (M11)** | `implementacion/L1-hce-idea/backend/` | Se reparte por sub-módulo (M11.1 … M11.6), que son secuenciales. **Responsable actual: Victor.** |
| **Documentación** | `docs/`, `README.md` | Libre, poco riesgo de conflicto. |
| **`handoff.md`** | raíz | Todos escriben, pero **sólo agregando** (bitácora al final, pendientes en §6). Si dos editan a la vez, el conflicto es trivial de resolver. |

### 12.4 Ciclo de una sesión de trabajo (checklist)
**Al empezar:**
1. `git pull` (de los dos remotos si hiciste push a ambos).
2. Leer `handoff.md` — cabecera, §5 (decisiones) y §6 (pendientes). Confirmar que nadie tomó tu módulo.
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
- **2026-07-15** — **Ronda de adaptación al Documento Técnico IPPU v1.0 · M0 (housekeeping).** IPPU envió el Documento Técnico v1.0 (jul-2026), el prototipo `HCE_IPPU_Prototipo_v1.html` y una propuesta de datos (`modelo-datos.md`); Claude Web generó el plan `PLAN-modular-adaptacion-HCE-2026-07.md` (M0–M11). **M0 hecho:**
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
