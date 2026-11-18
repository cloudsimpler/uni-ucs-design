import type { DeepReadonly, Ref, ComputedRef } from 'vue'
import type { CancelSignal, ProgressEvent } from './plugin/ucs-request/index.js'

export interface CountdownOptions {
  /** 初始时长 ms，默认 60000；有限非负数。 */
  duration?: number
  /** 状态更新间隔 ms，默认 1000；有限正数。 */
  interval?: number
  autoStart?: boolean
  /** 运行中的一轮到期时同步通知一次；reset/dispose 不触发。 */
  onFinish?: () => void
}
export interface CountdownController {
  remaining: ComputedRef<number>
  /** 剩余毫秒向上取整为秒。 */
  totalSeconds: ComputedRef<number>
  time: ComputedRef<Readonly<{ days: number; hours: number; minutes: number; seconds: number }>>
  running: ComputedRef<boolean>
  finished: ComputedRef<boolean>
  /** 开始或继续；运行中及剩余为 0 时返回 false。 */
  start(): boolean
  pause(): boolean
  /** 显式参数同时成为后续 reset() 的默认时长；不会自动开始。 */
  reset(duration?: number): boolean
  /** 运行时按截止时间立即校准，可由页面 onShow 主动调用。 */
  sync(): boolean
  dispose(): void
}
/** 无 UI，不注册全局显隐事件；组件作用域外使用须手动 dispose。 */
export declare function useCountdown(options?: CountdownOptions): CountdownController

export interface UploadFile {
  path: string
  name?: string
  size?: number
}
export type UploadStatus = 'ready' | 'uploading' | 'success' | 'error' | 'cancelled'
export interface UploadTask<F extends UploadFile, R> {
  readonly id: number
  /** 浅复制、冻结的文件描述；额外的嵌套业务对象仍由调用方管理。 */
  readonly file: Readonly<F>
  readonly status: UploadStatus
  /** 0～1；平台没有进度信息时为 undefined，传输完成不等于业务成功。 */
  readonly progress: number | undefined
  readonly loaded: number | undefined
  readonly total: number | undefined
  readonly result: R | undefined
  readonly error: unknown
}
export interface UploadContext<F extends UploadFile> {
  file: Readonly<F>
  signal: CancelSignal
  onProgress: (event: { loaded?: number; total?: number; progress?: number; raw?: ProgressEvent['raw'] }) => void
}
export interface UploadOptions<F extends UploadFile, R> {
  /** 业务自行校验返回值；必须传递 signal 才能中止真实上传。 */
  upload: (context: UploadContext<F>) => R | Promise<R>
  /** 默认 2，正整数，创建时确定。 */
  concurrency?: number
  /** 默认 false，添加后是否自动排队。 */
  autoUpload?: boolean
}
export type UploadResult<R> =
  | { readonly id: number; readonly success: true; readonly cancelled: false; readonly result: R }
  | { readonly id: number; readonly success: false; readonly cancelled: true }
  | { readonly id: number; readonly success: false; readonly cancelled: false; readonly error: unknown }
export interface UploadController<F extends UploadFile, R> {
  tasks: ComputedRef<readonly UploadTask<F, R>[]>
  uploadingCount: ComputedRef<number>
  /** 全部 ready 任务数，包含尚未 start 的任务。 */
  pendingCount: ComputedRef<number>
  loading: ComputedRef<boolean>
  add(files: readonly F[]): number[]
  /** 无参数启动全部 ready 任务；已有上传复用单项 Promise。 */
  start(id?: number): Promise<UploadResult<R>[]>
  retry(id: number): Promise<UploadResult<R>[]>
  cancel(id: number): boolean
  cancelAll(): void
  remove(id: number): boolean
  clear(): void
  dispose(): void
}
/** 不选择文件、不预设接口字段或 UI；组件作用域外使用须手动 dispose。 */
export declare function useUpload<F extends UploadFile = UploadFile, R = unknown>(options: UploadOptions<F, R>): UploadController<F, R>

