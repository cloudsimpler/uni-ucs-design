<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script lang="uts">
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《辅助座椅》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M32 15H16C16 18.47 10.2205 22.9032 6.68333 25.2915C5.12368 26.3445 4 27 4 27C4 27 5 30 7.5 35C9.39377 38.7875 11.5745 40.8536 12.5207 41.6329C12.8255 41.8839 13.2107 42 13.6055 42H35.2984C35.7526 42 36.1923 41.8455 36.5149 41.5258C37.3745 40.6737 39.1873 38.6255 41 35C43.5 30 44 27 44 27C44 27 42.7219 26.361 41 25.2915C37.4456 23.0838 32 19.0419 32 15Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M32 15L34 6L42 6.00001" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M16 15L14 6L6 6.00001" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M4 27C4 27 6 31 12 31C18 31 31 31 36 31C41 31 44 27 44 27" stroke="${this.colors(2)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M7.5 35.0001C5 30.0001 4 27.0001 4 27.0001C4 27.0001 5.12368 26.3446 6.68333 25.2915" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M41 35.0001C43.5 30.0001 44 27.0001 44 27.0001C44 27.0001 42.7219 26.361 41 25.2915" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>