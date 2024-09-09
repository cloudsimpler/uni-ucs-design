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
	 * @description 《电话拨入》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.3755 9.79417C16.1021 9.79417 16.7715 10.1882 17.1241 10.8234L19.5706 15.2303C19.8909 15.8073 19.9059 16.5051 19.6108 17.0954L17.254 21.8091C17.254 21.8091 17.937 25.3205 20.7954 28.1789C23.6538 31.0374 27.1535 31.7086 27.1535 31.7086L31.8664 29.3521C32.4571 29.0568 33.1555 29.0721 33.7327 29.393L38.152 31.85C38.7866 32.2028 39.1802 32.8719 39.1802 33.598L39.1802 38.6715C39.1802 41.2551 36.7803 43.1212 34.3322 42.2952C29.3043 40.5986 21.4996 37.3684 16.5528 32.4216C11.6059 27.4747 8.3757 19.6701 6.67916 14.6421C5.85314 12.1941 7.71923 9.79417 10.3029 9.79417L15.3755 9.79417Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M29 19.9999L42 7.49994" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M42 19.9999H29V6.99994" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>