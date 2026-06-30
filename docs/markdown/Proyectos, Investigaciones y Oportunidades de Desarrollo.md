## FUNDACIÓN IPPU  ×  UTEC - LIDIA

Licenciatura en Ingeniería de Datos e Inteligencia Artificial

## Inteligencia Artificial y TEA

Proyectos, Investigaciones y Oportunidades de Desarrollo Estado del Arte Internacional 2025-2026

Documento preparado en el marco del Convenio de Cooperación Académica, Científica y Tecnológica entre Fundación IPPU y UTEC-LIDIA

Montevideo, abril de 2026

## 1. Presentación y Marco del Documento

El presente documento sistematiza el estado del arte internacional en la intersección entre Inteligencia Artificial (IA) y Trastorno del Espectro Autista (TEA), con el objetivo de orientar las líneas de trabajo conjuntas derivadas del Convenio de Cooperación suscrito entre la Fundación IPPU y la Licenciatura en Ingeniería de Datos e Inteligencia Artificial (LIDIA) de la Universidad Tecnológica del Uruguay (UTEC).

El convenio establece como propósito central desarrollar acciones conjuntas orientadas al diseño, implementación y evaluación de tecnologías de datos e inteligencia artificial que promuevan la inclusión, la autonomía y la mejora en la calidad de vida de personas con diversidad funcional. En ese marco, este inventario de proyectos e investigaciones cumple una  función  estratégica:  proporcionar  a  ambas  instituciones  una  base  de  referencia empírica, organizada y priorizada para la toma de decisiones.

Las iniciativas relevadas provienen de revistas científicas indexadas (Nature, The Lancet, Science Robotics, Frontiers in Psychiatry, JMIR Neurotechnology, entre otras), centros académicos y hospitalarios de referencia internacional, y ensayos clínicos con registro formal. Se priorizaron evidencias publicadas entre 2025 y 2026.

## Escala de Complejidad de Implementación

Cada iniciativa fue valorada según su nivel de complejidad técnica, de infraestructura y de recursos humanos especializados necesarios para su replicación o adaptación en el contexto del convenio IPPU-UTEC:

| ACCESIBLE   | Iniciativas implementables con recursos y capacidades estándar de una institución universitaria y una ONG especializada. Requieren software de uso libre o comercial accesible, datasets disponibles y conocimientos de nivel intermedio en IA y ciencia de datos.       |
|-------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| INTERMEDIA  | Iniciativas que requieren infraestructura específica (hardware especializado, entornos controlados, datasets propios), mayor capacidad técnica en el equipo, y articulación con actores clínicos o educativos. Posibles en el mediano plazo con financiamiento parcial.  |
| AVANZADA    | Iniciativas que demandan hardware especializado (robots humanoides, dispositivos EEG, wearables), grandes bases de datos, infraestructura de computación de alta performance o colaboración internacional. Constituyen un horizonte de desarrollo a mediano-largo plazo. |

## 2. Categorías y Proyectos

## A. Diagnóstico y Detección Temprana

Esta área concentra los avances más rápidos y con mayor potencial traslacional. Los sistemas de IA superan a los métodos tradicionales en velocidad, objetividad y accesibilidad geográfica, con precisiones de 80-99%. Las tecnologías van desde modelos de ML sobre datos clínicos hasta análisis multimodal de video, EEG y realidad virtual.

A.1

## AutMedAI - Detección temprana con datos pediátricos

COMPLEJIDAD ACCESIBLE

Institución: Karolinska Institutet (Suecia) / Base SPARK - EE.UU. |   Área: Diagnóstico / Machine Learning

Modelo de ML que identifica ~80% de niños con autismo analizando 28 parámetros clínicos obtenibles antes de los 24 meses de edad, sin necesidad de evaluaciones exhaustivas. Trabajó sobre una base de ~30.000 individuos (SPARK).

Evidencia: Psiquiatria.com / Karolinska Institutet (Kristiina Tammimies), 2025.

