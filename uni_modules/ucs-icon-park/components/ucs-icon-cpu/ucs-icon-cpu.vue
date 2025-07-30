<template>
	<ucs-svg :width="getOsFontSize(size)" :height="getOsFontSize(size)" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《芯片》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M38 8H10C8.89543 8 8 8.89543 8 10V38C8 39.1046 8.89543 40 10 40H38C39.1046 40 40 39.1046 40 38V10C40 8.89543 39.1046 8 38 8Z" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M30 18H18V30H30V18Z" fill="${colors(props.theme, props.fill, 3)}" stroke="${colors(props.theme, props.fill, 2)}" stroke-width="${props.strokeWidth}" stroke-linejoin="${props.strokeLinejoin}"/><path fill-rule="evenodd" clip-rule="evenodd" d="M14.9092 2V8V2Z" fill="${colors(props.theme, props.fill, 1)}"/><path d="M14.9092 2V8" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path fill-rule="evenodd" clip-rule="evenodd" d="M14.9092 40V46V40Z" fill="${colors(props.theme, props.fill, 1)}"/><path d="M14.9092 40V46" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path fill-rule="evenodd" clip-rule="evenodd" d="M24 2V8V2Z" fill="${colors(props.theme, props.fill, 1)}"/><path d="M24 2V8" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path fill-rule="evenodd" clip-rule="evenodd" d="M24 40V46V40Z" fill="${colors(props.theme, props.fill, 1)}"/><path d="M24 40V46" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path fill-rule="evenodd" clip-rule="evenodd" d="M33.0908 2V8V2Z" fill="${colors(props.theme, props.fill, 1)}"/><path d="M33.0908 2V8" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path fill-rule="evenodd" clip-rule="evenodd" d="M33.0908 40V46V40Z" fill="${colors(props.theme, props.fill, 1)}"/><path d="M33.0908 40V46" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path fill-rule="evenodd" clip-rule="evenodd" d="M2 14.9092H8H2Z" fill="${colors(props.theme, props.fill, 1)}"/><path d="M2 14.9092H8" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path fill-rule="evenodd" clip-rule="evenodd" d="M40 14.9092H46H40Z" fill="${colors(props.theme, props.fill, 1)}"/><path d="M40 14.9092H46" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path fill-rule="evenodd" clip-rule="evenodd" d="M2 24H8H2Z" fill="${colors(props.theme, props.fill, 1)}"/><path d="M2 24H8" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path fill-rule="evenodd" clip-rule="evenodd" d="M40 24H46H40Z" fill="${colors(props.theme, props.fill, 1)}"/><path d="M40 24H46" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path fill-rule="evenodd" clip-rule="evenodd" d="M2 33.0908H8H2Z" fill="${colors(props.theme, props.fill, 1)}"/><path d="M2 33.0908H8" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path fill-rule="evenodd" clip-rule="evenodd" d="M40 33.0908H46H40Z" fill="${colors(props.theme, props.fill, 1)}"/><path d="M40 33.0908H46" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/></svg>`
	});
</script>