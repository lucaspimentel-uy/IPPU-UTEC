/* M6 - HCE-IC: Informe de Cierre Anual.
   Demo L1 HCE+IDEA - IPPU x UTEC-LIDIA.
   Extraido del monolito (lineas 3130-3297) sin cambios de logica.
   Los scripts se cargan en orden en index.html: el orden ES la semantica. */
/* ===================== HCE-IC · INFORME DE CIERRE ANUAL (M6) =====================
   Integra los tres instrumentos (§5.3). Tabla comparativa y radares AUTOGENERADOS
   sólo desde los módulos firmados. Regla dura (§5.2): IDEA e IPPU-TEA nunca se
   superponen en un mismo gráfico ni generan deltas cruzados. */

/* Radar SVG propio (4 ejes = escalas). Dibuja UN instrumento por llamada:
   la no homologabilidad (§5.2) prohíbe mezclar series IDEA e IPPU-TEA. */
function radarSVG(series, size){
  size = size || 280;
  const cx=size/2, cy=size/2, R=size/2-50, N=IPPU_ESCALAS.length;
  const pt=(i,fr)=>{ const a=-Math.PI/2 + i*2*Math.PI/N; return [cx+R*fr*Math.cos(a), cy+R*fr*Math.sin(a)]; };
  let s = `<svg viewBox="0 0 ${size} ${size}" width="${size}" style="max-width:100%" role="img">`;
  for(let g=1; g<=4; g++)
    s += `<polygon points="${Array.from({length:N},(_,i)=>pt(i,g/4).join(",")).join(" ")}" fill="none" stroke="#D8E2EC" stroke-width="1"/>`;
  const cortas=[["Relación","Social"],["Comunicación","y Lenguaje"],["Anticipación","y Flexib."],["Simbolización"]];
  for(let i=0;i<N;i++){
    const [x,y]=pt(i,1); s+=`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#D8E2EC"/>`;
    const [lx0,ly]=pt(i,1.28);
    const lx = Math.min(Math.max(lx0, 38), size-38);   // que las etiquetas no se recorten en el borde
    cortas[i].forEach((t,li)=> s+=`<text x="${lx}" y="${ly-4+li*11}" font-size="9.5" font-weight="600" fill="#43596E" text-anchor="middle">${t}</text>`);
  }
  series.forEach(se=>{
    const pts = se.vals.map((v,i)=>pt(i, Math.max(.03, v/se.max)).join(",")).join(" ");
    s += `<polygon points="${pts}" fill="${se.color}22" stroke="${se.color}" stroke-width="2"/>`;
    se.vals.forEach((v,i)=>{ const [x,y]=pt(i, Math.max(.03, v/se.max)); s+=`<circle cx="${x}" cy="${y}" r="3" fill="${se.color}"/>`; });
  });
  return s+"</svg>";
}

