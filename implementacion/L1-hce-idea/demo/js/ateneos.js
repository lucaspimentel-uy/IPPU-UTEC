/* Ateneos clínicos y jornadas de capacitación — sección institucional transversal.
   Demo L1 HCE+IDEA — IPPU × UTEC-LIDIA.
   F1-nav4 (2026-08-19): se porta la sección `#/ateneos` del Prototipo v4
   (`HCE_IPPU_Prototipo_v4.html:1814-2010` → `AT_TIPOS`, `DB.ateneos[]`, `atNuevo`,
   `atDel`, `atRef`, `vAteneos`, `vAteneoDet`) usando la fuente, los colores y el
   formato de la demo. Es la primera sección de la demo que NO cuelga de un NNA:
   una sola entidad con cuatro tipos y campos según tipo, como el prototipo —
   no cuatro entidades (`docs/markdown/prototipo-v4-referencia.md` §9).

   La estructura del registro clínico (situación → hipótesis explícita → recursos →
   acuerdos con responsable y plazo → seguimiento) no es decorativa: sale del
   meta-ateneo institucional y es lo que el prototipo busca inducir como práctica.

   Paradigma de navegación: LISTADO + DETALLE dentro de la misma vista, igual que
   la vista Grupos post-F1-nav2 (el prototipo usa rutas `#/ateneos` y
   `#/ateneos/<id>`; la demo no tiene router, así que se replica con estado local).

   Divergencias deliberadas respecto del prototipo, y por qué:
   - **Prefijo único `AT-`.** El seed del prototipo escribe la jornada como
     `JC-2026-001`, pero su propio `atNuevo()` genera siempre `AT-`, y el backend
     ya cerró el punto en M12.7: `codigo` es derivado con un único
     `ATENEO_CODIGO_PREFIJO` (`backend/app/models/ateneo.py`). Emitir `JC-`
     contradiría esa decisión, así que la jornada del seed es `AT-2026-002`.
   - **Al cambiar el tipo se limpian las referencias que ese tipo no admite**
     (NNA y/o grupo). El prototipo las deja colgadas; en el backend hay CHECK que
     lo prohíbe (`handoff.md` §13, 2026-08-15), y un registro que la demo permite
     y la API rechaza es una demo que miente.

   Alcance: no escribe en HCE-LOG. El HCE-LOG de la demo es por NNA y un ateneo es
   transversal — misma limitación ya registrada para los cambios de responsable de
   grupo (`handoff.md` §5.18). El prototipo tampoco lo hace: lo declara como
   pendiente del sistema definitivo.

   Los scripts se cargan en orden en index.html: este va ÚLTIMO porque reutiliza
   nroHC() (grupos-usuario.js), abrirGrupo() (grupos-usuario.js),
   abrirExpedienteDemo() (expediente.js), fmtFecha() (utils.js) y go() (ui-core.js). */

/* ============ CATÁLOGO DE TIPOS (Prototipo v4 línea 1822) ============
   Los 4 tipos son CONSTANTE, no catálogo editable: el tipo es el discriminador
   contra el que están escritos los campos condicionales de esta vista y los 5
   CHECK del backend (M12.7, `handoff.md` §13 del 2026-08-15). */
const AT_TIPOS = [
  "Ateneo clínico (NNA)",
  "Ateneo de grupo",
  "Ateneo institucional",
  "Jornada de capacitación"
];

/* Clase CSS del chip por tipo. Colores de la paleta demo, no del Prototipo v4. */
const AT_TIPO_CLS = {
  "Ateneo clínico (NNA)":     "at-clinico",
  "Ateneo de grupo":          "at-grupo",
  "Ateneo institucional":     "at-inst",
  "Jornada de capacitación":  "at-jornada"
};

/* ============ SEED DEMO (Prototipo v4 líneas 1823-1861) ============
   Los 4 registros del prototipo, remapeados al modelo de la demo: `nna` pasa de
   'U-0001' al id de expediente (101 = Sofía R., grupo Celeste, igual que allá) y
   los grupos de 'Grupo Celeste' a 'Celeste' (los ids reales de GRUPOS, §5.18/D9). */
