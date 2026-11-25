const { randomBytes } = require('crypto')
const { createFields, updateFields } = require('../../lib/utils/record-metadata')
const { PLATFORM_TENANT_ID, TENANTS, PACKAGES, platformTenant } = require('../../lib/utils/platform-tenant')
const { fail, readDoc, readByIds, enterpriseScope, tenantPackageIds } = require('./tenant-scope')
const { signDelegation, verifyDelegation } = require('./admin-token')
const { menus, legacyMenuNames, permissions, tenantRights, packageRights } = require('./tenant-catalog')
const { classifyPages } = require('./menu-scope')

const allow = (actor, right) => actor.isAdmin || actor.permissions.includes(right)
const required = (actor, right) => { if (!allow(actor, right)) fail('没有此项平台操作权限') }
const duplicate = error => /duplicate|E11000|重复|唯一/i.test([error.message, error.errMsg].join(' '))
const invalid = message => fail(message, 'TENANT_INVALID')
const capabilities = (actor, rights) => Object.fromEntries(Object.entries(rights).map(([key, value]) => [key, allow(actor, value)]))
const literal = value => new RegExp(value.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')

async function platform(context) {
  await context.middleware.auth()
  const loginScope = context.loginAdminScope || context.adminScope
  if (loginScope?.tenantId !== PLATFORM_TENANT_ID || loginScope.sessionId) fail('此功能仅供平台人员使用')
  const db = uniCloud.database()
  return { db, actor: loginScope }
}

async function list(db, table, where = {}) {
  const rows = []
  for (let offset = 0; offset < 5000; offset += 100) {
    const page = (await db.collection(table).where(where).orderBy('_id', 'asc').skip(offset).limit(100).get()).data
    rows.push(...page)
    if (page.length < 100) return rows
  }
  invalid('数据超过 5000 条，请联系平台管理员')
}

async function searchTenants(db, { keyword = '', tenant_no = '', name = '', current = 1, size = 20 }) {
  if (typeof tenant_no !== 'string' || !/^\d{0,5}$/.test(tenant_no.trim()))
    invalid('租户号只能输入最多五位数字')
  if (typeof name !== 'string' || name.trim().length > 80) invalid('租户名称最多输入 80 字')
  if (typeof keyword !== 'string' || keyword.trim().length > 80) invalid('搜索关键词最多输入 80 字')
  let where = {}
  if (tenant_no.trim()) where.tenant_no = new RegExp(tenant_no.trim())
  if (name.trim()) where.name = literal(name)
  if (keyword.trim()) {
    const match = literal(keyword)
    const byKeyword = db.command.or([{ tenant_no: match }, { name: match }])
    where = Object.keys(where).length ? db.command.and([where, byKeyword]) : byKeyword
  }

  return searchPage(db, TENANTS, where, 'tenant_no', { current, size })
}

async function searchPage(db, table, where, order, { current = 1, size = 20 }, fields) {
  if (!Number.isSafeInteger(current) || current < 1 || !Number.isInteger(size) || size < 1 || size > 100)
    invalid('分页参数不正确')
  const query = () => db.collection(table).where(where)
  const { total } = await query().count()
  current = Math.min(current, Math.max(1, Math.ceil(total / size)))
  let page = query().orderBy(order, 'asc').orderBy('_id', 'asc').skip((current - 1) * size).limit(size)
  if (fields) page = page.field(fields)
  const { data } = await page.get()
  return { data, pagination: { current, size, count: total } }
}

function searchPackages(db, params, fields) {
  if (!params || typeof params !== 'object' || Array.isArray(params)) invalid('产品包查询参数不正确')
  const { keyword = '' } = params
  if (typeof keyword !== 'string' || keyword.trim().length > 80) invalid('搜索关键词最多输入 80 字')
  const id = keyword.trim()
  const where = id ? db.command.or([{ _id: id }, { name: literal(id) }]) : {}
  return searchPage(db, PACKAGES, where, 'name', params, fields)
}

// Assignment and deletion both write the package document to serialize changes to its references.
async function withPackageTransaction(db, ids, operation) {
  const transaction = await db.startTransaction()
  try {
    const packages = transaction.collection(PACKAGES)
    for (const id of [...ids].sort()) {
      const { updated } = await packages.doc(id).update({ assignment_revision: db.command.inc(1) })
      if (!updated) invalid('产品包不存在或已删除，请刷新后重试')
    }
    await operation(transaction)
    await transaction.commit()
  } catch (error) {
    await transaction.rollback().catch(() => {})
    throw error
  }
}

function nameOf(value) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 80) invalid('请输入不超过 80 字的名称')
  return value.trim()
}

