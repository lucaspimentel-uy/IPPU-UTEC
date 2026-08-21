/* Mide contraste WCAG sobre la demo L1 HCE+IDEA (IPPU x UTEC-LIDIA), por script — no a mano.
 * Reemplaza el método de docs/guias/notas-accesibilidad-ui.md §2.6 (fórmula de luminancia
 * relativa calculada a mano, "no verificado con herramienta").
 *
 * Dos fuentes, las dos con file:line:
 *   (1) ESTÁTICA — colores declarados en demo/css/estilos.css: variables custom (--x:#hex)
 *       primero, después literales (hex/rgb/rgba) en cualquier declaración, clasificados por
 *       rol según la propiedad CSS (background/texto/borde/foco).
 *   (2) VIVA — pares primer-plano/fondo que REALMENTE aparecen en el DOM renderizado: se abre
 *       la demo con Playwright, se recorren las mismas vistas que fingerprint.js
 *       (implementacion/L1-hce-idea/demo/verificacion/), se lee getComputedStyle() de cada
 *       elemento con texto visible, y de los 10 selectores que reemplazan el outline nativo
 *       por box-shadow (mismo hallazgo que la sesión de accesibilidad, §2.6) se dispara :focus
 *       y se lee el anillo real.
 *
 * Requiere Playwright. Reusa el install existente de demo/verificacion/ (no se duplica una
 * segunda instalación sólo para este script) — si no está, `cd
 * implementacion/L1-hce-idea/demo/verificacion && npm install playwright --no-save` (ver su
 * README.md).
 *
 * Uso:  node herramientas/verificar_contraste_ui.js            (tabla completa)
 *       node herramientas/verificar_contraste_ui.js --json out.json   (además, JSON crudo)
 */
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..');
const CSS_PATH = path.join(REPO, 'implementacion/L1-hce-idea/demo/css/estilos.css');
const HTML_PATH = path.join(REPO, 'implementacion/L1-hce-idea/demo/index.html');
const PLAYWRIGHT_DIR = path.join(REPO, 'implementacion/L1-hce-idea/demo/verificacion/node_modules');

let chromium;
try {
  chromium = require(path.join(PLAYWRIGHT_DIR, 'playwright')).chromium;
} catch {
  console.error('No se encontró Playwright en demo/verificacion/node_modules.');
  console.error('Instalar: cd implementacion/L1-hce-idea/demo/verificacion && npm install playwright --no-save');
  process.exit(1);
}

/* ============================================================================
   PARTE 1 — EXTRACCIÓN ESTÁTICA (colores declarados en el CSS, con file:line)
   ============================================================================ */

function extraerColoresCSS() {
  const src = fs.readFileSync(CSS_PATH, 'utf8');
  const lineas = src.split('\n');
  const colorRe = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]+\)/g;

  const variables = [];   // --nombre: valor
  const literales = [];   // propiedad: valor (con color literal, no var())

  let dentroRoot = false;
  lineas.forEach((linea, i) => {
    const n = i + 1;
    if (/:root\s*\{/.test(linea)) dentroRoot = true;
    if (dentroRoot && /^\s*\}/.test(linea)) dentroRoot = false;

    const varMatch = linea.match(/^\s*(--[\w-]+)\s*:\s*([^;]+);/);
    if (dentroRoot && varMatch) {
      const val = varMatch[2].trim();
      const colores = val.match(colorRe);
      if (colores) variables.push({ nombre: varMatch[1], valor: val, linea: n, archivo: 'css/estilos.css' });
      return;
    }

    // Literal: declaración propiedad:valor que NO sea la definición de una variable
    // y cuyo valor contenga un color directo (no var(--x)).
    const propMatch = linea.match(/([\w-]+)\s*:\s*([^;]+);/g);
    if (propMatch) {
      propMatch.forEach(decl => {
        const m = decl.match(/([\w-]+)\s*:\s*([^;]+);/);
        if (!m) return;
        const [, prop, val] = m;
        if (prop.startsWith('--')) return; // ya cubierto arriba
        const colores = val.match(colorRe);
        if (colores) literales.push({ propiedad: prop.trim(), valor: val.trim(), linea: n, archivo: 'css/estilos.css' });
      });
    }
  });

  return { variables, literales };
}

