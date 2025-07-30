<template>
	<ucs-svg :width="getOsFontSize(size)" :height="getOsFontSize(size)" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《智能门锁》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="4" width="26" height="40" rx="2" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><rect x="20" y="30" width="${props.size}" height="8" rx="4" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><circle cx="12" cy="12" r="2" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="12" cy="18" r="2" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="12" cy="24" r="2" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="19" cy="12" r="2" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="19" cy="18" r="2" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="19" cy="24" r="2" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="26" cy="12" r="2" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="26" cy="18" r="2" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="26" cy="24" r="2" fill="${colors(props.theme, props.fill, 0)}"/></svg>`
	});
</script>