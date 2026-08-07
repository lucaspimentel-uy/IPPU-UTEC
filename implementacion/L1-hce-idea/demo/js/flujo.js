/* M1 - Motor de flujo: estado, firma, bloqueo, addenda, excepcion + HCE-LOG.
   Demo L1 HCE+IDEA - IPPU x UTEC-LIDIA.
   Extraido del monolito (lineas 1251-1804) sin cambios de logica.
   Los scripts se cargan en orden en index.html: el orden ES la semantica. */
/* =================================================================
   M1 · MOTOR DE FLUJO (estado · firma · bloqueo · addenda · excepción)
   Documento Técnico IPPU §3.2 (HCE-LOG) y §4 (flujo guiado, no impuesto).
   Secuencia: CI → LB → PA → PB → IC. Estados derivados: bloqueado | borrador | firmado.
   Todo en memoria (demo, no persistente). Infraestructura que poblarán M2–M6.
   ================================================================= */
const USUARIO_ACTUAL = "Dr. González — Psicología";  // sesión demo (login pre-cargado)
const HOY = "2026-07-15";

/* Módulos de la secuencia (el orden ES la habilitación secuencial). */
const MODULOS_FLUJO = [
  {key:"ci", code:"CI", name:"Consentimiento informado", full:"HCE-CI"},
  {key:"lb", code:"LB", name:"Línea base — IDEA",        full:"HCE-LB"},
  {key:"pa", code:"PA", name:"Protocolo A — IPPU-TEA",   full:"HCE-PA"},
  {key:"pb", code:"PB", name:"Protocolo B — IPPU-TEA",   full:"HCE-PB"},
  {key:"ic", code:"IC", name:"Informe de Cierre Anual",  full:"HCE-IC"},
];
const SECUENCIA = MODULOS_FLUJO.map(m=>m.key);          // ['ci','lb','pa','pb','ic']
const modInfo = key => MODULOS_FLUJO.find(m=>m.key===key);
const MOD_LABEL = {hce00:"HCE-00", doc:"HCE-DOC", org:"HCE-ORG", vf:"HCE-VF"};   // módulos fuera de la secuencia (para HCE-LOG)
const moduloLabel = key => { const m=modInfo(key); return m ? m.full : (MOD_LABEL[key]||key||"—"); };

/* Técnicos responsables — roles fijos (decisión §0.5). Genéricos/configurables en el futuro. */
const TECNICOS = [
  {profesional:"Dr. González", rol:"Psicólogo/a"},
  {profesional:"Mtra. Torres", rol:"Maestro/a"},
];

/* Objeto de flujo por defecto: CI editable (borrador), el resto bloqueado. */
function initFlujo(){
  const mk = () => ({firmado:false, firmas:[], addendas:[], excepcion:null});
  const f = {ci:mk(), lb:mk(), pa:mk(), pb:mk(), ic:mk()};
  f.ci.autorizaciones = {evaluacion:false, registro:false, comunicacion:false};  // HCE-CI (M3)
  f.ci.adjunto = "";
  Object.assign(f.lb, { dim:Array(12).fill(null), obs:Array(12).fill(""),      // HCE-LB / IDEA (M4)
    fecha:"", sesiones:"", sintesis:"", objetivos:"", migrado:{es:false, fechaOrigen:""} });
  f.lb.kind = "idea";                                                          // guard de no-homologabilidad (M5)
  [f.pa, f.pb].forEach(pr => Object.assign(pr, { kind:"protocolo",            // HCE-PA/PB · Escala IPPU-TEA (M5)
    item:Array(24).fill(null), obs:Array(24).fill(""), fecha:"", semanas:"", sintTec1:"", sintTec2:"", otros:"" }));
  f.pb.ajustes = ""; f.pb.deltas = null;                                       // deltas B−A, solo al firmar B
  Object.assign(f.ic, { fecha:"", sintEsc:["","","",""], valTec1:"", valTec2:"", // HCE-IC · Informe de Cierre Anual (M6)
    recomendaciones:"", orientaciones:"", recibi:null });                        // recibi = {firmante, fecha} tras la firma
  return f;
}

/* --- Reglas de secuencia (§4.1 / §4.2) -------------------------------
   ¿El módulo está habilitado para editar/firmar? (independiente de si ya está firmado)
   Devuelve {habilitado, exceptuable, motivoBloqueo}.
   Regla dura: sin CI firmado nada se habilita, y eso NO es exceptuable (§4.2). */
function moduloHabilitado(nna, key){
  if(key==="ci") return {habilitado:true, exceptuable:false, motivoBloqueo:""};
  if(!nna.flujo.ci.firmado){
    return {habilitado:false, exceptuable:false,
      motivoBloqueo:"Requiere Consentimiento Informado firmado — único requisito no exceptuable (§4.2)."};
  }
  const prev = SECUENCIA[SECUENCIA.indexOf(key)-1];
  const habilitado = nna.flujo[prev].firmado || !!nna.flujo[key].excepcion;
  return {habilitado, exceptuable:true,
    motivoBloqueo: habilitado ? "" : `Requiere ${modInfo(prev).full} firmado o habilitación excepcional.`};
}

/* Estado visible DERIVADO (nunca se almacena 'borrador'/'bloqueado' → sin drift). */
function estadoModulo(nna, key){
  if(nna.flujo[key].firmado) return "firmado";
  return moduloHabilitado(nna, key).habilitado ? "borrador" : "bloqueado";
}

