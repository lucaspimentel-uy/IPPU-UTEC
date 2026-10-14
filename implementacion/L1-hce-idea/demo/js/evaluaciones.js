/* Evaluaciones CONECTADAS a la API: IDEA (HCE-LB) y Protocolos A y B (HCE-PA / HCE-PB) - Fase 3-c (handoff §5.125).
   Demo L1 HCE+IDEA - IPPU x UTEC-LIDIA.

   Viven en las pestañas LB, PA y PB del expediente (expediente.js). Reemplazan al editor en memoria de la demo
   original: ya no hay selector de NNA ni estado propio, todo sale de y va a la API:
     IDEA          GET/POST /hce/{id}/idea · GET/PATCH /idea/{id} · POST /idea/{id}/firmar · /addendas
     Protocolos    GET/POST /hce/{id}/protocolo · GET/PATCH /protocolo/{id} · POST .../firmar · /addendas
   Reglas duras, todas del servidor (esto es solo presentacion):
   - firmar es UN acto y bloquea el registro; despues solo addendas, cuyo autor es el usuario del token;
   - la secuencia solo avisa (warnings[]), nada se bloquea por CI ni por el eslabon anterior (§5.94, §5.95);
   - los dos evaluadores son campos del borrador (evaluador_t1_id / evaluador_t2_id); /firmar no lleva cuerpo;
   - totales, escalas, banda, Δ, interpretacion y alertas los calcula la API: el navegador solo suma "provisorio"
     mientras se tipea y lo rotula asi. Sin banda en vivo.
   - la validacion es el 422 de la API, con `campo` por dimension (dim.D5), por item (items.7.obs), etc.
   Los scripts se cargan en orden en index.html: el orden ES la semantica. */

const EV_TABS = ["lb", "pa", "pb"];
const EV_INFO = {
  lb: {modulo: "HCE-LB", corto: "LB", nombre: "Línea base — IDEA"},
  pa: {modulo: "HCE-PA", corto: "PA", nombre: "Protocolo A — Escala IPPU-TEA (julio)", tipo: "A"},
  pb: {modulo: "HCE-PB", corto: "PB", nombre: "Protocolo B — Escala IPPU-TEA (fin de año)", tipo: "B"}
};
/* Estado por pestaña: se conserva al cambiar de pestaña (lo tipeado sin guardar no se pierde). */
const EVS = {};
let PROFESIONALES = null;     // {lista:[{id,nombre,especialidad,rol,activo}]} - GET /profesionales, una vez por sesion
let PROF_ERROR = false;

const esTabEval = (k) => EV_TABS.indexOf(k) !== -1;
const _ev = () => EVS[EXP.tab] || null;
const _evEl = (id) => document.getElementById(id);

/* Cierre de sesion / otro expediente: nada de la evaluacion anterior queda en memoria. */
function evReiniciar(sesionTerminada){
  EV_TABS.forEach(k => { delete EVS[k]; });
  if(sesionTerminada){ PROFESIONALES = null; PROF_ERROR = false; }
}

/* ---------- Ramas de presentacion de la API ---------- */
function nombreProfesional(id){
  if(id === null || id === undefined) return "—";
  const p = PROFESIONALES && PROFESIONALES.lista.find(x => x.id === id);
  return p ? p.nombre : `Profesional n.º ${id}`;
}
function rolProfesional(id){
  const p = PROFESIONALES && PROFESIONALES.lista.find(x => x.id === id);
  return p ? (p.especialidad || p.rol || "") : "";
}
const _vacio = (v) => v === null || v === undefined || v === "";
/* Valor de un campo de texto: lo que el usuario tenia tipeado al cambiar de pestaña (ev.campos) o, si no hay, lo guardado. */
const cv = (ev, id, base) => (ev.campos && Object.prototype.hasOwnProperty.call(ev.campos, id)) ? ev.campos[id] : base;
/* Guarda en el estado lo tipeado en los campos del formulario, para poder volver a pintarlo sin perderlo. */
function evSincronizar(){
  const ev = _ev(); if(!ev || ev.estado !== "listo" || (ev.rec && ev.rec.firmado)) return;
  const c = {};
  document.querySelectorAll("#panelExp [data-ev]").forEach(e => { if(e.id && e.matches("input,select,textarea")) c[e.id] = e.value; });
  if(Object.keys(c).length) ev.campos = c;
}
const _txt = (v) => _vacio(v) ? "—" : escHtml(v);
const _num = (v) => _vacio(v) ? "—" : escHtml(v);

/* Rampa de UN solo matiz para las 6 bandas del IDEA (notas de accesibilidad §3.1): banda 1 = claro, banda 6 = oscuro.
   La API devuelve el nombre y el rango de la banda pero no su orden; el PASO de color se toma del `total_min` que
   devuelve (nunca del total) y, si el catalogo cambiara, de su posicion proporcional. Es solo color: el nombre
   de la banda se escribe SIEMPRE como texto. (Hueco de la API anotado: `banda.orden`.) */
const BANDA_PASO_POR_MIN = {0: 1, 16: 2, 31: 3, 56: 4, 76: 5, 91: 6};
function pasoDeBanda(b){
  if(!b) return 1;
  if(BANDA_PASO_POR_MIN[b.total_min] !== undefined) return BANDA_PASO_POR_MIN[b.total_min];
  return Math.min(6, Math.max(1, Math.floor((b.total_min / 97) * 6) + 1));
}
/* Chip de banda: texto (nombre + rango) + paso de la rampa. NUNCA `nivel_dsm` (no es el nivel de apoyo del NNA). */
function bandaChipHtml(b){
  if(!b) return "";
  const paso = pasoDeBanda(b);
  return `<span class="banda-chip banda-${paso}" data-banda-paso="${paso}"><span class="banda-rot">Banda</span> ${escHtml(b.perfil)}<span class="banda-rango"> · ${escHtml(b.total_min)}–${escHtml(b.total_max)}</span></span>`;
}
/* NS: marca propia, neutra y distinta de cualquier numero (notas §3.2 B). */
function nsMarcaHtml(){
  return `<span class="ns-marca"><span aria-hidden="true">◌ </span>NS<span class="sr-only"> (observación insuficiente, sin puntuar)</span></span>`;
}
function valorDimHtml(v){
  if(v === "NS") return nsMarcaHtml();
  if(typeof v === "number") return `<span class="score-badge sb-${v}">${v}</span>`;
  return `<span class="sin-puntuar">— sin puntuar</span>`;
}

/* Marca "con addenda" (notas §3.2 A): glifo + texto, junto al estado del modulo. */
function nAddendas(k){
  const r = EXP.mods && EXP.mods[k];
  return r && r.addendas ? r.addendas.length : 0;
}
function addendaMarcaHtml(n, mini){
  if(!n) return "";
  const txt = `${n} addenda${n > 1 ? "s" : ""}`;
  return mini
    ? ` <span class="st-mini st-addenda"><span aria-hidden="true">✚</span><span class="sr-only">con ${txt}</span></span>`
    : ` <span class="st st-addenda"><span aria-hidden="true">✚</span> con ${txt}</span>`;
}
function estadoDeRec(rec){ return !rec ? "sin_iniciar" : (rec.firmado ? "firmado" : "en_curso"); }

/* ======================================================================
   CARGA
   ====================================================================== */
async function evCargarProfesionales(){
  if(PROFESIONALES) return PROFESIONALES.lista;
  const r = await apiFetch("/profesionales");
  PROFESIONALES = {lista: r.data};
  PROF_ERROR = false;
  return PROFESIONALES.lista;
}

/* Registro del año del flujo (el año sale de GET /hce/{id}/flujo → anio). */
function _recDeLista(k, lista, anio){
  const inf = EV_INFO[k];
  return (lista || []).find(x => x.anio === anio && (k === "lb" || x.tipo === inf.tipo)) || null;
}
function _rutaLista(k, id){ return k === "lb" ? `/hce/${id}/idea` : `/hce/${id}/protocolo`; }
function _rutaRec(k, recId){ return k === "lb" ? `/idea/${recId}` : `/protocolo/${recId}`; }

function evIniciarTrabajo(ev){
  const rec = ev.rec;
  if(ev.k === "lb"){
    ev.dim = {};
    for(let n = 1; n <= 12; n++){
      const d = rec && rec.dim ? rec.dim["D" + n] : null;
      ev.dim["D" + n] = {valor: d && d.valor !== undefined ? d.valor : null, obs: (d && d.obs) || ""};
    }
  }else{
    ev.items = {};
    for(let n = 1; n <= 24; n++){
      const d = rec && rec.items ? rec.items[String(n)] : null;
      ev.items[String(n)] = {valor: d && d.valor !== undefined ? d.valor : null, obs: (d && d.obs) || ""};
    }
  }
  ev.sucio = false; ev.confirmando = false; ev.guardando = false;
  ev.campos = null;
  ev.avisos = ev.avisos || [];
}

/* Muestra la pestaña: si ya habia trabajo sin guardar se conserva; si no, se vuelve a leer de la API. */
function evMostrar(k){
  const ev = EVS[k];
  if(ev && ev.hceId === EXP.id){
    if(ev.estado === "listo" && ev.sucio){ evRepintar(k); return; }
    ev.avisos = [];
    evRepintar(k);
    evCargar(k, true);
    return;
  }
  evCargar(k, false);
}

