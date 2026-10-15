/* HCE-IC CONECTADO a la API: Informe de Cierre Anual, su documento impreso y el recibí - Fase 3-d (handoff §5.126).
   Demo L1 HCE+IDEA - IPPU x UTEC-LIDIA.

   Vive en la pestaña IC del expediente (expediente.js); el documento impreso es una vista aparte (`view-informe`)
   que se abre desde esa pestaña. Ya no hay selector de NNA ni estado propio: todo sale de y va a la API.
     IC          GET/POST /hce/{id}/informe-cierre · GET/PATCH /informe-cierre/{id}
     firmar      POST /informe-cierre/{id}/firmar {firmantes:[id, id]}  (dos profesionales distintos y activos)
     addendas    POST /informe-cierre/{id}/addendas {texto}   (el autor es el usuario del token)
     recibí      POST /informe-cierre/{id}/recibi {firmante, fecha}   (una vez, sólo con el IC firmado)
     impreso     GET /informe-cierre/{id}/documento (sólo IC firmado; 409 si no) + GET /hce/{id} (cédula, CIE-11)
   Reglas duras, todas del servidor (esto es solo presentacion):
   - tablas y radares usan lo que devuelve la API (esc_*, total, deltas, interpretacion, alertas); el navegador
     no suma ni resta nada: sin lbTotales / protTotales / delta local;
   - la secuencia solo avisa (warnings[]): nada se bloquea por LB/PA/PB sin firmar (§5.95);
   - la validacion es el 422 de la API, con `campo` (sint_escala.esc_2, firmantes.1, fecha...);
   - el documento impreso muestra a quienes FIRMARON (informe.firmas[]), nunca los tecnicos del grupo de hoy.
   Los scripts se cargan en orden en index.html: el orden ES la semantica. */

const IC_ESC_IDEA = ["esc_a", "esc_b", "esc_c", "esc_d"];     // escalas del IDEA (0-24)
const IC_ESC_PROT = ["esc_1", "esc_2", "esc_3", "esc_4"];     // escalas de la IPPU-TEA (6-30); tambien las claves de sint_escala
const IC = {hceId: null, estado: "cargando", rec: null, idea: null, pa: null, pb: null, cuantError: false, carga: 0, anio: null,
  avisos: [], campos: null, sucio: false, guardando: false, confirmando: false, addBorrador: "", error: "", reintento: "", huella: ""};
const ICDOC = {seq: 0, estado: "cargando", data: null, hce: null, error: "", hceId: null, sinInforme: false};
const _icEl = (id) => document.getElementById(id);

/* Otro expediente / cierre de sesion: nada del informe anterior queda en memoria ni en pantalla. */
function icReiniciar(){
  IC.carga++; ICDOC.seq++;
  Object.assign(IC, {hceId: null, estado: "cargando", rec: null, idea: null, pa: null, pb: null, cuantError: false, anio: null,
    avisos: [], campos: null, sucio: false, guardando: false, confirmando: false, addBorrador: "", error: "", reintento: "", huella: ""});
  Object.assign(ICDOC, {estado: "cargando", data: null, hce: null, error: "", hceId: null, sinInforme: false});
  const c = _icEl("informeContent"); if(c) c.innerHTML = "";
}

/* ======================================================================
   RADAR + TABLA (solo lo que devuelve la API)
   ====================================================================== */
/* Radar SVG propio (4 ejes = escalas). Dibuja UN instrumento por llamada: la no homologabilidad (§5.2) prohibe
   mezclar series IDEA e IPPU-TEA. Una serie lleva su estilo de trazo (continuo / punteado) y de marca (circulo /
   cuadrado) ademas del color: ningun dato depende solo del color. */
function radarSVG(series, size, descripcion){
  size = size || 280;
  const cx = size / 2, cy = size / 2, R = size / 2 - 50, N = IPPU_ESCALAS.length;
  const pt = (i, fr) => { const a = -Math.PI / 2 + i * 2 * Math.PI / N; return [cx + R * fr * Math.cos(a), cy + R * fr * Math.sin(a)]; };
  const alt = descripcion || ("Radar por escala: " + series.map(se => `${se.nombre || "serie"}: ${se.vals.map((v, i) => `${IPPU_ESCALAS[i]} ${v === null || v === undefined ? "sin dato" : v}`).join(", ")}`).join(". "));
  let s = `<svg viewBox="0 0 ${size} ${size}" width="${size}" style="max-width:100%" role="img" aria-label="${escHtml(alt)}"><title>${escHtml(alt)}</title>`;
  for(let g = 1; g <= 4; g++)
    s += `<polygon points="${Array.from({length: N}, (_, i) => pt(i, g / 4).join(",")).join(" ")}" fill="none" stroke="#D8E2EC" stroke-width="1"/>`;
  const cortas = [["Relación", "Social"], ["Comunicación", "y Lenguaje"], ["Anticipación", "y Flexib."], ["Simbolización"]];
  for(let i = 0; i < N; i++){
    const [x, y] = pt(i, 1); s += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#D8E2EC"/>`;
    const [lx0, ly] = pt(i, 1.28);
    const lx = Math.min(Math.max(lx0, 38), size - 38);   // que las etiquetas no se recorten en el borde
    cortas[i].forEach((t, li) => s += `<text x="${lx}" y="${ly - 4 + li * 11}" font-size="9.5" font-weight="600" fill="#43596E" text-anchor="middle">${t}</text>`);
  }
  series.forEach(se => {
    const vals = se.vals.map(v => typeof v === "number" ? v : 0);
    const pts = vals.map((v, i) => pt(i, Math.max(.03, v / se.max)).join(",")).join(" ");
    s += `<polygon points="${pts}" fill="${se.color}22" stroke="${se.color}" stroke-width="2"${se.dash ? ' stroke-dasharray="7 4"' : ""}/>`;
    vals.forEach((v, i) => {
      const [x, y] = pt(i, Math.max(.03, v / se.max));
      s += se.dash ? `<rect x="${x - 3.2}" y="${y - 3.2}" width="6.4" height="6.4" fill="${se.color}"/>` : `<circle cx="${x}" cy="${y}" r="3.2" fill="${se.color}"/>`;
    });
  });
  return s + "</svg>";
}

/* Datos de la tabla y de los radares: SOLO modulos firmados, tal como los devuelve la API. `deltas`, `interpretacion` y
   `alertas` son los del PB (B - A, calculados por el servidor al firmar el B). Nada se suma ni se resta aca. */
