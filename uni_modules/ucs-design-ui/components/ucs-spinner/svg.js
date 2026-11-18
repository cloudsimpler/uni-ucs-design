import { toBase64, escapeSvgAttribute } from '../../internal/svg.js'

// Bounded module-level LRU: equal colors share SVG encoding across component instances.
const sources = new Map()

/**
 * 获取已解析颜色对应的 Base64 SVG，同色组件复用编码结果。
 * 模块级 LRU 最多保留 64 个颜色，不随外部颜色数量无限增长。
 * @param {string} resolvedColor core 解析后的颜色。
 * @returns {string} SVG Data URL。
 */
export function getSpinnerSource(resolvedColor) {
  const cached = sources.get(resolvedColor)
  if (cached !== undefined) {
    sources.delete(resolvedColor)
    sources.set(resolvedColor, cached)
    return cached
  }
  const color = escapeSvgAttribute(resolvedColor)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
<defs>
<linearGradient id="tail" x1="94.0869141%" y1="0%" x2="94.0869141%" y2="90.559082%"><stop stop-color="${color}" stop-opacity="0" offset="0%"/><stop stop-color="${color}" stop-opacity="0.3" offset="100%"/></linearGradient>
<linearGradient id="head" x1="100%" y1="8.67370605%" x2="100%" y2="90.6286621%"><stop stop-color="${color}" offset="0%"/><stop stop-color="${color}" stop-opacity="0.3" offset="100%"/></linearGradient>
</defs>
<g opacity="0.9">
<path d="M40 0 A40 40 0 0 1 40 80 L40 73 A33 33 0 0 0 40 7 Z" fill="url(#tail)"/>
<path d="M40 0 L40 7 A33 33 0 0 0 40 73 L40 80 A40 40 0 0 1 40 0 Z" fill="url(#head)"/>
<circle cx="40" cy="3.5" r="3.5" fill="${color}"/>
</g></svg>`
  const src = 'data:image/svg+xml;base64,' + toBase64(svg)
  sources.set(resolvedColor, src)
  if (sources.size > 64) sources.delete(sources.keys().next().value)
  return src
}
