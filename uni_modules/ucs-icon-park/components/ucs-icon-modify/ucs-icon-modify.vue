<template>
	<ucs-svg :width="getOsFontSize(size)" :height="getOsFontSize(size)" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《修改》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20.0708 9.58588L15.8282 5.34324C15.0472 4.56219 13.7808 4.56219 12.9998 5.34324L7.34292 11.0001C6.56188 11.7811 6.56188 13.0475 7.34292 13.8285L11.5856 18.0712" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M28.9287 37.4143L33.1714 41.6569C33.9524 42.438 35.2187 42.438 35.9998 41.6569L41.6566 36.0001C42.4377 35.219 42.4377 33.9527 41.6566 33.1717L37.414 28.929" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><rect x="34.6064" y="4.9082" width="12" height="42" rx="2" transform="rotate(45 34.6064 4.9082)" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><circle cx="24" cy="24" r="2" fill="${colors(props.theme, props.fill, 2)}"/><circle cx="20" cy="28" r="2" fill="${colors(props.theme, props.fill, 2)}"/><circle cx="28" cy="20" r="2" fill="${colors(props.theme, props.fill, 2)}"/></svg>`
	});
</script>