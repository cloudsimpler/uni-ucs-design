const { userCollection } = require('../../common/constants')

// 登录前可调用，仅返回注册入口状态；实际注册仍由 registerAdmin 再次校验。
module.exports = async function () {
  const { data } = await userCollection.where({ role: 'admin' }).field({ _id: true }).limit(1).get()
  return { errCode: 0, canRegisterAdmin: data.length === 0 }
}
