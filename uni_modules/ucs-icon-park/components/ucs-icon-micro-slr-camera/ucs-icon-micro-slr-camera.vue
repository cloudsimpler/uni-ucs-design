<template>
	<ucs-svg :width="getOsFontSize(size)" :height="getOsFontSize(size)" :src="iconSvg" />
</template>
<script setup lang="uts">
	/**
	 * @description 《微单》图标
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
		return `<?xml version="1.0" encoding="UTF-8"?><svg width="${props.size}" height="${props.size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M44 26C44 28.6393 43.2696 31.1081 42 33.2152C40.8198 35.1737 39.1737 36.8198 37.2152 38C35.1081 39.2696 32.6393 40 30 40C27.3607 40 24.8919 39.2696 22.7848 38C18.7192 35.5502 16 31.0927 16 26C16 20.9073 18.7192 16.4498 22.7848 14C24.8919 12.7304 27.3607 12 30 12C32.6393 12 35.1081 12.7304 37.2152 14C39.1737 15.1802 40.8198 16.8263 42 18.7848C43.2696 20.8919 44 23.3607 44 26Z" fill="${colors(props.theme, props.fill, 1)}"/><path d="M4 14V38H22.7848C18.7192 35.5502 16 31.0927 16 26C16 20.9073 18.7192 16.4498 22.7848 14H4Z" fill="${colors(props.theme, props.fill, 1)}"/><path d="M37.2152 14C35.1081 12.7304 32.6393 12 30 12C27.3607 12 24.8919 12.7304 22.7848 14M37.2152 14H42V18.7848M37.2152 14C39.1737 15.1802 40.8198 16.8263 42 18.7848M22.7848 14H4V38H22.7848M22.7848 14C18.7192 16.4498 16 20.9073 16 26C16 31.0927 18.7192 35.5502 22.7848 38M37.2152 38C35.1081 39.2696 32.6393 40 30 40C27.3607 40 24.8919 39.2696 22.7848 38M37.2152 38H42V33.2152M37.2152 38C39.1737 36.8198 40.8198 35.1737 42 33.2152M42 18.7848C43.2696 20.8919 44 23.3607 44 26C44 28.6393 43.2696 31.1081 42 33.2152" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><rect x="8" y="9" width="9" height="5" fill="${colors(props.theme, props.fill, 1)}" stroke="${colors(props.theme, props.fill, 0)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M10 22V30" stroke="${colors(props.theme, props.fill, 2)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/><path d="M36 26C36 29.3137 33.3137 32 30 32M24 26C24 22.6863 26.6863 20 30 20" stroke="${colors(props.theme, props.fill, 2)}" stroke-width="${props.strokeWidth}" stroke-linecap="${props.strokeLinecap}" stroke-linejoin="${props.strokeLinejoin}"/></svg>`
	});
</script>