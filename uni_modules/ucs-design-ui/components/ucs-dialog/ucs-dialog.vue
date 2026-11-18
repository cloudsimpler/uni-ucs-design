<template>
	<ucs-popup ref="popupRef" placement="center" :radius="12" :close-on-click-mask="false"
		@open="onOpen" @close="onClose" @click-mask="onClickMask">
		<view class="ucs-dialog">
			<view v-if="props.title" class="ucs-dialog__title">
				<ucs-text :text="props.title" :size="16" :line-height="24" :weight="500" align="center" />
			</view>
			<view class="ucs-dialog__body" :style="{ paddingTop: props.title ? '0px' : '24px' }">
				<slot :pending="pending">
					<ucs-text v-if="props.message" :text="props.message" :size="16" :line-height="24"
						:weight="400" :color="bodyColor" align="center" />
				</slot>
			</view>
			<view class="ucs-dialog__actions" :style="{ flexDirection: props.vertical ? 'column' : 'row', borderColor: lineColor }">
				<view v-for="(action, index) in actions" :key="action.name" class="ucs-dialog__action" :style="actionStyle(index)">
					<view class="ucs-dialog__action-content">
						<view v-if="pendingAction === action.name" class="ucs-dialog__spinner">
							<ucs-spinner :size="20" :color="actionColor(action.name)" />
						</view>
						<ucs-text :text="action.text" :size="16" :line-height="24" :weight="400" :wrap="false"
							:color="actionColor(action.name)" :style="{ minWidth: '0px', flexShrink: 1 }" />
					</view>
					<button class="ucs-dialog__native" :style="{ opacity: pending ? 0 : 1 }" :disabled="pending" :hover-class="pressClass"
						@click="requestAction(action.name)">{{ action.text }}</button>
				</view>
			</view>
		</view>
	</ucs-popup>
</template>

