/* HCE-LOG conectado (C1): pestaña «Auditoría» del expediente. SOLO LECTURA.
   Demo L1 HCE+IDEA - IPPU x UTEC-LIDIA.
   GET /hce/{id}/auditoria?modulo=&tipo=&limit=&offset= (la más nueva primero; total en X-Total-Count). Registra CAMBIOS, no accesos
   (puntos-a-validar §2.17, abierto): ver el LOG no deja rastro. No hay botón «Ver auditoría» en el expediente conectado: esta pestaña
   es la única entrada (§5.140). El modal «Ver auditoría» del expediente de ejemplo (flujo.js) no se toca.
   Los scripts se cargan en orden en index.html: el orden ES la semantica. */
const LOG = {hceId: null, estado: "cargando", filas: [], total: 0, modulo: "", tipo: "", pagina: 0, carga: 0, error: "", noEncontrado: false};
const LOG_POR_PAGINA = 25;
const LOG_CORTO = 120;       // un valor más largo se acorta y lleva «ver completo»: nunca se corta sin decirlo

/* Valores válidos de los filtros (los mismos que acepta la API; cualquier otro es 422). Módulos con su nombre en palabras. */
const LOG_MODULOS = [
  ["HCE-00", "Datos (HCE-00)"], ["HCE-CI", "Consentimiento (CI)"], ["HCE-LB", "Línea base (LB)"], ["HCE-PA", "Protocolo A (PA)"],
  ["HCE-PB", "Protocolo B (PB)"], ["HCE-IC", "Informe de cierre (IC)"], ["HCE-VF", "Valoración funcional (VF)"],
  ["HCE-SEV", "Severidad (SEV)"], ["HCE-INC", "Inclusión (INC)"], ["HCE-ORG", "Organismos (ORG)"],
  ["HCE-DOC", "Documentos (DOC)"], ["HCE-PAI", "PAI"]
];
const LOG_TIPOS = [
  ["carga", "Se creó un registro"], ["edicion", "Se editó un campo"], ["firma", "Se firmó"], ["addenda", "Se agregó una addenda"],
  ["excepcion", "Fuera de secuencia"], ["alerta", "Alerta registrada"]
];
const _logNombre = (lista, k) => { const e = lista.find(x => x[0] === k); return e ? e[1] : k; };

function logReiniciar(){
  LOG.carga++;
  Object.assign(LOG, {hceId: null, estado: "cargando", filas: [], total: 0, modulo: "", tipo: "", pagina: 0, error: "", noEncontrado: false});
}

/* ---------- Carga ---------- */
function logMostrar(){
  if(LOG.hceId !== EXP.id){ logReiniciar(); LOG.hceId = EXP.id; }
  logCargar(LOG.estado === "listo");        // al volver a la pestaña se vuelve a pedir (el LOG crece con cada acción), sin vaciar lo que ya se ve
}
async function logCargar(conservar){
  const mi = EXP.seq, id = EXP.id;
  if(id === null) return;
  if(!conservar) LOG.estado = "cargando";
  const n = ++LOG.carga;
  const vigente = () => mi === EXP.seq && LOG.hceId === id && n === LOG.carga;
  if(LOG.estado === "cargando") logRepintar();
  try{
    const r = await apiFetch(`/hce/${id}/auditoria`, {query: {modulo: LOG.modulo, tipo: LOG.tipo, limit: LOG_POR_PAGINA, offset: LOG.pagina * LOG_POR_PAGINA}});
    if(!vigente()) return;
    LOG.filas = Array.isArray(r.data) ? r.data : [];
    LOG.total = r.total === null ? LOG.filas.length : r.total;
    if(!LOG.filas.length && LOG.pagina > 0 && LOG.total > 0){ LOG.pagina = Math.ceil(LOG.total / LOG_POR_PAGINA) - 1; logCargar(true); return; }
    LOG.estado = "listo";
  }catch(err){
    if(!vigente()) return;
    LOG.estado = "error";
    LOG.noEncontrado = err instanceof ApiError && err.status === 404;
    LOG.error = err instanceof ApiError ? err.message : "No se pudo cargar el registro de cambios.";
  }
  logRepintar();
}
function logReintentar(){ logCargar(false); }

/* ---------- Filtros y paginado ---------- */
function logFiltrar(){
  const m = document.getElementById("logModulo"), t = document.getElementById("logTipo");
  LOG.modulo = m ? m.value : ""; LOG.tipo = t ? t.value : ""; LOG.pagina = 0;
  logCargar(true);
}
function logPagina(delta){
  const ultima = Math.max(0, Math.ceil(LOG.total / LOG_POR_PAGINA) - 1);
  LOG.pagina = Math.min(ultima, Math.max(0, LOG.pagina + delta));
  logCargar(true);
}

/* ---------- Render ---------- */
function logRepintar(){
  if(EXP.tab !== "log") return;
  const p = document.getElementById("panelExp"); if(!p) return;
  const foco = document.activeElement && p.contains(document.activeElement) ? document.activeElement.id : null;
  p.innerHTML = logPanelHtml();
  if(foco){ const b = document.getElementById(foco); if(b && !b.disabled) b.focus(); }
}

