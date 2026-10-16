/* Adaptadores API -> formas de la demo. Fase 3-a (handoff §5.122, decision 1).
   Demo L1 HCE+IDEA - IPPU x UTEC-LIDIA.
   Funciones PURAS: reciben lo que devuelve la API y devuelven un objeto con los nombres de
   campo que ya usan los renderers de la demo (nombre, apellido, ci, edad, sexo, loc, tel,
   dx, deriv, med, alerta, anamnesis, activo, bajaFecha, tecnico1/tecnico1_rol...).

   Regla dura (§5.122, decision 3): ACA NO SE CALCULA NEGOCIO. Ni totales, ni delta, ni
   bandas, ni baremo, ni "que IDEA rige". Solo se renombra y se formatea para mostrar
   (edad a partir de la fecha de nacimiento, cedula con puntos y guion). Lo que la API no
   guarda no se inventa: queda null/ausente y la pantalla lo oculta. */

/* Cedula uruguaya para mostrar: "60123451" -> "6.012.345-1". La API la guarda canonica (sin
   puntos ni guiones, §5.110); la demo la mostraba formateada. Si no son 7 u 8 digitos se
   devuelve tal cual: no se adivina. Es presentacion, no un dato. */
function ciFormateada(ci){
  if(ci === null || ci === undefined) return "—";
  const s = String(ci).trim();
  if(!/^\d{7,8}$/.test(s)) return s || "—";
  const dv = s.slice(-1), cuerpo = s.slice(0, -1);
  return cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "-" + dv;
}

/* Edad en anios cumplidos a la fecha `hoy`. Dato derivado de la fecha de nacimiento: no se
   guarda en ningun lado (la API no tiene columna `edad`). null si la fecha no es valida. */
function edadAnios(fechaNac, hoy){
  if(!fechaNac) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(fechaNac);
  if(!m) return null;
  const ref = hoy || new Date();
  let edad = ref.getFullYear() - (+m[1]);
  if((ref.getMonth() + 1) < (+m[2]) || ((ref.getMonth() + 1) === (+m[2]) && ref.getDate() < (+m[3]))) edad--;
  return edad >= 0 ? edad : null;
}

/* Edad cumplida a la fecha PROPIA de un documento (no al reloj del navegador): un documento impreso no cambia de edad
   al reimprimirlo. `fechaRef` es un ISO yyyy-mm-dd; si falta o no es valida, null (el documento no imprime edad). */
function edadALaFecha(fechaNac, fechaRef){
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(fechaRef || "");
  if(!m) return null;
  return edadAnios(fechaNac, new Date(+m[1], +m[2] - 1, +m[3]));
}

/* Iniciales para avatar: primeras letras de las dos primeras palabras ("Dr. González" -> "DG"). */
function inicialesDe(nombre){
  const partes = String(nombre || "").trim().split(/\s+/).filter(Boolean);
  return ((partes[0] || "")[0] || "").toUpperCase() + ((partes[1] || "")[0] || "").toUpperCase();
}

/* Estados de modulo de la lista: { "HCE-LB": "firmado", ... } (vocabulario de la API:
   sin_iniciar | en_curso | firmado). Si faltan se deja "sin_iniciar", que es lo que la API
   dice cuando no hay fila. */
const MODULOS_CADENA = ["HCE-LB", "HCE-PA", "HCE-PB", "HCE-IC"];
function _mapaModulos(lista){
  const mapa = {};
  MODULOS_CADENA.forEach(k => { mapa[k] = "sin_iniciar"; });
  (lista || []).forEach(e => { if(e && e.modulo) mapa[e.modulo] = e.estado; });
  return mapa;
}

/* GET /hce (un item) -> fila de la lista. `id` es el id del expediente en la API (con el que
   se abre el detalle); `hc` es el N.º de historia clinica (hc_historico). */