## A.2 T-EYE - Detección con Realidad Virtual e IA

COMPLEJIDAD INTERMEDIA

Institución: Institut Human-Tech, Universitat Politècnica de València (UPV) / Red Cenit - España |   Área: Diagnóstico / VR + IA

Sistema que analiza movimientos de niños (3-7 años) durante tareas en realidad virtual para detectar TEA. Precisión superior al 85%, superando métodos tradicionales. Solo requiere pantalla de gran formato y cámara estándar, facilitando su acceso en centros de atención temprana.

Evidencia: Expert Systems with Applications, Vol. 270, 2025.

## A.3 Modelos LLM Multimodales para Diagnóstico por Video (Gemini / GPT-4o) COMPLEJIDAD INTERMEDIA

Institución: Múltiples grupos de investigación internacionales |   Área: Diagnóstico / LLMs Multimodales

Evaluación sistemática de LLMs multimodales como sustitutos del anotador humano en detección de autismo por video. Gemini 2.5 Pro alcanza 85-90% de precisión, comparable al estándar clínico (88%). Progresión clara entre generaciones de modelos.

Evidencia: MDPI Algorithms, octubre 2025. DOI: 10.3390/a18110687.

<!-- image -->

Estudio AURORA - Predicción por Registros Electrónicos de Salud COMPLEJIDAD AVANZADA

Institución: Duke Center for Autism and Brain Development - EE.UU. |   Área: Diagnóstico / Big Data / Machine Learning

Modelos de ML que analizan registros electrónicos de salud (EHR) para identificar patrones de condiciones médicas en la primera infancia (ej. trastornos del sueño, gastrointestinales) que predicen riesgo de TEA meses antes que las pruebas conductuales estándar.

Evidencia:

Duke AI Health / Dr. Benjamin Goldstein, 2025.

## A.5 (EEG / Eye-Tracking)

## Detección Multimodal XGBoost + CNN-LSTM COMPLEJIDAD AVANZADA

Institución: Múltiples grupos; publicaciones revisadas 2025-2026 |   Área: Diagnóstico / IA Explicable (XAI)

Marcos que combinan XGBoost y redes CNN-LSTM para analizar simultáneamente datos clínicos, seguimiento ocular y EEG. Precisión del 99.05% con métodos XAI (SHAP, LIME) que permiten al clínico entender qué rasgos (ej. latencia de onda P300) activaron la decisión de la IA.

Evidencia: Publicaciones Frontiers / MDPI, marzo 2026.

## A.6 LLMs para Diagnóstico de Trastornos del Lenguaje (GPT-3.5 / GPT-4o) COMPLEJIDAD ACCESIBLE

Institución: Múltiples investigadores - publicación Nature |   Área: Diagnóstico / Procesamiento de Lenguaje Natural

Uso de LLMs para identificar características lingüísticas asociadas al TEA. Diseñado como apoyo complementario al juicio clínico, especialmente en entornos con escasez de datos etiquetados.

Evidencia:

npj Digital Medicine (Nature), diciembre 2025.

## B. Intervención Terapéutica y Habilidades Sociales/Emocionales

Área con la mayor diversidad de enfoques: robots sociales, LLMs, plataformas gamificadas y entornos de práctica virtual. Las intervenciones más efectivas combinan la IA con terapias convencionales (ABA, TEACCH, TRP) como complemento, no como sustituto. Los ensayos clínicos aleatorizados dan solidez científica creciente a este campo.

## B.1 Empatía con GPT-4

## Herramienta "Noora" - Entrenamiento en COMPLEJIDAD ACCESIBLE

Institución: Journal of Autism and Developmental Disorders - Springer |   Área: Intervención / LLMs / Empatía

Ensayo clínico aleatorizado que evaluó "Noora", programa basado en GPT-4, para mejorar respuestas empáticas verbales en adolescentes y adultos autistas (11-35

años). Utilizó 330 enunciados manualmente verificados. Comparado contra grupo control en lista de espera.

