/* M7 HCE-DOC (documentos y fotos) - M8 HCE-ORG (INAU/BPS) - M9 HCE-VF (BUND/CIF).
   Demo L1 HCE+IDEA - IPPU x UTEC-LIDIA.
   Extraido del monolito (lineas 3298-3765) sin cambios de logica.
   Los scripts se cargan en orden en index.html: el orden ES la semantica. */
/* ===================== HCE-DOC · DOCUMENTOS Y FOTOS (M7) =====================
   Adjuntos categorizados + fotos individuales condicionadas a la autorización
   de uso de imagen (§8.4, regla a nivel de LÓGICA, no solo de UI). Los registros
   del sistema anterior son archivo histórico de solo lectura (§10). Demo: sin
   archivos reales — se registran nombre/categoría/fechas. */
const DOC_CATS = ["Informe médico externo","Informe escolar","Evaluación externa (otra institución)",
  "Documento INAU","Documento BPS","Autorización / consentimiento","Estudio complementario",
  "Registro histórico — HCE anterior (Evaluación por áreas)","Registro histórico — HCE anterior (Evaluación General)",
  "Registro histórico — HCE anterior (Observaciones)","Registro histórico — HCE anterior (otro)","Otro"];

function docBodyHtml(p){
  const rows = p.docs.length ? p.docs.map((d,i)=>`
    <tr>
      <td>${d.historico?"🔒 ":""}${d.nombre}</td>
      <td>${d.cat}</td>
      <td class="num">${fmtFecha(d.fechaOrig)}</td>
      <td class="num">${fmtFecha(d.fechaCarga)}</td>
      <td style="text-align:right">${d.historico
        ? `<span class="doc-hist" title="Archivo histórico del sistema anterior (§10): consultable, nunca editable">solo lectura</span>`
        : `<button class="btn btn-ghost btn-mini" onclick="quitarDoc(${p.id},${i})">Quitar</button>`}</td>
    </tr>`).join("")
    : `<tr><td colspan="5" style="color:var(--ink-2);font-size:.8rem;padding:10px">Sin documentos adjuntos en esta HCE.</td></tr>`;
  const a = p.autImagen||{};
  const fotosHtml = p.fotos.length ? p.fotos.map((f,i)=>`
    <div class="foto-thumb"><div class="ph">📷</div><div class="cap">${f.desc||"Sin descripción"} · ${fmtFecha(f.fecha)}<br><a href="javascript:void(0)" style="color:var(--bad)" onclick="quitarFoto(${p.id},${i})">Quitar</a></div></div>`).join("")
    : `<span style="font-size:.78rem;color:var(--ink-2)">Sin fotografías individuales registradas.</span>`;
  return `
    <div style="font-size:.76rem;color:var(--ink-2);margin-bottom:10px">Repositorio de copias digitalizadas: informes externos, documentación de organismos, autorizaciones y estudios — contextualizan pero <b>no reemplazan</b> los instrumentos propios de IPPU. Los registros del sistema anterior (Eval. por áreas, Eval. General, Observaciones) viven acá como <b>archivo histórico de solo lectura</b> con su fecha original (§10); no se traducen a campos estructurados.</div>
    <table class="comp-table"><thead><tr><th>Documento</th><th>Categoría</th><th class="num">Fecha original</th><th class="num">Cargado</th><th></th></tr></thead><tbody>${rows}</tbody></table>
    <div class="doc-uprow">
      <div class="field"><label>Documento (demo: solo nombre)</label><input id="doc_nombre" placeholder="Ej. informe_medico_2026.pdf"></div>
      <div class="field"><label>Categoría</label><select id="doc_cat">${DOC_CATS.map(c=>`<option>${c}</option>`).join("")}</select></div>
      <div class="field"><label>Fecha original</label><input id="doc_fecha" type="date" value="${HOY}"></div>
      <div style="flex:0"><button class="btn btn-primary btn-mini" onclick="subirDoc(${p.id})">+ Adjuntar</button></div>
    </div>
    <div class="section-label" style="margin-top:16px">Fotografías individuales — protección de imagen de NNA (§8.4)</div>
    ${a.registrada
      ? `<div class="aut-ok">✓ <b>Autorización de uso de imagen registrada</b> (${fmtFecha(a.fecha)} · copia en documentos: ${a.adjunto||"—"}). Carga de fotografías individuales habilitada.</div>
         <div class="doc-uprow">
           <div class="field"><label>Descripción / contexto</label><input id="foto_desc" placeholder="Ej. actividad de juego estructurado, taller de cocina…"></div>
           <div style="flex:0"><button class="btn btn-primary btn-mini" onclick="subirFoto(${p.id})">+ Cargar foto</button></div>
         </div>`
      : `<div class="aut-no">🚫 <b>Carga de fotografías bloqueada:</b> no hay autorización de uso de imagen registrada — protección de la imagen de NNA (art. 11, Código de la Niñez y la Adolescencia, Ley N.º 17.823; Ley N.º 18.331/2008).
         <div style="margin-top:8px"><button class="btn btn-ghost btn-mini" onclick="openAutImagenModal(${p.id})">✍ Registrar autorización de imagen</button></div></div>`}
    <div class="foto-thumbs">${fotosHtml}</div>`;
}
function docPanelHtml(p){
  return `<div class="flujo-card">
    <h3><span class="ic">🗂</span> HCE-DOC · Documentos y fotos
      <span class="spacer"></span>
      <span style="font-size:.72rem;color:var(--ink-2);font-weight:400">${p.docs.length} documento(s) · ${p.fotos.length} foto(s)</span>
    </h3>
    <div class="flujo-body" id="docPanelBody">${docBodyHtml(p)}</div>
  </div>`;
}
function renderDoc(id){
  const p = NNA.find(n=>n.id===id);
  const el = document.getElementById("docPanelBody");
  if(p && el) el.innerHTML = docBodyHtml(p);
}