const ATENEOS = [
  {id:"AT-2025-001", tipo:"Ateneo clínico (NNA)", fecha:"2025-09-18",
   titulo:"Revisión de proceso — Sofía R.",
   nna:101, grupo:"Celeste",
   participantes:"Técnicos responsables del grupo · Coordinación técnica · Equipo de clínica",
   situacion:"Meseta en los indicadores de regulación emocional del Protocolo A; episodios de desregulación en transiciones.",
   hipotesis:"La desregulación se asocia a la falta de anticipación visual en los cambios de actividad, no a variables familiares.",
   recursos:"Interés intenso por la música (motivador) · vínculo sólido con la técnica responsable 1 · familia colaboradora en rutinas.",
   acuerdos:[
     {a:"Implementar agenda visual de transiciones en sala", r:"Técnico/a responsable 2", p:"2025-10-15"},
     {a:"Registrar frecuencia de episodios pre y post implementación", r:"Técnico/a responsable 1", p:"2025-11-30"}
   ],
   seguimiento:"Revisión de resultados en ateneo de grupo de noviembre."},

  {id:"AT-2025-002", tipo:"Ateneo de grupo", fecha:"2025-11-20",
   titulo:"Cierre de ciclo — Grupo Celeste",
   nna:null, grupo:"Celeste",
   participantes:"Técnicos responsables · Coordinación técnica",
   situacion:"Evaluación grupal de cierre: revisión de Δ de protocolos y de los acuerdos del ateneo AT-2025-001.",
   hipotesis:"La estructuración de transiciones explica la mejora observada en la escala de Anticipación y Flexibilidad.",
   recursos:"Dinámica grupal consolidada · materiales visuales elaborados por el equipo.",
   acuerdos:[
     {a:"Generalizar agendas visuales a todos los NNA del grupo en 2026", r:"Coordinación técnica", p:"2026-03-31"}
   ],
   seguimiento:"Verificación en el primer ateneo de grupo 2026."},

  {id:"AT-2026-001", tipo:"Ateneo institucional", fecha:"2026-04-16",
   titulo:"Meta-ateneo: análisis de los ateneos 2026 (ECRO)",
   nna:null, grupo:"",
   participantes:"Equipo técnico completo · Dirección",
   situacion:"Análisis meta-institucional de cinco ateneos clínicos con el esquema ECRO (Pichon-Rivière).",
   hipotesis:"La explicitación obligatoria de hipótesis clínicas y del registro de recursos aumenta la modalidad proactiva del equipo.",
   recursos:"Indicadores cuantificados del meta-ateneo · plantilla de Registro de Recursos.",
   acuerdos:[
     {a:"Adoptar la estructura hipótesis–recursos–acuerdos–seguimiento en todos los ateneos", r:"Coordinación técnica", p:"2026-05-01"}
   ],
   seguimiento:"Nueva medición de indicadores en el meta-ateneo de diciembre 2026."},

  /* En el prototipo esta fila es `JC-2026-001`; ver la nota de prefijo en la cabecera. */
  {id:"AT-2026-002", tipo:"Jornada de capacitación", fecha:"2026-05-08",
   titulo:"Aplicación calibrada del IDEA: Manual Unificado v1.0",
   nna:null, grupo:"",
   participantes:"Todos los evaluadores IDEA de la institución",
   capacitador:"Equipo técnico interno (Dirección técnica)",
   modalidad:"Presencial — sede Prado",
   contenidos:"Reglas comunes de aplicación · anclajes con ejemplos · errores frecuentes · claves de Martos / Deletrea · acuerdo interjueces.",
   materiales:"Manual Unificado de Criterios IDEA v1.0 · fichas IDEA-D01 a D12 en la HCE.",
   evaluacion:"Ejercicio de puntuación independiente sobre caso filmado y comparación interjueces."}
];

/* Normalización: todo registro tiene `acuerdos[]`, aunque sea una jornada.
   (Una jornada no lleva acuerdos —guard de M11.3—, pero el array existe para no
   tener que preguntar por él en cada render.) */
ATENEOS.forEach(a => { if(!Array.isArray(a.acuerdos)) a.acuerdos = []; });

/* Filtros del listado (el `UI.at` del prototipo). Persisten mientras dura la
   sesión: volver del detalle al listado no los pierde. */
const AT_FILTRO = {tipo:"", anio:"", grupo:"", q:""};

