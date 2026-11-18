import { computed, getCurrentScope, onScopeDispose, shallowRef } from 'vue'

/**
 * 无预设视觉的上传队列，通过业务 upload 函数接入 ucs-request 或其他传输实现。
 * @param {object} options 创建时确定的配置。
 * @param {function({file:object,signal:object,onProgress:function}):Promise<unknown>} options.upload 上传函数；业务失败须抛错。
 * @param {number} [options.concurrency=2] 最大并发任务数，正整数。
 * @param {boolean} [options.autoUpload=false] 添加后是否立即排队上传。
 * @returns {object} tasks、uploadingCount、pendingCount、loading 和 add/start/retry/cancel/cancelAll/remove/clear/dispose。
 * @remarks add 接受文件数组，文件须有非空 path；浅复制文件描述，不修改原对象，不选择或压缩文件。
 * start(id?) 上传指定任务或全部 ready 任务，返回 Promise<结果数组>，重复调用复用每项任务。
 * retry(id) 只重试 error/cancelled；请求异常记录在任务并返回结果，不向事件处理器抛出。
 * signal 兼容 ucs-request CancelSignal，不依赖全局 AbortController；业务须传递 signal 才能中止真实网络。
 * cancel 立即完成该次结果并释放队列位置；忽略旧进度和响应，不等待不合作的传输函数。
 * 组件作用域销毁时自动 dispose；作用域外需主动释放。无自动重试、定时器、全局监听或提示。
 */
