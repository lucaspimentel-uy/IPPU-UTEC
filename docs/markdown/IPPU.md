## Inteligencia Artificial y Datos en el Trastorno del Espectro Autista Areas de Investigacion y Aplicacion Clinica

## indice

1. Resumen Ejecutivo: Areas Prioritarias (Cuadro)
3. Diagn6stico y Deteccion Temprana
2. Introduccion y Contextualizacion
4. 4.Historias Clinicas Electronicas y Analisis de Datos
6. Sistemas de Comunicacion Aumentativa y Alternativa (CAA)
6. 5.Analisis de Datos de Evaluaciones y Tests
7. Realidad Virtual para Entrenamiento de Habilidades Sociales
9. Seguimiento Ocular (Eye-Tracking) y Analisis de la Mirada
8. Terapia Asistida por Robots
10. 10.Personalizacion de Intervenciones Terapeuticas
11. 12.Referencias Clave por Area
12. 11.Consideraciones Eticas y Desafios
13. Proyectos Iniciales Recomendados IA (Fases)

## 1.Resumen Ejecutivo:Areas Prioritarias

La inteligencia artificial yel analisisdedatosofrecen oportunidades transformadoraspara mejorartodoslos aspectos dela atencion apersonasconTEA,desde el diagnostico temprano hasta intervenciones terapeuticaspersonalizadas.El siguientecuadroresume lasareas de alto impactoyviabilidadparalacolaboracioninmediata.

Madurez de datos institucionales.

| Area Prioritaria                               | impacto                                         | Tecnologica                            | Viabilidad                     | Accion Concreta Propuesta                                                                                   |
|------------------------------------------------|-------------------------------------------------|----------------------------------------|--------------------------------|-------------------------------------------------------------------------------------------------------------|
| Diagnosticoy Evaluacion                        | Alto-Deteccion mastempranay precisa             | precision>85%                          | Media-Alta- etiquetados        | Implementarsistemade screeningbasadoenanalisis multimodal (incluyendo eye- trackingy datosclinicos).        |
| Historias Clinicas Electronicas                | derecursos clinicos                             | en contexto medico                     | disponibles                    | Sistema deextraccion automaticadecriterios diagnosticosy alertas tempranasbasadasen notas clinicas.         |
| Cornunicacion Aumentativa(CAA) de vida directa | MuyAlto-CalidadMedia-Alta-VariosAlta-Tecnologia | sistemas exitosos accesible            |                                | .Desarrollar sistema de generacion de pictogramas personalizados con IA generativa usando fotos familiares. |
| Eye-Tracking                                   | Alto-Biomarcador Alta-Tecnologia objetivo       | madura                                 | Media-Alta- Equipos accesibles | Implementarprotocolode screening de 2minutos con eye- tracking debajo costo.                                |
| Analisis de Evaiuacionesy Tests                | Medio-Alto- Optimizacion de instrumentos        | Alta-Tecnicas deAlta-Datos ML.estandar | estructurados                  | Crear normas locales y versionesabreviadasde instrumentosmedianteanalisis                                   |

## 2.Introducciony Contextualizacion

El Trastorno del Espectro Autista (TEA) es una condicion del neurodesarrollo caracterizada por desafios en la comunicacion social, la interaccion social y patrones de comportamiento clinica del TEA representa una frontera prometedora para mejorar el diagnostico, el tratamiento y la calidad de vida de ninos,adolescentes y jovenes conesta condicion.

A nivel mundial, la investigacion clinica y tecnologica ha generado avances significativos,como la validacion de algoritmos de machine learning (ML) que pueden distinguir el TEA del desarrollo neurotipico con precisiones reportadas superiores al 85-95%, y la autorizaci6n por la FDA del primer dispositivo basado en IA/ML (CanvasDx) para ayuda diagnostica.Esta evidencia, publicada en revistas revisadas por pares, establece el potencial de la IA como una herramienta de apoyorigurosa.

TEA y la necesidad de optimizar los recursos clinicos para el diagnostico temprano,que es fundamental para que las intervenciones sean efectivas. Este documento presenta un panorama estas herramientas en nuestra poblacion local. La colaboracion con la Licenciatura en Datos e IA es esencial para desarrollar las lineas de investigacion propuestas, como la validacion de herramientas diagnosticas basadas en IA en poblacion uruguaya y la creacion de normas locales para instrumentos mediante el analisis de nuestros datos institucionales.

## 3. Diagnostico y Deteccion Temprana

El diagnostico temprano es critico, pero los metodos tradicionales (como ADOS-2 y ADI-R) pueden ser subjetivos y requieren profesionales altamente capacitados.

## 3.1 Aplicaciones de IA

Los algoritmos de machine learning (ML) pueden analizar multiples fuentes de datos (multimodales) para mejorar la precision diagnostica.

