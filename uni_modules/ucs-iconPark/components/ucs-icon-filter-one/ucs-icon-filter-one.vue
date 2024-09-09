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
	 * @description 《筛选1》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24.489 8.3975C24.2457 8.35865 24.2742 8 24.5205 8H39.5C39.7761 8 40 8.22386 40 8.5V23.4795C40 23.7258 39.6414 23.7543 39.6025 23.511L37.6355 11.1943C37.5673 10.7674 37.2326 10.4327 36.8057 10.3645L24.489 8.3975Z" fill="${this.colors(0)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/><path d="M6.489 26.3975C6.24574 26.3586 6.2742 26 6.52054 26H21.5C21.7761 26 22 26.2239 22 26.5V41.4795C22 41.7258 21.6414 41.7543 21.6025 41.511L19.6355 29.1943C19.5673 28.7674 19.2326 28.4327 18.8057 28.3645L6.489 26.3975Z" fill="${this.colors(0)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/><path d="M15.489 17.3975C15.2457 17.3586 15.2742 17 15.5205 17H30.5C30.7761 17 31 17.2239 31 17.5V32.4795C31 32.7258 30.6414 32.7543 30.6025 32.511L28.7498 20.9098C28.6134 20.0561 27.9439 19.3866 27.0902 19.2502L15.489 17.3975Z" fill="${this.colors(0)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/></svg>`
			}
		}
	}
</script>