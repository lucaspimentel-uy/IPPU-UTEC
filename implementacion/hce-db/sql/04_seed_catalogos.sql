-- =====================================================================
-- HCE IPPU — 04. Seed de catálogos (datos de referencia)
-- Contenido transcrito del prototipo HCE_IPPU_Prototipo_v1.html y del
-- documento técnico. Reejecutable (upsert / delete previo por catálogo).
-- =====================================================================
SET search_path TO hce, public;

-- ---------------------------------------------------------------------
-- Configuración institucional (parametrizable — IPPU por defecto)
-- ---------------------------------------------------------------------
INSERT INTO config_institucion (id, nombre_institucion, servicios_habilitados, marca_agua_export)
VALUES (1, 'Fundación IPPU — Instituto Psico Pedagógico Uruguayo',
        '{atencion_diurna}', 'Fundación IPPU — documento clínico reservado')
ON CONFLICT (id) DO UPDATE
   SET nombre_institucion = EXCLUDED.nombre_institucion;

-- ---------------------------------------------------------------------
-- Vocabulario controlado (§8.1) — «severo / muy severo», nunca «grave»
-- ---------------------------------------------------------------------
INSERT INTO vocabulario (clave, termino, prohibido) VALUES
  ('severidad_alta',     'severo',     '{grave}'),
  ('severidad_muy_alta', 'muy severo', '{"muy grave"}'),
  ('necesidad_apoyo',    'alta necesidad de apoyo', '{}')
ON CONFLICT (clave) DO UPDATE SET termino = EXCLUDED.termino, prohibido = EXCLUDED.prohibido;

-- ---------------------------------------------------------------------
-- Baremo Único Nacional (§7.2) — PARAMETRIZABLE. Validar contra la
-- reglamentación vigente del Consejo Asesor al momento del desarrollo.
-- ---------------------------------------------------------------------
DELETE FROM baremo_categoria;
INSERT INTO baremo_categoria (nombre, pct_min, pct_max, orden) VALUES
  ('Sin discapacidad', 0,   4,   1),
  ('Leve',             5,   24,  2),
  ('Moderado',         25,  49,  3),
  ('Severo',           50,  95,  4),
  ('Muy severo',       96,  100, 5);

-- ---------------------------------------------------------------------
-- Categorías documentales (§3.2 HCE-DOC) — parametrizables
-- ---------------------------------------------------------------------
INSERT INTO categoria_documento (nombre, es_registro_historico, orden) VALUES
  ('Informe médico externo',                     false, 1),
  ('Informe escolar',                            false, 2),
  ('Evaluación externa (otra institución)',      false, 3),
  ('Documento INAU',                             false, 4),
  ('Documento BPS',                              false, 5),
  ('Autorización / consentimiento',              false, 6),
  ('Estudio complementario',                     false, 7),
  ('Registro histórico — HCE anterior',          true,  8),
  ('Otro',                                       false, 9)
ON CONFLICT (nombre) DO NOTHING;

-- ---------------------------------------------------------------------
-- Recordatorios configurables (§4.4) — nunca fechas límite bloqueantes
-- ---------------------------------------------------------------------
INSERT INTO recordatorio_config (clave, descripcion, referencia) VALUES
  ('idea_ingreso',  'Aplicación del IDEA en las primeras semanas del ingreso', 'ingreso'),
  ('protocolo_a',   'Protocolo A en el receso de julio',                       'receso_julio'),
  ('protocolo_b',   'Protocolo B en la última semana lectiva',                 'cierre_lectivo'),
  ('informe_cierre','Informe de Cierre en los días posteriores al Protocolo B','post_protocolo_b'),
  ('vf_vencimiento','Vencimiento/revisión de la valoración funcional (90 y 30 días)','vencimiento_vf')
ON CONFLICT (clave) DO NOTHING;

-- =====================================================================
-- IDEA (Rivière, 2001) — escalas, dimensiones y anclajes (§5.1)
-- =====================================================================
INSERT INTO idea_escala (id, letra, nombre, orden) VALUES
  (1, 'A', 'Relación Social',            1),
  (2, 'B', 'Comunicación y Lenguaje',    2),
  (3, 'C', 'Anticipación / Flexibilidad',3),
  (4, 'D', 'Simbolización',              4)
ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre;

