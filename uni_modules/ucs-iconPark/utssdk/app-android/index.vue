<template>
	<view></view>
</template>
<script lang="uts">
	import SVGImageView from 'com.caverock.androidsvg.SVGImageView';
	import SVG from 'com.caverock.androidsvg.SVG';

	export default {
		name: "ucs-iconPark-svg",
		props: {
			src: {
				type: String,
				default: ''
			},
		},
		data() {
			return {}
		},
		methods: {
			resetSource(newPath : string) {
				if (newPath.startsWith('<')) {
					this.$el?.setSVG(SVG.getFromString(newPath))
				}
			}
		},
		watch: {
			"src": {
				handler(path : string) {
					this.resetSource(path)
				},
				immediate: true
			}
		},
		NVLoad() : SVGImageView {
			return new SVGImageView(this.$androidContext)
		}
	}
</script>