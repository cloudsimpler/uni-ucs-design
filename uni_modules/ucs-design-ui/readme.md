# ucs-design-ui

面向 uni-app Vue3 和 uni-app-x 蒸汽模式的开放式 UI 插件，统一提供基础组件、响应式配置、主题、国际化、请求及公共组合函数。

只需安装本插件，组件通过 uni_modules 自动导入；配置和组合函数统一从 `@/uni_modules/ucs-design-ui/index.js` 导入。配置初始化、色阶、字号、国际化和请求的完整说明见 [基础能力](core/readme.md)。

```javascript
import { initializeConfig, getThemeColor, useUpload } from '@/uni_modules/ucs-design-ui/index.js'
```

内部按职责分层：components 为组件，composables 为组合函数，core 为配置与基础逻辑，locales 为语言包，internal 为浮层和 SVG 等内部实现，plugin 保留独立的请求、校验、色彩与页面生成工具。基础模块不反向依赖组件或组合函数。

## 通用约定

TypeScript 颜色声明统一使用公开入口导出的 `ThemeColorValue`，组件和组合函数的 JSDoc 直接使用 `{string|string[]}`：字符串表示内部色阶或外部颜色，readonly 一到两项数组表示 `[light, dark?]`；暗色缺省或为 null 时沿用亮色。color、backgroundColor、placeholderColor 等配置共用此类型。组件中空字符串表示默认颜色时先由组件选择默认值，再调用 getThemeColor；不调整解析结果的明暗、色阶或对比度。

组件、目录及模板属性采用 kebab-case，JS 属性、方法和插槽参数采用 camelCase；自定义事件定义、emit 派发及 JSDoc 使用 camelCase（例如 `clickMask`），模板使用 kebab-case 监听（例如 `@click-mask`），JS 处理函数使用 `onClickMask`；由 Vue 完成名称转换，组件只派发一次事件。原生事件保留平台名称。组件仅通过各自公开 ref 方法控制反馈，不增加旧名称兼容入口。

组件 `open()` 的布尔值表示指令是否被接受；已处于对应打开目标时仍返回 true，不重复派发状态事件或重启动画。状态是否改变通过相应事件判断。close 在没有可关闭目标时返回 false。

使用 uni_modules 自动导入 UCS 组件，不在页面或组件中显式 import。布局 class 放在原生 view 上，不加在 `<ucs-*>` 使用节点上；组件自身根节点和内部原生节点保留各自 class。组件属性通过 JSDoc 记录，defineProps 内不重复写注释。

正文与输入默认 14px，普通按钮正文 16px；图标、圆环使用 size 和 scaleWithFont 约定。圆角、间距及反馈尺寸按组件角色保留，不强行统一数值。

## useInputStyle

为原生 input、textarea 提供字号、行高、文字颜色与占位样式，不包装原生组件。默认基础字号 **14px**、行高 1.5 倍，响应全局字号偏移和明暗主题；不设置高度、宽度、边框、背景或内边距。

```vue
<script setup>
import { ref } from 'vue'
import { useInputStyle } from '@/uni_modules/ucs-design-ui/index.js'
const name = ref('')
const { inputStyle, placeholderStyle } = useInputStyle()
</script>
<template>
  <input v-model="name" :style="inputStyle" :placeholder-style="placeholderStyle" placeholder="姓名" />
  <textarea v-model="name" :style="inputStyle" :placeholder-style="placeholderStyle" />
</template>
```

选项 size、lineHeight（基础 px，按字号比例缩放）、color、placeholderColor；颜色支持内部色阶、外部颜色或明暗数组。返回两个 computed，直接绑定后随配置更新。默认文字颜色为 ['gray-12','gray-10']，占位颜色为 ['gray-7','gray-7']。动态基础配置可传 reactive 对象、ref 或 getter，例如 `useInputStyle(() => ({ size: props.size }))`；普通对象表示固定基础配置。

原生属性、v-model、输入法、焦点和事件均由页面直接控制，不合成事件或改变输入内容。与 ucs-form-field 配合时继续使用 @input="onChange"、@blur="onBlur"。字号与主题变化会重新计算样式；实际占位样式支持范围由目标平台决定。首页用原生 input、textarea 演示校验和重置。

验证：`node --experimental-vm-modules uni_modules/ucs-design-ui/tests/input-style.cjs`。

## useSelection

无预设外观的选择状态管理，不生成 checkbox、radio、列表或点击区域。页面自行绑定交互和绘制选中状态，适用于标签、卡片、列表等不同布局。

```vue
<script setup>
import { ref } from 'vue'
import { useSelection } from '@/uni_modules/ucs-design-ui/index.js'

const options = ref([
  { id: 'a', text: '选项 A', disabled: false },
  { id: 'b', text: '选项 B', disabled: false },
  { id: 'c', text: '选项 C', disabled: true }
])
const selection = useSelection({
  items: options,
  multiple: true,
  getKey: item => item.id,
  isDisabled: item => item.disabled
})
const { selectedKeys, allSelected, indeterminate } = selection
</script>
<template>
  <view v-for="item in options" :key="item.id" @tap="selection.toggle(item.id)">
    <ucs-text :text="item.text" :color="selection.isDisabled(item.id) ? 'gray-6' : selection.isSelected(item.id) ? 'primary-6' : 'gray-12'" />
  </view>
</template>
```

| 配置 | 默认值 | 说明 |
| --- | --- | --- |
| items | 必填 | 当前选项，支持响应式数组、ref 或 getter；普通数组需保持响应式才会更新统计 |
| multiple | false | 单选或多选，创建时确定；单选也返回键数组，最多一项 |
| getKey | 选项自身 | 字符串或有限数字的稳定唯一键；对象选项必须提供，类型检查同步约束，数字 1 与字符串 '1' 不同 |
| isDisabled | 始终 false | 禁用判断函数，可读取响应式数据 |
| defaultSelectedKeys | [] | 初始键，复制并去重；单选保留第一项 |

状态均为 computed：selectedKeys（所有已选键）、selectedItems（当前列表中的已选对象，按列表顺序）、selectedCount（所有已选键数量）、selectableCount（当前可选项数量）、allSelected、indeterminate。半选仅多选生效；没有可选项时全选与半选均为 false。键和对象数组为冻结快照，选项对象本身仍由业务管理。

- `isSelected(key)` 查询选中状态；`isDisabled(key)` 查询禁用状态，不在当前列表的键视为不可操作。
- `select(key)`、`deselect(key)`、`toggle(key)` 模拟用户选择，忽略禁用项和未知键；单选选中新项会替换旧值，toggle 已选项可取消。
- `selectAll()` 仅多选有效，合并当前可选项，不删除其他已选键。
- `clear()` 清除全部选择，包括禁用项和不在当前列表中的键。
- `setSelectedKeys(keys)` 程序赋值，复制、去重，不受禁用限制，可用于恢复不在当前列表中的选择。

修改方法返回选中键是否发生变化。非法键、重复选项键或错误配置抛 TypeError。multiple、getKey、isDisabled 的配置在创建时确定；后两者可通过闭包读取响应式状态。

筛选、翻页或选项变为禁用时不会自动删除已选键，恢复列表后会重新显示选中状态；需要清空时显式 clear。全选与半选只统计当前列表中的非禁用项，因此 selectedCount 可能大于当前已选可操作项数量。不自动关联 usePagination、表单或弹层；通过 selectedKeys 提交表单，通过 setSelectedKeys 恢复业务值。

没有 watcher、定时器或全局监听，无需 dispose。验证：`node --experimental-vm-modules uni_modules/ucs-design-ui/tests/selection.cjs`。

## usePagination

通过 `@/uni_modules/ucs-design-ui/index.js` 导入。逻辑与视觉独立，不自动请求、不规定接口字段、不自动显示 toast。组件 setup 中使用时随作用域卸载自动释放，作用域外使用需手动 dispose。

```js
import { usePagination } from '@/uni_modules/ucs-design-ui/index.js'
const pagination = usePagination({
  pageSize: 20,
  initialPage: 1,
  fetch: ({ page, pageSize, params }) => fetchProducts({ ...params, page, pageSize }),
  transform: response => ({ items: response.rows, hasMore: response.hasNext })
})
const { items, status, loading } = pagination // 模板使用顶层解构后的 ref
// 首次请求或筛选变化时调用；不会监听外部筛选对象。
await pagination.refresh({ keyword: '示例' })
// @scrolltolower="pagination.loadNext()"
// <ucs-load-more :status="status" />
```

fetch 接受 `{ page, pageSize, params }`，默认页码 1、每页 20 条。结果需为 `{ items: [], hasMore: boolean }`；其他协议通过同步 transform 转换。hasMore 必须由业务明确提供，不按不足一页推断，不在列表项上强制使用 id 或自动去重。仅支持页码分页，不内置游标分页。

只读状态：items、page（最后成功页码，初始为 initialPage - 1）、hasMore、loading、refreshing、error 和 status（ready/loading/error/finished）。刷新期间 status 为 loading，refreshing 用于区分刷新与追加。保留旧数据时刷新失败仍为 error，不会清空已有列表。

方法：refresh(params?) 每次发起新一轮，参数调用时复制，不传则沿用最近一次 refresh 的参数；loadNext() 在请求中复用同一 Promise，已无更多则跳过。失败后 loadNext()/retry() 重试原操作，刷新失败不会错误追加下一页。reset() 清空数据、参数和错误，不请求；dispose() 同时使后续请求方法失效。参数仅使用普通对象、数组和基础值，不支持循环引用。

所有刷新、追加和重试都返回 Promise：成功 `{ success: true, cancelled: false }`，失败 `{ success: false, cancelled: false, error }`，过期或已释放 `{ success: false, cancelled: true }`，无更多 `{ success: false, skipped: true }`。业务请求及结果转换异常进入 error，不向事件处理器抛出；配置和参数使用错误仍抛 TypeError。刷新、重置或卸载使旧响应失效，但不取消底层网络请求，也不会提前结束尚未返回的请求 Promise。

与下拉刷新连接时，由页面结束原生刷新：

```js
async function onRefresh() {
  try { await pagination.refresh() }
  finally { pageRef.value?.stopPullDownRefresh() }
}
```

首页使用 600ms 模拟请求展示三页数据和失败重试；加载更多状态预览区与实际分页独立。

## useCountdown

无预设外观的倒计时，不绑定按钮、文案或请求。使用截止时间与 `Date.now()` 计算剩余值，避免逐次减秒产生累积误差；运行中进入后台仍继续计时，暂停后不继续流逝。