/* ============ HELPERS ============ */
function atGet(id){ return ATENEOS.find(a => a.id === id); }

/* Escape para interpolar texto del usuario dentro de atributos HTML. El prototipo
   no escapa y un título con comillas le rompe el formulario; acá el contenido es
   editable en pantalla, así que conviene. */
function atEsc(v){
  return String(v == null ? "" : v)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}

function atChip(tipo){
  if(!tipo) return `<span class="at-chip at-sin">Sin tipo</span>`;
  return `<span class="at-chip ${AT_TIPO_CLS[tipo] || "at-sin"}">${tipo}</span>`;
}

/* Referencia del registro según su tipo (`atRef` del prototipo, línea 1871). */
function atRefHtml(a){
  if(a.tipo === "Ateneo clínico (NNA)" && a.nna != null){
    const n = NNA.find(x => x.id === a.nna);
    return n
      ? `<button class="btn btn-link" onclick="abrirExpedienteDemo(${n.id})">${n.nombre} ${n.apellido}</button>
         <div class="at-hint">${nroHC(n)}${a.grupo ? ` · Grupo ${a.grupo}` : ""}</div>`
      : `<span class="at-hint">Expediente #${a.nna} (no encontrado)</span>`;
  }
  if(a.tipo === "Ateneo de grupo" && a.grupo)
    return `<button class="btn btn-link" onclick="atIrAGrupo('${atEsc(a.grupo)}')">Grupo ${a.grupo}</button>`;
  if(a.tipo === "Ateneo institucional") return "Institucional";
  if(a.tipo === "Jornada de capacitación") return "Capacitación";
  return "—";
}

/* Ir al detalle de un grupo desde acá. `abrirGrupo()` sólo renderiza dentro de
   #view-grupos: hay que activar la vista antes o el detalle queda invisible. */
function atIrAGrupo(gid){ go("grupos"); abrirGrupo(gid); }

/* Grupos disponibles para los selects: los ids reales de GRUPOS (Azul · Celeste ·
   Naranja · Verde), no los que aparezcan escritos en los registros. */
function atGrupos(){ return GRUPOS.map(g => g.id); }

/* ============ ALTA / BAJA / EDICIÓN (Prototipo v4 líneas 1863-1870) ============ */

/* Correlativo por año de REGISTRACIÓN, no por año del hecho: el registro nace con
   `fecha:""` y el número se asigna igual. Es la misma semántica que el backend
   fijó en `Ateneo.anio_correlativo` (M12.7): un libro de actas, no un orden
   cronológico. Por eso el filtro por año mira `fecha` y el código puede no
   coincidir con él. */
function atNuevo(){
  const anio = new Date().getFullYear();
  const n = ATENEOS.filter(a => a.id.startsWith(`AT-${anio}-`)).length + 1;
  const id = `AT-${anio}-${String(n).padStart(3,"0")}`;
  ATENEOS.unshift({id, tipo:"", fecha:"", titulo:"", nna:null, grupo:"", participantes:"",
    situacion:"", hipotesis:"", recursos:"", acuerdos:[], seguimiento:"",
    capacitador:"", modalidad:"", contenidos:"", materiales:"", evaluacion:""});
  abrirAteneo(id);
  toast(`Registro ${id} creado — completá tipo, fecha y título.`);
}

function atDel(id){
  const ix = ATENEOS.findIndex(a => a.id === id);
  if(ix < 0) return;
  if(!window.confirm("¿Eliminar este registro? En el sistema definitivo esta acción queda auditada en HCE-LOG.")) return;
  ATENEOS.splice(ix,1);
  renderAteneos();
  toast("Registro eliminado.");
}

function atSet(id, campo, valor){
  const a = atGet(id); if(!a) return;
  a[campo] = valor;
}

/* Cambio de tipo: además de guardarlo, limpia las referencias que el nuevo tipo no
   admite y re-renderiza (los campos condicionales cambian). Ver cabecera. */
function atSetTipo(id, tipo){
  const a = atGet(id); if(!a) return;
  a.tipo = tipo;
  if(tipo !== "Ateneo clínico (NNA)") a.nna = null;
  if(tipo !== "Ateneo clínico (NNA)" && tipo !== "Ateneo de grupo") a.grupo = "";
  renderAteneoDetalle(id);
}

