<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script lang="uts">
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《国际化》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 44.0002C35.0457 44.0002 44 35.0459 44 24.0002C44 12.9545 35.0457 4.00024 24 4.00024C12.9543 4.00024 4 12.9545 4 24.0002C4 35.0459 12.9543 44.0002 24 44.0002Z" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}"/><path d="M6 30.9856C8.63192 32.041 10.5266 32.041 11.6839 30.9856C13.4199 29.4025 11.9219 24.5978 14.3532 23.2727C16.7844 21.9476 20.4886 27.8214 23.9508 25.8887C27.4129 23.9559 23.6246 18.8023 26.0272 16.713C28.4298 14.6237 31.554 16.98 32.1001 13.4865C32.6462 9.99304 29.5521 11.5082 28.9584 8.20693C28.5625 6.00611 28.5625 4.84884 28.9584 4.73511" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/><path d="M29.0209 43.3505C27.1468 41.4325 26.4721 39.6497 26.9969 38.0019C27.7841 35.5303 29.0826 35.6764 29.6488 34.1482C30.2149 32.6199 28.6156 30.4433 32.1643 28.5826C34.5301 27.3421 37.783 28.7794 41.9228 32.8944" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/></svg>`
			}
		}
	}
</script>