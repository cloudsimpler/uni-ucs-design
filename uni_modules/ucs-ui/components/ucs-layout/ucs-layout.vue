<template>
	<view class="_ucs-layout-module" :style="{backgroundColor:getOsColor(props.backgroundColor)}">
		<view class="_ucs-layout-header">
			<slot name="header" />
		</view>
		<view class="_ucs-layout-main">
			<slot name="default" />
		</view>
		<view class="_ucs-layout-sign">
			<slot name="sign" />
		</view>
		<view class="_ucs-layout-footer">
			<slot name="footer" />
			<ucs-safe-area :backgroundColor="safeAreaColor" v-if="props.isSafeArea" />
		</view>
	</view>
</template>

<script setup lang="uts">
	import { nextTick } from "vue";
	const props = defineProps({
		backgroundColor: {
			type: String,
			default: "transparent"
		},
		isSafeArea: {
			type: Boolean,
			default: true
		},
		safeAreaColor: {
			type: String,
			default: "transparent"
		}
	});
</script>

<style lang="scss" scoped>
	._ucs-layout-module {
		min-height: 100%;
		display: flex;
		flex-direction: column;
		position: relative;
	}

	._ucs-layout-header {
		position: sticky;
		z-index: 2;
		top: var(--window-top);
	}

	._ucs-layout-main {
		flex: 1;
		z-index: 1;
		position: relative;
	}

	._ucs-layout-footer {
		position: sticky;
		bottom: 0;
		z-index: 2;
	}
</style>