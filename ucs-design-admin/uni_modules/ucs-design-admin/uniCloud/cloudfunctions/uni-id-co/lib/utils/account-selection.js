const { randomBytes, createHash } = require('crypto')
const { userCollection, verifyCollection, dbCmd, LOG_TYPE } = require('../../common/constants')
const { canEnter, accountEntry } = require('./account-policy')
const { accountTypeOf, sameAccountTypes } = require('../../module/admin/account-types')
const PasswordUtils = require('./password')
const { PLATFORM_TENANT_ID } = require('./platform-tenant')
const { ownerOf } = require('../../module/admin/tenant-scope')
const { createFields, updateFields } = require('./record-metadata')
const digest = value => createHash('sha256').update(String(value || '')).digest('hex')
const fail = () => { throw { errCode: 'ACCOUNT_SELECTION_EXPIRED', errMsg: '验证已失效，请重新验证后选择账号' } }

async function issueSelection(context, users, purpose, contact = {}) {
  if (!users.length) throw { errCode: 'ACCOUNT_NOT_AVAILABLE', errMsg: '没有可用于当前入口的账号' }
  if (users.length > 1)
    throw { errCode: 'ACCOUNT_DATA_CONFLICT', errMsg: '联系方式对应多个账号，请联系管理员处理' }
  const ticket = randomBytes(32).toString('hex')
  const client = context.getUniversalClientInfo()
  const proof = {
    appid: client.appId, entry: accountEntry(context), purpose, contact, tenant_id: context.entryTenantId || PLATFORM_TENANT_ID,
    accounts: users.map(user => ({ uid: user._id, type: accountTypeOf(user), password: digest(user.password) }))
  }
  const now = Date.now()
  await verifyCollection.add({
    code: digest(ticket), scene: `account-selection-${purpose}`, state: 0,
    ...createFields(undefined, now), expired_date: now + 5 * 60 * 1000,
    ip: client.clientIP || '', account_selection: proof
  })
  return {
    errCode: 0, selectionTicket: ticket,
    accounts: users.map(user => ({ uid: user._id, account_type: accountTypeOf(user),
      username: user.username || '', nickname: user.nickname || '', avatar: user.avatar || '' }))
  }
}

async function consumeSelection(context, { selectionTicket, uid }, purpose) {
  if (typeof selectionTicket !== 'string' || !/^[a-f0-9]{64}$/.test(selectionTicket) || typeof uid !== 'string') fail()
  const query = { code: digest(selectionTicket), scene: `account-selection-${purpose}`, state: 0, expired_date: dbCmd.gt(Date.now()) }
  const { data } = await verifyCollection.where(query).limit(1).get()
  const record = data[0], proof = record?.account_selection, client = context.getUniversalClientInfo()
  if (!proof || proof.purpose !== purpose || proof.entry !== accountEntry(context) || proof.appid !== client.appId || record.ip !== (client.clientIP || '')) fail()
  const candidate = proof.accounts.find(account => account.uid === uid)
  if (!candidate) fail()
  const result = await userCollection.doc(uid).get()
  const user = Array.isArray(result.data) ? result.data[0] : result.data
  if (!user || ownerOf(user) !== (context.entryTenantId || PLATFORM_TENANT_ID) ||
    (proof.tenant_id || PLATFORM_TENANT_ID) !== ownerOf(user) || !canEnter(context, user) ||
    (user.status || 0) !== 0 || !sameAccountTypes(accountTypeOf(user), candidate.type) || digest(user.password) !== candidate.password) fail()
  for (const [key, value] of Object.entries(proof.contact)) {
    if (user[key] !== value || user[`${key}_confirmed`] !== 1) fail()
  }
  const consumed = await verifyCollection.where({ ...query, _id: record._id }).update({ state: 1, ...updateFields({ uid }) })
  if (consumed.updated !== 1) fail()
  return user
}

async function completeAccountLogin(params = {}) {
  const user = await consumeSelection(this, params, 'login')
  return require('./login').postLogin.call(this, { user })
}

async function completeAccountRecovery(params = {}) {
  this.middleware.validate(params, { selectionTicket: 'string', uid: 'string', password: 'password' })
  const user = await consumeSelection(this, params, 'reset')
  const { passwordHash, version } = new PasswordUtils({ clientInfo: this.getUniversalClientInfo(), passwordSecret: this.config.passwordSecret })
    .generatePasswordHash({ password: params.password })
  const guard = { _id: user._id }
  for (const key of ['password', 'mobile', 'mobile_confirmed', 'email', 'email_confirmed', 'account_type', 'status']) {
    guard[key] = user[key] === undefined ? dbCmd.exists(false) : user[key]
  }
  const updated = await userCollection.where(guard).update({ password: passwordHash, password_secret_version: version,
    token: [], valid_token_date: Date.now() })
  if (updated.updated !== 1) fail()
  await this.middleware.uniIdLog({ data: { user_id: user._id }, type: LOG_TYPE.RESET_PWD_BY_SMS })
  return { errCode: 0 }
}
module.exports = { issueSelection, consumeSelection, completeAccountLogin, completeAccountRecovery }
