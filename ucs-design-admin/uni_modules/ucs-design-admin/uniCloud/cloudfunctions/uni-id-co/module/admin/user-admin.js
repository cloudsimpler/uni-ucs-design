const { ACCOUNT_TYPE, accountTypeOf, hasManagementIdentity, hasAccountType } = require('./account-types')
const { rejectRootInput, assertRootChange, initializeLegacyRoot } = require('./root-admin')
const { canEnter } = require('./user-delegation')
const { PLATFORM_TENANT_ID } = require('../../lib/utils/platform-tenant')
const fail = (errMsg, errCode = 'USER_ADMIN_INVALID') => {
  throw { errCode, errMsg }
}
const equalSet = (a = [], b = []) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort())
// Historical accounts without dcloud_appid allow all apps; an empty array allows none.
const equalApps = (a, b) => (Array.isArray(a) && Array.isArray(b) ? equalSet(a, b) : a === b)
const allowsApp = (apps, appId) => apps == null || (Array.isArray(apps) && (apps.includes('*') || apps.includes(appId)))
const { actorName, updateFields } = require('../../lib/utils/record-metadata')

const fields = Object.fromEntries(
  [
    '_id',
    'user_no',
    'is_root',
    'account_type',
    'username',
    'nickname',
    'avatar',
    'gender',
    'department_id',
    'mobile',
    'email',
    'role',
    'tags',
    'status',
    'dcloud_appid',
    'register_date',
    'last_login_date',
    'last_login_ip'
  ].map((key) => [key, true])
)