- PrecisionyVentajas:Estudios demuestran que losmodelos deMLpueden distinguirel TEA con una precision superior al 85-95%. Esto ayuda a reducir sesgos subjetivos, permite la deteccion temprana (antes de los 3 anos) y ofrece escalabilidad.
- AnalisisMultimodal:Estoincluye elanalisisdeexpresionesfaciales,dondemodelosde deep learning como ViT-ResNet152 han alcanzado el 91.33% de precision.
- Dispositivo Aprobado:CanvasDx,desarrolladopor Cognoa Inc.y lideradopor Dennis Wall, es el primer y unico dispositivo basado en IA/ML autorizado por la FDA para ayuda diagnostica en TEA.

## 3.2LineasdeInvestigacionPropuestas

Sepropone el desarrollo de modelospredictivos utilizando datos demograficos,clinicos y conductuales locales,asi como la validacion de herramientas diagnosticasbasadas en IA en poblacion uruguaya.

## 4.Historias ClinicasElectronicasyAnalisis deDatos

Las HCE contienen informacion valiosa,pero gran parte se encuentra en notas clinicas no estructuradas.

## 4.1 Procesamiento de Lenguaje Natural (NLP)

Los modelos de NLP, como BERT clinico o GatorTron (un modelo de 90 mil millones de diagnostica.

- Tareas: Extraccion de conceptos clinicos, relaciones medicas e identificacion de criterios diagnosticos.
- Evidencia: Leroy et al. (2024) demostraron el uso de deep learming transparente para identificar TEA en HCE utilizando notas clinicas.

## 4.2 Prediccion deDiagnostico

Modelos como XGBoost, que vinculan datos de ninos y madres en las HCE, han mostrado una alta precision (AUROC = 0.798 para poblacion general) en la prediccion de un diagn6stico de TEA, lo que facilita la identificacion temprana.

## 4.3 Lineas de Investigacion Propuestas

El objetivo es establecer un sistema de alertas tempranas basado en el analisis de notas clinicas y la extraccion automatica de criterios diagnosticos DsM-5 de registros clinicos.

## 5.Analisis de Datos de Evaluaciones y Tests

Instrumentos como ADOS-2, MSEL, y VABS son centrales. EI machine learning puede optimizar su uso.

## 5.1 Optimizacion de Instrumentos mediante ML

instrumentos sin perdida de precision, reduciendo el tiempo de evaluacion.

- ·Evidencia: Levy et al.(2017) usaronML para el analisis de datosADOS,obteniendo un AUC de 0.95 (M6dulo 3) y 0.93 (Modulo 2).

## 5.2 Lineas de Investigacion Propuestas

La institucion debe priorizar la creacion de normas locales para los instrumentos mediante elanalisisdedatosinstitucionalesy laprediccion derespuesta a intervencionesespecificas.

## 6. Sistemas de Comunicacion Aumentativa y Alternativa (CAA)

de estos sistemas.

## 6.1 GeneraciondePictogramasPersonalizados con IA

Esta es una Oportunidad de Innovacion que cumple con unrequisito clave de la consigna: propias utilizando IA generativa.

- Tecnologias:Sepueden usar modelos image-to-image para convertir lasfotos familiares al estilo pictograma, aplicando tecnicas de fine-tuning para.mantener la consistencia visual con sets existentes (como ARASAAC). Draffan et al. (2023) abordan el soporte de laIApara adaptacionesdesimbolospictograficos enCAA.

## 6.2PredicciondePictogramas

Modelos de prediccion se basan en la frecuencia de uso y la secuenciacion pseudo-sintactica. Elsahar et al. (2023) introdujeron PrAACT (Predictive Augmentative and Alternative Communication with Transformers), demostrando mejor desempeno que modelos preentrenados.

## 6.3 Lineas de Investigacion Propuestas

generativa yel analisis de patrones de uso de CAA para la optimizaci6n de vocabularios son esenciales.

## 7. Realidad Virtual para Entrenamiento de Habilidades Sociales,

La Realidad Virtual (RV) ofrece entornos controlados para practicar habilidades sociales, lo que reducela ansiedad asociada a situaciones del mundoreal.

## 7.1EvidenciadeEfectividad

Meta-analisis recientes de Estudios Controlados Aleatorizados (RCTs) indican que la RV inmersiva mejora habilidades cognitivas,socialesy emocionales en ninos y adolescentes con TEA.

- ·Ventajas: Mayor motivacion, mejor adherencia y adaptabilidad a caracteristicas individuales.
- Tipos de Escenarios: Incluyen entrenamiento en reconocimiento de emociones, situaciones cotidianas (pedir cafe en un bar) y entrenamiento laboral.

## 7.2 Integracion con IA

Algoritmos de MLpueden ajustar la dificultad de los escenarios deRVsegunel desempenodel personalizacion adaptativa.

## 7.3LineasdeInvestigacionPropuestas

Esfundamental el desarrollodeescenariosdeRVadaptados al contextocultural uruguayo y un sistema de evaluacion automatica de desempeno en estos escenarios.

## 8. Terapia Asistida por Robots

Losrobotssocialesactuancomomediadores,ofreciendopredictibilidadysimplicidaden las interacciones, y reduciendo la ansiedad social.

## 8.1 Robots Utilizados e Investigacion

la investigacion.QTrobot ha mostrado la capacidad de reducir comportamientos repetitivos (ej., hand flapping) tresveces menos que con un terapeuta humano.

- Evidencia(RCT):UnRCTdeHolevaetal.(2024)confirmoquelaintervencionasistida social) y la capacidad degenerary responder a solicitudesconductuales.

