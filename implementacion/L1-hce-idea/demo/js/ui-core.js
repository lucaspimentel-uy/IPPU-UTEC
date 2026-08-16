/* Navegacion, tabla NNA, formulario IDEA, Likert, graficos de analitica, toast, sesion.
   Demo L1 HCE+IDEA - IPPU x UTEC-LIDIA.
   Extraido del monolito (lineas 2061-2427) sin cambios de logica.
   Los scripts se cargan en orden en index.html: el orden ES la semantica. */
/* ================= NAVEGACIÓN ================= */
function go(view){
  const target = document.getElementById("view-"+view);
  if(!target) return;
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  target.classList.add("active");
  document.querySelectorAll(".navitem").forEach(b=>b.classList.toggle("active", b.dataset.view===view));
  window.scrollTo({top:0});
}
document.querySelectorAll(".navitem").forEach(b=>b.addEventListener("click",()=>go(b.dataset.view)));

/* ================= INICIO: TABLA NNA (re-renderizable) ================= */
const tb = document.getElementById("tbodyNNA");
const selNNA = document.getElementById("selNNA");

function pillEval(ev){
  if(!ev) return `<span class="pill due">sin evaluar</span>`;
  return `<span class="pill done">${ev.score} pts</span>`;
}
function pillLik(ev, tieneInicial){
  if(ev) return `<span class="pill done">${ev.score} pts</span>`;
  return tieneInicial ? `<span class="pill pend">pendiente</span>` : `<span class="pill due">—</span>`;
}
function proxEval(nna){
  const final = getEval(nna,"final");
  if(final) return "Ciclo completo ✓";
  const lik = getEval(nna,"lik");
  if(lik) return "Completa · 11/2026";
  const ini = getEval(nna,"inicial");
  if(ini) return "Intermedia · 06/2026";
  return "Completa · pendiente";
}

/* --- Búsqueda + filtro de estado (activo / inactivo) --- */
let nnaEstadoFiltro = "activos"; // activos | inactivos | todos
// minúsculas + sin acentos (para búsqueda tolerante: "sofia" encuentra "Sofía")
const deburr = s => (s||"").toString().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu,"");
const norm = s => deburr(s).replace(/[.\-\s]/g,"");

function coincideBusqueda(p, q){
  if(!q) return true;
  const ql = deburr(q).trim();
  const qn = norm(q);
  return deburr(`${p.nombre} ${p.apellido}`).includes(ql)                // nombre y apellido
      || deburr(`${p.apellido} ${p.nombre}`).includes(ql)
      || (qn.length>0 && norm(p.ci).includes(qn))                        // cédula (tolerante a puntos/guiones)
      || (qn.length>0 && String(p.id).includes(qn))                      // N.º de HCE / expediente
      || deburr(`exp #${p.id}`).includes(ql) || deburr(`hce ${p.id}`).includes(ql)
      || deburr(`grupo ${p.grupo}`) === ql || deburr(p.grupo) === ql;    // grupo — 3.ª vía (M10): "grupo a" o "a" exacto
}

function filaNNA(p){
  const estadoPill = p.activo
    ? `<span class="pill activo">Activo</span>`
    : `<span class="pill inactivo">Inactivo</span>`;
  return `<tr class="${p.activo?"":"row-inactiva"}">
    <td><b>#${p.id}</b></td>
    <td>${p.ci}</td>
    <td class="nna-name">${p.nombre}</td>
    <td class="nna-name">${p.apellido}</td>
    <td>${estadoPill}</td>
    <td><button class="btn btn-link" onclick="abrirExpediente(${p.id})">Abrir expediente →</button></td>
  </tr>`;
}

function applyNNAFilter(){
  const q = (document.getElementById("searchNNA")?.value) || "";
  const lista = NNA.filter(p=>{
    const estadoOk = nnaEstadoFiltro==="todos" ? true
                   : nnaEstadoFiltro==="activos" ? p.activo : !p.activo;
    return estadoOk && coincideBusqueda(p, q);
  });
  tb.innerHTML = lista.length
    ? lista.map(filaNNA).join("")
    : `<tr><td colspan="6"><div class="empty-state"><div class="big">⌕</div>No se encontraron NNA con ese criterio.</div></td></tr>`;
}

