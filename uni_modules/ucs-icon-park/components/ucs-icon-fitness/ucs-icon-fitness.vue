<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script lang="uts">
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《健身》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M43 25.9999C40.5466 24.992 36 21 28 26.9997C25.8971 25.8237 22 23 16 27.9997C15.299 25.1441 15.1588 18.6438 16 12.9997C16.3505 12.1598 17.7943 11.5652 22 15.9998L27 10.9999C26.6495 8.81612 24 6 16 6C13 6 10.2617 8.56527 9 12.9998C7.42284 17.5353 5 27.9998 5 33.9998C4.99999 35.8476 7.5 39.9999 17 39.9999C19 39.9999 24.8502 40.225 32 36.9998L38 41.9997" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>