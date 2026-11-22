const { createUserAdmin } = require('./user-admin')
const { managementType } = require('./account-types')
module.exports = function () {
  return createUserAdmin({ db: this.adminDb, uid: this.authInfo.uid, appId: this.getUniversalClientInfo().appId, accountType: managementType(this) }).options()
}
