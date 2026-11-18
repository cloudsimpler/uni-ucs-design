<template>
	<view ref="outerRef" class="ucs-collapse" :flatten="false" :style="collapseStyle">
		<view ref="innerRef" class="ucs-collapse__inner" :flatten="false">
			<slot :expanded="expanded" :animating="animating" />
		</view>
	</view>
</template>

<script setup>
	import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

	/**
	 * ucs-collapse 无预设外观的折叠内容容器，不内置标题、箭头、边框、背景或触发区域。
	 * @description 通过 ref.open()/close()/toggle() 控制；收起保留插槽实例及数据，使用 overflow 裁剪。
	 * 仅切换时测量当前可见高度和内容高度，CSS height 过渡完成后恢复 auto；展开后的内容变化自然布局，不单独播放高度动画。
	 * 快速切换从当前渲染高度继续；旧测量和计时任务失效，不会覆盖新指令。首次渲染不播放动画。
	 * @property {boolean} [defaultOpen=false] 初始是否展开，仅初始化读取，后续通过 ref 控制。
	 * @property {number} [duration=240] 过渡时长 ms；0 立即切换，负数或非有限值回退 240。
	 * @slot default 折叠内容，提供 expanded（目标状态）、animating（切换中）。外部触发区域由页面自行设计。
	 * @event {boolean} change 接受目标状态变化后触发；重复相同指令不派发。
	 * @event {boolean} afterChange 当前一轮切换完成后触发；被新指令中止的轮次不派发。
	 * @method open 展开，返回指令是否被接受；已展开时返回 true，不重复触发事件；未挂载、已卸载返回 false。
	 * @method close 收起，返回是否接受。
	 * @method toggle 反转当前目标状态，返回是否接受。
	 * @remarks 插槽内避免脱离文档流的整体布局和垂直外边距，间距放在内容内层 padding。
	 * 测量不可用时降级为立即展开/收起。不管理输入焦点、表单校验或手风琴互斥；收起内容仍保持挂载。
	 * 不在 ucs-* 使用节点添加布局 class，外部间距放在原生 view 包装层。
	 */
	const props = defineProps({ defaultOpen: { type: Boolean, default: false }, duration: { type: Number, default: 240 } })
	const emit = defineEmits(['change', 'afterChange'])
	const outerRef = ref(null), innerRef = ref(null)
	const expanded = ref(props.defaultOpen), animating = ref(false)
	const height = ref(props.defaultOpen ? 'auto' : '0px'), transitionDuration = ref(0)
	const instance = getCurrentInstance()
	let operation = 0, timer = null, disposed = false, mounted = false
	onMounted(() => { mounted = true })
	const collapseStyle = computed(() => ({ height: height.value, transitionDuration: `${transitionDuration.value}ms`, pointerEvents: expanded.value ? 'auto' : 'none' }))
	const durationValue = () => Number.isFinite(props.duration) && props.duration >= 0 ? Math.min(Math.floor(props.duration), 2147483647) : 240
	function clearTimer() { if (timer !== null) clearTimeout(timer); timer = null }
	/** 读取实际渲染高度，同时支持原生异步布局、Web DOM 和小程序选择器。 */
	async function measure(reference, selector) {
		const element = reference.value?.$el ?? reference.value
		let rect
		if (typeof element?.getBoundingClientRectAsync === 'function') rect = await element.getBoundingClientRectAsync()
		else if (typeof element?.getBoundingClientRect === 'function') rect = element.getBoundingClientRect()
		else if (typeof uni !== 'undefined' && typeof uni.createSelectorQuery === 'function') {
			rect = await new Promise(resolve => uni.createSelectorQuery().in(instance.proxy).select(selector).boundingClientRect(value => resolve(value)).exec())
		}
		return Number.isFinite(rect?.height) && rect.height >= 0 ? rect.height : null
	}
	function complete(request, target) {
		if (disposed || request !== operation) return
		clearTimer(); transitionDuration.value = 0; height.value = target ? 'auto' : '0px'; animating.value = false
		emit('afterChange', target)
	}
	async function transition(request, target, duration) {
		try {
			const [current, content] = await Promise.all([measure(outerRef, '.ucs-collapse'), measure(innerRef, '.ucs-collapse__inner')])
			if (disposed || request !== operation) return
			const end = target ? content : 0
			if (current === null || end === null || current === end) { complete(request, target); return }
			transitionDuration.value = 0; height.value = `${current}px`
			await nextTick()
			if (disposed || request !== operation) return
			// 提交固定起始高度，避免同一批原生样式更新吞掉过渡。
			await measure(outerRef, '.ucs-collapse')
			if (disposed || request !== operation) return
			transitionDuration.value = duration; height.value = `${end}px`
			timer = setTimeout(() => complete(request, target), duration)
		} catch { complete(request, target) }
	}
	function setExpanded(target) {
		if (disposed || !mounted || expanded.value === target) return false
		const request = ++operation, duration = durationValue()
		clearTimer(); expanded.value = target; animating.value = true
		emit('change', target)
		if (disposed || request !== operation) return true
		if (duration === 0) complete(request, target)
		else transition(request, target, duration)
		return true
	}
	function open() { if (disposed || !mounted) return false; return expanded.value ? true : setExpanded(true) }
	function close() { return setExpanded(false) }
	function toggle() { return setExpanded(!expanded.value) }
	onBeforeUnmount(() => { disposed = true; operation++; clearTimer() })
	defineExpose({ open, close, toggle })
</script>

<style>
	.ucs-collapse { display: flex; flex-direction: column; flex-shrink: 0; width: 100%; overflow: hidden; transition-property: height; transition-timing-function: ease-in-out; }
	.ucs-collapse__inner { display: flex; flex-direction: column; flex-shrink: 0; width: 100%; }
</style>
