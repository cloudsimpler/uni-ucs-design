const {
  verifyCaptcha
} = require('../../lib/utils/captcha')
const {
  EMAIL_SCENE
} = require('../../common/constants')
const {
  ERROR
} = require('../../common/error')
/**
 * 发送邮箱验证码，可用于登录、注册、绑定邮箱、修改密码等操作
 * @tutorial
 * @param {Object} params
 * @param {String} params.email     邮箱
 * @param {String} params.captcha   图形验证码
 * @param {String} params.scene     使用场景
 * @returns
 */
module.exports = async function (params = {}) {
  const schema = {
    email: 'email',
    captcha: 'string',
    scene: 'string'
  }
  this.middleware.validate(params, schema)

  const {
    email,
    captcha,
    scene
  } = params

  if (!(Object.values(EMAIL_SCENE).includes(scene))) {
    throw {
      errCode: ERROR.INVALID_PARAM
    }
  }

  await verifyCaptcha.call(this, {
    scene: 'send-email-code',
    captcha
  })

  // Fixed verification codes require explicit development opt-in.
  const testMode = require('../../config/verification').allowTestVerificationCodes
  if (!testMode && typeof this.hooks.sendEmailCode !== 'function')
    throw { errCode: 'EMAIL_NOT_CONFIGURED', errMsg: '邮件服务尚未配置，请使用账号密码登录或联系管理员' }
  const code = testMode ? '123456' : String(require('crypto').randomInt(100000, 1000000))
  if (!testMode) await this.hooks.sendEmailCode({ email, code, scene, expiresIn: 180 })
  await require('../../lib/utils/verify-code')
    .setEmailVerifyCode.call(this, {
      email,
      code,
      expiresIn: 180,
      scene
    })
  return {
    errCode: 0,
    testMode,
    errMsg: testMode ? '开发测试模式：验证码为 123456' : ''
  }
  // Fixed verification codes require explicit development opt-in.



}
