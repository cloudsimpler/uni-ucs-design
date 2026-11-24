const { userCollection } = require('../../common/constants')
const { ERROR } = require('../../common/error')

// 仅使用鉴权得到的 uid；客户端不能指定其他用户，也不能扩展返回字段。
module.exports = async function () {
  const uid = this.authInfo?.uid
  if (typeof uid !== 'string' || !uid) {
    throw { errCode: ERROR.CHECK_TOKEN_FAILED }
  }
  const user = this.authenticatedUser?._id === uid ? this.authenticatedUser : (await userCollection.doc(uid).field({
    _id: true, username: true, nickname: true, avatar: true
  }).get()).data?.[0]
  if (!user) throw { errCode: ERROR.ACCOUNT_NOT_EXISTS }
  return {
    errCode: 0,
    data: { _id: user._id, username: user.username, nickname: user.nickname, avatar: user.avatar }
  }
}
