/* Verificación de la demo CONECTADA a la API (Fase 3-a · handoff §5.122).
 *
 * A diferencia de fingerprint.js (que compara el comportamiento de la demo ESTÁTICA, sin API),
 * este script prueba contra una API real: login, listado, HCE-00 y modo demostración.
 *
 * Requisitos (ver README.md, sección «Demo conectada»):
 *   - API en http://localhost:8000 con la base cargada por `python -m app.seed_demo`
 *   - demo servida en http://localhost:5500   (cd demo && python -m http.server 5500)
 *   - IPPU_DEMO_PASSWORD = contraseña del técnico de la demo (la del seed)
 *
 * Uso:  IPPU_DEMO_PASSWORD=... IPPU_ADMIN_EMAIL=... IPPU_ADMIN_PASSWORD=... node conectada.js
 * Opcionales: API=http://localhost:8000  DEMO=http://localhost:5500   (la demo se abre con ?api=<API>)
 *             IPPU_DEMO_EMAIL=gonzalez@demo.ippu.test   HEADED=1
 * ⚠️ Desde la Fase 3-b la corrida ESCRIBE y exige CONFIRMA_BASE_DESCARTABLE=1 (aborta con exit 1 sin ella, antes de pedir nada) (crea un expediente, lo edita, registra su CI): los conteos del
 *    principio son los del seed recién cargado, así que para repetirla hay que recrear la base (README).
 * Sale 0 si todo pasa, 1 si algo falla (o si la API/la demo no están arriba).
 */
const { chromium } = require('playwright');

const API = process.env.API || 'http://localhost:8000';
const DEMO = process.env.DEMO || 'http://localhost:5500';
const EMAIL = process.env.IPPU_DEMO_EMAIL || 'gonzalez@demo.ippu.test';
const PASSWORD = process.env.IPPU_DEMO_PASSWORD;
const ADMIN_EMAIL = process.env.IPPU_ADMIN_EMAIL;        // el admin del seed (IPPU_EMAIL / IPPU_PASSWORD con los que se cargó)
const ADMIN_PASSWORD = process.env.IPPU_ADMIN_PASSWORD;

