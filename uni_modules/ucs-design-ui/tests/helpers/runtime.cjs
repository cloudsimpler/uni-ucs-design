const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const vue = require('vue');
const { parse, compileScript, compileTemplate, compileStyle } = require('@vue/compiler-sfc');

exports.runtime = function () {
  const cache = new Map(), timers = new Map();
  let clock = 0, timerId = 0;
  const context = vm.createContext({
    setTimeout(callback, delay) { timers.set(++timerId, { callback, at: clock + delay }); return timerId; },
    clearTimeout(id) { timers.delete(id); }
  });
  const vueModule = new vm.SyntheticModule(Object.keys(vue), function () {
    for (const key of Object.keys(vue)) this.setExport(key, vue[key]);
  }, { context });
  function load(file) {
    if (cache.has(file)) return cache.get(file);
    let source = fs.readFileSync(file, 'utf8');
    if (file.endsWith('.vue')) {
      const { descriptor, errors } = parse(source, { filename: file });
      assert.deepEqual(errors, []);
      const script = compileScript(descriptor, { id: 'integration-test' });
      const template = compileTemplate({ source: descriptor.template.content, filename: file, id: 'integration-test', compilerOptions: {
        bindingMetadata: script.bindings, isCustomElement: tag => ['view', 'text', 'scroll-view', 'image', 'picker-view', 'picker-view-column'].includes(tag)
      } });
      assert.deepEqual(template.errors, []);
      for (const style of descriptor.styles) assert.deepEqual(compileStyle({ source: style.content, filename: file, id: 'integration-test' }).errors, []);
      source = script.content + '\n' + template.code;
    }
    const module = new vm.SourceTextModule(source, { identifier: file, context });
    cache.set(file, module); return module;
  }
  async function importFile(file) {
    const module = load(path.resolve(file));
    if (module.status === 'unlinked') await module.link((specifier, parent) => specifier === 'vue' ? vueModule : load(path.resolve(path.dirname(parent.identifier), specifier)));
    if (module.status === 'linked') await module.evaluate();
    if (file.endsWith('.vue')) module.namespace.default.render = module.namespace.render;
    return module.namespace;
  }
  function advance(ms) {
    const target = clock + ms;
    for (;;) {
      const next = [...timers].filter(([, timer]) => timer.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      clock = next[1].at; timers.delete(next[0]); next[1].callback();
    }
    clock = target;
  }
  return { vue, context, timers, importFile, advance,
    async flush() { for (let i = 0; i < 8; i++) await vue.nextTick(); },
    data(value) { return vm.runInContext('(' + JSON.stringify(value) + ')', context); }
  };
};

exports.renderer = function () {
  function node(type, text = '') {
    return { type, text, children: [], parent: null, props: {}, getBoundingClientRect() { return { width: 100, height: 100 }; } };
  }
  const renderer = vue.createRenderer({
    createElement: node, createText: text => node('#text', text), createComment: text => node('#comment', text),
    setText(n, text) { n.text = text; }, setElementText(n, text) { n.text = text; },
    parentNode: n => n.parent, nextSibling: n => n.parent?.children[n.parent.children.indexOf(n) + 1] ?? null,
    insert(n, parent, anchor) {
      if (n.parent) n.parent.children.splice(n.parent.children.indexOf(n), 1);
      n.parent = parent;
      const at = anchor ? parent.children.indexOf(anchor) : -1;
      parent.children.splice(at < 0 ? parent.children.length : at, 0, n);
    },
    remove(n) { n.parent.children.splice(n.parent.children.indexOf(n), 1); n.parent = null; },
    patchProp(n, key, old, value) { n.props[key] = value; }
  });
  return { renderer, node };
};
