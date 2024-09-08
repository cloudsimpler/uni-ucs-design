<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script>
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《高铁》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 20V30C9 34.4183 12.5817 38 17 38H31C35.4183 38 39 34.4183 39 30V20" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M34 38V42" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M14 38V42" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M20 44L28 44" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M9 16.3609C9 13 15 4 24 4C33 4 39 13 39 16.3609C39 19.7218 39 20 39 20H9C9 20 9 19.7218 9 16.3609Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M20.5 32C20.5 32.8284 19.8284 33.5 19 33.5C18.1716 33.5 17.5 32.8284 17.5 32C17.5 31.1716 18.1716 30.5 19 30.5C19.8284 30.5 20.5 31.1716 20.5 32Z" fill="${this.colors(0)}" stroke="${this.colors(0)}"/><path d="M30.5 32C30.5 32.8284 29.8284 33.5 29 33.5C28.1716 33.5 27.5 32.8284 27.5 32C27.5 31.1716 28.1716 30.5 29 30.5C29.8284 30.5 30.5 31.1716 30.5 32Z" fill="${this.colors(0)}" stroke="${this.colors(0)}"/><path d="M22 11L26 11" stroke="${this.colors(2)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>