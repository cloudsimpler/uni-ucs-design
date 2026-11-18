let uniIdConfig;
let uniPayConfig;
try {
  uniIdConfig = require("../uni-id/config.json");
} catch (err) {
  console.error("配置文件：uniCloud/cloudfunctions/common/uni-config-center/uni-id/config.json 编译错误，请检查！↓↓↓请查看下方的错误提示↓↓↓", err.name, err.message, err);
  throw new Error("配置文件：uniCloud/cloudfunctions/common/uni-config-center/uni-id/config.json 编译错误，请检查！↑↑↑请查看上方的错误提示↑↑↑");
}

try {
  uniPayConfig = require("../uni-pay/config.js");
} catch (err) {
  console.error("配置文件：uniCloud/cloudfunctions/common/uni-config-center/uni-pay/config.js 编译错误，请检查！↓↓↓请查看下方的错误提示↓↓↓", err.name, err.message, err);
  throw new Error("配置文件：uniCloud/cloudfunctions/common/uni-config-center/uni-pay/config.js 编译错误，请检查！↑↑↑请查看上方的错误提示↑↑↑");
}

module.exports = {
  "uni": uniIdConfig,
  "uni-pay": uniPayConfig,
  "vk": {
    "system": {
      // 若serviceShutdow:true，则所有云函数无法访问（适用于需要临时关闭后端服务的情况，如迁移数据）
      // 注意：本地调试时，需要重新启动本地服务才能生效。
      "serviceShutdown": false,
      "serviceShutdownDescription": "系统维护中，预计2小时恢复!",
      // 云函数默认时区（中国为8）
      "targetTimezone": 8,
    },
    // 服务端加密的密钥
    "crypto": {
      "aes": "dad4c0cb88c7d005bc5e844b8e79a9f0", // 对称加密的密钥，长度固定32位（此处建议修改成自己的密钥）
    },
    // 客户端加密通信配置
    "clientCrypto": {
      "expTime": 60, // 同一个请求过期时间，单位秒（可防止重放攻击）取值范围：5 ~ 3600（特别注意：此值如果设置太小，可能会影响正常用户的请求）
    },
    // 当 context 内的下面值为空时，赋予默认的值（主要用于解决云函数 URL 后的默认 APPID 问题。
    "context": {
      "APPID": "", // 默认 dcloud_appid
      "PLATFORM": "h5", // 可选项 h5、mp-weixin、app-plus、mp-alipay
      "LOCALE": "zh-Hans", // 默认语言
      "CLIENTIP": "127.0.0.1", // 默认客户端IP（主要用于解决本地调试无ip的问题）
    },
    "service": {
      // 邮箱发送服务
      "email": {
        "codeExpiresIn": 180, // 邮件验证码有效期（单位秒）
        // qq邮箱参数配置
        "qq": {
          "host": "smtp.qq.com",
          "port": 465,
          "secure": true,
          "auth": {
            "user": "你的邮箱@qq.com",
            "pass": "邮箱授权码",
          },
        },
        // 163邮箱配置
        "163": {
          "host": "smtp.163.com",
          "port": 465,
          "secure": true,
          "auth": {
            "user": "",
            "pass": "",
          },
        },
      },
      // 日志服务
      "log": {
        // 用户登录日志
        "login": {
          "status": true, // 是否开启用户登录日志
        },
      },
      // 短信服务
      "sms": {
        // 阿里云短信服务
        "aliyun": {
          "enable": false, // 是否使用阿里云短信代替unicloud短信发送短信验证码
          "accessKeyId": "", // 短信密钥key
          "accessKeySecret": "", // 短信密钥secret
          "signName": "", // 默认签名
          "templateCode": {
            "verifyCode": "", // 验证码短信模板 - 配合uni-id需要
          },
        },
      },
      // 开放平台api
      "openapi": {
        // 百度开放平台 (主要用于身份证识别,营业执照识别等API)
        // API Key申请地址：https://cloud.baidu.com/doc/OCR/s/rk3h7xzck 点击右上角注册
        "baidu": {
          "appid": "", // 对应的API Key
          "appsecret": "", // 对应的Secret Key
        },
      },
      // 云储存相关配置
      "cloudStorage": {
        /**
         * vk.uploadFile 接口默认使用哪个存储
         * unicloud 空间内置存储（默认）
         * extStorage 扩展存储
         */
        "defaultProvider": "unicloud",
        // 空间内置存储
        "unicloud": {
          // 暂无配置项
        },
        // 扩展存储配置
        "extStorage": {
          "provider": "qiniu", // qiniu: 扩展存储-七牛云
          "domain": "", // 自定义域名，如：cdn.example.com（填你在扩展存储绑定的域名）
          "bucketName": "", // 存储空间名称，可不填，不填则使用当前空间绑定的存储空间
          "bucketSecret": "", // 存储空间密钥，可不填，不填则使用当前空间绑定的存储空间
          "endpoint": {
            "upload": "", // 上传接口的代理地址，在国内上传无需填写
          },
        },
      },
    },
    "db": {
      "unicloud": {
        "maxLimit": 1000, // 最大limit限制(目前腾讯云最大1000,阿里云最大1000)
        "cancelAddTime": false, // 取消 vk.baseDao.add 执行【添加】时自动生成 _add_time 和 _add_time_str
        "cancelAddTimeStr": false, // 仅取消 vk.baseDao.add 执行【添加】时自动生成的 _add_time_str，若已设置 cancelAddTime 为true，则 cancelAddTimeStr 也会强制为true
        "getTableData": {
          "sortArr": [{ "name": "_add_time", "type": "desc" }], // vk.baseDao.getTableData 默认排序规则 vk.db.unicloud.getTableData.sortArr
        },
      },
    },
    "cacheManage": {
      /**
       * 可选 db、redis
       * db 使用空间内置数据库作为缓存
       * redis 使用Redis数据库作为缓存
       */
      "mode": "db",
    },
    // 其他小程序的密钥 当需要多个小程序绑定同一服务空间，并调用小程序服务端API时需要填写
    "oauth": {
      // 微信（含小程序\公众号\APP）
      "weixin": {
        // 密钥列表
        "list": [
          { "appid": "", "appsecret": "" },
          { "appid": "", "appsecret": "" },
        ],
      },
      // 支付宝小程序
      "alipay": {
        // 密钥列表
        "list": [
          { "appid": "", "privateKey": "" },
          { "appid": "", "privateKey": "" },
        ],
      },
      // qq小程序
      "qq": {
        // 密钥列表
        "list": [
          { "appid": "", "appsecret": "" },
          { "appid": "", "appsecret": "" },
        ],
      },
      // 抖音小程序
      "toutiao": {
        // 密钥列表
        "list": [
          { "appid": "", "appsecret": "" },
          { "appid": "", "appsecret": "" },
        ],
      },
    },
  },
};