async function evCargar(k, conservar){
  const mi = EXP.seq, id = EXP.id;
  if(id === null) return;
  let ev = EVS[k];
  if(!ev || ev.hceId !== id){
    ev = EVS[k] = {k, hceId: id, estado: "cargando", rec: null, carga: 0, avisos: [], errores: [], delta: null, anio: null};
  }else if(!conservar){
    ev.estado = "cargando";
  }
  const n = ++ev.carga;
  const vigente = () => mi === EXP.seq && EVS[k] === ev && n === ev.carga;
  if(ev.estado === "cargando") evRepintar(k);

  const anio = EXP.flujo ? EXP.flujo.anio : null;
  if(anio === null || anio === undefined){
    ev.estado = "error";
    ev.error = "No se pudo determinar el año del flujo: el estado de los módulos no se cargó.";
    ev.reintento = "flujo";
    evRepintar(k);
    return;
  }
  ev.anio = anio;
  const [rl, rp] = await Promise.allSettled([apiFetch(_rutaLista(k, id)), evCargarProfesionales()]);
  if(!vigente()) return;
  PROF_ERROR = rp.status === "rejected";
  if(rl.status === "rejected"){
    ev.estado = "error";
    ev.error = rl.reason instanceof ApiError ? rl.reason.message : "No se pudo cargar el módulo.";
    ev.reintento = "modulo";
    evRepintar(k);
    return;
  }
  const rec = _recDeLista(k, rl.value.data, anio);
  const conservarTrabajo = conservar && ev.estado === "listo" && ev.sucio && !(rec && rec.firmado);
  const igual = conservar && ev.estado === "listo" && JSON.stringify(ev.rec) === JSON.stringify(rec);
  ev.rec = rec;
  if(igual && !ev.sucio){            // la relectura en segundo plano no trajo nada nuevo: no se toca la pantalla
    if(EXP.mods) EXP.mods[k] = rec;
    pintarTabsExp(); pintarFlujo();
    return;
  }
  if(conservarTrabajo){            // se empezó a tipear mientras llegaba la respuesta: no se pisa nada
    if(EXP.mods) EXP.mods[k] = rec;
    pintarTabsExp(); pintarFlujo();
    return;
  }
  evIniciarTrabajo(ev);
  ev.delta = null;
  if(k === "lb" && rec && rec.firmado){
    try{
      const rd = await apiFetch(`/hce/${id}/idea/delta`, {query: {anio}});
      if(!vigente()) return;
      ev.delta = rd.data && rd.data.delta ? rd.data : null;
    }catch(_e){ ev.delta = null; }      // sin lugar donde mostrar el error: el bloque queda oculto
  }
  if(EXP.mods) EXP.mods[k] = rec;
  ev.estado = "listo";
  evRepintar(k);
  pintarTabsExp(); pintarFlujo();
}

function evReintentar(){
  const ev = _ev(); if(!ev) return;
  if(ev.reintento === "flujo"){ recargarFlujoExp(true).then(() => evCargar(ev.k, false)); }
  else evCargar(ev.k, false);
}

/* El estado de los 4 modulos (marcas de las pestañas y del stepper, con su addenda) sale de las listas del año. */
async function cargarModsExp(){
  const mi = EXP.seq, id = EXP.id;
  if(id === null || !EXP.flujo) return;
  const anio = EXP.flujo.anio;
  const [ri, rp] = await Promise.allSettled([apiFetch(`/hce/${id}/idea`), apiFetch(`/hce/${id}/protocolo`)]);
  if(mi !== EXP.seq) return;
  EXP.mods = {
    lb: ri.status === "fulfilled" ? _recDeLista("lb", ri.value.data, anio) : null,
    pa: rp.status === "fulfilled" ? _recDeLista("pa", rp.value.data, anio) : null,
    pb: rp.status === "fulfilled" ? _recDeLista("pb", rp.value.data, anio) : null
  };
  pintarTabsExp(); pintarFlujo();
}

/* IDEA que rige en la HCE (§5.97): lo decide la API (GET /hce/{id}/idea/vigente), no el navegador. */
async function cargarIdeaVigente(){
  const mi = EXP.seq, id = EXP.id;
  if(id === null) return;
  EXP.idea = {estado: "cargando"};
  try{
    const r = await apiFetch(`/hce/${id}/idea/vigente`);
    if(mi !== EXP.seq) return;
    EXP.idea = {estado: "listo", vigente: r.data.vigente, en_curso: r.data.en_curso};
  }catch(err){
    if(mi !== EXP.seq) return;
    EXP.idea = {estado: "error", mensaje: err instanceof ApiError ? err.message : "No se pudo cargar la línea base vigente."};
  }
  if(EXP.tab === "hce00") selTabExp("hce00");
}

function ideaVigenteCardHtml(){
  const cab = `<h3 id="ideaVigenteTitulo"><span class="ic" aria-hidden="true">◐</span> Línea base IDEA vigente</h3>`;
  const i = EXP.idea;
  if(!i || i.estado === "cargando") return `<div class="info-card">${cab}<div class="ib"><div class="hint" role="status">Cargando…</div></div></div>`;
  if(i.estado === "error"){
    return `<div class="info-card">${cab}<div class="ib"><div class="hint" role="alert">${escHtml(i.mensaje)}
      <button type="button" class="btn btn-ghost btn-mini" onclick="cargarIdeaVigente()">Reintentar</button></div></div></div>`;
  }
  const v = i.vigente, c = i.en_curso;
  let cuerpo;
  if(v){
    cuerpo = `<dl class="ib">
      <div class="data-row"><dt>Año</dt><dd>${escHtml(v.anio)}</dd></div>
      <div class="data-row"><dt>Total IDEA</dt><dd><b>${_num(v.total)}</b> / 96</dd></div>
      <div class="data-row"><dt>Banda</dt><dd>${v.banda ? bandaChipHtml(v.banda) : "—"}</dd></div>
      <div class="data-row"><dt>Fecha de consenso</dt><dd>${v.fecha_consenso ? fmtFecha(v.fecha_consenso) : "—"}</dd></div>
    </dl>`;
  }else{
    cuerpo = `<div class="ib"><p class="hint">Todavía no hay una línea base IDEA firmada.</p></div>`;
  }
  const enCurso = c
    ? `<div class="ib" style="padding-top:0"><p class="hint">Hay una línea base del año ${escHtml(c.anio)} <b>en curso</b> (sin firmar): no reemplaza a la vigente hasta que se firme.
        <button type="button" class="btn btn-ghost btn-mini" onclick="selTabExp('lb', true)">Abrir →</button></p></div>` : "";
  return `<div class="info-card">${cab}${cuerpo}${enCurso}</div>`;
}

/* ======================================================================
   RENDER
   ====================================================================== */
function evPanelHtml(k){
  const ev = EVS[k];
  const inf = EV_INFO[k];
  const cab = (extra) => `<h3 id="evTitulo" tabindex="-1"><span class="ic" aria-hidden="true">✎</span> ${inf.corto} · ${escHtml(inf.nombre)}${ev && ev.anio ? " — " + escHtml(ev.anio) : ""} ${extra || ""}</h3>`;
  if(!ev || ev.estado === "cargando") return `<div class="info-card">${cab()}<div class="ib"><div class="hint" role="status">Cargando…</div></div></div>`;
  if(ev.estado === "error"){
    return `<div class="info-card">${cab()}<div class="ib"><div class="empty-state" role="alert"><div class="big" aria-hidden="true">!</div>${escHtml(ev.error)}<br>
      <button type="button" class="btn btn-primary btn-mini" style="margin-top:10px" onclick="evReintentar()">Reintentar</button></div></div></div>`;
  }
  return k === "lb" ? ideaHtml(ev) : protHtml(ev);
}

function evRepintar(k){
  if(EXP.tab !== k) return;
  const p = _evEl("panelExp"); if(!p) return;
  const add = _evEl("ev_add_texto"), textoAdd = add ? add.value : "";    // una addenda a medio escribir sobrevive a un repintado
  p.innerHTML = evPanelHtml(k);
  const add2 = _evEl("ev_add_texto"); if(add2 && textoAdd) add2.value = textoAdd;
  const ev = EVS[k];
  if(ev && ev.estado === "listo" && !(ev.rec && ev.rec.firmado)) evActualizar();   // subtotales y barra desde el estado
}

/* Encabezado: estado del modulo (vacio / en curso / firmado) + marca de addenda, siempre con glifo y texto. */
function evEstadoHtml(ev){
  const est = estadoDeRec(ev.rec);
  const txt = est === "sin_iniciar" ? "Sin iniciar" : est === "en_curso" ? "En curso (borrador)" : "Firmado";
  const glifo = ESTADO_MOD_TXT[est].glifo;
  const add = ev.rec && ev.rec.addendas ? addendaMarcaHtml(ev.rec.addendas.length, false) : "";
  return `<span class="st st-${est}"><span aria-hidden="true">${glifo}</span> ${txt}</span>${add}`;
}
function evEncabezadoHtml(ev){
  const inf = EV_INFO[ev.k];
  return `<div class="ev-cab"><h3 id="evTitulo" tabindex="-1"><span class="ic" aria-hidden="true">✎</span> ${inf.corto} · ${escHtml(inf.nombre)} — ${escHtml(ev.anio)}</h3>
    <span id="evEstado" class="ev-estado">${evEstadoHtml(ev)}</span></div>`;
}

