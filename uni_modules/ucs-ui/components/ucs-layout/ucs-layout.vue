<template>
	<!-- #ifdef UNI-APP-X && APP -->
	<scroll-view class="_ucs-scroll-view" :style="{backgroundColor:props.backgroundColor,paddingTop:`${props.headerHeight+(slots['header'] != null?distanceTop:0)}px`,paddingBottom:`${props.footerHeight + (props.isSafeArea?distanceBottom:0)}px`}">
	<!-- #endif -->
		<!-- #ifndef UNI-APP-X && APP -->
		<view class="_ucs-scroll-view" :style="{backgroundColor:props.backgroundColor,paddingTop:`${props.headerHeight+(slots['header'] != null?distanceTop:0)}px`,paddingBottom:`${props.footerHeight + (props.isSafeArea?distanceBottom:0)}px`}">
		<!-- #endif -->
			<view class="_ucs-layout-header" :style="{'height':`${props.headerHeight + (slots['header'] != null?distanceTop:0)}px`}">
				<slot name="header" />
			</view>
			<view :style="{minHeight:`${windowHeight - (props.headerHeight+(slots['header'] != null?distanceTop:0)) - props.sginHeight- (props.footerHeight + (props.isSafeArea?distanceBottom:0))}px`}">
				<slot name="default" />
			</view>
			<view class="_ucs-layout-sgin" :style="{'height':`${props.sginHeight}px`}">
				<slot name="sign" />
			</view>
			<view class="_ucs-layout-footer" :style="{'height':`${props.footerHeight + (props.isSafeArea?distanceBottom:0)}px`}">
				<slot name="footer" />
				<ucs-safe-area :backgroundColor="safeAreaColor" v-if="props.isSafeArea" />
			</view>
		<!-- #ifndef UNI-APP-X && APP -->
		</view>
		<!-- #endif -->
	<!-- #ifdef UNI-APP-X && APP -->
	</scroll-view>
	<!-- #endif -->
</template>

<script setup lang="uts">
	import { useSlots } from "vue";
	import { getCurrentPagesUcsStyle } from "@/uni_modules/ucs-config/index";
	const slots = useSlots();
	
	const ucsStyle = getCurrentPagesUcsStyle();
	const windowHeight = ucsStyle['windowHeight'] as number;
	const distanceBottom = ucsStyle['distanceBottom'] as number;
	const distanceTop = ucsStyle['distanceTop'] as number;

	const props = defineProps({
		backgroundColor: {
			type: String,
			default: "transparent"
		},
		headerHeight: {
			type: Number,
			default: 0
		},
		footerHeight: {
			type: Number,
			default: 0
		},
		sginHeight: {
			type: Number,
			default: 0
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
	._ucs-scroll-view {
		// #ifdef UNI-APP-X && APP
		flex: 1;
		// #endif
		// #ifndef UNI-APP-X && APP
		min-height: 100%;
		// #endif
	}

	._ucs-layout-header {
		position: fixed;
		top: var(--window-top);
		width: 100%;
		z-index: 3;
		overflow: hidden;
	}

	._ucs-layout-sgin {
		overflow: hidden;
	}

	._ucs-layout-footer {
		position: fixed;
		bottom: 0px;
		width: 100%;
		z-index: 3;
		overflow: hidden;
	}
</style>