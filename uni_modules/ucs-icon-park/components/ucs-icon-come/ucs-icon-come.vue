<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script lang="uts">
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《招引》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.0004 40C10.1277 35.5636 7.00049 26 4.00007 19.5C2.6504 16.5761 7.52621 15.8109 10.4998 17C13.0004 18 16.0001 20 16.0001 20V11.5C16.0001 9.567 17.5671 8 19.5001 8C21.4331 8 23.0001 9.567 23.0001 11.5V9.5C23.0001 7.567 24.5671 6 26.5001 6C28.4331 6 30.0001 7.567 30.0001 9.5V13.5C30.0001 11.567 31.5671 10 33.5001 10C35.4331 10 37.0001 11.567 37.0001 13.5V16.5C37.0001 14.567 38.5671 13 40.5001 13C42.4331 13 44.0001 14.5655 44.0001 16.4985V29C44.0001 32.5 42.0004 37 37.0001 40C32.2067 42.8758 25.0004 43 19.0004 40Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>