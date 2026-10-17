/* HCE-ORG conectado (C3): pestaña «Organismos» del expediente (grupo «Seguimiento», §5.140).
   Demo L1 HCE+IDEA - IPPU x UTEC-LIDIA.
     GET   /organismos/opciones                      prestaciones y estados de BPS: las opciones del formulario (el valor guardado es texto libre)
     GET   /hce/{id}/organismos                      {inau, bps}; cada uno null = todavía no se registró (estado vacío, no un error)
     POST  …/inau  ·  …/bps                          registra el vínculo (uno por expediente; 409 el segundo; 422 si todo viene vacío)
     PATCH …/inau  ·  …/bps                          edita sólo lo que cambió (null borra el campo)
     GET   /hce/{id}/organismos/registros?organismo= envíos a INAU / gestiones ante BPS, el más nuevo primero (total en X-Total-Count)
     POST  …/registros                               agrega uno (sólo se crean y se listan: son constancias)
   Reglas, todas del servidor (esto es solo presentacion):
   - la alerta AYEX (`bps.alerta`) sale SOLO de la respuesta: el navegador no cuenta días ni decide si una prestación es AYEX; no se
     guarda, no bloquea y se muestra con ⚠ y texto (un vencimiento no es una clasificación clínica, por eso admite el estilo de aviso);
   - el autor de cada registro es el usuario del token: el formulario no lo pide;
   - el orden de los registros lo da la API: tras agregar uno se vuelve a pedir la lista, no se inserta a mano;
   - el informe a los organismos es el IC, un único documento (§5.3); los respaldos van a Documentos.
   Los formularios van en el diálogo compartido (#modalFlujo): Esc/×/Cancelar con algo tipeado piden confirmación (Fase 3-e).
   Los scripts se cargan en orden en index.html: el orden ES la semantica. */
const ORG = {hceId: null, estado: "cargando", vinculos: {inau: null, bps: null}, registros: {inau: {filas: [], total: 0}, bps: {filas: [], total: 0}},
  opciones: null, carga: 0, avisos: [], guardando: false, error: "", noEncontrado: false};
const ORG_LIMITE = 200;                       // el máximo de la API: si hay más, se dice cuántos se muestran
const _orgEl = (id) => document.getElementById(id);
const ORG_NOMBRE = {inau: "INAU", bps: "BPS"};
const ORG_REG = {                             // lo que es un «registro» de cada organismo
  inau: {titulo: "Envíos a INAU", uno: "envío", boton: "+ Agregar envío", dialogo: "Registrar envío a INAU", vacio: "Todavía no se registró ningún envío a INAU.", hecho: "Envío a INAU registrado", dato: "Qué se envió"},
  bps: {titulo: "Gestiones ante BPS", uno: "gestión", boton: "+ Agregar gestión", dialogo: "Registrar gestión ante BPS", vacio: "Todavía no se registró ninguna gestión ante BPS.", hecho: "Gestión ante BPS registrada", dato: "Qué se gestionó"}
};
/* Controles del formulario de cada vínculo y su rótulo (también para ubicar el error que devuelve la API por `campo`). */
const ORG_CAMPOS = {
  inau: {sipi: ["orgi_sipi", "N.º SIPI"], convenio: ["orgi_convenio", "Convenio o proyecto"], referente: ["orgi_referente", "Referente territorial de INAU"],
    ingreso: ["orgi_ingreso", "Ingreso al convenio"], obs: ["orgi_obs", "Observaciones"]},
  bps: {prestacion: ["orgb_prestacion", "Prestación"], tramite: ["orgb_tramite", "N.º de trámite o de expediente"], estado: ["orgb_estado", "Estado"],
    vencimiento: ["orgb_vencimiento", "Vencimiento o renovación"], obs: ["orgb_obs", "Observaciones"]}
};
const ORG_REG_CAMPOS = {fecha: ["orgr_fecha", "Fecha"], detalle: ["orgr_detalle", "Detalle"]};
const ORG_ALERTA_TXT = {vencida: "Vencida", "30_dias": "Vence en 30 días o menos", "60_dias": "Vence en 60 días o menos"};

