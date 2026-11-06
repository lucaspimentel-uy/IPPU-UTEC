/* Vista «Panel institucional» — conectada a la API (C7, handoff §5.159).
   Demo L1 HCE+IDEA - IPPU x UTEC-LIDIA.
   Datos: GET /panel?anio= (los agregados, calculados por el servidor sobre los expedientes ACTIVOS del alcance: la
   institución para el admin, sus grupos para un técnico) y GET /recordatorios (los períodos del Manual §4, sólo lectura).
   Reglas: el navegador NO calcula ningún número del panel (cobertura, bandas, medias, Δ, alertas, pendientes): los pinta
   tal como llegan, sólo con formato (coma decimal, signo). El IDEA y la Escala IPPU-TEA no comparten tarjeta ni eje
   (§5.36). La banda se pinta con la rampa de un solo matiz de la banda del IDEA (pasoDeBanda / bandaChipHtml de
   evaluaciones.js), nunca con ok/warn/bad; el Δ y las alertas, en tinta con glifo + texto. El Δ medio no se interpreta.
   Los recordatorios orientan: no son fechas límite y no bloquean nada. El heatmap de talleres sigue siendo de
   demostración (fuera de alcance, §5.1.3) y lleva el panel compartido de modo demostración en su tarjeta. */

const PANEL = { seq:0, estado:"vacio", error:"", datos:null, recs:[], anio:null };
/* Las claves de recordatorio que tienen cuenta en el panel (la cadena del año); las otras piden datos por expediente. */
const PANEL_CLAVES_FLUJO = ["lb", "pa", "pb", "ic"];

function panelAnios(){ const y = new Date().getFullYear(); return [y, y - 1]; }
function panelAnioActual(){ return panelAnios()[0]; }