function rolPorPropiedad(prop) {
  if (/^background/.test(prop)) return 'fondo';
  if (prop === 'color') return 'texto';
  if (/^(border|outline)/.test(prop)) return 'borde';
  if (prop === 'box-shadow') return 'foco/estado';
  return 'otro';
}

/* ============================================================================
   PARTE 2 — MATEMÁTICA WCAG (luminancia relativa, contraste)
   ============================================================================ */

function parseColor(str) {
  str = str.trim();
  let m = str.match(/^#([0-9a-fA-F]{3})$/);
  if (m) {
    const [r, g, b] = m[1].split('').map(c => parseInt(c + c, 16));
    return { r, g, b, a: 1 };
  }
  m = str.match(/^#([0-9a-fA-F]{6})$/);
  if (m) {
    const hex = m[1];
    return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16), a: 1 };
  }
  m = str.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)$/);
  if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
  return null;
}

/* Compone `fg` (puede tener alpha<1, p.ej. un anillo de foco) sobre `bg` (opaco). */
function componer(fg, bg) {
  const a = fg.a;
  return {
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
    a: 1,
  };
}

function luminanciaRelativa({ r, g, b }) {
  const canal = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

function ratio(colorA, colorB) {
  const la = luminanciaRelativa(colorA), lb = luminanciaRelativa(colorB);
  const [claro, oscuro] = la >= lb ? [la, lb] : [lb, la];
  return (claro + 0.05) / (oscuro + 0.05);
}

/* Dado un color de primer plano (posiblemente con alpha) y un fondo opaco, devuelve el
 * ratio de contraste ya compuesto. */
function ratioConAlpha(fgStr, bgStr) {
  const fg = parseColor(fgStr), bg = parseColor(bgStr);
  if (!fg || !bg) return null;
  const fgOpaco = fg.a < 1 ? componer(fg, bg) : fg;
  return ratio(fgOpaco, bg);
}

function criterioYVeredicto(r, { esGrande = false, esNoTexto = false } = {}) {
  if (esNoTexto) return { criterio: '3:1 (1.4.11/2.4.11, no-texto)', pasa: r >= 3 };
  const umbral = esGrande ? 3 : 4.5;
  return { criterio: `${umbral}:1 (1.4.3, texto ${esGrande ? 'grande' : 'normal'})`, pasa: r >= umbral };
}

/* ============================================================================
   PARTE 3 — EXTRACCIÓN VIVA (qué pares realmente se renderizan)
   ============================================================================ */

async function extraerParesVivos(page) {
  // Pares texto/fondo de todo elemento con contenido de texto directo y visible.
  const pares = await page.evaluate(() => {
    function fondoEfectivo(el) {
      let n = el;
      while (n) {
        const cs = getComputedStyle(n);
        const bg = cs.backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
          const m = bg.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
          if (m && (m[4] === undefined || +m[4] === 1)) return bg;
        }
        n = n.parentElement;
      }
      return 'rgb(255, 255, 255)'; // canvas por defecto
    }
    const out = [];
    const vistos = new Set();
    document.querySelectorAll('body *').forEach(el => {
      if (el.offsetParent === null && el !== document.body) return; // no visible
      const tieneTextoPropio = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 0);
      if (!tieneTextoPropio) return;
      const cs = getComputedStyle(el);
      const fg = cs.color;
      const bg = fondoEfectivo(el);
      const fs = parseFloat(cs.fontSize);
      const fw = parseInt(cs.fontWeight, 10) || 400;
      const esGrande = fs >= 24 || (fs >= 18.66 && fw >= 700);
      const key = fg + '|' + bg + '|' + esGrande + '|' + el.className;
      if (vistos.has(key)) return;
      vistos.add(key);
      out.push({ fg, bg, esGrande, clase: (el.className || '').toString().slice(0, 60), tag: el.tagName.toLowerCase() });
    });
    return out;
  });
  return pares;
}

