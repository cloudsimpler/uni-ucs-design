const assert = require('node:assert/strict')
const { test } = require('node:test')
const path = require('node:path')
const fs = require('node:fs')
const vm = require('node:vm')
const { createRequire } = require('node:module')
const root = path.resolve(__dirname, '../uni_modules/ucs-design-admin/uniCloud/cloudfunctions/uni-id-co')
const { resolveTenantScope, resolveEntryTenant, scopedDatabase, enterpriseScope } = require(path.join(root, 'module/admin/tenant-scope'))
const { tenantRights } = require(path.join(root, 'module/admin/tenant-catalog'))
const { authenticateAdmin, verifyDelegation, installAdminTokenIssuer } = require(path.join(root, 'module/admin/admin-token'))
const methods = require(path.join(root, 'module/admin/tenant-methods'))
const { registerRootWithApp } = require(path.join(root, 'lib/utils/register-root'))
const { migrateTenantRecords } = require(path.join(root, 'lib/utils/tenant-migration'))
const { cleanLoginRoleGrants } = require(path.join(root, 'module/admin/login-role-grants'))

function memoryDatabase() {
  const tables = new Map()
  let sequence = 0
  const command = {
    and: operands => row => operands.every(filter => matches(row, filter)),
    or: operands => row => operands.some(filter => matches(row, filter)),
    exists: exists => value => exists === (value !== undefined),
    in: values => value => Array.isArray(value) ? value.some(entry => values.includes(entry)) : values.includes(value),
    neq: expected => value => value !== expected,
    inc: amount => ({ increment: amount })
  }
  function matches(row, filter) {
    return typeof filter === 'function' ? filter(row) : Object.entries(filter).every(([key, value]) => {
      if (typeof value === 'function') return value(row[key])
      if (value instanceof RegExp) return value.test(row[key])
      return row[key] === value
    })
  }
  function collection(name) {
    if (!tables.has(name)) tables.set(name, new Map())
    const table = tables.get(name)
    function query(filter = {}, fields, offset = 0, limit = 100) {
      const selected = () => [...table.values()].filter(row => matches(row, filter)).slice(offset, offset + limit)
      return {
        where: where => query(command.and([filter, where]), fields, offset, limit),
        doc: id => query({ _id: id }),
        field: fields => query(filter, fields, offset, limit),
        orderBy: () => query(filter, fields, offset, limit),
        skip: offset => query(filter, fields, offset, limit),
        limit: limit => query(filter, fields, offset, limit),
        async count() { return { total: [...table.values()].filter(row => matches(row, filter)).length } },
        async get() {
          return { data: selected().map(row => structuredClone(fields
            ? Object.fromEntries(Object.entries(row).filter(([key]) => fields[key] || key === '_id'))
            : row)) }
        },
        async add(value) {
          const id = value._id || 'id-' + ++sequence
          if (table.has(id) || (name === 'ucsdb-tenants' && [...table.values()].some(row => row.tenant_no === value.tenant_no)))
            throw new Error('duplicate')
          table.set(id, structuredClone({ ...value, _id: id }))
          return { id }
        },
        async update(patch) {
          const rows = selected()
          for (const row of rows) {
            for (const [key, value] of Object.entries(patch)) {
              row[key] = value?.increment ? (row[key] || 0) + value.increment : structuredClone(value)
            }
          }
          return { updated: rows.length }
        },
        async remove() {
          const rows = selected()
          rows.forEach(row => table.delete(row._id))
          return { deleted: rows.length }
        }
      }
    }
    return query()
  }
  return { command, collection, async startTransaction() {
    const snapshot = structuredClone(tables)
    const transactionCollection = name => {
      const raw = collection(name)
      return { ...raw, doc(id) {
        const ref = raw.doc(id)
        return { ...ref, async get() { return { data: (await ref.get()).data[0] ?? null } } }
      } }
    }
    return { collection: transactionCollection, async commit() {}, async rollback() {
      tables.clear()
      for (const [name, data] of snapshot) tables.set(name, data)
    } }
  } }
}

test('系统用户和社区用户共用全局唯一的 user_no 分配空间', async () => {
  const { createNumberedUser } = require(path.join(root, 'lib/utils/user-number'))
  const indexes = JSON.parse(fs.readFileSync(path.resolve(root, '../../database/uni-id-users.index.json'), 'utf8'))
  const index = indexes.find(item => item.IndexName === 'user_no').MgoKeySchema
  assert.equal(index.MgoIsUnique, true)
  assert.deepEqual(index.MgoIndexKeys.map(key => key.Name), ['user_no'])
  const users = new Map()
  const insert = async user => {
    if (users.has(user.user_no)) throw new Error('E11000 duplicate key user_no')
    users.set(user.user_no, user)
    return user.user_no
  }
  await createNumberedUser({ account_type: 0 }, insert, () => '1000000000')
  const candidates = ['1000000000', '1000000001']
  const number = await createNumberedUser({ account_type: 1 }, insert, () => candidates.shift())
  assert.equal(number, '1000000001')
  assert.equal(users.get('1000000000').account_type, 0)
})

test('登录仅清理本租户已绑定角色中失效的授权', async () => {
  const db = memoryDatabase()
  const roles = db.collection('uni-id-roles')
  await db.collection('ucsdb-tenants').add({
    _id: 'tenant-a', type: 'enterprise', enabled: true, product_package_ids: ['first', 'second']
  })
  const packages = db.collection('ucsdb-product-packages')
  await packages.add({ _id: 'first', menu_ids: ['paused'] })
  await packages.add({ _id: 'second', menu_ids: ['active'] })
  for (const [menu_id, enable] of [['active', true], ['paused', false], ['removed', true]]) {
    await db.collection('ucsdb-admin-menus').add({ menu_id, enable, menu_type: 1, feature_scope: 'product' })
    await db.collection('uni-id-permissions').add({ menu_id, permission_id: `read-${menu_id}` })
  }
  const grants = { menu_ids: ['active', 'paused', 'removed'], permission: ['read-active', 'read-paused', 'read-removed', 'deleted'] }
  await roles.add({ _id: 'bound', role_id: 'reader', tenant_id: 'tenant-a', ...grants })
  await roles.add({ _id: 'unbound', role_id: 'editor', tenant_id: 'tenant-a', ...grants })
  await roles.add({ _id: 'other', role_id: 'reader', tenant_id: 'tenant-b', ...grants })
  const user = { _id: 'user-a', tenant_id: 'tenant-a', role: ['reader'] }

  await cleanLoginRoleGrants(db, user)
  const [bound] = (await roles.doc('bound').get()).data
  assert.deepEqual(bound.menu_ids, ['active'])
  assert.deepEqual(bound.permission, ['read-active'])
  assert.equal(bound.update_id, user._id)
  for (const id of ['unbound', 'other']) {
    const [untouched] = (await roles.doc(id).get()).data
    assert.deepEqual(untouched.menu_ids, grants.menu_ids)
    assert.deepEqual(untouched.permission, grants.permission)
  }
  await cleanLoginRoleGrants({ ...db, startTransaction: () => assert.fail('有效授权无需写库') }, user)
})

