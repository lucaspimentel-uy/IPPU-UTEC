/* M1 - Motor de flujo de la demo de EJEMPLO: estado, firma, addenda + HCE-LOG.
   Demo L1 HCE+IDEA - IPPU x UTEC-LIDIA.
   Fase 3-c (handoff §5.125): ningun modulo se bloquea ni por CI ni por secuencia (§5.94, §5.95) y ya no hay
   «habilitacion excepcional». LB, PA y PB se editan y firman SOLO contra la API (evaluaciones.js); aca queda
   el expediente de ejemplo (datos de datos.js, ids 101-108). Fase 3-d (§5.126): el IC y la VF tambien se conectaron, y el ejemplo ya no los ofrece.
   Los scripts se cargan en orden en index.html: el orden ES la semantica. */
/* =================================================================
   M1 · MOTOR DE FLUJO DE EJEMPLO (estado · firma · addenda)
   Documento Técnico IPPU §3.2 (HCE-LOG) y §4 (flujo guiado, no impuesto).
   Secuencia sugerida: CI → LB → PA → PB → IC. Estados derivados: borrador | firmado (nunca «bloqueado»).
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

/* Objeto de flujo por defecto: todo en borrador, nada bloqueado. */
function initFlujo(){
  const mk = () => ({firmado:false, firmas:[], addendas:[]});
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

/* --- Secuencia (§5.94, §5.95): la secuencia sólo AVISA; nada se bloquea ni por CI ni por el eslabón anterior. ---
   Se conserva el nombre porque lo llaman las vistas de ejemplo; siempre está habilitado. */
function moduloHabilitado(nna, key){
  return {habilitado:true};
}

/* Estado visible DERIVADO (nunca se almacena → sin drift): firmado | borrador. */
function estadoModulo(nna, key){
  return nna.flujo[key].firmado ? "firmado" : "borrador";
}

/* Ningun modulo se valida en el navegador: LB, PA, PB e IC devuelven un 422 con el detalle por campo (API).
   Se conserva el nombre porque lo llama firmarModulo() del flujo de ejemplo. */
function validarIntegridad(nna, key){
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
  const v = validarIntegridad(nna, key);
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
  closeFlujoModal(); renderFlujo(id);
  if(typeof renderNNA==="function") renderNNA();
  toast(`${modInfo(key).full} firmado: ya no se edita, se corrige por addenda.`);
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
/* Dialogo modal accesible (Fase 3-d, §5.126; lo usa el «recibí» del IC conectado y los modales del expediente de ejemplo):
   role="dialog" + aria-modal en index.html; la app de atras queda inerte, el foco entra al primer campo (o al titulo),
   Tab no sale del dialogo, Esc lo cierra (recordatorios.js) y el foco vuelve a quien lo abrio. */
let FLUJO_MODAL_OPENER = null, FLUJO_MODAL_OPENER_ID = "", FLUJO_MODAL_ANCLA = null, FLUJO_MODAL_SNAP = "", FLUJO_MODAL_TOCADO = false;
function openFlujoModal(title, sub, bodyHtml, footHtml){
  const m = document.getElementById("modalFlujo");
  document.getElementById("mfTitle").textContent = title;
  document.getElementById("mfSub").textContent = sub;
  document.getElementById("mfBody").innerHTML = bodyHtml;
  document.getElementById("mfFoot").innerHTML = footHtml;
  if(!m.classList.contains("open")){
    FLUJO_MODAL_OPENER = document.activeElement;
    FLUJO_MODAL_OPENER_ID = (FLUJO_MODAL_OPENER && FLUJO_MODAL_OPENER.id) || "";
    FLUJO_MODAL_ANCLA = FLUJO_MODAL_OPENER && FLUJO_MODAL_OPENER.closest ? FLUJO_MODAL_OPENER.closest(".card,.info-card,.flujo-card,section") : null;
  }
  FLUJO_MODAL_SNAP = fotoCampos(document.getElementById("mfBody")); FLUJO_MODAL_TOCADO = false;   // lo precargado no cuenta como tipeado
  m.classList.add("open");
  appInerte(true);
  setTimeout(() => {
    if(!m.classList.contains("open")) return;
    const primero = document.querySelector("#mfBody input:not([type=hidden]), #mfBody textarea, #mfBody select");
    (primero || document.getElementById("mfTitle")).focus();
  }, 0);
}
/* sinFoco: el cierre es por cerrar la sesion (el foco va al login, no a quien abrio el dialogo). */
function closeFlujoModal(sinFoco){
  const m = document.getElementById("modalFlujo");
  if(!m.classList.contains("open")) return;          // Esc lo llama aunque no este abierto
  m.classList.remove("open");
  const cd = m.querySelector(".confirmar-descarte"); if(cd) cd.remove();
  appInerte(false);
  const o = FLUJO_MODAL_OPENER, oid = FLUJO_MODAL_OPENER_ID, ancla = FLUJO_MODAL_ANCLA;
  FLUJO_MODAL_OPENER = null; FLUJO_MODAL_OPENER_ID = ""; FLUJO_MODAL_ANCLA = null;
  if(sinFoco) return;
  if(o && document.contains(o)){ try{ o.focus(); }catch(_e){ /* nada */ } }
  /* Quien llama cierra y despues vuelve a pintar: si quien abrio ya no existe (o se pierde el foco en el repintado), el
     foco no se queda en <body>: pasa al mismo control si reaparece, o al encabezado de su tarjeta / del expediente. */
  setTimeout(() => focoEstableTrasDialogo(oid, ancla), 0);
}
/* Cierre pedido por la persona (×, Cancelar, Esc): con datos tipeados pide confirmación (Fase 3-e). Los cierres por programa
   (guardado correcto, 409, «Salir», 401) llaman a closeFlujoModal() y NO preguntan. */
function flujoModalHayCambios(){ return FLUJO_MODAL_TOCADO && fotoCampos(document.getElementById("mfBody")) !== FLUJO_MODAL_SNAP; }
function cerrarFlujoModalUsuario(){
  const m = document.getElementById("modalFlujo");
  if(!m.classList.contains("open")) return;
  if(descarteAbierto(m)){ m.querySelector("#btnCdSeguir").click(); return; }
  if(flujoModalHayCambios()){
    pedirDescarte(m, () => { closeFlujoModal(); vaciarCampos(document.getElementById("mfBody")); });
    return;
  }
  closeFlujoModal();
}
function focoEstableTrasDialogo(oid, ancla){
  if(document.querySelector(".modal-bg.open")) return;
  /* El diálogo recién cerrado todavía puede figurar como elemento activo (el navegador corrige el foco recién en el próximo
     cuadro): un activo que ya no se ve está perdido igual que <body>. */
  const a = document.activeElement;
  if(a && a !== document.body && a !== document.documentElement && a.offsetParent !== null) return;
  const visible = el => el && el.offsetParent !== null;
  let dest = oid ? document.getElementById(oid) : null;
  if(!visible(dest)) dest = ancla && document.contains(ancla) ? ancla.querySelector("h1,h2,h3,.section-label") : null;
  if(!visible(dest)) dest = document.querySelector("#icTitulo, #infTitulo, #expTitulo, .view.active h1, .view.active h2");
  if(!dest) return;
  if(!dest.hasAttribute("tabindex")) dest.setAttribute("tabindex", "-1");
  dest.focus();
}
document.getElementById("modalFlujo").addEventListener("keydown", e => atraparTab(e, document.getElementById("modalFlujo"), "mfTitle"));
["input", "change"].forEach(t => document.getElementById("modalFlujo").addEventListener(t, () => { FLUJO_MODAL_TOCADO = true; }));
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
       <div class="review-note">El consentimiento es un estado visible del expediente: no bloquea ningún módulo (§5.94).</div>`
    : `<div class="section-label">Firma doble de técnicos responsables (§3.1)</div>
       ${TECNICOS.map(t=>`<div class="data-row"><dt>${t.rol}</dt><dd>${t.profesional}</dd></div>`).join("")}
       <div class="field" style="margin-top:12px"><label>Fecha de consenso</label><input id="mfFecha" type="date" value="${HOY}"></div>
       <div class="review-note">⚠ La firma bloquea el módulo: después sólo se corrige por addenda.</div>`;
  const foot = `<span class="left">${m.full} · ${m.name}</span>
    <div style="display:flex;gap:10px">
      <button class="btn btn-ghost" onclick="cerrarFlujoModalUsuario()">Cancelar</button>
      <button class="btn btn-firmar" onclick="confirmarFirma(${id},'${key}')">✓ Firmar y bloquear</button>
    </div>`;
  openFlujoModal(`Firmar ${m.full}`, `${nna.nombre} ${nna.apellido} · Expediente #${nna.id}`, body, foot);
}
function openAddendaModal(id, key){
  const nna = NNA.find(n=>n.id===id); const m = modInfo(key);
  const body = `<div class="section-label">Addenda a módulo firmado (§4.1)</div>
    <p style="font-size:.8rem;color:var(--ink-2);margin-bottom:12px">El módulo firmado no se edita. La corrección se agrega como addenda con fecha y profesional.</p>
    <div class="field"><label>Corrección / justificación</label><textarea id="mfTexto" placeholder="Texto de la addenda."></textarea></div>`;
  const foot = `<span class="left">${m.full} · ${nna.flujo[key].addendas.length} addenda(s) previa(s)</span>
    <div style="display:flex;gap:10px">
      <button class="btn btn-ghost" onclick="cerrarFlujoModalUsuario()">Cancelar</button>
      <button class="btn btn-primary" style="background:var(--teal)" onclick="confirmarAddenda(${id},'${key}')">+ Agregar addenda</button>
    </div>`;
  openFlujoModal(`Addenda · ${m.full}`, `${nna.nombre} ${nna.apellido} · Expediente #${nna.id}`, body, foot);
}
function verHceLog(id){
  const nna = NNA.find(n=>n.id===id);
  const evs = [...nna.hceLog].reverse();          // más reciente primero (orden de inserción)
  const tag = {firma:["lt-firma","Firma"], addenda:["lt-addenda","Addenda"], edicion:["lt-edicion","Edición"], alerta:["lt-alerta","Alerta"]};
  const body = evs.length
    ? `<table class="log-table"><thead><tr><th>Fecha y hora</th><th>Usuario</th><th>Módulo</th><th>Tipo</th><th>Detalle</th></tr></thead><tbody>
        ${evs.map(e=>{ const [c,t]=tag[e.tipo]||["lt-edicion",e.tipo]; const mod=moduloLabel(e.modulo);
          return `<tr><td style="white-space:nowrap">${e.ts}</td><td>${e.usuario}</td><td><b>${mod}</b></td><td><span class="log-tipo ${c}">${t}</span></td><td>${e.detalle}</td></tr>`;}).join("")}
       </tbody></table>`
    : `<p style="color:var(--ink-2);font-size:.85rem;padding:8px 0">Sin eventos de auditoría todavía.</p>`;
  const foot = `<span class="left">HCE-LOG · registro de solo lectura e inalterable (§3.2 · demo, no persistente)</span>
    <button class="btn btn-ghost" onclick="closeFlujoModal()">Cerrar</button>`;
  openFlujoModal(`HCE-LOG — ${nna.nombre} ${nna.apellido}`, "Auditoría: firmas y addendas", body, foot);
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
  const foot = `<span class="left">HCE-CI · consentimiento informado</span><button class="btn btn-ghost" onclick="closeFlujoModal()">Cerrar</button>`;
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
    <div class="data-row"><dt><b>Total IDEA</b></dt><dd><b>${t.total} / 96</b> · <b>${bandaIdea(t.total)}</b></dd></div>
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
          return `<div class="data-row"><dt>E${i+1} · ${n}</dt><dd style="font-weight:700">${fmtDelta(d)} · ${it.t}${d<=ALERTA_DELTA?" ⚠ alerta":""}</dd></div>`; }).join("") +
        `<div class="data-row"><dt><b>Δ total</b></dt><dd style="font-weight:800">${fmtDelta(pr.deltas.total)} · ${itT.t}</dd></div>`;
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
  const m = {firmado:["mb-firmado","Firmado"], borrador:["mb-borrador","Borrador"]};
  const [c,t] = m[st]||["mb-borrador",st]; return `<span class="mbadge ${c}">${t}</span>`;
}
function stepperHtml(nna){
  return `<div class="flujo-stepper">${MODULOS_FLUJO.map(m=>{
    const st = estadoModulo(nna, m.key);
    const dot = st==="firmado" ? "✓" : "●";
    return `<div class="fstep s-${st}"><span class="fdot">${dot}</span><span class="fname">${m.code}</span></div>`;
  }).join("")}</div>`;
}
function flujoBodyHtml(nna){
  const rows = MODULOS_FLUJO.map(m=>{
    const f = nna.flujo[m.key];
    const st = estadoModulo(nna, m.key);
    let meta, actions;
    if(st==="firmado"){
      const fecha = f.firmas[0] ? f.firmas[0].fecha : "";
      meta = `Firmado ${fmtFecha(fecha)} · ${f.firmas.map(x=>x.profesional).join(" · ")}${f.addendas.length?` · ${f.addendas.length} addenda(s)`:""}`;
      if(m.key==="ic") meta += f.recibi ? ` · Recibí de la familia: ${fmtFecha(f.recibi.fecha)}` : ` · Recibí de la familia PENDIENTE`;
      const verBtn = m.key==="ci" ? `<button class="btn btn-ghost btn-mini" onclick="verCI(${nna.id})">Ver</button>`
                   : m.key==="lb" ? `<button class="btn btn-ghost btn-mini" onclick="verLB(${nna.id})">Ver</button>`
                   : (m.key==="pa"||m.key==="pb") ? `<button class="btn btn-ghost btn-mini" onclick="verProt(${nna.id},'${m.key}')">Ver</button>` : "";
      actions = `${verBtn}<button class="btn btn-ghost btn-mini" onclick="addendaModulo(${nna.id},'${m.key}')">+ Addenda</button>`;
    } else {
      meta = "En borrador · editable";
      // LB, PA, PB e IC se editan y firman contra la API (pestañas del expediente de verdad): el de ejemplo no ofrece acciones.
      actions = "";
    }
    return `<div class="flujo-row">
      <span class="fr-code">${m.code}</span>
      <div class="fr-name">${m.name} ${estadoBadgeM(st)}<div class="fr-meta">${meta}</div></div>
      <div class="fr-actions">${actions}</div>
    </div>`;
  }).join("");
  return stepperHtml(nna) + rows;
}
function flujoPanelHtml(nna){
  return `<div class="flujo-card">
    <h3><span class="ic">⚑</span> Flujo de módulos (HCE) · CI, LB, PA, PB, IC
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
  // Arquetipo 4 — Bruno (107): consentimiento pendiente, nada iniciado (estado por defecto de initFlujo).

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

