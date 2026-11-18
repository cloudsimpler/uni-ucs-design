<template>
	<ucs-popup ref="popupRef" placement="bottom" :radius="12" :close-on-click-mask="false" @open="emit('open')" @close="onClose" @click-mask="onMask">
		<view class="ucs-datetime-picker">
			<view class="ucs-datetime-picker__toolbar">
				<view class="ucs-datetime-picker__close" :hover-class="pressClass" @tap="cancel"><ucs-icon name="close" :size="22" :scale-with-font="false" /></view>
				<view class="ucs-datetime-picker__title"><ucs-text :text="props.title" :size="16" :weight="500" :wrap="false" align="center" width="100%" /></view>
				<view class="ucs-datetime-picker__spacer" />
			</view>
			<picker-view v-if="session" :value="indexes" :style="pickerStyle" :indicator-style="indicatorStyle" @change="onChange" @pickstart="busy = true" @pickend="busy = false">
				<picker-view-column v-for="(column, index) in columns" :key="`${session.mode}-${index}`" :style="{ flex: session.mode !== 'time' && index === 0 ? 1.4 : 1 }">
					<view v-for="number in column" :key="number" class="ucs-datetime-picker__item" :style="{ height: `${rowHeight}px` }"><ucs-text :text="String(number).padStart(2, '0') + units[index]" :size="16" :wrap="false" /></view>
				</picker-view-column>
			</picker-view>
			<view class="ucs-datetime-picker__footer"><ucs-button :text="confirmLabel" :disabled="busy" @click="confirm" /></view>
		</view>
	</ucs-popup>
</template>