function setEstadoFiltro(estado){
  nnaEstadoFiltro = estado;
  document.querySelectorAll(".chip-estado").forEach(c=>c.classList.toggle("active", c.dataset.estado===estado));
  applyNNAFilter();
}

function toggleActivo(id){
  const p = NNA.find(n=>n.id===id); if(!p) return;
  p.activo = !p.activo;
  const hoy = new Date().toISOString().slice(0,10);
  if(!p.activo){
    p.bajaFecha = hoy;
    p.historial.push({tipo:"note", fecha:hoy, titulo:"Baja del programa", desc:"NNA marcado como inactivo (demo)."});
  } else {
    delete p.bajaFecha;
    p.historial.push({tipo:"note", fecha:hoy, titulo:"Reactivación", desc:"NNA reactivado en el programa (demo)."});
  }
  renderNNA();
  abrirExpediente(id);
  toast(p.activo ? `${p.nombre} reactivado` : `${p.nombre} dado de baja`);
}

function renderNNA(){
  // Dropdown de NNA (todos) para las evaluaciones IDEA e IPPU-TEA (PA/PB)
  const optsNNA = NNA.map(p=>
    `<option value="${p.id}">#${p.id} · ${p.nombre} ${p.apellido} · Grupo ${p.grupo}</option>`).join("");
  selNNA.innerHTML = optsNNA;
  const selProt = document.getElementById("selNNAProt");
  if(selProt){ const prev = selProt.value; selProt.innerHTML = optsNNA; if(prev) selProt.value = prev; }
  const selIC = document.getElementById("selNNAIC");
  if(selIC){ const prev = selIC.value; selIC.innerHTML = optsNNA; if(prev) selIC.value = prev; }
  // KPIs dinámicos (frecuencia IDEA anual)
  const activos    = NNA.filter(p=>p.activo).length;
  const conIdea    = NNA.filter(p=>p.activo && tieneLBFirmada(p)).length;
  const pend       = NNA.filter(pendienteIdea).length;
  const totalEvals = NNA.reduce((a,p)=>a+p.historial.filter(h=>h.tipo==="idea"||h.tipo==="lik").length,0);
  setKpi("kpiTotal", activos);
  setKpi("kpiAlDia", conIdea);
  setKpi("kpiPend", pend);
  setKpi("kpiInf", totalEvals);
  applyNNAFilter();
  renderPendientes();
  renderAnalitica();   // la analítica institucional se deriva del mismo modelo: se recalcula con cada cambio
}
function setKpi(id,val){ const el=document.getElementById(id); if(el) el.textContent=val; }

/* --- Vista Pendientes (NNA activos sin IDEA del año en curso) --- */
function renderPendientes(){
  const kpi = document.getElementById("pendKpi");
  const tb2 = document.getElementById("tbodyPend");
  if(!tb2) return;
  const pend = NNA.filter(pendienteIdea);
  const activos = NNA.filter(p=>p.activo).length;
  if(kpi){
    const cobertura = activos ? Math.round((activos-pend.length)/activos*100) : 0;
    kpi.innerHTML = `
      <div class="kpi"><div class="lab">Sin línea base IDEA</div><div class="val orange">${pend.length}</div><div class="sub">NNA activos sin HCE-LB firmada</div></div>
      <div class="kpi"><div class="lab">Cobertura línea base</div><div class="val ok">${cobertura} %</div><div class="sub">${activos-pend.length} de ${activos} activos</div></div>
      <div class="kpi"><div class="lab">Sin iniciar</div><div class="val purple">${pend.filter(p=>!(p.flujo&&p.flujo.lb.dim.some(v=>v!=null))).length}</div><div class="sub">Sin ninguna dimensión cargada</div></div>`;
  }
  tb2.innerHTML = pend.length ? pend.map(p=>{
    const est = estadoModulo(p,"lb");
    const estadoTxt = est==="borrador" ? `<span style="color:var(--warn);font-weight:600">borrador</span>`
      : est==="bloqueado" ? `<span style="color:var(--ink-2)">requiere CI</span>` : `<span style="color:var(--ink-2)">sin iniciar</span>`;
    return `<tr>
      <td><b>#${p.id}</b></td><td>${p.ci}</td>
      <td class="nna-name">${p.nombre}</td><td class="nna-name">${p.apellido}</td>
      <td>Grupo ${p.grupo}</td><td>${estadoTxt}</td>
      <td><button class="btn btn-link" onclick="irAEval('idea', ${p.id})">Cargar IDEA →</button></td>
    </tr>`;
  }).join("") : `<tr><td colspan="7"><div class="empty-state"><div class="big">✓</div>Todas las líneas base IDEA están firmadas.</div></td></tr>`;
}

