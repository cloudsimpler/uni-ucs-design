<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script lang="uts">
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《彩蛋》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M24 44C34.2524 44 40 37.0457 40 26C40 14.9543 31.1316 4 24 4C16.8684 4 8 14.9543 8 26C8 37.0457 13.7476 44 24 44Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}"/><path d="M21 38C22.6569 38 24 36.6569 24 35C24 33.3431 22.6569 32 21 32C19.3431 32 18 33.3431 18 35C18 36.6569 19.3431 38 21 38Z" fill="${this.colors(2)}"/><path fill-rule="evenodd" clip-rule="evenodd" d="M16 29.6675C17.1046 29.6675 18 28.772 18 27.6675C18 26.5629 17.1046 25.6675 16 25.6675C14.8954 25.6675 14 26.5629 14 27.6675C14 28.772 14.8954 29.6675 16 29.6675Z" fill="${this.colors(2)}"/></svg>`
			}
		}
	}
</script>