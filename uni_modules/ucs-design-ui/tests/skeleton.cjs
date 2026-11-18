const path = require('node:path');
const assert = require('node:assert/strict');
const { runtime, renderer } = require('./helpers/runtime.cjs');
(async () => {
  const r = runtime(), { vue } = r;
  const Skeleton = (await r.importFile(path.resolve(__dirname, '../components/ucs-skeleton/ucs-skeleton.vue'))).default;
  const core = await r.importFile(path.resolve(__dirname, '../index.js'));
  const props = vue.reactive({}), ref = vue.ref();
  const { renderer: rr, node } = renderer();
  const app = rr.createApp({ render: () => vue.h(Skeleton, { ...props, ref }) });
  const host = node('root'); app.mount(host); const s = ref.value.$.setupState;
  assert.equal(s.skeletonStyle.width, '100%'); assert.equal(s.skeletonStyle.height, '16px'); assert.equal(s.skeletonStyle.borderRadius, '4px');
  assert.equal(host.children[0].props.style.backgroundColor, core.getThemeColor('gray-3'));
  assert.equal(s.skeletonStyle.animationName, 'ucs-skeleton-pulse');
  props.shape = 'circle'; await r.flush(); assert.equal(s.skeletonStyle.width, '40px'); assert.equal(s.skeletonStyle.height, '40px'); assert.equal(s.skeletonStyle.borderRadius, '50%');
  props.width = 48; props.height = 100; await r.flush(); assert.equal(s.skeletonStyle.height, '48px');
  props.animated = false; await r.flush(); assert.equal(host.children[0].props.style.animationName, 'none');
  core.setThemeMode('dark'); await r.flush(); assert.equal(s.skeletonStyle.backgroundColor, core.getThemeColor('gray-4'));
  const before = { ...s.skeletonStyle }; core.updateConfig(r.data({ typographyOffset: 10 })); assert.equal(s.skeletonStyle.width, before.width); assert.equal(s.skeletonStyle.height, before.height);
  props.shape = 'rect'; props.width = '80%'; props.height = '24rpx'; props.radius = '8px'; await r.flush();
  assert.equal(s.skeletonStyle.width, '80%'); assert.equal(s.skeletonStyle.height, '24rpx'); assert.equal(s.skeletonStyle.borderRadius, '8px');
  props.color = ['primary-3', '#123456']; await r.flush(); assert.equal(s.skeletonStyle.backgroundColor, '#123456');
  for (const value of [NaN, Infinity, -1]) {
    props.width = value; props.height = value; props.radius = value; await r.flush();
    assert.equal(s.skeletonStyle.width, '100%'); assert.equal(s.skeletonStyle.height, '16px'); assert.equal(s.skeletonStyle.borderRadius, '4px');
  }
  props.width = 0; props.height = 0; props.radius = 0; props.shape = 'invalid'; await r.flush();
  assert.equal(s.skeletonStyle.width, '0px'); assert.equal(s.skeletonStyle.height, '0px'); assert.equal(s.skeletonStyle.borderRadius, '0px');
  props.animated = true; await r.flush(); assert.equal(s.skeletonStyle.animationName, 'ucs-skeleton-pulse');
  assert.equal(r.timers.size, 0); app.unmount(); assert.equal(r.timers.size, 0);
  console.log('PASS skeleton: native rendered styles, rect/circle sizing, CSS animation toggle, theme/colors, fixed sizing under font offsets and invalid-value fallbacks');
})().catch(error => { console.error(error); process.exitCode = 1; });
