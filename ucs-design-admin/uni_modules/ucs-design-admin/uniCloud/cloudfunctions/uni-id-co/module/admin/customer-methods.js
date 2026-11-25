const updateUser = require('./update-user')

const update = (fields) => async function (params = {}) {
  if (!params || typeof params !== 'object' || Array.isArray(params) ||
    Object.keys(params).some(key => !fields.includes(key))) {
    throw { errCode: 'USER_ADMIN_INVALID', errMsg: '社区用户管理不支持修改这些字段' }
  }
  return updateUser.call(this, params)
}

module.exports = {
  listCustomers: require('./list-users'),
  getCustomerOptions: require('./get-user-options'),
  getCustomerDetail: require('./get-user-detail'),
  updateCustomer: update(['uid', 'avatar', 'nickname', 'gender', 'mobile', 'email', 'tags']),
  setCustomerStatus: require('./set-user-status')
}
