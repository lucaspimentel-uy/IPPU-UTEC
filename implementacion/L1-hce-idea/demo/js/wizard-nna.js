/* Alta y edicion de NNA CONECTADAS a la API (Fase 3-b · handoff §5.124).
   Demo L1 HCE+IDEA - IPPU x UTEC-LIDIA.
   Alta  = POST /hce   (persona + expediente, una transaccion).
   Edicion = PATCH /hce/{id} con SOLO los campos que cambiaron.
   Lo que la API no guarda no esta en el formulario: sin nivel de apoyo ni talleres (§5.24), sin
   tecnicos por NNA (los define el grupo). Los errores vuelven por campo y en un resumen
   role="alert" que recibe el foco. Un 409 se muestra tal cual lo dice la API: el navegador NO
   adivina el rol para reformularlo (§5.119 d).
   Los scripts se cargan en orden en index.html: el orden ES la semantica. */

const WIZ = { modo:"alta", step:1, orig:null, inicial:null, grupos:[], guardando:false, opener:null, openerId:"", ancla:null, sesion:0, snap:"", tocado:false };

/* ---------- Tabla unica: campo de la API <-> input <-> paso <-> rotulo ----------
   La usan la validacion, el mapeo de errores del servidor, el resumen y la revision. */
const WIZ_CAMPOS = [
  {api:"persona.nombre",    id:"f_nombre",    paso:1, rot:"Nombre"},
  {api:"persona.apellido",  id:"f_apellido",  paso:1, rot:"Apellido"},
  {api:"persona.fecha_nac", id:"f_nac",       paso:1, rot:"Fecha de nacimiento"},
  {api:"persona.ci",        id:"f_ci",        paso:1, rot:"Cédula"},
  {api:"persona.sexo",      id:"f_sexo",      paso:1, rot:"Sexo"},
  {api:"persona.localidad", id:"f_loc",       paso:1, rot:"Localidad"},
  {api:"persona.referente", id:"f_ref",       paso:1, rot:"Referente"},
  {api:"persona.telefono",  id:"f_tel",       paso:1, rot:"Teléfono"},
  {api:"diagnostico",       id:"f_dx",        paso:2, rot:"Diagnóstico"},
  {api:"cie11",             id:"f_cie11",     paso:2, rot:"CIE-11"},
  {api:"dx_fecha",          id:"f_dxfecha",   paso:2, rot:"Fecha de diagnóstico"},
  {api:"derivacion",        id:"f_deriv",     paso:2, rot:"Derivación"},
  {api:"medicacion",        id:"f_med",       paso:2, rot:"Medicación"},
  {api:"alerta",            id:"f_alerta",    paso:2, rot:"Alertas"},
  {api:"grupo_id",          id:"f_grupo",     paso:2, rot:"Grupo"},
  {api:"hc_historico",      id:"f_hc",        paso:2, rot:"N.º de HC"},
  {api:"activo",            id:"f_estado",    paso:2, rot:"Estado"},
  {api:"fecha_baja",        id:"f_fecha_baja",paso:2, rot:"Fecha de baja"},
  {api:"anamnesis",         id:"f_motivo",    paso:3, rot:"Anamnesis"}
];
/* Claves del objeto `anamnesis` (JSON libre de la API): el PATCH lo REEMPLAZA entero, asi que
   siempre se mandan las cinco. «observaciones» es donde vive lo que la demo llamaba `antec`. */
const WIZ_ANAMNESIS = [
  ["motivo", "f_motivo", "Motivo de ingreso"], ["perinatal", "f_perinatal", "Perinatales"],
  ["desarrollo", "f_desarrollo", "Desarrollo"], ["familiares", "f_famhist", "Antecedentes familiares"],
  ["observaciones", "f_antec", "Observaciones"]
];
const WIZ_PERSONA_TXT = [["nombre","f_nombre"],["apellido","f_apellido"],["fecha_nac","f_nac"],["sexo","f_sexo"],
  ["localidad","f_loc"],["referente","f_ref"],["telefono","f_tel"]];
const WIZ_HCE_TXT = [["diagnostico","f_dx"],["cie11","f_cie11"],["dx_fecha","f_dxfecha"],["derivacion","f_deriv"],
  ["medicacion","f_med"],["alerta","f_alerta"]];

