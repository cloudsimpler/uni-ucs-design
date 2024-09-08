<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script>
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《指甲油》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18.8951 5.88906C18.9539 4.82923 19.8305 4 20.892 4H27.108C28.1695 4 29.0461 4.82923 29.1049 5.88906L29.8827 19.8891C29.9464 21.0355 29.034 22 27.8858 22H20.1142C18.966 22 18.0536 21.0355 18.1173 19.8891L18.8951 5.88906Z" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}"/><path d="M11 28C11 24.6863 13.6863 22 17 22H31C34.3137 22 37 24.6863 37 28V41C37 42.6569 35.6569 44 34 44H14C12.3431 44 11 42.6569 11 41V28Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}"/><circle cx="24" cy="33" r="3" fill="${this.colors(2)}"/></svg>`
			}
		}
	}
</script>