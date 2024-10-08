<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script lang="uts">
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《心电》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.55469 23.194C5.3698 22.8031 5.19795 22.4068 5.04108 22.0056C4.39264 20.3473 4 18.6042 4 16.8C4 10.8353 8.88417 6 14.9091 6C18.7036 6 22.0456 7.91792 24 10.828C25.9544 7.91792 29.2964 6 33.0909 6C39.1158 6 44 10.8353 44 16.8C44 24.5647 36.7273 31.2 33.0909 34.8C30.6667 37.2 27.6364 39.6 24 42C20.3636 39.6 17.3333 37.2 14.9091 34.8C14.543 34.4376 14.1401 34.0444 13.7114 33.6224" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M8 29.9734L19.1138 19.0396L25.5781 25.7059L35.2619 15.8188" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>