<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script lang="uts">
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《鲸鱼》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.0691 13C6.25336 13.3494 4.67583 21.0064 5.11403 24.7913C3.36116 27.9356 3.89597 28.7217 5.2104 30.0319C11.7835 36.1459 24.0534 35.7092 29.75 33.5256C35.7096 31.08 38.7486 26.4747 39.0407 24C44.2991 20.5063 44.4063 14.6013 43.676 13C42.896 14.3101 40.6474 15.2721 39.0407 16C37.2879 16.3494 34.7659 15.038 34.0355 13.8734C33.5343 16.5 34.0355 18.5 35.3501 19.5507C37.6376 21.2976 36.4754 23.0633 36.0372 23.5C34.1405 25.3902 30.5308 24.4905 28.7771 21.7343C24.0533 14.3101 18.9905 13 16.0691 13Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M5 28C7.83333 28.5321 13.4 29.5542 17 27" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><circle cx="12" cy="20" r="2" fill="${this.colors(2)}"/></svg>`
			}
		}
	}
</script>