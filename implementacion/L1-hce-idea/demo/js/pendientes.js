/* Vista Pendientes — conectada a la API (F2, handoff §5 «F2»).
   Demo L1 HCE+IDEA - IPPU x UTEC-LIDIA.
   Qué le falta a cada NNA activo este año: el consentimiento (CI) y cada uno de LB, PA, PB, IC cuyo estado no es «firmado».
   Datos: GET /hce (cada fila trae `ci` y `flujo` del año en curso; un técnico sólo recibe los de sus grupos) y
   GET /recordatorios (los períodos del Manual §4, sólo lectura).
   Reglas: contar filas es presentación; no se infiere «el próximo paso», no hay fechas ni plazos y nada se bloquea
   (el CI no traba, §5.94; los períodos orientan, no son fechas límite, consulta-a-ippu §2.7). Los estados son los de la API
   y se pintan con el vocabulario del listado (ESTADO_MOD_TXT / pills de ui-core.js): ok/warn/bad nunca sobre un estado de módulo. */

/* Filtros: «ci» = consentimiento; el resto, el módulo de la cadena. `todo` no filtra. */
const PEND_FILTROS = [
  {k:"todo", rot:"Todo"},
  {k:"ci",   rot:"Consentimiento"},
  {k:"lb",   rot:"Línea base",         modulo:"HCE-LB", corto:"LB"},
  {k:"pa",   rot:"Protocolo A",        modulo:"HCE-PA", corto:"PA"},
  {k:"pb",   rot:"Protocolo B",        modulo:"HCE-PB", corto:"PB"},
  {k:"ic",   rot:"Informe de cierre",  modulo:"HCE-IC", corto:"IC"}
];
const PEND_VACIO = {todo:"Nada pendiente este año.", ci:"Ningún consentimiento pendiente este año.", lb:"Nada pendiente de línea base este año.",
  pa:"Nada pendiente del Protocolo A este año.", pb:"Nada pendiente del Protocolo B este año.", ic:"Nada pendiente del informe de cierre este año."};
/* Los recordatorios que orientan la cadena del año; los otros (AYEX, VF, INC, INAU) piden datos por expediente: fuera de esta vista. */
const PEND_CLAVES_REC = ["lb", "pa", "pb", "ic"];

const PEND = { seq:0, estado:"vacio", error:"", filas:[], recs:[], filtro:"todo", pedido:null };

/* Lo que le falta a una fila: [{k, ...}] en el orden de la cadena (CI, LB, PA, PB, IC). */
function pendItems(f){
  const items = [];
  if(f.ciEstado !== "registrado") items.push({k:"ci"});
  PEND_FILTROS.filter(x => x.modulo).forEach(x => {
    const estado = f.modulos[x.modulo];
    if(estado !== "firmado") items.push({k:x.k, modulo:x.modulo, corto:x.corto, estado:ESTADO_MOD_TXT[estado] ? estado : "sin_iniciar"});
  });
  return items;
}
/* Pill con glifo + texto visibles («LB en curso»): la misma clase y el mismo glifo que el listado. */
function pendPill(it){
  if(it.k === "ci") return `<span class="st st-ci-pend"><span aria-hidden="true">⚠</span> CI pendiente</span>`;
  const e = ESTADO_MOD_TXT[it.estado];
  return `<span class="st st-${it.estado}"><span aria-hidden="true">${e.glifo}</span> ${it.corto} ${e.txt}</span>`;
}
/* Las filas con algo pendiente, con sus items (los NNA sin nada pendiente no se listan). */
function pendConItems(){
  return PEND.filas.map(f => ({f, items:pendItems(f)})).filter(x => x.items.length);
}
function pendCuenta(k, lista){
  return k === "todo" ? lista.length : lista.filter(x => x.items.some(i => i.k === k)).length;
}

/* ---------- carga ---------- */
function pendPedirFiltro(k){ PEND.pedido = PEND_FILTROS.some(x => x.k === k) ? k : null; }
function pendAlAbrir(){
  PEND.filtro = PEND.pedido || "todo";
  PEND.pedido = null;
  pendCargar();
}
function pendDescripcion(){
  const u = Sesion.usuario();
  const de = u && u.rol === "admin" ? "de todos los grupos" : "de tus grupos";
  return `Lo que todavía tiene por hacer este año cada NNA activo ${de}: el consentimiento y, de la línea base al informe de cierre, cada módulo sin firmar. `
    + `Los períodos del Manual orientan: no son fechas límite y no se bloquea nada.`;
}
async function pendCargar(){
  const mi = ++PEND.seq;
  PEND.estado = "cargando";
  pendPintar();
  try{
    const [filas, recs] = await Promise.all([traerTodo({incluir_inactivos:false}), apiFetch("/recordatorios")]);
    if(mi !== PEND.seq) return;     // llegó una respuesta vieja (o se salió de la sesión): se descarta
    PEND.filas = filas.filter(f => f.activo);
    PEND.recs = recs.data;
    PEND.estado = "listo";
  }catch(err){
    if(mi !== PEND.seq) return;
    PEND.estado = "error";
    PEND.error = err instanceof ApiError ? err.message : "No se pudieron cargar los pendientes.";
  }
  pendPintar();
}
/* «Salir» / 401: la vista queda vacía y una respuesta en vuelo ya no se pinta. */
function pendOlvidarSesion(){
  PEND.seq++;
  Object.assign(PEND, {estado:"vacio", error:"", filas:[], recs:[], filtro:"todo", pedido:null});
  const c = document.getElementById("pendContenido"); if(c) c.innerHTML = "";
  const d = document.getElementById("pendDesc"); if(d) d.textContent = "";
}

