/** 创建独立、只读的树快照；仅要求同级业务值唯一，拒绝循环引用。 */
export function snapshotTree(options, parents = new Set()) {
  if (!Array.isArray(options)) throw new TypeError('ucs-cascader: options/children 必须为数组')
  if (parents.has(options)) throw new TypeError('ucs-cascader: 树不能包含循环引用')
  const branch = new Set(parents); branch.add(options)
  const values = new Set()
  return Object.freeze(options.map(node => {
    if (!node || typeof node.label !== 'string' || (typeof node.value !== 'string' && !(typeof node.value === 'number' && Number.isFinite(node.value)))) throw new TypeError('ucs-cascader: 节点须包含字符串 label 和字符串或有限数字 value')
    if (branch.has(node)) throw new TypeError('ucs-cascader: 树不能包含循环引用')
    if (values.has(node.value)) throw new TypeError('ucs-cascader: 同级 value 不可重复')
    values.add(node.value)
    const next = new Set(branch); next.add(node)
    return Object.freeze({ label: node.label, value: node.value, children: snapshotTree(node.children ?? [], next) })
  }))
}

/** 沿有效路径定位，缺失或失效的后续路径逐层选择首项，直到叶子。 */
export function buildPath(tree, value) {
  const path = [], columns = [], indexes = []
  let options = tree
  while (options.length) {
    const found = options.findIndex(node => node.value === value[path.length])
    const index = found < 0 ? 0 : found
    columns.push(options); indexes.push(index); path.push(options[index])
    options = options[index].children
    // 上级失效后不复用旧分支的下级值，即使新分支存在同名业务值。
    if (found < 0) value = []
  }
  return { path, columns, indexes }
}
