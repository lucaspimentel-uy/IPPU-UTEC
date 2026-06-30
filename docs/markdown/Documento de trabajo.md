# Lineamientos generales

### Fase 1. Diagnóstico de datos y procesos actuales

## Esta fase es clave para el proyecto 1, pero también alimenta a los otros tres. Hay que hacer un relevamiento preciso:

## Qué datos tiene IPPU actualmente: historias clínicas, fichas, protocolos, evaluaciones, registros de sesiones, informes, pictogramas ya usados, materiales para familias, documentos institucionales y bases de datos.

## Cómo están esos datos: papel, Word, PDF, Excel, sistema informático, carpetas, imágenes, registros narrativos, formularios estructurados o notas libres.

## Quién los usa: psicólogos, psicopedagogos, terapeutas, dirección, familias, administración.

## Qué problemas existen: duplicación, datos incompletos, falta de estandarización, dificultad para buscar información, imposibilidad de comparar casos, ausencia de dashboards, uso disperso de instrumentos.

## Producto de esta fase: un mapa de datos y procesos IPPU, que diga exactamente qué se puede usar, qué no se puede usar todavía y qué debe anonimizarse.

## Fase 2: Priorización de los proyectos

| ## Prioridad   | ## Proyecto                                       | ## Motivo                                                                          |
|----------------|---------------------------------------------------|------------------------------------------------------------------------------------|
| ## 1           | Historia clínica, protocolo IDEA y datos clínicos | Es la base estructural de todo el ecosistema                                       |
| ## 2           | Asistente virtual                                 | Puede construirse con documentos validados y bajo riesgo si se limita bien         |
| ## 3           | Pictogramas personalizados                        | Tiene alto impacto directo para familias y usuarios                                |
| ## 4           | Patrones de visualización / eye-tracking          | Tiene alto potencial, pero requiere diseño experimental y validación más cuidadosa |

## 

## 

## Hoja de ruta por proyecto

### Proyecto 1: Historia clínica, protocolo IDEA y analítica institucional

#### Fase 0 — Entender lo que ya existe

*Antes de escribir una sola línea de código.*

Hay una demo de la HCE en YouTube (youtube.com/watch?v=dMWfc0JKCC0) — mirar en detalle. Lo que necesitamos mapear:

- ¿Cómo están estructurados los NNA en la base actual?
- ¿El formulario IDEA ya existe parcialmente o hay que construirlo desde cero?
- ¿Qué esquema de autenticación usan hoy?

Paralelamente, pedirle a IPPU dos cosas críticas: acceso al repositorio de la HCE y el esquema de base de datos actual. Sin eso, todo lo que hagamos puede chocar con lo que ya tienen.

También conviene leer el inventario IDEA de Ángel Rivière para entender las 12 dimensiones clínicamente, no solo como campos de formulario.

**Meses 1 a 2:** relevar formularios, historias clínicas, protocolo IDEA, evaluaciones e informes. Definir campos mínimos: identificación anonimizada, edad, sexo si corresponde, fecha de ingreso, diagnóstico o motivo de consulta, instrumentos aplicados, objetivos terapéuticos, evolución, frecuencia de intervención y observaciones relevantes.

**Meses 3 a 4:** construir una base inicial anonimizada. No hace falta empezar con IA compleja. Primero hay que tener datos limpios, consistentes y consultables.

**Meses 5 a 6:** crear dashboards para el equipo IPPU: cantidad de casos, distribución por edad, instrumentos aplicados, frecuencia de seguimiento, campos faltantes, tiempos entre evaluación e intervención, evolución de objetivos.

**Meses 7 a 12:** explorar procesamiento de lenguaje natural para extraer información de notas clínicas. En esta etapa recién tendría sentido probar modelos para clasificar textos, detectar criterios clínicos o sugerir alertas de seguimiento.

**Producto esperado:** sistema mínimo de gestión y análisis de datos clínicos, con tablero institucional y protocolo de anonimización.

### 

### Proyecto 2: Pictogramas personalizados con IA

**Meses 1 a 2:** relevar cómo IPPU usa hoy pictogramas: qué sistemas emplea, qué limitaciones encuentra, qué situaciones necesitan personalización y qué criterios visuales son indispensables.

**Meses 3 a 4:** diseñar una primera biblioteca de categorías: personas, objetos, rutinas, emociones, espacios, actividades, normas y transiciones.

**Meses 5 a 6:** construir un prototipo donde se puedan generar pictogramas a partir de imágenes o prompts controlados. El sistema no debería quedar abierto sin revisión: cada pictograma generado debe poder ser aprobado, corregido o descartado por un profesional.

**Meses 7 a 12:** realizar pruebas con familias y profesionales. Medir claridad visual, utilidad, aceptación, consistencia gráfica y facilidad de uso.

**Producto esperado:** prototipo funcional de generación asistida de pictogramas personalizados, con validación profesional antes del uso.

### 

### Proyecto 3: Asistente virtual para funcionarios y familias

**Meses 1 a 2:** definir qué puede y qué no puede responder el asistente. Esta delimitación es crítica. Debe quedar excluido el diagnóstico, la indicación terapéutica individual, la interpretación de casos particulares y cualquier decisión clínica.

**Meses 3 a 4:** construir una base de conocimiento inicial con documentos validados por IPPU: preguntas frecuentes, información institucional, orientaciones generales sobre TEA, pautas para familias, protocolos internos y materiales de apoyo.

**Meses 5 a 6:** desarrollar un prototipo tipo RAG, es decir, un asistente que responda consultando documentos autorizados y no “inventando” respuestas.

**Meses 7 a 9:** probarlo con funcionarios primero. Esto reduce riesgo. Luego, si funciona bien, se puede abrir una versión acotada para familias.

**Meses 10 a 12:** medir calidad de respuestas, errores, consultas derivadas, satisfacción de usuarios y reducción de carga administrativa.

**Producto esperado:** asistente virtual con base documental gobernada, respuestas citadas, límites claros y derivación a humano.

### 

### Proyecto 4: Sistema de patrones de visualización / eye-tracking

**Meses 1 a 2:** definir qué se quiere observar. Por ejemplo: atención a rostros, seguimiento de mirada, preferencia por objetos, respuesta ante pictogramas, atención conjunta, reconocimiento emocional o comprensión de escenas sociales.

**Meses 3 a 4:** diseñar el protocolo experimental. Esto debe incluir estímulos, duración de la prueba, condiciones de aplicación, edad de participantes, consentimiento informado, criterios de exclusión y forma de anonimización.

**Meses 5 a 6:** construir un piloto técnico de bajo costo con cámara web o dispositivo accesible. Primero se debe probar si los datos capturados tienen calidad suficiente.

**Meses 7 a 12:** aplicar una prueba piloto pequeña y analizar patrones básicos: mapas de calor, zonas de interés, tiempo de fijación, secuencia de mirada y diferencias entre grupos o perfiles.

**Producto esperado:** protocolo piloto de análisis de mirada y visualización, con evidencia inicial sobre su viabilidad técnica y clínica.

# Proyecto 1 - IDEA/HCE

HCE-IDEA

Inicio de sesion (con usuario pre creado)

Barra de Navegación