function icCuantDatos(f){
  const fi = f.idea && f.idea.firmado ? f.idea : null, fa = f.a && f.a.firmado ? f.a : null, fb = f.b && f.b.firmado ? f.b : null;
  return {
    lb: fi ? {esc: IC_ESC_IDEA.map(c => fi[c]), total: fi.total} : null,
    pa: fa ? {esc: IC_ESC_PROT.map(c => fa[c]), total: fa.total} : null,
    pb: fb ? {esc: IC_ESC_PROT.map(c => fb[c]), total: fb.total} : null,
    deltas: fb && f.deltas ? f.deltas : null,
    interpretacion: fb ? (f.interpretacion || null) : null,
    alertas: fb ? (f.alertas || []) : []
  };
}
const _icN = (v, de) => (v === null || v === undefined) ? "—" : `${escHtml(v)}${de ? " / " + de : ""}`;
function icDeltaCelda(d, clave, esTotal){
  const v = d.deltas ? d.deltas[clave] : null;
  if(v === null || v === undefined) return "—";
  const al = !esTotal && d.alertas.some(a => a.escala === clave) ? ` <span class="ev-alerta"><span aria-hidden="true">⚠</span> alerta</span>` : "";
  const it = esTotal && d.interpretacion && d.interpretacion.total ? ` · ${escHtml(d.interpretacion.total.etiqueta)}` : "";
  return `<b>${fmtDelta(v)}${it}</b>${al}`;
}
function icTablaHtml(d){
  const filas = IPPU_ESCALAS.map((n, i) => `<tr>
      <th scope="row">E${i + 1} · ${escHtml(n)}</th>
      <td class="num">${d.lb ? _icN(d.lb.esc[i], 24) : "—"}</td>
      <td class="num">${d.pa ? _icN(d.pa.esc[i], 30) : "—"}</td>
      <td class="num">${d.pb ? _icN(d.pb.esc[i], 30) : "—"}</td>
      <td class="num">${icDeltaCelda(d, IC_ESC_PROT[i], false)}</td></tr>`).join("");
  const alertas = d.alertas.length
    ? `<div class="review-note ev-alertas"><span aria-hidden="true">⚠</span><div><b>Alerta institucional:</b> ${d.alertas.map(a => `${escHtml(IPPU_ESCALAS[IC_ESC_PROT.indexOf(a.escala)] || a.escala)} (Δ ${fmtDelta(a.delta)}, ${escHtml(a.etiqueta)})`).join(" · ")}. La registra el servidor al firmar el PB.</div></div>`
    : "";
  return `<div class="tabla-scroll"><table class="comp-table ic-tabla"><caption class="sr-only">Puntajes de las cuatro escalas en el IDEA, el protocolo A y el protocolo B, y la diferencia B menos A</caption>
    <thead><tr><th scope="col">Escala</th><th scope="col" class="num">IDEA — línea base (0–24)</th><th scope="col" class="num">Protocolo A (6–30)</th><th scope="col" class="num">Protocolo B (6–30)</th><th scope="col" class="num">Δ B−A</th></tr></thead>
    <tbody>${filas}
      <tr class="ic-total"><th scope="row">Total</th>
        <td class="num"><b>${d.lb ? _icN(d.lb.total, 96) : "—"}</b></td>
        <td class="num"><b>${d.pa ? _icN(d.pa.total, 120) : "—"}</b></td>
        <td class="num"><b>${d.pb ? _icN(d.pb.total, 120) : "—"}</b></td>
        <td class="num">${icDeltaCelda(d, "total", true)}</td></tr>
    </tbody></table></div>${alertas}
    <p class="ic-nota">Nota metodológica: los puntajes IDEA (severidad, 0–96) y los IPPU-TEA (progreso, 24–120) <b>no son homologables</b>; el Δ es válido únicamente entre los Protocolos A y B (§5.2). «—»: ese módulo todavía no está firmado. El sistema mide el progreso, no su causa.</p>`;
}
function icLeyendaLinea(color, dash){
  return `<svg width="28" height="10" aria-hidden="true" focusable="false"><line x1="1" y1="5" x2="27" y2="5" stroke="${color}" stroke-width="2.4"${dash ? ' stroke-dasharray="7 4"' : ""}/></svg>`;
}
function icRadaresHtml(d){
  const bloques = [];
  if(d.lb) bloques.push(`<div class="rwrap"><div class="rcap">Perfil IDEA — línea base (severidad)</div>${radarSVG([{nombre: "IDEA", color: "#1B7F8C", vals: d.lb.esc, max: 24}], 260)}</div>`);
  const serieProt = [];
  if(d.pa) serieProt.push({nombre: "Protocolo A", color: "#43596E", vals: d.pa.esc, max: 30, dash: true});
  if(d.pb) serieProt.push({nombre: "Protocolo B", color: "#173F73", vals: d.pb.esc, max: 30});
  if(serieProt.length) bloques.push(`<div class="rwrap"><div class="rcap">Progreso IPPU-TEA (A vs. B)</div>${radarSVG(serieProt, 260)}
    <div class="ic-legend">${d.pa ? `<span>${icLeyendaLinea("#43596E", true)}Protocolo A (punteado)</span>` : ""}${d.pb ? `<span>${icLeyendaLinea("#173F73", false)}Protocolo B (continuo)</span>` : ""}</div></div>`);
  if(!bloques.length) return "";
  return `<div class="ic-radars">${bloques.join("")}
    <p class="ic-nota ic-radars-nota">Los radares se presentan por separado: los perfiles IDEA e IPPU-TEA nunca se superponen (§5.2).</p></div>`;
}

/* ======================================================================
   CARGA
   ====================================================================== */
/* Muestra la pestaña IC: si hay trabajo sin guardar se conserva; si no, se vuelve a leer de la API. */
function icMostrar(){
  if(IC.hceId === EXP.id && IC.estado === "listo"){
    if(IC.sucio){ icRepintar(); return; }
    IC.avisos = [];
    icRepintar();
    icCargar(true);
    return;
  }
  icCargar(false);
}

async function icCargar(conservar){
  const mi = EXP.seq, id = EXP.id;
  if(id === null) return;
  if(IC.hceId !== id){ icReiniciar(); IC.hceId = id; }
  else if(!conservar || IC.estado !== "listo") IC.estado = "cargando";
  const n = ++IC.carga;
  const vigente = () => mi === EXP.seq && IC.hceId === id && n === IC.carga;
  if(IC.estado === "cargando") icRepintar();

  const anio = EXP.flujo ? EXP.flujo.anio : null;
  if(anio === null || anio === undefined){
    IC.estado = "error"; IC.error = "No se pudo determinar el año del flujo: el estado de los módulos no se cargó."; IC.reintento = "flujo";
    icRepintar(); return;
  }
  IC.anio = anio;
  const [rc, ri, rp, rf] = await Promise.allSettled([apiFetch(`/hce/${id}/informe-cierre`), apiFetch(`/hce/${id}/idea`), apiFetch(`/hce/${id}/protocolo`), evCargarProfesionales()]);
  if(!vigente()) return;
  PROF_ERROR = rf.status === "rejected";
  if(rc.status === "rejected"){
    IC.estado = "error"; IC.error = rc.reason instanceof ApiError ? rc.reason.message : "No se pudo cargar el informe de cierre."; IC.reintento = "modulo";
    icRepintar(); return;
  }
  const rec = (rc.value.data || []).find(x => x.anio === anio) || null;
  const idea = ri.status === "fulfilled" ? _recDeLista("lb", ri.value.data, anio) : null;
  const pa = rp.status === "fulfilled" ? _recDeLista("pa", rp.value.data, anio) : null;
  const pb = rp.status === "fulfilled" ? _recDeLista("pb", rp.value.data, anio) : null;
  const cuantError = ri.status === "rejected" || rp.status === "rejected";
  const huella = JSON.stringify([rec, idea, pa, pb, cuantError]);
  const igual = conservar && IC.estado === "listo" && IC.huella === huella;
  const conservarTrabajo = conservar && IC.estado === "listo" && IC.sucio && !(rec && rec.firmado);
  Object.assign(IC, {rec, idea, pa, pb, cuantError, huella});
  if(EXP.mods) EXP.mods.ic = rec;
  if((igual && !IC.sucio) || conservarTrabajo){      // la relectura no trajo nada nuevo, o se empezó a tipear mientras llegaba: no se pisa nada
    pintarTabsExp(); pintarFlujo(); return;
  }
  IC.sucio = false; IC.confirmando = false; IC.guardando = false; IC.campos = null;
  IC.estado = "listo";
  icRepintar();
  pintarTabsExp(); pintarFlujo();
}
function icReintentar(){
  if(IC.reintento === "flujo") recargarFlujoExp(true).then(() => icCargar(false));
  else icCargar(false);
}

