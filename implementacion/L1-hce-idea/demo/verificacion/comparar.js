/* Compara dos fingerprints generados por fingerprint.js.
 * Uso:  node comparar.js <referencia.json> <actual.json>
 * Sale con codigo 0 si son identicos, 1 si hay diferencias. */
const fs = require('fs');

const [refPath, actPath] = process.argv.slice(2);
if (!refPath || !actPath) {
  console.error('uso: node comparar.js <referencia.json> <actual.json>');
  process.exit(1);
}

const A = JSON.parse(fs.readFileSync(refPath, 'utf8'));
const B = JSON.parse(fs.readFileSync(actPath, 'utf8'));

let iguales = 0, distintos = 0;

const cmp = (clave, x, y) => {
  if (JSON.stringify(x) === JSON.stringify(y)) { iguales++; console.log(`  OK   ${clave}`); return; }
  distintos++;
  console.log(`  DIFF ${clave}`);
  const sx = typeof x === 'string' ? x : JSON.stringify(x);
  const sy = typeof y === 'string' ? y : JSON.stringify(y);
  if (sx == null || sy == null) { console.log(`       referencia: ${sx}`); console.log(`       actual    : ${sy}`); return; }
  for (let i = 0; i < Math.max(sx.length, sy.length); i++) {
    if (sx[i] !== sy[i]) {
      console.log(`       primera divergencia en offset ${i}:`);
      console.log(`       referencia: ...${sx.slice(Math.max(0, i - 80), i + 80)}...`);
      console.log(`       actual    : ...${sy.slice(Math.max(0, i - 80), i + 80)}...`);
      return;
    }
  }
};

console.log('ERRORES DE CONSOLA / PAGINA');
cmp('errors', A.errors, B.errors);

console.log('\nPASOS');
const claves = [...new Set([...Object.keys(A.pasos || {}), ...Object.keys(B.pasos || {})])].sort();
for (const k of claves) cmp(k, (A.pasos || {})[k], (B.pasos || {})[k]);

console.log(`\n===> ${iguales} iguales · ${distintos} distintos`);
console.log(distintos === 0
  ? 'IDENTICOS — el cambio no altero el comportamiento.'
  : 'HAY DIFERENCIAS — revisar antes de mergear.');
process.exit(distintos ? 1 : 0);
