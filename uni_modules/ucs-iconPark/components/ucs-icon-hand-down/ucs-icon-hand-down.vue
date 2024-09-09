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
	 * @description 《向下指》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.05322 10.0005L29.0532 10.0005V4.00049L7.05322 4.00049V10.0005Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linejoin="${this.strokeLinejoin}"/><path fill-rule="evenodd" clip-rule="evenodd" d="M29.0531 10.0005C35.5721 17.1234 39.3127 21.2513 40.2749 22.3843C41.7183 24.0837 41.1122 26.0045 37.5001 26.0045C33.8879 26.0045 31.8047 20.7191 29.0531 20.7191C29.0367 20.7157 29.0356 27.4748 29.0498 40.9964C29.0515 42.6538 27.7094 43.9987 26.0521 44.0005L26.0489 44.0005C24.3898 44.0005 23.0447 42.6555 23.0447 40.9963V32.9869C15.072 31.7781 10.7374 31.1111 10.0411 30.9861C8.99656 30.7986 7.05308 29.8015 7.05308 26.9325C7.05308 25.0198 7.05308 20.0424 7.05308 10.0005L29.0531 10.0005Z" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>