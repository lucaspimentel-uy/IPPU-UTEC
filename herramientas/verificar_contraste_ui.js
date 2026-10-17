/* Mide contraste WCAG sobre la demo L1 HCE+IDEA (IPPU x UTEC-LIDIA), por script — no a mano.
 * Sucesor del método de docs/guias/notas-accesibilidad-ui.md (§«Contraste y foco»).
 *
 * Qué mide (todo sobre el DOM realmente renderizado, con los colores ya resueltos por el navegador):
 *   (1) PARES TEXTO/FONDO de todo elemento con texto propio visible (1.4.3: 4,5:1, o 3:1 si el texto es grande), más el
 *       texto que escribe una persona en un campo (color del valor y de su placeholder).
 *   (2) BORDE DE LOS CAMPOS (input/select/textarea): 3:1 contra lo que tienen detrás (1.4.11).
 *   (3) ANILLO DE FOCO (2.4.7 / 1.4.11): se enfoca con el TECLADO (:focus-visible de verdad, no un .focus() a secas), se lee
 *       el contorno computado (color, ancho, separación) y se compara con el fondo que realmente queda detrás del anillo
 *       (se esconde el control y se mira qué hay a su lado: sirve también para el enlace de salto, que flota sobre la barra).
 *       Un selector que apague el contorno (`outline:none`) en el CSS se informa aparte.
 *
 * Pantallas y diálogos que recorre (la lista exacta se imprime al final como «Cobertura»):
 *   CONECTADAS: login (y su error), listado (cargando · error · vacío · filas · filtros), expediente de la API con sus 13
 *   pestañas, CI (pendiente con errores · registrado · edición), IDEA (borrador con NS · firmado con banda · firma y 422 ·
 *   addendas), PA y PB (borrador · Δ), IC (sin crear · firmado · avisos y «Cambió en el servidor» · errores), documento
 *   impreso del IC, VF (vacía · formulario · categorías y niveles), reporte de la VF, diálogo de alta/edición en sus cuatro
 *   pasos y su confirmación de descarte, diálogo del recibí y su confirmación, estados compartidos, toast, enlace de salto,
 *   y el cromo de la app (barra lateral, cabecera) en todas ellas.
 *   MODO DEMOSTRACIÓN (se informan aparte): Pendientes, Analítica, Grupos, Inclusión, Ateneos, Perfil y el expediente de ejemplo.
 *   El panel «Modo demostración» y la marca «Solo demo» se miden también en las pantallas conectadas (pestañas sin API).
 *
 * Requiere Playwright. Reusa el install existente de demo/verificacion/ (no se duplica una segunda instalación) — si no
 * está, `cd implementacion/L1-hce-idea/demo/verificacion && npm ci && npx playwright install chromium`.
 *
 * Uso:  API=http://localhost:8001 IPPU_DEMO_PASSWORD=... node herramientas/verificar_contraste_ui.js [--json out.json] [--tabla]
 *   --json   además vuelca el resultado crudo;
 *   --tabla  imprime los pares que fallan como tabla Markdown (elemento · primer plano · fondo · criterio), sin cifras.
 *
 * ⚠️ NO corre contra la base de presentación: medir sobre una base descartable recién cargada (README de verificacion/,
 * «Base descartable») y ANTES de conectada.js (que escribe). Esta herramienta sólo LEE: lo que no existe en el seed (el
 * recibí pendiente, los errores de firma, el conflicto) se pinta con los componentes reales de la demo, sin pedirle nada a la API.
 *
 * NUNCA ESCRIBE EN LA API, y no por buena conducta sino por construcción: todo pedido del navegador a la base de la API pasa por
 * un filtro (`ctx.route`) que deja pasar sólo GET (y OPTIONS, que no lleva datos) y `POST /auth/login`. Las dos confirmaciones de
 * firma que la herramienta pulsa para medir la pantalla de errores (IDEA de Joaquín y PA de Sofía) reciben un 422 ENLATADO con
 * la forma del contrato {code, detail[]}, copiado de un 422 real del mismo endpoint (ver ENLATADOS_422): el pedido ni sale. Cualquier
 * otro POST/PATCH/PUT/DELETE se ABORTA, se anota, y la corrida termina con código 1 nombrándolo. Al final se imprimen los contadores.
 * Autoprueba del filtro: `VERIFICAR_AUTOPRUEBA=1` emite un POST sin ruta desde la página y debe terminar en código 1.
 *
 * Variables: API (por omisión http://localhost:8000) · DEMO (http://localhost:5500) · IPPU_DEMO_PASSWORD · IPPU_DEMO_EMAIL ·
 * VERIFICAR_AUTOPRUEBA (=1: sólo la autoprueba del filtro).
 */
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..');
const CSS_PATH = path.join(REPO, 'implementacion/L1-hce-idea/demo/css/estilos.css');
const API = process.env.API || 'http://localhost:8000';
const DEMO = process.env.DEMO || 'http://localhost:5500';
const EMAIL = process.env.IPPU_DEMO_EMAIL || 'gonzalez@demo.ippu.test';
const PASSWORD = process.env.IPPU_DEMO_PASSWORD;
const URL_DEMO = DEMO + '/index.html?api=' + encodeURIComponent(API);

/* 422 reales de POST /idea/{id}/firmar y POST /protocolo/{id}/firmar sobre el seed recién cargado (Joaquín · IDEA en borrador con
   D3 y D12 en NS; Sofía · PA en borrador sin fecha ni síntesis), capturados el 2026-10-16 contra la API de la rama. No se inventan:
   si el contrato cambia, se vuelven a copiar de una respuesta real. */
