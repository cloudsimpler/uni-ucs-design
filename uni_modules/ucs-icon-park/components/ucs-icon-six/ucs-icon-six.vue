<template>
	<ucs-svg :width="getOsFontSize(size)" :height="getOsFontSize(size)" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《六》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18.9995 41C13.4995 38.25 8.0008 30 5.00014 25C1.99947 20 8.31271 15.3125 11.9999 19C15.6871 22.6875 15.9999 23 15.9999 23V17.5C15.9999 15.567 17.5669 14 19.4999 14C21.4329 14 22.9999 15.567 22.9999 17.5V16C22.9999 14.067 24.5669 12.5 26.4999 12.5C28.4329 12.5 29.9999 14.067 29.9999 16V17.5C29.9999 15.567 31.5669 14 33.4999 14C35.4329 14 36.9999 15.567 36.9999 17.5V7.5C36.9999 5.567 38.5669 4 40.4999 4C42.4329 4 43.9999 5.567 43.9999 7.5V28.9663C43.9999 30.9689 43.6297 32.9743 42.5445 34.6573C41.2626 36.6453 39.1111 39.3028 35.9995 41C30.4994 44 24.4995 43.75 18.9995 41Z" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/></svg>`
	});
</script>