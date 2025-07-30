<template>
	<ucs-svg :width="getOsFontSize(size)" :height="getOsFontSize(size)" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《微博》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.5618 16.4109C9.21763 19.6608 2.16324 29.146 7.36253 35.9317C12.5618 42.7174 27.2821 40.0998 33.359 35.3193C39.4358 30.5388 38.836 27.5848 37.5184 26.2833C36.2009 24.9818 32.3556 26.297 31.2793 24.526C30.203 22.7551 33.1957 18.3311 30.6452 16.9312C28.0948 15.5313 23.6907 20.5811 21.7015 19.269C19.7122 17.9568 23.8906 13.6729 21.7015 12.4384C19.5123 11.204 15.906 13.161 12.5618 16.4109Z" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M43.3787 16.5159C43.1435 13.3848 41.799 10.5632 39.7372 8.44277C37.7247 6.37311 35.0287 4.9715 32.0137 4.60229" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}"/><path d="M37.2919 16.9313C37.1627 15.2916 36.4247 13.8139 35.2928 12.7034C34.188 11.6195 32.7079 10.8855 31.0527 10.6921" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}"/><path d="M25 30C25 32.2091 22.3137 34 19 34C15.6863 34 13 32.2091 13 30C13 27.7909 15.6863 26 19 26C22.3137 26 25 27.7909 25 30Z" fill="${colors(props.theme, props.fill, 2)}"/></svg>`
	});
</script>