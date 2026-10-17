/* Expediente clinico (HCE) + informe imprimible.
   Demo L1 HCE+IDEA - IPPU x UTEC-LIDIA.
   Extraido del monolito (lineas 2618-2886) sin cambios de logica.
   Nota: 2774-2780 se movieron a utils.js (ver su cabecera).
   Los scripts se cargan en orden en index.html: el orden ES la semantica. */
/* ===================== EXPEDIENTE CONECTADO · HCE-00 editable, CI y flujo (Fase 3-a/3-b) =====================
   handoff §5.122 / §5.124. abrirExpediente(id) carga GET /hce/{id} (+ GET /hce/{id}/flujo para el estado de
   los modulos) y pinta SOLO lo que la API tiene. Lo que la API no guarda (nivel de soporte, talleres,
   historial, antecedentes) no se muestra. HCE-00 se edita (PATCH, wizard-nna.js) y el CI se registra y se
   edita desde su pestana (POST/PATCH /hce/{id}/consentimiento). Los modulos que todavia no estan conectados
   son pestanas con el panel de modo demostracion y SIN datos: no se mezcla una persona de la API con datos
   de ejemplo. El expediente de ejemplo (datos.js) sigue en abrirExpedienteDemo().
   El estado de cada modulo sale SIEMPRE de GET /hce/{id}/flujo: nada se bloquea en el navegador (§5.94,
   §5.95); fuera de secuencia es un aviso, y el CI pendiente es un estado visible, no un candado. */
const EXP = { id:null, seq:0, hce:null, raw:null, flujo:null, flujoError:false, tab:"hce00", ci:null, avisos:[], mods:null, idea:null, ayuda:false };

/* Pestañas del expediente (F1, H1/H8): nombre completo + código como texto secundario, agrupadas. El flujo del año vive en las
   pestañas del «Ciclo anual» (ya no hay tarjeta aparte): cada una lleva su estado de GET /hce/{id}/flujo, con glifo y texto.
   `mod`: eslabón del flujo anual · `g`: grupo · `c`: nombre corto de la pestaña, si el nombre completo no entra en una fila a
   1280 px (F1b, §5.141; el completo queda en `t`, en el tooltip y en el encabezado del panel) · `d`: nombre largo (encabezado del
   panel) · `demo`: todavía no conectada (lleva la marca compacta «Solo demo»).
   El orden de los grupos es una decisión del equipo (§5.140): SEV va en «Seguimiento», no entre CI e IDEA como en el Prototipo. */
const TABS_EXP = [
  {k:"hce00", r:"HCE-00", t:"Datos",               g:"datos", d:"Identificación y datos clínicos"},
  {k:"ci",    r:"CI",  t:"Consentimiento",          g:"ciclo", d:"Consentimiento informado"},
  {k:"lb",    r:"LB",  t:"Línea base",              g:"ciclo", d:"Línea base — IDEA",            mod:"HCE-LB"},
  {k:"pa",    r:"PA",  t:"Protocolo A",             g:"ciclo", d:"Protocolo A (IPPU-TEA)",       mod:"HCE-PA"},
  {k:"pb",    r:"PB",  t:"Protocolo B",             g:"ciclo", d:"Protocolo B (IPPU-TEA)",       mod:"HCE-PB"},
  {k:"ic",    r:"IC",  t:"Informe de cierre",       g:"ciclo", d:"Informe de cierre anual",      mod:"HCE-IC", c:"Cierre"},
  {k:"vf",    r:"VF",  t:"Valoración funcional",    g:"seg",   d:"Valoración funcional",         c:"Valoración"},
  {k:"sev",   r:"SEV", t:"Severidad",               g:"seg",   d:"Severidad (DSM-5-TR)"},
  {k:"inc",   r:"INC", t:"Inclusión",               g:"seg",   d:"Inclusión educativa y social", demo:true},
  {k:"org",   r:"ORG", t:"Organismos",              g:"seg",   d:"Áreas INAU y BPS",             demo:true},
  {k:"doc",   r:"DOC", t:"Documentos",              g:"reg",   d:"Documentos y fotos",           demo:true},
  {k:"pai",   r:"PAI", t:"PAI",                     g:"reg",   d:"Propuesta de atención individual", demo:true},
  {k:"log",   r:"LOG", t:"Auditoría",               g:"reg",   d:"Registro de cambios"}
];
const GRUPOS_TABS = [["datos", ""], ["ciclo", "Ciclo anual"], ["seg", "Seguimiento"], ["reg", "Registro"]];
const MOD_NOMBRE = {"HCE-LB":"Línea base (IDEA)", "HCE-PA":"Protocolo A", "HCE-PB":"Protocolo B", "HCE-IC":"Informe de cierre"};

function _estadoTab(t){
  if(!EXP.flujo) return null;
  if(t.k === "ci") return EXP.flujo.ci === "registrado" ? "registrado" : "ci_pendiente";
  if(t.mod && EXP.flujo.modulos[t.mod]) return EXP.flujo.modulos[t.mod].estado;
  return null;
}

