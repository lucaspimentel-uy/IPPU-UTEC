# Plan modular — Adaptar la demo L1 al Documento Técnico IPPU (julio 2026)

> ⚠️ **NOTA (2026-10-05, sesión M11.3-0) — la sección «M11» de este plan está SUPERADA.** El orden M11.3 →
> M11.4 → M11.5 → M11.6 y las decisiones de entrada de M11 (la «puerta» de validar con IPPU, la línea base
> única) ya no rigen: **manda `backend/docs/esquema-datos-v2.md` §5** (plan en rebanadas verticales) y las
> entradas **`handoff.md` §5.93–§5.106** (respuestas escritas de IPPU del 2026-10-05; §5.106 reemplaza el
> orden de M11). El resto del plan (M0–M10) es el registro de una ronda de demo ya cerrada. **El cuerpo no
> se reescribe**: se deja como registro de lo que se pensó en julio de 2026.

> **Para Claude Code.** Este documento se lee junto con `handoff.md` y `CLAUDE.md`. Fuente normativa
> de esta ronda: `docs/markdown/1_documento-tecnico-utec-lidia.md` (convertir desde
> `1_Documento_Tecnico_UTEC-LIDIA.md` si no está aún) y, como referencia de UX/interacción,
> `HCE_IPPU_Prototipo_v1.html` (no se copia código de ahí sin revisar — ver §Precauciones).
>
> **Objetivo de esta ronda:** adaptar la demo (`implementacion/L1-hce-idea/demo/hce_idea_ippu_demo.html`)
> al modelo del documento técnico de IPPU (v1.0, julio 2026), **incluso donde entra en conflicto con
> el diseño previo documentado en `handoff.md`**. El diseño anterior puede cambiar; el documento nuevo
> es la fuente que prevalece en caso de conflicto. El backend (FastAPI, Fases 0-2 ya construidas) **no
> se toca en esta ronda** — ver §No-goals y §Anexo A.
>
> **Revisión 2:** incorpora la revisión de `modelo-datos.md` (propuesta de esquema Postgres+JSONB de
> un integrante del equipo). Se trata como propuesta registrada, no adoptada — ver §Anexo A. No cambia
> nada de los módulos M0-M10 (son 100% demo/frontend); agrega M11 como trabajo de backend, deliberadamente
> pospuesto y con puerta de entrada explícita.

---

## 0. Decisiones cerradas (no re-discutir, ya validadas con el responsable del proyecto)

| # | Decisión |
|---|---|
| 1 | El documento técnico de julio 2026 convive con la presentación 13.05.2026, **pero en caso de conflicto, el documento técnico gana**. Ejemplo de conflicto ya identificado: frecuencia del IDEA (ver M4). |
| 2 | **"Evaluación por áreas" y "Evaluación general" se descartan** como módulos activos. No se sigue invirtiendo en ellos. Se tratan como archivo histórico de solo lectura (según §10 del documento técnico), no como funcionalidad a mantener. |
| 3 | **Taller Terapéutico y Clínica quedan fuera de alcance.** Todo lo de esta ronda es exclusivamente Servicio de Atención Diurna. Si algo de la demo actual (p. ej. el heatmap "talleres × escalas") corresponde en realidad a Taller Terapéutico, no se extiende ni se profundiza — solo no se rompe lo que ya funciona. |
| 4 | Validar la tabla de categorización del baremo VF contra la normativa vigente: **hecho parcialmente.** El Decreto N.º 72/025 (25/02/2025, publicado 14/03/2025) que aprueba el "Baremo Único Nacional de Discapacidad" es real y está vigente, reglamentando la Ley N.º 20.378/2024. Su anexo con la tabla de cortes porcentuales no está indexado como texto público (es un anexo separado en IMPO) y no pude confirmarlo byte a byte. La estructura que usa el documento técnico (0–4 % / 5–24 % / 25–49 % / 50–95 % / 96–100 %) coincide con el esquema estándar de clasificación CIF/OMS usado en baremos comparables de la región. **Recomendación:** implementar la tabla tal como está en el documento (ya está pensada como tabla parametrizable, no hardcodeada — ver M9), y que alguien de IPPU confirme los cortes exactos contra el anexo del Decreto 72/025 antes de un uso clínico real. No bloquea la demo. |
| 5 | Roles de técnicos responsables (`tecnico1_rol` / `tecnico2_rol`): **optar por lo simple.** No se construye UI de configuración de roles institucional en esta ronda. Se instancian fijos como "Psicólogo/a" y "Maestro/a" (como ya lo hace la demo actual). Sí conviene nombrar los campos de datos de forma genérica desde ahora (`tecnico1`, `tecnico1_rol`, etc.) para que generalizar después sea un cambio de configuración, no de esquema — pero eso es un detalle de implementación, no una feature nueva. |
| 6 | La propuesta `modelo-datos.md` (Postgres + JSONB, triggers) **queda registrada, no adoptada.** No reemplaza el backend actual ni se fusiona a este sprint. Se retoma recién en M11, con las correcciones y decisiones de arquitectura del §Anexo A ya resueltas. |

