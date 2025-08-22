<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《腹部》图标
	 * @tutorial https://ucs.cloudsimpler.com/library/ucs-iconPark
	 * @property {Number} size 图标大小
	 * @property {Number} strokeWidth 线段粗细
	 * @property {String} theme 图标大小
	 * @property {Array<string>} fill 图标颜色，["外部描边颜色","外部填充颜色","内部描边颜色","内部填充颜色"]
	 * @property {String} strokeLinecap 图标大小
	 * @property {String} strokeLinejoin 图标大小
	 */
	import { colors, IiconParkProps } from "../../mixins/iconParkMixin.uts";
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.89926 5C10.7371 8.01931 12.156 11.9408 12.156 16.7645C12.156 24 5.9995 29.5382 4.969 33.5C4.282 36.1412 3.95884 39.3078 3.9995 43" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}"/><path d="M39.256 5C36.4182 8.01931 34.9992 11.9408 34.9992 16.7645C34.9992 24 41.1558 29.5382 42.1863 33.5C42.8733 36.1412 43.1964 39.3078 43.1558 43" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}"/><path d="M6.24414 30.8369C12.7693 34.9668 18.6949 37.0317 24.0211 37.0317C29.3472 37.0317 34.9799 34.9668 40.9192 30.8369" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}"/><path d="M24 31C25.3807 31 26.5 29.8807 26.5 28.5C26.5 27.1193 25.3807 26 24 26C22.6193 26 21.5 27.1193 21.5 28.5C21.5 29.8807 22.6193 31 24 31Z" fill="${colors(props.theme, props.fill, 0)}"/></svg>`
	});
</script>