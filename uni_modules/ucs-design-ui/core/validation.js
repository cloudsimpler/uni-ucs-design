import { isPlainObject, isSafeKey, mergeRecords, reuseRecord } from '../utils/object.js'

const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key)

// Lightweight locale normalization; deliberately does not depend on Intl.
export function normalizeLanguage(value) {
  if (typeof value !== 'string') return ''
  const tag = value.trim().replace(/_/g, '-')
  if (!/^[a-z]{2,8}(?:-[a-z\d]{1,8})*$/i.test(tag)) return ''
  return tag.split('-').map((part, i) => {
    if (i === 0) return part.toLowerCase()
    if (/^[a-z]{4}$/i.test(part)) return part[0].toUpperCase() + part.slice(1).toLowerCase()
    if (/^[a-z]{2}$/i.test(part)) return part.toUpperCase()
    return part.toLowerCase()
  }).join('-')
}

export function languageCandidates(value) {
  const tag = normalizeLanguage(value)
  if (!tag) return []
  const candidates = [tag]
  const parts = tag.toLowerCase().split('-')
  if (parts[0] === 'zh') {
    const traditional = parts.includes('hant') || (!parts.includes('hans') && parts.some(part => ['tw', 'hk', 'mo'].includes(part)))
    candidates.push(traditional ? 'zh-Hant' : 'zh-Hans')
  }
  candidates.push(parts[0])
  return [...new Set(candidates)]
}

function resolveLanguage(value, config) {
  const candidates = languageCandidates(value)
  for (const candidate of candidates) {
    for (const packs of [config.i18nLanguagePacks, config.designLanguagePacks]) {
      const found = Object.keys(packs).find(key => key.toLowerCase() === candidate.toLowerCase())
      if (found) return found
    }
  }
  return ''
}

