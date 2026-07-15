**FUNDACIÓN IPPU**

Instituto Psico Pedagógico Uruguayo

INAU · MSP · BPS · ECOSOC/ONU · Montevideo, Uruguay

**DOCUMENTO TÉCNICO · CONVENIO IPPU – UTEC-LIDIA**

**Historia Clínica Electrónica: Sistema de Evaluación y Seguimiento TEA**

Especificación funcional y técnica para el equipo de la Licenciatura en Ingeniería de Datos e Inteligencia Artificial (UTEC)

Versión 1.0 · Julio de 2026

Documento de trabajo — acompaña al prototipo funcional HCE\_IPPU\_Prototipo\_v1.html

Elaborado por la Dirección de la Fundación IPPU

Distribución: equipo técnico UTEC-LIDIA · uso profesional

## 1. Objeto, contexto y alcance

La Fundación IPPU (Instituto Psico Pedagógico Uruguayo), con más de cuarenta años de trayectoria en la atención de niños, niñas, adolescentes y jóvenes con Trastorno del Espectro Autista (TEA), requiere el desarrollo de una **Historia Clínica Electrónica (HCE)** que soporte su Sistema Integrado de Evaluación y Seguimiento TEA. Este documento especifica los requerimientos funcionales, las reglas de negocio, el modelo de datos sugerido y los criterios de calidad del sistema, y acompaña al prototipo HTML funcional que constituye la referencia visual e interactiva del comportamiento esperado.

**Alcance de la Fase 1:** el Servicio de Atención Diurna, con el ciclo completo de evaluación (línea base IDEA, protocolos semestrales, informe de cierre anual), la gestión documental, las áreas de organismos (INAU/BPS), la valoración funcional (BUND/CIF) y los reportes. Los servicios de Taller Terapéutico y Clínica quedan reservados en la arquitectura de navegación y permisos para la Fase 2, con estructuras de registro propias a definir.

**Criterio rector de diseño — herramienta dúctil y portable:** el sistema orienta y sugiere, pero no impone. Los plazos son recordatorios configurables, la secuencia de instrumentos es el camino por defecto pero admite excepciones documentadas, y los roles profesionales son genéricos e instanciables por cada institución. La herramienta debe poder ser adoptada por instituciones con modelos de trabajo distintos al de IPPU sin modificaciones de código.

## 2. Marco normativo vinculante

| **Norma**                                                                            | **Relevancia para el sistema**                                                                                                                                                               |
|--------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Ley N.º 18.331/2008 (Protección de Datos Personales)                                 | Los datos de la HCE son datos sensibles: consentimiento explícito, cifrado en reposo y en tránsito, minimización de acceso.                                                                  |
| Ley N.º 18.335/2008 (Derechos de los Pacientes)                                      | Derecho de la familia a acceder a la HCE mediante solicitud formal; historia clínica como documento único.                                                                                   |
| Ley N.º 17.823/2004 (Código de la Niñez y la Adolescencia, art. 11)                  | Protección de la imagen de NNA: la carga de fotografías exige autorización registrada; las grupales, autorización de todas las familias.                                                     |
| Ley N.º 18.418/2008 (Convención sobre los Derechos de las Personas con Discapacidad) | Enfoque de derechos y modelo social; prohibición de usos discriminatorios de los datos.                                                                                                      |
| Ley N.º 20.378/2024 y Decreto 72/025 (Baremo Único Nacional de Discapacidad)         | Marco de la valoración funcional: instrumentos IBMF, IRSA y BUND; Registro Nacional de Personas con Discapacidad (MIDES).                                                                    |
| Decreto N.º 242/017 (Historia Clínica Electrónica Nacional — HCEN, Salud.uy)         | Principios de finalidad, veracidad, completitud, reserva, información y accesibilidad. El sistema debe diseñarse alineado a estos principios para facilitar una eventual integración futura. |
| Código de Ética del Psicólogo (SoMePsi)                                              | Secreto profesional sobre toda la información registrada.                                                                                                                                    |

## 3. Arquitectura funcional

### 3.1 Entidades principales

