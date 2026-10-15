/* Navegacion, tabla NNA, Likert, graficos de analitica, toast, sesion.
   Demo L1 HCE+IDEA - IPPU x UTEC-LIDIA.
   Extraido del monolito (lineas 2061-2427) sin cambios de logica.
   Los scripts se cargan en orden en index.html: el orden ES la semantica. */
/* ================= NAVEGACIÓN ================= */
function go(view){
  const target = document.getElementById("view-"+view);
  if(!target) return;
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  target.classList.add("active");
  document.querySelectorAll(".navitem").forEach(b=>b.classList.toggle("active", b.dataset.view===view));
  window.scrollTo({top:0});
}
document.querySelectorAll(".navitem").forEach(b=>b.addEventListener("click",()=>go(b.dataset.view)));

/* ================= INICIO: TABLA NNA (re-renderizable) ================= */
const tb = document.getElementById("tbodyNNA");

function pillEval(ev){
  if(!ev) return `<span class="pill due">sin evaluar</span>`;
  return `<span class="pill done">${ev.score} pts</span>`;
}
function pillLik(ev, tieneInicial){
  if(ev) return `<span class="pill done">${ev.score} pts</span>`;
  return tieneInicial ? `<span class="pill pend">pendiente</span>` : `<span class="pill due">—</span>`;
}
function proxEval(nna){
  const final = getEval(nna,"final");
  if(final) return "Ciclo completo ✓";
  const lik = getEval(nna,"lik");
  if(lik) return "Completa · 11/2026";
  const ini = getEval(nna,"inicial");
  if(ini) return "Intermedia · 06/2026";
  return "Completa · pendiente";
}

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
/* Consentimiento informado: pendiente es un bloqueo ACCIONABLE (notas §3.1), el unico rojo de la fila. */
function pillCi(estado){
  return estado === "registrado"
    ? `<span class="st st-firmado"><span aria-hidden="true">●</span> Registrado</span>`
    : `<span class="st st-ci-pend"><span aria-hidden="true">⚠</span> CI pendiente</span>`;
}

function filaNNA(p){
  const estadoPill = p.activo
    ? `<span class="pill activo">Activo</span>`
    : `<span class="pill inactivo">Inactivo</span>`;
  const nombreCompleto = escHtml(`${p.nombre} ${p.apellido}`.trim());
  return `<tr data-hce="${p.id}" data-activo="${p.activo}">
    <td><b>${escHtml(p.hc)}</b></td>
    <td>${escHtml(p.ciTxt)}</td>
    <td class="nna-name">${escHtml(p.nombre)}</td>
    <td class="nna-name">${escHtml(p.apellido)}</td>
    <td>${p.edad === null ? "—" : p.edad}</td>
    <td>${p.grupo ? escHtml(p.grupo) : "—"}</td>
    <td>${pillCi(p.ciEstado)}</td>
    <td><span class="st-grupo">${MODULOS_CADENA.map(m=>pillModulo(MOD_CORTO[m], m, p.modulos[m])).join(" ")}</span></td>
    <td>${estadoPill}</td>
    <td><button class="btn btn-link" onclick="abrirExpediente(${p.id})" aria-label="Abrir expediente de ${nombreCompleto}">Abrir expediente →</button></td>
  </tr>`;
}

