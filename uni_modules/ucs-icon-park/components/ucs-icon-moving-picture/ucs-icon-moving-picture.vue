<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《图片》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="22" width="20" height="20" rx="3" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M30 6L42 6L42 18" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><circle cx="34" cy="42" r="1.5" fill="${colors(props.theme, props.fill, 0)}" stroke="${colors(props.theme, props.fill, 0)}"/><circle r="1.5" transform="matrix(1 0 0 -1 6 14)" fill="${colors(props.theme, props.fill, 0)}" stroke="${colors(props.theme, props.fill, 0)}"/><circle cx="42" cy="42" r="1.5" fill="${colors(props.theme, props.fill, 0)}" stroke="${colors(props.theme, props.fill, 0)}"/><circle r="1.5" transform="matrix(1 0 0 -1 6 6)" fill="${colors(props.theme, props.fill, 0)}" stroke="${colors(props.theme, props.fill, 0)}"/><circle cx="42" cy="34" r="1.5" fill="${colors(props.theme, props.fill, 0)}" stroke="${colors(props.theme, props.fill, 0)}"/><circle r="1.5" transform="matrix(1 0 0 -1 14 6)" fill="${colors(props.theme, props.fill, 0)}" stroke="${colors(props.theme, props.fill, 0)}"/><circle cx="42" cy="26" r="1.5" fill="${colors(props.theme, props.fill, 0)}" stroke="${colors(props.theme, props.fill, 0)}"/><circle r="1.5" transform="matrix(1 0 0 -1 22 6)" fill="${colors(props.theme, props.fill, 0)}" stroke="${colors(props.theme, props.fill, 0)}"/><path d="M6 34L12.1195 29.4103C13.2239 28.5821 14.7509 28.6143 15.8192 29.4885L25 37" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M42 6L30 18" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/></svg>`
	});
</script>