- **Persona (identidad única institucional):** un mismo NNA puede tener registros en más de un servicio (Atención Diurna, Taller, Clínica) bajo una sola identidad.
- **Grupo de referencia:** unidad de atención y de planificación. Toda la intervención del Servicio de Atención Diurna es grupal. El grupo tiene técnicos responsables asignados, integrantes y registro fotográfico propio.
- **HCE individual:** conjunto de módulos por NNA, con habilitación secuencial guiada y firma que bloquea (ver §4).
- **Técnicos responsables (rol genérico):** dos evaluadores por grupo, con etiqueta de rol configurable por institución (campos tecnico1\_rol / tecnico2\_rol). IPPU los instancia como Psicólogo/a y Maestro/a del grupo. El invariante metodológico es que sean dos evaluadores que puntúan de forma independiente y luego consensúan: es la base del control de confiabilidad interjueces.

### 3.2 Módulos de la HCE (Atención Diurna)

| **Código**      | **Módulo**                         | **Contenido y comportamiento**                                                                                                                                                                                                                           |
|-----------------|------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| HCE-00          | Identificación y anamnesis         | Datos generales, diagnóstico, CIE-11, nivel de soporte orientativo, técnicos responsables, anamnesis completa. Siempre abierto y actualizable.                                                                                                           |
| HCE-CI          | Consentimiento informado           | Autorización de la familia (evaluación, registro, comunicación a organismos). Requisito legal previo a todo módulo de evaluación; único bloqueo sin excepción posible.                                                                                   |
| HCE-LB          | Línea base — IDEA                  | 12 dimensiones (0–8, impares intermedios, opción NS), totales automáticos por escala (0–24) y total (0–96), criterios de anclaje consultables por dimensión, síntesis clínica, objetivos, marca de «migrado del sistema anterior», firma doble.          |
| HCE-PA / HCE-PB | Protocolos A y B — Escala IPPU-TEA | 24 ítems Likert 1–5 con referencias clínicas, observación obligatoria para valores 1 y 5, totales por escala (6–30) y total (24–120), síntesis de ambos técnicos, aportes de otros técnicos, deltas automáticos en B.                                    |
| HCE-IC          | Informe de Cierre Anual            | Tabla comparativa autogenerada, radares, síntesis cualitativa por escala, valoraciones anuales, recomendaciones, orientaciones a la familia, firma doble y «Recibí» de la familia. Exportación PDF con membrete: documento clínico legal, versión única. |
| HCE-DOC         | Documentos y fotos                 | Adjuntos categorizados (informes externos, documentos de organismos, autorizaciones, registros históricos del sistema anterior) y fotografías individuales condicionadas a la autorización de uso de imagen.                                             |
| HCE-ORG         | Áreas INAU y BPS                   | Por NNA: SIPI, convenio, referente, registro de informes enviados (INAU); prestación, trámite, estado, vencimiento, registro de gestiones (BPS).                                                                                                         |
| HCE-VF          | Valoración funcional (BUND/CIF)    | Registro de la valoración oficial, perfil funcional descriptivo, autogeneración de borrador, guía orientativa de prestaciones y Reporte de Valoración Funcional autónomo para la familia (ver §7).                                                       |
| HCE-LOG         | Auditoría                          | Registro automático e inalterable: quién, cuándo, qué campo, valor anterior y nuevo. Incluye las constancias de excepción. Solo lectura.                                                                                                                 |

### 3.3 Búsqueda y navegación

La HCE de un NNA debe poder localizarse por tres vías indistintas: cédula de identidad, número de historia clínica o grupo de referencia (adicionalmente por nombre). Estos tres campos requieren índices en base de datos. La navegación alternativa es grupo → integrante → HCE.

## 4. Flujo de trabajo: guiado, no impuesto

### 4.1 Secuencia por defecto

CI firmado → habilita LB · LB firmado → habilita PA · PA firmado → habilita PB · PB firmado → habilita IC. La firma digital de un módulo lo bloquea para edición; toda corrección posterior se realiza por addenda con fecha, profesional y justificación.

### 4.2 Habilitación excepcional

