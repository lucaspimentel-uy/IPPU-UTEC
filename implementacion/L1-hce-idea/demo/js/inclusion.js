/* Vista Inclusión — tablero institucional del área.
   Demo L1 HCE+IDEA — IPPU × UTEC-LIDIA.
   F1-nav3 (2026-08-18): se porta la vista `#/inclusion` del Prototipo v4
   (`HCE_IPPU_Prototipo_v4.html:225 / vInclusion línea 2205`) usando la fuente,
   los colores y el formato de la demo. En el prototipo esta vista reemplaza la
   planilla general del área: cada fila se alimenta del módulo HCE-INC de la
   HCE individual (dato único, sin doble carga).

   Alcance de esta ronda: sólo se implementa el TABLERO. El módulo HCE-INC
   por NNA (ficha + bitácora, `mInc()` del prototipo) queda fuera y se
   engancha cuando M12 abra HCE-INC como módulo de la HCE. Como HCE-INC
   todavía no existe en el modelo de la demo, se adjuntan datos simulados
   por expediente (INC_SEED) para poder visualizar los siete estados.

   Los scripts se cargan en orden en index.html: este va DESPUÉS de
   grupos-usuario.js porque reutiliza nroHC(). */

/* ============ CATÁLOGOS (Prototipo v4 líneas 2103-2111) ============ */
const INC_ESTADOS = [
  {n:"Inclusión plena",                      cls:"inc-ok",     d:"Concurre con regularidad, en horario completo o acordado como suficiente."},
  {n:"Inclusión parcial (horario reducido)", cls:"inc-warn",   d:"Concurre de forma sostenida pero con carga horaria reducida."},
  {n:"En adaptación",                        cls:"inc-warn",   d:"Proceso de ingreso o adaptación progresiva en curso."},
  {n:"En espera de cupo / trámite",          cls:"inc-warn",   d:"Inscripción, pase o cupo pendiente de resolución."},
  {n:"Desvinculado/a",                       cls:"inc-danger", d:"Dejó de concurrir al centro en el que estaba incluido."},
  {n:"Sin escolarizar",                      cls:"inc-danger", d:"No asiste a ningún centro educativo ni socioeducativo."},
  {n:"Sin registrar",                        cls:"inc-off",    d:"El área de Inclusión aún no registró la situación."}
];

function incChip(estado){
  const e = INC_ESTADOS.find(x=>x.n===estado) || INC_ESTADOS[INC_ESTADOS.length-1];
  return `<span class="inc-chip ${e.cls}" title="${e.d}">${e.n}</span>`;
}

/* Días desde la última gestión registrada en la bitácora. null si no hay ninguna. */
function incDiasSin(inc){
  const b = (inc && inc.bitacora) || [];
  if(!b.length) return null;
  const last = b.map(e=>e.fecha).sort().slice(-1)[0];
  return Math.floor((Date.now() - new Date(last+"T12:00:00")) / 86400000);
}

/* ============ SEED DEMO HCE-INC ============
   Datos simulados por id de expediente. Cubre los 7 estados para mostrar el tablero
   completo. IDs 101..108 corresponden a los NNA del seed de datos.js.
   Cuando exista HCE-INC como módulo real, esto sale del backend. */
