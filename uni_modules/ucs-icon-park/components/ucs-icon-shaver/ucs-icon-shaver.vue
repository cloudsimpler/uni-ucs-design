<template>
	<ucs-svg :width="getOsFontSize(size)" :height="getOsFontSize(size)" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《剃须刀》图标
	 * @tutorial https://ucs.cloudsimpler.com/library/ucs-iconPark
	 * @property {Number} size 图标大小
	 * @property {Number} strokeWidth 线段粗细
	 * @property {String} theme 图标大小
	 * @property {Array<string>} fill 图标颜色，["外部描边颜色","外部填充颜色","内部描边颜色","内部填充颜色"]
	 * @property {String} strokeLinecap 图标大小
	 * @property {String} strokeLinejoin 图标大小
	 */
	import { colors, IiconParkProps } from "../../mixins/iconParkMixin.uts";
	import { getOsFontSize } from "@/uni_modules/ucs-config"
	import { computed } from "vue";
	
	const props = withDefaults(defineProps<IiconParkProps>(), {
		size: 24,
		strokeWidth: 4,
		theme: 'outline',
		fill: ["#000000"],
		strokeLinecap: 'round',
		strokeLinejoin: 'round'
	});

	const iconSvg = computed(() : string => {
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20.7847 18.7299C21.0654 18.4492 21.5205 18.4492 21.8012 18.7299L29.27 26.1987C29.5507 26.4794 29.5507 26.9345 29.27 27.2152L17.7574 38.7278C15.4143 41.0709 11.6153 41.0709 9.27215 38.7278C6.92901 36.3846 6.92901 32.5856 9.27215 30.2425L20.7847 18.7299Z" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}"/><path d="M42.5813 22.389C42.9302 22.04 42.9302 21.4742 42.5813 21.1252L26.8745 5.4184C26.5255 5.06942 25.9597 5.06942 25.6107 5.4184L24.8284 6.20073C20.1421 10.887 20.1421 18.485 24.8284 23.1713V23.1713C29.5146 27.8576 37.1126 27.8576 41.7989 23.1713L42.5813 22.389Z" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}"/><path d="M19.8787 28.1211L18.4644 29.5353" stroke="${colors(props.theme, props.fill, 2)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M27.657 17.5146L30.4854 20.3431" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/></svg>`
	});
</script>