function idDeCampo(campo){
  if(!campo) return null;
  const e = WIZ_CAMPOS.find(c => c.api === campo) || WIZ_CAMPOS.find(c => campo.indexOf(c.api + ".") === 0);
  return e ? e.id : null;
}
const _wv = id => (document.getElementById(id).value || "").trim();
const _wnorm = v => (v === null || v === undefined) ? "" : String(v).trim();
const _wset = (id, v) => { document.getElementById(id).value = _wnorm(v); };
/* Un <select> al que le llega un valor que no esta entre sus opciones (dato viejo de la base) lo agrega
   en vez de pisarlo en silencio con la primera opcion. */
function _wsetSelect(id, v){
  const sel = document.getElementById(id), val = _wnorm(v);
  if(val && ![...sel.options].some(o => o.value === val || o.text === val)){
    const o = document.createElement("option"); o.value = val; o.textContent = val; sel.appendChild(o);
  }
  sel.value = val;
}

/* ---------- Errores de formulario (los usa tambien la pantalla de CI) ----------
   Un mensaje al lado del campo (.err, referenciado por aria-describedby) y un resumen
   role="alert" con enlaces a cada campo; el resumen recibe el foco. */
function formLimpiar(raiz, resumenId){
  (raiz || document).querySelectorAll(".field.invalid").forEach(f => f.classList.remove("invalid"));
  (raiz || document).querySelectorAll(".field .err").forEach(e => { e.textContent = ""; });
  (raiz || document).querySelectorAll("[aria-invalid]").forEach(e => e.removeAttribute("aria-invalid"));
  const r = document.getElementById(resumenId);
  if(r){ r.hidden = true; r.innerHTML = ""; }
}
function formMarcar(id, mensaje){
  const el = document.getElementById(id); if(!el) return;
  const f = el.closest(".field");
  if(f){
    f.classList.add("invalid");
    const err = f.querySelector(".err");
    if(err) err.textContent = err.textContent && err.textContent !== mensaje ? err.textContent + " " + mensaje : mensaje;
  }
  el.setAttribute("aria-invalid", "true");
}
/* items: [{id?, rot?, mensaje}]. Marca cada campo y arma el resumen; devuelve el elemento resumen. */
function formResumen(resumenId, items, titulo){
  items.forEach(it => { if(it.id) formMarcar(it.id, it.mensaje); });
  const r = document.getElementById(resumenId);
  r.innerHTML = `<b>${escHtml(titulo)}</b><ul>` + items.map(it => it.id
    ? `<li><a href="#${escHtml(it.id)}" onclick="return formIr('${escHtml(it.id)}')">${it.rot ? escHtml(it.rot) + ": " : ""}${escHtml(it.mensaje)}</a></li>`
    : `<li>${escHtml(it.mensaje)}</li>`).join("") + `</ul>`;
  r.hidden = false;
  return r;
}
/* Enlace del resumen -> campo. En el asistente, antes cambia al paso que lo contiene. */
function formIr(id){
  const el = document.getElementById(id); if(!el) return false;
  const paso = el.closest(".wizard-step");
  if(paso && +paso.dataset.step !== WIZ.step) showWizStep(+paso.dataset.step);
  el.focus();
  return false;
}

/* Cada .field: el mensaje de error y las pistas quedan referenciados desde el control. */
function prepararCamposModal(){
  document.querySelectorAll("#modalAlta .field").forEach(f => {
    const ctl = f.querySelector("input, select, textarea");
    if(!ctl || !ctl.id) return;
    const ids = [];
    f.querySelectorAll(".hint").forEach((h, i) => { if(!h.id) h.id = "hint_" + ctl.id + (i ? "_" + i : ""); ids.push(h.id); });
    const err = f.querySelector(".err");
    if(err){ err.id = "err_" + ctl.id; ids.push(err.id); }
    ctl.setAttribute("aria-describedby", ids.join(" "));
  });
}
prepararCamposModal();

