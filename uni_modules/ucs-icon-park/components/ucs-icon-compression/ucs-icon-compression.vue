<template>
	<ucs-svg :width="getOsFontSize(size)" :height="getOsFontSize(size)" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《压缩》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.91962 8.7141C8.49508 7.38938 9.47567 6 10.8668 6H37.1332C38.5243 6 39.5049 7.38938 39.0804 8.7141C37.8993 12.3995 36 19.0894 36 24C36 28.9106 37.8993 35.6005 39.0804 39.2859C39.5049 40.6106 38.5243 42 37.1332 42H10.8668C9.47567 42 8.49508 40.6106 8.91962 39.2859C10.1007 35.6005 12 28.9106 12 24C12 19.0894 10.1007 12.3995 8.91962 8.7141Z" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M4 15C5.5 17 5.99988 21 5.99988 24C5.99988 27 5.5 31 4 33" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M18 15.5H30" stroke="${colors(props.theme, props.fill, 2)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}"/><path d="M18 24H30" stroke="${colors(props.theme, props.fill, 2)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}"/><path d="M18 32H22" stroke="${colors(props.theme, props.fill, 2)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}"/><path d="M44 15C42.5 17 42.0001 21 42.0001 24C42.0001 27 42.5 30 44 33" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/></svg>`
	});
</script>