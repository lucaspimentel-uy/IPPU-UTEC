/* Modelo HCE: expedientes seed (NNA) y normalizacion.
   Demo L1 HCE+IDEA - IPPU x UTEC-LIDIA.
   Extraido del monolito (lineas 1093-1250) sin cambios de logica.
   Los scripts se cargan en orden en index.html: el orden ES la semantica. */
/* ================= MODELO HCE — Expedientes con historial clínico =================
   Cada NNA es un expediente con: datos personales, datos clínicos, plan IPPU
   y un historial cronológico de eventos (alta, evaluaciones IDEA, intermedias, notas).
   Esto unifica HCE (el expediente) + IDEA (las evaluaciones dentro del expediente).   */
let nnaSeq = 100; // generador de IDs de expediente

const NNA = [
  {
    id: ++nnaSeq, nombre:"Sofía", apellido:"R.", nac:"2015-03-12", edad:11, sexo:"Femenino",
    ci:"5.789.123-4", loc:"Montevideo", referente:"Marta R. (madre)", tel:"099 456 789",
    grupo:"Celeste", tecnico:"Lic. Torres — Psicopedagogía",
    dx:"TEA — Trastorno del Espectro Autista", dxFecha:"2019-08-20",
    deriv:"Neuropediatría — Hospital Pereira Rossell", apoyo:"Grado 2 — Requiere apoyo sustancial",
    antec:"Embarazo y parto sin complicaciones. Retraso en aparición del lenguaje. Sin antecedentes familiares de TEA.",
    med:"Ninguna", alerta:"Hipersensibilidad auditiva a ruidos fuertes",
    talleres:["Taller de habilidades sociales","Taller de cuentos y estimulación del lenguaje","Taller de música y expresión"],
    activo:true,
    anamnesis:{
      motivo:"Derivada por dificultades en la interacción social y del lenguaje; ingresa para abordaje interdisciplinario.",
      perinatal:"Embarazo controlado y parto a término sin complicaciones.",
      desarrollo:"Marcha a los 14 meses. Retraso en la aparición del lenguaje (primeras palabras ~30 meses). Control de esfínteres adecuado.",
      familiares:"Sin antecedentes familiares de TEA. Un tío materno con trastorno del lenguaje."
    },
    historial:[
      {tipo:"alta", fecha:"2024-02-10", titulo:"Alta en HCE", desc:"Ingreso al programa. Expediente creado por Lic. Torres."},
      {tipo:"idea", fecha:"2026-01-15", titulo:"Evaluación IDEA — inicial", desc:"Período Enero 2026 · Evaluador: Lic. Torres", score:42, total:96},
      {tipo:"note", fecha:"2026-03-02", titulo:"Nota clínica", desc:"Buena adaptación al taller de música. Inicia contacto visual sostenido con la terapeuta."}
    ]
  },
  {
    id: ++nnaSeq, nombre:"Martín", apellido:"G.", nac:"2017-06-05", edad:9, sexo:"Masculino",
    ci:"6.012.345-1", loc:"Canelones", referente:"Pablo G. (padre)", tel:"098 222 111",
    grupo:"Azul", tecnico:"Dr. González — Psicología",
    dx:"TEA — Trastorno del Espectro Autista", dxFecha:"2021-05-14",
    deriv:"Centro de Diagnóstico Temprano — INAU", apoyo:"Grado 2 — Requiere apoyo sustancial",
    antec:"Detección a los 3 años por la educadora del CAIF. Buena respuesta a intervención temprana.",
    med:"Ninguna", alerta:"—",
    talleres:["Taller de habilidades sociales","Taller de cuentos y estimulación del lenguaje","Actividades lúdicas y de juego","Educación Física"],
    activo:true,
    anamnesis:{
      motivo:"Detección temprana en el CAIF; ingresa para continuar intervención en habilidades sociales y lenguaje.",
      perinatal:"Embarazo sin controles regulares en el primer trimestre. Parto a término.",
      desarrollo:"Hitos motores en tiempo. Lenguaje con retraso leve, buena evolución tras intervención temprana.",
      familiares:"Sin antecedentes familiares relevantes conocidos."
    },
    historial:[
      {tipo:"alta", fecha:"2023-03-01", titulo:"Alta en HCE", desc:"Ingreso al programa. Expediente creado por Dr. González."},
      {tipo:"idea", fecha:"2026-01-15", titulo:"Evaluación IDEA — inicial", desc:"Período Enero 2026 · Evaluador: Dr. González", score:38, total:96},
      {tipo:"lik", fecha:"2026-06-10", titulo:"Evaluación intermedia (Likert)", desc:"Equivalente IDEA estimado", score:28, total:96},
      {tipo:"idea", fecha:"2026-11-28", titulo:"Evaluación IDEA — final", desc:"Período Noviembre 2026 · Evaluador: Lic. Torres", score:20, total:96},
      {tipo:"note", fecha:"2026-09-15", titulo:"Nota clínica", desc:"Avance notable en relación con pares. Inicia juego compartido espontáneo."}
    ]
  },
  {
    id: ++nnaSeq, nombre:"Valentina", apellido:"P.", nac:"2013-11-22", edad:13, sexo:"Femenino",
    ci:"5.345.678-9", loc:"Montevideo", referente:"Laura P. (madre)", tel:"091 777 333",
    grupo:"Naranja", tecnico:"Lic. Pereira — Fonoaudiología",
    dx:"TEA con discapacidad intelectual asociada", dxFecha:"2017-02-10",
    deriv:"Neuropediatría — Casa de Galicia", apoyo:"Grado 3 — Requiere apoyo muy sustancial",
    antec:"Diagnóstico a los 4 años. Uso de comunicación aumentativa (pictogramas).",
    med:"Risperidona 0,5 mg", alerta:"Crisis ante cambios bruscos de rutina",
    talleres:["Taller de cuentos y estimulación del lenguaje","Taller de higiene y AVD","Actividades sensoriales"],
    historial:[
      {tipo:"alta", fecha:"2022-04-12", titulo:"Alta en HCE", desc:"Ingreso al programa. Expediente creado por Lic. Pereira."},
      {tipo:"idea", fecha:"2026-01-15", titulo:"Evaluación IDEA — inicial", desc:"Período Enero 2026 · Evaluador: Lic. Pereira", score:55, total:96},
      {tipo:"lik", fecha:"2026-06-10", titulo:"Evaluación intermedia (Likert)", desc:"Equivalente IDEA estimado", score:49, total:96}
    ]
  },
  {
    id: ++nnaSeq, nombre:"Joaquín", apellido:"M.", nac:"2018-01-30", edad:8, sexo:"Masculino",
    ci:"6.234.567-8", loc:"Montevideo", referente:"Sofía M. (madre)", tel:"099 888 444",
    grupo:"Azul", tecnico:"Dr. González — Psicología",
    dx:"TEA — en proceso diagnóstico", dxFecha:"2025-11-03",
    deriv:"Pediatría — policlínica barrial", apoyo:"Grado 1 — Requiere apoyo",
    antec:"En proceso de confirmación diagnóstica. Buen nivel de lenguaje, dificultades en flexibilidad.",
    med:"Ninguna", alerta:"—",
    talleres:["Taller de habilidades sociales","Actividades lúdicas y de juego"],
    historial:[
      {tipo:"alta", fecha:"2025-12-01", titulo:"Alta en HCE", desc:"Ingreso reciente. Expediente creado por Dr. González."},
      {tipo:"idea", fecha:"2026-01-15", titulo:"Evaluación IDEA — inicial", desc:"Período Enero 2026 · Evaluador: Dr. González", score:31, total:96}
    ]
  },
  {
    id: ++nnaSeq, nombre:"Lucía", apellido:"F.", nac:"2014-09-08", edad:12, sexo:"Femenino",
    ci:"5.456.789-0", loc:"San José", referente:"Diego F. (padre)", tel:"092 555 666",
    grupo:"Celeste", tecnico:"Lic. Torres — Psicopedagogía",
    dx:"TEA — Trastorno del Espectro Autista", dxFecha:"2018-07-19",
    deriv:"Neuropediatría — Hospital de San José", apoyo:"Grado 2 — Requiere apoyo sustancial",
    antec:"Diagnóstico a los 4 años. Escolarizada con maestra de apoyo.",
    med:"Ninguna", alerta:"Selectividad alimentaria importante",
    talleres:["Taller de habilidades sociales","Taller de expresión plástica","Taller de higiene y AVD"],
    historial:[
      {tipo:"alta", fecha:"2023-02-20", titulo:"Alta en HCE", desc:"Ingreso al programa. Expediente creado por Lic. Torres."},
      {tipo:"idea", fecha:"2026-01-15", titulo:"Evaluación IDEA — inicial", desc:"Período Enero 2026 · Evaluador: Lic. Torres", score:47, total:96},
      {tipo:"lik", fecha:"2026-06-10", titulo:"Evaluación intermedia (Likert)", desc:"Equivalente IDEA estimado", score:40, total:96}
    ]
  },
  {
    id: ++nnaSeq, nombre:"Tomás", apellido:"D.", nac:"2016-04-17", edad:10, sexo:"Masculino",
    ci:"5.901.234-5", loc:"Montevideo", referente:"Carla D. (madre)", tel:"094 333 222",
    grupo:"Naranja", tecnico:"Dra. Silva — Neuropediatría",
    dx:"TEA con discapacidad intelectual asociada", dxFecha:"2020-10-05",
    deriv:"Neuropediatría — Hospital Pereira Rossell", apoyo:"Grado 3 — Requiere apoyo muy sustancial",
    antec:"Diagnóstico a los 4 años. Sin evaluación IDEA registrada aún en el ciclo 2026.",
    med:"Ninguna", alerta:"—",
    talleres:["Actividades sensoriales","Taller de higiene y AVD"],
    activo:false, bajaFecha:"2026-05-20",
    historial:[
      {tipo:"alta", fecha:"2024-08-30", titulo:"Alta en HCE", desc:"Ingreso al programa. Expediente creado por Dra. Silva."},
      {tipo:"note", fecha:"2026-05-20", titulo:"Baja del programa", desc:"Egreso por traslado de domicilio. Expediente inactivo."}
    ]
  },
  {
    id: ++nnaSeq, nombre:"Bruno", apellido:"D.", nac:"2019-02-14", edad:7, sexo:"Masculino",
    ci:"6.345.678-2", loc:"Montevideo", referente:"Carmen D. (madre)", tel:"099 111 222",
    grupo:"Azul", tecnico:"Dr. González — Psicología",
    dx:"TEA — en proceso diagnóstico", dxFecha:"2026-03-10",
    deriv:"Pediatría — policlínica barrial", apoyo:"Grado 1 — Requiere apoyo",
    antec:"Ingreso reciente. Aún sin evaluación IDEA en el ciclo.",
    med:"Ninguna", alerta:"—",
    talleres:["Taller de habilidades sociales","Actividades lúdicas y de juego"],
    activo:true,
    anamnesis:{
      motivo:"Ingreso reciente derivado de pediatría para valoración interdisciplinaria.",
      perinatal:"Sin datos relevantes.",
      desarrollo:"Marcha en tiempo. Lenguaje en evaluación.",
      familiares:"Sin antecedentes conocidos."
    },
    historial:[
      {tipo:"alta", fecha:"2026-06-05", titulo:"Alta en HCE", desc:"Ingreso reciente. Pendiente de primera evaluación IDEA anual."}
    ]
  },
  {
    id: ++nnaSeq, nombre:"Camila", apellido:"S.", nac:"2015-08-22", edad:10, sexo:"Femenino",
    ci:"5.678.901-3", loc:"Canelones", referente:"Rosa S. (madre)", tel:"098 444 555",
    grupo:"Celeste", tecnico:"Lic. Torres — Psicopedagogía",
    dx:"TEA — Trastorno del Espectro Autista", dxFecha:"2020-04-18",
    deriv:"Neuropediatría — Hospital Pereira Rossell", apoyo:"Grado 2 — Requiere apoyo sustancial",
    antec:"Última evaluación IDEA en 2025; pendiente la del ciclo actual.",
    med:"Ninguna", alerta:"—",
    talleres:["Taller de habilidades sociales","Taller de expresión plástica"],
    activo:true,
    anamnesis:{
      motivo:"Seguimiento anual en el programa.",
      perinatal:"Embarazo y parto sin complicaciones.",
      desarrollo:"Retraso leve del lenguaje, buena evolución.",
      familiares:"Sin antecedentes."
    },
    historial:[
      {tipo:"alta", fecha:"2022-03-15", titulo:"Alta en HCE", desc:"Ingreso al programa. Expediente creado por Lic. Torres."},
      {tipo:"idea", fecha:"2025-10-20", titulo:"Evaluación IDEA anual", desc:"Período 2025 · Evaluador: Lic. Torres", score:44, total:96}
    ]
  }
];

/* Estado de actividad: por defecto activo si el expediente no lo especifica */
NNA.forEach(n=>{ if(n.activo===undefined) n.activo = true; });