Cualquier módulo bloqueado por secuencia puede habilitarse mediante el mecanismo de **habilitación excepcional** : el sistema solicita una constancia breve del motivo (ingreso tardío, reingreso, licencia del equipo, situación familiar) y la registra en HCE-LOG. La excepción nunca se oculta: queda trazada. Única excepción no admitida: operar sin consentimiento informado firmado.

### 4.3 Validaciones: integridad vs. recomendaciones

| **Módulo**      | **Integridad (requeridos para firmar)**                                                                                                  | **Recomendados (advierten y piden constancia; no bloquean)**                                  |
|-----------------|------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------|
| HCE-LB (IDEA)   | 12 dimensiones puntuadas (sin NS ni vacíos) · fecha de consenso · síntesis clínica · objetivos del período                               | ≥ 5 sesiones de observación previas · extensión sugerida de la síntesis (≈200 palabras)       |
| HCE-PA / HCE-PB | 24 ítems puntuados · fecha · fundamentación obligatoria en ítems con valor 1 o 5 · síntesis de ambos técnicos responsables               | ≥ 15 semanas de asistencia efectiva · extensión sugerida (≈150 palabras por síntesis)         |
| HCE-IC          | LB, PA y PB firmados (o habilitación excepcional) · síntesis por escala · valoraciones anuales · recomendaciones · orientaciones · fecha | Elaboración próxima al cierre del Protocolo B · extensión sugerida (≈100 palabras por escala) |

### 4.4 Recordatorios configurables

Los períodos del Manual (aplicación del IDEA en las primeras semanas del ingreso, Protocolo A en el receso de julio, Protocolo B en la última semana lectiva, Informe de Cierre en los días posteriores) se implementan como recordatorios en el panel institucional, configurables por coordinación. Nunca como fechas límite bloqueantes.

## 5. Instrumentos y reglas de cálculo

### 5.1 IDEA (Rivière, 2001) — Instrumento 0, línea base

- 12 dimensiones organizadas en 4 escalas: Relación Social (D1–D3), Comunicación y Lenguaje (D4–D6), Anticipación y Flexibilidad (D7–D9), Simbolización (D10–D12).
- Puntuación por dimensión: 0, 2, 4, 6, 8; valores impares (1, 3, 5, 7) para casos claramente intermedios; «NS» cuando la observación es insuficiente (impide el cierre del módulo).
- Totales automáticos: por escala (0–24) y total (0–96), con verificación visible por el evaluador antes de firmar.
- Cada dimensión ofrece un panel desplegable de consulta con «qué evalúa» y los criterios de anclaje de los niveles 8/6/4/2/0 (síntesis operativa; el instrumento íntegro se adjunta en la documentación institucional).
- Interpretación orientativa del total (perfil y nivel de soporte DSM-5-TR) con lecturas neutras que aluden a las escalas del IDEA, nunca a técnicas o métodos (ver §8.2). Terminología: «severo / muy severo», nunca «grave».
- El IDEA se aplica al ingreso; no se repite anualmente. Reingreso tras más de 12 meses: nuevo IDEA.

### 5.2 Escala IPPU-TEA — Instrumentos 1 y 2 (Protocolos A y B)

- Instrumento propio de IPPU: 4 escalas × 6 ítems = 24 ítems, Likert de progreso 1–5 (1 regresión significativa … 5 progreso generalizado). Lógica inversa al IDEA.
- Totales por escala 6–30; total 24–120. Observación cualitativa obligatoria en todo ítem puntuado 1 o 5.
- Delta (Δ) = Protocolo B − Protocolo A, por escala (rango −24 a +24) y total (−96 a +96), calculado automáticamente al firmar B, con interpretación y acción sugerida por rango. Δ ≤ −7 en una escala dispara alerta institucional.

**Regla dura de no homologabilidad:** los puntajes IDEA (severidad, 0–96) y los puntajes IPPU-TEA (progreso, 24–120) no son comparables ni convertibles. El sistema jamás calcula deltas entre instrumentos distintos, jamás superpone ambos perfiles en un mismo gráfico (los radares se presentan por separado) y jamás deriva porcentajes del baremo desde puntajes clínicos. Esta regla debe implementarse a nivel de lógica de negocio, no solo de interfaz.

