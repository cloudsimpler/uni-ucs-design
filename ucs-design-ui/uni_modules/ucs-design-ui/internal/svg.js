/**
 * 编码为 UTF-8 Base64，不依赖原生端可能缺少的 btoa、Buffer 或 TextEncoder。
 * @param {string} value SVG 文本。
 * @returns {string} Base64 字符串。
 */
export function toBase64(value) {
  const bytes = encodeURIComponent(value).replace(/%([0-9A-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let result = ''
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes.charCodeAt(index)
    const second = index + 1 < bytes.length ? bytes.charCodeAt(index + 1) : 0
    const third = index + 2 < bytes.length ? bytes.charCodeAt(index + 2) : 0
    result += alphabet[first >> 2] + alphabet[((first & 3) << 4) | (second >> 4)]
    result += index + 1 < bytes.length ? alphabet[((second & 15) << 2) | (third >> 6)] : '='
    result += index + 2 < bytes.length ? alphabet[third & 63] : '='
  }
  return result
}

/**
 * 转义 SVG XML 属性值，避免颜色中的特殊字符破坏文档结构。
 * @param {string} value 属性原始值。
 * @returns {string} 转义后的属性值。
 */
export function escapeSvgAttribute(value) {
  const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }
  return value.replace(/[&<>"']/g, character => entities[character])
}

