<template>
	<view class="ucs-form-field"><slot :error="field.error.value" :validating="field.validating.value" :touched="field.touched.value" :validate="field.validate" :on-blur="onBlur" :on-change="onChange" :clear-validate="field.clearValidate" /></view>
</template>

<script setup>
	import { inject, onBeforeUnmount, watch } from 'vue'
	import { formKey } from '../../composables/form.js'

	/**
	 * ucs-form-field 无预设外观的字段容器，须位于 ucs-form 内。
	 * @property {string} name 字段点分路径，例如 profile.email；挂载期间不可修改，动态字段请同步设置 :key="name"。
	 * @property {object|object[]} rules 字段规则；省略时使用 form.rules[name]，空数组显式禁用规则。
	 * @slot default 提供 error、validating、touched、validate、onBlur、onChange、clearValidate。
	 * 原生输入事件由页面显式绑定 onBlur/onChange；组件不修改输入值，不绘制标签和错误文字。
	 * 规则 trigger 支持 blur/change 及数组；主动 validate() 和表单提交执行全部规则。
	 * 值或规则变化会取消旧校验结果并清除错误；卸载时取消注册，不删除 model 数据。
	 * @method validate 手动校验字段，返回 Promise<{ valid, cancelled, errors }>。
	 * @method clearValidate 清除字段错误及 touched。
	 */
	const props = defineProps({ name: { type: String, required: true }, rules: { type: [Object, Array], default: undefined } })
	const form = inject(formKey, null)
	if (!form) throw new Error('ucs-form-field 必须放在 ucs-form 内')
	const field = form.register(props.name, () => props.rules)
	watch(() => [field.value(), field.rules()], field.invalidate, { deep: true, flush: 'sync' })
	function onBlur() { return field.validate('blur') }
	function onChange() { return field.validate('change') }
	onBeforeUnmount(field.unregister)
	defineExpose({ validate: field.validate, clearValidate: field.clearValidate })
</script>

<style>
	.ucs-form-field { display: flex; flex-direction: column; }
</style>
