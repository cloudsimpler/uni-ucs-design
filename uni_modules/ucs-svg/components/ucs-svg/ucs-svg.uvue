<template>
	<!-- #ifdef UNI-APP-X && APP -->
	<native-view :style="{width:`${width}${unit}`,height:`${height}${unit}`}" @init="onInit" />
	<!-- #endif -->
	<!-- #ifndef UNI-APP-X && APP -->
	<view class="__ucs-svg">
		<image :src="`data:image/svg+xml;charset=utf-8,${encodeURIComponent(src)}`"
			:style="{width:`${width}${unit}`,height:`${height}${unit}`}" />
	</view>
	<!-- #endif -->
</template>

<script setup lang="uts">
	/**
	 * ucs-svg svg组件
	 * @description 一款适用于 uni-app / uni-app-x 的 SVG 组件，全端全版本适配。
	 * @tutorial 
	 * @property {String} src svg资源参数
	 * @property {Number} width 宽度
	 * @property {Number} height 高度
	 * @property {String} unit 单位，默认px
	 */
	const props = defineProps({
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
	})

	// #ifdef UNI-APP-X && APP
	import { UcsSvg } from '@/uni_modules/ucs-svg';
	const svg = ref<UcsSvg | null>(null)

	function onInit(e : UniNativeViewInitEvent) {
		svg.value = new UcsSvg(e.detail.element)
		svg.value?.setSource(props.src)
	}

	watch(() : string => props.src, () => {
		svg.value?.setSource(props.src)
	}, { immediate: true })
	// #endif
</script>

<style scoped>
	.__ucs-svg {
		display: flex;
	}
</style>