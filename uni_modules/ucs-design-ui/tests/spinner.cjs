const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const vue = require('vue');
const { parse, compileScript, compileTemplate, compileStyle } = require('@vue/compiler-sfc');

(async () => {
  const filename = path.resolve(__dirname, '../components/ucs-spinner/ucs-spinner.vue');
  const source = fs.readFileSync(filename, 'utf8');
  const { descriptor, errors } = parse(source, { filename });
  assert.deepEqual(errors, []);
  const script = compileScript(descriptor, { id: 'ucs-spinner-test' });
  const template = compileTemplate({ source: descriptor.template.content, filename, id: 'ucs-spinner-test', compilerOptions: { bindingMetadata: script.bindings } });
  assert.deepEqual(template.errors, []);
  const style = compileStyle({ source: descriptor.styles[0].content, filename, id: 'ucs-spinner-test' });
  assert.deepEqual(style.errors, []);
  assert(style.code.includes('@keyframes ucs-spinner-spin'));
  assert(style.code.includes('animation-duration: 1s'));
  assert(style.code.includes('animation-timing-function: linear'));
  assert(style.code.includes('animation-iteration-count: infinite'));
  assert(template.code.includes('$setup.props.animated'));
  assert(!/setTimeout|setInterval|onMounted|onUnmounted|\.animate\(/.test(descriptor.scriptSetup.content));
  const cache = new Map();
  let encodes = 0;
  globalThis.__ucsSpinnerEncodingProbe = () => { encodes++; };
  const vueModule = new vm.SyntheticModule(Object.keys(vue), function () {
    for (const key of Object.keys(vue)) this.setExport(key, vue[key]);
  });
  function load(file, text) {
    if (!cache.has(file)) {
      let contents = text ?? fs.readFileSync(file, 'utf8');
      if (file.endsWith(path.sep + 'svg.js')) contents = contents.replace('function toBase64(value) {', 'function toBase64(value) { globalThis.__ucsSpinnerEncodingProbe();');
      cache.set(file, new vm.SourceTextModule(contents, { identifier: file }));
    }
    return cache.get(file);
  }
  const entry = load(filename, script.content);
  await entry.link((specifier, parent) => specifier === 'vue' ? vueModule : load(path.resolve(path.dirname(parent.identifier), specifier)));
  await entry.evaluate();
  const component = entry.namespace.default;
  const props = vue.reactive(Object.fromEntries(Object.entries(component.props).map(([name, definition]) => [name, typeof definition.default === 'function' ? definition.default() : definition.default])));
  const state = component.setup(props, { expose() {} });
  const svg = () => Buffer.from(state.spinnerSrc.value.split(',')[1], 'base64').toString('utf8');
  assert(state.spinnerSrc.value.startsWith('data:image/svg+xml;base64,'));
  for (const text of ['', 'a', 'ab', 'abc', '<svg/>', '颜色 #1890FF 😀']) {
    const helpers = cache.get(path.resolve(__dirname, '../internal/svg.js')).namespace;
    assert.equal(helpers.toBase64(text), Buffer.from(text, 'utf8').toString('base64'));
  }
  const core = cache.get(path.resolve(__dirname, '../core/config.js')).namespace;
  assert.equal(component.options.virtualHost, true);
  assert.deepEqual(Object.keys(component.props).sort(), ['animated', 'color', 'scaleWithFont', 'size']);
  assert.equal(props.scaleWithFont, true);
  assert.equal(props.animated, true);
  assert.equal(state.spinnerStyle.value.width, '24px');
  assert(svg().includes('stop-color="#604CFC"'));
  assert(!svg().includes('stroke='));
  assert(svg().includes('A33 33'));
  assert(svg().includes('cy="3.5" r="3.5"'));
  assert(svg().includes('stop-opacity="0"'));
  assert(svg().includes('stop-opacity="0.3"'));
  assert.equal((svg().match(/<linearGradient /g) || []).length, 2);
  assert(!svg().includes('<animate'));
  assert(svg().includes('<circle cx="40" cy="'));
  const beforeColorChange = state.spinnerSrc.value;
  core.updateConfig({ typographyOffset: 10 });
  assert.equal(state.spinnerSize.value, 34);
  assert.equal(state.spinnerStyle.value.width, '34px');
  assert.equal(state.spinnerStyle.value.height, '34px');
  assert.equal(state.spinnerSrc.value, beforeColorChange);
  props.scaleWithFont = false;
  assert.equal(state.spinnerSize.value, 24);
  core.updateConfig({ typographyOffset: -99 });
  assert.equal(state.spinnerSize.value, 24);
  props.scaleWithFont = true;
  assert.equal(state.spinnerSize.value, 1);
  props.scaleWithFont = false;
  props.color = ['primary-6', '#FFFFFF'];
  core.setThemeColor('primary', '#1890FF');
  assert(svg().includes('stop-color="#1890FF"'));
  assert.notEqual(state.spinnerSrc.value, beforeColorChange);
  core.setThemeMode('dark');
  assert(svg().includes('stop-color="#FFFFFF"'));
  props.color = 'rgba(1, 2, 3, 0.5)';
  assert(svg().includes('stop-color="rgba(1, 2, 3, 0.5)"'));
  props.color = '"/><script>bad</script>&';
  assert(!svg().includes('<script>'));
  assert(svg().includes('&quot;/&gt;&lt;script&gt;bad&lt;/script&gt;&amp;'));
  props.color = '#FFFFFF';
  props.animated = false;
  assert.equal(Object.hasOwn(state.spinnerStyle.value, 'transform'), false);
  const fixedShape = state.spinnerSrc.value;
  for (const size of [0.5, 20, 32, 80, Number.MAX_VALUE]) {
    props.size = size;
    assert.equal(state.spinnerStyle.value.width, `${size}px`);
    assert.equal(state.spinnerStyle.value.height, `${size}px`);
    assert.equal(state.spinnerSrc.value, fixedShape);
  }
  for (const size of [0, -1, NaN, Infinity]) {
    props.size = size;
    assert.equal(state.spinnerSize.value, 24);
  }
  const helpers = cache.get(path.resolve(__dirname, '../components/ucs-spinner/svg.js')).namespace;
  helpers.getSpinnerSource('#010203');
  const sameColorCount = encodes;
  for (let index = 0; index < 100; index++) helpers.getSpinnerSource('#010203');
  assert.equal(encodes, sameColorCount);
  for (let index = 0; index < 64; index++) helpers.getSpinnerSource(`rgb(0, 0, ${index})`);
  const filled = encodes;
  helpers.getSpinnerSource('rgb(0, 0, 0)');
  assert.equal(encodes, filled);
  helpers.getSpinnerSource('rgb(1, 1, 1)');
  const afterInsert = encodes;
  helpers.getSpinnerSource('rgb(0, 0, 0)');
  assert.equal(encodes, afterInsert);
  helpers.getSpinnerSource('rgb(0, 0, 1)');
  assert.equal(encodes, afterInsert + 1);
  delete globalThis.__ucsSpinnerEncodingProbe;
  console.log('PASS spinner SFC/CSS compilation, font scaling toggle, Base64 gradient SVG, live colors, fixed proportions and CSS animation');
})().catch(error => { console.error(error); process.exitCode = 1; });
