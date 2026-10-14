/* Expediente clinico (HCE) + informe imprimible.
   Demo L1 HCE+IDEA - IPPU x UTEC-LIDIA.
   Extraido del monolito (lineas 2618-2886) sin cambios de logica.
   Nota: 2774-2780 se movieron a utils.js (ver su cabecera).
   Los scripts se cargan en orden en index.html: el orden ES la semantica. */
/* ===================== EXPEDIENTE CONECTADO · HCE-00 de solo lectura (Fase 3-a) =====================
   handoff §5.122. abrirExpediente(id) carga GET /hce/{id} (+ GET /hce/{id}/flujo para el estado de
   los modulos) y pinta SOLO lo que la API tiene. Lo que la API no guarda (nivel de soporte,
   talleres, historial, antecedentes) no se muestra. Los modulos que todavia no estan conectados
   son pestanas con el panel de modo demostracion y SIN datos: no se mezcla una persona de la API
   con datos de ejemplo. El expediente de ejemplo (datos.js) sigue en abrirExpedienteDemo().
   Nada se edita en esta rebanada. */
const EXP = { id:null, seq:0, hce:null, flujo:null, tab:"hce00" };

/* `fase`: en que rebanada de la Fase 3 se conecta (propuesta, handoff §6). Sin `fase` = fuera del
   alcance del 26/11/2026. `mod`: eslabon del flujo anual cuyo estado muestra la pestana. */
const TABS_EXP = [
  {k:"hce00", r:"HCE-00", t:"Identificación y datos clínicos"},
  {k:"ci",    r:"CI",  t:"Consentimiento informado",        fase:"3-b"},
  {k:"lb",    r:"LB",  t:"Línea base — IDEA",               fase:"3-c", mod:"HCE-LB"},
  {k:"pa",    r:"PA",  t:"Protocolo A (IPPU-TEA)",          fase:"3-d", mod:"HCE-PA"},
  {k:"pb",    r:"PB",  t:"Protocolo B (IPPU-TEA)",          fase:"3-d", mod:"HCE-PB"},
  {k:"ic",    r:"IC",  t:"Informe de cierre anual",         fase:"3-e", mod:"HCE-IC"},
  {k:"vf",    r:"VF",  t:"Valoración funcional",            fase:"3-e"},
  {k:"doc",   r:"DOC", t:"Documentos y fotos"},
  {k:"org",   r:"ORG", t:"Áreas INAU y BPS"},
  {k:"inc",   r:"INC", t:"Inclusión educativa y social"},
  {k:"pai",   r:"PAI", t:"Propuesta de atención individual"},
  {k:"sev",   r:"SEV", t:"Severidad (DSM-5-TR)"},
  {k:"log",   r:"LOG", t:"Registro de cambios"}
];

function _estadoTab(t){
  if(!EXP.flujo) return null;
  if(t.k === "ci") return EXP.flujo.ci === "registrado" ? "firmado" : "ci_pendiente";
  if(t.mod && EXP.flujo.modulos[t.mod]) return EXP.flujo.modulos[t.mod].estado;
  return null;
}

function tabsExpedienteHtml(){
  return `<div class="exp-tabs" role="tablist" aria-label="Módulos del expediente" onkeydown="teclaTabExp(event)">` +
    TABS_EXP.map(t=>{
      const est = _estadoTab(t);
      const sel = EXP.tab === t.k;
      let marca = "";
      if(est === "ci_pendiente") marca = ` <span class="st-mini st-ci-pend"><span aria-hidden="true">⚠</span><span class="sr-only">consentimiento pendiente</span></span>`;
      else if(est){ const e = ESTADO_MOD_TXT[est] || ESTADO_MOD_TXT.sin_iniciar; marca = ` <span class="st-mini st-${est}"><span aria-hidden="true">${e.glifo}</span><span class="sr-only">${e.txt}</span></span>`; }
      return `<button type="button" role="tab" class="exp-tab" id="tabExp-${t.k}" data-tab="${t.k}"
        aria-selected="${sel}" aria-controls="panelExp" tabindex="${sel ? 0 : -1}"
        title="${escHtml(t.t)}" onclick="selTabExp('${t.k}')">${t.r}${marca}</button>`;
    }).join("") + `</div>`;
}

