<template>
	<ucs-iconPark :width="size" :height="size" :src="iconSvg" />
</template>
<script lang="uts">
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《保龄球》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 49 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24.7773 44C35.8273 44 44.7773 35.05 44.7773 24C44.7773 12.95 35.8273 4 24.7773 4C13.7273 4 4.77734 12.95 4.77734 24C4.77734 35.05 13.7273 44 24.7773 44Z" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-miterlimit="2" stroke-linejoin="${this.strokeLinejoin}"/><path d="M24.7773 26C26.4373 26 27.7773 24.66 27.7773 23C27.7773 21.34 26.4373 20 24.7773 20C23.1173 20 21.7773 21.34 21.7773 23C21.7773 24.66 23.1173 26 24.7773 26Z" fill="${this.colors(0)}"/><path d="M31.7773 18C33.4373 18 34.7773 16.66 34.7773 15C34.7773 13.34 33.4373 12 31.7773 12C30.1173 12 28.7773 13.34 28.7773 15C28.7773 16.66 30.1173 18 31.7773 18Z" fill="${this.colors(0)}"/><path d="M17.7773 18C19.4373 18 20.7773 16.66 20.7773 15C20.7773 13.34 19.4373 12 17.7773 12C16.1173 12 14.7773 13.34 14.7773 15C14.7773 16.66 16.1173 18 17.7773 18Z" fill="${this.colors(0)}"/></svg>`
			}
		}
	}
</script>