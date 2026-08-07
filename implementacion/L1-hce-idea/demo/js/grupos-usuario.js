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

/* ---------- GRUPOS DE REFERENCIA ---------- */
const GRUPOS = [
  {id:"A", franja:"6 – 9 años",  dias:"Lun · Mié · Vie", horario:"9:00 – 12:00",
   encargados:["Dr. González — Psicología","Lic. Pereira — Fonoaudiología"],
   talleres:["Habilidades sociales","Lenguaje y comunicación","Juego simbólico","Motricidad"],
   obs:"Grupo de menor edad. Énfasis en intervención temprana y juego."},
  {id:"B", franja:"9 – 12 años", dias:"Lun · Mié · Vie", horario:"13:00 – 16:00",
   encargados:["Lic. Torres — Psicopedagogía"],
   talleres:["Habilidades sociales","Música y expresión","Arte y plástica","Vida diaria (AVD)"],
   obs:"Trabajo en habilidades sociales y expresión."},
  {id:"C", franja:"12 – 15 años", dias:"Mar · Jue", horario:"9:00 – 12:00",
   encargados:["Lic. Pereira — Fonoaudiología","Dra. Silva — Neuropediatría"],
   talleres:["Lenguaje y comunicación","Vida diaria (AVD)","Psicomotricidad"],
   obs:"Mayor proporción de apoyos sustanciales. Foco en autonomía y CAA."},
  {id:"D", franja:"15 – 18 años", dias:"Mar · Jue", horario:"13:00 – 16:00",
   encargados:["Lic. Torres — Psicopedagogía"],
   talleres:["Vida diaria (AVD)","Cocina","Habilidades sociales"],
   obs:"Preparación para la vida adulta e inserción."},
  {id:"E", franja:"Multiedad — taller abierto", dias:"Vie", horario:"9:00 – 12:00",
   encargados:["Dr. González — Psicología"],
   talleres:["Música y expresión","Actividades lúdicas"],
   obs:"Espacio recreativo y de integración intergrupal."}
];

function renderGrupos(){
  const kpi = document.getElementById("gruposKpi");
  const cont = document.getElementById("gruposList");
  if(!kpi || !cont) return;
  kpi.innerHTML = `
    <div class="kpi"><div class="lab">Grupos de referencia</div><div class="val">${GRUPOS.length}</div><div class="sub">Por edad y modalidad</div></div>
    <div class="kpi"><div class="lab">NNA en seguimiento</div><div class="val ok">${NNA.length}</div><div class="sub">Distribuidos en grupos</div></div>
    <div class="kpi"><div class="lab">Técnicos asignados</div><div class="val purple">${new Set(GRUPOS.flatMap(g=>g.encargados)).size}</div><div class="sub">Encargados de grupo</div></div>
    <div class="kpi"><div class="lab">Talleres cubiertos</div><div class="val orange">${new Set(GRUPOS.flatMap(g=>g.talleres)).size}</div><div class="sub">de 18 institucionales</div></div>`;
  cont.innerHTML = GRUPOS.map(g=>{
    const integrantes = NNA.filter(n=>n.grupo===g.id);
    const intHtml = integrantes.length
      ? `<div class="row-actions">${integrantes.map(n=>`<button class="btn btn-link" onclick="abrirExpediente(${n.id})">${n.nombre} ${n.apellido} (${n.edad}a) →</button>`).join("")}</div>`
      : `<span style="font-size:.8rem;color:var(--ink-2)">Sin NNA cargados en este grupo (demo).</span>`;
    return `<div class="card" style="margin-bottom:18px">
      <div class="cardhead"><h2>Grupo ${g.id} <span style="font-weight:400;color:var(--ink-2);font-size:.8rem">· ${g.franja}</span></h2>
        <div style="flex:1"></div><span class="pill done">${integrantes.length} NNA</span></div>
      <div class="cardbody">
        <div class="data-row"><dt>Días / horario</dt><dd>${g.dias} · ${g.horario}</dd></div>
        <div class="data-row"><dt>Encargados</dt><dd>${g.encargados.join(" · ")}</dd></div>
        <div class="data-row"><dt>Talleres</dt><dd><div class="talleres-list">${g.talleres.map(t=>`<span class="taller-tag">${t}</span>`).join("")}</div></dd></div>
        <div class="data-row"><dt>Observaciones</dt><dd>${g.obs}</dd></div>
        <div class="data-row"><dt>Integrantes</dt><dd>${intHtml}</dd></div>
        ${(()=>{ const gi = grupoAutImagen(g.id); const nf = (GRUPOS_FOTOS[g.id]||[]).length;   // M7 · §8.4
          return `<div class="data-row"><dt>Fotos grupales</dt><dd>${gi.ok
            ? `<span style="color:var(--ok);font-weight:700">✓ Habilitadas</span> — todas las familias del grupo autorizan uso de imagen · ${nf} foto(s) <button class="btn btn-ghost btn-mini" onclick="subirFotoGrupo('${g.id}')">+ Foto grupal</button>`
            : `<span style="color:var(--warn);font-weight:700">🚫 Bloqueadas</span> — sin autorización de imagen: <b>${gi.faltan.map(n=>n.nombre+" "+n.apellido).join(", ")||"(sin integrantes activos)"}</b> <button class="btn btn-ghost btn-mini" onclick="subirFotoGrupo('${g.id}')">Intentar cargar</button>`}</dd></div>`;
        })()}
      </div>
    </div>`;
  }).join("");
}

/* ---------- USUARIO / PERFIL ---------- */
const USUARIO = {nombre:"Dr. González", rol:"Técnico · Psicología", email:"gonzalez@fundacionippu.uy", cargo:"Técnico de referencia", grupos:["A","E"]};
const EQUIPO = [
  {n:"Dr. González",  e:"Psicología",      g:"A · E"},
  {n:"Lic. Torres",   e:"Psicopedagogía",  g:"B · D"},
  {n:"Lic. Pereira",  e:"Fonoaudiología",  g:"A · C"},
  {n:"Dra. Silva",    e:"Neuropediatría",  g:"C"}
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

