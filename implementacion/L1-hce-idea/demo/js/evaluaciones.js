/* Guardar IDEA en el expediente + editor Escala IPPU-TEA HCE-PA/PB (M5.2).
   Demo L1 HCE+IDEA - IPPU x UTEC-LIDIA.
   Extraido del monolito (lineas 2887-3129) sin cambios de logica.
   Los scripts se cargan en orden en index.html: el orden ES la semantica. */
/* ===================== GUARDAR EVALUACIÓN IDEA EN EL EXPEDIENTE ===================== */
function resetIDEA(){
  for(const k in ideaScores) delete ideaScores[k];
  document.querySelectorAll(".opcion.sel, .inter-btn.sel").forEach(b=>b.classList.remove("sel"));
  document.querySelectorAll(".prog-dim").forEach(p=>p.classList.remove("filled"));
  document.querySelectorAll("[id^='sel-']").forEach(s=>{ if(s.id.startsWith("sel-")) s.style.display="none"; });
  for(let ei=0;ei<4;ei++){ const sub=document.getElementById("sub"+ei); if(sub) sub.textContent="0 / 24"; }
  document.getElementById("ideaTotal").textContent="0";
  const nivel=document.getElementById("ideaNivel");
  nivel.textContent="0 / 12 dimensiones puntuadas"; nivel.style.background="#2C4A66";
  ["lb_fecha","lb_sesiones","lb_sintesis","lb_objetivos"].forEach(fid=>{ const el=document.getElementById(fid); if(el) el.value=""; });
  const mig=document.getElementById("lb_migrado"); if(mig) mig.checked=false;
  const badge=document.getElementById("ideaEstadoBadge"); if(badge) badge.innerHTML="";
  if(typeof ideaSetReadonly==="function") ideaSetReadonly(false);
}

/* M4: la LB (IDEA) vive en flujo.lb. El form guarda borrador o firma vía el motor de M1. */
function guardarLBDesdeForm(p){
  const lb = p.flujo.lb;
  const dim = Array(12).fill(null);
  for(let i=0;i<12;i++){ const v = ideaScores[`${Math.floor(i/3)}-${i%3}`]; dim[i] = (v===undefined)?null:v; }
  lb.dim = dim;
  lb.fecha = document.getElementById("lb_fecha").value || "";
  lb.sesiones = document.getElementById("lb_sesiones").value || "";
  lb.sintesis = document.getElementById("lb_sintesis").value.trim();
  lb.objetivos = document.getElementById("lb_objetivos").value.trim();
  lb.migrado = {es: document.getElementById("lb_migrado").checked, fechaOrigen: (lb.migrado&&lb.migrado.fechaOrigen)||""};
}
function guardarIDEA(){
  const id = parseInt(document.getElementById("selNNA").value);
  const p = NNA.find(n=>n.id===id);
  if(!p){ toast("Seleccioná un NNA"); return; }
  if(p.flujo.lb.firmado){ toast("La línea base está firmada — corrección por addenda."); return; }
  guardarLBDesdeForm(p);
  renderNNA();
  const badge=document.getElementById("ideaEstadoBadge"); if(badge) badge.innerHTML = estadoBadgeM(estadoModulo(p,"lb"));
  toast(`Línea base IDEA guardada (borrador) — ${p.nombre}`);
}
function firmarLB(){
  const id = parseInt(document.getElementById("selNNA").value);
  const p = NNA.find(n=>n.id===id);
  if(!p){ toast("Seleccioná un NNA"); return; }
  if(p.flujo.lb.firmado){ toast("La línea base ya está firmada."); return; }
  guardarLBDesdeForm(p);        // persistir el form antes de validar/firmar
  firmarModulo(id, "lb");       // el motor (M1) valida integridad y abre el modal de firma doble
}
function cargarIDEA(id){
  const p = NNA.find(n=>n.id===id); if(!p) return;
  const s=document.getElementById("selNNA"); if(s) s.value=String(id);
  resetIDEA();
  const lb = p.flujo.lb;
  (lb.dim||[]).forEach((v,i)=>{
    if(v==null) return;
    const dimKey = `${Math.floor(i/3)}-${i%3}`;
    let btn;
    if(v==="NS") btn = document.querySelector(`.inter-btn[data-ns][data-dim="${dimKey}"]`);
    else if([1,3,5,7].includes(v)) btn = document.querySelector(`.inter-btn[data-inter="${v}"][data-dim="${dimKey}"]`);
    else btn = document.querySelector(`.opcion[data-v="${v}"][data-dim="${dimKey}"]`);
    if(btn){ btn.classList.add("sel"); updateScore(dimKey, v); }
  });
  const set=(fid,val)=>{ const el=document.getElementById(fid); if(el) el.value=(val==null)?"":val; };
  set("lb_fecha", lb.fecha); set("lb_sesiones", lb.sesiones); set("lb_sintesis", lb.sintesis); set("lb_objetivos", lb.objetivos);
  const mig=document.getElementById("lb_migrado"); if(mig) mig.checked=!!(lb.migrado&&lb.migrado.es);
  const badge=document.getElementById("ideaEstadoBadge"); if(badge) badge.innerHTML = estadoBadgeM(estadoModulo(p,"lb"));
  ideaSetReadonly(lb.firmado);
}
function ideaSetReadonly(ro){
  document.querySelectorAll("#ideaForm button").forEach(b=>{ b.disabled = ro; });
  ["lb_fecha","lb_sesiones","lb_sintesis","lb_objetivos","lb_migrado"].forEach(fid=>{ const el=document.getElementById(fid); if(el) el.disabled = ro; });
  const g=document.querySelector('.idea-summary button[onclick*="guardarIDEA"]');
  const f=document.querySelector('.idea-summary button[onclick*="firmarLB"]');
  if(g) g.style.display = ro?"none":"";
  if(f) f.style.display = ro?"none":"";
}

