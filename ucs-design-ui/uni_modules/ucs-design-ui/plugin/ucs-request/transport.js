import { UcsRequestError, buildURL, mergeHeaders, canceled } from './core.js'

export function dispatch(config) {
  return new Promise((resolve, reject) => {
    let task = null
    let settled = false
    const signal = config.signal
    const cleanup = () => {
      if (signal) signal.removeEventListener('abort', abort)
      task = null
    }
    const finish = (error, response) => {
      if (settled) return
      settled = true
      cleanup()
      if (error) reject(error)
      else resolve(response)
    }
    const abort = () => {
      const current = task
      finish(canceled(config))
      if (current && typeof current.abort === 'function') current.abort()
    }
    try {
      if (signal && signal.aborted) { finish(canceled(config)); return }
      const kind = config.kind || 'request'
      if (!['request', 'upload', 'download'].includes(kind)) throw new Error('Unknown transport kind')
      const api = config.transport || (typeof uni !== 'undefined' ? uni : null)
      const methodName = { request: 'request', upload: 'uploadFile', download: 'downloadFile' }[kind]
      if (!api || typeof api[methodName] !== 'function') throw new Error('uni.' + methodName + ' is unavailable')
      const header = mergeHeaders(config.headers)
      const options = { ...config.nativeOptions, url: buildURL(config), header }
      // Callbacks and core fields are owned by this adapter, never nativeOptions.
      delete options.data
      delete options.method
      delete options.dataType
      delete options.responseType
      delete options.files
      delete options.file
      delete options.filePath
      delete options.name
      delete options.formData
      delete options.timeout
      if (config.timeout != null) options.timeout = config.timeout
      const responseType = config.responseType || 'json'
      if (!['json', 'text', 'arraybuffer'].includes(responseType)) throw new Error('Unsupported responseType')
      if (kind === 'request') {
        options.method = (config.method || 'GET').toUpperCase()
        // Parse JSON once in JS for consistent parse errors across platforms.
        options.dataType = 'text'
        options.responseType = responseType === 'arraybuffer' ? 'arraybuffer' : 'text'
        let data = config.data
        if (data != null && ['GET', 'HEAD'].includes(options.method)) throw new Error('Use params for GET/HEAD query parameters')
        const binary = typeof ArrayBuffer !== 'undefined' && (data instanceof ArrayBuffer || ArrayBuffer.isView(data))
        if (binary && ArrayBuffer.isView(data)) {
          // A view can cover only part of a larger buffer. Send exactly that range.
          const bytes = new Uint8Array(data.byteLength)
          bytes.set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength))
          data = bytes.buffer
        }
        if (data != null && typeof data === 'object' && !binary) {
          if (!header['content-type']) header['content-type'] = 'application/json'
          if (/application\/json|\+json/i.test(header['content-type'])) data = JSON.stringify(data)
          else if (/application\/x-www-form-urlencoded/i.test(header['content-type'])) {
            data = Object.keys(data).filter(key => data[key] != null).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(String(data[key]))).join('&')
          } else throw new Error('Serialize data explicitly for this Content-Type')
        }
        options.data = data
      } else if (kind === 'upload') {
        if (!config.filePath || !config.name) throw new Error('upload requires filePath and name')
        if (config.files) throw new Error('Batch upload is not supported; use individual uploads')
        if (responseType === 'arraybuffer') throw new Error('upload does not support arraybuffer responses')
        delete header['content-type']
        options.filePath = config.filePath
        options.name = config.name
        options.formData = config.formData
      } else if (config.filePath != null) options.filePath = config.filePath

      options.success = raw => {
        if (settled) return
        const response = {
          data: kind === 'download' ? { tempFilePath: raw.tempFilePath || raw.apFilePath || raw.filePath, filePath: raw.filePath } : raw.data,
          status: raw.statusCode == null ? undefined : Number(raw.statusCode),
          headers: raw.header == null ? undefined : mergeHeaders(raw.header),
          cookies: raw.cookies,
          config,
          raw
        }
        try {
          if (kind !== 'download' && responseType === 'json' && typeof response.data === 'string' && response.data.trim() !== '') {
            try { response.data = JSON.parse(response.data) }
            catch (cause) { throw new UcsRequestError('Invalid JSON response', 'ERR_BAD_RESPONSE', config, response, cause) }
          }
          const validate = config.validateStatus
          const valid = validate === null || (typeof validate === 'function' ? validate(response.status) : response.status >= 200 && response.status < 300)
          if (!valid) throw new UcsRequestError('HTTP status ' + response.status, 'ERR_HTTP_STATUS', config, response)
          finish(null, response)
        } catch (error) { finish(error) }
      }
      options.fail = cause => {
        const message = cause.errMsg || cause.message || 'Network request failed'
        const timeout = cause.errCode === 5 || /timeout|timed out/i.test(message)
        finish(new UcsRequestError(message, timeout ? 'ECONNABORTED' : 'ERR_NETWORK', config, undefined, cause))
      }
      options.complete = cleanup
      if (signal) {
        signal.addEventListener('abort', abort)
        if (signal.aborted) { abort(); return }
      }
      const created = api[methodName](options)
      if (settled) return
      task = created
      const progress = kind === 'upload' ? config.onUploadProgress : kind === 'download' ? config.onDownloadProgress : null
      if (progress && task && typeof task.onProgressUpdate === 'function') {
        task.onProgressUpdate(raw => {
          if (settled) return
          const loaded = kind === 'upload' ? raw.totalBytesSent : raw.totalBytesWritten
          const total = kind === 'upload' ? raw.totalBytesExpectedToSend : raw.totalBytesExpectedToWrite
          try { progress({ loaded, total, progress: Number.isFinite(loaded) && Number.isFinite(total) && total > 0 ? loaded / total : undefined, raw }) }
          catch (cause) {
            const current = task
            finish(new UcsRequestError('Progress callback failed', 'ERR_CALLBACK', config, undefined, cause))
            if (current) current.abort()
          }
        })
      }
      if (config.onTask) config.onTask(task)
    } catch (cause) {
      const current = task
      finish(cause instanceof UcsRequestError ? cause : new UcsRequestError(cause.message, 'ERR_BAD_CONFIG', config, undefined, cause))
      if (current && typeof current.abort === 'function') current.abort()
    }
  })
}
