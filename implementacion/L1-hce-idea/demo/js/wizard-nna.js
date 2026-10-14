/* Wizard de alta y edicion de NNA.
   Demo L1 HCE+IDEA - IPPU x UTEC-LIDIA.
   Extraido del monolito (lineas 2428-2617) sin cambios de logica.
   Los scripts se cargan en orden en index.html: el orden ES la semantica. */
/* ===================== WIZARD: ALTA / EDICIÓN DE NNA ===================== */
let wizStep = 1;
let editId = null;              // null = alta; id = edición del expediente
const wizTalleres = new Set();
const CAMPOS_TXT = ["f_nombre","f_apellido","f_nac","f_ci","f_ref","f_tel","f_dxfecha","f_deriv",
                    "f_antec","f_med","f_alerta","f_motivo","f_perinatal","f_desarrollo","f_famhist","f_cie11"];

function openAlta(){
  editId = null;
  wizStep = 1;
  wizTalleres.clear();
  CAMPOS_TXT.forEach(id=>{const el=document.getElementById(id); if(el) el.value="";});
  document.getElementById("f_loc").value = "Montevideo";
  ["f_sexo","f_dx","f_grupo","f_tecnico","f_tecnico2"].forEach(id=>{const el=document.getElementById(id); if(el) el.selectedIndex=0;});
  document.getElementById("f_apoyo").value = "Grado 2 — Requiere apoyo sustancial";
  document.querySelectorAll(".chip-pick").forEach(c=>c.classList.remove("sel"));
  document.querySelectorAll(".field").forEach(f=>f.classList.remove("invalid"));
  document.getElementById("modalTitle").textContent = "Registrar nuevo NNA en la HCE";
  document.getElementById("modalSub").textContent = "Alta de expediente clínico · Convenio INAU — Fundación IPPU";
  document.getElementById("btnCreate").textContent = "✓ Crear expediente";
  showWizStep(1);
  document.getElementById("modalAlta").classList.add("open");
}

function openEditar(id, step){
  const p = NNA.find(n=>n.id===id); if(!p) return;
  editId = id;
  wizStep = 1;
  wizTalleres.clear();
  const set = (fid,val)=>{ const el=document.getElementById(fid); if(el) el.value = (val==null||val==="—") ? "" : val; };
  set("f_nombre",p.nombre); set("f_apellido",p.apellido); set("f_nac",p.nac);
  set("f_ci",p.ci); set("f_ref",p.referente); set("f_tel",p.tel);
  document.getElementById("f_loc").value = (p.loc && p.loc!=="—") ? p.loc : "Montevideo";
  document.getElementById("f_sexo").value  = p.sexo || "Femenino";
  document.getElementById("f_dx").value    = p.dx;
  set("f_dxfecha",p.dxFecha); set("f_deriv",p.deriv);
  document.getElementById("f_apoyo").value = p.apoyo;
  set("f_med", p.med); set("f_alerta", p.alerta);
  document.getElementById("f_grupo").value   = p.grupo;
  document.getElementById("f_tecnico").value = p.tecnico;
  set("f_cie11", p.cie11);
  { const t2=document.getElementById("f_tecnico2"); if(t2) t2.value = p.tecnico2 || "Mtra. Torres"; }
  const an = p.anamnesis || {};
  set("f_motivo",an.motivo); set("f_perinatal",an.perinatal);
  set("f_desarrollo",an.desarrollo); set("f_famhist",an.familiares);
  set("f_antec", p.antec);
  document.querySelectorAll(".chip-pick").forEach(c=>{
    const on = (p.talleres||[]).includes(c.dataset.t);
    c.classList.toggle("sel", on);
    if(on) wizTalleres.add(c.dataset.t);
  });
  document.querySelectorAll(".field").forEach(f=>f.classList.remove("invalid"));
  document.getElementById("modalTitle").textContent = `Editar datos — ${p.nombre} ${p.apellido}`;
  document.getElementById("modalSub").textContent = `Expediente #${p.id} · Convenio INAU — Fundación IPPU`;
  document.getElementById("btnCreate").textContent = "✓ Guardar cambios";
  showWizStep(step && step>=1 && step<=4 ? step : 1);
  document.getElementById("modalAlta").classList.add("open");
}
function closeAlta(){ editId = null; document.getElementById("modalAlta").classList.remove("open"); }