function teclaTabExp(ev){
  const ks = TABS_EXP.map(t=>t.k);
  let i = ks.indexOf(EXP.tab);
  if(ev.key === "ArrowRight") i = (i + 1) % ks.length;
  else if(ev.key === "ArrowLeft") i = (i - 1 + ks.length) % ks.length;
  else if(ev.key === "Home") i = 0;
  else if(ev.key === "End") i = ks.length - 1;
  else return;
  ev.preventDefault();
  selTabExp(ks[i], true);
}

function selTabExp(k, enfocar){
  EXP.tab = k;
  const cont = document.getElementById("tabsExpWrap");
  if(cont) cont.innerHTML = tabsExpedienteHtml();
  const panel = document.getElementById("panelExp");
  panel.innerHTML = panelTabExpHtml(k);
  panel.setAttribute("aria-labelledby", "tabExp-" + k);
  if(enfocar){ const b = document.getElementById("tabExp-" + k); if(b) b.focus(); }
}

function filaDato(rotulo, valor){
  const v = (valor === null || valor === undefined || valor === "") ? "—" : escHtml(valor);
  return `<div class="data-row"><dt>${rotulo}</dt><dd>${v}</dd></div>`;
}
function filaTecnico(rotulo, nombre, rol){
  return `<div class="data-row"><dt>${rotulo}</dt><dd>${nombre
    ? `${escHtml(nombre)}${rol ? ` · <span style="color:var(--ink-2)">${escHtml(rol)}</span>` : ""}`
    : "— <span style=\"color:var(--ink-2)\">(sin asignar)</span>"}</dd></div>`;
}

function hce00Html(p){
  const a = p.anamnesis;
  const anam = a
    ? `${filaDato("Motivo de ingreso", a.motivo)}${filaDato("Perinatales", a.perinatal)}${filaDato("Desarrollo", a.desarrollo)}${filaDato("Ant. familiares", a.familiares)}`
    : `<div class="hint">Sin anamnesis cargada en el expediente.</div>`;
  return `<div class="exp-grid">
    <div>
      <div class="info-card">
        <h3><span class="ic" aria-hidden="true">▤</span> HCE-00 · Identificación y datos clínicos
          <span class="mbadge mb-borrador" title="Módulo siempre editable (§3.2); en esta versión solo lectura">Solo lectura</span></h3>
        <dl class="ib">
          ${filaDato("Diagnóstico", p.dx)}
          ${filaDato("CIE-11", p.cie11)}
          ${filaDato("Fecha dx.", p.dxFecha ? fmtFecha(p.dxFecha) : null)}
          ${filaDato("Derivación", p.deriv)}
          ${filaDato("Grupo", p.grupo ? `${p.grupo}${p.grupoAnio ? " · " + p.grupoAnio : ""}` : null)}
          ${filaTecnico("Téc. resp. 1", p.tecnico1, p.tecnico1_rol)}
          ${filaTecnico("Téc. resp. 2", p.tecnico2, p.tecnico2_rol)}
          ${filaDato("Medicación", p.med)}
          <div class="data-row"><dt>Alertas</dt><dd>${p.alerta ? `<b><span aria-hidden="true">⚠ </span>${escHtml(p.alerta)}</b>` : "—"}</dd></div>
        </dl>
      </div>
      <div class="info-card">
        <h3><span class="ic" aria-hidden="true">❏</span> HCE-00 · Anamnesis — Historia del desarrollo</h3>
        <dl class="ib">${anam}</dl>
      </div>
      <div class="info-card">
        <h3><span class="ic" aria-hidden="true">☎</span> Contacto familiar</h3>
        <dl class="ib">
          ${filaDato("Referente", p.referente)}
          ${filaDato("Teléfono", p.tel)}
          ${filaDato("Localidad", p.loc)}
        </dl>
      </div>
    </div>
    <div>${flujoResumenHtml()}</div>
  </div>`;
}