/* ===================== EDITOR ESCALA IPPU-TEA · HCE-PA/PB (M5.2) =====================
   Vista única parametrizada por protocolo (protKey: 'pa' | 'pb'), mismo patrón que el
   editor IDEA: estado de trabajo en memoria + guardar/firmar vía el motor de flujo (M1). */
let protKey = "pa";
const protScores = Array(24).fill(null);
const PROT_INFO = {
  pa:{code:"HCE-PA", tit:"Protocolo A — aplicación de julio"},
  pb:{code:"HCE-PB", tit:"Protocolo B — fin de año"}
};

(function buildProtForm(){
  const cont = document.getElementById("protForm");
  cont.innerHTML = IPPU_ESCALAS.map((nom,e)=>{
    const items = IPPU_ITEMS.map((it,ix)=>({...it,ix})).filter(it=>it.e===e);
    return `<div class="prot-esc">
      <header><span>E${e+1} · ${nom}</span><span class="sub" id="protSub${e}">Ítems ${e*6+1}–${e*6+6} — 0 / 30</span></header>
      ${items.map(it=>`
        <div class="prot-item">
          <div class="pit-t"><b>Ítem ${it.ix+1}.</b> ${it.t}</div>
          <div class="lik-row" data-ix="${it.ix}">
            ${[1,2,3,4,5].map(v=>`<button type="button" class="lik-btn" data-v="${v}" title="${LIKERT_LBL[v]}">${v}${(v===1||v===5)?" — "+LIKERT_LBL[v]:""}</button>`).join("")}
          </div>
          <div class="prot-obs" id="protObsWrap${it.ix}">
            <div class="lbl" id="protObsLbl${it.ix}">Observación cualitativa</div>
            <textarea id="protObs${it.ix}" placeholder="Fundamentación de la puntuación (obligatoria si el ítem vale 1 o 5)."></textarea>
          </div>
          <div class="pit-r">Ref.: ${it.r} · <i>cita documental no verificada</i></div>
        </div>`).join("")}
    </div>`;
  }).join("");
})();