/* Marcas de la pestaña: estado (glifo + texto para lectores de pantalla), addenda y «fuera de secuencia». Nada se bloquea (§5.95). */
function _marcasTab(t){
  const est = _estadoTab(t);
  if(est === "ci_pendiente") return `<span class="st-mini st-ci-pend"><span aria-hidden="true">⚠</span><span class="sr-only">: pendiente</span></span>`;
  if(est === "registrado") return `<span class="st-mini st-firmado"><span aria-hidden="true">●</span><span class="sr-only">: registrado</span></span>`;
  if(!est) return "";
  const e = ESTADO_MOD_TXT[est] || ESTADO_MOD_TXT.sin_iniciar;
  const mo = EXP.flujo.modulos[t.mod] || {};
  const fuera = est !== "sin_iniciar" && mo.faltantes && mo.faltantes.length
    ? `<span class="st-mini st-fuera"><span aria-hidden="true">!</span><span class="sr-only">, fuera de secuencia: falta firmar ${escHtml(mo.faltantes.map(x => MOD_CORTO[x] || x).join(", "))}</span></span>` : "";
  return `<span class="st-mini st-${est}"><span aria-hidden="true">${e.glifo}</span><span class="sr-only">: ${e.txt}</span></span>${addendaMarcaHtml(nAddendas(t.k), true)}${fuera}`;
}
function _tabHtml(t){
  const sel = EXP.tab === t.k;
  const nombre = escHtml(t.c || t.t);
  const mo = t.mod && EXP.flujo ? EXP.flujo.modulos[t.mod] : null;
  const titulo = mo && mo.faltantes && mo.faltantes.length && mo.estado !== "sin_iniciar"
    ? `${t.d} — fuera de secuencia: falta firmar ${mo.faltantes.map(x => MOD_CORTO[x] || x).join(", ")}` : t.d;
  return `<button type="button" role="tab" class="exp-tab" id="tabExp-${t.k}" data-tab="${t.k}"${t.mod ? ` data-mod="${t.mod}"` : ""}
    aria-selected="${sel}" aria-controls="panelExp" tabindex="${sel ? 0 : -1}" title="${escHtml(titulo)}" onclick="selTabExp('${t.k}')">
    <span class="tab-nombre">${nombre}</span><span class="tab-cod">${t.r}${_marcasTab(t)}${t.demo ? badgeSoloDemoTab() : ""}</span></button>`;
}
/* Las pestañas van en grupos con su rótulo (decorativo: aria-hidden; el año del ciclo va en el nombre de la lista). La ayuda «?»
   (orden y estados) va al FINAL de la tira, en el DOM y a la vista (F1b, §5.141): el orden de Tab sigue al visual. */
function tabsExpedienteHtml(){
  const anio = EXP.flujo ? EXP.flujo.anio : "";
  const grupos = GRUPOS_TABS.map(([g, rot]) => `<div class="tabs-grupo tabs-grupo-${g}" role="presentation">
      <span class="tabs-grupo-rot" aria-hidden="true">${rot === "Ciclo anual" && anio ? `${rot} ${escHtml(anio)}` : rot}</span>
      <div class="tabs-grupo-fila" role="presentation">${TABS_EXP.filter(t => t.g === g).map(_tabHtml).join("")}</div></div>`).join("");
  const estadoFlujo = EXP.flujoError ? estadoErrorInlineHtml("No se pudo cargar el estado de los módulos.", "recargarFlujoExp()") : "";
  return `<div class="tabs-barra">
      <div class="exp-tabs" role="tablist" aria-label="Módulos del expediente${anio ? ` (ciclo anual ${escHtml(anio)})` : ""}" onkeydown="teclaTabExp(event)">${grupos}</div>
      <button type="button" class="btn-ayuda" id="btnAyudaFlujo" aria-expanded="${EXP.ayuda}" aria-controls="ayudaFlujo" onclick="alternarAyudaFlujo()"
        aria-label="Ayuda: orden y estados del ciclo anual" title="Orden y estados del ciclo anual"><span aria-hidden="true">?</span></button>
    </div>
    <div class="ayuda-flujo" id="ayudaFlujo"${EXP.ayuda ? "" : " hidden"}>
      <p><b>Ciclo anual${anio ? " " + escHtml(anio) : ""}:</b> Consentimiento → Línea base → Protocolo A → Protocolo B → Informe de cierre.</p>
      <p><span aria-hidden="true">●</span> firmado · <span aria-hidden="true">◐</span> en curso · <span aria-hidden="true">○</span> sin iniciar · <span aria-hidden="true">✚</span> con addenda · <span aria-hidden="true">!</span> fuera de secuencia · <span aria-hidden="true">⚠</span> consentimiento pendiente.</p>
      <p>El orden y el consentimiento no bloquean ningún módulo: se puede trabajar en cualquier orden y, si algo queda fuera de secuencia, se avisa al guardar.</p>
    </div>${estadoFlujo}`;
}
function alternarAyudaFlujo(){
  EXP.ayuda = !EXP.ayuda;
  pintarTabsExp();
  const b = document.getElementById("btnAyudaFlujo"); if(b) b.focus();
}

function teclaTabExp(ev){
  const ks = TABS_EXP.map(t=>t.k);
  let i = ks.indexOf(EXP.tab);
  if(ev.key === "ArrowRight") i = (i + 1) % ks.length;
  else if(ev.key === "ArrowLeft") i = (i - 1 + ks.length) % ks.length;
  else if(ev.key === "Home") i = 0;
  else if(ev.key === "End") i = ks.length - 1;
  else return;
  ev.preventDefault();
  selTabExp(ks[i], true);
}

/* El panel de la pestaña (role="tabpanel") es alcanzable con Tab SOLO cuando no tiene nada operable adentro (los módulos en modo
   demostración son un texto): sin eso, quien navega con teclado no puede llegar a leerlo ni a desplazarlo (patrón de tabpanel del APG).
   Se recalcula con cada repintado del panel, venga de donde venga (un módulo conectado escribe en #panelExp por su cuenta). */
