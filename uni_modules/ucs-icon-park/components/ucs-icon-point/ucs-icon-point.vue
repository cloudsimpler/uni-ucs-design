<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script lang="uts">
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《指向》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 41C13.5 38.25 8.00129 30 5.00063 25C1.99996 20 8.3132 15.3125 12.0004 19C15.6876 22.6875 16.0004 23 16.0004 23V7.50001C16.0004 5.56701 17.5674 4 19.5004 4C21.4334 4 23.0004 5.56701 23.0004 7.50001V16C23.0004 14.067 24.5674 12.5 26.5004 12.5C28.4334 12.5 30.0004 14.067 30.0004 16V17.5C30.0004 15.567 31.5674 14 33.5004 14C35.4334 14 37.0004 15.5655 37.0004 17.4985V22.5002C37.0004 20.5672 38.5674 19 40.5004 19C42.4334 19 44.0004 20.567 44.0004 22.5V31.2439C44.0004 32.3988 43.7376 33.5441 43.0869 34.4982C41.9179 36.2122 39.6023 39.0351 36 41C30.4999 44 24.5 43.75 19 41Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>