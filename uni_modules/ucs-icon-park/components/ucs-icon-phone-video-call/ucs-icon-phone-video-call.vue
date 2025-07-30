<template>
	<ucs-svg :width="getOsFontSize(size)" :height="getOsFontSize(size)" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《视频电话》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.3756 9.7941C15.1022 9.7941 15.7716 10.1881 16.1242 10.8234L18.5706 15.2302C18.891 15.8072 18.906 16.5051 18.6109 17.0954L16.254 21.809C16.254 21.809 16.937 25.3204 19.7955 28.1789C22.6539 31.0373 26.1535 31.7085 26.1535 31.7085L30.8665 29.3521C31.4572 29.0567 32.1555 29.072 32.7327 29.3929L37.1521 31.8499C37.7867 32.2027 38.1802 32.8718 38.1802 33.5979L38.1802 38.6714C38.1802 41.2551 35.7803 43.1211 33.3323 42.2951C28.3043 40.5986 20.4997 37.3684 15.5528 32.4215C10.606 27.4747 7.37576 19.67 5.67922 14.6421C4.8532 12.194 6.71929 9.7941 9.30293 9.7941L14.3756 9.7941Z" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M39 15H27V5H39V8L44 6V14L39 12V15Z" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/></svg>`
	});
</script>