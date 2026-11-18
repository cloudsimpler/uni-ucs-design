const { createUserAdmin } = require('./user-admin')
const { managementType } = require('./account-types')
module.exports = function () {
  return createUserAdmin({ db: uniCloud.database(), uid: this.authInfo.uid, appId: this.getUniversalClientInfo().appId, accountType: managementType(this) }).options()
}