function orgReiniciar(){
  ORG.carga++;
  Object.assign(ORG, {hceId: null, estado: "cargando", vinculos: {inau: null, bps: null}, registros: {inau: {filas: [], total: 0}, bps: {filas: [], total: 0}},
    avisos: [], guardando: false, error: "", noEncontrado: false});
  // Las opciones de BPS no dependen del expediente: se conservan mientras dure la sesión (ver orgOlvidarSesion).
}
function orgOlvidarSesion(){ orgReiniciar(); ORG.opciones = null; }

/* ---------- Carga ---------- */
function orgMostrar(){
  if(ORG.hceId === EXP.id && ORG.estado === "listo"){ orgRepintar(); orgCargar(true); return; }
  orgCargar(false);
}
async function orgCargar(conservar){
  const mi = EXP.seq, id = EXP.id;
  if(id === null) return;
  if(ORG.hceId !== id){ orgReiniciar(); ORG.hceId = id; }
  else if(!conservar) ORG.estado = "cargando";
  const n = ++ORG.carga;
  const vigente = () => mi === EXP.seq && ORG.hceId === id && n === ORG.carga;
  if(ORG.estado === "cargando") orgRepintar();
  const reg = (organismo) => apiFetch(`/hce/${id}/organismos/registros`, {query: {organismo, limit: ORG_LIMITE}});
  const pedidos = await Promise.allSettled([apiFetch(`/hce/${id}/organismos`), reg("inau"), reg("bps"),
    ORG.opciones ? Promise.resolve({data: ORG.opciones}) : apiFetch("/organismos/opciones")]);
  if(!vigente()) return;
  const fallo = pedidos.find(p => p.status === "rejected");
  if(fallo){
    ORG.estado = "error";
    ORG.noEncontrado = fallo.reason instanceof ApiError && fallo.reason.status === 404;
    ORG.error = fallo.reason instanceof ApiError ? fallo.reason.message : "No se pudieron cargar los organismos.";
    orgRepintar(); return;
  }
  const [rv, ri, rb, ro] = pedidos.map(p => p.value);
  const nuevo = {vinculos: {inau: rv.data.inau, bps: rv.data.bps},
    registros: {inau: {filas: ri.data, total: ri.total === null ? ri.data.length : ri.total}, bps: {filas: rb.data, total: rb.total === null ? rb.data.length : rb.total}}};
  const sinCambios = conservar && ORG.estado === "listo" && JSON.stringify({vinculos: ORG.vinculos, registros: ORG.registros}) === JSON.stringify(nuevo);
  ORG.opciones = ro.data; ORG.vinculos = nuevo.vinculos; ORG.registros = nuevo.registros; ORG.estado = "listo";
  if(!sinCambios) orgRepintar();
}
function orgReintentar(){ orgCargar(false); }

/* ---------- Render ---------- */
function orgRepintar(){
  if(EXP.tab !== "org") return;
  const p = _orgEl("panelExp"); if(!p) return;
  const foco = document.activeElement && p.contains(document.activeElement) ? document.activeElement.id : null;
  p.innerHTML = orgTabHtml();
  if(foco){ const b = _orgEl(foco); if(b) b.focus(); }
}
function orgAvisosHtml(){
  const a = ORG.avisos || [];
  if(!a.length) return "";
  return `${avisosCuerpoHtml(a)}<button type="button" class="btn btn-ghost btn-mini" onclick="orgCerrarAvisos()">Entendido</button>`;
}
function orgCerrarAvisos(){ ORG.avisos = []; const el = _orgEl("orgAvisos"); if(el){ el.innerHTML = ""; el.hidden = true; } }

