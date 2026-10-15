/* Captura un "fingerprint" de comportamiento de la demo L1 HCE+IDEA (IPPU x UTEC-LIDIA).
 *
 * Para que sirve: la demo no tiene tests. Antes de un cambio que NO deberia alterar el
 * comportamiento (refactor, reordenar, partir archivos), se captura un fingerprint del
 * estado actual; despues del cambio se captura otro y se comparan con comparar.js.
 * Si difieren, algo se rompio. Ver README.md.
 *
 * Uso:  node fingerprint.js <ruta-al-html | URL-de-la-demo> <salida.json>
 *   - URL (http://localhost:5500/index.html): demo CONECTADA (desde la Fase 3). Hace login contra la API
 *     (env API, por omision http://localhost:8000; IPPU_DEMO_PASSWORD; IPPU_DEMO_EMAIL) y recorre el modo
 *     demostracion: los expedientes de ejemplo se abren con abrirExpedienteDemo().
 *   - ruta a un .html: versiones ANTERIORES a la Fase 3 (sin API), como siempre.
 *
 * Cubre: carga sin errores · catalogos y constantes · funciones globales · motor de
 * flujo M1 de los 8 NNA · las 5 vistas · los 8 expedientes · las reglas duras de
 * negocio (no-homologabilidad 5.2 y baremo 7.5) · calculo puro · y los caminos
 * interactivos (firma CI/PA/PB con delta y alerta, addenda, excepcion, modales,
 * vistas dinamicas) · y el volcado final del modelo tras todas las mutaciones.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const htmlPath = process.argv[2], outPath = process.argv[3];
if (!htmlPath || !outPath) {
  console.error('uso: node fingerprint.js <ruta-al-html | URL-de-la-demo> <salida.json>');
  process.exit(1);
}
const CONECTADA = /^https?:\/\//.test(htmlPath);
const API = process.env.API || 'http://localhost:8000';
if (CONECTADA && !process.env.IPPU_DEMO_PASSWORD) { console.error('Falta IPPU_DEMO_PASSWORD (contraseña del técnico de la demo).'); process.exit(1); }

/* Normaliza lo no determinista (la hora actual aparece en HCE-LOG) para que dos
   corridas en distinto minuto no den un falso positivo. */
