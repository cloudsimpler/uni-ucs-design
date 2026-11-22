const {
  dbCmd,
  verifyCollection
} = require('../../common/constants')
const {
  ERROR
} = require('../../common/error')
const {
  getVerifyCode
} = require('../../common/utils')
const { tenantWhere } = require('../../module/admin/tenant-scope')
const { PLATFORM_TENANT_ID } = require('./platform-tenant')
const scopedCode = (context, filter) => dbCmd.and([filter, tenantWhere({ command: dbCmd }, context?.entryTenantId || PLATFORM_TENANT_ID)])

async function setVerifyCode ({
  mobile,
  email,
  code,
  expiresIn,
  scene
} = {}) {
  const now = Date.now()
  const record = {
    tenant_id: this.entryTenantId || PLATFORM_TENANT_ID,
    mobile,
    email,
    scene,
    code: code || getVerifyCode(),
    state: 0,
    ip: this.getUniversalClientInfo().clientIP,
    created_date: now,
    expired_date: now + expiresIn * 1000
  }
  await verifyCollection.add(record)
  return {
    errCode: 0
  }
}

async function setEmailVerifyCode ({
  email,
  code,
  expiresIn,
  scene
} = {}) {
  email = email && email.trim()
  if (!email) {
    throw {
      errCode: ERROR.INVALID_EMAIL
    }
  }
  email = email.toLowerCase()
  return setVerifyCode.call(this, {
    email,
    code,
    expiresIn,
    scene
  })
}

async function setMobileVerifyCode ({
  mobile,
  code,
  expiresIn,
  scene
} = {}) {
  mobile = mobile && mobile.trim()
  if (!mobile) {
    throw {
      errCode: ERROR.INVALID_MOBILE
    }
  }
  return setVerifyCode.call(this, {
    mobile,
    code,
    expiresIn,
    scene
  })
}

async function verifyEmailCode ({
  email,
  code,
  scene
} = {}) {
  email = email && email.trim()
  if (!email) {
    throw {
      errCode: ERROR.INVALID_EMAIL
    }
  }
  email = email.toLowerCase()
  const {
    data: codeRecord
  } = await verifyCollection.where(scopedCode(this, {
    email,
    scene,
    code,
    state: 0,
    expired_date: dbCmd.gt(Date.now())
  })).limit(1).get()

  if (codeRecord.length === 0) {
    throw {
      errCode: ERROR.EMAIL_VERIFY_CODE_ERROR
    }
  }
  const consumed = await verifyCollection.where({ _id: codeRecord[0]._id, state: 0, expired_date: dbCmd.gt(Date.now()) }).update({
    state: 1
  })
  if (consumed.updated !== 1) throw { errCode: ERROR.EMAIL_VERIFY_CODE_ERROR }
  return {
    errCode: 0
  }
}

async function verifyMobileCode ({
  mobile,
  code,
  scene
} = {}) {
  mobile = mobile && mobile.trim()
  if (!mobile) {
    throw {
      errCode: ERROR.INVALID_MOBILE
    }
  }
  const {
    data: codeRecord
  } = await verifyCollection.where(scopedCode(this, {
    mobile,
    scene,
    code,
    state: 0,
    expired_date: dbCmd.gt(Date.now())
  })).limit(1).get()

  if (codeRecord.length === 0) {
    throw {
      errCode: ERROR.MOBILE_VERIFY_CODE_ERROR
    }
  }

  const consumed = await verifyCollection.where({ _id: codeRecord[0]._id, state: 0, expired_date: dbCmd.gt(Date.now()) }).update({
    state: 1
  })
  if (consumed.updated !== 1) throw { errCode: ERROR.MOBILE_VERIFY_CODE_ERROR }
  return {
    errCode: 0
  }
}

module.exports = {
  verifyEmailCode,
  verifyMobileCode,
  setEmailVerifyCode,
  setMobileVerifyCode
}
