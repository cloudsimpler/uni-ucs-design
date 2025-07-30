<template>
	<ucs-svg :width="getOsFontSize(size)" :height="getOsFontSize(size)" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《收缩》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="6" width="36" height="36" rx="3" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}"/><path d="M17 30H12.4142C11.5233 30 11.0771 31.0771 11.7071 31.7071L16.2929 36.2929C16.9229 36.9229 18 36.4767 18 35.5858V31C18 30.4477 17.5523 30 17 30Z" fill="${colors(props.theme, props.fill, 2)}"/><path d="M30 31V35.5858C30 36.4767 31.0771 36.9229 31.7071 36.2929L36.2929 31.7071C36.9229 31.0771 36.4767 30 35.5858 30H31C30.4477 30 30 30.4477 30 31Z" fill="${colors(props.theme, props.fill, 2)}"/><path d="M31 18H35.5858C36.4767 18 36.9229 16.9229 36.2929 16.2929L31.7071 11.7071C31.0771 11.0771 30 11.5233 30 12.4142V17C30 17.5523 30.4477 18 31 18Z" fill="${colors(props.theme, props.fill, 2)}"/><path d="M18 17V12.4142C18 11.5233 16.9229 11.0771 16.2929 11.7071L11.7071 16.2929C11.0771 16.9229 11.5233 18 12.4142 18H17C17.5523 18 18 17.5523 18 17Z" fill="${colors(props.theme, props.fill, 2)}"/></svg>`
	});
</script>