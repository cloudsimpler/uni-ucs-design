/** 与时区无关的本地日历字段运算，不使用日期字符串解析。 */
export function daysInMonth(year, month) {
  return month === 2 ? (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28) : [4, 6, 9, 11].includes(month) ? 30 : 31
}
const compare = (a, b) => {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i]
  return 0
}
export function parseValue(value, mode) {
  if (typeof value !== 'string') return null
  const pattern = mode === 'time' ? /^(\d{2}):(\d{2})$/ : mode === 'date' ? /^(\d{4})-(\d{2})-(\d{2})$/ : /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/
  const match = pattern.exec(value)
  if (!match) return null
  const parts = match.slice(1).map(Number)
  if (mode !== 'time' && (parts[0] < 1000 || parts[1] < 1 || parts[1] > 12 || parts[2] < 1 || parts[2] > daysInMonth(parts[0], parts[1]))) return null
  const time = mode === 'time' ? parts : parts.slice(3)
  if (time.length && (time[0] > 23 || time[1] > 59)) return null
  return parts
}
export function formatValue(parts, mode) {
  const pad = value => String(value).padStart(2, '0')
  if (mode === 'time') return `${pad(parts[0])}:${pad(parts[1])}`
  const date = `${parts[0]}-${pad(parts[1])}-${pad(parts[2])}`
  return mode === 'date' ? date : `${date} ${pad(parts[3])}:${pad(parts[4])}`
}
/** 校验边界，默认日期范围 1900～2100 年；空值/非法当前值从本地当前时间开始。 */
export function createSession(mode, min, max, value, now = new Date()) {
  if (!['date', 'time', 'datetime'].includes(mode)) throw new TypeError('日期模式必须是 date、time 或 datetime')
  const lower = min || (mode === 'time' ? '00:00' : mode === 'date' ? '1900-01-01' : '1900-01-01 00:00')
  const upper = max || (mode === 'time' ? '23:59' : mode === 'date' ? '2100-12-31' : '2100-12-31 23:59')
  const start = parseValue(lower, mode), end = parseValue(upper, mode)
  if (!start || !end || compare(start, end) > 0) throw new TypeError('日期边界格式无效或 min 大于 max')
  const today = [now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes()]
  const fallback = mode === 'time' ? today.slice(3) : mode === 'date' ? today.slice(0, 3) : today
  const session = { mode, min: start, max: end }
  return { session, value: clampValue(parseValue(value, mode) ?? fallback, session) }
}
export function clampValue(value, session) {
  const next = [...value]
  if (session.mode !== 'time') next[2] = Math.min(next[2], daysInMonth(next[0], next[1]))
  return compare(next, session.min) < 0 ? [...session.min] : compare(next, session.max) > 0 ? [...session.max] : next
}
/** 每列仅生成在当前上级字段下有效的值，包含 min/max 的分钟边界。 */
export function getColumns(value, session) {
  const ranges = session.mode === 'time' ? [[0, 23], [0, 59]] : [[1000, 9999], [1, 12], [1, daysInMonth(value[0], value[1])], ...(session.mode === 'datetime' ? [[0, 23], [0, 59]] : [])]
  return ranges.map(([low, high], index) => {
    const prefix = value.slice(0, index)
    if (compare(prefix, session.min.slice(0, index)) === 0) low = Math.max(low, session.min[index])
    if (compare(prefix, session.max.slice(0, index)) === 0) high = Math.min(high, session.max[index])
    return Array.from({ length: high - low + 1 }, (_, i) => low + i)
  })
}
