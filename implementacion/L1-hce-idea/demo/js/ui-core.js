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

/* ================= ANALÍTICA: GRÁFICOS ================= */
// Barras horizontales por escala (enero vs noviembre, promedio poblacional /24)
const escalas = [
  ["Relación Social", 13.2, 8.1, "var(--teal)"],
  ["Comunicación y Lenguaje", 11.8, 7.9, "var(--escB)"],
  ["Anticipación / Flexibilidad", 9.6, 7.2, "var(--purple)"],
  ["Simbolización", 7.4, 5.3, "var(--magenta)"]
];
document.getElementById("escalasChart").innerHTML = escalas.map(e=>`
  <div class="hbarrow"><div class="lab">${e[0]}</div>
    <div class="track"><div class="fill" style="width:${e[1]/24*100}%;background:#B9C6D6">${e[1]}</div></div></div>
  <div class="hbarrow" style="margin-bottom:18px"><div class="lab" style="font-size:.68rem">→ Noviembre</div>
    <div class="track"><div class="fill" style="width:${e[2]/24*100}%;background:${e[3]}">${e[2]}</div></div></div>
`).join("") + `<div class="note">Promedio poblacional por escala (máx. 24 pts). Barra gris = enero · barra de color = noviembre. La reducción del puntaje indica mejora.</div>`;

// Heatmap talleres × escalas
const talleres = [
  ["Habilidades sociales",[2.1,1.4,0.8,1.0]],
  ["Lenguaje y comunicación",[1.2,2.0,0.5,0.9]],
  ["Motricidad",[0.6,0.4,1.1,0.3]],
  ["Juego simbólico",[1.0,0.8,0.6,1.8]],
  ["Música y expresión",[0.9,1.1,0.7,1.2]],
  ["Vida diaria (AVD)",[0.4,0.3,1.6,0.2]]
];
const heatColor = v => v>=1.5 ? "#0E8F7E" : v>=0.9 ? "#6FBF9E" : v>=0.4 ? "#D9C26B" : "#C9CFD8";
document.getElementById("heatTable").innerHTML =
  `<tr><th class="row">Taller</th><th>Rel. Soc.</th><th>Comun.</th><th>Anticip.</th><th>Simbol.</th></tr>` +
  talleres.map(t=>`<tr><th class="row">${t[0]}</th>${t[1].map(v=>`<td style="background:${heatColor(v)}">${v.toFixed(1)}</td>`).join("")}</tr>`).join("");

// Distribución por banda de severidad
const dist = [
  ["Leve (0 – 32)", 11, "var(--ok)"],
  ["Moderada (33 – 64)", 15, "var(--warn)"],
  ["Severa (65 – 96)", 4, "var(--bad)"]
];
document.getElementById("distChart").innerHTML = dist.map(d=>`
  <div class="hbarrow"><div class="lab">${d[0]}</div>
    <div class="track" style="height:24px"><div class="fill" style="width:${d[1]/30*100}%;background:${d[2]}">${d[1]} NNA</div></div></div>
`).join("") + `<div class="note">Distribución del padrón 2026 según banda orientativa del puntaje IDEA de noviembre. En enero la banda severa incluía 9 NNA: 5 pasaron a moderada durante el ciclo.</div>`;
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

