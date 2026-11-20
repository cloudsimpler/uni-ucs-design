const { actorName, createFields } = require('./record-metadata')
const { ERROR } = require('../../common/error')

const initialRootId = '000000000000000000000001'

// Only initial administrator registration uses this atomic bootstrap.
async function registerRootWithApp(db, user, clientInfo, applicationName, applicationType = 0) {
  const appid = String(clientInfo.appId || '').trim()
  const name = String(applicationName || clientInfo.appName || appid).trim()
  if (!/^[A-Za-z0-9_][A-Za-z0-9_.-]{0,99}$/.test(appid) || !name || name.length > 80) {
    throw { errCode: 'ADMIN_APPLICATION_INVALID', errMsg: '当前应用信息不完整，请检查应用 AppID 和名称配置' }
  }
  if (![0, 1].includes(applicationType)) {
    throw { errCode: 'ADMIN_APPLICATION_INVALID', errMsg: '当前应用类型不正确' }
  }

  // Query before the transaction: uniCloud transactions use document operations.
  // The appid unique index also protects against concurrent application creation.
  const { data } = await db.collection('ucsdb-app-list').where({ appid }).field({ _id: true }).limit(1).get()
  const { data: roots } = await db.collection('uni-id-users').where({ is_root: true }).field({ _id: true }).limit(1).get()
  if (roots.length) throw { errCode: ERROR.ADMIN_EXISTS }
  const transaction = await db.startTransaction()
  try {
    // The user collection's primary key prevents concurrent first registrations.
    const result = await transaction.collection('uni-id-users').add({ ...user, _id: initialRootId })
    if (!data.length) {
      await transaction.collection('ucsdb-app-list').add({
        appid,
        name,
        app_type: applicationType,
        ...createFields({ uid: result.id, name: actorName(user) })
      })
    }
    await transaction.commit()
    return result
  } catch (error) {
    await transaction.rollback().catch(() => {})
    if (/duplicate|E11000|重复|唯一/i.test([error.message, error.errMsg].join(' '))) {
      const { data } = await db.collection('uni-id-users').doc(initialRootId).field({ _id: true }).get()
      if (data.length) throw { errCode: ERROR.ADMIN_EXISTS }
    }
    throw error
  }
}

module.exports = { registerRootWithApp }
