<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《电话》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="38" height="38" rx="3" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}"/><rect x="11" y="12" width="8" height="${props.size}" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><rect x="25" y="12" width="12" height="6" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><circle cx="25" cy="24" r="2" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="25" cy="30" r="2" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="25" cy="36" r="2" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="31" cy="24" r="2" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="31" cy="30" r="2" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="31" cy="36" r="2" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="37" cy="24" r="2" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="37" cy="30" r="2" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="37" cy="36" r="2" fill="${colors(props.theme, props.fill, 0)}"/></svg>`
	});
</script>