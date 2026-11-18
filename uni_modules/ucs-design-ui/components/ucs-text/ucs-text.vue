<template>
	<text :style="textStyle" :selectable="props.selectable" :user-select="props.selectable"
		:max-lines="resolvedMaxLines" @tap="onTap" @longpress="onLongPress">
		<slot>{{ props.text }}</slot>
	</text>
</template>

<script setup>
	import { computed } from 'vue'
	import { getFontSize, getThemeColor } from '../../core/config.js'

	defineOptions({ options: { virtualHost: true } })

	/**
	 * ucs-text 基础文本组件。
	 *
	 * @description 基于原生 text 渲染文本，响应 core 的字号偏移和主题变化。
	 * size、lineHeight 为偏移前的 px 数值，行高按实际字号与基础字号的比例缩放。
	 * class、style 和其他未声明的原生属性透传至根 text；外部 style 可覆盖计算样式。
	 * 省略显示需要父布局提供有效宽度约束，实际选择文本与截断效果取决于目标平台。
	 * @property {string|number} [text=''] 无默认插槽时显示的文本，支持数字 0。
	 * @property {number} [size=14] 基础字号，单位 px；非有限值或非正数回退为 14。
	 * @property {string|string[]} [color=['gray-12','gray-10']] 色阶键、CSS 颜色或 [亮色, 暗色]，由 core 统一解析。
	 * @property {string} [align=''] text-align 样式值，未设置时继承。
	 * @property {string} [decoration=''] text-decoration-line 样式值，例如 underline、line-through。
	 * @property {number} [letterSpacing=0] 字符间距，单位 px；允许负数，不随字号偏移缩放。
	 * @property {number} [lineHeight=0] 基础行高，单位 px；无效值使用基础字号的 1.5 倍。
	 * @property {number} [maxLines=0] 最大行数，正数向下取整；结果小于 1 时不限行，传给原生 text 时使用 -1。
	 * @property {string|number} [weight=''] font-weight 样式值，空值或数字 0 不设置字重。
	 * @property {boolean} [wrap=true] 是否允许自动换行；false 强制单行省略，优先于 maxLines。
	 * @property {string|number} [width=''] 数字按 px 处理，允许 0；字符串作为 CSS 长度。
	 * @property {string} [fontFamily=''] 自定义字体族；字体文件由宿主加载。
	 * @property {string} [fontStyle=''] font-style 样式值，例如 normal、italic。
	 * @property {boolean} [selectable=false] 是否允许选择文本，透传 selectable 和 user-select。
	 * @slot default 自定义行内文本，优先于 text。
	 * @event {object} tap 轻触时触发，参数为原生事件对象。
	 * @event {object} click 与 tap 同次触发，顺序为 tap → click；同一动作通常只订阅其中一个。
	 * @event {object} longpress 长按时触发，参数为原生事件对象。
	 * @example
	 * <ucs-text :size="16" :line-height="24" :color="['gray-12', 'gray-10']">标题</ucs-text>
	 * <ucs-text text="最多显示两行" :max-lines="2" width="100%" />
	 */
	const props = defineProps({
		text: { type: [String, Number], default: '' },
		size: { type: Number, default: 14 },
		color: { type: [String, Array], default: () => ['gray-12', 'gray-10'] },
		align: { type: String, default: '' },
		decoration: { type: String, default: '' },
		letterSpacing: { type: Number, default: 0 },
		lineHeight: { type: Number, default: 0 },
		maxLines: { type: Number, default: 0 },
		weight: { type: [Number, String], default: '' },
		wrap: { type: Boolean, default: true },
		width: { type: [String, Number], default: '' },
		fontFamily: { type: String, default: '' },
		fontStyle: { type: String, default: '' },
		selectable: { type: Boolean, default: false }
	})
	/** 轻触按 tap、click 顺序触发，长按触发 longpress；均传递原始事件对象。 */
	const emit = defineEmits(['tap', 'click', 'longpress'])
	/**
	 * @param {unknown} value 待检查的值。
	 * @returns {boolean} 是否为有限正数。
	 */
	const positive = value => Number.isFinite(value) && value > 0
	/**
	 * @param {unknown} value 待检查的值。
	 * @returns {boolean} 是否为去除两端空白后非空的字符串。
	 */
	const hasText = value => typeof value === 'string' && value.trim().length > 0
	/** @type {import('vue').ComputedRef<number>} 原生截断行数；-1 表示不限行，wrap=false 时为 1。 */
	const resolvedMaxLines = computed(() => {
		if (!props.wrap) return 1
		const maxLines = positive(props.maxLines) ? Math.floor(props.maxLines) : 0
		return maxLines > 0 ? maxLines : -1
	})

	/** 根据组件参数、全局字号偏移和当前主题计算样式；截断样式按目标平台条件编译。 */
	const textStyle = computed(() => {
		const baseSize = positive(props.size) ? props.size : 14
		const fontSize = getFontSize(baseSize)
		const baseLineHeight = positive(props.lineHeight) ? props.lineHeight : baseSize * 1.5
		// 行高按文字相同比例缩放，不重复叠加字号偏移。
		const scaledLineHeight = (baseLineHeight / baseSize) * fontSize
		const styles = {
			color: getThemeColor(props.color),
			fontSize: `${fontSize}px`,
			lineHeight: `${positive(scaledLineHeight) ? scaledLineHeight : fontSize}px`
		}
		if (hasText(props.align)) styles.textAlign = props.align
		if (hasText(props.decoration)) styles.textDecorationLine = props.decoration
		if (Number.isFinite(props.letterSpacing)) styles.letterSpacing = `${props.letterSpacing}px`
		if (hasText(props.fontFamily)) styles.fontFamily = props.fontFamily
		if (hasText(props.fontStyle)) styles.fontStyle = props.fontStyle
		if ((typeof props.weight === 'number' && positive(props.weight)) ||
			(typeof props.weight === 'string' && props.weight.trim() && props.weight.trim() !== '0')) {
			styles.fontWeight = props.weight
		}
		const width = typeof props.width === 'number'
			? (Number.isFinite(props.width) && props.width >= 0 ? `${props.width}px` : '')
			: (hasText(props.width) ? props.width.trim() : '')
		if (width) {
			styles.width = width
			// #ifndef UNI-APP-X
			styles.display = 'inline-block'
			// #endif
		}
		const maxLines = resolvedMaxLines.value
		if (maxLines > 0) {
			styles.overflow = 'hidden'
			styles.textOverflow = 'ellipsis'
			if (maxLines === 1) {
				styles.whiteSpace = 'nowrap'
				// #ifndef UNI-APP-X
				styles.display = 'inline-block'
				// #endif
			} else {
				// #ifdef UNI-APP-X && APP && !VUE3-VAPOR
				styles.lines = maxLines
				// #endif
				// #ifdef !UNI-APP-X || !APP
				styles.display = '-webkit-box'
				styles.WebkitBoxOrient = 'vertical'
				styles.WebkitLineClamp = maxLines
				// #endif
			}
		}
		return styles
	})

	/**
	 * 将原生轻触事件依次转发为组件 tap 和 click 事件。
	 * @param {object} event 原生事件对象，保留平台提供的全部字段。
	 * @returns {void}
	 */
	function onTap(event) {
		emit('tap', event)
		emit('click', event)
	}
	/**
	 * 转发原生长按事件。
	 * @param {object} event 原生事件对象，保留平台提供的全部字段。
	 * @returns {void}
	 */
	function onLongPress(event) {
		emit('longpress', event)
	}
</script>
