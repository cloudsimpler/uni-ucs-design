
/**
 * 移除用户登录授权
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#remove-authorized-app
 * @param {Object} params
 * @param {String} params.uid   用户id
 * @param {String} params.appId 取消授权的应用的AppId
 * @returns
 */
module.exports = async function (params = {}) {
  const schema = {
    uid: 'string',
    appId: 'string'
  }
  this.middleware.validate(params, schema)
  const {
    uid,
    appId
  } = params
  await require('../admin/root-admin').updateRootAware({
    db: this.adminDb, uid,
    data: user => ({ dcloud_appid: (user.dcloud_appid || ['*']).filter(id => id !== appId) })
  })
  return {
    errCode: 0
  }
}
