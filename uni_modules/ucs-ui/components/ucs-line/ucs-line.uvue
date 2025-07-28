<template>
	<view class="__ucs-line">
		<view :style="[getOsBackground(props.color),lineStyle]"></view>
	</view>
</template>

<script setup lang="uts">
	/**
	 * 线条
	 */
	import { getOsBackground } from "@/uni_modules/ucs-config";
	import { computed } from "vue";

	const props = defineProps({
		direction: {
			type: String,
			default: "across"   // vertical、across
		},
		color: {
			type: String,
			default: "grey-3"
		},
		length: {
			type: String,
			default: "100%"
		},
		thick: {
			type: Number,
			default: 1
		}
	});

	const lineStyle = computed(() : UTSJSONObject => {
		if (props.direction == 'across') {
			return { width: `${props.length}`, height: `${props.thick}px` }
		} else {
			return { height: `${props.length}`, width: `${props.thick}px` }
		};
	});
</script>

<style lang="scss">
	.__ucs-line {
		display: flex;
		flex-direction: row;
		justify-content: center;
	}
</style>