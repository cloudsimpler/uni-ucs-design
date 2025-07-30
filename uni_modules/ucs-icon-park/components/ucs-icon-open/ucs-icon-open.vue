<template>
	<ucs-svg :width="getOsFontSize(size)" :height="getOsFontSize(size)" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《打开》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M27.9467 16.8281L40.7568 7.73711C41.6731 7.08684 42.9535 7.40693 43.4559 8.4119C43.7856 9.07125 43.688 9.86396 43.2083 10.4237L41 13L35.7241 20.0345C35.2788 20.6283 35.1989 21.4199 35.5166 22.0907L42.6471 37.1438C43.2756 38.4707 42.3078 40 40.8396 40H32.6363C31.6844 40 30.8645 39.3291 30.676 38.3961L27.5197 22.7739L27.1139 18.6553C27.0435 17.9409 27.3613 17.2436 27.9467 16.8281Z" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M28 23L35 21" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M19.9359 17.1028L7.20861 8.19574C6.30625 7.56424 5.05387 7.87714 4.55456 8.85884C4.21946 9.51768 4.31813 10.314 4.8039 10.8711L7 13.3898L12.2323 20.0262C12.7026 20.6227 12.7943 21.4342 12.4692 22.1207L5.35292 37.1438C4.7244 38.4707 5.69217 40 7.1604 40H15.322C16.2925 40 17.1229 39.3033 17.2916 38.3476L20 23L20.7526 19.1224C20.903 18.347 20.5831 17.5557 19.9359 17.1028Z" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M13 21L20 23" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/></svg>`
	});
</script>