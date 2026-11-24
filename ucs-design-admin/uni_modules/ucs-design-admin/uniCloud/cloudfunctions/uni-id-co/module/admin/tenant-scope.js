const { actorName } = require('../../lib/utils/record-metadata')
const { PLATFORM_TENANT_ID, TENANTS, PACKAGES, platformTenant } = require('../../lib/utils/platform-tenant')
const { hasManagementIdentity } = require('./account-types')
const { classifyPages, readMenuCatalog } = require('./menu-scope')
const { accessContext } = require('./admin-access')

const tenantTables = new Set([
  'uni-id-users', 'uni-id-roles', 'uni-id-tag', 'uni-id-log',
  'ucsdb-department',
  'ucsdb-assets', 'ucsdb-asset-groups', 'ucsdb-asset-references', 'ucsdb-app-list'
])
const sharedTables = new Set(['ucsdb-admin-menus', 'uni-id-permissions', 'ucsdb-dict-types', 'ucsdb-dict-items'])
const fail = (errMsg, errCode = 'TENANT_ACCESS_FORBIDDEN') => { throw { errCode, errMsg } }
const first = result => Array.isArray(result.data) ? result.data[0] : result.data
const readDoc = async (db, name, id) => first(await db.collection(name).doc(id).get())
const ownerOf = row => row.tenant_id ?? PLATFORM_TENANT_ID

function tenantWhere(db, tenantId) {
  return tenantId === PLATFORM_TENANT_ID
    ? db.command.or([{ tenant_id: tenantId }, { tenant_id: db.command.exists(false) }, { tenant_id: null }])
    : { tenant_id: tenantId }
}

async function platformActor(db, uid, appId) {
  const user = await readDoc(db, 'uni-id-users', uid)
  const apps = user?.dcloud_appid
  if (!user || !hasManagementIdentity(user) || (user.status || 0) !== 0 ||
    (apps != null && (!Array.isArray(apps) || (!apps.includes('*') && !apps.includes(appId)))))
    fail('当前账号已停用或无权登录此应用')
  const tenantId = ownerOf(user)
  const role = user.role || []
  const isAdmin = tenantId === PLATFORM_TENANT_ID && role.includes('admin')
  const roles = !isAdmin && role.length ? (await db.collection('uni-id-roles')
    .where(db.command.and([tenantWhere(db, tenantId), { role_id: db.command.in(role) }])).limit(500).get()).data : []
  return {
    user, uid, tenantId, name: actorName(user), apps, role, isAdmin,
    tenantAdmin: tenantId !== PLATFORM_TENANT_ID && roles.some(row => row.role_id === 'admin'),
    permissions: [...new Set(roles.flatMap(row => row.permission || []))],
    menuIds: [...new Set(roles.flatMap(row => row.menu_ids || []))]
  }
}

async function resolveTenantScope(db, uid, appId) {
  const actor = await platformActor(db, uid, appId)
  if (actor.tenantId === PLATFORM_TENANT_ID) return { ...actor, tenant: platformTenant }
  const tenant = await readDoc(db, TENANTS, actor.tenantId)
  if (!tenant || tenant.type !== 'enterprise' || !tenant.enabled || !tenantPackageIds(tenant).length)
    fail('企业租户未启用或尚未分配产品包')
  return enterpriseScope(db, actor, tenant)
}

function tenantPackageIds(tenant) {
  return Array.isArray(tenant.product_package_ids) ? tenant.product_package_ids : []
}

async function readByIds(db, collection, field, ids) {
  const values = [...new Set(ids)]
  const queries = []
  for (let offset = 0; offset < values.length; offset += 100) {
    queries.push(db.collection(collection).where({ [field]: db.command.in(values.slice(offset, offset + 100)) }).limit(100).get())
  }
  return (await Promise.all(queries)).flatMap(result => result.data)
}

async function enterprisePackageGrants(db, tenant) {
  const packageIds = tenantPackageIds(tenant)
  if (tenant.type !== 'enterprise' || !tenant.enabled || !packageIds.length)
    fail('企业租户未启用或尚未分配产品包')
  const products = await readByIds(db, PACKAGES, '_id', packageIds)
  if (products.length !== new Set(packageIds).size) fail('企业租户的产品包已失效')
  const menus = await readMenuCatalog(db)
  const { product } = classifyPages(menus)
  const selected = new Set(products.flatMap(row => row.menu_ids || []))
  const menuIds = menus
    .filter(row => selected.has(row.menu_id) && product.has(row.menu_id) && row.enable !== false)
    .map(row => row.menu_id)
  const { all } = accessContext({ db })
  const permissionPages = []
  for (let offset = 0; offset < menuIds.length; offset += 100) {
    permissionPages.push(all('uni-id-permissions', { menu_id: db.command.in(menuIds.slice(offset, offset + 100)) }))
  }
  const permissions = (await Promise.all(permissionPages)).flat().map(row => row.permission_id)
  return { menuIds, permissions }
}