/* ======================================================================
   RENDER · pestaña IC
   ====================================================================== */
function icRepintar(){
  if(EXP.tab !== "ic") return;
  const p = _icEl("panelExp"); if(!p) return;
  const add = _icEl("ic_add_texto"); if(add) IC.addBorrador = add.value;
  p.innerHTML = icPanelHtml();
}
function icPanelHtml(){
  const cab = `<h3 id="icTitulo" tabindex="-1"><span class="ic" aria-hidden="true">✎</span> IC · Informe de cierre anual${IC.anio ? " — " + escHtml(IC.anio) : ""}</h3>`;
  if(IC.hceId !== EXP.id || IC.estado === "cargando") return `<div class="info-card">${cab}<div class="ib"><div class="hint" role="status">Cargando…</div></div></div>`;
  if(IC.estado === "error"){
    return `<div class="info-card">${cab}<div class="ib"><div class="empty-state" role="alert"><div class="big" aria-hidden="true">!</div>${escHtml(IC.error)}<br>
      <button type="button" class="btn btn-primary btn-mini" style="margin-top:10px" onclick="icReintentar()">Reintentar</button></div></div></div>`;
  }
  return IC.rec && IC.rec.firmado ? icLecturaHtml() : icEditorHtml();
}

function icEstadoHtml(){
  const est = estadoDeRec(IC.rec);
  const txt = est === "sin_iniciar" ? "Sin iniciar" : est === "en_curso" ? "En curso (borrador)" : "Firmado";
  const add = IC.rec && IC.rec.addendas ? addendaMarcaHtml(IC.rec.addendas.length, false) : "";
  return `<span class="st st-${est}"><span aria-hidden="true">${ESTADO_MOD_TXT[est].glifo}</span> ${txt}</span>${add}`;
}
function icEncabezadoHtml(){
  return `<div class="ev-cab"><h3 id="icTitulo" tabindex="-1"><span class="ic" aria-hidden="true">✎</span> IC · Informe de cierre anual — ${escHtml(IC.anio)}</h3>
    <span id="icEstado" class="ev-estado">${icEstadoHtml()}</span><span class="spacer" style="flex:1"></span>
    <button type="button" class="btn btn-ghost btn-mini" id="btnIcImpreso" onclick="icAbrirDocumento()">🖨 Ver informe impreso</button></div>`;
}
function icAvisosHtml(){
  const a = IC.avisos || [];
  if(!a.length) return "";
  return `${avisosCuerpoHtml(a)}
    <button type="button" class="btn btn-ghost btn-mini" onclick="icCerrarAvisos()">Entendido</button>`;
}
function icCerrarAvisos(){ IC.avisos = []; icPintarAvisos(); }
function icPintarAvisos(){
  const el = _icEl("icAvisos"); if(!el) return;
  const h = icAvisosHtml(); el.innerHTML = h; el.hidden = !h;
}

/* Bloque cuantitativo: IDEA, PA y PB del año tal como los devuelve la API. */
function icCuantCardHtml(){
  let cuerpo;
  if(IC.cuantError){
    cuerpo = `<p class="hint" role="alert">No se pudieron cargar los puntajes del año. <button type="button" class="btn btn-ghost btn-mini" onclick="icReintentar()">Reintentar</button></p>`;
  }else{
    const d = icCuantDatos({idea: IC.idea, a: IC.pa, b: IC.pb, deltas: IC.pb && IC.pb.deltas, interpretacion: IC.pb && IC.pb.interpretacion, alertas: IC.pb && IC.pb.alertas});
    cuerpo = `${icTablaHtml(d)}${icRadaresHtml(d)}`;
  }
  return `<div class="card" style="margin-top:16px"><div class="cardhead" style="padding:13px 18px;border-bottom:1px solid var(--line)"><h2 style="font-size:.82rem;text-transform:uppercase;letter-spacing:.04em;color:var(--ink-2)">Análisis cuantitativo — desde los módulos firmados de ${escHtml(IC.anio)}</h2></div>
    <div style="padding:16px 18px">${cuerpo}</div></div>`;
}

const _cvI = (id, base) => (IC.campos && Object.prototype.hasOwnProperty.call(IC.campos, id)) ? IC.campos[id] : base;
function icFirmanteInicial(n){
  if(IC.campos && Object.prototype.hasOwnProperty.call(IC.campos, "ic_f" + n)) return IC.campos["ic_f" + n] === "" ? null : Number(IC.campos["ic_f" + n]);
  const g = EXP.raw && EXP.raw.grupo, t = g ? g["tecnico" + n] : null;      // solo precarga: los firmantes se eligen al firmar
  return t ? t.id : null;
}
function icFirmantesHtml(){
  const lista = PROFESIONALES ? PROFESIONALES.lista : [];
  const sel = (n) => {
    const actual = icFirmanteInicial(n);
    const opts = lista.filter(p => p.activo || p.id === actual).map(p =>
      `<option value="${p.id}"${p.id === actual ? " selected" : ""}>${escHtml(p.nombre)}${p.especialidad ? " · " + escHtml(p.especialidad) : ""}${p.activo ? "" : " (inactivo)"}</option>`);
    if(actual !== null && !lista.some(p => p.id === actual)) opts.unshift(`<option value="${actual}" selected>Profesional n.º ${escHtml(actual)}</option>`);
    return `<div class="field"><label for="ic_f${n}">Firmante ${n} <span class="req" aria-hidden="true">*</span><span class="sr-only">(necesario para firmar)</span></label>
      <select id="ic_f${n}" data-ic aria-describedby="err_ic_f${n}" onchange="icSucio()"><option value="">— Elegí —</option>${opts.join("")}</select>
      <div class="ev-err" id="err_ic_f${n}"></div></div>`;
  };
  return `<div class="card" style="margin-top:16px"><div class="cardhead" style="padding:13px 18px;border-bottom:1px solid var(--line)"><h2 style="font-size:.82rem;text-transform:uppercase;letter-spacing:.04em;color:var(--ink-2)">Firmantes (firman los dos, en un solo acto)</h2></div>
    <div style="padding:16px 18px">
      ${PROF_ERROR ? `<p class="hint" role="alert">No se pudo cargar la lista de profesionales. <button type="button" class="btn btn-ghost btn-mini" onclick="icReintentar()">Reintentar</button></p>` : ""}
      <div class="form-grid">${sel(1)}${sel(2)}</div>
      <p class="hint">Se precargan los técnicos del grupo, pero se eligen al firmar: no quedan guardados en el borrador. Tienen que ser dos profesionales activos y distintos.</p>
    </div></div>`;
}

