const path = require('node:path');
const assert = require('node:assert/strict');
const { runtime, renderer } = require('./helpers/runtime.cjs');
(async () => {
  const r = runtime(), { vue } = r;
  const Popup = (await r.importFile(path.resolve(__dirname, '../components/ucs-popup/ucs-popup.vue'))).default;
  const core = await r.importFile(path.resolve(__dirname, '../index.js'));
  const props = vue.reactive({ placement: 'bottom', radius: 16, safeAreaInsetBottom: false });
  const popup = vue.ref(), events = [];
  let mounted = 0, unmounted = 0, reentry;
  const Child = { setup() { mounted++; vue.onUnmounted(() => unmounted++); return () => vue.h('view'); } };
  const { renderer: hostRenderer, node } = renderer();
  const app = hostRenderer.createApp({ render: () => vue.h(Popup, {
    ...props, ref: popup, onOpen: () => { events.push('open'); reentry?.('open'); },
    onClose: () => { events.push('close'); reentry?.('close'); }, onClickMask: () => events.push('mask')
  }, { default: () => vue.h(Child) }) });
  app.component('ucs-safe-area', { render: () => vue.h('view') });
  const host = node('root'); app.mount(host);
  const api = popup.value, s = api.$.setupState;
  assert.equal(s.entry, null); assert.equal(mounted, 0);
  const persistentHost = host.children.find(n => n.type === 'view');
  assert(persistentHost); assert.equal(s.hostStyle.pointerEvents, 'none');
  assert.equal(api.open(), true); api.open(); assert.equal(events.filter(e => e === 'open').length, 1);
  assert.equal(s.entry.phase, 'enter'); s.onBackdrop({}); assert(!events.includes('mask'));
  await r.flush(); r.advance(240); await r.flush(); assert.equal(s.entry.phase, 'open');
  const firstRoot = host.children.find(n => n.type === 'view');
  assert.equal(firstRoot.children.find(n => n.type === 'view').props.class, 'ucs-popup__backdrop ucs-popup__backdrop--in');
  assert.equal(firstRoot.children.filter(n => n.type === 'view')[1].props.class, 'ucs-popup__viewport');
  assert.equal(s.surfaceClass, 'ucs-popup__surface--bottom-in');
  assert.equal(s.backdropClass, 'ucs-popup__backdrop--in');
  s.onBackdrop({}); assert.equal(s.entry.phase, 'leave'); assert.equal(s.surfaceClass, 'ucs-popup__surface--bottom-out');
  assert.equal(api.close(), false); await r.flush(); r.advance(240); await r.flush();
  assert.equal(s.entry, null); assert.equal(unmounted, 1);
  assert.equal(host.children.find(n => n.type === 'view'), persistentHost);
  assert.equal(s.hostStyle.pointerEvents, 'none');
  for (const placement of ['top', 'bottom', 'left', 'right', 'center']) {
    props.placement = placement; await r.flush(); api.open(); await r.flush();
    const originalId = s.entry.id;
    assert.equal(s.entry.placement, placement);
    assert.equal(s.surfaceClass, `ucs-popup__surface--${placement}-in`);
    assert.equal(s.surfaceStyle.width, ['top', 'bottom'].includes(placement) ? '100%' : 'auto');
    assert.equal(s.surfaceStyle.height, ['left', 'right'].includes(placement) ? '100%' : 'auto');
    props.placement = 'invalid'; await r.flush(); assert.equal(s.entry.placement, placement);
    const enteringClass = s.surfaceClass;
    r.advance(240); await r.flush();
    assert.equal(s.surfaceClass, enteringClass); // completing entry must not reset/restart the animation
    api.close(); await r.flush(); r.advance(100);
    api.open(); await r.flush(); assert.notEqual(s.entry.id, originalId);
    assert.equal(s.entry.placement, 'bottom'); // newest configuration belongs to a fresh entry
    r.advance(140); assert.equal(s.entry.phase, 'enter'); // old close task cannot remove this entry
    r.advance(100); assert.equal(s.entry.phase, 'open');
    assert.equal(s.surfaceClass, 'ucs-popup__surface--bottom-in'); assert.equal(s.backdropClass, 'ucs-popup__backdrop--in');
    api.close(); await r.flush(); r.advance(240); await r.flush();
    assert.equal(s.entry, null);
  }
  core.setThemeMode('dark'); api.open(); await r.flush(); assert.equal(s.surfaceStyle.backgroundColor, '#262626');
  api.close(); await r.flush(); r.advance(240); await r.flush();
  // Same-tick close cancels an uncommitted entry without mounting its content.
  const mountCount = mounted;
  api.open(); api.close(); await r.flush(); assert.equal(s.entry, null); assert.equal(mounted, mountCount);
  api.open(); api.close(); api.open(); await r.flush(); r.advance(240); assert.equal(s.entry.phase, 'open');
  api.close(); await r.flush(); r.advance(240); await r.flush();
  reentry = event => { if (event === 'open') api.close(); };
  api.open(); await r.flush(); assert.equal(s.entry, null); reentry = null;
  reentry = event => { if (event === 'close') api.open(); };
  api.open(); await r.flush(); r.advance(240); api.close(); await r.flush(); r.advance(240);
  assert.equal(s.entry.phase, 'open'); reentry = null;
  api.close(); await r.flush(); r.advance(240); await r.flush();
  for (let i = 0; i < 20; i++) {
    api.open(); await r.flush(); r.advance(240);
    api.close(); await r.flush(); r.advance(240); await r.flush();
    assert.equal(s.entry, null); assert.equal(mounted, unmounted);
    assert.equal(host.children.find(n => n.type === 'view'), persistentHost);
    assert.equal(s.hostStyle.pointerEvents, 'none');
  }
  api.open(); await r.flush(); app.unmount(); r.advance(1000);
  assert.equal(mounted, unmounted); assert.equal(r.timers.size, 0); assert.equal(api.open(), false);
  console.log('PASS popup: persistent fixed host, fresh keyed content, stable animation classes through entry completion, five placements, latest command wins, reentrant callbacks, 20 destruction cycles and unmount cleanup');
})().catch(error => { console.error(error); process.exitCode = 1; });
