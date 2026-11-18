const path = require('node:path');
const assert = require('node:assert/strict');
const { runtime, renderer } = require('./helpers/runtime.cjs');

(async () => {
  const r = runtime(), { vue } = r;
  const module = await r.importFile(path.resolve(__dirname, '../internal/overlay.js'));
  const manager = module.createOverlayManager(), a = manager.create(), b = manager.create(), feedback = manager.create('toast');
  a.activate(); feedback.activate(); b.activate();
  assert.equal(b.isTop.value, true); assert.equal(a.isTop.value, false);
  assert(b.maskZIndex.value > a.panelZIndex.value); assert(feedback.toastZIndex.value > b.panelZIndex.value);
  assert.equal(a.maskZIndex.value, 999); assert.equal(a.panelZIndex.value, 1000);
  assert.equal(b.maskZIndex.value, 1002); assert.equal(b.panelZIndex.value, 1003);
  assert.equal(feedback.toastZIndex.value, 1004);
  const secondToast = manager.create('toast'); secondToast.activate();
  assert.equal(secondToast.toastZIndex.value, 1005); assert.equal(b.isTop.value, true);
  secondToast.dispose(); assert.equal(secondToast.activate(), false);
  b.release(); assert.equal(a.isTop.value, true);
  assert.equal(feedback.toastZIndex.value, 1004);
  let previous = b.panelZIndex.value;
  for (let i = 0; i < 100; i++) {
    b.activate(); assert(b.maskZIndex.value > previous); previous = b.panelZIndex.value;
    assert(feedback.toastZIndex.value > previous); b.release();
    assert.equal(a.maskZIndex.value, 999);
  }
  assert.throws(() => manager.create('unknown'));
  const scope = vue.effectScope(); let scopedLayer;
  scope.run(() => { scopedLayer = module.useOverlay(); scopedLayer.activate(); });
  scope.stop(); assert.equal(scopedLayer.activate(), false);
  b.activate(); a.activate(); assert.equal(a.isTop.value, true);
  manager.dispose(); a.activate(); assert.equal(a.isTop.value, false);

  const Page = (await r.importFile(path.resolve(__dirname, '../components/ucs-page/ucs-page.vue'))).default;
  const Popup = (await r.importFile(path.resolve(__dirname, '../components/ucs-popup/ucs-popup.vue'))).default;
  const Toast = (await r.importFile(path.resolve(__dirname, '../components/ucs-toast/ucs-toast.vue'))).default;
  const Loading = (await r.importFile(path.resolve(__dirname, '../components/ucs-loading/ucs-loading.vue'))).default;
  const one = vue.ref(), two = vue.ref(), page = vue.ref(), otherPage = vue.ref();
  const { renderer: hostRenderer, node } = renderer();
  const clicks = [];
  let maskAction;
  const showSecond = vue.ref(true);
  const app = hostRenderer.createApp({ render: () => vue.h('view', [
    vue.h(Page, { ref: page }, { overlay: () => [
      vue.h(Popup, { ref: one, safeAreaInsetBottom: false, onClickMask: () => { clicks.push('one'); maskAction?.(); } }),
      showSecond.value ? vue.h(Popup, { ref: two, safeAreaInsetBottom: false, onClickMask: () => clicks.push('two') }) : null
    ] }),
    vue.h(Page, {}, { overlay: () => vue.h(Popup, { ref: otherPage, safeAreaInsetBottom: false }) })
  ]) });
  app.component('ucs-toast', Toast);
  app.component('ucs-loading', Loading);
  for (const name of ['ucs-spinner', 'ucs-icon', 'ucs-safe-area', 'ucs-text']) app.component(name, { render: () => vue.h('view') });
  app.mount(node('root'));
  one.value.open(); await r.flush(); r.advance(370); await r.flush();
  two.value.open(); await r.flush(); r.advance(370); await r.flush();
  const s1 = one.value.$.setupState, s2 = two.value.$.setupState;
  assert(s1.backdropStyle.zIndex >= 999); assert.equal(s1.viewportStyle.zIndex, s1.backdropStyle.zIndex + 1);
  assert.equal(s2.backdropStyle.zIndex, s1.viewportStyle.zIndex + 1); assert.equal(s2.viewportStyle.zIndex, s2.backdropStyle.zIndex + 1);
  assert.equal(s1.hostStyle.pointerEvents, 'none'); assert.equal(s2.hostStyle.pointerEvents, 'auto');
  s1.onBackdrop({}); assert.equal(clicks.length, 0);
  assert.equal(page.value.showToast('提示'), true); await r.flush();
  const toast = page.value.$.setupState.toastRef;
  assert(toast.$.setupState.rootStyle.zIndex > s2.viewportStyle.zIndex);
  assert.equal(toast.$.setupState.items[0].text, '提示');
  assert.equal(page.value.showToast('   '), false);
  page.value.hideToast(); await r.flush(); assert.equal(toast.$.setupState.items.length, 0);
  page.value.showToast({ text: '持续提示', type: 'success', duration: 0 }); await r.flush();
  assert.equal(toast.$.setupState.items[0].icon, 'checkmark-circle');
  assert.equal(s2.hostStyle.pointerEvents, 'auto'); // passive feedback never takes popup interaction ownership
  otherPage.value.open(); await r.flush(); r.advance(370); await r.flush();
  assert.equal(otherPage.value.$.setupState.hostStyle.pointerEvents, 'auto');
  assert.equal(s2.hostStyle.pointerEvents, 'none'); // all containers now share one App stack
  otherPage.value.close(); await r.flush(); r.advance(272); await r.flush();
  assert.equal(s2.hostStyle.pointerEvents, 'auto');
  assert.equal(app._instance.onHide, undefined);
  assert.equal(app._instance.onShow, undefined);
  s2.onBackdrop({}); assert.deepEqual(clicks, ['two']);
  assert.equal(s1.hostStyle.pointerEvents, 'none'); // leaving layer still blocks click-through
  await r.flush(); r.advance(272); await r.flush(); assert.equal(s1.hostStyle.pointerEvents, 'auto');
  two.value.open(); await r.flush(); r.advance(370); await r.flush();
  two.value.close(); two.value.open(); await r.flush(); r.advance(370); await r.flush();
  assert.equal(s2.hostStyle.pointerEvents, 'auto'); assert.equal(s1.hostStyle.pointerEvents, 'none');
  two.value.close(); await r.flush(); r.advance(272); await r.flush();
  maskAction = () => two.value.open();
  s1.onBackdrop({}); await r.flush();
  assert.equal(s1.entry.phase, 'open'); // opening a new top layer in clickMask does not also close this popup
  r.advance(370); await r.flush();
  showSecond.value = false; await r.flush();
  assert.equal(s1.hostStyle.pointerEvents, 'auto'); // unmounting the top popup releases its stack entry
  const stack = module.overlayManager;
  const savedPage = page.value;
  savedPage.showToast('页面卸载前提示'); await r.flush();
  app.unmount(); r.advance(2000); assert.equal(r.timers.size, 0);
  assert.equal(savedPage.showToast('页面已卸载'), false); savedPage.hideToast();
  const after = stack.create(); assert.equal(after.activate(), true); assert.equal(after.isTop.value, true);
  assert(after.maskZIndex.value > s1.backdropStyle.zIndex); after.dispose();
  console.log('PASS overlays: real page providers, popup open order, passive toast priority, top-only mask events, close/reopen races, App-wide monotonic layers, no page lifecycle interception and unmount cleanup');
})().catch(error => { console.error(error); process.exitCode = 1; });