function icEditorHtml(){
  const rec = IC.rec || {}, se = rec.sint_escala || {};
  const escFields = IPPU_ESCALAS.map((n, i) => {
    const k = i + 1, id = "ic_esc" + k;
    return `<div class="field"><label for="${id}">E${k} · ${escHtml(n)} <span class="req" aria-hidden="true">*</span><span class="sr-only">(necesaria para firmar)</span></label>
      <textarea id="${id}" data-ic aria-describedby="err_${id}" oninput="icSucio()" placeholder="Síntesis cualitativa del año en ${escHtml(n)} (integra la línea base IDEA y el progreso A→B).">${escHtml(_cvI(id, se["esc_" + k] || ""))}</textarea>
      <div class="ev-err" id="err_${id}"></div></div>`;
  }).join("");
  const campo = (id, rot, base, extra) => `<div class="field"><label for="${id}">${rot} <span class="req" aria-hidden="true">*</span><span class="sr-only">(necesario para firmar)</span></label>
      <textarea id="${id}" data-ic aria-describedby="err_${id}" oninput="icSucio()"${extra || ""}>${escHtml(_cvI(id, base || ""))}</textarea><div class="ev-err" id="err_${id}"></div></div>`;
  return `<div class="info-card ev-card">${icEncabezadoHtml()}
    <div class="ib">
      <p class="hint">Integra los tres instrumentos (IDEA · Protocolo A · Protocolo B) con la síntesis cualitativa del equipo. Elaboración sugerida: en los días posteriores al cierre del Protocolo B. El PDF con membrete es <b>el único informe válido</b> (§5.3): se genera desde el informe firmado.</p>
      <div id="icAvisos" class="review-note avisos-api" role="status"${(IC.avisos || []).length ? "" : " hidden"}>${icAvisosHtml()}</div>
      <div id="evErrores" class="form-errores" role="alert" tabindex="-1" hidden></div>
    </div></div>
    ${icCuantCardHtml()}
    <div class="card" style="margin-top:16px">
      <div class="cardhead" style="padding:13px 18px;border-bottom:1px solid var(--line)"><h2 style="font-size:.82rem;text-transform:uppercase;letter-spacing:.04em;color:var(--ink-2)">Síntesis cualitativa por escala</h2></div>
      <div style="padding:16px 18px"><p class="hint">Extensión sugerida: ≈100 palabras por escala (el servidor avisa al firmar si queda corta; no bloquea).</p><div class="form-grid full">${escFields}</div></div>
    </div>
    <div class="card" style="margin-top:16px">
      <div class="cardhead" style="padding:13px 18px;border-bottom:1px solid var(--line)"><h2 style="font-size:.82rem;text-transform:uppercase;letter-spacing:.04em;color:var(--ink-2)">Valoraciones anuales, recomendaciones y orientaciones</h2></div>
      <div style="padding:16px 18px">
        <div class="form-grid full">
          ${campo("ic_val1", "Valoración anual — técnico/a 1", rec.val_tec1)}
          ${campo("ic_val2", "Valoración anual — técnico/a 2", rec.val_tec2)}
          ${campo("ic_recom", "Recomendaciones y ajustes de tratamiento", rec.recomendaciones)}
          ${campo("ic_orient", "Orientaciones concretas a la familia", rec.orientaciones)}
        </div>
        <div class="form-grid">
          <div class="field"><label for="ic_fecha">Fecha del informe <span class="req" aria-hidden="true">*</span><span class="sr-only">(necesaria para firmar)</span></label>
            <input id="ic_fecha" type="date" data-ic value="${escHtml(_cvI("ic_fecha", rec.fecha || ""))}" aria-describedby="err_ic_fecha" oninput="icSucio()"><div class="ev-err" id="err_ic_fecha"></div></div>
        </div>
      </div>
    </div>
    ${icFirmantesHtml()}
    <div class="idea-summary" id="icResumen">
      <div class="nota">Para firmar: síntesis de las 4 escalas + valoraciones de ambos técnicos + recomendaciones + orientaciones + fecha + los dos firmantes (§4.3). La firma (doble, un solo acto) bloquea el informe; después se registra el «recibí» de la familia y se imprime el PDF con membrete.</div>
      <div class="spacer"></div>
      <div class="ev-acciones" id="icAcciones">${icAccionesHtml()}</div>
    </div>`;
}
function icAccionesHtml(){
  const occ = IC.guardando;
  if(IC.confirmando && !occ){
    return `<div class="ev-confirma" role="group" aria-label="Confirmar la firma" onkeydown="icTeclaConfirma(event)">
      <span id="icConfirmaTxt">¿Firmar el informe de cierre? La firma bloquea el informe: después sólo se corrige por addenda.</span>
      <button type="button" class="btn btn-primary" style="background:var(--ok)" id="btnIcConfirmar" aria-describedby="icConfirmaTxt" onclick="icFirmar()">✓ Confirmar firma</button>
      <button type="button" class="btn btn-ghost" id="btnIcCancelar" aria-describedby="icConfirmaTxt" onclick="icCancelarFirma()">Cancelar</button></div>`;
  }
  return `<button type="button" class="btn btn-ghost" id="btnIcGuardar" onclick="icGuardar()"${occ ? " disabled" : ""}>${occ ? "Guardando…" : "Guardar borrador"}</button>
    <button type="button" class="btn btn-primary" style="background:var(--ok)" id="btnIcFirmar" onclick="icPedirFirma()"${occ ? " disabled" : ""}>✓ Firmar informe de cierre</button>`;
}
function icPintarAcciones(){ const a = _icEl("icAcciones"); if(a) a.innerHTML = icAccionesHtml(); }
function icSucio(){ if(IC.estado === "listo") IC.sucio = true; }
function icSincronizar(){        // lo tipeado sin guardar no se pierde al cambiar de pestaña
  const ta = _icEl("ic_add_texto"); if(ta) IC.addBorrador = ta.value;
  if(IC.estado !== "listo" || (IC.rec && IC.rec.firmado) || EXP.tab !== "ic") return;
  const c = {};
  document.querySelectorAll("#panelExp [data-ic]").forEach(e => { if(e.id) c[e.id] = e.value; });
  if(Object.keys(c).length) IC.campos = c;
}

