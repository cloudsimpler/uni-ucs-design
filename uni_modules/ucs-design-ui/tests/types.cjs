const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');

// Exercise the public declarations together, including readonly theme tuples.
const file = path.resolve(__dirname, '__color-contract__.ts');
const source = `
import { getThemeColor, useThemeColorCssVars, type ThemeColorValue } from '../index.js';
import { useInputStyle, useSelection, useUpload, useCountdown, type InputStyleOptions } from '../index.js';
import { http } from '../index.js';

const countdown = useCountdown({ duration: 60000, onFinish() {} });
const seconds: number = countdown.totalSeconds.value;
const didStart: boolean = countdown.start();
// @ts-expect-error Time state is readonly.
countdown.time.value.seconds = 1;
// @ts-expect-error Duration is numeric milliseconds.
countdown.reset('60');

const uploader = useUpload({ upload: ({ file, signal, onProgress }) => http.upload<{ url: string }>('/files', {
  filePath: file.path, name: 'file', signal, onUploadProgress: onProgress
}) });
uploader.add([{ path: '/image.png' }]);
const uploadedUrl: string | undefined = uploader.tasks.value[0].result?.data.url;
uploader.start().then(results => { for (const result of results) if (result.success) { const url: string = result.result.data.url; } });
// @ts-expect-error Tasks are readonly snapshots.
uploader.tasks.value[0].status = 'success';
// @ts-expect-error File paths are required.
uploader.add([{ name: 'missing' }]);
// @ts-expect-error Task ids are numeric.
uploader.cancel('1');

const selection = useSelection({ items: [{ id: 1 }], getKey: item => item.id, multiple: true });
selection.select(1);
const selectedId: number = selection.selectedItems.value[0].id;
const cssVars = useThemeColorCssVars();
const cssColor: string = cssVars.value['--ucs-primary-6'];
const aliasColor: string = cssVars.value['--ucs-primary'];
// @ts-expect-error Color CSS variables are readonly.
cssVars.value['--ucs-primary-6'] = 'red';
// @ts-expect-error Only existing palette keys are exported.
cssVars.value['--ucs-gray-13'];
// @ts-expect-error Key is inferred from getKey.
selection.toggle('1');
// @ts-expect-error Selected keys cannot be mutated directly.
selection.selectedKeys.value.push(2);
// @ts-expect-error Object options require a key extractor.
useSelection({ items: [{ id: 1 }] });
// @ts-expect-error Boolean options cannot be used as keys.
useSelection({ items: [true] });
const primitive = useSelection({ items: [1, 2] });
primitive.select(1);
// @ts-expect-error Primitive numeric options infer numeric keys.
primitive.select('1');
const words = useSelection({ items: ['a', 'b'] });
words.toggle('a');
// @ts-expect-error String options infer string keys.
words.toggle(1);

const pair = ['primary-6', 'gray-10'] as const;
const colors: ThemeColorValue[] = ['#123456', ['gray-12'], pair, ['red', null]];
for (const color of colors) {
  getThemeColor(color);
  const options: InputStyleOptions = { color, placeholderColor: color };
  useInputStyle(options);
}
useInputStyle({ color: pair, placeholderColor: ['gray-7'] as const });
getThemeColor('red', 'blue');
// @ts-expect-error A color tuple must have at least one item.
const empty: ThemeColorValue = [];
// @ts-expect-error A color tuple has at most two items.
useInputStyle({ color: ['red', 'blue', 'green'] });
// @ts-expect-error The light color cannot be null.
useInputStyle({ placeholderColor: [null, 'red'] });
// @ts-expect-error Color values do not accept numbers.
getThemeColor(42);
`;
const options = {
  strict: true, noEmit: true, skipLibCheck: true,
  target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  baseUrl: path.dirname(require.resolve('vue/package.json')),
  paths: { vue: [path.dirname(require.resolve('vue/package.json'))] }
};
const host = ts.createCompilerHost(options);
const readFile = host.readFile.bind(host);
const fileExists = host.fileExists.bind(host);
host.readFile = name => path.resolve(name) === file ? source : readFile(name);
host.fileExists = name => path.resolve(name) === file || fileExists(name);
const program = ts.createProgram([file], options, host);
const diagnostics = ts.getPreEmitDiagnostics(program);
assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {
  getCanonicalFileName: name => name, getCurrentDirectory: () => process.cwd(), getNewLine: () => '\n'
}));
console.log('PASS public color types: core/UI share ThemeColorValue, readonly tuples and null dark fallback accepted; invalid colors rejected');