function evAvisosHtml(ev){
  const a = ev.avisos || [];
  if(!a.length) return "";
  return `<b>Avisos de la API (no bloquean):</b><ul>${a.map(w => `<li>${escHtml((w && w.mensaje) || w)}</li>`).join("")}</ul>
    <button type="button" class="btn btn-ghost btn-mini" onclick="evCerrarAvisos()">Entendido</button>`;
}
function evCerrarAvisos(){ const ev = _ev(); if(!ev) return; ev.avisos = []; evPintarAvisos(); }
function evPintarAvisos(){
  const ev = _ev(), el = _evEl("evAvisos"); if(!ev || !el) return;
  const h = evAvisosHtml(ev);
  el.innerHTML = h; el.hidden = !h;
}

/* ---------- Evaluadores (campos del borrador) ---------- */
function _evaluadorInicial(ev, n){
  const campo = n === 1 ? "evaluador_t1_id" : "evaluador_t2_id";
  if(ev.campos && Object.prototype.hasOwnProperty.call(ev.campos, "ev_t" + n)) return ev.campos["ev_t" + n] === "" ? null : Number(ev.campos["ev_t" + n]);
  if(ev.rec && ev.rec[campo] !== null && ev.rec[campo] !== undefined) return ev.rec[campo];
  // Sin valor guardado: se ofrece el tecnico 1/2 del grupo del expediente (solo precarga; se guarda con el borrador).
  const g = EXP.raw && EXP.raw.grupo;
  const t = g ? g["tecnico" + n] : null;
  return t ? t.id : null;
}
function evEvaluadoresHtml(ev){
  const lista = PROFESIONALES ? PROFESIONALES.lista : [];
  const sel = (n) => {
    const actual = _evaluadorInicial(ev, n);
    const opts = lista.filter(p => p.activo || p.id === actual).map(p =>
      `<option value="${p.id}"${p.id === actual ? " selected" : ""}>${escHtml(p.nombre)}${p.especialidad ? " · " + escHtml(p.especialidad) : ""}${p.activo ? "" : " (inactivo)"}</option>`);
    if(actual !== null && !lista.some(p => p.id === actual)) opts.unshift(`<option value="${actual}" selected>Profesional n.º ${escHtml(actual)}</option>`);
    return `<div class="field"><label for="ev_t${n}">Evaluador/a ${n} <span class="req" aria-hidden="true">*</span><span class="sr-only">(necesario para firmar)</span></label>
      <select id="ev_t${n}" data-ev aria-describedby="err_ev_t${n}" onchange="evSucio()"><option value="">— Elegí —</option>${opts.join("")}</select>
      <div class="ev-err" id="err_ev_t${n}"></div></div>`;
  };
  return `<div class="card" style="margin-top:16px"><div class="cardhead" style="padding:13px 18px;border-bottom:1px solid var(--line)"><h2 style="font-size:.82rem;text-transform:uppercase;letter-spacing:.04em;color:var(--ink-2)">Evaluadores (firman los dos, en un solo acto)</h2></div>
    <div style="padding:16px 18px">
      ${PROF_ERROR ? `<p class="hint" role="alert">No se pudo cargar la lista de profesionales. <button type="button" class="btn btn-ghost btn-mini" onclick="evReintentar()">Reintentar</button></p>` : ""}
      <div class="form-grid">${sel(1)}${sel(2)}</div>
      <p class="hint">Se precargan los técnicos del grupo; quedan guardados en el borrador. Para firmar tienen que ser dos profesionales activos y distintos.</p>
    </div></div>`;
}

/* ======================================================================
   IDEA · editor
   ====================================================================== */
function ideaDimHtml(ev, ei, di){
  const d = DIMENSIONES[ei].dims[di];
  const key = "D" + (ei * 3 + di + 1);
  const st = ev.dim[key];
  const opc = d.opciones.map(([pts, desc]) =>
    `<button type="button" class="opcion${st.valor === pts ? " sel" : ""}" data-ev data-dim="${key}" data-v="${pts}" aria-pressed="${st.valor === pts}" onclick="evDim('${key}',${pts})">
       <span class="score-badge sb-${pts}">${pts}</span><span class="desc">${escHtml(desc)}</span></button>`).join("");
  const inter = [1, 3, 5, 7].map(v =>
    `<button type="button" class="inter-btn${st.valor === v ? " sel" : ""}" data-ev data-dim="${key}" data-inter="${v}" aria-pressed="${st.valor === v}" onclick="evDim('${key}',${v})">Puntaje ${v}</button>`).join("");
  return `<div class="dimension" id="dim-${key}">
    <div class="dname" id="dname-${key}">${escHtml(d.label)}</div>
    <div class="dinstr">Elegí la descripción que mejor caracterice al NNA — asignar siempre la puntuación más baja posible. Tocá de nuevo la elegida para dejarla sin puntuar.</div>
    <div class="opciones" id="dimgrp-${key}" role="group" aria-labelledby="dname-${key}" aria-describedby="err_dim_${key}" tabindex="-1">${opc}</div>
    <div class="inter-row" role="group" aria-label="Puntajes intermedios y NS de ${escHtml(d.label)}">
      <span class="inter-label">¿El caso se sitúa claramente entre dos niveles?</span>${inter}
      <button type="button" class="inter-btn inter-ns${st.valor === "NS" ? " sel" : ""}" data-ev data-dim="${key}" data-ns="1" aria-pressed="${st.valor === "NS"}" aria-label="NS: observación insuficiente" onclick="evDim('${key}','NS')"><span aria-hidden="true">◌ </span>NS</button>
      <span class="inter-nota">Intermedias (Rivière) · NS = observación insuficiente (impide firmar)</span>
    </div>
    <div class="dsel" id="dsel-${key}">Seleccionado: ${valorDimHtml(st.valor)}</div>
    <details class="dobs"${st.obs ? " open" : ""} id="dobsd-${key}"><summary>Observación de la dimensión (opcional)</summary>
      <div class="field"><label for="dobs-${key}" class="sr-only">Observación de ${escHtml(d.label)}</label>
      <textarea id="dobs-${key}" data-ev aria-describedby="err_dobs_${key}" oninput="evObsDim('${key}')">${escHtml(st.obs)}</textarea></div>
      <div class="ev-err" id="err_dobs_${key}"></div>
    </details>
    <div class="ev-err" id="err_dim_${key}"></div>
  </div>`;
}

function ideaHtml(ev){
  if(ev.rec && ev.rec.firmado) return ideaLecturaHtml(ev);
  const rec = ev.rec || {};
  const escalas = DIMENSIONES.map((escala, ei) => `<div class="escala ${escala.esc}">
    <header><span>${escHtml(escala.escName)}</span><span class="dims">D${ei * 3 + 1} · D${ei * 3 + 2} · D${ei * 3 + 3} — Máx. 24 pts</span></header>
    ${escala.dims.map((_, di) => ideaDimHtml(ev, ei, di)).join("")}
    <div class="esc-foot"><span class="subtxt">Puntaje 0 = sin trastorno · 8 = afectación severa</span>
      <span>Subtotal escala: <b id="sub${ei}"></b></span></div></div>`).join("");
  return `<div class="info-card ev-card">${evEncabezadoHtml(ev)}
    <div class="ib">
      <p class="hint">Protocolo de Á. Rivière: 4 escalas, 12 dimensiones, 0 – 96. La línea base es <b>una por año</b>; el progreso dentro del año se mide con la Escala IPPU-TEA (PA y PB). Los totales y la banda los calcula el servidor al guardar.</p>
      <div id="evAvisos" class="review-note avisos-api" role="status"${(ev.avisos || []).length ? "" : " hidden"}>${evAvisosHtml(ev)}</div>
      <div id="evErrores" class="form-errores" role="alert" tabindex="-1" hidden></div>
    </div></div>
    ${evEvaluadoresHtml(ev)}
    <div id="ideaForm" style="margin-top:16px">${escalas}</div>
    <div class="card" style="margin-top:16px">
      <div class="cardhead" style="padding:13px 18px;border-bottom:1px solid var(--line)"><h2 style="font-size:.82rem;text-transform:uppercase;letter-spacing:.04em;color:var(--ink-2)">Datos de la línea base (HCE-LB)</h2></div>
      <div style="padding:16px 18px">
        <div class="form-grid">
          <div class="field"><label for="lb_fecha">Fecha de consenso <span class="req" aria-hidden="true">*</span><span class="sr-only">(necesaria para firmar)</span></label>
            <input id="lb_fecha" type="date" data-ev value="${escHtml(cv(ev, "lb_fecha", rec.fecha_consenso || ""))}" aria-describedby="err_lb_fecha" oninput="evSucio()"><div class="ev-err" id="err_lb_fecha"></div></div>
          <div class="field"><label for="lb_sesiones">Sesiones de observación previas</label>
            <input id="lb_sesiones" type="number" min="0" data-ev value="${escHtml(cv(ev, "lb_sesiones", _vacio(rec.sesiones) ? "" : rec.sesiones))}" aria-describedby="hint_lb_sesiones err_lb_sesiones" oninput="evSucio()">
            <div class="hint" id="hint_lb_sesiones">Recomendado ≥ 5 (el servidor avisa, no bloquea).</div><div class="ev-err" id="err_lb_sesiones"></div></div>
        </div>
        <div class="form-grid full">
          <div class="field"><label for="lb_sintesis">Síntesis clínica <span class="req" aria-hidden="true">*</span><span class="sr-only">(necesaria para firmar)</span></label>
            <textarea id="lb_sintesis" data-ev aria-describedby="hint_lb_sintesis err_lb_sintesis" oninput="evSucio()">${escHtml(cv(ev, "lb_sintesis", rec.sintesis || ""))}</textarea>
            <div class="hint" id="hint_lb_sintesis">Perfil, escalas más afectadas, nivel de soporte orientativo… (sugerido ≈200 palabras).</div><div class="ev-err" id="err_lb_sintesis"></div></div>
          <div class="field"><label for="lb_objetivos">Objetivos del período <span class="req" aria-hidden="true">*</span><span class="sr-only">(necesarios para firmar)</span></label>
            <textarea id="lb_objetivos" data-ev aria-describedby="err_lb_objetivos" oninput="evSucio()">${escHtml(cv(ev, "lb_objetivos", rec.objetivos || ""))}</textarea><div class="ev-err" id="err_lb_objetivos"></div></div>
        </div>
      </div>
    </div>
    ${evResumenHtml(ev)}`;
}