/* ---------- solo lectura (firmado) ---------- */
function icLecturaHtml(){
  const r = IC.rec, se = r.sint_escala || {};
  const esc = IPPU_ESCALAS.map((n, i) => `<div class="data-row"><dt>E${i + 1} · ${escHtml(n)}</dt><dd class="ev-largo">${_txt(se["esc_" + (i + 1)])}</dd></div>`).join("");
  const recibi = r.recibi
    ? `${escHtml(r.recibi.firmante)} · registrado el ${r.recibi.fecha ? fmtFecha(r.recibi.fecha) : "—"}`
    : `Pendiente de registro <button type="button" class="btn btn-ghost btn-mini" id="btnIcRecibi" onclick="openRecibiModal()">✍ Registrar recibí</button>`;
  return `<div class="info-card ev-card">${icEncabezadoHtml()}
    <div class="ib"><div id="icAvisos" class="review-note avisos-api" role="status"${(IC.avisos || []).length ? "" : " hidden"}>${icAvisosHtml()}</div></div></div>
    ${icCuantCardHtml()}
    <div class="info-card" style="margin-top:16px"><h3><span class="ic" aria-hidden="true">❏</span> Análisis cualitativo por escala</h3><dl class="ib">${esc}</dl></div>
    <div class="info-card"><h3><span class="ic" aria-hidden="true">≡</span> Síntesis interdisciplinaria, recomendaciones y orientaciones</h3>
      <dl class="ib">
        <div class="data-row"><dt>Valoración anual — técnico/a 1</dt><dd class="ev-largo">${_txt(r.val_tec1)}</dd></div>
        <div class="data-row"><dt>Valoración anual — técnico/a 2</dt><dd class="ev-largo">${_txt(r.val_tec2)}</dd></div>
        <div class="data-row"><dt>Recomendaciones y ajustes</dt><dd class="ev-largo">${_txt(r.recomendaciones)}</dd></div>
        <div class="data-row"><dt>Orientaciones a la familia</dt><dd class="ev-largo">${_txt(r.orientaciones)}</dd></div>
        <div class="data-row"><dt>Fecha del informe</dt><dd>${r.fecha ? fmtFecha(r.fecha) : "—"}</dd></div>
      </dl></div>
    <div class="info-card"><h3><span class="ic" aria-hidden="true">◐</span> Firmas y recibí</h3>
      <dl class="ib">
        <div class="data-row"><dt>Firmado por</dt><dd>${evFirmasHtml(r)}</dd></div>
        <div class="data-row"><dt>Recibí de la familia</dt><dd id="icRecibiTxt">${recibi}</dd></div>
      </dl></div>
    ${icAddendasHtml()}`;
}
function icAddendasHtml(){
  const rec = IC.rec;
  const lista = (rec.addendas || []).map(a => `<li><b>${a.fecha ? fmtFecha(a.fecha) : "—"} · ${escHtml(nombreProfesional(a.profesional_id))}:</b> ${escHtml(a.texto)}</li>`).join("");
  return `<div class="info-card ev-add" id="icAddendas"><h3 id="icAddTitulo" tabindex="-1"><span class="ic" aria-hidden="true">✚</span> Addendas${addendaMarcaHtml((rec.addendas || []).length, false)}</h3>
    <div class="ib">
      ${lista ? `<ol class="ev-add-lista">${lista}</ol>` : `<p class="hint">Sin addendas. El informe firmado no se edita: toda corrección se agrega acá, con su fecha y su autor (quien tiene la sesión iniciada).</p>`}
      <div id="evAddErrores" class="form-errores" role="alert" tabindex="-1" hidden></div>
      <div class="field"><label for="ic_add_texto">Nueva addenda (corrección o aclaración)</label>
        <textarea id="ic_add_texto" aria-describedby="err_ic_add_texto">${escHtml(IC.addBorrador || "")}</textarea><div class="ev-err" id="err_ic_add_texto"></div></div>
      <div class="acciones-form"><button type="button" class="btn btn-primary" id="btnIcAdd" onclick="icAddenda()">+ Agregar addenda</button></div>
    </div></div>`;
}

/* ======================================================================
   ESCRITURA: cuerpo, guardar, firmar, addenda, recibí
   ====================================================================== */
/* campo de la API -> {ctl, err, rot} (lo usa evMostrarErrores de evaluaciones.js, con ev = {k:"ic"}) */
function icMapaCampo(campo){
  if(!campo) return null;
  let m;
  if((m = /^sint_escala\.esc_(\d)/.exec(campo))) return {ctl: "ic_esc" + m[1], err: "err_ic_esc" + m[1], rot: "Síntesis de E" + m[1]};
  if((m = /^firmantes(?:\.(\d))?/.exec(campo))){
    const n = m[1] === undefined ? 1 : (+m[1] + 1);
    return {ctl: "ic_f" + n, err: "err_ic_f" + n, rot: m[1] === undefined ? "Firmantes" : "Firmante " + n};
  }
  const t = {fecha: ["ic_fecha", "Fecha del informe"], val_tec1: ["ic_val1", "Valoración — técnico/a 1"], val_tec2: ["ic_val2", "Valoración — técnico/a 2"],
    recomendaciones: ["ic_recom", "Recomendaciones"], orientaciones: ["ic_orient", "Orientaciones a la familia"]}[campo];
  return t ? {ctl: t[0], err: "err_" + t[0], rot: t[1]} : null;
}
/* Solo lo que cambio respecto de lo guardado (valores tal cual, sin normalizar en el navegador). */
function icCuerpo(){
  const rec = IC.rec || {}, se = rec.sint_escala || {};
  const body = {};
  [["fecha", "ic_fecha", rec.fecha], ["val_tec1", "ic_val1", rec.val_tec1], ["val_tec2", "ic_val2", rec.val_tec2],
   ["recomendaciones", "ic_recom", rec.recomendaciones], ["orientaciones", "ic_orient", rec.orientaciones]].forEach(([campo, id, base]) => {
    const ahora = _bruto(id);
    if(ahora !== _baseTxt(base)) body[campo] = ahora;
  });
  const sint = {};
  [1, 2, 3, 4].forEach(k => { const ahora = _bruto("ic_esc" + k); if(ahora !== _baseTxt(se["esc_" + k])) sint["esc_" + k] = ahora; });
  if(Object.keys(sint).length) body.sint_escala = sint;
  return body;
}
/* Tras guardar, los campos muestran lo que quedo guardado (el servidor normaliza el texto), sin repintar el formulario. */
function icAplicarGuardado(){
  const r = IC.rec; if(!r) return;
  const se = r.sint_escala || {};
  const set = (id, v) => { const e = _icEl(id); if(e) e.value = _baseTxt(v); };
  set("ic_fecha", r.fecha); set("ic_val1", r.val_tec1); set("ic_val2", r.val_tec2); set("ic_recom", r.recomendaciones); set("ic_orient", r.orientaciones);
  [1, 2, 3, 4].forEach(k => set("ic_esc" + k, se["esc_" + k]));
}
function icOcupado(si){ IC.guardando = si; icPintarAcciones(); }

async function icGuardar(opts){
  if(IC.estado !== "listo" || IC.guardando) return false;
  const paraFirmar = !!(opts && opts.paraFirmar);
  const mi = EXP.seq, id = EXP.id;
  evLimpiarErrores();
  const body = icCuerpo();
  if(IC.rec && !Object.keys(body).length){
    if(!paraFirmar){ IC.avisos = []; icPintarAvisos(); toast("No hay cambios para guardar"); }
    return true;
  }
  if(!IC.rec) body.anio = IC.anio;
  icOcupado(true);
  try{
    const r = IC.rec
      ? await apiFetch(`/informe-cierre/${IC.rec.id}`, {method: "PATCH", body})
      : await apiFetch(`/hce/${id}/informe-cierre`, {method: "POST", body});
    if(mi !== EXP.seq || IC.hceId !== id) return false;
    IC.rec = r.data; IC.sucio = false; IC.campos = null; IC.avisos = r.warnings || []; IC.guardando = false;
    if(EXP.mods) EXP.mods.ic = IC.rec;
    icAplicarGuardado();
    const e = _icEl("icEstado"); if(e) e.innerHTML = icEstadoHtml();
    icPintarAcciones(); icPintarAvisos();
    pintarTabsExp(); pintarFlujo();
    if(!paraFirmar){ toast(r.status === 201 ? "Borrador creado" : "Borrador guardado"); refrescarListaTrasEscritura(); recargarFlujoExp(true); }
    return true;
  }catch(err){
    if(mi !== EXP.seq || IC.hceId !== id) return false;
    IC.guardando = false; icPintarAcciones();
    if(err instanceof ApiError && err.status === 409){ await icResolver409(err); return false; }
    evMostrarErrores({k: "ic"}, err, "No se pudo guardar:");
    return false;
  }
}

