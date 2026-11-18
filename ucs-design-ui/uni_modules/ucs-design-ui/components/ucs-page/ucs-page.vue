<template>
	<view class="ucs-page" :style="pageStyle">
		<view class="ucs-page__header"><slot name="header" /></view>
		<view class="ucs-page__main">
			<scroll-view v-if="props.scrollEnabled" class="ucs-page__scroll" direction="vertical"
				:upper-threshold="props.upperThreshold" :lower-threshold="props.lowerThreshold"
				:scroll-top="props.scrollTop" :scroll-into-view="props.scrollIntoView"
				:scroll-with-animation="props.scrollWithAnimation" :enable-back-to-top="props.enableBackToTop"
				:refresher-enabled="props.refresherEnabled && !loading" :bounces="props.refresherEnabled && !loading"
				refresher-default-style="none" :refresher-threshold="threshold"
				:refresher-triggered="nativeTriggered" :refresher-background="pageColor"
				@scroll="emit('scroll', $event)" @scrolltoupper="emit('scrolltoupper', $event)"
				@scrolltolower="onScrollToLower" @refresherpulling="onPulling"
				@refresherrefresh="onRefresh" @refresherrestore="onRestore" @refresherabort="onAbort">
				<view class="ucs-page__content">
					<view class="ucs-page__body"><slot /></view>
					<view class="ucs-page__scroll-footer"><slot name="scroll-footer" /></view>
				</view>
				<!-- 刷新节点须是直接子节点；鸿蒙要求在最后，Android/iOS 不能放在首位。 -->
				<!-- #ifndef MP-ALIPAY -->
				<view slot="refresher" class="ucs-page__refresher" :style="refresherStyle">
					<view class="ucs-page__feedback" :flatten="false">
						<view class="ucs-page__puck" :flatten="false" :style="puckStyle">
							<view class="ucs-page__symbol">
								<view class="ucs-page__symbol-layer" :flatten="false" :style="ringStyle">
									<ucs-spinner :size="24" color="primary-6" :scale-with-font="false" :animated="phase === 'refreshing'" />
								</view>
								<view class="ucs-page__symbol-layer" :flatten="false" :style="{ opacity: completed ? 1 : 0 }">
									<ucs-icon name="checkmark-circle" :size="24" color="success-6" :scale-with-font="false" />
								</view>
							</view>
						</view>
					</view>
				</view>
				<!-- #endif -->
			</scroll-view>
			<view v-else class="ucs-page__content ucs-page__content--static">
				<view class="ucs-page__body"><slot /></view>
				<view class="ucs-page__scroll-footer"><slot name="scroll-footer" /></view>
			</view>
			<view v-if="loading" class="ucs-page__loading" :flatten="false" @tap.stop="onLoadingTap" @touchmove.stop.prevent>
				<ucs-spinner v-if="loadingVisible" :size="28" color="primary-6" :scale-with-font="false" />
			</view>
		</view>
		<slot name="overlay" />
		<ucs-toast ref="toastRef" />
		<ucs-loading ref="maskLoadingRef" />
		<view class="ucs-page__footer"><slot name="footer" /></view>
	</view>
</template>

