const path = require('node:path');
const assert = require('node:assert/strict');
const { runtime, renderer } = require('./helpers/runtime.cjs');
(async () => {
  const r = runtime(), { vue } = r;
  const Collapse = (await r.importFile(path.resolve(__dirname, '../components/ucs-collapse/ucs-collapse.vue'))).default;
  const { renderer: rr, node } = renderer();
  let mounts = 0, removals = 0, reentry;
  const Child = { setup() { mounts++; vue.onBeforeUnmount(() => removals++); return () => vue.h('input'); } };
  function mount(props = {}) {
    const ref = vue.ref(), events = [];
    const app = rr.createApp({ render: () => vue.h(Collapse, { ...props, ref,
      onChange: value => { events.push(['change', value]); reentry?.(ref.value, value); },
      onAfterChange: value => events.push(['after', value])
    }, { default: scope => vue.h('view', { expanded: scope.expanded, animating: scope.animating }, [vue.h(Child)]) }) });
    app.mount(node('root')); const api = ref.value, s = api.$.setupState;
    let content = 120, visual = null;
    s.outerRef.getBoundingClientRect = () => ({ height: visual ?? (s.height === 'auto' ? content : parseFloat(s.height)) });
    s.innerRef.getBoundingClientRect = () => ({ height: content });
    return { app, api, s, events, content: value => { content = value; }, visual: value => { visual = value; } };
  }
  const first = mount(); const { api, s, events } = first;
  assert.equal(s.height, '0px'); assert.equal(s.animating, false); assert.equal(events.length, 0);
  assert.equal(api.close(), false); assert.equal(api.open(), true); assert.equal(api.open(), true);
  await r.flush(); assert.equal(s.height, '120px'); assert.equal(s.animating, true);
  r.advance(240); await r.flush(); assert.equal(s.height, 'auto'); assert.equal(s.animating, false);
  assert.deepEqual(events, [['change', true], ['after', true]]);
  first.content(260); assert.equal(s.height, 'auto');
  api.close(); await r.flush(); assert.equal(s.height, '0px'); r.advance(240); await r.flush();
  assert.equal(mounts, 1); assert.equal(removals, 0);
  api.open(); await r.flush(); first.visual(70); api.close(); await r.flush();
  first.visual(40); api.open(); await r.flush(); r.advance(240); await r.flush();
  assert.equal(s.height, 'auto'); assert.equal(events.at(-1)[1], true);
  // Outdated asynchronous native measurements must not restore a reversed transition.
  first.visual(100);
  let resolveOld;
  s.innerRef.getBoundingClientRectAsync = () => new Promise(resolve => { resolveOld = resolve; });
  api.close(); await r.flush();
  delete s.innerRef.getBoundingClientRectAsync;
  api.open(); await r.flush(); r.advance(240); await r.flush();
  resolveOld({ height: 999 }); await r.flush(); assert.equal(s.height, 'auto'); assert.equal(r.timers.size, 0);
  const initial = mount({ defaultOpen: true });
  assert.equal(initial.s.height, 'auto'); assert.equal(initial.events.length, 0);
  const instant = mount({ duration: 0 }); instant.api.open(); assert.equal(instant.s.height, 'auto'); assert.equal(instant.s.animating, false);
  instant.api.toggle(); assert.equal(instant.s.height, '0px');
  const failure = mount(); failure.s.innerRef.getBoundingClientRectAsync = () => Promise.reject(new Error('layout'));
  failure.api.open(); await r.flush(); assert.equal(failure.s.height, 'auto'); assert.equal(failure.s.animating, false);
  const reentrant = mount({ duration: 0 });
  reentry = (target, value) => { if (value) target.close(); };
  reentrant.api.open(); reentry = null; assert.equal(reentrant.s.height, '0px');
  assert.deepEqual(reentrant.events.at(-1), ['after', false]);
  const pending = mount(); pending.api.open(); await r.flush(); assert(r.timers.size > 0);
  pending.app.unmount(); assert.equal(pending.api.open(), false);
  r.advance(1000); assert.equal(pending.events.filter(([event]) => event === 'after').length, 0);
  for (const item of [first, initial, instant, failure, reentrant]) item.app.unmount();
  assert.equal(r.timers.size, 0); assert.equal(mounts, removals);
  console.log('PASS collapse: ref controls, initial/zero-duration, natural dynamic height, preserved children, reversal, stale native queries, fallback, reentry and cleanup');
})().catch(error => { console.error(error); process.exitCode = 1; });
