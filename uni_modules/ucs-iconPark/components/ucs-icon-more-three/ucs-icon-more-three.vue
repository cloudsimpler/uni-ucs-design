<template>
	<ucs-iconPark :width="size" :height="size" :src="iconSvg" />
</template>
<script>
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《更多3》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linejoin="${this.strokeLinejoin}"/><path fill-rule="evenodd" clip-rule="evenodd" d="M21.5 14C21.5 15.3807 22.6193 16.5 24 16.5C25.3807 16.5 26.5 15.3807 26.5 14C26.5 12.6193 25.3807 11.5 24 11.5C22.6193 11.5 21.5 12.6193 21.5 14ZM21.5 24C21.5 25.3807 22.6193 26.5 24 26.5C25.3807 26.5 26.5 25.3807 26.5 24C26.5 22.6193 25.3807 21.5 24 21.5C22.6193 21.5 21.5 22.6193 21.5 24ZM24 36.5C22.6193 36.5 21.5 35.3807 21.5 34C21.5 32.6193 22.6193 31.5 24 31.5C25.3807 31.5 26.5 32.6193 26.5 34C26.5 35.3807 25.3807 36.5 24 36.5Z" fill="${this.colors(2)}"/></svg>`
			}
		}
	}
</script>