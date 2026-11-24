const { ACCOUNT_TYPE, hasAccountType } = require('../../module/admin/account-types')
const { assertRootChange } = require('../../module/admin/root-admin')
const fail = (errMsg, errCode = 'ACCOUNT_IDENTITY_INVALID') => { throw { errCode, errMsg } }

// Single-document transactions keep concurrent changes from overwriting identities.
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

async function closeCustomer(db, uid) {
  await mutateIdentity(db, uid, user => {
    if ((user.status || 0) !== 0 || !hasAccountType(user, ACCOUNT_TYPE.COMMUNITY)) fail('当前账号没有可注销的社区身份')
    const now = Date.now()
    return { status: 4, role: [], token: [], valid_token_date: now, customer_closed_date: now }
  })
  return { errCode: 0, account_type: ACCOUNT_TYPE.COMMUNITY, accountClosed: true, canEnterManagement: false }
}
module.exports = { mutateIdentity, closeCustomer }
