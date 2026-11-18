<template>
	<view class="ucs-spinner" :style="spinnerStyle">
		<image class="ucs-spinner__ring"
			:class="{ 'ucs-spinner__ring--animated': props.animated }" :flatten="false"
			:src="spinnerSrc" :style="spinnerStyle" mode="aspectFit" />
	</view>
</template>

<script setup>
	import { computed } from 'vue'
	import { getSpinnerSource } from './svg.js'
	import { getFontSize, getThemeColor } from '../../core/config.js'

	defineOptions({ options: { virtualHost: true } })

	/**
	 * ucs-spinner 旋转加载指示器。
	 *
	 * @description 使用渐隐圆环与圆头 SVG 外观，由 CSS @keyframes 实现 1s 一周的匀速旋转。
	 * SVG 只绘制静态形状，颜色经 core 解析后写入 SVG，随主题变化更新图片地址。
	 * 使用 UTF-8 Base64 Data URL 加载 SVG。
	 * 圆环线宽固定为外径的 7/80，背景透明；关闭 animated 时显示初始静态圆环。
	 * 默认跟随全局字号偏移；scaleWithFont 为 false 时保持基础尺寸。class、style 及其他原生属性透传到外层 view。
	 * uni-app-x App 的 CSS 动画需要 Vapor 5.31+；不提供旧版 VDOM 元素动画回退。
	 * @property {number} [size=24] 圆环外径，单位 px；非有限值或非正数回退为 24。
	 * @property {boolean} [scaleWithFont=true] 是否跟随全局字号偏移；关闭时固定使用规范化后的 size。
	 * @property {string|string[]} [color='primary-6'] 渐隐圆环颜色，由 core 解析色阶、外部颜色或明暗数组。
	 * @property {boolean} [animated=true] 是否旋转；关闭后只显示静态圆环。
	 * @example
	 * <ucs-spinner :size="32" color="primary-6" />
	 * <ucs-spinner :size="24" :scale-with-font="false" />
	 * <ucs-spinner :animated="false" color="#1677FF" />
	 */
	const props = defineProps({
		size: { type: Number, default: 24 },
		scaleWithFont: { type: Boolean, default: true },
		color: { type: [String, Array], default: 'primary-6' },
		animated: { type: Boolean, default: true }
	})

	/** 先规范化基础尺寸；允许缩放时与字体图标一样叠加全局字号偏移。 */
	const spinnerSize = computed(() => {
		const size = Number.isFinite(props.size) && props.size > 0 ? props.size : 24
		return props.scaleWithFont ? getFontSize(size) : size
	})
	/** 容器和 SVG 图片使用相同尺寸，图形线宽随固定 viewBox 同比缩放。 */
	const spinnerStyle = computed(() => ({
		width: `${spinnerSize.value}px`,
		height: `${spinnerSize.value}px`
	}))

	/** SVG 编码按解析后的颜色共享缓存，尺寸和无关配置变化不重新编码。 */
	const spinnerSrc = computed(() => getSpinnerSource(getThemeColor(props.color)))
</script>

<style>
	.ucs-spinner {
		flex-shrink: 0;
		box-sizing: border-box;
	}

	.ucs-spinner__ring {
		flex-shrink: 0;
		box-sizing: border-box;
	}

	.ucs-spinner__ring--animated {
		animation-name: ucs-spinner-spin;
		animation-duration: 1s;
		animation-timing-function: linear;
		animation-iteration-count: infinite;
	}

	@keyframes ucs-spinner-spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