INSERT INTO idea_dimension (id, escala_id, nombre, que_evalua, anclajes) VALUES
 (1, 1, 'Relaciones sociales',
   'Cualidad del vínculo y del interés por las personas: desde el aislamiento completo hasta la motivación de relación con iguales.',
   '{"8":"Aislamiento completo; impermeabilidad a las personas y a sus iniciativas.","6":"Incapacidad de relación con iguales, aunque hay vínculo establecido con algunos adultos.","4":"Relaciones con iguales infrecuentes, inducidas desde fuera y de carácter externo.","2":"Hay motivación por relacionarse con iguales, pero dificultad por falta de comprensión de las sutilezas sociales.","0":"Sin trastorno cualitativo de la relación social."}'),
 (2, 1, 'Capacidades de referencia conjunta',
   'Capacidad de compartir la acción, la atención y la preocupación con otra persona (mirada referencial, acción conjunta).',
   '{"8":"Ausencia completa de acciones conjuntas o de interés por las acciones de otras personas.","6":"Realiza acciones conjuntas simples, sin miradas significativas de referencia conjunta.","4":"Emplea miradas de referencia conjunta en situaciones dirigidas, pero no en situaciones abiertas.","2":"Pautas de atención y acción conjunta establecidas; pueden faltar la preocupación conjunta o los marcos comunes.","0":"Sin trastorno cualitativo de la referencia conjunta."}'),
 (3, 1, 'Capacidades intersubjetivas y mentalistas',
   'Sintonía emocional con las personas y comprensión de que los otros tienen mente (intersubjetividad, teoría de la mente).',
   '{"8":"Ausencia de pautas de expresión emocional correlativa; falta de interés por las personas.","6":"Respuestas intersubjetivas primarias ocasionales; sin intersubjetividad secundaria.","4":"Indicios de intersubjetividad secundaria, sin atribución explícita de mente; no resuelve tareas mentalistas.","2":"Conciencia explícita de que las otras personas tienen mente; resuelve tareas mentalistas simples con dificultades en situaciones naturales.","0":"Sin trastorno cualitativo intersubjetivo o mentalista."}'),
 (4, 2, 'Funciones comunicativas',
   'Para qué se comunica: desde la ausencia de comunicación intencional hasta la capacidad de declarar y compartir experiencia.',
   '{"8":"Ausencia de comunicación entendida como relación intencionada mediante significantes.","6":"Conductas instrumentales con personas para pedir (llevar de la mano), sin otras pautas comunicativas.","4":"Conductas comunicativas para pedir, pero no para compartir experiencia o cambiar el mundo mental.","2":"Comunica para declarar y comentar, con escasez de declaraciones sobre el mundo interno propio.","0":"Sin trastorno cualitativo de las funciones comunicativas."}'),
 (5, 2, 'Lenguaje expresivo',
   'Producción del lenguaje: desde el mutismo hasta el discurso conversacional.',
   '{"8":"Mutismo total o funcional (pueden existir verbalizaciones sin valor comunicativo).","6":"Palabras sueltas o ecolalias; no hay oraciones creativas.","4":"Oraciones con algún grado de creación propia, que no configuran discurso ni conversación.","2":"Lenguaje discursivo con dificultades: conversación limitada, poco recíproca o poco flexible.","0":"Sin trastorno cualitativo del lenguaje expresivo."}'),
 (6, 2, 'Lenguaje receptivo',
   'Comprensión del lenguaje: desde la desatención total al habla hasta la comprensión del discurso con dificultades sutiles.',
   '{"8":"«Sordera central»: ignora por completo el lenguaje; no responde a órdenes ni a su nombre.","6":"Asocia enunciados verbales con conductas propias (órdenes simples), sin comprender el lenguaje como sistema.","4":"Comprensión literal, poco flexible y descontextualizada; no comprende discurso.","2":"Comprende discurso y conversa, con dificultades para ironía, sarcasmo y doble sentido.","0":"Sin trastorno cualitativo del lenguaje receptivo."}'),
 (7, 3, 'Anticipación',
   'Capacidad de anticipar lo que va a suceder y de manejar los cambios del entorno.',
   '{"8":"Adherencia inflexible a estímulos que se repiten idénticos; resistencia intensa a cambios; sin conductas anticipatorias.","6":"Conductas anticipatorias simples en rutinas cotidianas; oposición frecuente a los cambios.","4":"Incorpora estructuras temporales amplias; puede haber reacciones catastróficas ante cambios no anticipados.","2":"Alguna capacidad de regular el ambiente y manejar cambios; prefiere un orden claro, con cierta flexibilidad.","0":"Sin trastorno cualitativo de la anticipación."}'),
 (8, 3, 'Flexibilidad',
   'Rigidez conductual y mental: estereotipias, rituales, apegos y contenidos obsesivos.',
   '{"8":"Predominio de estereotipias motoras simples.","6":"Rituales simples; resistencia a cambios mínimos del entorno.","4":"Rituales complejos; apego excesivo a objetos; preguntas obsesivas.","2":"Contenidos de pensamiento obsesivos y limitados; intereses poco funcionales y poco flexibles.","0":"Sin trastorno cualitativo de la flexibilidad."}'),
 (9, 3, 'Sentido de la actividad',
   'Grado en que la actividad propia tiene propósito y sentido para la persona.',
   '{"8":"Predominio masivo de conductas sin propósito ni meta.","6":"Actividades funcionales breves ante consignas externas; sin comprensión de la finalidad.","4":"Actividades autónomas de ciclo largo que se realizan sin comprensión precisa de su sentido.","2":"Presencia de motivos de logro; actividades complejas cuyo sentido se comprende parcialmente; requiere motivación externa.","0":"Sin trastorno cualitativo del sentido de la actividad."}'),
 (10, 4, 'Ficción e imaginación',
   'Juego funcional, juego simbólico y capacidad de crear ficciones.',
   '{"8":"Ausencia completa de juego funcional y simbólico.","6":"Juegos funcionales elementales, poco flexibles, inducidos desde fuera y repetitivos.","4":"Juego simbólico evocado y poco espontáneo; ficciones escasas y poco flexibles.","2":"Ficciones complejas, usadas a veces como recurso de aislamiento o con dificultades para diferenciar ficción y realidad.","0":"Sin trastorno cualitativo de la ficción y la imaginación."}'),
 (11, 4, 'Imitación',
   'Capacidad de imitar acciones, gestos y modelos de otras personas.',
   '{"8":"Ausencia completa de conductas de imitación.","6":"Imitaciones motoras simples, evocadas desde fuera; no espontáneas.","4":"Imitación espontánea esporádica, poco versátil y poco intersubjetiva.","2":"Imitación establecida; ausencia de modelos internos de referencia; imitación poco flexible.","0":"Sin trastorno cualitativo de la imitación."}'),
 (12, 4, 'Suspensión (capacidad de crear significantes)',
   'Capacidad de «dejar en suspenso» acciones y significados para crear significantes: señalar, simbolizar, comprender metáforas.',
   '{"8":"No suspende preacciones para crear gestos comunicativos (p. ej., no señala).","6":"No suspende acciones instrumentales para crear símbolos enactivos (no hay juego funcional).","4":"No suspende las propiedades reales de los objetos para crear ficciones y juego simbólico.","2":"No deja en suspenso representaciones para comprender metáforas, ironía o doble sentido.","0":"Sin trastorno cualitativo de la suspensión."}')