### 5.3 Informe de Cierre Anual — Instrumento 3

Integra los tres instrumentos con la síntesis cualitativa del equipo. La tabla comparativa y los gráficos de radar se autogeneran desde los datos firmados. El PDF exportado con membrete y firma digital es el único informe válido: no se elaboran versiones alternativas para organismos supervisores.

## 6. Modelo de datos sugerido

Esquema conceptual de referencia (la implementación física —relacional, documental o mixta— queda a criterio del equipo UTEC, respetando las entidades, cardinalidades y reglas):

- **persona** { id, nombre, fnac, ci, sexo, servicios[] } — identidad única transversal a los servicios.
- **grupo** { id, nombre, anio, tecnico1\_id, tecnico1\_rol, tecnico2\_id, tecnico2\_rol, otros\_tecnicos[] } — etiquetas de rol configurables por institución.
- **hce\_diurna** { persona\_id, hc (histórico preservado como identificador secundario), grupo\_id, anio, diag, cie11, nivel\_soporte, anamnesis{} }.
- **consentimiento** { hce\_id, firmante, fecha, adjunto\_id, estado } · **autorizacion\_imagen** { hce\_id, estado, fecha, adjunto\_id }.
- **idea** { hce\_id, fecha, sesiones\_obs, dim[12]{ valor 0–8 | NS, obs }, totales calculados, sintesis, objetivos, migrado\_origen{}, firmas[2], excepciones[], estado }.
- **protocolo** { hce\_id, tipo A|B, fecha, semanas, item[24]{ valor 1–5, obs }, totales, sint\_tecnico1, sint\_tecnico2, otros, ajustes(B), deltas(B), firmas[2], excepciones[], estado }.
- **informe\_cierre** { hce\_id, fecha, sint\_escala[4], sint\_tecnico1, sint\_tecnico2, recomendaciones, orientaciones, recibi\_familia, pdf\_id, firmas[2], estado }.
- **documento** { hce\_id, categoria, nombre, fecha\_original, fecha\_carga, archivo\_id } · **foto** { hce\_id | grupo\_id, descripcion, fecha, archivo\_id }.
- **organismo\_inau** { hce\_id, sipi, convenio, referente, ingreso, obs, envios[] } · **organismo\_bps** { hce\_id, prestacion, tramite, estado, vencimiento, obs, gestiones[] }.
- **valoracion\_funcional** { hce\_id, estado, fecha, organismo, pct, categoria (derivada de tabla configurable), vigencia, rnpcd, dominios{6}, capacidades, barreras, apoyos, sintesis\_funcional, obs }.
- **auditoria** { hce\_id, usuario, timestamp, modulo, campo, valor\_anterior, valor\_nuevo, tipo (edición | firma | excepción | acceso) } — solo inserción.

## 7. Módulo HCE-VF: valoración funcional y reporte a la familia

