<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script lang="uts">
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《排球》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M31.81 42.4054C41.9782 38.0865 46.7173 26.3494 42.4081 16.192C38.0989 6.0345 26.351 1.27569 16.1928 5.59461C6.03464 9.91353 1.2755 21.6506 5.59472 31.808C9.91394 41.9655 21.6518 46.7243 31.81 42.4054Z" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-miterlimit="2" stroke-linejoin="${this.strokeLinejoin}"/><path d="M15.9996 6C14.5059 13.0103 17.9367 20.1966 23.9996 24" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-miterlimit="2" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M12 40C18.97 37.74 23.74 31.32 24 24" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-miterlimit="2" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M44 25.0001C38.55 20.3276 29.5 20.4033 24 24.0001" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-miterlimit="2" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M17 16C17 16 28.56 7.50998 41 14" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-miterlimit="2" stroke-linejoin="${this.strokeLinejoin}"/><path d="M20 33C20 33 7.59 28.02 7 14" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-miterlimit="2" stroke-linejoin="${this.strokeLinejoin}"/><path d="M33.9998 22C33.9998 22 35.5597 36.5 23.7197 44.03" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-miterlimit="2" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>