export type SelectionKey = string | number
export interface SelectionOptions<T, K extends SelectionKey = SelectionKey> {
  /** 当前选项，筛选或翻页不删除已选键。 */
  items: readonly T[] | Ref<readonly T[]> | (() => readonly T[])
  /** 创建时确定，默认 false。 */
  multiple?: boolean
  /** 稳定且唯一的键，对象选项必须提供。 */
  getKey?: (item: T) => K
  isDisabled?: (item: T) => boolean
  defaultSelectedKeys?: readonly K[]
}
export interface SelectionController<T, K extends SelectionKey = SelectionKey> {
  selectedKeys: ComputedRef<readonly K[]>
  /** 当前列表中的已选对象，按列表顺序；对象本身不被冻结或复制。 */
  selectedItems: ComputedRef<readonly T[]>
  selectedCount: ComputedRef<number>
  selectableCount: ComputedRef<number>
  allSelected: ComputedRef<boolean>
  indeterminate: ComputedRef<boolean>
  isSelected(key: K): boolean
  isDisabled(key: K): boolean
  select(key: K): boolean
  deselect(key: K): boolean
  toggle(key: K): boolean
  selectAll(): boolean
  clear(): boolean
  setSelectedKeys(keys: readonly K[]): boolean
}
/** 不提供视觉，修改方法返回选中键是否改变；选中值可跨列表保留。 */
export declare function useSelection<T, K extends SelectionKey>(
  options: SelectionOptions<T, K> & { getKey: (item: T) => K }
): SelectionController<T, K>
export declare function useSelection<T extends SelectionKey>(
  options: Omit<SelectionOptions<T, T>, 'getKey'> & { getKey?: undefined }
): SelectionController<T, T>

export interface InputStyleOptions {
  /** 基础字号 px，默认 14。 */
  size?: number
  /** 基础行高 px，默认基础字号的 1.5 倍。 */
  lineHeight?: number
  color?: ThemeColorValue
  placeholderColor?: ThemeColorValue
}
export declare function useInputStyle(options?: InputStyleOptions | Ref<InputStyleOptions> | (() => InputStyleOptions)): {
  inputStyle: ComputedRef<{fontSize: string; lineHeight: string; color: string}>
  placeholderStyle: ComputedRef<string>
}

export interface PaginationContext<P> {
  page: number
  pageSize: number
  params: P
}
export interface PaginationPage<T> {
  items: T[]
  hasMore: boolean
}
export interface PaginationResult {
  success: boolean
  cancelled?: boolean
  skipped?: boolean
  error?: unknown
}
export interface PaginationOptions<T, P, R> {
  fetch: (context: PaginationContext<P>) => R | Promise<R>
  transform?: (response: R, context: PaginationContext<P>) => PaginationPage<T>
  pageSize?: number
  initialPage?: number
}
export interface PaginationController<T, P> {
  items: DeepReadonly<Ref<T[]>>
  page: Readonly<Ref<number>>
  hasMore: Readonly<Ref<boolean>>
  loading: Readonly<Ref<boolean>>
  refreshing: Readonly<Ref<boolean>>
  error: Readonly<Ref<unknown>>
  status: ComputedRef<'ready' | 'loading' | 'error' | 'finished'>
  refresh(params?: P): Promise<PaginationResult>
  loadNext(): Promise<PaginationResult>
  retry(): Promise<PaginationResult>
  reset(): void
  dispose(): void
}

/** 无默认视觉或自动请求；标准响应可直接推导列表项类型。 */
export declare function usePagination<T, P extends Record<string, unknown> = Record<string, unknown>>(
  options: Omit<PaginationOptions<T, P, PaginationPage<T>>, 'transform'> & { transform?: undefined }
): PaginationController<T, P>

/** 自定义响应通过同步 transform 转换；作用域外调用需手动 dispose。 */
export declare function usePagination<T, P extends Record<string, unknown> = Record<string, unknown>, R = unknown>(
  options: PaginationOptions<T, P, R> & { transform: (response: R, context: PaginationContext<P>) => PaginationPage<T> }
): PaginationController<T, P>

import type { UcsRequest } from './plugin/ucs-request/index.js'