/* HOOK de validación de integridad (§4.3). Vacío en M1; M4–M6 lo completan por módulo. */
function validarIntegridad(nna, key){
  if(key==="lb"){                                   // HCE-LB / IDEA (M4, §4.3)
    const lb = nna.flujo.lb; const t = lbTotales(lb.dim);
    if(t.count < 12 || t.hayNS) return {ok:false, msg:"Para firmar la línea base: las 12 dimensiones deben estar puntuadas y sin NS."};
    if(!lb.fecha)     return {ok:false, msg:"Falta la fecha de consenso de la línea base."};
    if(!lb.sintesis)  return {ok:false, msg:"Falta la síntesis clínica de la línea base."};
    if(!lb.objetivos) return {ok:false, msg:"Faltan los objetivos del período."};
  }
  if(key==="pa" || key==="pb"){                     // HCE-PA/PB · Escala IPPU-TEA (M5, §4.3)
    const pr = nna.flujo[key]; const t = protTotales(pr.item);
    const code = key==="pa" ? "Protocolo A" : "Protocolo B";
    if(!t.completo) return {ok:false, msg:`Para firmar el ${code}: los 24 ítems deben estar puntuados (van ${t.count}).`};
    const sinObs = pr.item.map((v,ix)=>((v===1||v===5) && !(pr.obs[ix]||"").trim()) ? ix+1 : null).filter(x=>x!=null);
    if(sinObs.length) return {ok:false, msg:`Observación cualitativa obligatoria en todo ítem puntuado 1 o 5 — falta en: ítem ${sinObs.join(", ítem ")}.`};
    if(!pr.fecha) return {ok:false, msg:`Falta la fecha de aplicación del ${code}.`};
    if(!pr.sintTec1 || !pr.sintTec2) return {ok:false, msg:`Faltan las síntesis de ambos técnicos (${code}).`};
  }
  if(key==="ic"){                                   // HCE-IC · Informe de Cierre Anual (M6, §4.3)
    const ic = nna.flujo.ic;
    const faltan = ic.sintEsc.map((t,i)=>(t||"").trim()?null:`E${i+1}`).filter(x=>x);
    if(faltan.length)       return {ok:false, msg:`Falta la síntesis cualitativa por escala: ${faltan.join(", ")}.`};
    if(!ic.valTec1 || !ic.valTec2) return {ok:false, msg:"Faltan las valoraciones anuales de ambos técnicos."};
    if(!ic.recomendaciones) return {ok:false, msg:"Faltan las recomendaciones y ajustes de tratamiento."};
    if(!ic.orientaciones)   return {ok:false, msg:"Faltan las orientaciones concretas a la familia."};
    if(!ic.fecha)           return {ok:false, msg:"Falta la fecha del informe."};
  }
  return {ok:true, msg:""};
}

/* HCE-LOG: registro de solo inserción (§3.2). */
function nowStr(){ const d=new Date(); const hh=String(d.getHours()).padStart(2,"0"), mm=String(d.getMinutes()).padStart(2,"0"); return fmtFecha(HOY)+" · "+hh+":"+mm; }
function logEvento(nna, {modulo, tipo, detalle, ts, usuario}){
  nna.hceLog.push({ts: ts||nowStr(), usuario: usuario||USUARIO_ACTUAL, modulo, tipo, detalle});
}

/* --- Acciones (mutan estado y registran en HCE-LOG) ------------------ */
function firmarModulo(id, key){
  const nna = NNA.find(n=>n.id===id); if(!nna) return;
  if(nna.flujo[key].firmado){ toast("El módulo ya está firmado."); return; }
  const h = moduloHabilitado(nna, key);
  if(!h.habilitado){ toast(h.motivoBloqueo); return; }
  const v = validarIntegridad(nna, key);          // hook (no-op en M1)
  if(!v.ok){ toast(v.msg); return; }
  openFirmaModal(id, key);
}
function confirmarFirma(id, key){
  const nna = NNA.find(n=>n.id===id); const f = nna.flujo[key];
  const fecha = (document.getElementById("mfFecha")||{}).value || HOY;
  if(key==="ci"){
    const firmante = (document.getElementById("mfFirmante").value||"").trim() || nna.referente || "Familia";
    const chk = id => { const el=document.getElementById(id); return el?el.checked:true; };
    f.autorizaciones = {evaluacion:chk("mfAutEval"), registro:chk("mfAutReg"), comunicacion:chk("mfAutCom")};
    f.adjunto = ((document.getElementById("mfAdjunto")||{}).value||"").trim();
    f.firmas = [{profesional:firmante, rol:"Familia/referente", fecha}];
    const aut = [f.autorizaciones.evaluacion&&"evaluación", f.autorizaciones.registro&&"registro", f.autorizaciones.comunicacion&&"comunicación"].filter(Boolean).join(", ");
    logEvento(nna, {modulo:key, tipo:"firma", detalle:`Consentimiento informado firmado por ${firmante}. Autoriza: ${aut||"—"}.`});
  } else {
    f.firmas = TECNICOS.map(t=>({...t, fecha}));
    logEvento(nna, {modulo:key, tipo:"firma", detalle:`Firma doble — ${TECNICOS.map(t=>t.profesional+" ("+t.rol+")").join(" · ")}.`});
  }
  f.firmado = true;
  if(key==="pb") calcularDeltasPB(nna);   // M5.3: delta B−A automático al firmar B (§5.2)
  closeFlujoModal(); renderFlujo(id);
  if(key==="lb" && document.getElementById("view-idea") && document.getElementById("view-idea").classList.contains("active")) cargarIDEA(nna.id);
  if((key==="pa"||key==="pb") && document.getElementById("view-prot") && document.getElementById("view-prot").classList.contains("active")) cargarProt(nna.id, key);
  if(key==="ic" && document.getElementById("view-ic") && document.getElementById("view-ic").classList.contains("active")) cargarIC(nna.id);
  if(typeof renderNNA==="function") renderNNA();
  toast(`${modInfo(key).full} firmado. Bloqueado para edición (corrección por addenda).`);
}
function habilitarExcepcional(id, key){
  const nna = NNA.find(n=>n.id===id); if(!nna) return;
  const h = moduloHabilitado(nna, key);
  if(!h.exceptuable){ toast(h.motivoBloqueo); return; }
  if(h.habilitado){ toast("El módulo ya está habilitado."); return; }
  openExcepcionModal(id, key);
}
function confirmarExcepcion(id, key){
  const nna = NNA.find(n=>n.id===id);
  const motivo = document.getElementById("mfMotivo").value;
  const texto = (document.getElementById("mfTexto").value||"").trim();
  if(!texto){ toast("La constancia del motivo es obligatoria."); return; }
  nna.flujo[key].excepcion = {motivo, texto, profesional:USUARIO_ACTUAL, fecha:HOY};
  logEvento(nna, {modulo:key, tipo:"excepcion", detalle:`Habilitación excepcional — ${motivo}: ${texto}`});
  closeFlujoModal(); renderFlujo(id);
  toast(`${modInfo(key).full} habilitado excepcionalmente. Registrado en HCE-LOG.`);
}
function addendaModulo(id, key){
  const nna = NNA.find(n=>n.id===id); if(!nna) return;
  if(!nna.flujo[key].firmado){ toast("Solo se agregan addendas a módulos firmados."); return; }
  openAddendaModal(id, key);
}
function confirmarAddenda(id, key){
  const nna = NNA.find(n=>n.id===id);
  const texto = (document.getElementById("mfTexto").value||"").trim();
  if(!texto){ toast("Escribí la corrección/justificación de la addenda."); return; }
  nna.flujo[key].addendas.push({fecha:HOY, profesional:USUARIO_ACTUAL, texto});
  logEvento(nna, {modulo:key, tipo:"addenda", detalle:texto});
  closeFlujoModal(); renderFlujo(id);
  toast("Addenda registrada (el módulo firmado no se modifica).");
}

