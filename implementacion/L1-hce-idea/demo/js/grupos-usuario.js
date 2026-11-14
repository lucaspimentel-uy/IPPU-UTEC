/* Grupos de referencia (conectada a la API, F2) y Mi usuario (ejemplo, v3.1).
   Demo L1 HCE+IDEA - IPPU x UTEC-LIDIA.
   Los scripts se cargan en orden en index.html: el orden ES la semantica. */
/* =====================================================================
   MÓDULOS AÑADIDOS (v3.1): Grupos, Usuario.
   M7 (2026-07-30): el código de "Eval. por áreas" y "Eval. general"
   (provisionales, ocultas desde M0) se ELIMINÓ — decisión §0.2 del plan:
   sus registros del sistema anterior viven ahora en HCE-DOC como archivo
   histórico de solo lectura ("Registro histórico — HCE anterior", §10).
   ===================================================================== */

/* El arreglo de grupos «por color» de ejemplo (`GRUPOS`) y `nroHC()` se retiraron en C6 (§5.158): sólo los leían los
   ateneos de ejemplo, que ahora son de la API. */

/* ============ VISTA GRUPOS · conectada (F2) ============
   GET /grupos (los del año, con sus dos técnicos y el rol de cada uno EN el grupo) + GET /hce (los NNA activos que la persona
   puede ver, agrupados por grupo.id). El admin ve todos los grupos del año; un técnico, aquellos donde es técnico 1 o 2
   (presentación, igual que el alta, §5.125: la autoridad es la API). Sólo el admin asigna técnicos (PATCH /grupos/{id}, §5.120 a);
   crear, renombrar o archivar grupos sigue fuera (§5.90). Lo que la API no tiene (franja de edad, días y horarios, talleres,
   nómina «técnicos autorizados», CIE-11/apoyo y uso de imagen por NNA) no se muestra: no se inventa. Las fotos del grupo vuelven con C5
   (§5.155 e): la tarjeta «Fotos del grupo» del detalle la arma documentos.js con GET /grupos/{id}/fotos (la API decide quién la ve). */
const GRP = { seq:0, sesion:0, estado:"vacio", error:"", grupos:[], filas:[], anio:null, abierto:null, guardando:false, abriendo:false };

function gruposEsAdmin(){ const u = Sesion.usuario(); return !!u && u.rol === "admin"; }
/* Los grupos que ESTA persona ve del año elegido (admin: todos; técnico: los suyos). */
function gruposVisibles(){ return _wizGruposOfrecidos(GRP.grupos); }
function gruposDeId(id){ return GRP.grupos.find(g => g.id === id) || null; }
function gruposTecnicoHtml(t){
  return t ? `${escHtml(t.nombre)}${t.rol ? ` <span class="grupo-rol">· ${escHtml(t.rol)}</span>` : ""}` : `<span class="grupo-sin">Sin asignar</span>`;
}
function gruposCuenta(g){ return GRP.filas.filter(f => f.grupoId === g.id); }

function gruposAlAbrir(){
  GRP.abierto = null;
  gruposCargar();
}
async function gruposCargar(){
  const mi = ++GRP.seq;
  GRP.estado = "cargando";
  gruposPintar();
  try{
    const [gr, filas] = await Promise.all([apiFetch("/grupos"), traerTodo({incluir_inactivos:false})]);
    if(mi !== GRP.seq) return;     // respuesta vieja o de una sesión que ya salió: se descarta
    const anio = anioDeGrupos(gr.data);
    GRP.anio = gr.data.length ? anio : null;
    GRP.grupos = gr.data.filter(g => g.anio === anio);
    GRP.filas = filas.filter(f => f.activo);
    GRP.estado = "listo";
  }catch(err){
    if(mi !== GRP.seq) return;
    GRP.estado = "error";
    GRP.error = err instanceof ApiError ? err.message : "No se pudieron cargar los grupos.";
  }
  gruposPintar();
}
/* Sólo GET /grupos (tras asignar técnicos): los NNA no cambiaron. */
async function gruposRecargarGrupos(){
  const mi = ++GRP.seq;
  try{
    const gr = await apiFetch("/grupos");
    if(mi !== GRP.seq) return false;
    const anio = anioDeGrupos(gr.data);
    GRP.anio = gr.data.length ? anio : null;
    GRP.grupos = gr.data.filter(g => g.anio === anio);
    GRP.estado = "listo";
  }catch(err){
    if(mi !== GRP.seq) return false;
    GRP.estado = "error";
    GRP.error = err instanceof ApiError ? err.message : "No se pudieron cargar los grupos.";
  }
  return true;
}
/* «Salir» / 401: la vista queda vacía, el diálogo de asignación se cierra y una respuesta en vuelo ya no se pinta. */
function gruposOlvidarSesion(){
  GRP.seq++; GRP.sesion++;
  Object.assign(GRP, {estado:"vacio", error:"", grupos:[], filas:[], anio:null, abierto:null, guardando:false, abriendo:false});
  const c = document.getElementById("gruposList"); if(c) c.innerHTML = "";
}