/* --- Navegación a una evaluación preseleccionando el NNA --- */
function irAEval(view, id){
  if(view==="idea"){
    go("idea");
    cargarIDEA(id);
  } else if(view==="pa" || view==="pb"){
    go("prot");
    cargarProt(id, view);
  } else if(view==="ic"){
    go("ic");
    cargarIC(id);
  } else if(view==="intermedia"){
    go("intermedia");
  } else if(view==="anamnesis"){
    openEditar(id, 1);
  }
}

renderNNA();

/* ================= FORMULARIO IDEA ================= */
const form = document.getElementById("ideaForm");
const ideaScores = {};

// Indicador de progreso de las 12 dimensiones
const progRow = document.createElement("div");
progRow.className = "prog-dims";
progRow.innerHTML = Array.from({length:12},(_,i)=>
  `<div class="prog-dim" id="prog-d${i+1}" title="D${i+1}">${i+1}</div>`).join("");
form.appendChild(progRow);

const badgeClass = v => v===0?"badge-0":v<=2?"badge-2":v<=4?"badge-4":v<=6?"badge-6":"badge-8";

DIMENSIONES.forEach((escala, ei)=>{
  let html = `<div class="escala ${escala.esc}">
    <header><span>${escala.escName}</span><span class="dims">D${ei*3+1} · D${ei*3+2} · D${ei*3+3} — Máx. 24 pts</span></header>`;

  escala.dims.forEach((dim, di)=>{
    const dimKey = `${ei}-${di}`;
    const dimNum = ei*3 + di + 1;

    let opcionesHtml = dim.opciones.map(([pts, desc])=>`
      <button class="opcion" data-dim="${dimKey}" data-v="${pts}" type="button">
        <span class="score-badge ${badgeClass(pts)}">${pts}</span>
        <span class="desc">${desc}</span>
      </button>`).join("");

    html += `<div class="dimension" id="dim-${dimKey}">
      <div class="dname">${dim.label}</div>
      <div class="dinstr">Seleccioná la descripción que mejor caracterice al NNA — asignar siempre la puntuación más baja posible.</div>
      <div class="opciones">${opcionesHtml}</div>
      <div class="inter-row">
        <span class="inter-label">¿El caso se sitúa claramente entre dos niveles?</span>
        ${[1,3,5,7].map(v=>`<button class="inter-btn" data-dim="${dimKey}" data-inter="${v}" type="button">
          Puntaje ${v}</button>`).join("")}
        <button class="inter-btn" data-dim="${dimKey}" data-ns="1" type="button" style="border-color:var(--warn);color:var(--warn)">NS</button>
        <span style="font-size:.68rem;color:var(--ink-2)">Intermedias (Rivière) · NS = observación insuficiente (impide firmar)</span>
      </div>
      <div id="sel-${dimKey}" style="display:none;margin-top:6px;padding:6px 10px;border-radius:6px;background:#EEF3FA;font-size:.76rem;color:var(--ink-2)">
        Puntaje seleccionado: <b id="sval-${dimKey}">—</b>
      </div>
    </div>`;
  });

  html += `<div class="esc-foot">
    <span class="subtxt">Puntaje 0 = sin trastorno · 8 = afectación severa</span>
    <span>Subtotal escala: <b id="sub${ei}">0 / 24</b></span>
  </div></div>`;

  form.insertAdjacentHTML("beforeend", html);
});

