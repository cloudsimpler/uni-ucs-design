<template>
	<view class="__ucs-load-more" v-if="props.status != 'none'">
		<ucs-loading class="__ucs-load-more_loading" v-if="props.status == 'loading'"
			:size="getOsFontSize(props.size+2)" :color="props.color" :isLoading="true" />
		<text :style="[getOsTextColor(props.color),getOsTextSize(props.size)]">{{props.statusText[props.status]}}</text>
	</view>
</template>

<script setup lang="uts">
	import { getOsTextColor, getOsTextSize, getOsFontSize } from "@/uni_modules/ucs-config";

	const props = defineProps({
		status: {
			type: String,
			default: "loadmore" // loadmore | loading | nomore
		},
		statusText: {
			type: UTSJSONObject,
			default: {
				'loadmore': '上拉加载更多',
				'loading': '加载中...',
				'nomore': '没有更多了'
			}
		},
		color: {
			type: String,
			default: "grey-6"
		},
		size: {
			type: Number,
			default: 14
		}
	});
</script>

<style lang="scss" scoped>
	.__ucs-load-more {
		padding-top: 16px;
		padding-bottom: 16px;
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
	}

	.__ucs-load-more_loading {
		margin-right: 8px;
	}
</style>