<script setup>
	import { computed, onUnmounted, ref, watch } from 'vue'
	import { getThemeColor, useThemeColorCssVars } from '../../core/config.js'


	/**
	 * ucs-page 页面滚动布局。
	 * @description 固定头尾之间使用原生 scroll-view 承载主体，适用于 uni-app-x。
	 * 下拉显示悬浮圆环，松手后旋转，结束时显示勾选反馈 500ms，再由原生容器收起。
	 * 圆环固定 24px、底座固定 40px，不显示状态文字；刷新区域保留上下各 12px 阴影空间。
	 * 不接管网络请求。处理 refresherrefresh 后须通过组件 ref 调用 stopPullDownRefresh。
	 * showLoading/hideLoading 仅覆盖主体，不卸载原有内容；无文字、底座、阴影或自定义 loading 插槽。
	 * 内置轻提示，通过 showToast/hideToast 调用，参数和反馈行为沿用 ucs-toast，无需额外放置组件。
	 * 内置阻断式加载，通过 showMaskLoading/hideMaskLoading 调用，覆盖当前页面及同页 popup，须主动关闭。
	 * 根节点默认注入 core 的 67 项颜色 CSS 变量（5 项第 6 阶别名与 62 项色阶），供后代原生样式使用；不输出间距、字号或层级。
	 * @property {string|string[]} [backgroundColor=['#FFFFFF','#141414']] 页面背景，支持 core 明暗颜色数组。
	 * @property {boolean} [scrollEnabled=true] 是否使用滚动主体；关闭时同时禁用下拉刷新。
	 * @property {number} [upperThreshold=50] 距顶部触发 scrolltoupper 的距离，单位 px。
	 * @property {number} [lowerThreshold=50] 距底部触发 scrolltolower 的距离，单位 px。
	 * @property {number} [scrollTop=0] 竖向滚动位置，单位 px。
	 * @property {string} [scrollIntoView=''] 要滚动到的后代元素 id。
	 * @property {boolean} [scrollWithAnimation=false] 设置滚动位置时是否使用动画。
	 * @property {boolean} [enableBackToTop=false] 是否启用原生点击状态栏回顶能力，支持情况由平台决定。
	 * @property {boolean} [refresherEnabled=false] 是否启用原生自定义下拉刷新。
	 * @property {number} [refresherThreshold=64] 下拉触发距离，单位 px；无效值回退 64，最小为 64，不随字号变化。
	 * @slot header 固定顶部区域。
	 * @slot default 主体内容。
	 * @slot scroll-footer 主体不足一屏时贴主体可视区域底部，超出一屏时随正文尾部滚动。
	 * @slot overlay 页面浮层，位于滚动容器外。
	 * @slot footer 固定底部区域。
	 * @event {object} scroll 原生滚动事件。
	 * @event {object} scrolltoupper 到达顶部阈值，传递原生事件。
	 * @event {object} scrolltolower 到达底部阈值，传递原生事件。
	 * @event {object} refresherpulling 下拉进度，传递原生事件。
	 * @event {object|null} refresherrefresh 开始一次刷新，传递原生事件；同轮重复事件被忽略。
	 * @event {object} refresherrestore 原生刷新区域复位，传递原生事件。
	 * @event {object} refresherabort 未触发刷新的下拉手势被中止，传递原生事件。
	 * @method startPullDownRefresh 开始刷新并派发一次 refresherrefresh（参数为 null）；禁用或已刷新时返回 false，否则返回 true。
	 * @method stopPullDownRefresh 结束刷新，展示完成反馈后收起；重复调用不延长停留时间。
	 * @method showLoading(delay=0) 立即进入加载状态；delay 为 28px 圆环显示延迟（毫秒），默认 0，无效值回退 0。重复调用不重新计时。
	 * 延迟期间保留当前内容并阻止主体触摸、触底加载和新刷新；头尾及 overlay 不受影响。
	 * @method hideLoading 取消待显示任务并隐藏加载层；不结束已有刷新、不接管请求或计数，重复调用保持幂等。
	 * @method showToast(options) 显示文字或 {text,type,duration} 轻提示，返回是否接受；未挂载或已卸载返回 false。
	 * @method hideToast 移除当前及待显示轻提示，重复调用保持幂等，不影响主体加载或下拉刷新。
	 * @method showMaskLoading(options?) 显示阻断式加载，接受字符串或 {text}，省略则仅圆环；返回是否接受。
	 * @method hideMaskLoading 主动关闭阻断式加载，不改变主体 loading、下拉刷新或 toast。
	 * @example
	 * <ucs-page ref="page" refresher-enabled @refresherrefresh="loadData">
	 *   <template #header><ucs-text text="消息" /></template>
	 *   <ucs-text text="页面内容" />
	 * </ucs-page>
	 * // loadData 完成后调用 page.value.stopPullDownRefresh()
	 */
	const props = defineProps({
		backgroundColor: { type: [String, Array], default: () => ['#FFFFFF', '#141414'] },
		scrollEnabled: { type: Boolean, default: true },
		upperThreshold: { type: Number, default: 50 },
		lowerThreshold: { type: Number, default: 50 },
		scrollTop: { type: Number, default: 0 },
		scrollIntoView: { type: String, default: '' },
		scrollWithAnimation: { type: Boolean, default: false },
		enableBackToTop: { type: Boolean, default: false },
		refresherEnabled: { type: Boolean, default: false },
		refresherThreshold: { type: Number, default: 64 }
	})
	const emit = defineEmits(['scroll', 'scrolltoupper', 'scrolltolower', 'refresherpulling',
		'refresherrefresh', 'refresherrestore', 'refresherabort'])
	const enabled = computed(() => props.scrollEnabled && props.refresherEnabled)
	const loading = ref(false)
	const loadingVisible = ref(false)
	const toastRef = ref(null)
	const maskLoadingRef = ref(null)
	let loadingTimer = null
	let loadingVersion = 0
	const phase = ref('idle')
	const nativeTriggered = ref(phase.value === 'refreshing')
	const distance = ref(0)
	const rotationOffset = ref(0)
	let completeTimer = null
	let restoreTimer = null
	let refreshNotified = false
	let disposed = false
	/**
	 * 转发至内置轻提示，具体默认值、布局准备及计时由 ucs-toast 管理。
	 * @param {string|object} options 文字字符串，或包含 text、可选 type 和 duration 的选项。
	 * @returns {boolean} 是否接受显示请求；子组件未就绪或页面已卸载时返回 false。
	 */
	function showToast(options) {
		return disposed ? false : (toastRef.value?.show(options) ?? false)
	}
	/** 关闭内置轻提示及未完成的准备请求，不影响其他页面状态。 */
	function hideToast() {
		if (!disposed) toastRef.value?.hide()
	}
	/** 转发整页阻断式加载；与主体区域 showLoading 独立，须在业务 finally 中主动关闭。 */
	function showMaskLoading(options) { return disposed ? false : (maskLoadingRef.value?.show(options) ?? false) }
	/** 释放整页阻断，不结束其他反馈或业务任务。 */
	function hideMaskLoading() { if (!disposed) maskLoadingRef.value?.hide() }
	/** 清理待显示任务，不影响独立的下拉刷新计时器。 */
	function clearLoadingTimer() {
		if (loadingTimer !== null) clearTimeout(loadingTimer)
		loadingTimer = null
		loadingVersion++
	}
	/**
	 * 进入主体加载状态，延迟仅影响圆环显示；同轮重复调用保持幂等。
	 * @param {number} [delay=0] 延迟毫秒数；无效值回退 0，正数向下取整并限制在定时器安全范围内。
	 */
	function showLoading(delay = 0) {
		if (disposed || loading.value) return
		const duration = Number.isFinite(delay) && delay > 0 ? Math.min(Math.floor(delay), 2147483647) : 0
		const request = ++loadingVersion
		loading.value = true
		loadingVisible.value = duration === 0
		if (duration > 0) {
			loadingTimer = setTimeout(() => {
				if (disposed || request !== loadingVersion || !loading.value) return
				loadingTimer = null
				loadingVisible.value = true
			}, duration)
		}
	}
	/** 隐藏或取消主体加载反馈，保留原有内容实例和滚动位置。 */
	function hideLoading() {
		if (disposed) return
		clearLoadingTimer()
		loadingVisible.value = false
		loading.value = false
	}
	/** 加载层自身接收点击，阻止其传递至底下内容。 */
	function onLoadingTap() {}
	/** @param {object} event 原生触底事件，加载主体期间不发起下一页操作。 */
	function onScrollToLower(event) { if (!loading.value) emit('scrolltolower', event) }
	const completed = computed(() => phase.value === 'complete' || phase.value === 'restoring')
	const pageColor = computed(() => getThemeColor(props.backgroundColor))
	const cssVars = useThemeColorCssVars()
	const pageStyle = computed(() => ({ ...cssVars.value, backgroundColor: pageColor.value }))
	const threshold = computed(() => {
		const base = Number.isFinite(props.refresherThreshold) && props.refresherThreshold > 0 ? props.refresherThreshold : 64
		return Math.max(base, 40 + 24)
	})
	const progress = computed(() => phase.value === 'pulling' ? Math.min(distance.value / threshold.value, 1) : phase.value === 'idle' ? 0 : 1)
	/** 手势每下拉 1px 旋转 3°，不受触发阈值限制；回推时随距离反向转动。 */
	const pullAngle = computed(() => distance.value * 3)
	const refresherStyle = computed(() => ({ width: '100%', height: `${threshold.value}px` }))
	const puckStyle = computed(() => ({
		backgroundColor: getThemeColor(['#FFFFFF', '#262626']),
		width: '40px',
		height: '40px',
		borderRadius: '20px'
	}))
	/** 下拉时由手势决定角度，刷新时保留松手角度，叠加 spinner 内部从 0° 开始的旋转。 */
	const ringStyle = computed(() => ({
		opacity: completed.value ? 0 : progress.value,
		transform: `rotate(${phase.value === 'pulling' ? pullAngle.value : rotationOffset.value}deg)`
	}))

	/** 清理本轮反馈与复位定时器，防止旧回调结束后续刷新。 */
	function clearTimers() {
		if (completeTimer !== null) clearTimeout(completeTimer)
		if (restoreTimer !== null) clearTimeout(restoreTimer)
		completeTimer = restoreTimer = null
	}

	/** 立即清理内部状态；用于关闭滚动、关闭刷新及原生复位。 */
	function reset() {
		clearTimers()
		nativeTriggered.value = false
		distance.value = 0
		rotationOffset.value = 0
		phase.value = 'idle'
		refreshNotified = false
	}

	/** 开始新一轮刷新；返回 false 表示禁用或已在同轮刷新中。 */
	function start() {
		if (disposed || loading.value || !enabled.value || phase.value === 'refreshing') return false
		clearTimers()
		rotationOffset.value = phase.value === 'pulling' ? pullAngle.value : 0
		nativeTriggered.value = true
		phase.value = 'refreshing'
		refreshNotified = false
		return true
	}

	/** 展示完成反馈，再释放原生刷新状态；重复调用保持幂等。 */
	function stopPullDownRefresh() {
		if (disposed || phase.value !== 'refreshing') return
		phase.value = 'complete'
		completeTimer = setTimeout(() => {
			completeTimer = null
			phase.value = 'restoring'
			nativeTriggered.value = false
			// 无原生 restore 回调时也能清理，不残留完成图标。
			restoreTimer = setTimeout(reset, 350)
		}, 500)
	}

	/** 下拉阶段只更新进度；刷新和完成反馈期间忽略迟到的手势事件。 */
	function onPulling(event) {
		if (loading.value) return
		if (enabled.value && (phase.value === 'idle' || phase.value === 'pulling')) {
			const dy = event?.detail?.dy
			distance.value = Number.isFinite(dy) ? Math.max(0, dy) : 0
			phase.value = distance.value > 0 ? 'pulling' : 'idle'
		}
		emit('refresherpulling', event)
	}

	/** 先建立内部刷新状态，再通知调用方，支持处理函数同步结束刷新。 */
	function onRefresh(event) {
		if (disposed || loading.value || !enabled.value || phase.value === 'complete' || phase.value === 'restoring') return
		if (phase.value !== 'refreshing') start()
		notifyRefresh(event)
	}
	/** 方法和原生手势共用派发入口，忽略同轮原生刷新事件。 */
	function notifyRefresh(event) {
		if (refreshNotified) return
		refreshNotified = true
		emit('refresherrefresh', event)
	}
	/** @returns {boolean} 是否开始新一轮刷新；调用方应在 refresherrefresh 中处理请求。 */
	function startPullDownRefresh() {
		if (!start()) return false
		notifyRefresh(null)
		return true
	}

	/** 忽略新一轮仍在激活时收到的旧复位回调。 */
	function onRestore(event) {
		if (!nativeTriggered.value) reset()
		emit('refresherrestore', event)
	}

	/** 取消尚未开始刷新的手势，不打断已经发出的刷新请求。 */
	function onAbort(event) {
		if (phase.value === 'idle' || phase.value === 'pulling') reset()
		emit('refresherabort', event)
	}

	watch(enabled, active => { if (!active) reset() })
	onUnmounted(() => { disposed = true; clearTimers(); clearLoadingTimer() })
	defineExpose({ startPullDownRefresh, stopPullDownRefresh, showLoading, hideLoading, showToast, hideToast, showMaskLoading, hideMaskLoading })
