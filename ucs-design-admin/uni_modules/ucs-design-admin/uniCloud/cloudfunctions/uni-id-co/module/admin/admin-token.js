const { PLATFORM_TENANT_ID, TENANTS } = require('../../lib/utils/platform-tenant')
const { checkLoginToken } = require('../../lib/utils/login-token')
const { readDoc, resolveTenantScope, enterpriseScope, platformActor, fail, tenantExpiry, assertTenantUnexpired } = require('./tenant-scope')
const { tenantRights } = require('./tenant-catalog')
const { cleanLoginRoleGrants } = require('./login-role-grants')
const { signDelegationToken, verifyDelegationToken } = require('./delegation-token')

function claimsFor(scope, appId) {
  const { _id, name, tenant_no, type } = scope.tenant
  return {
    version: 1, appId, tenant: { _id, name, tenant_no, type, expires_at: scope.tenant.expires_at ?? null }, sessionId: scope.sessionId,
    name: scope.name, role: scope.role, apps: scope.apps, isAdmin: scope.isAdmin,
    permissions: scope.permissions, menuIds: scope.menuIds,
    packageAdministrator: Boolean(scope.packageAdministrator),
    user: { account_type: scope.user.account_type, is_root: Boolean(scope.user.is_root) }
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

function decodeAdminClaims(claims) {
  if (typeof claims !== 'string') return claims
  try {
    return JSON.parse(Buffer.from(claims, 'base64url').toString('utf8'))
  } catch {
    fail('后台权限快照无效，请重新登录', 'uni-id-check-token-failed')
  }
}

function adminScopeFromToken(context, payload) {
  if (payload.ucsAdmin === undefined) return
  const scope = scopeFrom(payload, decodeAdminClaims(payload.ucsAdmin), context.getUniversalClientInfo().appId)
  assertTenantUnexpired(scope.tenant)
  return scope
}

function installAdminTokenIssuer(context) {
  const previous = context.uniIdCommon.interceptorMap?.get('customToken')
  context.uniIdCommon.setInterceptor('customToken', async (claims) => {
    const tokenClaims = previous ? await previous(claims) : claims
    if (!context.issueAdminScope) return tokenClaims
    const appId = context.getUniversalClientInfo().appId
    const db = uniCloud.database()
    const user = context.adminLoginUser?._id === claims.uid ? context.adminLoginUser : undefined
    const cleanGrants = user && (async (roles, grants) => {
      try {
        await cleanLoginRoleGrants(db, user, roles, grants)
      } catch (error) {
        console.warn('登录时清理角色旧授权失败', error.errCode || error.code)
      }
    })
    const scope = await resolveTenantScope(db, claims.uid, appId, { user, tenant: user && context.entryTenant, cleanGrants })
    // The Web SDK decodes the outer JWT payload with atob. Keep this claim ASCII-safe.
    const snapshot = Buffer.from(JSON.stringify(claimsFor(scope, appId))).toString('base64url')
    return { ...tokenClaims, ucsAdmin: snapshot }
  })
}

function needsRenewal(context, payload) {
  const threshold = context.config.tokenExpiresThreshold
  return threshold > 0 && payload.exp * 1000 - Date.now() < threshold * 1000
}

async function authenticateAdmin(context, credential) {
  const appId = context.getUniversalClientInfo().appId
  const token = context.getUniversalUniIdToken()
  let payload = await checkLoginToken(context, token)
  let baseScope = adminScopeFromToken(context, payload)
  if (typeof payload.ucsAdmin !== 'string' || needsRenewal(context, payload)) {
    try {
      context.issueAdminScope = true
      const renewal = checked(await context.uniIdCommon.refreshToken({ token }))
      const renewedPayload = await checkLoginToken(context, renewal.token)
      baseScope = adminScopeFromToken(context, renewedPayload)
      if (!baseScope) fail('后台权限快照无效，请重新登录', 'uni-id-check-token-failed')
      payload = renewedPayload
      context.response.newToken = { token: renewal.token, tokenExpired: renewal.tokenExpired }
    } catch (error) {
      // An earlier date prevents renewal while the existing snapshot is still valid.
      if (error.errCode !== 'TENANT_EXPIRED' || !baseScope) throw error
      assertTenantUnexpired(baseScope.tenant)
    }
  }
  context.authInfo = payload
  context.entryTenantId = baseScope.tenantId
  context.platformTokenExpires = Math.min(payload.exp * 1000, tenantExpiry(baseScope.tenant))
  context.loginAdminScope = baseScope
  context.adminScope = baseScope
  if (credential !== undefined) {
    if (typeof credential !== 'string' || baseScope.tenantId !== PLATFORM_TENANT_ID)
      fail('代管凭证无效', 'TENANT_SESSION_INVALID')
    const delegated = await verifyDelegation(context, credential)
    context.adminScope = delegated.scope
    context.tenantDelegationExpires = delegated.payload.exp * 1000
    if (needsRenewal(context, delegated.payload) &&
      Math.min(context.platformTokenExpires, tenantExpiry(delegated.scope.tenant)) >= context.tenantDelegationExpires + 1000) {
      const db = uniCloud.database()
      const actor = await platformActor(db, payload.uid, appId)
      if (actor.tenantId !== PLATFORM_TENANT_ID || !(actor.isAdmin || actor.permissions.includes(tenantRights.enter)))
        fail('没有代管权限', 'TENANT_SESSION_INVALID')
      const tenant = await readDoc(db, TENANTS, delegated.scope.tenantId)
      if (!tenant) fail('企业租户不存在', 'TENANT_SESSION_INVALID')
      if (tenantExpiry(tenant) >= context.tenantDelegationExpires + 1000) {
        const renewedScope = await enterpriseScope(db, actor, tenant, delegated.scope.sessionId)
        const renewal = await signDelegation(context, renewedScope)
        if (renewal.tokenExpired > context.tenantDelegationExpires) {
          context.adminScope = renewedScope
          context.response.newDelegation = renewal
          context.tenantDelegationExpires = renewal.tokenExpired
        }
      }
    }
  }
  return context.adminScope
}

async function verifyDelegation(context, credential) {
  if (typeof credential !== 'string' || !credential) fail('代管凭证无效', 'TENANT_SESSION_INVALID')
  const payload = verifyDelegationToken(context, credential)
  if (!payload || payload.uid !== context.authInfo.uid || payload.ucsDelegation?.kind === 'user')
    fail('代管凭证已失效，请重新进入', 'TENANT_SESSION_INVALID')
  const scope = scopeFrom(payload, payload.ucsDelegation, context.getUniversalClientInfo().appId)
  if (scope.tenant.type !== 'enterprise' || !scope.sessionId || scope.isAdmin)
    fail('代管凭证无效', 'TENANT_SESSION_INVALID')
  return { payload, scope }
}

async function signDelegation(context, scope) {
  const result = signDelegationToken(context, {
    uid: scope.uid, scope: claimsFor(scope, context.getUniversalClientInfo().appId),
    expiresAt: Math.min(context.platformTokenExpires, tenantExpiry(scope.tenant))
  })
  return { delegationToken: result.token, tokenExpired: result.tokenExpired }
}

module.exports = { claimsFor, installAdminTokenIssuer, adminScopeFromToken, authenticateAdmin, needsRenewal, signDelegation, verifyDelegation }
