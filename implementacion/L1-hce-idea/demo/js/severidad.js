/* HCE-SEV conectado (C2): pestaña «Severidad» del expediente (grupo «Seguimiento», §5.140).
   Demo L1 HCE+IDEA - IPPU x UTEC-LIDIA.
     GET   /severidad-niveles            los 3 grados DSM-5-TR (etiqueta, descriptor por dominio, apoyos): opciones del formulario y
                                         tabla de referencia (IPPU pidió que el DSM-5 se pueda consultar desde la aplicación, §1.10)
     GET   /hce/{id}/severidad           404 = todavía no se registró (estado vacío, no un error)
     POST  …                             registra (una por expediente; 409 la segunda)
     PATCH …                             edita sólo lo que cambió
   Reglas, todas del servidor (esto es solo presentacion):
   - se guarda ENTERO o no se guarda (§5.138 d): si falta un dominio o un campo, se marcan todos los que faltan y no se envía nada;
   - las etiquetas («Grado 2 · Necesita ayuda notable») y el autor salen de la respuesta; tras guardar se pinta desde ella;
   - el nivel es juicio clínico: la pantalla no lee ni sugiere nada desde el IDEA ni la Escala IPPU-TEA;
   - sin escala de color para los grados (sólo texto) y la severidad no sale de esta pestaña (ni la banda ni el listado).
   El formulario va en el diálogo compartido (#modalFlujo): Esc/×/Cancelar con algo tipeado piden confirmación (Fase 3-e).
   Los scripts se cargan en orden en index.html: el orden ES la semantica. */
const SEV = {hceId: null, estado: "cargando", rec: null, niveles: null, carga: 0, avisos: [], guardando: false, error: ""};
const _sevEl = (id) => document.getElementById(id);
/* La regla del módulo, verbatim (docstring de `SeveridadDsm`, del Prototipo v4): no se parafrasea. Se muestra una sola vez. */
const SEV_REGLA = "El nivel de severidad DSM-5-TR se registra por juicio clínico del profesional habilitado y se especifica por separado para cada dominio diagnóstico. No se deriva del puntaje IDEA ni de la Escala IPPU-TEA (instrumentos no homologables). La severidad puede variar según el contexto y fluctuar en el tiempo: este registro describe la necesidad de apoyo actual y no sustituye la determinación de elegibilidad para servicios o prestaciones.";
const SEV_DOMINIOS = [["cs", "Comunicación social"], ["crr", "Comportamientos restringidos y repetitivos"]];
const SEV_CAMPOS = {nivel_cs: ["sev_cs", "Comunicación social"], nivel_crr: ["sev_crr", "Comportamientos restringidos y repetitivos"],
  justificacion: ["sev_just", "Justificación clínica"], fecha: ["sev_fecha", "Fecha del juicio"]};

function sevReiniciar(){
  SEV.carga++;
  Object.assign(SEV, {hceId: null, estado: "cargando", rec: null, avisos: [], guardando: false, error: ""});
  // El catálogo de grados no depende del expediente: se conserva mientras dure la sesión (ver sevOlvidarSesion).
}
function sevOlvidarSesion(){ sevReiniciar(); SEV.niveles = null; }

/* ---------- Carga ---------- */
function sevMostrar(){
  if(SEV.hceId === EXP.id && (SEV.estado === "listo" || SEV.estado === "vacio")){ sevRepintar(); sevCargar(true); return; }
  sevCargar(false);
}
async function sevCargar(conservar){
  const mi = EXP.seq, id = EXP.id;
  if(id === null) return;
  if(SEV.hceId !== id){ sevReiniciar(); SEV.hceId = id; }
  else if(!conservar) SEV.estado = "cargando";
  const n = ++SEV.carga;
  const vigente = () => mi === EXP.seq && SEV.hceId === id && n === SEV.carga;
  if(SEV.estado === "cargando") sevRepintar();
  const [rs, rn] = await Promise.allSettled([apiFetch(`/hce/${id}/severidad`), SEV.niveles ? Promise.resolve({data: SEV.niveles}) : apiFetch("/severidad-niveles")]);
  if(!vigente()) return;
  if(rn.status === "rejected" || (rs.status === "rejected" && !(rs.reason instanceof ApiError && rs.reason.status === 404))){
    const err = rs.status === "rejected" && !(rs.reason instanceof ApiError && rs.reason.status === 404) ? rs.reason : rn.reason;
    SEV.estado = "error"; SEV.error = err instanceof ApiError ? err.message : "No se pudo cargar la severidad.";
    sevRepintar(); return;
  }
  SEV.niveles = Array.isArray(rn.value.data) ? rn.value.data : [];
  const rec = rs.status === "fulfilled" ? rs.value.data : null;          // 404 = todavía no se registró: un estado, no un error
  const sinCambios = conservar && JSON.stringify(SEV.rec) === JSON.stringify(rec) && (SEV.estado === "vacio") === !rec;
  SEV.rec = rec; SEV.estado = rec ? "listo" : "vacio";
  if(!sinCambios) sevRepintar();
}
function sevReintentar(){ sevCargar(false); }

