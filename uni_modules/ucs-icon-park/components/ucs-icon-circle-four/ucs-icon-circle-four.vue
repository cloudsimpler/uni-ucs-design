<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《圆圈》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M24 10C25.6569 10 27 8.65685 27 7C27 5.34315 25.6569 4 24 4C22.3431 4 21 5.34315 21 7C21 8.65685 22.3431 10 24 10Z" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path fill-rule="evenodd" clip-rule="evenodd" d="M24 44C25.6569 44 27 42.6569 27 41C27 39.3431 25.6569 38 24 38C22.3431 38 21 39.3431 21 41C21 42.6569 22.3431 44 24 44Z" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path fill-rule="evenodd" clip-rule="evenodd" d="M7 27C8.65685 27 10 25.6569 10 24C10 22.3431 8.65685 21 7 21C5.34315 21 4 22.3431 4 24C4 25.6569 5.34315 27 7 27Z" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path fill-rule="evenodd" clip-rule="evenodd" d="M41 27C42.6569 27 44 25.6569 44 24C44 22.3431 42.6569 21 41 21C39.3431 21 38 22.3431 38 24C38 25.6569 39.3431 27 41 27Z" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M24.1969 15.7438C27.2874 15.7438 30.0141 14.1861 31.6346 11.813C33.5162 12.9388 35.1205 14.4804 36.3205 16.3109C33.7298 17.891 32.0002 20.7436 32.0002 24.0001C32.0002 27.3429 33.8226 30.26 36.528 31.8121C35.4049 33.6294 33.8903 35.1793 32.102 36.3441C30.5754 33.5472 27.6077 31.6499 24.1969 31.6499C20.7969 31.6499 17.8373 33.5352 16.3064 36.3175C14.4779 35.1178 12.9379 33.5146 11.813 31.6345C14.1861 30.014 15.7438 27.2873 15.7438 24.1969C15.7438 21.1166 14.1964 18.3977 11.8365 16.7753C13.0547 14.7537 14.7538 13.0547 16.7753 11.8365C18.3977 14.1964 21.1166 15.7438 24.1969 15.7438Z" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/></svg>`
	});
</script>