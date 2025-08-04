<template>
	<view :style="[lineStyle]"></view>
</template>

<script setup>
	/**
	* 间隔
	*/
	import { computed } from "vue";

	const props = defineProps({
		height: {
			type: Number,
			default: 0
		},
		width: {
			type: Number,
			default: 0
		}
	});

	const lineStyle = computed(() : UTSJSONObject => {
		if (props.height != 0) {
			return { height: `${props.height}px` }
		} else {
			return { width: `${props.width}px` }
		};
	});
</script>

<style>

</style>