/* Observación cualitativa (§5.2): visible si el ítem vale 1/5 (obligatoria) o si ya tiene texto. */
function marcarObsProt(ix){
  const wrap = document.getElementById("protObsWrap"+ix);
  const ta = document.getElementById("protObs"+ix);
  const lbl = document.getElementById("protObsLbl"+ix);
  if(!wrap || !ta || !lbl) return;
  const req = protScores[ix]===1 || protScores[ix]===5;
  wrap.classList.toggle("show", req || !!ta.value.trim());
  const falta = req && !ta.value.trim();
  ta.classList.toggle("obs-req", falta);
  lbl.textContent = req ? `Observación cualitativa OBLIGATORIA (ítem puntuado ${protScores[ix]})` : "Observación cualitativa (opcional)";
  lbl.style.color = falta ? "var(--bad)" : "";
}
function updateProtTotales(){
  const t = protTotales(protScores);
  IPPU_ESCALAS.forEach((_,e)=>{
    const s = document.getElementById("protSub"+e);
    if(s) s.textContent = `Ítems ${e*6+1}–${e*6+6} — ${t.esc[e]} / 30`;
  });
  document.getElementById("protTotal").textContent = t.total;
  document.getElementById("protNivel").textContent = `${t.count} / 24 ítems${t.completo?" ✓":""}`;
}

document.getElementById("protForm").addEventListener("click", ev=>{
  const b = ev.target.closest(".lik-row .lik-btn"); if(!b || b.disabled) return;
  const grp = b.parentElement, ix = +grp.dataset.ix;
  grp.querySelectorAll(".lik-btn").forEach(x=>x.classList.remove("sel"));
  b.classList.add("sel");
  protScores[ix] = +b.dataset.v;
  marcarObsProt(ix);
  updateProtTotales();
});
document.getElementById("protForm").addEventListener("input", ev=>{
  const t = ev.target.closest(".prot-obs textarea"); if(!t) return;
  marcarObsProt(+t.id.replace("protObs",""));
});

function resetProt(){
  protScores.fill(null);
  document.querySelectorAll("#protForm .lik-btn").forEach(b=>b.classList.remove("sel"));
  document.querySelectorAll("#protForm .prot-obs").forEach(w=>w.classList.remove("show"));
  document.querySelectorAll("#protForm .prot-obs textarea").forEach(t=>{ t.value=""; t.classList.remove("obs-req"); });
  ["prot_fecha","prot_semanas","prot_sint1","prot_sint2","prot_otros","prot_ajustes"].forEach(fid=>{ const el=document.getElementById(fid); if(el) el.value=""; });
  document.getElementById("protAviso").innerHTML = "";
  const badge = document.getElementById("protEstadoBadge"); if(badge) badge.innerHTML = "";
  updateProtTotales();
}

/* Cambia de protocolo (tabs A|B) manteniendo el NNA seleccionado. */
function protSwitch(key){
  const id = parseInt(document.getElementById("selNNAProt").value);
  if(!isNaN(id)) cargarProt(id, key);
}

function cargarProt(id, key){
  const p = NNA.find(n=>n.id===id); if(!p) return;
  protKey = key || "pa";
  const s = document.getElementById("selNNAProt"); if(s) s.value = String(id);
  document.getElementById("protTabPa").classList.toggle("active", protKey==="pa");
  document.getElementById("protTabPb").classList.toggle("active", protKey==="pb");
  const inf = PROT_INFO[protKey];
  document.getElementById("protCrumb").textContent = inf.code;
  document.getElementById("protTitle").textContent = `${inf.code} · ${inf.tit} — Escala IPPU-TEA`;
  document.getElementById("protDatosTitle").textContent = `Datos del ${protKey==="pa"?"Protocolo A":"Protocolo B"} (${inf.code})`;
  document.getElementById("protAjustesWrap").style.display = protKey==="pb" ? "" : "none";
  resetProt();
  const pr = p.flujo[protKey];
  (pr.item||[]).forEach((v,ix)=>{
    if(typeof v!=="number") return;
    const btn = document.querySelector(`#protForm .lik-row[data-ix="${ix}"] .lik-btn[data-v="${v}"]`);
    if(btn) btn.classList.add("sel");
    protScores[ix] = v;
  });
  (pr.obs||[]).forEach((o,ix)=>{ const el=document.getElementById("protObs"+ix); if(el) el.value = o||""; });
  const set = (fid,val)=>{ const el=document.getElementById(fid); if(el) el.value = (val==null)?"":val; };
  set("prot_fecha", pr.fecha); set("prot_semanas", pr.semanas);
  set("prot_sint1", pr.sintTec1); set("prot_sint2", pr.sintTec2); set("prot_otros", pr.otros);
  if(protKey==="pb") set("prot_ajustes", pr.ajustes);
  protScores.forEach((_,ix)=>marcarObsProt(ix));
  updateProtTotales();
  const st = estadoModulo(p, protKey);
  const badge = document.getElementById("protEstadoBadge"); if(badge) badge.innerHTML = estadoBadgeM(st);
  if(st==="bloqueado"){
    const h = moduloHabilitado(p, protKey);
    document.getElementById("protAviso").innerHTML =
      `<div class="review-note" style="margin-bottom:14px">🔒 <b>${inf.code} bloqueado:</b> ${h.motivoBloqueo}${h.exceptuable?' La habilitación excepcional se gestiona desde el panel "Flujo de módulos" del expediente.':""}</div>`;
  }
  protSetReadonly(st!=="borrador");
}