/* Estado de la cadena del anio en curso, tal cual lo devuelve GET /hce/{id}/flujo. */
function flujoResumenHtml(){
  if(EXP.flujoError){
    return `<div class="info-card"><h3>Módulos del año</h3><div class="ib"><div class="hint" role="status">No se pudo cargar el estado de los módulos.
      <button class="btn btn-ghost btn-mini" onclick="recargarFlujoExp()">Reintentar</button></div></div></div>`;
  }
  if(!EXP.flujo) return `<div class="info-card"><h3>Módulos del año</h3><div class="ib"><div class="hint" role="status">Cargando…</div></div></div>`;
  const f = EXP.flujo;
  const filas = MODULOS_CADENA.map(m=>{
    const mo = f.modulos[m]; const est = mo ? mo.estado : "sin_iniciar";
    return `<div class="data-row"><dt>${escHtml(m)}</dt><dd>${pillModulo(MOD_CORTO[m], m, est)} <span style="color:var(--ink-2)">${(ESTADO_MOD_TXT[est]||ESTADO_MOD_TXT.sin_iniciar).txt}</span></dd></div>`;
  }).join("");
  return `<div class="info-card">
    <h3><span class="ic" aria-hidden="true">◐</span> Módulos del año ${escHtml(f.anio)}</h3>
    <dl class="ib">
      <div class="data-row"><dt>HCE-CI</dt><dd>${pillCi(f.ci)}</dd></div>
      ${filas}
    </dl>
    <div class="ib hint" style="padding-top:0">● firmado · ◐ en curso · ○ sin iniciar. Se completan desde cada pestaña cuando se conecte (Fase 3-b a 3-e).</div>
  </div>`;
}

function panelTabExpHtml(k){
  if(k === "hce00") return hce00Html(EXP.hce);
  const t = TABS_EXP.find(x => x.k === k);
  const donde = t.fase ? `se conecta en la Fase ${t.fase}` : "queda fuera del alcance del 26/11/2026";
  return `<div class="info-card">
    <h3>${t.r} · ${escHtml(t.t)} ${badgeSoloDemo()}</h3>
    <div class="ib">${panelModoDemo(`${t.t}: este módulo todavía no está conectado a la API (${donde}). No se muestra ni se guarda ningún dato acá.`)}</div>
  </div>`;
}

async function recargarFlujoExp(){
  const mi = EXP.seq;
  EXP.flujo = null; EXP.flujoError = false;
  selTabExp(EXP.tab);
  try{
    const f = await apiFetch(`/hce/${EXP.id}/flujo`);
    if(mi !== EXP.seq) return;
    EXP.flujo = adaptarFlujo(f.data);
  }catch(_e){
    if(mi !== EXP.seq) return;
    EXP.flujoError = true;
  }
  selTabExp(EXP.tab);
}

function expedienteCargando(){
  document.getElementById("expCrumb").textContent = "Expediente";
  document.getElementById("expedienteContent").innerHTML =
    `<div class="card"><div class="cardbody"><div class="empty-state" role="status"><div class="big" aria-hidden="true">…</div>Cargando expediente…</div></div></div>`;
  go("expediente");
}
function expedienteError(err, id){
  const msg = err instanceof ApiError ? err.message : "No se pudo cargar el expediente.";
  document.getElementById("expedienteContent").innerHTML =
    `<div class="card"><div class="cardbody"><div class="empty-state" role="alert"><div class="big" aria-hidden="true">!</div>${escHtml(msg)}<br>
      <div style="display:flex;gap:8px;justify-content:center;margin-top:10px">
        ${err && err.status === 404 ? "" : `<button class="btn btn-primary btn-mini" onclick="abrirExpediente(${id})">Reintentar</button>`}
        <button class="btn btn-ghost btn-mini" onclick="go('inicio')">‹ Volver al listado</button></div></div></div></div>`;
}

