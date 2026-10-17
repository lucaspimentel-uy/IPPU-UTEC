/* Capturas de pantalla de la demo CONECTADA (Fase 3-e · handoff §5.135): una imagen por pantalla a 1280×800 y a 1024×768, en
 * demo/verificacion/salidas/ (gitignored). Sirven para revisar a ojo la pasada visual; no comparan nada.
 *
 * Pantallas: login · listado · HCE-00 · CI · LB · PA · PB (con Δ) · editor del IC · informe impreso del IC · VF · una vista de
 * modo demostración (Analítica). F1 (handoff §5.140) agrega tres capturas de página completa (`f1-…-completa`): el editor de LB
 * (con la barra de acciones), el PB firmado con su bloque «Resultado» y el editor del IC.
 *
 * ⚠️ ESCRIBE (crea una valoración funcional para tener una VF con datos): sólo contra una base descartable recién cargada y con
 * CONFIRMA_BASE_DESCARTABLE=1, igual que conectada.js (ver README.md → «Base descartable»).
 *
 * Uso:  CONFIRMA_BASE_DESCARTABLE=1 API=http://localhost:8001 IPPU_DEMO_PASSWORD=... node capturas.js
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const API = process.env.API || 'http://localhost:8000';
const DEMO = process.env.DEMO || 'http://localhost:5500';
const EMAIL = process.env.IPPU_DEMO_EMAIL || 'gonzalez@demo.ippu.test';
const PASSWORD = process.env.IPPU_DEMO_PASSWORD;
if (process.env.CONFIRMA_BASE_DESCARTABLE !== '1') { console.error('Esta herramienta ESCRIBE en la base de la API (' + API + '): correla sólo contra una base descartable y confirmalo con CONFIRMA_BASE_DESCARTABLE=1.'); process.exit(1); }
if (!PASSWORD) { console.error('Falta IPPU_DEMO_PASSWORD.'); process.exit(1); }

const SALIDAS = path.join(__dirname, 'salidas');
fs.mkdirSync(SALIDAS, { recursive: true });
const TAMANIOS = [[1280, 800], [1024, 768]];

(async () => {
  const browser = await chromium.launch();
  const hechas = [];
  for (const [w, h] of TAMANIOS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    const snap = async (nombre) => { await page.waitForTimeout(250); const f = `3e-${nombre}-${w}x${h}.png`; await page.screenshot({ path: path.join(SALIDAS, f) }); hechas.push(f); };
    const snapCompleta = async (nombre) => { await page.waitForTimeout(250); const f = `f1-${nombre}-completa-${w}x${h}.png`; await page.screenshot({ path: path.join(SALIDAS, f), fullPage: true }); hechas.push(f); };

    await page.goto(DEMO + '/index.html?api=' + encodeURIComponent(API));
    await page.waitForSelector('#loginScreen', { state: 'attached' });
    await snap('login');
    await page.fill('#loginUser', EMAIL); await page.fill('#loginPass', PASSWORD); await page.click('#loginBtn');
    await page.waitForSelector('#loginScreen.hidden', { state: 'attached', timeout: 8000 });
    await page.waitForFunction(() => /Mostrando \d+ de/.test(document.getElementById('listaResumen').textContent), null, { timeout: 8000 });
    await page.waitForTimeout(3500);                                    // que el aviso «Bienvenido» se vaya
    await snap('listado');

    const token = await page.evaluate(() => sessionStorage.getItem('ippu.token'));
    const api = async (metodo, ruta, body) => { const r = await fetch(API + ruta, { method: metodo, headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) }); return { status: r.status, json: r.status === 204 ? null : await r.json() }; };
    const idDe = async (n) => (await api('GET', '/hce?nombre=' + encodeURIComponent(n) + '&limit=5')).json.find((x) => x.persona.nombre === n).id;
    const abrir = async (nombre, tab) => {
      const id = await idDe(nombre);
      await page.evaluate((i) => abrirExpediente(i), id);
      await page.waitForSelector('#expTitulo'); await page.waitForFunction(() => !!EXP.flujo && !!EXP.mods, null, { timeout: 8000 });
      if (tab !== 'hce00') await page.click('#tabExp-' + tab);
      await page.waitForFunction(() => !/Cargando/.test(document.getElementById('panelExp').innerText), null, { timeout: 8000 });
      return id;
    };
    const idMartin = await abrir('Martín', 'hce00');                     await snap('hce00');
    await abrir('Martín', 'ci');                                          await snap('ci');
    await abrir('Martín', 'lb');                                          await snap('lb');
    await abrir('Sofía', 'pa');                                           await snap('pa');
    await abrir('Martín', 'pb');                                          await snap('pb-con-delta');
    await abrir('Valentina', 'ic');                                       await snap('ic-editor');
    await abrir('Martín', 'ic'); await page.click('#btnIcImpreso'); await page.waitForSelector('.print-wrap'); await snap('ic-impreso');
    // VF con datos: se crea una valoración (la base es descartable) para mostrar la pantalla con categoría y alerta de la API
    if (w === 1280) await api('POST', `/hce/${idMartin}/valoracion-funcional`, { estado: 'Valorado', fecha: '2025-01-15', organismo: 'Equipo valorador', pct: '58', vigencia: '2026-12-31', dominios: { comunicacion: 'Apoyo permanente', autocuidado: 'Apoyo ocasional', movilidad: 'Autónomo' }, capacidades: 'Disfruta de la música.', sintesis_funcional: 'Muestra.' });
    await abrir('Martín', 'vf');                                          await snap('vf');
    // C1: el registro de cambios de Martín (las firmas del seed + una edición de HCE-00 con un valor largo, para ver el «ver completo»)
    if (w === 1280) await api('PATCH', `/hce/${idMartin}`, { medicacion: 'Muestra de un valor largo para el registro de cambios. '.repeat(5) });
    await abrir('Martín', 'log'); await page.waitForSelector('#panelExp .log-table');   await snap('log');
    await page.evaluate(() => { const d = document.querySelector('.log-ver'); if (d) d.open = true; });   await snap('log-ver-completo');
    await page.click('.navitem[data-view="analitica"]');                 await snap('modo-demostracion-analitica');
    // F1: página completa (la banda y la barra de acciones quedan donde las deja el desplazamiento)
    await abrir('Joaquín', 'lb');                                         await snapCompleta('lb');
    await abrir('Martín', 'pb');                                          await snapCompleta('pb-resultado');
    await abrir('Valentina', 'ic');                                       await snapCompleta('ic-editor');
    await ctx.close();
  }
  await browser.close();
  console.log(hechas.length + ' capturas en ' + SALIDAS + ':\n  ' + hechas.join('\n  '));
})().catch((e) => { console.error('ERROR del script:', e); process.exit(1); });
