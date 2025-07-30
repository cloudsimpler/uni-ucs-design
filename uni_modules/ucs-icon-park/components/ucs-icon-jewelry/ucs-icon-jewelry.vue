<template>
	<ucs-svg :width="getOsFontSize(size)" :height="getOsFontSize(size)" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《首饰》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="20" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}"/><path d="M20 24C20 17.6364 22.6275 15.3535 24 15C25.22 15.1768 28 17.2121 28 24C28 30.7879 25.22 33 24 33C22.6275 32.8232 20 30.3636 20 24Z" fill="${colors(props.theme, props.fill, 3)}" stroke="${colors(props.theme, props.fill, 2)}" stroke-width="${props.strokeWidth}"/><path d="M19.9995 22.9999C18.4464 21.4623 13.6179 21.8398 12.0002 21.9999C11.5149 23.7617 12.3521 27.4922 14.2934 29.4142C16.72 31.8166 18.6609 32.9999 23.9995 32.9999" stroke="${colors(props.theme, props.fill, 2)}" stroke-width="${props.strokeWidth}"/><path d="M28 22.9999C29.4358 21.4668 33.5044 21.8402 35 21.9999C35.2991 23.5969 35.1402 27.1878 32.6276 29.8707C30.115 32.5536 25.5 32.9999 24 32.9999" stroke="${colors(props.theme, props.fill, 2)}" stroke-width="${props.strokeWidth}"/></svg>`
	});
</script>