/* Los N selectores que reemplazan outline nativo por box-shadow: se extraen del CSS mismo
 * (no se hardcodea una lista de líneas — si el patrón se mueve, esto lo vuelve a encontrar). */
function extraerSelectoresDeAnilloFoco() {
  const src = fs.readFileSync(CSS_PATH, 'utf8');
  const bloques = src.split(/(?=[.#:\w][^{}]*\{)/); // approx: no es un parser CSS real
  const encontrados = [];
  const re = /([^{}\n]+)\{([^}]*outline\s*:\s*none[^}]*box-shadow\s*:[^}]*|[^}]*box-shadow\s*:[^}]*outline\s*:\s*none[^}]*)\}/g;
  let m;
  while ((m = re.exec(src))) {
    const selector = m[1].trim();
    const cuerpo = m[2];
    const bs = cuerpo.match(/box-shadow\s*:\s*([^;]+);?/);
    const lineaHastaAqui = src.slice(0, m.index).split('\n').length;
    if (bs) encontrados.push({ selector, boxShadow: bs[1].trim(), linea: lineaHastaAqui });
  }
  return encontrados;
}

/* Cada selector vive en una vista/estado distinto (login, listado, formulario condicional).
 * Declarado en un solo lugar, igual que VISTAS en fingerprint.js — nada de "if selector===X"
 * suelto en el loop de abajo. `prep` corre ANTES de intentar enfocar; si no se sabe cómo
 * llegar a un selector en esta corrida, se deja sin `prep` y el resultado lo dice honestamente
 * ("sin elemento en el DOM") en vez de simular un número que no se verificó. */
const PREP_ANILLO = {
  '.login-field input': null, // se mide aparte, ANTES de loguearse (ver main)
  'select': async (page) => { await page.evaluate(() => go('ateneos')); await page.waitForTimeout(80); },
  '.field input': async (page) => { await page.evaluate(() => go('ateneos')); await page.waitForTimeout(80); },
  '.search-wrap input': async (page) => { await page.evaluate(() => go('inicio')); await page.waitForTimeout(80); },
  '.prot-obs textarea': async (page) => {
    // 102 (Martín) tiene el PA firmado => de sólo lectura => sus textarea quedan
    // `disabled` (evaluaciones.js:204) y no aceptan foco. 101 (Sofía) tiene el PA en
    // borrador (arquetipo §11) — ahí el campo es editable de verdad.
    await page.evaluate(() => { cargarProt(101, 'pa'); go('prot'); });
    await page.waitForTimeout(80);
    // .prot-obs sólo se muestra si el ítem vale 1/5 (evaluaciones.js:112-119) — se fuerza la
    // clase para medir el anillo del campo, no para afirmar que el seed tiene ese puntaje.
    await page.evaluate(() => { const w = document.querySelector('.prot-obs'); if (w) w.classList.add('show'); });
  },
};
/* .btn:focus-visible y .opcion:focus-visible NO se resuelven acá: `:focus-visible` en
   Chromium sólo se activa con modalidad de teclado real, y un `.focus()` programático
   (aunque venga de un Tab de Playwright) no lo garantiza de forma confiable en headless.
   No se fuerza — se reporta sin medir en vez de simular un número no verificado. Igual
   comparten el mismo `--focus` que sí se midió en 3 selectores independientes (login,
   búsqueda, select/field) — ver §2.6 del doc. */
/* Selector real a interrogar una vez preparada la vista: por defecto es el selBase, salvo
 * cuando (como .prot-obs) sólo un elemento puntual queda visible/habilitado. */
