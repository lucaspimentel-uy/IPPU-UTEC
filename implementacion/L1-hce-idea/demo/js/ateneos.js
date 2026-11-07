/* Ateneos y jornadas de capacitación conectados (C6, handoff §5.158): la vista «Ateneos y capacitación» del menú y la tarjeta
   «Ateneos clínicos» de la pestaña «Datos» del expediente.
   Demo L1 HCE+IDEA - IPPU x UTEC-LIDIA.
     GET   /ateneos/opciones                        los 4 tipos (clave + etiqueta), los campos de cada bloque y las metas
     GET   /ateneos/indicador?anio=                 8 al año y 2 por grupo, contados por la FECHA (el servidor cuenta)
     GET   /ateneos?anio=&tipo=&grupo_id=&hce_referida_id=&q=&limit=&offset=   la lista (total en X-Total-Count)
     POST  /ateneos                                 el registro nace completo: tipo, fecha, título y los acuerdos juntados acá
     GET|PATCH /ateneos/{id}                        el detalle y su edición (el tipo se puede cambiar)
     POST  /ateneos/{id}/acuerdos · PATCH …/{aid}   un acuerdo después del alta / editar uno (no se borran)
     GET|POST /ateneos/{id}/documentos · GET …/{doc}/archivo   adjuntos (PDF, JPG, PNG o PPTX; las reglas de C5)
   Reglas, todas del servidor (esto es sólo presentación):
   - el código (AT-<año de registro>-<número>) lo asigna la API: el navegador nunca numera;
   - «Sensible» (sólo el clínico) sale de la respuesta y se marca con TEXTO; el tipo va en tinta, sin color;
   - el indicador lo cuenta la API (por la fecha; la jornada no suma): acá sólo se escribe «3 de 8»;
   - la forma según el tipo la decide la API (422 junto a cada campo): la pantalla sólo muestra el bloque del tipo elegido y no
     manda lo que está oculto; una jornada con acuerdos, un clínico sin NNA o un título en blanco los rechaza el servidor;
   - un clínico que la persona no puede abrir no aparece en la lista y su detalle es «no encontrado» (404 de la API);
   - sin borrar ateneos, acuerdos ni documentos: es un libro de actas (un acuerdo equivocado se edita).
   Los formularios van en el diálogo compartido (#modalFlujo): Esc/×/Cancelar con algo tipeado piden confirmación.
   Los scripts se cargan en orden en index.html: el orden ES la semantica. */
const AT = {
  sesion: 0, modo: "lista", pendiente: null, opciones: null, grupos: null, nnas: null,
  lista: {seq: 0, estado: "vacio", error: "", filas: [], total: 0, offset: 0, limit: 25},
  filtro: {anio: "", tipo: "", grupo_id: "", q: ""}, timerQ: null,
  ind: {seq: 0, estado: "vacio", datos: null, error: ""},
  det: {seq: 0, id: null, estado: "vacio", datos: null, docs: {filas: [], total: 0}, error: "", noEncontrado: false},
  avisos: [], guardando: false, borrador: []
};
const _atEl = (id) => document.getElementById(id);
/* Controles del formulario del registro y su rótulo (también para ubicar el `campo` de un 422). */
const AT_CAMPOS = {
  tipo: ["atf_tipo", "Tipo"], fecha: ["atf_fecha", "Fecha"], titulo: ["atf_titulo", "Título o tema"],
  hce_referida_id: ["atf_nna", "NNA referido"], grupo_id: ["atf_grupo", "Grupo"], participantes: ["atf_participantes", "Participantes (roles)"],
  situacion: ["atf_situacion", "Situación presentada"], hipotesis: ["atf_hipotesis", "Hipótesis clínica"], recursos: ["atf_recursos", "Registro de recursos"],
  seguimiento: ["atf_seguimiento", "Seguimiento previsto"], capacitador: ["atf_capacitador", "Capacitador/a"], modalidad: ["atf_modalidad", "Modalidad"],
  contenidos: ["atf_contenidos", "Contenidos"], materiales: ["atf_materiales", "Materiales"], evaluacion: ["atf_evaluacion", "Evaluación de la jornada"],
  observaciones: ["atf_observaciones", "Observaciones"], acuerdos: ["atf_acuerdos", "Acuerdos"]
};
const AT_BLOQUE_CLINICO = ["situacion", "hipotesis", "recursos", "seguimiento"];
const AT_BLOQUE_JORNADA = ["capacitador", "modalidad", "contenidos", "materiales", "evaluacion"];
const AT_TEXTOS = ["participantes", ...AT_BLOQUE_CLINICO, ...AT_BLOQUE_JORNADA, "observaciones"];
const AT_AC_CAMPOS = {acuerdo: ["acf_acuerdo", "Acuerdo"], responsable_rol: ["acf_rol", "Responsable (rol)"], plazo: ["acf_plazo", "Plazo"]};
const AT_DOC_CAMPOS = {archivo: ["atdf_archivo", "Archivo"], categoria_id: ["atdf_categoria", "Categoría"], nombre: ["atdf_nombre", "Nombre"],
  fecha_original: ["atdf_fecha", "Fecha original"]};
const AT_SENSIBLE_TXT = "Sensible";
const AT_POR_PAGINA = 25;

/* ---------- Sesión ---------- */
function atOlvidarSesion(){
  AT.sesion++; AT.lista.seq++; AT.ind.seq++; AT.det.seq++;
  clearTimeout(AT.timerQ);
  Object.assign(AT, {modo: "lista", pendiente: null, opciones: null, grupos: null, nnas: null, avisos: [], guardando: false, borrador: []});
  Object.assign(AT.lista, {estado: "vacio", error: "", filas: [], total: 0, offset: 0});
  Object.assign(AT.filtro, {anio: "", tipo: "", grupo_id: "", q: ""});
  Object.assign(AT.ind, {estado: "vacio", datos: null, error: ""});
  Object.assign(AT.det, {id: null, estado: "vacio", datos: null, docs: {filas: [], total: 0}, error: "", noEncontrado: false});
  const c = _atEl("ateneosContent"); if(c) c.innerHTML = "";
  atExpOlvidar();
}

async function atTraerOpciones(){
  if(AT.opciones) return AT.opciones;
  const r = await apiFetch("/ateneos/opciones");
  AT.opciones = r.data;
  return AT.opciones;
}
function atTipoLabel(clave){ const t = ((AT.opciones || {}).tipos || []).find(x => x.clave === clave); return t ? t.label : clave; }
/* Años que ofrece el filtro: el actual y los anteriores (sólo para elegir; el filtro lo aplica la API por la fecha). */
function atAnios(){ const y = new Date().getFullYear(); return [y, y - 1, y - 2, y - 3]; }
/* Los grupos del año en curso y del anterior (GET /grupos por año), para el filtro y el formulario. */
async function atTraerGrupos(){
  if(AT.grupos) return AT.grupos;
  const y = new Date().getFullYear();
  const [a, b] = await Promise.all([apiFetch("/grupos", {query: {anio: y}}), apiFetch("/grupos", {query: {anio: y - 1}})]);
  AT.grupos = [...a.data, ...b.data].map(g => ({id: g.id, nombre: g.nombre, anio: g.anio}));
  return AT.grupos;
}
function atGrupoTxt(g){ return g ? `${g.nombre} ${g.anio}` : "—"; }
function atNnaTxt(n){ return n ? `${n.nombre} ${n.apellido}`.trim() : "—"; }
function _atV(v){ return v === null || v === undefined || v === "" ? "—" : escHtml(v); }

