/* Cliente de la API (FastAPI) + sesion. Fase 3-a (handoff §5.122).
   Demo L1 HCE+IDEA - IPPU x UTEC-LIDIA.
   Carga despues de utils.js y ANTES de todo lo demas: no depende de ningun otro modulo.

   Contrato que implementa (handoff §5.108, §5.115):
   - GET devuelve el recurso directo; POST/PATCH/PUT devuelven {data, warnings}.
   - Error: {code, detail:[{campo, mensaje}]}.
   - Las listas traen el total en la cabecera X-Total-Count.
   apiFetch() unifica todo en {data, warnings, total}: quien llama no distingue GET de POST.
   C5 (§5.155): `body` puede ser un FormData (alta multipart de un archivo: el navegador pone el Content-Type con su
   boundary) y apiBlob() descarga un archivo con el token, como Blob (nunca un enlace directo sin token). */

/* ---------- URL base: UN solo lugar (auditoria de seguridad M2, handoff §5.157 b) ----------
   Por omision http://127.0.0.1:8000 (§5.166: siempre 127.0.0.1; con la URL de la presentacion, ?api=http://127.0.0.1:8000, el login no muestra aviso). Se puede cambiar con ?api=<url> en la URL de la pagina (p. ej. la verificacion,
   contra una API en :8001), pero SOLO hacia esta maquina: el host tiene que ser localhost o 127.0.0.1 (cualquier
   puerto). Cualquier otro host se ignora y se usa el de omision: un enlace con ?api= ajeno no puede llevarse el token
   ni la proxima contrasena. Cuando la API no es la de omision, el login lo dice en una linea (#loginApi). */
const API_BASE_POR_DEFECTO = "http://127.0.0.1:8000";
const API_HOSTS_PERMITIDOS = ["localhost", "127.0.0.1"];
const API_BASE = (function(){
  try{
    const q = new URLSearchParams(location.search).get("api");
    if(q){
      const u = new URL(q);
      if((u.protocol === "http:" || u.protocol === "https:") && API_HOSTS_PERMITIDOS.includes(u.hostname))
        return u.origin + u.pathname.replace(/\/+$/, "");
    }
  }catch(_e){ /* ?api= invalido: se ignora y se usa el valor por omision */ }
  return API_BASE_POR_DEFECTO;
})();

/* ---------- Sesion: sessionStorage (muere con la pestana) ----------
   El almacenamiento puede lanzar (modo privado, datos bloqueados): todo va en try/catch y la
   demo sigue funcionando sin persistencia (el token queda en memoria de la pagina).
   El token se guarda JUNTO con la API que lo emitio (K_API): si la pagina se abre contra otra API (otro ?api=), la
   sesion guardada se borra aca, al cargar, ANTES de cualquier pedido; un token sin API guardada tambien. Asi un token
   nunca viaja a una API distinta de la que lo dio. */
const Sesion = (function(){
  const K_TOKEN = "ippu.token", K_USUARIO = "ippu.usuario", K_API = "ippu.api";
  let enMemoria = { token: null, usuario: null };
  function leer(k){ try{ return sessionStorage.getItem(k); }catch(_e){ return null; } }
  function escribir(k, v){ try{ sessionStorage.setItem(k, v); }catch(_e){ /* sin persistencia */ } }
  function borrar(){
    enMemoria = { token: null, usuario: null };
    try{ sessionStorage.removeItem(K_TOKEN); sessionStorage.removeItem(K_USUARIO); sessionStorage.removeItem(K_API); }catch(_e){ /* nada */ }
  }
  if(leer(K_TOKEN) !== null && leer(K_API) !== API_BASE) borrar();
  return {
    token(){ return leer(K_TOKEN) || enMemoria.token; },
    usuario(){
      const raw = leer(K_USUARIO);
      if(raw){ try{ return JSON.parse(raw); }catch(_e){ /* cae a memoria */ } }
      return enMemoria.usuario;
    },
    guardar(token, usuario){
      enMemoria = { token, usuario };
      escribir(K_API, API_BASE);
      escribir(K_TOKEN, token);
      escribir(K_USUARIO, JSON.stringify(usuario));
    },
    limpiar: borrar
  };
})();

/* El login dice a que API va la contrasena cuando no es la de omision (#loginApi, index.html). Con la de omision no
   dice nada (F1 retiro la URL del login, §5.140 g); fuera de localhost/127.0.0.1 no puede ser (ver API_BASE). */
(function(){
  const el = document.getElementById("loginApi");
  if(!el || API_BASE === API_BASE_POR_DEFECTO) return;
  el.textContent = "Tu usuario y tu contraseña van a la API de " + API_BASE + ", que no es la habitual.";
  el.hidden = false;
})();

