const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const vue = require('vue');
const { parse, compileScript, compileTemplate, compileStyle } = require('@vue/compiler-sfc');

(async () => {
  const filename = path.resolve(__dirname, '../components/ucs-icon/ucs-icon.vue');
  const { descriptor, errors } = parse(fs.readFileSync(filename, 'utf8'), { filename });
  assert.deepEqual(errors, []);
  const script = compileScript(descriptor, { id: 'ucs-icon-test' });
  assert.deepEqual(compileTemplate({ source: descriptor.template.content, filename, id: 'ucs-icon-test', compilerOptions: { bindingMetadata: script.bindings } }).errors, []);
  assert.deepEqual(compileStyle({ source: descriptor.styles[0].content, filename, id: 'ucs-icon-test' }).errors, []);
  const font = descriptor.styles[0].content.match(/data:font\/ttf;charset=utf-8;base64,([^']+)/);
  assert(font);
  const bytes = Buffer.from(font[1], 'base64');
  assert.equal(bytes.readUInt32BE(0), 0x00010000);
  const cache = new Map();
  const vueModule = new vm.SyntheticModule(Object.keys(vue), function () {
    for (const key of Object.keys(vue)) this.setExport(key, vue[key]);
  });
  function load(file, text) {
    if (!cache.has(file)) cache.set(file, new vm.SourceTextModule(text ?? fs.readFileSync(file, 'utf8'), { identifier: file }));
    return cache.get(file);
  }
  const entry = load(filename, script.content);
  await entry.link((specifier, parent) => specifier === 'vue' ? vueModule : load(path.resolve(path.dirname(parent.identifier), specifier)));
  await entry.evaluate();
  // Confirm that the copied font covers every codepoint in core's built-in map.
  let cmapOffset;
  for (let index = 0; index < bytes.readUInt16BE(4); index++) {
    const record = 12 + index * 16;
    if (bytes.toString('ascii', record, record + 4) === 'cmap') cmapOffset = bytes.readUInt32BE(record + 8);
  }
  assert.notEqual(cmapOffset, undefined);
  const ranges = [];
  for (let index = 0; index < bytes.readUInt16BE(cmapOffset + 2); index++) {
    const table = cmapOffset + bytes.readUInt32BE(cmapOffset + 4 + index * 8 + 4);
    if (bytes.readUInt16BE(table) !== 12) continue;
    for (let group = 0; group < bytes.readUInt32BE(table + 12); group++) {
      const record = table + 16 + group * 12;
      ranges.push([bytes.readUInt32BE(record), bytes.readUInt32BE(record + 4), bytes.readUInt32BE(record + 8)]);
    }
  }
  assert(ranges.length > 0);
  const glyphs = cache.get(path.resolve(__dirname, '../core/icon-glyphs.js')).namespace.UCS_ICON_GLYPHS;
  for (const [name, glyph] of Object.entries(glyphs)) {
    const codepoint = glyph.codePointAt(0);
    assert(ranges.some(([start, end, glyphId]) => codepoint >= start && codepoint <= end && glyphId + codepoint - start > 0), `Missing font glyph: ${name}`);
  }
  const component = entry.namespace.default;
  const props = vue.reactive(Object.fromEntries(Object.entries(component.props).map(([name, definition]) => [name, typeof definition.default === 'function' ? definition.default() : definition.default])));
  const events = [];
  const state = component.setup(props, { expose() {}, emit: (...event) => events.push(event) });
  const core = cache.get(path.resolve(__dirname, '../core/config.js')).namespace;
  assert.equal(component.options.virtualHost, true);
  assert.equal(props.scaleWithFont, true);
  assert.equal(state.fontSize.value, 24);
  assert.equal(state.imageSize.value, 24);
  assert.equal(state.isImageIcon.value, false);
  assert.equal(state.icon.value.glyph, '');
  props.name = ' home ';
  assert.equal(state.iconName.value, 'home');
  assert.equal(state.icon.value.fontFamily, 'UcsDesignIcons');
  assert(state.icon.value.glyph.length > 0);
  assert.equal(state.fontIconStyle.value.lineHeight, '24px');
  core.updateConfig({ typographyOffset: 2 });
  assert.equal(state.fontSize.value, 26);
  assert.equal(state.imageSize.value, 24);
  assert.equal(state.fontIconStyle.value.lineHeight, '26px');
  props.baseFontSize = 14;
  const scaled = 24 * (16 / 14);
  assert.equal(state.imageSize.value, scaled);
  assert.equal(state.fontIconStyle.value.fontSize, '26px');
  assert.equal(state.fontIconStyle.value.width, '26px');
  props.scaleWithFont = false;
  assert.equal(state.fontIconStyle.value.fontSize, '24px');
  assert.equal(state.fontIconStyle.value.lineHeight, '24px');
  assert.equal(state.fontIconStyle.value.width, '24px');
  assert.equal(state.fontIconStyle.value.height, '24px');
  props.name = '/static/logo.png';
  assert.equal(state.imageStyle.value.width, '24px');
  core.updateConfig({ typographyOffset: 10 });
  assert.equal(state.fontSize.value, 24);
  assert.equal(state.imageSize.value, 24);
  props.size = 20;
  assert.equal(state.fontSize.value, 20);
  assert.equal(state.imageSize.value, 20);
  props.size = 0;
  assert.equal(state.fontSize.value, 24);
  props.name = 'home';
  props.size = 24;
  core.updateConfig({ typographyOffset: 2 });
  props.scaleWithFont = true;
  assert.equal(state.fontSize.value, 26);
  assert.equal(state.imageSize.value, scaled);
  props.color = ['primary-6', '#FFFFFF'];
  assert.equal(state.fontIconStyle.value.color, '#604CFC');
  core.setThemeColor('primary', '#1890FF');
  assert.equal(state.fontIconStyle.value.color, '#1890FF');
  core.setThemeMode('dark');
  assert.equal(state.fontIconStyle.value.color, '#FFFFFF');
  core.updateConfig({ iconFontFamily: 'ProjectIcons', icons: { home: 'X' } });
  assert.deepEqual(state.icon.value, { fontFamily: 'ProjectIcons', glyph: 'X' });
  core.updateConfig({ icons: {} });
  assert.equal(state.icon.value.fontFamily, 'UcsDesignIcons');
  for (const name of ['/static/icon', './icon', '../icon', 'https://example.com/icon?id=1', '//example.com/icon', 'data:image/png;base64,aA==', 'blob:local', 'logo.PNG?v=1#x', 'wxfile://tmp/image']) {
    props.name = name;
    assert.equal(state.isImageIcon.value, true, name);
    assert.equal(state.imageStyle.value.width, `${scaled}px`);
    assert.equal(Object.hasOwn(state.imageStyle.value, 'color'), false);
  }
  props.name = 'unknown-icon';
  assert.equal(state.isImageIcon.value, false);
  assert.equal(state.icon.value.glyph, '');
  props.name = null;
  assert.equal(state.iconName.value, '');
  props.baseFontSize = undefined;
  props.size = NaN;
  assert.equal(state.fontSize.value, 26);
  assert.equal(state.imageSize.value, 24);
  props.size = 16;
  assert.equal(state.fontSize.value, 18);
  assert.equal(state.imageSize.value, 16);
  for (const invalid of [0, -1, NaN, null]) {
    props.baseFontSize = invalid;
    assert.throws(() => state.imageSize.value, TypeError);
    assert.equal(state.fontIconStyle.value.fontSize, '18px');
  }
  props.baseFontSize = 14;
  core.updateConfig({ typographyOffset: -99 });
  assert.equal(state.fontSize.value, 1);
  assert.equal(state.fontIconStyle.value.height, '1px');
  assert.equal(state.imageSize.value, 16 / 14);
  const tap = {};
  state.onTap(tap);
  state.onLongPress(tap);
  assert.deepEqual(events, [['tap', tap], ['click', tap], ['longpress', tap]]);
  console.log('PASS icon SFC/style compilation, embedded TTF, font/image resolution, fixed/proportional sizing, live theme/mappings and events');
})().catch(error => { console.error(error); process.exitCode = 1; });