/* La alerta es la que devuelve la API (`bps.alerta`): se muestra con ⚠ y texto, nunca por color solo. */
function orgAlertaHtml(a){
  if(!a) return "";
  return `<div class="vf-alerta org-alerta" id="orgAlerta"><span aria-hidden="true">⚠</span> <b>Alerta AYEX — ${escHtml(ORG_ALERTA_TXT[a.nivel] || a.nivel)}.</b> ${escHtml(a.mensaje)}</div>`;
}
function orgObsHtml(texto){ return texto ? `<span class="org-obs">${escHtml(texto)}</span>` : "—"; }
function orgLecturaHtml(k, r){
  const fila = (rot, valor, id) => `<div class="data-row"><dt>${rot}</dt><dd id="${id}">${valor === null || valor === undefined || valor === "" ? "—" : valor}</dd></div>`;
  const t = (v) => v ? escHtml(v) : "";
  if(k === "inau") return `<dl class="ib org-lectura" id="orgInauLectura">
      ${fila("N.º SIPI", t(r.sipi), "orgInauSipi")}${fila("Convenio o proyecto", t(r.convenio), "orgInauConvenio")}
      ${fila("Referente territorial", t(r.referente), "orgInauReferente")}${fila("Ingreso al convenio", r.ingreso ? escHtml(fmtFecha(r.ingreso)) : "", "orgInauIngreso")}
      ${fila("Observaciones", orgObsHtml(r.obs), "orgInauObs")}
    </dl>`;
  return `${orgAlertaHtml(r.alerta)}<dl class="ib org-lectura" id="orgBpsLectura">
      ${fila("Prestación", t(r.prestacion), "orgBpsPrestacion")}${fila("N.º de trámite", t(r.tramite), "orgBpsTramite")}
      ${fila("Estado", t(r.estado), "orgBpsEstado")}${fila("Vencimiento o renovación", r.vencimiento ? escHtml(fmtFecha(r.vencimiento)) : "", "orgBpsVencimiento")}
      ${fila("Observaciones", orgObsHtml(r.obs), "orgBpsObs")}
    </dl>`;
}
function orgVinculoHtml(k){
  const r = ORG.vinculos[k], N = ORG_NOMBRE[k], K = k[0].toUpperCase() + k.slice(1);
  const titulo = k === "inau" ? "INAU · Convenio de atención" : "BPS · Prestaciones";
  const cuerpo = r ? `${orgLecturaHtml(k, r)}
      <div class="ib" style="padding-top:0"><button type="button" class="btn btn-ghost" id="btnOrg${K}Editar" onclick="orgAbrirVinculo('${k}')">✎ Editar<span class="sr-only"> el vínculo con ${N}</span></button></div>`
    : `<div class="ib">${estadoVacioHtml("◌", `Todavía no se registró el vínculo con ${N} de este expediente.`,
      `<button type="button" class="btn btn-primary" id="btnOrg${K}Nuevo" onclick="orgAbrirVinculo('${k}')">+ Registrar vínculo con ${N}</button>`)}</div>`;
  return `<div class="info-card" id="orgVinculo${K}"><h3><span class="ic" aria-hidden="true">🏛</span> ${titulo}</h3>${cuerpo}</div>`;
}
function orgRegistrosHtml(k){
  const R = ORG_REG[k], K = k[0].toUpperCase() + k.slice(1), d = ORG.registros[k];
  const filas = d.filas.map(x => `<tr><td class="num org-fecha">${escHtml(fmtFecha(x.fecha))}</td><td class="org-detalle">${escHtml(x.detalle)}</td>
      <td>${x.autor ? escHtml(x.autor.nombre) : "—"}</td></tr>`).join("");
  const tabla = d.filas.length
    ? `<div class="tabla-scroll"><table class="comp-table org-reg" id="orgReg${K}"><caption class="sr-only">${R.titulo}, el más reciente primero</caption>
        <thead><tr><th scope="col">Fecha</th><th scope="col">Detalle</th><th scope="col">Registrado por</th></tr></thead><tbody>${filas}</tbody></table></div>
        ${d.total > d.filas.length ? `<p class="hint" role="status">Se muestran los ${d.filas.length} más recientes de ${d.total}.</p>` : ""}`
    : `<p class="hint org-reg-vacio" id="orgReg${K}Vacio">${R.vacio}</p>`;
  return `<div class="info-card" id="orgRegistros${K}"><h3><span class="ic" aria-hidden="true">☰</span> ${R.titulo}
      <span class="org-total" id="orgTotal${K}">${d.total}</span><span class="sr-only"> registrados</span></h3>
    <div class="ib">${tabla}
      <div class="org-reg-acciones"><button type="button" class="btn btn-ghost" id="btnOrg${K}Agregar" onclick="orgAbrirRegistro('${k}')">${R.boton}</button></div></div></div>`;
}
function orgTabHtml(){
  const cab = `<div class="mod-cab"><h2 id="orgTitulo" tabindex="-1">ORG · Organismos (INAU y BPS)</h2></div>`;
  if(ORG.hceId !== EXP.id || ORG.estado === "cargando") return `${cab}<div class="info-card"><div class="ib">${estadoCargandoHtml("Cargando los organismos…")}</div></div>`;
  if(ORG.estado === "error") return `${cab}<div class="info-card"><div class="ib">${estadoErrorHtml(ORG.noEncontrado ? "No se encontró el expediente." : ORG.error, ORG.noEncontrado ? "" : "orgReintentar()")}</div></div>`;
  return `${cab}
    <div id="orgAvisos" class="review-note avisos-api" role="status"${(ORG.avisos || []).length ? "" : " hidden"}>${orgAvisosHtml()}</div>
    <p class="hint org-nota" id="orgNota">El informe que se comparte con los organismos es siempre el Informe de cierre (IC), un único documento (§5.3). Los documentos de respaldo se adjuntan en Documentos.</p>
    <div class="org-grid">
      <div class="org-col">${orgVinculoHtml("inau")}${orgRegistrosHtml("inau")}</div>
      <div class="org-col">${orgVinculoHtml("bps")}${orgRegistrosHtml("bps")}</div>
    </div>`;
}

