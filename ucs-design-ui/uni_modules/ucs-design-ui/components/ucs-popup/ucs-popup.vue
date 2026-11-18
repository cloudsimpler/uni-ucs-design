<template>
	<view class="ucs-popup" :flatten="false" :style="hostStyle">
		<template v-if="entry">
			<view :key="`mask-${entry.id}`" class="ucs-popup__backdrop" :class="backdropClass" :flatten="false" :style="backdropStyle" />
			<view :key="entry.id" class="ucs-popup__viewport" :flatten="false" :style="viewportStyle" @tap.stop="onBackdrop" @touchmove.stop.prevent>
				<view class="ucs-popup__surface" :class="surfaceClass" :flatten="false" :style="surfaceStyle" @tap.stop="onContentTap" @touchmove.stop>
					<slot />
					<ucs-safe-area v-if="props.safeAreaInsetBottom && entry.placement === 'bottom'" />
				</view>
			</view>
		</template>
	</view>
</template>

<script setup>
	import { computed, nextTick, onBeforeUnmount, shallowRef } from 'vue'
	import { getThemeColor } from '../../core/config.js'
	import { useOverlay } from '../../internal/overlay.js'

	/**
	 * ucs-popup 固定宿主的同页弹出层。
	 * @description 保留空的固定定位宿主，每次打开创建内部遮罩和面板，关闭完成后销毁内部内容。
	 * 宿主关闭时不响应交互，避免 App 原生端反复创建 fixed 宿主时出现命中事件却未绘制的情况。
	 * 不查询布局，不切换 display，不通过延时设置准备阶段，也不通过 JS 修改 transform 启动动画。
	 * 插槽状态不会跨打开次数保留，需要保留的数据请存放在页面中。退出中再次打开会创建新一轮入场。
	 * 放在页面 overlay 等不受滚动裁剪的位置，同页多实例应并列放置；不承诺覆盖原生导航栏或窗口。
	 * @property {string} [placement='bottom'] top、bottom、left、right、center，忽略大小写及空白，无效值使用 bottom。
	 * @property {boolean} [closeOnClickMask=true] 点击内容外区域是否关闭。
	 * @property {boolean} [safeAreaInsetBottom=true] bottom 面板底部自动添加安全区。
	 * @property {string|string[]} [backgroundColor=['#FFFFFF','#262626']] 面板背景，支持主题色及明暗数组。
	 * @property {number} [radius=0] 圆角 px，非有限值或负数使用 0；边缘方向仅朝向页面内容的两角生效。
	 * @slot default 内容布局；左右、居中方向应提供明确宽度，长内容自行安排滚动。
	 * @event open 接受新一轮打开请求后触发，重复 open 不重复触发。
	 * @event close 接受关闭请求后触发，重复 close 不重复触发。
	 * @event {object} clickMask 入场完成且位于栈顶时点击内容外区域触发，传递原始事件。
	 * @method open 返回 boolean；未卸载且成功注册时为 true，已经打开时保持幂等。
	 * @method close 请求关闭，返回是否接受；卸载、未打开或已经退出中返回 false。
	 * @remarks CSS 动画时长 240ms，JS 仅在本轮渲染提交后安排结束状态与卸载，不等待动画事件。
	 * 面板和遮罩默认透明，由关键帧设置可见性并保留结束帧，避免原生动画接管前闪现。
	 * uni-app-x App 的关键帧与填充模式要求 Vapor 5.31+。
	 */
	const props = defineProps({
		placement: { type: String, default: 'bottom' },
		closeOnClickMask: { type: Boolean, default: true },
		safeAreaInsetBottom: { type: Boolean, default: true },
		backgroundColor: { type: [String, Array], default: () => ['#FFFFFF', '#262626'] },
		radius: { type: Number, default: 0 }
	})
	const emit = defineEmits(['open', 'close', 'clickMask'])
	const layer = useOverlay()
	const entry = shallowRef(null)
	const DURATION = 240
	let serial = 0, operation = 0, presentedId = 0, timer = null, disposed = false
	const hostStyle = computed(() => ({ zIndex: layer.maskZIndex.value, pointerEvents: layer.isTop.value ? 'auto' : 'none' }))
	const leaving = computed(() => entry.value?.phase === 'leave')
	// 默认隐藏首帧，由关键帧接管可见性；入场结束不切换动画类，避免重置动画样式。
	const surfaceClass = computed(() => `ucs-popup__surface--${entry.value?.placement ?? 'bottom'}-${leaving.value ? 'out' : 'in'}`)
	const backdropClass = computed(() => `ucs-popup__backdrop--${leaving.value ? 'out' : 'in'}`)
	const backdropStyle = computed(() => ({ zIndex: layer.maskZIndex.value }))
	const viewportStyle = computed(() => ({
		zIndex: layer.panelZIndex.value,
		justifyContent: entry.value?.placement === 'top' ? 'flex-start' : entry.value?.placement === 'bottom' ? 'flex-end' : 'center',
		alignItems: entry.value?.placement === 'left' ? 'flex-start' : entry.value?.placement === 'right' ? 'flex-end' : 'center'
	}))
	const surfaceStyle = computed(() => {
		const placement = entry.value?.placement ?? 'bottom'
		const center = placement === 'center', vertical = placement === 'top' || placement === 'bottom'
		const radius = `${Number.isFinite(props.radius) && props.radius >= 0 ? props.radius : 0}px`
		return {
			backgroundColor: getThemeColor(props.backgroundColor),
			width: vertical ? '100%' : 'auto', height: !vertical && !center ? '100%' : 'auto',
			borderTopLeftRadius: center || placement === 'bottom' || placement === 'right' ? radius : '0px',
			borderTopRightRadius: center || placement === 'bottom' || placement === 'left' ? radius : '0px',
			borderBottomLeftRadius: center || placement === 'top' || placement === 'right' ? radius : '0px',
			borderBottomRightRadius: center || placement === 'top' || placement === 'left' ? radius : '0px',
			animationTimingFunction: leaving.value ? 'ease-in' : 'ease-out',
			pointerEvents: leaving.value ? 'none' : 'auto'
		}
	})
	function cancelCompletion() { if (timer !== null) clearTimeout(timer); timer = null }
	/** 只调度本轮生命周期完成；旧渲染任务及旧定时回调不会结束新请求。 */
	async function completeAfterRender(request, id) {
		await nextTick()
		if (disposed || request !== operation || entry.value?.id !== id) return
		presentedId = id
		timer = setTimeout(() => {
			if (disposed || request !== operation || entry.value?.id !== id) return
			timer = null
			if (entry.value.phase === 'leave') { entry.value = null; presentedId = 0; layer.release() }
			else entry.value = { ...entry.value, phase: 'open' }
		}, DURATION)
	}
	function open() {
		if (disposed) return false
		if (entry.value && !leaving.value) return true
		if (!layer.activate()) return false
		cancelCompletion()
		const requested = typeof props.placement === 'string' ? props.placement.trim().toLowerCase() : ''
		const placement = ['top', 'bottom', 'left', 'right', 'center'].includes(requested) ? requested : 'bottom'
		const request = ++operation, id = ++serial
		entry.value = { id, placement, phase: 'enter' }
		completeAfterRender(request, id)
		emit('open')
		return true
	}
	function close() {
		if (disposed || !entry.value || leaving.value) return false
		cancelCompletion()
		const request = ++operation, id = entry.value.id
		if (presentedId !== id) { entry.value = null; layer.release() }
		else { entry.value = { ...entry.value, phase: 'leave' }; completeAfterRender(request, id) }
		emit('close')
		return true
	}
	function onBackdrop(event) {
		if (entry.value?.phase !== 'open' || !layer.isTop.value) return
		const request = operation
		emit('clickMask', event)
		if (props.closeOnClickMask && request === operation && layer.isTop.value) close()
	}
	function onContentTap() {}
	onBeforeUnmount(() => { disposed = true; operation++; cancelCompletion(); entry.value = null; layer.release() })
	defineExpose({ open, close })
