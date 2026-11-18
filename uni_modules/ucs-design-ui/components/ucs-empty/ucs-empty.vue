<template>
	<view class="ucs-empty">
		<view class="ucs-empty__image">
			<slot name="image">
				<image :src="imageSource" mode="aspectFit" :style="imageStyle" />
			</slot>
		</view>
		<view class="ucs-empty__description">
			<ucs-text :text="descriptionValue" :size="14" :color="props.descriptionColor" align="center" width="100%" />
		</view>
		<view v-if="$slots.default" class="ucs-empty__actions"><slot /></view>
	</view>
</template>

<script setup>
	import { computed } from 'vue'
	import { getThemeColor, getUcsDesignText } from '../../core/config.js'
	import { getEmptyIllustrationSize, normalizeEmptyType } from './builder.js'
	import { getEmptySource } from './svg.js'

	/**
	 * ucs-empty 空状态展示，复用参考项目中的 12 种 SVG 插画构图。
	 * @description 不设置外部高度、背景或业务按钮，不判断请求结果；由页面决定何时显示。
	 * 插画按原始宽高比展示，不随字号缩放；描述为 14px，跟随 core 字号和语言变化，支持换行。
	 * SVG 色彩直接使用 core 解析结果，随主题变化；以 UTF-8 Base64 Data URL 交给原生 image 渲染。
	 * @property {string} [type='data'] data/content/notice/permission/review/network/offline/link/image/maintenance/upload/download，无效值回退 data。
	 * @property {string} [description=''] 描述文字，空白时使用 core empty 对应类型的多语言文案。
	 * @property {string|string[]} [descriptionColor=['gray-7','gray-8']] 描述颜色，支持 core 色阶、外部色及明暗数组。
	 * @property {number} [imageWidth=148] 内置插画宽度 px；非有限值或小于等于 0 时回退 148，高度按原图比例计算。
	 * @slot image 替换插画区域，自定义图形尺寸由插槽自行安排。
	 * @slot default 描述下方自定义操作区域，不内置按钮、点击事件或重试逻辑。
	 * @remarks 无 ref 控制方法；内置 SVG 依赖目标平台 image 对 SVG Data URL 的支持。
	 * @example <ucs-empty type="data" description="还没有记录"><ucs-button text="新建记录" @click="createRecord" /></ucs-empty>
	 */
	const props = defineProps({
		type: { type: String, default: 'data' },
		description: { type: String, default: '' },
		descriptionColor: { type: [String, Array], default: () => ['gray-7', 'gray-8'] },
		imageWidth: { type: Number, default: 148 }
	})
	const typeValue = computed(() => normalizeEmptyType(props.type))
	const descriptionValue = computed(() => props.description.trim() ? props.description : getUcsDesignText(`empty.${typeValue.value}`))
	const imageStyle = computed(() => {
		const width = Number.isFinite(props.imageWidth) && props.imageWidth > 0 ? props.imageWidth : 148
		const size = getEmptyIllustrationSize(typeValue.value)
		return { width: `${width}px`, height: `${width * size.height / size.width}px` }
	})
	const imageSource = computed(() => {
		return getEmptySource(typeValue.value,
			getThemeColor('primary-6'), getThemeColor(['primary-3', 'primary-4']),
			getThemeColor('gray-4'), getThemeColor('gray-3'), getThemeColor(['gray-5', 'gray-6']),
			getThemeColor(['gray-8', 'gray-9']), getThemeColor(['#FFFFFF', '#262626']))
	})
</script>

<style>
	.ucs-empty { display: flex; flex-direction: column; align-items: center; width: 100%; box-sizing: border-box; }
	.ucs-empty__image { display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
	.ucs-empty__description { width: 100%; margin-top: 16px; }
	.ucs-empty__actions { display: flex; flex-direction: column; align-items: center; width: 100%; margin-top: 12px; }
</style>
