const path = require('node:path');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { runtime, renderer } = require('./helpers/runtime.cjs');
(async () => {
  const r = runtime(), { vue } = r;
  let encodes = 0;
  r.context.__emptyEncode = () => { encodes++; };
  const originalRead = fs.readFileSync;
  fs.readFileSync = function(file, ...args) {
    const text = originalRead.call(this, file, ...args);
    return String(file).endsWith(path.join('internal', 'svg.js')) ? text.replace('function toBase64(value) {', 'function toBase64(value) { globalThis.__emptyEncode();') : text;
  };
  let Empty;
  try { Empty = (await r.importFile(path.resolve(__dirname, '../components/ucs-empty/ucs-empty.vue'))).default; }
  finally { fs.readFileSync = originalRead; }
  const builder = await r.importFile(path.resolve(__dirname, '../components/ucs-empty/builder.js'));
  const { escapeSvgAttribute } = await r.importFile(path.resolve(__dirname, '../internal/svg.js'));
  assert.equal(escapeSvgAttribute('&<>"\''), '&amp;&lt;&gt;&quot;&apos;');
  for (const type of ['__proto__', 'constructor', 'toString', '', null]) {
    assert.equal(builder.normalizeEmptyType(type), 'data');
    assert.equal(builder.getEmptyIllustrationSize(type), builder.getEmptyIllustrationSize('data'));
  }
  assert(Object.isFrozen(builder.getEmptyIllustrationSize('data')));
  const core = await r.importFile(path.resolve(__dirname, '../index.js'));
  const { getEmptySource } = await r.importFile(path.resolve(__dirname, '../components/ucs-empty/svg.js'));
  const colors = ['red', 'blue', 'gray', 'white', 'black', 'green', 'yellow'];
  const cached = getEmptySource('data', ...colors), encoded = encodes;
  assert.equal(getEmptySource('data', ...colors), cached); assert.equal(encodes, encoded);
  assert.equal(getEmptySource('invalid', ...colors), cached); assert.equal(encodes, encoded);
  for (let i = 0; i < 32; i++) getEmptySource('data', `rgb(${i},0,0)`, ...colors.slice(1));
  const filled = encodes;
  getEmptySource('data', 'rgb(0,0,0)', ...colors.slice(1)); assert.equal(encodes, filled);
  getEmptySource('data', 'rgb(32,0,0)', ...colors.slice(1));
  const inserted = encodes;
  getEmptySource('data', 'rgb(0,0,0)', ...colors.slice(1)); assert.equal(encodes, inserted);
  getEmptySource('data', 'rgb(1,0,0)', ...colors.slice(1)); assert.equal(encodes, inserted + 1);
  const props = vue.reactive({ type: 'data' }), ref = vue.ref();
  const { renderer: hostRenderer, node } = renderer();
  const app = hostRenderer.createApp({ render: () => vue.h(Empty, { ...props, ref }) });
  app.component('ucs-text', { render: () => vue.h('text') });
  const host = node('root'); app.mount(host);
  const s = ref.value.$.setupState;
  assert.equal(s.descriptionValue, '暂无数据'); assert.equal(s.imageStyle.width, '148px');
  assert.equal(s.imageStyle.height, '133px');
  function svg() { return Buffer.from(s.imageSource.split(',')[1], 'base64').toString('utf8'); }
  for (const type of ['data', 'content', 'notice', 'permission', 'review', 'network', 'offline', 'link', 'image', 'maintenance', 'upload', 'download']) {
    props.type = type; await r.flush();
    assert.equal(s.typeValue, type);
    assert(svg().includes('<svg')); assert(svg().includes('</svg>'));
    assert(!s.descriptionValue.startsWith('empty.'));
    assert(svg().includes(`viewBox="0 0 ${builder.getEmptyIllustrationSize(type).width} ${builder.getEmptyIllustrationSize(type).height}"`));
  }
  props.type = 'invalid'; props.imageWidth = -1; await r.flush();
  assert.equal(s.typeValue, 'data'); assert.equal(s.imageStyle.width, '148px');
  props.imageWidth = 296; await r.flush(); assert.equal(s.imageStyle.height, '266px');
  const light = s.imageSource; core.setThemeMode('dark'); await r.flush(); assert.notEqual(s.imageSource, light);
  core.setLanguage('en'); assert.equal(s.descriptionValue, 'No data');
  props.description = 'Custom'; await r.flush(); assert.equal(s.descriptionValue, 'Custom');
  props.description = ' '; await r.flush(); assert.equal(s.descriptionValue, 'No data');
  core.setLanguage('zh-Hant'); assert.equal(s.descriptionValue, '暫無資料');
  const before = s.imageSource; core.updateConfig(r.data({ typographyOffset: 4 }));
  assert.equal(s.imageSource, before); assert.equal(s.imageStyle.width, '296px');
  const escaped = builder.createEmptySvg('data', 'red"&<', 'a', 'b', 'c', 'd', 'e', 'f');
  assert(!escaped.includes('red"&<')); assert(escaped.includes('red&quot;&amp;&lt;'));
  app.unmount();
  const customApp = hostRenderer.createApp({ render: () => vue.h(Empty, {}, { image: () => vue.h('custom-image'), default: () => vue.h('custom-action') }) });
  customApp.component('ucs-text', { render: () => vue.h('text') });
  const customHost = node('root'); customApp.mount(customHost);
  function count(n, type) { return (n.type === type ? 1 : 0) + n.children.reduce((sum, child) => sum + count(child, type), 0); }
  assert.equal(count(customHost, 'image'), 0); assert.equal(count(customHost, 'custom-image'), 1); assert.equal(count(customHost, 'custom-action'), 1);
  customApp.unmount();
  console.log('PASS empty: 12 SVGs and aspect ratios, fallback, theme/locale, custom description, fixed image sizing, XML escaping and slots');
})().catch(error => { console.error(error); process.exitCode = 1; });
