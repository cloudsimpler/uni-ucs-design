<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script lang="uts">
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《应用效果》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 40.8331C26.123 42.7333 28.9266 43.8887 32 43.8887C38.6274 43.8887 44 38.5161 44 31.8887C44 26.5878 40.5629 22.0897 35.7957 20.5015" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M27.1711 27.4992C27.7058 28.8588 27.9995 30.3397 27.9995 31.8891C27.9995 38.5165 22.6269 43.8891 15.9995 43.8891C9.37209 43.8891 3.99951 38.5165 3.99951 31.8891C3.99951 26.5741 7.45492 22.0662 12.2418 20.4893" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M24 27.8892C30.6274 27.8892 36 22.5166 36 15.8892C36 9.26174 30.6274 3.88916 24 3.88916C17.3726 3.88916 12 9.26174 12 15.8892C12 22.5166 17.3726 27.8892 24 27.8892Z" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>