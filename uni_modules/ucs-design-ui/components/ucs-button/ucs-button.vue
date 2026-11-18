<template>
	<view class="ucs-button" :class="attrs.class" :style="[buttonStyle, attrs.style]" :flatten="false">
		<slot name="loading" v-if="props.loading">
			<ucs-spinner :style="{ marginRight: hasText || $slots.default ? '4px' : '0px' }" :size="20" :color="spinnerColor" />
		</slot>
		<slot :loading="props.loading" :disabled="blocked">
			<ucs-text v-if="hasText" :style="{ minWidth: '0px', flexShrink: 1 }" :text="props.text" :size="baseSize" :line-height="baseLineHeight" :weight="500" :wrap="false" :color="contentColor" />
		</slot>
		<button class="ucs-button__native" :style="{ borderRadius: mini ? '6px' : '8px', color: 'transparent', opacity: blocked ? 0 : 1 }" :disabled="blocked" :hover-class="pressClass"
			:id="attrs.id" :name="attrs.name" :form-type="nativeAttrValue('form-type', 'formType')" :open-type="nativeAttrValue('open-type', 'openType')"
			:hover-start-time="nativeAttrValue('hover-start-time', 'hoverStartTime') ?? 20" :hover-stay-time="nativeAttrValue('hover-stay-time', 'hoverStayTime') ?? 70"
			:hover-stop-propagation="nativeAttrValue('hover-stop-propagation', 'hoverStopPropagation') ?? false"
			@click="onClick" @longpress="onLongPress"
			@touchstart="forwardNativeEvent('onTouchstart', $event)" @touchmove="forwardNativeEvent('onTouchmove', $event)"
			@touchend="forwardNativeEvent('onTouchend', $event)" @touchcancel="forwardNativeEvent('onTouchcancel', $event)">{{ props.text }}</button>

	</view>
</template>

