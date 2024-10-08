<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script lang="uts">
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《整形科》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.036 44C18.0561 40.8044 16.5778 38.422 14.6011 36.8531C11.636 34.4996 6.92483 35.9623 5.18458 33.5347C3.44433 31.1072 6.40382 26.6429 7.44234 24.0089C8.48086 21.3748 3.46179 20.4434 4.04776 19.6957C4.43842 19.1971 6.97471 17.7586 11.6567 15.38C12.987 7.79332 17.9008 4 26.3982 4C39.1441 4 44 14.8059 44 21.6789C44 28.5518 38.1201 35.9562 29.7441 37.5527C28.9951 38.6434 30.0754 40.7926 32.9848 44" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M21.0218 4.58984C19.8339 9.81843 19.8339 13.8867 21.0218 16.7948C22.8038 21.1568 30.6808 20.4866 30.6808 24.5563C30.6808 28.626 26.0911 29.4084 26.7035 32.2319C27.1118 34.1142 28.02 36.5555 29.4279 39.5558" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/><path d="M17 30.5508C17.2354 30.5508 19.4004 30.4124 20.9589 28.7992C21.9979 27.7237 22.5173 26.4573 22.5173 25" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/></svg>`
			}
		}
	}
</script>