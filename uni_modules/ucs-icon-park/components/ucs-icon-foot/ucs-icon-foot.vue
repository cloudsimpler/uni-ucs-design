<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script lang="uts">
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《脚》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 8C20.7657 15.8788 21.7826 32.8365 13.3074 36.6184C12.8258 36.9335 11.1564 37.4693 7.68928 37.0911C5.68266 36.8722 3.40467 39.3542 6.56568 42.7639C7.34236 43.6016 9.06974 44.4657 13.3074 43.7093H21.0122C22.9384 43.7093 26.1166 41.3457 29.1985 35.6729C30.3221 34.0971 33.5324 30.8511 37.3848 30.4729C39.7926 30.3153 44.2228 28.3929 42.6819 21.9637C39.9259 15.5052 33.541 9.29458 32 4" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>