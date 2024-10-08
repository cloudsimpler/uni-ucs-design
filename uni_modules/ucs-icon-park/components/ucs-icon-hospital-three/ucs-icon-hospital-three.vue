<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script lang="uts">
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《医院3》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 26L11 44L37 44L37 26L24 13L11 26Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M3.58579 21.5858C2.80474 22.3668 2.80474 23.6332 3.58579 24.4142C4.36683 25.1953 5.63316 25.1953 6.41421 24.4142L3.58579 21.5858ZM24 4L25.4142 2.58579C25.0391 2.21071 24.5304 2 24 2C23.4696 2 22.9609 2.21071 22.5858 2.58579L24 4ZM41.5858 24.4142C42.3668 25.1953 43.6332 25.1953 44.4142 24.4142C45.1953 23.6332 45.1953 22.3668 44.4142 21.5858L41.5858 24.4142ZM6.41421 24.4142L25.4142 5.41421L22.5858 2.58579L3.58579 21.5858L6.41421 24.4142ZM22.5858 5.41421L41.5858 24.4142L44.4142 21.5858L25.4142 2.58579L22.5858 5.41421Z" fill="${this.colors(0)}"/><path d="M19 31L29 31" stroke="${this.colors(2)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M24 26V36" stroke="${this.colors(2)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>