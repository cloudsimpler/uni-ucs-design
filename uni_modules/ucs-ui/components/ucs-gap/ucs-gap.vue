<template>
	<view :style="[lineStyle]"></view>
</template>

<script setup lang="uts">
	/**
	* 间隔
	*/
	import { computed } from "vue";

	const props = defineProps({
		height: {
			type: [Number,String],
			default: 0
		},
		width: {
			type: [Number,String],
			default: 0
		}
	});

	const lineStyle = computed(() : UTSJSONObject => {
		if (props.height != 0) {
			return { height: `${props.height}` }
		} else {
			return { width: `${props.width}` }
		};
	});
</script>

<style>

</style>