```javascript
import { onShow } from '@dcloudio/uni-app'
import { useCountdown } from '@/uni_modules/ucs-design-ui/index.js'

const countdown = useCountdown({ duration: 60000 })
const { totalSeconds, running, time } = countdown
// 例如业务请求成功后：
countdown.reset()
countdown.start()
// 页面回到前台立即校准，不等待下一次定时器唤醒。
onShow(() => countdown.sync())
```

| 配置 | 默认值 | 说明 |
| --- | --- | --- |
| duration | 60000 | 初始时长，毫秒，有限非负数 |
| interval | 1000 | 状态更新间隔，毫秒，有限正数；最后一次唤醒不超过剩余时长 |
| autoStart | false | 创建后是否立即开始 |
| onFinish | 无 | 运行中的倒计时到期时同步通知一次 |

只读状态：`remaining` 剩余毫秒；`totalSeconds` 向上取整的剩余秒数，避免还有不足一秒时提前显示 0；`time` 为总秒数拆分的 `{ days, hours, minutes, seconds }`；`running` 表示正在计时；`finished` 表示剩余为 0，初始 duration=0 时也为 true，但不通知完成。

- `start()`：开始或继续剩余时间，运行中、已完成或释放后返回 false，其余返回 true。重新计时先 reset 再 start。
- `pause()`：先结算实际剩余时间再暂停；此刻已经到期则通知完成。未运行或释放后返回 false。
- `reset(duration?)`：停止并恢复时长，不自动开始、不通知完成。显式传入时长同时更新后续 reset() 使用的默认值。释放后返回 false，否则返回 true。
- `sync()`：运行时按当前时间立即校准，适合页面 onShow 调用；暂停或释放后返回 false，其余返回 true。
- `dispose()`：停止定时器并结算剩余时间，不通知完成，后续控制方法不再生效。

最多维护一个 setTimeout，没有全局监听；组件作用域销毁时自动释放，作用域外使用须手动 dispose。后台定时器暂停时不会自动执行回调，恢复后的下一次唤醒或 sync 会结算真实流逝时间；onFinish 在实际结算到期时执行，不保证在后台准时触发。它是同步回调，异常向调用处传播，调用前计时器已停止，允许回调内 reset/start。

运行中的一轮到期后，同步 watch 中 reset/start 不会吞掉该轮 onFinish，也不会恢复旧定时器；通知仍属于刚结束的那一轮，不保证回调读取到的状态尚未被业务重置。

系统时钟调整会影响结果，不提供服务器校时、跨进程恢复或持久化；支付有效期等权威结果仍由业务服务端判断。测试：`node --experimental-vm-modules uni_modules/ucs-design-ui/tests/countdown.cjs`。

## useUpload

无预设外观的上传队列，通过业务函数接入当前 core 的 `http.upload()`。不选择、压缩或预览文件，不预设上传接口、鉴权字段、响应格式，也不自动显示提示。

```javascript
import { http } from '@/uni_modules/ucs-design-ui/index.js'
import { useUpload } from '@/uni_modules/ucs-design-ui/index.js'

const uploader = useUpload({
  concurrency: 2,
  autoUpload: false,
  upload: ({ file, signal, onProgress }) => http.upload('/files', {
    filePath: file.path,
    name: 'file',
    signal,
    onUploadProgress: onProgress,
    formData: { category: 'image' }
  })
})
const { tasks, loading, uploadingCount, pendingCount } = uploader
// 业务自行选择文件，再将本地路径交给队列。
const ids = uploader.add([{ path: '/local/image.png', name: 'image.png' }])
const results = await uploader.start()
// uploader.cancel(ids[0])
// await uploader.retry(ids[0])
```

配置在创建时确定：`upload` 必填，接受 `{ file, signal, onProgress }`；`concurrency` 默认 2，必须为正整数；`autoUpload` 默认 false，true 时 add 后自动排队。可使用业务自建请求实例，继续复用它的拦截器；若响应含业务状态码，应在 upload 函数内校验并在失败时抛错。

| API | 行为 |
| --- | --- |
| add(files) | 原子校验、浅复制文件数组中的描述，返回数字 id 数组；每项必须有非空 path，同一路径允许多次添加 |
| start(id?) | 启动指定任务或全部 ready 任务；并发占满时等待，不重传其他已结束状态；已有任务复用单项请求 |
| retry(id) | 只重试 error、cancelled，清空该项旧进度和错误，沿用原文件及 id |
| cancel(id) | 取消 ready 或 uploading，返回是否发生变化；立即完成该次结果并释放位置 |
| cancelAll() | 取消所有 ready、uploading，保留已完成项及任务记录 |
| remove(id) | 取消并删除指定任务，返回是否存在 |
| clear() | 取消全部未完成任务并清空记录；之后仍可添加 |
| dispose() | 取消并清空，后续 add/start/retry 返回空数组，不再接受任务 |

`start`、`retry` 返回 `Promise<结果数组>`，没有符合条件的任务时为空数组。每项结果为 `{ id, success: true, cancelled: false, result }`、`{ id, success: false, cancelled: false, error }` 或 `{ id, success: false, cancelled: true }`；请求失败通过结果和状态报告，不抛出到事件处理器，配置及文件参数错误仍抛 TypeError。start 只等待调用时选中的任务，不包含之后添加的任务。

`tasks` 是 computed，只读数组及只读记录，每项有 `id/file/status/loaded/total/progress/result/error`；状态为 ready、uploading、success、error、cancelled。文件描述浅复制并冻结，额外嵌套业务对象、result 和 error 不深度冻结。`uploadingCount` 为执行中数量，`pendingCount` 为所有 ready 数量（包含未调用 start 的项），`loading` 表示有执行中的任务。无任务或全部结束后均不 loading。

进度更新复用未变化任务的快照，仅为变化项创建新记录；数组本身仍发布新快照。cancelAll、clear 和 remove 的内部状态变更批量提交，避免每取消一项都重新发布整队列。clear 仍会逐项完成取消结果和中止网络任务。

remove、clear 在执行取消监听器前先摘除目标记录；监听器同步调用这些任务的 start/retry 会立即得到空结果数组，不会遗留等待中的 Promise。clear 处理调用时已有的任务；取消回调中新添加的任务保留并继续受队列管理，dispose 则不再允许添加。

进度事件沿用请求库 `{ loaded?, total?, progress? }`，progress 范围 0～1；缺少百分比时可从有效字节数计算，两者都缺少则保持 undefined。传输达到 100% 后仍等待上传函数成功返回；不把传输完成当作业务成功，也不模拟进度。

signal 兼容当前 `ucs-request` 的取消协议，无需全局 AbortController；必须传入请求才能中止真实网络，包括异步请求拦截器等待阶段。取消后忽略迟到的进度和结果。自定义上传函数若忽略 signal，真实网络可能继续执行，此时 concurrency 仅约束当前队列中的有效任务。没有自动重试、断点续传或总体百分比。

组件 setup 作用域销毁时自动 dispose；作用域外使用需手动释放。测试：`node --experimental-vm-modules uni_modules/ucs-design-ui/tests/upload.cjs`，包含真实 ucs-request 代码与模拟原生上传任务的接入测试，不代替各平台真机验证。

## 内部浮层管理

所有 popup、loading、toast 直接使用同一个 App 级管理器，ucs-page 不创建或提供管理器；无需使用页面容器也能加入共享栈。计数从 999 开始，每次打开分配新数字：popup、loading 的遮罩和内容连续占两位，toast 占一位。关闭只移除活动记录，不回收数字，不重新编号其他 popup；页面切换、销毁或重新创建也不会重置计数。App 完整重新启动 JS 运行环境后重新从 999 开始。

仅当前交互栈顶接收指针交互，popup 退出动画结束后释放记录，loading 主动 hide 时立即释放。活动 loading 始终高于 popup；若后来打开 popup，按现有前后顺序为活动 loading 分配更高层级，其他 popup 的层级不变。组件卸载永久释放句柄，但不会销毁全局管理器。toast 不占交互栈顶；打开 popup 或 loading 时会提升活动 toast，保持提示在反馈层上方。组件读取管理器分配的 maskZIndex、panelZIndex、toastZIndex，不自行计算偏移。

不监听页面 onHide/onShow，不自动暂停、恢复或关闭浮层。只在打开时注册、关闭时移除活动记录、组件卸载时永久释放句柄。页面切换后的浮层行为由业务控制。所有容器共享全局顺序，不保证不同原生窗口之间的覆盖关系。

此模块不接管原生返回键、键盘焦点、网页 Tab 焦点或页面滚动锁定；多 popup 推荐在 overlay 插槽同级放置，父级 transform 和 overflow 等布局限制仍然有效。首页展示双层弹窗及上方提示，实际页面切换、点击隔离和覆盖需目标平台验证。

## ucs-loading

手动关闭的阻断式加载。固定透明遮罩阻止当前页面点击和滑动，居中显示圆环及可选文字；点击遮罩不关闭。不提供 mask、duration、插槽或交互事件，也不自动结束业务任务。

使用 ucs-page 时已内置，无需重复放置：

```javascript
pageRef.value?.showMaskLoading({ text: '正在提交' })
try {
  await submit()
} finally {
  pageRef.value?.hideMaskLoading()
}
```

独立使用时，将组件放在不受滚动裁剪的位置，并通过 ref 调用：

```vue
<ucs-loading ref="loadingRef" />
```

```javascript
loadingRef.value?.show() // 仅圆环
loadingRef.value?.show('正在提交')
loadingRef.value?.show({ text: '正在提交' })
loadingRef.value?.hide()
```

`show(options?)` 接受字符串或 `{ text?: string }`，文字去除首尾空白；省略文字或空文字时仅显示圆环。返回是否接受，未挂载、已卸载或参数无效返回 false。重复 show 更新文字，不叠加、不重新分配层级或创建圆环。`hide()` 主动关闭，可重复调用；组件卸载自动释放资源。

视觉与 toast 成功／失败反馈统一：32px 基础圆环、14px 文字、8px 间距、12px 圆角，最大宽 500rpx，内边距 16px 24px，不设最小宽高，由内容自然撑开。圆环及文字跟随字号，前景和背景统一通过 core 解析主题色。显示请求取得阻断层级后，面板透明挂载并等待布局再显示；布局查询失败仍显示，旧请求不会在 hide 或新一轮 show 后恢复。组件没有自动关闭定时器。

