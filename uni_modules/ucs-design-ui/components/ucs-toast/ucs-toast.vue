<template>
	<view class="ucs-toast" :flatten="false" :style="rootStyle">
		<view v-for="item in items" :key="item.id" class="ucs-toast__layer" :flatten="false" :style="{ opacity: activeId === item.id ? 1 : 0 }">
			<view :id="`ucs-toast-${item.id}`" :ref="element => setPanel(item.id, element)" class="ucs-toast__content"
				:class="item.type === 'text' ? 'ucs-toast__content--text' : 'ucs-toast__content--result'" :flatten="false" :style="contentStyle">
				<view v-if="item.icon" class="ucs-toast__icon">
					<ucs-icon :name="item.icon" :size="32" :color="foregroundColor" />
				</view>
				<ucs-text :text="item.text" :size="14" :color="foregroundColor" align="center" />
			</view>
		</view>
	</view>
</template>

<script setup>
	import { computed, getCurrentInstance, nextTick, onBeforeUnmount, ref, shallowRef } from 'vue'
	import { getThemeColor } from '../../core/config.js'
	import { useOverlay } from '../../internal/overlay.js'
	const layer = useOverlay('toast')
	const rootStyle = computed(() => ({ zIndex: layer.toastZIndex.value }))

	/**
	 * ucs-toast 轻提示。
	 * @description 通过组件 ref 显示短暂结果反馈；无按钮、遮罩和插槽，不拦截点击或滚动。
	 * 文字和图标跟随全局字号，背景及前景响应明暗主题。重复 show 替换当前内容并重新计时，不排队。
	 * 纯文字使用上下 10px、左右 20px 留白及 8px 圆角；成功和失败保留上下图文布局。
	 * 每次 show 创建独立节点，透明挂载并查询布局后替换旧提示；实际显示后开始计时。
	 * 准备期间最多保留一条旧提示和一条新提示，连续调用只提交最后一次请求。
	 * 建议每页放置一个实例，放在 ucs-page 的 overlay 插槽，避免滚动容器裁剪及父级 transform 影响定位。
	 * 同页浮层不保证覆盖原生导航栏、Tabbar 或其他原生窗口；页面卸载时自动清理定时器。
	 * 在 App 全局反馈层始终位于活动 popup 上方，不改变弹层的交互归属。
	 * @typedef {object} ToastOptions
	 * @property {string} text 提示文字，首尾空白会被去除；空白或非字符串不显示，也不打断现有提示。
	 * @property {'text'|'success'|'error'} [type='text'] 纯文字、checkmark-circle 成功图标或 close-circle 失败图标；无效值回退 text。
	 * @property {number} [duration=2000] 显示时长，单位 ms；0 表示持续显示直至 hide 或下一次 show，非有限值或负数回退 2000。
	 * @method show 显示提示，接受文字字符串或 ToastOptions；成功返回 true，无效文字或组件已卸载返回 false。
	 * @method hide 移除当前及待显示提示，取消自动关闭和未完成的准备请求；可重复调用。
	 * @example
	 * <ucs-toast ref="toastRef" />
	 * toastRef.value?.show('请先填写姓名')
	 * toastRef.value?.show({ text: '保存成功', type: 'success', duration: 1500 })
	 * toastRef.value?.hide()
	 */
	const items = shallowRef([])
	const activeId = ref(0)
	const panels = new Map()
	const instance = getCurrentInstance()
	let sequence = 0
	let pendingId = 0
	let timer = null
	let disposed = false
	const foregroundColor = computed(() => getThemeColor(['#FFFFFF', '#181818']))
	const contentStyle = computed(() => ({
		backgroundColor: getThemeColor(['rgba(0, 0, 0, 0.8)', 'rgba(255, 255, 255, 0.92)'])
	}))

	/** 保存各独立面板的原生节点；销毁时删除，避免保留过期引用。 */
	function setPanel(id, element) {
		if (element === null) panels.delete(id)
		else panels.set(id, element?.$el ?? element)
	}

	/** 只取消当前自动关闭；准备阶段仍允许旧提示按原时长结束。 */
	function clearTimer() {
		if (timer !== null) clearTimeout(timer)
		timer = null
	}

	/**
	 * 查询已挂载面板的布局，不使用固定时间延迟。
	 * @param {number} id 提示 ID。
	 * @returns {Promise<void>} 原生异步查询、Web 同步布局或小程序选择器查询结束。
	 */
	async function waitForLayout(id) {
		const element = panels.get(id)
		if (typeof element?.getBoundingClientRectAsync === 'function') {
			await element.getBoundingClientRectAsync()
		} else if (typeof element?.getBoundingClientRect === 'function') {
			element.getBoundingClientRect()
		} else if (typeof uni !== 'undefined' && typeof uni.createSelectorQuery === 'function') {
			await new Promise(resolve => {
				uni.createSelectorQuery().in(instance.proxy).select(`#ucs-toast-${id}`).boundingClientRect().exec(() => resolve())
			})
		}
	}

	/**
	 * 新提示布局完成后提交显示，过期或被 hide 取消的请求不会恢复。
	 * @param {object} item 本次不可变提示记录。
	 * @returns {Promise<void>} 准备及显示提交结束。
	 */
	async function prepare(item) {
		await nextTick()
		if (disposed || pendingId !== item.id) return
		try {
			await waitForLayout(item.id)
		} catch {
			// 布局查询失败时降级为 nextTick 后显示，避免提示永久停在透明状态。
		}
		if (disposed || pendingId !== item.id) return
		if (!layer.activate()) { hide(); return }
		clearTimer()
		pendingId = 0
		activeId.value = item.id
		items.value = [item]
		if (item.duration > 0) {
			timer = setTimeout(() => {
				if (disposed || activeId.value !== item.id) return
				timer = null
				activeId.value = 0
				layer.release()
				items.value = items.value.filter(value => value.id !== item.id)
			}, item.duration)
		}
	}

	/**
	 * 显示或替换提示；只在文字有效时修改现有状态。
	 * @param {string|ToastOptions} options 文字或完整选项。
	 * @returns {boolean} 是否接受本次显示请求。
	 */
	function show(options) {
		if (disposed) return false
		const value = typeof options === 'string' ? { text: options } : options
		if (value === null || typeof value !== 'object' || typeof value.text !== 'string' || !value.text.trim()) return false
		const duration = Number.isFinite(value.duration) && value.duration >= 0
			? (value.duration === 0 ? 0 : Math.min(Math.max(1, Math.floor(value.duration)), 2147483647)) : 2000
		const nextType = typeof value.type === 'string' ? value.type.trim().toLowerCase() : ''
		const type = ['success', 'error'].includes(nextType) ? nextType : 'text'
		const item = Object.freeze({
			id: ++sequence, text: value.text.trim(), type, duration,
			icon: type === 'success' ? 'checkmark-circle' : type === 'error' ? 'close-circle' : ''
		})
		pendingId = item.id
		items.value = [...items.value.filter(value => value.id === activeId.value), item]
		prepare(item)
		return true
	}

	/** 移除所有提示并取消准备请求；保留轻量管理容器，不等待退出动画。 */
	function hide() {
		clearTimer()
		pendingId = 0
		activeId.value = 0
		items.value = []
		panels.clear()
		layer.release()
	}

	onBeforeUnmount(() => { disposed = true; hide() })
	defineExpose({ show, hide })
</script>

<style>
	.ucs-toast { position: fixed; top: 0; right: 0; bottom: 0; left: 0; pointer-events: none; }
	.ucs-toast__layer { position: absolute; top: 0; right: 0; bottom: 0; left: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none; }
	.ucs-toast__content { display: flex; flex-direction: column; align-items: center; justify-content: center; max-width: 500rpx; box-sizing: border-box; pointer-events: none; }
	.ucs-toast__content--text { padding: 10px 20px; border-radius: 8px; }
	.ucs-toast__content--result { padding: 16px 24px; border-radius: 12px; }
	.ucs-toast__icon { display: flex; align-items: center; justify-content: center; margin-bottom: 8px; pointer-events: none; }
</style>
