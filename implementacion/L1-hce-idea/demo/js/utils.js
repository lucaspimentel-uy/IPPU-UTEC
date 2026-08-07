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
