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
  await page.click('#tabExp-vf');
  const panelLb = (await txt(page, '#panelExp')).replace(/\s+/g, ' ');
  const tabSel = await page.getAttribute('#tabExp-vf', 'aria-selected');
  check('3a-g1', 'pestaña no conectada (VF): panel «Modo demostración — no se guarda» con role="note" y badge «Solo demo»',
    /Modo demostración — no se guarda/.test(panelLb) && (await page.locator('#panelExp [role="note"]').count()) === 1 &&
    (await page.locator('#panelExp .solo-demo').count()) >= 1 && tabSel === 'true', panelLb.slice(0, 140));
  const textosTab = [];
  for (const k of ['hce00', 'ci', 'lb', 'pa', 'pb', 'ic', 'vf', 'doc', 'org', 'inc', 'pai', 'sev', 'log']) {
    await page.click('#tabExp-' + k);
    textosTab.push(k + ': ' + (await page.evaluate(() => document.getElementById('view-expediente').innerText + ' ' + [...document.querySelectorAll('#view-expediente [title]')].map((e) => e.title).join(' '))));
  }
  const tabsConFase = textosTab.filter((t) => /Fase\s*\d/.test(t)).map((t) => t.split(':')[0]);
  const sinFraseNueva = textosTab.slice(5).every((t) => /Este módulo todavía no está conectado al servidor\./.test(t));
  check('3a-f1b', 'las 13 pestañas (texto y tooltips): sin «Fase …»; HCE-00, CI, LB, PA y PB están conectadas y las otras 8 dicen «Este módulo todavía no está conectado al servidor.»',
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
      go('ic'); cargarIC(102);
      generarInforme(102); abrirExpedienteDemo(102); renderUsuario(); renderNNA();
      return 'ok';
    } catch (e) { return 'ERROR: ' + e.message; }
  });
  const vistasDemo = await Promise.all(['ic', 'informe'].map((v) => page.locator(`#view-${v} .demo-panel`).count()));
  check('3a-g5', 'los flujos de ejemplo que quedan en modo demostración (IC, informe impreso, expediente de ejemplo) siguen andando y llevan su panel',
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
    await p5.keyboard.press('Escape');

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
        await pc.waitForFunction(() => document.getElementById('evResumen') || document.getElementById('evTotal') || document.querySelector('#panelExp .empty-state'), null, { timeout: 8000 });
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
    await pj.keyboard.press('Escape');
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
    await pj.keyboard.press('Escape');

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
    await pj.keyboard.press('Escape');

    /* demo de ejemplo: ni candados, ni «Bloqueado», ni modal de excepción — ni siquiera con el CI pendiente (Bruno, 107) */
    const demo = await pj.evaluate(() => {
      const salida = {};
      [107, 104, 102].forEach((id) => { abrirExpedienteDemo(id); const f = document.getElementById('flujoPanelBody');
        salida[id] = { txt: f.innerText, bloqueados: document.querySelectorAll('.fstep.s-bloqueado, .mb-bloqueado').length, candado: /🔒|Bloquead|excepci|Habilitar/i.test(f.innerText) }; });
      go('grupos'); salida.grupos = /🔒|Bloquead|excepci/i.test(document.getElementById('view-grupos').innerText);
      return { salida, funciones: [typeof openExcepcionModal, typeof habilitarExcepcional, typeof confirmarExcepcion], modal: !!document.getElementById('mfMotivo') };
    });
    check('3c-j9', 'el expediente de EJEMPLO (también Bruno, sin CI) y la vista Grupos no muestran candados, «Bloqueado», «excepción» ni «Habilitar»; el modal y las funciones de excepción ya no existen',
      Object.entries(demo.salida).filter(([k]) => k !== 'grupos').every(([, v]) => !v.candado && v.bloqueados === 0) && demo.salida.grupos === false && demo.funciones.every((t) => t === 'undefined') && !demo.modal, JSON.stringify(demo.funciones));

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

  check('z', 'sin errores de JavaScript en la página durante toda la corrida', erroresPagina.length === 0, erroresPagina.join(' | '));
  await browser.close();

  const mal = resultados.filter((r) => !r.ok);
  console.log(`\n${resultados.length - mal.length}/${resultados.length} verificaciones OK` + (mal.length ? `  —  FALLAN: ${mal.map((r) => r.id).join(', ')}` : ''));
  process.exit(mal.length ? 1 : 0);
})().catch((e) => { console.error('ERROR del script:', e); process.exit(1); });