function updateScore(dimKey, val){
  ideaScores[dimKey] = val;
  // mostrar selección
  document.getElementById(`sel-${dimKey}`).style.display = "block";
  document.getElementById(`sval-${dimKey}`).textContent = val;
  // marcar progreso
  const dimNum = parseInt(dimKey.split("-")[0])*3 + parseInt(dimKey.split("-")[1]) + 1;
  const pd = document.getElementById(`prog-d${dimNum}`);
  if(pd){ pd.classList.add("filled"); }
  // recalcular subtotales y total (NS no suma y bloquea la firma)
  let total = 0, hayNS = false;
  DIMENSIONES.forEach((e,ei)=>{
    let sub = 0;
    e.dims.forEach((_,di)=>{ const v = ideaScores[`${ei}-${di}`]; if(v==="NS") hayNS=true; else if(typeof v==="number") sub += v; });
    document.getElementById("sub"+ei).textContent = `${sub} / 24`;
    total += sub;
  });
  document.getElementById("ideaTotal").textContent = total;
  const nivel = document.getElementById("ideaNivel");
  const answered = Object.keys(ideaScores).length;
  const pct = Math.round(total/96*100);
  if(answered < 12){
    nivel.textContent = `${answered} / 12 dimensiones puntuadas`;
    nivel.style.background="#2C4A66";
  } else if(hayNS){
    nivel.textContent = `Incluye NS — no se puede firmar (falta observación)`;
    nivel.style.background="var(--warn)";
  } else if(total >= 65){
    nivel.textContent=`Espectro severo — ${total} pts (${pct}%)`;
    nivel.style.background="var(--bad)";
  } else if(total >= 33){
    nivel.textContent=`Espectro moderado — ${total} pts (${pct}%)`;
    nivel.style.background="var(--warn)";
  } else {
    nivel.textContent=`Espectro leve — ${total} pts (${pct}%)`;
    nivel.style.background="var(--ok)";
  }
}

form.addEventListener("click", ev=>{
  // Opciones principales (0,2,4,6,8)
  const opcion = ev.target.closest(".opcion[data-dim]");
  if(opcion){
    const dim = opcion.dataset.dim;
    document.querySelectorAll(`.opcion[data-dim="${dim}"]`).forEach(b=>b.classList.remove("sel"));
    document.querySelectorAll(`.inter-btn[data-dim="${dim}"]`).forEach(b=>b.classList.remove("sel"));
    opcion.classList.add("sel");
    updateScore(dim, +opcion.dataset.v);
    return;
  }
  // NS (observación insuficiente) o puntuaciones intermedias (1,3,5,7)
  const interBtn = ev.target.closest(".inter-btn[data-dim]");
  if(interBtn){
    const dim = interBtn.dataset.dim;
    document.querySelectorAll(`.opcion[data-dim="${dim}"]`).forEach(b=>b.classList.remove("sel"));
    document.querySelectorAll(`.inter-btn[data-dim="${dim}"]`).forEach(b=>b.classList.remove("sel"));
    interBtn.classList.add("sel");
    updateScore(dim, interBtn.dataset.ns ? "NS" : +interBtn.dataset.inter);
  }
});

/* ================= EVAL INTERMEDIA: LIKERT ================= */
const likSel = {};
document.querySelectorAll(".lik-opts").forEach(g=>{
  g.addEventListener("click", ev=>{
    const b = ev.target.closest("button"); if(!b) return;
    g.querySelectorAll("button").forEach(x=>x.classList.remove("sel"));
    b.classList.add("sel");
    likSel[g.dataset.item] = +b.dataset.v;
    if(Object.keys(likSel).length === 3){
      const vals = Object.values(likSel);
      const prom = vals.reduce((a,b)=>a+b,0)/3;
      const eq = Math.round((5 - prom) * 2 * 10) / 10;
      const niv = eq >= 5.5 ? "alto" : eq >= 3 ? "moderado-alto" : eq >= 1.5 ? "moderado" : "leve";
      document.getElementById("likFormula").innerHTML =
        `<b>Conversión:</b> Promedio = (${vals.join(" + ")}) / 3 = <b>${prom.toFixed(1)}</b>
         &nbsp;→&nbsp; Equivalente IDEA = (5 − ${prom.toFixed(1)}) × 2 = <b>${eq}</b>
         &nbsp;→&nbsp; Nivel: <b>${niv}</b>`;
    }
  });
});

