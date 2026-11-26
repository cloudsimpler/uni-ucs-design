const {
  dbCmd,
  LOG_TYPE,
  deviceCollection,
  userCollection
} = require('../../common/constants')
const { updateFields } = require('./record-metadata')
const { checkLoginToken } = require('./login-token')

async function logout () {
  const {
    deviceId
  } = this.getUniversalClientInfo()
  const uniIdToken = this.getUniversalUniIdToken()
  const payload = await checkLoginToken(this, uniIdToken)
  const uid = payload.uid

  // 删除token
  await userCollection.doc(uid).update({
    token: dbCmd.pull(uniIdToken)
  })

  // 仅当device表的device_id和user_id均对应时才进行更新
  await deviceCollection.where({
    device_id: deviceId,
    user_id: uid
  }).update({
    token_expired: 0,
    ...updateFields({ uid })
  })
  await this.middleware.uniIdLog({
    data: {
      user_id: uid
    },
    type: LOG_TYPE.LOGOUT
  })
  return {
    errCode: 0
  }
}

module.exports = {
  logout
}