function gruposAsignarBtn(g, ancla){
  return gruposEsAdmin()
    ? `<button type="button" class="btn btn-ghost" id="btnAsignar${ancla}_${g.id}" onclick="asignarAbrir(${g.id})">Asignar técnicos<span class="sr-only"> del grupo ${escHtml(g.nombre)}</span></button>`
    : "";
}
function gruposPintar(){
  const cont = document.getElementById("gruposList"); if(!cont) return;
  if(GRP.estado === "vacio"){ cont.innerHTML = ""; return; }
  const crumbs = `<div class="crumbs">Servicio de Atención Diurna › <b>Grupos de referencia</b></div>`;
  if(GRP.estado === "cargando"){ cont.innerHTML = `${crumbs}<h1 class="pagetitle" id="tituloGrupos" tabindex="-1">Grupos de referencia</h1>${estadoCargandoHtml("Cargando los grupos…")}`; return; }
  if(GRP.estado === "error"){ cont.innerHTML = `${crumbs}<h1 class="pagetitle" id="tituloGrupos" tabindex="-1">Grupos de referencia</h1>${estadoErrorHtml(GRP.error, "gruposCargar()")}`; return; }
  const g = GRP.abierto !== null ? gruposVisibles().find(x => x.id === GRP.abierto) : null;
  if(g) gruposPintarDetalle(g); else { GRP.abierto = null; if(typeof grpFotosLiberar === "function") grpFotosLiberar(); gruposPintarLista(); }
}
function gruposPintarLista(){
  const cont = document.getElementById("gruposList");
  const lista = gruposVisibles();
  const admin = gruposEsAdmin();
  cont.innerHTML = `<div class="crumbs">Servicio de Atención Diurna › <b>Grupos de referencia</b></div>
    <div class="titulo-ayuda"><h1 class="pagetitle" id="tituloGrupos" tabindex="-1">Grupos de referencia</h1>${ayudaBotonHtml("grupos", "Grupos de referencia")}</div>
    ${ayudaPanelHtml("grupos", `<p class="pagedesc">Los grupos de ${GRP.anio === null ? "este año" : GRP.anio} ${admin ? "con sus dos técnicos" : "donde sos técnico o técnica"} y los NNA activos de cada uno. Tocá un grupo para ver sus integrantes.</p>`)}
    ${lista.length ? `<div class="grupos-grid">${lista.map(g => {
      const n = gruposCuenta(g).length;
      return `<article class="card grupo-card" id="grupoCard_${g.id}">
        <div class="cardhead">
          <h2 id="grupoTit_${g.id}" tabindex="-1"><button type="button" class="btn-link h2-link" id="btnGrupo_${g.id}" onclick="abrirGrupo(${g.id})">${escHtml(g.nombre)}</button></h2>
          <div class="cardhead-sp"></div>
          <span class="card-n">${n} NNA<span class="sr-only"> activos</span></span>
        </div>
        <div class="cardbody">
          <dl class="grupo-tecnicos">
            <div><dt>Técnico 1</dt><dd>${gruposTecnicoHtml(g.tecnico1)}</dd></div>
            <div><dt>Técnico 2</dt><dd>${gruposTecnicoHtml(g.tecnico2)}</dd></div>
          </dl>
          ${admin ? `<div class="grupo-acciones">${gruposAsignarBtn(g, "")}</div>` : ""}
        </div>
      </article>`;
    }).join("")}</div>`
      : estadoVacioHtml("◌", admin ? `No hay grupos cargados para ${GRP.anio === null ? "este año" : GRP.anio}.` : "No tenés grupos asignados este año.")}`;
}

