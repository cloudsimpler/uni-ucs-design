<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script lang="uts">
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《牛角面包》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#icon-23b9b6385117d7c5)"><path d="M7 28.9999C7 28.9999 6.95638 32.7475 8.45638 37.2475C9.32863 39.8642 10.37 41.4665 11.6787 42.2511C13.3558 43.2564 15.0757 41.2715 16.0579 39.5807C17.0202 37.9244 18.4335 36.2276 19.5478 34.9999" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M33.0002 7.91139C35.623 8.35039 38.5315 8.91654 39.6259 9.41858C41.0517 10.0727 42.4858 11.4055 43.0573 12.8301C43.5883 14.1541 42.2101 15.1701 40.9641 15.8645C39.5594 16.6472 38.0953 17.8742 36.8988 18.9996" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M24.2021 29.7758L21.7002 31.5134C21.2426 31.8312 20.8837 32.2712 20.6643 32.7832V32.7832C20.0203 34.2857 18.2834 34.9857 16.7776 34.3494L8.80304 30.9801C7.33068 30.358 6.61794 28.6796 7.19282 27.1881L7.64341 26.0192C8.52318 23.7368 10.1315 21.8085 12.2188 20.5333V20.5333" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M30.7198 24.5076L32.1099 23.0036L33.022 22.0167C33.3371 21.6758 33.7205 21.4051 34.1472 21.2222V21.2222C35.7509 20.5349 36.5441 18.7194 35.9588 17.0757L33.1066 9.06573C32.6309 7.72983 31.2308 6.96127 29.8484 7.27722L28.6297 7.55576C25.975 8.16247 23.6476 9.74971 22.1136 11.9996V11.9996" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M13.4109 23.0785C11.7746 21.9096 11.331 19.6654 12.3934 17.9581V17.9581C13.9429 15.468 16.0518 13.364 18.5473 11.8232V11.8232C20.2199 10.7906 22.4039 11.204 23.5833 12.7765L29.5153 20.6858C30.8737 22.497 30.4595 25.0736 28.6019 26.3678L28.3619 26.535C28.061 26.7447 27.7903 26.9947 27.5575 27.2781L26.874 28.1103C25.5382 29.7366 23.1706 30.0497 21.4581 28.8264L13.4109 23.0785Z" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}"/></g><defs><clipPath id="icon-23b9b6385117d7c5"><rect width="48" height="48" fill="${this.colors(2)}"/></clipPath></defs></svg>`
			}
		}
	}
</script>