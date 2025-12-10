<template>
	<view :style="{height:`${statusBarHeight}px`}"></view>
</template>

<script setup>
	import {
		ref
	} from 'vue';

	/**
	 * 状态栏
	 */
	const statusBarHeight = ref(25);
	uni.getSystemInfo({
		success: function(res) {
			statusBarHeight.value = res.statusBarHeight
		}
	});
</script>

<style lang="scss">

</style>