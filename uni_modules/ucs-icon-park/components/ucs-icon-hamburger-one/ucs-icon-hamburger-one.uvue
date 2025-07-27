<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《汉堡》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M40 22V21C40 12.1634 32.8366 5 24 5C15.1634 5 8 12.1634 8 21V22" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M8 34C8 34 6 39 10 41C14 43 34 43 38 41C42 39 40 34 40 34" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><rect x="5" y="21" width="38" height="14" rx="7" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M11 29L12.5917 28.2042C14.1235 27.4382 15.9098 27.3639 17.5 28L17.9239 28.1695C19.2444 28.6978 20.7279 28.6361 22 28V28C23.2721 27.3639 24.7556 27.3022 26.0761 27.8305L27.0353 28.2141C28.285 28.714 29.6888 28.6556 30.8927 28.0537V28.0537C32.2193 27.3904 33.7807 27.3904 35.1073 28.0537L37 29" stroke="${colors(props.theme, props.fill, 2)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><circle cx="17" cy="15.0498" r="2.5" fill="${colors(props.theme, props.fill, 0)}"/><circle cx="23.75" cy="12.2998" r="2.5" fill="${colors(props.theme, props.fill, 0)}"/></svg>`
	});
</script>