Evidencia: JADD (Springer), febrero 2025. DOI: 10.1007/s10803-025-06734-x.

## B.2 CognitiveBotics - Plataforma Terapéutica con IA y Gamificación COMPLEJIDAD INTERMEDIA

|

Institución: CognitiveBotics Technologies / Rainbow Children's Hospital - India Área: Intervención / ABA Digital / Gamificación

Plataforma con gamificación, chatbots, modelado por video y planes de aprendizaje individualizados (ILP) para niños 2-18 años. Resultados tras 12 meses: CARS ↓15.18%, edad social ↑56.84%, lenguaje receptivo ↑56.22%, expresivo ↑59.93% (p&lt;0.001).

Evidencia: JMIR Neurotechnology, abril 2025. Estudio longitudinal n=43.

## B.3 Social Conversation Program - Stanford Autism Center

COMPLEJIDAD INTERMEDIA

Institución: Stanford Medicine / Stanford Autism Center - EE.UU. |   Área: Intervención / IA Generativa / Habilidades Sociales

Programa de 4 semanas (9 módulos de IA) para adolescentes y adultos verbales. Entrena respuesta empática, iniciación social y turnos conversacionales. La IA provee retroalimentación en tiempo real (5-10 min/día) en entorno de baja presión antes de la interacción humana.

Evidencia: Stanford HAI AI Index Report 2026; ensayos clínicos sobre empatía y pragmática.

## B.4 (Claude / Anthropic)

## LLMs como "Scaffolding" Comunicacional COMPLEJIDAD ACCESIBLE

Institución: Múltiples grupos clínicos - uso formal documentado 2026 |   Área: Intervención / IA Generativa / Comunicación Aumentativa

Modelos como Claude (Anthropic) usados formalmente como ayudas a la comunicación para traducir señales sociales ambiguas y redactar mensajes ajustando el tono, reduciendo ansiedad social en contextos laborales y académicos para personas autistas.

Evidencia: Documentado formalmente en revisiones 2026 (ScienceOpen/MDPI).

## B.5 Robots Sociales - Ensayos Clínicos Aleatorizados (Science Robotics)

COMPLEJIDAD AVANZADA

Institución: Consorcio europeo: Babeș-Bolyai, Ghent, VUB, Lincoln, Skövde, Plymouth |   Área: Intervención / Robótica Social

Dos RCTs: el primero (n=69, media 4.4 años) demostró que 12 sesiones asistidas por robot equivalen al tratamiento convencional con mayor compromiso del paciente.

El segundo (n=63) logró resultados equivalentes al estándar en solo 5 sesiones en entornos reales (escuelas/hogares).

Evidencia: Science Robotics 10(109), diciembre 2025. DOI: 10.1126/scirobotics.adl2266.

## B.6 Pivotal (TRP)

## Robot Pepper con Tratamiento de Respuesta COMPLEJIDAD AVANZADA

Institución: Investigadores publicados en Scientific Reports (Nature) |   Área: Intervención / Robótica Social / Regulación Emocional

Exploración del robot social Pepper en regulación emocional y adherencia al tratamiento en niños con TEA bajo TRP. Mejoras significativas en respuestas emocionales; evidencia sobre el rol del robot como facilitador del compromiso familiar.

Evidencia: Scientific Reports 15, 43797, 2025. DOI: 10.1038/s41598-025-27616-3.

## B.7 Robot iCub para Entrenamiento en Teoría de la Mente COMPLEJIDAD AVANZADA

Institución: Centro Boggiano Pico / Don Orione Italia - Génova, Italia |   Área: Intervención / Robótica Humanoide / Cognición Social

Ensayo clínico (ISRCTN15341724) con 32 niños con TEA formal (ADI-R y ADOS-2). Usó robot humanoide para entrenar Teoría de la Mente como complemento a ABA, terapia del habla y TEACCH.

Evidencia: Scientific Reports / ISRCTN15341724, mayo 2025.

## B.8 la Mente (Juego)

