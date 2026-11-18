const {
  USER_STATUS
} = require('../../common/constants')
async function setUserStatus (uid, status) {
  const updateData = {
    status
  }
  if (status !== USER_STATUS.NORMAL) {
    updateData.valid_token_date = Date.now()
  }
  await require('../../module/admin/root-admin').updateRootAware({ db: uniCloud.database(), uid, data: updateData })
  // TODO 此接口尚不完善，例如注销后其他客户端可能存在有效token，支持Redis后此处会补充额外逻辑
  return {
    errCode: 0
  }
}

module.exports = {
  setUserStatus
}