<script setup>
	import { computed, onBeforeUnmount, ref } from 'vue'
	import { getFontSize, getThemeColor, getThemeMode, getUcsDesignText } from '../../core/config.js'

	/**
	 * ucs-dialog 确认对话框，复用 ucs-popup 的动画和全局浮层管理，外观参考 WeUI。
	 * @description 通过 ref.open()/close() 控制，无 show 属性。默认居中，宽度 654rpx，左右各留 48rpx，圆角 12px。
	 * 标题、正文和操作文字基础字号均为 16px、行高 24px，跟随主题及字号；标题字重 500，其余 400。
	 * 内容四周留白 24px，标题与正文间隔 12px；操作行基础高度 56px，使用细分隔线和文字按钮。
	 * 操作文案默认取 core 的 common.confirm/common.cancel，不复用实心 ucs-button 外观。
	 * 异步业务通过 beforeClose 执行，不能依赖 confirm/cancel 事件监听器的返回值控制关闭。
	 * beforeClose 执行期间两按钮禁用，发起操作的按钮显示 loading；只有返回 false 才阻止关闭。
	 * 回调抛错时保持打开并派发 error，不自动展示错误文字或 toast；由页面处理业务反馈。
	 * 程序主动 close 可中止本轮等待并关闭，不能取消已发出的业务请求；旧结果不会关闭新一轮。
	 * 关闭后正文插槽随 popup 销毁，需要保留的数据由页面持有。建议放在页面 overlay 插槽内。
	 * 不接管原生返回键、键盘避让或不同原生窗口间的覆盖；长内容由正文插槽自行安排滚动。
	 * @property {string} [title=''] 标题，空字符串不展示标题区域。
	 * @property {string} [message=''] 默认正文，有默认插槽时由插槽替换。
	 * @property {string} [confirmText=''] 确认按钮文案，空白字符串使用内置多语言文案。
	 * @property {string} [cancelText=''] 取消按钮文案，空白字符串使用内置多语言文案。
	 * @property {string} [confirmType='primary'] 确认按钮类型：primary、success、warning、danger、default。
	 * @property {boolean} [vertical=false] 是否纵向排列操作，开启时确认在上、取消在下；横排时取消在左。
	 * @property {boolean} [showCancel=true] 是否显示取消按钮，单按钮时确认按钮占满操作区域。
	 * @property {boolean} [closeOnClickMask=false] 遮罩点击是否作为 cancel 操作，仍经过 beforeClose。
	 * @property {function('confirm'|'cancel'):(boolean|void|Promise<boolean|void>)} [beforeClose=null] 关闭前回调；false 保留对话框，其余正常返回值允许关闭。
	 * @slot default 替换正文，提供 pending；保留标题和操作区。
	 * @event open 接受新一轮打开请求后触发，重复 open 不重复触发。
	 * @event {string} close 开始关闭时触发，参数为 confirm、cancel 或 close（程序主动关闭）。
	 * @event confirm 确认回调允许关闭后触发；此时已发起关闭，发生在 close 事件之后。
	 * @event cancel 取消回调允许关闭后触发；此时已发起关闭，发生在 close 事件之后。
	 * @event {object} error 回调失败时触发，参数为 { action, error }；过期回调不派发事件。
	 * @method open 打开对话框，返回 boolean；未挂载或已卸载返回 false，已打开时保持幂等。
	 * @method close 主动关闭，不经过 beforeClose，不派发 confirm/cancel；返回是否接受。
	 * @example <ucs-dialog ref="dialogRef" title="删除记录" message="删除后无法恢复" confirm-type="danger" :before-close="handleAction" @error="handleError" />
	 */
	const props = defineProps({
		title: { type: String, default: '' },
		message: { type: String, default: '' },
		confirmText: { type: String, default: '' },
		cancelText: { type: String, default: '' },
		confirmType: { type: String, default: 'primary' },
		showCancel: { type: Boolean, default: true },
		vertical: { type: Boolean, default: false },
		closeOnClickMask: { type: Boolean, default: false },
		beforeClose: { type: Function, default: null }
	})
	const emit = defineEmits(['open', 'close', 'confirm', 'cancel', 'error'])
	const popupRef = ref(null)
	const opened = ref(false)
	const pendingAction = ref('')
	const pending = computed(() => pendingAction.value !== '')
	const confirmLabel = computed(() => props.confirmText.trim() || getUcsDesignText('common.confirm'))
	const cancelLabel = computed(() => props.cancelText.trim() || getUcsDesignText('common.cancel'))
	const lineColor = computed(() => getThemeColor(['gray-3', 'gray-4']))
	const bodyColor = computed(() => getThemeColor(props.title ? ['gray-7', 'gray-8'] : ['gray-12', 'gray-10']))
	const confirmColor = computed(() => {
		const type = ['primary', 'success', 'warning', 'danger', 'default'].includes(props.confirmType) ? props.confirmType : 'primary'
		return getThemeColor(type === 'default' ? ['gray-12', 'gray-10'] : `${type}-6`)
	})
	const actions = computed(() => {
		const confirm = { name: 'confirm', text: confirmLabel.value }
		const cancel = { name: 'cancel', text: cancelLabel.value }
		return props.showCancel ? (props.vertical ? [confirm, cancel] : [cancel, confirm]) : [confirm]
	})
	const pressClass = computed(() => pending.value ? 'none' : getThemeMode() === 'dark' ? 'ucs-dialog__native--pressed-dark' : 'ucs-dialog__native--pressed')
	/** 操作区只改变文字颜色，保持标题、正文和分隔线各自的语义。 */
	function actionColor(action) {
		if (pending.value && pendingAction.value !== action) return getThemeColor(['gray-6', 'gray-7'])
		return action === 'confirm' ? confirmColor.value : getThemeColor(['gray-12', 'gray-10'])
	}
	/** 横排分隔左右操作，纵排分隔上下操作；字号变大时允许操作行同步增高。 */
	function actionStyle(index) {
		return {
			flex: props.vertical ? 0 : 1,
			width: props.vertical ? '100%' : 'auto',
			minHeight: `${Math.max(56, getFontSize(16) * 24 / 16 + 32)}px`,
			borderColor: lineColor.value,
			borderLeftWidth: !props.vertical && index > 0 ? '0.5px' : '0px',
			borderTopWidth: props.vertical && index > 0 ? '0.5px' : '0px'
		}
	}
	let generation = 0, disposed = false, closeReason = 'close'

	/** 新一轮打开之前登记状态，让 open 事件中同步 close 也能生效。 */
	function open() {
		if (disposed || popupRef.value === null) return false
		if (opened.value) return true
		generation++
		opened.value = true
		closeReason = 'close'
		if (popupRef.value.open()) return true
		opened.value = false
		return false
	}
	/** @param {'confirm'|'cancel'|'close'} reason 本轮关闭原因。 */
	function closeWithReason(reason) {
		if (disposed || !opened.value || popupRef.value === null) return false
		closeReason = reason
		return popupRef.value.close()
	}
	/** 程序主动关闭具有优先权，不等待异步回调。 */
	function close() { return closeWithReason('close') }
	function onOpen() { emit('open') }
	/** popup 发起关闭时立即使旧任务失效，随后允许新一轮 open。 */
	function onClose() {
		const reason = closeReason
		generation++
		opened.value = false
		pendingAction.value = ''
		emit('close', reason)
	}
	/**
	 * @param {'confirm'|'cancel'} action 用户操作。
	 * @returns {Promise<boolean>} 本轮操作是否被接受并发起关闭。
	 */
	async function requestAction(action) {
		if (disposed || !opened.value || pending.value) return false
		const request = generation
		pendingAction.value = action
		try {
			const result = typeof props.beforeClose === 'function' ? await props.beforeClose(action) : undefined
			if (disposed || request !== generation || !opened.value || result === false) return false
			if (!closeWithReason(action)) return false
			emit(action)
			return true
		} catch (error) {
			if (!disposed && request === generation && opened.value) emit('error', { action, error })
			return false
		} finally {
			if (!disposed && request === generation) pendingAction.value = ''
		}
	}
	/** 遮罩取消与按钮取消共用关闭前回调和重复操作保护。 */
	function onClickMask() { if (props.closeOnClickMask) requestAction('cancel') }
	onBeforeUnmount(() => { disposed = true; generation++; pendingAction.value = '' })
	defineExpose({ open, close })
