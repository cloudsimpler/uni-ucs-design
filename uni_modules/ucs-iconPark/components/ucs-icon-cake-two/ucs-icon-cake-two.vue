<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script>
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《蛋糕》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M40 17.9L31.0577 8L9 17.9V30H40V17.9Z" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M9 18H26.386C26.4489 18 26.5 18.0511 26.5 18.114V21.625C26.5 23.2128 27.7872 24.5 29.375 24.5V24.5C30.9628 24.5 32.25 23.2128 32.25 21.625V18.114C32.25 18.0511 32.3011 18 32.364 18H40" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M9.5 23.9568C8.89836 24.2575 8.33775 24.5769 7.82243 24.913C5.41836 26.481 4 28.4118 4 30.4999C4 35.7466 12.9543 39.9999 24 39.9999C35.0457 39.9999 44 35.7466 44 30.4999C44 28.3609 42.5116 26.3869 40 24.799" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}"/></svg>`
			}
		}
	}
</script>