<template>
	<!-- #ifdef UNI-APP-X -->
	<!-- #ifdef APP -->
	<ucs-iconPark-svg :style="{width:`${width}${unit}`,height:`${height}${unit}`}" :src="src" />
	<!-- #endif -->
	<!-- #ifndef APP -->
	<image :src="`data:image/svg+xml;charset=utf-8,${encodeURIComponent(src)}`"
		:style="{width:`${width}${unit}`,height:`${height}${unit}`}" />
	<!-- #endif -->
	<!-- #endif -->
	<!-- #ifndef UNI-APP-X -->
	<!-- #ifdef APP-PLUS-NVUE -->
	<ucs-iconPark-svg :style="{width:`${width}${unit}`,height:`${height}${unit}`}" :src="src" />
	<!-- #endif -->
	<!-- #ifndef APP-PLUS-NVUE -->
	<image :src="`data:image/svg+xml;charset=utf-8,${encodeURIComponent(src)}`"
		:style="{width:`${width}${unit}`,height:`${height}${unit}`}" />
	<!-- #endif -->
	<!-- #endif -->
</template>

<script>
	/**
	 * ucs-iconPark SVG图标组件
	 * @description 一款适用于 uni-app / uni-app-x 的 SVG 组件，全端全版本适配。
	 * @tutorial 
	 * @property {String} src svg资源参数
	 * @property {Number} width 宽度
	 * @property {Number} height 高度
	 * @property {String} unit 单位，默认px
	 */
	export default {
		props: {
			src: {
				type: String,
				default: ""
			},
			width: {
				type: Number,
				default: 24
			},
			height: {
				type: Number,
				default: 24
			},
			unit: {
				type: String,
				default: "px"
			}
		}
	}
</script>

<style scoped>

</style>