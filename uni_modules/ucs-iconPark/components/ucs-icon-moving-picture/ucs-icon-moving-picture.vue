<template>
	<ucs-iconPark :width="size" :height="size" :src="iconSvg" />
</template>
<script>
	// #ifdef UNI-APP-X
	import iconMixin from "../../mixins/iconMixin.uts";
	// #endif
	// #ifndef UNI-APP-X
	import iconMixin from "../../mixins/iconMixin.js";
	// #endif
	/**
	 * @description 《图片》图标
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
			// #ifdef UNI-APP-X
			iconSvg(): string {
			// #endif
			// #ifndef UNI-APP-X
			iconSvg() {
			// #endif
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="22" width="20" height="20" rx="3" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M30 6L42 6L42 18" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><circle cx="34" cy="42" r="1.5" fill="${this.colors(0)}" stroke="${this.colors(0)}"/><circle r="1.5" transform="matrix(1 0 0 -1 6 14)" fill="${this.colors(0)}" stroke="${this.colors(0)}"/><circle cx="42" cy="42" r="1.5" fill="${this.colors(0)}" stroke="${this.colors(0)}"/><circle r="1.5" transform="matrix(1 0 0 -1 6 6)" fill="${this.colors(0)}" stroke="${this.colors(0)}"/><circle cx="42" cy="34" r="1.5" fill="${this.colors(0)}" stroke="${this.colors(0)}"/><circle r="1.5" transform="matrix(1 0 0 -1 14 6)" fill="${this.colors(0)}" stroke="${this.colors(0)}"/><circle cx="42" cy="26" r="1.5" fill="${this.colors(0)}" stroke="${this.colors(0)}"/><circle r="1.5" transform="matrix(1 0 0 -1 22 6)" fill="${this.colors(0)}" stroke="${this.colors(0)}"/><path d="M6 34L12.1195 29.4103C13.2239 28.5821 14.7509 28.6143 15.8192 29.4885L25 37" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M42 6L30 18" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>