function subirDoc(id){
  const p = NNA.find(n=>n.id===id); if(!p) return;
  const nombre = (document.getElementById("doc_nombre").value||"").trim();
  if(!nombre){ toast("Ingresá el nombre del documento."); return; }
  const cat = document.getElementById("doc_cat").value;
  const fechaOrig = document.getElementById("doc_fecha").value || HOY;
  const historico = cat.startsWith("Registro histórico");
  p.docs.push({nombre, cat, fechaOrig, fechaCarga:HOY, historico});
  logEvento(p, {modulo:"doc", tipo:"edicion", detalle:`Documento adjuntado — «${nombre}» (${cat}${historico?" · archivo histórico de solo lectura":""}).`});
  renderDoc(id);
  toast(historico ? "Documento histórico cargado — solo lectura (§10)." : "Documento adjuntado a la HCE.");
}
function quitarDoc(id, ix){
  const p = NNA.find(n=>n.id===id); if(!p) return;
  const d = p.docs[ix]; if(!d) return;
  if(d.historico){ toast("Los registros históricos del sistema anterior son de solo lectura (§10) — no se pueden quitar."); return; }
  p.docs.splice(ix,1);
  logEvento(p, {modulo:"doc", tipo:"edicion", detalle:`Documento quitado — «${d.nombre}» (${d.cat}).`});
  renderDoc(id);
  toast("Documento quitado (constancia en HCE-LOG).");
}

/* Autorización de uso de imagen: registro con copia adjunta + constancia en HCE-LOG. */
function openAutImagenModal(id){
  const nna = NNA.find(n=>n.id===id); if(!nna) return;
  if(nna.autImagen && nna.autImagen.registrada){ toast("La autorización de imagen ya está registrada."); return; }
  const body = `<div class="section-label">Autorización de uso de imagen (§8.4)</div>
    <p style="font-size:.8rem;color:var(--ink-2);margin-bottom:12px">La familia firmó la autorización escrita. La copia queda adjunta en HCE-DOC (categoría «Autorización / consentimiento») y la constancia en HCE-LOG. Sin este registro no se cargan fotografías (art. 11, CNA — Ley N.º 17.823).</p>
    <div class="field"><label>Firmante (familia / referente)</label><input id="mfFirmante" value="${nna.referente||""}"></div>
    <div class="field"><label>Fecha</label><input id="mfFecha" type="date" value="${HOY}"></div>
    <div class="field"><label>Adjunto (documento firmado)</label><input id="mfAdjunto" value="autorizacion_imagen_2026.pdf"><div class="hint">Demo: no se sube un archivo real.</div></div>`;
  const foot = `<span class="left">HCE-DOC · protección de imagen de NNA</span>
    <div style="display:flex;gap:10px">
      <button class="btn btn-ghost" onclick="closeFlujoModal()">Cancelar</button>
      <button class="btn btn-primary" style="background:var(--teal)" onclick="confirmarAutImagen(${id})">✍ Registrar autorización</button>
    </div>`;
  openFlujoModal("Registrar autorización de imagen", `${nna.nombre} ${nna.apellido} · Expediente #${nna.id}`, body, foot);
}
function confirmarAutImagen(id){
  const nna = NNA.find(n=>n.id===id);
  const firmante = (document.getElementById("mfFirmante").value||"").trim() || nna.referente || "Familia";
  const fecha = (document.getElementById("mfFecha")||{}).value || HOY;
  const adjunto = ((document.getElementById("mfAdjunto")||{}).value||"").trim() || "autorizacion_imagen.pdf";
  nna.autImagen = {registrada:true, fecha, adjunto};
  nna.docs.push({nombre:adjunto, cat:"Autorización / consentimiento", fechaOrig:fecha, fechaCarga:HOY, historico:false});
  logEvento(nna, {modulo:"doc", tipo:"firma", detalle:`Autorización de uso de imagen registrada — ${firmante}. Copia adjunta en HCE-DOC.`});
  closeFlujoModal(); renderDoc(id);
  if(typeof renderGrupos==="function") renderGrupos();
  toast("Autorización de imagen registrada. Fotos individuales habilitadas.");
}

/* REGLA DURA (§8.4): la verificación vive acá, no en la UI — llamar subirFoto
   sin autorización registrada se bloquea aunque el botón no exista en pantalla. */
function subirFoto(id){
  const p = NNA.find(n=>n.id===id); if(!p) return;
  if(!(p.autImagen && p.autImagen.registrada)){
    toast("🚫 Carga bloqueada: falta la autorización de uso de imagen registrada (art. 11, CNA — Ley N.º 17.823). Registrala en HCE-DOC.");
    return;
  }
  const descEl = document.getElementById("foto_desc");
  const desc = descEl ? descEl.value.trim() : "";
  p.fotos.push({desc: desc||"Sin descripción", fecha:HOY});
  logEvento(p, {modulo:"doc", tipo:"edicion", detalle:`Fotografía individual cargada — ${desc||"sin descripción"}.`});
  renderDoc(id);
  toast("Fotografía cargada (demo: sin archivo real).");
}
function quitarFoto(id, ix){
  const p = NNA.find(n=>n.id===id); if(!p) return;
  const f = p.fotos[ix]; if(!f) return;
  p.fotos.splice(ix,1);
  logEvento(p, {modulo:"doc", tipo:"edicion", detalle:`Fotografía individual quitada — ${f.desc||"sin descripción"}.`});
  renderDoc(id);
  toast("Fotografía quitada (constancia en HCE-LOG).");
}

