<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script lang="uts">
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《救生圈》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M38.1421 38.1421C45.9526 30.3316 45.9526 17.6684 38.1421 9.85786C30.3316 2.04738 17.6684 2.04738 9.85786 9.85786C2.04738 17.6684 2.04738 30.3316 9.85786 38.1421C17.6684 45.9526 30.3316 45.9526 38.1421 38.1421ZM32.4853 15.5147C37.1716 20.201 37.1716 27.799 32.4853 32.4853C27.799 37.1716 20.201 37.1716 15.5147 32.4853C10.8284 27.799 10.8284 20.201 15.5147 15.5147C20.201 10.8284 27.799 10.8284 32.4853 15.5147Z" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M38.142 38.1421L32.4851 32.4852" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M9.85791 38.1421L15.5148 32.4852" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M9.85791 9.85791L15.5148 15.5148" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M38.142 9.85791L32.4851 15.5148" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/><path d="M32.4853 32.4853C37.1716 27.799 37.1716 20.201 32.4853 15.5147C27.799 10.8284 20.201 10.8284 15.5147 15.5147C10.8284 20.201 10.8284 27.799 15.5147 32.4853C20.201 37.1716 27.799 37.1716 32.4853 32.4853Z" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linecap="${this.strokeLinecap}" stroke-linejoin="${this.strokeLinejoin}"/></svg>`
			}
		}
	}
</script>