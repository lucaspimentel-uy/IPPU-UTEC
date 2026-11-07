/* HCE-DOC conectado (C5, handoff §5.155): la pestaña «Documentos» del expediente (grupo «Registro») y las fotos del grupo.
   Demo L1 HCE+IDEA - IPPU x UTEC-LIDIA.
     GET   /documentos/categorias                   las 12 categorías (las 4 «Registro histórico» marcadas)
     GET   /hce/{id}/documentos                     la lista, la carga más nueva primero (total en X-Total-Count)
     POST  …  (multipart: archivo, categoria_id, nombre?, fecha_original?)
     PATCH /hce/{id}/documentos/{doc}               metadatos de un NO histórico (un histórico es 409: sólo lectura)
     GET   /hce/{id}/documentos/{doc}/archivo       descarga (con el token; se guarda como Blob)
     GET|POST /hce/{id}/fotos · GET …/fotos/{f}/archivo · lo mismo en /grupos/{g}/fotos (sólo admin y técnicos del grupo)
     GET|POST|PATCH /hce/{id}/autorizacion-imagen   404 = sin registrar (estado vacío, no un error)
   Reglas, todas del servidor (esto es sólo presentación):
   - el tipo del archivo lo detecta la API por el contenido: `accept` del <input> es una pista, no una validación; el 413 y el 422
     se muestran junto al campo del archivo y en el resumen role="alert" con el foco;
   - «histórico», el tipo y el tamaño salen de la respuesta; un histórico no ofrece «Editar»;
   - guardar una foto NO pide la autorización de imagen ni avisa (§5.99); la autorización sólo regula compartir;
   - la descarga va por fetch con el token y se guarda como Blob; una miniatura sólo se muestra desde un Blob image/jpeg o
     image/png (nunca HTML ni SVG en línea), y su URL se revoca al cambiar de vista o de expediente;
   - sin DELETE de documentos ni de fotos (no está decidido borrar material clínico).
   Los formularios van en el diálogo compartido (#modalFlujo): Esc/×/Cancelar con algo elegido o tipeado piden confirmación.
   Los scripts se cargan en orden en index.html: el orden ES la semantica. */
const DOCS = {hceId: null, estado: "cargando", docs: {filas: [], total: 0, pagina: 0}, fotos: {filas: [], total: 0}, aut: null,
  categorias: null, carga: 0, avisos: [], guardando: false, error: "", noEncontrado: false, urls: {}};
const DOC_POR_PAGINA = 10;
const FOTOS_MAX = 50;
const _docEl = (id) => document.getElementById(id);
const DOC_CAMPOS = {archivo: ["docf_archivo", "Archivo"], categoria_id: ["docf_categoria", "Categoría"], nombre: ["docf_nombre", "Nombre"],
  fecha_original: ["docf_fecha", "Fecha original"]};
const FOTO_CAMPOS = {archivo: ["fotf_archivo", "Archivo"], descripcion: ["fotf_desc", "Descripción"], fecha: ["fotf_fecha", "Fecha"]};
const AUT_CAMPOS = {registrada: ["autf_registrada", "¿Está registrada?"], fecha: ["autf_fecha", "Fecha"], documento_id: ["autf_documento", "Copia firmada"]};
const AUT_NOTA = "La autorización de uso de imagen regula si las fotos se pueden compartir; guardarlas en la HCE no la requiere.";
const TIPO_TXT = {pdf: "PDF", jpg: "JPG", png: "PNG", pptx: "PPTX"};   // PPTX sólo en los documentos de un ateneo (C6)
const MIME_IMAGEN = ["image/jpeg", "image/png"];

/* ---------- Miniaturas: Blob URLs que se revocan ---------- */
function _liberarUrls(mapa){ Object.values(mapa || {}).forEach(u => { try{ URL.revokeObjectURL(u); }catch(_e){ /* nada */ } }); }
function docReiniciar(){
  DOCS.carga++;
  _liberarUrls(DOCS.urls);
  Object.assign(DOCS, {hceId: null, estado: "cargando", docs: {filas: [], total: 0, pagina: 0}, fotos: {filas: [], total: 0}, aut: null,
    avisos: [], guardando: false, error: "", noEncontrado: false, urls: {}});
  // Las categorías no dependen del expediente: se conservan mientras dure la sesión (ver docOlvidarSesion).
}
function docOlvidarSesion(){ docReiniciar(); DOCS.categorias = null; grpFotosOlvidar(); }
/* Al cambiar de pestaña o de vista se liberan las miniaturas; al volver se piden de nuevo. */
function docSalirTab(){ DOCS.carga++; _liberarUrls(DOCS.urls); DOCS.urls = {}; }
function fotosLiberarVista(vista){
  if(vista !== "expediente") docSalirTab();
  if(vista !== "grupos") grpFotosLiberar();
}

async function docTraerCategorias(){
  if(DOCS.categorias) return DOCS.categorias;
  const r = await apiFetch("/documentos/categorias");
  DOCS.categorias = r.data;
  return DOCS.categorias;
}

