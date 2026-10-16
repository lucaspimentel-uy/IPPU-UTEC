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
/* F1-nav2 (2026-08-17): la vista Grupos se parte en LISTADO + DETALLE, alineando
   con vGrupos/vGrupoDetalle del Prototipo v4 (`HCE_IPPU_Prototipo_v4.html:2295-2349`).
   El bloque "Técnicos autorizados del grupo" pasa a ser CONDICIONAL: sólo se muestra
   si el usuario tiene rol de Coordinación / Dirección técnica (Manual §21.1). En la
   demo se simula con USUARIO.puedeAdministrarTecnicos; en el sistema real sale del
   backend según la matriz de roles. */
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
  if(g.responsable1) filas.push({nombre:g.responsable1.nombre, rol:"Técnico/a responsable 1", disciplina:g.responsable1.rol, alcance:"HCE completa del grupo · firma", esResponsable:1});
  if(g.responsable2) filas.push({nombre:g.responsable2.nombre, rol:"Técnico/a responsable 2", disciplina:g.responsable2.rol, alcance:"HCE completa del grupo · firma", esResponsable:2});
  (g.tecnicosAutorizados||[]).forEach((t,ix) => filas.push({nombre:t.nombre, rol:t.rol, disciplina:t.rol, alcance:t.alcance||"Aportes en campos de texto libre de PA, PB e IC", esResponsable:0, ixAutorizado:ix}));
  return filas;
}

/* Estado local: cuál grupo se está viendo en detalle. null = listado. */
let _grupoAbierto = null;

/* Nº de HCE derivado del id numérico. En la demo no hay `hc` como campo; el prototipo
   v4 lo muestra como "HC-2025-014" — replicamos el formato para consistencia visual.
   El año viene del año de alta si existe (p.altaFecha), si no, del año en curso. */
function nroHC(n){
  const anio = (n.altaFecha ? String(n.altaFecha).slice(0,4) : new Date().getFullYear().toString());
  return `HC-${anio}-${String(n.id).padStart(3,"0")}`;
}

/* Permiso para ver/administrar la nómina §21.1 (Técnicos autorizados del grupo).
   Demo: se controla con un toggle en /usuarios. Sistema real: sale del rol asignado
   (Coordinación / Dirección técnica); un Técnico común no debería verla. */
function puedeAdministrarTecnicos(){ return !!(typeof USUARIO !== "undefined" && USUARIO.puedeAdministrarTecnicos); }

