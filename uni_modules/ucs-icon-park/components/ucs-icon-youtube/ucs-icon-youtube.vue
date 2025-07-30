<template>
	<ucs-svg :width="getOsFontSize(size)" :height="getOsFontSize(size)" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《优兔》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.0637 10.4144C16.6069 10.1381 20.9183 10 23.998 10C27.0781 10 31.3911 10.1382 36.937 10.4145V10.4145C39.9391 10.5641 42.3672 12.9119 42.6176 15.9072C42.8712 18.9412 42.998 21.6134 42.998 23.9238C42.998 26.2626 42.8681 28.972 42.6082 32.0522H42.6082C42.3586 35.0103 39.9833 37.3412 37.021 37.5349C32.2796 37.845 27.9386 38 23.998 38C20.058 38 15.7186 37.845 10.9798 37.5351V37.5351C8.01852 37.3414 5.6437 35.0119 5.39288 32.055C5.12966 28.9518 4.99805 26.2414 4.99805 23.9238C4.99805 21.6341 5.12651 18.961 5.38345 15.9044L5.38346 15.9044C5.63514 12.9103 8.06274 10.564 11.0637 10.4144Z" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M21 19.6092V28.406C21 28.8794 21.3838 29.2631 21.8571 29.2631C22.0252 29.2631 22.1896 29.2137 22.3298 29.1211L28.9274 24.7605C29.3223 24.4995 29.4308 23.9677 29.1698 23.5728C29.1074 23.4784 29.0269 23.3973 28.933 23.3341L22.3354 18.8979C21.9426 18.6337 21.41 18.7381 21.1458 19.1309C21.0508 19.2723 21 19.4388 21 19.6092Z" fill="${colors(props.theme, props.fill, 3)}" stroke="${colors(props.theme, props.fill, 2)}" stroke-width="${props.strokeWidth}" stroke-linejoin="${props.strokeLinejoin}"/></svg>`
	});
</script>