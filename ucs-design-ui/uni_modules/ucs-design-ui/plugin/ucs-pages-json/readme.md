# ucs-pages-json

将声明式 JS 页面配置合成为 pages.json，**保留条件编译指令和全部分支**。
插件不执行配置、不选择平台；`#ifdef` 等指令留给 uni 编译器处理。

目录与包名均为 `ucs-pages-json`，插件工厂为 `ucsPagesJson`，Vite 标识为 `ucs:pages-json`。

## 接入

要求 Node.js 18+。插件运行依赖仅为 `@babel/parser`，在本目录执行 `npm install`，
或由宿主项目提供该依赖。Vite 和 uni 编译器由宿主提供。
配置输入统一使用 `.js`，与应用源码的语言和项目类型无关。
Vite 项目可直接接入插件；webpack 项目需要单独调用 `generatePages()`，不能直接注册 Vite 插件。

根目录 `vite.config.js`：

```js
import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';
import ucsPagesJson from './uni_modules/ucs-design-ui/plugin/ucs-pages-json/index.js';

export default defineConfig(async () => {
  await ucsPagesJson.generatePages();
  return { plugins: [ucsPagesJson(), uni()] };
});
```

先生成，再调用 `uni()`，避免 uni 插件初始化时读取旧配置。
`config` 钩子也执行生成；`buildStart`、`watchChange` 和 `configureServer` 监听入口及静态依赖。
配置不必导入应用模块，也不依赖应用的 `transform` 才生成。
内容不变不写盘；生成失败保留旧文件并报错；成功时用同目录临时文件替换输出。
输入、输出不能指向同一文件；检查覆盖 Windows 大小写路径别名、真实路径别名和硬链接，并在写入前再次确认。

## 输入与输出

`pages.config.js`：

```js
export default {
  pages: [
    // #ifdef H5
    { path: 'pages/index/index' },
    // #endif
    { path: 'pages/common/index' },
  ],
};
```

生成的 `pages.json`：

```jsonc
{
  "pages": [
    // #ifdef H5
    {
      "path": "pages/index/index"
    }
    // #endif
    // #ifdef (H5)
    ,
    // #endif
    {
      "path": "pages/common/index"
    }
  ]
}
```

这是 uni 可解析的带条件编译注释的 JSON 配置，不能不处理注释就直接 `JSON.parse`。
相邻且条件相同的内容会合并为一个条件块，组内使用普通逗号；嵌套块保留共同的外层条件。
不会跨过公共内容或其他条件的内容重新排序、合并页面。
条件组之间使用必要的前置逗号保护：只有更早的属性或元素保留时才保留分隔符，
当前条件已保证前面的内容存在时，不再重复生成逗号条件块。
确保 uni 删除首项、中间项、末项或全部条件项后仍能解析，不依赖宽松解析器接受尾逗号。
互斥分支中的同名属性原样保留，不会提前合并或覆盖。

## 拆分路由文件

```js
// routes/demo.js
export default [
  // #ifdef H5
  { path: 'pages/demo/web' },
  // #endif
  { path: 'pages/demo/common' },
];
```

```js
// routes/user.js
export const userPages = [
  { path: 'pages/user/index' },
];
```

```js
// pages.config.js
import demoPages from './routes/demo.js';
import { userPages } from '@/routes/user.js';

const home = { path: 'pages/index/index' };
const pages = [
  home,
  ...demoPages,
  // #ifdef APP
  ...userPages,
  // #endif
];

export default { pages };
```

合并按展开位置拼接，不排序、不去重。子文件中的条件指令会一起展开；
展开项外的条件继续包围这些内容，内部条件保持嵌套关系。
也可以使用 `pages: demoPages`，或通过常量/导入引用一个静态对象作为页面样式。

支持默认导出、具名导出、别名、`export { localName as name }` 和
`export { name as default } from './module.js'`。不支持 `export *`。
引用路径支持 `./`、`../` 和以项目源码根目录为基准的 `@/`；可以省略扩展名，
先查找同名 `.js`，然后查找目录内的 `index.js`。
入口和依赖均只接受 `.js` 文件，使用静态 ESM 声明格式，不支持 `module.exports`。

