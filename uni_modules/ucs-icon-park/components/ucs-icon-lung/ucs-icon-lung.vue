<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script lang="uts">
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《肺》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18.2442 22.263C17.9517 17.3076 16.7773 14.7417 14.7208 14.5654C11.4002 14.2807 6.31025 19.7086 4.80125 27.3367C3.29225 34.9648 4.03742 40.4289 6.01197 40.7978C7.98652 41.1667 10.8556 39.0174 12.2168 39.0174C13.578 39.0174 18.2958 40.0579 18.2958 38.1732C18.2958 37.2445 18.2958 34.9908 18.2958 30.0702" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/><path d="M29.6236 22.3707C29.9054 17.3447 31.0819 14.7429 33.1532 14.5654C36.4739 14.2807 41.5638 19.7086 43.0728 27.3367C44.5818 34.9648 43.8366 40.4289 41.8621 40.7978C39.8875 41.1667 37.0184 39.0174 35.6573 39.0174C34.2961 39.0174 29.5782 40.0579 29.5782 38.1732C29.5782 37.2467 29.5782 34.9702 29.5782 30.0702" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/><path d="M20.5557 5V19.9106C20.5121 22.2021 18.6 23.3478 14.8193 23.3478" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/><path d="M27.292 5V19.9106C27.3355 22.2021 29.2476 23.3478 33.0283 23.3478" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/><path d="M15 30.0704C18.9553 30.0704 21.9553 29.1311 24 27.2524C26.0594 29.1311 29.069 30.0704 33.0286 30.0704" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>