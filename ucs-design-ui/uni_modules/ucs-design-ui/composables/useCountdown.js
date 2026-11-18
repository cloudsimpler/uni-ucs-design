import { computed, getCurrentScope, onScopeDispose, shallowRef } from 'vue'

/**
 * 无预设视觉的倒计时，使用 Date.now() 与截止时间计算，不累减定时器次数。
 * @param {object} [options] 创建时确定的配置。
 * @param {number} [options.duration=60000] 初始时长，单位 ms，有限非负数。
 * @param {number} [options.interval=1000] 状态更新间隔，单位 ms，有限正数；不代表计时精度保证。
 * @param {boolean} [options.autoStart=false] 创建后是否立即开始。
 * @param {function():void} [options.onFinish] 正在运行的一轮到期时调用一次；初始化、reset、dispose 不触发。
 * @returns {object} remaining、totalSeconds、time、running、finished 及 start/pause/reset/sync/dispose。
 * @remarks start() 开始或继续剩余时间，运行中及剩余为 0 时返回 false；重新开始先 reset()。
 * pause() 按当前时间结算并暂停；reset(duration?) 停止并恢复时长，传参同时更新后续 reset 的默认时长。
 * sync() 按当前时间立即校准，适合页面 onShow 主动调用；不注册应用或窗口监听。
 * time 为向上取整后的总秒数拆分的 days/hours/minutes/seconds，只表示时间，不生成展示文案。
 * 进入后台期间运行中的计时继续流逝，暂停中的计时不流逝；系统时钟调整会影响结果。
 * 组件作用域卸载时自动 dispose，作用域外需手动释放；dispose 保留最后结算的剩余时间，不触发完成。
 * onFinish 为同步通知，异常向调用处传播；在通知前已停止定时器，可在回调中安全 reset/start。
 */
export function useCountdown(options = {}) {
  let duration = validateDuration(options.duration ?? 60000)
  const interval = options.interval ?? 1000, autoStart = options.autoStart ?? false, onFinish = options.onFinish
  if (!Number.isFinite(interval) || interval <= 0) throw new TypeError('useCountdown: interval 必须为有限正数')
  if (typeof autoStart !== 'boolean') throw new TypeError('useCountdown: autoStart 必须为布尔值')
  if (onFinish != null && typeof onFinish !== 'function') throw new TypeError('useCountdown: onFinish 必须是函数')
  const state = shallowRef({ remaining: duration, running: false })
  const remaining = computed(() => state.value.remaining)
  const running = computed(() => state.value.running)
  const finished = computed(() => remaining.value === 0)
  const totalSeconds = computed(() => Math.ceil(remaining.value / 1000))
  const time = computed(() => {
    const seconds = totalSeconds.value
    return Object.freeze({ days: Math.floor(seconds / 86400), hours: Math.floor(seconds / 3600) % 24,
      minutes: Math.floor(seconds / 60) % 60, seconds: seconds % 60 })
  })
  let timer = null, deadline = 0, version = 0, disposed = false
  function stopTimer() { if (timer !== null) clearTimeout(timer); timer = null; version++ }
  /** 结算并安排唯一的后续唤醒；版本检查防止同步 watcher 或完成回调重入后重建旧定时器。 */
  function update(pause = false) {
    stopTimer()
    const current = version
    const value = Math.max(0, deadline - Date.now())
    state.value = { remaining: value, running: !pause && value > 0 }
    // 到期属于刚刚结算的这一轮；同步 watcher 重置/重启不能吞掉它的通知。
    // 版本号只保护后续调度，不撤销已经发生的到期事件。
    if (value === 0) { if (!disposed && onFinish) onFinish(); return }
    if (version !== current || disposed) return
    if (!pause) {
      timer = setTimeout(() => {
        if (disposed || current !== version || !running.value) return
        timer = null; update()
      }, Math.min(interval, value, 2147483647))
    }
  }
  /** 开始或继续；不会重启正在运行或已完成的倒计时。 */
  function start() {
    if (disposed || running.value || remaining.value === 0) return false
    deadline = Date.now() + remaining.value
    update(); return true
  }
  /** 暂停时仍会结算已流逝时间；若此刻已到期，正常通知完成。 */
  function pause() { if (disposed || !running.value) return false; update(true); return true }
  /** 停止并重置，显式传入时长时更新当前控制器的默认时长，不自动开始。 */
  function reset(nextDuration = duration) {
    if (disposed) return false
    duration = validateDuration(nextDuration)
    stopTimer(); state.value = { remaining: duration, running: false }; return true
  }
  /** 运行时立即校准并重新安排唤醒；暂停时不消耗剩余时间。 */
  function sync() { if (disposed || !running.value) return false; update(); return true }
  function dispose() {
    if (disposed) return
    disposed = true; stopTimer()
    state.value = { remaining: running.value ? Math.max(0, deadline - Date.now()) : remaining.value, running: false }
  }
  if (getCurrentScope()) onScopeDispose(dispose)
  if (autoStart) start()
  return { remaining, totalSeconds, time, running, finished, start, pause, reset, sync, dispose }
}

/** @param {number} value 毫秒时长。@returns {number} 已校验的时长。 */
function validateDuration(value) {
  if (!Number.isFinite(value) || value < 0) throw new TypeError('useCountdown: duration 必须为有限非负数')
  return value
}
