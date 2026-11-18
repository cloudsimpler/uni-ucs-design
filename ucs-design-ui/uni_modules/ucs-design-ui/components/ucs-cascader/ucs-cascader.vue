<template>
	<ucs-popup ref="popupRef" placement="bottom" :radius="12" :close-on-click-mask="false" @open="emit('open')" @close="onClose" @click-mask="onMask">
		<view class="ucs-cascader">
			<view class="ucs-cascader__toolbar">
				<view class="ucs-cascader__close" :hover-class="pressClass" @tap="cancel"><ucs-icon name="close" :size="22" :scale-with-font="false" /></view>
				<view class="ucs-cascader__title"><ucs-text :text="props.title" :size="16" :weight="500" :wrap="false" align="center" width="100%" /></view>
				<view class="ucs-cascader__spacer" />
			</view>
			<picker-view :value="selection.indexes" :style="pickerStyle" :indicator-style="indicatorStyle" @change="onChange" @pickstart="busy = true" @pickend="busy = false">
				<picker-view-column v-for="(column, columnIndex) in selection.columns" :key="columnKey(columnIndex)">
					<view v-for="(option, index) in column" :key="index" class="ucs-cascader__item" :style="{ height: `${rowHeight}px` }"><ucs-text :text="option.label" :size="16" :wrap="false" align="center" width="100%" /></view>
				</picker-view-column>
			</picker-view>
			<view class="ucs-cascader__footer"><ucs-button :text="confirmLabel" :disabled="blocked" @click="confirm" /></view>
		</view>
	</ucs-popup>
</template>