const _PANEL_OPERABLE = "button:not([disabled]), a[href], input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex='-1'])";
function ajustarFocoPanelExp(){
  const p = document.getElementById("panelExp");
  if(!p) return;
  const operable = p.querySelector(_PANEL_OPERABLE);
  if(operable){ if(p.getAttribute("tabindex") === "0") p.removeAttribute("tabindex"); }
  else if(p.getAttribute("tabindex") !== "0") p.setAttribute("tabindex", "0");
}
function vigilarPanelExp(){
  const p = document.getElementById("panelExp");
  if(!p) return;
  new MutationObserver(ajustarFocoPanelExp).observe(p, {childList: true, subtree: true});
  ajustarFocoPanelExp();
}

/* Solo las marcas de estado de las pestanas (el panel no depende del flujo, asi no pierde el foco ni lo tipeado). */
function pintarTabsExp(){
  const cont = document.getElementById("tabsExpWrap");
  if(!cont) return;
  const foco = document.activeElement && cont.contains(document.activeElement) ? document.activeElement.id : null;
  cont.innerHTML = tabsExpedienteHtml();
  if(foco){ const b = document.getElementById(foco); if(b) b.focus(); }      // repintar las marcas no le saca el foco al teclado
}
function selTabExp(k, enfocar){
  if(typeof evSincronizar === "function") evSincronizar();   // lo tipeado en LB/PA/PB sin guardar no se pierde al cambiar de pestaña
  if(typeof icSincronizar === "function") icSincronizar();   // ni en IC
  if(typeof vfSincronizar === "function") vfSincronizar();   // ni en VF
  EXP.tab = k;
  pintarTabsExp();
  const panel = document.getElementById("panelExp");
  if(!panel) return;          // sesión cerrada o expediente descartado mientras tanto
  panel.innerHTML = panelTabExpHtml(k);
  panel.setAttribute("aria-labelledby", "tabExp-" + k);
  if(k === "ci" && EXP.ci === null) cargarCi();      // la pestaña de CI pide su estado la primera vez
  if(esTabEval(k)) evMostrar(k);                      // LB, PA y PB: se leen de la API (evaluaciones.js)
  if(k === "ic") icMostrar();                         // IC: informe de cierre, firmantes y recibí (informe-cierre.js)
  if(k === "vf") vfMostrar();                         // VF: valoración funcional (hce-doc-org-vf.js)
  if(k === "sev") sevMostrar();                       // SEV: severidad DSM-5-TR (severidad.js)
  if(k === "log") logMostrar();                       // LOG: registro de cambios, de solo lectura (auditoria.js)
  if(enfocar){ const b = document.getElementById("tabExp-" + k); if(b) b.focus(); }
}

function filaDato(rotulo, valor){
  const v = (valor === null || valor === undefined || valor === "") ? "—" : escHtml(valor);
  return `<div class="data-row"><dt>${rotulo}</dt><dd>${v}</dd></div>`;
}
function filaTecnico(rotulo, nombre, rol){
  return `<div class="data-row"><dt>${rotulo}</dt><dd>${nombre
    ? `${escHtml(nombre)}${rol ? ` · <span style="color:var(--ink-2)">${escHtml(rol)}</span>` : ""}`
    : "— <span style=\"color:var(--ink-2)\">(sin asignar)</span>"}</dd></div>`;
}

function hce00Html(p){
  const a = p.anamnesis;
  const anam = a
    ? `${filaDato("Motivo de ingreso", a.motivo)}${filaDato("Perinatales", a.perinatal)}${filaDato("Desarrollo", a.desarrollo)}${filaDato("Ant. familiares", a.familiares)}${filaDato("Observaciones", a.observaciones)}`
    : `<div class="hint">Sin anamnesis cargada en el expediente.</div>`;
  return `<div class="exp-grid">
    <div>
      <div class="info-card">
        <h3><span class="ic" aria-hidden="true">▤</span> HCE-00 · Identificación y datos clínicos</h3>
        <dl class="ib">
          ${filaDato("Diagnóstico", p.dx)}
          ${filaDato("CIE-11", p.cie11)}
          ${filaDato("Fecha dx.", p.dxFecha ? fmtFecha(p.dxFecha) : null)}
          ${filaDato("Derivación", p.deriv)}
          ${filaDato("Grupo", p.grupo ? `${p.grupo}${p.grupoAnio ? " · " + p.grupoAnio : ""}` : null)}
          ${filaTecnico("Téc. resp. 1", p.tecnico1, p.tecnico1_rol)}
          ${filaTecnico("Téc. resp. 2", p.tecnico2, p.tecnico2_rol)}
          ${filaDato("Medicación", p.med)}
          <div class="data-row"><dt>Alertas</dt><dd>${p.alerta ? `<b><span aria-hidden="true">⚠ </span>${escHtml(p.alerta)}</b>` : "—"}</dd></div>
        </dl>
      </div>
      <div class="info-card">
        <h3><span class="ic" aria-hidden="true">❏</span> HCE-00 · Anamnesis — Historia del desarrollo</h3>
        <dl class="ib">${anam}</dl>
      </div>
    </div>
    <div>
      ${ideaVigenteCardHtml()}
      <div class="info-card">
        <h3><span class="ic" aria-hidden="true">☎</span> Contacto familiar</h3>
        <dl class="ib">
          ${filaDato("Referente", p.referente)}
          ${filaDato("Teléfono", p.tel)}
          ${filaDato("Localidad", p.loc)}
        </dl>
      </div>
    </div>
  </div>`;
}

/* ---------- Avisos (warnings[] de la API): se muestran, nunca bloquean ---------- */
/* Un 409 (otro usuario cambió o firmó el registro) NO es un aviso: se marca {conflicto: true} y se rotula aparte
   («Cambió en el servidor»), nunca bajo «Avisos (no bloquean)», que es para los warnings[] de una escritura que salió bien. */