## IA Generativa para Entrenamiento en Teoría de COMPLEJIDAD INTERMEDIA

Institución: Universidad de Tecnología de Graz - Austria |   Área: Intervención / LLMs / Teoría de la Mente

Estudio con 21 participantes (autistas y no autistas) en juego gamificado de Teoría de la Mente evaluado por GPT-4o y expertos humanos. GPT-4o coincidió con los expertos sin diferencias estadísticamente significativas, sugiriendo utilidad en sistemas escalables de entrenamiento social.

Evidencia: PMC/PubMed, aprobación ética EK-51/2024, 2025.

## C. Autonomía y Vida Cotidiana

Área de alto impacto para la Fundación IPPU dado su trabajo con adultos con diversidad funcional. Los desarrollos van desde sistemas de apoyo en el hogar hasta dispositivos vestibles que detectan sobrecarga sensorial de forma preventiva. El proyecto latinoamericano TEAsy-Life (Chile) representa una referencia regional especialmente relevante.

C.1

## Proyecto TEAsy-Life - IA para Autonomía en Adultos

COMPLEJIDAD INTERMEDIA

Institución: MICARE - Centro de Investigación en Tecnologías para la Salud, Chile |   Área: Autonomía / Vida Diaria / IA Contextual

Sistema inteligente de apoyo contextual para la ejecución de actividades de la vida diaria en adultos autistas. Objetivo: fomentar la autonomía funcional en el hogar mediante IA adaptativa al contexto individual.

Evidencia:

MICARE Chile, noviembre 2025.

## C.2 Wearable para Reconocimiento de Emociones en Tiempo Real

COMPLEJIDAD AVANZADA

Institución: Investigadores - Scientific Reports (Nature) |   Área: Autonomía / Wearables / Retroalimentación Háptica

Traductor cognitivo-intuitivo de reconocimiento facial de emociones en tiempo real integrando retroalimentación vibrotáctil en gafas inteligentes INMO Air. Combina señales visuales con retroalimentación háptica para mejorar interpretación de emociones en entornos sociales.

Evidencia: Scientific Reports (Nature), diciembre 2024-enero 2025. DOI: 10.1038/s41598-024-83229-2.

## C.3 Wearables Somáticos para Detección de Sobrecarga Sensorial

COMPLEJIDAD AVANZADA

Institución: MIT Media Lab - Proyecto AHA (Advancing Humans with AI), EE.UU. | Área: Autonomía / Wearables / Biomarcadores

Dispositivos vestibles que usan biomarcadores derivados de la mirada para detectar estados de sobrecarga sensorial antes de que se manifiesten conductualmente, permitiendo intervenciones proactivas y preventivas.

Evidencia:

MIT Media Lab, 2026.

## D. Educación e Inclusión Académica

La IA adaptativa en educación es uno de los campos con mayor potencial de accesibilidad inmediata. Los sistemas ajustan contenido y ritmo en tiempo real según el perfil del estudiante, favoreciendo la inclusión en entornos educativos formales. La evidencia latinoamericana disponible (Venezuela, 2025) resulta especialmente relevante para el contexto del convenio.

## D.1 IA Adaptativa para Aprendizaje Matemático en TEA/TDAH

COMPLEJIDAD ACCESIBLE

Institución: Universidad Centroccidental Lisandro Alvarado (UCLA) - Venezuela | Área: Educación / IA Adaptativa

Sistemas de IA adaptativos que ajustan contenido intelectual y emocional en tiempo real para estudiantes con TEA/TDAH. Estudio de 12 semanas (n=187) mostró mejoras en engagement y resultados académicos.

Evidencia:

REDINE (revista arbitrada), junio 2025.

## D.2 Stanford SCALE Initiative - IA en Educación para TEA

COMPLEJIDAD ACCESIBLE

Institución: Stanford SCALE Initiative - EE.UU. |   Área: Educación / Revisión Sistemática

Revisión de 13 estudios empíricos (2018-2024) que analiza aplicaciones de IA en aprendizaje académico, cognitivo y social para TEA, aprovechando la predictibilidad de la IA y la baja demanda social como facilitadores del aprendizaje.

