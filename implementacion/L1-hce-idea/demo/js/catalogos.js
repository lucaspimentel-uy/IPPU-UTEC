/* Catalogos: frecuencia IDEA anual, Escala IPPU-TEA (M5), Escala IDEA oficial.
   Demo L1 HCE+IDEA - IPPU x UTEC-LIDIA.
   Extraido del monolito (lineas 1805-2060) sin cambios de logica.
   Los scripts se cargan en orden en index.html: el orden ES la semantica. */
/* =============== FRECUENCIA IDEA: ANUAL — helpers =============== */
const ANIO_ACTUAL = 2026;
const anioDe = fecha => parseInt(String(fecha).slice(0,4));
function ideaEvals(nna){ return nna.historial.filter(h=>h.tipo==="idea").sort((a,b)=> a.fecha < b.fecha ? -1 : 1); }
function ultimaIdea(nna){ const e = ideaEvals(nna); return e.length ? e[e.length-1] : null; }
function tieneIdeaAnio(nna, anio){ return ideaEvals(nna).some(e => anioDe(e.fecha) === anio); }
/* M4: "pendiente" deja de ser anual — es no tener la línea base IDEA (HCE-LB) firmada. */
function tieneLBFirmada(nna){ return !!(nna.flujo && nna.flujo.lb.firmado); }
function pendienteIdea(nna){ return nna.activo && !tieneLBFirmada(nna); }
/* 6 bandas del IDEA con soporte DSM-5-TR (§5.13 / D4, Prototipo v4).
   Texto orientativo copiado tal cual (M12.1): es deliberadamente neutro.
   `paso` = lugar en la rampa SECUENCIAL de un solo matiz (--rampa-1…6, estilos.css): una banda es una clasificación clínica, no un
   estado, así que nunca usa ok/warn/bad (Fase 3-e, handoff §5.135). El nombre de la banda va siempre escrito. */
const IDEA_BANDAS = [
  {max:15, perfil:"Muy leve",                                                ns:"Nivel 1",   paso:1, txt:"Sugerencia: priorizar los objetivos en las dimensiones del IDEA con mayor puntaje individual."},
  {max:30, perfil:"Leve",                                                    ns:"Nivel 1",   paso:2, txt:"Sugerencia: revisar el perfil por escala del IDEA para focalizar los apoyos donde la afectación relativa es mayor."},
  {max:55, perfil:"Leve a moderado",                                         ns:"Nivel 1–2", paso:3, txt:"Sugerencia: atender especialmente las Escalas 1 y 2 del IDEA (Relación Social y Comunicación) al definir objetivos del semestre."},
  {max:75, perfil:"Moderado",                                                ns:"Nivel 2",   paso:4, txt:"Sugerencia: el perfil por escala del IDEA orienta la priorización de apoyos; valorar en equipo la necesidad de apoyos a la comunicación (Escala 2)."},
  {max:90, perfil:"Moderado a severo (alta necesidad de apoyo)",             ns:"Nivel 2–3", paso:5, txt:"Sugerencia: perfil de alta necesidad de apoyo; leer las cuatro escalas del IDEA en conjunto para estructurar los apoyos del entorno grupal."},
  {max:96, perfil:"Severo a muy severo (necesidad de apoyo muy sustancial)", ns:"Nivel 3",   paso:6, txt:"Sugerencia: apoyo muy sustancial en todas las áreas; los objetivos se anclan en las dimensiones del IDEA de mayor puntaje."}
];
const ideaInterpreta = t => IDEA_BANDAS.find(b => t <= b.max) || IDEA_BANDAS[IDEA_BANDAS.length-1];
const bandaIdea  = s => ideaInterpreta(s).perfil;
/* Totales de la línea base IDEA desde flujo.lb.dim (0–8 | 'NS' | null). */
function lbTotales(dim){
  const esc=[0,0,0,0]; let total=0, hayNS=false, count=0;
  (dim||[]).forEach((v,i)=>{
    if(v==="NS"){ hayNS=true; count++; }
    else if(typeof v==="number"){ esc[Math.floor(i/3)]+=v; total+=v; count++; }
  });
  return {esc, total, hayNS, count};
}

/* =============== ESCALA IPPU-TEA — Instrumento propio de IPPU (M5) ===============
   4 escalas × 6 ítems = 24, Likert 1–5 de PROGRESO (lógica inversa al IDEA).
   Citas: referencia documental, NO verificadas (bajo riesgo, §Precauciones del plan). */
