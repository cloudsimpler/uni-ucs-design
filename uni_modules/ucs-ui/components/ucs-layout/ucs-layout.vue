<template>
	<!-- #ifdef UNI-APP-X -->
	<!-- #ifdef APP -->
	<scroll-view class="_ucs-scroll-view" :style="{backgroundColor:props.backgroundColor}">
	<!-- #endif -->
		<!-- #ifndef APP -->
		<view class="_ucs-scroll-view" :style="{backgroundColor:props.backgroundColor}">
		<!-- #endif -->
			<view class="_ucs-rect-header">
				<slot name="header" />
			</view>
			<view :style="{paddingTop:`${headerHeight}px`,paddingBottom:`${footerHeight}px`}">
				<view :style="{minHeight:`${windowHeight- headerHeight - sginHeight- footerHeight}px`}">
					<slot name="default" />
				</view>
				<view class="_ucs-rect-sgin">
					<slot name="sign" />
				</view>
			</view>
			<view class="_ucs-rect-footer">
				<slot name="footer" />
				<view v-if="props.isSafeArea" class="_ucs-rect-SafeArea" />
				<ucs-safe-area :backgroundColor="safeAreaColor" v-if="props.isSafeArea" />
			</view>
		<!-- #ifndef APP -->
		</view>
		<!-- #endif -->
	<!-- #ifdef APP -->
	</scroll-view>
	<!-- #endif -->
	<!-- #endif -->
	<!-- #ifndef UNI-APP-X -->
	<view class="_ucs-scroll-view" :style="{backgroundColor:props.backgroundColor}">
		<view class="_ucs-rect-header">
			<slot name="header" />
		</view>
		<view class="_ucs-rect-main">
			<slot name="default" />
		</view>
		<view class="_ucs-rect-sgin">
			<slot name="sign" />
		</view>
		<view class="_ucs-rect-footer">
			<slot name="footer" />
			<ucs-safe-area :backgroundColor="safeAreaColor" v-if="props.isSafeArea" />
		</view>
	</view>
	<!-- #endif -->
</template>

<script setup lang="uts">
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

	// #ifdef UNI-APP-X
	import { ref, getCurrentInstance, nextTick, watch } from "vue";
	import { defaultConfig } from "@/uni_modules/ucs-config/utssdk/defaultConfig.uts";

	const instance = getCurrentInstance();
	const windowHeight = ref<number>(0);
	const headerHeight = ref<number>(0);
	const sginHeight = ref<number>(0);
	const footerHeight = ref<number>(0);

	const boundingClientRect = () => {
		nextTick(() => {
			// window
			uni.createSelectorQuery().in(instance?.proxy).select('._ucs-scroll-view').boundingClientRect().exec((ret) => {
				windowHeight.value = (ret[0] as NodeInfo).height as number;
			});
			// header
			uni.createSelectorQuery().in(instance?.proxy).select('._ucs-rect-header').boundingClientRect().exec((ret) => {
				headerHeight.value = (ret[0] as NodeInfo).height as number;
			});
			// sgin
			uni.createSelectorQuery().in(instance?.proxy).select('._ucs-rect-sgin').boundingClientRect().exec((ret) => {
				sginHeight.value = (ret[0] as NodeInfo).height as number
			});
			// footer
			uni.createSelectorQuery().in(instance?.proxy).select('._ucs-rect-footer').boundingClientRect().exec((ret) => {
				footerHeight.value = (ret[0] as NodeInfo).height as number
			});
		});
	};

	watch(() : number => defaultConfig.osFontSize, () => {
		boundingClientRect();
	}, {
		immediate: true
	});


	// #endif
</script>

<style lang="scss" scoped>
	// #ifdef UNI-APP-X
	._ucs-scroll-view {
		// #ifdef APP
		flex: 1;
		// #endif
		// #ifndef APP
		min-height: 100%;
		// #endif
	}

	._ucs-rect-header {
		position: fixed;
		top: var(--window-top);
		width: 100%;
		z-index: 3;
	}

	._ucs-rect-footer {
		position: fixed;
		bottom: 0px;
		width: 100%;
		z-index: 3;
	}

	// #endif
	// #ifndef UNI-APP-X
	._ucs-scroll-view {
		min-height: 100%;
		display: flex;
		flex-direction: column;
		position: relative;
	}

	._ucs-rect-header {
		position: sticky;
		z-index: 2;
		top: var(--window-top);
	}

	._ucs-rect-main {
		flex: 1;
		z-index: 1;
		position: relative;
	}

	._ucs-rect-footer {
		position: sticky;
		bottom: 0;
		z-index: 2;
	}

	// #endif
</style>