function showWizStep(n){
  wizStep = n;
  document.querySelectorAll(".wizard-step").forEach(s=>s.classList.toggle("active", +s.dataset.step===n));
  // stepper visual
  for(let i=1;i<=4;i++){
    const st = document.getElementById("stp"+i);
    st.classList.toggle("active", i===n);
    st.classList.toggle("done", i<n);
  }
  document.getElementById("stepInfo").textContent = `Paso ${n} de 4`;
  document.getElementById("btnPrev").style.display = n>1 ? "inline-block" : "none";
  document.getElementById("btnNext").style.display = n<4 ? "inline-block" : "none";
  document.getElementById("btnCreate").style.display = n===4 ? "inline-block" : "none";
  if(n===4) buildReview();
  document.querySelector(".modal-body").scrollTop = 0;
}

function validateStep(n){
  let ok = true;
  const need = id=>{
    const f = document.getElementById(id).closest(".field");
    const val = document.getElementById(id).value.trim();
    if(!val){ f.classList.add("invalid"); ok=false; } else { f.classList.remove("invalid"); }
  };
  if(n===1){ need("f_nombre"); need("f_apellido"); need("f_nac"); }
  // paso 2 y 3 tienen selects con valores por defecto, no requieren validación dura
  return ok;
}

function wizNext(){
  if(!validateStep(wizStep)){ toast("Completá los campos obligatorios"); return; }
  if(wizStep<4) showWizStep(wizStep+1);
}
function wizPrev(){ if(wizStep>1) showWizStep(wizStep-1); }

// selección de talleres
document.getElementById("tallerPicker").addEventListener("click", e=>{
  const c = e.target.closest(".chip-pick"); if(!c) return;
  const t = c.dataset.t;
  if(wizTalleres.has(t)){ wizTalleres.delete(t); c.classList.remove("sel"); }
  else { wizTalleres.add(t); c.classList.add("sel"); }
});