/* ---------- Render ---------- */
function sevRepintar(){
  if(EXP.tab !== "sev") return;
  const p = _sevEl("panelExp"); if(!p) return;
  const foco = document.activeElement && p.contains(document.activeElement) ? document.activeElement.id : null;
  p.innerHTML = sevPanelHtml();
  if(foco){ const b = _sevEl(foco); if(b) b.focus(); }
}
function sevAvisosHtml(){
  const a = SEV.avisos || [];
  if(!a.length) return "";
  return `${avisosCuerpoHtml(a)}<button type="button" class="btn btn-ghost btn-mini" onclick="sevCerrarAvisos()">Entendido</button>`;
}
function sevCerrarAvisos(){ SEV.avisos = []; const el = _sevEl("sevAvisos"); if(el){ el.innerHTML = ""; el.hidden = true; } }

/* Etiqueta del grado tal como la devolvió la API. Si el catálogo no tiene la fila (etiqueta null), el grado vale igual: se dice el número. */
function sevEtiqueta(etiqueta, nivel){ return etiqueta ? escHtml(etiqueta) : `Grado ${escHtml(nivel)} <span class="hint">(sin descriptor en el catálogo)</span>`; }

function sevLecturaHtml(r){
  return `<dl class="ib sev-lectura" id="sevLectura">
      <div class="data-row"><dt>Comunicación social</dt><dd id="sevCs">${sevEtiqueta(r.etiqueta_cs, r.nivel_cs)}</dd></div>
      <div class="data-row"><dt>Comportamientos restringidos y repetitivos</dt><dd id="sevCrr">${sevEtiqueta(r.etiqueta_crr, r.nivel_crr)}</dd></div>
      <div class="data-row"><dt>Justificación clínica</dt><dd class="sev-just" id="sevJust">${escHtml(r.justificacion)}</dd></div>
      <div class="data-row"><dt>Fecha del juicio</dt><dd id="sevFecha">${escHtml(fmtFecha(r.fecha))}</dd></div>
      <div class="data-row"><dt>Registrado por</dt><dd id="sevAutor">${escHtml(r.profesional ? r.profesional.nombre : "—")}</dd></div>
    </dl>
    <div class="ib" style="padding-top:0"><button type="button" class="btn btn-ghost" id="btnSevEditar" onclick="sevAbrirForm()">✎ Editar</button></div>`;
}
/* Tabla de referencia de los tres grados (DSM-5-TR): texto del catálogo, sin color por grado. Plegada por omisión. */
function sevReferenciaHtml(){
  const filas = (SEV.niveles || []).map(n => `<tr><th scope="row">${escHtml(n.etiqueta)}</th><td>${escHtml(n.descriptor_cs)}</td><td>${escHtml(n.descriptor_crr)}</td><td>${escHtml(n.apoyos)}</td></tr>`).join("");
  return `<details class="sev-ref" id="sevRef"><summary>Referencia DSM-5-TR — los tres grados, por dominio, y los apoyos que orientan</summary>
    <div class="tabla-scroll"><table class="comp-table sev-tabla"><caption class="sr-only">Grados de severidad DSM-5-TR: descriptor por dominio y apoyos</caption>
      <thead><tr><th scope="col">Grado</th><th scope="col">Comunicación social</th><th scope="col">Comportamientos restringidos y repetitivos</th><th scope="col">Apoyos que orienta</th></tr></thead>
      <tbody>${filas}</tbody></table></div>
    <p class="hint" style="margin-top:8px">Los apoyos <b>orientan</b>: no determinan prestaciones ni elegibilidad, que resuelven otros organismos.</p>
  </details>`;
}
function sevPanelHtml(){
  const rec = SEV.rec;
  const listo = SEV.hceId === EXP.id && (SEV.estado === "listo" || SEV.estado === "vacio");
  const estado = listo ? `<span class="ev-estado"><span class="st ${rec ? "st-registrada" : "st-sin_iniciar"}"><span aria-hidden="true">${rec ? "●" : "○"}</span> ${rec ? "Registrada" : "Por registrar"}</span></span>` : "";
  const cab = `<div class="mod-cab"><h2 id="sevTitulo" tabindex="-1">SEV · Severidad (DSM-5-TR)</h2>${estado}</div>`;
  if(!listo && SEV.estado !== "error") return `${cab}<div class="info-card"><div class="ib">${estadoCargandoHtml("Cargando la severidad…")}</div></div>`;
  if(SEV.estado === "error") return `${cab}<div class="info-card"><div class="ib">${estadoErrorHtml(SEV.error, "sevReintentar()")}</div></div>`;
  const cuerpo = rec ? sevLecturaHtml(rec) : `<div class="ib">${estadoVacioHtml("◌", `Todavía no se registró la severidad DSM-5-TR de este expediente.<br>
      <span class="hint">Se registra por juicio clínico, los dos dominios juntos, y se corrige cuando el equipo lo considere.</span>`,
      `<button type="button" class="btn btn-primary" id="btnSevNuevo" onclick="sevAbrirForm()">+ Registrar severidad</button>`)}</div>`;
  return `${cab}
    <div id="sevAvisos" class="review-note avisos-api" role="status"${(SEV.avisos || []).length ? "" : " hidden"}>${sevAvisosHtml()}</div>
    <div class="info-card">
      <p class="hint sev-nota" id="sevNota"><b>Regla del módulo:</b> ${escHtml(SEV_REGLA)}</p>
      ${cuerpo}
    </div>
    ${sevReferenciaHtml()}`;
}

