<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《蝙蝠》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21.6188 8.98551L22.095 11.4493H25.905L26.3812 8.98551C26.8574 10.628 27.8097 14.2087 27.8097 15.3913C29.5558 15.2271 32.9526 14.0116 32.5716 10.4638C32.5716 9.97101 32.1905 8.78841 30.6667 8C34.9524 8.98551 43.619 13.7159 44 24.7536C41.1429 22.9469 35.2381 21.6 34.4762 30.6667C32.7303 27.7101 28.6671 23.3739 26.3812 29.6812C25.5875 32.4734 23.9998 38.8464 23.9998 42C23.9998 38.8464 22.4125 32.4734 21.6188 29.6812C19.3329 23.3739 15.2697 27.7101 13.5238 30.6667C12.7619 21.6 6.85714 22.9469 4 24.7536C4.38095 13.7159 13.0476 8.98551 17.3333 8C15.8095 8.78841 15.4284 9.97101 15.4284 10.4638C15.0474 14.0116 18.4442 15.2271 20.1903 15.3913C20.1903 14.2087 21.1426 10.628 21.6188 8.98551Z" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/></svg>`
	});
</script>