const ENLATADOS_422 = {
  idea: { code: 'validation_error', detail: [
    { campo: 'dim.D3', mensaje: 'Está en NS (observación insuficiente): puntuala para firmar' },
    { campo: 'dim.D12', mensaje: 'Está en NS (observación insuficiente): puntuala para firmar' },
    { campo: 'fecha_consenso', mensaje: 'Es obligatoria para firmar' },
    { campo: 'sintesis', mensaje: 'La síntesis clínica es obligatoria para firmar' },
    { campo: 'objetivos', mensaje: 'Los objetivos del período son obligatorios para firmar' }] },
  protocolo: { code: 'validation_error', detail: [
    { campo: 'fecha', mensaje: 'Es obligatoria para firmar' },
    { campo: 'sint_tec1', mensaje: 'La síntesis del técnico 1 es obligatoria para firmar' },
    { campo: 'sint_tec2', mensaje: 'La síntesis del técnico 2 es obligatoria para firmar' }] },
};
const intercepcion = { get: 0, login: 0, preflight: 0, enlatados: 0, abortados: [] };
/* Instala el filtro de escritura; los contadores quedan en `intercepcion`. */
async function instalarFiltroDeEscritura(ctx) {
  await ctx.route((u) => u.href.startsWith(API + '/'), async (route) => {
    const req = route.request();
    const m = req.method();
    const ruta = new URL(req.url()).pathname;
    if (m === 'GET') { intercepcion.get++; return route.continue(); }
    if (m === 'OPTIONS') { intercepcion.preflight++; return route.continue(); }
    if (m === 'POST' && ruta === '/auth/login') { intercepcion.login++; return route.continue(); }
    const firma = m === 'POST' && /^\/(idea|protocolo)\/\d+\/firmar$/.exec(ruta);
    if (firma) {
      intercepcion.enlatados++;
      return route.fulfill({
        status: 422, contentType: 'application/json',
        headers: { 'access-control-allow-origin': new URL(DEMO).origin },
        body: JSON.stringify(ENLATADOS_422[firma[1]]),
      });
    }
    intercepcion.abortados.push(`${m} ${ruta}`);
    return route.abort('blockedbyclient');
  });
}
function imprimirIntercepcion() {
  console.log(`\nInterceptación de la API (la herramienta no escribe): GET pasados = ${intercepcion.get} · POST /auth/login = ${intercepcion.login} · preflight = ${intercepcion.preflight} · 422 enlatados de firma = ${intercepcion.enlatados} · escrituras abortadas = ${intercepcion.abortados.length}${intercepcion.abortados.length ? ' → ' + intercepcion.abortados.join(' · ') : ''}`);
}
const PLAYWRIGHT_DIR = path.join(REPO, 'implementacion/L1-hce-idea/demo/verificacion/node_modules');

let chromium;
try {
  chromium = require(path.join(PLAYWRIGHT_DIR, 'playwright')).chromium;
} catch {
  console.error('No se encontró Playwright en demo/verificacion/node_modules.');
  console.error('Instalar: cd implementacion/L1-hce-idea/demo/verificacion && npm ci && npx playwright install chromium');
  process.exit(1);
}

/* ============================================================================
   PARTE 1 — MATEMÁTICA WCAG (luminancia relativa, contraste)
   ============================================================================ */
function parseColor(str) {
  str = String(str).trim();
  let m = str.match(/^#([0-9a-fA-F]{3})$/);
  if (m) { const [r, g, b] = m[1].split('').map(c => parseInt(c + c, 16)); return { r, g, b, a: 1 }; }
  m = str.match(/^#([0-9a-fA-F]{6})$/);
  if (m) { const h = m[1]; return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: 1 }; }
  m = str.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*(?:[,/]\s*([\d.]+%?))?\s*\)$/);
  if (m) { let a = m[4] === undefined ? 1 : (m[4].endsWith('%') ? parseFloat(m[4]) / 100 : +m[4]); return { r: +m[1], g: +m[2], b: +m[3], a }; }
  return null;
}
function componer(fg, bg) { const a = fg.a; return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 }; }
function luminanciaRelativa({ r, g, b }) {
  const canal = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}
function ratio(a, b) {
  const la = luminanciaRelativa(a), lb = luminanciaRelativa(b);
  const [claro, oscuro] = la >= lb ? [la, lb] : [lb, la];
  return (claro + 0.05) / (oscuro + 0.05);
}
function ratioConAlpha(fgStr, bgStr) {
  const fg = parseColor(fgStr), bg = parseColor(bgStr);
  if (!fg || !bg) return null;
  return ratio(fg.a < 1 ? componer(fg, bg) : fg, bg);
}
function criterioYVeredicto(r, { esGrande = false, esNoTexto = false, etiqueta = '' } = {}) {
  if (esNoTexto) return { criterio: `3:1 (1.4.11${etiqueta ? ', ' + etiqueta : ''})`, pasa: r >= 3 };
  const umbral = esGrande ? 3 : 4.5;
  return { criterio: `${umbral}:1 (1.4.3, texto ${esGrande ? 'grande' : 'normal'})`, pasa: r >= umbral };
}
const aHex = (rgbStr) => {
  const c = parseColor(rgbStr); if (!c) return rgbStr;
  const h = (n) => Math.round(n).toString(16).padStart(2, '0').toUpperCase();
  return '#' + h(c.r) + h(c.g) + h(c.b) + (c.a < 1 ? ` (α${c.a.toFixed(2)})` : '');
};

/* ============================================================================
   PARTE 2 — EXTRACCIÓN VIVA
   ============================================================================ */
