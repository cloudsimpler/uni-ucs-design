<template>
	<ucs-popup ref="popupRef" placement="bottom" :radius="12" :close-on-click-mask="false"
		@open="emit('open')" @close="onClose" @click-mask="onClickMask">
		<view class="ucs-action-sheet">
			<view v-if="props.title" class="ucs-action-sheet__title">
				<ucs-text :text="props.title" :size="12" :line-height="18" :color="mutedColor" align="center" />
			</view>
			<view v-if="props.actions.length">
				<view v-for="(item, index) in props.actions" :key="index" class="ucs-action-sheet__row"
					:style="rowStyle(item, index)">
					<ucs-text :text="item.text" :size="16" :line-height="24" :wrap="false" width="100%" :color="itemColor(item)" align="center" />
					<view v-if="item.description" class="ucs-action-sheet__description">
						<ucs-text :text="item.description" :size="12" :line-height="18" :wrap="false" :color="item.disabled ? disabledColor : mutedColor" align="center" />
					</view>
					<button class="ucs-action-sheet__native" :style="{ opacity: item.disabled ? 0 : 1 }" :disabled="item.disabled === true" :hover-class="pressClass"
						@click="select(index)">{{ item.text }}</button>
				</view>
			</view>
			<view v-if="props.showCancel" class="ucs-action-sheet__cancel" :style="{ borderColor: gapColor }">
				<view class="ucs-action-sheet__row" :style="{ height: `${rowHeight}px` }">
					<ucs-text :text="cancelLabel" :size="16" :line-height="24" align="center" />
					<button class="ucs-action-sheet__native" :hover-class="pressClass" @click="cancel('cancel')">{{ cancelLabel }}</button>
				</view>
			</view>
		</view>
	</ucs-popup>
</template>

<script setup>
	import { computed, ref } from 'vue'
	import { getFontSize, getThemeColor, getThemeMode, getUcsDesignText } from '../../core/config.js'

	/**
	 * ucs-action-sheet 底部操作菜单，复用 popup 动画、浮层管理和底部安全区。
	 * @description 通过 ref.open()/close() 控制，无 show 属性或插槽。标题 12px，菜单及取消 16px，副标题 12px，跟随 core 字号偏移。
	 * 菜单文字单行显示，长文案省略；标题允许换行。菜单随内容自然撑开，不提供内部滚动。
	 * 原生 button 仅提供透明交互层，不嵌套 UCS 组件。颜色直接由 core 解析。
	 * @property {string} [title=''] 顶部说明标题，空字符串不显示。
	 * @property {Array<object>} [actions=[]] 菜单项：text（必填字符串）、description（可选副标题）、type（default/primary/success/warning/danger）、disabled（布尔值）。
	 * @property {boolean} [showCancel=true] 是否显示取消区。
	 * @property {string} [cancelText=''] 取消文案，空白时使用 core common.cancel。
	 * @property {boolean} [closeOnClickMask=true] 点击遮罩是否取消。
	 * @event open 接受打开后触发，重复打开不重复派发。
	 * @event {string} close 开始关闭时触发，原因为 select、cancel、mask 或 close。
	 * @event {object} select 点击可用菜单并开始关闭后触发，参数 { item, index }；item 是点击时的原菜单对象。
	 * @event {string} cancel 点击取消或遮罩并开始关闭后触发，参数 cancel 或 mask；程序 close 不触发。
	 * @method open 打开菜单，返回是否接受，已打开保持幂等。
	 * @method close 程序关闭，返回是否接受；无业务回调等待，异步确认请使用 dialog。
	 * @remarks 建议放在页面 overlay 插槽中。关闭事件先于 select/cancel；事件回调中可重新打开。
	 */
	const props = defineProps({
		title: { type: String, default: '' },
		actions: { type: Array, default: () => [] },
		showCancel: { type: Boolean, default: true },
		cancelText: { type: String, default: '' },
		closeOnClickMask: { type: Boolean, default: true }
	})
	const emit = defineEmits(['open', 'close', 'select', 'cancel'])
	const popupRef = ref(null)
	let closeReason = 'close'
	const cancelLabel = computed(() => props.cancelText.trim() || getUcsDesignText('common.cancel'))
	const mutedColor = computed(() => getThemeColor(['gray-7', 'gray-8']))
	const disabledColor = computed(() => getThemeColor(['gray-6', 'gray-7']))
	const lineColor = computed(() => getThemeColor(['gray-3', 'gray-4']))
	const gapColor = computed(() => getThemeColor(['gray-2', 'gray-1']))
	const pressClass = computed(() => getThemeMode() === 'dark' ? 'ucs-action-sheet__pressed-dark' : 'ucs-action-sheet__pressed')
	const rowHeight = computed(() => Math.max(56, getFontSize(16) * 1.5 + 24))
	function itemHeight(item) { return item.description ? Math.max(rowHeight.value, getFontSize(16) * 1.5 + getFontSize(12) * 1.5 + 18) : rowHeight.value }
	function itemColor(item) {
		if (item.disabled) return disabledColor.value
		return getThemeColor(['primary', 'success', 'warning', 'danger'].includes(item.type) ? `${item.type}-6` : ['gray-12', 'gray-10'])
	}
	function rowStyle(item, index) {
		return { height: `${itemHeight(item)}px`, borderTopWidth: props.title || index > 0 ? '0.5px' : '0px', borderColor: lineColor.value }
	}
	function open() { return popupRef.value?.open() ?? false }
	function closeWithReason(reason) {
		closeReason = reason
		return popupRef.value?.close() ?? false
	}
	function close() { return closeWithReason('close') }
	function onClose() { const reason = closeReason; closeReason = 'close'; emit('close', reason) }
	/** 关闭前捕获选项，避免 close 监听器修改列表后事件参数错位。 */
	function select(index) {
		const item = props.actions[index]
		if (!item || item.disabled) return false
		if (!closeWithReason('select')) return false
		emit('select', { item, index })
		return true
	}
	function cancel(reason) {
		if (!closeWithReason(reason)) return false
		emit('cancel', reason)
		return true
	}
	function onClickMask() { if (props.closeOnClickMask) cancel('mask') }
	defineExpose({ open, close })
</script>

<style>
	.ucs-action-sheet { display: flex; flex-direction: column; }
	.ucs-action-sheet__title { padding: 16px 24px; }
	.ucs-action-sheet__row { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0 24px; box-sizing: border-box; border-top-style: solid; border-top-width: 0; flex-shrink: 0; }
	.ucs-action-sheet__description { width: 100%; margin-top: 2px; }
	.ucs-action-sheet__cancel { border-top-width: 8px; border-top-style: solid; }
	.ucs-action-sheet__native { position: absolute; top: 0; right: 0; bottom: 0; left: 0; width: 100%; height: 100%; margin: 0; padding: 0; color: transparent; background-color: transparent; border-width: 0; border-radius: 0; }
	.ucs-action-sheet__pressed { background-color: rgba(0, 0, 0, 0.06); }
	.ucs-action-sheet__pressed-dark { background-color: rgba(255, 255, 255, 0.06); }
	/* #ifdef H5 || WEB || MP */
	.ucs-action-sheet__native::after { border: none; }
	/* #endif */
</style>