Evidencia:

Stanford SCALE Initiative, enero 2025.

## E. Apoyo a Familias, Cuidadores y Gestión Clínica

A menudo subestimada, esta área tiene un impacto directo en la sostenibilidad de los apoyos. Los chatbots de IA generativa ya demuestran precisión suficiente para responder consultas parentales, mientras que los pilotos en sistemas de salud del Reino Unido muestran reducciones significativas en la carga administrativa de equipos clínicos.

## E.1 Chatbots GenAI para Apoyo y Educación a Familias

COMPLEJIDAD ACCESIBLE

Institución: Múltiples grupos - incluido en scoping review Frontiers in Psychiatry | Área: Apoyo a Cuidadores / LLMs / Soporte Emocional

Chatbots basados en GPT-3.5/4 que responden consultas parentales y generan ejemplos comportamentales (precisión 83% según clínicos). Mejoran educación y soporte emocional; preferencia mixta: médicos por precisión, usuarios por empatía.

Evidencia:

Frontiers in Psychiatry, scoping review, junio 2025.

## E.2 IA para Gestión de Documentación Clínica y Evaluaciones

COMPLEJIDAD ACCESIBLE

Institución: NHS / Your Healthcare CIC - Reino Unido |   Área: Gestión Clínica / IA Generativa / Eficiencia

Pilotos que utilizan IA generativa para generar resúmenes automáticos de consultas clínicas, reduciendo significativamente el tiempo de redacción de informes en evaluaciones de TEA y TDAH.

Evidencia:

Your Healthcare CIC (NHS pilot), 2025.

## F. Investigación Avanzada y Ciencia de Datos

Este bloque representa el horizonte científico de largo plazo, donde la IA se une a la genómica, la neuroimagen y los modelos computacionales. Aunque su complejidad técnica es elevada, constituyen las líneas de mayor potencial transformador y las más adecuadas para proyectos de investigación aplicada en el marco del convenio UTEC-LIDIA.

## F.1 Subtipificación Biológica con IA - ASF / NIH COMPLEJIDAD AVANZADA

Institución: Autism Science Foundation / NIH Autism Data Science Initiative (ADSI) |   Área: Investigación / Machine Learning / Genómica

Paradigmas de ML para analizar patrones conductuales y biológicos en grandes datasets, identificando 4 subtipos reproducibles de TEA (uno similar a autismo profundo, otro con comorbilidades psiquiátricas). Financiado con $50M del NIHADSI.

Evidencia: Nature Genetics, 2025; ASF Year in Review 2025.

## F.2 CONICET Argentina

## Modelos Computacionales de Corteza Visual COMPLEJIDAD AVANZADA

Institución: Instituto sinc(i) - CONICET / UNL - Argentina |   Área: Investigación / Neurociencia Computacional / IA

Redes neuronales artificiales entrenadas con IA para simular el comportamiento de la corteza visual primaria, comprendiendo la relación entre fisiología cerebral y percepción en personas con TEA. Modelo originalmente publicado en Nature Neuroscience (2020), adaptado para TEA.

Evidencia: CONICET Argentina (Rodrigo Echeveste, Diego Milone, Enzo Ferrante), 2025.

## F.3 (Revisión Narrativa)

## Seis Estrategias de Innovación IA para TEA COMPLEJIDAD AVANZADA

Institución: Jiamusi University / Longgang Maternity &amp; Child Healthcare Hospital / Georg-August University Göttingen |   Área: Investigación / Revisión / Innovación

Propone seis líneas de innovación: (1) Inferencia causal gen-ambiente, (2) Redes ST-GNN para neurodesarrollo, (3) Fusión multimodal de datos, (4) Digital twins para simulación personalizada, (5) Aprendizaje federado multicéntrico con privacidad, (6) LLMs para razonamiento social.

Evidencia: Pediatric Investigation (Wiley), enero 2026.