## Cómo proceder: ¿arrancar de cero o continuar? (respuesta corta, para que quede escrita)
**No se arranca de cero, ni en la demo ni en el backend.** Lo que cambió es el *contenido* del modelo (qué módulos y campos existen), no el *enfoque* de cómo se construye:
- **Demo:** sigue siendo iteración incremental sobre el archivo existente, versión a versión (como v3.1→v3.3), tal como describen M0-M10 abajo. Nada de esto se reescribe de cero.
- **Backend:** el motor (FastAPI + SQLAlchemy + Alembic, routers, Pydantic, los 12 tests existentes) **se conserva**. Lo que quedó desactualizado es el *esquema* (porque el documento de IPPU cambió el modelo clínico), no la *herramienta*. Eso es una evolución de esquema, no una reescritura del backend.
- La propuesta de un integrante (`modelo-datos.md`) mezcla dos preguntas que conviene separar: (a) *"¿qué tablas necesito para el modelo nuevo de IPPU?"* — esto sí es obligatorio, tarde o temprano — y (b) *"¿deberíamos migrar a Postgres+JSONB con lógica en triggers?"* — esto es una propuesta de arquitectura, no algo que el documento de IPPU exija. Por eso el rediseño de esquema se pospone a M11, **después** de que la demo (al menos M0-M6) esté validada con IPPU: mejor decidir la arquitectura del backend con el modelo clínico ya estable, que rediseñarla dos veces.

## No-goals de esta ronda (explícito, para no scope-creep)
- **No tocar el backend FastAPI/SQLAlchemy** (Fases 0-2 ya commiteadas) todavía. Esta ronda (M0-M10) es 100% demo/frontend. El rediseño del esquema de datos para reflejar el modelo nuevo (tabla `idea` sin atadura a año, tablas `protocolo`, `informe_cierre`, `documento`, `foto`, `organismo_inau`, `organismo_bps`, `valoracion_funcional`, `auditoria`) es real y necesario, pero queda como M11, deliberadamente después de validar la demo con IPPU — ver §Anexo A.
- No construir HCE-LOG como tabla de auditoría real ni con persistencia — alcanza con una vista de solo-lectura simulada que demuestre el concepto (quién/cuándo/qué campo).
- No construir el módulo de kappa/confiabilidad interjueces (el propio documento lo marca "fase piloto", no fase A).
- No construir autenticación real, roles configurables por institución, ni persistencia (sigue siendo demo con datos en memoria, como hasta ahora).
- No modificar el heatmap de talleres existente ni nada relacionado a Taller Terapéutico.

