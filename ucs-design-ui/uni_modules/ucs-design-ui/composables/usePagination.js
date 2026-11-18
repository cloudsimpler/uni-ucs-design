import { computed, getCurrentScope, onScopeDispose, readonly, shallowRef } from 'vue'
import { cloneValue } from '../utils/object.js'

/**
 * 与视觉、接口协议无关的分页控制器，不自动请求或显示提示。
 * @param {object} options 分页配置。
 * @param {function({page:number,pageSize:number,params:object}):Promise<unknown>} options.fetch 业务请求函数。
 * @param {function(unknown,object):{items:Array,hasMore:boolean}} [options.transform] 将响应转换为标准结果，默认直接使用响应。
 * @param {number} [options.pageSize=20] 每页条数，正整数。
 * @param {number} [options.initialPage=1] 第一页页码，非负整数。
 * @returns {object} 只读状态及 refresh(params?)、loadNext()、retry()、reset()、dispose()。
 * 请求失败 resolve {success:false,error}，过期请求 resolve {success:false,cancelled:true}，不抛请求异常。
 * refresh 始终开启新一轮，失败保留旧列表；loadNext 重复调用复用当前 Promise，错误后重试失败页。
 * params 为普通数据对象并在 refresh 时复制；不支持循环引用，不负责取消底层网络请求。
 */
export function usePagination(options) {
  if (typeof options?.fetch !== 'function') throw new TypeError('usePagination: fetch 必须是函数')
  const pageSize = options.pageSize ?? 20, initialPage = options.initialPage ?? 1
  if (!Number.isInteger(pageSize) || pageSize <= 0 || !Number.isInteger(initialPage) || initialPage < 0) {
    throw new TypeError('usePagination: pageSize 必须为正整数，initialPage 必须为非负整数')
  }
  if (options.transform != null && typeof options.transform !== 'function') throw new TypeError('usePagination: transform 必须是函数')
  const items = shallowRef([]), page = shallowRef(initialPage - 1), hasMore = shallowRef(true)
  const loading = shallowRef(false), refreshing = shallowRef(false), error = shallowRef(null)
  const status = computed(() => loading.value ? 'loading' : error.value !== null ? 'error' : hasMore.value ? 'ready' : 'finished')
  let params = {}, latestParams = {}, failed = null, pending = null, version = 0, disposed = false

  /** 请求结果仅可提交给发起时的版本；刷新、重置和卸载使旧响应失效。 */
  function run(kind, requestParams) {
    const request = ++version, targetPage = kind === 'refresh' ? initialPage : page.value + 1
    const snapshot = cloneValue(requestParams)
    loading.value = true; refreshing.value = kind === 'refresh'; error.value = null; failed = null
    const task = Promise.resolve().then(async () => {
      try {
        if (disposed || request !== version) return { success: false, cancelled: true }
        const context = { page: targetPage, pageSize, params: cloneValue(snapshot) }
        const response = await options.fetch(context)
        if (disposed || request !== version) return { success: false, cancelled: true }
        const result = options.transform ? options.transform(response, context) : response
        if (disposed || request !== version) return { success: false, cancelled: true }
        if (!Array.isArray(result?.items) || typeof result.hasMore !== 'boolean') throw new TypeError('usePagination: 结果必须包含 items 数组及 hasMore 布尔值')
        items.value = kind === 'refresh' ? [...result.items] : [...items.value, ...result.items]
        page.value = targetPage; hasMore.value = result.hasMore; params = snapshot
        return { success: true, cancelled: false }
      } catch (failure) {
        if (disposed || request !== version) return { success: false, cancelled: true }
        const cause = failure ?? new Error('Pagination request failed')
        error.value = cause
        failed = { kind, params: snapshot }
        return { success: false, cancelled: false, error: cause }
      } finally {
        if (request === version) { pending = null; loading.value = false; refreshing.value = false }
      }
    })
    pending = task
    return task
  }
  /** 新参数在调用时复制；不传参数则沿用最近一次刷新使用的参数。 */
  function refresh(nextParams) {
    if (disposed) return Promise.resolve({ success: false, cancelled: true })
    const value = nextParams === undefined ? latestParams : nextParams
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('usePagination: params 必须为对象')
    latestParams = cloneValue(value)
    return run('refresh', latestParams)
  }
  /** 加载下一页；请求中复用 Promise，失败时重试原操作，没有更多时跳过。 */
  function loadNext() {
    if (disposed) return Promise.resolve({ success: false, cancelled: true })
    if (pending) return pending
    if (failed) return retry()
    if (!hasMore.value) return Promise.resolve({ success: false, skipped: true })
    return run('append', params)
  }
  /** 重试失败的刷新或追加；没有错误时等同 loadNext。 */
  function retry() {
    if (disposed) return Promise.resolve({ success: false, cancelled: true })
    if (pending) return pending
    return failed ? run(failed.kind, failed.params) : loadNext()
  }
  /** 清空数据和参数，使全部旧响应失效，不发请求。 */
  function reset() {
    version++; pending = null; failed = null; params = {}; latestParams = {}
    items.value = []; page.value = initialPage - 1; hasMore.value = true
    loading.value = false; refreshing.value = false; error.value = null
  }
  /** 释放控制器；实际网络取消由业务请求函数负责。 */
  function dispose() { if (disposed) return; disposed = true; reset() }
  if (getCurrentScope()) onScopeDispose(dispose)
  return { items: readonly(items), page: readonly(page), hasMore: readonly(hasMore), loading: readonly(loading),
    refreshing: readonly(refreshing), error: readonly(error), status, refresh, loadNext, retry, reset, dispose }
}
