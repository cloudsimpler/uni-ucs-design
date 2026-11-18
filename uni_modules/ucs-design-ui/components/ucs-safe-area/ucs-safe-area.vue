<template>
	<view class="ucs-safe-area" :style="rootStyle" />
</template>

<script setup>
	import { computed } from 'vue'
	import { getThemeColor } from '../../core/config.js'

	/**
	 * ucs-safe-area 底部安全区占位。
	 * @description uni-app-x 使用页面级安全区变量；普通 uni-app Web/WebView/小程序使用 CSS 环境变量。
	 * 不支持 nvue；宿主不支持环境变量时回退为 0px。
	 * 用于自定义底部操作栏、Tabbar、弹层；无默认插槽，不处理键盘避让。
	 * 宿主、原生 Tabbar 或外层已避让底部安全区时，不应重复添加。
	 * 高度由系统安全区决定，不随全局字号偏移变化，无需手动刷新或测量。
	 * class、style 及其他原生属性透传根 view，避免覆盖安全区高度。
	 * @property {string|string[]} [backgroundColor='transparent'] 背景色，支持 core 色阶、外部颜色或明暗数组。
	 * @example
	 * <ucs-safe-area />
	 * <ucs-safe-area background-color="gray-1" />
	 */
	const props = defineProps({
		backgroundColor: { type: [String, Array], default: 'transparent' }
	})
	/** 背景随主题更新，安全区高度由 CSS 自动适配。 */
	const rootStyle = computed(() => ({
		backgroundColor: getThemeColor(props.backgroundColor)
	}))
</script>

<style>
	.ucs-safe-area {
		display: flex;
		width: 100%;
		/* #ifdef UNI-APP-X */
		height: var(--uni-safe-area-inset-bottom);
		/* #endif */
		/* #ifndef UNI-APP-X */
		height: 0px;
		height: constant(safe-area-inset-bottom);
		height: env(safe-area-inset-bottom);
		/* #endif */
		flex-shrink: 0;
		box-sizing: border-box;
	}
</style>
