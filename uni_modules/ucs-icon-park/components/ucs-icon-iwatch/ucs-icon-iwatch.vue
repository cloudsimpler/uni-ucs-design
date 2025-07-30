<template>
	<ucs-svg :width="getOsFontSize(size)" :height="getOsFontSize(size)" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《智能手表》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M36 12.0002H10V36.0002H36V12.0002Z" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M27 24.0002C27 21.7911 25.2091 20.0002 23 20.0002C20.7909 20.0002 19 21.7911 19 24.0002C19 26.2094 20.7909 28.0002 23 28.0002C25.2091 28.0002 27 26.2094 27 24.0002Z" fill="${colors(props.theme, props.fill, 3)}" stroke="${colors(props.theme, props.fill, 2)}" stroke-width="${props.strokeWidth}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M15 12.0002C15 11.9273 15.0083 11.8545 15.0246 11.7833L16.6321 4.78331C16.7372 4.32578 17.1565 4.00024 17.6409 4.00024H28.3837C28.8681 4.00024 29.2874 4.32578 29.3925 4.78331L31 11.7833" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}"/><path d="M15 36.0002C15 36.0732 15.0083 36.1459 15.0246 36.2172L16.6321 43.2172C16.7372 43.6747 17.1565 44.0002 17.6409 44.0002H28.3837C28.8681 44.0002 29.2874 43.6747 29.3925 43.2172L31 36.2172" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}"/><path d="M39 16.0002V20.0002" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}"/></svg>`
	});
</script>