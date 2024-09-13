<template>
	<ucs-iconPark :width="size" :height="size" :src="iconSvg" />
</template>
<script lang="uts">
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《大虾》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20.6234 11H38.9996C38.9996 11 38.9996 16 35.9996 19C32.9996 22 30 23 29 23C28 23 18.5 24 16 26C13.5 28 12.0011 31.5 16 35C19.9989 38.5 27 40 32 38C37 36 40.0001 30 40.0001 30L44 40C44 40 36 43 28.9997 44C21.9993 45 15.0001 44 8.99972 38C2.99935 32 1.99903 24.5 6.99932 18C11.1656 12.5842 17.4139 11.3337 19.3823 11.0673C19.7947 11.0114 20.2072 11 20.6234 11Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M26 23L20 11" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}"/><path d="M18 4H32C35.866 4 39 7.13401 39 11V11" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><circle cx="30" cy="16" r="2" fill="${this.colors(2)}"/></svg>`
			}
		}
	}
</script>