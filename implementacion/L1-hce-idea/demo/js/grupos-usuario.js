/* Grupos de referencia y Mi usuario (v3.1) + render inicial.
   Demo L1 HCE+IDEA - IPPU x UTEC-LIDIA.
   Extraido del monolito (lineas 3825-3946) sin cambios de logica.
   Los scripts se cargan en orden en index.html: el orden ES la semantica. */
/* =====================================================================
   MÓDULOS AÑADIDOS (v3.1): Grupos, Usuario.
   M7 (2026-07-30): el código de "Eval. por áreas" y "Eval. general"
   (provisionales, ocultas desde M0) se ELIMINÓ — decisión §0.2 del plan:
   sus registros del sistema anterior viven ahora en HCE-DOC como archivo
   histórico de solo lectura ("Registro histórico — HCE anterior", §10).
   ===================================================================== */

/* ---------- GRUPOS DE REFERENCIA ----------
   §5.18 / D9: los grupos reales de IPPU son por color (Azul · Celeste · Naranja · Verde).
   La letra A..E era invención de la demo original; el prototipo v4 confirma los 4 colores.
   El grupo E ("Multiedad — taller abierto") se retira: no existe en el dominio real. */
/* F1-nav (2026-08-16): GRUPOS pasa a tener nómina §21.1 (Manual de Procedimientos):
   responsable1/2 con alcance "HCE completa del grupo · firma" y tecnicosAutorizados[]
   con alcance "Texto libre donde participa". Antes había un array plano `encargados`
   que no distinguía roles ni permitía altas/bajas — se retira.
   Limitación conocida: los cambios de responsable NO quedan en HCE-LOG (que hoy es
   por NNA, no por grupo). Ver handoff §5.18 y §7. */
const GRUPOS = [
  {id:"Azul", franja:"6 – 9 años",  dias:"Lun · Mié · Vie", horario:"9:00 – 12:00",
   responsable1:{nombre:"Dr. González", rol:"Psicología"},
   responsable2:{nombre:"Lic. Pereira", rol:"Fonoaudiología"},
   tecnicosAutorizados:[],
   talleres:["Taller de habilidades sociales","Taller de cuentos y estimulación del lenguaje","Actividades lúdicas y de juego","Educación Física"],
   obs:"Grupo de menor edad. Énfasis en intervención temprana y juego."},
  {id:"Celeste", franja:"9 – 12 años", dias:"Lun · Mié · Vie", horario:"13:00 – 16:00",
   responsable1:{nombre:"Lic. Torres", rol:"Psicopedagogía"},
   responsable2:null,
   tecnicosAutorizados:[],
   talleres:["Taller de habilidades sociales","Taller de música y expresión","Taller de expresión plástica","Taller de higiene y AVD"],
   obs:"Trabajo en habilidades sociales y expresión."},
  {id:"Naranja", franja:"12 – 15 años", dias:"Mar · Jue", horario:"9:00 – 12:00",
   responsable1:{nombre:"Lic. Pereira", rol:"Fonoaudiología"},
   responsable2:{nombre:"Dra. Silva", rol:"Neuropediatría"},
   tecnicosAutorizados:[],
   talleres:["Taller de cuentos y estimulación del lenguaje","Taller de higiene y AVD","Actividades sensoriales"],
   obs:"Mayor proporción de apoyos sustanciales. Foco en autonomía y CAA."},
  {id:"Verde", franja:"15 – 18 años", dias:"Mar · Jue", horario:"13:00 – 16:00",
   responsable1:{nombre:"Lic. Torres", rol:"Psicopedagogía"},
   responsable2:null,
   tecnicosAutorizados:[],
   talleres:["Taller de higiene y AVD","Taller de cocina","Taller de habilidades sociales"],
   obs:"Preparación para la vida adulta e inserción."}
];