const INC_SEED = {
  101: {centro:"Escuela pública N.º 87", tipoCentro:"Escuela común (ANEP)", grado:"5.º año",
        modalidad:"Jornada parcial con acompañante", diasHoras:"3 días × 4 h",
        at:"Sí", refNombre:"Mtra. Alonso", refRol:"Maestra de clase",
        estado:"Inclusión parcial (horario reducido)", fEstado:"2026-05-20",
        obs:"Se trabaja hacia la ampliación progresiva del horario en el segundo semestre.",
        bitacora:[
          {fecha:"2026-03-05", interlocutor:"Madre",        rol:"Familia",                 medio:"WhatsApp",           tema:"Educativa / pedagógica",           contenido:"Retomó la escuela sin dificultades; se sostiene el acompañante 3 veces por semana."},
          {fecha:"2026-04-09", interlocutor:"Directora",    rol:"Centro educativo",        medio:"Reunión presencial", tema:"Coordinación interinstitucional", contenido:"Reunión de coordinación; el centro solicita material sobre apoyos visuales."},
          {fecha:"2026-05-20", interlocutor:"Acompañante",  rol:"Acompañante terapéutico", medio:"Llamada",            tema:"Educativa / pedagógica",           contenido:"Adaptación favorable con apoyos visuales. Persisten dificultades en recreos."}
        ]},
  102: {centro:"Liceo público N.º 12", tipoCentro:"Liceo público", grado:"1.er año",
        modalidad:"Horario completo, sin apoyos formales", diasHoras:"5 días",
        at:"No", refNombre:"Adscripta Silva", refRol:"Adscripción",
        estado:"Inclusión plena", fEstado:"2026-04-15",
        bitacora:[
          {fecha:"2026-04-15", interlocutor:"Adscripta", rol:"Centro educativo", medio:"Correo", tema:"Educativa / pedagógica", contenido:"Buen desempeño académico general. Dificultades pragmáticas en trabajos grupales."}
        ]},
  103: {centro:"Escuela especial N.º 200", tipoCentro:"Escuela especial (ANEP)", grado:"Grupo B",
        modalidad:"Jornada completa", diasHoras:"5 días × 6 h",
        at:"No", refNombre:"Mtra. Correa", refRol:"Maestra especializada",
        estado:"Inclusión plena", fEstado:"2026-03-11",
        bitacora:[
          {fecha:"2026-02-28", interlocutor:"Directora", rol:"Centro educativo", medio:"Reunión presencial", tema:"Coordinación interinstitucional", contenido:"Reunión de inicio de año; buena continuidad con el grupo."},
          {fecha:"2026-03-11", interlocutor:"Madre",     rol:"Familia",          medio:"WhatsApp",           tema:"Familiar / social",              contenido:"Adaptación al nuevo horario sin dificultades."}
        ]},
  104: {centro:"Escuela común N.º 45", tipoCentro:"Escuela común (ANEP)", grado:"1.er año",
        modalidad:"Ingreso progresivo con acompañante", diasHoras:"2 días × 3 h",
        at:"Sí", refNombre:"Mtra. Pérez", refRol:"Maestra de clase",
        estado:"En adaptación", fEstado:"2026-07-01",
        bitacora:[
          {fecha:"2026-06-25", interlocutor:"Directora",   rol:"Centro educativo",        medio:"Reunión presencial", tema:"Coordinación interinstitucional", contenido:"Se acuerda ingreso progresivo; primera semana 2 días de 3 horas."},
          {fecha:"2026-07-01", interlocutor:"Acompañante", rol:"Acompañante terapéutico", medio:"Llamada",            tema:"Educativa / pedagógica",           contenido:"Primer día favorable, tolera la jornada corta."}
        ]},
  105: {centro:"", tipoCentro:"", grado:"", modalidad:"", diasHoras:"",
        at:"No", refNombre:"", refRol:"",
        estado:"En espera de cupo / trámite", fEstado:"2026-06-30",
        obs:"Inscripción pendiente en escuela especial; se espera confirmación de cupo.",
        bitacora:[
          {fecha:"2026-06-30", interlocutor:"Familia", rol:"Familia", medio:"Reunión presencial", tema:"Trámite o gestión", contenido:"Se presenta la inscripción en Inspección Departamental; queda a la espera del cupo."}
        ]},
  106: {centro:"Escuela común N.º 33", tipoCentro:"Escuela común (ANEP)", grado:"3.er año",
        modalidad:"Interrumpió en marzo", diasHoras:"—",
        at:"No", refNombre:"—", refRol:"—",
        estado:"Desvinculado/a", fEstado:"2026-04-02",
        obs:"La familia informó desvinculación por dificultades sostenidas; se articula alternativa.",
        bitacora:[
          {fecha:"2026-04-02", interlocutor:"Madre", rol:"Familia", medio:"Llamada", tema:"Familiar / social", contenido:"Comunica desvinculación; se ofrece derivación a taller de continuidad educativa."}
        ]},
  107: {estado:"Sin escolarizar", fEstado:"2026-05-15",
        bitacora:[
          {fecha:"2026-05-15", interlocutor:"Familia", rol:"Familia", medio:"Visita al centro", tema:"Familiar / social", contenido:"No asiste a centro educativo; se explora opción de maestra comunitaria."}
        ]},
  108: {} /* Sin registrar — el área todavía no cargó la situación. */
};