export function useUpload(options) {
  if (typeof options?.upload !== 'function') throw new TypeError('useUpload: upload 必须是函数')
  const { upload, concurrency = 2, autoUpload = false } = options
  if (!Number.isInteger(concurrency) || concurrency < 1) throw new TypeError('useUpload: concurrency 必须为正整数')
  if (typeof autoUpload !== 'boolean') throw new TypeError('useUpload: autoUpload 必须为布尔值')
  const state = shallowRef(Object.freeze([])), records = new Map()
  let sequence = 0, active = 0, disposed = false, scheduled = false, batchDepth = 0, dirty = false
  const tasks = computed(() => state.value)
  const uploadingCount = computed(() => tasks.value.filter(task => task.status === 'uploading').length)
  const pendingCount = computed(() => tasks.value.filter(task => task.status === 'ready').length)
  const loading = computed(() => uploadingCount.value > 0)
  /** 只冻结变化的记录，其他项保持引用；批量操作结束时只发布一次数组。 */
  function publish() {
    if (batchDepth > 0) { dirty = true; return }
    dirty = false
    state.value = Object.freeze([...records.values()].map(record => {
      if (record.snapshotSource !== record.view) {
        record.snapshotSource = record.view
        record.snapshot = Object.freeze({ ...record.view })
      }
      return record.snapshot
    }))
  }
  function batch(operation) {
    batchDepth++
    try { return operation() }
    finally { batchDepth--; if (batchDepth === 0 && dirty) publish() }
  }
  function schedule() {
    if (scheduled || disposed) return
    scheduled = true
    Promise.resolve().then(() => {
      scheduled = false
      if (disposed) return
      for (const record of records.values()) {
        if (active >= concurrency) break
        if (record.attempt && !record.attempt.running) run(record, record.attempt)
      }
    })
  }
  function finish(record, attempt, status, value) {
    if (record.attempt !== attempt) return
    record.attempt = null
    if (attempt.running) active--
    record.view = { ...record.view, status, result: status === 'success' ? value : undefined,
      error: status === 'error' ? value : null }
    if (status !== 'cancelled') attempt.listeners.clear()
    publish()
    attempt.resolve(Object.freeze({ id: record.view.id, success: status === 'success', cancelled: status === 'cancelled',
      ...(status === 'success' ? { result: value } : status === 'error' ? { error: value } : {}) }))
    schedule()
  }
  function run(record, attempt) {
    attempt.running = true; active++
    record.view = { ...record.view, status: 'uploading' }; publish()
    Promise.resolve().then(() => {
      if (record.attempt !== attempt) return
      return upload({ file: record.view.file, signal: attempt.signal, onProgress(event) {
        if (record.attempt !== attempt || attempt.signal.aborted) return
        const loaded = Number.isFinite(event?.loaded) && event.loaded >= 0 ? event.loaded : undefined
        const total = Number.isFinite(event?.total) && event.total > 0 ? event.total : undefined
        const progress = Number.isFinite(event?.progress) ? Math.max(0, Math.min(1, event.progress))
          : loaded !== undefined && total !== undefined ? Math.min(1, loaded / total) : undefined
        record.view = { ...record.view, loaded, total, progress }; publish()
      } })
    }).then(result => finish(record, attempt, 'success', result), error => finish(record, attempt, 'error', error ?? new Error('Upload failed')))
  }
  function enqueue(record) {
    if (record.attempt) return record.attempt.promise
    const listeners = new Set()
    let aborted = false, resolve
    const signal = Object.freeze({ get aborted() { return aborted },
      addEventListener(type, listener) { if (type === 'abort') listeners.add(listener) },
      removeEventListener(type, listener) { if (type === 'abort') listeners.delete(listener) } })
    const attempt = { signal, listeners, running: false, promise: new Promise(done => { resolve = done }), resolve,
      abort() { aborted = true; for (const listener of [...listeners]) { try { listener() } catch (_) { /* 取消仍须完成其余监听。 */ } } listeners.clear() } }
    record.attempt = attempt; schedule()
    return attempt.promise
  }
  /** 原子校验整个批次；返回稳定且不复用的任务 id，不按文件路径去重。 */
  function add(files) {
    if (disposed) return []
    if (!Array.isArray(files)) throw new TypeError('useUpload: files 必须为数组')
    const snapshots = files.map(file => {
      if (!file || typeof file.path !== 'string' || !file.path.trim()) throw new TypeError('useUpload: 文件须包含非空 path')
      return Object.freeze({ ...file })
    })
    const ids = snapshots.map(file => {
      const id = ++sequence
      const record = { view: { id, file, status: 'ready', progress: undefined, loaded: undefined, total: undefined, result: undefined, error: null }, attempt: null }
      records.set(id, record)
      if (autoUpload) enqueue(record)
      return id
    })
    publish(); return ids
  }
  /** 不自动重传成功、失败或取消的任务；无目标时返回空结果数组。 */
  function start(id) {
    if (disposed) return Promise.resolve([])
    const targets = id === undefined ? [...records.values()] : [records.get(id)].filter(Boolean)
    return Promise.all(targets.filter(record => record.attempt || record.view.status === 'ready').map(enqueue))
  }
  function retry(id) {
    const record = records.get(id)
    if (disposed || !record || !['error', 'cancelled'].includes(record.view.status)) return Promise.resolve([])
    record.view = { ...record.view, status: 'ready', progress: undefined, loaded: undefined, total: undefined, error: null, result: undefined }
    publish(); return start(id)
  }
  /** 也可取消尚未 start 的 ready 任务；返回状态是否发生变化。 */
  function cancel(id) {
    return cancelRecord(records.get(id))
  }
  /** 也可取消已从目录摘除的记录；先摘除再执行用户取消监听，防止重新排队后丢失 Promise。 */
  function cancelRecord(record) {
    if (!record || !['ready', 'uploading'].includes(record.view.status)) return false
    if (record.attempt) {
      const attempt = record.attempt
      // 先失效旧请求，防止 abort 回调同步报告进度或触发业务重入。
      finish(record, attempt, 'cancelled')
      attempt.abort()
    } else { record.view = { ...record.view, status: 'cancelled' }; publish() }
    return true
  }
  function cancelAll() { batch(() => { for (const id of [...records.keys()]) cancel(id) }) }
  function remove(id) {
    const record = records.get(id)
    if (!record) return false
    return batch(() => { records.delete(id); cancelRecord(record); publish(); return true })
  }
  function clear() {
    batch(() => {
      const removed = [...records.values()]
      records.clear()
      for (const record of removed) cancelRecord(record)
      publish()
    })
  }
  function dispose() { if (disposed) return; disposed = true; clear() }
  if (getCurrentScope()) onScopeDispose(dispose)
  return { tasks, uploadingCount, pendingCount, loading, add, start, retry, cancel, cancelAll, remove, clear, dispose }
}