function adaptarFilaLista(it, hoy){
  const per = it.persona || {};
  return {
    id: it.id,
    hc: it.hc_historico,
    ci: per.ci || "",
    ciTxt: ciFormateada(per.ci),
    nombre: per.nombre || "",
    apellido: per.apellido || "",
    nac: per.fecha_nac || null,
    edad: edadAnios(per.fecha_nac, hoy),
    grupo: it.grupo ? it.grupo.nombre : null,
    activo: !!it.activo,
    ciEstado: it.ci,                 // "pendiente" | "registrado" (consentimiento, §5.121 e)
    modulos: _mapaModulos(it.flujo)  // estado de LB/PA/PB/IC del anio en curso
  };
}

/* GET /hce/{id} -> objeto plano con los nombres de campo de la demo. Copia sólo lo que la API devuelve (persona, grupo con
   sus dos técnicos, diagnóstico, derivación, medicación, alerta, anamnesis); lo que no guarda (apoyo/SEV, talleres,
   historial, antecedentes) no se inventa acá: queda sin definir y el expediente conectado no lo muestra. */
function adaptarHce00(h, hoy){
  const per = h.persona || {};
  const g = h.grupo || null;
  const an = h.anamnesis || null;
  return {
    id: h.id,
    hc: h.hc_historico,
    activo: !!h.activo,
    bajaFecha: h.fecha_baja || null,
    nombre: per.nombre || "",
    apellido: per.apellido || "",
    ci: per.ci || "",
    ciTxt: ciFormateada(per.ci),
    nac: per.fecha_nac || null,
    edad: edadAnios(per.fecha_nac, hoy),
    sexo: per.sexo || null,
    loc: per.localidad || null,
    referente: per.referente || null,
    tel: per.telefono || null,
    grupo: g ? g.nombre : null,
    grupoId: g ? g.id : null,
    grupoAnio: g ? g.anio : null,
    // Tecnicos del grupo; `rol` es el rol EN EL GRUPO ("Psicólogo/a", "Maestro/a"), no el de
    // sesion (§5.121 b).
    tecnico1: g && g.tecnico1 ? g.tecnico1.nombre : null,
    tecnico1_rol: g && g.tecnico1 ? g.tecnico1.rol : null,
    tecnico2: g && g.tecnico2 ? g.tecnico2.nombre : null,
    tecnico2_rol: g && g.tecnico2 ? g.tecnico2.rol : null,
    dx: h.diagnostico || null,
    cie11: h.cie11 || null,
    dxFecha: h.dx_fecha || null,
    deriv: h.derivacion || null,
    med: h.medicacion || null,
    alerta: h.alerta || null,
    anamnesis: an ? {
      motivo: an.motivo || null, perinatal: an.perinatal || null,
      desarrollo: an.desarrollo || null, familiares: an.familiares || null,
      observaciones: an.observaciones || null
    } : null
  };
}

/* GET /hce/{id}/flujo -> { anio, ci, modulos:{ "HCE-LB": {estado, id, faltantes}, ... } }
   `faltantes` = eslabones anteriores del mismo anio sin firmar: solo informativo, no bloquea (§5.95). */
function adaptarFlujo(f){
  const modulos = {};
  ((f && f.modulos) || []).forEach(m => { modulos[m.modulo] = { estado: m.estado, id: m.id, faltantes: m.faltantes || [] }; });
  return { anio: f ? f.anio : null, ci: f ? f.ci : null, modulos };
}

/* GET /hce/{id}/consentimiento -> lo que muestra la pantalla de CI. No se expone `firmado`, `firmas`
   ni `addendas`: el CI no se firma, «registrado» es su estado final (handoff §5.124). */
function adaptarCi(c){
  const a = (c && c.autorizaciones) || {};
  return {
    firmante: (c && c.firmante) || "",
    fecha: (c && c.fecha) || "",
    evaluacion: a.evaluacion === true,
    registro: a.registro === true,
    comunicacion: a.comunicacion === true
  };
}
