/* M7 HCE-DOC (documentos y fotos) y M8 HCE-ORG (INAU/BPS), en modo demostracion - HCE-VF (BUND/CIF) CONECTADA a la API (Fase 3-d, §5.126).
   Demo L1 HCE+IDEA - IPPU x UTEC-LIDIA.
   DOC y ORG: extraidos del monolito (lineas 3298-3765) sin cambios de logica. VF: reescrita contra la API (ver su bloque, mas abajo).
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
    <div class="section-label" style="margin-top:16px">Fotografías individuales</div>
    <div class="doc-uprow">
      <div class="field"><label>Descripción / contexto</label><input id="foto_desc" placeholder="Ej. actividad de juego estructurado, taller de cocina…"></div>
      <div style="flex:0"><button class="btn btn-primary btn-mini" onclick="subirFoto(${p.id})">+ Cargar foto</button></div>
    </div>
    <div style="font-size:.76rem;color:var(--ink-2);margin-bottom:var(--s3)">Autorización de uso de imagen: ${a.registrada
      ? `registrada (${fmtFecha(a.fecha)} · copia en documentos: ${a.adjunto||"—"})`
      : `no registrada <button class="btn btn-ghost btn-mini" onclick="openAutImagenModal(${p.id})">✍ Registrar autorización de imagen</button>`}</div>
    <div class="foto-thumbs">${fotosHtml}</div>`;
}
function docPanelHtml(p){
  return `<div class="flujo-card" id="anchor-doc">
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
  toast("Autorización de imagen registrada.");
}

/* Guardar una foto no requiere autorización y no produce aviso ni bloqueo (§5.99); la autorización sólo regula COMPARTIR. */
function subirFoto(id){
  const p = NNA.find(n=>n.id===id); if(!p) return;
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
  return `<div class="flujo-card" id="anchor-org">
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

/* ===================== HCE-VF · VALORACIÓN FUNCIONAL — CONECTADA A LA API (Fase 3-d, handoff §5.126) =====================
   BUND/CIF (Doc. Técnico §7): IPPU registra la valoración oficial, NO certifica. Vive en la pestaña VF del expediente.
     GET /hce/{id}/valoracion-funcional   404 = todavía no se creó (estado vacío, no un error)
     POST  …                              crea (una por expediente; 409 la segunda)
     PATCH …                              edita sólo lo que cambió
   Reglas duras, todas del servidor (esto es solo presentacion):
   - la categoría del baremo (`categoria`, `categoria_etiqueta`) y la alerta de vigencia (`alerta_vigencia`) salen SOLO de
     la respuesta de la API; tras cada guardado se vuelve a pintar desde la respuesta. El navegador no clasifica el %,
     no calcula vigencias y no sugiere nada: la API no tiene sugerencia de nivel CIF ni borrador autogenerado (los cortes
     están pendientes con IPPU, §5.118), así que la pantalla no ofrece ninguna;
   - `pct` viaja como texto (Decimal en la API) y la API lo valida: un valor rechazado vuelve como error por campo;
   - los niveles y las categorías usan la MISMA rampa de un solo matiz que las bandas del IDEA (notas de accesibilidad
     §3.1), nunca ok/warn/bad; el nombre va siempre escrito.
   La «Guía orientativa» (categorías del baremo y prestaciones) es contenido estático y lleva la marca «Solo demo». */
const BUND_CATS = [      // SOLO para la guía estática de más abajo: nada la usa para clasificar
  {cat:"Sin discapacidad", rango:"0 % a 4 %",   imp:"Observación preventiva."},
  {cat:"Leve",             rango:"5 % a 24 %",  imp:"Requiere adaptaciones menores."},
  {cat:"Moderado",         rango:"25 % a 49 %", imp:"Habilita acceso a prestaciones y amparo en cuota laboral."},
  {cat:"Severo",           rango:"50 % a 95 %", imp:"Requiere apoyos significativos y permanentes."},
  {cat:"Muy severo",       rango:"96 % a 100 %",imp:"Configura situación de dependencia; apoyo integral."},
];
const VF_DOMINIOS = [
  ["comunicacion","Comunicación (comprender y expresarse, con o sin apoyos)","CIF d310–d360"],
  ["autocuidado","Autocuidado (alimentación, higiene, vestido)","CIF d510–d570"],
  ["movilidad","Movilidad y desplazamientos","CIF d450–d470"],
  ["aprendizaje","Aprendizaje y aplicación del conocimiento","CIF d110–d179"],
  ["interacciones","Interacciones y relaciones interpersonales","CIF d710–d799"],
  ["comunidad","Vida doméstica, comunitaria y uso de servicios","CIF d610–d699 · d910–d999"],
];
const VF_NIVELES = ["","Autónomo","Apoyo ocasional","Apoyo frecuente","Apoyo permanente"];
const VF_ESTADOS = ["No iniciado","En trámite","Valorado","A revalorar"];
/* Paso de la rampa por nombre. La API devuelve el NOMBRE de la categoría y el nivel que se registró, no su orden: el
   paso sale de este mapa y, si el nombre no está (catálogo cambiado), no se infiere nada: chip neutro con el nombre
   escrito (como `banda.orden` del IDEA, hueco de la API anotado en §5.125/§5.126). */
const VF_NIVEL_PASO = {"Autónomo":1, "Apoyo ocasional":2, "Apoyo frecuente":4, "Apoyo permanente":6};
const VF_CAT_PASO = {"Sin discapacidad":1, "Leve":2, "Moderado":3, "Severo":5, "Muy severo":6};
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

const VF = {hceId: null, estado: "cargando", rec: null, carga: 0, avisos: [], campos: null, sucio: false, guardando: false, nuevo: false, error: ""};
const _vfEl = (id) => document.getElementById(id);
const _vfSel = (v) => v === "" || v === null || v === undefined ? "" : String(v);

function vfReiniciar(){
  VF.carga++;
  Object.assign(VF, {hceId: null, estado: "cargando", rec: null, avisos: [], campos: null, sucio: false, guardando: false, nuevo: false, error: ""});
}

/* ---------- Chips de la rampa (texto + paso; nunca ok/warn/bad) ---------- */
function vfChipHtml(nombre, paso, extra){
  const clase = paso === undefined || paso === null ? "neutra" : paso;
  return `<span class="banda-chip banda-${clase}" data-banda-paso="${clase}">${escHtml(nombre)}${extra ? `<span class="banda-rango"> · ${escHtml(extra)}</span>` : ""}</span>`;
}
function vfNivelChipHtml(nivel){
  if(!nivel) return `<span class="sin-puntuar">sin registrar</span>`;
  return vfChipHtml(nivel, Object.prototype.hasOwnProperty.call(VF_NIVEL_PASO, nivel) ? VF_NIVEL_PASO[nivel] : null);
}
/* La categoría la deriva el servidor (sólo de pct); acá solo se pinta lo que devolvió. */
function vfCategoriaHtml(rec){
  const c = rec.categoria;
  if(!c) return `<span class="banda-chip banda-neutra" data-banda-paso="neutra">${escHtml(rec.categoria_etiqueta || "No corresponde")}</span>`;
  const paso = Object.prototype.hasOwnProperty.call(VF_CAT_PASO, c.categoria) ? VF_CAT_PASO[c.categoria] : null;
  return `${vfChipHtml(c.categoria, paso, c.rango)} <span class="vf-impl">${escHtml(c.implicancia)}</span>`;
}
const VF_ALERTA_TXT = {vencida: "Vencida", "30_dias": "Vence en 30 días o menos", "90_dias": "Vence en 90 días o menos"};
function vfAlertaHtml(rec){
  const a = rec.alerta_vigencia;
  if(!a) return "";
  return `<div class="vf-alerta" id="vfAlerta"><span aria-hidden="true">⚠</span> <b>Vigencia — ${escHtml(VF_ALERTA_TXT[a.nivel] || a.nivel)}.</b> ${escHtml(a.mensaje)}</div>`;
}

/* ======================================================================
   CARGA
   ====================================================================== */
function vfMostrar(){
  if(VF.hceId === EXP.id && (VF.estado === "listo" || VF.estado === "vacio")){
    if(VF.sucio || VF.nuevo){ vfRepintar(); return; }
    vfRepintar();
    vfCargar(true);
    return;
  }
  vfCargar(false);
}
async function vfCargar(conservar){
  const mi = EXP.seq, id = EXP.id;
  if(id === null) return;
  if(VF.hceId !== id){ vfReiniciar(); VF.hceId = id; }
  else if(!conservar || (VF.estado !== "listo" && VF.estado !== "vacio")) VF.estado = "cargando";
  const n = ++VF.carga;
  const vigente = () => mi === EXP.seq && VF.hceId === id && n === VF.carga;
  if(VF.estado === "cargando") vfRepintar();
  let rec = null, vacio = false;
  try{
    const r = await apiFetch(`/hce/${id}/valoracion-funcional`);
    rec = r.data;
  }catch(err){
    if(!vigente()) return;
    if(err instanceof ApiError && err.status === 404) vacio = true;      // 404 = todavía no se creó: un estado, no un error
    else { VF.estado = "error"; VF.error = err instanceof ApiError ? err.message : "No se pudo cargar la valoración funcional."; vfRepintar(); return; }
  }
  if(!vigente()) return;
  const listoAntes = VF.estado === "listo" || VF.estado === "vacio";
  if(conservar && listoAntes && (VF.sucio || VF.nuevo)) return;      // se empezó a tipear mientras llegaba la respuesta: no se pisa nada
  const sinCambios = conservar && listoAntes && JSON.stringify(VF.rec) === JSON.stringify(rec) && vacio === (VF.estado === "vacio");
  VF.rec = rec;
  VF.estado = vacio ? "vacio" : "listo";
  VF.sucio = false; VF.guardando = false; VF.campos = null; VF.nuevo = false;
  if(!sinCambios) vfRepintar();
}
function vfReintentar(){ vfCargar(false); }

/* ======================================================================
   RENDER
   ====================================================================== */
function vfRepintar(){
  if(EXP.tab !== "vf") return;
  const p = _vfEl("panelExp"); if(!p) return;
  p.innerHTML = vfPanelHtml();
}
function vfAvisosHtml(){
  const a = VF.avisos || [];
  if(!a.length) return "";
  return `${avisosCuerpoHtml(a)}
    <button type="button" class="btn btn-ghost btn-mini" onclick="vfCerrarAvisos()">Entendido</button>`;
}
function vfCerrarAvisos(){ VF.avisos = []; const el = _vfEl("vfAvisos"); if(el){ el.innerHTML = ""; el.hidden = true; } }

function vfPanelHtml(){
  const cab = (extra) => `<h3 id="vfTitulo" tabindex="-1"><span class="ic" aria-hidden="true">♿</span> VF · Valoración funcional (BUND / CIF) ${extra || ""}</h3>`;
  if(VF.hceId !== EXP.id || VF.estado === "cargando") return `<div class="info-card">${cab()}<div class="ib"><div class="hint" role="status">Cargando…</div></div></div>`;
  if(VF.estado === "error"){
    return `<div class="info-card">${cab()}<div class="ib"><div class="empty-state" role="alert"><div class="big" aria-hidden="true">!</div>${escHtml(VF.error)}<br>
      <button type="button" class="btn btn-primary btn-mini" style="margin-top:10px" onclick="vfReintentar()">Reintentar</button></div></div></div>`;
  }
  if(VF.estado === "vacio" && !VF.nuevo){
    return `<div class="info-card">${cab()}<div class="ib">
      <div class="empty-state" role="status"><div class="big" aria-hidden="true">♿</div>
        Todavía no se registró una valoración funcional para este expediente.<br>
        <span class="hint">Es un estado normal: se registra cuando el equipo cuenta con la información. Todos los campos son opcionales.</span><br>
        <button type="button" class="btn btn-primary" id="btnVfNuevo" style="margin-top:12px" onclick="vfNuevo()">+ Registrar valoración funcional</button></div>
    </div></div>`;
  }
  return vfEditorHtml();
}
function vfNuevo(){
  VF.nuevo = true; VF.campos = null; VF.sucio = false;
  vfRepintar();
  const t = _vfEl("vf_estado"); if(t) t.focus();
}

const _cvV = (id, base) => (VF.campos && Object.prototype.hasOwnProperty.call(VF.campos, id)) ? VF.campos[id] : base;
function vfEditorHtml(){
  const rec = VF.rec, crear = !rec, r = rec || {}, dom = r.dominios || {};
  const campo = (id, rot, base, area, extra) => area
    ? `<div class="field"><label for="${id}">${rot}</label><textarea id="${id}" data-vf aria-describedby="err_${id}" oninput="vfSucio()"${extra || ""}>${escHtml(_cvV(id, base || ""))}</textarea><div class="ev-err" id="err_${id}"></div></div>`
    : "";
  const input = (id, rot, base, tipo, hint, modo) => `<div class="field"><label for="${id}">${rot}</label>
    <input id="${id}" type="${tipo || "text"}" data-vf${modo ? ` inputmode="${modo}"` : ""} value="${escHtml(_cvV(id, base === null || base === undefined ? "" : base))}" aria-describedby="${hint ? "hint_" + id + " " : ""}err_${id}" oninput="vfSucio()" autocomplete="off">
    ${hint ? `<div class="hint" id="hint_${id}">${hint}</div>` : ""}<div class="ev-err" id="err_${id}"></div></div>`;
  const estadoActual = _cvV("vf_estado", r.estado || "");
  const estadosOpc = (VF_ESTADOS.includes(estadoActual) || !estadoActual ? VF_ESTADOS : [estadoActual, ...VF_ESTADOS])
    .map(c => `<option value="${escHtml(c)}"${c === estadoActual ? " selected" : ""}>${escHtml(c)}</option>`).join("");
  const filasDom = VF_DOMINIOS.map(([k, n, ref]) => {
    const id = "vf_dom_" + k, actual = _cvV(id, _vfSel(dom[k]));
    const opts = (actual && !VF_NIVELES.includes(actual) ? [actual, ...VF_NIVELES] : VF_NIVELES)
      .map(x => `<option value="${escHtml(x)}"${x === actual ? " selected" : ""}>${escHtml(x || "— sin registrar —")}</option>`).join("");
    return `<tr><th scope="row"><label for="${id}">${escHtml(n)}</label></th><td class="vf-ref">${escHtml(ref)}</td>
      <td><select id="${id}" data-vf aria-describedby="err_${id}" onchange="vfSucio();vfNivelActualizar('${k}')">${opts}</select><div class="ev-err" id="err_${id}"></div></td>
      <td id="vf_chip_${k}">${vfNivelChipHtml(actual)}</td></tr>`;
  }).join("");
  const resultado = rec
    ? `<div class="vf-resultado" id="vfResultado" tabindex="-1" aria-label="Resultado calculado por el servidor">
        <div><span class="vf-rot">Categoría según el baremo (la calcula el servidor desde el %)</span> ${vfCategoriaHtml(rec)}</div>
        ${vfAlertaHtml(rec)}</div>`
    : `<p class="hint">La categoría según el baremo y la alerta de vigencia las calcula el servidor cuando se guarda la valoración.</p>`;
  return `<div class="info-card ev-card"><div class="ev-cab"><h3 id="vfTitulo" tabindex="-1"><span class="ic" aria-hidden="true">♿</span> VF · Valoración funcional (BUND / CIF)</h3>
      <span class="ev-estado"><span class="st ${rec ? "st-registrada" : "st-sin_iniciar"}"><span aria-hidden="true">${rec ? "●" : "○"}</span> ${rec ? "Registrada" : "Por registrar"}</span></span></div>
    <div class="ib">
      <p class="hint"><b>IPPU registra, no certifica (§7.1):</b> la valoración oficial la realizan los equipos habilitados (MSP, MIDES, BPS) mediante el <b>Baremo Único Nacional de Discapacidad — BUND</b> (Ley N.º 20.378 · Decreto 72/025), en base a IBMF, IRSA y el propio BUND. En menores de 2 años no aplica el BUND (sólo IBMF e IRSA). La constancia de valoración se adjunta en HCE-DOC.</p>
      <div id="vfAvisos" class="review-note avisos-api" role="status"${(VF.avisos || []).length ? "" : " hidden"}>${vfAvisosHtml()}</div>
      <div id="vfErrores" class="form-errores" role="alert" tabindex="-1" hidden></div>
    </div></div>

    <div class="card" style="margin-top:16px"><div class="cardhead" style="padding:13px 18px;border-bottom:1px solid var(--line)"><h2 style="font-size:.82rem;text-transform:uppercase;letter-spacing:.04em;color:var(--ink-2)">Valoración oficial (BUND) — registro</h2></div>
      <div style="padding:16px 18px">
        <div class="form-grid">
          <div class="field"><label for="vf_estado">Estado</label>
            <select id="vf_estado" data-vf aria-describedby="err_vf_estado" onchange="vfSucio()"><option value="">— sin registrar —</option>${estadosOpc}</select><div class="ev-err" id="err_vf_estado"></div></div>
          ${input("vf_fecha", "Fecha de valoración", r.fecha, "date")}
          ${input("vf_organismo", "Organismo / equipo valorador", r.organismo)}
          ${input("vf_pct", "Porcentaje de discapacidad (%)", r.pct, "text", "0 a 100, con hasta 2 decimales. Solo del dictamen oficial (BUND).", "decimal")}
          ${input("vf_vigencia", "Vigencia / próxima revisión", r.vigencia, "date")}
          ${input("vf_rnpcd", "N.º RNPcD (si está inscripto)", r.rnpcd)}
        </div>
        ${resultado}
        <div class="vf-salva"><b>Salvaguarda dura (§7.5):</b> los puntajes del IDEA y de la Escala IPPU-TEA <u>no se convierten ni se traducen</u> al % del baremo — miden constructos distintos. La categoría la deriva el servidor únicamente del % oficial; el navegador no la calcula.</div>
      </div></div>

    <div class="card" style="margin-top:16px"><div class="cardhead" style="padding:13px 18px;border-bottom:1px solid var(--line)"><h2 style="font-size:.82rem;text-transform:uppercase;letter-spacing:.04em;color:var(--ink-2)">Perfil funcional en clave CIF (§7.3) — autonomía, capacidades, barreras y apoyos</h2></div>
      <div style="padding:16px 18px">
        <div class="tabla-scroll"><table class="comp-table vf-doms"><caption class="sr-only">Nivel de autonomía por dominio de la vida diaria</caption>
          <thead><tr><th scope="col">Dominio de la vida diaria</th><th scope="col">Referencia CIF</th><th scope="col">Nivel de autonomía</th><th scope="col">Registrado</th></tr></thead><tbody>${filasDom}</tbody></table></div>
        <div class="form-grid full" style="margin-top:12px">
          ${campo("vf_capacidades", "Capacidades y fortalezas (qué puede, qué disfruta, qué lo motiva)", r.capacidades, true)}
          ${campo("vf_barreras", "Barreras del entorno (físicas, comunicacionales, actitudinales, de servicios)", r.barreras, true)}
          ${campo("vf_apoyos", "Apoyos y facilitadores existentes", r.apoyos, true)}
          ${campo("vf_obs", "Observaciones (consultas de la familia, gestiones en curso)", r.obs, true)}
          <div class="field"><label for="vf_sintesis">Síntesis funcional descriptiva (base del reporte a la familia)</label>
            <textarea id="vf_sintesis" data-vf style="min-height:110px" aria-describedby="hint_vf_sintesis err_vf_sintesis" oninput="vfSucio()">${escHtml(_cvV("vf_sintesis", r.sintesis_funcional || ""))}</textarea>
            <div class="hint" id="hint_vf_sintesis">La escriben los técnicos responsables: no se autogenera.</div><div class="ev-err" id="err_vf_sintesis"></div></div>
        </div>
      </div></div>

    <div class="idea-summary" id="vfResumen">
      <div class="nota">${crear ? "Se crea con lo que completes: todos los campos son opcionales." : "Se guarda sólo lo que cambiaste."} Después de guardar, la categoría y la alerta se muestran como las devolvió el servidor.</div>
      <div class="spacer"></div>
      <div class="ev-acciones" id="vfAcciones">${vfAccionesHtml()}</div>
    </div>

    <details class="vf-guia"><summary>Guía orientativa para la familia — categorías del baremo y prestaciones (§7.7) ${badgeSoloDemo()}</summary>
      <div class="tabla-scroll"><table class="comp-table" style="margin-top:10px"><caption class="sr-only">Categorías del baremo (guía estática)</caption><thead><tr><th scope="col">Categoría</th><th scope="col">Rango</th><th scope="col">Implicancia práctica orientativa</th></tr></thead><tbody>
        ${BUND_CATS.map(c => `<tr><th scope="row">${escHtml(c.cat)}</th><td class="num" style="text-align:left">${escHtml(c.rango)}</td><td>${escHtml(c.imp)}</td></tr>`).join("")}
      </tbody></table></div>
      <div class="tabla-scroll"><table class="comp-table" style="margin-top:12px"><caption class="sr-only">Prestaciones y beneficios (guía estática)</caption><thead><tr><th scope="col">Prestación / beneficio</th><th scope="col">Organismo</th><th scope="col">Orientación</th></tr></thead><tbody>
        ${PRESTACIONES.map(x => `<tr><th scope="row">${escHtml(x.n)}</th><td>${escHtml(x.o)}</td><td class="vf-ref">${escHtml(x.d)}</td></tr>`).join("")}
      </tbody></table></div>
      <p class="hint" style="margin-top:8px">Contenido informativo mantenido por coordinación, <b>sin respaldo en la API</b>: no clasifica nada ni genera trámites dentro de la HCE. La HCE orienta, los organismos resuelven; las gestiones concretas se registran en HCE-ORG.</p>
    </details>`;
}
function vfAccionesHtml(){
  const occ = VF.guardando, crear = !VF.rec;
  return `<button type="button" class="btn btn-primary" id="btnVfGuardar" onclick="vfGuardar()"${occ ? " disabled" : ""}>${occ ? "Guardando…" : (crear ? "✓ Crear valoración funcional" : "✓ Guardar cambios")}</button>
    ${crear ? `<button type="button" class="btn btn-ghost" id="btnVfCancelar" onclick="vfCancelarNuevo()"${occ ? " disabled" : ""}>Cancelar</button>`
            : `<button type="button" class="btn btn-ghost" id="btnVfReporte" onclick="vfAbrirReporte()"${occ ? " disabled" : ""}>🖨 Reporte de Valoración Funcional (familia)</button>`}`;
}
function vfPintarAcciones(){ const a = _vfEl("vfAcciones"); if(a) a.innerHTML = vfAccionesHtml(); }
function vfSucio(){ if(VF.estado === "listo" || VF.estado === "vacio") VF.sucio = true; }
function vfNivelActualizar(k){
  const sel = _vfEl("vf_dom_" + k), c = _vfEl("vf_chip_" + k);
  if(sel && c) c.innerHTML = vfNivelChipHtml(sel.value);
}
function vfCancelarNuevo(){ VF.nuevo = false; VF.campos = null; VF.sucio = false; vfRepintar(); const b = _vfEl("btnVfNuevo"); if(b) b.focus(); }
function vfSincronizar(){        // lo tipeado sin guardar no se pierde al cambiar de pestaña
  if((VF.estado !== "listo" && VF.estado !== "vacio") || EXP.tab !== "vf") return;
  const c = {};
  document.querySelectorAll("#panelExp [data-vf]").forEach(e => { if(e.id) c[e.id] = e.value; });
  if(Object.keys(c).length) VF.campos = c;
}

/* ======================================================================
   ESCRITURA
   ====================================================================== */
const VF_CAMPOS = [["estado", "vf_estado"], ["fecha", "vf_fecha"], ["organismo", "vf_organismo"], ["pct", "vf_pct"], ["vigencia", "vf_vigencia"],
  ["rnpcd", "vf_rnpcd"], ["capacidades", "vf_capacidades"], ["barreras", "vf_barreras"], ["apoyos", "vf_apoyos"], ["obs", "vf_obs"], ["sintesis_funcional", "vf_sintesis"]];
/* Solo lo que cambio respecto de lo guardado (valores tal cual; `pct` va como texto, el servidor lo valida). */
function vfCuerpo(){
  const rec = VF.rec, body = {};
  VF_CAMPOS.forEach(([campo, id]) => {
    const ahora = _bruto(id), base = rec ? _baseTxt(rec[campo]) : "";
    if(ahora !== base) body[campo] = ahora;
  });
  const dominios = {};
  VF_DOMINIOS.forEach(([k]) => {
    const ahora = _bruto("vf_dom_" + k), base = rec && rec.dominios ? _vfSel(rec.dominios[k]) : "";
    if(ahora !== base) dominios[k] = ahora;      // "" = borrar ese nivel (PATCH fusiona dominio por dominio)
  });
  if(Object.keys(dominios).length) body.dominios = dominios;
  return body;
}
function vfMapaCampo(campo){
  if(!campo) return null;
  let m;
  if((m = /^dominios\.(\w+)/.exec(campo))){
    const d = VF_DOMINIOS.find(x => x[0] === m[1]);
    return {ctl: "vf_dom_" + m[1], err: "err_vf_dom_" + m[1], rot: "Nivel — " + (d ? d[1].split(" (")[0] : m[1])};
  }
  const t = {estado: ["vf_estado", "Estado"], fecha: ["vf_fecha", "Fecha de valoración"], organismo: ["vf_organismo", "Organismo"], pct: ["vf_pct", "Porcentaje de discapacidad"],
    vigencia: ["vf_vigencia", "Vigencia"], rnpcd: ["vf_rnpcd", "N.º RNPcD"], capacidades: ["vf_capacidades", "Capacidades"], barreras: ["vf_barreras", "Barreras"],
    apoyos: ["vf_apoyos", "Apoyos"], obs: ["vf_obs", "Observaciones"], sintesis_funcional: ["vf_sintesis", "Síntesis funcional"], dominios: ["vf_dom_comunicacion", "Dominios"]}[campo];
  return t ? {ctl: t[0], err: "err_" + t[0], rot: t[1]} : null;
}
function vfLimpiarErrores(){
  const p = _vfEl("panelExp"); if(!p) return;
  p.querySelectorAll(".ev-err").forEach(e => { e.textContent = ""; });
  p.querySelectorAll("[aria-invalid]").forEach(e => e.removeAttribute("aria-invalid"));
  p.querySelectorAll(".field.invalid").forEach(e => e.classList.remove("invalid"));
  const r = _vfEl("vfErrores"); if(r){ r.hidden = true; r.innerHTML = ""; }
}
function vfMostrarErrores(err, titulo){
  const detalle = err instanceof ApiError && err.detail.length ? err.detail : [{campo: null, mensaje: err.message || "No se pudo completar la acción."}];
  const items = detalle.map(d => { const m = vfMapaCampo(d.campo); if(m) evMarcar(m, d.mensaje); return {m, mensaje: d.mensaje}; });
  const r = _vfEl("vfErrores"); if(!r) return;
  r.innerHTML = `<b>${escHtml(titulo)}</b><ul>` + items.map(it => it.m
    ? `<li><a href="#${escHtml(it.m.ctl)}" onclick="return evIr('${escHtml(it.m.ctl)}')">${escHtml(it.m.rot)}: ${escHtml(it.mensaje)}</a></li>`
    : `<li>${escHtml(it.mensaje)}</li>`).join("") + `</ul>`;
  r.hidden = false; r.scrollIntoView({block: "center"}); r.focus({preventScroll: true});
}

async function vfGuardar(){
  if(VF.guardando || (VF.estado !== "listo" && VF.estado !== "vacio")) return;
  const mi = EXP.seq, id = EXP.id, crear = !VF.rec;
  vfLimpiarErrores();
  const body = vfCuerpo();
  if(!crear && !Object.keys(body).length){ VF.avisos = []; vfCerrarAvisos(); toast("No hay cambios para guardar"); return; }
  VF.guardando = true; vfPintarAcciones();
  try{
    const r = crear
      ? await apiFetch(`/hce/${id}/valoracion-funcional`, {method: "POST", body})
      : await apiFetch(`/hce/${id}/valoracion-funcional`, {method: "PATCH", body});
    if(mi !== EXP.seq || VF.hceId !== id) return;
    // Se vuelve a pintar TODO desde la respuesta: la categoría y la alerta son las del servidor, no las del formulario.
    VF.rec = r.data; VF.estado = "listo"; VF.nuevo = false; VF.sucio = false; VF.campos = null; VF.guardando = false; VF.avisos = r.warnings || [];
    vfRepintar();
    const t = _vfEl("vfResultado") || _vfEl("vfTitulo"); if(t) t.focus();
    toast(crear ? "Valoración funcional creada" : "Valoración funcional guardada");
  }catch(err){
    if(mi !== EXP.seq || VF.hceId !== id) return;
    VF.guardando = false; vfPintarAcciones();
    if(err instanceof ApiError && err.status === 409){       // otro usuario ya la creó: se muestra lo que hay en el servidor
      VF.avisos = [{mensaje: err.message + " Se muestra la valoración tal como está en el servidor.", conflicto: true}];
      VF.sucio = false; VF.nuevo = false;
      await vfCargar(false);
      const t = _vfEl("vfTitulo"); if(t) t.focus();
      return;
    }
    vfMostrarErrores(err, crear ? "No se pudo crear la valoración:" : "No se pudo guardar:");
  }
}

/* ======================================================================
   REPORTE IMPRESO (§7.6): descriptivo, a demanda, para la familia. Las secciones vacías NO aparecen.
   Todo sale de la API: VF (con su categoría), PB del año (la lectura del Δ B−A la hizo el servidor) y el expediente.
   ====================================================================== */
const VF_NOMBRE_ESC = ["la relación con otras personas", "la comunicación", "el manejo de los cambios y las rutinas", "el juego, la imitación y la imaginación"];
const INF_VOLVER_VF = `<button type="button" class="btn-print" onclick="vfVolverAlExpediente()">‹ Volver al expediente</button>`;
function vfVolverAlExpediente(){
  go("expediente");
  if(EXP.id !== null) selTabExp("vf", true);
}
async function vfAbrirReporte(){
  const mi = EXP.seq, id = EXP.id;
  if(id === null) return;
  const n = ++ICDOC.seq;                          // el contador del documento impreso es uno solo (IC y reporte comparten la vista)
  const cont = _vfEl("informeContent"); if(!cont) return;
  const nombre = EXP.hce ? `${EXP.hce.nombre} ${EXP.hce.apellido}`.trim() : "";
  const titulo = `Reporte de Valoración Funcional — ${nombre}`;
  go("informe");
  cont.innerHTML = `${infBannerHtml(titulo, "Cargando el reporte…", INF_VOLVER_VF)}<div class="card"><div class="cardbody"><div class="hint" role="status">Cargando el reporte…</div></div></div>`;
  _infEnfocar();
  const [rv, rp, rh, rf] = await Promise.allSettled([apiFetch(`/hce/${id}/valoracion-funcional`), apiFetch(`/hce/${id}/protocolo`), apiFetch(`/hce/${id}`), evCargarProfesionales()]);
  if(mi !== EXP.seq || n !== ICDOC.seq) return;
  if(rv.status === "rejected" || rh.status === "rejected"){
    const e = (rv.status === "rejected" ? rv : rh).reason;
    cont.innerHTML = `${infBannerHtml(titulo, "No se pudo cargar el reporte", INF_VOLVER_VF)}<div class="card"><div class="cardbody"><div class="empty-state" role="alert"><div class="big" aria-hidden="true">!</div>${escHtml(e instanceof ApiError ? e.message : "No se pudo cargar el reporte.")}<br>
      <button type="button" class="btn btn-primary btn-mini" style="margin-top:10px" onclick="vfAbrirReporte()">Reintentar</button></div></div></div>`;
    _infEnfocar();
    return;
  }
  const anio = EXP.flujo ? EXP.flujo.anio : null;
  const pb = rp.status === "fulfilled" && anio !== null ? _recDeLista("pb", rp.value.data, anio) : null;
  cont.innerHTML = vfReporteHtml(rv.value.data, rh.value.data, pb);
  _infEnfocar();
}
function vfReporteHtml(V, hce, pb){
  const per = hce.persona || {}, g = hce.grupo || null;
  const nombre = `${per.nombre || ""} ${per.apellido || ""}`.trim();
  const edad = edadALaFecha(per.fecha_nac, V.fecha);      // a la fecha de la propia valoración, no al reloj del navegador
  const hoy = new Date();
  const fechaGen = `${String(hoy.getDate()).padStart(2, "0")}/${String(hoy.getMonth() + 1).padStart(2, "0")}/${hoy.getFullYear()}`;
  const dom = V.dominios || {};
  const doms = VF_DOMINIOS.filter(([k]) => dom[k]);
  const lleno = (t) => t !== null && t !== undefined && String(t).trim() !== "";
  const parrafos = (t) => String(t).split("\n").filter(x => x.trim()).map(x => `<p class="doc-p">${escHtml(x)}</p>`).join("");
  const card = (titulo, inner) => `<div class="card doc-seccion" style="margin-top:16px"><div class="cardhead"><h2>${titulo}</h2></div><div class="cardbody">${inner}</div></div>`;
  // Evolución del año en palabras: la lectura del Δ B−A de cada escala la calculó el servidor (sin números crudos).
  const interp = pb && pb.firmado && pb.deltas ? pb.interpretacion : null;
  const evol = interp ? IC_ESC_PROT.map((c, i) => interp[c]
    ? `<p class="doc-p"><b>${escHtml(VF_NOMBRE_ESC[i].charAt(0).toUpperCase() + VF_NOMBRE_ESC[i].slice(1))}:</b> ${escHtml(interp[c].etiqueta)}.</p>` : "").join("") : "";
  const tecnicos = g ? [g.tecnico1, g.tecnico2].filter(Boolean).map(t => escHtml(t.nombre)).join(" · ") : "";
  const oficial = [
    V.estado ? `<b>Estado:</b> ${escHtml(V.estado)}` : "",
    V.fecha ? `valorado el ${fmtFecha(V.fecha)}` : "", V.organismo ? `por ${escHtml(V.organismo)}` : "",
    V.vigencia ? `vigencia hasta ${fmtFecha(V.vigencia)}` : "", V.rnpcd ? `inscripto en el RNPcD (${escHtml(V.rnpcd)})` : ""].filter(Boolean).join(" · ");
  const cuerpo = `
    <div class="card"><div class="cardbody">
      <div class="membrete">
        <h2>FUNDACIÓN IPPU · Instituto Psico Pedagógico Uruguayo</h2>
        <div class="sub">INAU · MSP · BPS · ECOSOC/ONU · Montevideo, Uruguay</div>
        <h3>Reporte de Valoración Funcional — documento descriptivo y orientativo</h3>
      </div>
      <dl class="ib doc-datos">
        <div class="data-row"><dt>Nombre</dt><dd>${escHtml(nombre)}${edad === null ? "" : " · " + edad + (edad === 1 ? " año" : " años")}</dd></div>
        <div class="data-row"><dt>N.º de HC</dt><dd>${escHtml(hce.hc_historico)}</dd></div>
        <div class="data-row"><dt>Grupo</dt><dd>${g ? "Grupo " + escHtml(g.nombre) : "—"}</dd></div>
        <div class="data-row"><dt>Fecha de impresión</dt><dd>${fechaGen}</dd></div>
      </dl>
      <p class="doc-aviso">Este reporte describe capacidades, autonomía, barreras y apoyos para acompañar a la familia en la planificación cotidiana y la gestión de prestaciones. <b>No es un certificado de discapacidad ni un informe clínico:</b> la valoración oficial corresponde a los equipos habilitados mediante el BUND (Ley N.º 20.378), y el documento clínico anual es el Informe de Cierre (HCE-IC).</p>
    </div></div>
    ${lleno(V.capacidades) ? card("Capacidades y fortalezas", parrafos(V.capacidades)) : ""}
    ${lleno(V.sintesis_funcional) ? card("Perfil funcional descriptivo", parrafos(V.sintesis_funcional)) : ""}
    ${evol ? card("Evolución del año, en palabras", evol + `<p class="doc-nota">Lectura del seguimiento del año, calculada por el servidor a partir de los protocolos A y B. Los detalles clínicos completos están en el Informe de Cierre Anual (documento único).</p>`) : ""}
    ${doms.length ? card("Autonomía en la vida diaria", `<table class="comp-table"><caption class="sr-only">Nivel de autonomía por dominio</caption><tbody>${doms.map(([k, n]) => `<tr><th scope="row">${escHtml(n.split(" (")[0])}</th><td>${vfNivelChipHtml(dom[k])}</td></tr>`).join("")}</tbody></table>
      <p class="doc-nota">«Apoyo» refiere a la ayuda de otra persona, una adaptación o un producto de apoyo para realizar la actividad.</p>`) : ""}
    ${lleno(V.barreras) || lleno(V.apoyos) ? card("Barreras del entorno y apoyos con los que cuenta",
      `${lleno(V.barreras) ? `<p class="doc-p"><b>Barreras identificadas:</b> ${escHtml(V.barreras)}</p>` : ""}${lleno(V.apoyos) ? `<p class="doc-p"><b>Apoyos y facilitadores:</b> ${escHtml(V.apoyos)}</p>` : ""}`) : ""}
    ${card("Situación de la valoración oficial y orientación sobre prestaciones",
      `${oficial ? `<p class="doc-p">${oficial}.</p>` : ""}
       ${V.categoria ? `<p class="doc-p"><b>Categoría según el baremo:</b> ${escHtml(V.categoria.categoria)} (${escHtml(V.categoria.rango)}). ${escHtml(V.categoria.implicancia)}</p>` : ""}
       <p class="doc-nota">La familia puede consultar al equipo de IPPU por la gestión de prestaciones (BPS, MIDES, Sistema de Cuidados, transporte, apoyos educativos). El otorgamiento de cada prestación es resolución del organismo competente.</p>`)}
    <div class="card doc-seccion doc-cierre" style="margin-top:16px"><div class="cardbody">
      <div class="firmas-grid" style="grid-template-columns:1fr 1fr">
        <div><label>Por el equipo técnico</label><div class="flin"></div><div class="fnom">${tecnicos || "—"}</div></div>
        <div><label>Recibido por la familia</label><div class="flin"></div><div class="fnom">${escHtml(per.referente || "")}</div></div>
      </div>
      <p class="doc-pie">Documento descriptivo generado desde la HCE de IPPU · Uso familiar y de orientación · No es certificado de discapacidad ni informe clínico · Ley N.º 18.331/2008 · Demo — datos simulados</p>
    </div></div>`;
  const encabezado = `<b>Fundación IPPU · Reporte de Valoración Funcional</b> — ${escHtml(nombre)} · N.º de HC ${escHtml(hce.hc_historico)} · C.I. ${escHtml(ciFormateada(per.ci))}`;
  return `${infBannerHtml(`Reporte de Valoración Funcional — ${nombre}`, `Documento descriptivo para la familia · generable a demanda · vista previa del ${fechaGen}`,
    `<button type="button" class="btn-print" onclick="window.print()">🖨 Imprimir / guardar como PDF</button>${INF_VOLVER_VF}`)}${infHojaHtml(encabezado, cuerpo)}`;
}