/* ---------- Formato (sólo presentación: nada de esto se guarda) ---------- */
function fmtTamano(b){
  if(b === null || b === undefined) return "—";
  if(b < 1024) return `${b} B`;
  if(b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}
function _docV(v){ return v === null || v === undefined || v === "" ? "—" : escHtml(v); }

/* ---------- Carga de la pestaña ---------- */
function docMostrar(){
  if(DOCS.hceId === EXP.id && DOCS.estado === "listo"){ docRepintar(); docCargar(true); return; }
  docCargar(false);
}
async function docCargar(conservar){
  const mi = EXP.seq, id = EXP.id;
  if(id === null) return;
  if(DOCS.hceId !== id){ docReiniciar(); DOCS.hceId = id; }
  else if(!conservar) DOCS.estado = "cargando";
  const n = ++DOCS.carga;
  const vigente = () => mi === EXP.seq && DOCS.hceId === id && n === DOCS.carga;
  if(DOCS.estado === "cargando") docRepintar();
  const offset = DOCS.docs.pagina * DOC_POR_PAGINA;
  const [rd, rf, ra, rc] = await Promise.allSettled([
    apiFetch(`/hce/${id}/documentos`, {query: {limit: DOC_POR_PAGINA, offset}}),
    apiFetch(`/hce/${id}/fotos`, {query: {limit: FOTOS_MAX}}),
    apiFetch(`/hce/${id}/autorizacion-imagen`), docTraerCategorias()]);
  if(!vigente()) return;
  const autFalta = ra.status === "rejected" && ra.reason instanceof ApiError && ra.reason.status === 404;
  const fallo = [rd.status === "rejected" ? rd : null, rf.status === "rejected" ? rf : null,
    ra.status === "rejected" && !autFalta ? ra : null, rc.status === "rejected" ? rc : null].find(Boolean);
  if(fallo){
    DOCS.estado = "error";
    DOCS.noEncontrado = fallo.reason instanceof ApiError && fallo.reason.status === 404;
    DOCS.error = fallo.reason instanceof ApiError ? fallo.reason.message : "No se pudieron cargar los documentos.";
    docRepintar(); return;
  }
  const docs = {filas: rd.value.data, total: rd.value.total === null ? rd.value.data.length : rd.value.total, pagina: DOCS.docs.pagina};
  if(!docs.filas.length && docs.pagina > 0 && docs.total > 0){ DOCS.docs.pagina = Math.ceil(docs.total / DOC_POR_PAGINA) - 1; docCargar(true); return; }
  DOCS.docs = docs;
  DOCS.fotos = {filas: rf.value.data, total: rf.value.total === null ? rf.value.data.length : rf.value.total};
  DOCS.aut = autFalta ? null : ra.value.data;
  DOCS.estado = "listo";
  docRepintar();
  docMiniaturas(id, n);
}
function docReintentar(){ docCargar(false); }
function docPagina(delta){
  const ultima = Math.max(0, Math.ceil(DOCS.docs.total / DOC_POR_PAGINA) - 1);
  DOCS.docs.pagina = Math.min(ultima, Math.max(0, DOCS.docs.pagina + delta));
  docCargar(true);
}

/* Cada miniatura es un GET con el token; sólo un Blob image/jpeg o image/png se muestra (URL.createObjectURL). */
async function _miniatura(ruta){
  const r = await apiBlob(ruta);
  return MIME_IMAGEN.includes(r.blob.type) ? URL.createObjectURL(r.blob) : null;
}
async function docMiniaturas(id, n){
  for(const f of DOCS.fotos.filas){
    if(DOCS.urls[f.id]) continue;
    let url = null;
    try{ url = await _miniatura(`/hce/${id}/fotos/${f.id}/archivo`); }catch(_e){ url = null; }
    if(DOCS.hceId !== id || n !== DOCS.carga || EXP.tab !== "doc"){ if(url) URL.revokeObjectURL(url); return; }
    if(!url) continue;
    DOCS.urls[f.id] = url;
    const img = _docEl(`docFotoImg_${f.id}`);
    if(img) _ponerMiniatura(img, url);
  }
}
function _ponerMiniatura(cont, url){
  const img = document.createElement("img");
  img.src = url; img.alt = cont.dataset.alt || ""; img.className = "foto-img";
  cont.replaceChildren(img);
  cont.classList.add("con-img");
}

/* ---------- Render de la pestaña ---------- */
function docRepintar(){
  if(EXP.tab !== "doc") return;
  const p = _docEl("panelExp"); if(!p) return;
  const foco = document.activeElement && p.contains(document.activeElement) ? document.activeElement.id : null;
  p.innerHTML = docPanelConectadoHtml();
  Object.entries(DOCS.urls).forEach(([fid, url]) => { const c = _docEl(`docFotoImg_${fid}`); if(c) _ponerMiniatura(c, url); });
  if(!foco) return;
  const b = _docEl(foco);
  if(b && !b.disabled){ b.focus(); return; }
  const otro = foco === "btnDocSig" ? "btnDocAnt" : foco === "btnDocAnt" ? "btnDocSig" : null;
  const o = otro && _docEl(otro), t = _docEl("docDocsTitulo") || _docEl("docTitulo");
  if(o && !o.disabled) o.focus(); else if(t) t.focus();
}
function docAvisosHtml(){
  const a = DOCS.avisos || [];
  if(!a.length) return "";
  return `${avisosCuerpoHtml(a)}<button type="button" class="btn btn-ghost btn-mini" onclick="docCerrarAvisos()">Entendido</button>`;
}
function docCerrarAvisos(){ DOCS.avisos = []; const el = _docEl("docAvisos"); if(el){ el.innerHTML = ""; el.hidden = true; } }

function docFilaHtml(d){
  const hist = d.es_registro_historico
    ? `<span class="doc-hist-marca" id="docHist_${d.id}">Registro histórico — sólo lectura</span>` : "";
  const tipo = d.tipo ? TIPO_TXT[d.tipo] || d.tipo : "—";
  const nombre = escHtml(d.nombre);
  return `<tr data-doc="${d.id}"${d.es_registro_historico ? ` data-historico="true"` : ""}>
    <td class="doc-nombre"><span class="doc-nombre-txt">${nombre}</span>${hist}</td>
    <td>${escHtml(d.categoria.nombre)}</td>
    <td class="num">${d.fecha_original ? escHtml(fmtFecha(d.fecha_original)) : "—"}</td>
    <td class="num">${escHtml(fmtFecha(d.fecha_carga))}</td>
    <td class="num"><span class="doc-tipo">${escHtml(tipo)}</span> · ${escHtml(fmtTamano(d.tamano_bytes))}</td>
    <td class="doc-acciones">
      ${d.tiene_archivo ? `<button type="button" class="btn btn-ghost btn-mini" id="btnDocBajar_${d.id}" onclick="docDescargar(${d.id})">Descargar<span class="sr-only"> ${nombre}</span></button>` : `<span class="hint">Sin archivo</span>`}
      ${d.es_registro_historico ? "" : `<button type="button" class="btn btn-ghost btn-mini" id="btnDocEditar_${d.id}" onclick="docAbrirEditar(${d.id})">✎ Editar<span class="sr-only"> ${nombre}</span></button>`}
    </td></tr>`;
}
function docPaginadoHtml(){
  const d = DOCS.docs;
  if(d.total <= DOC_POR_PAGINA) return "";
  const desde = d.pagina * DOC_POR_PAGINA + 1, hasta = Math.min(d.total, desde + d.filas.length - 1);
  const ultima = Math.ceil(d.total / DOC_POR_PAGINA) - 1;
  return `<nav class="log-paginado" aria-label="Paginado de los documentos">
    <span class="log-rango" role="status">Mostrando ${desde}–${hasta} de ${d.total}</span>
    <button type="button" class="btn btn-ghost btn-mini" id="btnDocAnt" onclick="docPagina(-1)"${d.pagina <= 0 ? " disabled" : ""}>‹ Más nuevos</button>
    <button type="button" class="btn btn-ghost btn-mini" id="btnDocSig" onclick="docPagina(1)"${d.pagina >= ultima ? " disabled" : ""}>Más viejos ›</button>
  </nav>`;
}
function docDocumentosHtml(){
  const d = DOCS.docs;
  const tabla = d.filas.length
    ? `<div class="tabla-scroll"><table class="comp-table doc-tabla" id="docTabla">
        <caption class="sr-only">Documentos del expediente, el de carga más reciente primero</caption>
        <thead><tr><th scope="col">Documento</th><th scope="col">Categoría</th><th scope="col" class="num">Fecha original</th>
          <th scope="col" class="num">Cargado</th><th scope="col" class="num">Tipo y tamaño</th><th scope="col"><span class="sr-only">Acciones</span></th></tr></thead>
        <tbody>${d.filas.map(docFilaHtml).join("")}</tbody></table></div>${docPaginadoHtml()}`
    : `<div id="docVacio">${estadoVacioHtml("◌", "Todavía no se cargó ningún documento.")}</div>`;
  return `<div class="info-card" id="docDocsCard"><h3 id="docDocsTitulo" tabindex="-1">Documentos
      <span class="org-total" id="docTotal">${d.total}</span><span class="sr-only"> cargados</span></h3>
    <div class="ib">
      <p class="hint doc-nota">PDF, JPG o PNG de hasta 10 MB. Los registros históricos de la HCE anterior son de sólo lectura.</p>
      ${tabla}
      <div class="org-reg-acciones"><button type="button" class="btn btn-ghost" id="btnDocCargar" onclick="docAbrirCarga()">+ Cargar documento</button></div>
    </div></div>`;
}
/* La grilla de fotos (la usan la pestaña y el grupo): miniatura (si llegó), descripción, fecha y «Descargar». */
function fotosGridHtml(fotos, pref, descargar){
  if(!fotos.length) return `<div id="${pref}FotosVacio">${estadoVacioHtml("◌", "Todavía no se cargó ninguna foto.")}</div>`;
  return `<ul class="foto-grid" id="${pref}FotosGrid" aria-label="Fotos, la última cargada primero">${fotos.map(f => {
    const desc = f.descripcion ? escHtml(f.descripcion) : "Sin descripción";
    return `<li class="foto-item" data-foto="${f.id}">
      <div class="foto-marco" id="${pref}FotoImg_${f.id}" data-alt="${f.descripcion ? escHtml(f.descripcion) : "Foto sin descripción"}"><span class="foto-ph" aria-hidden="true">▣</span><span class="sr-only">Vista previa no disponible</span></div>
      <div class="foto-cap"><span class="foto-desc">${desc}</span><span class="foto-fecha">${f.fecha ? escHtml(fmtFecha(f.fecha)) : "Sin fecha"} · ${escHtml(TIPO_TXT[f.tipo] || "—")}</span></div>
      <button type="button" class="btn btn-ghost btn-mini" id="btn${pref}FotoBajar_${f.id}" onclick="${descargar}(${f.id})">Descargar<span class="sr-only"> la foto ${desc}</span></button>
    </li>`; }).join("")}</ul>`;
}
function docFotosHtml(){
  const f = DOCS.fotos;
  return `<div class="info-card" id="docFotosCard"><h3 id="docFotosTitulo" tabindex="-1">Fotos
      <span class="org-total" id="docFotosTotal">${f.total}</span><span class="sr-only"> cargadas</span></h3>
    <div class="ib">${fotosGridHtml(f.filas, "doc", "docDescargarFoto")}
      ${f.total > f.filas.length ? `<p class="hint">Se muestran las ${f.filas.length} más recientes de ${f.total}.</p>` : ""}
      <div class="org-reg-acciones"><button type="button" class="btn btn-ghost" id="btnDocFoto" onclick="fotoAbrirCarga('hce')">+ Cargar foto</button></div>
    </div></div>`;
}
function docAutorizacionHtml(){
  const a = DOCS.aut;
  const cuerpo = a
    ? `<dl class="ib inc-lectura" id="docAutLectura">
        <div class="data-row"><dt>Registrada</dt><dd id="docAutRegistrada">${a.registrada ? "Sí" : "No"}</dd></div>
        <div class="data-row"><dt>Fecha</dt><dd id="docAutFecha">${a.fecha ? escHtml(fmtFecha(a.fecha)) : "—"}</dd></div>
        <div class="data-row"><dt>Copia firmada</dt><dd id="docAutDoc">${a.documento ? escHtml(a.documento.nombre) : "—"}</dd></div>
      </dl>
      <div class="ib ib-pie"><button type="button" class="btn btn-ghost" id="btnAutEditar" onclick="autAbrir()">✎ Editar<span class="sr-only"> la autorización de uso de imagen</span></button></div>`
    : `<div class="ib">${estadoVacioHtml("◌", "<b>Sin registrar.</b> No se registró la autorización de uso de imagen de este NNA.",
        `<button type="button" class="btn btn-ghost" id="btnAutRegistrar" onclick="autAbrir()">+ Registrar</button>`)}</div>`;
  return `<div class="info-card" id="docAutCard"><h3 id="docAutTitulo" tabindex="-1">Autorización de uso de imagen</h3>
    ${cuerpo}<p class="hint doc-aut-nota" id="docAutNota">${escHtml(AUT_NOTA)}</p></div>`;
}
function docPanelConectadoHtml(){
  const cab = `<div class="mod-cab"><h2 id="docTitulo" tabindex="-1">DOC · Documentos y fotos</h2></div>`;
  if(DOCS.hceId !== EXP.id || DOCS.estado === "cargando") return `${cab}<div class="info-card"><div class="ib">${estadoCargandoHtml("Cargando los documentos…")}</div></div>`;
  if(DOCS.estado === "error") return `${cab}<div class="info-card"><div class="ib">${estadoErrorHtml(DOCS.noEncontrado ? "No se encontró el expediente." : DOCS.error, DOCS.noEncontrado ? "" : "docReintentar()")}</div></div>`;
  return `${cab}
    <div id="docAvisos" class="review-note avisos-api" role="status"${(DOCS.avisos || []).length ? "" : " hidden"}>${docAvisosHtml()}</div>
    <p class="hint org-nota" id="docNota">Copias digitalizadas que acompañan la historia (informes externos, documentos de organismos, autorizaciones, estudios) y las fotos del NNA.</p>
    ${docDocumentosHtml()}
    ${docFotosHtml()}
    ${docAutorizacionHtml()}`;
}

/* ---------- Descargas (fetch con el token → Blob → se guarda) ---------- */
function _guardarBlob(blob, nombre){
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nombre || "archivo"; a.rel = "noopener"; a.hidden = true;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function _descargar(ruta, nombre, alFallar){
  try{
    const r = await apiBlob(ruta);
    _guardarBlob(r.blob, r.nombre || nombre);
    toast("Descarga lista");
  }catch(err){
    if(err instanceof ApiError && err.status === 401) return;
    const msg = err instanceof ApiError ? err.message : "No se pudo descargar el archivo.";
    if(alFallar) alFallar(msg); else toast(msg, "error");
  }
}
function docDescargar(docId){
  const d = DOCS.docs.filas.find(x => x.id === docId); if(!d || DOCS.hceId === null) return;
  _descargar(`/hce/${DOCS.hceId}/documentos/${docId}/archivo`, d.nombre, (m) => {
    DOCS.avisos = [{mensaje: m, conflicto: true}];
    const el = _docEl("docAvisos"); if(el){ el.innerHTML = docAvisosHtml(); el.hidden = false; }
  });
}
function docDescargarFoto(fotoId){ if(DOCS.hceId !== null) _descargar(`/hce/${DOCS.hceId}/fotos/${fotoId}/archivo`, "foto"); }

/* ---------- Diálogos ---------- */
const _REQ = `<span class="req" aria-hidden="true">*</span><span class="sr-only">(obligatorio)</span>`;
function _docNombreNna(){ return EXP.hce ? `${EXP.hce.nombre} ${EXP.hce.apellido}`.trim() : ""; }
function _docPie(izq, idGuardar, rotulo, accion){
  return `<span class="left">${izq}</span>
    <div class="acciones-pie">
      <button type="button" class="btn btn-ghost" id="btnDocCancelar" onclick="cerrarFlujoModalUsuario()">Cancelar</button>
      <button type="button" class="btn btn-primary" id="${idGuardar}" onclick="${accion}">${rotulo}</button>
    </div>`;
}
function _docSelectCategoria(id, lista, actual, vacio){
  return `<select id="${id}" aria-describedby="err_${id}"${vacio ? ` aria-required="true"` : ""}>${vacio ? `<option value="">${vacio}</option>` : ""}${lista.map(c =>
    `<option value="${c.id}"${c.id === actual ? " selected" : ""}>${escHtml(c.nombre)}${c.es_registro_historico ? " (sólo lectura después)" : ""}</option>`).join("")}</select>`;
}
/* El 422/413 de la API: cada `campo` junto a su control y en el resumen role="alert", que recibe el foco. Lo elegido se conserva. */
function _docErrores(err, campos, resumenId, titulo){
  const detalle = err instanceof ApiError && err.detail.length ? err.detail : [{campo: null, mensaje: err.message || "No se pudo guardar."}];
  const items = detalle.map(d => { const m = d.campo && campos[String(d.campo).split(".")[0]];
    return {id: m ? m[0] : null, rot: m ? m[1] : "", mensaje: d.mensaje}; });
  formResumen(resumenId, items, titulo).focus();
}

/* Cargar documento */
function docAbrirCarga(){
  if(DOCS.estado !== "listo") return;
  const cats = DOCS.categorias || [];
  const body = `<div id="docErrores" class="form-errores" role="alert" tabindex="-1" hidden></div>
    <div class="field"><label for="docf_archivo">Archivo ${_REQ}</label>
      <input id="docf_archivo" type="file" accept=".pdf,.jpg,.jpeg,.png" aria-required="true" aria-describedby="hint_docf_archivo err_docf_archivo">
      <div class="hint" id="hint_docf_archivo">PDF, JPG o PNG, hasta 10 MB. El servidor revisa el contenido del archivo, no su extensión.</div><div class="err" id="err_docf_archivo"></div></div>
    <div class="field"><label for="docf_categoria">Categoría ${_REQ}</label>${_docSelectCategoria("docf_categoria", cats, null, "— elegir categoría —")}<div class="err" id="err_docf_categoria"></div></div>
    <div class="field"><label for="docf_nombre">Nombre</label><input id="docf_nombre" type="text" autocomplete="off" aria-describedby="hint_docf_nombre err_docf_nombre">
      <div class="hint" id="hint_docf_nombre">Si queda vacío, se usa el nombre del archivo.</div><div class="err" id="err_docf_nombre"></div></div>
    <div class="field"><label for="docf_fecha">Fecha original</label><input id="docf_fecha" type="date" aria-describedby="err_docf_fecha"><div class="err" id="err_docf_fecha"></div></div>
    <p class="hint">Un documento de una categoría «Registro histórico» queda de sólo lectura.</p>`;
  const nombre = _docNombreNna();
  openFlujoModal("Cargar documento", nombre ? `${nombre} · Documentos (DOC)` : "Documentos (DOC)", body,
    _docPie("HCE-DOC · Documentos", "btnDocGuardar", "✓ Cargar documento", "docGuardarCarga()"));
}
async function docGuardarCarga(){
  if(DOCS.guardando) return;
  const mi = EXP.seq, id = EXP.id;
  formLimpiar(_docEl("modalFlujo"), "docErrores");
  // Sin validación propia: falta de archivo, tipo, tamaño y categoría los decide la API (413/422 por campo).
  const fd = new FormData();
  const arch = _docEl("docf_archivo").files[0];
  if(arch) fd.append("archivo", arch);
  const cat = _docEl("docf_categoria").value, nom = _docEl("docf_nombre").value, fec = _docEl("docf_fecha").value;
  if(cat) fd.append("categoria_id", cat);
  if(nom.trim()) fd.append("nombre", nom);
  if(fec) fd.append("fecha_original", fec);
  const btn = _docEl("btnDocGuardar");
  DOCS.guardando = true; if(btn){ btn.disabled = true; btn.textContent = "Cargando…"; }
  try{
    const r = await apiFetch(`/hce/${id}/documentos`, {method: "POST", body: fd});
    if(mi !== EXP.seq || DOCS.hceId !== id) return;
    DOCS.guardando = false; DOCS.avisos = r.warnings || [];
    DOCS.docs.pagina = 0;                            // el nuevo va primero (la API ordena)
    closeFlujoModal();
    await docCargar(true);
    if(mi !== EXP.seq || DOCS.hceId !== id) return;
    const t = _docEl("docDocsTitulo"); if(t) t.focus();
    toastGuardado("Documento cargado", r.warnings);
  }catch(err){
    if(mi !== EXP.seq || DOCS.hceId !== id) return;
    DOCS.guardando = false; if(btn){ btn.disabled = false; btn.textContent = "✓ Cargar documento"; }
    _docErrores(err, DOC_CAMPOS, "docErrores", "No se pudo cargar el documento:");
  }
}

/* Editar metadatos (sólo los no históricos: el servidor contesta 409 a un histórico) */
function docAbrirEditar(docId){
  const d = DOCS.docs.filas.find(x => x.id === docId);
  if(!d || d.es_registro_historico) return;
  const cats = (DOCS.categorias || []).filter(c => !c.es_registro_historico);
  const body = `<div id="docErrores" class="form-errores" role="alert" tabindex="-1" hidden></div>
    <div class="field"><label for="docf_nombre">Nombre ${_REQ}</label><input id="docf_nombre" type="text" value="${escHtml(d.nombre)}" autocomplete="off" aria-required="true" aria-describedby="err_docf_nombre"><div class="err" id="err_docf_nombre"></div></div>
    <div class="field"><label for="docf_categoria">Categoría</label>${_docSelectCategoria("docf_categoria", cats, d.categoria.id, null)}<div class="err" id="err_docf_categoria"></div></div>
    <div class="field"><label for="docf_fecha">Fecha original</label><input id="docf_fecha" type="date" value="${escHtml(d.fecha_original || "")}" aria-describedby="err_docf_fecha"><div class="err" id="err_docf_fecha"></div></div>
    <p class="hint">Se editan los datos del documento; el archivo no se reemplaza.</p>`;
  openFlujoModal("Editar documento", `${_docNombreNna()} · Documentos (DOC)`, body,
    _docPie("HCE-DOC · Documentos", "btnDocGuardar", "✓ Guardar cambios", `docGuardarEdicion(${docId})`));
}
async function docGuardarEdicion(docId){
  if(DOCS.guardando) return;
  const mi = EXP.seq, id = EXP.id, d = DOCS.docs.filas.find(x => x.id === docId);
  if(!d) return;
  formLimpiar(_docEl("modalFlujo"), "docErrores");
  const nuevo = {nombre: _docEl("docf_nombre").value, categoria_id: +_docEl("docf_categoria").value, fecha_original: _docEl("docf_fecha").value || null};
  const body = {};
  if(nuevo.nombre !== d.nombre) body.nombre = nuevo.nombre;
  if(nuevo.categoria_id !== d.categoria.id) body.categoria_id = nuevo.categoria_id;
  if(nuevo.fecha_original !== (d.fecha_original || null)) body.fecha_original = nuevo.fecha_original;
  if(!Object.keys(body).length){ formResumen("docErrores", [{mensaje: "No hay cambios para guardar."}], "Nada que guardar:").focus(); return; }
  const btn = _docEl("btnDocGuardar");
  DOCS.guardando = true; if(btn){ btn.disabled = true; btn.textContent = "Guardando…"; }
  try{
    const r = await apiFetch(`/hce/${id}/documentos/${docId}`, {method: "PATCH", body});
    if(mi !== EXP.seq || DOCS.hceId !== id) return;
    DOCS.guardando = false; DOCS.avisos = r.warnings || [];
    closeFlujoModal();
    await docCargar(true);
    const t = _docEl("docDocsTitulo"); if(t) t.focus();
    toastGuardado("Documento guardado", r.warnings);
  }catch(err){
    if(mi !== EXP.seq || DOCS.hceId !== id) return;
    DOCS.guardando = false; if(btn){ btn.disabled = false; btn.textContent = "✓ Guardar cambios"; }
    if(err instanceof ApiError && err.status === 409){     // quedó de sólo lectura: se muestra lo que hay en el servidor
      DOCS.avisos = [{mensaje: err.message + " Se muestra el documento tal como está en el servidor.", conflicto: true}];
      closeFlujoModal();
      await docCargar(false);
      const t = _docEl("docTitulo"); if(t) t.focus();
      return;
    }
    _docErrores(err, DOC_CAMPOS, "docErrores", "No se pudo guardar:");
  }
}

/* Cargar foto (del expediente o del grupo abierto): sin pedir la autorización y sin avisos (§5.99). */
function fotoAbrirCarga(destino){
  const enGrupo = destino === "grupo";
  if(enGrupo ? GFOT.estado !== "listo" : DOCS.estado !== "listo") return;
  const body = `<div id="fotErrores" class="form-errores" role="alert" tabindex="-1" hidden></div>
    <div class="field"><label for="fotf_archivo">Foto ${_REQ}</label>
      <input id="fotf_archivo" type="file" accept=".jpg,.jpeg,.png" aria-required="true" aria-describedby="hint_fotf_archivo err_fotf_archivo">
      <div class="hint" id="hint_fotf_archivo">JPG o PNG, hasta 10 MB.</div><div class="err" id="err_fotf_archivo"></div></div>
    <div class="field"><label for="fotf_desc">Descripción</label><input id="fotf_desc" type="text" autocomplete="off" aria-describedby="err_fotf_desc"><div class="err" id="err_fotf_desc"></div></div>
    <div class="field"><label for="fotf_fecha">Fecha</label><input id="fotf_fecha" type="date" aria-describedby="err_fotf_fecha"><div class="err" id="err_fotf_fecha"></div></div>`;
  const sub = enGrupo ? `Grupo ${GFOT.nombre} · Fotos del grupo` : `${_docNombreNna()} · Documentos (DOC)`;
  openFlujoModal(enGrupo ? "Cargar foto del grupo" : "Cargar foto", sub, body,
    _docPie(enGrupo ? "Fotos del grupo" : "HCE-DOC · Fotos", "btnFotoGuardar", "✓ Cargar foto", `fotoGuardar('${enGrupo ? "grupo" : "hce"}')`));
}
async function fotoGuardar(destino){
  const enGrupo = destino === "grupo";
  const est = enGrupo ? GFOT : DOCS;
  if(est.guardando) return;
  const mi = enGrupo ? GFOT.seq : EXP.seq, id = enGrupo ? GFOT.grupoId : EXP.id;
  const vigente = () => enGrupo ? (GFOT.seq === mi && GFOT.grupoId === id) : (EXP.seq === mi && DOCS.hceId === id);
  formLimpiar(_docEl("modalFlujo"), "fotErrores");
  const fd = new FormData();
  const arch = _docEl("fotf_archivo").files[0];
  if(arch) fd.append("archivo", arch);
  const desc = _docEl("fotf_desc").value, fec = _docEl("fotf_fecha").value;
  if(desc.trim()) fd.append("descripcion", desc);
  if(fec) fd.append("fecha", fec);
  const btn = _docEl("btnFotoGuardar");
  est.guardando = true; if(btn){ btn.disabled = true; btn.textContent = "Cargando…"; }
  const token = est.subida = {};    // identifica ESTA subida: la respuesta de una vieja no suelta el candado de una nueva
  const huerfana = () => { if(est.subida === token){ est.guardando = false; est.subida = null; } };
  try{
    const r = await apiFetch(enGrupo ? `/grupos/${id}/fotos` : `/hce/${id}/fotos`, {method: "POST", body: fd});
    if(!vigente()){ huerfana(); return; }
    est.guardando = false; est.avisos = r.warnings || [];
    closeFlujoModal();
    if(enGrupo){ await grpFotosCargar(id, true); const t = _docEl("grpFotosTitulo"); if(t) t.focus(); }
    else { await docCargar(true); const t = _docEl("docFotosTitulo"); if(t) t.focus(); }
    toastGuardado("Foto cargada", r.warnings);
  }catch(err){
    if(!vigente()){ huerfana(); return; }
    est.guardando = false; if(btn){ btn.disabled = false; btn.textContent = "✓ Cargar foto"; }
    _docErrores(err, FOTO_CAMPOS, "fotErrores", "No se pudo cargar la foto:");
  }
}

/* Autorización de uso de imagen: registrar o editar. El selector ofrece los documentos de ESTE expediente (todos, de la API). */
async function autAbrir(){
  if(DOCS.estado !== "listo") return;
  const mi = EXP.seq, id = EXP.id, a = DOCS.aut, crear = !a;
  let docs;
  try{ docs = (await apiFetch(`/hce/${id}/documentos`, {query: {limit: 200}})).data; }
  catch(err){ if(err instanceof ApiError && err.status === 401) return; toast(err instanceof ApiError ? err.message : "No se pudieron leer los documentos.", "error"); return; }
  if(mi !== EXP.seq || DOCS.hceId !== id) return;
  const reg = crear ? "" : (a.registrada ? "si" : "no");
  const body = `<div id="autErrores" class="form-errores" role="alert" tabindex="-1" hidden></div>
    <p class="hint hint-intro">${escHtml(AUT_NOTA)}</p>
    <div class="field"><label for="autf_registrada">¿La familia firmó la autorización? ${_REQ}</label>
      <select id="autf_registrada" aria-required="true" aria-describedby="err_autf_registrada">${crear ? `<option value="">— elegir —</option>` : ""}
        <option value="si"${reg === "si" ? " selected" : ""}>Sí</option><option value="no"${reg === "no" ? " selected" : ""}>No</option></select><div class="err" id="err_autf_registrada"></div></div>
    <div class="field"><label for="autf_fecha">Fecha</label><input id="autf_fecha" type="date" value="${escHtml((a && a.fecha) || "")}" aria-describedby="err_autf_fecha"><div class="err" id="err_autf_fecha"></div></div>
    <div class="field"><label for="autf_documento">Copia firmada (un documento de este expediente)</label>
      <select id="autf_documento" aria-describedby="err_autf_documento"><option value="">— ninguno —</option>${docs.map(d =>
        `<option value="${d.id}"${a && a.documento_id === d.id ? " selected" : ""}>${escHtml(d.nombre)} · ${escHtml(d.categoria.nombre)}</option>`).join("")}</select><div class="err" id="err_autf_documento"></div></div>`;
  openFlujoModal(crear ? "Registrar autorización de uso de imagen" : "Editar autorización de uso de imagen", `${_docNombreNna()} · Documentos (DOC)`, body,
    _docPie("HCE-DOC · Autorización de imagen", "btnAutGuardar", crear ? "✓ Registrar" : "✓ Guardar cambios", "autGuardar()"));
}
async function autGuardar(){
  if(DOCS.guardando) return;
  const mi = EXP.seq, id = EXP.id, a = DOCS.aut, crear = !a;
  formLimpiar(_docEl("modalFlujo"), "autErrores");
  const r0 = _docEl("autf_registrada").value, f0 = _docEl("autf_fecha").value, d0 = _docEl("autf_documento").value;
  const nuevo = {registrada: r0 === "" ? null : r0 === "si", fecha: f0 || null, documento_id: d0 ? +d0 : null};
  let body = {};
  if(crear){ if(nuevo.registrada !== null) body.registrada = nuevo.registrada; if(nuevo.fecha) body.fecha = nuevo.fecha; if(nuevo.documento_id) body.documento_id = nuevo.documento_id; }
  else{
    ["registrada", "fecha", "documento_id"].forEach(c => { if(nuevo[c] !== (a[c] === undefined ? null : a[c])) body[c] = nuevo[c]; });
    if(!Object.keys(body).length){ formResumen("autErrores", [{mensaje: "No hay cambios para guardar."}], "Nada que guardar:").focus(); return; }
  }
  const btn = _docEl("btnAutGuardar"), rotulo = crear ? "✓ Registrar" : "✓ Guardar cambios";
  DOCS.guardando = true; if(btn){ btn.disabled = true; btn.textContent = "Guardando…"; }
  try{
    const r = await apiFetch(`/hce/${id}/autorizacion-imagen`, {method: crear ? "POST" : "PATCH", body});
    if(mi !== EXP.seq || DOCS.hceId !== id) return;
    DOCS.guardando = false; DOCS.aut = r.data; DOCS.avisos = r.warnings || [];
    closeFlujoModal();
    docRepintar();
    const t = _docEl("docAutTitulo"); if(t) t.focus();
    toastGuardado(crear ? "Autorización registrada" : "Autorización guardada", r.warnings);
  }catch(err){
    if(mi !== EXP.seq || DOCS.hceId !== id) return;
    DOCS.guardando = false; if(btn){ btn.disabled = false; btn.textContent = rotulo; }
    if(err instanceof ApiError && err.status === 409){
      DOCS.avisos = [{mensaje: err.message + " Se muestra la autorización tal como está en el servidor.", conflicto: true}];
      closeFlujoModal(); await docCargar(false);
      const t = _docEl("docAutTitulo"); if(t) t.focus();
      return;
    }
    _docErrores(err, AUT_CAMPOS, "autErrores", crear ? "No se pudo registrar:" : "No se pudo guardar:");
  }
}

/* ===================== FOTOS DEL GRUPO (detalle de Grupos) =====================
   GET /grupos/{id}/fotos: sólo el admin y los técnicos de ese grupo (la API decide; un 404 es «no encontrado»). */
const GFOT = {grupoId: null, nombre: "", estado: "vacio", filas: [], total: 0, error: "", noEncontrado: false, seq: 0, urls: {}, guardando: false, subida: null, avisos: []};
/* Al salir de Grupos una subida en vuelo queda huérfana (su respuesta ya no es vigente y no repinta): el candado se suelta acá,
   o «Cargar foto» no haría nada hasta recargar. */
function grpFotosLiberar(){ GFOT.seq++; _liberarUrls(GFOT.urls); GFOT.urls = {}; GFOT.guardando = false; GFOT.subida = null; }
function grpFotosOlvidar(){ grpFotosLiberar(); Object.assign(GFOT, {grupoId: null, nombre: "", estado: "vacio", filas: [], total: 0, error: "", noEncontrado: false, guardando: false, subida: null, avisos: []}); }
function grpFotosCardHtml(){
  let cuerpo;
  if(GFOT.estado === "cargando" || GFOT.estado === "vacio") cuerpo = estadoCargandoHtml("Cargando las fotos del grupo…");
  else if(GFOT.estado === "error") cuerpo = estadoErrorHtml(GFOT.noEncontrado ? "No se encontraron las fotos de este grupo." : GFOT.error, GFOT.noEncontrado ? "" : `grpFotosCargar(${GFOT.grupoId})`);
  else cuerpo = `${fotosGridHtml(GFOT.filas, "grp", "grpDescargarFoto")}
    ${GFOT.total > GFOT.filas.length ? `<p class="hint">Se muestran las ${GFOT.filas.length} más recientes de ${GFOT.total}.</p>` : ""}
    <div class="org-reg-acciones"><button type="button" class="btn btn-ghost" id="btnGrpFoto" onclick="fotoAbrirCarga('grupo')">+ Cargar foto</button></div>`;
  return `<div class="cardhead"><h2 id="grpFotosTitulo" tabindex="-1">Fotos del grupo</h2><div class="cardhead-sp"></div>${GFOT.estado === "listo" ? `<span class="card-n">${GFOT.total}<span class="sr-only"> fotos</span></span>` : ""}</div>
    <div class="cardbody">${cuerpo}</div>`;
}
function grpFotosPintar(){
  const c = _docEl("grpFotosCard"); if(!c) return;
  const foco = document.activeElement && c.contains(document.activeElement) ? document.activeElement.id : null;
  c.innerHTML = grpFotosCardHtml();
  Object.entries(GFOT.urls).forEach(([fid, url]) => { const m = _docEl(`grpFotoImg_${fid}`); if(m) _ponerMiniatura(m, url); });
  if(foco){ const b = _docEl(foco); if(b) b.focus(); }
}
async function grpFotosCargar(grupoId, conservar){
  const g = typeof gruposDeId === "function" ? gruposDeId(grupoId) : null;
  if(GFOT.grupoId !== grupoId || !conservar){ grpFotosLiberar(); GFOT.estado = "cargando"; }
  GFOT.grupoId = grupoId; GFOT.nombre = g ? g.nombre : "";
  const mi = ++GFOT.seq;
  grpFotosPintar();                      // la tarjeta recién pintada está vacía: muestra el estado (o lo que ya había)
  try{
    const r = await apiFetch(`/grupos/${grupoId}/fotos`, {query: {limit: FOTOS_MAX}});
    if(mi !== GFOT.seq) return;
    GFOT.filas = r.data; GFOT.total = r.total === null ? r.data.length : r.total; GFOT.estado = "listo"; GFOT.noEncontrado = false;
  }catch(err){
    if(mi !== GFOT.seq) return;
    GFOT.estado = "error";
    GFOT.noEncontrado = err instanceof ApiError && err.status === 404;
    GFOT.error = err instanceof ApiError ? err.message : "No se pudieron cargar las fotos del grupo.";
  }
  grpFotosPintar();
  if(GFOT.estado !== "listo") return;
  for(const f of GFOT.filas){
    if(GFOT.urls[f.id]) continue;
    let url = null;
    try{ url = await _miniatura(`/grupos/${grupoId}/fotos/${f.id}/archivo`); }catch(_e){ url = null; }
    if(mi !== GFOT.seq){ if(url) URL.revokeObjectURL(url); return; }
    if(!url) continue;
    GFOT.urls[f.id] = url;
    const m = _docEl(`grpFotoImg_${f.id}`); if(m) _ponerMiniatura(m, url);
  }
}
function grpDescargarFoto(fotoId){ if(GFOT.grupoId !== null) _descargar(`/grupos/${GFOT.grupoId}/fotos/${fotoId}/archivo`, "foto"); }
