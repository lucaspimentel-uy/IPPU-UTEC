/* M10 - Recordatorios de periodos del Manual + wiring de modales.
   Demo L1 HCE+IDEA - IPPU x UTEC-LIDIA.
   Extraido del monolito (lineas 3766-3824) sin cambios de logica.
   Los scripts se cargan en orden en index.html: el orden ES la semantica. */
/* ============ RECORDATORIOS · PERÍODOS DEL MANUAL (M10, §4) ============
   Avisos en el panel institucional, configurables por coordinación (demo: en
   memoria). NUNCA fechas límite bloqueantes: informan, no impiden firmar. */
const RECORDATORIOS = [
  {key:"lb", txt:"Aplicación del IDEA (HCE-LB) en las primeras semanas del ingreso", periodo:"Al ingreso", activo:true},
  {key:"pa", txt:"Protocolo A (HCE-PA) durante el receso de julio",                  periodo:"Julio",      activo:true},
  {key:"pb", txt:"Protocolo B (HCE-PB) en la última semana lectiva",                 periodo:"Diciembre",  activo:true},
  {key:"ic", txt:"Informe de Cierre (HCE-IC) en los días posteriores al Protocolo B",periodo:"Días post-PB", activo:true},
];
/* Pendientes de un recordatorio: NNA activos con el módulo previo firmado y éste sin firmar. */
function recordatorioPendientes(key){
  const prev = {lb:"ci", pa:"lb", pb:"pa", ic:"pb"}[key];
  return NNA.filter(n=>n.activo && n.flujo[prev].firmado && !n.flujo[key].firmado);
}
function renderRecordatorios(){
  const el = document.getElementById("recordatoriosBody"); if(!el) return;
  el.innerHTML = `<table class="comp-table"><thead><tr><th style="width:60px">Activo</th><th>Recordatorio</th><th style="width:150px">Período (editable)</th><th>Pendientes</th></tr></thead><tbody>
    ${RECORDATORIOS.map((r,i)=>{
      const pend = r.activo ? recordatorioPendientes(r.key) : [];
      const pendHtml = !r.activo ? `<span style="color:var(--ink-2);font-size:.76rem">— desactivado —</span>`
        : pend.length ? pend.map(n=>`<button class="btn btn-link" onclick="abrirExpedienteDemo(${n.id})">${n.nombre} ${n.apellido} →</button>`).join(" ")
        : `<span style="color:var(--ok);font-size:.78rem;font-weight:700">✓ al día</span>`;
      return `<tr style="${r.activo?"":"opacity:.55"}">
        <td><input type="checkbox" ${r.activo?"checked":""} onchange="recToggle(${i},this.checked)"></td>
        <td style="font-size:.82rem">${r.txt}</td>
        <td><input value="${r.periodo}" onchange="recPeriodo(${i},this.value)" style="width:100%"></td>
        <td>${pendHtml}</td></tr>`;
    }).join("")}
  </tbody></table>
  <div style="font-size:.72rem;color:var(--ink-2);margin-top:8px">Recordatorios configurables por coordinación (demo: en memoria). <b>Nunca son fechas límite bloqueantes</b> (§4): informan al equipo, no impiden registrar ni firmar módulos. Las alertas de organismos (AYEX 60/30) y de valoración funcional (90/30, §7.8) viven en HCE-ORG y HCE-VF.</div>`;
}
function recToggle(i,v){ RECORDATORIOS[i].activo = v; renderRecordatorios(); }
function recPeriodo(i,v){ RECORDATORIOS[i].periodo = v; }

/* Fotos grupales: guardar no requiere autorización ni produce aviso (§5.99). */
const GRUPOS_FOTOS = {};   // grupo -> [{desc, fecha}] (en memoria, demo)
function subirFotoGrupo(gid){
  (GRUPOS_FOTOS[gid] = GRUPOS_FOTOS[gid]||[]).push({desc:"Registro grupal", fecha:HOY});
  renderGrupos();
  toast("Fotografía grupal cargada (demo).");
}

// El dialogo de alta/edicion ya NO se cierra al hacer clic en el fondo (Fase 3-b): es un formulario largo y un
// clic de mas perderia lo tipeado. Se cierra con «×», con Cancelar o con Escape.
// cerrar modal con Escape
document.addEventListener("keydown", e=>{ if(e.key==="Escape"){ closeAlta(); closeFlujoModal(); } });

