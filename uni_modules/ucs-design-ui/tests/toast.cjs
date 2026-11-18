const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const vue = require('vue');
const { parse, compileScript, compileTemplate, compileStyle } = require('@vue/compiler-sfc');
const { preprocess } = require('@dcloudio/uni-cli-shared/lib/preprocess');

(async () => {
  const timers = new Map(), cache = new Map();
  let clock = 0, id = 0;
  const context = vm.createContext({
    setTimeout(callback, delay) { timers.set(++id, { callback, at: clock + delay }); return id; },
    clearTimeout(key) { timers.delete(key); }
  });
  function advance(ms) {
    clock += ms;
    for (const [key, timer] of [...timers]) if (timer.at <= clock) { timers.delete(key); timer.callback(); }
  }
  const vueModule = new vm.SyntheticModule(Object.keys(vue), function () {
    for (const key of Object.keys(vue)) this.setExport(key, vue[key]);
  }, { context });
  function load(file) {
    if (cache.has(file)) return cache.get(file);
    let source = fs.readFileSync(file, 'utf8');
    if (file.endsWith('.vue')) {
      const original = source;
      for (const flags of [{ UNI_APP_X: true, VUE3_VAPOR: true }, {}]) {
        const { descriptor, errors } = parse(preprocess(original, flags, { type: 'html' }), { filename: file });
        assert.deepEqual(errors, []);
        const script = compileScript(descriptor, { id: 'toast-test' });
        const template = compileTemplate({ source: descriptor.template.content, filename: file, id: 'toast-test', compilerOptions: {
          bindingMetadata: script.bindings, isCustomElement: tag => ['view', 'text'].includes(tag)
        } });
        assert.deepEqual(template.errors, []);
        for (const style of descriptor.styles) assert.deepEqual(compileStyle({ source: style.content, filename: file, id: 'toast-test' }).errors, []);
        if (flags.UNI_APP_X) source = script.content + '\n' + template.code;
      }
    }
    const module = new vm.SourceTextModule(source, { identifier: file, context });
    cache.set(file, module); return module;
  }
  const entry = load(path.resolve(__dirname, '../components/ucs-toast/ucs-toast.vue'));
  await entry.link((specifier, parent) => specifier === 'vue' ? vueModule : load(path.resolve(path.dirname(parent.identifier), specifier)));
  await entry.evaluate();
  const component = entry.namespace.default;
  component.render = entry.namespace.render;
  const queries = [];
  const node = (type, text = '') => ({ type, text, children: [], parent: null, props: {},
    getBoundingClientRectAsync() { return new Promise((resolve, reject) => queries.push({ node: this, resolve, reject })); }
  });
  const renderer = vue.createRenderer({
    createElement: node, createText: text => node('text', text), createComment: text => node('comment', text),
    setText(n, text) { n.text = text; }, setElementText(n, text) { n.text = text; },
    parentNode: n => n.parent, nextSibling: n => n.parent?.children[n.parent.children.indexOf(n) + 1] ?? null,
    insert(n, parent, anchor) {
      if (n.parent) n.parent.children.splice(n.parent.children.indexOf(n), 1);
      n.parent = parent;
      const index = anchor ? parent.children.indexOf(anchor) : -1;
      parent.children.splice(index < 0 ? parent.children.length : index, 0, n);
    },
    remove(n) { n.parent.children.splice(n.parent.children.indexOf(n), 1); n.parent = null; },
    patchProp(n, key, old, value) { n.props[key] = value; }
  });
  const app = renderer.createApp(component);
  // Auto-imported children are stubs here; their native/font behavior has separate component tests.
  let liveChildren = 0;
  for (const name of ['ucs-text', 'ucs-icon']) app.component(name, {
    setup() { liveChildren++; vue.onUnmounted(() => liveChildren--); return () => vue.h('view'); }
  });
  const host = node('root');
  const api = app.mount(host), state = api.$.setupState;
  const root = host.children[0];
  assert.deepEqual(Object.keys(api.$.exposed).sort(), ['hide', 'show']);
  async function flush() { for (let i = 0; i < 8; i++) await vue.nextTick(); }
  async function ready() { await flush(); const query = queries.shift(); assert.ok(query); query.resolve({ width: 100, height: 60 }); await flush(); }
  assert.equal(state.items.length, 0);
  assert.equal(api.show('  提示  '), true);
  await flush();
  assert.equal(state.activeId, 0); assert.equal(state.items[0].text, '提示');
  assert.equal(timers.size, 0); advance(5000); assert.equal(state.items.length, 1);
  await ready(); assert.equal(state.activeId, state.items[0].id);
  advance(1999); assert.equal(state.items.length, 1);
  advance(1); await flush(); assert.equal(state.items.length, 0); assert.equal(liveChildren, 0);

  api.show({ text: '第一条', type: 'success' }); await ready();
  const first = state.items[0], stale = [...timers.values()][0].callback;
  advance(1800);
  api.show({ text: '第二条', type: ' ERROR ', duration: 3000 }); await flush();
  assert.equal(state.activeId, first.id); assert.equal(state.items.length, 2);
  assert.equal(state.items[1].icon, 'close-circle');
  await ready(); stale(); assert.equal(state.items.length, 1);
  assert.notEqual(state.activeId, first.id); assert.equal(timers.size, 1);
  advance(2999); assert.equal(state.items.length, 1);
  advance(1); await flush(); assert.equal(state.items.length, 0);

  api.show({ text: '成功', type: 'success', duration: 0 }); await ready();
  assert.ok(Object.isFrozen(state.items[0])); assert.equal(state.items[0].icon, 'checkmark-circle');
  assert.equal(timers.size, 0);
  for (const value of [undefined, null, '', '  ', 0, {}, [], { text: 0 }]) assert.equal(api.show(value), false);
  advance(100000); assert.equal(state.items[0].text, '成功');
  api.hide(); api.hide(); await flush(); assert.equal(state.items.length, 0); assert.equal(liveChildren, 0);

  // Newest pending layout wins; completing an obsolete query cannot restore an old toast.
  api.show('旧准备'); await flush(); const oldQuery = queries.shift();
  api.show({ text: '新准备', type: 'success', duration: 0 }); await flush();
  assert.equal(state.items.length, 1); assert.equal(state.activeId, 0);
  await ready(); const currentId = state.activeId;
  oldQuery.resolve(); await flush(); assert.equal(state.activeId, currentId);
  api.show('准备后取消'); await flush(); const cancelled = queries.shift();
  api.hide(); cancelled.resolve(); await flush(); assert.equal(state.items.length, 0); assert.equal(timers.size, 0);

  // The old toast may expire while its replacement is preparing; the pending one is retained.
  api.show({ text: '短提示', duration: 100 }); await ready();
  api.show({ text: '待准备', duration: 200 }); await flush();
  advance(100); await flush(); assert.equal(state.items.length, 1); assert.equal(state.activeId, 0);
  await ready(); advance(199); assert.equal(state.items.length, 1);
  advance(1); await flush(); assert.equal(state.items.length, 0);

  // A failed query falls back without introducing a fixed wait timer.
  api.show('查询失败'); await flush(); queries.shift().reject(new Error('layout unavailable')); await flush();
  assert.equal(state.activeId, state.items[0].id); assert.equal(timers.size, 1);
  api.hide();
  for (const duration of [-1, NaN, Infinity, '500']) {
    api.show({ text: '无效时长', type: 'unknown', duration }); await ready();
    assert.equal(state.items[0].type, 'text');
    advance(1999); assert.equal(state.items.length, 1);
    advance(1); await flush(); assert.equal(state.items.length, 0);
  }
  api.show({ text: '小数', duration: 0.5 }); await ready(); advance(1); await flush(); assert.equal(state.items.length, 0);
  const core = cache.get(path.resolve(__dirname, '../core/config.js')).namespace;
  core.setThemeMode('dark'); assert.equal(state.foregroundColor, '#181818');
  core.setThemeMode('light'); assert.equal(state.foregroundColor, '#FFFFFF');
  for (let i = 0; i < 20; i++) {
    api.show({ text: '文字', duration: 0 }); await ready();
    const textRecord = state.items[0], textNode = root.children.find(n => n.props.class === 'ucs-toast__layer');
    api.show({ text: '成功', type: 'success', duration: 0 }); await ready();
    assert.notEqual(state.items[0].id, textRecord.id); assert.equal(textRecord.type, 'text');
    assert.notEqual(root.children.find(n => n.props.class === 'ucs-toast__layer'), textNode);
    assert.equal(state.items.length, 1); assert.equal(liveChildren, 2);
    api.hide(); await flush(); assert.equal(liveChildren, 0);
  }
  api.show('A'); api.hide(); api.show('B'); await ready();
  assert.equal(state.items[0].text, 'B'); assert.equal(queries.length, 0);
  const options = { text: '独立', duration: 0 }; api.show(options); options.text = '外部修改'; await ready();
  assert.equal(state.items[0].text, '独立');
  api.show('卸载前'); await ready(); const staleAfterUnmount = [...timers.values()][0].callback;
  api.show('卸载期间准备'); await flush(); const unmountedQuery = queries.shift();
  app.unmount(); assert.equal(timers.size, 0); assert.equal(liveChildren, 0);
  unmountedQuery.resolve(); staleAfterUnmount(); await flush();
  assert.equal(state.items.length, 0); assert.equal(api.show('无效'), false); assert.equal(timers.size, 0);
  assert.equal(state.panels.size, 0);
  console.log('PASS toast: independent keyed nodes, hidden layout preparation, latest request wins, replacement, expiry from display, failed queries, cleanup and SFC compilation');
})().catch(error => { console.error(error); process.exitCode = 1; });
