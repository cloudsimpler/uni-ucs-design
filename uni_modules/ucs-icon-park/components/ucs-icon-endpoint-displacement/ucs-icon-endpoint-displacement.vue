<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script lang="uts">
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《端点位移》图标
	 * @tutorial https://ucs.cloudsimpler.com/library/ucs-iconPark
	 * @property {Number} size 图标大小
	 * @property {Number} strokeWidth 线段粗细
	 * @property {String} theme 图标大小
	 * @property {Array} fill 图标颜色，["外部描边颜色","外部填充颜色","内部描边颜色","内部填充颜色"]
	 * @property {String} strokeLinecap 图标大小
	 * @property {String} strokeLinejoin 图标大小
	 */
	export default {
		mixins: [iconMixin],
		computed: {
			iconSvg(): string {
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 10C16 12.7614 13.7614 15 11 15C8.23858 15 6 12.7614 6 10C6 7.23858 8.23858 5 11 5C13.7614 5 16 7.23858 16 10Z" fill="${this.colors(1)}"/><path d="M16 10C16 12.7614 13.7614 15 11 15C8.23858 15 6 12.7614 6 10C6 7.23858 8.23858 5 11 5C13.7614 5 16 7.23858 16 10ZM16 10H27M27 10L23 6M27 10L23 14" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M32 38C32 40.7614 34.2386 43 37 43C39.7614 43 42 40.7614 42 38C42 35.2386 39.7614 33 37 33C34.2386 33 32 35.2386 32 38Z" fill="${this.colors(1)}"/><path d="M32 38C32 40.7614 34.2386 43 37 43C39.7614 43 42 40.7614 42 38C42 35.2386 39.7614 33 37 33C34.2386 33 32 35.2386 32 38ZM32 38H21M21 38L25 34M21 38L25 42" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M33 11C33 13.7614 35.2386 16 38 16C40.7614 16 43 13.7614 43 11C43 8.23858 40.7614 6 38 6C35.2386 6 33 8.23858 33 11Z" fill="${this.colors(1)}"/><path d="M38 16C35.2386 16 33 13.7614 33 11C33 8.23858 35.2386 6 38 6C40.7614 6 43 8.23858 43 11C43 13.7614 40.7614 16 38 16ZM38 16V27M38 27L42 23M38 27L34 23" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M5 37C5 34.2386 7.23858 32 10 32C12.7614 32 15 34.2386 15 37C15 39.7614 12.7614 42 10 42C7.23858 42 5 39.7614 5 37Z" fill="${this.colors(1)}"/><path d="M10 32C7.23858 32 5 34.2386 5 37C5 39.7614 7.23858 42 10 42C12.7614 42 15 39.7614 15 37C15 34.2386 12.7614 32 10 32ZM10 32V21M10 21L14 25M10 21L6 25" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>