/* ---------- Formulario del vínculo (diálogo compartido) ---------- */
/* Si lo guardado no está entre las opciones (el campo es texto libre), se agrega: abrir el formulario no puede borrarlo en silencio. */
function _orgSelect(id, lista, actual, rot, descr){
  const opts = [...(lista || [])];
  if(actual && !opts.includes(actual)) opts.push(actual);
  return `<div class="field"><label for="${id}">${rot}</label>
    <select id="${id}" aria-describedby="err_${id}"><option value="">— sin registrar —</option>${opts.map(o => `<option value="${escHtml(o)}"${o === actual ? " selected" : ""}>${escHtml(o)}</option>`).join("")}</select>
    ${descr ? `<div class="hint">${descr}</div>` : ""}<div class="err" id="err_${id}"></div></div>`;
}
function _orgInput(id, rot, valor, tipo){
  return `<div class="field"><label for="${id}">${rot}</label><input id="${id}" type="${tipo || "text"}" value="${escHtml(valor || "")}" aria-describedby="err_${id}" autocomplete="off"><div class="err" id="err_${id}"></div></div>`;
}
function _orgTexto(id, rot, valor){
  return `<div class="field"><label for="${id}">${rot}</label><textarea id="${id}" aria-describedby="err_${id}" style="min-height:90px">${escHtml(valor || "")}</textarea><div class="err" id="err_${id}"></div></div>`;
}
function orgAbrirVinculo(k){
  if(ORG.estado !== "listo") return;
  const r = ORG.vinculos[k] || {}, crear = !ORG.vinculos[k], N = ORG_NOMBRE[k], C = ORG_CAMPOS[k];
  const campos = k === "inau"
    ? `${_orgInput(C.sipi[0], C.sipi[1], r.sipi)}${_orgInput(C.convenio[0], C.convenio[1], r.convenio)}${_orgInput(C.referente[0], C.referente[1], r.referente)}
       ${_orgInput(C.ingreso[0], C.ingreso[1], r.ingreso, "date")}${_orgTexto(C.obs[0], "Observaciones (situación, medidas, coordinaciones)", r.obs)}`
    : `${_orgSelect(C.prestacion[0], (ORG.opciones || {}).bps_prestaciones, r.prestacion, C.prestacion[1], "Sólo la Ayuda Extraordinaria (AYEX) avisa antes del vencimiento.")}
       ${_orgInput(C.tramite[0], C.tramite[1], r.tramite)}${_orgSelect(C.estado[0], (ORG.opciones || {}).bps_estados, r.estado, C.estado[1])}
       ${_orgInput(C.vencimiento[0], C.vencimiento[1], r.vencimiento, "date")}${_orgTexto(C.obs[0], "Observaciones (documentación, constancias, recordatorios)", r.obs)}`;
  const body = `<div id="orgErrores" class="form-errores" role="alert" tabindex="-1" hidden></div>
    <p class="hint" style="margin-bottom:12px">Todos los datos son opcionales, pero hace falta al menos uno. ${crear ? "" : "Dejar un dato vacío lo borra."}</p>${campos}`;
  const foot = `<span class="left">HCE-ORG · Vínculo con ${N}</span>
    <div style="display:flex;gap:10px">
      <button type="button" class="btn btn-ghost" id="btnOrgCancelar" onclick="cerrarFlujoModalUsuario()">Cancelar</button>
      <button type="button" class="btn btn-primary" id="btnOrgGuardar" onclick="orgGuardarVinculo('${k}')">${crear ? "✓ Registrar vínculo" : "✓ Guardar cambios"}</button>
    </div>`;
  const nombre = EXP.hce ? `${EXP.hce.nombre} ${EXP.hce.apellido}`.trim() : "";
  openFlujoModal(crear ? `Registrar vínculo con ${N}` : `Editar vínculo con ${N}`, nombre ? `${nombre} · Organismos (ORG)` : "Organismos (ORG)", body, foot);
}
function _orgValor(id){ const e = _orgEl(id); return e ? e.value : ""; }
async function orgGuardarVinculo(k){
  if(ORG.guardando) return;
  const mi = EXP.seq, id = EXP.id, actual = ORG.vinculos[k], crear = !actual, N = ORG_NOMBRE[k], C = ORG_CAMPOS[k];
  formLimpiar(_orgEl("modalFlujo"), "orgErrores");
  // Vacío = null (borra el campo en un PATCH). Lo que la API considera «vacío» o inválido lo decide ella.
  const nuevo = {};
  Object.keys(C).forEach(c => { const v = _orgValor(C[c][0]); nuevo[c] = v.trim() ? v : null; });
  let body = {};
  if(crear) Object.keys(nuevo).forEach(c => { if(nuevo[c] !== null) body[c] = nuevo[c]; });
  else{                                          // PATCH: sólo lo que cambió
    Object.keys(nuevo).forEach(c => { if(nuevo[c] !== (actual[c] === undefined ? null : actual[c])) body[c] = nuevo[c]; });
    if(!Object.keys(body).length){ formResumen("orgErrores", [{mensaje: "No hay cambios para guardar."}], "Nada que guardar:").focus(); return; }
  }
  const btn = _orgEl("btnOrgGuardar"), rotulo = crear ? "✓ Registrar vínculo" : "✓ Guardar cambios";
  ORG.guardando = true; if(btn){ btn.disabled = true; btn.textContent = "Guardando…"; }
  try{
    const r = await apiFetch(`/hce/${id}/organismos/${k}`, {method: crear ? "POST" : "PATCH", body});
    if(mi !== EXP.seq || ORG.hceId !== id) return;
    // Se vuelve a pintar desde la respuesta: la alerta AYEX es la del servidor, no se recalcula.
    ORG.guardando = false; ORG.vinculos[k] = r.data; ORG.avisos = r.warnings || [];
    closeFlujoModal();
    orgRepintar();
    const t = _orgEl("orgTitulo"); if(t) t.focus();
    toast(crear ? `Vínculo con ${N} registrado` : `Vínculo con ${N} guardado`);
  }catch(err){
    if(mi !== EXP.seq || ORG.hceId !== id) return;
    ORG.guardando = false; if(btn){ btn.disabled = false; btn.textContent = rotulo; }
    if(err instanceof ApiError && err.status === 409){       // otro usuario ya lo registró: se muestra lo que hay en el servidor
      ORG.avisos = [{mensaje: err.message + " Se muestra el vínculo tal como está en el servidor.", conflicto: true}];
      closeFlujoModal();
      await orgCargar(false);
      const t = _orgEl("orgTitulo"); if(t) t.focus();
      return;
    }
    const detalle = err instanceof ApiError && err.detail.length ? err.detail : [{campo: null, mensaje: err.message || "No se pudo guardar."}];
    const items = detalle.map(d => { const m = d.campo && C[d.campo];
      return {id: m ? m[0] : null, rot: m ? m[1] : "", mensaje: d.mensaje}; });
    // El formulario no se vuelve a pintar: lo tipeado se conserva y los errores quedan junto a cada campo.
    formResumen("orgErrores", items, crear ? `No se pudo registrar el vínculo con ${N}:` : "No se pudo guardar:").focus();
  }
}

