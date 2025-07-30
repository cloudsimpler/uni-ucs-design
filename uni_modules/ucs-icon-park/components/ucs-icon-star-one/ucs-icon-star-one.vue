<template>
	<ucs-svg :width="getOsFontSize(size)" :height="getOsFontSize(size)" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《星星》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M16.8712 33.0437L15.9976 44.7037C15.9362 45.5231 16.6646 46.0874 17.3161 45.7222C21.9289 43.1384 36.3783 33.6481 43.7017 12.7901C44.0376 11.8333 43.1352 10.9699 42.3646 11.5096C38.0387 14.5391 28.5846 20.8008 22.7421 21.9935C22.7421 21.9935 26.4836 19.3948 28.7231 15.4055C28.9426 15.0144 28.9244 14.5138 28.6796 14.1608L20.5127 2.38942C20.0287 1.69163 19.0354 1.98074 18.8606 2.87019L16.3181 15.8074L4.38437 26.2228C3.78602 26.7448 3.90808 27.7998 4.5989 28.0792L16.8712 33.0437Z" fill="${colors(props.theme, props.fill, 0)}"/><path fill-rule="evenodd" clip-rule="evenodd" d="M37.9745 28.4481C37.2188 29.5026 35.5908 31.6718 34.0876 32.9975C33.7871 33.2625 33.8276 33.707 34.1724 33.9235L42.1145 38.9092C42.5926 39.2092 43.2384 38.853 43.1576 38.3325C42.7882 35.9498 41.7237 30.982 39.0328 28.3743C38.7322 28.0832 38.2142 28.1138 37.9745 28.4481Z" fill="${colors(props.theme, props.fill, 0)}"/></svg>`
	});
</script>