/* Al elegir el NNA, el grupo se hereda del expediente (carga única, como el
   prototipo: el grupo del ateneo clínico no se tipea aparte). */
function atSetNNA(id, valor){
  const a = atGet(id); if(!a) return;
  a.nna = valor ? parseInt(valor,10) : null;
  const n = NNA.find(x => x.id === a.nna);
  if(n) a.grupo = n.grupo;
  renderAteneoDetalle(id);
}

function atSetAcuerdo(id, ix, campo, valor){
  const a = atGet(id); if(!a || !a.acuerdos[ix]) return;
  a.acuerdos[ix][campo] = valor;
}
function atAddAcuerdo(id){
  const a = atGet(id); if(!a) return;
  a.acuerdos.push({a:"", r:"", p:""});
  renderAteneoDetalle(id);
}
function atRmAcuerdo(id, ix){
  const a = atGet(id); if(!a) return;
  a.acuerdos.splice(ix,1);
  renderAteneoDetalle(id);
}

/* Cambiar un filtro re-renderiza SÓLO las filas, no la vista entera: el buscador
   usa `oninput` y, si se recreara el <input>, perdería el foco en cada tecla. Los
   selects tampoco cambian de opciones al filtrar (salen de los datos, no del
   filtro). El prototipo puede permitirse `route()` porque usa `onchange`. */
function atFiltro(campo, valor){
  AT_FILTRO[campo] = valor;
  atRenderFilas();
}

/* Registros que pasan los 4 filtros, más nuevos primero (`vAteneos`, línea 1882). */
function atFiltrados(){
  const F = AT_FILTRO;
  return ATENEOS.filter(a =>
    (!F.tipo  || a.tipo === F.tipo) &&
    (!F.anio  || (a.fecha||"").startsWith(F.anio)) &&
    (!F.grupo || a.grupo === F.grupo) &&
    (!F.q     || `${a.titulo} ${a.situacion||""} ${a.contenidos||""}`.toLowerCase().includes(F.q.toLowerCase()))
  ).sort((x,y) => (y.fecha||"").localeCompare(x.fecha||""));
}

function atRenderFilas(){
  const tbody = document.getElementById("atTbody");
  const cont  = document.getElementById("atContador");
  if(!tbody) return;
  const lista = atFiltrados();
  tbody.innerHTML = lista.map(a => `<tr>
      <td style="white-space:nowrap">${a.fecha ? fmtFecha(a.fecha) : `<span class="at-hint">sin fecha</span>`}</td>
      <td>${atChip(a.tipo)}</td>
      <td>
        <button class="btn btn-link" onclick="abrirAteneo('${a.id}')"><b>${atEsc(a.titulo) || a.id}</b></button>
        <div class="at-hint">${a.id}</div>
      </td>
      <td>${atRefHtml(a)}</td>
      <td style="text-align:right;font-variant-numeric:tabular-nums">
        ${a.acuerdos.length ? `${a.acuerdos.length} acuerdo(s)` : `<span class="at-hint">—</span>`}
      </td>
    </tr>`).join("")
    || `<tr><td colspan="5" class="at-hint">Sin registros para el filtro aplicado.</td></tr>`;
  if(cont) cont.textContent = `${lista.length} de ${ATENEOS.length} registro(s).`;
}

