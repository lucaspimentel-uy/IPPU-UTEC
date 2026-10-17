/* Chequeo de SOLO LECTURA de que la demo de la presentación está lista (D0, handoff.md §5.139).
 *
 * Qué comprueba, en el navegador y contra la API que sirve la demo:
 *   (1) el técnico de la demo entra;
 *   (2) el listado muestra los 7 activos del seed (Tomás, dado de baja, no);
 *   (3) Martín: LB 58 con su banda, PA 60, PB 79 y Δ +19 (+4/+6/+4/+5), cada cifra tal como la devuelve la API
 *       (la pantalla debe mostrar lo mismo que el GET correspondiente);
 *   (4) su informe de cierre impreso abre.
 *
 * Termina con código 0 y UNA línea que empieza con «OK», o con código 1 y UNA línea «FALLA …» que nombra el primer
 * problema. No arregla nada: si falla, se vuelve a correr herramientas\preparar_presentacion.ps1.
 *
 * NUNCA ESCRIBE EN LA API, por construcción (mismo filtro que herramientas/verificar_contraste_ui.js): todo pedido del
 * navegador a la API pasa por un `ctx.route` que deja pasar sólo GET, OPTIONS (preflight, no lleva datos) y
 * `POST /auth/login`; cualquier otro método se ABORTA (el pedido no sale) y la corrida termina en 1 nombrándolo. Los
 * pedidos propios de este script son GET por construcción (`leer` no admite otro método). `VERIFICAR_AUTOPRUEBA=1`
 * prueba el filtro: emite un POST desde la página y debe terminar en 1.
 *
 * Requiere Playwright (reusa el install de demo/verificacion/: `npm ci && npx playwright install chromium` allí).
 *
 * Uso:  $env:IPPU_DEMO_PASSWORD = '…'; node herramientas\verificar_presentacion.js
 * Variables: API (http://localhost:8000) · DEMO (http://localhost:5500) · IPPU_DEMO_PASSWORD (la de los técnicos del
 * seed, obligatoria, no se imprime) · IPPU_DEMO_EMAIL (gonzalez@demo.ippu.test) · VERIFICAR_AUTOPRUEBA (=1).
 */
const path = require('path');

const REPO = path.resolve(__dirname, '..');
const API = (process.env.API || 'http://localhost:8000').replace(/\/$/, '');
const DEMO = (process.env.DEMO || 'http://localhost:5500').replace(/\/$/, '');
const EMAIL = process.env.IPPU_DEMO_EMAIL || 'gonzalez@demo.ippu.test';
const PASSWORD = process.env.IPPU_DEMO_PASSWORD;
const URL_DEMO = DEMO + '/index.html?api=' + encodeURIComponent(API);

/* Los siete activos del seed (`app/seed_demo.py`, `NNA`); Tomás (106) está dado de baja. */
const ACTIVOS = ['Sofía', 'Martín', 'Valentina', 'Joaquín', 'Lucía', 'Bruno', 'Camila'];
const NNA_DE_BAJA = 'Tomás';
/* Las cifras de Martín (arquetipo del §12-A de esquema-datos-v2.md). */
const MARTIN = { lb: 58, pa: 60, pb: 79, delta: 19, deltas: { esc_1: 4, esc_2: 6, esc_3: 4, esc_4: 5 } };

class Falla extends Error {}
const fallar = (mensaje) => { throw new Falla(mensaje); };

let chromium;
try {
  chromium = require(path.join(REPO, 'implementacion/L1-hce-idea/demo/verificacion/node_modules', 'playwright')).chromium;
} catch {
  console.error('FALLA no se encontró Playwright en demo/verificacion/node_modules (cd implementacion/L1-hce-idea/demo/verificacion && npm ci && npx playwright install chromium)');
  process.exit(1);
}

const abortados = [];            // escrituras que el filtro frenó
let paso = 'preparación';        // el paso en curso, para nombrar un fallo inesperado (p. ej. un timeout)
const norm = (t) => String(t).replace(/\s+/g, ' ').trim();
const fmtD = (d) => (d > 0 ? '+' : '') + d;

/* Filtro de escritura: ver el encabezado. */
async function instalarFiltroDeEscritura(ctx) {
  await ctx.route((u) => u.href.startsWith(API + '/'), async (route) => {
    const req = route.request();
    const m = req.method();
    const ruta = new URL(req.url()).pathname;
    if (m === 'GET' || m === 'OPTIONS' || (m === 'POST' && ruta === '/auth/login')) return route.continue();
    abortados.push(`${m} ${ruta}`);
    return route.abort('blockedbyclient');
  });
}
const sinEscrituras = () => { if (abortados.length) fallar(`la página intentó escribir en la API (${abortados.join(' · ')}); el filtro lo bloqueó, pero eso no debería pasar`); };