const IPPU_ESCALAS = ["Relación Social","Comunicación y Lenguaje","Anticipación y Flexibilidad","Simbolización"];
const IPPU_ITEMS = [
  {e:0,t:"Calidad y frecuencia del contacto visual intencional en intercambios con adultos y pares",r:"DSM-5-TR A1a · CIF d710 · Pelphrey et al. (2005)"},
  {e:0,t:"Iniciativa e interés espontáneo hacia otras personas; respuesta a la presencia social",r:"DSM-5-TR A1b · CIF d720 · Wing & Gould (1979)"},
  {e:0,t:"Atención conjunta: seguimiento de la mirada y el gesto; señalización para compartir interés",r:"DSM-5-TR A1a · CIF d7105 · Mundy & Newell (2007)"},
  {e:0,t:"Comprensión de emociones y estados mentales ajenos; tareas mentalistas según nivel evolutivo",r:"DSM-5-TR A1 · CIF d710 · Baron-Cohen et al. (1985)"},
  {e:0,t:"Reciprocidad emocional: adecuación de la respuesta afectiva al contexto y al interlocutor",r:"DSM-5-TR A1b · CIF d7200 · ADOS-2 (Lord et al., 2012)"},
  {e:0,t:"Iniciación y mantenimiento de intercambios sociales con pares en contexto grupal",r:"DSM-5-TR A1c · CIF d750 · PEERS (Laugeson, 2014)"},
  {e:1,t:"Uso funcional del lenguaje oral o del sistema AAC (PECS, pictogramas) como comunicación intencional",r:"DSM-5-TR A1a · CIF d330 · Mirenda (2009)"},
  {e:1,t:"Comprensión de consignas verbales simples y complejas en contexto natural y estructurado",r:"DSM-5-TR A1 · CIF d310 · Wetherby & Prizant (2002)"},
  {e:1,t:"Reducción de patrones de lenguaje atípico (ecolalia, inversión pronominal) o incremento del uso funcional",r:"DSM-5-TR A1a · CIF d330 · Prizant & Duchan (1981)"},
  {e:1,t:"Repertorio y uso funcional de gestos comunicativos: señalar, mostrar, dar, saludar con propósito social",r:"DSM-5-TR A1a · CIF d3350 · Capone & McGregor (2004)"},
  {e:1,t:"Habilidades pragmáticas: ajuste al contexto, turno comunicativo, inicio y cierre de intercambios",r:"DSM-5-TR A1c · CIF d350 · Bishop (2011)"},
  {e:1,t:"Integración de la comunicación no verbal (expresión facial, tono, postura) en el intercambio",r:"DSM-5-TR A1a · CIF d3350 · Wetherby & Prizant (2002)"},
  {e:2,t:"Tolerancia a cambios en rutinas, horarios y entorno físico; adaptación ante imprevistos",r:"DSM-5-TR B2 · CIF d2303 · TEACCH (Mesibov et al., 2004)"},
  {e:2,t:"Frecuencia e intensidad de comportamientos repetitivos que interfieren con el funcionamiento grupal",r:"DSM-5-TR B1 · CIF d230 · Y-BOCS adaptado (Scahill et al., 2006)"},
  {e:2,t:"Flexibilización de rituales y estereotipias; posibilidad de interrupción con apoyo",r:"DSM-5-TR B1 · CIF d2303 · Turner (1999)"},
  {e:2,t:"Flexibilidad cognitiva: cambiar de tarea, estrategia o solución ante demanda del entorno",r:"DSM-5-TR B2 · CIF d1641 · BRIEF (Gioia et al., 2000)"},
  {e:2,t:"Regulación sensorial: reducción de reacciones desadaptativas ante estímulos del entorno grupal",r:"DSM-5-TR B4 · CIF b250 · Ayres (1979) · Marco et al. (2011)"},
  {e:2,t:"Comprensión del sentido y propósito de las actividades; orientación hacia metas externas",r:"DSM-5-TR B2 · CIF d230 · TEACCH (Mesibov et al., 2004)"},
  {e:3,t:"Emergencia o ampliación del juego funcional y simbólico: uso representacional de objetos, ficción",r:"DSM-5-TR A · CIF d8800 · Leslie (1987) · Jarrold et al. (1996)"},
  {e:3,t:"Imitación intencional de acciones, gestos y secuencias demostradas por adultos y pares",r:"DSM-5-TR A1a · CIF d1550 · Meltzoff & Moore (1977)"},
  {e:3,t:"Participación e integración en juegos sociales con pares: juegos grupales, roles y turnos",r:"DSM-5-TR A1c · CIF d8803 · Wolfberg (2009)"},
  {e:3,t:"Construcción de narrativas: secuencias causales en el juego o el relato según nivel evolutivo",r:"DSM-5-TR A · CIF d1660 · Schuler & Wolfberg (2000)"},
  {e:3,t:"Generalización de conductas imitadas a nuevos contextos, materiales y personas",r:"CIF d1551 · Stahmer (1995) · Lovaas (1987)"},
  {e:3,t:"Comprensión y creación de significantes: gestos, símbolos, ficción y metáfora según nivel",r:"CIF d1559 · Rivière dim. 12 (Suspensión) · Tomasello (1995)"},
];
const LIKERT_LBL = {1:"Regresión significativa",2:"Sin cambio observable",3:"Progreso leve / Emergente",4:"Progreso moderado / Consistente",5:"Progreso notable / Generalizado"};

