<template>
	<view class="__ucs-card" :style="[getOsBackground('grey-1')]">
		<!-- 上 -->
		<view :class="{'padding':slots['header'] != null && props.isPadding}">
			<slot name="header" />
		</view>
		<ucs-line :length="props.lineLength" :color="props.lineColor" v-if="slots['header'] != null && props.isLine" />
		<!-- 中 -->
		<view :class="{'padding':props.isPadding}">
			<slot />
		</view>
		<ucs-line :length="props.lineLength" :color="props.lineColor" v-if="slots['footer'] != null && props.isLine" />
		<!-- 下 -->
		<view :class="{'padding':slots['footer'] != null && props.isPadding}">
			<slot name="footer" />
		</view>
	</view>
</template>

<script setup lang="uts">
	/**
	 * 卡片
	 */
	import { getOsBackground } from "@/uni_modules/ucs-config";
	import { useSlots } from "vue";

	const slots = useSlots();

	const props = defineProps({
		isPadding: {
			type: Boolean,
			default: true
		},
		isLine: {
			type: Boolean,
			default: true
		},
		lineLength: {
			type: String,
			default: "95%"
		},
		lineColor: {
			type: String,
			default: "grey-3"
		}
	});
</script>

<style lang="scss">
	.__ucs-card {
		margin: 12px 12px 0;
		border-radius: 10px;
		overflow: hidden;

		.padding {
			padding: 12px;
		}
	}
</style>