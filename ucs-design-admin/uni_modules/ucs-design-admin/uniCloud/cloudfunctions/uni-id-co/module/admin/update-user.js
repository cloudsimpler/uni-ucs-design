const {
  findUser
} = require('../../lib/utils/account')
const {
  ERROR
} = require('../../common/error')
const {
  userCollection
} = require('../../common/constants')
const PasswordUtils = require('../../lib/utils/password')
const { randomInt } = require('crypto')
const { createUserAdmin } = require('./user-admin')
const { ACCOUNT_TYPE, managementType, accountTypeOf } = require('./account-types')
const { normalizeIdentifiers } = require('../../lib/utils/account-policy')

/**
 * 修改用户
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#update-user
 * @param {Object}  params
 * @param {String}  params.uid            要更新的用户id
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
const { updateFields } = require('../../lib/utils/record-metadata')

module.exports = async function (params = {}) {
  params = normalizeIdentifiers(params)
  const randomReset = ['resetDeveloperPassword', 'resetUserPassword'].includes(this.getMethodName())
  const admin = createUserAdmin({ db: uniCloud.database(), uid: this.authInfo?.uid, appId: this.getUniversalClientInfo().appId, accountType: managementType(this) })
  let authorized
  if (randomReset) {
    authorized = await admin.authorize('resetPassword')
    this.middleware.validate(params, { uid: 'string' })
    const groups = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnpqrstuvwxyz', '23456789', '!@#$%&*+-=?']
    const alphabet = groups.join('')
    const chars = groups.map(group => group[randomInt(group.length)])
    const length = ['medium', 'strong', 'super'].includes(this.config.passwordStrength) ? 8 : 6
    while (chars.length < length) chars.push(alphabet[randomInt(alphabet.length)])
    for (let i = chars.length - 1; i > 0; i--) {
      const j = randomInt(i + 1)
      ;[chars[i], chars[j]] = [chars[j], chars[i]]
    }
    params = { uid: params.uid, password: chars.join('') }
  }
  authorized ||= await admin.authorize(this.getMethodName() === 'setCustomerStatus' ? 'status' : params.password !== undefined && Object.keys(params).every(key => ['uid', 'password'].includes(key)) ? 'resetPassword' : 'update')
  const schema = {
    avatar: { required: false, type: 'string' },
    gender: { required: false, type: 'number' },
    department_id: { required: false, type: 'array<string>' },
    uid: 'string',
    username: { required: false, type: 'username' },
    password: {
      required: false,
      type: 'password'
    },
    authorizedApp: {
      required: false,
      type: 'array<string>'
    }, // 传空数组禁止登录任何应用；不传则保留原有授权。
    nickname: {
      required: false,
      type: 'nickname'
    },
    role: {
      required: false,
      type: 'array<string>'
    },
    mobile: {
      required: false,
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
  const old = await admin.getUser(params.uid)
  await admin.validateChange(params, old, authorized)

  const {
    uid,
    username,
    password,
    authorizedApp,
    nickname,
    role,
    mobile,
    email,
    tags,
    status
  } = params

  // 更新的用户数据字段
  const data = {
    avatar: params.avatar,
    gender: params.gender,
    department_id: params.department_id,
    username,
    dcloud_appid: authorizedApp,
    nickname,
    role,
    mobile,
    email,
    tags,
    status
  }

  const realData = Object.keys(data).reduce((res, key) => {
    const item = data[key]
    if (item !== undefined) {
      res[key] = item
    }
    return res
  }, {})

  // 按修改后的应用范围检查账号和联系方式，保持与 uni-id 的多应用匹配规则一致。
  if (username !== undefined || mobile !== undefined || email !== undefined || authorizedApp !== undefined) {
    const identifiers = { username: username ?? old.username, mobile: mobile ?? old.mobile, email: email ?? old.email }
    if (Object.values(identifiers).some(Boolean)) {
      const { userMatched } = await findUser({
        userQuery: identifiers,
        authorizedApp: authorizedApp ?? old.dcloud_appid ?? [],
        uniqueAccountType: accountTypeOf(old)
      })
      if (userMatched.some(user => user._id !== uid)) {
        throw { errCode: ERROR.ACCOUNT_EXISTS }
      }
    }
  }
  if (password) {
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

    realData.password = passwordHash
    realData.password_secret_version = version
  }

  if (mobile !== undefined && mobile !== old.mobile) realData.mobile_confirmed = mobile ? 1 : 0
  if (email !== undefined && email !== old.email) realData.email_confirmed = email ? 1 : 0
  const sessionInvalidated = admin.sessionChanged(params, old)
  if (sessionInvalidated) realData.token = []
  await require('./root-admin').updateRootAware({ db: uniCloud.database(), uid, data: { ...realData, ...updateFields(authorized) }, current: old })

  return {
    errCode: 0,
    ...(randomReset ? { username: old.username || '', password } : {}),
    requireLogin: uid === this.authInfo.uid && sessionInvalidated
  }
}