async function abrirExpediente(id){
  const mi = ++EXP.seq;
  Object.assign(EXP, {id, hce:null, flujo:null, flujoError:false, tab:"hce00"});
  expedienteCargando();
  let hce;
  try{
    // El detalle y el flujo se piden juntos; si el flujo falla, el HCE-00 se muestra igual.
    const [rh, rf] = await Promise.allSettled([apiFetch(`/hce/${id}`), apiFetch(`/hce/${id}/flujo`)]);
    if(mi !== EXP.seq) return;
    if(rh.status === "rejected") throw rh.reason;
    hce = adaptarHce00(rh.value.data);
    if(rf.status === "fulfilled") EXP.flujo = adaptarFlujo(rf.value.data); else EXP.flujoError = true;
  }catch(err){
    if(mi !== EXP.seq) return;
    expedienteError(err, id);
    return;
  }
  EXP.hce = hce;
  const nombre = `${hce.nombre} ${hce.apellido}`.trim();
  document.getElementById("expCrumb").textContent = `Expediente · ${nombre}`;
  document.getElementById("expedienteContent").innerHTML = `
    <div class="exp-head">
      <div class="exp-avatar" aria-hidden="true">${escHtml(inicialesDe(nombre))}</div>
      <div>
        <h1 id="expTitulo" tabindex="-1">${escHtml(nombre)}</h1>
        <div class="meta">${hce.edad === null ? "" : hce.edad + " años · "}${hce.sexo ? escHtml(hce.sexo) + " · " : ""}N.º HCE ${escHtml(hce.hc)} · C.I. ${escHtml(hce.ciTxt)}${!hce.activo && hce.bajaFecha ? ` · Baja: ${fmtFecha(hce.bajaFecha)}` : ""}</div>
        <div class="badges">
          ${hce.grupo ? `<span class="bdg">Grupo ${escHtml(hce.grupo)}</span>` : ""}
          <span class="bdg">${hce.activo ? "Activo" : "Inactivo"}</span>
        </div>
      </div>
      <div class="spacer"></div>
      <button class="btn btn-ghost" onclick="go('inicio')">‹ Volver al listado</button>
    </div>
    <div id="tabsExpWrap">${tabsExpedienteHtml()}</div>
    <div id="panelExp" role="tabpanel" aria-label="Contenido del módulo">${panelTabExpHtml("hce00")}</div>`;
  const h1 = document.getElementById("expTitulo");
  if(h1) h1.focus();
}

/* ===================== EXPEDIENTE DE EJEMPLO (modo demostración) =====================
   Lee el array NNA de datos.js (ids 101–108, NO los de la API). Lo usan solo las vistas de
   demostración (Grupos, Inclusión, Ateneos, Pendientes…) y lleva el panel de modo demo. */