test('系统用户操作按令牌授权，旧角色授权不拦截操作', async () => {
  const db = memoryDatabase()
  const users = db.collection('uni-id-users')
  const employee = { account_type: 0, tenant_id: 'tenant-a' }
  await users.add({ ...employee, _id: 'target', role: ['old'] })
  await users.add({ ...employee, _id: 'tenant-admin', role: ['admin'], department_id: ['a'], mobile: '13900000000' })
  await users.add({ ...employee, _id: 'community-user', account_type: 1, mobile: '13900000000' })
  await users.add({ ...employee, _id: 'other-admin', tenant_id: '00000', role: ['admin'] })
  await users.add({ ...employee, _id: 'initial-admin', tenant_id: '00000', is_root: true, role: ['admin'] })
  await users.add({ ...employee, _id: 'foreign', tenant_id: 'tenant-b' })
  await db.collection('uni-id-roles').add({
    tenant_id: 'tenant-a', role_id: 'old', permission: ['OLD_PERMISSION'], menu_ids: ['old-menu']
  })
  const { createUserAdmin } = require(path.join(root, 'module/admin/user-admin'))
  const permissions = ['READ_UNI_ID_USERS', 'UPDATE_UNI_ID_USERS', 'DELETE_UNI_ID_USERS']
  const adminWith = claims => createUserAdmin({
    db: scopedDatabase(db, { tenantId: 'tenant-a', user: employee, permissions: claims, menuIds: [] }),
    uid: 'operator', appId: 'test'
  })
  const admin = adminWith(permissions)
  const target = await admin.getUser('target')
  await admin.validateChange({ uid: 'target', nickname: '新名称' }, target)
  assert.deepEqual((await admin.options()).roles.map(role => role.role_id), ['old'])
  await admin.validateChange({ uid: 'target', role: [] }, target)
  await assert.rejects(adminWith(['CREATE_UNI_ID_USERS']).validateChange({ nickname: '新用户', gender: 1, role: ['old'] }),
    { errMsg: '绑定角色需要编辑系统用户权限' })
  await assert.rejects(admin.validateChange({ uid: 'target', password: 'NewPassword123' }, target), { errCode: 'USER_ADMIN_FORBIDDEN' })
  await admin.validateChange({ uid: 'target', role: ['old'] }, { ...target, role: [] })
  await assert.rejects(admin.validateChange({ uid: 'target', role: ['admin'] }, target), { errCode: 'USER_ADMIN_FORBIDDEN' })
  await assert.rejects(admin.removeAccount({ uid: 'foreign' }), { errCode: 'USER_ADMIN_NOT_FOUND' })
  await assert.rejects(adminWith(['UPDATE_UNI_ID_USERS']).removeAccount({ uid: 'tenant-admin' }), { errCode: 'USER_ADMIN_FORBIDDEN' })
  await assert.rejects(admin.removeAccount({ uid: 'community-user' }), { errCode: 'USER_ADMIN_FORBIDDEN' })
  assert.equal((await admin.removeAccount({ uid: 'tenant-admin' })).deleted, true)
  assert.equal((await db.collection('uni-id-users').doc('tenant-admin').get()).data.length, 0)
  assert.equal((await db.collection('uni-id-users').doc('community-user').get()).data[0].account_type, 1)
  const platformOperator = createUserAdmin({
    db: scopedDatabase(db, { tenantId: '00000', user: employee, isAdmin: false, permissions: ['DELETE_UNI_ID_USERS'] }),
    uid: 'operator', appId: 'test'
  })
  assert.equal((await platformOperator.removeAccount({ uid: 'other-admin' })).deleted, true)
  const delegatedAdmin = createUserAdmin({
    db: scopedDatabase(db, { tenantId: '00000', user: employee, isAdmin: true, userDelegationId: 'delegation' }),
    uid: 'delegated-admin', appId: 'test'
  })
  await assert.rejects(delegatedAdmin.removeAccount({ uid: 'initial-admin' }), { errMsg: '初始超级管理员不可删除' })
  assert.ok((await db.collection('uni-id-users').doc('initial-admin').get()).data.length)
  assert.equal((await admin.removeAccount({ uid: 'target' })).deleted, true)
})

test('普通角色管理员可以维护含有旧授权的角色，新增授权限定在令牌范围内', async () => {
  const db = memoryDatabase()
  const tenant = { _id: 'tenant-a', type: 'enterprise' }
  const roles = db.collection('uni-id-roles')
  for (const menu_id of ['editable', 'restricted']) {
    await db.collection('ucsdb-admin-menus').add({ menu_id, menu_type: 1 })
    await db.collection('uni-id-permissions').add({ menu_id, permission_id: `READ_${menu_id}` })
  }
  const role = { _id: 'target-role', tenant_id: tenant._id, role_id: 'target', role_name: '旧名称', menu_ids: ['restricted', 'deleted-page'], permission: ['READ_restricted', 'DELETED_PERMISSION'] }
  await roles.add(role)
  const { createAccessAdmin } = require(path.join(root, 'module/admin/access-admin'))
  const admin = createAccessAdmin({ db: scopedDatabase(db, {
    tenant, tenantId: tenant._id, uid: 'operator', role: [], menuIds: ['editable'],
    permissions: ['UPDATE_UNI_ID_ROLES', 'DELETE_UNI_ID_ROLES', 'READ_editable']
  }) })

  const saved = await admin.saveRole({ _id: role._id, role_name: '新名称' })
  assert.equal(saved.sessionsInvalidated, false)
  const [edited] = (await roles.doc(role._id).get()).data
  assert.equal(edited.role_name, '新名称')
  assert.deepEqual(edited.permission, role.permission)

  await admin.saveRole({ _id: role._id, menu_ids: ['editable'], permission: ['READ_editable'] })
  const [updated] = (await roles.doc(role._id).get()).data
  assert.deepEqual(updated.menu_ids.sort(), ['editable', 'restricted'])
  assert.deepEqual(updated.permission.sort(), ['READ_editable', 'READ_restricted'])
  await db.collection('uni-id-permissions').add({ menu_id: 'restricted', permission_id: 'WRITE_restricted' })
  await assert.rejects(admin.saveRole({ _id: role._id, permission: ['WRITE_restricted'] }), { errCode: 'ADMIN_ACCESS_FORBIDDEN' })
  const users = db.collection('uni-id-users')
  await users.add({ _id: 'assigned-user', tenant_id: tenant._id, role: [role.role_id] })
  await assert.rejects(admin.deleteRole({ _id: role._id }), { errMsg: '角色已分配给用户，请先解除绑定' })
  await users.doc('assigned-user').remove()
  await admin.deleteRole({ _id: role._id })
  assert.equal((await roles.doc(role._id).get()).data.length, 0)
})

test('租户手动创建 admin 后只获得本租户产品包权限', async () => {
  const db = memoryDatabase()
  const tenant = { _id: 'tenant-a', tenant_no: '00001', type: 'enterprise', enabled: true, product_package_ids: ['package'] }
  await db.collection('ucsdb-tenants').add(tenant)
  await db.collection('ucsdb-product-packages').add({ _id: 'package', menu_ids: ['product', 'platform'] })
  for (const [menu_id, feature_scope] of [['product', 'product'], ['platform', 'platform']]) {
    await db.collection('ucsdb-admin-menus').add({ menu_id, menu_type: 1, feature_scope })
    await db.collection('uni-id-permissions').add({ menu_id, permission_id: `READ_${menu_id}` })
  }
  const users = db.collection('uni-id-users')
  await users.add({ _id: 'root', tenant_id: '00000', account_type: 0, role: ['admin'] })
  await users.add({ _id: 'tenant-user', tenant_id: tenant._id, account_type: 0, role: ['admin'] })
  await db.collection('uni-id-roles').add({ tenant_id: '00000', role_id: 'admin', role_name: '超级管理员' })
  assert.deepEqual((await resolveTenantScope(db, 'tenant-user', 'test')).permissions, [])
  const { createAccessAdmin } = require(path.join(root, 'module/admin/access-admin'))
  const { createUserAdmin } = require(path.join(root, 'module/admin/user-admin'))
  const rootScope = await resolveTenantScope(db, 'root', 'test')
  const platform = createAccessAdmin({ db: scopedDatabase(db, rootScope) })
  await assert.rejects(platform.saveRole({ role_id: 'admin', role_name: '平台管理员' }), { errMsg: '平台超级管理员为内置角色，不可维护' })
  const operator = {
    ...await enterpriseScope(db, rootScope, tenant, 'tenant-session'),
    permissions: ['CREATE_UNI_ID_ROLES', 'UPDATE_UNI_ID_ROLES', 'DELETE_UNI_ID_ROLES', 'UPDATE_UNI_ID_USERS']
  }
  const tenantDb = scopedDatabase(db, operator)
  const access = createAccessAdmin({ db: tenantDb })
  assert.deepEqual((await access.listRoles()).data, [])
  const { id } = await access.saveRole({ role_id: 'admin', role_name: '企业管理员' })
  await assert.rejects(access.saveRole({ _id: id, permission: ['READ_platform'] }), { errMsg: '企业管理员的权限由租户产品包决定' })
  const admin = createUserAdmin({ db: tenantDb, uid: 'root', appId: 'test' })
  await admin.validateChange({ uid: 'tenant-user', role: ['admin'] }, { account_type: 0, role: [] })
  const regular = createUserAdmin({ db: scopedDatabase(db, { ...operator, packageAdministrator: false }), uid: 'root', appId: 'test' })
  await assert.rejects(regular.validateChange({ uid: 'tenant-user', role: ['admin'] }, { account_type: 0, role: [] }), { errCode: 'USER_ADMIN_FORBIDDEN' })
  const tenantAdmin = await resolveTenantScope(db, 'tenant-user', 'test')
  assert.equal(tenantAdmin.isAdmin, false)
  assert.equal(tenantAdmin.packageAdministrator, true)
  assert.deepEqual(tenantAdmin.permissions, ['READ_product'])
  assert.deepEqual(tenantAdmin.menuIds, ['product'])
  await assert.rejects(access.deleteRole({ _id: id }), { errMsg: '角色已分配给用户，请先解除绑定' })
})

