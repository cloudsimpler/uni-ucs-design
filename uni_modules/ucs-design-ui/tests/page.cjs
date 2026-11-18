const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const vue = require('vue');
const { parse, compileScript, compileTemplate, compileStyle } = require('@vue/compiler-sfc');
const { baseParse } = require('@vue/compiler-dom');

(async () => {
  let now = 0, timerId = 0;
  const timers = new Map(), unmounts = [], cache = new Map();
  const context = vm.createContext({
    setTimeout(callback, delay) { const id = ++timerId; timers.set(id, { callback, at: now + delay }); return id; },
    clearTimeout(id) { timers.delete(id); }
  });
  function advance(ms) {
    const target = now + ms;
    for (;;) {
      const next = [...timers].filter(([, timer]) => timer.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      now = next[1].at; timers.delete(next[0]); next[1].callback();
    }
    now = target;
  }
  const vueModule = new vm.SyntheticModule(Object.keys(vue), function () {
    for (const key of Object.keys(vue)) this.setExport(key, key === 'onUnmounted' ? callback => unmounts.push(callback) : vue[key]);
  }, { context });
  function load(file) {
    if (cache.has(file)) return cache.get(file);
    let source = fs.readFileSync(file, 'utf8');
    if (file.endsWith('.vue')) {
      const { descriptor, errors } = parse(source, { filename: file });
      assert.deepEqual(errors, []);
      const script = compileScript(descriptor, { id: 'page-test' });
      const template = compileTemplate({ source: descriptor.template.content, filename: file, id: 'page-test', compilerOptions: { bindingMetadata: script.bindings, isCustomElement: tag => ['view', 'text', 'image', 'scroll-view'].includes(tag) } });
      assert.deepEqual(template.errors, []);
      for (const style of descriptor.styles) assert.deepEqual(compileStyle({ source: style.content, filename: file, id: 'page-test' }).errors, []);
      if (file.endsWith('ucs-page.vue')) {
        assert(!source.includes('name="floating"'));
        assert(source.includes('name="scroll-footer"'));
        assert(source.includes('name="overlay"'));
        const ast = baseParse(descriptor.template.content);
        const scroll = ast.children[0].children.find(node => node.tag === 'view' && node.children.some(child => child.tag === 'scroll-view')).children.find(node => node.tag === 'scroll-view');
        const last = scroll.children.filter(node => node.type === 1).at(-1);
        assert.equal(last.props.find(prop => prop.name === 'slot').value.content, 'refresher');
        assert(source.includes(':animated="phase === \'refreshing\'"'));
      }
      source = script.content + '\n' + template.code;
    }
    const module = new vm.SourceTextModule(source, { identifier: file, context });
    cache.set(file, module); return module;
  }
  const filename = path.resolve(__dirname, '../components/ucs-page/ucs-page.vue');
  const entry = load(filename);
  await entry.link((specifier, parent) => specifier === 'vue' ? vueModule : load(path.resolve(path.dirname(parent.identifier), specifier)));
  await entry.evaluate();
  const component = entry.namespace.default;
  component.render = entry.namespace.render;
  const core = cache.get(path.resolve(__dirname, '../core/config.js')).namespace;
  const scopes = [];
  function setup(overrides = {}, listener) {
    const props = vue.reactive(Object.assign(Object.fromEntries(Object.entries(component.props).map(([key, prop]) => [key, typeof prop.default === 'function' ? prop.default() : prop.default])), overrides));
    const events = [];
    const scope = vue.effectScope(); scopes.push(scope);
    let exposed;
    const state = scope.run(() => component.setup(props, { expose(value) { exposed = value; }, emit(...args) { events.push(args); listener?.(...args); } }));
    return { state, props, events, exposed };
  }
  const { state: s, props, events, exposed } = setup({ refresherEnabled: true });
  assert.equal(exposed.showToast('尚未挂载'), false);
  exposed.hideToast();
  let toastOptions, toastHides = 0;
  s.toastRef.value = { show(options) { toastOptions = options; return true; }, hide() { toastHides++; } };
  const toastRequest = { text: '成功', type: 'success', duration: 1000 };
  assert.equal(exposed.showToast(toastRequest), true); assert.equal(toastOptions, toastRequest);
  exposed.hideToast(); exposed.hideToast(); assert.equal(toastHides, 2);
  assert.equal(exposed.showMaskLoading(), false); exposed.hideMaskLoading();
  let blockingOptions, blockingHides = 0;
  s.maskLoadingRef.value = { show(options) { blockingOptions = options; return true; }, hide() { blockingHides++; } };
  assert.equal(exposed.showMaskLoading({ text: '正在提交' }), true); assert.equal(blockingOptions.text, '正在提交');
  exposed.hideMaskLoading(); exposed.hideMaskLoading(); assert.equal(blockingHides, 2);
  assert.equal(s.threshold.value, 64);
  assert.equal(s.phase.value, 'idle');
  const previousEvents = events.length;
  exposed.showLoading(); exposed.showLoading();
  assert.equal(s.loading.value, true);
  assert.equal(exposed.startPullDownRefresh(), false);
  s.onRefresh({}); s.onPulling({ detail: { dy: 80 } }); s.onScrollToLower({});
  assert.equal(s.phase.value, 'idle'); assert.equal(events.length, previousEvents);
  exposed.hideLoading(); exposed.hideLoading(); assert.equal(s.loading.value, false);
  assert.equal(s.loadingVisible.value, false);
  exposed.showLoading(200); assert.equal(s.loading.value, true); assert.equal(s.loadingVisible.value, false);
  assert.equal(exposed.startPullDownRefresh(), false);
  advance(100); exposed.showLoading(0); advance(99);
  assert.equal(s.loadingVisible.value, false);
  advance(1); assert.equal(s.loadingVisible.value, true);
  exposed.hideLoading();
  exposed.showLoading(200); advance(100); exposed.hideLoading(); advance(500);
  assert.equal(s.loadingVisible.value, false); assert.equal(timers.size, 0);
  exposed.showLoading(200); advance(100); exposed.hideLoading(); exposed.showLoading(300);
  advance(200); assert.equal(s.loadingVisible.value, false);
  advance(100); assert.equal(s.loadingVisible.value, true); exposed.hideLoading();
  for (const delay of [undefined, 0, -10, NaN, Infinity, '200']) {
    exposed.showLoading(delay); assert.equal(s.loadingVisible.value, true); assert.equal(timers.size, 0); exposed.hideLoading();
  }
  s.onScrollToLower({}); assert.equal(events.at(-1)[0], 'scrolltolower');
  s.onPulling({ detail: { dy: s.threshold.value / 2 } });
  assert.equal(s.progress.value, 0.5);
  assert.equal(s.ringStyle.value.transform, 'rotate(96deg)');
  s.onAbort({}); assert.equal(s.phase.value, 'idle');
  for (const dy of [-5, NaN, Infinity, undefined]) { s.onPulling({ detail: { dy } }); assert.equal(s.progress.value, 0); }
  s.onPulling({ detail: { dy: 200 } }); assert.equal(s.progress.value, 1);
  assert.equal(s.ringStyle.value.transform, 'rotate(600deg)');
  s.onPulling({ detail: { dy: 100 } });
  assert.equal(s.progress.value, 1);
  assert.equal(s.ringStyle.value.transform, 'rotate(300deg)');
  const releaseAngle = s.ringStyle.value.transform;
  const refreshEvent = { detail: {} };
  s.onRefresh(refreshEvent); s.onRefresh(refreshEvent);
  assert.equal(s.ringStyle.value.transform, releaseAngle);
  assert.equal(events.filter(([name]) => name === 'refresherrefresh').length, 1);
  assert.equal(events.find(([name]) => name === 'refresherrefresh')[1], refreshEvent);
  s.onAbort({}); s.onRestore({}); s.onPulling({ detail: { dy: 1 } });
  assert.equal(s.phase.value, 'refreshing');
  exposed.showLoading(); assert.equal(s.phase.value, 'refreshing');
  exposed.hideLoading(); assert.equal(s.nativeTriggered.value, true);
  assert.equal(s.ringStyle.value.transform, releaseAngle);
  exposed.stopPullDownRefresh(); advance(250); exposed.stopPullDownRefresh();
  assert.equal(s.phase.value, 'complete');
  assert.equal(s.nativeTriggered.value, true);
  assert.equal(s.puckStyle.value.width, '40px');
  s.onRefresh({}); assert.equal(s.phase.value, 'complete');
  advance(250); assert.equal(s.nativeTriggered.value, false);
  assert.equal(s.phase.value, 'restoring');
  s.onRestore({}); assert.equal(s.phase.value, 'idle'); assert.equal(timers.size, 0);
  // Ref starts and native notifications share one dispatch per refresh cycle.
  assert(!Object.hasOwn(component.props, 'refresherTriggered'));
  assert(!component.emits.includes('update:refresherTriggered'));
  const previousRefreshes = events.filter(([name]) => name === 'refresherrefresh').length;
  assert.equal(exposed.startPullDownRefresh(), true);
  assert.equal(exposed.startPullDownRefresh(), false);
  assert.equal(s.phase.value, 'refreshing');
  assert.equal(s.ringStyle.value.transform, 'rotate(0deg)');
  s.onRefresh({}); s.onRefresh({});
  assert.equal(events.filter(([name]) => name === 'refresherrefresh').length, previousRefreshes + 1);
  assert.equal(events.filter(([name]) => name === 'refresherrefresh').at(-1)[1], null);
  exposed.stopPullDownRefresh(); advance(500);
  exposed.startPullDownRefresh(); advance(1000);
  assert.equal(s.phase.value, 'refreshing'); assert.equal(timers.size, 0);
  props.scrollEnabled = false; await vue.nextTick(); assert.equal(s.phase.value, 'idle');
  assert.equal(exposed.startPullDownRefresh(), false);
  s.onRefresh({}); assert.equal(s.nativeTriggered.value, false);
  props.scrollEnabled = true; await vue.nextTick(); assert.equal(s.phase.value, 'idle');
  assert.equal(exposed.startPullDownRefresh(), true);
  core.setThemeMode('dark'); assert.equal(s.pageColor.value, '#141414'); assert.equal(s.puckStyle.value.backgroundColor, '#262626');
  assert.equal(s.pageStyle.value['--ucs-primary-6'], core.getThemeColor('primary-6'));
  assert.equal(s.pageStyle.value['--ucs-gray-12'], core.getThemeColor('gray-12'));
  assert.equal(s.pageStyle.value.backgroundColor, s.pageColor.value);
  const sharedVars = s.cssVars.value;
  assert.equal(Object.keys(sharedVars).length, 67);
  assert.equal(s.pageStyle.value['--ucs-primary'], core.getThemeColor('primary'));
  core.setThemeColor('primary', '#123456');
  assert.equal(s.pageStyle.value['--ucs-primary-6'], core.getThemeColor('primary-6'));
  assert.notEqual(s.cssVars.value, sharedVars);
  core.updateConfig(vm.runInContext('({ typographyOffset: 30 })', context)); assert.equal(s.threshold.value, 64);
  for (const value of [0, -1, NaN, Infinity]) { props.refresherThreshold = value; assert(Number.isFinite(s.threshold.value)); }
  core.resetConfig();
  props.refresherEnabled = false; await vue.nextTick(); assert.equal(timers.size, 0);
  const initial = setup({ refresherEnabled: true });
  assert.equal(initial.state.nativeTriggered.value, false);
  initial.exposed.startPullDownRefresh();
  assert.equal(initial.state.nativeTriggered.value, true);
  initial.exposed.stopPullDownRefresh(); advance(850); assert.equal(initial.state.phase.value, 'idle');
  let synchronous;
  synchronous = setup({ refresherEnabled: true }, name => { if (name === 'refresherrefresh') synchronous.exposed.stopPullDownRefresh(); });
  synchronous.exposed.startPullDownRefresh(); assert.equal(synchronous.state.phase.value, 'complete');
  // Mount the real page: toggling the loading layer must retain scroll-view and slot instances.
  const node = type => ({ type, children: [], parent: null, props: {} });
  const renderer = vue.createRenderer({
    createElement: node, createText: node, createComment: node,
    setText() {}, setElementText() {}, patchProp(n, key, old, value) { n.props[key] = value; },
    parentNode: n => n.parent, nextSibling: () => null,
    insert(n, p, anchor) { n.parent = p; const at = anchor ? p.children.indexOf(anchor) : -1; if (at < 0) p.children.push(n); else p.children.splice(at, 0, n); },
    remove(n) { n.parent.children.splice(n.parent.children.indexOf(n), 1); }
  });
  let mounts = 0, removals = 0;
  const Child = { setup() { mounts++; vue.onBeforeUnmount(() => removals++); return () => vue.h('view'); } };
  const page = vue.ref(null), host = node('root');
  const app = renderer.createApp({ render: () => vue.h(component, { ref: page }, { default: () => vue.h(Child) }) });
  app.component('ucs-spinner', { render: () => vue.h('view') });
  app.component('ucs-icon', { render: () => vue.h('view') });
  app.component('ucs-toast', { render: () => null });
  app.component('ucs-loading', { render: () => null });
  app.mount(host);
  const main = host.children[0].children.find(n => n.props.class === 'ucs-page__main');
  const scroll = main.children.find(n => n.type === 'scroll-view');
  for (let i = 0; i < 10; i++) {
    page.value.showLoading(); await vue.nextTick();
    assert(main.children.some(n => n.props.class === 'ucs-page__loading'));
    page.value.hideLoading(); await vue.nextTick();
    assert.equal(main.children.find(n => n.type === 'scroll-view'), scroll);
    assert.equal(mounts, 1); assert.equal(removals, 0);
  }
  app.unmount(); assert.equal(removals, 1);
  const pending = setup(); pending.exposed.showLoading(200);
  for (const unmount of unmounts) unmount();
  for (const scope of scopes) scope.stop();
  assert.equal(timers.size, 0); assert.equal(synchronous.exposed.startPullDownRefresh(), false); advance(2000);
  assert.equal(pending.state.loadingVisible.value, false);
  exposed.showLoading(); assert.equal(s.loading.value, false);
  assert.equal(exposed.showToast('已卸载'), false);
  assert.equal(exposed.showMaskLoading(), false); exposed.hideMaskLoading(); assert.equal(blockingHides, 2);
  exposed.hideToast(); assert.equal(toastHides, 2);
  assert.equal(synchronous.state.phase.value, 'complete');
  console.log('PASS page and child SFC compilation, last refresher slot, pull progress, duplicate events, synchronous completion, ref refresh, timer races, disabled scroll, cleanup, theme and fixed refresh sizing');
})().catch(error => { console.error(error); process.exitCode = 1; });