/* ============ LISTADO (vAteneos del Prototipo v4, línea 1878) ============ */
function renderAteneos(){
  const cont = document.getElementById("ateneosContent");
  if(!cont) return;

  const F = AT_FILTRO;
  const anios  = [...new Set(ATENEOS.map(a => (a.fecha||"").slice(0,4)).filter(Boolean))].sort().reverse();
  const grupos = atGrupos();

  const opts = (valores, sel, vacio) =>
    [`<option value="">${vacio}</option>`]
      .concat(valores.map(v => `<option value="${atEsc(v)}" ${sel === v ? "selected" : ""}>${atEsc(v)}</option>`))
      .join("");

  /* F1-nav4 · ajuste 2026-08-19: se retira la `notice` que abría el listado con el
     flujo del registro (situación → hipótesis → recursos → acuerdos → seguimiento).
     La secuencia sigue siendo la del prototipo y está a la vista en el detalle, que
     es donde se carga: repetirla acá sólo empujaba la tabla hacia abajo. */
  cont.innerHTML = `
    <div class="card">
      <div class="cardhead">
        <h2>Registros de ateneos y jornadas</h2>
        <div style="flex:1"></div>
        <button class="btn btn-primary" onclick="atNuevo()">+ Nuevo registro</button>
      </div>
      <div class="cardbody">
        <div class="at-filtros">
          <div class="field"><label>Tipo</label>
            <select onchange="atFiltro('tipo',this.value)">${opts(AT_TIPOS, F.tipo, "Todos los tipos")}</select></div>
          <div class="field"><label>Año</label>
            <select onchange="atFiltro('anio',this.value)">${opts(anios, F.anio, "Todos los años")}</select></div>
          <div class="field"><label>Grupo</label>
            <select onchange="atFiltro('grupo',this.value)">${opts(grupos, F.grupo, "Todos los grupos")}</select></div>
          <div class="field"><label>Buscar en título y contenido</label>
            <input type="search" value="${atEsc(F.q)}" placeholder="Tema, NNA, contenido…" oninput="atFiltro('q',this.value)"></div>
        </div>
        <div style="overflow-x:auto">
          <table class="lista at-table">
            <thead><tr>
              <th style="width:120px">Fecha</th>
              <th style="width:180px">Tipo</th>
              <th>Título / tema</th>
              <th style="width:200px">Referencia</th>
              <th style="width:120px;text-align:right">Acuerdos</th>
            </tr></thead>
            <tbody id="atTbody"></tbody>
          </table>
        </div>
        <div class="at-hint" style="margin-top:10px" id="atContador"></div>
      </div>
    </div>

    <div class="notice warn" style="margin-top:14px"><b>Confidencialidad:</b> los ateneos clínicos referidos a un NNA contienen datos sensibles de salud (Ley N.º 18.331) y heredan la matriz de acceso por roles de la HCE de ese NNA. Los ateneos institucionales y las jornadas de capacitación son de acceso general del equipo técnico.</div>`;

  atRenderFilas();
}

/* ============ DETALLE (vAteneoDet del Prototipo v4, línea 1911) ============ */
function abrirAteneo(id){
  renderAteneoDetalle(id);
  const view = document.getElementById("view-ateneos");
  if(view) view.scrollIntoView({behavior:"smooth", block:"start"});
}