/* Totales por escala (6–30) y total (24–120) desde item[24] (1–5 | null). */
function protTotales(item){
  const esc=[0,0,0,0]; let total=0, count=0;
  (item||[]).forEach((v,ix)=>{ if(typeof v==="number"){ esc[IPPU_ITEMS[ix].e]+=v; total+=v; count++; } });
  return {esc, total, count, completo: count===24};
}
/* REGLA DURA de no-homologabilidad (§5.2): sólo compara dos protocolos IPPU-TEA.
   Si se le pasa la LB (IDEA, kind:'idea') o cualquier cosa que no sea protocolo, lanza error. */
function calcularDelta(protoA, protoB){
  if(!protoA || !protoB || protoA.kind!=="protocolo" || protoB.kind!=="protocolo")
    throw new Error("calcularDelta: constructos no homologables — sólo compara dos protocolos IPPU-TEA (A y B), nunca contra el IDEA.");
  const a=protTotales(protoA.item), b=protTotales(protoB.item);
  return {esc:[0,1,2,3].map(i=>b.esc[i]-a.esc[i]), total:b.total-a.total};
}
/* Interpretación del delta por rango (§5.2, Prototipo v4 · deltaInterpreta).
   Texto y acción copiados tal cual del prototipo (M12.1). Un tramo lleva alerta=true:
   la alerta institucional Δ ≤ −7 se deriva del catálogo, no de un número suelto.
   Sin color de estado: la lectura de un Δ es una clasificación clínica, no un estado (Fase 3-e, handoff §5.135). */
function deltaInterpreta(d){
  if(d>=13) return {t:"Progreso muy significativo", a:"Documentar y analizar qué estrategias lo produjeron para replicarlas."};
  if(d>=7)  return {t:"Progreso significativo",     a:"Documentar; mantener la línea de intervención."};
  if(d>=1)  return {t:"Progreso leve",              a:"Revisar si los objetivos de esa escala son suficientemente ambiciosos."};
  if(d===0) return {t:"Sin cambio",                 a:"Analizar si el área está consolidada o requiere mayor intensidad."};
  if(d>=-6) return {t:"Regresión leve",             a:"Identificar factores contextuales; revisar estrategias."};
  return       {t:"Regresión significativa",         a:"Reunión técnica urgente; contacto con familia; posible revisión del plan.", alerta:true};
}
const fmtDelta = d => (d>0?"+":"")+d;
/* Umbral de alerta institucional derivado: el mayor Δ que aún dispara alerta:true.
   Cambiar el criterio se hace en deltaInterpreta (una sola fuente de verdad). */
const ALERTA_DELTA = (() => {
  for(let d=-1; d>=-24; d--) if(deltaInterpreta(d).alerta) return d;
  return -Infinity; // ningún tramo con alerta
})();

/* =============== ESCALA IDEA OFICIAL — Ángel Rivière, 1997/2002 ===============
   Cada dimensión: array de [puntuación, descriptor_oficial]
   Puntuaciones pares (0,2,4,6,8) = niveles principales
   Puntuaciones impares (1,3,5,7) = casos claramente situados entre dos pares
   Criterio: asignar siempre la puntuación más baja posible.
   El 0 se reserva para ausencia de anomalías en esa dimensión.             */
