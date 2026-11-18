<template>
	<view class="ucs-status-bar" :style="rootStyle" />
</template>

<script setup>
	import { computed } from 'vue'
	import { getThemeColor } from '../../core/config.js'

	/**
	 * ucs-status-bar 顶部状态栏占位。
	 * @description 用于自定义导航栏顶部，自动避让系统状态栏；不包含导航内容和小程序胶囊区域。
	 * 不设置系统状态栏文字颜色，也不修改系统导航栏配置。
	 * uni-app-x 使用 --status-bar-height；普通 uni-app 统一通过 getWindowInfo().statusBarHeight 读取实际高度。
	 * 普通 uni-app 在样式 computed 求值时直接读取，不监听窗口；背景或主题变化触发样式重算时会重新读取。不支持 nvue。
	 * 高度不随字号缩放，无手动高度、测量事件或公开方法，无默认插槽。
	 * 原生导航栏或外层已预留状态栏时不应重复添加。class、style 透传根 view，避免覆盖高度。
	 * @property {string|string[]} [backgroundColor='transparent'] 占位背景，支持 core 色阶、外部颜色或明暗数组。
	 * @example
	 * <ucs-status-bar />
	 * <ucs-status-bar background-color="gray-1" />
	 */
	const props = defineProps({
		backgroundColor: { type: [String, Array], default: 'transparent' }
	})
	/** 背景响应主题变化；普通 uni-app 绑定实际像素高度。 */
	const rootStyle = computed(() => {
		const style = { backgroundColor: getThemeColor(props.backgroundColor) }
		// #ifndef UNI-APP-X
		style.height = `${uni.getWindowInfo().statusBarHeight}px`
		// #endif
		return style
	})
</script>

<style>
	.ucs-status-bar {
		display: flex;
		width: 100%;
		/* #ifdef UNI-APP-X */
		height: var(--status-bar-height);
		/* #endif */
		flex-shrink: 0;
		box-sizing: border-box;
	}
</style>