/* 409: el informe ya esta firmado (o ya existe): se vuelve a leer y se muestra lo que hay. */
async function icResolver409(err){
  IC.avisos = [{mensaje: err.message + " Se muestra el informe tal como está en el servidor.", conflicto: true}];
  IC.sucio = false;
  await icCargar(true);
  icPintarAvisos();
  recargarFlujoExp(true); refrescarListaTrasEscritura();
  const t = _icEl("icTitulo"); if(t) t.focus();
}

function icPedirFirma(){
  if(IC.guardando) return;
  IC.confirmando = true; icPintarAcciones();
  const b = _icEl("btnIcConfirmar"); if(b) b.focus();
}
function icTeclaConfirma(e){
  if(e.key !== "Escape") return;
  e.preventDefault(); e.stopPropagation();
  icCancelarFirma();
}
function icCancelarFirma(){
  IC.confirmando = false; icPintarAcciones();
  const b = _icEl("btnIcFirmar"); if(b) b.focus();
}

/* Firmar = guardar lo pendiente + POST .../firmar {firmantes}. Los 422 (incluidos los firmantes) vuelven por campo. */
async function icFirmar(){
  if(IC.estado !== "listo" || IC.guardando) return;
  const mi = EXP.seq, id = EXP.id;
  IC.confirmando = false;
  const firmantes = [_bruto("ic_f1"), _bruto("ic_f2")].filter(v => v !== "").map(Number);   // lo que se eligio; si faltan o se repiten lo dice la API
  const ok = await icGuardar({paraFirmar: true});
  if(!ok || mi !== EXP.seq || IC.hceId !== id) return;
  const avisosGuardado = IC.avisos;
  icOcupado(true);
  try{
    const r = await apiFetch(`/informe-cierre/${IC.rec.id}/firmar`, {method: "POST", body: {firmantes}});
    if(mi !== EXP.seq || IC.hceId !== id) return;
    IC.rec = r.data; IC.avisos = _juntarAvisos(avisosGuardado, r.warnings);
    IC.guardando = false; IC.sucio = false; IC.campos = null;
    if(EXP.mods) EXP.mods.ic = IC.rec;
    icRepintar();
    const t = _icEl("icTitulo"); if(t) t.focus();
    toast("HCE-IC firmado");
    pintarTabsExp(); pintarFlujo();
    recargarFlujoExp(true); refrescarListaTrasEscritura();
  }catch(err){
    if(mi !== EXP.seq || IC.hceId !== id) return;
    IC.guardando = false; icPintarAcciones();
    if(err instanceof ApiError && err.status === 409){ await icResolver409(err); return; }
    evMostrarErrores({k: "ic"}, err, "No se pudo firmar:");
  }
}

async function icAddenda(){
  if(!IC.rec || !IC.rec.firmado) return;
  const mi = EXP.seq, id = EXP.id;
  evLimpiarErrores();
  const texto = _bruto("ic_add_texto");
  const btn = _icEl("btnIcAdd"); if(btn){ btn.disabled = true; btn.textContent = "Agregando…"; }
  try{
    const r = await apiFetch(`/informe-cierre/${IC.rec.id}/addendas`, {method: "POST", body: {texto}});
    if(mi !== EXP.seq || IC.hceId !== id) return;
    IC.rec = r.data; IC.avisos = r.warnings || [];
    if(EXP.mods) EXP.mods.ic = IC.rec;
    const ta = _icEl("ic_add_texto"); if(ta) ta.value = "";
    IC.addBorrador = "";
    icRepintar();
    toast("Addenda registrada");
    const t = _icEl("icAddTitulo"); if(t) t.focus();
    pintarTabsExp(); pintarFlujo();
  }catch(err){
    if(mi !== EXP.seq || IC.hceId !== id) return;
    if(btn){ btn.disabled = false; btn.textContent = "+ Agregar addenda"; }
    const detalle = err instanceof ApiError && err.detail.length ? err.detail : [{campo: null, mensaje: err.message || "No se pudo agregar la addenda."}];
    detalle.forEach(d => { if(d.campo === "texto") evMarcar({ctl: "ic_add_texto", err: "err_ic_add_texto"}, d.mensaje); });
    const r = _icEl("evAddErrores");
    r.innerHTML = `<b>No se pudo agregar la addenda:</b><ul>` + detalle.map(d => d.campo === "texto"
      ? `<li><a href="#ic_add_texto" onclick="return evIr('ic_add_texto')">Addenda: ${escHtml(d.mensaje)}</a></li>` : `<li>${escHtml(d.mensaje)}</li>`).join("") + `</ul>`;
    r.hidden = false; r.scrollIntoView({block: "center"}); r.focus({preventScroll: true});
  }
}

/* ---------- Recibí de la familia (modal #modalFlujo, accesible: ver flujo.js · openFlujoModal) ---------- */
function openRecibiModal(){
  const r = IC.rec;
  if(!r || !r.firmado){ toast("El recibí se registra con el informe firmado."); return; }
  if(r.recibi){ toast("El recibí ya está registrado."); return; }
  const ref = EXP.raw && EXP.raw.persona ? EXP.raw.persona.referente : "";
  const nombre = EXP.hce ? `${EXP.hce.nombre} ${EXP.hce.apellido}`.trim() : "";
  const body = `<div id="recibiErrores" class="form-errores" role="alert" tabindex="-1" hidden></div>
    <p class="hint" style="margin-bottom:12px">Constancia de que la familia recibió el informe en entrevista presencial. Se registra <b>una sola vez</b>, después de la firma, y no modifica el informe firmado.</p>
    <div class="field"><label for="mfFirmante">Firmante (familia / referente) <span class="req" aria-hidden="true">*</span><span class="sr-only">(obligatorio)</span></label>
      <input id="mfFirmante" value="${escHtml(ref || "")}" autocomplete="off" aria-describedby="err_mfFirmante"><div class="err" id="err_mfFirmante"></div></div>
    <div class="field"><label for="mfFecha">Fecha <span class="req" aria-hidden="true">*</span><span class="sr-only">(obligatoria)</span></label>
      <input id="mfFecha" type="date" aria-describedby="err_mfFecha"><div class="err" id="err_mfFecha"></div></div>`;
  const foot = `<span class="left">HCE-IC · Informe de Cierre Anual</span>
    <div style="display:flex;gap:10px">
      <button type="button" class="btn btn-ghost" onclick="closeFlujoModal()">Cancelar</button>
      <button type="button" class="btn btn-primary" style="background:var(--teal)" id="btnRecibiOk" onclick="confirmarRecibi()">✍ Registrar recibí</button>
    </div>`;
  openFlujoModal("Registrar «recibí» de la familia", nombre ? `${nombre} · Informe de cierre ${IC.anio}` : `Informe de cierre ${IC.anio}`, body, foot);
}
async function confirmarRecibi(){
  const r = IC.rec; if(!r || IC.guardando) return;
  const mi = EXP.seq, id = EXP.id;
  formLimpiar(_icEl("modalFlujo"), "recibiErrores");
  const body = {firmante: _bruto("mfFirmante"), fecha: _bruto("mfFecha")};
  const btn = _icEl("btnRecibiOk"); if(btn){ btn.disabled = true; btn.textContent = "Registrando…"; }
  IC.guardando = true;
  try{
    const res = await apiFetch(`/informe-cierre/${r.id}/recibi`, {method: "POST", body});
    if(mi !== EXP.seq || IC.hceId !== id) return;
    IC.guardando = false;
    IC.rec = res.data; IC.avisos = res.warnings || [];
    if(EXP.mods) EXP.mods.ic = IC.rec;
    closeFlujoModal();
    toast("Recibí de la familia registrado");
    if(EXP.tab === "ic") icRepintar();
    if(_icEl("view-informe").classList.contains("active")) icCargarDocumento();
    else { const t = _icEl("icTitulo"); if(t) t.focus(); }
    pintarTabsExp();
  }catch(err){
    if(mi !== EXP.seq || IC.hceId !== id) return;
    IC.guardando = false;
    if(btn){ btn.disabled = false; btn.textContent = "✍ Registrar recibí"; }
    const detalle = err instanceof ApiError && err.detail.length ? err.detail : [{campo: null, mensaje: err.message || "No se pudo registrar el recibí."}];
    const mapa = {firmante: ["mfFirmante", "Firmante"], fecha: ["mfFecha", "Fecha"]};
    const items = detalle.map(d => ({id: d.campo && mapa[d.campo] ? mapa[d.campo][0] : null, rot: d.campo && mapa[d.campo] ? mapa[d.campo][1] : "", mensaje: d.mensaje}));
    formResumen("recibiErrores", items, "No se pudo registrar el recibí:").focus();
    if(err instanceof ApiError && err.status === 409){        // ya estaba registrado (u otro cambio): se muestra lo que hay en el servidor
      IC.avisos = [{mensaje: err.message, conflicto: true}];
      closeFlujoModal();
      await icCargar(true);
      icPintarAvisos();
      if(_icEl("view-informe").classList.contains("active")) icCargarDocumento();
      else { const t = _icEl("icTitulo"); if(t) t.focus(); }       // el repintado destruyo a quien abrio el dialogo: el foco no queda en <body>
    }
  }
}