/** Shared by diagnostics and updates, so rejection/normalization cannot diverge. */
export function buildConfig(base, options) {
  const issues = []
  const error = (path, message) => issues.push({ path, message, severity: 'error', behavior: 'reject' })
  if (!isPlainObject(options)) {
    error('', '配置必须是普通对象')
    return { next: null, issues }
  }
  Object.keys(options).forEach(key => {
    if (!isSafeKey(key) || !own(base, key)) error(key, '未知配置字段')
  })
  const next = { ...base }
  if (own(options, 'themeMode')) {
    if (!['light', 'dark'].includes(options.themeMode)) error('themeMode', '仅支持 light 或 dark')
    else next.themeMode = options.themeMode
  }
  if (own(options, 'themeColors')) {
    if (!isPlainObject(options.themeColors)) error('themeColors', '必须是普通对象')
    else {
      next.themeColors = { ...base.themeColors }
      Object.keys(options.themeColors).forEach(key => {
        const value = options.themeColors[key]
        if (!isSafeKey(key) || !own(base.themeColors, key)) error('themeColors.' + key, '未知主题色名称')
        else if (key === 'secondary' && value === null) next.themeColors.secondary = null
        else if (typeof value !== 'string' || !/^#[a-f\d]{6}$/i.test(value.trim())) error('themeColors.' + key, '必须是六位十六进制颜色')
        else next.themeColors[key] = value.trim().toUpperCase()
      })
    }
  }
  if (own(options, 'typographyOffset')) {
    const value = options.typographyOffset
    if (!Number.isFinite(value)) error('typographyOffset', '必须是有限数字')
    else next.typographyOffset = value
  }
  if (own(options, 'request')) {
    const request = options.request
    if (!isPlainObject(request)) error('request', '必须是普通对象')
    else {
      next.request = { ...base.request }
      Object.keys(request).forEach(key => {
        const value = request[key]
        const path = 'request.' + key
        if (!isSafeKey(key) || !own(base.request, key)) error(path, '未知请求配置字段')
        else if (key === 'env') {
          if (!['auto', 'development', 'production'].includes(value)) error(path, '仅支持 auto、development 或 production')
          else next.request.env = value
        } else if (key === 'developmentBaseURL' || key === 'productionBaseURL') {
          if (typeof value !== 'string') error(path, '必须是字符串')
          else next.request[key] = value.trim()
        } else if (key === 'timeout') {
          if (!Number.isFinite(value) || value <= 0) error(path, '必须是大于零的有限数字，单位 ms')
          else next.request.timeout = value
        } else if (key === 'headers') {
          if (!isPlainObject(value)) error(path, '必须是普通对象')
          else {
            const headers = {}
            Object.keys(value).forEach(name => {
              const header = value[name]
              if (!isSafeKey(name) || !name || /\s/.test(name)) error(path + '.' + name, '请求头名称不合法')
              else if (!['string', 'number', 'boolean'].includes(typeof header) || (typeof header === 'number' && !Number.isFinite(header))) error(path + '.' + name, '请求头必须是字符串、有限数字或布尔值')
              else headers[name.toLowerCase()] = header
            })
            next.request.headers = headers
          }
        }
      })
    }
  }
  if (own(options, 'iconFontFamily')) {
    if (typeof options.iconFontFamily !== 'string') error('iconFontFamily', '必须是字符串')
    else next.iconFontFamily = options.iconFontFamily.trim()
  }
  if (own(options, 'icons')) {
    if (!isPlainObject(options.icons)) error('icons', '必须是普通对象')
    else {
      next.icons = {}
      Object.keys(options.icons).forEach(key => {
        const name = key.trim()
        const value = options.icons[key]
        if (!name || !isSafeKey(name) || typeof value !== 'string' || !value.length) error('icons.' + key, '图标名称及字形必须是非空字符串')
        else if (own(next.icons, name)) error('icons.' + key, '规范化后图标名称重复')
        else next.icons[name] = value
      })
    }
  }
  function checkMessages(value, path, parents = new Set()) {
    if (typeof value === 'string') return true
    if (!Array.isArray(value) && !isPlainObject(value)) { error(path, '文案必须是字符串、数组或普通对象'); return false }
    if (parents.has(value)) { error(path, '语言包不能包含循环引用'); return false }
    const branch = new Set(parents); branch.add(value)
    let valid = true
    Object.keys(value).forEach(key => {
      if (!isSafeKey(key)) { error(path + '.' + key, '不支持的字段名'); valid = false }
      else if (!checkMessages(value[key], path + '.' + key, branch)) valid = false
    })
    return valid
  }
  for (const field of ['designLanguagePacks', 'i18nLanguagePacks']) {
    if (!own(options, field)) continue
    const packs = options[field]
    if (!isPlainObject(packs)) { error(field, '必须是以语言代码为键的普通对象'); continue }
    next[field] = { ...base[field] }
    Object.keys(packs).forEach(key => {
      const language = normalizeLanguage(key)
      if (!language || !isSafeKey(language)) { error(field + '.' + key, '语言代码不合法'); return }
      if (!isPlainObject(packs[key])) { error(field + '.' + key, '每个语言包必须是普通对象'); return }
      if (checkMessages(packs[key], field + '.' + key)) {
        next[field][language] = mergeRecords(next[field][language] || {}, packs[key])
      }
    })
  }
  // Resolve after merging packs: registering and selecting a language is one update.
  for (const field of ['fallbackLanguage', 'language']) {
    if (!own(options, field)) continue
    const resolved = resolveLanguage(options[field], next)
    if (!resolved) error(field, '语言无效或未注册对应语言包')
    else next[field] = resolved
  }
  if (Object.keys(next.icons).length && !next.iconFontFamily) {
    issues.push({ path: 'iconFontFamily', message: '已配置图标映射，但未配置字体族；自定义图标映射不会生效', severity: 'warning', behavior: 'allow' })
  }
  if (issues.some(issue => issue.severity === 'error')) return { next: null, issues }
  if (next.request !== base.request) next.request.headers = reuseRecord(base.request.headers, next.request.headers)
  for (const field of ['themeColors', 'request', 'icons', 'designLanguagePacks', 'i18nLanguagePacks']) {
    if (next[field] !== base[field]) next[field] = reuseRecord(base[field], next[field])
  }
  return { next: reuseRecord(base, next), issues }
}