## F.4 Neurofeedback Híbrido Asistido por IA (NFT-AI) COMPLEJIDAD

AVANZADA

Institución: Múltiples grupos - PubMed 2026 |   Área: Investigación / Neurociencia / Regulación Emocional

Terapia de Neurofeedback (NFT) potenciada por IA que ajusta dinámicamente el entrenamiento de banda gamma prefrontal según análisis en tiempo real de plasticidad neuronal. Mejoras significativas en la Social Responsiveness Scale (SRS) al combinar neurofeedback convencional con ajuste algorítmico.

Evidencia: Análisis retrospectivos documentados en PubMed, 2026.

## 3. Resumen por Complejidad y Área

La siguiente tabla consolida todos los proyectos del inventario, organizados por nivel de complejidad de implementación. Puede utilizarse como instrumento de priorización para el diseño de la hoja de ruta conjunta IPPU-UTEC.

| Cód.   | Proyecto                                                              | Área Principal                                          | Complejidad   |
|--------|-----------------------------------------------------------------------|---------------------------------------------------------|---------------|
| A.1    | AutMedAI - Detección temprana con datos pediátricos                   | Diagnóstico / Machine Learning                          | Accesible     |
| A.2    | T-EYE - Detección con Realidad Virtual e IA                           | Diagnóstico / VR + IA                                   | Intermedia    |
| A.3    | Modelos LLM Multimodales para Diagnóstico por Video (Gemini / GPT-4o) | Diagnóstico / LLMs Multimodales                         | Intermedia    |
| A.4    | Estudio AURORA - Predicción por Registros Electrónicos de Salud       | Diagnóstico / Big Data / Machine Learning               | Avanzada      |
| A.5    | Detección Multimodal XGBoost + CNN-LSTM (EEG / Eye-Tracking)          | Diagnóstico / IA Explicable (XAI)                       | Avanzada      |
| A.6    | LLMs para Diagnóstico de Trastornos del Lenguaje (GPT-3.5 / GPT-4o)   | Diagnóstico / Procesamiento de Lenguaje Natural         | Accesible     |
| B.1    | Herramienta "Noora" - Entrenamiento en Empatía con GPT-4              | Intervención / LLMs / Empatía                           | Accesible     |
| B.2    | CognitiveBotics - Plataforma Terapéutica con IA y Gamificación        | Intervención / ABA Digital / Gamificación               | Intermedia    |
| B.3    | Social Conversation Program - Stanford Autism Center                  | Intervención / IA Generativa / Habilidades Sociales     | Intermedia    |
| B.4    | LLMs como "Scaffolding" Comunicacional (Claude / Anthropic)           | Intervención / IA Generativa / Comunicación Aumentativa | Accesible     |

| Cód.   | Proyecto                                                            | Área Principal                                        | Complejidad   |
|--------|---------------------------------------------------------------------|-------------------------------------------------------|---------------|
| B.5    | Robots Sociales - Ensayos Clínicos Aleatorizados (Science Robotics) | Intervención / Robótica Social                        | Avanzada      |
| B.6    | Robot Pepper con Tratamiento de Respuesta Pivotal (TRP)             | Intervención / Robótica Social / Regulación Emocional | Avanzada      |
| B.7    | Robot iCub para Entrenamiento en Teoría de la Mente                 | Intervención / Robótica Humanoide / Cognición Social  | Avanzada      |
| B.8    | IA Generativa para Entrenamiento en Teoría de la Mente (Juego)      | Intervención / LLMs / Teoría de la Mente              | Intermedia    |
| C.1    | Proyecto TEAsy-Life - IA para Autonomía en Adultos                  | Autonomía / Vida Diaria / IA Contextual               | Intermedia    |
| C.2    | Wearable para Reconocimiento de Emociones en Tiempo Real            | Autonomía / Wearables / Retroalimentación Háptica     | Avanzada      |
| C.3    | Wearables Somáticos para Detección de Sobrecarga Sensorial          | Autonomía / Wearables / Biomarcadores                 | Avanzada      |
| D.1    | IA Adaptativa para Aprendizaje Matemático en TEA/TDAH               | Educación / IA Adaptativa                             | Accesible     |
| D.2    | Stanford SCALE Initiative - IA en Educación para TEA                | Educación / Revisión Sistemática                      | Accesible     |
| E.1    | Chatbots GenAI para Apoyo y Educación a Familias                    | Apoyo a Cuidadores / LLMs / Soporte Emocional         | Accesible     |
| E.2    | IA para Gestión de Documentación Clínica y Evaluaciones             | Gestión Clínica / IA Generativa / Eficiencia          | Accesible     |
| F.1    | Subtipificación Biológica con IA - ASF / NIH                        | Investigación / Machine Learning / Genómica           | Avanzada      |
| F.2    | Modelos Computacionales de Corteza Visual - CONICET Argentina       | Investigación / Neurociencia Computacional / IA       | Avanzada      |