/* ---------- Barra de totales ---------- */
function _sumaProvisoria(ev){
  if(ev.k === "lb"){
    const esc = [0, 0, 0, 0]; let total = 0, n = 0;
    for(let i = 1; i <= 12; i++){ const v = ev.dim["D" + i].valor; if(typeof v === "number"){ esc[Math.floor((i - 1) / 3)] += v; total += v; n++; } }
    return {esc, total, n, de: 12};
  }
  const esc = [0, 0, 0, 0]; let total = 0, n = 0;
  for(let i = 1; i <= 24; i++){ const v = ev.items[String(i)].valor; if(typeof v === "number"){ esc[IPPU_ITEMS[i - 1].e] += v; total += v; n++; } }
  return {esc, total, n, de: 24};
}
/* Lo que muestra la barra: lo GUARDADO (de la API) si no hay cambios; si los hay, la suma "provisorio". */
function evNumeros(ev){
  const rec = ev.rec;
  const prov = _sumaProvisoria(ev);
  const guardado = !ev.sucio && rec;
  if(ev.k === "lb"){
    if(guardado) return {guardado: true, total: rec.total, esc: [rec.esc_a, rec.esc_b, rec.esc_c, rec.esc_d], n: rec.puntuadas, de: 12, banda: rec.banda};
    return {guardado: false, total: ev.sucio ? prov.total : null, esc: ev.sucio ? prov.esc : [null, null, null, null], n: prov.n, de: 12, banda: null};
  }
  if(guardado) return {guardado: true, total: rec.total, esc: [rec.esc_1, rec.esc_2, rec.esc_3, rec.esc_4], n: rec.puntuados, de: 24, banda: null};
  return {guardado: false, total: ev.sucio ? prov.total : null, esc: ev.sucio ? prov.esc : [null, null, null, null], n: prov.n, de: 24, banda: null};
}
function evBandaHtml(ev, num){
  if(ev.k !== "lb") return "";
  if(num.guardado && num.banda) return bandaChipHtml(num.banda);
  if(ev.sucio) return `<span class="ev-nota-banda">La banda se calcula al guardar.</span>`;
  return `<span class="ev-nota-banda">Sin banda: todavía no hay un total guardado.</span>`;
}
function evCuentaTxt(ev, num){
  return ev.k === "lb" ? `${num.n} / 12 dimensiones puntuadas` : `${num.n} / 24 ítems puntuados`;
}
function evTotalEtiqueta(ev, num){
  if(num.guardado) return num.total === null || num.total === undefined
    ? (ev.k === "lb" ? "sin total: ninguna dimensión con número" : "el total se calcula al completar los 24 ítems") : "guardado";
  if(ev.sucio) return "provisorio — suma sin guardar";
  return "—";
}
function evAccionesHtml(ev){
  const occ = ev.guardando;
  if(ev.confirmando && !occ){
    return `<div class="ev-confirma" role="group" aria-label="Confirmar la firma">
      <span id="evConfirmaTxt">¿Firmar ${ev.k === "lb" ? "la línea base" : "el protocolo"}? La firma bloquea el registro: después sólo se corrige por addenda.</span>
      <button type="button" class="btn btn-primary" style="background:var(--ok)" id="btnEvConfirmar" onclick="evFirmar()">✓ Confirmar firma</button>
      <button type="button" class="btn btn-ghost" id="btnEvCancelar" onclick="evCancelarFirma()">Cancelar</button></div>`;
  }
  return `<button type="button" class="btn btn-ghost" id="btnEvGuardar" onclick="evGuardar()"${occ ? " disabled" : ""}>${occ ? "Guardando…" : "Guardar borrador"}</button>
    <button type="button" class="btn btn-primary" style="background:var(--ok)" id="btnEvFirmar" onclick="evPedirFirma()"${occ ? " disabled" : ""}>✓ Firmar ${ev.k === "lb" ? "línea base" : "protocolo"}</button>`;
}
function evResumenHtml(ev){
  const num = evNumeros(ev);
  const max = ev.k === "lb" ? 96 : 120;
  const nota = ev.k === "lb"
    ? "Banda orientativa para el equipo: la calcula el servidor al guardar. El juicio clínico prevalece sobre el puntaje. La firma bloquea la línea base (corrección por addenda)."
    : "Escala de progreso (mayor = más progreso), no comparable con el IDEA. El total y las escalas los calcula el servidor cuando están los ítems. La firma bloquea el protocolo (corrección por addenda).";
  return `<div class="idea-summary" id="evResumen">
    <div><div class="sum-lab">Puntaje total ${ev.k === "lb" ? "IDEA" : "IPPU-TEA"}</div>
      <div class="tot"><span id="evTotal">${num.total === null || num.total === undefined ? "—" : escHtml(num.total)}</span><small> / ${max}</small></div>
      <div class="ev-etq" id="evTotalEtq">${escHtml(evTotalEtiqueta(ev, num))}</div></div>
    <div id="evBanda">${evBandaHtml(ev, num)}</div>
    <div class="nivel" id="evCuenta" aria-live="polite">${escHtml(evCuentaTxt(ev, num))}</div>
    <div class="spacer"></div>
    <div class="nota">${nota}</div>
    <div class="ev-acciones" id="evAcciones">${evAccionesHtml(ev)}</div>
  </div>`;
}
/* Actualiza SOLO lo derivado (no toca los campos que se estan tipeando). */
function evActualizar(){
  const ev = _ev(); if(!ev || ev.estado !== "listo") return;
  const num = evNumeros(ev);
  const set = (id, h) => { const e = _evEl(id); if(e) e.innerHTML = h; };
  set("evTotal", num.total === null || num.total === undefined ? "—" : escHtml(num.total));
  set("evTotalEtq", escHtml(evTotalEtiqueta(ev, num)));
  set("evBanda", evBandaHtml(ev, num));
  set("evCuenta", escHtml(evCuentaTxt(ev, num)));
  set("evEstado", evEstadoHtml(ev));
  const nom = ev.k === "lb" ? 24 : 30;
  for(let e = 0; e < 4; e++){
    const el = _evEl((ev.k === "lb" ? "sub" : "protSub") + e);
    if(!el) continue;
    const v = num.esc[e];
    if(ev.k === "lb") el.textContent = v === null || v === undefined ? "— / 24" : `${v} / 24${num.guardado ? "" : " (provisorio)"}`;
    else el.textContent = v === null || v === undefined
      ? `${num.guardado ? "completa los 6 ítems" : "—"}`
      : `${v} / ${nom}${num.guardado ? "" : " (provisorio)"}`;
  }
  set("evAcciones", evAccionesHtml(ev));
}
function evSucio(){
  const ev = _ev(); if(!ev || ev.estado !== "listo") return;
  if(!ev.sucio){ ev.sucio = true; evActualizar(); }
}

/* ---------- Interaccion de dimensiones ---------- */
function evObsDim(key){
  const ev = _ev(); if(!ev || ev.k !== "lb") return;
  const ta = _evEl("dobs-" + key); if(ta) ev.dim[key].obs = ta.value;
  evSucio();
}
function evDim(key, v){
  const ev = _ev(); if(!ev || ev.k !== "lb") return;
  const st = ev.dim[key];
  st.valor = st.valor === v ? null : v;
  ev.sucio = true;
  document.querySelectorAll(`#dim-${key} [data-dim="${key}"]`).forEach(b => {
    const val = b.dataset.ns ? "NS" : (b.dataset.v !== undefined ? +b.dataset.v : +b.dataset.inter);
    const on = st.valor === val;
    b.classList.toggle("sel", on);
    b.setAttribute("aria-pressed", on ? "true" : "false");
  });
  const s = _evEl("dsel-" + key); if(s) s.innerHTML = `Seleccionado: ${valorDimHtml(st.valor)}`;
  evActualizar();
}