function renderAteneoDetalle(id){
  const a = atGet(id);
  const cont = document.getElementById("ateneosContent");
  if(!cont) return;
  if(!a) return renderAteneos();

  const esJornada = a.tipo === "Jornada de capacitación";
  const esNNA     = a.tipo === "Ateneo clínico (NNA)";
  const esGrupo   = a.tipo === "Ateneo de grupo";

  /* Campos: mismos helpers `txt` / `ta` del prototipo, con el markup de la demo. */
  const txt = (k, lbl, ph) => `
    <div class="field"><label>${lbl}</label>
      <input type="text" value="${atEsc(a[k])}" placeholder="${atEsc(ph||"")}" onchange="atSet('${id}','${k}',this.value)"></div>`;
  const ta = (k, lbl, ph) => `
    <div class="field" style="grid-column:1/-1"><label>${lbl}</label>
      <textarea placeholder="${atEsc(ph||"")}" onchange="atSet('${id}','${k}',this.value)">${atEsc(a[k])}</textarea></div>`;

  const optTipos = [`<option value="">(definir tipo)</option>`]
    .concat(AT_TIPOS.map(t => `<option value="${atEsc(t)}" ${a.tipo === t ? "selected" : ""}>${t}</option>`)).join("");
  const optNNA = [`<option value="">(seleccionar NNA)</option>`]
    .concat(NNA.map(n => `<option value="${n.id}" ${a.nna === n.id ? "selected" : ""}>${n.nombre} ${n.apellido} — ${nroHC(n)}</option>`)).join("");
  const optGrupos = [`<option value="">(seleccionar grupo)</option>`]
    .concat(atGrupos().map(g => `<option value="${atEsc(g)}" ${a.grupo === g ? "selected" : ""}>Grupo ${g}</option>`)).join("");

  const acuerdoFilas = a.acuerdos.length
    ? a.acuerdos.map((c, ix) => `<tr>
        <td><textarea rows="2" placeholder="Qué se acuerda" onchange="atSetAcuerdo('${id}',${ix},'a',this.value)">${atEsc(c.a)}</textarea></td>
        <td><input type="text" placeholder="Rol responsable" value="${atEsc(c.r)}" onchange="atSetAcuerdo('${id}',${ix},'r',this.value)"></td>
        <td><input type="date" value="${atEsc(c.p)}" onchange="atSetAcuerdo('${id}',${ix},'p',this.value)"></td>
        <td><button class="btn btn-ghost btn-mini" title="Quitar acuerdo" onclick="atRmAcuerdo('${id}',${ix})">Quitar</button></td>
      </tr>`).join("")
    : `<tr><td colspan="4" class="at-hint">Sin acuerdos registrados.</td></tr>`;

  /* Bloque según tipo: una jornada no tiene desarrollo clínico ni acuerdos, y un
     ateneo no tiene capacitador ni materiales. Es la misma entidad con campos
     según tipo — no dos formularios distintos. */
  const bloqueJornada = `
    <div class="card" style="margin-top:16px">
      <div class="cardhead"><h2>Jornada de capacitación</h2></div>
      <div class="cardbody">
        <div class="form-grid">
          ${txt("capacitador","Capacitador/a (interno o externo)")}
          ${txt("modalidad","Modalidad","Presencial / virtual / mixta — lugar")}
          ${ta("contenidos","Contenidos desarrollados")}
          ${ta("materiales","Materiales entregados o disponibles","Referencia a documentos en HCE-DOC institucional")}
          ${ta("evaluacion","Evaluación de la jornada y transferencia esperada a la práctica")}
        </div>
      </div>
    </div>`;

  const bloqueClinico = `
    <div class="card" style="margin-top:16px">
      <div class="cardhead"><h2>Desarrollo clínico del ateneo</h2></div>
      <div class="cardbody">
        <div class="at-hint" style="margin-bottom:12px;font-style:italic">Estructura acordada en el meta-ateneo institucional: la hipótesis clínica y el registro de recursos son campos esperados en todo ateneo.</div>
        <div class="form-grid">
          ${ta("situacion","Situación presentada","Descripción de la situación clínica, grupal o institucional que motiva el ateneo")}
          ${ta("hipotesis","Hipótesis clínica explícita","Qué explicación se propone y qué observaciones la sustentan")}
          ${ta("recursos","Registro de recursos","Fortalezas, intereses, motivadores y apoyos disponibles del NNA, del grupo, de la familia y del equipo")}
        </div>

        <h3 class="at-subtitulo">Acuerdos del ateneo</h3>
        <table class="at-acuerdos">
          <thead><tr>
            <th style="width:46%">Acuerdo</th>
            <th style="width:26%">Responsable (rol)</th>
            <th style="width:20%">Plazo</th>
            <th style="width:8%"></th>
          </tr></thead>
          <tbody>${acuerdoFilas}</tbody>
        </table>
        <button class="btn btn-ghost btn-mini no-print" style="margin-top:10px" onclick="atAddAcuerdo('${id}')">+ Agregar acuerdo</button>

        <div class="form-grid" style="margin-top:16px">
          ${ta("seguimiento","Seguimiento previsto","Cuándo y en qué instancia se revisará el cumplimiento de los acuerdos")}
        </div>
      </div>
    </div>`;

  cont.innerHTML = `
    <div class="pagehead at-detalle-head">
      <div>
        <h1>${atEsc(a.titulo) || "Nuevo registro"}</h1>
        <p class="pagedesc">${a.id} · ${a.tipo ? atChip(a.tipo) : `<span class="at-hint">definir tipo de registro</span>`}${a.fecha ? ` · ${fmtFecha(a.fecha)}` : ""}</p>
      </div>
      <div style="flex:1"></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-ghost" onclick="renderAteneos()">‹ Volver al listado</button>
        <button class="btn btn-ghost" onclick="atDel('${id}')">Eliminar registro</button>
      </div>
    </div>

    <div class="card">
      <div class="cardhead"><h2>Datos generales</h2></div>
      <div class="cardbody">
        <div class="form-grid">
          <div class="field"><label>Tipo <span class="req">*</span></label>
            <select onchange="atSetTipo('${id}',this.value)">${optTipos}</select></div>
          <div class="field"><label>Fecha <span class="req">*</span></label>
            <input type="date" value="${atEsc(a.fecha)}" onchange="atSet('${id}','fecha',this.value)"></div>
          <div class="field" style="grid-column:1/-1"><label>Título / tema <span class="req">*</span></label>
            <input type="text" value="${atEsc(a.titulo)}" placeholder="Tema del ateneo o de la jornada" onchange="atSet('${id}','titulo',this.value); renderAteneoDetalle('${id}')"></div>
          ${esNNA ? `
          <div class="field"><label>NNA referido <span class="req">*</span></label>
            <select onchange="atSetNNA('${id}',this.value)">${optNNA}</select>
            <div class="hint">El grupo se toma del expediente (carga única).</div></div>` : ""}
          ${(esNNA || esGrupo) ? `
          <div class="field"><label>Grupo <span class="req">*</span></label>
            <select onchange="atSet('${id}','grupo',this.value)" ${esNNA ? "disabled" : ""}>${optGrupos}</select>
            ${esNNA ? `<div class="hint">Heredado del NNA referido.</div>` : ""}</div>` : ""}
          <div class="field" style="grid-column:1/-1"><label>Participantes (roles)</label>
            <input type="text" value="${atEsc(a.participantes)}" placeholder="Se consignan roles, no nombres, salvo firma de acuerdos" onchange="atSet('${id}','participantes',this.value)"></div>
        </div>
      </div>
    </div>

    ${esJornada ? bloqueJornada : bloqueClinico}

    <div class="notice info" style="margin-top:14px">En el sistema definitivo este registro queda asociado a HCE-LOG (auditoría) y admite adjuntos en HCE-DOC.${esNNA ? " Por referirse a un NNA, hereda la matriz de acceso por roles de su HCE." : ""}</div>`;
}

