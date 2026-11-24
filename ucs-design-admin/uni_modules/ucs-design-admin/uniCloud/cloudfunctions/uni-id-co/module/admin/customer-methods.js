const { updateFields } = require('../../lib/utils/record-metadata')
const updateUser = require('./update-user')
const { createUserAdmin } = require('./user-admin')
const { ACCOUNT_TYPE, hasAccountType } = require('./account-types')
const { mutateIdentity } = require('../../lib/utils/identity-lifecycle')

async function setCustomerStatus(params = {}) {
  if (Object.keys(params).some(key => !['uid', 'status'].includes(key)) ||
    typeof params.uid !== 'string' || ![0, 1].includes(params.status))
    throw { errCode: 'USER_ADMIN_INVALID', errMsg: '请选择有效的社区用户和账号状态' }
  const db = this.adminDb
  const admin = createUserAdmin({ db, uid: this.authInfo.uid, appId: this.getUniversalClientInfo().appId, accountType: 1 })
  const auth = await admin.authorize('status')
  await mutateIdentity(db, params.uid, async user => {
    if (!hasAccountType(user, ACCOUNT_TYPE.COMMUNITY)) throw { errCode: 'USER_ADMIN_FORBIDDEN', errMsg: '该账号不属于社区用户管理范围' }
    await admin.validateChange({ uid: params.uid, status: params.status }, user, auth)
    const now = Date.now()
    return { status: params.status, token: [], valid_token_date: now, ...updateFields(auth, now) }
  })
  return { errCode: 0 }
}

const update = (fields) => async function (params = {}) {
  if (!params || typeof params !== 'object' || Array.isArray(params) ||
    Object.keys(params).some(key => !fields.includes(key))) {
    throw { errCode: 'USER_ADMIN_INVALID', errMsg: '社区用户管理不支持修改这些字段' }
  }
  if (this.getMethodName() === 'setCustomerStatus' && ![0, 1].includes(params.status)) {
    throw { errCode: 'USER_ADMIN_INVALID', errMsg: '请选择禁用或恢复正常' }
  }
  return updateUser.call(this, params)
}

module.exports = {
  listCustomers: require('./list-users'),
  getCustomerOptions: require('./get-user-options'),
  getCustomerDetail: require('./get-user-detail'),
  updateCustomer: update(['uid', 'avatar', 'nickname', 'gender', 'mobile', 'email', 'tags']),
  setCustomerStatus
}