1. **IPPU registra, no certifica:** la valoración oficial la realizan los equipos habilitados (MSP, MIDES, BPS) mediante el BUND; el módulo registra estado, fecha, organismo, porcentaje, vigencia y RNPcD. En menores de 2 años no aplica el BUND (solo IBMF e IRSA).
2. **Categorización configurable:** la tabla de categorías (Sin discapacidad 0–4 % · Leve 5–24 % · Moderado 25–49 % · Severo 50–95 % · Muy severo 96–100 %) se implementa como tabla parametrizable, a validar contra la reglamentación vigente del Consejo Asesor al momento del desarrollo.
3. **Perfil funcional en clave CIF:** seis dominios de la vida diaria con niveles simples de autonomía (Autónomo / Apoyo ocasional / Apoyo frecuente / Apoyo permanente) y tres campos narrativos: capacidades y fortalezas, barreras del entorno, apoyos y facilitadores. Breve por diseño: no duplica los instrumentos clínicos.
4. **Autogeneración descriptiva:** un botón construye el borrador de síntesis funcional en lenguaje natural a partir del perfil IDEA por escala (fortaleza relativa / necesidad de apoyo) y de la evolución cualitativa de los protocolos (frases descriptivas, nunca números crudos ni porcentajes). Sugiere niveles de autonomía editables solo en los tres dominios con correlato clínico directo (comunicación ← E2; interacciones ← E1; aprendizaje ← E4). El borrador exige siempre revisión de los técnicos responsables.
5. **Salvaguarda dura:** prohibido autocalcular la categoría o el porcentaje del baremo desde puntajes IDEA/IPPU-TEA. Constructos no equivalentes.
6. **Reporte de Valoración Funcional autónomo:** documento imprimible para la familia, generable a demanda en cualquier momento del año, de carácter descriptivo: capacidades primero, autonomía en palabras, evolución cualitativa, barreras y apoyos, estado de la valoración oficial y orientación de prestaciones. Se arma con los campos existentes (las secciones vacías no aparecen) y aclara expresamente que no es certificado ni informe clínico.
7. **Guía de prestaciones:** contenido informativo estático mantenido por coordinación (RNPcD, AYEX, Asignación Familiar, pensión, asistentes personales del Sistema de Cuidados, transporte, cuota laboral, apoyos educativos). No genera expedientes ni flujos de trámite.
8. **Alerta única del módulo:** vencimiento/revisión de la valoración oficial, a 90 y 30 días.

## 8. Reglas transversales de producto

### 8.1 Terminología cuidada

En pantallas, informes PDF y textos autogenerados se emplea siempre «severo / muy severo» o «alta necesidad de apoyo»; nunca «grave / muy grave». Implementar como constante de vocabulario del sistema para que ningún módulo futuro la contradiga. La nomenclatura de instrumentos oficiales externos puede diferir; la de IPPU no.

### 8.2 Neutralidad metodológica

El sistema no prescribe técnicas ni métodos de intervención: será utilizado por profesionales de formaciones diversas y, eventualmente, por otras instituciones. Las lecturas orientativas aluden exclusivamente a las escalas y dimensiones del IDEA; la elección del abordaje corresponde a cada profesional. Las citas bibliográficas de los ítems de la Escala IPPU-TEA se mantienen como referencia documental, no como indicación.

### 8.3 Portabilidad institucional

Roles genéricos («Técnico/a responsable 1 y 2») con etiqueta configurable; textos sin supuestos del modelo IPPU; parámetros institucionales (nombres de servicios, categorías documentales, tabla del baremo, recordatorios) editables por configuración. Invariante metodológico único: dos evaluadores independientes con consenso posterior.

### 8.4 Protección de imagen de NNA

Carga de fotos individuales condicionada a la autorización de uso de imagen registrada (con copia del documento en HCE-DOC). Carga de fotos grupales condicionada a que todas las familias del grupo tengan autorización registrada; el sistema informa qué integrantes faltan. Recomendado: marca de agua institucional en exportaciones.

## 9. Seguridad, permisos y auditoría

| **Perfil**                      | **Acceso permitido**                                                                                            | **Acceso denegado**                                  |
|---------------------------------|-----------------------------------------------------------------------------------------------------------------|------------------------------------------------------|
| Técnicos responsables del grupo | HCE completa de los integrantes de su grupo; escritura en módulos habilitados; firma                            | HCE de otros grupos; historial de cambios            |
| Otros técnicos habilitados      | Campos de texto libre de PA, PB e IC donde participan                                                           | Puntajes; síntesis clínicas; datos de identificación |
| Coordinación institucional      | Lectura de módulos firmados de todos los grupos; escritura en HCE-00; administración de nóminas y recordatorios | Modificación de módulos firmados                     |
| Dirección / administración      | Datos estadísticos agregados sin identificación; cumplimiento de recordatorios                                  | HCE individuales                                     |

- Autenticación con roles y expiración de sesión; cifrado de datos sensibles en reposo y en tránsito (Ley 18.331).
- Auditoría de solo inserción (HCE-LOG) que registra ediciones, firmas, accesos, cargas/descargas de documentos y constancias de excepción.
- Firma digital de módulos con bloqueo; addendas trazadas; generación de PDF con membrete para HCE-IC.
- Módulo de confiabilidad interjueces (fase piloto): captura de puntuaciones independientes por evaluador y cálculo del kappa de Cohen por ítem; alertas con κ &lt; 0,61; umbral aceptable κ ≥ 0,61; sesiones de calibración documentadas.
- Respaldo y plan de recuperación; conservación conforme a la normativa vigente sobre historias clínicas.

