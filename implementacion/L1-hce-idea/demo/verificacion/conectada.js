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
 * ⚠️ Desde la Fase 3-b la corrida ESCRIBE (crea un expediente, lo edita, registra su CI): los conteos del
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
  const pasosM = await page.$$eval('#flujoWrap .fl-btn', (bs) => bs.map((b) => b.getAttribute('aria-label')));
  const flujoM = (await txt(page, '#flujoWrap')).replace(/\s+/g, ' ');
  check('f3', 'stepper del flujo desde GET /hce/{id}/flujo (Martín: CI registrado + LB, PA, PB, IC firmados), con texto y glifo de estado',
    JSON.stringify(pasosM) === JSON.stringify(['Línea base (IDEA): firmado', 'Protocolo A: firmado', 'Protocolo B: firmado', 'Informe de cierre: firmado']) &&
    /Registrado/.test(flujoM) && /flujo del año \d{4}/i.test(flujoM) && /●/.test(flujoM), flujoM.slice(0, 150));
  const ocultos = ['Talleres', 'Nivel de soporte', 'Historial clínico', 'Tendencia', 'Bloquead', '🔒', 'Azul', 'Celeste', 'Naranja'].filter((t) => exp.includes(t));
  check('f4', 'lo que la API no guarda (talleres, nivel de soporte, historial, tendencia) y los colores de grupo de la demo NO aparecen; tampoco candados ni «Bloqueado»',
    ocultos.length === 0, ocultos.length ? 'aparece: ' + ocultos.join(',') : '');
  const edadEsperada = (() => { const n = new Date(api.persona.fecha_nac); const h = new Date(); let e = h.getFullYear() - n.getFullYear();
    if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getUTCDate())) e--; return e; })();
  check('f5', 'la edad sale de persona.fecha_nac (no hay columna edad)', new RegExp(`${edadEsperada} años`).test(exp), `esperada=${edadEsperada}`);
  const hayInputs = await page.locator('#view-expediente input, #view-expediente textarea, #view-expediente select').count();
  check('f6', 'HCE-00 se lee como texto (sin campos sueltos en la vista); la edición va en un diálogo que se abre con «Editar datos»',
    hayInputs === 0 && (await page.locator('#expHead >> text=✎ Editar datos').count()) === 1, `inputs=${hayInputs}`);

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
  const sinFraseNueva = textosTab.slice(2).every((t) => /Este módulo todavía no está conectado al servidor\./.test(t));
  check('f1b', 'las 13 pestañas (texto y tooltips): sin «Fase …»; HCE-00 y CI están conectadas y las otras 11 dicen «Este módulo todavía no está conectado al servidor.»',
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
    await p4.waitForSelector('#flujoWrap >> text=No se pudo cargar el estado de los módulos', { timeout: 8000 });
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

    check('api', 'ítem 8: la demo habla con la API de esta corrida (?api=) — API_BASE == API',
      (await p5.evaluate(() => API_BASE)) === API.replace(/\/+$/, ''), await p5.evaluate(() => API_BASE));

    /* ---------- diálogo: accesibilidad básica, Esc, foco ---------- */
    await p5.click('#btnNuevoNNA');
    await p5.waitForSelector('#modalAlta.open');
    const dlg2 = await p5.evaluate(() => { const m = document.querySelector('#modalAlta .modal'); return { role: m.getAttribute('role'), modal: m.getAttribute('aria-modal'),
      nombre: document.getElementById(m.getAttribute('aria-labelledby')).textContent.trim(), inert: document.querySelector('div.layout').inert && document.querySelector('header.topbar').inert,
      foco: document.activeElement.id, texto: m.innerText }; });
    check('m5', 'el alta es un diálogo modal (role/aria-modal/nombre), deja la app inerte, toma el foco y NO ofrece nivel de apoyo ni talleres',
      dlg2.role === 'dialog' && dlg2.modal === 'true' && dlg2.nombre !== '' && dlg2.inert && dlg2.foco === 'modalTitle' && !/Nivel de apoyo|Taller|soporte/i.test(dlg2.texto),
      JSON.stringify({ role: dlg2.role, modal: dlg2.modal, inert: dlg2.inert, foco: dlg2.foco }));
    await p5.keyboard.press('Escape');
    const trasEsc = await p5.evaluate(() => ({ abierto: document.getElementById('modalAlta').classList.contains('open'), inert: document.querySelector('div.layout').inert, foco: document.activeElement.id }));
    check('m6', 'Esc cierra el diálogo, la app deja de estar inerte y el foco vuelve al botón que lo abrió',
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
    check('f', 'cédula vacía → error junto al campo (aria-invalid + aria-describedby→mensaje), resumen role="alert" con foco, sigue en el paso 1 y NO se manda ningún POST',
      f1.invalido === 'true' && /err_f_ci/.test(f1.desc) && f1.err !== '' && f1.resumenVisible && f1.rol === 'alert' && f1.foco === 'altaErrores' && f1.paso === '1' && postsAntes.length === 0,
      JSON.stringify({ ...f1, resumen: f1.resumen.replace(/\s+/g, ' ') }));
    check('f-req', 'los cuatro obligatorios que exige PersonaCrear están marcados como tales (aria-required) en el formulario',
      (await p5.$$eval('#modalAlta [aria-required="true"]', (e) => e.map((x) => x.id).sort())).join(',') === 'f_apellido,f_ci,f_nac,f_nombre');

    /* ---------- (a) alta como técnico ---------- */
    await p5.fill('#f_ci', ciTipeada);
    await p5.click('#btnNext');
    await p5.waitForFunction(() => document.querySelector('.wizard-step.active').dataset.step === '2');
    await p5.fill('#f_dx', 'TEA — en proceso diagnóstico');
    await p5.selectOption('#f_grupo', { label: 'Escolares' });
    const tecnicos = (await txt(p5, '#f_tecnicos')).replace(/\s+/g, ' ');
    check('t1', 'al elegir el grupo se muestran SUS técnicos (Dr. González · Mtra. Torres) y no hay selectores de técnico por NNA',
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
    check('a1', 'alta con el asistente: POST /hce con persona + grupo_id (id real de GET /grupos), anamnesis completa, SIN nivel de soporte ni talleres, y abre el expediente nuevo',
      reqA.persona.ci === ciTipeada && reqA.persona.nombre === nombreNuevo && reqA.grupo_id === grupoEscolares.id && reqA.diagnostico === 'TEA — en proceso diagnóstico' &&
      Object.keys(reqA.anamnesis).sort().join(',') === 'desarrollo,familiares,motivo,observaciones,perinatal' &&
      !Object.keys(reqA).some((k) => /soporte|apoyo|taller|tecnico/i.test(k)) && apiNuevo.persona.ci === ciNueva && apiNuevo.grupo.nombre === 'Escolares',
      JSON.stringify(reqA).slice(0, 220));
    check('a2', 'la revisión del paso 4 muestra N.º de HC «se asigna el siguiente» y los técnicos del grupo',
      /N\.º de HC se asigna el siguiente/.test(review) && /Dr\. González/.test(review), review.slice(0, 200));
    const cabecera = (await txt(p5, '#expHead')).replace(/\s+/g, ' ');
    check('a3', 'el expediente nuevo se abre con «N.º de HC <hc_historico>» (nunca el id interno) y el foco en el título',
      new RegExp(`N\\.º de HC ${apiNuevo.hc_historico}\\b`).test(cabecera) && (await focoId(p5)) === 'expTitulo' && apiNuevo.hc_historico >= 1000 && String(apiNuevo.hc_historico) !== String(idNuevo),
      `hc=${apiNuevo.hc_historico} id=${idNuevo}`);
    await p5.click('.exp-head .btn-ghost');                       // ‹ Volver al listado
    await p5.fill('#searchNNA', nombreNuevo);
    await p5.waitForFunction((n) => document.getElementById('tbodyNNA').textContent.includes(n), nombreNuevo, { timeout: 8000 });
    const filaNueva = (await p5.locator('#tbodyNNA tr[data-hce]', { hasText: nombreNuevo }).innerText()).replace(/\s+/g, ' ');
    check('a4', 'el expediente nuevo aparece en el listado con «CI pendiente»', /CI pendiente/.test(filaNueva) && /Escolares/.test(filaNueva), filaNueva);

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
    check('b', '409 por cédula repetida como TÉCNICO: mensaje genérico «consultá a dirección», sin nombrar el campo, foco en el resumen role="alert", el diálogo sigue abierto',
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
      check('c', '409 por cédula repetida como ADMIN: «Ya existe una persona con esa cédula» junto al campo cédula (aria-invalid + describedby), vuelve al paso 1, foco en el resumen',
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
    check('d0', 'editar: el formulario se precarga desde la API (cédula con formato, grupo, N.º de HC, anamnesis)',
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
    check('d1', 'editar un campo: PATCH /hce/{id} con SOLO ese campo; el cuadro lo muestra desde la respuesta y GET /hce/{id} coincide',
      JSON.stringify(Object.keys(bodyEd)) === '["medicacion"]' && bodyEd.medicacion === 'Ibuprofeno 3b' && /Medicación — → Ibuprofeno 3b/.test(revEd) &&
      apiTras.medicacion === 'Ibuprofeno 3b' && enPantalla.includes('Ibuprofeno 3b'), JSON.stringify(bodyEd) + ' | revisión: ' + revEd);
    await p5.reload();
    await p5.waitForSelector('#loginScreen.hidden', { state: 'attached', timeout: 8000 });
    await esperarResumen(p5, 'Mostrando');
    await p5.evaluate((id) => abrirExpediente(id), idNuevo);
    await p5.waitForSelector('#expTitulo');
    check('d2', 'tras recargar la página, el valor guardado sigue ahí (viene de la API, no del navegador)', (await txt(p5, '#panelExp')).includes('Ibuprofeno 3b'));

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
    check('d3', 'editar la anamnesis: el PATCH manda las cinco claves (motivo, perinatal, desarrollo, familiares, observaciones) y la API guarda la observación',
      Object.keys(bodyAn).join() === 'anamnesis' && Object.keys(bodyAn.anamnesis).sort().join() === 'desarrollo,familiares,motivo,observaciones,perinatal' &&
      anamApi.observaciones === 'Observación cambiada en 3-b.' && anamApi.motivo === 'Ingreso de prueba de la Fase 3-b.', JSON.stringify(bodyAn));
    check('d3b', 'las Observaciones se ven en el HCE-00 desde la respuesta', (await txt(p5, '#panelExp')).includes('Observación cambiada en 3-b.'));

    // sin cambios: no se llama a la API
    await p5.click('#expHead >> text=✎ Editar datos');
    await p5.waitForSelector('#modalAlta.open');
    const patchesAntes = [];
    p5.on('request', (r) => { if (r.method() === 'PATCH') patchesAntes.push(r.url()); });
    await p5.click('#btnNext'); await p5.click('#btnNext'); await p5.click('#btnNext');
    await p5.click('#btnCreate');
    const sinCambios = await p5.evaluate(() => ({ resumen: document.getElementById('altaErrores').innerText.replace(/\s+/g, ' '), foco: document.activeElement.id }));
    check('d4', 'guardar sin tocar nada: «No hay cambios para guardar», foco en el resumen y NO se manda ningún PATCH',
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
    check('d5', 'baja SIN fecha_baja: la API rechaza y el error queda junto al campo «Fecha de baja» (aria-invalid + describedby), foco en el resumen',
      /fecha/i.test(baja1.msg) && baja1.campo === 'true' && /err_f_fecha_baja/.test(baja1.desc) && baja1.foco === 'altaErrores' && baja1.paso === '2', JSON.stringify(baja1));
    await p5.fill('#f_fecha_baja', '2026-10-01');
    await p5.click('#btnNext'); await p5.click('#btnNext');
    const reqBaja = p5.waitForRequest((r) => r.method() === 'PATCH' && new RegExp(`/hce/${idNuevo}$`).test(r.url()));
    await p5.click('#btnCreate');
    const bodyBaja = cuerpoDe(await reqBaja);
    await p5.waitForFunction(() => !document.getElementById('modalAlta').classList.contains('open'));
    const apiBaja = (await apiGet(p5, `/hce/${idNuevo}`)).json;
    const cabBaja = (await txt(p5, '#expHead')).replace(/\s+/g, ' ');
    check('d6', 'baja CON fecha: PATCH {activo:false, fecha_baja}; la API la guarda y la cabecera muestra «Inactivo» y la fecha',
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
    check('d7', 'reingreso: PATCH {activo:true}; la API borra fecha_baja', JSON.stringify(bodyRe) === '{"activo":true}' && apiRe.activo === true && apiRe.fecha_baja === null, JSON.stringify(bodyRe));

    /* ---------- (e) CI: sin consentimiento nada se traba; se registra y todo lo muestra registrado ---------- */
    const flujoTxt = (await txt(p5, '#flujoWrap')).replace(/\s+/g, ' ');
    const trabas = await p5.evaluate(() => ({ deshabilitados: document.querySelectorAll('#flujoWrap [disabled], #flujoWrap [inert], #flujoWrap [aria-disabled="true"]').length,
      candado: /🔒|Bloquead/i.test(document.getElementById('flujoWrap').innerText + document.getElementById('tabsExpWrap').innerText),
      pasos: [...document.querySelectorAll('#flujoWrap .fl-btn')].map((b) => b.getAttribute('aria-label')) }));
    check('e1', 'nuevo expediente SIN consentimiento: «CI pendiente» visible, los cuatro módulos del año figuran «sin iniciar», ningún candado ni «Bloqueado» ni control deshabilitado',
      /CI pendiente/.test(flujoTxt) && /no bloquea/.test(flujoTxt) && trabas.deshabilitados === 0 && !trabas.candado &&
      JSON.stringify(trabas.pasos) === JSON.stringify(['Línea base (IDEA): sin iniciar', 'Protocolo A: sin iniciar', 'Protocolo B: sin iniciar', 'Informe de cierre: sin iniciar']),
      JSON.stringify(trabas));
    await p5.click('#flujoWrap .fl-btn >> nth=0');                  // un módulo anual: abre su pestaña, sin traba
    const lb = await p5.evaluate(() => ({ sel: document.getElementById('tabExp-lb').getAttribute('aria-selected'), panel: document.getElementById('panelExp').innerText }));
    check('e2', 'un módulo anual (LB) se abre aunque falte el CI: su pestaña se selecciona y muestra el panel de modo demostración (se conecta en su fase), sin candado',
      lb.sel === 'true' && /Modo demostración — no se guarda/.test(lb.panel) && !/🔒|Bloquead/i.test(lb.panel));
    await p5.click('#flujoWrap >> text=Ver auditoría');
    check('e3', '«Ver auditoría» abre el panel de modo demostración compartido', /Modo demostración — no se guarda/.test(await txt(p5, '#panelExp')) && (await p5.getAttribute('#tabExp-log', 'aria-selected')) === 'true');

    // pestaña CI: GET 404 = pendiente (estado, no error)
    const resp404 = p5.waitForResponse((r) => /\/consentimiento$/.test(r.url()) && r.request().method() === 'GET');
    await p5.click('#tabExp-ci');
    const r404 = await resp404;
    await p5.waitForSelector('#ci_firmante');
    const ciPend = await p5.evaluate(() => ({ alertas: document.querySelectorAll('#panelExp .empty-state[role="alert"]').length, texto: document.getElementById('panelExp').innerText, adjunto: !!document.querySelector('#panelExp [id*="adjunto" i], #panelExp input[type="file"]') }));
    check('e4', 'la pestaña CI lee GET /hce/{id}/consentimiento: el 404 se muestra como «CI pendiente» (no como error) con el formulario de registro y SIN campo de adjunto',
      r404.status() === 404 && ciPend.alertas === 0 && /CI pendiente/i.test(ciPend.texto) && !ciPend.adjunto && !/firmad/i.test(ciPend.texto), `GET → ${r404.status()}`);
    // (f) también en el CI: obligatorios vacíos → por campo, con aria-describedby
    await p5.click('#btnCiGuardar');
    const ciF = await p5.evaluate(() => ({ foco: document.activeElement.id, a: document.getElementById('ci_firmante').getAttribute('aria-invalid'), d: document.getElementById('ci_firmante').getAttribute('aria-describedby'),
      m: document.getElementById('err_ci_firmante').textContent, b: document.getElementById('ci_fecha').getAttribute('aria-invalid') }));
    check('f2', 'CI con referente y fecha vacíos → error por campo (aria-invalid + aria-describedby→mensaje) y resumen role="alert" con foco',
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
    check('e5', 'registrar el CI: POST {firmante, fecha, autorizaciones} (las tres) → la API lo guarda y la pantalla lo muestra «Registrado» (nunca «firmado»), con el foco en su título',
      Object.keys(bodyCi).sort().join() === 'autorizaciones,fecha,firmante' && Object.keys(bodyCi.autorizaciones).sort().join() === 'comunicacion,evaluacion,registro' &&
      apiCi.firmante === 'Referente de prueba 3b' && apiCi.autorizaciones.evaluacion === true && apiCi.autorizaciones.comunicacion === false &&
      /registrado/i.test(tras.panel) && /Referente de prueba 3b/.test(tras.panel) && !/firmad/i.test(tras.panel) && tras.foco === 'ciTitulo', JSON.stringify(bodyCi));
    check('e6', 'tras registrar, el flujo se vuelve a pedir a la API: la tarjeta del stepper dice «Registrado» (ya no «CI pendiente») y la pestaña CI lo marca',
      /Registrado/.test(tras.flujo) && !/CI pendiente/.test(tras.flujo) && /registrado/.test(tras.marcaTab), tras.flujo.slice(0, 120));
    await p5.click('#tabExp-hce00');
    await p5.click('.exp-head .btn-ghost');
    await p5.fill('#searchNNA', nombreNuevo);
    await p5.waitForFunction((n) => document.getElementById('tbodyNNA').textContent.includes(n), nombreNuevo, { timeout: 8000 });
    await p5.waitForFunction((n) => { const t = [...document.querySelectorAll('#tbodyNNA tr[data-hce]')].find((r) => r.textContent.includes(n)); return t && /Registrado/.test(t.textContent); }, nombreNuevo, { timeout: 8000 });
    const filaReg = (await p5.locator('#tbodyNNA tr[data-hce]', { hasText: nombreNuevo }).innerText()).replace(/\s+/g, ' ');
    check('e7', 'la fila del listado muestra el CI «Registrado» (no «CI pendiente»)', /Registrado/.test(filaReg) && !/CI pendiente/.test(filaReg), filaReg);
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
    check('e8', 'editar el CI registrado: PATCH /consentimiento solo con lo que cambió (autorizaciones) y la pantalla muestra lo que guardó la API',
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
    check('w2', 'a 390 px el diálogo de alta y la pestaña CI no desbordan, y el botón «Reintentar» de grupos no se ve cuando los grupos cargaron',
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
    check('s3', 'ítem 8 — «Salir» con GET /grupos en vuelo: al llegar la respuesta GRUPOS_API sigue vacío y el filtro de grupo no se llena',
      g.grupos === 0 && g.opciones.join() === 'Todos' && g.anio === null && g.login, JSON.stringify(g));
    await c7.close();
  }

  check('z', 'sin errores de JavaScript en la página durante toda la corrida', erroresPagina.length === 0, erroresPagina.join(' | '));
  await browser.close();

  const mal = resultados.filter((r) => !r.ok);
  console.log(`\n${resultados.length - mal.length}/${resultados.length} verificaciones OK` + (mal.length ? `  —  FALLAN: ${mal.map((r) => r.id).join(', ')}` : ''));
  process.exit(mal.length ? 1 : 0);
})().catch((e) => { console.error('ERROR del script:', e); process.exit(1); });
