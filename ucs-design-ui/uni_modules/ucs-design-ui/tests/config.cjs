const fs = require('fs')
const path = require('path')
const vm = require('vm')
const assert = require('assert/strict')
// Optional argument points to the host's Vue package; no fake reactivity in tests.
const vue = require(process.argv[2] || 'vue')
const cache = new Map()
const vueModule = new vm.SyntheticModule(Object.keys(vue), function () {
  for (const key of Object.keys(vue)) this.setExport(key, vue[key])
})
function load(file) {
  if (!cache.has(file)) cache.set(file, new vm.SourceTextModule(fs.readFileSync(file, 'utf8'), { identifier: file }))
  return cache.get(file)
}
;(async () => {
  const entry = load(path.resolve(__dirname, '../index.js'))
  await entry.link((specifier, parent) => {
    if (specifier === 'vue') return vueModule
    assert(specifier.startsWith('./') || specifier.startsWith('../'))
    return load(path.resolve(path.dirname(parent.identifier), specifier))
  })
  await entry.evaluate()
  const api = entry.namespace
  // Check theme integration against the bundled generator, without an npm dependency.
  const bundledGenerate = cache.get(path.resolve(__dirname, '../plugin/arco-design-color/generate.js')).namespace.default
  const { createConfigStore } = cache.get(path.resolve(__dirname, '../core/store.js')).namespace
  let count = 0
  async function test(name, run) { await run(); console.log('PASS ' + name); count++ }
  await test('color CSS variables share a readonly reactive palette mapping without unrelated invalidation', () => {
    const store = createConfigStore(), css = store.useThemeColorCssVars()
    assert.equal(css, store.useThemeColorCssVars())
    assert.equal(typeof api.useThemeColorCssVars, 'function')
    function check() {
      const palette = store.useThemeColors().value
      assert.equal(Object.keys(css.value).length, 67)
      assert(Object.isFrozen(css.value))
      for (const [key, color] of Object.entries(palette)) assert.equal(css.value[`--ucs-${key}`], color)
      for (const name of ['primary', 'secondary', 'success', 'warning', 'danger']) {
        assert.equal(css.value[`--ucs-${name}`], css.value[`--ucs-${name}-6`])
      }
      assert.equal(Object.hasOwn(css.value, '--ucs-gray'), false)
    }
    check()
    const original = css.value
    store.updateConfig({ typographyOffset: 4, language: 'en' })
    assert.equal(css.value, original)
    store.setThemeColor('primary', '#123456'); check(); assert.notEqual(css.value, original)
    const light = css.value
    store.setThemeMode('dark'); check(); assert.notEqual(css.value, light)
    const other = createConfigStore()
    assert.notEqual(other.useThemeColorCssVars().value, css.value)
  })
  await test('application defaults and fresh built-in language packs', () => {
    assert.equal('createConfigStore' in api, false)
    assert.equal('validateConfig' in api, false)
    const config = api.getConfig()
    assert.equal(Object.keys(config).length, 10)
    assert.equal(config.themeMode, 'light')
    assert.equal(config.typographyOffset, 0)
    assert.equal(config.language, 'zh-Hans')
    assert.equal(config.fallbackLanguage, 'zh-Hans')
    assert.equal(config.themeColors.primary, '#604CFC')
    assert.equal(config.themeColors.secondary, null)
    assert.equal(config.designLanguagePacks.en.common.confirm, 'Confirm')
    assert.equal(Object.keys(config.i18nLanguagePacks).length, 0)
  })
  await test('real Vue computed/watch update once with atomic valid configuration', () => {
    const store = createConfigStore()
    const view = store.useConfig()
    assert.equal(view, store.useConfig())
    const derived = vue.computed(() => view.value.themeMode + ':' + view.value.themeColors.primary)
    const changes = []
    const stop = vue.watch(derived, value => changes.push(value), { flush: 'sync' })
    store.updateConfig({ themeMode: 'dark', themeColors: { primary: ' #1890ff ' } })
    assert.equal(derived.value, 'dark:#1890FF')
    assert.deepEqual(changes, ['dark:#1890FF'])
    stop()
  })
  await test('optional secondary color can be set, preserved, cleared and reactively fall back', () => {
    const store = createConfigStore()
    const view = store.useConfig()
    const color = vue.computed(() => view.value.themeColors.secondary ?? view.value.themeColors.primary)
    assert.equal(color.value, '#604CFC')
    store.updateConfig({ themeColors: { secondary: ' #14b8a6 ' } })
    assert.equal(color.value, '#14B8A6')
    store.updateConfig({ themeColors: { primary: '#1890FF' } })
    assert.equal(color.value, '#14B8A6')
    const previous = view.value
    for (const value of ['', '#fff', undefined, 42]) {
      assert.throws(() => store.updateConfig({ themeMode: 'dark', themeColors: { secondary: value } }), TypeError)
      assert.equal(view.value, previous)
    }
    assert.throws(() => store.updateConfig({ themeColors: { primary: null } }), TypeError)
    assert.deepEqual(store.validateConfig({ themeColors: { secondary: null } }), [])
    store.updateConfig({ themeColors: { secondary: null } })
    assert.equal(view.value.themeColors.secondary, null)
    assert.equal(color.value, '#1890FF')
    store.initializeConfig({ themeColors: { secondary: '#14B8A6' } })
    assert.equal(color.value, '#14B8A6')
    store.resetConfig()
    assert.equal(view.value.themeColors.secondary, null)
    assert.equal(color.value, '#604CFC')
  })
  await test('input/snapshot/frozen view cannot silently mutate live state', () => {
    const input = { icons: { add: '\ue001' }, iconFontFamily: ' Icons ', i18nLanguagePacks: { en: { home: { title: 'Hello' } } } }
    const store = createConfigStore(input)
    input.icons.add = 'changed'
    input.i18nLanguagePacks.en.home.title = 'changed'
    const snapshot = store.getConfig()
    snapshot.themeColors.primary = '#000000'
    assert.equal(store.getConfig().icons.add, '\ue001')
    assert.equal(store.getConfig().i18nLanguagePacks.en.home.title, 'Hello')
    assert.equal(store.getConfig().iconFontFamily, 'Icons')
    assert.equal(Reflect.set(store.useConfig().value.themeColors, 'primary', '#000000'), false)
    assert.equal(store.getConfig().themeColors.primary, '#604CFC')
  })
  await test('invalid patches reject entirely, diagnostics do not publish', () => {
    const store = createConfigStore()
    const original = store.useConfig().value
    const issues = store.validateConfig({ themeMode: 'dark', typographyOffset: NaN, unknown: true })
    assert.equal(issues.filter(issue => issue.severity === 'error').length, 2)
    assert.throws(() => store.updateConfig({ themeMode: 'dark', typographyOffset: NaN }), TypeError)
    assert.equal(store.useConfig().value, original)
    for (const patch of [null, [], { themeMode: 'auto' }, { themeColors: { custom: '#123456' } }, { themeColors: { primary: '#fff' } }, { iconFontFamily: 2 }, { icons: { add: 1 } }, { typographyOffset: Infinity }]) {
      assert.throws(() => store.updateConfig(patch), TypeError)
    }
  })
  await test('finite offsets are preserved without range limits', () => {
    const store = createConfigStore()
    assert.deepEqual(store.validateConfig({ typographyOffset: 99 }), [])
    assert.equal(store.updateConfig({ typographyOffset: 99 }).typographyOffset, 99)
    assert.equal(store.updateConfig({ typographyOffset: -99 }).typographyOffset, -99)
    assert.equal(store.updateConfig({ typographyOffset: 0.5 }).typographyOffset, 0.5)
  })
  await test('language packs merge, aliases resolve and arrays replace', () => {
    const store = createConfigStore()
    store.updateConfig({ language: 'FR_fr', fallbackLanguage: 'EN_us', i18nLanguagePacks: { fr: { home: { title: 'Bonjour', list: ['a', 'b'] } } } })
    assert.equal(store.getConfig().language, 'fr')
    assert.equal(store.getConfig().fallbackLanguage, 'en')
    store.updateConfig({ i18nLanguagePacks: { FR: { home: { list: ['c'], other: 'Oui' } } }, designLanguagePacks: { en: { common: { confirm: 'OK' } } } })
    const config = store.getConfig()
    assert.equal(config.i18nLanguagePacks.fr.home.title, 'Bonjour')
    assert.deepEqual(config.i18nLanguagePacks.fr.home.list, ['c'])
    assert.equal(config.designLanguagePacks.en.common.confirm, 'OK')
    assert.equal(config.designLanguagePacks.en.common.cancel, 'Cancel')
    assert.equal(store.updateConfig({ language: 'zh_TW' }).language, 'zh-Hant')
    assert.equal(store.updateConfig({ language: 'zh-Hans-HK' }).language, 'zh-Hans')
    assert.throws(() => store.updateConfig({ language: 'de' }), TypeError)
    assert.equal(store.validateConfig({ language: 'fr' }, { mode: 'initialize' })[0].severity, 'error')
  })
  await test('icons replace and empty map clears; no automatic font loading', () => {
    const store = createConfigStore({ icons: { add: 'a' }, iconFontFamily: 'Icons' })
    store.updateConfig({ icons: { ' close ': 'b' } })
    assert.deepEqual(store.getConfig().icons, { close: 'b' })
    store.updateConfig({ icons: {} })
    assert.deepEqual(store.getConfig().icons, {})
    assert.equal(store.getConfig().iconFontFamily, 'Icons')
    assert.throws(() => store.updateConfig({ icons: { close: 'a', ' close ': 'b' } }), TypeError)
  })
  await test('unsafe keys, cyclic data and unsupported language values rejected', () => {
    const store = createConfigStore()
    const cyclic = {}; cyclic.self = cyclic
    for (const patch of [JSON.parse('{"__proto__":{"polluted":true}}'), { icons: JSON.parse('{"constructor":"x"}') }, { i18nLanguagePacks: { en: cyclic } }, { i18nLanguagePacks: { en: { bad: () => {} } } }, { i18nLanguagePacks: { en: JSON.parse('{"__proto__":"x"}') } }]) {
      assert.throws(() => store.updateConfig(patch), TypeError)
    }
    assert.equal({}.polluted, undefined)
  })
  await test('initialize resets omitted fields; reset returns independent defaults', () => {
    const store = createConfigStore({ themeMode: 'dark', icons: { add: 'x' } })
    store.initializeConfig({ typographyOffset: 2 })
    assert.equal(store.getConfig().themeMode, 'light')
    assert.deepEqual(store.getConfig().icons, {})
    const snapshot = store.resetConfig()
    snapshot.designLanguagePacks.en.common.confirm = 'changed'
    assert.equal(store.resetConfig().designLanguagePacks.en.common.confirm, 'Confirm')
  })
  await test('separate stores and singleton do not share mutable state', () => {
    const a = createConfigStore()
    const b = createConfigStore()
    a.updateConfig({ themeMode: 'dark' })
    assert.equal(b.getConfig().themeMode, 'light')
    assert.equal(api.getConfig().themeMode, 'light')
    api.updateConfig({ themeMode: 'dark' })
    assert.equal(api.useConfig().value.themeMode, 'dark')
    api.resetConfig()
  })
  await test('theme algorithm matches fixed regression baselines', () => {
    // Frozen current outputs, intentionally independent of runtime expected-value generation.
    // These detect algorithm changes; they do not certify equivalence to an upstream release.
    const fixtures = [
      ['#1890FF', 'light', ['#E8F8FF', '#BEE8FF', '#95D6FF', '#6BC1FF', '#42AAFF', '#1890FF', '#0F6DD2', '#084FA6', '#033479', '#001D4D']],
      ['#1890FF', 'dark', ['#001D4D', '#053579', '#1053A6', '#1E75D2', '#319CFF', '#3EA8FF', '#6AC0FF', '#95D6FF', '#C0E9FF', '#ECF9FF']],
      ['#808080', 'light', ['#FFFFFF', '#E6E6E6', '#CCCCCC', '#B3B3B3', '#999999', '#808080', '#735657', '#663337', '#59161D', '#4D000A']],
      ['#808080', 'dark', ['#4D000A', '#591219', '#66292E', '#734547', '#806666', '#999999', '#B3AFAF', '#CCC4C4', '#E6D8D8', '#FFEBEB']],
    ]
    for (const [primary, themeMode, expected] of fixtures) {
      const store = createConfigStore({ themeMode, themeColors: { primary } })
      assert.deepEqual(Array.from({ length: 10 }, (_, index) => store.getThemeColor('primary-' + (index + 1))), expected)
    }
  })
  await test('public theme APIs integrate bundled scales for every role and mode', () => {
    const store = createConfigStore({ themeColors: { secondary: '#14B8A6' } })
    assert.equal(store.getThemeMode(), 'light')
    for (const mode of ['light', 'dark']) {
      store.setThemeMode(mode)
      assert.equal(store.getThemeMode(), mode)
      const seeds = store.getConfig().themeColors
      for (const name of Object.keys(seeds)) {
        const expected = bundledGenerate(seeds[name], { list: true, dark: mode === 'dark' })
        assert.equal(store.getConfig().themeColors[name], seeds[name])
        assert.equal(store.getThemeColor(name), expected[5])
        assert.equal(store.useThemeColors().value[name], expected[5])
        assert.equal(store.useThemeColorCssVars().value[`--ucs-${name}`], expected[5])
        assert.equal(store.getThemeColor(name), store.getThemeColor(`${name}-6`))
        for (let i = 1; i <= 10; i++) assert.equal(store.getThemeColor(name + '-' + i), expected[i - 1])
        assert.equal(store.getThemeColor(name + '-6'), expected[5])
      }
    }
    for (const key of ['unknown', 'primary-0', 'primary-11', 'primary-1.5', 'primary-06', '__proto__', 'constructor']) assert.equal(store.getThemeColor(key), key)
  })
  await test('derived palette updates atomically, falls back and isolates snapshots/stores', () => {
    const store = createConfigStore()
    const other = createConfigStore()
    const palette = store.useThemeColors()
    const before = palette.value
    assert.equal(Object.keys(before).length, 67)
    assert.equal('gray' in before, false)
    assert.equal(before.primary, before['primary-6'])
    assert.equal(before.secondary, before.primary)
    assert.equal(palette, store.useThemeColors())
    assert.equal(before['secondary-6'], before['primary-6'])
    store.updateConfig({ language: 'en' })
    assert.equal(palette.value, before)
    const recorded = []
    const stop = vue.watch(palette, value => recorded.push(value), { flush: 'sync' })
    store.updateThemeColors({ primary: '#1890FF', danger: '#FF0000' })
    assert.equal(recorded.length, 1)
    assert.equal(palette.value['primary-6'], '#1890FF')
    assert.equal(palette.value['danger-6'], '#FF0000')
    assert.equal(palette.value['secondary-6'], palette.value['primary-6'])
    assert.equal(palette.value['success-6'], before['success-6'])
    store.setThemeColor('secondary', '#14B8A6')
    const secondary = palette.value['secondary-6']
    store.setThemeColor('primary', '#604CFC')
    assert.equal(palette.value['secondary-6'], secondary)
    store.setThemeColor('secondary', null)
    assert.equal(palette.value['secondary-6'], palette.value['primary-6'])
    const snapshot = { ...store.useThemeColors().value }
    snapshot['primary-6'] = 'modified'
    assert.equal(store.getThemeColor('primary-6'), '#604CFC')
    assert.equal(Reflect.set(palette.value, 'primary-6', 'modified'), false)
    assert.equal(other.getThemeColor('danger-6'), '#D9514C')
    const prior = palette.value
    assert.throws(() => store.updateThemeColors({ primary: '#000000', secondary: '#bad' }), TypeError)
    assert.equal(palette.value, prior)
    stop()
    api.setThemeColor('primary', '#1890FF')
    assert.equal(api.useThemeColors().value['primary-6'], '#1890FF')
    api.setThemeMode('dark')
    assert.equal(api.getThemeMode(), 'dark')
    assert.equal(api.getThemeColor('primary-6'), bundledGenerate('#1890FF', { dark: true }))
    api.resetConfig()
  })
  await test('language APIs react to locale, fallback and translation patches', () => {
    const store = createConfigStore({ i18nLanguagePacks: {
      'zh-Hans': { greeting: '你好，{name}', onlyChinese: '回退文案' },
      en: { greeting: 'Hello, {name}', empty: '' }
    } })
    const greeting = vue.computed(() => store.getI18nText('greeting', { params: { name: 'UCS' } }))
    assert.equal(greeting.value, '你好，UCS')
    assert.equal(store.getUcsDesignText('common.confirm'), '确认')
    store.setLanguage('en-US')
    assert.equal(store.getLanguage(), 'en')
    assert.equal(greeting.value, 'Hello, UCS')
    assert.equal(store.getUcsDesignText('common.confirm'), 'Confirm')
    assert.equal(store.getI18nText('onlyChinese'), '回退文案')
    assert.equal(store.getI18nText('empty', { fallbackValue: 'ignored' }), '')
    store.setFallbackLanguage('en')
    assert.equal(store.getFallbackLanguage(), 'en')
    assert.equal(store.getI18nText('onlyChinese'), 'onlyChinese')
    assert.equal(store.getI18nText('missing', { fallbackValue: 'Default {count}', params: { count: 0 } }), 'Default 0')
    store.updateConfig({ i18nLanguagePacks: { en: { greeting: 'Hi, {name}' } } })
    assert.equal(greeting.value, 'Hi, UCS')
    assert.throws(() => store.setLanguage('unknown'), TypeError)
    assert.equal(store.getLanguage(), 'en')
  })
  await test('regional lookups, safe interpolation and independent namespaces', () => {
    const store = createConfigStore({ language: 'en-US', i18nLanguagePacks: {
      'en-US': { exact: 'US', args: '{count}:{enabled}:{empty}:{missing}', rows: ['First'] },
      en: { base: 'English', 'common': { confirm: 'App confirm' } }
    } })
    assert.equal(store.getI18nText('exact'), 'US')
    assert.equal(store.getI18nText('base'), 'English')
    assert.equal(store.getI18nText('args', { params: { count: 0, enabled: false, empty: null } }), '0:false::{missing}')
    assert.equal(store.getI18nText('rows.0'), 'First')
    assert.equal(store.getI18nText('common.confirm'), 'App confirm')
    assert.equal(store.getUcsDesignText('common.confirm'), 'Confirm')
    assert.equal(store.getI18nText('__proto__.toString'), '__proto__.toString')
    assert.equal(Object.keys(store.getConfig().designLanguagePacks.en).sort().join(','), 'common,datetime,empty,loadMore,page')
    const emptyTypes = ['data', 'content', 'notice', 'permission', 'review', 'network', 'offline', 'link', 'image', 'maintenance', 'upload', 'download']
    for (const pack of Object.values(store.getConfig().designLanguagePacks)) {
      assert.deepEqual(Object.keys(pack.empty).sort(), [...emptyTypes].sort())
      for (const type of emptyTypes) assert.equal(typeof pack.empty[type], 'string')
    }
    assert.equal(store.getUcsDesignText('page.refreshing'), 'Updating')
    assert.equal(store.getUcsDesignText('page.refreshComplete'), 'Up to date')
    assert.equal(api.getLanguage(), 'zh-Hans')
    api.setLanguage('zh-TW')
    assert.equal(api.getUcsDesignText('common.confirm'), '確認')
    api.setFallbackLanguage('en')
    assert.equal(api.getFallbackLanguage(), 'en')
    api.resetConfig()
  })
  await test('12-step gray palette switches with mode and stays independent of brand seeds', () => {
    const store = createConfigStore()
    const theme = store.useThemeColors()
    const endpoints = vue.computed(() => [theme.value['gray-1'], theme.value['gray-12']])
    assert.deepEqual(endpoints.value, ['#ffffff', '#141414'])
    assert.equal(Object.keys(theme.value).filter(key => key.startsWith('gray-')).length, 12)
    assert.equal(store.getThemeColor('gray-6'), '#a9aeb8')
    assert.equal(store.getThemeColor('gray-11'), '#1d2129')
    const light = theme.value['gray-6']
    store.setThemeColor('primary', '#1890FF')
    assert.equal(theme.value['gray-6'], light)
    store.setThemeMode('dark')
    assert.deepEqual(endpoints.value, ['#141414', '#ffffff'])
    assert.equal(store.getThemeColor('gray-11'), '#f6f6f6')
    assert.equal(Object.keys(theme.value).filter(key => key.startsWith('gray-')).length, 12)
    assert.equal(Reflect.set(theme.value, 'gray-12', '#000000'), false)
    const snapshot = { ...store.useThemeColors().value }
    snapshot['gray-12'] = '#000000'
    assert.equal(store.getThemeColor('gray-12'), '#ffffff')
    assert.equal(store.getThemeColor('gray-13'), 'gray-13')
    assert.equal(store.getThemeColor('primary-11'), 'primary-11')
    assert.throws(() => store.setThemeColor('gray', '#888888'), TypeError)
    store.resetConfig()
    assert.deepEqual(endpoints.value, ['#ffffff', '#141414'])
  })
  await test('font sizes react to offsets, preserve fractions and remain valid', () => {
    const size = vue.computed(() => api.getFontSize(14))
    assert.equal(size.value, 14)
    api.updateConfig({ typographyOffset: 2.5 })
    assert.equal(size.value, 16.5)
    api.updateConfig({ typographyOffset: -99 })
    assert.equal(size.value, 1)
    assert.equal(api.getConfig().typographyOffset, -99)
    for (const value of [0, -1, NaN, Infinity, '14', null, undefined]) assert.throws(() => api.getFontSize(value), TypeError)
    api.updateConfig({ typographyOffset: Number.MAX_VALUE })
    assert.throws(() => api.getFontSize(Number.MAX_VALUE), RangeError)
    api.resetConfig()
    assert.equal(size.value, 14)
  })
  await test('color lookup selects light/dark keys from active palette and validates both', () => {
    const store = createConfigStore()
    const selected = vue.computed(() => store.getThemeColor('gray-12', 'gray-10'))
    assert.equal(selected.value, '#141414')
    assert.equal(store.getThemeColor('gray-12'), '#141414')
    assert.equal(store.getThemeColor('gray-12', undefined), '#141414')
    for (const invalid of ['', null, 6]) {
      assert.throws(() => store.getThemeColor('gray-12', invalid), TypeError)
    }
    store.setThemeMode('dark')
    assert.equal(selected.value, '#dfdfdf')
    assert.equal(store.getThemeColor('gray-12'), '#ffffff')
    assert.equal(store.getThemeColor('gray-12', undefined), '#ffffff')
    assert.equal(store.getThemeColor('unknown', 'gray-10'), '#dfdfdf')
    store.setThemeColor('primary', '#1890FF')
    assert.equal(store.getThemeColor('success-6', 'primary-7'), bundledGenerate('#1890FF', { dark: true, index: 7 }))
    store.setThemeMode('light')
    assert.equal(selected.value, '#141414')
  })
  await test('color resolver accepts strings, light/dark tuples and external colors without prefix heuristics', () => {
    const store = createConfigStore()
    for (const value of ['#1890FF', 'rgba(0, 0, 0, 0.5)', 'transparent', 'red', 'var(--text-color)', 'primary-99']) {
      assert.equal(store.getThemeColor(value), value)
      assert.equal(store.getThemeColor([value]), value)
    }
    const pair = Object.freeze(['primary-6', '#FFFFFF'])
    const color = vue.computed(() => store.getThemeColor(pair))
    assert.equal(color.value, '#604CFC')
    store.setThemeColor('primary', '#1890FF')
    assert.equal(color.value, '#1890FF')
    assert.equal(store.getThemeColor([' gray-12 ', ' #ABCDEF ']), '#141414')
    store.setThemeMode('dark')
    assert.equal(color.value, '#FFFFFF')
    assert.equal(store.getThemeColor([' gray-12 ', ' #ABCDEF ']), '#ABCDEF')
    assert.equal(store.getThemeColor('#111111', 'gray-10'), '#dfdfdf')
    for (const pair of [['primary-6'], ['primary-6', null], ['primary-6', undefined]]) {
      assert.equal(store.getThemeColor(pair), store.getThemeColor('primary-6'))
    }
    for (const input of ['', '  ', null, undefined, 0, {}, [], ['gray-1', '#000', '#fff'], [null, '#fff'], ['gray-1', ''], ['gray-1', 1]]) {
      assert.throws(() => store.getThemeColor(input), TypeError)
    }
    assert.throws(() => store.getThemeColor(['gray-1'], '#fff'), TypeError)
    assert.throws(() => store.getThemeColor('', '#fff'), TypeError)
    assert.deepEqual(pair, ['primary-6', '#FFFFFF'])
  })
  await test('image dimensions scale with text and preserve aspect ratio', () => {
    const fixed = vue.computed(() => api.getIconSize(24))
    const dimensions = vue.computed(() => [api.getIconSize(24, 14), api.getIconSize(16, 14)])
    assert.deepEqual(dimensions.value, [24, 16])
    api.updateConfig({ typographyOffset: 2 })
    assert.equal(fixed.value, 24)
    assert.equal(api.getIconSize(24, undefined), 24)
    assert.equal(dimensions.value[0], 24 * (16 / 14))
    assert(Math.abs(dimensions.value[0] / dimensions.value[1] - 1.5) < 1e-12)
    assert.equal(api.getIconSize(24), 24)
    api.updateConfig({ typographyOffset: -99 })
    assert.equal(dimensions.value[0], 24 * (1 / 14))
    assert(Math.abs(dimensions.value[0] / dimensions.value[1] - 1.5) < 1e-12)
    for (const value of [0, -1, NaN, Infinity, '14', null, undefined]) {
      assert.throws(() => api.getIconSize(value, 14), TypeError)
      if (value !== undefined) assert.throws(() => api.getIconSize(24, value), TypeError)
    }
    assert.throws(() => api.getIconSize(24, false), TypeError)
    api.updateConfig({ typographyOffset: Number.MAX_VALUE })
    assert.throws(() => api.getIconSize(Number.MAX_VALUE, 1), RangeError)
    api.resetConfig()
    assert.deepEqual(dimensions.value, [24, 16])
  })
  await test('icon names resolve built-ins and safe custom overrides reactively', () => {
    const store = createConfigStore()
    const icon = vue.computed(() => store.getIconDefinition('home'))
    assert.deepEqual(icon.value, { fontFamily: 'UcsDesignIcons', glyph: '\ue75f' })
    assert.equal(Object.keys(cache.get(path.resolve(__dirname, '../core/icon-glyphs.js')).namespace.UCS_ICON_GLYPHS).length, 316)
    store.updateConfig({ iconFontFamily: 'ProjectIcons', icons: { home: '★', custom: '✓' } })
    assert.deepEqual(icon.value, { fontFamily: 'ProjectIcons', glyph: '★' })
    assert.deepEqual(store.getIconDefinition(' custom '), { fontFamily: 'ProjectIcons', glyph: '✓' })
    assert.deepEqual(store.getIconDefinition('settings-outline'), { fontFamily: 'UcsDesignIcons', glyph: '\ue6be' })
    icon.value.glyph = 'mutated result'
    assert.equal(store.getIconDefinition('home').glyph, '★')
    store.updateConfig({ iconFontFamily: '' })
    assert.equal(icon.value.glyph, '\ue75f')
    assert.equal(store.getIconDefinition('custom').glyph, '')
    store.updateConfig({ iconFontFamily: 'ProjectIcons', icons: {} })
    assert.equal(icon.value.glyph, '\ue75f')
    for (const name of ['missing-icon', '__proto__', 'constructor', '', null, undefined]) assert.equal(store.getIconDefinition(name).glyph, '')
    api.updateConfig({ iconFontFamily: 'sans-serif', icons: { star: '★' } })
    assert.deepEqual(api.getIconDefinition('star'), { fontFamily: 'sans-serif', glyph: '★' })
    api.resetConfig()
    assert.equal(api.getIconDefinition('star').glyph, '\ue7d0')
  })
  await test('request environment selection follows platform versions, explicit overrides and build fallback', () => {
    const { resolveRequestEnvironment: resolve } = cache.get(path.resolve(__dirname, '../core/request-config.js')).namespace
    for (const platform of ['mp-weixin', 'mp-alipay', 'mp-qq', 'mp-kuaishou', 'mp-xhs']) {
      for (const [version, expected] of [['develop', 'development'], ['trial', 'development'], ['release', 'production']]) {
        assert.equal(resolve('auto', { platform, buildEnvironment: expected === 'production' ? 'development' : 'production', runtime: { getAccountInfoSync: () => ({ miniProgram: { envVersion: version } }) } }), expected)
      }
    }
    assert.equal(resolve('auto', { platform: 'mp-alipay', runtime: { getAccountInfoSync: () => ({ miniProgram: { envVersion: 'gray' } }) } }), 'production')
    for (const [version, expected] of [['development', 'development'], ['preview', 'development'], ['production', 'production']]) {
      assert.equal(resolve('auto', { platform: 'mp-toutiao', runtime: { getEnvInfoSync: () => ({ microapp: { envType: version } }) } }), expected)
    }
    let nativeCalls = 0
    const runtime = { getAccountInfoSync() { nativeCalls++; return { miniProgram: { envVersion: 'develop' } } } }
    assert.equal(resolve('auto', { platform: 'mp-jd', buildEnvironment: 'production', runtime }), 'production')
    assert.equal(nativeCalls, 0)
    assert.equal(resolve('auto', { platform: 'web', buildEnvironment: 'development', runtime }), 'development')
    assert.equal(nativeCalls, 0)
    assert.equal(resolve('production', { get platform() { throw Error('must not inspect native context') } }), 'production')
    assert.equal(resolve('development', { platform: 'mp-weixin', runtime }), 'development')
    assert.equal(nativeCalls, 0)
    for (const runtime of [null, {}, { getAccountInfoSync() { throw Error('native error') } }, { getAccountInfoSync: () => ({ miniProgram: {} }) }]) {
      assert.equal(resolve('auto', { platform: 'mp-weixin', buildEnvironment: 'production', runtime }), 'production')
    }
    assert.equal(resolve('auto', { platform: 'mp-toutiao', buildEnvironment: 'production', runtime: { getEnvInfoSync: () => ({ microapp: { envType: 'unknown' } }) } }), 'production')
    assert.throws(() => resolve('auto', { platform: 'mp-jd' }), TypeError)
    assert.throws(() => resolve('invalid', {}), TypeError)
  })
  await test('request snapshots resolve addresses and isolate headers with atomic validation', () => {
    const store = createConfigStore()
    assert.throws(() => store.getRequestConfig(), TypeError)
    store.updateConfig({ request: { env: 'development', developmentBaseURL: ' https://dev.example.com/ ', productionBaseURL: 'https://prod.example.com/', headers: { 'X-App': 'demo' } } })
    const snapshot = store.getRequestConfig()
    assert.deepEqual(snapshot, { baseURL: 'https://dev.example.com/', timeout: 15000, headers: { 'x-app': 'demo' } })
    snapshot.headers['x-app'] = 'changed'
    assert.equal(store.getRequestConfig().headers['x-app'], 'demo')
    assert.equal('env' in snapshot, false)
    store.updateConfig({ request: { env: 'production', timeout: 30000 } })
    assert.equal(store.getRequestConfig().baseURL, 'https://prod.example.com/')
    assert.equal(store.getRequestConfig().timeout, 30000)
    assert.equal(snapshot.baseURL, 'https://dev.example.com/')
    const before = store.useConfig().value
    for (const request of [null, { env: 'test' }, { timeout: 0 }, { timeout: Infinity }, { baseURL: 'unsupported' }, { headers: { bad: {} } }, { headers: { 'bad name': 'value' } }, { developmentBaseURL: 123 }]) {
      assert.throws(() => store.updateConfig({ themeMode: 'dark', request }), TypeError)
      assert.equal(store.useConfig().value, before)
    }
    store.updateConfig({ request: { headers: {} } })
    assert.deepEqual(store.getRequestConfig().headers, {})
    store.resetConfig()
    assert.equal(store.getConfig().request.env, 'auto')
    assert.throws(() => store.getRequestConfig(), TypeError)
  })
  await test('application http captures latest defaults, allows per-call overrides and creates independent snapshots', async () => {
    const { create } = cache.get(path.resolve(__dirname, '../plugin/ucs-request/index.js')).namespace
    const calls = []
    const transport = { request(options) {
      calls.push(options)
      queueMicrotask(() => { options.success({ statusCode: 200, data: '{}' }); options.complete() })
      return { abort() {} }
    } }
    api.initializeConfig({ request: { env: 'development', developmentBaseURL: 'https://old.example.com', productionBaseURL: 'https://prod.example.com', headers: { 'X-App': 'global' } } })
    api.http.defaults.transport = transport
    api.http.defaults.headers = { 'x-default': 'instance' }
    const independent = create({ ...api.getRequestConfig(), transport })
    const derived = api.http.create()
    const first = api.http.get('/first')
    api.updateConfig({ request: { developmentBaseURL: 'https://new.example.com', headers: { 'X-App': 'updated' } } })
    await first
    assert.equal(calls[0].url, 'https://old.example.com/first')
    assert.equal(calls[0].header['x-app'], 'global')
    await api.http.get('/second', { timeout: 8000, headers: { 'X-App': 'single' } })
    assert.equal(calls[1].url, 'https://new.example.com/second')
    assert.equal(calls[1].timeout, 8000)
    assert.equal(calls[1].header['x-app'], 'single')
    await independent.get('/independent')
    await derived.get('/derived')
    assert.equal(calls[2].url, 'https://old.example.com/independent')
    assert.equal(calls[3].url, 'https://old.example.com/derived')
    await api.http.get('/override', { baseURL: 'https://single.example.com', headers: { 'x-app': null, 'x-default': null } })
    assert.equal(calls[4].url, 'https://single.example.com/override')
    assert.equal(calls[4].header['x-app'], undefined)
    assert.equal(calls[4].header['x-default'], undefined)
    api.resetConfig()
    await assert.rejects(api.http.get('/unconfigured'), error => error.code === 'ERR_BAD_CONFIG')
    delete api.http.defaults.transport
    delete api.http.defaults.headers
  })
  await test('application config failures pass through response rejection and recovery handlers', async () => {
    api.initializeConfig({ request: { env: 'development' } })
    let requests = 0
    const seen = []
    api.http.interceptors.request.use(config => { requests++; return config })
    const first = api.http.interceptors.response.use(undefined, error => { seen.push(error); throw error })
    const second = api.http.interceptors.response.use(undefined, error => ({ recovered: error.code }))
    try {
      assert.deepEqual(await api.http.get('/unconfigured'), { recovered: 'ERR_BAD_CONFIG' })
      assert.equal(seen.length, 1)
      assert.equal(seen[0].config.url, '/unconfigured')
      assert(seen[0].cause instanceof TypeError)
      assert.equal(requests, 0)
      api.http.interceptors.response.eject(second)
      await assert.rejects(api.http.get('/unconfigured'), error => error.code === 'ERR_BAD_CONFIG')
      assert.equal(seen.length, 2)
    } finally {
      api.http.interceptors.response.eject(first)
      api.http.interceptors.response.eject(second)
      api.http.interceptors.request.clear()
      api.resetConfig()
    }
  })
  await test('allowed configuration warnings are observable without rejecting writes', () => {
    const messages = []
    const previousWarn = console.warn
    console.warn = message => messages.push(message)
    try {
      const config = api.updateConfig({ icons: { custom: 'X' } })
      assert.equal(config.icons.custom, 'X')
      assert.equal(messages.length, 1)
      assert.match(messages[0], /iconFontFamily/)
      assert.throws(() => api.updateConfig({ themeMode: 'invalid' }), TypeError)
      assert.equal(messages.length, 1)
    } finally {
      console.warn = previousWarn
      api.resetConfig()
    }
  })
  await test('immutable branches are shared, no-op updates stay stable and snapshots remain independent', () => {
    const store = createConfigStore({ i18nLanguagePacks: { en: { home: { title: 'Original', note: 'Keep' }, other: { title: 'Stable' } } } })
    const before = store.useConfig().value
    let fontRuns = 0, colorRuns = 0, iconRuns = 0, textRuns = 0
    const font = vue.computed(() => { fontRuns++; return { size: store.getFontSize(14) } })
    const color = vue.computed(() => { colorRuns++; return { color: store.getThemeColor('primary-6') } })
    const icon = vue.computed(() => { iconRuns++; return store.getIconDefinition('home') })
    const text = vue.computed(() => { textRuns++; return { value: store.getI18nText('home.title') } })
    for (const item of [font, color, icon, text]) void item.value
    store.updateConfig({ request: { timeout: 19000 } })
    const after = store.useConfig().value
    assert.notEqual(before, after)
    for (const field of ['themeColors', 'icons', 'designLanguagePacks', 'i18nLanguagePacks']) assert.equal(before[field], after[field])
    for (const item of [font, color, icon, text]) void item.value
    assert.deepEqual([fontRuns, colorRuns, iconRuns, textRuns], [1, 1, 1, 1])
    const snapshot = store.updateConfig({ request: { timeout: 19000, headers: {} }, themeColors: { primary: '#604cfc' }, icons: {}, i18nLanguagePacks: {} })
    assert.equal(store.useConfig().value, after)
    snapshot.i18nLanguagePacks.en.home.title = 'Mutated snapshot'
    assert.equal(store.useConfig().value.i18nLanguagePacks.en.home.title, 'Original')
    const patch = { i18nLanguagePacks: { en: { home: { title: 'Updated' } } } }
    store.updateConfig(patch)
    patch.i18nLanguagePacks.en.home.title = 'Mutated caller'
    const updated = store.useConfig().value
    assert.equal(updated.i18nLanguagePacks.en.other, after.i18nLanguagePacks.en.other)
    assert.equal(updated.i18nLanguagePacks.en.home.note, 'Keep')
    assert.equal(updated.i18nLanguagePacks.en.home.title, 'Updated')
    assert.equal(Object.isFrozen(updated.i18nLanguagePacks.en.home), true)
    assert.equal(after.i18nLanguagePacks.en.home.title, 'Original')
    assert.equal(store.getI18nText('home.title', { fallbackValue: 'missing' }), 'missing')
    store.setLanguage('en')
    assert.equal(store.getI18nText('home.title'), 'Updated')
    store.updateConfig({ i18nLanguagePacks: { en: { home: { title: 'Fresh' } } } })
    assert.equal(store.getI18nText('home.title'), 'Fresh')
  })
  console.log('\n' + count + ' configuration test groups passed with Vue ' + vue.version)
})().catch(error => { console.error(error); process.exitCode = 1 })