/* Integrantes de un grupo: la MISMA fila y los mismos estados que el listado de «NNA y HCE» (filaNNA). */
function abrirGrupo(id){
  GRP.abierto = id;
  gruposPintar();
  const t = document.getElementById("grupoTitulo"); if(t) t.focus();
}
function cerrarGrupo(){
  const id = GRP.abierto;
  GRP.abierto = null;
  gruposPintar();
  const b = document.getElementById("btnGrupo_" + id); if(b) b.focus();     // el foco vuelve a quien abrió el grupo
}
function gruposPintarDetalle(g){
  const cont = document.getElementById("gruposList");
  const filas = gruposCuenta(g);
  cont.innerHTML = `<div class="crumbs"><button type="button" class="btn-link" id="grupoVolver" onclick="cerrarGrupo()">Grupos de referencia</button> › <b>${escHtml(g.nombre)}</b></div>
    <div class="pagehead">
      <h1 id="grupoTitulo" tabindex="-1">${escHtml(g.nombre)} <span class="grupo-anio">· ${escHtml(g.anio)}</span></h1>
      <dl class="grupo-tecnicos grupo-tecnicos-fila">
        <div><dt>Técnico 1</dt><dd>${gruposTecnicoHtml(g.tecnico1)}</dd></div>
        <div><dt>Técnico 2</dt><dd>${gruposTecnicoHtml(g.tecnico2)}</dd></div>
      </dl>
      ${gruposEsAdmin() ? `<div class="grupo-acciones">${gruposAsignarBtn(g, "Det")}</div>` : ""}
    </div>
    <div class="card">
      <div class="cardhead"><h2>Integrantes activos</h2><div class="cardhead-sp"></div><span class="card-n">${filas.length} NNA</span></div>
      <div class="tabla-scroll">
        <table class="lista" id="tablaGrupo">
          <caption class="sr-only">NNA activos del grupo ${escHtml(g.nombre)}</caption>
          <thead><tr><th scope="col">NNA</th><th scope="col">Grupo</th><th scope="col">Ciclo del año <span class="th-sub">LB · PA · PB · IC</span></th><th scope="col">Consentimiento</th><th scope="col" class="col-ir"><span class="sr-only">Abrir</span></th></tr></thead>
          <tbody>${filas.length ? filas.map(filaNNA).join("") : `<tr><td colspan="5">${estadoVacioHtml("◌", "Este grupo no tiene NNA activos.")}</td></tr>`}</tbody>
        </table>
      </div>
      <div class="lista-pie"><span class="hint">Ciclo del año: ● firmado · ◐ en curso · ○ sin iniciar</span></div>
    </div>
    <div class="card grp-fotos" id="grpFotosCard"></div>`;
  if(typeof grpFotosCargar === "function") grpFotosCargar(g.id, GFOT.grupoId === g.id && GFOT.estado === "listo");
}