- inicio-NNA– Listado de NNA y posibilidad de registrar un nuevo niño y nueva evaluacion idea.
- Registrar NNA – Datos del NNA, Datos Clinicos, Anamnesis luego Confirmacion.
- Evaluacion Idea
- Ealuacion por areas
- Evaluacion general
- Informes
- Analisis Institucional
- Grupos — Grupos- Nombre de el grupo, Integrantes, Dias de clase, Encargados, Por grupo: Datos Basicos, Integrantes, Observaciones.
- Usuarios- Informacion personal del usuario actual.

[https://fundacionippu.uy/](https://fundacionippu.uy/) Reestructurar Pagina actual

- Implementar Asistente Virtual
- Implementar Pestaña Contacto, con derivacion a wpp

# Proyecto 2: PICTOGRAMAS

## Análisis exhaustivo: generación y uso de pictogramas para personas con TEA

### 1. Punto de partida: ¿por qué los pictogramas son relevantes en TEA?

Los pictogramas son representaciones visuales simplificadas de objetos, acciones, emociones, personas, rutinas o situaciones. En el campo del TEA se utilizan dentro de los **Sistemas Aumentativos y Alternativos de Comunicación** —CAA o AAC, por sus siglas en inglés— para apoyar a personas con dificultades en la comunicación oral, en la comprensión verbal, en la anticipación de actividades o en la organización de rutinas.

En el documento base del IPPU se afirma que la CAA es “vital” para personas con TEA no verbales y que la IA puede mejorar significativamente la eficiencia de estos sistemas. Allí se plantea como línea concreta el desarrollo de un **sistema de generación de pictogramas personalizados con IA generativa** , usando fotos familiares y técnicas de transformación visual para mantener consistencia con sistemas existentes como ARASAAC.

Esto es importante porque, en muchos casos, la dificultad no está solo en “tener pictogramas”, sino en que esos pictogramas sean **comprensibles, funcionales, culturalmente pertinentes y emocionalmente significativos** para la persona que los usa. Un pictograma genérico de “casa”, “taza”, “baño” o “escuela” puede no coincidir con el entorno real del niño, niña o adolescente. La presentación institucional de IPPU–UTEC identifica precisamente ese problema: los sistemas estándar no siempre reflejan el contexto cotidiano, los objetos reales ni la cultura visual rioplatense del NNA.

### 2. Diferencia entre pictograma estándar y pictograma personalizado

Un **pictograma estándar** pertenece a un banco general de símbolos. El ejemplo más importante en español es ARASAAC, portal del Gobierno de Aragón que ofrece símbolos y recursos para comunicación aumentativa y alternativa. ARASAAC distribuye sus pictogramas bajo licencia Creative Commons BY-NC-SA, lo que permite su reutilización con condiciones de atribución, uso no comercial y compartir bajo la misma licencia.

Un **pictograma personalizado** , en cambio, se construye a partir del entorno real del usuario: su casa, su taza, su terapeuta, su mochila, su salón, su baño, su patio, sus familiares, sus rutinas y sus objetos cotidianos. Esto puede aumentar la relevancia funcional del sistema de comunicación porque reduce la distancia entre el símbolo y la experiencia concreta de la persona.

La hipótesis fuerte para IPPU debería ser esta: **la personalización contextual de pictogramas puede mejorar la comprensión, la apropiación y el uso efectivo del sistema CAA, siempre que el diseño sea clínicamente supervisado y no meramente automático** .

### 3. Problema central que debe resolver IPPU–UTEC/LIDIA

El problema no es únicamente tecnológico. Es clínico, pedagógico, comunicacional y organizacional.

Hoy el uso de pictogramas suele enfrentar varias limitaciones:

Primero, los pictogramas genéricos pueden no representar adecuadamente el mundo cotidiano del NNA. Un niño puede no reconocer como “su baño” un baño genérico, o no asociar una taza estándar con la taza que usa en su casa o en el taller.

Segundo, la personalización manual requiere mucho tiempo profesional. Buscar imágenes, editarlas, simplificarlas, imprimirlas, plastificarlas, ordenarlas y adaptarlas a cada caso consume horas que podrían destinarse a la intervención directa.

Tercero, puede existir discontinuidad entre institución, familia y centro educativo. El pictograma usado en IPPU puede no ser el mismo que se usa en la casa o en la escuela.

Cuarto, los bancos internacionales pueden tener sesgos culturales o visuales. No todos los objetos, alimentos, espacios o prácticas cotidianas del contexto uruguayo aparecen representados de forma adecuada.

Quinto, la generación automática con IA introduce nuevos riesgos: pictogramas visualmente atractivos pero clínicamente confusos, inconsistentes, con demasiados detalles, con errores culturales o con elementos que distraen.

Por eso, el proyecto debe formularse como **sistema de apoyo a la comunicación** , no como simple generador de imágenes.

### 4. Evidencia y antecedentes internacionales relevantes

La línea de trabajo de IPPU no surge en el vacío. En la presentación institucional se mencionan antecedentes como QuickPic AAC, Draffan et al., EasyRead Image Generation, AMBRA, PicTalky y ARASAAC como referencias para pensar la generación o adaptación de pictogramas con IA.

El caso más directamente comparable es **QuickPic AAC** , una aplicación que genera tableros de comunicación aumentativa a partir de fotografías. El artículo de ACM CHI 2024 presenta QuickPic como una aplicación móvil co-diseñada con fonoaudiólogos y educadores especiales para producir tableros AAC específicos a partir de fotos, con el objetivo de apoyar el aprendizaje de lenguaje en personas con comunicación oral limitada.

La versión clínica publicada sobre QuickPic AAC describe la aplicación como una herramienta basada en IA para generar, de manera “just-in-time”, tableros de vocabulario específicos a partir de fotografías. Esto es muy relevante para IPPU porque muestra que el flujo “foto real → vocabulario relevante → tablero CAA” ya tiene antecedentes revisados por pares.

Otro antecedente importante es el trabajo de **Draffan et al.** , que analiza cómo la IA puede apoyar adaptaciones de símbolos pictográficos para CAA. La referencia aparece tanto en el documento IPPU como en la presentación de la línea 2.

Más recientemente, **EasyRead Image Generation** propone orientar modelos generativos hacia pictogramas de accesibilidad cognitiva. El trabajo advierte un punto clave: los modelos de difusión actuales tienden a producir imágenes con exceso de detalle e inestabilidad estilística, lo cual puede ser problemático para pictogramas, que requieren claridad, simplicidad y consistencia visual.

Este punto es central para el análisis: **la mejor imagen generada por IA no necesariamente es el mejor pictograma** . Un pictograma debe ser comprensible, estable, simple, funcional y consistente dentro de un sistema de comunicación.

### 5. Qué debería analizar IPPU antes de construir el sistema

La Guía de Relevamiento ya incluye preguntas específicas sobre comunicación y pictogramas: si IPPU utiliza actualmente CAA, qué sistema usa, si personaliza pictogramas, dónde los almacena y qué limitaciones encuentra con los pictogramas actuales.

Ese relevamiento debe ampliarse con una matriz específica para esta línea. IPPU y LIDIA deberían relevar:

**Uso actual:** qué pictogramas se usan, con qué NNA, en qué talleres, con qué frecuencia, para qué funciones comunicativas y con qué resultados observables.

**Sistemas existentes:** si usan ARASAAC, Widgit, pictogramas propios, fotografías reales, tableros físicos, tableros digitales o aplicaciones externas.

**Nivel de personalización:** si los pictogramas son iguales para todos o si se adaptan por edad, perfil sensorial, comprensión, rutina familiar, nivel comunicativo o intereses.

**Flujo institucional:** quién decide qué pictograma usar, quién lo diseña, quién lo valida, quién lo imprime o sube al sistema, quién lo entrega a la familia y quién evalúa su uso.

**Problemas detectados:** baja comprensión, rechazo, pérdida de materiales, falta de actualización, exceso de pictogramas, inconsistencias entre familia e institución, falta de continuidad en la escuela.

**Necesidades prioritarias:** rutinas, emociones, alimentación, higiene, dolor, transición de actividades, espera, turnos, talleres, familia, escuela, transporte, juego, crisis, autorregulación y anticipación.

### 6. Usos principales de pictogramas en personas con TEA

Para IPPU, el análisis debería organizar los usos en al menos seis funciones.

La primera función es **comunicación expresiva** . El pictograma permite pedir, elegir, rechazar, señalar preferencias, expresar necesidades o iniciar una interacción. Por ejemplo: “agua”, “baño”, “quiero descansar”, “me duele”, “no quiero”, “más”, “terminé”.

La segunda función es **comprensión y anticipación** . Muchos NNA con TEA se benefician de apoyos visuales para comprender qué va a ocurrir, en qué orden y durante cuánto tiempo. Aquí entran agendas visuales, secuencias de actividades, rutinas de taller, rutinas de higiene o anticipación de cambios.

La tercera función es **regulación emocional y conductual** . Los pictogramas pueden ayudar a identificar emociones, reconocer estados corporales, elegir estrategias de calma o comunicar malestar antes de una crisis.

La cuarta función es **aprendizaje de habilidades sociales y adaptativas** . Pueden apoyar normas sociales, turnos, espera, saludo, pedido de ayuda, participación en talleres, preparación para salidas o interacción con pares.

La quinta función es **autonomía en la vida diaria** . Sirven para descomponer tareas: lavarse las manos, preparar una merienda, ordenar materiales, vestirse, usar el baño, cocinar o desplazarse dentro de una institución.

La sexta función es **coordinación interinstitucional** . Un mismo sistema de pictogramas puede circular entre IPPU, familia y escuela, generando continuidad comunicativa.

### 7. Dónde entra la IA generativa

La IA puede apoyar el sistema en cuatro niveles.

Primero, puede ayudar a **convertir fotos reales en imágenes pictográficas** . Este sería el núcleo del proyecto: tomar una imagen del entorno real y transformarla en una representación visual simple, limpia y consistente.

Segundo, puede ayudar a **detectar objetos y escenas** . Por ejemplo, a partir de una foto de una cocina, el sistema podría sugerir vocabulario: “mesa”, “vaso”, “comer”, “agua”, “sentarse”, “esperar”.

Tercero, puede ayudar a **etiquetar y organizar pictogramas** . Cada pictograma debería tener metadatos: categoría, función comunicativa, nivel de abstracción, contexto de uso, NNA asociado, fecha de creación, profesional validador y relación con pictogramas estándar.

Cuarto, puede ayudar a **recomendar vocabulario** según el perfil del NNA, sus rutinas y sus registros de uso. Esta parte no debería implementarse al inicio, pero puede ser una línea futura.

La presentación de IPPU–UTEC describe un pipeline técnico muy alineado con esto: captura de imágenes, preprocesamiento, segmentación, estilización con IA, etiquetado mediante procesamiento de lenguaje natural y creación de una biblioteca personal accesible para técnico, familia y docente.

### 8. Riesgo principal: confundir imagen personalizada con buen pictograma

Este es probablemente el punto más importante del análisis.

Un pictograma para TEA no debe ser evaluado por su belleza visual, sino por su **funcionalidad comunicativa** . La IA puede generar imágenes atractivas, pero con demasiados detalles, fondos confusos, estilos variables, expresiones ambiguas o elementos irrelevantes. EasyRead Image Generation señala precisamente que los modelos de difusión pueden generar imágenes excesivamente detalladas y poco estables para usos de accesibilidad cognitiva.

Por eso, IPPU debería definir criterios técnicos y clínicos de calidad. Un pictograma útil debería ser:

claro;
 simple;
 estable en estilo;
 sin elementos distractores;
 reconocible para el NNA;
 coherente con otros pictogramas del sistema;
 culturalmente pertinente;
 validado por un profesional;
 probado con el usuario;
 ajustable según respuesta real.

Esto implica que la IA no debe “aprobar” pictogramas. La IA debe **proponer** , y el equipo técnico debe **validar** .

### 9. Modelo recomendado para IPPU: sistema híbrido

Para IPPU no recomendaría empezar con un sistema 100% generativo y abierto. Recomendaría un modelo híbrido con tres fuentes:

**Banco estándar:** ARASAAC u otro sistema validado para conceptos generales.

**Fotografía real:** para objetos, personas, espacios y rutinas altamente significativas.

**Pictograma generado o estilizado con IA:** cuando se necesita simplificar una foto real, crear una versión más clara o mantener consistencia visual.

El flujo ideal sería:

1. El profesional identifica una necesidad comunicativa.
2. Busca si existe un pictograma estándar adecuado.
3. Si no alcanza, toma o solicita una foto del entorno real.
4. El sistema genera una versión pictográfica.
5. El profesional revisa claridad, pertinencia y seguridad.
6. Se prueba con el NNA.
7. Se registra en la biblioteca personal.
8. Se comparte con familia y/o docente.
9. Se evalúa uso, comprensión y adherencia.
10. Se ajusta o descarta si no funciona.

### 10. Dimensiones éticas y de privacidad

Esta línea trabaja con datos especialmente sensibles: imágenes de niños, adolescentes, familias, hogares, escuelas, terapeutas y contextos de vida cotidiana. El documento general del proyecto IPPU advierte la necesidad de anonimización, consentimiento informado, privacidad, mitigación de sesgos e interpretabilidad en el uso de IA clínica.

En pictogramas, esto se traduce en reglas muy concretas:

No usar fotos de rostros o familiares sin consentimiento explícito.
 No subir imágenes sensibles a servicios externos sin evaluación jurídica y técnica.
 No usar imágenes del hogar sin informar riesgos.
 No permitir que estudiantes trabajen con fotos identificables.
 No entrenar modelos con datos de NNA sin autorización.
 No publicar ejemplos reales sin anonimización o recreación.
 No usar IA para inferir diagnósticos desde imágenes.
 No generar pictogramas que representen castigos, restricciones o intervenciones aversivas.

La Guía de Relevamiento incluye preguntas sobre consentimiento informado, anonimización, restricciones legales y eventual aprobación ética, lo cual debería incorporarse directamente al diseño del proyecto.

### 11. Propuesta de arquitectura funcional para el sistema

El sistema podría organizarse en cinco módulos.

**Módulo 1: captura y carga de imágenes.** Permite subir fotos tomadas por profesionales o familias, con consentimiento asociado. Debe admitir imágenes de objetos, espacios o rutinas, evitando por defecto rostros identificables salvo justificación clínica.

**Módulo 2: edición y simplificación.** Elimina fondo, segmenta el objeto principal, reduce ruido visual y genera versiones simplificadas

. **Módulo 3: generación pictográfica.** Usa un modelo image-to-image o una API de generación controlada para transformar la imagen en un pictograma de estilo consistente.

**Módulo 4: validación profesional.** El técnico revisa la imagen, edita etiqueta, categoría, uso recomendado, nivel de dificultad y destinatario.

**Módulo 5: biblioteca personal y trazabilidad.** Guarda pictogramas por NNA, rutina, taller, familia, docente, fecha, versión y estado: propuesto, validado, en uso, descartado o reemplazado.

La presentación IPPU–UTEC ya propone tecnologías compatibles con esta arquitectura, como Python, OpenCV, rembg, Stable Diffusion, DALL-E API, Hugging Face, FastAPI, React Native, PostgreSQL y Firebase Storage.

### 12. Indicadores para evaluar si el pictograma funciona

El proyecto no debería medirse por “cantidad de pictogramas generados”. Eso sería un error. Debe medirse por impacto comunicativo y utilidad clínica.

Indicadores posibles:

comprensión del pictograma por parte del NNA;
 uso espontáneo;
 uso con ayuda;
 tiempo necesario para enseñar el pictograma;
 frecuencia de uso semanal;
 reducción de frustración comunicativa;
 capacidad de generalización entre IPPU, hogar y escuela;
 satisfacción de familia;
 satisfacción del equipo técnico;
 tiempo ahorrado en producción de materiales;
 número de pictogramas descartados por baja claridad;
 consistencia entre pictogramas generados;
 mejora en anticipación de rutinas;
 mejora en participación en talleres.

La evaluación debería combinar observación clínica, registro de uso, entrevistas breves a familias y validación del equipo interdisciplinario.

### 13. Diseño de un MVP viable para LIDIA–UTEC

El primer MVP no debería intentar resolver todo el universo de CAA. Debería ser acotado, clínicamente manejable y técnicamente demostrable.

**MVP recomendado:** “Generador validado de pictogramas personalizados para rutinas institucionales y familiares prioritarias”.

Alcance inicial:

10 a 15 NNA participantes;
 3 a 5 rutinas prioritarias;
 50 a 100 pictogramas generados;
 validación profesional obligatoria;
 biblioteca digital simple;
 exportación a PDF o tablero imprimible;
 registro de uso y comprensión.

Rutinas sugeridas para empezar:

higiene;
 alimentación;
 entrada y salida de IPPU;
 taller de cocina;
 taller de comunicación;
 emociones básicas;
 pedido de descanso;
 transiciones entre actividades.

Este MVP permitiría mostrar valor sin caer en una promesa clínica exagerada.

### 14. Hoja de ruta específica para esta línea

#### Fase 1 — Diagnóstico y relevamiento

Duración: 4 semanas.

Objetivo: entender cómo IPPU usa hoy pictogramas y qué problemas reales quiere resolver.

Productos:

inventario de pictogramas existentes;
 mapa de sistemas usados;
 lista de rutinas prioritarias;
 criterios clínicos de calidad;
 protocolo de consentimiento para imágenes;
 selección de casos piloto.

Esta fase debe apoyarse directamente en las preguntas de la Guía de Relevamiento sobre CAA, personalización, almacenamiento y limitaciones actuales.

#### Fase 2 — Diseño clínico-comunicacional

Duración: 4 semanas.

Objetivo: definir para qué se usarán los pictogramas y bajo qué criterios.

Productos:

taxonomía de pictogramas;
 categorías comunicativas;
 niveles de abstracción;
 criterios de diseño visual;
 criterios de validación profesional;
 plantilla de ficha de pictograma.

Ejemplo de ficha:

nombre del pictograma;
 concepto representado;
 categoría: objeto, acción, emoción, persona, lugar, rutina;
 función: pedir, rechazar, anticipar, elegir, regular, narrar;
 fuente: ARASAAC, foto real, IA, híbrido;
 NNA asociado;
 profesional validador;
 fecha;
 estado de uso;
 observaciones.

#### Fase 3 — Desarrollo técnico del prototipo

Duración: 8 a 12 semanas.

Objetivo: construir una primera herramienta funcional.

Componentes:

carga de foto;
 segmentación del objeto;
 generación de versión pictográfica;
 edición de etiqueta;
 validación profesional;
 guardado en biblioteca;
 exportación imprimible.

En esta fase conviene comparar varias opciones: ARASAAC como base, modelos image-to-image, edición manual asistida, y herramientas comerciales o abiertas. No se debería depender de una única API sin evaluar costos, privacidad y sostenibilidad.

#### Fase 4 — Piloto controlado

Duración: 8 semanas.

Objetivo: probar pictogramas con un grupo pequeño de usuarios.

Diseño mínimo:

pretest de comprensión;
 uso durante rutina seleccionada;
 observación de interacción;
 registro de uso;
 entrevista breve a técnico y familia;
 ajuste del pictograma;
 postest de comprensión y utilidad.

#### Fase 5 — Evaluación y escalamiento

Duración: 4 a 8 semanas.

Objetivo: decidir si el sistema se escala, se rediseña o se limita a ciertos usos.

Productos:

informe de resultados;
 matriz de pictogramas validados;
 criterios de descarte;
 manual de uso para IPPU;
 recomendaciones para familias;
 propuesta de integración con HCE o asistente virtual.

### 15. Relación con las otras líneas del proyecto IPPU–UTEC

Esta línea no debería quedar aislada. La presentación institucional propone sinergias entre las cuatro líneas: los pictogramas pueden registrarse en la HCE como parte del plan comunicativo del NNA, y el asistente virtual podría recomendar o entregar pictogramas personalizados durante una conversación.

Eso permite pensar una arquitectura integrada:

La **HCE** registra qué pictogramas usa cada NNA.
 El **generador de pictogramas** crea y valida apoyos visuales.
 El **asistente virtual** orienta a familias y docentes sobre cómo usarlos.
 El **sistema de visualización** muestra patrones de uso, avances y necesidades.

Esta integración es clave porque transforma los pictogramas en datos clínico-pedagógicos trazables: no solo se crean, sino que se observa cuándo se usan, con qué frecuencia, en qué contextos y con qué resultados.

### 16. Riesgos técnicos, clínicos y organizacionales

Los principales riesgos son los siguientes.

**Riesgo de sobreproducción:** generar demasiados pictogramas puede saturar al NNA y al equipo. La personalización debe ser gradual.

**Riesgo de inconsistencia visual:** si cada pictograma tiene un estilo diferente, el sistema pierde coherencia.

**Riesgo de baja comprensibilidad:** una imagen generada puede parecer clara para un adulto, pero no para el usuario.

**Riesgo de privacidad:** fotos de hogares, familiares o rostros pueden exponer información sensible.

**Riesgo de sustitución profesional:** la IA no debe decidir qué necesita comunicar el NNA.

**Riesgo de dependencia tecnológica:** si el sistema requiere conexión permanente, licencias costosas o APIs externas, puede ser difícil sostenerlo.

**Riesgo de evidencia insuficiente:** los documentos del convenio advierten que muchas aplicaciones de IA generativa en TEA siguen en fase experimental o de prototipo, con necesidad de validación clínica rigurosa, mayor diversidad demográfica y más representación del Sur Global.

### 17. Posicionamiento académico del proyecto

Este proyecto tiene mucho potencial para LIDIA porque combina:

visión computacional;
 IA generativa;
 procesamiento de lenguaje natural;
 diseño centrado en el usuario;
 accesibilidad cognitiva;
 ética de datos;
 validación con población real;
 impacto social;
 producción académica aplicada.

Además, el resumen ejecutivo del convenio IPPU–UTEC/LIDIA destaca que una de las áreas proyectadas es la **Comunicación Aumentativa y Alternativa** , con sistemas adaptativos con IA generativa, procesamiento de lenguaje natural en español rioplatense y predicción de necesidades comunicativas personalizadas.

La contribución diferencial no sería “hacer otro banco de pictogramas”, sino producir evidencia local sobre **pictogramas personalizados con IA en contexto uruguayo** , con usuarios reales, supervisión clínica y metodología rigurosa.

### 18. Tesis central para tu análisis

Podrías cerrar el análisis con una idea fuerte como esta:

La generación de pictogramas personalizados con IA para personas con TEA no debe entenderse como una automatización gráfica, sino como una tecnología de apoyo a la comunicación que debe integrarse a un sistema clínico, pedagógico y familiar de CAA. Su valor no reside en producir imágenes rápidamente, sino en facilitar apoyos visuales comprensibles, contextualizados y validados, capaces de mejorar la comunicación funcional, la anticipación de rutinas, la autonomía y la continuidad entre institución, familia y escuela.

### 19. Recomendación final para IPPU–UTEC/LIDIA

Mi recomendación es iniciar con un **piloto acotado, supervisado y evaluable** , no con una aplicación abierta para todas las familias desde el primer día.

El primer objetivo debería ser:

**Diseñar, implementar y evaluar un prototipo de generación asistida de pictogramas personalizados para rutinas prioritarias de NNA con TEA en IPPU, integrando IA generativa, validación profesional, criterios de accesibilidad cognitiva y registro de uso en una biblioteca individual.**

Ese enfoque es técnicamente viable para LIDIA, clínicamente razonable para IPPU y académicamente defendible como proyecto de innovación aplicada.

# Cómo interviene la IA Generativa?

## 1. Cómo interviene la IA generativa en el proceso

En el proyecto IPPU–UTEC/LIDIA, la línea de pictogramas está pensada como creación de imágenes simbólicas contextualizadas a partir de fotos del entorno real del niño, niña o adolescente, accesibles para técnicos, familias y docentes. La presentación institucional lo plantea como una línea específica: **“Pictogramas personalizados digitales con IA”** .

La IA generativa puede intervenir en cinco momentos.

### a) Transformar fotos reales en pictogramas

La familia o el técnico toma una foto de un objeto real: una taza, una mochila, una cama, una puerta, un baño, un juguete, una campera, una comida, un espacio del IPPU o de la casa.

Luego, la IA transforma esa foto en una imagen más simple, limpia y simbólica.

Por ejemplo:

**Foto real:** la taza azul que usa el niño en su casa. **Resultado:** pictograma simple de “mi taza” o “tomar agua”.

Esto evita que la familia tenga que buscar imágenes genéricas o pagar por diseñadores.

### b) Eliminar fondos y detalles distractores

Muchas fotos reales tienen ruido visual: muebles, personas, sombras, objetos atrás, colores fuertes. La IA puede ayudar a:

eliminar el fondo;
 recortar el objeto principal;
 simplificar la imagen;
 reducir detalles;
 mejorar contraste;
 mantener un estilo visual uniforme.

Esto es importante porque un pictograma no debe ser “bonito”, sino **comprensible y funcional** .

### c) Mantener un estilo visual consistente

Un problema de los sistemas generativos es que pueden crear imágenes con estilos muy distintos. Para CAA eso es riesgoso, porque el niño puede confundirse.

La solución es usar una plantilla visual institucional:

fondo blanco;
 línea clara;
 pocos colores;
 sin sombras complejas;
 sin perspectiva confusa;
 sin exceso de detalle;
 etiqueta textual opcional;
 formato cuadrado;
 categorías visuales estables.

La IA no debería generar cualquier imagen, sino producir pictogramas dentro de un **estilo IPPU** o un estilo compatible con bancos existentes como ARASAAC.

### d) Sugerir vocabulario comunicativo

A partir de una foto o una rutina, la IA también puede sugerir qué pictogramas crear.

Por ejemplo, si se carga una foto de la cocina, puede sugerir:

comer;
 tomar agua;
 sentarse;
 esperar;
 lavar manos;
 plato;
 vaso;
 terminé;
 quiero más.

Esto reduce el trabajo técnico y ayuda a construir tableros comunicativos completos.

### e) Generar tableros y secuencias

La IA también puede ordenar pictogramas en:

agendas visuales;
 rutinas paso a paso;
 tableros de elección;
 historias sociales;
 secuencias de higiene;
 secuencias de alimentación;
 anticipadores de actividades;
 apoyos para transición.

Por ejemplo:

**Rutina: llegada al IPPU**

1. Entrar
2. Saludar
3. Guardar mochila
4. Ir al taller
5. Esperar turno
6. Jugar
7. Volver a casa

La IA puede generar el tablero, pero el equipo técnico debe validarlo.

## 2. Cómo hacerlo sin que los padres paguen

El modelo más adecuado sería un sistema institucional de uso gratuito para familias, sostenido por IPPU–UTEC/LIDIA. Técnicamente puede hacerse de tres formas.

### Opción 1: modelos abiertos instalados en servidor institucional

Esta sería la opción más alineada con “uso ilimitado” para las familias.

UTEC o IPPU podrían instalar modelos de generación de imágenes de código abierto en un servidor propio o universitario. Por ejemplo, modelos de difusión de uso local. Las familias no pagarían por imagen porque no se usaría una API comercial cobrada por generación.

El flujo sería:

familia o técnico sube foto;
 el servidor institucional procesa la imagen;
 la IA genera pictograma;
 el profesional valida;
 la familia descarga o usa el pictograma.

Ventaja: no se paga por cada imagen.
 Desventaja: requiere servidor, GPU o infraestructura mínima de cómputo.

Esta opción es buena si UTEC puede aportar infraestructura técnica o si se consigue financiamiento para un servidor.

### Opción 2: generación centralizada por el equipo técnico

En esta opción, no se abre la generación directa e ilimitada a todas las familias desde el inicio. Las familias solicitan pictogramas y el equipo IPPU–LIDIA los genera en bloque.

Por ejemplo:

la familia pide pictogramas para la rutina de dormir;
 sube fotos de cama, pijama, cepillo de dientes, cuento, luz apagada;
 el sistema genera varias versiones;
 el técnico elige y valida;
 la familia recibe el tablero.

Ventaja: reduce errores, evita mal uso y controla la calidad.
 Desventaja: no es completamente autónomo para la familia.

Para la primera etapa del proyecto, esta es probablemente la opción más segura.

### Opción 3: sistema híbrido con banco gratuito + IA solo cuando hace falta

No todos los pictogramas necesitan generarse con IA. Muchos conceptos ya existen en bancos gratuitos o de uso abierto, como ARASAAC. El documento del proyecto menciona ARASAAC como referencia de pictogramas y también plantea la posibilidad de adaptar imágenes con IA generativa.

Entonces el sistema podría funcionar así:

primero busca en banco gratuito;
 si existe un pictograma adecuado, se usa ese;
 si el pictograma genérico no alcanza, se genera uno personalizado;
 si hay foto real, se transforma;
 si no hay foto, se crea desde una descripción controlada.

Esto reduce muchísimo la necesidad de generación y hace más sostenible el uso ilimitado.

## 3. Modelo recomendado para IPPU–UTEC/LIDIA

Yo recomendaría un modelo mixto:

**Banco base gratuito + generación institucional con modelos abiertos + validación profesional.**

La familia no debería entrar a una app comercial, poner una tarjeta y pagar imágenes. Debería acceder a una plataforma institucional donde pueda:

solicitar pictogramas;
 subir fotos de objetos o rutinas;
 elegir categorías;
 descargar tableros validados;
 imprimir materiales;
 reutilizar pictogramas ya creados;
 compartirlos con escuela o terapeutas.

El costo no lo asume la familia. Lo absorbe el proyecto mediante:

infraestructura de UTEC;
 servidor propio o universitario;
 software libre;
 modelos abiertos;
 automatización del flujo;
 financiamiento externo;
 trabajo de estudiantes en proyectos de LIDIA;
 biblioteca reutilizable de pictogramas IPPU.

Esto además se alinea con el convenio, que plantea la Comunicación Aumentativa y Alternativa como una de las áreas de innovación tecnológica proyectadas, con IA generativa, procesamiento de lenguaje natural en español rioplatense y predicción de necesidades comunicativas personalizadas.

## 4. La clave: no generar siempre desde cero

Para que sea gratuito y sostenible, el sistema no debe generar una imagen nueva cada vez que una familia pide algo. Debería construir una **biblioteca acumulativa** .

Por ejemplo, si una familia pide “baño”, “agua”, “comer”, “dormir”, “esperar”, “feliz”, “triste”, “jugar”, “terminé”, esos pictogramas pueden quedar disponibles para otros usuarios, salvo los personalizados con datos privados.

Habría dos tipos de pictogramas:

### Pictogramas generales IPPU

Son reutilizables por muchas familias:

comer;
 dormir;
 baño;
 esperar;
 sentarse;
 jugar;
 descansar;
 dolor;
 ayuda;
 terminé;
 no quiero;
 quiero más.

Estos pueden generarse una vez, validarse y quedar en la biblioteca.

### Pictogramas personales

Son específicos de un NNA:

mi taza;
 mi mochila;
 mi terapeuta;
 mi casa;
 mi salón;
 mi juguete;
 mi perro;
 mi rutina de llegada;
 mi cama.

Estos se guardan en una biblioteca individual y solo se comparten con autorización.

## 5. Cómo sería el flujo práctico para una familia

Un flujo simple podría ser así:

1. La familia entra a la plataforma IPPU.
2. Elige “crear pictograma”.
3. Selecciona una categoría: comida, higiene, emoción, rutina, objeto, persona, lugar.
4. Sube una foto o escribe una descripción.
5. La IA genera 2 o 3 opciones simples.
6. El sistema aplica criterios automáticos de limpieza visual.
7. El técnico revisa y aprueba.
8. La familia recibe el pictograma en PDF, imagen o tablero.
9. El pictograma queda guardado en la biblioteca del NNA.
10. El equipo registra si funcionó o no.

La familia no paga por cada generación. Solo usa el servicio institucional.

## 6. Por qué no conviene dejar generación totalmente libre

Aunque la idea de uso ilimitado es buena, no conviene que los padres generen cualquier imagen sin control técnico, al menos al inicio.

Puede pasar que:

el pictograma sea confuso;
 tenga demasiados detalles;
 no represente bien el concepto;
 mezcle varios significados;
 tenga errores visuales;
 use imágenes sensibles;
 exponga datos del hogar;
 muestre rostros de menores;
 genere dependencia de imágenes no validadas.

Por eso, el modelo ideal es:

**uso libre para solicitar y reutilizar; validación profesional para aprobar.**

La IA puede acelerar, pero no debería sustituir el criterio del equipo clínico, psicopedagógico o fonoaudiológico.

## 7. Qué tecnología permitiría uso gratuito o casi gratuito

Para evitar cobros a familias, se pueden usar tecnologías de bajo costo:

modelos abiertos de generación de imágenes;
 modelos image-to-image instalados localmente;
 herramientas de segmentación automática;
 eliminadores de fondo de código abierto;
 bibliotecas de pictogramas libres o con licencias abiertas;
 base de datos institucional;
 exportación automática a PDF;
 interfaz web simple;
 servidor universitario;
 procesamiento por lotes.

La presentación del proyecto ya menciona tecnologías posibles como Python, OpenCV, rembg, Stable Diffusion, Hugging Face, FastAPI, React Native, PostgreSQL y Firebase Storage.

La decisión más importante es esta: **evitar depender exclusivamente de servicios comerciales de generación de imágenes por API** , porque eso puede volver caro el proyecto cuando crezca.

## 8. Modelo de sostenibilidad

Para que las familias no paguen, el proyecto debería sostenerse con una combinación de:

infraestructura de UTEC;
 software libre;
 biblioteca reutilizable;
 generación local;
 financiamiento externo;
 estudiantes de LIDIA;
 validación del equipo IPPU;
 alianzas con fondos de accesibilidad e inclusión.

Esto se conecta con el resumen ejecutivo del convenio, que identifica oportunidades de financiamiento internacional para proyectos de IA, discapacidad e inclusión, incluyendo programas como Microsoft AI for Accessibility, Google.org, IBM, SFARI y otras fundaciones vinculadas a TEA y neurodivergencia.

## 9. Propuesta concreta de solución

La solución podría formularse así:

**Plataforma institucional de pictogramas personalizados con IA para IPPU**

Objetivo: permitir que técnicos, familias y docentes creen, adapten, almacenen y reutilicen pictogramas personalizados para NNA con TEA, sin costo directo para las familias, mediante modelos abiertos, biblioteca institucional y validación profesional.

Componentes:

1. Biblioteca base de pictogramas gratuitos.
2. Generador IA desde foto real.
3. Generador IA desde descripción textual.
4. Editor simple de pictogramas.
5. Validación profesional.
6. Biblioteca individual por NNA.
7. Exportación a PDF, tablero o imagen.
8. Registro de uso.
9. Integración futura con HCE.
10. Manual para familias y docentes.

## 10. Frase fuerte para el proyecto

Podrías plantearlo de esta manera:

La IA generativa puede intervenir como una capa de personalización accesible dentro de un sistema institucional de Comunicación Aumentativa y Alternativa, transformando fotos y descripciones del entorno real del NNA en pictogramas simples, validados y reutilizables. Para evitar costos para las familias, el modelo debe basarse en software libre, generación local o centralizada, biblioteca acumulativa y financiamiento institucional, de modo que el acceso no dependa de pagos por imagen ni de plataformas comerciales.

# Desarrollo del proyecto

## Prototipo IPPU–LIDIA de Pictogramas Personalizados con IA

**Objetivo general:** desarrollar una plataforma institucional que permita crear, validar, guardar y reutilizar pictogramas personalizados para niñas, niños y adolescentes con TEA, usando IA generativa y software libre o de bajo costo, sin trasladar el costo de generación a las familias.

Esto se ajusta muy bien a la línea 2 del convenio IPPU–UTEC/LIDIA, que plantea crear imágenes simbólicas contextualizadas a partir de fotos del entorno real del NNA, accesibles para técnicos, familias y docentes.

## 1. Qué producto hay que construir

El producto inicial no debería ser “un generador libre de imágenes”, sino una plataforma con este flujo:

**foto o descripción → simplificación visual → pictograma → validación profesional → biblioteca del NNA → descarga o uso en tablero.**

En términos prácticos, el sistema tendría cinco módulos.

### Módulo 1: Biblioteca base

Antes de generar imágenes nuevas, el sistema debería tener una biblioteca inicial de pictogramas generales.

Por ejemplo:

comer;
 tomar agua;
 baño;
 dormir;
 esperar;
 jugar;
 ayuda;
 dolor;
 feliz;
 triste;
 enojado;
 terminé;
 quiero más;
 descansar;
 ir a casa;
 ir al taller.

Esto evita generar con IA lo que ya puede resolverse con pictogramas estándar o reutilizables. La presentación del proyecto identifica ARASAAC como sistema de referencia y reconoce que los pictogramas estándar son útiles, aunque tienen la limitación de no representar siempre el entorno cotidiano del NNA.

### Módulo 2: Generador desde foto real

Este módulo permite subir una foto de un objeto, espacio o rutina real.

Ejemplos:

la mochila del niño;
 su vaso;
 su cama;
 la entrada del IPPU;
 el salón de comunicación;
 la mesa de cocina;
 el baño de la casa;
 un juguete específico.

El sistema toma esa foto y genera una versión simplificada tipo pictograma.

### Módulo 3: Generador desde texto

Sirve cuando no hay foto.

Ejemplo de entrada:

“niño guardando la mochila en un estante”;
 “esperar sentado con manos quietas”;
 “lavarse las manos antes de comer”;
 “pedir ayuda a la maestra”.

El sistema genera una imagen pictográfica simple. Este módulo debe estar muy controlado, con estilos predefinidos y sin libertad total de generación.

### Módulo 4: Validación profesional

Este es obligatorio.

El pictograma no pasa directamente a la familia. Primero lo revisa alguien del equipo técnico de IPPU.

El profesional puede marcar:

aprobado;
 requiere edición;
 rechazado;
 demasiado complejo;
 poco claro;
 no corresponde al objetivo comunicativo;
 riesgo de confusión;
 riesgo de privacidad.

### Módulo 5: Biblioteca individual y exportación

Cada NNA tendría su propia biblioteca.

Desde allí se podrían exportar:

pictograma individual en PNG;
 tablero en PDF;
 agenda visual;
 secuencia paso a paso;
 material para imprimir;
 material para compartir con escuela o familia.

Además, los pictogramas usados por el NNA podrían registrarse luego en la HCE como parte del plan comunicativo, algo coherente con la integración entre línea de pictogramas e historia clínica planteada en la presentación.

## 2. Cómo empezar: primera etapa de desarrollo

La primera etapa no es programar. Es **relevar y ordenar el problema** .

La Guía de Relevamiento ya pregunta si IPPU utiliza CAA/AAC, qué sistema de pictogramas usa, si los personaliza, dónde los almacena y qué limitaciones encuentra con los pictogramas actuales.

Entonces, el primer paso concreto es hacer una reunión de 90 minutos con IPPU solo sobre pictogramas.

### Preguntas que hay que responder

1. ¿Qué NNA usan pictogramas actualmente?
2. ¿Qué tipo de pictogramas usan: ARASAAC, Widgit, propios, fotos reales?
3. ¿Quién decide qué pictogramas necesita cada NNA?
4. ¿Quién los crea hoy?
5. ¿Cuánto tiempo lleva crearlos?
6. ¿Dónde se guardan?
7. ¿Se usan igual en IPPU, casa y escuela?
8. ¿Qué pictogramas faltan siempre?
9. ¿Qué pictogramas no funcionan bien?
10. ¿Qué rutinas deberían priorizarse?

El producto de esta etapa debe ser un **inventario inicial de necesidades comunicativas** .

## 3. Elegir un alcance chico para el MVP

Para que el proyecto sea viable, no conviene comenzar con todos los NNA ni con todos los pictogramas posibles.

Yo empezaría así:

**10 NNA** como grupo piloto. **3 rutinas prioritarias.
 30 a 50 pictogramas iniciales.
 1 biblioteca digital simple.
 1 exportador a PDF.
 1 protocolo de validación profesional.**

Las tres rutinas iniciales podrían ser:

1. **Rutina de llegada al IPPU:** entrar, saludar, guardar mochila, esperar, ir al taller.
2. **Rutina de higiene y cuidado personal:** baño, lavarse las manos, cepillarse dientes, pedir ayuda.
3. **Rutina de alimentación o cocina:** comer, tomar agua, esperar turno, plato, vaso, terminar.

Estas rutinas conectan con los talleres institucionales de IPPU, que incluyen habilidades sociales, higiene y cuidado personal, habilidades para la vida cotidiana, cocina y comunicación.

## 4. Definir el flujo operativo

El flujo concreto debería ser este:

### Paso 1: solicitud del pictograma

El técnico o la familia completa un formulario simple:

Nombre del NNA.
 Concepto a representar.
 Función comunicativa.
 Contexto de uso.
 Foto, si existe.
 Observación clínica breve.

Ejemplo:

Concepto: “mi vaso azul”.
 Función: pedir agua.
 Contexto: merienda en casa e IPPU.
 Foto: vaso real.
 Observación: el niño no identifica pictograma genérico de vaso.

### Paso 2: generación asistida

El sistema genera 2 o 3 variantes.

No debe generar 20 opciones, porque eso vuelve lento el proceso. Bastan pocas alternativas.

### Paso 3: revisión técnica

El profesional elige una versión o pide ajuste.

Criterios:

¿es claro?
 ¿es simple?
 ¿representa un solo concepto?
 ¿no tiene fondo distractor?
 ¿se parece al objeto real cuando corresponde?
 ¿puede generalizarse a otros contextos?
 ¿es adecuado para la edad y perfil del NNA?

### Paso 4: prueba con el NNA

El pictograma se prueba en contexto real.

No se valida solamente porque al adulto le parezca bueno. Se valida por uso.

### Paso 5: registro

Se registra:

fecha;
 pictograma creado;
 quién lo validó;
 para qué rutina se usa;
 si el NNA lo comprendió;
 si lo usó espontáneamente;
 si requiere ayuda;
 si se descarta o mantiene.

## 5. Cómo evitar que los padres gasten dinero

La solución técnica debe evitar plataformas comerciales de pago por imagen. Hay tres decisiones importantes.

### Decisión 1: usar modelos abiertos o infraestructura institucional

La opción ideal es instalar un modelo generativo abierto en infraestructura de UTEC o en un servidor del proyecto. No es estrictamente “gratis”, porque hay costo de infraestructura, pero no hay pago por imagen para la familia.

### Decisión 2: generar en bloque

No conviene que cada familia genere imágenes ilimitadamente todo el día. Conviene que el sistema permita solicitudes y que IPPU/LIDIA genere por lotes.

Por ejemplo:

lunes: solicitudes de familias;
 martes: generación automática;
 miércoles: validación técnica;
 jueves: entrega de tableros;
 viernes: prueba y ajustes.

Eso mantiene control de calidad y evita consumo excesivo.

### Decisión 3: reutilizar biblioteca

Muchos pictogramas serán compartibles.

Se pueden crear tres niveles:

**Biblioteca general IPPU:** pictogramas comunes para todos. **Biblioteca por taller:** cocina, comunicación, higiene, habilidades sociales. **Biblioteca individual:** pictogramas específicos del NNA.

Cuanto más crece la biblioteca, menos hay que generar desde cero.

## 6. Arquitectura técnica mínima

Para una primera versión, no hace falta una app compleja.

Yo usaría una arquitectura simple:

**Frontend:** React. **Backend:** FastAPI en Python. **Base de datos:** PostgreSQL. **Almacenamiento de imágenes:** carpeta segura institucional o storage privado. **Procesamiento de imagen:** OpenCV, rembg o Segment Anything Model. **Generación:** modelo local de difusión o servicio institucional controlado. **Exportación:** PDF automático. **Autenticación:** usuario técnico, familia y administrador.

La presentación técnica de IPPU–UTEC ya menciona herramientas compatibles con este camino, como Python, OpenCV, rembg, Stable Diffusion, Hugging Face, FastAPI, React Native, PostgreSQL y Firebase Storage.

## 7. Roles del equipo

Para que esto avance, hay que asignar roles claros.

### IPPU

Define necesidades clínicas y comunicativas.
 Selecciona NNA del piloto.
 Consigue consentimiento informado.
 Valida pictogramas.
 Prueba los materiales con usuarios.
 Informa si funcionan o no.

### LIDIA–UTEC

Diseña la arquitectura técnica.
 Programa el prototipo.
 Implementa la generación y almacenamiento.
 Crea la base de datos.
 Desarrolla el exportador de tableros.
 Mide resultados.
 Documenta el proceso.

### Familias

Aportan fotos del entorno real.
 Indican rutinas prioritarias.
 Prueban pictogramas en casa.
 Reportan comprensión, uso y dificultades.

### Docentes o centros educativos

Prueban continuidad del pictograma en contexto escolar.
 Informan si el apoyo visual mejora participación o anticipación.

## 8. Qué debe contener la base de datos

La base de datos puede ser simple al inicio.

Tablas mínimas:

**usuarios\_nna** id\_nna\_anonimizado
 edad
 grupo
 perfil comunicativo general
 observaciones no sensibles

**pictogramas** id\_pictograma
 nombre
 categoría
 función comunicativa
 fuente: ARASAAC, foto, texto, IA
 archivo\_imagen
 estado: generado, validado, en uso, descartado
 fecha\_creación
 profesional\_validador

**rutinas** id\_rutina
 nombre
 descripción
 contexto: IPPU, casa, escuela
 pictogramas\_asociados

**uso\_pictograma** id\_uso
 id\_pictograma
 id\_nna
 fecha
 contexto
 comprensión: alta, media, baja
 uso: espontáneo, con ayuda, no usa
 observaciones

Con esto ya se puede generar evidencia institucional.

## 9. Protocolo de calidad del pictograma

Cada pictograma debería revisarse con una ficha breve.

### Criterios visuales

Fondo limpio.
 Objeto central claro.
 Sin exceso de detalles.
 Sin más de un significado principal.
 Colores simples.
 Contraste suficiente.
 Estilo coherente.
 Etiqueta textual clara.

### Criterios comunicativos

Representa una necesidad real.
 Se vincula a una rutina concreta.
 Tiene una función comunicativa definida.
 No duplica innecesariamente otro pictograma.
 Puede usarse en IPPU, casa o escuela.

### Criterios clínicos

Es comprensible para el NNA.
 No genera rechazo.
 No introduce ambigüedad.
 No expone información sensible.
 Fue validado por un profesional.

## 10. Cronograma concreto de 12 semanas

### Semanas 1 y 2: relevamiento específico

Reunión con IPPU.
 Inventario de pictogramas actuales.
 Selección de 10 NNA piloto.
 Definición de 3 rutinas prioritarias.
 Revisión de consentimiento y privacidad.

Producto: documento de alcance del MVP.

### Semanas 3 y 4: diseño funcional

Diseño de formulario de solicitud.
 Diseño de ficha de pictograma.
 Diseño de biblioteca.
 Definición de estilo visual.
 Definición de criterios de validación.

Producto: prototipo en papel o Figma.

### Semanas 5 a 8: desarrollo técnico

Frontend básico.
 Backend básico.
 Carga de imagen.
 Eliminación de fondo.
 Generación de pictograma.
 Guardado en biblioteca.
 Exportación a PDF.

Producto: MVP técnico funcional.

### Semanas 9 y 10: validación interna

Prueba con técnicos de IPPU.
 Corrección de errores.
 Ajuste de estilos.
 Prueba de generación con fotos no sensibles.
 Definición de protocolo de uso.

Producto: versión piloto lista para usuarios.

### Semanas 11 y 12: piloto con NNA y familias

Uso en rutinas seleccionadas.
 Registro de comprensión.
 Registro de uso.
 Entrevista breve a familias y técnicos.
 Ajustes finales.

Producto: informe piloto + biblioteca inicial.

## 11. Cómo medir resultados

No hay que medir solo cuántas imágenes se generaron.

Indicadores recomendados:

tiempo promedio para crear un pictograma;
 cantidad de pictogramas validados;
 cantidad de pictogramas descartados;
 porcentaje de pictogramas comprendidos por el NNA;
 uso espontáneo o con ayuda;
 satisfacción de familias;
 satisfacción del equipo técnico;
 reducción del tiempo de personalización manual;
 continuidad de uso entre IPPU y hogar;
 cantidad de pictogramas reutilizables en biblioteca general.

## 12. Qué entregables debería producir LIDIA

Al final del primer ciclo, LIDIA debería entregar:

1. Prototipo web funcional.
2. Biblioteca inicial de pictogramas.
3. Manual de uso para técnicos.
4. Guía breve para familias.
5. Protocolo de consentimiento para imágenes.
6. Ficha de validación profesional.
7. Informe de resultados del piloto.
8. Recomendaciones para escalar.

Esto es importante porque el documento de oportunidades del convenio advierte que muchas soluciones de IA generativa para TEA están todavía en fases experimentales o de prototipo, por lo que requieren validación rigurosa, revisión ética y enfoque centrado en las personas.

## 13. Cómo lo formularía como proyecto

Podés presentarlo así:

**Título:** Desarrollo de una plataforma institucional de pictogramas personalizados con inteligencia artificial generativa para niñas, niños y adolescentes con TEA en Fundación IPPU.

**Problema:** Los pictogramas estándar no siempre reflejan el entorno cotidiano, familiar y cultural de los NNA con TEA, lo que puede afectar la comprensión, la adherencia y la continuidad del sistema de comunicación aumentativa. Además, la personalización manual consume tiempo técnico y genera materiales dispersos.

**Solución propuesta:** Diseñar un prototipo que permita generar pictogramas personalizados a partir de fotos o descripciones, validarlos profesionalmente, almacenarlos en bibliotecas individuales y exportarlos como tableros o agendas visuales, sin costo directo para las familias.

**MVP:** Piloto con 10 NNA, 3 rutinas prioritarias y 30 a 50 pictogramas generados, validados y probados en contexto institucional y familiar.

**Valor diferencial:** No se limita a generar imágenes, sino que integra IA generativa, CAA, validación clínica, biblioteca reutilizable, trazabilidad y accesibilidad para familias.

## 14. Mi recomendación de inicio

Para empezar mañana, yo haría esto:

Primero, preparar una **matriz de relevamiento específica de pictogramas** . Segundo, coordinar una reunión con IPPU para completar esa matriz. Tercero, elegir solo **una rutina piloto** , por ejemplo “llegada al IPPU” o “higiene”. Cuarto, crear manualmente 10 pictogramas de prueba usando fotos no sensibles. Quinto, recién después automatizar el proceso con IA.

La secuencia correcta es:

**necesidad comunicativa → diseño clínico → prototipo simple → prueba con usuarios → automatización con IA.**

No al revés.