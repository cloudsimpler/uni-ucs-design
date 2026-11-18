export class UcsRequestError extends Error {
  constructor(message, code, config, response, cause) {
    super(message)
    this.name = 'UcsRequestError'
    this.code = code
    this.config = config
    this.response = response
    this.cause = cause
  }
}

export function isCancel(error) {
  return error != null && error.code === 'ERR_CANCELED'
}

export class InterceptorManager {
  constructor() { this.handlers = []; this.nextId = 0 }
  use(fulfilled, rejected) {
    const id = this.nextId++
    this.handlers.push({ id, fulfilled, rejected })
    return id
  }
  eject(id) { this.handlers = this.handlers.filter(item => item.id !== id) }
  clear() { this.handlers = [] }
}

export function mergeHeaders(...sources) {
  const headers = {}
  sources.forEach(source => {
    Object.keys(source || {}).forEach(key => {
      const name = key.toLowerCase()
      const value = source[key]
      if (value == null) delete headers[name]
      else headers[name] = value
    })
  })
  return headers
}

// Copy mutable configuration records/arrays without copying platform resources.
export function cloneConfig(value, seen = new WeakMap(), root = true) {
  if (value === null || typeof value !== 'object') return value
  const prototype = Object.getPrototypeOf(value)
  if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) return value
  // Some hosts expose Task/Signal as plain objects rather than class instances.
  if (typeof value.abort === 'function' || (typeof value.addEventListener === 'function' && typeof value.removeEventListener === 'function')) return value
  if (seen.has(value)) return seen.get(value)
  const result = Array.isArray(value) ? new Array(value.length) : Object.create(prototype)
  seen.set(value, result)
  Object.keys(value).forEach(key => {
    Object.defineProperty(result, key, {
      value: root && key === 'transport' ? value[key] : cloneConfig(value[key], seen, false),
      enumerable: true, configurable: true, writable: true
    })
  })
  return result
}

export function mergeConfig(...sources) {
  let merged = {}, headers = {}, nativeOptions = {}
  for (const source of sources) {
    merged = { ...merged, ...source }
    headers = mergeHeaders(headers, source.headers)
    nativeOptions = { ...nativeOptions, ...source.nativeOptions }
  }
  return cloneConfig({ ...merged, headers, nativeOptions })
}

function serialize(params) {
  const parts = []
  Object.keys(params || {}).forEach(key => {
    const value = params[key]
    if (value == null) return
    const values = Array.isArray(value) ? value : [value]
    values.forEach(item => {
      if (item == null) return
      const text = typeof item === 'object' ? JSON.stringify(item) : String(item)
      parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(text))
    })
  })
  return parts.join('&')
}

export function buildURL(config) {
  if (typeof config.url !== 'string' || !config.url.trim()) {
    throw new UcsRequestError('url must be a non-empty string', 'ERR_BAD_CONFIG', config)
  }
  let url = config.url
  if (config.baseURL && !/^([a-z][a-z\d+.-]*:)?\/\//i.test(url)) {
    url = config.baseURL.replace(/\/+$/, '') + '/' + url.replace(/^\/+/, '')
  }
  url = url.split('#')[0]
  const query = config.paramsSerializer ? config.paramsSerializer(config.params || {}) : serialize(config.params)
  if (query) url += (url.includes('?') ? (/[?&]$/.test(url) ? '' : '&') : '?') + query
  return url
}

export function canceled(config) {
  return new UcsRequestError('Request canceled', 'ERR_CANCELED', config)
}

// Race each caller against its own signal; the shared work itself is not canceled.
export function waitWithSignal(promise, signal, config) {
  if (!signal) return Promise.resolve(promise)
  if (signal.aborted) {
    // The original work may still reject; always consume its eventual result.
    Promise.resolve(promise).catch(() => {})
    return Promise.reject(canceled(config))
  }
  return new Promise((resolve, reject) => {
    const abort = () => { cleanup(); reject(canceled(config)) }
    const cleanup = () => signal.removeEventListener('abort', abort)
    signal.addEventListener('abort', abort)
    if (signal.aborted) abort()
    Promise.resolve(promise).then(value => { cleanup(); resolve(value) }, error => { cleanup(); reject(error) })
  })
}