/* ================= ANALÍTICA INSTITUCIONAL — INDICADORES CALCULADOS =================
   Esta vista se calcula desde el modelo (array NNA + motor de flujo de M1). Antes eran
   constantes: los KPIs vivían en el markup y las series, acá. Dos reglas duras la acotan:

   §5.2 (no-homologabilidad) — IDEA y Escala IPPU-TEA miden constructos distintos y con
     lógica de puntaje inversa (el IDEA BAJA cuando hay mejora; la IPPU-TEA SUBE). No se
     suman, no se promedian juntas y no comparten eje: van en dos tarjetas separadas.
   §5.1.3 — el heatmap de talleres queda fuera de alcance: sigue con datos de muestra,
     no se calcula, y el markup lo rotula como tal.

   Lo que ya NO se puede calcular, y por qué: esta vista mostraba "IDEA enero vs noviembre".
   Desde M4 el IDEA es línea base ÚNICA (se quitó la lógica anual), así que ese segundo
   punto temporal no existe en el modelo. La única lectura de evolución legítima es el
   delta B−A de la IPPU-TEA, que ya calculó el motor al firmar el Protocolo B
   (flujo.pb.deltas): acá se promedia, nunca se recalcula.

   Declaradas como `function` a propósito: renderNNA() —que corre antes en este archivo—
   llama a renderAnalitica(), y un `const` de sección quedaría en zona muerta temporal.
   Misma familia de trampa que la del hoisting descrita en handoff §5.5.2. */

function promedio(xs){ return xs.length ? xs.reduce((a,b)=>a+b,0)/xs.length : null; }
function fmt1(v){ return v==null ? "—" : v.toFixed(1).replace(".", ","); }

/* Agregados poblacionales. Sólo NNA ACTIVOS: un expediente dado de baja no cuenta ni
   para la cobertura ni para los promedios del padrón. */
function analiticaAgregados(){
  const activos = NNA.filter(n=>n.activo);
  const conLB   = activos.filter(tieneLBFirmada);

  /* IDEA — sólo líneas base firmadas y completas. Una dimensión en 'NS' haría que el total
     no sea comparable con el del resto; validarIntegridad ya impide firmar así, este filtro
     es la red por si el dato llegara de otro lado. */
  const lbs     = conLB.map(n=>lbTotales(n.flujo.lb.dim)).filter(t=>!t.hayNS && t.count===12);
  const ideaEsc = [0,1,2,3].map(i=>promedio(lbs.map(t=>t.esc[i])));
  const ideaTot = promedio(lbs.map(t=>t.total));
  const banda   = Object.fromEntries(IDEA_BANDAS.map(b=>[b.perfil,0]));
  lbs.forEach(t=>banda[bandaIdea(t.total)]++);

  /* IPPU-TEA — sólo NNA con Protocolo A y B firmados y con el delta ya registrado por el
     motor (M5.3). Si el B se firmó por habilitación excepcional sin A, `deltas` es null y
     el NNA queda fuera del promedio: no hay evolución que medir. */
  const conAB    = activos.filter(n=>n.flujo.pa.firmado && n.flujo.pb.firmado && n.flujo.pb.deltas);
  const paEsc    = [0,1,2,3].map(i=>promedio(conAB.map(n=>protTotales(n.flujo.pa.item).esc[i])));
  const pbEsc    = [0,1,2,3].map(i=>promedio(conAB.map(n=>protTotales(n.flujo.pb.item).esc[i])));
  const deltaTot = promedio(conAB.map(n=>n.flujo.pb.deltas.total));

  const ciclos = activos.filter(n=>SECUENCIA.every(k=>n.flujo[k].firmado));
  return {activos, conLB, lbs, ideaEsc, ideaTot, banda, conAB, paEsc, pbEsc, deltaTot, ciclos};
}

