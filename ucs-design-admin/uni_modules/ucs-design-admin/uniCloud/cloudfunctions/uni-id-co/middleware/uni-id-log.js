const db = uniCloud.database()
const { createFields } = require('../lib/utils/record-metadata')
module.exports = async function ({
  data = {},
  success = true,
  type = 'login'
} = {}) {
  const now = Date.now()
  const uniIdLogCollection = db.collection('uni-id-log')
  const requiredDataKeyList = ['user_id', 'username', 'email', 'mobile']
  const dataCopy = {}
  for (let i = 0; i < requiredDataKeyList.length; i++) {
    const key = requiredDataKeyList[i]
    if (key in data && typeof data[key] === 'string') {
      dataCopy[key] = data[key]
    }
  }
  const {
    appId,
    clientIP,
    deviceId,
    userAgent
  } = this.getUniversalClientInfo()
  const logData = {
    tenant_id: this.entryTenantId || this.adminDb?.tenantActor?.tenantId || '00000',
    appid: appId,
    device_id: deviceId,
    ip: clientIP,
    type,
    ua: userAgent,
    ...createFields({ uid: dataCopy.user_id, name: dataCopy.username }, now),
    ...dataCopy
  }

  if (success) {
    logData.state = 1
  } else {
    logData.state = 0
  }
  return uniIdLogCollection.add(logData)
}
