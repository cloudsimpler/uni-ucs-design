<template>
	<ucs-svg :width="getOsFontSize(size)" :height="getOsFontSize(size)" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《手掌》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18.3332 35.8132L8.61924 24.9336C7.18736 23.3298 7.36957 20.8587 9.02119 19.4823C10.6566 18.1195 13.0924 18.3655 14.4223 20.0279L16 22V8.99391C16 7.33944 17.3394 5.99728 18.9939 5.99391C20.6531 5.99054 22 7.33467 22 8.99391V7C22 5.34315 23.3431 4 25 4C26.6569 4 28 5.34315 28 7V8.82927C28 7.17241 29.3431 5.82927 31 5.82927C32.6569 5.82927 34 7.17241 34 8.82927V12.1463C34 10.4895 35.3431 9.14634 37 9.14634C38.6569 9.14634 40 10.4895 40 12.1463V25.8278C40 27.9688 39.3219 30.0547 38.0631 31.7864L35.23 35.6836C35.0855 35.8824 34.8546 36 34.6089 36H18.7504C18.5911 36 18.4393 35.9321 18.3332 35.8132Z" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><rect x="19" y="36" width="16" height="8" rx="1" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/></svg>`
	});
</script>