const path = require('node:path');
const assert = require('node:assert/strict');
const { runtime, renderer } = require('./helpers/runtime.cjs');
(async () => {
  const r = runtime(), { vue } = r;
  const Picker = (await r.importFile(path.resolve(__dirname, '../components/ucs-picker/ucs-picker.vue'))).default;
  const Popup = (await r.importFile(path.resolve(__dirname, '../components/ucs-popup/ucs-popup.vue'))).default;
  const Button = (await r.importFile(path.resolve(__dirname, '../components/ucs-button/ucs-button.vue'))).default;
  const core = await r.importFile(path.resolve(__dirname, '../index.js'));
  const props = vue.reactive({ modelValue: 0, options: [{ label: 'Zero', value: 0 }, { label: 'String zero', value: '0' }, { label: 'Empty string', value: '' }] });
  const ref = vue.ref(), events = [];
  const { renderer: rr, node } = renderer();
  const app = rr.createApp({ render: () => vue.h(Picker, { ...props, ref, 'onUpdate:modelValue': value => events.push(['value', value]), onConfirm: event => events.push(['confirm', event]), onCancel: reason => events.push(['cancel', reason]), onClose: reason => events.push(['close', reason]), onError: error => events.push(['error', error]) }) });
  app.component('ucs-popup', Popup); app.component('ucs-button', Button);
  for (const name of ['ucs-text', 'ucs-safe-area', 'ucs-icon', 'ucs-spinner']) app.component(name, { render: () => vue.h('view') });
  const host = node('root'); app.mount(host); const s = ref.value.$.setupState;
  function find(n, predicate) { return [...(predicate(n) ? [n] : []), ...n.children.flatMap(child => find(child, predicate))]; }
  assert(!Object.hasOwn(Picker.props, 'show'));
  assert.equal(ref.value.open(), true); await r.flush(); assert.equal(s.draftIndex, 0);
  s.onChange({ detail: { value: [1] } }); assert.equal(s.draftIndex, 1); assert.equal(events.length, 0);
  ref.value.open(); assert.equal(s.draftIndex, 1);
  props.options[1].label = 'Changed'; props.modelValue = ''; await r.flush();
  assert.equal(s.currentOptions[1].label, 'String zero'); assert.equal(s.draftIndex, 1);
  s.busy = true; await r.flush(); assert.equal(find(host, n => n.type === 'button')[0].props.disabled, true); assert.equal(s.confirm(), false);
  s.busy = false; await r.flush(); find(host, n => n.type === 'button')[0].props.onClick({});
  assert.deepEqual(events.slice(-3).map(item => item[0]), ['close', 'value', 'confirm']);
  assert.equal(events.at(-2)[1], '0'); assert.equal(events.at(-1)[1].index, 1);
  assert.equal(events.at(-1)[1].option.label, 'String zero'); assert(Object.isFrozen(events.at(-1)[1].option));
  assert.equal(s.confirm(), false);
  ref.value.open(); await r.flush(); assert.equal(s.draftIndex, 2);
  find(host, n => n.props.class === 'ucs-picker__close')[0].props.onTap(); assert.deepEqual(events.at(-1), ['cancel', 'cancel']);
  ref.value.open(); await r.flush(); s.onMask(); assert.deepEqual(events.at(-1), ['cancel', 'mask']);
  props.closeOnClickMask = false; await r.flush(); ref.value.open(); await r.flush(); s.onMask(); assert.equal(s.opened, true);
  const selected = s.draftIndex; for (const value of [[-1], [10], [0, 1], [NaN], null]) s.onChange({ detail: { value } });
  assert.equal(s.draftIndex, selected);
  ref.value.close(); assert.deepEqual(events.at(-1), ['close', 'close']);
  props.options = []; await r.flush(); ref.value.open(); await r.flush(); assert.equal(s.blocked, true); assert.equal(s.confirm(), false); ref.value.close();
  for (const options of [[{ label: 'a', value: 1 }, { label: 'b', value: 1 }], [{ label: 'a', value: NaN }], [{ label: 'a', value: null }], [{ value: 1 }]]) {
    props.options = options; await r.flush(); assert.equal(ref.value.open(), false); assert.equal(events.at(-1)[0], 'error');
  }
  props.options = [{ label: 'New', value: 9 }]; props.modelValue = null; await r.flush(); ref.value.open(); await r.flush(); assert.equal(s.draftIndex, 0);
  core.setLanguage('en'); assert.equal(s.confirmLabel, 'Confirm');
  core.updateConfig(r.data({ typographyOffset: 16 })); assert.equal(s.rowHeight, 64);
  app.unmount(); assert.equal(ref.value, null);
  console.log('PASS picker: typed business values, isolated drafts/options, native confirm and icon close, cancel/mask, empty/invalid options, locale and font sizing');
})().catch(error => { console.error(error); process.exitCode = 1; });