function avisosCuerpoHtml(lista){
  const conf = (lista || []).filter(w => w && w.conflicto), av = (lista || []).filter(w => !(w && w.conflicto));
  return (conf.length ? `<p class="aviso-conflicto"><b>Cambió en el servidor:</b> ${conf.map(w => escHtml(w.mensaje)).join(" ")}</p>` : "")
    + (av.length ? `<b>Avisos (no bloquean):</b><ul>${av.map(w => `<li>${escHtml((w && w.mensaje) || w)}</li>`).join("")}</ul>` : "");
}
function avisosHtml(avisos){
  if(!avisos || !avisos.length) return "";
  return `<div class="review-note avisos-api" role="status">
    <span aria-hidden="true">ℹ</span>
    <div>${avisosCuerpoHtml(avisos)}
    <button type="button" class="btn btn-ghost btn-mini" onclick="EXP.avisos=[];pintarAvisosExp()">Entendido</button></div>
  </div>`;
}
function pintarAvisosExp(){
  const el = document.getElementById("expAvisos");
  if(el) el.innerHTML = avisosHtml(EXP.avisos);
}

/* Vuelve a pedir el flujo (el estado que muestran las pestañas del ciclo anual). `conservar`: no vaciar lo que ya se ve mientras
   llega (p. ej. tras registrar el CI). Si falla, debajo de las pestañas aparece el error con «Reintentar». */
async function recargarFlujoExp(conservar){
  if(EXP.id === null) return;   // no hay expediente abierto (p. ej. se cerró la sesión)
  const mi = EXP.seq;
  if(!conservar) EXP.flujo = null;
  EXP.flujoError = false;
  pintarTabsExp();
  try{
    const f = await apiFetch(`/hce/${EXP.id}/flujo`);
    if(mi !== EXP.seq) return;
    EXP.flujo = adaptarFlujo(f.data);
  }catch(_e){
    if(mi !== EXP.seq) return;
    EXP.flujoError = true;
  }
  pintarTabsExp();
}

/* ---------- Pestaña CI: GET (404 = pendiente) · POST registra · PATCH edita. Nunca «firmado». ---------- */
function _ci(){ return EXP.ci || {estado:"cargando"}; }
function repintarCi(enfocarId){
  if(EXP.tab !== "ci") return;
  const p = document.getElementById("panelExp");
  if(!p) return;
  p.innerHTML = panelTabExpHtml("ci");
  if(enfocarId){ const e = document.getElementById(enfocarId); if(e) e.focus(); }
}
async function cargarCi(){
  const mi = EXP.seq, id = EXP.id;
  if(id === null) return;
  EXP.ci = {estado:"cargando"};
  repintarCi();
  try{
    const r = await apiFetch(`/hce/${id}/consentimiento`);
    if(mi !== EXP.seq) return;
    EXP.ci = {estado:"registrado", datos: adaptarCi(r.data), editando:false};
  }catch(err){
    if(mi !== EXP.seq) return;
    // 404 = todavia no esta registrado: es el estado «pendiente», no una falla.
    EXP.ci = (err instanceof ApiError && err.status === 404) ? {estado:"pendiente"}
      : {estado:"error", mensaje: err instanceof ApiError ? err.message : "No se pudo cargar el consentimiento."};
  }
  repintarCi();
}
function ciEditar(){ if(EXP.ci && EXP.ci.estado === "registrado"){ EXP.ci.editando = true; repintarCi("ci_firmante"); } }
function ciCancelar(){ if(EXP.ci && EXP.ci.estado === "registrado"){ EXP.ci.editando = false; repintarCi("btnCiEditar"); } }

function ciFormHtml(d, registrar){
  const c = (v) => v ? " checked" : "";
  return `<div id="ciErrores" class="form-errores" role="alert" tabindex="-1" hidden></div>
    <div class="form-grid">
      <div class="field"><label for="ci_firmante">Referente familiar que firma <span class="req" aria-hidden="true">*</span><span class="sr-only">(obligatorio)</span></label>
        <input id="ci_firmante" value="${escHtml(d.firmante)}" autocomplete="off" aria-required="true" aria-describedby="err_ci_firmante"><div class="err" id="err_ci_firmante"></div></div>
      <div class="field"><label for="ci_fecha">Fecha del consentimiento <span class="req" aria-hidden="true">*</span><span class="sr-only">(obligatoria)</span></label>
        <input id="ci_fecha" type="date" value="${escHtml(d.fecha)}" aria-required="true" aria-describedby="err_ci_fecha"><div class="err" id="err_ci_fecha"></div></div>
    </div>
    <fieldset class="ci-aut"><legend>Autorizaciones de la familia</legend>
      <label class="check-row"><input type="checkbox" id="ci_aut_eval"${c(d.evaluacion)}> Autoriza la evaluación</label>
      <label class="check-row"><input type="checkbox" id="ci_aut_reg"${c(d.registro)}> Autoriza el registro en la HCE</label>
      <label class="check-row"><input type="checkbox" id="ci_aut_com"${c(d.comunicacion)}> Autoriza la comunicación a organismos (INAU / BPS)</label>
    </fieldset>
    <div class="acciones-form">
      <button type="button" class="btn btn-primary" id="btnCiGuardar" onclick="ciGuardar()"${_ci().guardando ? " disabled" : ""}>${_ci().guardando ? "Guardando…" : (registrar ? "Registrar consentimiento" : "Guardar cambios")}</button>
      ${registrar ? "" : `<button type="button" class="btn btn-ghost" onclick="ciCancelar()">Cancelar</button>`}
    </div>`;
}