浮层管理保证 loading 位于活动 popup 上方；随后通过代码打开 popup 也不会绕过阻断。多个 loading 以最后激活者取得交互，关闭后恢复仍活动的下层；toast 仍为不拦截交互的上层提示。业务应先 hide loading 再显示结果 toast，避免反馈重叠。不处理页面隐藏、返回键、原生导航栏、原生 Tabbar 或其他原生窗口。

`ucs-page.showLoading()` / `hideLoading()` 仍表示主体区域加载；`showMaskLoading()` / `hideMaskLoading()` 表示独立的整页阻断，二者不会互相关闭。首页用模拟请求完成后主动 hide 的方式演示文字和纯圆环反馈。测试：`node --experimental-vm-modules uni_modules/ucs-design-ui/tests/loading.cjs`；原生平台的触摸拦截及绘制仍需真机验证。

## ucs-toast

ucs-page 已内置一个轻提示实例。使用页面容器时直接调用 `pageRef.value?.showToast('提示')`、`pageRef.value?.showToast({ text: '保存成功', type: 'success' })` 和 `pageRef.value?.hideToast()`，无需在 overlay 插槽额外放置 toast。没有启用属性，不自动关联请求结果；未挂载或已卸载时 showToast 返回 false。

纯文字提示采用紧凑横条：上下 10px、左右 20px 内边距，圆角 8px，宽度随文字撑开，最大宽度 500rpx。成功和失败提示保留图标在上、文字在下，上下 16px、左右 24px 内边距及 12px 圆角。

页面内的轻提示，通过 ref 调用，无 show 属性、插槽或点击事件。默认居中纯文字；success/error 在文字上方显示 checkmark-circle/close-circle。文字基础字号 14px、图标 32px，跟随全局字号；背景及前景适配明暗主题。提示层使用 pointer-events: none，不阻挡点击和滚动，不锁定页面。建议每页一个，放在 ucs-page 的 overlay 插槽中，与 popup 同级；通过 App 级管理器保持高于活动 popup。同页定位不保证覆盖原生导航栏、Tabbar 或其他原生窗口。

```vue
<template>
  <ucs-page ref="pageRef">
    <view><ucs-button text="保存" @click="save" /></view>
  </ucs-page>
</template>
<script setup>
import { ref } from 'vue'
const pageRef = ref(null)
function save() {
  pageRef.value?.showToast({ text: '保存成功', type: 'success' })
}
</script>
```

不使用 ucs-page 时仍可独立放置 `<ucs-toast ref="toastRef" />`，通过 toastRef 的 show(options)/hide() 调用；参数和行为一致。内置实例与独立实例分别管理内容，一般每页使用内置实例即可。

`show('提示文字')` 等同于 `show({ text: '提示文字', type: 'text', duration: 2000 })`，返回是否接受本次显示请求。type 支持 text、success、error；忽略大小写及首尾空白，无效值回退 text。duration 单位 ms，默认 2000，0 持续显示至 hide 或下次 show，负数或非有限值回退默认值。空白或非字符串 text 不显示且不影响现有提示。重复 show 直接替换并重新计时，不排队；hide 立即关闭，可重复调用。每次 show 创建带唯一 ID 的独立提示，文字、类型和时长保持不变。新提示先透明挂载，nextTick 后通过可用的原生异步布局、Web 布局或小程序选择器查询准备完成，再替换旧提示并开始计时；没有固定切换延时或动画。布局查询不可用或失败时降级为 Vue 更新后显示，不保证原生首次布局效果。准备期间保留旧提示，旧提示仍按原时长关闭；最多一条可见提示和一条待显示提示，连续调用仅最后一次准备请求生效。关闭销毁提示节点及子组件，仅保留管理容器，并取消未完成的准备请求；卸载清理定时器，旧定时任务不会关闭后续提示。需要阻止操作的请求加载请使用 ucs-page 的 showLoading，而非 toast。

