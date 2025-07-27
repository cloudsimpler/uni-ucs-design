<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《垂钓》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20.9871 34.5522L12 29L39 29C40.6569 29 42 30.3431 42 32C42 33.6569 40.6569 35 39 35L22.5639 35C22.0069 35 21.461 34.845 20.9871 34.5522Z" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M30 11C31.1046 11 32 10.1046 32 9C32 7.89543 31.1046 7 30 7C28.8954 7 28 7.89543 28 9C28 10.1046 28.8954 11 30 11Z" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-miterlimit="2"/><path d="M34.0001 32C38 29 36.5001 22.4336 35.5001 20.5C34.5001 18.5664 32.5494 16 32.5494 16C32.5494 16 31.5001 16 30.5001 17C27.8215 19.6786 26.0001 23 23.5001 23C21.0001 23 17.5001 21 17.5001 21" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-miterlimit="2" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M20.0005 15C16.4037 10.5042 13.6152 8.43381 8.0005 8.06204C6.89835 7.98906 6.0001 8.89545 6.0001 10L6.0001 28" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M7 43C11 43 9.9375 41 13 41C16.0625 41 15 43 18.5 43C22 43 21 41 24.5 41C28 41 27.4375 43 30.5 43C33.5625 43 32 41 35.5 41C39 41 38.0625 43 42 43" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/></svg>`
	});
</script>