## 10. Migración desde la HCE actual de IPPU

IPPU cuenta con una HCE en uso. El único componente semánticamente equivalente entre ambos sistemas es el IDEA; los demás registros (Evaluación por áreas, Evaluación General, Observaciones) tienen formatos distintos y no deben forzarse a los campos del sistema nuevo.

| **Componente del sistema actual**                         | **Estrategia**                                                                                                                                                                                                                                  |
|-----------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| IDEA (línea base)                                         | Migración estructurada al módulo HCE-LB con marca de origen «migrado del sistema anterior», fecha original y verificación contra el registro fuente (doble control por muestreo). Documento original adjunto en HCE-DOC.                        |
| Evaluación por áreas · Evaluación General · Observaciones | Archivo histórico de solo lectura: exportación certificada del sistema actual, carga en HCE-DOC con categorías específicas «Registro histórico — HCE anterior» y fecha original. Consultable, nunca editable ni mapeado a campos estructurados. |
| Datos identificatorios                                    | Migración estructurada con validación de duplicados por CI y N.º de HCE; el N.º histórico se preserva como identificador secundario.                                                                                                            |

Procedimiento estándar: (1) inventario y clasificación; (2) fecha de corte con paso del sistema anterior a solo lectura; (3) período de coexistencia acotado; (4) verificación por muestreo con acta firmada; (5) acta de cierre del sistema anterior; (6) conservación del respaldo íntegro; (7) metadatos de origen en cada registro migrado.

## 11. Prototipo de referencia y usuarios demo

El archivo **HCE\_IPPU\_Prototipo\_v1.html** es la referencia interactiva de este documento: implementa todos los módulos, cálculos, validaciones, la habilitación excepcional, la autogeneración descriptiva y los reportes imprimibles. Incluye cuatro usuarios ficticios que cubren los estados del flujo: ciclo anual completo (demo 1), ciclo en curso con Protocolo A en borrador (demo 2), ingreso reciente con IDEA en borrador y dimensiones NS (demo 3) y consentimiento pendiente con módulos no habilitados (demo 4). La sección «Especificaciones técnicas» del propio prototipo resume estas reglas.

**Diferencias deliberadas del prototipo respecto del sistema definitivo:** sin persistencia (datos en memoria del navegador), sin autenticación, firma simulada, umbrales de extensión reducidos para demostrar el flujo, kappa no implementado (solo especificado) y archivos disponibles solo durante la sesión.

## 12. Hoja de ruta sugerida y criterios de aceptación

1. **Fase A — Núcleo clínico:** personas, grupos, HCE-00, HCE-CI, HCE-LB, HCE-PA/PB, HCE-IC, cálculos y deltas, firma con bloqueo, flujo guiado con excepciones, HCE-LOG. Aceptación: reproducir de punta a punta el ciclo del usuario demo 1 del prototipo con resultados numéricos idénticos.
2. **Fase B — Documental y organismos:** HCE-DOC con fotos y reglas de imagen, HCE-ORG, búsqueda por tres vías, vista de grupos, recordatorios configurables. Aceptación: reglas de autorización de imagen verificadas con casos negativos.
3. **Fase C — Valoración funcional y reportes:** HCE-VF completo, autogeneración descriptiva, Reporte de Valoración Funcional, reportes institucionales, exportación PDF. Aceptación: reporte generable con datos parciales; salvaguarda anti-conversión verificada.
4. **Fase D — Migración y piloto:** importadores (IDEA estructurado + legado documental), módulo kappa, verificación por muestreo, capacitación y puesta en producción con período de coexistencia.

Contraparte institucional: Dirección de la Fundación IPPU. Se sugiere un ritmo de revisiones quincenales sobre incrementos funcionales navegables, tomando el prototipo como contrato visual de comportamiento.