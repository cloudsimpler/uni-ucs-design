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
	 * @description 《电拨拨出》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M28 20L41 7.5" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M28 7H41V20" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M14.3755 9.79423C15.1021 9.79423 15.7715 10.1883 16.1241 10.8235L18.5706 15.2303C18.8909 15.8073 18.9059 16.5052 18.6108 17.0955L16.254 21.8092C16.254 21.8092 16.937 25.3206 19.7954 28.179C22.6538 31.0374 26.1535 31.7086 26.1535 31.7086L30.8664 29.3522C31.4571 29.0568 32.1555 29.0721 32.7327 29.393L37.152 31.85C37.7866 32.2029 38.1802 32.8719 38.1802 33.598L38.1802 38.6715C38.1802 41.2552 35.7803 43.1213 33.3322 42.2952C28.3043 40.5987 20.4996 37.3685 15.5528 32.4216C10.6059 27.4748 7.3757 19.6701 5.67916 14.6422C4.85314 12.1941 6.71923 9.79423 9.30287 9.79423L14.3755 9.79423Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>