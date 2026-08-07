# Graph Report - C:\Proyectos\IPPU  (2026-08-07)

## Corpus Check
- 72 files · ~80,842 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 736 nodes · 1039 edges · 163 communities (39 shown, 124 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 94 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Infraestructura y config del backend
- Catalogos IDEA/IPPU-TEA y reglas de puntaje
- Motor de flujo y firma (M1)
- HCE-DOC, HCE-ORG y HCE-VF
- Reglas operativas del Documento Tecnico
- Convenio, gobernanza y hojas de ruta
- Estado del arte en IA para TEA
- API de evaluaciones (IDEA y Likert)
- Modelo y API del expediente NNA
- Lineas de innovacion y financiamiento
- Editores de evaluacion de la demo
- Tests end-to-end del backend
- Instrumentos IPPU-TEA/BUND y reglas duras
- API clinica (eventos y observaciones)
- Schemas Pydantic del NNA
- Protocolo IDEA (Riviere) y sus escalas
- API de catalogo IDEA
- API de personas, grupos y talleres
- Informe de Cierre Anual (HCE-IC)
- Wizard de alta y edicion de NNA
- Arquitectura objetivo y criterios de aceptacion
- Recordatorios y fotos grupales
- Documentos de contexto del proyecto
- Modularizacion, verificacion y analitica de la demo
- Comparador de fingerprints
- HCE-00 e identificacion del NNA
- Situacion actual de la HCE y migracion
- Punto de entrada de la API
- Grupos, equipo y usuario de la demo
- HCE-IC — Informe de Cierre Anual (único infor...
- fingerprint.js
- Conversión de fuentes a Markdown con Docling
- HCE-ORG — Áreas INAU y BPS
- datos.js
- Nota sobre evidencia y limitaciones de la lit...
- Oportunidades de inicio inmediato (0-6 meses)
- Oportunidades de largo plazo y líneas de inve...
- Oportunidades de mediano plazo (6-18 meses)
- Principio: accesibilidad y usabilidad
- Principio: co-diseño con personas autistas
- Principio: ética y privacidad de datos
- Principio: explicabilidad (XAI) en contextos ...
- Principio: impacto local con visión global
- Principio: validación clínica rigurosa
- Bruno Delvalle (estudiante UTEC)
- Fundación IPPU (participante institucional)
- Lucas (Juan) Pimentel (estudiante UTEC)
- Matías López (docente UTEC)
- Mikaela (Ruth) Pivani (docente UTEC)
- Rafael Quintanilla (estudiante UTEC)
- Reunión IPPU × UTEC — 2026-05-13 (8 asistentes)
- Samuel (Boris) Furtado (estudiante UTEC)
- Victor Uria (estudiante UTEC)
- Reunión Proyecto IPPU — 2026-05-20 (núcleo té...
- Reunión Proyecto IPPU — 2026-05-27 (6 asisten...
- Ejemplos de endpoints (request/response reale...
- Error 409 — C.I. duplicada
- Error 422 — se requieren exactamente las 12 d...
- GET /catalogo/escalas (4 escalas × 3 dimensio...
- PATCH /nna/{id}/estado — baja y reactivación
- POST /nna — crea expediente (anamnesis + tall...
- POST /nna/{id}/idea — total calculado en el s...
- POST /nna/{id}/likert — equivalente_idea calc...
- Catálogo dimension_catalogo — 12 dimensiones ...
- Catálogo escala — 4 escalas IDEA (A Relación ...
- Catálogo nivel_idea — descriptores oficiales ...
- Datos derivados que no se guardan crudos (eda...
- Denormalización controlada de total y equival...
- Esquema de datos v1 — HCE + IDEA (Fase 1, rel...
- Evaluaciones provisionales (evaluacion_area /...
- Normalización 3NF del esquema v1
- Protocolo IDEA data-driven (descriptores en l...
- Relaciones M:N explícitas (nna-taller, grupo-...
- Tabla anamnesis — 1:1 con nna (motivo, perina...
- Tabla dimension_idea — 12 puntajes 0-8 por ev...
- Tabla evaluacion_idea — portada anual (año, p...
- Tabla evaluacion_likert — intermedia de junio...
- Tabla evento — hitos del expediente (alta/baj...
- Tabla item_likert — 36 ítems (3 × 12 dimensio...
- Tabla nna — el expediente, centro del esquema v1
- Tabla observacion — diario de seguimiento clí...
- Tabla terapeuta — unifica profesional + evalu...
- Bug A corregido — informe_cierre pasa de 0..1...
- Bug B corregido — PERSONA ||--o| HCE_DIURNA (...
- Catálogo baremo_categoria (5 filas: min, max,...
- Criterio de aceptación M11.5 — reproducir por...
- Decisión 2 — lógica de negocio en el servidor...
- Decisión 3 — portabilidad = paramétrico mínimo
- Decisión 1 — Postgres-only (dev y prod vía do...
- Esquema de datos v2 — HCE IPPU (M11 · backend...
- Mixin de firma (firmado · firmas JSONB · adde...
- Plan M11.1-M11.6 (infra → modelos → servicios...
- Preguntas abiertas v2 (cortes del baremo · ka...
- Regla dura: auditoría solo-inserción (sin end...
- Regla dura: Δ sólo B−A, jamás entre instrumen...
- Regla dura: categoria_baremo(pct) sólo desde ...
- Regla de reparto: identidad en columnas relac...
- Regla dura: informe único (§5.3) — el PDF sal...
- Regla dura: protección de imagen individual y...
- Regla dura: registro histórico inmutable (§10)
- Servicio flujo.py — modulo_habilitado / estad...
- Tabla auditoria (HCE-LOG) — solo inserción, t...
- Tabla autorizacion_imagen — PK = hce_id, copi...
- Tabla consentimiento (HCE-CI) — PK = hce_id, ...
- Tabla documento (HCE-DOC) — categoria_id, es_...
- Tabla foto — XOR hce_id / grupo_id vía CHECK(...
- Tabla hce_diurna — expediente de Atención Diu...
- Tabla idea (HCE-LB) — línea base única, dim J...
- Tabla informe_cierre (HCE-IC) — UNIQUE(hce_id...
- Tabla persona — identidad única transversal a...
- Tabla persona_servicio — N:M persona × servic...
- Tabla profesional (ex-terapeuta): profesional...
- Tabla protocolo (HCE-PA/PB) — Escala IPPU-TEA...
- Tabla registro_organismo — envíos INAU y gest...
- Tabla valoracion_funcional (HCE-VF) — pct 0-1...
- Migraciones Alembic (upgrade head · autogener...
- API REST HCE + IDEA (Línea 1)
- python -m app.seed — carga de datos simulados
- Endpoints Fase 2 (NNA · IDEA · Likert · clíni...
- Puesta en marcha en dev (venv · requirements ...
- Roadmap Fases 0-6 del backend L1
- alembic==1.14.0
- fastapi==0.115.6 (+ uvicorn, pydantic, pydant...
- psycopg[binary]==3.2.3 — driver Postgres (Fas...
- pytest==8.3.4 + httpx==0.28.1 (Fase 5)
- python-jose + passlib[bcrypt] — autenticación...
- SQLAlchemy==2.0.36
- Demo L1 v4.1 — shell HTML (topbar, sidebar, 1...
- Heatmap talleres × escala — único panel no ca...
- Pantalla de login con usuario de demostración...
- M7 — eliminación de las vistas provisionales ...
- Modal de alta de NNA — wizard de 4 pasos (dat...
- Modal de flujo M1 — firma / addenda / habilit...
- No-homologabilidad IDEA ↔ IPPU-TEA en la UI (...
- Orden de carga de los 12 scripts = orden de e...
- Vista analítica institucional — KPIs y gráfic...
- Vista expediente (HCE) — contenedor armado po...
- Vista grupos de referencia (A-E)
- Vista HCE-IC — Informe de Cierre Anual (autog...
- Vista HCE-LB — línea base IDEA (12 dimensione...
- Vista inicio — listado de NNA + KPIs + filtro...
- Vista evaluación intermedia — Likert 1-5 con ...
- Vista pendientes — NNA activos sin línea base...
- Vista HCE-PA/PB — Escala IPPU-TEA (24 ítems, ...
- Bug atrapado: seed de flujo.js llamaba a fmtF...
- comparar.js — diff de dos capturas (exit 0 id...
- Fingerprint de comportamiento de la demo L1
- fingerprint.js — captura el comportamiento de...
- Parte A — estado inicial (catálogos, funcione...
- Parte B — reglas duras (no-homologabilidad y ...
- Parte C — interacciones (firmas CI/PA/PB, del...
- Parte D — modelo final y analítica derivada (...
- Regla verificada: calcularDelta debe lanzar s...
- Regla verificada: categoriaBaremo debe lanzar...
- Test de no-cambio (no de corrección)

## God Nodes (most connected - your core abstractions)
1. `ORMModel` - 31 edges
2. `Base` - 30 edges
3. `Nna` - 20 edges
4. `run()` - 19 edges
5. `Escala del Inventario del Espectro Autista (IDEA)` - 12 edges
6. `Taller` - 10 edges
7. `Modelo de datos HCE IPPU (PostgreSQL + JSONB) — propuesta` - 10 edges
8. `get_db()` - 9 edges
9. `Escala` - 9 edges
10. `DimensionCatalogo` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Decisión §5.2: lógica de negocio en el servidor (sin triggers PL/pgSQL)` --semantically_similar_to--> `No-homologabilidad estructural (tablas separadas, deltas exclusivos de protocolo)`  [INFERRED] [semantically similar]
  handoff.md → docs/markdown/modelo-datos.md
- `Decisión §5.2: portabilidad paramétrica mínima` --semantically_similar_to--> `Capa de parametrización institucional (config_institucion, vocabulario, baremo_categoria)`  [INFERRED] [semantically similar]
  handoff.md → docs/markdown/modelo-datos.md
- `Guard de no-homologabilidad (regla dura en lógica, no en UI)` --semantically_similar_to--> `No-homologabilidad estructural (tablas separadas, deltas exclusivos de protocolo)`  [INFERRED] [semantically similar]
  PLAN-modular-adaptacion-HCE-2026-07.md → docs/markdown/modelo-datos.md
- `Hoja de ruta Proyecto 1 — historia clínica, IDEA y analítica institucional` --conceptually_related_to--> `L1 — Historia Clínica Electrónica + IDEA + analítica`  [INFERRED]
  docs/markdown/Documento de trabajo.md → README.md
- `L2 — Pictogramas personalizados con IA (CAA/AAC)` --conceptually_related_to--> `Pictogramas personalizados con IA generativa (CAA)`  [INFERRED]
  README.md → docs/markdown/IPPU.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Módulos de la HCE del Servicio de Atención Diurna** — docs_markdown_1_documento_tecnico_utec_lidia_hce_00, docs_markdown_1_documento_tecnico_utec_lidia_hce_ci, docs_markdown_1_documento_tecnico_utec_lidia_hce_lb, docs_markdown_1_documento_tecnico_utec_lidia_hce_pa_pb, docs_markdown_1_documento_tecnico_utec_lidia_hce_ic, docs_markdown_1_documento_tecnico_utec_lidia_hce_doc, docs_markdown_1_documento_tecnico_utec_lidia_hce_org, docs_markdown_1_documento_tecnico_utec_lidia_hce_vf, docs_markdown_1_documento_tecnico_utec_lidia_hce_log [EXTRACTED 1.00]
- **Flujo guiado: secuencia CI→LB→PA→PB→IC con firma, bloqueo, excepción y traza** — plan_modular_adaptacion_hce_2026_07_m1_motor_de_flujo, handoff_motor_de_flujo, docs_markdown_1_documento_tecnico_utec_lidia_firma_bloquea_edicion, docs_markdown_1_documento_tecnico_utec_lidia_habilitacion_excepcional, docs_markdown_1_documento_tecnico_utec_lidia_hce_log, docs_markdown_1_documento_tecnico_utec_lidia_validaciones_integridad_recomendaciones [EXTRACTED 1.00]
- **Cierre del Anexo A: las 3 decisiones de arquitectura de M11** — handoff_decision_postgres_only, handoff_decision_logica_en_servidor, handoff_decision_portabilidad_minima, plan_modular_adaptacion_hce_2026_07_anexo_a_revision_modelo_datos, handoff_backend_m11 [EXTRACTED 1.00]

## Communities (163 total, 124 thin omitted)

### Community 0 - "Infraestructura y config del backend"
Cohesion: 0.07
Nodes (59): BaseSettings, DeclarativeBase, fixture, Configuración de la aplicación (variables de entorno). Se lee de un archivo…, Settings, Base, get_db(), Configuración de SQLAlchemy: engine, sesión y Base declarativa. (+51 more)

### Community 1 - "Catalogos IDEA/IPPU-TEA y reglas de puntaje"
Cohesion: 0.06
Nodes (41): anioDe(), calcularDelta(), calcularDeltasPB(), COMP, DIMENSIONES, fmtDelta(), ideaEvals(), IPPU_ITEMS (+33 more)

### Community 2 - "Motor de flujo y firma (M1)"
Cohesion: 0.10
Nodes (34): addendaModulo(), CIE_SEED, closeFlujoModal(), confirmarAddenda(), confirmarExcepcion(), confirmarFirma(), estadoBadgeM(), estadoModulo() (+26 more)

### Community 3 - "HCE-DOC, HCE-ORG y HCE-VF"
Cohesion: 0.09
Nodes (34): agregarRegOrg(), BPS_ESTADOS, BPS_PRESTACIONES, BUND_CATS, categoriaBaremo(), confirmarAutImagen(), deArea(), descAfect() (+26 more)

### Community 4 - "Reglas operativas del Documento Tecnico"
Cohesion: 0.06
Nodes (37): Arranque de sesión obligatorio, Ronda en curso M11 — backend v2, Búsqueda por tres vías (cédula, N.º de HCE, grupo), Criterio rector: herramienta dúctil y portable, Firma digital bloquea edición; corrección por addenda, Habilitación excepcional con constancia, HCE-CI — Consentimiento informado (único bloqueo sin excepción), HCE-DOC — Documentos y fotos (+29 more)

### Community 5 - "Convenio, gobernanza y hojas de ruta"
Cohesion: 0.07
Nodes (34): Reglas de datos simulados y datos sensibles de NNA, Confidencialidad: documento legal a firmar por quienes accedan a datos sensibles, Fernando Sierra — Director de Fundación IPPU, Cuestionario de relevamiento IPPU — respuestas (15/06/2026), Fase 1 — diagnóstico de datos y procesos actuales, Hoja de ruta Proyecto 1 — historia clínica, IDEA y analítica institucional, Hoja de ruta Proyecto 2 — pictogramas personalizados con IA, Hoja de ruta Proyecto 3 — asistente virtual para funcionarios y familias (+26 more)

### Community 6 - "Estado del arte en IA para TEA"
Cohesion: 0.06
Nodes (33): A.1 AutMedAI — detección temprana con 28 parámetros pediátricos (Karolinska / SPARK), A.2 T-EYE — detección con realidad virtual e IA (UPV / Red Cenit), A.3 LLMs multimodales para diagnóstico por video (Gemini 2.5 Pro / GPT-4o), A.4 Estudio AURORA — predicción por registros electrónicos de salud (Duke), A.5 Detección multimodal XGBoost + CNN-LSTM con XAI (EEG / eye-tracking), A.6 LLMs para diagnóstico de trastornos del lenguaje (GPT-3.5 / GPT-4o), B.1 Noora — entrenamiento en empatía con GPT-4 (RCT, JADD 2025), B.2 CognitiveBotics — plataforma terapéutica con IA y gamificación (ABA digital) (+25 more)

### Community 7 - "API de evaluaciones (IDEA y Likert)"
Cohesion: 0.15
Nodes (20): field_validator, crear_idea(), crear_likert(), listar_idea(), listar_likert(), get, post, Session (+12 more)

### Community 8 - "Modelo y API del expediente NNA"
Cohesion: 0.15
Nodes (19): Nna, Expediente del niño, niña o adolescente. Es el centro del modelo., Edad en años, calculada desde fecha_nac (no se persiste)., get_nna(), Session, Devuelve el NNA o 404., _asignar_talleres(), cambiar_estado() (+11 more)

### Community 9 - "Lineas de innovacion y financiamiento"
Cohesion: 0.10
Nodes (20): Apoyo a la Toma de Decisiones Clínicas, Áreas de Innovación Tecnológica Proyectadas, Autism Research Institute (ARI) — USD 100.000, Comunicación Aumentativa y Alternativa (CAA) con IA, Convenio de Cooperación Estratégica IPPU × UTEC-LIDIA, Entornos Educativos Adaptativos, Pilar: Formación y Transferencia, Fundación IPPU (+12 more)

### Community 10 - "Editores de evaluacion de la demo"
Cohesion: 0.18
Nodes (18): IPPU_ESCALAS, cargarIDEA(), cargarProt(), firmarLB(), firmarProt(), guardarIDEA(), guardarLBDesdeForm(), guardarProt() (+10 more)

### Community 11 - "Tests end-to-end del backend"
Cohesion: 0.21
Nodes (11): _dims(), _nna_payload(), Tests end-to-end de los endpoints (Fase 2)., test_ci_duplicada_409(), test_crear_ver_y_edad(), test_editar_y_estado(), test_idea_total_y_duplicado(), test_idea_validaciones() (+3 more)

### Community 12 - "Instrumentos IPPU-TEA/BUND y reglas duras"
Cohesion: 0.20
Nodes (15): Baremo Único Nacional de Discapacidad (BUND) — tabla parametrizable, Escala IPPU-TEA — 24 ítems Likert de progreso 1–5, HCE-PA / HCE-PB — Protocolos A y B, HCE-VF — Valoración funcional (BUND/CIF), Perfil funcional en clave CIF (6 dominios de autonomía), Regla dura de no homologabilidad IDEA / IPPU-TEA (§5.2), Salvaguarda dura §7.5 — prohibido derivar el baremo de puntajes clínicos, Conversión a equivalente IDEA = (5 − promedio) × 2 (+7 more)

### Community 13 - "API clinica (eventos y observaciones)"
Cohesion: 0.25
Nodes (13): crear_evento(), crear_observacion(), listar_eventos(), listar_observaciones(), get, post, Session, Línea de tiempo clínica: observaciones y eventos por NNA. (+5 more)

### Community 14 - "Schemas Pydantic del NNA"
Cohesion: 0.23
Nodes (14): ORMModel, BaseModel, Schema que sabe leerse desde un objeto ORM (SQLAlchemy)., AnamnesisIn, EstadoUpdate, NnaBase, NnaCreate, NnaDetail (+6 more)

### Community 15 - "Protocolo IDEA (Riviere) y sus escalas"
Cohesion: 0.20
Nodes (12): Autogeneración descriptiva del borrador de síntesis funcional, HCE-LB — Línea base IDEA, IDEA como Instrumento 0 / línea base (no se repite anualmente), Ángel Rivière — autor del IDEA, Criterio de puntuación: asignar siempre el valor más bajo posible, Escala Anticipación / Flexibilidad (D7 Anticipación · D8 Flexibilidad · D9 Sentido de la actividad), Escala Comunicación y Lenguaje (D4 Funciones comunicativas · D5 Expresivo · D6 Receptivo), Escala del Inventario del Espectro Autista (IDEA) (+4 more)

### Community 16 - "API de catalogo IDEA"
Cohesion: 0.23
Nodes (9): listar_dimensiones(), listar_escalas(), get, Session, Catálogo IDEA (solo lectura): escalas y dimensiones., Base común de los schemas Pydantic., DimensionOut, EscalaOut (+1 more)

### Community 17 - "API de personas, grupos y talleres"
Cohesion: 0.27
Nodes (10): listar_grupos(), listar_talleres(), listar_terapeutas(), get, Session, Terapeutas, grupos y talleres (lectura)., GrupoOut, Schemas de terapeutas, grupos y talleres. (+2 more)

### Community 18 - "Informe de Cierre Anual (HCE-IC)"
Cohesion: 0.29
Nodes (9): cargarIC(), firmarIC(), guardarIC(), guardarICDesdeForm(), icDatosFirmados(), icRadaresHtml(), icSetReadonly(), icTablaHtml() (+1 more)

### Community 19 - "Wizard de alta y edicion de NNA"
Cohesion: 0.30
Nodes (11): buildReview(), CAMPOS_TXT, closeAlta(), crearNNA(), openAlta(), openEditar(), showWizStep(), validateStep() (+3 more)

### Community 20 - "Arquitectura objetivo y criterios de aceptacion"
Cohesion: 0.22
Nodes (9): Stack objetivo de L1, Hoja de ruta Fases A–D y criterios de aceptación (§12), Modelo de datos sugerido (§6), Prototipo de referencia HCE_IPPU_Prototipo_v1.html, Arquitectura técnica L1 (React + API REST 9 endpoints + JWT + PostgreSQL), Integración con la HCE: iframe (mínimo viable) o módulo nativo con API propia, Modelo de datos HCE IPPU (PostgreSQL + JSONB) — propuesta, Criterio de aceptación §12-A (usuario demo 1: IDEA 58 · PA 60 · PB 79 · Δ +19) (+1 more)

### Community 21 - "Recordatorios y fotos grupales"
Cohesion: 0.31
Nodes (7): grupoAutImagen(), GRUPOS_FOTOS, recordatorioPendientes(), RECORDATORIOS, recToggle(), renderRecordatorios(), subirFotoGrupo()

### Community 22 - "Documentos de contexto del proyecto"
Cohesion: 0.39
Nodes (8): CLAUDE.md — Guía de Claude para el proyecto IPPU, Regla anti-contradicción, Documento Técnico IPPU × UTEC-LIDIA v1.0 (jul-2026), Demo HCE + IDEA (conversión del prototipo previo al Documento Técnico), Handoff — estado vivo de la Línea 1, Decisiones cerradas §0 del plan, Plan modular — adaptar la demo L1 al Documento Técnico (M0–M11), Proyecto IPPU × UTEC-LIDIA (README)

### Community 23 - "Modularizacion, verificacion y analitica de la demo"
Cohesion: 0.29
Nodes (8): 18 talleres especializados y 5 grupos de referencia, Analítica institucional calculada (demo v4.1), Fingerprint de comportamiento con Playwright (demo/verificacion/), Modularización de la demo L1 (§5.5), Regla dura de no-homologabilidad IDEA / IPPU-TEA (demo), Scripts planos sin defer ni type=module en la demo, js/utils.js y la pérdida de hoisting global, Demo L1 v4.1 (ronda M0–M10 + analítica calculada)

### Community 24 - "Comparador de fingerprints"
Cohesion: 0.29
Nodes (5): A, B, claves, fs, [refPath, actPath]

### Community 25 - "HCE-00 e identificacion del NNA"
Cohesion: 0.33
Nodes (6): Grupo de referencia y técnicos responsables (dos evaluadores), HCE-00 — Identificación y anamnesis (siempre abierto), Confiabilidad interjueces — kappa de Cohen (fase piloto), Wizard de alta de NNA (datos · clínicos · plan · confirmar), Decisiones abiertas del modelo (HCE por año vs. por persona, kappa, migración, HCEN), Bug B — PERSONA ||--|| HCE_DIURNA como 1:1 obligatorio

### Community 26 - "Situacion actual de la HCE y migracion"
Cohesion: 0.33
Nodes (6): Migración desde la HCE actual de IPPU (§10), ~150 evaluaciones IDEA históricas sin consolidar, Problemas de la HCE actual (estática, sin flujo interno, sin consolidación ni análisis), Fundación IPPU — Instituto Psico Pedagógico Uruguayo, Presentación institucional IPPU × UTEC (13.05.2026), L1 — Historia Clínica Electrónica + IDEA + analítica

### Community 27 - "Punto de entrada de la API"
Cohesion: 0.33
Nodes (4): health(), get, Punto de entrada de la API (Fase 0). Levantar con: uvicorn app.main:app…, Chequeo de vida de la API.

### Community 28 - "Grupos, equipo y usuario de la demo"
Cohesion: 0.40
Nodes (4): EQUIPO, GRUPOS, renderGrupos(), USUARIO

### Community 29 - "HCE-IC — Informe de Cierre Anual (único infor..."
Cohesion: 0.40
Nodes (5): HCE-IC — Informe de Cierre Anual (único informe válido), Informes generados manualmente en Word (1–2 h/semana), Informe anual automático por NNA (comparativa enero/junio/noviembre + PDF), Bug A — informe_cierre mal cardinado (||--o| en vez de ||--o{), M6 — HCE-IC: Informe de Cierre Anual

### Community 30 - "fingerprint.js"
Cohesion: 0.40
Nodes (3): { chromium }, fs, path

## Knowledge Gaps
- **199 isolated node(s):** `IPPU_ITEMS`, `LIKERT_LBL`, `COMP`, `NNA`, `protScores` (+194 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **124 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Modelo de datos HCE IPPU (PostgreSQL + JSONB) — propuesta` connect `Arquitectura objetivo y criterios de aceptacion` to `HCE-00 e identificacion del NNA`, `Reglas operativas del Documento Tecnico`, `HCE-IC — Informe de Cierre Anual (único infor...`, `Documentos de contexto del proyecto`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `analiticaAgregados()` connect `Catalogos IDEA/IPPU-TEA y reglas de puntaje` to `Motor de flujo y firma (M1)`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `Reglas de negocio en triggers y funciones PL/pgSQL` connect `Reglas operativas del Documento Tecnico` to `Arquitectura objetivo y criterios de aceptacion`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Are the 23 inferred relationships involving `ORMModel` (e.g. with `DimensionOut` and `EscalaOut`) actually correct?**
  _`ORMModel` has 23 INFERRED edges - model-reasoned connections that need verification._
- **Are the 18 inferred relationships involving `Base` (e.g. with `EvaluacionArea` and `EvaluacionGeneral`) actually correct?**
  _`Base` has 18 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `Escala del Inventario del Espectro Autista (IDEA)` (e.g. with `IDEA como Instrumento 0 / línea base (no se repite anualmente)` and `~150 evaluaciones IDEA históricas sin consolidar`) actually correct?**
  _`Escala del Inventario del Espectro Autista (IDEA)` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `IPPU_ITEMS`, `LIKERT_LBL`, `COMP` to the rest of the system?**
  _199 weakly-connected nodes found - possible documentation gaps or missing edges._