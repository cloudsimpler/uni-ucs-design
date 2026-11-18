# 配置与基础能力

面向 uni-app Vue 3 和 uni-app-x 蒸汽模式的 JS 基础能力。当前提供十项响应式配置，主题色阶使用内置 arco-design-color，应用请求实例使用内置 ucs-request；外部运行依赖为宿主 Vue。独立请求实例和校验插件也可从各自目录单独引入。

## 初始化和响应式读取

当前示例在 main.js 的 createApp() 中、createSSRApp() 之前执行 initializeConfig：主色 #1890FF、辅助色 #14B8A6、字号偏移 0、语言 zh-Hans。页面语言包也在启动时注册，页面挂载不重复初始化或覆盖回退语言。回退语言设为 zh-Hans，以演示英文/繁中缺少文案时的回退。

首页演示字号偏移、固定图片尺寸及配套图标缩放。使用 +1/−1 可验证响应式变化，“恢复启动偏移”恢复为 0；已有明暗、主色和语言切换演示继续可用。

```javascript
import { initializeConfig, updateConfig, getConfig, useConfig } from '@/uni_modules/ucs-design-ui/index.js'

// 应用启动阶段执行；会重置未提供的字段。
initializeConfig({
  themeMode: 'light',
  themeColors: { primary: '#1890FF' },
  language: 'zh-Hans',
  iconFontFamily: 'ProjectIcons',
  icons: { add: '\ue001' }
})

// 运行时只更新提供的字段。
updateConfig({ themeMode: 'dark', typographyOffset: 1 })

// 在页面 setup 中：稳定的只读 computed Ref，嵌套内容也禁止修改。
const config = useConfig()
// 模板可读取 config.themeMode；JS 中读取 config.value.themeMode。
// const primary = computed(() => config.value.themeColors.primary)

// 独立快照，修改此对象不会更新全局配置。
const snapshot = getConfig()
```

字号偏移不自动缩放组件，主题模式不自动注入样式，语言切换不自动同步 uni locale，字体族也不自动加载字体文件。主题色通过内置 arco-design-color 生成当前模式的十阶色板，组件通过模板或 computed 消费。

## 主题设置与色阶读取

| API | 用途 |
| --- | --- |
| setThemeMode('light' / 'dark') | 设置当前明暗模式 |
| getThemeMode() | 读取当前明暗模式 |
| setThemeColor(name, color) | 设置一个主题种子色；secondary 可传 null 清除 |
| updateThemeColors(colors) | 批量更新提供的种子色，其余保持原值 |
| getThemeColor(color) / getThemeColor(lightColor, darkColor) | 接收字符串、明暗数组或双参数；命中色表则解析，否则返回外部颜色 |
| useThemeColors() | 获取全部当前色板的只读响应式 Ref |
| useThemeColorCssVars() | 获取共享的只读响应式颜色 CSS 变量映射，共 67 项 |

通用颜色类型导出为 `ThemeColorValue = string | readonly [light: string, dark?: string | null]`，供组件和组合函数复用；它表示颜色值，不专属于输入框。不提供旧类型名称别名。

上述设置方法返回更新后的配置快照；无效输入拒绝整次修改。可设置的名称为 primary / secondary / success / warning / danger，另提供独立的 gray 灰阶。getThemeColor 根据色表实际键判断内部颜色，未命中的非空字符串作为外部颜色返回，不按名称前缀判断。没有独立的自动系统主题模式。

```javascript
import { computed } from 'vue'
import { setThemeMode, setThemeColor, updateThemeColors, getThemeColor, useThemeColors } from '@/uni_modules/ucs-design-ui/index.js'

setThemeColor('primary', '#1890FF')
updateThemeColors({ secondary: '#14B8A6', success: '#07C160' })
setThemeMode('dark')

const current = getThemeColor('primary-6') // 调用时的字符串快照
const textColor = computed(() => getThemeColor('gray-12', 'gray-10'))
const mixedColor = computed(() => getThemeColor(['gray-12', '#FFFFFF']))
const externalColor = getThemeColor('rgba(0, 0, 0, 0.5)')
const theme = useThemeColors()
const actionStyle = computed(() => ({ backgroundColor: theme.value['primary-6'] }))
// 模板中：<view :style="actionStyle">...</view>
// 或：<view :style="{ backgroundColor: theme['primary-6'] }">...</view>
```

