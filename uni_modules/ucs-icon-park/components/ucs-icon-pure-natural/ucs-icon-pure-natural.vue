<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script lang="uts">
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《纯天然》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 41.0001C15.1674 39.2093 19.0922 38.2431 22.7746 38.1015C26.457 37.9598 31.1988 38.5927 37 40.0001" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/><path d="M23.0452 44C22.2783 34.5599 22.5964 27.2266 23.9997 22" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/><path fill-rule="evenodd" clip-rule="evenodd" d="M24 23.176C25.59 17.1581 28.3898 13.5692 32.3992 12.4095C36.4086 11.2497 40.2755 11.7812 43.9998 14.004C44.0186 18.8959 41.8952 22.4796 37.6296 24.755C33.364 27.0305 28.8208 26.5041 24 23.176Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linejoin="${this.strokeLinejoin}"/><path fill-rule="evenodd" clip-rule="evenodd" d="M23.7919 22.1141C24.6253 14.9273 22.9554 9.86554 18.7822 6.92866C14.6089 3.99178 9.77638 3.336 4.28447 4.96133C3.32535 11.5907 4.79153 16.6036 8.68299 20C12.5745 23.3964 17.6108 24.1011 23.7919 22.1141Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>