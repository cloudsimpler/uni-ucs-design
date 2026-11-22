/**
 * 刷新token
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#refresh-token
 */
module.exports = async function () {
  const payload = await this.uniIdCommon.checkToken(this.getUniversalUniIdToken(), { autoRefresh: false })
  if (payload.errCode) throw payload
  if (payload.ucsAdmin) this.issueAdminScope = true
  const { data } = await uniCloud.database().collection('uni-id-users').doc(payload.uid).get()
  const user = Array.isArray(data) ? data[0] : data
  if (!user) throw { errCode: 'ACCOUNT_NOT_AVAILABLE', errMsg: '账号不存在' }
  // Shared by both entries: refresh the authenticated account, retaining app authorization.
  require('../../lib/utils/account-policy').assertAppAuthorization(this, user)
  require('../../lib/utils/login').checkLoginUserRecord(user)
  const refreshTokenRes = await this.uniIdCommon.refreshToken({
    token: this.getUniversalUniIdToken()
  })
  const {
    errCode,
    token,
    tokenExpired
  } = refreshTokenRes
  if (errCode) {
    throw refreshTokenRes
  }
  return {
    errCode: 0,
    newToken: {
      token,
      tokenExpired
    }
  }
}
