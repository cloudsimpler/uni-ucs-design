<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script lang="uts">
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《梨子》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.6391 12.7461C17.9484 9.85633 20.8275 8 24 8C27.1725 8 30.0516 9.85633 31.3609 12.7461L34.4211 19.5L38.1067 25.8219C40.3938 29.7449 39.7121 34.7218 36.4545 37.8853L35.2649 39.0405C32.352 41.8693 27.7836 42.0721 24.6314 39.5127C24.2635 39.2139 23.7365 39.2139 23.3686 39.5127C20.2164 42.0721 15.648 41.8693 12.7351 39.0405L11.5455 37.8853C8.28785 34.7218 7.60621 29.7449 9.8933 25.8219L13.5789 19.5L16.6391 12.7461Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}"/><path d="M21.5 4C22.1667 4.5 23.6 5.9 24 7.5C24.4 9.1 24.1667 10.8333 24 11.5" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/><circle cx="16" cy="28" r="2" fill="${this.colors(2)}"/><circle cx="18" cy="34" r="2" fill="${this.colors(2)}"/><circle cx="23" cy="30" r="2" fill="${this.colors(2)}"/></svg>`
			}
		}
	}
</script>