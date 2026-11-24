module.exports = async function () {
  return require('../../lib/utils/identity-lifecycle').closeCustomer(uniCloud.database(), this.authInfo.uid)
}