/* ======================================================================
   IDEA · solo lectura (firmado)
   ====================================================================== */
function evFirmasHtml(rec){
  const f = rec.firmas || [];
  if(!f.length) return "—";
  return f.map(x => `${escHtml(nombreProfesional(x.profesional_id))}${x.rol ? " (" + escHtml(x.rol) + ")" : ""} · ${x.fecha ? fmtFecha(x.fecha) : "—"}`).join("<br>");
}
function evAddendasHtml(ev){
  const rec = ev.rec;
  const lista = (rec.addendas || []).map(a => `<li><b>${a.fecha ? fmtFecha(a.fecha) : "—"} · ${escHtml(nombreProfesional(a.profesional_id))}:</b> ${escHtml(a.texto)}</li>`).join("");
  return `<div class="info-card ev-add" id="evAddendas"><h3 id="evAddTitulo" tabindex="-1"><span class="ic" aria-hidden="true">✚</span> Addendas${addendaMarcaHtml((rec.addendas || []).length, false)}</h3>
    <div class="ib">
      ${lista ? `<ol class="ev-add-lista">${lista}</ol>` : `<p class="hint">Sin addendas. El registro firmado no se edita: toda corrección se agrega acá, con su fecha y su autor (quien tiene la sesión iniciada).</p>`}
      <div id="evAddErrores" class="form-errores" role="alert" tabindex="-1" hidden></div>
      <div class="field"><label for="ev_add_texto">Nueva addenda (corrección o aclaración)</label>
        <textarea id="ev_add_texto" aria-describedby="err_ev_add_texto"></textarea><div class="ev-err" id="err_ev_add_texto"></div></div>
      <div class="acciones-form"><button type="button" class="btn btn-primary" id="btnEvAdd" onclick="evAddenda()">+ Agregar addenda</button></div>
    </div></div>`;
}
function ideaLecturaHtml(ev){
  const r = ev.rec;
  const escNom = DIMENSIONES.map(e => e.escName);
  const escVal = [r.esc_a, r.esc_b, r.esc_c, r.esc_d];
  const filas = DIMENSIONES.map((e, ei) => e.dims.map((d, di) => {
    const k = "D" + (ei * 3 + di + 1), x = (r.dim || {})[k] || {valor: null, obs: null};
    return `<tr><th scope="row">${escHtml(d.label)}</th><td class="num">${valorDimHtml(x.valor)}</td><td>${x.obs ? escHtml(x.obs) : "—"}</td></tr>`;
  }).join("")).join("");
  const delta = ev.delta && ev.delta.delta ? `<div class="info-card"><h3><span class="ic" aria-hidden="true">△</span> Δ interanual del IDEA (${escHtml(ev.delta.anio)} − ${escHtml(ev.delta.anio_anterior)})</h3>
    <dl class="ib">
      <div class="data-row"><dt>Total</dt><dd>${fmtDelta(ev.delta.delta.total)}</dd></div>
      ${["esc_a", "esc_b", "esc_c", "esc_d"].map((c, i) => `<div class="data-row"><dt>${escHtml(escNom[i])}</dt><dd>${fmtDelta(ev.delta.delta[c])}</dd></div>`).join("")}
    </dl><div class="ib" style="padding-top:0"><p class="hint">En el IDEA menor es mejor: un Δ negativo es una mejora. Sin interpretación: la calcula el servidor al leer y solo dentro del mismo instrumento.</p></div></div>` : "";
  return `<div class="info-card ev-card">${evEncabezadoHtml(ev)}
    <div class="ib"><div id="evAvisos" class="review-note avisos-api" role="status"${(ev.avisos || []).length ? "" : " hidden"}>${evAvisosHtml(ev)}</div></div></div>
    <div class="exp-grid">
      <div>
        <div class="info-card"><h3><span class="ic" aria-hidden="true">▤</span> Puntaje</h3>
          <div class="ib ev-puntaje">
            <div class="tot-lectura"><span id="evTotal">${_num(r.total)}</span><small> / 96</small></div>
            <div id="evBanda">${r.banda ? bandaChipHtml(r.banda) : ""}</div>
            <div class="hint">Total y banda calculados por el servidor; la banda es una orientación para el equipo, no el nivel de apoyo del NNA.</div>
          </div>
          <dl class="ib">${escNom.map((n, i) => `<div class="data-row"><dt>${escHtml(n)}</dt><dd>${_num(escVal[i])} / 24</dd></div>`).join("")}</dl>
        </div>
        ${delta}
      </div>
      <div>
        <div class="info-card"><h3><span class="ic" aria-hidden="true">◐</span> Datos y firma</h3>
          <dl class="ib">
            <div class="data-row"><dt>Fecha de consenso</dt><dd>${r.fecha_consenso ? fmtFecha(r.fecha_consenso) : "—"}</dd></div>
            <div class="data-row"><dt>Sesiones de observación</dt><dd>${_num(r.sesiones)}</dd></div>
            <div class="data-row"><dt>Evaluador/a 1</dt><dd>${escHtml(nombreProfesional(r.evaluador_t1_id))}</dd></div>
            <div class="data-row"><dt>Evaluador/a 2</dt><dd>${escHtml(nombreProfesional(r.evaluador_t2_id))}</dd></div>
            <div class="data-row"><dt>Firmado por</dt><dd>${evFirmasHtml(r)}</dd></div>
            <div class="data-row"><dt>Versión del manual</dt><dd>${_txt(r.manual_version)}</dd></div>
          </dl></div>
      </div>
    </div>
    <div class="info-card"><h3><span class="ic" aria-hidden="true">≡</span> Dimensiones (solo lectura)</h3>
      <div class="ib"><div class="tabla-scroll"><table class="lista ev-tabla"><caption class="sr-only">Puntaje y observación de las 12 dimensiones del IDEA</caption>
        <thead><tr><th scope="col">Dimensión</th><th scope="col">Puntaje</th><th scope="col">Observación</th></tr></thead><tbody>${filas}</tbody></table></div></div></div>
    <div class="info-card"><h3><span class="ic" aria-hidden="true">❏</span> Síntesis y objetivos</h3>
      <dl class="ib"><div class="data-row"><dt>Síntesis clínica</dt><dd class="ev-largo">${_txt(r.sintesis)}</dd></div>
      <div class="data-row"><dt>Objetivos del período</dt><dd class="ev-largo">${_txt(r.objetivos)}</dd></div></dl></div>
    ${evAddendasHtml(ev)}`;
}

/* ======================================================================
   PROTOCOLOS · editor
   ====================================================================== */
