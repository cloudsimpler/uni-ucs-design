<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《材料3》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 15V9.56389C9 8.67237 9.08702 8.34908 9.25044 8.02315C9.41385 7.69723 9.65365 7.44144 9.95921 7.26713C10.2648 7.09283 10.5678 7 11.4036 7H36.5964C37.4322 7 37.7352 7.09283 38.0408 7.26713C38.3463 7.44144 38.5862 7.69723 38.7496 8.02315C38.913 8.34908 39 8.67237 39 9.56389V15" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M5 15H43V41H5V15Z" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linejoin="${props.strokeLinejoin}"/><path fill-rule="evenodd" clip-rule="evenodd" d="M13 26C14.6569 26 16 24.6569 16 23C16 21.3431 14.6569 20 13 20C11.3431 20 10 21.3431 10 23C10 24.6569 11.3431 26 13 26Z" fill="${colors(props.theme, props.fill, 0)}"/><path d="M5.56934 40.39L15.0004 30L20.0004 34L26.0004 27L42.3941 40.39" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/></svg>`
	});
</script>