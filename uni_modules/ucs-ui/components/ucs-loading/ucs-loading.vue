<template>
	<view class="__ucs-loading" :class="props.isLoading?'__is-loading':''">
		<ucs-svg :style="{'transform':`rotate(${rotation}deg)`}" :width="props.size" :height="props.size"
			:src="iconSvg" />
	</view>
</template>

<script setup lang="uts">
	import { generateColorGradient } from "./utils.uts";
	import { getOsColor } from "@/uni_modules/ucs-config";
	import { ref, computed, watch, onUnmounted } from "vue";

	const props = defineProps({
		isLoading: {
			type: Boolean,
			default: false
		},
		size: {
			type: Number,
			default: 16
		},
		color: {
			type: String,
			default: "primary"
		},
		speed: {
			type: Number,
			default: 6
		}
	});

	const iconSvg = computed(() : string => {
		const colorArray = generateColorGradient(getOsColor(props.color));
		return `<?xml version="1.0" standalone="no"?> <svg t="1753085936545" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3627" xmlns:xlink="http://www.w3.org/1999/xlink" width="${props.size}" height="${props.size}"> <path d="M512 61.44a40.96 40.96 0 0 1 40.96 40.96v122.88a40.96 40.96 0 1 1-81.92 0V102.4A40.96 40.96 0 0 1 512 61.44z" fill="${colorArray[11]}" p-id="3628"></path> <path d="M737.28 121.792a40.96 40.96 0 0 1 14.976 55.936l-61.44 106.432a40.96 40.96 0 1 1-70.912-40.96l61.44-106.432a40.96 40.96 0 0 1 55.936-14.976z" fill="${colorArray[10]}" p-id="3629"></path> <path d="M902.208 286.72a40.96 40.96 0 0 1-14.976 55.936l-106.432 61.44a40.96 40.96 0 0 1-40.96-70.912l106.432-61.44a40.96 40.96 0 0 1 55.936 14.976z" fill="${colorArray[9]}" p-id="3630"></path> <path d="M962.56 512a40.96 40.96 0 0 1-40.96 40.96h-122.88a40.96 40.96 0 0 1 0-81.92h122.88a40.96 40.96 0 0 1 40.96 40.96z" fill="${colorArray[8]}" p-id="3631"></path> <path d="M902.208 737.28a40.96 40.96 0 0 1-55.936 14.976l-106.432-61.44a40.96 40.96 0 1 1 40.96-70.912l106.432 61.44a40.96 40.96 0 0 1 14.976 55.936z" fill="${colorArray[7]}" p-id="3632"></path> <path d="M737.28 902.208a40.96 40.96 0 0 1-55.936-14.976l-61.44-106.432a40.96 40.96 0 0 1 70.912-40.96l61.44 106.432a40.96 40.96 0 0 1-14.976 55.936z" fill="${colorArray[6]}" p-id="3633"></path> <path d="M512 962.56a40.96 40.96 0 0 1-40.96-40.96v-122.88a40.96 40.96 0 0 1 81.92 0v122.88a40.96 40.96 0 0 1-40.96 40.96z" fill="${colorArray[5]}" p-id="3634"></path> <path d="M286.72 902.208a40.96 40.96 0 0 1-14.976-55.936l61.44-106.432a40.96 40.96 0 1 1 70.912 40.96l-61.44 106.432a40.96 40.96 0 0 1-55.936 14.976z" fill="${colorArray[4]}" p-id="3635"></path> <path d="M121.792 737.28a40.96 40.96 0 0 1 14.976-55.936l106.432-61.44a40.96 40.96 0 0 1 40.96 70.912l-106.432 61.44a40.96 40.96 0 0 1-55.936-14.976z" fill="${colorArray[3]}" p-id="3636"></path> <path d="M61.44 512a40.96 40.96 0 0 1 40.96-40.96h122.88a40.96 40.96 0 1 1 0 81.92H102.4A40.96 40.96 0 0 1 61.44 512z" fill="${colorArray[2]}" p-id="3637"></path> <path d="M121.792 286.72a40.96 40.96 0 0 1 55.936-14.976l106.432 61.44a40.96 40.96 0 1 1-40.96 70.912l-106.432-61.44a40.96 40.96 0 0 1-14.976-55.936z" fill="${colorArray[1]}" p-id="3638"></path> <path d="M286.72 121.792a40.96 40.96 0 0 1 55.936 14.976l61.44 106.432a40.96 40.96 0 0 1-70.912 40.96l-61.44-106.432a40.96 40.96 0 0 1 14.976-55.936z" fill="${colorArray[0]}" p-id="3639"></path> </svg>`
	});

	let rotation = ref(0);
	let animationId : number | null = null;

	// 旋转动画函数
	let startRequestAnimationFrame : (() => void) | null = null;
	startRequestAnimationFrame = () => {
		animationId = requestAnimationFrame(() => {
			rotation.value = rotation.value + props.speed;
			startRequestAnimationFrame?.()
		})
	};

	watch(() : boolean => props.isLoading, (newVal : boolean) => {
		// #ifdef UNI-APP-X && (APP || WEB)
		if (newVal == true) {
			startRequestAnimationFrame?.()
		} else {
			if (animationId != null) {
				cancelAnimationFrame(animationId as number)
			};
		}
		// #endif
	}, {
		immediate: true
	});

	onUnmounted(() => {
		if (animationId != null) {
			cancelAnimationFrame(animationId as number)
		}
	})
</script>

<style lang="scss" scoped>
	// #ifndef UNI-APP-X && (APP || WEB)
	@keyframes spin {
		from {
			transform: rotate(0deg);
		}

		to {
			transform: rotate(360deg);
		}
	}

	.__is-loading {
		animation: spin 1s linear infinite;
	}

	// #endif

	.__ucs-loading {
		display: flex;
		justify-content: center;
		align-items: center;
	}
</style>