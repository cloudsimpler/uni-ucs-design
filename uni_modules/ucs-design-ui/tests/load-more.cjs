const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const vue = require('vue');
const { parse, compileScript, compileTemplate, compileStyle } = require('@vue/compiler-sfc');
const { preprocess } = require('@dcloudio/uni-cli-shared/lib/preprocess');

(async () => {
  const cache = new Map();
  const context = vm.createContext({});
  const vueModule = new vm.SyntheticModule(Object.keys(vue), function () {
    for (const key of Object.keys(vue)) this.setExport(key, vue[key]);
  }, { context });
  function load(file) {
    if (cache.has(file)) return cache.get(file);
    let source = fs.readFileSync(file, 'utf8');
    if (file.endsWith('.vue')) {
      const raw = parse(source, { filename: file }).descriptor;
      source = source.replace(raw.scriptSetup.content, preprocess(raw.scriptSetup.content, { UNI_APP_X: true }, { type: 'js' }));
      for (const style of raw.styles) source = source.replace(style.content, preprocess(style.content, { UNI_APP_X: true }, { type: 'css' }));
      const { descriptor, errors } = parse(source, { filename: file });
      assert.deepEqual(errors, []);
      const script = compileScript(descriptor, { id: 'load-more-test' });
      assert.deepEqual(compileTemplate({ source: descriptor.template.content, filename: file, id: 'load-more-test', compilerOptions: { bindingMetadata: script.bindings } }).errors, []);
      for (const style of descriptor.styles) assert.deepEqual(compileStyle({ source: style.content, filename: file, id: 'load-more-test' }).errors, []);
      source = script.content;
    }
    const module = new vm.SourceTextModule(source, { identifier: file, context });
    cache.set(file, module); return module;
  }
  const entry = load(path.resolve(__dirname, '../components/ucs-load-more/ucs-load-more.vue'));
  await entry.link((specifier, parent) => specifier === 'vue' ? vueModule : load(path.resolve(path.dirname(parent.identifier), specifier)));
  await entry.evaluate();
  const component = entry.namespace.default;
  const props = vue.reactive(Object.fromEntries(Object.entries(component.props).map(([key, definition]) => [key, typeof definition.default === 'function' ? definition.default() : definition.default])));
  const state = component.setup(props, { expose() {},  });
  const core = cache.get(path.resolve(__dirname, '../core/config.js')).namespace;
  assert.equal(component.emits, undefined);
  assert.deepEqual(Object.keys(component.props).sort(), ['color', 'showText', 'status']);
  assert.equal(props.showText, false);
  assert.equal(state.visible.value, true);
  assert.equal(state.iconName.value, 'more-horizontal');
  assert.equal(state.displayText.value, '');
  for (const [status, name, color] of [
    ['ready', 'more-horizontal', 'gray-7'],
    ['error', 'close-circle', 'danger-6'],
    ['finished', 'checkmark-circle', 'success-6']
  ]) {
    props.status = status;
    assert.equal(state.iconName.value, name);
    assert.equal(state.contentColor.value, core.getThemeColor(color));
    assert.equal(state.visible.value, true);
    assert.equal(state.loading.value, false);
    assert.equal(state.displayText.value, '');
  }
  props.status = 'loading';
  assert.equal(state.loading.value, true);
  assert.equal(state.contentColor.value, core.getThemeColor('primary-6'));
  props.showText = true;
  assert.equal(state.symbolStyle.value.width, '16px');
  core.updateConfig(vm.runInContext('({ typographyOffset: 4 })', context));
  assert.equal(state.symbolStyle.value.width, '20px');
  assert.equal(state.symbolStyle.value.height, '20px');
  props.showText = false;
  assert.equal(state.symbolStyle.value.width, '24px');
  props.showText = true;
  assert.equal(state.displayText.value, '加载中…');
  props.status = 'ready'; assert.equal(state.displayText.value, '上拉加载更多');
  props.status = ' ERROR '; assert.equal(state.displayText.value, '加载失败');
  props.status = 'finished'; assert.equal(state.displayText.value, '没有更多了');
  props.status = 'hidden'; assert.equal(state.visible.value, false); assert.equal(state.displayText.value, '');
  for (const value of ['invalid', '', null]) { props.status = value; assert.equal(state.statusValue.value, 'ready'); }
  core.setLanguage('en'); assert.equal(state.displayText.value, 'Pull up to load more');
  props.status = 'loading'; assert.equal(state.displayText.value, 'Loading');
  core.setLanguage('zh-Hant'); assert.equal(state.displayText.value, '載入中…');
  core.setThemeMode('dark'); assert.equal(state.lineStyle.value.backgroundColor, core.getThemeColor('gray-4'));
  props.color = ['#123456', '#ABCDEF']; assert.equal(state.contentColor.value, '#ABCDEF');
  core.setThemeMode('light'); assert.equal(state.contentColor.value, '#123456');
  props.color = '  '; props.status = 'error'; assert.equal(state.contentColor.value, core.getThemeColor('danger-6'));
  props.showText = false; assert.equal(state.displayText.value, '');
  assert.equal(state.symbolStyle.value.width, '24px');
  console.log('PASS load-more/child SFC compilation, 5 states, icon/text modes, state colors, locale changes and color overrides');
})().catch(error => { console.error(error); process.exitCode = 1; });