/* ===================== VISTA: LISTA ===================== */
function atAlAbrir(){
  if(AT.pendiente !== null){ const id = AT.pendiente; AT.pendiente = null; atAbrir(id); return; }
  AT.modo = "lista"; AT.lista.offset = 0;
  atPintarLista();
  atCargarLista();
  atCargarIndicador();
}
async function atCargarLista(){
  const mi = ++AT.lista.seq, ses = AT.sesion;
  AT.lista.estado = "cargando";
  atPintarFilas();
  const f = AT.filtro;
  try{
    const [r] = await Promise.all([
      apiFetch("/ateneos", {query: {anio: f.anio || null, tipo: f.tipo || null, grupo_id: f.grupo_id || null, q: f.q.trim() ? f.q : null,
        limit: AT.lista.limit, offset: AT.lista.offset}}),
      atTraerOpciones()]);
    if(mi !== AT.lista.seq || ses !== AT.sesion) return;     // una respuesta vieja (o de antes de «Salir») se descarta
    AT.lista.filas = r.data;
    AT.lista.total = r.total === null ? r.data.length : r.total;
    AT.lista.estado = "listo";
  }catch(err){
    if(mi !== AT.lista.seq || ses !== AT.sesion) return;
    AT.lista.estado = "error";
    AT.lista.error = err instanceof ApiError ? err.message : "No se pudo cargar la lista de ateneos.";
  }
  if(AT.modo === "lista") atPintarFilas();
}
async function atCargarIndicador(){
  const mi = ++AT.ind.seq, ses = AT.sesion;
  AT.ind.estado = "cargando";
  atPintarIndicador();
  try{
    const [r] = await Promise.all([apiFetch("/ateneos/indicador", {query: {anio: AT.filtro.anio || null}}), atTraerOpciones()]);
    if(mi !== AT.ind.seq || ses !== AT.sesion) return;
    AT.ind.datos = r.data; AT.ind.estado = "listo";
  }catch(err){
    if(mi !== AT.ind.seq || ses !== AT.sesion) return;
    AT.ind.estado = "error"; AT.ind.error = err instanceof ApiError ? err.message : "No se pudo cargar el indicador.";
  }
  if(AT.modo === "lista") atPintarIndicador();
}
/* Los grupos del filtro llegan aparte: el selector se completa cuando están (sin repintar lo demás). */
async function atCargarGruposFiltro(){
  const ses = AT.sesion;
  try{ await atTraerGrupos(); }catch(_e){ return; }
  if(ses !== AT.sesion || AT.modo !== "lista") return;
  const s = _atEl("atFiltroGrupo"); if(!s) return;
  const actual = AT.filtro.grupo_id;
  s.innerHTML = `<option value="">Todos</option>${(AT.grupos || []).map(g => `<option value="${g.id}"${String(g.id) === String(actual) ? " selected" : ""}>${escHtml(atGrupoTxt(g))}</option>`).join("")}`;
}

function atIndicadorHtml(){
  const cab = `<h3 id="atIndTitulo">Indicador institucional</h3>`;
  const i = AT.ind;
  if(i.estado === "cargando" || i.estado === "vacio") return `${cab}<div class="ib">${estadoCargandoHtml("Cargando el indicador…")}</div>`;
  if(i.estado === "error") return `${cab}<div class="ib">${estadoErrorHtml(i.error, "atCargarIndicador()")}</div>`;
  const d = i.datos;
  const tipos = (d.tipos_contados || []).map(atTipoLabel);
  const grupos = d.grupos.length
    ? `<ul class="at-ind-grupos" id="atIndGrupos" aria-label="Por grupo, ${escHtml(d.anio)}">${d.grupos.map(g =>
        `<li data-grupo="${g.id}">${escHtml(g.nombre)}: ${escHtml(g.cantidad)} de ${escHtml(d.meta_por_grupo)}</li>`).join("")}</ul>`
    : `<p class="hint" id="atIndGrupos">No hay grupos registrados para ${escHtml(d.anio)}.</p>`;
  return `${cab}<div class="ib">
      <p class="at-ind-total" id="atIndTotal"><b>${escHtml(d.anio)}: ${escHtml(d.total)} de ${escHtml(d.meta_total)} ateneos</b></p>
      ${grupos}
      <p class="hint at-ind-nota">Meta: ${escHtml(d.meta_total)} al año y al menos ${escHtml(d.meta_por_grupo)} por grupo, contados por la fecha del ateneo. Suman: ${escHtml(tipos.join(" · "))}. La jornada de capacitación no suma.</p>
    </div>`;
}
function atPintarIndicador(){ const el = _atEl("atIndicador"); if(el) el.innerHTML = atIndicadorHtml(); }

