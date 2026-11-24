const { accountTypeOf } = require('../../module/admin/account-types')
const { isMatchUserApp } = require('../../common/utils')
// The invoked server method fixes the account scope; neither AppID nor request fields choose it.
const adminMethods = new Set([
  'registerAdmin', 'adminLogin', 'adminLoginBySms', 'adminLoginByEmailCode',
  'adminCompleteAccountLogin', 'adminBeginAccountRecovery', 'adminCompleteAccountRecovery'
])
const accountEntry = context => adminMethods.has(context.getMethodName()) ? 'admin' : 'client'
const allowedAccountTypes = context => accountEntry(context) === 'admin' ? [0] : [1]
const assertAppAuthorization = (context, user) => {
  if (!isMatchUserApp(user.dcloud_appid, context.getUniversalClientInfo().appId))
    throw { errCode: 'ACCOUNT_ENTRY_FORBIDDEN', errMsg: '该账号未获得当前应用的登录授权' }
}
const canEnter = (context, user) => allowedAccountTypes(context).includes(accountTypeOf(user)) &&
  isMatchUserApp(user.dcloud_appid, context.getUniversalClientInfo().appId)
const assertEntry = (context, user) => {
  if (!canEnter(context, user)) throw { errCode: 'ACCOUNT_ENTRY_FORBIDDEN', errMsg: '该账号不能登录当前入口' }
}
const registrationType = context => context.getMethodName() === 'registerAdmin' ? 0 : 1
const assertRegistration = context => {
  if (!allowedAccountTypes(context).includes(registrationType(context)))
    throw { errCode: 'ACCOUNT_ENTRY_FORBIDDEN', errMsg: '管理端账号请由管理员创建，客户端注册请使用注册接口' }
}
const normalizeIdentifiers = params => {
  const result = { ...params }
  if (typeof result.username === 'string') result.username = result.username.trim()
  if (typeof result.email === 'string') result.email = result.email.trim().toLowerCase()
  if (typeof result.mobile === 'string') result.mobile = result.mobile.trim()
  return result
}
module.exports = { accountEntry, allowedAccountTypes, canEnter, assertEntry, assertAppAuthorization, registrationType, assertRegistration, normalizeIdentifiers }