点击穿透依赖 [官方 pointer-events 支持](https://doc.dcloud.net.cn/uni-app-x/css/pointer-events.html)，节点关闭 flatten；页面实际点击、滚动及浮层叠加仍需目标平台真机验证。

验证命令：`node --experimental-vm-modules uni_modules/ucs-design-ui/tests/toast.cjs`。

## ucs-button

提供参考 [WeUI 普通按钮](https://weui.io/#button) 的默认视觉，颜色使用 UCS 主题。默认 type=primary：主色背景、白字、16px 基础字号、48px 基础高度、8px 圆角、左右 24px 内边距（竖向留白计入高度，不重复设置 padding），普通尺寸最小宽度 184px、最大宽度 280px（mini 同样受最大宽度约束）。内置文字字重 500，仅显示一行，超长省略。默认内容宽度并居中，block=true 占满父容器并取消 280px 限制。字号偏移会同步扩大文字、行高及加载圆环，按钮高度允许随内容增大。

```vue
<ucs-button text="保存" :loading="saving" @click="save" />
<ucs-button type="default" text="取消" />
<ucs-button type="success" text="确认完成" />
<ucs-button type="warning" text="注意事项" />
<ucs-button type="danger" text="删除" />
<ucs-button size="mini" text="小按钮" />
<ucs-button block disabled text="暂不可用" />
```

type 支持 primary/success/warning/danger/default（默认 primary，无效值回退 primary）；彩色背景直接解析对应的 primary-6、success-6、warning-6、danger-6，default 保留中性背景，不提供旧类型别名；size 支持 default/mini，小按钮为 14px 字号、32px 基础高度、6px 圆角。disabled 默认 false，提供弱色背景与文字并禁止交互；loading 默认 false，保留文字并显示基础 20px 的 ucs-spinner，图文间距 4px，仅圆环时无额外间距，同时禁止交互。中性按钮默认圆环为 #606060，其他类型跟随文字色，显式 color 可覆盖。color 默认空字符串，按类型和禁用状态取色，也可指定主题色或明暗数组。字号由 size 统一确定，不提供 fontSize 属性。按压由原生交互层叠加遮罩：亮色模式 20% 黑色，暗色模式 20% 白色，不改变文字及背景的整体透明度；禁用或加载时关闭，不提供 hoverClass 属性。颜色随主题变化；禁用外观仅由 disabled 决定，加载保留当前类型颜色。

默认插槽提供 loading、disabled，用于替换文字内容；自定义组件自行设置颜色和间距。loading 插槽可替换默认圆环。class/style 覆盖外层 view 的默认视觉。各端统一显式绑定 id、name、form-type、open-type、hover-start-time、hover-stay-time、hover-stop-propagation 及触摸事件，避免 UTS 不支持的对象式 v-bind；未列出的平台专有属性和事件不自动透传。透明背景的原生 button 在按压时显示遮罩。type/size/loading 已由本组件消费，不再使用原生视觉。自定义内容放在原生按钮之外，避免原生 button 的子内容限制；插槽不要放独立交互控件。点击依次触发 tap、click，同一操作监听其中一个；另有 longpress。禁用和加载时均拦截以上事件。平台开放能力与按压反馈仍需目标平台验证。

按钮不自动等待事件监听器的 Promise，不自动发请求或时间防抖；页面自行设置 loading，表单直接绑定 submitting。form-type 面向原生 form，ucs-form 通过 @click 显式提交。首页展示各类型、加载、禁用、小尺寸及表单提交。本次只实现普通按钮；截图中的“底部悬浮型”入口对应的固定底部布局暂未加入。

## ucs-form / ucs-form-field

无预设外观的表单与字段容器，使用 core 内置 async-validator。仅管理已挂载字段的校验、错误状态、重置和提交锁；标签、输入框、错误提示和按钮由默认插槽设计。容器仅提供纵向 flex，无默认边框、间距、错误文字或自动滚动。

```vue
<ucs-form ref="form" :model="model" :rules="rules" v-slot="{ submitting }">
  <ucs-form-field name="email" v-slot="{ error, onBlur, onChange }">
    <input v-model="model.email" @blur="onBlur" @input="onChange" />
    <ucs-text v-if="error" :text="error" color="danger-6" />
  </ucs-form-field>
  <button :disabled="submitting" @click="save">保存</button>
</ucs-form>
```

```js
const form = ref(null)
const model = reactive({ email: '' })
const rules = { email: [
  { required: true, message: '请输入邮箱', trigger: 'blur' },
  { type: 'email', message: '邮箱格式不正确', trigger: 'change' }
] }
async function save() {
  try {
    const result = await form.value.submit(async values => {
      await saveToServer(values) // 项目自己的业务请求
    })
    // result 为 { valid, cancelled, errors }；业务异常进入 catch。
  } catch (error) { /* 项目自行展示提交失败反馈 */ }
}
```

form 的 `model` 为必传可写对象，`rules` 默认空对象。`name` 支持 `profile.email`、`items.0.name` 等点分路径，规则表使用完整路径为键；同表单路径不得重复。动态字段名称变化时使用 `:key="name"` 重新注册。字段 `rules` 优先于表单规则，省略时继承，空数组禁用该字段规则。model 建议使用普通对象、数组、Date 和基础值，避免循环引用和类实例。

form 默认插槽提供 `submitting`、`validate`、`submit`、`resetFields`，与 ref 的重置方法同名。form 公开 `validate()`、`validateField(name或数组)`、`resetFields()`、`clearValidate()`、`submit(handler?)`。校验方法均 resolve `{ valid, cancelled, errors }`，校验失败不会抛业务异常；未知字段名会拒绝 Promise。只校验已注册字段，未挂载字段不参与提交校验。校验与提交使用同一份数据快照，提交前再次检查版本；数据已变化时取消，不会重新读取未经校验的新值提交。提交通过时派发 `submit` 数据快照，失败或取消时派发 `invalid`。需要等待异步请求时使用 `submit(async values => ...)`；组件不能等待 `@submit` 监听器的异步操作。提交锁覆盖校验与 handler，重复调用复用同一 Promise，handler 抛错后释放锁并将异常传给调用方；不会自动发请求。

field 默认插槽提供 `error`（首条错误文字）、`validating`、`touched`、`validate(trigger?)`、`onBlur()`、`onChange()`、`clearValidate()`。显式连接输入事件，不监听或改写原生输入值；自动执行指定 trigger 或无 trigger 的规则，手动无参校验及提交执行全部规则。field ref 公开 validate、clearValidate。规则消息由项目提供，不自动接入全局语言包。

内置规则仅复制当前字段值；自定义 validator/asyncValidator（含嵌套规则）保留独立完整数据源，用于跨字段校验且不污染其他字段或提交快照。

值或规则变化会清除错误并取消旧校验结果；异步期间其他参与校验的字段被编辑、重置、清除或卸载时，整次校验返回 cancelled，防止用过期结果提交。重置恢复每个字段首次注册时的数据快照，替换 model 不改变这个基线。卸载字段不删除其 model 数据，卸载表单不取消已发出的业务请求，但阻止未完成的校验继续触发提交。无内置键盘避让、原生 form submit 接管、焦点滚动或禁用子输入框行为。

首页提供原生 input、字段提示、提交锁和重置示例。运行 `node --experimental-vm-modules uni_modules/ucs-design-ui/tests/form.cjs` 验证；跨端插槽与原生输入行为仍需真机验证。

## ucs-load-more

上拉加载状态反馈，默认图标模式，设置 showText 显示文字模式。不提供插槽或点击事件，不监听滚动、不发起请求、不管理分页。由页面或 ucs-page 的 scrolltolower 触发加载和失败重试，发起请求前检查状态，避免重复加载。

```vue
<ucs-page @scrolltolower="loadNextPage">
  <template #scroll-footer><ucs-load-more :status="loadStatus" /></template>
</ucs-page>
<ucs-load-more :status="loadStatus" show-text />
```

| 属性 | 默认值 | 说明 |
| --- | --- | --- |
| status | ready | ready / loading / error / finished / hidden；忽略大小写和空白，无效值回退 ready |
| showText | false | 是否使用文字模式 |
| color | 空字符串 | 覆盖中心图标、圆环和文字颜色；空白字符串使用各状态默认色，支持 core 色阶、外部颜色和明暗数组 |

两侧都保留细横线，状态展示如下：

| 状态 | 图标模式 | 文字模式 |
| --- | --- | --- |
| ready | more-horizontal，弱色 | 上拉加载更多 |
| loading | 旋转圆环，主色 | 圆环＋加载中… |
| error | close-circle，失败色 | 加载失败，请上拉重试 |
| finished | checkmark-circle，成功色 | 没有更多了 |
| hidden | 不显示、不占位 | 不显示、不占位 |

图标模式的圆环和字体图标统一 24px，关闭字号缩放。文字模式基础字号 14px、加载圆环 16px，均跟随全局字号偏移，圆环占位容器同步变化并与文字垂直居中。左右线段各 64px，中心与横线间距各 12px，图文间距 8px，反馈区最小高度 64px。中间区域随文案展开，横线可收缩。文字和图标默认共用各状态颜色，横线随明暗主题变化。

ready 表示还有下一页，正常展示等待提示。error 允许再次上拉触底重试，finished 停止请求；请求成功且还有下一页时恢复 ready。文字通过 core 的 loadMore.ready/loading/error/finished 设计语言包配置，支持 designLanguagePacks 覆盖，不再提供独立文案属性。class、style 透传根 view，无事件、定时器或公开方法。实际各端图标、长文案布局和触底流程仍需真机确认。

## ucs-swipe-action

无预设外观的侧滑操作容器，支持左、右操作插槽，不内置删除按钮、确认弹窗、背景或分割线。默认收起，通过手势或 ref.open(side)/close() 控制，不使用 show 属性。

```vue
<ucs-swipe-action ref="swipeRef" :right-width="80" @content-click="openDetail">
  <view style="padding: 16px"><ucs-text text="列表内容" /></view>
  <template #right="{ close }">
    <view style="flex: 1; align-items: center; justify-content: center" @tap="close(); removeItem()">
      <ucs-text text="删除" color="danger-6" />
    </view>
  </template>
</ucs-swipe-action>
```

| 属性 | 默认值 | 说明 |
| --- | --- | --- |
| leftWidth | 0 | 左侧操作区总宽 px，向右滑显示，0 禁用 |
| rightWidth | 80 | 右侧操作区总宽 px，向左滑显示，0 禁用 |
| threshold | 0.5 | 松手展开比例，须大于 0 且小于 1；无效值回退 0.5 |
| duration | 200 | 吸附过渡 ms；0 立即定位，负数或非有限值回退 200 |
| disabled | false | 禁止手势及 open，变为 true 时收起 |

宽度只接受有限非负数字，不随字号变化；无效 leftWidth 回退 0，rightWidth 回退 80。宽度表示整个操作区，多个按钮由页面分配；启用的一侧须提供对应插槽，宽度建议不超过内容行宽。不测量操作区，不监听布局。

默认插槽决定行高，提供 `side`（展开目标 left/right/null）和 `close`；left/right 插槽提供 close，按行高铺满对应区域。操作区常驻挂载并按位移裁剪，即使内容背景透明也不会整块透出。改变宽度时重新定位，正在拖动则终止本次拖动。默认不播放初始展开动画。

`open('left' | 'right')` 默认 right，返回指令是否被接受；相同目标返回 true，不重复派发事件或重启动画。未挂载、卸载后、禁用、宽度 0、非法方向返回 false。`close()` 收起，返回目标是否改变；也会终止拖动，即使原本已为收起目标而返回 false。快速 ref 开关交给 CSS 过渡承接。

新手势打断尚未完成的吸附时，读取容器与内容的当前位置差，冻结该位置后跟随手指；支持 Web 同步和原生异步布局查询。等待异步结果期间保存移动量，松手后结果到达也只提交本轮目标；新指令、取消或卸载使旧查询失效。查询不可用时按 CSS ease-out 时间曲线估算，不直接跳到旧目标。普通拖动不测量，没有常驻定时器或尺寸监听。

事件 `change` 仅在展开目标变化时派发 left/right/null，不逐帧派发；`contentClick`（模板 `@content-click`）仅在收起状态轻触内容时派发原生事件，展开后轻触内容只收起。操作区域点击不会自动收起或执行删除，由业务使用插槽 close 处理。整行点击请用 contentClick；输入框、按钮等子控件应自行阻止点击冒泡，避免同时触发行点击。

单指移动超过 8px 后锁定方向，横向位移需超过纵向的 1.2 倍才接管；纵向手势不阻止默认滚动。横向锁定后阻止默认行为与冒泡，松手按比例吸附；不按速度甩开、不越界回弹。touchcancel、多指打断恢复手势前目标；拖动后生成的 tap 被忽略。无全局互斥、外部点击监听、计时器或自动业务操作，不支持鼠标拖动、嵌套横向手势控件。

按当前项目 uni-app Vue3、uni-app-x Vapor 方向实现。横向阻止滚动依赖平台支持 touch 事件 preventDefault；支付宝小程序事件不提供此方法，不能保证相同效果，参见[官方事件文档](https://doc.dcloud.net.cn/uni-app-x/component/common.html)。测试：`node --experimental-vm-modules uni_modules/ucs-design-ui/tests/swipe-action.cjs`；手势仲裁仍需目标平台真机验证。

## ucs-progress

确定进度展示组件，支持条形和环形，不关联请求、不内置状态文案、图标或交互。0～100 的百分比由业务传入，100 不代表业务已经成功；未知进度使用 ucs-spinner。

```vue
<ucs-progress :percent="45" />
<ucs-progress type="circle" :percent="75" v-slot="{ percent }">
  <ucs-text :text="`${percent}%`" />
</ucs-progress>
```

| 属性 | 默认值 | 说明 |
| --- | --- | --- |
| percent | 0 | 百分比 0～100，支持小数，越界限制到范围，非有限值回退 0 |
| type | line | line 条形、circle 环形；无效值使用条形 |
| size | 80 | 环形外径 px，有限正数，其他值回退 80；条形忽略 |
| strokeWidth | 4 | 线宽 px，有限正数，其他值回退 4；环形最多为外径一半 |
| color | primary-6 | 前景色，由 core 解析 |
| trackColor | ['gray-3','gray-4'] | 轨道色，由 core 解析 |

条形宽度为 100%，需要不同宽度时设置外层原生 view；默认插槽只在环形中展示居中内容，提供规范化后的 percent。颜色支持字符串及明暗数组，尺寸不随全局字号变化，文字由页面使用 ucs-text 自行组合。

条形使用 CSS 宽度，环形从顶部顺时针填充，使用项目现有静态 SVG Data URL 渲染方式；0 不显示前景圆点，100 使用完整圆环。SVG 来源按进度、线宽比例和解析后的颜色缓存，最多 64 项；颜色须能在 SVG 中独立解析，宿主 CSS 变量不会传入图片。没有 JS 定时器、尺寸测量或进度补间动画。

与 useUpload 配合时，将已知的 `task.progress`（0～1）乘以 100 传入；undefined 表示进度未知，不应强制当作 0。首页提供条形、环形与自定义居中文字演示。测试：`node --experimental-vm-modules uni_modules/ucs-design-ui/tests/progress.cjs`，不代替各平台真机验证。

## ucs-skeleton

基础骨架占位块，由页面组合布局，并通过 `v-if` 在数据就绪后替换为实际内容。不预设卡片结构，不关联请求，也不提供插槽或交互事件。

```vue
<view v-if="loading">
  <ucs-skeleton shape="circle" :width="48" />
  <view style="margin-top: 16px"><ucs-skeleton width="80%" :height="16" /></view>
  <view style="margin-top: 12px"><ucs-skeleton :height="96" :radius="8" /></view>
</view>
<view v-else>实际内容</view>
```

| 属性 | 默认值 | 说明 |
| --- | --- | --- |
| shape | rect | rect 矩形，circle 圆形 |
| width | 空字符串 | 数字按 px；矩形默认 100%，圆形默认 40px |
| height | 16 | 矩形高度；圆形以 width 为直径，忽略此属性 |
| radius | 4 | 矩形圆角；圆形固定 50% |
| color | ['gray-3', 'gray-4'] | 由 core 解析的颜色或明暗颜色数组 |
| animated | true | 是否启用 1.4 秒 CSS 透明度脉冲 |

宽高和圆角不随字号偏移变化。数字支持 0，无效或负数回退默认值；非空字符串作为 CSS 长度交给平台解析。圆形建议使用 px、rpx 等明确长度，百分比宽高可能参照不同父级尺寸。关闭动效后显示为完整不透明度的静态块，无 JS 定时器或尺寸监听。布局间距由外层原生 `view` 设置。

## ucs-collapse

无预设外观的折叠内容容器，只管理展开收起和高度过渡，不内置标题、箭头、边框、背景或触发区域。使用 ref.open()/close()/toggle()，不提供 show/v-model 控制。触发按钮、选中状态和手风琴互斥由页面管理。

```vue
<script setup>
import { ref } from 'vue'
const collapseRef = ref(null)
const expanded = ref(false)
</script>
<template>
  <view @tap="collapseRef?.toggle()"><ucs-text :text="expanded ? '收起' : '展开'" /></view>
  <ucs-collapse ref="collapseRef" @change="expanded = $event">
    <view><ucs-text text="由页面自由设计的内容" /></view>
  </ucs-collapse>
</template>
```

属性：defaultOpen 默认 false，仅决定首次渲染状态；duration 默认 240ms，0 立即切换，负数或非有限值回退 240ms。默认插槽提供 expanded（目标状态）、animating（正在切换）。open 返回指令是否被接受，已展开或正在展开时仍返回 true，不重复派发事件或重启动画；close/toggle 返回目标是否改变。未挂载/已卸载时三个方法均返回 false。

change(expanded) 在接受目标变化后派发；afterChange(expanded) 在该轮完成后派发，被新指令中止的轮次不派发完成事件。首次渲染不播放动画、不派发状态事件。动画由 CSS height 过渡完成，计时器只负责本轮结束时恢复自然高度和派发完成通知；快速切换重新测量当前渲染高度，旧测量及定时回调不会覆盖新状态。

收起使用高度 0 与 overflow 裁剪，插槽始终挂载，因此输入内容等局部状态保留；收起时屏蔽指针交互，但不管理焦点、表单校验或内部定时器。需要停止业务任务由页面处理。展开完成后恢复 height:auto，异步图片、文字、字号或列表变化自然撑高，不为每次内容变化单独播放动画，无持续尺寸监听或轮询。

仅在切换时读取容器及内层高度，支持原生异步布局、Web DOM 和选择器查询；测量不可用或失败时立即切换。不要为整个插槽内容使用脱离文档流的定位；间距建议放在内层 padding，避免垂直外边距影响测量。外部布局 class 放在原生 view 包装层。

首页演示展开、收起、输入状态保留及动态内容增减。验证：`node --experimental-vm-modules uni_modules/ucs-design-ui/tests/collapse.cjs`。不同原生端的实际过渡效果仍需真机验证。

## ucs-cascader

同步树形数据的多列级联滚轮，沿用 picker 的关闭图标、居中标题、五行滚轮及底部确认布局。不内置城市数据、搜索、定位、禁用节点、异步加载或自定义插槽。适用于地区、分类、组织等有限深度树；列数随当前路径变化，不要求所有分支深度一致。

```vue
<script setup>
import { ref } from 'vue'
const cascaderRef = ref(null)
const value = ref([])
const options = [
  { label: '数码', value: 'digital', children: [
    { label: '手机', value: 'phone' }, { label: '电脑', value: 'computer' }
  ] },
  { label: '其他', value: 'other' }
]
// cascaderRef.value?.open()
</script>
<template>
  <ucs-cascader ref="cascaderRef" v-model="value" title="选择分类" :options="options" />
</template>
```

属性 modelValue 默认 []，为从根到叶的字符串/有限数字业务值路径；options 默认 []，节点格式 `{ label:string, value:string|number, children?:Array }`。同级 value 不可重复，不同分支允许同名值，数字 0 与字符串 '0' 不同。children 缺省、null 或空数组表示叶子。title 默认空，confirmText 空白使用 core common.confirm，closeOnClickMask 默认 true。

通过 ref.open()/close() 控制显示；方法返回是否接受。每次打开创建 label/value/children 的独立只读树快照，外部修改下次打开生效；重复 open 不重置草稿。[] 表示尚未选择，面板逐层预选第一项但不提交；失效路径保留有效前缀，从失效层首项补齐到叶子。上级变化会重置全部下级，不复用旧分支索引；仅确认才更新绑定值，关闭和取消丢弃草稿。空树允许打开，确认禁用；无效节点、重复同级值、循环树及非法路径数组使 open 返回 false，并派发 error(Error)。

事件 open、close(reason)、update:modelValue(value)、confirm({ value, options, indexes })、cancel(reason)、error(Error)。confirm 的 options 为本轮只读节点快照路径，indexes 为本轮下标路径，不作为绑定值；不透传节点其他业务字段。关闭原因 confirm/cancel/mask/close，确认顺序 close → update:modelValue → confirm；取消为 close → cancel；程序 close 不派发 cancel。滚动时禁用确认，不支持只提交中间层节点。

行文字 16px，行高至少 48px，随 core 字号增长；各列等分可用宽度，长标签单行省略，建议使用简短标签和适量层级。底部安全区及浮层管理由 popup 提供，放在 page overlay 中。首页使用分类数据演示不等深分支；原生滚轮的动态列变化仍需目标端真机验证。

验证：`node --experimental-vm-modules uni_modules/ucs-design-ui/tests/cascader.cjs`。

## ucs-picker

单列滚轮选择面板，布局与 datetime-picker 一致：左上关闭图标、居中标题、五行滚轮和底部默认 ucs-button。没有内置输入框、展示行、禁用选项、多列、级联、搜索或插槽。通过 ref.open()/close() 控制显示，v-model 绑定业务值，确认才提交；关闭图标及遮罩取消草稿，程序 close 不派发 cancel。

```vue
<script setup>
import { ref } from 'vue'
const pickerRef = ref(null)
const selectedValue = ref(null)
const options = [{ label: '个人', value: 'personal' }, { label: '企业', value: 'company' }]
// pickerRef.value?.open()
</script>
<template>
  <ucs-picker ref="pickerRef" v-model="selectedValue" title="选择类型" :options="options" />
</template>
```

属性：modelValue 默认 null，支持字符串或有限数字；options 默认 []，元素为 `{ label: string, value: string | number }`；title 默认空，confirmText 空白时使用 core common.confirm，closeOnClickMask 默认 true。value 必须唯一，数字 0、字符串 '0' 和空字符串均是有效且不同的业务值。

每次打开浅复制本轮选项并按 modelValue 定位，未命中或 null 时预选第一项但不自动提交；重复 open 不重置草稿。外部修改 options/modelValue 在下一次打开生效，当前显示标签及值不变。空列表允许打开，确认禁用；非法选项或重复 value 时 open 返回 false 并派发 error(Error)。

事件：open、close(reason)、update:modelValue(value)、confirm({ value, option, index })、cancel(reason)、error(Error)。option 为本轮选项的只读浅快照，自定义嵌套数据不做深复制；index 是本轮数组下标，仅用于事件上下文，不作为绑定值。关闭原因 confirm/cancel/mask/close；确认顺序 close → update:modelValue → confirm，取消为 close → cancel。滚动期间确认禁用，不提交未稳定的草稿。

文字 16px，行高至少 48px 并跟随 core 字号偏移；关闭图标固定 22px，点击区域 44px；确认按钮及安全区复用现有组件。原生滚轮表现需目标端验证。放在 page overlay 中，自动导入组件，不给 ucs-* 节点添加布局 class。首页提供演示。

验证：`node --experimental-vm-modules uni_modules/ucs-design-ui/tests/picker.cjs`。

## ucs-datetime-picker

日期时间滚轮面板，顶部为固定 22px 关闭图标（44px 点击区域）和居中标题，底部为默认尺寸 ucs-button 确认按钮；滚轮与按钮间隔 24px，按钮下方 20px 留白，安全区另由 popup 添加。复用 popup 底部弹出、全局浮层与安全区，不内置输入框或表单展示行。通过 ref.open()/close() 控制显示，v-model 仅表示已确认值；滚动修改草稿，确认后更新值，取消、遮罩及程序关闭不提交。

```vue
<script setup>
import { ref } from 'vue'
const pickerRef = ref(null)
const appointment = ref('')
// pickerRef.value?.open()
</script>
<template>
  <ucs-datetime-picker ref="pickerRef" v-model="appointment" mode="datetime"
    title="预约时间" min="2026-01-01 00:00" max="2030-12-31 23:59" />
</template>
```

| 属性 | 默认值 | 说明 |
| --- | --- | --- |
| modelValue | '' | 已确认值，支持 v-model；空值或非法值打开时使用本地当前时间并限制到范围 |
| mode | datetime | date：YYYY-MM-DD；time：HH:mm；datetime：YYYY-MM-DD HH:mm |
| min / max | '' | 格式同模式；默认日期范围 1900-01-01～2100-12-31，时间 00:00～23:59 |
| title | '' | 顶部标题 |
| confirmText | '' | 底部确认文案，空白使用 core common.confirm |
| closeOnClickMask | true | 遮罩取消；取消时不修改绑定值 |

年月日按本地日历字段处理，不依赖日期字符串的 Date 解析，不转 UTC；支持闰年、月末和分钟级边界联动。日期年份支持 1000～9999，日期边界应提供完整格式；min 大于 max 或边界非法时 open 返回 false 并派发 error(Error)。不支持秒、农历、日期区间或跨午夜 time 范围。过大的年份范围会增加原生滚轮选项数量，建议按业务限定。

mode、min、max、modelValue 每次 open 读取，当前面板打开后外部修改不会覆盖草稿，下次打开才生效；重复 open 不重置草稿。标题、操作文案、主题和字号实时更新；菜单文字 16px，行高随字号增长，默认 48px，显示五行。滚动开始时禁用确认，滚动结束恢复；未稳定时 confirm 不提交。

事件：open；close(reason)，reason 为 confirm/cancel/mask/close；update:modelValue(value)；confirm(value)；cancel(reason)，reason 为 cancel/mask；error(Error)。确认顺序为 close → update:modelValue → confirm；取消为 close → cancel，程序 close 不派发 cancel。不提供自定义内容插槽。放在 ucs-page 的 overlay 中，组件自动导入；原生滚轮的实际表现需在目标端验证。

首页提供三种模式演示。验证：`node --experimental-vm-modules uni_modules/ucs-design-ui/tests/datetime-picker.cjs`。

## ucs-empty

空状态展示组件，复用参考项目 ucs-empty 的 12 种 SVG 插画构图；颜色通过当前 core 解析，随主色及明暗主题变化。使用原生 image 渲染 UTF-8 Base64 SVG Data URL，不依赖 ucs-svg 或旧配置模块。不自动判断空数据、错误或分页结果，不设置外部高度、背景或内置操作按钮。

```vue
<ucs-empty type="data" />
<ucs-empty type="network" description="暂时无法获取内容">
  <ucs-button text="重新加载" @click="reload" />
</ucs-empty>
<ucs-empty description="还没有记录">
  <template #image><ucs-icon name="star" :size="64" /></template>
</ucs-empty>
```

| 属性 | 默认值 | 说明 |
| --- | --- | --- |
| type | data | data/content/notice/permission/review/network/offline/link/image/maintenance/upload/download；无效值回退 data |
| description | '' | 描述，空白时读取 core empty 对应类型的多语言文案 |
| descriptionColor | ['gray-7','gray-8'] | 描述颜色，支持 core 色阶、外部颜色及明暗数组 |
| imageWidth | 148 | 内置插画宽度 px，无效值回退 148；高度按每种原图比例计算，不随字号缩放 |

描述基础字号 14px，跟随全局字号偏移，允许换行；插画与描述间距 16px，操作区上方间距 12px。默认插槽放置自定义操作，image 插槽替换插画，自定义插画自行管理尺寸。没有点击事件或 ref 方法，操作由插槽中的按钮处理。与 ucs-load-more 的 finished（没有下一页）不同，empty 表达当前内容整体为空。

首页提供切换 12 种插画的演示。SVG 原图保存在组件目录的 illustrations.js，builder.js 保留主题映射和原图尺寸，svg.js 按类型及已解析颜色共享最多 32 项的 LRU 编码缓存，尺寸变化不重新编码。Base64 工具由 empty 与 spinner 共用 internal/svg.js；目标端需支持 image 的 SVG Data URL。验证：`node --experimental-vm-modules uni_modules/ucs-design-ui/tests/empty.cjs`。

## ucs-action-sheet

底部操作菜单，复用 ucs-popup 的全局浮层、动画和底部安全区；通过组件 ref.open()/close() 控制，不提供 show 属性或插槽。结构参考 WeUI：可选说明标题、菜单主副标题、危险操作、8px 分隔区及取消行；上方圆角 12px。首页提供包含禁用项的演示。

```vue
<script setup>
import { ref } from 'vue'
const sheetRef = ref(null)
const actions = [
  { text: '示例菜单' },
  { text: '示例菜单', description: '副标题' },
  { text: '负向菜单', type: 'danger' },
  { text: '不可用菜单', disabled: true }
]
function onSelect({ item, index }) { /* 根据 index 或 item 执行业务操作 */ }
// sheetRef.value?.open()
</script>
<template>
  <ucs-action-sheet ref="sheetRef" title="这是一个标题，可以为一行或两行。" :actions="actions" @select="onSelect" />
</template>
```

属性：title 默认空、actions 默认 []、showCancel 默认 true、cancelText 默认使用 core common.cancel、closeOnClickMask 默认 true。actions 的 text 为必填字符串，description 为可选副标题，type 支持 default/primary/success/warning/danger，无效值按 default 处理，disabled 为布尔值。所有颜色直接由 core 解析，不额外修正色彩。

菜单及取消基础字号 16px/行高 24px，说明与副标题 12px/行高 18px，跟随全局字号；普通菜单行基础高度 56px，副标题行自动增高。标题允许换行，菜单主副标题单行省略；菜单按内容自然撑开，不设置高度上限或内部滚动。长篇标题和大量复杂内容请使用 popup 自定义布局。

事件 open 在接受打开后派发。select 参数为 `{ item, index }`，在点击可用项并开始关闭后派发；取消按钮和遮罩派发 cancel，参数分别为 cancel 和 mask。close 在开始关闭时先于 select/cancel 派发，原因是 select/cancel/mask/close；程序 close() 不派发取消。重复打开幂等，关闭或退出中不重复派发选择。禁用项不触发选择。组件不等待业务 Promise；需要异步确认及错误保留时使用 dialog。

建议与其他 popup 同级放在页面 overlay 插槽内，避免滚动裁剪；安全区不要在外层重复添加。原生 button 仅作为透明交互层，内部文字由独立 UCS 组件渲染。

验证：`node --experimental-vm-modules uni_modules/ucs-design-ui/tests/action-sheet.cjs`。

## ucs-dialog

确认对话框，内部复用 ucs-popup，自动接入同一浮层栈，外观参考 [WeUI Dialog](https://weui.io/#dialog)。仅通过 ref.open()/close() 控制，无 show 属性。宽度 654rpx，左右各留 48rpx，圆角 12px；宽度由 CSS 随屏幕适配，无需读取窗口信息。标题、正文和操作文字均为 16px，标题 500 字重；主题及字号经 core 解析，确认/取消文案来自 common.confirm/common.cancel。

```vue
<template>
  <view><ucs-button text="删除记录" @click="dialogRef?.open()" /></view>
  <!-- 使用 ucs-page 时放在 overlay 插槽，与其他浮层同级。 -->
  <ucs-dialog ref="dialogRef" title="删除记录" message="删除后无法恢复，是否继续？"
    confirm-type="danger" :before-close="beforeClose" @error="onError" />
</template>
<script setup>
import { ref } from 'vue'
const dialogRef = ref(null)
async function beforeClose(action) {
  if (action === 'cancel') return
  await deleteRecord() // 项目自己的业务请求；成功后关闭，抛错后保留对话框。
}
function onError({ action, error }) {
  // 项目自行展示错误，例如 pageRef.value?.showToast({ text: error.message, type: 'error' })。
}
</script>
```

| 属性 | 默认值 | 含义 |
| --- | --- | --- |
| title | 空字符串 | 标题，为空时不渲染标题区域 |
| message | 空字符串 | 默认正文；默认插槽替换此区域 |
| confirmText / cancelText | 空字符串 | 空白时使用内置多语言文案 |
| confirmType | primary | 支持 primary/success/warning/danger/default |
| showCancel | true | 取消按钮开关；关闭后确认按钮占满操作区域 |
| vertical | false | 操作纵排：确认在上、取消在下；横排时取消在左 |
| closeOnClickMask | false | 开启后遮罩点击走 cancel 操作，也经过 beforeClose |
| beforeClose | null | 接收 confirm/cancel，支持同步或异步；严格返回 false 时阻止关闭 |

操作区为无填充的文字按钮，基础高度 56px，字号增大时同步增高，以细线分隔；确认文字直接使用 confirmType 对应的 core 色阶。标题、正文和操作文字基础行高均为 24px，标题字重 500，正文与操作文字字重 400。内容四周留白 24px，标题与正文间隔 12px；无标题时正文补上方 24px。原生 button 只提供透明点击层，文字与圆环位于其外部，避免原生按钮子组件限制。

回调执行中禁止重复确认和取消，发起操作的按钮显示 loading。回调抛错派发 `error({ action, error })`，停止 loading 并保留对话框；不自动显示错误提示。`confirm`、`cancel` 仅在回调允许且发起关闭后通知，不能通过这些事件监听器的返回值阻止关闭或等待异步请求。

`open` 在接受新一轮打开后派发。`close(reason)` 在开始关闭时派发，reason 为 confirm、cancel、close；若为确认/取消关闭，随后再派发对应的 confirm/cancel 事件。重复 open/close 保持幂等。主动调用 close() 不经过 beforeClose，允许中止等待并关闭；不能取消业务请求，但旧回调不会关闭后来重新打开的对话框或派发过期错误。

默认插槽只替换正文，提供 pending，可放原生输入框和自定义布局；标题和按钮保留。关闭后正文随 popup 销毁，需要保留的数据由页面持有。长内容自行安排滚动，不自动处理键盘、原生返回键或跨原生窗口覆盖。首页演示有标题横排、无标题危险操作、纵排、异步提交、失败重试和自定义正文校验。

验证：`node --experimental-vm-modules uni_modules/ucs-design-ui/tests/dialog.cjs`。

## ucs-popup

同页弹出层，支持 top、bottom、left、right、center 五种位置。内容通过默认插槽设计，不自动添加标题、按钮或业务操作。建议放在 ucs-page 的 overlay 插槽，避免被滚动区域或其他父节点裁剪。

```vue
<template>
  <ucs-page>
    <button @click="popup?.open()">打开弹层</button>
    <template #overlay>
      <ucs-popup ref="popup" placement="bottom" :radius="16">
        <view style="padding: 24px">
          <ucs-text text="自定义弹层内容" />
          <button @click="popup?.close()">关闭</button>
        </view>
      </ucs-popup>
    </template>
  </ucs-page>
</template>
<script setup>
import { ref } from 'vue'
const popup = ref(null)
</script>
```

| 属性 | 默认值 | 说明 |
| --- | --- | --- |
| placement | bottom | top / bottom / left / right / center，忽略大小写和空白，无效值回退 bottom |
| closeOnClickMask | true | 点击遮罩是否关闭 |
| safeAreaInsetBottom | true | 仅 bottom 弹层自动添加 ucs-safe-area；外层已避让时关闭 |
| backgroundColor | ['#FFFFFF', '#262626'] | 内容背景，通过 core 解析主题颜色 |
| radius | 0 | 非负有限圆角，px；边缘弹层只处理朝向页面内容的两角，居中弹层处理四角 |

仅通过组件 ref 的 open()/close() 控制显示，不提供 show 属性或双向绑定事件。重复操作保持幂等，同一轮连续开关以最后一次指令为准。open、close 在开始打开/关闭时派发。clickMask 在入场动画和误触保护结束后派发原生事件，即使 closeOnClickMask=false 也派发；内容点击不会触发遮罩关闭。打开前修改 placement 或内容尺寸等响应式数据时，先等待 nextTick 确保配置传入。placement 仅在下一次 open() 时提交为本轮方向，修改属性不会立即移动保留的面板。

固定定位宿主随组件挂载保留，关闭时为空且 pointer-events 为 none，不阻挡页面。每次 open 创建唯一 key 的遮罩和内容，避免在原生端反复创建 fixed 宿主。关闭完成后销毁内部视图，插槽组件和局部状态不跨打开保留；需要保留的数据由页面持有。退出中再次 open 会重新创建内容并从起点执行新一轮入场，不再反向复用旧节点。与旧版保留插槽状态的行为不同。

CSS keyframes 负责五个方向的进出与遮罩渐变，时长 240ms；动画名通过 CSS 类声明，面板和遮罩的基础样式为 opacity: 0，避免原生动画接管前在最终位置闪现。animation-fill-mode: forwards 保留结束帧，初始透明状态由普通样式提供；入场计时结束只启用交互，不移除动画类或重置动画，避免结束时跳变。打开即挂载，不查询布局、不切换 display、不通过 JS 动态 transform 或透明准备阶段触发入场，也没有 50ms 入场等待或 1000ms 布局兜底。JavaScript 仅在 nextTick 后安排本轮生命周期结束；到期启用遮罩点击或卸载退出内容，不依赖动画完成事件。操作编号隔离旧渲染任务与定时回调，关闭后旧回调不会销毁新一轮内容。

可见性由 CSS animation 驱动，本组件的 App 动画效果要求 uni-app-x Vapor 5.31+，不支持旧版 App VDOM。参考 [官方 animation-fill-mode 兼容性](https://doc.dcloud.net.cn/uni-app-x/css/animation-fill-mode.html)。普通 uni-app Vue3 的 WebView 与 H5 使用浏览器 CSS 动画，仍需目标环境验证。

同一次打开仅保存 id、方向和 enter/open/leave 阶段。重复 open/close 保持幂等；同一轮未提交渲染时 close 会直接取消挂载。遮罩只在入场计时结束且当前 popup 位于全局栈顶时允许关闭；退出期间保留栈项以阻止点击穿透，结束后释放记录。遮罩与内容定位框同级，分别使用管理器分配的层级。

top/bottom 占满宽度，left/right 占满高度，center 由内容决定，左右及居中需要给内容明确宽度。面板采用完整固定布局键及圆角键，长内容自行安排滚动。class/style 透传宿主，不直接设置内部内容尺寸。页面切换不自动暂停或关闭浮层；不处理键盘避让、原生返回键和页面滚动锁定。多 popup 应在 overlay 中同级放置，不保证覆盖原生导航栏、Tabbar 或其他原生窗口。

Android 蒸汽模式已实测五方向反复开关、双层弹窗和同步 close()/open()。逻辑测试覆盖固定宿主保留、内部挂载销毁、入场结束动画类稳定、旧任务隔离及层级关系。iOS、鸿蒙与普通 uni-app Vue3 尚需对应设备验证。


## ucs-status-bar

顶部系统状态栏占位，适合 `navigationStyle: custom` 的自定义导航栏。在自定义导航内容上方放置，无默认插槽，不包含导航栏主体或小程序胶囊区域，不修改系统状态栏文字颜色。原生导航栏或外层已预留状态栏时不要重复添加。不支持 nvue。

```vue
<ucs-page>
  <template #header>
    <ucs-status-bar background-color="gray-1" />
    <view><!-- 自定义导航内容 --></view>
  </template>
</ucs-page>
```

仅提供 `backgroundColor`，默认 transparent，支持 core 色阶、外部颜色和明暗数组。高度自动适配、不随字号缩放，无手动高度、测量事件或公开方法。

uni-app-x 使用 `var(--status-bar-height)`；普通 uni-app 的 App、Web 和小程序在样式 computed 求值时直接读取 `uni.getWindowInfo().statusBarHeight`，不监听窗口变化。背景或主题变化触发样式重算时会重新读取；只有窗口变化不会主动刷新高度。使用平台 API 返回的实际值，不另行测量。背景色随主题更新，class、style 透传根 view，避免覆盖占位高度。测试覆盖平台分支与模拟 API，实际设备占位效果仍需真机验证。

## ucs-safe-area

底部安全区占位组件，无默认插槽，不处理键盘避让。用于自定义底部操作栏、Tabbar 或弹层。原生 Tabbar、宿主或外层已避让时，不重复添加。

```vue
<ucs-page>
  <template #footer>
    <view><!-- 自定义底部操作栏 --></view>
    <ucs-safe-area background-color="gray-1" />
  </template>
</ucs-page>
```

| 属性 | 默认值 | 说明 |
| --- | --- | --- |
| backgroundColor | transparent | 背景色，由 core 解析色阶、外部颜色或明暗数组 |

uni-app-x 使用页面级 `var(--uni-safe-area-inset-bottom)`；普通 uni-app 的 Web/WebView/小程序统一使用 `constant()`/`env(safe-area-inset-bottom)`，不读取窗口 API、不监听窗口变化。环境变量支持及实际返回值取决于宿主，不支持时回退为 0px。不支持 nvue。CSS 环境变量不会自动处理 Web 模拟 Tabbar 的高度，应由页面布局处理，且 App 宿主已预留底部安全区时不要重复添加。

不根据字号缩放，无需测量或手动刷新。不提供高度属性、测量事件或公开方法。class、style 透传根 view，避免覆盖安全区高度。测试覆盖条件编译和主题变化，实际各端安全区占位效果仍需真机验证。

## ucs-page

根节点默认注入 core `useThemeColorCssVars()` 的 67 个颜色变量：`--ucs-primary-1`～`--ucs-primary-10`，secondary/success/warning/danger 同范围，以及 `--ucs-gray-1`～`--ucs-gray-12`，另有 `--ucs-primary`、`--ucs-secondary`、`--ucs-success`、`--ucs-warning`、`--ucs-danger` 五项第 6 阶别名。无编号变量随明暗模式改变，与对应的 -6 变量保持相同，secondary 缺省时沿用 primary；没有无编号 gray。主题及主色变化会更新变量值，颜色不另行加工；没有字号、间距、圆角或层级变量。变量供 page 后代使用，包括 header、主体、scroll-footer、footer 和 overlay，不是应用全局注入；脱离该节点树的内容需自行绑定。现有组件继续使用 getThemeColor，不依赖这些变量。

```css
.custom-panel {
  background-color: var(--ucs-gray-2);
  border-color: var(--ucs-primary-6);
}
```

不使用 ucs-page 时，可从 core 导入 useThemeColorCssVars() 并将返回的 computed 绑定到自己的外层 view。映射在同一 core store 内共享且只读，不受页面刷新进度、字号或语言变化影响。原生平台对自定义 CSS 变量的限制见 [官方说明](https://doc.dcloud.net.cn/uni-app-x/css/common/function.html)。

内置 ucs-toast，ref 方法 showToast(options)/hideToast() 直接转发轻提示参数；不新增 toast 相关 props 或插槽。提示位于滚动主体之外并自动接入 App 级浮层栈，不阻挡点击、不改变主体 loading 或下拉刷新状态；随页面卸载清理提示与定时任务。

主体加载通过 ref 的 `showLoading(delay = 0)` / `hideLoading()` 控制，不提供 loading 属性或 loading 插槽。省略延迟或传 0 立即显示，传 200 则延迟 200ms。圆环沿用固定 28px 主色 ucs-spinner，加载层透明，无文字、底座或阴影。加载层仅覆盖主内容区域，header、footer 和 overlay 保持原有行为；主内容和 scroll-view 不会因加载显隐而重建。静态主体（scrollEnabled=false）同样支持加载层。

```js
page.value?.showLoading(200) // 省略参数时立即显示
try {
  await loadPageData()
} finally {
  page.value?.hideLoading()
}
```

调用后立即进入加载状态并阻止主体交互，延迟只控制圆环的出现。等待期间 hideLoading() 会取消显示，短请求不会闪出圆环；已经出现时立即隐藏，不强制最短展示时间。重复 showLoading() 不重新计时，也不覆盖本轮延迟。延迟参数仅接收有限非负数字，其他值回退 0；正数向下取整，最大 2147483647ms。取消和卸载会清理定时器并使旧回调失效。不做请求计数或网络监听；并行请求由页面统一管理关闭时机。加载期间拦截主体触摸、屏蔽 scrolltolower 通知并阻止新刷新，隐藏后恢复。不会替调用方结束已有刷新或请求；已有刷新仍通过 stopPullDownRefresh() 结束。原生滚动事件仍可通知位置变化。组件卸载后显隐方法不再生效。首页提供 1 秒主体加载演示。

页面容器采用固定 header/footer、原生 scroll-view 主体、容器外 overlay 浮层的布局。关闭 scrollEnabled 时使用静态主体，下拉刷新同时停用。容器默认绝对定位并填满父级，嵌套使用时父级需要明确尺寸和定位。

```vue
<template>
  <ucs-page ref="page" refresher-enabled @refresherrefresh="refresh">
    <template #header><ucs-text text="消息" :size="22" /></template>
    <ucs-text v-for="item in messages" :key="item.id" :text="item.title" />
    <template #scroll-footer><ucs-text text="没有更多了" /></template>
    <template #footer><ucs-text text="底部固定区域" /></template>
  </ucs-page>
</template>

<script setup>
import { ref } from 'vue'
const page = ref(null)
const messages = ref([])
async function refresh() {
  try {
    // 在这里加载数据并更新 messages。
  } finally {
    page.value?.stopPullDownRefresh()
  }
}
</script>
```

下拉刷新采用无可见文字的悬浮圆环方案：40px 明暗主题底座、24px 渐隐圆环和轻阴影；下拉时圆环渐显并转动，松手刷新时开始 CSS 旋转；结束后底座保持 40px，使用 ucs-icon 的 checkmark 字体图标，停留 500ms，再交由原生容器收起。各状态底座位置一致，刷新区域不随字号偏移变化，上下各保留 12px 阴影空间。勾选表示刷新流程已结束，业务失败时由调用方自行提供错误提示。

| 属性 | 默认值 | 说明 |
| --- | --- | --- |
| backgroundColor | ['#FFFFFF', '#141414'] | 页面背景，通过 core 解析明暗数组或颜色字符串 |
| scrollEnabled | true | 开启滚动主体；关闭后同时关闭下拉刷新 |
| upperThreshold / lowerThreshold | 50 | 原生滚动到顶/底的触发距离，px |
| scrollTop / scrollIntoView | 0 / 空字符串 | 原生滚动位置或目标后代元素 id |
| scrollWithAnimation / enableBackToTop | false | 原生滚动动画与状态栏回顶开关 |
| refresherEnabled | false | 开启自定义下拉刷新 |
| refresherThreshold | 64 | 下拉触发距离，px；无效值回退 64，最小 64，容纳底座和上下各 12px 阴影留白 |

默认插槽为主体；header、footer 固定在滚动区域之外，scroll-footer 在正文不足一屏时位于主体可视区域底部，超过一屏时接在正文之后随内容滚动；overlay 位于滚动容器之外。该布局仅使用 CSS，不测量高度或监听尺寸。

页面滚动和原生手势事件继续透传。仅通过 ref 的 startPullDownRefresh()/stopPullDownRefresh() 主动开始或结束刷新，不提供 refresherTriggered 属性或双向绑定事件。startPullDownRefresh() 在禁用或已刷新时返回 false；成功进入新一轮时返回 true 并同步派发一次 refresherrefresh，参数为 null。原生手势触发时保留原生事件参数；同轮迟到的原生回调不会再次派发刷新事件。请求应统一在 refresherrefresh 处理，完成后调用 stopPullDownRefresh()。开始方法也可在完成反馈或复位期间开启新一轮，旧定时器会取消。恢复启用滚动或刷新能力不会自动发起刷新。组件挂载后才可调用，卸载后开始方法返回 false。

刷新区域仅显示圆环和字体勾选图标，不读取状态文案。背景及主色随主题变化。当前实现未提供读屏状态播报。

实现面向当前 uni-app-x 蒸汽模式项目。自定义 refresher 节点是 scroll-view 的最后一个直接子节点；支付宝小程序不渲染该自定义插槽，暂不支持此刷新外观。未移植参考组件的旧 App-Vue 覆盖层分支。容器不自动增加安全区，也不接管原生导航栏；由页面的 header/footer 自行处理。鸿蒙、Android、iOS 的实际手势、回弹与阴影需在目标设备验证。

## ucs-text

```vue
<ucs-text :size="16" :line-height="24" :color="['gray-12', 'gray-10']" :weight="600">
  页面标题
</ucs-text>
<ucs-text text="超出两行时省略" :max-lines="2" width="100%" />
<ucs-text :text="0" color="#1890FF" :selectable="true" />
```

| 属性 | 默认值 | 说明 |
| --- | --- | --- |
| text | 空字符串 | 字符串或数字；默认插槽优先，数字 0 正常显示 |
| size | 14 | 大于零的基础字号，单位 px；使用 core 的字号偏移 |
| lineHeight | 0 | 大于零时指定基础行高，默认基础字号的 1.5 倍；按实际字号与基础字号的比例缩放 |
| color | ['gray-12', 'gray-10'] | 由 core 统一解析色阶键、CSS 颜色或一到两项明暗数组；暗色项省略或为 null/undefined 时复用亮色 |
| weight | 空字符串 | 数字或 CSS 字重字符串，默认继承 |
| align / decoration | 空字符串 | text-align / text-decoration-line |
| letterSpacing | 0 | px，允许负数，不随字号偏移缩放 |
| maxLines | 0 | 大于零时向下取整；结果小于 1 时不截断，内部转换为原生 max-lines=-1，避免传 0 隐藏文本 |
| wrap | true | false 时强制单行省略，优先于 maxLines |
| width | 空字符串 | 数字按 px 处理，允许 0；字符串作为 CSS 长度；默认不改变行内布局 |
| fontFamily / fontStyle | 空字符串 | 自定义字体族 / 字体样式 |
| selectable | false | 透传原生文本选择属性 |

组件使用 JS script setup，未引入参考代码中的 variant 排版角色和旧 ucs-design-config 依赖。无效或非有限字号回退 14；无效行高回退 1.5 倍基础字号。class、style 及其他原生属性通过根 text 透传；外部 style 可覆盖组件计算的样式。

轻触时按顺序触发 tap、click，长按触发 longpress，均传递原始事件；同一动作只需订阅 tap 或 click 之一。默认插槽建议放行内文本。

颜色须为非空字符串，空数组或无效类型会由 core 抛出 TypeError。内部色表未命中时作为外部颜色返回，组件不提供特殊关键字处理；请使用目标平台支持的颜色值。

Web 和小程序通过 CSS 处理省略；uni-app-x App 蒸汽模式绑定 max-lines，旧版 App 分支保留 lines 样式。截断需要父布局提供有效宽度约束，跨端选择文本、虚拟宿主、点击和实际省略效果仍需在目标平台验证。

## ucs-image

```vue
<ucs-image src="/static/logo.png" :width="80" radius="50%" mode="aspectFill" />
<ucs-image :src="avatar" error-src="/static/default-avatar.png"
  :width="120" :height="80" :radius="8" :placeholder-color="['gray-2', 'gray-3']" />
```

| 属性 | 默认值 | 说明 |
| --- | --- | --- |
| src | 空字符串 | 主图地址；变化后重置加载记录和备用图状态 |
| errorSrc | 空字符串 | 主图失败时切换的备用图；为空或与当前主图相同时不替换 |
| mode | scaleToFill | 透传原生 image 的裁剪与缩放模式 |
| width | 100 | 非负数字按 px 处理，也支持 CSS 长度字符串；无效值回退 100px |
| height | 0 | 0、'0'、空值或无效数字沿用宽度；'0px' 为显式零高度 |
| radius | 0 | 非负数字按 px 处理，也支持百分比等 CSS 长度 |
| placeholderColor | transparent | 由 core 统一解析色阶键、CSS 颜色或一到两项明暗数组；作为背景，加载后仍保留；颜色须为非空字符串 |
| showMenuByLongpress | false | 原生长按菜单开关，实际能力由平台决定 |

未指定高度时沿用宽度的 CSS 长度；像素宽高相同时为正方形，百分比等相对长度取决于父布局。图片尺寸不自动跟随字号偏移；文字旁的配套图标请使用 ucs-icon，由图标组件管理尺寸联动。

load、error 转发当前主图或备用图的原生事件，主图 error 在切换备用图前触发。每次 src 变化最多回退一次，备用图失败只报告错误；单独修改 errorSrc 不会主动重新加载。旧加载记录的迟到事件会被忽略。

轻触时依次触发 tap、click，长按触发 longpress。class、style 和其他原生属性透传至根 image，默认 flex-shrink: 0；图片来源、原生模式、长按菜单及圆角效果仍需在目标平台验证。

## ucs-icon

```vue
<ucs-icon name="home" :size="24" color="primary-6" />
<ucs-icon name="checkmark" :size="20" :base-font-size="14" />
<ucs-icon name="/static/logo.png" :size="24" :base-font-size="14" />
```

| 属性 | 默认值 | 说明 |
| --- | --- | --- |
| name | 空字符串 | core 内置/项目字体图标名称，或图片地址 |
| size | 24 | 基础尺寸，单位 px；非有限值或非正数回退为 24 |
| scaleWithFont | true | 是否允许跟随全局字号变化；false 时字体和图片图标均固定使用 size，忽略 baseFontSize |
| baseFontSize | undefined | 仅图片图标使用的配套文字基础字号，须为有限正数；省略时图片尺寸固定 |
| color | ['gray-12', 'gray-10'] | 字体图标颜色，由 core 统一解析字符串或明暗数组；不对图片染色 |

默认字体图标使用 getFontSize(size)，容器、字号与行高共用结果。例如基础尺寸 24px、字号偏移 2 时，实际尺寸为 26px，baseFontSize 不参与字体图标计算。设置 :scale-with-font="false" 后，字体、行高与容器尺寸均保持 24px，不叠加字号偏移。

允许缩放时，图片图标使用 getIconSize(size, baseFontSize)。例如图标 24px、配套文字基础字号 14px、全局字号偏移 2 时，图片图标约为 27.43px；不传 baseFontSize 时仍为 24px。scaleWithFont=false 时固定为 size，不再使用 baseFontSize。

name 支持绝对/相对路径、带协议 URL、data:image、blob 地址及常见图片扩展名，图片使用 aspectFit。普通名称由 getIconDefinition 解析，未知名称保留占位尺寸并显示空字形。内置 @font-face 沿用参考组件的同一份 UcsDesignIcons TTF；项目图标覆盖使用 core 配置，项目字体资源仍由宿主提供。

轻触时依次触发 tap、click，长按触发 longpress，均传递原始事件。class、style 和其他原生属性透传至当前 image 或 text 根节点；字体加载与图片格式的实际支持情况仍需目标平台验证。

## ucs-spinner

```vue
<ucs-spinner :size="32" color="primary-6" />
<ucs-spinner :size="20" :color="['primary-6', '#FFFFFF']" />
<ucs-spinner :animated="false" />
<ucs-spinner :size="24" :scale-with-font="false" />
```

| 属性 | 默认值 | 说明 |
| --- | --- | --- |
| size | 24 | 基础圆环外径，单位 px；无效数字回退 24 |
| scaleWithFont | true | 是否叠加全局字号偏移；false 时固定使用 size |
| color | primary-6 | 渐隐圆环与圆头的颜色，支持 core 的颜色字符串或明暗数组 |
| animated | true | 是否启用 CSS 旋转；关闭后显示初始静态圆环 |

组件提供 size、scaleWithFont、color、animated。默认通过 getFontSize(size) 叠加全局字号偏移，容器和图片共用同一尺寸；例如基础 24px、偏移 2 时为 26px，关闭 scaleWithFont 后固定 24px。圆环线宽固定为外径的 7/80，随图形同比缩放，背景透明。颜色直接调用 getThemeColor，空数组或非字符串等无效输入遵循 core 的校验规则。

外观参考 [WeUI loading](https://weui.io/#loading) 的双渐变圆环和圆头，使用 UTF-8 Base64 SVG Data URL 绘制。core 解析后的 color 会写入 SVG，主题颜色变化会更新图片地址；尺寸变化复用同一图片。外部颜色须能在 SVG 内独立解析，宿主 CSS 变量不会自动传入图片。

动画节点显式关闭 flatten。

SVG 编码缓存按解析后的颜色在组件实例间共享，最多保留 64 个颜色；尺寸变化不生成新 SVG。缓存仅保存图片地址，不保存组件、DOM 或业务配置引用。

内层用 CSS @keyframes 每 1s 匀速旋转一周。SVG 不包含 animateTransform；关闭 animated 回到初始静态图形，没有 JS 定时器或元素动画。class、style 和其他原生属性透传外层；需要改变整个圆环尺寸时使用 size。

uni-app-x App 的 CSS animation 需要 Vapor 5.31+，旧版 VDOM 不支持该 CSS 动画。使用 image 加载静态 SVG，不依赖内联 SVG 或 SVG 动画。支持范围参见 [官方 animation 文档](https://doc.dcloud.net.cn/uni-app-x/css/animation.html) 与 [image SVG 说明](https://doc.dcloud.net.cn/uni-app-x/component/image.html#svg注意事项)，具体目标平台效果仍需编译和真机验证。

## 本地验证

由宿主提供 vue、@vue/compiler-sfc 和 @dcloudio/uni-cli-shared 后运行：

```shell
node --experimental-vm-modules uni_modules/ucs-design-ui/tests/text.cjs
node --experimental-vm-modules uni_modules/ucs-design-ui/tests/image.cjs
node --experimental-vm-modules uni_modules/ucs-design-ui/tests/icon.cjs
node --experimental-vm-modules uni_modules/ucs-design-ui/tests/spinner.cjs
```

测试覆盖 SFC 编译、真实 Vue 响应式字号与主题、颜色解析、尺寸、截断、事件以及条件编译分支，并检查图片备用图、迟到事件、父级同步切换地址、图标映射与固定/比例尺寸；不代替 HBuilderX 原生构建和真机验证。
