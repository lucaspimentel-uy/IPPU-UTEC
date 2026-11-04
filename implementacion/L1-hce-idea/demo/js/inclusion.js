/* HCE-INC conectado (C4): la pestaña «Inclusión» del expediente (grupo «Seguimiento», §5.140) y la vista «Inclusión» del menú.
   Demo L1 HCE+IDEA - IPPU x UTEC-LIDIA.
     GET   /inclusion/opciones                  los 7 estados (nombre, descripción, si se puede elegir) y los vocabularios de la ficha y la bitácora
     GET   /hce/{id}/inclusion                  la ficha; 404 = «Sin registrar» (estado vacío, no un error)
     POST  …                                    registra la ficha (una por expediente; 409 la segunda; 422 si todo viene vacío)
     PATCH …                                    edita sólo lo que cambió (vacío = null borra; el estado no se vacía)
     GET   /hce/{id}/inclusion/bitacora         las gestiones, la más nueva primero (total en X-Total-Count); sin ficha, lista vacía
     POST  …/bitacora                           agrega una (exige la ficha; sólo se crean y se listan: es lo que pasó)
     GET   /inclusion?estado=                   la lista del área: fichas de los expedientes activos que la persona ve
   Reglas, todas del servidor (esto es solo presentacion, §5.154):
   - el estado va EN TINTA, con su nombre y su descripción: nunca ok/warn/bad ni una escala de color (la API no da semáforo, y los 7
     estados son un supuesto nuestro que IPPU no confirmó); «Sin registrar» no se ofrece para elegir;
   - `fecha_estado`, `estado_descripcion`, `sensible`, «última gestión» y la cantidad de gestiones salen de la respuesta: el navegador no
     cuenta días ni fechas; tras guardar se pinta desde la respuesta o se vuelve a pedir la lista (el orden lo da la API);
   - «Sensible» es una clasificación del servidor (tema «Clínica — sensible»): se marca con texto; restringe compartir, no guardar;
   - el autor de una gestión es el usuario del token: el formulario no lo pide;
   - sin tablero del área (contadores por estado, alerta de 60 días): fuera de esta versión (puntos-a-validar §1.15).
   Los formularios van en el diálogo compartido (#modalFlujo): Esc/×/Cancelar con algo tipeado piden confirmación (Fase 3-e).
   Los scripts se cargan en orden en index.html: el orden ES la semantica. */
const INC = {hceId: null, estado: "cargando", ficha: null, gestiones: {filas: [], total: 0, pagina: 0}, opciones: null, carga: 0,
  avisos: [], guardando: false, error: "", noEncontrado: false};
const INC_POR_PAGINA = 10;
const _incEl = (id) => document.getElementById(id);
/* Controles del formulario de la ficha y su rótulo (también para ubicar el error que devuelve la API por `campo`). */
const INC_CAMPOS = {
  centro: ["incf_centro", "Centro educativo"], tipo_centro: ["incf_tipo", "Tipo de centro"], grado: ["incf_grado", "Grado, clase o taller"],
  modalidad: ["incf_modalidad", "Modalidad"], dias_horas: ["incf_dias", "Días y horas"], at: ["incf_at", "Asistente personal / AT"],
  at_nombre: ["incf_at_nombre", "Nombre del/la acompañante"], ref_nombre: ["incf_ref_nombre", "Referente en el centro"],
  ref_rol: ["incf_ref_rol", "Rol del referente"], ref_tel: ["incf_ref_tel", "Teléfono o contacto"], estado: ["incf_estado", "Estado"],
  obs: ["incf_obs", "Observaciones"]
};
const INC_GES_CAMPOS = {
  fecha: ["incg_fecha", "Fecha"], interlocutor: ["incg_interlocutor", "Con quién"], rol: ["incg_rol", "Rol"], medio: ["incg_medio", "Medio"],
  tema: ["incg_tema", "Tema"], contenido: ["incg_contenido", "Qué se trató"], acuerdos: ["incg_acuerdos", "Acuerdos o próximos pasos"]
};
const INC_SENSIBLE_HINT = "«Sensible»: la entrada está restringida para compartir; guardarla no requiere autorización.";

function incReiniciar(){
  INC.carga++;
  Object.assign(INC, {hceId: null, estado: "cargando", ficha: null, gestiones: {filas: [], total: 0, pagina: 0}, avisos: [], guardando: false, error: "", noEncontrado: false});
  // Las opciones no dependen del expediente: se conservan mientras dure la sesión (ver incOlvidarSesion).
}
function incOlvidarSesion(){ incReiniciar(); INC.opciones = null; incVistaOlvidarSesion(); }

/* Las opciones (estados y vocabularios) se piden una vez por sesión; las usan la pestaña y la vista. */
async function incTraerOpciones(){
  if(INC.opciones) return INC.opciones;
  const r = await apiFetch("/inclusion/opciones");
  INC.opciones = r.data;
  return INC.opciones;
}
function incEstadoDe(nombre){ return ((INC.opciones || {}).estados || []).find(e => e.nombre === nombre) || null; }

