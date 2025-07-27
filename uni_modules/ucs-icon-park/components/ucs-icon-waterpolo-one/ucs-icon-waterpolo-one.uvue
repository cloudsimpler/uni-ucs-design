<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《水球1》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 35L6.5 36.3514C8.1 37.2162 9.9 37.2162 11.5 36.3514C13.1 35.4865 14.9 35.4865 16.5 36.3514C18.1 37.2162 19.9 37.2162 21.5 36.3514C23.1 35.4865 24.9 35.4865 26.5 36.3514C28.1 37.2162 29.9 37.2162 31.5 36.3514C33.1 35.4865 34.9 35.4865 36.5 36.3514C38.1 37.2162 39.9 37.2162 41.5 36.3514L44 35" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-miterlimit="2" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M4 41L6.5 42.3514C8.1 43.2162 9.9 43.2162 11.5 42.3514C13.1 41.4865 14.9 41.4865 16.5 42.3514C18.1 43.2162 19.9 43.2162 21.5 42.3514C23.1 41.4865 24.9 41.4865 26.5 42.3514C28.1 43.2162 29.9 43.2162 31.5 42.3514C33.1 41.4865 34.9 41.4865 36.5 42.3514C38.1 43.2162 39.9 43.2162 41.5 42.3514L44 41" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-miterlimit="2" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M25 18C27.7614 18 30 15.7614 30 13C30 10.2386 27.7614 8 25 8C22.2386 8 20 10.2386 20 13C20 15.7614 22.2386 18 25 18Z" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-miterlimit="2"/><path d="M25 29L24 25" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-miterlimit="2" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M4 11L11 22L24 24.93H42" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-miterlimit="2" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M11 10C12.6569 10 14 8.65685 14 7C14 5.34315 12.6569 4 11 4C9.34315 4 8 5.34315 8 7C8 8.65685 9.34315 10 11 10Z" fill="${colors(props.theme, props.fill, 0)}"/></svg>`
	});
</script>