/* Adjunta INC_SEED a cada NNA de la demo. Idempotente y no destructivo:
   si un NNA no está en el seed, queda con estado "Sin registrar". */
NNA.forEach(n => {
  const src = INC_SEED[n.id] || {};
  n.inc = Object.assign({estado:"Sin registrar", bitacora:[]}, src);
  if(!n.inc.bitacora) n.inc.bitacora = [];
  if(!n.inc.estado)   n.inc.estado   = "Sin registrar";
});

/* ============ TABLERO INSTITUCIONAL (vInclusion del Prototipo v4) ============ */
function renderInclusion(){
  const cont = document.getElementById("inclusionContent");
  if(!cont) return;
  const activos = NNA.filter(n => n.activo !== false);
  const conteo = {};
  INC_ESTADOS.forEach(e => conteo[e.n] = 0);
  activos.forEach(n => {
    const est = (n.inc && n.inc.estado) || "Sin registrar";
    conteo[est] = (conteo[est]||0) + 1;
  });

  const kpis = INC_ESTADOS.map(e => `
    <div class="kpi kpi-inc">
      <div class="val">${conteo[e.n]||0}</div>
      ${incChip(e.n)}
    </div>`).join("");

  const filas = activos.map(n => {
    const I = n.inc || {};
    const d = incDiasSin(I);
    const ult = d === null
      ? `<span class="hint">Sin registros</span>`
      : (fmtFecha(I.bitacora.map(e=>e.fecha).sort().slice(-1)[0]) +
         (d > 60
          ? ` <span class="pill due" style="margin-left:6px">${d} días</span>`
          : ` <span class="hint">(${d} días)</span>`));
    return `<tr>
      <td>
        <button class="btn btn-link" onclick="abrirExpediente(${n.id})"><b>${n.nombre} ${n.apellido}</b></button>
        <div class="hint">${nroHC(n)}</div>
      </td>
      <td>${n.grupo || "—"}</td>
      <td>${I.centro || "—"}${I.grado ? `<div class="hint">${I.grado}</div>` : ""}</td>
      <td>${I.tipoCentro || "—"}</td>
      <td>${I.diasHoras || "—"}</td>
      <td>${I.at || "—"}</td>
      <td>${incChip(I.estado || "Sin registrar")}${I.fEstado ? `<div class="hint">${fmtFecha(I.fEstado)}</div>` : ""}</td>
      <td>${ult}</td>
      <td style="text-align:right;font-variant-numeric:tabular-nums">${(I.bitacora||[]).length}</td>
    </tr>`;
  }).join("");

  cont.innerHTML = `
    <div class="kpirow inc-kpirow">${kpis}</div>
    <div class="card">
      <div class="cardhead"><h2>Situación de inclusión — todos los NNA activos</h2></div>
      <div class="cardbody" style="overflow-x:auto">
        <table class="lista inc-table">
          <thead><tr>
            <th>NNA</th><th>Grupo</th><th>Centro</th><th>Tipo</th>
            <th>Días / horas</th><th>AT</th><th>Estado</th>
            <th>Última gestión</th><th style="text-align:right">Registros</th>
          </tr></thead>
          <tbody>${filas}</tbody>
        </table>
      </div>
    </div>
    <div class="notice info" style="margin-top:14px"><b>Indicadores que este tablero habilita:</b> tasa de escolarización efectiva, distribución por tipo de centro, carga horaria promedio, casos en espera y tiempo hasta el ingreso, casos con alerta de seguimiento (&gt;60 días sin gestiones) y cantidad de articulaciones por caso — insumos directos para la rendición ante INAU y los reportes institucionales.</div>
    <div class="notice warn" style="margin-top:10px"><b>Acceso:</b> este tablero corresponde a los perfiles de área de Inclusión, coordinación y dirección técnica. Muestra la ficha y el estado; el contenido de las entradas sensibles solo es visible desde la HCE individual según la matriz de roles.</div>`;
}

/* Wiring + render inicial. */
document.querySelectorAll('.navitem[data-view="inclusion"]').forEach(b => b.addEventListener("click", renderInclusion));
renderInclusion();
