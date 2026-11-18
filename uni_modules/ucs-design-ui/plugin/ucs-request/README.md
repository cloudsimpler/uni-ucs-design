# ucs-request

面向 uni-app 与 uni-app-x 蒸汽模式的 Axios 风格 JS 请求库。纯 ESM、零第三方运行依赖。旧版 uni-app-x VDOM 原生编译不在支持范围。当前已通过模拟 API 测试，HBuilderX 编译及各平台真机验证尚未完成。

```javascript
import { create } from '@/uni_modules/ucs-design-ui/plugin/ucs-request/index.js'

const http = create({ baseURL: 'https://api.example.com', timeout: 15000 })
const response = await http.get('/users', { params: { page: 1, enabled: false } })
console.log(response.data)
await http.post('/users', { name: '张三' })
```

默认导出是实例；支持 `request/get/delete/head/options/post/put/patch/upload/download/create`。实例不是可调用函数，与 Axios 不完全兼容。

## 配置与响应

- 本次配置覆盖默认配置；`headers` 忽略大小写合并，`null/undefined` 删除对应字段；`nativeOptions` 浅合并。其余字段直接覆盖，不深度合并。创建实例、派生实例及合并单次请求时，递归复制普通对象和数组，避免跨实例或拦截器修改污染默认值。函数、Task、Signal、ArrayBuffer 等特殊对象及 transport 实现保留引用。
- `params` 放 URL，数组采用重复键编码，忽略 null/undefined，保留 0/false/空字符串。嵌套对象 JSON 编码；可用 `paramsSerializer` 自定义。GET/HEAD 不接受 `data`。
- 普通对象请求体默认 JSON；支持显式 `application/x-www-form-urlencoded`。复杂表单请自行序列化。ArrayBuffer 透传；Uint8Array 等 TypedArray 和 DataView 按 byteOffset/byteLength 复制为独立 ArrayBuffer，只发送视图覆盖的字节，具体支持依平台；其他 Content-Type 的对象请自行序列化。
- `responseType: 'json' | 'text' | 'arraybuffer'`，默认 json。JSON 字符串严格解析，非空非法 JSON 拒绝，空响应保持空字符串。HTTP 错误也先解析响应体。
- 默认 2xx 成功；`validateStatus(status)` 可覆盖，`null` 接受所有状态（含平台未提供状态）。不解释业务 code。
- 未设置 `timeout` 时采用底层默认值。`nativeOptions` 可设置 withCredentials、sslVerify、fileType 等平台选项；库管理的 URL、header、方法、请求体、响应类型、文件字段、超时、回调不能通过它覆盖。平台扩展能力以官方兼容表为准。
- 返回 `{ data, status, headers, cookies, config, raw }`。缺失的原生字段保持 undefined；无 statusText。响应拦截器可改变返回值，此时自行同步调整业务类型声明。

```javascript
const id = http.interceptors.request.use(async config => config)
http.interceptors.request.eject(id)
http.interceptors.response.use(response => response, error => Promise.reject(error))
```

请求拦截器后注册先执行；响应拦截器先注册先执行。支持 Promise、抛错及错误恢复；每次请求使用拦截器快照。拦截器应返回有效配置。不要在拦截器中取消或更换已有 signal。

## 上传、下载与取消

```javascript
await http.upload('/files', {
  filePath: '/local/avatar.png', name: 'file',
  formData: { category: 'avatar' },
  onUploadProgress: event => console.log(event.loaded, event.total, event.progress)
})
const result = await http.download('/files/report.pdf', {
  onDownloadProgress: event => console.log(event.progress)
})
console.log(result.data.tempFilePath)
```

仅支持单文件上传，multipart Content-Type 由底层生成。下载返回实际路径及原始结果，不自动持久保存。loaded、total 在原生事件未提供对应字节数时为 undefined；progress 在已加载字节数或有效总长度未知时为 undefined，否则为 loaded / total。缺少原生进度能力时不会模拟进度。

可以传入运行环境可用的 AbortSignal；库不提供 AbortController polyfill。也可以用 `onTask(task)` 获取原生任务进行 abort。直接原生 abort 的错误码依平台，只有 signal 取消保证 ERR_CANCELED。任务结束后不要继续操作保存的原生对象。onTask 应只注册监听，不抛错；回调异常会拒绝请求并中止任务。

错误类 `UcsRequestError` 包含 code、config、response、cause。code 包括 ERR_BAD_CONFIG、ERR_NETWORK、ECONNABORTED（超时）、ERR_CANCELED、ERR_HTTP_STATUS、ERR_BAD_RESPONSE、ERR_CALLBACK。`isCancel(error)` 检查 signal 取消；原生错误完整保留在 cause。

鉴权逻辑由业务通过异步拦截器自行实现，库不约定凭证字段、请求头格式、刷新接口或登录失效行为。

## 本地验证

在项目根目录运行：

```shell
node --experimental-vm-modules uni_modules/ucs-design-ui/plugin/ucs-request/tests/run.cjs
```

之后需在目标 HBuilderX 版本中验证真实请求、JSON/二进制响应、HTTP 异常、上传下载进度、取消。Node 模拟通过不能替代真机验证。