function atFilaHtml(f){
  const ref = f.nna
    ? `${escHtml(atNnaTxt(f.nna))}<span class="nna-sub">${f.nna.hc_historico !== null ? `HC <span class="cod">${escHtml(f.nna.hc_historico)}</span>` : ""}${f.grupo ? `${f.nna.hc_historico !== null ? " · " : ""}${escHtml(atGrupoTxt(f.grupo))}` : ""}</span>`
    : f.grupo ? escHtml(atGrupoTxt(f.grupo)) : `<span class="hint">—</span>`;
  const sensible = f.sensible ? ` <span class="at-sensible">${AT_SENSIBLE_TXT}</span>` : "";
  return `<tr data-ateneo="${f.id}"${f.sensible ? ` data-sensible="true"` : ""} onclick="atFilaClic(event, ${f.id})">
    <td class="num"><span class="cod at-codigo">${escHtml(f.codigo)}</span></td>
    <td class="num">${escHtml(fmtFecha(f.fecha))}</td>
    <td class="at-tipo">${escHtml(f.tipo_label)}${sensible}</td>
    <td class="at-titulo"><button type="button" class="nna-abrir" onclick="atAbrir(${f.id})">${escHtml(f.titulo)}</button></td>
    <td>${ref}</td>
    <td class="num">${escHtml(f.acuerdos)}</td>
    <td class="col-ir" aria-hidden="true">›</td>
  </tr>`;
}
function atFilaClic(ev, id){
  if(ev.target.closest("button, a, input, select, textarea")) return;
  atAbrir(id);
}
function atPintarFilas(){
  const tb = _atEl("atTbody"), pie = _atEl("atResumen"); if(!tb) return;
  const L = AT.lista;
  if(L.estado === "cargando" || L.estado === "vacio") tb.innerHTML = `<tr><td colspan="7">${estadoCargandoHtml("Cargando los ateneos…")}</td></tr>`;
  else if(L.estado === "error") tb.innerHTML = `<tr><td colspan="7">${estadoErrorHtml(L.error, "atCargarLista()")}</td></tr>`;
  else{
    const filtrado = AT.filtro.anio || AT.filtro.tipo || AT.filtro.grupo_id || AT.filtro.q.trim();
    tb.innerHTML = L.filas.length ? L.filas.map(atFilaHtml).join("")
      : `<tr><td colspan="7">${estadoVacioHtml("◌", filtrado ? "Ningún registro cumple el filtro." : "Todavía no hay ateneos ni jornadas registrados.")}</td></tr>`;
  }
  const listo = L.estado === "listo";
  if(pie){
    const paginas = Math.max(1, Math.ceil(L.total / L.limit)), pag = Math.floor(L.offset / L.limit) + 1;
    pie.textContent = listo ? `Mostrando ${L.filas.length} de ${L.total} · página ${pag} de ${paginas}` : "";
  }
  const p = _atEl("atPagPrev"), n = _atEl("atPagNext");
  if(p) p.disabled = !(listo && L.offset > 0);
  if(n) n.disabled = !(listo && L.offset + L.limit < L.total);
}
function atPintarLista(){
  const cont = _atEl("ateneosContent"); if(!cont) return;
  const F = AT.filtro;
  const tipos = ((AT.opciones || {}).tipos || []);
  const optTipos = `<option value="">Todos</option>${tipos.map(t => `<option value="${escHtml(t.clave)}"${t.clave === F.tipo ? " selected" : ""}>${escHtml(t.label)}</option>`).join("")}`;
  const optAnios = `<option value="">Todos</option>${atAnios().map(a => `<option value="${a}"${String(a) === F.anio ? " selected" : ""}>${a}</option>`).join("")}`;
  const optGrupos = `<option value="">Todos</option>${(AT.grupos || []).map(g => `<option value="${g.id}"${String(g.id) === F.grupo_id ? " selected" : ""}>${escHtml(atGrupoTxt(g))}</option>`).join("")}`;
  cont.innerHTML = `
    <section class="info-card at-indicador" id="atIndicador" aria-labelledby="atIndTitulo">${atIndicadorHtml()}</section>
    <div id="atAvisos" class="review-note avisos-api" role="status"${AT.avisos.length ? "" : " hidden"}>${atAvisosHtml()}</div>
    <div class="card">
      <div class="cardhead"><h2 id="atListaTitulo" tabindex="-1">Registros de ateneos y jornadas</h2><div class="cardhead-sp"></div>
        <button type="button" class="btn btn-primary" id="btnAtNuevo" onclick="atAbrirNuevo()">+ Nuevo registro</button></div>
      <div class="nna-toolbar at-filtros" role="search" aria-label="Filtrar ateneos">
        <div class="filtro-grupo"><label for="atFiltroAnio">Año</label><select id="atFiltroAnio" onchange="atFiltrar('anio', this.value)">${optAnios}</select></div>
        <div class="filtro-grupo"><label for="atFiltroTipo">Tipo</label><select id="atFiltroTipo" onchange="atFiltrar('tipo', this.value)">${optTipos}</select></div>
        <div class="filtro-grupo"><label for="atFiltroGrupo">Grupo</label><select id="atFiltroGrupo" onchange="atFiltrar('grupo_id', this.value)">${optGrupos}</select></div>
        <div class="filtro-grupo at-buscar"><label for="atBuscar">Buscar</label><input id="atBuscar" type="search" value="${escHtml(F.q)}" autocomplete="off"
          aria-describedby="atBuscarHint" oninput="atBuscarTecla(this.value)"><span class="sr-only" id="atBuscarHint">Busca en el título, la situación y los contenidos.</span></div>
      </div>
      <div class="tabla-scroll">
        <table class="lista at-lista" id="tablaAteneos">
          <caption class="sr-only">Ateneos y jornadas de capacitación, el más reciente primero</caption>
          <thead><tr><th scope="col">Código</th><th scope="col">Fecha</th><th scope="col">Tipo</th><th scope="col">Título o tema</th>
            <th scope="col">Grupo o NNA</th><th scope="col">Acuerdos</th><th scope="col" class="col-ir"><span class="sr-only">Abrir</span></th></tr></thead>
          <tbody id="atTbody"></tbody>
        </table>
      </div>
      <div class="lista-pie">
        <span id="atResumen" role="status" aria-live="polite"></span><span class="spacer"></span>
        <button type="button" class="btn btn-ghost btn-mini" id="atPagPrev" onclick="atPagina(-1)" disabled>‹ Anterior</button>
        <button type="button" class="btn btn-ghost btn-mini" id="atPagNext" onclick="atPagina(1)" disabled>Siguiente ›</button>
      </div>
    </div>
    <p class="hint at-nota" id="atNota">Los ateneos clínicos son datos sensibles de salud: los ve quien puede abrir el expediente del NNA. Los de grupo, los institucionales y las jornadas son de acceso general del equipo.</p>`;
  atPintarFilas();
  if(!AT.grupos) atCargarGruposFiltro();
  if(!AT.opciones) atTraerOpciones().then(() => { if(AT.modo !== "lista") return; const s = _atEl("atFiltroTipo"); if(s) s.innerHTML = `<option value="">Todos</option>${AT.opciones.tipos.map(t => `<option value="${escHtml(t.clave)}"${t.clave === AT.filtro.tipo ? " selected" : ""}>${escHtml(t.label)}</option>`).join("")}`; }).catch(() => {});
}
function atAvisosHtml(){
  if(!AT.avisos.length) return "";
  return `${avisosCuerpoHtml(AT.avisos)}<button type="button" class="btn btn-ghost btn-mini" onclick="atCerrarAvisos()">Entendido</button>`;
}
function atCerrarAvisos(){ AT.avisos = []; const el = _atEl("atAvisos"); if(el){ el.innerHTML = ""; el.hidden = true; } }
function atFiltrar(campo, valor){
  AT.filtro[campo] = valor; AT.lista.offset = 0;
  atCargarLista();
  if(campo === "anio") atCargarIndicador();
}
function atBuscarTecla(valor){
  AT.filtro.q = valor;
  clearTimeout(AT.timerQ);
  AT.timerQ = setTimeout(() => { AT.lista.offset = 0; atCargarLista(); }, 350);
}
function atPagina(dir){
  const L = AT.lista, nuevo = L.offset + dir * L.limit;
  if(nuevo < 0 || nuevo >= Math.max(L.total, 1)) return;
  L.offset = nuevo;
  const foco = dir < 0 ? "atPagPrev" : "atPagNext";
  atCargarLista().then(() => {
    const b = _atEl(foco), o = _atEl(foco === "atPagPrev" ? "atPagNext" : "atPagPrev"), t = _atEl("atListaTitulo");
    if(b && !b.disabled) b.focus(); else if(o && !o.disabled) o.focus(); else if(t) t.focus();
  });
}

