<template>
	<!-- #ifdef UNI-APP-X -->
	<!-- #ifdef APP -->
	<scroll-view class="_ucs-scroll-view" :style="{backgroundColor:getOsColor(props.backgroundColor)}">
	<!-- #endif -->
		<!-- #ifndef APP -->
		<view class="_ucs-scroll-view" :style="{backgroundColor:getOsColor(props.backgroundColor)}">
		<!-- #endif -->
			<view class="_ucs-rect-header" :class="{'_ucs-rect-header-change':headerHeight!=0}">
				<slot name="header" />
			</view>
			<view :style="{paddingTop:`${headerHeight}px`,paddingBottom:`${footerHeight}px`}">
				<view :style="{minHeight:`${windowHeight- headerHeight - sginHeight- footerHeight}px`}">
					<slot name="default" />
				</view>
				<view class="_ucs-rect-sgin" :style="{opacity: sginHeight}">
					<slot name="sign" />
				</view>
			</view>
			<view class="_ucs-rect-footer">
				<slot name="footer" />
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
	<view class="_ucs-scroll-view" :style="{backgroundColor:getOsColor(props.backgroundColor)}">
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

	// #ifdef UNI-APP-X
	import { ref, getCurrentInstance, watch } from "vue";
	import { defaultConfig } from "@/uni_modules/ucs-config/utssdk/defaultConfig.uts";
	import { getOsColor } from "@/uni_modules/ucs-config/index";

	const instance = getCurrentInstance();
	const numberChange = ref<number>(0);
	const windowHeight = ref<number>(0);
	const headerHeight = ref<number>(0);
	const sginHeight = ref<number>(0);
	const footerHeight = ref<number>(0);

	// 元素节点查询
	const boundingClientRect = () => {
		// header
		uni.createSelectorQuery().in(instance?.proxy).select('._ucs-rect-header').boundingClientRect().exec((ret) => {
			headerHeight.value = (ret[0] as NodeInfo).height as number;
		});
		// sgin
		uni.createSelectorQuery().in(instance?.proxy).select('._ucs-rect-sgin').boundingClientRect().exec((ret) => {
			sginHeight.value = (ret[0] as NodeInfo).height as number;
		});
		// footer
		uni.createSelectorQuery().in(instance?.proxy).select('._ucs-rect-footer').boundingClientRect().exec((ret) => {
			footerHeight.value = (ret[0] as NodeInfo).height as number;
		});
	};
	// 字体大小改变
	watch(() : number => defaultConfig.osFontSize, () => {
		boundingClientRect();
	});

	// 判断数值是否在某个中心值上下一定范围内
	const isAround = (num : number, center : number, range : number) : boolean => {
		return num >= center - range && num <= center + range;
	};

	// 为了处理各端延迟获取不正确问题
	watch(() : number => numberChange.value, () => {
		nextTick(() => {
			uni.createSelectorQuery().in(instance?.proxy).select('._ucs-scroll-view').boundingClientRect().exec((ret) => {
				const windowHeightTemp = (ret[0] as NodeInfo).height as number;
				// #ifdef APP
				if (isAround(windowHeightTemp, uni.getWindowInfo().windowHeight, 5)) {
					windowHeight.value = windowHeightTemp - 0.1;
					boundingClientRect();
				} else {
					setTimeout(() => {
						numberChange.value += 1;
					}, 69);
				};
				// #endif
				// #ifndef APP
				windowHeight.value = windowHeightTemp;
				boundingClientRect();
				// #endif
			});
		})
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

	._ucs-rect-sgin {
		transition: opacity 0.3s ease;
	}

	._ucs-rect-header-change {
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