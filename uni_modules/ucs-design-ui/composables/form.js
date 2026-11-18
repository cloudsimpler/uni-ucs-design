import { ref } from 'vue'
import Schema from '../plugin/async-validator/index.js'

export const formKey = Symbol('ucs-form')

function pathKeys(name) {
  const keys = name.split('.')
  if (!name || keys.some(key => !key || ['__proto__', 'prototype', 'constructor'].includes(key))) {
    throw new TypeError('ucs-form-field: name 必须是安全的点分字段路径')
  }
  return keys
}

function read(model, keys) { return keys.reduce((value, key) => value?.[key], model) }
function copy(value) {
  if (value instanceof Date) return new Date(value.getTime())
  if (Array.isArray(value)) return value.map(copy)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, copy(item)]))
  return value
}

/** 自定义校验可读取或修改 source；嵌套规则同样保留独立的完整数据源。 */
function needsSource(rule) {
  if (typeof rule.validator === 'function' || typeof rule.asyncValidator === 'function') return true
  const nested = [...Object.values(rule.fields ?? {}), ...(rule.defaultField ? [rule.defaultField] : [])]
  return nested.some(value => (Array.isArray(value) ? value : [value]).some(needsSource))
}

/**
 * 创建无视觉约束的表单控制器，由 ucs-form 持有。
 * @param {Function} getModel 返回可写的表单对象。
 * @param {Function} getRules 返回以字段路径为键的规则表。
 * @returns {object} 字段注册、校验、重置和提交控制器。
 */
export function createForm(getModel, getRules) {
  const fields = new Map()
  const submitting = ref(false)
  let disposed = false, pending = null, epoch = 0

  /** 注册一个字段，同一表单不允许重复路径。 */
  function register(name, ownRules) {
    epoch++
    const keys = pathKeys(name)
    if (fields.has(name)) throw new Error(`ucs-form: 重复字段 ${name}`)
    const initial = copy(read(getModel(), keys))
    const error = ref(''), validating = ref(false), touched = ref(false)
    let revision = 0, removed = false
    function invalidate() { revision++; epoch++; validating.value = false; error.value = '' }
    function rules() { return ownRules() ?? getRules()?.[name] ?? [] }
    async function validate(trigger = '', source = getModel()) {
      const request = ++revision
      touched.value = true
      validating.value = true
      error.value = ''
      const all = rules()
      const selected = (Array.isArray(all) ? all : [all]).filter(rule => !trigger || !rule.trigger || (Array.isArray(rule.trigger) ? rule.trigger.includes(trigger) : rule.trigger === trigger))
      let errors = []
      try {
        if (selected.length) {
          // 内置规则仅需当前值；完整 source 仅为需要跨字段数据的自定义校验复制。
          const data = selected.some(needsSource) ? copy(source) : {}
          data[name] = copy(read(source, keys))
          await new Schema({ [name]: selected }).validate(data, { firstFields: true })
        }
      } catch (failure) {
        errors = failure?.errors ?? [{ message: failure?.message ?? 'Validation failed', field: name }]
      }
      if (disposed || removed || request !== revision) return { valid: false, cancelled: true, errors: [] }
      validating.value = false
      error.value = errors.length ? String(errors[0].message) : ''
      return { valid: errors.length === 0, cancelled: false, errors }
    }
    function reset() {
      invalidate(); touched.value = false
      let target = getModel()
      for (const key of keys.slice(0, -1)) {
        if (target[key] == null) target[key] = {}
        target = target[key]
      }
      target[keys[keys.length - 1]] = copy(initial)
    }
    const field = { name, error, validating, touched, rules, value: () => read(getModel(), keys), validate, invalidate, reset,
      clearValidate() { invalidate(); touched.value = false },
      unregister() { removed = true; invalidate(); fields.delete(name) }
    }
    fields.set(name, field)
    return field
  }

  /** 校验当前已注册字段；异步期间发生编辑或卸载时返回 cancelled。 */
  async function validate(names, snapshot = copy(getModel())) {
    const requested = names == null ? [...fields.keys()] : Array.isArray(names) ? names : [names]
    for (const name of requested) if (!fields.has(name)) throw new Error(`ucs-form: 未注册字段 ${name}`)
    const requestEpoch = epoch
    const results = await Promise.all(requested.map(name => fields.get(name).validate('', snapshot)))
    const cancelled = disposed || requestEpoch !== epoch || results.some(result => result.cancelled)
    return { valid: !cancelled && results.every(result => result.valid), cancelled, errors: results.flatMap(result => result.errors) }
  }
  function resetFields() { fields.forEach(field => field.reset()) }
  function clearValidate() { fields.forEach(field => field.clearValidate()) }
  /** 校验通过后调用并等待 handler，提交期间复用同一个 Promise，避免重复请求。 */
  function submit(handler) {
    if (pending) return pending
    submitting.value = true
    pending = Promise.resolve().then(async () => {
      const snapshot = copy(getModel())
      const requestEpoch = epoch
      const result = await validate(undefined, snapshot)
      if (disposed || requestEpoch !== epoch) return { ...result, valid: false, cancelled: true }
      if (result.valid && handler) await handler(snapshot)
      return result
    }).finally(() => { pending = null; submitting.value = false })
    return pending
  }
  function dispose() { disposed = true; fields.forEach(field => field.invalidate()); fields.clear() }
  return { register, validate, validateField: validate, resetFields, clearValidate, submit, submitting, dispose }
}