| Cód.   | Proyecto                                                        | Área Principal                                      | Complejidad   |
|--------|-----------------------------------------------------------------|-----------------------------------------------------|---------------|
| F.3    | Seis Estrategias de Innovación IA para TEA (Revisión Narrativa) | Investigación / Revisión / Innovación               | Avanzada      |
| F.4    | Neurofeedback Híbrido Asistido por IA (NFT-AI)                  | Investigación / Neurociencia / Regulación Emocional | Avanzada      |

## 4. Oportunidades Prioritarias para el Convenio IPPU-UTEC

A partir del inventario sistematizado, se identifican las siguientes oportunidades con mayor potencial de desarrollo en el corto y mediano plazo, considerando el perfil de la Fundación IPPU (trabajo directo con personas con TEA y diversidad funcional), las capacidades de la LIDIA-UTEC  (ingeniería  de  datos,  IA  aplicada,  investigación  académica)  y  la  escala institucional de ambas organizaciones.

## Proyectos de Inicio Inmediato (0-6 meses)

Baja complejidad técnica · Impacto directo en la comunidad · Recursos disponibles

- Chatbot de apoyo a familias basado en LLMs (E.1): Diseño y piloto de un asistente conversacional para responder consultas frecuentes de familias con hijos con TEA, alimentado con protocolos y materiales de la Fundación IPPU. Alta viabilidad con APIs de modelos disponibles (GPT-4, Claude).
- Herramienta de documentación clínica asistida por IA (E.2): Adaptación de protocolos tipo NHS para automatizar la generación de informes de sesión, liberando tiempo profesional para intervención directa.
- Aplicación de IA adaptativa para habilidades educativas (D.1): Desarrollo o adaptación de un módulo de aprendizaje adaptativo para usuarios de la Fundación IPPU, inspirado en los resultados del estudio de UCLA.
- Análisis exploratorio de patrones en datos existentes de la Fundación IPPU: Aplicación de técnicas básicas de ML a datos longitudinales ya disponibles (con debidos protocolos de privacidad) para identificar patrones evolutivos en usuarios.

## Proyectos de Mediano Plazo (6-18 meses)

Complejidad moderada · Requieren articulación clínica y técnica · Alto valor científico

- Sistema de apoyo contextual para adultos autistas en actividades de la vida diaria (C.1): Adaptación del modelo TEAsy-Life al contexto uruguayo, con participación activa de usuarios adultos de la Fundación IPPU en el co-diseño.
- Entrenamiento de habilidades sociales con IA generativa (B.1, B.4, B.8): Desarrollo de un prototipo de herramienta de entrenamiento conversacional para adolescentes y adultos autistas verbales, con evaluación clínica integrada.

- Sistema de detección temprana basado en ML (A.1, A.6): Exploración de modelos de clasificación utilizando datos de evaluación temprana, en colaboración con equipos clínicos de INAU y la Fundación.
- Plataforma de gamificación terapéutica (B.2): Diseño de un módulo piloto inspirado en CognitiveBotics, adaptado al español rioplatense y a los protocolos de intervención de la Fundación IPPU.

