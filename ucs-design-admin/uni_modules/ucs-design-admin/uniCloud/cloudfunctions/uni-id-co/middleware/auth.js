const { readDoc, ownerOf, fail, assertTenantUnexpired } = require('../module/admin/tenant-scope')
const { adminScopeFromToken } = require('../module/admin/admin-token')
const { TENANTS, PLATFORM_TENANT_ID } = require('../lib/utils/platform-tenant')
const { checkLoginToken } = require('../lib/utils/login-token')

module.exports = async function () {
  if (this.authInfo) { // 多次执行auth时如果第一次成功后续不再执行
    return
  }
  const token = this.getUniversalUniIdToken()
  const initial = await checkLoginToken(this, token)
  const scope = adminScopeFromToken(this, initial)
  if (scope) this.issueAdminScope = true
  const threshold = this.config?.tokenExpiresThreshold
  const db = uniCloud.database()
  const user = await readDoc(db, 'uni-id-users', initial.uid)
  if (!user || (user.status || 0) !== 0)
    fail('当前账号不可用', 'uni-id-check-token-failed')
  this.authenticatedUser = user
  this.entryTenantId = ownerOf(user)
  if (this.entryTenantId !== PLATFORM_TENANT_ID) {
    const tenant = await readDoc(db, TENANTS, this.entryTenantId)
    if (!tenant || tenant.type !== 'enterprise' || !tenant.enabled)
      fail('企业租户已停用', 'TENANT_ACCESS_FORBIDDEN')
    if (!scope) assertTenantUnexpired(tenant)
  }
  let payload = initial
  if (threshold > 0 && initial.exp * 1000 - Date.now() < threshold * 1000) {
    try {
      const renewed = await this.uniIdCommon.checkToken(token)
      if (renewed.errCode) throw renewed
      payload = renewed
    } catch (error) {
      if (error.errCode !== 'TENANT_EXPIRED' || !scope) throw error
      assertTenantUnexpired(scope.tenant)
    }
  }
  this.authInfo = payload
  if (payload.token) {
    this.response.newToken = {
      token: payload.token,
      tokenExpired: payload.tokenExpired
    }
  }
}
