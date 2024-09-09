<template>
	<ucs-iconPark :width="size" :height="size" :src="iconSvg" />
</template>
<script>
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《电话错过》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.9961 8.68583C16.7227 8.68583 17.3921 9.07985 17.7448 9.71509L20.1912 14.1219C20.5115 14.6989 20.5266 15.3968 20.2314 15.9871L17.8746 20.7008C17.8746 20.7008 18.5576 24.2122 21.416 27.0706C24.2744 29.929 27.7741 30.6002 27.7741 30.6002L32.487 28.2438C33.0777 27.9484 33.7761 27.9637 34.3533 28.2846L38.7726 30.7416C39.4072 31.0945 39.8008 31.7635 39.8008 32.4896L39.8008 37.5631C39.8008 40.1468 37.4009 42.0129 34.9528 41.1868C29.9249 39.4903 22.1202 36.2601 17.1734 31.3132C12.2265 26.3664 8.99631 18.5617 7.29977 13.5338C6.47375 11.0857 8.33984 8.68583 10.9235 8.68583L15.9961 8.68583Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linejoin="${this.strokeLinejoin}"/><rect opacity="0.01" x="28" y="7" width="13" height="13" fill="${this.colors(2)}"/><path d="M39 9L30 18" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M30 9L39 18" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>