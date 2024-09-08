<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script>
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《笔记本电脑禁用》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M23 8.99902H11C9.34315 8.99902 8 10.3422 8 11.999V32.999H40V25.999" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M4 32.999H44V34.999C44 38.3127 41.3137 40.999 38 40.999H10C6.68629 40.999 4 38.3127 4 34.999V32.999Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linejoin="${this.strokeLinejoin}"/><circle cx="36.0002" cy="13" r="6" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}"/><path d="M32 9L40 17" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>