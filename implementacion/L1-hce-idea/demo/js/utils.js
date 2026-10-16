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
   - badgeSoloDemo(): marca chica de texto para un campo suelto sin respaldo en la API. */
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
/* Confirmacion de descarte DENTRO del dialogo (no es otro dialogo): banda destructiva con glifo + texto, el foco va a
   «Seguir editando» (lo seguro) y Esc tambien sigue editando. Devuelve false si ya estaba a la vista. */
function pedirDescarte(modal, alDescartar, alSeguir){
  if(!modal || modal.querySelector(".confirmar-descarte")) return false;
  const banda = document.createElement("div");
  banda.className = "confirmar-descarte"; banda.setAttribute("role", "alert");
  banda.innerHTML = `<span class="cd-txt" id="cdTxt"><span class="cd-glifo" aria-hidden="true">⚠</span>Hay datos sin guardar. Si cerrás, se pierden.</span>
    <span class="cd-acciones"><button type="button" class="btn btn-ghost" id="btnCdSeguir" aria-describedby="cdTxt">Seguir editando</button>
    <button type="button" class="btn btn-descartar" id="btnCdDescartar" aria-describedby="cdTxt">Descartar y cerrar</button></span>`;
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
  banda.querySelector("#btnCdDescartar").onclick = () => { quitar(); alDescartar(); };
  banda.addEventListener("keydown", ev => { if(ev.key === "Escape"){ ev.preventDefault(); ev.stopPropagation(); banda.querySelector("#btnCdSeguir").click(); } });
  banda.querySelector("#btnCdSeguir").focus();
  return true;
}
function descarteAbierto(modal){ return !!(modal && modal.querySelector(".confirmar-descarte")); }

/* Enlace «Saltar al contenido»: lleva el foco a <main> (tabindex="-1") sin tocar la URL. */
function saltarAlContenido(ev){
  if(ev) ev.preventDefault();
  const m = document.getElementById("contenido");
  if(m){ m.focus(); m.scrollIntoView({block: "start"}); }
  return false;
}