/* Datos para tabla/radar: SOLO módulos firmados; el delta es el que calculó el motor al firmar B (M5). */
function icDatosFirmados(p){
  const fl = p.flujo;
  return {
    lb: fl.lb.firmado ? lbTotales(fl.lb.dim)    : null,
    pa: fl.pa.firmado ? protTotales(fl.pa.item) : null,
    pb: fl.pb.firmado ? protTotales(fl.pb.item) : null,
    deltas: fl.pb.firmado ? fl.pb.deltas : null,
  };
}
function icTablaHtml(p){
  const d = icDatosFirmados(p);
  const filas = IPPU_ESCALAS.map((n,i)=>{
    const dd = d.deltas ? d.deltas.esc[i] : null;
    const it = dd==null ? null : deltaInterpreta(dd);
    return `<tr><td>E${i+1} · ${n}</td>
      <td class="num">${d.lb ? d.lb.esc[i]+" / 24" : "—"}</td>
      <td class="num">${d.pa ? d.pa.esc[i]+" / 30" : "—"}</td>
      <td class="num">${d.pb ? d.pb.esc[i]+" / 30" : "—"}</td>
      <td class="num">${dd==null ? "—" : `<span style="color:${it.c};font-weight:700">${fmtDelta(dd)}${dd<=ALERTA_DELTA?" ⚠":""}</span>`}</td></tr>`;
  }).join("");
  const dT = d.deltas ? d.deltas.total : null;
  const itT = dT==null ? null : deltaInterpreta(dT);
  return `<table class="comp-table"><thead><tr><th>Escala</th><th class="num">IDEA — línea base (0–24)</th><th class="num">Protocolo A (6–30)</th><th class="num">Protocolo B (6–30)</th><th class="num">Δ B−A</th></tr></thead><tbody>
    ${filas}
    <tr><td><b>Total</b></td>
      <td class="num"><b>${d.lb ? d.lb.total+" / 96" : "—"}</b></td>
      <td class="num"><b>${d.pa ? d.pa.total+" / 120" : "—"}</b></td>
      <td class="num"><b>${d.pb ? d.pb.total+" / 120" : "—"}</b></td>
      <td class="num">${dT==null ? "—" : `<b style="color:${itT.c}">${fmtDelta(dT)} · ${itT.t}</b>`}</td></tr>
  </tbody></table>
  <div style="font-size:.74rem;color:var(--ink-2);margin-top:8px">Nota metodológica: los puntajes IDEA (severidad, 0–96) y los IPPU-TEA (progreso, 24–120) <b>no son homologables</b>; el Δ es válido únicamente entre los Protocolos A y B (§5.2). El sistema mide el progreso, no su causa.</div>`;
}
function icRadaresHtml(p){
  const d = icDatosFirmados(p);
  const bloques = [];
  if(d.lb) bloques.push(`<div class="rwrap"><div class="rcap">Perfil IDEA — línea base (severidad)</div>${radarSVG([{color:"#1B7F8C",vals:d.lb.esc,max:24}],260)}</div>`);
  const serieProt = [];
  if(d.pa) serieProt.push({color:"#C05621",vals:d.pa.esc,max:30});
  if(d.pb) serieProt.push({color:"#1B8A4C",vals:d.pb.esc,max:30});
  if(serieProt.length) bloques.push(`<div class="rwrap"><div class="rcap">Progreso IPPU-TEA (A vs. B)</div>${radarSVG(serieProt,260)}
    <div class="ic-legend">${d.pa?'<span><i style="background:#C05621"></i>Protocolo A</span>':""}${d.pb?'<span><i style="background:#1B8A4C"></i>Protocolo B</span>':""}</div></div>`);
  if(!bloques.length) return "";
  return `<div class="ic-radars">${bloques.join("")}</div>
  <div style="font-size:.72rem;color:var(--ink-2);text-align:center">Los radares se presentan por separado: los perfiles IDEA e IPPU-TEA nunca se superponen (§5.2).</div>`;
}

/* --- Editor HCE-IC (view-ic): mismo patrón que el editor PA/PB --------- */
(function buildICForm(){
  const cont = document.getElementById("icEscFields");
  if(cont) cont.innerHTML = IPPU_ESCALAS.map((n,i)=>
    `<div class="field"><label>E${i+1} · ${n} <span class="req">*</span></label><textarea id="ic_esc${i}" placeholder="Síntesis cualitativa del año en ${n} (integra la línea base IDEA y el progreso A→B)."></textarea></div>`).join("");
})();