</script>

<style>
	.ucs-page { display: flex; flex-direction: column; position: absolute; top: 0; right: 0; bottom: 0; left: 0; overflow: hidden; }
	.ucs-page__header, .ucs-page__footer { display: flex; flex-direction: column; flex-shrink: 0; z-index: 2; }
	.ucs-page__main { flex: 1; min-height: 0; position: relative; overflow: hidden; }
	.ucs-page__loading { position: absolute; top: 0; right: 0; bottom: 0; left: 0; z-index: 1; display: flex; align-items: center; justify-content: center; }
	.ucs-page__scroll { position: absolute; top: 0; right: 0; bottom: 0; left: 0; }
	.ucs-page__content { display: flex; flex-direction: column; flex-grow: 1; flex-shrink: 0; }
	.ucs-page__content--static { position: absolute; top: 0; right: 0; bottom: 0; left: 0; }
	.ucs-page__body { display: flex; flex-direction: column; flex-grow: 1; flex-shrink: 0; position: relative; }
	.ucs-page__scroll-footer { display: flex; flex-direction: column; flex-shrink: 0; }
	.ucs-page__refresher { display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; }
	.ucs-page__feedback { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 12px; }
	.ucs-page__puck { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 20px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); }
	.ucs-page__symbol { position: relative; width: 24px; height: 24px; }
	.ucs-page__symbol-layer { position: absolute; top: 0; left: 0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; opacity: 0; }
</style>