/* ======================================================================
   DOCUMENTO IMPRESO · GET /informe-cierre/{id}/documento (+ GET /hce/{id})
   ====================================================================== */
function icAbrirDocumento(){
  if(EXP.id === null) return;
  ICDOC.hceId = EXP.id;
  go("informe");
  icCargarDocumento();
}
function icVolverAlExpediente(){
  go("expediente");
  if(EXP.id !== null) selTabExp("ic", true);
}

function infBannerHtml(titulo, sub, botones){
  return `<div class="inf-banner no-print"><div><h2 id="infTitulo" tabindex="-1">${escHtml(titulo)}</h2><p>${escHtml(sub)}</p></div>
    <div class="inf-botones">${botones}</div></div>`;
}
const INF_VOLVER = `<button type="button" class="btn-print" onclick="icVolverAlExpediente()">‹ Volver al expediente</button>`;
function _infEnfocar(){ const t = _icEl("infTitulo"); if(t) t.focus(); }

async function icCargarDocumento(){
  const mi = EXP.seq, id = EXP.id, n = ++ICDOC.seq;
  const cont = _icEl("informeContent"); if(!cont || id === null) return;
  const nombre = EXP.hce ? `${EXP.hce.nombre} ${EXP.hce.apellido}`.trim() : "";
  const titulo = `Informe de Cierre Anual — ${nombre}`;
  const vigente = () => mi === EXP.seq && n === ICDOC.seq;
  Object.assign(ICDOC, {estado: "cargando", data: null, hce: null, error: "", sinInforme: false});
  cont.innerHTML = `${infBannerHtml(titulo, "Cargando el documento…", INF_VOLVER)}<div class="card"><div class="cardbody"><div class="hint" role="status">Cargando el informe…</div></div></div>`;
  _infEnfocar();
  if(!IC.rec){            // todavía no hay informe de este año: no hay documento que pedir
    ICDOC.estado = "sin_firmar"; ICDOC.sinInforme = true;
    cont.innerHTML = icSinFirmarHtml(titulo);
    return;
  }
  const [rd, rh, rp] = await Promise.allSettled([apiFetch(`/informe-cierre/${IC.rec.id}/documento`), apiFetch(`/hce/${id}`), evCargarProfesionales()]);
  if(!vigente()) return;
  PROF_ERROR = rp.status === "rejected";
  if(rd.status === "rejected"){
    const e = rd.reason;
    if(e instanceof ApiError && e.status === 409){          // no está firmado: se muestra el estado del flujo en lugar del documento
      ICDOC.estado = "sin_firmar";
      cont.innerHTML = icSinFirmarHtml(titulo);
    }else{
      ICDOC.estado = "error"; ICDOC.error = e instanceof ApiError ? e.message : "No se pudo cargar el documento.";
      cont.innerHTML = `${infBannerHtml(titulo, "No se pudo cargar el documento", INF_VOLVER)}<div class="card"><div class="cardbody"><div class="empty-state" role="alert"><div class="big" aria-hidden="true">!</div>${escHtml(ICDOC.error)}<br>
        <button type="button" class="btn btn-primary btn-mini" style="margin-top:10px" onclick="icCargarDocumento()">Reintentar</button></div></div></div>`;
    }
    _infEnfocar();
    return;
  }
  if(rh.status === "rejected"){
    ICDOC.estado = "error"; ICDOC.error = rh.reason instanceof ApiError ? rh.reason.message : "No se pudo cargar el expediente (cédula y CIE-11).";
    cont.innerHTML = `${infBannerHtml(titulo, "No se pudo cargar el documento", INF_VOLVER)}<div class="card"><div class="cardbody"><div class="empty-state" role="alert"><div class="big" aria-hidden="true">!</div>${escHtml(ICDOC.error)}<br>
      <button type="button" class="btn btn-primary btn-mini" style="margin-top:10px" onclick="icCargarDocumento()">Reintentar</button></div></div></div>`;
    _infEnfocar();
    return;
  }
  Object.assign(ICDOC, {estado: "listo", data: rd.value.data, hce: rh.value.data});
  cont.innerHTML = icDocumentoHtml();
  _infEnfocar();
}

/* IC sin firmar (o sin crear): en lugar del documento, el estado del flujo (§5.3: no hay versiones alternativas). */
function icSinFirmarHtml(titulo){
  const f = EXP.flujo;
  const filas = MODULOS_CADENA.map(m => {
    const mo = f && f.modulos[m] ? f.modulos[m] : {estado: "sin_iniciar", faltantes: []};
    const est = ESTADO_MOD_TXT[mo.estado] ? mo.estado : "sin_iniciar";
    return `<li><span class="st st-${est}"><span aria-hidden="true">${ESTADO_MOD_TXT[est].glifo}</span> ${ESTADO_MOD_TXT[est].txt}</span> <b>${escHtml(MOD_NOMBRE[m])}</b></li>`;
  }).join("");
  return `${infBannerHtml(titulo, `Año ${f ? f.anio : ""} · el informe todavía no está firmado`, INF_VOLVER)}
    <div class="card"><div class="cardbody">
      <div class="empty-state"><div class="big" aria-hidden="true">▤</div>
        No hay un Informe de Cierre Anual <b>firmado</b> para ${EXP.hce ? escHtml(`${EXP.hce.nombre} ${EXP.hce.apellido}`.trim()) : "este NNA"}.<br>
        El informe imprimible se genera <b>únicamente desde el HCE-IC firmado</b>: no se elaboran versiones alternativas (§5.3).</div>
      <ol class="fl-lista" aria-label="Estado de los módulos del año ${f ? escHtml(f.anio) : ""}">${filas}</ol>
      <div style="display:flex;justify-content:center;margin-top:14px"><button type="button" class="btn btn-primary" onclick="icVolverAlExpediente()">✎ Ir al informe de cierre</button></div>
    </div></div>`;
}

