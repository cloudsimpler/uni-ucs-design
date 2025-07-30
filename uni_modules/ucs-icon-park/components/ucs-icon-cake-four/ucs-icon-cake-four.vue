<template>
	<ucs-svg :width="getOsFontSize(size)" :height="getOsFontSize(size)" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《蛋糕》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 25L11.1711 40.6283C11.4421 41.4471 12.2074 42 13.0699 42H34.9301C35.7926 42 36.5579 41.4471 36.8289 40.6283L42 25" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}"/><path d="M11.4071 25.1228H6.31652C6.14171 25.1228 5.99963 24.9803 6.00362 24.8055C6.16392 17.7822 11.6341 11.8858 19 10H29C36.0773 12.036 41.8233 17.9578 41.996 24.8057C42.0004 24.9804 41.8583 25.1228 41.6835 25.1228H36.5929C34.2767 25.1228 32.0393 25.9636 30.2964 27.4891C26.6917 30.6441 21.3083 30.6441 17.7036 27.4891C15.9607 25.9636 13.7233 25.1228 11.4071 25.1228Z" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M19.1 10C19.0344 9.67689 19 9.34247 19 9C19 6.23858 21.2386 4 24 4C26.7614 4 29 6.23858 29 9C29 9.34247 28.9656 9.67689 28.9 10" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/></svg>`
	});
</script>