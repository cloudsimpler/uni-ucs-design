<template>
	<view>
		<text class="__ucs-icon">{{iconText}}</text>
	</view>
</template>

<script setup lang="uts">
	const iconText = "\ueaa2"

	const props = defineProps({
		name: {
			type: String,
			default: "left"
		},
		size: {
			type: Number,
			default: 16
		},
		color: {
			type: String,
			default: 'grey-12'
		}
	});
</script>

<style lang="scss">
	@font-face {
		font-family: ucs-iconfont;
		src: url('./iconfont/iconfont.ttf');
	}

	.__ucs-icon {
		font-family: ucs-iconfont;
	}
</style>