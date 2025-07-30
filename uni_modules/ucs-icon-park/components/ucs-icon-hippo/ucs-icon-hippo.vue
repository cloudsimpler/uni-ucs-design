<template>
	<ucs-svg :width="getOsFontSize(size)" :height="getOsFontSize(size)" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《河马》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="7" y="25" width="34" height="18" rx="6" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linejoin="${props.strokeLinejoin}"/><circle cx="17" cy="34" r="3" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}"/><circle cx="31" cy="34" r="3" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}"/><path d="M11 19C11 15.6863 13.6863 13 17 13H31C34.3137 13 37 15.6863 37 19V25H11V19Z" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linejoin="${props.strokeLinejoin}"/><circle cx="20" cy="19" r="2" fill="${colors(props.theme, props.fill, 2)}"/><circle cx="28" cy="19" r="2" fill="${colors(props.theme, props.fill, 2)}"/><path d="M18 5C19.6569 5 21 6.34315 21 8L21 13L15 13L15 8C15 6.34315 16.3431 5 18 5Z" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M30 5C31.6569 5 33 6.34315 33 8L33 13L27 13L27 8C27 6.34315 28.3431 5 30 5Z" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linejoin="${props.strokeLinejoin}"/></svg>`
	});
</script>