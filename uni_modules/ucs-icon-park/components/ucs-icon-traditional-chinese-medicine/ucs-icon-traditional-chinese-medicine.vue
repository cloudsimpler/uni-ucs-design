<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《中药》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M24 43C24.8653 43 26.8503 43 29.9551 43C30.0381 40.2631 30.4393 38.7582 31.1586 38.4852C38.6685 35.6357 44 28.434 44 20H4C4 28.2514 9.10319 35.3234 16.3568 38.2941C17.1151 38.6047 17.6815 40.1733 18.056 43C21.0857 43 23.067 43 24 43Z" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M14.4434 27.0225C14.803 28.2103 15.2786 29.191 15.8702 29.9646C16.4484 30.7209 17.1619 31.4223 18.0104 32.0688" stroke="${colors(props.theme, props.fill, 2)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}"/><path d="M25.2139 20.0264C28.9697 12.2748 31.177 7.70521 31.8358 6.31775C32.8851 4.10791 35.0156 3.57614 36.9808 4.41569C38.9459 5.25524 39.7411 7.65828 38.9162 9.33311C38.4068 10.3675 36.6766 13.9245 33.7258 20.004" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}"/></svg>`
	});
</script>