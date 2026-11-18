<template>
	<view class="ucs-skeleton" :flatten="false" :style="skeletonStyle" />
</template>

<script setup>
	import { computed } from 'vue'
	import { getThemeColor } from '../../core/config.js'

	/**
	 * ucs-skeleton 基础骨架占位块，不预设头像、列表、卡片或页面结构。
	 * @description 由页面控制 v-if 和内容替换，不自动关联请求，不提供 loading、插槽、事件或 ref 方法。
	 * 宽高及圆角不随字号缩放；颜色随 core 主题变化。CSS opacity 脉冲动效，无 JS 定时器或尺寸监听。
	 * @property {string} [shape='rect'] rect 矩形、circle 圆形；无效值回退 rect。
	 * @property {string|number} [width=''] 宽度，数字按 px；空值或无效数字时 rect 为 100%，circle 为 40px。允许数字 0。
	 * @property {string|number} [height=16] 矩形高度，数字按 px；无效值回退 16px；circle 忽略此值并跟随 width。
	 * @property {string|number} [radius=4] 矩形圆角，数字按 px；无效值回退 4px；circle 使用 50%。
	 * @property {string|string[]} [color=['gray-3','gray-4']] 占位背景色，支持 core 色阶、外部颜色及明暗数组，直接使用解析结果。
	 * @property {boolean} [animated=true] 是否播放 1.4s 透明度脉冲；关闭后恢复完整不透明度。
	 * @remarks 字符串作为 CSS 长度交给目标平台处理；圆形请使用 px、rpx 等明确长度，百分比宽高可能参照不同父级尺寸。
	 * 布局间距放在原生 view 包装层，不给 ucs-* 使用节点添加 class。默认不接收指针交互。
	 * @example <ucs-skeleton width="80%" :height="16" />
	 * @example <ucs-skeleton shape="circle" :width="48" :animated="false" />
	 */
	const props = defineProps({
		shape: { type: String, default: 'rect' },
		width: { type: [String, Number], default: '' },
		height: { type: [String, Number], default: 16 },
		radius: { type: [String, Number], default: 4 },
		color: { type: [String, Array], default: () => ['gray-3', 'gray-4'] },
		animated: { type: Boolean, default: true }
	})
	/** 有限非负数字转为 px，非空字符串作为 CSS 长度。 */
	function length(value, fallback) {
		if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? `${value}px` : fallback
		return typeof value === 'string' && value.trim() ? value.trim() : fallback
	}
	const skeletonStyle = computed(() => {
		const circle = props.shape === 'circle'
		const width = length(props.width, circle ? '40px' : '100%')
		return {
			width,
			height: circle ? width : length(props.height, '16px'),
			borderRadius: circle ? '50%' : length(props.radius, '4px'),
			backgroundColor: getThemeColor(props.color),
			animationName: props.animated ? 'ucs-skeleton-pulse' : 'none'
		}
	})
</script>

<style>
	.ucs-skeleton { flex-shrink: 0; opacity: 1; pointer-events: none; animation-duration: 1.4s; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
	@keyframes ucs-skeleton-pulse {
		0% { opacity: 1; }
		50% { opacity: 0.45; }
		100% { opacity: 1; }
	}
</style>
