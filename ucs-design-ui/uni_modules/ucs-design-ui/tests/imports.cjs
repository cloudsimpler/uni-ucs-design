const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../..');
const files = [];
function collect(file) {
  if (fs.statSync(file).isDirectory()) {
    if (['tests', 'node_modules'].includes(path.basename(file))) return;
    for (const child of fs.readdirSync(file)) collect(path.join(file, child));
  } else if (/\.(?:js|cjs|uvue|vue)$/.test(file)) files.push(file);
}
for (const entry of ['main.js', 'pages', 'uni_modules/ucs-design-ui']) collect(path.join(root, entry));
let count = 0;
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(/(?:\b(?:import|export)\s+[^'";]*?\bfrom\s*|\brequire\s*\(\s*)['"]([^'"]+)['"]/g)) {
    const specifier = match[1];
    if (!specifier.startsWith('.') && !specifier.startsWith('@/')) continue;
    const target = specifier.startsWith('@/') ? path.resolve(root, specifier.slice(2)) : path.resolve(path.dirname(file), specifier);
    assert(fs.existsSync(target), `${path.relative(root, file)}: missing ${specifier}`);
    count++;
  }
}
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'uni_modules/ucs-design-ui/package.json'), 'utf8'));
assert.equal(manifest.id, 'ucs-design-ui');
assert.deepEqual(manifest.uni_modules.dependencies, []);
// The generator contains import templates, not executable static imports.
const script = fs.readFileSync(path.join(root, 'scripts/vendor-color-esm.cjs'), 'utf8');
const destination = script.match(/const destination = path.join\(root, '([^']+)'\)/);
assert(destination);
assert.equal(destination[1], 'uni_modules/ucs-design-ui/plugin/arco-design-color/vendor');
assert(fs.statSync(path.join(root, destination[1])).isDirectory());
console.log(`PASS ${count} local production imports, unified module id/dependencies and vendor generator destination`);
