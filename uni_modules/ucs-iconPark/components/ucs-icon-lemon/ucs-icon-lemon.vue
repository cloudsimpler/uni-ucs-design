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
	 * @description 《柠檬》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M36 26C36 19.5917 31.617 13.189 27 11.527L24 8L21 11.527C16.383 13.189 12 19.5917 12 26C12 32.4083 16.383 38.811 21 40.473C21.9537 40.8163 22.96 44 24 44C25.04 44 26.0463 40.8163 27 40.473C31.617 38.811 36 32.4083 36 26Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M35.1422 4.23223C36.1534 4.3613 36.7279 5.35639 36.3341 6.29667C35.8 7.57164 34.8288 9.25356 33.1962 10.1962C31.5635 11.1387 29.6213 11.1389 28.2502 10.9639C27.2389 10.8348 26.6644 9.83976 27.0582 8.89948C27.5923 7.62451 28.5635 5.94259 30.1962 5C31.8288 4.05741 33.771 4.05722 35.1422 4.23223Z" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}"/></svg>`
			}
		}
	}
</script>