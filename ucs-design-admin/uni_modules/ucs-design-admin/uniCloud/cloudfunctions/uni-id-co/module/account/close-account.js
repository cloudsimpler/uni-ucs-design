// Customer self-service closure removes only customer identity when other identities exist.
module.exports = async function () {
  return require('../../lib/utils/identity-lifecycle').closeCustomer(uniCloud.database(), this.authInfo.uid)
}
