<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script lang="uts">
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《西瓜视频》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24.0003 42.3334C34.1255 42.3334 42.3337 34.1253 42.3337 24.0001C42.3337 13.8749 34.1255 5.66675 24.0003 5.66675C13.8751 5.66675 5.66699 13.8749 5.66699 24.0001C5.66699 26.4858 6.80727 27.6871 8.61419 28.7448C10.4211 29.8025 13.8204 29.6269 16.1327 31.7014C18.445 33.776 18.6011 37.1507 19.0799 38.7905C19.5588 40.4303 21.5146 42.3334 24.0003 42.3334Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M19.5264 18.5412C18.988 19.8493 18.7188 21.3866 18.7188 23.153C18.7188 24.8329 18.8971 26.496 19.2539 28.1424L19.2539 28.1424C19.6113 29.7916 21.2381 30.8389 22.8873 30.4815C22.9472 30.4685 23.0067 30.4537 23.0657 30.4372C24.8653 29.9322 26.4325 29.2711 27.7673 28.454C29.0152 27.6899 30.1779 26.7253 31.2556 25.56L31.2556 25.56C32.4013 24.3211 32.3258 22.3879 31.0868 21.2421C31.0514 21.2094 31.0152 21.1775 30.9783 21.1465C29.7116 20.0817 28.3858 19.1254 27.0008 18.2774C25.5547 17.3921 24.1384 16.8579 22.7519 16.6749L22.7518 16.6749C21.3779 16.4935 20.0539 17.2596 19.5264 18.5412Z" fill="${this.colors(3)}" stroke="${this.colors(2)}" stroke-width="${this.strokeWidth}" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>