多层依赖修改会重新生成；缺失文件创建、依赖删除后恢复也会重新尝试。
循环模块引用、循环常量引用、未定义变量、缺少导出、数组展开非数组均会报错并保留旧输出。
所有静态 import 的文件都必须存在，即使其路由只在某个条件分支中使用。
不要用条件注释包围 import/const 声明，应把条件写在数组或对象内部。

## 支持范围

- 默认导出静态对象（可引用 const 或导入值），顶层须有 `pages` 数组。
- 静态 import、const 引用、对象属性简写，以及数组 `...展开`；不会执行模块。
- 对象、数组、字符串、有限数字、布尔值、null；属性名转换为双引号字符串。
- 独占一行的 `// #ifdef`、`// #ifndef`、`// #endif`，以及单行块注释形式（输出为 `//`）。
- 嵌套条件、`!`、`&&`、`||`、括号及自定义条件名；只检查表达式语法，不判断真假。
- 条件必须位于对象或数组内，包围完整的属性或数组元素，并在同一容器内闭合。
- 字符串内的指令文字保持字符串内容；普通说明注释不输出。

不支持 let/var、解构声明、赋值或数组修改、动态 import/require、npm 包导入、命名空间导入、
副作用 import、对象展开、计算属性、函数、异步配置、调用表达式（包括 map/filter）、
模板字符串、稀疏数组或任意运行时代码。遇到这些写法会带文件位置报错。
const 必须是静态数据或引用，即使未使用的 const 也会校验。
不支持 UTS/TS 文件或类型语法，不执行 uni.* 或原生 API。
不支持 `#else`、`#elif`、版本比较表达式，以及仅包围属性值或跨容器的条件区域。

所有分支都保留，所以插件不在生成时检查平台专用页面是否存在、互斥分支是否重复、
某平台 pages 是否为空或 tabBar 引用是否有效。这些路由及平台语义校验交给 uni 编译器。

## 参数

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `root` | `UNI_INPUT_DIR`，其次 Vite root / 当前目录 | 源码根目录 |
| `input` | `pages.config.js` | 相对于 root 的 .js 配置入口 |
| `output` | `pages.json` | 相对于 root 的输出 |

插件不读取项目类型、构建平台或条件宏环境变量，也不向配置注入构建环境。
uni-app x 与使用 Vite 的 uni-app Vue3 共用相同接入代码。切换平台不会改变生成文本。

请修改 `pages.config.js`，保留生成的 `pages.json` 给 HBuilderX 和 uni 使用。
直接修改 pages.json（包括 HBuilderX 自动追加页面）会在下一次生成时被配置源覆盖。
不要在应用运行时代码中导入插件。

也可单独转换源码而不写文件：

```js
const { convertPagesConfig } = require('./uni_modules/ucs-design-ui/plugin/ucs-pages-json');
const jsonc = convertPagesConfig('export default { pages: [] };');
```

`convertPagesConfig(source, filename?, options?)` 返回生成的 JSONC 字符串；`filename` 默认为 `pages.config.js`，可通过 `options.root` 指定静态导入使用的源码根目录。转换过程不写入文件。

## 测试

运行渲染回归测试（由本目录或宿主提供 `@babel/parser`）：

```shell
node uni_modules/ucs-design-ui/plugin/ucs-pages-json/tests/render.cjs
node uni_modules/ucs-design-ui/plugin/ucs-pages-json/tests/files.cjs
```

覆盖相邻同条件块合并、嵌套条件、公共内容边界、互斥同名属性，以及数组和对象在不同宏组合下的严格 JSON 解析。
文件测试在独立临时目录运行，覆盖多文件导入、内容未变不写盘、失败保留输出、同文件保护、传递依赖监听、缺失文件恢复和监听清理。

历史测试使用 `jsonc-parser` 验证分支筛选后的语法，
覆盖指令保留、嵌套、互斥同名属性、逗号、仅 JS 输入限制、环境无关性、失败保护及监听恢复。
同时覆盖多文件默认/具名导入、转导出、数组展开、重复引用、循环检测及缺失依赖恢复。

2026-09-09 已通过本机 DCloud 编译器的 `parseJson(..., true)` 验证：同一份生成文本
在 H5、微信小程序、App Android 条件下选择正确分支，尾逗号和互斥同名属性均可解析。
这是配置解析验证，不代表小程序或 App 原生完整构建已执行。
