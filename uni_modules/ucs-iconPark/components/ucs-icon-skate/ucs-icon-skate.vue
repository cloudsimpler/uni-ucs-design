<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script>
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《滑板》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M44 39.8198H4L36.54 21.8198H44V39.8198Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-miterlimit="2" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M3.85742 19.2012L7.08947 20.7992L24.41 10.7992L24.642 7.20117" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-miterlimit="2" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M12.3301 24.8799C13.9869 24.8799 15.3301 23.5367 15.3301 21.8799C15.3301 20.223 13.9869 18.8799 12.3301 18.8799C10.6732 18.8799 9.33008 20.223 9.33008 21.8799C9.33008 23.5367 10.6732 24.8799 12.3301 24.8799Z" fill="${this.colors(0)}"/><path d="M23.4502 18.8799C25.107 18.8799 26.4502 17.5367 26.4502 15.8799C26.4502 14.223 25.107 12.8799 23.4502 12.8799C21.7933 12.8799 20.4502 14.223 20.4502 15.8799C20.4502 17.5367 21.7933 18.8799 23.4502 18.8799Z" fill="${this.colors(0)}"/></svg>`
			}
		}
	}
</script>