/* ===================== HCE-ORG · ÁREAS INAU Y BPS (M8) =====================
   Datos administrativos y registro de comunicaciones por NNA con los organismos
   de convenio (Doc. Técnico §3, tabla de módulos). El informe que se comparte con
   organismos supervisores es SIEMPRE el documento único HCE-IC (§5.3). */
const BPS_PRESTACIONES = ["","Ayuda Extraordinaria (AYEX) — instituto habilitado","Ayuda Extraordinaria (AYEX)",
  "Asignación Familiar por discapacidad","Pensión por invalidez (del hogar)","Otra"];
const BPS_ESTADOS = ["","Vigente","En trámite","Observada","Vencida","Denegada","No corresponde"];

function orgRegRows(p, org){
  const regs = org==="inau" ? p.inau.envios : p.bps.gestiones;
  return regs.length ? regs.map((r,i)=>`
    <tr><td class="num" style="white-space:nowrap;text-align:left">${fmtFecha(r.fecha)}</td><td>${r.txt}</td>
    <td style="text-align:right"><button class="btn btn-ghost btn-mini" onclick="quitarRegOrg(${p.id},'${org}',${i})">Quitar</button></td></tr>`).join("")
    : `<tr><td colspan="3" style="color:var(--ink-2);font-size:.8rem;padding:8px">Sin registros.</td></tr>`;
}
function orgBodyHtml(p){
  const I=p.inau, B=p.bps;
  const set = (org,campo) => `onchange="orgSet(${p.id},'${org}','${campo}',this.value)"`;
  const estadoColor = {Vigente:"var(--ok)", "En trámite":"var(--warn)", Observada:"var(--warn)", Vencida:"var(--bad)", Denegada:"var(--bad)"};
  return `
    <div style="font-size:.76rem;color:var(--ink-2);margin-bottom:12px">Vinculación con los organismos de convenio: datos administrativos y registro de comunicaciones por NNA. La documentación respaldatoria se adjunta en HCE-DOC (categorías «Documento INAU» / «Documento BPS»). El informe que se comparte con organismos supervisores es siempre el <b>documento único HCE-IC</b> (§5.3) — nunca versiones alternativas.</div>
    <div class="org-grid">
      <div class="org-col">
        <div class="section-label">INAU · Convenio de atención</div>
        <div class="form-grid">
          <div class="field"><label>N.º SIPI</label><input value="${I.sipi}" ${set("inau","sipi")}></div>
          <div class="field"><label>Convenio / proyecto</label><input value="${I.convenio}" ${set("inau","convenio")}></div>
          <div class="field"><label>Referente territorial INAU</label><input value="${I.referente}" ${set("inau","referente")}></div>
          <div class="field"><label>Ingreso al convenio</label><input type="date" value="${I.ingreso}" ${set("inau","ingreso")}></div>
        </div>
        <div class="field"><label>Observaciones (situación, medidas, coordinaciones)</label><textarea ${set("inau","obs")}>${I.obs}</textarea></div>
        <h4>Informes y comunicaciones enviadas a INAU</h4>
        <table class="comp-table"><thead><tr><th>Fecha</th><th>Detalle</th><th></th></tr></thead><tbody>${orgRegRows(p,"inau")}</tbody></table>
        <div class="doc-uprow">
          <div class="field" style="flex:0;min-width:150px"><label>Fecha</label><input type="date" id="inau_f" value="${HOY}"></div>
          <div class="field"><label>Detalle</label><input id="inau_t" placeholder="Ej. informe semestral enviado, visita de supervisión…"></div>
          <div style="flex:0"><button class="btn btn-primary btn-mini" onclick="agregarRegOrg(${p.id},'inau')">+ Registrar envío</button></div>
        </div>
      </div>
      <div class="org-col">
        <div class="section-label">BPS · Prestaciones</div>
        <div class="form-grid">
          <div class="field"><label>Prestación</label><select ${set("bps","prestacion")}>${BPS_PRESTACIONES.map(c=>`<option ${B.prestacion===c?"selected":""}>${c}</option>`).join("")}</select></div>
          <div class="field"><label>N.º de trámite / expediente</label><input value="${B.tramite}" ${set("bps","tramite")}></div>
          <div class="field"><label>Estado</label><select ${set("bps","estado")}>${BPS_ESTADOS.map(c=>`<option ${B.estado===c?"selected":""}>${c}</option>`).join("")}</select></div>
          <div class="field"><label>Vencimiento / renovación</label><input type="date" value="${B.vencimiento}" ${set("bps","vencimiento")}></div>
        </div>
        ${B.estado ? `<div style="font-size:.78rem;margin-bottom:10px">Estado actual: <b style="color:${estadoColor[B.estado]||"var(--ink)"}">${B.estado}</b>${B.vencimiento?` · vence ${fmtFecha(B.vencimiento)}`:""}</div>` : ""}
        <div class="field"><label>Observaciones (documentación, constancias, recordatorios)</label><textarea ${set("bps","obs")}>${B.obs}</textarea></div>
        <h4>Gestiones realizadas ante BPS</h4>
        <table class="comp-table"><thead><tr><th>Fecha</th><th>Detalle</th><th></th></tr></thead><tbody>${orgRegRows(p,"bps")}</tbody></table>
        <div class="doc-uprow">
          <div class="field" style="flex:0;min-width:150px"><label>Fecha</label><input type="date" id="bps_f" value="${HOY}"></div>
          <div class="field"><label>Detalle</label><input id="bps_t" placeholder="Ej. constancia de asistencia emitida, renovación presentada…"></div>
          <div style="flex:0"><button class="btn btn-primary btn-mini" onclick="agregarRegOrg(${p.id},'bps')">+ Registrar gestión</button></div>
        </div>
      </div>
    </div>
    <div style="font-size:.72rem;color:var(--ink-2);margin-top:12px">Alertas para el sistema definitivo (M10/recordatorios): vencimiento de AYEX a 60 y 30 días · informes semestrales a INAU pendientes tras la firma de cada protocolo.</div>`;
}
function orgPanelHtml(p){
  return `<div class="flujo-card">
    <h3><span class="ic">🏛</span> HCE-ORG · Áreas INAU y BPS
      <span class="spacer"></span>
      <span style="font-size:.72rem;color:var(--ink-2);font-weight:400">${p.inau.envios.length} envío(s) INAU · ${p.bps.gestiones.length} gestión(es) BPS</span>
    </h3>
    <div class="flujo-body" id="orgPanelBody">${orgBodyHtml(p)}</div>
  </div>`;
}
function renderOrg(id){
  const p = NNA.find(n=>n.id===id);
  const el = document.getElementById("orgPanelBody");
  if(p && el) el.innerHTML = orgBodyHtml(p);
}
function orgSet(id, org, campo, valor){
  const p = NNA.find(n=>n.id===id); if(!p) return;
  p[org][campo] = valor;
}
function agregarRegOrg(id, org){
  const p = NNA.find(n=>n.id===id); if(!p) return;
  const fecha = document.getElementById(org+"_f").value;
  const txt = (document.getElementById(org+"_t").value||"").trim();
  if(!fecha || !txt){ toast("Completá fecha y detalle del registro."); return; }
  (org==="inau" ? p.inau.envios : p.bps.gestiones).push({fecha, txt});
  logEvento(p, {modulo:"org", tipo:"edicion", detalle:`${org==="inau"?"Envío a INAU registrado":"Gestión ante BPS registrada"} — ${txt} (${fmtFecha(fecha)}).`});
  renderOrg(id);
  toast(org==="inau" ? "Envío a INAU registrado (constancia en HCE-LOG)." : "Gestión ante BPS registrada (constancia en HCE-LOG).");
}
function quitarRegOrg(id, org, ix){
  const p = NNA.find(n=>n.id===id); if(!p) return;
  const regs = org==="inau" ? p.inau.envios : p.bps.gestiones;
  const r = regs[ix]; if(!r) return;
  regs.splice(ix,1);
  logEvento(p, {modulo:"org", tipo:"edicion", detalle:`Registro ${org==="inau"?"de envío a INAU":"de gestión BPS"} quitado — ${r.txt}.`});
  renderOrg(id);
  toast("Registro quitado (constancia en HCE-LOG).");
}