/* Un solo lugar para el encabezado repetido en cada hoja impresa. Es una tabla de MAQUETACION (role="presentation"): el
   navegador repite su <thead> en cada hoja al imprimir, cosa que ni position:fixed ni un contenedor div logran de forma
   fiable. En pantalla se comporta como bloques y el encabezado no se ve (CSS: .print-wrap). */
function infHojaHtml(encabezado, cuerpo){
  return `<table class="print-wrap" role="presentation"><thead aria-hidden="true"><tr><td><div class="ph">${encabezado}</div></td></tr></thead><tbody><tr><td>${cuerpo}</td></tr></tbody></table>`;
}

function icDocumentoHtml(){
  const d = ICDOC.data, h = ICDOC.hce, per = (h && h.persona) || {};
  const e = d.expediente, inf = d.informe, pr = d.protocolos || {};
  const nombre = `${e.nombre} ${e.apellido}`.trim();
  const edad = edadALaFecha(e.fecha_nac, inf.fecha);      // a la fecha del propio informe, no al reloj del navegador
  const firmas = inf.firmas || [];
  const firmaTxt = (f) => f ? `${escHtml(f.nombre || nombreProfesional(f.profesional_id))}${f.rol ? " · " + escHtml(f.rol) : ""}` : "—";
  const fechaFirma = firmas[0] && firmas[0].fecha ? firmas[0].fecha : inf.fecha;
  const hoy = new Date();
  const fechaGen = `${String(hoy.getDate()).padStart(2, "0")}/${String(hoy.getMonth() + 1).padStart(2, "0")}/${hoy.getFullYear()}`;
  const datos = icCuantDatos({idea: d.idea, a: pr.a, b: pr.b, deltas: pr.deltas, interpretacion: pr.interpretacion, alertas: pr.alertas});
  const se = inf.sint_escala || {};
  const hc = e.hc_numero === null || e.hc_numero === undefined ? "—" : e.hc_numero;
  const botones = `<button type="button" class="btn-print" onclick="window.print()">🖨 Imprimir / guardar como PDF</button>
    ${!inf.recibi ? `<button type="button" class="btn-print btn-print-acento" id="btnInfRecibi" onclick="openRecibiModal()">✍ Registrar recibí</button>` : ""}${INF_VOLVER}`;
  const adds = (inf.addendas || []);
  const card = (titulo, interior, cls = "") => `<div class="card doc-seccion${cls ? " " + cls : ""}" style="margin-top:16px"><div class="cardhead"><h2>${titulo}</h2></div><div class="cardbody">${interior}</div></div>`;
  const cuerpo = `
    <div class="card"><div class="cardbody">
      <div class="membrete">
        <h2>FUNDACIÓN IPPU · Instituto Psico Pedagógico Uruguayo</h2>
        <div class="sub">INAU · MSP · BPS · ECOSOC/ONU · Montevideo, Uruguay</div>
        <h3>Informe de Evolución y Cierre Anual · Año lectivo ${escHtml(d.anio)}</h3>
      </div>
      <dl class="ib doc-datos">
        <div class="data-row"><dt>Usuario</dt><dd>${escHtml(nombre)}${edad === null ? "" : " · " + edad + (edad === 1 ? " año" : " años")}</dd></div>
        <div class="data-row"><dt>N.º de HC / C.I.</dt><dd>${escHtml(hc)} · ${escHtml(ciFormateada(per.ci))}</dd></div>
        <div class="data-row"><dt>Grupo de referencia</dt><dd>${e.grupo ? "Grupo " + escHtml(e.grupo.nombre) : "—"}</dd></div>
        <div class="data-row"><dt>CIE-11</dt><dd>${_txt(h && h.cie11)}</dd></div>
        <div class="data-row"><dt>Profesional firmante 1</dt><dd>${firmaTxt(firmas[0])}</dd></div>
        <div class="data-row"><dt>Profesional firmante 2</dt><dd>${firmaTxt(firmas[1])}</dd></div>
      </dl>
    </div></div>

    ${card("1. Análisis cuantitativo — desde los módulos firmados", `${icTablaHtml(datos)}${icRadaresHtml(datos)}`, "doc-cuant")}
    ${card("2. Análisis cualitativo por escala", IPPU_ESCALAS.map((n, i) => `<p class="doc-p"><b>E${i + 1} · ${escHtml(n)}.</b> ${_txt(se["esc_" + (i + 1)])}</p>`).join(""))}
    ${card("3. Síntesis interdisciplinaria", `<p class="doc-p"><b>Valoración anual — técnico/a 1:</b> ${_txt(inf.val_tec1)}</p><p class="doc-p"><b>Valoración anual — técnico/a 2:</b> ${_txt(inf.val_tec2)}</p>`)}
    ${card("4. Recomendaciones y ajustes de tratamiento", `<p class="doc-p">${_txt(inf.recomendaciones)}</p>`)}
    ${card("5. Orientaciones a la familia", `<p class="doc-p">${_txt(inf.orientaciones)}</p>`)}
    ${adds.length ? card("Addendas", adds.map(a => `<p class="doc-p"><b>${a.fecha ? fmtFecha(a.fecha) : "—"} · ${escHtml(nombreProfesional(a.profesional_id))}:</b> ${escHtml(a.texto)}</p>`).join("")) : ""}

    <div class="card doc-seccion doc-cierre" style="margin-top:16px"><div class="cardbody">
      <div class="firmas-grid">
        <div><label>Firma — profesional 1</label><div class="flin"></div><div class="fnom">${firmaTxt(firmas[0])}</div></div>
        <div><label>Firma — profesional 2</label><div class="flin"></div><div class="fnom">${firmaTxt(firmas[1])}</div></div>
        <div><label>Recibí de la familia</label><div class="flin"></div><div class="fnom">${inf.recibi ? `${escHtml(inf.recibi.firmante)} · registrado en la HCE el ${inf.recibi.fecha ? fmtFecha(inf.recibi.fecha) : "—"}` : "Pendiente de registro"}</div></div>
      </div>
      <p class="doc-pie">Documento generado desde la HCE de IPPU · Firmado digitalmente el ${fechaFirma ? fmtFecha(fechaFirma) : "—"} · Documento clínico legal, versión única (§5.3) · Uso profesional exclusivo · Ley N.º 18.331/2008 y Ley N.º 18.335/2008 · Demo — datos simulados</p>
    </div></div>`;
  const encabezado = `<b>Fundación IPPU · Informe de Cierre Anual ${escHtml(d.anio)}</b> — ${escHtml(nombre)} · N.º de HC ${escHtml(hc)} · C.I. ${escHtml(ciFormateada(per.ci))}`;
  return `${infBannerHtml(`Informe de Cierre Anual — ${nombre}`, `HCE-IC firmado el ${fechaFirma ? fmtFecha(fechaFirma) : "—"} · documento clínico legal, versión única · vista previa generada el ${fechaGen}`, botones)}${infHojaHtml(encabezado, cuerpo)}`;
}
