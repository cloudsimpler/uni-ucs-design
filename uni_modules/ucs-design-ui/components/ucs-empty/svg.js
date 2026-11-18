import { createEmptySvg, normalizeEmptyType } from './builder.js'
import { toBase64 } from '../../internal/svg.js'

const sources = new Map()

/**
 * 按插画类型及 core 已解析颜色共享编码结果；尺寸不影响 SVG。
 * @param {string} type 插画类型。
 * @param {...string} colors builder 使用的七项已解析颜色。
 * @returns {string} UTF-8 Base64 SVG Data URL；LRU 最多保留 32 项。
 */
export function getEmptySource(type, ...colors) {
  const normalized = normalizeEmptyType(type)
  const key = JSON.stringify([normalized, ...colors])
  if (sources.has(key)) {
    const source = sources.get(key)
    sources.delete(key)
    sources.set(key, source)
    return source
  }
  const source = 'data:image/svg+xml;base64,' + toBase64(createEmptySvg(normalized, ...colors))
  sources.set(key, source)
  if (sources.size > 32) sources.delete(sources.keys().next().value)
  return source
}
