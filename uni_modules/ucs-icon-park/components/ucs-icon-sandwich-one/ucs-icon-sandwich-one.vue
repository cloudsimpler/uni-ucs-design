<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《三明治》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#icon-5e274e6864bd3f7c)"><path d="M17.7988 40.1421C17.7988 40.1421 21.9583 44.3015 26.4505 43.1369C30.9427 41.9722 42.2564 30.6585 43.4211 26.1663C44.5857 21.6741 40.4262 17.5147 40.4262 17.5147" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M7.89941 30.2427C7.89941 30.2427 3.73996 26.0832 4.90461 21.591C6.06926 17.0988 17.383 5.7851 21.8752 4.62045C26.3674 3.4558 30.5268 7.61526 30.5268 7.61526" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><rect x="5.07129" y="33.0713" width="40" height="14" rx="7" transform="rotate(-45 5.07129 33.0713)" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M15.6779 33.7785L16.2406 32.0902C16.7822 30.4655 17.9928 29.1498 19.567 28.4752L19.9866 28.2953C21.2939 27.7351 22.2992 26.6425 22.749 25.2932V25.2932C23.1987 23.9439 24.204 22.8513 25.5113 22.291L26.4608 21.8841C27.698 21.3539 28.6493 20.32 29.075 19.0431V19.0431C29.544 17.636 30.6481 16.5319 32.0552 16.0629L34.0627 15.3937" stroke="${colors(props.theme, props.fill, 2)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/></g><defs><clipPath id="icon-5e274e6864bd3f7c"><rect width="48" height="48" fill="${colors(props.theme, props.fill, 2)}"/></clipPath></defs></svg>`
	});
</script>