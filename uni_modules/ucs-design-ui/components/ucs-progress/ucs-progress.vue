<template>
	<view v-if="props.type === 'circle'" class="ucs-progress ucs-progress--circle" :style="circleStyle">
		<image class="ucs-progress__ring" :src="circleSource" :style="circleStyle" mode="aspectFit" />
		<view class="ucs-progress__center"><slot :percent="progress" /></view>
	</view>
	<view v-else class="ucs-progress ucs-progress--line" :style="trackStyle">
		<view class="ucs-progress__fill" :style="fillStyle" />
	</view>
</template>

<script setup>
	import { computed } from 'vue'
	import { getThemeColor } from '../../core/config.js'
	import { getProgressSource } from './svg.js'

	defineOptions({ options: { virtualHost: true } })

	/**
	 * ucs-progress 确定进度反馈，不关联请求或推断任务状态。
	 * @description 条形使用 CSS 宽度；环形使用静态 SVG 图片，从顶部顺时针填充，无定时器、测量或补间动画。
	 * 不内置百分比文字、成功/失败图标；进度为 100 仅表示传入的数值，不代表业务成功。
	 * @property {number} [percent=0] 百分比 0～100，可含小数；有限值限制在范围内，非有限值回退 0。
	 * @property {string} [type='line'] line 条形、circle 环形；无效值使用条形。
	 * @property {number} [size=80] 环形外径，px；非有限值或非正数回退 80，条形忽略。
	 * @property {number} [strokeWidth=4] 线宽，px；非有限值或非正数回退 4，环形最多为外径一半。
	 * @property {string|string[]} [color='primary-6'] 前景色，由 core 解析，支持内部色阶、外部颜色和明暗数组。
	 * @property {string|string[]} [trackColor=['gray-3','gray-4']] 轨道色，由 core 解析。
	 * @slot default 仅环形展示居中内容，提供规范化后的 percent；内容尺寸与排版由页面负责。
	 * @remarks 条形宽度默认 100%，外部布局由原生 view 包装；尺寸不跟随全局字号缩放。
	 * 环形复用项目现有静态 SVG Data URL 渲染方式；颜色须能在 SVG 中独立解析，宿主 CSS 变量不会传入图片。
	 * 无交互事件或 ref 方法。useUpload.progress 为 0～1，需乘 100；未知进度请展示 ucs-spinner。
	 * @example <ucs-progress :percent="45" />
	 * @example <ucs-progress type="circle" :percent="75"><ucs-text text="75%" /></ucs-progress>
	 */
	const props = defineProps({
		percent: { type: Number, default: 0 },
		type: { type: String, default: 'line' },
		size: { type: Number, default: 80 },
		strokeWidth: { type: Number, default: 4 },
		color: { type: [String, Array], default: 'primary-6' },
		trackColor: { type: [String, Array], default: () => ['gray-3', 'gray-4'] }
	})
	const progress = computed(() => Number.isFinite(props.percent) ? Math.max(0, Math.min(100, props.percent)) : 0)
	const diameter = computed(() => Number.isFinite(props.size) && props.size > 0 ? props.size : 80)
	const stroke = computed(() => Number.isFinite(props.strokeWidth) && props.strokeWidth > 0 ? props.strokeWidth : 4)
	const circleStyle = computed(() => ({ width: `${diameter.value}px`, height: `${diameter.value}px` }))
	const trackStyle = computed(() => ({ height: `${stroke.value}px`, borderRadius: `${stroke.value / 2}px`, backgroundColor: getThemeColor(props.trackColor) }))
	const fillStyle = computed(() => ({ width: `${progress.value}%`, height: `${stroke.value}px`, borderRadius: `${stroke.value / 2}px`, backgroundColor: getThemeColor(props.color) }))
	const circleSource = computed(() => getProgressSource(progress.value, diameter.value, Math.min(stroke.value, diameter.value / 2), getThemeColor(props.color), getThemeColor(props.trackColor)))
</script>

<style>
	.ucs-progress { flex-shrink: 0; box-sizing: border-box; }
	.ucs-progress--line { width: 100%; overflow: hidden; }
	.ucs-progress__fill { flex-shrink: 0; }
	.ucs-progress--circle { position: relative; }
	.ucs-progress__ring { flex-shrink: 0; }
	.ucs-progress__center { position: absolute; top: 0; right: 0; bottom: 0; left: 0; display: flex; align-items: center; justify-content: center; }
</style>
