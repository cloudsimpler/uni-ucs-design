<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script lang="uts">
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《奶酪》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M43 20C43 17.8285 24.8921 8.11198 20.134 5.59629C19.4394 5.22904 18.603 5.31194 17.9852 5.79737L5 16" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M5 17.6522C5 16.3232 6.2688 15.3543 7.55521 15.688C13.9619 17.3498 30.8602 21.3331 40.1615 19.7589C41.5557 19.523 43 20.5369 43 21.951V38.1025C43 39.1662 42.1674 40.0438 41.1051 40.0997L7.10512 41.8892C5.96083 41.9494 5 41.0378 5 39.892V17.6522Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><circle cx="12" cy="25" r="2" fill="${this.colors(2)}"/><circle cx="25" cy="27" r="2" fill="${this.colors(2)}"/><circle cx="34" cy="32" r="2" fill="${this.colors(2)}"/><circle cx="18" cy="32" r="2" fill="${this.colors(2)}" stroke="${this.colors(2)}" stroke-width="${this.strokeWidth}"/></svg>`
			}
		}
	}
</script>