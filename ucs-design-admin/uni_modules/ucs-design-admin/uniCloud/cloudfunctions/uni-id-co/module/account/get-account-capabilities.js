const { userCollection } = require('../../common/constants')
const { accountTypeOf, hasManagementIdentity, hasAccountType } = require('../admin/account-types')
const { isMatchUserApp } = require('../../common/utils')

// Business entry capabilities for a shared client, without changing token verification.
module.exports = async function () {
  const result = await userCollection.doc(this.authInfo.uid).field({ account_type: true, status: true, dcloud_appid: true }).get()
  const user = result.data?.[0]
  const available = Boolean(user && (user.status || 0) === 0 && isMatchUserApp(user.dcloud_appid, this.getUniversalClientInfo().appId))
  return { errCode: 0, account_type: accountTypeOf(user) ?? null,
    canEnterManagement: available && hasManagementIdentity(user), canEnterClient: available && hasAccountType(user, 1) }
}