色彩表是扁平的 `{ "primary-1": "...", ..., "gray-12": "..." }`，共 67 个键：五种主题色第 6 阶别名、各 10 阶色阶，加上 12 阶灰色。无需遍历或传入第二个阶数参数。无编号键 primary、secondary、success、warning、danger 分别是当前主题下对应第 6 阶颜色的别名，随明暗模式更新；secondary 未配置时沿用 primary。配置原色从 useConfig().value.themeColors 或 getConfig().themeColors 读取。明亮模式第 6 阶等于种子色；暗黑模式第 6 阶经过算法调整，不能视为原始色。这里只提供色板，不指定按钮、文字等语义用途。

secondary 为 null 时，其生成色板与 primary 一致，配置仍保留 null。更改主色或模式后自动更新，设置独立辅助色后不再随主色变化。色阶按需计算并在实例内缓存，无关的语言、图标等配置更新不重复生成；返回的响应式色板不可修改；需要独立快照时可使用 { ...useThemeColors().value }。

页面首页提供五组主题色阶、12 阶灰阶以及切换明暗、主色的示例。

## 配置字段

| 字段 | 默认值和规则 |
| --- | --- |
| themeMode | light；仅支持 light / dark |
| themeColors | primary #604CFC、secondary null、success #07C160、warning #EDA20C、danger #D9514C；六位十六进制颜色，按字段更新，去空格并转大写；仅 secondary 可为 null |
| typographyOffset | 0；任意有限数字，允许正数、负数和小数，不限制范围 |
| language | zh-Hans；必须匹配已注册语言，支持大小写、下划线规范化和基础语言匹配 |
| fallbackLanguage | zh-Hans；同上，当前语言缺少文案时使用 |
| designLanguagePacks | zh-Hans / zh-Hant / en 内置通用文案，仅 common.confirm / common.cancel；按语言和路径深合并 |
| i18nLanguagePacks | {}；项目语言包，按语言和路径深合并 |
| iconFontFamily | 空字符串；字体族名称，去除两侧空格 |
| icons | {}；图标名到字形字符串的映射，整项替换，{} 清空 |
| request | env auto、开发/生产地址空字符串、timeout 15000ms、headers {}；详情见默认请求配置 |

```javascript
updateConfig({
  i18nLanguagePacks: { fr: { home: { title: 'Bonjour' } } },
  language: 'fr',
  fallbackLanguage: 'en'
})
```

先合并语言包，再解析语言；允许一次调用注册并切换。en-US 可匹配 en；zh-CN 匹配 zh-Hans，zh-TW/HK/MO 匹配 zh-Hant，显式 Hans/Hant 优先。语言包键只做标签规范化，zh-CN 与 zh-Hans 可分别注册；不依赖 Intl。两套语言包任意一套注册即可选择该语言。

语言包根必须为普通对象，文案可为字符串、嵌套对象或数组；数组整项替换。不接受函数、null、数字和循环引用。空对象补丁保留已有文案；本次不提供局部删除语言包的接口，可通过重新初始化或重置清除项目覆盖。已清除参考项目中未使用的选择器、上传器、表单校验等组件文案。内置文案不自动连接 async-validator 插件；页面示例文案单独放在 pages/index/locales.js。

## 国际化 API 和页面示例

| API | 用途 |
| --- | --- |
| setLanguage(language) / getLanguage() | 设置或获取当前语言 |
| setFallbackLanguage(language) / getFallbackLanguage() | 设置或获取回退语言 |
| getUcsDesignText(path, options?) | 读取 designLanguagePacks 中的内置文案 |
| getI18nText(path, options?) | 读取 i18nLanguagePacks 中的项目文案 |

设置方法返回配置快照，非法或未注册语言会拒绝更新。

```javascript
import { computed } from 'vue'
import { setLanguage, getUcsDesignText, getI18nText, updateConfig } from '@/uni_modules/ucs-design-ui/index.js'

updateConfig({ i18nLanguagePacks: {
  'zh-Hans': { home: { welcome: '你好，{name}' } },
  en: { home: { welcome: 'Hello, {name}' } }
} })
const title = computed(() => getI18nText('home.welcome', { params: { name: 'UCS' } }))
const confirm = computed(() => getUcsDesignText('common.confirm'))
setLanguage('en') // title 和 confirm 自动更新
```

读取顺序：当前语言精确匹配 → 当前语言基础/中文文字体系匹配 → 回退语言精确及基础匹配 → options.fallbackValue → 路径本身。两个语言包命名空间互不混用。找到空字符串时保留空字符串；路径指向对象时视为缺失。options.params 替换 {name} 占位符，保留未提供参数的占位符，支持 0/false，不执行 HTML 或表达式。不自动切换 uni 原生组件的语言。

