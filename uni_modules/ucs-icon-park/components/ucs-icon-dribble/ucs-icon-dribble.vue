<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script lang="uts">
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《追波》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M44 24C44 29.5386 41.7486 34.5513 38.1112 38.173C34.4943 41.7742 29.5071 44 24 44C12.9543 44 4 35.0457 4 24C4 18.6615 6.09159 13.8116 9.5 10.225C13.1439 6.39055 18.2928 4 24 4C29.5071 4 34.4943 6.22583 38.1112 9.82695C41.7486 13.4487 44 18.4614 44 24Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M44.0003 24C41.0819 24 33.0315 22.8993 25.8268 26.0632C18.0003 29.5002 12.3327 34.8315 9.86328 38.1472" stroke="${this.colors(2)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M16.5 5.4538C19.6304 8.34269 26.4603 15.6985 29 23C31.5397 30.3015 32.4809 39.2791 33.0606 41.8347" stroke="${this.colors(2)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M4.1543 21.5C7.93207 21.7277 17.9329 21.9332 24.3329 19.1999C30.7329 16.4666 36.2402 11.4396 38.1291 9.84521" stroke="${this.colors(2)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M5.5 31.613C7.26166 35.8893 10.4628 39.4207 14.5 41.604" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M4 24.0001C4 18.6617 6.09159 13.8117 9.5 10.2251" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M24 4C18.2928 4 13.1439 6.39055 9.5 10.225" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M32 5.66406C34.2933 6.66606 36.3624 8.0857 38.1112 9.82684C41.7486 13.4485 44 18.4613 44 23.9999C44 26.4625 43.5549 28.8212 42.7408 30.9999" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M24 44C29.5071 44 34.4943 41.7742 38.1112 38.1731" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>