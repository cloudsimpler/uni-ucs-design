// Only initial administrator registration uses this atomic bootstrap.
async function registerRootWithApp(db, user, clientInfo, applicationName) {
  const appid = String(clientInfo.appId || '').trim()
  const name = String(applicationName || clientInfo.appName || appid).trim()
  if (!/^[A-Za-z0-9_][A-Za-z0-9_.-]{0,99}$/.test(appid) || !name || name.length > 80) {
    throw { errCode: 'ADMIN_APPLICATION_INVALID', errMsg: '当前应用信息不完整，请检查应用 AppID 和名称配置' }
  }

  // Query before the transaction: uniCloud transactions use document operations.
  // The appid unique index also protects against concurrent application creation.
  const { data } = await db.collection('opendb-app-list').where({ appid }).field({ _id: true }).limit(1).get()
  const transaction = await db.startTransaction()
  try {
    const result = await transaction.collection('uni-id-users').add(user)
    if (!data.length) {
      await transaction.collection('opendb-app-list').add({
        appid,
        name,
        app_type: 0,
        creator_uid: result.id,
        create_date: Date.now()
      })
    }
    await transaction.commit()
    return result
  } catch (error) {
    await transaction.rollback().catch(() => {})
    throw error
  }
}

module.exports = { registerRootWithApp }
