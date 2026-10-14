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