function ciPanelHtml(){
  const ci = _ci();
  const cab = (estado) => `<h3 id="ciTitulo" tabindex="-1"><span class="ic" aria-hidden="true">✍</span> CI · Consentimiento informado ${estado || ""}</h3>`;
  if(ci.estado === "cargando") return `<div class="info-card">${cab()}<div class="ib">${estadoCargandoHtml("Cargando consentimiento…")}</div></div>`;
  if(ci.estado === "error"){
    return `<div class="info-card">${cab()}<div class="ib">${estadoErrorHtml(ci.mensaje, "cargarCi()")}</div></div>`;
  }
  if(ci.estado === "pendiente"){
    return `<div class="info-card">${cab(pillCi("pendiente"))}<div class="ib">
      <p class="hint" style="margin-bottom:var(--s3)">El consentimiento todavía no está registrado. Es un estado visible del expediente: <b>no bloquea</b> ninguna evaluación. Se registra una sola vez y después se puede editar.</p>
      ${ciFormHtml({firmante:"", fecha:"", evaluacion:false, registro:false, comunicacion:false}, true)}
    </div></div>`;
  }
  const d = ci.datos;
  const si = (b) => b ? "Sí" : "No";
  if(ci.editando){
    return `<div class="info-card">${cab(pillCi("registrado"))}<div class="ib">${ciFormHtml(d, false)}</div></div>`;
  }
  return `<div class="info-card">${cab(pillCi("registrado"))}
    <dl class="ib">
      ${filaDato("Referente que firma", d.firmante)}
      ${filaDato("Fecha", d.fecha ? fmtFecha(d.fecha) : null)}
      ${filaDato("Autoriza la evaluación", si(d.evaluacion))}
      ${filaDato("Autoriza el registro en la HCE", si(d.registro))}
      ${filaDato("Autoriza la comunicación a organismos", si(d.comunicacion))}
    </dl>
    <div class="ib" style="padding-top:0"><button type="button" class="btn btn-ghost" id="btnCiEditar" onclick="ciEditar()">✎ Editar</button></div>
  </div>`;
}

/* Boton de guardar del formulario de CI: ocupado/libre sin re-pintar el formulario. */
function _ciBoton(ci, ocupado){
  ci.guardando = ocupado;
  const b = document.getElementById("btnCiGuardar");
  if(!b) return;
  b.disabled = ocupado;
  b.textContent = ocupado ? "Guardando…" : (ci.estado === "pendiente" ? "Registrar consentimiento" : "Guardar cambios");
}

async function ciGuardar(){
  const ci = EXP.ci;
  if(!ci || ci.guardando) return;
  const mi = EXP.seq, id = EXP.id;
  const panel = document.getElementById("panelExp");
  formLimpiar(panel, "ciErrores");
  const v = (x) => (document.getElementById(x).value || "").trim();
  const chk = (x) => document.getElementById(x).checked;
  const nuevo = {firmante: v("ci_firmante"), fecha: v("ci_fecha"), evaluacion: chk("ci_aut_eval"), registro: chk("ci_aut_reg"), comunicacion: chk("ci_aut_com")};
  const mostrarErr = (items, titulo) => { formResumen("ciErrores", items, titulo).focus(); };
  const faltan = [];
  if(!nuevo.firmante) faltan.push({id:"ci_firmante", rot:"Referente", mensaje:"Ingresá quién firma el consentimiento."});
  if(!nuevo.fecha) faltan.push({id:"ci_fecha", rot:"Fecha", mensaje:"Ingresá la fecha del consentimiento."});
  if(faltan.length){ mostrarErr(faltan, "Faltan datos obligatorios:"); return; }

  const aut = {evaluacion: nuevo.evaluacion, registro: nuevo.registro, comunicacion: nuevo.comunicacion};
  const registrar = ci.estado === "pendiente";
  let body = {firmante: nuevo.firmante, fecha: nuevo.fecha, autorizaciones: aut};
  if(!registrar){                                   // PATCH: solo lo que cambio (autorizaciones va completo)
    const d = ci.datos;
    body = {};
    if(nuevo.firmante !== d.firmante) body.firmante = nuevo.firmante;
    if(nuevo.fecha !== d.fecha) body.fecha = nuevo.fecha;
    if(nuevo.evaluacion !== d.evaluacion || nuevo.registro !== d.registro || nuevo.comunicacion !== d.comunicacion) body.autorizaciones = aut;
    if(!Object.keys(body).length){ mostrarErr([{mensaje:"No hay cambios para guardar."}], "Nada que guardar:"); return; }
  }
  _ciBoton(ci, true);
  try{
    const r = await apiFetch(`/hce/${id}/consentimiento`, {method: registrar ? "POST" : "PATCH", body});
    if(mi !== EXP.seq) return;
    EXP.ci = {estado:"registrado", datos: adaptarCi(r.data), editando:false};
    EXP.avisos = r.warnings || []; pintarAvisosExp();
    repintarCi("ciTitulo");
    toast(registrar ? "Consentimiento registrado" : "Consentimiento actualizado");
    recargarFlujoExp(true);                          // el stepper y las pestañas leen el estado de la API, no el del formulario
    refrescarListaTrasEscritura();                   // y la fila del listado también
  }catch(err){
    if(mi !== EXP.seq) return;
    _ciBoton(ci, false);
    const detalle = err instanceof ApiError && err.detail.length ? err.detail : [{campo:null, mensaje: err.message || "No se pudo guardar."}];
    const mapa = {firmante:"ci_firmante", fecha:"ci_fecha", autorizaciones:"ci_aut_eval"};
    const items = detalle.map(d => {
      const campo = d.campo ? String(d.campo).split(".")[0] : null;
      return {id: mapa[campo] || null, rot: campo === "firmante" ? "Referente" : campo === "fecha" ? "Fecha" : campo === "autorizaciones" ? "Autorizaciones" : "", mensaje: d.mensaje};
    });
    if(err instanceof ApiError && err.status === 409 && registrar){
      // Otro usuario ya lo registró: se vuelve a leer y se muestra lo que hay realmente. El repintado destruye el formulario (y con él
      // el resumen de errores), así que NO se arma «No se pudo guardar» y el foco va a un destino estable: el título de la pestaña.
      EXP.avisos = [{mensaje: err.message, conflicto: true}]; pintarAvisosExp();
      recargarFlujoExp(true); refrescarListaTrasEscritura();
      await cargarCi();
      if(mi !== EXP.seq) return;
      const t = document.getElementById("ciTitulo"); if(t) t.focus();
      return;
    }
    // El formulario no se vuelve a pintar: lo tipeado se conserva y los errores quedan junto a cada campo.
    formResumen("ciErrores", items, "No se pudo guardar:").focus();
  }
}

