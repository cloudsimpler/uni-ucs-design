<template>
	<ucs-iconPark :width="size" :height="size" :src="iconSvg" />
</template>
<script>
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《圆环》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M23.9996 11.2727C26.008 11.2727 27.636 9.64467 27.636 7.63636C27.636 5.62806 26.008 4 23.9996 4C21.9913 4 20.3633 5.62806 20.3633 7.63636C20.3633 9.64467 21.9913 11.2727 23.9996 11.2727Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M23.9996 44C26.008 44 27.636 42.372 27.636 40.3637C27.636 38.3554 26.008 36.7273 23.9996 36.7273C21.9913 36.7273 20.3633 38.3554 20.3633 40.3637C20.3633 42.372 21.9913 44 23.9996 44Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M7.63636 27.6363C9.64467 27.6363 11.2727 26.0082 11.2727 23.9999C11.2727 21.9916 9.64467 20.3635 7.63636 20.3635C5.62806 20.3635 4 21.9916 4 23.9999C4 26.0082 5.62806 27.6363 7.63636 27.6363Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M40.3639 27.6363C42.3722 27.6363 44.0003 26.0082 44.0003 23.9999C44.0003 21.9916 42.3722 20.3635 40.3639 20.3635C38.3556 20.3635 36.7275 21.9916 36.7275 23.9999C36.7275 26.0082 38.3556 27.6363 40.3639 27.6363Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M32.7344 10.1597C34.7921 11.4609 36.5395 13.2084 37.8407 15.266" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M37.8407 32.7339C36.5395 34.7916 34.7921 36.539 32.7344 37.8403" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M15.2665 37.8403C13.2088 36.539 11.4614 34.7916 10.1602 32.7339" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M10.1602 15.266C11.4614 13.2084 13.2088 11.4609 15.2665 10.1597" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>