首页可切换简中、繁中、英文，展示插值和 common.confirm/cancel。示例中 demo.fallbackOnly 仅在简体中文提供，英文和繁体模式会显示来自默认回退语言 zh-Hans 的文本。页面的业务文案不会放入核心内置语言文件。

## 配置生命周期和校验

`secondary` 是独立的品牌辅助色，不表示主色色阶或次要按钮样式。默认 null 表示未指定；设置颜色启用，显式传 null 清除，省略字段保留当前值。消费组件需要时回退主色，配置本身保留 null：

```javascript
updateConfig({ themeColors: { secondary: '#14B8A6' } })
const secondary = computed(() => config.value.themeColors.secondary ?? config.value.themeColors.primary)
updateConfig({ themeColors: { secondary: null } }) // 清除辅助色
```


- initializeConfig(options)：以全新默认值为基础初始化。
- updateConfig(patch)：以当前配置为基础应用补丁。
- getConfig()：返回可独立修改的快照。
- useConfig()：返回稳定的只读 Ref；请每次通过 .value 读取，不要长期保存其中的旧对象。
- resetConfig()：恢复内置默认值。

生命周期写操作返回更新后的独立快照。未知字段、类型错误和非法值抛 TypeError（含 issues），整次更新不生效；字号偏移仅校验为有限数字，不截断或修正范围。配置非空 icons 但字体族为空时，写入成功并通过 console.warn 输出诊断；自定义映射在配置字体族后才会生效。所有写入复制普通数据并原子替换，不保留调用方的可变对象引用。不自动读写本地存储、不注册系统主题或语言监听。

运行时内部复用未修改的只读分支，语言包深合并仅创建变化的路径。规范化后未改变值的普通字段补丁、空补丁不会发布新的配置对象；输入仍经过校验，写操作仍返回可独立修改的完整快照，因此返回快照仍有与配置体积相关的复制成本。不要依赖每次更新都会得到新的 useConfig().value 引用。

字号、主题与图标读取通过独立的 computed 依赖相关配置，无关请求参数修改不会使组件重新计算文字样式。色阶在实例内保留最多 32 组种子色/模式组合；语言查询缓存候选语言、包索引和最多 256 个拆分路径，语言包修改后索引自动更新，不缓存带业务参数的最终文案。

## 获取字体大小

`getFontSize(baseSize)` 返回数值，单位按逻辑像素 px 使用：`Math.max(1, baseSize + typographyOffset)`。基础字号必须是大于零的有限数字，允许小数；计算溢出会抛错。不转换 rpx，不自动修改组件样式。偏移量本身没有范围限制，只有最终字号最低为 1px。

```javascript
import { computed } from 'vue'
import { getFontSize, getThemeColor, updateConfig } from '@/uni_modules/ucs-design-ui/index.js'

updateConfig({ typographyOffset: 2 })
getFontSize(14) // 16
const textStyle = computed(() => ({
  fontSize: `${getFontSize(14)}px`,
  color: getThemeColor('gray-12')
}))
```

放在 computed 或模板中读取才能随偏移量、明暗模式变化；普通调用得到当时的数值或颜色字符串。

## 字体图标名称映射

`getIconDefinition(name)` 返回独立的 `{ fontFamily, glyph }` 对象。映射沿用参考工程 common/icon-font.js 中的 316 个内置名称，默认字体族 UcsDesignIcons。

- 配置 iconFontFamily 且 icons[name] 命中：返回项目字体族与字形。
- 未命中或未配置项目字体族：返回内置字体族及对应字形。
- 名称未知、空值或不安全字段：返回内置字体族及空字符串，不生成占位图标。

```javascript
import { computed } from 'vue'
import { getIconDefinition, getFontSize, getThemeColor } from '@/uni_modules/ucs-design-ui/index.js'

const icon = computed(() => getIconDefinition('home'))
const iconStyle = computed(() => ({
  fontFamily: icon.value.fontFamily,
  fontSize: `${getFontSize(24)}px`,
  color: getThemeColor('primary-6')
}))
// 模板：<text :style="iconStyle">{{ icon.glyph }}</text>
```

