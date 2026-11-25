const {
  userCollection,
  LOG_TYPE
} = require('../../common/constants')
const {
  ERROR
} = require('../../common/error')
const {
  findUser
} = require('./account')
const {
  getValidInviteCode,
  generateInviteInfo
} = require('./fission')
const {
  logout
} = require('./logout')
const PasswordUtils = require('./password')
const { registerRootWithApp } = require('./register-root')
const { PLATFORM_TENANT_ID } = require('./platform-tenant')
const { createFields } = require('./record-metadata')
const { assertRegistration, registrationType, normalizeIdentifiers } = require('./account-policy')
const { 
  merge
} = require('../npm/index')

async function realPreRegister (params = {}) {
  assertRegistration(this)
  const {
    user
  } = params
  const {
    userMatched
  } = await findUser({
    userQuery: user,
    tenantId: this.entryTenantId,
    uniqueAccountType: registrationType(this)
  })
  if (userMatched.length > 0) {
    throw {
      errCode: ERROR.ACCOUNT_EXISTS
    }
  }
}

async function preRegister (params = {}) {
  try {
    await realPreRegister.call(this, params)
  } catch (error) {
    await this.middleware.uniIdLog({
      success: false,
      type: LOG_TYPE.REGISTER
    })
    throw error
  }
}

async function preRegisterWithPassword (params = {}) {
  const {
    user,
    password
  } = params
  await preRegister.call(this, {
    user
  })
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
  const extraData = {
    password: passwordHash,
    password_secret_version: version
  }
  return {
    user,
    extraData
  }
}

async function thirdPartyRegister ({
  user = {}
} = {}) {
  return {
    mobileConfirmed: !!(user.mobile && user.mobile_confirmed) || false,
    emailConfirmed: !!(user.email && user.email_confirmed) || false
  }
}

async function postRegister (params = {}) {
  assertRegistration(this)
  const {
    user,
    extraData = {},
    isThirdParty = false,
    inviteCode
  } = params
  const {
    appId,
    appName,
    appVersion,
    appVersionCode,
    channel,
    scene,
    clientIP,
    osName
  } = this.getUniversalClientInfo()
  const uniIdToken = this.getUniversalUniIdToken()

  merge(user, extraData)

  const registerChannel = channel || scene
  user.register_env = {
    appid: appId || '',
    uni_platform: this.clientPlatform || '',
    os_name: osName || '',
    app_name: appName || '',
    app_version: appVersion || '',
    app_version_code: appVersionCode || '',
    channel: registerChannel ? registerChannel + '' : '', // channel可能为数字，统一存为字符串
    client_ip: clientIP || ''
  }

  const registeredAt = Date.now()
  user.register_date = registeredAt
  user.dcloud_appid = [appId]

  if (user.username) {
    user.username = user.username.trim()
  }
  if (user.email) {
    user.email = user.email.toLowerCase()
  }

  const {
    autoSetInviteCode, // 注册时自动设置邀请码
    forceInviteCode, // 必须有邀请码才允许注册，注意此逻辑不可对admin生效
    userRegisterDefaultRole // 用户注册时配置的默认角色
  } = this.config
  if (autoSetInviteCode) {
    user.my_invite_code = await getValidInviteCode()
  }

  // 如果用户注册默认角色配置存在且不为空数组
  if (userRegisterDefaultRole && userRegisterDefaultRole.length) {
    // 将用户已有的角色和配置的默认角色合并成一个数组，并去重
    user.role = Array.from(new Set([...(user.role || []), ...userRegisterDefaultRole]))
  }

  const isAdmin = (this.entryTenantId ?? PLATFORM_TENANT_ID) === PLATFORM_TENANT_ID && user.role?.includes('admin')

  if (forceInviteCode && !isAdmin && !inviteCode) {
    throw {
      errCode: ERROR.INVALID_INVITE_CODE
    }
  }

  if (inviteCode) {
    const {
      inviterUid,
      inviteTime
    } = await generateInviteInfo({
      inviteCode
    })
    user.inviter_uid = inviterUid
    user.invite_time = inviteTime
  }

  if (uniIdToken) {
    try {
      await logout.call(this)
    } catch (error) { }
  }

  const beforeRegister = this.hooks.beforeRegister
  let userRecord = user
  if (beforeRegister) {
    userRecord = await beforeRegister({
      userRecord,
      clientInfo: this.getUniversalClientInfo()
    })
  }

  await realPreRegister.call(this, { user: userRecord })
  userRecord = { ...normalizeIdentifiers(userRecord), account_type: registrationType(this) }
  if (this.getMethodName() === 'registerAdmin') {
    // Server-owned fields are applied after hooks and cannot be supplied by clients.
    userRecord.is_root = true
    userRecord.role = [...new Set([...(userRecord.role || []), 'admin'])]
    userRecord.status = 0
    userRecord.dcloud_appid = ['*']
  } else {
    delete userRecord.is_root
    userRecord.role = []
  }
  const record = { ...userRecord,
    tenant_id: this.entryTenantId || PLATFORM_TENANT_ID,
    ...createFields(undefined, registeredAt) }
  const { id: uid } = await (this.getMethodName() === 'registerAdmin'
    ? registerRootWithApp(uniCloud.database(), record, this.getUniversalClientInfo(), params.applicationName, params.applicationType)
    : userCollection.add(record))

  const createTokenRes = await this.uniIdCommon.createToken({
    uid
  })

  const {
    errCode,
    token,
    tokenExpired
  } = createTokenRes

  if (errCode) {
    throw createTokenRes
  }

  await this.middleware.uniIdLog({
    data: {
      user_id: uid
    },
    type: LOG_TYPE.REGISTER
  })

  return {
    errCode: 0,
    uid,
    newToken: {
      token,
      tokenExpired
    },
    ...(
      isThirdParty
        ? thirdPartyRegister({
          user: {
            ...userRecord,
            _id: uid
          }
        })
        : {}
    ),
    passwordConfirmed: !!userRecord.password
  }
}

module.exports = {
  preRegister,
  preRegisterWithPassword,
  postRegister
}
