<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script>
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《生肖龙》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#icon-56d9d2b2674adb72)"><path d="M34.0214 42.4943L37.7612 38.7545C40.1043 36.4113 40.1043 32.6123 37.7612 30.2692V30.2692C35.418 27.926 31.6191 27.926 29.2759 30.2692L27.0449 32.5002" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/><path d="M17.0746 25.5002L23.6191 18.9556C25.9623 16.6125 25.9623 12.8135 23.6191 10.4704V10.4704C21.276 8.12722 17.477 8.12722 15.1338 10.4704L8.06276 17.5414" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/><path d="M17.0748 25.5002L8.76957 33.8055C6.42642 36.1486 6.42642 39.9476 8.76957 42.2907V42.2907C11.1127 44.6339 14.9117 44.6339 17.2548 42.2907L27.0211 32.5245" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/><path d="M13 11.9999V3.99988" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M38 30L43 25" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/></g><defs><clipPath id="icon-56d9d2b2674adb72"><rect width="48" height="48" fill="${this.colors(2)}"/></clipPath></defs></svg>`
			}
		}
	}
</script>