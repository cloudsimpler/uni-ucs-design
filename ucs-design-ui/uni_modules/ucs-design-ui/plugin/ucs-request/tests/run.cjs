const fs = require('fs')
const path = require('path')
const vm = require('vm')
const assert = require('assert/strict')
const cache = new Map()
function load(file) {
  if (!cache.has(file)) {
    const source = fs.readFileSync(file, 'utf8')
    assert(!/require\s*\(|module\.exports|\bexports[.[]/.test(source), file)
    cache.set(file, new vm.SourceTextModule(source, { identifier: file }))
  }
  return cache.get(file)
}
async function entry(relative) {
  const module = load(path.resolve(__dirname, '..', relative))
  await module.link((specifier, parent) => {
    assert(specifier.startsWith('./') || specifier.startsWith('../'))
    return load(path.resolve(path.dirname(parent.identifier), specifier))
  })
  await module.evaluate()
  return module.namespace
}
const tick = () => new Promise(resolve => setImmediate(resolve))
function deferred() { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no }); return { promise, resolve, reject } }
function mock(responder) {
  const calls = []
  const api = {}
  for (const name of ['request', 'uploadFile', 'downloadFile']) {
    api[name] = options => {
      const call = { name, options, aborts: 0 }
      calls.push(call)
      const task = { abort() { call.aborts++; options.fail({ errMsg: 'abort' }); options.complete() }, onProgressUpdate(fn) { call.progress = fn } }
      queueMicrotask(() => { if (responder) responder(call) })
      return task
    }
  }
  return { api, calls }
}
function success(call, data = '{"ok":true}', statusCode = 200) { call.options.success({ data, statusCode }); call.options.complete() }

