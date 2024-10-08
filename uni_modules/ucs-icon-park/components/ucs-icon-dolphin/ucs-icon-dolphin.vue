<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script lang="uts">
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《海豚》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24.0002 7.00002C14.2305 1.61313 9.68601 8.63202 8.00016 11.0004C2.33569 12.2184 5.14579 14.3237 7.00023 15.0004C8.21404 15.4064 11.1458 16.3233 13.0002 16.9999C13.4048 20.248 14.6631 23.1541 15.0002 23.9999C15.0002 23.1879 16.3259 20.3533 17.0002 18.9999C25.0923 22.248 30.7971 30.6015 34.0002 34.9999C32.7864 37.436 31.506 41.3082 31.0002 42.9999L37.0002 40L44.0002 42C44.0002 38.7519 39.8547 35.3534 38.0002 34C38.8095 21.0076 32.7091 13.1993 29.0002 11C29.4048 9.37598 30.1573 6.67671 31.0002 6.00002C27.7634 4.37598 25.1803 6.15418 24.0002 7.00002Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><circle cx="16" cy="11" r="2" fill="${this.colors(2)}"/></svg>`
			}
		}
	}
</script>