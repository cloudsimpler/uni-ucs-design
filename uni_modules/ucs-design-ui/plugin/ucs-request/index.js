import { InterceptorManager, cloneConfig, mergeConfig, waitWithSignal, canceled, UcsRequestError } from './core.js'
import { dispatch } from './transport.js'
export { UcsRequestError, isCancel } from './core.js'

export class UcsRequest {
  constructor(defaults = {}) {
    this.defaults = cloneConfig({ responseType: 'json', ...defaults })
    this.interceptors = { request: new InterceptorManager(), response: new InterceptorManager() }
  }
  // Internal extension point for the application instance's dynamic defaults.
  _resolveConfig(config) { return mergeConfig(this.defaults, config) }
  request(urlOrConfig, options = {}) {
    const supplied = typeof urlOrConfig === 'string' ? { ...options, url: urlOrConfig } : (urlOrConfig || {})
    let config
    let chain
    try {
      // Capture synchronously: later application updates must not change this request.
      config = this._resolveConfig(supplied)
    } catch (cause) {
      chain = Promise.reject(cause instanceof UcsRequestError ? cause : new UcsRequestError(cause.message, 'ERR_BAD_CONFIG', supplied, undefined, cause))
    }
    if (!chain) {
      chain = Promise.resolve(config).then(value => {
        if (config.signal && config.signal.aborted) throw canceled(config)
        return value
      })
      // Request interceptors: last registered first. Response: first registered first.
      this.interceptors.request.handlers.slice().reverse().forEach(item => {
        chain = chain.then(item.fulfilled, item.rejected)
      })
      chain = waitWithSignal(chain, config.signal, config).then(finalConfig => {
        if (config.signal && config.signal.aborted) throw canceled(config)
        return dispatch(config.signal ? { ...finalConfig, signal: config.signal } : finalConfig)
      })
    }
    this.interceptors.response.handlers.slice().forEach(item => {
      chain = chain.then(item.fulfilled, item.rejected)
    })
    return chain
  }
  get(url, config = {}) { return this.request({ ...config, url, method: 'GET', kind: 'request' }) }
  delete(url, config = {}) { return this.request({ ...config, url, method: 'DELETE', kind: 'request' }) }
  head(url, config = {}) { return this.request({ ...config, url, method: 'HEAD', kind: 'request' }) }
  options(url, config = {}) { return this.request({ ...config, url, method: 'OPTIONS', kind: 'request' }) }
  post(url, data, config = {}) { return this.request({ ...config, url, data, method: 'POST', kind: 'request' }) }
  put(url, data, config = {}) { return this.request({ ...config, url, data, method: 'PUT', kind: 'request' }) }
  patch(url, data, config = {}) { return this.request({ ...config, url, data, method: 'PATCH', kind: 'request' }) }
  upload(url, config = {}) { return this.request({ ...config, url, kind: 'upload' }) }
  download(url, config = {}) { return this.request({ ...config, url, kind: 'download' }) }
  create(config = {}) { return new UcsRequest(mergeConfig(this.defaults, config)) }
}

export function createInstance(config = {}) { return new UcsRequest(config) }
export const create = createInstance
export default createInstance()
