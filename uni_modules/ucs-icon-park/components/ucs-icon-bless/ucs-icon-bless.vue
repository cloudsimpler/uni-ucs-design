<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script lang="uts">
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《保佑》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 24.713V5.9354C21 4.86651 20.1335 4 19.0646 4C18.152 4 17.3634 4.63752 17.1722 5.52987L13.0582 24.7286C13.0196 24.9087 12.9563 25.0826 12.8701 25.2453L5.55423 39.0642C4.84906 40.3962 5.81466 42 7.32181 42H15.4056C16.3384 42 17.1474 41.3551 17.3553 40.4456L20.4803 26.7739L20.9193 25.2754C20.9728 25.0927 21 24.9034 21 24.713Z" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M13 25L20 28" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M27 24.713V5.9354C27 4.86651 27.8665 4 28.9354 4C29.848 4 30.6366 4.63752 30.8278 5.52987L34.9418 24.7286C34.9804 24.9087 35.0437 25.0826 35.1299 25.2453L42.4458 39.0642C43.1509 40.3962 42.1853 42 40.6782 42H32.5944C31.6616 42 30.8526 41.3551 30.6447 40.4456L27.5197 26.7739L27.0807 25.2754C27.0272 25.0927 27 24.9034 27 24.713Z" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M35 25L28 28" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>