function protItemHtml(ev, ix){
  const n = String(ix + 1), it = IPPU_ITEMS[ix], st = ev.items[n];
  const likert = [1, 2, 3, 4, 5].map(v =>
    `<button type="button" class="lik-btn${st.valor === v ? " sel" : ""}" data-ev data-i="${n}" data-v="${v}" aria-pressed="${st.valor === v}" title="${escHtml(LIKERT_LBL[v])}" onclick="evItem(${n},${v})">${v}${(v === 1 || v === 5) ? " — " + escHtml(LIKERT_LBL[v]) : ""}</button>`).join("");
  const mostrarObs = st.valor === 1 || st.valor === 5 || !!st.obs;
  return `<div class="prot-item" id="pitem-${n}">
    <div class="pit-t" id="pit-t-${n}"><b>Ítem ${n}.</b> ${escHtml(it.t)}</div>
    <div class="lik-row" id="pitemgrp-${n}" role="group" aria-labelledby="pit-t-${n}" aria-describedby="err_pitem-${n}" tabindex="-1">${likert}</div>
    <div class="ev-err" id="err_pitem-${n}"></div>
    <div class="prot-obs${mostrarObs ? " show" : ""}" id="pobsw-${n}">
      <div class="field"><label for="pobs-${n}" id="pobsl-${n}">${escHtml(protObsRotulo(st.valor))}</label>
      <textarea id="pobs-${n}" data-ev aria-describedby="err_pobs-${n}" oninput="evObsItem(${n})">${escHtml(st.obs)}</textarea></div>
      <div class="ev-err" id="err_pobs-${n}"></div>
    </div>
    <div class="pit-r">Ref.: ${escHtml(it.r)} · <i>cita documental no verificada</i></div>
  </div>`;
}
function protObsRotulo(v){
  return (v === 1 || v === 5) ? `Observación cualitativa (obligatoria para firmar: el ítem vale ${v})` : "Observación cualitativa (opcional)";
}
function protHtml(ev){
  if(ev.rec && ev.rec.firmado) return protLecturaHtml(ev);
  const rec = ev.rec || {};
  const esc = IPPU_ESCALAS.map((nom, e) => `<div class="prot-esc"><header><span>E${e + 1} · ${escHtml(nom)}</span><span class="sub" id="protSubW${e}">Ítems ${e * 6 + 1}–${e * 6 + 6} — <span id="protSub${e}"></span></span></header>
    ${IPPU_ITEMS.map((it, ix) => ix).filter(ix => IPPU_ITEMS[ix].e === e).map(ix => protItemHtml(ev, ix)).join("")}</div>`).join("");
  const esB = ev.k === "pb";
  return `<div class="info-card ev-card">${evEncabezadoHtml(ev)}
    <div class="ib">
      <p class="hint">Instrumento propio de IPPU para medir <b>progreso</b>: 24 ítems (4 escalas × 6), Likert 1–5 (1 = regresión significativa · 5 = progreso notable). <b>Observación cualitativa obligatoria en todo ítem puntuado 1 o 5</b> (la verifica el servidor). No homologable con el IDEA: nunca se comparan puntajes entre ambos instrumentos.</p>
      <div id="evAvisos" class="review-note avisos-api" role="status"${(ev.avisos || []).length ? "" : " hidden"}>${evAvisosHtml(ev)}</div>
      <div id="evErrores" class="form-errores" role="alert" tabindex="-1" hidden></div>
    </div></div>
    ${evEvaluadoresHtml(ev)}
    <div id="protForm" style="margin-top:16px">${esc}</div>
    <div class="card" style="margin-top:16px">
      <div class="cardhead" style="padding:13px 18px;border-bottom:1px solid var(--line)"><h2 style="font-size:.82rem;text-transform:uppercase;letter-spacing:.04em;color:var(--ink-2)">Datos del ${esB ? "Protocolo B (HCE-PB)" : "Protocolo A (HCE-PA)"}</h2></div>
      <div style="padding:16px 18px">
        <div class="form-grid">
          <div class="field"><label for="prot_fecha">Fecha de aplicación <span class="req" aria-hidden="true">*</span><span class="sr-only">(necesaria para firmar)</span></label>
            <input id="prot_fecha" type="date" data-ev value="${escHtml(cv(ev, "prot_fecha", rec.fecha || ""))}" aria-describedby="err_prot_fecha" oninput="evSucio()"><div class="ev-err" id="err_prot_fecha"></div></div>
          <div class="field"><label for="prot_semanas">Semanas de asistencia efectiva</label>
            <input id="prot_semanas" type="number" min="0" data-ev value="${escHtml(cv(ev, "prot_semanas", _vacio(rec.semanas) ? "" : rec.semanas))}" aria-describedby="hint_prot_semanas err_prot_semanas" oninput="evSucio()">
            <div class="hint" id="hint_prot_semanas">Recomendado ≥ 15 (el servidor avisa, no bloquea).</div><div class="ev-err" id="err_prot_semanas"></div></div>
        </div>
        <div class="form-grid full">
          <div class="field"><label for="prot_sint1">Síntesis — Técnico 1 <span class="req" aria-hidden="true">*</span><span class="sr-only">(necesaria para firmar)</span></label>
            <textarea id="prot_sint1" data-ev aria-describedby="err_prot_sint1" oninput="evSucio()">${escHtml(cv(ev, "prot_sint1", rec.sint_tec1 || ""))}</textarea><div class="ev-err" id="err_prot_sint1"></div></div>
          <div class="field"><label for="prot_sint2">Síntesis — Técnico 2 <span class="req" aria-hidden="true">*</span><span class="sr-only">(necesaria para firmar)</span></label>
            <textarea id="prot_sint2" data-ev aria-describedby="err_prot_sint2" oninput="evSucio()">${escHtml(cv(ev, "prot_sint2", rec.sint_tec2 || ""))}</textarea><div class="ev-err" id="err_prot_sint2"></div></div>
          <div class="field"><label for="prot_otros">Otras valoraciones profesionales</label>
            <textarea id="prot_otros" data-ev aria-describedby="err_prot_otros" oninput="evSucio()">${escHtml(cv(ev, "prot_otros", rec.otros || ""))}</textarea><div class="ev-err" id="err_prot_otros"></div></div>
          ${esB ? `<div class="field"><label for="prot_ajustes">Ajustes introducidos durante el año</label>
            <textarea id="prot_ajustes" data-ev aria-describedby="err_prot_ajustes" oninput="evSucio()">${escHtml(cv(ev, "prot_ajustes", rec.ajustes || ""))}</textarea><div class="ev-err" id="err_prot_ajustes"></div></div>` : ""}
        </div>
      </div>
    </div>
    ${evResumenHtml(ev)}`;
}
function evItem(n, v){
  const ev = _ev(); if(!ev || ev.k === "lb") return;
  const st = ev.items[String(n)];
  st.valor = st.valor === v ? null : v;
  ev.sucio = true;
  document.querySelectorAll(`#pitem-${n} .lik-btn`).forEach(b => {
    const on = st.valor === +b.dataset.v;
    b.classList.toggle("sel", on); b.setAttribute("aria-pressed", on ? "true" : "false");
  });
  evObsItem(n, true);
  evActualizar();
}
/* La observacion se muestra si el item vale 1/5 (obligatoria para firmar) o si ya tiene texto. */
function evObsItem(n, desdeClick){
  const ev = _ev(); if(!ev) return;
  const st = ev.items[String(n)], ta = _evEl("pobs-" + n);
  if(ta) st.obs = ta.value;
  const w = _evEl("pobsw-" + n), l = _evEl("pobsl-" + n);
  if(w) w.classList.toggle("show", st.valor === 1 || st.valor === 5 || !!st.obs);
  if(l) l.textContent = protObsRotulo(st.valor);
  if(!desdeClick) evSucio();
}

/* ======================================================================
   PROTOCOLOS · solo lectura (firmado)
   ====================================================================== */
const ESC_CLAVE_PROT = ["esc_1", "esc_2", "esc_3", "esc_4"];
function deltaBloqueHtml(r){
  if(r.tipo !== "B") return "";
  if(!r.deltas){
    return `<div class="info-card"><h3><span class="ic" aria-hidden="true">△</span> Δ B − A</h3><div class="ib">
      <p class="hint" id="evDeltaNota">El Δ todavía no se calculó: el Protocolo A de ${escHtml(r.anio)} no estaba firmado cuando se firmó este B. El servidor lo completa en cuanto se firme el A.</p></div></div>`;
  }
  const interp = r.interpretacion || {};
  const alertas = r.alertas || [];
  const fila = (clave, nombre) => {
    const it = interp[clave];
    const al = alertas.some(a => a.escala === clave);
    return `<tr data-delta="${clave}"><th scope="row">${escHtml(nombre)}</th><td class="num"><b>${_vacio(r.deltas[clave]) ? "—" : fmtDelta(r.deltas[clave])}</b></td>
      <td>${it ? escHtml(it.etiqueta) : "—"}${al ? ` <span class="ev-alerta"><span aria-hidden="true">⚠</span> alerta institucional</span>` : ""}</td><td>${it ? escHtml(it.accion) : "—"}</td></tr>`;
  };
  const alertaTxt = alertas.length
    ? `<div class="review-note ev-alertas" role="status"><span aria-hidden="true">⚠</span><div><b>Alerta institucional:</b> ${alertas.map(a => `${escHtml(IPPU_ESCALAS[ESC_CLAVE_PROT.indexOf(a.escala)] || a.escala)} (Δ ${fmtDelta(a.delta)}, ${escHtml(a.etiqueta)})`).join(" · ")}. La registra el servidor al firmar el B.</div></div>` : "";
  return `<div class="info-card"><h3><span class="ic" aria-hidden="true">△</span> Δ B − A (calculado por el servidor)</h3><div class="ib">
    ${alertaTxt}
    <div class="tabla-scroll"><table class="lista ev-tabla" id="evDeltaTabla"><caption class="sr-only">Diferencia entre el Protocolo B y el A por escala y total</caption>
      <thead><tr><th scope="col">Escala</th><th scope="col">Δ</th><th scope="col">Lectura</th><th scope="col">Acción sugerida</th></tr></thead>
      <tbody>${IPPU_ESCALAS.map((n, i) => fila(ESC_CLAVE_PROT[i], `E${i + 1} · ${n}`)).join("")}${fila("total", "Total")}</tbody></table></div>
    <p class="hint">Solo entre protocolos IPPU-TEA (nunca contra el IDEA). La alerta se evalúa por escala; el total se interpreta pero no alerta.</p></div></div>`;
}
function protLecturaHtml(ev){
  const r = ev.rec;
  const esc = IPPU_ESCALAS.map((nom, e) => `<div class="prot-esc"><header><span>E${e + 1} · ${escHtml(nom)}</span><span class="sub">${_num(r[ESC_CLAVE_PROT[e]])} / 30</span></header>
    ${IPPU_ITEMS.map((it, ix) => ix).filter(ix => IPPU_ITEMS[ix].e === e).map(ix => {
      const n = String(ix + 1), x = (r.items || {})[n] || {valor: null, obs: null};
      return `<div class="prot-item"><div class="pit-t"><b>Ítem ${n}.</b> ${escHtml(IPPU_ITEMS[ix].t)}</div>
        <div><span class="score-badge sb-lik">${_vacio(x.valor) ? "—" : escHtml(x.valor)}</span> ${_vacio(x.valor) ? "sin puntuar" : escHtml(LIKERT_LBL[x.valor] || "")}</div>
        ${x.obs ? `<p class="ev-largo"><b>Observación:</b> ${escHtml(x.obs)}</p>` : ""}</div>`;
    }).join("")}</div>`).join("");
  return `<div class="info-card ev-card">${evEncabezadoHtml(ev)}
    <div class="ib"><div id="evAvisos" class="review-note avisos-api" role="status"${(ev.avisos || []).length ? "" : " hidden"}>${evAvisosHtml(ev)}</div></div></div>
    <div class="exp-grid">
      <div>
        <div class="info-card"><h3><span class="ic" aria-hidden="true">▤</span> Puntaje</h3>
          <div class="ib ev-puntaje"><div class="tot-lectura"><span id="evTotal">${_num(r.total)}</span><small> / 120</small></div>
            <div class="hint">Escala de progreso (mayor = más progreso). Calculada por el servidor.</div></div>
          <dl class="ib">${IPPU_ESCALAS.map((n, i) => `<div class="data-row"><dt>E${i + 1} · ${escHtml(n)}</dt><dd>${_num(r[ESC_CLAVE_PROT[i]])} / 30</dd></div>`).join("")}</dl></div>
        ${deltaBloqueHtml(r)}
      </div>
      <div>
        <div class="info-card"><h3><span class="ic" aria-hidden="true">◐</span> Datos y firma</h3>
          <dl class="ib">
            <div class="data-row"><dt>Fecha de aplicación</dt><dd>${r.fecha ? fmtFecha(r.fecha) : "—"}</dd></div>
            <div class="data-row"><dt>Semanas de asistencia</dt><dd>${_num(r.semanas)}</dd></div>
            <div class="data-row"><dt>Evaluador/a 1</dt><dd>${escHtml(nombreProfesional(r.evaluador_t1_id))}</dd></div>
            <div class="data-row"><dt>Evaluador/a 2</dt><dd>${escHtml(nombreProfesional(r.evaluador_t2_id))}</dd></div>
            <div class="data-row"><dt>Firmado por</dt><dd>${evFirmasHtml(r)}</dd></div>
          </dl></div>
        <div class="info-card"><h3><span class="ic" aria-hidden="true">❏</span> Síntesis</h3>
          <dl class="ib"><div class="data-row"><dt>Técnico 1</dt><dd class="ev-largo">${_txt(r.sint_tec1)}</dd></div>
            <div class="data-row"><dt>Técnico 2</dt><dd class="ev-largo">${_txt(r.sint_tec2)}</dd></div>
            <div class="data-row"><dt>Otras valoraciones</dt><dd class="ev-largo">${_txt(r.otros)}</dd></div>
            ${r.tipo === "B" ? `<div class="data-row"><dt>Ajustes durante el año</dt><dd class="ev-largo">${_txt(r.ajustes)}</dd></div>` : ""}</dl></div>
      </div>
    </div>
    <div class="info-card"><h3><span class="ic" aria-hidden="true">≡</span> Ítems (solo lectura)</h3><div class="ib" style="padding:0">${esc}</div></div>
    ${evAddendasHtml(ev)}`;
}