/* ---------- Abrir / cerrar el dialogo ---------- */
/* Lo tipeado sin guardar (Fase 3-e): la foto de los campos al abrir se compara con la de ahora, y solo cuenta si la persona
   tocó algo (los grupos que llegan después de la API pueden preseleccionar uno y eso no es «tipear»). */
function _wizFoto(){ return fotoCampos(document.querySelector("#modalAlta .modal-body")); }
function wizHayCambios(){ return WIZ.tocado && _wizFoto() !== WIZ.snap; }
function _abrirModalAlta(){
  WIZ.sesion++;
  WIZ.opener = document.activeElement;
  WIZ.openerId = (WIZ.opener && WIZ.opener.id) || "";
  WIZ.ancla = WIZ.opener && WIZ.opener.closest ? WIZ.opener.closest(".card,.info-card,.flujo-card,section") : null;
  WIZ.snap = _wizFoto(); WIZ.tocado = false;
  document.getElementById("modalAlta").classList.add("open");
  appInerte(true);                       // la app de atras queda sin foco ni clics mientras el dialogo esta abierto
  const t = document.getElementById("modalTitle");
  setTimeout(() => { if(document.getElementById("modalAlta").classList.contains("open")) t.focus(); }, 0);
}
/* Cierre pedido por la persona (×, Esc): con datos tipeados pide confirmación; «Salir» y el 401 usan cerrarModalAlta() directo y NO preguntan. */
function closeAlta(){
  if(WIZ.guardando) return;
  const m = document.getElementById("modalAlta");
  if(!m.classList.contains("open")) return;          // Esc llama a closeAlta() aunque no este abierto
  if(descarteAbierto(m)){ m.querySelector("#btnCdSeguir").click(); return; }
  if(wizHayCambios()){
    pedirDescarte(m, () => { cerrarModalAlta(); _wizLimpiarFormulario(); });
    return;
  }
  cerrarModalAlta();
}
/* sinFoco: el cierre es por cerrar la sesion (el foco va al login, no a quien abrio el dialogo). */
function cerrarModalAlta(sinFoco){
  const m = document.getElementById("modalAlta");
  if(!m.classList.contains("open")) return;          // Esc llama a closeAlta() aunque no este abierto
  m.classList.remove("open");
  const cd = m.querySelector(".confirmar-descarte"); if(cd) cd.remove();
  WIZ.sesion++;                                      // descarta respuestas en vuelo (grupos, guardado)
  WIZ.guardando = false; _wizBotones();
  appInerte(false);
  const o = WIZ.opener, oid = WIZ.openerId, ancla = WIZ.ancla; WIZ.opener = null; WIZ.openerId = ""; WIZ.ancla = null;
  if(sinFoco) return;
  if(o && document.contains(o)){ try{ o.focus(); }catch(_e){ /* nada */ } }
  /* Si quien lo abrió ya no existe (el expediente se repintó), el foco no se queda en <body> (§5.127 d). */
  setTimeout(() => focoEstableTrasDialogo(oid, ancla), 0);
}

function _wizLimpiarFormulario(){
  // Todos los input y textarea del dialogo, no una lista de ids: lo que se agregue al formulario se limpia solo.
  document.querySelectorAll("#modalAlta input, #modalAlta textarea").forEach(el => {
    if(el.type === "checkbox" || el.type === "radio") el.checked = false; else el.value = "";
  });
  document.getElementById("f_sexo").selectedIndex = 0;
  document.getElementById("f_estado").value = "activo";
  document.getElementById("f_grupo").value = "";
  document.getElementById("f_tecnicos").innerHTML = "";
  formLimpiar(document.getElementById("modalAlta"), "altaErrores");
}

function openAlta(){
  WIZ.modo = "alta"; WIZ.orig = null; WIZ.inicial = null; WIZ.grupos = [];
  _wizLimpiarFormulario();
  document.getElementById("modalTitle").textContent = "Registrar nuevo NNA en la HCE";
  document.getElementById("modalSub").textContent = "Alta de expediente clínico · Convenio INAU — Fundación IPPU";
  document.getElementById("wizEstadoSec").hidden = true;
  document.getElementById("f_hc_hint").textContent = "Dejalo vacío para que el sistema asigne el siguiente.";
  wizEstadoCambio();
  showWizStep(1);
  _abrirModalAlta();
  wizCargarGrupos();
}

