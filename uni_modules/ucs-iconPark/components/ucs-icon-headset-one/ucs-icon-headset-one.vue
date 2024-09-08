<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script>
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《耳机》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M36 32C40.4183 32 44 28.4183 44 24C44 19.5817 40.4183 16 36 16" fill="${this.colors(1)}"/><path d="M36 32V32C40.4183 32 44 28.4183 44 24C44 19.5817 40.4183 16 36 16" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M12 16C7.58172 16 4 19.5817 4 24C4 28.4183 7.58172 32 12 32" fill="${this.colors(1)}"/><path d="M12 16C7.58172 16 4 19.5817 4 24C4 28.4183 7.58172 32 12 32V32" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M12 32V31.5V29V24V16C12 9.37258 17.3726 4 24 4C30.6274 4 36 9.37258 36 16V32C36 38.6274 30.6274 44 24 44" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>