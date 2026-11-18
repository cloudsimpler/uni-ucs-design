const fs = require("fs");
const path = require("path");

// 拼接当前目录下的文件路径
function resolvePath(filePath) {
  return path.join(__dirname, filePath);
}

// 安全读取当前目录下的文件，文件不存在时返回 null
function safeReadFileSync(filePath) {
  const fullPath = resolvePath(filePath);
  if (fs.existsSync(fullPath)) {
    return fs.readFileSync(fullPath);
  }
  return null;
}

module.exports = {
  /**
   * 统一支付回调地址，格式为 "服务空间SpaceID":"URL化完整地址"
   * 回调的云函数地址，建议填 /http/vk-pay，因为vk-pay云函数已经写好了回调处理的逻辑，否则你需要自己写全部的回调逻辑。
   * 原理：插件会自动获取当前运行的空间的	SpaceID，然后在 notifyUrl 配置里找对应匹配的SpaceID后面的回调地址
   */
  "notifyUrl": {
    // 测试环境服务空间
    "mp-33d35e24-c2f3-47b4-80fc-7b23a6666666": "https://fc-mp-33d35e24-c2f3-47b4-80fc-7b23a6666666.next.bspapp.com/http/vk-pay",
    // 线上环境服务空间（如果只有一个服务空间，则只需要配置线上环境服务空间即可）
    "mp-5761d885-11b8-21b2-9122-22afea666666": "https://fc-mp-5761d885-11b8-21b2-9122-22afea666666.next.bspapp.com/http/vk-pay",
  },
  // 此密钥主要用于跨云函数回调或回调java、php等外部系统时的通信密码（建议修改成自己的，最好64位以上，更加安全）
  // 详细介绍：https://vkdoc.fsq.pub/vk-uni-pay/uniCloud/pay-notify.html#特别注意
  "notifyKey": "5fb2cd73c7b53918728417c50762e6d45fb2cd73c7b53918728417c50762e6d4",
  // 自动删除N天前的订单（未付款的订单），若此值设为0，则代表不删除未付款订单，如果你的支付统计需要统计需要统计未付款订单数据，则此处可以填0
  "autoDeleteExpiredOrders": 0, // 0代表永不删除，3代表3天（单位：天）
  // 是否使用当面付接口来代替支付宝app支付（可免去申请支付宝APP支付的接口）
  "alipayAppPayToH5Pay": false,
  // 用户白名单，数组值为uni-id-users表的_id，设置后只有白名单里的用户才能发起支付（此时createPayment接口必须传user_id），主要用于发布测试版时限制只能测试人员支付，避免不必要的支付纠纷
  // "userWhitelist": [],
  /**
   * 微信支付官方商户配置
   * 公共参数说明
   * appId              微信后台的appId
   * secret             微信后台的secret
   * mchId              微信支付的商户id
   * key                微信支付V2版本的api密钥
   * pfx                微信支付V2版本的p12证书（apiclient_cert.p12）（退款需要）配置示例："pfx": safeReadFileSync("wxpay/apiclient_cert.p12"),
   * v3Key              微信支付V3版本的api密钥
   * appCertPath        微信支付V3版本需要用到的证书（apiclient_cert.pem）配置示例："appCertPath": resolvePath('wxpay/apiclient_cert.pem'), // v3需要用到的证书
   * appPrivateKeyPath  微信支付V3版本需要用到的证书（apiclient_key.pem）配置示例："appPrivateKeyPath": resolvePath('wxpay/apiclient_key.pem'), // v3需要用到的证书
   * wxpayPublicKeyPath 微信支付V3版本需要用到的证书（pub_key.pem）配置示例："wxpayPublicKeyPath": resolvePath('wxpay/pub_key.pem'), // v3需要用到的证书 - 微信支付公钥证书（仅限开启了微信支付公钥的商户，若已开通微信支付平台证书的商户可无视此参数或注释掉此参数），详情查看文档 https://vkdoc.fsq.pub/vk-uni-pay/config.html#wxpaypublickeypath
   * wxpayPublicKeyId   微信支付V3版本需要用到的微信支付公钥ID，值为以PUB_KEY_ID_开头的一串字符串（仅限开启了微信支付公钥的商户，若已开通微信支付平台证书的商户可无视此参数或注释掉此参数）
   * version            启用支付的版本 2代表v2版本 3 代表v3版本，默认是3
   * 特别注意：          因node18不支持v2版本的.p12证书，故建议使用v3版本
   */
  "wxpay": {
    // 微信 - 小程序支付（微信支付申请JSAPI支付）
    "mp-weixin": {
      "appId": "", // 小程序的appid
      "secret": "", // 小程序的secret
      "mchId": "", // 微信支付的商户id
      "key": "", // v2的api key
      "pfx": safeReadFileSync("wxpay/apiclient_cert.p12"), // v2需要用到的证书
      "v3Key": "", // v3的api key
      "appCertPath": resolvePath("wxpay/apiclient_cert.pem"), // v3需要用到的证书
      "appPrivateKeyPath": resolvePath("wxpay/apiclient_key.pem"), // v3需要用到的证书
      "wxpayPublicKeyPath": resolvePath("wxpay/pub_key.pem"), // v3需要用到的证书 - 微信支付公钥证书（仅限开启了微信支付公钥的商户，若已开通微信支付平台证书的商户可无视此参数或注释掉此参数），详情查看文档 https://vkdoc.fsq.pub/vk-uni-pay/config.html#wxpaypublickeypath
      "wxpayPublicKeyId": "", // v3需要用到的微信支付公钥ID，值为以PUB_KEY_ID_开头的一串字符串（仅限开启了微信支付公钥的商户，若已开通微信支付平台证书的商户可无视此参数或注释掉此参数）
      "version": 3, // 启用支付的版本 2代表v2版本 3 代表v3版本（因node18不支持v2版本的.p12证书，故建议使用v3版本）
    },
    // 微信 - APP支付（微信支付申请APP支付）
    "app-plus": {
      "appId": "", // 微信开放平台下的移动应用的appid
      "secret": "", // 微信开放平台下的移动应用的secret
      "mchId": "", // 微信支付的商户id
      "key": "", // v2的api key
      "pfx": safeReadFileSync("wxpay/apiclient_cert.p12"), // v2需要用到的证书
      "v3Key": "", // v3的api key
      "appCertPath": resolvePath("wxpay/apiclient_cert.pem"), // v3需要用到的证书
      "appPrivateKeyPath": resolvePath("wxpay/apiclient_key.pem"), // v3需要用到的证书
      "wxpayPublicKeyPath": resolvePath("wxpay/pub_key.pem"), // v3需要用到的证书 - 微信支付公钥证书（仅限开启了微信支付公钥的商户，若已开通微信支付平台证书的商户可无视此参数或注释掉此参数），详情查看文档 https://vkdoc.fsq.pub/vk-uni-pay/config.html#wxpaypublickeypath
      "wxpayPublicKeyId": "", // v3需要用到的微信支付公钥ID，值为以PUB_KEY_ID_开头的一串字符串（仅限开启了微信支付公钥的商户，若已开通微信支付平台证书的商户可无视此参数或注释掉此参数）
      "version": 3, // 启用支付的版本 2代表v2版本 3 代表v3版本（因node18不支持v2版本的.p12证书，故建议使用v3版本）
    },
    // 微信 - H5电脑网站二维码支付（微信支付申请Native支付）
    "h5": {
      "appId": "", // 可以是小程序或公众号或app开放平台下的应用的任意一个appid
      "secret": "", // secret
      "mchId": "", // 微信支付的商户id
      "key": "", // v2的api key
      "pfx": safeReadFileSync("wxpay/apiclient_cert.p12"), // v2需要用到的证书
      "v3Key": "", // v3的api key
      "appCertPath": resolvePath("wxpay/apiclient_cert.pem"), // v3需要用到的证书
      "appPrivateKeyPath": resolvePath("wxpay/apiclient_key.pem"), // v3需要用到的证书
      "wxpayPublicKeyPath": resolvePath("wxpay/pub_key.pem"), // v3需要用到的证书 - 微信支付公钥证书（仅限开启了微信支付公钥的商户，若已开通微信支付平台证书的商户可无视此参数或注释掉此参数），详情查看文档 https://vkdoc.fsq.pub/vk-uni-pay/config.html#wxpaypublickeypath
      "wxpayPublicKeyId": "", // v3需要用到的微信支付公钥ID，值为以PUB_KEY_ID_开头的一串字符串（仅限开启了微信支付公钥的商户，若已开通微信支付平台证书的商户可无视此参数或注释掉此参数）
      "version": 3, // 启用支付的版本 2代表v2版本 3 代表v3版本（因node18不支持v2版本的.p12证书，故建议使用v3版本）
    },
    // 微信 - 公众号支付（微信支付申请JSAPI支付）
    "h5-weixin": {
      "appId": "", // 公众号的appid
      "secret": "", // 公众号的secret
      "mchId": "", // 微信支付的商户id
      "key": "", // v2的api key
      "pfx": safeReadFileSync("wxpay/apiclient_cert.p12"), // v2需要用到的证书
      "v3Key": "", // v3的api key
      "appCertPath": resolvePath("wxpay/apiclient_cert.pem"), // v3需要用到的证书
      "appPrivateKeyPath": resolvePath("wxpay/apiclient_key.pem"), // v3需要用到的证书
      "wxpayPublicKeyPath": resolvePath("wxpay/pub_key.pem"), // v3需要用到的证书 - 微信支付公钥证书（仅限开启了微信支付公钥的商户，若已开通微信支付平台证书的商户可无视此参数或注释掉此参数），详情查看文档 https://vkdoc.fsq.pub/vk-uni-pay/config.html#wxpaypublickeypath
      "wxpayPublicKeyId": "", // v3需要用到的微信支付公钥ID，值为以PUB_KEY_ID_开头的一串字符串（仅限开启了微信支付公钥的商户，若已开通微信支付平台证书的商户可无视此参数或注释掉此参数）
      "version": 3, // 启用支付的版本 2代表v2版本 3 代表v3版本（因node18不支持v2版本的.p12证书，故建议使用v3版本）
    },
    // 微信 - 手机外部浏览器H5支付（微信支付申请H5支付）
    "mweb": {
      "appId": "", // 可以是小程序或公众号或app开放平台下的应用的任意一个appid
      "secret": "", // secret
      "mchId": "", // 微信支付的商户id
      "key": "", // v2的api key
      "pfx": safeReadFileSync("wxpay/apiclient_cert.p12"), // v2需要用到的证书
      "v3Key": "", // v3的api key
      "appCertPath": resolvePath("wxpay/apiclient_cert.pem"), // v3需要用到的证书
      "appPrivateKeyPath": resolvePath("wxpay/apiclient_key.pem"), // v3需要用到的证书
      "wxpayPublicKeyPath": resolvePath("wxpay/pub_key.pem"), // v3需要用到的证书 - 微信支付公钥证书（仅限开启了微信支付公钥的商户，若已开通微信支付平台证书的商户可无视此参数或注释掉此参数），详情查看文档 https://vkdoc.fsq.pub/vk-uni-pay/config.html#wxpaypublickeypath
      "wxpayPublicKeyId": "", // v3需要用到的微信支付公钥ID，值为以PUB_KEY_ID_开头的一串字符串（仅限开启了微信支付公钥的商户，若已开通微信支付平台证书的商户可无视此参数或注释掉此参数）
      // 场景信息，必填
      "sceneInfo": {
        "h5_info": {
          "type": "Wap", // 此值固定Wap
          "wap_url": "https://www.xxxxxx.com", // 你的H5首页地址，必须和你发起支付的页面的域名一致。
          "wap_name": "网站名称", // 你的H5网站名称
        },
      },
      "version": 3, // 启用支付的版本 2代表v2版本 3 代表v3版本（因node18不支持v2版本的.p12证书，故建议使用v3版本）
    },
    // 微信 - 商家转账（固定v3版本）（微信支付申请商家转账接口）
    "transfer": {
      "appId": "", // 可以是小程序或公众号或app开放平台下的应用的任意一个appid
      "mchId": "", // 微信支付的商户id
      "v3Key": "", // api v3密钥
      "appCertPath": resolvePath("wxpay/apiclient_cert.pem"), // 商家应用证书
      "appPrivateKeyPath": resolvePath("wxpay/apiclient_key.pem"), // 商家私钥证书
      "wxpayPublicKeyPath": resolvePath("wxpay/pub_key.pem"), // v3需要用到的证书 - 微信支付公钥证书（仅限开启了微信支付公钥的商户，若已开通微信支付平台证书的商户可无视此参数或注释掉此参数），详情查看文档 https://vkdoc.fsq.pub/vk-uni-pay/config.html#wxpaypublickeypath
      "wxpayPublicKeyId": "", // v3需要用到的微信支付公钥ID，值为以PUB_KEY_ID_开头的一串字符串（仅限开启了微信支付公钥的商户，若已开通微信支付平台证书的商户可无视此参数或注释掉此参数）
      "version": 3, // 转账接口只支持v3版本
    },
    // 微信 - 付款码支付
    "codepay": {
      "appId": "", // 可以是小程序或公众号或app开放平台下的应用的任意一个appid
      "mchId": "", // 微信支付的商户id
      "key": "", // v2的api key
      "pfx": safeReadFileSync("wxpay/apiclient_cert.p12"), // v2需要用到的证书
      "v3Key": "", // v3的api key
      "appCertPath": resolvePath("wxpay/apiclient_cert.pem"), // v3需要用到的证书
      "appPrivateKeyPath": resolvePath("wxpay/apiclient_key.pem"), // v3需要用到的证书
      "wxpayPublicKeyPath": resolvePath("wxpay/pub_key.pem"), // v3需要用到的证书 - 微信支付公钥证书（仅限开启了微信支付公钥的商户，若已开通微信支付平台证书的商户可无视此参数或注释掉此参数），详情查看文档 https://vkdoc.fsq.pub/vk-uni-pay/config.html#wxpaypublickeypath
      "wxpayPublicKeyId": "", // v3需要用到的微信支付公钥ID，值为以PUB_KEY_ID_开头的一串字符串（仅限开启了微信支付公钥的商户，若已开通微信支付平台证书的商户可无视此参数或注释掉此参数）
      "version": 3, // 启用支付的版本 2代表v2版本 3 代表v3版本（因node18不支持v2版本的.p12证书，故建议使用v3版本）
    },
  },
  /**
   * 支付宝官方商户配置
   * 公共参数说明
   * appId                  支付宝开放平台的应用appId
   * privateKey             应用私钥（支付宝商户私钥）
   * alipayPublicCertPath   [证书模式] 支付宝公钥证书路径地址  与之对应的 alipayPublicCertContent 为支付宝公钥证书内容（值可以是字符串也可以是Buffer）
   * alipayRootCertPath     [证书模式] 支付宝根证书路径地址   与之对应的 alipayRootCertContent 为支付宝根证书内容（值可以是字符串也可以是Buffer）
   * appCertPath            [证书模式] 应用证书路径地址      与之对应的 appCertPathContent 为应用证书内容（值可以是字符串也可以是Buffer）
   * alipayPublicKey        [密钥模式] 支付宝公钥（证书模式3个参数，密钥模式1个参数，选一种模式即可，密钥模式不支持转账到支付宝）
   * sandbox                是否沙箱模式 true 沙箱模式 false 正常模式
   */
  "alipay": {
    // 支付宝 - 小程序支付配置（由于uni-id目前只支持密钥模式，所以小程序支付的配置默认也是密钥模式的配置）
    "mp-alipay": {
      "appId": "", // 支付宝小程序appid
      "privateKey": "", // 支付宝商户私钥
      "alipayPublicKey": "", // 支付宝公钥字符串
      "sandbox": false,
    },
    // 支付宝 - APP支付配置
    "app-plus": {
      "appId": "", // 支付宝开放平台的应用appId
      "privateKey": "", // 支付宝商户私钥
      "alipayPublicCertPath": resolvePath("alipay/alipayCertPublicKey_RSA2.crt"), // 支付宝公钥路径
      "alipayRootCertPath": resolvePath("alipay/alipayRootCert.crt"), // 支付宝根证书路径
      "appCertPath": resolvePath("alipay/appCertPublicKey.crt"), // 支付宝商户公钥路径
      "sandbox": false,
    },
    // 支付宝 - H5支付配置（包含：网站二维码、手机H5，需申请支付宝当面付接口权限）
    "h5": {
      "appId": "", // 支付宝开放平台的应用appId
      "privateKey": "", // 支付宝商户私钥
      "alipayPublicCertPath": resolvePath("alipay/alipayCertPublicKey_RSA2.crt"), // 支付宝公钥路径
      "alipayRootCertPath": resolvePath("alipay/alipayRootCert.crt"), // 支付宝根证书路径
      "appCertPath": resolvePath("alipay/appCertPublicKey.crt"), // 支付宝商户公钥路径
      "sandbox": false,
    },
    // 支付宝 - 转账到支付宝等资金转出接口，其中 appCertSn 和 alipayRootCertSn 通过工具获取，工具地址：https://vkunicloud.fsq.pub/getCertSn/
    "transfer": {
      "appId": "", // 支付宝开放平台的应用appId
      "privateKey": "", // 支付宝商户私钥
      "alipayPublicCertPath": resolvePath("alipay/alipayCertPublicKey_RSA2.crt"), // 支付宝商户公钥路径
      "alipayRootCertPath": resolvePath("alipay/alipayRootCert.crt"), // 支付宝根证书路径
      "appCertPath": resolvePath("alipay/appCertPublicKey.crt"), // 支付宝商户公钥路径
      "sandbox": false,
    },
    // 支付宝 - 付款码支付
    "codepay": {
      "appId": "", // 支付宝开放平台的应用appId
      "privateKey": "", // 支付宝商户私钥
      "alipayPublicCertPath": resolvePath("alipay/alipayCertPublicKey_RSA2.crt"), // 支付宝公钥路径
      "alipayRootCertPath": resolvePath("alipay/alipayRootCert.crt"), // 支付宝根证书路径
      "appCertPath": resolvePath("alipay/appCertPublicKey.crt"), // 支付宝商户公钥路径
      "sandbox": false,
    },
  },
  // ios内购相关
  "appleiap": {
    // ios内购支付
    "app-plus": {
      "password": "", // App 专用共享密钥，App 专用共享密钥是用于接收此 App 自动续期订阅收据的唯一代码。如果您要将此 App 转让给其他开发者或不想公开主共享密钥，建议使用 App 专用共享密钥。非自动续订场景不需要此参数
      "timeout": 10000, // 请求超时时间，单位：毫秒
      "receiptExpiresIn": 86400, // ios内购凭据有效期，单位：秒 86400 = 24小时 3600 = 1小时
      "sandbox": true, // 是否是沙箱环境（正式上线时必须配置为false）
    },
  },
  // 微信虚拟支付
  "wxpay-virtual": {
    // 微信 - 小程序支付
    "mp-weixin": {
      "appId": "", // 小程序的appid
      "secret": "", // 小程序的secret
      "mchId": "", // 商户id
      "offerId": "", // 支付应用ID
      "appKey": "", // 现网AppKey（正式环境）
      "sandboxAppKey": "", // 沙箱AppKey
      "rate": 100, // 代币兑换比例，比如1元兑换100代币，那么这里就是100，建议设置为100（需要开通虚拟支付的时候也设置成 1 人民币 = 100 代币）
      "token": "", // 微信小程序通信的token，在开发 - 开发管理 - 消息推送 - Token(令牌)
      "encodingAESKey": "", // 必须43位，微信小程序消息加密密钥，在开发 - 开发管理 - 消息推送 - EncodingAESKey(消息加解密密钥)
      "sandbox": false, // 是否是沙箱环境（注意：沙箱环境异步回调可能有延迟，建议直接正式环境测试）
    },
  },
  /**
   * VksPay商户支付配置
   * 支持个人无需营业执照即可签约开户，正规通道，非市面上的挂机免签。（同时也支持企业签约）
   * 消费者付款资金直接进入您签约的支付宝、微信支付商户号里，支付资金由支付宝、微信支付官方结算，避免二次清算。
   * 开户联系QQ：370725567
   */
  "vkspay": {
    "mchId": "", // 商户号
    "key": "", // 商户key
  },
  // 抖音支付
  "douyin": {
    // 抖音小程序支付，请在支付配置信息中配置URL(服务器地址)为 https://vk-pay的url化地址/vk-pay-notify/
    "mp-toutiao": {
      "appId": "", // 抖音小程序的appId
      "secret": "", // 抖音小程序的secret
      "mchId": "", // 商户id（商户号）
      "salt": "", // SALT，从支付信息 - 支付设置中获取
      "token": "", // Token(令牌)，从支付信息 - 支付设置中获取
      "sandbox": false, // 是否是沙箱环境
    },
  },
  // 华为支付
  "huawei": {
    // 华为 - 元服务支付
    "mp-harmony": {
      "appId": "", // 应用的appId
      "mchId": "", // 商户号
      "mchAuthId": "", // 商户证书编号
      "mchPrivateKey": "", // 商户私钥内容
      "platformPublicKey": "", // 华为支付公钥
      "clientType": "mp-harmony", // 固定 mp-harmony 请勿修改
    },
    // 华为 - APP支付
    "app-harmony": {
      "appId": "", // 应用的appId
      "mchId": "", // 商户号
      "mchAuthId": "", // 商户证书编号
      "mchPrivateKey": "", // 商户私钥内容
      "platformPublicKey": "", // 华为支付公钥
      "clientType": "app-harmony", // 固定 app-harmony 请勿修改
    },
  },
};