/* ===================== VISTA: DETALLE ===================== */
/* `avisos`: los warnings[] de la escritura que lo abre (el alta). */
async function atAbrir(id, avisos){
  AT.modo = "detalle";
  const mi = ++AT.det.seq, ses = AT.sesion;
  AT.avisos = avisos || [];
  Object.assign(AT.det, {id, estado: "cargando", datos: null, docs: {filas: [], total: 0}, error: "", noEncontrado: false});
  atPintarDetalle();
  const t0 = _atEl("atDetTitulo"); if(t0) t0.focus();
  await atCargarDetalle(mi, ses);
  const t = _atEl("atDetTitulo"); if(t) t.focus();
}
async function atCargarDetalle(mi, ses){
  const id = AT.det.id;
  const pedidos = await Promise.allSettled([apiFetch(`/ateneos/${id}`), apiFetch(`/ateneos/${id}/documentos`, {query: {limit: 50}}), atTraerOpciones()]);
  if(mi !== AT.det.seq || ses !== AT.sesion) return;
  const [rd, rdoc] = pedidos;
  const fallo = pedidos.find(p => p.status === "rejected");
  if(fallo){
    AT.det.estado = "error";
    AT.det.noEncontrado = fallo.reason instanceof ApiError && fallo.reason.status === 404;
    AT.det.error = fallo.reason instanceof ApiError ? fallo.reason.message : "No se pudo cargar el registro.";
  }else{
    AT.det.datos = rd.value.data;
    AT.det.docs = {filas: rdoc.value.data, total: rdoc.value.total === null ? rdoc.value.data.length : rdoc.value.total};
    AT.det.estado = "listo";
  }
  if(AT.modo === "detalle") atPintarDetalle();
}
function atRecargarDetalle(){ const mi = ++AT.det.seq; return atCargarDetalle(mi, AT.sesion); }
function atReintentarDetalle(){ atAbrir(AT.det.id); }
function atVolverLista(){
  AT.modo = "lista"; AT.det.seq++;
  atPintarLista();
  atCargarLista();
  atCargarIndicador();
  const t = _atEl("atListaTitulo"); if(t) t.focus();
}
function _atFila(rot, html, id){ return `<div class="data-row"><dt>${rot}</dt><dd${id ? ` id="${id}"` : ""}>${html}</dd></div>`; }
function _atTexto(rot, v, id){ return `<section class="at-bloque-txt" aria-labelledby="${id}_r"><h4 id="${id}_r">${rot}</h4><p class="inc-texto" id="${id}">${v ? escHtml(v) : "—"}</p></section>`; }
function atAcuerdosHtml(d){
  const jornada = d.tipo === "jornada";
  const filas = d.acuerdos.length
    ? `<div class="tabla-scroll"><table class="comp-table at-acuerdos" id="atAcuerdosTabla"><caption class="sr-only">Acuerdos del ateneo, en el orden del acta</caption>
        <thead><tr><th scope="col">Acuerdo</th><th scope="col">Responsable (rol)</th><th scope="col">Plazo</th><th scope="col"><span class="sr-only">Acciones</span></th></tr></thead>
        <tbody>${d.acuerdos.map((a, i) => `<tr data-acuerdo="${a.id}"><td class="inc-texto">${escHtml(a.acuerdo)}</td><td>${_atV(a.responsable_rol)}</td>
          <td class="num">${a.plazo ? escHtml(fmtFecha(a.plazo)) : "—"}</td>
          <td><button type="button" class="btn btn-ghost btn-mini" id="btnAcEditar_${a.id}" onclick="atAbrirAcuerdo(${a.id})">✎ Editar<span class="sr-only"> el acuerdo ${i + 1}</span></button></td></tr>`).join("")}</tbody></table></div>`
    : `<div id="atAcuerdosVacio">${estadoVacioHtml("◌", jornada ? "Una jornada de capacitación no lleva acuerdos." : "Sin acuerdos registrados.")}</div>`;
  const accion = jornada ? "" : `<div class="org-reg-acciones"><button type="button" class="btn btn-ghost" id="btnAcAgregar" onclick="atAbrirAcuerdo(null)">+ Agregar acuerdo</button></div>`;
  return `<div class="info-card" id="atAcuerdosCard"><h3 id="atAcuerdosTitulo" tabindex="-1">Acuerdos
      <span class="org-total" id="atAcuerdosTotal">${d.acuerdos.length}</span><span class="sr-only"> registrados</span></h3><div class="ib">${filas}${accion}</div></div>`;
}
function atDocsHtml(){
  const D = AT.det.docs;
  const tabla = D.filas.length
    ? `<div class="tabla-scroll"><table class="comp-table doc-tabla" id="atDocTabla"><caption class="sr-only">Documentos del ateneo, el de carga más reciente primero</caption>
        <thead><tr><th scope="col">Documento</th><th scope="col">Categoría</th><th scope="col" class="num">Fecha original</th><th scope="col" class="num">Cargado</th>
          <th scope="col" class="num">Tipo y tamaño</th><th scope="col"><span class="sr-only">Acciones</span></th></tr></thead>
        <tbody>${D.filas.map(x => { const n = escHtml(x.nombre); return `<tr data-doc="${x.id}"><td class="doc-nombre"><span class="doc-nombre-txt">${n}</span></td>
          <td>${escHtml(x.categoria.nombre)}</td><td class="num">${x.fecha_original ? escHtml(fmtFecha(x.fecha_original)) : "—"}</td>
          <td class="num">${escHtml(fmtFecha(x.fecha_carga))}</td><td class="num"><span class="doc-tipo">${escHtml(x.tipo ? (TIPO_TXT[x.tipo] || x.tipo) : "—")}</span> · ${escHtml(fmtTamano(x.tamano_bytes))}</td>
          <td class="doc-acciones">${x.tiene_archivo ? `<button type="button" class="btn btn-ghost btn-mini" id="btnAtDocBajar_${x.id}" onclick="atDescargarDoc(${x.id})">Descargar<span class="sr-only"> ${n}</span></button>` : `<span class="hint">Sin archivo</span>`}</td></tr>`; }).join("")}</tbody></table></div>`
    : `<div id="atDocVacio">${estadoVacioHtml("◌", "Todavía no se adjuntó ningún documento.")}</div>`;
  return `<div class="info-card" id="atDocsCard"><h3 id="atDocsTitulo" tabindex="-1">Documentos
      <span class="org-total" id="atDocTotal">${D.total}</span><span class="sr-only"> adjuntos</span></h3>
    <div class="ib"><p class="hint doc-nota">PDF, JPG, PNG o presentaciones PPTX (sin macros) de hasta 10 MB.</p>${tabla}
      <div class="org-reg-acciones"><button type="button" class="btn btn-ghost" id="btnAtDocCargar" onclick="atAbrirDocumento()">+ Adjuntar documento</button></div></div></div>`;
}
function atDetalleHtml(){
  const D = AT.det;
  const miga = `<nav class="crumbs at-miga" aria-label="Ubicación"><button type="button" class="btn-link at-volver" id="btnAtVolver" onclick="atVolverLista()">‹ Ateneos y capacitación</button>${D.datos ? ` › <b class="cod">${escHtml(D.datos.codigo)}</b>` : ""}</nav>`;
  if(D.estado === "cargando") return `${miga}<h2 id="atDetTitulo" tabindex="-1" class="at-det-titulo">Registro</h2><div class="card"><div class="cardbody">${estadoCargandoHtml("Cargando el registro…")}</div></div>`;
  if(D.estado === "error") return `${miga}<h2 id="atDetTitulo" tabindex="-1" class="at-det-titulo">Registro</h2><div class="card"><div class="cardbody">${
    estadoErrorHtml(D.noEncontrado ? "No se encontró el registro." : D.error, D.noEncontrado ? "" : "atReintentarDetalle()",
      `<button type="button" class="btn btn-ghost btn-mini" onclick="atVolverLista()">‹ Volver a la lista</button>`)}</div></div>`;
  const d = D.datos, jornada = d.tipo === "jornada";
  const sensible = d.sensible ? ` · <span class="at-sensible" id="atDetSensible">${AT_SENSIBLE_TXT}</span>` : "";
  const bloque = jornada
    ? `<div class="info-card" id="atBloque"><h3>Jornada de capacitación</h3><dl class="ib">
        ${_atFila("Capacitador/a", _atV(d.capacitador), "atCapacitador")}${_atFila("Modalidad", _atV(d.modalidad), "atModalidad")}</dl>
        <div class="ib at-textos">${_atTexto("Contenidos desarrollados", d.contenidos, "atContenidos")}${_atTexto("Materiales", d.materiales, "atMateriales")}
        ${_atTexto("Evaluación de la jornada", d.evaluacion, "atEvaluacion")}</div></div>`
    : `<div class="info-card" id="atBloque"><h3>Desarrollo del ateneo</h3>
        <div class="ib at-textos">${_atTexto("Situación presentada", d.situacion, "atSituacion")}${_atTexto("Hipótesis clínica", d.hipotesis, "atHipotesis")}
        ${_atTexto("Registro de recursos", d.recursos, "atRecursos")}${_atTexto("Seguimiento previsto", d.seguimiento, "atSeguimiento")}</div></div>`;
  const nna = d.nna ? `${escHtml(atNnaTxt(d.nna))}${d.nna.hc_historico !== null ? ` · HC <span class="cod">${escHtml(d.nna.hc_historico)}</span>` : ""}` : "—";
  return `${miga}
    <div class="at-det-cab">
      <div><h2 id="atDetTitulo" tabindex="-1" class="at-det-titulo">${escHtml(d.titulo)}</h2>
        <p class="pagedesc at-det-meta" id="atDetMeta"><span class="cod">${escHtml(d.codigo)}</span> · <span id="atDetTipo">${escHtml(d.tipo_label)}</span> · ${escHtml(fmtFecha(d.fecha))}${sensible}</p></div>
      <div class="cardhead-sp"></div>
      <button type="button" class="btn btn-ghost" id="btnAtEditar" onclick="atAbrirEditar()">✎ Editar<span class="sr-only"> el registro</span></button>
    </div>
    <div id="atAvisos" class="review-note avisos-api" role="status"${AT.avisos.length ? "" : " hidden"}>${atAvisosHtml()}</div>
    <div class="info-card" id="atGenerales"><h3>Datos generales</h3><dl class="ib">
      ${_atFila("Tipo", escHtml(d.tipo_label), "atGenTipo")}${_atFila("Fecha", escHtml(fmtFecha(d.fecha)), "atGenFecha")}
      ${d.tipo === "clinico" ? _atFila("NNA referido", nna, "atGenNna") : ""}
      ${d.tipo === "clinico" || d.tipo === "grupo" ? _atFila("Grupo", escHtml(atGrupoTxt(d.grupo)), "atGenGrupo") : ""}
      ${_atFila("Participantes (roles)", _atV(d.participantes), "atGenParticipantes")}
      ${_atFila("Registrado por", d.autor ? escHtml(d.autor.nombre) : "—", "atGenAutor")}
      ${_atFila("Código", `<span class="cod">${escHtml(d.codigo)}</span> <span class="hint">(año de registro)</span>`, "atGenCodigo")}</dl></div>
    ${bloque}
    <div class="info-card" id="atObsCard"><h3>Observaciones</h3><div class="ib"><p class="inc-texto" id="atObservaciones">${d.observaciones ? escHtml(d.observaciones) : "—"}</p></div></div>
    ${atAcuerdosHtml(d)}
    ${atDocsHtml()}`;
}
function atPintarDetalle(){
  const cont = _atEl("ateneosContent"); if(!cont || AT.modo !== "detalle") return;
  const foco = document.activeElement && cont.contains(document.activeElement) ? document.activeElement.id : null;
  cont.innerHTML = atDetalleHtml();
  if(foco){ const b = _atEl(foco); if(b) b.focus(); }
}