test('首次注册同事务建立平台、管理员和实际应用类型', async () => {
  const db = memoryDatabase()
  const root = await registerRootWithApp(db, { is_root: true, role: ['admin'], username: 'admin' }, { appId: 'test' }, '管理端', 1)
  assert.equal((await db.collection('uni-id-users').doc(root.id).get()).data[0].tenant_id, '00000')
  assert.equal((await db.collection('ucsdb-tenants').doc('00000').get()).data[0].type, 'platform')
  const [app] = (await db.collection('ucsdb-app-list').where({ appid: 'test' }).get()).data
  assert.equal(app.app_type, 1)
  assert.equal(app.tenant_id, '00000')
})

test('签名权限按租户隔离，新的签发读取最新的产品包', async () => {
  const db = memoryDatabase()
  global.uniCloud = { database: () => db }
  const users = db.collection('uni-id-users')
  const roles = db.collection('uni-id-roles')
  const permissions = db.collection('uni-id-permissions')
  const menus = db.collection('ucsdb-admin-menus')
  const credentials = new Map()
  let sequence = 0
  const actor = (uid, sessionId) => {
    const appId = 'test'
    const expiry = Math.floor(Date.now() / 1000) + 7 * 86400
    const auth = {
      middleware: { async auth() {} }, authInfo: { uid },
      getUniversalClientInfo: () => ({ appId }),
      getUniversalUniIdToken: () => 'token-' + uid,
      getParams: () => [{}, sessionId], platformTokenExpires: expiry * 1000,
      config: { tokenExpiresThreshold: 3 * 86400 }, response: {}, issueAdminScope: true,
      uniIdCommon: {
        setInterceptor(_name, issuer) { this.issuer = issuer },
        async checkToken(token) { return credentials.get(token) || { errCode: 'INVALID' } },
        async checkDelegationToken(token) { return credentials.get(token) || { errCode: 'INVALID' } },
        async refreshToken({ token }) {
          const { uid } = credentials.get(token)
          const fresh = 'renewed-' + ++sequence
          credentials.set(fresh, { ...await this.issuer({ uid, role: [], permission: [] }), exp: expiry })
          return { token: fresh, tokenExpired: expiry * 1000 }
        },
        async createDelegationToken({ uid, scope }) {
          const token = 'delegation-' + ++sequence
          credentials.set(token, { uid, exp: expiry, ucsDelegation: structuredClone(scope) })
          return { token, tokenExpired: expiry * 1000 }
        }
      }
    }
    installAdminTokenIssuer(auth)
    return auth
  }
  const run = async (method, uid, arg) => {
    const context = actor(uid)
    context.adminScope = await resolveTenantScope(db, uid, 'test')
    return methods[method].call(context, arg)
  }
  await users.add({ _id: 'root', nickname: '平台管理员', role: ['admin'], account_type: 0, tenant_id: '00000' })
  await users.add({ _id: 'operator', nickname: '运营', role: ['ops'], account_type: 0, tenant_id: '00000' })
  await roles.add({ role_id: 'ops', tenant_id: '00000', menu_ids: ['platform_tenant'], permission: [tenantRights.enter] })
  await menus.add({ menu_id: 'tenant_operations', name: '租户运营', menu_type: 0, enable: true })
  await menus.add({ menu_id: 'platform_product_package', name: '产品包管理', parent_id: 'tenant_operations', menu_type: 1, enable: true, url: '/platform/package' })
  assert.equal((await run('installTenantManagement', 'root')).changed, true)
  assert.equal((await run('installTenantManagement', 'root')).changed, false)
  assert.equal((await menus.where({ menu_id: 'platform_tenant' }).get()).data.length, 1)
  assert.equal((await menus.where({ menu_id: 'tenant_operations' }).get()).data[0].name, '系统运维')
  assert.equal((await menus.where({ menu_id: 'platform_product_package' }).get()).data[0].name, '租户产品包')
  const [menuManagement] = (await menus.where({ menu_id: 'platform_menu' }).get()).data
  assert.equal(menuManagement.parent_id, 'tenant_operations')
  assert.equal(menuManagement.url, '/uni_modules/ucs-design-admin/pages/platform/menu/menu')
  await menus.add({ menu_id: 'system', menu_type: 0, enable: true })
  await menus.add({ menu_id: 'custom_ops', menu_type: 0, enable: true, feature_scope: 'platform' })
  await menus.add({ menu_id: 'custom_ops_sub', parent_id: 'custom_ops', menu_type: 0, feature_scope: 'inherit' })
  await menus.add({ menu_id: 'custom_report', parent_id: 'custom_ops_sub', menu_type: 1, url: '/ops/report' })
  await menus.add({ menu_id: 'system_user', parent_id: 'system', menu_type: 1, enable: true, url: '/system/user' })
  await permissions.add({ menu_id: 'system_user', permission_id: 'READ_UNI_ID_USERS' })
  await permissions.add({ menu_id: 'system_user', permission_id: 'CREATE_UNI_ID_USERS' })
  const { id: pkg } = await run('saveProductPackage', 'root', {
    name: '系统人员', remark: '  用于人员管理  ', menu_ids: ['system_user']
  })
  const packageData = await run('listProductPackages', 'root')
  assert.deepEqual(packageData.menus.map(row => row.menu_id).sort(), ['system', 'system_user'])
  const savedPackage = packageData.data.find(row => row._id === pkg)
  assert.deepEqual(savedPackage.menu_ids, ['system_user'])
  assert.equal(Object.hasOwn(savedPackage, 'permission_ids'), false)
  await assert.rejects(run('saveProductPackage', 'root', { _id: pkg, menu_ids: ['system'] }), { errCode: 'TENANT_INVALID' })
  const fullMenuIds = ['platform_tenant', 'platform_product_package', 'platform_menu', 'platform_dictionary']
  await assert.rejects(run('saveProductPackage', 'root', { _id: pkg, menu_ids: ['platform_tenant'] }), { errCode: 'TENANT_INVALID' })
  await assert.rejects(run('saveProductPackage', 'root', { _id: pkg, menu_ids: ['custom_report'] }), { errCode: 'TENANT_INVALID' })
  const dictionaryMethods = require(path.join(root, 'module/admin/dictionary-methods'))
  const dictionaryContext = scope => ({
    adminDb: scopedDatabase(db, scope),
    authInfo: { uid: scope.uid },
    getUniversalClientInfo: () => ({ appId: 'test' })
  })
  const platformDictionary = dictionaryContext(await resolveTenantScope(db, 'root', 'test'))
  assert.equal((await dictionaryMethods.installDictionaryManagement.call(platformDictionary)).changed, true)
  assert.equal((await dictionaryMethods.installDictionaryManagement.call(platformDictionary)).changed, false)
  const [dictionaryMenu] = (await menus.where({ menu_id: 'platform_dictionary' }).get()).data
  assert.equal(dictionaryMenu.parent_id, 'tenant_operations')
  assert.equal(dictionaryMenu.name, '系统字典')
  assert.equal(dictionaryMenu.url, '/uni_modules/ucs-design-admin/pages/platform/dictionary/dictionary')
  const [dictionaryPermission] = (await permissions.where({ permission_id: 'READ_UCSDB_DICT' }).get()).data
  assert.equal(dictionaryPermission.permission_name, '查看系统字典')
  assert.equal(dictionaryPermission.menu_id, 'platform_dictionary')
  await assert.rejects(run('saveProductPackage', 'root', { _id: pkg, menu_ids: ['platform_dictionary'] }), { errCode: 'TENANT_INVALID' })
  const { id: operationsPackage } = await db.collection('ucsdb-product-packages').add({
    name: '历史运营菜单', menu_ids: fullMenuIds
  })
  const productRemark = async () => (await run('listProductPackages', 'root')).data.find(row => row._id === pkg).remark
  assert.equal(await productRemark(), '用于人员管理')
  const { id: a } = await run('createTenant', 'root', { tenant_no: '00001', name: '企业甲' })
  const { id: b } = await run('createTenant', 'root', { tenant_no: '00002', name: '企业乙' })
  const { id: addOn } = await run('saveProductPackage', 'root', {
    name: '增值包', menu_ids: ['system_user']
  })
  const page = await run('listTenants', 'root', { tenant_no: '0000', name: '企业', current: 2, size: 1 })
  assert.deepEqual(page.pagination, { current: 2, size: 1, count: 2 })
  assert.deepEqual(page.data.map(row => row._id), [b])
  const numberMatch = await run('listTenants', 'root', { keyword: '00002' })
  const nameMatch = await run('listTenants', 'root', { keyword: '企业乙' })
  assert.deepEqual(numberMatch.data.map(row => row._id), [b])
  assert.deepEqual(nameMatch.data.map(row => row._id), [b])
  const noMatch = await run('listTenants', 'root', { name: '.*', size: 1 })
  assert.deepEqual(noMatch.pagination, { current: 1, size: 1, count: 0 })
  await assert.rejects(run('createTenant', 'operator', { tenant_no: '00003', name: '企业丙' }), { errCode: 'TENANT_ACCESS_FORBIDDEN' })
  for (const _id of [a, b]) await run('assignTenantPackage', 'root', { _id, product_package_ids: [pkg] })
  await run('assignTenantPackage', 'root', { _id: a, product_package_ids: [pkg, addOn, addOn] })
  assert.deepEqual((await db.collection('ucsdb-tenants').doc(a).get()).data[0].product_package_ids, [pkg, addOn])
  assert.equal(await resolveEntryTenant(db, '00001'), a)
  assert.equal(await resolveEntryTenant(db, '00002'), b)
  for (const tenant_id of [a, b]) {
    const empty = await db.collection('uni-id-roles').where({ tenant_id }).get()
    assert.deepEqual(empty.data, [])
    await db.collection('uni-id-roles').add({ tenant_id, role_id: 'admin', role_name: '企业管理员' })
  }
  await users.add({ _id: 'a-admin', username: 'admin', tenant_id: a, account_type: 0, role: ['admin'] })
  await users.add({ _id: 'b-admin', username: 'admin', tenant_id: b, account_type: 0, role: ['admin'] })
  await users.add({ _id: 'a-community', tenant_id: a, account_type: 1 })
  await users.add({ _id: 'b-community', tenant_id: b, account_type: 1 })
  const session = await run('enterTenantManagement', 'operator', { _id: a })
  const operator = actor('operator')
  const platform = await operator.uniIdCommon.issuer({ uid: 'operator', role: [], permission: [] })
  credentials.set('token-operator', { ...platform, exp: operator.platformTokenExpires / 1000 })
  const scope = () => authenticateAdmin(actor('operator'), session.delegationToken)
  global.uniCloud.database = () => { throw new Error('普通鉴权不应读取数据库') }
  assert.equal((await scope()).tenantId, a)
  await assert.rejects(authenticateAdmin(actor('operator'), session.sessionId), { errCode: 'TENANT_SESSION_INVALID' })
  global.uniCloud.database = () => db
  const tenantDb = scopedDatabase(db, await scope())
  assert.deepEqual((await tenantDb.collection('uni-id-users').where({}).get()).data.map(row => row._id), ['a-admin', 'a-community'])
  assert.equal((await tenantDb.collection('uni-id-users').doc('b-admin').get()).data.length, 0)
  assert.equal((await tenantDb.collection('uni-id-users').doc('b-admin').update({ nickname: '不应生效' })).updated, 0)
  const addUserFile = path.join(root, 'module/admin/add-user.js')
  const addUserModule = { exports: {} }
  const localRequire = createRequire(addUserFile)
  const addUserSource = fs.readFileSync(addUserFile, 'utf8')
  vm.runInThisContext('(function(require,module){' + addUserSource + '\n})')((name) =>
    name === '../../lib/utils/password' ? class {
      generatePasswordHash() { return { passwordHash: 'stub-hash', version: 1 } }
    } : localRequire(name), addUserModule)
  const addUser = addUserModule.exports
  const createAdmin = {
    username: 'enterprise_admin', nickname: '首任管理员', gender: 1,
    mobile: '13900000000', email: 'shared@example.com', password: 'test-password', authorizedApp: ['test']
  }
  await users.add({ _id: 'b-employee', username: createAdmin.username, mobile: createAdmin.mobile, tenant_id: b, account_type: 0 })
  await users.doc('a-community').update({ username: createAdmin.username, mobile: createAdmin.mobile, mobile_confirmed: 1, email: createAdmin.email, email_confirmed: 1 })
  const { Validator } = require(path.join(root, 'common/validator'))
  const validate = require(path.join(root, 'middleware/validate')).bind({ validator: new Validator() })
  const createSystemUser = (params, method = 'addUser') => addUser.call({
    ...actor('operator', session.sessionId), adminDb: tenantDb, middleware: { validate },
    getMethodName: () => method, hooks: {}, config: {}
  }, params)
  await createSystemUser(createAdmin)
  await assert.rejects(createSystemUser({ ...createAdmin, mobile: '13800000001', email: 'another@example.com' }), { errCode: 'uni-id-account-exists' })
  await assert.rejects(createSystemUser({ ...createAdmin, mobile: '13800000001', username: 'another_employee' }), { errCode: 'uni-id-account-exists' })
  await assert.rejects(createSystemUser({ ...createAdmin, username: 'another_employee', email: 'another@example.com' }), {
    errCode: 'SYSTEM_MOBILE_EXISTS'
  })
  const noMobile = { ...createAdmin, username: 'no_mobile', mobile: undefined, email: 'no-mobile@example.com' }
  await assert.rejects(createSystemUser(noMobile), {
    errCode: 'uni-id-param-required', errMsgValue: { param: 'mobile' }
  })
  await assert.rejects(createSystemUser({ ...noMobile, mobile: '  ' }), {
    errCode: 'uni-id-param-required', errMsgValue: { param: 'mobile' }
  })
  await createSystemUser(noMobile, 'addDeveloper')
  const { data: created } = await tenantDb.collection('uni-id-users').where({ username: createAdmin.username, account_type: 0 }).get()
  assert.equal(created[0].tenant_id, a)
  assert.equal(created[0].create_id, 'operator')
  assert.equal(created[0].is_root, undefined)
  assert.equal(created[0].account_type, 0)
  const updateRootAware = require(path.join(root, 'module/admin/root-admin')).updateRootAware
  const { data: developer } = await tenantDb.collection('uni-id-users').where({ username: 'no_mobile' }).get()
  await assert.rejects(updateRootAware({ db: tenantDb, uid: developer[0]._id, current: developer[0], data: { mobile: createAdmin.mobile } }), {
    errCode: 'SYSTEM_MOBILE_EXISTS'
  })
  await updateRootAware({ db: tenantDb, uid: created[0]._id, current: created[0], data: { mobile: createAdmin.mobile } })
  assert.equal(created[0].mobile_confirmed, 0)
  assert.equal((await users.doc('a-community').get()).data[0].mobile_confirmed, 1)
  assert.equal((await tenantDb.collection('uni-id-users').where({ username: 'no_mobile' }).get()).data[0].mobile, undefined)
  const { findUser } = require(path.join(root, 'lib/utils/account'))
  const mobileQuery = { userQuery: { mobile: createAdmin.mobile }, tenantId: a, matchAllApps: true }
  assert.deepEqual((await findUser({ ...mobileQuery, accountTypes: [0] })).userMatched, [])
  assert.deepEqual((await findUser({ ...mobileQuery, accountTypes: [1] })).userMatched.map(user => user._id), ['a-community'])
  assert.deepEqual((await findUser({ ...mobileQuery, uniqueAccountType: 0 })).userMatched.map(user => user._id), [created[0]._id])
  assert.deepEqual((await findUser({ ...mobileQuery, uniqueAccountType: 1 })).userMatched.map(user => user._id), ['a-community'])
  for (const userQuery of [{ username: createAdmin.username }, { email: createAdmin.email }]) {
    const query = { userQuery, tenantId: a, matchAllApps: true }
    assert.deepEqual((await findUser({ ...query, uniqueAccountType: 0 })).userMatched.map(user => user._id), [created[0]._id])
    assert.deepEqual((await findUser({ ...query, uniqueAccountType: 1 })).userMatched.map(user => user._id), ['a-community'])
  }
  const contactFile = path.join(root, 'lib/utils/contact-auth.js')
  const contactModule = { exports: {} }
  const requireContact = createRequire(contactFile)
  vm.runInThisContext('(function(require,module){' + fs.readFileSync(contactFile, 'utf8') + '\n})')(name => {
    if (name === './verify-code') return { async verifyMobileCode() {} }
    if (name === './captcha') return { async getNeedCaptcha() { return false } }
    if (name === './account-selection') return {
      issueSelection(_context, users) { return users.map(user => user._id) }
    }
    return requireContact(name)
  }, contactModule)
  const recover = method => contactModule.exports.beginAccountRecovery.call({
    entryTenantId: a, getMethodName: () => method, middleware: { validate() {} },
    getUniversalClientInfo: () => ({ appId: 'test' })
  }, { channel: 'mobile', mobile: createAdmin.mobile, code: '123456' })
  assert.deepEqual(await recover('adminBeginAccountRecovery'), [])
  assert.deepEqual(await recover('beginAccountRecovery'), ['a-community'])
  await users.doc(created[0]._id).update({ mobile_confirmed: 1 })
  assert.deepEqual(await recover('adminBeginAccountRecovery'), [created[0]._id])
  assert.deepEqual(await recover('beginAccountRecovery'), ['a-community'])
  const added = await tenantDb.collection('ucsdb-department').add({ name: '部门' })
  assert.equal((await db.collection('ucsdb-department').doc(added.id).get()).data[0].tenant_id, a)
  assert.throws(() => tenantDb.collection('ucsdb-department').add({ tenant_id: b }), { errCode: 'TENANT_ACCESS_FORBIDDEN' })
  const tx = await tenantDb.startTransaction()
  await assert.rejects(tx.collection('uni-id-users').doc('b-community').remove(), { errCode: 'TENANT_ACCESS_FORBIDDEN' })
  await tx.rollback()
  await assert.rejects(verifyDelegation(actor('root'), session.delegationToken), { errCode: 'TENANT_SESSION_INVALID' })
  assert.deepEqual((await resolveTenantScope(db, 'a-admin', 'test')).permissions, ['READ_UNI_ID_USERS', 'CREATE_UNI_ID_USERS'])
  await assert.rejects(run('listTenants', 'a-admin'), { errCode: 'TENANT_ACCESS_FORBIDDEN' })
  await run('saveProductPackage', 'root', { _id: pkg, menu_ids: [] })
  await db.collection('uni-id-permissions').add({ menu_id: 'system_user', permission_id: 'EXPORT_UNI_ID_USERS' })
  const currentPermissions = ['READ_UNI_ID_USERS', 'CREATE_UNI_ID_USERS', 'EXPORT_UNI_ID_USERS']
  assert.deepEqual((await resolveTenantScope(db, 'a-admin', 'test')).permissions, currentPermissions)
  await db.collection('uni-id-roles').add({
    tenant_id: a, role_id: 'reader', menu_ids: ['system_user'], permission: ['READ_UNI_ID_USERS']
  })
  await db.collection('uni-id-users').add({ _id: 'a-reader', tenant_id: a, account_type: 0, role: ['reader'] })
  assert.deepEqual((await resolveTenantScope(db, 'a-reader', 'test')).permissions, ['READ_UNI_ID_USERS'])
  assert.equal(await productRemark(), '用于人员管理')
  assert.deepEqual((await scope()).permissions, ['READ_UNI_ID_USERS', 'CREATE_UNI_ID_USERS'])
  await run('saveProductPackage', 'root', { _id: pkg, name: '系统人员·更新', remark: '' })
  assert.equal(await productRemark(), '')
  assert.deepEqual((await scope()).permissions, ['READ_UNI_ID_USERS', 'CREATE_UNI_ID_USERS'])
  assert.deepEqual((await scope()).menuIds, ['system_user'])
  const originalDelegation = credentials.get(session.delegationToken)
  credentials.set(session.delegationToken, { ...originalDelegation, exp: Math.floor(Date.now() / 1000) + 3600 })
  const renewal = actor('operator')
  assert.deepEqual((await authenticateAdmin(renewal, session.delegationToken)).permissions, currentPermissions)
  assert.ok(renewal.response.newDelegation.delegationToken)
  credentials.set(session.delegationToken, originalDelegation)
  assert.equal((await run('exitTenantManagement', 'operator', { delegationToken: session.delegationToken })).errCode, 0)
  assert.equal((await scope()).tenantId, a)
  const second = await run('enterTenantManagement', 'operator', { _id: a })
  assert.deepEqual((await verifyDelegation(actor('operator'), second.delegationToken)).scope.permissions, currentPermissions)
  await run('setTenantStatus', 'root', { _id: a, enabled: false })
  await assert.rejects(resolveEntryTenant(db, '00001'), { errCode: 'TENANT_ACCESS_FORBIDDEN' })
  await run('setTenantStatus', 'root', { _id: a, enabled: true })
  await run('assignTenantPackage', 'root', { _id: a, product_package_ids: [pkg] })
  const third = await run('enterTenantManagement', 'operator', { _id: a })
  assert.deepEqual((await verifyDelegation(actor('operator'), third.delegationToken)).scope.permissions, [])
  const originalPlatform = credentials.get('token-operator')
  await db.collection('uni-id-roles').where({ role_id: 'ops' }).update({ permission: [] })
  credentials.set('token-operator', { ...originalPlatform, exp: Math.floor(Date.now() / 1000) + 3600 })
  const platformRenewal = actor('operator')
  assert.deepEqual((await authenticateAdmin(platformRenewal)).permissions, [])
  assert.ok(platformRenewal.response.newToken.token)
  await run('assignTenantPackage', 'root', { _id: b, product_package_ids: [operationsPackage] })
  const operationsSession = await run('enterTenantManagement', 'root', { _id: b })
  const rootActor = actor('root')
  credentials.set('token-root', {
    ...await rootActor.uniIdCommon.issuer({ uid: 'root', role: [], permission: [] }),
    exp: rootActor.platformTokenExpires / 1000
  })
  const operationsScope = await authenticateAdmin(rootActor, operationsSession.delegationToken)
  assert.equal(operationsScope.tenantId, b)
  assert.equal(operationsScope.isAdmin, false)
  assert.deepEqual(operationsScope.menuIds, [])
  assert.ok(!operationsScope.permissions.includes(tenantRights.enter))
  const { createMenuAdmin } = require(path.join(root, 'module/admin/menu-admin'))
  const menusFor = async scope => (await createMenuAdmin({
    db: scopedDatabase(db, scope), uid: 'root', appId: 'test'
  }).current()).data
  assert.deepEqual(await menusFor(operationsScope), [])
  const sidebar = await menusFor({ ...operationsScope, menuIds: ['system_user', ...fullMenuIds] })
  assert.deepEqual(sidebar.map(directory => directory.menu_id), ['system'])
  assert.deepEqual(sidebar[0].children.map(page => page.menu_id), ['system_user'])
  const platformSidebar = await menusFor(rootActor.loginAdminScope)
  assert.deepEqual(platformSidebar.find(directory => directory.menu_id === 'tenant_operations')
    .children.map(page => page.menu_id).sort(), [...fullMenuIds].sort())
  const fromDelegation = await methods.listTenants.call(rootActor, { tenant_no: '00002' })
  assert.deepEqual(fromDelegation.data.map(row => row._id), [b])
  assert.equal(fromDelegation.currentTenantId, b)
  assert.equal(fromDelegation.auth.create, true)
  for (const [method, params] of [
    ['assignTenantPackage', { _id: b, product_package_ids: [] }],
    ['setTenantStatus', { _id: b, enabled: false }],
    ['enterTenantManagement', { _id: b }]
  ]) await assert.rejects(methods[method].call(rootActor, params), { errCode: 'TENANT_CURRENT_FORBIDDEN' })
  assert.equal((await methods.setTenantStatus.call(rootActor, { _id: a, enabled: true })).errCode, 0)
  assert.equal((await methods.listProductPackages.call(rootActor)).errCode, 0)
  const readOnlyOperator = {
    ...rootActor,
    loginAdminScope: { ...rootActor.loginAdminScope, isAdmin: false, permissions: [tenantRights.read] }
  }
  assert.equal((await methods.listTenants.call(readOnlyOperator)).auth.create, false)
  await assert.rejects(methods.createTenant.call(readOnlyOperator, { tenant_no: '00003', name: '企业丙' }), {
    errCode: 'TENANT_ACCESS_FORBIDDEN'
  })
  const withoutOperationsPermission = {
    ...rootActor, loginAdminScope: { ...rootActor.loginAdminScope, isAdmin: false, permissions: [] }
  }
  await assert.rejects(methods.listTenants.call(withoutOperationsPermission), { errCode: 'TENANT_ACCESS_FORBIDDEN' })
  assert.deepEqual((await resolveTenantScope(db, 'b-admin', 'test')).menuIds, [])
  const type = { code: 'status', name: '状态', description: '', enabled: true, sort: 0 }
  await dictionaryMethods.saveDictionaryType.call(platformDictionary, type)
  const [savedType] = (await db.collection('ucsdb-dict-types').where({ code: type.code }).get()).data
  assert.equal(Object.hasOwn(savedType, 'tenant_id'), false)
  await dictionaryMethods.saveDictionaryItem.call(platformDictionary, {
    dict_id: savedType._id, label: '平台选项', value: 'platform', enabled: true, sort: 0
  })
  const [savedItem] = (await db.collection('ucsdb-dict-items').where({ dict_id: savedType._id }).get()).data
  assert.equal(Object.hasOwn(savedItem, 'tenant_id'), false)
  const tenantScope = await resolveTenantScope(db, 'b-admin', 'test')
  const tenantDictionary = dictionaryContext(tenantScope)
  const { data: options } = await dictionaryMethods.getDictionaryOptions.call(tenantDictionary, { codes: ['status'] })
  assert.deepEqual(options.status.map(option => option.value), ['platform'])
  await assert.rejects(dictionaryMethods.saveDictionaryType.call(tenantDictionary, {
    ...type, code: 'tenant_status'
  }), { errCode: 'ADMIN_ACCESS_FORBIDDEN' })

  const rootMenus = createMenuAdmin({ db: platformDictionary.adminDb, uid: 'root', appId: 'test' })
  const menuTable = db.collection('ucsdb-admin-menus')
  const { data: menuEditorRows } = await rootMenus.list({ includePermissions: false })
  for (const id of fullMenuIds) assert.equal(menuEditorRows.find(row => row.menu_id === id).feature_scope, 'platform')
  const legacyReport = menuEditorRows.find(row => row.menu_id === 'custom_report')
  assert.equal(legacyReport.feature_scope, 'platform')
  const legacyDirectory = menuEditorRows.find(row => row.menu_id === 'custom_ops_sub')
  await rootMenus.update({ _id: legacyDirectory._id, name: '历史目录', parent_id: '' })
  assert.equal((await menuTable.doc(legacyReport._id).get()).data[0].feature_scope, 'platform')

  const { id: productPage } = await rootMenus.create({
    menu_id: 'new_page', name: '新页面', menu_type: 1, url: '/new-page', parent_id: 'custom_ops'
  })
  assert.equal((await menuTable.doc(productPage).get()).data[0].feature_scope, 'product')
  const tenantPage = menuEditorRows.find(row => row.menu_id === 'platform_tenant')
  await rootMenus.update({ _id: tenantPage._id, feature_scope: 'product' })
  const changedPackage = await run('saveProductPackage', 'root', { name: '按页面归属选配', menu_ids: ['platform_tenant'] })
  assert.equal(changedPackage.errCode, 0)
  await rootMenus.update({ _id: tenantPage._id, feature_scope: 'platform' })
  await assert.rejects(run('saveProductPackage', 'root', {
    _id: changedPackage.id, menu_ids: ['platform_tenant']
  }), { errCode: 'TENANT_INVALID' })
})

