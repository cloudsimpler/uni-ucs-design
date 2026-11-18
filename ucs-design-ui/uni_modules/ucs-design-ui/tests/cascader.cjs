const path = require('node:path');
const assert = require('node:assert/strict');
const { runtime, renderer } = require('./helpers/runtime.cjs');
(async () => {
  const r = runtime(), { vue } = r;
  const { snapshotTree, buildPath } = await r.importFile(path.resolve(__dirname, '../components/ucs-cascader/tree.js'));
  const data = [{ label: 'A', value: 'a', children: [{ label: 'A1', value: 0 }, { label: 'A2', value: '0' }] }, { label: 'B', value: 'b', children: [{ label: 'B1', value: 'b1', children: [{ label: 'Leaf', value: 'leaf' }] }] }, { label: 'C', value: 'c' }];
  const copy = snapshotTree(data);
  assert(Object.isFrozen(copy)); assert(Object.isFrozen(copy[0].children[0]));
  assert.deepEqual(Array.from(buildPath(copy, ['a', '0']).indexes), [0, 1]);
  assert.deepEqual(Array.from(buildPath(copy, ['missing', '0']).indexes), [0, 0]);
  const cyclic = { label: 'cycle', value: 1 }; cyclic.children = [cyclic];
  assert.throws(() => snapshotTree([cyclic]), /循环/);
  assert.throws(() => snapshotTree([{ label: 'a', value: 1 }, { label: 'b', value: 1 }]), /重复/);
  assert.throws(() => snapshotTree([{ label: 'a', value: 1, children: {} }]), /数组/);
  const Cascader = (await r.importFile(path.resolve(__dirname, '../components/ucs-cascader/ucs-cascader.vue'))).default;
  const Popup = (await r.importFile(path.resolve(__dirname, '../components/ucs-popup/ucs-popup.vue'))).default;
  const Button = (await r.importFile(path.resolve(__dirname, '../components/ucs-button/ucs-button.vue'))).default;
  const props = vue.reactive({ options: data, modelValue: ['a', '0'] }), ref = vue.ref(), events = [];
  let reentry;
  const { renderer: rr, node } = renderer();
  const app = rr.createApp({ render: () => vue.h(Cascader, { ...props, ref,
    'onUpdate:modelValue': value => events.push(['value', [...value]]),
    onConfirm: value => events.push(['confirm', value]), onCancel: reason => events.push(['cancel', reason]),
    onClose: reason => { events.push(['close', reason]); reentry?.(); }, onError: error => events.push(['error', error])
  }) });
  app.component('ucs-popup', Popup); app.component('ucs-button', Button);
  for (const name of ['ucs-text', 'ucs-icon', 'ucs-safe-area', 'ucs-spinner']) app.component(name, { render: () => vue.h('view') });
  const host = node('root'); app.mount(host); const s = ref.value.$.setupState;
  function find(n, predicate) { return [...(predicate(n) ? [n] : []), ...n.children.flatMap(child => find(child, predicate))]; }
  assert.equal(ref.value.open(), true); await r.flush(); assert.deepEqual([...s.selection.indexes], [0, 1]);
  const rootKey = s.columnKey(0), childKey = s.columnKey(1);
  s.onChange({ detail: { value: [1, 1] } }); assert.deepEqual(Array.from(s.selection.path, option => option.value), ['b', 'b1', 'leaf']);
  assert.equal(s.columnKey(0), rootKey); assert.notEqual(s.columnKey(1), childKey);
  // Native events can retain the previous column count after a branch shrinks.
  s.onChange({ detail: { value: [2, 0, 0] } }); assert.equal(s.selection.columns.length, 1);
  s.onChange({ detail: { value: [0, 0, 0] } });
  assert.deepEqual(Array.from(s.selection.path, option => option.value), ['a', 0]);
  assert.equal(s.columnKey(1), childKey);
  // The reverse case may report only the old shorter prefix when a branch grows.
  s.onChange({ detail: { value: [1] } }); assert.equal(s.selection.columns.length, 3);
  assert.equal(events.length, 0); ref.value.open(); assert.equal(s.selection.columns.length, 3);
  props.options[1].children[0].label = 'Changed'; props.modelValue = ['c']; await r.flush();
  assert.equal(s.selection.path[1].label, 'B1');
  s.busy = true; await r.flush(); assert.equal(find(host, n => n.type === 'button')[0].props.disabled, true); assert.equal(s.confirm(), false);
  s.busy = false; await r.flush(); find(host, n => n.type === 'button')[0].props.onClick({});
  assert.deepEqual(events.slice(-3).map(item => item[0]), ['close', 'value', 'confirm']);
  assert.deepEqual(events.at(-2)[1], ['b', 'b1', 'leaf']);
  ref.value.open(); await r.flush(); assert.equal(s.selection.columns.length, 1);
  find(host, n => n.props.class === 'ucs-cascader__close')[0].props.onTap(); assert.deepEqual(events.at(-1), ['cancel', 'cancel']);
  ref.value.open(); await r.flush(); s.onMask(); assert.deepEqual(events.at(-1), ['cancel', 'mask']);
  props.closeOnClickMask = false; await r.flush(); ref.value.open(); await r.flush(); s.onMask(); assert.equal(s.opened, true);
  const before = [...s.draft]; s.onChange({ detail: { value: [-1] } }); assert.deepEqual([...s.draft], before); ref.value.close();
  props.options = []; props.modelValue = []; await r.flush(); ref.value.open(); await r.flush(); assert.equal(s.blocked, true); assert.equal(s.confirm(), false); ref.value.close();
  props.options = [{ label: 'a', value: null }]; await r.flush(); assert.equal(ref.value.open(), false); assert.equal(events.at(-1)[0], 'error');
  props.options = data; props.modelValue = ['a', 0]; await r.flush(); ref.value.open(); await r.flush();
  reentry = () => { props.options = []; ref.value.open(); };
  s.confirm(); assert.deepEqual(Array.from(events.at(-1)[1].value), ['a', 0]); reentry = null;
  app.unmount(); assert.equal(ref.value, null);
  console.log('PASS cascader: tree validation and snapshots, typed paths, variable depth, parent reset, draft isolation, native actions, busy guard, empty/error and reentry');
})().catch(error => { console.error(error); process.exitCode = 1; });
