<template>
	<ucs-iconPark :width="size" :height="size" :src="iconSvg" />
</template>
<script>
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《审核》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 36L8.00461 28.0426C8.00551 27.4906 8.45313 27.0432 9.00519 27.0426C12.3391 27.0426 15.6731 27.0426 19.0071 27.0426C19.9286 27.0426 19.9237 26.2252 19.9237 24.2792C19.9237 22.3332 15.0221 20.6941 15.0221 13.8528C15.0221 7.01151 20.0999 5 24.32 5C28.5401 5 33.1366 7.01151 33.1366 13.8528C33.1366 20.6941 28.2607 21.7818 28.2607 24.2792C28.2607 26.7765 28.2607 27.0426 29.0413 27.0426C32.3609 27.0426 35.6806 27.0426 39.0003 27.0426C39.5525 27.0426 40.0003 27.4904 40.0003 28.0426V36H8Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M8 42H40" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>