/* Estados de la tabla: cargando · error (con reintento) · vacio · filas. Nunca en blanco. */
function _tbodyMsg(html){ tb.innerHTML = `<tr><td colspan="10">${html}</td></tr>`; }
function listaCargando(){
  _tbodyMsg(`<div class="empty-state" role="status"><div class="big" aria-hidden="true">…</div>Cargando expedientes…</div>`);
  document.getElementById("listaResumen").textContent = "";
  document.getElementById("pagPrev").disabled = true;
  document.getElementById("pagNext").disabled = true;
}
function listaError(err){
  const msg = err instanceof ApiError ? err.message : "No se pudo cargar el listado.";
  _tbodyMsg(`<div class="empty-state" role="alert"><div class="big" aria-hidden="true">!</div>${escHtml(msg)}<br>
    <button class="btn btn-ghost btn-mini" style="margin-top:10px" onclick="cargarLista()">Reintentar</button></div>`);
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
    : `<tr><td colspan="10"><div class="empty-state"><div class="big" aria-hidden="true">⌕</div>No se encontraron NNA con ese criterio.</div></td></tr>`;
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
async function cargarGrupos(){
  const sel = document.getElementById("filtroGrupo");
  const mi = ++LISTA.gruposSeq;   // misma guardia que las cargas del expediente: una respuesta tardia tras «Salir» se descarta
  try{
    const r = await apiFetch("/grupos");
    if(mi !== LISTA.gruposSeq) return;
    const anioMax = r.data.reduce((m,g)=>Math.max(m,g.anio), 0);
    const anio = r.data.some(g => g.anio === new Date().getFullYear()) ? new Date().getFullYear() : anioMax;
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
  renderNNA();
  abrirExpedienteDemo(id);
  toast(p.activo ? `${p.nombre} reactivado` : `${p.nombre} dado de baja`);
}

function renderNNA(){
  // Dropdown de NNA (todos) para el Informe de Cierre de ejemplo
  const optsNNA = NNA.map(p=>
    `<option value="${p.id}">#${p.id} · ${p.nombre} ${p.apellido} · Grupo ${p.grupo}</option>`).join("");
  const selIC = document.getElementById("selNNAIC");
  if(selIC){ const prev = selIC.value; selIC.innerHTML = optsNNA; if(prev) selIC.value = prev; }
  // Fase 3-a: el listado y los KPIs de Inicio ya no salen de este array (ver «INICIO CONECTADO»).
  // Esta funcion sigue para las vistas que quedan en modo demostracion.
  renderPendientes();
  renderAnalitica();   // la analítica institucional se deriva del mismo modelo: se recalcula con cada cambio
}
function setKpi(id,val){ const el=document.getElementById(id); if(el) el.textContent=val; }

/* --- Vista Pendientes (NNA activos sin IDEA del año en curso) --- */
function renderPendientes(){
  const kpi = document.getElementById("pendKpi");
  const tb2 = document.getElementById("tbodyPend");
  if(!tb2) return;
  const pend = NNA.filter(pendienteIdea);
  const activos = NNA.filter(p=>p.activo).length;
  if(kpi){
    const cobertura = activos ? Math.round((activos-pend.length)/activos*100) : 0;
    kpi.innerHTML = `
      <div class="kpi"><div class="lab">Sin línea base IDEA</div><div class="val orange">${pend.length}</div><div class="sub">NNA activos sin HCE-LB firmada</div></div>
      <div class="kpi"><div class="lab">Cobertura línea base</div><div class="val ok">${cobertura} %</div><div class="sub">${activos-pend.length} de ${activos} activos</div></div>
      <div class="kpi"><div class="lab">Sin iniciar</div><div class="val purple">${pend.filter(p=>!(p.flujo&&p.flujo.lb.dim.some(v=>v!=null))).length}</div><div class="sub">Sin ninguna dimensión cargada</div></div>`;
  }
  tb2.innerHTML = pend.length ? pend.map(p=>{
    const estadoTxt = `<span style="color:var(--ink-2)">sin iniciar</span>`;
    return `<tr>
      <td><b>#${p.id}</b></td><td>${p.ci}</td>
      <td class="nna-name">${p.nombre}</td><td class="nna-name">${p.apellido}</td>
      <td>Grupo ${p.grupo}</td><td>${estadoTxt}</td>
      <td><button class="btn btn-link" onclick="go('inicio')">Ir al listado →</button></td>
    </tr>`;
  }).join("") : `<tr><td colspan="7"><div class="empty-state"><div class="big">✓</div>Todas las líneas base IDEA están firmadas.</div></td></tr>`;
}

/* --- Navegación al Informe de Cierre de ejemplo preseleccionando el NNA (LB/PA/PB: pestañas del expediente) --- */
function irAEval(view, id){
  if(view==="ic"){
    go("ic");
    cargarIC(id);
  } else if(view==="intermedia"){
    go("intermedia");
  }
}
/* Navegación intra-vista: scroll suave hacia una sección del expediente o de un grupo.
   El contexto (NNA abierto, o vista Grupos) no cambia — es puro atajo visual. */
function scrollASeccion(anchorId){
  const el = document.getElementById(anchorId);
  if(el) el.scrollIntoView({behavior:"smooth", block:"start"});
}

renderNNA();

/* ================= EVAL INTERMEDIA: LIKERT ================= */
const likSel = {};
document.querySelectorAll(".lik-opts").forEach(g=>{
  g.addEventListener("click", ev=>{
    const b = ev.target.closest("button"); if(!b) return;
    g.querySelectorAll("button").forEach(x=>x.classList.remove("sel"));
    b.classList.add("sel");
    likSel[g.dataset.item] = +b.dataset.v;
    if(Object.keys(likSel).length === 3){
      const vals = Object.values(likSel);
      const prom = vals.reduce((a,b)=>a+b,0)/3;
      const eq = Math.round((5 - prom) * 2 * 10) / 10;
      const niv = eq >= 5.5 ? "alto" : eq >= 3 ? "moderado-alto" : eq >= 1.5 ? "moderado" : "leve";
      document.getElementById("likFormula").innerHTML =
        `<b>Conversión:</b> Promedio = (${vals.join(" + ")}) / 3 = <b>${prom.toFixed(1)}</b>
         &nbsp;→&nbsp; Equivalente IDEA = (5 − ${prom.toFixed(1)}) × 2 = <b>${eq}</b>
         &nbsp;→&nbsp; Nivel: <b>${niv}</b>`;
    }
  });
});

/* ================= ANALÍTICA INSTITUCIONAL — INDICADORES CALCULADOS =================
   Esta vista se calcula desde el modelo (array NNA + motor de flujo de M1). Antes eran
   constantes: los KPIs vivían en el markup y las series, acá. Dos reglas duras la acotan:

   §5.2 (no-homologabilidad) — IDEA y Escala IPPU-TEA miden constructos distintos y con
     lógica de puntaje inversa (el IDEA BAJA cuando hay mejora; la IPPU-TEA SUBE). No se
     suman, no se promedian juntas y no comparten eje: van en dos tarjetas separadas.
   §5.1.3 — el heatmap de talleres queda fuera de alcance: sigue con datos de muestra,
     no se calcula, y el markup lo rotula como tal.

   Lo que ya NO se puede calcular, y por qué: esta vista mostraba "IDEA enero vs noviembre".
   Desde M4 el IDEA es línea base ÚNICA (se quitó la lógica anual), así que ese segundo
   punto temporal no existe en el modelo. La única lectura de evolución legítima es el
   delta B−A de la IPPU-TEA, que ya calculó el motor al firmar el Protocolo B
   (flujo.pb.deltas): acá se promedia, nunca se recalcula.

   Declaradas como `function` a propósito: renderNNA() —que corre antes en este archivo—
   llama a renderAnalitica(), y un `const` de sección quedaría en zona muerta temporal.
   Misma familia de trampa que la del hoisting descrita en handoff §5.5.2. */

function promedio(xs){ return xs.length ? xs.reduce((a,b)=>a+b,0)/xs.length : null; }
function fmt1(v){ return v==null ? "—" : v.toFixed(1).replace(".", ","); }

/* Agregados poblacionales. Sólo NNA ACTIVOS: un expediente dado de baja no cuenta ni
   para la cobertura ni para los promedios del padrón. */
function analiticaAgregados(){
  const activos = NNA.filter(n=>n.activo);
  const conLB   = activos.filter(tieneLBFirmada);

  /* IDEA — sólo líneas base firmadas y completas. Una dimensión en 'NS' haría que el total
     no sea comparable con el del resto; validarIntegridad ya impide firmar así, este filtro
     es la red por si el dato llegara de otro lado. */
  const lbs     = conLB.map(n=>lbTotales(n.flujo.lb.dim)).filter(t=>!t.hayNS && t.count===12);
  const ideaEsc = [0,1,2,3].map(i=>promedio(lbs.map(t=>t.esc[i])));
  const ideaTot = promedio(lbs.map(t=>t.total));
  const banda   = Object.fromEntries(IDEA_BANDAS.map(b=>[b.perfil,0]));
  lbs.forEach(t=>banda[bandaIdea(t.total)]++);

  /* IPPU-TEA — sólo NNA con Protocolo A y B firmados y con el delta ya registrado por el
     motor (M5.3). Si el B se firmó sin A (la secuencia sólo avisa, §5.95), `deltas` es null y
     el NNA queda fuera del promedio: no hay evolución que medir. */
  const conAB    = activos.filter(n=>n.flujo.pa.firmado && n.flujo.pb.firmado && n.flujo.pb.deltas);
  const paEsc    = [0,1,2,3].map(i=>promedio(conAB.map(n=>protTotales(n.flujo.pa.item).esc[i])));
  const pbEsc    = [0,1,2,3].map(i=>promedio(conAB.map(n=>protTotales(n.flujo.pb.item).esc[i])));
  const deltaTot = promedio(conAB.map(n=>n.flujo.pb.deltas.total));

  const ciclos = activos.filter(n=>SECUENCIA.every(k=>n.flujo[k].firmado));
  return {activos, conLB, lbs, ideaEsc, ideaTot, banda, conAB, paEsc, pbEsc, deltaTot, ciclos};
}

function renderAnalitica(){
  const a    = analiticaAgregados();
  const nAct = a.activos.length;
  const ESCALAS_IDEA = ["Relación Social","Comunicación y Lenguaje","Anticipación / Flexibilidad","Simbolización"];
  const COLOR_ESC    = ["var(--teal)","var(--escB)","var(--purple)","var(--magenta)"];
  const MAX_IDEA_ESC = 24;   // 3 dimensiones × 8 puntos
  const MAX_PROT_ESC = 30;   // 6 ítems × 5 puntos
  const ancho = (v,max) => v==null ? 0 : Math.max(0, Math.min(100, v/max*100));
  const plural = (n,s,p) => n===1 ? s : p;

  /* --- KPIs --- */
  const cobertura = nAct ? Math.round(a.conLB.length/nAct*100) : 0;
  // deltaInterpreta clasifica un delta entero; el promedio se redondea sólo para elegir
  // la etiqueta/color, nunca para mostrar el número.
  const dInt = a.deltaTot==null ? null : deltaInterpreta(Math.round(a.deltaTot));
  const dTxt = a.deltaTot==null ? "—" : (a.deltaTot>0?"+":"") + fmt1(a.deltaTot);
  const kpis = [
    {lab:"Cobertura de línea base", val:`${cobertura} %`,
     sub:`${a.conLB.length} de ${nAct} NNA activos con HCE-LB firmada`},
    {lab:"IDEA promedio — línea base", val:`${fmt1(a.ideaTot)}<span class="kpi-den"> / 96</span>`,
     sub: a.ideaTot==null ? "Sin líneas base firmadas todavía"
        : `Banda ${bandaIdea(a.ideaTot)} · promedio de ${a.lbs.length} ${plural(a.lbs.length,"línea base","líneas base")}`},
    {lab:"Δ B−A · Escala IPPU-TEA", val:dTxt, color: dInt ? dInt.c : null,
     sub: a.conAB.length ? `${dInt.t} · ${a.conAB.length} de ${nAct} con ciclo A → B cerrado`
                         : "Ningún NNA con Protocolo A y B firmados"},
    {lab:"Ciclos completos", val:`${a.ciclos.length}<span class="kpi-den"> / ${nAct}</span>`, cls:"purple",
     sub:"CI → LB → PA → PB → IC firmados"}
  ];
  document.getElementById("anKpi").innerHTML = kpis.map(k=>`
    <div class="kpi"><div class="lab">${k.lab}</div>
      <div class="val ${k.cls||""}"${k.color?` style="color:${k.color}"`:""}>${k.val}</div>
      <div class="sub">${k.sub}</div></div>`).join("");

  /* --- Perfil poblacional por escala: línea base IDEA (máx. 24 por escala) --- */
  document.getElementById("escalasChart").innerHTML = a.lbs.length
    ? a.ideaEsc.map((v,i)=>`
        <div class="hbarrow"><div class="lab">${ESCALAS_IDEA[i]}</div>
          <div class="track"><div class="fill" style="width:${ancho(v,MAX_IDEA_ESC)}%;background:${COLOR_ESC[i]}">${fmt1(v)}</div></div></div>
      `).join("") +
      `<div class="note">Promedio por escala sobre ${a.lbs.length} ${plural(a.lbs.length,"línea base IDEA firmada","líneas base IDEA firmadas")} (máx. 24 pts por escala). <b>Menor puntaje = menor afectación.</b> Es una foto de la línea base, no una evolución: desde el Documento Técnico el IDEA se toma una sola vez por NNA (§5.1.1).</div>`
    : `<div class="empty-state"><div class="big">◔</div>Todavía no hay ninguna línea base IDEA firmada. El perfil poblacional aparece con la primera.</div>`;

  /* --- Evolución Protocolo A → B: Escala IPPU-TEA (máx. 30 por escala) --- */
  document.getElementById("protChart").innerHTML = a.conAB.length
    ? a.paEsc.map((v,i)=>`
        <div class="hbarrow"><div class="lab">${IPPU_ESCALAS[i]}</div>
          <div class="track"><div class="fill" style="width:${ancho(v,MAX_PROT_ESC)}%;background:#B9C6D6">${fmt1(v)}</div></div></div>
        <div class="hbarrow" style="margin-bottom:18px"><div class="lab" style="font-size:.68rem">→ Protocolo B</div>
          <div class="track"><div class="fill" style="width:${ancho(a.pbEsc[i],MAX_PROT_ESC)}%;background:${COLOR_ESC[i]}">${fmt1(a.pbEsc[i])}</div></div></div>
      `).join("") +
      `<div class="note">Promedio por escala de ${a.conAB.length} ${plural(a.conAB.length,"NNA con Protocolo A y B firmados","NNA con Protocolos A y B firmados")} (máx. 30 pts por escala). Barra gris = A · barra de color = B. <b>Acá el puntaje SUBE cuando hay progreso</b>, al revés que el IDEA: por eso los dos instrumentos nunca comparten eje ni se promedian juntos (§5.2).</div>`
    : `<div class="empty-state"><div class="big">◔</div>Ningún NNA tiene todavía el Protocolo A y el B firmados. La evolución A → B aparece al cerrarse el primer ciclo.</div>`;

  /* --- Distribución por banda de severidad (6 bandas §5.13/D4) --- */
  const BANDAS = IDEA_BANDAS.map((b,i)=>{
    const min = i===0 ? 0 : IDEA_BANDAS[i-1].max+1;
    const nombreCorto = b.perfil.split(" (")[0]; // corta el paréntesis descriptivo largo
    return [`${nombreCorto} (${min} – ${b.max}) · ${b.ns}`, b.perfil, b.color];
  });
  const nLb = a.lbs.length, sinLB = nAct - a.conLB.length;
  document.getElementById("distChart").innerHTML = BANDAS.map(b=>`
    <div class="hbarrow"><div class="lab">${b[0]}</div>
      <div class="track" style="height:24px"><div class="fill" style="width:${nLb ? a.banda[b[1]]/nLb*100 : 0}%;background:${b[2]}">${a.banda[b[1]]} NNA</div></div></div>
  `).join("") +
    `<div class="note">Distribución de ${nLb} ${plural(nLb,"línea base IDEA firmada","líneas base IDEA firmadas")} según la banda orientativa del puntaje total, con el soporte DSM-5-TR orientativo asociado. ` +
    (sinLB ? `Quedan fuera ${sinLB} ${plural(sinLB,"NNA activo sin línea base firmada","NNA activos sin línea base firmada")}.`
           : `Todos los NNA activos tienen su línea base firmada.`) + `</div>`;
}

// Heatmap talleres × escalas — datos ilustrativos (§5.1.3, fuera de alcance).
// Los nombres se alinean con los 14 reales del prototipo (§5.14 / D5); los valores no.
const talleres = [
  ["Taller de habilidades sociales",[2.1,1.4,0.8,1.0]],
  ["Taller de cuentos y estimulación del lenguaje",[1.2,2.0,0.5,0.9]],
  ["Educación Física",[0.6,0.4,1.1,0.3]],
  ["Actividades lúdicas y de juego",[1.0,0.8,0.6,1.8]],
  ["Taller de música y expresión",[0.9,1.1,0.7,1.2]],
  ["Taller de higiene y AVD",[0.4,0.3,1.6,0.2]]
];
const heatColor = v => v>=1.5 ? "#0E8F7E" : v>=0.9 ? "#6FBF9E" : v>=0.4 ? "#D9C26B" : "#C9CFD8";
document.getElementById("heatTable").innerHTML =
  `<tr><th class="row">Taller</th><th>Rel. Soc.</th><th>Comun.</th><th>Anticip.</th><th>Simbol.</th></tr>` +
  talleres.map(t=>`<tr><th class="row">${t[0]}</th>${t[1].map(v=>`<td><div class="heat-cell" style="background:${heatColor(v)}">${v.toFixed(1)}</div></td>`).join("")}</tr>`).join("");

// La distribución por banda de severidad se calcula en renderAnalitica() (más arriba),
// junto con los KPIs y los dos gráficos por escala.
/* ===================== TOAST ===================== */
function toast(msg){
  const t = document.getElementById("toast");
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
  Object.assign(EXP, {id:null, hce:null, raw:null, flujo:null, flujoError:false, tab:"hce00", ci:null, avisos:[], mods:null, idea:null});
  if(typeof evReiniciar === "function") evReiniciar(true);     // evaluaciones: ni borradores ni profesionales de la sesión anterior
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
  document.querySelectorAll("header.topbar, div.layout").forEach(el => { el.inert = si; });
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
  toast("Bienvenido, " + usuario.nombre);
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
  _el("loginApi").textContent = API_BASE;
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