## Proyectos de Largo Plazo y Líneas de Investigación (18+ meses)

Alta complejidad técnica · Potencial de publicación científica · Requieren financiamiento específico

- Biomarcadores digitales y subtipificación (F.1): Participación en consorcios de investigación o diseño de estudios propios para identificar perfiles fenotípicos en la población de la Fundación.
- Detección multimodal con XAI (A.5): Desarrollo de modelos de clasificación explicables sobre datos multimodales (comportamentales, de voz, de video) con validación clínica.
- Digital twins para simulación de intervenciones (F.3): Exploración de modelos computacionales personalizados para simular el impacto de distintas intervenciones antes de su aplicación.
- Integración de neurofeedback y IA (F.4): Colaboración con grupos clínicos para explorar la viabilidad de protocolos NFT-AI en el contexto de la Fundación.

## 5. Principios Orientadores del Desarrollo

Independientemente del proyecto que se priorice, el convenio IPPU-UTEC se compromete a desarrollar sus iniciativas bajo los siguientes principios, consistentes con los estándares internacionales identificados en la literatura revisada:

| Co-diseño con personas autistas   | Toda tecnología desarrollada debe involucrar a personas con TEA y sus familias desde las primeras etapas del diseño, no solo como sujetos de estudio sino como colaboradores activos.   |
|-----------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Accesibilidad y usabilidad        | Los productos deben ser utilizables por personas con diversidad funcional en sus variadas expresiones, con interfaces accesibles y documentación en lenguaje claro.                     |
| Explicabilidad (XAI)              | Los modelos de IA utilizados en contextos clínicos deben ser transparentes y explicables, permitiendo que profesionales y familias comprendan las decisiones del sistema.               |
| Ética y privacidad de datos       | Todo manejo de datos personales seguirá los más altos estándares de protección, con consentimiento informado, anonimización y protocolos aprobados por comités de ética.                |

## Validación clínica rigurosa

Impacto local con visión global Ningún desarrollo será presentado como intervención clínica sin pasar por procesos de validación apropiados, en colaboración con profesionales de la salud.

Las soluciones deben ser relevantes para la realidad uruguaya y latinoamericana, adaptando evidencia internacional al contexto cultural, lingüístico e institucional local.

## 6. Nota sobre Evidencia y Limitaciones

Aviso metodológico importante para la interpretación de este documento

Las propias revisiones  sistemáticas de mayor rigor (Frontiers in Psychiatry,  The Lancet eBioMedicine) advierten que la mayoría de los enfoques basados en IA generativa para TEA aún se encuentran en fases experimentales o de prototipo temprano.  Se  requiere validación clínica rigurosa antes de cualquier implementación generalizada.

## Las limitaciones más frecuentes identificadas en la literatura son:

- Tamaños de muestra reducidos y falta de diversidad demográfica en los estudios.
- Sesgo en datasets utilizados para entrenamiento (mayoría en inglés, contextos anglosajones).
- Ausencia de ensayos longitudinales de largo plazo para validar efectos sostenidos.
- Necesidad de mayor representación del Sur Global y poblaciones hispanohablantes.
- Preocupaciones éticas sobre privacidad, consentimiento y uso de datos sensibles de menores.

Estas limitaciones no invalidan el enorme potencial de las iniciativas relevadas, sino que refuerzan  la  necesidad  de  que  el  convenio  IPPU-UTEC  opere  con  rigor  metodológico, revisión ética institucional, y un enfoque centrado en las personas, lo que a su vez posiciona a ambas organizaciones como actores de referencia para producir evidencia contextualizada y culturalmente relevante en la región.

## Fundación IPPU - "Un lugar para crecer"

Avda. Carlos María de Pena 4222 · CP 11.900 · Montevideo, Uruguay www.fundacionippu.uy  |  fippu@vera.com.uy Organización No Gubernamental en Estado Consultivo Especial - ECOSOC (ONU)