/* ============ VISTA GRUPOS · LISTADO ============ */
function renderGrupos(){
  _grupoAbierto = null;
  const kpi = document.getElementById("gruposKpi");
  const cont = document.getElementById("gruposList");
  if(!kpi || !cont) return;
  kpi.style.display = "";
  const tecnicosUnicos = new Set(GRUPOS.flatMap(g=>todosTecnicosDelGrupo(g).map(t=>t.nombre)));
  kpi.innerHTML = `
    <div class="kpi"><div class="lab">Grupos de referencia</div><div class="val">${GRUPOS.length}</div><div class="sub">Por edad y modalidad</div></div>
    <div class="kpi"><div class="lab">NNA en seguimiento</div><div class="val">${NNA.length}</div><div class="sub">Distribuidos en grupos</div></div>
    <div class="kpi"><div class="lab">Técnicos asignados</div><div class="val purple">${tecnicosUnicos.size}</div><div class="sub">Responsables + habilitados (§21.1)</div></div>
    <div class="kpi"><div class="lab">Talleres cubiertos</div><div class="val orange">${new Set(GRUPOS.flatMap(g=>g.talleres)).size}</div><div class="sub">de 14 institucionales</div></div>`;
  cont.innerHTML = `
    <div class="crumbs">Institucional › <b>Grupos de referencia</b></div>
    <h1 class="pagetitle">Grupos de referencia</h1>
    <p class="pagedesc">La atención del Servicio de Atención Diurna se organiza en grupos de referencia por edad y modalidad de funcionamiento. El grupo es la unidad de intervención y de planificación (Manual, §2). Tocá un grupo para ver el detalle.</p>
    <div class="grupos-grid">
    ${GRUPOS.map(g=>{
      const integrantes = NNA.filter(n=>n.grupo===g.id);
      const nf = (GRUPOS_FOTOS[g.id]||[]).length;
      const r1 = g.responsable1 ? g.responsable1.nombre : "—";
      const r2 = g.responsable2 ? g.responsable2.nombre : "—";
      const miniRows = integrantes.length
        ? integrantes.map(n => {
            const firmados = ["ci","lb","pa","pb","ic"].filter(k=>estadoModulo(n,k)==="firmado").length;
            return `<tr><td><button class="btn btn-link" onclick="abrirExpedienteDemo(${n.id})">${n.nombre} ${n.apellido}</button></td><td style="text-align:right;color:var(--ink-2);font-variant-numeric:tabular-nums">${firmados}/5</td></tr>`;
          }).join("")
        : `<tr><td colspan="2" style="color:var(--ink-2);font-size:.78rem">Sin NNA asignados.</td></tr>`;
      return `<div class="card grupo-card">
        <div class="cardhead">
          <h2><button class="btn-link h2-link" onclick="abrirGrupo('${g.id}')">Grupo ${g.id}</button>
            <span style="font-weight:400;color:var(--ink-2);font-size:.8rem">· ${g.franja}</span></h2>
          <div style="flex:1"></div>
          <span class="pill neutro">${integrantes.length} NNA</span>
        </div>
        <div class="cardbody">
          <div class="hint" style="margin-bottom:8px">Técnicos responsables: ${r1} · ${r2}</div>
          <table class="grupo-mini"><tbody>${miniRows}</tbody></table>
          <div class="hint" style="margin-top:8px">${integrantes.length} integrante(s) · ${nf} foto(s) grupal(es)</div>
          <button class="btn btn-ghost" style="margin-top:10px" onclick="abrirGrupo('${g.id}')">→ Abrir grupo</button>
        </div>
      </div>`;
    }).join("")}
    </div>`;
}

/* ============ VISTA GRUPOS · DETALLE ============
   Se dispara al clickear un grupo del listado. Replaza el contenido de #gruposList
   con la vista detalle; #gruposKpi se oculta. Volver al listado = renderGrupos(). */
