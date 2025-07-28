<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《命令键》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.45455 14.9091C10.5023 14.9091 12.3205 14.9091 14.9091 14.9091C14.9091 12.2333 14.9091 10.4151 14.9091 9.45455C14.9091 6.44208 12.467 4 9.45455 4C6.44208 4 4 6.44208 4 9.45455C4 12.467 6.44208 14.9091 9.45455 14.9091Z" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M9.45455 33.0909H14.9091V38.5454C14.9091 41.5579 12.467 44 9.45455 44C6.44208 44 4 41.5579 4 38.5454C4 35.533 6.44208 33.0909 9.45455 33.0909Z" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linejoin="${props.strokeLinejoin}"/><rect x="14.9092" y="14.9091" width="18.1818" height="18.1818" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M38.5454 14.9091H33.0908V9.45455C33.0908 6.44208 35.5329 4 38.5454 4C41.5578 4 43.9999 6.44208 43.9999 9.45455C43.9999 12.467 41.5578 14.9091 38.5454 14.9091Z" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M38.5454 33.0909C41.5578 33.0909 43.9999 35.533 43.9999 38.5454C43.9999 41.5579 41.5578 44 38.5454 44C35.5329 44 33.0908 41.5579 33.0908 38.5454V33.0909H38.5454Z" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linejoin="${props.strokeLinejoin}"/></svg>`
	});
</script>