/* Edicion del expediente que esta abierto (EXP.raw = la respuesta cruda de GET /hce/{id}). */
function openEditar(){
  const h = EXP.raw; if(!h) return;
  const p = h.persona || {}, an = h.anamnesis || {};
  WIZ.modo = "edicion"; WIZ.orig = h; WIZ.grupos = [];
  _wizLimpiarFormulario();
  _wset("f_nombre", p.nombre); _wset("f_apellido", p.apellido); _wset("f_nac", p.fecha_nac);
  _wset("f_ci", ciFormateada(p.ci)); _wsetSelect("f_sexo", p.sexo); _wset("f_loc", p.localidad);
  _wset("f_ref", p.referente); _wset("f_tel", p.telefono);
  WIZ.inicial = {ci: _wv("f_ci")};       // lo que se le mostro: el cambio se detecta comparando contra esto, tal cual
  _wset("f_dx", h.diagnostico); _wset("f_cie11", h.cie11); _wset("f_dxfecha", h.dx_fecha);
  _wset("f_deriv", h.derivacion); _wset("f_med", h.medicacion); _wset("f_alerta", h.alerta);
  _wset("f_hc", h.hc_historico);
  WIZ_ANAMNESIS.forEach(([k, id]) => _wset(id, an[k]));
  document.getElementById("f_estado").value = h.activo ? "activo" : "baja";
  _wset("f_fecha_baja", h.fecha_baja);
  const nombre = `${p.nombre || ""} ${p.apellido || ""}`.trim();
  document.getElementById("modalTitle").textContent = `Editar datos — ${nombre}`;
  document.getElementById("modalSub").textContent = `N.º de HC ${h.hc_historico} · Solo se guardan los campos que cambies`;
  document.getElementById("wizEstadoSec").hidden = false;
  document.getElementById("f_hc_hint").textContent = "Cambiar el N.º de HC queda registrado en la auditoría.";
  wizEstadoCambio();
  showWizStep(1);
  _abrirModalAlta();
  wizCargarGrupos();
}

/* ---------- Grupo: lo que la API tiene para el año; los tecnicos salen del grupo ---------- */
function _wizGrupoDeId(id){
  const g = WIZ.grupos.find(x => String(x.id) === String(id));
  if(g) return g;
  const o = WIZ.orig && WIZ.orig.grupo;
  return o && String(o.id) === String(id) ? o : null;
}
/* Grupos que se OFRECEN: el admin ve todos; un tecnico, solo aquellos de los que es tecnico1 o tecnico2.
   Es presentacion (§5.125): la autoridad es la API, y un 403 al guardar se sigue mostrando. */