/* ===================== FORMULARIO DEL REGISTRO (nuevo y edición) ===================== */
const _AT_REQ = `<span class="req" aria-hidden="true">*</span><span class="sr-only">(obligatorio)</span>`;
function _atCampoTxt(campo, valor, opts){
  const [id, rot] = AT_CAMPOS[campo], o = opts || {};
  const ctl = o.area
    ? `<textarea id="${id}" aria-describedby="${o.hint ? `hint_${id} ` : ""}err_${id}" class="ta-${o.alto || 70}">${escHtml(valor || "")}</textarea>`
    : `<input id="${id}" type="${o.tipo || "text"}" value="${escHtml(valor || "")}" autocomplete="off"${o.req ? ` aria-required="true"` : ""} aria-describedby="${o.hint ? `hint_${id} ` : ""}err_${id}">`;
  return `<div class="field"${o.wrap ? ` id="${o.wrap}"` : ""}><label for="${id}">${rot}${o.req ? " " + _AT_REQ : ""}</label>${ctl}${o.hint ? `<div class="hint" id="hint_${id}">${o.hint}</div>` : ""}<div class="err" id="err_${id}"></div></div>`;
}
function _atSel(campo, opciones, actual, vacio, opts){
  const [id, rot] = AT_CAMPOS[campo], o = opts || {};
  return `<div class="field"${o.wrap ? ` id="${o.wrap}"` : ""}><label for="${id}">${rot}${o.req ? " " + _AT_REQ : ""}</label>
    <select id="${id}"${o.req ? ` aria-required="true"` : ""} aria-describedby="${o.hint ? `hint_${id} ` : ""}err_${id}"${o.onchange ? ` onchange="${o.onchange}"` : ""}>${vacio !== null ? `<option value="">${vacio}</option>` : ""}${opciones.map(([v, t]) =>
      `<option value="${escHtml(v)}"${String(v) === String(actual) ? " selected" : ""}>${escHtml(t)}</option>`).join("")}</select>
    ${o.hint ? `<div class="hint" id="hint_${id}">${o.hint}</div>` : ""}<div class="err" id="err_${id}"></div></div>`;
}
/* Los NNA que la persona ve (GET /hce, su alcance) para el ateneo clínico. */
async function atTraerNnas(){
  if(AT.nnas) return AT.nnas;
  const r = await apiFetch("/hce", {query: {limit: 200}});
  AT.nnas = r.data.map(h => ({id: h.id, nombre: h.persona.nombre, apellido: h.persona.apellido, hc: h.hc_historico, grupo_id: h.grupo ? h.grupo.id : null}));
  return AT.nnas;
}
function _atFormHtml(d, crear){
  const o = AT.opciones || {tipos: []};
  const tipos = o.tipos.map(t => [t.clave, t.label]);
  const nnas = (AT.nnas || []).map(n => [n.id, `${n.nombre} ${n.apellido}`.trim() + (n.hc !== null ? ` · HC ${n.hc}` : "")]);
  if(d.nna && !nnas.some(([v]) => v === d.nna.hce_id)) nnas.push([d.nna.hce_id, `${atNnaTxt(d.nna)}${d.nna.hc_historico !== null ? ` · HC ${d.nna.hc_historico}` : ""}`]);
  const grupos = (AT.grupos || []).map(g => [g.id, atGrupoTxt(g)]);
  if(d.grupo && !grupos.some(([v]) => v === d.grupo.id)) grupos.push([d.grupo.id, atGrupoTxt(d.grupo)]);
  const acuerdos = crear ? `<fieldset class="inc-fs at-fs" id="atfAcuerdosFs"><legend>Acuerdos</legend>
      <div class="field at-acuerdos-campo"><p class="hint" id="atf_acuerdos" tabindex="-1" aria-describedby="err_atf_acuerdos">Se guardan con el registro. Una jornada de capacitación no lleva acuerdos.</p><div class="err" id="err_atf_acuerdos"></div></div>
      <div id="atfAcuerdosFilas" class="at-ac-filas"></div>
      <button type="button" class="btn btn-ghost btn-mini" id="btnAtfAcAgregar" onclick="atBorradorAgregar()">+ Agregar acuerdo</button></fieldset>` : "";
  return `<div id="atErrores" class="form-errores" role="alert" tabindex="-1" hidden></div>
    <p class="hint hint-intro">${crear ? "El código del registro lo asigna el sistema al guardar." : "Dejar un dato vacío lo borra. Si cambiás el tipo, lo que no corresponde al tipo nuevo se quita."}</p>
    <fieldset class="inc-fs at-fs"><legend>Datos generales</legend>
      ${_atSel("tipo", tipos, d.tipo || "", crear ? "— elegir tipo —" : null, {req: true, onchange: "atFormTipo()"})}
      ${_atCampoTxt("fecha", d.fecha, {tipo: "date", req: true})}
      ${_atCampoTxt("titulo", d.titulo, {req: true})}
      ${_atSel("hce_referida_id", nnas, d.hce_referida_id || "", "— elegir NNA —", {req: true, wrap: "atfNnaCampo", onchange: "atFormNna()",
        hint: "Los NNA de los grupos que podés ver. El ateneo clínico es un dato sensible: lo ve quien puede abrir su expediente."})}
      ${_atSel("grupo_id", grupos, d.grupo_id || "", "— sin grupo —", {wrap: "atfGrupoCampo", hint: `<span id="atfGrupoHint"></span>`})}
      ${_atCampoTxt("participantes", d.participantes, {hint: "Se consignan roles, no nombres, salvo firma de acuerdos."})}</fieldset>
    <fieldset class="inc-fs at-fs" id="atfBloqueClinico"><legend>Desarrollo del ateneo</legend>
      ${AT_BLOQUE_CLINICO.map(c => _atCampoTxt(c, d[c], {area: true})).join("")}</fieldset>
    <fieldset class="inc-fs at-fs" id="atfBloqueJornada"><legend>Jornada de capacitación</legend>
      ${_atCampoTxt("capacitador", d.capacitador)}${_atCampoTxt("modalidad", d.modalidad, {hint: "Presencial, virtual o mixta; lugar."})}
      ${["contenidos", "materiales", "evaluacion"].map(c => _atCampoTxt(c, d[c], {area: true})).join("")}</fieldset>
    ${_atCampoTxt("observaciones", d.observaciones, {area: true})}
    ${acuerdos}`;
}
/* Muestra sólo el bloque del tipo elegido (y el NNA y el grupo donde corresponden). Lo oculto no se manda. */
function atFormTipo(){
  const tipo = (_atEl("atf_tipo") || {}).value || "";
  const jornada = tipo === "jornada", clinico = tipo === "clinico", grupo = tipo === "grupo";
  const set = (id, ver) => { const el = _atEl(id); if(el) el.hidden = !ver; };
  set("atfBloqueClinico", tipo !== "" && !jornada);
  set("atfBloqueJornada", jornada);
  set("atfNnaCampo", clinico);
  set("atfGrupoCampo", clinico || grupo);
  const h = _atEl("atfGrupoHint");
  if(h) h.textContent = clinico ? "Opcional: el grupo de contexto del ateneo." : grupo ? "Obligatorio en un ateneo de grupo." : "";
}
/* Al elegir el NNA, si el grupo está vacío se propone el grupo actual de su expediente (se puede cambiar). */
function atFormNna(){
  const s = _atEl("atf_nna"), g = _atEl("atf_grupo"); if(!s || !g || g.value) return;
  const n = (AT.nnas || []).find(x => String(x.id) === s.value);
  if(n && n.grupo_id && [...g.options].some(o => o.value === String(n.grupo_id))) g.value = String(n.grupo_id);
}
function _atBorradorSync(){
  AT.borrador = AT.borrador.map((_a, i) => ({
    acuerdo: (_atEl(`atf_ac_${i}_acuerdo`) || {}).value || "", responsable_rol: (_atEl(`atf_ac_${i}_responsable_rol`) || {}).value || "",
    plazo: (_atEl(`atf_ac_${i}_plazo`) || {}).value || ""}));
}
function _atBorradorHtml(){
  if(!AT.borrador.length) return `<p class="hint" id="atfAcVacio">Sin acuerdos todavía.</p>`;
  return AT.borrador.map((a, i) => `<div class="at-ac-fila" data-fila="${i}" role="group" aria-label="Acuerdo ${i + 1}">
      <div class="field"><label for="atf_ac_${i}_acuerdo">Acuerdo ${i + 1} ${_AT_REQ}</label><textarea id="atf_ac_${i}_acuerdo" aria-required="true" aria-describedby="err_atf_ac_${i}_acuerdo" class="ta-48">${escHtml(a.acuerdo)}</textarea><div class="err" id="err_atf_ac_${i}_acuerdo"></div></div>
      <div class="field"><label for="atf_ac_${i}_responsable_rol">Responsable (rol)</label><input id="atf_ac_${i}_responsable_rol" type="text" value="${escHtml(a.responsable_rol)}" autocomplete="off" aria-describedby="err_atf_ac_${i}_responsable_rol"><div class="err" id="err_atf_ac_${i}_responsable_rol"></div></div>
      <div class="field"><label for="atf_ac_${i}_plazo">Plazo</label><input id="atf_ac_${i}_plazo" type="date" value="${escHtml(a.plazo)}" aria-describedby="err_atf_ac_${i}_plazo"><div class="err" id="err_atf_ac_${i}_plazo"></div></div>
      <button type="button" class="btn btn-ghost btn-mini at-ac-quitar" id="btnAtfAcQuitar_${i}" onclick="atBorradorQuitar(${i})">Quitar<span class="sr-only"> el acuerdo ${i + 1}</span></button>
    </div>`).join("");
}
function _atBorradorPintar(){ const c = _atEl("atfAcuerdosFilas"); if(c) c.innerHTML = _atBorradorHtml(); }
function atBorradorAgregar(){
  _atBorradorSync(); AT.borrador.push({acuerdo: "", responsable_rol: "", plazo: ""}); _atBorradorPintar();
  const n = _atEl(`atf_ac_${AT.borrador.length - 1}_acuerdo`); if(n) n.focus();
}
function atBorradorQuitar(i){
  _atBorradorSync(); AT.borrador.splice(i, 1); _atBorradorPintar();
  const sig = _atEl(`atf_ac_${Math.min(i, AT.borrador.length - 1)}_acuerdo`) || _atEl("btnAtfAcAgregar"); if(sig) sig.focus();
}
async function _atPrepararFormulario(){
  await Promise.all([atTraerOpciones(), atTraerGrupos(), atTraerNnas()]);
}
async function atAbrirNuevo(){
  const ses = AT.sesion, btn = _atEl("btnAtNuevo");
  if(btn) btn.disabled = true;
  try{ await _atPrepararFormulario(); }
  catch(err){ if(ses === AT.sesion){ if(btn) btn.disabled = false; toast(err instanceof ApiError ? err.message : "No se pudo preparar el formulario.", "error"); } return; }
  if(ses !== AT.sesion) return;
  if(btn) btn.disabled = false;
  AT.borrador = [];
  openFlujoModal("Nuevo registro de ateneo o jornada", "Ateneos y capacitación", _atFormHtml({}, true), _atPie("✓ Guardar registro", "atGuardarNuevo()"));
  _atBorradorPintar(); atFormTipo();
}
async function atAbrirEditar(){
  if(AT.det.estado !== "listo") return;
  const ses = AT.sesion, d = AT.det.datos;
  try{ await _atPrepararFormulario(); }
  catch(err){ if(ses === AT.sesion) toast(err instanceof ApiError ? err.message : "No se pudo preparar el formulario.", "error"); return; }
  if(ses !== AT.sesion || AT.det.datos !== d) return;
  openFlujoModal("Editar registro", `${d.codigo} · Ateneos y capacitación`, _atFormHtml(d, false), _atPie("✓ Guardar cambios", "atGuardarEdicion()"));
  atFormTipo();
}
function _atPie(rotulo, accion){
  return `<span class="left">Ateneos y capacitación</span>
    <div class="acciones-pie">
      <button type="button" class="btn btn-ghost" id="btnAtCancelar" onclick="cerrarFlujoModalUsuario()">Cancelar</button>
      <button type="button" class="btn btn-primary" id="btnAtGuardar" onclick="${accion}">${rotulo}</button>
    </div>`;
}
/* Lo que muestra el formulario, campo por campo: vacío = null; lo oculto por el tipo = null (no corresponde). */
function _atValores(){
  const tipo = _atEl("atf_tipo").value;
  const ver = (c) => {
    if(c === "hce_referida_id") return tipo === "clinico";
    if(c === "grupo_id") return tipo === "clinico" || tipo === "grupo";
    if(AT_BLOQUE_JORNADA.includes(c)) return tipo === "jornada";
    if(AT_BLOQUE_CLINICO.includes(c)) return tipo !== "jornada";
    return true;
  };
  const v = {};
  Object.keys(AT_CAMPOS).forEach(c => {
    if(c === "acuerdos") return;
    const el = _atEl(AT_CAMPOS[c][0]); const crudo = el ? el.value : "";
    if(!ver(c)){ v[c] = null; return; }
    if(c === "hce_referida_id" || c === "grupo_id"){ v[c] = crudo ? +crudo : null; return; }
    v[c] = c === "tipo" || c === "fecha" ? (crudo || null) : (crudo.trim() ? crudo : null);
  });
  return v;
}
function _atErrores(err, resumenId, titulo){
  const detalle = err instanceof ApiError && err.detail.length ? err.detail : [{campo: null, mensaje: err.message || "No se pudo guardar."}];
  const items = detalle.map(x => {
    const partes = String(x.campo || "").split(".");
    if(partes[0] === "acuerdos" && partes.length === 3) return {id: `atf_ac_${partes[1]}_${partes[2]}`, rot: `Acuerdo ${+partes[1] + 1}`, mensaje: x.mensaje};
    const m = x.campo && AT_CAMPOS[partes[0]];
    return {id: m ? m[0] : null, rot: m ? m[1] : "", mensaje: x.mensaje};
  });
  formResumen(resumenId, items, titulo).focus();
}
async function atGuardarNuevo(){
  if(AT.guardando) return;
  const ses = AT.sesion;
  formLimpiar(_atEl("modalFlujo"), "atErrores");
  _atBorradorSync();
  // Sin validación propia: obligatorios, blancos, la forma según el tipo y una jornada con acuerdos los decide la API (422).
  const v = _atValores(), body = {};
  Object.keys(v).forEach(c => { if(v[c] !== null) body[c] = v[c]; });
  // Tipo, fecha y título siempre viajan (vacíos, si están vacíos): el «es obligatorio» lo dice la API junto al campo.
  body.tipo = v.tipo || ""; body.fecha = v.fecha || ""; body.titulo = _atEl("atf_titulo").value;
  body.acuerdos = AT.borrador.map(a => ({acuerdo: a.acuerdo, responsable_rol: a.responsable_rol.trim() ? a.responsable_rol : null, plazo: a.plazo || null}));
  const btn = _atEl("btnAtGuardar");
  AT.guardando = true; if(btn){ btn.disabled = true; btn.textContent = "Guardando…"; }
  try{
    const r = await apiFetch("/ateneos", {method: "POST", body});
    if(ses !== AT.sesion) return;
    AT.guardando = false; AT.borrador = [];
    closeFlujoModal();
    toast(`Registro ${r.data.codigo} guardado`);
    await atAbrir(r.data.id, r.warnings || []);
  }catch(err){
    if(ses !== AT.sesion) return;
    AT.guardando = false; if(btn){ btn.disabled = false; btn.textContent = "✓ Guardar registro"; }
    _atErrores(err, "atErrores", "No se pudo guardar el registro:");
  }
}
async function atGuardarEdicion(){
  if(AT.guardando || AT.det.estado !== "listo") return;
  const ses = AT.sesion, d = AT.det.datos, id = d.id;
  formLimpiar(_atEl("modalFlujo"), "atErrores");
  const v = _atValores(), body = {};
  Object.keys(v).forEach(c => { const antes = d[c] === undefined ? null : d[c]; if(v[c] !== antes) body[c] = v[c]; });
  if("titulo" in body && body.titulo === null) body.titulo = _atEl("atf_titulo").value;   // un título en blanco lo rechaza la API
  if(!Object.keys(body).length){ formResumen("atErrores", [{mensaje: "No hay cambios para guardar."}], "Nada que guardar:").focus(); return; }
  const btn = _atEl("btnAtGuardar");
  AT.guardando = true; if(btn){ btn.disabled = true; btn.textContent = "Guardando…"; }
  try{
    const r = await apiFetch(`/ateneos/${id}`, {method: "PATCH", body});
    if(ses !== AT.sesion || AT.det.id !== id) return;
    AT.guardando = false; AT.det.datos = r.data; AT.avisos = r.warnings || [];
    closeFlujoModal();
    atPintarDetalle();
    const t = _atEl("atDetTitulo"); if(t) t.focus();
    toast("Registro guardado");
  }catch(err){
    if(ses !== AT.sesion || AT.det.id !== id) return;
    AT.guardando = false; if(btn){ btn.disabled = false; btn.textContent = "✓ Guardar cambios"; }
    _atErrores(err, "atErrores", "No se pudo guardar:");
  }
}

