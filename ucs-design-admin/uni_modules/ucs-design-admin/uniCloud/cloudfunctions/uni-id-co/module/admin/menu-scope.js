const { platformMenuIds } = require('./tenant-catalog')

function classifyPages(rows) {
  const byId = new Map(rows.map(row => [row.menu_id, row]))
  const product = new Set(), platform = new Set(), productMenus = new Set()
  for (const page of rows) {
    if (page.menu_type !== 1) continue
    const branch = [page.menu_id]
    const seen = new Set(branch)
    let parent = byId.get(page.parent_id)
    let featureScope
    let platformOnly = platformMenuIds.has(page.menu_id)
    while (parent && !seen.has(parent.menu_id)) {
      branch.push(parent.menu_id)
      seen.add(parent.menu_id)
      platformOnly ||= platformMenuIds.has(parent.menu_id)
      if (!featureScope && ['platform', 'product'].includes(parent.feature_scope)) featureScope = parent.feature_scope
      parent = byId.get(parent.parent_id)
    }
    if (platformOnly || featureScope === 'platform') platform.add(page.menu_id)
    else {
      product.add(page.menu_id)
      branch.forEach(id => productMenus.add(id))
    }
  }
  return { product, platform, productMenus }
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

module.exports = { classifyPages, readMenuCatalog }