const SEL_OVERRIDE = {
  '.prot-obs textarea': '.prot-obs.show textarea',
};

async function medirAnillosDeFoco(page, selectores) {
  const out = [];
  for (const { selector, boxShadow, linea } of selectores) {
    const primerSel = selector.split(',')[0].trim();
    // querySelector no puede matchear ":focus"/":focus-visible" sin foco real: se saca el
    // pseudo-selector para ubicar el elemento base, se lo enfoca, y RECIÉN ahí el pseudo-
    // selector empieza a aplicar y getComputedStyle lo refleja.
    const selBase = primerSel.replace(/:focus(-visible)?\s*$/, '').trim();
    if (selBase in PREP_ANILLO) {
      if (PREP_ANILLO[selBase] === null) { out.push({ selector: primerSel, boxShadowDeclarado: boxShadow, linea, resultado: null, nota: 'medido aparte (login)' }); continue; }
      await PREP_ANILLO[selBase](page);
    }
    const selConsulta = SEL_OVERRIDE[selBase] || selBase;
    const res = await page.evaluate((sel) => {
      // El mismo selector puede matchear varios elementos repetidos en distintas vistas
      // (p. ej. hay un <select> por cada formulario). go() no los saca del DOM, sólo los
      // esconde — así que se toma el primero VISIBLE, no el primero en orden de documento.
      const candidatos = [...document.querySelectorAll(sel)];
      const el = candidatos.find(c => c.offsetParent !== null) || null;
      if (!el) return null;
      const activoAntes = document.activeElement;
      el.focus();
      const enfocado = document.activeElement === el;
      const cs = getComputedStyle(el);
      const bg = (() => {
        let n = el;
        while (n) {
          const c = getComputedStyle(n).backgroundColor;
          if (c && c !== 'rgba(0, 0, 0, 0)') return c;
          n = n.parentElement;
        }
        return 'rgb(255,255,255)';
      })();
      const boxShadowComputado = cs.boxShadow;
      el.blur();
      if (activoAntes && activoAntes.focus) activoAntes.focus();
      return { boxShadowComputado, bg, enfocado };
    }, selConsulta);
    out.push({ selector: primerSel, boxShadowDeclarado: boxShadow, linea, resultado: res });
  }
  return out;
}

/* ============================================================================
   MAIN
   ============================================================================ */

