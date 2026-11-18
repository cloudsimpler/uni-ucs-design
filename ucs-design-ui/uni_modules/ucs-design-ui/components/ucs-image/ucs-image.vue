<template>
	<image :key="imageState.id" class="ucs-image" :src="imageState.src" :mode="props.mode" :style="imageStyle"
		:show-menu-by-longpress="props.showMenuByLongpress" @load="imageState.onLoad" @error="imageState.onError"
		@tap="onTap" @longpress="onLongPress" />
</template>

<script setup>
	import { computed, shallowRef, watch } from 'vue'
	import { getThemeColor } from '../../core/config.js'

	defineOptions({ options: { virtualHost: true } })

	/**
	 * ucs-image 基础图片组件。
	 *
	 * @description 基于原生 image 提供尺寸、圆角、主题背景与失败备用图。
	 * 未指定有效 height 时沿用 width 的 CSS 长度；相同像素宽高形成正方形，百分比取决于父布局。
	 * 尺寸不随全局字号偏移变化。
	 * class、style 和其他未声明的原生属性透传至根 image，外部 style 可覆盖计算样式。
	 * @property {string} [src=''] 主图片地址，变化后重新开始加载并重置备用图状态。
	 * @property {string} [errorSrc=''] 主图失败后使用的备用图地址；为空或与主图相同时不替换。
	 * @property {string} [mode='scaleToFill'] 原生图片缩放与裁剪模式。
	 * @property {string|number} [width=100] 图片宽度；有限非负数字转为 px，字符串作为 CSS 长度。
	 * @property {string|number} [height=0] 图片高度；数字 0、字符串 '0'、空值或无效数字跟随 width。
	 * @property {string|number} [radius=0] 圆角；有限非负数字转为 px，也可使用 '50%' 等 CSS 长度。
	 * @property {string|string[]} [placeholderColor='transparent'] 背景色，支持色阶键、CSS 颜色或 [亮色, 暗色]。
	 * @property {boolean} [showMenuByLongpress=false] 原生长按菜单开关，实际支持情况由平台决定。
	 * @event {object} load 当前主图或备用图加载完成，传递原生事件。
	 * @event {object} error 当前主图或备用图加载失败，在切换备用图之前传递原生事件。
	 * @event {object} tap 轻触图片时触发，传递原生事件。
	 * @event {object} click 与 tap 同次触发，顺序为 tap → click；通常只需订阅其中一个。
	 * @event {object} longpress 长按图片时触发，传递原生事件。
	 * @example
	 * <ucs-image src="/static/logo.png" :width="80" radius="50%" mode="aspectFill" />
	 * <ucs-image :src="avatar" error-src="/static/default-avatar.png" placeholder-color="gray-3" />
	 */
	const props = defineProps({
		src: { type: String, default: '' },
		errorSrc: { type: String, default: '' },
		mode: { type: String, default: 'scaleToFill' },
		width: { type: [String, Number], default: 100 },
		height: { type: [String, Number], default: 0 },
		radius: { type: [String, Number], default: 0 },
		placeholderColor: { type: [String, Array], default: 'transparent' },
		showMenuByLongpress: { type: Boolean, default: false }
	})
	const emit = defineEmits(['load', 'error', 'tap', 'click', 'longpress'])

	/**
	 * @param {unknown} value 图片地址。
	 * @returns {string} 去除两端空白的地址；非字符串返回空字符串。
	 */
	const normalizeSrc = value => typeof value === 'string' ? value.trim() : ''

	/**
	 * @param {string|number|null|undefined} value CSS 长度或 px 数值。
	 * @param {string} fallback 空值、无效类型或无效数字的回退值。
	 * @returns {string} CSS 长度字符串；字符串的合法性由目标平台判断。
	 */
	function toCssLength(value, fallback) {
		if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? `${value}px` : fallback
		return typeof value === 'string' && value.trim() ? value.trim() : fallback
	}

	/** 只计算图片自身样式，不把全局字号偏移叠加到图片尺寸。 */
	const imageStyle = computed(() => {
		const width = toCssLength(props.width, '100px')
		const height = props.height === 0 || (typeof props.height === 'string' && props.height.trim() === '0')
			? width : toCssLength(props.height, width)
		return {
			width,
			height,
			borderRadius: toCssLength(props.radius, '0px'),
			backgroundColor: getThemeColor(props.placeholderColor)
		}
	})

	let attemptId = 0
	/** 每次主图切换或备用图回退创建独立加载记录，用于忽略旧图片的迟到事件。 */
	const currentAttempt = shallowRef({ id: attemptId, src: normalizeSrc(props.src), fallback: false })
	watch(() => props.src, src => {
		currentAttempt.value = { id: ++attemptId, src: normalizeSrc(src), fallback: false }
	}, { flush: 'sync' })

	/** 每个原生 image 使用独立 key 和绑定加载记录的回调，备用图失败只报告错误。 */
	const imageState = computed(() => {
		const attempt = currentAttempt.value
		return {
			id: attempt.id,
			src: attempt.src,
			/** @param {object} event 当前图片的原生加载完成事件。 */
			onLoad(event) {
				if (currentAttempt.value === attempt) emit('load', event)
			},
			/** @param {object} event 当前图片的原生错误事件，先报告再决定是否回退。 */
			onError(event) {
				if (currentAttempt.value !== attempt) return
				emit('error', event)
				// 错误监听器可能同步更新 src，不能用旧请求覆盖新的主图。
				if (currentAttempt.value !== attempt) return
				const fallback = normalizeSrc(props.errorSrc)
				if (!attempt.fallback && fallback && fallback !== attempt.src) {
					currentAttempt.value = { id: ++attemptId, src: fallback, fallback: true }
				}
			}
		}
	})

	/** @param {object} event 原生轻触事件，按 tap、click 顺序转发。 */
	function onTap(event) {
		emit('tap', event)
		emit('click', event)
	}
	/** @param {object} event 原生长按事件，保持事件对象不变。 */
	function onLongPress(event) {
		emit('longpress', event)
	}
</script>

<style>
	.ucs-image {
		flex-shrink: 0;
	}
</style>