## Precauciones sobre el prototipo de la fundación (`HCE_IPPU_Prototipo_v1.html`)
Es material generado con Fable 5 pero de calidad alta: las funciones de cálculo (`ideaTotales`, `protTotales`, `deltaInterpreta`) coinciden exactamente con las reglas del documento técnico, y verifiqué que varias de las citas legales del documento (Ley 20.378/2024, Decreto 72/025, Decreto 242/017 HCEN) son reales y están citadas correctamente. Aun así:
- Úsenlo como **referencia de interacción y de reglas de negocio**, no como fuente de copy-paste masivo. Reimplementar cada función y volver a verificarla contra el §5 del documento técnico.
- Las citas **académicas** de la Escala IPPU-TEA (autores/años junto a cada ítem) no están verificadas — son de bajo riesgo funcional (referencia documental, no bloquean lógica) pero no darlas por ciertas si en algún momento se muestran a un profesional externo.
- El diseño visual (paleta, tipografía) es solo inspiración; no es brandbook oficial de IPPU.

---

## Módulos (orden de implementación sugerido)

Cada módulo es una unidad revisable por separado — recomiendo cerrar y verificar (Playwright, como ya vienen haciendo) antes de pasar al siguiente. Versión sugerida de la demo entre paréntesis.

### M0 — Housekeeping y desmantelamiento (v3.4)
- Convertir `1_Documento_Tecnico_UTEC-LIDIA.md` y `HCE_IPPU_Prototipo_v1.html` a `docs/markdown/` (conversor_docling) y archivar los originales en `docs/fuentes/`.
- Actualizar `handoff.md`: nueva sección de bitácora, registrar las 5 decisiones de §0 de este plan, y actualizar §7 (preguntas abiertas) quitando las que ya se resolvieron.
- **Quitar de la navegación activa** "Evaluación por áreas" y "Evaluación general" (botones en el expediente, entradas de sidebar si las hubiera). No hace falta borrar el código todavía; alcanza con no exponerlo. Se termina de resolver como archivo histórico en M7 (una vez exista HCE-DOC).
- Verificación: la demo sigue cargando sin errores de consola; Playwright de regresión sobre lo existente sigue en verde.

### M1 — Motor de flujo (estado + firma + bloqueo) (v3.4 o v3.5)
Infraestructura compartida por LB, PA, PB e IC. Construir **antes** de tocar esos módulos, porque hoy la demo no tiene el concepto de firma/bloqueo.
- Estado de módulo: `bloqueado | borrador | firmado`, con helper de UI reutilizable (algo como `estadoBadge()`, `stepper` de secuencia CI→LB→PA→PB→IC, similar en espíritu al `.stepper` del prototipo de referencia pero reimplementado).
- Firma digital = bloqueo de edición. Corrección posterior = addenda (fecha, profesional, justificación), no edición directa.
- **Habilitación excepcional:** cualquier módulo bloqueado por secuencia puede habilitarse pidiendo una constancia breve del motivo; queda registrada (mock de HCE-LOG). Única excepción sin esta vía: CI.
- HCE-LOG: vista de solo lectura simulada (no persistente) que lista estas excepciones y firmas, a modo demostrativo.
- Verificación: crear un caso demo donde se intente firmar PA sin LB firmado, disparar habilitación excepcional, confirmar que queda registrada y visible.

### M2 — HCE-00: Identificación y Anamnesis (v3.5)
- Extender el paso "Anamnesis" que ya existe en el wizard de alta, para que sea un módulo propio, siempre editable (no se bloquea nunca, a diferencia de los demás).
- Campos: datos generales, diagnóstico, CIE-11, nivel de soporte orientativo, técnicos responsables (fijos: Psicólogo/a + Maestro/a, según decisión §0.5), anamnesis completa.
- Verificación: editar HCE-00 de un NNA con otros módulos ya firmados y confirmar que sigue editable sin afectar los módulos bloqueados.

### M3 — HCE-CI: Consentimiento informado (v3.5)
- Único módulo con bloqueo **sin excepción posible**. Nada se evalúa (LB, PA, PB, IC) sin CI firmado.
- Campos: firmante, fecha, adjunto (mock), estado.
- Verificación: intentar abrir LB de un NNA sin CI firmado → debe estar bloqueado, sin opción de habilitación excepcional (a diferencia de los demás módulos).

