const { updateFields } = require('../../lib/utils/record-metadata')
const { mutateIdentity } = require('../../lib/utils/identity-lifecycle')
const { createUserAdmin } = require('./user-admin')
const { ACCOUNT_TYPE, managementType } = require('./account-types')

module.exports = async function (params = {}) {
  if (!params || typeof params !== 'object' || Array.isArray(params) ||
    Object.keys(params).some(key => !['uid', 'status'].includes(key)) ||
    typeof params.uid !== 'string' || !params.uid || params.uid.length > 100 || ![0, 1].includes(params.status))
    throw { errCode: 'USER_ADMIN_INVALID', errMsg: '请选择有效的用户和账号状态' }

  const { uid, status } = params
  const db = this.adminDb
  const accountType = managementType(this)
  const admin = createUserAdmin({ db, uid: this.authInfo.uid, appId: this.getUniversalClientInfo().appId, accountType })
  const auth = await admin.authorize(accountType === ACCOUNT_TYPE.COMMUNITY ? 'status' : 'update')
  if (uid === this.loginAdminScope?.uid)
    throw { errCode: 'USER_ADMIN_FORBIDDEN', errMsg: '不能禁用或恢复当前登录账号' }
  await mutateIdentity(db, uid, async user => {
    await admin.validateChange({ uid, status }, user, auth, { statusAction: true })
    if (status === (user.status || 0)) return {}
    const now = Date.now()
    return { status, token: [], valid_token_date: now, ...updateFields(auth, now) }
  })
  return { errCode: 0 }
}
