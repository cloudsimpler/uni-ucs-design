const assert = require('node:assert/strict');
const { convertPagesConfig } = require('../convert.js');

// Independent test preprocessor: enumerate macro assignments and require strict JSON.
function evaluate(expression, macros) {
  const booleanExpression = expression.replace(/[A-Za-z_][\w-]*/g, name => String(!!macros[name]));
  assert(/^[truefals\s!&|()]+$/.test(booleanExpression));
  return Function('return (' + booleanExpression + ')')();
}
function select(text, macros) {
  const stack = [true], lines = [];
  for (const line of text.split('\n')) {
    const directive = line.match(/^\s*\/\/ #(ifdef|ifndef|endif)(?:\s+(.+))?$/);
    if (directive) {
      const [, kind, expression] = directive;
      if (kind === 'endif') { assert(stack.length > 1); stack.pop(); }
      else {
        const matches = evaluate(expression, macros);
        stack.push(stack.at(-1) && (kind === 'ifndef' ? !matches : matches));
      }
    } else if (stack.at(-1)) lines.push(line);
  }
  assert.equal(stack.length, 1);
  return JSON.parse(lines.join('\n'));
}
function convert(body) {
  const output = convertPagesConfig('export default { pages: [\n' + body + '\n] };');
  // The generator also validates the unfiltered output before replacing pages.json.
  JSON.parse(output.replace(/^\s*\/\/.*$/gm, ''));
  return output;
}
const adjacent = convert(`// #ifdef WEB
{ path: 'a' },
// #endif
// #ifdef WEB
{ path: 'b' },
{ path: 'c' },
// #endif`);
assert.equal((adjacent.match(/#ifdef/g) || []).length, 1);
assert(!/^\s*,\s*$/m.test(adjacent));
assert.deepEqual(select(adjacent, { WEB: true }).pages.map(page => page.path), ['a', 'b', 'c']);
assert.deepEqual(select(adjacent, {}).pages, []);

const variants = [
  { start: '', end: '', enabled: () => true },
  { start: '// #ifdef WEB\n', end: '\n// #endif', enabled: m => m.WEB },
  { start: '// #ifndef WEB\n', end: '\n// #endif', enabled: m => !m.WEB },
  { start: '// #ifdef APP\n', end: '\n// #endif', enabled: m => m.APP },
  { start: '// #ifdef WEB || APP\n', end: '\n// #endif', enabled: m => m.WEB || m.APP },
  { start: '// #ifdef WEB\n// #ifndef APP\n', end: '\n// #endif\n// #endif', enabled: m => m.WEB && !m.APP },
];
let configurations = 0, selections = 0;
function verify(sequence) {
  const body = sequence.map((variant, index) => variant.start + `{ path: '${index}' },` + variant.end).join('\n');
  const output = convert(body);
  // Exercise the same separator logic for conditional object properties too.
  const object = convert(`{ path: 'object', style: {\n${sequence.map((variant, index) => variant.start + `key${index}: ${index},` + variant.end).join('\n')}\n} }`);
  for (const WEB of [false, true]) for (const APP of [false, true]) {
    const macros = { WEB, APP };
    const expected = sequence.flatMap((variant, index) => variant.enabled(macros) ? [String(index)] : []);
    assert.deepEqual(select(output, macros).pages.map(page => page.path), expected);
    assert.deepEqual(select(object, macros).pages[0].style, Object.fromEntries(expected.map(index => ['key' + index, Number(index)])));
    selections += 2;
  }
  configurations++;
  if (sequence.length < 3) for (const variant of variants) verify([...sequence, variant]);
}
verify([]);

const duplicateKeys = convert(`{ path: 'x', style: {
// #ifdef WEB
title: 'web',
// #endif
// #ifndef WEB
title: 'other',
// #endif
} }`);
assert.equal(select(duplicateKeys, { WEB: true }).pages[0].style.title, 'web');
assert.equal(select(duplicateKeys, {}).pages[0].style.title, 'other');
assert.equal((duplicateKeys.match(/"title"/g) || []).length, 2);
console.log(`PASS adjacent block merging, duplicate keys, ${configurations} configurations and ${selections} strict JSON branch checks`);