<script setup>
	import { computed, useAttrs } from 'vue'
	import { getFontSize, getThemeColor, getThemeMode } from '../../core/config.js'

	/**
	 * ucs-button 默认样式按钮，外观参考 WeUI 普通按钮，颜色接入 UCS 主题。
	 * @description 默认主色背景、白色文字、48px 基础高度、8px 圆角，提供按压和禁用反馈。
	 * disabled 或 loading 时同时设置原生 disabled 并拦截组件点击与长按事件。
	 * loading 由调用方控制；组件不等待事件监听器的 Promise、不自动发请求或做时间防抖。
	 * 默认文字仅显示一行，超长省略，字重 500；加载圆环基础 20px，与文字间距 4px。
	 * 非 block 模式最大宽 280px；block 占满父容器。按压叠加明暗遮罩，不改变整体透明度。
	 * class、style 用于外层 view；id、name、form-type、open-type、按压时序及触摸事件显式绑定到原生 button。
	 * 各端统一使用显式绑定；未列出的平台专有属性与事件不自动透传。
	 * 自定义内容位于原生 button 外，避免原生按钮子内容限制；插槽不能放置独立交互控件。
	 * @property {string|number} [text=''] 无默认插槽时显示的文字，支持 0。
	 * @property {string} [type='primary'] primary 主色、success 成功色、warning 警告色、danger 危险色、default 中性；无效值回退 primary。
	 * @property {string} [size='default'] default 基础高 48px、字号 16px；mini 基础高 32px、字号 14px；均随全局字号偏移缩放文字、行高和圆环。
	 * @property {boolean} [block=false] 是否占满父容器宽度；默认内容宽度，普通尺寸最小宽 184px。
	 * @property {boolean} [disabled=false] 禁用交互，显示弱色文字和中性背景。
	 * @property {boolean} [loading=false] 显示加载内容并禁用交互，保留默认插槽内容。
	 * @property {string|string[]} [color=''] 文字及圆环覆盖色；空字符串使用当前类型或禁用颜色。
	 * @slot default 自定义内容，提供 loading、disabled（包含加载禁用）；自行设置图文颜色和间距。
	 * @slot loading 加载时的前置内容，默认 ucs-spinner；可提供空插槽隐藏默认圆环。
	 * @event {object} tap 点击时触发，传递原生 click 事件。
	 * @event {object} click 与 tap 同次触发，顺序 tap → click；同一操作仅订阅其中之一。
	 * @event {object} longpress 可交互状态下长按触发，传递原生事件。
	 * @example <ucs-button text="保存" :loading="saving" @click="save" />
	 */
	defineOptions({ inheritAttrs: false })
	const attrs = useAttrs()
	/** 每次渲染读取最新属性，同时接受短横线与驼峰写法。 */
	function nativeAttrValue(name, camelName) { return attrs[name] ?? attrs[camelName] }
	/** 原生触摸事件显式转发，避免依赖编译器不支持的对象式绑定。 */
	function forwardNativeEvent(name, event) {
		const handlers = attrs[name]
		if (typeof handlers === 'function') handlers(event)
		else if (Array.isArray(handlers)) handlers.forEach(handler => { if (typeof handler === 'function') handler(event) })
	}
	const props = defineProps({
		text: { type: [String, Number], default: '' },
		type: { type: String, default: 'primary' },
		size: { type: String, default: 'default' },
		block: { type: Boolean, default: false },
		disabled: { type: Boolean, default: false },
		loading: { type: Boolean, default: false },
		color: { type: [String, Array], default: '' }
	})
	const emit = defineEmits(['tap', 'click', 'longpress'])
	const blocked = computed(() => props.disabled || props.loading)
	const hasText = computed(() => props.text !== '')
	const mini = computed(() => props.size.trim().toLowerCase() === 'mini')
	const typeValue = computed(() => ['primary', 'success', 'warning', 'danger', 'default'].includes(props.type) ? props.type : 'primary')
	const baseSize = computed(() => mini.value ? 14 : 16)
	const pressClass = computed(() => blocked.value ? 'none' : getThemeMode() === 'dark' ? 'ucs-button__native--pressed-dark' : 'ucs-button__native--pressed')
	const baseLineHeight = computed(() => baseSize.value * (mini.value ? 20 / 14 : 24 / 16))
	const contentColor = computed(() => {
		if (typeof props.color !== 'string' || props.color.trim()) return getThemeColor(props.color)
		if (props.disabled) return getThemeColor(['gray-6', 'gray-7'])
		return typeValue.value === 'default' ? getThemeColor(['gray-12', 'gray-10']) : getThemeColor('#FFFFFF')
	})
	/** 中性按钮的默认圆环使用 WeUI 灰色，其余跟随文字；显式 color 优先。 */
	const spinnerColor = computed(() => typeof props.color === 'string' && !props.color.trim() && !props.disabled && typeValue.value === 'default' ? getThemeColor('#606060') : contentColor.value)
	const buttonStyle = computed(() => ({
		color: contentColor.value,
		backgroundColor: props.disabled || typeValue.value === 'default' ? getThemeColor(['gray-3', 'gray-4']) : getThemeColor(`${typeValue.value}-6`),
		width: props.block ? '100%' : 'auto',
		minWidth: props.block || mini.value ? '0px' : '184px',
		...(!props.block ? { maxWidth: '280px' } : {}),
		// 竖向留白计入最小高度，避免原生端 min-height 与 padding 重复撑高。
		minHeight: `${Math.max(mini.value ? 32 : 48, baseLineHeight.value * getFontSize(baseSize.value) / baseSize.value + (mini.value ? 12 : 24))}px`,
		padding: mini.value ? '0px 12px' : '0px 24px',
		borderRadius: mini.value ? '6px' : '8px',
		fontSize: `${getFontSize(baseSize.value)}px`,
		lineHeight: `${baseLineHeight.value * getFontSize(baseSize.value) / baseSize.value}px`
	}))
	/** @param {object} event 原生点击事件；再次检查状态以拦住迟到的事件。 */
	function onClick(event) {
		if (blocked.value) return
		emit('tap', event)
		emit('click', event)
	}
	/** @param {object} event 原生长按事件。 */
	function onLongPress(event) { if (!blocked.value) emit('longpress', event) }
</script>

<style>
	.ucs-button {
		position: relative;
		box-sizing: border-box;
		align-self: center;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		margin: 0;
		padding: 0;
		border-width: 0;
		border-radius: 0;
		background-color: transparent;
	}
	.ucs-button__native { position: absolute; top: 0; right: 0; bottom: 0; left: 0; width: 100%; height: 100%; margin: 0; padding: 0; color: transparent; background-color: transparent; border-width: 0; }
	.ucs-button__native--pressed { background-color: rgba(0, 0, 0, 0.2); }
	.ucs-button__native--pressed-dark { background-color: rgba(255, 255, 255, 0.2); }
	/* #ifdef H5 || WEB || MP */
	.ucs-button__native::after { border: none; }
	/* #endif */
</style>

