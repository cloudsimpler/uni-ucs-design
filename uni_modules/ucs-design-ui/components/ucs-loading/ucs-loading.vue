<template>
	<view class="ucs-loading" :flatten="false" :style="rootStyle" @tap.stop="onMask" @touchstart.stop.prevent @touchmove.stop.prevent @touchend.stop.prevent>
		<view v-if="entry" ref="panelRef" class="ucs-loading__panel" :flatten="false" :style="panelStyle">
			<ucs-spinner :size="32" :color="foregroundColor" />
			<view v-if="entry.text" class="ucs-loading__text"><ucs-text :text="entry.text" :size="14" :color="foregroundColor" align="center" /></view>
		</view>
	</view>
</template>

<script setup>
	import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
	import { getThemeColor } from '../../core/config.js'
	import { useOverlay } from '../../internal/overlay.js'

	/**
	 * ucs-loading 手动关闭的阻断式加载反馈。
	 * @description 固定透明遮罩阻止当前页面点击和滑动，点击遮罩不关闭；无 mask、duration 属性，无插槽或交互事件。
	 * 圆环复用 ucs-spinner，文字可选；视觉与 toast 结果反馈一致，跟随主题及字号。
	 * 显示请求提交即取得交互层级，面板挂载并完成布局后显示，不使用固定延时或自动关闭定时器。
	 * 重复 show 更新当前文字，不叠加、不重新创建圆环；hide 销毁反馈内容并释放阻断，保留不响应交互的固定宿主。
	 * @typedef {object} LoadingOptions
	 * @property {string} [text=''] 可选文字，去除首尾空白；为空时仅显示圆环。
	 * @method show 接受字符串或 LoadingOptions，省略参数等同空文字；返回是否接受，未挂载、已卸载或文字类型无效时为 false。
	 * @method hide 主动关闭并取消未完成的布局准备，可重复调用；业务应在 finally 中调用。
	 * @remarks 放在 ucs-page overlay 等不受滚动裁剪的位置；使用 ucs-page 时已内置，通过 showMaskLoading/hideMaskLoading 调用。
	 * loading 优先于同页 popup，多个实例以最后激活者取得交互；关闭上层后仍显示的下层恢复阻断。
	 * 不保证覆盖原生导航栏、原生 Tabbar 或其他原生窗口，不处理页面隐藏、返回键或取消业务请求。
	 * @example loadingRef.value?.show({ text: '正在提交' })
	 * @example loadingRef.value?.hide()
	 */
	const layer = useOverlay('loading'), entry = shallowRef(null), ready = ref(false), panelRef = ref(null)
	const instance = getCurrentInstance()
	let mounted = false, disposed = false, version = 0
	const foregroundColor = computed(() => getThemeColor(['#FFFFFF', '#181818']))
	const rootStyle = computed(() => ({ zIndex: layer.maskZIndex.value, pointerEvents: entry.value && layer.isTop.value ? 'auto' : 'none' }))
	const panelStyle = computed(() => ({ opacity: ready.value ? 1 : 0, backgroundColor: getThemeColor(['rgba(0, 0, 0, 0.8)', 'rgba(255, 255, 255, 0.92)']) }))
	/** 只准备首次显示，迟到的布局结果不恢复已关闭或已替换的请求。 */
	async function prepare(request) {
		await nextTick()
		if (disposed || request !== version || !entry.value) return
		try {
			const element = panelRef.value?.$el ?? panelRef.value
			if (typeof element?.getBoundingClientRectAsync === 'function') await element.getBoundingClientRectAsync()
			else if (typeof element?.getBoundingClientRect === 'function') element.getBoundingClientRect()
			else if (typeof uni !== 'undefined' && typeof uni.createSelectorQuery === 'function') {
				await new Promise(resolve => uni.createSelectorQuery().in(instance.proxy).select('.ucs-loading__panel').boundingClientRect().exec(resolve))
			}
		} catch { /* 查询失败仍显示反馈，避免只留下透明阻断。 */ }
		if (!disposed && request === version && entry.value) ready.value = true
	}
	function show(options = {}) {
		if (!mounted || disposed) return false
		const value = typeof options === 'string' ? { text: options } : options
		if (!value || typeof value !== 'object' || Array.isArray(value) || (value.text !== undefined && typeof value.text !== 'string')) return false
		if (!entry.value && !layer.activate()) return false
		entry.value = Object.freeze({ text: (value.text ?? '').trim() })
		if (!ready.value) prepare(++version)
		return true
	}
	function hide() { version++; ready.value = false; entry.value = null; layer.release() }
	function onMask() {}
	onMounted(() => { mounted = true })
	onBeforeUnmount(() => { disposed = true; mounted = false; hide() })
	defineExpose({ show, hide })
</script>

<style>
	.ucs-loading { position: fixed; top: 0; right: 0; bottom: 0; left: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: transparent; }
	.ucs-loading__panel { display: flex; flex-direction: column; align-items: center; justify-content: center; max-width: 500rpx; padding: 16px 24px; border-radius: 12px; box-sizing: border-box; }
	.ucs-loading__text { margin-top: 8px; }
</style>
