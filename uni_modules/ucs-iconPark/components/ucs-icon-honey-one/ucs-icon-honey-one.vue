<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script>
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《蜂蜜》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4.92871" y="13.2239" width="11" height="5" rx="2" transform="rotate(-46.0247 4.92871 13.2239)" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}"/><rect x="19.3213" y="27.1108" width="11" height="5" rx="2" transform="rotate(-46.0247 19.3213 27.1108)" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}"/><rect x="6.44336" y="18.8545" width="17" height="5" rx="2" transform="rotate(-46.0247 6.44336 18.8545)" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}"/><rect x="13.6406" y="25.7981" width="17" height="5" rx="2" transform="rotate(-46.0247 13.6406 25.7981)" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}"/><rect x="7.26465" y="25.2048" width="25" height="5" rx="2" transform="rotate(-46.0247 7.26465 25.2048)" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}"/><path d="M25.0029 28.4238L29.169 24.106L43.5756 38.0062L39.4095 42.3241L25.0029 28.4238Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M21 40.25C21 42.3211 19.2091 44 17 44C14.7909 44 13 42.3211 13 40.25C13 38.1789 17 34 17 34C17 34 21 38.1789 21 40.25Z" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>