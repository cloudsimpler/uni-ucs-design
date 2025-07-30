<template>
	<ucs-svg :width="getOsFontSize(size)" :height="getOsFontSize(size)" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《内分泌》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M23.1466 44C31.2933 44 40 43.0106 40 30.1802C40 23.9643 38.5085 18.9042 35.5256 15C32.7392 19.6667 30.674 22 29.3299 22C27.3139 22 29.3299 15.9107 26.9987 11.2914C25.4445 8.21194 22.6879 5.78146 18.7289 4C19.2794 8.43691 19.1603 11.6554 18.3715 13.6554C17.1882 16.6554 7.15114 21.91 8.05783 30.9349C8.96453 39.9599 15 44 23.1466 44Z" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M21.7076 24.0083C17.9028 27.4666 16.2811 30.6674 16.8427 33.6109C17.3261 36.1448 19.2487 37.3764 20.6969 37.7735C21.8196 38.0814 23.7635 38.2536 25.5004 36.7067C27.3402 35.0682 26.6071 32.7388 23.9392 29.8571C22.8138 28.6415 22.0699 26.6919 21.7076 24.0083Z" fill="${colors(props.theme, props.fill, 3)}" stroke="${colors(props.theme, props.fill, 2)}" stroke-width="${props.strokeWidth}" stroke-linejoin="${props.strokeLinejoin}"/></svg>`
	});
</script>