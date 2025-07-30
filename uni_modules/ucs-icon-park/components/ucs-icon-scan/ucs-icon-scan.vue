<template>
	<ucs-svg :width="getOsFontSize(size)" :height="getOsFontSize(size)" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《扫描》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 24L41 24" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M24 7L24 41" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><rect x="5" y="5" width="4" height="4" fill="${colors(props.theme, props.fill, 0)}"/><rect x="14" y="5" width="4" height="4" fill="${colors(props.theme, props.fill, 0)}"/><rect x="30" y="5" width="4" height="4" fill="${colors(props.theme, props.fill, 0)}"/><rect x="39" y="5" width="4" height="4" fill="${colors(props.theme, props.fill, 0)}"/><rect x="39" y="14" width="4" height="4" fill="${colors(props.theme, props.fill, 0)}"/><rect x="5" y="14" width="4" height="4" fill="${colors(props.theme, props.fill, 0)}"/><rect x="5" y="39" width="4" height="4" fill="${colors(props.theme, props.fill, 0)}"/><rect x="14" y="39" width="4" height="4" fill="${colors(props.theme, props.fill, 0)}"/><rect x="30" y="39" width="4" height="4" fill="${colors(props.theme, props.fill, 0)}"/><rect x="39" y="39" width="4" height="4" fill="${colors(props.theme, props.fill, 0)}"/><rect x="39" y="30" width="4" height="4" fill="${colors(props.theme, props.fill, 0)}"/><rect x="5" y="30" width="4" height="4" fill="${colors(props.theme, props.fill, 0)}"/></svg>`
	});
</script>