<script setup>
	import { computed, ref, shallowRef } from 'vue'
	import { getFontSize, getThemeColor, getThemeMode, getUcsDesignText } from '../../core/config.js'
	import { createSession, clampValue, getColumns, formatValue } from './datetime.js'
	/**
	 * ucs-datetime-picker 日期时间选择面板，不内置输入框，通过 ref.open()/close() 控制。
	 * @description 使用本地日历字段，不解析日期字符串为时间戳、不转换时区；默认范围 1900～2100 年。
	 * 打开时复制已确认值为草稿，空值/非法值使用本地当前时间并限制在范围内；滚动不修改 modelValue。
	 * 年月联动处理闰年、月末和边界。mode/min/max/modelValue 在下一次打开时重新读取，已打开时不覆盖草稿。
	 * @property {string} [modelValue=''] 已确认值：date 为 YYYY-MM-DD，time 为 HH:mm，datetime 为 YYYY-MM-DD HH:mm。
	 * @property {string} [mode='datetime'] date、time、datetime；不支持秒、区间、农历或跨午夜时间范围。
	 * @property {string} [min=''] 最小值，格式同当前模式；日期年份支持 1000～9999。
	 * @property {string} [max=''] 最大值，格式同当前模式；边界非法时 open 返回 false 并派发 error。
	 * @property {string} [title=''] 面板标题。
	 * @property {string} [confirmText=''] 确认文字，空白使用 core common.confirm。
	 * @property {boolean} [closeOnClickMask=true] 遮罩点击是否取消。
	 * @event open 接受打开时触发。
	 * @event {string} close 开始关闭时触发，原因 confirm/cancel/mask/close。
	 * @event {string} update:modelValue 确认后更新格式化值；取消及程序关闭不更新。
	 * @event {string} confirm 确认值，位于 close 和 update:modelValue 之后。
	 * @event {string} cancel 取消原因 cancel/mask，位于 close 之后。
	 * @event {Error} error 打开时配置错误。
	 * @method open 初始化草稿并打开，返回 boolean；重复打开保持当前草稿。
	 * @method close 丢弃草稿并关闭，不派发 cancel；返回 boolean。
	 * @remarks 顶部为关闭图标与居中标题，底部复用 ucs-button 确认；滚轮滚动期间确认禁用。
	 * 关闭图标点击区域 44px，图标固定 22px；主题、字号、确认文案实时更新，底部安全区由 popup 处理。放在 page overlay 插槽。
	 */
	const props = defineProps({ modelValue: { type: String, default: '' }, mode: { type: String, default: 'datetime' }, min: { type: String, default: '' }, max: { type: String, default: '' }, title: { type: String, default: '' }, confirmText: { type: String, default: '' }, closeOnClickMask: { type: Boolean, default: true } })
	const emit = defineEmits(['open', 'close', 'update:modelValue', 'confirm', 'cancel', 'error'])
	const popupRef = ref(null), opened = ref(false), busy = ref(false)
	const session = shallowRef(null), draft = shallowRef([])
	let reason = 'close'
	const columns = computed(() => session.value ? getColumns(draft.value, session.value) : [])
	const indexes = computed(() => columns.value.map((column, i) => column.indexOf(draft.value[i])))
	const units = computed(() => (session.value?.mode === 'time' ? ['hour', 'minute'] : session.value?.mode === 'date' ? ['year', 'month', 'day'] : ['year', 'month', 'day', 'hour', 'minute']).map(key => getUcsDesignText(`datetime.${key}`)))
	const rowHeight = computed(() => Math.max(48, getFontSize(16) * 1.5 + 16))
	const pickerStyle = computed(() => ({ height: `${rowHeight.value * 5}px` }))
	const indicatorStyle = computed(() => `height:${rowHeight.value}px;border-top-width:0.5px;border-bottom-width:0.5px;border-color:${getThemeColor(['gray-3','gray-4'])};`)
	const confirmLabel = computed(() => props.confirmText.trim() || getUcsDesignText('common.confirm'))
	const pressClass = computed(() => getThemeMode() === 'dark' ? 'ucs-datetime-picker__close--pressed-dark' : 'ucs-datetime-picker__close--pressed')
	function open() {
		if (!popupRef.value) return false
		if (opened.value) return true
		try {
			const next = createSession(props.mode, props.min, props.max, props.modelValue)
			session.value = next.session; draft.value = next.value; busy.value = false; opened.value = true; reason = 'close'
			if (popupRef.value.open()) return true
			opened.value = false
		} catch (error) { opened.value = false; emit('error', error) }
		return false
	}
	function finish(value) { if (!opened.value) return false; reason = value; return popupRef.value?.close() ?? false }
	function close() { return finish('close') }
	function onClose() { const value = reason; opened.value = false; busy.value = false; emit('close', value) }
	function cancel() { if (finish('cancel')) emit('cancel', 'cancel') }
	function onMask() { if (props.closeOnClickMask && finish('mask')) emit('cancel', 'mask') }
	function confirm() {
		if (!opened.value || busy.value) return false
		const value = formatValue(draft.value, session.value.mode)
		if (!finish('confirm')) return false
		emit('update:modelValue', value); emit('confirm', value); return true
	}
	function onChange(event) {
		if (!opened.value) return
		const values = event?.detail?.value
		if (!Array.isArray(values) || values.length !== columns.value.length) return
		if (values.some((value, i) => !Number.isInteger(value) || value < 0 || value >= columns.value[i].length)) return
		draft.value = clampValue(values.map((value, i) => columns.value[i][value]), session.value)
	}
	defineExpose({ open, close })
</script>

<style>
	.ucs-datetime-picker { display: flex; flex-direction: column; }
	.ucs-datetime-picker__toolbar { display: flex; flex-direction: row; align-items: center; padding: 8px; }
	.ucs-datetime-picker__close { display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; flex-shrink: 0; border-radius: 8px; }
	.ucs-datetime-picker__spacer { width: 44px; flex-shrink: 0; }
	.ucs-datetime-picker__title { flex: 1; min-width: 0; padding: 0 4px; }
	.ucs-datetime-picker__item { display: flex; align-items: center; justify-content: center; }
	.ucs-datetime-picker__footer { display: flex; flex-direction: column; align-items: center; padding: 24px 24px 20px; }
	.ucs-datetime-picker__close--pressed { background-color: rgba(0, 0, 0, 0.06); }
	.ucs-datetime-picker__close--pressed-dark { background-color: rgba(255, 255, 255, 0.06); }
</style>
