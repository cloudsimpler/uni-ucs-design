<template>
	<ucs-svg :width="size" :height="size" :src="iconSvg" />
</template>
<script lang="uts">
	import iconMixin from "../../mixins/iconMixin.uts";
	/**
	 * @description 《药丸2》图标
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
				return `<?xml version="1.0" encoding="UTF-8"?><svg width="${this.size}" height="${this.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.61497 22.5852C4.4434 21.4136 4.4434 19.5141 5.61497 18.3425L18.3429 5.61463C19.5145 4.44305 21.414 4.44305 22.5855 5.61462L42.3845 25.4136C43.5561 26.5852 43.5561 28.4847 42.3845 29.6563L29.6566 42.3842C28.485 43.5557 26.5855 43.5557 25.414 42.3842L5.61497 22.5852Z" fill="${this.colors(1)}" stroke="${this.colors(0)}" stroke-width="${this.strokeWidth}" stroke-linejoin="${this.strokeLinejoin}"/><circle cx="14.8079" cy="20.4648" r="2" transform="rotate(-45 14.8079 20.4648)" fill="${this.colors(2)}"/><circle cx="23.2928" cy="28.9492" r="2" transform="rotate(-45 23.2928 28.9492)" fill="${this.colors(2)}"/><circle cx="19.0501" cy="24.707" r="2" transform="rotate(-45 19.0501 24.707)" fill="${this.colors(2)}"/><circle cx="27.5364" cy="33.1934" r="2" transform="rotate(-45 27.5364 33.1934)" fill="${this.colors(2)}"/><circle cx="20.4642" cy="14.8066" r="2" transform="rotate(-45 20.4642 14.8066)" fill="${this.colors(2)}"/><circle cx="28.95" cy="23.293" r="2" transform="rotate(-45 28.95 23.293)" fill="${this.colors(2)}"/><circle cx="24.7073" cy="19.0508" r="2" transform="rotate(-45 24.7073 19.0508)" fill="${this.colors(2)}"/><circle cx="33.1927" cy="27.5352" r="2" transform="rotate(-45 33.1927 27.5352)" fill="${this.colors(2)}"/></svg>`
			}
		}
	}
</script>