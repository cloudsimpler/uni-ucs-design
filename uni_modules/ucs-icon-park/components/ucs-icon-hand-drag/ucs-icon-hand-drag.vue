<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script lang="uts">
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《手动拖动》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.58303 27.1824C7.86719 28.3542 7.00928 30.2934 7.00928 33.0002C7.00928 37.0602 12.0001 44.0002 16.5006 44.0002C21.001 44.0002 23.6111 44.0002 28.016 44.0002C32.421 44.0002 35.0965 40.1495 35.0965 37.0602C35.0965 32.9069 35.0965 28.7536 35.0965 24.6002C35.0965 22.8072 33.6456 21.3522 31.8525 21.3472C30.0659 21.3422 28.6135 22.7865 28.6085 24.5731C28.6085 24.5761 28.6085 24.5791 28.6085 24.5821V24.6836" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/><path d="M10.9814 29.4453V7.66246C10.9814 5.88568 12.4218 4.44531 14.1986 4.44531C15.9754 4.44531 17.4157 5.88568 17.4157 7.66246V23.6479" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/><path d="M17.4155 24.0001V19.8076C17.4155 18.2589 18.671 17.0034 20.2197 17.0034C21.7684 17.0034 23.0239 18.2589 23.0239 19.8076V24.4272" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M23 24.6583V21.8076C23 20.2589 24.2555 19.0034 25.8042 19.0034C27.3529 19.0034 28.6084 20.2589 28.6084 21.8076V25.0034" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M11 8H41" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}"/><path d="M36 12.5L37.6667 11L41 8L37.6667 5L36 3.5" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>