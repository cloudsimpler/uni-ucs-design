const { accountTypeOf } = require('../../module/admin/account-types')
const { isMatchUserApp } = require('../../common/utils')
const { createHash, randomBytes } = require('crypto')
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
const canEnter = (context, user) => accountTypeOf(user).some(type => allowedAccountTypes(context).includes(type)) &&
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
const digest = value => createHash('sha256').update(value).digest('hex')
// Every unique field is populated: optional identities must not depend on sparse indexes.
const emptyKey = (user, field) => /^empty:[a-f0-9]{64}$/.test(user[field] || '')
  ? user[field] : `empty:${user._id ? digest(String(user._id)) : randomBytes(32).toString('hex')}`
const rootUniqueKey = user => user.is_root === true ? 'root' : emptyKey(user, 'root_unique')
const identityKeys = (user) => {
  const normalized = normalizeIdentifiers(user), result = {}
  for (const key of ['username', 'mobile', 'email']) {
    result[`${key}_unique`] = normalized[key]
      ? `value:${digest(normalized[key])}`
      : emptyKey(user, `${key}_unique`)
  }
  return result
}
module.exports = { accountEntry, allowedAccountTypes, canEnter, assertEntry, assertAppAuthorization, registrationType, assertRegistration, normalizeIdentifiers, identityKeys, rootUniqueKey }
