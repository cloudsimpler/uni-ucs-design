<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script lang="uts">
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《经期》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.99956 4C12.0022 7.33659 14.0034 10.6715 14.0034 14.0046C14.0034 19.0043 9.99956 21.2436 7.99956 24C5.99956 26.7564 5.00488 29.9311 5.00488 34.0033C5.00488 36.718 6.00311 40.0503 7.99956 44" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/><path d="M40.0034 4C36.0008 7.33659 33.9995 10.6715 33.9995 14.0046C33.9995 19.0043 38.0034 21.2436 40.0034 24C42.0034 26.7564 42.998 29.9311 42.998 34.0033C42.998 36.718 41.9998 40.0503 40.0034 44" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/><path d="M14.0039 29.1826C16.5255 28.941 18.6192 29.3014 20.2853 30.2639C22.7843 31.7076 23.9917 33.3597 24 34.9573C24.0056 36.0224 24.0056 39.0367 24 44.0001" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/><path d="M34.0039 29.1826C31.4824 28.941 29.3886 29.3014 27.7226 30.2639C25.2235 31.7076 24.0161 33.3597 24.0078 34.9573" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/></svg>`
			}
		}
	}
</script>