/* Todo lo que corre en el navegador va en UNA función para poder pasarla a page.evaluate. */
async function extraerParesVivos(page) {
  return page.evaluate(() => {
    function opaco(bg) {
      if (!bg || bg === 'transparent') return null;
      const m = bg.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
      if (!m) return null;
      return (m[4] === undefined || +m[4] === 1) ? bg : (+m[4] === 0 ? null : bg);
    }
    /* Fondo efectivo: compone las capas translúcidas sobre lo que haya detrás. */
    function fondoEfectivo(el) {
      const capas = [];
      let n = el;
      while (n) {
        const bg = getComputedStyle(n).backgroundColor;
        const o = opaco(bg);
        if (o) {
          const m = o.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
          const a = m[4] === undefined ? 1 : +m[4];
          capas.push([+m[1], +m[2], +m[3], a]);
          if (a === 1) break;
        }
        n = n.parentElement;
      }
      let base = [255, 255, 255];
      for (let i = capas.length - 1; i >= 0; i--) { const [r, g, b, a] = capas[i]; base = [r * a + base[0] * (1 - a), g * a + base[1] * (1 - a), b * a + base[2] * (1 - a)]; }
      return `rgb(${Math.round(base[0])}, ${Math.round(base[1])}, ${Math.round(base[2])})`;
    }
    const visible = (el) => {
      if (el.offsetParent === null && el !== document.body && getComputedStyle(el).position !== 'fixed') return false;
      const cs = getComputedStyle(el);
      return cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0;
    };
    const out = [];
    const vistos = new Set();
    const identK = (el) => el.tagName.toLowerCase() + (el.type && el.tagName !== 'BUTTON' ? '[' + el.type + ']' : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : '') + (el.parentElement && el.parentElement.className && typeof el.parentElement.className === 'string' ? ' en .' + el.parentElement.className.trim().split(/\s+/)[0] : '');
    const ident = (el) => identK(el) + (el.id ? '#' + el.id : '');
    document.querySelectorAll('body *').forEach(el => {
      if (!visible(el)) return;
      if (el.closest('script,style,svg')) return;
      const tag = el.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        const cs = getComputedStyle(el), bg = fondoEfectivo(el);
        const t = el.type;
        if (t === 'checkbox' || t === 'radio' || t === 'hidden' || t === 'file') return;
        const fs = parseFloat(cs.fontSize);
        const key = 'v|' + cs.color + '|' + bg + '|' + identK(el);
        if (!vistos.has(key)) { vistos.add(key); out.push({ tipo: 'texto', fg: cs.color, bg, esGrande: false, ident: ident(el) + ' (valor)', dk: identK(el) + ' (valor)' }); }
        if ((tag === 'input' || tag === 'textarea') && el.placeholder) {
          const ph = getComputedStyle(el, '::placeholder').color;
          const k2 = 'p|' + ph + '|' + bg + '|' + identK(el);
          if (!vistos.has(k2)) { vistos.add(k2); out.push({ tipo: 'texto', fg: ph, bg, esGrande: false, ident: ident(el) + '::placeholder', dk: identK(el) + '::placeholder' }); }
        }
        // Borde del campo contra lo que tiene detrás (1.4.11): el borde es lo que lo delimita.
        const bw = parseFloat(cs.borderTopWidth) || 0;
        const padre = el.parentElement ? fondoEfectivo(el.parentElement) : 'rgb(255, 255, 255)';
        const k3 = 'b|' + cs.borderTopColor + '|' + padre + '|' + identK(el);
        if (!vistos.has(k3)) { vistos.add(k3); out.push({ tipo: 'borde-campo', fg: bw > 0 ? cs.borderTopColor : 'rgba(0, 0, 0, 0)', bg: padre, ancho: bw, esGrande: false, ident: ident(el) + ' (borde)', dk: identK(el) + ' (borde)' }); }
        return;
      }
      const tieneTextoPropio = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 0);
      if (!tieneTextoPropio) return;
      const cs = getComputedStyle(el);
      const fg = cs.color, bg = fondoEfectivo(el);
      const fs = parseFloat(cs.fontSize), fw = parseInt(cs.fontWeight, 10) || 400;
      const esGrande = fs >= 24 || (fs >= 18.66 && fw >= 700);
      const key = fg + '|' + bg + '|' + esGrande + '|' + el.className;
      if (vistos.has(key)) return;
      vistos.add(key);
      out.push({ tipo: 'texto', fg, bg, esGrande, ident: ident(el), dk: identK(el), tag });
    });
    return out;
  });
}

/* Anillo de foco con TECLADO real: se pulsa una tecla (el navegador pasa a modalidad de teclado y :focus-visible aplica a
 * cualquier .focus() posterior), se enfoca el control y se lee el contorno computado. El fondo «detrás del anillo» es lo que
 * hay a su lado: se esconde el control y se mira con elementsFromPoint 3 px más allá del borde (o su propio fondo si el
 * contorno va hacia adentro, outline-offset < 0). */
async function medirAnilloTeclado(page, selector, nombre) {
  await page.keyboard.press('Shift');
  return page.evaluate(({ selector, nombre }) => {
    const candidatos = [...document.querySelectorAll(selector)];
    const el = candidatos.find(c => c.offsetParent !== null || getComputedStyle(c).position === 'fixed') || null;
    if (!el) return { nombre, selector, error: 'sin elemento visible' };
    const previo = document.activeElement;
    el.focus({ preventScroll: false });
    const enfocado = document.activeElement === el;
    const focusVisible = el.matches(':focus-visible');
    const cs = getComputedStyle(el);
    const ring = { color: cs.outlineColor, ancho: parseFloat(cs.outlineWidth), estilo: cs.outlineStyle, offset: parseFloat(cs.outlineOffset), sombra: cs.boxShadow };
    const r = el.getBoundingClientRect();
    function opaco(n) {
      while (n) {
        const bg = getComputedStyle(n).backgroundColor;
        const m = bg.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
        if (m && (m[4] === undefined || +m[4] === 1)) return bg;
        n = n.parentElement;
      }
      return 'rgb(255, 255, 255)';
    }
    let bgDetras;
    if (ring.offset < 0) bgDetras = opaco(el);
    else {
      const sep = Math.max(ring.offset, 0) + ring.ancho / 2 + 1;
      const x = Math.max(1, Math.min(window.innerWidth - 1, r.left - sep)), y = Math.max(1, Math.min(window.innerHeight - 1, r.top + r.height / 2));
      const vis = el.style.visibility; el.style.visibility = 'hidden';
      const pila = document.elementsFromPoint(x, y).filter(e => e !== el && !el.contains(e));
      el.style.visibility = vis;
      bgDetras = opaco(pila[0] || el.parentElement);
    }
    const pantalla = { enfocado, focusVisible };
    el.blur(); if (previo && previo.focus && previo !== document.body) previo.focus();
    return { nombre, selector, ...pantalla, ring, bgDetras, ident: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : '') };
  }, { selector, nombre });
}

/* Selectores del CSS que apagan el contorno (`outline:none/0`): cada uno es un anillo perdido salvo que sea el de un contenedor
 * que sólo recibe foco por programa (main). Se informan, no se asumen. */
function buscarContornosApagados() {
  const src = fs.readFileSync(CSS_PATH, 'utf8');
  const out = [];
  const re = /([^{}\n]+)\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(src))) {
    if (/outline\s*:\s*(none|0)\b/.test(m[2]) && !/^main\b/.test(m[1].trim())) out.push(m[1].trim().replace(/\s+/g, ' '));   // main: contenedor que sólo recibe foco por programa (destino del salto)
  }
  return out;
}

/* ============================================================================
   MAIN
   ============================================================================ */