/* ---------- Error de la API ---------- */
class ApiError extends Error {
  /* status 0 = no hubo respuesta (red caida, API apagada, CORS). `detail` siempre es una lista. */
  constructor(status, code, detail, mensaje){
    const lista = Array.isArray(detail) ? detail : [];
    super(mensaje || (lista[0] && lista[0].mensaje) || "Error al hablar con la API");
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.detail = lista;
  }
}

/* ---------- Mensajes de validacion en castellano (Fase 3-e, handoff §5.135) ----------
   Un 422 puede venir de DOS lugares: de las reglas del servicio (mensaje ya en castellano, se muestra tal cual) o de
   Pydantic/FastAPI antes de llegar al servicio (tipo, largo, rango: mensaje en inglés, p. ej. «Input should be a valid
   decimal»). Esto es SOLO presentación: no valida nada en el navegador ni cambia el `campo`; traduce el texto de los
   tipos comunes y, si el mensaje es de Pydantic pero no está en la tabla, usa un mensaje genérico en castellano en vez de
   mostrar inglés. El texto original queda en `mensajeOriginal` (para soporte). */
const _PYD_PREFIJO = /^(Input|Field|String|Value|List|Set|Tuple|Dict|Dictionary|Decimal|Extra|Object|Date|Datetime|Time|UUID|URL|Unexpected|Assertion|Arguments|JSON|Iterable|Mapping|Union|Model|Bytes|Float|Integer|Boolean|Number|Missing)\b/;
const _PYD_PALABRAS = /\b(should|must|valid|input|required|invalid|expected|cannot|at least|at most|characters|than|permitted|unable|parse)\b/i;
const _PYD_TABLA = [
  [/^Field required$/i,                                        () => "Este campo es obligatorio."],
  [/^Input should be a valid decimal/i,                        () => "Ingresá un número válido (por ejemplo 58 o 58.5)."],
  [/^Input should be a valid (number|float)/i,                 () => "Ingresá un número válido (por ejemplo 58 o 58.5)."],
  [/^Input should be a valid integer/i,                        () => "Ingresá un número entero válido."],
  [/^Input should be a valid (date|datetime)/i,                () => "Ingresá una fecha válida (formato aaaa-mm-dd)."],
  [/^Input should be a valid (string|str)\b/i,                 () => "Ingresá un texto válido."],
  [/^Input should be a valid boolean/i,                        () => "Elegí una opción válida (sí o no)."],
  [/^Input should be (?:a )?less than or equal to (.+)$/i,     (m) => `Tiene que ser menor o igual a ${m[1]}.`],
  [/^Input should be (?:a )?greater than or equal to (.+)$/i,  (m) => `Tiene que ser mayor o igual a ${m[1]}.`],
  [/^Input should be (?:a )?less than (.+)$/i,                 (m) => `Tiene que ser menor que ${m[1]}.`],
  [/^Input should be (?:a )?greater than (.+)$/i,              (m) => `Tiene que ser mayor que ${m[1]}.`],
  [/^String should have at most (\d+) characters?/i,           (m) => `Puede tener como máximo ${m[1]} caracteres.`],
  [/^String should have at least (\d+) characters?/i,          (m) => `Tiene que tener al menos ${m[1]} caracteres.`],
  [/^Decimal input should have no more than (\d+) decimal places?/i, (m) => `Admite hasta ${m[1]} decimales.`],
  [/^Decimal input should have no more than (\d+) digits? in total/i, (m) => `Admite hasta ${m[1]} dígitos en total.`],
  [/^Input should be '.+'/i,                                   () => "El valor ingresado no es uno de los permitidos."]
];
const _PYD_GENERICO = "El valor ingresado no es válido.";
function traducirMensajeApi(msg){
  if(typeof msg !== "string") return msg;
  const t = msg.trim();
  const v = /^Value error,\s*(.+)$/i.exec(t);      // validador propio de Pydantic: lo que viene después ya está redactado por nosotros
  if(v) return v[1];
  if(!_PYD_PREFIJO.test(t) && !(/^[\x20-\x7E]+$/.test(t) && _PYD_PALABRAS.test(t))) return msg;   // no es de Pydantic: castellano del servicio, tal cual
  for(const [re, f] of _PYD_TABLA){ const m = re.exec(t); if(m) return f(m); }
  return _PYD_GENERICO;
}

/* Query string: omite null/undefined/"" y serializa booleanos como true/false. */
function _qs(query){
  const p = new URLSearchParams();
  Object.entries(query || {}).forEach(([k, v])=>{
    if(v === null || v === undefined || v === "") return;
    p.append(k, String(v));
  });
  const s = p.toString();
  return s ? "?" + s : "";
}