const DIMENSIONES = [
  {
    esc:"eA", escName:"Relación Social", color:"var(--teal)",
    dims:[
      {
        id:"D1", label:"Dimensión 1: Relaciones Sociales",
        opciones:[
          [8,"Aislamiento completo. No apego a personas específicas. No relación con adultos o iguales."],
          [6,"Incapacidad de relación. Vínculo con adultos. No relación con iguales."],
          [4,"Relaciones infrecuentes, inducidas, externas con iguales. Las relaciones más como respuesta que a iniciativa propia."],
          [2,"Motivación de relación con iguales, pero falta de relaciones por dificultad para comprender sutilezas sociales y escasa empatía. Conciencia de soledad."],
          [0,"No hay trastorno cualitativo de la relación social."]
        ]
      },
      {
        id:"D2", label:"Dimensión 2: Capacidades de Referencia Conjunta",
        opciones:[
          [8,"Ausencia completa de acciones conjuntas o interés por las otras personas y sus acciones."],
          [6,"Acciones conjuntas simples, sin miradas significativas de referencia conjunta."],
          [4,"Empleo de miradas de referencia conjunta en situaciones dirigidas, pero no abiertas."],
          [2,"Pautas establecidas de atención y acción conjunta, pero no de preocupación conjunta."],
          [0,"No hay trastorno cualitativo de las capacidades de referencia conjunta."]
        ]
      },
      {
        id:"D3", label:"Dimensión 3: Capacidades Intersubjetivas y Mentalistas",
        opciones:[
          [8,"Ausencia de pautas de expresión emocional correlativa (intersubjetividad primaria). Falta de interés por las personas."],
          [6,"Respuestas intersubjetivas primarias, pero ningún indicio de que se vive al otro como sujeto."],
          [4,"Indicios de intersubjetividad secundaria, sin atribución explícita de estados mentales. No se resuelven tareas de Teoría de la Mente."],
          [2,"Conciencia explícita de que las otras personas tienen mente (resolución de Teoría de la Mente de 1.er orden). En situaciones reales, el mentalismo es lento, simple y limitado."],
          [0,"No hay trastorno cualitativo de capacidades intersubjetivas y mentalistas."]
        ]
      }
    ]
  },
  {
    esc:"eB", escName:"Comunicación y Lenguaje", color:"var(--escB)",
    dims:[
      {
        id:"D4", label:"Dimensión 4: Funciones Comunicativas",
        opciones:[
          [8,"Ausencia de comunicación (relación intencionada, intencional y significante) y de conductas instrumentales con personas."],
          [6,"Conductas instrumentales con personas para lograr cambios en el mundo físico (pedir), sin otras pautas de comunicación."],
          [4,"Conductas comunicativas para pedir (cambiar el mundo físico), pero no para compartir experiencias o cambiar el mundo mental."],
          [2,"Conductas comunicativas de declarar, comentar, etc., con escasas cualificaciones subjetivas de la experiencia y declaraciones sobre el mundo interno."],
          [0,"No hay trastorno cualitativo de las funciones comunicativas."]
        ]
      },
      {
        id:"D5", label:"Dimensión 5: Lenguaje Expresivo",
        opciones:[
          [8,"Mutismo total o funcional. Puede haber verbalizaciones que no son propiamente lingüísticas."],
          [6,"Lenguaje compuesto de palabras sueltas o ecolalias. No hay creación formal de sintagmas y oraciones."],
          [4,"Lenguaje oracional. Hay oraciones que no son ecolalálicas, pero no configuran discurso o conversación."],
          [2,"Discurso y conversación, con limitaciones de adaptación flexible y de selección de temas relevantes. Frecuentemente hay anomalías prosódicas."],
          [0,"No hay trastorno cualitativo del lenguaje expresivo."]
        ]
      },
      {
        id:"D6", label:"Dimensión 6: Lenguaje Receptivo",
        opciones:[
          [8,"'Sordera central'. Tendencia a ignorar el lenguaje. No hay respuesta a órdenes, llamadas o indicaciones."],
          [6,"Asociación de enunciados verbales con conductas propias, sin indicios de que los enunciados se asimilen a un código."],
          [4,"Comprensión literal y poco flexible de enunciados, con algún análisis estructural. No se comprende discurso."],
          [2,"Se comprende discurso y conversación, pero se diferencia con gran dificultad el significado literal del intencional."],
          [0,"No hay trastorno cualitativo de las capacidades de comprensión."]
        ]
      }
    ]
  },
  {
    esc:"eC", escName:"Anticipación / Flexibilidad", color:"var(--purple)",
    dims:[
      {
        id:"D7", label:"Dimensión 7: Anticipación",
        opciones:[
          [8,"Adherencia inflexible a estímulos que se repiten de forma idéntica (p. ej. películas de vídeo). Resistencia intensa a cambios. Falta de conductas anticipatorias."],
          [6,"Conductas anticipatorias simples en rutinas cotidianas. Con frecuencia, oposición a cambios y empeoramiento en situaciones que implican cambios."],
          [4,"Incorporadas estructuras temporales amplias (p. ej. Curso vs. Vacaciones). Puede haber reacciones catastróficas ante cambios no previstos."],
          [2,"Alguna capacidad de regular el propio ambiente y de manejar los cambios. Se prefiere un orden claro y un ambiente predecible."],
          [0,"No hay trastorno cualitativo de capacidades de anticipación."]
        ]
      },
      {
        id:"D8", label:"Dimensión 8: Flexibilidad",
        opciones:[
          [8,"Predominan las estereotipias motoras simples."],
          [6,"Predominan los rituales simples. Resistencia a cambios mínimos."],
          [4,"Rituales complejos. Apego excesivo a objetos. Preguntas obsesivas."],
          [2,"Contenidos obsesivos y limitados de pensamiento. Intereses poco funcionales y flexibles. Rígido perfeccionismo."],
          [0,"No hay trastorno cualitativo de la flexibilidad."]
        ]
      },
      {
        id:"D9", label:"Dimensión 9: Sentido de la Actividad",
        opciones:[
          [8,"Predominio masivo de conductas sin meta. Inaccesibilidad a consignas externas que dirijan la actividad."],
          [6,"Sólo se realizan actividades funcionales breves con consignas externas. Cuando no las hay, se pasa al nivel anterior."],
          [4,"Actividades autónomas de ciclo largo, que no se viven como partes de proyectos coherentes, y cuya motivación es externa."],
          [2,"Actividades complejas de ciclo muy largo, cuya meta se conoce y desea, pero sin una estructura jerárquica de previsiones biográficas en que se inserten."],
          [0,"No hay trastorno cualitativo del sentido de la actividad."]
        ]
      }
    ]
  },
  {
    esc:"eD", escName:"Simbolización", color:"var(--magenta)",
    dims:[
      {
        id:"D10", label:"Dimensión 10: Ficción e Imaginación",
        opciones:[
          [8,"Ausencia completa de juego funcional o simbólico y de otras competencias de ficción."],
          [6,"Juegos funcionales poco flexibles, poco espontáneos y de contenidos limitados."],
          [4,"Juego simbólico, en general poco espontáneo y obsesivo. Dificultades importantes para diferenciar ficción y realidad."],
          [2,"Capacidades complejas de ficción, que se emplean como recursos de aislamiento. Ficciones poco flexibles."],
          [0,"No hay trastorno de competencias de ficción e imaginación."]
        ]
      },
      {
        id:"D11", label:"Dimensión 11: Imitación",
        opciones:[
          [8,"Ausencia completa de conductas de imitación."],
          [6,"Imitaciones motoras simples, evocadas. No espontáneas."],
          [4,"Imitación espontánea esporádica, poco versátil e intersubjetiva."],
          [2,"Imitación establecida. Ausencia de modelos internos."],
          [0,"No hay trastorno de las capacidades de imitación."]
        ]
      },
      {
        id:"D12", label:"Dimensión 12: Suspensión (capacidad de crear significantes)",
        opciones:[
          [8,"No se suspenden pre-acciones para crear gestos comunicativos. Comunicación ausente o por gestos instrumentales con personas."],
          [6,"No se suspenden acciones instrumentales para crear símbolos enactivos. No hay juego funcional."],
          [4,"No se suspenden propiedades reales de cosas o situaciones para crear ficciones y juego de ficción."],
          [2,"No se dejan en suspenso representaciones para crear o comprender metáforas, o para comprender que los estados mentales no se corresponden necesariamente con las situaciones."],
          [0,"No hay trastorno cualitativo de las capacidades de suspensión."]
        ]
      }
    ]
  }
];

/* Informe Martín G. — [enero, junio equiv., noviembre] */
const COMP = [
  ["D1 — Relación social","A",6,4,2],["D2 — Referencia conjunta","A",4,4,2],
  ["D3 — Teoría de la Mente","A",6,4,4],["D4 — Func. comunicativas","B",4,2,2],
  ["D5 — Lenguaje expresivo","B",4,2,2],["D6 — Lenguaje receptivo","B",2,2,1],
  ["D7 — Anticipación","C",3,3,2],["D8 — Flexibilidad","C",3,3,3],
  ["D9 — Sentido de actividad","C",2,2,1],["D10 — Ficción","D",2,1,1],
  ["D11 — Imitación","D",1,1,0],["D12 — Suspensión","D",1,0,0]
];

