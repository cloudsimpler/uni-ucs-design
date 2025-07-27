<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《电话拨入》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.3755 9.79423C14.1021 9.79423 14.7715 10.1883 15.1241 10.8235L17.5706 15.2303C17.8909 15.8073 17.9059 16.5052 17.6108 17.0955L15.254 21.8092C15.254 21.8092 15.937 25.3206 18.7954 28.179C21.6538 31.0374 25.1535 31.7086 25.1535 31.7086L29.8664 29.3522C30.4571 29.0568 31.1555 29.0721 31.7327 29.393L36.152 31.85C36.7866 32.2029 37.1802 32.8719 37.1802 33.598L37.1802 38.6715C37.1802 41.2552 34.7803 43.1213 32.3322 42.2952C27.3043 40.5987 19.4996 37.3685 14.5528 32.4216C9.60592 27.4748 6.3757 19.6701 4.67916 14.6422C3.85314 12.1941 5.71923 9.79423 8.30287 9.79423L13.3755 9.79423Z" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M34.2402 6L26.2402 14L34.2402 22" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M42.2402 14.0083H26.2402" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/></svg>`
	});
</script>