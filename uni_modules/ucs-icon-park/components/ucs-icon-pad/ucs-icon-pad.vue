<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script lang="uts">
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《平板电脑》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M42 4H6V31H42V4Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M42 31V44H6V31" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M16 9H13C12.4477 9 12 9.44772 12 10V13C12 13.5523 12.4477 14 13 14H16C16.5523 14 17 13.5523 17 13V10C17 9.44772 16.5523 9 16 9Z" fill="${this.colors(2)}"/><path d="M16 16H13C12.4477 16 12 16.4477 12 17V20C12 20.5523 12.4477 21 13 21H16C16.5523 21 17 20.5523 17 20V17C17 16.4477 16.5523 16 16 16Z" fill="${this.colors(2)}"/><path d="M25.5 9H22.5C21.9477 9 21.5 9.44772 21.5 10V13C21.5 13.5523 21.9477 14 22.5 14H25.5C26.0523 14 26.5 13.5523 26.5 13V10C26.5 9.44772 26.0523 9 25.5 9Z" fill="${this.colors(2)}"/><path d="M25.5 16H22.5C21.9477 16 21.5 16.4477 21.5 17V20C21.5 20.5523 21.9477 21 22.5 21H25.5C26.0523 21 26.5 20.5523 26.5 20V17C26.5 16.4477 26.0523 16 25.5 16Z" fill="${this.colors(2)}"/><path d="M26.5 37.5C26.5 36.1193 25.3807 35 24 35C22.6193 35 21.5 36.1193 21.5 37.5C21.5 38.8807 22.6193 40 24 40C25.3807 40 26.5 38.8807 26.5 37.5Z" fill="${this.colors(0)}"/><path d="M35 9H32C31.4477 9 31 9.44772 31 10V13C31 13.5523 31.4477 14 32 14H35C35.5523 14 36 13.5523 36 13V10C36 9.44772 35.5523 9 35 9Z" fill="${this.colors(2)}"/></svg>`
			}
		}
	}
</script>