/* Nómina completa del grupo (responsables + otros habilitados) para la tabla §21.1. */
function todosTecnicosDelGrupo(g){
  const filas = [];
  if(g.responsable1) filas.push({nombre:g.responsable1.nombre, rol:g.responsable1.rol, alcance:"HCE completa del grupo · firma", esResponsable:1});
  if(g.responsable2) filas.push({nombre:g.responsable2.nombre, rol:g.responsable2.rol, alcance:"HCE completa del grupo · firma", esResponsable:2});
  (g.tecnicosAutorizados||[]).forEach((t,ix) => filas.push({...t, alcance:t.alcance||"Texto libre donde participa", esResponsable:0, ixAutorizado:ix}));
  return filas;
}

function renderGrupos(){
  const kpi = document.getElementById("gruposKpi");
  const cont = document.getElementById("gruposList");
  if(!kpi || !cont) return;
  const tecnicosUnicos = new Set(GRUPOS.flatMap(g=>todosTecnicosDelGrupo(g).map(t=>t.nombre)));
  kpi.innerHTML = `
    <div class="kpi"><div class="lab">Grupos de referencia</div><div class="val">${GRUPOS.length}</div><div class="sub">Por edad y modalidad</div></div>
    <div class="kpi"><div class="lab">NNA en seguimiento</div><div class="val ok">${NNA.length}</div><div class="sub">Distribuidos en grupos</div></div>
    <div class="kpi"><div class="lab">Técnicos asignados</div><div class="val purple">${tecnicosUnicos.size}</div><div class="sub">Responsables + habilitados (§21.1)</div></div>
    <div class="kpi"><div class="lab">Talleres cubiertos</div><div class="val orange">${new Set(GRUPOS.flatMap(g=>g.talleres)).size}</div><div class="sub">de 14 institucionales</div></div>`;
  cont.innerHTML = GRUPOS.map(g=>{
    const integrantes = NNA.filter(n=>n.grupo===g.id);
    const intHtml = integrantes.length
      ? `<div class="row-actions">${integrantes.map(n=>`<button class="btn btn-link" onclick="abrirExpediente(${n.id})">${n.nombre} ${n.apellido} (${n.edad}a) →</button>`).join("")}</div>`
      : `<span style="font-size:.8rem;color:var(--ink-2)">Sin NNA cargados en este grupo (demo).</span>`;
    const filasTec = todosTecnicosDelGrupo(g);
    const tecTable = `
      <div class="hint" style="margin-bottom:8px">Los técnicos responsables acceden a la HCE completa de los integrantes del grupo. Los demás técnicos habilitados acceden únicamente a los campos de texto libre donde participan (Manual, §21.1). Esta nómina la administra coordinación.</div>
      <table class="tec-aut-table"><thead><tr><th>Profesional</th><th>Rol / disciplina</th><th>Alcance</th><th></th></tr></thead><tbody>
        ${filasTec.map(t => `<tr>
          <td>${t.nombre}${t.esResponsable ? ` <span class="pill done" style="font-size:.62rem;margin-left:6px">Resp. ${t.esResponsable}</span>` : ""}</td>
          <td>${t.rol}</td>
          <td>${t.alcance}</td>
          <td>${t.esResponsable
            ? `<button class="btn btn-ghost btn-mini" onclick="abrirCambioResponsable('${g.id}', ${t.esResponsable})">✎ Cambiar</button>`
            : `<button class="btn btn-ghost btn-mini" onclick="quitarTecnicoAutorizado('${g.id}', ${t.ixAutorizado})">Quitar</button>`}
          </td>
        </tr>`).join("")}
      </tbody></table>
      <div class="tec-aut-alta">
        <input placeholder="Nombre" id="ta_${g.id}_nombre">
        <input placeholder="Disciplina" id="ta_${g.id}_rol">
        <button class="btn btn-ghost btn-mini" onclick="agregarTecnicoAutorizado('${g.id}')">+ Agregar técnico autorizado</button>
      </div>`;
    return `<div class="card" id="grp-${g.id}" style="margin-bottom:18px">
      <div class="cardhead">
        <h2>Grupo ${g.id} <span style="font-weight:400;color:var(--ink-2);font-size:.8rem">· ${g.franja}</span></h2>
        <div style="flex:1"></div>
        <button class="btn btn-ghost btn-mini" onclick="scrollASeccion('grp-${g.id}')" title="Ir al detalle del grupo">→ Abrir detalle</button>
        <span class="pill done">${integrantes.length} NNA</span>
      </div>
      <div class="cardbody">
        <div class="section-nav no-print">
          <span class="section-nav-lbl">Ir a sección:</span>
          <button class="btn btn-ghost btn-mini" onclick="scrollASeccion('grp-${g.id}-integrantes')">👥 Integrantes y estado del ciclo</button>
          <button class="btn btn-ghost btn-mini" onclick="scrollASeccion('grp-${g.id}-tecnicos')">👤 Técnicos autorizados del grupo</button>
          <button class="btn btn-ghost btn-mini" onclick="scrollASeccion('grp-${g.id}-fotos')">📷 Registro fotográfico grupal</button>
        </div>
        <div class="data-row"><dt>Días / horario</dt><dd>${g.dias} · ${g.horario}</dd></div>
        <div class="data-row"><dt>Talleres</dt><dd><div class="talleres-list">${g.talleres.map(t=>`<span class="taller-tag">${t}</span>`).join("")}</div></dd></div>
        <div class="data-row"><dt>Observaciones</dt><dd>${g.obs}</dd></div>
        <div class="data-row" id="grp-${g.id}-integrantes"><dt>Integrantes</dt><dd>${intHtml}</dd></div>
        <div class="data-row" id="grp-${g.id}-tecnicos"><dt>Técnicos autorizados</dt><dd>${tecTable}</dd></div>
        ${(()=>{ const gi = grupoAutImagen(g.id); const nf = (GRUPOS_FOTOS[g.id]||[]).length;   // M7 · §8.4
          return `<div class="data-row" id="grp-${g.id}-fotos"><dt>Fotos grupales</dt><dd>${gi.ok
            ? `<span style="color:var(--ok);font-weight:700">✓ Habilitadas</span> — todas las familias del grupo autorizan uso de imagen · ${nf} foto(s) <button class="btn btn-ghost btn-mini" onclick="subirFotoGrupo('${g.id}')">+ Foto grupal</button>`
            : `<span style="color:var(--warn);font-weight:700">🚫 Bloqueadas</span> — sin autorización de imagen: <b>${gi.faltan.map(n=>n.nombre+" "+n.apellido).join(", ")||"(sin integrantes activos)"}</b> <button class="btn btn-ghost btn-mini" onclick="subirFotoGrupo('${g.id}')">Intentar cargar</button>`}</dd></div>`;
        })()}
      </div>
    </div>`;
  }).join("");
}