/* --- Modales de flujo (reusan #modalFlujo) --------------------------- */
function openFlujoModal(title, sub, bodyHtml, footHtml){
  document.getElementById("mfTitle").textContent = title;
  document.getElementById("mfSub").textContent = sub;
  document.getElementById("mfBody").innerHTML = bodyHtml;
  document.getElementById("mfFoot").innerHTML = footHtml;
  document.getElementById("modalFlujo").classList.add("open");
}
function closeFlujoModal(){ document.getElementById("modalFlujo").classList.remove("open"); }
function openFirmaModal(id, key){
  const nna = NNA.find(n=>n.id===id); const m = modInfo(key);
  const body = key==="ci"
    ? `<div class="section-label">Consentimiento informado (HCE-CI)</div>
       <div class="field"><label>Firmante (familia / referente)</label><input id="mfFirmante" value="${nna.referente||""}"></div>
       <div class="field"><label>Fecha</label><input id="mfFecha" type="date" value="${HOY}"></div>
       <div class="section-label">Autorizaciones de la familia</div>
       <label style="display:flex;gap:8px;align-items:center;font-size:.83rem;margin-bottom:7px"><input type="checkbox" id="mfAutEval" checked> Autoriza la evaluación</label>
       <label style="display:flex;gap:8px;align-items:center;font-size:.83rem;margin-bottom:7px"><input type="checkbox" id="mfAutReg" checked> Autoriza el registro en la HCE</label>
       <label style="display:flex;gap:8px;align-items:center;font-size:.83rem;margin-bottom:12px"><input type="checkbox" id="mfAutCom" checked> Autoriza la comunicación a organismos (INAU / BPS)</label>
       <div class="field"><label>Adjunto (documento firmado)</label><input id="mfAdjunto" value="consentimiento_2026.pdf"><div class="hint">Demo: no se sube un archivo real.</div></div>
       <div class="review-note">⚠ Único bloqueo sin excepción posible (§4.2): sin CI firmado no se habilita ningún módulo de evaluación.</div>`
    : `<div class="section-label">Firma doble de técnicos responsables (§3.1)</div>
       ${TECNICOS.map(t=>`<div class="data-row"><dt>${t.rol}</dt><dd>${t.profesional}</dd></div>`).join("")}
       <div class="field" style="margin-top:12px"><label>Fecha de consenso</label><input id="mfFecha" type="date" value="${HOY}"></div>
       <div class="review-note">⚠ La firma bloquea el módulo. En M1 la validación de integridad (§4.3) es un hook vacío; cada módulo (M4–M6) la completa.</div>`;
  const foot = `<span class="left">${m.full} · ${m.name}</span>
    <div style="display:flex;gap:10px">
      <button class="btn btn-ghost" onclick="closeFlujoModal()">Cancelar</button>
      <button class="btn btn-primary" style="background:var(--ok)" onclick="confirmarFirma(${id},'${key}')">✓ Firmar y bloquear</button>
    </div>`;
  openFlujoModal(`Firmar ${m.full}`, `${nna.nombre} ${nna.apellido} · Expediente #${nna.id}`, body, foot);
}
function openExcepcionModal(id, key){
  const nna = NNA.find(n=>n.id===id); const m = modInfo(key);
  const motivos = ["Ingreso tardío","Reingreso","Licencia del equipo","Situación familiar","Otro"];
  const body = `<div class="section-label">Habilitación excepcional (§4.2)</div>
    <p style="font-size:.8rem;color:var(--ink-2);margin-bottom:12px">Este módulo está bloqueado por la secuencia. Podés habilitarlo dejando una constancia del motivo — <b>queda registrada en HCE-LOG y no se oculta</b>.</p>
    <div class="field"><label>Motivo</label><select id="mfMotivo">${motivos.map(o=>`<option>${o}</option>`).join("")}</select></div>
    <div class="field"><label>Constancia (obligatoria)</label><textarea id="mfTexto" placeholder="Breve descripción del motivo de la habilitación excepcional."></textarea></div>`;
  const foot = `<span class="left">${m.full} · ${m.name}</span>
    <div style="display:flex;gap:10px">
      <button class="btn btn-ghost" onclick="closeFlujoModal()">Cancelar</button>
      <button class="btn btn-primary" style="background:var(--warn)" onclick="confirmarExcepcion(${id},'${key}')">⚠ Habilitar excepcionalmente</button>
    </div>`;
  openFlujoModal(`Habilitar ${m.full} excepcionalmente`, `${nna.nombre} ${nna.apellido} · Expediente #${nna.id}`, body, foot);
}
function openAddendaModal(id, key){
  const nna = NNA.find(n=>n.id===id); const m = modInfo(key);
  const body = `<div class="section-label">Addenda a módulo firmado (§4.1)</div>
    <p style="font-size:.8rem;color:var(--ink-2);margin-bottom:12px">El módulo firmado no se edita. La corrección se agrega como addenda con fecha y profesional.</p>
    <div class="field"><label>Corrección / justificación</label><textarea id="mfTexto" placeholder="Texto de la addenda."></textarea></div>`;
  const foot = `<span class="left">${m.full} · ${nna.flujo[key].addendas.length} addenda(s) previa(s)</span>
    <div style="display:flex;gap:10px">
      <button class="btn btn-ghost" onclick="closeFlujoModal()">Cancelar</button>
      <button class="btn btn-primary" style="background:var(--teal)" onclick="confirmarAddenda(${id},'${key}')">+ Agregar addenda</button>
    </div>`;
  openFlujoModal(`Addenda · ${m.full}`, `${nna.nombre} ${nna.apellido} · Expediente #${nna.id}`, body, foot);
}
function verHceLog(id){
  const nna = NNA.find(n=>n.id===id);
  const evs = [...nna.hceLog].reverse();          // más reciente primero (orden de inserción)
  const tag = {firma:["lt-firma","Firma"], excepcion:["lt-excepcion","Excepción"], addenda:["lt-addenda","Addenda"], edicion:["lt-edicion","Edición"], alerta:["lt-alerta","Alerta"]};
  const body = evs.length
    ? `<table class="log-table"><thead><tr><th>Fecha y hora</th><th>Usuario</th><th>Módulo</th><th>Tipo</th><th>Detalle</th></tr></thead><tbody>
        ${evs.map(e=>{ const [c,t]=tag[e.tipo]||["lt-edicion",e.tipo]; const mod=moduloLabel(e.modulo);
          return `<tr><td style="white-space:nowrap">${e.ts}</td><td>${e.usuario}</td><td><b>${mod}</b></td><td><span class="log-tipo ${c}">${t}</span></td><td>${e.detalle}</td></tr>`;}).join("")}
       </tbody></table>`
    : `<p style="color:var(--ink-2);font-size:.85rem;padding:8px 0">Sin eventos de auditoría todavía.</p>`;
  const foot = `<span class="left">HCE-LOG · registro de solo lectura e inalterable (§3.2 · demo, no persistente)</span>
    <button class="btn btn-ghost" onclick="closeFlujoModal()">Cerrar</button>`;
  openFlujoModal(`HCE-LOG — ${nna.nombre} ${nna.apellido}`, "Auditoría: firmas, habilitaciones excepcionales y addendas", body, foot);
}

