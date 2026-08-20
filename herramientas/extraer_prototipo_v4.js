#!/usr/bin/env node
/* Extrae los catálogos y constantes del Prototipo v4 de IPPU.
   Uso:  node herramientas/extraer_prototipo_v4.js [url] [salida.json]
   Por defecto: https://lovely-salmiakki-4db73d.netlify.app/
            →   docs/prototipo-v4/prototipo-v4-catalogos.json

   No ejecuta el código de la app: localiza cada literal por balanceo de delimitadores
   y lo evalúa aislado. Reproducible: si IPPU publica una v5, se vuelve a correr y se
   diffea contra el JSON anterior. */
const fs=require('fs'), vm=require('vm'), https=require('https');
const URL_=process.argv[2]||'https://lovely-salmiakki-4db73d.netlify.app/';
const OUT=process.argv[3]||'docs/prototipo-v4/prototipo-v4-catalogos.json';
const WANT=['IDEA_MANUAL_V','IDEA_DIMS','IDEA_DESC','IDEA_EJ','IDEA_FICHAS','IDEA_REGLAS',
 'IPPU_ITEMS','LIKERT_LBL','ESCALAS','SEV_ETQ','SEV_CS','SEV_CRR','SEV_APOYO','PAI_AREAS',
 'PAI_PREST','PAI_CIRCUITO','CAT_TALLERES','AT_TIPOS','INC_TIPOS','INC_ESTADOS','INC_TEMAS',
 'INC_MEDIOS','INC_ROLES','BUND_CATS','VF_DOMINIOS','VF_NIVELES','PRESTACIONES','FICHA_TABS',
 'MANUAL','DB','GRUPOS_EQUIPO','GRUPOS_FOTOS'];

function get(url){ return new Promise((res,rej)=>https.get(url,r=>{
  if(r.statusCode>=300&&r.statusCode<400&&r.headers.location) return res(get(r.headers.location));
  let d=''; r.on('data',c=>d+=c); r.on('end',()=>res(d)); }).on('error',rej)); }

function slice(js,name){
  const m=new RegExp('(?:^|\\n)\\s*(?:const|let|var)\\s+'+name+'\\s*=\\s*').exec(js);
  if(!m) return null;
  let i=m.index+m[0].length; const open=js[i];
  if(open!=='{'&&open!=='['){ let j=i, q=js[i];
    if(q==='"'||q==="'"||q==='`'){ j=i+1; while(j<js.length){ if(js[j]==='\\'){j+=2;continue;} if(js[j]===q)break; j++; } j++; }
    else while(j<js.length&&js[j]!==';'&&js[j]!=='\n') j++;
    return js.slice(i,j); }
  const close=open==='{'?'}':']'; let d=0,j=i,str=null;
  for(;j<js.length;j++){ const c=js[j];
    if(str){ if(c==='\\'){j++;continue;} if(c===str) str=null; continue; }
    if(c==='"'||c==="'"||c==='`'){ str=c; continue; }
    if(c===open) d++; else if(c===close && --d===0){ j++; break; } }
  return js.slice(i,j);
}

(async()=>{
  const html=await get(URL_);
  const js=html.slice(html.indexOf('<script')).replace(/^[^>]*>/,'');
  const ctx={}; vm.createContext(ctx); const out={};
  for(const k of WANT){ const s=slice(js,k);
    if(s===null){ console.error('FALTA:',k); continue; }
    try{ out[k]=vm.runInContext('('+s+')',ctx,{timeout:5000}); }
    catch(e){ console.error('no parseable:',k,e.message.slice(0,60)); } }
  fs.writeFileSync(OUT,JSON.stringify(out,null,1));
  console.log('OK →',OUT, Object.keys(out).length,'constantes');
})();