async function otherEnterprise(db, id, currentTenantId) {
  if (typeof id !== 'string' || !id || id.length > 100) invalid('租户 ID 无效')
  if (id === currentTenantId) fail('当前租户不可操作', 'TENANT_CURRENT_FORBIDDEN')
  const tenant = await readDoc(db, TENANTS, id)
  if (!tenant || tenant.type !== 'enterprise') invalid('企业租户不存在')
  return tenant
}

async function ensureRecord(db, table, field, row, actor) {
  if ((await db.collection(table).where({ [field]: row[field] }).limit(1).get()).data.length) return false
  try {
    await db.collection(table).add({ ...row, ...createFields(actor) })
    return true
  } catch (error) {
    if (!duplicate(error)) throw error
    return false
  }
}

module.exports = {
  async installTenantManagement() {
    const { db, actor } = await platform(this)
    if (!actor.isAdmin) fail('仅平台管理员可初始化租户管理')
    let changed = await ensureRecord(db, TENANTS, 'tenant_no', platformTenant, actor)
    if (actor.user.is_root && !actor.user.tenant_id) {
      await db.collection('uni-id-users').where({ _id: actor.uid, tenant_id: db.command.exists(false) })
        .update({ tenant_id: PLATFORM_TENANT_ID, ...updateFields(actor) })
    }
    const menuTable = db.collection('ucsdb-admin-menus')
    for (const row of menus) {
      changed = (await ensureRecord(db, 'ucsdb-admin-menus', 'menu_id', row, actor)) || changed
      const legacyName = legacyMenuNames[row.menu_id]
      if (!legacyName) continue
      const renamed = await menuTable.where({ menu_id: row.menu_id, name: legacyName })
        .update({ name: row.name, ...updateFields(actor) })
      changed = changed || renamed.updated > 0
    }
    for (const row of permissions) changed = (await ensureRecord(db, 'uni-id-permissions', 'permission_id', row, actor)) || changed
    return { errCode: 0, changed }
  },
  async listTenants(params = {}) {
    const { db, actor } = await platform(this)
    const auth = capabilities(actor, tenantRights)
    if (!Object.values(auth).some(Boolean)) fail('没有租户管理权限')
    if (actor.user.is_root) await ensureRecord(db, TENANTS, 'tenant_no', platformTenant, actor)
    if (!params || typeof params !== 'object' || Array.isArray(params)) invalid('租户查询参数不正确')
    const paged = ['keyword', 'tenant_no', 'name', 'current', 'size'].some(key => Object.hasOwn(params, key))
    const tenants = paged ? searchTenants(db, params)
      : list(db, TENANTS).then(data => ({ data: data.sort((a, b) => a.tenant_no.localeCompare(b.tenant_no)) }))
    return { errCode: 0, auth, ...await tenants, currentTenantId: this.adminScope.tenantId }
  },
  async createTenant({ tenant_no, name } = {}) {
    const { db, actor } = await platform(this)
    required(actor, tenantRights.create)
    if (typeof tenant_no !== 'string' || !/^\d{5}$/.test(tenant_no) || tenant_no === PLATFORM_TENANT_ID)
      invalid('请输入除 00000 之外的五位数字租户号')
    try {
      const { id } = await db.collection(TENANTS).add({
        tenant_no, name: nameOf(name), type: 'enterprise', enabled: true, product_package_ids: [], ...createFields(actor)
      })
      return { errCode: 0, id }
    } catch (error) {
      if (duplicate(error)) invalid('租户号已存在')
      throw error
    }
  },
  async assignTenantPackage({ _id, product_package_ids } = {}) {
    const { db, actor } = await platform(this)
    required(actor, tenantRights.assign)
    const tenant = await otherEnterprise(db, _id, this.adminScope.tenantId)
    if (!Array.isArray(product_package_ids) ||
      product_package_ids.some(id => typeof id !== 'string' || !id || id.length > 100))
      invalid('请选择有效的产品包')
    const ids = [...new Set(product_package_ids)]
    const update = source => source.collection(TENANTS).doc(tenant._id).update({
      product_package_ids: ids, ...updateFields(actor)
    })
    if (ids.length) await withPackageTransaction(db, ids, update)
    else await update(db)
    return { errCode: 0 }
  },
  async setTenantStatus({ _id, enabled } = {}) {
    const { db, actor } = await platform(this)
    required(actor, tenantRights.status)
    const tenant = await otherEnterprise(db, _id, this.adminScope.tenantId)
    if (typeof enabled !== 'boolean') invalid('租户状态无效')
    await db.collection(TENANTS).doc(tenant._id).update({
      enabled, ...updateFields(actor)
    })
    return { errCode: 0 }
  },
  async listProductPackages(params = {}) {
    const { db, actor } = await platform(this)
    const auth = capabilities(actor, packageRights)
    if (!Object.values(auth).some(Boolean)) fail('没有租户产品包操作权限')
    return { errCode: 0, auth, ...await searchPackages(db, params) }
  },
  async getProductPackageOptions({ _id, keyword = '', current = 1 } = {}) {
    const { db, actor } = await platform(this)
    required(actor, tenantRights.assign)
    const tenant = await otherEnterprise(db, _id, this.adminScope.tenantId)
    const [page, selected] = await Promise.all([
      searchPackages(db, { keyword, current }, { _id: true, name: true }),
      current === 1 && !keyword.trim() ? readByIds(db, PACKAGES, '_id', tenantPackageIds(tenant)) : []
    ])
    return { errCode: 0, ...page, selected: selected.map(({ _id, name }) => ({ _id, name })) }
  },
  async getProductPackageAuthorization() {
    const { db, actor } = await platform(this)
    required(actor, packageRights.update)
    const menuRows = await list(db, 'ucsdb-admin-menus')
    const { productMenus } = classifyPages(menuRows)
    return { errCode: 0, menus: menuRows.filter(row => productMenus.has(row.menu_id)) }
  },
  async saveProductPackage({ _id, name, remark, menu_ids } = {}) {
    const { db, actor } = await platform(this)
    required(actor, _id ? packageRights.update : packageRights.create)
    if (remark !== undefined && (typeof remark !== 'string' || remark.trim().length > 500)) invalid('备注最多输入 500 字')
    const value = _id ? {} : { menu_ids: [] }
    if (!_id || name !== undefined) value.name = nameOf(name)
    if (remark !== undefined) value.remark = remark.trim()
    if (menu_ids !== undefined) {
      if (!Array.isArray(menu_ids) || menu_ids.length > 500 ||
        menu_ids.some(id => typeof id !== 'string' || !id || id.length > 100)) invalid('菜单格式无效')
      const menuRows = await list(db, 'ucsdb-admin-menus')
      const { product: pages } = classifyPages(menuRows)
      if (menu_ids.some(id => !pages.has(id))) invalid('产品包只允许选择产品功能页面')
      value.menu_ids = [...new Set(menu_ids)]
    }
    if (_id) {
      if (!Object.keys(value).length) invalid('请提供要更新的字段')
      if (typeof _id !== 'string' || !await readDoc(db, PACKAGES, _id)) invalid('产品包不存在')
      await db.collection(PACKAGES).doc(_id).update({ ...value, ...updateFields(actor) })
      return { errCode: 0, id: _id }
    }
    const { id } = await db.collection(PACKAGES).add({ ...value, ...createFields(actor) })
    return { errCode: 0, id }
  },
  async deleteProductPackage({ _id } = {}) {
    const { db, actor } = await platform(this)
    required(actor, packageRights.delete)
    if (typeof _id !== 'string' || !_id || _id.length > 100) invalid('产品包 ID 不正确')
    await withPackageTransaction(db, [_id], async transaction => {
      const { data } = await db.collection(TENANTS)
        .where({ product_package_ids: db.command.in([_id]) }).field({ _id: true }).limit(1).get()
      if (data.length) fail('该产品包已分配给租户，请先解除分配', 'PRODUCT_PACKAGE_IN_USE')
      await transaction.collection(PACKAGES).doc(_id).remove()
    })
    return { errCode: 0 }
  },
  async enterTenantManagement({ _id } = {}) {
    const { db, actor } = await platform(this)
    required(actor, tenantRights.enter)
    const tenant = await otherEnterprise(db, _id, this.adminScope.tenantId)
    const sessionId = randomBytes(24).toString('hex')
    const scope = await enterpriseScope(db, actor, tenant, sessionId)
    const credential = await signDelegation(this, scope)
    return { errCode: 0, sessionId, ...credential, tenant: { _id: tenant._id, tenant_no: tenant.tenant_no, name: tenant.name } }
  },
  async exitTenantManagement({ delegationToken } = {}) {
    await platform(this)
    await verifyDelegation(this, delegationToken)
    return { errCode: 0 }
  },
  async getTenantContext() {
    const scope = this.adminScope
    const { _id, name, tenant_no, type } = scope.tenant
    return { errCode: 0, tenant: { _id, name, tenant_no, type }, delegated: Boolean(scope.sessionId) }
  }
}