/* ===================== HCE-VF · VALORACIÓN FUNCIONAL (M9) =====================
   BUND/CIF (Doc. Técnico §7): IPPU registra la valoración oficial, NO certifica.
   La tabla de categorización es PARAMETRIZABLE (decisión §0.4): una sola constante,
   cortes a confirmar por IPPU contra el anexo del Decreto 72/025 antes de uso
   clínico real. Terminología §8.1: «severo / muy severo», nunca «grave». */
const BUND_CATS = [
  {min:0,  max:4,   cat:"Sin discapacidad", rango:"0 % a 4 %",   imp:"Observación preventiva."},
  {min:5,  max:24,  cat:"Leve",             rango:"5 % a 24 %",  imp:"Requiere adaptaciones menores."},
  {min:25, max:49,  cat:"Moderado",         rango:"25 % a 49 %", imp:"Habilita acceso a prestaciones y amparo en cuota laboral."},
  {min:50, max:95,  cat:"Severo",           rango:"50 % a 95 %", imp:"Requiere apoyos significativos y permanentes."},
  {min:96, max:100, cat:"Muy severo",       rango:"96 % a 100 %",imp:"Configura situación de dependencia; apoyo integral."},
];
/* SALVAGUARDA DURA (§7.5, a nivel de lógica): la categoría del baremo se deriva
   ÚNICAMENTE del % de la valoración oficial (vf.pct). Si esta función recibe algo
   con forma de instrumento clínico (IDEA o IPPU-TEA), lanza error — imposible de
   saltear desde otro punto del código, igual que calcularDelta (M5). */