/* ---------- Carga de la pestaña ---------- */
function incMostrar(){
  if(INC.hceId === EXP.id && INC.estado === "listo"){ incRepintar(); incCargar(true); return; }
  incCargar(false);
}
async function incCargar(conservar){
  const mi = EXP.seq, id = EXP.id;
  if(id === null) return;
  if(INC.hceId !== id){ incReiniciar(); INC.hceId = id; }
  else if(!conservar) INC.estado = "cargando";
  const n = ++INC.carga;
  const vigente = () => mi === EXP.seq && INC.hceId === id && n === INC.carga;
  if(INC.estado === "cargando") incRepintar();
  const offset = INC.gestiones.pagina * INC_POR_PAGINA;
  const pedidos = await Promise.allSettled([apiFetch(`/hce/${id}/inclusion`),
    apiFetch(`/hce/${id}/inclusion/bitacora`, {query: {limit: INC_POR_PAGINA, offset}}), incTraerOpciones()]);
  if(!vigente()) return;
  const [rf, rb, ro] = pedidos;
  const fichaFalta = rf.status === "rejected" && rf.reason instanceof ApiError && rf.reason.status === 404;
  const fallo = [rf.status === "rejected" && !fichaFalta ? rf : null, rb.status === "rejected" ? rb : null, ro.status === "rejected" ? ro : null].find(Boolean);
  if(fallo){
    INC.estado = "error";
    INC.noEncontrado = fallo.reason instanceof ApiError && fallo.reason.status === 404;
    INC.error = fallo.reason instanceof ApiError ? fallo.reason.message : "No se pudo cargar la inclusión.";
    incRepintar(); return;
  }
  const ges = {filas: rb.value.data, total: rb.value.total === null ? rb.value.data.length : rb.value.total, pagina: INC.gestiones.pagina};
  // La página quedó vacía (otro usuario o un total que bajó): se va a la última que tiene filas.
  if(!ges.filas.length && ges.pagina > 0 && ges.total > 0){ INC.gestiones.pagina = Math.ceil(ges.total / INC_POR_PAGINA) - 1; incCargar(true); return; }
  const nuevo = {ficha: fichaFalta ? null : rf.value.data, gestiones: ges};
  const sinCambios = conservar && INC.estado === "listo" && JSON.stringify({ficha: INC.ficha, gestiones: INC.gestiones}) === JSON.stringify(nuevo);
  INC.ficha = nuevo.ficha; INC.gestiones = ges; INC.estado = "listo";
  if(!sinCambios) incRepintar();
}
function incReintentar(){ incCargar(false); }
function incPagina(delta){
  const ultima = Math.max(0, Math.ceil(INC.gestiones.total / INC_POR_PAGINA) - 1);
  INC.gestiones.pagina = Math.min(ultima, Math.max(0, INC.gestiones.pagina + delta));
  incCargar(true);
}

/* ---------- Render de la pestaña ---------- */
function incRepintar(){
  if(EXP.tab !== "inc") return;
  const p = _incEl("panelExp"); if(!p) return;
  const foco = document.activeElement && p.contains(document.activeElement) ? document.activeElement.id : null;
  p.innerHTML = incPanelHtml();
  if(!foco) return;
  const b = _incEl(foco);
  if(b && !b.disabled){ b.focus(); return; }
  /* Como el paginado de Auditoría (§5.152 e): si el botón que tenía el foco quedó deshabilitado, el foco pasa al otro y, si los dos
     lo están, al título de la tarjeta de gestiones. */
  const otro = foco === "btnIncSig" ? "btnIncAnt" : foco === "btnIncAnt" ? "btnIncSig" : null;
  const o = otro && _incEl(otro), t = _incEl("incGesTitulo") || _incEl("incTitulo");
  if(o && !o.disabled) o.focus(); else if(t) t.focus();
}
function incAvisosHtml(){
  const a = INC.avisos || [];
  if(!a.length) return "";
  return `${avisosCuerpoHtml(a)}<button type="button" class="btn btn-ghost btn-mini" onclick="incCerrarAvisos()">Entendido</button>`;
}
function incCerrarAvisos(){ INC.avisos = []; const el = _incEl("incAvisos"); if(el){ el.innerHTML = ""; el.hidden = true; } }

