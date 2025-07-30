<template>
	<ucs-svg :width="getOsFontSize(size)" :height="getOsFontSize(size)" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《电阻器》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.85757 31.071C9.07652 30.2899 9.07652 29.0236 9.85757 28.2425L12.8073 25.2928C13.1824 24.9177 13.6911 24.707 14.2215 24.707L16.8073 24.707C17.3378 24.707 17.8465 24.4963 18.2216 24.1212L24.121 18.2217C24.4961 17.8467 24.7068 17.3379 24.7068 16.8075L24.7068 14.2217C24.7068 13.6913 24.9175 13.1826 25.2926 12.8075L28.2423 9.85775C29.0234 9.0767 30.2897 9.0767 31.0708 9.85775L38.1418 16.9288C38.9229 17.7099 38.9229 18.9762 38.1418 19.7572L35.1921 22.707C34.817 23.0821 34.3083 23.2928 33.7779 23.2928L31.1921 23.2928C30.6617 23.2928 30.153 23.5035 29.7779 23.8786L23.8784 29.7781C23.5033 30.1532 23.2926 30.6619 23.2926 31.1923L23.2926 33.7781C23.2926 34.3085 23.0819 34.8172 22.7068 35.1923L19.7571 38.142C18.976 38.9231 17.7097 38.9231 16.9286 38.142L9.85757 31.071Z" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M7.0293 40.9702L13.3933 34.6063" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M34.6074 13.3931L40.9714 7.02911" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/></svg>`
	});
</script>