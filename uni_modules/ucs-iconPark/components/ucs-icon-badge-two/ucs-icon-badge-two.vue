<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script>
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《徽章》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 43.9999L24 39.9999L32 43.9999V24.9443C29.877 26.8445 27.0734 27.9999 24 27.9999C20.9266 27.9999 18.123 26.8445 16 24.9443V43.9999Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M36 16C36 19.554 34.455 22.7471 32 24.9444C29.877 26.8446 27.0734 28 24 28C20.9266 28 18.123 26.8446 16 24.9444C13.545 22.7471 12 19.554 12 16C12 9.37258 17.3726 4 24 4C30.6274 4 36 9.37258 36 16Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M24 21V11L22 12M24 21H26M24 21H22" stroke="${this.colors(2)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>