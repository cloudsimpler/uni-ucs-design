import { shallowRef, computed } from 'vue'
import { createDefaultConfig } from './defaults.js'
import { buildConfig } from './validation.js'
import { cloneValue, freezeValue } from '../utils/object.js'
import { createThemeAccessors } from './theme.js'
import { createLanguageAccessors } from './language.js'
import { resolveIconDefinition } from './icon-font.js'
import { resolveRequestConfig } from './request-config.js'

/** Each application can own a store; do not share the default store across SSR users. */
export function createConfigStore(options = {}) {
  const initial = buildConfig(createDefaultConfig(), options)
  function requireValid(result) {
    if (result.next === null) {
      const error = new TypeError(result.issues.filter(issue => issue.severity === 'error').map(issue => (issue.path || 'config') + ': ' + issue.message).join('; '))
      error.issues = result.issues
      throw error
    }
    for (const issue of result.issues) {
      if (issue.severity === 'warning' && typeof console !== 'undefined' && typeof console.warn === 'function') {
        console.warn('[ucs-design-ui] ' + issue.path + ': ' + issue.message)
      }
    }
    return result.next
  }
  const runtime = shallowRef(freezeValue(requireValid(initial)))
  const view = computed(() => runtime.value)
  const typographyOffset = computed(() => runtime.value.typographyOffset)
  const themeMode = computed(() => runtime.value.themeMode)
  let previousIcons
  const iconConfig = computed(() => {
    const { icons, iconFontFamily } = runtime.value
    if (previousIcons && previousIcons.icons === icons && previousIcons.iconFontFamily === iconFontFamily) return previousIcons
    return (previousIcons = { icons, iconFontFamily })
  })
  const getConfig = () => cloneValue(runtime.value)
  const commit = result => {
    runtime.value = freezeValue(requireValid(result))
    return getConfig()
  }
  const getFontSize = baseSize => {
    if (!Number.isFinite(baseSize) || baseSize <= 0) throw new TypeError('基础字号必须是大于零的有限数字')
    const size = baseSize + typographyOffset.value
    if (!Number.isFinite(size)) throw new RangeError('计算后的字号超出有限数字范围')
    return Math.max(1, size)
  }
  return {
    getRequestConfig: () => resolveRequestConfig(runtime.value.request),
    getIconDefinition: name => resolveIconDefinition(name, iconConfig.value),
    getFontSize,
    getIconSize: (baseSize, baseFontSize) => {
      if (!Number.isFinite(baseSize) || baseSize <= 0) throw new TypeError('图标基础尺寸必须是大于零的有限数字')
      if (baseFontSize === undefined) return baseSize
      if (!Number.isFinite(baseFontSize) || baseFontSize <= 0) throw new TypeError('配套文字基础字号必须是大于零的有限数字')
      const size = baseSize * (getFontSize(baseFontSize) / baseFontSize)
      if (!Number.isFinite(size) || size <= 0) throw new RangeError('计算后的图标尺寸超出有效数字范围')
      return size
    },
    ...createThemeAccessors(view),
    ...createLanguageAccessors(view, patch => commit(buildConfig(runtime.value, patch))),
    getThemeMode: () => themeMode.value,
    setThemeMode: themeMode => commit(buildConfig(runtime.value, { themeMode })),
    setThemeColor: (name, color) => commit(buildConfig(runtime.value, { themeColors: { [name]: color } })),
    updateThemeColors: colors => commit(buildConfig(runtime.value, { themeColors: colors })),
    initializeConfig: (config = {}) => commit(buildConfig(createDefaultConfig(), config)),
    updateConfig: (patch = {}) => commit(buildConfig(runtime.value, patch)),
    resetConfig: () => commit(buildConfig(createDefaultConfig(), {})),
    getConfig,
    useConfig: () => view,
    validateConfig: (patch, settings = {}) => {
      const mode = settings.mode ?? 'update'
      if (!['update', 'initialize'].includes(mode)) throw new TypeError('mode 必须是 update 或 initialize')
      return buildConfig(mode === 'initialize' ? createDefaultConfig() : runtime.value, patch).issues
    }
  }
}
