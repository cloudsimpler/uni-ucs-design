<template>
	<ucs-svg :width="getOsFontSize(size)" :height="getOsFontSize(size)" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《牛》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.4651 19.9231C10.6818 12.4814 16.5167 6 23.9995 6C31.4823 6 37.3173 12.4814 36.5339 19.9231L35.0464 34.055C34.4513 39.7083 29.6841 44 23.9995 44C18.315 44 13.5478 39.7083 12.9527 34.0549L11.4651 19.9231Z" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}"/><path d="M13.9995 31C17.4916 27.8746 25.4281 23.8297 33.9995 31" stroke="${colors(props.theme, props.fill, 2)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><circle cx="18.9995" cy="18" r="2" fill="${colors(props.theme, props.fill, 2)}"/><circle cx="20.9995" cy="34" r="2" fill="${colors(props.theme, props.fill, 2)}"/><circle cx="28.9995" cy="18" r="2" fill="${colors(props.theme, props.fill, 2)}"/><circle cx="26.9995" cy="34" r="2" fill="${colors(props.theme, props.fill, 2)}"/><path d="M33 7.91262C35.1667 5.91262 40.3923 2.30498 43 4.91262C45.6077 7.5203 43 9.9126 41 10.4126C38.5 11.0376 36.8 12.7128 36 13.9128" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M15.0962 7.91262C12.9295 5.91262 7.70391 2.30498 5.09619 4.91262C2.48848 7.5203 5.09619 9.9126 7.09619 10.4126C9.59619 11.0376 11.2962 12.7128 12.0962 13.9128" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M12 25L13 34.5" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}"/><path d="M36 25L35 34.5" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}"/></svg>`
	});
</script>