function panelTabExpHtml(k){
  if(k === "hce00") return hce00Html(EXP.hce);
  if(k === "ci") return ciPanelHtml();
  if(esTabEval(k)) return evPanelHtml(k);
  if(k === "ic") return icPanelHtml();
  if(k === "vf") return vfPanelHtml();
  if(k === "sev") return sevPanelHtml();
  if(k === "log") return logPanelHtml();
  const t = TABS_EXP.find(x => x.k === k);
  return `<div class="info-card">
    <h3>${t.r} · ${escHtml(t.d)} ${badgeSoloDemo()}</h3>
    <div class="ib">${panelModoDemo("Este módulo todavía no está conectado al servidor.")}</div>
  </div>`;
}

function expedienteCargando(){
  document.getElementById("expedienteContent").innerHTML =
    `<div class="card"><div class="cardbody">${estadoCargandoHtml("Cargando expediente…")}</div></div>`;
  go("expediente");
}
function expedienteError(err, id){
  const msg = err instanceof ApiError ? err.message : "No se pudo cargar el expediente.";
  document.getElementById("expedienteContent").innerHTML =
    `<div class="card"><div class="cardbody">${estadoErrorHtml(msg, err && err.status === 404 ? "" : `abrirExpediente(${id})`,
      `<button type="button" class="btn btn-ghost btn-mini" onclick="go('inicio')">‹ Volver al listado</button>`)}</div></div>`;
}

/* Banda del paciente (F1, H1/H4/H6): clara, pegada bajo la barra superior, un solo renglón de datos. La alerta clínica (`alerta`
   de GET /hce/{id}) va en tinta, con ⚠ y texto: nunca ok/warn/bad (no es un estado de la app). Un solo punto de edición: «Editar
   datos». Se vuelve a pintar tras editar HCE-00, con lo que devolvió la API. */
function cabeceraExpHtml(hce){
  const nombre = `${hce.nombre} ${hce.apellido}`.trim();
  const datos = [hce.edad === null ? "" : `${hce.edad} años`, hce.sexo ? escHtml(hce.sexo) : "",
    `HC <span class="cod">${escHtml(hce.hc)}</span>`, `C.I. <span class="cod">${escHtml(hce.ciTxt)}</span>`,
    hce.grupo ? `Grupo ${escHtml(hce.grupo)}` : ""].filter(Boolean).join(" · ");
  const inactivo = hce.activo ? "" : ` <span class="chip-inactivo">Inactivo${hce.bajaFecha ? ` · Baja: ${fmtFecha(hce.bajaFecha)}` : ""}</span>`;
  return `<div class="banda-id">
      <h1 id="expTitulo" tabindex="-1">${escHtml(nombre)}</h1>
      <p class="banda-meta">${datos}${inactivo}</p>
    </div>
    ${hce.alerta ? `<p class="banda-alerta" id="bandaAlerta"><span aria-hidden="true">⚠</span> <b>Alerta clínica:</b> ${escHtml(hce.alerta)}</p>` : ""}
    <button type="button" class="btn btn-ghost btn-mini banda-editar" onclick="openEditar()">✎ Editar datos</button>`;
}
function pintarCabeceraExp(){
  const c = document.getElementById("expHead");
  if(!c || !EXP.hce) return;
  c.innerHTML = cabeceraExpHtml(EXP.hce);
}
/* El alto real de la banda es un token (--banda-h): de él sale el scroll-padding-top que evita que lo enfocado quede debajo
   (WCAG 2.2 · 2.4.11). Una alerta larga la hace crecer y el token la sigue. */
let _OBS_BANDA = null;
function vigilarBanda(){
  if(_OBS_BANDA) _OBS_BANDA.disconnect();
  const b = document.getElementById("expHead");
  if(!b || typeof ResizeObserver !== "function") return;
  _OBS_BANDA = new ResizeObserver(() => {
    const h = Math.ceil(b.getBoundingClientRect().height);
    if(h > 0) document.documentElement.style.setProperty("--banda-h", h + "px");
  });
  _OBS_BANDA.observe(b);
}

