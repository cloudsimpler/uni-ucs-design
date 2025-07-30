<template>
	<ucs-svg :width="getOsFontSize(size)" :height="getOsFontSize(size)" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《保留球》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 49 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.7773 20H17.7773C17.7773 20 24.7773 27.28 24.7773 34C24.7773 40.72 18.7773 44 18.7773 44H12.7773C12.7773 44 6.77734 40.72 6.77734 34C6.77734 27.28 13.7773 20 13.7773 20Z" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M15.7773 4C17.8607 4 20.7773 5.52 20.7773 10C20.7773 14.48 17.444 20 17.444 20H14.1107C14.1107 20 10.7773 14.48 10.7773 10C10.7773 5.52 13.694 4 15.7773 4Z" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M31.7773 20H35.7773C35.7773 20 42.7773 27.28 42.7773 34C42.7773 40.72 36.7773 44 36.7773 44H30.7773C30.7773 44 24.7773 40.72 24.7773 34C24.7773 27.28 31.7773 20 31.7773 20Z" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M33.7773 4C35.8607 4 38.7773 5.52 38.7773 10C38.7773 14.48 35.444 20 35.444 20H32.1107C32.1107 20 28.7773 14.48 28.7773 10C28.7773 5.52 31.694 4 33.7773 4Z" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/></svg>`
	});
</script>