function _wizGruposOfrecidos(filas){
  const u = Sesion.usuario();
  if(!u || u.rol === "admin") return filas;
  return filas.filter(g => (g.tecnico1 && g.tecnico1.id === u.id) || (g.tecnico2 && g.tecnico2.id === u.id));
}
function _wizRellenarGrupos(){
  const sel = document.getElementById("f_grupo");
  const u = Sesion.usuario(), admin = !u || u.rol === "admin";
  const previo = sel.value || (WIZ.orig && WIZ.orig.grupo_id !== null && WIZ.orig.grupo_id !== undefined ? String(WIZ.orig.grupo_id) : "");
  const filas = _wizGruposOfrecidos(WIZ.grupos);
  const o = WIZ.orig && WIZ.orig.grupo;
  if(o && !filas.some(g => g.id === o.id)) filas.unshift(o);   // el grupo actual, aunque sea de otro año
  const vacio = admin ? "Sin grupo asignado" : (filas.length ? "Elegí un grupo" : "No tenés grupos asignados");
  sel.innerHTML = `<option value="">${vacio}</option>` +
    filas.map(g => `<option value="${g.id}">${escHtml(g.nombre)}${o && g.id === o.id && !WIZ.grupos.some(x => x.id === g.id) ? " (" + escHtml(g.anio) + ")" : ""}</option>`).join("");
  sel.value = previo;
  if(!admin && !sel.value && filas.length === 1) sel.value = String(filas[0].id);   // un solo grupo propio: queda elegido
  wizGrupoCambio();
}
function wizGrupoCambio(){
  const caja = document.getElementById("f_tecnicos");
  const g = _wizGrupoDeId(document.getElementById("f_grupo").value);
  const t = (x) => x ? `${escHtml(x.nombre)}${x.rol ? " · " + escHtml(x.rol) : ""}` : "sin asignar";
  caja.innerHTML = g
    ? `<span><b>Técnicos del grupo ${escHtml(g.nombre)}</b> (los define el grupo, no se eligen por NNA): ${t(g.tecnico1)} · ${t(g.tecnico2)}.</span>`
    : `<span>Los técnicos responsables los define el grupo; elegí un grupo para verlos.</span>`;
}
async function wizCargarGrupos(){
  const mi = WIZ.sesion;
  const sel = document.getElementById("f_grupo"), est = document.getElementById("f_grupo_estado"), btn = document.getElementById("btnReintGrupos");
  // Año: el del flujo del expediente (GET /hce/{id}/flujo) o, en el alta, el de la lista cargada.
  const anio = WIZ.modo === "edicion"
    ? ((EXP.flujo && EXP.flujo.anio) || (WIZ.orig && WIZ.orig.grupo && WIZ.orig.grupo.anio) || null)
    : (LISTA.anioGrupos || null);
  est.textContent = "Cargando grupos…"; btn.hidden = true; sel.disabled = true;
  sel.innerHTML = `<option value="">Cargando grupos…</option>`;       // sin opciones viejas de otra sesión o de otro NNA a la vista
  try{
    const r = await apiFetch("/grupos", {query: anio ? {anio} : {}});
    if(mi !== WIZ.sesion) return;
    WIZ.grupos = r.data;
    est.textContent = r.data.length ? `Grupos del año ${r.data[0].anio}.` : "No hay grupos cargados para ese año.";
  }catch(err){
    if(mi !== WIZ.sesion) return;
    WIZ.grupos = [];
    est.textContent = "No se pudieron cargar los grupos. " + (err instanceof ApiError ? err.message : "");
    btn.hidden = false;
  }
  sel.disabled = false;
  _wizRellenarGrupos();
  if(!WIZ.tocado && mi === WIZ.sesion) WIZ.snap = _wizFoto();      // la preselección del grupo no cuenta como tipeado
}

function wizEstadoCambio(){
  const baja = document.getElementById("f_estado").value === "baja";
  const f = document.getElementById("f_fecha_baja");
  f.disabled = !baja;
  if(!baja) f.value = "";
}

/* ---------- Pasos ---------- */
function showWizStep(n){
  WIZ.step = n;
  document.querySelectorAll("#modalAlta .wizard-step").forEach(s => s.classList.toggle("active", +s.dataset.step === n));
  for(let i = 1; i <= 4; i++){
    const st = document.getElementById("stp" + i);
    st.classList.toggle("active", i === n);
    st.classList.toggle("done", i < n);
    if(i === n) st.setAttribute("aria-current", "step"); else st.removeAttribute("aria-current");
  }
  document.getElementById("stepInfo").textContent = `Paso ${n} de 4`;
  document.getElementById("btnPrev").style.display = n > 1 ? "inline-block" : "none";
  document.getElementById("btnNext").style.display = n < 4 ? "inline-block" : "none";
  document.getElementById("btnCreate").style.display = n === 4 ? "inline-block" : "none";
  document.getElementById("btnCreate").textContent = WIZ.modo === "alta" ? "✓ Crear expediente" : "✓ Guardar cambios";
  if(n === 4) buildReview();
  document.querySelector("#modalAlta .modal-body").scrollTop = 0;
}

