const { dbCmd, userCollection } = require('../../common/constants')
const { PLATFORM_TENANT_ID } = require('../../lib/utils/platform-tenant')
const { ACCOUNT_TYPE } = require('../admin/account-types')

// 登录前可调用，仅返回注册入口状态；实际注册仍由 registerAdmin 再次校验。
module.exports = async function () {
  const { data } = await userCollection.where({
    tenant_id: PLATFORM_TENANT_ID, account_type: ACCOUNT_TYPE.SYSTEM, role: dbCmd.in(['admin'])
  }).field({ _id: true }).limit(1).get()
  return { errCode: 0, canRegisterAdmin: data.length === 0 }
}