function _incV(v){ return v === null || v === undefined || v === "" ? "—" : escHtml(v); }
function _incFila(rot, valorHtml, id){ return `<div class="data-row"><dt>${rot}</dt><dd id="${id}">${valorHtml}</dd></div>`; }
/* El estado en tinta: nombre, su descripción (del servidor) y «desde» la fecha que fijó el servidor. */
function incEstadoTintaHtml(nombre, fecha){
  return `<span class="inc-estado"><b>${escHtml(nombre)}</b>${fecha ? ` <span class="inc-desde">· desde ${escHtml(fmtFecha(fecha))}</span>` : ""}</span>`;
}
function incLecturaHtml(f){
  return `<div class="inc-ficha" id="incLectura">
      <section class="inc-bloque" aria-labelledby="incBloqueCentro"><h4 id="incBloqueCentro">Centro</h4><dl class="ib inc-lectura">
        ${_incFila("Centro educativo", _incV(f.centro), "incCentro")}${_incFila("Tipo de centro", _incV(f.tipo_centro), "incTipo")}
        ${_incFila("Grado, clase o taller", _incV(f.grado), "incGrado")}${_incFila("Modalidad", _incV(f.modalidad), "incModalidad")}
        ${_incFila("Días y horas", _incV(f.dias_horas), "incDias")}</dl></section>
      <section class="inc-bloque" aria-labelledby="incBloqueAt"><h4 id="incBloqueAt">Acompañante (asistente personal / AT)</h4><dl class="ib inc-lectura">
        ${_incFila("Tiene acompañante", _incV(f.at), "incAt")}${_incFila("Nombre", _incV(f.at_nombre), "incAtNombre")}</dl></section>
      <section class="inc-bloque" aria-labelledby="incBloqueRef"><h4 id="incBloqueRef">Referente en el centro</h4><dl class="ib inc-lectura">
        ${_incFila("Nombre", _incV(f.ref_nombre), "incRefNombre")}${_incFila("Rol", _incV(f.ref_rol), "incRefRol")}
        ${_incFila("Teléfono o contacto", _incV(f.ref_tel), "incRefTel")}</dl></section>
      <section class="inc-bloque" aria-labelledby="incBloqueEstado"><h4 id="incBloqueEstado">Estado</h4><dl class="ib inc-lectura">
        ${_incFila("Estado", incEstadoTintaHtml(f.estado, f.fecha_estado), "incEstado")}
        ${_incFila("Qué significa", f.estado_descripcion ? `<span class="inc-desc">${escHtml(f.estado_descripcion)}</span>` : "—", "incEstadoDesc")}</dl></section>
      <section class="inc-bloque" aria-labelledby="incBloqueObs"><h4 id="incBloqueObs">Observaciones</h4>
        <p class="ib inc-texto inc-obs" id="incObs">${f.obs ? escHtml(f.obs) : "—"}</p></section>
    </div>
    <div class="ib" style="padding-top:0"><button type="button" class="btn btn-ghost" id="btnIncEditar" onclick="incAbrirFicha()">✎ Editar<span class="sr-only"> la ficha de inclusión</span></button></div>`;
}
function incFichaHtml(){
  const f = INC.ficha;
  const cuerpo = f ? incLecturaHtml(f) : `<div class="ib">${estadoVacioHtml("◌", `<b>Sin registrar.</b> El área de Inclusión todavía no registró la situación educativa de este NNA.`,
      `<button type="button" class="btn btn-primary" id="btnIncNuevo" onclick="incAbrirFicha()">+ Registrar ficha</button>`)}</div>`;
  return `<div class="info-card" id="incFicha"><h3><span class="ic" aria-hidden="true">✎</span> Ficha</h3>${cuerpo}</div>`;
}
function incGestionHtml(g){
  const quien = `${escHtml(g.interlocutor)}${g.rol ? ` · ${escHtml(g.rol)}` : ""}`;
  const sensible = g.sensible ? ` <span class="inc-sensible" aria-describedby="incSensibleHint">Sensible</span>` : "";
  return `<li class="inc-gestion" data-gestion="${g.id}"${g.sensible ? ` data-sensible="true"` : ""}>
      <div class="inc-ges-cab"><span class="inc-ges-fecha">${escHtml(fmtFecha(g.fecha))}</span> <span class="inc-ges-quien">${quien}</span>${sensible}</div>
      <div class="inc-ges-meta">${g.medio ? `${escHtml(g.medio)} · ` : ""}${escHtml(g.tema)}</div>
      <p class="inc-texto inc-ges-contenido">${escHtml(g.contenido)}</p>
      ${g.acuerdos ? `<p class="inc-texto inc-ges-acuerdos"><span class="inc-rot">Acuerdos:</span> ${escHtml(g.acuerdos)}</p>` : ""}
      <div class="inc-ges-autor hint">Registrada por ${g.autor ? escHtml(g.autor.nombre) : "—"}</div>
    </li>`;
}
function incPaginadoHtml(){
  const d = INC.gestiones;
  if(d.total <= INC_POR_PAGINA) return "";
  const desde = d.pagina * INC_POR_PAGINA + 1, hasta = Math.min(d.total, desde + d.filas.length - 1);
  const ultima = Math.ceil(d.total / INC_POR_PAGINA) - 1;
  return `<nav class="log-paginado" aria-label="Paginado de las gestiones">
    <span class="log-rango" role="status">Mostrando ${desde}–${hasta} de ${d.total}</span>
    <button type="button" class="btn btn-ghost btn-mini" id="btnIncAnt" onclick="incPagina(-1)"${d.pagina <= 0 ? " disabled" : ""}>‹ Más nuevas</button>
    <button type="button" class="btn btn-ghost btn-mini" id="btnIncSig" onclick="incPagina(1)"${d.pagina >= ultima ? " disabled" : ""}>Más viejas ›</button>
  </nav>`;
}
function incGestionesHtml(){
  const d = INC.gestiones;
  const haySensible = d.filas.some(g => g.sensible);
  const lista = d.filas.length
    ? `${haySensible ? `<p class="hint inc-sensible-hint" id="incSensibleHint">${escHtml(INC_SENSIBLE_HINT)}</p>` : ""}
       <ol class="inc-gestiones" id="incGestiones" aria-label="Gestiones, la más reciente primero">${d.filas.map(incGestionHtml).join("")}</ol>${incPaginadoHtml()}`
    : `<p class="hint" id="incGesVacio">Todavía no se registró ninguna gestión.</p>`;
  const accion = INC.ficha
    ? `<button type="button" class="btn btn-ghost" id="btnIncAgregar" onclick="incAbrirGestion()">+ Agregar gestión</button>`
    : `<p class="hint" id="incSinFicha">Para agregar gestiones, primero registrá la ficha.</p>`;
  return `<div class="info-card" id="incGestionesCard"><h3 id="incGesTitulo" tabindex="-1"><span class="ic" aria-hidden="true">☰</span> Gestiones
      <span class="org-total" id="incGesTotal">${d.total}</span><span class="sr-only"> registradas</span></h3>
    <div class="ib">${lista}<div class="org-reg-acciones">${accion}</div></div></div>`;
}
/* Referencia de los 7 estados, en texto y plegada (como la de SEV): nombre y descripción, sin color. */
function incReferenciaHtml(){
  const filas = ((INC.opciones || {}).estados || []).map(e => `<tr><th scope="row">${escHtml(e.nombre)}</th><td>${escHtml(e.descripcion)}${e.asignable ? "" : ` <span class="hint">(no se elige: es la ausencia de registro)</span>`}</td></tr>`).join("");
  return `<details class="sev-ref inc-ref" id="incRef"><summary>Referencia — los 7 estados de inclusión y qué significa cada uno</summary>
    <div class="tabla-scroll"><table class="comp-table sev-tabla"><caption class="sr-only">Estados de inclusión y su descripción</caption>
      <thead><tr><th scope="col">Estado</th><th scope="col">Qué significa</th></tr></thead><tbody>${filas}</tbody></table></div>
    <p class="hint" style="margin-top:8px">Los 7 estados son una propuesta del equipo que IPPU todavía no confirmó.</p>
  </details>`;
}
function incPanelHtml(){
  const cab = `<div class="mod-cab"><h2 id="incTitulo" tabindex="-1">INC · Inclusión educativa y social</h2></div>`;
  if(INC.hceId !== EXP.id || INC.estado === "cargando") return `${cab}<div class="info-card"><div class="ib">${estadoCargandoHtml("Cargando la inclusión…")}</div></div>`;
  if(INC.estado === "error") return `${cab}<div class="info-card"><div class="ib">${estadoErrorHtml(INC.noEncontrado ? "No se encontró el expediente." : INC.error, INC.noEncontrado ? "" : "incReintentar()")}</div></div>`;
  return `${cab}
    <div id="incAvisos" class="review-note avisos-api" role="status"${(INC.avisos || []).length ? "" : " hidden"}>${incAvisosHtml()}</div>
    <p class="hint org-nota" id="incNota">La situación educativa del NNA fuera de IPPU, con su estado vigente, y las gestiones del área (familia, centro, acompañante, otras instituciones).</p>
    ${incFichaHtml()}
    ${incGestionesHtml()}
    ${incReferenciaHtml()}`;
}