function categoriaBaremo(fuente){
  if(fuente && typeof fuente==="object" &&
     (fuente.kind==="idea" || fuente.kind==="protocolo" ||
      Array.isArray(fuente.dim) || Array.isArray(fuente.item) || Array.isArray(fuente.esc)))
    throw new Error("categoriaBaremo: constructos no equivalentes — el % y la categoría del baremo salen sólo de la valoración oficial (BUND), nunca de puntajes IDEA/IPPU-TEA (§7.5).");
  const n = parseFloat(fuente && typeof fuente==="object" ? fuente.pct : fuente);
  if(isNaN(n) || n<0 || n>100) return null;
  return BUND_CATS.find(c=>n>=c.min && n<=c.max) || null;
}
const VF_DOMINIOS = [
  ["comunicacion","Comunicación (comprender y expresarse, con o sin apoyos)","CIF d310–d360"],
  ["autocuidado","Autocuidado (alimentación, higiene, vestido)","CIF d510–d570"],
  ["movilidad","Movilidad y desplazamientos","CIF d450–d470"],
  ["aprendizaje","Aprendizaje y aplicación del conocimiento","CIF d110–d179"],
  ["interacciones","Interacciones y relaciones interpersonales","CIF d710–d799"],
  ["comunidad","Vida doméstica, comunitaria y uso de servicios","CIF d610–d699 · d910–d999"],
];
const VF_NIVELES = ["","Autónomo","Apoyo ocasional","Apoyo frecuente","Apoyo permanente"];
/* Guía orientativa de prestaciones (§7.7) — contenido informativo estático. */
const PRESTACIONES = [
  {n:"Registro Nacional de Personas con Discapacidad (RNPcD)", o:"MIDES", d:"Inscripción voluntaria a partir de la valoración con el BUND. Puerta de entrada a prestaciones y programas."},
  {n:"Ayuda Extraordinaria (AYEX)", o:"BPS", d:"Contribución para la concurrencia a institutos habilitados (como IPPU). Se gestiona y se sigue desde HCE-ORG."},
  {n:"Asignación Familiar por discapacidad", o:"BPS", d:"Prestación económica; puede corresponder duplicación según la situación. Requiere valoración vigente."},
  {n:"Pensión por invalidez", o:"BPS", d:"Para situaciones de discapacidad severa según baremo y condiciones del hogar. Resolución exclusiva de BPS."},
  {n:"Asistentes personales", o:"Sistema Nacional Integrado de Cuidados (MIDES)", d:"Para situaciones de dependencia severa, según valoración del Sistema de Cuidados."},
  {n:"Transporte accesible / boleto", o:"Intendencias · MTOP", d:"Beneficios de transporte según normativa departamental y nacional."},
  {n:"Cuota laboral (4 % en el Estado · Ley 19.691 en el sector privado)", o:"ONSC · MTSS", d:"Relevante para adolescentes y jóvenes en transición a la vida adulta; requiere inscripción en el RNPcD."},
  {n:"Apoyos a la inclusión educativa", o:"ANEP · MEC", d:"Adaptaciones curriculares, acompañamiento y protocolos de inclusión según normativa educativa vigente."},
];

/* --- Autogeneración descriptiva (§7.4): frases, nunca números crudos ---- */
function descAfect(v){
  if(v>=16) return "es actualmente el área donde más apoyo necesita";
  if(v>=8)  return "requiere apoyos de manera habitual";
  return "se encuentra relativamente preservada, con apoyos puntuales";
}
function sugiereNivel(v){
  if(v>=16) return "Apoyo frecuente";
  if(v>=8)  return "Apoyo ocasional";
  return "Autónomo";
}
function descDelta(d){
  if(d>=7)  return "mostró avances claros y sostenidos durante el año";
  if(d>=1)  return "mostró avances, todavía en consolidación";
  if(d===0) return "se mantuvo estable, lo que en varias situaciones constituye en sí mismo un logro";
  if(d>=-6) return "presentó algunas dificultades que el equipo está acompañando de cerca";
  return "presentó un retroceso que motivó una revisión del plan de trabajo junto a la familia";
}
const VF_NOMBRE_ESC = ["la relación con otras personas","la comunicación","el manejo de los cambios y las rutinas","el juego, la imitación y la imaginación"];
const deArea = n => n.startsWith("el ") ? "del "+n.slice(3) : "de "+n;
function genVFBorrador(id, force){
  const p = NNA.find(n=>n.id===id); if(!p) return;
  const V = p.vf;
  if(!p.flujo.lb.firmado){ toast("Para autogenerar el borrador se necesita la línea base IDEA (HCE-LB) firmada."); return; }
  if((V.sintesisFuncional||"").trim() && !force && !window.confirm("Ya existe una síntesis funcional. ¿Reemplazarla por un nuevo borrador autogenerado?")) return;
  const t = lbTotales(p.flujo.lb.dim);
  const orden = [0,1,2,3].sort((a,b)=>t.esc[a]-t.esc[b]);   // fortaleza relativa → necesidad de apoyo
  let txt = "PERFIL ACTUAL. ";
  txt += "En la evaluación del equipo, "+VF_NOMBRE_ESC[orden[0]]+" aparece como el área de mayor fortaleza relativa, mientras que "+VF_NOMBRE_ESC[orden[3]]+" "+descAfect(t.esc[orden[3]])+". ";
  txt += [1,2].map(i=>"El área "+deArea(VF_NOMBRE_ESC[orden[i]])+" "+descAfect(t.esc[orden[i]])+".").join(" ");
  if(p.flujo.pa.firmado && p.flujo.pb.firmado && p.flujo.pb.deltas){
    txt += "\n\nEVOLUCIÓN DEL AÑO. ";
    txt += [0,1,2,3].map(i=>"En "+VF_NOMBRE_ESC[i]+" "+descDelta(p.flujo.pb.deltas.esc[i])+".").join(" ");
  } else if(p.flujo.pa.firmado){
    txt += "\n\nEVOLUCIÓN DEL PRIMER SEMESTRE. El equipo registró el primer seguimiento semestral; la evolución completa del año se describirá al cierre del segundo semestre.";
  }
  txt += "\n\n(Nota del equipo: borrador descriptivo generado desde los instrumentos clínicos firmados. Debe ser revisado, ajustado y completado por los técnicos responsables antes de compartirse.)";
  V.sintesisFuncional = txt;
  /* Sugerencias de autonomía SÓLO en los 3 dominios con correlato clínico directo
     (comunicación ← E2 · interacciones ← E1 · aprendizaje ← E4, §7.4) y sólo si están vacíos. */
  if(!V.dominios.comunicacion)  V.dominios.comunicacion  = sugiereNivel(t.esc[1]);
  if(!V.dominios.interacciones) V.dominios.interacciones = sugiereNivel(t.esc[0]);
  if(!V.dominios.aprendizaje)   V.dominios.aprendizaje   = sugiereNivel(t.esc[3]);
  logEvento(p, {modulo:"vf", tipo:"edicion", detalle:"Borrador de síntesis funcional autogenerado (descriptivo; requiere revisión de los técnicos responsables)."});
  renderVf(id);
  toast("Borrador descriptivo generado — revisar y ajustar antes de compartir.");
}

