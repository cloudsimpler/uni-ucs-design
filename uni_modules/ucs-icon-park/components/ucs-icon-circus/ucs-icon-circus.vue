<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script lang="uts">
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《马戏团》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 26C9 26 8.92429 26.7867 8 31C7.02053 35.4648 4 44 4 44H44C44 44 40.9795 35.4648 40 31C39.0757 26.7867 39 26 39 26" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M20 28C21 37 16 44 16 44" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M28 28C27 37 32 44 32 44" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M6 18C6 18 13.5923 17.9452 17 17C19.8659 16.2051 24 14 24 14C24 14 27.8229 16.1944 30.5 17C34.0722 18.075 42 18 42 18L41 25C41 25 37 27 36 27C35 27 33 25 32 25C31 25 28.5 28 28 28C27.5 28 25 25 24 25C23 25 21 28.5 20 28.5C19 28.5 17 25 16 25C15.802 25 15.5257 25.0784 15.2098 25.2041C13.0681 26.0564 10.7214 26.4885 8.58115 25.6325L7 25L6 18Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M24 5V15" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/><path d="M36 10.9998V4.99984C36 4.99984 34.5 7.99984 30 4.99984C25.5 1.99984 24 4.99984 24 4.99984V10.9998C24 10.9998 25.5 7.99984 30 10.9998C34.5 13.9998 36 10.9998 36 10.9998Z" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>