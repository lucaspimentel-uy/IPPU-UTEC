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
 * Uso:  IPPU_DEMO_PASSWORD=... node conectada.js
 * Opcionales: API=http://localhost:8000  DEMO=http://localhost:5500
 *             IPPU_DEMO_EMAIL=gonzalez@demo.ippu.test   HEADED=1
 * Sale 0 si todo pasa, 1 si algo falla (o si la API/la demo no están arriba).
 */
const { chromium } = require('playwright');

const API = process.env.API || 'http://localhost:8000';
const DEMO = process.env.DEMO || 'http://localhost:5500';
const EMAIL = process.env.IPPU_DEMO_EMAIL || 'gonzalez@demo.ippu.test';
const PASSWORD = process.env.IPPU_DEMO_PASSWORD;

const resultados = [];
function check(id, nombre, ok, detalle) {
  resultados.push({ id, nombre, ok: !!ok, detalle: detalle || '' });
  console.log(`${ok ? 'PASS' : 'FAIL'}  (${id}) ${nombre}${detalle ? '  → ' + detalle : ''}`);
}

async function preflight() {
  if (!PASSWORD) { console.error('Falta IPPU_DEMO_PASSWORD (contraseña del técnico de la demo).'); process.exit(1); }
  for (const [nombre, url] of [['API', API + '/health'], ['demo', DEMO + '/index.html']]) {
    try { const r = await fetch(url); if (!r.ok) throw new Error('HTTP ' + r.status); }
    catch (e) { console.error(`No responde la ${nombre} en ${url} (${e.message}). Ver README.md → «Demo conectada».`); process.exit(1); }
  }
}