/* Alerta única del módulo (§7.8): vencimiento/revisión a 90 y 30 días. */
function vfAlertaVigencia(V){
  if(!V.vigencia) return null;
  const dias = Math.round((new Date(V.vigencia+"T00:00:00") - new Date(HOY+"T00:00:00"))/86400000);
  if(dias < 0)   return {nivel:"bad",  txt:`⚠ Valoración oficial vencida el ${fmtFecha(V.vigencia)} — corresponde gestionar la revaloración (§7.8).`};
  if(dias <= 30) return {nivel:"bad",  txt:`⚠ La valoración oficial vence en ${dias} día(s) (${fmtFecha(V.vigencia)}) — alerta de 30 días (§7.8).`};
  if(dias <= 90) return {nivel:"warn", txt:`La valoración oficial vence en ${dias} día(s) (${fmtFecha(V.vigencia)}) — alerta de 90 días (§7.8).`};
  return null;
}

/* --- Panel HCE-VF en el expediente ----------------------------------- */
function vfBodyHtml(p){
  const V = p.vf; const cat = categoriaBaremo(V); const alerta = vfAlertaVigencia(V);
  const set = campo => `onchange="vfSet(${p.id},'${campo}',this.value)"`;
  const catColor = cat ? (cat.cat==="Sin discapacidad" ? "var(--ok)" : (cat.cat==="Leve"||cat.cat==="Moderado") ? "var(--warn)" : "var(--bad)") : "";
  return `
    <div style="font-size:.76rem;color:var(--ink-2);margin-bottom:12px"><b>IPPU registra, no certifica (§7.1):</b> la valoración oficial la realizan los equipos habilitados (MSP, MIDES, BPS) mediante el <b>Baremo Único Nacional de Discapacidad — BUND</b> (Ley N.º 20.378 · Decreto 72/025), en base a IBMF, IRSA y el propio BUND. En menores de 2 años no aplica el BUND (sólo IBMF e IRSA). La constancia de valoración se adjunta en HCE-DOC.</div>
    <div class="section-label">Valoración oficial (BUND) — registro</div>
    <div class="form-grid">
      <div class="field"><label>Estado</label><select ${set("estado")}>${["No iniciado","En trámite","Valorado","A revalorar"].map(c=>`<option ${V.estado===c?"selected":""}>${c}</option>`).join("")}</select></div>
      <div class="field"><label>Fecha de valoración</label><input type="date" value="${V.fecha}" ${set("fecha")}></div>
      <div class="field"><label>Organismo / equipo valorador</label><input value="${V.organismo}" ${set("organismo")}></div>
      <div class="field"><label>Porcentaje de discapacidad (%)</label><input type="number" min="0" max="100" value="${V.pct}" ${set("pct")}></div>
      <div class="field"><label>Vigencia / próxima revisión</label><input type="date" value="${V.vigencia}" ${set("vigencia")}></div>
      <div class="field"><label>N.º RNPcD (si está inscripto)</label><input value="${V.rnpcd}" ${set("rnpcd")}></div>
    </div>
    <div style="margin:6px 0 0;font-size:.8rem">Categoría según baremo (tabla parametrizable, §0.4): ${cat
      ? `<span class="vf-cat" style="background:${catColor}22;color:${catColor}">${cat.cat} · ${cat.rango}</span> <span style="color:var(--ink-2)">${cat.imp}</span>`
      : `<span style="color:var(--ink-2)">se deriva automáticamente al ingresar el % oficial</span>`}</div>
    ${alerta ? `<div class="vf-alerta ${alerta.nivel==="bad"?"bad":""}">${alerta.txt}</div>` : ""}
    <div class="vf-salva"><b>Salvaguarda dura (§7.5):</b> los puntajes del IDEA y de la Escala IPPU-TEA <u>no se convierten ni se traducen</u> al % del baremo — miden constructos distintos. Este módulo nunca autocalcula la categoría desde los instrumentos clínicos (guard a nivel de lógica, como el delta de M5).</div>

    <div class="section-label" style="margin-top:16px">Perfil funcional en clave CIF (§7.3) — capacidades, autonomía, barreras y apoyos</div>
    <table class="comp-table"><thead><tr><th>Dominio de la vida diaria</th><th>Referencia CIF</th><th style="width:190px">Nivel de autonomía</th></tr></thead><tbody>
      ${VF_DOMINIOS.map(([k,n,ref])=>`<tr><td>${n}</td><td style="color:var(--ink-2);font-size:.74rem">${ref}</td>
        <td><select onchange="vfSetDom(${p.id},'${k}',this.value)">${VF_NIVELES.map(x=>`<option ${V.dominios[k]===x?"selected":""} value="${x}">${x||"— sin registrar —"}</option>`).join("")}</select></td></tr>`).join("")}
    </tbody></table>
    <div class="form-grid full" style="margin-top:12px">
      <div class="field"><label>Capacidades y fortalezas (qué puede, qué disfruta, qué lo motiva)</label><textarea ${set("capacidades")}>${V.capacidades}</textarea></div>
      <div class="field"><label>Barreras del entorno (físicas, comunicacionales, actitudinales, de servicios)</label><textarea ${set("barreras")}>${V.barreras}</textarea></div>
      <div class="field"><label>Apoyos y facilitadores existentes</label><textarea ${set("apoyos")}>${V.apoyos}</textarea></div>
      <div class="field"><label>Observaciones (consultas de la familia, gestiones en curso)</label><textarea ${set("obs")}>${V.obs}</textarea></div>
      <div class="field"><label>Síntesis funcional descriptiva (base del reporte a la familia — editable)</label><textarea style="min-height:110px" ${set("sintesisFuncional")}>${V.sintesisFuncional}</textarea></div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:4px">
      <button class="btn btn-ghost btn-mini" onclick="genVFBorrador(${p.id})">✦ Autogenerar borrador desde IDEA y protocolos</button>
      <button class="btn btn-primary btn-mini" onclick="generarReporteVF(${p.id})">🖨 Reporte de Valoración Funcional (familia)</button>
    </div>
    <div style="font-size:.72rem;color:var(--ink-2);margin-top:8px">El borrador usa <b>sólo lenguaje descriptivo</b> (nunca números crudos ni porcentajes) desde los instrumentos firmados, y sugiere autonomía únicamente en los 3 dominios con correlato clínico directo (comunicación ← E2 · interacciones ← E1 · aprendizaje ← E4) como propuesta editable. Nada de esto genera % ni categorías del baremo.</div>

    <details style="margin-top:14px"><summary style="cursor:pointer;font-size:.8rem;font-weight:700;color:var(--ink-2)">Guía orientativa para la familia — categorías del baremo y prestaciones (§7.7, contenido estático)</summary>
      <table class="comp-table" style="margin-top:10px"><thead><tr><th>Categoría</th><th>Rango</th><th>Implicancia práctica orientativa</th></tr></thead><tbody>
        ${BUND_CATS.map(c=>`<tr ${cat&&cat.cat===c.cat?'style="background:#FDF6EA"':""}><td><b>${c.cat}</b></td><td class="num" style="text-align:left">${c.rango}</td><td>${c.imp}</td></tr>`).join("")}
      </tbody></table>
      <table class="comp-table" style="margin-top:12px"><thead><tr><th>Prestación / beneficio</th><th>Organismo</th><th>Orientación</th></tr></thead><tbody>
        ${PRESTACIONES.map(x=>`<tr><td><b>${x.n}</b></td><td>${x.o}</td><td style="color:var(--ink-2);font-size:.76rem">${x.d}</td></tr>`).join("")}
      </tbody></table>
      <div style="font-size:.72rem;color:var(--ink-2);margin-top:8px">Contenido informativo mantenido por coordinación. No genera trámites dentro de la HCE: la HCE orienta, los organismos resuelven. Las gestiones concretas se registran en HCE-ORG.</div>
    </details>`;
}
function vfPanelHtml(p){
  return `<div class="flujo-card">
    <h3><span class="ic">♿</span> HCE-VF · Valoración funcional (BUND / CIF)
      <span class="spacer"></span>
      <span style="font-size:.72rem;color:var(--ink-2);font-weight:400">${p.vf.estado}${categoriaBaremo(p.vf)?` · ${categoriaBaremo(p.vf).cat}`:""}</span>
    </h3>
    <div class="flujo-body" id="vfPanelBody">${vfBodyHtml(p)}</div>
  </div>`;
}
function renderVf(id){
  const p = NNA.find(n=>n.id===id);
  const el = document.getElementById("vfPanelBody");
  if(p && el) el.innerHTML = vfBodyHtml(p);
}
function vfSet(id, campo, valor){
  const p = NNA.find(n=>n.id===id); if(!p) return;
  p.vf[campo] = valor;
  if(campo==="pct" || campo==="estado" || campo==="vigencia") renderVf(id);   // refresca categoría/alerta
}
function vfSetDom(id, k, valor){
  const p = NNA.find(n=>n.id===id); if(!p) return;
  p.vf.dominios[k] = valor;
}