</script>

<style>
	.ucs-popup { position: fixed; top: 0; right: 0; bottom: 0; left: 0; overflow: hidden; }
	.ucs-popup__backdrop { position: absolute; top: 0; right: 0; bottom: 0; left: 0; background-color: rgba(0, 0, 0, 0.45); opacity: 0; animation-name: none; animation-duration: 240ms; animation-fill-mode: forwards; animation-iteration-count: 1; }
	.ucs-popup__viewport { position: absolute; top: 0; right: 0; bottom: 0; left: 0; display: flex; flex-direction: column; }
	.ucs-popup__surface { position: relative; display: flex; flex-direction: column; flex-shrink: 0; overflow: hidden; opacity: 0; transform: none; animation-name: none; animation-duration: 240ms; animation-fill-mode: forwards; animation-iteration-count: 1; }
	.ucs-popup__surface--top-in { animation-name: ucs-popup-top-in; }
	.ucs-popup__surface--top-out { animation-name: ucs-popup-top-out; }
	.ucs-popup__surface--bottom-in { animation-name: ucs-popup-bottom-in; }
	.ucs-popup__surface--bottom-out { animation-name: ucs-popup-bottom-out; }
	.ucs-popup__surface--left-in { animation-name: ucs-popup-left-in; }
	.ucs-popup__surface--left-out { animation-name: ucs-popup-left-out; }
	.ucs-popup__surface--right-in { animation-name: ucs-popup-right-in; }
	.ucs-popup__surface--right-out { animation-name: ucs-popup-right-out; }
	.ucs-popup__surface--center-in { animation-name: ucs-popup-center-in; }
	.ucs-popup__surface--center-out { animation-name: ucs-popup-center-out; }
	.ucs-popup__backdrop--in { animation-name: ucs-popup-backdrop-in; }
	.ucs-popup__backdrop--out { animation-name: ucs-popup-backdrop-out; }
	@keyframes ucs-popup-top-in { from { opacity: 0; transform: translateY(-100%); } to { opacity: 1; transform: translateY(0%); } }
	@keyframes ucs-popup-top-out { from { opacity: 1; transform: translateY(0%); } to { opacity: 0; transform: translateY(-100%); } }
	@keyframes ucs-popup-bottom-in { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0%); } }
	@keyframes ucs-popup-bottom-out { from { opacity: 1; transform: translateY(0%); } to { opacity: 0; transform: translateY(100%); } }
	@keyframes ucs-popup-left-in { from { opacity: 0; transform: translateX(-100%); } to { opacity: 1; transform: translateX(0%); } }
	@keyframes ucs-popup-left-out { from { opacity: 1; transform: translateX(0%); } to { opacity: 0; transform: translateX(-100%); } }
	@keyframes ucs-popup-right-in { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0%); } }
	@keyframes ucs-popup-right-out { from { opacity: 1; transform: translateX(0%); } to { opacity: 0; transform: translateX(100%); } }
	@keyframes ucs-popup-center-in { from { transform: scale(0.94); opacity: 0; } to { transform: scale(1); opacity: 1; } }
	@keyframes ucs-popup-center-out { from { transform: scale(1); opacity: 1; } to { transform: scale(0.94); opacity: 0; } }
	@keyframes ucs-popup-backdrop-in { from { opacity: 0; } to { opacity: 1; } }
	@keyframes ucs-popup-backdrop-out { from { opacity: 1; } to { opacity: 0; } }
</style>