function buildReview(){
  const g = id=>document.getElementById(id).value.trim();
  const edad = edadDesde(g("f_nac"));
  const talleres = [...wizTalleres];
  const rows = [
    ["Nombre completo", `${g("f_nombre")} ${g("f_apellido")}`],
    ["Edad", edad==="—" ? "—" : edad+" años"],
    ["Documento", g("f_ci")||"—"],
    ["Localidad", g("f_loc")||"—"],
    ["Referente", g("f_ref")||"—"],
    ["Diagnóstico", g("f_dx")],
    ["Nivel de apoyo", g("f_apoyo")],
    ["Grupo", g("f_grupo")],
    ["Técnico de ref.", g("f_tecnico").split("—")[0].trim()],
    ["Talleres", talleres.length ? talleres.join(", ") : "Ninguno asignado"],
    ["Motivo de ingreso", g("f_motivo") || "—"]
  ];
  document.getElementById("reviewDl").innerHTML =
    rows.map(r=>`<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join("");
}

function crearNNA(){
  const g = id=>document.getElementById(id).value.trim();
  if(!g("f_nombre")||!g("f_apellido")||!g("f_nac")){ showWizStep(1); toast("Faltan datos del NNA"); return; }
  const modoEdit = editId;   // capturar antes de cerrar el modal
  const hoy = new Date().toISOString().slice(0,10);
  const datos = {
    nombre: g("f_nombre"), apellido: g("f_apellido"),
    nac: g("f_nac"), edad: edadDesde(g("f_nac")),
    sexo: g("f_sexo"), ci: g("f_ci")||"—", loc: g("f_loc")||"—",
    referente: g("f_ref")||"—", tel: g("f_tel")||"—",
    grupo: g("f_grupo"), tecnico: g("f_tecnico"),
    dx: g("f_dx"), dxFecha: g("f_dxfecha")||"—", deriv: g("f_deriv")||"—",
    apoyo: g("f_apoyo"),
    cie11: g("f_cie11")||"—",
    tecnico1: g("f_tecnico"), tecnico1_rol: "Psicólogo/a",
    tecnico2: g("f_tecnico2"), tecnico2_rol: "Maestro/a",
    antec: g("f_antec")||"Sin antecedentes registrados.",
    med: g("f_med")||"Ninguna", alerta: g("f_alerta")||"—",
    talleres: [...wizTalleres],
    anamnesis: {
      motivo: g("f_motivo")||"—",
      perinatal: g("f_perinatal")||"—",
      desarrollo: g("f_desarrollo")||"—",
      familiares: g("f_famhist")||"—"
    }
  };

  if(modoEdit){
    const p = NNA.find(n=>n.id===modoEdit);
    if(p){
      const antes = {dx:p.dx, cie11:p.cie11, apoyo:p.apoyo, t1:p.tecnico1, t2:p.tecnico2, motivo:(p.anamnesis||{}).motivo};
      Object.assign(p, datos);
      const cambios = [];
      if(antes.dx!==p.dx) cambios.push("diagnóstico");
      if(antes.cie11!==p.cie11) cambios.push("CIE-11");
      if(antes.apoyo!==p.apoyo) cambios.push("nivel de soporte");
      if(antes.t1!==p.tecnico1 || antes.t2!==p.tecnico2) cambios.push("técnicos responsables");
      if(antes.motivo!==(p.anamnesis||{}).motivo) cambios.push("anamnesis");
      if(p.hceLog) logEvento(p, {modulo:"hce00", tipo:"edicion", detalle:`HCE-00 actualizado${cambios.length?": "+cambios.join(", "):""} · siempre editable, aun con módulos firmados (§3.2).`});
      p.historial.push({tipo:"note", fecha:hoy, titulo:"Edición de datos", desc:"Se actualizaron datos del expediente (demo)."});
    }
    renderNNA();
    closeAlta();
    toast(`Datos de ${g("f_nombre")} ${g("f_apellido")} actualizados`);
    setTimeout(()=>abrirExpedienteDemo(modoEdit), 300);
  } else {
    const nuevo = Object.assign({ id: ++nnaSeq, activo:true, flujo: initFlujo(), hceLog: [],
      docs: [], fotos: [], autImagen: {registrada:false, fecha:"", adjunto:""},
      inau: {sipi:"", convenio:"", referente:"", ingreso:"", obs:"", envios:[]},
      bps:  {prestacion:"", tramite:"", estado:"", vencimiento:"", obs:"", gestiones:[]},
      vf: {estado:"No iniciado", fecha:"", organismo:"", pct:"", vigencia:"", rnpcd:"",
        dominios:{comunicacion:"",autocuidado:"",movilidad:"",aprendizaje:"",interacciones:"",comunidad:""},
        capacidades:"", barreras:"", apoyos:"", obs:"", sintesisFuncional:""} }, datos, {
      historial: [
        {tipo:"alta", fecha:hoy, titulo:"Alta en HCE",
         desc:`Expediente creado por ${g("f_tecnico").split("—")[0].trim()}. Pendiente de primera evaluación IDEA anual.`}
      ]
    });
    NNA.push(nuevo);
    renderNNA();
    closeAlta();
    toast(`Expediente de ${nuevo.nombre} ${nuevo.apellido} creado`);
    setTimeout(()=>abrirExpedienteDemo(nuevo.id), 400);
  }
}