async function enterpriseScope(db, actor, tenant, sessionId) {
  const { menuIds, permissions } = await enterprisePackageGrants(db, tenant)
  const allInPackage = Boolean(sessionId || actor.tenantAdmin)
  return {
    ...actor, tenant, tenantId: tenant._id, sessionId, isAdmin: false,
    packageAdministrator: allInPackage,
    permissions: allInPackage ? permissions : permissions.filter(id => actor.permissions.includes(id)),
    menuIds: allInPackage ? menuIds : menuIds.filter(id => actor.menuIds.includes(id)),
    role: sessionId ? [] : actor.role
  }
}

async function resolveEntryTenant(db, tenantNo = PLATFORM_TENANT_ID) {
  if (typeof tenantNo !== 'string' || !/^\d{5}$/.test(tenantNo)) fail('请输入五位数字租户号', 'TENANT_INVALID')
  if (tenantNo === PLATFORM_TENANT_ID) return PLATFORM_TENANT_ID
  const tenant = first(await db.collection(TENANTS).where({ tenant_no: tenantNo }).limit(1).get())
  if (!tenant || tenant.type !== 'enterprise' || !tenant.enabled || !tenantPackageIds(tenant).length) fail('租户不可用或未分配产品包')
  const ids = [...new Set(tenantPackageIds(tenant))]
  if ((await readByIds(db, PACKAGES, '_id', ids)).length !== ids.length) fail('租户的产品包已失效')
  return tenant._id
}

function scopedDatabase(db, scope) {
  const condition = tenantWhere(db, scope.tenantId)
  const constrained = where => db.command.and([where, condition])
  const write = data => {
    if (Object.hasOwn(data, 'tenant_id') && data.tenant_id !== scope.tenantId) fail('租户归属不可修改')
    return { ...data, tenant_id: scope.tenantId }
  }
  const guardedQuery = query => ({
    field: fields => guardedQuery(query.field(fields)),
    orderBy: (...args) => guardedQuery(query.orderBy(...args)),
    skip: amount => guardedQuery(query.skip(amount)),
    limit: amount => guardedQuery(query.limit(amount)),
    get: () => query.get(),
    count: () => query.count(),
    update: data => query.update(write(data)),
    remove: () => query.remove()
  })
  function collection(source, name, transactional) {
    if (!tenantTables.has(name) && !sharedTables.has(name)) fail('此集合未配置管理访问范围')
    const raw = source.collection(name)
    if (sharedTables.has(name)) {
      if (scope.tenantId === PLATFORM_TENANT_ID) return raw
      const ensureRead = query => new Proxy(query, {
        get(target, key) {
          if (['get', 'count'].includes(key)) return target[key].bind(target)
          if (['where', 'field', 'doc', 'orderBy', 'skip', 'limit'].includes(key))
            return (...args) => ensureRead(target[key](...args))
          return () => fail('此功能由平台维护')
        }
      })
      return ensureRead(raw)
    }
    return {
      where: where => guardedQuery(raw.where(constrained(where))),
      add: data => raw.add(write(data)),
      doc(id) {
        if (!transactional) return guardedQuery(raw.where(constrained({ _id: id })))
        const ref = raw.doc(id)
        const within = async () => {
          const result = await ref.get()
          const row = first(result)
          return row && ownerOf(row) === scope.tenantId ? result : { data: [] }
        }
        return {
          get: within,
          async update(data) {
            if (!first(await within())) fail('记录不存在或不在当前租户范围')
            return ref.update(write(data))
          },
          async remove() {
            if (!first(await within())) fail('记录不存在或不在当前租户范围')
            return ref.remove()
          }
        }
      }
    }
  }
  return {
    tenantActor: scope,
    command: db.command,
    RegExp: db.RegExp?.bind(db),
    collection: name => collection(db, name, false),
    appCatalog: where => db.collection('ucsdb-app-list').where(db.command.and([
      where, db.command.or([condition, tenantWhere(db, PLATFORM_TENANT_ID)])
    ])),
    async startTransaction() {
      const transaction = await db.startTransaction()
      return {
        collection: name => collection(transaction, name, true),
        commit: () => transaction.commit(),
        rollback: () => transaction.rollback()
      }
    }
  }
}

module.exports = { fail, readDoc, ownerOf, tenantWhere, platformActor, tenantPackageIds, readByIds, enterprisePackageGrants, enterpriseScope, resolveEntryTenant, resolveTenantScope, scopedDatabase }
