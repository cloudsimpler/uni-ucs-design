export function isPlainObject(value) {
  if (value === null || typeof value !== 'object') return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

export const isSafeKey = key => !['__proto__', 'prototype', 'constructor'].includes(key)

// Configuration contains only records, arrays and primitive values.
export function cloneValue(value) {
  if (Array.isArray(value)) return value.map(cloneValue)
  if (!isPlainObject(value)) return value
  const result = {}
  Object.keys(value).filter(isSafeKey).forEach(key => { result[key] = cloneValue(value[key]) })
  return result
}

export function mergeRecords(base, patch) {
  let result = base
  Object.keys(patch).filter(isSafeKey).forEach(key => {
    const value = isPlainObject(patch[key]) && isPlainObject(base[key])
      ? mergeRecords(base[key], patch[key]) : cloneValue(patch[key])
    if (!Object.prototype.hasOwnProperty.call(base, key) || !Object.is(base[key], value)) {
      if (result === base) result = { ...base }
      result[key] = value
    }
  })
  return result
}

/** Reuse an internal record when a normalized patch made no shallow changes. */
export function reuseRecord(base, next) {
  const keys = Object.keys(next)
  return keys.length === Object.keys(base).length && keys.every(key => Object.prototype.hasOwnProperty.call(base, key) && Object.is(base[key], next[key])) ? base : next
}

// Only skip objects deeply frozen by this utility, not arbitrary shallow-frozen inputs.
const frozenValues = new WeakSet()
export function freezeValue(value) {
  if (value !== null && typeof value === 'object' && !frozenValues.has(value)) {
    Object.keys(value).forEach(key => freezeValue(value[key]))
    Object.freeze(value)
    frozenValues.add(value)
  }
  return value
}