/* ts llega con zona horaria: se muestra en la hora local del navegador (es-UY). */
function logFechaHora(ts){
  const d = new Date(ts);
  if(isNaN(d)) return escHtml(ts);
  return escHtml(d.toLocaleString("es-UY", {day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false}));
}
/* Un valor guardado como texto. Un JSON (anamnesis…) se muestra legible: en una línea si entra, y con sangría al «ver completo». */
function logTextoLegible(v){
  const s = String(v);
  if(/^\s*[\[{]/.test(s)){ try{ return JSON.stringify(JSON.parse(s), null, 2); }catch(_e){ /* no era JSON: va tal cual */ } }
  return s;
}
function logValorHtml(v){
  if(v === null || v === undefined) return `<span class="log-vacio">(vacío)</span>`;
  const t = logTextoLegible(v);
  const esJson = t !== String(v);                          // un texto con saltos de línea propios no se aplana: va al «ver completo»
  const enLinea = (esJson ? t.replace(/\s*\n\s*/g, " ") : t).trim();
  if(enLinea.length <= LOG_CORTO && (esJson || t.indexOf("\n") < 0)) return `<span class="log-valor">${escHtml(enLinea)}</span>`;
  const corto = enLinea.slice(0, LOG_CORTO - 20).trimEnd();
  return `<span class="log-valor">${escHtml(corto)}…</span>
    <details class="log-ver"><summary>ver completo<span class="sr-only"> el valor</span></summary><pre class="log-pre">${escHtml(t)}</pre></details>`;
}
function logCambioHtml(f){
  if(f.campo === null && f.valor_ant === null && f.valor_nuevo === null) return "—";
  return `<div class="log-antes"><span class="log-rot">Antes:</span> ${logValorHtml(f.valor_ant)}</div>
    <div class="log-despues"><span class="log-rot">Después:</span> ${logValorHtml(f.valor_nuevo)}</div>`;
}
function logFilaHtml(f){
  const quien = f.usuario ? `${escHtml(f.usuario.nombre)}` : `<span class="log-vacio">(sin autor)</span>`;
  const mod = f.modulo ? `<b>${escHtml(f.modulo)}</b>` : "—";
  return `<tr>
    <td class="log-ts">${logFechaHora(f.ts)}</td>
    <td>${quien}</td>
    <td>${mod}</td>
    <td><span class="log-tipo lt-edicion">${escHtml(_logNombre(LOG_TIPOS, f.tipo))}</span>${f.detalle ? `<div class="log-detalle">${escHtml(f.detalle)}</div>` : ""}</td>
    <td>${f.campo ? `<span class="cod">${escHtml(f.campo)}</span>` : "—"}</td>
    <td class="log-cambio">${logCambioHtml(f)}</td>
  </tr>`;
}
function logFiltrosHtml(){
  const opc = (lista, sel) => `<option value="">Todos</option>` + lista.map(([k, n]) => `<option value="${k}"${k === sel ? " selected" : ""}>${escHtml(n)}</option>`).join("");
  return `<div class="log-filtros">
    <div class="field"><label for="logModulo">Módulo</label><select id="logModulo" onchange="logFiltrar()">${opc(LOG_MODULOS, LOG.modulo)}</select></div>
    <div class="field"><label for="logTipo">Qué pasó</label><select id="logTipo" onchange="logFiltrar()">${opc(LOG_TIPOS, LOG.tipo)}</select></div>
  </div>`;
}
function logPaginadoHtml(){
  const desde = LOG.pagina * LOG_POR_PAGINA + 1, hasta = Math.min(LOG.total, desde + LOG.filas.length - 1);
  const ultima = Math.ceil(LOG.total / LOG_POR_PAGINA) - 1;
  return `<nav class="log-paginado" aria-label="Paginado del registro de cambios">
    <span class="log-rango" role="status">Mostrando ${desde}–${hasta} de ${LOG.total}</span>
    <button type="button" class="btn btn-ghost btn-mini" id="btnLogAnt" onclick="logPagina(-1)"${LOG.pagina <= 0 ? " disabled" : ""}>‹ Anteriores</button>
    <button type="button" class="btn btn-ghost btn-mini" id="btnLogSig" onclick="logPagina(1)"${LOG.pagina >= ultima ? " disabled" : ""}>Siguientes ›</button>
  </nav>`;
}
function logPanelHtml(){
  const cab = `<div class="mod-cab"><h2 id="logTitulo" tabindex="-1">LOG · Registro de cambios</h2></div>`;
  const nota = `<p class="hint log-nota">Registra cambios, no accesos. Es de solo lectura: nada de lo que se ve acá se puede modificar.</p>`;
  let cuerpo;
  if(LOG.hceId !== EXP.id || LOG.estado === "cargando") cuerpo = estadoCargandoHtml("Cargando el registro de cambios…");
  else if(LOG.estado === "error") cuerpo = estadoErrorHtml(LOG.noEncontrado ? "No se encontró el expediente." : LOG.error, LOG.noEncontrado ? "" : "logReintentar()");
  else {
    const filtrado = LOG.modulo || LOG.tipo;
    const lista = LOG.filas.length
      ? `<div class="log-scroll" role="region" aria-label="Tabla del registro de cambios (se desplaza)" tabindex="0"><table class="log-table" aria-label="Registro de cambios del expediente, el más reciente primero">
          <thead><tr><th scope="col">Fecha y hora</th><th scope="col">Quién</th><th scope="col">Módulo</th><th scope="col">Qué pasó</th><th scope="col">Campo</th><th scope="col">Antes → después</th></tr></thead>
          <tbody>${LOG.filas.map(logFilaHtml).join("")}</tbody></table></div>${logPaginadoHtml()}`
      : estadoVacioHtml("☰", filtrado ? "No hay cambios que coincidan con los filtros." : "Este expediente todavía no tiene cambios registrados.");
    cuerpo = `${logFiltrosHtml()}${lista}`;
  }
  return `${cab}<div class="info-card"><div class="ib">${nota}${cuerpo}</div></div>`;
}
