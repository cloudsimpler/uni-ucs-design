<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script lang="uts">
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《营养》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M24 42C24.8653 42 26.8503 42 29.9551 42C30.0381 39.2631 30.4393 37.7582 31.1586 37.4852C38.6685 34.6357 44 27.434 44 19H4C4 27.2514 9.10319 34.3234 16.3568 37.2941C17.1151 37.6047 17.6815 39.1733 18.056 42C21.0857 42 23.067 42 24 42Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M14.4434 26.0225C14.803 27.2103 15.2786 28.191 15.8702 28.9646C16.4484 29.7209 17.1619 30.4223 18.0104 31.0688" stroke="${this.colors(2)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/><path d="M32.2009 8.01759C30.9409 7.31418 29.5829 6.76784 28.1528 6.40474M22.0507 6C14.9273 6.8226 9.1442 12.0978 7.5 19M40.5 18.9965C39.8296 16.1847 38.4722 13.643 36.6172 11.5626" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/></svg>`
			}
		}
	}
</script>