/* --- Reporte de Valoración Funcional (§7.6): descriptivo, a demanda, ---
   las secciones vacías NO aparecen; no es certificado ni informe clínico. */
function generarReporteVF(id){
  const p = NNA.find(n=>n.id===id); if(!p) return;
  const V = p.vf; const cat = categoriaBaremo(V);
  const cont = document.getElementById("informeContent");
  const hoy = new Date();
  const fechaGen = `${String(hoy.getDate()).padStart(2,"0")}/${String(hoy.getMonth()+1).padStart(2,"0")}/${hoy.getFullYear()}`;
  const doms = VF_DOMINIOS.filter(([k])=>V.dominios[k]);
  let evol = "";
  if(p.flujo.pa.firmado && p.flujo.pb.firmado && p.flujo.pb.deltas)
    evol = [0,1,2,3].map(i=>`<p style="font-size:.85rem;margin-bottom:6px"><b>${VF_NOMBRE_ESC[i].charAt(0).toUpperCase()+VF_NOMBRE_ESC[i].slice(1)}:</b> ${descDelta(p.flujo.pb.deltas.esc[i])}.</p>`).join("");
  const card = (titulo, inner) => `<div class="card" style="margin-top:16px"><div class="cardhead"><h2>${titulo}</h2></div><div class="cardbody">${inner}</div></div>`;
  cont.innerHTML = `
    <div class="inf-banner no-print">
      <div><h2>Reporte de Valoración Funcional — ${p.nombre} ${p.apellido}</h2>
        <p>Documento descriptivo para la familia · generable a demanda · vista previa del ${fechaGen}</p></div>
      <div style="display:flex;gap:8px">
        <button class="btn-print" onclick="window.print()">🖨 Imprimir / guardar PDF</button>
        <button class="btn-print" style="background:#EEF3F8;color:var(--ink)" onclick="abrirExpediente(${p.id})">‹ Volver</button>
      </div>
    </div>
    <div class="card"><div class="cardbody">
      <div class="membrete">
        <h2>FUNDACIÓN IPPU · Instituto Psico Pedagógico Uruguayo</h2>
        <div class="sub">INAU · MSP · BPS · ECOSOC/ONU · Montevideo, Uruguay</div>
        <h3>Reporte de Valoración Funcional — documento descriptivo y orientativo</h3>
      </div>
      <div class="ib">
        <div class="data-row"><dt>Nombre</dt><dd>${p.nombre} ${p.apellido} · ${p.edad} años</dd></div>
        <div class="data-row"><dt>Expediente</dt><dd>#${p.id} · Grupo ${p.grupo}</dd></div>
        <div class="data-row"><dt>Fecha del reporte</dt><dd>${fechaGen}</dd></div>
      </div>
      <div style="font-size:.78rem;color:var(--ink-2);border-left:4px solid var(--teal);background:#F2F7FA;padding:10px 14px;border-radius:8px;margin-top:10px">Este reporte describe capacidades, autonomía, barreras y apoyos para acompañar a la familia en la planificación cotidiana y la gestión de prestaciones. <b>No es un certificado de discapacidad ni un informe clínico:</b> la valoración oficial corresponde a los equipos habilitados mediante el BUND (Ley N.º 20.378), y el documento clínico anual es el Informe de Cierre (HCE-IC).</div>
    </div></div>
    ${(V.capacidades||"").trim() ? card("Capacidades y fortalezas", `<p style="font-size:.85rem">${V.capacidades}</p>`) : ""}
    ${(V.sintesisFuncional||"").trim() ? card("Perfil funcional descriptivo", V.sintesisFuncional.split("\n").filter(x=>x.trim()).map(x=>`<p style="font-size:.85rem;margin-bottom:8px">${x}</p>`).join("")) : ""}
    ${evol ? card("Evolución del año, en palabras", evol+`<div style="font-size:.72rem;color:var(--ink-2)">Descripción cualitativa del seguimiento semestral del equipo. Los detalles clínicos completos están en el Informe de Cierre Anual (documento único).</div>`) : ""}
    ${doms.length ? card("Autonomía en la vida diaria", `<table class="comp-table"><tbody>${doms.map(([k,n])=>`<tr><td>${n.split(" (")[0]}</td><td class="num"><b>${V.dominios[k]}</b></td></tr>`).join("")}</tbody></table><div style="font-size:.72rem;color:var(--ink-2);margin-top:6px">«Apoyo» refiere a la ayuda de otra persona, una adaptación o un producto de apoyo para realizar la actividad.</div>`) : ""}
    ${(V.barreras||"").trim()||(V.apoyos||"").trim() ? card("Barreras del entorno y apoyos con los que cuenta",
      `${(V.barreras||"").trim()?`<p style="font-size:.85rem;margin-bottom:8px"><b>Barreras identificadas:</b> ${V.barreras}</p>`:""}
       ${(V.apoyos||"").trim()?`<p style="font-size:.85rem"><b>Apoyos y facilitadores:</b> ${V.apoyos}</p>`:""}`) : ""}
    ${card("Situación de la valoración oficial y orientación sobre prestaciones",
      `<p style="font-size:.85rem;margin-bottom:8px"><b>Estado:</b> ${V.estado}${V.fecha?` · valorado el ${fmtFecha(V.fecha)}`:""}${V.organismo?` por ${V.organismo}`:""}${V.vigencia?` · vigencia hasta ${fmtFecha(V.vigencia)}`:""}${V.rnpcd?` · inscripto en el RNPcD (${V.rnpcd})`:""}.</p>
       ${cat?`<p style="font-size:.85rem;margin-bottom:8px"><b>Categoría según el baremo:</b> ${cat.cat} (${cat.rango}). ${cat.imp}</p>`:""}
       <p style="font-size:.74rem;color:var(--ink-2)">La familia puede consultar al equipo de IPPU por la gestión de prestaciones (BPS, MIDES, Sistema de Cuidados, transporte, apoyos educativos). El otorgamiento de cada prestación es resolución del organismo competente.</p>`)}
    <div class="card" style="margin-top:16px"><div class="cardbody">
      <div class="firmas-grid" style="grid-template-columns:1fr 1fr">
        <div><label>Por el equipo técnico</label><div class="flin"></div><div class="fnom">${p.tecnico1||"—"} · ${p.tecnico2||"—"}</div></div>
        <div><label>Recibido por la familia</label><div class="flin"></div><div class="fnom">${p.referente||""}</div></div>
      </div>
      <div style="font-size:.72rem;color:var(--ink-2);margin-top:14px">Documento descriptivo generado desde la HCE de IPPU · Uso familiar y de orientación · No es certificado de discapacidad ni informe clínico · Ley N.º 18.331/2008 · Demo — datos simulados</div>
    </div></div>`;
  go("informe");
}

