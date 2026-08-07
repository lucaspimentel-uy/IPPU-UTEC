/* Expediente clinico (HCE) + informe imprimible.
   Demo L1 HCE+IDEA - IPPU x UTEC-LIDIA.
   Extraido del monolito (lineas 2618-2886) sin cambios de logica.
   Nota: 2774-2780 se movieron a utils.js (ver su cabecera).
   Los scripts se cargan en orden en index.html: el orden ES la semantica. */
/* ===================== EXPEDIENTE CLÍNICO (HCE) ===================== */
function abrirExpediente(id){
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

    ${flujoPanelHtml(p)}

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
          <button class="btn-print" style="background:#EEF3F8;color:var(--ink)" onclick="abrirExpediente(${p.id})">‹ Volver</button>
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
            : `<button class="btn btn-ghost" onclick="abrirExpediente(${p.id})">Ver flujo de módulos</button>`}
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
        <button class="btn-print" style="background:#EEF3F8;color:var(--ink)" onclick="abrirExpediente(${p.id})">‹ Volver</button>
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