/* ======================================================================
   ESCRITURA: cuerpos, errores, guardar, firmar, addenda
   ====================================================================== */
const _bruto = (id) => { const e = _evEl(id); return e ? e.value : ""; };
const _idONada = (s) => s === "" ? "" : (isNaN(Number(s)) ? s : Number(s));
const _baseTxt = (v) => _vacio(v) ? "" : String(v);

/* Solo lo que cambio respecto de lo guardado (comparacion de valores tal cual, sin normalizar en el navegador). */
function evCuerpo(ev){
  const rec = ev.rec;
  const body = {};
  const campos = ev.k === "lb"
    ? [["fecha_consenso", "lb_fecha", rec && rec.fecha_consenso], ["sesiones", "lb_sesiones", rec && rec.sesiones],
       ["sintesis", "lb_sintesis", rec && rec.sintesis], ["objetivos", "lb_objetivos", rec && rec.objetivos]]
    : [["fecha", "prot_fecha", rec && rec.fecha], ["semanas", "prot_semanas", rec && rec.semanas],
       ["sint_tec1", "prot_sint1", rec && rec.sint_tec1], ["sint_tec2", "prot_sint2", rec && rec.sint_tec2],
       ["otros", "prot_otros", rec && rec.otros]];
  if(ev.k === "pb") campos.push(["ajustes", "prot_ajustes", rec && rec.ajustes]);
  campos.push(["evaluador_t1_id", "ev_t1", rec && rec.evaluador_t1_id], ["evaluador_t2_id", "ev_t2", rec && rec.evaluador_t2_id]);
  campos.forEach(([campo, id, base]) => {
    const ahora = _bruto(id);
    if(ahora !== _baseTxt(base)) body[campo] = /_id$/.test(campo) || campo === "sesiones" || campo === "semanas" ? _idONada(ahora) : ahora;
  });
  const trabajo = ev.k === "lb" ? ev.dim : ev.items;
  const baseMap = ev.k === "lb" ? (rec && rec.dim) : (rec && rec.items);
  const cambios = {};
  Object.keys(trabajo).forEach(k => {
    const a = trabajo[k], b = (baseMap && baseMap[k]) || {valor: null, obs: null};
    const ta = _evEl((ev.k === "lb" ? "dobs-" : "pobs-") + k);
    if(ta) a.obs = ta.value;
    const o = {};
    if((a.valor === undefined ? null : a.valor) !== (b.valor === undefined ? null : b.valor)) o.valor = a.valor;
    if(_baseTxt(a.obs) !== _baseTxt(b.obs)) o.obs = a.obs;
    if(Object.keys(o).length) cambios[k] = o;
  });
  if(Object.keys(cambios).length) body[ev.k === "lb" ? "dim" : "items"] = cambios;
  return body;
}

/* campo de la API -> {ctl, err, rot} */
function evMapaCampo(ev, campo){
  if(!campo) return null;
  let m;
  const comunes = {
    evaluador_t1_id: {ctl: "ev_t1", err: "err_ev_t1", rot: "Evaluador/a 1"},
    evaluador_t2_id: {ctl: "ev_t2", err: "err_ev_t2", rot: "Evaluador/a 2"}
  };
  if(comunes[campo]) return comunes[campo];
  if(ev.k === "lb"){
    if((m = /^dim\.(D\d+)\.obs$/.exec(campo))) return {ctl: "dobs-" + m[1], err: "err_dobs_" + m[1], rot: "Observación de " + m[1], abrir: "dobsd-" + m[1]};
    if((m = /^dim\.(D\d+)/.exec(campo))) return {ctl: "dimgrp-" + m[1], err: "err_dim_" + m[1], rot: "Dimensión " + m[1].slice(1)};
    const t = {fecha_consenso: ["lb_fecha", "Fecha de consenso"], sesiones: ["lb_sesiones", "Sesiones previas"], sintesis: ["lb_sintesis", "Síntesis clínica"], objetivos: ["lb_objetivos", "Objetivos"]}[campo];
    return t ? {ctl: t[0], err: "err_" + t[0], rot: t[1]} : null;
  }
  if((m = /^items\.(\d+)\.obs$/.exec(campo))) return {ctl: "pobs-" + m[1], err: "err_pobs-" + m[1], rot: "Ítem " + m[1] + " · observación", mostrar: "pobsw-" + m[1]};
  if((m = /^items\.(\d+)/.exec(campo))) return {ctl: "pitemgrp-" + m[1], err: "err_pitem-" + m[1], rot: "Ítem " + m[1]};
  const t = {fecha: ["prot_fecha", "Fecha de aplicación"], semanas: ["prot_semanas", "Semanas"], sint_tec1: ["prot_sint1", "Síntesis del técnico 1"],
    sint_tec2: ["prot_sint2", "Síntesis del técnico 2"], otros: ["prot_otros", "Otras valoraciones"], ajustes: ["prot_ajustes", "Ajustes"]}[campo];
  return t ? {ctl: t[0], err: "err_" + t[0], rot: t[1]} : null;
}
function evLimpiarErrores(){
  const p = _evEl("panelExp"); if(!p) return;
  p.querySelectorAll(".ev-err").forEach(e => { e.textContent = ""; });
  p.querySelectorAll("[aria-invalid]").forEach(e => e.removeAttribute("aria-invalid"));
  p.querySelectorAll("[data-invalid]").forEach(e => e.removeAttribute("data-invalid"));
  p.querySelectorAll(".invalid").forEach(e => e.classList.remove("invalid"));
  ["evErrores", "evAddErrores"].forEach(id => { const r = _evEl(id); if(r){ r.hidden = true; r.innerHTML = ""; } });
}
function evMarcar(map, mensaje){
  const c = _evEl(map.ctl), e = _evEl(map.err);
  if(map.abrir){ const d = _evEl(map.abrir); if(d) d.open = true; }
  if(map.mostrar){ const w = _evEl(map.mostrar); if(w) w.classList.add("show"); }
  if(e) e.textContent = e.textContent && e.textContent !== mensaje ? e.textContent + " " + mensaje : mensaje;
  if(c){
    if(c.matches("input,select,textarea")) c.setAttribute("aria-invalid", "true"); else c.setAttribute("data-invalid", "true");
    const f = c.closest(".field,.dimension,.prot-item"); if(f) f.classList.add("invalid");
  }
}
function evIr(id){ const e = _evEl(id); if(e){ e.scrollIntoView({block: "center"}); e.focus(); } return false; }
function evMostrarErrores(ev, err, titulo, resumenId){
  const detalle = err instanceof ApiError && err.detail.length ? err.detail : [{campo: null, mensaje: err.message || "No se pudo completar la acción."}];
  const items = detalle.map(d => {
    const m = evMapaCampo(ev, d.campo);
    if(m) evMarcar(m, d.mensaje);
    return {m, mensaje: d.mensaje};
  });
  const r = _evEl(resumenId || "evErrores");
  if(!r) return;
  r.innerHTML = `<b>${escHtml(titulo)}</b><ul>` + items.map(it => it.m
    ? `<li><a href="#${escHtml(it.m.ctl)}" onclick="return evIr('${escHtml(it.m.ctl)}')">${escHtml(it.m.rot)}: ${escHtml(it.mensaje)}</a></li>`
    : `<li>${escHtml(it.mensaje)}</li>`).join("") + `</ul>`;
  r.hidden = false;
  r.scrollIntoView({block: "center"});
  r.focus({preventScroll: true});
}