function renderAnalitica(){
  const a    = analiticaAgregados();
  const nAct = a.activos.length;
  const ESCALAS_IDEA = ["Relación Social","Comunicación y Lenguaje","Anticipación / Flexibilidad","Simbolización"];
  const COLOR_ESC    = ["var(--teal)","var(--escB)","var(--purple)","var(--magenta)"];
  const MAX_IDEA_ESC = 24;   // 3 dimensiones × 8 puntos
  const MAX_PROT_ESC = 30;   // 6 ítems × 5 puntos
  const ancho = (v,max) => v==null ? 0 : Math.max(0, Math.min(100, v/max*100));
  const plural = (n,s,p) => n===1 ? s : p;

  /* --- KPIs --- */
  const cobertura = nAct ? Math.round(a.conLB.length/nAct*100) : 0;
  // deltaInterpreta clasifica un delta entero; el promedio se redondea sólo para elegir
  // la etiqueta/color, nunca para mostrar el número.
  const dInt = a.deltaTot==null ? null : deltaInterpreta(Math.round(a.deltaTot));
  const dTxt = a.deltaTot==null ? "—" : (a.deltaTot>0?"+":"") + fmt1(a.deltaTot);
  const kpis = [
    {lab:"Cobertura de línea base", val:`${cobertura} %`,
     sub:`${a.conLB.length} de ${nAct} NNA activos con HCE-LB firmada`},
    {lab:"IDEA promedio — línea base", val:`${fmt1(a.ideaTot)}<span class="kpi-den"> / 96</span>`,
     sub: a.ideaTot==null ? "Sin líneas base firmadas todavía"
        : `Banda ${bandaIdea(a.ideaTot)} · promedio de ${a.lbs.length} ${plural(a.lbs.length,"línea base","líneas base")}`},
    {lab:"Δ B−A · Escala IPPU-TEA", val:dTxt, color: dInt ? dInt.c : null,
     sub: a.conAB.length ? `${dInt.t} · ${a.conAB.length} de ${nAct} con ciclo A → B cerrado`
                         : "Ningún NNA con Protocolo A y B firmados"},
    {lab:"Ciclos completos", val:`${a.ciclos.length}<span class="kpi-den"> / ${nAct}</span>`, cls:"purple",
     sub:"CI → LB → PA → PB → IC firmados"}
  ];
  document.getElementById("anKpi").innerHTML = kpis.map(k=>`
    <div class="kpi"><div class="lab">${k.lab}</div>
      <div class="val ${k.cls||""}"${k.color?` style="color:${k.color}"`:""}>${k.val}</div>
      <div class="sub">${k.sub}</div></div>`).join("");

  /* --- Perfil poblacional por escala: línea base IDEA (máx. 24 por escala) --- */
  document.getElementById("escalasChart").innerHTML = a.lbs.length
    ? a.ideaEsc.map((v,i)=>`
        <div class="hbarrow"><div class="lab">${ESCALAS_IDEA[i]}</div>
          <div class="track"><div class="fill" style="width:${ancho(v,MAX_IDEA_ESC)}%;background:${COLOR_ESC[i]}">${fmt1(v)}</div></div></div>
      `).join("") +
      `<div class="note">Promedio por escala sobre ${a.lbs.length} ${plural(a.lbs.length,"línea base IDEA firmada","líneas base IDEA firmadas")} (máx. 24 pts por escala). <b>Menor puntaje = menor afectación.</b> Es una foto de la línea base, no una evolución: desde el Documento Técnico el IDEA se toma una sola vez por NNA (§5.1.1).</div>`
    : `<div class="empty-state"><div class="big">◔</div>Todavía no hay ninguna línea base IDEA firmada. El perfil poblacional aparece con la primera.</div>`;

  /* --- Evolución Protocolo A → B: Escala IPPU-TEA (máx. 30 por escala) --- */
  document.getElementById("protChart").innerHTML = a.conAB.length
    ? a.paEsc.map((v,i)=>`
        <div class="hbarrow"><div class="lab">${IPPU_ESCALAS[i]}</div>
          <div class="track"><div class="fill" style="width:${ancho(v,MAX_PROT_ESC)}%;background:#B9C6D6">${fmt1(v)}</div></div></div>
        <div class="hbarrow" style="margin-bottom:18px"><div class="lab" style="font-size:.68rem">→ Protocolo B</div>
          <div class="track"><div class="fill" style="width:${ancho(a.pbEsc[i],MAX_PROT_ESC)}%;background:${COLOR_ESC[i]}">${fmt1(a.pbEsc[i])}</div></div></div>
      `).join("") +
      `<div class="note">Promedio por escala de ${a.conAB.length} ${plural(a.conAB.length,"NNA con Protocolo A y B firmados","NNA con Protocolos A y B firmados")} (máx. 30 pts por escala). Barra gris = A · barra de color = B. <b>Acá el puntaje SUBE cuando hay progreso</b>, al revés que el IDEA: por eso los dos instrumentos nunca comparten eje ni se promedian juntos (§5.2).</div>`
    : `<div class="empty-state"><div class="big">◔</div>Ningún NNA tiene todavía el Protocolo A y el B firmados. La evolución A → B aparece al cerrarse el primer ciclo.</div>`;

  /* --- Distribución por banda de severidad (6 bandas §5.13/D4) --- */
  const BANDAS = IDEA_BANDAS.map((b,i)=>{
    const min = i===0 ? 0 : IDEA_BANDAS[i-1].max+1;
    const nombreCorto = b.perfil.split(" (")[0]; // corta el paréntesis descriptivo largo
    return [`${nombreCorto} (${min} – ${b.max}) · ${b.ns}`, b.perfil, b.color];
  });
  const nLb = a.lbs.length, sinLB = nAct - a.conLB.length;
  document.getElementById("distChart").innerHTML = BANDAS.map(b=>`
    <div class="hbarrow"><div class="lab">${b[0]}</div>
      <div class="track" style="height:24px"><div class="fill" style="width:${nLb ? a.banda[b[1]]/nLb*100 : 0}%;background:${b[2]}">${a.banda[b[1]]} NNA</div></div></div>
  `).join("") +
    `<div class="note">Distribución de ${nLb} ${plural(nLb,"línea base IDEA firmada","líneas base IDEA firmadas")} según la banda orientativa del puntaje total, con el soporte DSM-5-TR orientativo asociado. ` +
    (sinLB ? `Quedan fuera ${sinLB} ${plural(sinLB,"NNA activo sin línea base firmada","NNA activos sin línea base firmada")}.`
           : `Todos los NNA activos tienen su línea base firmada.`) + `</div>`;
}

