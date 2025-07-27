<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《计算机》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 6C10 4.89543 10.8954 4 12 4H36C37.1046 4 38 4.89543 38 6V42C38 43.1046 37.1046 44 36 44H12C10.8954 44 10 43.1046 10 42L10 6Z" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}"/><path d="M17 12L31 12" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><circle cx="17" cy="21" r="2" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="17" cy="27" r="2" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="17" cy="33" r="2" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="24" cy="21" r="2" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="24" cy="27" r="2" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="24" cy="33" r="2" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="31" cy="21" r="2" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="31" cy="27" r="2" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="31" cy="33" r="2" fill="${colors(props.theme, props.fill, 0)}"/></svg>`
	});
</script>