/* Obligatorios del paso: los que PersonaCrear exige (nombre, apellido, fecha de nacimiento, cédula). */
function wizValidarPaso(n){
  const items = [];
  if(n === 1){
    [["f_nombre", "Nombre", "Ingresá el nombre."], ["f_apellido", "Apellido", "Ingresá el apellido."],
     ["f_nac", "Fecha de nacimiento", "Ingresá la fecha de nacimiento."], ["f_ci", "Cédula", "Ingresá la cédula."]]
      .forEach(([id, rot, mensaje]) => { if(!_wv(id)) items.push({id, rot, mensaje}); });
  }
  return items;
}
function _wizErrores(items, titulo){
  const idPaso = items.map(i => i.id).filter(Boolean)[0];
  if(idPaso){ const paso = document.getElementById(idPaso).closest(".wizard-step"); if(paso && +paso.dataset.step !== WIZ.step) showWizStep(+paso.dataset.step); }
  const r = formResumen("altaErrores", items, titulo);
  document.querySelector("#modalAlta .modal-body").scrollTop = 0;
  r.focus();
}
function wizNext(){
  formLimpiar(document.getElementById("modalAlta"), "altaErrores");
  const faltan = wizValidarPaso(WIZ.step);
  if(faltan.length){ _wizErrores(faltan, "Faltan datos obligatorios:"); return; }
  if(WIZ.step < 4) showWizStep(WIZ.step + 1);
}
function wizPrev(){ if(WIZ.step > 1) showWizStep(WIZ.step - 1); }

/* ---------- Cuerpos de la peticion ---------- */
function _wizHcNumero(v){ return /^\d+$/.test(v) ? Number(v) : v; }   // lo que no es numero lo rechaza la API, por campo

function wizCuerpoAlta(){
  const persona = {nombre: _wv("f_nombre"), apellido: _wv("f_apellido"), ci: _wv("f_ci"), fecha_nac: _wv("f_nac")};
  WIZ_PERSONA_TXT.forEach(([k, id]) => { if(!(k in persona) && _wv(id)) persona[k] = _wv(id); });
  const body = {persona};
  WIZ_HCE_TXT.forEach(([k, id]) => { if(_wv(id)) body[k] = _wv(id); });
  if(_wv("f_grupo")) body.grupo_id = Number(_wv("f_grupo"));
  if(_wv("f_hc")) body.hc_historico = _wizHcNumero(_wv("f_hc"));
  if(WIZ_ANAMNESIS.some(([, id]) => _wv(id))){
    body.anamnesis = {};
    WIZ_ANAMNESIS.forEach(([k, id]) => { body.anamnesis[k] = _wv(id); });
  }
  return body;
}

