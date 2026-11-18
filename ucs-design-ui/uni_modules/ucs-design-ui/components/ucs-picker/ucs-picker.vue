<template>
	<ucs-popup ref="popupRef" placement="bottom" :radius="12" :close-on-click-mask="false" @open="emit('open')" @close="onClose" @click-mask="onMask">
		<view class="ucs-picker">
			<view class="ucs-picker__toolbar">
				<view class="ucs-picker__close" :hover-class="pressClass" @tap="cancel"><ucs-icon name="close" :size="22" :scale-with-font="false" /></view>
				<view class="ucs-picker__title"><ucs-text :text="props.title" :size="16" :weight="500" :wrap="false" align="center" width="100%" /></view>
				<view class="ucs-picker__spacer" />
			</view>
			<picker-view :value="[draftIndex]" :style="pickerStyle" :indicator-style="indicatorStyle" @change="onChange" @pickstart="busy = true" @pickend="busy = false">
				<picker-view-column>
					<view v-for="(option, index) in currentOptions" :key="index" class="ucs-picker__item" :style="{ height: `${rowHeight}px` }"><ucs-text :text="option.label" :size="16" :wrap="false" align="center" width="100%" /></view>
				</picker-view-column>
			</picker-view>
			<view class="ucs-picker__footer"><ucs-button :text="confirmLabel" :disabled="blocked" @click="confirm" /></view>
		</view>
	</ucs-popup>
</template>

<script setup>
	import { computed, ref, shallowRef } from 'vue'
	import { getFontSize, getThemeColor, getThemeMode, getUcsDesignText } from '../../core/config.js'

	/**
	 * ucs-picker 单列滚轮选择面板，无内置输入框、展示行或插槽。
	 * @description 通过 ref.open()/close() 控制显示，v-model 绑定业务值而非下标。
	 * 打开时浅复制选项作为本轮快照；options/modelValue 的外部变化在下一次打开生效，不覆盖草稿。
	 * null、未命中值默认预选第一项，但只有确认才提交；空列表允许打开，确认禁用。
	 * 关闭图标、遮罩均丢弃草稿。五行滚轮的行高随 core 字号增长，底部安全区由 popup 提供。
	 * @property {string|number|null} [modelValue=null] 已确认的业务值，数字 0 和字符串 '0' 不同。
	 * @property {Array<object>} [options=[]] 选项 { label:string, value:string|number }；值须唯一，数字须有限，不支持禁用项、多列或搜索。
	 * @property {string} [title=''] 居中标题。
	 * @property {string} [confirmText=''] 确认文字，空白使用 core common.confirm。
	 * @property {boolean} [closeOnClickMask=true] 点击遮罩是否取消。
	 * @event open 接受打开请求后触发，重复打开不重置草稿。
	 * @event {string} close 开始关闭，原因 confirm/cancel/mask/close。
	 * @event {string|number} update:modelValue 确认后提交选项业务值。
	 * @event {object} confirm 参数 { value, option, index }，option 为本轮选项的只读浅快照，index 为本轮下标。
	 * @event {string} cancel 点击关闭图标或遮罩时触发，参数 cancel/mask；程序 close 不派发。
	 * @event {Error} error 选项无效或重复值时触发，open 返回 false，不打开。
	 * @method open 初始化草稿并打开，返回 boolean；未挂载/已卸载返回 false。
	 * @method close 程序关闭，返回是否接受，不提交草稿。
	 * @remarks 确认顺序 close → update:modelValue → confirm；取消为 close → cancel。滚动期间确认禁用。
	 * 放在 ucs-page overlay 中，使用自动组件导入，不向 ucs-* 使用节点添加布局 class。
	 */
	const props = defineProps({ modelValue: { type: [String, Number], default: null }, options: { type: Array, default: () => [] }, title: { type: String, default: '' }, confirmText: { type: String, default: '' }, closeOnClickMask: { type: Boolean, default: true } })
	const emit = defineEmits(['open', 'close', 'update:modelValue', 'confirm', 'cancel', 'error'])
	const popupRef = ref(null), opened = ref(false), busy = ref(false), draftIndex = ref(0)
	const currentOptions = shallowRef([])
	let reason = 'close'
	const blocked = computed(() => busy.value || currentOptions.value.length === 0)
	const rowHeight = computed(() => Math.max(48, getFontSize(16) * 1.5 + 16))
	const pickerStyle = computed(() => ({ height: `${rowHeight.value * 5}px` }))
	const indicatorStyle = computed(() => `height:${rowHeight.value}px;border-top-width:0.5px;border-bottom-width:0.5px;border-color:${getThemeColor(['gray-3','gray-4'])};`)
	const confirmLabel = computed(() => props.confirmText.trim() || getUcsDesignText('common.confirm'))
	const pressClass = computed(() => getThemeMode() === 'dark' ? 'ucs-picker__close--pressed-dark' : 'ucs-picker__close--pressed')
	function open() {
		if (!popupRef.value) return false
		if (opened.value) return true
		let options
		try {
			const seen = new Set()
			options = props.options.map(option => {
				if (!option || typeof option.label !== 'string' || (typeof option.value !== 'string' && !(typeof option.value === 'number' && Number.isFinite(option.value)))) throw new TypeError('ucs-picker: 选项须包含字符串 label 和字符串或有限数字 value')
				if (seen.has(option.value)) throw new TypeError('ucs-picker: 选项 value 不可重复')
				seen.add(option.value)
				return Object.freeze({ ...option })
			})
		} catch (error) { emit('error', error); return false }
		currentOptions.value = options
		draftIndex.value = Math.max(0, options.findIndex(option => option.value === props.modelValue))
		busy.value = false; reason = 'close'; opened.value = true
		if (popupRef.value.open()) return true
		opened.value = false; return false
	}
	function finish(value) { if (!opened.value) return false; reason = value; return popupRef.value?.close() ?? false }
	function close() { return finish('close') }
	function onClose() { const value = reason; opened.value = false; busy.value = false; emit('close', value) }
	function cancel() { if (finish('cancel')) emit('cancel', 'cancel') }
	function onMask() { if (props.closeOnClickMask && finish('mask')) emit('cancel', 'mask') }
	function confirm() {
		if (!opened.value || blocked.value) return false
		const index = draftIndex.value, option = currentOptions.value[index], value = option.value
		if (!finish('confirm')) return false
		emit('update:modelValue', value); emit('confirm', { value, option, index }); return true
	}
	function onChange(event) {
		const values = event?.detail?.value, index = values?.[0]
		if (!opened.value || !Array.isArray(values) || values.length !== 1 || !Number.isInteger(index) || index < 0 || index >= currentOptions.value.length) return
		draftIndex.value = index
	}
	defineExpose({ open, close })
</script>

<style>
	.ucs-picker { display: flex; flex-direction: column; }
	.ucs-picker__toolbar { display: flex; flex-direction: row; align-items: center; padding: 8px; }
	.ucs-picker__close { display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; flex-shrink: 0; border-radius: 8px; }
	.ucs-picker__spacer { width: 44px; flex-shrink: 0; }
	.ucs-picker__title { flex: 1; min-width: 0; padding: 0 4px; }
	.ucs-picker__item { padding: 0 24px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; }
	.ucs-picker__footer { display: flex; flex-direction: column; align-items: center; padding: 24px 24px 20px; }
	.ucs-picker__close--pressed { background-color: rgba(0, 0, 0, 0.06); }
	.ucs-picker__close--pressed-dark { background-color: rgba(255, 255, 255, 0.06); }
</style>