### M4 — HCE-LB: IDEA como línea base única (v3.6 — el más delicado)
Este es el módulo que **cambia de arquitectura**, no solo de nombre. Reescribir sobre el módulo IDEA actual:
- **Quitar la lógica anual** (selector de año, KPI "Con IDEA 2026", repetición por período). El IDEA pasa a aplicarse **una sola vez al ingreso**. Regla de reingreso: si pasaron más de 12 meses desde la baja, corresponde un IDEA nuevo — modelarlo como una nueva instancia de HCE-LB, no como "IDEA del año X".
- Mantener lo que ya funciona bien de la demo actual: las 12 dimensiones con descriptores oficiales, badges de puntaje, cálculo de totales por escala y total.
- Agregar lo que falta según el documento: sesiones de observación, síntesis clínica, objetivos del período, marca "migrado del sistema anterior" (para si en el futuro se migran los ~150 IDEA históricos), firma doble (usa el motor de M1).
- Validaciones de integridad para firmar: 12 dimensiones puntuadas sin NS/vacíos, fecha de consenso, síntesis, objetivos. Validaciones recomendadas (advierten, no bloquean): ≥5 sesiones de observación, extensión sugerida de síntesis.
- **Impacto en datos existentes de la demo:** los NNA seed actuales tienen IDEA por año — hay que decidir cómo se ven en el nuevo modelo (probablemente: tomar el IDEA más antiguo de cada NNA seed como su línea base única, y descartar las repeticiones anuales del dataset de prueba).
- Verificación: reproducir el ciclo del "usuario demo 1" que describe el documento técnico y comparar resultados numéricos — es el criterio de aceptación que el propio documento sugiere para esta fase.

### M5 — HCE-PA / HCE-PB: Escala IPPU-TEA (v3.7)
Reemplaza la "Evaluación intermedia Likert" provisional (3 ítems/dimensión) que tenían planificada. Instrumento nuevo, más específico:
- 24 ítems (4 escalas × 6 ítems), Likert 1–5, lógica de **progreso** (inversa al IDEA: 1 = regresión, 5 = progreso generalizado).
- Protocolo A (aplicación de julio) y Protocolo B (fin de año) son la misma estructura de ítems, dos instancias.
- Observación cualitativa **obligatoria** en todo ítem puntuado 1 o 5.
- Totales por escala (6–30) y total (24–120).
- **Delta (Δ) = B − A**, por escala y total, calculado automáticamente al firmar B. Δ ≤ −7 en una escala dispara alerta institucional.
- **Regla dura, a nivel de lógica no solo de UI:** nunca calcular ni mostrar delta entre IDEA y IPPU-TEA, nunca superponer ambos perfiles en un mismo gráfico. Son constructos no homologables. Sugerencia: encapsular esto en una función/guard que sea imposible de saltear desde otro punto del código (ej. `calcularDelta(protocoloA, protocoloB)` que solo acepta dos objetos del mismo tipo `protocolo`, nunca uno `idea`).
- Validaciones de integridad para firmar: 24 ítems puntuados, fecha, fundamentación en ítems 1 o 5, síntesis de ambos técnicos. Recomendadas: ≥15 semanas de asistencia efectiva.
- Verificación: firmar Protocolo A y B de un mismo NNA, confirmar que el delta se calcula solo, que un delta ≤ −7 dispara la alerta, y que no hay ningún camino en la UI para comparar contra el IDEA.

### M6 — HCE-IC: Informe de Cierre Anual (v3.8)
- Requiere LB, PA y PB firmados (o habilitación excepcional).
- Tabla comparativa y radar autogenerados desde los datos ya firmados (pueden ser SVG simples, no hace falta una librería — el prototipo de referencia usa `radarSVG()` como inspiración, reimplementar).
- Síntesis cualitativa por escala, valoraciones anuales, recomendaciones, orientaciones a la familia.
- Firma doble + "Recibí" de la familia.
- Exportación PDF con membrete vía `@media print` (mismo patrón que ya usan para el informe actual) — es "el único informe válido", no se generan versiones alternativas.
- Verificación: generar el informe de un NNA con LB+PA+PB firmados, confirmar que tabla y radar reflejan los datos reales, exportar a PDF.