/* ---------- pintar ---------- */
function pendOrientacionHtml(){
  const recs = PEND.recs.filter(r => r.activo && PEND_CLAVES_REC.includes(r.clave));
  if(!recs.length) return "";
  return `<details class="pend-orient" id="pendOrient"><summary>Períodos que orientan el año (Manual, §4)</summary>
    <ul class="pend-orient-lista">${recs.map(r => `<li data-clave="${escHtml(r.clave)}">${escHtml(r.texto)} <span class="pend-periodo">· ${escHtml(r.periodo)}</span></li>`).join("")}</ul>
    <p class="hint">Orientan, no son fechas límite: ninguno bloquea registrar ni firmar.</p></details>`;
}
function pendFilaHtml(x){
  const f = x.f, nombre = escHtml(`${f.nombre} ${f.apellido}`.trim());
  return `<tr data-hce="${f.id}" onclick="filaNNAClic(event, ${f.id})">
    <td class="nna">
      <button type="button" class="nna-abrir" onclick="abrirExpediente(${f.id})" aria-label="Abrir expediente de ${nombre}">${nombre}</button>
      <span class="nna-sub">HC <span class="cod">${escHtml(f.hc)}</span>${f.edad === null ? "" : ` · ${f.edad} años`}</span>
    </td>
    <td>${f.grupo ? escHtml(f.grupo) : "—"}</td>
    <td><span class="st-grupo st-pend">${x.items.map(pendPill).join(" ")}</span></td>
    <td class="col-ir" aria-hidden="true">›</td>
  </tr>`;
}
function pendPintar(){
  const cont = document.getElementById("pendContenido"); if(!cont) return;
  const desc = document.getElementById("pendDesc"); if(desc) desc.textContent = PEND.estado === "vacio" ? "" : pendDescripcion();
  if(PEND.estado === "cargando"){ cont.innerHTML = estadoCargandoHtml("Cargando los pendientes…"); return; }
  if(PEND.estado === "error"){ cont.innerHTML = estadoErrorHtml(PEND.error, "pendCargar()"); return; }
  if(PEND.estado !== "listo"){ cont.innerHTML = ""; return; }
  const lista = pendConItems();
  const visibles = PEND.filtro === "todo" ? lista : lista.filter(x => x.items.some(i => i.k === PEND.filtro));
  const chips = PEND_FILTROS.map(x => {
    const on = x.k === PEND.filtro;
    return `<button type="button" class="chip-estado${on ? " active" : ""}" data-filtro="${x.k}" aria-pressed="${on}" onclick="pendFiltrar('${x.k}')">${x.rot} <span class="chip-n">${pendCuenta(x.k, lista)}</span></button>`;
  }).join("");
  cont.innerHTML = `${pendOrientacionHtml()}
    <div class="card">
      <div class="cardhead"><h2>Falta este año</h2></div>
      <div class="nna-toolbar"><div class="estado-chips" role="group" aria-label="Qué falta">${chips}</div></div>
      <div class="tabla-scroll">
        <table class="lista" id="tablaPend">
          <caption class="sr-only">NNA activos con algo pendiente este año</caption>
          <thead><tr><th scope="col">NNA</th><th scope="col">Grupo</th><th scope="col">Falta este año</th><th scope="col" class="col-ir"><span class="sr-only">Abrir</span></th></tr></thead>
          <tbody id="tbodyPend">${visibles.length ? visibles.map(pendFilaHtml).join("")
            : `<tr><td colspan="4">${estadoVacioHtml("✓", PEND_VACIO[PEND.filtro])}</td></tr>`}</tbody>
        </table>
      </div>
      <div class="lista-pie"><span id="pendResumen" role="status" aria-live="polite">${visibles.length} NNA con pendientes</span>
        <span class="hint">◐ en curso · ○ sin iniciar</span></div>
    </div>`;
}
function pendFiltrar(k){
  PEND.filtro = k;
  pendPintar();
  const chip = document.querySelector(`#pendContenido .chip-estado[data-filtro="${k}"]`);
  if(chip) chip.focus();     // el repintado reemplaza los botones: el foco vuelve al que se tocó
}