function abrirExpedienteDemo(id){
  const p = NNA.find(n=>n.id===id);
  if(!p) return;
  document.getElementById("expCrumb").textContent = `Expediente · ${p.nombre} ${p.apellido}`;
  const iniciales = (p.nombre[0]||"")+(p.apellido[0]||"");
  const ideaEvs = ideaEvals(p);
  const likEvs = p.historial.filter(h=>h.tipo==="lik").sort((x,y)=> x.fecha < y.fecha ? -1 : 1);

  // timeline ordenada por fecha
  const tipoLabel = {alta:"Alta", idea:"IDEA", lik:"Intermedia", note:"Nota"};
  const eventos = [...p.historial].sort((a,b)=> a.fecha < b.fecha ? -1 : 1);
  const timelineHtml = eventos.map(ev=>`
    <div class="tevent ${ev.tipo}">
      <div class="tdot"></div>
      <div class="tdate">${fmtFecha(ev.fecha)} · ${tipoLabel[ev.tipo]||""}</div>
      <div class="ttitle">${ev.titulo}</div>
      <div class="tdesc">${ev.desc}</div>
      ${ev.score!=null ? `<span class="tscore">Puntaje IDEA: ${ev.score} / ${ev.total}</span>` : ""}
    </div>`).join("");

  // tendencia simple
  let tendencia = "Sin evaluaciones para comparar todavía.";
  const scores = eventos.filter(e=>e.score!=null);
  if(scores.length>=2){
    const delta = scores[0].score - scores[scores.length-1].score;
    tendencia = delta>0
      ? `Reducción de ${delta} puntos desde la primera evaluación — evolución favorable.`
      : delta<0 ? `Aumento de ${Math.abs(delta)} puntos — requiere revisión del plan.`
      : "Puntaje estable entre evaluaciones.";
  }

  const tallerTags = p.talleres.length
    ? p.talleres.map(t=>`<span class="taller-tag">${t}</span>`).join("")
    : `<span style="font-size:.8rem;color:var(--ink-2)">Sin talleres asignados aún.</span>`;

  const a = p.anamnesis;
  const anamnesisHtml = a
    ? `<div class="data-row"><dt>Motivo de ingreso</dt><dd style="text-align:left">${a.motivo||"—"}</dd></div>
       <div class="data-row"><dt>Perinatales</dt><dd style="text-align:left">${a.perinatal||"—"}</dd></div>
       <div class="data-row"><dt>Desarrollo</dt><dd style="text-align:left">${a.desarrollo||"—"}</dd></div>
       <div class="data-row"><dt>Ant. familiares</dt><dd style="text-align:left">${a.familiares||"—"}</dd></div>
       <div class="data-row"><dt>Observaciones</dt><dd style="text-align:left">${p.antec||"—"}</dd></div>`
    : `<div class="data-row"><dt>Observaciones</dt><dd style="text-align:left">${p.antec||"—"}</dd></div>
       <div style="font-size:.74rem;color:var(--ink-2);margin-top:8px">Sin anamnesis estructurada cargada en el expediente (demo).</div>`;

  document.getElementById("expedienteContent").innerHTML = `
    ${panelModoDemo("Expediente de ejemplo con datos ficticios: no es un expediente de la API y nada de lo que se haga acá se guarda.")}
    <div class="exp-head">
      <div class="exp-avatar">${iniciales}</div>
      <div>
        <h1>${p.nombre} ${p.apellido}</h1>
        <div class="meta">${p.edad} años · ${p.sexo} · Expediente #${p.id} · C.I. ${p.ci}${!p.activo&&p.bajaFecha?` · Baja: ${fmtFecha(p.bajaFecha)}`:""}</div>
        <div class="badges">
          <span class="bdg">Grupo ${p.grupo}</span>
          <span class="bdg">${p.apoyo.split("—")[0].trim()}</span>
          <span class="bdg">${p.tecnico.split("—")[0].trim()}</span>
          <span class="bdg" style="background:${p.activo?'rgba(27,138,76,.35)':'rgba(197,48,48,.35)'}">${p.activo?'Activo':'Inactivo'}</span>
        </div>
      </div>
      <div class="spacer"></div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="btn btn-primary" onclick="openEditar(${p.id})">✎ Editar datos</button>
        <button class="btn btn-ghost" onclick="generarInforme(${p.id})" style="background:rgba(255,255,255,.14);color:#fff">🖨 Informe de Cierre Anual</button>
        <button class="btn btn-ghost" onclick="toggleActivo(${p.id})" style="background:rgba(255,255,255,.14);color:#fff">${p.activo?'⨯ Dar de baja':'↻ Reactivar'}</button>
        <button class="btn btn-ghost" onclick="go('inicio')" style="background:rgba(255,255,255,.14);color:#fff">‹ Volver al listado</button>
      </div>
    </div>

    <div class="eval-bar">
      <span class="eval-bar-lbl">Cargar evaluación:</span>
      <button class="btn btn-ghost" onclick="irAEval('anamnesis', ${p.id})">✎ Editar HCE-00</button>
      <button class="btn btn-ghost" onclick="irAEval('idea', ${p.id})">Evaluación IDEA</button>
      <button class="btn btn-ghost" onclick="irAEval('pa', ${p.id})">Protocolo A (IPPU-TEA)</button>
      <button class="btn btn-ghost" onclick="irAEval('pb', ${p.id})">Protocolo B (IPPU-TEA)</button>
      <button class="btn btn-ghost" onclick="irAEval('ic', ${p.id})">Informe de Cierre (IC)</button>
      <!-- M5.3: "Eval. intermedia" (Likert 3 ítems/dim) reemplazada por la Escala IPPU-TEA (PA/PB);
           el código de la vista se conserva sin exponer, como áreas/general. -->
      <!-- M0 (2026-07-15): "Eval. por áreas" y "Eval. general" descartadas como módulos activos
           (decisión §0.2 del plan / §10 Documento Técnico IPPU). Código y vistas conservados,
           solo se dejan de exponer; se resuelven como archivo histórico de solo lectura en M7 (HCE-DOC). -->
    </div>

    <div class="section-nav no-print">
      <span class="section-nav-lbl">Ir a sección:</span>
      <button class="btn btn-ghost btn-mini" onclick="scrollASeccion('anchor-doc')">🗂 HCE-DOC · Documentos y fotos</button>
      <button class="btn btn-ghost btn-mini" onclick="scrollASeccion('anchor-org')">🏛 HCE-ORG · Áreas INAU y BPS</button>
      <button class="btn btn-ghost btn-mini" onclick="scrollASeccion('anchor-vf')">♿ HCE-VF · Valoración funcional (BUND / CIF)</button>
      <button class="btn btn-ghost btn-mini" onclick="scrollASeccion('anchor-ateneos')">◈ Ateneos clínicos referidos</button>
    </div>

    ${flujoPanelHtml(p)}

    <div class="exp-grid">
      <div>
        <div class="info-card">
          <h3><span class="ic">▤</span> HCE-00 · Identificación y datos clínicos
            <span class="mbadge mb-borrador" style="margin-left:8px" title="Módulo siempre editable (§3.2): nunca se bloquea, aun con otros módulos firmados">Siempre abierto</span>
            <span style="flex:1"></span>
            <button class="btn btn-ghost btn-mini" onclick="openEditar(${p.id},1)">✎ Editar</button>
          </h3>
          <div class="ib">
            <div class="data-row"><dt>Diagnóstico</dt><dd>${p.dx}</dd></div>
            <div class="data-row"><dt>CIE-11</dt><dd>${p.cie11||"—"}</dd></div>
            <div class="data-row"><dt>Fecha dx.</dt><dd>${fmtFecha(p.dxFecha)}</dd></div>
            <div class="data-row"><dt>Derivación</dt><dd>${p.deriv}</dd></div>
            <div class="data-row"><dt>Nivel de soporte</dt><dd>${p.apoyo}</dd></div>
            <div class="data-row"><dt>Téc. resp. 1</dt><dd>${p.tecnico1||"—"} · <span style="color:var(--ink-2)">${p.tecnico1_rol||"Psicólogo/a"}</span></dd></div>
            <div class="data-row"><dt>Téc. resp. 2</dt><dd>${p.tecnico2||"—"} · <span style="color:var(--ink-2)">${p.tecnico2_rol||"Maestro/a"}</span></dd></div>
            <div class="data-row"><dt>Medicación</dt><dd>${p.med}</dd></div>
            <div class="data-row"><dt>Alertas</dt><dd style="${p.alerta!=="—"?"color:var(--bad);font-weight:600":""}">${p.alerta}</dd></div>
          </div>
        </div>
        <div class="info-card">
          <h3><span class="ic">❏</span> HCE-00 · Anamnesis — Historia del desarrollo</h3>
          <div class="ib">${anamnesisHtml}</div>
        </div>
        <div class="info-card">
          <h3><span class="ic">◫</span> Plan IPPU — Talleres asignados</h3>
          <div class="ib"><div class="talleres-list">${tallerTags}</div></div>
        </div>
        <div class="info-card">
          <h3><span class="ic">☎</span> Contacto familiar</h3>
          <div class="ib">
            <div class="data-row"><dt>Referente</dt><dd>${p.referente}</dd></div>
            <div class="data-row"><dt>Teléfono</dt><dd>${p.tel}</dd></div>
            <div class="data-row"><dt>Localidad</dt><dd>${p.loc}</dd></div>
          </div>
        </div>
      </div>

      <div>
        <div class="info-card">
          <h3><span class="ic">◐</span> Línea base — IDEA (HCE-LB)</h3>
          <div class="ib">
            ${(()=>{ const lb=p.flujo.lb; const t=lbTotales(lb.dim); const est=estadoModulo(p,"lb");
              if(est==="firmado") return `<div class="data-row"><dt>Total IDEA</dt><dd>${t.total} / 96 · <b style="color:${colorBanda(t.total)}">${bandaIdea(t.total)}</b></dd></div>
                <div class="data-row"><dt>Fecha de consenso</dt><dd>${fmtFecha(lb.fecha)}</dd></div>
                <div class="data-row"><dt>Estado</dt><dd>${estadoBadgeM(est)}</dd></div>`;
              if(est==="borrador") return `<div class="data-row"><dt>Línea base</dt><dd>${estadoBadgeM(est)} · ${t.count}/12 dim.${t.hayNS?" (incluye NS)":""}</dd></div>`;
              return `<div class="data-row"><dt>Línea base</dt><dd>${estadoBadgeM(est)}</dd></div>`;
            })()}
            ${pendienteIdea(p) ? `<div style="margin-top:8px;font-size:.76rem;color:var(--warn);font-weight:700">● Sin línea base IDEA firmada</div>` : ""}
            <button class="btn btn-ghost" style="margin-top:12px;width:100%" onclick="generarInforme(${p.id})">🖨 Informe de Cierre Anual (HCE-IC)</button>
          </div>
        </div>
        <div class="info-card">
          <h3><span class="ic">◷</span> Historial clínico</h3>
          <div class="ib">
            ${eventos.length ? `<div class="tline">${timelineHtml}</div>` :
              `<div class="empty-state"><div class="big">◷</div>Sin eventos registrados todavía.</div>`}
          </div>
        </div>
      </div>
    </div>

    ${docPanelHtml(p)}

    ${orgPanelHtml(p)}

    ${vfPanelHtml(p)}

    <!-- F1-nav4 (2026-08-19): ateneos clínicos referidos a este NNA. El panel lo arma
         ateneos.js (que carga después que este archivo, igual que hce-doc-org-vf.js:
         la función se resuelve al renderizar, no al cargar). -->
    ${ateneosPanelHtml(p)}
  `;
  go("expediente");
}


