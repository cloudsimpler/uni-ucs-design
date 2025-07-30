<template>
	<ucs-svg :width="getOsFontSize(size)" :height="getOsFontSize(size)" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《苹果智能手表》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.4167 10.5C18.2373 7.69936 21.9423 6 26 6C34.8366 6 42 14.0589 42 24C42 33.9411 34.8366 42 26 42C21.9423 42 18.2373 40.3006 15.4167 37.5" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}"/><rect x="6" y="10" width="10" height="28" rx="2" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><rect x="13" y="18" width="4" height="4" rx="2" transform="rotate(90 13 18)" fill="${colors(props.theme, props.fill, 2)}"/><rect x="13" y="25" width="4" height="4" rx="2" transform="rotate(90 13 25)" fill="${colors(props.theme, props.fill, 2)}"/></svg>`
	});
</script>