const resultados = [];
function check(id, nombre, ok, detalle) {
  resultados.push({ id, nombre, ok: !!ok, detalle: detalle || '' });
  console.log(`${ok ? 'PASS' : 'FAIL'}  (${id}) ${nombre}${detalle ? '  → ' + detalle : ''}`);
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

(async () => {
  await preflight();
  const browser = await chromium.launch({ headless: !process.env.HEADED });
  const erroresPagina = [];
  const nuevaPagina = async () => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    page.on('pageerror', (e) => erroresPagina.push(e.message));
    page.on('console', (m) => {
      // Un 4xx/5xx de la API se loguea solo como "Failed to load resource": es esperado en (b)/(i).
      if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) erroresPagina.push('console: ' + m.text());
    });
    return { ctx, page };
  };

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
    usuarioSS && chip === usuarioSS.nombre && chip === 'Dr. González' && chipRol === 'Técnico' && !!tokenSS,
    `chip="${chip}" rol="${chipRol}" usuario(sessionStorage)=${usuarioSS && usuarioSS.nombre}/${usuarioSS && usuarioSS.rol}`);

  const tras = await page.evaluate(() => ({ foco: document.activeElement.id, tag: document.activeElement.tagName,
    inert: document.querySelector('header.topbar').inert || document.querySelector('div.layout').inert,
    tabindex: document.getElementById('tituloInicio').getAttribute('tabindex') }));
  check('3a-l3', 'tras un login correcto el foco va al título principal de Inicio (tabindex=-1) y la app deja de estar inerte',
    tras.foco === 'tituloInicio' && tras.tag === 'H1' && tras.tabindex === '-1' && !tras.inert, JSON.stringify(tras));

  /* ---------- (c) conteos del listado y filtro de grupo (== tests/test_m11_5a_seed_demo.py) ---------- */
  await esperarResumen(page, 'Mostrando 7 de 7');
  const kpiTotal = (await txt(page, '#kpiTotal')).trim();
  check('3a-c1', 'activos: «Mostrando 7 de 7» (Tomás, dado de baja, no aparece) y KPI de activos = 7',
    (await filas(page)) === 7 && kpiTotal === '7', `filas=${await filas(page)} kpiTotal=${kpiTotal} resumen="${await txt(page, '#listaResumen')}"`);

  await page.click('.chip-estado[data-estado="todos"]');
  await esperarResumen(page, 'Mostrando 8 de 8');
  check('3a-c2', 'todos (incluir_inactivos): «Mostrando 8 de 8»', (await filas(page)) === 8, `filas=${await filas(page)}`);

  await page.click('.chip-estado[data-estado="inactivos"]');
  await esperarResumen(page, 'Mostrando 1 de 1');
  const inactivoNombre = await txt(page, '#tbodyNNA tr[data-hce] td.nna-name');
  check('3a-c3', 'inactivos (filtro en el cliente): 1 fila — Tomás', (await filas(page)) === 1 && inactivoNombre === 'Tomás', `fila="${inactivoNombre}"`);

  // Grupos: con incluir_inactivos (Todos) → 3 / 3 / 2, como afirma el test del seed.
  await page.click('.chip-estado[data-estado="todos"]');
  await esperarResumen(page, 'Mostrando 8 de 8');
  const opciones = await page.$$eval('#filtroGrupo option', (os) => os.map((o) => o.textContent.trim()));
  check('3a-c4', 'el filtro de grupo sale de GET /grupos (año en curso): 5 grupos reales + «Todos»',
    JSON.stringify(opciones) === JSON.stringify(['Todos', 'Adolescentes', 'Escolares', 'Inicial', 'Preadolescentes', 'Taller de Adolescentes']),
    opciones.join(' | '));
  const esperadoGrupo = { Escolares: 3, Preadolescentes: 3, Adolescentes: 2 };
  for (const [grupo, n] of Object.entries(esperadoGrupo)) {
    await page.selectOption('#filtroGrupo', { label: grupo });
    await esperarResumen(page, `Mostrando ${n} de ${n}`);
    const celdas = await page.$$eval('#tbodyNNA tr[data-hce] td:nth-child(6)', (tds) => tds.map((t) => t.textContent.trim()));
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
  check('3a-d', 'búsqueda por la cédula «6.012.345-1» → GET /hce?ci=60123451 → 1 fila: Martín',
    r.params.ci === '60123451' && !r.params.numero && !r.params.nombre && r.filas === 1 && /Martín/.test(r.html) && /6\.012\.345-1/.test(r.html),
    JSON.stringify(r.params) + ' filas=' + r.filas);
  r = await buscar(page, '60123451');
  check('3a-m1', 'cédula de 8 dígitos sin separadores → ci → 1 fila: Martín', r.params.ci === '60123451' && !r.params.numero && r.filas === 1 && /Martín/.test(r.html), JSON.stringify(r.params) + ' filas=' + r.filas);
  r = await buscar(page, '6012345');
  check('3a-m2', 'límite 7 dígitos sin separadores («6012345») → ci (no numero) → 1 fila: Martín', r.params.ci === '6012345' && !r.params.numero && r.filas === 1 && /Martín/.test(r.html), JSON.stringify(r.params) + ' filas=' + r.filas);
  r = await buscar(page, '601234');
  check('3a-m3', 'límite 6 dígitos sin separadores («601234») → numero (no ci) → sin resultados (no existe esa HCE)', r.params.numero === '601234' && !r.params.ci && r.filas === 0 && /No se encontraron/.test(r.html), JSON.stringify(r.params) + ' filas=' + r.filas);
  r = await buscar(page, '1002');
  check('3a-d2', 'búsqueda por N.º de HCE «1002» → GET /hce?numero=1002 → exactamente 1 fila: Martín, con N.º 1002',
    r.params.numero === '1002' && !r.params.ci && r.filas === 1 && /Martín/.test(r.html) && /^1002\b/.test(r.html.trim()), JSON.stringify(r.params) + ' filas=' + r.filas);
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
  const pasosM = await page.$$eval('#flujoWrap .fl-btn', (bs) => bs.map((b) => b.getAttribute('aria-label')));
  const flujoM = (await txt(page, '#flujoWrap')).replace(/\s+/g, ' ');
  check('3a-f3', 'stepper del flujo desde GET /hce/{id}/flujo (Martín: CI registrado + LB, PA, PB, IC firmados), con texto y glifo de estado',
    JSON.stringify(pasosM) === JSON.stringify(['Línea base (IDEA): firmado', 'Protocolo A: firmado', 'Protocolo B: firmado', 'Informe de cierre: firmado']) &&
    /Registrado/.test(flujoM) && /flujo del año \d{4}/i.test(flujoM) && /●/.test(flujoM), flujoM.slice(0, 150));
  const ocultos = ['Talleres', 'Nivel de soporte', 'Historial clínico', 'Tendencia', 'Bloquead', '🔒', 'Azul', 'Celeste', 'Naranja'].filter((t) => exp.includes(t));
  check('3a-f4', 'lo que la API no guarda (talleres, nivel de soporte, historial, tendencia) y los colores de grupo de la demo NO aparecen; tampoco candados ni «Bloqueado»',
    ocultos.length === 0, ocultos.length ? 'aparece: ' + ocultos.join(',') : '');
  const edadEsperada = (() => { const n = new Date(api.persona.fecha_nac); const h = new Date(); let e = h.getFullYear() - n.getFullYear();
    if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getUTCDate())) e--; return e; })();
  check('3a-f5', 'la edad sale de persona.fecha_nac (no hay columna edad)', new RegExp(`${edadEsperada} años`).test(exp), `esperada=${edadEsperada}`);
  const hayInputs = await page.locator('#view-expediente input, #view-expediente textarea, #view-expediente select').count();
  check('3a-f6', 'HCE-00 se lee como texto (sin campos sueltos en la vista); la edición va en un diálogo que se abre con «Editar datos»',
    hayInputs === 0 && (await page.locator('#expHead >> text=✎ Editar datos').count()) === 1, `inputs=${hayInputs}`);

  /* Pestañas: un módulo no conectado muestra el panel de modo demostración y SIN datos; teclado. */
  await page.click('#tabExp-doc');
  const panelLb = (await txt(page, '#panelExp')).replace(/\s+/g, ' ');
  const tabSel = await page.getAttribute('#tabExp-doc', 'aria-selected');
  check('3a-g1', 'pestaña no conectada (DOC): panel «Modo demostración — no se guarda» con role="note" y badge «Solo demo»',
    /Modo demostración — no se guarda/.test(panelLb) && (await page.locator('#panelExp [role="note"]').count()) === 1 &&
    (await page.locator('#panelExp .solo-demo').count()) >= 1 && tabSel === 'true', panelLb.slice(0, 140));
  const textosTab = [];
  for (const k of ['hce00', 'ci', 'lb', 'pa', 'pb', 'ic', 'vf', 'doc', 'org', 'inc', 'pai', 'sev', 'log']) {
    await page.click('#tabExp-' + k);
    textosTab.push(k + ': ' + (await page.evaluate(() => document.getElementById('view-expediente').innerText + ' ' + [...document.querySelectorAll('#view-expediente [title]')].map((e) => e.title).join(' '))));
  }
  const tabsConFase = textosTab.filter((t) => /Fase\s*\d/.test(t)).map((t) => t.split(':')[0]);
  const sinFraseNueva = textosTab.slice(7).every((t) => /Este módulo todavía no está conectado al servidor\./.test(t));
  check('3a-f1b', 'las 13 pestañas (texto y tooltips): sin «Fase …»; HCE-00, CI, LB, PA, PB, IC y VF están conectadas (3-d) y las otras 6 dicen «Este módulo todavía no está conectado al servidor.»',
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
  const sinPanel = [];
  const textoVistas = {};
  for (const [v, sel] of vistas) {
    await page.click(sel);
    const t = (await txt(page, `#view-${v} .demo-panel`)).replace(/\s+/g, ' ');
    const roleNote = await page.locator(`#view-${v} .demo-panel[role="note"]`).isVisible();
    if (!(/Modo demostración — no se guarda/.test(t) && roleNote)) sinPanel.push(v);
    textoVistas[v] = await page.evaluate(() => document.body.innerText);
  }
  check('3a-g3', 'Pendientes, Analítica, Grupos, Inclusión, Ateneos y Usuarios muestran el panel «Modo demostración — no se guarda» (role="note")',
    sinPanel.length === 0, sinPanel.length ? 'sin panel: ' + sinPanel.join(',') : '6/6');
  check('3a-u', '«Mi usuario» (vista de ejemplo) no afirma ser la cuenta con sesión iniciada',
    !/sesión iniciada|datos de la cuenta|mi perfil/i.test(await txt(page, '#view-usuarios')) && /Perfil de ejemplo/.test(await txt(page, '#view-usuarios')),
    (await txt(page, '#view-usuarios .pagedesc')).trim());
  const conFase = Object.entries(textoVistas).filter(([, t]) => /Fase\s*3|Fase\s*\d-[a-e]/.test(t)).map(([v]) => v);
  check('3a-f0', 'ninguna vista visible menciona «Fase 3…» (las etapas son interna del equipo)', conFase.length === 0, conFase.join(',') || '6 vistas');
  await page.click('.navitem[data-view="grupos"]');
  const gruposTxt = await txt(page, '#view-grupos');
  await page.click('#gruposList button[onclick^="abrirExpedienteDemo"] >> nth=0');   // un NNA de la vista demo abre el expediente de EJEMPLO, rotulado
  await page.waitForSelector('#expedienteContent .demo-panel', { timeout: 5000 });
  check('3a-g4', 'un NNA abierto desde una vista de demostración abre el expediente de EJEMPLO, con su panel (no mezcla ids de la API)',
    /Expediente de ejemplo/.test(await txt(page, '#expedienteContent .demo-panel')), gruposTxt.length + ' chars en Grupos');

  const humo = await page.evaluate(() => {
    try {
      abrirExpedienteDemo(102); renderUsuario(); renderNNA();
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
    await p2.evaluate(() => { sessionStorage.setItem('ippu.token', 'token-invalido'); sessionStorage.setItem('ippu.usuario', '{"nombre":"X","rol":"admin"}'); });
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
    const apiMostrada = (await txt(p3, '#loginApi')).trim();
    check('3a-k', 'API inalcanzable (?api=…): mensaje legible, sin sesión, y el login muestra a qué API se envía la contraseña',
      /No se pudo conectar con la API/.test(m) && apiMostrada === 'http://localhost:9' && (await p3.evaluate(() => sessionStorage.length)) === 0,
      `mensaje="${m}" api="${apiMostrada}"`);
    await c3.close();
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
    await p4.waitForSelector('#flujoWrap >> text=No se pudo cargar el estado de los módulos', { timeout: 8000 });
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
    check('3b-a3', 'el expediente nuevo se abre con «N.º de HC <hc_historico>» (nunca el id interno) y el foco en el título',
      new RegExp(`N\\.º de HC ${apiNuevo.hc_historico}\\b`).test(cabecera) && (await focoId(p5)) === 'expTitulo' && apiNuevo.hc_historico >= 1000 && String(apiNuevo.hc_historico) !== String(idNuevo),
      `hc=${apiNuevo.hc_historico} id=${idNuevo}`);
    await p5.click('.exp-head .btn-ghost');                       // ‹ Volver al listado
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
    check('3b-b', '409 por cédula repetida como TÉCNICO: mensaje genérico «consultá a dirección», sin nombrar el campo, foco en el resumen role="alert", el diálogo sigue abierto',
      b1.foco === 'altaErrores' && b1.rol === 'alert' && /No se pudo completar el alta: consultá a dirección\./.test(b1.texto) && !/cédula/i.test(b1.texto.replace('No se pudo guardar:', '')) &&
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
    const flujoTxt = (await txt(p5, '#flujoWrap')).replace(/\s+/g, ' ');
    const trabas = await p5.evaluate(() => ({ deshabilitados: document.querySelectorAll('#flujoWrap [disabled], #flujoWrap [inert], #flujoWrap [aria-disabled="true"]').length,
      candado: /🔒|Bloquead/i.test(document.getElementById('flujoWrap').innerText + document.getElementById('tabsExpWrap').innerText),
      pasos: [...document.querySelectorAll('#flujoWrap .fl-btn')].map((b) => b.getAttribute('aria-label')) }));
    check('3b-e1', 'nuevo expediente SIN consentimiento: «CI pendiente» visible, los cuatro módulos del año figuran «sin iniciar», ningún candado ni «Bloqueado» ni control deshabilitado',
      /CI pendiente/.test(flujoTxt) && /no bloquea/.test(flujoTxt) && trabas.deshabilitados === 0 && !trabas.candado &&
      JSON.stringify(trabas.pasos) === JSON.stringify(['Línea base (IDEA): sin iniciar', 'Protocolo A: sin iniciar', 'Protocolo B: sin iniciar', 'Informe de cierre: sin iniciar']),
      JSON.stringify(trabas));
    await p5.click('#flujoWrap .fl-btn >> nth=0');                  // un módulo anual: abre su pestaña, sin traba
    await p5.waitForSelector('#evResumen', { timeout: 8000 });
    const lb = await p5.evaluate(() => ({ sel: document.getElementById('tabExp-lb').getAttribute('aria-selected'), panel: document.getElementById('panelExp').innerText }));
    check('3b-e2', 'un módulo anual (LB) se abre aunque falte el CI: su pestaña se selecciona y muestra el editor conectado (formulario IDEA de la API), sin candado ni panel de demostración',
      lb.sel === 'true' && !/Modo demostración — no se guarda/.test(lb.panel) && /Línea base — IDEA/.test(lb.panel) && !/🔒|Bloquead/i.test(lb.panel));
    await p5.click('#flujoWrap >> text=Ver auditoría');
    check('3b-e3', '«Ver auditoría» abre el panel de modo demostración compartido', /Modo demostración — no se guarda/.test(await txt(p5, '#panelExp')) && (await p5.getAttribute('#tabExp-log', 'aria-selected')) === 'true');

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
    await p5.waitForFunction(() => /Registrado/.test(document.getElementById('flujoWrap').innerText));
    const apiCi = (await apiGet(p5, `/hce/${idNuevo}/consentimiento`)).json;
    const tras = await p5.evaluate(() => ({ panel: document.getElementById('panelExp').innerText.replace(/\s+/g, ' '), flujo: document.getElementById('flujoWrap').innerText.replace(/\s+/g, ' '),
      marcaTab: document.getElementById('tabExp-ci').innerText.replace(/\s+/g, ' '), foco: document.activeElement.id }));
    check('3b-e5', 'registrar el CI: POST {firmante, fecha, autorizaciones} (las tres) → la API lo guarda y la pantalla lo muestra «Registrado» (nunca «firmado»), con el foco en su título',
      Object.keys(bodyCi).sort().join() === 'autorizaciones,fecha,firmante' && Object.keys(bodyCi.autorizaciones).sort().join() === 'comunicacion,evaluacion,registro' &&
      apiCi.firmante === 'Referente de prueba 3b' && apiCi.autorizaciones.evaluacion === true && apiCi.autorizaciones.comunicacion === false &&
      /registrado/i.test(tras.panel) && /Referente de prueba 3b/.test(tras.panel) && !/firmad/i.test(tras.panel) && tras.foco === 'ciTitulo', JSON.stringify(bodyCi));
    check('3b-e6', 'tras registrar, el flujo se vuelve a pedir a la API: la tarjeta del stepper dice «Registrado» (ya no «CI pendiente») y la pestaña CI lo marca',
      /Registrado/.test(tras.flujo) && !/CI pendiente/.test(tras.flujo) && /registrado/.test(tras.marcaTab), tras.flujo.slice(0, 120));
    await p5.click('#tabExp-hce00');
    await p5.click('.exp-head .btn-ghost');
    await p5.fill('#searchNNA', nombreNuevo);
    await p5.waitForFunction((n) => document.getElementById('tbodyNNA').textContent.includes(n), nombreNuevo, { timeout: 8000 });
    await p5.waitForFunction((n) => { const t = [...document.querySelectorAll('#tbodyNNA tr[data-hce]')].find((r) => r.textContent.includes(n)); return t && /Registrado/.test(t.textContent); }, nombreNuevo, { timeout: 8000 });
    const filaReg = (await p5.locator('#tbodyNNA tr[data-hce]', { hasText: nombreNuevo }).innerText()).replace(/\s+/g, ' ');
    check('3b-e7', 'la fila del listado muestra el CI «Registrado» (no «CI pendiente»)', /Registrado/.test(filaReg) && !/CI pendiente/.test(filaReg), filaReg);
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
    await pc.click('#tabExp-pb'); await pc.waitForSelector('#evDeltaTabla');
    const tot = await pc.evaluate(() => ({ pb: document.getElementById('evTotal').textContent.trim(),
      filas: Object.fromEntries([...document.querySelectorAll('#evDeltaTabla tbody tr')].map((tr) => [tr.dataset.delta, tr.querySelector('td.num').innerText.trim()])),
      txt: document.getElementById('evDeltaTabla').innerText.replace(/\s+/g, ' ') }));
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
      flujo: document.getElementById('flujoWrap').innerText.replace(/\s+/g, ' '), foco: document.activeElement.id }));
    check('3c-d', 'addenda a un IDEA firmado: el cuerpo es solo {texto} (sin autor), la API guarda como autor al usuario de la sesión, la lista lo muestra con nombre y fecha, y el estado del módulo marca la addenda (encabezado, pestaña y stepper)',
      JSON.stringify(Object.keys(cuerpoAdd)) === '["texto"]' && ideaAdd.addendas.length === 1 && ideaAdd.addendas[0].profesional_id === yo.id && ideaAdd.addendas[0].texto === textoAdd &&
      pantalla.lista.includes(yo.nombre) && pantalla.lista.includes(textoAdd) && /con 1 addenda/.test(pantalla.cab) && /✚/.test(pantalla.cab) && /con 1 addenda/.test(pantalla.tabSr) && /1 addenda/.test(pantalla.flujo) && pantalla.foco === 'evAddTitulo',
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
      (await pc.locator('#panelExp .lik-btn.sel').count()) === 24 && paDraft.firmado === false && (await pc.inputValue('#ev_t1')) === String(paDraft.evaluador_t1_id) && (await pc.inputValue('#prot_fecha')) === '', '24 ítems');
    await pc.click('#pitem-1 .lik-btn[data-v="1"]');
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
    for (let i = 0; i < 24; i++) await pc.click(`#pitem-${i + 1} .lik-btn[data-v="${itemsPB[i]}"]`);
    await pc.fill('#pobs-1', 'Regresión significativa en contacto visual (prueba 3-c).'); await pc.fill('#pobs-2', 'Regresión en iniciativa social (prueba 3-c).');
    await pc.fill('#prot_fecha', '2026-11-10'); await pc.fill('#prot_semanas', '17'); await pc.fill('#prot_sint1', 'Síntesis PB técnico 1.'); await pc.fill('#prot_sint2', 'Síntesis PB técnico 2.'); await pc.fill('#prot_ajustes', 'Ajustes de prueba.');
    const reqCrearPB = pc.waitForRequest((r) => r.method() === 'POST' && /\/hce\/\d+\/protocolo$/.test(r.url()));
    await pc.click('#btnEvFirmar'); await pc.click('#btnEvConfirmar');
    const cuerpoPB = cuerpoDe(await reqCrearPB);
    await pc.waitForSelector('#evDeltaTabla', { timeout: 8000 });
    const pbS = (await get(`/hce/${idSofia}/protocolo`)).json.find((x) => x.tipo === 'B');
    const dPB = await pc.evaluate(() => ({ total: document.getElementById('evTotal').textContent.trim(),
      filas: Object.fromEntries([...document.querySelectorAll('#evDeltaTabla tbody tr')].map((tr) => [tr.dataset.delta, { d: tr.querySelector('td.num').innerText.trim(), t: tr.innerText.replace(/\s+/g, ' ') }])),
      alerta: [...document.querySelectorAll('.ev-alertas')].map((e) => e.innerText.replace(/\s+/g, ' ')), marcas: document.querySelectorAll('#evDeltaTabla .ev-alerta').length }));
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
    const bloq = await pc.evaluate(() => ({ deshab: [...document.querySelectorAll('#panelExp [data-ev]')].filter((e) => e.disabled).length, flujo: document.getElementById('flujoWrap').innerText.replace(/\s+/g, ' '),
      avisos: document.getElementById('evAvisos').hidden ? '' : document.getElementById('evAvisos').innerText, guardar: !document.getElementById('btnEvGuardar').disabled, total: document.getElementById('evTotal').textContent.trim() }));
    check('3c-i', 'expediente SIN consentimiento: crear y guardar el IDEA anda (POST 201, queda «En curso»), sin candado ni control deshabilitado; el CI pendiente es solo un estado visible. (La API no avisa por la falta de CI ni por el IDEA: es el primer eslabón, §5.94/§5.116 e.)',
      ci0 === 404 && rCrearLB.status() === 201 && lbs.length === 1 && lbs[0].firmado === false && bloq.deshab === 0 && /CI pendiente/.test(bloq.flujo) && bloq.guardar && bloq.total === String(lbs[0].total) && (await sinCandado()),
      `CI→${ci0} · IDEA→${rCrearLB.status()} · avisos="${bloq.avisos.trim()}"`);
    await pc.click('#tabExp-pa'); await pc.waitForSelector('#evResumen');
    await pc.click('#pitem-1 .lik-btn[data-v="3"]');
    const reqCrearPA = pc.waitForResponse((r) => r.request().method() === 'POST' && /\/hce\/\d+\/protocolo$/.test(r.url()));
    await pc.click('#btnEvGuardar');
    const rCrearPA = await reqCrearPA, jPA = await rCrearPA.json();
    await pc.waitForFunction(() => !document.getElementById('evAvisos').hidden, null, { timeout: 8000 });
    const f1 = await pc.evaluate(() => ({ av: document.getElementById('evAvisos').innerText.replace(/\s+/g, ' '), role: document.getElementById('evAvisos').getAttribute('role'), editable: !document.getElementById('btnEvGuardar').disabled && !document.getElementById('pobs-1').disabled && !document.querySelector('#pitem-2 .lik-btn').disabled }));
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
    await pc.click('#tabExp-pb'); await pc.waitForSelector('#evDeltaTabla', { timeout: 8000 });
    const pbTras = (await get(`/protocolo/${pbPrimero.id}`)).json;
    const filasT = await pc.evaluate(() => Object.fromEntries([...document.querySelectorAll('#evDeltaTabla tbody tr')].map((tr) => [tr.dataset.delta, tr.querySelector('td.num').innerText.trim()])));
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
    for (const [id, tab, sel] of [[idSinCi, 'lb', '#evResumen'], [idSinCi, 'pa', '#evResumen'], [idSofia, 'pb', '#evDeltaTabla'], [idMartin3, 'lb', '#evBanda']]) {
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

    /* «Salir» con el diálogo de edición abierto (la app está inerte tras el diálogo: se invoca logout() como lo hace el botón) */
    await abrirEdicion();
    const antes = await pj.evaluate((cs) => cs.map((c) => document.getElementById(c).value), campos);
    await pj.evaluate(() => logout());
    const e1 = await estadoDialogo();
    check('3c-j2', 'con el diálogo de edición abierto, «Salir» deja f_nombre, f_ci, f_ref, f_tel y f_motivo vacíos, WIZ.orig null y sin grupos en memoria (antes tenían datos de Martín)',
      antes[0] !== '' && antes[1] !== '' && e1.vacios && e1.orig === null && e1.grupos === 0 && e1.login && !e1.abierto, `antes=[${antes.slice(0, 2)}…] después vacíos=${e1.vacios}`);
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
      const g = sin.grupo; const gAntes = (GRUPOS_FOTOS[g] || []).length; go('grupos'); renderGrupoDetalle(g);
      const hayCargaGrupal = !!document.getElementById('gf_desc_' + g), txtGrupo = document.getElementById('view-grupos').innerText;
      subirFotoGrupo(g);
      return { sin: sin.id, individual: sin.fotos.length - antes, grupal: (GRUPOS_FOTOS[g] || []).length - gAntes, hayCargaGrupal,
        toast: tost ? tost.textContent : '', txtGrupo: /deshabilitada|bloquead/i.test(txtGrupo) };
    });
    check('3c-j9b', 'en el expediente de EJEMPLO sin autorización de imagen se guarda una foto individual y una grupal: sin bloqueo, sin «Carga deshabilitada» ni «bloqueada» (§5.99)',
      fotos.sin !== null && fotos.individual === 1 && fotos.grupal === 1 && fotos.hayCargaGrupal && !fotos.txtGrupo && !/bloquead|🚫/i.test(fotos.toast), JSON.stringify(fotos));

    /* la marca «Demo parcialmente conectada» no tapa contenido a 1280×800 y 1280×900 */
    const marcas = [];
    for (const alto of [800, 900]) {
      await pj.setViewportSize({ width: 1280, height: alto });
      for (const vista of ['inicio', 'expediente']) {
        await pj.evaluate((v) => { if (v === 'inicio') go('inicio'); else abrirExpediente(+document.querySelector('#tbodyNNA tr[data-hce]')?.dataset.hce || 1); }, vista);
        await pj.waitForTimeout(vista === 'expediente' ? 700 : 100);
        marcas.push(await pj.evaluate(([v, a]) => {
          const t = document.querySelector('.demo-tag').getBoundingClientRect();
          const visibles = [...document.querySelectorAll('main table, main .info-card, main .card, main h1, main .exp-head')].filter((e) => e.offsetParent !== null);
          const choca = visibles.filter((e) => { const r = e.getBoundingClientRect(); return !(t.right <= r.left || t.left >= r.right || t.bottom <= r.top || t.top >= r.bottom); });
          return { v, a, choca: choca.length, pe: getComputedStyle(document.querySelector('.demo-tag')).pointerEvents, pos: getComputedStyle(document.querySelector('.demo-tag')).position, visible: t.width > 0 };
        }, [vista, alto]));
      }
    }
    await pj.setViewportSize({ width: 1280, height: 720 });
    check('3c-j10', 'la marca «Demo parcialmente conectada a la API» (pointer-events:none, en flujo dentro de la barra lateral) no toca ninguna tabla ni tarjeta del contenido a 1280×800 y 1280×900, en el listado y en un expediente',
      marcas.every((m) => m.choca === 0 && m.pe === 'none' && m.pos !== 'fixed' && m.visible), JSON.stringify(marcas.map((m) => `${m.v}@${m.a}:${m.choca}`)));
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
      { k: 'pa', pref: '5', crear: (id) => send('POST', `/hce/${id}/protocolo`, { ...cuerpoC, tipo: 'A' }), ruta: (d) => `/protocolo/${d.id}`, tocar: '#pitem-1 .lik-btn[data-v="2"]' },
      { k: 'pb', pref: '6', crear: (id) => send('POST', `/hce/${id}/protocolo`, { ...cuerpoC, tipo: 'B' }), ruta: (d) => `/protocolo/${d.id}`, tocar: '#pitem-1 .lik-btn[data-v="2"]' }
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
    const fuentes = await Promise.all(['informe-cierre.js', 'hce-doc-org-vf.js'].map(async (f) => (await (await fetch(DEMO + '/js/' + f)).text())));
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
    await pe.focus('#expHead .btn-primary'); await pe.keyboard.press('Enter');
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
    await pe.focus('#expHead .btn-primary'); await pe.keyboard.press('Enter');
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
    const js = await Promise.all(['catalogos.js', 'ui-core.js', 'evaluaciones.js', 'informe-cierre.js', 'hce-doc-org-vf.js', 'expediente.js', 'flujo.js'].map(async (f) => [f, await (await fetch(DEMO + '/js/' + f)).text()]));
    const css = await (await fetch(DEMO + '/css/estilos.css')).text();
    const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '');
    const lineasConEstado = (t) => sinComentarios(t).split('\n').filter((l) => /var\(--(ok|warn|bad)\)/.test(l));
    const enBandas = js.filter(([f]) => f === 'catalogos.js').flatMap(([, t]) => lineasConEstado(sinComentarios(t).split('\n').filter((l) => /IDEA_BANDAS|^\s*\{max:/.test(l)).join('\n')));
    const reglasClinicas = sinComentarios(css).split('}').filter((r) => /(\.banda-|\.score-badge|\.banda-chip|\.vf-cat)/.test(r.split('{')[0]) && /--(ok|warn|bad)\b/.test(r));
    const demo = await pv.evaluate(() => ({ bandas: IDEA_BANDAS.every((b) => Number.isInteger(b.paso) && b.paso >= 1 && b.paso <= 6 && !('color' in b)), colorBanda: typeof colorBanda, pasos: IDEA_BANDAS.map((b) => b.paso).join('') }));
    await pv.evaluate(() => { go('analitica'); });
    await pv.waitForTimeout(150);
    const ana = await pv.evaluate(() => ({ bandasFill: [...document.querySelectorAll('#distChart .fill')].map((f) => f.getAttribute('style')), cifrasFuera: document.querySelectorAll('#view-analitica .hbar-num').length, textoEnFill: [...document.querySelectorAll('#view-analitica .fill')].filter((f) => f.textContent.trim()).length,
      heat: [...document.querySelectorAll('.heat-cell')].map((c) => [getComputedStyle(c).backgroundColor, getComputedStyle(c).color]) }));
    check('3e-color1', 'la regla de color: las 6 bandas del IDEA del modo demostración usan un paso de la rampa de un solo matiz (sin ok/warn/bad, sin colorBanda), la distribución por banda de Analítica pinta con var(--rampa-N) y ninguna regla de .banda-*/.score-badge del CSS usa ok/warn/bad',
      demo.bandas && demo.colorBanda === 'undefined' && demo.pasos === '123456' && enBandas.length === 0 && reglasClinicas.length === 0 && ana.bandasFill.length === 6 && ana.bandasFill.every((s) => /var\(--rampa-[1-6]\)/.test(s) && !/--(ok|warn|bad)/.test(s)),
      JSON.stringify({ demo, enBandas: enBandas.length, reglasClinicas: reglasClinicas.length, fills: ana.bandasFill.length }));
    check('3e-color2', 'Analítica (modo demostración): las cifras de las barras viven fuera del relleno (nada de texto sobre el color de la serie) y cada celda del heatmap usa un texto elegido contra su fondo',
      ana.cifrasFuera >= 10 && ana.textoEnFill === 0 && ana.heat.length === 24, JSON.stringify({ cifrasFuera: ana.cifrasFuera, textoEnFill: ana.textoEnFill, celdas: ana.heat.length }));
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
    for (const k of ['doc', 'org', 'inc', 'pai', 'sev', 'log', 'lb']) {
      await pv.evaluate((t) => selTabExp(t), k);
      await pv.waitForFunction(() => !/Cargando/.test(document.getElementById('panelExp').innerText), null, { timeout: 8000 });
      await pv.waitForTimeout(80);
      paneles[k] = await pv.evaluate(() => ({ ti: document.getElementById('panelExp').getAttribute('tabindex'), operables: document.querySelectorAll('#panelExp button:not([disabled]), #panelExp a[href], #panelExp input, #panelExp select, #panelExp textarea, #panelExp summary').length }));
    }
    await pv.evaluate(() => selTabExp('doc'));
    await pv.waitForTimeout(80);
    await pv.focus('#tabExp-doc'); await pv.keyboard.press('Tab');
    const tabAlPanel = await pv.evaluate(() => document.activeElement.id);
    check('3e-panel', 'los módulos en modo demostración (DOC, ORG, INC, PAI, SEV, LOG) no tienen nada operable: su #panelExp lleva tabindex="0" y Tab desde la pestaña llega al panel; en LB (con controles adentro) no lleva tabindex',
      ['doc', 'org', 'inc', 'pai', 'sev', 'log'].every((k) => paneles[k].ti === '0' && paneles[k].operables === 0) && paneles.lb.ti === null && paneles.lb.operables > 0 && tabAlPanel === 'panelExp', JSON.stringify({ paneles, tabAlPanel }).slice(0, 420));

    /* ---------- 3e-demo: el panel «Modo demostración» y la marca «Solo demo» son idénticos en todas partes ---------- */
    const firmas = new Set(), marcas = new Set(); let nPaneles = 0, nMarcas = 0;
    const leer = async (nombre) => { const r = await pv.evaluate(() => ({
      paneles: [...document.querySelectorAll('.demo-panel')].filter((e) => e.offsetParent !== null).map((e) => [e.getAttribute('role'), e.className, [...e.querySelectorAll('*')].map((c) => c.tagName + '.' + c.className).join('>'), (e.querySelector('b') || {}).textContent]),
      marcas: [...document.querySelectorAll('.solo-demo')].filter((e) => e.offsetParent !== null).map((e) => [e.tagName, e.className, e.textContent.trim()]) }));
      r.paneles.forEach((p) => { firmas.add(JSON.stringify(p)); nPaneles++; }); r.marcas.forEach((m) => { marcas.add(JSON.stringify(m)); nMarcas++; }); };
    for (const v of ['pendientes', 'analitica', 'grupos', 'inclusion', 'ateneos']) { await pv.evaluate((x) => go(x), v); await pv.waitForTimeout(60); await leer(v); }
    await pv.evaluate(() => { go('usuarios'); renderUsuario(); }); await pv.waitForTimeout(60); await leer('usuarios');
    await pv.evaluate(() => abrirExpedienteDemo(102)); await pv.waitForTimeout(100); await leer('ejemplo');
    await pv.evaluate((i) => abrirExpediente(i), idMartinV); await pv.waitForSelector('#expTitulo'); await pv.waitForFunction(() => !!EXP.flujo, null, { timeout: 8000 });
    for (const k of ['doc', 'org', 'inc', 'pai', 'sev', 'log']) { await pv.evaluate((t) => selTabExp(t), k); await pv.waitForTimeout(60); await leer(k); }
    await pv.evaluate((t) => selTabExp(t), 'vf'); await pv.waitForFunction(() => !/Cargando/.test(document.getElementById('panelExp').innerText), null, { timeout: 8000 });
    await pv.evaluate(() => { const g = document.querySelector('.vf-guia'); if (g) g.open = true; }); await leer('vf');
    const sinTitulos = [...firmas].map((f) => JSON.parse(f));
    check('3e-demo', 'el panel «Modo demostración» (role=note, glifo, título «Modo demostración — no se guarda») y la marca «Solo demo» son idénticos en todas las vistas y pestañas no conectadas: una sola estructura, un solo texto',
      nPaneles >= 11 && firmas.size === 1 && sinTitulos[0][0] === 'note' && sinTitulos[0][3] === 'Modo demostración — no se guarda' && nMarcas >= 6 && marcas.size === 1 && JSON.parse([...marcas][0])[2] === 'Solo demo', JSON.stringify({ nPaneles, estructuras: firmas.size, nMarcas, marcasDistintas: marcas.size }));
    await cv.close();
  }

  check('z', 'sin errores de JavaScript en la página durante toda la corrida', erroresPagina.length === 0, erroresPagina.join(' | '));
  await browser.close();

  const mal = resultados.filter((r) => !r.ok);
  console.log(`\n${resultados.length - mal.length}/${resultados.length} verificaciones OK` + (mal.length ? `  —  FALLAN: ${mal.map((r) => r.id).join(', ')}` : ''));
  process.exit(mal.length ? 1 : 0);
})().catch((e) => { console.error('ERROR del script:', e); process.exit(1); });
