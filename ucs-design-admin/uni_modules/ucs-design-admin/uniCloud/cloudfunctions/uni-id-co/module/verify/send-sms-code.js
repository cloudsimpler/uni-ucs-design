const {
  sendSmsCode
} = require('../../lib/utils/sms')
const {
  verifyCaptcha
} = require('../../lib/utils/captcha')
const {
  SMS_SCENE
} = require('../../common/constants')
const {
  ERROR
} = require('../../common/error')

/**
 * 发送短信验证码
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#send-sms-code
 * @param {Object} params
 * @param {String} params.mobile    手机号
 * @param {String} params.captcha   图形验证码
 * @param {String} params.scene     短信验证码使用场景
 * @returns
 */
module.exports = async function (params = {}) {
  const schema = {
    mobile: 'mobile',
    captcha: 'string',
    scene: 'string'
  }
  this.middleware.validate(params, schema)
  const {
    mobile,
    captcha,
    scene
  } = params
  if (!(Object.values(SMS_SCENE).includes(scene))) {
    throw {
      errCode: ERROR.INVALID_PARAM
    }
  }
  await verifyCaptcha.call(this, {
    scene: 'send-sms-code',
    captcha
  })

  // -- 测试代码
  const {
    templateId
  } = (this.config.service &&
    this.config.service.sms &&
    this.config.service.sms.scene &&
    this.config.service.sms.scene[scene]) || {}
  if (!templateId || !templateId.replace(/[^0-9a-zA-Z]/g, '')) {
    if (!require('../../config/verification').allowTestVerificationCodes)
      throw { errCode: 'SMS_NOT_CONFIGURED', errMsg: '短信服务尚未配置，请使用账号密码登录或联系管理员' }
    await require('../../lib/utils/verify-code')
      .setMobileVerifyCode.call(this, {
        mobile: params.mobile,
        code: '123456',
        expiresIn: 180,
        scene
      })
    return {
      errCode: 0,
      testMode: true,
      errMsg: '开发测试模式：验证码为 123456'
    }
  }
  // -- 测试代码

  return sendSmsCode.call(this, {
    mobile,
    scene
  })
}
