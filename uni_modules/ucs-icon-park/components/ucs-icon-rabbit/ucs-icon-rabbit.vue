<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script lang="uts">
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《兔子》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="24" cy="32" rx="17" ry="12" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}"/><circle cx="18" cy="29.4121" r="2" fill="${this.colors(2)}"/><circle cx="24" cy="35.4121" r="2" fill="${this.colors(2)}"/><circle cx="30" cy="29.4121" r="2" fill="${this.colors(2)}"/><path d="M12.6672 22C11.3521 18.8333 9.06034 11.1127 10.413 5.91273C10.7887 4.91273 12.2164 3.21273 14.9217 4.41273C15.2974 4.57935 16.1616 5.2126 16.6125 6.4126C17.7397 8.4126 16.0489 21 16.0489 21" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M35.3871 22C36.7025 18.8333 38.9324 11.1127 37.5793 5.91273C37.2035 4.91273 35.7754 3.21273 33.0693 4.41273C32.6935 4.57935 31.8291 5.2126 31.378 6.4126C30.2505 8.4126 32.0044 20 32.0044 20" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>