### M7 — HCE-DOC: Documentos y fotos (v3.9)
- Adjuntos categorizados (informes externos, documentos de organismos, autorizaciones, **registros históricos del sistema anterior**).
- Fotos individuales condicionadas a autorización de imagen registrada.
- **Ahora sí, resolver formalmente el descarte de M0:** migrar (simulado) los datos seed de "Evaluación por áreas"/"Evaluación general" a un par de documentos de ejemplo bajo la categoría "Registro histórico — HCE anterior", de solo lectura, con fecha original. Esto demuestra el patrón de migración del §10 del documento sin mantener esos módulos como funcionalidad activa.
- Verificación: subir una foto individual sin autorización registrada → debe bloquearse con mensaje claro de qué falta.

### M8 — HCE-ORG: Áreas INAU y BPS (v3.10)
- Por NNA: INAU (SIPI, convenio, referente, registro de informes enviados) y BPS (prestación, trámite, estado, vencimiento, registro de gestiones).
- Verificación: alta de un registro de gestión BPS y de un envío de informe INAU, visibles en el expediente del NNA.

### M9 — HCE-VF: Valoración funcional (v4.0)
- Registro de valoración oficial (BUND): estado, fecha, organismo, %, vigencia, RNPcD.
- Tabla de categorización configurable (ver decisión §0.4 — usar la tabla del documento, dejarla como constante fácil de editar, no hardcodeada en múltiples lugares).
- Perfil funcional CIF: 6 dominios con niveles de autonomía (Autónomo/Apoyo ocasional/Apoyo frecuente/Apoyo permanente) + 3 campos narrativos.
- **Salvaguarda dura:** prohibido autocalcular % o categoría del baremo desde puntajes IDEA/IPPU-TEA. Igual que en M5, encapsular esto de forma que no se pueda saltear.
- Autogeneración descriptiva (borrador editable, nunca números crudos) y Reporte de Valoración Funcional imprimible para la familia.
- Verificación: generar un reporte con datos parciales (secciones vacías no deben aparecer) y confirmar que ningún cálculo cruza HCE-VF con puntajes clínicos.

### M10 — Cierre de ronda: transversales y QA (v4.0)
- Búsqueda por las 3 vías (cédula, N.º HCE, grupo — hoy falta "grupo" como vía de búsqueda directa).
- Recordatorios configurables (no bloqueantes) para los períodos del Manual.
- Pasada completa de Playwright sobre el flujo de punta a punta de un NNA (CI→LB→PA→PB→IC) más los módulos nuevos (DOC/ORG/VF).
- Actualizar `README.md` (tabla de módulos ya está bien, no requiere cambios) y cerrar `handoff.md` con el estado nuevo.

### M11 — Backend v2: rediseño de esquema (pospuesto, fuera de esta ronda)
**Puerta de entrada: no arranca hasta que M0-M6 estén validados con IPPU** (al menos el cambio de IDEA a línea base única, que es el que más impacta el esquema). Cuando llegue el momento:
1. Cerrar primero las 3 decisiones de arquitectura del §Anexo A (SQLite vs. Postgres-only para dev, dónde vive la lógica de negocio, alcance real de portabilidad) como decisión de equipo explícita, no por default.
2. Tomar `modelo-datos.md` como punto de partida solo después de corregir los bugs A y B del Anexo A.
3. Diseñar el esquema v2 con el modelo clínico ya estable (post-demo), no en paralelo a M0-M10.
4. Migrar los datos seed existentes; correr los 12 tests actuales contra el esquema nuevo antes de dar por cerrada la migración (si cambia dónde vive la lógica de negocio, van a hacer falta tests nuevos para lo que hoy está en Pydantic/servidor y pasaría a triggers, o viceversa).
5. Recién ahí, Fase 3 original del roadmap (conectar la demo a la API) tiene sentido — no antes.

---

## Anexo A — Revisión de `modelo-datos.md` (propuesta Postgres + JSONB de un integrante)