/* ---------- Formulario de la ficha (diálogo compartido) ---------- */
function _incInput(campo, valor, extra){
  const [id, rot] = INC_CAMPOS[campo];
  return `<div class="field"><label for="${id}">${rot}</label><input id="${id}" type="text" value="${escHtml(valor || "")}" aria-describedby="err_${id}" autocomplete="off"${extra || ""}><div class="err" id="err_${id}"></div></div>`;
}
/* Si lo guardado no está entre las opciones, se agrega: abrir el formulario no puede borrarlo en silencio. */
function _incSelect(id, rot, lista, actual, vacio, describe){
  const opts = [...(lista || [])];
  if(actual && !opts.includes(actual)) opts.push(actual);
  return `<div class="field"><label for="${id}">${rot}</label>
    <select id="${id}" aria-describedby="${describe ? describe + " " : ""}err_${id}"${id === "incf_estado" ? ` onchange="incActualizarDescEstado()"` : ""}>${vacio !== null ? `<option value="">${vacio}</option>` : ""}${opts.map(o => `<option value="${escHtml(o)}"${o === actual ? " selected" : ""}>${escHtml(o)}</option>`).join("")}</select>
    ${id === "incf_estado" ? `<p class="sev-desc" id="desc_incf_estado" aria-live="polite"></p>` : ""}<div class="err" id="err_${id}"></div></div>`;
}
function incActualizarDescEstado(){
  const s = _incEl("incf_estado"), d = _incEl("desc_incf_estado");
  if(!s || !d) return;
  const e = incEstadoDe(s.value);
  d.textContent = e ? e.descripcion : "";
  d.hidden = !e;
}
function incAbrirFicha(){
  if(INC.estado !== "listo") return;
  const f = INC.ficha || {}, crear = !INC.ficha, o = INC.opciones || {};
  const asignables = (o.estados || []).filter(e => e.asignable).map(e => e.nombre);
  const actualAsignable = f.estado && asignables.includes(f.estado) ? f.estado : "";
  // Al registrar, o si la ficha está en «Sin registrar», el estado puede quedar sin elegir; al editar uno asignable, no se vacía.
  const vacioEstado = actualAsignable ? null : "— sin elegir —";
  const body = `<div id="incErrores" class="form-errores" role="alert" tabindex="-1" hidden></div>
    <p class="hint" style="margin-bottom:12px">Todos los datos son opcionales${crear ? ", pero hace falta al menos uno" : "; dejar un dato vacío lo borra"}. La fecha del estado la pone el sistema cada vez que el estado cambia.</p>
    <fieldset class="inc-fs"><legend>Centro</legend>
      ${_incInput("centro", f.centro)}${_incSelect(INC_CAMPOS.tipo_centro[0], INC_CAMPOS.tipo_centro[1], o.tipos_centro, f.tipo_centro, "— sin registrar —")}
      ${_incInput("grado", f.grado)}${_incInput("modalidad", f.modalidad)}${_incInput("dias_horas", f.dias_horas)}</fieldset>
    <fieldset class="inc-fs"><legend>Acompañante</legend>
      ${_incSelect(INC_CAMPOS.at[0], INC_CAMPOS.at[1], o.at_estados, f.at, "— sin registrar —")}${_incInput("at_nombre", f.at_nombre)}</fieldset>
    <fieldset class="inc-fs"><legend>Referente en el centro</legend>
      ${_incInput("ref_nombre", f.ref_nombre)}${_incInput("ref_rol", f.ref_rol)}${_incInput("ref_tel", f.ref_tel)}</fieldset>
    <fieldset class="inc-fs"><legend>Estado</legend>
      ${_incSelect(INC_CAMPOS.estado[0], INC_CAMPOS.estado[1], asignables, actualAsignable, vacioEstado)}</fieldset>
    <div class="field"><label for="incf_obs">Observaciones</label><textarea id="incf_obs" aria-describedby="err_incf_obs" style="min-height:90px">${escHtml(f.obs || "")}</textarea><div class="err" id="err_incf_obs"></div></div>`;
  const foot = `<span class="left">HCE-INC · Ficha de inclusión</span>
    <div style="display:flex;gap:10px">
      <button type="button" class="btn btn-ghost" id="btnIncCancelar" onclick="cerrarFlujoModalUsuario()">Cancelar</button>
      <button type="button" class="btn btn-primary" id="btnIncGuardar" onclick="incGuardarFicha()">${crear ? "✓ Registrar ficha" : "✓ Guardar cambios"}</button>
    </div>`;
  const nombre = EXP.hce ? `${EXP.hce.nombre} ${EXP.hce.apellido}`.trim() : "";
  openFlujoModal(crear ? "Registrar ficha de inclusión" : "Editar ficha de inclusión", nombre ? `${nombre} · Inclusión (INC)` : "Inclusión (INC)", body, foot);
  incActualizarDescEstado();
}
function _incValor(id){ const e = _incEl(id); return e ? e.value : ""; }
async function incGuardarFicha(){
  if(INC.guardando) return;
  const mi = EXP.seq, id = EXP.id, actual = INC.ficha, crear = !actual;
  formLimpiar(_incEl("modalFlujo"), "incErrores");
  // Vacío = null (borra el campo en un PATCH). Lo que la API considera vacío o inválido lo decide ella.
  const nuevo = {};
  Object.keys(INC_CAMPOS).forEach(c => { const v = _incValor(INC_CAMPOS[c][0]); nuevo[c] = v.trim() ? v : null; });
  let body = {};
  if(crear) Object.keys(nuevo).forEach(c => { if(nuevo[c] !== null) body[c] = nuevo[c]; });
  else{                                          // PATCH: sólo lo que cambió; un estado sin elegir no se manda
    Object.keys(nuevo).forEach(c => {
      if(c === "estado" && nuevo.estado === null) return;
      if(nuevo[c] !== (actual[c] === undefined ? null : actual[c])) body[c] = nuevo[c];
    });
    if(!Object.keys(body).length){ formResumen("incErrores", [{mensaje: "No hay cambios para guardar."}], "Nada que guardar:").focus(); return; }
  }
  const btn = _incEl("btnIncGuardar"), rotulo = crear ? "✓ Registrar ficha" : "✓ Guardar cambios";
  INC.guardando = true; if(btn){ btn.disabled = true; btn.textContent = "Guardando…"; }
  try{
    const r = await apiFetch(`/hce/${id}/inclusion`, {method: crear ? "POST" : "PATCH", body});
    if(mi !== EXP.seq || INC.hceId !== id) return;
    // Se vuelve a pintar desde la respuesta: la fecha del estado y su descripción son las del servidor.
    INC.guardando = false; INC.ficha = r.data; INC.avisos = r.warnings || [];
    closeFlujoModal();
    incRepintar();
    const t = _incEl("incTitulo"); if(t) t.focus();
    toast(crear ? "Ficha de inclusión registrada" : "Ficha de inclusión guardada");
  }catch(err){
    if(mi !== EXP.seq || INC.hceId !== id) return;
    INC.guardando = false; if(btn){ btn.disabled = false; btn.textContent = rotulo; }
    if(err instanceof ApiError && err.status === 409){       // otro usuario ya la registró: se muestra lo que hay en el servidor
      INC.avisos = [{mensaje: err.message + " Se muestra la ficha tal como está en el servidor.", conflicto: true}];
      closeFlujoModal();
      await incCargar(false);
      const t = _incEl("incTitulo"); if(t) t.focus();
      return;
    }
    const detalle = err instanceof ApiError && err.detail.length ? err.detail : [{campo: null, mensaje: err.message || "No se pudo guardar."}];
    const items = detalle.map(d => { const m = d.campo && INC_CAMPOS[String(d.campo).split(".")[0]];
      return {id: m ? m[0] : null, rot: m ? m[1] : "", mensaje: d.mensaje}; });
    // El formulario no se vuelve a pintar: lo tipeado se conserva y los errores quedan junto a cada campo.
    formResumen("incErrores", items, crear ? "No se pudo registrar la ficha:" : "No se pudo guardar:").focus();
  }
}

