/* Navegacion, tabla NNA, graficos de analitica, toast, sesion.
   Demo L1 HCE+IDEA - IPPU x UTEC-LIDIA.
   Extraido del monolito (lineas 2061-2427) sin cambios de logica.
   Los scripts se cargan en orden en index.html: el orden ES la semantica. */
/* ================= NAVEGACIÓN ================= */
/* El expediente y su documento impreso cuelgan de «NNA y HCE»: ese ítem sigue marcado mientras se los ve (F1, H21). */
const NAV_DE_VISTA = {expediente:"inicio", informe:"inicio"};
function go(view){
  const target = document.getElementById("view-"+view);
  if(!target) return;
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  target.classList.add("active");
  const nav = NAV_DE_VISTA[view] || view;
  document.querySelectorAll(".navitem").forEach(b=>{
    const on = b.dataset.view === nav;
    b.classList.toggle("active", on);
    if(on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
  });
  window.scrollTo({top:0});
  /* Las vistas conectadas piden sus datos cada vez que se abren (pendientes.js, grupos-usuario.js, inclusion.js, ateneos.js, panel.js). */
  if(view === "pendientes" && typeof pendAlAbrir === "function") pendAlAbrir();
  if(view === "grupos" && typeof gruposAlAbrir === "function") gruposAlAbrir();
  if(view === "inclusion" && typeof incVistaAlAbrir === "function") incVistaAlAbrir();
  if(view === "ateneos" && typeof atAlAbrir === "function") atAlAbrir();   // C6: lista + indicador (o el registro pedido desde un expediente)
  if(view === "analitica" && typeof panelAlAbrir === "function") panelAlAbrir();   // C7: GET /panel + GET /recordatorios
  if(typeof fotosLiberarVista === "function") fotosLiberarVista(view);   // C5: las miniaturas (Blob URLs) de la vista que se deja se revocan
}
document.querySelectorAll(".navitem").forEach(b=>b.addEventListener("click",()=>go(b.dataset.view)));
/* Los KPI de pendientes llevan a la vista Pendientes ya filtrada («lb» o «ci»); el foco pasa a su título. */
function irAPendientes(filtro){
  if(typeof pendPedirFiltro === "function") pendPedirFiltro(filtro);
  go("pendientes");
  const t = document.getElementById("tituloPendientes"); if(t) t.focus();
}

/* ================= INICIO: TABLA NNA (re-renderizable) ================= */
const tb = document.getElementById("tbodyNNA");

/* ================= INICIO CONECTADO (Fase 3-a · handoff §5.122) =================
   El listado sale de GET /hce; ya no se filtra el array NNA de la demo. Estado, filtros y
   paginacion viven en LISTA. El servidor busca, filtra y pagina; el navegador solo pinta.
   Unica excepcion: el filtro «Inactivos», que la API no tiene (gap anotado en handoff):
   se trae todo con incluir_inactivos=true y se filtra aca, paginando en el cliente. */
const LISTA = { q:"", grupo:null, estado:"activos", offset:0, limit:25, total:0, seq:0, kpiSeq:0, gruposSeq:0, anioGrupos:null, timer:null };
let GRUPOS_API = [];

/* Regla de la caja de busqueda -> parametro de GET /hce (una sola vez, aca):
   - solo digitos/puntos/guiones/espacios:
       · con punto o guion, o 7+ digitos  -> `ci`  (cedula uruguaya: 7–8 digitos; "6.012.345-1")
       · hasta 6 digitos sin separadores  -> `numero` (N.º de HCE = hc_historico; hoy 4 digitos, 1001…)
   - cualquier otra cosa                  -> `nombre` (contiene; sin mayusculas ni acentos)
   Se manda la cedula canonica (sin puntos ni guiones). Una cedula incompleta, corta y sin
   separadores (≤6 digitos) se lee como N.º de HCE: es la ambiguedad aceptada de una sola caja. */
function consultaDeBusqueda(texto){
  const t = (texto||"").trim();
  if(!t) return {};
  if(/^[\d.\-\s]+$/.test(t)){
    const digitos = t.replace(/[.\-\s]/g, "");
    if(!digitos) return {nombre:t};
    if(!/[.\-]/.test(t) && digitos.length <= 6) return {numero:digitos};
    return {ci:digitos};
  }
  return {nombre:t};
}

/* Estado de modulo (§3.2 de notas-accesibilidad-ui: el estado no depende del color; glifo + texto,
   y «sin iniciar» (contorno) se distingue de «en curso» (relleno parcial, borde punteado)). */
const ESTADO_MOD_TXT = {
  firmado:     {glifo:"●", txt:"firmado"},
  en_curso:    {glifo:"◐", txt:"en curso"},
  sin_iniciar: {glifo:"○", txt:"sin iniciar"}
};
const MOD_CORTO = {"HCE-LB":"LB","HCE-PA":"PA","HCE-PB":"PB","HCE-IC":"IC"};
function pillModulo(corto, modulo, estado){
  const clase = ESTADO_MOD_TXT[estado] ? estado : "sin_iniciar";
  const e = ESTADO_MOD_TXT[clase];
  return `<span class="st st-${clase}"><span aria-hidden="true">${corto} ${e.glifo}</span><span class="sr-only">${escHtml(modulo)} ${e.txt}</span></span>`;
}
/* Consentimiento informado en el EXPEDIENTE (pestaña CI): «Registrado» macizo; pendiente es un aviso accionable (notas §3.1). */
function pillCi(estado){
  return estado === "registrado"
    ? `<span class="st st-firmado"><span aria-hidden="true">●</span> Registrado</span>`
    : `<span class="st st-ci-pend"><span aria-hidden="true">⚠</span> CI pendiente</span>`;
}
/* En el LISTADO (F1, H5): el estado normal no grita. Registrado = «✓ CI» en tinta secundaria, sin relleno; sólo el pendiente
   conserva su chip rojo (el único rojo de la fila). */
function ciListaHtml(estado){
  return estado === "registrado"
    ? `<span class="ci-ok"><span aria-hidden="true">✓</span> CI<span class="sr-only"> registrado</span></span>`
    : `<span class="st st-ci-pend"><span aria-hidden="true">⚠</span> CI pendiente</span>`;
}

/* Fila del listado (F1, H3/H5): cinco columnas. El nombre es el único punto de Tab de la fila (un botón); con el mouse se abre
   el expediente desde cualquier parte de la fila (filaNNAClic). La cédula no se muestra, pero la búsqueda la sigue aceptando. */
function filaNNA(p){
  const nombre = escHtml(`${p.nombre} ${p.apellido}`.trim());
  const inactivo = p.activo ? "" : ` <span class="chip-inactivo">Inactivo</span>`;
  return `<tr data-hce="${p.id}" data-activo="${p.activo}" onclick="filaNNAClic(event, ${p.id})">
    <td class="nna">
      <button type="button" class="nna-abrir" onclick="abrirExpediente(${p.id})" aria-label="Abrir expediente de ${nombre}">${nombre}</button>${inactivo}
      <span class="nna-sub">HC <span class="cod">${escHtml(p.hc)}</span>${p.edad === null ? "" : ` · ${p.edad} años`}</span>
    </td>
    <td>${p.grupo ? escHtml(p.grupo) : "—"}</td>
    <td><span class="st-grupo">${MODULOS_CADENA.map(m=>pillModulo(MOD_CORTO[m], m, p.modulos[m])).join(" ")}</span></td>
    <td>${ciListaHtml(p.ciEstado)}</td>
    <td class="col-ir" aria-hidden="true">›</td>
  </tr>`;
}
/* Clic con el mouse en cualquier parte de la fila (menos en un control: el botón del nombre ya abre por su cuenta). */
function filaNNAClic(ev, id){
  if(ev.target.closest("button, a, input, select, textarea")) return;
  abrirExpediente(id);
}

/* Estados de la tabla: cargando · error (con reintento) · vacio · filas. Nunca en blanco. */
function _tbodyMsg(html){ tb.innerHTML = `<tr><td colspan="5">${html}</td></tr>`; }
function listaCargando(){
  _tbodyMsg(estadoCargandoHtml("Cargando expedientes…"));
  document.getElementById("listaResumen").textContent = "";
  document.getElementById("pagPrev").disabled = true;
  document.getElementById("pagNext").disabled = true;
}
function listaError(err){
  const msg = err instanceof ApiError ? err.message : "No se pudo cargar el listado.";
  _tbodyMsg(estadoErrorHtml(msg, "cargarLista()"));
  document.getElementById("listaResumen").textContent = "";
}

/* Todas las paginas de una consulta (el maximo por pedido de la API es 200). */
async function traerTodo(query){
  let filas = [], offset = 0, total = Infinity;
  while(offset < total){
    const r = await apiFetch("/hce", {query:Object.assign({}, query, {limit:200, offset})});
    total = r.total === null ? r.data.length : r.total;
    filas = filas.concat(r.data.map(it => adaptarFilaLista(it)));
    if(!r.data.length) break;
    offset += r.data.length;
  }
  return filas;
}
function _queryLista(){
  const q = consultaDeBusqueda(LISTA.q);
  const g = LISTA.grupo;
  return Object.assign({}, q, {
    grupo: g ? g.nombre : null, anio: g ? g.anio : null,
    incluir_inactivos: LISTA.estado !== "activos"
  });
}

async function cargarLista(){
  const mi = ++LISTA.seq;
  listaCargando();
  try{
    let filas, total;
    if(LISTA.estado === "inactivos"){
      const inact = (await traerTodo(_queryLista())).filter(f => !f.activo);
      total = inact.length;
      filas = inact.slice(LISTA.offset, LISTA.offset + LISTA.limit);
    }else{
      const r = await apiFetch("/hce", {query:Object.assign(_queryLista(), {limit:LISTA.limit, offset:LISTA.offset})});
      filas = r.data.map(it => adaptarFilaLista(it));
      total = r.total === null ? filas.length : r.total;
    }
    if(mi !== LISTA.seq) return;     // llego una respuesta vieja: se ignora
    LISTA.total = total;
    pintarLista(filas);
  }catch(err){
    if(mi !== LISTA.seq) return;
    listaError(err);
  }
}

function pintarLista(filas){
  tb.innerHTML = filas.length
    ? filas.map(filaNNA).join("")
    : `<tr><td colspan="5">${estadoVacioHtml("⌕", "No se encontraron NNA con ese criterio.")}</td></tr>`;
  const paginas = Math.max(1, Math.ceil(LISTA.total / LISTA.limit));
  const pag = Math.floor(LISTA.offset / LISTA.limit) + 1;
  document.getElementById("listaResumen").textContent =
    `Mostrando ${filas.length} de ${LISTA.total} · página ${pag} de ${paginas}`;
  document.getElementById("pagPrev").disabled = LISTA.offset <= 0;
  document.getElementById("pagNext").disabled = LISTA.offset + LISTA.limit >= LISTA.total;
}

function paginaNNA(dir){
  const nuevo = LISTA.offset + dir * LISTA.limit;
  if(nuevo < 0 || nuevo >= Math.max(LISTA.total, 1)) return;
  LISTA.offset = nuevo;
  cargarLista();
}
function onBusquedaNNA(){
  clearTimeout(LISTA.timer);
  LISTA.timer = setTimeout(()=>{
    LISTA.q = document.getElementById("searchNNA").value;
    LISTA.offset = 0;
    cargarLista();
  }, 300);
}
function onFiltroGrupo(){
  const id = document.getElementById("filtroGrupo").value;
  const g = GRUPOS_API.find(x => String(x.id) === id);
  LISTA.grupo = g ? {nombre:g.nombre, anio:g.anio} : null;
  LISTA.offset = 0;
  cargarLista();
}
function setEstadoFiltro(estado){
  LISTA.estado = estado;
  LISTA.offset = 0;
  document.querySelectorAll(".chip-estado").forEach(c=>{
    const on = c.dataset.estado === estado;
    c.classList.toggle("active", on);
    c.setAttribute("aria-pressed", on ? "true" : "false");
  });
  cargarLista();
}

/* Filtro de grupo: GET /grupos, solo los del anio en curso (la API resuelve `grupo` + `anio`).
   Los colores de grupo de datos.js NO se usan: el nombre es el de la API. Si falla, el filtro
   queda en «Todos» y el listado sigue funcionando. */
/* El anio de los grupos que se muestran: el en curso si la API trae grupos de ese anio, si no el mas reciente.
   Una sola regla para el filtro del listado, el alta y la vista Grupos. */
function anioDeGrupos(lista){
  const hoy = new Date().getFullYear();
  return lista.some(g => g.anio === hoy) ? hoy : lista.reduce((m,g) => Math.max(m,g.anio), 0);
}
async function cargarGrupos(){
  const sel = document.getElementById("filtroGrupo");
  const mi = ++LISTA.gruposSeq;   // misma guardia que las cargas del expediente: una respuesta tardia tras «Salir» se descarta
  try{
    const r = await apiFetch("/grupos");
    if(mi !== LISTA.gruposSeq) return;
    const anio = anioDeGrupos(r.data);
    GRUPOS_API = r.data.filter(g => g.anio === anio);
    LISTA.anioGrupos = GRUPOS_API.length ? anio : null;   // el alta pide los grupos de ESTE anio (el que trajo la API)
    sel.innerHTML = `<option value="">Todos</option>` +
      GRUPOS_API.map(g => `<option value="${g.id}">${escHtml(g.nombre)}</option>`).join("");
  }catch(_err){
    if(mi !== LISTA.gruposSeq) return;
    GRUPOS_API = [];
    sel.innerHTML = `<option value="">Todos (grupos no disponibles)</option>`;
  }
}

/* KPIs: solo los que se derivan de lo que devuelve GET /hce (activos, con el `flujo` del anio en
   curso de cada fila). Contar filas es presentacion; ningun valor de negocio se calcula aca. */
async function cargarKpis(){
  const mi = ++LISTA.kpiSeq;
  ["kpiTotal","kpiAlDia","kpiPend","kpiCi"].forEach(id => setKpi(id, "…"));
  try{
    const todos = await traerTodo({incluir_inactivos:false});
    if(mi !== LISTA.kpiSeq) return;
    setKpi("kpiTotal", todos.length);
    setKpi("kpiAlDia", todos.filter(f => f.modulos["HCE-LB"] === "firmado").length);
    setKpi("kpiPend",  todos.filter(f => f.modulos["HCE-LB"] !== "firmado").length);
    setKpi("kpiCi",    todos.filter(f => f.ciEstado === "pendiente").length);
  }catch(_err){
    if(mi !== LISTA.kpiSeq) return;
    ["kpiTotal","kpiAlDia","kpiPend","kpiCi"].forEach(id => setKpi(id, "—"));
  }
}

function toggleActivo(id){
  const p = NNA.find(n=>n.id===id); if(!p) return;
  p.activo = !p.activo;
  const hoy = new Date().toISOString().slice(0,10);
  if(!p.activo){
    p.bajaFecha = hoy;
    p.historial.push({tipo:"note", fecha:hoy, titulo:"Baja del programa", desc:"NNA marcado como inactivo (demo)."});
  } else {
    delete p.bajaFecha;
    p.historial.push({tipo:"note", fecha:hoy, titulo:"Reactivación", desc:"NNA reactivado en el programa (demo)."});
  }
  abrirExpedienteDemo(id);
  toast(p.activo ? `${p.nombre} reactivado` : `${p.nombre} dado de baja`);
}

function setKpi(id,val){ const el=document.getElementById(id); if(el) el.textContent=val; }

/* La vista Pendientes ya no es de demostración: vive en pendientes.js (conectada a GET /hce y GET /recordatorios). */

/* Navegación intra-vista: scroll suave hacia una sección del expediente o de un grupo.
   El contexto (NNA abierto, o vista Grupos) no cambia — es puro atajo visual. */
function scrollASeccion(anchorId){
  const el = document.getElementById(anchorId);
  if(el) el.scrollIntoView({behavior:"smooth", block:"start"});
}

/* El panel institucional ya no se calcula acá: lo calcula el servidor (GET /panel) y lo pinta js/panel.js (C7, §5.159). */
/* ===================== TOAST ===================== */
/* `tipo`: "ok" (por omisión: se hizo lo pedido) · "info" (no pasó nada malo: p. ej. «No hay cambios para guardar») · "error" (no se
   pudo). Glifo + texto (✓ · ℹ · !) y, para un lector de pantalla, «Error:» delante del mensaje; el color del glifo sólo acompaña. */
const TOAST_TIPOS = {ok: {glifo: "✓", sr: ""}, info: {glifo: "ℹ", sr: ""}, error: {glifo: "!", sr: "Error: "}};
function toast(msg, tipo){
  const t = document.getElementById("toast");
  const k = TOAST_TIPOS[tipo] ? tipo : "ok";
  t.dataset.tipo = k;
  document.getElementById("toastIco").textContent = TOAST_TIPOS[k].glifo;
  document.getElementById("toastTipo").textContent = TOAST_TIPOS[k].sr;
  document.getElementById("toastMsg").textContent = msg;
  t.classList.add("show");
  clearTimeout(window._toastT);
  window._toastT = setTimeout(()=>t.classList.remove("show"), 3200);
}

/* ===================== SESIÓN (Fase 3-a · login contra la API) =====================
   POST /auth/login -> token + usuario, guardados en sessionStorage (api.js · Sesion).
   Al cargar la pagina con token guardado se valida con GET /auth/yo antes de mostrar nada.
   Un 401 en cualquier llamada (api.js) vuelve a esta pantalla via alSesionInvalida(). */
const ROL_TXT = {admin:"Administración", tecnico:"Técnico"};

function _el(id){ return document.getElementById(id); }
function limpiarErrorLogin(){ const e=_el("loginError"); e.hidden=true; e.textContent=""; }
/* Mensaje en el role="alert" y foco ahi: el lector de pantalla lo lee y el teclado queda a mano. */
function mostrarErrorLogin(msg){
  const e = _el("loginError");
  e.textContent = msg;
  e.hidden = false;
  e.focus();
}
function estadoLogin(msg){
  const e = _el("loginEstado");
  e.textContent = msg || "";
  e.hidden = !msg;
}
function loginOcupado(si){
  _el("loginBtn").disabled = si;
  _el("loginUser").disabled = si;
  _el("loginPass").disabled = si;
  _el("loginBtn").textContent = si ? "Ingresando…" : "Ingresar";
}

function pintarUsuario(u){
  const rol = ROL_TXT[u.rol] || u.rol || "";
  _el("userAvatar").textContent = inicialesDe(u.nombre);
  _el("userNombre").textContent = u.nombre;
  _el("userRol").textContent = rol;
  _el("userChip").setAttribute("aria-label", `Mi usuario — ${u.nombre}, ${rol}`);
}

/* Deja la UI sin rastro de la sesion anterior: nada de datos de NNA detras del login. */
function limpiarUiDeSesion(){
  clearTimeout(LISTA.timer);
  LISTA.seq++; LISTA.kpiSeq++; LISTA.gruposSeq++; LISTA.anioGrupos = null;
  if(typeof cerrarDialogosConectados === "function") cerrarDialogosConectados();   // el dialogo de alta/edicion no queda abierto detras del login
  Object.assign(LISTA, {q:"", grupo:null, estado:"activos", offset:0, total:0});
  GRUPOS_API = [];
  tb.innerHTML = "";
  _el("listaResumen").textContent = "";
  _el("searchNNA").value = "";
  _el("filtroGrupo").innerHTML = `<option value="">Todos</option>`;
  document.querySelectorAll(".chip-estado").forEach(c=>{
    const on = c.dataset.estado === "activos";
    c.classList.toggle("active", on); c.setAttribute("aria-pressed", on ? "true" : "false");
  });
  ["kpiTotal","kpiAlDia","kpiPend","kpiCi"].forEach(id => setKpi(id, "…"));
  // Cargas en vuelo del expediente: la secuencia sube y se descarta todo lo que tenga datos de un NNA.
  EXP.seq++;
  Object.assign(EXP, {id:null, hce:null, raw:null, flujo:null, flujoError:false, tab:"hce00", ci:null, avisos:[], mods:null, idea:null, ayuda:false});
  if(typeof evReiniciar === "function") evReiniciar(true);     // evaluaciones: ni borradores ni profesionales de la sesión anterior
  if(typeof icReiniciar === "function") icReiniciar();         // informe de cierre y su documento impreso: nada del NNA anterior detrás del login
  if(typeof vfReiniciar === "function") vfReiniciar();         // valoración funcional
  if(typeof sevOlvidarSesion === "function") sevOlvidarSesion();   // severidad y el catálogo de grados
  if(typeof orgOlvidarSesion === "function") orgOlvidarSesion();   // organismos y las opciones de BPS
  if(typeof incOlvidarSesion === "function") incOlvidarSesion();   // inclusión (pestaña, opciones y la vista del menú)
  if(typeof docOlvidarSesion === "function") docOlvidarSesion();   // documentos, fotos (también las del grupo) y categorías
  if(typeof atOlvidarSesion === "function") atOlvidarSesion();     // ateneos (lista, indicador, detalle) y la tarjeta del expediente
  if(typeof logReiniciar === "function") logReiniciar();       // registro de cambios
  if(typeof pendOlvidarSesion === "function") pendOlvidarSesion();       // Pendientes: nada del listado anterior detrás del login
  if(typeof gruposOlvidarSesion === "function") gruposOlvidarSesion();   // Grupos y el diálogo de asignación
  if(typeof panelOlvidarSesion === "function") panelOlvidarSesion();     // Panel institucional (C7): nada de los agregados anteriores detrás del login
  if(typeof closeFlujoModal === "function") closeFlujoModal(true);   // el diálogo del recibí no queda abierto detrás del login
  _el("modalTitle").textContent = ""; _el("mfSub").textContent = "";   // los títulos de los diálogos nombran al NNA: vacíos detrás del login (B2, §5.157)
  _el("expedienteContent").innerHTML = "";
  _el("userAvatar").textContent = "··";
  _el("userNombre").textContent = "—";
  _el("userRol").innerHTML = "&nbsp;";
  _el("userChip").setAttribute("aria-label", "Mi usuario");
  _el("loginPass").value = "";
}

/* Mientras el login esta a la vista, el resto de la app queda inerte (sin foco, sin clics, fuera del
   arbol de accesibilidad): el login es un dialogo modal. */
function appInerte(si){
  document.querySelectorAll("header.topbar, div.layout, a.skip-link").forEach(el => { el.inert = si; });
}

function mostrarLogin(mensaje){
  limpiarUiDeSesion();
  appInerte(true);
  go("inicio");
  _el("loginScreen").classList.remove("hidden");
  estadoLogin("");
  loginOcupado(false);
  if(mensaje) mostrarErrorLogin(mensaje);
  else { limpiarErrorLogin(); _el("loginUser").focus(); }
}
/* Gancho que api.js llama ante un 401 con sesion. */
function alSesionInvalida(mensaje){ mostrarLogin(mensaje); }

function entrar(usuario){
  pintarUsuario(usuario);
  _el("loginScreen").classList.add("hidden");
  appInerte(false);
  limpiarErrorLogin();
  go("inicio");
  _el("tituloInicio").focus();   // el foco pasa al titulo de la pantalla, no se pierde en el login oculto
  cargarGrupos();
  cargarKpis();
  cargarLista();
  toast("Bienvenido, " + usuario.nombre, "info");
}

async function doLogin(e){
  if(e) e.preventDefault();
  const email = _el("loginUser").value.trim();
  const password = _el("loginPass").value;
  limpiarErrorLogin();
  if(!email || !password){
    mostrarErrorLogin("Ingresá tu usuario y tu contraseña.");
    return false;
  }
  loginOcupado(true);
  let usuario = null;
  try{
    const r = await apiFetch("/auth/login", {method:"POST", body:{email, password}, auth:false});
    Sesion.guardar(r.data.access_token, r.data.usuario);
    usuario = r.data.usuario;
  }catch(err){
    Sesion.limpiar();
    mostrarErrorLogin(err instanceof ApiError ? err.message : "No se pudo ingresar.");
  }
  loginOcupado(false);
  if(usuario){ _el("loginPass").value = ""; entrar(usuario); }
  return false;
}

function logout(){
  Sesion.limpiar();
  mostrarLogin();
}

/* Arranque (index.html, ultima linea): paneles de modo demo + token guardado -> /auth/yo. */
async function arrancarSesion(){
  rellenarPanelesDemo();
  const token = Sesion.token();
  if(!token){ mostrarLogin(); return; }
  estadoLogin("Verificando sesión…");
  try{
    const r = await apiFetch("/auth/yo");
    Sesion.guardar(token, r.data);
    estadoLogin("");
    entrar(r.data);
  }catch(err){
    if(err.status !== 401){        // 401: api.js ya limpio y mostro el login con su aviso
      Sesion.limpiar();
      mostrarLogin(err instanceof ApiError ? err.message : "No se pudo verificar la sesión.");
    }
  }
}

/* El login es un diálogo modal: Tab no sale de él (la app de atrás, incluido el enlace de salto, está inerte). */
_el("loginScreen").addEventListener("keydown", e => atraparTab(e, _el("loginScreen")));
