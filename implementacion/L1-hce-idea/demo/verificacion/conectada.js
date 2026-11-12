/* Verificación de la demo CONECTADA a la API (Fase 3-a · handoff §5.122; prefijos de fase en README.md).
 *
 * A diferencia de fingerprint.js (que compara el comportamiento de la demo ESTÁTICA, sin API),
 * este script prueba contra una API real: login, listado, HCE-00 y modo demostración.
 *
 * Requisitos (ver README.md, sección «Demo conectada»):
 *   - API en http://127.0.0.1:8000 con la base cargada por `python -m app.seed_demo`
 *   - demo servida en http://127.0.0.1:5500   (cd demo && python -m http.server 5500)
 *   - IPPU_DEMO_PASSWORD = contraseña del técnico de la demo (la del seed)
 *
 * Uso:  IPPU_DEMO_PASSWORD=... IPPU_ADMIN_EMAIL=... IPPU_ADMIN_PASSWORD=... node conectada.js
 * Opcionales: API=http://127.0.0.1:8000  DEMO=http://127.0.0.1:5500   (la demo se abre con ?api=<API>)
 *             IPPU_DEMO_EMAIL=gonzalez@demo.ippu.test   HEADED=1
 * ⚠️ Desde la Fase 3-b la corrida ESCRIBE y exige CONFIRMA_BASE_DESCARTABLE=1 (aborta con exit 1 sin ella, antes de pedir nada) (crea un expediente, lo edita, registra su CI): los conteos del
 *    principio son los del seed recién cargado, así que para repetirla hay que recrear la base (README).
 * Sale 0 si todo pasa, 1 si algo falla (o si la API/la demo no están arriba).
 */
const { chromium } = require('playwright');

const API = process.env.API || 'http://127.0.0.1:8000';
const DEMO = process.env.DEMO || 'http://127.0.0.1:5500';
const EMAIL = process.env.IPPU_DEMO_EMAIL || 'gonzalez@demo.ippu.test';
const PASSWORD = process.env.IPPU_DEMO_PASSWORD;
const ADMIN_EMAIL = process.env.IPPU_ADMIN_EMAIL;        // el admin del seed (IPPU_EMAIL / IPPU_PASSWORD con los que se cargó)
const ADMIN_PASSWORD = process.env.IPPU_ADMIN_PASSWORD;

const resultados = [];
function check(id, nombre, ok, detalle) {
  resultados.push({ id, nombre, ok: !!ok, detalle: detalle || '' });
  console.log(`${ok ? 'PASS' : 'FAIL'}  (${id}) ${nombre}${detalle ? '  → ' + detalle : ''}`);
}

/* Archivos estáticos de la demo que NO llegaron (§5.166 d): un `requestfailed` de un pedido al origen de la demo (index.html, js/, css/).
   Antes la corrida no se enteraba: el navegador lo deja en la consola como «Failed to load resource» y el chequeo z descarta ese texto
   (es lo esperado para un 4xx/5xx de la API). Un módulo que falta se ve como un clic que no manda ningún pedido. Ver el chequeo z-carga. */
const cargasFallidas = [];
const hora = (t = Date.now()) => new Date(t).toISOString().slice(11, 23);
/* §5.167 e: cada archivo que falló lleva la hora y el id del último chequeo que se había registrado (el que corría es el siguiente).
   `ignorar` (RegExp sobre la URL) deja afuera el archivo que una prueba aborta A PROPÓSITO: cualquier OTRO que falle sí se informa. */
function vigilarCarga(page, ignorar = null) {
  page.on('requestfailed', (r) => {
    let u; try { u = new URL(r.url()); } catch { return; }
    if (u.origin !== new URL(DEMO).origin) return;
    if (ignorar && ignorar.test(r.url())) return;
    const f = r.failure();
    const ult = resultados.length ? resultados[resultados.length - 1].id : 'inicio';
    cargasFallidas.push(`${u.pathname}${u.search} (${f ? f.errorText : 'sin detalle'}) a las ${hora()} tras el chequeo «${ult}»`);
  });
}

/* §5.167 e · Diagnóstico de una corrida que se cuelga o se aborta. Todo contexto del navegador registra los pedidos en vuelo (método, URL,
   desde cuándo) y las últimas 20 líneas de consola; si la corrida termina por un timeout o un error del script, se vuelcan antes de salir.
   CONECTADA_LIMITE_MS (opcional, lo pone herramientas/correr_conectada.ps1): tope de la corrida; al vencer vuelca y sale con 1. */
const enVuelo = new Map();                       // request -> {ctx, metodo, url, desde}
const ultimaConsola = [];
function vigilarContexto(ctx) {
  ctx.on('request', (r) => enVuelo.set(r, { ctx, metodo: r.method(), url: r.url(), desde: Date.now() }));
  ctx.on('requestfinished', (r) => enVuelo.delete(r));
  ctx.on('requestfailed', (r) => enVuelo.delete(r));
  ctx.on('console', (m) => { ultimaConsola.push(`${hora()} [${m.type()}] ${m.text().replace(/\s+/g, ' ').slice(0, 300)}`); if (ultimaConsola.length > 20) ultimaConsola.shift(); });
  ctx.on('weberror', (w) => { ultimaConsola.push(`${hora()} [pageerror] ${String(w.error().message).replace(/\s+/g, ' ').slice(0, 300)}`); if (ultimaConsola.length > 20) ultimaConsola.shift(); });
  ctx.on('close', () => { for (const [r, v] of enVuelo) if (v.ctx === ctx) enVuelo.delete(r); });   // lo que quedó de un contexto cerrado ya no está en vuelo
}
let diagnosticoVolcado = false;
function volcarDiagnostico(motivo) {
  if (diagnosticoVolcado) return; diagnosticoVolcado = true;
  const ahora = Date.now();
  const l = [`\n===== DIAGNÓSTICO (${motivo}) a las ${hora(ahora)} =====`];
  const ult = resultados.length ? resultados[resultados.length - 1].id : 'ninguno';
  l.push(`último chequeo registrado: «${ult}» (${resultados.length} hasta ahora)`);
  l.push(`pedidos en vuelo: ${enVuelo.size}`);
  for (const v of enVuelo.values()) l.push(`  ${v.metodo} ${v.url}  desde las ${hora(v.desde)} (hace ${ahora - v.desde} ms)`);
  l.push(`archivos estáticos que fallaron: ${cargasFallidas.length}`);
  for (const f of cargasFallidas) l.push('  ' + f);
  l.push(`últimas ${ultimaConsola.length} líneas de consola:`);
  for (const c of ultimaConsola) l.push('  ' + c);
  l.push('===== fin del diagnóstico =====');
  console.error(l.join('\n'));
}
if (process.env.CONECTADA_LIMITE_MS) {
  setTimeout(() => { volcarDiagnostico(`tope de la corrida: CONECTADA_LIMITE_MS=${process.env.CONECTADA_LIMITE_MS}`); process.exit(1); }, +process.env.CONECTADA_LIMITE_MS).unref();
}
process.on('SIGINT', () => { volcarDiagnostico('SIGINT'); process.exit(1); });
process.on('SIGTERM', () => { volcarDiagnostico('SIGTERM'); process.exit(1); });
/* Los KPI de Inicio salen de OTRO pedido (GET /hce?limit=200) que el del listado: esperar el «Mostrando…» no garantiza que ya llegaron. */
async function esperarKpis(page) {
  await page.waitForFunction(() => ['kpiTotal', 'kpiAlDia', 'kpiPend', 'kpiCi'].every((id) => document.getElementById(id).textContent.trim() !== '…'), null, { timeout: 8000 });
}

async function preflight() {
  // La corrida ESCRIBE (crea expedientes, firma, agrega addendas): jamás contra una base que importe. Va ANTES de cualquier pedido.
  if (process.env.CONFIRMA_BASE_DESCARTABLE !== '1') {
    console.error('Esta verificación ESCRIBE en la base de la API (' + API + '): crea expedientes, firma módulos y agrega addendas.\n' +
      'Correla sólo contra una base descartable y confirmalo con CONFIRMA_BASE_DESCARTABLE=1 (ver README.md → «Base descartable»).');
    process.exit(1);
  }
  if (!PASSWORD) { console.error('Falta IPPU_DEMO_PASSWORD (contraseña del técnico de la demo).'); process.exit(1); }
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) { console.error('Faltan IPPU_ADMIN_EMAIL / IPPU_ADMIN_PASSWORD (el admin del seed): el chequeo (c) de la 3-b compara el 409 del admin con el del técnico.'); process.exit(1); }
  for (const [nombre, url] of [['API', API + '/health'], ['demo', DEMO + '/index.html']]) {
    try { const r = await fetch(url); if (!r.ok) throw new Error('HTTP ' + r.status); }
    catch (e) { console.error(`No responde la ${nombre} en ${url} (${e.message}). Ver README.md → «Demo conectada».`); process.exit(1); }
  }
}

/* La demo habla con la API que diga `?api=`; sin él, con la de por omisión (:8000). Por eso SIEMPRE se le pasa la
   API de esta corrida: si no, `API=http://localhost:8001 node conectada.js` consultaria una API y la demo otra. */
const urlDemo = (q) => DEMO + '/index.html' + (q && /[?&]api=/.test(q) ? q : (q ? q + '&' : '?') + 'api=' + encodeURIComponent(API));
const txt = (page, sel) => page.locator(sel).first().innerText();
/* Los fuentes de la demo, de a UNO (no con Promise.all): `http.server` tiene una cola de 5 conexiones y en Windows, llena,
   contesta con RST; una ráfaga de 23 fetch daba `ECONNREFUSED` de vez en cuando (la inestabilidad de handoff §6, «después
   de 3e-estados», es la de f1-h; medido el 2026-11-06). Devuelve [[nombre, texto], …] en el orden pedido. */
async function leerFuentes(nombres, prefijo = '') {
  const salida = [];
  for (const f of nombres) salida.push([f, await (await fetch(DEMO + '/' + prefijo + f)).text()]);
  return salida;
}

/* Esc sobre un diálogo con lo tipeado SIN guardar pide confirmación (Fase 3-e): este helper la contesta con «Descartar y cerrar».
   Si el diálogo no tenía nada sin guardar, Esc lo cierra sin preguntar y no hay nada que contestar. */
async function escDescartando(page) {
  await page.keyboard.press('Escape');
  const hay = await page.locator('.confirmar-descarte').count();
  if (hay) await page.click('#btnCdDescartar');
}

/* Espera a que el listado termine de cargar un resultado con ese resumen exacto. */
async function esperarResumen(page, esperado) {
  await page.waitForFunction((e) => document.getElementById('listaResumen').textContent.startsWith(e), esperado, { timeout: 8000 });
}
async function filas(page) { return page.locator('#tbodyNNA tr[data-hce]').count(); }

/* Escribe en la caja de busqueda y devuelve el GET /hce que se mando (parametros reales), las filas
   resultantes y el html de la tabla. Sirve para afirmar la regla de busqueda de ui-core.js, no solo el resultado. */
async function buscar(page, texto) {
  const req = page.waitForRequest((r) => r.method() === 'GET' && /\/hce\?/.test(r.url()) && !/limit=200/.test(r.url()), { timeout: 8000 });
  await page.fill('#searchNNA', texto);
  const r = await req;
  await page.waitForFunction(() => !/Cargando/.test(document.getElementById('tbodyNNA').textContent) &&
    (/Mostrando \d+ de/.test(document.getElementById('listaResumen').textContent) || /No se encontraron/.test(document.getElementById('tbodyNNA').textContent)), null, { timeout: 8000 });
  return { params: Object.fromEntries(new URL(r.url()).searchParams), filas: await filas(page), html: await txt(page, '#tbodyNNA') };
}

async function loguear(page) {
  await page.goto(urlDemo());
  await page.fill('#loginUser', EMAIL);
  await page.fill('#loginPass', PASSWORD);
  await page.click('#loginBtn');
  await page.waitForSelector('#loginScreen.hidden', { state: 'attached', timeout: 8000 });
}

/* ---------- Fase 4 (A1 · docs/diseno/fase4-acceso.md i): el expediente «ajeno» de los chequeos -ajeno ----------
   Lo crea el técnico EN SU GRUPO y carga él los datos (coordinación ya no escribe lo clínico, F4-5); después coordinación le
   quita el grupo —un pase de caso, PATCH /hce/{id}/identificacion {grupo_id: null}—: el técnico deja de ser tratante. Cada
   `api` es la de su bloque: (metodo, ruta, body, token?) con el token del técnico por omisión. */
async function grupoPropio(api) {
  const yo = (await api('GET', '/auth/yo')).json;
  const g = (await api('GET', '/grupos')).json.find((x) => (x.tecnico1 && x.tecnico1.id === yo.id) || (x.tecnico2 && x.tecnico2.id === yo.id));
  return g.id;
}
async function altaPropia(api, persona) {
  const r = await api('POST', '/hce', { persona, grupo_id: await grupoPropio(api) });
  return r.json.data.id;
}
async function pasarDeCaso(api, id, tokAdmin) {
  return (await api('PATCH', `/hce/${id}/identificacion`, { grupo_id: null }, tokAdmin)).status;
}
/* Coordinación sobre una ruta del ajeno: sin ventana, 403 reason_required; abre la ventana (supervisión); con ella, 200. */
async function coordSinYConVentana(api, id, ruta, tokAdmin) {
  const sin = await api('GET', ruta, undefined, tokAdmin);
  const abre = await api('POST', `/hce/${id}/accesos`, { motivo_codigo: 'supervision' }, tokAdmin);
  const con = await api('GET', ruta, undefined, tokAdmin);
  return { sin: [sin.status, sin.json && sin.json.code], abre: abre.status, con: con.status };
}
const ok403 = (r, code) => r[0] === 403 && r[1] === code;
/* La pantalla del técnico frente al ajeno: el diálogo del motivo y ningún dato del NNA; «Cancelar» (sin pedido) cierra. */
async function pantallaMotivo(page, id, opts) {
  await page.evaluate(([i, o]) => abrirExpediente(i, o || undefined), [id, opts || null]);
  await page.waitForSelector('#modalFlujo.open #mfMotivo', { timeout: 8000 });
  const p = await page.evaluate(() => ({ dialogo: !!document.querySelector('#modalFlujo.open #mfMotivo'), banda: !!document.getElementById('expTitulo'),
    txt: document.getElementById('expedienteContent').innerText + ' ' + document.getElementById('mfBody').innerText }));
  await page.click('#btnMotivoCancelar');
  await page.waitForFunction(() => !document.querySelector('#modalFlujo.open'), null, { timeout: 8000 });
  return p;
}

(async () => {
  await preflight();
  const browser = await chromium.launch({ headless: !process.env.HEADED });
  const nuevoContexto = browser.newContext.bind(browser);          // todo contexto, de donde sea que se cree, entra al diagnóstico (§5.167 e)
  browser.newContext = async (...args) => { const c = await nuevoContexto(...args); vigilarContexto(c); return c; };
  const erroresPagina = [];
  const nuevaPagina = async () => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    page.on('pageerror', (e) => erroresPagina.push(e.message));
    page.on('console', (m) => {
      // Un 4xx/5xx de la API se loguea solo como "Failed to load resource": es esperado en (b)/(i). Los archivos estáticos de la
      // demo que no llegan también, pero esos NO se descartan: los cuenta vigilarCarga (chequeo z-carga).
      if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) erroresPagina.push('console: ' + m.text());
    });
    vigilarCarga(page);
    return { ctx, page };
  };

  /* ---------- carga-: una página que no carga completa (§5.166 c) ----------
     index.html comprueba, tras el último módulo, que cada uno de los 21 de js/ haya definido su función. Aquí se ABORTA a propósito
     js/expediente.js (route.abort): esas páginas no pasan por nuevaPagina()/vigilarCarga (el requestfailed es el esperado) ni cuentan
     sus pageerror (los módulos que dependen del que falta tiran ReferenceError, por diseño). */
  {
    const K = 'ippu.cargaReintento';
    const MOD = '**/js/expediente.js';
    const abierta = async (p) => p.waitForFunction(() => typeof abrirExpediente === 'function', null, { timeout: 8000 });
    const estado = (p) => p.evaluate((k) => { const a = document.getElementById('cargaIncompleta'); const al = a.querySelector('[role="alert"]');
      return { oculto: a.hidden, texto: al ? al.textContent.replace(/\s+/g, ' ').trim() : '', marca: sessionStorage.getItem(k), faltan: a.getAttribute('data-faltan'),
        foco: document.activeElement.id, loginInerte: document.getElementById('loginScreen').inert, token: sessionStorage.getItem('ippu.token') }; }, K);

    // (1) carga completa: sin aviso y sin marca
    {
      const { ctx, page } = await nuevaPagina();
      await page.goto(urlDemo());
      await abierta(page); await page.waitForSelector('#loginScreen:not(.hidden)');
      const e = await estado(page);
      check('carga-ok', 'una carga completa no muestra el aviso «La página no cargó completa», no deja la marca de reintento y el login queda a la vista',
        e.oculto && e.marca === null && !e.loginInerte, JSON.stringify(e));
      await ctx.close();
    }

    // (2) falla sólo la primera vez: UNA recarga automática y la sesión arranca normal
    {
      const ctx = await browser.newContext(); const page = await ctx.newPage();
      vigilarCarga(page, /\/js\/expediente\.js/);            // el abortado a propósito no cuenta; otro archivo caído, sí (z-carga)
      let pedidos = 0;
      await ctx.route(MOD, (route) => (pedidos++ === 0 ? route.abort() : route.continue()));
      const aApi = [];
      page.on('request', (r) => { if (r.url().startsWith(API + '/')) aApi.push(r.method() + ' ' + new URL(r.url()).pathname); });
      await page.goto(urlDemo()).catch(() => {});          // la recarga interrumpe esta navegación: no es un error
      await abierta(page); await page.waitForSelector('#loginScreen:not(.hidden)');
      await page.fill('#loginUser', EMAIL); await page.fill('#loginPass', PASSWORD); await page.click('#loginBtn');
      await page.waitForSelector('#loginScreen.hidden', { state: 'attached', timeout: 8000 });
      await page.waitForFunction(() => /Mostrando \d+ de/.test(document.getElementById('listaResumen').textContent), null, { timeout: 8000 });
      const e = await estado(page);
      check('carga-reintento', 'si falta un módulo la primera vez: una recarga automática (expediente.js pedido 2 veces), sin aviso, la marca se borra y la sesión arranca (login y listado)',
        pedidos === 2 && e.oculto && e.marca === null && !!e.token, JSON.stringify({ pedidos, ...e, api: aApi.slice(0, 3) }));
      await ctx.close();
    }

    // (3) falta en TODAS las cargas: aviso con role="alert", «Recargar» a mano, sin sesión y sin un solo pedido a la API
    {
      const ctx = await browser.newContext(); const page = await ctx.newPage();
      vigilarCarga(page, /\/js\/expediente\.js/);
      let pedidos = 0;
      await ctx.route(MOD, (route) => { pedidos++; return route.abort(); });
      const aApi = [];
      page.on('request', (r) => { if (r.url().startsWith(API + '/')) aApi.push(r.method() + ' ' + new URL(r.url()).pathname); });
      await page.goto(urlDemo()).catch(() => {});
      await page.waitForSelector('#cargaIncompleta:not([hidden])', { timeout: 8000 });
      await page.waitForTimeout(600);                       // si arrancara la sesión, el pedido saldría en este margen
      const e = await estado(page);
      const pedidosTrasAviso = pedidos;
      // §5.167 e: la lista informada INCLUYE el archivo abortado; si por un fallo de red real cayó otro, aparece también (y z-carga lo cuenta)
      check('carga-aviso', 'si sigue faltando tras la recarga: aviso (role="alert") «La página no cargó completa. Recargá para seguir.», marca puesta, el login (inerte) no arranca la sesión y no sale ningún pedido a la API; la lista de lo que falta incluye expediente.js',
        !e.oculto && e.texto === 'La página no cargó completa. Recargá para seguir. Recargar' && e.marca === '1' && e.loginInerte && !e.token && aApi.length === 0 && pedidosTrasAviso === 2 && (e.faltan || '').split(' ').includes('expediente.js'),
        JSON.stringify({ pedidos: pedidosTrasAviso, ...e, api: aApi }));
      // teclado: el botón recibe el foco al aparecer; con Tab y Shift+Tab ES lo único que recibe foco (el login de atrás está inerte) y con Enter recarga
      // (una vez más: la marca ya está puesta, no hay bucle). Se recorre el ciclo con Tab; '' = el foco salió del documento (body).
      const foco0 = e.foco;
      const visto = new Set();
      await page.evaluate(() => document.activeElement.blur());
      for (let i = 0; i < 4; i++) { await page.keyboard.press(i < 2 ? 'Tab' : 'Shift+Tab'); visto.add(await page.evaluate(() => document.activeElement.id)); }
      await page.focus('#btnRecargar');
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => !document.getElementById('cargaIncompleta').hidden && document.activeElement.id === 'btnRecargar', null, { timeout: 8000 });
      await page.waitForTimeout(400);
      check('carga-teclado', '«Recargar» tiene el foco al aparecer, se alcanza con Tab / Shift+Tab y es lo único enfocable (sólo recibe foco él o el documento), y con Enter recarga: expediente.js se pide una vez más y el aviso sigue',
        foco0 === 'btnRecargar' && visto.has('btnRecargar') && [...visto].every((id) => id === 'btnRecargar' || id === '') && pedidos === pedidosTrasAviso + 1 && aApi.length === 0,
        JSON.stringify({ foco0, visto: [...visto], pedidos, api: aApi.length }));
      // el archivo vuelve: «Recargar» a mano completa la carga, el aviso se va y la marca se borra
      await ctx.unroute(MOD);
      await page.click('#btnRecargar');
      await abierta(page); await page.waitForSelector('#loginScreen:not(.hidden)');
      const f = await estado(page);
      check('carga-recupera', 'cuando el archivo vuelve, «Recargar» completa la carga: sin aviso, marca borrada y login funcional', f.oculto && f.marca === null && !f.loginInerte, JSON.stringify(f));
      await ctx.close();
    }

    /* La hoja de estilos (§5.167 a): index.html lee --ink (la define :root de css/estilos.css) y la trata como un módulo más. */
    const CSS = '**/css/estilos.css';
    const sinHoja = (p) => p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() === '');

    // (4) falla sólo la primera vez: UNA recarga, sin aviso, la hoja se aplica y la sesión arranca
    {
      const ctx = await browser.newContext(); const page = await ctx.newPage();
      vigilarCarga(page, /\/css\/estilos\.css/);
      let pedidos = 0;
      await ctx.route(CSS, (route) => (pedidos++ === 0 ? route.abort() : route.continue()));
      await page.goto(urlDemo()).catch(() => {});
      await abierta(page); await page.waitForSelector('#loginScreen:not(.hidden)');
      await page.fill('#loginUser', EMAIL); await page.fill('#loginPass', PASSWORD); await page.click('#loginBtn');
      await page.waitForSelector('#loginScreen.hidden', { state: 'attached', timeout: 8000 });
      await page.waitForFunction(() => /Mostrando \d+ de/.test(document.getElementById('listaResumen').textContent), null, { timeout: 8000 });
      const e = await estado(page);
      const hoja = !(await sinHoja(page));
      check('carga-css-reintento', 'si estilos.css no llega la primera vez: una recarga automática (la hoja se pide 2 veces), sin aviso, la hoja queda aplicada, la marca se borra y la sesión arranca',
        pedidos === 2 && hoja && e.oculto && e.marca === null && !!e.token, JSON.stringify({ pedidos, hoja, ...e }));
      await ctx.close();
    }

    // (5) falta en TODAS las cargas: aviso legible SIN la hoja, con «Recargar», sin sesión y sin un pedido a la API; falta = css/estilos.css
    {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } }); const page = await ctx.newPage();
      vigilarCarga(page, /\/css\/estilos\.css/);
      let pedidos = 0;
      await ctx.route(CSS, (route) => { pedidos++; return route.abort(); });
      const aApi = [];
      page.on('request', (r) => { if (r.url().startsWith(API + '/')) aApi.push(r.method() + ' ' + new URL(r.url()).pathname); });
      await page.goto(urlDemo()).catch(() => {});
      await page.waitForSelector('#cargaIncompleta:not([hidden])', { timeout: 8000 });
      await page.waitForTimeout(600);
      const e = await estado(page);
      const vis = await page.evaluate(() => {
        const a = document.getElementById('cargaIncompleta'), b = document.getElementById('btnRecargar'), p = document.getElementById('cargaIncompletaTxt');
        const cs = getComputedStyle(a), r = b.getBoundingClientRect(), rp = p.getBoundingClientRect();
        const arriba = document.elementFromPoint(rp.left + rp.width / 2, rp.top + rp.height / 2);
        return { posicion: cs.position, fondo: cs.backgroundColor, btnVisible: r.width > 0 && r.height > 0 && r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight,
          txtTapaTodo: a.contains(arriba), tamano: parseFloat(getComputedStyle(p).fontSize), btnTamano: parseFloat(getComputedStyle(b).fontSize) };
      });
      check('carga-css-aviso', 'si estilos.css falta en todas las cargas: tras la recarga, aviso (role="alert") con «Recargar», LEGIBLE sin la hoja (tapa la página, texto ≥ 12 px, botón dentro de la ventana), marca puesta, login inerte, sin sesión ni pedidos a la API; la lista de lo que falta incluye css/estilos.css',
        !e.oculto && e.texto === 'La página no cargó completa. Recargá para seguir. Recargar' && e.marca === '1' && e.loginInerte && !e.token && aApi.length === 0 && pedidos === 2 && (e.faltan || '').split(' ').includes('css/estilos.css')
          && (await sinHoja(page)) && vis.posicion === 'fixed' && vis.btnVisible && vis.txtTapaTodo && vis.tamano >= 12 && vis.btnTamano >= 12,
        JSON.stringify({ pedidos, ...e, vis, api: aApi }));
      // la hoja vuelve: «Recargar» completa la carga con estilo, sin aviso y sin marca
      await ctx.unroute(CSS);
      await page.click('#btnRecargar');
      await abierta(page); await page.waitForSelector('#loginScreen:not(.hidden)');
      const f = await estado(page);
      check('carga-css-recupera', 'cuando estilos.css vuelve, «Recargar» completa la carga: hoja aplicada, sin aviso, marca borrada y login funcional', f.oculto && f.marca === null && !f.loginInerte && !(await sinHoja(page)), JSON.stringify(f));
      await ctx.close();
    }
  }

  /* ---------- (b) contraseña incorrecta: error visible, foco en el alert, sessionStorage vacío ---------- */
  {
    const { ctx, page } = await nuevaPagina();
    await page.goto(urlDemo());
    check('3a-pre', 'el login NO trae usuario ni contraseña precargados',
      (await page.inputValue('#loginUser')) === '' && (await page.inputValue('#loginPass')) === '');
    const dlg = await page.evaluate(() => {
      const d = document.getElementById('loginScreen');
      const lab = document.getElementById(d.getAttribute('aria-labelledby') || '');
      return { role: d.getAttribute('role'), modal: d.getAttribute('aria-modal'), nombre: lab ? lab.textContent.trim() : '',
        inertTop: document.querySelector('header.topbar').inert, inertLayout: document.querySelector('div.layout').inert };
    });
    check('3a-l1', 'el login es un diálogo modal con nombre accesible y el resto de la app está inerte mientras se ve',
      dlg.role === 'dialog' && dlg.modal === 'true' && dlg.nombre !== '' && dlg.inertTop && dlg.inertLayout, JSON.stringify(dlg));
    await page.focus('#loginBtn');
    const visitados = [];
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press(i % 2 ? 'Shift+Tab' : 'Tab');
      visitados.push(await page.evaluate(() => { const a = document.activeElement; return { id: a.id, tag: a.tagName, fuera: !!a.closest('header.topbar, div.layout') }; }));
    }
    check('3a-l2', 'con el login a la vista, Tab/Shift+Tab desde «Ingresar» nunca llega al chip de usuario ni a la app de atrás',
      visitados.every((v) => !v.fuera && v.id !== 'userChip'), visitados.map((v) => v.id || v.tag).join(' → '));
    await page.fill('#loginUser', EMAIL);
    await page.fill('#loginPass', 'contraseña-incorrecta');
    await page.click('#loginBtn');
    await page.waitForSelector('#loginError:not([hidden])', { timeout: 8000 });
    const msg = await txt(page, '#loginError');
    const foco = await page.evaluate(() => document.activeElement && document.activeElement.id);
    const rol = await page.getAttribute('#loginError', 'role');
    const ss = await page.evaluate(() => sessionStorage.length);
    const visible = await page.isVisible('#loginScreen');
    check('3a-b', 'contraseña incorrecta: error en role="alert", con foco, sessionStorage vacío, sigue en el login',
      /incorrect/i.test(msg) && foco === 'loginError' && rol === 'alert' && ss === 0 && visible,
      `mensaje="${msg}" foco=${foco} role=${rol} sessionStorage.length=${ss}`);
    await ctx.close();
  }

  /* ---------- (a) login del técnico + chip ---------- */
  const { ctx, page } = await nuevaPagina();
  await loguear(page);
  const chip = (await txt(page, '#userNombre')).trim();
  const chipRol = (await txt(page, '#userRol')).trim();
  const usuarioSS = await page.evaluate(() => JSON.parse(sessionStorage.getItem('ippu.usuario') || 'null'));
  const tokenSS = await page.evaluate(() => sessionStorage.getItem('ippu.token'));
  check('3a-a', 'login del técnico de la demo: el chip muestra su nombre y rol (de la API)',
    usuarioSS && chip === usuarioSS.nombre && chip === 'Dr. González' && chipRol === 'Técnico/a' && !!tokenSS,
    `chip="${chip}" rol="${chipRol}" usuario(sessionStorage)=${usuarioSS && usuarioSS.nombre}/${usuarioSS && usuarioSS.rol}`);

  const tras = await page.evaluate(() => ({ foco: document.activeElement.id, tag: document.activeElement.tagName,
    inert: document.querySelector('header.topbar').inert || document.querySelector('div.layout').inert,
    tabindex: document.getElementById('tituloInicio').getAttribute('tabindex') }));
  check('3a-l3', 'tras un login correcto el foco va al título principal de Inicio (tabindex=-1) y la app deja de estar inerte',
    tras.foco === 'tituloInicio' && tras.tag === 'H1' && tras.tabindex === '-1' && !tras.inert, JSON.stringify(tras));

  /* ---------- (c) conteos del listado y filtro de grupo (== tests/test_m11_5a_seed_demo.py) ---------- */
  await esperarResumen(page, 'Mostrando 7 de 7');
  await esperarKpis(page);   // §5.166 d: el KPI llega en otro pedido que el listado
  const kpiTotal = (await txt(page, '#kpiTotal')).trim();
  check('3a-c1', 'activos: «Mostrando 7 de 7» (Tomás, dado de baja, no aparece) y KPI de activos = 7',
    (await filas(page)) === 7 && kpiTotal === '7', `filas=${await filas(page)} kpiTotal=${kpiTotal} resumen="${await txt(page, '#listaResumen')}"`);

  await page.click('.chip-estado[data-estado="todos"]');
  await esperarResumen(page, 'Mostrando 8 de 8');
  check('3a-c2', 'todos (incluir_inactivos): «Mostrando 8 de 8»', (await filas(page)) === 8, `filas=${await filas(page)}`);

  await page.click('.chip-estado[data-estado="inactivos"]');
  await esperarResumen(page, 'Mostrando 1 de 1');
  const inactivoNombre = await txt(page, '#tbodyNNA tr[data-hce] .nna-abrir');   // F1: el nombre completo es el botón de la fila
  check('3a-c3', 'inactivos (filtro en el cliente): 1 fila — Tomás', (await filas(page)) === 1 && inactivoNombre.startsWith('Tomás'), `fila="${inactivoNombre}"`);

  // Grupos: con incluir_inactivos (Todos) → 3 / 3 / 2, como afirma el test del seed.
  await page.click('.chip-estado[data-estado="todos"]');
  await esperarResumen(page, 'Mostrando 8 de 8');
  await page.waitForFunction(() => document.querySelectorAll('#filtroGrupo option').length > 1, null, { timeout: 8000 });   // §5.166 d: GET /grupos es otro pedido
  const opciones = await page.$$eval('#filtroGrupo option', (os) => os.map((o) => o.textContent.trim()));
  check('3a-c4', 'el filtro de grupo sale de GET /grupos (año en curso): 5 grupos reales + «Todos»',
    JSON.stringify(opciones) === JSON.stringify(['Todos', 'Adolescentes', 'Escolares', 'Inicial', 'Preadolescentes', 'Taller de Adolescentes']),
    opciones.join(' | '));
  const esperadoGrupo = { Escolares: 3, Preadolescentes: 3, Adolescentes: 2 };
  for (const [grupo, n] of Object.entries(esperadoGrupo)) {
    await page.selectOption('#filtroGrupo', { label: grupo });
    await esperarResumen(page, `Mostrando ${n} de ${n}`);
    const celdas = await page.$$eval('#tbodyNNA tr[data-hce] td:nth-child(2)', (tds) => tds.map((t) => t.textContent.trim()));   // F1: Grupo es la 2.ª columna
    check('3a-c5-' + grupo, `grupo ${grupo} con inactivos: ${n} filas, todas del grupo`,
      (await filas(page)) === n && celdas.every((c) => c === grupo), `filas=${await filas(page)} grupos=${[...new Set(celdas)].join(',')}`);
  }
  await page.click('.chip-estado[data-estado="activos"]');   // Adolescentes + activos → solo Valentina
  await esperarResumen(page, 'Mostrando 1 de 1');
  check('3a-c6', 'grupo Adolescentes, solo activos: 1 fila (Tomás es el inactivo)', (await filas(page)) === 1);
  await page.selectOption('#filtroGrupo', { label: 'Todos' });
  await esperarResumen(page, 'Mostrando 7 de 7');

  /* ---------- (d) búsqueda: la regla de la caja (ui-core.js · consultaDeBusqueda) y su efecto real ---------- */
  const tabla = [['6.012.345-1', { ci: '60123451' }], ['60123451', { ci: '60123451' }], ['6012345', { ci: '6012345' }],
    ['123456', { numero: '123456' }], ['1002', { numero: '1002' }], ['601234', { numero: '601234' }],
    ['Martín', { nombre: 'Martín' }], ['  ', {}]];
  const mapeo = await page.evaluate((casos) => casos.map(([t]) => consultaDeBusqueda(t)), tabla);
  const malMapeo = tabla.filter(([t, esp], i) => JSON.stringify(mapeo[i]) !== JSON.stringify(esp)).map(([t]) => `«${t}»`);
  check('3a-m0', 'consultaDeBusqueda: cédula (con separadores o 7+ dígitos) → ci · hasta 6 dígitos sin separadores → numero · texto → nombre',
    malMapeo.length === 0, malMapeo.length ? 'mal: ' + malMapeo.join(', ') : tabla.length + ' casos');

  let r = await buscar(page, '6.012.345-1');
  check('3a-d', 'búsqueda por la cédula «6.012.345-1» → GET /hce?ci=60123451 → 1 fila: Martín (la cédula no se muestra en el listado, F1)',
    r.params.ci === '60123451' && !r.params.numero && !r.params.nombre && r.filas === 1 && /Martín/.test(r.html) && !/6\.012\.345-1/.test(r.html),
    JSON.stringify(r.params) + ' filas=' + r.filas);
  r = await buscar(page, '60123451');
  check('3a-m1', 'cédula de 8 dígitos sin separadores → ci → 1 fila: Martín', r.params.ci === '60123451' && !r.params.numero && r.filas === 1 && /Martín/.test(r.html), JSON.stringify(r.params) + ' filas=' + r.filas);
  r = await buscar(page, '6012345');
  check('3a-m2', 'límite 7 dígitos sin separadores («6012345») → ci (no numero) → 1 fila: Martín', r.params.ci === '6012345' && !r.params.numero && r.filas === 1 && /Martín/.test(r.html), JSON.stringify(r.params) + ' filas=' + r.filas);
  r = await buscar(page, '601234');
  check('3a-m3', 'límite 6 dígitos sin separadores («601234») → numero (no ci) → sin resultados (no existe esa HCE)', r.params.numero === '601234' && !r.params.ci && r.filas === 0 && /No se encontraron/.test(r.html), JSON.stringify(r.params) + ' filas=' + r.filas);
  r = await buscar(page, '1002');
  check('3a-d2', 'búsqueda por N.º de HCE «1002» → GET /hce?numero=1002 → exactamente 1 fila: Martín, con N.º 1002',
    r.params.numero === '1002' && !r.params.ci && r.filas === 1 && /Martín/.test(r.html) && /HC 1002\b/.test(r.html), JSON.stringify(r.params) + ' filas=' + r.filas);
  r = await buscar(page, 'Mart');
  check('3a-m4', 'búsqueda por nombre «Mart» → GET /hce?nombre=Mart → al menos 1 fila, con Martín', r.params.nombre === 'Mart' && !r.params.ci && !r.params.numero && r.filas >= 1 && /Martín/.test(r.html), JSON.stringify(r.params) + ' filas=' + r.filas);
  r = await buscar(page, 'zzzz');
  check('3a-d3', 'búsqueda sin resultados: estado vacío con mensaje (no pantalla en blanco)', r.filas === 0 && /No se encontraron NNA/.test(r.html), JSON.stringify(r.params));
  await page.fill('#searchNNA', '');
  await esperarResumen(page, 'Mostrando 7 de 7');

  /* ---------- (e) Bruno: CI pendiente visible ---------- */
  const filaBruno = page.locator('#tbodyNNA tr[data-hce]', { hasText: 'Bruno' });
  const textoBruno = (await filaBruno.innerText()).replace(/\s+/g, ' ');
  const pillBruno = await filaBruno.locator('.st-ci-pend').count();
  await esperarKpis(page);
  const kpiCi = (await txt(page, '#kpiCi')).trim();
  check('3a-e', 'la fila de Bruno muestra «CI pendiente» (texto + glifo, no solo color) y el KPI de CI pendiente = 1',
    /CI pendiente/.test(textoBruno) && pillBruno === 1 && kpiCi === '1', `fila="${textoBruno}" kpiCi=${kpiCi}`);
  const resto = await page.locator('#tbodyNNA tr[data-hce]', { hasNotText: 'Bruno' }).locator('.st-ci-pend').count();
  check('3a-e2', 'ningún otro NNA del seed tiene el CI pendiente', resto === 0, `otros pendientes=${resto}`);

  /* ---------- (f) HCE-00 de Martín: valores de la API + técnicos del grupo ---------- */
  const idMartin = await page.locator('#tbodyNNA tr[data-hce]', { hasText: 'Martín' }).getAttribute('data-hce');
  await page.locator('#tbodyNNA tr[data-hce]', { hasText: 'Martín' }).getByRole('button', { name: /Abrir expediente/ }).click();
  await page.waitForSelector('#expTitulo', { timeout: 8000 });
  const token = await page.evaluate(() => sessionStorage.getItem('ippu.token'));
  const api = await (await fetch(`${API}/hce/${idMartin}`, { headers: { Authorization: 'Bearer ' + token } })).json();
  const exp = await txt(page, '#view-expediente');
  const titulo = (await txt(page, '#expTitulo')).trim();
  const foco = await page.evaluate(() => document.activeElement && document.activeElement.id);
  const esperados = [api.diagnostico, api.cie11, api.derivacion, api.grupo.nombre,
    api.grupo.tecnico1.nombre, api.grupo.tecnico1.rol, api.grupo.tecnico2.nombre, api.grupo.tecnico2.rol,
    api.anamnesis.motivo, api.persona.referente, api.persona.telefono, api.persona.localidad];
  const faltan = esperados.filter((v) => !exp.includes(v));
  check('3a-f1', 'abrir Martín: HCE-00 con los valores de GET /hce/{id} y los técnicos del grupo (nombre + rol en el grupo)',
    faltan.length === 0 && titulo === `${api.persona.nombre} ${api.persona.apellido}` && /6\.012\.345-1/.test(exp),
    faltan.length ? 'faltan: ' + faltan.join(' | ') : `título="${titulo}" técnicos="${api.grupo.tecnico1.nombre} (${api.grupo.tecnico1.rol}) + ${api.grupo.tecnico2.nombre} (${api.grupo.tecnico2.rol})"`);
  check('3a-f2', 'el foco queda en el título del expediente', foco === 'expTitulo', `foco=${foco}`);
  const pasosM = await page.$$eval('#tabsExpWrap [role="tab"][data-mod]', (bs) => bs.map((b) => b.querySelector('.tab-nombre').textContent + b.querySelector('.st-mini .sr-only').textContent));
  const flujoM = await page.evaluate(() => document.getElementById('tabsExpWrap').textContent.replace(/\s+/g, ' '));
  check('3a-f3', 'flujo del año desde GET /hce/{id}/flujo en las pestañas del ciclo anual (Martín: CI registrado + LB, PA, PB, IC firmados), con glifo y texto de estado',
    JSON.stringify(pasosM) === JSON.stringify(['Línea base: firmado', 'Protocolo A: firmado', 'Protocolo B: firmado', 'Cierre: firmado']) &&
    /CI●: registrado/.test(flujoM) && /Ciclo anual \d{4}/i.test(flujoM) && /●/.test(flujoM), flujoM.slice(0, 150));
  const ocultos = ['Talleres', 'Nivel de soporte', 'Historial clínico', 'Tendencia', 'Bloquead', '🔒', 'Azul', 'Celeste', 'Naranja'].filter((t) => exp.includes(t));
  check('3a-f4', 'lo que la API no guarda (talleres, nivel de soporte, historial, tendencia) y los colores de grupo de la demo NO aparecen; tampoco candados ni «Bloqueado»',
    ocultos.length === 0, ocultos.length ? 'aparece: ' + ocultos.join(',') : '');
  const edadEsperada = (() => { const n = new Date(api.persona.fecha_nac); const h = new Date(); let e = h.getFullYear() - n.getFullYear();
    if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getUTCDate())) e--; return e; })();
  check('3a-f5', 'la edad sale de persona.fecha_nac (no hay columna edad)', new RegExp(`${edadEsperada} años`).test(exp), `esperada=${edadEsperada}`);
  const hayInputs = await page.locator('#view-expediente input, #view-expediente textarea, #view-expediente select').count();
  const editores = await page.locator('#view-expediente [onclick^="openEditar"]').count();
  check('3a-f6', 'HCE-00 se lee como texto (sin campos sueltos en la vista); la edición va en un diálogo que se abre con «Editar datos», el ÚNICO punto de edición del expediente',
    hayInputs === 0 && (await page.locator('#expHead >> text=✎ Editar datos').count()) === 1 && editores === 1, `inputs=${hayInputs} puntos de edición=${editores}`);

  /* Pestañas: un módulo no conectado muestra el panel de modo demostración y SIN datos; teclado. */
  await page.click('#tabExp-pai');                                  // C5: DOC está conectada; la pestaña de demostración que queda es PAI
  const panelLb = (await txt(page, '#panelExp')).replace(/\s+/g, ' ');
  const tabSel = await page.getAttribute('#tabExp-pai', 'aria-selected');
  check('3a-g1', 'pestaña no conectada (PAI; DOC se conectó en C5): panel «Modo demostración — no se guarda» con role="note" y badge «Solo demo»',
    /Modo demostración — no se guarda/.test(panelLb) && (await page.locator('#panelExp [role="note"]').count()) === 1 &&
    (await page.locator('#panelExp .solo-demo').count()) >= 1 && tabSel === 'true', panelLb.slice(0, 140));
  const textosTab = [];
  for (const k of ['hce00', 'ci', 'lb', 'pa', 'pb', 'ic', 'vf', 'sev', 'doc', 'org', 'inc', 'pai', 'log']) {
    await page.click('#tabExp-' + k);
    textosTab.push(k + ': ' + (await page.evaluate(() => document.getElementById('view-expediente').innerText + ' ' + [...document.querySelectorAll('#view-expediente [title]')].map((e) => e.title).join(' '))));
  }
  const tabsConFase = textosTab.filter((t) => /Fase\s*\d/.test(t)).map((t) => t.split(':')[0]);
  // sólo pai (el 11) dice la frase; doc (el 8, C5) e inc (el 10, C4) ya no: están conectadas (org, el 9, es C3)
  const sinFraseNueva = /Este módulo todavía no está conectado al servidor\./.test(textosTab[11]) && [8, 10].every((i) => !/Este módulo todavía no está conectado al servidor\./.test(textosTab[i]));
  check('3a-f1b', 'las 13 pestañas (texto y tooltips): sin «Fase …»; HCE-00, CI, LB, PA, PB, IC, VF, SEV (C2), INC (C4), ORG (C3), DOC (C5) y LOG (C1) están conectadas y la otra (PAI) dice «Este módulo todavía no está conectado al servidor.»',
    tabsConFase.length === 0 && sinFraseNueva, tabsConFase.length ? 'con Fase: ' + tabsConFase.join(',') : '13/13');
  await page.click('#tabExp-lb');
  await page.focus('#tabExp-lb');
  await page.keyboard.press('ArrowRight');
  const sigSel = await page.getAttribute('#tabExp-pa', 'aria-selected');
  const sigFoco = await page.evaluate(() => document.activeElement && document.activeElement.id);
  check('3a-g2', 'las pestañas se operan con teclado (flecha derecha: selecciona y enfoca la siguiente)', sigSel === 'true' && sigFoco === 'tabExp-pa', `foco=${sigFoco}`);

  /* ---------- (g) vistas de demostración: panel en todas ---------- */
  const vistas = [['pendientes', '.navitem[data-view="pendientes"]'], ['analitica', '.navitem[data-view="analitica"]'],
    ['grupos', '.navitem[data-view="grupos"]'], ['inclusion', '.navitem[data-view="inclusion"]'],
    ['ateneos', '.navitem[data-view="ateneos"]'], ['usuarios', '#userChip']];
  const sinPanel = [], conPanel = [];
  const textoVistas = {};
  for (const [v, sel] of vistas) {
    await page.click(sel);
    if (v === 'pendientes' || v === 'grupos' || v === 'inclusion' || v === 'ateneos' || v === 'analitica') {   // F2, C4, C6 y C7: ya no son de demostración (conectadas a la API): no llevan el panel
      await page.waitForFunction((x) => (x === 'pendientes' ? PEND.estado : x === 'grupos' ? GRP.estado : x === 'inclusion' ? INCV.estado : x === 'analitica' ? PANEL.estado : AT.lista.estado) === 'listo', v, { timeout: 8000 });
      // C7: en el Panel institucional sólo la tarjeta del heatmap (demostración, §5.1.3) lleva el panel compartido
      const fuera = await page.evaluate((x) => [...document.querySelectorAll(`#view-${x} .demo-panel`)].filter((e) => !e.closest('#panelHeatmap')).length, v);
      if (fuera !== 0) conPanel.push(v);
    } else {
      const t = (await txt(page, `#view-${v} .demo-panel`)).replace(/\s+/g, ' ');
      const roleNote = await page.locator(`#view-${v} .demo-panel[role="note"]`).isVisible();
      if (!(/Modo demostración — no se guarda/.test(t) && roleNote)) sinPanel.push(v);
    }
    textoVistas[v] = await page.evaluate(() => document.body.innerText);
  }
  check('3a-g3', 'Usuarios muestra el panel «Modo demostración — no se guarda» (role="note"); Pendientes y Grupos (conectadas, F2), Inclusión (conectada, C4), Ateneos (conectada, C6) y el Panel institucional (conectado, C7: sólo la tarjeta del heatmap lo lleva) ya no lo llevan',
    sinPanel.length === 0 && conPanel.length === 0, sinPanel.length || conPanel.length ? 'sin panel: ' + sinPanel.join(',') + ' · con panel (no debería): ' + conPanel.join(',') : '1/1 con panel, 5/5 sin panel');
  check('3a-u', '«Mi usuario» (vista de ejemplo) no afirma ser la cuenta con sesión iniciada',
    !/sesión iniciada|datos de la cuenta|mi perfil/i.test(await txt(page, '#view-usuarios')) && /Perfil de ejemplo/.test(await txt(page, '#view-usuarios')),
    (await txt(page, '#view-usuarios .pagedesc')).trim());
  const conFase = Object.entries(textoVistas).filter(([, t]) => /Fase\s*3|Fase\s*\d-[a-e]/.test(t)).map(([v]) => v);
  check('3a-f0', 'ninguna vista visible menciona «Fase 3…» (las etapas son interna del equipo)', conFase.length === 0, conFase.join(',') || '6 vistas');
  /* C7: ninguna vista conectada abre el expediente de EJEMPLO (los ids de la demo y los de la API nunca se mezclan). Los
     recordatorios del Panel eran el último lugar que lo abría; el código del expediente de ejemplo queda (3a-g5 lo usa). */
  await page.click('.navitem[data-view="inicio"]');
  await page.waitForFunction(() => /Mostrando \d+ de/.test(document.getElementById('listaResumen').textContent), null, { timeout: 8000 });
  const abrenDemo = [];
  for (const [v, sel] of [['inicio', null], ...vistas.filter(([x]) => x !== 'usuarios')]) {
    if (sel) {
      await page.click(sel);
      await page.waitForFunction((x) => (x === 'pendientes' ? PEND.estado : x === 'grupos' ? GRP.estado : x === 'inclusion' ? INCV.estado : x === 'analitica' ? PANEL.estado : AT.lista.estado) === 'listo', v, { timeout: 8000 });
    }
    if (await page.evaluate((x) => /abrirExpedienteDemo/.test(document.getElementById('view-' + x).innerHTML), v)) abrenDemo.push(v);
  }
  check('3a-g4', 'ninguna vista conectada (Inicio, Pendientes, Grupos, Inclusión, Ateneos y, desde C7, el Panel institucional) abre el expediente de EJEMPLO: no hay abrirExpedienteDemo en su HTML (los ids de la demo y los de la API no se mezclan)',
    abrenDemo.length === 0, abrenDemo.join(',') || '6 vistas sin abrirExpedienteDemo');

  const humo = await page.evaluate(() => {
    try {
      abrirExpedienteDemo(102); renderUsuario();   // C7: renderNNA() se retiró (sólo recalculaba la analítica de ejemplo)
      return 'ok';
    } catch (e) { return 'ERROR: ' + e.message; }
  });
  check('3a-g5', 'el expediente de ejemplo que queda en modo demostración sigue andando y lleva su panel (el IC y la VF ya no son de ejemplo: viven en el expediente de la API, 3-d)',
    humo === 'ok' && (await page.locator('#expedienteContent .demo-panel').count()) === 1, `humo=${humo}`);

  /* ---------- (w) la página no desborda horizontalmente: lista y HCE-00 a 390, 1024 y 1280 px ---------- */
  const anchos = [];
  for (const w of [390, 1024, 1280]) {
    await page.setViewportSize({ width: w, height: 800 });
    await page.evaluate(() => go('inicio'));
    const lst = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    await page.evaluate((id) => abrirExpediente(id), +idMartin);
    await page.waitForSelector('#expTitulo');
    const hce = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    anchos.push({ w, lst, hce });
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  check('3a-w', 'documentElement.scrollWidth == ancho de la ventana en la lista y en el HCE-00 a 390, 1024 y 1280 px',
    anchos.every((a) => a.lst[0] === a.lst[1] && a.hce[0] === a.hce[1]),
    anchos.map((a) => `${a.w}px: lista ${a.lst[0]}/${a.lst[1]} · HCE-00 ${a.hce[0]}/${a.hce[1]}`).join(' | '));

  /* ---------- (j) recarga con token válido: se mantiene la sesión ---------- */
  await page.goto(urlDemo());
  await page.waitForSelector('#loginScreen.hidden', { state: 'attached', timeout: 8000 });
  await esperarResumen(page, 'Mostrando 7 de 7');
  check('3a-j', 'recargar la página con token guardado: se valida con GET /auth/yo y no pide login', (await txt(page, '#userNombre')).trim() === 'Dr. González');

  /* ---------- (h) logout ---------- */
  await page.click('.btn-exit');
  const login = await page.isVisible('#loginScreen');
  const ssTrasLogout = await page.evaluate(() => sessionStorage.length);
  const tbodyVacio = (await page.locator('#tbodyNNA').innerHTML()).trim() === '';
  const expVacio = (await page.locator('#expedienteContent').innerHTML()).trim() === '';
  check('3a-h', 'logout: vuelve a la pantalla de login, sessionStorage vacío y sin datos de NNA detrás',
    login && ssTrasLogout === 0 && tbodyVacio && expVacio, `login=${login} sessionStorage.length=${ssTrasLogout} tbodyVacio=${tbodyVacio} expVacio=${expVacio}`);
  await ctx.close();

  /* ---------- (i) token inválido guardado: 401 → login con aviso, sessionStorage limpio ---------- */
  {
    const { ctx: c2, page: p2 } = await nuevaPagina();
    await p2.goto(urlDemo());
    // con la API de esta corrida guardada junto al token (§5.157 b): sin ella, la sesión se borra al cargar y no llega a validarse
    await p2.evaluate(() => { sessionStorage.setItem('ippu.token', 'token-invalido'); sessionStorage.setItem('ippu.usuario', '{"nombre":"X","rol":"admin"}'); sessionStorage.setItem('ippu.api', API_BASE); });
    await p2.goto(urlDemo());
    await p2.waitForSelector('#loginError:not([hidden])', { timeout: 8000 });
    const m = await txt(p2, '#loginError');
    const ss2 = await p2.evaluate(() => sessionStorage.length);
    check('3a-i', 'token inválido guardado: se valida, da 401, vuelve al login con aviso y sessionStorage limpio',
      /sesión/i.test(m) && ss2 === 0 && (await p2.isVisible('#loginScreen')), `mensaje="${m}" sessionStorage.length=${ss2}`);
    await c2.close();
  }

  /* ---------- (k) API caída: mensaje legible ---------- */
  {
    const { ctx: c3, page: p3 } = await nuevaPagina();
    await p3.goto(urlDemo('?api=http://localhost:9'));
    await p3.fill('#loginUser', EMAIL);
    await p3.fill('#loginPass', PASSWORD);
    await p3.click('#loginBtn');
    await p3.waitForSelector('#loginError:not([hidden])', { timeout: 8000 });
    const m = await txt(p3, '#loginError');
    const apiUsada = await p3.evaluate(() => API_BASE);
    const linea = await p3.evaluate(() => { const e = document.getElementById('loginApi'); return { visible: !e.hidden && e.offsetParent !== null, texto: e.textContent }; });   // el mensaje de error también la nombra
    check('3a-k', 'API inalcanzable (?api=…): mensaje legible (nombra la API que no responde) y sin sesión; ?api= a localhost sigue mandando (la demo usa esa API) y, como no es la de omisión, el login lo dice en su línea #loginApi (§5.157 b, cambia lo de F1)',
      /No se pudo conectar con la API/.test(m) && apiUsada === 'http://localhost:9' && linea.visible && linea.texto.includes('http://localhost:9') && (await p3.evaluate(() => sessionStorage.length)) === 0,
      `mensaje="${m}" API_BASE="${apiUsada}" linea=${JSON.stringify(linea)}`);
    await c3.close();
  }

  /* ---------- sec- (auditoría de seguridad M2, §5.157 b): ?api= no se lleva el token ni la contraseña ----------
     Un servidor espía en 127.0.0.1:9999 anota cada pedido (y contesta el preflight, para que en el código anterior el
     GET /auth/yo con el Bearer llegara de verdad). Con una sesión abierta contra la API de esta corrida, abrir la demo
     con ?api=<el espía> no le manda ningún Authorization (la sesión guardada era de otra API: se borra al cargar) y el
     login muestra a qué API iría la contraseña. Un host que no es localhost ni 127.0.0.1 se ignora (queda la de omisión). */
  {
    const http = require('http');
    const vistos = [];
    const espia = http.createServer((req, res) => {
      vistos.push({ metodo: req.method, url: req.url, authorization: req.headers.authorization || null, pide: req.headers['access-control-request-headers'] || null });
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
      if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
      res.statusCode = 401; res.setHeader('Content-Type', 'application/json');
      res.end('{"code":"unauthorized","detail":[{"campo":null,"mensaje":"espía"}]}');
    });
    await new Promise((ok, mal) => { espia.once('error', mal); espia.listen(9999, '127.0.0.1', ok); });
    try {
      const { ctx: cs, page: ps } = await nuevaPagina();
      await loguear(ps);
      await esperarResumen(ps, 'Mostrando 7 de 7');
      const antes = await ps.evaluate(() => ({ token: !!sessionStorage.getItem('ippu.token'), api: sessionStorage.getItem('ippu.api') }));
      await ps.goto(DEMO + '/index.html?api=' + encodeURIComponent('http://127.0.0.1:9999'));
      await ps.waitForSelector('#loginScreen:not(.hidden)', { timeout: 8000 });
      await ps.waitForTimeout(1500);   // cualquier pedido tardío al espía cae acá
      const tras = await ps.evaluate(() => {
        const e = document.getElementById('loginApi');
        return { api: API_BASE, token: sessionStorage.getItem('ippu.token'), linea: !e.hidden && e.offsetParent !== null, texto: e.textContent, foco: document.activeElement.id };
      });
      const conToken = vistos.filter((v) => v.authorization || /authorization/i.test(v.pide || ''));
      check('sec-espia', '?api=http://127.0.0.1:9999 con una sesión abierta contra otra API: el espía no recibe ningún Authorization (ni un preflight que lo pida), la sesión guardada se borra y el login muestra «http://127.0.0.1:9999» en su línea, con el foco en el usuario',
        antes.token && antes.api === API && conToken.length === 0 && tras.api === 'http://127.0.0.1:9999' && tras.token === null && tras.linea
          && tras.texto.includes('http://127.0.0.1:9999') && tras.foco === 'loginUser',
        JSON.stringify({ antes, tras, vistos }).slice(0, 600));

      const hosts = [];
      for (const ajena of ['http://evil.example', 'https://evil.example:8001/api', 'http://localhost.evil.example:8001', 'http://localhost@evil.example', 'http://127.0.0.2:8001', 'file:///c:/x']) {
        await ps.goto(DEMO + '/index.html?api=' + encodeURIComponent(ajena));
        await ps.waitForSelector('#loginScreen:not(.hidden)', { timeout: 8000 });
        hosts.push(await ps.evaluate(() => ({ api: API_BASE, linea: !document.getElementById('loginApi').hidden })));
      }
      check('sec-host', '?api= con un host que no es localhost ni 127.0.0.1 (evil.example, «localhost.evil.example», «localhost@evil.example», 127.0.0.2, file:) se ignora: API_BASE es la de omisión y el login no muestra ninguna línea de API',
        hosts.every((h) => h.api === 'http://localhost:8000' && !h.linea) && vistos.filter((v) => v.authorization).length === 0, JSON.stringify(hosts));

      await loguear(ps);   // vuelta a la API de esta corrida: entra y una recarga conserva la sesión
      await esperarResumen(ps, 'Mostrando 7 de 7');
      await ps.reload();
      await ps.waitForSelector('#loginScreen.hidden', { state: 'attached', timeout: 8000 });
      await esperarResumen(ps, 'Mostrando 7 de 7');
      const vuelta = await ps.evaluate(() => ({ api: sessionStorage.getItem('ippu.api'), usuario: document.getElementById('userNombre').textContent.trim() }));
      check('sec-vuelta', `?api=${API} (localhost): entra, guarda la API junto al token y una recarga conserva la sesión`,
        vuelta.api === API && vuelta.usuario === 'Dr. González', JSON.stringify(vuelta));
      await cs.close();
    } finally {
      await new Promise((ok) => espia.close(ok));
    }
  }

  /* ---------- (s) cerrar la sesión con una carga en vuelo: nada de datos de NNA queda ni reaparece ---------- */
  {
    const { ctx: c4, page: p4 } = await nuevaPagina();
    await loguear(p4);
    await esperarResumen(p4, 'Mostrando 7 de 7');
    const reDetalle = /\/hce\/\d+$/;
    await p4.route(reDetalle, async (route) => { await new Promise((x) => setTimeout(x, 1500)); await route.continue(); });
    await p4.locator('#tbodyNNA tr[data-hce]', { hasText: 'Martín' }).getByRole('button', { name: /Abrir expediente/ }).click();
    await p4.click('.btn-exit');                       // «Salir» con GET /hce/{id} todavía sin respuesta
    await p4.waitForTimeout(2800);                     // la respuesta llega y debe ignorarse
    const e1 = await p4.evaluate(() => ({ html: document.getElementById('expedienteContent').innerHTML.trim(), hce: EXP.hce, flujo: EXP.flujo,
      id: EXP.id, expActiva: document.getElementById('view-expediente').classList.contains('active'),
      login: !document.getElementById('loginScreen').classList.contains('hidden'), ss: sessionStorage.length }));
    check('3a-s1', '«Salir» con el detalle del expediente en vuelo: al llegar la respuesta, #expedienteContent sigue vacío, EXP sin datos y la vista no cambia',
      e1.html === '' && e1.hce === null && e1.flujo === null && e1.id === null && !e1.expActiva && e1.login && e1.ss === 0, JSON.stringify(e1));
    await p4.unroute(reDetalle);

    // recarga del estado de módulos: primero se cae el flujo, después se reintenta con la respuesta lenta y se sale
    const reFlujo = /\/hce\/\d+\/flujo$/;
    await loguear(p4);
    await esperarResumen(p4, 'Mostrando 7 de 7');
    await p4.route(reFlujo, (route) => route.abort());
    await p4.locator('#tbodyNNA tr[data-hce]', { hasText: 'Martín' }).getByRole('button', { name: /Abrir expediente/ }).click();
    await p4.waitForSelector('#tabsExpWrap >> text=No se pudo cargar el estado de los módulos', { timeout: 8000 });   // F1: debajo de las pestañas
    await p4.unroute(reFlujo);
    await p4.route(reFlujo, async (route) => { await new Promise((x) => setTimeout(x, 1500)); await route.continue(); });
    await p4.getByRole('button', { name: 'Reintentar' }).click();
    await p4.click('.btn-exit');                       // «Salir» con la recarga del flujo en vuelo
    await p4.waitForTimeout(2800);
    const e2 = await p4.evaluate(() => ({ html: document.getElementById('expedienteContent').innerHTML.trim(), hce: EXP.hce, flujo: EXP.flujo,
      flujoError: EXP.flujoError, id: EXP.id, login: !document.getElementById('loginScreen').classList.contains('hidden') }));
    check('3a-s2', '«Salir» con la recarga del flujo en vuelo: al llegar la respuesta no se pinta nada ni queda estado del NNA',
      e2.html === '' && e2.hce === null && e2.flujo === null && e2.flujoError === false && e2.id === null && e2.login, JSON.stringify(e2));
    await c4.close();
  }

  /* =====================================================================================================
     FASE 3-b · ESCRITURAS (handoff §5.124). Va AL FINAL: crea y modifica datos, y los conteos de arriba
     (7 activos, 8 con inactivos…) son los del seed recién cargado. Para repetir la corrida hay que
     recrear la base (README → «Base descartable»).
     ===================================================================================================== */
  const sufijo = String(Date.now()).slice(-7);                 // datos únicos por corrida
  const ciNueva = '7' + sufijo;                                // 8 dígitos, canónica
  const ciTipeada = ciNueva.slice(0, 1) + '.' + ciNueva.slice(1, 4) + '.' + ciNueva.slice(4, 7) + '-' + ciNueva.slice(7);
  const nombreNuevo = 'Prueba' + sufijo;
  const apellidoNuevo = 'Escrituras';

  const llenarPaso1 = async (p, d) => {
    await p.fill('#f_nombre', d.nombre); await p.fill('#f_apellido', d.apellido);
    await p.fill('#f_nac', d.nac || '2016-05-04');
    if (d.ci !== undefined) await p.fill('#f_ci', d.ci);
  };
  const abrirAlta = async (p) => {
    await p.click('#btnNuevoNNA');
    await p.waitForSelector('#modalAlta.open');
    await p.waitForFunction(() => document.querySelectorAll('#f_grupo option').length > 1 || /No hay grupos|No se pudieron/.test(document.getElementById('f_grupo_estado').textContent), null, { timeout: 8000 });
  };
  const siguiente = async (p, n) => { for (let i = 0; i < n; i++) await p.click('#btnNext'); };
  const apiGet = async (p, ruta) => {
    const t = await p.evaluate(() => sessionStorage.getItem('ippu.token'));
    const r = await fetch(API + ruta, { headers: { Authorization: 'Bearer ' + t } });
    return { status: r.status, json: r.status === 204 ? null : await r.json() };
  };
  const focoId = (p) => p.evaluate(() => document.activeElement && document.activeElement.id);
  const loguearComo = async (p, email, pass) => {
    await p.goto(urlDemo());
    await p.fill('#loginUser', email); await p.fill('#loginPass', pass);
    await p.click('#loginBtn');
    await p.waitForSelector('#loginScreen.hidden', { state: 'attached', timeout: 8000 });
    await esperarResumen(p, 'Mostrando');
  };
  const cuerpoDe = (req) => JSON.parse(req.postData() || 'null');

  {
    const { ctx: c5, page: p5 } = await nuevaPagina();
    await loguearComo(p5, EMAIL, PASSWORD);

    check('3b-api', 'ítem 8: la demo habla con la API de esta corrida (?api=) — API_BASE == API',
      (await p5.evaluate(() => API_BASE)) === API.replace(/\/+$/, ''), await p5.evaluate(() => API_BASE));

    /* ---------- diálogo: accesibilidad básica, Esc, foco ---------- */
    await p5.click('#btnNuevoNNA');
    await p5.waitForSelector('#modalAlta.open');
    const dlg2 = await p5.evaluate(() => { const m = document.querySelector('#modalAlta .modal'); return { role: m.getAttribute('role'), modal: m.getAttribute('aria-modal'),
      nombre: document.getElementById(m.getAttribute('aria-labelledby')).textContent.trim(), inert: document.querySelector('div.layout').inert && document.querySelector('header.topbar').inert,
      foco: document.activeElement.id, texto: m.innerText }; });
    check('3b-m5', 'el alta es un diálogo modal (role/aria-modal/nombre), deja la app inerte, toma el foco y NO ofrece nivel de apoyo ni talleres',
      dlg2.role === 'dialog' && dlg2.modal === 'true' && dlg2.nombre !== '' && dlg2.inert && dlg2.foco === 'modalTitle' && !/Nivel de apoyo|Taller|soporte/i.test(dlg2.texto),
      JSON.stringify({ role: dlg2.role, modal: dlg2.modal, inert: dlg2.inert, foco: dlg2.foco }));
    await p5.keyboard.press('Escape');
    const trasEsc = await p5.evaluate(() => ({ abierto: document.getElementById('modalAlta').classList.contains('open'), inert: document.querySelector('div.layout').inert, foco: document.activeElement.id }));
    check('3b-m6', 'Esc cierra el diálogo, la app deja de estar inerte y el foco vuelve al botón que lo abrió',
      !trasEsc.abierto && !trasEsc.inert && trasEsc.foco === 'btnNuevoNNA', JSON.stringify(trasEsc));

    /* ---------- (f) campo obligatorio vacío (cédula): error por campo + aria-describedby, y no se manda nada ---------- */
    const postsAntes = [];
    p5.on('request', (r) => { if (r.method() === 'POST' && /\/hce$/.test(r.url())) postsAntes.push(r.url()); });
    await abrirAlta(p5);
    await llenarPaso1(p5, { nombre: nombreNuevo, apellido: apellidoNuevo });   // sin cédula
    await p5.click('#btnNext');
    const f1 = await p5.evaluate(() => { const i = document.getElementById('f_ci'); const r = document.getElementById('altaErrores');
      return { invalido: i.getAttribute('aria-invalid'), desc: i.getAttribute('aria-describedby'), err: document.getElementById('err_f_ci').textContent,
        resumenVisible: !r.hidden, rol: r.getAttribute('role'), foco: document.activeElement.id, paso: document.querySelector('.wizard-step.active').dataset.step, resumen: r.innerText }; });
    check('3b-f', 'cédula vacía → error junto al campo (aria-invalid + aria-describedby→mensaje), resumen role="alert" con foco, sigue en el paso 1 y NO se manda ningún POST',
      f1.invalido === 'true' && /err_f_ci/.test(f1.desc) && f1.err !== '' && f1.resumenVisible && f1.rol === 'alert' && f1.foco === 'altaErrores' && f1.paso === '1' && postsAntes.length === 0,
      JSON.stringify({ ...f1, resumen: f1.resumen.replace(/\s+/g, ' ') }));
    check('3b-f-req', 'los cuatro obligatorios que exige PersonaCrear están marcados como tales (aria-required) en el formulario',
      (await p5.$$eval('#modalAlta [aria-required="true"]', (e) => e.map((x) => x.id).sort())).join(',') === 'f_apellido,f_ci,f_nac,f_nombre');

    /* ---------- (a) alta como técnico ---------- */
    await p5.fill('#f_ci', ciTipeada);
    await p5.click('#btnNext');
    await p5.waitForFunction(() => document.querySelector('.wizard-step.active').dataset.step === '2');
    await p5.fill('#f_dx', 'TEA — en proceso diagnóstico');
    await p5.selectOption('#f_grupo', { label: 'Escolares' });
    const tecnicos = (await txt(p5, '#f_tecnicos')).replace(/\s+/g, ' ');
    check('3b-t1', 'al elegir el grupo se muestran SUS técnicos (Dr. González · Mtra. Torres) y no hay selectores de técnico por NNA',
      /Dr\. González/.test(tecnicos) && /Mtra\. Torres/.test(tecnicos) && (await p5.locator('#f_tecnico, #f_tecnico2').count()) === 0, tecnicos);
    await p5.click('#btnNext');
    await p5.fill('#f_motivo', 'Ingreso de prueba de la Fase 3-b.');
    await p5.fill('#f_antec', 'Observación inicial de prueba.');
    await p5.click('#btnNext');
    const review = (await txt(p5, '#reviewDl')).replace(/\s+/g, ' ');
    const reqAlta = p5.waitForRequest((r) => r.method() === 'POST' && /\/hce$/.test(r.url()));
    await p5.click('#btnCreate');
    const reqA = cuerpoDe(await reqAlta);
    await p5.waitForSelector('#expTitulo', { timeout: 8000 });
    const idNuevo = await p5.evaluate(() => EXP.id);
    const apiNuevo = (await apiGet(p5, `/hce/${idNuevo}`)).json;
    const grupoEscolares = (await (await fetch(API + '/grupos', { headers: { Authorization: 'Bearer ' + (await p5.evaluate(() => sessionStorage.getItem('ippu.token'))) } })).json()).find((g) => g.nombre === 'Escolares');
    check('3b-a1', 'alta con el asistente: POST /hce con persona + grupo_id (id real de GET /grupos), anamnesis completa, SIN nivel de soporte ni talleres, y abre el expediente nuevo',
      reqA.persona.ci === ciTipeada && reqA.persona.nombre === nombreNuevo && reqA.grupo_id === grupoEscolares.id && reqA.diagnostico === 'TEA — en proceso diagnóstico' &&
      Object.keys(reqA.anamnesis).sort().join(',') === 'desarrollo,familiares,motivo,observaciones,perinatal' &&
      !Object.keys(reqA).some((k) => /soporte|apoyo|taller|tecnico/i.test(k)) && apiNuevo.persona.ci === ciNueva && apiNuevo.grupo.nombre === 'Escolares',
      JSON.stringify(reqA).slice(0, 220));
    check('3b-a2', 'la revisión del paso 4 muestra N.º de HC «se asigna el siguiente» y los técnicos del grupo',
      /N\.º de HC se asigna el siguiente/.test(review) && /Dr\. González/.test(review), review.slice(0, 200));
    const cabecera = (await txt(p5, '#expHead')).replace(/\s+/g, ' ');
    check('3b-a3', 'el expediente nuevo se abre con «HC <hc_historico>» en la banda (nunca el id interno) y el foco en el título',
      new RegExp(`HC ${apiNuevo.hc_historico}\\b`).test(cabecera) && (await focoId(p5)) === 'expTitulo' && apiNuevo.hc_historico >= 1000 && String(apiNuevo.hc_historico) !== String(idNuevo),
      `hc=${apiNuevo.hc_historico} id=${idNuevo}`);
    await p5.click('.navitem[data-view="inicio"]');               // F1: se vuelve por «NNA y HCE» (ya no hay «Volver al listado»)
    await p5.fill('#searchNNA', nombreNuevo);
    await p5.waitForFunction((n) => document.getElementById('tbodyNNA').textContent.includes(n), nombreNuevo, { timeout: 8000 });
    const filaNueva = (await p5.locator('#tbodyNNA tr[data-hce]', { hasText: nombreNuevo }).innerText()).replace(/\s+/g, ' ');
    check('3b-a4', 'el expediente nuevo aparece en el listado con «CI pendiente»', /CI pendiente/.test(filaNueva) && /Escolares/.test(filaNueva), filaNueva);

    /* ---------- (b) la misma cédula otra vez, como técnico: 409 genérico, foco en el resumen ---------- */
    await abrirAlta(p5);
    await llenarPaso1(p5, { nombre: 'Otro' + sufijo, apellido: 'Repetido', ci: ciTipeada });
    await siguiente(p5, 1);
    await p5.selectOption('#f_grupo', { label: 'Escolares' });
    await siguiente(p5, 2);
    await p5.click('#btnCreate');
    await p5.waitForFunction(() => !document.getElementById('altaErrores').hidden, null, { timeout: 8000 });
    const b1 = await p5.evaluate(() => ({ foco: document.activeElement.id, rol: document.getElementById('altaErrores').getAttribute('role'),
      texto: document.getElementById('altaErrores').innerText.replace(/\s+/g, ' '), camposMarcados: document.querySelectorAll('#modalAlta .field.invalid').length,
      abierto: document.getElementById('modalAlta').classList.contains('open'), boton: document.getElementById('btnCreate').disabled }));
    check('3b-b', '409 por cédula repetida como TÉCNICO: el aviso de B5 «Ya hay un NNA registrado con esa C.I. Consultá con coordinación.» (A1, F4-14), sin nombrar a nadie ni marcar el campo, foco en el resumen role="alert", el diálogo sigue abierto',
      b1.foco === 'altaErrores' && b1.rol === 'alert' && /Ya hay un NNA registrado con esa C\.I\. Consultá con coordinación\./.test(b1.texto) && !/cédula/i.test(b1.texto.replace('No se pudo guardar:', '')) &&
      b1.camposMarcados === 0 && b1.abierto && !b1.boton, JSON.stringify(b1));
    await escDescartando(p5);

    /* ---------- (c) la misma cédula, como ADMIN: mensaje y campo específicos ---------- */
    {
      const { ctx: c6, page: p6 } = await nuevaPagina();
      await loguearComo(p6, ADMIN_EMAIL, ADMIN_PASSWORD);
      await abrirAlta(p6);
      await llenarPaso1(p6, { nombre: 'Otro' + sufijo, apellido: 'Repetido', ci: ciTipeada });
      await siguiente(p6, 3);
      await p6.click('#btnCreate');
      await p6.waitForFunction(() => !document.getElementById('altaErrores').hidden, null, { timeout: 8000 });
      const c1 = await p6.evaluate(() => { const i = document.getElementById('f_ci');
        return { foco: document.activeElement.id, campo: i.getAttribute('aria-invalid'), msg: document.getElementById('err_f_ci').textContent, desc: i.getAttribute('aria-describedby'),
          paso: document.querySelector('.wizard-step.active').dataset.step, resumen: document.getElementById('altaErrores').innerText.replace(/\s+/g, ' ') }; });
      check('3b-c', '409 por cédula repetida como ADMIN: «Ya existe una persona con esa cédula» junto al campo cédula (aria-invalid + describedby), vuelve al paso 1, foco en el resumen',
        /Ya existe una persona con esa cédula/.test(c1.msg) && c1.campo === 'true' && /err_f_ci/.test(c1.desc) && c1.paso === '1' && c1.foco === 'altaErrores' && /Cédula: Ya existe/.test(c1.resumen),
        JSON.stringify(c1));
      await c6.close();
    }

    /* ---------- (d) editar HCE-00: PATCH solo con lo que cambió; el valor sale de la API ---------- */
    await p5.fill('#searchNNA', nombreNuevo);
    await p5.waitForFunction((n) => document.getElementById('tbodyNNA').textContent.includes(n), nombreNuevo, { timeout: 8000 });
    await p5.locator('#tbodyNNA tr[data-hce]', { hasText: nombreNuevo }).getByRole('button', { name: /Abrir expediente/ }).click();
    await p5.waitForSelector('#expTitulo');
    await p5.click('#expHead >> text=✎ Editar datos');
    await p5.waitForSelector('#modalAlta.open');
    await p5.waitForFunction(() => document.querySelectorAll('#f_grupo option').length > 1, null, { timeout: 8000 });
    const pre = await p5.evaluate(() => ({ nombre: f_nombre.value, ci: f_ci.value, dx: f_dx.value, grupo: f_grupo.options[f_grupo.selectedIndex].text, hc: f_hc.value, motivo: f_motivo.value }));
    check('3b-d0', 'editar: el formulario se precarga desde la API (cédula con formato, grupo, N.º de HC, anamnesis)',
      pre.nombre === nombreNuevo && pre.ci === ciTipeada && pre.dx === 'TEA — en proceso diagnóstico' && pre.grupo === 'Escolares' && +pre.hc === apiNuevo.hc_historico && pre.motivo === 'Ingreso de prueba de la Fase 3-b.', JSON.stringify(pre));
    await p5.click('#btnNext'); await p5.fill('#f_med', 'Ibuprofeno 3b');
    await p5.click('#btnNext'); await p5.click('#btnNext');
    const revEd = (await txt(p5, '#reviewDl')).replace(/\s+/g, ' ');
    const reqEd = p5.waitForRequest((r) => r.method() === 'PATCH' && new RegExp(`/hce/${idNuevo}$`).test(r.url()));
    await p5.click('#btnCreate');
    const bodyEd = cuerpoDe(await reqEd);
    await p5.waitForFunction(() => !document.getElementById('modalAlta').classList.contains('open'));
    const apiTras = (await apiGet(p5, `/hce/${idNuevo}`)).json;
    const enPantalla = await txt(p5, '#panelExp');
    check('3b-d1', 'editar un campo: PATCH /hce/{id} con SOLO ese campo; el cuadro lo muestra desde la respuesta y GET /hce/{id} coincide',
      JSON.stringify(Object.keys(bodyEd)) === '["medicacion"]' && bodyEd.medicacion === 'Ibuprofeno 3b' && /Medicación — → Ibuprofeno 3b/.test(revEd) &&
      apiTras.medicacion === 'Ibuprofeno 3b' && enPantalla.includes('Ibuprofeno 3b'), JSON.stringify(bodyEd) + ' | revisión: ' + revEd);
    await p5.reload();
    await p5.waitForSelector('#loginScreen.hidden', { state: 'attached', timeout: 8000 });
    await esperarResumen(p5, 'Mostrando');
    await p5.evaluate((id) => abrirExpediente(id), idNuevo);
    await p5.waitForSelector('#expTitulo');
    check('3b-d2', 'tras recargar la página, el valor guardado sigue ahí (viene de la API, no del navegador)', (await txt(p5, '#panelExp')).includes('Ibuprofeno 3b'));

    // anamnesis: el PATCH la reemplaza entera → siempre las cinco claves, con Observaciones
    await p5.click('#expHead >> text=✎ Editar datos');
    await p5.waitForSelector('#modalAlta.open');
    await p5.click('#btnNext'); await p5.click('#btnNext');
    await p5.fill('#f_antec', 'Observación cambiada en 3-b.');
    await p5.click('#btnNext');
    const reqAn = p5.waitForRequest((r) => r.method() === 'PATCH' && new RegExp(`/hce/${idNuevo}$`).test(r.url()));
    await p5.click('#btnCreate');
    const bodyAn = cuerpoDe(await reqAn);
    await p5.waitForFunction(() => !document.getElementById('modalAlta').classList.contains('open'));
    const anamApi = (await apiGet(p5, `/hce/${idNuevo}`)).json.anamnesis;
    check('3b-d3', 'editar la anamnesis: el PATCH manda las cinco claves (motivo, perinatal, desarrollo, familiares, observaciones) y la API guarda la observación',
      Object.keys(bodyAn).join() === 'anamnesis' && Object.keys(bodyAn.anamnesis).sort().join() === 'desarrollo,familiares,motivo,observaciones,perinatal' &&
      anamApi.observaciones === 'Observación cambiada en 3-b.' && anamApi.motivo === 'Ingreso de prueba de la Fase 3-b.', JSON.stringify(bodyAn));
    check('3b-d3b', 'las Observaciones se ven en el HCE-00 desde la respuesta', (await txt(p5, '#panelExp')).includes('Observación cambiada en 3-b.'));

    // sin cambios: no se llama a la API
    await p5.click('#expHead >> text=✎ Editar datos');
    await p5.waitForSelector('#modalAlta.open');
    const patchesAntes = [];
    p5.on('request', (r) => { if (r.method() === 'PATCH') patchesAntes.push(r.url()); });
    await p5.click('#btnNext'); await p5.click('#btnNext'); await p5.click('#btnNext');
    await p5.click('#btnCreate');
    const sinCambios = await p5.evaluate(() => ({ resumen: document.getElementById('altaErrores').innerText.replace(/\s+/g, ' '), foco: document.activeElement.id }));
    check('3b-d4', 'guardar sin tocar nada: «No hay cambios para guardar», foco en el resumen y NO se manda ningún PATCH',
      /No hay cambios para guardar/.test(sinCambios.resumen) && sinCambios.foco === 'altaErrores' && patchesAntes.length === 0, JSON.stringify(sinCambios));
    await p5.keyboard.press('Escape');

    // baja: sin fecha_baja → error por campo (de la API); con fecha → guardada
    await p5.click('#expHead >> text=✎ Editar datos');
    await p5.waitForSelector('#modalAlta.open');
    await p5.click('#btnNext');
    await p5.selectOption('#f_estado', 'baja');
    await p5.click('#btnNext'); await p5.click('#btnNext');
    await p5.click('#btnCreate');
    await p5.waitForFunction(() => !document.getElementById('altaErrores').hidden, null, { timeout: 8000 });
    const baja1 = await p5.evaluate(() => { const i = document.getElementById('f_fecha_baja');
      return { campo: i.getAttribute('aria-invalid'), msg: document.getElementById('err_f_fecha_baja').textContent, desc: i.getAttribute('aria-describedby'), foco: document.activeElement.id,
        paso: document.querySelector('.wizard-step.active').dataset.step }; });
    check('3b-d5', 'baja SIN fecha_baja: la API rechaza y el error queda junto al campo «Fecha de baja» (aria-invalid + describedby), foco en el resumen',
      /fecha/i.test(baja1.msg) && baja1.campo === 'true' && /err_f_fecha_baja/.test(baja1.desc) && baja1.foco === 'altaErrores' && baja1.paso === '2', JSON.stringify(baja1));
    await p5.fill('#f_fecha_baja', '2026-10-01');
    await p5.click('#btnNext'); await p5.click('#btnNext');
    const reqBaja = p5.waitForRequest((r) => r.method() === 'PATCH' && new RegExp(`/hce/${idNuevo}$`).test(r.url()));
    await p5.click('#btnCreate');
    const bodyBaja = cuerpoDe(await reqBaja);
    await p5.waitForFunction(() => !document.getElementById('modalAlta').classList.contains('open'));
    const apiBaja = (await apiGet(p5, `/hce/${idNuevo}`)).json;
    const cabBaja = (await txt(p5, '#expHead')).replace(/\s+/g, ' ');
    check('3b-d6', 'baja CON fecha: PATCH {activo:false, fecha_baja}; la API la guarda y la cabecera muestra «Inactivo» y la fecha',
      bodyBaja.activo === false && bodyBaja.fecha_baja === '2026-10-01' && apiBaja.activo === false && apiBaja.fecha_baja === '2026-10-01' && /Inactivo/.test(cabBaja) && /Baja: 1 oct 2026/.test(cabBaja),
      JSON.stringify(bodyBaja) + ' | ' + cabBaja.slice(0, 120));
    // reingreso
    await p5.click('#expHead >> text=✎ Editar datos');
    await p5.waitForSelector('#modalAlta.open');
    await p5.click('#btnNext');
    await p5.selectOption('#f_estado', 'activo');
    await p5.click('#btnNext'); await p5.click('#btnNext');
    const reqRe = p5.waitForRequest((r) => r.method() === 'PATCH' && new RegExp(`/hce/${idNuevo}$`).test(r.url()));
    await p5.click('#btnCreate');
    const bodyRe = cuerpoDe(await reqRe);
    await p5.waitForFunction(() => !document.getElementById('modalAlta').classList.contains('open'));
    const apiRe = (await apiGet(p5, `/hce/${idNuevo}`)).json;
    check('3b-d7', 'reingreso: PATCH {activo:true}; la API borra fecha_baja', JSON.stringify(bodyRe) === '{"activo":true}' && apiRe.activo === true && apiRe.fecha_baja === null, JSON.stringify(bodyRe));

    /* ---------- (e) CI: sin consentimiento nada se traba; se registra y todo lo muestra registrado ---------- */
    const flujoTxt = await p5.evaluate(() => document.getElementById('tabsExpWrap').textContent.replace(/\s+/g, ' '));   // F1: el flujo vive en las pestañas (y su ayuda «?»)
    const trabas = await p5.evaluate(() => ({ deshabilitados: document.querySelectorAll('#tabsExpWrap [disabled], #tabsExpWrap [inert], #tabsExpWrap [aria-disabled="true"]').length,
      candado: /🔒|Bloquead/i.test(document.getElementById('tabsExpWrap').innerText),
      ciPend: !!document.querySelector('#tabExp-ci .st-ci-pend'),
      pasos: [...document.querySelectorAll('#tabsExpWrap [role="tab"][data-mod]')].map((b) => b.querySelector('.tab-nombre').textContent + b.querySelector('.st-mini .sr-only').textContent) }));
    check('3b-e1', 'nuevo expediente SIN consentimiento: el consentimiento pendiente se ve (⚠ + texto) en su pestaña, los cuatro módulos del año figuran «sin iniciar», la ayuda dice que nada se bloquea, ningún candado ni «Bloqueado» ni control deshabilitado',
      trabas.ciPend && /CI⚠: pendiente/.test(flujoTxt) && /no bloquea/.test(flujoTxt) && trabas.deshabilitados === 0 && !trabas.candado &&
      JSON.stringify(trabas.pasos) === JSON.stringify(['Línea base: sin iniciar', 'Protocolo A: sin iniciar', 'Protocolo B: sin iniciar', 'Cierre: sin iniciar']),
      JSON.stringify(trabas));
    await p5.click('#tabExp-lb');                                   // un módulo anual: abre su pestaña, sin traba (F1: desde la pestaña)
    await p5.waitForSelector('#evResumen', { timeout: 8000 });
    const lb = await p5.evaluate(() => ({ sel: document.getElementById('tabExp-lb').getAttribute('aria-selected'), panel: document.getElementById('panelExp').innerText }));
    check('3b-e2', 'un módulo anual (LB) se abre aunque falte el CI: su pestaña se selecciona y muestra el editor conectado (formulario IDEA de la API), sin candado ni panel de demostración',
      lb.sel === 'true' && !/Modo demostración — no se guarda/.test(lb.panel) && /Línea base — IDEA/.test(lb.panel) && !/🔒|Bloquead/i.test(lb.panel));
    await p5.click('#tabExp-log');                                  // F1: «Ver auditoría» se retiró; la reemplaza la pestaña «Auditoría» (conectada en C1)
    await p5.waitForSelector('#panelExp .log-table', { timeout: 8000 });
    check('3b-e3', 'la pestaña «Auditoría» (reemplaza a «Ver auditoría») abre el registro de cambios conectado (C1), no el panel de modo demostración', !/Modo demostración — no se guarda/.test(await txt(p5, '#panelExp')) && /Registra cambios, no accesos/.test(await txt(p5, '#panelExp')) && (await p5.getAttribute('#tabExp-log', 'aria-selected')) === 'true');

    // pestaña CI: GET 404 = pendiente (estado, no error)
    const resp404 = p5.waitForResponse((r) => /\/consentimiento$/.test(r.url()) && r.request().method() === 'GET');
    await p5.click('#tabExp-ci');
    const r404 = await resp404;
    await p5.waitForSelector('#ci_firmante');
    const ciPend = await p5.evaluate(() => ({ alertas: document.querySelectorAll('#panelExp .empty-state[role="alert"]').length, texto: document.getElementById('panelExp').innerText, adjunto: !!document.querySelector('#panelExp [id*="adjunto" i], #panelExp input[type="file"]') }));
    check('3b-e4', 'la pestaña CI lee GET /hce/{id}/consentimiento: el 404 se muestra como «CI pendiente» (no como error) con el formulario de registro y SIN campo de adjunto',
      r404.status() === 404 && ciPend.alertas === 0 && /CI pendiente/i.test(ciPend.texto) && !ciPend.adjunto && !/firmad/i.test(ciPend.texto), `GET → ${r404.status()}`);
    // (f) también en el CI: obligatorios vacíos → por campo, con aria-describedby
    await p5.click('#btnCiGuardar');
    const ciF = await p5.evaluate(() => ({ foco: document.activeElement.id, a: document.getElementById('ci_firmante').getAttribute('aria-invalid'), d: document.getElementById('ci_firmante').getAttribute('aria-describedby'),
      m: document.getElementById('err_ci_firmante').textContent, b: document.getElementById('ci_fecha').getAttribute('aria-invalid') }));
    check('3b-f2', 'CI con referente y fecha vacíos → error por campo (aria-invalid + aria-describedby→mensaje) y resumen role="alert" con foco',
      ciF.foco === 'ciErrores' && ciF.a === 'true' && ciF.b === 'true' && /err_ci_firmante/.test(ciF.d) && ciF.m !== '', JSON.stringify(ciF));
    await p5.fill('#ci_firmante', 'Referente de prueba 3b');
    await p5.fill('#ci_fecha', '2026-03-02');
    await p5.check('#ci_aut_eval'); await p5.check('#ci_aut_reg');
    const reqCi = p5.waitForRequest((r) => r.method() === 'POST' && /\/consentimiento$/.test(r.url()));
    const flujoRe = p5.waitForResponse((r) => /\/flujo$/.test(r.url()) && r.request().method() === 'GET');
    await p5.click('#btnCiGuardar');
    const bodyCi = cuerpoDe(await reqCi);
    await flujoRe;
    await p5.waitForFunction(() => /registrado/.test(document.getElementById('tabExp-ci').textContent));
    const apiCi = (await apiGet(p5, `/hce/${idNuevo}/consentimiento`)).json;
    const tras = await p5.evaluate(() => ({ panel: document.getElementById('panelExp').innerText.replace(/\s+/g, ' '), flujo: document.getElementById('tabExp-ci').textContent.replace(/\s+/g, ' '),
      marcaTab: document.getElementById('tabExp-ci').innerText.replace(/\s+/g, ' '), foco: document.activeElement.id }));
    check('3b-e5', 'registrar el CI: POST {firmante, fecha, autorizaciones} (las tres) → la API lo guarda y la pantalla lo muestra «Registrado» (nunca «firmado»), con el foco en su título',
      Object.keys(bodyCi).sort().join() === 'autorizaciones,fecha,firmante' && Object.keys(bodyCi.autorizaciones).sort().join() === 'comunicacion,evaluacion,registro' &&
      apiCi.firmante === 'Referente de prueba 3b' && apiCi.autorizaciones.evaluacion === true && apiCi.autorizaciones.comunicacion === false &&
      /registrado/i.test(tras.panel) && /Referente de prueba 3b/.test(tras.panel) && !/firmad/i.test(tras.panel) && tras.foco === 'ciTitulo', JSON.stringify(bodyCi));
    check('3b-e6', 'tras registrar, el flujo se vuelve a pedir a la API: la pestaña CI dice «registrado» (ya no «pendiente») y lo marca con ●',
      /registrado/.test(tras.flujo) && !/pendiente/.test(tras.flujo) && /●/.test(tras.marcaTab), tras.flujo.slice(0, 120));
    await p5.click('#tabExp-hce00');
    await p5.click('.navitem[data-view="inicio"]');
    await p5.fill('#searchNNA', nombreNuevo);
    await p5.waitForFunction((n) => document.getElementById('tbodyNNA').textContent.includes(n), nombreNuevo, { timeout: 8000 });
    await p5.waitForFunction((n) => { const t = [...document.querySelectorAll('#tbodyNNA tr[data-hce]')].find((r) => r.textContent.includes(n)); return t && /CI registrado/.test(t.textContent); }, nombreNuevo, { timeout: 8000 });
    const filaReg = (await p5.locator('#tbodyNNA tr[data-hce]', { hasText: nombreNuevo }).innerText()).replace(/\s+/g, ' ');
    check('3b-e7', 'la fila del listado muestra el CI registrado («✓ CI», F1) y no «CI pendiente»', /✓ CI registrado/.test(filaReg) && !/CI pendiente/.test(filaReg), filaReg);
    // editar el CI: PATCH, y vuelve a mostrar lo que devolvió la API
    await p5.locator('#tbodyNNA tr[data-hce]', { hasText: nombreNuevo }).getByRole('button', { name: /Abrir expediente/ }).click();
    await p5.waitForSelector('#expTitulo');
    await p5.click('#tabExp-ci');
    await p5.click('#btnCiEditar');
    await p5.check('#ci_aut_com');
    const reqCiP = p5.waitForRequest((r) => r.method() === 'PATCH' && /\/consentimiento$/.test(r.url()));
    await p5.click('#btnCiGuardar');
    const bodyCiP = cuerpoDe(await reqCiP);
    await p5.waitForFunction(() => /Autoriza la comunicación a organismos\s*Sí/.test(document.getElementById('panelExp').innerText.replace(/\n/g, ' ')), null, { timeout: 8000 });
    check('3b-e8', 'editar el CI registrado: PATCH /consentimiento solo con lo que cambió (autorizaciones) y la pantalla muestra lo que guardó la API',
      JSON.stringify(Object.keys(bodyCiP)) === '["autorizaciones"]' && bodyCiP.autorizaciones.comunicacion === true && (await apiGet(p5, `/hce/${idNuevo}/consentimiento`)).json.autorizaciones.comunicacion === true, JSON.stringify(bodyCiP));
    await c5.close();
  }

  /* ---------- (w2) el diálogo de alta y la pantalla de CI tampoco desbordan a 390 px; «Reintentar» de grupos oculto ---------- */
  {
    const { ctx: c8, page: p8 } = await nuevaPagina();
    await loguearComo(p8, EMAIL, PASSWORD);
    await p8.setViewportSize({ width: 390, height: 800 });
    await abrirAlta(p8);
    const reint = await p8.isVisible('#btnReintGrupos');
    const ancho1 = await p8.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    await p8.keyboard.press('Escape');
    await p8.locator('#tbodyNNA tr[data-hce]', { hasText: 'Bruno' }).getByRole('button', { name: /Abrir expediente/ }).click();
    await p8.waitForSelector('#expTitulo');
    await p8.click('#tabExp-ci'); await p8.waitForSelector('#ci_firmante');
    const ancho2 = await p8.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    check('3b-w2', 'a 390 px el diálogo de alta y la pestaña CI no desbordan, y el botón «Reintentar» de grupos no se ve cuando los grupos cargaron',
      ancho1[0] === ancho1[1] && ancho2[0] === ancho2[1] && !reint, `diálogo ${ancho1} · CI ${ancho2} · reintentar visible=${reint}`);
    await c8.close();
  }

  /* ---------- (s3) ítem 8: «Salir» con GET /grupos en vuelo — la respuesta tardía se descarta ---------- */
  {
    const { ctx: c7, page: p7 } = await nuevaPagina();
    const reGrupos = /\/grupos(\?.*)?$/;
    await p7.goto(urlDemo());
    await p7.route(reGrupos, async (route) => { await new Promise((x) => setTimeout(x, 1500)); await route.continue(); });
    await p7.fill('#loginUser', EMAIL); await p7.fill('#loginPass', PASSWORD);
    await p7.click('#loginBtn');
    await p7.waitForSelector('#loginScreen.hidden', { state: 'attached', timeout: 8000 });
    await p7.click('.btn-exit');                       // «Salir» con GET /grupos todavía sin respuesta
    await p7.waitForTimeout(2800);                     // la respuesta llega y debe ignorarse
    const g = await p7.evaluate(() => ({ grupos: GRUPOS_API.length, opciones: [...document.querySelectorAll('#filtroGrupo option')].map((o) => o.textContent.trim()), anio: LISTA.anioGrupos,
      login: !document.getElementById('loginScreen').classList.contains('hidden') }));
    check('3b-s3', 'ítem 8 — «Salir» con GET /grupos en vuelo: al llegar la respuesta GRUPOS_API sigue vacío y el filtro de grupo no se llena',
      g.grupos === 0 && g.opciones.join() === 'Todos' && g.anio === null && g.login, JSON.stringify(g));
    await c7.close();
  }

  /* =====================================================================================================
     F3 · PASADA VISUAL FINAL (handoff §5.160): un patrón por componente. NO ESCRIBE: corre con la base tal como la dejó el seed
     (el LB de Joaquín en borrador, Valentina con el IC sin crear) y las escrituras que dispara (guardar en SEV y ORG) se
     contestan en el navegador con route.fulfill: no llegan a la API.
     ===================================================================================================== */
  {
    const { ctx: c3f, page: p3 } = await nuevaPagina();
    await p3.setViewportSize({ width: 1280, height: 800 });
    await loguear(p3);
    await p3.waitForFunction(() => /Mostrando \d+ de/.test(document.getElementById('listaResumen').textContent), null, { timeout: 8000 });
    const tok3 = await p3.evaluate(() => sessionStorage.getItem('ippu.token'));
    const get3 = async (ruta) => { const r = await fetch(API + ruta, { headers: { Authorization: 'Bearer ' + tok3 } }); return { status: r.status, json: await r.json() }; };
    const id3 = async (n) => (await get3('/hce?nombre=' + encodeURIComponent(n) + '&limit=20')).json.find((h) => h.persona.nombre === n).id;
    const idM3 = await id3('Martín'), idJ3 = await id3('Joaquín'), idV3 = await id3('Valentina'), idS3 = await id3('Sofía');
    const abrir3 = async (id, tab) => {
      await p3.evaluate((i) => abrirExpediente(i), id);
      await p3.waitForSelector('#expTitulo');
      await p3.waitForFunction(() => !!EXP.flujo && !!EXP.mods, null, { timeout: 8000 });
      if (tab && tab !== 'hce00') await p3.click('#tabExp-' + tab);
      await p3.waitForFunction(() => !/Cargando/.test(document.getElementById('panelExp').innerText), null, { timeout: 8000 });
      await p3.waitForTimeout(150);
    };
    const vista3 = async (v, listo) => { await p3.click(`.navitem[data-view="${v}"]`); await p3.waitForFunction(listo, null, { timeout: 8000 }); await p3.waitForTimeout(150); };
    const tamanios3 = [[1280, 800], [1024, 768]];
    /* Un recorrido por las pantallas conectadas; `medir` se evalúa en cada una. */
    const PANTALLAS = [
      ['listado', async () => { await p3.evaluate(() => go('inicio')); await p3.waitForTimeout(150); }],
      ['hce00', () => abrir3(idM3, 'hce00')], ['ci', () => abrir3(idM3, 'ci')], ['lb', () => abrir3(idM3, 'lb')], ['lb-editor', () => abrir3(idJ3, 'lb')],
      ['pa', () => abrir3(idS3, 'pa')], ['pb', () => abrir3(idM3, 'pb')], ['ic-editor', () => abrir3(idV3, 'ic')], ['ic', () => abrir3(idM3, 'ic')],
      ['vf', () => abrir3(idM3, 'vf')], ['sev', () => abrir3(idM3, 'sev')], ['inc', () => abrir3(idM3, 'inc')], ['org', () => abrir3(idM3, 'org')],
      ['doc', () => abrir3(idM3, 'doc')], ['log', () => abrir3(idM3, 'log')],
      ['pendientes', () => vista3('pendientes', () => PEND.estado === 'listo')], ['grupos', () => vista3('grupos', () => GRP.estado === 'listo')],
      ['inclusion', () => vista3('inclusion', () => INCV.estado === 'listo')], ['ateneos', () => vista3('ateneos', () => AT.lista.estado === 'listo' && AT.ind.estado === 'listo')],
      ['panel', () => vista3('analitica', () => PANEL.estado === 'listo')],
    ];
    const recorrer = async (medir, arg) => { const out = {}; for (const [k, ir] of PANTALLAS) { await ir(); out[k] = await p3.evaluate(medir, arg); } return out; };

    /* ---------- f3-cabecera / f3-chips: una cabecera de tarjeta y una familia de etiquetas en todas las pantallas ---------- */
    const medirPatrones = () => {
      const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
      const raiz = getComputedStyle(document.documentElement), ink = raiz.getPropertyValue('--ink').trim(), ink2 = raiz.getPropertyValue('--ink-2').trim(), p2 = raiz.getPropertyValue('--paper-2').trim();
      const rgb = (h) => { const n = parseInt(h.replace('#', ''), 16); return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`; };
      const main = document.querySelector('.view.active');
      const cabs = [...main.querySelectorAll('.card>.cardhead,.info-card>h3,.flujo-card>h3,.escala>header,.prot-esc>header')].filter(vis);
      const malCab = cabs.filter((c) => { const cs = getComputedStyle(c), t = c.matches('.cardhead') ? (c.querySelector('h2,h3') || c) : c, ts = getComputedStyle(t);
        return !(cs.backgroundColor === rgb(p2) && cs.paddingTop === '12px' && cs.paddingLeft === '16px' && ts.fontSize === '14px' && ts.fontWeight === '600' && ts.color === rgb(ink)
          && ts.textTransform === 'none' && (ts.letterSpacing === 'normal' || parseFloat(ts.letterSpacing) === 0) && !/monospace|serif/.test(ts.fontFamily.replace(/sans-serif/g, ''))); })
        .map((c) => c.tagName + '.' + c.className + ' «' + c.textContent.trim().slice(0, 24) + '»');
      const glifos = [...main.querySelectorAll('.ic')].length;
      const versalitas = [...main.querySelectorAll('*')].filter((e) => vis(e) && getComputedStyle(e).textTransform === 'uppercase').map((e) => e.tagName + '.' + e.className);
      const chips = [...main.querySelectorAll('.st,.pill,.mbadge,.log-tipo,.chip-inactivo,.marca,.inc-sensible,.at-sensible,.doc-hist-marca,.solo-demo')].filter((e) => vis(e) && !e.closest('.exp-tab'));
      const malChip = chips.filter((e) => { const cs = getComputedStyle(e); return !(cs.fontSize === '12px' && cs.fontWeight === '600' && cs.borderTopLeftRadius === '4px' && !/monospace/.test(cs.fontFamily) && (cs.whiteSpace === 'nowrap' || e.classList.contains('doc-hist-marca'))); })
        .map((e) => e.className + '=' + getComputedStyle(e).fontSize + '/' + getComputedStyle(e).fontWeight);
      const cuentas = [...main.querySelectorAll('.card-n,.org-total')].filter(vis);
      const malCuenta = cuentas.filter((e) => { const cs = getComputedStyle(e); return !(cs.fontSize === '14px' && cs.color === rgb(ink2) && cs.borderTopStyle === 'none' && cs.backgroundColor === 'rgba(0, 0, 0, 0)'); }).map((e) => e.className);
      return { n: cabs.length, malCab, glifos, versalitas, nChips: chips.length, malChip, nCuentas: cuentas.length, malCuenta };
    };
    const patrones = await recorrer(medirPatrones);
    const conProblema = Object.entries(patrones).filter(([, v]) => v.malCab.length || v.glifos || v.versalitas.length);
    check('f3-cabecera', 'una sola cabecera de tarjeta en las 20 pantallas conectadas (listado, HCE-00, CI, LB, editor de LB, PA, PB, IC, editor del IC, VF, SEV, INC, ORG, DOC, LOG, Pendientes, Grupos, Inclusión, Ateneos, Panel): franja --paper-2, 12/16 px, título sans 14 px / 600 en tinta, sin versalitas ni glifo decorativo (.ic)',
      Object.values(patrones).reduce((a, v) => a + v.n, 0) >= 40 && !conProblema.length, JSON.stringify(conProblema.map(([k, v]) => ({ k, cab: v.malCab.slice(0, 3), glifos: v.glifos, mayus: v.versalitas.slice(0, 3) }))).slice(0, 600));
    const chipsMal = Object.entries(patrones).filter(([, v]) => v.malChip.length || v.malCuenta.length);
    check('f3-chips', 'una familia de etiquetas: todo chip de estado, «Sensible», «Registro histórico», «Inactivo», «Solo demo» y tipo del LOG mide sans 12 px / 600, radio 4 px, en una línea; las cuentas de las tarjetas (.card-n) son texto 14 px en --ink-2, sin chip',
      Object.values(patrones).reduce((a, v) => a + v.nChips, 0) >= 20 && Object.values(patrones).reduce((a, v) => a + v.nCuentas, 0) >= 3 && !chipsMal.length,
      JSON.stringify(chipsMal.map(([k, v]) => ({ k, chip: v.malChip.slice(0, 3), cuenta: v.malCuenta.slice(0, 3) }))).slice(0, 600));

    /* ---------- f3-banda: el chip de la banda en un renglón y sin recortarse, a 1280 y a 1024 (HCE-00, LB firmado, barra del editor) ---------- */
    const medirBanda = () => [...document.querySelectorAll('#panelExp .banda-chip')].filter((c) => c.getBoundingClientRect().width > 0).map((c) => {
      const r = c.getBoundingClientRect(), cont = c.closest('.info-card,.barra-acciones,.card'), rc = cont.getBoundingClientRect(), dd = c.closest('dd');
      return { txt: c.innerText.replace(/\s+/g, ' '), alto: Math.round(r.height), unaLinea: r.height < 34, dentro: r.left >= rc.left - 0.5 && r.right <= rc.right + 0.5 && r.right <= window.innerWidth,
        sinRecorte: !dd || dd.scrollWidth <= dd.clientWidth + 1 };
    });
    const bandas = [];
    for (const [w, h] of tamanios3) {
      await p3.setViewportSize({ width: w, height: h });
      for (const [id, tab, n] of [[idM3, 'hce00', 'Martín HCE-00'], [idV3, 'hce00', 'Valentina HCE-00'], [idM3, 'lb', 'Martín LB'], [idJ3, 'lb', 'Joaquín editor LB']]) {
        await abrir3(id, tab); (await p3.evaluate(medirBanda)).forEach((b) => bandas.push({ w, n, ...b }));
      }
      await vista3('analitica', () => PANEL.estado === 'listo');                  // el Panel: las seis bandas del catálogo, también las de nombre largo
      (await p3.evaluate(() => [...document.querySelectorAll('#panelBandas .banda-chip')].map((c) => { const r = c.getBoundingClientRect(), rc = c.closest('.card').getBoundingClientRect(), td = c.closest('td');
        return { txt: c.innerText.replace(/\s+/g, ' '), alto: Math.round(r.height), unaLinea: r.height < 34, dentro: r.left >= rc.left - 0.5 && r.right <= rc.right + 0.5 && r.right <= window.innerWidth, sinRecorte: !td || td.scrollWidth <= td.clientWidth + 1 }; })))
        .forEach((b) => bandas.push({ w, n: 'Panel', ...b }));
    }
    check('f3-banda', 'el chip de la banda del IDEA va en un renglón, dentro de su tarjeta y sin recortarse a 1280×800 y a 1024×768: «Línea base IDEA vigente» de Martín y de Valentina (HCE-00), el «Puntaje» del LB firmado, la barra del editor de Joaquín y las seis bandas de la distribución del Panel',
      bandas.length >= 20 && bandas.filter((b) => b.n === 'Panel').length === 12 && bandas.every((b) => b.unaLinea && b.dentro && b.sinRecorte), JSON.stringify(bandas.filter((b) => !(b.unaLinea && b.dentro && b.sinRecorte)).concat(bandas.slice(0, 2))).slice(0, 600));

    /* ---------- f3-descriptores: el editor del LB de Joaquín (borrador) — nada bajo 12 px ni recortado; la consigna una sola vez ---------- */
    const medirEditor = () => {
      const f = document.getElementById('ideaForm');
      const els = [...f.querySelectorAll('.opcion .desc,.dname,.inter-btn,.inter-label,.score-badge,.dsel,.dobs summary,.escala>header,.esc-foot')].filter((e) => e.getBoundingClientRect().width > 0);
      const chicos = els.filter((e) => parseFloat(getComputedStyle(e).fontSize) < 11.99).map((e) => e.className);
      const recortados = els.filter((e) => { const cs = getComputedStyle(e); const caja = e.closest('.opcion,.inter-btn,.dimension,.escala') || f; const r = e.getBoundingClientRect(), rc = caja.getBoundingClientRect();
        return (cs.overflow !== 'visible' && (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1)) || r.right > rc.right + 0.5 || r.left < rc.left - 0.5; }).map((e) => e.className + ' «' + e.textContent.trim().slice(0, 20) + '»');
      return { n: els.length, desc: f.querySelectorAll('.opcion .desc').length, chicos, recortados, consigna: document.querySelectorAll('#ideaComoPuntuar').length, repetida: f.querySelectorAll('.dinstr,.inter-nota').length,
        pregunta: (f.innerText.match(/entre dos niveles/g) || []).length, desborde: document.documentElement.scrollWidth > window.innerWidth };
    };
    const editor = [];
    for (const [w, h] of tamanios3) { await p3.setViewportSize({ width: w, height: h }); await abrir3(idJ3, 'lb'); editor.push({ w, ...(await p3.evaluate(medirEditor)) }); }
    check('f3-descriptores', 'editor del LB de Joaquín (borrador) a 1280 y a 1024: los 60 descriptores, los nombres de dimensión, los puntajes y los intermedios miden ≥ 12 px y ninguno se recorta ni se sale de su caja; la consigna («Cómo puntuar…») está UNA vez, no en cada dimensión',
      editor.length === 2 && editor.every((e) => e.desc === 60 && !e.chicos.length && !e.recortados.length && e.consigna === 1 && e.repetida === 0 && e.pregunta === 1 && !e.desborde), JSON.stringify(editor).slice(0, 600));

    /* ---------- f3-radar: las etiquetas de los ejes del radar del IC a ≥ 12 px en pantalla y dentro del gráfico ---------- */
    const medirRadar = () => [...document.querySelectorAll('#panelExp svg.ic-radar')].map((s) => {
      const vb = s.viewBox.baseVal, esc = s.getBoundingClientRect().width / vb.width;
      const textos = [...s.querySelectorAll('text')].map((t) => { const b = t.getBBox(); return { px: +(parseFloat(t.getAttribute('font-size')) * esc).toFixed(2),
        dentro: b.x >= vb.x - 0.5 && b.x + b.width <= vb.x + vb.width + 0.5 && b.y >= vb.y - 0.5 && b.y + b.height <= vb.y + vb.height + 0.5 }; });
      return { n: textos.length, min: Math.min(...textos.map((t) => t.px)), fuera: textos.filter((t) => !t.dentro).length };
    });
    const radares = [];
    for (const [w, h] of tamanios3) { await p3.setViewportSize({ width: w, height: h }); for (const id of [idV3, idM3]) { await abrir3(id, 'ic'); (await p3.evaluate(medirRadar)).forEach((r) => radares.push({ w, ...r })); } }
    check('f3-radar', 'radares del IC (editor de Valentina e IC firmado de Martín) a 1280 y a 1024: las etiquetas de los ejes miden ≥ 12 px en pantalla y ninguna se sale del gráfico',
      radares.length >= 6 && radares.every((r) => r.n >= 7 && r.min >= 11.99 && r.fuera === 0), JSON.stringify(radares));
    await p3.setViewportSize({ width: 1280, height: 800 });

    /* ---------- f3-texto: valores de ficha sin negrita, avatar sin signos, Pendientes sin repetir la columna ---------- */
    await abrir3(idM3, 'hce00');
    const ficha = await p3.evaluate(() => { const dd = getComputedStyle(document.querySelector('.data-row dd')), dt = getComputedStyle(document.querySelector('.data-row dt'));
      return { dd: dd.fontWeight + '/' + dd.fontSize, dt: dt.fontWeight + '/' + dt.fontSize, avatar: document.getElementById('userAvatar').textContent, nombre: document.getElementById('userNombre').textContent,
        coord: inicialesDe('Coordinación (demo)'), dr: inicialesDe('Dr. González'), parentesis: inicialesDe('(Lic.) Ana Pérez') }; });
    await vista3('pendientes', () => PEND.estado === 'listo');
    const pend = await p3.evaluate(() => ({ titulo: document.querySelector('#pendContenido .cardhead h2').textContent.trim(), columnas: [...document.querySelectorAll('#tablaPend thead th')].map((t) => t.textContent.trim()) }));
    check('f3-texto', 'HCE-00: rótulo y valor con el mismo peso (400; el valor a 15 px, el rótulo más chico); iniciales del avatar sin signos ni paréntesis («Coordinación (demo)» → «CD», «Dr. González» → «DG»); la tarjeta de Pendientes no repite el encabezado de su columna',
      ficha.dd === '400/15px' && /^400\//.test(ficha.dt) && ficha.coord === 'CD' && ficha.dr === 'DG' && ficha.parentesis === 'LA' && ficha.avatar === 'DG' && !pend.columnas.includes(pend.titulo) && pend.titulo.length > 0,
      JSON.stringify({ ficha, pend }));

    /* ---------- f3-toast: el aviso flotante con su tipo (✓ éxito · ℹ información · ! error), glifo + texto ---------- */
    const tipos = [];
    for (const t of [undefined, 'info', 'error']) tipos.push(await p3.evaluate((tt) => { toast('Prueba F3', tt); const e = document.getElementById('toast');
      return { tipo: e.dataset.tipo, glifo: document.getElementById('toastIco').textContent, oculto: document.getElementById('toastIco').getAttribute('aria-hidden'), sr: document.getElementById('toastTipo').textContent, rol: e.getAttribute('role') }; }, t));
    await abrir3(idJ3, 'lb');
    // Sin cambios no sale ningún pedido y avisa «No hay cambios para guardar». Por las dudas, una escritura a /idea se corta en el navegador (el chequeo falla).
    const escrituras3 = [];
    await p3.route((u) => /\/hce\/\d+\/idea/.test(u.pathname), (route) => { if (route.request().method() === 'GET') return route.continue(); escrituras3.push(route.request().method()); return route.abort(); });
    await p3.click('#btnEvGuardar'); await p3.waitForTimeout(300);
    await p3.unrouteAll({ behavior: 'ignoreErrors' });
    const sinCambios = await p3.evaluate(() => ({ tipo: document.getElementById('toast').dataset.tipo, glifo: document.getElementById('toastIco').textContent, msg: document.getElementById('toastMsg').textContent }));
    check('f3-toast', 'toast(): «ok» con ✓, «info» con ℹ y «error» con ! más «Error:» para lectores de pantalla (el glifo es aria-hidden, role="status"); «Guardar borrador» sin cambios avisa con ℹ, no con ✓',
      JSON.stringify(tipos.map((x) => [x.tipo, x.glifo, x.sr])) === JSON.stringify([['ok', '✓', ''], ['info', 'ℹ', ''], ['error', '!', 'Error: ']]) && tipos.every((x) => x.oculto === 'true' && x.rol === 'status')
        && sinCambios.tipo === 'info' && sinCambios.glifo === 'ℹ' && /No hay cambios/.test(sinCambios.msg) && !escrituras3.length, JSON.stringify({ tipos, sinCambios, escrituras3 }));

    /* ---------- f3-iconos: sin emoji en las fuentes; los íconos son texto o SVG en línea, decorativos; todo control sólo-ícono tiene nombre ---------- */
    const fuentes3 = await leerFuentes(['index.html', 'css/estilos.css', ...['utils.js', 'api.js', 'adaptadores.js', 'datos.js', 'flujo.js', 'catalogos.js', 'ui-core.js', 'wizard-nna.js', 'expediente.js', 'evaluaciones.js',
      'informe-cierre.js', 'hce-doc-org-vf.js', 'documentos.js', 'severidad.js', 'organismos.js', 'auditoria.js', 'panel.js', 'pendientes.js', 'grupos-usuario.js', 'inclusion.js', 'ateneos.js'].map((f) => 'js/' + f)]);
    const PERMITIDOS = new Set(['⚠', 'ℹ']);          // ⚠ e ℹ: Windows los dibuja como glifo de texto monocromo
    const emoji = fuentes3.flatMap(([f, t]) => [...t].filter((ch) => ((/\p{Emoji}/u.test(ch) && !/[0-9#*]/.test(ch)) || /\p{Extended_Pictographic}/u.test(ch) || ch === '️') && !PERMITIDOS.has(ch)).map((ch) => f + ':' + ch));
    const externos = fuentes3.filter(([, t]) => /<(img|link|script)[^>]+(src|href)="https?:\/\//.test(t) || /url\(\s*['"]?https?:/.test(t)).map(([f]) => f);
    const medirIconos = () => {
      const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
      const main = document.querySelector('.view.active');
      const svgs = [...main.querySelectorAll('svg.ico')].filter((s) => s.getAttribute('aria-hidden') !== 'true').length;
      const sinNombre = [...document.querySelectorAll('button, a[href], [role="button"]')].filter(vis).filter((b) => {
        const clon = b.cloneNode(true); clon.querySelectorAll('[aria-hidden="true"]').forEach((x) => x.remove());
        return !clon.textContent.trim() && !b.getAttribute('aria-label') && !b.getAttribute('aria-labelledby') && !b.getAttribute('title'); }).map((b) => b.id || b.className);
      return { svgs, sinNombre };
    };
    const iconos = await recorrer(medirIconos);
    await abrir3(idM3, 'ic');
    const impreso = await p3.evaluate(() => { const b = document.getElementById('btnIcImpreso'); const s = b.querySelector('svg.ico'); return { svg: !!s, oculto: s && s.getAttribute('aria-hidden'), texto: b.innerText.trim() }; });
    const iconosMal = Object.entries(iconos).filter(([, v]) => v.svgs || v.sinNombre.length);
    check('f3-iconos', 'ningún emoji en index.html, js/ ni css/ (sólo ⚠ e ℹ, glifos de texto) y nada cargado de otro servidor; los íconos SVG son en línea y aria-hidden (la impresora de «Ver informe impreso»); en las 20 pantallas ningún control queda sin nombre accesible',
      !emoji.length && !externos.length && !iconosMal.length && impreso.svg && impreso.oculto === 'true' && impreso.texto === 'Ver informe impreso',
      JSON.stringify({ emoji: emoji.slice(0, 5), externos, iconosMal: iconosMal.map(([k, v]) => [k, v]).slice(0, 3), impreso }).slice(0, 500));

    /* ---------- f3-guardar: «Guardar» es secundario donde la pantalla tiene su propia acción principal (Firmar); en un diálogo cuya única acción es guardar, principal ---------- */
    /* el botón que guarda es el de id «…Guardar» (btnEvGuardar, btnIcGuardar, btnVfGuardar, btnCiGuardar, btnSevGuardar) */
    const medirGuardar = () => { const vis = (e) => e.getBoundingClientRect().width > 0; const bs = [...document.querySelectorAll('button')].filter(vis);
      return { firmar: bs.filter((b) => b.classList.contains('btn-firmar')).map((b) => b.textContent.trim()), guardar: bs.filter((b) => /Guardar$/.test(b.id)).map((b) => [b.id, b.classList.contains('btn-primary') ? 'principal' : 'secundario']) }; };
    const guardar = {};
    for (const [k, id, tab, abrirForm] of [['LB', idJ3, 'lb'], ['PA', idS3, 'pa'], ['IC', idV3, 'ic'], ['VF', idM3, 'vf', '#btnVfNuevo'], ['CI-edición', idM3, 'ci', '#btnCiEditar'], ['dialogoSEV', idM3, 'sev', '#btnSevEditar']]) {
      await abrir3(id, tab); if (abrirForm) { await p3.click(abrirForm); await p3.waitForTimeout(200); } guardar[k] = await p3.evaluate(medirGuardar);
    }
    await p3.keyboard.press('Escape'); await p3.waitForTimeout(150);         // cierra el diálogo de SEV sin tocar nada (no pregunta)
    const conFirmar = ['LB', 'PA', 'IC'].every((k) => guardar[k].firmar.length === 1 && guardar[k].guardar.length >= 1 && guardar[k].guardar.every(([, c]) => c === 'secundario'));
    const soloGuardar = ['VF', 'CI-edición', 'dialogoSEV'].every((k) => guardar[k].firmar.length === 0 && guardar[k].guardar.some(([, c]) => c === 'principal'));
    check('f3-guardar', '«Guardar borrador» es secundario junto a «Firmar» (editores de LB, PA e IC); donde guardar es la única acción que confirma (VF, edición del CI, diálogo de SEV) es la principal',
      conFirmar && soloGuardar, JSON.stringify(guardar).slice(0, 600));

    /* ---------- f3-log: Auditoría con el módulo en palabras (como en su filtro), el campo con nombre legible y el título igual a la pestaña ---------- */
    // el expediente con filas de edición (campo) en su LOG: Martín o, si en el seed no tiene, Tomás (dado de baja: activo y fecha_baja)
    const idT3 = (await get3('/hce?nombre=Tom%C3%A1s&limit=20&incluir_inactivos=true')).json.find((h) => h.persona.nombre === 'Tomás').id;
    let idLog3 = idM3;
    for (const c of [idM3, idT3]) { if ((await get3(`/hce/${c}/auditoria?tipo=edicion&limit=5`)).json.some((a) => a.campo)) { idLog3 = c; break; } }
    await abrir3(idLog3, 'log');
    await p3.evaluate(() => { const ver = document.querySelector('#panelExp .log-ver'); if (ver) ver.open = true; });
    const log3 = await p3.evaluate(() => {
      const opc = Object.fromEntries([...document.querySelectorAll('#logModulo option')].filter((o) => o.value).map((o) => [o.textContent.trim(), o.value]));
      const filas = [...document.querySelectorAll('#panelExp .log-table tbody tr')].map((tr) => ({ mod: tr.children[2].textContent.trim(), negrita: !!tr.children[2].querySelector('b'), campo: tr.children[4].textContent.trim(), id: tr.children[4].dataset.campo || null,
        mono: /monospace/.test(getComputedStyle(tr.children[4].firstChild && tr.children[4].firstChild.nodeType === 1 ? tr.children[4].firstChild : tr.children[4]).fontFamily) }));
      const tab = document.querySelector('#tabExp-log .tab-nombre').textContent.trim(), titulo = document.getElementById('logTitulo').textContent.trim();
      return { opc, filas, tab, titulo };
    });
    const camposConocidos = log3.filas.filter((f) => f.id);
    check('f3-log', 'Auditoría (Martín, o Tomás si el seed no le dejó ediciones a Martín): el módulo de cada fila es el texto de su opción del filtro («Datos (HCE-00)»…), sin negrita; el campo va con su nombre legible, en la cara de texto (un identificador fuera del mapa se muestra tal cual); el título del módulo termina en el nombre de la pestaña («LOG · Auditoría»)',
      log3.filas.length > 0 && log3.filas.every((f) => f.mod === '—' || (f.mod in log3.opc && !f.negrita)) && camposConocidos.length > 0 && camposConocidos.every((f) => !f.mono)
        && camposConocidos.filter((f) => /^(medicacion|derivacion|activo|fecha_baja|alerta|nombre)$/.test(f.id)).every((f) => f.campo !== f.id) && camposConocidos.some((f) => f.campo !== f.id)
        && log3.titulo === `LOG · ${log3.tab}`, JSON.stringify({ titulo: log3.titulo, tab: log3.tab, filas: log3.filas.slice(0, 4) }).slice(0, 500));

    /* ---------- f3-estados: SEV, ORG y LOG con los mismos estados (revisión del bloque A) ---------- */
    await abrir3(idJ3, 'sev');
    const sevVacio = await p3.evaluate(() => { const v = document.querySelector('#panelExp .estado-vacio'); return { vacio: !!v, txt: v ? v.innerText : '', rol: v && v.getAttribute('role'), alerta: document.querySelectorAll('#panelExp [role="alert"]:not([hidden])').length }; });
    await abrir3(idJ3, 'org');
    const orgVacio = await p3.evaluate(() => ({ inau: !!document.querySelector('#orgRegInauVacio .estado-vacio'), bps: !!document.querySelector('#orgVinculoBps .estado-vacio'), txt: (document.getElementById('orgVinculoBps') || {}).innerText || '' }));
    // Un aviso de la API (guardar con warnings[], contestado en el navegador) no queda al cambiar de pestaña y volver
    const orgM3 = (await get3(`/hce/${idM3}/organismos`)).json, inauM = (orgM3.data || orgM3).inau;
    await p3.route((u) => /\/hce\/\d+\/organismos\/inau$/.test(u.pathname), (route) => route.request().method() === 'PATCH'
      ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: inauM, warnings: [{ code: 'prueba_f3', mensaje: 'Aviso de prueba F3.' }] }) }) : route.continue());
    await abrir3(idM3, 'org'); await p3.click('#btnOrgInauEditar'); await p3.waitForSelector('#modalFlujo.open #orgi_obs');
    await p3.fill('#orgi_obs', 'Cambio de prueba F3'); await p3.click('#btnOrgGuardar');
    await p3.waitForFunction(() => !document.getElementById('modalFlujo').classList.contains('open'), null, { timeout: 8000 });
    const conAviso = await p3.evaluate(() => !document.getElementById('orgAvisos').hidden && /Aviso de prueba F3/.test(document.getElementById('orgAvisos').innerText));
    await p3.click('#tabExp-sev'); await p3.waitForTimeout(200); await p3.click('#tabExp-org'); await p3.waitForFunction(() => !/Cargando/.test(document.getElementById('panelExp').innerText), null, { timeout: 8000 });
    const trasVolver = await p3.evaluate(() => { const a = document.getElementById('orgAvisos'); return a ? !a.hidden : null; });
    // Un error con el campo calificado («inau.obs») queda junto a su control y en el resumen enfocado
    await p3.unrouteAll({ behavior: 'ignoreErrors' });
    await p3.route((u) => /\/hce\/\d+\/organismos\/inau$/.test(u.pathname), (route) => route.request().method() === 'PATCH'
      ? route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ code: 'validation_error', detail: [{ campo: 'inau.obs', mensaje: 'Error de prueba F3 en las observaciones.' }] }) }) : route.continue());
    await p3.click('#btnOrgInauEditar'); await p3.waitForSelector('#modalFlujo.open #orgi_obs');
    await p3.fill('#orgi_obs', 'Otro cambio de prueba F3'); await p3.click('#btnOrgGuardar');
    await p3.waitForFunction(() => !document.getElementById('orgErrores').hidden, null, { timeout: 8000 });
    const errCampo = await p3.evaluate(() => ({ err: document.getElementById('err_orgi_obs').textContent, invalido: document.getElementById('orgi_obs').getAttribute('aria-invalid'), foco: document.activeElement.id, enlace: !!document.querySelector('#orgErrores a[href="#orgi_obs"]') }));
    await p3.unrouteAll({ behavior: 'ignoreErrors' });
    await p3.keyboard.press('Escape'); await p3.waitForTimeout(150);
    if (await p3.locator('#btnCdDescartar').count()) await p3.click('#btnCdDescartar');
    check('f3-estados', 'SEV sin registrar (Joaquín, 404) = el estado vacío compartido «Sin registrar» (role="status", sin alerta); ORG: una lista de registros vacía y un vínculo sin registrar con estadoVacioHtml; un aviso de la API no queda al cambiar de pestaña y volver; un 422 con campo «inau.obs» queda junto a su campo (aria-invalid, mensaje) y en el resumen con enlace, con el foco en el resumen',
      sevVacio.vacio && /^◌?\s*Sin registrar\./.test(sevVacio.txt) && sevVacio.rol === 'status' && sevVacio.alerta === 0 && orgVacio.inau && orgVacio.bps && /Sin registrar\./.test(orgVacio.txt)
        && conAviso && trasVolver === false && /Error de prueba F3/.test(errCampo.err) && errCampo.invalido === 'true' && errCampo.foco === 'orgErrores' && errCampo.enlace,
      JSON.stringify({ sevVacio: { ...sevVacio, txt: sevVacio.txt.slice(0, 60) }, orgVacio: { ...orgVacio, txt: orgVacio.txt.slice(0, 60) }, conAviso, trasVolver, errCampo }));
    await c3f.close();
  }

  /* =====================================================================================================
     FASE 3-c · IDEA, PROTOCOLOS A/B y arrastre de la 3-b (handoff §5.125). También ESCRIBE (firma, addendas).
     ===================================================================================================== */
  {
    const { ctx: cc, page: pc } = await nuevaPagina();
    await loguearComo(pc, EMAIL, PASSWORD);
    const token = await pc.evaluate(() => sessionStorage.getItem('ippu.token'));
    const yo = await (await fetch(API + '/auth/yo', { headers: { Authorization: 'Bearer ' + token } })).json();
    const send = async (metodo, ruta, body) => {
      const r = await fetch(API + ruta, { method: metodo, headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
      return { status: r.status, json: r.status === 204 ? null : await r.json() };
    };
    const get = (ruta) => send('GET', ruta);
    const idDe = async (nombre) => (await get('/hce?nombre=' + encodeURIComponent(nombre) + '&limit=20')).json.find((h) => h.persona.nombre === nombre).id;
    const abrir = async (id, tab) => {
      await pc.evaluate((i) => abrirExpediente(i), id);
      await pc.waitForSelector('#expTitulo');
      if (tab) {
        await pc.click('#tabExp-' + tab);
        await pc.waitForFunction(() => document.getElementById('evResumen') || document.getElementById('evTotal') || document.querySelector('#panelExp .empty-state:not(.estado-carga)'), null, { timeout: 8000 });
      }
    };
    const habilitados = () => pc.evaluate(() => [...document.querySelectorAll('#panelExp [data-ev]')].filter((e) => !e.disabled).length);
    const sinCandado = () => pc.evaluate(() => !/🔒|Bloquead/i.test(document.body.innerText));
    const norm = (t) => t.replace(/\s+/g, ' ').trim();
    const fmtD = (d) => (d > 0 ? '+' : '') + d;
    const profs = (await get('/profesionales')).json;
    const idGonzalez = profs.find((x) => x.nombre === 'Dr. González').id, idTorres = profs.find((x) => x.nombre === 'Mtra. Torres').id;
    const claves = ['esc_1', 'esc_2', 'esc_3', 'esc_4', 'total'];

    /* ---------- (a) IDEA firmado de Martín: 58, banda en texto con el color de la rampa, solo lectura ---------- */
    const idMartin3 = await idDe('Martín');
    await abrir(idMartin3, 'lb');
    const ideaM = (await get(`/hce/${idMartin3}/idea`)).json[0];
    const a1 = await pc.evaluate(() => {
      const chip = document.querySelector('#evBanda .banda-chip');
      const raiz = getComputedStyle(document.documentElement);
      const paso = chip ? chip.dataset.bandaPaso : null;
      return { total: document.getElementById('evTotal').textContent.trim(), chip: chip ? chip.innerText.replace(/\s+/g, ' ') : null, paso,
        bg: chip ? getComputedStyle(chip).backgroundColor : null, rampa: paso ? raiz.getPropertyValue('--rampa-' + paso).trim() : null,
        ok: raiz.getPropertyValue('--ok').trim(), warn: raiz.getPropertyValue('--warn').trim(), bad: raiz.getPropertyValue('--bad').trim(),
        texto: document.querySelector('#panelExp .ev-puntaje').innerText };
    });
    const hexRgb = (h) => { const n = parseInt(h.replace('#', ''), 16); return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`; };
    check('3c-a', 'IDEA firmado de Martín: total 58 (de la API), banda ESCRITA («Moderado · 56–75») con el color del paso de la rampa de un solo matiz (no ok/warn/bad), sin «nivel DSM» y solo lectura',
      a1.total === '58' && String(ideaM.total) === '58' && a1.chip.includes(ideaM.banda.perfil) && a1.chip.includes(`${ideaM.banda.total_min}–${ideaM.banda.total_max}`) &&
      a1.bg === hexRgb(a1.rampa) && ![a1.ok, a1.warn, a1.bad].map(hexRgb).includes(a1.bg) && !/Nivel 2|nivel_dsm|DSM/i.test(a1.texto) && (await habilitados()) === 0 &&
      (await pc.locator('#btnEvGuardar, #btnEvFirmar').count()) === 0,
      `${a1.total} · ${a1.chip} · paso ${a1.paso} ${a1.bg} == ${a1.rampa}`);
    await pc.click('#tabExp-hce00');
    await pc.waitForFunction(() => /Línea base IDEA vigente/i.test(document.getElementById('panelExp').innerText) && /Total IDEA/i.test(document.getElementById('panelExp').innerText), null, { timeout: 8000 });
    const vig = (await get(`/hce/${idMartin3}/idea/vigente`)).json;
    const hceM2 = norm(await txt(pc, '#panelExp'));
    check('3c-vigente', 'HCE-00 muestra la «Línea base IDEA vigente» que devuelve GET /hce/{id}/idea/vigente (total y banda de la API)',
      new RegExp(`Total IDEA\\s*${vig.vigente.total}\\s*/ 96`).test(hceM2) && hceM2.includes(vig.vigente.banda.perfil), hceM2.slice(hceM2.toLowerCase().indexOf('línea base idea vigente'), hceM2.toLowerCase().indexOf('línea base idea vigente') + 120));

    /* ---------- (g) Martín: PA 60, PB 79, Δ +19 (4/6/4/5) tal como los devuelve la API ---------- */
    const protM = (await get(`/hce/${idMartin3}/protocolo`)).json;
    const paM = protM.find((x) => x.tipo === 'A'), pbM = protM.find((x) => x.tipo === 'B');
    await pc.click('#tabExp-pa'); await pc.waitForSelector('#evTotal');
    const totPA = (await txt(pc, '#evTotal')).trim();
    await pc.click('#tabExp-pb'); await pc.waitForSelector('#evResultado');
    const tot = await pc.evaluate(() => ({ pb: document.getElementById('evTotal').textContent.trim(),
      filas: Object.fromEntries([...document.querySelectorAll('#evResultado [data-delta]')].map((tr) => [tr.dataset.delta, tr.querySelector('.res-delta').innerText.trim()])),
      txt: document.getElementById('evResultado').innerText.replace(/\s+/g, ' ') }));
    check('3c-g', 'Martín: PA 60, PB 79 y Δ +19 (escalas +4/+6/+4/+5) tal como los devuelve la API, con su lectura (etiqueta) y sin alerta',
      totPA === '60' && String(paM.total) === '60' && tot.pb === '79' && String(pbM.total) === '79' &&
      claves.every((c) => tot.filas[c] === fmtD(pbM.deltas[c])) && tot.filas.total === '+19' && [4, 6, 4, 5].every((d, i) => tot.filas['esc_' + (i + 1)] === '+' + d) &&
      claves.every((c) => tot.txt.includes(pbM.interpretacion[c].etiqueta)) && pbM.alertas.length === 0 && !/alerta institucional/i.test(tot.txt),
      JSON.stringify(tot.filas));

    /* ---------- (d) addenda sobre el IDEA firmado: autor = usuario con sesión, marcas visibles ---------- */
    await pc.click('#tabExp-lb'); await pc.waitForSelector('#ev_add_texto');
    const textoAdd = 'Corrección de prueba 3-c: la fecha de consenso se confirmó en reunión.';
    const reqAdd = pc.waitForRequest((r) => r.method() === 'POST' && /\/idea\/\d+\/addendas$/.test(r.url()));
    await pc.fill('#ev_add_texto', textoAdd);
    await pc.click('#btnEvAdd');
    const cuerpoAdd = cuerpoDe(await reqAdd);
    await pc.waitForSelector('#evAddendas .ev-add-lista');
    const ideaAdd = (await get(`/idea/${ideaM.id}`)).json;
    const pantalla = await pc.evaluate(() => ({ lista: document.querySelector('#evAddendas .ev-add-lista').innerText.replace(/\s+/g, ' '), cab: document.getElementById('evEstado').innerText.replace(/\s+/g, ' '),
      tab: document.getElementById('tabExp-lb').innerText.replace(/\s+/g, ' '), tabSr: document.querySelector('#tabExp-lb .st-addenda .sr-only') ? document.querySelector('#tabExp-lb .st-addenda .sr-only').textContent : '',
      foco: document.activeElement.id }));
    check('3c-d', 'addenda a un IDEA firmado: el cuerpo es solo {texto} (sin autor), la API guarda como autor al usuario de la sesión, la lista lo muestra con nombre y fecha, y el estado del módulo marca la addenda (encabezado y pestaña del ciclo anual, con ✚ visible)',
      JSON.stringify(Object.keys(cuerpoAdd)) === '["texto"]' && ideaAdd.addendas.length === 1 && ideaAdd.addendas[0].profesional_id === yo.id && ideaAdd.addendas[0].texto === textoAdd &&
      pantalla.lista.includes(yo.nombre) && pantalla.lista.includes(textoAdd) && /con 1 addenda/.test(pantalla.cab) && /✚/.test(pantalla.cab) && /con 1 addenda/.test(pantalla.tabSr) && /✚/.test(pantalla.tab) && pantalla.foco === 'evAddTitulo',
      `autor=${yo.nombre} (id ${yo.id}) · ${pantalla.cab}`);
    await pc.click('#btnEvAdd');
    await pc.waitForSelector('#evAddErrores:not([hidden])');
    const addVacia = await pc.evaluate(() => ({ err: document.getElementById('err_ev_add_texto').textContent, inv: document.getElementById('ev_add_texto').getAttribute('aria-invalid'), desc: document.getElementById('ev_add_texto').getAttribute('aria-describedby'),
      rol: document.getElementById('evAddErrores').getAttribute('role'), foco: document.activeElement.id }));
    check('3c-d2', 'addenda vacía: el 422 de la API se muestra junto al campo (aria-invalid + aria-describedby) y en un resumen role="alert" con foco',
      addVacia.err !== '' && addVacia.inv === 'true' && /err_ev_add_texto/.test(addVacia.desc) && addVacia.rol === 'alert' && addVacia.foco === 'evAddErrores', JSON.stringify(addVacia));

    /* ---------- (d3) la addenda a medio escribir sobrevive al cambio de pestaña y al re-clic en la misma pestaña ---------- */
    const borrador = 'Borrador de addenda que no se debe perder (3-c).';
    await pc.click('#tabExp-lb'); await pc.waitForSelector('#ev_add_texto');
    await pc.fill('#ev_add_texto', borrador);
    await pc.click('#tabExp-pa'); await pc.waitForFunction(() => /PA ·/.test((document.getElementById('evTitulo') || {}).textContent || ''), null, { timeout: 8000 });
    await pc.click('#tabExp-lb'); await pc.waitForSelector('#ev_add_texto');
    const trasTab = await pc.inputValue('#ev_add_texto');
    await pc.click('#tabExp-lb');                                  // re-clic en la MISMA pestaña: se repinta y se vuelve a leer
    const trasReclic = await pc.inputValue('#ev_add_texto');
    await pc.waitForTimeout(700);
    const trasLectura = await pc.inputValue('#ev_add_texto');
    check('3c-add1', 'la addenda a medio escribir sobrevive a cambiar de pestaña (LB → PA → LB) y a re-hacer clic en la misma pestaña (también cuando termina la relectura)',
      trasTab === borrador && trasReclic === borrador && trasLectura === borrador, JSON.stringify({ trasTab, trasReclic, trasLectura }));

    /* ---------- (d4) relectura en segundo plano: lo tipeado mientras llega la respuesta no se pisa y la addenda ajena aparece ---------- */
    {
      const reIdea = new RegExp(`/hce/${idMartin3}/idea(\\?.*)?$`);
      await pc.route(reIdea, async (route) => { if (route.request().method() !== 'GET') return route.continue(); await new Promise((x) => setTimeout(x, 2500)); return route.continue(); });
      const rel = pc.waitForResponse((r) => r.request().method() === 'GET' && reIdea.test(r.url()));
      await pc.click('#tabExp-lb');                                // empieza la relectura (la respuesta tarda 2,5 s)
      await pc.waitForSelector('#ev_add_texto');
      const tipeado = 'Lo que se escribe mientras llega la relectura (3-c).';
      await pc.fill('#ev_add_texto', tipeado);
      const tkT = (await (await fetch(API + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'torres@demo.ippu.test', password: PASSWORD }) })).json()).access_token;
      const ajena = await fetch(API + `/idea/${ideaM.id}/addendas`, { method: 'POST', headers: { Authorization: 'Bearer ' + tkT, 'Content-Type': 'application/json' }, body: JSON.stringify({ texto: 'Addenda de otro usuario (3-c).' }) });
      await rel;
      await pc.waitForFunction(() => /Addenda de otro usuario/.test((document.querySelector('#evAddendas .ev-add-lista') || {}).innerText || ''), null, { timeout: 8000 });
      const guard = await pc.evaluate(() => ({ campo: document.getElementById('ev_add_texto').value, lista: document.querySelector('#evAddendas .ev-add-lista').innerText.replace(/\s+/g, ' '), items: document.querySelectorAll('#evAddendas .ev-add-lista li').length }));
      await pc.unroute(reIdea);
      check('3c-add2', 'relectura en segundo plano (GET /hce/{id}/idea demorado) mientras otro usuario agrega una addenda por la API: lo tipeado en la addenda sigue en el campo y la addenda nueva aparece en la lista',
        ajena.status === 201 && guard.campo === tipeado && guard.items === 2 && /Addenda de otro usuario/.test(guard.lista), JSON.stringify({ status: ajena.status, ...guard }).slice(0, 300));
      await pc.fill('#ev_add_texto', '');
      await pc.click('#tabExp-pa'); await pc.click('#tabExp-lb'); await pc.waitForSelector('#ev_add_texto');      // el borrador queda vacío también en el estado
    }

    /* ---------- (d5) banda desconocida o no numérica: estilo neutro, nombre y rango escritos, nunca un paso inferido ---------- */
    {
      const reIdea = new RegExp(`/hce/${idMartin3}/idea(\\?.*)?$`);
      let minForzado;
      await pc.route(reIdea, async (route) => {
        if (route.request().method() !== 'GET') return route.continue();
        const r = await route.fetch(); const j = await r.json();
        if (minForzado !== undefined) j.forEach((x) => { if (x.banda) x.banda = { ...x.banda, total_min: minForzado }; });
        return route.fulfill({ response: r, json: j });
      });
      const chipDe = () => pc.evaluate(() => { const c = document.querySelector('#evBanda .banda-chip'), e = getComputedStyle(c);
        return { paso: c.dataset.bandaPaso, clase: c.className, txt: c.innerText.replace(/\s+/g, ' '), bg: e.backgroundColor, color: e.color, borde: e.borderTopWidth + ' ' + e.borderTopColor }; });
      const bandas = {};
      for (const v of [56, 60, 7, null]) {                              // 56 primero: el paso 4 de referencia (el real de Martín es 56–75)
        minForzado = v;
        const rel = pc.waitForResponse((r) => r.request().method() === 'GET' && reIdea.test(r.url()));
        await pc.click('#tabExp-lb'); await rel; await pc.waitForTimeout(250);
        bandas[String(v)] = await chipDe();
      }
      await pc.unroute(reIdea);
      const ref = bandas['56'], neutras = ['60', '7', 'null'].map((k) => bandas[k]);
      check('3c-banda', 'total_min 56 → su paso (4, azul de la rampa); 60, 7 y null → estilo neutro (banda-neutra: fondo neutro, texto de tinta, mismo borde), con el nombre de la banda y su rango escritos',
        ref.paso === '4' && ref.bg === 'rgb(92, 146, 204)' && neutras.every((n) => n.paso === 'neutra' && /banda-neutra/.test(n.clase) && n.bg === 'rgb(237, 241, 243)' && n.color === 'rgb(22, 35, 44)' && n.borde === ref.borde && /Moderado/.test(n.txt)) && /7–/.test(bandas['7'].txt) && /60–/.test(bandas['60'].txt),
        JSON.stringify(bandas).slice(0, 500));
    }

    /* ---------- (e) NS con su marca propia + (h) evaluador faltante, en el borrador de Joaquín ---------- */
    const idJoaquin = await idDe('Joaquín');
    await abrir(idJoaquin, 'lb');
    const ns = await pc.evaluate(() => {
      const m = document.querySelector('#dsel-D3 .ns-marca'), n = document.querySelector('#dsel-D1 .score-badge');
      const btn = document.querySelector('#dim-D3 .inter-ns');
      return { marca: !!m, estilo: m ? getComputedStyle(m).borderTopStyle : null, comoNumero: !!document.querySelector('#dsel-D3 .score-badge'), texto: m ? m.innerText.trim() : '',
        sr: m ? m.querySelector('.sr-only').textContent : '', presionado: btn.getAttribute('aria-pressed'), numEstilo: n ? getComputedStyle(n).borderTopStyle : null,
        ns12: !!document.querySelector('#dsel-D12 .ns-marca') };
    });
    check('3c-e', 'un valor NS se muestra con su propia marca (borde punteado, glifo y texto «NS … observación insuficiente»), no como número ni como «sin puntuar», y el botón NS queda presionado',
      ns.marca && ns.ns12 && ns.estilo === 'dashed' && !ns.comoNumero && ns.texto.startsWith('◌') && /NS/.test(ns.texto) && /observación insuficiente/.test(ns.sr) && ns.presionado === 'true' && ns.numEstilo !== 'dashed', JSON.stringify(ns));
    await pc.click('#btnEvFirmar'); await pc.click('#btnEvConfirmar');
    await pc.waitForSelector('#evErrores:not([hidden])');
    const e422 = await pc.evaluate(() => ({ d3: document.getElementById('err_dim_D3').textContent, d12: document.getElementById('err_dim_D12').textContent, fecha: document.getElementById('err_lb_fecha').textContent,
      sint: document.getElementById('err_lb_sintesis').textContent, obj: document.getElementById('err_lb_objetivos').textContent, d1: document.getElementById('err_dim_D1').textContent,
      desc: document.getElementById('dimgrp-D3').getAttribute('aria-describedby'), inv: document.getElementById('lb_fecha').getAttribute('aria-invalid'), rol: document.getElementById('evErrores').getAttribute('role'), foco: document.activeElement.id }));
    check('3c-422', 'firmar el borrador de Joaquín: el 422 de la API se muestra por dimensión (D3 y D12 en NS), por campo (fecha, síntesis, objetivos) con aria-describedby/aria-invalid, y en un resumen role="alert" con foco; nada que la API no dijo',
      e422.d3 !== '' && e422.d12 !== '' && e422.fecha !== '' && e422.sint !== '' && e422.obj !== '' && e422.d1 === '' && /err_dim_D3/.test(e422.desc) && e422.inv === 'true' && e422.rol === 'alert' && e422.foco === 'evErrores', JSON.stringify(e422));
    await pc.click('#dim-D3 .opcion[data-v="8"]'); await pc.click('#dim-D12 .opcion[data-v="6"]');
    await pc.fill('#lb_fecha', '2026-03-12'); await pc.fill('#lb_sintesis', 'Perfil de alta necesidad de apoyo; síntesis breve de prueba.'); await pc.fill('#lb_objetivos', 'Objetivos de prueba de la línea base.');
    await pc.selectOption('#ev_t2', '');
    await pc.click('#btnEvFirmar'); await pc.click('#btnEvConfirmar');
    await pc.waitForFunction(() => document.getElementById('err_ev_t2') && document.getElementById('err_ev_t2').textContent !== '', null, { timeout: 8000 });
    const h1 = await pc.evaluate(() => ({ t2: document.getElementById('err_ev_t2').textContent, t1: document.getElementById('err_ev_t1').textContent, inv: document.getElementById('ev_t2').getAttribute('aria-invalid'),
      desc: document.getElementById('ev_t2').getAttribute('aria-describedby'), items: [...document.querySelectorAll('#evErrores li')].map((l) => l.innerText), d3: document.getElementById('err_dim_D3').textContent }));
    check('3c-h', 'firmar sin el evaluador 2: el 422 de la API aparece junto al campo del evaluador (aria-invalid + aria-describedby) y es el ÚNICO error (lo demás ya estaba completo)',
      h1.t2 !== '' && h1.t1 === '' && h1.inv === 'true' && /err_ev_t2/.test(h1.desc) && h1.items.length === 1 && /Evaluador\/a 2/.test(h1.items[0]) && h1.d3 === '', JSON.stringify(h1));
    await pc.selectOption('#ev_t2', String(idTorres));
    const reqPatch = pc.waitForRequest((r) => r.method() === 'PATCH' && /\/idea\/\d+$/.test(r.url()));
    const reqFirma = pc.waitForRequest((r) => r.method() === 'POST' && /\/idea\/\d+\/firmar$/.test(r.url()));
    await pc.click('#btnEvFirmar'); await pc.click('#btnEvConfirmar');
    const cuerpoPatch = cuerpoDe(await reqPatch), rFirma = await reqFirma;
    await pc.waitForSelector('#evEstado .st-firmado', { timeout: 8000 });
    const ideaJ = (await get(`/hce/${idJoaquin}/idea`)).json[0];
    const hJ = await pc.evaluate(() => ({ av: document.getElementById('evAvisos').hidden ? '' : document.getElementById('evAvisos').innerText.replace(/\s+/g, ' '), cab: document.getElementById('evEstado').innerText.replace(/\s+/g, ' '),
      total: document.getElementById('evTotal').textContent.trim(), chip: document.querySelector('#evBanda .banda-chip') ? document.querySelector('#evBanda .banda-chip').innerText.replace(/\s+/g, ' ') : '', foco: document.activeElement.id }));
    check('3c-h2', 'con los dos evaluadores elegidos: el PATCH guarda evaluador_t2_id, POST /firmar va SIN cuerpo, la API firma, la pantalla pasa a solo lectura con el total y la banda de la API y el aviso «recomendación no cumplida» (síntesis breve) sin bloquear',
      cuerpoPatch.evaluador_t2_id === idTorres && JSON.stringify(Object.keys(cuerpoPatch)) === '["evaluador_t2_id"]' && rFirma.postData() === null && ideaJ.firmado === true && ideaJ.evaluador_t1_id && ideaJ.evaluador_t2_id === idTorres &&
      hJ.total === String(ideaJ.total) && hJ.chip.includes(ideaJ.banda.perfil) && /síntesis/i.test(hJ.av) && /firmado/i.test(hJ.cab.toLowerCase()) && (await habilitados()) === 0 && hJ.foco === 'evTitulo',
      JSON.stringify({ patch: Object.keys(cuerpoPatch), aviso: hJ.av.slice(0, 120), total: hJ.total, postData: rFirma.postData(), foco: hJ.foco, cab: hJ.cab, chip: hJ.chip, firmado: ideaJ.firmado, t2: ideaJ.evaluador_t2_id }));

    /* ---------- (b) PA de Sofía: ítem 1 con puntaje 1 sin observación → error por ítem; con observación → firma ---------- */
    const idSofia = await idDe('Sofía');
    await abrir(idSofia, 'pa');
    const paDraft = (await get(`/hce/${idSofia}/protocolo`)).json.find((x) => x.tipo === 'A');
    check('3c-b0', 'el borrador del PA de Sofía se carga desde la API (24 ítems, evaluadores del borrador precargados, sin fecha ni síntesis)',
      (await pc.locator('#panelExp .likert-btn.sel').count()) === 24 && paDraft.firmado === false && (await pc.inputValue('#ev_t1')) === String(paDraft.evaluador_t1_id) && (await pc.inputValue('#prot_fecha')) === '', '24 ítems');
    await pc.click('#pitem-1 .likert-btn[data-v="1"]');
    await pc.fill('#prot_fecha', '2026-07-08'); await pc.fill('#prot_sint1', 'Síntesis del técnico 1 (prueba 3-c).'); await pc.fill('#prot_sint2', 'Síntesis del técnico 2 (prueba 3-c).');
    const vivo = await pc.evaluate(() => ({ total: document.getElementById('evTotal').textContent, etq: document.getElementById('evTotalEtq').textContent, cuenta: document.getElementById('evCuenta').textContent, sub0: document.getElementById('protSub0').textContent }));
    check('3c-prov', 'mientras se tipea: la suma queda rotulada «provisorio» y el conteo es «n / 24 ítems puntuados»; sin banda ni Δ en vivo',
      /provisorio/.test(vivo.etq) && /provisorio/.test(vivo.sub0) && /24 \/ 24 ítems puntuados/.test(vivo.cuenta) && (await pc.locator('#evBanda .banda-chip').count()) === 0, JSON.stringify(vivo));
    await pc.click('#btnEvFirmar'); await pc.click('#btnEvConfirmar');
    await pc.waitForSelector('#evErrores:not([hidden])');
    const b1 = await pc.evaluate(() => ({ err: document.getElementById('err_pobs-1').textContent, inv: document.getElementById('pobs-1').getAttribute('aria-invalid'), desc: document.getElementById('pobs-1').getAttribute('aria-describedby'),
      visible: getComputedStyle(document.getElementById('pobsw-1')).display, lista: [...document.querySelectorAll('#evErrores li')].map((l) => l.innerText), otros: document.getElementById('err_pobs-2').textContent }));
    check('3c-b1', 'PA con el ítem 1 puntuado 1 y sin observación: el 422 de la API aparece JUNTO a ese ítem (aria-invalid + aria-describedby), el cuadro de observación queda visible y es el único error',
      b1.err !== '' && b1.inv === 'true' && /err_pobs-1/.test(b1.desc) && b1.visible !== 'none' && b1.lista.length === 1 && /Ítem 1/.test(b1.lista[0]) && b1.otros === '', JSON.stringify(b1));
    await pc.fill('#pobs-1', 'Retroceso marcado ante el cambio de sala (prueba 3-c).');
    const reqFirmaPA = pc.waitForResponse((r) => r.request().method() === 'POST' && /\/protocolo\/\d+\/firmar$/.test(r.url()));
    await pc.click('#btnEvFirmar'); await pc.click('#btnEvConfirmar');
    const respPA = await reqFirmaPA;
    await pc.waitForSelector('#evEstado .st-firmado', { timeout: 8000 });
    const paFirmado = (await get(`/protocolo/${paDraft.id}`)).json;
    const bPA = await pc.evaluate(() => ({ total: document.getElementById('evTotal').textContent.trim(), cab: document.getElementById('evEstado').innerText.replace(/\s+/g, ' ') }));
    check('3c-b2', 'con la observación el PA firma (POST /firmar → 200): la pantalla pasa a solo lectura con el total que devolvió la API y el estado «Firmado»',
      respPA.status() === 200 && paFirmado.firmado === true && bPA.total === String(paFirmado.total) && /Firmado/.test(bPA.cab) && (await habilitados()) === 0, `total ${bPA.total} (API ${paFirmado.total})`);
    const m409 = await send('PATCH', `/protocolo/${paDraft.id}`, { otros: 'x' });
    check('3c-b3', 'el PA firmado ya no se edita: la API contesta 409 (signed_module) y la pantalla no ofrece guardar ni firmar',
      m409.status === 409 && (await pc.locator('#btnEvGuardar, #btnEvFirmar').count()) === 0, 'PATCH → ' + m409.status);

    /* ---------- (c) PB de Sofía: se crea y se firma; el Δ y la alerta mostrados == la respuesta de la API ---------- */
    await pc.click('#tabExp-pb'); await pc.waitForSelector('#evResumen');
    const itemsPB = [1, 1, 2, 2, 2, 2, 4, 4, 3, 3, 3, 3, 4, 3, 3, 4, 3, 3, 4, 3, 3, 4, 3, 3];   // E1 = 10 → Δ E1 = −8: alerta
    for (let i = 0; i < 24; i++) await pc.click(`#pitem-${i + 1} .likert-btn[data-v="${itemsPB[i]}"]`);
    await pc.fill('#pobs-1', 'Regresión significativa en contacto visual (prueba 3-c).'); await pc.fill('#pobs-2', 'Regresión en iniciativa social (prueba 3-c).');
    await pc.fill('#prot_fecha', '2026-11-10'); await pc.fill('#prot_semanas', '17'); await pc.fill('#prot_sint1', 'Síntesis PB técnico 1.'); await pc.fill('#prot_sint2', 'Síntesis PB técnico 2.'); await pc.fill('#prot_ajustes', 'Ajustes de prueba.');
    const reqCrearPB = pc.waitForRequest((r) => r.method() === 'POST' && /\/hce\/\d+\/protocolo$/.test(r.url()));
    await pc.click('#btnEvFirmar'); await pc.click('#btnEvConfirmar');
    const cuerpoPB = cuerpoDe(await reqCrearPB);
    await pc.waitForSelector('#evResultado', { timeout: 8000 });
    const pbS = (await get(`/hce/${idSofia}/protocolo`)).json.find((x) => x.tipo === 'B');
    const dPB = await pc.evaluate(() => ({ total: document.getElementById('evTotal').textContent.trim(),
      filas: Object.fromEntries([...document.querySelectorAll('#evResultado [data-delta]')].map((tr) => [tr.dataset.delta, { d: tr.querySelector('.res-delta').innerText.trim(), t: tr.innerText.replace(/\s+/g, ' ') }])),
      alerta: [...document.querySelectorAll('.ev-alertas')].map((e) => e.innerText.replace(/\s+/g, ' ')), marcas: document.querySelectorAll('#evResultado .ev-alerta').length }));
    check('3c-c', 'PB de Sofía creado y firmado: POST con tipo B y año del flujo; el Δ (total y por escala), la lectura y la ALERTA mostrados son exactamente los de la API (Δ E1 ≤ −7 → alerta institucional)',
      cuerpoPB.tipo === 'B' && cuerpoPB.anio === paDraft.anio && pbS.firmado === true && dPB.total === String(pbS.total) && claves.every((c) => dPB.filas[c].d === fmtD(pbS.deltas[c]) && dPB.filas[c].t.includes(pbS.interpretacion[c].etiqueta)) &&
      pbS.alertas.length >= 1 && dPB.marcas === pbS.alertas.length && dPB.alerta.length === 1 && pbS.alertas.every((a) => dPB.alerta[0].includes(fmtD(a.delta)) && dPB.alerta[0].includes(a.etiqueta)) && pbS.alertas.some((a) => a.escala === 'esc_1'),
      JSON.stringify({ deltas: pbS.deltas, alertas: pbS.alertas }));

    /* ---------- (i) sin consentimiento: IDEA creado y guardado, sin candados; (f) PA fuera de secuencia: aviso que no bloquea ---------- */
    const sufijo3 = String(Date.now()).slice(-6);
    const escolares = (await get('/grupos?anio=' + paDraft.anio)).json.find((g) => g.nombre === 'Escolares');
    const nuevo = await send('POST', '/hce', { persona: { nombre: 'Sinci' + sufijo3, apellido: 'Tresc', ci: '8' + sufijo3 + '1', fecha_nac: '2017-02-02' }, grupo_id: escolares.id });
    const idSinCi = nuevo.json.data.id;
    await abrir(idSinCi, 'lb');
    const ci0 = (await get(`/hce/${idSinCi}/consentimiento`)).status;
    await pc.click('#dim-D1 .opcion[data-v="4"]');
    const reqCrearLB = pc.waitForResponse((r) => r.request().method() === 'POST' && /\/hce\/\d+\/idea$/.test(r.url()));
    await pc.click('#btnEvGuardar');
    const rCrearLB = await reqCrearLB;
    await pc.waitForFunction(() => document.querySelector('#evEstado .st-en_curso'), null, { timeout: 8000 });
    const lbs = (await get(`/hce/${idSinCi}/idea`)).json;
    const bloq = await pc.evaluate(() => ({ deshab: [...document.querySelectorAll('#panelExp [data-ev]')].filter((e) => e.disabled).length, flujo: document.getElementById('tabExp-ci').textContent.replace(/\s+/g, ' '),
      avisos: document.getElementById('evAvisos').hidden ? '' : document.getElementById('evAvisos').innerText, guardar: !document.getElementById('btnEvGuardar').disabled, total: document.getElementById('evTotal').textContent.trim() }));
    check('3c-i', 'expediente SIN consentimiento: crear y guardar el IDEA anda (POST 201, queda «En curso»), sin candado ni control deshabilitado; el CI pendiente es solo un estado visible. (La API no avisa por la falta de CI ni por el IDEA: es el primer eslabón, §5.94/§5.116 e.)',
      ci0 === 404 && rCrearLB.status() === 201 && lbs.length === 1 && lbs[0].firmado === false && bloq.deshab === 0 && /⚠: pendiente/.test(bloq.flujo) && bloq.guardar && bloq.total === String(lbs[0].total) && (await sinCandado()),
      `CI→${ci0} · IDEA→${rCrearLB.status()} · avisos="${bloq.avisos.trim()}"`);
    await pc.click('#tabExp-pa'); await pc.waitForSelector('#evResumen');
    await pc.click('#pitem-1 .likert-btn[data-v="3"]');
    const reqCrearPA = pc.waitForResponse((r) => r.request().method() === 'POST' && /\/hce\/\d+\/protocolo$/.test(r.url()));
    await pc.click('#btnEvGuardar');
    const rCrearPA = await reqCrearPA, jPA = await rCrearPA.json();
    await pc.waitForFunction(() => !document.getElementById('evAvisos').hidden, null, { timeout: 8000 });
    const f1 = await pc.evaluate(() => ({ av: document.getElementById('evAvisos').innerText.replace(/\s+/g, ' '), role: document.getElementById('evAvisos').getAttribute('role'), editable: !document.getElementById('btnEvGuardar').disabled && !document.getElementById('pobs-1').disabled && !document.querySelector('#pitem-2 .likert-btn').disabled }));
    const secuencia = (jPA.warnings || []).filter((w) => w.code === 'fuera_de_secuencia');
    check('3c-f', 'PA creado con el LB sin firmar: la API acepta (201) y avisa «fuera de secuencia»; la pantalla muestra el aviso (role="status") y NO bloquea: el borrador quedó guardado y sigue editable',
      rCrearPA.status() === 201 && secuencia.length === 1 && f1.av.includes(secuencia[0].mensaje) && f1.role === 'status' && f1.editable && (await get(`/hce/${idSinCi}/protocolo`)).json.length === 1, f1.av.slice(0, 140));

    /* ---------- PB firmado antes que su PA: al firmar el PA se vuelve a leer el PB y aparece su Δ ---------- */
    const nuevo2 = await send('POST', '/hce', { persona: { nombre: 'Orden' + sufijo3, apellido: 'Tresc', ci: '9' + sufijo3 + '2', fecha_nac: '2016-03-03' }, grupo_id: escolares.id });
    const idOrden = nuevo2.json.data.id;
    const cuerpoProt = (tipo, v) => ({ tipo, anio: paDraft.anio, items: Object.fromEntries(Array.from({ length: 24 }, (_, i) => [String(i + 1), { valor: v, obs: null }])), fecha: '2026-07-01', semanas: 16,
      sint_tec1: 'a', sint_tec2: 'b', evaluador_t1_id: idGonzalez, evaluador_t2_id: idTorres });
    const pbPrimero = (await send('POST', `/hce/${idOrden}/protocolo`, cuerpoProt('B', 4))).json.data;
    const pbFirma = await send('POST', `/protocolo/${pbPrimero.id}/firmar`);
    await send('POST', `/hce/${idOrden}/protocolo`, cuerpoProt('A', 3));
    await abrir(idOrden, 'pb');
    const nota = norm(await txt(pc, '#evDeltaNota'));
    await pc.click('#tabExp-pa'); await pc.waitForSelector('#evResumen');
    const releyo = pc.waitForRequest((r) => r.method() === 'GET' && new RegExp(`/protocolo/${pbPrimero.id}$`).test(r.url()));
    await pc.click('#btnEvFirmar'); await pc.click('#btnEvConfirmar');
    await releyo;
    await pc.waitForSelector('#evEstado .st-firmado', { timeout: 8000 });
    await pc.click('#tabExp-pb'); await pc.waitForSelector('#evResultado', { timeout: 8000 });
    const pbTras = (await get(`/protocolo/${pbPrimero.id}`)).json;
    const filasT = await pc.evaluate(() => Object.fromEntries([...document.querySelectorAll('#evResultado [data-delta]')].map((tr) => [tr.dataset.delta, tr.querySelector('.res-delta').innerText.trim()])));
    check('3c-pa-pb', 'PB firmado ANTES que su PA: sin Δ («todavía no se calculó»); al firmar el PA la pantalla vuelve a leer el PB (GET /protocolo/{id}) y muestra el Δ que completó el servidor',
      pbFirma.status === 200 && pbPrimero.deltas === null && /todavía no se calculó/.test(nota) && pbTras.deltas !== null && claves.every((c) => filasT[c] === fmtD(pbTras.deltas[c])) && filasT.total === '+24', `Δ total ${filasT.total}`);

    /* ---------- confirmación de la firma, SOLO con teclado: Firmar → Enter → Confirmar → Esc cancela (sin pedido) → un único POST /firmar ---------- */
    {
      const nuevo3 = await send('POST', '/hce', { persona: { nombre: 'Tecla' + sufijo3, apellido: 'Tresc', ci: '7' + sufijo3 + '3', fecha_nac: '2015-04-04' }, grupo_id: escolares.id });
      const idTecla = nuevo3.json.data.id;
      await send('POST', `/hce/${idTecla}/protocolo`, cuerpoProt('A', 3));
      const firmas = [];
      const alPedir = (r) => { if (r.method() === 'POST' && /\/protocolo\/\d+\/firmar$/.test(r.url())) firmas.push(r.url()); };
      pc.on('request', alPedir);
      await abrir(idTecla, 'pa');
      await pc.focus('#btnEvFirmar');
      const foco = () => pc.evaluate(() => document.activeElement.id);
      await pc.keyboard.press('Enter');
      const tras1 = { foco: await foco(), desc: await pc.evaluate(() => ['btnEvConfirmar', 'btnEvCancelar'].map((i) => document.getElementById(i).getAttribute('aria-describedby'))), txt: await pc.evaluate(() => document.getElementById('evConfirmaTxt').textContent) };
      await pc.keyboard.press('Escape');
      await pc.waitForTimeout(300);
      const trasEsc = { foco: await foco(), confirma: await pc.locator('#evConfirmaTxt').count(), firmas: firmas.length };
      await pc.keyboard.press('Enter'); const foco2 = await foco();
      await pc.keyboard.press('Enter'); await pc.keyboard.press('Enter');
      await pc.waitForSelector('#evEstado .st-firmado', { timeout: 8000 });
      await pc.waitForTimeout(500);
      pc.off('request', alPedir);
      const paT = (await get(`/hce/${idTecla}/protocolo`)).json.find((x) => x.tipo === 'A');
      check('3c-tecla', 'confirmar la firma solo con teclado: Firmar → Enter lleva el foco a «Confirmar firma» (ambos botones con aria-describedby del texto), Esc cancela sin ningún pedido y devuelve el foco a «Firmar»; Enter → Enter → Enter hace exactamente UN POST …/firmar',
        tras1.foco === 'btnEvConfirmar' && tras1.desc.every((d) => d === 'evConfirmaTxt') && /Firmar/.test(tras1.txt) && trasEsc.foco === 'btnEvFirmar' && trasEsc.confirma === 0 && trasEsc.firmas === 0 && foco2 === 'btnEvConfirmar' && firmas.length === 1 && paT.firmado === true,
        JSON.stringify({ tras1, trasEsc, foco2, firmas: firmas.length }));
    }

    /* ---------- a 390 px el editor, la lectura y la tabla del Δ no desbordan ---------- */
    await pc.setViewportSize({ width: 390, height: 800 });
    const anch = [];
    for (const [id, tab, sel] of [[idSinCi, 'lb', '#evResumen'], [idSinCi, 'pa', '#evResumen'], [idSofia, 'pb', '#evResultado'], [idMartin3, 'lb', '#evBanda']]) {
      await abrir(id, tab);
      await pc.waitForSelector(sel, { timeout: 8000 });
      anch.push(await pc.evaluate(([t]) => [t, document.documentElement.scrollWidth, window.innerWidth], [tab]));
    }
    await pc.setViewportSize({ width: 1280, height: 720 });
    check('3c-w3', 'a 390 px el editor de LB y de PA, el PB con la tabla del Δ y el LB firmado no desbordan horizontalmente',
      anch.every((a) => a[1] === a[2]), anch.map((a) => `${a[0]} ${a[1]}/${a[2]}`).join(' · '));

    /* ---------- (j) arrastre de la 3-b ---------- */
    const { spawnSync } = require('child_process');
    const env = { ...process.env }; delete env.CONFIRMA_BASE_DESCARTABLE; env.API = 'http://127.0.0.1:9';   // aunque la API no exista: la guarda va antes
    const hijo = spawnSync(process.execPath, [__filename], { env, encoding: 'utf8', timeout: 20000 });
    check('3c-j1', 'sin CONFIRMA_BASE_DESCARTABLE=1 el script aborta con exit 1 ANTES de pedir nada (se probó con una API inexistente: el mensaje es el de la guarda, no «No responde la API»)',
      hijo.status === 1 && /CONFIRMA_BASE_DESCARTABLE=1/.test(hijo.stderr) && !/No responde/.test(hijo.stderr), `exit=${hijo.status} · ${(hijo.stderr || '').split('\n')[0]}`);
    await cc.close();
  }

  /* ---------- (j) arrastre de la revisión de la 3-b: diálogo, selector de grupos, 403, avisos, demo sin candados, marca, cédula ---------- */
  {
    const { ctx: cj, page: pj } = await nuevaPagina();
    await loguearComo(pj, EMAIL, PASSWORD);
    const tokenJ = await pj.evaluate(() => sessionStorage.getItem('ippu.token'));
    const yoJ = await (await fetch(API + '/auth/yo', { headers: { Authorization: 'Bearer ' + tokenJ } })).json();
    const getJ = async (ruta) => { const r = await fetch(API + ruta, { headers: { Authorization: 'Bearer ' + tokenJ } }); return { status: r.status, json: await r.json() }; };
    const gruposApi = (await getJ('/grupos?anio=2026')).json;
    const propios = gruposApi.filter((g) => (g.tecnico1 && g.tecnico1.id === yoJ.id) || (g.tecnico2 && g.tecnico2.id === yoJ.id)).map((g) => g.nombre).sort();
    const ajenos = gruposApi.filter((g) => !propios.includes(g.nombre));
    const campos = ['f_nombre', 'f_ci', 'f_ref', 'f_tel', 'f_motivo'];
    const estadoDialogo = () => pj.evaluate((cs) => ({ vacios: cs.every((c) => document.getElementById(c).value === ''), orig: WIZ.orig, grupos: WIZ.grupos.length, login: !document.getElementById('loginScreen').classList.contains('hidden'),
      abierto: document.getElementById('modalAlta').classList.contains('open') }), campos);
    const idMartinJ = (await getJ('/hce?nombre=Mart%C3%ADn&limit=5')).json[0].id;
    const abrirEdicion = async () => {
      await pj.evaluate((id) => abrirExpediente(id), idMartinJ);
      await pj.waitForSelector('#expTitulo');
      await pj.click('#expHead >> text=✎ Editar datos');
      await pj.waitForSelector('#modalAlta.open');
    };

    /* «Salir» con el diálogo de edición abierto (la app está inerte tras el diálogo: se invoca logout() como lo hace el botón).
       Antes se abre y se cierra el diálogo de severidad de Martín: su subtítulo (#mfSub) y su justificación (#sev_just) quedan en el
       diálogo cerrado, y el título del de edición (#modalTitle) nombra a Martín; tras «Salir», los tres vacíos (B2, §5.157). */
    await pj.evaluate((id) => abrirExpediente(id), idMartinJ);
    await pj.waitForSelector('#expTitulo'); await pj.waitForFunction(() => !!EXP.flujo, null, { timeout: 8000 });
    await pj.click('#tabExp-sev');
    await pj.waitForSelector('#btnSevEditar', { timeout: 8000 });
    await pj.click('#btnSevEditar'); await pj.waitForSelector('#modalFlujo.open #sev_just');
    const sevAntes = await pj.evaluate(() => ({ sub: document.getElementById('mfSub').textContent, just: document.getElementById('sev_just').value }));
    await pj.keyboard.press('Escape'); await pj.waitForFunction(() => !document.getElementById('modalFlujo').classList.contains('open'), null, { timeout: 3000 });
    await abrirEdicion();
    const antes = await pj.evaluate((cs) => cs.map((c) => document.getElementById(c).value), campos);
    const tituloAntes = await pj.evaluate(() => document.getElementById('modalTitle').textContent);
    await pj.evaluate(() => logout());
    const e1 = await estadoDialogo();
    const titulos = await pj.evaluate(() => { const j = document.getElementById('sev_just'); return { titulo: document.getElementById('modalTitle').textContent, sub: document.getElementById('mfSub').textContent, just: j ? j.value + j.textContent : '' }; });
    check('3c-j2', 'con el diálogo de edición abierto, «Salir» deja f_nombre, f_ci, f_ref, f_tel y f_motivo vacíos, WIZ.orig null y sin grupos en memoria (antes tenían datos de Martín); también vacíos el título del diálogo de edición (#modalTitle), el subtítulo del diálogo compartido (#mfSub) y la justificación de severidad (#sev_just), que antes nombraban a Martín o tenían su texto (B2, §5.157)',
      antes[0] !== '' && antes[1] !== '' && e1.vacios && e1.orig === null && e1.grupos === 0 && e1.login && !e1.abierto
        && /Martín/.test(tituloAntes) && sevAntes.sub !== '' && sevAntes.just !== '' && titulos.titulo === '' && titulos.sub === '' && titulos.just === '',
      `antes=[${antes.slice(0, 2)}…] después vacíos=${e1.vacios} · ${JSON.stringify({ tituloAntes, sevAntes: { sub: sevAntes.sub.slice(0, 40), just: sevAntes.just.length }, titulos })}`);
    /* un 401 con el diálogo abierto */
    await pj.fill('#loginUser', EMAIL); await pj.fill('#loginPass', PASSWORD);
    await pj.click('#loginBtn');
    await pj.waitForSelector('#loginScreen.hidden', { state: 'attached', timeout: 8000 });
    await esperarResumen(pj, 'Mostrando');
    await pj.route(/\/grupos(\?.*)?$/, (route) => route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ code: 'unauthorized', detail: [{ campo: null, mensaje: 'Token vencido' }] }) }));
    await pj.evaluate((id) => abrirExpediente(id), idMartinJ);
    await pj.waitForSelector('#expTitulo');
    await pj.click('#expHead >> text=✎ Editar datos');       // abre el diálogo, precarga a Martín y pide GET /grupos → 401
    await pj.waitForSelector('#loginScreen:not(.hidden)', { timeout: 8000 });
    const e2 = await estadoDialogo();
    await pj.unroute(/\/grupos(\?.*)?$/);
    check('3c-j3', 'con el diálogo de edición abierto, un 401 de la API vuelve al login y deja los mismos campos vacíos, WIZ.orig null y sin grupos',
      e2.vacios && e2.orig === null && e2.grupos === 0 && e2.login && !e2.abierto, JSON.stringify(e2));

    /* selector de grupo del técnico: solo los suyos, sin «Sin grupo asignado» */
    await loguearComo(pj, EMAIL, PASSWORD);
    await abrirAlta(pj);
    const sel = await pj.evaluate(() => ({ opciones: [...document.querySelectorAll('#f_grupo option')].map((o) => o.textContent.trim()), valor: document.getElementById('f_grupo').value }));
    check('3c-j4', 'el técnico ve solo los grupos donde es técnico 1 o 2 (los que devuelve GET /grupos con su id), sin «Sin grupo asignado» y con «Elegí un grupo» como único vacío',
      propios.length >= 1 && ajenos.length >= 1 && JSON.stringify(sel.opciones.slice(1).sort()) === JSON.stringify(propios) && sel.opciones[0] === 'Elegí un grupo' && !sel.opciones.includes('Sin grupo asignado') &&
      ajenos.every((g) => !sel.opciones.includes(g.nombre)) && sel.valor === '', `ofrece: ${sel.opciones.join(' | ')} · ajenos: ${ajenos.map((g) => g.nombre).join(', ')}`);
    const uno = await pj.evaluate((uid) => {
      WIZ.grupos = [{ id: 901, nombre: 'Solo mío', anio: 2026, tecnico1: { id: uid, nombre: 'x' }, tecnico2: null }, { id: 902, nombre: 'Ajeno', anio: 2026, tecnico1: { id: uid + 1000, nombre: 'y' }, tecnico2: null }];
      document.getElementById('f_grupo').value = ''; _wizRellenarGrupos();
      return { valor: document.getElementById('f_grupo').value, opciones: [...document.querySelectorAll('#f_grupo option')].map((o) => o.textContent.trim()) };
    }, yoJ.id);
    check('3c-j5', 'con un único grupo propio el selector lo deja preseleccionado', uno.valor === '901' && !uno.opciones.includes('Ajeno'), JSON.stringify(uno));

    /* 403: alta en un grupo ajeno (se simula la opción, que la UI ya no ofrece) → la API lo rechaza y se muestra */
    const sufj = String(Date.now()).slice(-6);
    await escDescartando(pj);
    await abrirAlta(pj);
    await llenarPaso1(pj, { nombre: 'Ajeno' + sufj, apellido: 'Cuatrocientos', ci: '5' + sufj + '3' });
    await siguiente(pj, 1);
    await pj.evaluate((g) => { const o = document.createElement('option'); o.value = String(g.id); o.textContent = g.nombre + ' (simulado)'; document.getElementById('f_grupo').appendChild(o); document.getElementById('f_grupo').value = String(g.id); wizGrupoCambio(); }, ajenos[0]);
    await siguiente(pj, 2);
    const resp403 = pj.waitForResponse((r) => r.request().method() === 'POST' && /\/hce$/.test(r.url()));
    await pj.click('#btnCreate');
    const r403 = await resp403, j403 = await r403.json();
    await pj.waitForFunction(() => !document.getElementById('altaErrores').hidden, null, { timeout: 8000 });
    const t403 = await pj.evaluate(() => ({ txt: document.getElementById('altaErrores').innerText.replace(/\s+/g, ' '), rol: document.getElementById('altaErrores').getAttribute('role'), foco: document.activeElement.id, abierto: document.getElementById('modalAlta').classList.contains('open') }));
    const creada = (await getJ('/hce?nombre=Ajeno' + sufj)).json;
    check('3c-j6', 'técnico, alta en un grupo ajeno: la API contesta 403 y la pantalla muestra SU mensaje (resumen role="alert" con foco, diálogo abierto, nada creado)',
      r403.status() === 403 && t403.txt.includes(j403.detail[0].mensaje) && t403.rol === 'alert' && t403.foco === 'altaErrores' && t403.abierto && creada.length === 0, `403 · «${j403.detail[0].mensaje}»`);
    await escDescartando(pj);

    /* una escritura que devuelve avisos: se muestran y no bloquean (se agrega un aviso a la respuesta real del PATCH) */
    await pj.route(new RegExp(`/hce/${idMartinJ}$`), async (route) => {
      if (route.request().method() !== 'PATCH') return route.continue();
      const r = await route.fetch(); const j = await r.json(); j.warnings = [{ code: 'prueba', mensaje: 'Aviso de prueba de la API: se guardó igual.' }];
      return route.fulfill({ response: r, json: j });
    });
    await abrirEdicion();
    await pj.click('#btnNext'); await pj.fill('#f_med', 'Medicación de prueba 3c ' + sufj);
    await siguiente(pj, 2);
    await pj.click('#btnCreate');
    await pj.waitForFunction(() => !document.getElementById('modalAlta').classList.contains('open'), null, { timeout: 8000 });
    await pj.unroute(new RegExp(`/hce/${idMartinJ}$`));
    const av = await pj.evaluate(() => ({ txt: document.getElementById('expAvisos').innerText.replace(/\s+/g, ' '), rol: (document.querySelector('#expAvisos .avisos-api') || {}).getAttribute ? document.querySelector('#expAvisos .avisos-api').getAttribute('role') : null, panel: document.getElementById('panelExp').innerText }));
    check('3c-j7', 'una escritura que devuelve warnings (HCE-00): se guarda, el diálogo se cierra y los avisos se muestran (role="status") sin bloquear',
      /Aviso de prueba de la API/.test(av.txt) && av.rol === 'status' && av.panel.includes('Medicación de prueba 3c ' + sufj) && (await getJ(`/hce/${idMartinJ}`)).json.medicacion === 'Medicación de prueba 3c ' + sufj, av.txt.slice(0, 100));

    /* cédula: se compara el texto tal cual (la canónica es de la API) */
    await abrirEdicion();
    await pj.waitForFunction(() => !document.getElementById('f_grupo').disabled && document.querySelectorAll('#f_grupo option').length > 1, null, { timeout: 8000 });
    const cam1 = await pj.evaluate(() => ({ inicial: WIZ.inicial && WIZ.inicial.ci, campo: document.getElementById('f_ci').value, lista: wizCambios().lista.length, fuente: wizCambios.toString() }));
    await pj.fill('#f_ci', '60123451');
    const cam2 = await pj.evaluate(() => { const c = wizCambios(); return { ci: c.body.persona && c.body.persona.ci, n: c.lista.length }; });
    check('3c-j8', 'wizCambios compara la cédula por valor bruto contra lo que se mostró: sin tocar no hay cambios; reescrita con otro formato se manda tal cual («60123451») y la canonicalización queda en la API (sin regex de limpieza en el navegador)',
      cam1.inicial === cam1.campo && cam1.lista === 0 && cam2.ci === '60123451' && cam2.n === 1 && !/replace\(/.test(cam1.fuente), JSON.stringify({ cam1: { ...cam1, fuente: undefined }, cam2 }));
    await escDescartando(pj);

    /* demo de ejemplo: ni candados, ni «Bloqueado», ni modal de excepción — ni siquiera con el CI pendiente (Bruno, 107).
       Se lee el TEXTO COMPLETO de los ocho expedientes de ejemplo (101–108: stepper, HCE-DOC, fotos, todo lo que arma
       abrirExpedienteDemo) (el IC ya no es una vista de ejemplo, 3-d). El único 🔒 permitido es el del DOCUMENTO HISTÓRICO
       (HCE anterior, firmado e inmutable: «solo lectura»), que no es un bloqueo de secuencia: se lo quita fila por fila
       —sólo en las filas con `.doc-hist`— antes de buscar, y se exige que haya al menos uno para probar que la exclusión se ejerce. */
    const demo = await pj.evaluate(() => {
      const PROHIBIDO = /habilitaci[oó]n excepcional|bloquead|🔒|excepci[oó]n|habilitar/i;
      const sinHistoricos = (raiz) => {
        const c = raiz.cloneNode(true); let n = 0;
        c.querySelectorAll('tr').forEach((tr) => { if (tr.querySelector('.doc-hist')) { const td = tr.querySelector('td'); td.textContent = td.textContent.replace('🔒 ', ''); n++; } });
        return { texto: c.textContent, historicos: n };
      };
      const salida = {}; let historicos = 0;
      for (let id = 101; id <= 108; id++) {
        abrirExpedienteDemo(id);
        const f = document.getElementById('flujoPanelBody'), e = sinHistoricos(document.getElementById('view-expediente'));
        historicos += e.historicos;
        salida[id] = { bloqueados: document.querySelectorAll('.fstep.s-bloqueado').length, flujo: PROHIBIDO.test(f.innerText),
          expediente: (e.texto.match(PROHIBIDO) || [null])[0] };
      }
      go('grupos'); salida.grupos = (document.getElementById('view-grupos').innerText.match(PROHIBIDO) || [null])[0];
      return { salida, historicos, funciones: [typeof openExcepcionModal, typeof habilitarExcepcional, typeof confirmarExcepcion], modal: !!document.getElementById('mfMotivo') };
    });
    check('3c-j9', 'el texto completo de los expedientes de EJEMPLO 101–108 (también Bruno, sin CI), su HCE-DOC, y la vista Grupos no dicen «habilitación excepcional», «Bloqueado»/«bloqueada» ni llevan candado (salvo el 🔒 del documento histórico, excluido); el modal y las funciones de excepción ya no existen',
      Object.entries(demo.salida).filter(([k]) => k !== 'grupos').every(([, v]) => !v.flujo && v.bloqueados === 0 && v.expediente === null) && demo.salida.grupos === null
        && demo.historicos > 0 && demo.funciones.every((t) => t === 'undefined') && !demo.modal, JSON.stringify({ historicos: demo.historicos, funciones: demo.funciones, salida: demo.salida }).slice(0, 600));

    /* §5.99: guardar una foto no requiere autorización y no produce aviso ni bloqueo, ni individual ni grupal (demo de ejemplo) */
    const fotos = await pj.evaluate(() => {
      const sin = NNA.find((n) => !(n.autImagen && n.autImagen.registrada)) || null;
      if (!sin) return { sin: null };
      abrirExpedienteDemo(sin.id);
      const antes = sin.fotos.length, tostAntes = document.getElementById('toast') ? document.getElementById('toast').textContent : '';
      document.getElementById('foto_desc').value = 'foto de prueba 3c';
      subirFoto(sin.id);
      const tost = document.querySelector('.toast, #toast');
      return { sin: sin.id, individual: sin.fotos.length - antes, toast: tost ? tost.textContent : '' };
    });
    check('3c-j9b', 'en el expediente de EJEMPLO sin autorización de imagen se guarda una foto individual: sin bloqueo ni «bloqueada» (§5.99). La carga de fotos GRUPALES salió de la vista Grupos en F2 (la API no las tiene; vuelven con el registro fotográfico, C5)',
      fotos.sin !== null && fotos.individual === 1 && !/bloquead|🚫/i.test(fotos.toast), JSON.stringify(fotos));

    /* F1: la marca «Demo parcialmente conectada» se retiró; el pie «Prototipo · …» de la barra lateral no tapa contenido a 1280×800 y 1280×900 */
    const marcas = [];
    for (const alto of [800, 900]) {
      await pj.setViewportSize({ width: 1280, height: alto });
      for (const vista of ['inicio', 'expediente']) {
        await pj.evaluate((v) => { if (v === 'inicio') go('inicio'); else abrirExpediente(+document.querySelector('#tbodyNNA tr[data-hce]')?.dataset.hce || 1); }, vista);
        await pj.waitForTimeout(vista === 'expediente' ? 700 : 100);
        marcas.push(await pj.evaluate(([v, a]) => {
          const pie = document.querySelector('.sidebar .foot'), t = pie.getBoundingClientRect();
          const visibles = [...document.querySelectorAll('main table, main .info-card, main .card, main h1, main .banda-nna')].filter((e) => e.offsetParent !== null);
          const choca = visibles.filter((e) => { const r = e.getBoundingClientRect(); return !(t.right <= r.left || t.left >= r.right || t.bottom <= r.top || t.top >= r.bottom); });
          return { v, a, choca: choca.length, marca: !!document.querySelector('.demo-tag'), texto: pie.textContent.trim(), pos: getComputedStyle(pie).position, visible: t.width > 0 };
        }, [vista, alto]));
      }
    }
    await pj.setViewportSize({ width: 1280, height: 720 });
    check('3c-j10', 'la marca «Demo parcialmente conectada a la API» ya no existe (F1) y el pie «Prototipo · IPPU × UTEC-LIDIA · 2026» (en flujo dentro de la barra lateral) no toca ninguna tabla ni tarjeta del contenido a 1280×800 y 1280×900, en el listado y en un expediente',
      marcas.every((m) => m.choca === 0 && !m.marca && m.texto === 'Prototipo · IPPU × UTEC-LIDIA · 2026' && m.pos !== 'fixed' && m.visible), JSON.stringify(marcas.map((m) => `${m.v}@${m.a}:${m.choca}`)));
    await cj.close();
  }

  /* admin: el selector ofrece todos los grupos y «Sin grupo asignado» */
  {
    const { ctx: ca, page: pa } = await nuevaPagina();
    await loguearComo(pa, ADMIN_EMAIL, ADMIN_PASSWORD);
    const tkA = await pa.evaluate(() => sessionStorage.getItem('ippu.token'));
    const todos = (await (await fetch(API + '/grupos?anio=2026', { headers: { Authorization: 'Bearer ' + tkA } })).json()).map((g) => g.nombre).sort();
    await abrirAlta(pa);
    const opA = await pa.evaluate(() => [...document.querySelectorAll('#f_grupo option')].map((o) => o.textContent.trim()));
    check('3c-j11', 'el admin ve TODOS los grupos del año y «Sin grupo asignado»', opA[0] === 'Sin grupo asignado' && JSON.stringify(opA.slice(1).sort()) === JSON.stringify(todos) && todos.length === 5, opA.join(' | '));
    await ca.close();
  }

  /* =====================================================================================================
     FASE 3-d · IC con documento impreso y recibí, y VF (handoff §5.126). También ESCRIBE: crea y firma el IC de
     Valentina y de Camila, registra el recibí, agrega una addenda y crea la VF de Martín y de Sofía.
     ===================================================================================================== */
  {
    const fs = require('fs');
    const path = require('path');
    const { execFileSync } = require('child_process');
    const { ctx: cd, page: pd } = await nuevaPagina();
    await loguearComo(pd, EMAIL, PASSWORD);
    const tkD = await pd.evaluate(() => sessionStorage.getItem('ippu.token'));
    const send = async (metodo, ruta, body) => {
      const r = await fetch(API + ruta, { method: metodo, headers: { Authorization: 'Bearer ' + tkD, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
      return { status: r.status, json: r.status === 204 ? null : await r.json() };
    };
    const get = (ruta) => send('GET', ruta);
    const idDe = async (nombre) => (await get('/hce?nombre=' + encodeURIComponent(nombre) + '&limit=20')).json.find((h) => h.persona.nombre === nombre).id;
    const norm = (t) => String(t).replace(/\s+/g, ' ').trim();
    const fmtD = (d) => (d > 0 ? '+' : '') + d;
    const abrirD = async (id, tab) => {
      await pd.evaluate((i) => abrirExpediente(i), id);
      await pd.waitForSelector('#expTitulo');
      await pd.waitForFunction(() => !!EXP.flujo && !!EXP.mods, null, { timeout: 8000 });
      if (tab) {
        await pd.click('#tabExp-' + tab);
        await pd.waitForFunction(() => { const p = document.getElementById('panelExp'); return p && !/Cargando/.test(p.innerText); }, null, { timeout: 8000 });
      }
    };
    const verImpreso = async () => {
      await pd.click('#btnIcImpreso');
      await pd.waitForFunction(() => { const c = document.getElementById('informeContent'); return document.getElementById('view-informe').classList.contains('active') && c && !/Cargando el/.test(c.innerText) && c.innerText.trim() !== ''; }, null, { timeout: 8000 });
    };
    const volverDelImpreso = async () => { await pd.click('#informeContent .inf-banner button:has-text("Volver al expediente")'); await pd.waitForFunction(() => document.getElementById('view-expediente').classList.contains('active')); };
    const profs = (await get('/profesionales')).json;
    const idGonzalez = profs.find((x) => x.nombre === 'Dr. González').id, idTorres = profs.find((x) => x.nombre === 'Mtra. Torres').id;
    const idMartinD = await idDe('Martín');
    const icMartin = (await get(`/hce/${idMartinD}/informe-cierre`)).json[0];
    const docApi = (await get(`/informe-cierre/${icMartin.id}/documento`)).json;

    /* ---------- 3d-lay: sin vistas, selectores ni manejadores muertos; nada de lo retirado queda ---------- */
    const lay = await pd.evaluate(() => {
      const retiradas = ['cargarIC', 'guardarIC', 'firmarIC', 'generarInforme', 'irAEval', 'categoriaBaremo', 'sugiereNivel', 'genVFBorrador', 'vfAlertaVigencia',
        'generarReporteVF', 'icDatosFirmados', 'renderVf', 'vfSet'];
      return {
        viewIc: !!document.getElementById('view-ic'), selector: !!document.getElementById('selNNAIC'),
        vistasMuertas: [...document.querySelectorAll('.navitem')].map((b) => b.dataset.view).filter((v) => !document.getElementById('view-' + v)),
        funciones: retiradas.filter((n) => typeof window[n] !== 'undefined'),
        bundcats: typeof BUND_CATS
      };
    });
    check('3d-lay', 'view-ic y el selector de NNA del IC ya no existen; ninguna entrada de la barra lateral apunta a una vista retirada; las funciones del IC y de la VF de ejemplo (cargarIC, generarInforme, categoriaBaremo, sugiereNivel, genVFBorrador, vfAlertaVigencia, irAEval…) están retiradas',
      !lay.viewIc && !lay.selector && lay.vistasMuertas.length === 0 && lay.funciones.length === 0, JSON.stringify(lay));

    /* manejadores muertos: todo onclick/onchange/oninput de las pantallas recorridas llama a funciones que existen */
    const muertos = await pd.evaluate(async (idM) => {
      const falta = new Set();
      const barrer = () => document.querySelectorAll('[onclick],[onchange],[oninput],[onkeydown]').forEach((el) => {
        ['onclick', 'onchange', 'oninput', 'onkeydown'].forEach((a) => {
          const v = el.getAttribute(a); if (!v) return;
          (v.match(/(?<![.\w$])[A-Za-z_$][\w$]*(?=\()/g) || []).forEach((fn) => { if (!['if', 'return', 'parseInt', 'confirm', 'alert'].includes(fn) && typeof window[fn] !== 'function') falta.add(fn + ' ← ' + a + ' en <' + el.tagName.toLowerCase() + '>'); });
        });
      });
      for (let id = 101; id <= 108; id++) { abrirExpedienteDemo(id); barrer(); }
      await abrirExpediente(idM);
      await new Promise((r) => setTimeout(r, 600));
      for (const k of TABS_EXP.map((t) => t.k)) { selTabExp(k); await new Promise((r) => setTimeout(r, 250)); barrer(); }
      go('inicio'); barrer();
      return [...falta];
    }, idMartinD);
    check('3d-lay2', 'ningún manejador (onclick/onchange/oninput) de los expedientes de ejemplo 101–108, ni de las 13 pestañas del expediente de la API, llama a una función que no existe',
      muertos.length === 0, muertos.join(' | ') || '8 ejemplos + 13 pestañas');

    /* ---------- (a) IC de Martín: documento impreso == GET …/documento ---------- */
    await abrirD(idMartinD, 'ic');
    const edTabla = await pd.evaluate(() => [...document.querySelectorAll('#panelExp .ic-tabla tbody tr')].map((tr) => [...tr.children].map((c) => c.innerText.replace(/\s+/g, ' ').trim())));
    await verImpreso();
    const reqDoc = [];
    const imp = await pd.evaluate(() => {
      const t = [...document.querySelectorAll('#informeContent .ic-tabla tbody tr')].map((tr) => [...tr.children].map((c) => c.innerText.replace(/\s+/g, ' ').trim()));
      const c = document.getElementById('informeContent');
      return { tabla: t, texto: c.innerText.replace(/\s+/g, ' '), alertas: c.querySelectorAll('.ev-alerta').length, hojaHead: !!c.querySelector('.print-head .ph'),
        radares: c.querySelectorAll('.ic-radars svg[role="img"]').length, firmas: [...c.querySelectorAll('.firmas-grid .fnom')].map((e) => e.innerText.trim()),
        datos: [...c.querySelectorAll('.doc-datos .data-row')].map((r) => [r.querySelector('dt').innerText.trim(), r.querySelector('dd').innerText.trim()]) };
    });
    const idea = docApi.idea, pa = docApi.protocolos.a, pb = docApi.protocolos.b, dl = docApi.protocolos.deltas;
    const esperaFilas = [0, 1, 2, 3].map((i) => [`${idea[['esc_a', 'esc_b', 'esc_c', 'esc_d'][i]]} / 24`, `${pa['esc_' + (i + 1)]} / 30`, `${pb['esc_' + (i + 1)]} / 30`, fmtD(dl['esc_' + (i + 1)])]);
    const filasOk = esperaFilas.every((e, i) => imp.tabla[i] && e.every((v, j) => imp.tabla[i][j + 1] === v));
    const tot = imp.tabla[4] || [];
    check('3d-a1', 'IC de Martín impreso: IDEA 58 · PA 60 · PB 79 · Δ +19 y, por escala, Δ 4/6/4/5 — iguales a una llamada directa a GET /informe-cierre/{id}/documento',
      idea.total === 58 && pa.total === 60 && pb.total === 79 && dl.total === 19 && JSON.stringify([1, 2, 3, 4].map((i) => dl['esc_' + i])) === '[4,6,4,5]'
        && filasOk && tot[1] === '58 / 96' && tot[2] === '60 / 120' && tot[3] === '79 / 120' && tot[4].startsWith('+19') && tot[4].includes(docApi.protocolos.interpretacion.total.etiqueta),
      JSON.stringify({ filas: imp.tabla.map((f) => f.slice(1).join(' | ')) }));
    check('3d-a2', 'sin alerta institucional (el documento coincide con alertas:[]), 2 radares con texto alternativo, y el editor de la pestaña IC muestra la MISMA tabla que el impreso',
      docApi.protocolos.alertas.length === 0 && imp.alertas === 0 && !/Alerta institucional/.test(imp.texto) && imp.radares === 2 && JSON.stringify(edTabla) === JSON.stringify(imp.tabla),
      `alertas API=${docApi.protocolos.alertas.length} DOM=${imp.alertas} radares=${imp.radares}`);
    const hceM = (await get(`/hce/${idMartinD}`)).json;
    const firmasApi = docApi.informe.firmas.map((f) => `${f.nombre} · ${f.rol}`);
    const dato = (k) => (imp.datos.find((d) => d[0] === k) || [])[1];
    check('3d-a3', 'cédula y CIE-11 salen de GET /hce/{id}; el año, de documento.anio; las dos firmas son las de informe.firmas[] (nombre · rol tal como los devuelve la API) y el recibí figura con su firmante; sin fila «Soporte»',
      dato('N.º de HC / C.I.') === `${docApi.expediente.hc_numero} · 6.012.345-1` && hceM.persona.ci === '60123451' && dato('CIE-11') === hceM.cie11 && hceM.cie11 === '6A02.1'
        && imp.texto.includes(`Año lectivo ${docApi.anio}`) && dato('Profesional firmante 1') === firmasApi[0] && dato('Profesional firmante 2') === firmasApi[1]
        && imp.firmas[0] === firmasApi[0] && imp.firmas[1] === firmasApi[1] && imp.firmas[2].includes(docApi.informe.recibi.firmante) && !/Soporte|Nivel de soporte/i.test(imp.texto) && !/Técnico\/a responsable/.test(imp.texto),
      JSON.stringify({ datos: imp.datos, firmas: imp.firmas }).slice(0, 400));

    /* ---------- (b) page.pdf() en A4: páginas, encabezado en cada hoja y ninguna tabla/radar/firma partida ---------- */
    const salidas = path.join(__dirname, 'salidas');
    fs.mkdirSync(salidas, { recursive: true });
    const pdfPath = path.join(salidas, 'ic-martin.pdf');
    const py = `
import sys, json
from pypdf import PdfReader
r = PdfReader(sys.argv[1])
print(json.dumps({"paginas": len(r.pages), "tam": [[round(float(p.mediabox.width),1), round(float(p.mediabox.height),1)] for p in r.pages], "textos": [p.extract_text() for p in r.pages]}))
`;
    const leerPdf = (ruta) => JSON.parse(execFileSync('python', ['-I', '-c', py, ruta], { encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' }, maxBuffer: 1 << 26 }));
    const bloques = {
      tabla: ['18 / 24', '58 / 96', '60 / 120', '79 / 120', '+19'],
      radares: ['perfil idea', 'progreso ippu-tea', 'protocolo b (continuo)'],     // los dos títulos y la leyenda del gráfico (el SVG es un elemento atómico: va con su título)
      firmas: ['profesional 1', 'recibí de la familia', 'documento generado desde la hce'],   // las firmas y el pie legal: el pie nunca queda solo en una hoja
      membrete: ['fundación ippu', 'profesional firmante 2']
    };
    const compacto = (t) => String(t).replace(/\s+/g, '').toLowerCase();       // pypdf separa letras por el interletrado: se compara sin espacios
    const paginaDe = (textos, s) => textos.findIndex((t) => compacto(t).includes(compacto(s)));

    /* (1) Maquetación de impresión: en media print, a los tres anchos efectivos de la hoja (688 px a escala 1; 550 a 1,25×; 459 a 1,5×)
       el documento mide EXACTAMENTE el ancho de la ventana: ninguna tabla, firma ni encabezado tiene un ancho mínimo mayor que la hoja
       (el bug era un @media(max-width:760px) de pantalla que dejaba la tabla en `display:block; white-space:nowrap`). */
    const VIEWPORT_BASE = pd.viewportSize();
    await pd.emulateMedia({ media: 'print' });
    const anchosPrint = [];
    for (const w of [688, 550, 459]) {
      await pd.setViewportSize({ width: w, height: 1000 });
      anchosPrint.push(await pd.evaluate((vw) => {
        const pw = document.querySelector('#informeContent .print-wrap');
        const tabla = document.querySelector('#informeContent .ic-tabla');
        const firmas = document.querySelector('#informeContent .firmas-grid');
        const fuera = [...document.querySelectorAll('#informeContent *')].filter((e) => e.getBoundingClientRect().right > vw + 1).length;
        return { vw, scrollWidth: pw.scrollWidth, tablaDisplay: getComputedStyle(tabla).display, tablaNowrap: getComputedStyle(tabla.querySelector('th')).whiteSpace,
          firmasCols: getComputedStyle(firmas).gridTemplateColumns.split(' ').length, fuera };
      }, w));
    }
    check('3d-b0', 'media print a 688 / 550 / 459 px (la hoja A4 a escala 1 / 1,25 / 1,5): .print-wrap mide exactamente el ancho de la ventana, la tabla sigue siendo tabla (sin nowrap), las firmas en 3 columnas y ningún elemento sobresale a la derecha',
      anchosPrint.every((a) => a.scrollWidth === a.vw && a.tablaDisplay === 'table' && a.tablaNowrap === 'normal' && a.firmasCols === 3 && a.fuera === 0), JSON.stringify(anchosPrint));
    await pd.setViewportSize(VIEWPORT_BASE);
    await pd.emulateMedia({ media: null });

    /* (2) page.pdf() A4 a escala de Playwright 1, 1,25 y 1,5 (no CSS zoom): los cortes de hoja caen en lugares distintos, así que «nada
       partido» no es casualidad de un solo diseño. Encabezado en cada hoja; tabla, cada radar, firmas y membrete en UNA hoja. El margen derecho
       lo cubre 3d-b0 (media print: scrollWidth == ancho de la hoja); medirlo desde el PDF con pypdf daba un `maxx` erróneo a escala 1. */
    const resultadosPdf = [];
    for (const escala of [1, 1.25, 1.5]) {
      const ruta = escala === 1 ? pdfPath : path.join(salidas, `ic-martin-escala${String(escala).replace('.', '_')}.pdf`);
      await pd.pdf({ path: ruta, format: 'A4', printBackground: true, scale: escala });
      const info = leerPdf(ruta);
      const partidos = [];
      for (const [nombre, marcas] of Object.entries(bloques)) {
        const paginas = marcas.map((m) => paginaDe(info.textos, m));
        if (paginas.some((p) => p < 0) || new Set(paginas).size !== 1) partidos.push(`${nombre}:${paginas.join(',')}`);
      }
      const radares = ['perfil idea', 'protocolo b (continuo)'].map((m) => paginaDe(info.textos, m));     // cada radar con su título, en una hoja
      const pieSolo = info.textos.some((t) => compacto(t).includes('documentogeneradodesdelahce') && !compacto(t).includes('recibídelafamilia'));
      const cab = info.textos.every((t) => ['informedecierreanual2026', 'martíng.', 'n.ºdehc1002'].every((m) => compacto(t).includes(m)));
      const a4 = info.tam.every(([w, h]) => Math.abs(w - 595.3) < 1.5 && Math.abs(h - 841.9) < 1.5);
      const tablaHoja = paginaDe(info.textos, '18 / 24');                            // hoja (desde 0) donde cae la tabla cuantitativa
      resultadosPdf.push({ escala, paginas: info.paginas, partidos, radares, pieSolo, cab, a4, tablaHoja });
    }
    const base = resultadosPdf[0];
    check('3d-b1', `page.pdf() A4 del IC impreso de Martín guardado en demo/verificacion/salidas/ic-martin.pdf (${fs.statSync(pdfPath).size} bytes): ${base.paginas} hoja(s) A4, con el encabezado del expediente (nombre, N.º de HC, año) en CADA hoja`,
      fs.existsSync(pdfPath) && base.paginas >= 1 && base.a4 && base.cab, JSON.stringify(base));
    check('3d-b2', 'page.pdf() con escala de Playwright 1 / 1,25 / 1,5: encabezado repetido en cada hoja; la tabla, cada radar con su título, el bloque de firmas con el pie legal y el membrete caen en UNA sola hoja; el pie legal nunca solo (el desborde a la derecha lo cubre 3d-b0). Páginas por escala: ' + resultadosPdf.map((r) => `${r.escala}→${r.paginas}`).join(' · '),
      resultadosPdf.every((r) => r.partidos.length === 0 && r.cab && r.a4 && !r.pieSolo && r.radares.every((p) => p >= 0)) && resultadosPdf.some((r) => r.paginas > 1), JSON.stringify(resultadosPdf));
    check('3e-hoja1', '3-e: a escala 1 (A4 de verdad) la tabla cuantitativa del IC empieza en la HOJA 1 (a 1,25 y 1,5 puede caer en la 2: aceptado). Hoja de la tabla por escala: ' + resultadosPdf.map((r) => `${r.escala}→${r.tablaHoja + 1}`).join(' · '),
      resultadosPdf[0].escala === 1 && resultadosPdf[0].tablaHoja === 0 && resultadosPdf.every((r) => r.tablaHoja >= 0 && r.tablaHoja <= 1), JSON.stringify(resultadosPdf.map((r) => ({ escala: r.escala, tablaHoja: r.tablaHoja, paginas: r.paginas }))));
    await volverDelImpreso();
    await pd.waitForFunction(() => document.getElementById('panelExp') && !/Cargando/.test(document.getElementById('panelExp').innerText));

    /* ---------- IC de Valentina: crear, error por campo, firmar con dos firmantes, solo lectura, recibí, addenda ---------- */
    const idVal = await idDe('Valentina');
    const hceVal = (await get(`/hce/${idVal}`)).json;
    const anio = (await get(`/hce/${idVal}/flujo`)).json.anio;
    await abrirD(idVal, 'ic');
    const ideaVal = (await get(`/hce/${idVal}/idea`)).json[0];
    const ini = await pd.evaluate(() => ({ estado: document.getElementById('icEstado').innerText.replace(/\s+/g, ' ').trim(), tabla: [...document.querySelectorAll('#panelExp .ic-tabla tbody tr')].map((tr) => [...tr.children].map((c) => c.innerText.replace(/\s+/g, ' ').trim())),
      f: [document.getElementById('ic_f1').value, document.getElementById('ic_f2').value] }));
    check('3d-c0', 'IC sin crear: estado «Sin iniciar»; la tabla muestra el IDEA firmado tal como lo devuelve la API y «—» donde falta PA/PB; los firmantes se precargan con los técnicos del grupo',
      /Sin iniciar/.test(ini.estado) && ini.tabla[4][1] === `${ideaVal.total} / 96` && ini.tabla[4][2] === '—' && ini.tabla[4][3] === '—' && ini.tabla[4][4] === '—'
        && ini.f[0] === String(hceVal.grupo.tecnico1.id) && ini.f[1] === String(hceVal.grupo.tecnico2.id), JSON.stringify(ini));
    // crear el borrador con lo mínimo (POST: sólo lo tipeado + anio)
    await pd.fill('#ic_esc1', 'Síntesis E1 de prueba.'); await pd.fill('#ic_esc2', 'Síntesis E2 de prueba.'); await pd.fill('#ic_esc3', 'Síntesis E3 de prueba.');
    await pd.fill('#ic_fecha', '2026-12-01');
    const reqPost = pd.waitForRequest((r) => r.method() === 'POST' && new RegExp(`/hce/${idVal}/informe-cierre$`).test(r.url()));
    await pd.click('#btnIcGuardar');
    const cuerpoPost = cuerpoDe(await reqPost);
    await pd.waitForFunction(() => /Sin iniciar/.test(document.getElementById('icEstado').innerText) === false);
    const listaVal = (await get(`/hce/${idVal}/informe-cierre`)).json;
    check('3d-c1', 'crear el borrador: POST /hce/{id}/informe-cierre con el año del flujo y sólo lo tipeado; queda «En curso» (borrador) y en la API existe',
      cuerpoPost.anio === anio && JSON.stringify(Object.keys(cuerpoPost).sort()) === '["anio","fecha","sint_escala"]' && JSON.stringify(Object.keys(cuerpoPost.sint_escala).sort()) === '["esc_1","esc_2","esc_3"]'
        && listaVal.length === 1 && listaVal[0].estado === 'en_curso' && /En curso/.test(await txt(pd, '#icEstado')), JSON.stringify(cuerpoPost).slice(0, 200));

    // firmar incompleto → 422 por campo (resumen role=alert con foco, aria-invalid + aria-describedby)
    await pd.click('#btnIcFirmar'); await pd.waitForSelector('#btnIcConfirmar');
    const resp422 = pd.waitForResponse((r) => r.request().method() === 'POST' && /\/informe-cierre\/\d+\/firmar$/.test(r.url()));
    await pd.click('#btnIcConfirmar');
    const r422 = await resp422;
    const j422 = await r422.json();
    await pd.waitForSelector('#evErrores:not([hidden])');
    const ui422 = await pd.evaluate(() => ({ foco: document.activeElement.id, rol: document.getElementById('evErrores').getAttribute('role'),
      marcados: [...document.querySelectorAll('#panelExp [aria-invalid="true"]')].map((e) => ({ id: e.id, desc: e.getAttribute('aria-describedby'), err: (document.getElementById('err_' + e.id) || {}).textContent })) }));
    const camposApi = j422.detail.map((d) => d.campo).filter(Boolean);
    const idDeCampo = (c) => ({ 'sint_escala.esc_4': 'ic_esc4', val_tec1: 'ic_val1', val_tec2: 'ic_val2', recomendaciones: 'ic_recom', orientaciones: 'ic_orient', fecha: 'ic_fecha' }[c] || c);
    check('3d-c2', 'firmar con el borrador incompleto: la API devuelve 422 por campo y la pantalla lo muestra junto a cada campo (aria-invalid + aria-describedby al mensaje) y en un resumen role="alert" que recibe el foco',
      r422.status() === 422 && ui422.foco === 'evErrores' && ui422.rol === 'alert' && camposApi.length >= 5
        && camposApi.every((c) => ui422.marcados.some((m) => m.id === idDeCampo(c) && m.desc.includes('err_' + m.id) && m.err && m.err.length > 3)), JSON.stringify({ camposApi, marcados: ui422.marcados.map((m) => m.id) }));

    // completar y repetir el mismo firmante → 422 en firmantes; los firmantes se eligen al firmar (no están en el borrador)
    await pd.fill('#ic_esc4', 'Síntesis E4 de prueba.'); await pd.fill('#ic_val1', 'Valoración del técnico 1.'); await pd.fill('#ic_val2', 'Valoración del técnico 2.');
    await pd.fill('#ic_recom', 'Recomendaciones de prueba.'); await pd.fill('#ic_orient', 'Orientaciones de prueba.');
    await pd.selectOption('#ic_f1', String(idTorres)); await pd.selectOption('#ic_f2', String(idTorres));
    await pd.click('#btnIcFirmar'); await pd.waitForSelector('#btnIcConfirmar');
    const reqPatch = pd.waitForRequest((r) => r.method() === 'PATCH' && /\/informe-cierre\/\d+$/.test(r.url()));
    await pd.click('#btnIcConfirmar');
    const cuerpoPatch = cuerpoDe(await reqPatch);
    await pd.waitForSelector('#evErrores:not([hidden])');
    const ui422b = await pd.evaluate(() => ({ foco: document.activeElement.id, f1: document.getElementById('ic_f1').getAttribute('aria-invalid') || document.getElementById('ic_f2').getAttribute('aria-invalid'), txt: document.getElementById('err_ic_f1').textContent + document.getElementById('err_ic_f2').textContent, resumen: document.getElementById('evErrores').innerText.replace(/\s+/g, ' ') }));
    check('3d-c3', 'dos firmantes iguales: la API rechaza con 422 en `firmantes` y se ve junto al primer selector; el PATCH previo manda SOLO lo que se completó (4 campos + síntesis E4) y el IC sigue sin firmar',
      ui422b.foco === 'evErrores' && ui422b.f1 === 'true' && ui422b.txt.length > 3 && JSON.stringify(Object.keys(cuerpoPatch).sort()) === '["orientaciones","recomendaciones","sint_escala","val_tec1","val_tec2"]'
        && JSON.stringify(Object.keys(cuerpoPatch.sint_escala)) === '["esc_4"]' && (await get(`/hce/${idVal}/informe-cierre`)).json[0].firmado === false, JSON.stringify({ ...ui422b, cuerpoPatch }).slice(0, 380));

    // firmar con dos firmantes DISTINTOS y en orden inverso al del grupo: Torres, González
    await pd.selectOption('#ic_f1', String(idTorres)); await pd.selectOption('#ic_f2', String(idGonzalez));
    await pd.click('#btnIcFirmar'); await pd.waitForSelector('#btnIcConfirmar');
    const respFirma = pd.waitForResponse((r) => r.request().method() === 'POST' && /\/informe-cierre\/\d+\/firmar$/.test(r.url()));
    const reqFirma = pd.waitForRequest((r) => r.method() === 'POST' && /\/informe-cierre\/\d+\/firmar$/.test(r.url()));
    await pd.click('#btnIcConfirmar');
    const cuerpoFirma = cuerpoDe(await reqFirma);
    const jFirma = await (await respFirma).json();
    await pd.waitForFunction(() => document.querySelectorAll('#panelExp [data-ic]').length === 0 && /Firmado/.test(document.getElementById('icEstado').innerText));
    const ro = await pd.evaluate(() => ({ foco: document.activeElement.id, habilitados: [...document.querySelectorAll('#panelExp input,#panelExp select,#panelExp textarea')].filter((e) => !e.disabled && e.id !== 'ic_add_texto').length,
      avisos: [...document.querySelectorAll('#icAvisos li')].map((l) => l.innerText.trim()), rol: (document.getElementById('icAvisos') || {}).getAttribute && document.getElementById('icAvisos').getAttribute('role'),
      oculto: document.getElementById('icAvisos').hidden, firmas: document.querySelector('#panelExp .data-row dd').innerText.replace(/\s+/g, ' ') }));
    const apiVal = (await get(`/hce/${idVal}/informe-cierre`)).json[0];
    check('3d-c4', 'IC firmado con dos firmantes (POST …/firmar {firmantes:[Torres, González]}): queda de solo lectura (ningún campo editable), el foco va al título, los avisos de la API se muestran en role="status" tal cual (sin bloquear) y la API lo confirma firmado con esas dos firmas',
      JSON.stringify(cuerpoFirma) === JSON.stringify({ firmantes: [idTorres, idGonzalez] }) && apiVal.firmado && JSON.stringify(apiVal.firmas.map((f) => f.profesional_id)) === JSON.stringify([idTorres, idGonzalez])
        && ro.foco === 'icTitulo' && ro.habilitados === 0 && ro.rol === 'status' && !ro.oculto && jFirma.warnings.length >= 1 && JSON.stringify(ro.avisos) === JSON.stringify(jFirma.warnings.map((w) => w.mensaje)),
      JSON.stringify({ warnings: jFirma.warnings.map((w) => w.code), ro: { ...ro, avisos: ro.avisos.length } }));

    // recibí: modal accesible, error por campo, una sola vez
    await pd.click('#btnIcRecibi');
    await pd.waitForSelector('#modalFlujo.open');
    await pd.waitForFunction(() => document.activeElement && document.activeElement.id === 'mfFirmante');
    const mod = await pd.evaluate(() => { const d = document.querySelector('#modalFlujo .modal'); const lab = document.getElementById(d.getAttribute('aria-labelledby'));
      return { role: d.getAttribute('role'), modal: d.getAttribute('aria-modal'), nombre: lab.textContent.trim(), inert: document.querySelector('div.layout').inert, foco: document.activeElement.id,
        etiquetas: ['mfFirmante', 'mfFecha'].map((i) => !!document.querySelector(`label[for="${i}"]`)) }; });
    await pd.fill('#mfFirmante', '');
    const reqNo = pd.waitForResponse((r) => r.request().method() === 'POST' && /\/recibi$/.test(r.url()));
    await pd.click('#btnRecibiOk');
    const noOk = await reqNo;
    await pd.waitForSelector('#recibiErrores:not([hidden])');
    const errR = await pd.evaluate(() => ({ foco: document.activeElement.id, rol: document.getElementById('recibiErrores').getAttribute('role'),
      campos: ['mfFirmante', 'mfFecha'].map((i) => ({ id: i, inv: document.getElementById(i).getAttribute('aria-invalid'), desc: document.getElementById(i).getAttribute('aria-describedby'), err: document.getElementById('err_' + i).textContent })) }));
    check('3d-r1', 'el recibí se registra en un diálogo modal accesible (role=dialog, aria-modal, nombre, app inerte, foco al primer campo); vacío, la API responde 422 y los errores salen junto a cada campo (aria-describedby) y en un resumen role="alert" con foco',
      mod.role === 'dialog' && mod.modal === 'true' && mod.nombre !== '' && mod.inert && mod.foco === 'mfFirmante' && mod.etiquetas.every(Boolean)
        && noOk.status() === 422 && errR.foco === 'recibiErrores' && errR.rol === 'alert' && errR.campos.every((c) => c.inv === 'true' && c.desc.includes('err_' + c.id) && c.err.length > 3), JSON.stringify({ mod, errR: errR.campos.map((c) => c.id + ':' + c.err) }).slice(0, 300));
    await escDescartando(pd);
    const trasEsc = await pd.evaluate(() => ({ abierto: document.getElementById('modalFlujo').classList.contains('open'), inert: document.querySelector('div.layout').inert, foco: document.activeElement.id }));
    check('3d-r2', 'Esc cierra el diálogo del recibí, la app deja de estar inerte y el foco vuelve al botón que lo abrió; no se registró nada',
      !trasEsc.abierto && !trasEsc.inert && trasEsc.foco === 'btnIcRecibi' && (await get(`/hce/${idVal}/informe-cierre`)).json[0].recibi === null, JSON.stringify(trasEsc));
    await pd.click('#btnIcRecibi'); await pd.waitForSelector('#modalFlujo.open');
    await pd.fill('#mfFirmante', 'Valeria P. (madre)'); await pd.fill('#mfFecha', '2026-12-05');
    const reqRecibi = pd.waitForRequest((r) => r.method() === 'POST' && /\/recibi$/.test(r.url()));
    await pd.click('#btnRecibiOk');
    const cuerpoRecibi = cuerpoDe(await reqRecibi);
    await pd.waitForFunction(() => !document.getElementById('modalFlujo').classList.contains('open'));
    await pd.waitForFunction(() => /Valeria P/.test(document.getElementById('icRecibiTxt').innerText));
    const dosVeces = await send('POST', `/informe-cierre/${apiVal.id}/recibi`, { firmante: 'Otra persona', fecha: '2026-12-06' });
    check('3d-r3', 'recibí registrado una sola vez: POST …/recibi {firmante, fecha} desde el diálogo, la pestaña lo muestra y desaparece el botón; un segundo intento da 409 en la API',
      JSON.stringify(cuerpoRecibi) === JSON.stringify({ firmante: 'Valeria P. (madre)', fecha: '2026-12-05' }) && (await pd.locator('#btnIcRecibi').count()) === 0 && dosVeces.status === 409
        && (await get(`/hce/${idVal}/informe-cierre`)).json[0].recibi.firmante === 'Valeria P. (madre)', `segundo=${dosVeces.status}`);

    // addenda: el autor es el usuario del token y se resuelve por nombre
    await pd.fill('#ic_add_texto', 'Addenda de prueba 3-d.');
    await pd.click('#btnIcAdd');
    await pd.waitForFunction(() => document.querySelectorAll('#icAddendas .ev-add-lista li').length === 1);
    const addTxt = await txt(pd, '#icAddendas .ev-add-lista li');
    check('3d-ad', 'addenda al IC firmado: aparece con el nombre del autor (el usuario del token, resuelto con GET /profesionales) y la marca «con 1 addenda» en el encabezado y la pestaña',
      /Dr\. González/.test(addTxt) && /Addenda de prueba 3-d/.test(addTxt) && /con 1 addenda/.test(await txt(pd, '#icEstado')) && (await get(`/hce/${idVal}/informe-cierre`)).json[0].addendas.length === 1, addTxt);

    // (c) impreso de Valentina: firmas = quienes firmaron (Torres primero), no el grupo; recibí y addenda
    await verImpreso();
    const impV = await pd.evaluate(() => { const c = document.getElementById('informeContent'); return { datos: [...c.querySelectorAll('.doc-datos .data-row')].map((r) => [r.querySelector('dt').innerText.trim(), r.querySelector('dd').innerText.trim()]),
      firmas: [...c.querySelectorAll('.firmas-grid .fnom')].map((e) => e.innerText.trim()), texto: c.innerText.replace(/\s+/g, ' '), recibiBtn: !!document.getElementById('btnInfRecibi') }; });
    check('3d-c5', 'impreso del IC firmado en la sesión: firmante 1 = Mtra. Torres y firmante 2 = Dr. González (el orden de informe.firmas[], NO el de los técnicos del grupo, que es el inverso); el recibí registrado figura, ya no se ofrece registrarlo y la addenda aparece con su autor',
      impV.datos.find((d) => d[0] === 'Profesional firmante 1')[1].startsWith('Mtra. Torres') && impV.datos.find((d) => d[0] === 'Profesional firmante 2')[1].startsWith('Dr. González')
        && hceVal.grupo.tecnico1.nombre === 'Dr. González' && impV.firmas[2].includes('Valeria P. (madre)') && !impV.recibiBtn && /Addenda de prueba 3-d/.test(impV.texto) && /Dr\. González: Addenda/.test(impV.texto), JSON.stringify(impV.datos).slice(0, 300));
    await volverDelImpreso();

    /* ---------- Camila: sin IC → impreso = estado del flujo (sin llamar a /documento); 409 del documento; 409 al guardar → solo lectura ---------- */
    const idCam = await idDe('Camila');
    await abrirD(idCam, 'ic');
    const llamadasDoc = [];
    const onReq = (r) => { if (/\/documento$/.test(r.url())) llamadasDoc.push(r.url()); };
    pd.on('request', onReq);
    await verImpreso();
    const sinIc = await pd.evaluate(() => ({ texto: document.getElementById('informeContent').innerText.replace(/\s+/g, ' '), estados: [...document.querySelectorAll('#informeContent .fl-lista li')].map((l) => l.innerText.replace(/\s+/g, ' ').trim()), tabla: !!document.querySelector('#informeContent .ic-tabla') }));
    check('3d-n1', 'IC sin crear: «Ver informe impreso» muestra el estado del flujo (cuatro módulos con glifo y texto) en lugar del documento, sin pedir /documento ni mostrar tablas',
      /No hay un Informe de Cierre Anual firmado/.test(sinIc.texto) && sinIc.estados.length === 4 && sinIc.estados.every((e) => /(firmado|en curso|sin iniciar)/i.test(e)) && !sinIc.tabla && llamadasDoc.length === 0, JSON.stringify(sinIc.estados));
    await volverDelImpreso();
    await pd.fill('#ic_esc1', 'Borrador de Camila.');
    await pd.click('#btnIcGuardar');
    await pd.waitForFunction(() => /En curso/.test(document.getElementById('icEstado').innerText));
    const resp409doc = pd.waitForResponse((r) => /\/documento$/.test(r.url()));
    await verImpreso();
    const r409d = await resp409doc;
    const conBorrador = await pd.evaluate(() => ({ texto: document.getElementById('informeContent').innerText.replace(/\s+/g, ' '), tabla: !!document.querySelector('#informeContent .ic-tabla') }));
    check('3d-n2', 'IC en borrador: GET …/documento responde 409 y el impreso muestra el estado del flujo (no el documento)',
      r409d.status() === 409 && /No hay un Informe de Cierre Anual firmado/.test(conBorrador.texto) && !conBorrador.tabla, `documento → ${r409d.status()}`);
    pd.off('request', onReq);
    await volverDelImpreso();
    await pd.waitForFunction(() => document.getElementById('icEstado'));
    // otra sesión completa y firma ese IC; esta pantalla sigue con el borrador viejo y al guardar recibe 409
    const icCam = (await get(`/hce/${idCam}/informe-cierre`)).json[0];
    const pat = await send('PATCH', `/informe-cierre/${icCam.id}`, { fecha: '2026-12-02', sint_escala: { esc_2: 'e2', esc_3: 'e3', esc_4: 'e4' }, val_tec1: 'v1', val_tec2: 'v2', recomendaciones: 'r', orientaciones: 'o' });
    const fir = await send('POST', `/informe-cierre/${icCam.id}/firmar`, { firmantes: [idGonzalez, idTorres] });
    await pd.fill('#ic_val1', 'Cambio que llega tarde');
    const resp409 = pd.waitForResponse((r) => r.request().method() === 'PATCH' && /\/informe-cierre\/\d+$/.test(r.url()));
    await pd.click('#btnIcGuardar');
    const r409 = await resp409;
    await pd.waitForFunction(() => document.querySelectorAll('#panelExp [data-ic]').length === 0 && /Firmado/.test(document.getElementById('icEstado').innerText));
    const ro409 = await pd.evaluate(() => ({ avisos: document.getElementById('icAvisos').innerText.replace(/\s+/g, ' '), val: document.getElementById('panelExp').innerText.includes('Cambio que llega tarde') }));
    check('3d-n3', 'un 409 al guardar (otra sesión ya firmó el IC) pasa la pantalla a solo lectura con lo que hay en el servidor: se descarta el cambio tardío, se avisa y el IC figura firmado',
      pat.status === 200 && fir.status === 200 && r409.status() === 409 && !ro409.val && /ya está firmado|firmado/i.test(ro409.avisos), `PATCH=${r409.status()} ${ro409.avisos.slice(0, 120)}`);

    // el 409 NO es un aviso de la API: se rotula «Cambió en el servidor» (role="status") y nunca bajo «Avisos de la API (no bloquean)»
    const rot409 = await pd.evaluate(() => { const el = document.getElementById('icAvisos'); return { rol: el.getAttribute('role'), oculto: el.hidden, texto: el.innerText.replace(/\s+/g, ' '), foco: document.activeElement.id }; });
    check('3d-n4', 'el 409 del IC se muestra como «Cambió en el servidor: …» en un role="status" propio y NO bajo «Avisos de la API (no bloquean)»; el foco queda en el título del IC',
      rot409.rol === 'status' && !rot409.oculto && /Cambió en el servidor:/.test(rot409.texto) && !/Avisos de la API/.test(rot409.texto) && rot409.foco === 'icTitulo', JSON.stringify(rot409).slice(0, 260));

    // 409 del recibí: otra sesión lo registra mientras el diálogo está abierto → al confirmar, el diálogo se cierra, la pantalla se repinta
    // (el botón que abrió el diálogo desaparece) y el foco NO se pierde en <body>
    await pd.click('#btnIcRecibi'); await pd.waitForSelector('#modalFlujo.open');
    const otraSesion = await send('POST', `/informe-cierre/${icCam.id}/recibi`, { firmante: 'Otra sesión', fecha: '2026-12-03' });
    await pd.fill('#mfFirmante', 'Segundo intento'); await pd.fill('#mfFecha', '2026-12-04');
    const resp409r = pd.waitForResponse((r) => r.request().method() === 'POST' && /\/recibi$/.test(r.url()));
    await pd.click('#btnRecibiOk');
    const r409r = await resp409r;
    await pd.waitForFunction(() => !document.getElementById('modalFlujo').classList.contains('open') && /Otra sesi/.test(document.getElementById('icRecibiTxt') ? document.getElementById('icRecibiTxt').innerText : ''));
    await pd.waitForTimeout(150);
    const foco409 = await pd.evaluate(() => ({ foco: document.activeElement.id || document.activeElement.tagName, enBody: document.activeElement === document.body, inerte: document.querySelector('div.layout').inert,
      boton: !!document.getElementById('btnIcRecibi'), avisos: document.getElementById('icAvisos').innerText.replace(/\s+/g, ' ') }));
    check('3d-n5', 'recibí con 409 (otra sesión ya lo registró): el diálogo se cierra, la app deja de estar inerte, se muestra lo que hay en el servidor («Cambió en el servidor», no «Avisos de la API») y el foco queda en el título del IC, no en <body>',
      otraSesion.status < 300 && r409r.status() === 409 && !foco409.enBody && foco409.foco === 'icTitulo' && !foco409.inerte && !foco409.boton && /Cambió en el servidor:/.test(foco409.avisos) && !/Avisos de la API/.test(foco409.avisos), JSON.stringify(foco409).slice(0, 300));

    /* ---------- 409 con una escritura concurrente REAL (otra sesión escribe por la API mientras esta pantalla tiene el formulario abierto) ----------
       Tras el 409 la pantalla se repinta con lo que hay en el servidor: el rótulo es «Cambió en el servidor» (nunca «Avisos de la API»), no queda
       ningún resumen «No se pudo guardar» huérfano y el foco va a un destino estable (el título), no a <body>. */
    const sufC = String(Date.now()).slice(-6);
    const escolaresC = (await get('/grupos?anio=' + anio)).json.find((g) => g.nombre === 'Escolares');
    const nuevoExp = async (nombre, pref) => (await send('POST', '/hce', { persona: { nombre: nombre + sufC, apellido: 'Conc', ci: pref + sufC + '4', fecha_nac: '2016-05-05' }, grupo_id: escolaresC.id })).json.data.id;

    // (a) CI: otra sesión lo registra; esta pantalla (CI pendiente, formulario tipeado) guarda y recibe 409
    const idCiC = await nuevoExp('Ciconc', '3');
    await abrirD(idCiC, 'ci');
    await pd.fill('#ci_firmante', 'Firmante de esta pantalla'); await pd.fill('#ci_fecha', '2026-06-01');
    const otraCi = await send('POST', `/hce/${idCiC}/consentimiento`, { firmante: 'Firmante de otra sesión', fecha: '2026-06-02', autorizaciones: { evaluacion: true, registro: true, comunicacion: false } });
    const resp409ci = pd.waitForResponse((r) => r.request().method() === 'POST' && /\/consentimiento$/.test(r.url()));
    await pd.click('#btnCiGuardar');
    const r409ci = await resp409ci;
    await pd.waitForFunction(() => !document.getElementById('btnCiGuardar') && !!document.getElementById('btnCiEditar'), null, { timeout: 8000 });
    await pd.waitForTimeout(200);
    const ci409 = await pd.evaluate(() => ({ avisos: (document.getElementById('expAvisos') || { innerText: '' }).innerText.replace(/\s+/g, ' '), panel: document.getElementById('panelExp').innerText.replace(/\s+/g, ' '),
      resumen: document.getElementById('ciErrores') ? document.getElementById('ciErrores').innerText : '', foco: document.activeElement.id || document.activeElement.tagName, enBody: document.activeElement === document.body }));
    check('3d-ci409', 'CI con escritura concurrente real: otra sesión registra el CI; al «Registrar consentimiento» en esta pantalla la API contesta 409 → se muestra «Cambió en el servidor» (no «Avisos de la API» ni «No se pudo guardar»), el CI registrado es el de la otra sesión, y el foco queda en el título de la pestaña, no en <body>',
      otraCi.status < 300 && r409ci.status() === 409 && /Cambió en el servidor:/.test(ci409.avisos) && !/Avisos de la API/.test(ci409.avisos) && !/No se pudo guardar/.test(ci409.panel + ci409.resumen)
        && ci409.panel.includes('Firmante de otra sesión') && !ci409.panel.includes('Firmante de esta pantalla') && !ci409.enBody && ci409.foco === 'ciTitulo', JSON.stringify(ci409).slice(0, 320));

    // (b) IDEA / PA / PB: otra sesión firma el borrador; esta pantalla toca un valor y guarda → 409 → solo lectura
    const dimC = Object.fromEntries(Array.from({ length: 12 }, (_, i) => ['D' + (i + 1), { valor: 4, obs: null }]));
    const itemsC = Object.fromEntries(Array.from({ length: 24 }, (_, i) => [String(i + 1), { valor: 3, obs: null }]));
    const cuerpoC = { tipo: null, anio, items: itemsC, fecha: '2026-07-01', semanas: 16, sint_tec1: 'a', sint_tec2: 'b', evaluador_t1_id: idGonzalez, evaluador_t2_id: idTorres };
    const modsC = [
      { k: 'lb', pref: '4', crear: (id) => send('POST', `/hce/${id}/idea`, { anio, dim: dimC, fecha_consenso: '2026-03-20', sesiones: 6, sintesis: 's', objetivos: 'o', evaluador_t1_id: idGonzalez, evaluador_t2_id: idTorres }), ruta: (d) => `/idea/${d.id}`, tocar: '#dim-D1 .opcion[data-v="2"]' },
      { k: 'pa', pref: '5', crear: (id) => send('POST', `/hce/${id}/protocolo`, { ...cuerpoC, tipo: 'A' }), ruta: (d) => `/protocolo/${d.id}`, tocar: '#pitem-1 .likert-btn[data-v="2"]' },
      { k: 'pb', pref: '6', crear: (id) => send('POST', `/hce/${id}/protocolo`, { ...cuerpoC, tipo: 'B' }), ruta: (d) => `/protocolo/${d.id}`, tocar: '#pitem-1 .likert-btn[data-v="2"]' }
    ];
    for (const m of modsC) {
      const idE = await nuevoExp('Evc' + m.k, m.pref);
      const borr = await m.crear(idE);
      await abrirD(idE, m.k);
      await pd.waitForSelector('#btnEvGuardar');
      await pd.click(m.tocar);
      const firmaOtra = await send('POST', m.ruta(borr.json.data) + '/firmar');
      const resp409ev = pd.waitForResponse((r) => r.request().method() === 'PATCH' && new RegExp(m.ruta(borr.json.data) + '$').test(r.url()));
      await pd.click('#btnEvGuardar');
      const r409ev = await resp409ev;
      await pd.waitForFunction(() => document.querySelectorAll('#btnEvGuardar, #btnEvFirmar').length === 0 && !!document.querySelector('#evEstado .st-firmado'), null, { timeout: 8000 });
      await pd.waitForTimeout(200);
      const ev409 = await pd.evaluate(() => { const a = document.getElementById('evAvisos'); return { avisos: a.hidden ? '' : a.innerText.replace(/\s+/g, ' '), rol: a.getAttribute('role'), editables: [...document.querySelectorAll('#panelExp [data-ev]')].filter((e) => !e.disabled).length,
        foco: document.activeElement.id || document.activeElement.tagName, enBody: document.activeElement === document.body }; });
      check('3d-ev409-' + m.k, `${m.k.toUpperCase()} con escritura concurrente real: otra sesión firma el borrador; al guardar aquí la API contesta 409 → la pantalla queda en solo lectura, el rótulo es «Cambió en el servidor» (no «Avisos de la API») y el foco va al título (#evTitulo), no a <body>`,
        firmaOtra.status === 200 && r409ev.status() === 409 && ev409.editables === 0 && /Cambió en el servidor:/.test(ev409.avisos) && !/Avisos de la API/.test(ev409.avisos) && /\. Se muestra el registro tal como está en el servidor\./.test(ev409.avisos) && !ev409.enBody && ev409.foco === 'evTitulo', JSON.stringify(ev409).slice(0, 320));
    }

    /* ---------- (d) VF de Martín: categoría = la de la API; un valor rechazado da error por campo ---------- */
    await abrirD(idMartinD, 'vf');
    const vacioM = await pd.evaluate(() => ({ rol: (document.querySelector('#panelExp .estado-vacio[role="status"]') || {}).tagName, alert: document.querySelectorAll('#panelExp [role="alert"]').length, texto: document.getElementById('panelExp').innerText.replace(/\s+/g, ' ') }));
    check('3d-e1', 'VF de un expediente sin valoración (GET → 404): estado vacío con botón «Registrar valoración funcional», NO un error (sin role="alert")',
      (await get(`/hce/${idMartinD}/valoracion-funcional`)).status === 404 && /Todavía no se registró una valoración funcional/.test(vacioM.texto) && vacioM.alert === 0 && (await pd.locator('#btnVfNuevo').count()) === 1, vacioM.texto.slice(0, 120));
    await pd.click('#btnVfNuevo');
    await pd.waitForSelector('#vf_pct');
    const sinSugerencia = await pd.evaluate(() => { const t = document.getElementById('panelExp').innerText; const botones = [...document.querySelectorAll('#panelExp button')].map((b) => b.innerText.trim());
      return { botones, sugerencia: /autogener|sugerencia|sugiere|borrador autom/i.test(t.replace(/no se autogenera/gi, '')), fns: ['sugiereNivel', 'genVFBorrador', 'categoriaBaremo', 'vfAlertaVigencia'].map((n) => typeof window[n]) }; });
    check('3d-e2', 'la pantalla de VF conectada no ofrece ninguna sugerencia de nivel CIF ni «Autogenerar borrador» (sin botón, sin texto, sin funciones); la síntesis dice que la escriben los técnicos',
      !sinSugerencia.sugerencia && !sinSugerencia.botones.some((b) => /autogener|sugerir|borrador/i.test(b)) && sinSugerencia.fns.every((t) => t === 'undefined') && /no se autogenera/i.test(await txt(pd, '#hint_vf_sintesis')), JSON.stringify(sinSugerencia));
    // crear con pct 58 (+ estado, fecha, vigencia lejana)
    await pd.selectOption('#vf_estado', 'Valorado'); await pd.fill('#vf_fecha', '2026-05-14'); await pd.fill('#vf_organismo', 'Equipo valorador BPS'); await pd.fill('#vf_pct', '58');
    await pd.fill('#vf_vigencia', '2030-05-14'); await pd.fill('#vf_rnpcd', 'RNPcD-10452');
    const reqVf = pd.waitForRequest((r) => r.method() === 'POST' && /valoracion-funcional$/.test(r.url()));
    await pd.click('#btnVfGuardar');
    const cuerpoVf = cuerpoDe(await reqVf);
    await pd.waitForFunction(() => document.getElementById('vfResultado'));
    const vf1 = (await get(`/hce/${idMartinD}/valoracion-funcional`)).json;
    const ui1 = await pd.evaluate(() => { const c = document.querySelector('#vfResultado .banda-chip'); return { chip: c.innerText.replace(/\s+/g, ' ').trim(), impl: document.querySelector('#vfResultado .vf-impl').innerText.trim(), foco: document.activeElement.id, clase: c.className }; });
    check('3d-d1', 'VF: se ingresa un % y la categoría que se muestra es la de la respuesta de la API (categoria.categoria · rango + implicancia); pct viaja como texto; el foco va al resultado',
      typeof cuerpoVf.pct === 'string' && cuerpoVf.pct === '58' && vf1.categoria.categoria === 'Severo' && ui1.chip === `${vf1.categoria.categoria} · ${vf1.categoria.rango}` && ui1.impl === vf1.categoria.implicancia && ui1.foco === 'vfResultado', JSON.stringify({ cuerpoVf, ui1, api: vf1.categoria }).slice(0, 300));
    // editar sólo pct: PATCH sólo con pct, la categoría se vuelve a pintar desde la respuesta
    await pd.fill('#vf_pct', '30');
    const reqP = pd.waitForRequest((r) => r.method() === 'PATCH' && /valoracion-funcional$/.test(r.url()));
    const respP = pd.waitForResponse((r) => r.request().method() === 'PATCH' && /valoracion-funcional$/.test(r.url()));
    await pd.click('#btnVfGuardar');
    const cuerpoP = cuerpoDe(await reqP); const jP = await (await respP).json();
    await pd.waitForFunction(() => /Moderado/.test(document.querySelector('#vfResultado .banda-chip').innerText));
    const ui2 = await pd.evaluate(() => ({ chip: document.querySelector('#vfResultado .banda-chip').innerText.replace(/\s+/g, ' ').trim(), pct: document.getElementById('vf_pct').value }));
    const vf2 = (await get(`/hce/${idMartinD}/valoracion-funcional`)).json;
    check('3d-d2', 'editar el %: PATCH sólo con {pct:"30"}; tras guardar todo se vuelve a pintar desde la respuesta: la categoría pasa a la que devolvió la API (Moderado) y el campo muestra el % como lo devolvió («30.00»)',
      JSON.stringify(cuerpoP) === '{"pct":"30"}' && jP.data.categoria.categoria === 'Moderado' && ui2.chip === `${vf2.categoria.categoria} · ${vf2.categoria.rango}` && ui2.pct === vf2.pct && vf2.pct === '30.00', JSON.stringify({ cuerpoP, ui2 }));
    // valores que la API rechaza: error por campo, sin guardar nada
    const malos = [];
    for (const [valor, campoApi] of [['150', 'pct'], ['abc', 'pct']]) {
      await pd.fill('#vf_pct', valor);
      const respX = pd.waitForResponse((r) => r.request().method() === 'PATCH' && /valoracion-funcional$/.test(r.url()));
      await pd.click('#btnVfGuardar');
      const rx = await respX; const jx = await rx.json();
      await pd.waitForSelector('#vfErrores:not([hidden])');
      malos.push(await pd.evaluate(([v, st, det]) => ({ v, status: st, campos: det.map((d) => d.campo), foco: document.activeElement.id, rol: document.getElementById('vfErrores').getAttribute('role'),
        inv: document.getElementById('vf_pct').getAttribute('aria-invalid'), desc: document.getElementById('vf_pct').getAttribute('aria-describedby'), err: document.getElementById('err_vf_pct').textContent, valor: document.getElementById('vf_pct').value,
        chip: document.querySelector('#vfResultado .banda-chip').innerText.replace(/\s+/g, ' ').trim() }), [valor, rx.status(), jx.detail]));
    }
    check('3d-d3', 'un % que la API rechaza («150», «abc») da 422 y se muestra como error del campo % (aria-invalid + aria-describedby al mensaje) y en un resumen role="alert" con foco; lo tipeado queda, y la categoría y lo guardado no cambian',
      malos.every((m) => m.status === 422 && m.campos.includes('pct') && m.foco === 'vfErrores' && m.rol === 'alert' && m.inv === 'true' && m.desc.includes('err_vf_pct') && m.err.length > 3 && m.chip.startsWith('Moderado'))
        && (await get(`/hce/${idMartinD}/valoracion-funcional`)).json.pct === '30.00', JSON.stringify(malos.map((m) => [m.v, m.status, m.err])));
    // nivel de autonomía + vigencia vencida: la alerta es la de la API
    await pd.fill('#vf_pct', '30.00'); await pd.fill('#vf_fecha', '2019-06-01');      // la API exige vigencia >= fecha de valoración
    await pd.selectOption('#vf_dom_comunicacion', 'Apoyo permanente'); await pd.selectOption('#vf_dom_movilidad', 'Autónomo');
    await pd.selectOption('#vf_dom_autocuidado', 'Apoyo ocasional'); await pd.selectOption('#vf_dom_aprendizaje', 'Apoyo frecuente'); await pd.fill('#vf_vigencia', '2020-01-31');
    const chipsAntes = await pd.evaluate(() => ({ com: document.querySelector('#vf_chip_comunicacion .banda-chip').dataset.bandaPaso, mov: document.querySelector('#vf_chip_movilidad .banda-chip').dataset.bandaPaso }));
    await pd.click('#btnVfGuardar');
    await pd.waitForFunction(() => document.getElementById('vfAlerta'));
    const vf3 = (await get(`/hce/${idMartinD}/valoracion-funcional`)).json;
    const ui3 = await pd.evaluate(() => ({ alerta: document.getElementById('vfAlerta').innerText.replace(/\s+/g, ' ').trim(), glifo: !!document.querySelector('#vfAlerta [aria-hidden="true"]'),
      niv: document.querySelector('#vf_chip_comunicacion .banda-chip').dataset.bandaPaso, nivTxt: document.querySelector('#vf_chip_comunicacion .banda-chip').innerText.trim() }));
    check('3d-d4', 'la alerta de vigencia es la de la API (nivel + mensaje tal cual, con glifo y texto) y los niveles de autonomía se guardan por dominio (PATCH fusiona) y se ven con su nombre en la rampa',
      vf3.alerta_vigencia && vf3.alerta_vigencia.nivel === 'vencida' && ui3.alerta.includes(vf3.alerta_vigencia.mensaje) && /Vencida/.test(ui3.alerta) && ui3.glifo && vf3.dominios.comunicacion === 'Apoyo permanente' && vf3.dominios.movilidad === 'Autónomo'
        && ui3.nivTxt === 'Apoyo permanente' && chipsAntes.com === '6' && chipsAntes.mov === '1', JSON.stringify({ ui3, antes: chipsAntes }));

    /* ---------- (D7) rampa de un solo matiz: categorías y niveles de la VF, nunca ok/warn/bad ---------- */
    const rampa = await pd.evaluate(() => {
      const raiz = getComputedStyle(document.documentElement);
      const prohib = ['--ok', '--warn', '--bad', '--ok-soft', '--warn-soft', '--bad-soft'].map((v) => raiz.getPropertyValue(v).trim().toLowerCase());
      const rgb = (c) => { const m = c.match(/\d+/g).map(Number); return '#' + m.slice(0, 3).map((x) => x.toString(16).padStart(2, '0')).join(''); };
      const chips = [...document.querySelectorAll('#vfResultado .banda-chip, #vf_chip_comunicacion .banda-chip, .vf-doms .banda-chip')];
      return { n: chips.length, mal: chips.filter((c) => { const bg = rgb(getComputedStyle(c).backgroundColor), fg = rgb(getComputedStyle(c).color);
        return prohib.includes(bg) || prohib.includes(fg) || !/banda-(\d|neutra)/.test(c.className); }).length,
        pasos: chips.map((c) => c.dataset.bandaPaso) };
    });
    check('3d-d7', 'D7 (regla 5 del encargo): las categorías del baremo y los niveles de autonomía de la VF usan la misma rampa de un solo matiz que las bandas del IDEA (clases banda-1…6 / neutra, nombre escrito): ningún fondo ni texto coincide con --ok/--warn/--bad',
      rampa.n >= 5 && rampa.mal === 0 && ['6', '2', '1', '4'].every((p) => rampa.pasos.includes(p)), JSON.stringify(rampa));

    // reporte impreso de la VF: todo de la API; la lectura del Δ es la del servidor (sin números ni Δ locales)
    await pd.click('#btnVfReporte');
    await pd.waitForFunction(() => document.getElementById('view-informe').classList.contains('active') && /Reporte de Valoración Funcional/.test(document.getElementById('informeContent').innerText) && !/Cargando el reporte/.test(document.getElementById('informeContent').innerText));
    const repo = await pd.evaluate(() => { const c = document.getElementById('informeContent'); return { texto: c.innerText.replace(/\s+/g, ' '), evol: [...c.querySelectorAll('.doc-seccion')].find((s) => /Evolución del año/.test(s.innerText)) ? [...[...c.querySelectorAll('.doc-seccion')].find((s) => /Evolución del año/.test(s.innerText)).querySelectorAll('.doc-p')].map((p) => p.innerText.trim()) : [],
      head: !!c.querySelector('.print-wrap > thead .ph') }; });
    const pbApi = (await get(`/hce/${idMartinD}/protocolo`)).json.find((p) => p.tipo === 'B');
    const evEsperada = ['esc_1', 'esc_2', 'esc_3', 'esc_4'].map((k) => pbApi.interpretacion[k].etiqueta);
    check('3d-d5', 'reporte impreso de la VF: la «Evolución del año» usa la lectura del Δ B−A que devuelve la API (protocolo B firmado) y no lleva ningún Δ ni cifra de evolución; muestra la categoría de la API y el encabezado repetible de la hoja',
      repo.evol.length === 4 && repo.evol.every((p, i) => p.endsWith(evEsperada[i] + '.')) && !/Δ|\+\d/.test(repo.texto) && /Categoría según el baremo: Moderado/.test(repo.texto) && repo.head, JSON.stringify(repo.evol));
    await pd.click('#informeContent .inf-banner button:has-text("Volver al expediente")');
    await pd.waitForSelector('#vf_pct');

    /* ---------- (e) VF de Sofía: vacío → crear con un solo campo; categoría «No corresponde» ---------- */
    const idSof = await idDe('Sofía');
    await abrirD(idSof, 'vf');
    const e0 = (await get(`/hce/${idSof}/valoracion-funcional`)).status;
    await pd.click('#btnVfNuevo'); await pd.waitForSelector('#vf_estado');
    await pd.selectOption('#vf_estado', 'En trámite');
    const reqS = pd.waitForRequest((r) => r.method() === 'POST' && /valoracion-funcional$/.test(r.url()));
    await pd.click('#btnVfGuardar');
    const cuerpoS = cuerpoDe(await reqS);
    await pd.waitForFunction(() => document.getElementById('vfResultado'));
    const sof = (await get(`/hce/${idSof}/valoracion-funcional`)).json;
    const uiS = await pd.evaluate(() => ({ chip: document.querySelector('#vfResultado .banda-chip').innerText.replace(/\s+/g, ' ').trim(), paso: document.querySelector('#vfResultado .banda-chip').dataset.bandaPaso, alerta: !!document.getElementById('vfAlerta'), errores: !document.getElementById('vfErrores').hidden }));
    check('3d-e3', 'crear una VF desde el estado vacío con un solo campo: POST {estado}; sin % la categoría es «No corresponde» (neutra, sin paso inferido), sin alerta y sin errores',
      e0 === 404 && JSON.stringify(cuerpoS) === '{"estado":"En trámite"}' && sof.categoria === null && uiS.chip === sof.categoria_etiqueta && uiS.chip === 'No corresponde' && uiS.paso === 'neutra' && !uiS.alerta && !uiS.errores, JSON.stringify({ cuerpoS, uiS }));

    /* ---------- edad en los documentos impresos: a la fecha del PROPIO documento, nunca al reloj del navegador ---------- */
    const edadEn = (nac, ref) => { const [a0, m0, d0] = nac.split('-').map(Number), [a1, m1, d1] = ref.split('-').map(Number); return a1 - a0 - ((m1 < m0 || (m1 === m0 && d1 < d0)) ? 1 : 0); };
    const usuarioIC = imp.datos.find((d) => d[0] === 'Usuario')[1];                                    // con el reloj real
    const vfMartin = (await get(`/hce/${idMartinD}/valoracion-funcional`)).json;
    {
      const { ctx: cc, page: pc } = await nuevaPagina();
      await loguearComo(pc, EMAIL, PASSWORD);
      await pc.clock.setFixedTime(new Date('2033-03-15T12:00:00'));                                      // el reloj de la página queda 7 años más tarde
      const anioPagina = await pc.evaluate(() => new Date().getFullYear());
      await pc.evaluate((i) => abrirExpediente(i), idMartinD);
      await pc.waitForSelector('#expTitulo');
      await pc.waitForFunction(() => !!EXP.flujo && !!EXP.mods, null, { timeout: 8000 });
      await pc.click('#tabExp-ic'); await pc.waitForSelector('#btnIcImpreso'); await pc.click('#btnIcImpreso');
      await pc.waitForFunction(() => document.querySelector('#informeContent .doc-datos'), null, { timeout: 8000 });
      const usuarioIC2 = await pc.evaluate(() => [...document.querySelectorAll('#informeContent .doc-datos .data-row')].find((r) => r.querySelector('dt').innerText.trim() === 'Usuario').querySelector('dd').innerText.trim());
      const esperadoIC = `${docApi.expediente.nombre} ${docApi.expediente.apellido}`.trim() + ` · ${edadEn(docApi.expediente.fecha_nac, docApi.informe.fecha)} años`;
      check('3d-edad1', `IC impreso con el reloj del navegador en ${anioPagina}: la edad de Martín no cambia (sigue siendo la de la fecha del informe, ${docApi.informe.fecha})`,
        anioPagina === 2033 && usuarioIC2 === usuarioIC && usuarioIC2 === esperadoIC, JSON.stringify({ real: usuarioIC, simulado: usuarioIC2, esperado: esperadoIC }));
      await pc.click('#informeContent .inf-banner button:has-text("Volver al expediente")');
      await pc.waitForFunction(() => document.getElementById('view-expediente').classList.contains('active'));
      await pc.click('#tabExp-vf'); await pc.waitForSelector('#btnVfReporte'); await pc.click('#btnVfReporte');
      await pc.waitForFunction(() => /Reporte de Valoración Funcional/.test(document.getElementById('informeContent').innerText) && document.querySelector('#informeContent .doc-datos'), null, { timeout: 8000 });
      const rep = await pc.evaluate(() => Object.fromEntries([...document.querySelectorAll('#informeContent .doc-datos .data-row')].map((r) => [r.querySelector('dt').innerText.trim(), r.querySelector('dd').innerText.trim()])));
      const nomM = `${hceM.persona.nombre} ${hceM.persona.apellido}`.trim();
      const eVF = vfMartin.fecha ? edadEn(hceM.persona.fecha_nac, vfMartin.fecha) : null;
      const esperadoVF = eVF === null ? nomM : `${nomM} · ${eVF} ${eVF === 1 ? 'año' : 'años'}`;
      check('3d-edad2', 'reporte de la VF con el reloj en 2033: la edad es la de la fecha de la valoración (no la del navegador), y la fecha del reporte se rotula «Fecha de impresión» (esa sí es la de hoy: 15/03/2033)',
        rep['Nombre'] === esperadoVF && !('Fecha del reporte' in rep) && rep['Fecha de impresión'] === '15/03/2033', JSON.stringify({ rep, esperadoVF }));
      await cc.close();
    }

    /* ---------- el diálogo compartido en un expediente de EJEMPLO: tras confirmar y repintar el panel, el foco no queda en <body> ---------- */
    {
      const { ctx: ce, page: pe } = await nuevaPagina();
      await loguearComo(pe, EMAIL, PASSWORD);
      await pe.evaluate(() => abrirExpedienteDemo(101));
      const boton = pe.locator('button:has-text("Registrar autorización de imagen")').first();
      await boton.waitFor({ timeout: 8000 });
      await boton.focus(); await boton.click();
      await pe.waitForSelector('#modalFlujo.open');
      await pe.click('#modalFlujo button:has-text("Registrar autorización")');
      await pe.waitForFunction(() => !document.getElementById('modalFlujo').classList.contains('open'));
      await pe.waitForTimeout(150);
      const fe = await pe.evaluate(() => ({ enBody: document.activeElement === document.body, tag: document.activeElement.tagName, enTarjeta: !!document.activeElement.closest('#anchor-doc'),
        inerte: document.querySelector('div.layout').inert, botonViejo: !!document.querySelector('#docPanelBody button[onclick^="openAutImagenModal"]') }));
      check('3d-foco', 'expediente de ejemplo: al confirmar «Registrar autorización de imagen» el panel se repinta (el botón que abrió el diálogo desaparece) y el foco pasa al encabezado de esa tarjeta, no a <body>; la app no queda inerte',
        !fe.botonViejo && !fe.enBody && fe.enTarjeta && !fe.inerte, JSON.stringify(fe));
      await ce.close();
    }

    /* ---------- fuentes: ni IC ni VF calculan nada en el navegador ---------- */
    const fuentes = (await leerFuentes(['informe-cierre.js', 'hce-doc-org-vf.js'], 'js/')).map(([, t]) => t);
    const codigo = fuentes.join('\n').replace(/\/\*[\s\S]*?\*\//g, '').split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');   // sin comentarios: primero los de bloque, después los de línea
    const prohibidos = ['lbTotales', 'protTotales', 'calcularDelta', 'deltaInterpreta', 'ALERTA_DELTA', 'categoriaBaremo', 'sugiereNivel', 'genVFBorrador', 'vfAlertaVigencia', 'descDelta', 'colorBanda', 'bandaIdea'].filter((n) => new RegExp('\\b' + n + '\\b').test(codigo));
    check('3d-f', 'el código del IC y de la VF no usa lbTotales/protTotales/calcularDelta/deltaInterpreta/categoriaBaremo/sugiereNivel/genVFBorrador/vfAlertaVigencia (nada de negocio se calcula en el navegador)', prohibidos.length === 0, prohibidos.join(',') || 'limpio');

    /* ---------- accesibilidad: cada campo con su etiqueta; sin desborde horizontal a 390 px ---------- */
    const etiquetas = [];
    for (const [id, tab] of [[idMartinD, 'ic'], [idMartinD, 'vf'], [idSof, 'ic']]) {
      await abrirD(id, tab);
      etiquetas.push(...await pd.evaluate((t) => [...document.querySelectorAll('#panelExp input:not([type=hidden]), #panelExp select, #panelExp textarea')].filter((e) => !(t === 'ic' && e.id === 'ic_add_texto' && false)).map((e) => {
        const l = e.id && document.querySelector(`label[for="${e.id}"]`);
        return { tab: t, id: e.id, nombre: ((l && l.innerText) || e.getAttribute('aria-label') || '').trim() };
      }), tab));
    }
    check('3d-ax', 'todos los campos de las pestañas IC (sin crear y firmada) y VF tienen una etiqueta asociada',
      etiquetas.length > 20 && etiquetas.every((e) => e.nombre), `${etiquetas.length} campos · sin etiqueta: ${etiquetas.filter((e) => !e.nombre).map((e) => e.id).join(',') || 'ninguno'}`);
    const anchos = [];
    for (const w of [390, 1024]) {
      await pd.setViewportSize({ width: w, height: 800 });
      for (const [id, tab] of [[idMartinD, 'ic'], [idMartinD, 'vf'], [idVal, 'ic']]) {
        await abrirD(id, tab);
        await pd.waitForTimeout(300);
        anchos.push(await pd.evaluate(([t, ww]) => ({ t, ww, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }), [tab, w]));
      }
      await abrirD(idMartinD, 'ic'); await verImpreso();
      anchos.push(await pd.evaluate((ww) => ({ t: 'impreso', ww, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }), w));
    }
    await pd.setViewportSize({ width: 1280, height: 720 });
    check('3d-w', 'la página no desborda horizontalmente a 390 y 1024 px en la pestaña IC (Martín y Valentina), la pestaña VF y el documento impreso', anchos.every((a) => a.sw <= a.cw), anchos.map((a) => `${a.t}@${a.ww}:${a.sw}/${a.cw}`).join(' '));
    await cd.close();
  }

  /* ===================================================================================================================
     FASE 3-e · PASADA DE ACCESIBILIDAD Y VISUAL (handoff §5.135)
     Todo con el TECLADO donde la prueba es de teclado (keyboard.press, sin clics): un clic cambia la modalidad del navegador
     y el anillo de foco (:focus-visible) ya no es el que ve quien navega con Tab.
     =================================================================================================================== */
  {
    const { ctx: ce, page: pe } = await nuevaPagina();
    await pe.setViewportSize({ width: 1280, height: 800 });
    const enBody = (p) => p.evaluate(() => document.activeElement === document.body || document.activeElement === document.documentElement || !document.activeElement);
    const idActivo = (p) => p.evaluate(() => { const a = document.activeElement; return a ? (a.id || a.tagName) : null; });
    const reiniciarInicioTab = (p) => p.evaluate(() => { const b = document.body; b.setAttribute('tabindex', '-1'); b.focus(); b.removeAttribute('tabindex'); });
    /* Tab hasta que el foco coincida con `selector` (o con un predicado en el navegador); devuelve cuántos Tab hicieron falta o -1 */
    const alcanzar = async (p, selector, max = 140) => {
      for (let i = 1; i <= max; i++) {
        await p.keyboard.press('Tab');
        if (await p.evaluate((s) => !!document.activeElement && document.activeElement.matches(s), selector)) return i;
      }
      return -1;
    };
    const rgbA = (s) => { const m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)/.exec(s || ''); return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null; };
    const lum = ({ r, g, b }) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const razon = (fg, bg) => { const f = rgbA(fg), b = rgbA(bg); if (!f || !b) return 0;
      const o = f.a < 1 ? { r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a) } : f;
      const [x, y] = [lum(o), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
    /* Contorno del control enfocado y el fondo que realmente queda detrás (se esconde el control y se mira a su lado). */
    const anilloActual = (p) => p.evaluate(() => {
      const el = document.activeElement; if (!el || el === document.body) return null;
      const cs = getComputedStyle(el), r = el.getBoundingClientRect();
      const ring = { estilo: cs.outlineStyle, ancho: parseFloat(cs.outlineWidth), color: cs.outlineColor, offset: parseFloat(cs.outlineOffset) };
      const opaco = (n) => { while (n) { const bg = getComputedStyle(n).backgroundColor; const m = bg.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/); if (m && (m[4] === undefined || +m[4] === 1)) return bg; n = n.parentElement; } return 'rgb(255, 255, 255)'; };
      let bg;
      if (ring.offset < 0) bg = opaco(el);
      else {
        const sep = ring.offset + ring.ancho / 2 + 1;
        const x = Math.max(1, Math.min(innerWidth - 1, r.left - sep)), y = Math.max(1, Math.min(innerHeight - 1, r.top + r.height / 2));
        const v = el.style.visibility; el.style.visibility = 'hidden';
        const pila = document.elementsFromPoint(x, y).filter((e) => e !== el && !el.contains(e));
        el.style.visibility = v; bg = opaco(pila[0] || el.parentElement);
      }
      return { id: el.id || el.className || el.tagName, tag: el.tagName, fv: el.matches(':focus-visible'), ring, bg };
    });

    // ---------- sesión por teclado: login → listado ----------
    await pe.goto(urlDemo());
    await pe.waitForFunction(() => document.activeElement && document.activeElement.id === 'loginUser');
    await pe.keyboard.type(EMAIL); await pe.keyboard.press('Tab'); await pe.keyboard.type(PASSWORD); await pe.keyboard.press('Enter');
    await pe.waitForSelector('#loginScreen.hidden', { state: 'attached', timeout: 8000 });
    await pe.waitForFunction(() => /Mostrando \d+ de/.test(document.getElementById('listaResumen').textContent), null, { timeout: 8000 });
    const pasos = [];
    pasos.push(['login → listado', await idActivo(pe), await enBody(pe)]);

    /* ---------- 3e-skip: el enlace de salto es el primer Tab y Enter lleva el foco a <main> ---------- */
    await reiniciarInicioTab(pe);
    await pe.keyboard.press('Tab');
    const skip1 = await pe.evaluate(() => { const a = document.activeElement; const r = a.getBoundingClientRect();
      return { clase: a.className, texto: a.textContent.trim(), visible: r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight && r.width > 40, inerte: !!a.closest('[inert]') }; });
    await pe.keyboard.press('Enter');
    const skip2 = await pe.evaluate(() => { const a = document.activeElement, m = document.querySelector('main'); return { id: a.id, tag: a.tagName, dentro: m.contains(a) || a === m, main: a === m }; });
    check('3e-skip', 'el enlace «Saltar al contenido» es el PRIMER Tab, aparece a la vista al enfocarse y Enter lleva el foco a <main> (id=contenido)',
      /skip-link/.test(skip1.clase) && /Saltar al contenido/.test(skip1.texto) && skip1.visible && !skip1.inerte && skip2.dentro && skip2.id === 'contenido', JSON.stringify({ skip1, skip2 }));
    await pe.keyboard.press('Tab');
    const trasSalto = await pe.evaluate(() => ({ dentroDeMain: document.querySelector('main').contains(document.activeElement), id: document.activeElement.id || document.activeElement.tagName }));
    check('3e-skip2', 'después del salto, el siguiente Tab es un control de la pantalla (dentro de <main>), no la barra lateral ni la superior',
      trasSalto.dentroDeMain, JSON.stringify(trasSalto));

    /* ---------- 3e-kbd: login → listado → abrir a Martín → cada pestaña → IC impreso → volver, solo con el teclado ---------- */
    await reiniciarInicioTab(pe);
    const nTab = await alcanzar(pe, 'button[aria-label^="Abrir expediente de Martín"]', 120);
    pasos.push(['Tab hasta «Abrir expediente» de Martín', nTab, await enBody(pe)]);
    await pe.keyboard.press('Enter');
    await pe.waitForSelector('#expTitulo', { timeout: 8000 });
    await pe.waitForFunction(() => !!EXP.flujo && !!EXP.mods, null, { timeout: 8000 });
    pasos.push(['Enter abre el expediente', await idActivo(pe), await enBody(pe)]);
    const nTabs = await alcanzar(pe, '.exp-tab[aria-selected="true"]', 60);
    pasos.push(['Tab hasta la pestaña HCE-00', nTabs, await enBody(pe)]);
    for (const k of ['ci', 'lb', 'pa', 'pb', 'ic', 'vf']) {
      await pe.keyboard.press('ArrowRight');
      await pe.waitForFunction((t) => document.getElementById('tabExp-' + t).getAttribute('aria-selected') === 'true' && document.activeElement.id === 'tabExp-' + t, k, { timeout: 4000 });
      await pe.waitForFunction(() => !/Cargando/.test(document.getElementById('panelExp').innerText), null, { timeout: 8000 });
      pasos.push(['pestaña ' + k.toUpperCase(), await idActivo(pe), await enBody(pe)]);
    }
    await pe.keyboard.press('ArrowLeft');                                                // vuelve a IC: es la que tiene «Ver informe impreso»
    await pe.waitForFunction(() => document.activeElement.id === 'tabExp-ic' && !/Cargando/.test(document.getElementById('panelExp').innerText), null, { timeout: 8000 });
    const nImp = await alcanzar(pe, '#btnIcImpreso', 40);
    await pe.keyboard.press('Enter');
    await pe.waitForSelector('.print-wrap', { timeout: 8000 });
    await pe.waitForFunction(() => document.activeElement.id === 'infTitulo', null, { timeout: 4000 });
    pasos.push(['IC impreso', await idActivo(pe), await enBody(pe)]);
    const nVol = await alcanzar(pe, '.inf-botones .btn-print:last-child', 12);
    await pe.keyboard.press('Enter');
    await pe.waitForFunction(() => document.activeElement.id === 'tabExp-ic', null, { timeout: 4000 });
    pasos.push(['volver al expediente', await idActivo(pe), await enBody(pe)]);
    check('3e-kbd', 'solo teclado (keyboard.press, sin clics): login → listado → abrir a Martín → HCE-00, CI, LB, PA, PB, IC, VF → informe impreso → volver; el foco nunca cae en <body> después de una acción',
      nTab > 0 && nTabs > 0 && nImp > 0 && nVol > 0 && pasos.every(([, , cuerpo]) => cuerpo === false) && pasos.length === 12,
      pasos.map(([n, id, c]) => `${n}→${id}${c === true ? ' (BODY)' : ''}`).join(' · ').slice(0, 520));

    // ---------- datos de los pasos siguientes: un expediente nuevo (editores vacíos) y un IC firmado sin recibí ----------
    const token = await pe.evaluate(() => sessionStorage.getItem('ippu.token'));
    const api = async (metodo, ruta, body) => { const r = await fetch(API + ruta, { method: metodo, headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
      return { status: r.status, json: r.status === 204 ? null : await r.json() }; };
    const sufE = String(Date.now()).slice(-6);
    const gruposE = (await api('GET', '/grupos')).json;
    const anioE = Math.max(...gruposE.map((g) => g.anio));
    const escolaresE = gruposE.find((g) => g.nombre === 'Escolares' && g.anio === anioE);
    const profsE = (await api('GET', '/profesionales')).json;
    const idGonE = profsE.find((x) => x.nombre === 'Dr. González').id, idTorE = profsE.find((x) => x.nombre === 'Mtra. Torres').id;
    const nuevoE = async (nombre, pref) => (await api('POST', '/hce', { persona: { nombre: nombre + sufE, apellido: 'Tresé', ci: pref + sufE + '5', fecha_nac: '2016-06-06' }, grupo_id: escolaresE.id })).json.data.id;
    const idEditor = await nuevoE('Editor', '1');
    const idRecibi = await nuevoE('Recibi', '2');
    const icBody = { anio: anioE, fecha: '2026-11-20', val_tec1: 'Valoración 1.', val_tec2: 'Valoración 2.', recomendaciones: 'Recomendaciones.', orientaciones: 'Orientaciones.', sint_escala: { esc_1: 'a', esc_2: 'b', esc_3: 'c', esc_4: 'd' } };
    const icCreado = await api('POST', `/hce/${idRecibi}/informe-cierre`, icBody);
    const icFirmado = await api('POST', `/informe-cierre/${icCreado.json.data.id}/firmar`, { firmantes: [idGonE, idTorE] });
    const abrirE = async (id, tab) => {
      await pe.evaluate((i) => abrirExpediente(i), id);
      await pe.waitForSelector('#expTitulo');
      await pe.waitForFunction(() => !!EXP.flujo && !!EXP.mods, null, { timeout: 8000 });
      if (tab) { await pe.click('#tabExp-' + tab); await pe.waitForFunction(() => !/Cargando/.test(document.getElementById('panelExp').innerText), null, { timeout: 8000 }); await pe.waitForTimeout(150); }
    };

    /* ---------- 3e-ring: un control de cada familia alcanzado con Tab tiene contorno computado y ≥ 3:1 contra el fondo de detrás ---------- */
    const familias = [];
    const medir = async (familia, selector, preparar) => {
      if (preparar) await preparar();
      await reiniciarInicioTab(pe);
      const n = await alcanzar(pe, selector, 160);
      const a = n > 0 ? await anilloActual(pe) : null;
      familias.push({ familia, selector, n, a, r: a ? razon(a.ring.color, a.bg) : 0 });
    };
    await pe.evaluate(() => go('inicio'));
    await medir('enlace', 'a.skip-link');
    await medir('ítem de la barra lateral', '.navitem');
    await medir('botón', '#btnNuevoNNA');
    await medir('campo de texto', '#searchNNA');
    await medir('lista desplegable', '#filtroGrupo');
    await abrirE(idEditor, 'lb');
    await medir('pestaña', '.exp-tab[aria-selected="true"]');
    await medir('botón de puntaje', '#dim-D1 .opcion');
    await medir('área de texto', '#lb_sintesis');
    check('3e-ring', 'un control de cada familia alcanzado con Tab (enlace, ítem de la barra lateral, botón, campo de texto, lista, pestaña, botón de puntaje, área de texto) tiene un contorno sólido y ≥ 3:1 contra el fondo que queda detrás',
      familias.length === 8 && familias.every((f) => f.n > 0 && f.a && f.a.fv && f.a.ring.estilo === 'solid' && f.a.ring.ancho >= 2 && f.r >= 3),
      familias.map((f) => `${f.familia}: ${f.a ? f.a.ring.color.replace(/\s/g, '') + ' ' + f.a.ring.ancho + 'px sobre ' + f.a.bg.replace(/\s/g, '') + ' → ' + f.r.toFixed(2) : 'NO ALCANZADO'}`).join(' · ').slice(0, 700));
    const sinApagar = await pe.evaluate(async () => { const css = await (await fetch('css/estilos.css')).text(); const re = /([^{}\n]+)\{([^}]*)\}/g; const out = []; let m;
      while ((m = re.exec(css))) if (/outline\s*:\s*(none|0)\b/.test(m[2]) && !/^\s*main\b/.test(m[1])) out.push(m[1].trim()); return out; });
    check('3e-ring2', 'ningún selector del CSS apaga el contorno (`outline:none`/`0`) ni lo reemplaza por un box-shadow de foco; la única excepción es <main>, el destino del salto', sinApagar.length === 0, sinApagar.join(' · '));

    /* ---------- 3e-roving: el editor de IDEA tiene UN punto de Tab por dimensión y las flechas mueven el foco dentro de ella ---------- */
    const rov0 = await pe.evaluate(() => ({ dims: document.querySelectorAll('#ideaForm .dimension').length, paradas: [...document.querySelectorAll('#ideaForm .dimension')].map((d) => [...d.querySelectorAll('button[data-dim]')].filter((b) => b.tabIndex === 0).length) }));
    const ordenD2 = await pe.evaluate(() => [...document.querySelectorAll('#dim-D2 button[data-dim]')].map((b) => b.dataset.ns ? 'NS' : (b.dataset.v !== undefined ? b.dataset.v : b.dataset.inter)));
    await pe.focus('#dim-D2 button[data-dim]:not([tabindex="-1"])');
    const rov0b = await pe.evaluate(() => (document.activeElement.dataset.v !== undefined ? document.activeElement.dataset.v : document.activeElement.dataset.inter));
    await pe.keyboard.press('ArrowRight');
    const rov1 = await pe.evaluate(() => ({ foco: document.activeElement.dataset.v || document.activeElement.dataset.inter || document.activeElement.dataset.ns, dim: document.activeElement.dataset.dim, ti: document.activeElement.tabIndex }));
    await pe.keyboard.press('End');
    const rov2 = await pe.evaluate(() => ({ ns: !!document.activeElement.dataset.ns }));
    await pe.keyboard.press('Enter');
    const rov3 = await pe.evaluate(() => ({ sel: document.querySelector('#dim-D2 .inter-ns').getAttribute('aria-pressed'), paradas: [...document.querySelectorAll('#dim-D2 button[data-dim]')].filter((b) => b.tabIndex === 0).length, activo: document.activeElement.dataset.ns }));
    await pe.keyboard.press('Home');
    const rov4 = await pe.evaluate(() => ({ paradas: [...document.querySelectorAll('#dim-D2 button[data-dim]')].filter((b) => b.tabIndex === 0).length, v: document.activeElement.dataset.v, sigueNS: document.querySelector('#dim-D2 .inter-ns').getAttribute('aria-pressed') }));
    const totalParadas = await pe.evaluate(() => [...document.querySelectorAll('#panelExp button, #panelExp input, #panelExp select, #panelExp textarea, #panelExp summary, #panelExp a')].filter((e) => e.tabIndex === 0 && !e.disabled && e.offsetParent !== null).length);
    check('3e-roving', 'editor de IDEA: un punto de Tab por dimensión (12 de 12, no 120), las flechas/Inicio/Fin mueven el foco dentro de la dimensión sin cambiar la selección, Enter elige y el punto de Tab sigue al elegido',
      rov0.dims === 12 && rov0.paradas.every((n) => n === 1) && rov0b === ordenD2[0] && rov1.dim === 'D2' && rov1.foco === ordenD2[1] && rov1.ti === 0 && rov2.ns && rov3.sel === 'true' && rov3.paradas === 1 && rov3.activo === '1' && rov4.paradas === 1 && rov4.v === ordenD2[0] && rov4.sigueNS === 'true',
      JSON.stringify({ orden: ordenD2.join(','), rov0: { dims: rov0.dims, unaPorDim: rov0.paradas.every((n) => n === 1) }, rov1, rov2, rov3, rov4, paradasEnLaPantalla: totalParadas }));

    /* ---------- 3e-trap: cada diálogo atrapa el foco y lo devuelve al cerrar ---------- */
    // alta
    await pe.evaluate(() => go('inicio'));
    await pe.focus('#btnNuevoNNA'); await pe.keyboard.press('Enter');
    await pe.waitForSelector('#modalAlta.open');
    await pe.waitForFunction(() => document.querySelectorAll('#f_grupo option').length > 1 && !document.getElementById('f_grupo').disabled, null, { timeout: 8000 });
    const dentro = [];
    for (let i = 0; i < 40; i++) { await pe.keyboard.press('Tab'); dentro.push(await pe.evaluate(() => !!document.activeElement.closest('#modalAlta'))); }
    for (let i = 0; i < 6; i++) { await pe.keyboard.press('Shift+Tab'); dentro.push(await pe.evaluate(() => !!document.activeElement.closest('#modalAlta'))); }
    await pe.keyboard.press('Escape');
    await pe.waitForFunction(() => !document.getElementById('modalAlta').classList.contains('open'));
    const alta1 = await pe.evaluate(() => ({ foco: document.activeElement.id, inerte: document.querySelector('div.layout').inert || document.querySelector('header.topbar').inert }));
    // alta abierta desde un botón que desaparece (se repinta el expediente): el foco cae en un destino estable, nunca en <body>
    await abrirE(idEditor, 'hce00');
    await pe.focus('#expHead .banda-editar'); await pe.keyboard.press('Enter');
    await pe.waitForSelector('#modalAlta.open');
    await pe.evaluate(() => { pintarCabeceraExp(); });           // el repintado destruye el botón que abrió el diálogo
    await pe.keyboard.press('Escape');
    await pe.waitForFunction(() => !document.getElementById('modalAlta').classList.contains('open'));
    await pe.waitForTimeout(100);
    const alta2 = await pe.evaluate(() => ({ foco: document.activeElement.id || document.activeElement.tagName, enBody: document.activeElement === document.body }));
    check('3e-trap1', 'diálogo de alta/edición: Tab y Mayús+Tab nunca salen del diálogo (46 pulsaciones), Esc lo cierra devolviendo el foco a quien lo abrió; si quien lo abrió ya no existe, el foco va a un destino estable (el título del expediente), no a <body>',
      dentro.every(Boolean) && alta1.foco === 'btnNuevoNNA' && !alta1.inerte && !alta2.enBody && alta2.foco === 'expTitulo', JSON.stringify({ alta1, alta2, salidas: dentro.filter((d) => !d).length }));
    // recibí (diálogo del flujo): abierto desde su botón real; Tab atrapado; Esc devuelve el foco al botón
    await abrirE(idRecibi, 'ic');
    await pe.focus('#btnIcRecibi'); await pe.keyboard.press('Enter');
    await pe.waitForSelector('#modalFlujo.open'); await pe.waitForFunction(() => document.activeElement.id === 'mfFirmante');
    const dentro2 = [];
    for (let i = 0; i < 14; i++) { await pe.keyboard.press('Tab'); dentro2.push(await pe.evaluate(() => !!document.activeElement.closest('#modalFlujo'))); }
    await pe.keyboard.press('Shift+Tab'); dentro2.push(await pe.evaluate(() => !!document.activeElement.closest('#modalFlujo')));
    await pe.keyboard.press('Escape');
    await pe.waitForFunction(() => !document.getElementById('modalFlujo').classList.contains('open'));
    const rec1 = await pe.evaluate(() => ({ foco: document.activeElement.id, inerte: document.querySelector('div.layout').inert }));
    check('3e-trap2', 'diálogo del recibí (#modalFlujo): Tab/Mayús+Tab quedan dentro; Esc lo cierra (sin tipear nada, sin preguntar) y el foco vuelve a «Registrar recibí»',
      dentro2.every(Boolean) && rec1.foco === 'btnIcRecibi' && !rec1.inerte, JSON.stringify({ rec1, salidas: dentro2.filter((d) => !d).length }));
    // login: Tab no sale (el enlace de salto y la app están inertes)
    const pl = (await nuevaPagina()); await pl.page.goto(urlDemo());
    await pl.page.waitForFunction(() => document.activeElement && document.activeElement.id === 'loginUser');
    const enLogin = [];
    for (let i = 0; i < 8; i++) { await pl.page.keyboard.press('Tab'); enLogin.push(await pl.page.evaluate(() => ({ dentro: !!document.activeElement.closest('#loginScreen'), skip: document.activeElement.classList.contains('skip-link') }))); }
    for (let i = 0; i < 4; i++) { await pl.page.keyboard.press('Shift+Tab'); enLogin.push(await pl.page.evaluate(() => ({ dentro: !!document.activeElement.closest('#loginScreen'), skip: document.activeElement.classList.contains('skip-link') }))); }
    const skipInerte = await pl.page.evaluate(() => document.querySelector('a.skip-link').inert);
    check('3e-trap3', 'login: Tab y Mayús+Tab quedan dentro del diálogo y nunca llegan al enlace de salto ni a la app (inertes) mientras se ve',
      enLogin.every((x) => x.dentro && !x.skip) && skipInerte, JSON.stringify({ salidas: enLogin.filter((x) => !x.dentro || x.skip).length, skipInerte }));
    await pl.ctx.close();
    // confirmaciones de firma (en la barra de la pantalla, no son diálogos modales): Esc cancela y el foco vuelve a «Firmar»
    await abrirE(idEditor, 'lb');
    await pe.focus('#btnEvFirmar'); await pe.keyboard.press('Enter');
    await pe.waitForSelector('#btnEvConfirmar');
    const conf1 = await idActivo(pe);
    await pe.keyboard.press('Tab'); const conf2 = await pe.evaluate(() => !!document.activeElement.closest('.ev-confirma'));
    await pe.keyboard.press('Escape');
    const conf3 = await pe.evaluate(() => ({ foco: document.activeElement.id, sigue: !!document.getElementById('btnEvConfirmar') }));
    check('3e-trap4', 'confirmación de firma (barra del editor): el foco entra en «Confirmar firma», Tab recorre sus botones y Esc la cancela devolviendo el foco a «Firmar» (sin pedirle nada a la API)',
      conf1 === 'btnEvConfirmar' && conf2 && conf3.foco === 'btnEvFirmar' && !conf3.sigue, JSON.stringify({ conf1, conf2, conf3 }));

    /* ---------- 3e-confirm: cerrar con datos tipeados pide confirmación; sin datos, no ---------- */
    await pe.evaluate(() => go('inicio'));
    await pe.focus('#btnNuevoNNA'); await pe.keyboard.press('Enter');
    await pe.waitForSelector('#modalAlta.open'); await pe.waitForFunction(() => !document.getElementById('f_grupo').disabled, null, { timeout: 8000 });
    await pe.keyboard.press('Escape');                                                  // sin tipear nada: cierra sin preguntar
    const sinDatos = await pe.evaluate(() => ({ abierto: document.getElementById('modalAlta').classList.contains('open'), banda: !!document.querySelector('.confirmar-descarte') }));
    await pe.focus('#btnNuevoNNA'); await pe.keyboard.press('Enter');
    await pe.waitForSelector('#modalAlta.open'); await pe.waitForFunction(() => !document.getElementById('f_grupo').disabled, null, { timeout: 8000 });
    await pe.fill('#f_nombre', 'Dato tipeado'); await pe.fill('#f_ci', '1.234.567-8');
    await pe.keyboard.press('Escape');
    await pe.waitForSelector('.confirmar-descarte');
    const c1 = await pe.evaluate(() => ({ abierto: document.getElementById('modalAlta').classList.contains('open'), rol: document.querySelector('.confirmar-descarte').getAttribute('role'), foco: document.activeElement.id,
      texto: document.querySelector('.confirmar-descarte').innerText.replace(/\s+/g, ' '), nombre: document.getElementById('f_nombre').value }));
    await pe.keyboard.press('Escape');                                                  // Esc sobre la confirmación = seguir editando
    const c2 = await pe.evaluate(() => ({ abierto: document.getElementById('modalAlta').classList.contains('open'), banda: !!document.querySelector('.confirmar-descarte'), nombre: document.getElementById('f_nombre').value, ci: document.getElementById('f_ci').value, foco: document.activeElement.id }));
    await pe.click('.modal-head .x');                                                   // × = lo mismo que Esc
    await pe.waitForSelector('.confirmar-descarte');
    await pe.click('#btnCdSeguir');
    const c3 = await pe.evaluate(() => ({ abierto: document.getElementById('modalAlta').classList.contains('open'), banda: !!document.querySelector('.confirmar-descarte'), nombre: document.getElementById('f_nombre').value }));
    await pe.keyboard.press('Escape'); await pe.waitForSelector('.confirmar-descarte');
    await pe.click('#btnCdDescartar');
    await pe.waitForFunction(() => !document.getElementById('modalAlta').classList.contains('open'));
    const c4 = await pe.evaluate(() => ({ foco: document.activeElement.id, inerte: document.querySelector('div.layout').inert, nombre: document.getElementById('f_nombre').value, ci: document.getElementById('f_ci').value, banda: !!document.querySelector('.confirmar-descarte') }));
    check('3e-confirm1', 'alta: sin tipear nada Esc cierra sin preguntar; con datos tipeados Esc pide confirmación (role=alert, foco en «Seguir editando»); Esc otra vez o «Seguir editando» conservan lo tipeado y el diálogo; ×  también pregunta; «Descartar y cerrar» cierra, borra los campos y devuelve el foco',
      !sinDatos.abierto && !sinDatos.banda && c1.abierto && c1.rol === 'alert' && c1.foco === 'btnCdSeguir' && /datos sin guardar/.test(c1.texto) && c1.nombre === 'Dato tipeado'
        && c2.abierto && !c2.banda && c2.nombre === 'Dato tipeado' && c2.ci === '1.234.567-8' && c2.foco === 'f_ci' && c3.abierto && !c3.banda && c3.nombre === 'Dato tipeado'
        && c4.foco === 'btnNuevoNNA' && !c4.inerte && c4.nombre === '' && c4.ci === '' && !c4.banda, JSON.stringify({ sinDatos, c1, c2, c3, c4 }).slice(0, 600));
    // edición: cambiar un campo y volver a dejar el original NO cuenta como datos sin guardar
    await abrirE(idEditor, 'hce00');
    await pe.focus('#expHead .banda-editar'); await pe.keyboard.press('Enter');
    await pe.waitForSelector('#modalAlta.open'); await pe.waitForFunction(() => !document.getElementById('f_grupo').disabled && document.querySelectorAll('#f_grupo option').length > 1, null, { timeout: 8000 });
    const orig = await pe.inputValue('#f_loc');
    await pe.fill('#f_loc', 'Otra localidad'); await pe.fill('#f_loc', orig);
    await pe.keyboard.press('Escape');
    const edRevertido = await pe.evaluate(() => ({ abierto: document.getElementById('modalAlta').classList.contains('open'), banda: !!document.querySelector('.confirmar-descarte') }));
    check('3e-confirm2', 'edición: tipear y volver al valor original no cuenta como datos sin guardar (Esc cierra sin preguntar)', !edRevertido.abierto && !edRevertido.banda, JSON.stringify(edRevertido));
    // recibí: tipear, Cancelar → confirmación; descartar
    await abrirE(idRecibi, 'ic');
    await pe.focus('#btnIcRecibi'); await pe.keyboard.press('Enter');
    await pe.waitForSelector('#modalFlujo.open'); await pe.waitForFunction(() => document.activeElement.id === 'mfFirmante');
    await pe.fill('#mfFirmante', 'Otra persona'); await pe.click('#modalFlujo .modal-foot .btn-ghost');          // Cancelar
    await pe.waitForSelector('#modalFlujo .confirmar-descarte');
    const r1 = await pe.evaluate(() => ({ abierto: document.getElementById('modalFlujo').classList.contains('open'), foco: document.activeElement.id, valor: document.getElementById('mfFirmante').value }));
    await pe.click('#btnCdDescartar');
    await pe.waitForFunction(() => !document.getElementById('modalFlujo').classList.contains('open'));
    const r2 = await pe.evaluate(() => ({ foco: document.activeElement.id, valor: (document.getElementById('mfFirmante') || { value: null }).value, inerte: document.querySelector('div.layout').inert }));
    check('3e-confirm3', 'recibí: tipear y pulsar Cancelar (o ×, o Esc) pide confirmación; descartar cierra, vacía los campos y devuelve el foco a «Registrar recibí»',
      r1.abierto && r1.foco === 'btnCdSeguir' && r1.valor === 'Otra persona' && r2.foco === 'btnIcRecibi' && r2.valor === '' && !r2.inerte, JSON.stringify({ r1, r2 }));
    // «Salir» con el diálogo abierto y datos tipeados: limpia SIN preguntar
    await pe.evaluate(() => go('inicio'));
    await pe.focus('#btnNuevoNNA'); await pe.keyboard.press('Enter');
    await pe.waitForSelector('#modalAlta.open'); await pe.fill('#f_nombre', 'Dato tipeado antes de salir');
    await pe.evaluate(() => logout());
    await pe.waitForSelector('#loginScreen:not(.hidden)');
    const salir = await pe.evaluate(() => ({ abierto: document.getElementById('modalAlta').classList.contains('open'), banda: !!document.querySelector('.confirmar-descarte'), nombre: document.getElementById('f_nombre').value, login: !document.getElementById('loginScreen').classList.contains('hidden'), foco: document.activeElement.id }));
    check('3e-confirm4', '«Salir» con el diálogo abierto y datos tipeados cierra y limpia SIN pedir confirmación (el foco queda en el login)', !salir.abierto && !salir.banda && salir.nombre === '' && salir.login && salir.foco === 'loginUser', JSON.stringify(salir));
    await ce.close();
  }

  /* ---------- 3e-flow: sin desborde horizontal en 1280, 1024 (y 320 en el listado y HCE-00) en TODAS las pantallas conectadas ---------- */
  {
    const { ctx: cf, page: pf } = await nuevaPagina();
    await loguear(pf);
    await pf.waitForFunction(() => /Mostrando \d+ de/.test(document.getElementById('listaResumen').textContent), null, { timeout: 8000 });
    const tokenF = await pf.evaluate(() => sessionStorage.getItem('ippu.token'));
    const idMartinF = (await (await fetch(API + '/hce?nombre=Mart%C3%ADn&limit=5', { headers: { Authorization: 'Bearer ' + tokenF } })).json()).find((h) => h.persona.nombre === 'Martín').id;
    const abrirF = async (id, tab) => {
      await pf.evaluate((i) => abrirExpediente(i), id); await pf.waitForSelector('#expTitulo');
      await pf.waitForFunction(() => !!EXP.flujo && !!EXP.mods, null, { timeout: 8000 });
      if (tab && tab !== 'hce00') { await pf.click('#tabExp-' + tab); }
      await pf.waitForFunction(() => !/Cargando/.test(document.getElementById('panelExp').innerText), null, { timeout: 8000 });
      await pf.waitForTimeout(200);
    };
    const medidas = [];
    const ancho = async (nombre, w) => { await pf.waitForTimeout(80); medidas.push(await pf.evaluate(([n, ww]) => ({ n, ww, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, iw: innerWidth }), [nombre, w])); };
    for (const w of [1280, 1024, 320]) {
      await pf.setViewportSize({ width: w, height: w === 320 ? 640 : (w === 1024 ? 768 : 800) });
      await pf.evaluate(() => go('inicio')); await pf.waitForTimeout(150);
      await ancho('listado', w);
      await abrirF(idMartinF, 'hce00'); await ancho('HCE-00', w);
      if (w === 320) continue;                                  // el 320 px es de la pantalla de listado y de HCE-00
      for (const t of ['ci', 'lb', 'pa', 'pb', 'ic', 'vf']) { await abrirF(idMartinF, t); await ancho(t.toUpperCase(), w); }
      await abrirF(idMartinF, 'ic'); await pf.click('#btnIcImpreso'); await pf.waitForSelector('.print-wrap'); await pf.waitForTimeout(250); await ancho('IC impreso', w);
      await pf.evaluate(() => openAlta()); await pf.waitForSelector('#modalAlta.open'); await pf.waitForTimeout(150); await ancho('diálogo de alta', w);
      await pf.evaluate(() => closeAlta()); await pf.waitForFunction(() => !document.getElementById('modalAlta').classList.contains('open'));
    }
    // el editor de IDEA y el de protocolos (borradores vacíos) también
    const sufF = String(Date.now()).slice(-6);
    const gF = (await (await fetch(API + '/grupos', { headers: { Authorization: 'Bearer ' + tokenF } })).json());
    const escF = gF.find((g) => g.nombre === 'Escolares');
    const idEdF = (await (await fetch(API + '/hce', { method: 'POST', headers: { Authorization: 'Bearer ' + tokenF, 'Content-Type': 'application/json' }, body: JSON.stringify({ persona: { nombre: 'Flow' + sufF, apellido: 'Ancho', ci: '4' + sufF + '6', fecha_nac: '2016-07-07' }, grupo_id: escF.id }) })).json()).data.id;
    for (const w of [1280, 1024]) {
      await pf.setViewportSize({ width: w, height: w === 1024 ? 768 : 800 });
      for (const t of ['lb', 'pa', 'pb', 'ic', 'vf']) { await abrirF(idEdF, t); await ancho('editor ' + t.toUpperCase(), w); }
      await abrirF(idEdF, 'ci'); await ancho('CI pendiente', w);
    }
    const mal = medidas.filter((m) => m.sw !== m.cw);
    check('3e-flow', 'sin desborde horizontal de la página (scrollWidth == ancho de la ventana) a 1280 y 1024 px en listado, HCE-00, CI, LB, PA, PB, IC, VF, informe impreso, diálogo de alta y los editores vacíos, y a 320 px en el listado y HCE-00',
      medidas.length >= 30 && mal.length === 0, mal.length ? 'DESBORDAN: ' + mal.map((m) => `${m.n}@${m.ww}:${m.sw}/${m.cw}`).join(', ') : `${medidas.length} medidas · ${medidas.filter((m) => m.ww === 320).map((m) => m.n + '@320').join(',')}`);
    // tablas anchas: scrollean DENTRO de su contenedor, no ensanchan la página
    await pf.setViewportSize({ width: 1024, height: 768 });
    await abrirF(idMartinF, 'ic');
    const tab1024 = await pf.evaluate(() => { const t = document.querySelector('#panelExp .tabla-scroll'); return t ? { sw: t.scrollWidth, cw: t.clientWidth, over: getComputedStyle(t).overflowX } : null; });
    check('3e-flow2', 'las tablas anchas (tabla cuantitativa del IC) viven en un contenedor con scroll propio (overflow-x:auto)', !!tab1024 && /auto|scroll/.test(tab1024.over), JSON.stringify(tab1024));
    await cf.close();
  }

  /* ---------- 3e-i18n: mensajes de validación en castellano (solo presentación) ---------- */
  {
    const { ctx: ci, page: pi } = await nuevaPagina();
    await loguear(pi);
    await pi.waitForFunction(() => /Mostrando \d+ de/.test(document.getElementById('listaResumen').textContent), null, { timeout: 8000 });
    const tokenI = await pi.evaluate(() => sessionStorage.getItem('ippu.token'));
    const apiI = async (metodo, ruta, body) => { const r = await fetch(API + ruta, { method: metodo, headers: { Authorization: 'Bearer ' + tokenI, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) }); return { status: r.status, json: r.status === 204 ? null : await r.json() }; };
    const sufI = String(Date.now()).slice(-6);
    const gI = (await apiI('GET', '/grupos')).json, escI = gI.find((g) => g.nombre === 'Escolares');
    const idVfI = (await apiI('POST', '/hce', { persona: { nombre: 'Idioma' + sufI, apellido: 'Vf', ci: '5' + sufI + '7', fecha_nac: '2016-08-08' }, grupo_id: escI.id })).json.data.id;
    await apiI('POST', `/hce/${idVfI}/valoracion-funcional`, { estado: 'En trámite' });
    const abrirI = async (id, tab) => { await pi.evaluate((i) => abrirExpediente(i), id); await pi.waitForSelector('#expTitulo'); await pi.waitForFunction(() => !!EXP.flujo && !!EXP.mods, null, { timeout: 8000 });
      await pi.click('#tabExp-' + tab); await pi.waitForFunction(() => !/Cargando/.test(document.getElementById('panelExp').innerText), null, { timeout: 8000 }); await pi.waitForTimeout(150); };
    // 1) un % que Pydantic rechaza ("abc") → mensaje en castellano junto al campo, el campo se conserva
    await abrirI(idVfI, 'vf');
    await pi.fill('#vf_pct', 'abc');
    const rVf = pi.waitForResponse((r) => r.request().method() === 'PATCH' && /valoracion-funcional/.test(r.url()));
    await pi.click('#btnVfGuardar');
    const respVf = await rVf; const jsonVf = await respVf.json();
    await pi.waitForSelector('#vfErrores:not([hidden])');
    const i1 = await pi.evaluate(() => ({ campo: document.getElementById('err_vf_pct').textContent, resumen: document.getElementById('vfErrores').innerText.replace(/\s+/g, ' '), invalido: document.getElementById('vf_pct').getAttribute('aria-invalid'), valor: document.getElementById('vf_pct').value }));
    check('3e-i18n1', 'VF con % «abc»: la API contesta 422 con el mensaje de Pydantic en inglés («Input should be a valid decimal») y la pantalla lo muestra en castellano junto al campo % (y en el resumen), sin tocar el campo ni lo tipeado',
      respVf.status() === 422 && /valid decimal/i.test(jsonVf.detail[0].mensaje) && jsonVf.detail[0].campo === 'pct' && /número válido/i.test(i1.campo) && !/Input should/i.test(i1.campo + i1.resumen)
        && /Porcentaje de discapacidad: .*número válido/.test(i1.resumen) && i1.invalido === 'true' && i1.valor === 'abc', JSON.stringify({ api: jsonVf.detail[0], ui: i1 }).slice(0, 420));
    // 2) un tipo de Pydantic que no está en la tabla → mensaje genérico en castellano (la respuesta se simula en la red, no se toca la API)
    await pi.route(/\/valoracion-funcional$/, (route) => route.request().method() === 'PATCH'
      ? route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ code: 'validation_error', detail: [{ campo: 'pct', mensaje: 'Input should be a valid frobnicator' }] }) }) : route.continue());
    await pi.click('#btnVfGuardar');
    await pi.waitForFunction(() => /válido/.test(document.getElementById('err_vf_pct').textContent) && !/frobnicator/.test(document.getElementById('err_vf_pct').textContent), null, { timeout: 4000 });
    const i2 = await pi.evaluate(() => ({ campo: document.getElementById('err_vf_pct').textContent, resumen: document.getElementById('vfErrores').innerText.replace(/\s+/g, ' ') }));
    await pi.unroute(/\/valoracion-funcional$/);
    check('3e-i18n2', 'un tipo de Pydantic sin traducción («Input should be a valid frobnicator») se muestra con el mensaje genérico en castellano, nunca en inglés',
      i2.campo === 'El valor ingresado no es válido.' && !/Input should|frobnicator/i.test(i2.campo + i2.resumen), JSON.stringify(i2));
    // 3) un 422 de negocio ya en castellano (PA: puntaje 1 sin observación) pasa SIN cambios
    const idPaI = (await apiI('POST', '/hce', { persona: { nombre: 'Negocio' + sufI, apellido: 'Pa', ci: '6' + sufI + '8', fecha_nac: '2016-09-09' }, grupo_id: escI.id })).json.data.id;
    const anioI = Math.max(...gI.map((g) => g.anio));
    const profsI = (await apiI('GET', '/profesionales')).json;
    const itemsI = Object.fromEntries(Array.from({ length: 24 }, (_, i) => [String(i + 1), { valor: 3, obs: null }])); itemsI['1'] = { valor: 1, obs: null };
    await apiI('POST', `/hce/${idPaI}/protocolo`, { tipo: 'A', anio: anioI, items: itemsI, fecha: '2026-07-01', semanas: 16, sint_tec1: 'a', sint_tec2: 'b', evaluador_t1_id: profsI[0].id, evaluador_t2_id: profsI[1].id });
    await abrirI(idPaI, 'pa');
    const rFirma = pi.waitForResponse((r) => r.request().method() === 'POST' && /\/firmar$/.test(r.url()));
    await pi.click('#btnEvFirmar'); await pi.click('#btnEvConfirmar');
    const respFirma = await rFirma; const jsonFirma = await respFirma.json();
    await pi.waitForSelector('#evErrores:not([hidden])');
    const i3 = await pi.evaluate(() => ({ resumen: document.getElementById('evErrores').innerText.replace(/\s+/g, ' '), item: document.getElementById('err_pobs-1').textContent + document.getElementById('err_pitem-1').textContent }));
    const msgApi = jsonFirma.detail.find((d) => /items\.1/.test(d.campo || '')) || jsonFirma.detail[0];
    check('3e-i18n3', 'un 422 de negocio ya en castellano (PA: ítem 1 con puntaje 1 sin observación) se muestra EXACTAMENTE como lo dijo la API',
      respFirma.status() === 422 && !/[A-Za-z]+ should /.test(msgApi.mensaje) && i3.resumen.includes(msgApi.mensaje) && i3.item.includes(msgApi.mensaje), JSON.stringify({ api: msgApi, campo: i3.item }).slice(0, 380));
    const trad = await pi.evaluate(() => ['Field required', 'Input should be a valid integer', 'Input should be a valid date', 'Input should be less than or equal to 100', 'Input should be greater than or equal to 0', 'String should have at most 20 characters', 'Un puntaje 1 requiere observación.', 'Ya existe una persona con esa cédula']
      .map((m) => traducirMensajeApi(m)));
    check('3e-i18n4', 'tabla de traducción: obligatorio, entero, fecha, menor o igual, mayor o igual y largo máximo salen en castellano; los mensajes en castellano del servicio pasan intactos',
      trad[0] === 'Este campo es obligatorio.' && /entero/.test(trad[1]) && /fecha/.test(trad[2]) && trad[3] === 'Tiene que ser menor o igual a 100.' && trad[4] === 'Tiene que ser mayor o igual a 0.' && /máximo 20 caracteres/.test(trad[5])
        && trad[6] === 'Un puntaje 1 requiere observación.' && trad[7] === 'Ya existe una persona con esa cédula', JSON.stringify(trad));
    await ci.close();
  }

  /* ---------- 3e-vistas / 3e-color: la regla de color (ok/warn/bad nunca en clasificaciones clínicas) y los estados compartidos ---------- */
  {
    const { ctx: cv, page: pv } = await nuevaPagina();
    await loguear(pv);
    await pv.waitForFunction(() => /Mostrando \d+ de/.test(document.getElementById('listaResumen').textContent), null, { timeout: 8000 });
    const js = await leerFuentes(['catalogos.js', 'ui-core.js', 'evaluaciones.js', 'informe-cierre.js', 'hce-doc-org-vf.js', 'expediente.js', 'flujo.js'], 'js/');
    const css = await (await fetch(DEMO + '/css/estilos.css')).text();
    const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '');
    const lineasConEstado = (t) => sinComentarios(t).split('\n').filter((l) => /var\(--(ok|warn|bad)\)/.test(l));
    const enBandas = js.filter(([f]) => f === 'catalogos.js').flatMap(([, t]) => lineasConEstado(sinComentarios(t).split('\n').filter((l) => /IDEA_BANDAS|^\s*\{max:/.test(l)).join('\n')));
    const reglasClinicas = sinComentarios(css).split('}').filter((r) => /(\.banda-|\.score-badge|\.banda-chip|\.vf-cat)/.test(r.split('{')[0]) && /--(ok|warn|bad)\b/.test(r));
    const demo = await pv.evaluate(() => ({ bandas: IDEA_BANDAS.every((b) => Number.isInteger(b.paso) && b.paso >= 1 && b.paso <= 6 && !('color' in b)), colorBanda: typeof colorBanda, pasos: IDEA_BANDAS.map((b) => b.paso).join('') }));
    await pv.evaluate(() => { go('analitica'); });
    await pv.waitForFunction(() => PANEL.estado === 'listo', null, { timeout: 8000 });
    const ana = await pv.evaluate(() => {
      const tinta = (() => { const e = document.createElement('span'); e.style.color = 'var(--ink)'; document.body.appendChild(e); const c = getComputedStyle(e).color; e.remove(); return c; })();
      const estados = ['--ok', '--warn', '--bad'].map((v) => { const e = document.createElement('span'); e.style.color = `var(${v})`; document.body.appendChild(e); const c = getComputedStyle(e).color; e.remove(); return c; });
      const deltaYAlertas = [...document.querySelectorAll('#panelProtocolo td.num, #panelAlertas .panel-alerta-n, #panelAlertas .estado-msg')];
      return { chips: [...document.querySelectorAll('#panelBandas .banda-chip')].map((c) => c.getAttribute('data-banda-paso')),
        chipsConEstado: [...document.querySelectorAll('#panelBandas .banda-chip')].filter((c) => estados.includes(getComputedStyle(c).backgroundColor) || estados.includes(getComputedStyle(c).color)).length,
        deltaYAlertas: deltaYAlertas.length, noTinta: deltaYAlertas.filter((e) => getComputedStyle(e).color !== tinta).map((e) => e.textContent.trim()),
        heat: [...document.querySelectorAll('.heat-cell')].map((c) => [getComputedStyle(c).backgroundColor, getComputedStyle(c).color]) };
    });
    check('3e-color1', 'la regla de color: las 6 bandas del IDEA del modo demostración usan un paso de la rampa de un solo matiz (sin ok/warn/bad, sin colorBanda), la distribución por banda del Panel institucional (conectado, C7) pinta cada banda con el chip de la rampa (pasos 1–6 en el orden del catálogo, nunca ok/warn/bad) y ninguna regla de .banda-*/.score-badge del CSS usa ok/warn/bad',
      demo.bandas && demo.colorBanda === 'undefined' && demo.pasos === '123456' && enBandas.length === 0 && reglasClinicas.length === 0 && ana.chips.join('') === '123456' && ana.chipsConEstado === 0,
      JSON.stringify({ demo, enBandas: enBandas.length, reglasClinicas: reglasClinicas.length, chips: ana.chips, chipsConEstado: ana.chipsConEstado }));
    check('3e-color2', 'Panel institucional (C7): el Δ medio y las alertas van en tinta (glifo + texto, ningún color de estado) y cada celda del heatmap de demostración usa un texto elegido contra su fondo',
      ana.deltaYAlertas >= 4 && ana.noTinta.length === 0 && ana.heat.length === 24, JSON.stringify({ deltaYAlertas: ana.deltaYAlertas, noTinta: ana.noTinta, celdas: ana.heat.length }));
    // los estados cargando / error / vacío son UN componente en todas las pantallas conectadas
    const fuenteConectada = js.filter(([f]) => ['ui-core.js', 'evaluaciones.js', 'informe-cierre.js', 'hce-doc-org-vf.js', 'expediente.js'].includes(f)).map(([f, t]) => [f, sinComentarios(t)]);
    const artesanales = fuenteConectada.flatMap(([f, t]) => t.split('\n').map((l, i) => [f, i + 1, l]).filter(([, , l]) => /class="hint" role="status">Cargando|class="empty-state" role="(alert|status)"|<div class="big" aria-hidden="true">!<\/div>\$\{escHtml/.test(l)));
    const comp = await pv.evaluate(() => { const d = document.createElement('div'); d.innerHTML = estadoCargandoHtml('x') + estadoErrorHtml('x', 'void(0)') + estadoVacioHtml('◌', 'x') + estadoErrorInlineHtml('x', 'void(0)');
      return [...d.children].map((e) => [e.className.split(' ').slice(0, 2).join('.'), e.getAttribute('role')]); });
    check('3e-estados', 'cargando · error · vacío son UN componente compartido (utils.js): las pantallas conectadas no arman el suyo (cargando role=status, error role=alert con «Reintentar», vacío role=status)',
      artesanales.length === 0 && JSON.stringify(comp) === JSON.stringify([['empty-state.estado-carga', 'status'], ['empty-state.estado-error', 'alert'], ['empty-state.estado-vacio', 'status'], ['estado-inline', 'alert']]),
      JSON.stringify({ artesanales: artesanales.map(([f, n]) => f + ':' + n), comp }).slice(0, 400));

    /* ---------- 3e-panel: el tabpanel es alcanzable con Tab sólo si no tiene nada operable adentro ---------- */
    const tokenV = await pv.evaluate(() => sessionStorage.getItem('ippu.token'));
    const idMartinV = (await (await fetch(API + '/hce?nombre=Mart%C3%ADn&limit=5', { headers: { Authorization: 'Bearer ' + tokenV } })).json()).find((h) => h.persona.nombre === 'Martín').id;
    await pv.evaluate((i) => abrirExpediente(i), idMartinV);
    await pv.waitForSelector('#expTitulo'); await pv.waitForFunction(() => !!EXP.flujo && !!EXP.mods, null, { timeout: 8000 });
    const paneles = {};
    for (const k of ['doc', 'inc', 'pai', 'lb']) {
      await pv.evaluate((t) => selTabExp(t), k);
      await pv.waitForFunction(() => !/Cargando/.test(document.getElementById('panelExp').innerText), null, { timeout: 8000 });
      await pv.waitForTimeout(80);
      paneles[k] = await pv.evaluate(() => ({ ti: document.getElementById('panelExp').getAttribute('tabindex'), operables: document.querySelectorAll('#panelExp button:not([disabled]), #panelExp a[href], #panelExp input, #panelExp select, #panelExp textarea, #panelExp summary').length }));
    }
    await pv.evaluate(() => selTabExp('pai'));                     // C5: DOC tiene controles; el panel de demostración que queda es PAI
    await pv.waitForTimeout(80);
    await pv.focus('#tabExp-pai'); await pv.keyboard.press('Tab');
    const tabAlAyuda = await pv.evaluate(() => document.activeElement.id);      // el «?» va al final de la tira (F1b): el orden de Tab sigue al visual
    await pv.keyboard.press('Tab');
    const tabAlPanel = await pv.evaluate(() => document.activeElement.id);
    check('3e-panel', 'el módulo en modo demostración (PAI) no tiene nada operable: su #panelExp lleva tabindex="0" y Tab desde la pestaña llega al «?» (al final de la tira) y el siguiente Tab al panel; en LB, INC (C4) y DOC (C5), conectadas y con controles adentro, no lleva tabindex',
      ['pai'].every((k) => paneles[k].ti === '0' && paneles[k].operables === 0) && ['lb', 'inc', 'doc'].every((k) => paneles[k].ti === null && paneles[k].operables > 0) && tabAlAyuda === 'btnAyudaFlujo' && tabAlPanel === 'panelExp', JSON.stringify({ paneles, tabAlAyuda, tabAlPanel }).slice(0, 420));

    /* ---------- 3e-demo: el panel «Modo demostración» y la marca «Solo demo» son idénticos en todas partes ---------- */
    const firmas = new Set(), marcas = new Set(); let nPaneles = 0, nMarcas = 0;
    const leer = async (nombre) => { const r = await pv.evaluate(() => ({
      paneles: [...document.querySelectorAll('.demo-panel')].filter((e) => e.offsetParent !== null).map((e) => [e.getAttribute('role'), e.className, [...e.querySelectorAll('*')].map((c) => c.tagName + '.' + c.className).join('>'), (e.querySelector('b') || {}).textContent]),
      marcas: [...document.querySelectorAll('.solo-demo')].filter((e) => e.offsetParent !== null && !e.closest('.exp-tab')).map((e) => [e.tagName, e.className, e.textContent.trim()]) }));
      r.paneles.forEach((p) => { firmas.add(JSON.stringify(p)); nPaneles++; }); r.marcas.forEach((m) => { marcas.add(JSON.stringify(m)); nMarcas++; }); };
    for (const v of ['analitica']) { await pv.evaluate((x) => go(x), v);     // F2: Pendientes y Grupos ya no son de demostración (f2-texto lo verifica); C4: Inclusión tampoco (c4-vista); C6: Ateneos tampoco (c6-lista); C7: del Panel sólo queda la tarjeta del heatmap (c7-demo)
      await pv.waitForFunction(() => PANEL.estado === 'listo', null, { timeout: 8000 }); await leer(v); }
    await pv.evaluate(() => { go('usuarios'); renderUsuario(); }); await pv.waitForTimeout(60); await leer('usuarios');
    await pv.evaluate(() => abrirExpedienteDemo(102)); await pv.waitForTimeout(100); await leer('ejemplo');
    await pv.evaluate((i) => abrirExpediente(i), idMartinV); await pv.waitForSelector('#expTitulo'); await pv.waitForFunction(() => !!EXP.flujo, null, { timeout: 8000 });
    for (const k of ['pai']) { await pv.evaluate((t) => selTabExp(t), k); await pv.waitForTimeout(60); await leer(k); }   // C4: INC ya no es de demostración; C5: DOC tampoco
    await pv.evaluate((t) => selTabExp(t), 'vf'); await pv.waitForFunction(() => !/Cargando/.test(document.getElementById('panelExp').innerText), null, { timeout: 8000 });
    await pv.evaluate(() => { const g = document.querySelector('.vf-guia'); if (g) g.open = true; }); await leer('vf');
    const sinTitulos = [...firmas].map((f) => JSON.parse(f));
    // C4: sin la vista Inclusión ni la pestaña INC (conectadas) quedaban 6 paneles y 3 marcas; C5: sin la pestaña DOC, 5 y 2 (su marca iba en el encabezado de su panel); C6: sin la vista Ateneos, 4 y 2; C7: el panel de la vista Analítica pasa a la tarjeta del heatmap: siguen 4 y 2
    check('3e-demo', 'el panel «Modo demostración» (role=note, glifo, título «Modo demostración — no se guarda») y la marca «Solo demo» son idénticos en todas las vistas y pestañas no conectadas: una sola estructura, un solo texto (la marca compacta de las pestañas, glifo + texto sólo para lectores de pantalla, la mide f1-tabs)',
      nPaneles >= 4 && firmas.size === 1 && sinTitulos[0][0] === 'note' && sinTitulos[0][3] === 'Modo demostración — no se guarda' && nMarcas >= 2 && marcas.size === 1 && JSON.parse([...marcas][0])[2] === 'Solo demo', JSON.stringify({ nPaneles, estructuras: firmas.size, nMarcas, marcasDistintas: marcas.size }));
    await cv.close();
  }

  /* =====================================================================================================================
     F1 · BANDA DEL PACIENTE, FLUJO EN LAS PESTAÑAS, BARRA DE ACCIONES, LISTADO Y NAVEGACIÓN (handoff §5.140)
     ESCRIBE: crea un expediente nuevo (editores vacíos de LB, PA e IC) y le pone una alerta clínica desde la edición de HCE-00.
     Va al final: lee a Martín tal como lo dejaron los bloques anteriores (VF creada en 3-d).
     =================================================================================================================== */
  {
    const { ctx: cf1, page: pf } = await nuevaPagina();
    await pf.setViewportSize({ width: 1280, height: 800 });
    await loguear(pf);
    await pf.waitForFunction(() => /Mostrando \d+ de/.test(document.getElementById('listaResumen').textContent), null, { timeout: 8000 });
    const tokenF = await pf.evaluate(() => sessionStorage.getItem('ippu.token'));
    const apiF = async (metodo, ruta, body) => { const r = await fetch(API + ruta, { method: metodo, headers: { Authorization: 'Bearer ' + tokenF, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
      return { status: r.status, json: r.status === 204 ? null : await r.json() }; };
    const idDeF = async (n) => (await apiF('GET', '/hce?nombre=' + encodeURIComponent(n) + '&limit=20&incluir_inactivos=true')).json.find((h) => h.persona.nombre === n).id;
    const idMartinF = await idDeF('Martín'), idBrunoF = await idDeF('Bruno');
    const sufF1 = String(Date.now()).slice(-6);
    const escF1 = (await apiF('GET', '/grupos')).json.find((g) => g.nombre === 'Escolares');
    const idNuevoF = (await apiF('POST', '/hce', { persona: { nombre: 'Banda' + sufF1, apellido: 'Efe', ci: '3' + sufF1 + '4', fecha_nac: '2016-10-10' }, grupo_id: escF1.id })).json.data.id;
    const abrirF1 = async (id, tab) => {
      await pf.evaluate((i) => abrirExpediente(i), id);
      await pf.waitForSelector('#expTitulo');
      await pf.waitForFunction(() => !!EXP.flujo && !!EXP.mods, null, { timeout: 8000 });
      if (tab && tab !== 'hce00') await pf.click('#tabExp-' + tab);
      await pf.waitForFunction(() => !/Cargando/.test(document.getElementById('panelExp').innerText), null, { timeout: 8000 });
      await pf.waitForTimeout(150);
    };
    const tamanios = [[1280, 800], [1024, 768]];

    /* ---------- f1-a: el primer bloque clínico arranca a ≤ 260 px (1280×800) y a ≤ 300 px (1024×768) del borde de arriba ---------- */
    const BLOQUE = { lb: '#panelExp .exp-grid', pa: '#panelExp .exp-grid', pb: '#evResultado', ic: '#panelExp > .card', vf: '#panelExp > .card, #panelExp > .info-card' };
    const tops = [];
    for (const [w, h] of tamanios) {
      await pf.setViewportSize({ width: w, height: h });
      for (const t of ['lb', 'pa', 'pb', 'ic', 'vf']) {
        await abrirF1(idMartinF, t);
        await pf.evaluate(() => window.scrollTo(0, 0));
        tops.push({ w, t, max: w === 1280 ? 260 : 300, top: await pf.evaluate((s) => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().top) : null; }, BLOQUE[t]) });
      }
    }
    check('f1-a', 'el primer bloque clínico de Martín (LB, PA, PB con su «Resultado», IC y VF) arranca a ≤ 260 px del borde de arriba a 1280×800 y a ≤ 300 px a 1024×768',
      tops.length === 10 && tops.every((x) => x.top !== null && x.top <= x.max), tops.map((x) => `${x.t}@${x.w}:${x.top}`).join(' '));

    /* ---------- f1-tabs (F1b): a 1280 las pestañas entran en UNA fila con ≥ 40 px de holgura (una fuente más ancha no la parte); todas miden lo mismo (±1 px) con el nombre en una línea; a 1024, dos filas como mucho; nunca un scroll horizontal escondido ---------- */
    const filasTabs = [];
    for (const [w, h] of tamanios) {
      await pf.setViewportSize({ width: w, height: h });
      await abrirF1(idMartinF, 'hce00');
      filasTabs.push(await pf.evaluate((ww) => { const l = document.querySelector('.exp-tabs');
        const tabs = [...document.querySelectorAll('.exp-tab')];
        const fondos = tabs.map((t) => t.getBoundingClientRect().bottom).sort((a, b) => a - b);      // filas = grupos de fondos a más de 3 px (la pestaña elegida baja 1 px)
        const altos = tabs.map((t) => t.getBoundingClientRect().height);
        const ultima = tabs[tabs.length - 1].getBoundingClientRect();
        const unaLinea = tabs.every((t) => { const n = t.querySelector('.tab-nombre'); return n.getBoundingClientRect().height <= parseFloat(getComputedStyle(n).lineHeight) + 1; });
        const marcas = tabs.filter((t) => t.querySelector('.solo-demo')).map((t) => { const m = t.querySelector('.solo-demo'); const cs = getComputedStyle(m);
          return t.dataset.tab + ':' + (m.querySelector('[aria-hidden="true"]') ? 'glifo' : 'SIN-glifo') + '+' + (/Solo demo/.test(m.querySelector('.sr-only') ? m.querySelector('.sr-only').textContent : '') ? 'texto-sr' : 'SIN-texto') + (cs.borderTopStyle === 'dashed' ? '+DASHED' : ''); });
        return { ww, filas: fondos.filter((b, i) => i === 0 || b - fondos[i - 1] > 3).length, sw: l.scrollWidth, cw: l.clientWidth, n: tabs.length,
          libre: Math.floor(l.getBoundingClientRect().right - ultima.right), dAlto: Math.round((Math.max(...altos) - Math.min(...altos)) * 10) / 10, unaLinea,
          nombres: [...document.querySelectorAll('.exp-tab .tab-nombre')].map((e) => e.textContent).join('|'), marcas: marcas.join(','),
          solo: tabs.filter((t) => t.querySelector('.solo-demo')).map((t) => t.dataset.tab).join(','),
          ayudaAlFinal: (() => { const a = document.getElementById('btnAyudaFlujo').getBoundingClientRect(); return a.left >= ultima.right && Math.abs((a.bottom + 4) - ultima.bottom) < 8; })(),
          titulos: [...document.querySelectorAll('#tabExp-ic,#tabExp-vf')].map((t) => t.title).join('|') }; }, w));
    }
    check('f1-tabs', 'pestañas: a 1280 px una sola fila con ≥ 40 px libres al final, a 1024 px dos como mucho, sin scroll horizontal; todas del mismo alto (±1 px) con el nombre en una línea; «Solo demo» = glifo + texto sólo para lectores de pantalla (sin insignia punteada); el «?» al final de la tira; el nombre completo en el tooltip; orden Datos · Ciclo anual · Seguimiento · Registro',
      filasTabs[0].filas === 1 && filasTabs[0].libre >= 40 && filasTabs[1].filas <= 2 && filasTabs.every((f) => f.sw <= f.cw && f.n === 13 && f.dAlto <= 1 && f.unaLinea && f.ayudaAlFinal) && filasTabs[0].solo === 'pai'           // C5: DOC conectada; sólo PAI lleva la marca
        && filasTabs[0].marcas === 'pai:glifo+texto-sr'
        && filasTabs[0].titulos === 'Informe de cierre anual|Valoración funcional'
        && filasTabs[0].nombres === 'Datos|Consentimiento|Línea base|Protocolo A|Protocolo B|Cierre|Valoración|Severidad|Inclusión|Organismos|Documentos|PAI|Auditoría', JSON.stringify(filasTabs));

    /* ---------- f1-b: la banda sigue a la vista al bajar hasta el final de un módulo (lectura y editor) ---------- */
    await pf.setViewportSize({ width: 1280, height: 800 });
    const pegada = [];
    for (const [id, tab] of [[idMartinF, 'lb'], [idNuevoF, 'lb'], [idMartinF, 'ic']]) {
      await abrirF1(id, tab);
      await pf.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await pf.waitForTimeout(200);
      pegada.push(await pf.evaluate((t) => { const b = document.getElementById('expHead'), r = b.getBoundingClientRect(), top = document.querySelector('.topbar').getBoundingClientRect().bottom;
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return { t, scrollY: Math.round(scrollY), top: Math.round(r.top), barra: Math.round(top), visible: !!hit && b.contains(hit), nombre: document.getElementById('expTitulo').textContent }; }, tab));
    }
    check('f1-b', 'la banda del paciente queda pegada bajo la barra superior y a la vista después de bajar hasta el final del módulo (LB firmado, LB en edición, IC)',
      pegada.every((x) => x.scrollY > 200 && x.top === x.barra && x.visible), JSON.stringify(pegada));

    /* ---------- f1-c: WCAG 2.2 · 2.4.11 — con Tab por LB y PA, nada enfocado queda tapado por la banda ni por la barra de acciones ---------- */
    const tapados = []; let recorridos = 0;
    for (const [w, h] of tamanios) {
      await pf.setViewportSize({ width: w, height: h });
      for (const tab of ['lb', 'pa']) {
        await abrirF1(idNuevoF, tab);
        await pf.evaluate(() => window.scrollTo(0, 0));
        await pf.focus('#tabExp-' + tab);
        for (let i = 0; i < 160; i++) {
          await pf.keyboard.press('Tab');
          const r = await pf.evaluate(() => {
            const el = document.activeElement;
            if (!el || el === document.body || !document.getElementById('view-expediente').contains(el)) return { fin: true };
            const b = el.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2;
            const hit = document.elementFromPoint(cx, cy);
            return { id: el.id || el.className || el.tagName, ok: !!hit && (hit === el || el.contains(hit)), tapa: hit && !el.contains(hit) ? (hit.closest('.banda-nna') ? 'banda' : hit.closest('.barra-acciones') ? 'barra' : (hit.id || hit.className || hit.tagName)) : '' };
          });
          if (r.fin) break;
          recorridos++;
          if (!r.ok) tapados.push(`${tab}@${w}: ${r.id} (tapado por ${r.tapa})`);
        }
      }
    }
    check('f1-c', 'WCAG 2.2 · 2.4.11: recorriendo con Tab los editores de LB y PA (1280×800 y 1024×768), en el centro de cada control enfocado está el control mismo (ni la banda ni la barra de acciones lo tapan)',
      recorridos > 100 && tapados.length === 0, tapados.length ? tapados.slice(0, 6).join(' · ') : `${recorridos} focos medidos`);

    /* ---------- f1-d: WCAG 2.2 · 2.5.8 — lo operable del listado, la banda, las pestañas y la barra mide ≥ 24×24 (o cumple la excepción de espaciado) ---------- */
    const objetivos = async (zona, sel) => pf.evaluate(([z, s]) => {
      const els = [...document.querySelectorAll(s)].flatMap((c) => [...c.querySelectorAll('button, a[href], input:not([type=hidden]), select, textarea, summary, [tabindex="0"]')])
        .filter((e) => !e.disabled && e.offsetParent !== null && !e.closest('[hidden]'));
      const rs = els.map((e) => { const r = e.getBoundingClientRect(); return { id: e.id || e.className.split(' ')[0] || e.tagName, r, chico: r.width < 24 || r.height < 24 }; });
      const dist = (cx, cy, r) => Math.hypot(Math.max(r.left - cx, 0, cx - r.right), Math.max(r.top - cy, 0, cy - r.bottom));
      const mal = rs.filter((a) => a.chico).filter((a) => { const cx = a.r.left + a.r.width / 2, cy = a.r.top + a.r.height / 2;
        return rs.some((o) => o !== a && (o.chico ? Math.hypot(cx - (o.r.left + o.r.width / 2), cy - (o.r.top + o.r.height / 2)) < 24 : dist(cx, cy, o.r) < 12)); });
      return { z, n: rs.length, chicos: rs.filter((a) => a.chico).map((a) => `${a.id} ${Math.round(a.r.width)}×${Math.round(a.r.height)}`), mal: mal.map((a) => `${a.id} ${Math.round(a.r.width)}×${Math.round(a.r.height)}`) };
    }, [zona, sel]);
    const tam = [];
    for (const [w, h] of tamanios) {
      await pf.setViewportSize({ width: w, height: h });
      await pf.evaluate(() => go('inicio')); await pf.waitForTimeout(150);
      tam.push({ w, ...(await objetivos('listado', '#view-inicio .card')) });
      for (const tab of ['lb', 'pa', 'ic']) {
        await abrirF1(idNuevoF, tab);
        tam.push({ w, ...(await objetivos('banda+pestañas+barra ' + tab, '#expHead, #tabsExpWrap, .barra-acciones')) });
      }
    }
    check('f1-d', 'WCAG 2.2 · 2.5.8: todo lo operable del listado, la banda, las pestañas y la barra de acciones (LB, PA e IC) mide ≥ 24×24 px o cumple la excepción de espaciado, a 1280 y 1024 px',
      tam.every((t) => t.n > 0 && t.mal.length === 0), tam.map((t) => `${t.z}@${t.w}: ${t.n}${t.mal.length ? ' MAL ' + t.mal.join(',') : ''}${t.chicos.length ? ' (chicos con espacio: ' + t.chicos.length + ')' : ''}`).join(' · ').slice(0, 700));

    /* ---------- f1-e: el listado entra a 1024 y 1280 sin celdas recortadas; un punto de Tab por fila; Enter en el nombre abre ---------- */
    const lst = [];
    for (const [w, h] of tamanios) {
      await pf.setViewportSize({ width: w, height: h });
      await pf.evaluate(() => go('inicio')); await pf.waitForTimeout(150);
      lst.push(await pf.evaluate((ww) => { const sc = document.querySelector('#view-inicio .tabla-scroll');
        const celdas = [...document.querySelectorAll('#tablaNNA th, #tablaNNA td')].filter((c) => c.scrollWidth > c.clientWidth + 1).map((c) => c.textContent.trim().slice(0, 20));
        const filas = [...document.querySelectorAll('#tbodyNNA tr[data-hce]')];
        const paradas = filas.map((f) => [...f.querySelectorAll('*')].filter((e) => e.tabIndex >= 0 && !e.disabled && e.offsetParent !== null && (e.matches('button, a[href], input, select, textarea, summary') || e.hasAttribute('tabindex'))).length + (f.tabIndex >= 0 && f.hasAttribute('tabindex') ? 1 : 0));
        return { ww, cols: document.querySelectorAll('#tablaNNA thead th').length, scroll: [sc.scrollWidth, sc.clientWidth], pagina: [document.documentElement.scrollWidth, innerWidth], recortadas: celdas, paradas: [...new Set(paradas)], cedula: /Cédula/i.test(document.querySelector('#tablaNNA thead').textContent) }; }, w));
    }
    const filaM = pf.locator('#tbodyNNA tr[data-hce]', { hasText: 'Martín' });
    await filaM.locator('.nna-abrir').focus();
    await pf.keyboard.press('Enter');
    await pf.waitForSelector('#expTitulo', { timeout: 8000 });
    const conEnter = await pf.evaluate(() => ({ id: EXP.id, foco: document.activeElement.id }));
    await pf.evaluate(() => go('inicio')); await pf.waitForTimeout(150);
    await filaM.locator('td').nth(1).click();                                            // con el mouse, en cualquier parte de la fila (la celda del grupo)
    await pf.waitForSelector('#view-expediente.active #expTitulo', { timeout: 8000 });
    const conMouse = await pf.evaluate(() => EXP.id);
    check('f1-e', 'listado de cinco columnas (sin Cédula): a 1024 y 1280 px sin celdas recortadas ni scroll horizontal; un solo punto de Tab por fila (el nombre); Enter en el nombre abre el expediente y un clic en cualquier parte de la fila también',
      lst.every((l) => l.cols === 5 && !l.cedula && l.scroll[0] <= l.scroll[1] && l.pagina[0] === l.pagina[1] && l.recortadas.length === 0 && JSON.stringify(l.paradas) === '[1]') && conEnter.id === idMartinF && conEnter.foco === 'expTitulo' && conMouse === idMartinF,
      JSON.stringify({ lst, conEnter, conMouse }).slice(0, 500));

    /* ---------- f1-f: CI registrado = «✓ CI» sin relleno; el pendiente conserva el chip rojo; en las listas «firmado» va sin relleno y el expediente lo conserva macizo ---------- */
    await pf.evaluate(() => go('inicio')); await pf.waitForTimeout(150);
    const ciF = await pf.evaluate(([m, b]) => { const raiz = getComputedStyle(document.documentElement);
      const fm = document.querySelector(`#tbodyNNA tr[data-hce="${m}"]`), fb = document.querySelector(`#tbodyNNA tr[data-hce="${b}"]`);
      const ok = fm.querySelector('.ci-ok'), pend = fb.querySelector('.st-ci-pend'), firm = fm.querySelector('.st-firmado'), csOk = ok && getComputedStyle(ok), csP = pend && getComputedStyle(pend), csF = firm && getComputedStyle(firm);
      const aLaVista = (e) => [...e.childNodes].filter((n) => !(n.classList && n.classList.contains('sr-only'))).map((n) => n.textContent).join('').trim();   // sin el texto para lectores de pantalla
      return { okTxt: ok ? aLaVista(ok) : null, okBg: csOk && csOk.backgroundColor, okBorde: csOk && csOk.borderTopStyle, okColor: csOk && csOk.color, ink2: raiz.getPropertyValue('--ink-2').trim(),
        pendTxt: pend ? pend.innerText.trim() : null, pendBg: csP && csP.backgroundColor, pendRef: raiz.getPropertyValue('--st-ci-pend-bg').trim(),
        firmBg: csF && csF.backgroundColor, firmColor: csF && csF.color, okRef: raiz.getPropertyValue('--ok').trim(), firmTxt: firm ? firm.textContent : null }; }, [idMartinF, idBrunoF]);
    await abrirF1(idMartinF, 'lb');
    const firmExp = await pf.evaluate(() => { const e = document.querySelector('#evEstado .st-firmado'); return { bg: getComputedStyle(e).backgroundColor, ref: getComputedStyle(document.documentElement).getPropertyValue('--st-firmado-bg').trim() }; });
    const hexF = (h) => { const n = parseInt(h.replace('#', ''), 16); return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`; };
    check('f1-f', 'listado: CI registrado = «✓ CI» en --ink-2, sin relleno ni borde; CI pendiente = chip rojo (⚠ CI pendiente); «firmado» = ● y texto en --ok sin relleno; en el expediente «Firmado» sigue macizo',
      ciF.okTxt === '✓ CI' && ciF.okBg === 'rgba(0, 0, 0, 0)' && ciF.okBorde === 'none' && ciF.okColor === hexF(ciF.ink2) && /CI pendiente/.test(ciF.pendTxt) && ciF.pendBg === hexF(ciF.pendRef)
        && ciF.firmBg === 'rgba(0, 0, 0, 0)' && ciF.firmColor === hexF(ciF.okRef) && /●/.test(ciF.firmTxt) && firmExp.bg === hexF(firmExp.ref), JSON.stringify({ ciF, firmExp }).slice(0, 500));

    /* ---------- f1-g: una alerta cargada desde la edición de HCE-00 aparece en la banda en TODAS las pestañas (tinta, ⚠ y texto) ---------- */
    await pf.setViewportSize({ width: 1280, height: 800 });
    await abrirF1(idNuevoF, 'hce00');
    const textoAlerta = 'Alergia a la penicilina (prueba F1)';
    const sinAntes = await pf.locator('#bandaAlerta').count();
    await pf.click('#expHead .banda-editar');
    await pf.waitForSelector('#modalAlta.open'); await pf.waitForFunction(() => document.querySelectorAll('#f_grupo option').length > 1, null, { timeout: 8000 });
    await pf.click('#btnNext'); await pf.fill('#f_alerta', textoAlerta);
    await pf.click('#btnNext'); await pf.click('#btnNext');
    const reqAl = pf.waitForRequest((r) => r.method() === 'PATCH' && new RegExp(`/hce/${idNuevoF}$`).test(r.url()));
    await pf.click('#btnCreate');
    const bodyAl = cuerpoDe(await reqAl);
    await pf.waitForFunction(() => !document.getElementById('modalAlta').classList.contains('open'));
    const apiAl = (await apiF('GET', `/hce/${idNuevoF}`)).json.alerta;
    const enTabs = [];
    for (const k of await pf.$$eval('.exp-tab', (bs) => bs.map((b) => b.dataset.tab))) {
      await pf.click('#tabExp-' + k); await pf.waitForTimeout(120);
      enTabs.push(await pf.evaluate((k2) => { const a = document.getElementById('bandaAlerta'); const cs = a && getComputedStyle(a), raiz = getComputedStyle(document.documentElement);
        return { k: k2, txt: a ? a.innerText.replace(/\s+/g, ' ') : '', color: cs && cs.color, borde: cs && cs.borderTopColor, ink: raiz.getPropertyValue('--ink').trim(), visible: !!a && a.getBoundingClientRect().height > 0 }; }, k));
    }
    check('f1-g', 'una alerta cargada desde la edición de HCE-00 (PATCH {alerta}) aparece en la banda en las 13 pestañas, con ⚠, «Alerta clínica» y el texto, en tinta (no ok/warn/bad)',
      sinAntes === 0 && JSON.stringify(Object.keys(bodyAl)) === '["alerta"]' && apiAl === textoAlerta && enTabs.length === 13
        && enTabs.every((t) => t.visible && t.txt.includes('⚠') && t.txt.includes('Alerta clínica') && t.txt.includes(textoAlerta) && t.color === hexF(t.ink) && t.borde === hexF(t.ink)), JSON.stringify(enTabs.slice(0, 3)).slice(0, 400));

    /* ---------- f1-h: sin la vista «Intermedia» (ruta, manejador, entrada de navegación, reglas .lik-*) y sin los textos de desarrollo ---------- */
    const archivos = ['index.html', 'css/estilos.css', ...['utils.js', 'api.js', 'adaptadores.js', 'datos.js', 'flujo.js', 'catalogos.js', 'ui-core.js', 'wizard-nna.js', 'expediente.js', 'evaluaciones.js', 'informe-cierre.js', 'hce-doc-org-vf.js', 'panel.js', 'pendientes.js', 'grupos-usuario.js', 'inclusion.js', 'ateneos.js'].map((f) => 'js/' + f)];   // C7: panel.js reemplaza a recordatorios.js
    const fuentesF1 = await leerFuentes(archivos);
    const halla = (re) => fuentesF1.filter(([, t]) => re.test(t)).map(([f]) => f);
    const prohibidosF1 = { vista: halla(/view-intermedia|data-view="intermedia"|go\(['"]intermedia['"]\)/), manejador: halla(/lik-opts|likSel|likFormula/), reglas: fuentesF1.filter(([f, t]) => f.endsWith('.css') && /\.lik-[a-z]/.test(t)).map(([f]) => f),
      frases: ['v4.1 — Demo L1', 'Demo parcialmente conectada a la API', 'se van conectando por etapas', 'la API lo avisa', '(calculado por el servidor)', 'Avisos de la API', 'La contraseña se envía a la API'].filter((fr) => fuentesF1.some(([, t]) => t.includes(fr))) };
    const visibleF1 = await pf.evaluate(() => ({ nav: [...document.querySelectorAll('.sidebar .navitem')].map((b) => b.textContent.trim()), secciones: [...document.querySelectorAll('.sidebar .sec')].map((s) => s.textContent.trim()), marca: document.querySelector('.topbar .title').textContent.replace(/\s+/g, ' ').trim(), pie: document.querySelector('.sidebar .foot').textContent.trim() }));
    check('f1-h', 'no queda la vista «Intermedia» (ruta, manejador, entrada de navegación ni reglas .lik-*) ni los textos de desarrollo; navegación «General» → «Panel institucional» y «Servicio de Atención Diurna» → NNA y HCE · Pendientes · Grupos de referencia · Inclusión · Ateneos y capacitación (sin Taller Terapéutico ni Clínica); marca y pie del prototipo',
      Object.values(prohibidosF1).every((v) => v.length === 0) && JSON.stringify(visibleF1.secciones) === '["General","Servicio de Atención Diurna"]'
        && JSON.stringify(visibleF1.nav) === '["Panel institucional","NNA y HCE","Pendientes","Grupos de referencia","Inclusión","Ateneos y capacitación"]' && visibleF1.marca === 'Fundación IPPU · Historia Clínica Electrónica' && visibleF1.pie === 'Prototipo · IPPU × UTEC-LIDIA · 2026',
      JSON.stringify({ prohibidosF1, visibleF1 }).slice(0, 500));

    /* ---------- f1-i: aria-current="page" en el ítem activo de la barra lateral (también dentro de un expediente) ---------- */
    const actual = async () => pf.evaluate(() => [...document.querySelectorAll('.sidebar [aria-current]')].map((e) => e.dataset.view + '=' + e.getAttribute('aria-current')));
    await pf.evaluate(() => go('inicio')); const enInicio = await actual();
    await pf.click('.navitem[data-view="analitica"]'); const enPanel = await actual();
    await abrirF1(idMartinF, 'hce00'); const enExp = await actual();
    check('f1-i', 'aria-current="page" marca un único ítem de la barra lateral: «NNA y HCE» en el listado y dentro de un expediente, «Panel institucional» en su vista',
      JSON.stringify(enInicio) === '["inicio=page"]' && JSON.stringify(enPanel) === '["analitica=page"]' && JSON.stringify(enExp) === '["inicio=page"]', JSON.stringify({ enInicio, enPanel, enExp }));

    /* ---------- f1-kpi / f1-layout: cifras en tinta, pendientes que llevan a «Pendientes»; barra lateral de 192 px y márgenes 16/20 por debajo de 1180 px ---------- */
    await pf.evaluate(() => go('inicio')); await pf.waitForTimeout(100);
    const kpi = await pf.evaluate(() => { const raiz = getComputedStyle(document.documentElement); return { colores: [...document.querySelectorAll('#kpiRow .val')].map((v) => getComputedStyle(v).color), ink: raiz.getPropertyValue('--ink').trim(), botones: [...document.querySelectorAll('#kpiRow button')].map((b) => b.textContent.trim()), cols: getComputedStyle(document.getElementById('kpiRow')).gridTemplateColumns.split(' ').length }; });
    await pf.click('#kpiRow button >> nth=0');
    await pf.waitForSelector('#pendContenido .chip-estado.active', { timeout: 8000 });     // F2: Pendientes se carga al abrirla y llega filtrada
    const trasKpi = await pf.evaluate(() => ({ vista: document.querySelector('.view.active').id, foco: document.activeElement.id, filtro: (document.querySelector('#pendContenido .chip-estado.active') || {}).dataset.filtro }));
    await pf.setViewportSize({ width: 1024, height: 768 }); await pf.evaluate(() => go('inicio')); await pf.waitForTimeout(100);
    const lay = await pf.evaluate(() => ({ sidebar: Math.round(document.querySelector('.sidebar').getBoundingClientRect().width), pad: getComputedStyle(document.querySelector('main')).padding, cols: getComputedStyle(document.getElementById('kpiRow')).gridTemplateColumns.split(' ').length }));
    check('f1-kpi', 'KPI: las cifras van en tinta (ni naranja ni violeta), cuatro columnas desde 900 px, y «Sin línea base firmada este año» / «Sin consentimiento informado» son botones que llevan a Pendientes (foco en su título)',
      kpi.colores.length === 4 && kpi.colores.every((c) => c === hexF(kpi.ink)) && kpi.botones.length === 2 && /Sin línea base firmada este año/.test(kpi.botones[0]) && /Sin consentimiento informado/.test(kpi.botones[1]) && kpi.cols === 4 && lay.cols === 4
        && trasKpi.vista === 'view-pendientes' && trasKpi.foco === 'tituloPendientes' && trasKpi.filtro === 'lb', JSON.stringify({ kpi, trasKpi }));
    check('f1-layout', 'por debajo de 1180 px (1024×768): barra lateral de 192 px y márgenes del contenido de 16 px (arriba) y 20 px (a los lados)',
      lay.sidebar === 192 && /^16px 20px/.test(lay.pad), JSON.stringify(lay));

    /* ---------- f1b-tipo / f1b-accion (F1b, §5.141): tipografía, escala, etiquetas, acción principal en tinta, sin superficies oscuras fuera del cromo ---------- */
    await pf.setViewportSize({ width: 1280, height: 800 });
    /* F3 (§5.160): monoespaciada SÓLO en códigos e identificadores (HC, C.I., N.º, AT-…, CIE-11, códigos de módulo de las pestañas y del flujo de
       ejemplo). Los puntajes, las fechas (la del registro de ORG), los nombres de campo y el «ver completo» de Auditoría van en la cara de texto. */
    const CODIGOS = '.cod,.tab-cod,.fr-code,.grupo-integrantes .hint,.fstep .fname';
    const medirTipo = (codigos) => {
      const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
      const conTexto = [...document.querySelectorAll('body *')].filter((e) => vis(e) && !e.closest('svg,script,style,.sr-only') && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
      const chicos = conTexto.filter((e) => parseFloat(getComputedStyle(e).fontSize) < 11.99).map((e) => e.tagName + '.' + e.className + '=' + getComputedStyle(e).fontSize);
      const mono = conTexto.filter((e) => /monospace/.test(getComputedStyle(e).fontFamily) && !e.matches(codigos) && !e.closest(codigos)).map((e) => e.tagName + '.' + e.className + ' «' + e.textContent.trim().slice(0, 20) + '»');
      const serif = conTexto.filter((e) => /Charter|Georgia|serif/.test(getComputedStyle(e).fontFamily) && !/sans-serif$/.test(getComputedStyle(e).fontFamily) && !e.closest('.membrete,.inf-banner,#informeContent')).map((e) => e.tagName + '.' + e.className);
      const etq = [...document.querySelectorAll('th:not([scope="row"]),.kpi .lab,.section-label,.st,.tabs-grupo-rot')].filter(vis).filter((e) => {   // F3: .info-card>h3 es la cabecera de tarjeta (f3-cabecera)
        const cs = getComputedStyle(e); return !(parseFloat(cs.fontSize) === 12 && cs.fontWeight === '600' && (cs.letterSpacing === 'normal' || parseFloat(cs.letterSpacing) === 0) && cs.textTransform === 'none' && !/monospace/.test(cs.fontFamily)); }).map((e) => e.tagName + '.' + e.className);
      return { chicos, mono, serif, etq, familia: getComputedStyle(document.body).fontFamily.split(',')[0] };
    };
    const tipo = {};
    await pf.evaluate(() => go('inicio')); await pf.waitForTimeout(150);
    tipo.listado = await pf.evaluate(medirTipo, CODIGOS);
    for (const t of ['hce00', 'lb', 'pa', 'pb', 'ic', 'vf', 'org']) { await abrirF1(idMartinF, t); tipo[t] = await pf.evaluate(medirTipo, CODIGOS); }
    /* F3: Auditoría con todos sus «ver completo» abiertos y uno de muestra (un JSON legible) por si la página no trae ninguno */
    await abrirF1(idMartinF, 'log');
    await pf.evaluate(() => { document.querySelectorAll('#panelExp .log-ver').forEach((d) => { d.open = true; });
      const td = document.querySelector('#panelExp .log-table tbody td.log-cambio'); if (td) td.insertAdjacentHTML('beforeend', '<details class="log-ver" open data-f3><summary>ver completo</summary><pre class="log-pre">{ &quot;campo&quot;: &quot;valor de muestra&quot; }</pre></details>'); });
    tipo.log = await pf.evaluate(medirTipo, CODIGOS);
    const logF3 = await pf.evaluate(() => { const pre = document.querySelector('#panelExp .log-pre'), campo = document.querySelector('#panelExp .log-table tbody td:nth-child(5)'), fecha = document.querySelector('#panelExp .log-ts');
      const r = { pre: pre ? getComputedStyle(pre).fontFamily : '', campo: campo ? getComputedStyle(campo).fontFamily : '', fecha: fecha ? getComputedStyle(fecha).fontFamily : '' };
      document.querySelectorAll('#panelExp [data-f3]').forEach((d) => d.remove()); return r; });
    const orgF3 = tipo.org && await (async () => { await abrirF1(idMartinF, 'org'); return pf.evaluate(() => { const td = document.querySelector('#panelExp .org-fecha'); return td ? getComputedStyle(td).fontFamily : 'sin-fecha'; }); })();
    const titulos = await pf.evaluate(() => { const h = document.querySelector('.banda-nna h1'); const cs = getComputedStyle(h); return { fam: cs.fontFamily.split(',')[0], peso: cs.fontWeight }; });
    const dato = await pf.evaluate(() => { const c = document.querySelector('.banda-meta .cod'); return c ? getComputedStyle(c).fontFamily : ''; });
    const base = await pf.evaluate(() => { const fs = (v) => { const d = document.createElement('i'); d.style.cssText = 'position:absolute;visibility:hidden;font-size:var(' + v + ')'; document.body.appendChild(d); const px = parseFloat(getComputedStyle(d).fontSize); d.remove(); return px; };
      return { base: fs('--fs-base'), xl: fs('--fs-xl'), x2: fs('--fs-2xl'), tres: fs('--fs-3xs') }; });
    await abrirF1(idMartinF, 'hce00');
    const lectura = await pf.evaluate(() => ({ dd: getComputedStyle(document.querySelector('.data-row dd')).fontSize }));
    await abrirF1(idMartinF, 'lb');
    lectura.desc = await pf.evaluate(() => { const d = document.querySelector('.opcion .desc'); return d ? getComputedStyle(d).fontSize : 'sin-descriptor'; });
    const hayProblemas = Object.entries(tipo).filter(([, v]) => v.chicos.length || v.mono.length || v.serif.length || v.etq.length);
    check('f1b-tipo', 'tipografía: Segoe UI sin webfont; títulos de pantalla en sans 600; ningún texto visible por debajo de 12 px; --fs-base = 15 px (valores de ficha), --fs-xl = 22 px, --fs-2xl = 28 px; etiquetas (th, .kpi .lab, .section-label, .st, rótulos de grupo) en sans 12 px, 600, sin versalitas ni espaciado; monoespaciada sólo en códigos e identificadores (F3: no en puntajes, ni en la fecha de un registro de ORG, ni en el campo ni en el «ver completo» de Auditoría); serif sólo en documentos (listado, HCE-00, LB, PA, PB, IC, VF, ORG, LOG)',
      /Segoe UI/.test(tipo.listado.familia) && /Segoe UI/.test(titulos.fam) && titulos.peso === '600' && /monospace/.test(dato) && base.base === 15 && base.xl === 22 && base.x2 === 28 && base.tres === 12 && lectura.dd === '15px' && !hayProblemas.length
        && [logF3.pre, logF3.campo, logF3.fecha, orgF3].every((ff) => /Segoe UI/.test(ff) && !/monospace/.test(ff)),
      JSON.stringify({ familia: tipo.listado.familia, titulos, base, lectura, logF3: Object.fromEntries(Object.entries(logF3).map(([k, v]) => [k, v.split(',')[0]])), orgF3: String(orgF3).split(',')[0], problemas: hayProblemas.map(([k, v]) => ({ k, chicos: v.chicos.slice(0, 4), mono: v.mono.slice(0, 4), serif: v.serif.slice(0, 4), etq: v.etq.slice(0, 4) })) }));
    const medirAccion = () => {
      const claro = (rgb) => { const m = rgb.match(/[\d.]+/g).map(Number); const c = m.slice(0, 3).map((v) => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
      const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
      const prim = [...document.querySelectorAll('.btn-primary')].filter(vis).map((b) => getComputedStyle(b).backgroundColor);
      const naranjaTexto = [...document.querySelectorAll('body *')].filter((e) => vis(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && getComputedStyle(e).color === 'rgb(180, 89, 10)').map((e) => e.tagName + '.' + e.className);
      const oscuras = [...document.querySelectorAll('body *')].filter((e) => { if (!vis(e) || e.closest('.topbar,.sidebar,.toast,.skip-link,button,.opcion,.score-badge,.banda-chip,.st,svg') || e.classList.contains('modal-bg')) return false; const r = e.getBoundingClientRect(); const bg = getComputedStyle(e).backgroundColor; return r.width > 150 && r.height > 28 && /^rgb/.test(bg) && !/rgba\(.*, 0\)/.test(bg) && claro(bg) < 0.1; }).map((e) => e.tagName + '.' + e.className);
      return { prim, naranjaTexto, oscuras };
    };
    const accionesPor = {};
    await pf.evaluate(() => go('inicio')); await pf.waitForTimeout(100); accionesPor.listado = await pf.evaluate(medirAccion);
    await abrirF1(idMartinF, 'ic'); accionesPor.ic = await pf.evaluate(medirAccion);
    await pf.click('#btnIcImpreso'); await pf.waitForFunction(() => document.getElementById('view-informe').classList.contains('active') && !/Cargando el/.test(document.getElementById('informeContent').innerText), null, { timeout: 8000 });
    accionesPor.informe = await pf.evaluate(medirAccion);
    const bannerClaro = await pf.evaluate(() => { const b = document.querySelector('#informeContent .inf-banner'); const cs = getComputedStyle(b); const h = getComputedStyle(b.querySelector('h2')); return { bg: cs.backgroundColor, regla: cs.borderTopStyle + ' ' + cs.borderTopWidth, h2: h.fontFamily.split(',')[0] }; });
    await pf.evaluate(() => go('inicio')); await pf.evaluate(() => openAlta()); await pf.waitForTimeout(200);
    accionesPor.alta = await pf.evaluate(medirAccion);
    const ringAlta = await pf.evaluate(() => getComputedStyle(document.querySelector('.modal-head')).getPropertyValue('--ring').trim());
    await pf.keyboard.press('Escape'); await pf.waitForTimeout(150);
    const malAccion = Object.entries(accionesPor).filter(([, v]) => v.naranjaTexto.length || v.oscuras.length || v.prim.some((c) => c !== 'rgb(22, 35, 44)'));
    check('f1b-accion', 'acción principal en tinta: todo .btn-primary es #16232C (listado, IC, diálogo de alta, encabezado del informe); el naranja de marca no pinta ningún texto; no hay superficies oscuras fuera de la barra superior y la lateral (el encabezado del informe y el del diálogo son claros, con filete, y su anillo de foco es el de las superficies claras)',
      !malAccion.length && accionesPor.listado.prim.length >= 1 && accionesPor.alta.prim.length >= 1 && bannerClaro.bg === 'rgb(255, 255, 255)' && /solid/.test(bannerClaro.regla) && /Charter|Georgia|Iowan|Constantia|Cambria|serif/.test(bannerClaro.h2) && ringAlta === '#B4590A',
      JSON.stringify({ malAccion, bannerClaro, ringAlta, n: Object.fromEntries(Object.entries(accionesPor).map(([k, v]) => [k, v.prim.length])) }));
    await cf1.close();
  }

  /* ---------- C1 · HCE-LOG de sólo lectura: la pestaña «Auditoría» lista el rastro de la API ---------- */
  {
    const TZ = 'Asia/Tokyo';                                         // una zona que no es la de esta máquina: prueba que la hora es la del NAVEGADOR
    const ctx = await browser.newContext({ timezoneId: TZ });
    const pc = await ctx.newPage();
    pc.on('pageerror', (e) => erroresPagina.push(e.message));
    pc.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) erroresPagina.push('console: ' + m.text()); }); vigilarCarga(pc);
    await loguearComo(pc, EMAIL, PASSWORD);
    const tok = await pc.evaluate(() => sessionStorage.getItem('ippu.token'));
    const tokAdmin = (await (await fetch(API + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }) })).json()).access_token;
    const api = async (metodo, ruta, body, t) => { const r = await fetch(API + ruta, { method: metodo, headers: { Authorization: 'Bearer ' + (t || tok), 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) }); return { status: r.status, total: r.headers.get('X-Total-Count'), json: await r.json() }; };
    const yo = (await api('GET', '/auth/yo')).json;
    const idM = (await api('GET', '/hce?nombre=Mart%C3%ADn&limit=5')).json.find((h) => h.persona.nombre === 'Martín').id;

    /* Escrituras de la suite (por la API, como el técnico): 26 ediciones para pasar de una página, y las que se leen abajo. */
    for (let i = 0; i < 26; i++) await api('PATCH', `/hce/${idM}`, { medicacion: 'c1-m' + i });
    await api('PATCH', `/hce/${idM}`, { derivacion: 'c1-antes' });
    await api('PATCH', `/hce/${idM}`, { derivacion: 'c1-despues' });
    const LARGO = 'valor largo de c1 '.repeat(20).trim();           // 359 caracteres
    await api('PATCH', `/hce/${idM}`, { medicacion: LARGO });
    const ANAM = { motivo: 'Consulta por c1 ' + 'x'.repeat(60), perinatal: 'Sin particularidades ' + 'y'.repeat(60), desarrollo: 'Hitos ' + 'z'.repeat(60) };
    await api('PATCH', `/hce/${idM}`, { anamnesis: ANAM });
    // A1: coordinación no es tratante de Martín: abre la ventana (supervisión) para leer el LOG; el acceso va a otra tabla.
    await api('POST', `/hce/${idM}/accesos`, { motivo_codigo: 'supervision' }, tokAdmin);
    const totalAntes = Number((await api('GET', `/hce/${idM}/auditoria?limit=1`, undefined, tokAdmin)).total);

    await pc.evaluate((i) => abrirExpediente(i), idM);
    await pc.waitForSelector('#expTitulo'); await pc.waitForFunction(() => !!EXP.flujo && !!EXP.mods, null, { timeout: 8000 });
    await pc.click('#tabExp-log');
    await pc.waitForSelector('#panelExp .log-table', { timeout: 8000 });
    const filasUI = () => pc.evaluate(() => [...document.querySelectorAll('#panelExp .log-table tbody tr')].map((tr) => [...tr.children].map((td) => td.innerText.replace(/\s+/g, ' ').trim())));
    const esperarFilas = () => pc.waitForFunction(() => !!document.querySelector('#panelExp .log-table, #panelExp .estado-vacio, #panelExp .estado-error') && !/Cargando/.test(document.getElementById('panelExp').innerText), null, { timeout: 8000 });
    /* Espera DETERMINISTA de una carga del LOG. logCargar(true) deja la tabla anterior en pantalla mientras el pedido vuela (a propósito: filtrar
       no vacía lo que se ve), así que esperarFilas() sola puede resolver sobre la tabla vieja. Por eso: se arma waitForResponse del
       GET /hce/{id}/auditoria ANTES de la acción, se marca el nodo vigente del panel, se espera la respuesta y se espera a que el panel
       se repinte (el nodo marcado ya no es el primero) con la tabla, el vacío o el error a la vista. Sin pausas fijas. */
    const conAud = async (accion) => {
      const resp = pc.waitForResponse((r) => r.request().method() === 'GET' && /\/hce\/\d+\/auditoria\?/.test(r.url()), { timeout: 8000 });
      resp.catch(() => {});                                  // si la acción falla antes, la promesa armada no queda sin atender
      await pc.evaluate(() => { window.__panelViejo = document.getElementById('panelExp').firstElementChild; });
      await accion();
      await resp;
      await pc.waitForFunction(() => document.getElementById('panelExp').firstElementChild !== window.__panelViejo, null, { timeout: 8000 });
      await esperarFilas();
    };
    const filtrar = async (modulo, tipo) => { await conAud(() => pc.selectOption('#logModulo', modulo || '')); await conAud(() => pc.selectOption('#logTipo', tipo || '')); };
    const rango = () => pc.evaluate(() => document.querySelector('#panelExp .log-rango')?.innerText || '');

    /* c1-firmas · el LOG de Martín lista las firmas de LB, PA, PB e IC con el nombre de quien firmó */
    await filtrar('', 'firma');
    const apiFirmas = (await api('GET', `/hce/${idM}/auditoria?tipo=firma&limit=200`)).json;
    const uiFirmas = await filasUI();
    const modsFirmados = new Set(uiFirmas.map((f) => f[2]));          // F3: el módulo va en palabras, como en su filtro («Línea base (LB)»)
    check('c1-firmas', 'LOG de Martín (filtro «Se firmó»): lista las firmas de HCE-LB, HCE-PA, HCE-PB y HCE-IC, y en cada fila «Quién» es el nombre del autor que devuelve la API',
      ['Línea base (LB)', 'Protocolo A (PA)', 'Protocolo B (PB)', 'Informe de cierre (IC)'].every((m) => modsFirmados.has(m)) && uiFirmas.length === apiFirmas.length && apiFirmas.length >= 4
        && uiFirmas.every((f, i) => f[1] === apiFirmas[i].usuario.nombre && f[1] !== '' && f[3].startsWith('Se firmó')),
      JSON.stringify(uiFirmas.map((f) => f[2] + ' · ' + f[1])));

    /* c1-edicion · la edición de HCE-00 hecha por la suite, con antes y después y su autor */
    await filtrar('HCE-00', 'edicion');
    const ed = (await filasUI()).filter((f) => f[4] === 'Derivación');     // F3: el campo con su nombre legible (identificador «derivacion»)
    check('c1-edicion', 'una edición de HCE-00 hecha por la suite (derivación «c1-antes» → «c1-despues») aparece con módulo, campo, antes → después y el nombre de su autor; la más nueva primero',
      ed.length === 2 && /Antes: c1-antes Después: c1-despues/.test(ed[0][5]) && /Después: c1-antes/.test(ed[1][5]) && ed.every((f) => f[1] === yo.nombre && f[2] === 'Datos (HCE-00)' && f[3].startsWith('Se editó')),
      JSON.stringify(ed));

    /* c1-filtro · el filtro por módulo reduce las filas; las opciones son exactamente las válidas; foco; total = X-Total-Count */
    await filtrar('', '');
    const totalSinFiltro = Number(((await rango()).match(/de (\d+)/) || [])[1]);
    await pc.focus('#logModulo'); await conAud(() => pc.selectOption('#logModulo', 'HCE-LB'));
    const focoSel = await pc.evaluate(() => document.activeElement.id);
    const filasLB = await filasUI(); const totalLB = Number(((await rango()).match(/de (\d+)/) || [])[1]);
    const apiLB = Number((await api('GET', `/hce/${idM}/auditoria?modulo=HCE-LB&limit=1`)).total);
    const opciones = await pc.evaluate(() => ({ mod: [...document.querySelectorAll('#logModulo option')].map((o) => o.value), tipo: [...document.querySelectorAll('#logTipo option')].map((o) => o.value) }));
    const respOpc = [];
    for (const m of opciones.mod.filter(Boolean)) respOpc.push((await api('GET', `/hce/${idM}/auditoria?modulo=${m}&limit=1`)).status);
    for (const t of opciones.tipo.filter(Boolean)) respOpc.push((await api('GET', `/hce/${idM}/auditoria?tipo=${t}&limit=1`)).status);
    const rechazos = [(await api('GET', `/hce/${idM}/auditoria?tipo=acceso`)).status, (await api('GET', `/hce/${idM}/auditoria?modulo=GRUPO`)).status];
    check('c1-filtro', 'el filtro por módulo reduce las filas (sólo HCE-LB, total = X-Total-Count) y deja el foco en el selector; los filtros ofrecen exactamente los 12 módulos y los 6 tipos válidos (la API los acepta a todos y rechaza «acceso» y «GRUPO»)',
      filasLB.length > 0 && filasLB.every((f) => f[2] === 'Línea base (LB)') && totalLB === apiLB && totalLB < totalSinFiltro && focoSel === 'logModulo'
        && opciones.mod.length === 13 && opciones.tipo.length === 7 && respOpc.every((s) => s === 200) && rechazos.every((s) => s === 422),
      JSON.stringify({ totalSinFiltro, totalLB, apiLB, focoSel, opMod: opciones.mod.length, opTipo: opciones.tipo.length, rechazos }));

    /* c1-paginado · más de una página: rango, Anteriores/Siguientes, orden */
    await filtrar('', '');
    const apiP1 = (await api('GET', `/hce/${idM}/auditoria?limit=25&offset=0`)); const apiP2 = (await api('GET', `/hce/${idM}/auditoria?limit=25&offset=25`));
    const r1 = await rango(), p1 = await filasUI(); const antDesh = await pc.isDisabled('#btnLogAnt');
    await conAud(() => pc.click('#btnLogSig')); await pc.waitForFunction(() => /Mostrando 26/.test(document.querySelector('#panelExp .log-rango')?.innerText || ''), null, { timeout: 8000 });
    const r2 = await rango(), p2 = await filasUI(); const antHab = !(await pc.isDisabled('#btnLogAnt'));
    await conAud(() => pc.click('#btnLogAnt')); await pc.waitForFunction(() => /Mostrando 1–/.test(document.querySelector('#panelExp .log-rango')?.innerText || ''), null, { timeout: 8000 });
    const nTotal = Number(apiP1.total);
    const camposP2 = await pc.evaluate((cs) => cs.map((c) => c ? logCampoNombre(c) : null), apiP2.json.map((x) => x.campo));   // F3: nombre legible del campo de cada fila de la API
    check('c1-paginado', 'paginado de 25: «Mostrando 1–25 de N» con N = X-Total-Count, «Anteriores» deshabilitado en la primera página; «Siguientes» trae las filas 26 en adelante (las mismas, en el mismo orden, que la API) y «Anteriores» vuelve',
      nTotal > 26 && r1 === `Mostrando 1–25 de ${nTotal}` && antDesh && p1.length === 25 && r2 === `Mostrando 26–${Math.min(50, nTotal)} de ${nTotal}` && antHab && p2.length === apiP2.json.length
        && p2.every((f, i) => f[4] === (apiP2.json[i].campo ? camposP2[i] : '—') && f[1] === (apiP2.json[i].usuario ? apiP2.json[i].usuario.nombre : '(sin autor)')),
      JSON.stringify({ r1, r2, nTotal }));

    /* c1-paginado-foco · el botón que tenía el foco queda deshabilitado (primera o última página): el foco no cae al <body>, pasa al otro botón.
       Ahora estamos en la primera página, recién llegados con «Anteriores». */
    const idFoco = () => pc.evaluate(() => document.activeElement && document.activeElement.id);
    const focoPrimera = await idFoco(), antDeshPrimera = await pc.isDisabled('#btnLogAnt');
    let guardia = 0;
    while (!(await pc.isDisabled('#btnLogSig')) && guardia++ < 20) {
      const antes = await rango();
      await conAud(() => pc.click('#btnLogSig')); await pc.waitForFunction((v) => (document.querySelector('#panelExp .log-rango')?.innerText || '') !== v, antes, { timeout: 8000 });
    }
    const focoUltima = await idFoco(), sigDeshUltima = await pc.isDisabled('#btnLogSig'), rangoUltima = await rango();
    check('c1-paginado-foco', 'al llegar a la primera página con «Anteriores» y a la última con «Siguientes», el botón queda deshabilitado y el foco pasa al otro botón del paginado (nunca al <body>)',
      antDeshPrimera && focoPrimera === 'btnLogSig' && sigDeshUltima && focoUltima === 'btnLogAnt' && new RegExp(`de ${nTotal}$`).test(rangoUltima),
      JSON.stringify({ focoPrimera, focoUltima, rangoUltima }));
    await conAud(() => pc.click('#btnLogAnt'));  // se vuelve a una página intermedia o a la primera para lo que sigue
    await filtrar('', '');

    /* c1-hora · ts con zona horaria → hora local del navegador (es-UY), aquí Asia/Tokyo */
    const esperada = new Date(apiP1.json[0].ts).toLocaleString('es-UY', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    check('c1-hora', 'la fecha y hora de cada fila es la hora local del navegador (es-UY): con el navegador en Asia/Tokyo, la primera fila muestra el ts de la API en esa zona',
      /[+-]\d\d:\d\d$|Z$/.test(apiP1.json[0].ts) && p1[0][0] === esperada, JSON.stringify({ api: apiP1.json[0].ts, ui: p1[0][0], esperada }));

    /* c1-largo · valores largos: acortados CON «ver completo» (nunca cortados en silencio); JSON legible */
    await filtrar('HCE-00', 'edicion');
    const pagLargo = async () => { const filas = await pc.evaluate(() => [...document.querySelectorAll('#panelExp .log-table tbody tr')].map((tr) => ({ campo: tr.children[4].dataset.campo || tr.children[4].innerText.trim(), cambio: tr.children[5].innerHTML }))); return filas; };   // F3: el identificador del campo va en data-campo (se muestra su nombre legible)
    const filasHCE00 = await pagLargo();
    const idxLargo = filasHCE00.findIndex((f) => f.campo === 'medicacion' && /log-ver/.test(f.cambio));
    const idxAnam = filasHCE00.findIndex((f) => f.campo === 'anamnesis');
    const celdaLargo = pc.locator('#panelExp .log-table tbody tr').nth(idxLargo).locator('td').nth(5);
    const visibleLargo = await celdaLargo.locator('.log-despues .log-valor').innerText();
    const cerrado = await celdaLargo.locator('.log-despues details').evaluate((d) => !d.open);
    await celdaLargo.locator('.log-despues summary').click();
    const completoLargo = await celdaLargo.locator('.log-despues pre').innerText();
    const celdaAnam = pc.locator('#panelExp .log-table tbody tr').nth(idxAnam).locator('td').nth(5);
    await celdaAnam.locator('.log-despues summary').click();
    const preAnam = await celdaAnam.locator('.log-despues pre').innerText();
    const cortesSinAviso = await pc.evaluate(() => [...document.querySelectorAll('#panelExp .log-valor')].filter((v) => /…$/.test(v.innerText) && !v.nextElementSibling?.matches('details.log-ver')).length);
    check('c1-largo', 'un valor largo se acorta con «…» y trae «ver completo» (cerrado al principio; al abrirlo muestra el valor entero, idéntico al de la API); un JSON (anamnesis) se muestra legible, con sangría; ningún valor cortado sin su «ver completo»',
      idxLargo >= 0 && idxAnam >= 0 && visibleLargo.endsWith('…') && visibleLargo.length < LARGO.length && cerrado && completoLargo === LARGO
        && /\n {2}"/.test(preAnam) && JSON.stringify(Object.entries(JSON.parse(preAnam)).sort()) === JSON.stringify(Object.entries(ANAM).sort()) && cortesSinAviso === 0,
      JSON.stringify({ idxLargo, idxAnam, visibleLargo: visibleLargo.length, completo: completoLargo.length, cortesSinAviso }));

    /* c1-vacio · sin coincidencias no es un error: estado vacío con texto */
    let modVacio = null;
    for (const m of opciones.mod.filter(Boolean)) if (Number((await api('GET', `/hce/${idM}/auditoria?modulo=${m}&limit=1`)).total) === 0) { modVacio = m; break; }
    await filtrar(modVacio, '');
    const vacio = await pc.evaluate(() => ({ estado: !!document.querySelector('#panelExp .estado-vacio'), txt: document.getElementById('panelExp').innerText, alertas: document.querySelectorAll('#panelExp [role="alert"]').length, tabla: !!document.querySelector('#panelExp .log-table'), filtros: !!document.getElementById('logModulo') }));
    check('c1-vacio', 'un filtro sin coincidencias muestra el estado vacío compartido («No hay cambios que coincidan con los filtros.»), sin alerta de error, y los filtros siguen a la vista para cambiarlos',
      modVacio !== null && vacio.estado && /No hay cambios que coincidan con los filtros\./.test(vacio.txt) && vacio.alertas === 0 && !vacio.tabla && vacio.filtros, JSON.stringify({ modVacio, ...vacio, txt: undefined }));
    await filtrar('', '');

    /* c1-estados · 404 y 500 de la API: error compartido (404 sin Reintentar; 500 con Reintentar, que recupera) */
    await pc.route('**/auditoria*', (r) => r.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ code: 'not_found', detail: [{ campo: null, mensaje: 'No existe el expediente' }] }) }));
    await conAud(() => pc.evaluate(() => logCargar(false)));
    const e404 = await pc.evaluate(() => ({ alert: document.querySelectorAll('#panelExp .estado-error[role="alert"]').length, reint: document.querySelectorAll('#panelExp [data-reintentar]').length, txt: document.getElementById('panelExp').innerText }));
    await pc.unroute('**/auditoria*');
    await pc.route('**/auditoria*', (r) => r.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ code: 'internal_error', detail: [{ campo: null, mensaje: 'Error interno' }] }) }));
    await conAud(() => pc.evaluate(() => logCargar(false)));
    const e500 = await pc.evaluate(() => ({ alert: document.querySelectorAll('#panelExp .estado-error[role="alert"]').length, reint: document.querySelectorAll('#panelExp [data-reintentar]').length }));
    await pc.unroute('**/auditoria*');
    await conAud(() => pc.click('#panelExp [data-reintentar]')); await pc.waitForSelector('#panelExp .log-table', { timeout: 8000 });
    check('c1-estados', 'error de la API en la pestaña: 404 → «No se encontró el expediente.» en role="alert" SIN «Reintentar»; 500 → error en role="alert" CON «Reintentar», que al apretarlo vuelve a mostrar la tabla',
      e404.alert === 1 && e404.reint === 0 && /No se encontró el expediente\./.test(e404.txt) && e500.alert === 1 && e500.reint === 1, JSON.stringify({ e404: { ...e404, txt: undefined }, e500 }));

    /* c1-sin-boton · sin «Ver auditoría» en el expediente conectado; el del expediente de ejemplo sigue intacto */
    const conectado = await pc.evaluate(() => document.getElementById('view-expediente').innerText);
    await pc.evaluate(() => abrirExpedienteDemo(102)); await pc.waitForTimeout(150);
    const demo = await pc.evaluate(() => ({ btn: document.querySelectorAll('#view-expediente [onclick^="verHceLog"]').length, txt: document.getElementById('view-expediente').innerText }));
    await pc.evaluate(() => verHceLog(102)); await pc.waitForSelector('.log-table', { timeout: 4000 }); await pc.waitForTimeout(100);
    const modalDemo = await pc.evaluate(() => document.querySelector('#modalFlujo.open #mfTitle')?.innerText || '');
    await pc.keyboard.press('Escape'); await pc.waitForTimeout(150);
    check('c1-sin-boton', 'el expediente conectado no tiene botón «Ver auditoría» (la pestaña es la única entrada); el del expediente de ejemplo sigue con su botón y su modal «HCE-LOG» en modo demostración',
      !/Ver auditoría/.test(conectado) && demo.btn >= 1 && /Ver auditoría/.test(demo.txt) && /HCE-LOG/.test(modalDemo), JSON.stringify({ conectado: /Ver auditoría/.test(conectado), btnDemo: demo.btn }));

    /* c1-solo-lectura · el panel no tiene nada para escribir y mirarlo no deja filas */
    await pc.evaluate((i) => abrirExpediente(i), idM);
    await pc.waitForSelector('#expTitulo'); await pc.waitForFunction(() => !!EXP.flujo && !!EXP.mods, null, { timeout: 8000 });
    await pc.waitForSelector('#panelExp', { timeout: 8000 });
    await conAud(() => pc.click('#tabExp-log'));             // al volver a la pestaña se muestra la tabla de antes mientras se vuelve a pedir
    await filtrar('HCE-00', 'edicion'); await filtrar('', '');
    const controles = await pc.evaluate(() => [...document.querySelectorAll('#panelExp input, #panelExp textarea, #panelExp form, #panelExp [contenteditable]')].length);
    const totalDespues = Number((await api('GET', `/hce/${idM}/auditoria?limit=1`, undefined, tokAdmin)).total);
    check('c1-solo-lectura', 'la pestaña es de sólo lectura: sin campos de texto ni formularios (sólo dos selectores y el paginado), y abrirla, filtrarla y paginarla no agrega filas al LOG',
      controles === 0 && totalDespues === totalAntes, JSON.stringify({ controles, totalAntes, totalDespues }));

    /* c1-ajeno · A1: el técnico no lee el LOG de un expediente que no trata, ni con motivo (403 forbidden); coordinación, con
       la ventana; la pantalla del técnico es el diálogo del motivo, sin datos del NNA. El ajeno: alta del técnico en su grupo y
       pase de caso de coordinación (pasarDeCaso). */
    const idAjeno = await altaPropia(api, { nombre: 'Ajeno', apellido: 'C1', ci: '4.321.098-7', fecha_nac: '2016-04-12' });
    const pase = await pasarDeCaso(api, idAjeno, tokAdmin);
    const aTec = await api('GET', `/hce/${idAjeno}/auditoria`);
    const coord = await coordSinYConVentana(api, idAjeno, `/hce/${idAjeno}/auditoria`, tokAdmin);
    const pantalla = await pantallaMotivo(pc, idAjeno);
    check('c1-ajeno', 'técnico y expediente que no trata (alta propia + pase de caso): GET /hce/{id}/auditoria da 403 forbidden (el LOG queda fuera de la consulta del no tratante); coordinación 403 reason_required sin ventana y 200 con ella; la pantalla del técnico es el diálogo del motivo, sin datos del NNA',
      pase === 200 && ok403([aTec.status, aTec.json.code], 'forbidden') && ok403(coord.sin, 'reason_required') && coord.abre === 201 && coord.con === 200
        && pantalla.dialogo && !pantalla.banda && !/Ajeno/.test(pantalla.txt), JSON.stringify({ idAjeno, pase, tec: [aTec.status, aTec.json.code], coord, pantalla: { ...pantalla, txt: pantalla.txt.slice(0, 80) } }));
    await ctx.close();
  }

  /* ---------- C2 · HCE-SEV: la pestaña «Severidad» lee, registra y edita por la API ---------- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const ps = await ctx.newPage();
    ps.on('pageerror', (e) => erroresPagina.push(e.message));
    ps.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) erroresPagina.push('console: ' + m.text()); }); vigilarCarga(ps);
    await loguearComo(ps, EMAIL, PASSWORD);
    const tok = await ps.evaluate(() => sessionStorage.getItem('ippu.token'));
    const tokAdmin = (await (await fetch(API + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }) })).json()).access_token;
    const api = async (metodo, ruta, body, t) => { const r = await fetch(API + ruta, { method: metodo, headers: { Authorization: 'Bearer ' + (t || tok), 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) }); return { status: r.status, json: await r.json() }; };
    const yo = (await api('GET', '/auth/yo')).json;
    const idDe = async (n) => (await api('GET', '/hce?nombre=' + encodeURIComponent(n) + '&limit=5')).json.find((h) => h.persona.nombre === n).id;
    const idM = await idDe('Martín'), idS = await idDe('Sofía');
    const niveles = (await api('GET', '/severidad-niveles')).json;
    const escrituras = [];                                            // POST/PATCH a /severidad que salen del navegador
    ps.on('request', (r) => { if (/\/severidad$/.test(r.url()) && r.method() !== 'GET') escrituras.push({ m: r.method(), body: JSON.parse(r.postData() || 'null') }); });
    const abrirSev = async (id) => {
      await ps.evaluate((i) => abrirExpediente(i), id);
      await ps.waitForSelector('#expTitulo'); await ps.waitForFunction(() => !!EXP.flujo, null, { timeout: 8000 });
      await ps.click('#tabExp-sev');
      await ps.waitForFunction(() => !/Cargando/.test(document.getElementById('panelExp').innerText), null, { timeout: 8000 });
    };
    const fmt = (f) => ps.evaluate((x) => fmtFecha(x), f);

    /* c2-lectura · Martín: los dos dominios con la etiqueta del servidor, justificación, fecha y autor; la regla del módulo, una vez */
    await abrirSev(idM);
    const sevM = (await api('GET', `/hce/${idM}/severidad`)).json;
    const lect = await ps.evaluate(() => ({ cs: document.getElementById('sevCs')?.innerText, crr: document.getElementById('sevCrr')?.innerText, just: document.getElementById('sevJust')?.innerText,
      fecha: document.getElementById('sevFecha')?.innerText, autor: document.getElementById('sevAutor')?.innerText, panel: document.getElementById('panelExp').innerText,
      demo: document.querySelectorAll('#panelExp .demo-panel, #panelExp .solo-demo, #tabExp-sev .solo-demo').length, color: document.querySelectorAll('#panelExp .banda-chip, #panelExp [data-banda-paso]').length,
      notas: (document.getElementById('panelExp').innerText.match(/No se deriva del puntaje IDEA ni de la Escala IPPU-TEA/g) || []).length }));
    const REGLA = 'El nivel de severidad DSM-5-TR se registra por juicio clínico del profesional habilitado y se especifica por separado para cada dominio diagnóstico. No se deriva del puntaje IDEA ni de la Escala IPPU-TEA (instrumentos no homologables). La severidad puede variar según el contexto y fluctuar en el tiempo: este registro describe la necesidad de apoyo actual y no sustituye la determinación de elegibilidad para servicios o prestaciones.';
    check('c2-lectura', 'pestaña Severidad de Martín: los dos dominios (distintos) con la etiqueta que devuelve la API, la justificación, la fecha y el autor; la regla del módulo verbatim, una sola vez; sin panel ni marca «Solo demo» y sin color por grado',
      sevM.nivel_cs !== sevM.nivel_crr && lect.cs === sevM.etiqueta_cs && lect.crr === sevM.etiqueta_crr && lect.just === sevM.justificacion && lect.fecha === await fmt(sevM.fecha)
        && lect.autor === sevM.profesional.nombre && lect.notas === 1 && lect.panel.includes(REGLA) && lect.demo === 0 && lect.color === 0,
      JSON.stringify({ ...lect, panel: undefined, just: (lect.just || '').slice(0, 40) }));

    /* c2-referencia · la tabla de los tres grados viene de GET /severidad-niveles, plegada, en texto */
    const ref = await ps.evaluate(() => { const d = document.getElementById('sevRef'); return { abierta: d.open, filas: [...d.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((c) => c.textContent.trim())) }; });   // cerrado: textContent (innerText no rinde)
    check('c2-referencia', 'la referencia DSM-5-TR es colapsable (cerrada al entrar) y sus 3 filas son las de GET /severidad-niveles (etiqueta, descriptor CS, descriptor CRR, apoyos), en orden',
      ref.abierta === false && ref.filas.length === 3 && ref.filas.every((f, i) => f[0] === niveles[i].etiqueta && f[1] === niveles[i].descriptor_cs && f[2] === niveles[i].descriptor_crr && f[3] === niveles[i].apoyos),
      JSON.stringify({ abierta: ref.abierta, n: ref.filas.length, primeraDistinta: ref.filas.map((f, i) => [f, [niveles[i]?.etiqueta, niveles[i]?.descriptor_cs, niveles[i]?.descriptor_crr, niveles[i]?.apoyos]]).find(([a, b]) => JSON.stringify(a) !== JSON.stringify(b)) }).slice(0, 600));

    /* c2-solo-pestana · la severidad no sale de su pestaña: ni la banda del paciente ni el listado */
    const fuera = await ps.evaluate(([a, b]) => { const banda = document.getElementById('expHead')?.innerText || ''; return /Grado [123]|Necesita ayuda/.test(banda) || banda.includes(a) || banda.includes(b); }, [sevM.etiqueta_cs, sevM.etiqueta_crr]);
    await ps.evaluate(() => go('inicio')); await ps.waitForFunction(() => /Mostrando \d+ de/.test(document.getElementById('listaResumen').textContent), null, { timeout: 8000 });
    const enLista = await ps.evaluate(() => /Grado [123]|Necesita ayuda|DSM/.test(document.getElementById('tbodyNNA').innerText));
    check('c2-solo-pestana', 'la severidad no aparece en la banda del paciente ni en el listado', !fuera && !enLista, JSON.stringify({ fuera, enLista }));

    /* c2-vacio · Sofía no tiene registro: estado vacío compartido y la acción de registrar */
    await abrirSev(idS);
    const vac = await ps.evaluate(() => ({ vacio: document.querySelectorAll('#panelExp .estado-vacio[role="status"]').length, btn: !!document.getElementById('btnSevNuevo'), error: document.querySelectorAll('#panelExp [role="alert"]:not([hidden])').length, txt: document.getElementById('panelExp').innerText }));
    check('c2-vacio', 'un expediente sin severidad (Sofía; la API da 404) muestra el estado vacío compartido con «+ Registrar severidad», no un error',
      (await api('GET', `/hce/${idS}/severidad`)).status === 404 && vac.vacio === 1 && vac.btn && vac.error === 0 && /Todavía no se registró la severidad/.test(vac.txt), JSON.stringify({ ...vac, txt: undefined }));

    /* c2-entero · con un dominio sin elegir: se marca el campo y NO sale ningún pedido (se guarda entero o no se guarda) */
    await ps.click('#btnSevNuevo'); await ps.waitForSelector('#modalFlujo.open #sev_cs');
    const opciones = await ps.$$eval('#sev_cs option', (os) => os.map((o) => [o.value, o.textContent]));
    await ps.selectOption('#sev_cs', '2');
    const desc = await ps.evaluate(() => ({ t: document.getElementById('desc_sev_cs').innerText, oculto: document.getElementById('desc_sev_cs').hidden, por: document.getElementById('sev_cs').getAttribute('aria-describedby') }));
    await ps.fill('#sev_just', 'Observación en sala de c2.'); await ps.fill('#sev_fecha', '2026-04-02');
    const n0 = escrituras.length;
    await ps.click('#btnSevGuardar'); await ps.waitForSelector('#sevErrores:not([hidden])', { timeout: 3000 }); await ps.waitForTimeout(150);
    const ent = await ps.evaluate(() => ({ inv: [...document.querySelectorAll('#mfBody [aria-invalid="true"]')].map((e) => e.id), err: document.getElementById('err_sev_crr').innerText, foco: document.activeElement.id,
      resumen: document.getElementById('sevErrores').getAttribute('role'), abierto: document.getElementById('modalFlujo').classList.contains('open') }));
    check('c2-entero', 'registrar con un dominio sin elegir marca ese campo (aria-invalid + mensaje al lado), el resumen role="alert" recibe el foco y no sale ningún POST/PATCH; las opciones son las 3 etiquetas de la API y el descriptor del grado elegido se muestra junto al selector',
      escrituras.length === n0 && JSON.stringify(ent.inv) === '["sev_crr"]' && ent.err.length > 0 && ent.foco === 'sevErrores' && ent.resumen === 'alert' && ent.abierto
        && JSON.stringify(opciones.slice(1)) === JSON.stringify(niveles.map((n) => [String(n.grado), n.etiqueta])) && desc.t === niveles[1].descriptor_cs && !desc.oculto && /desc_sev_cs/.test(desc.por),
      JSON.stringify({ ent, nEscrituras: escrituras.length - n0, desc: { ...desc, t: desc.t.slice(0, 30) } }));

    /* c2-todos · el formulario vacío marca los cuatro campos a la vez */
    await ps.selectOption('#sev_cs', ''); await ps.fill('#sev_just', ''); await ps.fill('#sev_fecha', '');
    await ps.click('#btnSevGuardar'); await ps.waitForTimeout(150);
    const todos = await ps.evaluate(() => [...document.querySelectorAll('#mfBody [aria-invalid="true"]')].map((e) => e.id).sort());
    check('c2-todos', 'con todo vacío se marcan los cuatro campos (los dos dominios, la justificación y la fecha) y no se envía nada', JSON.stringify(todos) === '["sev_crr","sev_cs","sev_fecha","sev_just"]' && escrituras.length === n0, JSON.stringify(todos));

    /* c2-422 · un 422 de la API: mensaje junto al campo que dice `campo` y resumen role="alert" (el formulario no se pierde) */
    await ps.selectOption('#sev_cs', '3'); await ps.selectOption('#sev_crr', '1'); await ps.fill('#sev_just', 'Observación en sala de c2.'); await ps.fill('#sev_fecha', '2026-04-02');
    await ps.route('**/severidad', (r) => r.request().method() === 'POST' ? r.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ code: 'validation_error', detail: [{ campo: 'justificacion', mensaje: 'Es obligatoria (muestra)' }] }) }) : r.continue());
    await ps.click('#btnSevGuardar'); await ps.waitForFunction(() => /muestra/.test(document.getElementById('sevErrores').innerText), null, { timeout: 5000 });
    const e422 = await ps.evaluate(() => ({ inv: [...document.querySelectorAll('#mfBody [aria-invalid="true"]')].map((e) => e.id), err: document.getElementById('err_sev_just').innerText, foco: document.activeElement.id, cs: document.getElementById('sev_cs').value }));
    await ps.unroute('**/severidad');
    check('c2-422', 'un 422 de la API marca el campo que nombra `campo` (justificación) con su mensaje y lo resume en role="alert" con el foco; lo elegido se conserva',
      JSON.stringify(e422.inv) === '["sev_just"]' && /muestra/.test(e422.err) && e422.foco === 'sevErrores' && e422.cs === '3', JSON.stringify(e422));

    /* c2-registrar · completo: un POST con los cuatro campos; la lectura sale de la respuesta (etiquetas y autor del servidor) */
    const nPost = escrituras.length;
    await ps.click('#btnSevGuardar'); await ps.waitForSelector('#sevLectura', { timeout: 8000 }); await ps.waitForTimeout(150);
    const sevS = (await api('GET', `/hce/${idS}/severidad`)).json;
    const reg = await ps.evaluate(() => ({ cs: document.getElementById('sevCs').innerText, crr: document.getElementById('sevCrr').innerText, autor: document.getElementById('sevAutor').innerText, modal: document.getElementById('modalFlujo').classList.contains('open'), foco: document.activeElement.id }));
    const post = escrituras.slice(nPost);
    check('c2-registrar', 'Sofía: con los dos dominios, justificación y fecha sale UN POST con los cuatro campos (sin profesional_id); se cierra el diálogo y la lectura muestra la etiqueta de la API y como autor al técnico',
      post.length === 1 && post[0].m === 'POST' && JSON.stringify(Object.keys(post[0].body).sort()) === '["fecha","justificacion","nivel_crr","nivel_cs"]' && sevS.nivel_cs === 3 && sevS.nivel_crr === 1
        && reg.cs === sevS.etiqueta_cs && reg.crr === sevS.etiqueta_crr && reg.autor === yo.nombre && sevS.profesional.id === yo.id && !reg.modal && reg.foco === 'sevTitulo', JSON.stringify({ post, reg }));

    /* c2-descarte · «Editar» reabre el formulario; con un cambio sin guardar, Esc pide confirmación; descartar no envía nada */
    await ps.click('#btnSevEditar'); await ps.waitForSelector('#modalFlujo.open #sev_cs');
    const pre = await ps.evaluate(() => [document.getElementById('sev_cs').value, document.getElementById('sev_crr').value, document.getElementById('sev_fecha').value]);
    await ps.selectOption('#sev_crr', '2');
    const nDesc = escrituras.length;
    await ps.keyboard.press('Escape'); await ps.waitForSelector('#modalFlujo .confirmar-descarte', { timeout: 3000 });
    const pide = await ps.evaluate(() => document.activeElement.id);
    await ps.click('#btnCdDescartar'); await ps.waitForTimeout(200);
    const cerrado = await ps.evaluate(() => !document.getElementById('modalFlujo').classList.contains('open'));
    check('c2-descarte', '«Editar» reabre el formulario con lo guardado; con un cambio sin guardar, Esc pide confirmación (foco en «Seguir editando») y «Descartar y cerrar» cierra sin enviar nada',
      JSON.stringify(pre) === JSON.stringify(['3', '1', sevS.fecha]) && pide === 'btnCdSeguir' && cerrado && escrituras.length === nDesc, JSON.stringify({ pre, pide, cerrado }));

    /* c2-editar-log · Martín: editar CS de 2 a 3 manda sólo ese campo; el LOG lo muestra con antes → después */
    await abrirSev(idM);
    const antesCs = sevM.nivel_cs;
    await ps.click('#btnSevEditar'); await ps.waitForSelector('#modalFlujo.open #sev_cs');
    await ps.selectOption('#sev_cs', '3');
    const nEd = escrituras.length;
    await ps.click('#btnSevGuardar'); await ps.waitForFunction(() => !document.getElementById('modalFlujo').classList.contains('open'), null, { timeout: 8000 });
    await ps.waitForSelector('#sevLectura'); await ps.waitForTimeout(150);
    const ed = escrituras.slice(nEd);
    const csTras = await ps.evaluate(() => document.getElementById('sevCs').innerText);
    await ps.click('#tabExp-log'); await ps.waitForSelector('#panelExp .log-table', { timeout: 8000 });
    await ps.selectOption('#logModulo', 'HCE-SEV');
    await ps.waitForFunction(() => !/Cargando/.test(document.getElementById('panelExp').innerText) && !!document.querySelector('#panelExp .log-table'), null, { timeout: 8000 });
    await ps.waitForTimeout(150);
    const filasLog = await ps.evaluate(() => [...document.querySelectorAll('#panelExp .log-table tbody tr')].map((tr) => [...tr.children].map((td) => td.innerText.replace(/\s+/g, ' ').trim())));
    const filaCs = filasLog.find((f) => f[4] === 'Comunicación social');   // F3: nombre legible de «nivel_cs»
    check('c2-editar-log', 'Martín: editar comunicación social de 2 a 3 manda un PATCH sólo con nivel_cs; la lectura muestra la etiqueta nueva de la API y la pestaña Auditoría (filtro HCE-SEV) lista la edición con su autor y «Antes: 2 Después: 3»',
      antesCs === 2 && ed.length === 1 && ed[0].m === 'PATCH' && JSON.stringify(ed[0].body) === '{"nivel_cs":3}' && csTras === niveles[2].etiqueta
        && !!filaCs && filaCs[1] === yo.nombre && filaCs[2] === 'Severidad (SEV)' && /Antes: 2 Después: 3/.test(filaCs[5]) && filasLog.some((f) => /Se creó/.test(f[3])),
      JSON.stringify({ ed, csTras, filaCs }));

    /* c2-ajeno · A1: el técnico carga la severidad en su grupo, coordinación hace el pase de caso; desde ahí el técnico recibe
       403 reason_required en la lectura y forbidden en las escrituras; coordinación lee con la ventana; la pantalla es el diálogo. */
    const idAjeno = await altaPropia(api, { nombre: 'Ajeno', apellido: 'C2', ci: '4.765.432-1', fecha_nac: '2016-04-12' });
    const regTec = await api('POST', `/hce/${idAjeno}/severidad`, { nivel_cs: 1, nivel_crr: 1, justificacion: 'Registro del técnico (c2).', fecha: '2026-04-02' });
    const pase = await pasarDeCaso(api, idAjeno, tokAdmin);
    const aTec = await api('GET', `/hce/${idAjeno}/severidad`), eTec = await api('PATCH', `/hce/${idAjeno}/severidad`, { nivel_cs: 2 });
    const coord = await coordSinYConVentana(api, idAjeno, `/hce/${idAjeno}/severidad`, tokAdmin);
    const pant = await pantallaMotivo(ps, idAjeno);
    check('c2-ajeno', 'técnico y expediente que no trata (con severidad cargada por él antes del pase de caso): GET /hce/{id}/severidad da 403 reason_required y el PATCH 403 forbidden; coordinación 403 sin ventana y 200 con ella; la pantalla es el diálogo del motivo, sin datos',
      regTec.status === 201 && pase === 200 && ok403([aTec.status, aTec.json.code], 'reason_required') && ok403([eTec.status, eTec.json.code], 'forbidden')
        && ok403(coord.sin, 'reason_required') && coord.abre === 201 && coord.con === 200 && pant.dialogo && !pant.banda && !/Grado|Registro del técnico|Ajeno/.test(pant.txt),
      JSON.stringify({ reg: regTec.status, pase, tec: [aTec.status, aTec.json.code, eTec.status], coord, pant: { ...pant, txt: pant.txt.slice(0, 60) } }));

    /* c2-vf-reporte · el Reporte de VF (se arma en el navegador desde GET /hce/{id}/valoracion-funcional) no lleva la severidad: ni «Grado», ni las etiquetas, ni la justificación */
    let vfM = await api('GET', `/hce/${idM}/valoracion-funcional`);
    if (vfM.status === 404) vfM = await api('POST', `/hce/${idM}/valoracion-funcional`, { estado: 'Valorado', fecha: '2026-05-14', organismo: 'Equipo valorador BPS', pct: '58', vigencia: '2030-05-14', rnpcd: 'RNPcD-10452' });
    const sevFin = (await api('GET', `/hce/${idM}/severidad`)).json;
    await ps.evaluate((i) => abrirExpediente(i), idM);
    await ps.waitForSelector('#expTitulo'); await ps.waitForFunction(() => !!EXP.flujo, null, { timeout: 8000 });
    await ps.click('#tabExp-vf'); await ps.waitForSelector('#btnVfReporte'); await ps.click('#btnVfReporte');
    await ps.waitForFunction(() => /Reporte de Valoración Funcional/.test(document.getElementById('informeContent').innerText) && !!document.querySelector('#informeContent .doc-datos'), null, { timeout: 8000 });
    const repTxt = await ps.evaluate(() => document.getElementById('informeContent').innerText);
    check('c2-vf-reporte', 'Martín (con valoración funcional y severidad): el «Reporte de Valoración Funcional» no contiene «Grado», ni etiqueta_cs ni etiqueta_crr, ni la justificación de su severidad',
      [200, 201].includes(vfM.status) && !!sevFin.etiqueta_cs && !!sevFin.etiqueta_crr && !!sevFin.justificacion
        && !/Grado/.test(repTxt) && !repTxt.includes(sevFin.etiqueta_cs) && !repTxt.includes(sevFin.etiqueta_crr) && !repTxt.includes(sevFin.justificacion),
      JSON.stringify({ vf: vfM.status, sev: [sevFin.etiqueta_cs, sevFin.etiqueta_crr], repTxt: repTxt.slice(0, 120) }));
    await ctx.close();
  }

  /* ---------- C3 · HCE-ORG: la pestaña «Organismos» lee, registra y edita por la API ---------- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const ps = await ctx.newPage();
    ps.on('pageerror', (e) => erroresPagina.push(e.message));
    ps.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) erroresPagina.push('console: ' + m.text()); }); vigilarCarga(ps);
    await loguearComo(ps, EMAIL, PASSWORD);
    const tok = await ps.evaluate(() => sessionStorage.getItem('ippu.token'));
    const tokAdmin = (await (await fetch(API + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }) })).json()).access_token;
    const api = async (metodo, ruta, body, t) => { const r = await fetch(API + ruta, { method: metodo, headers: { Authorization: 'Bearer ' + (t || tok), 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) }); return { status: r.status, json: await r.json(), total: r.headers.get('X-Total-Count') }; };
    const yo = (await api('GET', '/auth/yo')).json;
    const idDe = async (n) => (await api('GET', '/hce?nombre=' + encodeURIComponent(n) + '&limit=5')).json.find((h) => h.persona.nombre === n).id;
    const idM = await idDe('Martín'), idS = await idDe('Sofía'), idJ = await idDe('Joaquín');
    const opciones = (await api('GET', '/organismos/opciones')).json;
    const iso = (dias) => { const d = new Date(); d.setDate(d.getDate() + dias); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
    const escrituras = [];                                            // POST/PATCH a /organismos que salen del navegador
    ps.on('request', (r) => { if (/\/organismos(\/|$)/.test(new URL(r.url()).pathname) && r.method() !== 'GET') escrituras.push({ m: r.method(), url: new URL(r.url()).pathname, body: JSON.parse(r.postData() || 'null') }); });
    const esperarOrg = () => ps.waitForFunction(() => ORG.estado === 'listo' && !!document.getElementById('orgVinculoInau') && !/Cargando/.test(document.getElementById('panelExp').innerText), null, { timeout: 8000 });
    const abrirOrg = async (id) => {
      await ps.evaluate((i) => abrirExpediente(i), id);
      await ps.waitForSelector('#expTitulo'); await ps.waitForFunction(() => !!EXP.flujo, null, { timeout: 8000 });
      await ps.click('#tabExp-org'); await esperarOrg(); await ps.waitForTimeout(80);
    };
    const fmt = (f) => ps.evaluate((x) => fmtFecha(x), f);
    const txt = (id) => ps.evaluate((i) => { const e = document.getElementById(i); return e ? e.innerText.replace(/\s+/g, ' ').trim() : null; }, id);
    const filasReg = (id) => ps.evaluate((i) => [...document.querySelectorAll(`#${i} tbody tr`)].map((tr) => [...tr.children].map((td) => td.innerText.replace(/\s+/g, ' ').trim())), id);
    const org = async (id) => (await api('GET', `/hce/${id}/organismos`)).json;
    const regs = async (id, o) => (await api('GET', `/hce/${id}/organismos/registros?organismo=${o}`));

    /* c3-lectura · Martín: INAU y BPS con lo que devuelve la API, sus envíos (el más nuevo primero) y ninguna alerta */
    await abrirOrg(idM);
    const oM = await org(idM), rM = await regs(idM, 'inau');
    const lect = await ps.evaluate(() => ({ demo: document.querySelectorAll('#panelExp .demo-panel, #panelExp .solo-demo, #tabExp-org .solo-demo').length, alerta: document.querySelectorAll('#orgAlerta').length,
      tarjetas: document.querySelectorAll('#panelExp .org-col .info-card').length, panel: document.getElementById('panelExp').innerText, tab: document.getElementById('tabExp-org').getAttribute('aria-selected') }));
    const filasI = await filasReg('orgRegInau');
    const fechasI = await Promise.all(rM.json.map((x) => fmt(x.fecha)));
    check('c3-lectura', 'pestaña Organismos de Martín: INAU (convenio, referente, ingreso) y BPS (AYEX, trámite, estado, vencimiento) con lo que devuelve la API, «—» donde no hay dato, sus dos envíos a INAU del más nuevo al más viejo con su autor, sin alerta, sin panel ni marca «Solo demo»',
      oM.inau.convenio && oM.inau.referente && await txt('orgInauConvenio') === oM.inau.convenio && await txt('orgInauReferente') === oM.inau.referente && await txt('orgInauIngreso') === await fmt(oM.inau.ingreso)
        && await txt('orgInauSipi') === '—' && await txt('orgInauObs') === '—'
        && await txt('orgBpsPrestacion') === oM.bps.prestacion && await txt('orgBpsEstado') === oM.bps.estado && await txt('orgBpsTramite') === oM.bps.tramite && await txt('orgBpsVencimiento') === await fmt(oM.bps.vencimiento)
        && rM.json.length === 2 && rM.total === '2' && filasI.length === 2 && rM.json.every((x, i) => filasI[i][0] === fechasI[i] && filasI[i][1] === x.detalle && filasI[i][2] === x.autor.nombre)
        && rM.json[0].fecha >= rM.json[1].fecha
        && oM.bps.alerta === null && lect.alerta === 0 && lect.demo === 0 && lect.tarjetas === 4 && lect.tab === 'true',
      JSON.stringify({ lect: { ...lect, panel: undefined }, filasI }).slice(0, 500));

    /* c3-nota · la nota del IPPU del acta (§5.40): IC anual; los informes a pedido para organismos todavía no están; los respaldos van a Documentos */
    const nota = await txt('orgNota');
    check('c3-nota', 'la nota dice que el informe de cierre anual es el IC, que los informes a pedido para organismos (por ejemplo, de INAU sobre un solo chico) todavía no están en esta versión, y que los respaldos se adjuntan en Documentos; ya no afirma que el IC sea «siempre» el único (acta del 2026-08-26, §5.40)',
      nota === 'El informe de cierre anual es el IC. Los informes a pedido para organismos (por ejemplo, de INAU sobre un solo chico) todavía no están en esta versión. Los documentos de respaldo se adjuntan en Documentos.'
        && !/siempre|único documento/.test(nota), nota);

    /* c3-sin-calculo · la alerta sale SOLO de la respuesta: el navegador no cuenta días ni decide si una prestación es AYEX */
    await ps.route('**/organismos', async (r) => { const real = await (await r.fetch()).json(); const u = r.request().url();
      if (u.includes(`/hce/${idM}/`)) real.bps.alerta = { nivel: 'vencida', dias: -3, mensaje: 'Texto que manda el servidor (muestra).' };
      if (u.includes(`/hce/${idS}/`)) real.bps.alerta = null;
      await r.fulfill({ json: real }); });
    await abrirOrg(idM);
    const conAlerta = await ps.evaluate(() => { const a = document.getElementById('orgAlerta'); return a ? a.innerText.replace(/\s+/g, ' ') : null; });
    await abrirOrg(idS);
    const sinAlerta = await ps.evaluate(() => document.querySelectorAll('#orgAlerta').length);
    const vencS = await txt('orgBpsVencimiento');
    await ps.unroute('**/organismos');
    check('c3-sin-calculo', 'la alerta AYEX es la de la respuesta: si el servidor manda una alerta (aunque el vencimiento esté lejos) se muestra tal cual con su texto, y si manda null no se muestra aunque el vencimiento esté a 25 días y la prestación sea AYEX',
      /Vencida/.test(conAlerta || '') && /Texto que manda el servidor \(muestra\)\./.test(conAlerta || '') && /⚠/.test(conAlerta || '') && sinAlerta === 0 && vencS !== '—', JSON.stringify({ conAlerta, sinAlerta, vencS }));

    /* c3-alerta · Sofía (AYEX en trámite a 25 días): la alerta del servidor, en palabras y con ⚠ */
    await abrirOrg(idS);
    const oS = await org(idS), aS = oS.bps.alerta;
    const alertaTxt = await ps.evaluate(() => { const a = document.getElementById('orgAlerta'); return a ? { t: a.innerText.replace(/\s+/g, ' '), glifo: !!a.querySelector('[aria-hidden="true"]'), dentro: !!a.closest('#orgVinculoBps') } : null; });
    check('c3-alerta', 'Sofía (AYEX en trámite, vencimiento a 25 días): la tarjeta de BPS muestra la alerta del servidor con ⚠ y en palabras («vence en 25 días»), junto al vencimiento',
      !!aS && aS.nivel === '30_dias' && aS.dias === 25 && !!alertaTxt && alertaTxt.dentro && alertaTxt.glifo && alertaTxt.t.includes(aS.mensaje) && /Vence en 30 días o menos/.test(alertaTxt.t) && /vence en 25 días/.test(alertaTxt.t)
        && await txt('orgBpsVencimiento') === await fmt(oS.bps.vencimiento), JSON.stringify({ aS, alertaTxt }));

    /* c3-vacio · Sofía no tiene INAU: estado vacío compartido con «Registrar»; y su única gestión ante BPS está listada */
    const vac = await ps.evaluate(() => ({ vacio: document.querySelectorAll('#orgVinculoInau .estado-vacio[role="status"]').length, btn: (document.getElementById('btnOrgInauNuevo') || {}).innerText || '', error: document.querySelectorAll('#panelExp [role="alert"]:not([hidden])').length }));
    const gS = await regs(idS, 'bps'), filasB = await filasReg('orgRegBps');
    check('c3-vacio', 'Sofía sin INAU (la API da null): estado vacío compartido con «+ Registrar vínculo con INAU», no un error; su gestión ante BPS aparece en la lista con el autor y el contador del total',
      oS.inau === null && vac.vacio === 1 && /Registrar/.test(vac.btn) && vac.error === 0 && gS.json.length === 1 && filasB.length === 1 && filasB[0][1] === gS.json[0].detalle && filasB[0][2] === gS.json[0].autor.nombre && await txt('orgTotalBps') === '1',
      JSON.stringify({ vac, filasB }));

    /* c3-joaquin · Joaquín: INAU con su ingreso y la lista de envíos vacía; BPS sin registrar */
    await abrirOrg(idJ);
    const oJ = await org(idJ);
    const joa = await ps.evaluate(() => ({ vacioReg: (document.getElementById('orgRegInauVacio') || {}).innerText || '', tabla: document.querySelectorAll('#orgRegInau').length, bpsVacio: document.querySelectorAll('#orgVinculoBps .estado-vacio').length }));
    check('c3-joaquin', 'Joaquín: INAU con convenio e ingreso de la API y la lista de envíos vacía con su mensaje (sin tabla); BPS en estado vacío',
      oJ.inau.ingreso && await txt('orgInauIngreso') === await fmt(oJ.inau.ingreso) && (await regs(idJ, 'inau')).json.length === 0 && /Todavía no se registró ningún envío a INAU/.test(joa.vacioReg) && joa.tabla === 0 && joa.bpsVacio === 1 && oJ.bps === null,
      JSON.stringify(joa));

    /* c3-opciones · el formulario de BPS ofrece las opciones de GET /organismos/opciones y deja elegido lo guardado */
    await abrirOrg(idS);
    await ps.click('#btnOrgBpsEditar'); await ps.waitForSelector('#modalFlujo.open #orgb_prestacion');
    const opc = await ps.evaluate(() => ({ prest: [...document.querySelectorAll('#orgb_prestacion option')].map((o) => o.value), estado: [...document.querySelectorAll('#orgb_estado option')].map((o) => o.value),
      selP: document.getElementById('orgb_prestacion').value, selE: document.getElementById('orgb_estado').value, venc: document.getElementById('orgb_vencimiento').value,
      etiquetas: [...document.querySelectorAll('#mfBody .field')].every((f) => { const c = f.querySelector('input, select, textarea'); return c && f.querySelector(`label[for="${c.id}"]`); }) }));
    check('c3-opciones', 'editar BPS: la lista de prestaciones y la de estados son las de GET /organismos/opciones (más «sin registrar»), lo guardado queda elegido, el vencimiento viene de la API y cada control tiene su etiqueta',
      JSON.stringify(opc.prest.slice(1)) === JSON.stringify(opciones.bps_prestaciones) && JSON.stringify(opc.estado.slice(1)) === JSON.stringify(opciones.bps_estados) && opc.selP === oS.bps.prestacion && opc.selE === oS.bps.estado && opc.venc === oS.bps.vencimiento && opc.etiquetas,
      JSON.stringify(opc).slice(0, 400));

    /* c3-sin-cambios · guardar sin tocar nada no envía nada */
    const n0 = escrituras.length;
    await ps.click('#btnOrgGuardar'); await ps.waitForSelector('#orgErrores:not([hidden])', { timeout: 3000 });
    const sc = await ps.evaluate(() => ({ foco: document.activeElement.id, rol: document.getElementById('orgErrores').getAttribute('role'), txt: document.getElementById('orgErrores').innerText, abierto: document.getElementById('modalFlujo').classList.contains('open') }));
    check('c3-sin-cambios', 'guardar el vínculo sin cambios dice «No hay cambios para guardar», el resumen role="alert" recibe el foco, el diálogo sigue abierto y no sale ningún pedido',
      escrituras.length === n0 && sc.foco === 'orgErrores' && sc.rol === 'alert' && /No hay cambios/.test(sc.txt) && sc.abierto, JSON.stringify(sc));

    /* c3-descarte · con un cambio sin guardar, Esc pide confirmación; «Descartar y cerrar» no envía nada */
    await ps.fill('#orgb_tramite', 'AYEX-descartado');
    await ps.keyboard.press('Escape'); await ps.waitForSelector('#modalFlujo .confirmar-descarte', { timeout: 3000 });
    const pide = await ps.evaluate(() => document.activeElement.id);
    await ps.click('#btnCdDescartar'); await ps.waitForTimeout(200);
    check('c3-descarte', 'con un cambio sin guardar, Esc pide confirmación (foco en «Seguir editando») y «Descartar y cerrar» cierra sin enviar nada; el vínculo sigue como estaba',
      pide === 'btnCdSeguir' && !(await ps.evaluate(() => document.getElementById('modalFlujo').classList.contains('open'))) && escrituras.length === n0 && await txt('orgBpsTramite') === oS.bps.tramite, JSON.stringify({ pide }));

    /* c3-vacio-422 · registrar INAU con todo vacío: lo rechaza el servidor (campo null) y se muestra en el resumen; no se crea nada */
    await ps.click('#btnOrgInauNuevo'); await ps.waitForSelector('#modalFlujo.open #orgi_convenio');
    await ps.click('#btnOrgGuardar'); await ps.waitForSelector('#orgErrores:not([hidden])', { timeout: 5000 });
    const v422 = await ps.evaluate(() => ({ foco: document.activeElement.id, txt: document.getElementById('orgErrores').innerText, inv: document.querySelectorAll('#mfBody [aria-invalid="true"]').length, abierto: document.getElementById('modalFlujo').classList.contains('open') }));
    const postVacio = escrituras.slice(n0);
    check('c3-vacio-422', 'registrar INAU con todo vacío envía el POST, el servidor contesta 422 sin campo y el resumen role="alert" (con el foco) lo dice; no se marca ningún control y no se crea el vínculo',
      postVacio.length === 1 && postVacio[0].m === 'POST' && JSON.stringify(postVacio[0].body) === '{}' && v422.foco === 'orgErrores' && /al menos un dato/.test(v422.txt) && v422.inv === 0 && v422.abierto && (await org(idS)).inau === null,
      JSON.stringify({ postVacio, v422 }));

    /* c3-registrar-inau · un solo dato: el POST lleva sólo ese campo; la lectura sale de la respuesta */
    await ps.fill('#orgi_convenio', 'Convenio de c3'); await ps.fill('#orgi_ingreso', '2026-05-04');
    const nP = escrituras.length;
    await ps.click('#btnOrgGuardar'); await ps.waitForSelector('#orgInauLectura', { timeout: 8000 }); await ps.waitForTimeout(150);
    const postI = escrituras.slice(nP), oS2 = await org(idS);
    const regI = await ps.evaluate(() => ({ modal: document.getElementById('modalFlujo').classList.contains('open'), foco: document.activeElement.id, nuevo: !!document.getElementById('btnOrgInauNuevo') }));
    check('c3-registrar-inau', 'Sofía: registrar INAU con convenio e ingreso envía UN POST sólo con esos dos campos; se cierra el diálogo, el foco va al título y la lectura muestra lo que devolvió la API',
      postI.length === 1 && postI[0].m === 'POST' && JSON.stringify(Object.keys(postI[0].body).sort()) === '["convenio","ingreso"]' && oS2.inau.convenio === 'Convenio de c3' && oS2.inau.ingreso === '2026-05-04'
        && await txt('orgInauConvenio') === 'Convenio de c3' && await txt('orgInauIngreso') === await fmt('2026-05-04') && !regI.modal && regI.foco === 'orgTitulo' && !regI.nuevo, JSON.stringify({ postI, regI }));

    /* c3-422 · un 422 de la API marca el campo que nombra `campo` y se resume en role="alert"; lo tipeado se conserva */
    await ps.click('#btnOrgBpsEditar'); await ps.waitForSelector('#modalFlujo.open #orgb_estado');
    await ps.selectOption('#orgb_estado', 'Observada');
    await ps.route('**/organismos/bps', (r) => r.request().method() === 'PATCH' ? r.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ code: 'validation_error', detail: [{ campo: 'estado', mensaje: 'Estado no válido (muestra)' }] }) }) : r.continue());
    await ps.click('#btnOrgGuardar'); await ps.waitForFunction(() => /muestra/.test(document.getElementById('orgErrores').innerText), null, { timeout: 5000 });
    const e422 = await ps.evaluate(() => ({ inv: [...document.querySelectorAll('#mfBody [aria-invalid="true"]')].map((e) => e.id), err: document.getElementById('err_orgb_estado').innerText, foco: document.activeElement.id, estado: document.getElementById('orgb_estado').value }));
    await ps.unroute('**/organismos/bps');
    check('c3-422', 'un 422 de la API marca el control que nombra `campo` (estado) con su mensaje y lo resume en role="alert" con el foco; lo elegido se conserva',
      JSON.stringify(e422.inv) === '["orgb_estado"]' && /muestra/.test(e422.err) && e422.foco === 'orgErrores' && e422.estado === 'Observada', JSON.stringify(e422));

    /* c3-editar-bps · cambiar estado y vencimiento manda un PATCH sólo con esos dos campos; la alerta desaparece porque el servidor la quita */
    await ps.fill('#orgb_vencimiento', iso(200));
    const nE = escrituras.length;
    await ps.selectOption('#orgb_estado', 'Vigente');
    await ps.click('#btnOrgGuardar'); await ps.waitForFunction(() => !document.getElementById('modalFlujo').classList.contains('open'), null, { timeout: 8000 });
    await ps.waitForSelector('#orgBpsLectura'); await ps.waitForTimeout(150);
    const edit = escrituras.slice(nE), oS3 = await org(idS);
    check('c3-editar-bps', 'Sofía: cambiar el estado a «Vigente» y el vencimiento a +200 días envía UN PATCH sólo con esos dos campos; la lectura sale de la respuesta y la alerta ya no se muestra (la API devuelve null)',
      edit.length === 1 && edit[0].m === 'PATCH' && JSON.stringify(Object.keys(edit[0].body).sort()) === '["estado","vencimiento"]' && oS3.bps.estado === 'Vigente' && oS3.bps.alerta === null
        && await txt('orgBpsEstado') === 'Vigente' && await txt('orgBpsVencimiento') === await fmt(iso(200)) && (await ps.evaluate(() => document.querySelectorAll('#orgAlerta').length)) === 0, JSON.stringify({ edit, alerta: oS3.bps.alerta }));

    /* c3-registro-requeridos · fecha y detalle faltantes: se marcan y no sale ningún pedido */
    await ps.click('#btnOrgBpsAgregar'); await ps.waitForSelector('#modalFlujo.open #orgr_detalle');
    const hoyPre = await ps.inputValue('#orgr_fecha');
    await ps.fill('#orgr_fecha', '');
    const nR = escrituras.length;
    await ps.click('#btnOrgGuardar'); await ps.waitForSelector('#orgErrores:not([hidden])', { timeout: 3000 });
    const rq = await ps.evaluate(() => ({ inv: [...document.querySelectorAll('#mfBody [aria-invalid="true"]')].map((e) => e.id).sort(), foco: document.activeElement.id, rol: document.getElementById('orgErrores').getAttribute('role'),
      req: [...document.querySelectorAll('#mfBody [aria-required="true"]')].map((e) => e.id).sort(), aut: !!document.querySelector('#mfBody [id*="autor"]') }));
    check('c3-registro-requeridos', 'agregar una gestión sin fecha ni detalle marca los dos campos (aria-invalid + mensaje), el resumen role="alert" recibe el foco y no sale ningún pedido; el formulario no pide autor y ofrece la fecha de hoy',
      escrituras.length === nR && JSON.stringify(rq.inv) === '["orgr_detalle","orgr_fecha"]' && rq.foco === 'orgErrores' && rq.rol === 'alert' && JSON.stringify(rq.req) === '["orgr_detalle","orgr_fecha"]' && !rq.aut && hoyPre === iso(0), JSON.stringify({ rq, hoyPre }));

    /* c3-nueva-gestion · una gestión nueva aparece primera, con el autor del token, y deja su constancia en Auditoría */
    await ps.fill('#orgr_fecha', iso(0)); await ps.fill('#orgr_detalle', 'Constancia de asistencia presentada (c3).');
    const nG = escrituras.length;
    await ps.click('#btnOrgGuardar'); await ps.waitForFunction(() => !document.getElementById('modalFlujo').classList.contains('open'), null, { timeout: 8000 });
    await ps.waitForFunction(() => document.querySelectorAll('#orgRegBps tbody tr').length === 2, null, { timeout: 8000 }); await ps.waitForTimeout(150);
    const gn = escrituras.slice(nG), gAPI = await regs(idS, 'bps'), filasG = await filasReg('orgRegBps');
    check('c3-nueva-gestion', 'Sofía: agregar una gestión envía UN POST con organismo, fecha y detalle (sin autor); aparece primera en la lista con el autor que devuelve la API, el contador pasa a 2, el foco va al título y el orden es el de la API',
      gn.length === 1 && gn[0].m === 'POST' && JSON.stringify(Object.keys(gn[0].body).sort()) === '["detalle","fecha","organismo"]' && gn[0].body.organismo === 'bps'
        && gAPI.json.length === 2 && gAPI.json[0].detalle === 'Constancia de asistencia presentada (c3).' && gAPI.json[0].autor.id === yo.id && filasG[0][1] === gAPI.json[0].detalle && filasG[0][2] === yo.nombre && filasG[1][1] === gAPI.json[1].detalle
        && await txt('orgTotalBps') === '2' && (await ps.evaluate(() => document.activeElement.id)) === 'orgTitulo', JSON.stringify({ gn, filasG }));

    /* c3-registro-422 · un 422 sobre el detalle se muestra junto al campo */
    await ps.click('#btnOrgInauAgregar'); await ps.waitForSelector('#modalFlujo.open #orgr_detalle');
    await ps.fill('#orgr_detalle', 'Texto cualquiera');
    await ps.route('**/organismos/registros', (r) => r.request().method() === 'POST' ? r.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ code: 'validation_error', detail: [{ campo: 'detalle', mensaje: 'Detalle no válido (muestra)' }] }) }) : r.continue());
    await ps.click('#btnOrgGuardar'); await ps.waitForFunction(() => /muestra/.test(document.getElementById('orgErrores').innerText), null, { timeout: 5000 });
    const r422 = await ps.evaluate(() => ({ inv: [...document.querySelectorAll('#mfBody [aria-invalid="true"]')].map((e) => e.id), err: document.getElementById('err_orgr_detalle').innerText, foco: document.activeElement.id, detalle: document.getElementById('orgr_detalle').value }));
    await ps.unroute('**/organismos/registros');
    await ps.keyboard.press('Escape'); await ps.waitForSelector('#modalFlujo .confirmar-descarte', { timeout: 3000 }); await ps.click('#btnCdDescartar'); await ps.waitForTimeout(200);
    check('c3-registro-422', 'un 422 de la API sobre el detalle lo marca junto al campo y en el resumen role="alert" con el foco; lo tipeado se conserva',
      JSON.stringify(r422.inv) === '["orgr_detalle"]' && /muestra/.test(r422.err) && r422.foco === 'orgErrores' && r422.detalle === 'Texto cualquiera', JSON.stringify(r422));

    /* c3-log · la pestaña Auditoría (filtro HCE-ORG) lista el alta del INAU, la edición de BPS con antes → después y la gestión nueva, con su autor */
    await ps.click('#tabExp-log'); await ps.waitForSelector('#panelExp .log-table', { timeout: 8000 });
    await ps.selectOption('#logModulo', 'HCE-ORG');
    await ps.waitForFunction(() => !/Cargando/.test(document.getElementById('panelExp').innerText) && !!document.querySelector('#panelExp .log-table'), null, { timeout: 8000 });
    await ps.waitForTimeout(150);
    const filasLog = await ps.evaluate(() => [...document.querySelectorAll('#panelExp .log-table tbody tr')].map((tr) => [...tr.children].map((td) => td.innerText.replace(/\s+/g, ' ').trim())));
    const fEstado = filasLog.find((f) => f[4] === 'BPS · Estado'), fVenc = filasLog.find((f) => f[4] === 'BPS · Vencimiento o renovación');   // F3: «bps.estado», «bps.vencimiento» con su nombre legible
    check('c3-log', 'Auditoría (filtro HCE-ORG) de Sofía: la gestión nueva y el alta de INAU («Se creó un registro»), y las ediciones bps.estado («Antes: En trámite Después: Vigente») y bps.vencimiento, todas con su autor',
      filasLog.every((f) => f[1] === yo.nombre && f[2] === 'Organismos (ORG)') && filasLog.filter((f) => /Se creó/.test(f[3])).length >= 4 && filasLog.some((f) => /Gestión ante BPS/.test(f[3]))
        && !!fEstado && /Antes: En trámite Después: Vigente/.test(fEstado[5]) && !!fVenc && /Después: /.test(fVenc[5]), JSON.stringify({ n: filasLog.length, fEstado }));

    /* c3-ajeno · A1: el técnico carga el vínculo y el registro en su grupo, coordinación hace el pase de caso; desde ahí las siete
       rutas de /organismos le dan 403 (reason_required las dos lecturas, forbidden las cinco escrituras); coordinación lee con la
       ventana; la pantalla es el diálogo del motivo. */
    const idAjeno = await altaPropia(api, { nombre: 'Ajeno', apellido: 'C3', ci: '4.765.433-9', fecha_nac: '2016-04-12' });
    const cargado = await Promise.all([api('POST', `/hce/${idAjeno}/organismos/inau`, { convenio: 'Cargado por el técnico (c3)' }), api('POST', `/hce/${idAjeno}/organismos/registros`, { organismo: 'inau', fecha: '2026-04-02', detalle: 'Registro del técnico (c3).' })]);
    const pase = await pasarDeCaso(api, idAjeno, tokAdmin);
    const rutas = [['GET', ''], ['POST', '/inau', { convenio: 'x' }], ['PATCH', '/inau', { obs: 'x' }], ['POST', '/bps', { estado: 'Vigente' }], ['PATCH', '/bps', { obs: 'x' }], ['GET', '/registros'], ['POST', '/registros', { organismo: 'inau', fecha: '2026-04-02', detalle: 'x' }]];
    const tec = [];
    for (const [m, r, b] of rutas) { const t = await api(m, `/hce/${idAjeno}/organismos${r}`, b); tec.push([m, t.status, t.json.code]); }
    const coord = await coordSinYConVentana(api, idAjeno, `/hce/${idAjeno}/organismos/registros`, tokAdmin);
    const pant = await pantallaMotivo(ps, idAjeno);
    check('c3-ajeno', 'técnico y expediente que no trata (vínculo y registro cargados por él antes del pase de caso): las siete rutas de /organismos dan 403 (reason_required las lecturas, forbidden las escrituras); coordinación 403 sin ventana y 200 con ella; la pantalla es el diálogo del motivo, sin datos',
      cargado.every((c) => c.status === 201) && pase === 200 && tec.every(([m, s, c]) => s === 403 && c === (m === 'GET' ? 'reason_required' : 'forbidden'))
        && ok403(coord.sin, 'reason_required') && coord.abre === 201 && coord.con === 200 && pant.dialogo && !pant.banda && !/Cargado por el técnico|Registro del técnico|Ajeno/.test(pant.txt),
      JSON.stringify({ pase, tec, coord, pant: { ...pant, txt: pant.txt.slice(0, 60) } }));
    await ctx.close();
  }

  /* ---------- C4 · HCE-INC: la pestaña «Inclusión» y la vista «Inclusión» leen, registran y editan por la API (§5.154) ----------
     ESCRIBE: registra la ficha de Joaquín (y le cambia el estado), le agrega una gestión y crea un expediente sin grupo con ficha
     (admin) para el alcance. Lo demás se compara con lo que dice la API, no con literales. */
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const ps = await ctx.newPage();
    ps.on('pageerror', (e) => erroresPagina.push(e.message));
    ps.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) erroresPagina.push('console: ' + m.text()); }); vigilarCarga(ps);
    await loguearComo(ps, EMAIL, PASSWORD);
    const tok = await ps.evaluate(() => sessionStorage.getItem('ippu.token'));
    const tokAdmin = (await (await fetch(API + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }) })).json()).access_token;
    const api = async (metodo, ruta, body, t) => { const r = await fetch(API + ruta, { method: metodo, headers: { Authorization: 'Bearer ' + (t || tok), 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
      let json = null; try { json = await r.json(); } catch (_e) { json = null; } return { status: r.status, json, total: r.headers.get('X-Total-Count') }; };
    const yo = (await api('GET', '/auth/yo')).json;
    const idDe = async (n) => (await api('GET', '/hce?nombre=' + encodeURIComponent(n) + '&limit=5')).json.find((h) => h.persona.nombre === n).id;
    const idM = await idDe('Martín'), idS = await idDe('Sofía'), idJ = await idDe('Joaquín'), idL = await idDe('Lucía');
    const opciones = (await api('GET', '/inclusion/opciones')).json;
    const escrituras = [];                                            // POST/PATCH a /inclusion que salen del navegador
    ps.on('request', (r) => { const u = new URL(r.url()).pathname; if (/\/inclusion(\/|$)/.test(u) && r.method() !== 'GET') escrituras.push({ m: r.method(), url: u, body: JSON.parse(r.postData() || 'null') }); });
    const esperarInc = () => ps.waitForFunction(() => INC.estado === 'listo' && !!document.getElementById('incFicha') && !/Cargando/.test(document.getElementById('panelExp').innerText), null, { timeout: 8000 });
    const abrirInc = async (id) => {
      await ps.evaluate((i) => abrirExpediente(i), id);
      await ps.waitForSelector('#expTitulo'); await ps.waitForFunction(() => !!EXP.flujo, null, { timeout: 8000 });
      await ps.click('#tabExp-inc'); await esperarInc(); await ps.waitForTimeout(80);
    };
    const fmt = (f) => ps.evaluate((x) => fmtFecha(x), f);
    const txt = (id) => ps.evaluate((i) => { const e = document.getElementById(i); return e ? e.innerText.replace(/\s+/g, ' ').trim() : null; }, id);
    const ficha = async (id) => api('GET', `/hce/${id}/inclusion`);
    const gestiones = async (id) => api('GET', `/hce/${id}/inclusion/bitacora`);
    /* ninguna clase ok/warn/bad/danger (ni las viejas inc-*) en la ficha, y el estado con el color de la tinta del cuerpo */
    const tinta = () => ps.evaluate(() => {
      const raiz = document.getElementById('panelExp');
      const malas = [...raiz.querySelectorAll('*')].map((e) => e.className && e.className.baseVal === undefined ? String(e.className) : '').filter((c) => /(^|[\s-])(ok|warn|bad|danger|off)(\s|$)|inc-chip|semaforo/.test(c));
      const b = document.querySelector('#incEstado .inc-estado b'), ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim();
      const probe = document.createElement('span'); probe.style.color = ink; document.body.appendChild(probe); const inkRgb = getComputedStyle(probe).color; probe.remove();
      return { malas, color: b ? getComputedStyle(b).color : null, inkRgb, fondo: b ? getComputedStyle(b.closest('dd')).backgroundColor : null };
    });

    /* c4-ficha · Martín: la ficha de la API, agrupada; el estado en tinta con su descripción y «desde»; sus dos gestiones, la más nueva primero */
    await abrirInc(idM);
    const fM = (await ficha(idM)).json, gM = await gestiones(idM);
    const lM = await ps.evaluate(() => ({ demo: document.querySelectorAll('#panelExp .demo-panel, #panelExp .solo-demo, #tabExp-inc .solo-demo').length,
      bloques: [...document.querySelectorAll('#incLectura .inc-bloque h4')].map((h) => h.textContent), ges: [...document.querySelectorAll('#incGestiones .inc-ges-contenido')].map((e) => e.textContent),
      sensibles: document.querySelectorAll('#incGestiones .inc-sensible').length }));
    const tM = await tinta();
    check('c4-ficha', 'pestaña Inclusión de Martín: la ficha que devuelve la API (Centro, Acompañante, Referente, Estado, Observaciones), «—» donde no hay dato, el estado en tinta (sin clases ok/warn/bad ni color propio) con su descripción y «desde» fecha_estado, sus 2 gestiones del más nuevo al más viejo; sin panel ni marca «Solo demo»',
      lM.demo === 0 && JSON.stringify(lM.bloques) === '["Centro","Acompañante (asistente personal / AT)","Referente en el centro","Estado","Observaciones"]'
        && await txt('incCentro') === fM.centro && await txt('incTipo') === fM.tipo_centro && await txt('incGrado') === fM.grado && await txt('incModalidad') === fM.modalidad
        && await txt('incDias') === fM.dias_horas && await txt('incAt') === fM.at && await txt('incAtNombre') === '—' && await txt('incRefTel') === '—' && await txt('incObs') === '—'
        && await txt('incEstado') === `${fM.estado} · desde ${await fmt(fM.fecha_estado)}` && await txt('incEstadoDesc') === fM.estado_descripcion && !('semaforo' in fM)
        && tM.malas.length === 0 && tM.color === tM.inkRgb && gM.total === '2' && JSON.stringify(lM.ges) === JSON.stringify(gM.json.map((g) => g.contenido)) && lM.sensibles === 0,
      JSON.stringify({ lM, tM, estado: await txt('incEstado') }).slice(0, 500));

    /* c4-sin-calculo · fecha_estado, la descripción, «Sensible», la última gestión y la cantidad salen SOLO de la respuesta */
    // unroute necesita el MISMO predicado que route: se guardan (uno nuevo no quita la ruta y la respuesta forzada seguiría)
    const esRuta = (ruta) => (u) => u.pathname === ruta;
    const rFicha = esRuta(`/hce/${idM}/inclusion`), rBit = esRuta(`/hce/${idM}/inclusion/bitacora`), rLista = esRuta('/inclusion');
    await ps.route(rFicha, async (r) => { if (r.request().method() !== 'GET') return r.continue();
      const real = await (await r.fetch()).json(); real.fecha_estado = '2001-02-03'; real.estado_descripcion = 'Descripción que manda el servidor (muestra).'; await r.fulfill({ json: real }); });
    await ps.route(rBit, async (r) => { const real = await (await r.fetch()).json();
      if (real[0]) { real[0].sensible = true; real[0].tema = 'Educativa / pedagógica'; } await r.fulfill({ json: real }); });
    await abrirInc(idM);
    const fx = { estado: await txt('incEstado'), desc: await txt('incEstadoDesc'), sens: await ps.evaluate(() => document.querySelectorAll('#incGestiones li[data-sensible] .inc-sensible').length) };
    await ps.unroute(rFicha); await ps.unroute(rBit);
    await ps.route(rLista, async (r) => { const real = await (await r.fetch()).json();
      real.forEach((f) => { f.ultima_gestion = '2002-03-04'; f.gestiones = 77; f.fecha_estado = '2003-04-05'; }); await r.fulfill({ json: real }); });
    await ps.click('.navitem[data-view="inclusion"]'); await ps.waitForFunction(() => INCV.estado === 'listo', null, { timeout: 8000 });
    const vx = await ps.evaluate(() => [...document.querySelectorAll('#tbodyInclusion tr[data-hce]')].map((tr) => [...tr.children].map((td) => td.innerText.replace(/\s+/g, ' ').trim())));
    await ps.unroute(rLista);
    const f1 = await fmt('2001-02-03'), f2 = await fmt('2002-03-04'), f3 = await fmt('2003-04-05');
    check('c4-sin-calculo', 'el navegador no calcula días ni fechas: si el servidor manda otra fecha_estado, otra descripción, «sensible» en un tema que no lo es, otra última gestión u otra cantidad, la pantalla muestra eso tal cual (pestaña y vista)',
      fx.estado.endsWith(`desde ${f1}`) && fx.desc === 'Descripción que manda el servidor (muestra).' && fx.sens === 1
        && vx.length > 0 && vx.every((c) => c[5] === f2 && c[6] === '77' && c[3].endsWith(`desde ${f3}`)),
      JSON.stringify({ fx, vx: vx.slice(0, 2) }).slice(0, 400));

    /* c4-sin-ficha · Joaquín no tiene ficha: «Sin registrar» (estado vacío, no un error), sin «Agregar gestión» y una línea que dice registrar la ficha; la API da 404 a una gestión sin ficha */
    await abrirInc(idJ);
    const sJ = await ps.evaluate(() => ({ vacio: !!document.querySelector('#incFicha .estado-vacio'), alerta: document.querySelectorAll('#panelExp [role="alert"]').length, nuevo: !!document.getElementById('btnIncNuevo'),
      agregar: !!document.getElementById('btnIncAgregar'), linea: (document.getElementById('incSinFicha') || {}).textContent || '', txt: document.getElementById('incFicha').innerText }));
    const sinFichaApi = await api('POST', `/hce/${idL}/inclusion/bitacora`, { fecha: '2026-10-01', interlocutor: 'Madre', tema: 'Familiar / social', contenido: 'Prueba sin ficha (c4).' });
    const fichaJ0 = await ficha(idJ);
    check('c4-sin-ficha', 'Joaquín (GET /hce/{id}/inclusion = 404): la ficha muestra «Sin registrar» con «+ Registrar ficha» (estado vacío, sin role="alert"), no hay «Agregar gestión» y una línea dice que primero hay que registrar la ficha; por la API, una gestión en un expediente sin ficha es 404 y pide registrarla',
      fichaJ0.status === 404 && sJ.vacio && sJ.alerta === 0 && sJ.nuevo && !sJ.agregar && /primero registrá la ficha/.test(sJ.linea) && /Sin registrar/.test(sJ.txt)
        && sinFichaApi.status === 404 && sinFichaApi.json.code === 'not_found' && /ficha/.test(sinFichaApi.json.detail[0].mensaje),
      JSON.stringify({ sJ: { ...sJ, txt: sJ.txt.slice(0, 80) }, api: sinFichaApi.status }));

    /* c4-registrar · Joaquín: registrar la ficha desde el diálogo: UN POST con lo tipeado (sin fecha_estado) → 201; la lectura sale de la respuesta y la Auditoría tiene la fila */
    await ps.click('#btnIncNuevo'); await ps.waitForSelector('#modalFlujo.open #incf_centro');
    const estadosDlg0 = await ps.evaluate(() => [...document.querySelectorAll('#incf_estado option')].map((o) => o.value));
    await ps.fill('#incf_centro', 'Escuela de demostración (c4)'); await ps.selectOption('#incf_tipo', opciones.tipos_centro[1]); await ps.fill('#incf_grado', '3.er año');
    await ps.selectOption('#incf_estado', 'En adaptación');
    const descDlg = await txt('desc_incf_estado');
    const n0 = escrituras.length;
    const respReg = ps.waitForResponse((r) => new URL(r.url()).pathname === `/hce/${idJ}/inclusion` && r.request().method() === 'POST');
    await ps.click('#btnIncGuardar'); const rReg = await respReg; await ps.waitForSelector('#incLectura', { timeout: 8000 }); await ps.waitForTimeout(150);
    const postJ = escrituras.slice(n0), fJ = (await ficha(idJ)).json;
    const regJ = await ps.evaluate(() => ({ modal: document.getElementById('modalFlujo').classList.contains('open'), foco: document.activeElement.id, agregar: !!document.getElementById('btnIncAgregar') }));
    await ps.click('#tabExp-log'); await ps.waitForSelector('#panelExp .log-table', { timeout: 8000 });
    await ps.selectOption('#logModulo', 'HCE-INC');
    await ps.waitForFunction(() => !/Cargando/.test(document.getElementById('panelExp').innerText) && !!document.querySelector('#panelExp .log-table, #panelExp .estado-vacio'), null, { timeout: 8000 });
    await ps.waitForTimeout(150);
    const logJ = await ps.evaluate(() => [...document.querySelectorAll('#panelExp .log-table tbody tr')].map((tr) => [...tr.children].map((td) => td.innerText.replace(/\s+/g, ' ').trim())));
    check('c4-registrar', 'Joaquín: «Registrar ficha» abre el diálogo (el estado ofrece sólo los asignables y muestra la descripción del elegido); guardar envía UN POST con centro, tipo, grado y estado (sin fecha_estado) → 201; la lectura muestra lo que devolvió la API, aparece «Agregar gestión» y la pestaña Auditoría (filtro HCE-INC) tiene la fila de alta con su autor',
      rReg.status() === 201 && postJ.length === 1 && postJ[0].m === 'POST' && JSON.stringify(Object.keys(postJ[0].body).sort()) === '["centro","estado","grado","tipo_centro"]'
        && !estadosDlg0.includes('Sin registrar') && descDlg === opciones.estados.find((e) => e.nombre === 'En adaptación').descripcion
        && fJ.centro === 'Escuela de demostración (c4)' && fJ.estado === 'En adaptación' && !!fJ.fecha_estado && !regJ.modal && regJ.foco === 'incTitulo' && regJ.agregar
        && logJ.length === 1 && logJ[0][1] === yo.nombre && logJ[0][2] === 'Inclusión (INC)' && /Se creó/.test(logJ[0][3]) && /ficha de inclusión/.test(logJ[0][3]),
      JSON.stringify({ st: rReg.status(), postJ, regJ, logJ }).slice(0, 500));

    /* c4-estado · cambiar el estado: «Sin registrar» no se ofrece; el PATCH lleva sólo el estado; «desde» es la fecha_estado de la API. Por la API: «Sin registrar» → 422 y uno asignable → 200 */
    await ps.click('#tabExp-inc'); await esperarInc();
    await ps.click('#btnIncEditar'); await ps.waitForSelector('#modalFlujo.open #incf_estado');
    const estadosDlg = await ps.evaluate(() => [...document.querySelectorAll('#incf_estado option')].map((o) => o.value));
    await ps.selectOption('#incf_estado', 'Inclusión parcial (horario reducido)');
    const nE = escrituras.length;
    await ps.click('#btnIncGuardar'); await ps.waitForFunction(() => !document.getElementById('modalFlujo').classList.contains('open'), null, { timeout: 8000 }); await ps.waitForTimeout(150);
    const patchE = escrituras.slice(nE), fJ2 = (await ficha(idJ)).json;
    const asignables = opciones.estados.filter((e) => e.asignable).map((e) => e.nombre);
    const probeMal = await api('PATCH', `/hce/${idJ}/inclusion`, { estado: 'Sin registrar' }), probeBien = await api('PATCH', `/hce/${idJ}/inclusion`, { estado: 'Inclusión plena' });
    const probeVuelta = await api('PATCH', `/hce/${idJ}/inclusion`, { estado: 'Inclusión parcial (horario reducido)' });
    check('c4-estado', 'editar el estado: el selector ofrece exactamente los 6 asignables de GET /inclusion/opciones (no «Sin registrar»); guardar envía UN PATCH sólo con el estado y la lectura muestra «desde» la fecha_estado de la API; por la API, «Sin registrar» es 422 en `estado` y un asignable, 200',
      JSON.stringify(estadosDlg) === JSON.stringify(asignables) && asignables.length === 6 && patchE.length === 1 && patchE[0].m === 'PATCH' && JSON.stringify(patchE[0].body) === '{"estado":"Inclusión parcial (horario reducido)"}'
        && fJ2.estado === 'Inclusión parcial (horario reducido)' && await txt('incEstado') === `Inclusión parcial (horario reducido) · desde ${await fmt(fJ2.fecha_estado)}`
        && probeMal.status === 422 && probeMal.json.detail[0].campo === 'estado' && probeBien.status === 200 && probeVuelta.status === 200,
      JSON.stringify({ estadosDlg, patchE, mal: probeMal.status, bien: probeBien.status }).slice(0, 400));

    /* c4-gestion · agregar una gestión: contenido en blanco → 422 de la API junto a su campo con el resumen enfocado; con texto pasa y aparece primera. Sofía: su gestión sensible dice «Sensible» en texto */
    await abrirInc(idJ);
    await ps.click('#btnIncAgregar'); await ps.waitForSelector('#modalFlujo.open #incg_contenido');
    await ps.fill('#incg_interlocutor', 'Maestra de clase'); await ps.selectOption('#incg_rol', 'Centro educativo'); await ps.selectOption('#incg_tema', 'Educativa / pedagógica');
    await ps.fill('#incg_contenido', '   \t ');
    const respBlanco = ps.waitForResponse((r) => new URL(r.url()).pathname === `/hce/${idJ}/inclusion/bitacora` && r.request().method() === 'POST');
    await ps.click('#btnIncGuardar'); const rBlanco = await respBlanco;
    await ps.waitForSelector('#incErrores:not([hidden])', { timeout: 5000 });
    const g422 = await ps.evaluate(() => ({ foco: document.activeElement.id, inv: [...document.querySelectorAll('#mfBody [aria-invalid="true"]')].map((e) => e.id), err: document.getElementById('err_incg_contenido').innerText, interlocutor: document.getElementById('incg_interlocutor').value }));
    await ps.fill('#incg_contenido', 'Se acuerdan apoyos visuales para la clase (c4).');
    const nG = escrituras.length;
    const respOk = ps.waitForResponse((r) => new URL(r.url()).pathname === `/hce/${idJ}/inclusion/bitacora` && r.request().method() === 'POST');
    await ps.click('#btnIncGuardar'); const rOk = await respOk;
    await ps.waitForFunction(() => !document.getElementById('modalFlujo').classList.contains('open'), null, { timeout: 8000 });
    await ps.waitForFunction(() => document.querySelectorAll('#incGestiones li').length >= 1, null, { timeout: 8000 }); await ps.waitForTimeout(150);
    const postG = escrituras.slice(nG), gJ = await gestiones(idJ);
    const primeraJ = await ps.evaluate(() => { const li = document.querySelector('#incGestiones li'); return li ? li.innerText.replace(/\s+/g, ' ') : ''; });
    await abrirInc(idS);
    const gS = await gestiones(idS);
    const sensS = await ps.evaluate(() => ({ marcas: [...document.querySelectorAll('#incGestiones li[data-sensible] .inc-sensible')].map((m) => ({ t: m.textContent, c: getComputedStyle(m).color, cls: m.className, desc: m.getAttribute('aria-describedby') })),
      hint: (document.getElementById('incSensibleHint') || {}).textContent || '', inkRgb: (() => { const p = document.createElement('span'); p.style.color = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim(); document.body.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return c; })() }));
    check('c4-gestion', 'agregar gestión: con el contenido en blanco (espacios y tab) la API contesta 422 y se marca junto a «Qué se trató» con el resumen role="alert" enfocado (lo tipeado queda); con texto, UN POST → 201 sin autor y la gestión aparece primera con el autor del token; en Sofía, la gestión que la API marca sensible dice «Sensible» en texto, en tinta, con la línea que aclara que restringe compartir y no guardar',
      rBlanco.status() === 422 && g422.foco === 'incErrores' && JSON.stringify(g422.inv) === '["incg_contenido"]' && g422.err.length > 0 && g422.interlocutor === 'Maestra de clase'
        && rOk.status() === 201 && postG.length === 1 && !('autor_id' in postG[0].body) && gJ.json[0].contenido === 'Se acuerdan apoyos visuales para la clase (c4).' && gJ.json[0].autor.id === yo.id
        && primeraJ.includes('Se acuerdan apoyos visuales para la clase (c4).') && primeraJ.includes(yo.nombre)
        && gS.json.filter((g) => g.sensible).length === 1 && sensS.marcas.length === 1 && sensS.marcas[0].t === 'Sensible' && sensS.marcas[0].c === sensS.inkRgb && sensS.marcas[0].desc === 'incSensibleHint'
        && /restringida para compartir/.test(sensS.hint) && /no requiere autorización/.test(sensS.hint),
      JSON.stringify({ b: rBlanco.status(), g422, ok: rOk.status(), postG, sensS }).slice(0, 600));

    /* c4-ajeno · A1: el técnico carga la ficha y la gestión en su grupo, coordinación hace el pase de caso; desde ahí las cinco
       rutas le dan 403 (reason_required las lecturas, forbidden las escrituras); coordinación lee con la ventana; la pantalla
       (abierta en la pestaña «Inclusión») es el diálogo del motivo. */
    const idAjeno = await altaPropia(api, { nombre: 'Ajeno', apellido: 'C4', ci: '4.765.434-7', fecha_nac: '2016-04-12' });
    const cargado = [await api('POST', `/hce/${idAjeno}/inclusion`, { centro: 'Cargado por el técnico (c4)', estado: 'Inclusión plena' })];
    cargado.push(await api('POST', `/hce/${idAjeno}/inclusion/bitacora`, { fecha: '2026-04-02', interlocutor: 'Madre', tema: 'Familiar / social', contenido: 'Gestión del técnico (c4).' }));
    const pase = await pasarDeCaso(api, idAjeno, tokAdmin);
    const rutas = [['GET', ''], ['POST', '', { centro: 'x' }], ['PATCH', '', { obs: 'x' }], ['GET', '/bitacora'], ['POST', '/bitacora', { fecha: '2026-04-02', interlocutor: 'x', tema: 'Familiar / social', contenido: 'x' }]];
    const tec = [];
    for (const [m, r, b] of rutas) { const t = await api(m, `/hce/${idAjeno}/inclusion${r}`, b); tec.push([m, t.status, t.json && t.json.code]); }
    const coord = await coordSinYConVentana(api, idAjeno, `/hce/${idAjeno}/inclusion/bitacora`, tokAdmin);
    const pant = await pantallaMotivo(ps, idAjeno, { tab: 'inc' });
    check('c4-ajeno', 'técnico y expediente que no trata (ficha y gestión cargadas por él antes del pase de caso): las cinco rutas de /hce/{id}/inclusion dan 403 (reason_required las lecturas, forbidden las escrituras); coordinación 403 sin ventana y 200 con ella; la pantalla es el diálogo del motivo, sin datos',
      cargado.every((c) => c.status === 201) && pase === 200 && tec.every(([m, s, c]) => s === 403 && c === (m === 'GET' ? 'reason_required' : 'forbidden'))
        && ok403(coord.sin, 'reason_required') && coord.abre === 201 && coord.con === 200 && pant.dialogo && !pant.banda && !/Cargado por el técnico|Gestión del técnico|Ajeno/.test(pant.txt),
      JSON.stringify({ pase, tec, coord, pant: { ...pant, txt: pant.txt.slice(0, 60) } }));

    /* c4-vista · la vista «Inclusión»: las filas son las de GET /inclusion (sin el expediente ajeno), el filtro por estado es el de la API y una fila abre ese expediente en su pestaña «Inclusión» */
    await ps.click('.navitem[data-view="inclusion"]'); await ps.waitForFunction(() => INCV.estado === 'listo', null, { timeout: 8000 }); await ps.waitForTimeout(80);
    const vApi = await api('GET', '/inclusion?limit=200'), vAdm = await api('GET', '/inclusion?limit=200', undefined, tokAdmin);
    const filasV = async () => ps.evaluate(() => [...document.querySelectorAll('#tbodyInclusion tr[data-hce]')].map((tr) => ({ id: +tr.dataset.hce, c: [...tr.children].map((td) => td.innerText.replace(/\s+/g, ' ').trim()) })));
    const fV = await filasV();
    const esperado = await Promise.all(vApi.json.map(async (f) => ({ id: f.hce_id, ult: f.ultima_gestion ? await fmt(f.ultima_gestion) : 'Sin gestiones', n: String(f.gestiones), est: f.estado, desde: f.fecha_estado ? await fmt(f.fecha_estado) : null })));
    const igualesV = fV.length === esperado.length && fV.every((f, i) => f.id === esperado[i].id && f.c[5] === esperado[i].ult && f.c[6] === esperado[i].n && f.c[3].startsWith(esperado[i].est) && (!esperado[i].desde || f.c[3].endsWith('desde ' + esperado[i].desde)));
    const vistaUi = await ps.evaluate(() => ({ demo: document.querySelectorAll('#view-inclusion .demo-panel, #view-inclusion [data-modo-demo], #view-inclusion .solo-demo').length, kpi: document.querySelectorAll('#view-inclusion .kpi').length,
      tabStops: [...document.querySelectorAll('#tbodyInclusion tr[data-hce]')].every((tr) => tr.querySelectorAll('button, a[href], input, select, textarea, [tabindex="0"]').length === 1),
      opciones: [...document.querySelectorAll('#incFiltroEstado option')].map((o) => o.value), titulo: document.getElementById('tituloInclusion').textContent, desc: document.getElementById('incVistaDesc').textContent }));
    await ps.selectOption('#incFiltroEstado', 'Sin escolarizar'); await ps.waitForFunction(() => INCV.estado === 'listo' && INCV.filtro === 'Sin escolarizar', null, { timeout: 8000 }); await ps.waitForTimeout(80);
    const fFiltro = await filasV(), aFiltro = await api('GET', '/inclusion?estado=' + encodeURIComponent('Sin escolarizar'));
    await ps.selectOption('#incFiltroEstado', ''); await ps.waitForFunction(() => INCV.estado === 'listo' && INCV.filtro === '', null, { timeout: 8000 }); await ps.waitForTimeout(80);
    await ps.click(`#tbodyInclusion tr[data-hce="${idS}"] button.nna-abrir`);
    await ps.waitForSelector('#expTitulo'); await ps.waitForFunction(() => EXP.tab === 'inc' && INC.estado === 'listo', null, { timeout: 8000 });
    const abierto = await ps.evaluate(() => ({ id: EXP.id, tab: EXP.tab, sel: document.getElementById('tabExp-inc').getAttribute('aria-selected'), ficha: !!document.getElementById('incLectura') }));
    check('c4-vista', 'vista «Inclusión» (González): sin panel de demostración ni KPI; las filas son exactamente las de GET /inclusion, en su orden, con estado, «desde», última gestión y cantidad de la API (un solo punto de Tab por fila); no aparece el expediente ajeno que el admin sí ve; el filtro ofrece los 7 estados y «Sin escolarizar» da las filas de GET /inclusion?estado=; la fila de Sofía abre su expediente en la pestaña «Inclusión»',
      vistaUi.demo === 0 && vistaUi.kpi === 0 && vistaUi.tabStops && igualesV && !fV.some((f) => f.id === idAjeno) && vAdm.json.some((f) => f.hce_id === idAjeno) && +vAdm.total > +vApi.total
        && JSON.stringify(vistaUi.opciones) === JSON.stringify(['', ...opciones.estados.map((e) => e.nombre)]) && /de tus grupos/.test(vistaUi.desc)
        && fFiltro.length === aFiltro.json.length && fFiltro.every((f, i) => f.id === aFiltro.json[i].hce_id) && aFiltro.json.every((f) => f.estado === 'Sin escolarizar') && fFiltro.length >= 1
        && abierto.id === idS && abierto.tab === 'inc' && abierto.sel === 'true' && abierto.ficha,
      JSON.stringify({ partes: { ui: vistaUi.demo === 0 && vistaUi.kpi === 0 && vistaUi.tabStops, igualesV, sinAjeno: !fV.some((f) => f.id === idAjeno), admVe: vAdm.json.some((f) => f.hce_id === idAjeno), totales: [vAdm.total, vApi.total],
        opc: JSON.stringify(vistaUi.opciones) === JSON.stringify(['', ...opciones.estados.map((e) => e.nombre)]), desc: /de tus grupos/.test(vistaUi.desc), filtro: [fFiltro.length, aFiltro.json.length], abierto } }).slice(0, 600));

    /* c4-salir · «Salir» con GET /inclusion en vuelo: al llegar, la vista sigue vacía (sin datos de la sesión anterior detrás del login) */
    await ps.evaluate(() => go('inicio'));
    await ps.route((u) => u.pathname === '/inclusion', async (route) => { await new Promise((x) => setTimeout(x, 1500)); await route.continue().catch(() => {}); });
    await ps.click('.navitem[data-view="inclusion"]');
    await ps.click('.btn-exit');
    await ps.waitForTimeout(2200);
    const salir = await ps.evaluate(() => ({ contenido: document.getElementById('inclusionContent').innerHTML.trim(), desc: document.getElementById('incVistaDesc').textContent, estado: INCV.estado, filas: INCV.filas.length,
      inc: INC.ficha, login: !document.getElementById('loginScreen').classList.contains('hidden') }));
    check('c4-salir', '«Salir» con GET /inclusion todavía sin respuesta: al llegar, la vista «Inclusión» sigue vacía (contenido y descripción), sin filas ni ficha de la sesión anterior, con el login a la vista',
      salir.contenido === '' && salir.desc === '' && salir.estado === 'vacio' && salir.filas === 0 && salir.inc === null && salir.login, JSON.stringify(salir));
    await ctx.close();
  }

  /* ---------- C5 · HCE-DOC: documentos con archivo, autorización de imagen y fotos (§5.155) ----------
     ESCRIBE: sube documentos y fotos desde la pantalla (Martín, Sofía, Joaquín y el grupo Escolares), edita un nombre, registra la
     autorización de Joaquín y crea (admin) un expediente sin grupo con un documento, y una foto en Inicial, para el alcance. Todo se
     compara con lo que dice la API, no con literales. Los archivos se arman acá (bytes mínimos: el servidor mira el contenido). */
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, acceptDownloads: true });
    const ps = await ctx.newPage();
    ps.on('pageerror', (e) => erroresPagina.push(e.message));
    ps.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) erroresPagina.push('console: ' + m.text()); }); vigilarCarga(ps);
    await loguearComo(ps, EMAIL, PASSWORD);
    const tok = await ps.evaluate(() => sessionStorage.getItem('ippu.token'));
    const login = async (email, pass) => (await (await fetch(API + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: pass }) })).json()).access_token;
    const tokAdmin = await login(ADMIN_EMAIL, ADMIN_PASSWORD), tokTorres = await login('torres@demo.ippu.test', PASSWORD);
    const api = async (metodo, ruta, body, t) => { const r = await fetch(API + ruta, { method: metodo, headers: { ...(t === null ? {} : { Authorization: 'Bearer ' + (t || tok) }), ...(body instanceof FormData || body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body) });
      let json = null; try { json = await r.json(); } catch (_e) { json = null; } return { status: r.status, json, total: r.headers.get('X-Total-Count') }; };
    const subirApi = (ruta, bytes, nombreArchivo, campos, t) => { const fd = new FormData(); fd.append('archivo', new Blob([bytes]), nombreArchivo);
      Object.entries(campos || {}).forEach(([k, v]) => fd.append(k, String(v))); return api('POST', ruta, fd, t); };
    const PDF = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
    const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(96, 7)]);
    const HTMLB = Buffer.from('<!doctype html><html><body><script>alert(1)</script></body></html>');
    const yo = (await api('GET', '/auth/yo')).json;
    const idDe = async (n) => (await api('GET', '/hce?nombre=' + encodeURIComponent(n) + '&limit=5')).json.find((h) => h.persona.nombre === n).id;
    const idM = await idDe('Martín'), idS = await idDe('Sofía'), idJ = await idDe('Joaquín');
    const cats = (await api('GET', '/documentos/categorias')).json;
    const catId = (n) => cats.find((c) => c.nombre === n).id;
    const escrituras = [], descargas = [];
    ps.on('request', (r) => { const u = new URL(r.url()).pathname;
      if (/\/(documentos|fotos|autorizacion-imagen)(\/|$)/.test(u) && r.method() !== 'GET') escrituras.push({ m: r.method(), url: u, ct: r.headers()['content-type'] || '', body: r.postData() || '' });
      if (/\/archivo$/.test(u)) descargas.push({ url: u, auth: r.headers().authorization || null }); });
    const esperarDoc = () => ps.waitForFunction(() => DOCS.estado === 'listo' && !!document.getElementById('docDocsCard') && !/Cargando/.test(document.getElementById('panelExp').innerText), null, { timeout: 8000 });
    const abrirDoc = async (id) => {
      await ps.evaluate((i) => abrirExpediente(i), id);
      await ps.waitForSelector('#expTitulo'); await ps.waitForFunction(() => !!EXP.flujo, null, { timeout: 8000 });
      await ps.click('#tabExp-doc'); await esperarDoc(); await ps.waitForTimeout(80);
    };
    const filasDoc = () => ps.evaluate(() => [...document.querySelectorAll('#docTabla tbody tr[data-doc]')].map((tr) => ({ id: +tr.dataset.doc, hist: tr.dataset.historico === 'true',
      nombre: tr.querySelector('.doc-nombre-txt').textContent, marca: (tr.querySelector('.doc-hist-marca') || {}).textContent || null, editar: !!tr.querySelector('[id^="btnDocEditar_"]'),
      bajar: !!tr.querySelector('[id^="btnDocBajar_"]'), celdas: [...tr.children].map((td) => td.innerText.replace(/\s+/g, ' ').trim()) })));
    const fmt = (f) => ps.evaluate((x) => fmtFecha(x), f);

    /* c5-lista · Martín: las filas son las de GET /hce/{id}/documentos, en su orden; el histórico, marcado con texto y sin «Editar» */
    await abrirDoc(idM);
    const dM = (await api('GET', `/hce/${idM}/documentos`)).json, fM = await filasDoc();
    const uiM = await ps.evaluate(() => ({ demo: document.querySelectorAll('#panelExp .demo-panel, #panelExp .solo-demo, #tabExp-doc .solo-demo').length, candado: /🔒/.test(document.getElementById('panelExp').innerText),
      total: document.getElementById('docTotal').textContent, aut: (document.getElementById('docAutDoc') || {}).textContent, nota: document.getElementById('docAutNota').textContent }));
    const fechasOk = await Promise.all(dM.map(async (d, i) => fM[i] && fM[i].celdas[3] === await fmt(d.fecha_carga) && fM[i].celdas[2] === (d.fecha_original ? await fmt(d.fecha_original) : '—')));
    const autM = (await api('GET', `/hce/${idM}/autorizacion-imagen`)).json;
    check('c5-lista', 'pestaña Documentos de Martín: las filas son exactamente las de GET /hce/{id}/documentos, en su orden, con nombre, categoría, fechas, tipo y tamaño; el histórico dice «Registro histórico — sólo lectura» en texto y no ofrece «Editar» (los demás sí); «Descargar» en cada uno; la autorización muestra su copia por nombre; sin panel ni marca «Solo demo» y sin candados',
      uiM.demo === 0 && !uiM.candado && fM.length === dM.length && fM.every((f, i) => f.id === dM[i].id && f.nombre === dM[i].nombre && f.celdas[1] === dM[i].categoria.nombre && f.hist === dM[i].es_registro_historico && f.bajar
        && (f.hist ? f.marca === 'Registro histórico — sólo lectura' && !f.editar : f.marca === null && f.editar) && f.celdas[4].startsWith(dM[i].tipo.toUpperCase()))
        && fechasOk.every(Boolean) && fM.filter((f) => f.hist).length === 1 && uiM.total === String(dM.length) && uiM.aut === autM.documento.nombre && /compartir/.test(uiM.nota) && /no la requiere/.test(uiM.nota),
      JSON.stringify({ uiM, fM: fM.map((f) => [f.id, f.hist, f.marca, f.editar]) }).slice(0, 500));

    /* c5-subir · subir un PDF desde la pantalla: queda primero; la descarga trae los mismos bytes y fue con el token; sin token es 401 */
    await ps.click('#btnDocCargar'); await ps.waitForSelector('#modalFlujo.open #docf_archivo');
    const acepta = await ps.getAttribute('#docf_archivo', 'accept');
    const nuevoPdf = Buffer.concat([PDF, Buffer.from('% c5-subir ' + Date.now() + '\n')]);
    await ps.setInputFiles('#docf_archivo', { name: 'informe-c5.pdf', mimeType: 'application/pdf', buffer: nuevoPdf });
    await ps.selectOption('#docf_categoria', String(catId('Estudio complementario')));
    await ps.fill('#docf_nombre', 'Estudio subido desde la pantalla (c5)');
    const n0 = escrituras.length;
    const respSubir = ps.waitForResponse((r) => new URL(r.url()).pathname === `/hce/${idM}/documentos` && r.request().method() === 'POST');
    await ps.click('#btnDocGuardar'); const rSubir = await respSubir;
    await ps.waitForFunction(() => !document.getElementById('modalFlujo').classList.contains('open'), null, { timeout: 8000 }); await esperarDoc(); await ps.waitForTimeout(120);
    const postS = escrituras.slice(n0), dM2 = (await api('GET', `/hce/${idM}/documentos`)).json, fM2 = await filasDoc();
    const foco = await ps.evaluate(() => document.activeElement.id);
    const nuevo = dM2[0];
    const nd = descargas.length, descDoc = () => descargas.slice(nd).filter((d) => d.url === `/hce/${idM}/documentos/${nuevo.id}/archivo`);
    const [dl] = await Promise.all([ps.waitForEvent('download', { timeout: 8000 }), ps.click(`#btnDocBajar_${nuevo.id}`)]);
    const bajado = require('fs').readFileSync(await dl.path());
    const sinToken = await api('GET', `/hce/${idM}/documentos/${nuevo.id}/archivo`, undefined, null);
    const conToken = await fetch(`${API}/hce/${idM}/documentos/${nuevo.id}/archivo`, { headers: { Authorization: 'Bearer ' + tok } });
    check('c5-subir', 'subir un PDF desde «Cargar documento» (el <input> sólo sugiere .pdf/.jpg/.jpeg/.png): UN POST multipart → 201 y queda primero en la lista con lo que devolvió la API; «Descargar» guarda los mismos bytes, el pedido llevó Authorization y un GET sin token es 401; la descarga es un adjunto nosniff/no-store',
      acepta === '.pdf,.jpg,.jpeg,.png' && rSubir.status() === 201 && postS.length === 1 && /^multipart\/form-data/.test(postS[0].ct) && !/es_registro_historico|fecha_carga/.test(postS[0].body)
        && nuevo.nombre === 'Estudio subido desde la pantalla (c5)' && nuevo.tipo === 'pdf' && fM2[0].id === nuevo.id && foco === 'docDocsTitulo'
        && Buffer.compare(bajado, nuevoPdf) === 0 && dl.suggestedFilename() === 'Estudio subido desde la pantalla (c5).pdf'
        && descDoc().length === 1 && /^Bearer /.test(descDoc()[0].auth || '') && sinToken.status === 401
        && /^attachment;/.test(conToken.headers.get('content-disposition')) && conToken.headers.get('x-content-type-options') === 'nosniff' && conToken.headers.get('cache-control') === 'no-store',
      JSON.stringify({ st: rSubir.status(), post: postS.map((p) => [p.m, p.ct.slice(0, 20)]), primero: [fM2[0] && fM2[0].id, nuevo.id], foco, bytes: [bajado.length, nuevoPdf.length], nombre: dl.suggestedFilename(), auth: descDoc().map((d) => !!d.auth), sin: sinToken.status }).slice(0, 500));

    /* c5-rechazo · un HTML llamado .pdf → 422 junto al campo, con el resumen enfocado; un PDF de verdad pasa. 11 MB → el mensaje del 413 */
    await ps.click('#btnDocCargar'); await ps.waitForSelector('#modalFlujo.open #docf_archivo');
    await ps.setInputFiles('#docf_archivo', { name: 'informe.pdf', mimeType: 'application/pdf', buffer: HTMLB });
    await ps.selectOption('#docf_categoria', String(catId('Otro')));
    const resp422 = ps.waitForResponse((r) => new URL(r.url()).pathname === `/hce/${idM}/documentos` && r.request().method() === 'POST');
    await ps.click('#btnDocGuardar'); const r422 = await resp422;
    await ps.waitForSelector('#docErrores:not([hidden])', { timeout: 5000 });
    const e422 = await ps.evaluate(() => ({ foco: document.activeElement.id, inv: [...document.querySelectorAll('#mfBody [aria-invalid="true"]')].map((e) => e.id), err: document.getElementById('err_docf_archivo').innerText,
      cat: document.getElementById('docf_categoria').value, abierto: document.getElementById('modalFlujo').classList.contains('open') }));
    await ps.setInputFiles('#docf_archivo', { name: 'informe.pdf', mimeType: 'application/pdf', buffer: PDF });
    const respOk = ps.waitForResponse((r) => new URL(r.url()).pathname === `/hce/${idM}/documentos` && r.request().method() === 'POST');
    await ps.click('#btnDocGuardar'); const rOk = await respOk;
    await ps.waitForFunction(() => !document.getElementById('modalFlujo').classList.contains('open'), null, { timeout: 8000 }); await esperarDoc();
    await ps.click('#btnDocCargar'); await ps.waitForSelector('#modalFlujo.open #docf_archivo');
    await ps.setInputFiles('#docf_archivo', { name: 'grande.pdf', mimeType: 'application/pdf', buffer: Buffer.concat([PDF, Buffer.alloc(11 * 1024 * 1024, 48)]) });
    await ps.selectOption('#docf_categoria', String(catId('Otro')));
    const resp413 = ps.waitForResponse((r) => new URL(r.url()).pathname === `/hce/${idM}/documentos` && r.request().method() === 'POST', { timeout: 30000 });
    await ps.click('#btnDocGuardar'); const r413 = await resp413;
    await ps.waitForSelector('#docErrores:not([hidden])', { timeout: 8000 });
    const e413 = await ps.evaluate(() => ({ foco: document.activeElement.id, inv: [...document.querySelectorAll('#mfBody [aria-invalid="true"]')].map((e) => e.id), err: document.getElementById('err_docf_archivo').innerText, resumen: document.getElementById('docErrores').innerText }));
    await escDescartando(ps);
    check('c5-rechazo', 'un HTML llamado «informe.pdf» → 422 de la API junto al campo «Archivo» (aria-invalid) con el resumen role="alert" enfocado y lo elegido conservado; con un PDF de verdad pasa (201); un archivo de 11 MB → 413 con el mensaje de los 10 MB junto al campo y en el resumen',
      r422.status() === 422 && e422.foco === 'docErrores' && JSON.stringify(e422.inv) === '["docf_archivo"]' && e422.err.length > 0 && e422.cat === String(catId('Otro')) && e422.abierto
        && rOk.status() === 201 && r413.status() === 413 && e413.foco === 'docErrores' && JSON.stringify(e413.inv) === '["docf_archivo"]' && /10 MB/.test(e413.err) && /10 MB/.test(e413.resumen),
      JSON.stringify({ s: [r422.status(), rOk.status(), r413.status()], e422, e413 }).slice(0, 500));

    /* c5-historico · PATCH del histórico por la API → 409; editar el nombre de uno común desde la pantalla anda y aparece en Auditoría */
    const hist = dM2.find((d) => d.es_registro_historico), comun = dM2.find((d) => !d.es_registro_historico && d.id !== nuevo.id);
    const p409 = await api('PATCH', `/hce/${idM}/documentos/${hist.id}`, { nombre: 'Intento (c5)' });
    await abrirDoc(idM);
    await ps.click(`#btnDocEditar_${comun.id}`); await ps.waitForSelector('#modalFlujo.open #docf_nombre');
    const catsEdit = await ps.evaluate(() => [...document.querySelectorAll('#docf_categoria option')].map((o) => o.textContent));
    await ps.fill('#docf_nombre', comun.nombre + ' (editado c5)');
    const nE = escrituras.length;
    await ps.click('#btnDocGuardar'); await ps.waitForFunction(() => !document.getElementById('modalFlujo').classList.contains('open'), null, { timeout: 8000 }); await esperarDoc(); await ps.waitForTimeout(120);
    const patchE = escrituras.slice(nE), comun2 = (await api('GET', `/hce/${idM}/documentos/${comun.id}`)).json;
    const filaUi = (await filasDoc()).find((f) => f.id === comun.id);
    await ps.click('#tabExp-log'); await ps.waitForSelector('#panelExp .log-table', { timeout: 8000 });
    await ps.selectOption('#logModulo', 'HCE-DOC');
    await ps.waitForFunction(() => !/Cargando/.test(document.getElementById('panelExp').innerText) && !!document.querySelector('#panelExp .log-table, #panelExp .estado-vacio'), null, { timeout: 8000 }); await ps.waitForTimeout(150);
    const logD = await ps.evaluate(() => [...document.querySelectorAll('#panelExp .log-table tbody tr')].map((tr) => [...tr.children].map((td) => td.innerText.replace(/\s+/g, ' ').trim())));
    const filaEd = logD.find((r) => r[4] === 'Nombre');   // F3: nombre legible del campo «nombre»
    check('c5-historico', 'el registro histórico es inmutable: PATCH por la API → 409 y sigue igual; el diálogo «Editar» de uno común no ofrece categorías «Registro histórico»; editar su nombre envía UN PATCH sólo con `nombre` → la lista lo muestra y la pestaña Auditoría (filtro HCE-DOC) tiene la fila del campo nombre con su autor, sin el nombre en el detalle',
      p409.status === 409 && (await api('GET', `/hce/${idM}/documentos/${hist.id}`)).json.nombre === hist.nombre && !catsEdit.some((t) => /Registro histórico/.test(t))
        && patchE.length === 1 && patchE[0].m === 'PATCH' && JSON.stringify(Object.keys(JSON.parse(patchE[0].body))) === '["nombre"]' && comun2.nombre === comun.nombre + ' (editado c5)' && filaUi.nombre === comun2.nombre
        && !!filaEd && filaEd[1] === yo.nombre && filaEd[2] === 'Documentos (DOC)' && filaEd[5].includes(comun2.nombre) && !filaEd[3].includes(comun2.nombre),
      JSON.stringify({ p409: p409.status, patchE: patchE.map((p) => p.body), filaEd }).slice(0, 500));

    /* c5-foto · Sofía no tiene autorización: subir un PNG se guarda sin aviso ni pregunta; la miniatura es una URL blob: */
    const autS = await api('GET', `/hce/${idS}/autorizacion-imagen`);
    await abrirDoc(idS);
    const fotos0 = (await api('GET', `/hce/${idS}/fotos`)).json.length;
    await ps.click('#btnDocFoto'); await ps.waitForSelector('#modalFlujo.open #fotf_archivo');
    const dlgFoto = await ps.evaluate(() => ({ accept: document.getElementById('fotf_archivo').accept, texto: document.getElementById('mfBody').innerText }));
    await ps.setInputFiles('#fotf_archivo', { name: 'actividad.png', mimeType: 'image/png', buffer: PNG });
    await ps.fill('#fotf_desc', 'Foto de prueba (c5)');
    const respF = ps.waitForResponse((r) => new URL(r.url()).pathname === `/hce/${idS}/fotos` && r.request().method() === 'POST');
    await ps.click('#btnFotoGuardar'); const rF = await respF; const cuerpoF = await rF.json();
    await ps.waitForFunction(() => !document.getElementById('modalFlujo').classList.contains('open'), null, { timeout: 8000 }); await esperarDoc();
    await ps.waitForFunction((id) => !!document.querySelector(`#docFotoImg_${id} img`), cuerpoF.data.id, { timeout: 8000 });
    const fS = await ps.evaluate((id) => ({ src: document.querySelector(`#docFotoImg_${id} img`).src, alt: document.querySelector(`#docFotoImg_${id} img`).alt, avisos: !document.getElementById('docAvisos').hidden,
      dialogos: document.querySelectorAll('.modal-bg.open').length, primero: +document.querySelector('#docFotosGrid li').dataset.foto }), cuerpoF.data.id);
    check('c5-foto', 'Sofía (GET autorización = 404): «Cargar foto» no menciona la autorización; un PNG se guarda (201, warnings vacío) sin aviso ni pregunta, queda primero y su miniatura es una URL blob: (de un Blob image/png) con la descripción como texto alternativo',
      autS.status === 404 && dlgFoto.accept === '.jpg,.jpeg,.png' && !/autorizaci/i.test(dlgFoto.texto) && rF.status() === 201 && cuerpoF.warnings.length === 0
        && (await api('GET', `/hce/${idS}/fotos`)).json.length === fotos0 + 1 && /^blob:/.test(fS.src) && fS.alt === 'Foto de prueba (c5)' && !fS.avisos && fS.dialogos === 0 && fS.primero === cuerpoF.data.id
        && (await api('GET', `/hce/${idS}/autorizacion-imagen`)).status === 404,
      JSON.stringify({ aut: autS.status, dlgFoto: dlgFoto.accept, st: rF.status(), fS: { ...fS, src: fS.src.slice(0, 12) } }));

    /* c5-autorizacion · Joaquín: registrarla con uno de sus documentos; por la API, un documento de otro expediente es 422 */
    const docJ = (await subirApi(`/hce/${idJ}/documentos`, PDF, 'autorizacion-joaquin.pdf', { categoria_id: catId('Autorización / consentimiento'), nombre: 'Autorización firmada de Joaquín (c5)' })).json.data;
    await abrirDoc(idJ);
    const vacioJ = await ps.evaluate(() => ({ vacio: !!document.querySelector('#docAutCard .estado-vacio'), alerta: document.querySelectorAll('#docAutCard [role="alert"]').length }));
    await ps.click('#btnAutRegistrar'); await ps.waitForSelector('#modalFlujo.open #autf_documento');
    const opcDocs = await ps.evaluate(() => [...document.querySelectorAll('#autf_documento option')].map((o) => o.value).filter(Boolean).map(Number));
    await ps.selectOption('#autf_registrada', 'si'); await ps.fill('#autf_fecha', '2026-06-10'); await ps.selectOption('#autf_documento', String(docJ.id));
    const nA = escrituras.length;
    await ps.click('#btnAutGuardar'); await ps.waitForFunction(() => !document.getElementById('modalFlujo').classList.contains('open'), null, { timeout: 8000 }); await ps.waitForTimeout(120);
    const postA = escrituras.slice(nA), autJ = (await api('GET', `/hce/${idJ}/autorizacion-imagen`)).json;
    const autUi = await ps.evaluate(() => ({ reg: document.getElementById('docAutRegistrada').textContent, doc: document.getElementById('docAutDoc').textContent }));
    const ajenoDoc = await api('PATCH', `/hce/${idJ}/autorizacion-imagen`, { documento_id: dM2[0].id });
    const docsJ = (await api('GET', `/hce/${idJ}/documentos?limit=200`)).json.map((d) => d.id);
    check('c5-autorizacion', 'Joaquín sin autorización: estado vacío «Sin registrar» (no un error); «Registrar» ofrece sólo SUS documentos; registrarla con uno envía UN POST {registrada, fecha, documento_id} → la pantalla muestra «Sí» y la copia por nombre; por la API, un documento de otro expediente (de Martín) es 422 en documento_id y no cambia nada',
      vacioJ.vacio && vacioJ.alerta === 0 && JSON.stringify([...opcDocs].sort()) === JSON.stringify([...docsJ].sort()) && !opcDocs.includes(dM2[0].id)
        && postA.length === 1 && postA[0].m === 'POST' && JSON.stringify(JSON.parse(postA[0].body)) === JSON.stringify({ registrada: true, fecha: '2026-06-10', documento_id: docJ.id })
        && autJ.registrada === true && autJ.documento_id === docJ.id && autUi.reg === 'Sí' && autUi.doc === docJ.nombre
        && ajenoDoc.status === 422 && ajenoDoc.json.detail[0].campo === 'documento_id' && (await api('GET', `/hce/${idJ}/autorizacion-imagen`)).json.documento_id === docJ.id,
      JSON.stringify({ vacioJ, opcDocs, postA: postA.map((p) => p.body), autUi, ajeno: ajenoDoc.status }).slice(0, 500));

    /* c5-grupo · foto del grupo desde Grupos (González, Escolares); Torres y el admin la ven; un técnico de otro grupo, 404 */
    await ps.click('.navitem[data-view="grupos"]'); await ps.waitForFunction(() => GRP.estado === 'listo', null, { timeout: 8000 });
    const esc = await ps.evaluate(() => gruposVisibles().find((g) => g.nombre === 'Escolares').id);
    const ini = (await api('GET', '/grupos')).json.find((g) => g.nombre === 'Inicial' && g.anio === (new Date()).getFullYear()) || (await api('GET', '/grupos')).json.find((g) => g.nombre === 'Inicial');
    await ps.click(`#btnGrupo_${esc}`); await ps.waitForFunction(() => GFOT.estado === 'listo', null, { timeout: 8000 });
    const antesG = (await api('GET', `/grupos/${esc}/fotos`)).json.length;
    await ps.click('#btnGrpFoto'); await ps.waitForSelector('#modalFlujo.open #fotf_archivo');
    await ps.setInputFiles('#fotf_archivo', { name: 'grupo.png', mimeType: 'image/png', buffer: PNG });
    await ps.fill('#fotf_desc', 'Foto del grupo (c5)');
    const respG = ps.waitForResponse((r) => new URL(r.url()).pathname === `/grupos/${esc}/fotos` && r.request().method() === 'POST');
    await ps.click('#btnFotoGuardar'); const rG = await respG; const cuerpoG = await rG.json();
    await ps.waitForFunction((id) => !!document.querySelector(`#grpFotoImg_${id} img`), cuerpoG.data.id, { timeout: 8000 });
    const gUi = await ps.evaluate(() => ({ items: [...document.querySelectorAll('#grpFotosGrid li')].map((l) => +l.dataset.foto), src: document.querySelector('#grpFotosGrid img').src, foco: document.activeElement.id }));
    const deTorres = await api('GET', `/grupos/${esc}/fotos`, undefined, tokTorres), deAdmin = await api('GET', `/grupos/${esc}/fotos`, undefined, tokAdmin);
    const enInicial = await subirApi(`/grupos/${ini.id}/fotos`, PNG, 'inicial.png', { descripcion: 'Del admin en Inicial (c5)' }, tokAdmin);
    const ajenoG = [await api('GET', `/grupos/${ini.id}/fotos`), await api('GET', `/grupos/${ini.id}/fotos/${enInicial.json.data.id}/archivo`), await subirApi(`/grupos/${ini.id}/fotos`, PNG, 'x.png', {})];
    check('c5-grupo', 'detalle de Escolares (González): «Fotos del grupo» con «Cargar foto»; un PNG se sube (201, sin avisos) y aparece primero con miniatura blob:; la Mtra. Torres (técnica del grupo) y el admin la ven por la API; en Inicial (donde González no es técnico) las fotos, la descarga y la subida son 404',
      rG.status() === 201 && cuerpoG.warnings.length === 0 && gUi.items[0] === cuerpoG.data.id && gUi.items.length === antesG + 1 && /^blob:/.test(gUi.src) && gUi.foco === 'grpFotosTitulo'
        && deTorres.status === 200 && deTorres.json.some((f) => f.id === cuerpoG.data.id) && deAdmin.status === 200 && deAdmin.json.some((f) => f.id === cuerpoG.data.id)
        && enInicial.status === 201 && ajenoG.every((r) => r.status === 404 && r.json && r.json.code === 'not_found'),
      JSON.stringify({ st: rG.status(), gUi: { ...gUi, src: gUi.src.slice(0, 10) }, torres: deTorres.status, admin: deAdmin.status, ini: enInicial.status, ajeno: ajenoG.map((r) => r.status) }));

    /* c5-ajeno · A1: el técnico sube un documento en su grupo, coordinación hace el pase de caso; desde ahí lista, documento,
       descarga y autorización le piden el motivo (403 reason_required) y las fotos son 403 forbidden (fuera de la consulta del no
       tratante, F4-4); coordinación descarga con la ventana; la pantalla (pestaña «Documentos») es el diálogo del motivo. */
    const idAjeno = await altaPropia(api, { nombre: 'Ajeno', apellido: 'C5', ci: '4.765.435-1', fecha_nac: '2016-04-12' });
    const docAjeno = (await subirApi(`/hce/${idAjeno}/documentos`, PDF, 'ajeno.pdf', { categoria_id: catId('Otro'), nombre: 'Documento del técnico (c5)' })).json.data;
    const pase = await pasarDeCaso(api, idAjeno, tokAdmin);
    const rutasAj = [`/hce/${idAjeno}/documentos`, `/hce/${idAjeno}/documentos/${docAjeno.id}`, `/hce/${idAjeno}/documentos/${docAjeno.id}/archivo`, `/hce/${idAjeno}/fotos`, `/hce/${idAjeno}/autorizacion-imagen`];
    const tecAj = []; for (const r of rutasAj) { const x = await api('GET', r); tecAj.push([x.status, x.json && x.json.code]); }
    const coordSin = await api('GET', rutasAj[2], undefined, tokAdmin);
    const abre = await api('POST', `/hce/${idAjeno}/accesos`, { motivo_codigo: 'supervision' }, tokAdmin);
    const admAj = (await fetch(API + rutasAj[2], { headers: { Authorization: 'Bearer ' + tokAdmin } })).status;
    const pantAj = await pantallaMotivo(ps, idAjeno, { tab: 'doc' });
    check('c5-ajeno', 'técnico y expediente que no trata (un documento suyo antes del pase de caso): lista, documento, descarga y autorización dan 403 reason_required y las fotos 403 forbidden; coordinación 403 sin ventana y descarga (200) con ella; la pantalla es el diálogo del motivo, sin datos',
      docAjeno && pase === 200 && tecAj.every(([s, c], i) => s === 403 && c === (i === 3 ? 'forbidden' : 'reason_required')) && coordSin.status === 403 && coordSin.json.code === 'reason_required'
        && abre.status === 201 && admAj === 200 && pantAj.dialogo && !pantAj.banda && !/Documento del técnico|Ajeno/.test(pantAj.txt),
      JSON.stringify({ pase, tecAj, coordSin: coordSin.status, abre: abre.status, admAj, pant: { ...pantAj, txt: pantAj.txt.slice(0, 60) } }));

    /* c5-delete · no se borran documentos ni fotos: DELETE es 405 y siguen ahí */
    const fotoM = (await api('GET', `/hce/${idM}/fotos`)).json[0];
    const dels = [await api('DELETE', `/hce/${idM}/documentos/${nuevo.id}`), await api('DELETE', `/hce/${idM}/fotos/${fotoM.id}`), await api('DELETE', `/grupos/${esc}/fotos/${cuerpoG.data.id}`)];
    const siguen = [(await api('GET', `/hce/${idM}/documentos/${nuevo.id}`)).status, (await api('GET', `/hce/${idM}/fotos/${fotoM.id}`)).status, (await api('GET', `/grupos/${esc}/fotos/${cuerpoG.data.id}`)).status];
    const sinBorrar = await ps.evaluate(() => /quitarDoc|quitarFoto|Quitar|Eliminar|Borrar/.test(docPanelConectadoHtml.toString() + fotosGridHtml.toString() + docFilaHtml.toString()));
    check('c5-delete', 'DELETE de un documento, de una foto individual y de una grupal → 405, y los tres siguen (200); la pestaña conectada no ofrece «Quitar» ni «Eliminar»',
      dels.every((d) => d.status === 405) && siguen.every((s) => s === 200) && !sinBorrar, JSON.stringify({ dels: dels.map((d) => d.status), siguen, sinBorrar }));

    /* c5-grupo-salir · una subida de foto grupal en vuelo y el usuario se va de Grupos (cierra el diálogo y navega): su respuesta ya no es
       vigente y no repinta, pero el candado «guardando» se suelta; al volver, «Cargar foto» guarda (antes quedaba trabado hasta recargar).
       La respuesta se retiene en el navegador (Playwright la pide al servidor y la entrega después), así que la subida es real. */
    const limpiarToast = () => ps.evaluate(() => { clearTimeout(window._toastT); document.getElementById('toast').classList.remove('show'); document.getElementById('toastMsg').textContent = ''; });
    const reteniendo = async (patron) => {
      let suelta; const retenida = new Promise((res) => { suelta = res; }); const est = { enVuelo: false };
      await ps.route(patron, async (route) => { if (route.request().method() !== 'POST') return route.continue();
        est.enVuelo = true; const resp = await route.fetch(); await retenida; await route.fulfill({ response: resp }); });
      return { est, suelta, quitar: () => ps.unroute(patron) };
    };
    await ps.click('.navitem[data-view="grupos"]'); await ps.waitForFunction(() => GRP.estado === 'listo', null, { timeout: 8000 });
    await ps.click(`#btnGrupo_${esc}`); await ps.waitForFunction(() => GFOT.estado === 'listo', null, { timeout: 8000 });
    await limpiarToast();
    const retG = await reteniendo(new RegExp(`/grupos/${esc}/fotos$`));
    await ps.click('#btnGrpFoto'); await ps.waitForSelector('#modalFlujo.open #fotf_archivo');
    await ps.setInputFiles('#fotf_archivo', { name: 'salir.png', mimeType: 'image/png', buffer: PNG });
    await ps.click('#btnFotoGuardar');
    await ps.waitForFunction(() => GFOT.guardando === true, null, { timeout: 8000 });
    await ps.waitForTimeout(300);
    const enVueloG = retG.est.enVuelo;
    await ps.evaluate(() => { closeFlujoModal(true); go('pendientes'); });          // Cancelar + otra vista, con la subida en vuelo
    const alIrse = await ps.evaluate(() => ({ guardando: GFOT.guardando, grupos: document.getElementById('view-grupos').classList.contains('active') }));
    retG.suelta(); await ps.waitForTimeout(500); await retG.quitar();
    const trasG = await ps.evaluate(() => ({ guardando: GFOT.guardando, modal: document.getElementById('modalFlujo').classList.contains('open'),
      toast: document.getElementById('toast').classList.contains('show') && /Foto cargada/.test(document.getElementById('toastMsg').textContent), vista: document.querySelector('.view.active').id }));
    await ps.click('.navitem[data-view="grupos"]'); await ps.waitForFunction(() => GRP.estado === 'listo', null, { timeout: 8000 });
    await ps.click(`#btnGrupo_${esc}`); await ps.waitForFunction(() => GFOT.estado === 'listo', null, { timeout: 8000 });
    const antesV = (await api('GET', `/grupos/${esc}/fotos`)).json.length;
    await ps.click('#btnGrpFoto'); await ps.waitForSelector('#modalFlujo.open #fotf_archivo');
    await ps.setInputFiles('#fotf_archivo', { name: 'volver.png', mimeType: 'image/png', buffer: PNG });
    const respV = ps.waitForResponse((r) => new URL(r.url()).pathname === `/grupos/${esc}/fotos` && r.request().method() === 'POST', { timeout: 6000 });
    await ps.click('#btnFotoGuardar');
    const rV = await respV.catch(() => null);
    await ps.waitForFunction(() => !document.getElementById('modalFlujo').classList.contains('open'), null, { timeout: 8000 }).catch(() => {});
    const despuesV = (await api('GET', `/grupos/${esc}/fotos`)).json.length;
    check('c5-grupo-salir', 'subida de foto grupal en vuelo + salir de Grupos: el candado se suelta al irse (GFOT.guardando false), la respuesta tardía no repinta ni muestra «Foto cargada» ni reabre el diálogo; al volver, «Cargar foto» sí guarda (POST 201, una foto más por la API)',
      enVueloG && alIrse.guardando === false && alIrse.grupos === false && trasG.guardando === false && !trasG.modal && !trasG.toast && trasG.vista === 'view-pendientes'
        && rV !== null && rV.status() === 201 && despuesV === antesV + 1,
      JSON.stringify({ enVueloG, alIrse, trasG, volver: rV && rV.status(), antesV, despuesV }));

    /* c5-salir · «Salir» con la subida de un documento en vuelo: la respuesta tardía no repinta (ni toast, ni foco, ni tarjeta de documentos),
       no queda nada trabado y la vista queda vacía; al entrar de nuevo, «Cargar documento» se abre con el botón habilitado. */
    await abrirDoc(idM); await limpiarToast();
    const retD = await reteniendo(new RegExp(`/hce/${idM}/documentos$`));
    await ps.click('#btnDocCargar'); await ps.waitForSelector('#modalFlujo.open #docf_archivo');
    await ps.setInputFiles('#docf_archivo', { name: 'salir.pdf', mimeType: 'application/pdf', buffer: Buffer.concat([PDF, Buffer.from('% c5-salir ' + Date.now() + '\n')]) });
    await ps.selectOption('#docf_categoria', String(catId('Otro')));
    await ps.click('#btnDocGuardar');
    await ps.waitForFunction(() => DOCS.guardando === true, null, { timeout: 8000 });
    await ps.waitForTimeout(300);
    const enVueloD = retD.est.enVuelo;
    await ps.evaluate(() => closeFlujoModal(true));                                 // Cancelar: el diálogo cierra y la subida sigue
    await ps.click('.btn-exit');                                                    // «Salir»
    await ps.waitForSelector('#loginScreen:not(.hidden)', { timeout: 8000 });
    retD.suelta(); await ps.waitForTimeout(500); await retD.quitar();
    const trasD = await ps.evaluate(() => ({ guardando: DOCS.guardando, hceId: DOCS.hceId, filas: DOCS.docs.filas.length, fotos: DOCS.fotos.filas.length, aut: DOCS.aut,
      tarjeta: !!document.getElementById('docDocsCard'), expediente: document.getElementById('expedienteContent').innerHTML.trim(),
      modal: document.getElementById('modalFlujo').classList.contains('open'), login: !document.getElementById('loginScreen').classList.contains('hidden'),
      toast: document.getElementById('toast').classList.contains('show') && /Documento cargado/.test(document.getElementById('toastMsg').textContent),
      foco: document.activeElement.id }));
    await ps.fill('#loginUser', EMAIL); await ps.fill('#loginPass', PASSWORD); await ps.click('#loginBtn');
    await ps.waitForSelector('#loginScreen.hidden', { state: 'attached', timeout: 8000 });
    await abrirDoc(idM);
    await ps.click('#btnDocCargar'); await ps.waitForSelector('#modalFlujo.open #btnDocGuardar');
    const reabre = await ps.evaluate(() => ({ habilitado: !document.getElementById('btnDocGuardar').disabled, guardando: DOCS.guardando }));
    await ps.evaluate(() => closeFlujoModal(true));
    check('c5-salir', '«Salir» con la subida de un documento en vuelo: el login queda a la vista con el foco en su usuario, la respuesta tardía no repinta (sin tarjeta de documentos, sin toast «Documento cargado», sin diálogo, expediente vacío), DOCS queda vacío y sin candado; al entrar de nuevo, «Cargar documento» abre con «Cargar» habilitado',
      enVueloD && trasD.login && trasD.foco === 'loginUser' && trasD.guardando === false && trasD.hceId === null && trasD.filas === 0 && trasD.fotos === 0 && trasD.aut === null
        && !trasD.tarjeta && trasD.expediente === '' && !trasD.modal && !trasD.toast && reabre.habilitado && reabre.guardando === false,
      JSON.stringify({ enVueloD, trasD: { ...trasD, expediente: trasD.expediente.slice(0, 30) }, reabre }));
    await ctx.close();
  }

  /* ---------- C6 · Ateneos y jornadas de capacitación (§5.158) ----------
     ESCRIBE: crea desde el diálogo un registro de cada tipo, edita uno, le agrega un acuerdo, adjunta un PDF al institucional del seed y
     (admin, por la API) crea un expediente en Inicial con un ateneo clínico y uno de grupo, para el alcance. Todo se compara con lo que
     dice la API, no con literales: el código lo asigna el servidor. */
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, acceptDownloads: true });
    const pa = await ctx.newPage();
    pa.on('pageerror', (e) => erroresPagina.push(e.message));
    pa.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) erroresPagina.push('console: ' + m.text()); }); vigilarCarga(pa);
    await loguearComo(pa, EMAIL, PASSWORD);
    const tok = await pa.evaluate(() => sessionStorage.getItem('ippu.token'));
    const login = async (email, pass) => (await (await fetch(API + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: pass }) })).json()).access_token;
    const tokAdmin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
    const api = async (metodo, ruta, body, t) => { const r = await fetch(API + ruta, { method: metodo, headers: { ...(t === null ? {} : { Authorization: 'Bearer ' + (t || tok) }), ...(body instanceof FormData || body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body) });
      let json = null; try { json = await r.json(); } catch (_e) { json = null; } return { status: r.status, json, total: r.headers.get('X-Total-Count') }; };
    const PDF = Buffer.concat([Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n'), Buffer.from('% c6-doc ' + Date.now() + '\n')]);
    const escrituras = [], descargas = [];
    pa.on('request', (r) => { const u = new URL(r.url()).pathname;
      if (/^\/ateneos/.test(u) && r.method() !== 'GET') escrituras.push({ m: r.method(), url: u, body: r.postData() || '' });
      if (/\/archivo$/.test(u)) descargas.push({ url: u, auth: r.headers().authorization || null }); });
    const esperarLista = () => pa.waitForFunction(() => AT.modo === 'lista' && AT.lista.estado === 'listo' && AT.ind.estado === 'listo', null, { timeout: 8000 });
    const esperarDetalle = () => pa.waitForFunction(() => AT.modo === 'detalle' && (AT.det.estado === 'listo' || AT.det.estado === 'error'), null, { timeout: 8000 });
    const irAteneos = async () => { await pa.click('.navitem[data-view="ateneos"]'); await esperarLista(); };
    const filasUi = () => pa.evaluate(() => [...document.querySelectorAll('#tablaAteneos tbody tr[data-ateneo]')].map((tr) => {
      const tipo = tr.querySelector('.at-tipo');
      return { id: +tr.dataset.ateneo, celdas: [...tr.children].map((td) => td.innerText.replace(/\s+/g, ' ').trim()), sensible: tr.dataset.sensible === 'true',
        marca: (tr.querySelector('.at-sensible') || {}).textContent || null, tabs: tr.querySelectorAll('button, a[href], input, select, textarea, [tabindex="0"]').length,
        tipoFondo: getComputedStyle(tipo).backgroundColor, tipoHijos: [...tipo.children].filter((c) => !c.classList.contains('at-sensible')).length,
        mono: getComputedStyle(tr.querySelector('.at-codigo')).fontFamily };
    }));
    const fmt = (f) => pa.evaluate((x) => fmtFecha(x), f);

    /* c6-lista · las filas son las de GET /ateneos (mismo token), en su orden; el tipo va en texto, sin color; «Sensible» en texto en el clínico */
    await irAteneos();
    const lApi = (await api('GET', '/ateneos')).json, fUi = await filasUi();
    const fechas = await Promise.all(lApi.map((a) => fmt(a.fecha)));
    const vistaUi = await pa.evaluate(() => ({ demo: document.querySelectorAll('#view-ateneos [data-modo-demo], #view-ateneos .demo-panel, #view-ateneos .solo-demo').length,
      chips: document.querySelectorAll('#view-ateneos .at-chip').length, abreDemo: /abrirExpedienteDemo/.test(document.getElementById('view-ateneos').innerHTML) }));
    check('c6-lista', 'vista «Ateneos y capacitación»: sin panel ni marca de demostración; las filas son exactamente las de GET /ateneos, en su orden (código, fecha, tipo en texto y sin color, título, grupo o NNA, acuerdos); «Sensible» en texto sólo en los clínicos; un solo punto de Tab por fila (el título); el código en la fuente de códigos',
      vistaUi.demo === 0 && vistaUi.chips === 0 && !vistaUi.abreDemo && lApi.length >= 4 && fUi.length === lApi.length
        && fUi.every((f, i) => f.id === lApi[i].id && f.celdas[0] === lApi[i].codigo && f.celdas[1] === fechas[i] && f.celdas[2].startsWith(lApi[i].tipo_label)
          && f.celdas[3] === lApi[i].titulo && f.celdas[5] === String(lApi[i].acuerdos) && f.sensible === lApi[i].sensible && (f.marca === 'Sensible') === lApi[i].sensible
          && f.tabs === 1 && f.tipoHijos === 0 && /rgba\(0, 0, 0, 0\)|transparent/.test(f.tipoFondo) && !/sans-serif$/.test(f.mono.trim()) || false),
      JSON.stringify({ vistaUi, n: [fUi.length, lApi.length], f0: fUi[0] }).slice(0, 500));

    /* c6-indicador · el texto es el de GET /ateneos/indicador (año en curso por omisión): «2026: N de 8 ateneos» y una línea por grupo */
    const ind = (await api('GET', '/ateneos/indicador')).json;
    const indUi = await pa.evaluate(() => ({ total: document.getElementById('atIndTotal').textContent.trim(), grupos: [...document.querySelectorAll('#atIndGrupos li')].map((li) => li.textContent.trim()),
      color: [...document.querySelectorAll('#atIndicador *')].some((e) => /\b(ok|warn|bad)\b/.test(e.className)) }));
    check('c6-indicador', 'el indicador dice lo que cuenta la API, en texto y sin colores de estado: «<año>: <total> de <meta> ateneos» y «<grupo>: <cantidad> de <meta por grupo>» por cada grupo del año',
      indUi.total === `${ind.anio}: ${ind.total} de ${ind.meta_total} ateneos` && JSON.stringify(indUi.grupos) === JSON.stringify(ind.grupos.map((g) => `${g.nombre}: ${g.cantidad} de ${ind.meta_por_grupo}`)) && !indUi.color,
      JSON.stringify({ indUi, api: { total: ind.total, grupos: ind.grupos.length } }));

    /* c6-nuevo · uno de cada tipo desde el diálogo; el servidor asigna el código siguiente; un clínico sin NNA y una jornada con acuerdo → 422 junto al campo */
    const anioReg = new Date().getFullYear();
    const siguiente = async () => { const todos = (await api('GET', '/ateneos?limit=200', undefined, tokAdmin)).json;
      const nums = todos.map((a) => a.codigo).filter((c) => c.startsWith(`AT-${anioReg}-`)).map((c) => +c.slice(-3)); return `AT-${anioReg}-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, '0')}`; };
    const idMartin = (await api('GET', '/hce?nombre=Mart%C3%ADn&limit=5')).json.find((h) => h.persona.nombre === 'Martín').id;
    const grupos26 = (await api('GET', `/grupos?anio=${anioReg}`)).json, escolares = grupos26.find((g) => g.nombre === 'Escolares'), inicial = grupos26.find((g) => g.nombre === 'Inicial');
    const abrirNuevo = async () => { await irAteneos(); await pa.click('#btnAtNuevo'); await pa.waitForSelector('#modalFlujo.open #atf_tipo'); };
    const guardar = async () => {
      const resp = pa.waitForResponse((r) => new URL(r.url()).pathname === '/ateneos' && r.request().method() === 'POST');
      await pa.click('#btnAtGuardar'); return resp;
    };
    const esperarCerrado = () => pa.waitForFunction(() => !document.getElementById('modalFlujo').classList.contains('open'), null, { timeout: 8000 });
    const resultadosNuevo = [];
    const llenar = async (tipo, extra) => {
      await pa.selectOption('#atf_tipo', tipo); await pa.fill('#atf_fecha', `${anioReg}-10-2${resultadosNuevo.length}`);
      await pa.fill('#atf_titulo', `Registro ${tipo} desde la pantalla (c6)`); await pa.fill('#atf_participantes', 'Técnicos responsables · Coordinación técnica');
      if (extra) await extra();
    };
    // clínico: sin NNA → 422 en «NNA referido»; con NNA → 201
    await abrirNuevo(); await llenar('clinico');
    const visibles = await pa.evaluate(() => ({ nna: !document.getElementById('atfNnaCampo').hidden, grupo: !document.getElementById('atfGrupoCampo').hidden,
      jornada: !document.getElementById('atfBloqueJornada').hidden, clinico: !document.getElementById('atfBloqueClinico').hidden }));
    const r422a = await guardar(); await pa.waitForSelector('#atErrores:not([hidden])');
    const e422a = await pa.evaluate(() => ({ foco: document.activeElement.id, inval: document.getElementById('atf_nna').getAttribute('aria-invalid'), err: document.getElementById('err_atf_nna').textContent }));
    let esperado = await siguiente();
    await pa.selectOption('#atf_nna', String(idMartin)); await pa.fill('#atf_situacion', 'Situación de prueba (c6).');
    const r1 = await guardar(); await esperarCerrado(); await esperarDetalle();
    resultadosNuevo.push({ tipo: 'clinico', st: r1.status(), codigo: (await r1.json()).data.codigo, esperado, ui: await pa.evaluate(() => document.getElementById('atDetMeta').textContent) });
    // de grupo
    await abrirNuevo(); esperado = await siguiente();
    await llenar('grupo', async () => { await pa.selectOption('#atf_grupo', String(escolares.id)); });
    const r2 = await guardar(); await esperarCerrado(); await esperarDetalle();
    resultadosNuevo.push({ tipo: 'grupo', st: r2.status(), codigo: (await r2.json()).data.codigo, esperado, ui: await pa.evaluate(() => document.getElementById('atDetMeta').textContent) });
    // institucional, con un acuerdo juntado en el diálogo
    await abrirNuevo(); esperado = await siguiente();
    await llenar('institucional', async () => { await pa.click('#btnAtfAcAgregar'); await pa.fill('#atf_ac_0_acuerdo', 'Acuerdo cargado con el registro (c6)'); await pa.fill('#atf_ac_0_responsable_rol', 'Coordinación técnica'); });
    const r3 = await guardar(); await esperarCerrado(); await esperarDetalle();
    const d3 = (await r3.json()).data;
    resultadosNuevo.push({ tipo: 'institucional', st: r3.status(), codigo: d3.codigo, esperado, ui: await pa.evaluate(() => document.getElementById('atDetMeta').textContent) });
    // jornada con un acuerdo → 422 junto a «Acuerdos»; sin el acuerdo → 201
    await abrirNuevo(); await llenar('jornada', async () => { await pa.fill('#atf_capacitador', 'Equipo técnico interno'); await pa.click('#btnAtfAcAgregar'); await pa.fill('#atf_ac_0_acuerdo', 'No corresponde'); });
    const visJ = await pa.evaluate(() => ({ jornada: !document.getElementById('atfBloqueJornada').hidden, clinico: !document.getElementById('atfBloqueClinico').hidden, nna: !document.getElementById('atfNnaCampo').hidden, grupo: !document.getElementById('atfGrupoCampo').hidden }));
    const r422b = await guardar(); await pa.waitForSelector('#atErrores:not([hidden])');
    const e422b = await pa.evaluate(() => ({ foco: document.activeElement.id, inval: document.getElementById('atf_acuerdos').getAttribute('aria-invalid'), err: document.getElementById('err_atf_acuerdos').textContent }));
    esperado = await siguiente();
    await pa.click('#btnAtfAcQuitar_0');
    const r4 = await guardar(); await esperarCerrado(); await esperarDetalle();
    resultadosNuevo.push({ tipo: 'jornada', st: r4.status(), codigo: (await r4.json()).data.codigo, esperado, ui: await pa.evaluate(() => document.getElementById('atDetMeta').textContent) });
    const posts = escrituras.filter((e) => e.m === 'POST' && e.url === '/ateneos');
    check('c6-nuevo', '«Nuevo registro» (diálogo compartido): el tipo muestra sólo su bloque; un clínico sin NNA → 422 de la API junto a «NNA referido» (resumen role="alert" con el foco); una jornada con un acuerdo → 422 junto a «Acuerdos»; corregidos, los cuatro tipos se guardan (201) con el código siguiente que asigna el servidor y el detalle lo muestra; ningún POST manda código, número ni sensible',
      visibles.nna && visibles.grupo && !visibles.jornada && visibles.clinico && visJ.jornada && !visJ.clinico && !visJ.nna && !visJ.grupo
        && r422a.status() === 422 && e422a.foco === 'atErrores' && e422a.inval === 'true' && e422a.err !== ''
        && r422b.status() === 422 && e422b.foco === 'atErrores' && e422b.inval === 'true' && /jornada/i.test(e422b.err)
        && resultadosNuevo.length === 4 && resultadosNuevo.every((x) => x.st === 201 && x.codigo === x.esperado && x.ui.includes(x.codigo))
        && posts.length === 6 && posts.every((p) => !/"(codigo|numero|anio_correlativo|sensible)"/.test(p.body)),
      JSON.stringify({ visibles, visJ, e422a, e422b, resultadosNuevo: resultadosNuevo.map((x) => [x.tipo, x.st, x.codigo, x.esperado]), posts: posts.length }).slice(0, 600));

    /* c6-editar · editar un campo (un PATCH sólo con lo que cambió) y verlo en el detalle; un acuerdo agregado después del alta */
    await pa.evaluate((id) => atAbrir(id), d3.id); await esperarDetalle();
    const nE = escrituras.length;
    await pa.click('#btnAtEditar'); await pa.waitForSelector('#modalFlujo.open #atf_observaciones');
    await pa.fill('#atf_observaciones', 'Observación editada desde la pantalla (c6)');
    const rP = pa.waitForResponse((r) => new URL(r.url()).pathname === `/ateneos/${d3.id}` && r.request().method() === 'PATCH');
    await pa.click('#btnAtGuardar'); const rPatch = await rP; await esperarCerrado();
    await pa.waitForFunction(() => /editada desde la pantalla/.test(document.getElementById('atObservaciones').textContent), null, { timeout: 8000 });
    const patchBody = JSON.parse(escrituras.slice(nE).find((e) => e.m === 'PATCH').body);
    await pa.click('#btnAcAgregar'); await pa.waitForSelector('#modalFlujo.open #acf_acuerdo');
    await pa.fill('#acf_acuerdo', 'Acuerdo agregado después del alta (c6)'); await pa.fill('#acf_plazo', `${anioReg}-12-15`);
    const rA = pa.waitForResponse((r) => new URL(r.url()).pathname === `/ateneos/${d3.id}/acuerdos` && r.request().method() === 'POST');
    await pa.click('#btnAtGuardar'); const rAc = await rA; await esperarCerrado();
    await pa.waitForFunction(() => AT.det.estado === 'listo' && /agregado después del alta/.test(document.getElementById('atAcuerdosCard').innerText), null, { timeout: 8000 });
    const dE = (await api('GET', `/ateneos/${d3.id}`)).json;
    const acUi = await pa.evaluate(() => [...document.querySelectorAll('#atAcuerdosTabla tbody tr')].map((tr) => tr.children[0].innerText.trim()));
    const focoAc = await pa.evaluate(() => document.activeElement.id);
    check('c6-editar', 'editar un registro envía UN PATCH sólo con el campo cambiado y el detalle lo muestra (lo que guarda la API); «+ Agregar acuerdo» después del alta → POST /ateneos/{id}/acuerdos 201 y la tabla de acuerdos es la de la API, en su orden, con el foco en su título',
      rPatch.status() === 200 && JSON.stringify(Object.keys(patchBody)) === '["observaciones"]' && dE.observaciones === 'Observación editada desde la pantalla (c6)'
        && rAc.status() === 201 && JSON.stringify(acUi) === JSON.stringify(dE.acuerdos.map((a) => a.acuerdo)) && dE.acuerdos.length === 2 && focoAc === 'atAcuerdosTitulo',
      JSON.stringify({ patchBody, acUi, focoAc }).slice(0, 400));

    /* c6-clinico-ajeno · el admin crea, en Inicial (donde González no es técnico), un expediente con un ateneo clínico y uno de grupo:
       González no ve el clínico (ni en la lista ni en el total) y abrirlo da «no encontrado»; el de grupo sí lo ve (acceso general) */
    const suf = String(Date.now()).slice(-6);
    const idAj = (await api('POST', '/hce', { persona: { nombre: 'Ajeno' + suf, apellido: 'Cseis', ci: '3' + suf + '6', fecha_nac: '2016-07-07' }, grupo_id: inicial.id }, tokAdmin)).json.data.id;
    const clinAj = (await api('POST', '/ateneos', { tipo: 'clinico', fecha: `${anioReg}-09-01`, titulo: 'Clínico ajeno (c6)', hce_referida_id: idAj, grupo_id: inicial.id }, tokAdmin)).json.data;
    const grupoAj = (await api('POST', '/ateneos', { tipo: 'grupo', fecha: `${anioReg}-09-02`, titulo: 'De grupo de Inicial (c6)', grupo_id: inicial.id }, tokAdmin)).json.data;
    await irAteneos();
    const idsUi = (await filasUi()).map((f) => f.id), totalUi = await pa.evaluate(() => AT.lista.total);
    const lG = await api('GET', '/ateneos'), lAdm = await api('GET', '/ateneos', undefined, tokAdmin);
    await pa.evaluate((id) => atAbrir(id), clinAj.id); await esperarDetalle();
    const noEnc = await pa.evaluate(() => ({ estado: AT.det.estado, nf: AT.det.noEncontrado, txt: document.querySelector('#ateneosContent [role="alert"]') ? document.querySelector('#ateneosContent [role="alert"]').innerText : '',
      reintentar: !!document.querySelector('#ateneosContent [data-reintentar]'), titulo: /Clínico ajeno/.test(document.getElementById('ateneosContent').innerText) }));
    const apiAj = await api('GET', `/ateneos/${clinAj.id}`), apiNada = await api('GET', '/ateneos/9999001');
    await pa.evaluate((id) => atAbrir(id), grupoAj.id); await esperarDetalle();
    const grupoVisto = await pa.evaluate(() => AT.det.estado === 'listo' && /De grupo de Inicial/.test(document.getElementById('atDetTitulo').textContent));
    check('c6-clinico-ajeno', 'un ateneo clínico de un NNA de otro grupo: no está en la lista de González ni en su total (el admin sí lo ve), GET /ateneos/{id} es 404 igual que uno inexistente y la pantalla muestra «No se encontró el registro.» en role="alert" sin «Reintentar» ni el título; el ateneo de grupo de Inicial sí se ve y se abre',
      !idsUi.includes(clinAj.id) && idsUi.includes(grupoAj.id) && totalUi === +lG.total && !lG.json.some((a) => a.id === clinAj.id) && lAdm.json.some((a) => a.id === clinAj.id)
        && +lAdm.total === +lG.total + 1 && apiAj.status === 404 && JSON.stringify(apiAj.json) === JSON.stringify(apiNada.json)
        && noEnc.estado === 'error' && noEnc.nf && /No se encontró el registro/.test(noEnc.txt) && !noEnc.reintentar && !noEnc.titulo && grupoVisto,
      JSON.stringify({ totalUi, lG: lG.total, lAdm: lAdm.total, noEnc, st: apiAj.status, grupoVisto }));

    /* c6-resumen · la tarjeta «Ateneos clínicos» de la pestaña «Datos» de Martín lista los de GET /ateneos?hce_referida_id= y abre el ateneo */
    await pa.evaluate((i) => abrirExpediente(i), idMartin); await pa.waitForSelector('#expTitulo');
    await pa.waitForFunction(() => EXP_AT.estado === 'listo' && !!document.getElementById('expAteneosLista'), null, { timeout: 8000 });
    const delM = (await api('GET', `/ateneos?hce_referida_id=${idMartin}`)).json;
    const tarjeta = await pa.evaluate(() => [...document.querySelectorAll('#expAteneosLista li')].map((li) => ({ id: +li.dataset.ateneo, txt: li.innerText.replace(/\s+/g, ' ').trim() })));
    const seed1 = delM.find((a) => a.codigo === `AT-${anioReg}-001`);
    await pa.click(`#btnExpAt_${seed1.id}`); await esperarDetalle();
    const abierto = await pa.evaluate(() => ({ vista: document.querySelector('.view.active').id, codigo: AT.det.datos && AT.det.datos.codigo, foco: document.activeElement.id }));
    check('c6-resumen', 'pestaña «Datos» de Martín: la tarjeta «Ateneos clínicos» tiene exactamente los de GET /ateneos?hce_referida_id= (con el AT-<año>-001 del seed), en su orden, con código, fecha y «Sensible»; tocar uno abre ese ateneo en la vista Ateneos con el foco en su título',
      !!seed1 && tarjeta.length === delM.length && tarjeta.every((t, i) => t.id === delM[i].id && t.txt.includes(delM[i].codigo) && t.txt.includes(delM[i].titulo) && /Sensible/.test(t.txt))
        && abierto.vista === 'view-ateneos' && abierto.codigo === seed1.codigo && abierto.foco === 'atDetTitulo',
      JSON.stringify({ tarjeta: tarjeta.map((t) => t.id), api: delM.map((a) => a.id), abierto }));

    /* c6-doc · adjuntar un PDF al institucional del seed y descargarlo con el token */
    const inst = (await api('GET', '/ateneos?tipo=institucional')).json.find((a) => a.codigo === `AT-${anioReg}-003`);
    await pa.evaluate((id) => atAbrir(id), inst.id); await esperarDetalle();
    const docsAntes = (await api('GET', `/ateneos/${inst.id}/documentos`)).json.length;
    await pa.click('#btnAtDocCargar'); await pa.waitForSelector('#modalFlujo.open #atdf_archivo');
    const acepta = await pa.getAttribute('#atdf_archivo', 'accept');
    const catsAt = await pa.evaluate(() => [...document.querySelectorAll('#atdf_categoria option')].map((o) => o.textContent));
    await pa.setInputFiles('#atdf_archivo', { name: 'acta-c6.pdf', mimeType: 'application/pdf', buffer: PDF });
    await pa.selectOption('#atdf_categoria', { label: 'Otro' });
    await pa.fill('#atdf_nombre', 'Acta adjuntada desde la pantalla (c6)');
    const rD = pa.waitForResponse((r) => new URL(r.url()).pathname === `/ateneos/${inst.id}/documentos` && r.request().method() === 'POST');
    await pa.click('#btnAtGuardar'); const rDoc = await rD; await esperarCerrado();
    await pa.waitForFunction(() => AT.det.estado === 'listo' && /adjuntada desde la pantalla/.test(document.getElementById('atDocsCard').innerText), null, { timeout: 8000 });
    const docsApi = (await api('GET', `/ateneos/${inst.id}/documentos`)).json, nuevoDoc = docsApi[0];
    const nd = descargas.length;
    const [dl] = await Promise.all([pa.waitForEvent('download', { timeout: 8000 }), pa.click(`#btnAtDocBajar_${nuevoDoc.id}`)]);
    const bajado = require('fs').readFileSync(await dl.path());
    const desc = descargas.slice(nd).filter((d) => d.url === `/ateneos/${inst.id}/documentos/${nuevoDoc.id}/archivo`);
    const sinTok = await api('GET', `/ateneos/${inst.id}/documentos/${nuevoDoc.id}/archivo`, undefined, null);
    check('c6-doc', '«+ Adjuntar documento» en el institucional del seed (el <input> sugiere .pdf/.jpg/.jpeg/.png/.pptx y no ofrece categorías «Registro histórico»): UN POST multipart → 201, la tarjeta lo lista primero como la API; «Descargar» guarda los mismos bytes con Authorization y sin token es 401',
      acepta === '.pdf,.jpg,.jpeg,.png,.pptx' && !catsAt.some((c) => /Registro histórico/.test(c)) && rDoc.status() === 201 && docsApi.length === docsAntes + 1
        && nuevoDoc.nombre === 'Acta adjuntada desde la pantalla (c6)' && nuevoDoc.tipo === 'pdf' && Buffer.compare(bajado, PDF) === 0
        && desc.length === 1 && /^Bearer /.test(desc[0].auth || '') && sinTok.status === 401,
      JSON.stringify({ acepta, st: rDoc.status(), n: [docsAntes, docsApi.length], bytes: [bajado.length, PDF.length], auth: desc.map((d) => !!d.auth), sin: sinTok.status }));

    /* c6-convertir · convertir un clínico en otro tipo pide confirmación DENTRO del diálogo (la banda del descarte, §5.161 a): «Seguir editando»
       no manda nada y deja lo tipeado; «Convertir y guardar» manda UN PATCH y el registro deja de ser sensible. Otro tipo → clínico no pregunta. */
    const TXT_GENERAL = 'Al guardar, el registro deja de estar ligado al NNA y lo va a ver todo el equipo, con su situación, hipótesis, recursos y seguimiento.';
    const TXT_JORNADA = 'Al guardar, el registro deja de estar ligado al NNA y la situación, la hipótesis, los recursos y el seguimiento se borran del registro.';
    const mk = async (cuerpo) => (await api('POST', '/ateneos', cuerpo)).json.data;
    const clinA = await mk({ tipo: 'clinico', fecha: `${anioReg}-10-05`, titulo: 'Clínico a convertir en institucional (c6)', hce_referida_id: idMartin, situacion: 'Situación que se verá en todo el equipo (c6).' });
    const clinB = await mk({ tipo: 'clinico', fecha: `${anioReg}-10-06`, titulo: 'Clínico a convertir en jornada (c6)', hce_referida_id: idMartin, situacion: 'Situación que se borraría (c6).' });
    const grupoC = await mk({ tipo: 'grupo', fecha: `${anioReg}-10-07`, titulo: 'De grupo que pasa a clínico (c6)', grupo_id: escolares.id });
    const patches = (id) => escrituras.filter((e) => e.m === 'PATCH' && e.url === `/ateneos/${id}`).length;
    const abrirEdicion = async (id) => { await pa.evaluate((x) => atAbrir(x), id); await esperarDetalle(); await pa.click('#btnAtEditar'); await pa.waitForSelector('#modalFlujo.open #atf_tipo'); };
    const banda = () => pa.evaluate(() => { const b = document.querySelector('#modalFlujo .confirmar-descarte'); if (!b) return null;
      return { rol: b.getAttribute('role'), txt: b.querySelector('.cd-txt').textContent.trim().replace(/^⚠/, ''), foco: document.activeElement.id,
        botones: [...b.querySelectorAll('button')].map((x) => [x.id, x.textContent.trim(), x.className.trim(), Math.round(x.getBoundingClientRect().height)]), previo: b.previousElementSibling.className }; });
    const estadoDialogo = () => pa.evaluate(() => ({ banda: !!document.querySelector('.confirmar-descarte'), abierto: document.getElementById('modalFlujo').classList.contains('open'),
      tipo: (document.getElementById('atf_tipo') || {}).value, obs: (document.getElementById('atf_observaciones') || {}).value, guardar: !!document.getElementById('btnAtGuardar') && !document.getElementById('btnAtGuardar').disabled }));
    // A · clínico → institucional
    await abrirEdicion(clinA.id);
    await pa.selectOption('#atf_tipo', 'institucional'); await pa.fill('#atf_observaciones', 'Escrito antes de convertir (c6)');
    await pa.click('#btnAtGuardar'); await pa.waitForSelector('#modalFlujo .confirmar-descarte');
    const bA = await banda();
    await pa.click('#btnCdSeguir');                                           // «Seguir editando»: nada se manda, el diálogo y lo tipeado siguen
    const trasSeguir = await estadoDialogo();
    const apiTrasSeguir = (await api('GET', `/ateneos/${clinA.id}`)).json;
    await pa.click('#btnAtGuardar'); await pa.waitForSelector('#modalFlujo .confirmar-descarte');
    await pa.keyboard.press('Escape');                                        // Esc = lo seguro
    const trasEsc = await estadoDialogo();
    await pa.click('#btnAtGuardar'); await pa.waitForSelector('#modalFlujo .confirmar-descarte');
    await pa.click('#btnAtCancelar');                                         // Cancelar con la banda a la vista: la trata como «Seguir editando» (descarteAbierto)
    const trasCancelar = await estadoDialogo();
    const pendientesA = patches(clinA.id);
    await pa.click('#btnAtGuardar'); await pa.waitForSelector('#modalFlujo .confirmar-descarte');
    const rConv = pa.waitForResponse((r) => new URL(r.url()).pathname === `/ateneos/${clinA.id}` && r.request().method() === 'PATCH');
    await pa.click('#btnCdDescartar'); const respConv = await rConv; await esperarCerrado();
    const enviosA = escrituras.filter((e) => e.m === 'PATCH' && e.url === `/ateneos/${clinA.id}`);
    const bodyConv = enviosA.length ? JSON.parse(enviosA[0].body) : {};
    const dConv = (await api('GET', `/ateneos/${clinA.id}`)).json;
    await irAteneos();
    const filaA = (await filasUi()).find((f) => f.id === clinA.id);
    const labelInst = (await api('GET', '/ateneos/opciones')).json.tipos.find((t) => t.clave === 'institucional').label;
    // B · clínico → jornada: el texto de la jornada; sólo se cancela
    await abrirEdicion(clinB.id);
    await pa.selectOption('#atf_tipo', 'jornada'); await pa.click('#btnAtGuardar'); await pa.waitForSelector('#modalFlujo .confirmar-descarte');
    const bB = await banda();
    await pa.click('#btnCdSeguir'); await pa.evaluate(() => closeFlujoModal(true));
    const enviosB = patches(clinB.id), dB = (await api('GET', `/ateneos/${clinB.id}`)).json;
    // el mismo clínico, sin cambiar el tipo: no se pregunta (esperarCerrado fallaría con la banda a la vista)
    await abrirEdicion(clinB.id);
    await pa.fill('#atf_observaciones', 'Sin cambiar el tipo (c6)'); await pa.click('#btnAtGuardar'); await esperarCerrado();
    const enviosBsin = patches(clinB.id);
    // C · de otro tipo a clínico: no se pregunta
    await abrirEdicion(grupoC.id);
    await pa.selectOption('#atf_tipo', 'clinico'); await pa.selectOption('#atf_nna', String(idMartin));
    const rC = pa.waitForResponse((r) => new URL(r.url()).pathname === `/ateneos/${grupoC.id}` && r.request().method() === 'PATCH');
    await pa.click('#btnAtGuardar'); const respC = await rC; await esperarCerrado();
    const dC = (await api('GET', `/ateneos/${grupoC.id}`)).json;
    const botonesOk = (b) => b.botones.length === 2 && b.botones.every((x) => x[3] >= 24);
    check('c6-convertir', 'clínico → institucional o jornada: la banda del descarte (role="alert", foco en «Seguir editando», mismas clases) trae el texto de su caso; «Seguir editando», Esc y Cancelar no mandan nada y conservan lo tipeado (GET sin cambios); «Convertir y guardar» manda UN PATCH y la fila queda sin «Sensible»; sin cambiar el tipo y de otro tipo a clínico no se pregunta',
      !!bA && bA.rol === 'alert' && bA.txt === TXT_GENERAL && bA.foco === 'btnCdSeguir' && botonesOk(bA) && bA.botones[0][1] === 'Seguir editando' && bA.botones[1][1] === 'Convertir y guardar'
        && bA.botones[0][2] === 'btn btn-ghost' && bA.botones[1][2] === 'btn btn-descartar' && /modal-head/.test(bA.previo)
        && !trasSeguir.banda && trasSeguir.abierto && trasSeguir.tipo === 'institucional' && trasSeguir.obs === 'Escrito antes de convertir (c6)' && trasSeguir.guardar
        && apiTrasSeguir.tipo === 'clinico' && apiTrasSeguir.sensible === true && apiTrasSeguir.hce_referida_id === idMartin
        && !trasEsc.banda && trasEsc.abierto && trasEsc.tipo === 'institucional' && !trasCancelar.banda && trasCancelar.abierto && pendientesA === 0
        && respConv.status() === 200 && enviosA.length === 1 && bodyConv.tipo === 'institucional' && bodyConv.hce_referida_id === null
        && dConv.tipo === 'institucional' && dConv.sensible === false && dConv.hce_referida_id === null && dConv.observaciones === 'Escrito antes de convertir (c6)'
        && !!filaA && filaA.celdas[2].startsWith(labelInst) && filaA.marca === null && filaA.sensible === false
        && !!bB && bB.rol === 'alert' && bB.txt === TXT_JORNADA && bB.foco === 'btnCdSeguir' && bB.botones[1][1] === 'Convertir y guardar' && enviosB === 0 && dB.tipo === 'clinico' && dB.sensible === true
        && enviosBsin === 1 && respC.status() === 200 && dC.tipo === 'clinico' && dC.sensible === true && dC.hce_referida_id === idMartin,
      JSON.stringify({ bA, trasSeguir, apiTrasSeguir: [apiTrasSeguir.tipo, apiTrasSeguir.sensible], trasEsc, trasCancelar, pendientesA, st: respConv.status(), enviosA: enviosA.length, bodyConv,
        dConv: [dConv.tipo, dConv.sensible], filaA: filaA && [filaA.celdas[2], filaA.marca], bB, enviosB, dB: [dB.tipo, dB.sensible], enviosBsin, stC: respC.status(), dC: [dC.tipo, dC.sensible] }).slice(0, 1100));

    /* f3-toast-avisos · (sólo lectura: la respuesta del PATCH se contesta en el navegador, no llega a la API) tras un guardado el toast es «info» si la
       respuesta trae warnings[] y «ok» si no; el texto del mensaje es el mismo (§5.161 b) */
    const datosA = (await api('GET', `/ateneos/${clinA.id}`)).json;
    const guardarFalso = async (warnings) => {
      await pa.route((u) => u.pathname === `/ateneos/${clinA.id}`, (route) => route.request().method() === 'PATCH'
        ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: datosA, warnings }) }) : route.continue());
      await abrirEdicion(clinA.id); await pa.fill('#atf_observaciones', 'Prueba de avisos (f3, no se guarda)');
      await pa.click('#btnAtGuardar'); await esperarCerrado();
      const t = await pa.evaluate(() => ({ tipo: document.getElementById('toast').dataset.tipo, glifo: document.getElementById('toastIco').textContent, msg: document.getElementById('toastMsg').textContent }));
      await pa.unrouteAll({ behavior: 'ignoreErrors' });
      return t;
    };
    const conAviso = await guardarFalso([{ code: 'prueba_f3', mensaje: 'Aviso de prueba F3.' }]);
    const sinAviso = await guardarFalso([]);
    const helper = await pa.evaluate(() => [[{ mensaje: 'a' }], [], undefined, null].map((w) => { toastGuardado('x', w); return document.getElementById('toast').dataset.tipo; }));
    const datosDespues = (await api('GET', `/ateneos/${clinA.id}`)).json;
    check('f3-toast-avisos', 'tras guardar, el toast es «info» (ℹ) si la respuesta trae warnings[] y «ok» (✓) si no, con el mismo mensaje; toastGuardado() lo decide sólo por warnings[]; nada llegó a la API',
      conAviso.tipo === 'info' && conAviso.glifo === 'ℹ' && conAviso.msg === 'Registro guardado' && sinAviso.tipo === 'ok' && sinAviso.glifo === '✓' && sinAviso.msg === 'Registro guardado'
        && JSON.stringify(helper) === '["info","ok","ok","ok"]' && datosDespues.observaciones === datosA.observaciones,
      JSON.stringify({ conAviso, sinAviso, helper }));

    /* c6-salir · «Salir» con GET /ateneos todavía sin respuesta: al llegar, la vista sigue vacía y el estado no tiene datos de la sesión anterior */
    await pa.evaluate(() => go('inicio'));
    await pa.route((u) => u.pathname === '/ateneos', async (route) => { await new Promise((x) => setTimeout(x, 1500)); await route.continue().catch(() => {}); });
    await pa.click('.navitem[data-view="ateneos"]');
    await pa.click('.btn-exit');
    await pa.waitForTimeout(2200);
    const salir = await pa.evaluate(() => ({ contenido: document.getElementById('ateneosContent').innerHTML.trim(), filas: AT.lista.filas.length, estado: AT.lista.estado, det: AT.det.datos,
      ind: AT.ind.datos, exp: EXP_AT.filas.length, login: !document.getElementById('loginScreen').classList.contains('hidden') }));
    check('c6-salir', '«Salir» con GET /ateneos todavía sin respuesta: al llegar, la vista «Ateneos» sigue vacía, sin filas, indicador, detalle ni tarjeta del expediente de la sesión anterior, con el login a la vista',
      salir.contenido === '' && salir.filas === 0 && salir.estado === 'vacio' && salir.det === null && salir.ind === null && salir.exp === 0 && salir.login, JSON.stringify(salir));
    await ctx.close();
  }

  /* =====================================================================================================================
     F2 · PENDIENTES Y GRUPOS CONECTADOS (handoff §5 «F2»; GET /recordatorios, GET /hce, GET /grupos, PATCH /grupos/{id})
     Las lecturas (f2-rec … f2-a11y) no escriben. f2-asignar ESCRIBE (asigna técnicos al grupo Inicial): va al FINAL de la corrida,
     así ningún chequeo posterior ve un grupo cambiado. Todo se compara con lo que dice la API, no con literales.
     =================================================================================================================== */
  {
    const entrarComo = async (email, pass, ancho) => {
      const { ctx: c, page: pg } = await nuevaPagina();
      await pg.setViewportSize({ width: ancho || 1280, height: 800 });
      await pg.goto(urlDemo());
      await pg.fill('#loginUser', email); await pg.fill('#loginPass', pass); await pg.click('#loginBtn');
      await pg.waitForSelector('#loginScreen.hidden', { state: 'attached', timeout: 8000 });
      await pg.waitForFunction(() => /Mostrando \d+ de/.test(document.getElementById('listaResumen').textContent), null, { timeout: 8000 });
      const token = await pg.evaluate(() => sessionStorage.getItem('ippu.token'));
      const apiX = async (metodo, ruta, body, tok) => { const r = await fetch(API + ruta, { method: metodo, headers: { Authorization: 'Bearer ' + (tok || token), 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
        let json = null; try { json = await r.json(); } catch (_e) { json = null; } return { status: r.status, json }; };
      return { c, pg, token, apiX, yo: await pg.evaluate(() => Sesion.usuario()) };
    };
    const abrirPend = async (pg, filtroKpi) => {
      if (filtroKpi) await pg.evaluate(() => go('inicio')); else await pg.click('.navitem[data-view="pendientes"]');
      if (filtroKpi) await pg.click(filtroKpi);
      await pg.waitForFunction(() => PEND.estado === 'listo' && !!document.getElementById('tbodyPend'), null, { timeout: 8000 });
    };
    const abrirGrupos = async (pg) => {
      await pg.click('.navitem[data-view="grupos"]');
      await pg.waitForFunction(() => GRP.estado === 'listo' && !!document.querySelector('#gruposList .grupos-grid, #gruposList .estado-vacio'), null, { timeout: 8000 });
    };
    /* lo que la API dice que le falta a cada fila: la regla de la vista, escrita aparte */
    const faltantes = (h) => { const f = Object.fromEntries((h.flujo || []).map((e) => [e.modulo, e.estado])); const r = [];
      if (h.ci !== 'registrado') r.push('ci'); for (const [k, m] of [['lb', 'HCE-LB'], ['pa', 'HCE-PA'], ['pb', 'HCE-PB'], ['ic', 'HCE-IC']]) if ((f[m] || 'sin_iniciar') !== 'firmado') r.push(k); return r; };
    const codigoGruposOk = (lee) => lee.length === 2 && lee.every((x) => x === false);
    const activosApi = async (apiX) => (await apiX('GET', '/hce?limit=200&incluir_inactivos=false')).json;

    const T = await entrarComo(EMAIL, PASSWORD);
    const pt = T.pg;

    /* ---------- f2-rec: GET /recordatorios ---------- */
    {
      const r = await T.apiX('GET', '/recordatorios');
      check('f2-rec', 'GET /recordatorios con el token de la página: 8 filas, «lb» primero, con las banderas de activo',
        r.status === 200 && Array.isArray(r.json) && r.json.length === 8 && r.json[0].clave === 'lb' && r.json.every((x) => typeof x.activo === 'boolean' && Object.keys(x).sort().join() === 'activo,clave,periodo,texto'),
        JSON.stringify({ status: r.status, claves: (r.json || []).map((x) => x.clave + ':' + x.activo) }));
    }

    /* ---------- f2-pend: las filas de Pendientes son exactamente los NNA con algo sin registrar/firmar según GET /hce ---------- */
    let idsPend = [];
    {
      const hs = await activosApi(T.apiX);
      const esperados = hs.filter((h) => faltantes(h).length).map((h) => h.id).sort((a, b) => a - b);
      const completos = hs.filter((h) => !faltantes(h).length);
      const martin = hs.find((h) => h.persona.nombre === 'Martín'), bruno = hs.find((h) => h.persona.nombre === 'Bruno');
      await abrirPend(pt);
      idsPend = await pt.evaluate(() => [...document.querySelectorAll('#tbodyPend tr[data-hce]')].map((tr) => +tr.dataset.hce).sort((a, b) => a - b));
      const brunoTxt = await pt.evaluate((id) => { const tr = document.querySelector(`#tbodyPend tr[data-hce="${id}"]`); return tr ? tr.innerText.replace(/\s+/g, ' ') : null; }, bruno.id);
      const tabsPorFila = await pt.evaluate(() => [...document.querySelectorAll('#tbodyPend tr[data-hce]')].map((tr) => tr.querySelectorAll('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])').length));
      check('f2-pend-a', 'Pendientes (técnico): las filas son exactamente los NNA activos con algo sin registrar/firmar según el `ci` y el `flujo` de GET /hce; Martín (ciclo completo y CI) no está; Bruno muestra «CI pendiente»; el nombre es el único Tab de cada fila',
        JSON.stringify(idsPend) === JSON.stringify(esperados) && esperados.length > 0 && !!martin && completos.some((h) => h.id === martin.id) && !idsPend.includes(martin.id)
          && /CI pendiente/.test(brunoTxt || '') && tabsPorFila.length > 0 && tabsPorFila.every((n) => n === 1),
        JSON.stringify({ idsPend, esperados, martinCompleto: completos.some((h) => h.id === (martin || {}).id), bruno: (brunoTxt || '').slice(0, 80), tabsPorFila }));
      /* cada fila lista lo que falta con el estado del servidor: glifo + texto */
      const pillsOk = await pt.evaluate(() => Object.fromEntries([...document.querySelectorAll('#tbodyPend tr[data-hce]')].map((tr) => [tr.dataset.hce, [...tr.querySelectorAll('.st')].map((s) => s.innerText.replace(/\s+/g, ' ').trim())])));
      const okPills = hs.filter((h) => faltantes(h).length).every((h) => {
        const f = Object.fromEntries((h.flujo || []).map((e) => [e.modulo, e.estado])); const fila = pillsOk[h.id] || [];
        const esp = faltantes(h).map((k) => k === 'ci' ? 'CI pendiente' : `${k.toUpperCase()} ${({ en_curso: 'en curso', sin_iniciar: 'sin iniciar' })[f['HCE-' + k.toUpperCase()] || 'sin_iniciar']}`);
        return fila.length === esp.length && fila.every((t, i) => t.replace(/^\S+\s/, '') === esp[i]); });
      check('f2-pend-b', 'cada ítem de «Falta este año» es glifo + texto con el estado de la API («CI pendiente», «LB en curso», «PA sin iniciar»…), en el orden de la cadena y sin ninguno firmado',
        okPills, JSON.stringify(pillsOk).slice(0, 300));
      /* clic en la fila (mouse, en la celda del grupo) -> el expediente REAL de ese id */
      const alvo = bruno.id;
      await pt.click(`#tbodyPend tr[data-hce="${alvo}"] td:nth-child(2)`);
      await pt.waitForSelector('#expTitulo', { timeout: 8000 });
      const exp = await pt.evaluate(() => ({ id: EXP.id, titulo: document.getElementById('expTitulo').textContent, demo: !!document.querySelector('#view-expediente .demo-panel'), vista: document.querySelector('.view.active').id }));
      check('f2-pend-c', 'un clic en la fila de Bruno (fuera del nombre) abre SU expediente real (id de la API, sin panel de ejemplo)',
        exp.id === alvo && /Bruno/.test(exp.titulo) && !exp.demo && exp.vista === 'view-expediente', JSON.stringify(exp));
    }

    /* ---------- f2-filtro: los chips cuentan lo que filtran; los dos KPI de Inicio aterrizan en su filtro ---------- */
    {
      const hs = await activosApi(T.apiX);
      await abrirPend(pt);
      const esp = { todo: hs.filter((h) => faltantes(h).length).length };
      for (const k of ['ci', 'lb', 'pa', 'pb', 'ic']) esp[k] = hs.filter((h) => faltantes(h).includes(k)).length;
      const res = {};
      for (const k of ['todo', 'ci', 'lb', 'pa', 'pb', 'ic']) {
        await pt.click(`#pendContenido .chip-estado[data-filtro="${k}"]`);
        res[k] = await pt.evaluate((kk) => ({ n: +document.querySelector(`#pendContenido .chip-estado[data-filtro="${kk}"] .chip-n`).textContent, filas: document.querySelectorAll('#tbodyPend tr[data-hce]').length,
          pressed: [...document.querySelectorAll('#pendContenido .chip-estado')].map((c) => c.getAttribute('aria-pressed')).join(), foco: document.activeElement.dataset.filtro }), k);
      }
      check('f2-filtro-a', 'cada chip (Todo · Consentimiento · Línea base · Protocolo A · Protocolo B · Informe de cierre) muestra un conteo igual a sus filas y al de GET /hce; aria-pressed marca sólo el activo y el foco se queda en el chip tocado',
        Object.entries(res).every(([k, v]) => v.n === v.filas && v.n === esp[k] && (v.pressed.match(/true/g) || []).length === 1 && v.foco === k), JSON.stringify({ esp, res }).slice(0, 420));
      /* vacío por filtro: la API no lo da vacío en el seed; se fuerza con una respuesta de GET /hce sin pendientes */
      await pt.route(/\/hce\?/, (r) => r.request().method() === 'GET' && /limit=200/.test(r.request().url()) ? r.fulfill({ status: 200, contentType: 'application/json', body: '[]', headers: { 'X-Total-Count': '0', 'Access-Control-Expose-Headers': 'X-Total-Count', 'Access-Control-Allow-Origin': DEMO } }) : r.continue());
      await pt.evaluate(() => go('inicio')); await abrirPend(pt);
      const vacioTodo = await pt.evaluate(() => document.getElementById('tbodyPend').innerText.trim());
      await pt.click('#pendContenido .chip-estado[data-filtro="lb"]');
      const vacioLb = await pt.evaluate(() => document.getElementById('tbodyPend').innerText.trim());
      await pt.unroute(/\/hce\?/);
      check('f2-filtro-b', 'sin NNA pendientes, cada filtro tiene su estado vacío («Nada pendiente este año.» en Todo; «Nada pendiente de línea base este año.» en Línea base)',
        /Nada pendiente este año/.test(vacioTodo) && /Nada pendiente de línea base este año/.test(vacioLb), JSON.stringify({ vacioTodo, vacioLb }));
      /* KPI de Inicio -> Pendientes ya filtrada, foco en el título */
      await pt.evaluate(() => go('inicio'));
      await esperarKpis(pt);   // §5.166 d: sin esto, `+'…'` es NaN
      const kpis = await pt.evaluate(() => ({ lb: +document.getElementById('kpiPend').textContent, ci: +document.getElementById('kpiCi').textContent }));
      const aterrizaje = {};
      for (const [k, sel] of [['lb', '#kpiRow button >> nth=0'], ['ci', '#kpiRow button >> nth=1']]) {
        await pt.evaluate(() => go('inicio'));
        await pt.click(sel);
        await pt.waitForFunction(() => PEND.estado === 'listo', null, { timeout: 8000 });
        aterrizaje[k] = await pt.evaluate(() => ({ vista: document.querySelector('.view.active').id, foco: document.activeElement.id, activo: (document.querySelector('#pendContenido .chip-estado.active') || {}).dataset.filtro,
          filas: document.querySelectorAll('#tbodyPend tr[data-hce]').length }));
      }
      check('f2-filtro-c', 'los dos botones de Inicio aterrizan en Pendientes ya filtrada («Sin línea base firmada este año» → Línea base, «Sin consentimiento informado» → Consentimiento), con el foco en el título y tantas filas como dice la cifra del KPI',
        aterrizaje.lb.vista === 'view-pendientes' && aterrizaje.lb.foco === 'tituloPendientes' && aterrizaje.lb.activo === 'lb' && aterrizaje.lb.filas === kpis.lb
          && aterrizaje.ci.vista === 'view-pendientes' && aterrizaje.ci.foco === 'tituloPendientes' && aterrizaje.ci.activo === 'ci' && aterrizaje.ci.filas === kpis.ci,
        JSON.stringify({ kpis, aterrizaje }));
      /* abrir por la barra lateral vuelve a «Todo» */
      await pt.click('.navitem[data-view="inicio"]'); await abrirPend(pt);
      check('f2-filtro-d', 'abrir Pendientes por la barra lateral (no por un KPI) deja el filtro en «Todo»', (await pt.evaluate(() => PEND.filtro)) === 'todo');
    }

    /* ---------- f2-texto: nada de demostración en Pendientes ni en Grupos ---------- */
    {
      await abrirPend(pt); await abrirGrupos(pt);
      await pt.click('#gruposList .grupo-card .h2-link >> nth=0'); await pt.waitForSelector('#tablaGrupo');
      const t = await pt.evaluate(() => Object.fromEntries(['view-pendientes', 'view-grupos'].map((v) => { const e = document.getElementById(v);
        return [v, { texto: e.innerText, demo: e.querySelectorAll('[data-modo-demo], .demo-panel, .solo-demo').length, abrirDemo: /abrirExpedienteDemo/.test(e.innerHTML) }]; })));
      /* el código de las dos vistas no lee los arreglos de ejemplo (NNA, GRUPOS) ni abre expedientes de ejemplo */
      const srcPend = await (await fetch(DEMO + '/js/pendientes.js')).text();
      const srcGrp = await (await fetch(DEMO + '/js/grupos-usuario.js')).text();
      const codigoGrupos = srcGrp.slice(srcGrp.indexOf('VISTA GRUPOS · conectada'), srcGrp.indexOf('USUARIO / PERFIL'));
      const lee = [srcPend, codigoGrupos].map((s) => /\bNNA\.|\bGRUPOS\.|\bGRUPOS\[|abrirExpedienteDemo|una sola vez/.test(s));
      await abrirPend(pt);
      const t2 = await pt.evaluate(() => ({ texto: document.getElementById('view-pendientes').innerText, abrirDemo: /abrirExpedienteDemo/.test(document.getElementById('view-pendientes').innerHTML) }));
      check('f2-texto', 'en Pendientes y en Grupos (listado y un grupo abierto): sin «una sola vez», sin data-modo-demo / panel / «Solo demo», sin abrirExpedienteDemo, y el código de las dos vistas no lee NNA. ni GRUPOS.',
        Object.values(t).every((v) => !/una sola vez/i.test(v.texto) && v.demo === 0 && !v.abrirDemo) && !/una sola vez/i.test(t2.texto) && !t2.abrirDemo && codigoGruposOk(lee), JSON.stringify({ lee, demo: [t['view-pendientes'].demo, t['view-grupos'].demo], abrir: [t['view-pendientes'].abrirDemo, t['view-grupos'].abrirDemo, t2.abrirDemo] }));
    }

    /* ---------- f2-grupos-tec: González ve sólo sus grupos, con técnicos y conteos de la API, sin «Asignar técnicos» ---------- */
    {
      const gs = (await T.apiX('GET', '/grupos')).json, hs = await activosApi(T.apiX);
      const suyos = gs.filter((g) => (g.tecnico1 && g.tecnico1.id === T.yo.id) || (g.tecnico2 && g.tecnico2.id === T.yo.id));
      await abrirGrupos(pt);
      const vista = await pt.evaluate(() => [...document.querySelectorAll('#gruposList .grupo-card')].map((c) => ({ nombre: c.querySelector('h2').innerText.trim(),
        t: [...c.querySelectorAll('.grupo-tecnicos dd')].map((d) => d.innerText.replace(/\s+/g, ' ').trim()), n: +c.querySelector('.card-n').innerText.match(/\d+/)[0] })));
      const aTxt = (t) => t ? `${t.nombre}${t.rol ? ' · ' + t.rol : ''}` : 'Sin asignar';
      const esp = suyos.map((g) => ({ nombre: g.nombre, t: [aTxt(g.tecnico1), aTxt(g.tecnico2)], n: hs.filter((h) => h.grupo && h.grupo.id === g.id).length }));
      const botones = await pt.locator('#gruposList button', { hasText: 'Asignar técnicos' }).count();
      check('f2-grupos-tec', 'González ve sólo los grupos donde es técnico 1 o 2 (los de GET /grupos con su id), con técnicos («nombre · rol») y cantidad de NNA activos iguales a los de la API, y ningún «Asignar técnicos»',
        esp.length > 0 && esp.length < gs.length && JSON.stringify(vista.map((v) => v.nombre)) === JSON.stringify(esp.map((e) => e.nombre)) && JSON.stringify(vista) === JSON.stringify(esp) && botones === 0,
        JSON.stringify({ vista, esp, botones }).slice(0, 500));
      /* ---------- f2-integrantes: Escolares (la misma fila y los mismos estados que el listado principal) ---------- */
      const esc = gs.find((g) => g.nombre === 'Escolares');
      const apiEsc = (await T.apiX('GET', `/hce?grupo=Escolares&anio=${esc.anio}&incluir_inactivos=false&limit=200`)).json.map((h) => h.id).sort((a, b) => a - b);
      await pt.evaluate(() => go('inicio'));
      await pt.selectOption('#filtroGrupo', { label: 'Escolares' });
      await esperarResumen(pt, `Mostrando ${apiEsc.length} de ${apiEsc.length}`);
      const lista = await pt.evaluate(() => Object.fromEntries([...document.querySelectorAll('#tbodyNNA tr[data-hce]')].map((tr) => [tr.dataset.hce, tr.innerHTML.replace(/\s+/g, ' ')])));
      await abrirGrupos(pt);
      await pt.click(`#btnGrupo_${esc.id}`); await pt.waitForSelector('#tablaGrupo');
      const grupo = await pt.evaluate(() => Object.fromEntries([...document.querySelectorAll('#tablaGrupo tbody tr[data-hce]')].map((tr) => [tr.dataset.hce, tr.innerHTML.replace(/\s+/g, ' ')])));
      const foco1 = await pt.evaluate(() => document.activeElement.id);
      await pt.click('#grupoVolver');
      const foco2 = await pt.evaluate(() => document.activeElement.id);
      check('f2-integrantes', 'los integrantes de Escolares son los de GET /hce?grupo=Escolares&anio=… y cada fila es idéntica a la del listado de «NNA y HCE» (mismo renderer y mismos estados); el foco va al título del grupo y «‹ Grupos de referencia» lo devuelve al botón que lo abrió',
        apiEsc.length > 0 && JSON.stringify(Object.keys(grupo).map(Number).sort((a, b) => a - b)) === JSON.stringify(apiEsc) && JSON.stringify(grupo) === JSON.stringify(lista) && foco1 === 'grupoTitulo' && foco2 === 'btnGrupo_' + esc.id,
        JSON.stringify({ apiEsc, filas: Object.keys(grupo), iguales: JSON.stringify(grupo) === JSON.stringify(lista), foco1, foco2 }));
    }

    /* ---------- f2-grupos-admin: el admin ve los cinco grupos de 2026 ---------- */
    const A = await entrarComo(ADMIN_EMAIL, ADMIN_PASSWORD);
    const pa = A.pg;
    const gsAdmin = (await A.apiX('GET', '/grupos?anio=2026')).json;
    {
      await abrirGrupos(pa);
      const vista = await pa.evaluate(() => [...document.querySelectorAll('#gruposList .grupo-card')].map((c) => ({ nombre: c.querySelector('h2').innerText.trim(), t: [...c.querySelectorAll('.grupo-tecnicos dd')].map((d) => d.innerText.replace(/\s+/g, ' ').trim()),
        asignar: !!c.querySelector('button[id^="btnAsignar_"]') })));
      const sin = (n) => (vista.find((v) => v.nombre === n) || { t: [] }).t.join() === 'Sin asignar,Sin asignar';
      check('f2-grupos-admin', 'el admin ve los cinco grupos de 2026 (los de GET /grupos), cada uno con «Asignar técnicos»; Inicial y Taller de Adolescentes muestran «Sin asignar» en los dos puestos',
        gsAdmin.length === 5 && JSON.stringify(vista.map((v) => v.nombre)) === JSON.stringify(gsAdmin.map((g) => g.nombre)) && vista.every((v) => v.asignar) && sin('Inicial') && sin('Taller de Adolescentes'), JSON.stringify(vista).slice(0, 500));
    }

    /* ---------- f2-salir: «Salir» con GET /recordatorios o GET /grupos en vuelo deja las vistas vacías ---------- */
    {
      const salida = {};
      for (const [vista, ruta, nav, leer] of [['pendientes', /\/recordatorios$/, 'pendientes', () => ({ contenido: document.getElementById('pendContenido').innerHTML.trim(), desc: document.getElementById('pendDesc').textContent, estado: PEND.estado, filas: PEND.filas.length })],
        ['grupos', /\/grupos(\?.*)?$/, 'grupos', () => ({ contenido: document.getElementById('gruposList').innerHTML.trim(), estado: GRP.estado, grupos: GRP.grupos.length, filas: GRP.filas.length })]]) {
        const S = await entrarComo(EMAIL, PASSWORD);
        await S.pg.route(ruta, async (route) => { await new Promise((x) => setTimeout(x, 1500)); await route.continue().catch(() => {}); });
        await S.pg.click(`.navitem[data-view="${nav}"]`);
        await S.pg.click('.btn-exit');
        await S.pg.waitForTimeout(2200);
        salida[vista] = Object.assign(await S.pg.evaluate(leer), await S.pg.evaluate(() => ({ login: !document.getElementById('loginScreen').classList.contains('hidden') })));
        await S.c.close();
      }
      check('f2-salir', '«Salir» con GET /recordatorios (Pendientes) o GET /grupos (Grupos) todavía sin respuesta: al llegar, las dos vistas siguen vacías (sin datos de la sesión anterior detrás del login)',
        salida.pendientes.contenido === '' && salida.pendientes.desc === '' && salida.pendientes.estado === 'vacio' && salida.pendientes.filas === 0 && salida.pendientes.login
          && salida.grupos.contenido === '' && salida.grupos.estado === 'vacio' && salida.grupos.grupos === 0 && salida.grupos.filas === 0 && salida.grupos.login, JSON.stringify(salida));
    }

    /* ---------- f2-a11y: tamaño de los controles (WCAG 2.5.8), foco no tapado (2.4.11) y ninguna celda recortada a 1024 y 1280 ---------- */
    {
      const medir = (selRaiz) => {
        const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && !e.closest('[hidden], [inert]'); };
        const raiz = document.querySelector(selRaiz);
        const ts = [...raiz.querySelectorAll('button, a[href], input:not([type=hidden]), select, textarea, summary, [tabindex="0"]')].filter((e) => vis(e) && !e.closest('.sr-only'));
        const rects = ts.map((e) => e.getBoundingClientRect());
        const chicos = ts.map((e, i) => ({ e, r: rects[i] })).filter(({ r }) => r.width < 24 - 0.5 || r.height < 24 - 0.5).filter(({ e, r }) => {
          // excepción de espaciado: un círculo de 24 px centrado en el objetivo no toca a otro objetivo
          const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          return ts.some((o, j) => o !== e && !o.contains(e) && !e.contains(o) && (() => { const q = rects[j]; const dx = Math.max(q.left - cx, 0, cx - q.right), dy = Math.max(q.top - cy, 0, cy - q.bottom); return Math.hypot(dx, dy) < 12; })()); })
          .map(({ e, r }) => `${e.tagName}#${e.id || e.className} ${Math.round(r.width)}x${Math.round(r.height)}`);
        const celdas = [...raiz.querySelectorAll('td, th')].filter(vis).filter((c) => c.scrollWidth > c.clientWidth + 1).map((c) => `${c.tagName}:${(c.innerText || '').trim().slice(0, 20)} ${c.scrollWidth}>${c.clientWidth}`);
        const scrolls = [...raiz.querySelectorAll('.tabla-scroll')].filter((s) => s.scrollWidth > s.clientWidth + 1).length;
        return { objetivos: ts.length, chicos, celdas, scrolls, pagina: document.documentElement.scrollWidth - window.innerWidth };
      };
      const tabular = async (pg, raiz, maximo) => {       // 2.4.11: tras cada Tab el elemento enfocado no queda tapado por otra cosa (barra superior, etc.)
        await pg.evaluate((s) => { document.querySelector(s).scrollIntoView(); }, raiz);
        await pg.focus(`${raiz} button, ${raiz} summary, ${raiz} a[href], ${raiz} select`).catch(() => {});
        const tapados = [];
        for (let i = 0; i < maximo; i++) {
          await pg.keyboard.press('Tab'); await pg.waitForTimeout(20);
          const r = await pg.evaluate((s) => { const a = document.activeElement; if (!a || !a.closest(s)) return { fuera: true };
            const b = a.getBoundingClientRect(); const x = Math.min(Math.max(b.left + b.width / 2, 0), innerWidth - 1), y = Math.min(Math.max(b.top + b.height / 2, 0), innerHeight - 1);
            const arriba = document.elementFromPoint(x, y); return { tapado: !(arriba && (a === arriba || a.contains(arriba) || arriba.contains(a))), id: a.id || a.tagName }; }, raiz);
          if (r.fuera) break; if (r.tapado) tapados.push(r.id);
        }
        return tapados;
      };
      const informe = [];
      for (const [w, h] of [[1280, 800], [1024, 768]]) {
        await pt.setViewportSize({ width: w, height: h }); await pa.setViewportSize({ width: w, height: h });
        await abrirPend(pt);
        informe.push({ w, v: 'pendientes', ...(await pt.evaluate(medir, '#view-pendientes')), tapados: await tabular(pt, '#view-pendientes', 25) });
        await abrirGrupos(pa);
        informe.push({ w, v: 'grupos', ...(await pa.evaluate(medir, '#view-grupos')), tapados: await tabular(pa, '#view-grupos', 20) });
        await pa.click('#gruposList .grupo-card .h2-link >> nth=0'); await pa.waitForSelector('#tablaGrupo');
        informe.push({ w, v: 'grupo', ...(await pa.evaluate(medir, '#view-grupos')), tapados: await tabular(pa, '#view-grupos', 12) });
        await pa.click('#btnAsignarDet_' + (await pa.evaluate(() => GRP.abierto))); await pa.waitForSelector('#modalFlujo.open #asg_t1');
        informe.push({ w, v: 'dialogo', ...(await pa.evaluate(medir, '#modalFlujo')) });
        await escDescartando(pa); await pa.waitForSelector('#modalFlujo.open', { state: 'detached', timeout: 3000 }).catch(() => {});
      }
      await pt.setViewportSize({ width: 1280, height: 800 }); await pa.setViewportSize({ width: 1280, height: 800 });
      check('f2-a11y', 'Pendientes, Grupos (listado, un grupo abierto) y el diálogo de asignación, a 1280 y 1024 px: todo objetivo mide ≥ 24×24 px o cumple la excepción de espaciado (2.5.8), el foco con Tab nunca queda tapado (2.4.11), ninguna celda recortada ni scroll horizontal',
        informe.length === 8 && informe.every((x) => x.objetivos > 0 && x.chicos.length === 0 && x.celdas.length === 0 && x.scrolls === 0 && x.pagina <= 0 && (x.tapados || []).length === 0), JSON.stringify(informe).slice(0, 700));
    }

    /* ---------- f2-asignar (ESCRIBE; al FINAL): el admin asigna técnicos desde el diálogo ---------- */
    {
      await pa.evaluate(() => go('inicio')); await abrirGrupos(pa);
      const gs = (await A.apiX('GET', '/grupos?anio=2026')).json, inicial = gs.find((g) => g.nombre === 'Inicial');
      const profs = (await A.apiX('GET', '/profesionales?activo=true')).json, torres = profs.find((p) => p.nombre === 'Mtra. Torres');
      const patches = []; pa.on('request', (r) => { if (r.method() === 'PATCH' && /\/grupos\/\d+$/.test(r.url())) patches.push(JSON.parse(r.postData() || '{}')); });
      const abrir = async () => { await pa.click(`#btnAsignar_${inicial.id}`); await pa.waitForSelector('#modalFlujo.open #asg_t1'); await pa.waitForFunction(() => document.activeElement.id === 'asg_t1'); };

      /* a) el diálogo precarga lo vigente, ofrece «Sin asignar» + los profesionales activos como «nombre · especialidad» y sin cambios no envía nada */
      await abrir();
      const dlg = await pa.evaluate(() => ({ titulo: document.getElementById('mfTitle').textContent, t1: document.getElementById('asg_t1').value, opciones: [...document.getElementById('asg_t1').options].map((o) => o.textContent),
        max: [document.getElementById('asg_r1').maxLength, document.getElementById('asg_r2').maxLength], etiquetas: ['asg_t1', 'asg_r1', 'asg_t2', 'asg_r2'].map((i) => (document.querySelector(`label[for="${i}"]`) || {}).textContent) }));
      const n0 = patches.length;
      await pa.click('#btnAsgGuardar'); await pa.waitForSelector('#asgErrores:not([hidden])');
      const sinCambios = await pa.evaluate(() => ({ foco: document.activeElement.id, rol: document.getElementById('asgErrores').getAttribute('role'), txt: document.getElementById('asgErrores').innerText }));
      const espOpc = ['Sin asignar', ...profs.map((p) => `${p.nombre}${p.especialidad ? ' · ' + p.especialidad : ''}`)];
      check('f2-asignar-a', 'el diálogo abre con el foco en «Técnico 1», precarga lo vigente (Inicial: sin asignar), ofrece «Sin asignar» + los profesionales ACTIVOS de GET /profesionales como «nombre · especialidad» (sin filtro por rol), roles de hasta 60 caracteres con su etiqueta; guardar sin cambios dice «No hay cambios para guardar.» en role="alert" con el foco y no sale ningún pedido',
        dlg.titulo === 'Asignar técnicos' && dlg.t1 === '' && JSON.stringify(dlg.opciones) === JSON.stringify(espOpc) && dlg.max.join() === '60,60' && dlg.etiquetas.every(Boolean)
          && sinCambios.foco === 'asgErrores' && sinCambios.rol === 'alert' && /No hay cambios para guardar\./.test(sinCambios.txt) && patches.length === n0, JSON.stringify({ dlg: { ...dlg, opciones: dlg.opciones.length }, sinCambios, enviados: patches.length - n0 }));

      /* b) Esc con algo tipeado pide confirmación; «Seguir editando» conserva; «Descartar y cerrar» cierra sin enviar */
      await pa.selectOption('#asg_t1', String(torres.id));
      await pa.keyboard.press('Escape'); await pa.waitForSelector('#modalFlujo .confirmar-descarte', { timeout: 3000 });
      const pide = await pa.evaluate(() => document.activeElement.id);
      await pa.click('#btnCdSeguir');
      const sigue = await pa.evaluate(() => ({ abierto: document.getElementById('modalFlujo').classList.contains('open'), valor: document.getElementById('asg_t1').value }));
      await pa.keyboard.press('Escape'); await pa.waitForSelector('#modalFlujo .confirmar-descarte', { timeout: 3000 });
      await pa.click('#btnCdDescartar'); await pa.waitForFunction(() => !document.getElementById('modalFlujo').classList.contains('open'));
      const trasDescarte = await pa.evaluate((id) => ({ foco: document.activeElement.id, t1: document.querySelector(`#grupoCard_${id} .grupo-tecnicos dd`).innerText.trim() }), inicial.id);
      check('f2-asignar-b', 'con un cambio sin guardar, Esc pide confirmar (foco en «Seguir editando»); seguir conserva lo elegido; «Descartar y cerrar» cierra sin enviar nada, devuelve el foco al botón y el grupo sigue «Sin asignar»',
        pide === 'btnCdSeguir' && sigue.abierto && sigue.valor === String(torres.id) && patches.length === n0 && trasDescarte.foco === 'btnAsignar_' + inicial.id && trasDescarte.t1 === 'Sin asignar', JSON.stringify({ pide, sigue, trasDescarte, enviados: patches.length - n0 }));

      /* c) 403 (respuesta simulada): su mensaje va al resumen con el foco, sin campo marcado y lo elegido se conserva */
      await abrir();
      await pa.selectOption('#asg_t1', String(torres.id));
      await pa.route(/\/grupos\/\d+$/, (r) => r.request().method() === 'PATCH' ? r.fulfill({ status: 403, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': DEMO }, body: JSON.stringify({ code: 'forbidden', detail: [{ campo: null, mensaje: 'Sólo un admin asigna técnicos a un grupo' }] }) }) : r.continue());
      await pa.click('#btnAsgGuardar'); await pa.waitForFunction(() => /Sólo un admin/.test(document.getElementById('asgErrores').innerText));
      const r403 = await pa.evaluate(() => ({ foco: document.activeElement.id, invalidos: document.querySelectorAll('#mfBody [aria-invalid="true"]').length, valor: document.getElementById('asg_t1').value, abierto: document.getElementById('modalFlujo').classList.contains('open') }));
      await pa.unroute(/\/grupos\/\d+$/);
      check('f2-asignar-c', 'un 403 muestra su mensaje en el resumen role="alert" con el foco, sin marcar ningún campo; el diálogo sigue abierto con lo elegido',
        r403.foco === 'asgErrores' && r403.invalidos === 0 && r403.valor === String(torres.id) && r403.abierto, JSON.stringify(r403));

      /* d) éxito: Mtra. Torres como técnico 1 de Inicial -> PATCH 200 con tecnico1_id y tecnico1_rol (el rol viaja con todo cambio de técnico) */
      const resp = pa.waitForResponse((r) => r.request().method() === 'PATCH' && /\/grupos\/\d+$/.test(r.url()));
      await pa.click('#btnAsgGuardar');
      const rp = await resp;
      await pa.waitForFunction(() => !document.getElementById('modalFlujo').classList.contains('open'));
      await pa.waitForFunction((id) => !/Sin asignar/.test(document.querySelector(`#grupoCard_${id} .grupo-tecnicos dd`).innerText), inicial.id);
      const exito = await pa.evaluate((id) => ({ foco: document.activeElement.id, toast: document.getElementById('toastMsg').textContent, t1: document.querySelector(`#grupoCard_${id} .grupo-tecnicos dd`).innerText.replace(/\s+/g, ' ').trim() }), inicial.id);
      const trasApi = (await A.apiX('GET', '/grupos?anio=2026')).json.find((g) => g.id === inicial.id);
      check('f2-asignar-d', 'Mtra. Torres como técnico 1 de Inicial desde el diálogo: PATCH 200 que envía `tecnico1_id` y `tecnico1_rol` (null: el rol viaja con todo cambio de técnico); se cierra, la tarjeta lo muestra, GET /grupos coincide, el foco va al título del grupo y hay un aviso',
        rp.status() === 200 && JSON.stringify(patches[patches.length - 1]) === JSON.stringify({ tecnico1_id: torres.id, tecnico1_rol: null }) && trasApi.tecnico1 && trasApi.tecnico1.id === torres.id && exito.t1.startsWith('Mtra. Torres')
          && exito.foco === 'grupoTit_' + inicial.id && /Inicial/.test(exito.toast), JSON.stringify({ status: rp.status(), cuerpo: patches[patches.length - 1], exito, api: trasApi.tecnico1 }));

      /* e) la misma persona en los dos puestos -> 422 junto al técnico 2 y en el resumen con el foco; «Sin asignar» + otro cambio pasa */
      await abrir();
      await pa.selectOption('#asg_t2', String(torres.id));
      await pa.click('#btnAsgGuardar'); await pa.waitForFunction(() => document.getElementById('err_asg_t2').textContent.trim() !== '');
      const r422 = await pa.evaluate(() => ({ foco: document.activeElement.id, rol: document.getElementById('asgErrores').getAttribute('role'), err: document.getElementById('err_asg_t2').textContent.trim(),
        invalidos: [...document.querySelectorAll('#mfBody [aria-invalid="true"]')].map((e) => e.id).join(), resumen: document.getElementById('asgErrores').innerText, errT1: document.getElementById('err_asg_t1').textContent.trim() }));
      await pa.selectOption('#asg_t2', '');
      await pa.fill('#asg_r1', 'Maestra de apoyo');
      const n1 = patches.length;
      const resp2 = pa.waitForResponse((r) => r.request().method() === 'PATCH' && /\/grupos\/\d+$/.test(r.url()));
      await pa.click('#btnAsgGuardar');
      const rp2 = await resp2;
      await pa.waitForFunction(() => !document.getElementById('modalFlujo').classList.contains('open'));
      await pa.waitForFunction((id) => /Maestra de apoyo/.test(document.querySelector(`#grupoCard_${id} .grupo-tecnicos dd`).innerText), inicial.id);
      const final = (await A.apiX('GET', '/grupos?anio=2026')).json.find((g) => g.id === inicial.id);
      check('f2-asignar-e', 'la misma persona en los dos puestos: 422 junto a «Técnico 2» (aria-invalid, mensaje del servidor) y en el resumen role="alert" con el foco, sin tocar «Técnico 1»; con «Sin asignar» en el puesto 2 y otro cambio (el rol) se guarda: PATCH 200 con sólo `tecnico1_rol`, y GET /grupos coincide',
        r422.foco === 'asgErrores' && r422.rol === 'alert' && r422.err !== '' && r422.invalidos === 'asg_t2' && r422.errT1 === '' && /Técnico 2/.test(r422.resumen)
          && rp2.status() === 200 && JSON.stringify(patches.slice(n1).map((p) => Object.keys(p))) === '[["tecnico1_rol"]]' && final.tecnico1.id === torres.id && final.tecnico1.rol === 'Maestra de apoyo' && final.tecnico2 === null,
        JSON.stringify({ r422, enviado: patches.slice(n1), final: { t1: final.tecnico1, t2: final.tecnico2 } }));

      /* f) la acción queda en la auditoría institucional (una fila por campo que cambió) */
      check('f2-asignar-f', 'la API rechaza la asignación de un técnico (PATCH /grupos con el token de González → 403) aunque la pantalla ya no le ofrezca el botón',
        (await T.apiX('PATCH', `/grupos/${inicial.id}`, { tecnico2_id: torres.id })).status === 403, '');

      /* g) el rol de un puesto vaciado no se hereda: sacar al técnico 1 envía tecnico1_id null y tecnico1_rol null; el siguiente que se asigna, sin escribir rol, queda sin rol.
         (Inicial viene de e): Mtra. Torres con «Maestra de apoyo».) */
      const gonzalez = profs.find((p) => p.nombre === 'Dr. González');
      const celda1 = () => pa.evaluate((id) => document.querySelector(`#grupoCard_${id} .grupo-tecnicos dd`).innerText.replace(/\s+/g, ' ').trim(), inicial.id);
      const guardarPatch = async () => {
        const rg = pa.waitForResponse((r) => r.request().method() === 'PATCH' && /\/grupos\/\d+$/.test(r.url()));
        await pa.click('#btnAsgGuardar'); const x = await rg;
        await pa.waitForFunction(() => !document.getElementById('modalFlujo').classList.contains('open'));
        return x;
      };
      await abrir();
      await pa.fill('#asg_r1', ''); await pa.selectOption('#asg_t1', '');
      const g1 = await guardarPatch();
      await pa.waitForFunction((id) => /Sin asignar/.test(document.querySelector(`#grupoCard_${id} .grupo-tecnicos dd`).innerText), inicial.id);
      const cuerpoSacar = patches[patches.length - 1], trasSacar = (await A.apiX('GET', '/grupos?anio=2026')).json.find((x) => x.id === inicial.id);
      await abrir();
      const rolPrecargado = await pa.evaluate(() => document.getElementById('asg_r1').value);
      await pa.selectOption('#asg_t1', String(gonzalez.id));
      const g2 = await guardarPatch();
      await pa.waitForFunction((id) => /Dr\. González/.test(document.querySelector(`#grupoCard_${id} .grupo-tecnicos dd`).innerText), inicial.id);
      const cuerpoAsignar = patches[patches.length - 1], tarjeta = await celda1(), trasAsignar = (await A.apiX('GET', '/grupos?anio=2026')).json.find((x) => x.id === inicial.id);
      check('f2-asignar-g', 'el rol de un puesto vaciado no se hereda: sacar al técnico 1 envía `tecnico1_id` null y `tecnico1_rol` null; al asignar después al Dr. González sin escribir rol, el diálogo no precarga ninguno, la tarjeta dice «Dr. González» sin rol y GET /grupos devuelve rol null',
        g1.status() === 200 && JSON.stringify(cuerpoSacar) === JSON.stringify({ tecnico1_id: null, tecnico1_rol: null }) && trasSacar.tecnico1 === null
          && rolPrecargado === '' && g2.status() === 200 && JSON.stringify(cuerpoAsignar) === JSON.stringify({ tecnico1_id: gonzalez.id, tecnico1_rol: null })
          && tarjeta === 'Dr. González' && trasAsignar.tecnico1 && trasAsignar.tecnico1.id === gonzalez.id && trasAsignar.tecnico1.rol === null,
        JSON.stringify({ cuerpoSacar, cuerpoAsignar, rolPrecargado, tarjeta, api: trasAsignar.tecnico1 }));
    }
    await A.c.close(); await T.c.close();
  }

  /* =====================================================================================================================
     A1 · EL DIÁLOGO DEL MOTIVO (docs/diseno/fase4-acceso.md i; §5.165). ESCRIBE: dos expedientes de González que coordinación
     pasa a «sin grupo» (pase de caso), y la ventana que abre González sobre uno. El técnico no tratante abre un expediente sólo
     registrando el motivo y la C.I. completa del NNA (decisión (a)).
     =================================================================================================================== */
  {
    const { ctx: cm, page: pm } = await nuevaPagina();
    await pm.setViewportSize({ width: 1280, height: 800 });
    await loguearComo(pm, EMAIL, PASSWORD);
    const tok = await pm.evaluate(() => sessionStorage.getItem('ippu.token'));
    const tokAdmin = (await (await fetch(API + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }) })).json()).access_token;
    const api = async (metodo, ruta, body, t) => { const r = await fetch(API + ruta, { method: metodo, headers: { Authorization: 'Bearer ' + (t || tok), 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
      let json = null; try { json = await r.json(); } catch (_e) { json = null; } return { status: r.status, json }; };
    const CI = '4.765.436-2';
    const idA = await altaPropia(api, { nombre: 'Motivo', apellido: 'Uno', ci: CI, fecha_nac: '2016-05-05' });
    const idB = await altaPropia(api, { nombre: 'Motivo', apellido: 'Dos', ci: '4.765.437-0', fecha_nac: '2016-05-06' });
    const pases = [await pasarDeCaso(api, idA, tokAdmin), await pasarDeCaso(api, idB, tokAdmin)];
    const motivos = (await api('GET', '/accesos/motivos')).json;
    const delRol = motivos.filter((m) => m.quien.includes('no_tratante') && m.codigo !== 'copia_familia').map((m) => m.codigo);
    const pedidos = []; pm.on('request', (q) => { const u = new URL(q.url()); if (u.origin === new URL(API).origin) pedidos.push(q.method() + ' ' + u.pathname); });

    /* a1-motivo-dialogo · el diálogo: modal con nombre, app inerte, foco en el primer campo, rótulos, los motivos del rol, la
       indicación junto al texto y ningún dato del NNA; Esc lo cierra y el foco no queda en <body>; «Registrar el motivo» lo reabre */
    await pm.evaluate((i) => abrirExpediente(i), idA);
    await pm.waitForSelector('#modalFlujo.open #mfMotivo', { timeout: 8000 });
    await pm.waitForTimeout(50);
    const d = await pm.evaluate(() => {
      const m = document.querySelector('#modalFlujo .modal'), lab = (id) => { const l = document.querySelector(`label[for="${id}"]`); return l ? l.textContent.replace(/\s+/g, ' ').trim() : ''; };
      return { role: m.getAttribute('role'), modal: m.getAttribute('aria-modal'), nombre: document.getElementById(m.getAttribute('aria-labelledby')).textContent.trim(),
        inerte: document.querySelector('div.layout').inert, foco: document.activeElement.id, labels: ['mfMotivo', 'mfMotivoCi', 'mfMotivoTexto'].map(lab),
        opciones: [...document.querySelectorAll('#mfMotivo option')].map((o) => o.value).filter(Boolean), hint: document.getElementById('hint_mfMotivoTexto').textContent,
        desc: document.getElementById('mfMotivoTexto').getAttribute('aria-describedby'), banda: !!document.getElementById('expTitulo'),
        txt: document.getElementById('expedienteContent').innerText + ' ' + document.getElementById('mfBody').innerText };
    });
    await pm.keyboard.press('Escape');
    await pm.waitForFunction(() => !document.querySelector('#modalFlujo.open'), null, { timeout: 8000 });
    await pm.waitForTimeout(50);
    const trasEsc = await pm.evaluate(() => ({ activo: document.activeElement && document.activeElement !== document.body ? (document.activeElement.id || document.activeElement.tagName) : 'body', boton: !!document.getElementById('btnMotivoAbrir'), banda: !!document.getElementById('expTitulo') }));
    await pm.click('#btnMotivoAbrir');
    await pm.waitForSelector('#modalFlujo.open #mfMotivo', { timeout: 8000 });
    check('a1-motivo-dialogo', 'González abre un expediente que no trata: el diálogo del motivo (role=dialog, aria-modal, nombre, app inerte, foco en «Motivo»), con rótulos para motivo, «C.I. del NNA» y detalle, los motivos de su rol según GET /accesos/motivos (sin la copia a la familia), la indicación «Escribí el motivo, no datos clínicos del NNA.» referida desde el texto y ningún dato del NNA; Esc lo cierra (foco fuera de <body>) y «Registrar el motivo» lo reabre',
      pases.every((s) => s === 200) && d.role === 'dialog' && d.modal === 'true' && d.nombre === 'Motivo de acceso al expediente' && d.inerte && d.foco === 'mfMotivo'
        && d.labels[0].startsWith('Motivo') && d.labels[1].startsWith('C.I. del NNA') && d.labels[2] === 'Detalle del motivo'
        && JSON.stringify(d.opciones) === JSON.stringify(delRol) && /Escribí el motivo, no datos clínicos del NNA\./.test(d.hint) && /hint_mfMotivoTexto/.test(d.desc)
        && !d.banda && !/Motivo Uno|Uno Motivo/.test(d.txt) && trasEsc.activo !== 'body' && trasEsc.boton && !trasEsc.banda,
      JSON.stringify({ pases, d: { ...d, txt: d.txt.slice(0, 80) }, trasEsc, delRol }));

    /* a1-motivo-422 · sin la C.I., la API responde 422 y el error va junto al campo «C.I. del NNA» (aria-invalid), con el resumen */
    await pm.selectOption('#mfMotivo', 'interconsulta');
    const r422 = pm.waitForResponse((r) => new URL(r.url()).pathname === `/hce/${idA}/accesos` && r.request().method() === 'POST');
    await pm.click('#btnMotivoOk'); const resp422 = await r422;
    await pm.waitForFunction(() => !document.getElementById('motivoErrores').hidden, null, { timeout: 8000 });
    const e422 = await pm.evaluate(() => ({ inv: document.getElementById('mfMotivoCi').getAttribute('aria-invalid'), err: document.getElementById('err_mfMotivoCi').textContent, foco: document.activeElement.id, abierto: !!document.querySelector('#modalFlujo.open') }));
    check('a1-motivo-422', 'sin la C.I. del NNA la API responde 422 por campo y el mensaje va junto a «C.I. del NNA» (aria-invalid), con el resumen role="alert" enfocado; el diálogo sigue abierto',
      resp422.status() === 422 && e422.inv === 'true' && e422.err.length > 0 && e422.foco === 'motivoErrores' && e422.abierto, JSON.stringify({ st: resp422.status(), e422 }));

    /* a1-motivo-ci · una C.I. que no es la del NNA: el 404 de un inexistente; la pantalla muestra el mensaje de la API y no abre nada */
    await pm.fill('#mfMotivoCi', '1.234.567-8');
    const rMal = pm.waitForResponse((r) => new URL(r.url()).pathname === `/hce/${idA}/accesos` && r.request().method() === 'POST');
    await pm.click('#btnMotivoOk'); const respMal = await rMal; const cuerpoMal = await respMal.json();
    await pm.waitForFunction(() => !document.getElementById('motivoErrores').hidden && /No existe/.test(document.getElementById('motivoErrores').innerText), null, { timeout: 8000 });
    const mal = await pm.evaluate(() => ({ resumen: document.getElementById('motivoErrores').innerText.replace(/\s+/g, ' '), abierto: !!document.querySelector('#modalFlujo.open'), banda: !!document.getElementById('expTitulo') }));
    const sigueCerrado = await api('GET', `/hce/${idA}`);
    const inexistente = await api('POST', '/hce/999999/accesos', { motivo_codigo: 'interconsulta', ci: CI });
    check('a1-motivo-ci', 'una C.I. que no es la del NNA: POST /hce/{id}/accesos responde el 404 de un expediente inexistente (el mismo cuerpo), el diálogo muestra el mensaje de la API y no se abre nada (GET /hce/{id} sigue 403 reason_required)',
      respMal.status() === 404 && JSON.stringify(cuerpoMal) === JSON.stringify(inexistente.json) && mal.resumen.includes(cuerpoMal.detail[0].mensaje) && mal.abierto && !mal.banda
        && sigueCerrado.status === 403 && sigueCerrado.json.code === 'reason_required', JSON.stringify({ st: respMal.status(), cuerpoMal, mal, sigue: sigueCerrado.status }));

    /* a1-motivo-abre · la C.I. correcta (con su formato) y un motivo: 201 con la fila del registro, y el expediente se abre */
    await pm.fill('#mfMotivoCi', CI);
    await pm.fill('#mfMotivoTexto', 'Interconsulta del equipo de Escolares (a1).');
    const rOk = pm.waitForResponse((r) => new URL(r.url()).pathname === `/hce/${idA}/accesos` && r.request().method() === 'POST');
    await pm.click('#btnMotivoOk'); const respOk = await rOk; const fila = (await respOk.json()).data;
    await pm.waitForSelector('#expTitulo', { timeout: 8000 });
    const abierto = await pm.evaluate(() => ({ titulo: document.getElementById('expTitulo').textContent.trim(), dialogo: !!document.querySelector('#modalFlujo.open') }));
    const ahora = await api('GET', `/hce/${idA}`);
    check('a1-motivo-abre', 'con la C.I. correcta y «Interconsulta»: POST /hce/{id}/accesos 201 deja la fila del registro (no_tratante, interconsulta, el texto, 120 minutos) y el expediente se abre con su banda; GET /hce/{id} pasa a 200',
      respOk.status() === 201 && fila.relacion === 'no_tratante' && fila.motivo_codigo === 'interconsulta' && fila.motivo_texto === 'Interconsulta del equipo de Escolares (a1).'
        && (new Date(fila.vence) - new Date(fila.inicio)) === 120 * 60 * 1000 && abierto.titulo === 'Motivo Uno' && !abierto.dialogo && ahora.status === 200,
      JSON.stringify({ st: respOk.status(), fila, abierto, ahora: ahora.status }));

    /* a1-motivo-cancelar · «Cancelar» vuelve al listado sin ningún pedido de acceso */
    await pm.evaluate((i) => abrirExpediente(i), idB);
    await pm.waitForSelector('#modalFlujo.open #mfMotivo', { timeout: 8000 });
    await pm.selectOption('#mfMotivo', 'interconsulta');
    const antes = pedidos.length;
    await pm.click('#btnMotivoCancelar');
    await pm.waitForFunction(() => !document.querySelector('#modalFlujo.open') && document.getElementById('view-inicio').classList.contains('active'), null, { timeout: 8000 });
    const tras = pedidos.slice(antes);
    const sigueB = await api('GET', `/hce/${idB}`);
    const focoCancelar = await pm.evaluate(() => document.activeElement && document.activeElement.id);
    check('a1-motivo-cancelar', '«Cancelar» cierra el diálogo y vuelve al listado (con el foco en su título, no en <body>) sin pedir el acceso (ningún POST /hce/{id}/accesos) y el expediente sigue cerrado',
      !tras.some((p) => p.startsWith('POST') && p.endsWith('/accesos')) && sigueB.status === 403 && focoCancelar === 'tituloInicio', JSON.stringify({ tras, sigueB: sigueB.status, foco: focoCancelar }));
    await cm.close();
  }

  /* =====================================================================================================================
     C7 · PANEL INSTITUCIONAL CONECTADO (handoff §5.159; GET /panel?anio=, GET /recordatorios)
     Todo número de la pantalla se compara con GET /panel (o con la respuesta simulada de c7-sin-calculo): el navegador sólo
     formatea. c7-alcance ESCRIBE (saca a la Mtra. Torres de todos sus grupos para tener un técnico sin grupo): va al final.
     =================================================================================================================== */
  {
    const entrar = async (email, pass) => {
      const { ctx: c, page: pg } = await nuevaPagina();
      await pg.setViewportSize({ width: 1280, height: 800 });
      await pg.goto(urlDemo());
      await pg.fill('#loginUser', email); await pg.fill('#loginPass', pass); await pg.click('#loginBtn');
      await pg.waitForSelector('#loginScreen.hidden', { state: 'attached', timeout: 8000 });
      const token = await pg.evaluate(() => sessionStorage.getItem('ippu.token'));
      const apiX = async (metodo, ruta, body) => { const r = await fetch(API + ruta, { method: metodo, headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
        let json = null; try { json = await r.json(); } catch (_e) { json = null; } return { status: r.status, json }; };
      return { c, pg, apiX };
    };
    const abrirPanel = async (pg) => {
      await pg.click('.navitem[data-view="analitica"]');
      await pg.waitForFunction(() => PANEL.estado === 'listo' || PANEL.estado === 'error', null, { timeout: 8000 });
    };
    const anioHoy = new Date().getFullYear();
    /* El texto que la pantalla tiene que mostrar para cada número de GET /panel: sólo formato (coma decimal, signo, «N NNA»). */
    const dec = (v) => (v === null || v === undefined ? '—' : v.toFixed(1).replace('.', ','));
    const dlt = (v) => (v === null || v === undefined ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1).replace('.', ','));
    const esperado = (d) => {
      const e = { n_activos: String(d.n_activos), 'cobertura_lb.porcentaje': d.cobertura_lb.porcentaje === null ? '—' : `${d.cobertura_lb.porcentaje} %`,
        'cobertura_lb.cantidad': String(d.cobertura_lb.cantidad), 'ciclos_completos.cantidad': String(d.ciclos_completos.cantidad),
        'protocolo.n_ciclo_ab': String(d.protocolo.n_ciclo_ab), 'alertas.nna_con_alguna': String(d.alertas.nna_con_alguna),
        'bandas.sin_idea_firmado': `${d.bandas.sin_idea_firmado} NNA`, 'pendientes_flujo.ci': `${d.pendientes_flujo.ci} NNA` };
      d.bandas.filas.forEach((f, i) => { e[`bandas.filas.${i}.cantidad`] = `${f.cantidad} NNA`; });
      if (d.bandas.fuera_de_catalogo) e['bandas.fuera_de_catalogo'] = `${d.bandas.fuera_de_catalogo} NNA`;
      if (d.protocolo.n_ciclo_ab) d.protocolo.escalas.forEach((x) => { e[`protocolo.${x.escala}.media_pa`] = dec(x.media_pa); e[`protocolo.${x.escala}.media_pb`] = dec(x.media_pb); e[`protocolo.${x.escala}.media_delta`] = dlt(x.media_delta); });
      if (d.alertas.nna_con_alguna) d.alertas.escalas.forEach((x) => { e[`alertas.${x.escala}.cantidad`] = x.cantidad ? `${x.cantidad} NNA con alerta` : 'Ninguno'; });
      for (const k of ['lb', 'pa', 'pb', 'ic']) e[`pendientes_flujo.${k}`] = d.pendientes_flujo[k] ? `${d.pendientes_flujo[k]} NNA sin firmar` : 'Ninguno';
      if (d.n_activos === 0) for (const k of Object.keys(e)) if (!k.startsWith('pendientes_flujo')) delete e[k];   // sin expedientes: sólo los recordatorios
      return e;
    };
    /* Compara cada [data-c7] de la pantalla con lo esperado; devuelve las diferencias y cuántas claves se miraron. */
    const comparar = async (pg, d) => {
      const pantalla = await pg.evaluate(() => [...document.querySelectorAll('#panelContenido [data-c7]')].map((e) => [e.getAttribute('data-c7'), e.textContent.trim()]));
      const e = esperado(d), dif = [];
      for (const [k, v] of Object.entries(e)) { const enPant = pantalla.filter(([x]) => x === k).map(([, t]) => t); if (!enPant.length || enPant.some((t) => t !== v)) dif.push(`${k}: ${JSON.stringify(enPant)} ≠ ${v}`); }
      for (const [k] of pantalla) if (!(k in e)) dif.push(`${k}: en pantalla y no en la API`);
      const chips = await pg.evaluate(() => [...document.querySelectorAll('#panelBandas .banda-chip')].map((c) => c.textContent.replace(/\s+/g, ' ').trim()));
      if (d.n_activos) d.bandas.filas.forEach((f, i) => { if (chips[i] !== `Banda ${f.perfil} · ${f.total_min}–${f.total_max}`) dif.push(`chip ${i}: ${chips[i]}`); });
      return { dif, claves: Object.keys(e).length };
    };

    const G = await entrar(EMAIL, PASSWORD);
    await abrirPanel(G.pg);
    const apiG = (await G.apiX('GET', `/panel?anio=${anioHoy}`)).json;
    const numG = await comparar(G.pg, apiG);
    const descG = await G.pg.evaluate(() => document.getElementById('panelDesc').textContent);
    check('c7-numeros', `cada número del Panel institucional (KPI, bandas, protocolo, alertas, recordatorios) es el de GET /panel?anio=${anioHoy}, con el formato de la pantalla y nada más; las bandas son las del catálogo, en su orden`,
      numG.dif.length === 0 && numG.claves >= 20 && (await G.pg.locator('#panelKpi .kpi').count()) === 4, numG.dif.slice(0, 6).join(' | ') || `${numG.claves} valores`);

    /* c7-anio · el selector de año vuelve a pedir el panel con ?anio= */
    const opciones = await G.pg.evaluate(() => [...document.querySelectorAll('#panelAnio option')].map((o) => o.value));
    await G.pg.evaluate(() => { document.getElementById('panelAnio').dataset.c7Marca = '1'; });   // el mismo nodo después de recargar: el selector no se repinta
    const pedido = G.pg.waitForRequest((r) => new URL(r.url()).pathname === '/panel');
    await G.pg.selectOption('#panelAnio', String(anioHoy - 1));
    const rAnio = new URL((await pedido).url()).searchParams.get('anio');
    await G.pg.waitForFunction(() => PANEL.estado === 'listo', null, { timeout: 8000 });
    const apiPrev = (await G.apiX('GET', `/panel?anio=${anioHoy - 1}`)).json;
    const numPrev = await comparar(G.pg, apiPrev);
    const prev = await G.pg.evaluate(() => ({ lab: document.querySelector('#panelKpi .kpi .lab').textContent, enlaces: document.querySelectorAll('#panelRecordatorios [data-pend]').length, mismo: document.getElementById('panelAnio').dataset.c7Marca === '1' }));
    check('c7-anio', `el selector ofrece ${anioHoy} y ${anioHoy - 1}; elegir ${anioHoy - 1} pide GET /panel?anio=${anioHoy - 1}, la pantalla muestra esos números (cobertura «${anioHoy - 1}») y los recordatorios no enlazan a Pendientes (que es del año en curso); el selector no se repinta (es el mismo nodo: no pierde el foco)`,
      JSON.stringify(opciones) === JSON.stringify([String(anioHoy), String(anioHoy - 1)]) && rAnio === String(anioHoy - 1) && numPrev.dif.length === 0 && prev.lab.includes(String(anioHoy - 1)) && prev.enlaces === 0 && prev.mismo,
      JSON.stringify({ opciones, rAnio, dif: numPrev.dif.slice(0, 3), prev }));
    await G.pg.selectOption('#panelAnio', String(anioHoy));
    await G.pg.waitForFunction((a) => PANEL.estado === 'listo' && PANEL.datos.anio === a, anioHoy, { timeout: 8000 });

    /* c7-recordatorios · textos de GET /recordatorios; una cuenta abre Pendientes con su filtro */
    const recsApi = (await G.apiX('GET', '/recordatorios')).json;
    const recsPant = await G.pg.evaluate(() => [...document.querySelectorAll('#panelRecordatorios tbody tr')].map((tr) => [tr.getAttribute('data-clave'), tr.cells[0].textContent.trim(), tr.cells[1].textContent.trim(), tr.cells[2].textContent.trim(), !!tr.querySelector('[data-pend]')]));
    const editable = await G.pg.locator('#panelRecordatorios input, #panelRecordatorios select, #panelRecordatorios textarea').count();
    const conCuenta = ['lb', 'pa', 'pb', 'ic'].find((k) => apiG.pendientes_flujo[k] > 0);
    let pend = null;
    if (conCuenta) {
      await G.pg.click(`#panelRecordatorios [data-pend="${conCuenta}"]`);
      await G.pg.waitForFunction(() => PEND.estado === 'listo' && !!document.getElementById('tbodyPend'), null, { timeout: 8000 });
      pend = await G.pg.evaluate(() => ({ vista: document.querySelector('.view.active').id, filtro: PEND.filtro, chip: ((document.querySelector('#pendContenido .chip-estado.active') || {}).dataset || {}).filtro, foco: document.activeElement.id }));
    }
    check('c7-recordatorios', 'la tarjeta «Recordatorios» lista GET /recordatorios en su orden (texto, período, «Activo»/«Inactivo»), sin campos editables; sólo lb, pa, pb e ic llevan cuenta, y una cuenta abre Pendientes con ese filtro y el foco en su título',
      JSON.stringify(recsPant.map((r) => r.slice(0, 4))) === JSON.stringify(recsApi.map((r) => [r.clave, r.texto, r.periodo, r.activo ? 'Activo' : 'Inactivo'])) && editable === 0
        && recsPant.filter((r) => r[4]).every((r) => ['lb', 'pa', 'pb', 'ic'].includes(r[0])) && !!conCuenta && pend.vista === 'view-pendientes' && pend.filtro === conCuenta && pend.chip === conCuenta && pend.foco === 'tituloPendientes',
      JSON.stringify({ n: [recsPant.length, recsApi.length], editable, conCuenta, pend }));

    /* c7-sin-calculo · con una respuesta simulada de GET /panel la pantalla muestra ESOS números: no calcula nada */
    const falso = JSON.parse(JSON.stringify(apiG));
    Object.assign(falso, { n_activos: 23, alcance: 'mis_grupos' });
    falso.cobertura_lb = { cantidad: 11, de: 23, porcentaje: 37 };
    falso.ciclos_completos = { cantidad: 4, de: 23, porcentaje: 99 };
    falso.bandas.filas.forEach((f, i) => { f.cantidad = 10 + i; });
    Object.assign(falso.bandas, { sin_idea_firmado: 7, fuera_de_catalogo: 2 });
    falso.protocolo = { n_ciclo_ab: 5, escalas: falso.protocolo.escalas.map((x, i) => ({ escala: x.escala, media_pa: 12.3 + i, media_pb: 7.1, media_delta: i === 0 ? -1.5 : i === 1 ? 0 : 8.4 })) };
    falso.alertas = { nna_con_alguna: 3, escalas: falso.alertas.escalas.map((x, i) => ({ escala: x.escala, cantidad: i === 2 ? 0 : i + 1 })) };
    falso.pendientes_flujo = { ci: 6, lb: 0, pa: 13, pb: 14, ic: 15 };
    await G.pg.evaluate(() => go('inicio'));
    await G.pg.route((u) => u.pathname === '/panel', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(falso) }));
    await abrirPanel(G.pg);
    const numF = await comparar(G.pg, falso);
    const fuente = await (await fetch(DEMO + '/js/panel.js')).text();
    const sinComent = fuente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    const aritmetica = sinComent.split('\n').filter((l) => /\.reduce\(|Math\.round|\bNNA\.(filter|map|find|length|forEach|some|every)\b|\/\s*d\.n_activos|\*\s*100/.test(l));
    check('c7-sin-calculo', 'con GET /panel simulado (números inventados e incoherentes entre sí a propósito: 99 % de ciclos con 4 de 23) la pantalla muestra exactamente esos números, y panel.js no suma, no promedia, no redondea ni lee el arreglo de ejemplo NNA',
      numF.dif.length === 0 && numF.claves >= 25 && aritmetica.length === 0, (numF.dif.slice(0, 5).join(' | ') || `${numF.claves} valores`) + (aritmetica.length ? ' · ' + aritmetica.join(' / ') : ''));
    await G.pg.unroute((u) => u.pathname === '/panel');

    /* c7-error · un 500 de GET /panel: error compartido (role=alert) con «Reintentar», que vuelve a pedir y pinta */
    await G.pg.unrouteAll({ behavior: 'ignoreErrors' });
    await G.pg.evaluate(() => go('inicio'));
    let fallas = 1;
    await G.pg.route((u) => u.pathname === '/panel', async (route) => { if (fallas-- > 0) await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ code: 'error_interno', detail: [{ campo: null, mensaje: 'Error de prueba (c7)' }] }) }); else await route.continue(); });
    await abrirPanel(G.pg);
    const err = await G.pg.evaluate(() => { const e = document.querySelector('#panelContenido .estado-error'); return { estado: PANEL.estado, rol: e ? e.getAttribute('role') : null, boton: !!document.querySelector('#panelContenido [data-reintentar]') }; });
    await G.pg.click('#panelContenido [data-reintentar]');
    await G.pg.waitForFunction(() => PANEL.estado === 'listo', null, { timeout: 8000 });
    const trasReintentar = await comparar(G.pg, apiG);
    check('c7-error', 'un error de GET /panel se muestra con el estado compartido (role="alert") y «Reintentar»; reintentar vuelve a pedir y pinta los números de la API',
      err.estado === 'error' && err.rol === 'alert' && err.boton && trasReintentar.dif.length === 0, JSON.stringify({ err, dif: trasReintentar.dif.slice(0, 3) }));
    await G.pg.unrouteAll({ behavior: 'ignoreErrors' });

    /* c7-demo · sólo la tarjeta del heatmap conserva una marca de demostración; nada de «Pipeline» */
    const demo = await G.pg.evaluate(() => { const v = document.getElementById('view-analitica');
      const marcas = [...v.querySelectorAll('[data-modo-demo], .demo-panel, .solo-demo')];
      return { total: marcas.length, fueraHeat: marcas.filter((e) => !e.closest('#panelHeatmap')).length, enHeat: !!document.querySelector('#panelHeatmap .demo-panel[role="note"]'),
        pipeline: /Pipeline|Ingesta|anonimizaci|reporte automático|Informe:.*INAU/i.test(v.innerText), abreDemo: /abrirExpedienteDemo/.test(v.innerHTML), viejos: ['anKpi', 'distChart', 'escalasChart', 'protChart', 'recordatoriosBody'].filter((id) => document.getElementById(id)).length }; });
    check('c7-demo', 'en el Panel institucional sólo la tarjeta del heatmap lleva el panel compartido «Modo demostración»; no hay «Pipeline» ni «reporte a INAU», no se abre el expediente de ejemplo y no quedan los contenedores de la analítica de ejemplo',
      demo.total >= 1 && demo.fueraHeat === 0 && demo.enHeat && !demo.pipeline && !demo.abreDemo && demo.viejos === 0, JSON.stringify(demo));

    /* c7-salir · «Salir» con GET /panel todavía sin respuesta: al llegar, la vista sigue vacía */
    await G.pg.evaluate(() => go('inicio'));
    await G.pg.route((u) => u.pathname === '/panel', async (route) => { await new Promise((x) => setTimeout(x, 1500)); await route.continue().catch(() => {}); });
    await G.pg.click('.navitem[data-view="analitica"]');
    await G.pg.click('.btn-exit');
    await G.pg.waitForTimeout(2200);
    const salir = await G.pg.evaluate(() => ({ contenido: document.getElementById('panelContenido').innerHTML.trim(), desc: document.getElementById('panelDesc').textContent, filtros: document.getElementById('panelFiltros').innerHTML.trim(),
      estado: PANEL.estado, datos: PANEL.datos, recs: PANEL.recs.length, login: !document.getElementById('loginScreen').classList.contains('hidden') }));
    check('c7-salir', '«Salir» con GET /panel todavía sin respuesta: al llegar, el Panel sigue vacío (sin números, descripción ni selector) y sin datos de la sesión anterior, con el login a la vista',
      salir.contenido === '' && salir.desc === '' && salir.filtros === '' && salir.estado === 'vacio' && salir.datos === null && salir.recs === 0 && salir.login, JSON.stringify(salir));
    await G.c.close();

    /* c7-alcance · González (técnico) y el admin ven el alcance y el n que dice la API; un técnico sin grupo, los estados vacíos.
       ESCRIBE: saca a la Mtra. Torres de todos sus grupos (base descartable; es lo último que corre). */
    const A = await entrar(ADMIN_EMAIL, ADMIN_PASSWORD);
    await abrirPanel(A.pg);
    const apiA = (await A.apiX('GET', `/panel?anio=${anioHoy}`)).json;
    const numA = await comparar(A.pg, apiA);
    const descA = await A.pg.evaluate(() => document.getElementById('panelDesc').textContent);
    const grupos = [];
    for (const a of [anioHoy, anioHoy - 1, anioHoy - 2]) grupos.push(...(await A.apiX('GET', `/grupos?anio=${a}`)).json);
    const torres = (await A.apiX('GET', '/profesionales')).json.find((p) => p.nombre === 'Mtra. Torres');
    for (const g of grupos) {
      const cuerpo = {};
      if (g.tecnico1 && g.tecnico1.id === torres.id) Object.assign(cuerpo, { tecnico1_id: null, tecnico1_rol: null });
      if (g.tecnico2 && g.tecnico2.id === torres.id) Object.assign(cuerpo, { tecnico2_id: null, tecnico2_rol: null });
      if (Object.keys(cuerpo).length) await A.apiX('PATCH', `/grupos/${g.id}`, cuerpo);
    }
    await A.c.close();
    const S = await entrar('torres@demo.ippu.test', PASSWORD);
    await abrirPanel(S.pg);
    const apiS = (await S.apiX('GET', `/panel?anio=${anioHoy}`)).json;
    const numS = await comparar(S.pg, apiS);
    const vacio = await S.pg.evaluate(() => ({ desc: document.getElementById('panelDesc').textContent, vacio: !!document.querySelector('#panelVacio .estado-vacio'), kpis: document.querySelectorAll('#panelKpi').length,
      recs: !!document.getElementById('panelRecordatorios') }));
    check('c7-alcance', `González ve «de tus grupos» (alcance ${apiG.alcance}, n ${apiG.n_activos}) y el admin «de la institución» (alcance ${apiA.alcance}, n ${apiA.n_activos}), cada número como su GET /panel; un técnico sin grupo (Mtra. Torres, sacada de sus grupos) recibe n 0 y ve el estado vacío, con los recordatorios en «Ninguno» y sin KPI`,
      apiG.alcance === 'mis_grupos' && apiA.alcance === 'institucion' && descG.includes(`sobre ${apiG.n_activos} expedientes activos de tus grupos`) && descA.includes(`sobre ${apiA.n_activos} expedientes activos de la institución`) && numA.dif.length === 0
        && apiS.alcance === 'mis_grupos' && apiS.n_activos === 0 && numS.dif.length === 0 && vacio.vacio && vacio.kpis === 0 && vacio.recs && vacio.desc.includes('sobre 0 expedientes activos de tus grupos'),
      JSON.stringify({ g: [apiG.alcance, apiG.n_activos], a: [apiA.alcance, apiA.n_activos], s: [apiS.alcance, apiS.n_activos], dif: [...numA.dif, ...numS.dif].slice(0, 3), vacio }));
    await S.c.close();
  }

  check('z', 'sin errores de JavaScript en la página durante toda la corrida', erroresPagina.length === 0, erroresPagina.join(' | '));
  check('z-carga', 'ningún archivo estático de la demo falló al cargar (requestfailed del origen de la demo; z descarta «Failed to load resource» y por eso no lo veía, §5.166 d)',
    cargasFallidas.length === 0, cargasFallidas.join(' | '));
  await browser.close();

  const mal = resultados.filter((r) => !r.ok);
  console.log(`\n${resultados.length - mal.length}/${resultados.length} verificaciones OK` + (mal.length ? `  —  FALLAN: ${mal.map((r) => r.id).join(', ')}` : ''));
  process.exit(mal.length ? 1 : 0);
})().catch((e) => { console.error('ERROR del script:', e); volcarDiagnostico('error del script: ' + String(e && e.message || e).split('\n')[0]); process.exit(1); });
