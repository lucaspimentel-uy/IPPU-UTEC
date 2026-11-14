/* Helpers puros compartidos. Carga PRIMERO.
   Demo L1 HCE+IDEA - IPPU x UTEC-LIDIA.
   Reubicados desde el monolito porque el seed de un modulo anterior los invoca en carga;
   en el monolito los resolvia el hoisting de un unico <script>.
   Los scripts se cargan en orden en index.html: el orden ES la semantica. */
/* fmtFecha() - formato de fecha legible; lo usa el seed de flujo.js en carga. */
function fmtFecha(f){
  if(!f||f==="—") return "—";
  const meses=["ene","feb","mar","abr","may","jun","jul","ago","set","oct","nov","dic"];
  const d=new Date(f+"T00:00:00");
  if(isNaN(d)) return f;
  return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
}

/* escHtml() - escapa texto que viene de la API antes de meterlo en innerHTML.
   Los renderers de la demo original interpolan sin escapar (eran datos propios); lo que llega
   de la API es entrada de usuarios, asi que todo lo conectado pasa por aca. */
function escHtml(v){
  return String(v === null || v === undefined ? "" : v)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/* ===== Componente de modo demostracion (handoff §5.122, decision 2) =====
   Lo que NO viene de la API se distingue SIEMPRE de lo que si, con las mismas dos piezas:
   - panelModoDemo(): bloque para vistas y pestanas enteras no conectadas. Es texto + icono +
     borde punteado (no depende del color) y role="note".
   - badgeSoloDemo(): marca chica de texto para un campo suelto sin respaldo en la API (badgeSoloDemoTab: la compacta de las pestañas). */
function panelModoDemo(detalle){
  return `<div class="demo-panel" role="note">
    <span class="demo-panel-ico" aria-hidden="true">◇</span>
    <div><b>Modo demostración — no se guarda</b>
    <span class="demo-panel-txt">${detalle ? escHtml(detalle) : "Esta pantalla muestra datos de ejemplo y no está conectada a la API: nada de lo que se haga acá se guarda."}</span></div>
  </div>`;
}
function badgeSoloDemo(){
  return `<span class="solo-demo">Solo demo</span>`;
}
/* Versión compacta para las pestañas del expediente (F1b, §5.141): el glifo ◇ de los paneles de demostración y el texto sólo para
   lectores de pantalla; el panel de adentro de la pestaña lo dice completo. */
function badgeSoloDemoTab(){
  return `<span class="solo-demo"><span aria-hidden="true">◇</span><span class="sr-only"> Solo demo</span></span>`;
}
/* ===== Íconos (F3, §5.160): SVG en línea, trazo en currentColor, siempre decorativos (aria-hidden): el texto del control es su
   nombre accesible. Ningún emoji ni recurso de otro servidor. Los demás íconos de la interfaz son glifos de texto
   (✎ editar · + agregar · ✓ confirmar · ⚠ alerta · › ir · ‹ volver · ⌕ buscar · ● ◐ ○ estados · ◌ vacío · ◇ demostración · ☰ ▣ ⨯ ↻ ◷ ▤ ↑ ↓ → los que acompañan un estado vacío, una acción del expediente de ejemplo o un sentido). */
const _ICONOS = {
  imprimir: '<path d="M4 6V1.5h8V6"/><rect x="1.5" y="6" width="13" height="5.5" rx="1"/><path d="M4 9.5h8V14.5H4z"/>'
};
function iconoHtml(nombre){
  return `<svg class="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" aria-hidden="true" focusable="false">${_ICONOS[nombre] || ""}</svg>`;
}
/* Cada <div data-modo-demo> del index.html se completa con el panel (una sola definicion). */
function rellenarPanelesDemo(){
  document.querySelectorAll("[data-modo-demo]").forEach(el=>{
    el.innerHTML = panelModoDemo(el.getAttribute("data-modo-demo") || "");
  });
}

/* ===== Estados compartidos: cargando · error (con Reintentar) · vacío (Fase 3-e, handoff §5.135) =====
   UN componente para todas las pantallas conectadas (antes cada una armaba el suyo, con roles y botones distintos):
   - cargando: role="status" (se anuncia sin interrumpir);
   - error:    role="alert", el mensaje de la API tal cual y «Reintentar» (primario) + acciones extra opcionales;
   - vacío:    el estado normal de un recurso que todavía no existe (no es un error).
   El glifo es decorativo (aria-hidden): lo que se lee es el texto. `reintentar` es el código JS del onclick. */
function estadoCargandoHtml(msg){
  return `<div class="empty-state estado-carga" role="status"><div class="big" aria-hidden="true">…</div><p class="estado-msg">${escHtml(msg || "Cargando…")}</p></div>`;
}
function estadoErrorHtml(msg, reintentar, extras){
  return `<div class="empty-state estado-error" role="alert"><div class="big" aria-hidden="true">!</div><p class="estado-msg">${escHtml(msg)}</p>
    <div class="estado-acciones">${reintentar ? `<button type="button" class="btn btn-primary btn-mini" data-reintentar onclick="${reintentar}">Reintentar</button>` : ""}${extras || ""}</div></div>`;
}
/* Error de una parte de la pantalla (p. ej. la lista de profesionales): mismo rol y mismo botón, en línea. */
function estadoErrorInlineHtml(msg, reintentar){
  return `<p class="estado-inline" role="alert"><span aria-hidden="true">!</span><span class="estado-msg-txt">${escHtml(msg)}</span>${reintentar ? `<button type="button" class="btn btn-ghost btn-mini" data-reintentar onclick="${reintentar}">Reintentar</button>` : ""}</p>`;
}
/* `htmlMsg` ya viene escapado por quien llama (puede llevar <b>); `acciones` es HTML de botones. */
function estadoVacioHtml(glifo, htmlMsg, acciones){
  return `<div class="empty-state estado-vacio" role="status"><div class="big" aria-hidden="true">${glifo || "◌"}</div><div class="estado-msg">${htmlMsg}</div>${acciones ? `<div class="estado-acciones">${acciones}</div>` : ""}</div>`;
}

/* ===== Dialogos modales: trampa de Tab, foco de vuelta y confirmacion al descartar (Fase 3-e) ===== */
const _FOCO_SEL = "button:not([disabled]):not([hidden]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), a[href], summary, [tabindex='0']";
/* Tab no sale del dialogo: el ultimo control vuelve al primero y viceversa. `titulo`: el encabezado con tabindex="-1"
   donde cae el foco al abrir (Mayus+Tab desde ahi va al ultimo control). */
function atraparTab(e, raiz, tituloId){
  if(e.key !== "Tab" || !raiz) return;
  const foco = [...raiz.querySelectorAll(_FOCO_SEL)].filter(el => el.offsetParent !== null);
  if(!foco.length) return;
  const a = foco[0], z = foco[foco.length - 1], act = document.activeElement;
  if(e.shiftKey && (act === a || (tituloId && act && act.id === tituloId) || !raiz.contains(act))){ e.preventDefault(); z.focus(); }
  else if(!e.shiftKey && (act === z || !raiz.contains(act))){ e.preventDefault(); a.focus(); }
}
/* Foto de lo tipeado: valor de cada campo del contenedor. Sirve para saber si hay algo sin guardar. */
function fotoCampos(raiz){
  if(!raiz) return "";
  return JSON.stringify([...raiz.querySelectorAll("input, textarea, select")].filter(e => e.type !== "hidden")
    .map(e => [e.id || e.name || "", (e.type === "checkbox" || e.type === "radio") ? e.checked : e.value]));
}
/* Deja los campos vacios (descartar y cerrar). */
function vaciarCampos(raiz){
  if(!raiz) return;
  raiz.querySelectorAll("input, textarea, select").forEach(e => {
    if(e.type === "checkbox" || e.type === "radio") e.checked = false;
    else if(e.tagName === "SELECT") e.selectedIndex = 0;
    else e.value = "";
  });
}
/* Confirmacion DENTRO del dialogo (no es otro dialogo): banda destructiva con glifo + texto y dos botones. El foco va al seguro
   («Seguir editando», no manda nada) y Esc tambien lo elige. Una sola banda a la vez; devuelve false si ya estaba a la vista.
   La usan el descarte (pedirDescarte) y la conversion de un ateneo clinico (ateneos.js): misma banda, mismos ids y clases, asi
   que descarteAbierto() y el cierre / Esc del dialogo las tratan igual. */
function pedirConfirmacion(modal, {texto, rotuloSeguir, rotuloConfirmar, alConfirmar, alSeguir}){
  if(!modal || modal.querySelector(".confirmar-descarte")) return false;
  const banda = document.createElement("div");
  banda.className = "confirmar-descarte"; banda.setAttribute("role", "alert");
  banda.innerHTML = `<span class="cd-txt" id="cdTxt"><span class="cd-glifo" aria-hidden="true">⚠</span>${escHtml(texto)}</span>
    <span class="cd-acciones"><button type="button" class="btn btn-ghost" id="btnCdSeguir" aria-describedby="cdTxt">${escHtml(rotuloSeguir)}</button>
    <button type="button" class="btn btn-descartar" id="btnCdDescartar" aria-describedby="cdTxt">${escHtml(rotuloConfirmar)}</button></span>`;
  const previo = document.activeElement;                    // el campo donde se estaba: «Seguir editando» vuelve ahí
  const cab = modal.querySelector(".modal-head");
  cab.insertAdjacentElement("afterend", banda);
  const quitar = () => { banda.remove(); };
  banda.querySelector("#btnCdSeguir").onclick = () => {
    quitar();
    const vuelta = previo && modal.contains(previo) && previo.offsetParent !== null ? previo : modal.querySelector("h2[tabindex]");
    if(vuelta) vuelta.focus();
    if(alSeguir) alSeguir();
  };
  banda.querySelector("#btnCdDescartar").onclick = () => { quitar(); alConfirmar(); };
  banda.addEventListener("keydown", ev => { if(ev.key === "Escape"){ ev.preventDefault(); ev.stopPropagation(); banda.querySelector("#btnCdSeguir").click(); } });
  banda.querySelector("#btnCdSeguir").focus();
  return true;
}
function pedirDescarte(modal, alDescartar, alSeguir){
  return pedirConfirmacion(modal, {texto: "Hay datos sin guardar. Si cerrás, se pierden.", rotuloSeguir: "Seguir editando",
    rotuloConfirmar: "Descartar y cerrar", alConfirmar: alDescartar, alSeguir});
}
function descarteAbierto(modal){ return !!(modal && modal.querySelector(".confirmar-descarte")); }

/* Enlace «Saltar al contenido»: lleva el foco a <main> (tabindex="-1") sin tocar la URL. */
function saltarAlContenido(ev){
  if(ev) ev.preventDefault();
  const m = document.getElementById("contenido");
  if(m){ m.focus(); m.scrollIntoView({block: "start"}); }
  return false;
}

/* ===== Descripción detrás de un chevron (L1, §5.171; antes un «?», L0 §5.169) =====
   UN componente para el texto que sólo explica una pestaña o sección bajo su título (antes siempre a la vista). Es una divulgación,
   no un tooltip: un <button class="btn-desc"> con un chevron (›, hacia la derecha cerrado y hacia abajo abierto; sin animación si el
   usuario pidió menos movimiento) junto al título, con aria-expanded, aria-controls y el nombre «Descripción: <título>» (notas-accesibilidad-ui
   §2.6); y el texto, sin cambios, en un panel `.ayuda-panel` con `hidden` que abre justo debajo del título y empuja el contenido. Clic,
   Enter y Espacio alternan (es un <button>); Esc lo cierra y devuelve el foco al botón. Con `rotulo` el botón lleva ese texto visible
   (el nombre accesible es ese texto) y el chevron: es el caso de lo que NO describe la pestaña abierta (los estados del ciclo anual,
   «Cómo puntuar»). NO va detrás de un chevron: errores, estados, avisos de bloque, «Modo demostración» y todo lo que dice por qué una acción
   está bloqueada. Una descripción abierta sigue abierta tras repintar la pestaña (se guarda por id). */
const _AYUDA_ABIERTAS = new Set();
let _ayudaUltima = null;
const _CHEVRON = '<svg class="ico-chev" viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M6 3l5 5-5 5"/></svg>';
function ayudaBotonHtml(clave, titulo, rotulo){
  const id = "btnAyuda_" + clave;
  return `<button type="button" class="btn-desc${rotulo ? " btn-desc-txt" : ""}" id="${id}" aria-expanded="${_AYUDA_ABIERTAS.has(id)}" aria-controls="ayuda_${clave}"${rotulo ? "" : ` aria-label="Descripción: ${escHtml(titulo)}"`} onclick="ayudaAlternar('${id}')">${rotulo ? `<span>${escHtml(rotulo)}</span>` : ""}${_CHEVRON}</button>`;
}
/* Cabecera de módulo (.mod-cab) con su descripción: el chevron va justo después del <h2> y el panel justo debajo de la cabecera. */
function cabConAyudaHtml(cab, clave, titulo, notaHtml){
  return cab.replace("</h2>", "</h2>" + ayudaBotonHtml(clave, titulo)) + ayudaPanelHtml(clave, notaHtml);
}
function ayudaCerrarTodas(){
  document.querySelectorAll(".btn-desc[aria-expanded='true']").forEach(b => ayudaAlternar(b.id, false));
  _AYUDA_ABIERTAS.clear(); _ayudaUltima = null;
}
function ayudaPanelHtml(clave, html){
  return `<div class="ayuda-panel" id="ayuda_${clave}"${_AYUDA_ABIERTAS.has("btnAyuda_" + clave) ? "" : " hidden"}>${html}</div>`;
}
/* `idBoton` es el id del <button>; su panel es el de aria-controls. `abrir` fuerza el estado; sin él, alterna. */
function ayudaAlternar(idBoton, abrir){
  const b = document.getElementById(idBoton), p = b && document.getElementById(b.getAttribute("aria-controls"));
  if(!b || !p) return;
  const abre = abrir === undefined ? p.hidden : !!abrir;
  p.hidden = !abre; b.setAttribute("aria-expanded", String(abre));
  if(abre){ _AYUDA_ABIERTAS.add(idBoton); _ayudaUltima = idBoton; }
  else { _AYUDA_ABIERTAS.delete(idBoton); if(_ayudaUltima === idBoton) _ayudaUltima = null; }
}
/* Esc: sólo si el foco está en el botón, dentro de su panel o en ningún lado (tras tocar el texto del panel); así no pisa a un diálogo. */
document.addEventListener("keydown", e => {
  if(e.key !== "Escape" || e.defaultPrevented) return;
  const f = document.activeElement, t = f && f !== document.body ? f : null;
  let idBoton = null;
  if(t){
    const b = t.closest(".btn-desc"), p = t.closest(".ayuda-panel");
    idBoton = b ? b.id : p ? (document.querySelector(`.btn-desc[aria-controls="${p.id}"]`) || {}).id : null;
  } else idBoton = _ayudaUltima;
  const b = idBoton && document.getElementById(idBoton), p = b && document.getElementById(b.getAttribute("aria-controls"));
  if(!p || p.hidden) return;
  e.preventDefault();
  ayudaAlternar(idBoton, false);
  b.focus();
});