/* ---------- Formulario de una gestión (diálogo compartido) ---------- */
function incAbrirGestion(){
  if(INC.estado !== "listo" || !INC.ficha) return;
  const o = INC.opciones || {};
  const req = `<span class="req" aria-hidden="true">*</span><span class="sr-only">(obligatorio)</span>`;
  // La fecha se ofrece con la de hoy del navegador (se puede cambiar); lo que se guarda es lo que se ve en el campo (como ORG).
  const hoy = new Date(), hoyIso = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
  const sel = (campo, lista, vacio, obligatorio, describe) => {
    const [id, rot] = INC_GES_CAMPOS[campo];
    return `<div class="field"><label for="${id}">${rot}${obligatorio ? " " + req : ""}</label>
      <select id="${id}"${obligatorio ? ` aria-required="true"` : ""} aria-describedby="${describe ? describe + " " : ""}err_${id}"><option value="">${vacio}</option>${(lista || []).map(x => `<option value="${escHtml(x)}">${escHtml(x)}</option>`).join("")}</select>
      ${describe ? `<div class="hint" id="${describe}">«${escHtml(o.tema_sensible || "")}» marca la entrada como sensible: se restringe al compartirla, no al guardarla.</div>` : ""}<div class="err" id="err_${id}"></div></div>`;
  };
  const body = `<div id="incErrores" class="form-errores" role="alert" tabindex="-1" hidden></div>
    <div class="field"><label for="incg_fecha">Fecha ${req}</label><input id="incg_fecha" type="date" value="${hoyIso}" aria-required="true" aria-describedby="err_incg_fecha"><div class="err" id="err_incg_fecha"></div></div>
    <div class="field"><label for="incg_interlocutor">Con quién (persona o institución) ${req}</label><input id="incg_interlocutor" type="text" aria-required="true" aria-describedby="err_incg_interlocutor" autocomplete="off"><div class="err" id="err_incg_interlocutor"></div></div>
    ${sel("rol", o.roles, "— sin registrar —", false)}
    ${sel("medio", o.medios, "— sin registrar —", false)}
    ${sel("tema", o.temas, "— elegir tema —", true, "hint_incg_tema")}
    <div class="field"><label for="incg_contenido">Qué se trató ${req}</label>
      <textarea id="incg_contenido" aria-required="true" aria-describedby="hint_incg_contenido err_incg_contenido" style="min-height:100px"></textarea>
      <div class="hint" id="hint_incg_contenido">Queda registrada con su autor y no se edita.</div><div class="err" id="err_incg_contenido"></div></div>
    <div class="field"><label for="incg_acuerdos">Acuerdos o próximos pasos</label><textarea id="incg_acuerdos" aria-describedby="err_incg_acuerdos" style="min-height:70px"></textarea><div class="err" id="err_incg_acuerdos"></div></div>
    <p class="hint">La gestión queda a nombre de quien la guarda.</p>`;
  const foot = `<span class="left">HCE-INC · Gestiones</span>
    <div style="display:flex;gap:10px">
      <button type="button" class="btn btn-ghost" id="btnIncCancelar" onclick="cerrarFlujoModalUsuario()">Cancelar</button>
      <button type="button" class="btn btn-primary" id="btnIncGuardar" onclick="incGuardarGestion()">✓ Registrar gestión</button>
    </div>`;
  const nombre = EXP.hce ? `${EXP.hce.nombre} ${EXP.hce.apellido}`.trim() : "";
  openFlujoModal("Registrar gestión", nombre ? `${nombre} · Inclusión (INC)` : "Inclusión (INC)", body, foot);
}
async function incGuardarGestion(){
  if(INC.guardando) return;
  const mi = EXP.seq, id = EXP.id;
  formLimpiar(_incEl("modalFlujo"), "incErrores");
  // Sin validación propia: los obligatorios, los blancos y los valores fuera de lista los decide la API (422 por campo).
  const body = {};
  Object.keys(INC_GES_CAMPOS).forEach(c => {
    const v = _incValor(INC_GES_CAMPOS[c][0]);
    body[c] = (c === "fecha" || c === "rol" || c === "medio" || c === "acuerdos") && !v.trim() ? null : v;
  });
  const btn = _incEl("btnIncGuardar");
  INC.guardando = true; if(btn){ btn.disabled = true; btn.textContent = "Guardando…"; }
  try{
    const r = await apiFetch(`/hce/${id}/inclusion/bitacora`, {method: "POST", body});
    if(mi !== EXP.seq || INC.hceId !== id) return;
    INC.guardando = false; INC.avisos = r.warnings || [];
    INC.gestiones.pagina = 0;                     // la nueva va primero (la API ordena): se vuelve a la primera página
    closeFlujoModal();
    await incCargar(true);
    if(mi !== EXP.seq || INC.hceId !== id) return;
    const t = _incEl("incGesTitulo"); if(t) t.focus();
    toast("Gestión registrada");
  }catch(err){
    if(mi !== EXP.seq || INC.hceId !== id) return;
    INC.guardando = false; if(btn){ btn.disabled = false; btn.textContent = "✓ Registrar gestión"; }
    const detalle = err instanceof ApiError && err.detail.length ? err.detail : [{campo: null, mensaje: err.message || "No se pudo guardar."}];
    const items = detalle.map(d => { const m = d.campo && INC_GES_CAMPOS[String(d.campo).split(".")[0]];
      return {id: m ? m[0] : null, rot: m ? m[1] : "", mensaje: d.mensaje}; });
    formResumen("incErrores", items, "No se pudo registrar la gestión:").focus();
  }
}

