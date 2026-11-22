const { findUser } = require('./account')
const { allowedAccountTypes, canEnter } = require('./account-policy')
const { verifyMobileCode, verifyEmailCode } = require('./verify-code')
const { getNeedCaptcha, verifyCaptcha } = require('./captcha')
const { issueSelection, completeAccountRecovery } = require('./account-selection')
const { LOG_TYPE } = require('../../common/constants')

async function contactAuth(params = {}, key, purpose) {
  this.middleware.validate(params, { [key]: key, code: 'string', captcha: { required: false, type: 'string' } })
  const value = key === 'email' ? params[key].trim().toLowerCase() : params[key].trim()
  const scene = purpose === 'reset' ? `reset-pwd-by-${key === 'mobile' ? 'sms' : 'email'}` : `login-by-${key === 'mobile' ? 'sms' : 'email'}`
  const contact = { [key]: value }
  if (await getNeedCaptcha.call(this, { ...contact, type: purpose === 'reset' ? LOG_TYPE.RESET_PWD_BY_SMS : LOG_TYPE.LOGIN }))
    await verifyCaptcha.call(this, { captcha: params.captcha, scene })
  try {
    await (key === 'mobile' ? verifyMobileCode : verifyEmailCode).call(this, { ...contact, code: params.code, scene })
  } catch (error) {
    await this.middleware.uniIdLog({ success: false, data: contact, type: purpose === 'reset' ? LOG_TYPE.RESET_PWD_BY_SMS : LOG_TYPE.LOGIN })
    throw error
  }
  const accountTypes = allowedAccountTypes(this)
  const { userMatched } = await findUser({
    userQuery: contact, matchAllApps: true, tenantId: this.entryTenantId, accountTypes
  })
  if (userMatched.length > 1) throw { errCode: 'ACCOUNT_DATA_CONFLICT', errMsg: '联系方式对应多个账号，请联系管理员处理' }
  const users = userMatched.filter(user => canEnter(this, user) && (user.status || 0) === 0)
  if (!userMatched.length && purpose === 'login' && accountTypes.includes(1)) {
    // Only the client entry supports sign-up through a verified contact.
    return require('./register').postRegister.call(this, { user: { ...contact, [`${key}_confirmed`]: 1 }, inviteCode: params.inviteCode })
  }
  if (purpose === 'login' && users.length === 1) return require('./login').postLogin.call(this, { user: users[0] })
  return issueSelection(this, users, purpose, contact)
}
const beginAccountRecovery = function (params = {}) {
  if (!['mobile', 'email'].includes(params.channel)) throw { errCode: 'INVALID_PARAM', errMsg: '请选择手机号或邮箱' }
  return contactAuth.call(this, params, params.channel, 'reset')
}
const resetByContact = async function (params, key) {
  const result = await contactAuth.call(this, params, key, 'reset')
  if (result.accounts.length === 1 && params.password)
    return completeAccountRecovery.call(this, { selectionTicket: result.selectionTicket, uid: result.accounts[0].uid, password: params.password })
  return result
}
module.exports = { contactAuth, beginAccountRecovery, resetByContact }