/* ===================== ACUERDO (agregar o editar, después del alta) ===================== */
function atAbrirAcuerdo(acuerdoId){
  if(AT.det.estado !== "listo") return;
  const d = AT.det.datos, a = acuerdoId === null ? {} : d.acuerdos.find(x => x.id === acuerdoId);
  if(!a) return;
  const body = `<div id="acErrores" class="form-errores" role="alert" tabindex="-1" hidden></div>
    <div class="field"><label for="acf_acuerdo">Acuerdo ${_AT_REQ}</label><textarea id="acf_acuerdo" aria-required="true" aria-describedby="err_acf_acuerdo" class="ta-80">${escHtml(a.acuerdo || "")}</textarea><div class="err" id="err_acf_acuerdo"></div></div>
    <div class="field"><label for="acf_rol">Responsable (rol)</label><input id="acf_rol" type="text" value="${escHtml(a.responsable_rol || "")}" autocomplete="off" aria-describedby="hint_acf_rol err_acf_rol">
      <div class="hint" id="hint_acf_rol">Un rol (por ejemplo, «Coordinación técnica»), no un nombre.</div><div class="err" id="err_acf_rol"></div></div>
    <div class="field"><label for="acf_plazo">Plazo</label><input id="acf_plazo" type="date" value="${escHtml(a.plazo || "")}" aria-describedby="err_acf_plazo"><div class="err" id="err_acf_plazo"></div></div>
    <p class="hint">Los acuerdos no se borran: uno equivocado se corrige.</p>`;
  const nuevo = acuerdoId === null;
  openFlujoModal(nuevo ? "Agregar acuerdo" : "Editar acuerdo", `${d.codigo} · Acuerdos`, body,
    _atPie(nuevo ? "✓ Agregar acuerdo" : "✓ Guardar cambios", `atGuardarAcuerdo(${nuevo ? "null" : acuerdoId})`));
}
async function atGuardarAcuerdo(acuerdoId){
  if(AT.guardando || AT.det.estado !== "listo") return;
  const ses = AT.sesion, d = AT.det.datos, id = d.id;
  formLimpiar(_atEl("modalFlujo"), "acErrores");
  const v = {acuerdo: _atEl("acf_acuerdo").value, responsable_rol: _atEl("acf_rol").value.trim() ? _atEl("acf_rol").value : null, plazo: _atEl("acf_plazo").value || null};
  let body = v;
  if(acuerdoId !== null){
    const a = d.acuerdos.find(x => x.id === acuerdoId) || {};
    body = {};
    Object.keys(v).forEach(c => { if(v[c] !== (a[c] === undefined ? null : a[c])) body[c] = v[c]; });
    if(!Object.keys(body).length){ formResumen("acErrores", [{mensaje: "No hay cambios para guardar."}], "Nada que guardar:").focus(); return; }
  }
  const btn = _atEl("btnAtGuardar"), rotulo = btn ? btn.textContent : "";
  AT.guardando = true; if(btn){ btn.disabled = true; btn.textContent = "Guardando…"; }
  try{
    const r = await apiFetch(acuerdoId === null ? `/ateneos/${id}/acuerdos` : `/ateneos/${id}/acuerdos/${acuerdoId}`, {method: acuerdoId === null ? "POST" : "PATCH", body});
    if(ses !== AT.sesion || AT.det.id !== id) return;
    AT.guardando = false; AT.avisos = r.warnings || [];
    closeFlujoModal();
    await atRecargarDetalle();
    if(ses !== AT.sesion || AT.det.id !== id) return;
    const t = _atEl("atAcuerdosTitulo"); if(t) t.focus();
    toast(acuerdoId === null ? "Acuerdo agregado" : "Acuerdo guardado");
  }catch(err){
    if(ses !== AT.sesion || AT.det.id !== id) return;
    AT.guardando = false; if(btn){ btn.disabled = false; btn.textContent = rotulo; }
    const detalle = err instanceof ApiError && err.detail.length ? err.detail : [{campo: null, mensaje: err.message || "No se pudo guardar."}];
    formResumen("acErrores", detalle.map(x => { const m = x.campo && AT_AC_CAMPOS[String(x.campo).split(".")[0]]; return {id: m ? m[0] : null, rot: m ? m[1] : "", mensaje: x.mensaje}; }),
      "No se pudo guardar el acuerdo:").focus();
  }
}

