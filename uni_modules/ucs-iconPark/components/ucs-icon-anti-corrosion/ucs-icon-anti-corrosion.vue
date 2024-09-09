<template>
	<ucs-iconPark :width="size" :height="size" :src="iconSvg" />
</template>
<script>
	// #ifdef UNI-APP-X
	import iconMixin from "../../mixins/iconMixin.uts";
	// #endif
	// #ifndef UNI-APP-X
	import iconMixin from "../../mixins/iconMixin.js";
	// #endif
	/**
	 * @description 《防腐》图标
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
			// #ifdef UNI-APP-X
			iconSvg(): string {
			// #endif
			// #ifndef UNI-APP-X
			iconSvg() {
			// #endif
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M24 41.996C37.3333 42.0989 44 41.0074 44 38.7215C44 35.2928 28.4142 18.0027 24 18.0027C19.5858 18.0027 4 35.6511 4 38.7215C4 40.7685 10.6667 41.86 24 41.996Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M21.0601 29.6614L17.4404 34.0003" stroke="${this.colors(2)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/><path d="M24.5 11.0002C25.8807 11.0002 27 9.88096 27 8.50024C27 7.11953 25.8807 6.00024 24.5 6.00024C23.1193 6.00024 22 7.11953 22 8.50024C22 9.88096 23.1193 11.0002 24.5 11.0002Z" fill="${this.colors(0)}"/><path d="M34 16.0002C35.1046 16.0002 36 15.1048 36 14.0002C36 12.8957 35.1046 12.0002 34 12.0002C32.8954 12.0002 32 12.8957 32 14.0002C32 15.1048 32.8954 16.0002 34 16.0002Z" fill="${this.colors(0)}"/><path d="M12 21.0002C13.1046 21.0002 14 20.1048 14 19.0002C14 17.8957 13.1046 17.0002 12 17.0002C10.8954 17.0002 10 17.8957 10 19.0002C10 20.1048 10.8954 21.0002 12 21.0002Z" fill="${this.colors(0)}"/><path d="M17.5 15.0002C18.3284 15.0002 19 14.3287 19 13.5002C19 12.6718 18.3284 12.0002 17.5 12.0002C16.6716 12.0002 16 12.6718 16 13.5002C16 14.3287 16.6716 15.0002 17.5 15.0002Z" fill="${this.colors(0)}"/></svg>`
			}
		}
	}
</script>