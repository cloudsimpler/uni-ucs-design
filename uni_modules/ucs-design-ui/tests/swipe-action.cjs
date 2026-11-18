const path = require('node:path');
const assert = require('node:assert/strict');
const { runtime, renderer } = require('./helpers/runtime.cjs');
(async () => {
  const r = runtime(), { vue } = r;
  const Swipe = (await r.importFile(path.resolve(__dirname, '../components/ucs-swipe-action/ucs-swipe-action.vue'))).default;
  const { renderer: rr, node } = renderer(); const props = vue.reactive({ leftWidth: 60, rightWidth: 100 }), ref = vue.ref(), changes = [], clicks = [];
  let mounts = 0; const Child = { setup() { mounts++; return () => vue.h('text', 'preserved'); } };
  const app = rr.createApp({ render: () => vue.h(Swipe, { ...props, ref, onChange: side => changes.push(side), onContentClick: event => clicks.push(event) }, {
    default: () => vue.h(Child), left: () => vue.h('view'), right: () => vue.h('view')
  }) });
  app.mount(node('root')); const s = ref.value.$.setupState;
  const event = (x, y, count = 1) => ({ touches: Array.from({ length: count }, (_, identifier) => ({ clientX: x, clientY: y, identifier })), prevented: 0, stopped: 0,
    preventDefault() { this.prevented++; }, stopPropagation() { this.stopped++; } });
  const end = () => event(0, 0, 0);
  r.context.wallTime = 1000; require('node:vm').runInContext('Date.now = () => wallTime', r.context);
  const start = e => { r.context.wallTime += 250; s.onTouchStart(e); };
  assert.equal(s.offset, 0); assert.equal(s.side, null); assert.equal(s.contentStyle.transitionDuration, '200ms');
  start(event(200, 100)); let move = event(120, 102); s.onTouchMove(move);
  assert.equal(move.prevented, 1); assert.equal(s.offset, -80); assert.equal(s.rightStyle.width, '80px'); assert.equal(s.contentStyle.transitionDuration, '0ms');
  s.onTouchEnd(end()); assert.equal(s.side, 'right'); assert.equal(s.offset, -100); assert.deepEqual(changes, ['right']);
  s.onContentTap({}); assert.equal(clicks.length, 0); // generated tap after a drag is ignored
  start(event(200, 100)); s.onTouchEnd(end()); s.onContentTap({}); assert.equal(s.side, null); assert.equal(clicks.length, 0);
  start(event(200, 100)); s.onTouchEnd(end()); s.onContentTap({}); assert.equal(clicks.length, 1);
  start(event(200, 100)); move = event(150, 200); s.onTouchMove(move); assert.equal(move.prevented, 0); assert.equal(s.offset, 0);
  move = event(50, 202); s.onTouchMove(move); assert.equal(move.prevented, 0); s.onTouchEnd(end()); assert.equal(s.side, null);
  start(event(200, 100)); move = event(195, 100); s.onTouchMove(move); assert.equal(s.dragging, false); s.onTouchEnd(end());
  start(event(200, 100)); s.onTouchMove(event(170, 100)); s.onTouchEnd(end()); assert.equal(s.side, null); assert.equal(s.offset, 0);
  start(event(200, 100)); s.onTouchMove(event(300, 100)); assert.equal(s.offset, 60); s.onTouchEnd(end()); assert.equal(s.side, 'left');
  start(event(200, 100)); s.onTouchMove(event(150, 100)); s.onTouchCancel(); assert.equal(s.offset, 60); assert.equal(s.side, 'left');
  start(event(200, 100)); s.onTouchMove(event(150, 100)); s.onTouchMove(event(100, 100, 2)); assert.equal(s.offset, 60); assert.equal(s.dragging, false);
  assert.equal(ref.value.close(), true); assert.equal(ref.value.close(), false);
  assert.equal(ref.value.open('right'), true); assert.equal(ref.value.open('right'), true); assert.equal(ref.value.open('unknown'), false);
  props.rightWidth = 120; await r.flush(); assert.equal(s.offset, -120);
  props.disabled = true; await r.flush(); assert.equal(s.side, null); assert.equal(s.offset, 0); assert.equal(ref.value.open(), false);
  start(event(200, 100)); move = event(100, 100); s.onTouchMove(move); assert.equal(move.prevented, 0);
  props.disabled = false; props.leftWidth = 0; props.rightWidth = 0; await r.flush();
  assert.equal(ref.value.open('left'), false); start(event(200, 100)); move = event(100, 100); s.onTouchMove(move); assert.equal(move.prevented, 0); s.onTouchEnd(end());
  props.rightWidth = NaN; props.leftWidth = -1; props.duration = -1; await r.flush(); assert.equal(s.rightSize, 80); assert.equal(s.leftSize, 0);
  props.duration = 0; props.threshold = NaN; await r.flush(); assert.equal(s.contentStyle.transitionDuration, '0ms');
  start(event(200, 100)); s.onTouchMove(event(150, 100)); s.onTouchEnd(end()); assert.equal(s.side, 'right');
  // Ref commands supersede an in-flight gesture; late touchend cannot undo them.
  start(event(200, 100)); s.onTouchMove(event(260, 100)); ref.value.close(); s.onTouchEnd(end()); assert.equal(s.side, null);
  // Interrupt a CSS snap at its rendered position, not at its -100px target.
  props.duration = 200; props.leftWidth = 60; props.rightWidth = 100; await r.flush();
  r.context.wallTime += 250;
  s.rootRef.getBoundingClientRect = () => ({ left: 100 });
  s.contentRef.getBoundingClientRect = () => ({ left: 60 });
  ref.value.open('right'); r.context.wallTime += 60;
  s.onTouchStart(event(200, 100)); assert.equal(s.offset, -40); assert.equal(s.contentStyle.transitionDuration, '0ms');
  s.onTouchMove(event(180, 100)); assert.equal(s.offset, -60);
  s.onTouchEnd(end()); assert.equal(s.side, 'right'); assert.equal(s.offset, -100);
  // Native async measurements may finish after touchend; apply the final delta once.
  ref.value.close(); r.context.wallTime += 250; ref.value.open('right'); r.context.wallTime += 60;
  let resolveLayout;
  s.rootRef.getBoundingClientRectAsync = () => Promise.resolve({ left: 100 });
  s.contentRef.getBoundingClientRectAsync = () => new Promise(resolve => { resolveLayout = resolve; });
  s.onTouchStart(event(200, 100)); s.onTouchMove(event(180, 100)); s.onTouchEnd(end());
  resolveLayout({ left: 60 }); await r.flush(); assert.equal(s.offset, -100); assert.equal(s.side, 'right');
  // A newer command invalidates the pending layout and its late touchend.
  ref.value.close(); r.context.wallTime += 250; ref.value.open('right'); r.context.wallTime += 60;
  s.onTouchStart(event(200, 100)); s.onTouchMove(event(180, 100)); ref.value.close();
  resolveLayout({ left: -999 }); await r.flush(); s.onTouchEnd(end()); assert.equal(s.offset, 0); assert.equal(s.side, null);
  // Layout unavailable: the CSS ease-out time fallback must also avoid the target jump.
  delete s.rootRef.getBoundingClientRectAsync; delete s.contentRef.getBoundingClientRectAsync;
  s.rootRef.getBoundingClientRect = () => { throw Error('layout unavailable'); };
  r.context.wallTime += 250; ref.value.open('right'); r.context.wallTime += 60;
  s.onTouchStart(event(200, 100)); const intermediate = s.offset; assert(intermediate < 0 && intermediate > -100);
  s.onTouchMove(event(190, 100)); assert.equal(s.offset, intermediate - 10); s.onTouchCancel();
  await r.flush(); assert.equal(mounts, 1); assert.equal(r.timers.size, 0);
  const exposed = ref.value; app.unmount(); assert.equal(exposed.open(), false); assert.equal(exposed.close(), false);
  console.log('PASS swipe-action: horizontal/vertical lock, thresholds, tap suppression, cancel/multitouch, ref commands, disabled/width updates, persistent slot and cleanup');
})().catch(error => { console.error(error); process.exitCode = 1; });
