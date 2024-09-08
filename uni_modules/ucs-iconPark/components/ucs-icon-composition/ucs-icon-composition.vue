<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script>
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《成份》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M39.8281 21.7859L21.9686 39.6454C18.5544 43.0597 12.9373 42.9783 9.42255 39.4636C5.90784 35.9489 5.82643 30.3318 9.24073 26.9175L27.1002 9.05798" fill="${this.colors(1)}"/><path d="M39.8281 21.7859L21.9686 39.6454C18.5544 43.0597 12.9373 42.9783 9.42255 39.4636C5.90784 35.9489 5.82643 30.3318 9.24073 26.9175L27.1002 9.05798" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/><path d="M8.73438 27.4238L34.8784 26.7356" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/><path d="M29.393 20.9069C30.1741 20.1258 30.1741 18.8595 29.393 18.0785C28.612 17.2974 27.3457 17.2974 26.5646 18.0785C25.7836 18.8595 25.7836 20.1258 26.5646 20.9069C27.3457 21.6879 28.612 21.6879 29.393 20.9069Z" fill="${this.colors(2)}"/><path d="M23.7358 23.7355C24.5169 22.9545 24.5169 21.6881 23.7358 20.9071C22.9548 20.126 21.6884 20.126 20.9074 20.9071C20.1263 21.6881 20.1263 22.9545 20.9074 23.7355C21.6884 24.5166 22.9548 24.5166 23.7358 23.7355Z" fill="${this.colors(2)}"/><path d="M23.5645 5.52246L43.3634 25.3215" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/></svg>`
			}
		}
	}
</script>