function abrirGrupo(gid){
  _grupoAbierto = gid;
  renderGrupoDetalle(gid);
  // El scroll al top de la sección ayuda cuando venís de un grupo bajo el fold.
  const view = document.getElementById("view-grupos");
  if(view) view.scrollIntoView({behavior:"smooth", block:"start"});
}
function renderGrupoDetalle(gid){
  const g = GRUPOS.find(x=>x.id===gid); if(!g) return renderGrupos();
  const kpi = document.getElementById("gruposKpi");
  const cont = document.getElementById("gruposList");
  if(!kpi || !cont) return;
  kpi.style.display = "none";
  const integrantes = NNA.filter(n=>n.grupo===g.id);
  const r1 = g.responsable1 ? g.responsable1.nombre : "—";
  const r2 = g.responsable2 ? g.responsable2.nombre : "—";
  // Tabla de integrantes: NNA | CIE-11 · Soporte | CI · LB · PA · PB · IC | Uso de imagen
  const filas = integrantes.map(n => {
    const cie11 = (n.cie11||"—").split("—")[0].trim();
    const badges = ["ci","lb","pa","pb","ic"].map(k => {
      const st = estadoModulo(n, k);
      return `<span class="mbadge mb-${st}" title="${k.toUpperCase()}: ${st}">${k.toUpperCase()}</span>`;
    }).join(" ");
    const imgOk = !!(n.autImagen && n.autImagen.registrada);
    const imgBadge = imgOk
      ? `<span class="mbadge mb-firmado">Imagen: sí</span>`
      : `<span class="mbadge mb-sin">Imagen: no</span>`;
    return `<tr>
      <td>
        <button class="btn btn-link" onclick="abrirExpedienteDemo(${n.id})"><b>${n.nombre} ${n.apellido}</b> (${n.sexo?.[0]||"?"}, ${n.edad} años)</button>
        <div class="hint">${nroHC(n)} · CI ${n.ci||"—"}</div>
      </td>
      <td>${cie11}<div class="hint">${n.apoyo||"Sin soporte registrado"}</div></td>
      <td>${badges}</td>
      <td>${imgBadge}</td>
    </tr>`;
  }).join("");
  // §5.14 / D5 — los talleres que dicta el grupo. F1 dejó sólo el KPI agregado ("Talleres
  // cubiertos: N de 14") y perdió el detalle por grupo, que es el dato que D5 pide que se vea.
  // Se restaura en el markup y el estilo de F1: .talleres-list/.taller-tag siguen definidas en
  // estilos.css (restiladas por F1) y habían quedado sin uso.
  const talleresCard = `
    <div class="card"><div class="cardbody"><h3>Talleres del grupo</h3>
      ${(g.talleres && g.talleres.length)
        ? `<div class="talleres-list">${g.talleres.map(t=>`<span class="taller-tag">${t}</span>`).join("")}</div>
           <div class="hint" style="margin-top:8px">${g.talleres.length} de los 14 talleres institucionales (§5.14 · D5).</div>`
        : `<div class="hint">Sin talleres asignados a este grupo (demo).</div>`}
    </div></div>`;
  const integrantesCard = `
    <div class="card"><div class="cardbody"><h3>Integrantes y estado del ciclo</h3>
      ${integrantes.length
        ? `<table class="grupo-integrantes"><thead><tr><th>NNA</th><th>CIE-11 · Soporte</th><th>CI · LB · PA · PB · IC</th><th>Uso de imagen</th></tr></thead><tbody>${filas}</tbody></table>`
        : `<div class="hint">Sin NNA asignados a este grupo (demo).</div>`}
    </div></div>`;
  // Bloque §21.1 — CONDICIONAL al permiso del usuario
  const puede = puedeAdministrarTecnicos();
  const filasTec = todosTecnicosDelGrupo(g);
  const tecnicosCard = puede ? `
    <div class="card"><div class="cardbody"><h3>Técnicos autorizados del grupo</h3>
      <div class="hint" style="margin-bottom:8px">Los técnicos responsables acceden a la HCE completa de los integrantes del grupo. Los demás técnicos habilitados acceden únicamente a los campos de texto libre donde participan (Manual, §21.1). Esta nómina la administra coordinación.</div>
      <table class="tec-aut-table"><thead><tr><th>Profesional</th><th>Rol / disciplina</th><th>Alcance</th><th></th></tr></thead><tbody>
        ${filasTec.map(t => `<tr>
          <td>${t.nombre}</td>
          <td>${t.esResponsable ? `${t.rol}${t.disciplina?` <span class="hint">· ${t.disciplina}</span>`:""}` : t.disciplina}</td>
          <td>${t.alcance}</td>
          <td>${t.esResponsable
            ? `<button class="btn btn-ghost btn-mini" onclick="abrirCambioResponsable('${g.id}', ${t.esResponsable})">✎ Cambiar</button>`
            : `<button class="btn btn-ghost btn-mini" onclick="quitarTecnicoAutorizado('${g.id}', ${t.ixAutorizado})">Quitar</button>`}</td>
        </tr>`).join("")}
      </tbody></table>
      <div class="tec-aut-alta">
        <input placeholder="Nombre del profesional" id="ta_${g.id}_nombre">
        <input placeholder="Disciplina — Fonoaudiología, T.O., Psicomotricidad…" id="ta_${g.id}_rol">
        <button class="btn btn-ghost btn-mini" onclick="agregarTecnicoAutorizado('${g.id}')">Autorizar</button>
      </div>
    </div></div>` : "";
  // Bloque fotografía grupal
  const fotos = GRUPOS_FOTOS[g.id]||[];
  const fotosCard = `
    <div class="card"><div class="cardbody"><h3>Registro fotográfico grupal</h3>
      <div class="uprow no-print">
        <div style="flex:1"><label style="font-size:.75rem;color:var(--ink-2)">Fotografía grupal</label><input type="file" id="gf_file_${g.id}" accept="image/*"></div>
        <div style="flex:1"><label style="font-size:.75rem;color:var(--ink-2)">Descripción / actividad</label><input type="text" id="gf_desc_${g.id}" placeholder="Ej.: salida didáctica, taller de música…"></div>
        <div style="flex:0;align-self:end"><button class="btn btn-primary" onclick="subirFotoGrupo('${g.id}')">Cargar</button></div>
      </div>
      ${fotos.length
        ? `<div class="thumbs" style="margin-top:12px">${fotos.map(f=>`<div class="thumb"><div class="thumb-img">📷</div><div class="cap">${f.desc||"Sin descripción"}<br><span class="hint">${f.fecha}</span></div></div>`).join("")}</div>`
        : `<div class="hint" style="margin-top:10px">Sin fotografías grupales registradas.</div>`}
    </div></div>`;
  cont.innerHTML = `
    <div class="crumbs"><button class="btn-link" onclick="renderGrupos()">Grupos de referencia</button> › <b>Grupo ${g.id}</b></div>
    <div class="pagehead">
      <h1>Grupo ${g.id} <span style="font-weight:400;color:var(--ink-2);font-size:.9rem">· ${g.franja}</span></h1>
      <p class="pagedesc">Técnicos responsables: <b>${r1}</b> · <b>${r2}</b> · ${integrantes.length} integrante(s) · ${g.dias} · ${g.horario}</p>
      ${g.obs ? `<p class="pagedesc" style="font-style:italic">${g.obs}</p>` : ""}
    </div>
    ${talleresCard}
    ${integrantesCard}
    ${tecnicosCard}
    ${!puede ? `<div class="notice info" style="margin:14px 0"><b>Nómina §21.1 no visible:</b> tu rol actual (${(typeof USUARIO !== "undefined" && USUARIO.cargo) || "técnico"}) no incluye la administración de técnicos autorizados del grupo. Coordinación / Dirección técnica pueden verla y modificarla.</div>` : ""}
    ${fotosCard}`;
}

