import { getRequestConfig } from './config.js'
import { UcsRequest } from '../plugin/ucs-request/index.js'
import { mergeConfig } from '../plugin/ucs-request/core.js'

/** This instance captures application defaults before running request interceptors. */
class ApplicationHttp extends UcsRequest {
  _resolveConfig(config) {
    return mergeConfig(this.defaults, getRequestConfig(), config)
  }
  create(config = {}) {
    return new UcsRequest(mergeConfig(this.defaults, getRequestConfig(), config))
  }
}

export const http = new ApplicationHttp()
