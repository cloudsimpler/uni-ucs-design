const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const vue = require('vue');
const { parse, compileScript, compileTemplate, compileStyle } = require('@vue/compiler-sfc');
const { preprocess } = require('@dcloudio/uni-cli-shared/lib/preprocess');

async function test(macros) {
  const filename = path.resolve(__dirname, '../components/ucs-safe-area/ucs-safe-area.vue');
  const original = fs.readFileSync(filename, 'utf8');
  const raw = parse(original, { filename }).descriptor;
  const source = original.replace(raw.scriptSetup.content, preprocess(raw.scriptSetup.content, macros, { type: 'js' }))
    .replace(raw.styles[0].content, preprocess(raw.styles[0].content, macros, { type: 'css' }));
  const { descriptor, errors } = parse(source, { filename });
  assert.deepEqual(errors, []);
  const script = compileScript(descriptor, { id: 'safe-area-test' });
  assert.deepEqual(compileTemplate({ source: descriptor.template.content, filename, id: 'safe-area-test', compilerOptions: { bindingMetadata: script.bindings } }).errors, []);
  assert.deepEqual(compileStyle({ source: descriptor.styles[0].content, filename, id: 'safe-area-test' }).errors, []);
  const cache = new Map();
  const vueModule = new vm.SyntheticModule(Object.keys(vue), function () {
    for (const key of Object.keys(vue)) this.setExport(key, vue[key]);
  });
  function load(file, source) {
    if (!cache.has(file)) cache.set(file, new vm.SourceTextModule(source ?? fs.readFileSync(file, 'utf8'), { identifier: file }));
    return cache.get(file);
  }
  const entry = load(filename, script.content);
  await entry.link((specifier, parent) => specifier === 'vue' ? vueModule : load(path.resolve(path.dirname(parent.identifier), specifier)));
  await entry.evaluate();
  const component = entry.namespace.default;
  const props = vue.reactive(Object.fromEntries(Object.entries(component.props).map(([key, definition]) => [key, definition.default])));
  const state = component.setup(props, { expose() {} });
  assert.deepEqual(Object.keys(component.props), ['backgroundColor']);
  if (macros.UNI_APP_X) {
    assert(descriptor.styles[0].content.includes('height: var(--uni-safe-area-inset-bottom)'));
    assert(!descriptor.scriptSetup.content.includes('getWindowInfo'));
  } else {
    assert(descriptor.styles[0].content.includes('height: env(safe-area-inset-bottom)'));
    assert(!descriptor.styles[0].content.includes('--uni-safe-area-inset-bottom'));
    assert(!descriptor.scriptSetup.content.includes('getWindowInfo'));
  }
  assert.equal(state.rootStyle.value.backgroundColor, 'transparent');
  const core = cache.get(path.resolve(__dirname, '../core/config.js')).namespace;
  props.backgroundColor = ['#FFFFFF', '#141414'];
  assert.equal(state.rootStyle.value.backgroundColor, '#FFFFFF');
  core.setThemeMode('dark');
  assert.equal(state.rootStyle.value.backgroundColor, '#141414');
}
(async () => {
  for (const flags of [
    { UNI_APP_X: true, APP: true },
    { UNI_APP_X: true, MP: true },
    { H5: true, WEB: true },
    { APP_PLUS: true },
    { MP: true, MP_WEIXIN: true },
    { MP: true, MP_ALIPAY: true }
  ]) await test({ UNI_APP_X: false, MP: false, ...flags });
  console.log('PASS safe-area 6 CSS platform branches, SFC compilation, single background prop and reactive theme');
})().catch(error => { console.error(error); process.exitCode = 1; });