/* Edicion: solo lo que cambio. Devuelve {body, lista:[{rot, antes, despues}]}. */
function wizCambios(){
  const o = WIZ.orig, p = o.persona || {}, an = o.anamnesis || {};
  const body = {}, lista = [], pers = {};
  const mostrar = v => _wnorm(v) || "—";
  WIZ_PERSONA_TXT.forEach(([k, id]) => {
    if(_wnorm(p[k]) !== _wv(id)){
      pers[k] = _wv(id);
      lista.push({rot: WIZ_CAMPOS.find(c => c.id === id).rot, antes: mostrar(p[k]), despues: mostrar(_wv(id))});
    }
  });
  // Cedula: se compara el texto tal cual con el que se mostro al abrir; la forma canonica es cosa de la API.
  // Si se reescribe igual pero con otro formato, se manda y la API decide que no cambio nada.
  if(_wv("f_ci") !== (WIZ.inicial ? WIZ.inicial.ci : ciFormateada(p.ci))){
    pers.ci = _wv("f_ci");
    lista.push({rot: "Cédula", antes: ciFormateada(p.ci), despues: _wv("f_ci")});
  }
  if(Object.keys(pers).length) body.persona = pers;
  WIZ_HCE_TXT.forEach(([k, id]) => {
    if(_wnorm(o[k]) !== _wv(id)){
      body[k] = _wv(id);
      lista.push({rot: WIZ_CAMPOS.find(c => c.id === id).rot, antes: mostrar(o[k]), despues: mostrar(_wv(id))});
    }
  });
  if(_wnorm(o.hc_historico) !== _wv("f_hc")){
    body.hc_historico = _wizHcNumero(_wv("f_hc"));
    lista.push({rot: "N.º de HC", antes: mostrar(o.hc_historico), despues: mostrar(_wv("f_hc"))});
  }
  // Mientras los grupos cargan el selector esta deshabilitado y vacio: eso no es «sacar al NNA de su grupo».
  if(!document.getElementById("f_grupo").disabled && _wnorm(o.grupo_id) !== _wv("f_grupo")){
    body.grupo_id = _wv("f_grupo") ? Number(_wv("f_grupo")) : null;
    const g = _wizGrupoDeId(_wv("f_grupo"));
    lista.push({rot: "Grupo", antes: o.grupo ? o.grupo.nombre : "—", despues: g ? g.nombre : "—"});
  }
  if(WIZ_ANAMNESIS.some(([k, id]) => _wnorm(an[k]) !== _wv(id))){
    // el PATCH reemplaza el objeto entero: se mandan las cinco claves (y las ajenas que ya hubiera)
    body.anamnesis = Object.assign({}, an);
    WIZ_ANAMNESIS.forEach(([k, id]) => {
      body.anamnesis[k] = _wv(id);
      if(_wnorm(an[k]) !== _wv(id)) lista.push({rot: "Anamnesis · " + WIZ_ANAMNESIS.find(a => a[0] === k)[2], antes: mostrar(an[k]), despues: mostrar(_wv(id))});
    });
  }
  const bajaAhora = document.getElementById("f_estado").value === "baja";
  if(bajaAhora === !!o.activo){
    body.activo = !bajaAhora;
    lista.push({rot: "Estado", antes: o.activo ? "Activo" : "Dado de baja", despues: bajaAhora ? "Dado de baja" : "Activo"});
    if(bajaAhora){
      body.fecha_baja = _wv("f_fecha_baja");   // vacia -> la API contesta 422 por campo (la baja exige fecha)
      lista.push({rot: "Fecha de baja", antes: "—", despues: mostrar(_wv("f_fecha_baja"))});
    }
  }else if(bajaAhora && _wnorm(o.fecha_baja) !== _wv("f_fecha_baja")){
    body.fecha_baja = _wv("f_fecha_baja");
    lista.push({rot: "Fecha de baja", antes: mostrar(o.fecha_baja), despues: mostrar(_wv("f_fecha_baja"))});
  }
  return {body, lista};
}

/* ---------- Revision (paso 4) ---------- */
function buildReview(){
  const dl = document.getElementById("reviewDl"), nota = document.getElementById("reviewNota"), titulo = document.getElementById("reviewTitulo");
  if(WIZ.modo === "edicion"){
    const c = wizCambios();
    titulo.textContent = "Cambios que se van a guardar";
    dl.innerHTML = c.lista.length
      ? c.lista.map(x => `<dt>${escHtml(x.rot)}</dt><dd>${escHtml(x.antes)} → ${escHtml(x.despues)}</dd>`).join("")
      : `<dt>Sin cambios</dt><dd>No modificaste ningún campo.</dd>`;
    nota.innerHTML = `<span aria-hidden="true">●</span><span>HCE-00 siempre es editable. Se guardan solo los campos de arriba y cada cambio queda en la auditoría.</span>`;
    return;
  }
  const edad = edadAnios(_wv("f_nac"));
  const g = _wizGrupoDeId(_wv("f_grupo"));
  const filas = [
    ["Nombre completo", `${_wv("f_nombre")} ${_wv("f_apellido")}`.trim()],
    ["Edad", edad === null ? "—" : edad + " años"],
    ["Cédula", _wv("f_ci")], ["Sexo", _wv("f_sexo")], ["Localidad", _wv("f_loc")], ["Referente", _wv("f_ref")],
    ["Diagnóstico", _wv("f_dx")], ["CIE-11", _wv("f_cie11")],
    ["Grupo", g ? g.nombre : "Sin grupo asignado"],
    ["Técnicos del grupo", g ? [g.tecnico1, g.tecnico2].filter(Boolean).map(t => t.nombre).join(" · ") || "sin asignar" : "—"],
    ["N.º de HC", _wv("f_hc") || "se asigna el siguiente"],
    ["Motivo de ingreso", _wv("f_motivo")]
  ];
  titulo.textContent = "Revisá los datos antes de crear el expediente";
  dl.innerHTML = filas.map(r => `<dt>${escHtml(r[0])}</dt><dd>${escHtml(r[1] || "—")}</dd>`).join("");
  nota.innerHTML = `<span aria-hidden="true">●</span><span>Al confirmar se crea la persona y su expediente en la HCE (<b>POST /hce</b>). El estado del consentimiento (CI) queda <b>pendiente</b> hasta que se registre; no bloquea nada.</span>`;
}

