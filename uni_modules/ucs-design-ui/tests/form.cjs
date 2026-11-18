const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const vue = require('vue');
const { parse, compileScript, compileTemplate, compileStyle } = require('@vue/compiler-sfc');

(async () => {
  const context = vm.createContext({ console, setTimeout, clearTimeout });
  const cache = new Map();
  const vueModule = new vm.SyntheticModule(Object.keys(vue), function () {
    for (const key of Object.keys(vue)) this.setExport(key, vue[key]);
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
  const entry = load(path.resolve(__dirname, '../composables/form.js'));
  await entry.link((name, parent) => name === 'vue' ? vueModule : load(path.resolve(path.dirname(parent.identifier), name)));
  await entry.evaluate();
  const { createForm } = entry.namespace;
  // Built-in field rules must not traverse unrelated model branches during input validation.
  let unrelatedReads = 0;
  const expensive = { value: 'valid' };
  Object.defineProperty(expensive, 'unrelated', { enumerable: true, get() { unrelatedReads++; return { deep: ['data'] }; } });
  const efficient = createForm(() => expensive, () => ({}));
  const efficientField = efficient.register('value', () => [{ required: true }]);
  assert.equal((await efficientField.validate()).valid, true);
  assert.equal(unrelatedReads, 0);
  efficient.dispose();
  // Custom validators retain full cross-field snapshots, with mutation isolated per field and from submit.
  const isolatedModel = { value: 'valid', nested: { count: 1 } };
  let submitted;
  const isolated = createForm(() => isolatedModel, () => ({}));
  isolated.register('value', () => [{ validator(rule, value, callback, source) {
    assert.equal(source.nested.count, 1); source.nested.count = 9; callback();
  } }]);
  isolated.register('nested', () => [{ validator(rule, value, callback, source) {
    assert.equal(source.nested.count, 1); callback();
  } }]);
  assert.equal((await isolated.submit(snapshot => { submitted = snapshot; })).valid, true);
  assert.equal(submitted.nested.count, 1); assert.equal(isolatedModel.nested.count, 1);
  isolated.dispose();
  const model = { profile: { name: '' }, slow: 'first' };
  const rules = { 'profile.name': [{ required: true, message: 'required', trigger: 'blur' }, { min: 2, message: 'short', trigger: 'change' }] };
  const form = createForm(() => model, () => rules);
  const field = form.register('profile.name', () => undefined);
  assert.equal((await form.validate()).valid, false);
  assert.equal(field.error.value, 'required');
  model.profile.name = 'x'; field.invalidate();
  assert.equal((await field.validate('change')).valid, false);
  assert.equal(field.error.value, 'short');
  model.profile.name = 'valid'; field.invalidate();
  assert.equal((await form.validate()).valid, true);
  assert.throws(() => form.register('__proto__.x', () => []));
  assert.throws(() => form.register('profile.name', () => []));
  await assert.rejects(form.validate('unknown'));
  let resolveCheck;
  const slow = form.register('slow', () => [{ asyncValidator: () => new Promise(resolve => { resolveCheck = resolve; }) }]);
  const old = slow.validate(); slow.invalidate(); resolveCheck();
  assert.equal((await old).cancelled, true);
  assert.equal(slow.validating.value, false);
  // Editing an already-validated field while another is pending invalidates the whole submit.
  const cross = form.validate(); await Promise.resolve(); field.invalidate(); resolveCheck();
  assert.equal((await cross).cancelled, true);
  const removed = slow.validate(); slow.unregister(); resolveCheck();
  assert.equal((await removed).cancelled, true);
  let finishSubmit, calls = 0;
  const handler = async snapshot => { calls++; assert.equal(snapshot.profile.name, 'valid'); await new Promise(resolve => { finishSubmit = resolve; }); };
  const first = form.submit(handler), second = form.submit(handler);
  assert.equal(first, second);
  for (let i = 0; i < 10 && !finishSubmit; i++) await Promise.resolve();
  assert.equal(calls, 1); assert.equal(form.submitting.value, true);
  finishSubmit(); assert.equal((await first).valid, true); assert.equal(form.submitting.value, false);
  await assert.rejects(form.submit(() => { throw new Error('network'); }), /network/);
  assert.equal(form.submitting.value, false);
  form.resetFields(); assert.equal(model.profile.name, ''); assert.equal(field.error.value, '');
  form.dispose(); assert.equal((await form.validate()).cancelled, true);
  // Sweep microtask positions around validation completion and handler dispatch.
  // No handler may receive the invalid value edited after validation began.
  for (let delay = 0; delay < 12; delay++) {
    const data = vue.reactive({ value: 'valid' }); let sent;
    const controller = createForm(() => data, () => ({ value: [{ required: true }] }));
    const registered = controller.register('value', () => undefined);
    const stop = vue.watch(() => data.value, registered.invalidate, { flush: 'sync' });
    const task = controller.submit(snapshot => { sent = snapshot.value; });
    let edit = Promise.resolve();
    for (let step = 0; step < delay; step++) edit = edit.then(() => {});
    const edited = edit.then(() => { data.value = ''; });
    const outcome = await task; await edited;
    assert.notEqual(sent, '', `unvalidated data dispatched at microtask ${delay}`);
    if (outcome.cancelled) assert.equal(sent, undefined);
    else { assert.equal(outcome.valid, true); assert.equal(sent, 'valid'); }
    stop(); controller.dispose();
  }
  for (const file of ['../components/ucs-form/ucs-form.vue', '../components/ucs-form-field/ucs-form-field.vue']) {
    const module = load(path.resolve(__dirname, file));
    await module.link((name, parent) => name === 'vue' ? vueModule : load(path.resolve(path.dirname(parent.identifier), name)));
    await module.evaluate();
    module.namespace.default.render = module.namespace.render;
  }
  // Mount the actual SFCs to verify provide/inject, scoped slots and reactive cancellation.
  const Form = cache.get(path.resolve(__dirname, '../components/ucs-form/ucs-form.vue')).namespace.default;
  const Field = cache.get(path.resolve(__dirname, '../components/ucs-form-field/ucs-form-field.vue')).namespace.default;
  const makeNode = type => ({ type, children: [], parent: null });
  const renderer = vue.createRenderer({
    createElement: makeNode, createText: makeNode, createComment: makeNode,
    patchProp() {}, setText() {}, setElementText() {},
    parentNode: n => n.parent, nextSibling: () => null,
    insert(n, p) { n.parent = p; p.children.push(n); },
    remove(n) { n.parent.children.splice(n.parent.children.indexOf(n), 1); }
  });
  const live = vue.reactive({ email: '' }), instance = vue.ref(null);
  let slotState, formSlotState;
  const app = renderer.createApp({ render: () => vue.h(Form, { ref: instance, model: live, rules: { email: [{ required: true, message: 'email required' }] } }, {
    default: formState => { formSlotState = formState; return vue.h(Field, { name: 'email' }, { default: state => { slotState = state; return vue.h('view', state.error); } }); }
  }) });
  app.mount(makeNode('root'));
  assert.equal((await instance.value.validate()).valid, false);
  await vue.nextTick(); assert.equal(slotState.error, 'email required');
  live.email = 'hello'; await vue.nextTick(); assert.equal(slotState.error, '');
  assert.equal((await slotState.onBlur()).valid, true);
  assert.equal(typeof formSlotState.resetFields, 'function');
  assert.equal(formSlotState.reset, undefined);
  formSlotState.resetFields(); assert.equal(live.email, '');
  app.unmount();
  // Compile the actual demo, including scoped slots and native inputs.
  const demo = fs.readFileSync(path.resolve(__dirname, '../../../pages/index/index.uvue'), 'utf8');
  const d = parse(demo).descriptor;
  const s = compileScript(d, { id: 'demo' });
  assert.deepEqual(compileTemplate({ source: d.template.content, filename: 'index.uvue', id: 'demo', compilerOptions: { bindingMetadata: s.bindings } }).errors, []);
  console.log('PASS form + field SFC/demo compilation, nested paths, trigger rules, stale async results, cross-field edits, unregister, duplicate submit lock, rejection cleanup and reset');
})().catch(error => { console.error(error); process.exitCode = 1; });