const norm = (s) => (s == null ? s : String(s)
  .replace(/\b([01]\d|2[0-3]):[0-5]\d\b/g, 'HH:MM')
  .replace(/\s+/g, ' ').trim());

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('dialog', d => d.accept());                       // confirm() de HCE-VF
  await page.addInitScript(() => {                          // no abrir el dialogo de impresion
    window.print = () => { window.__printed = (window.__printed || 0) + 1; };
  });

  const F = { errors: null, pasos: {} };
  const cap    = async (k, fn)      => { F.pasos[k] = norm(JSON.stringify(await page.evaluate(fn))); };
  const capArg = async (k, fn, arg) => { F.pasos[k] = norm(JSON.stringify(await page.evaluate(fn, arg))); };
  const html   = async (k, sel)     => {
    F.pasos[k] = norm(await page.evaluate(s => { const e = document.querySelector(s); return e ? e.innerHTML : null; }, sel));
  };

  /* Una sola vez, en un solo lugar: por vista, el selector sobre el que hacer click para
     llegar a ella (`entrada`) y el selector del contenedor que un render() deja poblado
     (`contenido`). NO se infiere de `.navitem[data-view=...]`: `usuarios` no es un
     `.navitem` (vive en el `.userchip`, `index.html:43`) y su contenido no se pinta al
     cargar la página como sí hacen grupos/inclusión/ateneos (`renderGrupos()` /
     `renderInclusion()` / `renderAteneos()` corren al final de su módulo) — sólo se llena
     cuando corre `renderUsuario()`, que el propio onclick del `.userchip` ya encadena. Si la
     nav vuelve a cambiar, se corrige ACÁ — no se agrega un caso especial en el loop de abajo. */
  const VISTAS = {
    inicio:     { entrada: '.navitem[data-view="inicio"]',     contenido: '#tbodyNNA' },
    pendientes: { entrada: '.navitem[data-view="pendientes"]', contenido: '#pendKpi' },
    analitica:  { entrada: '.navitem[data-view="analitica"]',  contenido: '#anKpi' },
    grupos:     { entrada: '.navitem[data-view="grupos"]',     contenido: '#gruposList' },
    inclusion:  { entrada: '.navitem[data-view="inclusion"]',  contenido: '#inclusionContent' },
    ateneos:    { entrada: '.navitem[data-view="ateneos"]',    contenido: '#ateneosContent' },
    usuarios:   { entrada: '.userchip',                        contenido: '#usuarioContent' },
  };

  if (CONECTADA) {
    await page.goto(htmlPath + (htmlPath.includes('?') ? '&' : '?') + 'api=' + encodeURIComponent(API));
    await page.waitForSelector('#loginScreen', { state: 'attached' });
    await page.fill('#loginUser', process.env.IPPU_DEMO_EMAIL || 'gonzalez@demo.ippu.test');
    await page.fill('#loginPass', process.env.IPPU_DEMO_PASSWORD);
    await page.click('#loginBtn');
    await page.waitForSelector('#loginScreen.hidden', { state: 'attached', timeout: 8000 });
    await page.waitForFunction(() => /Mostrando \d+ de/.test(document.getElementById('listaResumen').textContent), null, { timeout: 8000 });
  } else {
    await page.goto('file:///' + path.resolve(htmlPath).replace(/\\/g, '/'));
    await page.waitForSelector('#loginScreen', { state: 'attached' });
    await page.click('#loginForm button[type="submit"]');     // login pre-cargado
    await page.waitForSelector('#loginScreen.hidden', { state: 'attached' });
  }

  /* Falla fuerte y con nombre si la nav cambió: antes esto moría en silencio dentro de
     page.click() (timeout genérico de Playwright, sin decir qué vista era). */
  for (const [v, { entrada }] of Object.entries(VISTAS)) {
    const existe = await page.evaluate(s => !!document.querySelector(s), entrada);
    if (!existe) {
      throw new Error(`fingerprint: el punto de entrada de la vista "${v}" (${entrada}) no existe en el DOM. La nav cambió — actualizar VISTAS en fingerprint.js.`);
    }
  }

  /* ============================================================================
     PARTE A — ESTADO INICIAL (antes de cualquier mutacion)
     ============================================================================ */

  await cap('A1_catalogos_y_globales', () => ({
    nnaCount:      typeof NNA !== 'undefined' ? NNA.length : null,
    nnaIds:        typeof NNA !== 'undefined' ? NNA.map(n => n.id) : null,
    dimensiones:   typeof DIMENSIONES !== 'undefined' ? DIMENSIONES.length : null,
    ippuItems:     typeof IPPU_ITEMS !== 'undefined' ? IPPU_ITEMS.length : null,
    ippuEscalas:   typeof IPPU_ESCALAS !== 'undefined' ? IPPU_ESCALAS : null,
    modulosFlujo:  typeof MODULOS_FLUJO !== 'undefined' ? MODULOS_FLUJO.map(m => m.key) : null,
    grupos:        typeof GRUPOS !== 'undefined' ? GRUPOS.map(g => g.id) : null,
    usuarioActual: typeof USUARIO_ACTUAL !== 'undefined' ? USUARIO_ACTUAL : null,
    hoy:           typeof HOY !== 'undefined' ? HOY : null,
    /* si una funcion se pierde al mover codigo, esta lista lo delata */
    fnGlobales:    Object.keys(window).filter(k => typeof window[k] === 'function' && !/^(webkit|on)/.test(k)).sort(),
  }));

  await cap('A2_motor_flujo_inicial', () => {
    const out = {};
    for (const n of NNA) out[n.id] = MODULOS_FLUJO.map(m => ({
      key: m.key, estado: estadoModulo(n, m.key), habil: moduloHabilitado(n, m.key),
    }));
    return out;
  });

  for (const [v, { entrada, contenido }] of Object.entries(VISTAS)) {
    await page.click(entrada);
    await page.waitForTimeout(120);
    await html('A3_vista_' + v, `#view-${v}`);
    /* Una vista puede tener crumbs/h1/p estáticos y aun así el contenedor que arma su
       render() quedar vacío (justo lo que le pasaba a "usuarios" antes de este fix): un
       fingerprint "poblado" en apariencia que en realidad grabó una vista en blanco. */
    const vacio = await page.evaluate(s => {
      const e = document.querySelector(s);
      return !e || e.innerHTML.trim() === '';
    }, contenido);
    if (vacio) {
      throw new Error(`fingerprint: la vista "${v}" quedó vacía en ${contenido} tras el click en ${entrada}. Falta un render() explícito además del click, o el contenedor cambió de id.`);
    }
  }

  const ids = JSON.parse(F.pasos.A1_catalogos_y_globales).nnaIds || [];
  for (const id of ids) {
    await page.evaluate(i => (typeof abrirExpedienteDemo === 'function' ? abrirExpedienteDemo : abrirExpediente)(i), id);   // Fase 3: los ids 101-108 son del ejemplo, no de la API
    await page.waitForTimeout(120);
    await html('A4_expediente_' + id, '#view-expediente');
  }

  /* ============================================================================
     PARTE B — REGLAS DURAS DE NEGOCIO (guards; no mutan estado)
     ============================================================================ */

  /* 5.2: el delta SOLO se calcula entre dos protocolos IPPU-TEA, nunca contra el IDEA. */
  await cap('B1_guard_no_homologabilidad', () => {
    const t = f => { try { return { ok: true, r: f() }; } catch (e) { return { ok: false, err: e.message }; } };
    const n = NNA.find(x => x.id === 102);
    return {
      protocolos_validos: t(() => calcularDelta(n.flujo.pa, n.flujo.pb)),
      contra_idea:        t(() => calcularDelta(n.flujo.lb, n.flujo.pb)),   // debe LANZAR
      idea_contra_idea:   t(() => calcularDelta(n.flujo.lb, n.flujo.lb)),   // debe LANZAR
      nulo:               t(() => calcularDelta(null, n.flujo.pb)),         // debe LANZAR
      protocolos_vacios:  t(() => calcularDelta({ kind: 'protocolo', item: [] }, { kind: 'protocolo', item: [] })),
    };
  });

  /* 7.5: la categoria del baremo sale SOLO del % oficial (BUND), nunca de un puntaje clinico. */
  await cap('B2_guard_baremo', () => {
    const t = f => { try { return { ok: true, r: f() }; } catch (e) { return { ok: false, err: e.message }; } };
    const n = NNA.find(x => x.id === 102);
    return {
      pct_0: t(() => categoriaBaremo(0)),      pct_33: t(() => categoriaBaremo(33)),
      pct_97: t(() => categoriaBaremo(97)),    borde_4: t(() => categoriaBaremo(4)),
      borde_5: t(() => categoriaBaremo(5)),    fuera_neg: t(() => categoriaBaremo(-1)),
      fuera_101: t(() => categoriaBaremo(101)), no_numero: t(() => categoriaBaremo('abc')),
      objeto_pct: t(() => categoriaBaremo({ pct: 42 })),
      desde_idea: t(() => categoriaBaremo(n.flujo.lb)),                     // debe LANZAR
      desde_protocolo: t(() => categoriaBaremo(n.flujo.pa)),                // debe LANZAR
    };
  });

  await cap('B3_calculo_puro', () => ({
    deltaInterpreta: [-20, -8, -7, -6, -1, 0, 1, 6, 7, 12, 13, 30].map(d => [d, deltaInterpreta(d)]),
    fmtDelta: [-5, 0, 5].map(fmtDelta),
    ALERTA_DELTA,
    lbTotales: [
      lbTotales([]), lbTotales([0,1,2,3,4,5,6,7,8,0,1,2]),
      lbTotales([8,8,8,8,8,8,8,8,8,8,8,8]), lbTotales(['NS',1,2,3,4,5,6,7,8,0,1,2]),
    ],
    protTotales: [
      protTotales([]), protTotales(Array(24).fill(3)),
      protTotales(Array(24).fill(5)), protTotales(Array(12).fill(2)),
    ],
  }));

  /* ============================================================================
     PARTE C — CAMINOS INTERACTIVOS (mutan estado; el orden importa)
     ============================================================================ */

  /* C1 · Firma de HCE-CI (106): camino con firmante, autorizaciones y adjunto. */
  await page.evaluate(() => firmarModulo(106, 'ci'));
  await html('C1a_modal_firma_ci', '#modalFlujo');
  await page.evaluate(() => {
    document.getElementById('mfFecha').value = '2026-07-20';
    document.getElementById('mfFirmante').value = 'Referente de prueba';
    document.getElementById('mfAutEval').checked = true;
    document.getElementById('mfAutReg').checked = true;
    document.getElementById('mfAutCom').checked = false;
    document.getElementById('mfAdjunto').value = 'consentimiento_test.pdf';
    confirmarFirma(106, 'ci');
  });
  await page.waitForTimeout(150);
  await capArg('C1b_tras_firmar_ci', id => {
    const n = NNA.find(x => x.id === id);
    return { ci: n.flujo.ci, estados: MODULOS_FLUJO.map(m => [m.key, estadoModulo(n, m.key), moduloHabilitado(n, m.key)]), log: n.hceLog };
  }, 106);

  /* C2 · Firma PA y luego PB (101): al firmar B se dispara el delta B-A y la alerta (M5.3). */
  await page.evaluate(() => firmarModulo(101, 'pa'));
  await page.evaluate(() => { document.getElementById('mfFecha').value = '2026-07-21'; confirmarFirma(101, 'pa'); });
  await page.waitForTimeout(120);
  await capArg('C2a_tras_firmar_pa', id => {
    const n = NNA.find(x => x.id === id);
    return { estados: MODULOS_FLUJO.map(m => [m.key, estadoModulo(n, m.key), moduloHabilitado(n, m.key)]), log: n.hceLog };
  }, 101);

  await page.evaluate(() => firmarModulo(101, 'pb'));
  await html('C2b_modal_firma_pb', '#modalFlujo');
  await page.evaluate(() => { document.getElementById('mfFecha').value = '2026-07-22'; confirmarFirma(101, 'pb'); });
  await page.waitForTimeout(3800);                          // el toast de alerta institucional sale a los 3400 ms
  await capArg('C2c_delta_y_alerta', id => {
    const n = NNA.find(x => x.id === id);
    return { deltas: n.flujo.pb.deltas, estados: MODULOS_FLUJO.map(m => [m.key, estadoModulo(n, m.key)]),
             alertas: n.hceLog.filter(e => e.tipo === 'alerta'), log: n.hceLog };
  }, 101);

  /* C3 · Addenda sobre un modulo firmado, y el rechazo sobre uno sin firmar. */
  await page.evaluate(() => addendaModulo(102, 'lb'));
  await html('C3a_modal_addenda', '#modalFlujo');
  await page.evaluate(() => {
    document.getElementById('mfTexto').value = 'Correccion de prueba para el fingerprint.';
    confirmarAddenda(102, 'lb');
  });
  await page.waitForTimeout(120);
  await capArg('C3b_tras_addenda', id => {
    const n = NNA.find(x => x.id === id);
    return { addendas: n.flujo.lb.addendas, firmado: n.flujo.lb.firmado, log: n.hceLog };
  }, 102);
  await capArg('C3c_addenda_sobre_no_firmado', id => {
    const n = NNA.find(x => x.id === id); const antes = JSON.stringify(n.flujo.pa.addendas);
    addendaModulo(id, 'pa');
    return { antes, despues: JSON.stringify(n.flujo.pa.addendas),
             modalAbierto: document.getElementById('modalFlujo').classList.contains('open') };
  }, 107);

  /* C5 · Modales de alta, edicion y "Recibi de la familia". */
  await page.evaluate(() => openAlta());            await html('C5a_modal_alta', '#modalAlta');
  await page.evaluate(() => closeAlta());
  /* La edicion ya NO es del ejemplo: openEditar() edita el expediente de la API que esta abierto (Fase 3-b),
     asi que en la demo conectada no hay modal de edicion de ejemplo que capturar. */
  if (!CONECTADA) { await page.evaluate(() => openEditar(101)); await html('C5b_modal_editar', '#modalAlta'); await page.evaluate(() => closeAlta()); }
  await page.evaluate(() => openRecibiModal(102));  await html('C5c_modal_recibi', '#modalFlujo');
  await page.evaluate(() => closeFlujoModal());

  /* C6 · Vistas que se arman por JS. */
  /* IDEA, PA y PB dejaron de ser vistas de ejemplo en la Fase 3-c: viven en las pestañas del expediente de la API
     (conectada.js las verifica), asi que ya no hay vista que capturar aqui. */
  await page.evaluate(() => cargarIC(102));         await html('C6d_vista_ic', '#view-ic');
  await page.evaluate(() => generarInforme(102));   await html('C6e_vista_informe', '#view-informe');
  await page.evaluate(() => { try { genVFBorrador(101, true); } catch (e) { window.__vfErr = e.message; } });
  await page.waitForTimeout(150);
  await html('C6f_expediente_tras_vf', '#view-expediente');

  /* ============================================================================
     PARTE D — ESTADO FINAL DEL MODELO tras todas las mutaciones
     ============================================================================ */
  await cap('D1_modelo_final', () => JSON.parse(JSON.stringify(NNA)));
  await cap('D2_meta_final', () => ({
    grupos: typeof GRUPOS !== 'undefined' ? GRUPOS : null,
    llamadasAImprimir: window.__printed || 0,
    errorVF: window.__vfErr || null,
  }));

  /* D3 · La analitica institucional es DERIVADA del modelo, no constantes.
     Se captura DESPUES de las mutaciones de la parte C: si alguien vuelve a hardcodear un
     indicador, sus numeros se quedan quietos mientras el modelo se movio, y este paso lo
     delata al comparar contra la referencia.
     Ademas `derivadoOk` es una asercion que no depende de la comparacion: contrasta lo que
     muestra el panel contra un recalculo hecho en el momento. Si da false, el DOM quedo
     desincronizado del modelo (panel sin re-render, o valor fijo en el markup). */
  await cap('D3_analitica_derivada', () => {
    const a = analiticaAgregados();
    const panel = document.getElementById('anKpi').textContent.replace(/\s+/g, ' ');
    return {
      kpis: [...document.querySelectorAll('#anKpi .kpi')].map(k => [
        k.querySelector('.lab').textContent.trim(),
        k.querySelector('.val').textContent.replace(/\s+/g, ' ').trim(),
      ]),
      agregados: {
        activos: a.activos.length, conLB: a.conLB.length, lbs: a.lbs.length,
        ideaTot: a.ideaTot, ideaEsc: a.ideaEsc, banda: a.banda,
        conAB: a.conAB.length, deltaTot: a.deltaTot, ciclos: a.ciclos.length,
      },
      derivadoOk: panel.includes(`${a.conLB.length} de ${a.activos.length} NNA activos`)
               && panel.includes(`${a.ciclos.length} / ${a.activos.length}`),
    };
  });

  F.errors = errors;
  fs.writeFileSync(outPath, JSON.stringify(F, null, 2), 'utf8');
  console.log(`fingerprint -> ${outPath}`);
  console.log(`  pasos capturados: ${Object.keys(F.pasos).length}`);
  console.log(`  errores de consola/pagina: ${errors.length}`);
  errors.forEach(e => console.log('   ! ' + e));
  await browser.close();
})();