/* ---------- Formulario de un registro (envío a INAU · gestión ante BPS) ---------- */
function orgAbrirRegistro(k){
  if(ORG.estado !== "listo") return;
  const R = ORG_REG[k];
  const req =`<span class="req" aria-hidden="true">*</span><span class="sr-only">(obligatorio)</span>`;
  // La fecha se ofrece con la de hoy del navegador (se puede cambiar); lo que se guarda es lo que se ve en el campo.
  const hoy = new Date(), hoyIso = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
  const body = `<div id="orgErrores" class="form-errores" role="alert" tabindex="-1" hidden></div>
    <div class="field"><label for="orgr_fecha">Fecha ${req}</label><input id="orgr_fecha" type="date" value="${hoyIso}" aria-required="true" aria-describedby="err_orgr_fecha"><div class="err" id="err_orgr_fecha"></div></div>
    <div class="field"><label for="orgr_detalle">${R.dato} ${req}</label>
      <textarea id="orgr_detalle" aria-required="true" aria-describedby="hint_orgr_detalle err_orgr_detalle" style="min-height:100px"></textarea>
      <div class="hint" id="hint_orgr_detalle">Es una constancia: queda registrada con su autor y no se edita.</div><div class="err" id="err_orgr_detalle"></div></div>
    <p class="hint">El registro queda a nombre de quien lo guarda.</p>`;
  const foot = `<span class="left">HCE-ORG · ${R.titulo}</span>
    <div style="display:flex;gap:10px">
      <button type="button" class="btn btn-ghost" id="btnOrgCancelar" onclick="cerrarFlujoModalUsuario()">Cancelar</button>
      <button type="button" class="btn btn-primary" id="btnOrgGuardar" onclick="orgGuardarRegistro('${k}')">✓ Registrar ${R.uno}</button>
    </div>`;
  const nombre = EXP.hce ? `${EXP.hce.nombre} ${EXP.hce.apellido}`.trim() : "";
  openFlujoModal(R.dialogo, nombre ? `${nombre} · Organismos (ORG)` : "Organismos (ORG)", body, foot);
}
async function orgGuardarRegistro(k){
  if(ORG.guardando) return;
  const mi = EXP.seq, id = EXP.id, R = ORG_REG[k];
  formLimpiar(_orgEl("modalFlujo"), "orgErrores");
  const fecha = _orgValor("orgr_fecha"), detalle = _orgValor("orgr_detalle");
  const faltan = [];
  if(!fecha) faltan.push({id: "orgr_fecha", rot: "Fecha", mensaje: "Ingresá la fecha."});
  if(!detalle.trim()) faltan.push({id: "orgr_detalle", rot: "Detalle", mensaje: `Escribí ${R.dato.charAt(0).toLowerCase() + R.dato.slice(1)}.`});
  if(faltan.length){ formResumen("orgErrores", faltan, "Faltan datos:").focus(); return; }
  const btn = _orgEl("btnOrgGuardar");
  ORG.guardando = true; if(btn){ btn.disabled = true; btn.textContent = "Guardando…"; }
  try{
    const r = await apiFetch(`/hce/${id}/organismos/registros`, {method: "POST", body: {organismo: k, fecha, detalle}});
    if(mi !== EXP.seq || ORG.hceId !== id) return;
    ORG.guardando = false; ORG.avisos = r.warnings || [];
    closeFlujoModal();
    await orgCargar(true);                       // el orden lo da la API: se vuelve a pedir la lista
    if(mi !== EXP.seq || ORG.hceId !== id) return;
    const t = _orgEl("orgTitulo"); if(t) t.focus();
    toast(R.hecho);
  }catch(err){
    if(mi !== EXP.seq || ORG.hceId !== id) return;
    ORG.guardando = false; if(btn){ btn.disabled = false; btn.textContent = `✓ Registrar ${R.uno}`; }
    const detalleErr = err instanceof ApiError && err.detail.length ? err.detail : [{campo: null, mensaje: err.message || "No se pudo guardar."}];
    const items = detalleErr.map(d => { const m = d.campo && ORG_REG_CAMPOS[d.campo];
      return {id: m ? m[0] : null, rot: m ? m[1] : "", mensaje: d.mensaje}; });
    formResumen("orgErrores", items, `No se pudo registrar ${R.uno === "envío" ? "el envío" : "la gestión"}:`).focus();
  }
}