框架不包含或加载字体文件。内置私有编码需要宿主或 UI 模块提供与映射匹配的 UcsDesignIcons 字体并按目标平台注册；只有映射不能保证显示真实图形。首页启动配置使用 sans-serif 和 home/star 两个系统字符覆盖，演示自定义映射；checkmark 保留内置字体映射，用于刷新完成反馈。内置图标由 ucs-icon 提供的 UcsDesignIcons 字体渲染。字体图标使用 getFontSize，图片图标使用 getIconSize。

## 图片图标的比例计算

`getIconSize(baseSize, baseFontSize?)` 返回 px 数值。不填第二个参数（或传 undefined）时返回图标原尺寸，不跟随偏移；填写时按配套文字比例缩放：`baseSize * (getFontSize(baseFontSize) / baseFontSize)`。第二个参数是文字的基础字号，不是偏移后的字号。图标基础尺寸及显式提供的文字基础字号均须为大于零的有限数字，null 不视为省略；非有限或下溢为零的计算结果会抛错。

```javascript
import { computed } from 'vue'
import { getIconSize, updateConfig } from '@/uni_modules/ucs-design-ui/index.js'

updateConfig({ typographyOffset: 2 })
getIconSize(24) // 24，不提供文字基准，保持原尺寸
const iconStyle = computed(() => ({
  width: `${getIconSize(24, 14)}px`,  // 约 27.43
  height: `${getIconSize(16, 14)}px`  // 约 18.29，宽高比例仍为 24:16
}))
```

宽高必须使用同一个文字基础字号，不分别叠加偏移，也不分别限制为 1px，才能保持比例。最低文字字号仍由 getFontSize 保证为 1px。字体图标继续使用 getFontSize；图片图标由页面将计算结果绑定到 image 宽高。本工具不读取图片文件或推断原始尺寸。

## 默认请求配置

```javascript
import { initializeConfig, getRequestConfig, http } from '@/uni_modules/ucs-design-ui/index.js'
import { create } from '@/uni_modules/ucs-design-ui/plugin/ucs-request/index.js'

initializeConfig({ request: {
  env: 'auto',
  developmentBaseURL: 'https://dev-api.example.com',
  productionBaseURL: 'https://api.example.com',
  timeout: 15000,
  headers: { 'X-App': 'demo' }
} })

// 应用请求实例：每次请求开始时读取最新应用配置。
await http.get('/users')
// 复用解析后的独立快照：{ baseURL, timeout, headers }，不包含环境选择字段。
const otherHttp = create({ ...getRequestConfig(), timeout: 30000 })
```

request 按提供的字段更新；显式 headers 整项替换，{} 清空，键统一转小写。timeout 必须为大于零的有限毫秒数。请求头值仅支持字符串、有限数字或布尔值。Token 和拦截器通过业务实例设置，不放入这份配置。初始化仍从默认值重建所有配置，运行中请用 updateConfig。

| 平台 | auto 判断来源 | 映射 |
| --- | --- | --- |
| 微信、支付宝、QQ、快手、小红书 | getAccountInfoSync().miniProgram.envVersion | develop/trial → development；release → production；支付宝 gray → production |
| 抖音 | getEnvInfoSync().microapp.envType | development/preview → development；production → production |
| 京东及其他平台 | process.env.NODE_ENV | development / production |

显式 env development/production 优先，不调用平台 API。平台 API 不存在、抛错或返回未知版本时回退构建环境；京东不尝试读取 envVersion。构建环境也无法识别时明确报错，需显式配置 env，不默认为某个服务器。平台调用以条件编译隔离，支持范围仍取决于 uni-app/uni-app-x 目标平台本身。

这些是服务器选择规则：体验版/预览版默认连接开发服务；需要连接生产时显式设置 env production。京东只能依据构建方式自动选址，无法区分同一个包的体验/正式状态。

选中环境的地址为空时，getRequestConfig 抛 TypeError，应用 http 请求拒绝为 ERR_BAD_CONFIG；不会改用另一环境地址。允许 Web 相对前缀（如 /api），是否适合当前平台由宿主决定。main.js 当前地址留空，需填入真实地址后再调用应用 http，示例不会向虚构服务器发送请求。

应用 http 的优先级为库/实例默认配置 → 应用默认请求配置 → 本次请求配置。配置在请求拦截器之前捕获；之后修改不影响该请求。可通过 http.interceptors 注册异步拦截器。http.create(options) 也创建当前配置的独立快照实例；后续更新不影响它。plugin/ucs-request 的默认导出和 create() 始终独立，不自动读取应用配置。应用 http.defaults 中与应用配置重名的字段会被应用配置覆盖；建议用 updateConfig({ request: ... }) 修改应用默认值。