function protSetReadonly(ro){
  document.querySelectorAll("#protForm button").forEach(b=>{ b.disabled = ro; });
  document.querySelectorAll("#protForm .prot-obs textarea").forEach(t=>{ t.disabled = ro; });
  ["prot_fecha","prot_semanas","prot_sint1","prot_sint2","prot_otros","prot_ajustes"].forEach(fid=>{ const el=document.getElementById(fid); if(el) el.disabled = ro; });
  const g = document.querySelector('#view-prot .idea-summary button[onclick*="guardarProt"]');
  const f = document.querySelector('#view-prot .idea-summary button[onclick*="firmarProt"]');
  if(g) g.style.display = ro?"none":"";
  if(f) f.style.display = ro?"none":"";
}

/* El form escribe en flujo.pa / flujo.pb (borrador o previo a firmar). */
function guardarProtDesdeForm(p){
  const pr = p.flujo[protKey];
  pr.item = protScores.slice();
  pr.obs = protScores.map((_,ix)=>{ const el=document.getElementById("protObs"+ix); return el?el.value.trim():""; });
  pr.fecha = document.getElementById("prot_fecha").value || "";
  pr.semanas = document.getElementById("prot_semanas").value || "";
  pr.sintTec1 = document.getElementById("prot_sint1").value.trim();
  pr.sintTec2 = document.getElementById("prot_sint2").value.trim();
  pr.otros = document.getElementById("prot_otros").value.trim();
  if(protKey==="pb") pr.ajustes = document.getElementById("prot_ajustes").value.trim();
}
function guardarProt(){
  const id = parseInt(document.getElementById("selNNAProt").value);
  const p = NNA.find(n=>n.id===id);
  if(!p){ toast("Seleccioná un NNA"); return; }
  const st = estadoModulo(p, protKey);
  if(st==="firmado"){ toast("El protocolo está firmado — corrección por addenda."); return; }
  if(st==="bloqueado"){ toast(moduloHabilitado(p, protKey).motivoBloqueo); return; }
  guardarProtDesdeForm(p);
  const badge = document.getElementById("protEstadoBadge"); if(badge) badge.innerHTML = estadoBadgeM(estadoModulo(p, protKey));
  toast(`${PROT_INFO[protKey].code} guardado (borrador) — ${p.nombre}`);
}
function firmarProt(){
  const id = parseInt(document.getElementById("selNNAProt").value);
  const p = NNA.find(n=>n.id===id);
  if(!p){ toast("Seleccioná un NNA"); return; }
  if(p.flujo[protKey].firmado){ toast("El protocolo ya está firmado."); return; }
  const st = estadoModulo(p, protKey);
  if(st==="bloqueado"){ toast(moduloHabilitado(p, protKey).motivoBloqueo); return; }
  guardarProtDesdeForm(p);          // persistir el form antes de validar/firmar
  const sem = parseInt(p.flujo[protKey].semanas);
  if(!(sem>=15)) toast("Advertencia (§4.3): se recomiendan ≥ 15 semanas de asistencia efectiva — no bloquea la firma.");
  firmarModulo(id, protKey);        // el motor (M1) valida integridad §4.3 y abre el modal de firma doble
}

