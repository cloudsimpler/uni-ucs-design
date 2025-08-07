<template>
	<view class="__ucs-navigation-bar" :style="[getOsBackground(props.backgroundColor)]">
		<text class="_title" :style="[getOsTextColor(props.color),getOsTextSize(props.size)]">
			{{props.title}}
		</text>
	</view>
</template>

<script setup lang="uts">
	/**
	* 间隔
	*/
	import { computed } from "vue";
	import { getOsBackground, getOsTextColor, getOsTextSize } from "@/uni_modules/ucs-config";

	const props = defineProps({
		backgroundColor: {
			type: String,
			default: "grey-1"
		},
		title: {
			type: String,
			default: "导航栏标题"
		},
		color: {
			type: String,
			default: "grey-12"
		},
		size: {
			type: Number,
			default: 16
		}
	});
</script>

<style lang="scss">
	.__ucs-navigation-bar {
		padding-top: var(--status-bar-height);
		display: flex;
		flex-direction: row;

		._title {
			padding: 12px 24px;
			font-weight: bold;
			width: 100%;
			text-align: center;
			/* #ifdef UNI-APP-X && APP */
			overflow: hidden;
			text-overflow: ellipsis;
			lines: 1;
			/* #endif */
			/* #ifndef UNI-APP-X && APP */
			overflow: hidden;
			display: -webkit-box;
			-webkit-box-orient: vertical;
			-webkit-line-clamp: 1;
			/* #endif */
		}
	}
</style>