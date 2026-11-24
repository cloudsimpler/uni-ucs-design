const { ACCOUNT_TYPE } = require('../../module/admin/account-types')
const { tenantWhere } = require('../../module/admin/tenant-scope')
const { TENANTS } = require('./platform-tenant')
const { setTimeout: delay } = require('node:timers/promises')

async function lockTenant(db, tenantId) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const transaction = await db.startTransaction()
    let lock
    try {
      // Serialize system mobile writes for the tenant, including writes for new users.
      lock = await transaction.collection(TENANTS).doc(tenantId)
        .update({ system_mobile_revision: db.command.inc(1) })
    } catch (error) {
      await transaction.rollback().catch(() => {})
      // Retrying here is safe because the user record has not been written.
      if (attempt === 2) throw error
      await delay(60 * (attempt + 1))
      continue
    }
    if (lock.updated) return transaction
    await transaction.rollback().catch(() => {})
    throw { errCode: 'TENANT_NOT_FOUND', errMsg: '租户不存在' }
  }
}

async function writeSystemMobile({ db, tenantId, mobile, uid }, write) {
  const transaction = await lockTenant(db, tenantId)
  try {
    const command = db.command
    const filters = [
      tenantWhere(db, tenantId),
      { mobile },
      { account_type: ACCOUNT_TYPE.SYSTEM }
    ]
    if (uid) filters.push({ _id: command.neq(uid) })
    const { data } = await db.collection('uni-id-users').where(command.and(filters)).limit(1).get()
    if (data.length) throw { errCode: 'SYSTEM_MOBILE_EXISTS', errMsg: '该手机号已被当前租户的其他系统用户使用' }

    const result = await write(transaction.collection('uni-id-users'))
    await transaction.commit()
    return result
  } catch (error) {
    await transaction.rollback().catch(() => {})
    throw error
  }
}

module.exports = { writeSystemMobile }