/* HCE-CI · vista de detalle del consentimiento firmado (M3). */
function verCI(id){
  const nna = NNA.find(n=>n.id===id); const c = nna.flujo.ci; const a = c.autorizaciones||{};
  const si = b => b ? '<span style="color:var(--ok);font-weight:700">Sí</span>' : '<span style="color:var(--bad)">No</span>';
  const body = `<div class="section-label">Consentimiento informado — firmado</div>
    <div class="data-row"><dt>Firmante</dt><dd>${c.firmas[0]?c.firmas[0].profesional:"—"}</dd></div>
    <div class="data-row"><dt>Fecha</dt><dd>${c.firmas[0]?fmtFecha(c.firmas[0].fecha):"—"}</dd></div>
    <div class="data-row"><dt>Autoriza evaluación</dt><dd>${si(a.evaluacion)}</dd></div>
    <div class="data-row"><dt>Autoriza registro en la HCE</dt><dd>${si(a.registro)}</dd></div>
    <div class="data-row"><dt>Autoriza comunicación a organismos</dt><dd>${si(a.comunicacion)}</dd></div>
    <div class="data-row"><dt>Adjunto</dt><dd>${c.adjunto||"—"}</dd></div>
    ${c.addendas.length?`<div class="section-label">Addendas</div>${c.addendas.map(x=>`<div class="data-row"><dt>${fmtFecha(x.fecha)}</dt><dd style="text-align:left">${x.texto}</dd></div>`).join("")}`:""}`;
  const foot = `<span class="left">HCE-CI · único bloqueo sin excepción (§4.2)</span><button class="btn btn-ghost" onclick="closeFlujoModal()">Cerrar</button>`;
  openFlujoModal("HCE-CI — Consentimiento informado", `${nna.nombre} ${nna.apellido} · Expediente #${nna.id}`, body, foot);
}

/* HCE-LB · vista de detalle de la línea base IDEA firmada (M4). */
function verLB(id){
  const nna = NNA.find(n=>n.id===id); const lb = nna.flujo.lb; const t = lbTotales(lb.dim);
  const escNames = ["Relación Social","Comunicación y Lenguaje","Anticipación y Flexibilidad","Simbolización"];
  const filas = escNames.map((n,i)=>`<div class="data-row"><dt>${n}</dt><dd>${t.esc[i]} / 24</dd></div>`).join("");
  const body = `<div class="section-label">Línea base IDEA — firmada</div>
    <div class="data-row"><dt>Fecha de consenso</dt><dd>${fmtFecha(lb.fecha)}</dd></div>
    <div class="data-row"><dt>Sesiones de observación</dt><dd>${lb.sesiones||"—"}</dd></div>
    ${filas}
    <div class="data-row"><dt><b>Total IDEA</b></dt><dd><b>${t.total} / 96</b> · <span style="color:${colorBanda(t.total)};font-weight:700">${bandaIdea(t.total)}</span></dd></div>
    <div class="section-label">Síntesis clínica</div><p style="font-size:.83rem;color:var(--ink)">${lb.sintesis||"—"}</p>
    <div class="section-label">Objetivos del período</div><p style="font-size:.83rem;color:var(--ink)">${lb.objetivos||"—"}</p>
    ${lb.migrado&&lb.migrado.es?`<div class="review-note">Migrado del sistema anterior.</div>`:""}
    ${lb.addendas.length?`<div class="section-label">Addendas</div>${lb.addendas.map(x=>`<div class="data-row"><dt>${fmtFecha(x.fecha)}</dt><dd style="text-align:left">${x.texto}</dd></div>`).join("")}`:""}`;
  const foot = `<span class="left">HCE-LB · firmas: ${lb.firmas.map(x=>x.profesional).join(" · ")||"—"}</span><button class="btn btn-ghost" onclick="closeFlujoModal()">Cerrar</button>`;
  openFlujoModal("HCE-LB — Línea base IDEA", `${nna.nombre} ${nna.apellido} · Expediente #${nna.id}`, body, foot);
}

