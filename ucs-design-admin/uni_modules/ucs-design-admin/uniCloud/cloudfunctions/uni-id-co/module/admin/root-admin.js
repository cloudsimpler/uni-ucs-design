const { hasAccountType } = require('./account-types')
const { writeSystemMobile } = require('../../lib/utils/system-mobile')
const { ownerOf } = require('./tenant-scope')
const fail = (errMsg) => { throw { errCode: 'USER_ADMIN_FORBIDDEN', errMsg } }
function rejectRootInput(params) {
  if (Object.hasOwn(params, 'is_root')) fail('初始管理员标记只能由系统设置')
}
function assertRootChange(user, patch) {
  rejectRootInput(patch)
  if (!user?.is_root) return
  if (patch.mobile !== undefined || patch.email !== undefined) fail('初始化管理员不支持修改手机号或邮箱')
  if (patch.account_type !== undefined && !hasAccountType(patch, 0)) fail('初始管理员必须保留系统身份')
  if (patch.status !== undefined && patch.status !== 0) fail('初始管理员不能禁用或注销')
  if (patch.role !== undefined && (!Array.isArray(patch.role) || !patch.role.includes('admin'))) fail('初始管理员必须保留超级管理员角色')
  if (patch.dcloud_appid !== undefined) {
    const apps = patch.dcloud_appid, old = user.dcloud_appid
    if (!Array.isArray(apps) || (!apps.includes('*') && (old == null || old.includes('*') || old.some(id => !apps.includes(id)))))
      fail('初始管理员不能取消已有应用的登录授权')
  }
}

// One-time upgrade explicitly selects the existing admin operations account.
// After marking it, renaming the account never changes its protected identity.
async function initializeLegacyRoot(db, appId) {
  const users = db.collection('uni-id-users')
  const existing = await users.where({ is_root: true }).limit(1).get()
  if (existing.data.length) return existing.data[0]
  const candidates = await users.where({ username: 'admin', account_type: 0 }).limit(2).get()
  if (!candidates.data.length) return null // Fresh installations use registerAdmin.
  if (candidates.data.length !== 1) fail('初始管理员账号不唯一，请检查数据')
  const transaction = await db.startTransaction()
  try {
    const collection = transaction.collection('uni-id-users')
    const { data } = await collection.doc(candidates.data[0]._id).get()
    const user = Array.isArray(data) ? data[0] : data
    if (!user || user.username !== 'admin' || !hasAccountType(user, 0) || !user.role?.includes('admin') ||
      (user.status || 0) !== 0 || (user.dcloud_appid != null && !user.dcloud_appid.includes('*') && !user.dcloud_appid.includes(appId)))
      fail('指定的初始管理员必须是可正常登录后台的系统超级管理员')
    await collection.doc(user._id).update({ is_root: true })
    await transaction.commit()
    return { ...user, is_root: true }
  } catch (error) {
    await transaction.rollback().catch(() => {})
    // A concurrent initialization of the same account is already sufficient.
    const { data } = await users.where({ is_root: true }).limit(1).get()
    if (data.length) return data[0]
    throw error
  }
}

async function updateRootAware({ db, uid, data, current }) {
  const users = db.collection('uni-id-users')
  let user = current || (await users.doc(uid).get()).data[0]
  if (!user) fail('账号不存在或已被删除')
  if (!user.is_root && (!user.tenant_id || user.tenant_id === '00000') && user.username === 'admin' && hasAccountType(user, 0)) {
    const root = await initializeLegacyRoot(db, user.dcloud_appid?.find(id => id !== '*'))
    if (root?._id === uid) user = root
  }
  const patch = typeof data === 'function' ? data(user) : data
  assertRootChange(user, patch)
  if (patch.mobile && hasAccountType(user, 0)) {
    const tenantId = ownerOf(user)
    return writeSystemMobile({ db: uniCloud.database(), tenantId, mobile: patch.mobile, uid }, async users => {
      const ref = users.doc(uid)
      const { data } = await ref.get()
      const latest = Array.isArray(data) ? data[0] : data
      if (!latest || ownerOf(latest) !== tenantId) fail('账号不存在或已被删除')
      assertRootChange(latest, patch)
      return ref.update(db.tenantActor ? { ...patch, tenant_id: tenantId } : patch)
    })
  }
  // Avoid overwriting a root promotion made between the read and the write.
  const result = await users.where({ _id: uid, is_root: user.is_root === true ? true : db.command.neq(true) }).update(patch)
  if (!result.updated) {
    const latest = (await users.doc(uid).get()).data[0]
    if (!latest || Boolean(latest.is_root) !== Boolean(user.is_root)) fail('账号保护状态已更新，请刷新后重试')
  }
  return result
}
module.exports = { rejectRootInput, assertRootChange, initializeLegacyRoot, updateRootAware }
