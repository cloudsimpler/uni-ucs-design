import { computed, unref } from 'vue'
import { getFontSize, getThemeColor } from '../core/config.js'

/**
 * 为原生 input、textarea 提供响应式主题和排版样式，不管理输入值、事件、焦点或尺寸。
 * @param {object|import('vue').Ref<object>|function():object} [options={}] 普通或响应式配置，也可传入 ref 或返回配置的 getter。
 * @param {number} [options.size=14] 基础字号 px，随全局字号偏移更新；无效或非正数回退 14。
 * @param {number} [options.lineHeight=0] 基础行高 px，按实际字号同比缩放；无效或非正数使用基础字号的 1.5 倍。
 * @param {string|string[]} [options.color=['gray-12','gray-10']] 输入文字颜色，支持内部色阶、外部颜色及明暗数组。
 * @param {string|string[]} [options.placeholderColor=['gray-7','gray-7']] 占位颜色，支持主题色及明暗数组。
 * @returns {{inputStyle:import('vue').ComputedRef<object>,placeholderStyle:import('vue').ComputedRef<string>}} 可直接绑定原生 style、placeholder-style；模板自动解包。
 * @example
 * const { inputStyle, placeholderStyle } = useInputStyle()
 * // <input v-model="name" :style="inputStyle" :placeholder-style="placeholderStyle" />
 * // 动态配置：useInputStyle(() => ({ size: props.size }))
 */
export function useInputStyle(options = {}) {
  const config = computed(() => (typeof options === 'function' ? options() : unref(options)) ?? {})
  const baseSize = computed(() => Number.isFinite(config.value.size) && config.value.size > 0 ? config.value.size : 14)
  const fontSize = computed(() => getFontSize(baseSize.value))
  const inputStyle = computed(() => {
    const line = config.value.lineHeight
    return {
      fontSize: `${fontSize.value}px`,
      lineHeight: `${(Number.isFinite(line) && line > 0 ? line / baseSize.value : 1.5) * fontSize.value}px`,
      color: getThemeColor(config.value.color ?? ['gray-12', 'gray-10'])
    }
  })
  const placeholderStyle = computed(() => `color:${getThemeColor(config.value.placeholderColor ?? ['gray-7', 'gray-7'])};font-size:${fontSize.value}px;`)
  return { inputStyle, placeholderStyle }
}
