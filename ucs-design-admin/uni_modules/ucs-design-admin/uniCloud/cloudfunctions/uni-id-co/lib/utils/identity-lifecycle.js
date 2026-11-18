const { accountTypeOf, hasManagementIdentity, hasAccountType } = require('../../module/admin/account-types')
const { assertRootChange } = require('../../module/admin/root-admin')
const fail = (errMsg, errCode = 'ACCOUNT_IDENTITY_INVALID') => { throw { errCode, errMsg } }

// Single-document transactions keep concurrent enrollment/removal from overwriting identities.
async function mutateIdentity(db, uid, mutate) {
  const transaction = await db.startTransaction()
  try {
    const collection = transaction.collection('uni-id-users')
    const result = await collection.doc(uid).get()
    const user = Array.isArray(result.data) ? result.data[0] : result.data
    if (!user) fail('账号不存在')
    const patch = await mutate(user)
    assertRootChange(user, patch)
    if (Object.keys(patch).length) await collection.doc(uid).update(patch)
    await transaction.commit()
    return { ...user, ...patch }
  } catch (error) {
    await transaction.rollback().catch(() => {})
    throw error
  }
}

async function enrollCustomer(context, uid, { confirmed = false, contact } = {}) {
  return mutateIdentity(uniCloud.database(), uid, user => {
    if ((user.status || 0) !== 0) fail('账号已停用或注销，不能重新开通')
    require('./account-policy').assertAppAuthorization(context, user)
    if (contact && Object.entries(contact).some(([key, value]) => user[key] !== value || user[`${key}_confirmed`] !== 1))
      fail('联系方式已变化，请重新验证')
    if (hasAccountType(user, 1)) return {}
    if (!confirmed) fail('请确认开通社区身份', 'CUSTOMER_ENROLLMENT_REQUIRED')
    return { account_type: [...accountTypeOf(user), 1].sort(), customer_enrolled_date: Date.now() }
  })
}

async function closeCustomer(db, uid) {
  const user = await mutateIdentity(db, uid, user => {
    if ((user.status || 0) !== 0 || !hasAccountType(user, 1)) fail('当前账号没有可注销的社区身份')
    const remaining = accountTypeOf(user).filter(type => type !== 1)
    return remaining.length
      ? { account_type: remaining, customer_closed_date: Date.now() }
      : { account_type: [1], status: 4, role: [], token: [], valid_token_date: Date.now(), customer_closed_date: Date.now() }
  })
  return { errCode: 0, account_type: accountTypeOf(user), accountClosed: user.status === 4,
    canEnterManagement: (user.status || 0) === 0 && hasManagementIdentity(user) }
}
module.exports = { mutateIdentity, enrollCustomer, closeCustomer }
