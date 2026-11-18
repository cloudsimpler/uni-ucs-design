<template>
	<view class="ucs-form"><slot :submitting="form.submitting.value" :validate="form.validate" :submit="submit" :reset-fields="form.resetFields" /></view>
</template>

<script setup>
	import { onBeforeUnmount, provide } from 'vue'
	import { createForm, formKey } from '../../composables/form.js'

	/**
	 * ucs-form 无预设外观的表单容器。
	 * @description 仅校验已挂载的 ucs-form-field；输入组件通过页面 v-model 绑定 model。
	 * @property {object} model 可写表单数据，支持点分路径；重置恢复字段首次注册时的值。
	 * @property {object} rules async-validator 规则表，以完整字段路径为键。
	 * @slot default 提供 submitting、validate、submit、resetFields；不绘制标题、按钮或错误提示。
	 * @event {object} submit 校验通过时传递数据快照；异步业务请使用 submit(handler) 以维持提交锁。
	 * @event {object} invalid 校验未通过或取消时传递 { valid, cancelled, errors }。
	 * @method validate 校验全部已注册字段，返回 Promise<{ valid, cancelled, errors }>。
	 * @method validateField 接收字段路径或路径数组，返回同 validate。
	 * @method resetFields 重置已注册字段并清除校验状态。
	 * @method clearValidate 清除错误及 touched，中止旧校验结果写入。
	 * @method submit 校验后执行可选异步 handler；重复调用返回同一 Promise；业务异常向调用方抛出。
	 * 校验与 handler 使用同一份数据快照；校验完成后、handler 执行前再次检查数据版本，过期时取消提交。
	 */
	const props = defineProps({ model: { type: Object, required: true }, rules: { type: Object, default: () => ({}) } })
	const emit = defineEmits(['submit', 'invalid'])
	const form = createForm(() => props.model, () => props.rules)
	provide(formKey, form)
	let pending = null
	function submit(handler) {
		if (pending) return pending
		pending = form.submit(async model => { emit('submit', model); if (typeof handler === 'function') await handler(model) }).then(result => {
			if (!result.valid) emit('invalid', result)
			return result
		}).finally(() => { pending = null })
		return pending
	}
	onBeforeUnmount(form.dispose)
	defineExpose({ validate: form.validate, validateField: form.validateField, resetFields: form.resetFields, clearValidate: form.clearValidate, submit })
</script>

<style>
	.ucs-form { display: flex; flex-direction: column; }
</style>
