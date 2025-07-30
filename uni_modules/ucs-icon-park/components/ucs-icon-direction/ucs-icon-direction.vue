<template>
	<ucs-svg :width="getOsFontSize(size)" :height="getOsFontSize(size)" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《方向》图标
	 * @tutorial https://ucs.cloudsimpler.com/library/ucs-iconPark
	 * @property {Number} size 图标大小
	 * @property {Number} strokeWidth 线段粗细
	 * @property {String} theme 图标大小
	 * @property {Array<string>} fill 图标颜色，["外部描边颜色","外部填充颜色","内部描边颜色","内部填充颜色"]
	 * @property {String} strokeLinecap 图标大小
	 * @property {String} strokeLinejoin 图标大小
	 */
	import { colors, IiconParkProps } from "../../mixins/iconParkMixin.uts";
	import { getOsFontSize } from "@/uni_modules/ucs-config"
	import { computed } from "vue";
	
	const props = withDefaults(defineProps<IiconParkProps>(), {
		size: 24,
		strokeWidth: 4,
		theme: 'outline',
		fill: ["#000000"],
		strokeLinecap: 'round',
		strokeLinejoin: 'round'
	});

	const iconSvg = computed(() : string => {
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#icon-e8f83ac7a05e8c)"><rect x="6.00049" y="6" width="36" height="36" rx="3" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}"/><path d="M23.293 10.5649L20.0504 13.8075C19.4204 14.4375 19.8666 15.5146 20.7575 15.5146H27.2428C28.1337 15.5146 28.5798 14.4375 27.9499 13.8075L24.7072 10.5649C24.3167 10.1744 23.6835 10.1744 23.293 10.5649Z" fill="${colors(props.theme, props.fill, 2)}"/><path d="M10.5649 24.707L13.8075 27.9496C14.4375 28.5796 15.5146 28.1334 15.5146 27.2425V20.7572C15.5146 19.8663 14.4375 19.4202 13.8075 20.0501L10.5649 23.2928C10.1744 23.6833 10.1744 24.3165 10.5649 24.707Z" fill="${colors(props.theme, props.fill, 2)}"/><path d="M24.707 37.4351L27.9496 34.1925C28.5796 33.5625 28.1334 32.4854 27.2425 32.4854H20.7572C19.8663 32.4854 19.4202 33.5625 20.0501 34.1925L23.2928 37.4351C23.6833 37.8256 24.3165 37.8256 24.707 37.4351Z" fill="${colors(props.theme, props.fill, 2)}"/><path d="M37.4351 23.293L34.1925 20.0504C33.5625 19.4204 32.4854 19.8666 32.4854 20.7575V27.2428C32.4854 28.1337 33.5625 28.5798 34.1925 27.9499L37.4351 24.7072C37.8256 24.3167 37.8256 23.6835 37.4351 23.293Z" fill="${colors(props.theme, props.fill, 2)}"/></g><defs><clipPath id="icon-e8f83ac7a05e8c"><rect width="48" height="48" fill="${colors(props.theme, props.fill, 2)}"/></clipPath></defs></svg>`
	});
</script>