/* ---------- F1-nav: alta/baja de técnicos autorizados y cambio de responsables ----------
   HCE-LOG a nivel grupo no existe hoy (la bitácora es por NNA). Los cambios NO quedan
   registrados; sólo se muestran los datos actualizados. Ver handoff §7 y §5.18. */
function _refrescarVistaGrupos(){
  if(_grupoAbierto) renderGrupoDetalle(_grupoAbierto);
  else renderGrupos();
}
function agregarTecnicoAutorizado(gid){
  const g = GRUPOS.find(x=>x.id===gid); if(!g) return;
  const nombre = (document.getElementById(`ta_${gid}_nombre`).value||"").trim();
  const rol = (document.getElementById(`ta_${gid}_rol`).value||"").trim();
  if(!nombre || !rol){ toast("Ingresá nombre y disciplina."); return; }
  g.tecnicosAutorizados = g.tecnicosAutorizados||[];
  g.tecnicosAutorizados.push({nombre, rol, alcance:"Aportes en campos de texto libre de PA, PB e IC"});
  _refrescarVistaGrupos();
  toast(`Técnico/a autorizado/a agregado/a al Grupo ${gid}.`);
}
function quitarTecnicoAutorizado(gid, ix){
  const g = GRUPOS.find(x=>x.id===gid); if(!g || !g.tecnicosAutorizados) return;
  const t = g.tecnicosAutorizados[ix]; if(!t) return;
  g.tecnicosAutorizados.splice(ix,1);
  _refrescarVistaGrupos();
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
      <button class="btn btn-ghost" onclick="cerrarFlujoModalUsuario()">Cancelar</button>
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
  _refrescarVistaGrupos();
  toast(`Técnico/a responsable ${num} del Grupo ${gid} actualizado/a.`);
}

