<template>
	<ucs-iconPark :width="size" :height="size" :src="iconSvg" />
</template>
<script lang="uts">
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《牙齿》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M13.1172 5H14.0026C18.6687 5.68989 19.9341 8.33825 24.0003 8.33825C28.0664 8.33825 29.3314 5.69005 33.9978 5H34.5003C39.747 5 44.0003 9.25329 44.0003 14.5V15.1259C44.0003 18.0287 40.9091 21.3433 40.0003 24.4829C39.035 27.8174 38.3737 30.5425 38.1796 33.3943C37.7248 40.0751 35.447 43 33.0003 43C29.3465 43 26.1017 28.0251 24.0627 28.0251C22.0237 28.0251 17.9776 43 15.0003 43C13.1832 43 10.8293 41.9254 9.94554 33.3943C9.59391 30 9.00122 27.9407 8.00028 24.4829C7.1205 21.4437 4.15199 17.8111 4.00028 14.5511C3.76597 9.51593 7.65782 5.24419 12.693 5.00988C12.8343 5.00331 12.9757 5.00002 13.1172 5Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}"/><path d="M15.4824 12.4634L32.0005 17.7887" stroke="${this.colors(2)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/><path d="M15.4824 17.7886L32.0005 12.4632" stroke="${this.colors(2)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/></svg>`
			}
		}
	}
</script>