**Estado: registrada, no adoptada.** No se fusiona a este sprint ni reemplaza el backend actual. Documentado acá para que quede trazable quién propuso qué y por qué se pospone — no para descartarlo: tiene partes buenas.

**Lo que está bien:** el mapeo de reglas duras es correcto (delta B−A exclusivo de `protocolo`, categoría del baremo derivada solo de `pct`, auditoría de solo-inserción, protección de imagen), identifica bien la cardinalidad de IDEA como línea base única (coherente con M4), y las preguntas abiertas que deja anotadas (HCE por año vs. por persona, kappa para fase piloto, migración) son las correctas.

**Bugs de modelado a corregir antes de usarlo como base (no son de coordinación, son errores del diagrama):**
- **A. `informe_cierre` mal cardinado.** Está como `HCE_DIURNA ||--o| INFORME_CIERRE` (a lo sumo uno en toda la vida del NNA), pero el propio documento lo llama "Informe de Cierre **Anual**" — se repite cada año junto con cada ciclo PA/PB. Debería ser `||--o{`, igual que `PROTOCOLO`. Tal como está, el esquema no permite cerrar más de un ciclo anual por NNA en toda su historia en Atención Diurna.
- **B. `PERSONA ||--|| HCE_DIURNA` como 1:1 obligatorio** contradice el §3.1 que el propio documento cita (una persona puede tener registros en varios servicios bajo una sola identidad — por eso existe `persona_servicio`). Forzar `hce_diurna` como obligatorio le cierra la puerta a esa flexibilidad. Probablemente sea un descuido de notación en el Mermaid, pero hay que confirmarlo contra el DDL real antes de dar el esquema por bueno.

**Decisiones de arquitectura que quedaron implícitas en el documento y deben decidirse explícitamente como equipo, no adoptarse porque ya están escritas:**
1. **SQLite (dev) → Postgres (prod), ya decidido en `handoff.md`, vs. Postgres-only.** JSONB + GIN + triggers PL/pgSQL no corren en SQLite. Adoptar el esquema tal cual implica desarrollar siempre contra Postgres (adelantar la Fase 6 de Docker+Postgres). No es necesariamente malo, pero es una reversión de una decisión ya registrada y debe tratarse como tal.
2. **Dónde vive la lógica de negocio.** El esquema pone las reglas duras en triggers de base de datos; la Fase 2 ya construida las calcula en el servidor FastAPI (Pydantic). Tener la misma regla en dos lenguajes (PL/pgSQL y Python) es riesgo de divergencia, y los 12 tests actuales no cubren nada de lo que pasaría en triggers. Elegir una capa, no repartir por quién programó qué.
3. **Alcance de portabilidad institucional.** El esquema construye ya toda la capa de `config_institucion`, `vocabulario`, `recordatorio_config`, `baremo_categoria` paramétricos — que es la arquitectura "portable a otras instituciones" completa. La decisión §0.5 de este plan fue explícitamente "lo más simple por ahora" para roles. Definir si esto se adelanta a propósito o se pospone junto con el resto de portabilidad.

**Nota de numeración:** el documento se autotitula "propuesta **Fase 1**", que es una quinta cosa distinta a los otros 4 usos de "fase" que ya conviven en el proyecto (roadmap backend 0-6, roadmap IPPU A-D, alcance-servicio Fase 1/2 de IPPU, y ahora esto). Vale la pena resolver la nomenclatura antes de que seguir sumando "fases" genere errores reales de comunicación.

---

## Orden sugerido de sesiones con Claude Code
M0+M1 → M2+M3 → M4 (solo, por ser el más riesgoso) → M5 → M6 → M7 → M8 → M9 → M10. M11 es una ronda aparte, después de validar con IPPU — no se agenda todavía.

Cada corte es un buen punto para que lo revises antes de seguir, especialmente después de M4 (cambia el comportamiento de un módulo que ya "andaba" y tiene datos seed existentes) y después de M5 (introduce la regla dura de no-homologabilidad, vale la pena chequearla a mano).
