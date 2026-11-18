export type Headers = Record<string, string | number | boolean | null | undefined>
export interface CancelSignal {
  readonly aborted: boolean
  addEventListener(type: 'abort', listener: () => void): void
  removeEventListener(type: 'abort', listener: () => void): void
}
export interface NativeTask {
  abort(): void
  onProgressUpdate?: (listener: (event: any) => void) => void
}
export interface ProgressEvent {
  /** Undefined when the native event does not provide a byte count. */
  loaded?: number
  /** Undefined when the native event does not provide a total. */
  total?: number
  /** Fraction from 0 to 1; undefined when total is unknown. */
  progress?: number
  raw: any
}
export interface RequestConfig {
  url?: string
  baseURL?: string
  method?: string
  kind?: 'request' | 'upload' | 'download'
  params?: Record<string, any>
  paramsSerializer?: (params: Record<string, any>) => string
  data?: any
  headers?: Headers
  timeout?: number
  responseType?: 'json' | 'text' | 'arraybuffer'
  validateStatus?: ((status: number | undefined) => boolean) | null
  signal?: CancelSignal
  filePath?: string
  name?: string
  formData?: Record<string, any>
  nativeOptions?: Record<string, any>
  onTask?: (task: NativeTask) => void
  onUploadProgress?: (event: ProgressEvent) => void
  onDownloadProgress?: (event: ProgressEvent) => void
  /** Optional injectable uni-compatible API, useful for tests. */
  transport?: Record<string, Function>
  [key: string]: any
}
export interface Response<T = any> {
  data: T
  status?: number
  headers?: Headers
  cookies?: string[]
  config: RequestConfig
  raw: any
}
export interface DownloadResult { tempFilePath: string; filePath?: string }
export class UcsRequestError extends Error {
  constructor(message: string, code: string, config?: RequestConfig, response?: Response, cause?: any)
  code: string
  config?: RequestConfig
  response?: Response
  cause?: any
}
export function isCancel(error: any): boolean
export interface InterceptorManager<T> {
  use(fulfilled?: (value: T) => any, rejected?: (error: any) => any): number
  eject(id: number): void
  clear(): void
}
export class UcsRequest {
  constructor(defaults?: RequestConfig)
  defaults: RequestConfig
  interceptors: { request: InterceptorManager<RequestConfig>; response: InterceptorManager<Response> }
  request<T = any>(config: RequestConfig): Promise<Response<T>>
  request<T = any>(url: string, config?: RequestConfig): Promise<Response<T>>
  get<T = any>(url: string, config?: RequestConfig): Promise<Response<T>>
  delete<T = any>(url: string, config?: RequestConfig): Promise<Response<T>>
  head<T = any>(url: string, config?: RequestConfig): Promise<Response<T>>
  options<T = any>(url: string, config?: RequestConfig): Promise<Response<T>>
  post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<Response<T>>
  put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<Response<T>>
  patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<Response<T>>
  upload<T = any>(url: string, config: RequestConfig): Promise<Response<T>>
  download(url: string, config?: RequestConfig): Promise<Response<DownloadResult>>
  create(config?: RequestConfig): UcsRequest
}
export function createInstance(config?: RequestConfig): UcsRequest
export const create: typeof createInstance
declare const http: UcsRequest
export default http
