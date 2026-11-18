const path = require('node:path');
const assert = require('node:assert/strict');
const { runtime, renderer } = require('./helpers/runtime.cjs');
(async () => {
  const r = runtime(), { vue } = r;
  const Sheet = (await r.importFile(path.resolve(__dirname, '../components/ucs-action-sheet/ucs-action-sheet.vue'))).default;
  const Popup = (await r.importFile(path.resolve(__dirname, '../components/ucs-popup/ucs-popup.vue'))).default;
  const core = await r.importFile(path.resolve(__dirname, '../index.js'));
  const props = vue.reactive({ actions: [{ text: 'Menu' }, { text: 'Delete', type: 'danger', description: 'Description' }, { text: 'Disabled', disabled: true }] });
  const ref = vue.ref(), events = [];
  let onClose;
  const { renderer: hostRenderer, node } = renderer();
  const app = hostRenderer.createApp({ render: () => vue.h(Sheet, { ...props, ref,
    onOpen: () => events.push(['open']), onClose: reason => { events.push(['close', reason]); onClose?.(); },
    onSelect: event => events.push(['select', event]), onCancel: reason => events.push(['cancel', reason]) }) });
  app.component('ucs-popup', Popup);
  for (const name of ['ucs-text', 'ucs-safe-area']) app.component(name, { render: () => vue.h('view') });
  const host = node('root'); app.mount(host);
  const s = ref.value.$.setupState;
  assert(!Object.hasOwn(Sheet.props, 'show'));
  ref.value.open(); ref.value.open(); await r.flush();
  assert.equal(events.length, 1);
  assert.equal(s.popupRef.$.props.safeAreaInsetBottom, true);
  assert.equal(s.popupRef.$.props.placement, 'bottom');
  assert.equal(s.select(2), false); assert.equal(s.select(-1), false);
  assert.equal(s.itemColor(props.actions[1]), core.getThemeColor('danger-6'));
  assert.equal(s.select(1), true); assert.equal(events.at(-2)[1], 'select');
  assert.equal(events.at(-1)[1].item, props.actions[1]); assert.equal(events.at(-1)[1].index, 1);
  assert.equal(s.select(0), false);
  await r.flush(); r.advance(240); await r.flush();
  ref.value.open(); await r.flush(); props.closeOnClickMask = false; await r.flush();
  s.onClickMask(); assert.equal(s.popupRef.$.setupState.leaving, false);
  props.closeOnClickMask = true; await r.flush(); s.onClickMask();
  assert.deepEqual(events.slice(-2), [['close', 'mask'], ['cancel', 'mask']]);
  ref.value.open(); await r.flush(); assert.equal(s.cancel('cancel'), true);
  assert.deepEqual(events.slice(-2), [['close', 'cancel'], ['cancel', 'cancel']]);
  ref.value.open(); await r.flush(); ref.value.close(); assert.deepEqual(events.at(-1), ['close', 'close']);
  ref.value.open(); await r.flush();
  const item = props.actions[0]; onClose = () => { props.actions = []; ref.value.open(); };
  s.select(0); assert.equal(events.at(-1)[1].item, item); onClose = null;
  props.actions = Array.from({ length: 20 }, () => ({ text: 'Long list' })); await r.flush();
  function countScrollViews(n) { return (n.type === 'scroll-view' ? 1 : 0) + n.children.reduce((total, child) => total + countScrollViews(child), 0); }
  assert.equal(countScrollViews(host), 0);
  core.setLanguage('en'); assert.equal(s.cancelLabel, 'Cancel');
  core.updateConfig(r.data({ typographyOffset: 4 })); assert.equal(s.rowHeight, 56);
  core.updateConfig(r.data({ typographyOffset: 12 })); assert.equal(s.rowHeight, 66);
  app.unmount(); assert.equal(ref.value, null);
  console.log('PASS action sheet: popup integration, disabled items, payload snapshot, mask/cancel/program close, reentry, natural menu layout, locale and font scaling');
})().catch(error => { console.error(error); process.exitCode = 1; });
