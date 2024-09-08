<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script>
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《ipo》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 18.313V7H44V18.313C41.8815 19.068 40.3636 21.1053 40.3636 23.5C40.3636 25.8947 41.8815 27.932 44 28.687V40H4V28.687C6.11853 27.932 7.63636 25.8947 7.63636 23.5C7.63636 21.1053 6.11853 19.068 4 18.313V18.313Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M13 18V29" stroke="${this.colors(2)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M18 18V29" stroke="${this.colors(2)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M18 18H21C22.6569 18 24 19.3431 24 21C24 22.6569 22.6569 24 21 24H18V18Z" fill="${this.colors(3)}" stroke="${this.colors(2)}" stroke-width="${this.strokeWidth}" stroke-linejoin="${this.strokeLinejoin}"/><ellipse cx="32" cy="24" rx="3" ry="5" fill="${this.colors(3)}" stroke="${this.colors(2)}" stroke-width="${this.strokeWidth}" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>