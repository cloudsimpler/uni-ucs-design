<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script lang="uts">
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《子宫》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M32.0002 18C31.0772 24 29.0002 29.5 24.5002 29.5C20.0002 29.5 18.5002 24.5 17.0002 18C15.5002 11.5 17.0002 6 24.5002 6C32.0002 6 32.9233 12 32.0002 18Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}"/><path d="M32.5 12.5C34.25 10.8682 36.0328 10.3296 38.8405 10.5043C43.052 10.7664 44 13.648 44 17.9564M44 17.9564C44 22.2648 42.3485 26.1825 39.0589 25.2961C35.7692 24.4097 36.2292 20.9096 37.7678 19.2686C39.3064 17.6276 41.9973 16.9589 44 17.9564Z" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/><path d="M16.5 12C14.7309 10.456 12.6403 10.3301 10.0869 10.5048C6.25675 10.7668 3.99999 13.6924 3.99999 18.0008M3.99999 18.0008C3.99999 22.3092 6.89652 26.1829 9.88829 25.2965C12.8801 24.4101 12.4618 20.9101 11.0625 19.2691C9.66321 17.6281 5.82131 17.0033 3.99999 18.0008Z" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/><path d="M20 27V43" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M29 27V43" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>