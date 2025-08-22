<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《摇滚手势》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 25C24 25 24 8.5 24 7.5C24 6.21875 24.5 4 27 4C29.5 4 30 6.21875 30 7.5C30 8 30 30 30 30C30 30 35.7031 24.2969 37 23C38.2969 21.7031 40.0781 21.0781 41.5 22.5C42.9219 23.9219 43.0938 25.4063 41.5 27C39.9063 28.5937 35 33.5 35 33.5C35 33.5 29.0938 44 26 44C22.9063 44 13 44 13 44C13 44 10 44 8.00002 42C6.00002 40 6.00002 37.5 6.00002 37.5C6.00002 37.5 5.99998 13.5 6.00002 12.7812C6.00005 12.0625 6.50002 10 9.00002 10C11.5 10 12 12 12 12.7812C12 13.5 12 25 12 25" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><rect x="12" y="19" width="6" height="12" rx="3" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linejoin="${props.strokeLinejoin}"/><rect x="18" y="19" width="6" height="12" rx="3" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linejoin="${props.strokeLinejoin}"/></svg>`
	});
</script>