/* ---------- formato (sólo presentación: el valor ya viene calculado y redondeado del servidor) ---------- */
function panelNum(v){ return v === null || v === undefined ? "—" : String(v).replace(".", ","); }
function panelDec(v){ return v === null || v === undefined ? "—" : Number(v).toFixed(1).replace(".", ","); }
function panelDelta(v){
  if(v === null || v === undefined) return "—";
  return (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(1).replace(".", ",");
}
function panelDeltaGlifo(v){ return v === null || v === undefined ? "" : v > 0 ? "↑" : v < 0 ? "↓" : "="; }
function panelNNA(n){ return `${n} NNA`; }
function panelEscala(clave){
  const i = ["esc_1", "esc_2", "esc_3", "esc_4"].indexOf(clave);
  return i < 0 ? clave : `E${i + 1} · ${IPPU_ESCALAS[i]}`;
}

/* ---------- carga ---------- */
function panelAlAbrir(){
  if(PANEL.anio === null) PANEL.anio = panelAnioActual();
  panelCargar();
}
function panelElegirAnio(v){
  const a = Number(v);
  if(!panelAnios().includes(a)) return;
  PANEL.anio = a;
  panelCargar();
}
async function panelCargar(){
  const mi = ++PANEL.seq;
  if(PANEL.anio === null) PANEL.anio = panelAnioActual();
  PANEL.estado = "cargando";
  panelPintar();
  try{
    const [panel, recs] = await Promise.all([apiFetch("/panel", {query:{anio:PANEL.anio}}), apiFetch("/recordatorios")]);
    if(mi !== PANEL.seq) return;       // llegó una respuesta vieja (otro año, o se salió de la sesión): se descarta
    PANEL.datos = panel.data;
    PANEL.recs = recs.data;
    PANEL.estado = "listo";
  }catch(err){
    if(mi !== PANEL.seq) return;
    PANEL.estado = "error";
    PANEL.error = err instanceof ApiError ? err.message : "No se pudo cargar el panel.";
  }
  panelPintar();
}
/* «Salir» / 401: la vista queda vacía y una respuesta en vuelo ya no se pinta. */
function panelOlvidarSesion(){
  PANEL.seq++;
  Object.assign(PANEL, {estado:"vacio", error:"", datos:null, recs:[], anio:null});
  ["panelContenido", "panelDesc", "panelFiltros"].forEach(id => { const el = document.getElementById(id); if(el) el.innerHTML = ""; });
}
/* Un recordatorio lleva a Pendientes ya filtrada (Pendientes es siempre el año en curso). */
function panelIrAPendientes(clave){ irAPendientes(clave); }

/* ---------- pintar ---------- */
function panelDescripcion(d){
  const de = d.alcance === "institucion" ? "de la institución" : "de tus grupos";
  return `Agregados de la HCE calculados por el servidor sobre ${d.n_activos} ${d.n_activos === 1 ? "expediente activo" : "expedientes activos"} ${de}. `
    + `Sólo cantidades y promedios, sin nombres: el detalle de cada NNA está en su expediente.`;
}
function panelFiltrosHtml(){
  const opts = panelAnios().map(a => `<option value="${a}"${a === PANEL.anio ? " selected" : ""}>${a}</option>`).join("");
  return `<div class="filtro-grupo"><label for="panelAnio">Año</label><select id="panelAnio" onchange="panelElegirAnio(this.value)" aria-describedby="panelAnioHint">${opts}</select>
    <span class="hint" id="panelAnioHint">El año de la cadena (LB, PA, PB, IC). La banda es la del IDEA vigente de cada NNA.</span></div>`;
}
function panelKpi(lab, val, sub, campo){
  return `<div class="kpi" data-kpi="${campo}"><div class="lab">${lab}</div><div class="val">${val}</div><div class="sub">${sub}</div></div>`;
}
function panelKpisHtml(d){
  const n = d.n_activos, a = d.anio;
  const de = (c, k) => `<span data-c7="${k}">${c}</span><span class="kpi-den"> de <span data-c7="n_activos">${n}</span></span>`;
  return `<div class="kpirow kpirow-4" id="panelKpi">
    ${panelKpi(`Cobertura de línea base ${a}`, `<span data-c7="cobertura_lb.porcentaje">${d.cobertura_lb.porcentaje === null ? "—" : `${d.cobertura_lb.porcentaje} %`}</span>`,
      `${de(d.cobertura_lb.cantidad, "cobertura_lb.cantidad")} NNA activos con el IDEA de ${a} firmado`, "cobertura")}
    ${panelKpi(`Ciclos completos ${a}`, de(d.ciclos_completos.cantidad, "ciclos_completos.cantidad"),
      `CI registrado y LB, PA, PB e IC de ${a} firmados`, "ciclos")}
    ${panelKpi("NNA con Protocolo A y B firmados", de(d.protocolo.n_ciclo_ab, "protocolo.n_ciclo_ab"),
      `de ${a}, con el Δ B − A guardado (Escala IPPU-TEA)`, "ciclo_ab")}
    ${panelKpi("NNA con alguna alerta", de(d.alertas.nna_con_alguna, "alertas.nna_con_alguna"),
      `el Δ B − A de ${a} de una escala cae en un tramo con alerta`, "alertas")}
  </div>`;
}
function panelBandasHtml(d){
  const b = d.bandas;
  const filas = b.filas.map((f, i) => `<tr data-banda="${i}">
      <td>${bandaChipHtml(f)}</td>
      <td>${escHtml(f.nivel_dsm)}</td>
      <td class="num" data-c7="bandas.filas.${i}.cantidad">${panelNNA(f.cantidad)}</td></tr>`).join("");
  const fuera = b.fuera_de_catalogo ? `<tr><th scope="row" colspan="2">Con un total que ningún tramo del catálogo cubre</th><td class="num" data-c7="bandas.fuera_de_catalogo">${panelNNA(b.fuera_de_catalogo)}</td></tr>` : "";
  return `<div class="card" id="panelBandas">
    <div class="cardhead"><h2>Distribución por banda IDEA vigente</h2></div>
    <div class="cardbody">
      <div class="tabla-scroll"><table class="comp-table">
        <caption class="sr-only">NNA activos por banda de su IDEA vigente</caption>
        <thead><tr><th scope="col">Banda (catálogo)</th><th scope="col">Soporte DSM-5-TR orientativo de la banda</th><th scope="col" class="num">NNA</th></tr></thead>
        <tbody>${filas}
          <tr><th scope="row" colspan="2">Sin IDEA firmado</th><td class="num" data-c7="bandas.sin_idea_firmado">${panelNNA(b.sin_idea_firmado)}</td></tr>${fuera}</tbody>
      </table></div>
      <p class="note">Por el IDEA <b>vigente</b> de cada NNA: el firmado del año más reciente (§5.97); no cambia con el año elegido. Las bandas y sus rangos son los del catálogo. El soporte DSM-5-TR es orientativo y propio de la banda: no es el nivel de apoyo de ningún NNA (ese se registra en Severidad).</p>
    </div></div>`;
}
function panelProtocoloHtml(d){
  const p = d.protocolo;
  const cuerpo = p.n_ciclo_ab ? `<div class="tabla-scroll"><table class="comp-table">
      <caption class="sr-only">Promedios por escala de la Escala IPPU-TEA, Protocolo A y B de ${d.anio}</caption>
      <thead><tr><th scope="col">Escala IPPU-TEA</th><th scope="col" class="num">Protocolo A</th><th scope="col" class="num">Protocolo B</th><th scope="col" class="num">Δ B − A medio</th></tr></thead>
      <tbody>${p.escalas.map(e => `<tr data-escala="${escHtml(e.escala)}"><th scope="row">${escHtml(panelEscala(e.escala))}</th>
        <td class="num" data-c7="protocolo.${escHtml(e.escala)}.media_pa">${panelDec(e.media_pa)}</td>
        <td class="num" data-c7="protocolo.${escHtml(e.escala)}.media_pb">${panelDec(e.media_pb)}</td>
        <td class="num"><span aria-hidden="true">${panelDeltaGlifo(e.media_delta)} </span><span data-c7="protocolo.${escHtml(e.escala)}.media_delta">${panelDelta(e.media_delta)}</span></td></tr>`).join("")}</tbody>
    </table></div>
    <p class="note">${p.n_ciclo_ab === 1 ? "Valores del único NNA" : `Promedios de los ${p.n_ciclo_ab} NNA`} con el Protocolo A y el B de ${d.anio} firmados (máx. 30 puntos por escala; <b>acá el puntaje sube con el progreso</b>). El Δ es el B − A que guardó el servidor al firmar cada B. <b>El Δ medio no se interpreta:</b> el catálogo lee el Δ entero de cada NNA, no un promedio. El IDEA es otro instrumento y nunca comparte este eje.</p>`
    : estadoVacioHtml("◌", `Ningún NNA activo tiene el Protocolo A y el B de ${d.anio} firmados: la evolución A → B aparece con el primero.`);
  return `<div class="card" id="panelProtocolo"><div class="cardhead"><h2>Evolución Protocolo A → B — Escala IPPU-TEA</h2></div><div class="cardbody">${cuerpo}</div></div>`;
}
function panelAlertasHtml(d){
  const al = d.alertas;
  let cuerpo;
  if(!d.protocolo.n_ciclo_ab){
    cuerpo = estadoVacioHtml("◌", `Sin Protocolo A y B de ${d.anio} firmados: no hay Δ que leer.`);
  }else if(!al.nna_con_alguna){
    cuerpo = estadoVacioHtml("◌", `Ningún NNA tiene una escala con alerta en ${d.anio}.`);
  }else{
    cuerpo = `<ul class="panel-alertas">${al.escalas.map(e => `<li data-escala="${escHtml(e.escala)}"><span class="panel-alerta-esc">${escHtml(panelEscala(e.escala))}</span>
        <span class="panel-alerta-n">${e.cantidad ? `<span aria-hidden="true">⚠ </span>` : ""}<span data-c7="alertas.${escHtml(e.escala)}.cantidad">${e.cantidad ? `${panelNNA(e.cantidad)} con alerta` : "Ninguno"}</span></span></li>`).join("")}</ul>`;
  }
  return `<div class="card" id="panelAlertas"><div class="cardhead"><h2>Alertas por escala</h2></div><div class="cardbody">${cuerpo}
    <p class="note">La alerta es <b>por escala</b>: el Δ B − A de una escala cae en un tramo con alerta del catálogo; el total no alerta. Cantidades, sin nombres: cada alerta se ve en el expediente del NNA.</p></div></div>`;
}
function panelRecordatoriosHtml(d){
  const pend = d.pendientes_flujo, actual = d.anio === panelAnioActual();
  const celda = r => {
    if(!PANEL_CLAVES_FLUJO.includes(r.clave)) return `<span class="hint">—<span class="sr-only"> sin cuenta en el panel: es por expediente</span></span>`;
    const n = pend[r.clave];
    const txt = `<span data-c7="pendientes_flujo.${escHtml(r.clave)}">${n ? `${panelNNA(n)} sin firmar` : "Ninguno"}</span>`;
    return n && actual
      ? `<button type="button" class="btn-link" data-pend="${escHtml(r.clave)}" onclick="panelIrAPendientes('${escHtml(r.clave)}')">${txt} <span aria-hidden="true">›</span><span class="sr-only"> (ver en Pendientes)</span></button>`
      : txt;
  };
  const filas = PANEL.recs.map(r => `<tr data-clave="${escHtml(r.clave)}">
      <td>${escHtml(r.texto)}</td><td>${escHtml(r.periodo)}</td><td>${r.activo ? "Activo" : "Inactivo"}</td><td>${celda(r)}</td></tr>`).join("");
  const ci = `<p class="hint">Consentimiento sin registrar: <span data-c7="pendientes_flujo.ci">${panelNNA(pend.ci)}</span>${pend.ci && actual ? ` · <button type="button" class="btn-link" data-pend="ci" onclick="panelIrAPendientes('ci')">ver en Pendientes <span aria-hidden="true">›</span></button>` : ""}</p>`;
  return `<div class="card panel-ancho" id="panelRecordatorios">
    <div class="cardhead"><h2>Recordatorios — períodos del Manual</h2></div>
    <div class="cardbody">
      ${PANEL.recs.length ? `<div class="tabla-scroll"><table class="comp-table">
        <caption class="sr-only">Períodos del Manual y cuántos NNA activos tienen ese módulo de ${d.anio} sin firmar</caption>
        <thead><tr><th scope="col">Recordatorio</th><th scope="col">Período</th><th scope="col">Estado</th><th scope="col">Sin firmar en ${d.anio}</th></tr></thead>
        <tbody>${filas}</tbody></table></div>` : estadoVacioHtml("◌", "No hay recordatorios cargados.")}
      ${ci}
      <p class="note">Orientan, <b>no son fechas límite</b>: ninguno bloquea registrar ni firmar. Los textos y períodos los define coordinación (editarlos es posterior a esta versión). ${actual ? "Cada cuenta abre Pendientes con ese filtro." : `Pendientes muestra el año en curso: las cuentas de ${d.anio} no llevan enlace.`}</p>
    </div></div>`;
}
function panelPintar(){
  const cont = document.getElementById("panelContenido"); if(!cont) return;
  const desc = document.getElementById("panelDesc"), filtros = document.getElementById("panelFiltros");
  if(PANEL.estado === "vacio"){ cont.innerHTML = ""; if(desc) desc.textContent = ""; if(filtros) filtros.innerHTML = ""; return; }
  if(filtros && !filtros.querySelector("#panelAnio")) filtros.innerHTML = panelFiltrosHtml();
  const sel = document.getElementById("panelAnio"); if(sel) sel.value = String(PANEL.anio);
  if(PANEL.estado === "cargando"){ cont.innerHTML = estadoCargandoHtml("Cargando el panel…"); return; }
  if(PANEL.estado === "error"){ cont.innerHTML = estadoErrorHtml(PANEL.error, "panelCargar()"); if(desc) desc.textContent = ""; return; }
  const d = PANEL.datos;
  if(desc) desc.textContent = panelDescripcion(d);
  const vacio = d.n_activos === 0;
  cont.innerHTML = vacio
    ? `<div class="card" id="panelVacio"><div class="cardbody">${estadoVacioHtml("◌", d.alcance === "institucion"
        ? "No hay expedientes activos: el panel no tiene nada que sumar."
        : "No hay expedientes activos en tus grupos: el panel no tiene nada que sumar.")}</div></div>
      ${panelRecordatoriosHtml(d)}`
    : `${panelKpisHtml(d)}
      <div class="grid3">${panelBandasHtml(d)}${panelProtocoloHtml(d)}${panelAlertasHtml(d)}</div>
      ${panelRecordatoriosHtml(d)}`;
}

/* ---------- Heatmap talleres × escalas — DEMOSTRACIÓN (§5.1.3, fuera de alcance) ----------
   Valores de muestra fijos: no salen de la HCE. Los nombres se alinean con los 14 talleres reales del prototipo (§5.14 / D5);
   los valores no. El texto de cada celda se elige contra SU fondo (blanco sólo sobre el verde oscuro; tinta sobre los claros). */
const PANEL_HEAT_TALLERES = [
  ["Taller de habilidades sociales",[2.1,1.4,0.8,1.0]],
  ["Taller de cuentos y estimulación del lenguaje",[1.2,2.0,0.5,0.9]],
  ["Educación Física",[0.6,0.4,1.1,0.3]],
  ["Actividades lúdicas y de juego",[1.0,0.8,0.6,1.8]],
  ["Taller de música y expresión",[0.9,1.1,0.7,1.2]],
  ["Taller de higiene y AVD",[0.4,0.3,1.6,0.2]]
];
const heatColor = v => v>=1.5 ? "#0A6B5E" : v>=0.9 ? "#6FBF9E" : v>=0.4 ? "#D9C26B" : "#C9CFD8";
const heatTexto = v => v>=1.5 ? "#FFFFFF" : "var(--ink)";
(function pintarHeatmap(){
  const t = document.getElementById("heatTable"); if(!t) return;
  t.innerHTML = `<tr><th class="row">Taller</th><th>Rel. Soc.</th><th>Comun.</th><th>Anticip.</th><th>Simbol.</th></tr>` +
    PANEL_HEAT_TALLERES.map(r=>`<tr><th class="row">${r[0]}</th>${r[1].map(v=>`<td><div class="heat-cell" style="background:${heatColor(v)};color:${heatTexto(v)}">${v.toFixed(1)}</div></td>`).join("")}</tr>`).join("");
})();