export type ThemeMode = 'light' | 'dark'
export interface ThemeColors {
  primary: string
  /** Optional brand companion color; null means consumers may fall back to primary. */
  secondary: string | null
  success: string
  warning: string
  danger: string
}
export type ThemeColorName = keyof ThemeColors
export type ThemeShade = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
export type GrayShade = ThemeShade | 11 | 12
/** Unnumbered names alias the current mode's shade 6; configuration seeds remain in themeColors. */
export type ThemeColorKey = ThemeColorName | `${ThemeColorName}-${ThemeShade}` | `gray-${GrayShade}`
export type ThemeColorMap = Record<ThemeColorKey, string>
export type ThemeColorCssVars = Readonly<Record<`--ucs-${ThemeColorKey}`, string>>
export type LanguageValue = string | LanguageMessages | LanguageValue[]
export interface LanguageMessages { [key: string]: LanguageValue }
export type LanguagePacks = Record<string, LanguageMessages>
export type RequestEnvironment = 'auto' | 'development' | 'production'
export interface ApplicationRequestConfig {
  env: RequestEnvironment
  developmentBaseURL: string
  productionBaseURL: string
  timeout: number
  headers: Record<string, string | number | boolean>
}
export interface ResolvedRequestConfig {
  baseURL: string
  timeout: number
  headers: Record<string, string | number | boolean>
}
export interface UcsConfig {
  themeMode: ThemeMode
  themeColors: ThemeColors
  typographyOffset: number
  language: string
  fallbackLanguage: string
  designLanguagePacks: LanguagePacks
  i18nLanguagePacks: LanguagePacks
  iconFontFamily: string
  icons: Record<string, string>
  request: ApplicationRequestConfig
}
export type UcsConfigOptions = Omit<Partial<UcsConfig>, 'themeColors' | 'request'> & { themeColors?: Partial<ThemeColors>; request?: Partial<ApplicationRequestConfig> }
export interface TextOptions {
  params?: Record<string, string | number | boolean | null | undefined>
  fallbackValue?: string
}
export function initializeConfig(options?: UcsConfigOptions): UcsConfig
export function updateConfig(patch?: UcsConfigOptions): UcsConfig
export function resetConfig(): UcsConfig
export function getConfig(): UcsConfig
export function getRequestConfig(): ResolvedRequestConfig
export const http: UcsRequest
export function useConfig(): ComputedRef<DeepReadonly<UcsConfig>>
/** Logical pixels: max(1, baseSize + typographyOffset). No rpx conversion. */
export function getFontSize(baseSize: number): number
/** Without baseFontSize returns baseSize; otherwise scales with text by default. No rpx conversion. */
export function getIconSize(baseSize: number, baseFontSize?: number): number
export interface IconDefinition { fontFamily: string; glyph: string }
/** Custom mappings take precedence only with a configured font family. Unknown names return an empty glyph. */
export function getIconDefinition(name: string): IconDefinition
export function useThemeColors(): ComputedRef<Readonly<ThemeColorMap>>
/** Shared readonly color variables for the current store; excludes spacing, typography and layers. */
export function useThemeColorCssVars(): ComputedRef<ThemeColorCssVars>
/** Light color plus optional dark color; null/undefined in the second slot reuses light. */
export type ThemeColorValue = string | readonly [lightColor: string, darkColor?: string | null]
/** Select the current mode's color, resolve palette keys, and pass other trimmed strings through. */
export function getThemeColor(color: ThemeColorValue): string
export function getThemeColor(lightColor: string, darkColor?: string): string
export function getThemeMode(): ThemeMode
export function setThemeMode(mode: ThemeMode): UcsConfig
export function setThemeColor(name: 'secondary', color: string | null): UcsConfig
export function setThemeColor(name: Exclude<ThemeColorName, 'secondary'>, color: string): UcsConfig
export function updateThemeColors(colors: Partial<ThemeColors>): UcsConfig
export function getLanguage(): string
export function setLanguage(language: string): UcsConfig
export function getFallbackLanguage(): string
export function setFallbackLanguage(language: string): UcsConfig
export function getUcsDesignText(path: string, options?: TextOptions): string
export function getI18nText(path: string, options?: TextOptions): string
