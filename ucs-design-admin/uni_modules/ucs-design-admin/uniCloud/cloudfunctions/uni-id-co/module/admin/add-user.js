const {
  findUser
} = require('../../lib/utils/account')
const {
  ERROR
} = require('../../common/error')
const { userCollection } = require('../../common/constants')
const PasswordUtils = require('../../lib/utils/password')
const { createUserAdmin } = require('./user-admin')
const { ACCOUNT_TYPE, managementType } = require('./account-types')
const { normalizeIdentifiers } = require('../../lib/utils/account-policy')

/**
 * 新增用户
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#add-user
 * @param {Object}  params
 * @param {String}  params.username       用户名
 * @param {String}  params.password       密码
 * @param {String}  params.nickname       昵称
 * @param {Array}   params.authorizedApp  允许登录的AppID列表
 * @param {Array}   params.role           用户角色列表
 * @param {String}  params.mobile         手机号
 * @param {String}  params.email          邮箱
 * @param {Array}   params.tags           用户标签
 * @param {Number}  params.status         用户状态
 * @returns
 */
const { createFields } = require('../../lib/utils/record-metadata')

module.exports = async function (params = {}) {
  params = normalizeIdentifiers(params)
  const accountType = managementType(this)
  const isEmployee = accountType === ACCOUNT_TYPE.EMPLOYEE
  const admin = createUserAdmin({ db: uniCloud.database(), uid: this.authInfo?.uid, appId: this.getUniversalClientInfo().appId, accountType })
  const authorized = await admin.authorize('create')
  const schema = {
    avatar: { required: false, type: 'string' },
    gender: { required: true, type: 'number' },
    department_id: { required: false, type: 'array<string>' },
    username: 'username',
    password: 'password',
    authorizedApp: {
      required: false,
      type: 'array<string>'
    }, // 指定允许登录的应用，空数组或不传表示不允许登录任何应用。
    nickname: {
      required: true,
      type: 'nickname'
    },
    role: {
      required: false,
      type: 'array<string>'
    },
    mobile: {
      required: isEmployee,
      type: 'mobile'
    },
    email: {
      required: false,
      type: 'email'
    },
    tags: {
      required: false,
      type: 'array<string>'
    },
    status: {
      required: false,
      type: 'number'
    }
  }
  this.middleware.validate(params, schema)
  await admin.validateChange(params, undefined, authorized)
  const {
    username,
    password,
    authorizedApp,
    nickname = '',
    role,
    mobile,
    email,
    tags,
    status
  } = params
  const {
    userMatched
  } = await findUser({
    userQuery: {
      username,
      mobile,
      email
    },
    authorizedApp,
    uniqueAccountType: accountType
  })
  if (userMatched.length) {
    throw {
      errCode: ERROR.ACCOUNT_EXISTS
    }
  }
  const passwordUtils = new PasswordUtils({
    clientInfo: this.getUniversalClientInfo(),
    passwordSecret: this.config.passwordSecret
  })
  const {
    passwordHash,
    version
  } = passwordUtils.generatePasswordHash({
    password
  })
  const data = {
    account_type: [accountType],
    avatar: params.avatar || '',
    gender: params.gender ?? 0,
    department_id: params.department_id || [],
    username,
    password: passwordHash,
    password_secret_version: version,
    dcloud_appid: authorizedApp || [],
    nickname,
    role: role || [],
    mobile,
    email,
    tags: tags || [],
    status: status ?? 0,
    register_date: Date.now()
  }
  if (email) {
    data.email_confirmed = 1
  }
  if (mobile) {
    data.mobile_confirmed = 1
  }

  // 触发 beforeRegister 钩子
  const beforeRegister = this.hooks.beforeRegister
  let userRecord = data
  if (beforeRegister) {
    userRecord = await beforeRegister({
      userRecord,
      clientInfo: this.getUniversalClientInfo()
    })
  }

  userRecord = { ...normalizeIdentifiers(userRecord), account_type: [accountType] }
  delete userRecord.is_root
  await require('../../lib/utils/user-number').createNumberedUser(
    { ...userRecord, ...createFields(authorized, data.register_date) },
    record => userCollection.add(record)
  )
  return {
    errCode: 0,
    errMsg: ''
  }
}