/* ============ PANEL EN EL EXPEDIENTE (mResumen del Prototipo v4, línea 882) ============
   Los ateneos clínicos de un NNA aparecen también en su HCE. Se llama desde
   abrirExpedienteDemo() en expediente.js, igual que docPanelHtml/orgPanelHtml. */
function ateneosPanelHtml(p){
  const ats = ATENEOS
    .filter(a => a.tipo === "Ateneo clínico (NNA)" && a.nna === p.id)
    .sort((x,y) => (y.fecha||"").localeCompare(x.fecha||""));
  const cuerpo = ats.length
    ? `<table class="at-acuerdos at-exp-table">
         <thead><tr><th style="width:130px">Fecha</th><th>Título / tema</th><th style="width:130px">Acuerdos</th></tr></thead>
         <tbody>${ats.map(a => `<tr>
           <td>${a.fecha ? fmtFecha(a.fecha) : "—"}</td>
           <td><button class="btn btn-link" onclick="atIrAAteneo('${a.id}')">${atEsc(a.titulo) || a.id}</button>
               <div class="at-hint">${a.id}</div></td>
           <td>${a.acuerdos.length ? `${a.acuerdos.length} acuerdo(s)` : "—"}</td>
         </tr>`).join("")}</tbody>
       </table>`
    : `<div class="at-hint">Sin ateneos registrados para este NNA. Se registran en la sección <button class="btn btn-link" style="padding:0" onclick="go('ateneos'); renderAteneos()">Ateneos y capacitación</button>.</div>`;
  return `<div class="flujo-card" id="anchor-ateneos">
    <h3><span class="ic">◈</span> Ateneos clínicos referidos a este NNA
      <span class="spacer"></span>
      <span style="font-size:var(--fs-2xs);color:var(--ink-2);font-weight:400">${ats.length} registro(s)</span>
    </h3>
    <div class="flujo-body">${cuerpo}</div>
  </div>`;
}

/* Saltar al detalle de un ateneo desde el expediente. */
function atIrAAteneo(id){ go("ateneos"); abrirAteneo(id); }

/* ============ WIRING + RENDER INICIAL ============
   Clickear el ítem del menú siempre vuelve al LISTADO (mismo criterio que Grupos). */
document.querySelectorAll('.navitem[data-view="ateneos"]').forEach(b => b.addEventListener("click", renderAteneos));
renderAteneos();