const urlDemo = (q) => DEMO + '/index.html' + (q || '');
const txt = (page, sel) => page.locator(sel).first().innerText();

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
    check('pre', 'el login NO trae usuario ni contraseña precargados',
      (await page.inputValue('#loginUser')) === '' && (await page.inputValue('#loginPass')) === '');
    const dlg = await page.evaluate(() => {
      const d = document.getElementById('loginScreen');
      const lab = document.getElementById(d.getAttribute('aria-labelledby') || '');
      return { role: d.getAttribute('role'), modal: d.getAttribute('aria-modal'), nombre: lab ? lab.textContent.trim() : '',
        inertTop: document.querySelector('header.topbar').inert, inertLayout: document.querySelector('div.layout').inert };
    });
    check('l1', 'el login es un diálogo modal con nombre accesible y el resto de la app está inerte mientras se ve',
      dlg.role === 'dialog' && dlg.modal === 'true' && dlg.nombre !== '' && dlg.inertTop && dlg.inertLayout, JSON.stringify(dlg));
    await page.focus('#loginBtn');
    const visitados = [];
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press(i % 2 ? 'Shift+Tab' : 'Tab');
      visitados.push(await page.evaluate(() => { const a = document.activeElement; return { id: a.id, tag: a.tagName, fuera: !!a.closest('header.topbar, div.layout') }; }));
    }
    check('l2', 'con el login a la vista, Tab/Shift+Tab desde «Ingresar» nunca llega al chip de usuario ni a la app de atrás',
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
    check('b', 'contraseña incorrecta: error en role="alert", con foco, sessionStorage vacío, sigue en el login',
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
  check('a', 'login del técnico de la demo: el chip muestra su nombre y rol (de la API)',
    usuarioSS && chip === usuarioSS.nombre && chip === 'Dr. González' && chipRol === 'Técnico' && !!tokenSS,
    `chip="${chip}" rol="${chipRol}" usuario(sessionStorage)=${usuarioSS && usuarioSS.nombre}/${usuarioSS && usuarioSS.rol}`);

  const tras = await page.evaluate(() => ({ foco: document.activeElement.id, tag: document.activeElement.tagName,
    inert: document.querySelector('header.topbar').inert || document.querySelector('div.layout').inert,
    tabindex: document.getElementById('tituloInicio').getAttribute('tabindex') }));
  check('l3', 'tras un login correcto el foco va al título principal de Inicio (tabindex=-1) y la app deja de estar inerte',
    tras.foco === 'tituloInicio' && tras.tag === 'H1' && tras.tabindex === '-1' && !tras.inert, JSON.stringify(tras));

  /* ---------- (c) conteos del listado y filtro de grupo (== tests/test_m11_5a_seed_demo.py) ---------- */
  await esperarResumen(page, 'Mostrando 7 de 7');
  const kpiTotal = (await txt(page, '#kpiTotal')).trim();
  check('c1', 'activos: «Mostrando 7 de 7» (Tomás, dado de baja, no aparece) y KPI de activos = 7',
    (await filas(page)) === 7 && kpiTotal === '7', `filas=${await filas(page)} kpiTotal=${kpiTotal} resumen="${await txt(page, '#listaResumen')}"`);

  await page.click('.chip-estado[data-estado="todos"]');
  await esperarResumen(page, 'Mostrando 8 de 8');
  check('c2', 'todos (incluir_inactivos): «Mostrando 8 de 8»', (await filas(page)) === 8, `filas=${await filas(page)}`);

  await page.click('.chip-estado[data-estado="inactivos"]');
  await esperarResumen(page, 'Mostrando 1 de 1');
  const inactivoNombre = await txt(page, '#tbodyNNA tr[data-hce] td.nna-name');
  check('c3', 'inactivos (filtro en el cliente): 1 fila — Tomás', (await filas(page)) === 1 && inactivoNombre === 'Tomás', `fila="${inactivoNombre}"`);

  // Grupos: con incluir_inactivos (Todos) → 3 / 3 / 2, como afirma el test del seed.
  await page.click('.chip-estado[data-estado="todos"]');
  await esperarResumen(page, 'Mostrando 8 de 8');
  const opciones = await page.$$eval('#filtroGrupo option', (os) => os.map((o) => o.textContent.trim()));
  check('c4', 'el filtro de grupo sale de GET /grupos (año en curso): 5 grupos reales + «Todos»',
    JSON.stringify(opciones) === JSON.stringify(['Todos', 'Adolescentes', 'Escolares', 'Inicial', 'Preadolescentes', 'Taller de Adolescentes']),
    opciones.join(' | '));
  const esperadoGrupo = { Escolares: 3, Preadolescentes: 3, Adolescentes: 2 };
  for (const [grupo, n] of Object.entries(esperadoGrupo)) {
    await page.selectOption('#filtroGrupo', { label: grupo });
    await esperarResumen(page, `Mostrando ${n} de ${n}`);
    const celdas = await page.$$eval('#tbodyNNA tr[data-hce] td:nth-child(6)', (tds) => tds.map((t) => t.textContent.trim()));
    check('c5-' + grupo, `grupo ${grupo} con inactivos: ${n} filas, todas del grupo`,
      (await filas(page)) === n && celdas.every((c) => c === grupo), `filas=${await filas(page)} grupos=${[...new Set(celdas)].join(',')}`);
  }
  await page.click('.chip-estado[data-estado="activos"]');   // Adolescentes + activos → solo Valentina
  await esperarResumen(page, 'Mostrando 1 de 1');
  check('c6', 'grupo Adolescentes, solo activos: 1 fila (Tomás es el inactivo)', (await filas(page)) === 1);
  await page.selectOption('#filtroGrupo', { label: 'Todos' });
  await esperarResumen(page, 'Mostrando 7 de 7');

  /* ---------- (d) búsqueda: la regla de la caja (ui-core.js · consultaDeBusqueda) y su efecto real ---------- */
  const tabla = [['6.012.345-1', { ci: '60123451' }], ['60123451', { ci: '60123451' }], ['6012345', { ci: '6012345' }],
    ['123456', { numero: '123456' }], ['1002', { numero: '1002' }], ['601234', { numero: '601234' }],
    ['Martín', { nombre: 'Martín' }], ['  ', {}]];
  const mapeo = await page.evaluate((casos) => casos.map(([t]) => consultaDeBusqueda(t)), tabla);
  const malMapeo = tabla.filter(([t, esp], i) => JSON.stringify(mapeo[i]) !== JSON.stringify(esp)).map(([t]) => `«${t}»`);
  check('m0', 'consultaDeBusqueda: cédula (con separadores o 7+ dígitos) → ci · hasta 6 dígitos sin separadores → numero · texto → nombre',
    malMapeo.length === 0, malMapeo.length ? 'mal: ' + malMapeo.join(', ') : tabla.length + ' casos');

  let r = await buscar(page, '6.012.345-1');
  check('d', 'búsqueda por la cédula «6.012.345-1» → GET /hce?ci=60123451 → 1 fila: Martín',
    r.params.ci === '60123451' && !r.params.numero && !r.params.nombre && r.filas === 1 && /Martín/.test(r.html) && /6\.012\.345-1/.test(r.html),
    JSON.stringify(r.params) + ' filas=' + r.filas);
  r = await buscar(page, '60123451');
  check('m1', 'cédula de 8 dígitos sin separadores → ci → 1 fila: Martín', r.params.ci === '60123451' && !r.params.numero && r.filas === 1 && /Martín/.test(r.html), JSON.stringify(r.params) + ' filas=' + r.filas);
  r = await buscar(page, '6012345');
  check('m2', 'límite 7 dígitos sin separadores («6012345») → ci (no numero) → 1 fila: Martín', r.params.ci === '6012345' && !r.params.numero && r.filas === 1 && /Martín/.test(r.html), JSON.stringify(r.params) + ' filas=' + r.filas);
  r = await buscar(page, '601234');
  check('m3', 'límite 6 dígitos sin separadores («601234») → numero (no ci) → sin resultados (no existe esa HCE)', r.params.numero === '601234' && !r.params.ci && r.filas === 0 && /No se encontraron/.test(r.html), JSON.stringify(r.params) + ' filas=' + r.filas);
  r = await buscar(page, '1002');
  check('d2', 'búsqueda por N.º de HCE «1002» → GET /hce?numero=1002 → exactamente 1 fila: Martín, con N.º 1002',
    r.params.numero === '1002' && !r.params.ci && r.filas === 1 && /Martín/.test(r.html) && /^1002\b/.test(r.html.trim()), JSON.stringify(r.params) + ' filas=' + r.filas);
  r = await buscar(page, 'Mart');
  check('m4', 'búsqueda por nombre «Mart» → GET /hce?nombre=Mart → al menos 1 fila, con Martín', r.params.nombre === 'Mart' && !r.params.ci && !r.params.numero && r.filas >= 1 && /Martín/.test(r.html), JSON.stringify(r.params) + ' filas=' + r.filas);
  r = await buscar(page, 'zzzz');
  check('d3', 'búsqueda sin resultados: estado vacío con mensaje (no pantalla en blanco)', r.filas === 0 && /No se encontraron NNA/.test(r.html), JSON.stringify(r.params));
  await page.fill('#searchNNA', '');
  await esperarResumen(page, 'Mostrando 7 de 7');

  /* ---------- (e) Bruno: CI pendiente visible ---------- */
  const filaBruno = page.locator('#tbodyNNA tr[data-hce]', { hasText: 'Bruno' });
  const textoBruno = (await filaBruno.innerText()).replace(/\s+/g, ' ');
  const pillBruno = await filaBruno.locator('.st-ci-pend').count();
  const kpiCi = (await txt(page, '#kpiCi')).trim();
  check('e', 'la fila de Bruno muestra «CI pendiente» (texto + glifo, no solo color) y el KPI de CI pendiente = 1',
    /CI pendiente/.test(textoBruno) && pillBruno === 1 && kpiCi === '1', `fila="${textoBruno}" kpiCi=${kpiCi}`);
  const resto = await page.locator('#tbodyNNA tr[data-hce]', { hasNotText: 'Bruno' }).locator('.st-ci-pend').count();
  check('e2', 'ningún otro NNA del seed tiene el CI pendiente', resto === 0, `otros pendientes=${resto}`);

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
  check('f1', 'abrir Martín: HCE-00 con los valores de GET /hce/{id} y los técnicos del grupo (nombre + rol en el grupo)',
    faltan.length === 0 && titulo === `${api.persona.nombre} ${api.persona.apellido}` && /6\.012\.345-1/.test(exp),
    faltan.length ? 'faltan: ' + faltan.join(' | ') : `título="${titulo}" técnicos="${api.grupo.tecnico1.nombre} (${api.grupo.tecnico1.rol}) + ${api.grupo.tecnico2.nombre} (${api.grupo.tecnico2.rol})"`);
  check('f2', 'el foco queda en el título del expediente', foco === 'expTitulo', `foco=${foco}`);
  const flujoTxt = (await txt(page, '#panelExp')).replace(/\s+/g, ' ');
  check('f3', 'estado de los módulos del año desde GET /hce/{id}/flujo (Martín: ciclo completo)',
    /HCE-LB.*firmado.*HCE-PA.*firmado.*HCE-PB.*firmado.*HCE-IC.*firmado/.test(flujoTxt), flujoTxt.slice(flujoTxt.indexOf('Módulos del año'), flujoTxt.indexOf('Módulos del año') + 160));
  const ocultos = ['Talleres', 'Nivel de soporte', 'Historial clínico', 'Azul', 'Celeste', 'Naranja'].filter((t) => exp.includes(t));
  check('f4', 'lo que la API no guarda (talleres, nivel de soporte, historial) y los colores de grupo de la demo NO aparecen',
    ocultos.length === 0, ocultos.length ? 'aparece: ' + ocultos.join(',') : '');
  const edadEsperada = (() => { const n = new Date(api.persona.fecha_nac); const h = new Date(); let e = h.getFullYear() - n.getFullYear();
    if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getUTCDate())) e--; return e; })();
  check('f5', 'la edad sale de persona.fecha_nac (no hay columna edad)', new RegExp(`${edadEsperada} años`).test(exp), `esperada=${edadEsperada}`);
  const hayInputs = await page.locator('#view-expediente input, #view-expediente textarea, #view-expediente select').count();
  check('f6', 'HCE-00 de solo lectura: sin campos de edición', hayInputs === 0, `inputs=${hayInputs}`);

  /* Pestañas: un módulo no conectado muestra el panel de modo demostración y SIN datos; teclado. */
  await page.click('#tabExp-lb');
  const panelLb = (await txt(page, '#panelExp')).replace(/\s+/g, ' ');
  const tabSel = await page.getAttribute('#tabExp-lb', 'aria-selected');
  check('g1', 'pestaña no conectada (LB): panel «Modo demostración — no se guarda» con role="note" y badge «Solo demo»',
    /Modo demostración — no se guarda/.test(panelLb) && (await page.locator('#panelExp [role="note"]').count()) === 1 &&
    (await page.locator('#panelExp .solo-demo').count()) >= 1 && tabSel === 'true', panelLb.slice(0, 140));
  const textosTab = [];
  for (const k of ['hce00', 'ci', 'lb', 'pa', 'pb', 'ic', 'vf', 'doc', 'org', 'inc', 'pai', 'sev', 'log']) {
    await page.click('#tabExp-' + k);
    textosTab.push(k + ': ' + (await page.evaluate(() => document.getElementById('view-expediente').innerText + ' ' + [...document.querySelectorAll('#view-expediente [title]')].map((e) => e.title).join(' '))));
  }
  const tabsConFase = textosTab.filter((t) => /Fase\s*\d/.test(t)).map((t) => t.split(':')[0]);
  const sinFraseNueva = textosTab.slice(1).every((t) => /Este módulo todavía no está conectado al servidor\./.test(t));
  check('f1b', 'las 13 pestañas (texto y tooltips): sin «Fase …»; las 12 no conectadas dicen «Este módulo todavía no está conectado al servidor.»',
    tabsConFase.length === 0 && sinFraseNueva, tabsConFase.length ? 'con Fase: ' + tabsConFase.join(',') : '13/13');
  await page.click('#tabExp-lb');
  await page.focus('#tabExp-lb');
  await page.keyboard.press('ArrowRight');
  const sigSel = await page.getAttribute('#tabExp-pa', 'aria-selected');
  const sigFoco = await page.evaluate(() => document.activeElement && document.activeElement.id);
  check('g2', 'las pestañas se operan con teclado (flecha derecha: selecciona y enfoca la siguiente)', sigSel === 'true' && sigFoco === 'tabExp-pa', `foco=${sigFoco}`);

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
  check('g3', 'Pendientes, Analítica, Grupos, Inclusión, Ateneos y Usuarios muestran el panel «Modo demostración — no se guarda» (role="note")',
    sinPanel.length === 0, sinPanel.length ? 'sin panel: ' + sinPanel.join(',') : '6/6');
  check('u', '«Mi usuario» (vista de ejemplo) no afirma ser la cuenta con sesión iniciada',
    !/sesión iniciada|datos de la cuenta|mi perfil/i.test(await txt(page, '#view-usuarios')) && /Perfil de ejemplo/.test(await txt(page, '#view-usuarios')),
    (await txt(page, '#view-usuarios .pagedesc')).trim());
  const conFase = Object.entries(textoVistas).filter(([, t]) => /Fase\s*3|Fase\s*\d-[a-e]/.test(t)).map(([v]) => v);
  check('f0', 'ninguna vista visible menciona «Fase 3…» (las etapas son interna del equipo)', conFase.length === 0, conFase.join(',') || '6 vistas');
  await page.click('.navitem[data-view="grupos"]');
  const gruposTxt = await txt(page, '#view-grupos');
  await page.click('#gruposList button[onclick^="abrirExpedienteDemo"] >> nth=0');   // un NNA de la vista demo abre el expediente de EJEMPLO, rotulado
  await page.waitForSelector('#expedienteContent .demo-panel', { timeout: 5000 });
  check('g4', 'un NNA abierto desde una vista de demostración abre el expediente de EJEMPLO, con su panel (no mezcla ids de la API)',
    /Expediente de ejemplo/.test(await txt(page, '#expedienteContent .demo-panel')), gruposTxt.length + ' chars en Grupos');

  const humo = await page.evaluate(() => {
    try {
      go('idea'); cargarIDEA(101); go('prot'); cargarProt(101, 'pa'); cargarProt(102, 'pb'); go('ic'); cargarIC(102);
      generarInforme(102); abrirExpedienteDemo(102); renderUsuario(); renderNNA();
      return 'ok';
    } catch (e) { return 'ERROR: ' + e.message; }
  });
  const vistasDemo = await Promise.all(['idea', 'prot', 'ic', 'informe'].map((v) => page.locator(`#view-${v} .demo-panel`).count()));
  check('g5', 'los flujos de ejemplo (IDEA, PA/PB, IC, informe impreso, expediente de ejemplo) siguen andando y llevan su panel',
    humo === 'ok' && vistasDemo.every((n) => n === 1), `humo=${humo} paneles=${vistasDemo.join(',')}`);

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
  check('w', 'documentElement.scrollWidth == ancho de la ventana en la lista y en el HCE-00 a 390, 1024 y 1280 px',
    anchos.every((a) => a.lst[0] === a.lst[1] && a.hce[0] === a.hce[1]),
    anchos.map((a) => `${a.w}px: lista ${a.lst[0]}/${a.lst[1]} · HCE-00 ${a.hce[0]}/${a.hce[1]}`).join(' | '));

  /* ---------- (j) recarga con token válido: se mantiene la sesión ---------- */
  await page.goto(urlDemo());
  await page.waitForSelector('#loginScreen.hidden', { state: 'attached', timeout: 8000 });
  await esperarResumen(page, 'Mostrando 7 de 7');
  check('j', 'recargar la página con token guardado: se valida con GET /auth/yo y no pide login', (await txt(page, '#userNombre')).trim() === 'Dr. González');

  /* ---------- (h) logout ---------- */
  await page.click('.btn-exit');
  const login = await page.isVisible('#loginScreen');
  const ssTrasLogout = await page.evaluate(() => sessionStorage.length);
  const tbodyVacio = (await page.locator('#tbodyNNA').innerHTML()).trim() === '';
  const expVacio = (await page.locator('#expedienteContent').innerHTML()).trim() === '';
  check('h', 'logout: vuelve a la pantalla de login, sessionStorage vacío y sin datos de NNA detrás',
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
    check('i', 'token inválido guardado: se valida, da 401, vuelve al login con aviso y sessionStorage limpio',
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
    check('k', 'API inalcanzable (?api=…): mensaje legible, sin sesión, y el login muestra a qué API se envía la contraseña',
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
    check('s1', '«Salir» con el detalle del expediente en vuelo: al llegar la respuesta, #expedienteContent sigue vacío, EXP sin datos y la vista no cambia',
      e1.html === '' && e1.hce === null && e1.flujo === null && e1.id === null && !e1.expActiva && e1.login && e1.ss === 0, JSON.stringify(e1));
    await p4.unroute(reDetalle);

    // recarga del estado de módulos: primero se cae el flujo, después se reintenta con la respuesta lenta y se sale
    const reFlujo = /\/hce\/\d+\/flujo$/;
    await loguear(p4);
    await esperarResumen(p4, 'Mostrando 7 de 7');
    await p4.route(reFlujo, (route) => route.abort());
    await p4.locator('#tbodyNNA tr[data-hce]', { hasText: 'Martín' }).getByRole('button', { name: /Abrir expediente/ }).click();
    await p4.waitForSelector('#panelExp >> text=No se pudo cargar el estado de los módulos', { timeout: 8000 });
    await p4.unroute(reFlujo);
    await p4.route(reFlujo, async (route) => { await new Promise((x) => setTimeout(x, 1500)); await route.continue(); });
    await p4.getByRole('button', { name: 'Reintentar' }).click();
    await p4.click('.btn-exit');                       // «Salir» con la recarga del flujo en vuelo
    await p4.waitForTimeout(2800);
    const e2 = await p4.evaluate(() => ({ html: document.getElementById('expedienteContent').innerHTML.trim(), hce: EXP.hce, flujo: EXP.flujo,
      flujoError: EXP.flujoError, id: EXP.id, login: !document.getElementById('loginScreen').classList.contains('hidden') }));
    check('s2', '«Salir» con la recarga del flujo en vuelo: al llegar la respuesta no se pinta nada ni queda estado del NNA',
      e2.html === '' && e2.hce === null && e2.flujo === null && e2.flujoError === false && e2.id === null && e2.login, JSON.stringify(e2));
    await c4.close();
  }

  check('z', 'sin errores de JavaScript en la página durante toda la corrida', erroresPagina.length === 0, erroresPagina.join(' | '));
  await browser.close();

  const mal = resultados.filter((r) => !r.ok);
  console.log(`\n${resultados.length - mal.length}/${resultados.length} verificaciones OK` + (mal.length ? `  —  FALLAN: ${mal.map((r) => r.id).join(', ')}` : ''));
  process.exit(mal.length ? 1 : 0);
})().catch((e) => { console.error('ERROR del script:', e); process.exit(1); });