/* ---------- Guardar ---------- */
function _wizBotones(){
  const c = document.getElementById("btnCreate");
  c.disabled = WIZ.guardando;
  c.textContent = WIZ.guardando ? "Guardando…" : (WIZ.modo === "alta" ? "✓ Crear expediente" : "✓ Guardar cambios");
  document.getElementById("btnPrev").disabled = WIZ.guardando;
}
/* Lo que se hace tras una escritura: el listado y los KPIs ya no estan al dia. */
function refrescarListaTrasEscritura(){
  if(typeof cargarLista === "function") cargarLista();
  if(typeof cargarKpis === "function") cargarKpis();
}

async function guardarNNA(){
  if(WIZ.guardando) return;
  formLimpiar(document.getElementById("modalAlta"), "altaErrores");
  const faltan = wizValidarPaso(1);
  if(faltan.length){ _wizErrores(faltan, "Faltan datos obligatorios:"); return; }

  let metodo, ruta, body;
  if(WIZ.modo === "alta"){
    metodo = "POST"; ruta = "/hce"; body = wizCuerpoAlta();
  }else{
    const c = wizCambios();
    if(!c.lista.length){ _wizErrores([{mensaje: "No hay cambios para guardar."}], "Nada que guardar:"); return; }
    metodo = "PATCH"; ruta = `/hce/${WIZ.orig.id}`; body = c.body;
  }
  const mi = WIZ.sesion, hceId = WIZ.orig ? WIZ.orig.id : null;
  WIZ.guardando = true; _wizBotones();
  try{
    const r = await apiFetch(ruta, {method: metodo, body});
    if(mi !== WIZ.sesion) return;                      // se cerro la sesion o el dialogo mientras tanto
    WIZ.guardando = false;
    cerrarModalAlta(true);
    refrescarListaTrasEscritura();
    if(metodo === "POST"){
      toast("Expediente creado");
      abrirExpediente(r.data.id, {avisos: r.warnings});
    }else if(EXP.id === hceId){
      EXP.raw = r.data; EXP.hce = adaptarHce00(r.data); EXP.avisos = r.warnings || [];
      pintarCabeceraExp(); pintarAvisosExp(); selTabExp(EXP.tab);
      toast("Cambios guardados");
      const t = document.getElementById("expTitulo"); if(t) t.focus();
    }
  }catch(err){
    if(mi !== WIZ.sesion) return;
    WIZ.guardando = false; _wizBotones();
    const detalle = err instanceof ApiError && err.detail.length ? err.detail : [{campo: null, mensaje: err.message || "No se pudo guardar."}];
    const items = detalle.map(d => {
      const id = idDeCampo(d.campo);
      return {id, rot: id ? WIZ_CAMPOS.find(c => c.id === id).rot : "", mensaje: d.mensaje};
    });
    _wizErrores(items, "No se pudo guardar:");
  }
}

/* Cierre de sesion / 401: el dialogo no puede quedar abierto detras del login. */
function cerrarDialogosConectados(){
  cerrarModalAlta(true);
  // Aunque el dialogo ya estuviera cerrado: nada del NNA anterior queda en memoria ni en los campos.
  WIZ.orig = null; WIZ.grupos = []; WIZ.inicial = null; WIZ.step = 1; WIZ.guardando = false;
  _wizLimpiarFormulario();
  document.getElementById("f_grupo").innerHTML = `<option value="">Sin grupo asignado</option>`;
  document.getElementById("f_grupo_estado").textContent = "";
}

document.getElementById("modalAlta").addEventListener("keydown", e => atraparTab(e, document.getElementById("modalAlta"), "modalTitle"));
/* Lo que la persona escribe o elige marca el diálogo como «tocado» (los cambios por programa no disparan estos eventos). */
["input", "change"].forEach(t => document.getElementById("modalAlta").addEventListener(t, () => { WIZ.tocado = true; }));
