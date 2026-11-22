const {
  isAuthorizeApproved
} = require('./utils')

/**
 * 设置用户允许登录的应用列表
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#set-authorized-app
 * @param {Object} params
 * @param {String} params.uid       用户id
 * @param {Array} params.appIdList 允许登录的应用AppId列表
 * @returns
 */
module.exports = async function (params = {}) {
  const schema = {
    uid: 'string',
    appIdList: 'array<string>'
  }
  this.middleware.validate(params, schema)
  const {
    uid,
    appIdList
  } = params
  await isAuthorizeApproved({
    uid,
    appIdList
  })
  await require('../admin/root-admin').updateRootAware({
    db: this.adminDb, uid, data: { dcloud_appid: appIdList }
  })
  return {
    errCode: 0
  }
}
