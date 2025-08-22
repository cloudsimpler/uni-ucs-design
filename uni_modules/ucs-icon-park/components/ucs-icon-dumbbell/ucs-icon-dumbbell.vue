<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《健身》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 13.6C14 12.1641 12.6569 11 11 11C9.34315 11 8 12.1641 8 13.6V34.4C8 35.8359 9.34315 37 11 37C12.6569 37 14 35.8359 14 34.4V13.6Z" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M40 13.6C40 12.1641 38.6569 11 37 11C35.3431 11 34 12.1641 34 13.6V34.4C34 35.8359 35.3431 37 37 37C38.6569 37 40 35.8359 40 34.4V13.6Z" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M8 18.6667C8 17.1939 6.65685 16 5 16C3.34315 16 2 17.1939 2 18.6667V29.3333C2 30.8061 3.34315 32 5 32C6.65685 32 8 30.8061 8 29.3333V18.6667Z" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M46 18.6667C46 17.1939 44.6569 16 43 16C41.3431 16 40 17.1939 40 18.6667V29.3333C40 30.8061 41.3431 32 43 32C44.6569 32 46 30.8061 46 29.3333V18.6667Z" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linejoin="${props.strokeLinejoin}"/><rect width="20" height="6" transform="matrix(1 0 0 -1 14 27)" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linejoin="${props.strokeLinejoin}"/></svg>`
	});
</script>