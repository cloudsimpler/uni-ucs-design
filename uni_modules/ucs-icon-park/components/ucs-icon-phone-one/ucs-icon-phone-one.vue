<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script lang="uts">
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《电话》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="38" height="38" rx="3" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}"/><rect x="11" y="12" width="8" height="${this.size}" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><rect x="25" y="12" width="12" height="6" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><circle cx="25" cy="24" r="2" fill="${this.colors(0)}"/><circle cx="25" cy="30" r="2" fill="${this.colors(0)}"/><circle cx="25" cy="36" r="2" fill="${this.colors(0)}"/><circle cx="31" cy="24" r="2" fill="${this.colors(0)}"/><circle cx="31" cy="30" r="2" fill="${this.colors(0)}"/><circle cx="31" cy="36" r="2" fill="${this.colors(0)}"/><circle cx="37" cy="24" r="2" fill="${this.colors(0)}"/><circle cx="37" cy="30" r="2" fill="${this.colors(0)}"/><circle cx="37" cy="36" r="2" fill="${this.colors(0)}"/></svg>`
			}
		}
	}
</script>