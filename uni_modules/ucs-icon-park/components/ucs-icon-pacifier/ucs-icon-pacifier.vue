<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《奶嘴》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#icon-65228ea1fbb20b73)"><path d="M30.6561 21.5855L34.7593 17.4823C36.761 18.0169 38.9853 17.499 40.5556 15.9286C42.8988 13.5855 42.8988 9.78647 40.5556 7.44332C38.2125 5.10018 34.4135 5.10018 32.0703 7.44332C30.5 9.0137 29.9821 11.238 30.5166 13.2397L26.4135 17.3428" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M41.263 32.1922L15.8071 6.73633L11.918 10.6254L19.6962 21.9391L16.8678 26.1818L21.464 30.778L25.7066 27.9495L37.3739 36.0813L41.263 32.1922Z" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M19.3197 21.8847C15.9285 20.8969 12.117 21.74 9.44302 24.4139C5.53778 28.3192 5.53778 34.6508 9.44302 38.556C13.3483 42.4613 19.6799 42.4613 23.5852 38.556C26.2591 35.8821 27.1022 32.0706 26.1144 28.6793" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/></g><defs><clipPath id="icon-65228ea1fbb20b73"><rect width="48" height="48" fill="${colors(props.theme, props.fill, 2)}"/></clipPath></defs></svg>`
	});
</script>