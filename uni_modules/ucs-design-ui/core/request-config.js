import { cloneValue } from '../utils/object.js'

function getContext() {
  let platform
  let buildEnvironment
  // Keep literal expressions so the uni compiler can replace them at build time.
  try { platform = process.env.UNI_PLATFORM } catch (_) {}
  try { buildEnvironment = process.env.NODE_ENV } catch (_) {}
  return { platform, buildEnvironment, runtime: typeof uni === 'undefined' ? null : uni }
}

/** Context injection is internal and lets tests cover platforms without their SDKs. */
export function resolveRequestEnvironment(env, context) {
  if (env === 'development' || env === 'production') return env
  if (env !== 'auto') throw new TypeError('request.env 必须是 auto、development 或 production')
  const { platform, buildEnvironment, runtime } = context || getContext()
  let version
  try {
    if (['mp-weixin', 'mp-alipay', 'mp-qq', 'mp-kuaishou', 'mp-xhs'].includes(platform)) {
      // #ifdef MP-WEIXIN || MP-ALIPAY || MP-QQ || MP-KUAISHOU || MP-XHS
      if (runtime && typeof runtime.getAccountInfoSync === 'function') version = runtime.getAccountInfoSync()?.miniProgram?.envVersion
      // #endif
      if (version === 'develop' || version === 'trial') return 'development'
      if (version === 'release' || (version === 'gray' && platform === 'mp-alipay')) return 'production'
    }
    if (platform === 'mp-toutiao') {
      // #ifdef MP-TOUTIAO
      if (runtime && typeof runtime.getEnvInfoSync === 'function') version = runtime.getEnvInfoSync()?.microapp?.envType
      // #endif
      if (version === 'development' || version === 'preview') return 'development'
      if (version === 'production') return 'production'
    }
  } catch (_) {
    // Missing SDKs, unsupported fields and native errors fall back to build mode.
  }
  // JD has no envVersion: never infer its environment from account information.
  if (buildEnvironment === 'development' || buildEnvironment === 'production') return buildEnvironment
  throw new TypeError('无法确定请求环境，请显式设置 request.env')
}

export function resolveRequestConfig(config, context) {
  const env = resolveRequestEnvironment(config.env, context)
  const key = env === 'production' ? 'productionBaseURL' : 'developmentBaseURL'
  if (!config[key]) throw new TypeError('请配置 request.' + key)
  return { baseURL: config[key], timeout: config.timeout, headers: cloneValue(config.headers) }
}