function _ocupado(ev, si){ ev.guardando = si; const a = _evEl("evAcciones"); if(a) a.innerHTML = evAccionesHtml(ev); }
function _juntarAvisos(a, b){
  const m = [...(a || [])];
  (b || []).forEach(w => { if(!m.some(x => x.mensaje === w.mensaje)) m.push(w); });
  return m;
}

/* Guarda el borrador (POST si no existe, PATCH solo con lo que cambio). Devuelve true si quedo guardado. */
async function evGuardar(opts){
  const ev = _ev();
  if(!ev || ev.estado !== "listo" || ev.guardando) return false;
  const paraFirmar = !!(opts && opts.paraFirmar);
  const mi = EXP.seq, id = EXP.id;
  evLimpiarErrores();
  const body = evCuerpo(ev);
  if(ev.rec && !Object.keys(body).length){
    if(!paraFirmar){ ev.avisos = []; evPintarAvisos(); toast("No hay cambios para guardar"); }
    return true;
  }
  if(!ev.rec){ if(ev.k === "lb") body.anio = ev.anio; else { body.tipo = EV_INFO[ev.k].tipo; body.anio = ev.anio; } }
  _ocupado(ev, true);
  try{
    const r = ev.rec
      ? await apiFetch(_rutaRec(ev.k, ev.rec.id), {method: "PATCH", body})
      : await apiFetch(_rutaLista(ev.k, id), {method: "POST", body});
    if(mi !== EXP.seq || EVS[ev.k] !== ev) return false;
    ev.rec = r.data;
    ev.sucio = false; ev.campos = null;
    ev.avisos = r.warnings || [];
    ev.guardando = false;
    if(EXP.mods) EXP.mods[ev.k] = ev.rec;
    evActualizar(); evPintarAvisos();
    pintarTabsExp(); pintarFlujo();
    if(!paraFirmar){ toast(r.status === 201 ? "Borrador creado" : "Borrador guardado"); refrescarListaTrasEscritura(); recargarFlujoExp(true); }
    return true;
  }catch(err){
    if(mi !== EXP.seq || EVS[ev.k] !== ev) return false;
    ev.guardando = false;
    const a = _evEl("evAcciones"); if(a) a.innerHTML = evAccionesHtml(ev);
    if(err instanceof ApiError && err.status === 409){ await evResolver409(ev, err); return false; }
    evMostrarErrores(ev, err, "No se pudo guardar:");
    return false;
  }
}

/* 409: el registro ya esta firmado (o ya existe): se vuelve a leer y se muestra lo que hay. */
async function evResolver409(ev, err){
  ev.avisos = [{mensaje: err.message + " Se muestra el registro tal como está en el servidor."}];
  ev.sucio = false;
  await evCargar(ev.k, true);
  const e2 = EVS[ev.k];
  if(e2){ e2.avisos = ev.avisos; evPintarAvisos(); }
  recargarFlujoExp(true); refrescarListaTrasEscritura();
  const t = _evEl("evTitulo"); if(t) t.focus();
}

function evPedirFirma(){
  const ev = _ev(); if(!ev || ev.guardando) return;
  ev.confirmando = true;
  const a = _evEl("evAcciones"); if(a) a.innerHTML = evAccionesHtml(ev);
  const b = _evEl("btnEvConfirmar"); if(b) b.focus();
}
function evCancelarFirma(){
  const ev = _ev(); if(!ev) return;
  ev.confirmando = false;
  const a = _evEl("evAcciones"); if(a) a.innerHTML = evAccionesHtml(ev);
  const b = _evEl("btnEvFirmar"); if(b) b.focus();
}

/* Firmar = guardar lo pendiente + POST .../firmar SIN cuerpo. Los 422 (incluidos los evaluadores) vuelven por campo. */
async function evFirmar(){
  const ev = _ev();
  if(!ev || ev.estado !== "listo" || ev.guardando) return;
  const mi = EXP.seq;
  ev.confirmando = false;
  const ok = await evGuardar({paraFirmar: true});
  if(!ok || mi !== EXP.seq || EVS[ev.k] !== ev) return;
  const avisosGuardado = ev.avisos;
  _ocupado(ev, true);
  try{
    const r = await apiFetch(_rutaRec(ev.k, ev.rec.id) + "/firmar", {method: "POST"});
    if(mi !== EXP.seq || EVS[ev.k] !== ev) return;
    ev.rec = r.data;
    ev.avisos = _juntarAvisos(avisosGuardado, r.warnings);
    ev.guardando = false; ev.sucio = false;
    if(EXP.mods) EXP.mods[ev.k] = ev.rec;
    if(ev.k === "lb"){
      try{ const rd = await apiFetch(`/hce/${EXP.id}/idea/delta`, {query: {anio: ev.anio}}); ev.delta = rd.data && rd.data.delta ? rd.data : null; }catch(_e){ ev.delta = null; }
      if(mi !== EXP.seq || EVS[ev.k] !== ev) return;
    }
    evRepintar(ev.k);
    const t = _evEl("evTitulo"); if(t) t.focus();
    toast(`${EV_INFO[ev.k].modulo} firmado`);
    pintarTabsExp(); pintarFlujo();
    recargarFlujoExp(true); refrescarListaTrasEscritura();
    if(ev.k === "lb") cargarIdeaVigente();
    if(ev.k === "pa") evRelecturaPB();
  }catch(err){
    if(mi !== EXP.seq || EVS[ev.k] !== ev) return;
    ev.guardando = false;
    const a = _evEl("evAcciones"); if(a) a.innerHTML = evAccionesHtml(ev);
    if(err instanceof ApiError && err.status === 409){ await evResolver409(ev, err); return; }
    evMostrarErrores(ev, err, "No se pudo firmar:");
  }
}

/* Firmado un PA, el servidor completa el Δ del PB del mismo año si ese B se habia firmado antes: se vuelve a leer. */
async function evRelecturaPB(){
  const mi = EXP.seq;
  const pb = EXP.mods && EXP.mods.pb;
  if(!pb) return;
  try{
    const r = await apiFetch(`/protocolo/${pb.id}`);
    if(mi !== EXP.seq) return;
    if(EXP.mods) EXP.mods.pb = r.data;
    const e = EVS.pb;
    if(e && e.hceId === EXP.id && !e.sucio){ e.rec = r.data; if(EXP.tab === "pb") evRepintar("pb"); }
    pintarTabsExp(); pintarFlujo();
  }catch(_e){ /* el PB se vuelve a leer al abrir su pestaña */ }
}

async function evAddenda(){
  const ev = _ev();
  if(!ev || !ev.rec || !ev.rec.firmado) return;
  const mi = EXP.seq;
  evLimpiarErrores();
  const texto = _bruto("ev_add_texto");
  const btn = _evEl("btnEvAdd"); if(btn){ btn.disabled = true; btn.textContent = "Agregando…"; }
  try{
    const r = await apiFetch(_rutaRec(ev.k, ev.rec.id) + "/addendas", {method: "POST", body: {texto}});
    if(mi !== EXP.seq || EVS[ev.k] !== ev) return;
    ev.rec = r.data;
    ev.avisos = r.warnings || [];
    if(EXP.mods) EXP.mods[ev.k] = ev.rec;
    const ta = _evEl("ev_add_texto"); if(ta) ta.value = "";      // ya quedó guardada: no se restaura al repintar
    evRepintar(ev.k);
    toast("Addenda registrada");
    const t = _evEl("evAddTitulo"); if(t) t.focus();
    pintarTabsExp(); pintarFlujo();
  }catch(err){
    if(mi !== EXP.seq || EVS[ev.k] !== ev) return;
    if(btn){ btn.disabled = false; btn.textContent = "+ Agregar addenda"; }
    const detalle = err instanceof ApiError && err.detail.length ? err.detail : [{campo: null, mensaje: err.message || "No se pudo agregar la addenda."}];
    detalle.forEach(d => { if(d.campo === "texto") evMarcar({ctl: "ev_add_texto", err: "err_ev_add_texto"}, d.mensaje); });
    const r = _evEl("evAddErrores");
    r.innerHTML = `<b>No se pudo agregar la addenda:</b><ul>` + detalle.map(d => d.campo === "texto"
      ? `<li><a href="#ev_add_texto" onclick="return evIr('ev_add_texto')">Addenda: ${escHtml(d.mensaje)}</a></li>` : `<li>${escHtml(d.mensaje)}</li>`).join("") + `</ul>`;
    r.hidden = false; r.scrollIntoView({block: "center"}); r.focus({preventScroll: true});
  }
}