(async () => {
  if (!PASSWORD) { console.error('Falta IPPU_DEMO_PASSWORD (contraseña del técnico de la demo; la del seed).'); process.exit(1); }
  for (const [nombre, url] of [['API', API + '/health'], ['demo', DEMO + '/index.html']]) {
    try { const r = await fetch(url); if (!r.ok) throw new Error('HTTP ' + r.status); }
    catch (e) { console.error(`No responde la ${nombre} en ${url} (${e.message}). Ver demo/verificacion/README.md → «Demo conectada».`); process.exit(1); }
  }
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await instalarFiltroDeEscritura(ctx);
  const page = await ctx.newPage();
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));

  const capturas = [];          // {pantalla, grupo, n}
  const mapa = new Map();       // pares únicos: fg|bg|grande|tipo|ident
  const anillos = [];
  async function cap(pantalla, grupo = 'conectada') {
    const pares = await extraerParesVivos(page);
    capturas.push({ pantalla, grupo, n: pares.length });
    for (const p of pares) {
      const key = [p.tipo, p.fg, p.bg, p.esGrande, p.dk].join('|');
      const e = mapa.get(key) || { ...p, pantallas: new Set(), grupos: new Set() };
      e.pantallas.add(pantalla); e.grupos.add(grupo);
      mapa.set(key, e);
    }
  }
  const ev = (f, arg) => page.evaluate(f, arg);
  const esperar = (ms) => page.waitForTimeout(ms);

  // ---------------------------------------------------------------- LOGIN
  await page.goto(URL_DEMO);
  await page.waitForSelector('#loginScreen', { state: 'attached' });
  await esperar(300);
  await cap('Login');
  anillos.push(await medirAnilloTeclado(page, '#loginUser', 'campo de texto (login)'));
  anillos.push(await medirAnilloTeclado(page, '#loginBtn', 'botón (login)'));
  await page.fill('#loginUser', EMAIL);
  await page.fill('#loginPass', 'clave-incorrecta-para-medir-el-error');
  await page.click('#loginBtn');
  await page.waitForSelector('#loginError:not([hidden])');
  await cap('Login · error de credenciales');
  await ev(() => estadoLogin('Verificando sesión…')); await cap('Login · estado «verificando»'); await ev(() => estadoLogin(''));
  await page.fill('#loginPass', PASSWORD);
  await page.click('#loginBtn');
  await page.waitForSelector('#loginScreen.hidden', { state: 'attached', timeout: 8000 });
  await page.waitForFunction(() => /Mostrando \d+ de/.test(document.getElementById('listaResumen').textContent), null, { timeout: 8000 });

  if (process.env.VERIFICAR_AUTOPRUEBA === '1') {
    // Autoprueba: un POST de escritura SIN ruta enlatada, emitido desde la página con el token real. El filtro debe abortarlo
    // (la API no lo ve) y la corrida terminar en 1 nombrándolo.
    const resultado = await ev(async () => {
      try { await fetch(API_BASE + '/hce', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + Sesion.token() }, body: '{}' }); return 'llegó a la API'; }
      catch (e) { return 'abortado en el navegador (' + e.message + ')'; }
    });
    console.log('AUTOPRUEBA · POST /hce desde la página: ' + resultado);
    await browser.close();
    imprimirIntercepcion();
    if (!intercepcion.abortados.length) { console.error('AUTOPRUEBA FALLIDA: el filtro no registró el POST.'); process.exit(2); }
    console.error(`AUTOPRUEBA OK: escritura bloqueada (${intercepcion.abortados.join(' · ')}); la corrida termina con código 1 a propósito.`);
    process.exit(1);
  }

  // ---------------------------------------------------------------- LISTADO (conectado)
  await esperar(500);
  await cap('Inicio · listado con el aviso «Bienvenido» (toast)');
  await ev(() => listaCargando());                                  await cap('Inicio · listado cargando');
  await ev(() => listaError(new ApiError(500, 'internal_error', [], 'No se pudo cargar el listado (muestra).'))); await cap('Inicio · listado con error');
  await ev(() => { pintarLista([]); });                              await cap('Inicio · listado vacío');
  await ev(() => cargarLista());
  await page.waitForFunction(() => /Mostrando \d+ de/.test(document.getElementById('listaResumen').textContent), null, { timeout: 8000 });
  await page.click('.chip-estado[data-estado="todos"]'); await page.waitForFunction(() => /Mostrando 8 de 8/.test(document.getElementById('listaResumen').textContent), null, { timeout: 8000 });
  await cap('Inicio · listado con inactivos (filtro «Todos»)');
  await page.click('.chip-estado[data-estado="activos"]'); await page.waitForFunction(() => /Mostrando \d+ de/.test(document.getElementById('listaResumen').textContent), null, { timeout: 8000 });

  // ---------------------------------------------------------------- VISTAS EN MODO DEMOSTRACIÓN
  for (const v of ['pendientes', 'analitica', 'grupos', 'inclusion', 'ateneos']) {
    await page.click(`.navitem[data-view="${v}"]`); await esperar(120);
    await cap(`Vista ${v} (modo demostración)`, 'demo');
  }
  await page.click('.userchip'); await esperar(120);
  await cap('Perfil de ejemplo (modo demostración)', 'demo');
  await page.click('.navitem[data-view="inicio"]');

  // ---------------------------------------------------------------- EXPEDIENTE DE LA API: 13 pestañas
  await page.locator('#tbodyNNA tr[data-hce]').first().getByRole('button', { name: /Abrir expediente/ }).click();
  await page.waitForSelector('#expTitulo', { timeout: 8000 });
  await page.waitForFunction(() => !/Cargando/.test(document.getElementById('panelExp').textContent), null, { timeout: 8000 });
  for (const k of await page.$$eval('.exp-tab', (bs) => bs.map((b) => b.dataset.tab))) {
    await page.click('#tabExp-' + k); await esperar(200);
    await page.waitForFunction(() => !/Cargando/.test(document.getElementById('panelExp').textContent), null, { timeout: 8000 });
    await cap(`Expediente · pestaña ${k.toUpperCase()}`);
  }
  // C1 · LOG: la tabla del seed y, con una fila de muestra, un valor largo con «ver completo» abierto (el valor de muestra no se escribe en la API)
  await page.click('#tabExp-log'); await page.waitForSelector('#panelExp .log-table', { timeout: 8000 }); await esperar(150);
  anillos.push(await medirAnilloTeclado(page, '#logModulo', 'lista desplegable (LOG)'));
  await ev(() => { LOG.filas = [{ id: 1, ts: new Date().toISOString(), usuario: { id: 1, nombre: 'Muestra', rol: 'tecnico' }, modulo: 'HCE-00', tipo: 'edicion', campo: 'medicacion', valor_ant: null, valor_nuevo: 'valor largo de muestra '.repeat(12) }, { id: 2, ts: new Date().toISOString(), usuario: null, modulo: 'HCE-LB', tipo: 'firma', campo: null, valor_ant: null, valor_nuevo: null, detalle: 'Firmó la línea base 2026' }]; LOG.total = 2; logRepintar(); });
  await esperar(100);
  anillos.push(await medirAnilloTeclado(page, '.log-ver summary', 'resumen «ver completo» (LOG)'));
  await ev(() => { document.querySelector('.log-ver').open = true; }); await esperar(100);
  await cap('Expediente · pestaña LOG con «ver completo» abierto');
  await ev(() => { LOG.filas = []; LOG.total = 0; LOG.modulo = 'HCE-PAI'; logRepintar(); });
  await esperar(100);
  await cap('Expediente · pestaña LOG sin coincidencias');
  await ev(() => { LOG.modulo = ''; LOG.estado = 'error'; LOG.error = 'No se pudo cargar el registro de cambios (muestra).'; logRepintar(); });
  await esperar(100);
  await cap('Expediente · pestaña LOG con error');
  await ev(() => { LOG.estado = 'listo'; logMostrar(); });
  // Estados compartidos (cargando · error · vacío · error en línea) con los componentes reales
  await page.click('#tabExp-hce00'); await esperar(150);
  await ev(() => { document.getElementById('panelExp').innerHTML = estadoCargandoHtml('Cargando (muestra)…') + estadoErrorHtml('No se pudo cargar (muestra).', 'void(0)', '<button type="button" class="btn btn-ghost btn-mini">Acción extra</button>') + estadoVacioHtml('◌', 'Todavía no hay nada (muestra).', '<button type="button" class="btn btn-primary">Crear</button>') + estadoErrorInlineHtml('Error en una parte de la pantalla (muestra).', 'void(0)'); });
  await cap('Estados compartidos: cargando · error · vacío · error en línea');
  await ev(() => { EXP.avisos = [{ mensaje: 'Aviso no bloqueante de la API (muestra).' }, { mensaje: 'El registro ya estaba firmado. Se muestra tal como está en el servidor.', conflicto: true }]; pintarAvisosExp(); });
  await cap('Avisos de la API y «Cambió en el servidor»');
  await ev(() => { EXP.avisos = []; pintarAvisosExp(); selTabExp('hce00'); });

  // ---------------------------------------------------------------- CI: pendiente (Bruno) con errores · registrado (Martín) y su edición
  async function abrirPorNombre(nombre, tab) {
    await page.click('.navitem[data-view="inicio"]');
    await page.evaluate(async (n) => {
      const r = await fetch(API_BASE + '/hce?nombre=' + encodeURIComponent(n) + '&limit=5', { headers: { Authorization: 'Bearer ' + Sesion.token() } });
      await abrirExpediente((await r.json()).find((h) => h.persona.nombre === n).id);
    }, nombre);
    await page.waitForSelector('#expTitulo', { timeout: 8000 });
    await page.waitForFunction(() => !!EXP.flujo && !!EXP.mods, null, { timeout: 8000 });
    await page.click('#tabExp-' + tab);
    await page.waitForFunction(() => !/Cargando/.test(document.getElementById('panelExp').innerText), null, { timeout: 8000 });
    await esperar(200);
  }
  await abrirPorNombre('Bruno', 'ci');
  await cap('CI · pendiente (formulario)');
  anillos.push(await medirAnilloTeclado(page, '#ci_aut_eval', 'casilla (CI)'));
  await page.click('#btnCiGuardar'); await esperar(150);
  await cap('CI · pendiente con errores de formulario');
  anillos.push(await medirAnilloTeclado(page, '#ciErrores a', 'enlace (resumen de errores)'));
  await abrirPorNombre('Martín', 'ci');
  await cap('CI · registrado');
  await ev(() => ciEditar()); await esperar(150);
  await cap('CI · edición');

  // ---------------------------------------------------------------- DIÁLOGO DE ALTA / EDICIÓN (cuatro pasos) y su confirmación
  await ev(() => openEditar());
  await page.waitForSelector('#modalAlta.open'); await esperar(300);
  const nombreOrig = await page.inputValue('#f_nombre');
  await page.fill('#f_nombre', ''); await page.click('#btnNext'); await esperar(400);
  await cap('Diálogo de alta/edición · paso 1 con resumen de errores');
  anillos.push(await medirAnilloTeclado(page, '#f_nombre', 'campo de texto (diálogo)'));
  await page.fill('#f_nombre', nombreOrig);
  for (let paso = 2; paso <= 4; paso++) { await page.click('#btnNext'); await esperar(400); await cap(`Diálogo de alta/edición · paso ${paso}`); }
  await ev(() => closeAlta());                                         // sin cambios: cierra sin preguntar
  await ev(() => openAlta()); await page.waitForSelector('#modalAlta.open'); await esperar(200);
  await page.fill('#f_nombre', 'Dato tipeado');
  await page.keyboard.press('Escape'); await page.waitForSelector('.confirmar-descarte', { timeout: 3000 });
  await cap('Diálogo de alta · confirmar descarte');
  anillos.push(await medirAnilloTeclado(page, '#btnCdDescartar', 'botón destructivo (confirmación)'));
  await page.click('#btnCdDescartar'); await esperar(150);

  // ---------------------------------------------------------------- IDEA y PROTOCOLOS
  await abrirPorNombre('Joaquín', 'lb');
  await cap('LB · borrador con NS');
  anillos.push(await medirAnilloTeclado(page, '#panelExp .opcion', 'botón de puntaje (LB)'));
  anillos.push(await medirAnilloTeclado(page, '#panelExp .inter-btn', 'botón de puntaje intermedio (LB)'));
  anillos.push(await medirAnilloTeclado(page, '#lb_sintesis', 'área de texto (LB)'));
  anillos.push(await medirAnilloTeclado(page, '#panelExp .dobs summary', 'resumen desplegable (LB)'));
  anillos.push(await medirAnilloTeclado(page, '#evResumen .btn-ghost', 'botón de la barra de acciones (pegada abajo)'));
  await ev(() => evPedirFirma()); await esperar(100);
  await cap('LB · confirmación de firma');
  await page.click('#btnEvConfirmar'); await page.waitForSelector('#evErrores:not([hidden])', { timeout: 8000 }); await esperar(150);
  await cap('LB · 422 por dimensión y por campo');
  await abrirPorNombre('Martín', 'lb');
  await cap('LB · firmado con banda y addendas');
  await page.click('#tabExp-pb'); await page.waitForSelector('#evResultado', { timeout: 8000 }); await esperar(150);
  await cap('PB · firmado con Δ');
  await abrirPorNombre('Sofía', 'pa');
  await ev(() => document.querySelectorAll('.prot-obs').forEach((w) => w.classList.add('show')));
  await cap('PA · borrador con observaciones');
  anillos.push(await medirAnilloTeclado(page, '#panelExp .likert-btn', 'botón de puntaje (PA)'));
  anillos.push(await medirAnilloTeclado(page, '.prot-obs.show textarea', 'área de texto sobre fondo ámbar (PA)'));
  await ev(() => evPedirFirma()); await page.click('#btnEvConfirmar'); await page.waitForSelector('#evErrores:not([hidden])', { timeout: 8000 }); await esperar(150);
  await cap('PA · errores de firma');

  // ---------------------------------------------------------------- IC, documento impreso, recibí
  await abrirPorNombre('Valentina', 'ic');
  await cap('IC · sin crear (editor)');
  await ev(() => icPedirFirma()); await esperar(100);
  await cap('IC · confirmación de firma');
  await ev(() => icCancelarFirma());
  await ev(() => evMostrarErrores({ k: 'ic' }, new ApiError(422, 'validation_error', [{ campo: 'fecha', mensaje: 'Ingresá la fecha del informe (muestra).' }, { campo: 'firmantes', mensaje: 'Elegí dos profesionales distintos (muestra).' }], ''), 'No se pudo firmar:'));
  await cap('IC · errores de firma');
  await ev(() => { IC.avisos = [{ mensaje: 'El informe ya está firmado. Se muestra el informe tal como está en el servidor.', conflicto: true }, { mensaje: 'Aviso no bloqueante (muestra).' }]; icPintarAvisos(); });
  await cap('IC · avisos y «Cambió en el servidor»');
  await abrirPorNombre('Martín', 'ic');
  await cap('IC · firmado (tabla, radares, firmas, recibí)');
  // Recibí: Martín ya lo tiene registrado; se abre el componente real con el recibí vacío (sin llamar a la API).
  await ev(() => { window.__recibi = IC.rec.recibi; IC.rec.recibi = null; openRecibiModal(); });
  await page.waitForSelector('#modalFlujo.open'); await esperar(250);
  await cap('Diálogo del recibí');
  anillos.push(await medirAnilloTeclado(page, '#mfFirmante', 'campo de texto (recibí)'));
  await page.fill('#mfFirmante', 'Dato tipeado'); await page.keyboard.press('Escape'); await page.waitForSelector('#modalFlujo .confirmar-descarte', { timeout: 3000 });
  await cap('Diálogo del recibí · confirmar descarte');
  await page.click('#btnCdDescartar'); await esperar(150);
  await ev(() => { IC.rec.recibi = window.__recibi; });
  await page.click('#btnIcImpreso'); await page.waitForSelector('.print-wrap', { timeout: 8000 }); await esperar(300);
  await cap('IC · documento impreso (vista en pantalla)');
  // C2 · SEV: lectura de Martín (seed), referencia abierta, formulario con su descriptor, errores sin enviar, descarte y estado vacío.
  await abrirPorNombre('Martín', 'sev');
  await page.waitForSelector('#sevLectura', { timeout: 8000 });
  await cap('SEV · lectura (Martín)');
  anillos.push(await medirAnilloTeclado(page, '#sevRef summary', 'resumen «Referencia DSM-5-TR» (SEV)'));
  await ev(() => { document.getElementById('sevRef').open = true; }); await esperar(100);
  await cap('SEV · lectura con la referencia DSM-5-TR abierta');
  await page.click('#btnSevEditar'); await page.waitForSelector('#modalFlujo.open #sev_cs'); await esperar(250);
  await cap('SEV · formulario abierto (editar)');
  anillos.push(await medirAnilloTeclado(page, '#sev_cs', 'lista desplegable (SEV)'));
  anillos.push(await medirAnilloTeclado(page, '#sev_just', 'área de texto (SEV)'));
  await page.selectOption('#sev_crr', ''); await page.fill('#sev_just', '');          // faltan: se marcan y no se envía nada
  await page.click('#btnSevGuardar'); await page.waitForSelector('#sevErrores:not([hidden])', { timeout: 3000 }); await esperar(150);
  await cap('SEV · formulario con campos faltantes');
  await page.keyboard.press('Escape'); await page.waitForSelector('#modalFlujo .confirmar-descarte', { timeout: 3000 });
  await cap('SEV · formulario · confirmar descarte');
  await page.click('#btnCdDescartar'); await esperar(150);
  await ev(() => { window.__sev = SEV.rec; SEV.rec = null; SEV.estado = 'vacio'; sevRepintar(); }); await esperar(100);
  await cap('SEV · estado vacío');
  await page.click('#btnSevNuevo'); await page.waitForSelector('#modalFlujo.open #sev_cs'); await esperar(250);
  await page.selectOption('#sev_cs', '3'); await esperar(100);
  await cap('SEV · formulario de alta con el descriptor del grado elegido');
  await page.keyboard.press('Escape'); await page.waitForSelector('#modalFlujo .confirmar-descarte', { timeout: 3000 });
  await page.click('#btnCdDescartar'); await esperar(150);
  await ev(() => { SEV.rec = window.__sev; SEV.estado = 'listo'; sevRepintar(); });
  // C3 · ORG: lectura de Martín (INAU + AYEX vigente + envíos), la alerta AYEX de Sofía, los diálogos (sin guardar nada), Joaquín sin envíos y el error.
  await abrirPorNombre('Martín', 'org');
  await page.waitForSelector('#orgInauLectura', { timeout: 8000 });
  await cap('ORG · lectura (Martín: INAU, BPS y sus registros)');
  anillos.push(await medirAnilloTeclado(page, '#btnOrgInauEditar', 'botón «Editar» (ORG)'));
  anillos.push(await medirAnilloTeclado(page, '#btnOrgBpsAgregar', 'botón «Agregar gestión» (ORG)'));
  await abrirPorNombre('Sofía', 'org');
  await page.waitForSelector('#orgAlerta', { timeout: 8000 });
  await cap('ORG · alerta AYEX visible (Sofía)');
  await page.click('#btnOrgBpsEditar'); await page.waitForSelector('#modalFlujo.open #orgb_prestacion'); await esperar(250);
  await cap('ORG · vínculo con BPS · formulario abierto (con la alerta detrás)');
  anillos.push(await medirAnilloTeclado(page, '#orgb_prestacion', 'lista desplegable (ORG)'));
  anillos.push(await medirAnilloTeclado(page, '#orgb_obs', 'área de texto (ORG)'));
  await page.click('#btnOrgGuardar'); await page.waitForSelector('#orgErrores:not([hidden])', { timeout: 3000 }); await esperar(150);
  await cap('ORG · vínculo con BPS · sin cambios para guardar');
  await page.fill('#orgb_tramite', 'Dato tipeado'); await page.keyboard.press('Escape'); await page.waitForSelector('#modalFlujo .confirmar-descarte', { timeout: 3000 });
  await cap('ORG · vínculo con BPS · confirmar descarte');
  await page.click('#btnCdDescartar'); await esperar(150);
  await page.click('#btnOrgBpsAgregar'); await page.waitForSelector('#modalFlujo.open #orgr_detalle'); await esperar(250);
  await cap('ORG · registro de gestión · formulario abierto');
  anillos.push(await medirAnilloTeclado(page, '#orgr_detalle', 'área de texto (registro ORG)'));
  await page.fill('#orgr_fecha', ''); await page.click('#btnOrgGuardar'); await page.waitForSelector('#orgErrores:not([hidden])', { timeout: 3000 }); await esperar(150);
  await cap('ORG · registro de gestión · campos faltantes');
  await page.fill('#orgr_detalle', 'Dato tipeado'); await page.keyboard.press('Escape'); await page.waitForSelector('#modalFlujo .confirmar-descarte', { timeout: 3000 });
  await page.click('#btnCdDescartar'); await esperar(150);
  await abrirPorNombre('Joaquín', 'org');
  await page.waitForSelector('#orgInauLectura', { timeout: 8000 });
  await cap('ORG · INAU sin envíos y BPS sin registrar (Joaquín)');
  await ev(() => { ORG.estado = 'error'; ORG.error = 'No se pudieron cargar los organismos (muestra).'; orgRepintar(); }); await esperar(100);
  await cap('ORG · error con «Reintentar»');
  await ev(() => orgCargar(false)); await page.waitForSelector('#orgInauLectura', { timeout: 8000 });
  await abrirPorNombre('Martín', 'vf');
  await cap('VF · estado vacío');
  await page.click('#btnVfNuevo'); await page.waitForSelector('#vf_pct'); await esperar(100);
  await cap('VF · formulario de alta');
  anillos.push(await medirAnilloTeclado(page, '#vf_pct', 'campo de texto (VF)'));
  anillos.push(await medirAnilloTeclado(page, '#vf_estado', 'lista desplegable (VF)'));
  for (const [nombre, rango] of [['Sin discapacidad', '0 % a 4 %'], ['Leve', '5 % a 24 %'], ['Moderado', '25 % a 49 %'], ['Severo', '50 % a 95 %'], ['Muy severo', '96 % a 100 %'], [null, null]]) {
    await ev(([n, r]) => {
      VF.rec = { hce_id: 0, estado: 'Valorado', fecha: '2019-06-01', organismo: 'Equipo', pct: '58.00', vigencia: '2020-01-31', rnpcd: null,
        dominios: { comunicacion: 'Apoyo permanente', autocuidado: 'Apoyo ocasional', movilidad: 'Autónomo', aprendizaje: 'Apoyo frecuente' },
        capacidades: 'Muestra.', barreras: 'Muestra.', apoyos: 'Muestra.', obs: null, sintesis_funcional: 'Muestra.',
        categoria: n ? { id: 1, categoria: n, rango: r, implicancia: 'Implicancia de muestra.' } : null, categoria_etiqueta: n || 'No corresponde',
        alerta_vigencia: { nivel: 'vencida', dias: -100, mensaje: 'La valoración venció (muestra).' } };
      VF.estado = 'listo'; VF.nuevo = false; VF.campos = null; vfRepintar();
    }, [nombre, rango]);
    await cap(`VF · valoración con categoría ${nombre || 'sin categoría'}`);
  }
  await ev(() => vfAbrirReporte()); await esperar(700);
  await cap('VF · reporte impreso (con la valoración de muestra)');
  await ev(() => vfReiniciar());

  // ---------------------------------------------------------------- EXPEDIENTE DE EJEMPLO (modo demostración)
  await page.click('.navitem[data-view="inicio"]');
  await ev(() => abrirExpedienteDemo(102)); await esperar(150);
  await cap('Expediente de ejemplo (modo demostración)', 'demo');

  // ---------------------------------------------------------------- ENLACE DE SALTO + ANILLOS CON TECLADO (cromo de la app)
  await page.click('.navitem[data-view="inicio"]');
  await ev(() => { document.body.setAttribute('tabindex', '-1'); document.body.focus(); document.body.removeAttribute('tabindex'); });
  await page.keyboard.press('Tab'); await esperar(150);
  await cap('Enlace «Saltar al contenido» (enfocado)');
  anillos.push(await medirAnilloTeclado(page, 'a.skip-link', 'enlace (salto al contenido, sobre la barra oscura)'));
  anillos.push(await medirAnilloTeclado(page, '.navitem[data-view="analitica"]', 'ítem de la barra lateral'));
  anillos.push(await medirAnilloTeclado(page, '.userchip', 'perfil (barra superior)'));
  anillos.push(await medirAnilloTeclado(page, '.btn-exit', 'botón «Salir» (barra superior)'));
  anillos.push(await medirAnilloTeclado(page, '#searchNNA', 'campo de búsqueda'));
  anillos.push(await medirAnilloTeclado(page, '#filtroGrupo', 'lista desplegable (filtro de grupo)'));
  anillos.push(await medirAnilloTeclado(page, '.chip-estado', 'botón de filtro (chip)'));
  anillos.push(await medirAnilloTeclado(page, '#btnNuevoNNA', 'botón primario'));
  anillos.push(await medirAnilloTeclado(page, '#tbodyNNA .nna-abrir', 'botón del nombre (listado)'));
  await abrirPorNombre('Martín', 'lb');
  anillos.push(await medirAnilloTeclado(page, '.exp-tab[aria-selected="true"]', 'pestaña'));
  anillos.push(await medirAnilloTeclado(page, '#expHead .banda-editar', 'botón de la banda del paciente'));
  anillos.push(await medirAnilloTeclado(page, '#btnAyudaFlujo', 'botón de ayuda del ciclo anual («?»)'));
  anillos.push(await medirAnilloTeclado(page, '#ev_add_texto', 'área de texto (addenda)'));

  await browser.close();
  imprimirIntercepcion();

  // ---------------------------------------------------------------- RESULTADOS
  const filas = [...mapa.values()].map(p => {
    let r, c;
    if (p.tipo === 'borde-campo') {
      if (!(p.ancho > 0)) return { ...p, ratio: 1, criterio: '3:1 (1.4.11, borde de campo)', pasa: false, sinBorde: true };
      r = ratioConAlpha(p.fg, p.bg); if (r === null) return null;
      c = criterioYVeredicto(r, { esNoTexto: true, etiqueta: 'borde de campo' });
    } else {
      r = ratioConAlpha(p.fg, p.bg); if (r === null) return null;
      c = criterioYVeredicto(r, { esGrande: p.esGrande });
    }
    return { ...p, ratio: r, ...c };
  }).filter(Boolean).sort((a, b) => a.ratio - b.ratio);
  const enConectada = (f) => f.grupos.has('conectada');
  const fallan = filas.filter(f => !f.pasa);
  const fallanConectadas = fallan.filter(enConectada);
  const fallanSoloDemo = fallan.filter(f => !enConectada(f));

  console.log('=== Cobertura: pantallas y diálogos recorridos ===\n');
  const porGrupo = { conectada: [], demo: [] };
  capturas.forEach(c => porGrupo[c.grupo].push(c.pantalla));
  console.log(`Conectadas (${porGrupo.conectada.length}):`); porGrupo.conectada.forEach(p => console.log('  · ' + p));
  console.log(`\nModo demostración (${porGrupo.demo.length}):`); porGrupo.demo.forEach(p => console.log('  · ' + p));

  console.log(`\n=== Pares y bordes distintos medidos: ${filas.length} ===`);
  const imprimir = (lista) => lista.forEach(f => {
    console.log(`  ${f.ratio.toFixed(2)}:1  FALLA (${f.criterio})  ${aHex(f.fg)} sobre ${aHex(f.bg)}  <${f.ident}>  [${[...f.pantallas].slice(0, 2).join(' | ')}${f.pantallas.size > 2 ? ' …' : ''}]`);
  });
  console.log(`\n--- Fallan en pantallas CONECTADAS, diálogos o cromo: ${fallanConectadas.length} ---`); imprimir(fallanConectadas);
  console.log(`\n--- Fallan SOLO en vistas de modo demostración: ${fallanSoloDemo.length} ---`); imprimir(fallanSoloDemo);

  console.log('\n=== Anillos de foco (teclado real; fondo = lo que queda detrás del anillo) ===\n');
  const filasAnillo = anillos.map(a => {
    if (a.error) return { ...a, pasa: false };
    const noVisible = !a.focusVisible;
    const color = a.ring.color;
    const hayAnillo = a.ring.estilo !== 'none' && a.ring.ancho > 0;
    let r = null, pasa = false;
    if (hayAnillo && !noVisible) { r = ratioConAlpha(color, a.bgDetras); pasa = r !== null && r >= 3; }
    return { ...a, ratio: r, pasa, hayAnillo, noVisible };
  });
  filasAnillo.forEach(a => {
    if (a.error) { console.log(`  ✗ ${a.nombre}: ${a.error} (${a.selector})`); return; }
    console.log(`  ${a.pasa ? 'PASA ' : 'FALLA'} ${a.nombre}  <${a.ident}>  anillo=${aHex(a.ring.color)} ${a.ring.ancho}px ${a.ring.estilo} (separación ${a.ring.offset}px) sobre ${aHex(a.bgDetras)}  → ${a.ratio === null ? 'sin anillo / sin :focus-visible' : a.ratio.toFixed(2) + ':1 (mínimo 3:1)'}${a.noVisible ? '  [no coincidió :focus-visible]' : ''}`);
  });
  const apagados = buscarContornosApagados();
  console.log(`\nSelectores del CSS con \`outline:none/0\`: ${apagados.length}${apagados.length ? ' → ' + apagados.join(' · ') : ''}`);

  const anilloMal = filasAnillo.filter(a => a.error || !a.pasa);
  console.log(`\nErrores de JavaScript en la página: ${errores.length}${errores.length ? ' → ' + errores.join(' | ') : ''}`);
  console.log(`\nRESUMEN: pares/bordes que fallan en conectadas = ${fallanConectadas.length} · solo demo = ${fallanSoloDemo.length} · anillos que fallan = ${anilloMal.length} de ${filasAnillo.length} · contornos apagados = ${apagados.length}`);

  if (process.argv.includes('--tabla')) {
    const fila = (f) => `| \`${f.ident}\` | \`${aHex(f.fg)}\` | \`${aHex(f.bg)}\` | ${f.criterio} |`;
    console.log('\n| Elemento | Primer plano | Fondo | Criterio |\n|---|---|---|---|');
    fallan.forEach(f => console.log(fila(f)));
  }

  const salida = { cobertura: porGrupo, pares: filas.map(f => ({ ...f, pantallas: [...f.pantallas], grupos: [...f.grupos] })), anillos: filasAnillo, contornosApagados: apagados, errores };
  const jsonIdx = process.argv.indexOf('--json');
  if (jsonIdx !== -1 && process.argv[jsonIdx + 1]) {
    fs.writeFileSync(process.argv[jsonIdx + 1], JSON.stringify(salida, null, 2), 'utf8');
    console.log(`\nJSON crudo -> ${process.argv[jsonIdx + 1]}`);
  }
  if (intercepcion.abortados.length) console.error(`\nESCRITURA BLOQUEADA: la página intentó ${intercepcion.abortados.join(' · ')} (no salió del navegador). La medición no es válida.`);
  process.exit(fallanConectadas.length || anilloMal.length || apagados.length || intercepcion.abortados.length ? 1 : 0);
})().catch((e) => {
  console.error('ERROR del script:', e);
  if (intercepcion.abortados.length) { console.error(`ESCRITURA BLOQUEADA: ${intercepcion.abortados.join(' · ')}`); process.exit(1); }
  process.exit(2);
});