/* ---------- F1-nav: alta/baja de técnicos autorizados y cambio de responsables ----------
   HCE-LOG a nivel grupo no existe hoy (la bitácora es por NNA). Los cambios NO quedan
   registrados; sólo se muestran los datos actualizados. Ver handoff §7 y §5.18. */
function agregarTecnicoAutorizado(gid){
  const g = GRUPOS.find(x=>x.id===gid); if(!g) return;
  const nombre = (document.getElementById(`ta_${gid}_nombre`).value||"").trim();
  const rol = (document.getElementById(`ta_${gid}_rol`).value||"").trim();
  if(!nombre || !rol){ toast("Ingresá nombre y disciplina."); return; }
  g.tecnicosAutorizados = g.tecnicosAutorizados||[];
  g.tecnicosAutorizados.push({nombre, rol, alcance:"Texto libre donde participa"});
  renderGrupos();
  toast(`Técnico/a autorizado/a agregado/a al Grupo ${gid}.`);
}
function quitarTecnicoAutorizado(gid, ix){
  const g = GRUPOS.find(x=>x.id===gid); if(!g || !g.tecnicosAutorizados) return;
  const t = g.tecnicosAutorizados[ix]; if(!t) return;
  g.tecnicosAutorizados.splice(ix,1);
  renderGrupos();
  toast(`«${t.nombre}» quitado/a del Grupo ${gid}.`);
}
function abrirCambioResponsable(gid, num){
  const g = GRUPOS.find(x=>x.id===gid); if(!g) return;
  const actual = num===1 ? g.responsable1 : g.responsable2;
  const body = `<div class="section-label">Técnico/a responsable ${num} · Grupo ${gid}</div>
    <p style="font-size:.8rem;color:var(--ink-2);margin-bottom:12px">Alcance fijo: <b>HCE completa del grupo · firma</b>. El cambio se aplica desde ya para todos los integrantes activos del grupo.</p>
    <div class="field"><label>Nombre</label><input id="cr_nombre" value="${actual?actual.nombre:""}"></div>
    <div class="field"><label>Disciplina</label><input id="cr_rol" value="${actual?actual.rol:""}" placeholder="Ej. Psicología, Fonoaudiología, Psicopedagogía"></div>
    <p style="font-size:.72rem;color:var(--warn);margin-top:8px">⚠ El cambio no queda registrado en HCE-LOG (la bitácora hoy es por NNA, no por grupo). Ver handoff §5.18.</p>`;
  const foot = `<span class="left">Grupo ${gid} · §21.1 Manual de Procedimientos</span>
    <div style="display:flex;gap:10px">
      <button class="btn btn-ghost" onclick="closeFlujoModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="confirmarCambioResponsable('${gid}', ${num})">Guardar cambio</button>
    </div>`;
  openFlujoModal(`Cambiar Técnico/a responsable ${num}`, `Grupo ${gid}`, body, foot);
}
function confirmarCambioResponsable(gid, num){
  const g = GRUPOS.find(x=>x.id===gid); if(!g) return;
  const nombre = (document.getElementById("cr_nombre").value||"").trim();
  const rol = (document.getElementById("cr_rol").value||"").trim();
  if(!nombre || !rol){ toast("Nombre y disciplina son obligatorios."); return; }
  if(num===1) g.responsable1 = {nombre, rol};
  else g.responsable2 = {nombre, rol};
  closeFlujoModal();
  renderGrupos();
  toast(`Técnico/a responsable ${num} del Grupo ${gid} actualizado/a.`);
}