/* ===================== DOCUMENTOS DEL ATENEO ===================== */
async function atAbrirDocumento(){
  if(AT.det.estado !== "listo") return;
  const ses = AT.sesion, d = AT.det.datos;
  let cats;
  try{ cats = (await docTraerCategorias()).filter(c => !c.es_registro_historico); }
  catch(err){ if(ses === AT.sesion) toast(err instanceof ApiError ? err.message : "No se pudieron cargar las categorías.", "error"); return; }
  if(ses !== AT.sesion || AT.det.datos !== d) return;
  const body = `<div id="atDocErrores" class="form-errores" role="alert" tabindex="-1" hidden></div>
    <div class="field"><label for="atdf_archivo">Archivo ${_AT_REQ}</label>
      <input id="atdf_archivo" type="file" accept=".pdf,.jpg,.jpeg,.png,.pptx" aria-required="true" aria-describedby="hint_atdf_archivo err_atdf_archivo">
      <div class="hint" id="hint_atdf_archivo">PDF, JPG, PNG o PPTX (sin macros), hasta 10 MB. El servidor revisa el contenido del archivo, no su extensión.</div><div class="err" id="err_atdf_archivo"></div></div>
    <div class="field"><label for="atdf_categoria">Categoría ${_AT_REQ}</label>${_docSelectCategoria("atdf_categoria", cats, null, "— elegir categoría —")}<div class="err" id="err_atdf_categoria"></div></div>
    <div class="field"><label for="atdf_nombre">Nombre</label><input id="atdf_nombre" type="text" autocomplete="off" aria-describedby="hint_atdf_nombre err_atdf_nombre">
      <div class="hint" id="hint_atdf_nombre">Si queda vacío, se usa el nombre del archivo.</div><div class="err" id="err_atdf_nombre"></div></div>
    <div class="field"><label for="atdf_fecha">Fecha original</label><input id="atdf_fecha" type="date" aria-describedby="err_atdf_fecha"><div class="err" id="err_atdf_fecha"></div></div>`;
  openFlujoModal("Adjuntar documento", `${d.codigo} · Documentos`, body, _atPie("✓ Adjuntar documento", "atGuardarDocumento()"));
}
async function atGuardarDocumento(){
  if(AT.guardando || AT.det.estado !== "listo") return;
  const ses = AT.sesion, id = AT.det.id;
  formLimpiar(_atEl("modalFlujo"), "atDocErrores");
  // Sin validación propia: falta de archivo, tipo, tamaño y categoría los decide la API (413/422 por campo).
  const fd = new FormData(), arch = _atEl("atdf_archivo").files[0];
  if(arch) fd.append("archivo", arch);
  const cat = _atEl("atdf_categoria").value, nom = _atEl("atdf_nombre").value, fec = _atEl("atdf_fecha").value;
  if(cat) fd.append("categoria_id", cat);
  if(nom.trim()) fd.append("nombre", nom);
  if(fec) fd.append("fecha_original", fec);
  const btn = _atEl("btnAtGuardar");
  AT.guardando = true; if(btn){ btn.disabled = true; btn.textContent = "Adjuntando…"; }
  try{
    const r = await apiFetch(`/ateneos/${id}/documentos`, {method: "POST", body: fd});
    if(ses !== AT.sesion || AT.det.id !== id) return;
    AT.guardando = false; AT.avisos = r.warnings || [];
    closeFlujoModal();
    await atRecargarDetalle();
    if(ses !== AT.sesion || AT.det.id !== id) return;
    const t = _atEl("atDocsTitulo"); if(t) t.focus();
    toast("Documento adjuntado");
  }catch(err){
    if(ses !== AT.sesion || AT.det.id !== id) return;
    AT.guardando = false; if(btn){ btn.disabled = false; btn.textContent = "✓ Adjuntar documento"; }
    _docErrores(err, AT_DOC_CAMPOS, "atDocErrores", "No se pudo adjuntar el documento:");
  }
}
function atDescargarDoc(docId){
  const x = AT.det.docs.filas.find(f => f.id === docId); if(!x || AT.det.id === null) return;
  _descargar(`/ateneos/${AT.det.id}/documentos/${docId}/archivo`, x.nombre, (m) => {
    AT.avisos = [{mensaje: m, conflicto: true}];
    const el = _atEl("atAvisos"); if(el){ el.innerHTML = atAvisosHtml(); el.hidden = false; }
  });
}

