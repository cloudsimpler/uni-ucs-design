const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const vue = require('vue');
const { parse, compileScript, compileTemplate, compileStyle } = require('@vue/compiler-sfc');
const { initPreContext, preUVueHtml } = require('@dcloudio/uni-cli-shared');

(async () => {
  const context = vm.createContext({ console, setTimeout, clearTimeout });
  const cache = new Map();
  const attrs = { class: "custom", style: { borderRadius: "10px" }, "open-type": "share", onError() {} };
  const vueModule = new vm.SyntheticModule(Object.keys(vue), function () {
    for (const key of Object.keys(vue)) this.setExport(key, key === 'useAttrs' ? () => attrs : vue[key]);
  }, { context });
  function load(file) {
    if (cache.has(file)) return cache.get(file);
    let source = fs.readFileSync(file, 'utf8');
    if (/\.(vue|uvue)$/.test(file)) {
      const { descriptor, errors } = parse(source, { filename: file });
      assert.deepEqual(errors, []);
      const script = compileScript(descriptor, { id: 'form-test' });
      const template = compileTemplate({ source: descriptor.template.content, filename: file, id: 'form-test', compilerOptions: { bindingMetadata: script.bindings } });
      assert.deepEqual(template.errors, []);
      for (const style of descriptor.styles) assert.deepEqual(compileStyle({ source: style.content, filename: file, id: 'form-test' }).errors, []);
      source = script.content + '\n' + template.code;
    }
    const module = new vm.SourceTextModule(source, { identifier: file, context });
    cache.set(file, module); return module;
  }
  const entry = load(path.resolve(__dirname, '../components/ucs-button/ucs-button.vue'));
  await entry.link((name, parent) => name === 'vue' ? vueModule : load(path.resolve(path.dirname(parent.identifier), name)));
  await entry.evaluate();
  const component = entry.namespace.default;
  const props = vue.reactive(Object.fromEntries(Object.entries(component.props).map(([key, p]) => [key, typeof p.default === 'function' ? p.default() : p.default])));
  const events = [];
  const state = component.setup(props, { expose() {}, emit(...args) { events.push(args); } });
  assert.equal(state.blocked.value, false);
  const event = {};
  state.onClick(event);
  assert.deepEqual(events.map(e => e[0]), ['tap', 'click']);
  assert.equal(events[0][1], event);
  props.loading = true;
  state.onClick(event); state.onLongPress(event);
  assert.equal(events.length, 2);
  props.loading = false; props.disabled = true;
  state.onClick(event); assert.equal(events.length, 2);
  props.disabled = false; state.onLongPress(event); assert.equal(events.at(-1)[0], 'longpress');
  props.text = 0; assert.equal(state.hasText.value, true);
  assert(!Object.hasOwn(component.props, 'fontSize'));
  assert(!Object.hasOwn(component.props, 'hoverClass'));
  assert.equal(state.baseSize.value, 16);
  assert.equal(state.baseLineHeight.value, 24);
  assert.equal(state.buttonStyle.value.minHeight, '48px');
  assert.equal(state.buttonStyle.value.padding, '0px 24px');
  assert.equal(state.buttonStyle.value.maxWidth, '280px');
  props.size = 'mini'; assert.equal(state.baseSize.value, 14);
  assert.equal(state.buttonStyle.value.minHeight, '32px');
  assert.equal(state.buttonStyle.value.padding, '0px 12px');
  props.block = true; assert.equal(state.buttonStyle.value.width, '100%');
  assert.equal(Object.hasOwn(state.buttonStyle.value, 'maxWidth'), false);
  props.block = false; assert.equal(state.buttonStyle.value.maxWidth, '280px');
  props.block = true; assert.equal(Object.hasOwn(state.buttonStyle.value, 'maxWidth'), false);
  props.type = 'invalid'; assert.equal(state.typeValue.value, 'primary');
  props.size = 'default';
  assert.equal(state.nativeAttrValue('open-type', 'openType'), 'share');
  attrs['open-type'] = 'contact';
  assert.equal(state.nativeAttrValue('open-type', 'openType'), 'contact');
  delete attrs['open-type']; attrs.openType = 'feedback';
  assert.equal(state.nativeAttrValue('open-type', 'openType'), 'feedback');
  const touches = []; attrs.onTouchstart = e => touches.push(e);
  state.forwardNativeEvent('onTouchstart', event); assert.equal(touches[0], event);
  const buttonTemplate = parse(fs.readFileSync(path.resolve(__dirname, '../components/ucs-button/ucs-button.vue'), 'utf8')).descriptor.template.content;
  assert(!/\bv-bind\s*=/.test(buttonTemplate));
  for (const [platform, utsPlatform] of [['app', 'app-android'], ['h5', undefined], ['mp-weixin', undefined]]) {
    initPreContext(platform, {}, utsPlatform, true);
    const template = preUVueHtml(buttonTemplate, 'ucs-button.vue');
    assert(!/\bv-bind\s*=/.test(template));
    assert.equal((template.match(/<button\b/g) || []).length, 1);
    assert(template.includes(":form-type=\"nativeAttrValue('form-type', 'formType')\""));
  }
  const core = cache.get(path.resolve(__dirname, '../core/config.js')).namespace;
  core.updateConfig(vm.runInContext('({ typographyOffset: 2 })', context)); assert.equal(state.buttonStyle.value.fontSize, '18px');
  assert.equal(state.buttonStyle.value.lineHeight, '27px');
  assert.equal(state.buttonStyle.value.minHeight, '51px');
  for (const mode of ['light', 'dark']) {
    core.setThemeMode(mode);
    for (const type of ['primary', 'success', 'warning', 'danger', 'default']) {
      props.type = type;
      assert.equal(state.typeValue.value, type);
      assert.equal(state.buttonStyle.value.backgroundColor, core.getThemeColor(type === 'default' ? ['gray-3', 'gray-4'] : `${type}-6`));
      assert.equal(state.contentColor.value, core.getThemeColor(type === 'default' ? ['gray-12', 'gray-10'] : '#FFFFFF'));
    }
  }
  props.type = 'warn'; assert.equal(state.typeValue.value, 'primary'); // removed enum is not a danger alias
  props.type = 'danger';
  props.disabled = true; assert.equal(state.contentColor.value, core.getThemeColor(['gray-6', 'gray-7']));
  props.color = ['#FFFFFF', '#000000']; core.setThemeMode('dark');
  assert.equal(state.buttonStyle.value.color, '#000000');
  assert.equal(state.pressClass.value, 'none');
  props.disabled = false;
  assert.equal(state.pressClass.value, 'ucs-button__native--pressed-dark');
  props.color = ''; props.type = 'default';
  assert.equal(state.spinnerColor.value, '#606060');
  props.loading = true; assert.equal(state.pressClass.value, 'none');
  console.log('PASS button and child SFC compilation, disabled/loading event guards, numeric text, theme/font changes and live native attribute forwarding');
})().catch(error => { console.error(error); process.exitCode = 1; });