test('签名用户代管限制租户和权限，绑定操作者与父会话并按时到期', async () => {
  const db = memoryDatabase()
  global.uniCloud = { database: () => db }
  const {
    USER_DELEGATION_PERMISSION, enterUserManagement, exitUserManagement, resolveUserDelegation, recordUserDelegation
  } = require(path.join(root, 'module/admin/user-delegation'))
  const tokenLibrary = { exports: {} }
  const tokenSource = fs.readFileSync(path.resolve(__dirname,
    '../uni_modules/uni-id-common/uniCloud/cloudfunctions/common/uni-id-common/index.js'), 'utf8')
  let timeOffset = 0
  class TokenClock extends Date {
    static now() { return Date.now() + timeOffset }
  }
  vm.runInNewContext(tokenSource, {
    module: tokenLibrary, Buffer, Date: TokenClock,
    require: name => name === 'uni-config-center' ? () => ({ hasFile: () => false }) : require(name),
    uniCloud: { database: () => db, initI18n: () => ({ locale: 'zh-Hans', t: key => key }) }
  })
  const uniIdCommon = tokenLibrary.exports.createInstance({
    clientInfo: { appId: 'test', platform: 'web', locale: 'zh-Hans' },
    config: { tokenSecret: 'test-user-delegation-key', tokenExpiresIn: 604800 }
  })
  const read = 'READ_UNI_ID_USERS'
  const update = 'UPDATE_UNI_ID_USERS'
  await db.collection('ucsdb-admin-menus').add({ menu_id: 'system_user', menu_type: 1, feature_scope: 'product', enable: true })
  for (const permission_id of [read, update, USER_DELEGATION_PERMISSION]) {
    await db.collection('uni-id-permissions').add({ menu_id: 'system_user', permission_id })
  }
  const { id: packageId } = await db.collection('ucsdb-product-packages').add({
    menu_ids: ['system_user']
  })
  const tenant = { _id: 'tenant-a', tenant_no: '00001', name: '企业甲', type: 'enterprise', enabled: true, product_package_ids: [packageId] }
  await db.collection('ucsdb-tenants').add(tenant)
  await db.collection('ucsdb-tenants').add({ ...tenant, _id: 'tenant-b', tenant_no: '00002' })

  const users = db.collection('uni-id-users')
  const roles = db.collection('uni-id-roles')
  for (const [id, role_id, permission] of [
    ['role-operator', 'operator', [read, USER_DELEGATION_PERMISSION]],
    ['role-target', 'target', [read, update]],
    ['role-manager', 'admin', []]
  ]) {
    await roles.add({ _id: id, role_id, tenant_id: tenant._id, menu_ids: ['system_user'], permission })
  }
  for (const user of [
    { _id: 'operator', tenant_id: tenant._id, role: ['operator'] },
    { _id: 'target', tenant_id: tenant._id, role: ['target'] },
    { _id: 'manager', tenant_id: tenant._id, role: ['admin'] },
    { _id: 'other', tenant_id: 'tenant-b' },
    { _id: 'disabled', tenant_id: tenant._id, status: 1 },
    { _id: 'community', tenant_id: tenant._id, account_type: 1 },
    { _id: 'root', tenant_id: '00000', role: ['admin'], is_root: true }
  ]) await users.add({ account_type: 0, ...user })
  const context = async uid => {
    const scope = await resolveTenantScope(db, uid, 'test')
    return {
      loginAdminScope: scope, adminScope: scope,
      authInfo: { uid }, uniIdCommon,
      config: { tokenExpiresThreshold: 259200 },
      platformTokenExpires: Date.now() + 3600000, getUniversalClientInfo: () => ({ appId: 'test' })
    }
  }
  const operator = await context('operator')
  for (const uid of ['operator', 'other', 'disabled', 'community']) {
    await assert.rejects(enterUserManagement.call(operator, { uid }),
      error => ['USER_DELEGATION_FORBIDDEN', 'TENANT_ACCESS_FORBIDDEN'].includes(error.errCode))
  }
  const target = await context('target')
  await assert.rejects(enterUserManagement.call(target, { uid: 'operator' }), { errCode: 'USER_DELEGATION_FORBIDDEN' })
  const managerEntry = await enterUserManagement.call(operator, { uid: 'manager' })
  const managerDelegation = await resolveUserDelegation(operator, managerEntry.userDelegationToken)
  assert.equal(managerDelegation.scope.uid, 'manager')
  assert.equal(managerDelegation.scope.packageAdministrator, false)
  assert.deepEqual([...managerDelegation.scope.permissions].sort(), [...operator.adminScope.permissions].sort())

  await roles.add({ role_id: 'platform-delegator', tenant_id: '00000', permission: [read, USER_DELEGATION_PERMISSION] })
  await users.add({ _id: 'platform-delegator', tenant_id: '00000', account_type: 0, role: ['platform-delegator'], dcloud_appid: ['test'] })
  await users.add({ _id: 'platform-admin', tenant_id: '00000', account_type: 0, role: ['admin'] })
  const platformDelegator = await context('platform-delegator')
  const restrictedEntry = await enterUserManagement.call(platformDelegator, { uid: 'platform-admin' })
  const restrictedDelegation = await resolveUserDelegation(platformDelegator, restrictedEntry.userDelegationToken)
  assert.equal(restrictedDelegation.scope.isAdmin, false)
  assert.deepEqual([...restrictedDelegation.scope.permissions].sort(), [read, USER_DELEGATION_PERMISSION].sort())
  assert.deepEqual([...restrictedDelegation.scope.apps], ['test'])
  const platformAdmin = await context('platform-admin')
  const rootEntry = await enterUserManagement.call(platformAdmin, { uid: 'root' })
  assert.equal((await resolveUserDelegation(platformAdmin, rootEntry.userDelegationToken)).scope.isAdmin, true)
  await assert.rejects(resolveUserDelegation({ ...platformAdmin, adminScope: { ...platformAdmin.adminScope, isAdmin: false } }, rootEntry.userDelegationToken),
    { errCode: 'USER_DELEGATION_INVALID' })

  const { userDelegationId, userDelegationToken, tokenExpired } = await enterUserManagement.call(operator, { uid: 'target' })
  assert.equal(tokenExpired, Math.floor(operator.platformTokenExpires / 1000) * 1000)
  const database = global.uniCloud.database
  let active
  try {
    global.uniCloud.database = () => assert.fail('有效的员工代管令牌无需查询权限')
    active = await resolveUserDelegation(operator, userDelegationToken)
  } finally {
    global.uniCloud.database = database
  }
  assert.equal(active.scope.uid, 'target')
  assert.equal(active.scope.isAdmin, false)
  assert.deepEqual([...active.scope.menuIds], ['system_user'])
  assert.deepEqual([...active.scope.permissions], [read])
  assert.match(active.session._id, /^[a-f0-9]{48}$/)
  assert.equal(active.session._id, userDelegationId)
  assert.equal(active.renewal, undefined)
  await assert.rejects(enterUserManagement.call({ ...operator, adminScope: active.scope }, { uid: 'target' }),
    { errCode: 'USER_DELEGATION_FORBIDDEN' })
  await assert.rejects(resolveUserDelegation(target, userDelegationToken), { errCode: 'USER_DELEGATION_INVALID' })
  await assert.rejects(verifyDelegation(operator, userDelegationToken), { errCode: 'TENANT_SESSION_INVALID' })
  assert.equal((await uniIdCommon.checkToken(userDelegationToken)).errCode, 'uni-id-check-token-failed')
  const parts = userDelegationToken.split('.')
  parts[2] = (parts[2][0] === 'A' ? 'B' : 'A') + parts[2].slice(1)
  await assert.rejects(resolveUserDelegation(operator, parts.join('.')), { errCode: 'USER_DELEGATION_INVALID' })
  await recordUserDelegation(operator, active.session, 'listUsers')
  const [log] = (await db.collection('uni-id-log').where({ operation: 'listUsers' }).get()).data
  assert.equal(log.user_id, 'operator')
  assert.equal(log.target_user_id, 'target')
  assert.equal(log.tenant_id, tenant._id)
  await exitUserManagement.call(operator, { userDelegationToken })
  assert.equal((await resolveUserDelegation(operator, userDelegationToken)).scope.uid, 'target')
  const [exitLog] = (await db.collection('uni-id-log').where({ operation: 'exitUserManagement' }).get()).data
  assert.equal(exitLog.delegation_id, active.session._id)
  const renewedOperator = { ...operator, platformTokenExpires: Date.now() + 7 * 86400000 }
  await roles.doc('role-target').update({ permission: [update] })
  assert.deepEqual([...(await resolveUserDelegation(operator, userDelegationToken)).scope.permissions], [read])
  const { renewal, scope: renewedScope } = await resolveUserDelegation(renewedOperator, userDelegationToken)
  assert.equal(renewal.tokenExpired, Math.floor(renewedOperator.platformTokenExpires / 1000) * 1000)
  assert.deepEqual([...renewedScope.permissions], [])
  const renewed = await resolveUserDelegation(renewedOperator, renewal.userDelegationToken)
  assert.equal(renewed.session._id, userDelegationId)
  assert.deepEqual([...renewed.scope.permissions], [])
  assert.equal(renewed.renewal, undefined)
  await roles.doc('role-target').update({ permission: [read, update] })

  await roles.add({ role_id: 'platform-operator', tenant_id: '00000', permission: [tenantRights.enter] })
  await users.add({ _id: 'platform-operator', tenant_id: '00000', account_type: 0, role: ['platform-operator'] })
  const platformOperator = await context('platform-operator')
  assert.ok(!platformOperator.adminScope.permissions.includes(USER_DELEGATION_PERMISSION))
  const nested = { ...platformOperator,
    adminScope: await enterpriseScope(db, platformOperator.adminScope, tenant, 'tenant-session'),
    tenantDelegationExpires: Date.now() + 1800000 }
  assert.ok(nested.adminScope.permissions.includes(USER_DELEGATION_PERMISSION))
  const { createUserAdmin } = require(path.join(root, 'module/admin/user-admin'))
  const options = await createUserAdmin({
    db: scopedDatabase(db, nested.adminScope), uid: 'platform-operator', appId: 'test'
  }).options()
  assert.equal(options.auth.delegate, true)
  const nestedEntry = await enterUserManagement.call(nested, { uid: 'target' })
  const nestedToken = nestedEntry.userDelegationToken
  assert.equal(nestedEntry.tokenExpired, Math.floor(nested.tenantDelegationExpires / 1000) * 1000)
  const nestedScope = await resolveUserDelegation(nested, nestedToken)
  assert.deepEqual([...nestedScope.scope.permissions].sort(), [read, update].sort())
  assert.equal(nestedScope.scope.packageAdministrator, false)
  await assert.rejects(resolveUserDelegation(platformOperator, nestedToken), { errCode: 'USER_DELEGATION_INVALID' })
  const anotherParent = { ...nested, adminScope: { ...nested.adminScope, sessionId: 'another-session' } }
  await assert.rejects(resolveUserDelegation(anotherParent, nestedToken), { errCode: 'USER_DELEGATION_INVALID' })
  const renewedParent = { ...nested, tenantDelegationExpires: Date.now() + 2700000 }
  const nestedRenewal = (await resolveUserDelegation(renewedParent, nestedToken)).renewal
  assert.equal(nestedRenewal.tokenExpired, Math.floor(renewedParent.tenantDelegationExpires / 1000) * 1000)
  timeOffset = 1801000
  await assert.rejects(resolveUserDelegation(nested, nestedToken), { errCode: 'USER_DELEGATION_INVALID' })
  timeOffset = 0
  await db.collection('uni-id-permissions').where({ permission_id: USER_DELEGATION_PERMISSION }).remove()
  assert.deepEqual([...(await resolveUserDelegation(nested, nestedToken)).scope.permissions].sort(), [read, update].sort())
  await assert.rejects(resolveUserDelegation(renewedParent, nestedToken), { errCode: 'USER_DELEGATION_INVALID' })
  const platform = await context('root')
  const parentWithoutPermission = await enterpriseScope(db, platform.adminScope, tenant, 'root-session')
  await assert.rejects(enterUserManagement.call({ ...platform, adminScope: parentWithoutPermission }, { uid: 'target' }),
    { errCode: 'USER_DELEGATION_FORBIDDEN' })
  const withoutPermission = await createUserAdmin({
    db: scopedDatabase(db, parentWithoutPermission), uid: 'root', appId: 'test'
  }).options()
  assert.equal(withoutPermission.auth.delegate, false)
})