/* `opts.avisos`: warnings[] de la escritura que lo abre (alta). */
async function abrirExpediente(id, opts){
  const mi = ++EXP.seq;
  Object.assign(EXP, {id, hce:null, raw:null, flujo:null, flujoError:false, tab:"hce00", ci:null, avisos:(opts && opts.avisos) || [], mods:null, idea:{estado:"cargando"}});
  evReiniciar(); icReiniciar(); vfReiniciar(); sevReiniciar(); logReiniciar();
  expedienteCargando();
  let hce, raw;
  try{
    // El detalle y el flujo se piden juntos; si el flujo falla, el HCE-00 se muestra igual.
    const [rh, rf] = await Promise.allSettled([apiFetch(`/hce/${id}`), apiFetch(`/hce/${id}/flujo`)]);
    if(mi !== EXP.seq) return;
    if(rh.status === "rejected") throw rh.reason;
    raw = rh.value.data;
    hce = adaptarHce00(raw);
    if(rf.status === "fulfilled") EXP.flujo = adaptarFlujo(rf.value.data); else EXP.flujoError = true;
  }catch(err){
    if(mi !== EXP.seq) return;
    expedienteError(err, id);
    return;
  }
  EXP.hce = hce; EXP.raw = raw;
  document.getElementById("expedienteContent").innerHTML = `
    <div id="expHead" class="banda-nna">${cabeceraExpHtml(hce)}</div>
    <div id="expAvisos"></div>
    <div id="tabsExpWrap" class="tabs-exp">${tabsExpedienteHtml()}</div>
    <div id="panelExp" role="tabpanel" aria-label="Contenido del módulo">${panelTabExpHtml("hce00")}</div>`;
  pintarAvisosExp(); vigilarPanelExp(); vigilarBanda();
  cargarModsExp(); cargarIdeaVigente();         // addendas por modulo (marcas) y «qué IDEA rige» (§5.97), de la API
  const h1 = document.getElementById("expTitulo");
  if(h1) h1.focus();
}

/* ===================== EXPEDIENTE DE EJEMPLO (modo demostración) =====================
   Lee el array NNA de datos.js (ids 101–108, NO los de la API). Lo usan solo las vistas de
   demostración (Grupos, Inclusión, Ateneos, Pendientes…) y lleva el panel de modo demo. */
