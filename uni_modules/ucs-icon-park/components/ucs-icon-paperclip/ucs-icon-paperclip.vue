<template>
	<ucs-svg :width="getOsFontSize(size)" :height="getOsFontSize(size)" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《回形针》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M26.1219 37.4352C26.1219 37.4352 37.4356 26.1215 40.264 23.293C43.0924 20.4646 44.5066 13.3935 39.5569 8.4438C34.6071 3.49405 27.5361 4.90826 24.7076 7.73669C21.8792 10.5651 7.02998 25.4144 5.61576 26.8286C4.20155 28.2428 2.08023 33.1925 6.32287 37.4352C10.5655 41.6778 15.5153 39.5565 16.9295 38.1423C18.3437 36.7281 33.9 21.1717 35.3142 19.7575C36.7285 18.3433 37.4356 14.8078 35.3142 12.6864C33.1929 10.5651 29.6574 11.2722 28.2432 12.6864C26.829 14.1007 14.8082 26.1215 14.8082 26.1215" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/></svg>`
	});
</script>