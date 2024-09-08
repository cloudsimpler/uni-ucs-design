<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script>
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《鹿》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M36 27C36 34.2165 30.6274 44 24 44C17.3726 44 12 34.2165 12 27C12 19.7835 13.5 16 24 16C34.5 16 36 19.7835 36 27Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}"/><ellipse rx="5" ry="3.5" transform="matrix(0.707107 -0.707107 -0.707107 -0.707107 38.9996 17.5003)" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}"/><ellipse cx="8.99963" cy="17.4997" rx="5" ry="3.5" transform="rotate(45 8.99963 17.4997)" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}"/><path d="M12 4C12 10.6274 17.3726 16 24 16C30.6274 16 36 10.6274 36 4" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/><path d="M18 7C18 11.9706 20.6863 16 24 16C27.3137 16 30 11.9706 30 7" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/><circle cx="19.9995" cy="26" r="2" fill="${this.colors(2)}"/><circle cx="23.9995" cy="34" r="2" fill="${this.colors(2)}"/><circle cx="27.9995" cy="26" r="2" fill="${this.colors(2)}"/></svg>`
			}
		}
	}
</script>