function abrirExpedienteDemo(id){
  const p = NNA.find(n=>n.id===id);
  if(!p) return;
  const ideaEvs = ideaEvals(p);
  const likEvs = p.historial.filter(h=>h.tipo==="lik").sort((x,y)=> x.fecha < y.fecha ? -1 : 1);

  // timeline ordenada por fecha
  const tipoLabel = {alta:"Alta", idea:"IDEA", lik:"Intermedia", note:"Nota"};
  const eventos = [...p.historial].sort((a,b)=> a.fecha < b.fecha ? -1 : 1);
  const timelineHtml = eventos.map(ev=>`
    <div class="tevent ${ev.tipo}">
      <div class="tdot"></div>
      <div class="tdate">${fmtFecha(ev.fecha)} · ${tipoLabel[ev.tipo]||""}</div>
      <div class="ttitle">${ev.titulo}</div>
      <div class="tdesc">${ev.desc}</div>
      ${ev.score!=null ? `<span class="tscore">Puntaje IDEA: ${ev.score} / ${ev.total}</span>` : ""}
    </div>`).join("");

  // tendencia simple
  let tendencia = "Sin evaluaciones para comparar todavía.";
  const scores = eventos.filter(e=>e.score!=null);
  if(scores.length>=2){
    const delta = scores[0].score - scores[scores.length-1].score;
    tendencia = delta>0
      ? `Reducción de ${delta} puntos desde la primera evaluación — evolución favorable.`
      : delta<0 ? `Aumento de ${Math.abs(delta)} puntos — requiere revisión del plan.`
      : "Puntaje estable entre evaluaciones.";
  }

  const tallerTags = p.talleres.length
    ? p.talleres.map(t=>`<span class="taller-tag">${t}</span>`).join("")
    : `<span style="font-size:.8rem;color:var(--ink-2)">Sin talleres asignados aún.</span>`;

  const a = p.anamnesis;
  const anamnesisHtml = a
    ? `<div class="data-row"><dt>Motivo de ingreso</dt><dd style="text-align:left">${a.motivo||"—"}</dd></div>
       <div class="data-row"><dt>Perinatales</dt><dd style="text-align:left">${a.perinatal||"—"}</dd></div>
       <div class="data-row"><dt>Desarrollo</dt><dd style="text-align:left">${a.desarrollo||"—"}</dd></div>
       <div class="data-row"><dt>Ant. familiares</dt><dd style="text-align:left">${a.familiares||"—"}</dd></div>
       <div class="data-row"><dt>Observaciones</dt><dd style="text-align:left">${p.antec||"—"}</dd></div>`
    : `<div class="data-row"><dt>Observaciones</dt><dd style="text-align:left">${p.antec||"—"}</dd></div>
       <div style="font-size:var(--fs-2xs);color:var(--ink-2);margin-top:8px">Sin anamnesis estructurada cargada en el expediente (demo).</div>`;

  document.getElementById("expedienteContent").innerHTML = `
    ${panelModoDemo("Expediente de ejemplo con datos ficticios: no es un expediente de la API y nada de lo que se haga acá se guarda.")}
    <div class="exp-head">
      <div>
        <h1>${p.nombre} ${p.apellido}</h1>
        <div class="meta">${p.edad} años · ${p.sexo} · Expediente #${p.id} · C.I. ${p.ci}${!p.activo&&p.bajaFecha?` · Baja: ${fmtFecha(p.bajaFecha)}`:""}</div>
        <div class="badges">
          <span class="bdg">Grupo ${p.grupo}</span>
          <span class="bdg">${p.apoyo.split("—")[0].trim()}</span>
          <span class="bdg">${p.tecnico.split("—")[0].trim()}</span>
          <span class="bdg">${p.activo?'Activo':'Inactivo'}</span>
        </div>
      </div>
      <div class="spacer"></div>
      <button class="btn btn-ghost btn-mini" onclick="toggleActivo(${p.id})">${p.activo?'⨯ Dar de baja':'↻ Reactivar'}</button>
    </div>

    <div class="eval-bar">
      <span class="hint">LB, PA, PB, IC y VF se editan y firman en los expedientes conectados (pestañas del expediente), no en el de ejemplo.</span>
    </div>

    <div class="section-nav no-print">
      <span class="section-nav-lbl">Ir a sección:</span>
      <button class="btn btn-ghost btn-mini" onclick="scrollASeccion('anchor-doc')">🗂 HCE-DOC · Documentos y fotos</button>
      <button class="btn btn-ghost btn-mini" onclick="scrollASeccion('anchor-org')">🏛 HCE-ORG · Áreas INAU y BPS</button>
      <button class="btn btn-ghost btn-mini" onclick="scrollASeccion('anchor-ateneos')">◈ Ateneos clínicos referidos</button>
    </div>

    ${flujoPanelHtml(p)}

    <div class="exp-grid">
      <div>
        <div class="info-card">
          <h3><span class="ic">▤</span> HCE-00 · Identificación y datos clínicos
            <span class="mbadge mb-borrador" style="margin-left:8px" title="Módulo siempre editable (§3.2): nunca se bloquea, aun con otros módulos firmados">Siempre abierto</span>
          </h3>
          <div class="ib">
            <div class="data-row"><dt>Diagnóstico</dt><dd>${p.dx}</dd></div>
            <div class="data-row"><dt>CIE-11</dt><dd>${p.cie11||"—"}</dd></div>
            <div class="data-row"><dt>Fecha dx.</dt><dd>${fmtFecha(p.dxFecha)}</dd></div>
            <div class="data-row"><dt>Derivación</dt><dd>${p.deriv}</dd></div>
            <div class="data-row"><dt>Nivel de soporte</dt><dd>${p.apoyo}</dd></div>
            <div class="data-row"><dt>Téc. resp. 1</dt><dd>${p.tecnico1||"—"} · <span style="color:var(--ink-2)">${p.tecnico1_rol||"Psicólogo/a"}</span></dd></div>
            <div class="data-row"><dt>Téc. resp. 2</dt><dd>${p.tecnico2||"—"} · <span style="color:var(--ink-2)">${p.tecnico2_rol||"Maestro/a"}</span></dd></div>
            <div class="data-row"><dt>Medicación</dt><dd>${p.med}</dd></div>
            <div class="data-row"><dt>Alertas</dt><dd style="${p.alerta!=="—"?"color:var(--bad);font-weight:600":""}">${p.alerta}</dd></div>
          </div>
        </div>
        <div class="info-card">
          <h3><span class="ic">❏</span> HCE-00 · Anamnesis — Historia del desarrollo</h3>
          <div class="ib">${anamnesisHtml}</div>
        </div>
        <div class="info-card">
          <h3><span class="ic">◫</span> Plan IPPU — Talleres asignados</h3>
          <div class="ib"><div class="talleres-list">${tallerTags}</div></div>
        </div>
        <div class="info-card">
          <h3><span class="ic">☎</span> Contacto familiar</h3>
          <div class="ib">
            <div class="data-row"><dt>Referente</dt><dd>${p.referente}</dd></div>
            <div class="data-row"><dt>Teléfono</dt><dd>${p.tel}</dd></div>
            <div class="data-row"><dt>Localidad</dt><dd>${p.loc}</dd></div>
          </div>
        </div>
      </div>

      <div>
        <div class="info-card">
          <h3><span class="ic">◐</span> Línea base — IDEA (HCE-LB)</h3>
          <div class="ib">
            ${(()=>{ const lb=p.flujo.lb; const t=lbTotales(lb.dim); const est=estadoModulo(p,"lb");
              if(est==="firmado") return `<div class="data-row"><dt>Total IDEA</dt><dd>${t.total} / 96 · <b>${bandaIdea(t.total)}</b></dd></div>
                <div class="data-row"><dt>Fecha de consenso</dt><dd>${fmtFecha(lb.fecha)}</dd></div>
                <div class="data-row"><dt>Estado</dt><dd>${estadoBadgeM(est)}</dd></div>`;
              if(est==="borrador") return `<div class="data-row"><dt>Línea base</dt><dd>${estadoBadgeM(est)} · ${t.count}/12 dim.${t.hayNS?" (incluye NS)":""}</dd></div>`;
              return `<div class="data-row"><dt>Línea base</dt><dd>${estadoBadgeM(est)}</dd></div>`;
            })()}
            ${pendienteIdea(p) ? `<div style="margin-top:8px;font-size:.76rem;color:var(--warn);font-weight:700">● Sin línea base IDEA firmada</div>` : ""}
          </div>
        </div>
        <div class="info-card">
          <h3><span class="ic">◷</span> Historial clínico</h3>
          <div class="ib">
            ${eventos.length ? `<div class="tline">${timelineHtml}</div>` :
              `<div class="empty-state"><div class="big" aria-hidden="true">◷</div>Sin eventos registrados todavía.</div>`}
          </div>
        </div>
      </div>
    </div>

    ${docPanelHtml(p)}

    ${orgPanelHtml(p)}

    <!-- F1-nav4 (2026-08-19): ateneos clínicos referidos a este NNA. El panel lo arma
         ateneos.js (que carga después que este archivo, igual que hce-doc-org-vf.js:
         la función se resuelve al renderizar, no al cargar). -->
    ${ateneosPanelHtml(p)}
  `;
  go("expediente");
}
