<template>
	<ucs-iconPark :width="size" :height="size" :src="iconSvg" />
</template>
<script lang="uts">
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《鹰》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.99968 23.0008C1.96038 15.9568 9.62382 11.8637 13.9997 11.0004C28.541 -1.84434 40.485 10.7132 41.9998 19C43.5145 27.2868 43.1582 33.8931 43.9997 37.0008C37.5368 28.2995 33.1225 29.8415 31.9997 32.0008C29.98 36.1442 26.6863 36.2519 24.9997 35.0008C20.9604 31.686 14.5242 38.2023 11.9997 42.0005C16.847 33.2992 17.5047 27.7272 16.9997 26.0008C14.98 17.7138 8.69261 20.5837 5.99968 23.0008Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><circle cx="23" cy="16" r="2" fill="${this.colors(2)}"/></svg>`
			}
		}
	}
</script>