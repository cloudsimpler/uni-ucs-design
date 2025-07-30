<template>
	<ucs-svg :width="getOsFontSize(size)" :height="getOsFontSize(size)" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《出租车》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 35V27.7097C4 25.4363 5.28486 23.3581 7.3186 22.3422L8.00053 22.0015L10.3105 14.0919C10.7326 12.2812 12.3467 11 14.206 11H33.8943C35.7675 11 37.3899 12.3 37.7981 14.1282L40.0031 22.0015L40.6834 22.3416C42.716 23.358 44 25.4355 44 27.7081V35C44 36.6569 42.6569 38 41 38H39.0031V39C39.0031 41.2091 37.2123 43 35.0031 43C32.7909 43 31 41.2091 31 39V38H17V39.0003C17 41.2093 15.2093 43 13.0003 43C10.7913 43 9.00053 41.2093 9.00053 39.0003V38H7C5.34315 38 4 36.6569 4 35Z" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M13.5 33C14.8807 33 16 31.8807 16 30.5C16 29.1193 14.8807 28 13.5 28C12.1193 28 11 29.1193 11 30.5C11 31.8807 12.1193 33 13.5 33Z" fill="${colors(props.theme, props.fill, 2)}"/><path d="M34.5 33C35.8807 33 37 31.8807 37 30.5C37 29.1193 35.8807 28 34.5 28C33.1193 28 32 29.1193 32 30.5C32 31.8807 33.1193 33 34.5 33Z" fill="${colors(props.theme, props.fill, 2)}"/><path fill-rule="evenodd" clip-rule="evenodd" d="M18 11H30L29.0088 6.04409C28.8868 5.43404 28.3998 5 27.8374 5H20.1626C19.6002 5 19.1132 5.43404 18.9912 6.04409L18 11Z" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M15 23H33" stroke="${colors(props.theme, props.fill, 2)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/></svg>`
	});
</script>