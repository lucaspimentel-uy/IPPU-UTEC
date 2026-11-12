/* Estrés de carga de la demo (§5.167 f): cuántas cargas de index.html salen incompletas contra un servidor de la demo.
 *
 * Reproduce el banco de D1 (§5.166): contexto NUEVO por carga, N cargas en paralelo × M cada una, la demo sin API (no hace falta:
 * no se loguea nadie). Sólo LEE: necesita la demo servida y nada más. No usa la API ni escribe en ninguna base.
 *
 * Qué cuenta, por carga:
 *   · con archivo fallido: algún pedido al origen de la demo terminó en `requestfailed` (o `goto` no llegó a index.html);
 *   · la carga final: «completa» (aparece el login), «aviso» (el aviso «La página no cargó completa», tras la recarga automática)
 *     o «sin cargar» (ni login ni aviso en 10 s: típicamente no llegó index.html y la página no puede hacer nada);
 *   · «recuperada»: hubo archivo fallido pero la página terminó completa (la recarga automática la salvó).
 *   · los archivos fallidos por error (`net::ERR_...`).
 *
 * Uso:  node herramientas/estres_carga_demo.js            (DEMO=http://127.0.0.1:5500  PARALELO=12  CARGAS=50)
 * Sale 0 siempre que mida; el veredicto lo lee quien compara las variantes. Imprime una tabla legible y una línea JSON final.
 * Requiere Playwright (el install de demo/verificacion/, como verificar_contraste_ui.js).
 */
const path = require('path');
const REPO = path.resolve(__dirname, '..');
let chromium;
try { chromium = require(path.join(REPO, 'implementacion/L1-hce-idea/demo/verificacion/node_modules/playwright')).chromium; }
catch { console.error('No se encontró Playwright en demo/verificacion/node_modules (npm ci allí).'); process.exit(1); }

const DEMO = process.env.DEMO || 'http://127.0.0.1:5500';
const PARALELO = +(process.env.PARALELO || 12);
const CARGAS = +(process.env.CARGAS || 50);
const URL_DEMO = DEMO + '/index.html?api=' + encodeURIComponent('http://127.0.0.1:8001');
const origen = new URL(DEMO).origin;

(async () => {
  const t0 = Date.now();
  const browser = await chromium.launch();
  const r = { total: 0, conFallo: 0, completa: 0, aviso: 0, sinCargar: 0, recuperada: 0, porError: {}, porArchivo: {}, gotoErrores: {} };
  async function una() {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const fallos = [];
    page.on('requestfailed', (q) => {
      let u; try { u = new URL(q.url()); } catch { return; }
      if (u.origin !== origen) return;
      fallos.push([u.pathname, q.failure() ? q.failure().errorText : 'sin detalle']);
    });
    let gotoFallo = null;
    await page.goto(URL_DEMO, { waitUntil: 'load', timeout: 15000 }).catch((e) => { gotoFallo = String(e.message).split('\n')[0]; });
    // El estado final: el login (carga completa) o el aviso (la recarga automática también falló). La recarga interrumpe el goto: se espera a ver cuál sale.
    let fin = 'sinCargar';
    try {
      fin = await page.waitForFunction(() => {
        const a = document.getElementById('cargaIncompleta');
        if (a && !a.hidden) return 'aviso';
        const l = document.getElementById('loginScreen');
        if (l && !l.classList.contains('hidden') && typeof arrancarSesion === 'function') return 'completa';
        return false;
      }, null, { timeout: 10000, polling: 100 }).then((h) => h.jsonValue());
    } catch { fin = 'sinCargar'; }
    r.total++;
    r[fin]++;
    if (fallos.length || gotoFallo) {
      r.conFallo++;
      if (fin === 'completa') r.recuperada++;
      for (const [p, e] of fallos) { r.porError[e] = (r.porError[e] || 0) + 1; r.porArchivo[p] = (r.porArchivo[p] || 0) + 1; }
      if (gotoFallo) r.gotoErrores[gotoFallo.slice(0, 90)] = (r.gotoErrores[gotoFallo.slice(0, 90)] || 0) + 1;
    }
    await ctx.close().catch(() => {});
  }
  await Promise.all(Array.from({ length: PARALELO }, async () => { for (let i = 0; i < CARGAS; i++) await una(); }));
  await browser.close();
  const seg = ((Date.now() - t0) / 1000).toFixed(0);
  console.log(`Estrés de carga · ${DEMO} · ${PARALELO} en paralelo × ${CARGAS} = ${r.total} cargas en ${seg} s`);
  console.log(`  con algún archivo fallido: ${r.conFallo} · terminaron completas: ${r.completa} (recuperadas por la recarga: ${r.recuperada}) · con el aviso: ${r.aviso} · sin cargar: ${r.sinCargar}`);
  console.log('  archivos fallidos por error: ' + (Object.keys(r.porError).length ? Object.entries(r.porError).map(([e, n]) => `${e}=${n}`).join(' · ') : 'ninguno'));
  if (Object.keys(r.gotoErrores).length) console.log('  goto que no llegó: ' + Object.entries(r.gotoErrores).map(([e, n]) => `${e}=${n}`).join(' · '));
  const top = Object.entries(r.porArchivo).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (top.length) console.log('  archivos más afectados: ' + top.map(([p, n]) => `${p}=${n}`).join(' · '));
  console.log('RESULTADO_JSON ' + JSON.stringify({ demo: DEMO, paralelo: PARALELO, cargas: CARGAS, segundos: +seg, ...r }));
})().catch((e) => { console.error('ERROR del script:', e); process.exit(1); });