// Heatmap talleres × escalas — datos ilustrativos (§5.1.3, fuera de alcance).
// Los nombres se alinean con los 14 reales del prototipo (§5.14 / D5); los valores no.
const talleres = [
  ["Taller de habilidades sociales",[2.1,1.4,0.8,1.0]],
  ["Taller de cuentos y estimulación del lenguaje",[1.2,2.0,0.5,0.9]],
  ["Educación Física",[0.6,0.4,1.1,0.3]],
  ["Actividades lúdicas y de juego",[1.0,0.8,0.6,1.8]],
  ["Taller de música y expresión",[0.9,1.1,0.7,1.2]],
  ["Taller de higiene y AVD",[0.4,0.3,1.6,0.2]]
];
const heatColor = v => v>=1.5 ? "#0E8F7E" : v>=0.9 ? "#6FBF9E" : v>=0.4 ? "#D9C26B" : "#C9CFD8";
document.getElementById("heatTable").innerHTML =
  `<tr><th class="row">Taller</th><th>Rel. Soc.</th><th>Comun.</th><th>Anticip.</th><th>Simbol.</th></tr>` +
  talleres.map(t=>`<tr><th class="row">${t[0]}</th>${t[1].map(v=>`<td><div class="heat-cell" style="background:${heatColor(v)}">${v.toFixed(1)}</div></td>`).join("")}</tr>`).join("");

// La distribución por banda de severidad se calcula en renderAnalitica() (más arriba),
// junto con los KPIs y los dos gráficos por escala.
/* ===================== TOAST ===================== */
function toast(msg){
  const t = document.getElementById("toast");
  document.getElementById("toastMsg").textContent = msg;
  t.classList.add("show");
  clearTimeout(window._toastT);
  window._toastT = setTimeout(()=>t.classList.remove("show"), 3200);
}

/* ===================== SESIÓN (login demo · usuario pre-creado) ===================== */
function doLogin(e){
  if(e) e.preventDefault();
  const u = document.getElementById("loginUser").value.trim();
  if(!u){ toast("Ingresá el usuario"); return false; }
  document.getElementById("loginScreen").classList.add("hidden");
  toast("Bienvenido, Dr. González");
  return false;
}
function logout(){
  document.getElementById("loginScreen").classList.remove("hidden");
  document.getElementById("loginPass").value = "demo1234";
  go("inicio");
  window.scrollTo({top:0});
}

