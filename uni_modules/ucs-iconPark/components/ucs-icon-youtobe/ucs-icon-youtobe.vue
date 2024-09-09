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
	 * @description 《油管》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M44 32.7679V15.2321C44 13.9073 43.1298 12.7428 41.8448 12.4204C38.3687 11.5484 31.1843 10 24 10C16.8157 10 9.63134 11.5484 6.15517 12.4204C4.87016 12.7428 4 13.9073 4 15.2321V32.7679C4 34.0927 4.87016 35.2572 6.15517 35.5796C9.63133 36.4516 16.8157 38 24 38C31.1843 38 38.3687 36.4516 41.8448 35.5796C43.1298 35.2572 44 34.0927 44 32.7679Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}"/><path d="M22.5735 29.8986C21.9107 30.3625 21 29.8884 21 29.0793V18.9207C21 18.1116 21.9107 17.6375 22.5735 18.1014L29.8297 23.1808C30.3984 23.5789 30.3984 24.4211 29.8297 24.8192L22.5735 29.8986Z" fill="${this.colors(3)}" stroke="${this.colors(2)}" stroke-width="${this.strokeWidth}" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>