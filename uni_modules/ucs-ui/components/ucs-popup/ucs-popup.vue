<template>
	<view v-if="ifShow" class="__ucs-popup-mask" :class="[ifShowMask?'mask':'transparent']" @tap="onMask">
		<view v-if="props.direction == 'center'" class="__ucs-popup-center" :style="_location" @tap.stop>
			<view :style="[getOsBackground(props.backgroundColor),{borderRadius:`${props.borderRadius}px`}]">
				<slot></slot>
			</view>
		</view>
		<view v-else @tap.stop class="__ucs-popup-content" :style="[_location,getOsBackground(props.backgroundColor)]">
			<slot></slot>
		</view>
	</view>
</template>

<script setup lang="uts">
	/**
	 * 弹出层
	 * @description 用于弹出窗口
	 * @tutorial 
	 * @property {Boolean} isShow 是否显示
	 * @property {String} direction = [top | bottom | left | right | center] 弹出层方向
	 * @property {Boolean} isMaskClose 点击遮罩层是否可关闭
	 * @property {String} backgroundColor 背景颜色
	 * @property {Number} borderRadius 圆角
	 * @event {Function} change 显示和关闭时触发，回调当前isShow状态
	 */
	import {
		computed,
		ref,
		watch
	} from "vue";
	import {
		getOsBackground
	} from "@/uni_modules/ucs-config";

	const props = defineProps({
		isShow: {
			type: Boolean,
			default: false
		},
		direction: {
			type: String,
			default: 'bottom'
		},
		isMaskClose: {
			type: Boolean,
			default: true
		},
		backgroundColor: {
			type: String,
			default: 'grey-1'
		},
		borderRadius: {
			type: Number,
			default: 12
		}
	});

	const ifShow = ref(false);
	const ifShowMask = ref(false)
	const translateValue = ref(-100);
	const scaleValue = ref(0);
	const ifToggle = ref(false);

	const emits = defineEmits(['change']);

	const _location = computed(() : string => {
		const positionValue = {
			top: `top:0;width:100%;transform:translateY(${translateValue.value}%);borderRadius:0px 0px ${props.borderRadius}px ${props.borderRadius}px;`,
			bottom: `bottom:0;width:100%;transform:translateY(${-translateValue.value}%);borderRadius:${props.borderRadius}px ${props.borderRadius}px 0px 0px;`,
			left: `left:0;top:0;bottom:0;transform:translateX(${translateValue.value}%);borderRadius:0px ${props.borderRadius}px ${props.borderRadius}px 0px;`,
			right: `right:0;top:0;bottom:0;transform:translateX(${-translateValue.value}%);borderRadius:${props.borderRadius}px 0px 0px ${props.borderRadius}px;`,
			center: `transform:scale(${scaleValue.value});opacity:${scaleValue.value};`
		};
		return positionValue[props.direction] as string;
	});

	const show = () => {
		ifShow.value = true;
		emits("change", true);
		setTimeout(() => {
			translateValue.value = 0;
			scaleValue.value = 1;
			ifToggle.value = true;
			ifShowMask.value = true;
		}, 99);
	};

	const close = () => {
		if (!ifToggle.value) return;
		translateValue.value = -100;
		scaleValue.value = 0;
		ifShowMask.value = false;
		setTimeout(() => {
			ifToggle.value = false;
			ifShow.value = false;
			emits("change", false);
		}, 300);
	};

	const onMask = () => {
		if (props.isMaskClose) {
			close()
		};
	}

	// 暴露方法
	defineExpose({
		show,
		close
	})

	watch(() : boolean => props.isShow, (newVal : boolean) => {
		if (newVal) {
			show();
		} else {
			close();
		}
	})
</script>

<style lang="scss">
	.__ucs-popup-mask {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		background-color: transparent;
		transition: background-color .3s ease;
		overflow: hidden;
		z-index: 995;

		&.mask {
			background-color: rgba(0, 0, 0, 0.25);
		}

		&.transparent {
			background-color: transparent;
		}
	}

	.__ucs-popup-center {
		position: fixed;
		z-index: 996;
		overflow: hidden;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		display: flex;
		justify-content: center;
		align-items: center;
		transition: all .3s ease;
	}

	.__ucs-popup-content {
		position: fixed;
		z-index: 996;
		transition: transform .3s ease;
		overflow: hidden;
	}
</style>