/* ---------- Formulario (diálogo compartido) ---------- */
function _sevDescriptor(dom, grado){
  const n = (SEV.niveles || []).find(x => String(x.grado) === String(grado));
  return n ? n["descriptor_" + dom] : "";
}
function sevActualizarDescriptor(dom){
  const s = _sevEl("sev_" + dom), d = _sevEl("desc_sev_" + dom);
  if(s && d){ const t = _sevDescriptor(dom, s.value); d.textContent = t; d.hidden = !t; }
}
function sevAbrirForm(){
  if(SEV.estado !== "listo" && SEV.estado !== "vacio") return;
  const r = SEV.rec || {}, crear = !SEV.rec;
  const req = (f) => `<span class="req" aria-hidden="true">*</span><span class="sr-only">(${f ? "obligatoria" : "obligatorio"})</span>`;
  const sel = (dom, rot) => {
    const actual = r["nivel_" + dom];
    const opts = `<option value="">— elegir grado —</option>` + (SEV.niveles || []).map(n =>
      `<option value="${n.grado}"${String(n.grado) === String(actual) ? " selected" : ""}>${escHtml(n.etiqueta)}</option>`).join("");
    const desc = actual ? _sevDescriptor(dom, actual) : "";
    return `<div class="field"><label for="sev_${dom}">${rot} ${req()}</label>
      <select id="sev_${dom}" aria-required="true" aria-describedby="desc_sev_${dom} err_sev_${dom}" onchange="sevActualizarDescriptor('${dom}')">${opts}</select>
      <p class="sev-desc" id="desc_sev_${dom}" aria-live="polite"${desc ? "" : " hidden"}>${escHtml(desc)}</p><div class="err" id="err_sev_${dom}"></div></div>`;
  };
  const body = `<div id="sevErrores" class="form-errores" role="alert" tabindex="-1" hidden></div>
    <p class="hint" style="margin-bottom:12px">Por juicio clínico y por separado para cada dominio. <b>Se guardan los dos dominios juntos</b>: si falta uno, no se guarda nada.</p>
    ${SEV_DOMINIOS.map(([dom, rot]) => sel(dom, rot)).join("")}
    <div class="field"><label for="sev_just">Justificación clínica ${req(true)}</label>
      <textarea id="sev_just" aria-required="true" aria-describedby="hint_sev_just err_sev_just" style="min-height:110px">${escHtml(r.justificacion || "")}</textarea>
      <div class="hint" id="hint_sev_just">Qué se observó y en qué contextos.</div><div class="err" id="err_sev_just"></div></div>
    <div class="field"><label for="sev_fecha">Fecha del juicio ${req(true)}</label>
      <input id="sev_fecha" type="date" value="${escHtml(r.fecha || "")}" aria-required="true" aria-describedby="err_sev_fecha"><div class="err" id="err_sev_fecha"></div></div>
    <p class="hint">El registro queda a nombre de quien lo guarda.</p>`;
  const foot = `<span class="left">HCE-SEV · Severidad DSM-5-TR</span>
    <div style="display:flex;gap:10px">
      <button type="button" class="btn btn-ghost" id="btnSevCancelar" onclick="cerrarFlujoModalUsuario()">Cancelar</button>
      <button type="button" class="btn btn-primary" id="btnSevGuardar" onclick="sevGuardar()">${crear ? "✓ Registrar severidad" : "✓ Guardar cambios"}</button>
    </div>`;
  const nombre = EXP.hce ? `${EXP.hce.nombre} ${EXP.hce.apellido}`.trim() : "";
  openFlujoModal(crear ? "Registrar severidad DSM-5-TR" : "Editar severidad DSM-5-TR", nombre ? `${nombre} · Severidad (SEV)` : "Severidad (SEV)", body, foot);
}

