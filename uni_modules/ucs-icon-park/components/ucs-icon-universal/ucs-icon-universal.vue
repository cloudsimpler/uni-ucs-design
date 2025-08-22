<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《宇宙》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 38C31.732 38 38 31.732 38 24C38 16.268 31.732 10 24 10C16.268 10 10 16.268 10 24C10 31.732 16.268 38 24 38Z" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}"/><path d="M11 29C12.5089 29.6244 15 30 16.2586 28.5317C17.5171 27.0633 16.395 24.7522 17.7889 23.9682C19.317 23.1086 20.4203 26.0319 23.2912 25.516C26.162 25 28 21 28 19C28 17 26.2854 17 26.162 15.0542C26 12.5 28 11 28 11" stroke="${colors(props.theme, props.fill, 2)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}"/><path d="M27.9995 37C26.9137 36.091 25.9995 35.5 26.0001 34C26.0006 32.5 26.9995 33 27.9995 32C28.9996 31 28.4995 29 29.4999 28.5C30.5004 28 33.6075 29.0558 35.9998 31" stroke="${colors(props.theme, props.fill, 2)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}"/><circle cx="24" cy="4" r="2" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="24" cy="44" r="2" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="44" cy="24" r="2" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="38" cy="10" r="2" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="10" cy="38" r="2" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="4" cy="24" r="2" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="10" cy="10" r="2" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="38" cy="38" r="2" fill="${colors(props.theme, props.fill, 0)}"/><path d="M10 24C10 27.8146 11.5256 31.2729 14 33.798" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M24 38C31.732 38 38 31.732 38 24" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M24 10C27.8146 10 31.2729 11.5256 33.798 14" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/></svg>`
	});
</script>