// abrir IDEA preseleccionando el NNA del expediente
function evaluarDesdeExp(id){
  go("idea");
  const sel = document.getElementById("selNNA");
  sel.value = String(id);
  // reset del formulario IDEA
  resetIDEA();
}

/* ============ HCE-IC · INFORME DE CIERRE ANUAL — imprimible (M6) ============
   "El único informe válido" (§5.3): el PDF con membrete se genera EXCLUSIVAMENTE
   desde el HCE-IC firmado. Sin IC firmado no se elaboran versiones alternativas —
   se muestra el estado del flujo y el camino para completarlo. */
function generarInforme(id){
  const p = NNA.find(n=>n.id===id); if(!p) return;
  const cont = document.getElementById("informeContent");
  const ic = p.flujo.ic;
  const hoy = new Date();
  const fechaGen = `${String(hoy.getDate()).padStart(2,"0")}/${String(hoy.getMonth()+1).padStart(2,"0")}/${hoy.getFullYear()}`;

  if(!ic.firmado){
    const st = estadoModulo(p,"ic");
    cont.innerHTML = `
      <div class="inf-banner">
        <div><h2>Informe de Cierre Anual — ${p.nombre} ${p.apellido}</h2>
          <p>Exp. #${p.id} · ${p.edad} años · Grupo ${p.grupo}</p></div>
        <div class="no-print" style="display:flex;gap:8px">
          <button class="btn-print" style="background:#EEF3F8;color:var(--ink)" onclick="abrirExpedienteDemo(${p.id})">‹ Volver</button>
        </div>
      </div>
      <div class="card"><div class="cardbody">
        <div class="empty-state"><div class="big">▤</div>
          No hay Informe de Cierre Anual firmado para este NNA.<br>
          El informe imprimible se genera <b>únicamente desde el HCE-IC firmado</b> — no se elaboran versiones alternativas (§5.3).</div>
        <div style="display:flex;justify-content:center;margin-top:6px">${stepperHtml(p)}</div>
        <div style="display:flex;justify-content:center;gap:10px;margin-top:14px" class="no-print">
          ${st==="borrador"
            ? `<button class="btn btn-primary" onclick="irAEval('ic', ${p.id})">✎ Completar HCE-IC</button>`
            : `<button class="btn btn-ghost" onclick="abrirExpedienteDemo(${p.id})">Ver flujo de módulos</button>`}
        </div>
      </div></div>`;
    go("informe");
    return;
  }

  const firmas = ic.firmas;
  cont.innerHTML = `
    <div class="inf-banner no-print">
      <div><h2>Informe de Cierre Anual — ${p.nombre} ${p.apellido}</h2>
        <p>HCE-IC firmado el ${fmtFecha(firmas[0]?firmas[0].fecha:ic.fecha)} · documento clínico legal, versión única · vista previa generada el ${fechaGen}</p></div>
      <div style="display:flex;gap:8px">
        <button class="btn-print" onclick="window.print()">🖨 Descargar PDF</button>
        ${!ic.recibi ? `<button class="btn-print" style="background:#FDEBD3;color:#8A5A16" onclick="openRecibiModal(${p.id})">✍ Registrar Recibí</button>` : ""}
        <button class="btn-print" style="background:#EEF3F8;color:var(--ink)" onclick="abrirExpedienteDemo(${p.id})">‹ Volver</button>
      </div>
    </div>

    <div class="card"><div class="cardbody">
      <div class="membrete">
        <h2>FUNDACIÓN IPPU · Instituto Psico Pedagógico Uruguayo</h2>
        <div class="sub">INAU · MSP · BPS · ECOSOC/ONU · Montevideo, Uruguay</div>
        <h3>Informe de Evolución y Cierre Anual · Año lectivo ${anioDe(ic.fecha)||ANIO_ACTUAL}</h3>
      </div>
      <div class="ib">
        <div class="data-row"><dt>Usuario</dt><dd>${p.nombre} ${p.apellido} · ${p.edad} años</dd></div>
        <div class="data-row"><dt>Expediente / C.I.</dt><dd>#${p.id} · ${p.ci}</dd></div>
        <div class="data-row"><dt>Grupo de referencia</dt><dd>Grupo ${p.grupo}</dd></div>
        <div class="data-row"><dt>CIE-11 / Soporte</dt><dd>${p.cie11||"—"} · ${p.apoyo.split("—")[0].trim()}</dd></div>
        <div class="data-row"><dt>Técnico/a responsable 1</dt><dd>${p.tecnico1||"—"} · ${p.tecnico1_rol||"Psicólogo/a"}</dd></div>
        <div class="data-row"><dt>Técnico/a responsable 2</dt><dd>${p.tecnico2||"—"} · ${p.tecnico2_rol||"Maestro/a"}</dd></div>
      </div>
    </div></div>

    <div class="card" style="margin-top:16px"><div class="cardhead"><h2>1. Análisis cuantitativo — autogenerado desde los módulos firmados</h2></div>
      <div class="cardbody">${icTablaHtml(p)}${icRadaresHtml(p)}</div></div>

    <div class="card" style="margin-top:16px"><div class="cardhead"><h2>2. Análisis cualitativo por escala</h2></div>
      <div class="cardbody">${IPPU_ESCALAS.map((n,i)=>`<p style="font-size:.85rem;margin-bottom:10px"><b>E${i+1} · ${n}.</b> ${ic.sintEsc[i]||"—"}</p>`).join("")}</div></div>

    <div class="card" style="margin-top:16px"><div class="cardhead"><h2>3. Síntesis interdisciplinaria</h2></div>
      <div class="cardbody">
        <p style="font-size:.85rem"><b>Valoración anual — Técnico/a responsable 1 (${p.tecnico1_rol||"Psicólogo/a"}):</b> ${ic.valTec1||"—"}</p>
        <p style="font-size:.85rem;margin-top:8px"><b>Valoración anual — Técnico/a responsable 2 (${p.tecnico2_rol||"Maestro/a"}):</b> ${ic.valTec2||"—"}</p>
      </div></div>

    <div class="card" style="margin-top:16px"><div class="cardhead"><h2>4. Recomendaciones y ajustes de tratamiento</h2></div>
      <div class="cardbody"><p style="font-size:.85rem">${ic.recomendaciones||"—"}</p></div></div>

    <div class="card" style="margin-top:16px"><div class="cardhead"><h2>5. Orientaciones a la familia</h2></div>
      <div class="cardbody"><p style="font-size:.85rem">${ic.orientaciones||"—"}</p></div></div>

    ${ic.addendas.length ? `<div class="card" style="margin-top:16px"><div class="cardhead"><h2>Addendas</h2></div>
      <div class="cardbody">${ic.addendas.map(a=>`<p style="font-size:.83rem;margin-bottom:8px"><b>${fmtFecha(a.fecha)} · ${a.profesional}:</b> ${a.texto}</p>`).join("")}</div></div>` : ""}

    <div class="card" style="margin-top:16px"><div class="cardbody">
      <div class="firmas-grid">
        <div><label>Firma Técnico/a responsable 1</label><div class="flin"></div><div class="fnom">${firmas[0]?firmas[0].profesional+" · "+firmas[0].rol:"—"}</div></div>
        <div><label>Firma Técnico/a responsable 2</label><div class="flin"></div><div class="fnom">${firmas[1]?firmas[1].profesional+" · "+firmas[1].rol:"—"}</div></div>
        <div><label>Recibí de la familia</label><div class="flin"></div><div class="fnom">${ic.recibi?`${ic.recibi.firmante} · registrado en HCE el ${fmtFecha(ic.recibi.fecha)}`:"Pendiente de registro"}</div></div>
      </div>
      <div style="font-size:.72rem;color:var(--ink-2);margin-top:14px">Documento generado desde la HCE de IPPU · Firmado digitalmente el ${fmtFecha(firmas[0]?firmas[0].fecha:ic.fecha)} · Documento clínico legal, versión única (§5.3) · Uso profesional exclusivo · Ley N.º 18.331/2008 y Ley N.º 18.335/2008 · Demo — datos simulados</div>
    </div></div>`;
  go("informe");
}