;(async () => {
  const { create, isCancel } = await entry('index.js')
  let count = 0
  async function test(name, run) { await run(); count++; console.log('PASS ' + name) }
  await test('URL, zero/false, repeated params, body and headers', async () => {
    const m = mock(call => success(call))
    const http = create({ baseURL: 'https://example.com/', headers: { Authorization: 'old', 'X-Test': 'yes' }, transport: m.api })
    await http.get('/users?x=1#fragment', { params: { a: 0, b: false, c: ['x', 'y'], d: null }, headers: { authorization: 'new', 'x-test': null } })
    assert.equal(m.calls[0].options.url, 'https://example.com/users?x=1&a=0&b=false&c=x&c=y')
    assert.deepEqual(m.calls[0].options.header, { authorization: 'new' })
    const data = { a: 0 }
    await http.post('/users', data)
    assert.equal(m.calls[1].options.data, '{"a":0}')
    assert.deepEqual(data, { a: 0 })
    await http.post('/form', { enabled: false }, { headers: { 'content-type': 'application/x-www-form-urlencoded' } })
    assert.equal(m.calls[2].options.data, 'enabled=false')
    await assert.rejects(http.get('/bad', { data: {} }), error => error.code === 'ERR_BAD_CONFIG')
  })
  await test('async interceptors, order, eject, clear, isolation and rejection', async () => {
    const order = []
    const m = mock(call => { order.push('send'); success(call) })
    const http = create({ transport: m.api })
    http.interceptors.request.use(async config => { await tick(); order.push('first'); return config })
    http.interceptors.request.use(config => { order.push('second'); return config })
    const removed = http.interceptors.request.use(() => { throw Error('removed') })
    http.interceptors.request.eject(removed)
    http.interceptors.response.use(response => { order.push('response'); return response })
    await http.get('/test')
    assert.deepEqual(order, ['second', 'first', 'send', 'response'])
    assert.equal(http.create().interceptors.request.handlers.length, 0)
    http.interceptors.request.clear()
    http.interceptors.request.use(() => { throw Error('blocked') })
    await assert.rejects(http.get('/blocked'), /blocked/)
    assert.equal(m.calls.length, 1)
  })
  await test('HTTP, JSON, timeout and binary responses', async () => {
    const m = mock(call => success(call, '{"reason":"denied"}', 401))
    const http = create({ transport: m.api })
    await assert.rejects(http.get('/401'), error => error.code === 'ERR_HTTP_STATUS' && error.response.data.reason === 'denied')
    assert.equal((await http.get('/401', { validateStatus: null })).status, 401)
    const bad = create({ transport: mock(call => success(call, 'not json')).api })
    await assert.rejects(bad.get('/bad'), error => error.code === 'ERR_BAD_RESPONSE')
    assert.equal((await bad.get('/text', { responseType: 'text' })).data, 'not json')
    const binary = new ArrayBuffer(4)
    assert.equal((await create({ transport: mock(call => success(call, binary)).api }).get('/binary', { responseType: 'arraybuffer' })).data, binary)
    await assert.rejects(create({ transport: mock(call => call.options.fail({ errCode: 5, errMsg: 'timeout' })).api }).get('/timeout'), error => error.code === 'ECONNABORTED' && error.cause.errCode === 5)
  })
  await test('upload/download fields, progress and multipart header', async () => {
    const m = mock()
    const http = create({ headers: { 'Content-Type': 'application/json' }, transport: m.api })
    let progress
    const pending = http.upload('/upload', { filePath: '/file', name: 'file', onUploadProgress: event => { progress = event } })
    await tick()
    assert.equal(m.calls[0].name, 'uploadFile')
    assert.equal(m.calls[0].options.header['content-type'], undefined)
    m.calls[0].progress({ totalBytesSent: 5, totalBytesExpectedToSend: 10 })
    assert.equal(progress.progress, 0.5)
    success(m.calls[0])
    await pending
    const download = http.download('/download')
    await tick()
    assert.equal(m.calls[1].name, 'downloadFile')
    m.calls[1].options.success({ statusCode: 200, apFilePath: '/actual' })
    m.calls[1].options.complete()
    assert.equal((await download).data.tempFilePath, '/actual')
  })
  await test('cancel before, during interceptors, during transfer and after completion', async () => {
    const m = mock()
    const http = create({ transport: m.api })
    const before = new AbortController(); before.abort()
    await assert.rejects(http.get('/before', { signal: before.signal }), isCancel)
    const gate = deferred()
    http.interceptors.request.use(config => gate.promise.then(() => config))
    const waiting = new AbortController()
    const pending = http.get('/waiting', { signal: waiting.signal })
    waiting.abort()
    await assert.rejects(pending, isCancel)
    gate.resolve(); await tick()
    assert.equal(m.calls.length, 0)
    http.interceptors.request.clear()
    const active = new AbortController()
    const request = http.get('/active', { signal: active.signal })
    await tick(); active.abort()
    await assert.rejects(request, isCancel)
    assert.equal(m.calls[0].aborts, 1)
    const done = new AbortController()
    const complete = http.get('/done', { signal: done.signal })
    await tick(); success(m.calls[1]); await complete; done.abort()
    assert.equal(m.calls[1].aborts, 0)
  })
  await test('native options cannot override core fields; instance config stays isolated', async () => {
    const m = mock(call => success(call))
    const parent = create({ headers: { 'x-parent': 'yes' }, transport: m.api })
    const child = parent.create({ headers: { 'x-child': 'yes' } })
    await child.get('/actual', { nativeOptions: { url: '/wrong', header: { wrong: 'yes' }, method: 'POST', success: () => { throw Error('wrong callback') }, withCredentials: true } })
    const options = m.calls[0].options
    assert.equal(options.url, '/actual')
    assert.equal(options.method, 'GET')
    assert.equal(options.withCredentials, true)
    assert.deepEqual(options.header, { 'x-parent': 'yes', 'x-child': 'yes' })
    assert.deepEqual(parent.defaults.headers, { 'x-parent': 'yes' })
  })
  await test('progress failure aborts once and late callbacks are ignored', async () => {
    const m = mock()
    const http = create({ transport: m.api })
    const pending = http.upload('/upload', { filePath: '/file', name: 'file', onUploadProgress() { throw Error('broken progress') } })
    await tick()
    m.calls[0].progress({ totalBytesSent: 1, totalBytesExpectedToSend: 2 })
    await assert.rejects(pending, error => error.code === 'ERR_CALLBACK')
    assert.equal(m.calls[0].aborts, 1)
    success(m.calls[0])
  })
  await test('shared input defaults cannot leak changes across instances or requests', async () => {
    const m = mock(call => success(call))
    const controller = new AbortController()
    const task = { abort() {} }
    const defaults = {
      headers: { Authorization: 'Bearer original' },
      nativeOptions: { withCredentials: false, custom: { values: ['original'] } },
      data: { profile: { name: 'original' } },
      signal: controller.signal,
      transport: m.api,
      customTask: task
    }
    const a = create(defaults)
    const b = create(defaults)
    a.defaults.headers.Authorization = 'Bearer changed'
    a.defaults.nativeOptions.withCredentials = true
    a.defaults.nativeOptions.custom.values[0] = 'changed'
    a.defaults.data.profile.name = 'changed'
    assert.equal(b.defaults.headers.Authorization, 'Bearer original')
    assert.equal(defaults.headers.Authorization, 'Bearer original')
    assert.equal(b.defaults.nativeOptions.withCredentials, false)
    assert.equal(defaults.nativeOptions.custom.values[0], 'original')
    assert.equal(b.defaults.data.profile.name, 'original')
    assert.equal(a.defaults.signal, controller.signal)
    assert.equal(a.defaults.transport, m.api)
    assert.equal(a.defaults.customTask, task)
    b.interceptors.request.use(config => { config.data.profile.name = 'request-only'; return config })
    await b.post('/profile', b.defaults.data)
    assert.equal(m.calls[0].options.data, '{"profile":{"name":"request-only"}}')
    assert.equal(b.defaults.data.profile.name, 'original')
    const child = b.create()
    child.defaults.nativeOptions.custom.values.push('child')
    assert.deepEqual(b.defaults.nativeOptions.custom.values, ['original'])
  })
  await test('nested transport fields are data while the top-level adapter retains identity', async () => {
    const m = mock(call => success(call))
    const input = { data: { transport: { mode: 'original' } }, params: { transport: { page: 1 } }, transport: m.api }
    const parent = create(input)
    const child = parent.create()
    input.data.transport.mode = 'caller'
    child.defaults.data.transport.mode = 'child'
    child.defaults.params.transport.page = 2
    assert.equal(parent.defaults.data.transport.mode, 'original')
    assert.equal(parent.defaults.params.transport.page, 1)
    assert.equal(child.defaults.transport, m.api)
    parent.interceptors.request.use(config => { config.data.transport.mode = 'request'; return config })
    await parent.post('/payload', parent.defaults.data)
    assert.equal(JSON.parse(m.calls[0].options.data).transport.mode, 'request')
    assert.equal(parent.defaults.data.transport.mode, 'original')
  })
  await test('progress preserves unknown byte counts without inventing totals', async () => {
    for (const kind of ['upload', 'download']) {
      const m = mock()
      const events = []
      const progressKey = kind === 'upload' ? 'onUploadProgress' : 'onDownloadProgress'
      const pending = create({ transport: m.api })[kind]('/file', { filePath: '/file', name: 'file', [progressKey]: event => events.push(event) })
      await tick()
      m.calls[0].progress({})
      assert.equal(events[0].loaded, undefined)
      assert.equal(events[0].total, undefined)
      assert.equal(events[0].progress, undefined)
      m.calls[0].progress(kind === 'upload' ? { totalBytesExpectedToSend: 10 } : { totalBytesExpectedToWrite: 10 })
      assert.equal(events[1].loaded, undefined)
      assert.equal(events[1].total, 10)
      assert.equal(events[1].progress, undefined)
      success(m.calls[0])
      await pending
    }
  })
  await test('binary views send only visible bytes as an ArrayBuffer', async () => {
    const m = mock(call => success(call))
    const http = create({ transport: m.api })
    const buffer = new Uint8Array([99, 10, 20, 88]).buffer
    const views = [new Uint8Array(buffer, 1, 2), new DataView(buffer, 1, 2), new Uint8Array(buffer, 2, 0)]
    for (const view of views) {
      await http.post('/binary', view)
      const sent = m.calls[m.calls.length - 1].options.data
      assert(sent instanceof ArrayBuffer)
      assert.equal(sent.byteLength, view.byteLength)
      assert.deepEqual([...new Uint8Array(sent)], [...new Uint8Array(view.buffer, view.byteOffset, view.byteLength)])
    }
    await http.post('/binary', buffer)
    assert.equal(m.calls[m.calls.length - 1].options.data, buffer)
    assert.deepEqual([...new Uint8Array(buffer)], [99, 10, 20, 88])
  })
  await test('multi-layer merging preserves header deletions, native options and payload isolation', () => {
    const { mergeConfig } = cache.get(path.resolve(__dirname, '../core.js')).namespace
    const data = { nested: { value: 'original' } }
    const transport = { request() {} }
    const defaults = { data, transport, headers: { Authorization: 'old', 'X-Default': 'keep' }, nativeOptions: { withCredentials: true, custom: { values: [1] } } }
    const app = { headers: { authorization: 'app', 'X-App': 'yes' }, timeout: 15000 }
    const call = { headers: { AUTHORIZATION: null, 'x-app': undefined }, nativeOptions: { withCredentials: false } }
    const merged = mergeConfig(defaults, app, call)
    assert.deepEqual(merged.headers, { 'x-default': 'keep' })
    assert.equal(merged.timeout, 15000)
    assert.equal(merged.nativeOptions.withCredentials, false)
    assert.equal(merged.transport, transport)
    merged.data.nested.value = 'changed'
    merged.nativeOptions.custom.values.push(2)
    assert.equal(data.nested.value, 'original')
    assert.deepEqual(defaults.nativeOptions.custom.values, [1])
  })
  console.log('\n' + count + ' test groups passed; all imports are local ESM.')
})().catch(error => { console.error(error); process.exitCode = 1 })
