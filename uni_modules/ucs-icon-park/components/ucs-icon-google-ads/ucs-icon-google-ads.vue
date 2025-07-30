<template>
	<ucs-svg :width="getOsFontSize(size)" :height="getOsFontSize(size)" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《谷歌广告》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#icon-3f619f9fb10dde87)"><path d="M41.3551 34.1527L29.5218 8.7761C28.1213 5.77286 24.5514 4.47352 21.5482 5.87396C18.545 7.27439 17.2456 10.8443 18.6461 13.8475L30.4794 39.2241C31.8798 42.2274 35.4497 43.5267 38.4529 42.1263C41.4562 40.7258 42.7555 37.156 41.3551 34.1527Z" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}"/><path d="M23.4375 26.5357L17.5209 39.224C16.1204 42.2273 12.5506 43.5266 9.54731 42.1262V42.1262C6.54407 40.7257 5.24474 37.1558 6.64517 34.1526L18.374 9" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}"/><circle cx="12.0828" cy="36.6882" r="6" transform="rotate(25 12.0828 36.6882)" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}"/></g><defs><clipPath id="icon-3f619f9fb10dde87"><rect width="48" height="48" fill="${colors(props.theme, props.fill, 2)}"/></clipPath></defs></svg>`
	});
</script>