function createUserAdmin({ db, uid, appId, accountType = ACCOUNT_TYPE.EMPLOYEE }) {
  if (![ACCOUNT_TYPE.DEVELOPER, ACCOUNT_TYPE.EMPLOYEE, ACCOUNT_TYPE.CLIENT].includes(accountType)) fail('账号管理类型不正确')
  const customer = accountType === ACCOUNT_TYPE.CLIENT
  const suffix = customer ? 'UNI_ID_CUSTOMERS' : 'UNI_ID_USERS'
  const assertAccountType = (user) => {
    if (user && !hasAccountType(user, accountType)) fail('该账号不属于当前管理范围', 'USER_ADMIN_FORBIDDEN')
  }
  const cmd = db.command
  const users = db.collection('uni-id-users')
  const getUser = async (id) => {
    const { data } = await users.doc(id).get()
    return Array.isArray(data) ? data[0] : data
  }
  const all = async (name, where = {}, projection) => {
    const result = []
    for (let offset = 0; offset < 5000; offset += 100) {
      const source = name === 'ucsdb-app-list' && db.appCatalog ? db.appCatalog(where) : db.collection(name).where(where)
      let query = source.orderBy('_id', 'asc').skip(offset).limit(100)
      if (projection) query = query.field(projection)
      const { data } = await query.get()
      result.push(...data)
      if (data.length < 100) return result
    }
    fail('选项超过 5000 条，请联系管理员整理数据')
  }
  const authorize = async (write = false) => {
    if (!uid) fail('请先登录', 'USER_ADMIN_UNAUTHORIZED')
    const scope = db.tenantActor
    const user = scope?.user || await getUser(uid)
    if (!user || !hasManagementIdentity(user) || (user.status || 0) !== 0 || !allowsApp(user.dcloud_appid, appId))
      fail('当前账号已停用或无权登录此应用', 'USER_ADMIN_FORBIDDEN')
    const tenantId = scope?.tenantId ?? user.tenant_id ?? PLATFORM_TENANT_ID
    const isPlatform = tenantId === PLATFORM_TENANT_ID
    const isAdmin = scope ? scope.isAdmin : isPlatform && (user.role || []).includes('admin')
    if (!scope && isAdmin && !user.is_root) await initializeLegacyRoot(db, appId)
    const roles = !scope && !isAdmin && user.role?.length ? await all('uni-id-roles', { tenant_id: tenantId, role_id: cmd.in(user.role) }) : []
    const permissions = scope?.permissions || [...new Set(roles.flatMap(role => role.permission || []))]
    const auth = { uid, name: scope?.name ?? actorName(user), isAdmin, isPlatform, permissions,
      canManageAdmin: isAdmin || (!isPlatform && scope?.packageAdministrator === true),
      apps: scope ? scope.apps : user.dcloud_appid, menuIds: scope?.menuIds || [...new Set(roles.flatMap(role => role.menu_ids || []))],
      create: isAdmin || permissions.includes(`CREATE_${suffix}`),
      update: isAdmin || permissions.includes(`UPDATE_${suffix}`),
      delete: isAdmin || permissions.includes(`DELETE_${suffix}`),
      assignRoles: !customer && (isAdmin || permissions.includes('ASSIGN_UNI_ID_USER_ROLES')),
      resetPassword: isAdmin || permissions.includes(`RESET_PASSWORD_${suffix}`) }
    if (customer) {
      auth.create = auth.delete = auth.resetPassword = false
      auth.status = isAdmin || permissions.includes('UPDATE_CUSTOMER_STATUS')
    }
    auth.delegate = !customer && Boolean(canEnter(scope))
    const action = write === true ? 'update' : write
    if (action ? !auth[action] : !isAdmin && !permissions.includes(`READ_${suffix}`))
      fail('没有此项用户管理权限', 'USER_ADMIN_FORBIDDEN')
    return auth
  }
  const validateChange = async (params, old, authorized) => {
    rejectRootInput(params)
    if (Object.prototype.hasOwnProperty.call(params, 'id_card')) fail('已移除身份证号字段，不支持录入')
    if (params.user_no !== undefined) fail('UID由系统分配，不允许修改')
    if (params.account_type !== undefined) fail('账号类型由管理入口指定，不允许修改')
    if (customer) {
      if (!params.uid) fail('客户账号请通过客户端注册')
      const allowed = ['uid', 'avatar', 'nickname', 'gender', 'mobile', 'email', 'tags', 'status']
      if (Object.keys(params).some(key => !allowed.includes(key))) fail('客户管理仅支持修改基础资料和账号状态')
      if (params.status !== undefined && ![0, 1].includes(params.status)) fail('客户管理仅支持禁用或恢复正常')
      if (params.status !== undefined && old && ![0, 1].includes(old.status || 0)) fail('此账号状态不支持在客户管理中恢复')
    }
    const resetOnly = params.password !== undefined && Object.keys(params).every(key => ['uid', 'password'].includes(key))
    const auth = authorized || await authorize(params.uid ? (resetOnly ? 'resetPassword' : 'update') : 'create')
    if ((old?.role?.includes('admin') || Array.isArray(params.role) && params.role.includes('admin')) && !auth.canManageAdmin)
      fail('没有维护管理员账号或授予管理员角色的权限', 'USER_ADMIN_FORBIDDEN')
    if (params.uid && params.password !== undefined && !auth.resetPassword) fail('没有重置密码权限', 'USER_ADMIN_FORBIDDEN')
    if (params.uid && !old) fail('用户不存在或已被删除', 'USER_ADMIN_NOT_FOUND')
    assertAccountType(old)
    if (old) assertRootChange(old, { role: params.role, status: params.status, dcloud_appid: params.authorizedApp, mobile: params.mobile, email: params.email })
    if (!customer && params.status !== undefined) fail('系统用户管理不能修改账号状态')
    if (params.status !== undefined && old?._id === uid) fail('不能禁用或恢复当前登录账号')
    for (const [key, max] of Object.entries({ username: 80, nickname: 100, mobile: 20, email: 100, password: 64 })) {
      if (params[key] !== undefined && (typeof params[key] !== 'string' || params[key].length > max))
        fail('账号资料或密码长度不正确')
    }
    if ((!params.uid || (accountType !== ACCOUNT_TYPE.EMPLOYEE && params.nickname !== undefined)) && !params.nickname?.trim()) fail('请输入昵称')
    if (!params.uid || accountType === ACCOUNT_TYPE.EMPLOYEE) {
      // Partial actions (avatar upload, password reset, status changes) omit profile fields.
      if ((!params.uid || params.gender !== undefined) && !(old?.is_root && params.gender === 0) && ![1, 2].includes(params.gender)) fail('请选择男或女')
    }
    if (params.mobile && !/^1\d{10}$/.test(params.mobile)) fail('请输入有效的 11 位手机号')
    if (params.status !== undefined && (!Number.isInteger(params.status) || params.status < 0 || params.status > 4))
      fail('用户状态不正确')
    if (params.gender !== undefined && ![0, 1, 2].includes(params.gender)) fail('性别不正确')
    if (params.avatar !== undefined && (typeof params.avatar !== 'string' || params.avatar.length > 2048 ||
      (params.avatar !== '' && !/^(https?:\/\/|cloud:\/\/)[^\s]+$/i.test(params.avatar)))) fail('头像文件地址无效，请重新上传图片')
    for (const key of ['role', 'tags', 'authorizedApp', 'department_id']) {
      const value = params[key]
      if (
        value !== undefined &&
        (!Array.isArray(value) ||
          value.length > 100 ||
          value.some((x) => typeof x !== 'string' || !x.trim() || x.length > 100))
      )
        fail('角色、标签、部门或应用授权格式不正确')
    }
    if (params.role !== undefined && !equalSet(params.role, old?.role)) {
      if (!auth.assignRoles) fail('没有绑定角色权限', 'USER_ADMIN_FORBIDDEN')
      const roleIds = [...new Set(params.role.filter(id => !auth.isPlatform || id !== 'admin'))]
      if (roleIds.length && (await all('uni-id-roles', { role_id: cmd.in(roleIds) }, { role_id: true })).length !== roleIds.length)
        fail('所选角色已不存在，请刷新后重新选择')
    }
    if (params.tags !== undefined) {
      const tagIds = [...new Set(params.tags)]
      if (tagIds.length && (await all('uni-id-tag', { tagid: cmd.in(tagIds) })).length !== tagIds.length)
        fail('所选标签已不存在，请刷新后重新选择')
    }
    if (params.department_id !== undefined) {
      if (params.department_id.length > 1) fail('所属部门只能选择一个')
      const ids = [...new Set(params.department_id)]
      if (ids.length && (await all('ucsdb-department', { _id: cmd.in(ids) })).length !== ids.length)
        fail('所选部门已不存在，请刷新后重新选择')
      if (ids.length && !(old?.department_id || []).includes(ids[0]) && !require('./department-admin').effectiveEnabled(await all('ucsdb-department'), ids[0])) fail('所选部门或上级部门已停用')
    }
    if (params.authorizedApp !== undefined) {
      const ids = [...new Set(params.authorizedApp.filter(id => id !== '*' && id !== appId && !(old?.dcloud_appid || []).includes(id)))];
      if (ids.length && (await all('ucsdb-app-list', { appid: cmd.in(ids) })).length !== ids.length)
        fail('所选应用已不存在，请刷新后重新选择');
    }
    if (!auth.isAdmin) {
      if (params.authorizedApp !== undefined && !equalApps(params.authorizedApp, old?.dcloud_appid)) {
        if (auth.apps != null && !auth.apps.includes('*') && params.authorizedApp.some(id => !auth.apps.includes(id)))
          fail('不能授予本人未获授权的应用', 'USER_ADMIN_FORBIDDEN')
      }
    }
    if (!old) return
    if (old._id === uid && params.password !== undefined)
      fail('请通过个人账号的修改密码功能修改自己的密码')
    assertRootChange(old, { role: params.role, status: params.status, dcloud_appid: params.authorizedApp })
  }
  const sessionChanged = (params, old) =>
    Boolean(params.password) ||
    (params.status !== undefined && params.status !== (old.status || 0)) ||
    (params.role !== undefined && !equalSet(params.role, old.role)) ||
    (params.authorizedApp !== undefined && !equalApps(params.authorizedApp, old.dcloud_appid))

  return {
    authorize,
    getUser,
    validateChange,
    sessionChanged,
    async removeAccount({ uid: targetId } = {}) {
      if (typeof targetId !== 'string' || !targetId || targetId.length > 100) fail('用户 ID 不正确')
      const auth = await authorize('delete')
      if (targetId === uid) fail('不能删除当前登录的账号', 'USER_ADMIN_FORBIDDEN')
      if (accountType === 0 && (await all('ucsdb-department', { manager_uid: targetId })).length) fail('该用户是部门负责人，请先更换负责人')
      const transaction = await db.startTransaction()
      try {
        const target = transaction.collection('uni-id-users').doc(targetId)
        const { data } = await target.get()
        const user = Array.isArray(data) ? data[0] : data
        if (!user) fail('账号不存在或已被删除', 'USER_ADMIN_NOT_FOUND')
        assertAccountType(user)
        if (user.is_root) fail('初始超级管理员不可删除', 'USER_ADMIN_FORBIDDEN')
        const result = await target.remove()
        if (!result.deleted) fail('账号不存在或已被删除', 'USER_ADMIN_NOT_FOUND')
        await transaction.commit()
        return { errCode: 0, deleted: true }
      } catch (error) {
        await transaction.rollback().catch(() => {})
        throw error
      }
    },
    async detail({ uid: targetId } = {}) {
      const auth = await authorize()
      if (typeof targetId !== 'string' || !targetId || targetId.length > 100) fail('用户 ID 不正确')
      const user = await getUser(targetId)
      if (!user) fail('用户不存在或已被删除', 'USER_ADMIN_NOT_FOUND')
      assertAccountType(user)
      const allowed = [...Object.keys(fields), 'avatar', 'gender', 'comment', 'register_ip', 'mobile_confirmed', 'email_confirmed', 'my_invite_code', 'inviter_uid', 'invite_time']
      const data = Object.fromEntries(allowed.filter(key => user[key] !== undefined).map(key => [key, user[key]]))
      data.account_type = accountTypeOf(user)
      data.realname = {
        status: user.realname_auth?.auth_status ?? 0,
        type: user.realname_auth?.type,
        date: user.realname_auth?.auth_date
      }
      const bound = value => typeof value === 'string' ? Boolean(value.trim()) : Boolean(value && Object.values(value).some(Boolean))
      data.bindings = [
        { name: '微信', bound: bound(user.wx_openid) || bound(user.wx_unionid) },
        { name: '支付宝', bound: bound(user.ali_openid) },
        { name: 'Apple', bound: bound(user.apple_openid) },
        { name: 'QQ', bound: bound(user.qq_openid) || bound(user.qq_unionid) }
      ]
      const roleIds = customer ? [] : (user.role || []).filter(id => !auth.isPlatform || id !== 'admin')
      const roles = roleIds.length ? await all('uni-id-roles', { role_id: cmd.in(roleIds) }, { role_id: true, role_name: true, permission: true }) : []
      data.roleDetails = (customer ? [] : user.role || []).map(id => {
        if (id === 'admin' && auth.isPlatform) return { role_id: id, role_name: '超级管理员', permission: [], allPermissions: true }
        const role = roles.find(item => item.role_id === id)
        return role ? { ...role, packagePermissions: id === 'admin' }
          : { role_id: id, role_name: id, permission: [], missing: true }
      })
      const logPermission = customer ? 'READ_CUSTOMER_LOG' : 'READ_UNI_ID_LOG'
      const logsAllowed = auth.isAdmin || auth.permissions.includes(logPermission)
      let logs = [], logsError = ''
      if (logsAllowed) {
        try {
          const result = await db.collection('uni-id-log').where({ user_id: targetId, type: cmd.neq('user-delegation') })
            .field({ _id: true, create_date: true, type: true, ip: true, state: true, appid: true })
            .orderBy('create_date', 'desc').limit(20).get()
          logs = result.data
        } catch { logsError = '登录日志加载失败，请刷新重试' }
      }
      return { errCode: 0, data, auth, logsAllowed, logs, logsError }
    },
    async list({ current = 1, size = 20, keyword = '', status = '', role = '', department_id = '' } = {}) {
      const auth = await authorize()
      if (
        !Number.isInteger(current) ||
        current < 1 ||
        current > 100000 ||
        !Number.isInteger(size) ||
        size < 1 ||
        size > 100
      )
        fail('分页参数不正确')
      if (typeof keyword !== 'string' || keyword.length > 80 || typeof role !== 'string' || role.length > 100)
        fail('筛选条件不正确')
      const filters = [{ account_type: accountType }]
      if (keyword.trim()) {
        const regex = new RegExp(keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
        const searchFields = customer ? ['user_no', 'mobile'] : ['username', 'nickname', 'mobile']
        filters.push(cmd.or(searchFields.map((key) => ({ [key]: key === 'username' ? new RegExp(regex.source) : regex }))))
      }
      if (status !== '') {
        if (!Number.isInteger(status) || status < 0 || status > 4) fail('用户状态不正确')
        filters.push(status === 0 ? cmd.or([{ status: 0 }, { status: cmd.exists(false) }]) : { status })
      }
      if (typeof department_id !== 'string' || department_id.length > 100) fail('部门筛选参数不正确')
      if (department_id && !customer) {
        const departments = await all('ucsdb-department')
        if (!departments.some(row => row._id === department_id)) fail('所选部门不存在，请刷新')
        const ids = new Set([department_id]); let changed = true
        while (changed) { changed = false; for (const row of departments) if (ids.has(row.parent_id) && !ids.has(row._id)) { ids.add(row._id); changed = true } }
        filters.push({ department_id: cmd.in([...ids]) })
      }
      if (role) filters.push({ role })
      const where = filters.length ? cmd.and(filters) : {}
      const count = (await users.where(where).count()).total
      const page = Math.min(current, Math.max(1, Math.ceil(count / size)))
      const { data } = await users
        .where(where)
        .field(fields)
        .orderBy('register_date', 'desc')
        .orderBy('_id', 'asc')
        .skip((page - 1) * size)
        .limit(size)
        .get()
      return { errCode: 0, data: data.map(user => ({ ...user, account_type: accountTypeOf(user) })), pagination: { current: page, size, count }, auth }
    },
    async options() {
      const auth = await authorize()
      if (customer) {
        const [tags, apps] = await Promise.all([
          all('uni-id-tag', {}, { tagid: true, name: true }),
          all('ucsdb-app-list', {}, { appid: true, name: true })
        ])
        return { errCode: 0, auth, roles: [], tags, apps, departments: [] }
      }
      const [roles, tags, apps, departments] = await Promise.all([
        all('uni-id-roles', {}, { role_id: true, role_name: true }),
        all('uni-id-tag', {}, { tagid: true, name: true }),
        all('ucsdb-app-list', {}, { appid: true, name: true }),
        all('ucsdb-department', {}, { _id: true, name: true, parent_id: true, sort: true, enabled: true })
      ])
      return {
        errCode: 0,
        auth,
        roles: auth.isPlatform
          ? [...(auth.isAdmin ? [{ role_id: 'admin', role_name: '超级管理员' }] : []), ...roles.filter(role => role.role_id !== 'admin')]
          : roles.map(role => ({ ...role, assignable: role.role_id !== 'admin' || auth.canManageAdmin })),
        tags,
        apps,
        departments
      }
    }
  }
}
module.exports = { createUserAdmin }
