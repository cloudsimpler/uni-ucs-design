const { PLATFORM_TENANT_ID, TENANTS } = require('../../lib/utils/platform-tenant')
const { readDoc, resolveTenantScope, enterpriseScope, platformActor, fail } = require('./tenant-scope')
const { tenantRights } = require('./tenant-catalog')

function claimsFor(scope, appId) {
  const { _id, name, tenant_no, type } = scope.tenant
  return {
    version: 1, appId, tenant: { _id, name, tenant_no, type }, sessionId: scope.sessionId,
    name: scope.name, role: scope.role, apps: scope.apps, isAdmin: scope.isAdmin,
    permissions: scope.permissions, menuIds: scope.menuIds,
    packageAdministrator: Boolean(scope.packageAdministrator),
    user: { account_type: scope.user.account_type, is_root: Boolean(scope.user.is_root), is_tenant_admin: Boolean(scope.user.is_tenant_admin) }
  }
}

function checked(result) {
  if (result.errCode) throw result
  return result
}

function scopeFrom(payload, claims, appId) {
  if (!claims || claims.version !== 1 || claims.appId !== appId || !claims.tenant?._id)
    fail('令牌无法用于当前后台应用', 'uni-id-check-token-failed')
  return { ...claims, uid: payload.uid, tenantId: claims.tenant._id }
}

function installAdminTokenIssuer(context) {
  const previous = context.uniIdCommon.interceptorMap?.get('customToken')
  context.uniIdCommon.setInterceptor('customToken', async (claims) => {
    const tokenClaims = previous ? await previous(claims) : claims
    if (!context.issueAdminScope) return tokenClaims
    const appId = context.getUniversalClientInfo().appId
    const scope = await resolveTenantScope(uniCloud.database(), claims.uid, appId)
    return { ...tokenClaims, ucsAdmin: claimsFor(scope, appId) }
  })
}

function needsRenewal(context, payload) {
  const threshold = context.config.tokenExpiresThreshold
  return threshold > 0 && payload.exp * 1000 - Date.now() < threshold * 1000
}

async function authenticateAdmin(context, credential) {
  const appId = context.getUniversalClientInfo().appId
  const token = context.getUniversalUniIdToken()
  let payload = checked(await context.uniIdCommon.checkToken(token, { autoRefresh: false }))
  if (payload.ucsAdmin) scopeFrom(payload, payload.ucsAdmin, appId)
  if (!payload.ucsAdmin || needsRenewal(context, payload)) {
    context.issueAdminScope = true
    const renewal = checked(await context.uniIdCommon.refreshToken({ token }))
    payload = checked(await context.uniIdCommon.checkToken(renewal.token, { autoRefresh: false }))
    context.response.newToken = { token: renewal.token, tokenExpired: renewal.tokenExpired }
  }
  const baseScope = scopeFrom(payload, payload.ucsAdmin, appId)
  context.authInfo = payload
  context.entryTenantId = baseScope.tenantId
  context.platformTokenExpires = payload.exp * 1000
  context.loginAdminScope = baseScope
  context.adminScope = baseScope
  if (credential !== undefined) {
    if (typeof credential !== 'string' || baseScope.tenantId !== PLATFORM_TENANT_ID)
      fail('代管凭证无效', 'TENANT_SESSION_INVALID')
    const delegated = await verifyDelegation(context, credential)
    context.adminScope = delegated.scope
    if (needsRenewal(context, delegated.payload)) {
      const db = uniCloud.database()
      const actor = await platformActor(db, payload.uid, appId)
      if (actor.tenantId !== PLATFORM_TENANT_ID || !(actor.isAdmin || actor.permissions.includes(tenantRights.enter)))
        fail('没有代管权限', 'TENANT_SESSION_INVALID')
      const tenant = await readDoc(db, TENANTS, delegated.scope.tenantId)
      if (!tenant) fail('企业租户不存在', 'TENANT_SESSION_INVALID')
      context.adminScope = await enterpriseScope(db, actor, tenant, delegated.scope.sessionId)
      context.response.newDelegation = await signDelegation(context, context.adminScope)
    }
  }
  return context.adminScope
}

async function verifyDelegation(context, credential) {
  if (typeof credential !== 'string' || !credential) fail('代管凭证无效', 'TENANT_SESSION_INVALID')
  const payload = await context.uniIdCommon.checkDelegationToken(credential)
  if (payload.errCode || payload.uid !== context.authInfo.uid)
    fail('代管凭证已失效，请重新进入', 'TENANT_SESSION_INVALID')
  const scope = scopeFrom(payload, payload.ucsDelegation, context.getUniversalClientInfo().appId)
  if (scope.tenant.type !== 'enterprise' || !scope.sessionId || scope.isAdmin)
    fail('代管凭证无效', 'TENANT_SESSION_INVALID')
  return { payload, scope }
}

async function signDelegation(context, scope) {
  const result = checked(await context.uniIdCommon.createDelegationToken({
    uid: scope.uid, scope: claimsFor(scope, context.getUniversalClientInfo().appId),
    expiresAt: context.platformTokenExpires
  }))
  return { delegationToken: result.token, tokenExpired: result.tokenExpired }
}

module.exports = { installAdminTokenIssuer, authenticateAdmin, signDelegation, verifyDelegation }
