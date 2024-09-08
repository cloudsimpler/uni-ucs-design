<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script>
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《熊猫》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="24" cy="27" rx="18" ry="17" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}"/><ellipse cx="16.9333" cy="24.6402" rx="3" ry="4" transform="rotate(15 16.9333 24.6402)" fill="${this.colors(3)}" stroke="${this.colors(2)}" stroke-width="${this.strokeWidth}"/><ellipse rx="3" ry="4" transform="matrix(-0.965926 0.258819 0.258819 0.965926 30.9329 24.6402)" fill="${this.colors(3)}" stroke="${this.colors(2)}" stroke-width="${this.strokeWidth}"/><path d="M40.9995 20.999C44.1237 17.8748 44.4376 12.7804 41.3134 9.65616C38.1892 6.53196 32.124 6.87507 28.9998 9.99927" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/><path d="M7 20.9995C3.87581 17.8753 3.53224 12.7807 6.65644 9.65655C9.78063 6.53236 15.8758 6.87532 19 9.99951" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/><path d="M20 35C20.5 36.2935 22.2 38.2769 25 35.8623C27.8 38.2769 29.5 36.2935 30 35" stroke="${this.colors(2)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>