/* HCE-PA/PB · vista de detalle del protocolo IPPU-TEA firmado (M5.3). */
function verProt(id, key){
  const nna = NNA.find(n=>n.id===id); const pr = nna.flujo[key]; const t = protTotales(pr.item);
  const inf = {pa:{code:"HCE-PA", tit:"Protocolo A (julio)"}, pb:{code:"HCE-PB", tit:"Protocolo B (fin de año)"}}[key];
  const filas = IPPU_ESCALAS.map((n,i)=>`<div class="data-row"><dt>E${i+1} · ${n}</dt><dd>${t.esc[i]} / 30</dd></div>`).join("");
  let deltasHtml = "";
  if(key==="pb"){
    if(pr.deltas){
      const itT = deltaInterpreta(pr.deltas.total);
      deltasHtml = `<div class="section-label">Delta B − A por escala (§5.2 · sólo entre protocolos IPPU-TEA)</div>` +
        IPPU_ESCALAS.map((n,i)=>{ const d = pr.deltas.esc[i]; const it = deltaInterpreta(d);
          return `<div class="data-row"><dt>E${i+1} · ${n}</dt><dd style="color:${it.c};font-weight:700">${fmtDelta(d)} · ${it.t}${d<=ALERTA_DELTA?" ⚠ alerta":""}</dd></div>`; }).join("") +
        `<div class="data-row"><dt><b>Δ total</b></dt><dd style="color:${itT.c};font-weight:800">${fmtDelta(pr.deltas.total)} · ${itT.t}</dd></div>`;
    } else {
      deltasHtml = `<div class="review-note">Delta B−A no calculado: el Protocolo A no estaba firmado al firmar el B (constancia en HCE-LOG).</div>`;
    }
  }
  const body = `<div class="section-label">${inf.tit} — Escala IPPU-TEA (firmado)</div>
    <div class="data-row"><dt>Fecha de aplicación</dt><dd>${pr.fecha?fmtFecha(pr.fecha):"—"}</dd></div>
    <div class="data-row"><dt>Semanas de asistencia</dt><dd>${pr.semanas||"—"}</dd></div>
    ${filas}
    <div class="data-row"><dt><b>Total IPPU-TEA</b></dt><dd><b>${t.total} / 120</b></dd></div>
    ${deltasHtml}
    <div class="section-label">Síntesis — Técnico 1 (Psicólogo/a)</div><p style="font-size:.83rem;color:var(--ink)">${pr.sintTec1||"—"}</p>
    <div class="section-label">Síntesis — Técnico 2 (Maestro/a)</div><p style="font-size:.83rem;color:var(--ink)">${pr.sintTec2||"—"}</p>
    ${pr.otros?`<div class="section-label">Otras valoraciones profesionales</div><p style="font-size:.83rem;color:var(--ink)">${pr.otros}</p>`:""}
    ${key==="pb"&&pr.ajustes?`<div class="section-label">Ajustes introducidos durante el año</div><p style="font-size:.83rem;color:var(--ink)">${pr.ajustes}</p>`:""}
    <div class="review-note">Escala de progreso propia de IPPU — <b>no homologable con el IDEA</b>: nunca se comparan puntajes ni se superponen perfiles entre ambos instrumentos (§5.2).</div>
    ${pr.addendas.length?`<div class="section-label">Addendas</div>${pr.addendas.map(x=>`<div class="data-row"><dt>${fmtFecha(x.fecha)}</dt><dd style="text-align:left">${x.texto}</dd></div>`).join("")}`:""}`;
  const foot = `<span class="left">${inf.code} · firmas: ${pr.firmas.map(x=>x.profesional).join(" · ")||"—"}</span><button class="btn btn-ghost" onclick="closeFlujoModal()">Cerrar</button>`;
  openFlujoModal(`${inf.code} — Escala IPPU-TEA`, `${nna.nombre} ${nna.apellido} · Expediente #${nna.id}`, body, foot);
}

/* --- Render del panel de flujo (se inyecta en el expediente) --------- */
function estadoBadgeM(st){
  const m = {firmado:["mb-firmado","Firmado"], borrador:["mb-borrador","Borrador"], bloqueado:["mb-bloqueado","Bloqueado"]};
  const [c,t] = m[st]||["mb-bloqueado",st]; return `<span class="mbadge ${c}">${t}</span>`;
}
function stepperHtml(nna){
  return `<div class="flujo-stepper">${MODULOS_FLUJO.map(m=>{
    const st = estadoModulo(nna, m.key);
    const exc = !!nna.flujo[m.key].excepcion;
    const dot = st==="firmado" ? "✓" : (st==="borrador" ? "●" : "🔒");
    return `<div class="fstep s-${st}${exc?" exc":""}"><span class="fdot">${dot}</span><span class="fname">${m.code}</span>${exc?'<span class="fexc">⚠ excep.</span>':""}</div>`;
  }).join("")}</div>`;
}
function flujoBodyHtml(nna){
  const rows = MODULOS_FLUJO.map(m=>{
    const f = nna.flujo[m.key];
    const st = estadoModulo(nna, m.key);
    const h = moduloHabilitado(nna, m.key);
    let meta, actions;
    if(st==="firmado"){
      const fecha = f.firmas[0] ? f.firmas[0].fecha : "";
      meta = `Firmado ${fmtFecha(fecha)} · ${f.firmas.map(x=>x.profesional).join(" · ")}${f.addendas.length?` · ${f.addendas.length} addenda(s)`:""}`;
      if(m.key==="ic") meta += f.recibi ? ` · Recibí de la familia: ${fmtFecha(f.recibi.fecha)}` : ` · Recibí de la familia PENDIENTE`;
      const verBtn = m.key==="ci" ? `<button class="btn btn-ghost btn-mini" onclick="verCI(${nna.id})">Ver</button>`
                   : m.key==="lb" ? `<button class="btn btn-ghost btn-mini" onclick="verLB(${nna.id})">Ver</button>`
                   : (m.key==="pa"||m.key==="pb") ? `<button class="btn btn-ghost btn-mini" onclick="verProt(${nna.id},'${m.key}')">Ver</button>`
                   : m.key==="ic" ? `<button class="btn btn-ghost btn-mini" onclick="generarInforme(${nna.id})">Ver informe</button>` : "";
      const recibiBtn = (m.key==="ic" && !f.recibi) ? `<button class="btn btn-ghost btn-mini" style="color:var(--warn)" onclick="openRecibiModal(${nna.id})">✍ Recibí</button>` : "";
      actions = `${verBtn}${recibiBtn}<button class="btn btn-ghost btn-mini" onclick="addendaModulo(${nna.id},'${m.key}')">+ Addenda</button>`;
    } else if(st==="borrador"){
      meta = f.excepcion ? `Habilitado excepcionalmente — ${f.excepcion.motivo}` : "En borrador · editable";
      const editar = m.key==="lb"
        ? `<button class="btn btn-ghost btn-mini" onclick="irAEval('idea', ${nna.id})">✎ Editar IDEA</button>`
        : (m.key==="pa"||m.key==="pb")
        ? `<button class="btn btn-ghost btn-mini" onclick="irAEval('${m.key}', ${nna.id})">✎ Editar Protocolo ${m.key==="pa"?"A":"B"}</button>`
        : m.key==="ic"
        ? `<button class="btn btn-ghost btn-mini" onclick="irAEval('ic', ${nna.id})">✎ Editar Informe</button>`
        : `<button class="btn btn-ghost btn-mini" disabled title="El CI se completa al firmar">✎ Editar</button>`;
      actions = `${editar}<button class="btn btn-primary btn-mini" style="background:var(--ok)" onclick="firmarModulo(${nna.id},'${m.key}')">Firmar</button>`;
    } else {
      meta = h.motivoBloqueo;
      actions = h.exceptuable
        ? `<button class="btn btn-ghost btn-mini" style="color:var(--warn)" onclick="habilitarExcepcional(${nna.id},'${m.key}')">⚠ Habilitar excep.</button>`
        : `<button class="btn btn-ghost btn-mini" disabled title="${h.motivoBloqueo}">🔒 Bloqueado</button>`;
    }
    const excTag = f.excepcion ? `<span class="fr-exc-tag" title="${f.excepcion.texto}"> · ⚠ excepción</span>` : "";
    return `<div class="flujo-row">
      <span class="fr-code">${m.code}</span>
      <div class="fr-name">${m.name} ${estadoBadgeM(st)}${excTag}<div class="fr-meta">${meta}</div></div>
      <div class="fr-actions">${actions}</div>
    </div>`;
  }).join("");
  return stepperHtml(nna) + rows;
}
function flujoPanelHtml(nna){
  return `<div class="flujo-card">
    <h3><span class="ic">⚑</span> Flujo de módulos (HCE) · CI → LB → PA → PB → IC
      <span class="spacer"></span>
      <button class="btn btn-ghost btn-mini" onclick="verHceLog(${nna.id})">☰ Ver auditoría (HCE-LOG)</button>
    </h3>
    <div class="flujo-body" id="flujoPanelBody">${flujoBodyHtml(nna)}</div>
  </div>`;
}
function renderFlujo(id){
  const nna = NNA.find(n=>n.id===id);
  const el = document.getElementById("flujoPanelBody");
  if(nna && el) el.innerHTML = flujoBodyHtml(nna);
}

