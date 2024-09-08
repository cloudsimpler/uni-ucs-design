<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script>
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《等比》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="6" width="36" height="36" rx="3" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linejoin="${this.strokeLinejoin}"/><path fill-rule="evenodd" clip-rule="evenodd" d="M24 22.5C25.3807 22.5 26.5 21.3807 26.5 20C26.5 18.6193 25.3807 17.5 24 17.5C22.6193 17.5 21.5 18.6193 21.5 20C21.5 21.3807 22.6193 22.5 24 22.5Z" fill="${this.colors(2)}"/><path fill-rule="evenodd" clip-rule="evenodd" d="M24 30.5C25.3807 30.5 26.5 29.3807 26.5 28C26.5 26.6193 25.3807 25.5 24 25.5C22.6193 25.5 21.5 26.6193 21.5 28C21.5 29.3807 22.6193 30.5 24 30.5Z" fill="${this.colors(2)}"/><path d="M15.5 17V31" stroke="${this.colors(2)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M32.5 17V31" stroke="${this.colors(2)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>