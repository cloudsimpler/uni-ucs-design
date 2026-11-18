const path = require('node:path');
const assert = require('node:assert/strict');
const { runtime, renderer } = require('./helpers/runtime.cjs');

(async () => {
  const r = runtime(), { vue } = r;
  const Dialog = (await r.importFile(path.resolve(__dirname, '../components/ucs-dialog/ucs-dialog.vue'))).default;
  const Popup = (await r.importFile(path.resolve(__dirname, '../components/ucs-popup/ucs-popup.vue'))).default;
  const core = await r.importFile(path.resolve(__dirname, '../index.js'));
  const props = vue.reactive({ title: 'Confirm', message: 'Continue?', beforeClose: null, closeOnClickMask: false });
  const dialog = vue.ref(), events = [];
  let reentry;
  const { renderer: hostRenderer, node } = renderer();
  const app = hostRenderer.createApp({ render: () => vue.h(Dialog, {
    ...props, ref: dialog,
    onOpen: () => { events.push(['open']); reentry?.('open'); },
    onClose: reason => { events.push(['close', reason]); reentry?.('close'); },
    onConfirm: () => events.push(['confirm']), onCancel: () => events.push(['cancel']),
    onError: event => events.push(['error', event])
  }, { default: scope => vue.h('view', { pending: scope.pending }, 'Custom content') }) });
  app.component('ucs-popup', Popup);
  for (const name of ['ucs-text', 'ucs-spinner', 'ucs-safe-area']) {
    app.component(name, { render: () => vue.h('view') });
  }
  const host = node('root');
  app.mount(host);
  function nativeButtons(n = host) { return [...(n.type === 'button' ? [n] : []), ...n.children.flatMap(child => nativeButtons(child))]; }
  const api = dialog.value, s = api.$.setupState;
  assert(!Object.hasOwn(Dialog.props, 'show'));
  assert.equal(typeof api.open, 'function'); assert.equal(typeof api.close, 'function');
  assert.equal(s.confirmLabel, '确认'); assert.equal(s.cancelLabel, '取消');
  core.setLanguage('en'); assert.equal(s.confirmLabel, 'Confirm'); assert.equal(s.cancelLabel, 'Cancel');
  props.confirmText = ' Save '; await r.flush(); assert.equal(s.confirmLabel, 'Save');
  props.confirmText = ' '; await r.flush(); assert.equal(s.confirmLabel, 'Confirm');

  assert.equal(api.open(), true); api.open(); await r.flush();
  assert.equal(events.filter(([name]) => name === 'open').length, 1);
  const popupState = () => s.popupRef.$.setupState;
  assert.equal(s.popupRef.$.props.closeOnClickMask, false);
  assert.equal(s.popupRef.$.props.placement, 'center');
  assert.equal(nativeButtons().length, 2);
  assert.deepEqual(Array.from(s.actions, action => action.name), ['cancel', 'confirm']);
  props.vertical = true; await r.flush();
  assert.deepEqual(Array.from(s.actions, action => action.name), ['confirm', 'cancel']);
  assert.equal(s.actionStyle(1).borderTopWidth, '0.5px');
  assert.equal(s.actionStyle(1).borderLeftWidth, '0px');
  props.vertical = false; props.confirmType = 'danger'; await r.flush();
  assert.equal(s.confirmColor, core.getThemeColor('danger-6'));
  assert.equal(s.actionStyle(1).borderLeftWidth, '0.5px');
  assert.equal(s.actionStyle(0).minHeight, '56px');
  props.title = ''; await r.flush(); assert.equal(s.bodyColor, core.getThemeColor(['gray-12', 'gray-10']));
  props.title = 'Confirm'; props.confirmType = 'primary'; await r.flush();
  assert.equal(s.bodyColor, core.getThemeColor(['gray-7', 'gray-8']));
  s.onClickMask(); assert.equal(s.opened, true);
  assert.equal(await s.requestAction('confirm'), true);
  assert.equal(s.opened, false);
  assert.deepEqual(events.slice(-2), [['close', 'confirm'], ['confirm']]);
  assert.equal(api.close(), false);
  assert.equal(await s.requestAction('confirm'), false);
  await r.flush(); r.advance(240); await r.flush();

  api.open(); await r.flush();
  assert.equal(await s.requestAction('cancel'), true);
  assert.deepEqual(events.slice(-2), [['close', 'cancel'], ['cancel']]);
  await r.flush(); r.advance(240); await r.flush();

  props.showCancel = false; await r.flush(); api.open(); await r.flush();
  assert.equal(nativeButtons().length, 1);
  api.close(); await r.flush(); r.advance(240); await r.flush();
  props.showCancel = true;

  let calls = 0, resolveGuard;
  props.beforeClose = action => { calls++; assert.equal(action, 'confirm'); return new Promise(resolve => { resolveGuard = resolve; }); };
  await r.flush(); api.open(); await r.flush();
  const pending = s.requestAction('confirm');
  await r.flush(); assert.equal(s.pending, true); assert.equal(s.pendingAction, 'confirm');
  assert(nativeButtons().every(button => button.props.disabled === true));
  assert.equal(await s.requestAction('confirm'), false); assert.equal(await s.requestAction('cancel'), false);
  s.onClickMask(); assert.equal(calls, 1);
  resolveGuard(false); assert.equal(await pending, false); await r.flush();
  assert.equal(s.opened, true); assert.equal(s.pending, false);
  props.beforeClose = () => true; await r.flush();
  assert.equal(await s.requestAction('confirm'), true);
  await r.flush(); r.advance(240); await r.flush();

  const failure = new Error('Save failed');
  props.beforeClose = async () => { throw failure; }; await r.flush(); api.open(); await r.flush();
  assert.equal(await s.requestAction('confirm'), false);
  assert.equal(s.opened, true); assert.equal(s.pending, false);
  assert.equal(events.at(-1)[0], 'error'); assert.equal(events.at(-1)[1].error, failure);
  props.beforeClose = () => undefined; await r.flush();
  assert.equal(await s.requestAction('confirm'), true); // retry succeeds
  await r.flush(); r.advance(240); await r.flush();

  props.closeOnClickMask = true;
  props.beforeClose = action => { assert.equal(action, 'cancel'); return false; };
  await r.flush(); api.open(); await r.flush(); r.advance(240); await r.flush();
  popupState().onBackdrop({}); await r.flush(); assert.equal(s.opened, true);
  props.beforeClose = null; await r.flush();
  popupState().onBackdrop({}); await r.flush(); assert.equal(s.opened, false);
  assert.deepEqual(events.slice(-2), [['close', 'cancel'], ['cancel']]);
  r.advance(240); await r.flush();

  // An old asynchronous callback cannot close or emit errors into a reopened dialog.
  let rejectOld;
  props.beforeClose = () => new Promise((resolve, reject) => { rejectOld = reject; });
  await r.flush(); api.open(); await r.flush();
  const old = s.requestAction('confirm');
  assert.equal(api.close(), true); assert.equal(s.pending, false);
  assert.equal(events.at(-1)[1], 'close');
  api.open(); await r.flush();
  const count = events.length;
  rejectOld(new Error('Old error')); assert.equal(await old, false);
  assert.equal(events.length, count); assert.equal(s.opened, true);
  props.beforeClose = null; await r.flush(); api.close(); await r.flush(); r.advance(240); await r.flush();

  // Reentrant lifecycle callbacks must not overwrite the next open state.
  reentry = event => { if (event === 'open') api.close(); };
  api.open(); assert.equal(s.opened, false); reentry = null;
  await r.flush(); r.advance(240); await r.flush();
  api.open(); await r.flush();
  reentry = event => { if (event === 'close') api.open(); };
  api.close(); await r.flush(); assert.equal(s.opened, true); reentry = null;

  let finishAfterUnmount;
  props.beforeClose = () => new Promise(resolve => { finishAfterUnmount = resolve; }); await r.flush();
  const late = s.requestAction('confirm');
  app.unmount(); const before = events.length;
  finishAfterUnmount(true); assert.equal(await late, false);
  r.advance(1000); await r.flush();
  assert.equal(events.length, before); assert.equal(r.timers.size, 0);
  assert.equal(api.open(), false); assert.equal(api.close(), false);
  console.log('PASS dialog: real popup integration and text actions, translated labels, confirm/cancel, async veto/error/retry, duplicate guards, mask cancellation, close/reopen races and unmount cleanup');
})().catch(error => { console.error(error); process.exitCode = 1; });