<script setup>
	import { computed, ref, shallowRef } from 'vue'
	import { getFontSize, getThemeColor, getThemeMode, getUcsDesignText } from '../../core/config.js'
	import { snapshotTree, buildPath } from './tree.js'
	/**
	 * ucs-cascader 同步树形数据的多列级联选择器，不内置城市数据、搜索、定位或异步加载。
	 * @description 通过 ref 控制底部面板，v-model 绑定从根到叶的业务值数组，不使用滚轮下标作为业务值。
	 * 打开时复制 label/value/children 树；滚动只改草稿，上级变化后下级逐层预选首项，直到叶子。
	 * 未选择值使用 []；已有路径失效时保留有效前缀，从失效层首项补齐。只有确认才修改 modelValue。
	 * @property {Array<string|number>} [modelValue=[]] 已确认的完整路径；数字和字符串值严格区分。
	 * @property {Array<object>} [options=[]] 节点 { label:string, value:string|number, children?:Array }；同级 value 唯一，数字须有限；无 children 或空数组表示叶子。
	 * @property {string} [title=''] 居中标题。
	 * @property {string} [confirmText=''] 底部确认文字，空白使用 core common.confirm。
	 * @property {boolean} [closeOnClickMask=true] 遮罩点击是否取消。
	 * @event open 接受打开后触发。
	 * @event {string} close 开始关闭，原因 confirm/cancel/mask/close。
	 * @event {Array<string|number>} update:modelValue 确认后提交完整业务值路径。
	 * @event {object} confirm 参数 { value, options, indexes }，分别为业务值路径、只读节点快照路径及本轮下标路径。
	 * @event {string} cancel 点击关闭图标或遮罩时触发，参数 cancel/mask。
	 * @event {Error} error 树或 modelValue 配置无效，open 返回 false。
	 * @method open 读取最新选项和绑定值初始化草稿；重复调用不重置，返回 boolean。
	 * @method close 程序关闭，不提交草稿、不派发 cancel，返回 boolean。
	 * @remarks 选项和外部值的变化在下一次打开生效；空树可打开但确认禁用，只允许提交叶子路径。
	 * 确认顺序 close → update:modelValue → confirm；取消为 close → cancel。滚动期间确认禁用。
	 * 无标题区域、行内容或底部操作插槽；文字及行高跟随 core 字号，复用 popup 安全区与全局浮层，放在 page overlay 中。
	 */
	const props = defineProps({ modelValue: { type: Array, default: () => [] }, options: { type: Array, default: () => [] }, title: { type: String, default: '' }, confirmText: { type: String, default: '' }, closeOnClickMask: { type: Boolean, default: true } })
	const emit = defineEmits(['open', 'close', 'update:modelValue', 'confirm', 'cancel', 'error'])
	const popupRef = ref(null), opened = ref(false), busy = ref(false)
	const tree = shallowRef([]), draft = shallowRef([])
	let reason = 'close'
	const selection = computed(() => buildPath(tree.value, draft.value))
	/** 同一层的不同分支使用独立滚轮，根列保持稳定，避免下级继承旧分支的原生索引。 */
	function columnKey(index) { return JSON.stringify(selection.value.path.slice(0, index).map(option => option.value)) }
	const blocked = computed(() => busy.value || selection.value.path.length === 0)
	const rowHeight = computed(() => Math.max(48, getFontSize(16) * 1.5 + 16))
	const pickerStyle = computed(() => ({ height: `${rowHeight.value * 5}px` }))
	const indicatorStyle = computed(() => `height:${rowHeight.value}px;border-top-width:0.5px;border-bottom-width:0.5px;border-color:${getThemeColor(['gray-3','gray-4'])};`)
	const confirmLabel = computed(() => props.confirmText.trim() || getUcsDesignText('common.confirm'))
	const pressClass = computed(() => getThemeMode() === 'dark' ? 'ucs-cascader__close--pressed-dark' : 'ucs-cascader__close--pressed')
	function open() {
		if (!popupRef.value) return false
		if (opened.value) return true
		let next
		try {
			if (!Array.isArray(props.modelValue) || props.modelValue.some(value => typeof value !== 'string' && !(typeof value === 'number' && Number.isFinite(value)))) throw new TypeError('ucs-cascader: modelValue 必须为字符串或有限数字的路径数组')
			next = snapshotTree(props.options)
		} catch (error) { emit('error', error); return false }
		tree.value = next; draft.value = [...props.modelValue]; busy.value = false; opened.value = true; reason = 'close'
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
		const current = selection.value
		const value = current.path.map(option => option.value)
		const payload = { value: [...value], options: [...current.path], indexes: [...current.indexes] }
		if (!finish('confirm')) return false
		emit('update:modelValue', value); emit('confirm', payload); return true
	}
	function onChange(event) {
		if (!opened.value) return
		const values = event?.detail?.value, current = selection.value
		if (!Array.isArray(values) || values.length === 0) return
		// 原生滚轮动态增减列后可能仍携带旧长度；优先处理仍存在的上级列，忽略尾部旧列。
		for (let i = 0; i < Math.min(values.length, current.columns.length); i++) {
			const index = values[i]
			if (!Number.isInteger(index) || index < 0 || index >= current.columns[i].length) return
			if (index !== current.indexes[i]) {
				// 只应用第一处上级变化，下级旧索引属于旧分支，不得套用到新分支。
				draft.value = [...current.path.slice(0, i).map(option => option.value), current.columns[i][index].value]
				return
			}
		}
	}
	defineExpose({ open, close })
</script>

<style>
	.ucs-cascader { display: flex; flex-direction: column; }
	.ucs-cascader__toolbar { display: flex; flex-direction: row; align-items: center; padding: 8px; }
	.ucs-cascader__close { display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; flex-shrink: 0; border-radius: 8px; }
	.ucs-cascader__spacer { width: 44px; flex-shrink: 0; }
	.ucs-cascader__title { flex: 1; min-width: 0; padding: 0 4px; }
	.ucs-cascader__item { padding: 0 24px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; }
	.ucs-cascader__footer { display: flex; flex-direction: column; align-items: center; padding: 24px 24px 20px; }
	.ucs-cascader__close--pressed { background-color: rgba(0, 0, 0, 0.06); }
	.ucs-cascader__close--pressed-dark { background-color: rgba(255, 255, 255, 0.06); }
</style>
