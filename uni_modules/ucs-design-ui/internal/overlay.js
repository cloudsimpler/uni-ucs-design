import { computed, getCurrentScope, onScopeDispose, shallowRef } from 'vue'

/** 创建一个全局计数器与活动栈。关闭只删除活动记录，不回收已经分配的数字。 */
export function createOverlayManager() {
  const entries = shallowRef([])
  let next = 999
  let disposed = false
  const topId = computed(() => {
    const interactive = entries.value.filter(entry => entry.kind !== 'toast')
    return interactive.length ? interactive.reduce((top, item) => item.allocation.value.maskZIndex > top.allocation.value.maskZIndex ? item : top).id : null
  })
  function remove(id) {
    if (entries.value.some(entry => entry.id === id)) entries.value = entries.value.filter(entry => entry.id !== id)
  }
  function create(kind = 'popup') {
    if (!['popup', 'toast', 'loading'].includes(kind)) throw new TypeError('overlay: kind 必须为 popup、toast 或 loading')
    const id = Symbol(kind)
    const allocation = shallowRef({ maskZIndex: 999, panelZIndex: 1000, toastZIndex: 999 })
    let destroyed = false
    function promoteToasts(list, ceiling) {
      for (const toast of list.filter(entry => entry.kind === 'toast')) {
        if (toast.allocation.value.toastZIndex <= ceiling) toast.allocation.value = { toastZIndex: next++ }
      }
    }
    const layer = {
      maskZIndex: computed(() => allocation.value.maskZIndex),
      panelZIndex: computed(() => allocation.value.panelZIndex),
      toastZIndex: computed(() => allocation.value.toastZIndex),
      isTop: computed(() => topId.value === id),
      activate() {
        if (disposed || destroyed) return false
        const remaining = entries.value.filter(entry => entry.id !== id)
        const record = { id, kind, allocation }
        if (kind !== 'toast') {
          allocation.value = { maskZIndex: next++, panelZIndex: next++ }
          let ceiling = allocation.value.panelZIndex
          // loading 持续阻断，包括显示后由代码新打开的 popup；多实例保持原有前后关系。
          if (kind === 'popup') {
            const blockers = remaining.filter(entry => entry.kind === 'loading').sort((a, b) => a.allocation.value.maskZIndex - b.allocation.value.maskZIndex)
            for (const blocker of blockers) {
              blocker.allocation.value = { maskZIndex: next++, panelZIndex: next++ }
              ceiling = blocker.allocation.value.panelZIndex
            }
          }
          const toasts = remaining.filter(entry => entry.kind === 'toast')
          promoteToasts(toasts, ceiling)
          entries.value = [...remaining, record]
        } else {
          allocation.value = { toastZIndex: next++ }
          entries.value = [...remaining, record]
        }
        return true
      },
      release() { remove(id) },
      dispose() { destroyed = true; remove(id) }
    }
    return layer
  }
  return { create, dispose() { disposed = true; entries.value = [] } }
}

// App 本轮 JS 运行期间共享；页面创建、关闭均不重置计数。
export const overlayManager = createOverlayManager()

/** 自动接入全局栈，仅随组件作用域卸载清理，不处理页面隐藏或显示。 */
export function useOverlay(kind = 'popup') {
  const layer = overlayManager.create(kind)
  if (getCurrentScope()) onScopeDispose(layer.dispose)
  return layer
}
