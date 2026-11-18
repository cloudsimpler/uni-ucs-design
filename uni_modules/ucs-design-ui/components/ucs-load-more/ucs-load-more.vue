<template>
	<view v-if="visible" class="ucs-load-more">
		<view class="ucs-load-more__line" :style="lineStyle" />
		<view class="ucs-load-more__content">
			<view v-if="!props.showText || loading" class="ucs-load-more__symbol" :style="symbolStyle">
				<view class="ucs-load-more__layer" :flatten="false" :style="{ opacity: loading ? 1 : 0 }">
					<ucs-spinner :size="props.showText ? 16 : 24" :scale-with-font="props.showText" :color="contentColor" :animated="loading" />
				</view>
				<view class="ucs-load-more__layer" :flatten="false" :style="{ opacity: loading ? 0 : 1 }">
					<ucs-icon :name="iconName" :size="24" :scale-with-font="false" :color="contentColor" />
				</view>
			</view>
			<view v-if="props.showText" class="ucs-load-more__text" :style="{ marginLeft: loading ? '8px' : '0px' }">
				<ucs-text :text="displayText" :size="14" :color="contentColor" align="center" />
			</view>
		</view>
		<view class="ucs-load-more__line" :style="lineStyle" />
	</view>
</template>

<script setup>
	import { computed } from 'vue'
	import { getFontSize, getThemeColor, getUcsDesignText } from '../../core/config.js'

	/**
	 * ucs-load-more 上拉加载反馈。
	 * @description 两侧细线保持对称，默认中心以图标区分状态；showText 开启时改为内置多语言文字。
	 * ready 使用 more-horizontal，loading 使用旋转圆环，error 使用 close-circle，finished 使用 checkmark-circle。
	 * 图标模式的圆环和图标均固定 24px；文字模式基础字号 14px、圆环 16px，均跟随全局字号偏移。
	 * hidden 不渲染、不占位，ready 正常展示。组件只展示状态，不监听滚动、不发起请求、不管理分页。
	 * @property {string} [status='ready'] ready、loading、error、finished、hidden；忽略大小写及空白，无效值回退 ready。
	 * @property {boolean} [showText=false] 是否显示文字；loading 文字前保留圆环，其余状态只显示文字。
	 * @property {string|string[]} [color=''] 中心图标、圆环和文字的统一覆盖色；空白字符串使用状态色：ready 弱色、loading 主色、error 失败色、finished 成功色。
	 * @remarks 文案通过 core 的 loadMore 设计语言包配置，不提供插槽、点击事件或公开方法。
	 * 页面负责触底加载与重试；请求前切换 loading，成功且还有下一页恢复 ready，没有更多设 finished，失败设 error。
	 * class、style 透传根 view，不控制内部横线颜色。无文字模式中心占位固定，文字模式允许中间内容随文字展开。
	 * @example
	 * <ucs-load-more :status="status" />
	 * <ucs-load-more :status="status" show-text />
	 */
	const props = defineProps({
		status: { type: String, default: 'ready' },
		showText: { type: Boolean, default: false },
		color: { type: [String, Array], default: '' }
	})
	const statusValue = computed(() => {
		const value = typeof props.status === 'string' ? props.status.trim().toLowerCase() : ''
		return ['loading', 'error', 'finished', 'hidden'].includes(value) ? value : 'ready'
	})
	const visible = computed(() => statusValue.value !== 'hidden')
	const loading = computed(() => statusValue.value === 'loading')
	/** 文字模式的圆环与占位同步缩放，避免固定容器导致偏心或挤压文字。 */
	const symbolStyle = computed(() => {
		const size = props.showText ? getFontSize(16) : 24
		return { width: `${size}px`, height: `${size}px` }
	})
	const iconName = computed(() => statusValue.value === 'error' ? 'close-circle' : statusValue.value === 'finished' ? 'checkmark-circle' : 'more-horizontal')
	/** 只在文字模式查询文案，响应语言包和语言切换。 */
	const displayText = computed(() => props.showText && visible.value ? getUcsDesignText(`loadMore.${statusValue.value}`) : '')
	/** 外部颜色优先；默认状态色全部通过 core 解析。 */
	const contentColor = computed(() => {
		if (typeof props.color !== 'string' || props.color.trim()) return getThemeColor(props.color)
		if (statusValue.value === 'loading') return getThemeColor('primary-6')
		if (statusValue.value === 'error') return getThemeColor('danger-6')
		if (statusValue.value === 'finished') return getThemeColor('success-6')
		return getThemeColor(['gray-7', 'gray-8'])
	})
	const lineStyle = computed(() => ({ backgroundColor: getThemeColor(['gray-3', 'gray-4']) }))
</script>

<style>
	.ucs-load-more { display: flex; flex-direction: row; align-items: center; justify-content: center; width: 100%; min-height: 64px; padding: 0 16px; box-sizing: border-box; flex-shrink: 0; }
	.ucs-load-more__line { width: 64px; height: 1px; flex-shrink: 1; }
	.ucs-load-more__content { display: flex; flex-direction: row; align-items: center; justify-content: center; margin-left: 12px; margin-right: 12px; min-width: 0; flex-shrink: 1; }
	.ucs-load-more__symbol { position: relative; width: 24px; height: 24px; flex-shrink: 0; }
	.ucs-load-more__layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
	.ucs-load-more__text { min-width: 0; flex-shrink: 1; }
</style>
