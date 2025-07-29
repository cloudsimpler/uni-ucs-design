<template>
	<text :style="[textStyle]">
		<slot></slot>
	</text>
</template>

<script setup>
	/**
	* 文本
	*/
	import { computed } from "vue";
	import { getOsColor, getOsFontSize } from "@/uni_modules/ucs-config";

	const props = defineProps({
		color: {
			type: String,
			default: "grey-12"   // vertical、across
		},
		size: {
			type: Number,
			default: 14
		}
	});

	const textStyle = computed(() : UTSJSONObject => {
		return {
			color: `${getOsColor(props.color)}`,
			fontSize: `${getOsFontSize(props.size)}px`
		}
	});
</script>

<style>

</style>