/* apiFetch(path, {method, query, body, auth}) -> {data, warnings, total, status}
   - `auth:false` solo para el login (no manda token y un 401 NO desloguea: es "credenciales malas").
   - 401 con auth: se limpia la sesion y se vuelve a la pantalla de login (alSesionInvalida,
     definida en ui-core.js; se resuelve al llamar, no al cargar).
   - Falla de red -> ApiError status 0 con mensaje legible. */
async function apiFetch(path, opts){
  const { method = "GET", query, body, auth = true } = opts || {};
  const headers = { "Accept": "application/json" };
  const esForm = typeof FormData !== "undefined" && body instanceof FormData;
  if(body !== undefined && !esForm) headers["Content-Type"] = "application/json";
  if(auth){
    const t = Sesion.token();
    if(t) headers["Authorization"] = "Bearer " + t;
  }
  let resp;
  try{
    resp = await fetch(API_BASE + path + _qs(query), {
      method, headers, body: body === undefined ? undefined : (esForm ? body : JSON.stringify(body))
    });
  }catch(_e){
    throw new ApiError(0, "network", [],
      `No se pudo conectar con la API (${API_BASE}). Verificá que esté en ejecución y volvé a intentar.`);
  }

  let json = null;
  const texto = await resp.text();
  if(texto){ try{ json = JSON.parse(texto); }catch(_e){ json = null; } }

  if(!resp.ok){
    const code = (json && json.code) || "http_error";
    let detail = (json && Array.isArray(json.detail)) ? json.detail
      : [{ campo: null, mensaje: `La API respondió ${resp.status}` }];
    if(resp.status === 422){        // solo validación: los mensajes de Pydantic en inglés se muestran en castellano (el `campo` no cambia)
      detail = detail.map(d => {
        if(!d || typeof d.mensaje !== "string") return d;
        const m = traducirMensajeApi(d.mensaje);
        return m === d.mensaje ? d : Object.assign({}, d, { mensaje: m, mensajeOriginal: d.mensaje });
      });
    }
    if(resp.status === 401 && auth){
      Sesion.limpiar();
      if(typeof alSesionInvalida === "function") alSesionInvalida("Tu sesión expiró o ya no es válida. Ingresá de nuevo.");
    }
    throw new ApiError(resp.status, code, detail);
  }

  const totalH = resp.headers.get("X-Total-Count");
  const total = totalH !== null && totalH !== "" && !isNaN(+totalH) ? +totalH : null;
  /* Sobre {data, warnings} (mutaciones). Un GET trae el recurso directo; /auth/login tambien. */
  const conSobre = json && typeof json === "object" && !Array.isArray(json) && "data" in json && "warnings" in json;
  return {
    data: conSobre ? json.data : json,
    warnings: conSobre ? (json.warnings || []) : [],
    total,
    status: resp.status
  };
}

/* apiBlob(path) -> {blob, tipo, nombre}: descarga autenticada (C5, §5.155 f). El archivo llega como Blob con el
   Content-Type que manda el servidor (el tipo detectado al subirlo); `nombre` es el `filename*` de Content-Disposition.
   Errores y 401 como apiFetch. Quien llama decide qué hacer con el Blob: guardarlo, o mostrarlo SOLO si es JPEG o PNG. */
function nombreDeDisposicion(h){
  if(!h) return null;
  const ext = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(h);
  if(ext){ try{ return decodeURIComponent(ext[1].trim()); }catch(_e){ /* cae al simple */ } }
  const simple = /filename\s*=\s*"([^"]*)"/i.exec(h);
  return simple ? simple[1] : null;
}
async function apiBlob(path){
  const headers = {};
  const t = Sesion.token();
  if(t) headers["Authorization"] = "Bearer " + t;
  let resp;
  try{ resp = await fetch(API_BASE + path, { headers }); }
  catch(_e){
    throw new ApiError(0, "network", [], `No se pudo conectar con la API (${API_BASE}). Verificá que esté en ejecución y volvé a intentar.`);
  }
  if(!resp.ok){
    let json = null;
    try{ json = await resp.json(); }catch(_e){ json = null; }
    if(resp.status === 401){
      Sesion.limpiar();
      if(typeof alSesionInvalida === "function") alSesionInvalida("Tu sesión expiró o ya no es válida. Ingresá de nuevo.");
    }
    throw new ApiError(resp.status, (json && json.code) || "http_error",
      (json && Array.isArray(json.detail)) ? json.detail : [{ campo: null, mensaje: `La API respondió ${resp.status}` }]);
  }
  const blob = await resp.blob();
  return { blob, tipo: (resp.headers.get("Content-Type") || "").split(";")[0].trim().toLowerCase(),
    nombre: nombreDeDisposicion(resp.headers.get("Content-Disposition")) };
}
