<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script lang="uts">
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《脸书》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M4.11111 46C2.94518 46 2 45.0496 2 43.8773V4.12274C2 2.95038 2.94518 2 4.11111 2H43.8889C45.0548 2 46 2.95038 46 4.12274V43.8773C46 45.0496 45.0548 46 43.8889 46C42.4815 46 29.2222 46 4.11111 46Z" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path fill-rule="evenodd" clip-rule="evenodd" d="M38.6617 17.8869H34.3076H33.7932C32.4431 17.8869 31.3487 18.9814 31.3487 20.3314V25.2217H38.6617L37.5907 32.5525H31.3487V46H23.3067V32.5525H16.667V25.2217H23.2209L23.3067 18.2633L23.2828 15.7694C23.249 12.2477 26.0764 9.36542 29.5981 9.33159C29.6185 9.3314 29.6389 9.3313 29.6593 9.3313H38.6617V17.8869Z" fill="${this.colors(0)}"/></svg>`
			}
		}
	}
</script>