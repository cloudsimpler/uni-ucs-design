import { computed, shallowRef, unref } from 'vue'

/**
 * 与视觉无关的选择状态管理，不修改选项对象、不绑定输入或点击事件。
 * @param {object} options 配置；multiple、getKey、isDisabled 在创建时确定。
 * @param {Array|import('vue').Ref<Array>|function():Array} options.items 当前选项，支持响应式数组、ref 或 getter。
 * @param {boolean} [options.multiple=false] 是否多选；单选也使用 selectedKeys 数组，最多一项。
 * @param {function(*):(string|number)} [options.getKey] 获取稳定键；默认把选项自身作为键，对象选项必须提供。
 * @param {function(*):boolean} [options.isDisabled] 是否禁用；禁用项不参与用户操作及全选统计。
 * @param {Array<string|number>} [options.defaultSelectedKeys=[]] 初始键，复制、去重；单选保留第一项。
 * @returns {object} selectedKeys、selectedItems、selectedCount、allSelected、indeterminate、selectableCount
 * 及 isSelected、isDisabled、select、deselect、toggle、selectAll、clear、setSelectedKeys。
 * 键限字符串及有限数字，当前选项不可重复键；错误配置抛 TypeError。
 * 列表筛选或翻页不删除已选键；selectedItems 仅返回当前列表中已选对象，按列表顺序排列。
 * 禁用后已有选中值仍保留。clear/setSelectedKeys 为程序操作，可清除禁用项或设置不在当前列表中的键。
 * selectAll 仅多选有效，合并当前可选项，保留其他已选键；没有可选项时全选及半选均为 false。
 * 状态无需 watcher、定时器、事件监听或手动释放。
 */
export function useSelection(options) {
  if (!options || options.items == null) throw new TypeError('useSelection: 必须提供 items')
  const multiple = options.multiple ?? false
  if (typeof multiple !== 'boolean') throw new TypeError('useSelection: multiple 必须为布尔值')
  for (const name of ['getKey', 'isDisabled']) {
    if (options[name] != null && typeof options[name] !== 'function') throw new TypeError(`useSelection: ${name} 必须为函数`)
  }
  const getKey = options.getKey ?? (item => item)
  const disabled = options.isDisabled ?? (() => false)
  function checkKey(key) {
    if (typeof key !== 'string' && !(typeof key === 'number' && Number.isFinite(key))) {
      throw new TypeError('useSelection: 键必须为字符串或有限数字')
    }
    return key
  }
  function normalize(keys) {
    if (!Array.isArray(keys)) throw new TypeError('useSelection: selectedKeys 必须为数组')
    const result = [...new Set(keys.map(checkKey))]
    return multiple ? result : result.slice(0, 1)
  }
  const keys = shallowRef(normalize(options.defaultSelectedKeys ?? []))
  const catalog = computed(() => {
    const items = typeof options.items === 'function' ? options.items() : unref(options.items)
    if (!Array.isArray(items)) throw new TypeError('useSelection: items 必须为数组')
    const map = new Map()
    for (const item of items) {
      const key = checkKey(getKey(item))
      if (map.has(key)) throw new TypeError('useSelection: 当前列表存在重复键')
      map.set(key, { item, disabled: Boolean(disabled(item)) })
    }
    return map
  })
  // 尽早暴露初始配置错误；后续响应式选项仍由 computed 更新。
  catalog.value
  const selectedSet = computed(() => new Set(keys.value))
  const selectedKeys = computed(() => Object.freeze([...keys.value]))
  const selectedItems = computed(() => Object.freeze([...catalog.value].filter(([key]) => selectedSet.value.has(key)).map(([, entry]) => entry.item)))
  const selectableKeys = computed(() => [...catalog.value].filter(([, entry]) => !entry.disabled).map(([key]) => key))
  const selectableCount = computed(() => selectableKeys.value.length)
  const selectedCount = computed(() => keys.value.length)
  const selectedSelectableCount = computed(() => selectableKeys.value.filter(key => selectedSet.value.has(key)).length)
  const allSelected = computed(() => selectableCount.value > 0 && selectedSelectableCount.value === selectableCount.value)
  const indeterminate = computed(() => multiple && selectedSelectableCount.value > 0 && !allSelected.value)
  /** 程序赋值，不受禁用限制；返回选中值是否发生变化。 */
  function setSelectedKeys(value) {
    const next = normalize(value)
    if (next.length === keys.value.length && next.every((key, index) => key === keys.value[index])) return false
    keys.value = next
    return true
  }
  function isSelected(key) { return selectedSet.value.has(checkKey(key)) }
  /** 不在当前列表中的键也视为不可操作。 */
  function isDisabled(key) { return catalog.value.get(checkKey(key))?.disabled ?? true }
  function select(key) {
    if (isDisabled(key) || isSelected(key)) return false
    return setSelectedKeys(multiple ? [...keys.value, key] : [key])
  }
  function deselect(key) {
    if (isDisabled(key) || !isSelected(key)) return false
    return setSelectedKeys(keys.value.filter(value => value !== key))
  }
  function toggle(key) { return isSelected(key) ? deselect(key) : select(key) }
  function selectAll() { return multiple ? setSelectedKeys([...keys.value, ...selectableKeys.value]) : false }
  function clear() { return setSelectedKeys([]) }
  return { selectedKeys, selectedItems, selectedCount, selectableCount, allSelected, indeterminate,
    isSelected, isDisabled, select, deselect, toggle, selectAll, clear, setSelectedKeys }
}