function cargarIC(id){
  const p = NNA.find(n=>n.id===id); if(!p) return;
  const s = document.getElementById("selNNAIC"); if(s) s.value = String(id);
  const ic = p.flujo.ic;
  const st = estadoModulo(p, "ic");
  document.getElementById("icEstadoBadge").innerHTML = estadoBadgeM(st);
  document.getElementById("icAuto").innerHTML = `
    <div class="card"><div class="cardhead" style="padding:13px 18px;border-bottom:1px solid var(--line)"><h2 style="font-size:.82rem;text-transform:uppercase;letter-spacing:.04em;color:var(--ink-2)">Análisis cuantitativo — autogenerado desde los módulos firmados</h2></div>
    <div style="padding:16px 18px">${icTablaHtml(p)}${icRadaresHtml(p)}</div></div>`;
  const h = moduloHabilitado(p, "ic");
  document.getElementById("icAviso").innerHTML =
    st==="bloqueado" ? `<div class="review-note" style="margin-bottom:14px">🔒 <b>HCE-IC bloqueado:</b> ${h.motivoBloqueo}${h.exceptuable?' La habilitación excepcional se gestiona desde el panel «Flujo de módulos» del expediente.':""}</div>`
    : (ic.excepcion && !ic.firmado ? `<div class="review-note" style="margin-bottom:14px">⚠ Habilitado excepcionalmente (${ic.excepcion.motivo}) — los módulos no firmados aparecen como «—» en la tabla y el radar.</div>` : "");
  ic.sintEsc.forEach((t,i)=>{ const el=document.getElementById("ic_esc"+i); if(el) el.value = t||""; });
  const set=(fid,val)=>{ const el=document.getElementById(fid); if(el) el.value=(val==null)?"":val; };
  set("ic_val1", ic.valTec1); set("ic_val2", ic.valTec2);
  set("ic_recom", ic.recomendaciones); set("ic_orient", ic.orientaciones); set("ic_fecha", ic.fecha);
  icSetReadonly(st!=="borrador");
}
function icSetReadonly(ro){
  ["ic_val1","ic_val2","ic_recom","ic_orient","ic_fecha","ic_esc0","ic_esc1","ic_esc2","ic_esc3"]
    .forEach(fid=>{ const el=document.getElementById(fid); if(el) el.disabled = ro; });
  const g = document.querySelector('#view-ic .idea-summary button[onclick*="guardarIC"]');
  const f = document.querySelector('#view-ic .idea-summary button[onclick*="firmarIC"]');
  if(g) g.style.display = ro?"none":"";
  if(f) f.style.display = ro?"none":"";
}
function guardarICDesdeForm(p){
  const ic = p.flujo.ic;
  ic.sintEsc = [0,1,2,3].map(i=>{ const el=document.getElementById("ic_esc"+i); return el?el.value.trim():""; });
  ic.valTec1 = document.getElementById("ic_val1").value.trim();
  ic.valTec2 = document.getElementById("ic_val2").value.trim();
  ic.recomendaciones = document.getElementById("ic_recom").value.trim();
  ic.orientaciones = document.getElementById("ic_orient").value.trim();
  ic.fecha = document.getElementById("ic_fecha").value || "";
}
function guardarIC(){
  const p = NNA.find(n=>n.id===parseInt(document.getElementById("selNNAIC").value));
  if(!p){ toast("Seleccioná un NNA"); return; }
  const st = estadoModulo(p, "ic");
  if(st==="firmado"){ toast("El informe está firmado — corrección por addenda."); return; }
  if(st==="bloqueado"){ toast(moduloHabilitado(p,"ic").motivoBloqueo); return; }
  guardarICDesdeForm(p);
  document.getElementById("icEstadoBadge").innerHTML = estadoBadgeM(estadoModulo(p,"ic"));
  toast(`HCE-IC guardado (borrador) — ${p.nombre}`);
}
function firmarIC(){
  const p = NNA.find(n=>n.id===parseInt(document.getElementById("selNNAIC").value));
  if(!p){ toast("Seleccioná un NNA"); return; }
  if(p.flujo.ic.firmado){ toast("El informe ya está firmado."); return; }
  const st = estadoModulo(p, "ic");
  if(st==="bloqueado"){ toast(moduloHabilitado(p,"ic").motivoBloqueo); return; }
  guardarICDesdeForm(p);            // persistir el form antes de validar/firmar
  const cortas = p.flujo.ic.sintEsc.filter(t=>t && t.split(/\s+/).length < 40).length;
  if(cortas) toast("Sugerencia (§4.3): extensión aproximada de 100 palabras por escala — no bloquea la firma.");
  firmarModulo(p.id, "ic");         // el motor (M1) valida integridad §4.3 y abre el modal de firma doble
}

/* «Recibí» de la familia: se registra después de la firma, con constancia en HCE-LOG. */
function openRecibiModal(id){
  const nna = NNA.find(n=>n.id===id);
  if(!nna || !nna.flujo.ic.firmado){ toast("El Recibí se registra con el informe firmado."); return; }
  if(nna.flujo.ic.recibi){ toast("El Recibí ya está registrado."); return; }
  const body = `<div class="section-label">Recibí del Informe de Cierre Anual</div>
    <p style="font-size:.8rem;color:var(--ink-2);margin-bottom:12px">Constancia de que la familia recibió el informe en entrevista presencial. Queda registrada en HCE-LOG.</p>
    <div class="field"><label>Firmante (familia / referente)</label><input id="mfFirmante" value="${nna.referente||""}"></div>
    <div class="field"><label>Fecha</label><input id="mfFecha" type="date" value="${HOY}"></div>`;
  const foot = `<span class="left">HCE-IC · Informe de Cierre Anual</span>
    <div style="display:flex;gap:10px">
      <button class="btn btn-ghost" onclick="closeFlujoModal()">Cancelar</button>
      <button class="btn btn-primary" style="background:var(--teal)" onclick="confirmarRecibi(${id})">✍ Registrar Recibí</button>
    </div>`;
  openFlujoModal("Registrar «Recibí» de la familia", `${nna.nombre} ${nna.apellido} · Expediente #${nna.id}`, body, foot);
}
function confirmarRecibi(id){
  const nna = NNA.find(n=>n.id===id);
  const firmante = (document.getElementById("mfFirmante").value||"").trim() || nna.referente || "Familia";
  const fecha = (document.getElementById("mfFecha")||{}).value || HOY;
  nna.flujo.ic.recibi = {firmante, fecha};
  logEvento(nna, {modulo:"ic", tipo:"firma", detalle:`Recibí del Informe de Cierre Anual registrado — ${firmante} (entrevista presencial).`});
  closeFlujoModal(); renderFlujo(id);
  if(document.getElementById("view-informe").classList.contains("active")) generarInforme(id);
  toast("Recibí de la familia registrado en HCE-LOG.");
}

