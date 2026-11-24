const { randomBytes } = require('crypto')
const { createFields } = require('../../lib/utils/record-metadata')
const { PLATFORM_TENANT_ID, TENANTS } = require('../../lib/utils/platform-tenant')
const { tenantRights } = require('./tenant-catalog')
const { enterpriseScope, fail, ownerOf, platformActor, readDoc, resolveTenantScope } = require('./tenant-scope')
const { claimsFor, needsRenewal } = require('./admin-token')

const USER_DELEGATION_PERMISSION = 'ENTER_USER_DELEGATION'
const canEnter = scope => !scope?.userDelegationId &&
  (scope?.isAdmin || scope?.permissions?.includes(USER_DELEGATION_PERMISSION))
const forbidden = message => fail(message, 'USER_DELEGATION_FORBIDDEN')
const expired = () => fail('用户代管已结束，请重新进入', 'USER_DELEGATION_INVALID')

async function operatorScope(context, db, appId) {
  const login = context.loginAdminScope
  const parent = context.adminScope
  if (!parent.sessionId) return resolveTenantScope(db, login.uid, appId)

  const operator = await platformActor(db, login.uid, appId)
  if (operator.tenantId !== PLATFORM_TENANT_ID || !(operator.isAdmin || operator.permissions.includes(tenantRights.enter)))
    forbidden('没有该租户的代管权限')
  const tenant = await readDoc(db, TENANTS, parent.tenantId)
  if (!tenant) forbidden('企业租户不存在')
  return enterpriseScope(db, operator, tenant, parent.sessionId)
}

async function effectiveScope(context, db, targetId) {
  const appId = context.getUniversalClientInfo().appId
  const operator = await operatorScope(context, db, appId)
  if (!canEnter(operator)) forbidden('没有用户代管权限')
  if (targetId === operator.uid) forbidden('不能代管自己的账号')
  const user = await readDoc(db, 'uni-id-users', targetId)
  if (!user || ownerOf(user) !== operator.tenantId)
    forbidden('只能代管当前租户的系统用户')
  const target = await resolveTenantScope(db, targetId, appId)
  if (target.tenantId !== operator.tenantId)
    forbidden('目标用户不在可代管范围内')
  const intersect = (targetIds, operatorIds) => target.isAdmin ? operatorIds
    : operator.isAdmin ? targetIds : targetIds.filter(id => operatorIds.includes(id))
  const unrestrictedApps = apps => apps == null || apps.includes('*')
  return {
    ...target,
    isAdmin: target.isAdmin && operator.isAdmin,
    permissions: intersect(target.permissions, operator.permissions),
    menuIds: intersect(target.menuIds, operator.menuIds),
    apps: unrestrictedApps(operator.apps) ? target.apps : unrestrictedApps(target.apps) ? operator.apps
      : target.apps.filter(id => operator.apps.includes(id)),
    packageAdministrator: false
  }
}

async function recordUserDelegation(context, session, operation) {
  const operator = context.loginAdminScope
  await uniCloud.database().collection('uni-id-log').add({
    ...createFields(operator),
    type: 'user-delegation',
    user_id: operator.uid,
    target_user_id: session.target_user_id,
    tenant_id: session.tenant_id,
    appid: session.appid,
    delegation_id: session._id,
    operation
  })
}

const expiresBy = context => Math.min(context.platformTokenExpires, context.tenantDelegationExpires ?? Infinity)

async function signUserDelegation(context, session) {
  const credential = await context.uniIdCommon.createDelegationToken({
    uid: context.loginAdminScope.uid,
    scope: session,
    expiresAt: expiresBy(context)
  })
  if (credential.errCode) throw credential
  return { userDelegationToken: credential.token, tokenExpired: credential.tokenExpired }
}

async function enterUserManagement({ uid } = {}) {
  if (this.adminScope.userDelegationId) forbidden('请先退出当前的用户代管')
  if (typeof uid !== 'string' || !uid || uid.length > 100) forbidden('请选择有效的系统用户')
  const db = uniCloud.database()
  const target = await effectiveScope(this, db, uid)
  const { appId } = this.getUniversalClientInfo()
  const session = {
    kind: 'user',
    version: 2,
    _id: randomBytes(24).toString('hex'),
    target_user_id: uid,
    appid: appId,
    tenant_id: target.tenantId,
    parent_session_id: this.adminScope.sessionId || '',
    authorization: claimsFor(target, appId)
  }
  const credential = await signUserDelegation(this, session)
  await recordUserDelegation(this, session, 'enterUserManagement')
  const { _id, name, tenant_no, type } = target.tenant
  return {
    errCode: 0, userDelegationId: session._id, ...credential,
    tenant: { _id, name, tenant_no, type },
    targetUser: { uid, name: target.name, username: target.user.username || '' }
  }
}

async function verifyUserDelegation(context, token) {
  if (typeof token !== 'string' || !token) expired()
  const payload = await context.uniIdCommon.checkDelegationToken(token)
  const session = payload?.ucsDelegation
  if (payload?.errCode || payload?.uid !== context.loginAdminScope.uid ||
    !(payload.exp * 1000 > Date.now()) || session?.kind !== 'user' || session.version !== 2 ||
    session.appid !== context.getUniversalClientInfo().appId ||
    !session._id || !session.target_user_id || !session.tenant_id ||
    session.authorization?.tenant?._id !== session.tenant_id || session.authorization.appId !== session.appid ||
    (session.authorization.isAdmin && session.tenant_id !== PLATFORM_TENANT_ID) || session.authorization.packageAdministrator ||
    !Array.isArray(session.authorization.permissions) || !Array.isArray(session.authorization.menuIds)) expired()
  return { session, payload }
}

async function resolveUserDelegation(context, token) {
  const { session, payload } = await verifyUserDelegation(context, token)
  const parent = context.adminScope
  if (session.tenant_id !== parent.tenantId || session.parent_session_id !== (parent.sessionId || '') ||
    (session.authorization.isAdmin && !parent.isAdmin)) expired()
  let authorization = session.authorization
  let renewal
  const tokenExpired = payload.exp * 1000
  if (needsRenewal(context, payload) && expiresBy(context) >= tokenExpired + 1000) {
    let target
    try {
      target = await effectiveScope(context, uniCloud.database(), session.target_user_id)
    } catch (error) {
      if (['USER_DELEGATION_FORBIDDEN', 'TENANT_ACCESS_FORBIDDEN'].includes(error?.errCode)) expired()
      throw error
    }
    if (target.tenantId !== session.tenant_id) expired()
    const updatedAuthorization = claimsFor(target, session.appid)
    const credential = await signUserDelegation(context, { ...session, authorization: updatedAuthorization })
    if (credential.tokenExpired > tokenExpired) {
      authorization = updatedAuthorization
      renewal = credential
    }
  }
  const scope = { ...authorization, uid: session.target_user_id, tenantId: session.tenant_id, userDelegationId: session._id }
  return { session, scope, renewal }
}

async function exitUserManagement({ userDelegationToken } = {}) {
  const { session } = await verifyUserDelegation(this, userDelegationToken)
  await recordUserDelegation(this, session, 'exitUserManagement')
  return { errCode: 0 }
}

module.exports = { USER_DELEGATION_PERMISSION, canEnter, enterUserManagement, exitUserManagement, resolveUserDelegation, recordUserDelegation }