默认请求配置解析失败时，请求以 ERR_BAD_CONFIG 进入响应错误拦截器，支持统一记录、提示和恢复；不会执行请求拦截器或发起网络请求。

当前公共配置与应用 http 使用模块级单例，面向单客户端应用。多用户 SSR 不能直接共用该单例；内部 createConfigStore 并不构成完整的 SSR 隔离接入方案。

## 本地测试

公共 API 操作同一份应用配置。初始化和更新时自动校验，无需额外调用校验方法。

真实 Vue 响应式测试（Vue 可由项目依赖解析，或用末尾参数指定宿主 Vue 包的绝对路径）：

```shell
node --experimental-vm-modules uni_modules/ucs-design-ui/tests/config.cjs
node uni_modules/ucs-design-ui/tests/imports.cjs
```

配置测试同时覆盖固定色阶回归样本与主题集成；固定样本用于检测当前算法行为变化，不证明与某个上游版本完全等价。导入检查覆盖应用入口、页面和核心源码的本地路径，以及颜色依赖生成脚本的目标目录。

HBuilderX 实际编译与各端真机行为需另行验证；类型声明位于插件根目录 [index.d.ts](../index.d.ts)。内置依赖的版本记录和维护说明见 [plugin/README.md](../plugin/README.md)。

## 灰阶

内置 core/gray.js 使用指定的两组固定 12 阶颜色，不通过 Arco 生成。gray 不属于 themeColors，不能通过 setThemeColor 修改；仅随 themeMode 切换。亮色从白到深色，暗色从深色到白。gray 没有种子色或 base 字段。

```javascript
const theme = useThemeColors()
const pageStyle = computed(() => ({
  backgroundColor: theme.value['gray-1'],
  color: theme.value['gray-12']
}))
const borderColor = getThemeColor('gray-4')
```

使用完整键名，例如 getThemeColor('gray-6')。useThemeColors().value['gray-6'] 读取只读响应式色彩表。内部色表包括 gray-1～gray-12、primary-1～primary-10 等。未命中的字符串直接作为外部颜色返回，因此 gray-13 等拼写或范围错误也不会再抛错，是否为可用颜色由目标平台判断。

getThemeColor('gray-12') 在明暗模式下均解析当前色表的 gray-12。getThemeColor(['gray-12', '#FFFFFF']) 和 getThemeColor('gray-12', '#FFFFFF') 均在亮色模式解析 gray-12，暗色模式返回 #FFFFFF。

数组须包含一到两项，省略暗色项或将其设为 null/undefined 时复用亮色项；数组形式不能再传第二个参数。双参数形式省略第二项或传 undefined 时复用亮色，显式 null 不接受。解析前会校验亮暗两项均为非空字符串，并去除两端空白，包括当前模式未选中的项；空数组、多余数组项和非字符串会抛 TypeError。所有外部颜色由目标平台解释，core 不做 CSS 合法性判断或特殊关键字转换。

第二个参数是暗色模式使用的颜色，不是阶数。不支持旧的 name + shade 调用和嵌套色板结构。需要响应主题模式或种子色变化时，在 computed 或模板中调用。

### 颜色 CSS 变量

`useThemeColorCssVars()` 返回 `ComputedRef<ThemeColorCssVars>`。每个 store 共享同一份只读映射，键为 `--ucs-${ThemeColorKey}`，值直接来自当前色阶表：五个彩色色系各 10 阶、灰色 12 阶，以及 primary/secondary/success/warning/danger 五项第 6 阶别名，共 67 项；无编号变量随明暗模式改变，与对应的 -6 变量保持相同，secondary 缺省时沿用 primary。不提供无编号 gray。明暗模式和色彩种子变化时更新；不输出其他设计令牌，不调整 core 颜色。

```vue
<script setup>
import { useThemeColorCssVars } from '@/uni_modules/ucs-design-ui/index.js'
const cssVars = useThemeColorCssVars()
</script>
<template>
  <view :style="cssVars"><slot /></view>
</template>
<style>
.custom-panel { background-color: var(--ucs-gray-2); }
</style>
```

映射本身不会操作 DOM 或自动注入全局样式。ucs-page 已默认绑定，无需再次注入；其他容器可自行绑定。不要修改返回对象；主题变更继续使用 setThemeMode/setThemeColor/updateThemeColors。