/* ===================== VISTA «Inclusión» (menú) =====================
   GET /inclusion: las fichas de los expedientes ACTIVOS que la persona ve (el admin, todas; un técnico, las de sus grupos), por
   apellido y nombre, paginadas por el servidor. El filtro por estado es un parámetro de la API. La fila abre el expediente real en su
   pestaña «Inclusión». Sin contadores por estado ni alerta de días (el tablero del área está fuera de esta versión). */
const INCV = {seq: 0, estado: "vacio", error: "", filas: [], total: 0, offset: 0, limit: 25, filtro: ""};

function incVistaAlAbrir(){ INCV.offset = 0; incVistaCargar(); }
function incVistaDescripcion(){
  const u = Sesion.usuario();
  const de = u && u.rol === "admin" ? "de todos los grupos" : "de tus grupos";
  return `La situación de inclusión de cada NNA activo ${de} que tiene ficha registrada. Cada fila abre el expediente en su pestaña «Inclusión».`;
}
async function incVistaCargar(){
  const mi = ++INCV.seq;
  INCV.estado = "cargando";
  incVistaPintar();
  try{
    const [r] = await Promise.all([apiFetch("/inclusion", {query: {estado: INCV.filtro || null, limit: INCV.limit, offset: INCV.offset}}), incTraerOpciones()]);
    if(mi !== INCV.seq) return;     // llegó una respuesta vieja (o se salió de la sesión): se descarta
    INCV.filas = r.data;
    INCV.total = r.total === null ? r.data.length : r.total;
    INCV.estado = "listo";
  }catch(err){
    if(mi !== INCV.seq) return;
    INCV.estado = "error";
    INCV.error = err instanceof ApiError ? err.message : "No se pudo cargar la lista de inclusión.";
  }
  incVistaPintar();
}
/* «Salir» / 401: la vista queda vacía y una respuesta en vuelo ya no se pinta. */
function incVistaOlvidarSesion(){
  INCV.seq++;
  Object.assign(INCV, {estado: "vacio", error: "", filas: [], total: 0, offset: 0, filtro: ""});
  const c = _incEl("inclusionContent"); if(c) c.innerHTML = "";
  const d = _incEl("incVistaDesc"); if(d) d.textContent = "";
}
function incVistaFiltrar(){
  const s = _incEl("incFiltroEstado");
  INCV.filtro = s ? s.value : "";
  INCV.offset = 0;
  incVistaCargar().then(() => { const x = _incEl("incFiltroEstado"); if(x) x.focus(); });
}
function incVistaPagina(dir){
  const nuevo = INCV.offset + dir * INCV.limit;
  if(nuevo < 0 || nuevo >= Math.max(INCV.total, 1)) return;
  INCV.offset = nuevo;
  const foco = dir < 0 ? "incPagPrev" : "incPagNext";
  incVistaCargar().then(() => {
    const b = _incEl(foco), o = _incEl(foco === "incPagPrev" ? "incPagNext" : "incPagPrev"), t = _incEl("tituloInclusion");
    if(b && !b.disabled) b.focus(); else if(o && !o.disabled) o.focus(); else if(t) t.focus();
  });
}
function incAbrirDesdeVista(id){ abrirExpediente(id, {tab: "inc"}); }
function incVistaFilaHtml(f){
  const p = f.persona || {}, nombre = escHtml(`${p.nombre || ""} ${p.apellido || ""}`.trim());
  const edad = edadAnios(p.fecha_nac);
  return `<tr data-hce="${f.hce_id}" onclick="incVistaFilaClic(event, ${f.hce_id})">
    <td class="nna">
      <button type="button" class="nna-abrir" onclick="incAbrirDesdeVista(${f.hce_id})" aria-label="Abrir la inclusión de ${nombre}">${nombre}</button>
      <span class="nna-sub">HC <span class="cod">${escHtml(f.hc_historico)}</span>${edad === null ? "" : ` · ${edad} años`}</span>
    </td>
    <td>${f.grupo ? escHtml(f.grupo.nombre) : "—"}</td>
    <td>${_incV(f.centro)}${f.grado ? `<span class="nna-sub">${escHtml(f.grado)}</span>` : ""}</td>
    <td class="inc-col-estado">${incEstadoTintaHtml(f.estado, null)}${f.fecha_estado ? `<span class="nna-sub">desde ${escHtml(fmtFecha(f.fecha_estado))}</span>` : ""}</td>
    <td>${_incV(f.at)}</td>
    <td class="num">${f.ultima_gestion ? escHtml(fmtFecha(f.ultima_gestion)) : `<span class="hint">Sin gestiones</span>`}</td>
    <td class="num">${escHtml(f.gestiones)}</td>
    <td class="col-ir" aria-hidden="true">›</td>
  </tr>`;
}
/* Clic con el mouse en cualquier parte de la fila (menos en un control: el botón del nombre ya abre por su cuenta). */
function incVistaFilaClic(ev, id){
  if(ev.target.closest("button, a, input, select, textarea")) return;
  incAbrirDesdeVista(id);
}
function incVistaPintar(){
  const cont = _incEl("inclusionContent"); if(!cont) return;
  const desc = _incEl("incVistaDesc"); if(desc) desc.textContent = INCV.estado === "vacio" ? "" : incVistaDescripcion();
  if(INCV.estado === "vacio"){ cont.innerHTML = ""; return; }
  const estados = ((INC.opciones || {}).estados || []);
  const filtro = `<div class="nna-toolbar"><div class="filtro-grupo"><label for="incFiltroEstado">Estado</label>
      <select id="incFiltroEstado" onchange="incVistaFiltrar()"><option value="">Todos</option>${estados.map(e => `<option value="${escHtml(e.nombre)}"${e.nombre === INCV.filtro ? " selected" : ""}>${escHtml(e.nombre)}</option>`).join("")}</select></div></div>`;
  let cuerpo, pie = "";
  if(INCV.estado === "cargando") cuerpo = `<tr><td colspan="8">${estadoCargandoHtml("Cargando las fichas de inclusión…")}</td></tr>`;
  else if(INCV.estado === "error") cuerpo = `<tr><td colspan="8">${estadoErrorHtml(INCV.error, "incVistaCargar()")}</td></tr>`;
  else{
    cuerpo = INCV.filas.length ? INCV.filas.map(incVistaFilaHtml).join("")
      : `<tr><td colspan="8">${estadoVacioHtml("◌", INCV.filtro ? "Ningún NNA activo tiene ese estado." : "Todavía no hay fichas de inclusión registradas.")}</td></tr>`;
    const paginas = Math.max(1, Math.ceil(INCV.total / INCV.limit)), pag = Math.floor(INCV.offset / INCV.limit) + 1;
    pie = `Mostrando ${INCV.filas.length} de ${INCV.total} · página ${pag} de ${paginas}`;
  }
  const listo = INCV.estado === "listo";
  cont.innerHTML = `<div class="card">
      <div class="cardhead"><h2>Fichas de inclusión</h2></div>
      ${filtro}
      <div class="tabla-scroll">
        <table class="lista inc-lista" id="tablaInclusion">
          <caption class="sr-only">Fichas de inclusión de los NNA activos, por apellido</caption>
          <thead><tr><th scope="col">NNA</th><th scope="col">Grupo</th><th scope="col">Centro <span class="th-sub">y grado</span></th><th scope="col">Estado</th>
            <th scope="col">AT</th><th scope="col">Última gestión</th><th scope="col">Gestiones</th><th scope="col" class="col-ir"><span class="sr-only">Abrir</span></th></tr></thead>
          <tbody id="tbodyInclusion">${cuerpo}</tbody>
        </table>
      </div>
      <div class="lista-pie">
        <span id="incResumen" role="status" aria-live="polite">${pie}</span>
        <span class="spacer"></span>
        <button type="button" class="btn btn-ghost btn-mini" id="incPagPrev" onclick="incVistaPagina(-1)"${listo && INCV.offset > 0 ? "" : " disabled"}>‹ Anterior</button>
        <button type="button" class="btn btn-ghost btn-mini" id="incPagNext" onclick="incVistaPagina(1)"${listo && INCV.offset + INCV.limit < INCV.total ? "" : " disabled"}>Siguiente ›</button>
      </div>
    </div>`;
}