/* ---------- USUARIO / PERFIL ----------
   F1-nav2 (2026-08-17): USUARIO.puedeAdministrarTecnicos controla si se ve la nómina
   §21.1. En el sistema real esto sale del rol asignado; acá es un toggle demo. */
const USUARIO = {
  nombre:"Dr. González", rol:"Técnico · Psicología", email:"gonzalez@fundacionippu.uy",
  cargo:"Técnico de referencia", grupos:["Azul"],
  puedeAdministrarTecnicos:false
};
const EQUIPO = [
  {n:"Dr. González",  e:"Psicología",      g:"Azul"},
  {n:"Lic. Torres",   e:"Psicopedagogía",  g:"Celeste · Verde"},
  {n:"Lic. Pereira",  e:"Fonoaudiología",  g:"Azul · Naranja"},
  {n:"Dra. Silva",    e:"Neuropediatría",  g:"Naranja"}
];
function toggleCoordinacionDemo(v){
  USUARIO.puedeAdministrarTecnicos = !!v;
  toast(v ? "Rol simulado: acceso a nómina §21.1 habilitado." : "Rol simulado: acceso a nómina §21.1 deshabilitado.");
  // Si el detalle de un grupo está abierto, re-renderizamos para reflejar el cambio.
  if(_grupoAbierto) renderGrupoDetalle(_grupoAbierto);
}
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
        <h3><span class="ic">▤</span> Datos del perfil de ejemplo</h3>
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
      <div class="info-card" style="grid-column:1/-1">
        <h3><span class="ic">🔐</span> Permisos (simulación demo)</h3>
        <div class="ib">
          <label style="display:flex;gap:10px;align-items:flex-start;cursor:pointer">
            <input type="checkbox" ${u.puedeAdministrarTecnicos?"checked":""} onchange="toggleCoordinacionDemo(this.checked)" style="margin-top:3px">
            <span>
              <b>Simular rol con acceso a la nómina §21.1</b> (Coordinación / Dirección técnica).
              <div class="hint" style="margin-top:4px">Habilita ver y administrar el bloque «Técnicos autorizados del grupo» en el detalle de cada grupo. En el sistema definitivo esto lo determina el rol asignado (Manual, §21.1) y no puede modificarse desde el perfil.</div>
            </span>
          </label>
        </div>
      </div>
    </div>
    <div class="note" style="margin-top:6px">Demo: el control de acceso real (autenticación JWT por terapeuta, roles y visibilidad por grupo) se implementa en el backend. Cada técnico solo ve los NNA de los grupos que coordina.</div>`;
}

/* ---------- Wiring + render inicial de los módulos nuevos ----------
   B2 (2026-08-19): «Mi usuario» salió de la barra de navegación y se entra por el
   perfil de la topbar, que llama a `go('usuarios'); renderUsuario()` en su onclick.
   El listener sobre `.navitem[data-view="usuarios"]` se retira porque ya no hay
   ningún elemento que lo matchee: no fallaba, pero quedaba como cableado muerto
   apuntando a un nodo inexistente. */
document.querySelectorAll('.navitem[data-view="grupos"]').forEach(b=>b.addEventListener("click", renderGrupos));
document.querySelectorAll('.navitem[data-view="analitica"]').forEach(b=>b.addEventListener("click", renderRecordatorios));

renderGrupos();
renderUsuario();
renderRecordatorios();
