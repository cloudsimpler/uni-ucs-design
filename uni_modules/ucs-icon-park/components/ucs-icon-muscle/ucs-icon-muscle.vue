<template>
	<ucs-svg :width="getOsFontSize(size)" :height="getOsFontSize(size)" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《肌肉》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21.37 36C22.82 30.75 27.89 27 33.73 27.62C39.29 28.21 43.71 32.9 43.99 38.48C44.06 39.95 43.86 41.36 43.43 42.67C43.17 43.47 42.39 44 41.54 44H11.7584C6.71004 44 2.92371 39.3814 3.91377 34.4311L9.99994 4H21.9999L25.9999 11L17.43 17.13L14.9999 14" fill="${colors(props.theme, props.fill, 1)}"/><path d="M21.37 36C22.82 30.75 27.89 27 33.73 27.62C39.29 28.21 43.71 32.9 43.99 38.48C44.06 39.95 43.86 41.36 43.43 42.67C43.17 43.47 42.39 44 41.54 44H11.7584C6.71004 44 2.92371 39.3814 3.91377 34.4311L9.99994 4H21.9999L25.9999 11L17.43 17.13L14.9999 14" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-miterlimit="2" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M17.4395 17.1299L21.9995 33.9999" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-miterlimit="2" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/></svg>`
	});
</script>