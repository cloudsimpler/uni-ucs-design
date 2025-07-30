<template>
	<ucs-svg :width="getOsFontSize(size)" :height="getOsFontSize(size)" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《高脚杯》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#icon-1b9ae7b045e04bcb)"><path d="M5.73633 24.1211L10.6861 29.0709C15.7629 34.1477 23.9941 34.1477 29.0709 29.0709V29.0709C34.1477 23.994 34.1477 15.7629 29.0709 10.6861L24.1211 5.73632" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M30 29.9998L35.9998 35.9998" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-miterlimit="2" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><ellipse cx="13.9996" cy="13.9998" rx="13" ry="7" transform="rotate(-45 13.9996 13.9998)" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}"/><ellipse cx="37.9997" cy="37.9998" rx="6" ry="3" transform="rotate(-45 37.9997 37.9998)" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}"/></g><defs><clipPath id="icon-1b9ae7b045e04bcb"><rect width="48" height="48" fill="${colors(props.theme, props.fill, 2)}"/></clipPath></defs></svg>`
	});
</script>