/* ---------- Asignar técnicos (sólo admin) ---------- */
const ASG_CAMPOS = {
  tecnico1_id:  ["asg_t1", "Técnico 1"],          tecnico1_rol: ["asg_r1", "Rol del técnico 1"],
  tecnico2_id:  ["asg_t2", "Técnico 2"],          tecnico2_rol: ["asg_r2", "Rol del técnico 2"]
};
function _asgSelect(id, rot, profs, actual){
  const opts = profs.map(p => ({id:p.id, txt:`${p.nombre}${p.especialidad ? " · " + p.especialidad : ""}`}));
  if(actual && !opts.some(o => o.id === actual.id)) opts.push({id:actual.id, txt:`${actual.nombre} (ya no está activo)`});   // abrir el diálogo no puede borrar la asignación en silencio
  return `<div class="field"><label for="${id}">${rot}</label>
    <select id="${id}" aria-describedby="err_${id}"><option value="">Sin asignar</option>${opts.map(o => `<option value="${o.id}"${actual && actual.id === o.id ? " selected" : ""}>${escHtml(o.txt)}</option>`).join("")}</select>
    <div class="err" id="err_${id}"></div></div>`;
}
function _asgRol(id, rot, valor){
  return `<div class="field"><label for="${id}">${rot}</label>
    <input id="${id}" type="text" maxlength="60" value="${escHtml(valor || "")}" autocomplete="off" aria-describedby="hint_${id} err_${id}">
    <div class="hint" id="hint_${id}">Texto libre (por ejemplo, Psicólogo/a). Es el rol en este grupo.</div><div class="err" id="err_${id}"></div></div>`;
}
async function asignarAbrir(id){
  const g = gruposDeId(id);
  if(!g || !gruposEsAdmin() || GRP.abriendo) return;
  const ses = GRP.sesion;
  GRP.abriendo = true;
  let profs;
  try{
    profs = (await apiFetch("/profesionales", {query:{activo:true}})).data;
  }catch(err){
    GRP.abriendo = false;
    if(ses === GRP.sesion) toast(err instanceof ApiError ? err.message : "No se pudo cargar la lista de profesionales.", "error");
    return;
  }
  GRP.abriendo = false;
  if(ses !== GRP.sesion) return;
  const body = `<div id="asgErrores" class="form-errores" role="alert" tabindex="-1" hidden></div>
    <p class="hint hint-intro">El cambio se aplica al guardar: el técnico asignado ve desde ese momento los expedientes del grupo, y queda registrado en la auditoría.</p>
    ${_asgSelect("asg_t1", "Técnico 1", profs, g.tecnico1)}${_asgRol("asg_r1", "Rol del técnico 1", g.tecnico1 ? g.tecnico1.rol : "")}
    ${_asgSelect("asg_t2", "Técnico 2", profs, g.tecnico2)}${_asgRol("asg_r2", "Rol del técnico 2", g.tecnico2 ? g.tecnico2.rol : "")}`;
  const foot = `<span class="left">Grupo ${escHtml(g.nombre)} · ${escHtml(g.anio)}</span>
    <div class="acciones-pie">
      <button type="button" class="btn btn-ghost" id="btnAsgCancelar" onclick="cerrarFlujoModalUsuario()">Cancelar</button>
      <button type="button" class="btn btn-primary" id="btnAsgGuardar" onclick="asignarGuardar(${g.id})">✓ Guardar asignación</button>
    </div>`;
  openFlujoModal("Asignar técnicos", `Grupo ${g.nombre} · ${g.anio}`, body, foot);
}
/* Lo que hay hoy en el servidor, con la forma del PATCH (el rol de un puesto vacío no se ve: null). */
function _asgActual(g){
  return {tecnico1_id: g.tecnico1 ? g.tecnico1.id : null, tecnico1_rol: g.tecnico1 ? (g.tecnico1.rol || null) : null,
          tecnico2_id: g.tecnico2 ? g.tecnico2.id : null, tecnico2_rol: g.tecnico2 ? (g.tecnico2.rol || null) : null};
}
async function asignarGuardar(id){
  if(GRP.guardando) return;
  const g = gruposDeId(id); if(!g) return;
  const ses = GRP.sesion;
  const modal = document.getElementById("modalFlujo");
  formLimpiar(modal, "asgErrores");
  const val = k => document.getElementById(ASG_CAMPOS[k][0]).value;
  const nuevo = {
    tecnico1_id: val("tecnico1_id") === "" ? null : +val("tecnico1_id"), tecnico1_rol: val("tecnico1_rol").trim() || null,
    tecnico2_id: val("tecnico2_id") === "" ? null : +val("tecnico2_id"), tecnico2_rol: val("tecnico2_rol").trim() || null
  };
  const actual = _asgActual(g), body = {};
  Object.keys(nuevo).forEach(k => { if(nuevo[k] !== actual[k]) body[k] = nuevo[k]; });     // PATCH: sólo lo que cambió
  // El servidor conserva el rol de un puesto cuyo técnico se saca y GET /grupos lo oculta: si cambia el técnico, el rol viaja siempre
  // (lo escrito, o null si está vacío) para que quien se asigne después no herede uno que no ve (§5.153).
  [1, 2].forEach(n => { if(("tecnico" + n + "_id") in body) body["tecnico" + n + "_rol"] = nuevo["tecnico" + n + "_rol"]; });
  if(!Object.keys(body).length){ formResumen("asgErrores", [{mensaje: "No hay cambios para guardar."}], "Nada que guardar:").focus(); return; }
  const btn = document.getElementById("btnAsgGuardar");
  GRP.guardando = true; if(btn){ btn.disabled = true; btn.textContent = "Guardando…"; }
  try{
    const r = await apiFetch(`/grupos/${id}`, {method:"PATCH", body});
    if(ses !== GRP.sesion) return;
    GRP.guardando = false;
    closeFlujoModal();
    const ok = await gruposRecargarGrupos();
    if(!ok || ses !== GRP.sesion) return;
    gruposPintar();
    const t = document.getElementById(GRP.abierto === id ? "grupoTitulo" : "grupoTit_" + id); if(t) t.focus();
    const avisos = (r.warnings || []).map(w => w && w.mensaje).filter(Boolean);
    toast(`Técnicos del grupo ${g.nombre} guardados${avisos.length ? ". Aviso: " + avisos.join(" ") : ""}`, avisos.length ? "info" : "ok");
  }catch(err){
    if(ses !== GRP.sesion) return;
    GRP.guardando = false; if(btn){ btn.disabled = false; btn.textContent = "✓ Guardar asignación"; }
    // El formulario no se vuelve a pintar: lo elegido se conserva y cada error queda junto a su campo (403: sólo en el resumen).
    const detalle = err instanceof ApiError && err.detail.length ? err.detail : [{campo:null, mensaje: err.message || "No se pudo guardar."}];
    const items = detalle.map(d => { const m = d.campo && ASG_CAMPOS[d.campo]; return {id: m ? m[0] : null, rot: m ? m[1] : "", mensaje: d.mensaje}; });
    formResumen("asgErrores", items, "No se pudo guardar la asignación:").focus();
  }
}
/* ---------- USUARIO / PERFIL (ejemplo, en modo demostración) ---------- */
const USUARIO = {
  nombre:"Dr. González", rol:"Técnico · Psicología", email:"gonzalez@fundacionippu.uy",
  cargo:"Técnico de referencia", grupos:["Azul"]
};
const EQUIPO = [
  {n:"Dr. González",  e:"Psicología",      g:"Azul"},
  {n:"Lic. Torres",   e:"Psicopedagogía",  g:"Celeste · Verde"},
  {n:"Lic. Pereira",  e:"Fonoaudiología",  g:"Azul · Naranja"},
  {n:"Dra. Silva",    e:"Neuropediatría",  g:"Naranja"}
];
function renderUsuario(){
  const cont = document.getElementById("usuarioContent");
  if(!cont) return;
  const u = USUARIO;
  const iniciales = u.nombre.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const nnaCargo = NNA.filter(n=>u.grupos.includes(n.grupo)).length;
  cont.innerHTML = `
    <div class="exp-head">
      <div class="exp-avatar">${iniciales}</div>
      <div>
        <h1>${u.nombre}</h1>
        <div class="meta">${u.rol} · ${u.email}</div>
        <div class="badges">
          <span class="bdg">${u.cargo}</span>
          <span class="bdg">Grupos ${u.grupos.join(" · ")}</span>
          <span class="bdg">${nnaCargo} NNA a cargo</span>
        </div>
      </div>
    </div>
    <div class="exp-grid">
      <div class="info-card">
        <h3>Datos del perfil de ejemplo</h3>
        <div class="ib">
          <div class="data-row"><dt>Nombre</dt><dd>${u.nombre}</dd></div>
          <div class="data-row"><dt>Rol</dt><dd>${u.rol}</dd></div>
          <div class="data-row"><dt>Email</dt><dd>${u.email}</dd></div>
          <div class="data-row"><dt>Grupos a cargo</dt><dd>${u.grupos.join(" · ")}</dd></div>
          <div class="data-row"><dt>Acceso</dt><dd>Restringido a los grupos que coordina</dd></div>
        </div>
      </div>
      <div class="info-card">
        <h3>Equipo técnico</h3>
        <div class="ib">
          ${EQUIPO.map(t=>`<div class="data-row"><dt>${t.n}</dt><dd>${t.e} · Grupos ${t.g}</dd></div>`).join("")}
        </div>
      </div>
    </div>
    <div class="note" style="margin-top:6px">Demo: el control de acceso real (autenticación JWT por terapeuta, roles y visibilidad por grupo) se implementa en el backend. Cada técnico solo ve los NNA de los grupos que coordina.</div>`;
}

/* ---------- Wiring + render inicial de los módulos nuevos ----------
   B2 (2026-08-19): «Mi usuario» salió de la barra de navegación y se entra por el
   perfil de la topbar, que llama a `go('usuarios'); renderUsuario()` en su onclick.
   El listener sobre `.navitem[data-view="usuarios"]` se retira porque ya no hay
   ningún elemento que lo matchee: no fallaba, pero quedaba como cableado muerto
   apuntando a un nodo inexistente. */
renderUsuario();

/* Escape cierra el diálogo abierto (venía de recordatorios.js, que se retiró en C7: los recordatorios del panel son de la API, panel.js).
   El diálogo de alta/edición ya NO se cierra con un clic en el fondo (Fase 3-b): es un formulario largo y un clic de más perdería lo
   tipeado; se cierra con «×», con Cancelar o con Escape, y con datos tipeados pide confirmar (Fase 3-e). */
document.addEventListener("keydown", e=>{ if(e.key==="Escape"){ closeAlta(); cerrarFlujoModalUsuario(); } });
