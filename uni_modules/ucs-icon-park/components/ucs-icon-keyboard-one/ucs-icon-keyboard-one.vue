<template>
	<ucs-svg :width="getOsFontSize(size)" :height="getOsFontSize(size)" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《键盘》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="18" width="40" height="${props.size}" rx="2" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linejoin="${props.strokeLinejoin}"/><circle cx="14" cy="24" r="2" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="16" cy="30" r="2" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="10" cy="30" r="2" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="20" cy="24" r="2" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="22" cy="30" r="2" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="26" cy="24" r="2" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="28" cy="30" r="2" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="32" cy="24" r="2" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="34" cy="30" r="2" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="38" cy="24" r="2" fill="${colors(props.theme, props.fill, 0)}"/><path d="M17 36H31" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M33 18V13.125C33 12.5727 33.4477 12.125 34 12.125H39C39.5523 12.125 40 11.6773 40 11.125V6" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/></svg>`
	});
</script>