function _sevValores(){
  const v = (id) => { const e = _sevEl(id); return e ? e.value : ""; };
  return {nivel_cs: v("sev_cs"), nivel_crr: v("sev_crr"), justificacion: v("sev_just"), fecha: v("sev_fecha")};
}
async function sevGuardar(){
  if(SEV.guardando) return;
  const mi = EXP.seq, id = EXP.id, crear = !SEV.rec;
  const modal = _sevEl("modalFlujo");
  formLimpiar(modal, "sevErrores");
  const val = _sevValores();
  // Entero o nada (§5.138 d): se marcan TODOS los que faltan y no se envía nada.
  const faltan = Object.entries(SEV_CAMPOS).filter(([k]) => !String(val[k]).trim()).map(([k, [ctl, rot]]) =>
    ({id: ctl, rot, mensaje: k.startsWith("nivel_") ? "Elegí un grado." : k === "fecha" ? "Ingresá la fecha." : "Escribí la justificación."}));
  if(faltan.length){ formResumen("sevErrores", faltan, "Faltan datos: se guardan los dos dominios juntos.").focus(); return; }
  const nuevo = {nivel_cs: Number(val.nivel_cs), nivel_crr: Number(val.nivel_crr), justificacion: val.justificacion, fecha: val.fecha};
  let body = nuevo;
  if(!crear){                                   // PATCH: sólo lo que cambió
    body = {};
    Object.keys(nuevo).forEach(k => { if(nuevo[k] !== SEV.rec[k]) body[k] = nuevo[k]; });
    if(!Object.keys(body).length){ formResumen("sevErrores", [{mensaje: "No hay cambios para guardar."}], "Nada que guardar:").focus(); return; }
  }
  const btn = _sevEl("btnSevGuardar");
  SEV.guardando = true; if(btn){ btn.disabled = true; btn.textContent = "Guardando…"; }
  try{
    const r = await apiFetch(`/hce/${id}/severidad`, {method: crear ? "POST" : "PATCH", body});
    if(mi !== EXP.seq || SEV.hceId !== id) return;
    // Se vuelve a pintar TODO desde la respuesta: etiquetas y autor son los del servidor, no los del formulario.
    SEV.guardando = false; SEV.rec = r.data; SEV.estado = "listo"; SEV.avisos = r.warnings || [];
    closeFlujoModal();
    sevRepintar();
    const t = _sevEl("sevTitulo"); if(t) t.focus();
    toast(crear ? "Severidad registrada" : "Severidad guardada");
  }catch(err){
    if(mi !== EXP.seq || SEV.hceId !== id) return;
    SEV.guardando = false; if(btn){ btn.disabled = false; btn.textContent = crear ? "✓ Registrar severidad" : "✓ Guardar cambios"; }
    if(err instanceof ApiError && err.status === 409){       // otro usuario ya la registró: se muestra lo que hay en el servidor
      SEV.avisos = [{mensaje: err.message + " Se muestra la severidad tal como está en el servidor.", conflicto: true}];
      closeFlujoModal();
      await sevCargar(false);
      const t = _sevEl("sevTitulo"); if(t) t.focus();
      return;
    }
    const detalle = err instanceof ApiError && err.detail.length ? err.detail : [{campo: null, mensaje: err.message || "No se pudo guardar."}];
    const items = detalle.map(d => { const m = d.campo && SEV_CAMPOS[String(d.campo).split(".")[0]];
      return {id: m ? m[0] : null, rot: m ? m[1] : "", mensaje: d.mensaje}; });
    // El formulario no se vuelve a pintar: lo elegido se conserva y los errores quedan junto a cada campo.
    formResumen("sevErrores", items, crear ? "No se pudo registrar la severidad:" : "No se pudo guardar:").focus();
  }
}
