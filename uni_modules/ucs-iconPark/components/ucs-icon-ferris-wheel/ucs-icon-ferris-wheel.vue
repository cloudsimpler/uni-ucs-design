<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script>
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《摩天轮》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 44L24 22" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/><path d="M39 44L24 22" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/><path d="M9.13217 23.9998C9.045 23.3455 9 22.6779 9 21.9998C9 19.8665 9.44534 17.8372 10.2481 15.9998C10.3285 15.8158 10.4125 15.6337 10.5 15.4536" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}"/><path d="M11.1562 29.7529C13.2883 33.2772 16.83 35.8533 20.9998 36.6997" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}"/><path d="M27 36.7001C31.2141 35.8446 34.7866 33.2226 36.911 29.6406" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}"/><path d="M38.8678 23.9998C38.955 23.3455 39 22.6779 39 21.9998C39 19.6528 38.461 17.4318 37.5 15.4536" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}"/><path d="M27 7.30029C29.6553 7.83929 32.0559 9.0797 34 10.8197" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}"/><path d="M21.0001 7.30029C18.3448 7.83929 15.9442 9.0797 14.0001 10.8197C13.7899 11.0079 13.585 11.2019 13.3857 11.4014" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}"/><circle cx="10" cy="27" r="3" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}"/><circle cx="24" cy="37" r="3" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}"/><circle cx="24" cy="7" r="3" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}"/><circle cx="12" cy="13" r="3" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}"/><circle cx="36" cy="13" r="3" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}"/><circle cx="38" cy="27" r="3" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}"/><circle cx="24" cy="22" r="4" fill="${this.colors(0)}"/><path d="M6 44L14 44" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M34 44L42 44" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>