/* ===================== TARJETA «Ateneos clínicos» DEL EXPEDIENTE ===================== */
/* GET /ateneos?hce_referida_id=: los ateneos clínicos de ESTE expediente (si la persona ve el expediente, los ve). */
const EXP_AT = {hceId: null, estado: "vacio", filas: [], total: 0, error: "", seq: 0};
function atExpOlvidar(){ EXP_AT.seq++; Object.assign(EXP_AT, {hceId: null, estado: "vacio", filas: [], total: 0, error: ""}); }
async function atExpCargar(){
  const mi = EXP.seq, id = EXP.id, n = ++EXP_AT.seq;
  if(id === null) return;
  Object.assign(EXP_AT, {hceId: id, estado: "cargando", filas: [], total: 0, error: ""});
  atExpPintar();
  try{
    const r = await apiFetch("/ateneos", {query: {hce_referida_id: id, limit: 20}});
    if(mi !== EXP.seq || n !== EXP_AT.seq) return;
    Object.assign(EXP_AT, {estado: "listo", filas: r.data, total: r.total === null ? r.data.length : r.total});
  }catch(err){
    if(mi !== EXP.seq || n !== EXP_AT.seq) return;
    Object.assign(EXP_AT, {estado: "error", error: err instanceof ApiError ? err.message : "No se pudieron cargar los ateneos."});
  }
  atExpPintar();
}
function atExpPintar(){ const el = _atEl("expAteneos"); if(el) el.outerHTML = atExpCardHtml(); }
function atExpCardHtml(){
  const cab = `<h3 id="expAteneosTitulo">Ateneos clínicos
    ${EXP_AT.estado === "listo" ? `<span class="org-total" id="expAteneosTotal">${EXP_AT.total}</span><span class="sr-only"> registrados</span>` : ""}</h3>`;
  let cuerpo;
  if(EXP_AT.hceId !== EXP.id || EXP_AT.estado === "cargando" || EXP_AT.estado === "vacio") cuerpo = estadoCargandoHtml("Cargando los ateneos clínicos…");
  else if(EXP_AT.estado === "error") cuerpo = estadoErrorHtml(EXP_AT.error, "atExpCargar()");
  else if(!EXP_AT.filas.length) cuerpo = `<div id="expAteneosVacio">${estadoVacioHtml("◌", "No hay ateneos clínicos registrados sobre este NNA.")}</div>`;
  else cuerpo = `<ul class="exp-ateneos" id="expAteneosLista">${EXP_AT.filas.map(f => `<li data-ateneo="${f.id}">
      <button type="button" class="btn-link exp-at-abrir" id="btnExpAt_${f.id}" onclick="atAbrirDesdeExpediente(${f.id})">${escHtml(f.titulo)}</button>
      <span class="nna-sub"><span class="cod">${escHtml(f.codigo)}</span> · ${escHtml(fmtFecha(f.fecha))} · ${escHtml(f.acuerdos)} ${f.acuerdos === 1 ? "acuerdo" : "acuerdos"} · <span class="at-sensible">${AT_SENSIBLE_TXT}</span></span>
    </li>`).join("")}</ul>${EXP_AT.total > EXP_AT.filas.length ? `<p class="hint">Se muestran los ${EXP_AT.filas.length} más recientes de ${EXP_AT.total}.</p>` : ""}`;
  return `<div class="info-card" id="expAteneos">${cab}<div class="ib">${cuerpo}</div></div>`;
}
function atAbrirDesdeExpediente(id){ AT.pendiente = id; go("ateneos"); }