## 8.2Integracion con IA

## 8.3Lineas de InvestigacionPropuestas

Se recomienda un estudio piloto con robot NAO o QTrobot en la institucion y el desarrollo de un protocolo estandarizado de terapia asistida por robot adaptado a la poblacion uruguaya.

## 9. Seguimiento Ocular (Eye-Tracking) y Analisis de la Mirada

desde edades muy tempranas (9-14 meses).

## 9.1 Eye-Tracking como Herramienta Diagnostica

rostros.

- .Precision: Meta-analisis demuestran una precision agrupada (pooled accuracy) del preescolares. ·
- Protocolo Breve: Whitehouse et al. (2024) validaron la factibilidad de un protocolo de eye-tracking de 2 minutos (Scene 1S4) para apoyar la identificacion temprana de autismo en infantes de9-14meses.

## 9.2 Modelos de Machine Learning

Modelos de deep leaming (como MobileNet) y ML clasico (SVM, Random Forest) se aplican al precisiones del 96.1% y 98.0% en datasets especificos.

## 9.3LineasdeInvestigacionPropuestas

Se propone la implementacion deun sistema de eye-tracking de bajo costopara screening y la integracion con evaluaciones clinicas tradicionales para un diagnosticomultimodal.

## 10.Personalizacion deIntervencionesTerapeuticas

Dada la alta heterogeneidad del TEA,la IAesclavepara laMedicina dePrecision.

- Objetivo: La IA puede ayudar a predecirque intervenciones funcionaran mejor para cada individuoy optimizar la dosis e intensidad de la terapia.
- Evidencia: Bone et al.(2016) utilizaron ML para predecir la mejora conductual en ninos conTEAquerecibianterapia.

## 10.1 Lineas de InvestigacionPropuestas

Desarrollar un sistema derecomendacion de intervencionesbasado enel perfil individual y laoptimizacionde laintensidad terapeutica medianteel analisis dedatoshistoricos.

## 11.Consideraciones Eticasy Desafios

La implementacion de IA debe guiarse por principios eticos solidos.

- ·Privacidad:Es crucial garantizarla anonimizacionyencriptaciondedatosclinicos de menores,ademas deobtenerel consentimiento informado delasfamilias.
- Sesgo Algoritmico: Los datos de entrenamiento deben ser representativos para evitar perpetuar sesgos. La validacion en la poblacion local uruguaya es esencial para mitigar este riesgo.
- Interpretabilidad(XAl):En el contexto clinico,losprofesionales necesitan entender las y no como un reemplazo del juicio clinico.
- entrenamiento demodelosde IA.

## 12. Referencias Clave por Area

Draffan et al. (2023), entre otros.).

## 13.Proyectos Iniciales Recomendados (Fases)

coste inicial que utilicen los datos ya existentes.

## FASE 1(CortoPlazo-6-12meses)

1. Sistema de Analisis de HCE: Extraccion automatica de informacion clinica y creacion de dashboards.
2. Generador de Pictogramas Personalizados: App que utliza IA generativa para permitir a familias crear pictogramas con fotos propias.
3. 3.Analisis Retrospectivo de Datos de Evaluacion: Creacion de normas locales y optimizacion de baterias de evaluacion.

## FASE2(Mediano Plazo-12-24 meses)

- 4.Screening con Eye-Tracking: lmplementacion deprotocolo breve y validacion con poblacion uruguaya.
- 5.Piloto deRealidad Virtual:Desarrollo de2-3escenarios adaptados culturalmente y evaluacion de su efectividad.

## FASE3(Largo Plazo-24+ meses)

- 6.Sistema de Personalizacion de Intervenciones:Prediccion de respuesta a tratamiento y recomendacion de intensidad terapeutica.
- 7.Plataforma Integrada de Datos: Integracion de todas las fuentes de datos para la investigacion continua.

## Requisitos Tecnicos Transversales

Infraestructura:Establecer un servidor seguro para el almacenamiento de datos clinicos,

- con sistemas de anonimizacion y encriptacion.
- trabajedirectamenteconel DataScientistyel desarrolladorfull-stack.