</script>

<style>
	.ucs-dialog { width: 654rpx; display: flex; flex-direction: column; box-sizing: border-box; }
	.ucs-dialog__title { padding: 24px 24px 12px; }
	.ucs-dialog__body { min-width: 0; padding: 0 24px 24px; }
	.ucs-dialog__actions { display: flex; border-top-width: 0.5px; border-top-style: solid; }
	.ucs-dialog__action { position: relative; min-width: 0; padding: 0 8px; box-sizing: border-box; display: flex; flex-direction: row; align-items: center; justify-content: center; border-width: 0; border-style: solid; }
	.ucs-dialog__action-content { display: flex; flex-direction: row; align-items: center; justify-content: center; min-width: 0; }
	.ucs-dialog__spinner { margin-right: 4px; flex-shrink: 0; }
	.ucs-dialog__native { position: absolute; top: 0; right: 0; bottom: 0; left: 0; width: 100%; height: 100%; margin: 0; padding: 0; color: transparent; background-color: transparent; border-width: 0; border-radius: 0; }
	.ucs-dialog__native--pressed { background-color: rgba(0, 0, 0, 0.06); }
	.ucs-dialog__native--pressed-dark { background-color: rgba(255, 255, 255, 0.06); }
	/* #ifdef H5 || WEB || MP */
	.ucs-dialog__native::after { border: none; }
	/* #endif */
</style>