/* ---------- USUARIO / PERFIL ---------- */
const USUARIO = {nombre:"Dr. González", rol:"Técnico · Psicología", email:"gonzalez@fundacionippu.uy", cargo:"Técnico de referencia", grupos:["Azul"]};
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
        <h3><span class="ic">▤</span> Datos de la cuenta</h3>
        <div class="ib">
          <div class="data-row"><dt>Nombre</dt><dd>${u.nombre}</dd></div>
          <div class="data-row"><dt>Rol</dt><dd>${u.rol}</dd></div>
          <div class="data-row"><dt>Email</dt><dd>${u.email}</dd></div>
          <div class="data-row"><dt>Grupos a cargo</dt><dd>${u.grupos.join(" · ")}</dd></div>
          <div class="data-row"><dt>Acceso</dt><dd>Restringido a los grupos que coordina</dd></div>
        </div>
      </div>
      <div class="info-card">
        <h3><span class="ic">◫</span> Equipo técnico</h3>
        <div class="ib">
          ${EQUIPO.map(t=>`<div class="data-row"><dt>${t.n}</dt><dd>${t.e} · Grupos ${t.g}</dd></div>`).join("")}
        </div>
      </div>
    </div>
    <div class="note" style="margin-top:6px">Demo: el control de acceso real (autenticación JWT por terapeuta, roles y visibilidad por grupo) se implementa en el backend. Cada técnico solo ve los NNA de los grupos que coordina.</div>`;
}

/* ---------- Wiring + render inicial de los módulos nuevos ---------- */
document.querySelectorAll('.navitem[data-view="grupos"]').forEach(b=>b.addEventListener("click", renderGrupos));
document.querySelectorAll('.navitem[data-view="usuarios"]').forEach(b=>b.addEventListener("click", renderUsuario));
document.querySelectorAll('.navitem[data-view="analitica"]').forEach(b=>b.addEventListener("click", renderRecordatorios));

renderGrupos();
renderUsuario();
renderRecordatorios();