ON CONFLICT (id) DO UPDATE
   SET nombre = EXCLUDED.nombre, que_evalua = EXCLUDED.que_evalua, anclajes = EXCLUDED.anclajes;

-- =====================================================================
-- Escala IPPU-TEA — 4 escalas × 6 ítems (§5.2)
-- Likert de progreso 1–5 (1 regresión significativa … 5 progreso generalizado)
-- =====================================================================
INSERT INTO ippu_escala (id, codigo, nombre, orden) VALUES
  (1, 'E1', 'Relación Social',             1),
  (2, 'E2', 'Comunicación y Lenguaje',     2),
  (3, 'E3', 'Anticipación y Flexibilidad', 3),
  (4, 'E4', 'Simbolización',               4)
ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre;

INSERT INTO ippu_item (id, escala_id, numero_en_escala, texto, referencia) VALUES
 (1, 1,1,'Calidad y frecuencia del contacto visual intencional en intercambios sociales con adultos y pares','DSM-5-TR A1a · CIF d710 · Pelphrey et al. (2005)'),
 (2, 1,2,'Iniciativa e interés espontáneo hacia otras personas; respuesta a la presencia social','DSM-5-TR A1b · CIF d720 · Wing & Gould (1979)'),
 (3, 1,3,'Atención conjunta: seguimiento de la mirada y el gesto del adulto; señalización para compartir interés','DSM-5-TR A1a · CIF d7105 · Mundy & Newell (2007)'),
 (4, 1,4,'Comprensión de emociones y estados mentales ajenos; tareas mentalistas según nivel evolutivo','DSM-5-TR A1 · CIF d710 · Baron-Cohen et al. (1985)'),
 (5, 1,5,'Reciprocidad emocional: adecuación de la respuesta afectiva al contexto y al interlocutor','DSM-5-TR A1b · CIF d7200 · ADOS-2 (Lord et al., 2012)'),
 (6, 1,6,'Iniciación y mantenimiento de intercambios sociales con pares en contexto grupal','DSM-5-TR A1c · CIF d750 · PEERS (Laugeson, 2014)'),
 (7, 2,1,'Uso funcional del lenguaje oral o del sistema AAC (PECS, VOCA, pictogramas) como comunicación intencional','DSM-5-TR A1a · CIE-11 6A02.1/6A02.3 · CIF d330 · Mirenda (2009)'),
 (8, 2,2,'Comprensión de consignas verbales simples y complejas en contexto natural y estructurado','DSM-5-TR A1 · CIF d310 · Wetherby & Prizant (2002)'),
 (9, 2,3,'Reducción de patrones de lenguaje atípico (ecolalia, inversión pronominal) o incremento del uso funcional','DSM-5-TR A1a · CIF d330 · Prizant & Duchan (1981)'),
 (10,2,4,'Repertorio y uso funcional de gestos comunicativos: señalar, mostrar, dar, saludar con propósito social','DSM-5-TR A1a · CIF d3350 · Capone & McGregor (2004)'),
 (11,2,5,'Habilidades pragmáticas: ajuste al contexto, turno comunicativo, inicio y cierre de intercambios','DSM-5-TR A1c · CIF d350 · Bishop (2011)'),
 (12,2,6,'Integración de la comunicación no verbal (expresión facial, tono, postura) en el intercambio','DSM-5-TR A1a · CIF d3350 · Wetherby & Prizant (2002)'),
 (13,3,1,'Tolerancia a cambios en rutinas, horarios y entorno físico; adaptación ante imprevistos','DSM-5-TR B2 · CIF d2303 · TEACCH (Mesibov et al., 2004)'),
 (14,3,2,'Frecuencia e intensidad de comportamientos repetitivos que interfieren con el funcionamiento grupal','DSM-5-TR B1 · CIF d230 · Y-BOCS adaptado (Scahill et al., 2006)'),
 (15,3,3,'Flexibilización de rituales y estereotipias motoras o verbales; posibilidad de interrupción con apoyo','DSM-5-TR B1 · CIF d2303 · Turner (1999)'),
 (16,3,4,'Flexibilidad cognitiva: capacidad de cambiar de tarea, estrategia o solución ante demanda del entorno','DSM-5-TR B2 · CIF d1641 · BRIEF (Gioia et al., 2000)'),
 (17,3,5,'Regulación sensorial: reducción de reacciones desadaptativas ante estímulos del entorno grupal','DSM-5-TR B4 · CIF b250 · Ayres (1979) · Marco et al. (2011)'),
 (18,3,6,'Comprensión del sentido y propósito de las actividades; orientación hacia metas externas','DSM-5-TR B2 · CIF d230 · TEACCH (Mesibov et al., 2004)'),
 (19,4,1,'Emergencia o ampliación del juego funcional y simbólico: uso representacional de objetos, ficción','DSM-5-TR A · CIF d8800 · Leslie (1987) · Jarrold et al. (1996)'),
 (20,4,2,'Imitación intencional de acciones, gestos y secuencias demostradas por adultos y pares','DSM-5-TR A1a · CIF d1550 · Meltzoff & Moore (1977) · Rogers et al. (2003)'),
 (21,4,3,'Participación e integración en juegos sociales con pares: juegos grupales, roles y turnos','DSM-5-TR A1c · CIF d8803 · Wolfberg (2009)'),
 (22,4,4,'Construcción de narrativas: secuencias causales en el juego o el relato ajustadas al nivel evolutivo','DSM-5-TR A · CIF d1660 · Schuler & Wolfberg (2000)'),
 (23,4,5,'Generalización de conductas imitadas a nuevos contextos, materiales y personas','CIF d1551 · Stahmer (1995) · Lovaas (1987)'),
 (24,4,6,'Comprensión y creación de significantes: gestos, símbolos enactivos, ficción y metáfora según nivel','CIF d1559 · Rivière dim. 12 (Suspensión) · Tomasello (1995)')
ON CONFLICT (id) DO UPDATE SET texto = EXCLUDED.texto, referencia = EXCLUDED.referencia;