/* GET a la API con el token de la sesión del navegador. Sólo GET: no hay parámetro de método. */
async function leer(ruta, token) {
  const r = await fetch(API + ruta, { headers: { Authorization: 'Bearer ' + token } });
  if (!r.ok) fallar(`GET ${ruta} respondió ${r.status}`);
  return { json: await r.json(), total: r.headers.get('X-Total-Count') };
}

async function main() {
  if (!PASSWORD) fallar('falta IPPU_DEMO_PASSWORD (la contraseña de los técnicos de la demo; el chequeo no la imprime)');
  paso = 'API y demo arriba';
  for (const [nombre, url] of [['la API', API + '/health'], ['la demo', DEMO + '/index.html']]) {
    let r;
    try { r = await fetch(url); } catch (e) { fallar(`no responde ${nombre} en ${url} (${e.message}); ¿corrió preparar_presentacion.ps1?`); }
    if (!r.ok) fallar(`${nombre} respondió ${r.status} en ${url}`);
  }

  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await instalarFiltroDeEscritura(ctx);
    const page = await ctx.newPage();
    const erroresJs = [];
    page.on('pageerror', (e) => erroresJs.push(e.message));
    page.setDefaultTimeout(10000);

    // ---- (1) el técnico entra
    paso = `login del técnico ${EMAIL}`;
    await page.goto(URL_DEMO);
    await page.fill('#loginUser', EMAIL);
    await page.fill('#loginPass', PASSWORD);
    await page.click('#loginBtn');
    const resultado = await Promise.race([
      page.waitForSelector('#loginScreen.hidden', { state: 'attached' }).then(() => 'entro'),
      page.waitForSelector('#loginError:not([hidden])').then(() => 'rechazado'),
    ]);
    if (resultado !== 'entro') {
      fallar(`el login de ${EMAIL} fue rechazado («${norm(await page.locator('#loginError').innerText())}»); ¿está cargada la demo y es esa la contraseña?`);
    }
    sinEscrituras();
    const token = await page.evaluate(() => sessionStorage.getItem('ippu.token'));
    if (!token) fallar('el login no dejó token en la sesión');

    if (process.env.VERIFICAR_AUTOPRUEBA === '1') {
      // Autoprueba del filtro: un POST de escritura emitido desde la página con el token real. No debe llegar a la API.
      const r = await page.evaluate(async (api) => {
        try { await fetch(api + '/hce', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + sessionStorage.getItem('ippu.token') }, body: '{}' }); return 'llegó a la API'; }
        catch (e) { return 'abortado en el navegador'; }
      }, API);
      console.log(`AUTOPRUEBA · POST /hce desde la página: ${r}`);
      sinEscrituras();
      fallar('AUTOPRUEBA fallida: el filtro no registró el POST');
    }

    // ---- (2) el listado: los siete activos del seed
    paso = 'listado de activos';
    await page.waitForFunction(() => /Mostrando \d+ de/.test(document.getElementById('listaResumen').textContent) ||
      /No se encontraron/.test(document.getElementById('tbodyNNA').textContent));
    const resumen = norm(await page.locator('#listaResumen').innerText());
    // F1 (§5.140): el nombre completo es el botón de la fila («Martín G.»); se compara el nombre de pila.
    const filas = await page.$$eval('#tbodyNNA tr[data-hce]', (trs) => trs.map((tr) => ({ id: tr.dataset.hce, nombre: tr.querySelector('.nna-abrir').innerText.trim().split(/\s+/)[0], activo: tr.dataset.activo })));
    const nombres = filas.map((f) => f.nombre);
    const faltan = ACTIVOS.filter((n) => !nombres.includes(n));
    if (!resumen.startsWith(`Mostrando ${ACTIVOS.length} de ${ACTIVOS.length}`) || faltan.length || nombres.includes(NNA_DE_BAJA) || filas.length !== ACTIVOS.length) {
      fallar(`el listado no muestra los ${ACTIVOS.length} activos del seed (dice «${resumen}», filas: ${nombres.join(', ') || 'ninguna'}${faltan.length ? '; faltan: ' + faltan.join(', ') : ''}); ¿está cargada la demo?`);
    }
    const idMartin = Number(filas.find((f) => f.nombre === 'Martín').id);

    // ---- (3) Martín: LB 58 + banda · PA 60 · PB 79 · Δ +19, tal como los devuelve la API
    paso = 'abrir el expediente de Martín';
    await page.locator('#tbodyNNA tr[data-hce]').filter({ hasText: 'Martín' }).getByRole('button', { name: /Abrir expediente/ }).click();
    await page.waitForSelector('#expTitulo');
    await page.waitForFunction(() => !!EXP.flujo && !!EXP.mods);

    paso = 'LB de Martín';
    const idea = (await leer(`/hce/${idMartin}/idea`, token)).json[0];
    if (!idea || idea.total !== MARTIN.lb || !idea.banda) fallar(`la API no devuelve el IDEA de Martín con total ${MARTIN.lb} y banda (devuelve ${idea ? idea.total : 'ninguno'})`);
    await page.click('#tabExp-lb');
    await page.waitForSelector('#evTotal');
    const lb = await page.evaluate(() => ({ total: document.getElementById('evTotal').textContent.trim(),
      banda: (document.querySelector('#evBanda .banda-chip') || { innerText: '' }).innerText.replace(/\s+/g, ' ') }));
    const bandaApi = `${idea.banda.total_min}–${idea.banda.total_max}`;
    if (lb.total !== String(MARTIN.lb) || !lb.banda.includes(idea.banda.perfil) || !lb.banda.includes(bandaApi)) {
      fallar(`LB de Martín: la pantalla muestra «${lb.total}» y banda «${lb.banda}»; la API dice ${idea.total} y «${idea.banda.perfil} · ${bandaApi}»`);
    }

    paso = 'PA y PB de Martín';
    const protocolos = (await leer(`/hce/${idMartin}/protocolo`, token)).json;
    const paApi = protocolos.find((p) => p.tipo === 'A'), pbApi = protocolos.find((p) => p.tipo === 'B');
    if (!paApi || paApi.total !== MARTIN.pa) fallar(`la API no devuelve el PA de Martín con total ${MARTIN.pa} (devuelve ${paApi ? paApi.total : 'ninguno'})`);
    if (!pbApi || pbApi.total !== MARTIN.pb || !pbApi.deltas || pbApi.deltas.total !== MARTIN.delta) {
      fallar(`la API no devuelve el PB de Martín con total ${MARTIN.pb} y Δ ${fmtD(MARTIN.delta)} (devuelve ${pbApi ? pbApi.total + ' / Δ ' + (pbApi.deltas && pbApi.deltas.total) : 'ninguno'})`);
    }
    await page.click('#tabExp-pa');
    await page.waitForSelector('#evTotal');
    const totalPa = (await page.locator('#evTotal').innerText()).trim();
    if (totalPa !== String(MARTIN.pa)) fallar(`PA de Martín: la pantalla muestra «${totalPa}»; la API dice ${paApi.total}`);
    await page.click('#tabExp-pb');
    await page.waitForSelector('#evResultado');                // F1: el Δ del PB es el bloque «Resultado»
    const pb = await page.evaluate(() => ({ total: document.getElementById('evTotal').textContent.trim(),
      filas: Object.fromEntries([...document.querySelectorAll('#evResultado [data-delta]')].map((c) => [c.dataset.delta, c.querySelector('.res-delta').innerText.trim()])) }));
    if (pb.total !== String(MARTIN.pb)) fallar(`PB de Martín: la pantalla muestra «${pb.total}»; la API dice ${pbApi.total}`);
    const esperadoDelta = { total: fmtD(pbApi.deltas.total), ...Object.fromEntries(Object.entries(MARTIN.deltas).map(([k, v]) => [k, fmtD(v)])) };
    const malos = Object.entries(esperadoDelta).filter(([k, v]) => pb.filas[k] !== v || fmtD(pbApi.deltas[k]) !== v);
    if (malos.length) fallar(`Δ de Martín: ${malos.map(([k, v]) => `${k} pantalla «${pb.filas[k]}» · API «${fmtD(pbApi.deltas[k])}» · esperado «${v}»`).join('; ')}`);

    // ---- (4) su informe de cierre impreso abre
    paso = 'informe de cierre impreso de Martín';
    const ic = (await leer(`/hce/${idMartin}/informe-cierre`, token)).json[0];
    if (!ic || !ic.firmado) fallar('la API no devuelve el informe de cierre de Martín firmado');
    await leer(`/informe-cierre/${ic.id}/documento`, token);
    await page.click('#tabExp-ic');
    await page.waitForSelector('#btnIcImpreso');
    await page.click('#btnIcImpreso');
    await page.waitForSelector('#informeContent .print-wrap');
    await page.waitForFunction(() => !/Cargando el/.test(document.getElementById('informeContent').innerText));
    const impreso = norm(await page.locator('#informeContent').innerText());
    if (!impreso.includes('Martín')) fallar('el informe impreso de Martín abrió sin su nombre');

    // ---- cierre
    sinEscrituras();
    if (erroresJs.length) fallar(`errores de JavaScript en la página: ${erroresJs.join(' | ')}`);
    console.log(`OK · demo lista: ${ACTIVOS.length} activos · Martín LB ${lb.total} (${idea.banda.perfil} ${bandaApi}) · PA ${totalPa} · PB ${pb.total} · Δ ${pb.filas.total} · informe impreso abre · ${abortados.length} escrituras`);
  } finally {
    await browser.close();
  }
}

main().then(() => process.exit(0)).catch((e) => {
  const detalle = abortados.length ? ` (escrituras frenadas: ${abortados.join(' · ')})` : '';
  console.error(e instanceof Falla ? `FALLA ${e.message}${detalle}` : `FALLA en «${paso}»: ${norm(e.message).slice(0, 200)}${detalle}`);
  process.exit(1);
});
