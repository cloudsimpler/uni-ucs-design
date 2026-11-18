const { createUserAdmin } = require('./user-admin')
const { ACCOUNT_TYPE } = require('./account-types')
module.exports = function (params) {
  return createUserAdmin({
    db: uniCloud.database(), uid: this.authInfo.uid,
    appId: this.getUniversalClientInfo().appId, accountType: ACCOUNT_TYPE.DEVELOPER
  }).removeAccount(params)
}
