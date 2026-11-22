const { readDoc, ownerOf, fail } = require('../module/admin/tenant-scope')
const { TENANTS, PLATFORM_TENANT_ID } = require('../lib/utils/platform-tenant')

module.exports = async function () {
  if (this.authInfo) { // 多次执行auth时如果第一次成功后续不再执行
    return
  }
  const token = this.getUniversalUniIdToken()
  const initial = await this.uniIdCommon.checkToken(token, { autoRefresh: false })
  if (initial.errCode) throw initial
  if (initial.ucsAdmin) this.issueAdminScope = true
  const threshold = this.config?.tokenExpiresThreshold
  const payload = threshold > 0 && initial.exp * 1000 - Date.now() < threshold * 1000
    ? await this.uniIdCommon.checkToken(token)
    : initial
  if (payload.errCode) {
    throw payload
  }
  const db = uniCloud.database()
  const user = await readDoc(db, 'uni-id-users', payload.uid)
  if (!user || (user.status || 0) !== 0)
    fail('当前账号不可用', 'uni-id-check-token-failed')
  this.entryTenantId = ownerOf(user)
  if (this.entryTenantId !== PLATFORM_TENANT_ID) {
    const tenant = await readDoc(db, TENANTS, this.entryTenantId)
    if (!tenant || tenant.type !== 'enterprise' || !tenant.enabled)
      fail('企业租户已停用', 'TENANT_ACCESS_FORBIDDEN')
  }
  this.authInfo = payload
  if (payload.token) {
    this.response.newToken = {
      token: payload.token,
      tokenExpired: payload.tokenExpired
    }
  }
}