test('应用归属登录租户，版本访问受所属应用限制', async () => {
  const db = memoryDatabase()
  const createAppAdmin = require(path.join(root, 'module/admin/app-admin')).createAppAdmin
  const createVersionAdmin = require(path.join(root, 'module/admin/version-admin')).createVersionAdmin
  const appId = 'platform-app'
  await db.collection('ucsdb-app-list').add({ appid: appId, name: '历史平台应用' })
  const permissions = ['CREATE_OPENDB_APP_LIST', 'READ_OPENDB_APP_VERSIONS', 'CREATE_OPENDB_APP_VERSIONS', 'DELETE_OPENDB_APP_LIST']
  await db.collection('ucsdb-admin-menus').add({ menu_id: 'system_app', menu_type: 1, enable: true })
  for (const permission_id of permissions)
    await db.collection('uni-id-permissions').add({ menu_id: 'system_app', permission_id })
  const { id: packageId } = await db.collection('ucsdb-product-packages')
    .add({ menu_ids: ['system_app'] })
  const entry = async (tenantId, tenantNo) => {
    const tenant = { _id: tenantId, tenant_no: tenantNo, type: 'enterprise', enabled: true, product_package_ids: [packageId] }
    const actor = { uid: tenantId, name: tenantNo, user: {}, tenantAdmin: true }
    const scope = await enterpriseScope(db, actor, tenant)
    assert.ok(scope.permissions.includes('CREATE_OPENDB_APP_LIST'))
    assert.deepEqual((await enterpriseScope(db, actor, tenant, 'delegated')).menuIds, ['system_app'])
    return { uid: tenantId, appId, db: scopedDatabase(db, scope) }
  }
  const a = await entry('enterprise-a', '00001')
  const b = await entry('enterprise-b', '00002')
  const aApps = createAppAdmin({ ...a, referenceDb: db })
  const bApps = createAppAdmin({ ...b, referenceDb: db })
  const saved = await aApps.save({ appid: 'enterprise-app', name: '企业应用', tenant_id: 'enterprise-b' })
  const [app] = (await aApps.list()).data
  assert.equal(app.tenant_id, a.uid)
  assert.equal(app.tenant_no, '00001')
  assert.deepEqual((await bApps.list()).data, [])
  assert.deepEqual((await b.db.appCatalog({}).get()).data.map(row => row.appid), [appId])
  assert.deepEqual((await a.db.appCatalog({}).get()).data.map(row => row.appid), [appId, 'enterprise-app'])
  await assert.rejects(bApps.remove({ _id: saved.id }), { errCode: 'APP_ADMIN_NOT_FOUND' })
  const aVersions = createVersionAdmin({ ...a, versionDb: db })
  const bVersions = createVersionAdmin({ ...b, versionDb: db })
  const version = { appid: app.appid, version: '1.0.0', platform: ['Android'], type: 'native_app',
    contents: '首次发布', url: 'https://example.com/app.apk' }
  await aVersions.save(version)
  const [stored] = (await db.collection('ucsdb-app-versions').where({ appid: app.appid }).get()).data
  assert.equal(stored.tenant_id, undefined)
  await assert.rejects(bVersions.list({ appid: app.appid }), { errMsg: '应用不存在或已被删除' })
  await assert.rejects(aApps.remove({ _id: saved.id }), { errMsg: '应用存在版本记录，不能删除' })
})

test('历史数据迁移保留 ID，预览不写入，禁止改写已有租户归属', async () => {
  const db = memoryDatabase()
  const users = db.collection('uni-id-users')
  await users.add({ _id: 'legacy', username: 'admin' })
  const input = { assignments: [{ collection: 'uni-id-users', id: 'legacy', tenant_id: '00000' }], actor: { uid: 'root', name: '平台管理员' } }
  const [row] = await migrateTenantRecords(db, input)
  assert.equal(row.alreadyAssigned, false)
  assert.equal((await users.doc('legacy').get()).data[0].tenant_id, undefined)
  await migrateTenantRecords(db, { ...input, preview: false })
  const saved = (await users.doc('legacy').get()).data[0]
  assert.equal(saved._id, 'legacy')
  assert.equal(saved.tenant_id, '00000')
  assert.equal(saved.update_id, 'root')
  await assert.rejects(migrateTenantRecords(db, { ...input, assignments: [{ ...input.assignments[0], tenant_id: 'other' }] }), /已有其他租户归属/)
})
