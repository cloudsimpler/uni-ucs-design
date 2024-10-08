<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script lang="uts">
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《两个椭圆》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M40.579 7.34863C44.3436 11.1132 39.9566 21.604 30.7803 30.7803C21.604 39.9566 11.1133 44.3436 7.34863 40.579C3.58399 36.8143 7.97101 26.3236 17.1473 17.1473C26.3236 7.97101 36.8143 3.58399 40.579 7.34863Z" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M7.48535 7.34863C3.72071 11.1132 8.10773 21.604 17.284 30.7803C26.4603 39.9566 36.951 44.3436 40.7157 40.579C44.4803 36.8143 40.0933 26.3236 30.917 17.1473C21.7407 7.97101 11.25 3.58399 7.48535 7.34863Z" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>