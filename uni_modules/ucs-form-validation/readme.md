<p align="center"><img alt="logo" src="https://ucs.cloudsimpler.com/logo/form-validation.svg" width="123"></p>
<h3 align="center">Validation 表单验证</h3>

## 简述
一个专为 uni-app/uni-app-x 设计的轻量级表单验证插件，支持多种常见验证规则和自定义验证器，帮助开发者快速实现表单数据校验功能。

- **全面的验证规则**：内置20+种常用验证规则，满足大部分表单验证需求
- **自定义验证器**：支持通过 `validator` 函数自定义复杂验证逻辑
- **类型安全**：完整的UTS类型定义，提供良好的开发体验
- **轻量级**：代码简洁，无额外依赖，不影响项目性能
- **易用性强**：API设计简洁明了，学习成本低

## 官方文档
官网地址：[https://ucs.cloudsimpler.com/library/ucs-form-validation](https://ucs.cloudsimpler.com/library/ucs-form-validation)

## 源码
[![stars](https://img.shields.io/github/stars/cloudsimpler/uni-ucs-design?style=social)](https://github.com/cloudsimpler/uni-ucs-design)
[![forks](https://img.shields.io/github/forks/cloudsimpler/uni-ucs-design?style=social)](https://github.com/cloudsimpler/uni-ucs-design)
[![watchers](https://img.shields.io/github/watchers/cloudsimpler/uni-ucs-design?style=social)](https://github.com/cloudsimpler/uni-ucs-design)
[![license](https://img.shields.io/github/license/cloudsimpler/uni-ucs-design?style=social)](https://github.com/cloudsimpler/uni-ucs-design)
[![star](https://gitee.com/cloudsimpler/uni-ucs-design/badge/star.svg?theme=white)](https://gitee.com/cloudsimpler/uni-ucs-design)
[![fork](https://gitee.com/cloudsimpler/uni-ucs-design/badge/fork.svg?theme=white)](https://gitee.com/cloudsimpler/uni-ucs-design)

## 版权信息
- 遵循  [MIT](https://baike.baidu.com/item/MIT%E8%AE%B8%E5%8F%AF%E8%AF%81/6671281?fromtitle=MIT&fromid=10772952)  开源协议，无需支付任何费用，也无需授权。
- 仅供学习交流，如作它用所承受的法律责任一概与作者无关。

## 致谢
首先感谢 [DCloud](https://www.dcloud.io/) 官方，旗下出品的 [uni-app](https://uniapp.dcloud.net.cn/) 、[uni-app-x](https://uniapp.dcloud.net.cn/uni-app-x/) 、[uniCloud](https://uniapp.dcloud.net.cn/uniCloud/)、[uni-app 小程序](https://nativesupport.dcloud.net.cn/README) 等多平台、多元化的技术体系。  
其次感谢 [DCloud 插件市场](https://ext.dcloud.net.cn/) 开源作品的作者们，"捧着一颗心来，不带半棵草去。" 的开源奉献精神致敬。

# 使用文档
一个专为 uni-app/uni-app-x 设计的轻量级表单验证插件，支持多种常见验证规则和自定义验证器，帮助开发者快速实现表单数据校验功能。
## 支持的验证规则

| 规则名称 | 类型 | 说明 |
|---------|------|-----|
| required | Boolean | 必填项验证 |
| number | Boolean | 数值验证 |
| integer | Boolean | 整数验证 |
| float | Boolean | 浮点数验证 |
| chn | Boolean | 中文验证 |
| chnNum | Boolean | 同时包含数字和汉字 |
| chnOrNum | Boolean | 包含汉字或者数字 |
| alphaLine | Boolean | 英文和下划线，首尾不能是下划线、且不能只是下划线 |
| landline | Boolean | 固定电话号验证 |
| mobile | Boolean | 手机号验证 |
| alphaNum | Boolean | 字母和数字 |
| zipCode | Boolean | 邮政编码验证 |
| email | Boolean | 电子邮箱验证 |
| idCard | Boolean | 身份证验证 |
| regExp | UTSRegExp | 自定义正则表达式验证 |
| min | Number | 最小长度验证 |
| max | Number | 最大长度验证 |
| length | Number[] | 长度范围验证，如 [6, 20] |
| notbetween | Number[] | 不在范围之间，如 [6, 20] |
| in | String[] | 数据在指定数组内 |
| notIn | String[] | 数据不在指定数组内 |
| gt | Number | 大于某值 |
| egt | Number | 大于或等于某值 |
| elt | Number | 小于或等于某值 |
| lt | Number | 小于某值 |
| eq | Number | 等于某值 |
| notEq | Number | 不等于某值 |
| validator | Function | 自定义验证函数 |

## 使用方法

### 1. 引入插件

```typescript
import { validation, ValidationResultType } from '@/uni_modules/ucs-form-validation/index.uts'
```

### 2. 定义表单数据和验证规则

```typescript
// 表单数据
const formData = {
  username: 'admin',
  mobile: '13800138000',
  email: 'test@example.com',
  age: '18'
}

// 验证规则
const rules = {
  username: [
    { required: true, message: '用户名不能为空' },
    { min: 3, message: '用户名长度不能小于3' },
    { max: 20, message: '用户名长度不能大于20' }
  ],
  mobile: [
    { required: true, message: '手机号不能为空' },
    { mobile: true, message: '手机号格式不正确' }
  ],
  email: [
    { required: true, message: '邮箱不能为空' },
    { email: true, message: '邮箱格式不正确' }
  ],
  age: [
    { required: true, message: '年龄不能为空' },
    { integer: true, message: '年龄必须是整数' },
    { egt: 18, message: '年龄必须大于等于18岁' }
  ]
}
```

### 3. 执行验证

```typescript
// 执行验证
const result: ValidationResultType = validation(formData, rules)

if (result.result) {
  console.log('验证通过')
} else {
  console.log('验证失败:', result.error)
  console.log('详细错误:', result.detail)
}
```

## 自定义验证器

插件支持通过 `validator` 属性定义自定义验证函数：

```typescript
const rules = {
  username: [
    {
      validator: (value: any): boolean => {
        // 自定义验证逻辑
        const str = value as string
        // 用户名只能包含字母、数字和下划线
        return /^[a-zA-Z0-9_]+$/.test(str)
      }, 
      message: '用户名只能包含字母、数字和下划线' 
    }
  ]
}
```

## API 说明

### validation(formData, rules)

完整表单验证函数

**参数:**
- `formData`: 表单数据对象
- `rules`: 验证规则对象

**返回值:**
```typescript
type ValidationResultType = {
  result : boolean;    // 验证结果，true表示通过
  error : string[];    // 错误消息数组
  detail : UTSJSONObject; // 详细错误信息，按字段分组
};
```

**使用示例:**
```typescript
import { validation, ValidationResultType } from '@/uni_modules/ucs-form-validation/index.uts'

// 表单数据
const formData = {
  username: 'admin',
  mobile: '13800138000',
  email: 'test@example.com',
  age: '18'
}

// 验证规则
const rules = {
  username: [
    { required: true, message: '用户名不能为空' },
    { min: 3, message: '用户名长度不能小于3' },
    { max: 20, message: '用户名长度不能大于20' }
  ],
  mobile: [
    { required: true, message: '手机号不能为空' },
    { mobile: true, message: '手机号格式不正确' }
  ],
  email: [
    { required: true, message: '邮箱不能为空' },
    { email: true, message: '邮箱格式不正确' }
  ],
  age: [
    { required: true, message: '年龄不能为空' },
    { integer: true, message: '年龄必须是整数' },
    { egt: 18, message: '年龄必须大于等于18岁' }
  ]
}

// 执行验证
const result: ValidationResultType = validation(formData, rules)

if (result.result) {
  console.log('验证通过')
} else {
  console.log('验证失败:', result.error)
  console.log('详细错误:', result.detail)
}
```

### validationSingle(value, rule)

单字段验证函数

**参数:**
- `value`: 需要验证的值
- `rule`: 验证规则数组

**返回值:**
```typescript
type ValidationSingleResultType = {
  result : boolean;  // 验证结果
  error : string[];  // 错误消息数组
};
```

**使用示例:**
```typescript
import { validationSingle, ValidationSingleResultType } from '@/uni_modules/ucs-form-validation/index.uts'

// 验证单个字段
const username = 'admin';
const usernameRules = [
  { required: true, message: '用户名不能为空' },
  { min: 3, message: '用户名长度不能小于3' },
  { max: 20, message: '用户名长度不能大于20' }
];

const result: ValidationSingleResultType = validationSingle(username, usernameRules);

if (result.result) {
  console.log('用户名验证通过');
} else {
  console.log('用户名验证失败:', result.error);
}
```

## 注意事项
1. 所有验证规则都支持 `message` 属性来自定义错误提示信息
2. 验证规则可以组合使用，按照数组顺序依次验证
3. 自定义验证器函数接收原始值作为参数，需返回布尔值表示验证结果