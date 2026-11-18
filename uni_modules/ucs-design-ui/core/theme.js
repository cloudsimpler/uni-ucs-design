import { computed } from 'vue'
import generate from '../plugin/arco-design-color/generate.js'
import { freezeValue } from '../utils/object.js'
import { createLightGrayPalette, createDarkGrayPalette } from './gray.js'

const names = ['primary', 'secondary', 'success', 'warning', 'danger']

/** Derive only the active mode. Cache scales by seed and mode within this store. */
export function createThemeAccessors(config) {
  const modeView = computed(() => config.value.themeMode)
  const seedsView = computed(() => config.value.themeColors)
  const scales = new Map()
  let previousMode
  let previousSeeds = {}
  let previousColors
  const palettes = computed(() => {
    const mode = modeView.value
    const currentSeeds = seedsView.value
    const seeds = { ...currentSeeds, secondary: currentSeeds.secondary ?? currentSeeds.primary }
    if (previousColors && previousMode === mode && names.every(name => previousSeeds[name] === seeds[name])) return previousColors
    const result = {}
    const generated = new Map()
    for (const name of names) {
      const seed = seeds[name]
      if (!generated.has(seed)) {
        const key = mode + ':' + seed
        let scale = scales.get(key)
        if (!scale) {
          scale = {}
          generate(seed, { list: true, dark: mode === 'dark' }).forEach((color, index) => { scale[index + 1] = color })
          freezeValue(scale)
        }
        scales.delete(key)
        scales.set(key, scale)
        if (scales.size > 32) scales.delete(scales.keys().next().value)
        generated.set(seed, scale)
      }
      result[name] = generated.get(seed)
    }
    if (previousColors && previousMode === mode) result.gray = previousColors.gray
    else {
      const gray = {}
      const values = mode === 'dark' ? createDarkGrayPalette() : createLightGrayPalette()
      values.forEach((color, index) => { gray[index + 1] = color })
      result.gray = freezeValue(gray)
    }
    previousMode = mode
    previousSeeds = seeds
    previousColors = freezeValue(result)
    return previousColors
  })
  let previousPalettes
  let previousMap
  const colors = computed(() => {
    const current = palettes.value
    if (current === previousPalettes) return previousMap
    const result = {}
    for (const name of [...names, 'gray']) {
      // 无编号键是当前模式第 6 阶的快捷名称，不暴露配置种子色。
      if (name !== 'gray') result[name] = current[name][6]
      const max = name === 'gray' ? 12 : 10
      for (let shade = 1; shade <= max; shade++) result[name + '-' + shade] = current[name][shade]
    }
    previousPalettes = current
    previousMap = freezeValue(result)
    return previousMap
  })
  // 同一 store 的页面共享映射；只依赖色表，不依赖字号、语言或页面状态。
  const cssVars = computed(() => freezeValue(Object.fromEntries(
    Object.entries(colors.value).map(([key, color]) => [`--ucs-${key}`, color])
  )))
  return {
    useThemeColors: () => colors,
    /** 获取当前主题的只读颜色 CSS 变量，名称与色阶键一一对应。 */
    useThemeColorCssVars: () => cssVars,
    /**
     * Resolve a color string, a [light, dark?] tuple, or separate light/dark strings.
     * Missing/null tuple dark values reuse light. Unknown keys pass through as CSS colors.
     * Both branches must be non-empty strings; CSS validity belongs to the target platform.
     * @param {string|string[]} lightColor Color value or light/dark tuple.
     * @param {string} [darkColor] Optional dark color for the separate-string overload.
     * @returns {string} Resolved palette color or external CSS color.
     */
    getThemeColor: (lightColor, darkColor) => {
      if (Array.isArray(lightColor)) {
        if (lightColor.length < 1 || lightColor.length > 2 || darkColor !== undefined) {
          throw new TypeError('颜色数组必须包含一到两项，且不能同时传入暗色参数')
        }
        darkColor = lightColor[1] ?? lightColor[0]
        lightColor = lightColor[0]
      } else if (darkColor === undefined) darkColor = lightColor
      const normalize = color => {
        if (typeof color !== 'string' || !color.trim()) throw new TypeError('颜色必须是非空字符串')
        return color.trim()
      }
      const light = normalize(lightColor)
      const dark = normalize(darkColor)
      const selected = modeView.value === 'dark' ? dark : light
      const map = colors.value
      return Object.prototype.hasOwnProperty.call(map, selected) ? map[selected] : selected
    }
  }
}
