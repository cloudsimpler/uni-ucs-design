const { DIRECTORY, defaultPlatformPageIds } = require('./tenant-catalog')
const isPageScope = value => value === 'product' || value === 'platform'

function classifyPages(rows) {
  const byId = new Map(rows.map(row => [row.menu_id, row]))
  const product = new Set(), platform = new Set(), productMenus = new Set()
  for (const page of rows) {
    if (page.menu_type !== 1) continue
    const branch = [page.menu_id]
    const seen = new Set(branch)
    let parent = byId.get(page.parent_id)
    let inheritedScope
    let legacyPlatformBranch = false
    while (parent && !seen.has(parent.menu_id)) {
      branch.push(parent.menu_id)
      seen.add(parent.menu_id)
      legacyPlatformBranch ||= parent.menu_id === DIRECTORY
      if (!inheritedScope && isPageScope(parent.feature_scope)) inheritedScope = parent.feature_scope
      parent = byId.get(parent.parent_id)
    }
    // Keep the effective scope of old pages until they have an explicit value.
    const scope = isPageScope(page.feature_scope) ? page.feature_scope
      : legacyPlatformBranch || defaultPlatformPageIds.has(page.menu_id) ? 'platform' : inheritedScope
    if (scope === 'platform') platform.add(page.menu_id)
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

module.exports = { classifyPages, isPageScope, readMenuCatalog }
