# 内置依赖维护记录

| 目录 | 角色 | 当前可确认的信息 |
| --- | --- | --- |
| ucs-request | 自研客户端请求库 | ESM；依赖宿主 uni API；行为由同目录测试覆盖 |
| ucs-pages-json | 自研构建工具 | CommonJS，Node 18+；package.json 声明 @babel/parser 7.29.0 |
| arco-design-color | 内置色阶算法 | 未记录算法的准确上游版本；当前输出有固定回归样本 |
| async-validator | 内置 Schema 校验实现 | 当前副本未记录准确上游版本，尚未接入 core 配置校验 |

不能从现有文件可靠确认的版本不作推测；升级或发布这些副本前应补齐来源、版本及对应授权文件。当前记录不是上游等价性或完整兼容性声明。

arco-design-color/vendor 的文件头记录了以下转换来源：

| 依赖 | 版本 |
| --- | --- |
| color | 3.2.1 |
| color-string | 1.9.1 |
| color-convert | 1.9.3 |
| color-name | 1.1.3 |
| simple-swizzle | 0.2.4 |
| is-arrayish | 0.3.4 |

这些副本由项目 scripts/vendor-color-esm.cjs 转换为本地 ESM，对应授权文本保存在 arco-design-color/vendor/LICENSES.txt。重新生成前需在宿主提供兼容版本的源依赖，生成后检查版本变化并运行配置测试。

维护约定：运行时基础能力从 core 公共入口使用；构建插件单独引入，不能导入客户端运行时代码。升级内置依赖时保留来源信息、授权文件和回归基准，并另外完成目标平台的编译或运行验证。
