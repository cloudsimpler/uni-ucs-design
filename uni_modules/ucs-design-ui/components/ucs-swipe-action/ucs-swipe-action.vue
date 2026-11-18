<template>
	<view ref="rootRef" class="ucs-swipe-action" :flatten="false">
		<view class="ucs-swipe-action__actions ucs-swipe-action__actions--left" :style="leftStyle" @tap.stop>
			<view class="ucs-swipe-action__action-content ucs-swipe-action__action-content--left" :style="{ width: `${leftSize}px` }"><slot name="left" :close="close" /></view>
		</view>
		<view class="ucs-swipe-action__actions ucs-swipe-action__actions--right" :style="rightStyle" @tap.stop>
			<view class="ucs-swipe-action__action-content ucs-swipe-action__action-content--right" :style="{ width: `${rightSize}px` }"><slot name="right" :close="close" /></view>
		</view>
		<view ref="contentRef" class="ucs-swipe-action__content" :flatten="false" :style="contentStyle"
			@touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd" @touchcancel="onTouchCancel" @tap.stop="onContentTap">
			<slot :side="side" :close="close" />
			<view v-if="side !== null" class="ucs-swipe-action__shield" :flatten="false" @tap.stop="onContentTap" />
		</view>
	</view>
</template>

<script setup>
	import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

	/**
	 * ucs-swipe-action 无预设外观的侧滑操作容器。
	 * @description 左右操作区由插槽提供，宽度显式指定为 px，不设置颜色或操作按钮。
	 * 仅在手势打断吸附动画时读取当前位移；普通拖动不测量，无常驻定时器或布局监听。
	 * 单指移动超过 8px 后锁定方向；纵向优先，不阻止页面滚动，横向才阻止默认行为并限制位移。
	 * 松手按操作区宽度比例吸附，不支持惯性或越界拉伸；touchcancel/多指打断恢复本次手势前的目标状态。
	 * @property {number} [leftWidth=0] 左侧操作区总宽 px，向右滑显示；无效或负数使用 0。
	 * @property {number} [rightWidth=80] 右侧操作区总宽 px，向左滑显示；无效或负数使用 80。0 禁用该侧。
	 * @property {number} [threshold=0.5] 松手展开比例，有限值须大于 0 且小于 1，否则回退 0.5。
	 * @property {number} [duration=200] 吸附过渡时长 ms；0 立即定位，无效或负数回退 200。
	 * @property {boolean} [disabled=false] 禁止手势及 open，并立即收起；close 仍可调用。
	 * @slot default 内容，提供 side（展开目标 left/right/null）与 close；决定整行高度。
	 * @slot left 左侧操作内容，提供 close；必须同时指定正数 leftWidth。
	 * @slot right 右侧操作内容，提供 close；与 rightWidth 对应。
	 * @event {string|null} change 展开目标变化时派发 left/right/null，不在每次移动时派发。
	 * @event {object} contentClick 收起状态轻触内容时派发原生事件；展开后轻触内容只收起。
	 * @method open(side='right') 展开指定侧，返回指令是否被接受；相同目标返回 true，不重复派发事件；宽度为 0、禁用或未挂载时返回 false。
	 * @method close 收起，返回是否改变目标；也可中止当前拖动并吸附至收起状态。
	 * @remarks 操作区常驻挂载，按位移裁剪可见区域；点击操作区不自动收起或删除，由业务调用 close。
	 * 行点击请监听 contentClick，不在内容子节点重复绑定整行 tap；交互控件应自行阻止事件冒泡。
	 * 不提供全局互斥、外部点击监听或自动业务操作，布局 class 放在原生 view 包装层。
	 * 手势需目标平台支持触摸事件 preventDefault；不处理鼠标拖动或嵌套横向滑动控件。
	 */
	const props = defineProps({
		leftWidth: { type: Number, default: 0 },
		rightWidth: { type: Number, default: 80 },
		threshold: { type: Number, default: 0.5 },
		duration: { type: Number, default: 200 },
		disabled: { type: Boolean, default: false }
	})
	const emit = defineEmits(['change', 'contentClick'])
	const side = ref(null), offset = ref(0), dragging = ref(false), holding = ref(false)
	const rootRef = ref(null), contentRef = ref(null)
	const leftSize = computed(() => Number.isFinite(props.leftWidth) && props.leftWidth >= 0 ? props.leftWidth : 0)
	const rightSize = computed(() => Number.isFinite(props.rightWidth) && props.rightWidth >= 0 ? props.rightWidth : 80)
	const durationValue = computed(() => Number.isFinite(props.duration) && props.duration >= 0 ? props.duration : 200)
	const contentStyle = computed(() => ({ transform: `translateX(${offset.value}px)`, transitionDuration: `${dragging.value || holding.value ? 0 : durationValue.value}ms` }))
	const leftStyle = computed(() => ({ width: `${Math.max(0, offset.value)}px`, pointerEvents: offset.value > 0 ? 'auto' : 'none', transitionDuration: contentStyle.value.transitionDuration }))
	const rightStyle = computed(() => ({ width: `${Math.max(0, -offset.value)}px`, pointerEvents: offset.value < 0 ? 'auto' : 'none', transitionDuration: contentStyle.value.transitionDuration }))
	let mounted = false, disposed = false, gesture = null, suppressTap = false, motion = null
	const position = target => target === 'left' ? leftSize.value : target === 'right' ? -rightSize.value : 0
	/** 无布局 API 时按 CSS ease-out 曲线估算，避免直接跳到目标位置。 */
	function visualOffset() {
		if (!motion || dragging.value || holding.value) return offset.value
		const ratio = Math.max(0, Math.min(1, (Date.now() - motion.start) / motion.duration))
		if (ratio === 0) return motion.from
		if (ratio === 1) return motion.to
		let low = 0, high = 1
		for (let i = 0; i < 20; i++) {
			const t = (low + high) / 2, x = 1.74 * (1 - t) * t * t + t * t * t
			if (x < ratio) low = t; else high = t
		}
		const t = (low + high) / 2, ease = 3 * (1 - t) * t * t + t * t * t
		return motion.from + (motion.to - motion.from) * ease
	}
	function readOffset() {
		const root = rootRef.value?.$el ?? rootRef.value, content = contentRef.value?.$el ?? contentRef.value
		const delta = (a, b) => Number.isFinite(a?.left ?? a?.x) && Number.isFinite(b?.left ?? b?.x) ? (b.left ?? b.x) - (a.left ?? a.x) : visualOffset()
		try {
			if (typeof root?.getBoundingClientRectAsync === 'function' && typeof content?.getBoundingClientRectAsync === 'function') {
				return Promise.all([root.getBoundingClientRectAsync(), content.getBoundingClientRectAsync()]).then(([a, b]) => delta(a, b), () => visualOffset())
			}
			if (typeof root?.getBoundingClientRect === 'function' && typeof content?.getBoundingClientRect === 'function') return delta(root.getBoundingClientRect(), content.getBoundingClientRect())
		} catch { /* 不支持布局查询时按时间曲线承接。 */ }
		return visualOffset()
	}
	function settle(target) {
		const from = visualOffset(), to = position(target)
		motion = durationValue.value > 0 && from !== to ? { from, to, start: Date.now(), duration: durationValue.value } : null
		gesture = null; dragging.value = false; holding.value = false; offset.value = to
		if (side.value === target) return false
		side.value = target; emit('change', target); return true
	}
	function open(target = 'right') {
		if (!mounted || disposed || props.disabled || !['left', 'right'].includes(target) || position(target) === 0) return false
		if (side.value !== target || gesture) settle(target)
		return true
	}
	function close() { if (!mounted || disposed) return false; return settle(null) }
	/** 仅接受当前单指的有效视口坐标，避免多指和异常事件污染位移。 */
	function point(event) {
		const touches = event.touches
		if (!touches || touches.length !== 1) return null
		const touch = touches[0]
		return Number.isFinite(touch.clientX) && Number.isFinite(touch.clientY) ? { x: touch.clientX, y: touch.clientY, id: touch.identifier } : null
	}
	function onTouchStart(event) {
		if (disposed || props.disabled) return
		if (gesture) { onTouchCancel(); return }
		suppressTap = false
		const touch = point(event)
		if (!touch) return
		const current = { ...touch, startOffset: offset.value, initialSide: side.value, axis: null, dx: 0, claimed: false, pending: false, ended: false }
		gesture = current
		if (motion && Date.now() - motion.start < motion.duration) {
			const freeze = value => {
				if (disposed || gesture !== current) return
				current.pending = false; current.startOffset = Math.max(-rightSize.value, Math.min(leftSize.value, value))
				motion = null; holding.value = true; offset.value = current.startOffset
				if (current.claimed) applyDrag()
				if (current.ended) finishGesture()
			}
			const value = readOffset()
			if (value && typeof value.then === 'function') { current.pending = true; value.then(freeze) }
			else freeze(value)
		}
	}
	function applyDrag() {
		if (!gesture || gesture.pending) return
		dragging.value = true; suppressTap = true
		offset.value = Math.max(-rightSize.value, Math.min(leftSize.value, gesture.startOffset + gesture.dx))
	}
	function onTouchMove(event) {
		if (!gesture || props.disabled || disposed) return
		const touch = point(event)
		if (!touch || touch.id !== gesture.id) { onTouchCancel(); return }
		const dx = touch.x - gesture.x, dy = touch.y - gesture.y
		if (gesture.axis === null) {
			if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return
			gesture.axis = Math.abs(dx) > Math.abs(dy) * 1.2 ? 'x' : 'y'
		}
		if (gesture.axis !== 'x') return
		gesture.dx = dx
		const next = Math.max(-rightSize.value, Math.min(leftSize.value, gesture.startOffset + dx))
		// 收起时向没有操作区的方向滑动不抢占父级手势。
		if (next === 0 && gesture.startOffset === 0 && !dragging.value) return
		event.preventDefault?.(); event.stopPropagation?.()
		gesture.claimed = true; suppressTap = true; applyDrag()
	}
	function onTouchEnd(event) {
		if (!gesture) return
		if (event.touches?.length > 0) { onTouchCancel(); return }
		if (!gesture.claimed) { if (holding.value || gesture.pending) settle(gesture.initialSide); else gesture = null; return }
		event.preventDefault?.(); event.stopPropagation?.()
		if (gesture.pending) { gesture.ended = true; return }
		if (!dragging.value) { gesture = null; return }
		finishGesture()
	}
	function finishGesture() {
		const ratio = Number.isFinite(props.threshold) && props.threshold > 0 && props.threshold < 1 ? props.threshold : 0.5
		const target = offset.value > 0 && offset.value >= leftSize.value * ratio ? 'left'
			: offset.value < 0 && -offset.value >= rightSize.value * ratio ? 'right' : null
		settle(target)
	}
	function onTouchCancel() {
		if (!gesture) return
		const target = gesture.initialSide
		if (dragging.value) suppressTap = true
		settle(target)
	}
	function onContentTap(event) {
		if (disposed || suppressTap) { suppressTap = false; return }
		if (side.value !== null) { close(); return }
		emit('contentClick', event)
	}
	watch(() => [props.disabled, leftSize.value, rightSize.value], () => {
		if (disposed) return
		const target = props.disabled || position(side.value) === 0 ? null : side.value
		settle(target)
	}, { flush: 'sync' })
	onMounted(() => { mounted = true })
	onBeforeUnmount(() => { disposed = true; mounted = false; gesture = null; motion = null })
	defineExpose({ open, close })
</script>

<style>
	.ucs-swipe-action { position: relative; width: 100%; flex-shrink: 0; overflow: hidden; }
	.ucs-swipe-action__content { position: relative; width: 100%; flex-shrink: 0; transition-property: transform; transition-timing-function: ease-out;
		/* #ifdef WEB */
		touch-action: pan-y;
		/* #endif */
	}
	.ucs-swipe-action__actions { position: absolute; top: 0; bottom: 0; overflow: hidden; transition-property: width; transition-timing-function: ease-out; }
	.ucs-swipe-action__actions--left { left: 0; }
	.ucs-swipe-action__actions--right { right: 0; }
	.ucs-swipe-action__action-content { position: absolute; top: 0; bottom: 0; display: flex; flex-direction: row; }
	.ucs-swipe-action__action-content--left { left: 0; }
	.ucs-swipe-action__action-content--right { right: 0; }
	.ucs-swipe-action__shield { position: absolute; top: 0; right: 0; bottom: 0; left: 0; }
</style>
