const isPageScope = value => ['product', 'platform', 'builtin'].includes(value)

function classifyPages(rows) {
  const byId = new Map(rows.map(row => [row.menu_id, row]))
  const product = new Set(), productMenus = new Set()
  for (const page of rows) {
    if (page.menu_type !== 1 || page.feature_scope !== 'product') continue
    const branch = [page.menu_id]
    const seen = new Set(branch)
    let parent = byId.get(page.parent_id)
    while (parent && !seen.has(parent.menu_id)) {
      branch.push(parent.menu_id)
      seen.add(parent.menu_id)
      parent = byId.get(parent.parent_id)
    }
    product.add(page.menu_id)
    branch.forEach(id => productMenus.add(id))
  }
  return { product, productMenus }
}

async function readMenuCatalog(db) {
  const rows = []
  for (let offset = 0; offset < 5000; offset += 100) {
    const { data } = await db.collection('ucsdb-admin-menus').where({})
      .orderBy('_id', 'asc').skip(offset).limit(100).get()
    rows.push(...data)
    if (data.length < 100) return rows
  }
  throw { errCode: 'TENANT_INVALID', errMsg: '菜单超过 5000 条，请联系管理员整理' }
}

module.exports = { classifyPages, isPageScope, readMenuCatalog }
