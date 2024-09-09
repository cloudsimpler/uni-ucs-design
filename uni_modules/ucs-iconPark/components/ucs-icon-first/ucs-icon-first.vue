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
	 * @description 《第一》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24.6795 20.0369C23.5651 19.7383 20.2653 18.6795 15.1701 22.0923C12.139 24.1225 10.8642 27.2398 10.4343 29.5299C10.2299 30.6186 11.1544 31.4966 12.2543 31.3663C13.0503 31.2719 13.9337 31.1249 14.6021 30.8988C16.5725 30.2323 16.3138 28.9685 17.319 27.4461C18.3242 25.9236 20.8518 25.4064 22.9314 26.5609C25.0111 27.7154 25.6776 29.6857 25.2297 31.3575C24.7818 33.0292 23.7766 34.5516 21.249 35.0688C18.7214 35.5861 17.9055 34.173 15.2687 32.8692C13.8946 32.1897 12.1023 33.0708 11.0197 33.7677C10.4067 34.1622 10.1527 34.9075 10.41 35.5895C10.5847 36.0527 10.8251 36.5946 11.1386 37.1378C11.9545 38.5509 15.5165 43.0888 20.1238 43.7261C24.731 44.3633 29.5276 42.0651 32.2445 38.6123C34.9614 35.1596 35.0414 30.403 33.1511 26.313" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M33.0455 26.4197L28.2769 4.15576C28.1699 3.65645 27.701 3.31051 27.2073 3.44095C26.0457 3.74787 24.5712 4.51818 24.5018 6.31019C24.4124 8.61605 24.8663 26.3489 25.4729 29.567" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>