(async () => {
  console.log('=== 1. Colores declarados en estilos.css (estático) ===\n');
  const { variables, literales } = extraerColoresCSS();
  console.log(`Variables custom con color: ${variables.length}`);
  console.log(`Declaraciones literales con color: ${literales.length}\n`);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file:///' + HTML_PATH.replace(/\\/g, '/'));
  await page.waitForSelector('#loginScreen', { state: 'attached' });

  // El anillo de .login-field input SOLO existe con la pantalla de login activa —
  // se mide acá, antes de loguearse, y no en el loop general de la Parte 3.
  const anilloLogin = await page.evaluate(() => {
    const el = document.querySelector('.login-field input');
    if (!el) return null;
    el.focus();
    const cs = getComputedStyle(el);
    const bg = (() => {
      let n = el;
      while (n) { const c = getComputedStyle(n).backgroundColor; if (c && c !== 'rgba(0, 0, 0, 0)') return c; n = n.parentElement; }
      return 'rgb(255,255,255)';
    })();
    const boxShadowComputado = cs.boxShadow;
    el.blur();
    return { boxShadowComputado, bg };
  });

  await page.click('#loginForm button[type="submit"]');
  await page.waitForSelector('#loginScreen.hidden', { state: 'attached' });

  const VISTAS = ['inicio', 'pendientes', 'analitica', 'grupos', 'inclusion', 'ateneos'];
  let todosPares = [];
  for (const v of VISTAS) {
    await page.click(`.navitem[data-view="${v}"]`);
    await page.waitForTimeout(80);
    todosPares = todosPares.concat(await extraerParesVivos(page));
  }
  await page.click('.userchip');
  await page.waitForTimeout(80);
  todosPares = todosPares.concat(await extraerParesVivos(page));
  // Un expediente, para cubrir formularios/badges que no están en las vistas de listado.
  await page.evaluate(() => abrirExpediente(102));
  await page.waitForTimeout(120);
  todosPares = todosPares.concat(await extraerParesVivos(page));
  await page.evaluate(() => cargarIDEA(101));
  await page.waitForTimeout(80);
  todosPares = todosPares.concat(await extraerParesVivos(page));

  // Deduplicar por (fg,bg,esGrande)
  const mapaPares = new Map();
  for (const p of todosPares) {
    const key = p.fg + '|' + p.bg + '|' + p.esGrande;
    if (!mapaPares.has(key)) mapaPares.set(key, p);
  }
  const paresUnicos = [...mapaPares.values()];

  console.log(`=== 2. Pares texto/fondo distintos renderizados: ${paresUnicos.length} ===\n`);
  const filas = paresUnicos.map(p => {
    const r = ratioConAlpha(p.fg, p.bg);
    if (r === null) return null;
    const { criterio, pasa } = criterioYVeredicto(r, { esGrande: p.esGrande });
    return { ...p, ratio: r, criterio, pasa };
  }).filter(Boolean).sort((a, b) => a.ratio - b.ratio);

  const peores = filas.filter(f => !f.pasa);
  console.log(`Fallan su criterio: ${peores.length} de ${filas.length}\n`);
  peores.slice(0, 25).forEach(f => {
    console.log(`  ${f.ratio.toFixed(2)}:1  FALLA (${f.criterio})  fg=${f.fg} bg=${f.bg}  <${f.tag} class="${f.clase}">`);
  });

  console.log('\n=== 3. Anillos de foco (outline:none + box-shadow) — extraídos del CSS, no hardcodeados ===\n');
  const selectoresFoco = extraerSelectoresDeAnilloFoco();
  console.log(`Selectores encontrados: ${selectoresFoco.length}\n`);
  const anillos = await medirAnillosDeFoco(page, selectoresFoco);
  const filasAnillo = [];
  for (const a of anillos) {
    if (a.nota === 'medido aparte (login)' && anilloLogin) a.resultado = anilloLogin;
    if (!a.resultado) { console.log(`  (sin elemento en el DOM: ${a.selector}${a.nota ? ' — ' + a.nota : ''})`); continue; }
    const { boxShadowComputado, bg, enfocado } = a.resultado;
    // boxShadowComputado puede traer varias sombras separadas por coma; nos interesa el color rgba.
    const m = boxShadowComputado.match(/rgba?\([^)]+\)/);
    const colorAnillo = m ? m[0] : null;
    let r = null, criterio = null, pasa = null;
    if (colorAnillo) {
      r = ratioConAlpha(colorAnillo, bg);
      ({ criterio, pasa } = criterioYVeredicto(r, { esNoTexto: true }));
    }
    filasAnillo.push({ ...a, colorAnillo, bg, enfocado, ratio: r, criterio, pasa });
    console.log(`  ${a.selector} (css:${a.linea})  anillo=${colorAnillo || '(no se resolvió)'}  sobre fondo=${bg}` +
      (r !== null ? `  → ${r.toFixed(2)}:1  ${pasa ? 'PASA' : 'FALLA'} (${criterio})` : '  (no medible)'));
  }

  await browser.close();

  const salida = { variables, literales, paresVivos: filas, anillosFoco: filasAnillo };
  const jsonIdx = process.argv.indexOf('--json');
  if (jsonIdx !== -1 && process.argv[jsonIdx + 1]) {
    fs.writeFileSync(process.argv[jsonIdx + 1], JSON.stringify(salida, null, 2), 'utf8');
    console.log(`\nJSON crudo -> ${process.argv[jsonIdx + 1]}`);
  }
})();
