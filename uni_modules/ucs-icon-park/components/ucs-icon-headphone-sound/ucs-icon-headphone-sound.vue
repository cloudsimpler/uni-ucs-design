<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script lang="uts">
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《耳机声音》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 28C4 26.8954 4.89543 26 6 26H10V38H6C4.89543 38 4 37.1046 4 36V28Z" fill="${this.colors(1)}"/><path d="M38 26H42C43.1046 26 44 26.8954 44 28V36C44 37.1046 43.1046 38 42 38H38V26Z" fill="${this.colors(1)}"/><path d="M10 36V24C10 16.268 16.268 10 24 10C31.732 10 38 16.268 38 24V36M10 26H6C4.89543 26 4 26.8954 4 28V36C4 37.1046 4.89543 38 6 38H10V26ZM38 26H42C43.1046 26 44 26.8954 44 28V36C44 37.1046 43.1046 38 42 38H38V26Z" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M16 32H20L22 26L26 38L28 32H32" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>