/* --- Inicialización + seed de los 4 arquetipos del §11 --------------- */
/* Backfill de campos HCE-00 (M2): CIE-11 y dos técnicos responsables con rol fijo (§0.5). */
const CIE_SEED = {101:"6A02.0",102:"6A02.1",103:"6A02.2",104:"6A02.Z",105:"6A02.0",106:"6A02.3",107:"6A02.Z",108:"6A02.0"};
NNA.forEach(n=>{
  n.flujo = initFlujo(); n.hceLog = [];
  n.docs = []; n.fotos = []; n.autImagen = {registrada:false, fecha:"", adjunto:""};   // HCE-DOC (M7)
  n.inau = {sipi:"", convenio:"", referente:"", ingreso:"", obs:"", envios:[]};        // HCE-ORG (M8)
  n.bps  = {prestacion:"", tramite:"", estado:"", vencimiento:"", obs:"", gestiones:[]};
  n.vf = {estado:"No iniciado", fecha:"", organismo:"", pct:"", vigencia:"", rnpcd:"", // HCE-VF (M9)
    dominios:{comunicacion:"",autocuidado:"",movilidad:"",aprendizaje:"",interacciones:"",comunidad:""},
    capacidades:"", barreras:"", apoyos:"", obs:"", sintesisFuncional:""};
  if(!n.cie11) n.cie11 = (CIE_SEED[n.id]||"6A02.Z") + " — Trastorno del espectro del autismo";
  if(!n.tecnico1){ n.tecnico1 = (n.tecnico||"Dr. González — Psicología").split("—")[0].trim(); n.tecnico1_rol = "Psicólogo/a"; }
  if(!n.tecnico2){ n.tecnico2 = "Mtra. Torres"; n.tecnico2_rol = "Maestro/a"; }
});
(function seedFlujo(){
  const byId = id => NNA.find(n=>n.id===id);
  const dobles = fecha => TECNICOS.map(t=>({...t, fecha}));
  function seedFirma(nna, key, fecha, firmas, detalle){
    if(!nna) return;
    nna.flujo[key].firmado = true;
    nna.flujo[key].firmas = firmas;
    nna.hceLog.push({ts:fmtFecha(fecha)+" · 10:00", usuario:firmas[0].profesional, modulo:key, tipo:"firma", detalle});
  }
  const fam = (nna,fecha) => [{profesional:nna.referente||"Familia", rol:"Familia/referente", fecha}];
  function seedCI(nna, fecha){                     // CI firmado + autorizaciones + adjunto (M3)
    if(!nna) return;
    seedFirma(nna,"ci",fecha,fam(nna,fecha),"Consentimiento informado firmado por la familia.");
    nna.flujo.ci.autorizaciones = {evaluacion:true, registro:true, comunicacion:true};
    nna.flujo.ci.adjunto = "consentimiento_"+fecha.slice(0,4)+".pdf";
  }
  function setLB(nna, o){ if(nna) Object.assign(nna.flujo.lb, o); }   // payload IDEA / línea base (M4)
  function setProt(nna, key, o){ if(nna) Object.assign(nna.flujo[key], o); }   // payload PA/PB · IPPU-TEA (M5)
  function setIC(nna, o){ if(nna) Object.assign(nna.flujo.ic, o); }            // payload IC · Informe de Cierre (M6)

  // Arquetipo 1 — Martín (102): ciclo completo firmado. IDEA = usuario demo 1 del prototipo (total 58/96).
  const a1 = byId(102);
  if(a1){
    seedCI(a1,"2026-03-02");
    setLB(a1, {dim:[6,6,6, 6,4,4, 4,6,4, 4,4,4], fecha:"2026-03-18", sesiones:6,
      sintesis:"Evaluación realizada tras 6 sesiones de observación en contexto grupal. Mayor afectación en Relación Social (18/24) y Comunicación (14/24). Perfil orientativo de nivel de soporte 2 (DSM-5-TR). Referencia conjunta muy limitada; lenguaje expresivo reducido a palabras sueltas con ecolalia frecuente.",
      objetivos:"1) Incrementar la atención conjunta con apoyo gestual. 2) Introducir un sistema aumentativo de comunicación acorde a la Escala de Comunicación. 3) Anticipación visual de las rutinas del grupo."});
    a1.flujo.lb.obs[1] = "Diferencia inicial entre evaluadores (6 vs 4); consenso en 6 por observaciones de la sesión grupal.";
    seedFirma(a1,"lb","2026-03-18",dobles("2026-03-18"),"Línea base IDEA firmada (firma doble) — total 58/96.");
    setProt(a1,"pa",{item:[3,3,3,2,3,2, 3,3,2,3,2,2, 3,2,3,2,3,3, 2,3,2,2,2,2], fecha:"2026-07-07", semanas:16,
      sintTec1:"Emergencia clara de atención conjunta con apoyo. El sistema aumentativo de comunicación se consolidó en sesión.",
      sintTec2:"Mayor permanencia en actividades estructuradas. Barreras: transiciones y trabajo en pequeño grupo.",
      otros:"Fonoaudiología: buena respuesta al apoyo gestual (ítems E2-4 y E2-6)."});
    a1.flujo.pa.obs[0]="Contacto visual emergente en saludo y pedido, sólo con apoyo verbal del adulto.";
    seedFirma(a1,"pa","2026-07-07",dobles("2026-07-07"),"Protocolo A firmado (firma doble) — total 60/120.");
    setProt(a1,"pb",{item:[4,3,4,3,3,3, 4,4,3,4,3,3, 3,3,3,3,4,4, 3,4,3,3,3,2], fecha:"2026-12-11", semanas:17,
      sintTec1:"Generalización parcial de la comunicación al hogar. Atención conjunta consistente en sesión.",
      sintTec2:"Participa de rutinas grupales completas. Ajustes: apoyos visuales en todas las consignas.",
      otros:"Psicomotricidad: mejora en regulación ante estímulos sonoros.",
      ajustes:"Agenda visual individual (agosto); trabajo de a dos con un par tolerado (octubre).",
      deltas:{esc:[4,6,4,5], total:19}});
    seedFirma(a1,"pb","2026-12-11",dobles("2026-12-11"),"Protocolo B firmado (firma doble) — total 79/120, Δ total +19.");
    setIC(a1, {fecha:"2026-12-19",
      sintEsc:[
        "Progreso moderado y sostenido en la relación social (Δ +4). La atención conjunta pasó de emergente a consistente en contextos estructurados. La interacción espontánea con pares sigue siendo el principal desafío para el próximo año.",
        "Área de mayor progreso del año (Δ +6). El sistema aumentativo de comunicación se consolidó y comienza a generalizarse al hogar (ítems 7 y 10). Se recomienda ampliar su alcance funcional el próximo año.",
        "Progreso moderado (Δ +4). La agenda visual individual redujo significativamente las conductas de oposición ante las transiciones.",
        "Progreso leve (Δ +5 sobre una base muy descendida). La imitación mejoró de forma notable; el juego simbólico permanece incipiente."],
      valTec1:"Año de progreso clínicamente significativo, concentrado en comunicación funcional y anticipación. Se recomienda continuidad en el mismo grupo de referencia con intensificación del trabajo entre pares.",
      valTec2:"La incorporación de apoyos visuales sistemáticos fue el ajuste de mayor impacto pedagógico. Se sugiere sostenerlos y comenzar un retiro gradual en las rutinas dominadas.",
      recomendaciones:"1) Profundizar el uso funcional del sistema aumentativo de comunicación (E2). 2) Ampliar las oportunidades de juego compartido con pares (E4). 3) Retiro gradual de apoyos en rutinas consolidadas (E3). 4) Mantener la coordinación con la escuela y el acompañante.",
      orientaciones:"Sostener la agenda visual en el hogar. Ofrecer oportunidades de pedido con el sistema de comunicación que utiliza, en situaciones cotidianas (merienda, juego). Anticipar verbal y visualmente los cambios de rutina del fin de semana.",
      recibi:{firmante:a1.referente||"Familia", fecha:"2026-12-19"}});
    seedFirma(a1,"ic","2026-12-19",dobles("2026-12-19"),"Informe de Cierre Anual firmado (firma doble) + Recibí de la familia.");
  }
  // Arquetipo 2 — Sofía (101): CI y LB firmados; Protocolo A en borrador. IDEA = usuario demo 2 (total 31/96).
  const a2 = byId(101);
  if(a2){
    seedCI(a2,"2026-03-05");
    setLB(a2, {dim:[4,2,4, 2,2,2, 4,4,2, 2,1,2], fecha:"2026-03-20", sesiones:5,
      sintesis:"Perfil leve (total 31/96). Mayor afectación relativa en flexibilidad y en la relación con pares. Lenguaje formal preservado con dificultades pragmáticas claras. Nivel de soporte orientativo: 1.",
      objetivos:"1) Habilidades conversacionales con pares (inicio y cierre). 2) Tolerancia a cambios de plan. 3) Identificación y expresión de emociones propias."});
    seedFirma(a2,"lb","2026-03-20",dobles("2026-03-20"),"Línea base IDEA firmada (firma doble) — total 31/96.");
    setProt(a2,"pa",{item:[3,4,3,3,3,4, 4,4,3,3,3,3, 3,3,3,4,3,3, 4,3,3,4,3,3], fecha:"", semanas:16, sintTec1:"", sintTec2:"", otros:""});
  }
  // Arquetipo 3 — Joaquín (104): CI firmado; LB (IDEA) en BORRADOR con dimensiones NS. = usuario demo 3.
  seedCI(byId(104),"2026-06-10");
  setLB(byId(104), {dim:[8,8,"NS", 8,8,6, 6,6,8, 8,6,"NS"], fecha:"", sesiones:5, sintesis:"", objetivos:""});
  if(byId(104)) byId(104).flujo.lb.obs[2] = "NS: se requiere más observación en juego compartido antes de puntuar D3.";
  // Arquetipo 4 — Bruno (107): consentimiento pendiente → todo bloqueado (estado por defecto de initFlujo).

  // Otros NNA: CI + LB firmados, con IDEA generado consistente con su total previo, para dar variedad.
  const LB_OTROS = {103:[6,4,6, 4,6,4, 4,6,4, 4,4,3], 105:[4,4,4, 4,4,4, 4,4,4, 4,4,3], 108:[4,4,4, 4,4,4, 4,4,4, 2,4,2]};
  [103,105,108].forEach(id=>{
    const p = byId(id); if(!p) return;
    seedCI(p,"2026-03-10");
    setLB(p, {dim:LB_OTROS[id], fecha:"2026-03-25", sesiones:5,
      sintesis:"Línea base IDEA de referencia (datos de demostración).", objetivos:"Objetivos del período a definir con el equipo."});
    seedFirma(p,"lb","2026-03-25",dobles("2026-03-25"),"Línea base IDEA firmada (firma doble).");
  });

  /* --- M7 · HCE-DOC: autorización de imagen + documentos seed. -------------
     Resolución formal del descarte de M0 (decisión §0.2): los registros de
     "Eval. por áreas" y "Eval. General" del sistema anterior entran como
     ARCHIVO HISTÓRICO de solo lectura, con categoría específica y fecha
     original (§10 Documento Técnico) — nunca mapeados a campos estructurados. */
  const HIST = (nombre, sub, fechaOrig) =>
    ({nombre, cat:`Registro histórico — HCE anterior (${sub})`, fechaOrig, fechaCarga:"2026-07-20", historico:true});
  function setAutImagen(id, fecha){
    const p = byId(id); if(!p) return;
    p.autImagen = {registrada:true, fecha, adjunto:"autorizacion_imagen_"+fecha.slice(0,4)+".pdf"};
    p.docs.push({nombre:p.autImagen.adjunto, cat:"Autorización / consentimiento", fechaOrig:fecha, fechaCarga:fecha, historico:false});
  }
  setAutImagen(102,"2026-03-05");                       // Martín: fotos habilitadas
  if(byId(102)){
    byId(102).docs.push(
      {nombre:"Informe neuropediátrico 2025 (externo).pdf", cat:"Informe médico externo", fechaOrig:"2025-11-03", fechaCarga:"2026-03-10", historico:false},
      HIST("Evaluación por áreas 2025 — export certificada.pdf","Evaluación por áreas","2025-11-20"),
      HIST("Evaluación General 2025 — export certificada.pdf","Evaluación General","2025-11-27"));
    byId(102).fotos.push({desc:"Actividad de juego estructurado (taller)", fecha:"2026-05-12"});
  }
  // Sofía (101): SIN autorización de imagen registrada — caso negativo de §8.4.
  if(byId(101)) byId(101).docs.push(HIST("Evaluación General 2025 — export certificada.pdf","Evaluación General","2025-11-25"));
  if(byId(103)) byId(103).docs.push(HIST("Observaciones 2024–2025 — export certificada.pdf","Observaciones","2025-12-01"));
  setAutImagen(103,"2026-03-12");

  /* --- M8 · HCE-ORG: áreas INAU y BPS seed. ------------------------------- */
  if(byId(102)){
    Object.assign(byId(102).inau, {sipi:"SIPI 123.456", convenio:"Convenio INAU — Atención Diurna TEA",
      referente:"Lic. R. Martínez (INAU Este)", ingreso:"2023-03-01",
      obs:"Situación estable. Coordinaciones semestrales con el referente territorial.",
      envios:[{fecha:"2026-07-20", txt:"Informe semestral enviado (síntesis del Protocolo A)"},
              {fecha:"2026-12-22", txt:"Informe de Cierre Anual 2026 enviado (documento único HCE-IC)"}]});
    Object.assign(byId(102).bps, {prestacion:"Ayuda Extraordinaria (AYEX) — instituto habilitado",
      tramite:"EXP-2026-0412", estado:"Vigente", vencimiento:"2027-03-31",
      obs:"Renovación anual. Constancia de asistencia emitida en abril.",
      gestiones:[{fecha:"2026-04-10", txt:"Constancia de asistencia emitida para renovación de AYEX"}]});
  }
  if(byId(101)) Object.assign(byId(101).bps, {prestacion:"Ayuda Extraordinaria (AYEX)",
    tramite:"EXP-2026-1188", estado:"En trámite", vencimiento:"",
    obs:"Documentación presentada; a la espera de resolución.", gestiones:[
      {fecha:"2026-06-02", txt:"Presentación de solicitud AYEX con informe de ingreso"}]});
  if(byId(104)) Object.assign(byId(104).inau, {sipi:"SIPI 987.654", convenio:"Derivación CAIF → Convenio INAU",
    referente:"Lic. P. Suárez (INAU Oeste)", ingreso:"2026-06-10",
    obs:"Ingreso reciente. Coordinar informe de ingreso con el referente.", envios:[]});

  /* --- M9 · HCE-VF: valoración funcional seed. -----------------------------
     El % y la categoría provienen SIEMPRE de la valoración oficial (BUND),
     nunca de los puntajes clínicos (§7.5). Martín completo · Sofía parcial. */
  if(byId(102)) Object.assign(byId(102).vf, {
    estado:"Valorado", fecha:"2026-05-14", organismo:"Equipo valorador BPS (BUND)", pct:"58",
    vigencia:"2028-05-14", rnpcd:"RNPcD-10452",
    dominios:{comunicacion:"Apoyo frecuente", autocuidado:"Apoyo ocasional", movilidad:"Autónomo",
      aprendizaje:"Apoyo frecuente", interacciones:"Apoyo frecuente", comunidad:"Apoyo permanente"},
    capacidades:"Disfruta de la música y de las actividades con agua. Reconoce rutinas visuales y anticipa actividades preferidas. Vínculo afectivo sólido con su madre y su hermana; busca al adulto de referencia para pedir ayuda.",
    barreras:"Entornos ruidosos y con mucha gente le generan malestar. La escuela aún no cuenta con apoyos visuales sistemáticos en todos los espacios.",
    apoyos:"Agenda visual individual (hogar y IPPU). Acompañante terapéutico escolar 3 veces por semana. Sistema aumentativo de comunicación en consolidación.",
    obs:"La familia consultó por la renovación de la AYEX (se sigue en HCE-ORG).",
    sintesisFuncional:""});
  if(byId(101)) Object.assign(byId(101).vf, {
    estado:"En trámite", fecha:"", organismo:"", pct:"", vigencia:"", rnpcd:"",
    dominios:{comunicacion:"Autónomo", autocuidado:"Autónomo", movilidad:"", aprendizaje:"", interacciones:"Apoyo ocasional", comunidad:""},
    capacidades:"Lenguaje oral fluido; le gusta conversar sobre sus intereses. Buena memoria y disposición para las actividades estructuradas.",
    barreras:"", apoyos:"", obs:"", sintesisFuncional:""});
})();

/* Helpers de historial → derivan el estado de evaluaciones desde el historial */
function getEval(nna, periodoKey){
  // periodoKey: "inicial" | "lik" | "final"
  if(periodoKey==="lik") return nna.historial.find(h=>h.tipo==="lik");
  if(periodoKey==="final") return nna.historial.find(h=>h.tipo==="idea" && h.titulo.includes("final"));
  return nna.historial.find(h=>h.tipo==="idea" && h.titulo.includes("inicial"));
}
function edadDesde(fechaNac){
  if(!fechaNac) return "—";
  const n=new Date(fechaNac), h=new Date("2026-06-10");
  let e=h.getFullYear()-n.getFullYear();
  if(h.getMonth()<n.getMonth()||(h.getMonth()===n.getMonth()&&h.getDate()<n.getDate())) e--;
  return e;
}

