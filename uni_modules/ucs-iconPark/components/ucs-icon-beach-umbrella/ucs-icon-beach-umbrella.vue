<template>
	<ucs-iconPark :width="size" :height="size" :src="iconSvg" />
</template>
<script>
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《海滩雨伞》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.3409 21.4119L24.0002 24.0001L33.6594 26.5883L43.3187 29.1765C45.6567 20.4506 41.8476 11.5259 34.5459 7.00012C32.9196 5.99211 31.12 5.20232 29.1765 4.68156C26.9383 4.08183 24.6869 3.88656 22.5001 4.05095C14.2628 4.67018 6.94074 10.3926 4.68164 18.8237L14.3409 21.4119Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M29.1762 4.6814C29.1762 4.6814 23.5355 8.34634 20.3095 12.6583C17.0836 16.9703 16.2725 21.9294 16.2725 21.9294" stroke="${this.colors(2)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M29.1768 4.6814C29.1768 4.6814 32.2293 10.6757 32.8671 16.023C33.5048 21.3702 31.7278 26.0705 31.7278 26.0705" stroke="${this.colors(2)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M4.68164 18.8237L14.3409 21.4119L24.0002 24.0001L33.6594 26.5883L43.3187 29.1765" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M4 44H44" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M24 24L18.5 43.9999" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M22.5 4.05095C24.6868 3.88656 26.9382 4.08183 29.1764 4.68156C31.1199 5.20232 32.9195 5.99211 34.5458 7.00012" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>